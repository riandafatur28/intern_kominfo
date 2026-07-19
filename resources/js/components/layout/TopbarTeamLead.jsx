import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';

export default function TopbarTeamLead({ setIsMobileMenuOpen }) {
    const location = useLocation();

    let pageTitle = "Dashboard";
    if (location.pathname.includes("permintaan-persetujuan")) {
        pageTitle = "Permintaan Persetujuan";
    } else if (location.pathname.includes("profil")) {
        pageTitle = "Profil Saya";
    }

    const user = {
        name: 'Susanti',
        role: 'Team Lead'
    };

    return (
        <header className="bg-white border-b border-[#DDDEEE] h-20 flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden p-1 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                    <Menu size={20} />
                </button>
                
                <span>Beranda</span>
                <span className="text-gray-300">/</span>
                <span>Team Lead</span>
                <span className="text-gray-300">/</span>
                <span className="text-blue-600 font-bold">{pageTitle}</span>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative w-64 hidden sm:block">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <Search size={16} />
                    </span>
                    <input
                        type="text"
                        placeholder="Cari..."
                        className="w-full bg-[#F5F6FA] text-sm text-gray-700 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900 leading-tight">{user.role}</p>
                        <p className="text-xs text-gray-400 font-medium">{user.name}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        TL
                    </div>
                </div>
            </div>
        </header>
    );
}