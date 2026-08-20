import { Link } from "react-router-dom";

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
  breadcrumbs = [{ label: "Beranda" }],
  sidebarOpen = true,
  onToggleSidebar,
}: TopAppBarProps) {
  return (
    <header className="flex items-center gap-3 sm:gap-6 px-4 sm:px-6 lg:px-8 bg-[#F6FAFF] border-b border-[#E0E9F2]/20 h-[59px] shrink-0">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
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

        <nav className="flex items-center gap-2 text-xs text-[#424655] font-semibold min-w-0 overflow-x-auto whitespace-nowrap scrollbar-none">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2 shrink-0">
              {i > 0 && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#C2C6D8]">
                  <path d="M4.5 2.25L7.5 6L4.5 9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {crumb.href ? (
                <Link to={crumb.href} className="text-[#256EEF] hover:underline transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-bold text-[#767676]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}