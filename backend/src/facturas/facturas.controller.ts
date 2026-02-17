import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../database/db';
import { Factura, ItemFactura, Empresa, Cliente } from '../types';
import { FinanceUtils } from '../utils/finance';
import fs from 'fs';
import path from 'path';

export const FacturasController = {
    async list(req: any, res: Response) {
        try {
            const { q, estado, categoria, clienteNombre, from, to, page = 1, tipo } = req.query;
            const empresaId = req.user.empresaId;

            if (!empresaId && req.user.rol !== 'super_admin') {
                return res.status(400).json({ message: 'Se requiere estar asociado a una empresa' });
            }

            const limit = 50;
            const offset = (Number(page) - 1) * limit;

            // Construir el objeto WHERE para Prisma
            const where: any = {};

            if (req.user.rol !== 'super_admin') {
                where.empresaId = empresaId;
            }

            if (tipo) {
                where.tipo = tipo as string;
            }

            if (estado) {
                where.estado = estado as string;
            }

            if (categoria) {
                where.categoria = categoria as string;
            }

            if (from || to) {
                where.fechaEmision = {};
                if (from) where.fechaEmision.gte = new Date(from as string);
                if (to) where.fechaEmision.lte = new Date(to as string);
            }

            // Búsqueda por número o cliente (usando include)
            if (q || clienteNombre) {
                where.OR = [];
                if (q) {
                    where.OR.push({ numero: { contains: q as string, mode: 'insensitive' } });
                }

                if (clienteNombre) {
                    where.cliente = { nombre: { contains: clienteNombre as string, mode: 'insensitive' } };
                } else if (q) {
                    where.OR.push({ cliente: { nombre: { contains: q as string, mode: 'insensitive' } } });
                }
            }

            // Ejecutar consulta con filtros, orden y paginación
            const [total, facturas] = await Promise.all([
                prisma.factura.count({ where }),
                prisma.factura.findMany({
                    where,
                    skip: offset,
                    take: limit,
                    include: {
                        cliente: {
                            select: { nombre: true }
                        }
                    },
                    orderBy: {
                        fechaEmision: 'desc'
                    }
                })
            ]);

            // Mapear para mantener compatibilidad con el frontend (clienteNombre)
            const data = facturas.map(f => ({
                ...f,
                clienteNombre: f.cliente?.nombre || 'Cliente Desconocido'
            }));

            res.json({
                data,
                total,
                totalPages: Math.ceil(total / limit),
                page: Number(page),
                pageSize: limit
            });
        } catch (error) {
            console.error('Error in facturas.list:', error);
            res.status(500).json({ message: 'Error en el servidor', error: (error as any).message });
        }
    },

    async create(req: any, res: Response) {
        try {
            const { clienteId, items, metodosPago, serie, notas, moneda, fechaEmision, fechaVencimiento, tipo } = req.body;
            const empresaId = req.user.empresaId;

            if (!empresaId) return res.status(400).json({ message: 'Usuario sin empresa' });

            // Transacción para asegurar que el folio se incremente correctamente
            const result = await prisma.$transaction(async (tx) => {
                const empresa = await tx.empresa.findUnique({
                    where: { id: empresaId }
                });

                if (!empresa) throw new Error('Empresa no encontrada');

                const configuracion = (empresa.configuracion as any) || {
                    numeracionActual: 0,
                    monedaDefault: 'EUR',
                    impuestoDefault: 21,
                    prefijoFactura: 'F'
                };

                const nextFolio = (configuracion.numeracionActual || 0) + 1;
                const totals = FinanceUtils.calculateInvoiceTotals(items);

                const newFactura = await tx.factura.create({
                    data: {
                        id: uuidv4(),
                        empresaId,
                        clienteId,
                        numero: `${configuracion.prefijoFactura}-${nextFolio}`,
                        serie: serie || configuracion.prefijoFactura,
                        folio: nextFolio,
                        fechaEmision: new Date(fechaEmision || Date.now()),
                        fechaVencimiento: new Date(fechaVencimiento || Date.now()),
                        estado: 'pendiente',
                        tipo: tipo || 'ingreso',
                        metodoPago: metodosPago || 'transferencia',
                        subtotal: totals.subtotal,
                        impuestos: totals.impuestos,
                        total: totals.total,
                        moneda: moneda || configuracion.monedaDefault,
                        notas: notas || '',
                        items: totals.items as any,
                    }
                });

                // Actualizar folio en la empresa
                await tx.empresa.update({
                    where: { id: empresaId },
                    data: {
                        configuracion: {
                            ...configuracion,
                            numeracionActual: nextFolio
                        }
                    }
                });

                return newFactura;
            });

            res.status(201).json(result);
        } catch (error) {
            console.error('Error creating invoice:', error);
            res.status(500).json({ message: 'Error en el servidor', error: (error as any).message });
        }
    },

    async getById(req: any, res: Response) {
        try {
            const { id } = req.params;
            const factura = await prisma.factura.findFirst({
                where: {
                    id,
                    ...(req.user.rol !== 'super_admin' ? { empresaId: req.user.empresaId } : {})
                },
                include: {
                    cliente: true,
                    pagos: true
                }
            });

            if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
            res.json(factura);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async update(req: any, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const empresaId = req.user.empresaId;

            const factura = await prisma.factura.findFirst({
                where: {
                    id,
                    ...(req.user.rol !== 'super_admin' ? { empresaId } : {})
                }
            });

            if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });

            // Solo permitimos actualizar ciertos campos para no romper la integridad financiera
            const { clienteId, estado, categoria, notas, moneda, numero } = updateData;

            const updatedFactura = await prisma.factura.update({
                where: { id },
                data: {
                    ...(clienteId && { clienteId }),
                    ...(estado && { estado }),
                    ...(categoria && { categoria }),
                    ...(notas !== undefined && { notas }),
                    ...(moneda && { moneda }),
                    ...(numero && { numero })
                }
            });

            res.json(updatedFactura);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async updateStatus(req: any, res: Response) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            const updated = await prisma.factura.updateMany({
                where: {
                    id,
                    ...(req.user.rol !== 'super_admin' ? { empresaId: req.user.empresaId } : {})
                },
                data: { estado }
            });

            if (updated.count === 0) return res.status(404).json({ message: 'Factura no encontrada' });

            res.json({ id, estado });
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async delete(req: any, res: Response) {
        try {
            const { id } = req.params;
            const empresaId = req.user.empresaId;

            const factura = await prisma.factura.findFirst({
                where: {
                    id,
                    ...(req.user.rol !== 'super_admin' ? { empresaId } : {})
                }
            });

            if (!factura) {
                return res.status(404).json({ message: 'Factura no encontrada o sin permisos' });
            }

            // Eliminar archivo físico si existe
            if (factura.archivoOriginal) {
                const PROCESSED_DIR = path.join(process.cwd(), 'uploads/facturas/procesadas');
                const filePath = path.join(PROCESSED_DIR, factura.archivoOriginal);

                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`🗑️ Archivo eliminado: ${factura.archivoOriginal}`);
                    } catch (err) {
                        console.error(`❌ Error al eliminar el archivo ${filePath}:`, err);
                    }
                }
            }

            // Eliminar de la DB
            await prisma.factura.delete({ where: { id } });

            res.json({ message: 'Factura y archivo físico eliminados correctamente' });
        } catch (error) {
            console.error('Error delete invoice:', error);
            res.status(500).json({ message: 'Error al eliminar factura', error: (error as any).message });
        }
    }
};
