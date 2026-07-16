import React from "react"
import { Menu, X } from "lucide-react"
import { useLocation } from "react-router-dom"

export default function Topbar({ isSidebarCollapsed, setIsSidebarCollapsed, setIsMobileMenuOpen }) {
  const location = useLocation();
  
  // Teks navigasi berubah otomatis mendeteksi URL halaman aktif
  const getBreadcrumbLabel = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Dashboard";
      case "/permintaan-persetujuan":
        return "Permintaan Persetujuan";
      case "/profil":
        return "Profil Saya";
      default:
        return "Dashboard";
    }
  };

  const label = getBreadcrumbLabel();

  return (
    <header className="border-b border-gray-200 bg-white px-4 sm:px-8 py-4 flex items-center gap-3 shrink-0">
      {/* Hamburger khusus Mobile */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="block md:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Tombol Kontrol Pengecilan Sidebar (Desktop) */}
      <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 items-center justify-center cursor-pointer transition-all"
          title={isSidebarCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
        >
          {isSidebarCollapsed ? (
            <Menu className="h-4 w-4 text-blue-600" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
        </button>
        
        <span className="ml-1 hidden sm:inline text-gray-400">
          Beranda <span className="text-gray-300 mx-1">/</span> Team Lead <span className="text-gray-300 mx-1">/</span> <span className="font-medium text-blue-600">{label}</span>
        </span>
        <span className="ml-1 inline sm:hidden text-blue-600 font-medium">
          {label}
        </span>
      </div>
    </header>
  )
}