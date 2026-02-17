import { Response } from 'express';
import { Database } from '../database';
import { Factura } from '../types';
import { startOfMonth, subMonths, isWithinInterval, endOfMonth, addDays, isBefore, isAfter } from 'date-fns';

export const ReportesController = {
    async getResumen(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const db = await Database.read();
            const facturas = db.facturas.filter((f: Factura) => f.empresaId === empresaId);
            const clientes = db.clientes.filter((c: any) => c.empresaId === empresaId);

            // Separar por tipo
            const gastos = facturas.filter((f: Factura) => (f.tipo || 'gasto') === 'gasto');
            const ingresos = facturas.filter((f: Factura) => f.tipo === 'ingreso');

            const now = new Date();
            const currentMonthStart = startOfMonth(now);
            const previousMonthStart = startOfMonth(subMonths(now, 1));
            const previousMonthEnd = endOfMonth(subMonths(now, 1));

            // --- GASTOS ---
            const gastoTotal = gastos.reduce((sum: number, f: Factura) => sum + f.total, 0);
            const gastoPagado = gastos.filter((f: Factura) => f.estado === 'pagada').reduce((sum: number, f: Factura) => sum + f.total, 0);
            const gastoPendiente = gastos.filter((f: Factura) => f.estado === 'pendiente' || f.estado === 'parcial').reduce((sum: number, f: Factura) => sum + f.total, 0);
            const gastoVencido = gastos.filter((f: Factura) => f.estado === 'vencida').reduce((sum: number, f: Factura) => sum + f.total, 0);

            // Gasto mes actual vs anterior
            const gastoMesActual = gastos
                .filter((f: Factura) => isWithinInterval(new Date(f.fechaEmision), { start: currentMonthStart, end: now }))
                .reduce((sum: number, f: Factura) => sum + f.total, 0);
            const gastoMesAnterior = gastos
                .filter((f: Factura) => isWithinInterval(new Date(f.fechaEmision), { start: previousMonthStart, end: previousMonthEnd }))
                .reduce((sum: number, f: Factura) => sum + f.total, 0);
            const gastoVariacion = gastoMesAnterior > 0
                ? Math.round(((gastoMesActual - gastoMesAnterior) / gastoMesAnterior) * 1000) / 10
                : gastoMesActual > 0 ? 100 : 0;

            // --- INGRESOS ---
            const ingresoTotal = ingresos.reduce((sum: number, f: Factura) => sum + f.total, 0);
            const ingresoCobrado = ingresos.filter((f: Factura) => f.estado === 'pagada').reduce((sum: number, f: Factura) => sum + f.total, 0);
            const ingresoPendiente = ingresos.filter((f: Factura) => f.estado === 'pendiente' || f.estado === 'parcial').reduce((sum: number, f: Factura) => sum + f.total, 0);
            const ingresoVencido = ingresos.filter((f: Factura) => f.estado === 'vencida').reduce((sum: number, f: Factura) => sum + f.total, 0);

            // Ingreso mes actual vs anterior
            const ingresoMesActual = ingresos
                .filter((f: Factura) => isWithinInterval(new Date(f.fechaEmision), { start: currentMonthStart, end: now }))
                .reduce((sum: number, f: Factura) => sum + f.total, 0);
            const ingresoMesAnterior = ingresos
                .filter((f: Factura) => isWithinInterval(new Date(f.fechaEmision), { start: previousMonthStart, end: previousMonthEnd }))
                .reduce((sum: number, f: Factura) => sum + f.total, 0);
            const ingresoVariacion = ingresoMesAnterior > 0
                ? Math.round(((ingresoMesActual - ingresoMesAnterior) / ingresoMesAnterior) * 1000) / 10
                : ingresoMesActual > 0 ? 100 : 0;

            const resumen = {
                // Gastos (facturas que pagamos a proveedores)
                gastos: {
                    total: gastoTotal,
                    pagado: gastoPagado,
                    pendientePagar: gastoPendiente,
                    vencido: gastoVencido,
                    count: gastos.length,
                    mesActual: gastoMesActual,
                    mesAnterior: gastoMesAnterior,
                    variacion: gastoVariacion,
                },
                // Ingresos (facturas que cobramos a clientes)
                ingresos: {
                    total: ingresoTotal,
                    cobrado: ingresoCobrado,
                    pendienteCobrar: ingresoPendiente,
                    vencido: ingresoVencido,
                    count: ingresos.length,
                    mesActual: ingresoMesActual,
                    mesAnterior: ingresoMesAnterior,
                    variacion: ingresoVariacion,
                },
                // Balance general
                balance: ingresoTotal - gastoTotal,
                countClientes: clientes.length,
                countFacturas: facturas.length,
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

                const gastosMes = monthFacturas.filter(f => (f.tipo || 'gasto') === 'gasto');
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
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getDistribucionEstados(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const { tipo } = req.query;
            const facturas = await Database.getCollection<Factura>('facturas');
            let empresaFacturas = facturas.filter(f => f.empresaId === empresaId);

            if (tipo) {
                empresaFacturas = empresaFacturas.filter(f => (f.tipo || 'gasto') === tipo);
            }

            const estados: Record<string, { count: number; total: number }> = {};
            empresaFacturas.forEach(f => {
                if (!estados[f.estado]) {
                    estados[f.estado] = { count: 0, total: 0 };
                }
                estados[f.estado].count++;
                estados[f.estado].total += f.total;
            });

            const distribucion = Object.entries(estados).map(([estado, data]) => ({
                estado,
                count: data.count,
                total: Math.round(data.total * 100) / 100,
            }));

            res.json(distribucion);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getFacturasRecientes(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const db = await Database.read();
            const facturas = db.facturas.filter((f: Factura) => f.empresaId === empresaId);
            const clientes = db.clientes;

            const recientes = facturas
                .sort((a: Factura, b: Factura) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime())
                .slice(0, 5)
                .map((f: Factura) => {
                    const cliente = clientes.find((c: any) => c.id === f.clienteId);
                    return {
                        id: f.id,
                        numero: f.numero,
                        emisorNombre: (f as any).emisorNombre || '—',
                        clienteNombre: cliente ? cliente.nombre : 'Sin asignar',
                        total: f.total,
                        estado: f.estado,
                        tipo: (f as any).tipo || 'gasto',
                        fechaEmision: f.fechaEmision,
                        categoria: (f as any).categoria || 'otros',
                    };
                });

            res.json(recientes);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getAlertas(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const db = await Database.read();
            const facturas = db.facturas.filter((f: Factura) => f.empresaId === empresaId);
            const clientes = db.clientes;
            const now = new Date();
            const in7Days = addDays(now, 7);

            // Facturas que vencen en los próximos 7 días
            const porVencer = facturas
                .filter((f: Factura) => {
                    if (f.estado === 'pagada' || f.estado === 'cancelada') return false;
                    const vencimiento = new Date(f.fechaVencimiento);
                    return isAfter(vencimiento, now) && isBefore(vencimiento, in7Days);
                })
                .map((f: Factura) => {
                    const cliente = clientes.find((c: any) => c.id === f.clienteId);
                    return {
                        id: f.id,
                        numero: f.numero,
                        clienteNombre: cliente ? cliente.nombre : 'Sin asignar',
                        emisorNombre: (f as any).emisorNombre || '—',
                        total: f.total,
                        fechaVencimiento: f.fechaVencimiento,
                        tipo: (f as any).tipo || 'gasto',
                        tipoAlerta: 'por_vencer' as const,
                    };
                });

            // Facturas vencidas
            const vencidas = facturas
                .filter((f: Factura) => f.estado === 'vencida')
                .map((f: Factura) => {
                    const cliente = clientes.find((c: any) => c.id === f.clienteId);
                    return {
                        id: f.id,
                        numero: f.numero,
                        clienteNombre: cliente ? cliente.nombre : 'Sin asignar',
                        emisorNombre: (f as any).emisorNombre || '—',
                        total: f.total,
                        fechaVencimiento: f.fechaVencimiento,
                        tipo: (f as any).tipo || 'gasto',
                        tipoAlerta: 'vencida' as const,
                    };
                });

            res.json({
                porVencer,
                vencidas,
                totalAlertas: porVencer.length + vencidas.length,
            });
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getCategorias(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const { tipo } = req.query; // 'gasto' o 'ingreso'
            const db = await Database.read();
            const facturas = db.facturas.filter((f: Factura) => f.empresaId === empresaId);

            const targetFacturas = facturas.filter((f: Factura) =>
                tipo ? (f.tipo || 'gasto') === tipo : true
            );

            const categorias: Record<string, { count: number; total: number }> = {};

            targetFacturas.forEach((f: Factura) => {
                const cat = (f as any).categoria || 'Sin Categoría';
                if (!categorias[cat]) {
                    categorias[cat] = { count: 0, total: 0 };
                }
                categorias[cat].count++;
                categorias[cat].total += f.total;
            });

            // Ordenar por total descendente
            const resultado = Object.entries(categorias)
                .map(([nombre, datos]) => ({
                    nombre,
                    count: datos.count,
                    total: Math.round(datos.total * 100) / 100,
                    porcentaje: 0 // Se calculará en el frontend o aquí si queremos
                }))
                .sort((a, b) => b.total - a.total);

            const totalGeneral = resultado.reduce((sum, item) => sum + item.total, 0);

            // Calcular porcentajes
            const finalResult = resultado.map(item => ({
                ...item,
                porcentaje: totalGeneral > 0 ? Math.round((item.total / totalGeneral) * 100) : 0
            }));

            res.json(finalResult);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    }
};
