import DropdownMenu from "./DropdownMenu";

const MoreVerticalIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="4" r="1.5" fill="currentColor" />
        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
        <circle cx="10" cy="16" r="1.5" fill="currentColor" />
    </svg>
);

const PencilIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path
            d="M4 13.5V16h2.5l7.4-7.4-2.5-2.5L4 13.5zM15.7 6.3a1 1 0 000-1.4l-1.6-1.6a1 1 0 00-1.4 0l-1.2 1.2 3 3 1.2-1.2z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
        />
    </svg>
);

const TrashIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path
            d="M3 5h14M8 5V3.5A1.5 1.5 0 019.5 2h1A1.5 1.5 0 0112 3.5V5m2 0v11a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 016 16V5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/**
 * Contoh pemakaian DropdownMenu — action menu "Edit/Hapus" untuk kolom Aksi.
 * File ini TIDAK dipasang ke halaman mana pun; hanya sebagai referensi integrasi
 * untuk pemilik halaman (mis. Manajemen Pengguna) nanti.
 */
export default function DropdownMenuExample() {
    return (
        <div className="min-h-screen bg-[#F6FAFF] p-16">
            <div className="bg-white border border-[#C2C6D8] rounded-xl p-4 w-fit flex items-center justify-center">
                <DropdownMenu
                    trigger={
                        <button
                            type="button"
                            aria-label="Aksi"
                            className="p-2 rounded-lg text-[#424655] hover:bg-[#F6FAFF] transition-colors"
                        >
                            <MoreVerticalIcon />
                        </button>
                    }
                    items={[
                        { label: "Edit", icon: <PencilIcon />, onClick: () => console.log("Edit diklik") },
                        { label: "Hapus", icon: <TrashIcon />, variant: "destructive", onClick: () => console.log("Hapus diklik") },
                    ]}
                />
            </div>
        </div>
    );
}
