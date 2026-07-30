import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import {
    createUser,
    updateUser,
    type UserResource,
    type CreateUserPayload,
    type UpdateUserPayload,
} from "../../../api/users";
import type { Role } from "../../../api/roles";
import type { Team } from "../../../api/teams";
import { roleLabel, generatePassword } from "../../../utils/userDisplay";

interface UserFormModalProps {
    open: boolean;
    mode: "create" | "edit";
    user?: UserResource | null;
    roles: Role[];
    teams: Team[];
    onClose: () => void;
    onSaved: () => void;
}

interface FormState {
    name: string;
    nip: string;
    email: string;
    phone: string;
    position: string;
    team_id: string;
    role: string;
    is_active: string;
    password: string;
}

const EMPTY: FormState = {
    name: "",
    nip: "",
    email: "",
    phone: "",
    position: "",
    team_id: "",
    role: "",
    is_active: "1",
    password: "",
};

export default function UserFormModal({
    open,
    mode,
    user,
    roles,
    teams,
    onClose,
    onSaved,
}: UserFormModalProps) {
    const [form, setForm] = useState<FormState>(EMPTY);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Reset / prefill whenever the modal opens.
    useEffect(() => {
        if (!open) return;
        setErrors({});
        setGeneralError(null);
        if (mode === "edit" && user) {
            setForm({
                name: user.name ?? "",
                nip: user.nip ?? "",
                email: user.email ?? "",
                phone: user.phone ?? "",
                position: user.position ?? "",
                team_id: user.team?.id != null ? String(user.team.id) : "",
                role: user.roles?.[0] ?? "",
                is_active: user.is_active ? "1" : "0",
                password: "",
            });
        } else {
            setForm(EMPTY);
        }
    }, [open, mode, user]);

    const set = (key: keyof FormState, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const roleOptions = roles.map((r) => ({ value: r.name, label: roleLabel(r.name) }));
    const teamOptions = teams.map((t) => ({ value: String(t.id), label: t.name }));

    function validate(): boolean {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = "Nama lengkap wajib diisi.";
        if (!form.nip.trim()) e.nip = "NIP wajib diisi.";
        if (!form.email.trim()) e.email = "Email wajib diisi.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            e.email = "Format email tidak valid.";
        if (!form.position.trim()) e.position = "Jabatan wajib diisi.";
        if (!form.team_id) e.team_id = "Bidang / unit kerja wajib dipilih.";
        if (!form.role) e.role = "Peran wajib dipilih.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit() {
        setGeneralError(null);
        if (!validate()) return;
        setSaving(true);
        try {
            if (mode === "create") {
                const payload: CreateUserPayload = {
                    name: form.name.trim(),
                    nip: form.nip.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim() || null,
                    position: form.position.trim(),
                    team_id: Number(form.team_id),
                    roles: [form.role],
                };
                if (form.password) payload.password = form.password;
                await createUser(payload);
            } else if (user) {
                const payload: UpdateUserPayload = {
                    name: form.name.trim(),
                    nip: form.nip.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim() || null,
                    position: form.position.trim(),
                    team_id: Number(form.team_id),
                    roles: [form.role],
                    is_active: form.is_active === "1",
                };
                await updateUser(user.id, payload);
            }
            onSaved();
        } catch (err: unknown) {
            handleApiError(err);
        } finally {
            setSaving(false);
        }
    }

    function handleApiError(err: unknown) {
        const res = (err as {
            response?: { data?: { message?: string; errors?: Record<string, string[]> } };
        })?.response;
        if (res?.data?.errors) {
            const mapped: Record<string, string> = {};
            for (const [key, msgs] of Object.entries(res.data.errors)) {
                mapped[key] = msgs[0];
            }
            setErrors(mapped);
        }
        setGeneralError(res?.data?.message ?? "Gagal menyimpan data. Coba lagi.");
    }

    const footer = (
        <>
            <Button variant="outline" onClick={onClose} disabled={saving}>
                Batal
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
                {saving
                    ? "Menyimpan..."
                    : mode === "create"
                        ? "+ Buat Akun"
                        : "Simpan Perubahan"}
            </Button>
        </>
    );

    return (
        <Modal
            open={open}
            title={mode === "create" ? "Tambah Pengguna Baru" : "Edit Data Pengguna"}
            onClose={onClose}
            footer={footer}
        >
            <div className="flex flex-col gap-4">
                {generalError && (
                    <div className="rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] px-4 py-2 text-sm text-[#B91C1C]">
                        {generalError}
                    </div>
                )}

                <Input
                    label="Nama Lengkap"
                    required
                    placeholder="Masukkan nama lengkap"
                    value={form.name}
                    onChange={(v) => set("name", v)}
                    error={errors.name}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="NIP"
                        required
                        placeholder="18 digit angka"
                        value={form.nip}
                        onChange={(v) => set("nip", v)}
                        error={errors.nip}
                    />
                    <Input
                        label="Email"
                        required
                        type="email"
                        placeholder="nama@kominfojatim.go.id"
                        value={form.email}
                        onChange={(v) => set("email", v)}
                        error={errors.email}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="No. HP"
                        placeholder="08xxxxxxxxxx"
                        value={form.phone}
                        onChange={(v) => set("phone", v)}
                        error={errors.phone}
                    />
                    <Input
                        label="Jabatan"
                        required
                        placeholder="mis. Pranata Komputer Ahli Muda"
                        value={form.position}
                        onChange={(v) => set("position", v)}
                        error={errors.position}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                        label="Bidang / Unit Kerja"
                        required
                        placeholder="-- Pilih Unit --"
                        options={teamOptions}
                        value={form.team_id}
                        onChange={(v) => set("team_id", v)}
                        error={errors.team_id}
                    />
                    <Select
                        label="Peran / Role"
                        required
                        placeholder="-- Pilih Peran --"
                        options={roleOptions}
                        value={form.role}
                        onChange={(v) => set("role", v)}
                        error={errors.roles ?? errors.role}
                    />
                </div>

                {mode === "edit" && (
                    <Select
                        label="Status Akun"
                        required
                        options={[
                            { value: "1", label: "Aktif" },
                            { value: "0", label: "Tidak Aktif" },
                        ]}
                        value={form.is_active}
                        onChange={(v) => set("is_active", v)}
                        error={errors.is_active}
                    />
                )}

                {mode === "create" && (
                    <div className="flex flex-col gap-[6px]">
                        <label className="text-sm font-medium text-[#424655]">Password</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={form.password}
                                onChange={(e) => set("password", e.target.value)}
                                placeholder="Kosongkan untuk pakai password default"
                                className={`flex-1 px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border outline-none transition-colors placeholder:text-[#767676] ${errors.password
                                        ? "border-[#FF0000]"
                                        : "border-[#C2C6D8] hover:border-[#A0A0A0] focus:border-[#256EEF]"
                                    }`}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => set("password", generatePassword())}
                            >
                                Generate
                            </Button>
                        </div>
                        {errors.password && (
                            <p className="text-xs text-[#FF0000] mt-0.5">{errors.password}</p>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
