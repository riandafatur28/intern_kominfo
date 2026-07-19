import React, { useState } from 'react';
import { Outlet } from 'react-router-dom'; 
import SidebarTeamLead from '../components/layout/SidebarTeamLead';
import TopbarTeamLead from '../components/layout/TopbarTeamLead';

export default function TeamLeadLayout() { 
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen w-screen bg-gray-50 text-gray-800 overflow-hidden relative font-sans antialiased">
            <SidebarTeamLead 
                collapsed={isSidebarCollapsed} 
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            />

            <div className={`flex flex-1 flex-col overflow-hidden h-full transition-all duration-300 ${
                isSidebarCollapsed ? "md:pl-[72px]" : "md:pl-[334px]"
            }`}>
                <TopbarTeamLead 
                isSidebarCollapsed={isSidebarCollapsed}
                setIsSidebarCollapsed={setIsSidebarCollapsed}
                setIsMobileMenuOpen={setIsMobileMenuOpen} 
                />
                
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet /> 
                </main>
            </div>
        </div>
    );
}