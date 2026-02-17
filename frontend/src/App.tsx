import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import IAChat from './pages/IAChat';
import Facturas from './pages/Facturas';
import Reportes from './pages/Reportes';
import Clientes from './pages/Clientes';
import Configuracion from './pages/Configuracion';
import Login from './pages/Login';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/facturas" element={<Facturas />} />
                                    <Route path="/contactos" element={<Clientes />} />
                                    <Route path="/ia" element={<IAChat />} />
                                    <Route path="/reportes" element={<Reportes />} />
                                    <Route path="/settings" element={<Configuracion />} />
                                    <Route path="*" element={<div className="p-8 text-center text-xl">Próximamente...</div>} />
                                </Routes>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
