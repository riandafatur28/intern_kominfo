import FormField from "./FormField";

export interface DatePickerProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
}

export default function DatePicker({
  label,
  value,
  onChange,
  error,
  required = false,
}: DatePickerProps) {
  return (
    <FormField label={label} error={error} required={required}>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          aria-invalid={error ? true : undefined}
          className={`w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border outline-none transition-colors [color-scheme:light] ${
            error
              ? "border-[#FF0000] bg-red-50 focus:ring-2 focus:ring-red-200"
              : "border-[#C2C6D8] hover:border-[#A0A0A0] focus:border-[#256EEF]"
          } ${!value ? "text-[#767676]" : ""}`}
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#767676] pointer-events-none"
        >
          <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 7H14" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </FormField>
  );
}
