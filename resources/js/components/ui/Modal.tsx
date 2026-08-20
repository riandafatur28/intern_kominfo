import { type ReactNode } from "react";

// Workaround: app.css @theme redefines --spacing-* tokens (e.g. --spacing-lg: 24px),
// which shadows Tailwind v4's scale. `max-w-<name>` compiles to
// `max-width: var(--spacing-<name>)`, so `max-w-lg` = 24px instead of 32rem —
// dialogs render as a thin vertical bar. Map to equivalent arbitrary values.
const MAX_WIDTH_FIX: Record<string, string> = {
    "max-w-xs": "max-w-[20rem]",
    "max-w-sm": "max-w-[24rem]",
    "max-w-md": "max-w-[28rem]",
    "max-w-lg": "max-w-[32rem]",
    "max-w-xl": "max-w-[36rem]",
    "max-w-2xl": "max-w-[42rem]",
    "max-w-3xl": "max-w-[48rem]",
    "max-w-4xl": "max-w-[56rem]",
    "max-w-5xl": "max-w-[64rem]",
    "max-w-6xl": "max-w-[72rem]",
    "max-w-7xl": "max-w-[80rem]",
};

export interface ModalProps {
    open: boolean;
    title?: string;
    onClose: () => void;
    children: ReactNode;
    /** Optional footer area, e.g. action buttons. */
    footer?: ReactNode;
    /** Tailwind max-width class for the dialog. Defaults to max-w-lg. */
    maxWidth?: string;
    /** Override container classes. Defaults to "bg-white". */
    className?: string;
}

export default function Modal({
    open,
    title,
    onClose,
    children,
    footer,
    maxWidth = "max-w-lg",
    className = "",
}: ModalProps) {
    if (!open) return null;

    const resolvedMaxWidth = MAX_WIDTH_FIX[maxWidth] ?? maxWidth;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className={`rounded-2xl shadow-xl w-full ${resolvedMaxWidth} max-h-[90vh] overflow-y-auto ${className || "bg-white"}`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-[#C2C6D8]/30">
                        <h2 className="text-lg font-bold text-[#141D23] min-w-0 truncate">{title}</h2>
                        <button
                            onClick={onClose}
                            aria-label="Tutup"
                            className="text-[#767676] hover:text-[#141D23] transition-colors shrink-0"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M5 5L15 15M15 5L5 15"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="px-4 sm:px-6 py-5 overflow-y-auto">{children}</div>

                {footer && (
                    <div className="flex flex-wrap gap-3 justify-end px-4 sm:px-6 py-4 border-t border-[#C2C6D8]/30">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
