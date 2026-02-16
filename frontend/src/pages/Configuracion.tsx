import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, Brain, Key, Server, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const Configuracion = () => {
    const [config, setConfig] = useState<any>({
        monedaDefault: 'EUR',
        impuestoDefault: 21,
        prefijoFactura: 'FAC',
        iaProvider: 'auto',
        aiConfig: {
            geminiKey: '',
            groqKey: '',
            openrouterKey: '',
            selectedProvider: 'auto'
        }
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [iaStatus, setIaStatus] = useState<{ name: string; available: boolean }[]>([]);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const res = await api.get('/empresas');
            const empresa = res.data[0];
            if (empresa && empresa.configuracion) {
                setConfig({
                    ...empresa.configuracion,
                    aiConfig: empresa.configuracion.aiConfig || {
                        geminiKey: '',
                        groqKey: '',
                        openrouterKey: '',
                        selectedProvider: 'auto'
                    }
                });
            }
            fetchIAStatus();
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchIAStatus = async () => {
        try {
            const res = await api.get('/ia/status');
            setIaStatus(res.data.providers || []);
        } catch (error) {
            console.error('Error fetching IA status:', error);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.put('/empresas/config', config);
            alert('✅ Configuración guardada correctamente');
            fetchIAStatus();
        } catch (error) {
            console.error('Error saving config:', error);
            alert('❌ Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const handleTestIA = async () => {
        try {
            setTesting(true);
            const res = await api.post('/ia/test', { aiConfig: config.aiConfig });
            alert(`✅ Conexión exitosa!\nRespuesta: ${res.data.response}\nProveedor: ${res.data.provider}`);
            fetchIAStatus();
        } catch (error: any) {
            console.error('Error testing IA:', error);
            const msg = error.response?.data?.message || error.message;
            alert(`❌ Error de conexión: ${msg}`);
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 italic">Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Configuración del Sistema</h1>
                <p className="text-gray-500 dark:text-gray-400">Gestiona tus preferencias y conexiones de Inteligencia Artificial.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                            <Server className="w-5 h-5 mr-2 text-blue-500" />
                            Ajustes Generales
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Moneda por Defecto</label>
                            <input
                                type="text"
                                value={config.monedaDefault}
                                onChange={(e) => setConfig({ ...config, monedaDefault: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                placeholder="EUR, MXN, USD..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">IVA / Impuesto (%)</label>
                            <input
                                type="number"
                                value={config.impuestoDefault}
                                onChange={(e) => setConfig({ ...config, impuestoDefault: Number(e.target.value) })}
                                className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Prefijo Facturas</label>
                            <input
                                type="text"
                                value={config.prefijoFactura}
                                onChange={(e) => setConfig({ ...config, prefijoFactura: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                            <Brain className="w-5 h-5 mr-2 text-purple-500" />
                            Inteligencia Artificial (LLMs)
                        </h2>
                        <div className="flex gap-2">
                            {iaStatus.map(s => (
                                <span
                                    key={s.name}
                                    className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border ${s.available
                                        ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800'
                                        : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800'
                                        }`}
                                >
                                    {s.available ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    {s.name.toUpperCase()}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-3">Proveedor de IA Activo</label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {['auto', 'gemini', 'groq', 'ollama', 'openrouter'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setConfig({
                                            ...config,
                                            aiConfig: { ...config.aiConfig, selectedProvider: p }
                                        })}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${config.aiConfig.selectedProvider === p
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                                            : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                            }`}
                                    >
                                        {p.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <Key className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">Google Gemini API</h3>
                                </div>
                                <input
                                    type="password"
                                    value={config.aiConfig.geminiKey || ''}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        aiConfig: { ...config.aiConfig, geminiKey: e.target.value }
                                    })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white font-mono"
                                    placeholder="AIzaSy..."
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                        <Key className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">Groq Cloud API</h3>
                                </div>
                                <input
                                    type="password"
                                    value={config.aiConfig.groqKey || ''}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        aiConfig: { ...config.aiConfig, groqKey: e.target.value }
                                    })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 transition-all dark:text-white font-mono"
                                    placeholder="gsk_..."
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Key className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">OpenRouter (DeepSeek)</h3>
                                </div>
                                <input
                                    type="password"
                                    value={config.aiConfig.openrouterKey || ''}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        aiConfig: { ...config.aiConfig, openrouterKey: e.target.value }
                                    })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white font-mono"
                                    placeholder="sk-or-v1-..."
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                            <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                <strong>Nota:</strong> Si dejas el campo vacío, el sistema usará las claves del servidor (.env).
                            </p>
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleTestIA}
                        disabled={testing || saving}
                        className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                    >
                        {testing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Brain className="w-5 h-5 mr-2 text-purple-500" />}
                        Probar Conexión IA
                    </button>
                    <button
                        type="submit"
                        disabled={saving || testing}
                        className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 group"
                    >
                        {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />}
                        Guardar Configuración
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Configuracion;
