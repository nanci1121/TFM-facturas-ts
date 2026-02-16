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
router.put('/:id', authenticate, FacturasController.update);
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

        const TEMP_DIR = path.join(process.cwd(), 'uploads/facturas/temp');
        const PROCESSED_DIR = path.join(process.cwd(), 'uploads/facturas/procesadas');
        const ERRORS_DIR = path.join(process.cwd(), 'uploads/facturas/errores');

        // Asegurar directorios
        [TEMP_DIR, PROCESSED_DIR, ERRORS_DIR].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        const fileName = `${Date.now()}-${req.file.originalname}`;
        const tempPath = path.join(TEMP_DIR, fileName);

        // Guardar temporalmente
        fs.writeFileSync(tempPath, req.file.buffer);

        try {
            // 2. Procesar con la IA
            const result = await IngestionService.processInvoiceFromBuffer(
                req.file.buffer,
                fileName,
                empresaId
            );

            // Si tiene éxito, mover a procesadas
            const finalPath = path.join(PROCESSED_DIR, fileName);
            fs.renameSync(tempPath, finalPath);

            res.json({
                message: result.isDuplicate ? 'Factura duplicada' : 'Factura procesada con éxito',
                ...result
            });
        } catch (iaError: any) {
            // Si falla, mover a errores
            const errorPath = path.join(ERRORS_DIR, fileName);
            fs.renameSync(tempPath, errorPath);
            throw iaError; // Re-lanzar para el bloque catch principal
        }
    } catch (error: any) {
        console.error('Error en upload factura:', error);
        res.status(500).json({
            message: error.message || 'Error al procesar la factura con IA.',
            error: error.message
        });
    }
});

export default router;
