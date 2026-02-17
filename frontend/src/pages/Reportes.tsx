import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';
import { FileText, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface Resumen {
    gastos: { total: number };
    ingresos: { total: number };
    balance: number;
}

const Reportes = () => {
    const [loading, setLoading] = useState(true);
    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [mensuales, setMensuales] = useState([]);
    const [categoriasGasto, setCategoriasGasto] = useState([]);
    const [categoriasIngreso, setCategoriasIngreso] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [resResumen, resMensuales, resCatGasto, resCatIngreso] = await Promise.all([
                    api.get('/reportes/resumen'),
                    api.get('/reportes/estadisticas-mensuales'),
                    api.get('/reportes/categorias?tipo=gasto'),
                    api.get('/reportes/categorias?tipo=ingreso')
                ]);

                setResumen(resResumen.data);
                setMensuales(resMensuales.data.reverse()); // Para que vaya de antiguo a nuevo
                setCategoriasGasto(resCatGasto.data);
                setCategoriasIngreso(resCatIngreso.data);
            } catch (error) {
                console.error('Error cargando reportes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando análisis financiero...</div>;

    return (
        <div className="space-y-8 pb-10">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Reportes Financieros</h1>
                    <p className="text-gray-500 dark:text-gray-400">Análisis detallado del rendimiento de tu negocio.</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF
                </button>
            </header>

            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Ingresos Totales</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(resumen?.ingresos.total || 0)}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <TrendingDown className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Gastos Totales</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(resumen?.gastos.total || 0)}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Balance Neto</span>
                    </div>
                    <p className={`text-2xl font-bold ${resumen && resumen.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(resumen?.balance || 0)}
                    </p>
                </div>
            </div>

            {/* Gráfico de Evolución */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Evolución de Ingresos vs Gastos</h2>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mensuales}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="mesCompleto" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Legend />
                            <Bar dataKey="ingresos" name="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="gastos" name="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Desglose por Categorías */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Gastos por Categoría */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Gastos por Categoría</h2>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoriasGasto}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="total"
                                >
                                    {categoriasGasto.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-3">
                        {categoriasGasto.slice(0, 5).map((cat: any, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-gray-600 dark:text-gray-300">{cat.nombre}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cat.total)}
                                    </span>
                                    <span className="text-xs text-gray-400 w-8 text-right">{cat.porcentaje}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Ingresos por Categoría */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Fuentes de Ingreso</h2>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoriasIngreso}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="total"
                                >
                                    {categoriasIngreso.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-3">
                        {categoriasIngreso.slice(0, 5).map((cat: any, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-gray-600 dark:text-gray-300">{cat.nombre}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cat.total)}
                                    </span>
                                    <span className="text-xs text-gray-400 w-8 text-right">{cat.porcentaje}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Reportes;
