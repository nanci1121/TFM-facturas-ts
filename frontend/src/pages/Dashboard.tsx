import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    Clock,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
    const [resumen, setResumen] = useState<any>(null);

    useEffect(() => {
        // Mock for now until we have auth flow
        setResumen({
            totalFacturado: 150000,
            pendiente: 45000,
            vencido: 12000,
            pagado: 93000
        });
    }, []);

    const kpis = [
        { label: 'Total Facturado', value: `$${resumen?.totalFacturado || 0}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Pendiente', value: `$${resumen?.pendiente || 0}`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'Vencido', value: `$${resumen?.vencido || 0}`, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
        { label: 'Pagado', value: `$${resumen?.pagado || 0}`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{kpi.label}</p>
                                <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{kpi.value}</p>
                            </div>
                            <div className={`${kpi.bg} p-3 rounded-lg`}>
                                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-80 flex items-center justify-center">
                    <p className="text-gray-400 italic">Gráfica de Ingresos (Próximamente...)</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-80 flex items-center justify-center">
                    <p className="text-gray-400 italic">Facturas Recientes (Próximamente...)</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
