import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Building2,
    MessageSquare,
    Settings,
    BarChart3
} from 'lucide-react';

const Sidebar = () => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: FileText, label: 'Facturas', path: '/facturas' },
        { icon: Building2, label: 'Contactos', path: '/contactos' },
        { icon: MessageSquare, label: 'IA Assistant', path: '/ia' },
        { icon: BarChart3, label: 'Reportes', path: '/reportes' },
        { icon: Settings, label: 'Configuración', path: '/settings' },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:block">
            <div className="p-6">
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">FacturaIA</h1>
            </div>
            <nav className="mt-4">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
              ${isActive ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600' : ''}
            `}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
