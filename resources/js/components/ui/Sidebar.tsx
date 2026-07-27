import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getFilteredMenus } from "../../config/menus";
import ConfirmModal from "./ConfirmModal";

export interface SidebarMenuItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuItems = getFilteredMenus(user?.permissions ?? [], user?.roles ?? []);

  const badge = hasRole("admin")
    ? "Administrator"
    : hasRole("kepala_bidang")
      ? "Kepala Bidang"
      : hasRole("kepala_tim")
        ? "Kepala Tim"
        : hasRole("staf")
          ? "Staf"
          : user?.roles?.[0] ?? "Admin Inisiasi";

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div className="w-[334px] h-screen bg-white border-r border-[#E0E9F2] flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center pt-[34px] pb-[73px]">
        <img src="/assets/logo.png" alt="Logo" className="w-[111px] h-20 object-contain" />
      </div>

      {/* Badge */}
      <div className="flex justify-center mb-[29px]">
        <div className="inline-flex items-center bg-[#DBEAFE] rounded-[10px] px-4 py-[6px]">
          <span className="text-[10px] font-medium text-[#256EEF] leading-none">
            {badge}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-[2px] px-[14px]">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <div key={item.label} className="relative">
              {isActive && (
                <div className="absolute left-[-6px] top-0 w-[317px] h-[54px] bg-[#DBEAFE] rounded-[10px]" />
              )}
              <Link
                to={item.href}
                onClick={onClose}
                className={`relative flex items-center gap-[27px] pl-[15px] pr-4 h-[54px] rounded-[10px] text-sm font-medium leading-5 transition-colors ${
                  isActive
                    ? "text-[#256EEF]"
                    : "text-[#767676] hover:bg-[#F6FAFF]"
                }`}
              >
                <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User profile + Logout */}
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

      <ConfirmModal
        open={confirmOpen}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar?"
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        onConfirm={logout}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}