import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextValue {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * State sidebar murni memory (bukan localStorage) — hidup selama sesi SPA,
 * reset saat refresh halaman. Dinaikkan ke atas Routes supaya state tidak
 * hilang tiap navigasi (AppLayout ter-mount ulang per halaman).
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default: terbuka di layar lebar (>=1024px), tertutup di layar kecil
  // (sidebar mobile tampil sebagai drawer off-canvas lewat hamburger).
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 1024
  );
  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar: () => setSidebarOpen((v) => !v),
        closeSidebar: () => setSidebarOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
