import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database';
import { Empresa } from '../types';

export const EmpresasController = {
    async list(req: any, res: Response) {
        try {
            const empresas = await Database.getCollection<Empresa>('empresas');
            // Si no es super_admin, solo ve su propia empresa
            if (req.user.rol !== 'super_admin') {
                return res.json(empresas.filter(e => e.id === req.user.empresaId));
            }
            res.json(empresas);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const { nombre, rfc, direccion, telefono, email, configuracion } = req.body;

            const newEmpresa: Empresa = {
                id: uuidv4(),
                nombre,
                rfc,
                direccion,
                telefono,
                email,
                configuracion: {
                    monedaDefault: configuracion?.monedaDefault || 'MXN',
                    impuestoDefault: configuracion?.impuestoDefault || 16,
                    prefijoFactura: configuracion?.prefijoFactura || 'F',
                    numeracionActual: 0,
                    iaProvider: 'auto',
                },
                activa: true,
            };

            await Database.saveToCollection('empresas', newEmpresa);
            res.status(201).json(newEmpresa);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const empresas = await Database.getCollection<Empresa>('empresas');
            const empresa = empresas.find(e => e.id === id);

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

            const db = await Database.read();
            const index = db.empresas.findIndex(e => e.id === empresaId);

            if (index === -1) return res.status(404).json({ message: 'Empresa no encontrada' });

            db.empresas[index].configuracion = {
                ...db.empresas[index].configuracion,
                ...newConfig
            };

            await Database.write(db);
            res.json(db.empresas[index].configuracion);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    }
};
