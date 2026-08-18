import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import Button from "../../components/ui/Button";
import Checkbox from "../../components/ui/Checkbox";
import Toast, { type ToastType } from "../../components/ui/Toast";
import { SaveIcon } from "../../components/ui/AdminActionIcons";
import { useAuth } from "../../hooks/useAuth";
import { listRoles, updateRolePermissions, type Role } from "../../api/roles";
import { listPermissions, type Permission } from "../../api/permissions";
import { roleLabel } from "../../utils/userDisplay";

/** Permissions that a protected role (admin) must never lose. Backend enforces this too (422). */
const CRITICAL_PERMISSIONS = ["role.manage", "permission.manage", "user.manage"];
const PROTECTED_ROLE = "admin";

/** Friendly group title based on the permission name prefix (before first dot). */
const GROUP_LABELS: Record<string, string> = {
    user: "Manajemen User",
    role: "Manajemen Role",
    permission: "Manajemen Permission",
    field: "Organisasi — Bidang",
    team: "Organisasi — Tim",
    wfh: "WFH (Absensi & Laporan)",
    change: "Change Management",
    setting: "Pengaturan",
};

function groupOf(permissionName: string): string {
    return permissionName.split(".")[0];
}

export default function RolePermissionPage() {
    const { refreshUser } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [checked, setChecked] = useState<Set<string>>(new Set());
    const [initial, setInitial] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;
    const isProtected = selectedRole?.name === PROTECTED_ROLE;

    async function load() {
        setLoading(true);
        setLoadError(null);
        try {
            const [r, p] = await Promise.all([listRoles(), listPermissions()]);
            setRoles(r);
            setPermissions(p);
            if (r.length > 0) {
                const first = r[0];
                setSelectedRoleId(first.id);
                setChecked(new Set(first.permissions));
                setInitial(new Set(first.permissions));
            }
        } catch {
            setLoadError("Gagal memuat data role/permission.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function selectRole(role: Role) {
        setSelectedRoleId(role.id);
        setChecked(new Set(role.permissions));
        setInitial(new Set(role.permissions));
    }

    function togglePermission(name: string, on: boolean) {
        // Critical permissions are locked for the protected (admin) role.
        if (isProtected && CRITICAL_PERMISSIONS.includes(name)) return;
        setChecked((prev) => {
            const next = new Set(prev);
            if (on) next.add(name);
            else next.delete(name);
            return next;
        });
    }

    // Group permissions by domain prefix, keeping a stable order.
    const groups = useMemo(() => {
        const map = new Map<string, Permission[]>();
        for (const p of permissions) {
            const g = groupOf(p.name);
            if (!map.has(g)) map.set(g, []);
            map.get(g)!.push(p);
        }
        return Array.from(map.entries());
    }, [permissions]);

    const dirty = useMemo(() => {
        if (checked.size !== initial.size) return true;
        for (const c of checked) if (!initial.has(c)) return true;
        return false;
    }, [checked, initial]);

    async function handleSave() {
        if (!selectedRole) return;
        setSaving(true);
        try {
            const payload = new Set(checked);
            // Safety: ensure protected role keeps its critical permissions.
            if (isProtected) CRITICAL_PERMISSIONS.forEach((p) => payload.add(p));

            const updated = await updateRolePermissions(selectedRole.id, Array.from(payload));

            // Sync local state with server response.
            setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setChecked(new Set(updated.permissions));
            setInitial(new Set(updated.permissions));
            // Refresh the current session too, so the sidebar/actions immediately
            // reflect a permission change when the edited role is the admin's role.
            void refreshUser();
            setToast({ message: "Hak akses role berhasil diperbarui.", type: "success" });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setToast({ message: msg ?? "Gagal menyimpan hak akses.", type: "error" });
        } finally {
            setSaving(false);
        }
    }

    return (
        <AppLayout
            breadcrumbs={[
                { label: "Beranda", href: "/" },
                { label: "Kelola Hak Akses" },
            ]}
        >
            <PageTitle
                title="Kelola Hak Akses"
                subtitle="Atur permission untuk tiap role. Perubahan berlaku ke semua pengguna dengan role tersebut."
            />

            {loadError && (
                <div className="rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] px-4 py-2 text-sm text-[#B91C1C]">
                    {loadError}
                </div>
            )}

            {loading ? (
                <div className="bg-white border border-[#C2C6D8]/50 rounded-xl p-8 text-center text-sm text-[#767676]">
                    Memuat data...
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-5">
                    {/* Role selector */}
                    <div className="lg:w-64 shrink-0">
                        <div className="bg-white border border-[#C2C6D8]/50 rounded-xl p-3 flex lg:flex-col gap-2 flex-wrap">
                            {roles.map((role) => {
                                const active = role.id === selectedRoleId;
                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => selectRole(role)}
                                        className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active
                                            ? "bg-[#DBEAFE] text-[#256EEF]"
                                            : "text-[#424655] hover:bg-[#F6FAFF]"
                                            }`}
                                    >
                                        <div>{roleLabel(role.name)}</div>
                                        <div className="text-xs text-[#767676] font-normal">
                                            {role.permissions.length} permission
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Permission matrix */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white border border-[#C2C6D8]/50 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-[#141D23]">
                                        Permission untuk {selectedRole ? roleLabel(selectedRole.name) : "-"}
                                    </h2>
                                    <p className="text-xs text-[#767676]">
                                        {checked.size} dari {permissions.length} permission aktif
                                    </p>
                                </div>
                                <Button onClick={handleSave} disabled={saving || !dirty} className="gap-2">
                                    <SaveIcon size={17} />
                                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                                </Button>
                            </div>

                            {isProtected && (
                                <div className="mb-4 rounded-lg bg-[#FEF9C3] border border-[#FDE68A] px-4 py-2 text-xs text-[#854D0E]">
                                    Role admin tidak dapat kehilangan permission kritis
                                    ({CRITICAL_PERMISSIONS.join(", ")}) — dikunci untuk mencegah lockout.
                                </div>
                            )}

                            <div className="flex flex-col gap-6">
                                {groups.map(([group, perms]) => (
                                    <div key={group}>
                                        <h3 className="text-xs font-bold uppercase tracking-wide text-[#767676] mb-2">
                                            {GROUP_LABELS[group] ?? group}
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                                            {perms.map((p) => {
                                                const locked = isProtected && CRITICAL_PERMISSIONS.includes(p.name);
                                                return (
                                                    <Checkbox
                                                        key={p.id}
                                                        label={p.name}
                                                        checked={checked.has(p.name)}
                                                        disabled={locked}
                                                        onChange={(on) => togglePermission(p.name, on)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Toast
                open={!!toast}
                message={toast?.message ?? ""}
                type={toast?.type ?? "success"}
                onClose={() => setToast(null)}
            />
        </AppLayout>
    );
}
