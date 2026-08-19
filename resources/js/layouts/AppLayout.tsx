import type { ReactNode } from "react";
import Sidebar from "../components/ui/Sidebar";
import TopAppBar from "../components/ui/TopAppBar";
import { useSidebar } from "../context/SidebarContext";

export default function AppLayout({
  children,
  breadcrumbs,
}: {
  children: ReactNode;
  activeItem?: string;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  const { sidebarOpen, toggleSidebar, closeSidebar } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6FAFF]">
      {/* Sidebar desktop — inline push layout, slides in/out */}
      <div
        className={`hidden lg:block shrink-0 overflow-hidden transition-all duration-500 ease-in-out ${
          sidebarOpen ? "w-[334px]" : "w-0"
        }`}
      >
        <div className="w-[334px]">
          <Sidebar />
        </div>
      </div>

      {/* Sidebar mobile — off-canvas drawer + backdrop */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeSidebar}
        />
        <div
          className={`absolute inset-y-0 left-0 w-[334px] max-w-[85vw] overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar />
        </div>
      </div>

      {/* Main content — fills remaining width */}
      <div className="flex-1 min-w-0 flex flex-col transition-all duration-500 ease-in-out">
        <TopAppBar
          breadcrumbs={breadcrumbs}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="mx-auto flex flex-col gap-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
