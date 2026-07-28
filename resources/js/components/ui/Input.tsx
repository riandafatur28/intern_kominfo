import { type InputHTMLAttributes } from "react";
import FormField from "./FormField";

export interface InputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    label: string;
    value?: string;
    onChange?: (value: string) => void;
    error?: string;
    required?: boolean;
}

export default function Input({
    label,
    value,
    onChange,
    error,
    required = false,
    type = "text",
    className = "",
    ...rest
}: InputProps) {
    return (
        <FormField label={label} error={error} required={required}>
            <input
                type={type}
                value={value ?? ""}
                onChange={(e) => onChange?.(e.target.value)}
                className={`w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border outline-none transition-colors placeholder:text-[#767676] ${error
                        ? "border-[#FF0000]"
                        : "border-[#C2C6D8] hover:border-[#A0A0A0] focus:border-[#256EEF]"
                    } ${className}`}
                {...rest}
            />
        </FormField>
    );
}
