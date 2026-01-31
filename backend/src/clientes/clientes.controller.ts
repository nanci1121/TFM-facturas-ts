import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database';
import { Cliente } from '../types';

export const ClientesController = {
    async list(req: any, res: Response) {
        try {
            const { empresaId, search } = req.query;
            const targetEmpresaId = req.user.rol === 'super_admin' ? empresaId : req.user.empresaId;

            if (!targetEmpresaId) {
                return res.status(400).json({ message: 'Se requiere empresaId' });
            }

            let clientes = await Database.getCollection<Cliente>('clientes');
            clientes = clientes.filter(c => c.empresaId === targetEmpresaId && c.activo);

            if (search) {
                const searchLower = String(search).toLowerCase();
                clientes = clientes.filter(c =>
                    c.nombre.toLowerCase().includes(searchLower) ||
                    c.rfc.toLowerCase().includes(searchLower)
                );
            }

            res.json(clientes);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async create(req: any, res: Response) {
        try {
            const { nombre, rfc, direccion, telefono, email, contacto, notas } = req.body;
            const empresaId = req.user.empresaId; // Por ahora asume que el creador pertenece a una empresa

            if (!empresaId) {
                return res.status(400).json({ message: 'Usuario no asociado a ninguna empresa' });
            }

            const newCliente: Cliente = {
                id: uuidv4(),
                empresaId,
                nombre,
                rfc,
                direccion,
                telefono,
                email,
                contacto: contacto || '',
                notas: notas || '',
                activo: true,
            };

            await Database.saveToCollection('clientes', newCliente);
            res.status(201).json(newCliente);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async getById(req: any, res: Response) {
        try {
            const { id } = req.params;
            const clientes = await Database.getCollection<Cliente>('clientes');
            const cliente = clientes.find(c => c.id === id && (req.user.rol === 'super_admin' || c.empresaId === req.user.empresaId));

            if (!cliente) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            res.json(cliente);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    }
};
