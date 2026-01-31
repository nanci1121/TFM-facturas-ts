import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BrainCircuit } from 'lucide-react';
import api from '../services/api';

const IAChat = () => {
    const [messages, setMessages] = useState<any[]>([
        { role: 'bot', content: '¡Hola! Soy tu asistente contable con IA. ¿En qué puedo ayudarte hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<any>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        api.get('/ia/status').then(res => setStatus(res.data)).catch(console.error);
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const res = await api.post('/ia/chat', { message: userMessage });
            setMessages(prev => [
                ...prev,
                { role: 'bot', content: res.data.response, provider: res.data.provider }
            ]);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                { role: 'bot', content: 'Lo siento, hubo un error al procesar tu solicitud.' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center space-x-2">
                    <BrainCircuit className="w-6 h-6 text-blue-600" />
                    <h2 className="font-bold text-gray-800 dark:text-white">IA Assistant</h2>
                </div>
                {status && (
                    <div className="flex space-x-2">
                        {status.providers.map((p: any) => (
                            <span key={p.name} className={`text-[10px] px-2 py-0.5 rounded-full border ${p.available ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                {p.name.toUpperCase()}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] flex items-start space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <div className={`p-2 rounded-full ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'}`}>
                                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                {msg.provider && (
                                    <span className="text-[9px] opacity-50 block mt-1">Vía: {msg.provider}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-2xl rounded-tl-none">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 dark:border-gray-700 flex space-x-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pregunta algo sobre tus facturas..."
                    className="flex-1 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-xl transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default IAChat;
