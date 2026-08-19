import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import DataTable, { type Column } from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import Toast, { type ToastType } from "../../components/ui/Toast";
import DropdownMenu from "../../components/ui/DropdownMenu";
import { useAuth } from "../../hooks/useAuth";
import { listUsers, type UserResource } from "../../api/users";
import { listRoles, type Role } from "../../api/roles";
import { listTeams, type Team } from "../../api/teams";
import {
    roleLabel,
    roleBadgeClass,
    initials,
    avatarColor,
    formatDate,
} from "../../utils/userDisplay";
import UserFormModal from "./components/UserFormModal";
import DeleteUserModal from "./components/DeleteUserModal";
import ImportUsersModal from "./components/ImportUsersModal";
import {
    AddIcon,
    ChevronDownIcon,
    EditIcon,
    FilterIcon,
    MoreVerticalIcon,
    TrashIcon,
    UploadIcon,
} from "../../components/ui/AdminActionIcons";

const PAGE_SIZE = 10;

const columns: Column[] = [
    { key: "pengguna", label: "Pengguna" },
    { key: "nip", label: "NIP" },
    { key: "jabatan", label: "Jabatan / Bidang" },
    { key: "peran", label: "Peran" },
    { key: "status", label: "Status" },
    { key: "dibuat", label: "Dibuat" },
    { key: "aksi", label: "Aksi" },
];

export default function UserManagementPage() {
    const { hasPermission } = useAuth();
    const canManage = hasPermission("user.manage");
    const canImport = hasPermission("user.import");

    const [users, setUsers] = useState<UserResource[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);

    const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
    const [editing, setEditing] = useState<UserResource | null>(null);
    const [deleting, setDeleting] = useState<UserResource | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = "success") =>
        setToast({ message, type });

    async function loadUsers() {
        setLoading(true);
        setLoadError(null);
        try {
            // Backend has no server-side search/filter, so we load a large page
            // and filter/paginate on the client.
            const res = await listUsers(1, 200);
            setUsers(res.data);
        } catch {
            setLoadError("Gagal memuat data pengguna.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
        listRoles().then(setRoles).catch(() => setRoles([]));
        listTeams().then(setTeams).catch(() => setTeams([]));
    }, []);

    // Reset to first page when filters change.
    useEffect(() => {
        setPage(1);
    }, [search, roleFilter, statusFilter]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users.filter((u) => {
            if (roleFilter && !u.roles?.includes(roleFilter)) return false;
            if (statusFilter === "active" && !u.is_active) return false;
            if (statusFilter === "inactive" && u.is_active) return false;
            if (q) {
                const bidang = u.team?.field?.name ?? "";
                const haystack = `${u.name} ${u.nip} ${u.email} ${bidang}`.toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [users, search, roleFilter, statusFilter]);

    const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    function renderCell(col: Column, row: Record<string, unknown>) {
        const u = row as unknown as UserResource;
        switch (col.key) {
            case "pengguna":
                return (
                    <div className="flex items-center gap-3">
                        <span
                            className={`flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-white text-xs font-semibold ${avatarColor(
                                u.name
                            )}`}
                        >
                            {initials(u.name)}
                        </span>
                        <div className="min-w-0">
                            <div className="font-semibold text-[#141D23] truncate">{u.name}</div>
                            <div className="text-xs text-[#767676] truncate">{u.email}</div>
                        </div>
                    </div>
                );
            case "nip":
                return <span className="text-[#424655]">{u.nip}</span>;
            case "jabatan":
                return (
                    <div>
                        <div className="text-[#424655]">{u.position ?? "-"}</div>
                        <div className="text-xs text-[#767676]">{u.team?.field?.name ?? "-"}</div>
                    </div>
                );
            case "peran": {
                const role = u.roles?.[0];
                if (!role) return <span className="text-[#767676]">-</span>;
                return (
                    <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${roleBadgeClass(
                            role
                        )}`}
                    >
                        {roleLabel(role)}
                    </span>
                );
            }
            case "status":
                return (
                    <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.is_active ? "text-[#15803D]" : "text-[#DC2626]"
                            }`}
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-[#15803D]" : "bg-[#DC2626]"
                                }`}
                        />
                        {u.is_active ? "Aktif" : "Tidak Aktif"}
                    </span>
                );
            case "dibuat":
                return <span className="text-[#424655]">{formatDate(u.created_at)}</span>;
            case "aksi":
                return (
                    <DropdownMenu
                        align="end"
                        trigger={
                            <button
                                type="button"
                                aria-label={`Aksi untuk ${u.name}`}
                                disabled={!canManage}
                                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#424655] hover:bg-[#F6FAFF] disabled:opacity-40"
                            >
                                <MoreVerticalIcon size={18} />
                            </button>
                        }
                        items={[
                            {
                                label: "Edit pengguna",
                                icon: <EditIcon size={16} />,
                                disabled: !canManage,
                                onClick: () => {
                                    setEditing(u);
                                    setFormMode("edit");
                                },
                            },
                            {
                                label: "Hapus pengguna",
                                icon: <TrashIcon size={16} />,
                                variant: "destructive",
                                separator: true,
                                disabled: !canManage,
                                onClick: () => setDeleting(u),
                            },
                        ]}
                    />
                );
            default:
                return null;
        }
    }

    return (
        <AppLayout
            breadcrumbs={[
                { label: "Beranda", href: "/" },
                { label: "Manajemen Pengguna" },
            ]}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <PageTitle
                    title="Manajemen Pengguna"
                    subtitle="Kelola akun pegawai — tambah manual atau impor dari Excel"
                />
                <div className="flex gap-2">
                    {canImport && (
                        <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
                            <UploadIcon size={17} />
                            Import Excel
                        </Button>
                    )}
                    {canManage && (
                        <Button
                            onClick={() => {
                                setEditing(null);
                                setFormMode("create");
                            }}
                            className="gap-2"
                        >
                            <AddIcon size={17} />
                            Tambah Pengguna
                        </Button>
                    )}
                </div>
            </div>

            {/* Toolbar: search + filters + count */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#767676]">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </span>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama, NIP, email, atau bidang..."
                        className="w-full pl-9 pr-4 py-[10px] text-sm rounded-[10px] border border-[#C2C6D8] outline-none focus:border-[#256EEF] placeholder:text-[#767676]"
                    />
                </div>
                <details className="relative shrink-0 group">
                    <summary className="list-none inline-flex items-center gap-2 px-4 py-[10px] text-sm rounded-[10px] border border-[#C2C6D8] bg-white text-[#424655] cursor-pointer hover:border-[#A0A0A0] transition-colors [&::-webkit-details-marker]:hidden">
                        <FilterIcon size={16} />
                        Filter
                        {(roleFilter || statusFilter) && (
                            <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-[#DBEAFE] text-[#256EEF] text-[11px] font-semibold">
                                {Number(!!roleFilter) + Number(!!statusFilter)}
                            </span>
                        )}
                        <ChevronDownIcon size={15} className="transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="absolute right-0 z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-[#E0E9F2] bg-white p-3 shadow-xl">
                        <div className="flex flex-col gap-3">
                            <label className="flex flex-col gap-1.5 text-xs font-medium text-[#424655]">
                                Peran
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] outline-none focus:border-[#256EEF] text-[#424655]"
                                >
                                    <option value="">Semua Peran</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.name}>
                                            {roleLabel(r.name)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5 text-xs font-medium text-[#424655]">
                                Status
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] outline-none focus:border-[#256EEF] text-[#424655]"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Tidak Aktif</option>
                                </select>
                            </label>
                        </div>
                    </div>
                </details>
                <span className="text-sm text-[#767676] whitespace-nowrap">
                    {filtered.length} dari {users.length} pengguna
                </span>
            </div>

            {loadError && (
                <div className="rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] px-4 py-2 text-sm text-[#B91C1C]">
                    {loadError}
                </div>
            )}

            {/* Table */}
            <DataTable
                columns={columns}
                rows={pageRows as unknown as Record<string, unknown>[]}
                loading={loading}
                emptyText="Belum ada pengguna. Tambah pengguna atau impor dari Excel untuk memulai."
                renderCell={renderCell}
            />

            {filtered.length > PAGE_SIZE && (
                <Pagination
                    currentPage={page}
                    lastPage={lastPage}
                    total={filtered.length}
                    onPageChange={setPage}
                />
            )}

            {/* Modals */}
            <UserFormModal
                open={formMode !== null}
                mode={formMode ?? "create"}
                user={editing}
                roles={roles}
                teams={teams}
                onClose={() => setFormMode(null)}
                onSaved={() => {
                    const msg =
                        formMode === "create"
                            ? "Pengguna berhasil ditambahkan."
                            : "Perubahan berhasil disimpan.";
                    setFormMode(null);
                    showToast(msg, "success");
                    loadUsers();
                }}
            />

            <DeleteUserModal
                user={deleting}
                onClose={() => setDeleting(null)}
                onDeleted={() => {
                    setDeleting(null);
                    showToast("Pengguna berhasil dihapus.", "success");
                    loadUsers();
                }}
            />

            <ImportUsersModal
                open={importOpen}
                onClose={() => setImportOpen(false)}
                onImported={() => {
                    showToast("Import pengguna selesai.", "success");
                    loadUsers();
                }}
            />

            <Toast
                open={!!toast}
                message={toast?.message ?? ""}
                type={toast?.type ?? "success"}
                onClose={() => setToast(null)}
            />
        </AppLayout>
    );
}
