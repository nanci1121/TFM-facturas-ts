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

// Mock Prisma instead of Database
jest.mock('../database/db', () => ({
    prisma: {
        empresa: {
            findFirst: jest.fn(),
            findUnique: jest.fn()
        },
        cliente: {
            findFirst: jest.fn(),
            create: jest.fn()
        },
        factura: {
            findFirst: jest.fn(),
            create: jest.fn()
        }
    }
}));

// Mock pdf-parse
jest.mock('pdf-parse', () => {
    return {
        PDFParse: jest.fn().mockImplementation(() => ({
            getText: jest.fn().mockResolvedValue({ text: 'Texto de prueba de la factura' })
        }))
    };
});

import { IngestionService } from '../ia/ingestion.service';
import { IAService } from '../ia/ia.service';
import { prisma } from '../database/db';

describe('AI Extraction & Ingestion Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should correctly parse AI response and save to database', async () => {
        const mockInvoiceData = {
            numero: "INV-001",
            emisorNombre: "Emisor Test",
            clienteNombre: "Cliente de Prueba",
            fecha: "2023-10-27",
            total: 1160,
            moneda: "MXN",
            items: [{ descripcion: "Item 1", cantidad: 1, precio: 1000 }]
        };

        (IAService.chat as jest.Mock).mockResolvedValue({
            response: JSON.stringify(mockInvoiceData),
            provider: 'test-provider'
        });

        // Mock Prisma calls
        (prisma.empresa.findFirst as jest.Mock).mockResolvedValue({
            id: 'empresa-1',
            nombre: 'Test Company',
            configuracion: {}
        } as any);

        (prisma.cliente.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.cliente.create as jest.Mock).mockResolvedValue({
            id: 'cliente-1',
            empresaId: 'empresa-1',
            nombre: 'Cliente de Prueba',
            rfc: 'PENDIENTE',
            email: '',
            activo: true
        } as any);

        (prisma.factura.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.factura.create as jest.Mock).mockResolvedValue({
            id: 'factura-1',
            empresaId: 'empresa-1',
            clienteId: 'cliente-1',
            numero: mockInvoiceData.numero,
            fechaEmision: new Date(mockInvoiceData.fecha),
            total: mockInvoiceData.total,
            moneda: mockInvoiceData.moneda,
            items: mockInvoiceData.items,
            estado: 'pendiente',
            tipo: 'gasto'
        } as any);

        const buffer = Buffer.from('fake pdf content');
        const result = await IngestionService.processInvoiceFromBuffer(buffer, 'test.pdf');

        expect(result.invoice.numero).toBe("INV-001");
        expect(result.invoice.total).toBe(1160);
        expect(prisma.cliente.create).toHaveBeenCalled();
        expect(prisma.factura.create).toHaveBeenCalled();
    });

    it('should handle malformed JSON from AI with cleaned markers', async () => {
        const mockRawResponse = "```json\n" + JSON.stringify({
            numero: "INV-MARKER",
            emisorNombre: "Emisor Marker",
            clienteNombre: "Cliente Marker",
            fecha: "2023-10-27",
            total: 500,
            items: []
        }) + "\n```";

        (IAService.chat as jest.Mock).mockResolvedValue({
            response: mockRawResponse,
            provider: 'test-provider'
        });

        (prisma.empresa.findFirst as jest.Mock).mockResolvedValue({
            id: 'empresa-1',
            nombre: 'Test Company',
            configuracion: {}
        } as any);

        (prisma.cliente.findFirst as jest.Mock).mockResolvedValue({
            id: 'c1',
            nombre: 'Cliente Marker',
            empresaId: 'empresa-1'
        } as any);

        (prisma.factura.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.factura.create as jest.Mock).mockResolvedValue({
            id: 'factura-1',
            empresaId: 'empresa-1',
            clienteId: 'c1',
            numero: "INV-MARKER",
            fechaEmision: new Date(),
            total: 500
        } as any);

        const buffer = Buffer.from('fake pdf content');
        const result = await IngestionService.processInvoiceFromBuffer(buffer, 'test-markers.pdf');

        expect(result.invoice.numero).toBe("INV-MARKER");
        expect(prisma.cliente.create).not.toHaveBeenCalled();
        expect(prisma.factura.create).toHaveBeenCalled();
    });
});
