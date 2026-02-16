import { Database } from '../database';
import { Factura, Cliente } from '../types';

export class RAGService {
    static async getContextForCompany(empresaId: string): Promise<string> {
        const db = await Database.read();

        const facturas = db.facturas.filter(f => f.empresaId === empresaId);
        const clientes = db.clientes.filter(c => c.empresaId === empresaId);

        // Summary of financial data
        const totalFacturado = facturas.reduce((sum, f) => sum + f.total, 0);
        const pendiente = facturas.filter(f => f.estado === 'pendiente').reduce((sum, f) => sum + f.total, 0);
        const vencido = facturas.filter(f => f.estado === 'vencida').reduce((sum, f) => sum + f.total, 0);

        let context = `INFORMACIÓN FINANCIERA CONSOLIDADA:
    - Total facturado histórico: ${totalFacturado.toFixed(2)}
    - Saldo pendiente de cobro: ${pendiente.toFixed(2)}
    - Saldo vencido: ${vencido.toFixed(2)}
    - Total de clientes registrados: ${clientes.length}
    
    LISTADO COMPLETO DE CLIENTES/CONTACTOS REGISTRADOS:
    ${clientes.map(c => `- ${c.nombre}`).join(', ')}
    
    LISTADO DETALLADO DE FACTURAS (Base para búsquedas):
    ${facturas.map(f => {
            const fecha = new Date(f.fechaEmision).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            // Incluimos tanto el cliente asignado como el emisor real del PDF
            return `- Factura ${f.numero}: Emisor (Establecimiento): ${f.emisorNombre || 'Desconocido'}, Cliente asignado: ${this.getClienteNombre(f.clienteId, clientes)}, Fecha: ${fecha}, Total: ${f.total} ${f.moneda}, Estado: ${f.estado}, Categoría: ${f.categoria || 'Sin categoría'}`;
        }).join('\n')}
    
    INSTRUCCIÓN CRÍTICA: El usuario puede preguntar por el "Emisor" o el "Establecimiento" (ej: Mercadona, O2, etc.). Utiliza el campo "Emisor (Establecimiento)" del listado para responder.
    `;

        return context;
    }

    private static getClienteNombre(clienteId: string, clientes: Cliente[]): string {
        return clientes.find(c => c.id === clienteId)?.nombre || 'Desconocido';
    }
}
