import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, Search, Filter, MoreVertical, FileText, Upload, Loader2, AlertCircle, Send, Receipt } from 'lucide-react';
import api from '../services/api';
import CrearFacturaModal from '../components/CrearFacturaModal';

const Facturas = () => {
    const [facturas, setFacturas] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [debugData, setDebugData] = useState<any>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [filterTipo, setFilterTipo] = useState<string>('');
    const [crearFacturaOpen, setCrearFacturaOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [filterCliente, setFilterCliente] = useState('');
    const [filterFromDate, setFilterFromDate] = useState('');
    const [filterToDate, setFilterToDate] = useState('');
    const [iaStatus, setIaStatus] = useState<{ name: string; available: boolean }[]>([]);
    const [editingFactura, setEditingFactura] = useState<any>(null);
    const [clientes, setClientes] = useState<any[]>([]);
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

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFactura) return;
        try {
            await api.put(`/facturas/${editingFactura.id}`, editingFactura);
            setEditingFactura(null);
            fetchFacturas();
        } catch (error) {
            console.error('Error updating invoice:', error);
            alert('No se pudo actualizar la factura');
        }
    };

    const fetchClientes = async () => {
        try {
            const res = await api.get('/clientes');
            setClientes(res.data);
        } catch (error) {
            console.error('Error fetching clientes:', error);
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
            if (filterTipo) params.tipo = filterTipo;
            const res = await api.get('/facturas', { params });

            // Defensive check: handle both direct array or paginated object structure
            const dataArr = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            const totalP = res.data?.totalPages || 1;
            const totalF = res.data?.total || dataArr.length;
            const size = res.data?.pageSize || 50;

            setFacturas(dataArr);
            setTotalPages(totalP);
            setTotal(totalF);
            setPageSize(size);
            fetchDebug();
        } catch (error) {
            console.error('Error fetching facturas:', error);
            setFacturas([]); // Clear on error to avoid stale/infinite loading
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
    }, [searchTerm, filterEstado, filterCategoria, filterCliente, filterFromDate, filterToDate, filterTipo]);

    const fetchIAStatus = async () => {
        try {
            const res = await api.get('/ia/status');
            setIaStatus(res.data.providers || []);
        } catch (error) {
            console.error('Error fetching IA status:', error);
        }
    };

    useEffect(() => {
        fetchFacturas();
        fetchIAStatus();
        fetchClientes();
        // eslint-disable-next-line
    }, [searchTerm, filterEstado, filterCategoria, filterCliente, filterFromDate, filterToDate, filterTipo, page]);

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
                    <p className="text-gray-500 text-sm">Gestiona gastos (PDF) e ingresos (facturas a clientes).</p>
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
                    {/* Upload PDF = Gasto */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-colors font-medium disabled:opacity-50"
                        title="Subir factura PDF de proveedor"
                    >
                        {uploading ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <Upload className="w-5 h-5 mr-2" />
                        )}
                        {uploading ? 'Procesando...' : 'Subir Gasto'}
                    </button>
                    {/* Crear Factura = Ingreso */}
                    <button
                        onClick={() => setCrearFacturaOpen(true)}
                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                    >
                        <Send className="w-5 h-5 mr-2" />
                        Nueva Factura
                    </button>
                </div>
            </div>

            {/* Tabs de tipo */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                {[
                    { value: '', label: 'Todas', count: total },
                    { value: 'gasto', label: '📥 Gastos', icon: Receipt },
                    { value: 'ingreso', label: '📤 Ingresos', icon: Send },
                ].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setFilterTipo(tab.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterTipo === tab.value
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Aviso de IA no disponible */}
            {iaStatus.length > 0 && !iaStatus.some(p => p.available) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-800">Conexión con IA no disponible</h4>
                        <p className="text-xs text-amber-700 mt-1">
                            Ningún proveedor de IA (Gemini, Groq u Ollama) está respondiendo.
                            Podrás subir facturas, pero no se extraerán los datos automáticamente hasta que configures una clave válida en el servidor.
                        </p>
                    </div>
                </div>
            )}

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
                                <th className="px-6 py-4 min-w-[80px]">Tipo</th>
                                <th className="px-6 py-4 min-w-[150px]">Número</th>
                                <th className="px-6 py-4 min-w-[180px]">Emisor / Cliente</th>
                                <th className="px-6 py-4 min-w-[140px]">Categoría</th>
                                <th className="px-6 py-4 min-w-[120px]">Fecha</th>
                                <th className="px-6 py-4 min-w-[120px]">Total</th>
                                <th className="px-6 py-4 text-center min-w-[120px]">Origen</th>
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
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${(f.tipo || 'gasto') === 'ingreso'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                }`}>
                                                {(f.tipo || 'gasto') === 'ingreso' ? 'Ingreso' : 'Gasto'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-blue-600 dark:text-blue-400">{f.numero}</td>
                                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200 font-medium">
                                            {(f.tipo || 'gasto') === 'gasto' ? (f.emisorNombre || '—') : (f.clienteNombre || 'Sin cliente')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded-md border border-purple-100 dark:border-purple-800/30 font-medium">
                                                {f.categoria || 'otros'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                                            {new Date(f.fechaEmision).toLocaleDateString()}
                                        </td>
                                        <td className={`px-6 py-4 font-bold ${(f.tipo || 'gasto') === 'gasto'
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                            {(f.tipo || 'gasto') === 'gasto' ? '-' : '+'}{f.total?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </td>
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
                                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors"
                                                            onClick={() => {
                                                                setEditingFactura(f);
                                                                setActiveMenu(null);
                                                            }}
                                                        >
                                                            <Filter className="w-4 h-4 mr-3 text-amber-500" />
                                                            Editar Datos
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

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <span className="text-sm text-gray-500 font-medium dark:text-gray-400">
                            Página <span className="text-gray-900 dark:text-white">{page}</span> de {totalPages}
                            <span className="mx-2 text-gray-300">|</span>
                            Total: <span className="text-gray-900 dark:text-white">{total}</span> facturas
                        </span>
                        <div className="flex gap-1">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                Anterior
                            </button>

                            {/* Mostrar solo algunas páginas si hay muchas */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                                // Mostrar primera, última y alrededor de la actual
                                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${p === page
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                } else if (p === page - 2 || p === page + 2) {
                                    return <span key={p} className="px-1 text-gray-400">...</span>;
                                }
                                return null;
                            })}

                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
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

            {/* Modal de Edición */}
            {editingFactura && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 text-left">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Editar Factura</h3>
                            <p className="text-sm text-gray-500">Corrige los datos asignados a esta factura.</p>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4 text-left">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Empresa/Emisor</label>
                                <input
                                    type="text"
                                    value={editingFactura.emisorNombre || ''}
                                    onChange={(e) => setEditingFactura({ ...editingFactura, emisorNombre: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente Asignado</label>
                                <select
                                    value={editingFactura.clienteId || ''}
                                    onChange={(e) => setEditingFactura({ ...editingFactura, clienteId: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                >
                                    <option value="">Seleccionar cliente</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                                    <select
                                        value={editingFactura.estado || ''}
                                        onChange={(e) => setEditingFactura({ ...editingFactura, estado: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="pendiente">Pendiente</option>
                                        <option value="pagada">Pagada</option>
                                        <option value="vencida">Vencida</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                                    <select
                                        value={editingFactura.categoria || ''}
                                        onChange={(e) => setEditingFactura({ ...editingFactura, categoria: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="alimentación">Alimentación</option>
                                        <option value="telecomunicaciones">Telecomunicaciones</option>
                                        <option value="suministro eléctrico">Suministro Eléctrico</option>
                                        <option value="agua">Agua</option>
                                        <option value="ocio">Ocio</option>
                                        <option value="otros">Otros</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingFactura(null)}
                                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Crear Factura de Ingreso */}
            <CrearFacturaModal
                isOpen={crearFacturaOpen}
                onClose={() => setCrearFacturaOpen(false)}
                onCreated={() => {
                    fetchFacturas();
                    fetchClientes();
                }}
                clientes={clientes}
            />
        </div>
    );
};

export default Facturas;
