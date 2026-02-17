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
            console.log(`📄 Analizando PDF: ${originalName} (${buffer.length} bytes)`);

            // Usando la clase PDFParse que parece ser la correcta para esta versión instalada
            const parser = new (PDFParse as any)({ data: buffer });
            const pdfData = await parser.getText();
            const text = pdfData.text;

            if (!text || text.trim().length < 10) {
                console.warn('⚠️ El PDF parece estar vacío o no se pudo extraer texto.');
            } else {
                console.log(`✅ Texto extraído correctamente (${text.length} caracteres)`);
            }

            return await this.extractAndSave(text, originalName, empresaId);
        } catch (error: any) {
            console.error(`❌ Error procesando buffer de ${originalName}:`, error);
            throw error;
        }
    }

    private static async processInvoiceFromPath(filePath: string) {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const invoice = await this.processInvoiceFromBuffer(dataBuffer, path.basename(filePath));

            // Move to processed
            if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });
            const destPath = path.join(PROCESSED_DIR, path.basename(filePath));
            fs.renameSync(filePath, destPath);
            return invoice;
        } catch (error) {
            if (!fs.existsSync(ERRORS_DIR)) fs.mkdirSync(ERRORS_DIR, { recursive: true });
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
        {
          "numero": "string",
          "emisorNombre": "string",
          "clienteNombre": "string",
          "fecha": "YYYY-MM-DD",
          "total": number,
          "moneda": "string",
          "categoria": "alimentación" | "telecomunicaciones" | "suministro eléctrico" | "agua" | "ocio" | "otros",
          "items": [{"descripcion": "string", "cantidad": number, "precio": number}]
        }`;

        let aiOverride = undefined;
        if (empresaId) {
            const db = await Database.read();
            const empresa = db.empresas.find(e => e.id === empresaId);
            aiOverride = empresa?.configuracion?.aiConfig;
        }

        const result = await IAService.chat(prompt, "Eres un extractor de datos de PDF. Devuelve EXCLUSIVAMENTE el JSON, sin comentarios ni explicaciones.", aiOverride);

        // Clean up response to find the JSON block
        let jsonString = result.response;
        const markdownMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (markdownMatch) {
            jsonString = markdownMatch[1];
        } else {
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonString = jsonMatch[0];
            }
        }

        jsonString = jsonString
            .replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .trim();

        try {
            const invoiceData = JSON.parse(jsonString);
            invoiceData.iaProvider = result.provider;
            invoiceData.archivoOriginal = fileName;
            return await this.saveToSystem(invoiceData, empresaId);
        } catch (parseError: any) {
            console.error('❌ Error parseando JSON de la IA:', parseError.message);
            console.error('Contenido que falló:', jsonString);
            throw new Error(`Error de formato en respuesta IA: ${parseError.message}`);
        }
    }

    private static async saveToSystem(data: any, forcedEmpresaId?: string) {
        const db = await Database.read();
        const empresaId = forcedEmpresaId || db.empresas[0]?.id;

        // Validar datos mínimos
        const clienteNombre = data.clienteNombre || 'Cliente Desconocido';
        const emisorNombre = data.emisorNombre || 'Emisor Desconocido';

        // Buscar cliente
        let cliente = db.clientes.find(c =>
            c.empresaId === empresaId &&
            c.nombre &&
            clienteNombre &&
            c.nombre.toLowerCase().includes(clienteNombre.toLowerCase())
        );

        if (!cliente && empresaId) {
            cliente = {
                id: uuidv4(),
                empresaId,
                nombre: clienteNombre,
                rfc: 'PENDIENTE',
                email: '',
                activo: true
            } as any;
            await Database.saveToCollection('clientes', cliente);
        }

        // Duplicados
        const normalize = (s: string) => s?.toLowerCase().trim().replace(/[*]/g, '');
        const facturaExistente = db.facturas.find(f => {
            const numMatch = f.numero && f.numero === data.numero;
            const comboMatch = normalize(f.emisorNombre) === normalize(data.emisorNombre) &&
                new Date(f.fechaEmision).getTime() === new Date(data.fecha).getTime() &&
                Math.abs(f.total - data.total) < 0.01;
            return f.empresaId === empresaId && (numMatch || comboMatch);
        });

        if (facturaExistente) {
            return { invoice: facturaExistente, isDuplicate: true };
        }

        const nuevaFactura = {
            id: uuidv4(),
            empresaId,
            clienteId: cliente?.id,
            emisorNombre: emisorNombre,
            clienteNombre: cliente?.nombre || clienteNombre,
            numero: data.numero || `S/N-${Date.now()}`,
            fechaEmision: new Date(data.fecha),
            fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : new Date(data.fecha),
            estado: 'pendiente',
            tipo: 'gasto' as const,
            total: data.total,
            moneda: data.moneda || 'EUR',
            categoria: data.categoria || 'otros',
            iaProvider: data.iaProvider,
            archivoOriginal: data.archivoOriginal,
            items: data.items.map((i: any) => ({ ...i, id: uuidv4(), total: i.cantidad * i.precio })),
            pagos: []
        };

        await Database.saveToCollection('facturas', nuevaFactura);
        return { invoice: nuevaFactura, isDuplicate: false };
    }
}
