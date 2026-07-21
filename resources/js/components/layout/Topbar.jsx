import React from 'react';
import { X, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PAGE_LABELS = {
    '/dashboard': 'Dashboard',
    '/absensi-wfh': 'Absensi WFH',
    '/laporan-kegiatan': 'Laporan Kegiatan',
    '/status-laporan': 'Status Laporan',
    '/monitor-wfh': 'Monitor WFH',
    '/profil': 'Profil Saya',
    '/manajemen-pengguna': 'Manajemen Pengguna',
    '/manajemen-role': 'Manajemen Role',
    '/spreadsheet': 'Google Spreadsheet',
    '/inisiasi-perubahan': 'Inisiasi Perubahan',
    '/change-dashboard': 'Dashboard Perubahan',
    '/arsip': 'Arsip',
    '/manajemen-inisiasi': 'Monitoring Inisiasi',
    '/team-lead/dashboard': 'Dashboard',
    '/team-lead/permintaan-persetujuan': 'Permintaan Persetujuan',
    '/team-lead/profil': 'Profil Saya',
    '/kepala-bidang/dashboard': 'Dashboard',
    '/kepala-bidang/persetujuan-laporan': 'Persetujuan Laporan',
    '/kepala-bidang/profil': 'Profil Saya',
};

const PEGAWAI_ROLES = ['pegawai', 'staf'];

export default function Topbar({ collapsed, onToggle, onMobileMenu }) {
    const { user } = useAuth();
    const location = useLocation();

    const roleKey = user?.roles?.[0];
    const section = roleKey === 'kepala_tim'
        ? 'Kepala Tim'
        : roleKey === 'kepala_bidang'
            ? 'Kepala Bidang'
            : (PEGAWAI_ROLES.includes(roleKey) ? 'Pegawai' : 'Admin WFH');
    const page = PAGE_LABELS[location.pathname] ?? 'Dashboard';
    const crumbs = ['Beranda', section, page];

    const roleLabel = roleKey === 'kepala_tim'
        ? 'Kepala Tim'
        : (PEGAWAI_ROLES.includes(roleKey) ? 'Pegawai' : (roleKey ?? 'Admin'));

    const initials = user?.name
        ?.split(' ')
        .map((s) => s[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ?? 'U';

    return (
        <header className="h-16 bg-bg-card border-b border-border-lighter flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20 w-full">
            <div className="flex items-center text-sm min-w-0">
                {/* Mobile hamburger — opens drawer */}
                <button
                    onClick={onMobileMenu}
                    className="p-1 mr-3 text-text-secondary hover:text-text-primary transition-colors lg:hidden"
                    title="Buka menu"
                >
                    <Menu size={20} strokeWidth={2} />
                </button>
                {/* Desktop collapse toggle */}
                <button
                    onClick={onToggle}
                    className="p-1 mr-3 text-text-secondary hover:text-text-primary transition-colors hidden lg:inline-flex"
                    title="Toggle sidebar"
                >
                    {collapsed ? <Menu size={16} strokeWidth={2} /> : <X size={16} strokeWidth={2} />}
                </button>
                {/* Breadcrumb — hide leading crumbs on small screens */}
                {crumbs.map((c, i) => (
                    <span key={i} className={`items-center ${i < crumbs.length - 1 ? 'hidden sm:flex' : 'flex'}`}>
                        {i > 0 && <span className="mx-2 text-border hidden sm:inline">/</span>}
                        <span className={`truncate ${i === crumbs.length - 1 ? 'text-brand-500 font-bold' : 'text-text-secondary'}`}>
                            {c}
                        </span>
                    </span>
                ))}
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-3 sm:pl-6 sm:border-l border-border-light">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-text-primary leading-tight">
                            {user?.name ?? 'User'}
                        </p>
                        <p className="text-xs text-text-secondary">
                            {roleLabel}
                        </p>
                    </div>
                    {user?.photo_url ? (
                        <img src={user.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {initials}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
