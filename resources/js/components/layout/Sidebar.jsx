import React, { useState, Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Monitor, Sheet, User, LogOut, AlertTriangle, Contact, FileText, GitPullRequestArrow, Users, History, CheckSquare, Shield } from 'lucide-react';

const FITUR_INDIVIDU = 'Fitur Individu';
const MANAJEMEN = 'Manajemen';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { assetUrl } from '../../utils/url';

const withSection = (items, section) => items.map(i => ({ ...i, section }));

const ADMIN_NAV = [
    ...withSection([
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', perm: null },
        { to: '/absensi-wfh', icon: Contact, label: 'Absensi WFH', perm: 'wfh.attendance.create' },
        { to: '/laporan-kegiatan', icon: FileText, label: 'Laporan Kegiatan', perm: 'wfh.report.create' },
        { to: '/profil', icon: User, label: 'Profil Saya', perm: null },
    ], FITUR_INDIVIDU),
    ...withSection([
        { to: '/monitor-wfh', icon: Monitor, label: 'Monitor WFH', perm: 'wfh.monitoring.view' },
        { to: '/manajemen-pengguna', icon: Users, label: 'Manajemen Pengguna', perm: 'user.manage' },
        { to: '/manajemen-role', icon: Shield, label: 'Manajemen Role', perm: 'role.manage' },
        { to: '/spreadsheet', icon: Sheet, label: 'Google Spreadsheet', perm: 'wfh.monitoring.view' },
        { to: '/manajemen-inisiasi', icon: GitPullRequestArrow, label: 'Monitoring Inisiasi', perm: 'change.initiation.view' },
        { to: '/arsip', icon: History, label: 'Arsip', perm: 'change.initiation.view' },
    ], MANAJEMEN),
];

const PEGAWAI_NAV = [
    ...withSection([
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', perm: null },
        { to: '/absensi-wfh', icon: Contact, label: 'Absensi WFH', perm: 'wfh.attendance.create' },
        { to: '/laporan-kegiatan', icon: FileText, label: 'Laporan Kegiatan', perm: 'wfh.report.create' },
        { to: '/inisiasi-perubahan', icon: GitPullRequestArrow, label: 'Inisiasi Perubahan', perm: 'change.initiation.create' },
        { to: '/profil', icon: User, label: 'Profil Saya', perm: null },
    ], FITUR_INDIVIDU),
];

const TEAM_LEAD_NAV = [
    ...withSection([
        { to: '/team-lead/dashboard', icon: LayoutDashboard, label: 'Dashboard', perm: 'change.initiation.view' },
        { to: '/absensi-wfh', icon: Contact, label: 'Absensi WFH', perm: 'wfh.attendance.create' },
        { to: '/laporan-kegiatan', icon: FileText, label: 'Laporan Kegiatan', perm: 'wfh.report.create' },
        { to: '/inisiasi-perubahan', icon: GitPullRequestArrow, label: 'Inisiasi Perubahan', perm: 'change.initiation.create' },
        { to: '/team-lead/profil', icon: User, label: 'Profil Saya', perm: null },
    ], FITUR_INDIVIDU),
    ...withSection([
        { to: '/team-lead/permintaan-persetujuan', icon: CheckSquare, label: 'Permintaan Persetujuan', perm: 'change.initiation.approve' },
        { to: '/monitor-wfh', icon: Monitor, label: 'Monitor WFH', perm: 'wfh.monitoring.view' },
        { to: '/manajemen-inisiasi', icon: GitPullRequestArrow, label: 'Monitoring Inisiasi', perm: 'change.initiation.view' },
        { to: '/arsip', icon: History, label: 'Arsip', perm: 'change.initiation.view' },
    ], MANAJEMEN),
];

const KEPALA_BIDANG_NAV = [
    ...withSection([
        { to: '/kepala-bidang/dashboard', icon: LayoutDashboard, label: 'Dashboard', perm: 'wfh.monitoring.view' },
        { to: '/absensi-wfh', icon: Contact, label: 'Absensi WFH', perm: 'wfh.attendance.create' },
        { to: '/laporan-kegiatan', icon: FileText, label: 'Laporan Kegiatan', perm: 'wfh.report.create' },
        { to: '/kepala-bidang/profil', icon: User, label: 'Profil Saya', perm: null },
    ], FITUR_INDIVIDU),
    ...withSection([
        { to: '/kepala-bidang/persetujuan-laporan', icon: FileText, label: 'Persetujuan Rekap', perm: 'wfh.report.approve' },
        { to: '/kepala-bidang/persetujuan-laporan-individu', icon: FileText, label: 'Persetujuan Individu', perm: 'wfh.report.approve' },
        { to: '/manajemen-inisiasi', icon: GitPullRequestArrow, label: 'Monitoring Inisiasi', perm: 'change.initiation.view' },
        { to: '/arsip', icon: History, label: 'Arsip', perm: 'change.initiation.view' },
    ], MANAJEMEN),
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
    const { user, logout, hasPermission } = useAuth();
    const [showConfirm, setShowConfirm] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const roleKey = user?.roles?.[0];
    const isPegawai = PEGAWAI_ROLES.includes(roleKey);

    // Pick base nav group by role, then filter by permissions
    let baseNav;
    if (roleKey === 'kepala_tim') {
        baseNav = TEAM_LEAD_NAV;
    } else if (roleKey === 'kepala_bidang') {
        baseNav = KEPALA_BIDANG_NAV;
    } else if (isPegawai) {
        baseNav = PEGAWAI_NAV;
    } else {
        baseNav = ADMIN_NAV;
    }
    const navItems = baseNav.filter((item) => !item.perm || hasPermission(item.perm));
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

                <nav className="flex-1 px-4 py-6 overflow-y-auto">
                    {navItems.map(({ to, icon: Icon, label, section }, idx) => {
                        // show section header before first item of each new section
                        const showHeader = idx === 0 || navItems[idx - 1].section !== section;
                        return (
                            <Fragment key={to}>
                                {showHeader && !showMini && (
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4 pt-4 pb-1.5">
                                        {section}
                                    </p>
                                )}
                                <NavLink
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
                            </Fragment>
                        );
                    })}
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
