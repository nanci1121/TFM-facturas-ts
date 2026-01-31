import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

interface Schema {
    usuarios: any[];
    empresas: any[];
    clientes: any[];
    facturas: any[];
    pagos: any[];
}

const INITIAL_DB: Schema = {
    usuarios: [],
    empresas: [],
    clientes: [],
    facturas: [],
    pagos: [],
};

export class Database {
    private static async ensureDbExists() {
        try {
            await fs.access(DB_PATH);
        } catch {
            await fs.writeFile(DB_PATH, JSON.stringify(INITIAL_DB, null, 2));
        }
    }

    static async read(): Promise<Schema> {
        await this.ensureDbExists();
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    }

    static async write(data: Schema): Promise<void> {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    }

    static async getCollection<T>(collection: keyof Schema): Promise<T[]> {
        const db = await this.read();
        return db[collection] as T[];
    }

    static async saveToCollection<T extends { id: string }>(collection: keyof Schema, item: T): Promise<void> {
        const db = await this.read();
        const items = db[collection] as any[];
        const index = items.findIndex((i) => i.id === item.id);

        if (index !== -1) {
            items[index] = item;
        } else {
            items.push(item);
        }

        await this.write(db);
    }
}
