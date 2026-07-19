export default function Card({ children, className = '', padding = true, ...props }) {
    return (
        <div
            className={`bg-bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.05)] ${
                padding ? 'p-6' : ''
            } ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
