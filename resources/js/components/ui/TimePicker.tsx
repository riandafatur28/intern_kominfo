import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FormField from "./FormField";

export interface TimePickerProps {
    label: string;
    /** Format "HH:mm" (24 jam, internal selalu 24h — format hanya memengaruhi tampilan). */
    value?: string;
    onChange?: (value: string) => void;
    /** "24h" (default) atau "12h" (tampil kolom AM/PM). */
    format?: "24h" | "12h";
    /** Interval daftar Menit (mis. 5 → 00,05,10,...). Default 1. */
    step?: number;
    disabled?: boolean;
    className?: string;
    /** Dipertahankan untuk validasi dari luar (server/business logic) — lihat catatan. */
    error?: string;
    required?: boolean;
}

type Phase = "closed" | "opening" | "visible" | "hiding";

const HIDE_MS = 150;
const GAP = 4;
const MARGIN = 8;

const pad = (n: number) => String(n).padStart(2, "0");

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
/** Urutan tampilan jam 12 jam: 12, 01, 02, ... 11. */
const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const AMPM = ["AM", "PM"];

interface ColumnOption {
    label: string;
    value: number;
}

interface Column {
    label: string;
    items: ColumnOption[];
}

function nearestIndex(list: number[], v: number): number {
    let best = 0;
    let bestDist = Infinity;
    list.forEach((x, i) => {
        const d = Math.abs(x - v);
        if (d < bestDist) {
            bestDist = d;
            best = i;
        }
    });
    return best;
}

/** Terima "HH:mm" atau "HH:mm:ss" (bagian detik diabaikan). */
function parseValue(v?: string): [number, number] {
    const parts = (v ?? "").split(":").map(Number);
    const clamp = (n: number, max: number) => (Number.isInteger(n) && n >= 0 && n <= max ? n : 0);
    return [clamp(parts[0], 23), clamp(parts[1], 59)];
}

/**
 * Time picker selection-based (jam + menit): trigger (sejajar visual dengan
 * DatePicker) → panel kolom scroll pilihan (Jam/Menit, +AM/PM saat format 12h).
 * Pilih dari list → value langsung ter-update. Keyboard: ArrowUp/Down pilih,
 * ArrowLeft/Right + Tab pindah kolom, Enter commit, Escape tutup.
 * Panel via portal + pola animasi sama seperti DropdownMenu/SidebarProfileMenu.
 */
export default function TimePicker({
    label,
    value,
    onChange,
    format = "24h",
    step,
    disabled = false,
    className = "",
    error,
    required = false,
}: TimePickerProps) {
    const is12h = format === "12h";
    const stepVal = step && step > 0 ? Math.round(step) : 1;
    const minutes = useMemo(
        () => Array.from({ length: 60 }, (_, i) => i).filter((m) => m % stepVal === 0),
        [stepVal]
    );

    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const hideTimer = useRef<number | null>(null);
    const phaseRef = useRef<Phase>("closed");
    const lastCommitted = useRef<string | null>(null);

    const [phase, setPhase] = useState<Phase>("closed");
    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
    const [activeCol, setActiveCol] = useState(0);
    /** [jamIdx, menitIdx, ampmIdx] — indeks ke daftar kolom. */
    const [highlight, setHighlight] = useState<[number, number, number]>([0, 0, 0]);

    const columns: Column[] = is12h
        ? [
              { label: "Jam", items: HOURS_12.map((h, i) => ({ label: pad(h), value: i })) },
              { label: "Menit", items: minutes.map((m) => ({ label: pad(m), value: m })) },
              { label: "AM/PM", items: AMPM.map((a, i) => ({ label: a, value: i })) },
          ]
        : [
              { label: "Jam", items: HOURS_24.map((h) => ({ label: pad(h), value: h })) },
              { label: "Menit", items: minutes.map((m) => ({ label: pad(m), value: m })) },
          ];

    const setPhaseSafe = useCallback((p: Phase) => {
        phaseRef.current = p;
        setPhase(p);
    }, []);

    const commitValues = useCallback(
        (hl: number[]) => {
            const mVal = minutes[Math.min(hl[1], minutes.length - 1)];
            let hVal: number;
            if (is12h) {
                const display = HOURS_12[hl[0]];
                hVal = hl[2] === 1 ? (display % 12) + 12 : display % 12;
            } else {
                hVal = HOURS_24[Math.min(hl[0], HOURS_24.length - 1)];
            }
            const v = `${pad(hVal)}:${pad(mVal)}`;
            lastCommitted.current = v;
            onChange?.(v);
        },
        [is12h, minutes, onChange]
    );

    function initHighlight(h: number, m: number): [number, number, number] {
        const mIdx = nearestIndex(minutes, m);
        if (is12h) {
            const display = h % 12 === 0 ? 12 : h % 12;
            return [display === 12 ? 0 : display, mIdx, h < 12 ? 0 : 1];
        }
        return [h, mIdx, 0];
    }

    function openPanel() {
        if (disabled) return;
        const triggerEl = triggerRef.current;
        if (!triggerEl) return;
        const rect = triggerEl.getBoundingClientRect();
        const [h, m] = parseValue(value);
        setHighlight(initHighlight(h, m));
        setActiveCol(0);
        setPhaseSafe("opening");
        requestAnimationFrame(() => {
            if (phaseRef.current !== "opening") return;
            const panel = panelRef.current;
            if (!panel) return;
            const pw = panel.offsetWidth;
            const ph = panel.offsetHeight;
            let left = rect.left;
            let top = rect.bottom + GAP;
            left = Math.max(MARGIN, Math.min(left, window.innerWidth - pw - MARGIN));
            top = Math.max(MARGIN, Math.min(top, window.innerHeight - ph - MARGIN));
            setPos({ left, top });
            panel.focus();
            setPhaseSafe("visible");
        });
    }

    const closePanel = useCallback(() => {
        if (phaseRef.current === "closed" || phaseRef.current === "hiding") return;
        setPhaseSafe("hiding");
        if (hideTimer.current) window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => {
            if (phaseRef.current === "hiding") setPhaseSafe("closed");
        }, HIDE_MS);
    }, [setPhaseSafe]);

    // Outside click.
    useEffect(() => {
        function onPointerDown(e: PointerEvent) {
            if (phaseRef.current === "closed" || phaseRef.current === "hiding") return;
            const target = e.target as Node;
            if (triggerRef.current?.contains(target)) return;
            if (panelRef.current?.contains(target)) return;
            closePanel();
        }
        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [closePanel]);

    useEffect(
        () => () => {
            if (hideTimer.current) window.clearTimeout(hideTimer.current);
        },
        []
    );

    // Scroll item aktif ke view (pembuka + navigasi keyboard + hover).
    useEffect(() => {
        if (phase === "closed") return;
        const panel = panelRef.current;
        if (!panel) return;
        const item = panel.querySelector(`[data-col="${activeCol}"][data-idx="${highlight[activeCol]}"]`);
        item?.scrollIntoView({ block: "nearest" });
    }, [phase, activeCol, highlight]);

    function moveHighlight(col: number, delta: number) {
        const len = columns[col].items.length;
        setHighlight((prev) => {
            const next = [...prev] as number[];
            next[col] = (next[col] + delta + len) % len;
            return next as [number, number, number];
        });
    }

    function selectValue(col: number, idx: number) {
        const next = [...highlight] as number[];
        next[col] = idx;
        setHighlight(next as [number, number, number]);
        commitValues(next);
        closePanel();
    }

    function handleNow() {
        const now = new Date();
        const v = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        lastCommitted.current = v;
        onChange?.(v);
        closePanel();
    }

    function handlePanelKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        const colCount = columns.length;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            moveHighlight(activeCol, 1);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            moveHighlight(activeCol, -1);
        } else if (e.key === "ArrowRight" || e.key === "Tab") {
            e.preventDefault();
            setActiveCol((c) => (c + 1) % colCount);
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            setActiveCol((c) => (c - 1 + colCount) % colCount);
        } else if (e.key === "Enter") {
            e.preventDefault();
            commitValues(highlight);
            closePanel();
        } else if (e.key === "Escape") {
            e.preventDefault();
            closePanel();
        }
    }

    function togglePanel() {
        if (disabled) return;
        if (phaseRef.current === "closed") openPanel();
        else closePanel();
    }

    const [hVal, mVal] = parseValue(value);
    const displayValue = !value
        ? ""
        : is12h
            ? `${pad(hVal % 12 === 0 ? 12 : hVal % 12)}:${pad(mVal)} ${hVal < 12 ? "AM" : "PM"}`
            : `${pad(hVal)}:${pad(mVal)}`;

    return (
        <FormField label={label} error={error} required={required}>
            <button
                ref={triggerRef}
                type="button"
                onClick={togglePanel}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={phase !== "closed"}
                aria-invalid={error ? true : undefined}
                className={`relative w-full pl-4 pr-10 py-[10px] text-sm rounded-[10px] border outline-none transition-colors text-left ${
                    error
                        ? "border-[#FF0000] bg-red-50"
                        : "border-[#C2C6D8] hover:border-[#A0A0A0]"
                } ${disabled ? "bg-gray-50 opacity-50 cursor-not-allowed" : ""} ${
                    !value ? "text-[#767676]" : "text-[#141D23]"
                } ${className}`}
            >
                <span className="truncate">{displayValue || "HH:mm"}</span>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#767676] pointer-events-none"
                >
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 4.5V8L10.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </button>

            {phase !== "closed" &&
                createPortal(
                    <div
                        ref={panelRef}
                        role="listbox"
                        tabIndex={-1}
                        onKeyDown={handlePanelKeyDown}
                        style={{ position: "fixed", left: pos?.left ?? 0, top: pos?.top ?? 0, zIndex: 60 }}
                        className={`flex gap-1 p-1.5 rounded-xl border border-[#E0E9F2] bg-white shadow-xl transition-all duration-150 ease-out ${
                            phase === "visible" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                        }`}
                    >
                        {columns.map((col, ci) => (
                            <div key={ci} className="w-14 shrink-0">
                                <div className="text-[10px] font-medium text-[#767676] text-center mb-1">
                                    {col.label}
                                </div>
                                <div className="h-44 overflow-y-auto">
                                    {col.items.map((it, idx) => (
                                        <button
                                            key={it.value}
                                            type="button"
                                            role="option"
                                            aria-selected={highlight[ci] === idx}
                                            data-col={ci}
                                            data-idx={idx}
                                            onClick={() => selectValue(ci, idx)}
                                            onMouseEnter={() =>
                                                setHighlight((prev) => {
                                                    const next = [...prev] as number[];
                                                    next[ci] = idx;
                                                    return next as [number, number, number];
                                                })
                                            }
                                            className={`w-full px-2 py-1.5 text-center text-sm rounded-md transition-colors ${
                                                highlight[ci] === idx
                                                    ? "bg-[#DBEAFE] text-[#256EEF] font-medium"
                                                    : "text-[#424655] hover:bg-[#F6FAFF]"
                                            }`}
                                        >
                                            {it.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-end border-t border-[#E0E9F2] mt-1.5 pt-1.5">
                            <button
                                type="button"
                                onClick={handleNow}
                                className="px-3 py-1.5 text-xs font-medium text-[#256EEF] hover:bg-[#EFF6FF] rounded-md transition-colors"
                            >
                                Saat ini
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
        </FormField>
    );
}
