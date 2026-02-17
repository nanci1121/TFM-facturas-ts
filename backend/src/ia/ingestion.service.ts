import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { PDFParse } from 'pdf-parse';
import { IAService } from '../ia/ia.service';
import { prisma } from '../database/db';
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
            const empresa = await prisma.empresa.findUnique({
                where: { id: empresaId }
            });
            aiOverride = (empresa?.configuracion as any)?.aiConfig;
        }

        const result = await IAService.chat(prompt, "Eres un extractor de datos de PDF. Devuelve EXCLUSIVAMENTE el JSON, sin comentarios ni explicaciones.", aiOverride);

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
        let empresaId = forcedEmpresaId;

        if (!empresaId) {
            const firstEmpresa = await prisma.empresa.findFirst();
            empresaId = firstEmpresa?.id;
        }

        if (!empresaId) throw new Error('No hay empresas registradas en el sistema para asociar la factura.');

        const clienteNombre = data.clienteNombre || 'Cliente Desconocido';
        const emisorNombre = data.emisorNombre || 'Emisor Desconocido';

        // Buscar cliente por nombre (aproximado)
        let cliente = await prisma.cliente.findFirst({
            where: {
                empresaId,
                nombre: { contains: clienteNombre, mode: 'insensitive' },
                activo: true
            }
        });

        if (!cliente) {
            cliente = await prisma.cliente.create({
                data: {
                    id: uuidv4(),
                    empresaId,
                    nombre: clienteNombre,
                    rfc: 'PENDIENTE',
                    email: '',
                    activo: true
                }
            });
        }

        // Buscar duplicados
        const fechaEmision = new Date(data.fecha);
        const facturaExistente = await prisma.factura.findFirst({
            where: {
                empresaId,
                OR: [
                    { numero: data.numero },
                    {
                        AND: [
                            { total: { equals: data.total } },
                            { fechaEmision: { equals: fechaEmision } }
                        ]
                    }
                ]
            }
        });

        if (facturaExistente) {
            return { invoice: facturaExistente, isDuplicate: true };
        }

        const items = data.items.map((i: any) => ({
            ...i,
            id: uuidv4(),
            total: (i.cantidad || 0) * (i.precio || 0)
        }));

        const nuevaFactura = await prisma.factura.create({
            data: {
                id: uuidv4(),
                empresaId,
                clienteId: cliente.id,
                numero: data.numero || `S/N-${Date.now()}`,
                fechaEmision: fechaEmision,
                fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : fechaEmision,
                estado: 'pendiente',
                tipo: 'gasto',
                total: data.total,
                moneda: data.moneda || 'EUR',
                categoria: data.categoria || 'otros',
                iaProvider: data.iaProvider,
                archivoOriginal: data.archivoOriginal,
                emisorNombre: data.emisorNombre,
                clienteNombre: data.clienteNombre,
                items: items as any,
            } as any
        });

        return { invoice: nuevaFactura, isDuplicate: false };
    }
}
