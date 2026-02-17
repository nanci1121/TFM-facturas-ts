import { IAService } from '../ia/ia.service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testIAServiceMinimax() {
    console.log('🧪 Probando IAService con Minimax...');

    // Verificar que la clave API esté cargada
    if (!process.env.MINIMAX_API_KEY) {
        console.error('❌ Error: MINIMAX_API_KEY no encontrada en .env');
        process.exit(1);
    }

    try {
        const prompt = "Hola, ¿cómo estás? Responde brevemente.";
        console.log(`🗣️ Prompt: "${prompt}"`);

        // Forzamos el proveedor 'minimax'
        const result = await IAService.chat(prompt, '', { selectedProvider: 'minimax' });

        console.log('\n✅ ¡IAService funcionó exitosamente!');
        console.log(`🤖 Proveedor: ${result.provider}`);
        console.log(`💬 Respuesta: ${result.response}`);

    } catch (error: any) {
        console.error('\n❌ Error en IAService:');
        console.error(error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testIAServiceMinimax();
