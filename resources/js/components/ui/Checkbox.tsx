export interface CheckboxProps {
    checked: boolean;
    onChange?: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export default function Checkbox({
    checked,
    onChange,
    label,
    disabled = false,
    className = "",
}: CheckboxProps) {
    return (
        <label
            className={`relative inline-flex items-center gap-2 select-none ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                } ${className}`}
        >
            {/*
              Real-size invisible input (not a zero-size `sr-only` clip) — a clipped-to-0x0
              input is technically "not in view" to the browser, which can trigger a
              scroll-into-view on every focus even though the visible control is already
              on-screen. An opacity-0 overlay sized to the whole label avoids that.
            */}
            <input
                type="checkbox"
                className="absolute inset-0 opacity-0 cursor-pointer"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange?.(e.target.checked)}
            />
            <span
                className={`flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border transition-colors ${checked
                        ? "bg-[#256EEF] border-[#256EEF]"
                        : "bg-white border-[#C2C6D8]"
                    }`}
            >
                {checked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke="white"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </span>
            {label && <span className="text-sm text-[#424655]">{label}</span>}
        </label>
    );
}
