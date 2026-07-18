import React from 'react';
import { Search, X, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const breadcrumbs = {
    '/dashboard': ['Beranda', 'Admin', 'Dashboard'],
    '/status-laporan': ['Beranda', 'Admin WFH', 'Status Laporan'],
    '/monitor-wfh': ['Beranda', 'Admin WFH', 'Monitor WFH'],
    '/spreadsheet': ['Beranda', 'Admin WFH', 'Google Spreadsheet'],
    '/monitoring-inisiasi': ['Beranda', 'Admin Inisiasi', 'Monitoring Inisiasi'],
    '/arsip': ['Beranda', 'Admin Inisiasi', 'Arsip'],
    '/profil': ['Beranda', 'Admin', 'Profil Saya'],
};

export default function Topbar({ collapsed, onToggle }) {
    const { user } = useAuth();
    const location = useLocation();
    const crumbs = breadcrumbs[location.pathname] ?? ['Beranda', 'Admin', 'Dashboard'];

    const initials = user?.name
        ?.split(' ')
        .map((s) => s[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ?? 'U';

    return (
        <header className="h-16 bg-bg-card border-b border-border-lighter flex items-center justify-between px-8 sticky top-0 z-10 w-full">
            <div className="flex items-center text-sm">
                <button
                    onClick={onToggle}
                    className="p-1 mr-3 text-text-secondary hover:text-text-primary transition-colors"
                    title="Toggle sidebar"
                >
                    {collapsed ? <Menu size={16} strokeWidth={2} /> : <X size={16} strokeWidth={2} />}
                </button>
                {crumbs.map((c, i) => (
                    <span key={i} className="flex items-center">
                        {i > 0 && <span className="mx-2 text-border">/</span>}
                        <span className={i === crumbs.length - 1 ? 'text-brand-500 font-bold' : 'text-text-secondary'}>
                            {c}
                        </span>
                    </span>
                ))}
            </div>

            <div className="flex items-center gap-6">
                <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Cari..."
                        autoComplete="off"
                        className="pl-10 pr-4 py-[9px] w-64 bg-bg-page border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-brand-100 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 pl-6 border-l border-border-light">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-text-primary leading-tight">
                            {user?.name ?? 'User'}
                        </p>
                        <p className="text-xs text-text-secondary">
                            {user?.roles?.[0] ?? 'Admin'}
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
