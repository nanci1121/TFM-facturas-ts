import { Router } from 'express';
import { ClientesController } from './clientes.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, ClientesController.list);
router.post('/', authenticate, ClientesController.create);
router.get('/:id', authenticate, ClientesController.getById);

export default router;
