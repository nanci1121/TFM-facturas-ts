import { RAGService } from '../ia/rag.service';
import { Database } from '../database';
import { IAService } from '../ia/ia.service';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('../database', () => ({
    Database: {
        read: jest.fn()
    }
}));

jest.mock('axios');
jest.mock('@google/generative-ai');

describe('Deep Dive: AI & RAG Integration', () => {

    describe('RAGService: Context Generation', () => {
        const empresaId = 'test-company-123';

        it('should correctly aggregate financial data into context', async () => {
            const mockDb = {
                clientes: [
                    { id: 'c1', nombre: 'Cliente A', empresaId },
                    { id: 'c2', nombre: 'Cliente B', empresaId }
                ],
                facturas: [
                    { id: 'f1', empresaId, clienteId: 'c1', total: 1000, estado: 'pagada', numero: 'A-1' },
                    { id: 'f2', empresaId, clienteId: 'c2', total: 500, estado: 'pendiente', numero: 'A-2' },
                    { id: 'f3', empresaId, clienteId: 'c1', total: 200, estado: 'vencida', numero: 'A-3' }
                ],
                empresas: [{ id: empresaId, nombre: 'Empresa Test' }]
            };

            (Database.read as jest.Mock).mockResolvedValue(mockDb);

            const context = await RAGService.getContextForCompany(empresaId);

            // Total facturado: 1000 + 500 + 200 = 1700
            expect(context).toContain('Total facturado: 1700');
            // Pendiente: 500
            expect(context).toContain('Saldo pendiente de cobro: 500');
            // Vencido: 200
            expect(context).toContain('Saldo vencido: 200');
            expect(context).toContain('Total de clientes: 2');
            expect(context).toContain('Cliente A');
            expect(context).toContain('Factura A-3 para Cliente A por 200 (vencida)');
        });

        it('should handle companies with no data gracefully', async () => {
            (Database.read as jest.Mock).mockResolvedValue({
                clientes: [],
                facturas: [],
                empresas: []
            });

            const context = await RAGService.getContextForCompany('unknown-co');
            expect(context).toContain('Total facturado: 0');
            expect(context).toContain('Total de clientes: 0');
        });
    });

    describe('IAService: Prompt Construction & Fallback', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            delete process.env.GEMINI_API_KEY; // Default to no key
        });

        it('should use Ollama if Gemini key is missing', async () => {
            const mockPrompt = '¿Cuánto debo?';
            const mockContext = 'Pendiente: 500';

            (axios.post as jest.Mock).mockResolvedValue({
                data: { response: 'Debes 500 pesos' }
            });

            const result = await IAService.chat(mockPrompt, mockContext);

            expect(result.provider).toMatch(/ollama/);
            expect(result.response).toBe('Debes 500 pesos');
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/api/generate'),
                expect.objectContaining({
                    prompt: expect.stringContaining(mockContext),
                })
            );
        });

        it('should prefer Gemini and fallback to Ollama on failure', async () => {
            process.env.GEMINI_API_KEY = 'fake-key';

            // Mock Gemini to fail
            const mockGenerateContent = jest.fn().mockRejectedValue(new Error('Gemini API Error'));
            (GoogleGenerativeAI as any).mockImplementation(() => ({
                getGenerativeModel: () => ({ generateContent: mockGenerateContent })
            }));

            // Mock Ollama to succeed
            (axios.post as jest.Mock).mockResolvedValue({
                data: { response: 'Respuesta de Ollama' }
            });

            const result = await IAService.chat('Hola', 'Contexto');

            expect(result.provider).toMatch(/ollama/);
            expect(mockGenerateContent).toHaveBeenCalled();
            expect(result.response).toBe('Respuesta de Ollama');
        });

        it('should construct a robust system prompt with the provided context', async () => {
            (axios.post as jest.Mock).mockResolvedValue({ data: { response: 'ok' } });

            await IAService.chat('Query', 'Dato financiero crucial');

            const lastCall = (axios.post as jest.Mock).mock.calls[0];
            const fullPromptSent = lastCall[1].prompt;

            expect(fullPromptSent).toContain('Eres un asistente experto');
            expect(fullPromptSent).toContain('Dato financiero crucial');
            expect(fullPromptSent).toContain('concisa y profesional');
        });
    });
});
