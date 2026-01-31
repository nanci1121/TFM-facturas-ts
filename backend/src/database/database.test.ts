import { Database } from '../database';
import fs from 'fs/promises';
import path from 'path';

describe('Database Module', () => {
    const TEST_DB_PATH = path.join(process.cwd(), 'db.json');

    it('should read the database structure correctly', async () => {
        const db = await Database.read();
        expect(db).toHaveProperty('usuarios');
        expect(db).toHaveProperty('facturas');
        expect(Array.isArray(db.usuarios)).toBe(true);
    });

    it('should save and retrieve an item from a collection', async () => {
        const testItem = { id: 'test-123', name: 'Test User' };
        await Database.saveToCollection('usuarios' as any, testItem);

        const db = await Database.read();
        const saved = db.usuarios.find(u => u.id === 'test-123');
        expect(saved).toBeDefined();
        expect(saved.name).toBe('Test User');
    });
});
