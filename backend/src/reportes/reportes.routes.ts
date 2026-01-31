import { Router } from 'express';
import { ReportesController } from './reportes.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/resumen', authenticate, ReportesController.getResumen);
router.get('/estadisticas-mensuales', authenticate, ReportesController.getEstadisticasMensuales);

export default router;
