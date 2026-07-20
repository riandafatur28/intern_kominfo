import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
import Login from '../pages/auth/Login.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import RegisterPegawai from '../pages/auth/RegisterPegawai.jsx';
import RoleDashboard from '../pages/RoleDashboard.jsx';
import RoleProfil from '../pages/RoleProfil.jsx';
import StatusLaporanWfh from '../pages/admin/StatusLaporanWfh.jsx';
import MonitorWfh from '../pages/admin/MonitorWfh.jsx';
import GoogleSpreadsheet from '../pages/admin/GoogleSpreadsheet.jsx';
import ManajemenPengguna from '../pages/admin/ManajemenPengguna.jsx';
import AbsensiWfh from '../pages/pegawai/AbsensiWfh.jsx';
import LaporanKegiatan from '../pages/pegawai/LaporanKegiatan.jsx';
import InisiasiPerubahan from '../pages/pegawai/InisiasiPerubahan.jsx';
import CmDashboard from '../pages/change-management/Dashboard.jsx';
import MonitoringInisiasi from '../pages/change-management/MonitoringInisiasi.jsx';
import ArsipInisiasi from '../pages/change-management/Arsip.jsx';

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
            { path: 'manajemen-pengguna', element: <ManajemenPengguna /> },
            { path: 'spreadsheet', element: <GoogleSpreadsheet /> },
            { path: 'profil', element: <RoleProfil /> },
            { path: 'absensi-wfh', element: <AbsensiWfh /> },
            { path: 'laporan-kegiatan', element: <LaporanKegiatan /> },
            { path: 'inisiasi-perubahan', element: <InisiasiPerubahan /> },
            { path: 'inisiasi-dashboard', element: <CmDashboard /> },
            { path: 'monitoring-inisiasi', element: <MonitoringInisiasi /> },
            { path: 'arsip-inisiasi', element: <ArsipInisiasi /> },
        ],
    },
]);
