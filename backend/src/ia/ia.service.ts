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

    private static initGoogleAI() {
        const key = this.getGeminiKey();
        if (key && !this.googleAI) {
            this.googleAI = new GoogleGenerativeAI(key);
        }
        return this.googleAI;
    }

    static async chat(prompt: string, context: string = ''): Promise<{ response: string; provider: string }> {
        const systemPrompt = `Eres un asistente experto en contabilidad y finanzas para el sistema de facturas. 
    Usa la siguiente información del sistema para responder preguntas con precisión:
    ${context}
    
    Responde de forma concisa y profesional. Si no sabes algo basado en el contexto, indícalo.`;

        const fullPrompt = `${systemPrompt}\n\nUsuario: ${prompt}`;

        // Prefer Gemini if available
        const ai = this.initGoogleAI();
        if (ai) {
            try {
                const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const result = await model.generateContent(fullPrompt);
                return { response: result.response.text(), provider: 'gemini' };
            } catch (error) {
                console.error('Error calling Gemini API, falling back to local Ollama:', error);
            }
        }

        // Fallback to Ollama
        const ollama = this.getOllamaConfig();
        try {
            const response = await axios.post(`${ollama.url}/api/generate`, {
                model: ollama.model,
                prompt: fullPrompt,
                stream: false
            });
            return { response: response.data.response, provider: 'ollama' };
        } catch (error) {
            console.error('Error calling Ollama:', error);
            throw new Error('No hay proveedores de IA disponibles. Verifica GEMINI_API_KEY o el servicio Ollama local.');
        }
    }

    static async checkStatus(): Promise<{ name: string; available: boolean }[]> {
        const status = [];
        const ollama = this.getOllamaConfig();

        // Check Gemini
        status.push({ name: 'gemini', available: !!this.getGeminiKey() });

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
