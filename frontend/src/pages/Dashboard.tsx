import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Clock,
    AlertCircle,
    CheckCircle2,
    FileText,
    ArrowRight,
    CalendarClock,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    Loader2,
    Receipt,
    Send,
    CreditCard,
    Wallet,
    Scale,
    Zap
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    AreaChart, Area, BarChart, Bar
} from 'recharts';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

// --- Interfaces ---
interface ResumenGastos {
    total: number;
    pagado: number;
    pendientePagar: number;
    vencido: number;
    count: number;
    mesActual: number;
    mesAnterior: number;
    variacion: number;
}

interface ResumenIngresos {
    total: number;
    cobrado: number;
    pendienteCobrar: number;
    vencido: number;
    count: number;
    mesActual: number;
    mesAnterior: number;
    variacion: number;
}

interface Resumen {
    gastos: ResumenGastos;
    ingresos: ResumenIngresos;
    balance: number;
    countClientes: number;
    countFacturas: number;
}

interface EstadisticaMensual {
    mes: string;
    mesCompleto: string;
    gastos: number;
    ingresos: number;
    gastoPagado: number;
    ingresoCobrado: number;
    count: number;
}

interface DistribucionEstado {
    estado: string;
    count: number;
    total: number;
}

interface FacturaReciente {
    id: string;
    numero: string;
    emisorNombre: string;
    clienteNombre: string;
    total: number;
    estado: string;
    tipo: string;
    fechaEmision: string;
    categoria: string;
}

interface Alertas {
    porVencer: Array<{
        id: string;
        numero: string;
        clienteNombre: string;
        emisorNombre: string;
        total: number;
        fechaVencimiento: string;
        tipo: string;
        tipoAlerta: string;
    }>;
    vencidas: Array<{
        id: string;
        numero: string;
        clienteNombre: string;
        emisorNombre: string;
        total: number;
        fechaVencimiento: string;
        tipo: string;
        tipoAlerta: string;
    }>;
    totalAlertas: number;
}

// --- Constants ---
const ESTADO_COLORS: Record<string, string> = {
    pagada: '#10b981',
    pendiente: '#f59e0b',
    vencida: '#ef4444',
    parcial: '#8b5cf6',
    borrador: '#6b7280',
    cancelada: '#94a3b8',
};

const ESTADO_LABELS: Record<string, string> = {
    pagada: 'Pagadas',
    pendiente: 'Pendientes',
    vencida: 'Vencidas',
    parcial: 'Parciales',
    borrador: 'Borradores',
    cancelada: 'Canceladas',
};

// --- Utilities ---
const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pagada': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        case 'pendiente': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        case 'vencida': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        case 'parcial': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
};

const getTipoBadge = (tipo: string) => {
    if (tipo === 'ingreso') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
};

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-800 dark:text-white capitalize">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {formatCurrency(entry.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// ============================================================
// DASHBOARD COMPONENT
// ============================================================
const Dashboard = () => {
    const { user } = useAuthStore();
    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [estadisticas, setEstadisticas] = useState<EstadisticaMensual[]>([]);
    const [distribucionGasto, setDistribucionGasto] = useState<DistribucionEstado[]>([]);
    const [distribucionIngreso, setDistribucionIngreso] = useState<DistribucionEstado[]>([]);
    const [recientes, setRecientes] = useState<FacturaReciente[]>([]);
    const [alertas, setAlertas] = useState<Alertas | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                const [resumenRes, statsRes, distGastoRes, distIngresoRes, recientesRes, alertasRes] = await Promise.allSettled([
                    api.get('/reportes/resumen'),
                    api.get('/reportes/estadisticas-mensuales'),
                    api.get('/reportes/distribucion-estados?tipo=gasto'),
                    api.get('/reportes/distribucion-estados?tipo=ingreso'),
                    api.get('/reportes/facturas-recientes'),
                    api.get('/reportes/alertas'),
                ]);

                if (resumenRes.status === 'fulfilled') setResumen(resumenRes.value.data);
                if (statsRes.status === 'fulfilled') setEstadisticas(statsRes.value.data);
                if (distGastoRes.status === 'fulfilled') setDistribucionGasto(distGastoRes.value.data);
                if (distIngresoRes.status === 'fulfilled') setDistribucionIngreso(distIngresoRes.value.data);
                if (recientesRes.status === 'fulfilled') setRecientes(recientesRes.value.data);
                if (alertasRes.status === 'fulfilled') setAlertas(alertasRes.value.data);
            } catch (err: any) {
                console.error('Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    // --- KPIs Gastos ---
    const gastosKpis = [
        {
            label: 'Total Gastos',
            value: formatCurrency(resumen?.gastos.total || 0),
            subtitle: `${resumen?.gastos.count || 0} facturas recibidas`,
            icon: Receipt,
            gradient: 'from-orange-500 to-red-500',
            bgLight: 'bg-orange-50 dark:bg-orange-900/20',
            textColor: 'text-orange-600 dark:text-orange-400',
        },
        {
            label: 'Pagado',
            value: formatCurrency(resumen?.gastos.pagado || 0),
            subtitle: 'Facturas pagadas',
            icon: CheckCircle2,
            gradient: 'from-emerald-500 to-teal-600',
            bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
            textColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'Pendiente Pagar',
            value: formatCurrency(resumen?.gastos.pendientePagar || 0),
            subtitle: 'Pendientes + parciales',
            icon: Clock,
            gradient: 'from-amber-500 to-orange-600',
            bgLight: 'bg-amber-50 dark:bg-amber-900/20',
            textColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            label: 'Vencido',
            value: formatCurrency(resumen?.gastos.vencido || 0),
            subtitle: 'Requiere atención',
            icon: AlertCircle,
            gradient: 'from-red-500 to-rose-600',
            bgLight: 'bg-red-50 dark:bg-red-900/20',
            textColor: 'text-red-600 dark:text-red-400',
        },
    ];

    // --- KPIs Ingresos ---
    const ingresosKpis = [
        {
            label: 'Total Facturado',
            value: formatCurrency(resumen?.ingresos.total || 0),
            subtitle: `${resumen?.ingresos.count || 0} facturas emitidas`,
            icon: Send,
            gradient: 'from-blue-500 to-indigo-600',
            bgLight: 'bg-blue-50 dark:bg-blue-900/20',
            textColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Cobrado',
            value: formatCurrency(resumen?.ingresos.cobrado || 0),
            subtitle: 'Facturas cobradas',
            icon: Wallet,
            gradient: 'from-emerald-500 to-teal-600',
            bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
            textColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'Pendiente Cobrar',
            value: formatCurrency(resumen?.ingresos.pendienteCobrar || 0),
            subtitle: 'Pendientes + parciales',
            icon: CreditCard,
            gradient: 'from-violet-500 to-purple-600',
            bgLight: 'bg-violet-50 dark:bg-violet-900/20',
            textColor: 'text-violet-600 dark:text-violet-400',
        },
        {
            label: 'Vencido',
            value: formatCurrency(resumen?.ingresos.vencido || 0),
            subtitle: 'Sin cobrar',
            icon: AlertCircle,
            gradient: 'from-red-500 to-rose-600',
            bgLight: 'bg-red-50 dark:bg-red-900/20',
            textColor: 'text-red-600 dark:text-red-400',
        },
    ];

    // --- Pie Data ---
    const pieDataGasto = distribucionGasto.map(d => ({
        name: ESTADO_LABELS[d.estado] || d.estado,
        value: d.count,
        total: d.total,
        color: ESTADO_COLORS[d.estado] || '#6b7280',
    }));

    const pieDataIngreso = distribucionIngreso.map(d => ({
        name: ESTADO_LABELS[d.estado] || d.estado,
        value: d.count,
        total: d.total,
        color: ESTADO_COLORS[d.estado] || '#6b7280',
    }));

    // --- Balance ---
    const balance = resumen?.balance || 0;
    const balancePositivo = balance >= 0;

    // --- Variaciones ---
    const gastoVariacion = resumen?.gastos.variacion || 0;
    const ingresoVariacion = resumen?.ingresos.variacion || 0;

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="space-y-8 animate-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Hola, {user?.nombre || 'Usuario'} 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Aquí tienes el resumen de tu actividad financiera.
                    </p>
                </div>

                {/* Balance badge */}
                <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border ${balancePositivo
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40'
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40'
                    }`}
                >
                    <Scale className="w-4 h-4" />
                    Balance: {formatCurrency(balance)}
                </div>
            </div>

            {/* ============================================================ */}
            {/* 📥 SECCIÓN GASTOS */}
            {/* ============================================================ */}
            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                        <Receipt className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">📥 Gastos</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Facturas recibidas de proveedores</p>
                    </div>
                    {gastoVariacion !== 0 && (
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${gastoVariacion > 0
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                            }`}
                        >
                            {gastoVariacion > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {gastoVariacion > 0 ? '+' : ''}{gastoVariacion}% vs. mes anterior
                        </div>
                    )}
                </div>

                {/* KPI Cards Gastos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {gastosKpis.map((kpi, index) => (
                        <div
                            key={kpi.label}
                            className="group relative bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${kpi.gradient} opacity-80`} />
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{kpi.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{kpi.value}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{kpi.subtitle}</p>
                                </div>
                                <div className={`${kpi.bgLight} p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300`}>
                                    <kpi.icon className={`w-5 h-5 ${kpi.textColor}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ============================================================ */}
            {/* 📤 SECCIÓN INGRESOS */}
            {/* ============================================================ */}
            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">📤 Ingresos</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Facturas emitidas a clientes</p>
                    </div>
                    {ingresoVariacion !== 0 && (
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${ingresoVariacion >= 0
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            }`}
                        >
                            {ingresoVariacion >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {ingresoVariacion >= 0 ? '+' : ''}{ingresoVariacion}% vs. mes anterior
                        </div>
                    )}
                </div>

                {/* KPI Cards Ingresos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {ingresosKpis.map((kpi, index) => (
                        <div
                            key={kpi.label}
                            className="group relative bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${kpi.gradient} opacity-80`} />
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{kpi.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{kpi.value}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{kpi.subtitle}</p>
                                </div>
                                <div className={`${kpi.bgLight} p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300`}>
                                    <kpi.icon className={`w-5 h-5 ${kpi.textColor}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ============================================================ */}
            {/* CHARTS: Bar chart Gastos vs Ingresos + 2 Pie charts */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart: Gastos vs Ingresos */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gastos vs Ingresos</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Últimos 6 meses</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-orange-500" />
                                <span className="text-gray-500 dark:text-gray-400">Gastos</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-gray-500 dark:text-gray-400">Ingresos</span>
                            </span>
                        </div>
                    </div>

                    {estadisticas.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={estadisticas} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                                <XAxis
                                    dataKey="mes"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    className="capitalize"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="gastos" name="Gastos" fill="#f97316" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="ingresos" name="Ingresos" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center">
                            <div className="text-center space-y-2">
                                <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
                                <p className="text-gray-400 dark:text-gray-500 text-sm">Aún no hay datos suficientes</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Column of 2 mini-pie charts */}
                <div className="space-y-6">
                    {/* Pie Gastos */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="mb-3">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                Gastos por estado
                            </h3>
                        </div>
                        {pieDataGasto.length > 0 ? (
                            <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                    <Pie
                                        data={pieDataGasto}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={55}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieDataGasto.map((entry, index) => (
                                            <Cell key={`cell-g-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number, name: string, props: any) => [
                                            `${value} (${formatCurrency(props.payload.total)})`,
                                            name
                                        ]}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        iconType="circle"
                                        iconSize={6}
                                        formatter={(value: string) => (
                                            <span className="text-[10px] text-gray-600 dark:text-gray-400">{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[140px] flex items-center justify-center">
                                <p className="text-gray-400 dark:text-gray-500 text-xs">Sin datos</p>
                            </div>
                        )}
                    </div>

                    {/* Pie Ingresos */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="mb-3">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Ingresos por estado
                            </h3>
                        </div>
                        {pieDataIngreso.length > 0 ? (
                            <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                    <Pie
                                        data={pieDataIngreso}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={55}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieDataIngreso.map((entry, index) => (
                                            <Cell key={`cell-i-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number, name: string, props: any) => [
                                            `${value} (${formatCurrency(props.payload.total)})`,
                                            name
                                        ]}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        iconType="circle"
                                        iconSize={6}
                                        formatter={(value: string) => (
                                            <span className="text-[10px] text-gray-600 dark:text-gray-400">{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[140px] flex items-center justify-center">
                                <p className="text-gray-400 dark:text-gray-500 text-xs">Aún no has emitido facturas</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* Bottom Row: Facturas Recientes + Alertas */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Facturas Recientes */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Facturas Recientes</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Últimas 5 facturas</p>
                        </div>
                        <a
                            href="/facturas"
                            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium transition-colors"
                        >
                            Ver todas
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>

                    {recientes.length > 0 ? (
                        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {recientes.map((factura) => (
                                <div key={factura.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${factura.tipo === 'ingreso'
                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                            : 'bg-orange-50 dark:bg-orange-900/20'
                                            }`}>
                                            {factura.tipo === 'ingreso'
                                                ? <Send className="w-4 h-4 text-blue-500" />
                                                : <Receipt className="w-4 h-4 text-orange-500" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{factura.numero}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {factura.tipo === 'gasto' ? factura.emisorNombre : factura.clienteNombre} · {new Date(factura.fechaEmision).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getTipoBadge(factura.tipo)}`}>
                                            {factura.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getStatusColor(factura.estado)}`}>
                                            {factura.estado}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[70px] text-right">
                                            {factura.tipo === 'gasto' ? '-' : '+'}{formatCurrency(factura.total)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 dark:text-gray-500 text-sm">No hay facturas recientes</p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Sube tu primera factura PDF o crea una factura de ingreso</p>
                        </div>
                    )}
                </div>

                {/* Alertas */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Alertas</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Facturas que requieren atención</p>
                        </div>
                        {alertas && alertas.totalAlertas > 0 && (
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                {alertas.totalAlertas} {alertas.totalAlertas === 1 ? 'alerta' : 'alertas'}
                            </span>
                        )}
                    </div>

                    {alertas && (alertas.porVencer.length > 0 || alertas.vencidas.length > 0) ? (
                        <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-[300px] overflow-y-auto">
                            {alertas.vencidas.map((alerta) => (
                                <div key={alerta.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{alerta.numero}</p>
                                            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                                                Vencida · {alerta.tipo === 'gasto' ? alerta.emisorNombre : alerta.clienteNombre}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getTipoBadge(alerta.tipo)}`}>
                                            {alerta.tipo === 'ingreso' ? 'Cobrar' : 'Pagar'}
                                        </span>
                                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                            {formatCurrency(alerta.total)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {alertas.porVencer.map((alerta) => (
                                <div key={alerta.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                            <CalendarClock className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{alerta.numero}</p>
                                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                Vence: {new Date(alerta.fechaVencimiento).toLocaleDateString('es-ES')} · {alerta.tipo === 'gasto' ? alerta.emisorNombre : alerta.clienteNombre}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getTipoBadge(alerta.tipo)}`}>
                                            {alerta.tipo === 'ingreso' ? 'Cobrar' : 'Pagar'}
                                        </span>
                                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                            {formatCurrency(alerta.total)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <CheckCircle2 className="w-12 h-12 text-emerald-300 dark:text-emerald-700 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">¡Todo en orden!</p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">No hay facturas vencidas ni por vencer</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================ */}
            {/* Resumen mensual */}
            {/* ============================================================ */}
            {resumen && (resumen.gastos.mesActual > 0 || resumen.ingresos.mesActual > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Banner Gastos */}
                    <div className="rounded-2xl p-5 border bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border-orange-200 dark:border-orange-800/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Gastos este mes</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    <strong>{formatCurrency(resumen.gastos.mesActual)}</strong> gastado
                                    {resumen.gastos.mesAnterior > 0 && (
                                        <> (anterior: {formatCurrency(resumen.gastos.mesAnterior)})</>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Banner Ingresos */}
                    <div className="rounded-2xl p-5 border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Ingresos este mes</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    <strong>{formatCurrency(resumen.ingresos.mesActual)}</strong> facturado
                                    {resumen.ingresos.mesAnterior > 0 && (
                                        <> (anterior: {formatCurrency(resumen.ingresos.mesAnterior)})</>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
