import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';

export default function AdminLayout() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });

    const toggleSidebar = () => {
        setSidebarCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('sidebar_collapsed', String(next));
            return next;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-page">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Memuat...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <div className="min-h-screen bg-bg-page flex font-[Poppins]">
            <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
            <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[334px]'}`}>
                <Topbar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
