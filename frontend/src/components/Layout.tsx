import React from 'react';
import Sidebar from './Sidebar';
import { useAuthStore } from '../store/authStore';
import { LogOut } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout } = useAuthStore();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8">
                    <div className="font-semibold text-gray-800 dark:text-white">Panel de Control</div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{user?.nombre} {user?.apellido}</span>
                            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                    {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                                </span>
                            </button>
                        </div>
                        <button
                            onClick={logout}
                            title="Cerrar sesión"
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
