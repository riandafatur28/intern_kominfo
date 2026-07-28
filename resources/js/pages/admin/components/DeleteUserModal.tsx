import { useState } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { deleteUser, type UserResource } from "../../../api/users";

interface DeleteUserModalProps {
    user: UserResource | null;
    onClose: () => void;
    onDeleted: () => void;
}

export default function DeleteUserModal({ user, onClose, onDeleted }: DeleteUserModalProps) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        if (!user) return;
        setError(null);
        setDeleting(true);
        try {
            await deleteUser(user.id);
            onDeleted();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
                ?.message;
            setError(msg ?? "Gagal menghapus pengguna. Coba lagi.");
        } finally {
            setDeleting(false);
        }
    }

    const footer = (
        <>
            <Button variant="outline" onClick={onClose} disabled={deleting}>
                Batal
            </Button>
            <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-3 text-sm font-medium text-white bg-[#DC2626] rounded-xl hover:bg-[#b91c1c] transition-colors disabled:opacity-60"
            >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
            </button>
        </>
    );

    return (
        <Modal open={!!user} title="Hapus Pengguna" onClose={onClose} footer={footer} maxWidth="max-w-md">
            {user && (
                <div className="flex flex-col gap-4">
                    <div className="flex gap-3">
                        <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-[#FEE2E2] text-[#DC2626]">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M3 5h14M8 5V3.5A1.5 1.5 0 019.5 2h1A1.5 1.5 0 0112 3.5V5m2 0v11a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 016 16V5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                        <div className="text-sm text-[#424655]">
                            Hapus akun{" "}
                            <span className="font-semibold text-[#141D23]">{user.name}</span>? Akun ini
                            akan dihapus secara permanen. Pengguna tidak akan bisa login menggunakan akun
                            ini lagi.
                        </div>
                    </div>

                    <div className="rounded-lg bg-[#FEFCE8] border border-[#FDE68A] px-4 py-2 text-xs text-[#854D0E]">
                        NIP: {user.nip} · Email: {user.email}
                    </div>

                    {error && (
                        <div className="rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] px-4 py-2 text-sm text-[#B91C1C]">
                            {error}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
