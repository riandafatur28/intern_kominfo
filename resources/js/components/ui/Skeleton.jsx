export function SkeletonCard({ className = '' }) {
    return (
        <div className={`bg-white rounded-2xl border border-gray-100 p-5 ${className}`}>
            <div className="animate-pulse space-y-4">
                <div className="w-9 h-9 bg-gray-200 rounded-lg" />
                <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
    return (
        <div className="animate-pulse">
            {/* header */}
            <div className="flex gap-4 mb-3 px-6 py-4">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
                ))}
            </div>
            {/* rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-4 px-6 py-4 border-t border-gray-100">
                    {Array.from({ length: cols }).map((_, c) => (
                        <div key={c} className="h-4 bg-gray-100 rounded flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function SkeletonLine({ width = 'w-full', className = '' }) {
    return <div className={`animate-pulse h-4 bg-gray-200 rounded ${width} ${className}`} />;
}

export function SkeletonBlock({ className = '' }) {
    return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}
