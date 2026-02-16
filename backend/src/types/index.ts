export interface Usuario {
    id: string;
    email: string;
    password: string; // hashed
    nombre: string;
    apellido: string;
    rol: 'super_admin' | 'admin' | 'contador' | 'usuario';
    empresaId: string | null;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Empresa {
    id: string;
    nombre: string;
    rfc: string;
    direccion: string;
    telefono: string;
    email: string;
    configuracion: {
        monedaDefault: string;
        impuestoDefault: number;
        prefijoFactura: string;
        numeracionActual: number;
        iaProvider: 'gemini' | 'groq' | 'ollama' | 'auto';
        aiConfig?: {
            geminiKey?: string;
            groqKey?: string;
            openaiKey?: string;
            openrouterKey?: string;
            selectedProvider?: 'gemini' | 'groq' | 'ollama' | 'openrouter' | 'auto';
        };
    };
    activa: boolean;
}

export interface Cliente {
    id: string;
    empresaId: string;
    nombre: string;
    rfc: string;
    direccion: string;
    telefono: string;
    email: string;
    contacto: string;
    notas: string;
    activo: boolean;
}

export type EstadoFactura = 'borrador' | 'pendiente' | 'pagada' | 'vencida' | 'cancelada' | 'parcial';

export interface Factura {
    id: string;
    empresaId: string;
    clienteId: string;
    numero: string;
    serie: string;
    folio: number;
    fechaEmision: Date;
    fechaVencimiento: Date;
    fechaPago: Date | null;
    estado: EstadoFactura;
    metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';
    subtotal: number;
    impuestos: number;
    total: number;
    moneda: string;
    notas: string;
    items: ItemFactura[];
    pagos: Pago[];
    archivoOriginal?: string;
}

export interface ItemFactura {
    id: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    impuesto: number;
    total: number;
    unidad: string;
}

export interface Pago {
    id: string;
    facturaId: string;
    monto: number;
    fecha: Date;
    metodo: string;
    referencia: string;
}
