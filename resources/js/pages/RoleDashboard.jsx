import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardAdmin from './admin/DashboardAdmin.jsx';
import DashboardPegawai from './pegawai/DashboardPegawai.jsx';

const PEGAWAI_ROLES = ['pegawai', 'staf'];

export default function RoleDashboard() {
    const { user } = useAuth();
    const roleKey = user?.roles?.[0];
    const isPegawai = PEGAWAI_ROLES.includes(roleKey);
    return isPegawai ? <DashboardPegawai /> : <DashboardAdmin />;
}
