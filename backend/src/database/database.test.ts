import { Database } from '../database';
import { prisma } from './db';
import { v4 as uuidv4 } from 'uuid';

describe('Database Module Integration (Prisma)', () => {

    beforeAll(async () => {
        // Ensure DB connection
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should read the database collections correctly', async () => {
        // We test getCollection instead of read() which is deprecated
        const usuarios = await Database.getCollection('usuarios');
        const facturas = await Database.getCollection('facturas');

        expect(Array.isArray(usuarios)).toBe(true);
        expect(Array.isArray(facturas)).toBe(true);
    });

    it('should save and retrieve a user using Prisma wrapper', async () => {
        const testId = uuidv4();
        const testUser = {
            id: testId,
            email: `test-${testId}@example.com`,
            password: 'hash',
            nombre: 'Test User',
            rol: 'user'
        };

        await Database.saveToCollection('usuarios', testUser);

        const usuarios = await Database.getCollection<any>('usuarios');
        const saved = usuarios.find(u => u.id === testId);

        expect(saved).toBeDefined();
        expect(saved.email).toBe(testUser.email);

        // Cleanup
        await Database.deleteFromCollection('usuarios', testId);
    });
});
