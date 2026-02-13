import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, Search, Filter, MoreVertical, FileText, Upload, Loader2 } from 'lucide-react';
import api from '../services/api';

const Facturas = () => {
    const [facturas, setFacturas] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [debugData, setDebugData] = useState<any>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null); // Nuevo estado para menu
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [filterCliente, setFilterCliente] = useState('');
    const [filterFromDate, setFilterFromDate] = useState('');
    const [filterToDate, setFilterToDate] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) return;
        try {
            await api.delete(`/facturas/${id}`);
            fetchFacturas();
        } catch (error) {
            console.error('Error deleting invoice:', error);
            alert('No se pudo eliminar la factura');
        } finally {
            setActiveMenu(null);
        }
    };

    const fetchFacturas = async () => {
        try {
            setLoading(true);
            // Construir query params
            const params: any = { page };
            if (searchTerm) params.q = searchTerm;
            if (filterEstado) params.estado = filterEstado;
            if (filterCategoria) params.categoria = filterCategoria;
            if (filterCliente) params.clienteNombre = filterCliente;
            if (filterFromDate) params.from = filterFromDate;
            if (filterToDate) params.to = filterToDate;
            const res = await api.get('/facturas', { params });
            setFacturas(res.data.data);
            setTotalPages(res.data.totalPages);
            setTotal(res.data.total);
            setPageSize(res.data.pageSize);
            fetchDebug(); // Aprovechamos para traer el debug
        } catch (error) {
            console.error('Error fetching facturas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDebug = async () => {
        try {
            const res = await api.get('/ia/debug');
            if (res.data && res.data.prompt) {
                setDebugData(res.data);
            }
        } catch (error) {
            console.error('Error fetching debug data:', error);
        }
    };

    useEffect(() => {
        setPage(1); // Reset page on filter/search change
    }, [searchTerm, filterEstado, filterCategoria, filterCliente, filterFromDate, filterToDate]);

    useEffect(() => {
        fetchFacturas();
        // eslint-disable-next-line
    }, [searchTerm, filterEstado, filterCategoria, filterCliente, filterFromDate, filterToDate, page]);

    const clientesOptions = useMemo(() => {
        const unique = new Set<string>();
        facturas.forEach((f) => {
            if (f.clienteNombre) unique.add(f.clienteNombre);
        });
        return Array.from(unique).sort((a, b) => a.localeCompare(b));
    }, [facturas]);

    // Ya no filtramos en frontend, solo mostramos lo que devuelve el backend
    const filteredFacturas = facturas;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            const res = await api.post('/facturas/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.isDuplicate) {
                alert(`⚠️ Factura duplicada: El documento de ${res.data.invoice.emisorNombre} (Nº ${res.data.invoice.numero}) ya estaba registrado.`);
            } else {
                alert('✅ Factura procesada y añadida con éxito');
            }
            fetchFacturas(); // Recargar lista
        } catch (error: any) {
            console.error('Error uploading invoice:', error);
            const message = error.response?.data?.message || 'Error al procesar la factura';
            alert(`❌ ${message}`);
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
                    <button
                        onClick={fetchFacturas}
                        disabled={loading}
                        className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-colors font-medium dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                        title="Refrescar lista"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Filter className="w-5 h-5 rotate-180" />}
                        <span className="ml-2 hidden md:inline">Actualizar</span>
                    </button>
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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => setFiltersOpen((prev) => !prev)}
                        className="flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                    </button>
                </div>
                {filtersOpen && (
                    <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Estado</label>
                            <select
                                value={filterEstado}
                                onChange={(e) => setFilterEstado(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="pagada">Pagada</option>
                                <option value="vencida">Vencida</option>
                                <option value="parcial">Parcial</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Categoria</label>
                            <select
                                value={filterCategoria}
                                onChange={(e) => setFilterCategoria(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todas</option>
                                <option value="alimentación">Alimentacion</option>
                                <option value="telecomunicaciones">Telecomunicaciones</option>
                                <option value="suministro eléctrico">Suministro electrico</option>
                                <option value="agua">Agua</option>
                                <option value="ocio">Ocio</option>
                                <option value="otros">Otros</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Cliente</label>
                            <select
                                value={filterCliente}
                                onChange={(e) => setFilterCliente(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos</option>
                                {clientesOptions.map((cliente) => (
                                    <option key={cliente} value={cliente}>{cliente}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Desde</label>
                            <input
                                type="date"
                                value={filterFromDate}
                                onChange={(e) => setFilterFromDate(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Hasta</label>
                            <input
                                type="date"
                                value={filterToDate}
                                onChange={(e) => setFilterToDate(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto pb-48">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4 min-w-[150px]">Número</th>
                                <th className="px-6 py-4 min-w-[180px]">Emisor</th>
                                <th className="px-6 py-4 min-w-[140px]">Categoría</th>
                                <th className="px-6 py-4 min-w-[180px]">Cliente</th>
                                <th className="px-6 py-4 min-w-[120px]">Fecha</th>
                                <th className="px-6 py-4 min-w-[120px]">Total</th>
                                <th className="px-6 py-4 text-center min-w-[180px]">IA Provider</th>
                                <th className="px-6 py-4 min-w-[130px]">Estado</th>
                                <th className={`px-6 py-4 text-right transition-all duration-300 ease-in-out ${activeMenu ? 'w-60' : 'w-24'}`}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading && facturas.length === 0 ? (
                                <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-400 italic">Cargando facturas...</td></tr>
                            ) : filteredFacturas.length === 0 ? (
                                <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-400 italic">No hay resultados con esos filtros.</td></tr>
                            ) : (
                                filteredFacturas.map((f) => (
                                    <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        {/* Paginación */}
                                                        {totalPages > 1 && (
                                                            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                                                <span className="text-sm text-gray-500">Mostrando página {page} de {totalPages} ({total} facturas)</span>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        disabled={page === 1}
                                                                        onClick={() => setPage(page - 1)}
                                                                        className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                                                                    >Anterior</button>
                                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                                                        <button
                                                                            key={p}
                                                                            onClick={() => setPage(p)}
                                                                            className={`px-3 py-1 rounded ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                                                        >{p}</button>
                                                                    ))}
                                                                    <button
                                                                        disabled={page === totalPages}
                                                                        onClick={() => setPage(page + 1)}
                                                                        className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                                                                    >Siguiente</button>
                                                                </div>
                                                            </div>
                                                        )}
                                        <td className="px-6 py-4 font-semibold text-blue-600 dark:text-blue-400">{f.numero}</td>
                                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200 font-medium">{f.emisorNombre || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded-md border border-purple-100 dark:border-purple-800/30 font-medium">
                                                {f.categoria || 'otros'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">{f.clienteNombre || 'Sin cliente'}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                                            {new Date(f.fechaEmision).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">${f.total.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500">
                                                {f.iaProvider || 'manual'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase ${getStatusColor(f.estado)}`}>
                                                {f.estado}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right relative overflow-visible transition-all duration-300 ease-in-out ${activeMenu ? 'w-60' : 'w-24'}`}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === f.id ? null : f.id);
                                                }}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-5 h-5 text-gray-400" />
                                            </button>

                                            {activeMenu === f.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden translate-y-0 opacity-100">
                                                    <div className="py-1">
                                                        <button
                                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors"
                                                            onClick={() => {
                                                                if (f.archivoOriginal) {
                                                                    window.open(`/uploads/facturas/${f.archivoOriginal}`, '_blank');
                                                                } else {
                                                                    alert('Esta factura no tiene un archivo físico asociado (es antigua o manual).');
                                                                }
                                                                setActiveMenu(null);
                                                            }}
                                                        >
                                                            <FileText className="w-4 h-4 mr-3 text-blue-500" />
                                                            Ver Factura PDF
                                                        </button>
                                                        <button
                                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center border-t border-gray-50 dark:border-gray-700 transition-colors"
                                                            onClick={() => handleDelete(f.id)}
                                                        >
                                                            <Plus className="w-4 h-4 mr-3 rotate-45" />
                                                            Eliminar Factura
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Panel de Depuración (Sólo visible si hay datos) */}
            {debugData && (
                <div className="mt-12 bg-gray-900 rounded-2xl p-6 border border-yellow-500/30 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-yellow-500 font-bold flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                            IA DEBUG CONSOLE (Modo Desarrollo)
                        </h3>
                        <span className="text-xs text-gray-400 uppercase tracking-widest bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                            Provider: <span className="text-blue-400 font-mono italic">{debugData.provider}</span>
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Prompt Enviado (Extraído del PDF)</label>
                            <textarea
                                readOnly
                                className="w-full h-64 bg-black/50 text-green-400 font-mono text-xs p-4 rounded-xl border border-gray-800 focus:outline-none resize-none"
                                value={debugData.prompt}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">JSON Recibido (IA Output)</label>
                            <textarea
                                readOnly
                                className="w-full h-64 bg-black/50 text-blue-300 font-mono text-xs p-4 rounded-xl border border-gray-800 focus:outline-none resize-none"
                                value={debugData.response}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Facturas;
