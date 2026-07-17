import React from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const breadcrumbs = {
    '/dashboard': ['Beranda', 'Admin WFH', 'Dashboard'],
    '/status-laporan': ['Beranda', 'Admin WFH', 'Status Laporan'],
    '/monitor-wfh': ['Beranda', 'Admin WFH', 'Monitor WFH'],
    '/spreadsheet': ['Beranda', 'Admin WFH', 'Google Spreadsheet'],
    '/profil': ['Beranda', 'Admin WFH', 'Profil Saya'],
};

export default function Topbar({ onMenuClick }) {
    const location = useLocation();
    const crumbs = breadcrumbs[location.pathname] ?? ['Beranda', 'Admin WFH', 'Dashboard'];

    return (
        <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 sticky top-0 z-20">
            <button
                onClick={onMenuClick}
                className="mr-3 p-1 text-gray-500 hover:text-gray-700 lg:hidden"
            >
                <Menu size={20} />
            </button>

            <div className="flex items-center text-sm">
                <span className="text-gray-400 mr-2">&times;</span>
                {crumbs.map((c, i) => (
                    <span key={i} className="flex items-center">
                        {i > 0 && <span className="mx-1 text-gray-300">/</span>}
                        <span className={i === crumbs.length - 1 ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                            {c}
                        </span>
                    </span>
                ))}
            </div>
        </header>
    );
}
