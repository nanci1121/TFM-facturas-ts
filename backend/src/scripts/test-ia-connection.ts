import dotenv from 'dotenv';
import path from 'path';
// Load env from backend dir
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { IAService } from '../ia/ia.service';

/**
 * Script para probar la conexión real con los proveedores de IA
 */
async function testIAConnection() {
    console.log('--- TEST DE CONEXIÓN IA ---');
    console.log('Cargando configuración del archivo .env...');

    // 1. Mostrar estado de las configuraciones
    const status = await IAService.checkStatus();
    console.table(status);

    const testPrompt = "Responde solo con la palabra: HOLA";

    // Intentar comunicación real
    console.log('\n--- Probando comunicación real ---');
    try {
        const result = await IAService.chat(testPrompt);
        console.log('✅ ÉXITO!');
        console.log(`📡 Proveedor usado: ${result.provider}`);
        console.log(`💬 Respuesta: ${result.response}`);
    } catch (error: any) {
        console.error('❌ FALLO TOTAL: No se pudo comunicar con ningún proveedor.');
        console.error(`Motivo: ${error.message}`);

        console.log('\n--- Sugerencias de solución ---');
        console.log('1. Verifica que GEMINI_API_KEY o GROQ_API_KEY sean correctas en el archivo .env');
        console.log('2. Si usas Ollama, asegúrate de que esté corriendo con "ollama serve"');
        console.log('3. Asegúrate de tener conexión a internet');
    }
}

testIAConnection().catch(console.error);
