import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TopAppBarProps {
  breadcrumbs?: BreadcrumbItem[];
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function TopAppBar({
  breadcrumbs = [{ label: "Dashboard" }],
  sidebarOpen = true,
  onToggleSidebar,
}: TopAppBarProps) {
  const { user } = useAuth();
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <header className="flex items-center justify-between px-8 bg-[#F6FAFF] border-b border-[#E0E9F2]/20 h-[59px] shrink-0">
      <div className="flex items-center gap-6">
        {/* Hamburger / Toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-0 rounded-lg hover:bg-gray-100 transition-colors text-[#424655]"
          aria-label={sidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
        >
          {sidebarOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <nav className="flex items-center gap-2 text-xs text-[#424655] font-semibold">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#C2C6D8]">
                  <path d="M4.5 2.25L7.5 6L4.5 9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {crumb.href ? (
                <Link to={crumb.href} className="text-[#424655] hover:text-[#256EEF] transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-bold text-[#256EEF]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-0 rounded-full hover:bg-gray-100 transition-colors relative">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#141D23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" stroke="#141D23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="absolute top-0 right-0 w-[6px] h-[6px] rounded-full bg-[#EF4444]" />
        </button>

        <div className="w-px h-6 bg-[#D0D3DD]" />

        <div className="flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-full bg-[#256EEF] flex items-center justify-center text-white text-[18px] font-medium">
            {initial}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-[#141D23] leading-4">{user?.name ?? "User"}</p>
            <p className="text-[11px] text-[#424655] leading-[14px]">{user?.team?.field?.name ?? user?.position ?? "-"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}