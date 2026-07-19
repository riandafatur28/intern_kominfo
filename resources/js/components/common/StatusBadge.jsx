const statusMap = {
    draft: 'badge-draft',
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    disetujui: 'badge-approved',
    ditolak: 'badge-rejected',
    menunggu: 'badge-pending',
    completed: 'badge-approved',
};

const labelMap = {
    draft: 'Draft',
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
};

export default function StatusBadge({ status, className = '' }) {
    const key = status?.toLowerCase();
    const badgeClass = statusMap[key] || 'bg-gray-50 text-gray-600 border-gray-200';
    const label = labelMap[key] || status;

    return (
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border whitespace-nowrap ${badgeClass} ${className}`}>
            {label}
        </span>
    );
}
