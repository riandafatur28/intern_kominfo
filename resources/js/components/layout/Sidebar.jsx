import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Monitor, History, User, LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/monitoring-inisiasi', icon: Monitor, label: 'Monitoring Inisiasi' },
    { to: '/arsip', icon: History, label: 'Arsip' },
    { to: '/profil', icon: User, label: 'Profil Saya' },
];

export default function Sidebar({ collapsed, onToggle }) {
    const { user, logout } = useAuth();
    const [showConfirm, setShowConfirm] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

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
        <aside className={`bg-bg-card border-r border-sidebar-border flex flex-col h-screen fixed left-0 top-0 transition-all duration-300 z-20 ${
            collapsed ? 'w-[72px]' : 'w-[334px]'
        }`}>
            <div className="pt-8 pb-6 flex flex-col items-center border-b border-gray-100">
                {collapsed ? (
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
                                {user?.roles?.[0] ?? 'Admin Inisiasi'}
                            </span>
                        </div>
                    </>
                )}
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-hidden">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm transition-colors whitespace-nowrap ${
                                isActive
                                    ? 'bg-brand-100 text-brand-600 font-bold'
                                    : 'text-text-secondary hover:bg-gray-50 font-medium'
                            } ${collapsed ? 'justify-center px-0' : ''}`
                        }
                        title={collapsed ? label : undefined}
                    >
                        <Icon size={20} strokeWidth={2} className="shrink-0" />
                        {!collapsed && <span>{label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 border-t border-sidebar-border mt-auto">
                {collapsed ? (
                    <div className="flex justify-center">
                        {user?.photo_url ? (
                            <img src={user.photo_url} alt="" className="w-12 h-12 rounded-full object-cover shadow-sm" />
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
                                <img src={user.photo_url} alt="" className="w-12 h-12 rounded-full object-cover shadow-sm shrink-0" />
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
