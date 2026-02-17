import axios from 'axios';


export interface AIConfigOverride {
    groqKey?: string;
    openaiKey?: string;
    openrouterKey?: string;
    minimaxKey?: string;
    selectedProvider?: string;
}

export class IAService {
    private static getOllamaConfig() {
        return {
            url: process.env.OLLAMA_URL || 'http://localhost:11434',
            model: process.env.OLLAMA_MODEL || 'llama3.2'
        };
    }



    private static getGroqConfig(override?: AIConfigOverride) {
        return {
            key: (override?.groqKey || process.env.GROQ_API_KEY)?.trim(),
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            url: 'https://api.groq.com/openai/v1/chat/completions'
        };
    }

    private static getMinimaxConfig(override?: AIConfigOverride) {
        return {
            key: (override?.minimaxKey || process.env.MINIMAX_API_KEY)?.trim(),
            model: process.env.MINIMAX_MODEL || 'M2-her',
            url: 'https://api.minimax.io/v1/text/chatcompletion_v2'
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

        // 1. Try Minimax
        if (!result && (!forcedProvider || forcedProvider === 'minimax' || forcedProvider === 'auto')) {
            const minimax = this.getMinimaxConfig(override);
            if (minimax.key) {
                try {
                    const response = await axios.post(minimax.url, {
                        model: minimax.model,
                        messages: [
                            { role: 'system', name: 'MM Intelligent Assistant', content: systemPrompt },
                            { role: 'user', name: 'User', content: prompt }
                        ],
                        stream: false,
                        max_tokens: 2000
                    }, {
                        headers: {
                            'Authorization': `Bearer ${minimax.key}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    });

                    // Minimax v2 response structure: choices[0].message.content
                    let content = '';
                    if (response.data.choices && response.data.choices.length > 0) {
                        content = response.data.choices[0].message.content;
                    } else if (response.data.base_resp && response.data.base_resp.status_msg) {
                        throw new Error(`Minimax Error: ${response.data.base_resp.status_msg}`);
                    }

                    if (content) {
                        result = { response: content, provider: `minimax (${minimax.model})` };
                    }
                } catch (error: any) {
                    const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
                    console.error('❌ Error en Minimax:', errorMsg);
                    if (forcedProvider === 'minimax') throw error;
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
                        },
                        timeout: 30000
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
            const orKey = override?.openrouterKey || process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
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
            throw new Error(`Error de IA: No se pudo obtener respuesta de ningún proveedor (Groq, Minimax, OpenRouter u Ollama). Por favor, verifica tus claves API en la configuración.`);
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

        // Check Minimax
        try {
            const minimax = this.getMinimaxConfig(override);
            if (!minimax.key) throw new Error();
            await axios.post(minimax.url, {
                model: minimax.model,
                messages: [
                    { role: 'system', name: 'MM Intelligent Assistant', content: 'You are a test assistant.' },
                    { role: 'user', name: 'User', content: 'ping' }
                ],
                max_tokens: 1
            }, {
                headers: { 'Authorization': `Bearer ${minimax.key}` },
                timeout: 5000
            });
            status.push({ name: 'minimax', available: true });
        } catch {
            status.push({ name: 'minimax', available: false });
        }

        // Check Ollama
        try {
            await axios.get(`${ollama.url}/api/tags`, { timeout: 2000 });
            status.push({ name: 'ollama', available: true });
        } catch {
            status.push({ name: 'ollama', available: false });
        }

        // Check OpenRouter
        const orKey = override?.openrouterKey || process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
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
