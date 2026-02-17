import { Router } from 'express';
import { ClientesController } from './clientes.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, ClientesController.list);
router.get('/stats', authenticate, ClientesController.getStats);
router.post('/', authenticate, ClientesController.create);
router.get('/:id', authenticate, ClientesController.getById);
router.put('/:id', authenticate, ClientesController.update);
router.delete('/:id', authenticate, ClientesController.delete);

export default router;
