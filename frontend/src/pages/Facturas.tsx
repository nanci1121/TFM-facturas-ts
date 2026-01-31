import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Filter, MoreVertical, FileText, Upload, Loader2 } from 'lucide-react';
import api from '../services/api';

const Facturas = () => {
    const [facturas, setFacturas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFacturas = async () => {
        try {
            setLoading(true);
            const res = await api.get('/facturas');
            setFacturas(res.data);
        } catch (error) {
            console.error('Error fetching facturas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFacturas();
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            await api.post('/facturas/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Factura procesada y añadida con éxito');
            fetchFacturas(); // Recargar lista
        } catch (error) {
            console.error('Error uploading invoice:', error);
            alert('Error al procesar la factura');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pagada': return 'bg-green-100 text-green-700 border-green-200';
            case 'pendiente': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'vencida': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Facturas</h2>
                    <p className="text-gray-500 text-sm">Gestiona y consulta todas tus facturas emitidas.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium disabled:opacity-50"
                    >
                        {uploading ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <Plus className="w-5 h-5 mr-2" />
                        )}
                        {uploading ? 'Procesando...' : 'Nueva Factura'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por número o cliente..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button className="flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Número</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">Cargando facturas...</td></tr>
                            ) : facturas.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">No se encontraron facturas.</td></tr>
                            ) : (
                                facturas.map((f) => (
                                    <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-blue-600 dark:text-blue-400">{f.numero}</td>
                                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200">{f.clienteNombre || 'Sin cliente'}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                                            {new Date(f.fechaEmision).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">${f.total.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase ${getStatusColor(f.estado)}`}>
                                                {f.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                                <MoreVertical className="w-5 h-5 text-gray-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Facturas;
