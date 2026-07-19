import React from 'react';
import { useAuth } from '../context/AuthContext';
import ProfilSaya from './admin/ProfilSaya.jsx';
import ProfilPegawai from './pegawai/ProfilPegawai.jsx';

const PEGAWAI_ROLES = ['pegawai', 'staf'];

export default function RoleProfil() {
    const { user } = useAuth();
    const roleKey = user?.roles?.[0];
    const isPegawai = PEGAWAI_ROLES.includes(roleKey);
    return isPegawai ? <ProfilPegawai /> : <ProfilSaya />;
}
