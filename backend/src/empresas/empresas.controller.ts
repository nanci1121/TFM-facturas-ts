import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../database/db';
import { Empresa } from '../types';

export const EmpresasController = {
    async list(req: any, res: Response) {
        try {
            const where = req.user.rol !== 'super_admin' ? { id: req.user.empresaId } : {};
            const empresas = await prisma.empresa.findMany({ where });
            res.json(empresas);
        } catch (error) {
            console.error('Error in empresas.list:', error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const { nombre, rfc, direccion, telefono, email, configuracion } = req.body;

            const newEmpresa = await prisma.empresa.create({
                data: {
                    id: uuidv4(),
                    nombre,
                    rfc,
                    direccion,
                    telefono,
                    email,
                    configuracion: {
                        monedaDefault: configuracion?.monedaDefault || 'EUR',
                        impuestoDefault: configuracion?.impuestoDefault || 21,
                        prefijoFactura: configuracion?.prefijoFactura || 'F',
                        numeracionActual: 0,
                        iaProvider: 'auto',
                    },
                    activa: true,
                }
            });

            res.status(201).json(newEmpresa);
        } catch (error) {
            console.error('Error in empresas.create:', error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const empresa = await prisma.empresa.findUnique({
                where: { id }
            });

            if (!empresa) {
                return res.status(404).json({ message: 'Empresa no encontrada' });
            }

            res.json(empresa);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async updateConfig(req: any, res: Response) {
        try {
            const empresaId = req.user.empresaId;
            const newConfig = req.body;

            if (!empresaId) return res.status(400).json({ message: 'Usuario sin empresa' });

            const empresa = await prisma.empresa.findUnique({
                where: { id: empresaId }
            });

            if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });

            const updatedEmpresa = await prisma.empresa.update({
                where: { id: empresaId },
                data: {
                    configuracion: {
                        ...(empresa.configuracion as any),
                        ...newConfig
                    }
                }
            });

            res.json(updatedEmpresa.configuracion);
        } catch (error) {
            console.error('Error in updateConfig:', error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    }
};
