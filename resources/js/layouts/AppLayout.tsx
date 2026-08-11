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
  const { sidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6FAFF]">
      {/* Sidebar wrapper — slides in/out */}
      <div
        className={`shrink-0 overflow-hidden transition-all duration-500 ease-in-out ${
          sidebarOpen ? "w-[334px]" : "w-0"
        }`}
      >
        <div className="w-[334px]">
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

        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto flex flex-col gap-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}