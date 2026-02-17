import { Response } from 'express';
import { IAService } from './ia.service';
import { RAGService } from './rag.service';
import { prisma } from '../database/db';

export const IAController = {
    async chat(req: any, res: Response) {
        try {
            const { message, useRAG = true } = req.body;
            const empresaId = req.user.empresaId;

            let context = '';
            let aiOverride = undefined;

            if (empresaId) {
                const empresa = await prisma.empresa.findUnique({
                    where: { id: empresaId }
                });
                aiOverride = (empresa?.configuracion as any)?.aiConfig;

                if (useRAG) {
                    context = await RAGService.getContextForCompany(empresaId);
                }
            }

            const result = await IAService.chat(message, context, aiOverride);
            res.json(result);
        } catch (error: any) {
            console.error('Error in IAController.chat:', error);
            res.status(500).json({ message: error.message });
        }
    },

    async getStatus(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            let aiOverride = undefined;

            if (empresaId) {
                const empresa = await prisma.empresa.findUnique({
                    where: { id: empresaId }
                });
                aiOverride = (empresa?.configuracion as any)?.aiConfig;
            }

            const providers = await IAService.checkStatus(aiOverride);
            res.json({ providers });
        } catch (error: any) {
            console.error('Error in IAController.getStatus:', error);
            res.status(500).json({ message: error.message });
        }
    },

    async getDebug(req: any, res: Response) {
        try {
            const lastInteraction = IAService.getLastInteraction();
            res.json(lastInteraction || { message: 'No hay interacciones recientes' });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    async testConfig(req: any, res: Response) {
        try {
            const { aiConfig } = req.body;
            // Simple test prompt
            const result = await IAService.chat('Hola, responde solo con la palabra RESPONDIENDO si me recibes.', '', aiConfig);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
};
