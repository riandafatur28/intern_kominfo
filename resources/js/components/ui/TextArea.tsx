import { type TextareaHTMLAttributes } from "react";
import FormField from "./FormField";

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
}

export default function TextArea({
  label,
  value,
  onChange,
  error,
  required = false,
  rows = 4,
  className = "",
  ...rest
}: TextAreaProps) {
  return (
    <FormField label={label} error={error} required={required}>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        rows={rows}
        className={`w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border outline-none resize-none transition-colors placeholder:text-[#767676] ${
          error
            ? "border-[#FF0000]"
            : "border-[#C2C6D8] hover:border-[#A0A0A0] focus:border-[#256EEF]"
        } ${className}`}
        {...rest}
      />
    </FormField>
  );
}
