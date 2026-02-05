jest.mock('chokidar', () => ({
    watch: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis(),
    }),
}));

jest.mock('../ia/ia.service', () => ({
    IAService: {
        chat: jest.fn()
    }
}));

jest.mock('../database', () => ({
    Database: {
        read: jest.fn(),
        saveToCollection: jest.fn(),
        write: jest.fn()
    }
}));

// Mock pdf-parse
jest.mock('pdf-parse', () => {
    return jest.fn().mockResolvedValue({ text: 'Texto de prueba de la factura' });
});

import { IngestionService } from '../ia/ingestion.service';
import { IAService } from '../ia/ia.service';
import { Database } from '../database';

describe('AI Extraction & Ingestion Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should correctly parse AI response and save to database', async () => {
        const mockInvoiceData = {
            numero: "INV-001",
            clienteNombre: "Cliente de Prueba",
            fecha: "2023-10-27",
            total: 1160,
            moneda: "MXN",
            items: [{ descripcion: "Item 1", cantidad: 1, precio: 1000 }]
        };

        (IAService.chat as jest.Mock).mockResolvedValue({
            response: JSON.stringify(mockInvoiceData)
        });

        (Database.read as jest.Mock).mockResolvedValue({
            clientes: [],
            empresas: [{ id: 'empresa-1' }],
            facturas: []
        });

        const buffer = Buffer.from('fake pdf content');
        const result = await IngestionService.processInvoiceFromBuffer(buffer, 'test.pdf');

        expect(result.numero).toBe("INV-001");
        expect(result.total).toBe(1160);
        expect(Database.saveToCollection).toHaveBeenCalledWith('clientes', expect.any(Object));
        expect(Database.saveToCollection).toHaveBeenCalledWith('facturas', expect.any(Object));
    });

    it('should handle malformed JSON from AI with cleaned markers', async () => {
        const mockRawResponse = "```json\n" + JSON.stringify({
            numero: "INV-MARKER",
            clienteNombre: "Cliente Marker",
            fecha: "2023-10-27",
            total: 500,
            items: []
        }) + "\n```";

        (IAService.chat as jest.Mock).mockResolvedValue({
            response: mockRawResponse
        });

        (Database.read as jest.Mock).mockResolvedValue({
            clientes: [{ id: 'c1', nombre: 'Cliente Marker' }],
            empresas: [{ id: 'empresa-1' }],
            facturas: []
        });

        const buffer = Buffer.from('fake pdf content');
        const result = await IngestionService.processInvoiceFromBuffer(buffer, 'test-markers.pdf');

        expect(result.numero).toBe("INV-MARKER");
        // Should NOT call saveToCollection for clients because it already exists
        expect(Database.saveToCollection).not.toHaveBeenCalledWith('clientes', expect.any(Object));
        expect(Database.saveToCollection).toHaveBeenCalledWith('facturas', expect.any(Object));
    });
});
