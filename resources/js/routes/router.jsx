import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
import Login from '../pages/auth/Login.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import RegisterPegawai from '../pages/auth/RegisterPegawai.jsx';
import RoleDashboard from '../pages/RoleDashboard.jsx';
import RoleProfil from '../pages/RoleProfil.jsx';
import StatusLaporanWfh from '../pages/admin/StatusLaporanWfh.jsx';
import MonitorWfh from '../pages/admin/MonitorWfh.jsx';
import ManajemenPengguna from '../pages/admin/ManajemenPengguna.jsx';
import ManajemenRole from '../pages/admin/ManajemenRole.jsx';
import GoogleSpreadsheet from '../pages/admin/GoogleSpreadsheet.jsx';
import AbsensiWfh from '../pages/pegawai/AbsensiWfh.jsx';
import LaporanKegiatan from '../pages/pegawai/LaporanKegiatan.jsx';
import InisiasiPerubahan from '../pages/pegawai/InisiasiPerubahan.jsx';
import DashboardTeamLead from '../pages/change-management/DashboardTeamLead.jsx';
import PermintaanPersetujuan from '../pages/change-management/PermintaanPersetujuan.jsx';
import ProfilSayaTeamLead from '../pages/change-management/ProfilSaya.jsx';
import DashboardKepalaBidang from '../pages/kepala-bidang/DashboardKepalaBidang.jsx';
import PersetujuanLaporan from '../pages/kepala-bidang/PersetujuanLaporan.jsx';
import Arsip from '../pages/change-management/Arsip.jsx';
import ChangeDashboard from '../pages/change-management/Dashboard.jsx';
import MonitoringInisiasi from '../pages/change-management/MonitoringInisiasi.jsx';

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
            { path: 'manajemen-role', element: <ManajemenRole /> },
            { path: 'spreadsheet', element: <GoogleSpreadsheet /> },
            { path: 'profil', element: <RoleProfil /> },
            { path: 'absensi-wfh', element: <AbsensiWfh /> },
            { path: 'laporan-kegiatan', element: <LaporanKegiatan /> },
            { path: 'inisiasi-perubahan', element: <InisiasiPerubahan /> },
            { path: 'arsip', element: <Arsip /> },
            { path: 'change-dashboard', element: <ChangeDashboard /> },
            { path: 'manajemen-inisiasi', element: <MonitoringInisiasi /> },
        ],
    },

    {
        path: '/team-lead',
        element: <AdminLayout />,
        children: [
            { index: true, element: <Navigate to="dashboard" replace /> },
            { path: 'dashboard', element: <DashboardTeamLead /> },
            { path: 'permintaan-persetujuan', element: <PermintaanPersetujuan /> },
            { path: 'profil', element: <ProfilSayaTeamLead /> },
        ],
    },

    {
        path: '/kepala-bidang',
        element: <AdminLayout />,
        children: [
            { index: true, element: <Navigate to="dashboard" replace /> },
            { path: 'dashboard', element: <DashboardKepalaBidang /> },
            { path: 'persetujuan-laporan', element: <PersetujuanLaporan /> },
            { path: 'profil', element: <ProfilSayaTeamLead /> },
        ],
    },
]);
