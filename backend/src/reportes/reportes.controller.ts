import { Response } from 'express';
import { Database } from '../database';
import { Factura } from '../types';
import { startOfMonth, subMonths, isWithinInterval, endOfMonth } from 'date-fns';

export const ReportesController = {
    async getResumen(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const facturas = await Database.getCollection<Factura>('facturas');
            const empresaFacturas = facturas.filter(f => f.empresaId === empresaId);

            const resumen = {
                totalFacturado: empresaFacturas.reduce((sum, f) => sum + f.total, 0),
                pendiente: empresaFacturas.filter(f => f.estado === 'pendiente' || f.estado === 'parcial').reduce((sum, f) => sum + f.total, 0),
                vencido: empresaFacturas.filter(f => f.estado === 'vencida').reduce((sum, f) => sum + f.total, 0),
                pagado: empresaFacturas.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + f.total, 0),
                count: empresaFacturas.length
            };

            res.json(resumen);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getEstadisticasMensuales(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const facturas = await Database.getCollection<Factura>('facturas');
            const empresaFacturas = facturas.filter(f => f.empresaId === empresaId);

            const stats = [];
            const now = new Date();

            for (let i = 5; i >= 0; i--) {
                const monthDate = subMonths(now, i);
                const start = startOfMonth(monthDate);
                const end = endOfMonth(monthDate);

                const monthFacturas = empresaFacturas.filter(f =>
                    isWithinInterval(new Date(f.fechaEmision), { start, end })
                );

                stats.push({
                    mes: monthDate.toLocaleString('default', { month: 'short' }),
                    total: monthFacturas.reduce((sum, f) => sum + f.total, 0),
                    count: monthFacturas.length
                });
            }

            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    }
};
