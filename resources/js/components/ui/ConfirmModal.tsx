export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Ya, Keluar",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#141D23]">{title}</h2>
          <button
            onClick={onCancel}
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

        {/* Body */}
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-[#FEE2E2] text-[#DC2626]">
            <svg width="20" height="20" viewBox="0 0 22 20" fill="none">
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
              <path d="M18.5 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <p className="text-sm text-[#424655] leading-5 pt-2.5">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium text-[#424655] rounded-xl border border-[#C2C6D8] hover:bg-gray-50 hover:border-[#A0A0A0] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#DC2626] rounded-xl hover:bg-[#b91c1c] transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
