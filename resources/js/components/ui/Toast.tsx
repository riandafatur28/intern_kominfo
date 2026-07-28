import { useEffect } from "react";

export type ToastType = "success" | "error";

export interface ToastProps {
    open: boolean;
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export default function Toast({
    open,
    message,
    type = "success",
    duration = 3000,
    onClose,
}: ToastProps) {
    useEffect(() => {
        if (!open) return;
        const id = setTimeout(onClose, duration);
        return () => clearTimeout(id);
    }, [open, duration, onClose]);

    if (!open) return null;

    const isSuccess = type === "success";

    return (
        <div className="fixed top-5 right-5 z-[60]">
            <div
                className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border text-sm ${isSuccess
                        ? "bg-white border-[#BBF7D0] text-[#15803D]"
                        : "bg-white border-[#FCA5A5] text-[#B91C1C]"
                    }`}
            >
                <span
                    className={`flex items-center justify-center w-6 h-6 shrink-0 rounded-full ${isSuccess ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#B91C1C]"
                        }`}
                >
                    {isSuccess ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                                d="M3 7.5L6 10.5L11 4.5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                                d="M4 4l6 6M10 4l-6 6"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            />
                        </svg>
                    )}
                </span>
                <span className="font-medium text-[#141D23]">{message}</span>
                <button
                    onClick={onClose}
                    aria-label="Tutup"
                    className="ml-2 text-[#767676] hover:text-[#141D23]"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
