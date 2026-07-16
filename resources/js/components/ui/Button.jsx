import { Loader2 } from 'lucide-react';

const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm',
    secondary: 'border border-border text-text-secondary hover:bg-bg-hover',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-error hover:bg-red-700 text-white',
    ghost: 'text-brand-500 hover:bg-brand-50',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    ...props
}) {
    return (
        <button
            className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {children}
        </button>
    );
}
