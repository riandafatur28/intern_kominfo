import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardAdmin from './admin/DashboardAdmin.jsx';
import DashboardPegawai from './pegawai/DashboardPegawai.jsx';

const PEGAWAI_ROLES = ['pegawai', 'staf'];
const TEAM_LEAD_ROLES = ['kepala_tim', 'kepala-tim', 'team-lead', 'team_lead'];

export default function RoleDashboard() {
    const { user } = useAuth();
    const roleKey = user?.roles?.[0];

    if (roleKey === 'kepala_bidang') {
        return <Navigate to="/kepala-bidang/dashboard" replace />;
    }

    if (TEAM_LEAD_ROLES.includes(roleKey)) {
        return <Navigate to="/team-lead/dashboard" replace />;
    }

    if (PEGAWAI_ROLES.includes(roleKey)) {
        return <DashboardPegawai />;
    }

    return <DashboardAdmin />;
}
