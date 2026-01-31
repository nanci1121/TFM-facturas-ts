import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './auth/auth.routes';
import empresasRoutes from './empresas/empresas.routes';
import clientesRoutes from './clientes/clientes.routes';
import facturasRoutes from './facturas/facturas.routes';
import iaRoutes from './ia/ia.routes';
import reportesRoutes from './reportes/reportes.routes';
import { IngestionService } from './ia/ingestion.service';

// Iniciar observador de facturas físicas en la carpeta uploads/facturas
IngestionService.startWatching();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
