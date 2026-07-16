import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Monitor, History, User, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/manajemen-inisiasi', icon: Monitor, label: 'Manajemen Inisiasi' },
    { to: '/arsip', icon: History, label: 'Status & Arsip' },
    { to: '/profil', icon: User, label: 'Profil Saya' },
];

export default function Sidebar({ collapsed, onToggle }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
    };

    const initials = user?.name
        ?.split(' ')
        .map((s) => s[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ?? 'U';

    return (
        <aside className={`bg-white border-r border-[#DDDEEE] flex flex-col h-screen fixed left-0 top-0 transition-all duration-300 z-20 ${
            collapsed ? 'w-[72px]' : 'w-[334px]'
        }`}>
            {/* Logo Area */}
            <div className="pt-6 pb-4 flex flex-col items-center border-b border-gray-100 relative">
                {collapsed ? (
                    <div className="w-10 h-10 flex items-center justify-center">
                        <img
                            src="/images/logo.png"
                            alt="Logo"
                            className="h-full object-contain"
                        />
                    </div>
                ) : (
                    <>
                        <div className="w-24 h-16 flex items-center justify-center mb-4">
                            <img
                                src="/images/logo.png"
                                alt="Logo Kominfo Jatim"
                                className="h-full object-contain"
                            />
                        </div>
                        <div className="bg-blue-100/50 px-4 py-1.5 rounded-full w-4/5 text-center">
                            <span className="text-blue-500 text-xs font-bold tracking-wide">
                                {user?.roles?.[0] ?? 'Pengguna'}
                            </span>
                        </div>
                    </>
                )}
                {/* Toggle button */}
                <button
                    onClick={onToggle}
                    className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
                >
                    <X size={14} className="text-gray-500" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors whitespace-nowrap ${
                                isActive
                                    ? 'bg-blue-100/60 text-blue-600 font-bold'
                                    : 'text-gray-500 hover:bg-gray-50 font-medium'
                            } ${collapsed ? 'justify-center px-0' : ''}`
                        }
                        title={collapsed ? label : undefined}
                    >
                        <Icon size={20} strokeWidth={2.5} className="shrink-0" />
                        {!collapsed && <span className="truncate">{label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Profile */}
            <div className={`p-3 border-t border-gray-100 mt-auto ${collapsed ? 'flex justify-center' : 'flex items-center justify-between'}`}>
                {collapsed ? (
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                        {initials}
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 leading-none mb-1 truncate">
                                    {user?.name ?? 'User'}
                                </p>
                                <p className="text-xs text-gray-500 font-medium truncate">
                                    {user?.team?.field?.name ?? '-'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex flex-col items-center justify-center text-red-500 hover:text-red-600 transition-colors gap-1 shrink-0"
                        >
                            <LogOut size={16} strokeWidth={2.5} />
                            <span className="text-[9px] font-bold">Keluar</span>
                        </button>
                    </>
                )}
                {collapsed && (
                    <button
                        onClick={handleLogout}
                        className="absolute bottom-3 right-2 p-1.5 text-red-500 hover:text-red-600 transition-colors"
                        title="Keluar"
                    >
                        <LogOut size={16} strokeWidth={2.5} />
                    </button>
                )}
            </div>
        </aside>
    );
}
