import { Database } from '../database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Usuario, Empresa, Cliente, Factura } from '../types';

async function seed() {
    console.log('🌱 Iniciando carga de datos de prueba...');

    const db: {
        usuarios: Usuario[];
        empresas: Empresa[];
        clientes: Cliente[];
        facturas: Factura[];
        pagos: any[];
    } = {
        usuarios: [],
        empresas: [],
        clientes: [],
        facturas: [],
        pagos: [],
    };

    // 1. Crear Empresa
    const empresaId = uuidv4();
    db.empresas.push({
        id: empresaId,
        nombre: 'Mi Empresa S.A.',
        rfc: 'MES123456ABC',
        direccion: 'Av. Principal 123, Ciudad de México',
        telefono: '555-123-4567',
        email: 'info@miempresa.com',
        configuracion: {
            monedaDefault: 'MXN',
            impuestoDefault: 16,
            prefijoFactura: 'A',
            numeracionActual: 2,
            iaProvider: 'auto',
        },
        activa: true,
    });

    // 2. Crear Usuario Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    db.usuarios.push({
        id: uuidv4(),
        email: 'admin@sistema.com',
        password: hashedPassword,
        nombre: 'Admin',
        apellido: 'Sistema',
        rol: 'admin',
        empresaId: empresaId,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // 3. Crear Clientes
    const clienteId = uuidv4();
    db.clientes.push({
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
    });

    // 4. Crear Facturas
    db.facturas.push({
        id: uuidv4(),
        empresaId,
        clienteId,
        numero: 'A-1',
        serie: 'A',
        folio: 1,
        fechaEmision: new Date('2026-01-15'),
        fechaVencimiento: new Date('2026-02-15'),
        fechaPago: new Date('2026-01-20'),
        estado: 'pagada',
        metodoPago: 'transferencia',
        subtotal: 1000,
        impuestos: 160,
        total: 1160,
        moneda: 'MXN',
        notas: 'Pago oportuno',
        items: [
            { id: uuidv4(), descripcion: 'Consultoría TI', cantidad: 10, precioUnitario: 100, descuento: 0, impuesto: 16, total: 1160, unidad: 'hora' }
        ],
        pagos: []
    });

    db.facturas.push({
        id: uuidv4(),
        empresaId,
        clienteId,
        numero: 'A-2',
        serie: 'A',
        folio: 2,
        fechaEmision: new Date('2026-01-31'),
        fechaVencimiento: new Date('2026-02-28'),
        fechaPago: null,
        estado: 'pendiente',
        metodoPago: 'transferencia',
        subtotal: 5000,
        impuestos: 800,
        total: 5800,
        moneda: 'MXN',
        notas: 'Pendiente de cobro',
        items: [
            { id: uuidv4(), descripcion: 'Desarrollo Software', cantidad: 1, precioUnitario: 5000, descuento: 0, impuesto: 16, total: 5800, unidad: 'servicio' }
        ],
        pagos: []
    });

    await Database.write(db as any);
    console.log('✅ Datos de prueba cargados correctamente en db.json');
    console.log('🔑 Credenciales: admin@sistema.com / admin123');
}

seed().catch(console.error);
