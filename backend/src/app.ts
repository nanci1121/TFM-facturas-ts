import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

import authRoutes from './auth/auth.routes';
import empresasRoutes from './empresas/empresas.routes';
import clientesRoutes from './clientes/clientes.routes';
import facturasRoutes from './facturas/facturas.routes';
import iaRoutes from './ia/ia.routes';
import reportesRoutes from './reportes/reportes.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos (PDFs de facturas)
app.use('/uploads/facturas', express.static('uploads/facturas/procesadas'));

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Sistema de Facturas Backend is running' });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/empresas', empresasRoutes);
app.use('/api/v1/clientes', clientesRoutes);
app.use('/api/v1/facturas', facturasRoutes);
app.use('/api/v1/ia', iaRoutes);
app.use('/api/v1/reportes', reportesRoutes);

export default app;
