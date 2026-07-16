import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
    '/dashboard': 'Dashboard',
    '/manajemen-inisiasi': 'Manajemen Inisiasi',
    '/arsip': 'Status & Arsip',
    '/profil': 'Profil Saya',
};

export default function Topbar() {
    const location = useLocation();
    const { user } = useAuth();
    const title = pageTitles[location.pathname] ?? 'Dashboard';

    const initials = user?.name
        ?.split(' ')
        .map((s) => s[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ?? 'U';

    return (
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 sticky top-0 z-10 w-full">
            <div className="flex items-center text-sm">
                <span className="text-gray-400">Beranda</span>
                <span className="mx-2 text-gray-300">/</span>
                <span className="text-gray-400">Admin Inisiasi</span>
                <span className="mx-2 text-gray-300">/</span>
                <span className="text-blue-600 font-semibold">{title}</span>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Cari..."
                        className="pl-10 pr-4 py-[6px] w-48 bg-white border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                    />
                </div>

                <button className="relative p-1 hover:bg-gray-50 rounded-full transition-colors">
                    <Bell className="text-gray-500" size={20} />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        3
                    </span>
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-[#E5E7EB]">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">
                            {user?.name ?? 'User'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {user?.team?.field?.name ?? '-'}
                        </p>
                    </div>
                    <div className="w-[34px] h-[34px] bg-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {initials}
                    </div>
                </div>
            </div>
        </header>
    );
}
