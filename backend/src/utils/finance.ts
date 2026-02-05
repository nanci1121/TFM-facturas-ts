import { ItemFactura } from "../types";
import { v4 as uuidv4 } from 'uuid';

export interface TotalsResult {
    subtotal: number;
    impuestos: number;
    total: number;
    items: ItemFactura[];
}

export const FinanceUtils = {
    calculateInvoiceTotals(items: any[]): TotalsResult {
        let subtotal = 0;
        let impuestos = 0;

        const processedItems: ItemFactura[] = items.map((it: any) => {
            const itemTotal = it.cantidad * it.precioUnitario;
            const itemImpuesto = itemTotal * (it.impuesto / 100);
            subtotal += itemTotal;
            impuestos += itemImpuesto;

            return {
                id: uuidv4(),
                ...it,
                total: parseFloat((itemTotal + itemImpuesto).toFixed(2))
            };
        });

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            impuestos: parseFloat(impuestos.toFixed(2)),
            total: parseFloat((subtotal + impuestos).toFixed(2)),
            items: processedItems
        };
    }
};
