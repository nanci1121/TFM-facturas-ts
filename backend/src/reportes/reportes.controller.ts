import { Response } from 'express';
import { prisma } from '../database/db';
import { startOfMonth, subMonths, endOfMonth, addDays, isAfter, isBefore } from 'date-fns';

export const ReportesController = {
    async getResumen(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const now = new Date();
            const currentMonthStart = startOfMonth(now);
            const previousMonthStart = startOfMonth(subMonths(now, 1));
            const previousMonthEnd = endOfMonth(subMonths(now, 1));

            // Run multiple aggregates in parallel
            const [
                facturas,
                clientesCount,
                gastoMesActual,
                gastoMesAnterior,
                ingresoMesActual,
                ingresoMesAnterior
            ] = await Promise.all([
                // All invoices for this company
                prisma.factura.findMany({ where: { empresaId } }),
                // Total clients
                prisma.cliente.count({ where: { empresaId, activo: true } }),
                // Gasto Mes Actual
                prisma.factura.aggregate({
                    where: { empresaId, tipo: 'gasto', fechaEmision: { gte: currentMonthStart, lte: now } },
                    _sum: { total: true }
                }),
                // Gasto Mes Anterior
                prisma.factura.aggregate({
                    where: { empresaId, tipo: 'gasto', fechaEmision: { gte: previousMonthStart, lte: previousMonthEnd } },
                    _sum: { total: true }
                }),
                // Ingreso Mes Actual
                prisma.factura.aggregate({
                    where: { empresaId, tipo: 'ingreso', fechaEmision: { gte: currentMonthStart, lte: now } },
                    _sum: { total: true }
                }),
                // Ingreso Mes Anterior
                prisma.factura.aggregate({
                    where: { empresaId, tipo: 'ingreso', fechaEmision: { gte: previousMonthStart, lte: previousMonthEnd } },
                    _sum: { total: true }
                })
            ]);

            const gastos = facturas.filter(f => f.tipo === 'gasto');
            const ingresos = facturas.filter(f => f.tipo === 'ingreso');

            const calculateVariation = (actual: number, anterior: number) => {
                if (anterior === 0) return actual > 0 ? 100 : 0;
                return Math.round(((actual - anterior) / anterior) * 1000) / 10;
            };

            const gActual = gastoMesActual._sum.total || 0;
            const gAnterior = gastoMesAnterior._sum.total || 0;
            const iActual = ingresoMesActual._sum.total || 0;
            const iAnterior = ingresoMesAnterior._sum.total || 0;

            const resumen = {
                gastos: {
                    total: gastos.reduce((sum, f) => sum + f.total, 0),
                    pagado: gastos.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + f.total, 0),
                    pendientePagar: gastos.filter(f => ['pendiente', 'parcial'].includes(f.estado)).reduce((sum, f) => sum + f.total, 0),
                    vencido: gastos.filter(f => f.estado === 'vencida').reduce((sum, f) => sum + f.total, 0),
                    count: gastos.length,
                    mesActual: gActual,
                    mesAnterior: gAnterior,
                    variacion: calculateVariation(gActual, gAnterior),
                },
                ingresos: {
                    total: ingresos.reduce((sum, f) => sum + f.total, 0),
                    cobrado: ingresos.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + f.total, 0),
                    pendienteCobrar: ingresos.filter(f => ['pendiente', 'parcial'].includes(f.estado)).reduce((sum, f) => sum + f.total, 0),
                    vencido: ingresos.filter(f => f.estado === 'vencida').reduce((sum, f) => sum + f.total, 0),
                    count: ingresos.length,
                    mesActual: iActual,
                    mesAnterior: iAnterior,
                    variacion: calculateVariation(iActual, iAnterior),
                },
                balance: (ingresos.reduce((sum, f) => sum + f.total, 0)) - (gastos.reduce((sum, f) => sum + f.total, 0)),
                countClientes: clientesCount,
                countFacturas: facturas.length,
            };

            res.json(resumen);
        } catch (error) {
            console.error('Error in ReportesController.getResumen:', error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getEstadisticasMensuales(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const now = new Date();
            const stats = [];

            for (let i = 5; i >= 0; i--) {
                const monthDate = subMonths(now, i);
                const start = startOfMonth(monthDate);
                const end = endOfMonth(monthDate);

                const monthFacturas = await prisma.factura.findMany({
                    where: { empresaId, fechaEmision: { gte: start, lte: end } }
                });

                const gastosMes = monthFacturas.filter(f => f.tipo === 'gasto');
                const ingresosMes = monthFacturas.filter(f => f.tipo === 'ingreso');

                stats.push({
                    mes: monthDate.toLocaleString('es-ES', { month: 'short' }),
                    mesCompleto: monthDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
                    gastos: gastosMes.reduce((sum, f) => sum + f.total, 0),
                    ingresos: ingresosMes.reduce((sum, f) => sum + f.total, 0),
                    gastoPagado: gastosMes.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + f.total, 0),
                    ingresoCobrado: ingresosMes.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + f.total, 0),
                    count: monthFacturas.length,
                });
            }

            res.json(stats);
        } catch (error) {
            console.error('Error in ReportesController.getEstadisticasMensuales:', error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getDistribucionEstados(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const { tipo } = req.query; // 'gasto' o 'ingreso'

            const where: any = { empresaId };
            if (tipo) where.tipo = tipo;

            const groupStats = await prisma.factura.groupBy({
                by: ['estado'],
                where,
                _count: { estado: true },
                _sum: { total: true }
            });

            const distribucion = groupStats.map(stat => ({
                estado: stat.estado,
                count: stat._count.estado,
                total: Math.round((stat._sum.total || 0) * 100) / 100
            }));

            res.json(distribucion);
        } catch (error) {
            console.error('Error in ReportesController.getDistribucionEstados:', error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getFacturasRecientes(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const recientes = await prisma.factura.findMany({
                where: { empresaId },
                include: { cliente: { select: { nombre: true } } },
                orderBy: { fechaEmision: 'desc' },
                take: 5
            });

            const result = recientes.map((f: any) => ({
                id: f.id,
                numero: f.numero,
                emisorNombre: f.emisorNombre || '—',
                clienteNombre: f.cliente?.nombre || f.clienteNombre || 'Sin asignar',
                total: f.total,
                estado: f.estado,
                tipo: f.tipo,
                fechaEmision: f.fechaEmision,
                categoria: f.categoria || 'otros',
            }));

            res.json(result);
        } catch (error) {
            console.error('Error in ReportesController.getFacturasRecientes:', error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getAlertas(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const now = new Date();
            const in7Days = addDays(now, 7);

            const [porVencer, vencidas] = await Promise.all([
                prisma.factura.findMany({
                    where: {
                        empresaId,
                        estado: { notIn: ['pagada', 'cancelada'] },
                        fechaVencimiento: { gt: now, lte: in7Days }
                    },
                    include: { cliente: { select: { nombre: true } } }
                }),
                prisma.factura.findMany({
                    where: { empresaId, estado: 'vencida' },
                    include: { cliente: { select: { nombre: true } } }
                })
            ]);

            const mapAlerta = (tipoAlerta: 'por_vencer' | 'vencida') => (f: any) => ({
                id: f.id,
                numero: f.numero,
                clienteNombre: f.cliente?.nombre || f.clienteNombre || 'Sin asignar',
                emisorNombre: f.emisorNombre || '—',
                total: f.total,
                fechaVencimiento: f.fechaVencimiento,
                tipo: f.tipo,
                tipoAlerta,
            });

            res.json({
                porVencer: porVencer.map(mapAlerta('por_vencer')),
                vencidas: vencidas.map(mapAlerta('vencida')),
                totalAlertas: porVencer.length + vencidas.length,
            });
        } catch (error) {
            console.error('Error in ReportesController.getAlertas:', error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getCategorias(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const { tipo } = req.query; // 'gasto' o 'ingreso'

            const where: any = { empresaId };
            if (tipo) where.tipo = tipo;

            const catStats = await prisma.factura.groupBy({
                by: ['categoria'],
                where,
                _count: { categoria: true },
                _sum: { total: true }
            });

            const totalGeneral = catStats.reduce((sum, stat) => sum + (stat._sum.total || 0), 0);

            const resultado = catStats
                .map(stat => {
                    const total = stat._sum.total || 0;
                    return {
                        nombre: stat.categoria || 'Sin Categoría',
                        count: stat._count.categoria,
                        total: Math.round(total * 100) / 100,
                        porcentaje: totalGeneral > 0 ? Math.round((total / totalGeneral) * 100) : 0
                    };
                })
                .sort((a, b) => b.total - a.total);

            res.json(resultado);
        } catch (error) {
            console.error('Error in ReportesController.getCategorias:', error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    }
};
