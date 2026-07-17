import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import StatusLaporanWfh from './pages/admin/StatusLaporanWfh';
import MonitorWfh from './pages/admin/MonitorWfh';
import GoogleSpreadsheet from './pages/admin/GoogleSpreadsheet';
import ProfilSaya from './pages/admin/ProfilSaya';
import AppLayout from './layouts/AppLayout';

function Loader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );
}

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <Loader />;
    return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <Loader />;
    return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function Root() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />

                    <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardAdmin />} />
                        <Route path="status-laporan" element={<StatusLaporanWfh />} />
                        <Route path="monitor-wfh" element={<MonitorWfh />} />
                        <Route path="spreadsheet" element={<GoogleSpreadsheet />} />
                        <Route path="profil" element={<ProfilSaya />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

function PlaceholderPage({ title }) {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-700">{title}</h2>
                <p className="text-gray-400 mt-2">Halaman ini sedang dalam pengembangan</p>
            </div>
        </div>
    );
}
