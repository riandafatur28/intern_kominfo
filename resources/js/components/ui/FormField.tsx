import { type ReactNode } from "react";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export default function FormField({
  label,
  htmlFor,
  error,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-[#424655]"
      >
        {label}
        {required && <span className="text-[#FF0000] ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-[#FF0000] mt-0.5">{error}</p>
      )}
    </div>
  );
}
