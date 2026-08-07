import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDownIcon, FilterIcon } from "./AdminActionIcons";

interface FilterDropdownProps {
  badge?: number;
  align?: "left" | "right";
  children: ReactNode;
}

/** Dropdown Filter — tutup dari mana saja (klik luar / Esc). */
export default function FilterDropdown({ badge = 0, align = "right", children }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-4 py-[10px] text-sm rounded-[10px] border border-[#C2C6D8] bg-white text-[#424655] cursor-pointer hover:border-[#A0A0A0] transition-colors"
      >
        <FilterIcon size={16} />
        Filter
        {badge > 0 && (
          <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-[#DBEAFE] text-[#256EEF] text-[11px] font-semibold">
            {badge}
          </span>
        )}
        <ChevronDownIcon size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute ${align === "left" ? "left-0" : "right-0"} z-20 mt-2 w-72 rounded-xl border border-[#E0E9F2] bg-white p-3 shadow-xl`}>
          {children}
        </div>
      )}
    </div>
  );
}
