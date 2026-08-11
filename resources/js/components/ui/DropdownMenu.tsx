import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type DropdownMenuItemVariant = "default" | "destructive";

export interface DropdownMenuItem {
    label: string;
    icon?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: DropdownMenuItemVariant;
    /** Render a divider above this item (e.g. memisah "Edit/Hapus" dari aksi lain). */
    separator?: boolean;
}

export interface DropdownMenuProps {
    items: DropdownMenuItem[];
    trigger: ReactNode;
    align?: "start" | "end";
    side?: "top" | "bottom";
    className?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

type MenuPhase = "closed" | "opening" | "visible" | "hiding";

const HIDE_MS = 150;
const GAP = 4;
const VIEWPORT_MARGIN = 8;

/**
 * Generic action dropdown. Trigger = ReactNode (biasanya icon button ⋮).
 * Menu dibuka via portal ke document.body (tidak terpotong overflow-hidden
 * parent, mis. container tabel). Posisi otomatis clamp ke viewport.
 * Tutup saat: klik luar, Escape, atau klik item.
 */
export default function DropdownMenu({
    items,
    trigger,
    align = "end",
    side = "bottom",
    className = "",
    open,
    onOpenChange,
}: DropdownMenuProps) {
    const controlled = open !== undefined;

    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const hideTimer = useRef<number | null>(null);
    const phaseRef = useRef<MenuPhase>("closed");

    const [phase, setPhase] = useState<MenuPhase>("closed");
    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

    const setPhaseSafe = useCallback((p: MenuPhase) => {
        phaseRef.current = p;
        setPhase(p);
    }, []);

    const openMenu = useCallback(() => {
        const triggerEl = triggerRef.current;
      if (!triggerEl) return;
      const rect = triggerEl.getBoundingClientRect();
      
      setPhaseSafe("opening");

        // Ukur menu setelah mount (saat masih opacity-0), lalu clamp posisi.
        requestAnimationFrame(() => {
            if (phaseRef.current !== "opening") return;
            const menuEl = menuRef.current;
            if (!menuEl) return;
            const mw = menuEl.offsetWidth;
            const mh = menuEl.offsetHeight;
            let left = align === "end" ? rect.right - mw : rect.left;
            let top = side === "bottom" ? rect.bottom + GAP : rect.top - mh - GAP;
            left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - mw - VIEWPORT_MARGIN));
            top = Math.max(VIEWPORT_MARGIN, Math.min(top, window.innerHeight - mh - VIEWPORT_MARGIN));
            setPos({ left, top });
            setPhaseSafe("visible");
        });
    }, [align, side, setPhaseSafe]);

    const closeMenu = useCallback(() => {
        if (phaseRef.current === "closed" || phaseRef.current === "hiding") return;
        setPhaseSafe("hiding");
        if (hideTimer.current) window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => {
            if (phaseRef.current === "hiding") setPhaseSafe("closed");
        }, HIDE_MS);
    }, [setPhaseSafe]);

    // Controlled mode: sinkronkan fase dengan prop `open`.
    useEffect(() => {
        if (!controlled) return;
        if (open) openMenu();
        else closeMenu();
    }, [controlled, open, openMenu, closeMenu]);

    // Outside click + Escape.
    useEffect(() => {
        function onPointerDown(e: PointerEvent) {
            if (phaseRef.current === "closed" || phaseRef.current === "hiding") return;
            const target = e.target as Node;
            if (triggerRef.current?.contains(target)) return;
            if (menuRef.current?.contains(target)) return;
            onOpenChange?.(false);
            if (!controlled) closeMenu();
        }
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && phaseRef.current !== "closed") {
                onOpenChange?.(false);
                if (!controlled) closeMenu();
            }
        }
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [controlled, closeMenu, onOpenChange]);

    // Bersihkan timer saat unmount.
    useEffect(
        () => () => {
            if (hideTimer.current) window.clearTimeout(hideTimer.current);
        },
        []
    );

    function toggle() {
        if (phaseRef.current === "closed") {
            onOpenChange?.(true);
            if (!controlled) openMenu();
        } else {
            onOpenChange?.(false);
            if (!controlled) closeMenu();
        }
    }

    function handleItemClick(item: DropdownMenuItem) {
        onOpenChange?.(false);
        if (!controlled) closeMenu();
        item.onClick?.();
    }

    const isOpen = controlled ? open === true : phase !== "closed";

    return (
        <div className={`relative inline-flex ${className}`}>
            <div
                ref={triggerRef}
                onClick={toggle}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                className="inline-flex"
            >
                {trigger}
            </div>

            {phase !== "closed" &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        style={{ position: "fixed", left: pos?.left ?? 0, top: pos?.top ?? 0, zIndex: 40 }}
                        className={`min-w-[160px] py-1.5 rounded-xl border border-[#E0E9F2] bg-white shadow-xl transition-[opacity,transform] duration-150 ease-out ${
                            phase === "visible"
                                ? "opacity-100 translate-y-0"
                                : side === "top"
                                    ? "opacity-0 translate-y-1"
                                    : "opacity-0 -translate-y-1"
                        }`}
                    >
                        {items.map((item, i) => (
                            <div key={item.label ?? i}>
                                {item.separator && (
                                    <div className="my-1.5 border-t border-[#E0E9F2]" />
                                )}
                                <button
                                    type="button"
                                    role="menuitem"
                                    disabled={item.disabled}
                                    onClick={() => handleItemClick(item)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                                        item.variant === "destructive"
                                            ? "text-[#DC2626] hover:bg-[#FEF2F2]"
                                            : "text-[#424655] hover:bg-[#F6FAFF]"
                                    } ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                >
                                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                                    <span className="truncate">{item.label}</span>
                                </button>
                            </div>
                        ))}
                    </div>,
                    document.body
                )}
        </div>
    );
}
