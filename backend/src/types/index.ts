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
        iaProvider: 'groq' | 'ollama' | 'minimax' | 'auto';
        aiConfig?: {
            groqKey?: string;
            openaiKey?: string;
            openrouterKey?: string;
            minimaxKey?: string;
            selectedProvider?: 'groq' | 'ollama' | 'openrouter' | 'minimax' | 'auto';
        };
    };
    activa: boolean;
}

export type TipoContacto = 'cliente' | 'proveedor';

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
    tipo: TipoContacto;
    activo: boolean;
}

export type EstadoFactura = 'borrador' | 'pendiente' | 'pagada' | 'vencida' | 'cancelada' | 'parcial';
export type TipoFactura = 'gasto' | 'ingreso';

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
    tipo: TipoFactura;
    metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';
    subtotal: number;
    impuestos: number;
    total: number;
    moneda: string;
    notas: string;
    items: ItemFactura[];
    pagos: Pago[];
    archivoOriginal?: string;
    emisorNombre?: string;
    clienteNombre?: string;
    categoria?: string;
    iaProvider?: string;
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
