import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database';
import { Factura, ItemFactura, Empresa } from '../types';
import { FinanceUtils } from '../utils/finance';
import fs from 'fs';
import path from 'path';

export const FacturasController = {
    async list(req: any, res: Response) {
        try {
            const { estado, clienteId, page = 1 } = req.query;
            const empresaId = req.user.empresaId;

            if (!empresaId && req.user.rol !== 'super_admin') {
                return res.status(400).json({ message: 'Se requiere estar asociado a una empresa' });
            }

            const db = await Database.read();
            let facturas = db.facturas;
            const clientes = db.clientes;

            if (req.user.rol !== 'super_admin') {
                facturas = facturas.filter(f => f.empresaId === empresaId);
            }

            if (estado) facturas = facturas.filter(f => f.estado === estado as string);
            if (clienteId) facturas = facturas.filter(f => f.clienteId === clienteId as string);

            // Join with client name
            const facturasConCliente = facturas.map(f => {
                const cliente = clientes.find(c => c.id === f.clienteId);
                return {
                    ...f,
                    clienteNombre: cliente ? cliente.nombre : 'Cliente Desconocido'
                };
            });

            // Simple pagination
            const limit = 50;
            const offset = (Number(page) - 1) * limit;
            const paginated = facturasConCliente.slice(offset, offset + limit);

            res.json(paginated);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async create(req: any, res: Response) {
        try {
            const { clienteId, items, metodosPago, serie, notas, moneda, fechaEmision, fechaVencimiento } = req.body;
            const empresaId = req.user.empresaId;

            if (!empresaId) return res.status(400).json({ message: 'Usuario sin empresa' });

            // Get enterprise to handle folio
            const db = await Database.read();
            const empresa = db.empresas.find(e => e.id === empresaId);
            if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });

            const nextFolio = (empresa.configuracion.numeracionActual || 0) + 1;

            // Calculate totals using central finance utility
            const totals = FinanceUtils.calculateInvoiceTotals(items);

            const newFactura: Factura = {
                id: uuidv4(),
                empresaId,
                clienteId,
                numero: `${empresa.configuracion.prefijoFactura}-${nextFolio}`,
                serie: serie || empresa.configuracion.prefijoFactura,
                folio: nextFolio,
                fechaEmision: new Date(fechaEmision || Date.now()),
                fechaVencimiento: new Date(fechaVencimiento || Date.now()),
                fechaPago: null,
                estado: 'pendiente',
                metodoPago: metodosPago || 'transferencia',
                subtotal: totals.subtotal,
                impuestos: totals.impuestos,
                total: totals.total,
                moneda: moneda || empresa.configuracion.monedaDefault,
                notas: notas || '',
                items: totals.items,
                pagos: []
            };

            // Update company folio
            empresa.configuracion.numeracionActual = nextFolio;
            await Database.write(db);

            await Database.saveToCollection('facturas', newFactura);
            res.status(201).json(newFactura);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getById(req: any, res: Response) {
        try {
            const { id } = req.params;
            const facturas = await Database.getCollection<Factura>('facturas');
            const factura = facturas.find(f => f.id === id && (req.user.rol === 'super_admin' || f.empresaId === req.user.empresaId));

            if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
            res.json(factura);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async updateStatus(req: any, res: Response) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            const db = await Database.read();
            const factura = db.facturas.find(f => f.id === id && (req.user.rol === 'super_admin' || f.empresaId === req.user.empresaId));

            if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });

            factura.estado = estado;
            await Database.write(db);
            res.json(factura);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async delete(req: any, res: Response) {
        try {
            const { id } = req.params;
            const empresaId = req.user.empresaId;

            const db = await Database.read();
            const facturaABorrar = db.facturas.find(f => f.id === id && (req.user.rol === 'super_admin' || f.empresaId === empresaId));

            if (!facturaABorrar) {
                return res.status(404).json({ message: 'Factura no encontrada o sin permisos' });
            }

            // Eliminar archivo físico si existe
            if (facturaABorrar.archivoOriginal) {
                const PROCESSED_DIR = path.join(process.cwd(), 'uploads/facturas/procesadas');
                const filePath = path.join(PROCESSED_DIR, facturaABorrar.archivoOriginal);

                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`🗑️ Archivo eliminado: ${facturaABorrar.archivoOriginal}`);
                    } catch (err) {
                        console.error(`❌ Error al eliminar el archivo ${filePath}:`, err);
                    }
                }
            }

            db.facturas = db.facturas.filter(f => f.id !== id);
            await Database.write(db);

            res.json({ message: 'Factura y archivo físico eliminados correctamente' });
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar factura', error });
        }
    }
};
