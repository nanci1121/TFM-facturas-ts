import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../database/db';
import { Cliente } from '../types';

export const ClientesController = {
    async list(req: any, res: Response) {
        try {
            const { empresaId, search, tipo } = req.query;
            const targetEmpresaId = req.user.rol === 'super_admin' ? empresaId : req.user.empresaId;

            if (!targetEmpresaId) {
                return res.status(400).json({ message: 'Se requiere empresaId' });
            }

            const where: any = {
                empresaId: targetEmpresaId,
                activo: true
            };

            if (tipo && (tipo === 'cliente' || tipo === 'proveedor')) {
                where.tipo = tipo;
            }

            if (search) {
                const searchStr = String(search);
                where.OR = [
                    { nombre: { contains: searchStr, mode: 'insensitive' } },
                    { rfc: { contains: searchStr, mode: 'insensitive' } },
                    { email: { contains: searchStr, mode: 'insensitive' } }
                ];
            }

            const clientes = await prisma.cliente.findMany({
                where,
                orderBy: { nombre: 'asc' }
            });

            res.json(clientes);
        } catch (error) {
            console.error('Error in clientes.list:', error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async create(req: any, res: Response) {
        try {
            const { nombre, rfc, direccion, telefono, email, contacto, notas, tipo } = req.body;
            const empresaId = req.user.empresaId;

            if (!empresaId) {
                return res.status(400).json({ message: 'Usuario no asociado a ninguna empresa' });
            }

            if (!nombre || !nombre.trim()) {
                return res.status(400).json({ message: 'El nombre es obligatorio' });
            }

            const newCliente = await prisma.cliente.create({
                data: {
                    id: uuidv4(),
                    empresaId,
                    nombre: nombre.trim(),
                    rfc: rfc || '',
                    direccion: direccion || '',
                    telefono: telefono || '',
                    email: email || '',
                    contacto: contacto || '',
                    notas: notas || '',
                    tipo: tipo === 'proveedor' ? 'proveedor' : 'cliente',
                    activo: true,
                }
            });

            res.status(201).json(newCliente);
        } catch (error) {
            console.error('Error in clientes.create:', error);
            res.status(500).json({ message: 'Error en el servidor', error: (error as any).message });
        }
    },

    async getById(req: any, res: Response) {
        try {
            const { id } = req.params;
            const cliente = await prisma.cliente.findFirst({
                where: {
                    id,
                    ...(req.user.rol !== 'super_admin' ? { empresaId: req.user.empresaId } : {})
                }
            });

            if (!cliente) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            res.json(cliente);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async update(req: any, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;

            // Primero verificamos existencia y permisos
            const exists = await prisma.cliente.findFirst({
                where: {
                    id,
                    ...(req.user.rol !== 'super_admin' ? { empresaId: req.user.empresaId } : {})
                }
            });

            if (!exists) {
                return res.status(404).json({ message: 'Contacto no encontrado' });
            }

            const updated = await prisma.cliente.update({
                where: { id },
                data: {
                    ...(data.nombre !== undefined && { nombre: data.nombre.trim() }),
                    ...(data.rfc !== undefined && { rfc: data.rfc }),
                    ...(data.direccion !== undefined && { direccion: data.direccion }),
                    ...(data.telefono !== undefined && { telefono: data.telefono }),
                    ...(data.email !== undefined && { email: data.email }),
                    ...(data.contacto !== undefined && { contacto: data.contacto }),
                    ...(data.notas !== undefined && { notas: data.notas }),
                    ...(data.tipo !== undefined && { tipo: data.tipo }),
                }
            });

            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async delete(req: any, res: Response) {
        try {
            const { id } = req.params;

            const updated = await prisma.cliente.updateMany({
                where: {
                    id,
                    ...(req.user.rol !== 'super_admin' ? { empresaId: req.user.empresaId } : {})
                },
                data: { activo: false }
            });

            if (updated.count === 0) {
                return res.status(404).json({ message: 'Contacto no encontrado' });
            }

            res.json({ message: 'Contacto eliminado correctamente' });
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getStats(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            if (!empresaId) {
                return res.status(400).json({ message: 'Se requiere empresaId' });
            }

            // Contactos
            const [totalClientes, totalProveedores] = await Promise.all([
                prisma.cliente.count({ where: { empresaId, tipo: 'cliente', activo: true } }),
                prisma.cliente.count({ where: { empresaId, tipo: 'proveedor', activo: true } })
            ]);

            // Facturación (Ingresos vs Gastos)
            const aggregates = await prisma.factura.groupBy({
                by: ['tipo'],
                where: { empresaId },
                _sum: { total: true }
            });

            const income = aggregates.find(a => a.tipo === 'ingreso');
            const expenses = aggregates.find(a => a.tipo === 'gasto');

            res.json({
                total: totalClientes + totalProveedores,
                totalClientes,
                totalProveedores,
                totalFacturadoClientes: income?._sum?.total || 0,
                totalGastosProveedores: expenses?._sum?.total || 0,
            });
        } catch (error) {
            console.error('Error in getStats:', error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },
};
