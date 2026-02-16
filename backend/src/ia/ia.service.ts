import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIConfigOverride {
    geminiKey?: string;
    groqKey?: string;
    openaiKey?: string;
    openrouterKey?: string;
    selectedProvider?: string;
}

export class IAService {
    private static getOllamaConfig() {
        return {
            url: process.env.OLLAMA_URL || 'http://localhost:11434',
            model: process.env.OLLAMA_MODEL || 'llama3.2'
        };
    }

    private static getGeminiKey(override?: AIConfigOverride) {
        return override?.geminiKey || process.env.GEMINI_API_KEY;
    }

    private static getGroqConfig(override?: AIConfigOverride) {
        return {
            key: (override?.groqKey || process.env.GROQ_API_KEY)?.trim(),
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            url: 'https://api.groq.com/openai/v1/chat/completions'
        };
    }

    private static lastInteraction: { prompt: string; response: string; provider: string } | null = null;

    static async chat(prompt: string, context: string = '', override?: AIConfigOverride): Promise<{ response: string; provider: string }> {
        const systemPrompt = `Eres un asistente experto en contabilidad y finanzas para el sistema de facturas. 
        Usa la siguiente información del sistema para responder preguntas con precisión:
        ${context}
        
        Responde de forma concisa y profesional. Si no sabes algo basado en el contexto, indícalo.`;

        const fullPrompt = `${systemPrompt}\n\nUsuario: ${prompt}`;
        let result: { response: string; provider: string } | null = null;
        const forcedProvider = override?.selectedProvider;

        // 1. Try Gemini
        if (!result && (!forcedProvider || forcedProvider === 'gemini' || forcedProvider === 'auto')) {
            const geminiKey = this.getGeminiKey(override)?.trim();
            if (geminiKey) {
                try {
                    const genAI = new GoogleGenerativeAI(geminiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
                    const geminiResult = await model.generateContent(fullPrompt);
                    result = { response: geminiResult.response.text(), provider: 'gemini' };
                } catch (error) {
                    console.error('❌ Error en Gemini:', error);
                    if (forcedProvider === 'gemini') throw error;
                }
            }
        }

        // 2. Try Groq
        if (!result && (!forcedProvider || forcedProvider === 'groq' || forcedProvider === 'auto')) {
            const groq = this.getGroqConfig(override);
            if (groq.key) {
                try {
                    const response = await axios.post(groq.url, {
                        model: groq.model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.7
                    }, {
                        headers: {
                            'Authorization': `Bearer ${groq.key}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    result = { response: response.data.choices[0].message.content, provider: `groq (${groq.model})` };
                } catch (error: any) {
                    console.error('❌ Error en Groq:', error.response?.data || error.message);
                    if (forcedProvider === 'groq') throw error;
                }
            }
        }

        // 3. Try OpenRouter (DeepSeek)
        if (!result && (!forcedProvider || forcedProvider === 'openrouter' || forcedProvider === 'auto')) {
            const orKey = override?.openrouterKey || process.env.OPENROUTER_API_KEY;
            if (orKey) {
                try {
                    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                        model: 'deepseek/deepseek-chat',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt }
                        ]
                    }, {
                        headers: {
                            'Authorization': `Bearer ${orKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'http://localhost:3000',
                            'X-Title': 'FacturaIA Project'
                        },
                        timeout: 30000
                    });
                    result = { response: response.data.choices[0].message.content, provider: 'openrouter (deepseek)' };
                } catch (error: any) {
                    const errorDetail = error.response?.data?.error?.message || error.response?.data || error.message;
                    console.error('❌ Error en OpenRouter:', errorDetail);
                    if (forcedProvider === 'openrouter') {
                        throw new Error(`OpenRouter Error: ${errorDetail}`);
                    }
                }
            }
        }

        // 4. Fallback to Ollama
        if (!result && (!forcedProvider || forcedProvider === 'ollama' || forcedProvider === 'auto')) {
            const ollama = this.getOllamaConfig();
            try {
                const response = await axios.post(`${ollama.url}/api/generate`, {
                    model: ollama.model,
                    prompt: fullPrompt,
                    stream: false
                });
                result = { response: response.data.response, provider: `ollama (${ollama.model})` };
            } catch (error) {
                console.error('Error calling Ollama:', error);
                if (forcedProvider === 'ollama') throw error;
            }
        }

        if (!result) {
            throw new Error(`Error de IA: No se pudo obtener respuesta de ningún proveedor (Gemini, Groq, OpenRouter u Ollama). Por favor, verifica tus claves API en la configuración.`);
        }

        this.lastInteraction = { prompt: fullPrompt, response: result.response, provider: result.provider };
        return result;
    }

    static getLastInteraction() {
        return this.lastInteraction;
    }

    static async checkStatus(override?: AIConfigOverride): Promise<{ name: string; available: boolean }[]> {
        const status = [];
        const ollama = this.getOllamaConfig();
        const groq = this.getGroqConfig(override);
        const geminiKey = this.getGeminiKey(override);

        // Check Gemini
        try {
            if (!geminiKey) throw new Error();
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
            await model.generateContent("ping");
            status.push({ name: 'gemini', available: true });
        } catch {
            status.push({ name: 'gemini', available: false });
        }

        // Check Groq
        try {
            if (!groq.key) throw new Error();
            await axios.post(groq.url, {
                model: groq.model,
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 1
            }, {
                headers: { 'Authorization': `Bearer ${groq.key}` },
                timeout: 3000
            });
            status.push({ name: 'groq', available: true });
        } catch {
            status.push({ name: 'groq', available: false });
        }

        // Check Ollama
        try {
            await axios.get(`${ollama.url}/api/tags`, { timeout: 2000 });
            status.push({ name: 'ollama', available: true });
        } catch {
            status.push({ name: 'ollama', available: false });
        }

        // Check OpenRouter
        const orKey = override?.openrouterKey || process.env.OPENROUTER_API_KEY;
        if (orKey) {
            try {
                await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model: 'deepseek/deepseek-chat',
                    messages: [{ role: 'user', content: 'ping' }],
                    max_tokens: 1
                }, {
                    headers: { 'Authorization': `Bearer ${orKey}` },
                    timeout: 5000
                });
                status.push({ name: 'openrouter', available: true });
            } catch {
                status.push({ name: 'openrouter', available: false });
            }
        } else {
            status.push({ name: 'openrouter', available: false });
        }

        return status;
    }
}
