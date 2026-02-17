import React, { useState, useEffect } from 'react';
import {
    X,
    Plus,
    Trash2,
    Send,
    Loader2,
    Calculator,
    User,
    CalendarDays,
    FileText,
    CreditCard,
    Package
} from 'lucide-react';
import api from '../services/api';

interface ItemForm {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    impuesto: number;
    descuento: number;
    unidad: string;
}

interface NuevaFacturaForm {
    clienteId: string;
    clienteNombreNuevo: string;
    fechaEmision: string;
    fechaVencimiento: string;
    metodoPago: string;
    moneda: string;
    notas: string;
    items: ItemForm[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    clientes: any[];
}

const emptyItem: ItemForm = {
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    impuesto: 21,
    descuento: 0,
    unidad: 'ud',
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
    }).format(value);

const CrearFacturaModal: React.FC<Props> = ({ isOpen, onClose, onCreated, clientes }) => {
    const today = new Date().toISOString().split('T')[0];
    const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const [form, setForm] = useState<NuevaFacturaForm>({
        clienteId: '',
        clienteNombreNuevo: '',
        fechaEmision: today,
        fechaVencimiento: in30Days,
        metodoPago: 'transferencia',
        moneda: 'EUR',
        notas: '',
        items: [{ ...emptyItem }],
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useNewClient, setUseNewClient] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setForm({
                clienteId: '',
                clienteNombreNuevo: '',
                fechaEmision: today,
                fechaVencimiento: in30Days,
                metodoPago: 'transferencia',
                moneda: 'EUR',
                notas: '',
                items: [{ ...emptyItem }],
            });
            setError(null);
            setUseNewClient(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- Calculations ---
    const calculateItemTotal = (item: ItemForm) => {
        const base = item.cantidad * item.precioUnitario;
        const discount = base * (item.descuento / 100);
        const afterDiscount = base - discount;
        const tax = afterDiscount * (item.impuesto / 100);
        return afterDiscount + tax;
    };

    const subtotal = form.items.reduce((sum, item) => {
        const base = item.cantidad * item.precioUnitario;
        return sum + base - (base * (item.descuento / 100));
    }, 0);

    const totalImpuestos = form.items.reduce((sum, item) => {
        const base = item.cantidad * item.precioUnitario;
        const afterDiscount = base - (base * (item.descuento / 100));
        return sum + afterDiscount * (item.impuesto / 100);
    }, 0);

    const total = subtotal + totalImpuestos;

    // --- Handlers ---
    const updateItem = (index: number, field: keyof ItemForm, value: string | number) => {
        const newItems = [...form.items];
        (newItems[index] as any)[field] = value;
        setForm({ ...form, items: newItems });
    };

    const addItem = () => {
        setForm({ ...form, items: [...form.items, { ...emptyItem }] });
    };

    const removeItem = (index: number) => {
        if (form.items.length <= 1) return;
        const newItems = form.items.filter((_, i) => i !== index);
        setForm({ ...form, items: newItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validations
        if (!form.clienteId && !form.clienteNombreNuevo.trim()) {
            setError('Selecciona un cliente o introduce uno nuevo.');
            return;
        }

        if (form.items.length === 0 || form.items.every(it => !it.descripcion.trim())) {
            setError('Añade al menos un concepto con descripción.');
            return;
        }

        if (form.items.some(it => it.precioUnitario <= 0)) {
            setError('Todos los conceptos deben tener un precio mayor a 0.');
            return;
        }

        try {
            setSaving(true);

            // Create new client if needed
            let clienteId = form.clienteId;
            if (useNewClient && form.clienteNombreNuevo.trim()) {
                const clienteRes = await api.post('/clientes', {
                    nombre: form.clienteNombreNuevo.trim(),
                    email: '',
                    rfc: 'PENDIENTE',
                });
                clienteId = clienteRes.data.id;
            }

            const payload = {
                clienteId,
                tipo: 'ingreso',
                fechaEmision: form.fechaEmision,
                fechaVencimiento: form.fechaVencimiento,
                metodosPago: form.metodoPago,
                moneda: form.moneda,
                notas: form.notas,
                items: form.items.map(it => ({
                    descripcion: it.descripcion,
                    cantidad: Number(it.cantidad),
                    precioUnitario: Number(it.precioUnitario),
                    impuesto: Number(it.impuesto),
                    descuento: Number(it.descuento),
                    unidad: it.unidad,
                })),
            };

            await api.post('/facturas', payload);
            onCreated();
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al crear la factura';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                            <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nueva Factura de Ingreso</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Crea una factura para tu cliente</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="p-6 space-y-6">
                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* Cliente + Dates Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Cliente */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <User className="w-4 h-4" />
                                    Cliente
                                </label>
                                {!useNewClient ? (
                                    <div className="space-y-2">
                                        <select
                                            value={form.clienteId}
                                            onChange={e => setForm({ ...form, clienteId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                                        >
                                            <option value="">Seleccionar cliente...</option>
                                            {clientes.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setUseNewClient(true)}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            + Crear cliente nuevo
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={form.clienteNombreNuevo}
                                            onChange={e => setForm({ ...form, clienteNombreNuevo: e.target.value })}
                                            placeholder="Nombre del nuevo cliente"
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setUseNewClient(false); setForm({ ...form, clienteNombreNuevo: '' }); }}
                                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
                                        >
                                            ← Seleccionar existente
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        <CalendarDays className="w-4 h-4" />
                                        Emisión
                                    </label>
                                    <input
                                        type="date"
                                        value={form.fechaEmision}
                                        onChange={e => setForm({ ...form, fechaEmision: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        <CalendarDays className="w-4 h-4" />
                                        Vencimiento
                                    </label>
                                    <input
                                        type="date"
                                        value={form.fechaVencimiento}
                                        onChange={e => setForm({ ...form, fechaVencimiento: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment method + Currency */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <CreditCard className="w-4 h-4" />
                                    Método de pago
                                </label>
                                <select
                                    value={form.metodoPago}
                                    onChange={e => setForm({ ...form, metodoPago: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                >
                                    <option value="transferencia">Transferencia</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Moneda</label>
                                <select
                                    value={form.moneda}
                                    onChange={e => setForm({ ...form, moneda: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                >
                                    <option value="EUR">EUR (€)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="GBP">GBP (£)</option>
                                </select>
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <FileText className="w-4 h-4" />
                                    Notas
                                </label>
                                <input
                                    type="text"
                                    value={form.notas}
                                    onChange={e => setForm({ ...form, notas: e.target.value })}
                                    placeholder="Notas opcionales..."
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3 pt-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Conceptos</h3>
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        </div>

                        {/* Items */}
                        <div className="space-y-3">
                            {/* Header */}
                            <div className="hidden md:grid grid-cols-12 gap-2 text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold px-1">
                                <div className="col-span-4">Descripción</div>
                                <div className="col-span-1 text-center">Cant.</div>
                                <div className="col-span-2 text-center">Precio</div>
                                <div className="col-span-1 text-center">IVA %</div>
                                <div className="col-span-1 text-center">Dto %</div>
                                <div className="col-span-2 text-right">Total</div>
                                <div className="col-span-1"></div>
                            </div>

                            {form.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50"
                                >
                                    {/* Descripción */}
                                    <div className="col-span-1 md:col-span-4">
                                        <input
                                            type="text"
                                            value={item.descripcion}
                                            onChange={e => updateItem(index, 'descripcion', e.target.value)}
                                            placeholder="Descripción del servicio o producto"
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        />
                                    </div>
                                    {/* Cantidad */}
                                    <div className="col-span-1 md:col-span-1">
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={item.cantidad}
                                            onChange={e => updateItem(index, 'cantidad', Number(e.target.value))}
                                            className="w-full px-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        />
                                    </div>
                                    {/* Precio */}
                                    <div className="col-span-1 md:col-span-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.precioUnitario}
                                            onChange={e => updateItem(index, 'precioUnitario', Number(e.target.value))}
                                            placeholder="0.00"
                                            className="w-full px-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        />
                                    </div>
                                    {/* IVA */}
                                    <div className="col-span-1 md:col-span-1">
                                        <select
                                            value={item.impuesto}
                                            onChange={e => updateItem(index, 'impuesto', Number(e.target.value))}
                                            className="w-full px-1 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        >
                                            <option value={0}>0%</option>
                                            <option value={4}>4%</option>
                                            <option value={10}>10%</option>
                                            <option value={21}>21%</option>
                                        </select>
                                    </div>
                                    {/* Descuento */}
                                    <div className="col-span-1 md:col-span-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={item.descuento}
                                            onChange={e => updateItem(index, 'descuento', Number(e.target.value))}
                                            className="w-full px-1 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        />
                                    </div>
                                    {/* Total */}
                                    <div className="col-span-1 md:col-span-2 flex items-center justify-end">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(calculateItemTotal(item))}
                                        </span>
                                    </div>
                                    {/* Delete */}
                                    <div className="col-span-1 md:col-span-1 flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            disabled={form.items.length <= 1}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add Item */}
                            <button
                                type="button"
                                onClick={addItem}
                                className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Añadir concepto
                            </button>
                        </div>

                        {/* Totals */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Calculator className="w-4 h-4 text-gray-400" />
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resumen</h4>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">IVA</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(totalImpuestos)}</span>
                                </div>
                                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                                <div className="flex justify-between text-lg">
                                    <span className="font-bold text-gray-900 dark:text-white">Total</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {saving ? 'Creando...' : 'Crear Factura'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CrearFacturaModal;
