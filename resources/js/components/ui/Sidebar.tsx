import { useState, type ReactNode, type ComponentType, type MouseEvent } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getFilteredMenus } from "../../config/menus";
import ConfirmModal from "./ConfirmModal";

export interface SidebarMenuItem {
  label?: string;
  href?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  onClick?: () => void;
  children?: SidebarMenuItem[];
  divider?: boolean;
  disabled?: boolean;
  matchPaths?: string[];
  /** Icon uses embedded PNG → needs CSS filter to tint on active */
  pngIcon?: boolean;
}

export interface SidebarProps {
  onClose?: () => void;
  logoSrc?: string;
  logoAlt?: string;
  logoHref?: string;
  badge?: string;
  menuItems?: SidebarMenuItem[];
  footer?: ReactNode;
  confirmTitle?: string;
  confirmMessage?: string;
}

function isActive(href: string | undefined, matchPaths: string[] | undefined, currentPath: string): boolean {
  if (!href) return false;
  if (currentPath === href) return true;
  if (matchPaths?.includes(currentPath)) return true;
  return false;
}

export default function Sidebar({
  onClose,
  logoSrc = "/assets/logo.png",
  logoAlt = "Logo",
  logoHref,
  badge: badgeProp,
  menuItems: menuItemsProp,
  footer: footerProp,
  confirmTitle = "Konfirmasi Keluar",
  confirmMessage = "Apakah Anda yakin ingin keluar?",
}: SidebarProps) {
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const menuItems = menuItemsProp ?? getFilteredMenus(user?.permissions ?? [], user?.roles ?? []);

  const badge = badgeProp
    ?? (hasRole("admin")
      ? "Administrator"
      : hasRole("kepala_bidang")
        ? "Kepala Bidang"
        : hasRole("kepala_tim")
          ? "Kepala Tim"
          : hasRole("staf")
            ? "Staf"
            : user?.roles?.[0] ?? "Admin Inisiasi");

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  const logo = (
    <img src={logoSrc} alt={logoAlt} className="w-[111px] h-20 object-contain" />
  );

  function toggleExpand(label: string) {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function handleItemClick(item: SidebarMenuItem) {
    if (item.disabled) return;
    if (item.onClick) {
      item.onClick();
      return;
    }
    if (item.children) {
      toggleExpand(item.label ?? "");
      return;
    }
    onClose?.();
  }

  function renderItem(item: SidebarMenuItem, depth = 0): ReactNode {
    if (item.divider) {
      return (
        <div
          key={item.label ?? Math.random()}
          className="my-2 border-t border-[#E0E9F2]"
        />
      );
    }

    const active = isActive(item.href, item.matchPaths, location.pathname);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.has(item.label ?? "");
    const paddingLeft = 15 + depth * 16;

    const content = (
      <span
        className={`relative flex items-center gap-[27px] pl-[15px] pr-4 h-[54px] rounded-[10px] text-sm font-medium leading-5 transition-colors ${
          active
            ? "text-[#256EEF]"
            : "text-[#767676] hover:bg-[#F6FAFF]"
        } ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <span className="shrink-0 w-5 h-5 flex items-center justify-center">
          {item.icon && (
            <item.icon size={20} className={active && item.pngIcon ? "[filter:brightness(0)_saturate(100%)_invert(31%)_sepia(52%)_saturate(2878%)_hue-rotate(214deg)_brightness(97%)_contrast(101%)]" : ""} />
          )}
        </span>
        <span className="flex-1">{item.label}</span>
        {hasChildren && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
          >
            <path d="M4.5 2.25L7.5 6L4.5 9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
    );

    const wrappedContent = active && !hasChildren ? (
      <div className="relative">
        <div className="absolute -left-[6px] -right-[6px] top-0 h-[54px] bg-[#DBEAFE] rounded-[10px]" />
        {content}
      </div>
    ) : content;

    const childrenContent = hasChildren && isExpanded ? (
      <div className="flex flex-col gap-[2px]">
        {item.children!.map((child) => renderItem(child, depth + 1))}
      </div>
    ) : null;

    if (item.href && !item.onClick && !hasChildren) {
      return (
        <div key={item.label}>
          <Link
            to={item.href}
            onClick={() => onClose?.()}
            className={`block ${item.disabled ? "pointer-events-none" : ""}`}
          >
            {wrappedContent}
          </Link>
          {childrenContent}
        </div>
      );
    }

    return (
      <div key={item.label}>
        <button
          type="button"
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className="w-full text-left block"
        >
          {wrappedContent}
        </button>
        {childrenContent}
      </div>
    );
  }

  return (
    <div className="w-[334px] h-screen bg-white border-r border-[#E0E9F2] flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center pt-[34px] pb-[73px]">
        {logoHref ? <Link to={logoHref}>{logo}</Link> : logo}
      </div>

      {/* Badge */}
      {badge && (
        <div className="flex justify-center mb-[29px]">
          <div className="inline-flex items-center bg-[#DBEAFE] rounded-[10px] px-4 py-[6px]">
            <span className="text-[10px] font-medium text-[#256EEF] leading-none">
              {badge}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-[2px] px-[14px] overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => renderItem(item))}
      </nav>

      {/* Footer: custom or default user profile */}
      {footerProp ?? (
        <div className="shrink-0">
          <div className="w-[331px] h-[123px] bg-white flex items-center pl-[23px] pr-[17px]">
            <div className="w-[72px] h-[69px] rounded-full bg-[#256EEF] flex items-center justify-center shrink-0">
              <span className="text-white text-xl font-normal">{initial}</span>
            </div>
            <div className="flex flex-col justify-center ml-[22px] min-w-0">
              <p className="text-sm font-medium text-black leading-5 truncate">
                {user?.name ?? "User"}
              </p>
              <p className="text-xs text-[#767676] leading-4 truncate mt-[3px]">
                {user?.team?.field?.name ?? user?.position ?? user?.roles?.[0] ?? "-"}
              </p>
              <button
                onClick={() => setConfirmOpen(true)}
                className="flex items-center gap-[27px] text-[#FF0000] text-sm font-medium leading-5 hover:underline mt-[20px]"
              >
                <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
                  <path d="M8 17H4.66667C4.22464 17 3.80072 16.8244 3.48816 16.5118C3.17559 16.1993 3 15.7754 3 15.3333V4.66667C3 4.22464 3.17559 3.80072 3.48816 3.48816C3.80072 3.17559 4.22464 3 4.66667 3H8" stroke="#FF0000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.6667 14.1667L18.5 10L14.6667 5.83333" stroke="#FF0000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 10H8" stroke="#FF0000" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        onConfirm={logout}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}