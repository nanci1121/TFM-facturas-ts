import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database';
import { Usuario } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const AuthController = {
    async register(req: Request, res: Response) {
        try {
            const { email, password, nombre, apellido, rol, empresaId } = req.body;

            const db = await Database.read();
            const existingUser = db.usuarios.find(u => u.email === email);

            if (existingUser) {
                return res.status(400).json({ message: 'El usuario ya existe' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser: Usuario = {
                id: uuidv4(),
                email,
                password: hashedPassword,
                nombre,
                apellido,
                rol: rol || 'usuario',
                empresaId: empresaId || null,
                activo: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await Database.saveToCollection('usuarios', newUser);

            const { password: _, ...userWithoutPassword } = newUser;
            res.status(201).json(userWithoutPassword);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const db = await Database.read();
            const user = db.usuarios.find(u => u.email === email);

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, rol: user.rol, empresaId: user.empresaId },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            const { password: _, ...userWithoutPassword } = user;
            res.json({ token, user: userWithoutPassword });
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    },

    async profile(req: any, res: Response) {
        try {
            const db = await Database.read();
            const user = db.usuarios.find(u => u.id === req.user.id);

            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            const { password: _, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    }
};
