import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const authenticate = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

export const authorize = (roles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.rol)) {
            return res.status(403).json({ message: 'No tiene permisos para realizar esta acción' });
        }
        next();
    };
};

export const requireEmpresa = (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.empresaId) {
        return res.status(403).json({ message: 'Se requiere estar asociado a una empresa' });
    }
    next();
};
