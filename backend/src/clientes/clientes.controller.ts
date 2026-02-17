import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database';
import { Cliente } from '../types';

export const ClientesController = {
    async list(req: any, res: Response) {
        try {
            const { empresaId, search, tipo } = req.query;
            const targetEmpresaId = req.user.rol === 'super_admin' ? empresaId : req.user.empresaId;

            if (!targetEmpresaId) {
                return res.status(400).json({ message: 'Se requiere empresaId' });
            }

            let clientes = await Database.getCollection<Cliente>('clientes');
            clientes = clientes.filter(c => c.empresaId === targetEmpresaId && c.activo !== false);

            if (tipo && (tipo === 'cliente' || tipo === 'proveedor')) {
                clientes = clientes.filter(c => c.tipo === tipo);
            }

            if (search) {
                const searchLower = String(search).toLowerCase();
                clientes = clientes.filter(c =>
                    c.nombre.toLowerCase().includes(searchLower) ||
                    (c.rfc && c.rfc.toLowerCase().includes(searchLower)) ||
                    (c.email && c.email.toLowerCase().includes(searchLower))
                );
            }

            // Sort by name
            clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));

            res.json(clientes);
        } catch (error) {
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

            const newCliente: Cliente = {
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
            };

            await Database.saveToCollection('clientes', newCliente);
            res.status(201).json(newCliente);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getById(req: any, res: Response) {
        try {
            const { id } = req.params;
            const clientes = await Database.getCollection<Cliente>('clientes');
            const cliente = clientes.find(c => c.id === id && (req.user.rol === 'super_admin' || c.empresaId === req.user.empresaId));

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
            const { nombre, rfc, direccion, telefono, email, contacto, notas, tipo } = req.body;

            const clientes = await Database.getCollection<Cliente>('clientes');
            const index = clientes.findIndex(c => c.id === id && (req.user.rol === 'super_admin' || c.empresaId === req.user.empresaId));

            if (index === -1) {
                return res.status(404).json({ message: 'Contacto no encontrado' });
            }

            const updated: Cliente = {
                ...clientes[index],
                nombre: nombre !== undefined ? nombre.trim() : clientes[index].nombre,
                rfc: rfc !== undefined ? rfc : clientes[index].rfc,
                direccion: direccion !== undefined ? direccion : clientes[index].direccion,
                telefono: telefono !== undefined ? telefono : clientes[index].telefono,
                email: email !== undefined ? email : clientes[index].email,
                contacto: contacto !== undefined ? contacto : clientes[index].contacto,
                notas: notas !== undefined ? notas : clientes[index].notas,
                tipo: tipo !== undefined ? tipo : clientes[index].tipo,
            };

            await Database.saveToCollection('clientes', updated);
            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async delete(req: any, res: Response) {
        try {
            const { id } = req.params;
            const clientes = await Database.getCollection<Cliente>('clientes');
            const cliente = clientes.find(c => c.id === id && (req.user.rol === 'super_admin' || c.empresaId === req.user.empresaId));

            if (!cliente) {
                return res.status(404).json({ message: 'Contacto no encontrado' });
            }

            // Soft delete
            await Database.saveToCollection('clientes', { ...cliente, activo: false });
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

            const clientes = await Database.getCollection<Cliente>('clientes');
            const activos = clientes.filter(c => c.empresaId === empresaId && c.activo !== false);

            const total = activos.length;
            // Contacts without tipo default to 'cliente'
            const totalProveedores = activos.filter(c => c.tipo === 'proveedor').length;
            const totalClientes = total - totalProveedores;

            // Get invoice stats
            const facturas = await Database.getCollection<any>('facturas');
            const facturasEmpresa = facturas.filter((f: any) => f.empresaId === empresaId);

            const totalFacturadoClientes = facturasEmpresa
                .filter((f: any) => f.tipo === 'ingreso')
                .reduce((sum: number, f: any) => sum + (f.total || 0), 0);

            const totalGastosProveedores = facturasEmpresa
                .filter((f: any) => f.tipo === 'gasto')
                .reduce((sum: number, f: any) => sum + (f.total || 0), 0);

            res.json({
                total,
                totalClientes,
                totalProveedores,
                totalFacturadoClientes,
                totalGastosProveedores,
            });
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },
};
