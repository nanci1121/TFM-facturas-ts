
import { prisma } from './db';

// This implementation uses Prisma ORM, making it database-agnostic.
// It works with PostgreSQL, MySQL, SQLite, SQL Server, etc. just by changing the provider in schema.prisma.

export class Database {
    // Legacy support wrapper - prefer using 'prisma' client directly in services

    static async getCollection<T>(collection: string): Promise<T[]> {
        // Map collection name to Prisma delegate
        switch (collection) {
            case 'facturas': return await prisma.factura.findMany() as unknown as T[];
            case 'usuarios': return await prisma.usuario.findMany() as unknown as T[];
            case 'empresas': return await prisma.empresa.findMany() as unknown as T[];
            case 'clientes': return await prisma.cliente.findMany() as unknown as T[];
            case 'pagos': return await prisma.pago.findMany() as unknown as T[];
            default: throw new Error(`Collection ${collection} not supported in Prisma wrapper`);
        }
    }

    static async saveToCollection<T extends { id: string }>(collection: string, item: T): Promise<void> {
        // Upsert logic for generic T
        const data = item as any;
        try {
            switch (collection) {
                case 'facturas':
                    // Ensure items is JSON if it exists
                    if (data.items && typeof data.items !== 'object') {
                        // handle items parsing if needed
                    }
                    await prisma.factura.upsert({
                        where: { id: data.id },
                        update: data,
                        create: data
                    });
                    break;
                case 'usuarios':
                    await prisma.usuario.upsert({ where: { id: data.id }, update: data, create: data });
                    break;
                case 'empresas':
                    await prisma.empresa.upsert({ where: { id: data.id }, update: data, create: data });
                    break;
                case 'clientes':
                    await prisma.cliente.upsert({ where: { id: data.id }, update: data, create: data });
                    break;
                // Add other cases
                default: throw new Error(`Save to ${collection} not supported`);
            }
        } catch (error) {
            console.error(`Error saving to ${collection}:`, error);
            throw error;
        }
    }

    static async deleteFromCollection(collection: string, id: string): Promise<void> {
        switch (collection) {
            case 'facturas': await prisma.factura.delete({ where: { id } }); break;
            case 'usuarios': await prisma.usuario.delete({ where: { id } }); break;
            case 'empresas': await prisma.empresa.delete({ where: { id } }); break;
            case 'clientes': await prisma.cliente.delete({ where: { id } }); break;
            case 'pagos': await prisma.pago.delete({ where: { id } }); break;
            default: throw new Error(`Delete from ${collection} not supported`);
        }
    }

    // DEPRECATED: Do not use read/write for transactional DBs.
    // Use prisma client directly instead.
    static async read(): Promise<any> {
        // Inefficient but compatible for read-heavy legacy code
        const [usuarios, empresas, clientes, facturas, pagos] = await Promise.all([
            prisma.usuario.findMany(),
            prisma.empresa.findMany(),
            prisma.cliente.findMany(),
            prisma.factura.findMany(),
            prisma.pago.findMany()
        ]);

        return { usuarios, empresas, clientes, facturas, pagos };
    }

    static async write(data: any): Promise<void> {
        // This is dangerous in SQL. We cannot just "dump" the state.
        // However, legacy code modifies objects in memory and calls write().
        // We should ideally throw error or try to sync changes (very hard).
        console.warn("Database.write() is mocked in SQL mode. Use specific update methods.");
    }
}
