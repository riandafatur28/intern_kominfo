import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
import Login from '../pages/auth/Login.jsx';
import Dashboard from '../pages/change-management/Dashboard.jsx';
import MonitoringInisiasi from '../pages/change-management/MonitoringInisiasi.jsx';
import Arsip from '../pages/change-management/Arsip.jsx';
import Profil from '../pages/change-management/Profil.jsx';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/',
        element: <AdminLayout />,
        children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            { path: 'dashboard', element: <Dashboard /> },
            { path: 'monitoring-inisiasi', element: <MonitoringInisiasi /> },
            { path: 'arsip', element: <Arsip /> },
            { path: 'profil', element: <Profil /> },
        ],
    },
]);
