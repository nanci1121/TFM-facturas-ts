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

        let context = `INFORMACIÓN DE LA EMPRESA:
    - Total facturado: ${totalFacturado}
    - Saldo pendiente de cobro: ${pendiente}
    - Saldo vencido: ${vencido}
    - Total de clientes: ${clientes.length}
    - Clientes principales: ${clientes.slice(0, 5).map(c => c.nombre).join(', ')}
    
    ÚLTIMAS FACTURAS:
    ${facturas.slice(-5).map(f => `- Factura ${f.numero} para ${this.getClienteNombre(f.clienteId, clientes)} por ${f.total} (${f.estado})`).join('\n')}
    `;

        return context;
    }

    private static getClienteNombre(clienteId: string, clientes: Cliente[]): string {
        return clientes.find(c => c.id === clienteId)?.nombre || 'Desconocido';
    }
}
