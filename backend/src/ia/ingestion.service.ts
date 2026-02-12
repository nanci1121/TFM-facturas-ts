import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { PDFParse } from 'pdf-parse';
import { IAService } from '../ia/ia.service';
import { Database } from '../database';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads/facturas');
const PROCESSED_DIR = path.join(UPLOADS_DIR, 'procesadas');
const ERRORS_DIR = path.join(UPLOADS_DIR, 'errores');

export class IngestionService {
    static startWatching() {
        console.log(`👀 Iniciando observador de facturas en: ${UPLOADS_DIR}`);

        const watcher = chokidar.watch(UPLOADS_DIR, {
            ignored: [PROCESSED_DIR, ERRORS_DIR],
            persistent: true,
            depth: 0,
            awaitWriteFinish: {
                stabilityThreshold: 1000,
                pollInterval: 100
            }
        });

        watcher.on('add', async (filePath) => {
            if (path.extname(filePath).toLowerCase() === '.pdf') {
                console.log(`📄 Nueva factura detectada: ${path.basename(filePath)}`);
                await this.processInvoiceFromPath(filePath);
            }
        });
    }

    static async processInvoiceFromBuffer(buffer: Buffer, originalName: string, empresaId?: string) {
        try {
            const parser = new PDFParse({ data: buffer });
            const pdfData = await parser.getText();
            const text = pdfData.text;
            return await this.extractAndSave(text, originalName, empresaId);
        } catch (error) {
            console.error(`❌ Error procesando buffer de ${originalName}:`, error);
            throw error;
        }
    }

    private static async processInvoiceFromPath(filePath: string) {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const invoice = await this.processInvoiceFromBuffer(dataBuffer, path.basename(filePath));

            // Move to processed
            const destPath = path.join(PROCESSED_DIR, path.basename(filePath));
            fs.renameSync(filePath, destPath);
            return invoice;
        } catch (error) {
            const errorPath = path.join(ERRORS_DIR, path.basename(filePath));
            if (fs.existsSync(filePath)) {
                fs.renameSync(filePath, errorPath);
            }
            throw error;
        }
    }

    private static async extractAndSave(text: string, fileName: string, empresaId?: string) {
        console.log(`🤖 Extrayendo datos con IA para: ${fileName}`);

        const prompt = `Extrae la información de esta factura en formato JSON exacto. 
        Texto de la factura:
        ${text}

        Responde ÚNICAMENTE con un objeto JSON con esta estructura:
          "numero": "string",
          "emisorNombre": "string",
          "clienteNombre": "string",
          "fecha": "YYYY-MM-DD",
          "total": number,
          "moneda": "string",
          "categoria": "alimentación" | "telecomunicaciones" | "suministro eléctrico" | "agua" | "ocio" | "otros",
          "items": [{"descripcion": "string", "cantidad": number, "precio": number}]
        }`;

        if (process.env.NODE_ENV !== 'production') {
            console.log('--- DEBUG IA PROMPT ---');
            console.log(prompt);
            console.log('-----------------------');
        }

        const result = await IAService.chat(prompt, "Eres un extractor de datos de PDF. Devuelve EXCLUSIVAMENTE el JSON, sin comentarios ni explicaciones.");

        if (process.env.NODE_ENV !== 'production') {
            console.log('--- DEBUG IA RESPONSE ---');
            console.log(result.response);
            console.log('-------------------------');
        }

        // Clean up response to find the JSON block
        let jsonString = result.response;
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.error('❌ La IA no devolvió un JSON válido:', result.response);
            throw new Error('No se pudo encontrar un JSON válido en la respuesta de la IA');
        }

        jsonString = jsonMatch[0]
            .replace(/\/\/.*$/gm, '') // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .trim();

        console.log('DEBUG: Attempting to parse JSON string:', jsonString);
        const invoiceData = JSON.parse(jsonString);

        // Añadir el proveedor al objeto de datos antes de guardar
        invoiceData.iaProvider = result.provider;
        invoiceData.archivoOriginal = fileName;

        return await this.saveToSystem(invoiceData, empresaId);
    }

    private static async saveToSystem(data: any, forcedEmpresaId?: string) {
        const db = await Database.read();

        const empresaId = forcedEmpresaId || db.empresas[0]?.id;

        // Buscar cliente por nombre normalizado dentro de esta empresa
        let cliente = data.clienteId ? db.clientes.find(c => c.id === data.clienteId) : null;
        if (!cliente) {
            cliente = db.clientes.find(c =>
                c.empresaId === empresaId &&
                c.nombre.toLowerCase().includes(data.clienteNombre.toLowerCase())
            );
        }

        if (!cliente && empresaId) {
            cliente = {
                id: uuidv4(),
                empresaId,
                nombre: data.clienteNombre,
                rfc: 'PENDIENTE',
                email: '',
                activo: true
            } as any;
            await Database.saveToCollection('clientes', cliente);
        }

        // Doble validación:
        // 1. Por número exacto
        // 2. Por combinación (Emisor + Fecha + Total) para evitar fallos de lectura de la IA
        const normalize = (s: string) => s?.toLowerCase().trim().replace(/[*]/g, '');

        const facturaExistente = db.facturas.find(f => {
            const numMatch = f.numero && f.numero === data.numero;
            const comboMatch = normalize(f.emisorNombre) === normalize(data.emisorNombre) &&
                new Date(f.fechaEmision).getTime() === new Date(data.fecha).getTime() &&
                Math.abs(f.total - data.total) < 0.01;

            return f.empresaId === empresaId && (numMatch || comboMatch);
        });

        if (facturaExistente) {
            console.log(`\x1b[33m⚠️ DUPLICADO DETECTADO:\x1b[0m Factura de ${data.emisorNombre} del ${data.fecha} por ${data.total}€ ya existe. Saltando.`);
            return { invoice: facturaExistente, isDuplicate: true };
        }

        const nuevaFactura = {
            id: uuidv4(),
            empresaId,
            clienteId: cliente?.id,
            emisorNombre: data.emisorNombre, // Nuevo campo: Quien emite la factura
            clienteNombre: cliente?.nombre || data.clienteNombre,
            numero: data.numero,
            fechaEmision: new Date(data.fecha),
            estado: 'pendiente',
            total: data.total,
            moneda: data.moneda || 'MXN',
            categoria: data.categoria || 'otros', // Nuevo campo: Categoría
            iaProvider: data.iaProvider || 'unknown',
            archivoOriginal: data.archivoOriginal,
            items: data.items.map((i: any) => ({ ...i, id: uuidv4(), total: i.cantidad * i.precio })),
            pagos: []
        };

        await Database.saveToCollection('facturas', nuevaFactura);
        console.log(`✅ Factura ${data.numero} guardada correctamente con IA: ${data.iaProvider}`);
        return { invoice: nuevaFactura, isDuplicate: false };
    }
}
