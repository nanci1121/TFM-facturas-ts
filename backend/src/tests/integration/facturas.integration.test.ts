
import { Database } from '../../database';
import { prisma } from '../../database/db';
import { Factura, Empresa, Cliente } from '../../types';
import { v4 as uuidv4 } from 'uuid';

describe('Integration: Facturas and Database', () => {

    let empresaId: string;
    let clienteId: string;
    let facturaId: string;

    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        // Cleanup test data in correct order (Child -> Parent)
        if (facturaId) {
            try { await Database.deleteFromCollection('facturas', facturaId); } catch { }
        }
        if (clienteId) {
            try { await Database.deleteFromCollection('clientes', clienteId); } catch { }
        }
        if (empresaId) {
            try { await Database.deleteFromCollection('empresas', empresaId); } catch { }
        }

        // Disconnect
        await prisma.$disconnect();
    });

    it('should create an invoice linked to an enterprise and client', async () => {
        // 1. Create Enterprise
        empresaId = uuidv4();
        const testEmpresa: any = { // Using any briefly to bypass strictness or fill all fields
            id: empresaId,
            nombre: 'Integration Test Corp',
            rfc: 'XAXX010101000',
            direccion: 'Test Address 123',
            telefono: '555-1234',
            email: 'contact@test.com',
            configuracion: {
                monedaDefault: 'EUR',
                impuestoDefault: 21,
                numeracionActual: 100,
                prefijoFactura: 'TEST',
                iaProvider: 'ollama' // Ensure this matches allowed union type
            },
            activa: true
        };
        await Database.saveToCollection('empresas', testEmpresa);

        // 2. Create Client
        clienteId = uuidv4();
        const testCliente: Cliente = {
            id: clienteId,
            empresaId: empresaId,
            nombre: 'Test Client Ltd',
            rfc: 'XAXX010101001',
            direccion: 'Client Address 456',
            telefono: '555-5678',
            email: 'client@test.com',
            contacto: 'John Doe',
            notas: 'Test notes',
            tipo: 'cliente',
            activo: true
        };
        await Database.saveToCollection('clientes', testCliente);

        // 3. Create Invoice
        facturaId = uuidv4();
        const newFactura: Factura = {
            id: facturaId,
            empresaId: empresaId,
            clienteId: clienteId,
            numero: 'TEST-101',
            serie: 'TEST',
            folio: 101,
            fechaEmision: new Date(),
            fechaVencimiento: new Date(),
            fechaPago: null,
            estado: 'pendiente' as any, // casting as specific string
            tipo: 'ingreso' as any,
            metodoPago: 'transferencia' as any,
            subtotal: 100,
            impuestos: 21,
            total: 121,
            moneda: 'EUR',
            categoria: 'otros',
            archivoOriginal: undefined,
            iaProvider: undefined,
            notas: 'Invoice from integration test',
            items: [
                {
                    id: uuidv4(),
                    cantidad: 1,
                    descripcion: 'Test Service',
                    precioUnitario: 100,
                    total: 100,
                    descuento: 0,
                    impuesto: 21,
                    unidad: 'SERVICE'
                }
            ]
        };

        await Database.saveToCollection('facturas', newFactura);

        // 4. Verify Invoice exists and has correct relationships
        const facturas = await Database.getCollection<Factura>('facturas');
        const savedFactura = facturas.find(f => f.id === facturaId);

        expect(savedFactura).toBeDefined();
        expect(savedFactura?.total).toBe(121);
        expect(savedFactura?.items).toHaveLength(1);
        expect((savedFactura?.items as any)[0].descripcion).toBe('Test Service');

        // Clean up invoice
        await Database.deleteFromCollection('facturas', facturaId);
    });
});
