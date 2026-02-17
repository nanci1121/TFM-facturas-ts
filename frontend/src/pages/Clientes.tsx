import React, { useEffect, useState, useMemo } from 'react';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    MoreVertical,
    Loader2,
    Building2,
    Mail,
    Phone,
    MapPin,
    Send,
    Receipt,
    X,
    Edit3,
    Trash2,
    TrendingUp,
    TrendingDown,
    User,
    FileText,
    Package
} from 'lucide-react';
import api from '../services/api';

interface ContactoForm {
    nombre: string;
    rfc: string;
    email: string;
    telefono: string;
    direccion: string;
    contacto: string;
    notas: string;
    tipo: 'cliente' | 'proveedor';
}

const emptyForm: ContactoForm = {
    nombre: '',
    rfc: '',
    email: '',
    telefono: '',
    direccion: '',
    contacto: '',
    notas: '',
    tipo: 'cliente',
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);

const Clientes = () => {
    const [contactos, setContactos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTipo, setFilterTipo] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ContactoForm>({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchContactos = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filterTipo) params.tipo = filterTipo;
            if (searchTerm) params.search = searchTerm;

            const res = await api.get('/contactos', { params });
            setContactos(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching contactos:', error);
            setContactos([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/contactos/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchContactos();
        fetchStats();
    }, [filterTipo, searchTerm]);

    // Close menu on outside click
    useEffect(() => {
        const handleClick = () => setActiveMenu(null);
        if (activeMenu) document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [activeMenu]);

    const openCreateModal = (tipo: 'cliente' | 'proveedor') => {
        setForm({ ...emptyForm, tipo });
        setEditingId(null);
        setFormError(null);
        setModalOpen(true);
    };

    const openEditModal = (contacto: any) => {
        setForm({
            nombre: contacto.nombre || '',
            rfc: contacto.rfc || '',
            email: contacto.email || '',
            telefono: contacto.telefono || '',
            direccion: contacto.direccion || '',
            contacto: contacto.contacto || '',
            notas: contacto.notas || '',
            tipo: contacto.tipo || 'cliente',
        });
        setEditingId(contacto.id);
        setFormError(null);
        setModalOpen(true);
        setActiveMenu(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!form.nombre.trim()) {
            setFormError('El nombre es obligatorio.');
            return;
        }

        try {
            setSaving(true);
            if (editingId) {
                await api.put(`/contactos/${editingId}`, form);
            } else {
                await api.post('/contactos', form);
            }
            setModalOpen(false);
            fetchContactos();
            fetchStats();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/contactos/${id}`);
            setDeleteConfirm(null);
            setActiveMenu(null);
            fetchContactos();
            fetchStats();
        } catch (error) {
            console.error('Error deleting contact:', error);
            alert('Error al eliminar el contacto');
        }
    };

    const filteredContactos = contactos;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Clientes y Proveedores</h2>
                    <p className="text-gray-500 text-sm">Gestiona tu directorio de contactos comerciales.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => openCreateModal('proveedor')}
                        className="flex items-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-colors font-medium"
                    >
                        <Package className="w-4 h-4 mr-2" />
                        Nuevo Proveedor
                    </button>
                    <button
                        onClick={() => openCreateModal('cliente')}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700">
                                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</span>
                        </div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</div>
                        <p className="text-xs text-gray-400 mt-1">contactos activos</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                                <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clientes</span>
                        </div>
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.totalClientes}</div>
                        <p className="text-xs text-gray-400 mt-1">a quienes facturas</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                                <Receipt className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proveedores</span>
                        </div>
                        <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats.totalProveedores}</div>
                        <p className="text-xs text-gray-400 mt-1">quienes te facturan</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Facturado</span>
                        </div>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.totalFacturadoClientes)}</div>
                        <p className="text-xs text-gray-400 mt-1">ingresos totales</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-4">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {[
                        { value: '', label: 'Todos' },
                        { value: 'cliente', label: '📤 Clientes' },
                        { value: 'proveedor', label: '📥 Proveedores' },
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
                <div className="flex-1" />
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, NIF o email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-4 py-3 w-24">Tipo</th>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3 w-28">NIF/CIF</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3 w-36">Teléfono</th>
                                <th className={`px-6 py-4 text-right transition-all duration-300 ease-in-out ${activeMenu ? 'w-60' : 'w-24'}`}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                                        <p className="text-gray-400 text-sm mt-2">Cargando contactos...</p>
                                    </td>
                                </tr>
                            ) : filteredContactos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-400 text-sm font-medium">No hay contactos</p>
                                        <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">
                                            {searchTerm ? 'Prueba con otra búsqueda' : 'Crea tu primer cliente o proveedor'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredContactos.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${c.tipo === 'proveedor'
                                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {c.tipo === 'proveedor' ? 'Proveedor' : 'Cliente'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${c.tipo === 'proveedor'
                                                    ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                                    }`}>
                                                    {c.nombre?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{c.nombre}</div>
                                                    {c.direccion && (
                                                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate">{c.direccion}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 font-mono">
                                            {c.rfc || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {c.email ? (
                                                <a href={`mailto:${c.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate max-w-[200px]">
                                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{c.email}</span>
                                                </a>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {c.telefono ? (
                                                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap">
                                                    <Phone className="w-3 h-3 flex-shrink-0" />
                                                    {c.telefono}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className={`px-6 py-4 text-right relative overflow-visible transition-all duration-300 ease-in-out ${activeMenu ? 'w-60' : 'w-24'}`}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === c.id ? null : c.id);
                                                }}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-5 h-5 text-gray-400" />
                                            </button>

                                            {activeMenu === c.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden translate-y-0 opacity-100">
                                                    <div className="py-1">
                                                        <button
                                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors"
                                                            onClick={() => openEditModal(c)}
                                                        >
                                                            <Edit3 className="w-4 h-4 mr-3 text-blue-500" />
                                                            Editar
                                                        </button>
                                                        <button
                                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center border-t border-gray-50 dark:border-gray-700 transition-colors"
                                                            onClick={() => {
                                                                setDeleteConfirm(c.id);
                                                                setActiveMenu(null);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-3" />
                                                            Eliminar
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

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden">
                        {/* Header */}
                        <div className={`flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 ${form.tipo === 'proveedor'
                            ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${form.tipo === 'proveedor'
                                    ? 'bg-orange-100 dark:bg-orange-900/30'
                                    : 'bg-blue-100 dark:bg-blue-900/30'
                                    }`}>
                                    {form.tipo === 'proveedor'
                                        ? <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        : <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    }
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {editingId ? 'Editar' : 'Nuevo'} {form.tipo === 'proveedor' ? 'Proveedor' : 'Cliente'}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {form.tipo === 'proveedor' ? 'Empresa que te factura' : 'Empresa a la que facturas'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {formError && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                                    {formError}
                                </div>
                            )}

                            {/* Tipo toggle */}
                            <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, tipo: 'cliente' })}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${form.tipo === 'cliente'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    📤 Cliente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, tipo: 'proveedor' })}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${form.tipo === 'proveedor'
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    📥 Proveedor
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <Building2 className="w-4 h-4" />
                                    Nombre / Razón social *
                                </label>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                                    placeholder="Nombre de la empresa o persona"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        <FileText className="w-4 h-4" />
                                        NIF / CIF
                                    </label>
                                    <input
                                        type="text"
                                        value={form.rfc}
                                        onChange={e => setForm({ ...form, rfc: e.target.value })}
                                        placeholder="B12345678"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        placeholder="contacto@empresa.com"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        <Phone className="w-4 h-4" />
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.telefono}
                                        onChange={e => setForm({ ...form, telefono: e.target.value })}
                                        placeholder="+34 612 345 678"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        <User className="w-4 h-4" />
                                        Persona de contacto
                                    </label>
                                    <input
                                        type="text"
                                        value={form.contacto}
                                        onChange={e => setForm({ ...form, contacto: e.target.value })}
                                        placeholder="Juan García"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <MapPin className="w-4 h-4" />
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    value={form.direccion}
                                    onChange={e => setForm({ ...form, direccion: e.target.value })}
                                    placeholder="Calle, número, CP, ciudad"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notas</label>
                                <textarea
                                    value={form.notas}
                                    onChange={e => setForm({ ...form, notas: e.target.value })}
                                    placeholder="Notas internas sobre este contacto..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                                />
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`flex items-center gap-2 px-6 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-60 ${form.tipo === 'proveedor'
                                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/25'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
                                        }`}
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : editingId ? (
                                        <Edit3 className="w-4 h-4" />
                                    ) : (
                                        <UserPlus className="w-4 h-4" />
                                    )}
                                    {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-7 h-7 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">¿Eliminar contacto?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Este contacto será desactivado. Las facturas asociadas no se verán afectadas.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clientes;
