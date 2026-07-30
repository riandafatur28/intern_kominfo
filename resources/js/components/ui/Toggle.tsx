export interface ToggleProps {
    checked: boolean;
    onChange?: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export default function Toggle({
    checked,
    onChange,
    label,
    disabled = false,
    className = "",
}: ToggleProps) {
    return (
        <label
            className={`inline-flex items-center gap-3 select-none ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                } ${className}`}
        >
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange?.(!checked)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[#256EEF]" : "bg-[#C2C6D8]"
                    }`}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-[2px]"
                        }`}
                />
            </button>
            {label && <span className="text-sm text-[#424655]">{label}</span>}
        </label>
    );
}
