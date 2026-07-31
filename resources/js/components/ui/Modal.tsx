import { type ReactNode } from "react";

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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className={`rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] flex flex-col ${className || "bg-white"}`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#C2C6D8]/30">
                        <h2 className="text-lg font-bold text-[#141D23]">{title}</h2>
                        <button
                            onClick={onClose}
                            aria-label="Tutup"
                            className="text-[#767676] hover:text-[#141D23] transition-colors"
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

                <div className="px-6 py-5 overflow-y-auto">{children}</div>

                {footer && (
                    <div className="flex gap-3 justify-end px-6 py-4 border-t border-[#C2C6D8]/30">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
