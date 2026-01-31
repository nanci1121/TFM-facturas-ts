import { Router } from 'express';
import { FacturasController } from './facturas.controller';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';
import { IngestionService } from '../ia/ingestion.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticate, FacturasController.list);
router.post('/', authenticate, FacturasController.create);
router.get('/:id', authenticate, FacturasController.getById);
router.patch('/:id/status', authenticate, FacturasController.updateStatus);

router.post('/upload', authenticate, upload.single('file'), async (req: any, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo' });
        }

        const invoice = await IngestionService.processInvoiceFromBuffer(
            req.file.buffer,
            req.file.originalname
        );

        res.json({ message: 'Factura procesada con éxito', invoice });
    } catch (error: any) {
        console.error('Error en upload factura:', error);
        res.status(500).json({ message: 'Error al procesar la factura', error: error.message });
    }
});

export default router;
