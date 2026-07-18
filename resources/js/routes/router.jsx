import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
import Login from '../pages/auth/Login.jsx';
import DashboardAdmin from '../pages/admin/DashboardAdmin.jsx';
import StatusLaporanWfh from '../pages/admin/StatusLaporanWfh.jsx';
import MonitorWfh from '../pages/admin/MonitorWfh.jsx';
import GoogleSpreadsheet from '../pages/admin/GoogleSpreadsheet.jsx';
import ProfilSaya from '../pages/admin/ProfilSaya.jsx';
import MonitoringInisiasi from '../pages/change-management/MonitoringInisiasi.jsx';
import Arsip from '../pages/change-management/Arsip.jsx';

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
            { path: 'dashboard', element: <DashboardAdmin /> },
            { path: 'status-laporan', element: <StatusLaporanWfh /> },
            { path: 'monitor-wfh', element: <MonitorWfh /> },
            { path: 'spreadsheet', element: <GoogleSpreadsheet /> },
            { path: 'monitoring-inisiasi', element: <MonitoringInisiasi /> },
            { path: 'arsip', element: <Arsip /> },
            { path: 'profil', element: <ProfilSaya /> },
        ],
    },
]);
