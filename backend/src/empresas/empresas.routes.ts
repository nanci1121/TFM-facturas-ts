import { Router } from 'express';
import { EmpresasController } from './empresas.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, EmpresasController.list);
router.post('/', authenticate, authorize(['super_admin']), EmpresasController.create);
router.get('/:id', authenticate, EmpresasController.getById);

export default router;
