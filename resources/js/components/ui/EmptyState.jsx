export default function EmptyState({ message = 'Tidak ada data', icon: Icon = null }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            {Icon && <Icon size={40} className="mb-3 opacity-50" />}
            <p className="text-sm">{message}</p>
        </div>
    );
}
