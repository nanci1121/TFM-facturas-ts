import { Response } from 'express';
import { IAService } from './ia.service';
import { RAGService } from './rag.service';

export const IAController = {
    async chat(req: any, res: Response) {
        try {
            const { message, useRAG = true } = req.body;
            const empresaId = req.user.empresaId;

            let context = '';
            if (useRAG && empresaId) {
                context = await RAGService.getContextForCompany(empresaId);
            }

            const result = await IAService.chat(message, context);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    async getStatus(req: any, res: Response) {
        try {
            const providers = await IAService.checkStatus();
            res.json({ providers });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
};
