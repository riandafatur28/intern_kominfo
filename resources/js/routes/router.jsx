import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
import Login from '../pages/auth/Login.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import RegisterPegawai from '../pages/auth/RegisterPegawai.jsx';
import RoleDashboard from '../pages/RoleDashboard.jsx';
import StatusLaporanWfh from '../pages/admin/StatusLaporanWfh.jsx';
import MonitorWfh from '../pages/admin/MonitorWfh.jsx';
import GoogleSpreadsheet from '../pages/admin/GoogleSpreadsheet.jsx';
import ProfilSaya from '../pages/admin/ProfilSaya.jsx';
import StubPage from '../pages/pegawai/StubPage.jsx';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/register',
        element: <RegisterPegawai />,
    },
    {
        path: '/forgot-password',
        element: <ForgotPassword />,
    },
    {
        path: '/',
        element: <AdminLayout />,
        children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            { path: 'dashboard', element: <RoleDashboard /> },
            { path: 'status-laporan', element: <StatusLaporanWfh /> },
            { path: 'monitor-wfh', element: <MonitorWfh /> },
            { path: 'spreadsheet', element: <GoogleSpreadsheet /> },
            { path: 'profil', element: <ProfilSaya /> },
            { path: 'absensi-wfh', element: <StubPage title="Absensi WFH" /> },
            { path: 'laporan-kegiatan', element: <StubPage title="Laporan Kegiatan" /> },
            { path: 'inisiasi-perubahan', element: <StubPage title="Inisiasi Perubahan" /> },
        ],
    },
]);
