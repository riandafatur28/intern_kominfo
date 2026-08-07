import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ConfirmModal from "./ConfirmModal";
import { ProfilIcon } from "./icons";

export interface SidebarProfileMenuProps {
    confirmTitle?: string;
    confirmMessage?: string;
}

type PopoverPhase = "closed" | "opening" | "visible" | "hiding";

const HIDE_MS = 150;

/**
 * Sidebar footer user info → profile dropdown (shadcn/ui sidebar pattern).
 * Trigger = avatar + nama + role. Popover opens UPWARD (trigger sits at the
 * bottom of the sidebar), match-width. "Keluar" opens the shared ConfirmModal
 * (AlertDialog) instead of logging out directly; logout runs only on "Ya, Keluar".
 * Rendered via portal so the sidebar's overflow-hidden wrapper can't clip it.
 */
export default function SidebarProfileMenu({
    confirmTitle = "Konfirmasi Keluar",
    confirmMessage = "Apakah Anda yakin ingin keluar?",
}: SidebarProfileMenuProps) {
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();

    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const hideTimer = useRef<number | null>(null);
    const phaseRef = useRef<PopoverPhase>("closed");

    const [phase, setPhase] = useState<PopoverPhase>("closed");
    const [rect, setRect] = useState<{ left: number; bottom: number; width: number } | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    function setPhaseSafe(p: PopoverPhase) {
        phaseRef.current = p;
        setPhase(p);
    }

    const roleLabel = hasRole("admin")
        ? "Administrator"
        : hasRole("kepala_bidang")
            ? "Kepala Bidang"
            : hasRole("kepala_tim")
                ? "Kepala Tim"
                : hasRole("staf")
                    ? "Staf"
                    : user?.roles?.[0] ?? "Admin Inisiasi";

    const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

    function openPopover() {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setRect({ left: r.left, bottom: window.innerHeight - r.top, width: r.width });
        setPhaseSafe("opening");
        requestAnimationFrame(() => {
            if (phaseRef.current === "opening") setPhaseSafe("visible");
        });
    }

    const closePopover = useCallback(() => {
        if (phaseRef.current === "closed" || phaseRef.current === "hiding") return;
        setPhaseSafe("hiding");
        if (hideTimer.current) window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => {
            if (phaseRef.current === "hiding") setPhaseSafe("closed");
        }, HIDE_MS);
    }, []);

    function togglePopover() {
        if (phaseRef.current === "closed") openPopover();
        else closePopover();
    }

    useEffect(() => {
        function onPointerDown(e: PointerEvent) {
            if (phaseRef.current === "closed" || phaseRef.current === "hiding") return;
            const target = e.target as Node;
            if (triggerRef.current?.contains(target)) return;
            if (popoverRef.current?.contains(target)) return;
            closePopover();
        }
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") closePopover();
        }
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [closePopover]);

    useEffect(
        () => () => {
            if (hideTimer.current) window.clearTimeout(hideTimer.current);
        },
        []
    );

    function handleAccountClick() {
        closePopover();
        navigate("/profil");
    }

    function handleLogoutClick() {
        closePopover();
        setConfirmOpen(true);
    }

    return (
        <div className="shrink-0 flex justify-center">
            <button
                ref={triggerRef}
                type="button"
                onClick={togglePopover}
                aria-haspopup="menu"
                aria-expanded={phase !== "closed"}
                className="w-[331px] flex items-center gap-[22px] pl-[23px] pr-[17px] py-3 rounded-[10px] text-left transition-colors hover:bg-[#F6FAFF]"
            >
                <div className="w-[72px] h-[69px] rounded-full bg-[#256EEF] flex items-center justify-center shrink-0">
                    <span className="text-white text-xl font-normal">{initial}</span>
                </div>
                <div className="flex flex-col justify-center min-w-0 flex-1">
                    <p className="text-sm font-medium text-black leading-5 truncate">
                        {user?.name ?? "User"}
                    </p>
                    <p className="text-xs text-[#767676] leading-4 truncate mt-[3px]">{roleLabel}</p>
                </div>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className={`shrink-0 text-[#767676] transition-transform duration-150 ${
                        phase === "visible" ? "rotate-180" : ""
                    }`}
                >
                    <path
                        d="M3.5 5.25L7 8.75L10.5 5.25"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {phase !== "closed" && rect && createPortal(
                <div
                    ref={popoverRef}
                    role="menu"
                    style={{ position: "fixed", left: rect.left, bottom: rect.bottom, width: rect.width, zIndex: 40 }}
                    className={`rounded-xl border border-[#E0E9F2] bg-white shadow-xl overflow-hidden transition-all duration-150 ease-out ${
                        phase === "visible" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                    }`}
                >
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-[#256EEF] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                            {initial}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#141D23] truncate">
                                {user?.name ?? "User"}
                            </p>
                            <p className="text-xs text-[#767676] truncate">{roleLabel}</p>
                        </div>
                    </div>
                    <div className="border-t border-[#E0E9F2]" />
                    <button
                        type="button"
                        role="menuitem"
                        onClick={handleAccountClick}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#424655] hover:bg-[#F6FAFF] transition-colors"
                    >
                        <ProfilIcon size={18} />
                        Profil Saya
                    </button>
                    <div className="border-t border-[#E0E9F2]" />
                    <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 22 20" fill="none">
                            <path
                                d="M8 17H4.66667C4.22464 17 3.80072 16.8244 3.48816 16.5118C3.17559 16.1993 3 15.7754 3 15.3333V4.66667C3 4.22464 3.17559 3.80072 3.48816 3.48816C3.80072 3.17559 4.22464 3 4.66667 3H8"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M14.6667 14.1667L18.5 10L14.6667 5.83333"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M18.5 10H8"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                        Keluar
                    </button>
                </div>,
                document.body
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
