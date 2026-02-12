import { Router } from 'express';
import { FacturasController } from './facturas.controller';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';
import { IngestionService } from '../ia/ingestion.service';
import fs from 'fs';
import path from 'path';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticate, FacturasController.list);
router.post('/', authenticate, FacturasController.create);
router.get('/:id', authenticate, FacturasController.getById);
router.patch('/:id/status', authenticate, FacturasController.updateStatus);
router.delete('/:id', authenticate, FacturasController.delete);

router.post('/upload', authenticate, upload.single('file'), async (req: any, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo' });
        }

        const empresaId = req.user.empresaId;
        if (!empresaId) {
            return res.status(400).json({ message: 'Usuario no asociado a una empresa' });
        }

        // 1. Guardar físicamente en la carpeta de procesadas
        const PROCESSED_DIR = path.join(process.cwd(), 'uploads/facturas/procesadas');
        if (!fs.existsSync(PROCESSED_DIR)) {
            fs.mkdirSync(PROCESSED_DIR, { recursive: true });
        }

        // El nombre debe incluir un timestamp para evitar sobreescrituras si dos archivos se llaman igual
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const filePath = path.join(PROCESSED_DIR, fileName);
        fs.writeFileSync(filePath, req.file.buffer);

        // 2. Procesar con la IA (usando el mismo nombre de archivo)
        const result = await IngestionService.processInvoiceFromBuffer(
            req.file.buffer,
            fileName,
            empresaId
        );

        res.json({ message: result.isDuplicate ? 'Factura duplicada' : 'Factura procesada con éxito', ...result });
    } catch (error: any) {
        console.error('Error en upload factura:', error);
        res.status(500).json({ message: 'Error al procesar la factura', error: error.message });
    }
});

export default router;
