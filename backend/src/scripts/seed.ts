import { prisma } from '../database/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    console.log('🌱 Iniciando carga de datos de prueba en la base de datos SQL...');

    try {
        // Limpiar datos existentes (opcional, pero recomendado para un seed limpio)
        // El orden importa por las claves foráneas
        await prisma.pago.deleteMany({});
        await prisma.factura.deleteMany({});
        await prisma.cliente.deleteMany({});
        await prisma.usuario.deleteMany({});
        await prisma.empresa.deleteMany({});

        // 1. Crear Empresa
        const empresaId = uuidv4();
        const empresa = await prisma.empresa.create({
            data: {
                id: empresaId,
                nombre: 'Mi Empresa S.A.',
                rfc: 'MES123456ABC',
                direccion: 'Av. Principal 123, Ciudad de México',
                telefono: '555-123-4567',
                email: 'info@miempresa.com',
                configuracion: {
                    monedaDefault: 'EUR',
                    impuestoDefault: 21,
                    prefijoFactura: 'F',
                    numeracionActual: 2,
                    iaProvider: 'auto',
                },
                activa: true,
            }
        });

        // 2. Crear Usuario Admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.usuario.create({
            data: {
                id: uuidv4(),
                email: 'admin@sistema.com',
                password: hashedPassword,
                nombre: 'Admin',
                apellido: 'Sistema',
                rol: 'admin',
                empresaId: empresaId,
                activo: true,
            }
        });

        // 3. Crear Clientes
        const clienteId = uuidv4();
        await prisma.cliente.create({
            data: {
                id: clienteId,
                empresaId,
                nombre: 'Corporativo Global',
                rfc: 'CGL880808XYZ',
                direccion: 'Calle Falsa 123',
                telefono: '111-222-3333',
                email: 'factura@global.com',
                contacto: 'Juan Pérez',
                notas: 'Cliente preferencial',
                activo: true,
                tipo: 'cliente',
            }
        });

        // 4. Crear Facturas
        await prisma.factura.create({
            data: {
                id: uuidv4(),
                empresaId,
                clienteId,
                numero: 'F-1',
                serie: 'F',
                folio: 1,
                fechaEmision: new Date('2026-01-15'),
                fechaVencimiento: new Date('2026-02-15'),
                fechaPago: new Date('2026-01-20'),
                estado: 'pagada',
                tipo: 'ingreso',
                metodoPago: 'transferencia',
                subtotal: 1000,
                impuestos: 210,
                total: 1210,
                moneda: 'EUR',
                notas: 'Pago oportuno',
                items: [
                    { id: uuidv4(), descripcion: 'Consultoría TI', cantidad: 10, precioUnitario: 100, descuento: 0, impuesto: 21, total: 1210, unidad: 'hora' }
                ] as any,
            }
        });

        await prisma.factura.create({
            data: {
                id: uuidv4(),
                empresaId,
                clienteId,
                numero: 'F-2',
                serie: 'F',
                folio: 2,
                fechaEmision: new Date('2026-01-31'),
                fechaVencimiento: new Date('2026-02-28'),
                fechaPago: null,
                estado: 'pendiente',
                tipo: 'ingreso',
                metodoPago: 'transferencia',
                subtotal: 5000,
                impuestos: 1050,
                total: 6050,
                moneda: 'EUR',
                notas: 'Pendiente de cobro',
                items: [
                    { id: uuidv4(), descripcion: 'Desarrollo Software', cantidad: 1, precioUnitario: 5000, descuento: 0, impuesto: 21, total: 6050, unidad: 'servicio' }
                ] as any,
            }
        });

        console.log('✅ Datos de prueba cargados correctamente en PostgreSQL');
        console.log('🔑 Credenciales: admin@sistema.com / admin123');
    } catch (error) {
        console.error('❌ Error durante el seed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
