jest.mock('chokidar', () => ({
    watch: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis(),
    }),
}));

import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

describe('Security & Multi-tenant Integration Tests', () => {

    describe('Authentication Middleware', () => {
        it('should return 401 if no token is provided', async () => {
            const response = await request(app).get('/api/v1/facturas');
            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Token no proporcionado');
        });

        it('should return 401 if token is invalid', async () => {
            const response = await request(app)
                .get('/api/v1/facturas')
                .set('Authorization', 'Bearer invalid-token');
            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Token inválido');
        });
    });

    describe('Multi-tenant Data Isolation', () => {
        const empresaA = 'empresa-a-id';
        const empresaB = 'empresa-b-id';

        const tokenA = jwt.sign({ id: 'user-a', empresaId: empresaA, rol: 'usuario' }, JWT_SECRET);
        const tokenB = jwt.sign({ id: 'user-b', empresaId: empresaB, rol: 'usuario' }, JWT_SECRET);

        it('should filter invoices by company from JWT', async () => {
            // This test assumes the controller uses req.user.empresaId to filter
            // We use the real /facturas endpoint
            const response = await request(app)
                .get('/api/v1/facturas')
                .set('Authorization', `Bearer ${tokenA}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            // Check that all returned invoices belong to Empresa A
            response.body.forEach((factura: any) => {
                expect(factura.empresaId).toBe(empresaA);
            });
        });

        it('should not allow access to other company data via query params if not admin', async () => {
            // Try to force a different company via query param if that was a vulnerability
            const response = await request(app)
                .get(`/api/v1/facturas?empresaId=${empresaB}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(response.status).toBe(200);
            // Even if we pass empresaId in query, the controller should force the JWT one
            response.body.forEach((factura: any) => {
                expect(factura.empresaId).toBe(empresaA);
                expect(factura.empresaId).not.toBe(empresaB);
            });
        });
    });
});
