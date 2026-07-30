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
            className={`inline-flex items-center gap-2 select-none ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                } ${className}`}
        >
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
            <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange?.(e.target.checked)}
            />
        </label>
    );
}
