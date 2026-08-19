import { type ReactNode } from "react";

export interface FormSectionProps {
  title: string;
  children: ReactNode;
}

export default function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="w-full bg-white border border-[#C2C6D8]/50 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#C2C6D8]/30">
        <h3 className="text-base font-semibold text-[#141D23]">{title}</h3>
      </div>
      <div className="p-4 sm:p-8 space-y-6">{children}</div>
    </div>
  );
}
