
import { prisma } from '../database/db';

async function main() {
    try {
        const users = await prisma.usuario.findMany();
        console.log('Connection successful. Users:', users.length);
    } catch (e) {
        console.error('Error connecting:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
