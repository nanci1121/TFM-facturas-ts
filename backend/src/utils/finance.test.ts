import { FinanceUtils } from './finance';

describe('FinanceUtils', () => {
    describe('calculateInvoiceTotals', () => {
        it('should calculate totals correctly for standard items', () => {
            const items = [
                { cantidad: 2, precioUnitario: 100, impuesto: 16, descripcion: 'Producto 1' },
                { cantidad: 1, precioUnitario: 50, impuesto: 16, descripcion: 'Producto 2' }
            ];

            const result = FinanceUtils.calculateInvoiceTotals(items);

            // Subtotal: (2 * 100) + (1 * 50) = 250
            expect(result.subtotal).toBe(250);

            // Impuestos: (200 * 0.16) + (50 * 0.16) = 32 + 8 = 40
            expect(result.impuestos).toBe(40);

            // Total: 250 + 40 = 290
            expect(result.total).toBe(290);

            // Validate individual items
            expect(result.items[0].total).toBe(232);
            expect(result.items[1].total).toBe(58);
        });

        it('should handle decimals correctly with rounding', () => {
            const items = [
                { cantidad: 1, precioUnitario: 33.33, impuesto: 16, descripcion: 'Producto Decimal' }
            ];

            const result = FinanceUtils.calculateInvoiceTotals(items);

            // Subtotal: 33.33
            expect(result.subtotal).toBe(33.33);

            // Impuesto: 33.33 * 0.16 = 5.3328 -> 5.33
            expect(result.impuestos).toBe(5.33);

            // Total: 33.33 + 5.33 = 38.66
            expect(result.total).toBe(38.66);
        });

        it('should return zeros for empty items list', () => {
            const result = FinanceUtils.calculateInvoiceTotals([]);

            expect(result.subtotal).toBe(0);
            expect(result.impuestos).toBe(0);
            expect(result.total).toBe(0);
            expect(result.items).toHaveLength(0);
        });
    });
});
