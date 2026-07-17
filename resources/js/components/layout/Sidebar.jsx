import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Monitor, Sheet, User, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/monitor-wfh', icon: Monitor, label: 'Monitor WFH' },
    { to: '/spreadsheet', icon: Sheet, label: 'Google Spreadsheet' },
    { to: '/profil', icon: User, label: 'Profil Saya' },
];

function BrandLogo() {
    return (
        <div className="flex flex-col items-center">
            <svg width="56" height="40" viewBox="0 0 56 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 34a24 24 0 0148 0" stroke="#1E3A8A" strokeWidth="5" strokeLinecap="round" />
                <path d="M13 34a15 15 0 0130 0" stroke="#6366F1" strokeWidth="5" strokeLinecap="round" />
                <circle cx="28" cy="32" r="6" fill="#2563EB" />
            </svg>
            <span className="mt-1 text-[11px] font-extrabold tracking-wide text-blue-900">
                KOMINFO JATIM
            </span>
        </div>
    );
}

export default function Sidebar({ mobileOpen, onClose }) {
    const { user, logout } = useAuth();

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
                    className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 w-[248px] z-40 transform transition-transform duration-300 lg:translate-x-0 ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Close button (mobile) */}
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600 lg:hidden"
                >
                    <X size={18} />
                </button>

                {/* Logo Area */}
                <div className="pt-7 pb-5 flex justify-center border-b border-gray-100">
                    <BrandLogo />
                </div>

                {/* Role badge */}
                <div className="px-6 py-4 flex justify-center">
                    <span className="bg-blue-100/70 text-blue-500 text-[11px] font-bold px-5 py-1.5 rounded-full">
                        {user?.roles?.includes('admin') ? 'Admin WFH' : (user?.roles?.[0] ?? 'Pengguna')}
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-600 font-semibold'
                                        : 'text-gray-500 hover:bg-gray-50 font-medium'
                                }`
                            }
                        >
                            <Icon size={20} strokeWidth={2} className="shrink-0" />
                            <span className="truncate">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Profile */}
                <div className="p-4 border-t border-gray-100 flex items-center gap-3">
                    <div className="w-11 h-11 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 leading-tight truncate">
                            {user?.name ?? 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {user?.team?.field?.name ?? '-'}
                        </p>
                        <button
                            onClick={logout}
                            className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs font-semibold mt-0.5"
                        >
                            <LogOut size={12} strokeWidth={2.5} />
                            Keluar
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
