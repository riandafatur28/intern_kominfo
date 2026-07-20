import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { UserPlus, Search, Users, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { getUsers, deleteUser } from '../../api/admin';
import TambahPenggunaModal from '../../components/admin/TambahPenggunaModal';
import Modal from '../../components/ui/Modal';

const ROLE_LABELS = { admin: 'WFH Admin', kepala_tim: 'Kepala Tim', kepala_bidang: 'Kepala Bidang', staf: 'Staf', pegawai: 'Pegawai' };
const AVATAR_COLORS = ['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-cyan-500', 'bg-fuchsia-500'];
const PER_PAGE = 10;

function initialsOf(name = '') {
    return name.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2) || 'U';
}

function RoleBadges({ roles = [] }) {
    if (!roles.length) return <span className="text-xs text-gray-400">-</span>;
    return (
        <div className="flex flex-wrap gap-1">
            {roles.map((r) => (
                <span key={r} className="inline-block bg-indigo-50 text-indigo-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                    {ROLE_LABELS[r] ?? r}
                </span>
            ))}
        </div>
    );
}

function StatusBadge({ active }) {
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
            {active ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

export default function ManajemenPengguna() {
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        getUsers({ per_page: 100 })
            .then((res) => setUsers(res.data || []))
            .catch((e) => setError(e.response?.data?.message || 'Gagal memuat data pengguna.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    // Distinct roles for the filter dropdown
    const availableRoles = useMemo(() => {
        const set = new Set();
        users.forEach((u) => (u.roles ?? []).forEach((r) => set.add(r)));
        return [...set];
    }, [users]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users.filter((u) => {
            const matchQ = !q
                || u.name?.toLowerCase().includes(q)
                || u.nip?.toLowerCase().includes(q)
                || u.email?.toLowerCase().includes(q);
            const matchRole = !roleFilter || (u.roles ?? []).includes(roleFilter);
            return matchQ && matchRole;
        });
    }, [users, search, roleFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const pageSafe = Math.min(page, totalPages);
    const paged = filtered.slice((pageSafe - 1) * PER_PAGE, pageSafe * PER_PAGE);

    useEffect(() => { setPage(1); }, [search, roleFilter]);

    const handleCreated = () => {
        showToast('success', editing ? 'Pengguna berhasil diperbarui.' : 'Pengguna berhasil ditambahkan.');
        setEditing(null);
        load();
    };

    const confirmDelete = async () => {
        if (!deleting) return;
        setDeleteLoading(true);
        try {
            await deleteUser(deleting.id);
            showToast('success', 'Pengguna berhasil dihapus.');
            setDeleting(null);
            load();
        } catch (e) {
            showToast('error', e.response?.data?.message || 'Gagal menghapus pengguna.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const openAdd = () => { setEditing(null); setShowForm(true); };
    const openEdit = (u) => { setEditing(u); setShowForm(true); };

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Manajemen Pengguna</h1>
                    <p className="text-sm text-gray-400 mt-1">Kelola seluruh pengguna sistem</p>
                </div>
                {hasPermission('user.create') && (
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
                    >
                        <UserPlus size={16} />
                        Tambah Pengguna
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama, NIP, atau email"
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Semua Role</option>
                    {availableRoles.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                    ))}
                </select>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-6"><SkeletonTable rows={8} cols={5} /></div>
                ) : error ? (
                    <div className="p-6 text-red-600 text-sm bg-red-50 flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={load} className="underline font-medium">Ulangi</button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Users size={40} className="mb-3 opacity-50" />
                        <p>Tidak ada pengguna ditemukan.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <table className="w-full hidden md:table">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="px-6 py-3 font-semibold">Pegawai</th>
                                    <th className="px-6 py-3 font-semibold">NIP</th>
                                    <th className="px-6 py-3 font-semibold">Jabatan</th>
                                    <th className="px-6 py-3 font-semibold">Bidang</th>
                                    <th className="px-6 py-3 font-semibold">Role</th>
                                    <th className="px-6 py-3 font-semibold">Status</th>
                                    <th className="px-6 py-3 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((u) => (
                                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[u.id % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                    {initialsOf(u.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                                                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{u.nip ?? '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{u.position ?? '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{u.team?.field?.name ?? '-'}</td>
                                        <td className="px-6 py-4"><RoleBadges roles={u.roles} /></td>
                                        <td className="px-6 py-4"><StatusBadge active={u.is_active} /></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {hasPermission('user.update') && (
                                                    <button onClick={() => openEdit(u)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                                {hasPermission('user.delete') && (
                                                    <button onClick={() => setDeleting(u)} className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-50">
                            {paged.map((u) => (
                                <div key={u.id} className="p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[u.id % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                {initialsOf(u.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                            </div>
                                        </div>
                                        <StatusBadge active={u.is_active} />
                                    </div>
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <p>NIP: {u.nip ?? '-'}</p>
                                        <p>Jabatan: {u.position ?? '-'} · {u.team?.field?.name ?? '-'}</p>
                                    </div>
                                    <RoleBadges roles={u.roles} />
                                    <div className="flex items-center gap-4 pt-1">
                                        {hasPermission('user.update') && (
                                            <button onClick={() => openEdit(u)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600">
                                                <Pencil size={15} /> Edit
                                            </button>
                                        )}
                                        {hasPermission('user.delete') && (
                                            <button onClick={() => setDeleting(u)} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600">
                                                <Trash2 size={15} /> Hapus
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {!loading && !error && filtered.length > PER_PAGE && (
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <p className="text-sm text-gray-400">
                        Halaman {pageSafe} dari {totalPages} · {filtered.length} pengguna
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={pageSafe <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            Sebelumnya
                        </button>
                        <button
                            disabled={pageSafe >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            )}

            {/* Add / Edit modal */}
            <TambahPenggunaModal
                open={showForm}
                user={editing}
                onClose={() => { setShowForm(false); setEditing(null); }}
                onSuccess={handleCreated}
            />

            {/* Delete confirm */}
            <Modal open={!!deleting} onClose={() => { if (!deleteLoading) setDeleting(null); }} width="max-w-sm">
                <div className="text-center py-4">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={28} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Hapus Pengguna?</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Yakin ingin menghapus <span className="font-semibold">{deleting?.name}</span>? Tindakan ini tidak dapat dibatalkan.
                    </p>
                </div>
                <div className="flex gap-3 justify-center mt-4">
                    <button
                        onClick={() => setDeleting(null)}
                        disabled={deleteLoading}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={confirmDelete}
                        disabled={deleteLoading}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50"
                    >
                        {deleteLoading && <Loader2 size={15} className="animate-spin" />}
                        Hapus
                    </button>
                </div>
            </Modal>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
