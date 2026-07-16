import React, { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom" 
import Sidebar from "./components/layout/Sidebar"
import Topbar from "./components/layout/Topbar" 
import DashboardTeamLead from "./pages/change-management/DashboardTeamLead"
import PermintaanPersetujuan from "./pages/change-management/PermintaanPersetujuan"
import ProfilSaya from "./pages/change-management/ProfilSaya"

// Bingkai Utama: Menggabungkan elemen Layout agar halaman sub-konten otomatis rapi
function LayoutShell({ children, isSidebarCollapsed, setIsSidebarCollapsed }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen bg-gray-50 text-gray-800 overflow-hidden relative font-sans antialiased">
      {/* Overlay Backdrop Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Komponen Sidebar Murni */}
      <Sidebar 
        collapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      {/* Konten Di Sebelah Kanan Sidebar */}
      <div className={`flex flex-1 flex-col overflow-hidden h-full transition-all duration-300 ${
        isSidebarCollapsed ? "md:pl-[72px]" : "md:pl-[334px]"
      }`}>
        {/* Topbar Reusable */}
        <Topbar 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Halaman Konten yang Sedang Aktif Dipanggil */}
        {children}
      </div>
    </div>
  )
}

export default function Root() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <BrowserRouter>
      <LayoutShell 
        isSidebarCollapsed={isSidebarCollapsed} 
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardTeamLead />} />
          <Route path="/permintaan-persetujuan" element={<PermintaanPersetujuan />} />
          <Route path="/profil" element={<ProfilSaya />} />
        </Routes>
      </LayoutShell>
    </BrowserRouter>
  )
}