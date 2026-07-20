import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Monitor, Sheet, User, LogOut, AlertTriangle, Contact, FileText, GitPullRequestArrow } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { assetUrl } from '../../utils/url';

const ADMIN_NAV = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/monitor-wfh', icon: Monitor, label: 'Monitor WFH' },
    { to: '/spreadsheet', icon: Sheet, label: 'Google Spreadsheet' },
    { to: '/profil', icon: User, label: 'Profil Saya' },
];

const PEGAWAI_NAV = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/absensi-wfh', icon: Contact, label: 'Absensi WFH' },
    { to: '/laporan-kegiatan', icon: FileText, label: 'Laporan Kegiatan' },
    { to: '/inisiasi-perubahan', icon: GitPullRequestArrow, label: 'Inisiasi Perubahan' },
    { to: '/profil', icon: User, label: 'Profil Saya' },
];

const PEGAWAI_ROLES = ['pegawai', 'staf'];

const ROLE_LABELS = {
    admin: 'Admin WFH',
    kepala_tim: 'Kepala Tim',
    kepala_bidang: 'Kepala Bidang',
    staf: 'Pegawai',
    pegawai: 'Pegawai',
};

export default function Sidebar({ collapsed, onToggle, mobileOpen = false, onClose }) {
    const { user, logout } = useAuth();
    const [showConfirm, setShowConfirm] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const roleKey = user?.roles?.[0];
    const isPegawai = PEGAWAI_ROLES.includes(roleKey);
    const navItems = isPegawai ? PEGAWAI_NAV : ADMIN_NAV;
    const roleLabel = ROLE_LABELS[roleKey] ?? (roleKey || 'Admin');

    // Mini (icon-only) view is a desktop-collapsed concept; on the mobile
    // drawer we always render the full expanded sidebar.
    const showMini = collapsed && !mobileOpen;

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
        } catch { /* ignore */ }
    };

    const initials = user?.name
        ?.split(' ')
        .map((s) => s[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ?? 'U';

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside className={`bg-bg-card border-r border-sidebar-border flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 w-[280px] ${collapsed ? 'lg:w-[72px]' : 'lg:w-[334px]'
                } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="pt-8 pb-6 flex flex-col items-center border-b border-gray-100">
                    {showMini ? (
                        <div className="w-11 h-11 flex items-center justify-center">
                            <img src="/images/logo.png" alt="Logo" className="h-full object-contain" />
                        </div>
                    ) : (
                        <>
                            <div className="w-[111px] h-20 flex items-center justify-center mb-6">
                                <img src="/images/logo.png" alt="Logo Kominfo Jatim" className="h-full object-contain" />
                            </div>
                            <div className="bg-brand-100/50 px-4 py-1.5 rounded-[10px] w-4/5 text-center">
                                <span className="text-brand-600 text-xs font-bold tracking-wide">
                                    {roleLabel}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm transition-colors whitespace-nowrap ${isActive
                                    ? 'bg-brand-100 text-brand-600 font-bold'
                                    : 'text-text-secondary hover:bg-gray-50 font-medium'
                                } ${showMini ? 'justify-center px-0' : ''}`
                            }
                            title={showMini ? label : undefined}
                        >
                            <Icon size={20} strokeWidth={2} className="shrink-0" />
                            {!showMini && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-6 border-t border-sidebar-border mt-auto">
                    {showMini ? (
                        <div className="flex justify-center">
                            {user?.photo_url ? (
                                <img src={assetUrl(user.photo_url)} alt="" className="w-12 h-12 rounded-full object-cover shadow-sm" />
                            ) : (
                                <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {initials}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                {user?.photo_url ? (
                                    <img src={assetUrl(user.photo_url)} alt="" className="w-12 h-12 rounded-full object-cover shadow-sm shrink-0" />
                                ) : (
                                    <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                                        {initials}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-text-primary leading-none mb-1.5 truncate">
                                        {user?.name ?? 'User'}
                                    </p>
                                    <p className="text-xs text-text-secondary font-medium truncate">
                                        {user?.team?.field?.name ?? '-'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowConfirm(true)}
                                className="flex flex-col items-center justify-center text-red-500 hover:text-red-600 transition-colors gap-1 shrink-0"
                            >
                                <LogOut size={18} strokeWidth={2} />
                                <span className="text-[10px] font-bold">Keluar</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Konfirmasi Logout */}
            <Modal open={showConfirm} onClose={() => { if (!loggingOut) setShowConfirm(false); }} width="max-w-sm">
                <div className="text-center py-4">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={28} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">Yakin ingin keluar?</h3>
                    <p className="text-sm text-text-secondary mt-2">Anda akan kembali ke halaman login.</p>
                </div>
                <div className="flex gap-3 justify-center mt-6">
                    <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={loggingOut}>
                        Batal
                    </Button>
                    <Button variant="danger" onClick={handleLogout} loading={loggingOut}>
                        Keluar
                    </Button>
                </div>
            </Modal>
        </>
    );
}
