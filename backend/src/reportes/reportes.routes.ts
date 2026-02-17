import { Router } from 'express';
import { ReportesController } from './reportes.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/resumen', authenticate, ReportesController.getResumen);
router.get('/estadisticas-mensuales', authenticate, ReportesController.getEstadisticasMensuales);
router.get('/distribucion-estados', authenticate, ReportesController.getDistribucionEstados);
router.get('/facturas-recientes', authenticate, ReportesController.getFacturasRecientes);
router.get('/alertas', authenticate, ReportesController.getAlertas);
router.get('/categorias', authenticate, ReportesController.getCategorias);

export default router;
