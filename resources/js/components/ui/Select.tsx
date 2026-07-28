import { useState, useRef, useEffect } from "react";
import FormField from "./FormField";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export default function Select({
  label,
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  error,
  required = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <FormField label={label} error={error} required={required}>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between px-4 py-[10px] text-sm rounded-[10px] border text-left transition-colors ${
            error
              ? "border-[#FF0000]"
              : "border-[#C2C6D8] hover:border-[#A0A0A0]"
          } ${selected ? "text-[#141D23]" : "text-[#767676]"}`}
        >
          <span>{selected ? selected.label : placeholder}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`shrink-0 text-[#767676] transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-[#C2C6D8] rounded-[10px] shadow-lg overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange?.(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-[10px] text-sm transition-colors hover:bg-[#F6FAFF] ${
                  opt.value === value
                    ? "bg-[#DBEAFE] text-[#256EEF] font-medium"
                    : "text-[#141D23]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </FormField>
  );
}
