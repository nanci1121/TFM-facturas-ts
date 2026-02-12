import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class IAService {
    private static googleAI: GoogleGenerativeAI | null = null;

    private static getOllamaConfig() {
        return {
            url: process.env.OLLAMA_URL || 'http://localhost:11434',
            model: process.env.OLLAMA_MODEL || 'llama3.2'
        };
    }

    private static getGeminiKey() {
        return process.env.GEMINI_API_KEY;
    }

    private static getGroqConfig() {
        return {
            key: process.env.GROQ_API_KEY,
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            url: 'https://api.groq.com/openai/v1/chat/completions'
        };
    }

    private static initGoogleAI() {
        const key = this.getGeminiKey();
        if (key && !this.googleAI) {
            this.googleAI = new GoogleGenerativeAI(key);
        }
        return this.googleAI;
    }

    private static lastInteraction: { prompt: string; response: string; provider: string } | null = null;

    static async chat(prompt: string, context: string = ''): Promise<{ response: string; provider: string }> {
        console.log('>>> IAService.chat CALLED');
        const systemPrompt = `Eres un asistente experto en contabilidad y finanzas para el sistema de facturas. 
    Usa la siguiente información del sistema para responder preguntas con precisión:
    ${context}
    
    Responde de forma concisa y profesional. Si no sabes algo basado en el contexto, indícalo.`;

        const fullPrompt = `${systemPrompt}\n\nUsuario: ${prompt}`;

        let result: { response: string; provider: string } | null = null;

        // 1. Prefer Gemini if available
        const ai = this.initGoogleAI();
        if (ai) {
            console.log('🤖 Intentando con Gemini...');
            try {
                const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const geminiResult = await model.generateContent(fullPrompt);
                result = { response: geminiResult.response.text(), provider: 'gemini' };
            } catch (error) {
                console.error('❌ Error en Gemini:', error);
            }
        }

        // 2. Then try Groq
        if (!result) {
            const groq = this.getGroqConfig();
            console.log('DEBUG: Groq handle check:', { hasKey: !!groq.key, keyLength: groq.key?.length });
            if (groq.key) {
                console.log(`🤖 Intentando con Groq (Modelo: ${groq.model})...`);
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
                    console.log(`✅ Respuesta recibida de Groq (${response.data.choices[0].message.content.length} chars)`);
                    result = { response: response.data.choices[0].message.content, provider: `groq (${groq.model})` };
                } catch (error: any) {
                    console.error('❌ Error en Groq:', error.response?.data || error.message);
                }
            }
        }

        // 3. Fallback to Ollama
        if (!result) {
            console.log('🤖 Intentando con Ollama (Local)...');
            const ollama = this.getOllamaConfig();
            try {
                const response = await axios.post(`${ollama.url}/api/generate`, {
                    model: ollama.model,
                    prompt: fullPrompt,
                    stream: false
                });
                console.log(`✅ Respuesta recibida de Ollama (${response.data.response.length} chars)`);
                result = { response: response.data.response, provider: `ollama (${ollama.model})` };
            } catch (error) {
                console.error('Error calling Ollama:', error);
                throw new Error('IA_ERROR_M_1: No hay proveedores de IA disponibles. Verifica GEMINI_API_KEY, GROQ_API_KEY o el servicio Ollama local.');
            }
        }

        this.lastInteraction = { prompt: fullPrompt, response: result.response, provider: result.provider };
        return result;
    }

    static getLastInteraction() {
        return this.lastInteraction;
    }

    static async checkStatus(): Promise<{ name: string; available: boolean }[]> {
        const status = [];
        const ollama = this.getOllamaConfig();
        const groq = this.getGroqConfig();

        // Check Gemini
        status.push({ name: 'gemini', available: !!this.getGeminiKey() });

        // Check Groq
        status.push({ name: 'groq', available: !!groq.key });

        // Check Ollama
        try {
            await axios.get(`${ollama.url}/api/tags`, { timeout: 2000 });
            status.push({ name: 'ollama', available: true });
        } catch {
            status.push({ name: 'ollama', available: false });
        }

        return status;
    }
}

