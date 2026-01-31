import { Router } from 'express';
import { IAController } from './ia.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/chat', authenticate, IAController.chat);
router.get('/status', authenticate, IAController.getStatus);

export default router;
