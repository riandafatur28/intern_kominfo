export default function Select({ label, error, className = '', children, ...props }) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-xs text-text-secondary block font-medium">{label}</label>
            )}
            <select
                className={`w-full border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all bg-white ${
                    error ? 'border-error' : 'border-border-light'
                } ${className}`}
                {...props}
            >
                {children}
            </select>
            {error && <p className="text-xs text-error">{error}</p>}
        </div>
    );
}
