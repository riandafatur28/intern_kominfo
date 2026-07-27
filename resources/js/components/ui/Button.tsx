import { type ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary:
    "bg-[#256EEF] text-white border border-[#256EEF] hover:bg-[#1d5cd4]",
  outline:
    "bg-white text-[#424655] border border-[#C2C6D8] hover:bg-gray-50 hover:border-[#A0A0A0]",
};

const sizes = {
  sm: "px-4 py-2 text-xs rounded-lg",
  md: "px-6 py-3 text-sm rounded-xl",
  lg: "px-8 py-4 text-base rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
