import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '@testing-library/jest-dom';

describe('Sidebar Component', () => {
    it('renders all menu items', () => {
        render(
            <BrowserRouter>
                <Sidebar />
            </BrowserRouter>
        );

        expect(screen.getByText('FacturaIA')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Facturas')).toBeInTheDocument();
        expect(screen.getByText('Clientes')).toBeInTheDocument();
        expect(screen.getByText('IA Assistant')).toBeInTheDocument();
    });

    it('has correct links', () => {
        render(
            <BrowserRouter>
                <Sidebar />
            </BrowserRouter>
        );

        expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: /facturas/i })).toHaveAttribute('href', '/facturas');
    });
});
