import { prisma } from '../database/db';
import { Cliente } from '../types';

export class RAGService {
    static async getContextForCompany(empresaId: string): Promise<string> {
        const [facturas, clientes] = await Promise.all([
            prisma.factura.findMany({
                where: { empresaId },
                orderBy: { fechaEmision: 'desc' }
            }),
            prisma.cliente.findMany({
                where: { empresaId, activo: true }
            })
        ]);

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
    ${clientes.map((c: any) => `- ${c.nombre}`).join(', ')}
    
    LISTADO DETALLADO DE FACTURAS (Base para búsquedas):
    ${facturas.map((f: any) => {
            const fecha = new Date(f.fechaEmision).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            return `- Factura ${f.numero}: Emisor (Establecimiento): ${f.emisorNombre || 'Desconocido'}, Cliente asignado: ${this.getClienteNombre(f.clienteId, clientes as any)}, Fecha: ${fecha}, Total: ${f.total} ${f.moneda}, Estado: ${f.estado}, Categoría: ${f.categoria || 'Sin categoría'}`;
        }).join('\n')}
    
    INSTRUCCIÓN CRÍTICA: El usuario puede preguntar por el "Emisor" o el "Establecimiento" (ej: Mercadona, O2, etc.). Utiliza el campo "Emisor (Establecimiento)" del listado para responder.
    `;

        return context;
    }

    private static getClienteNombre(clienteId: string, clientes: Cliente[]): string {
        return clientes.find(c => c.id === clienteId)?.nombre || 'Desconocido';
    }
}
