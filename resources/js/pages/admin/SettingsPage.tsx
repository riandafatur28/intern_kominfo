import { useEffect, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import Button from "../../components/ui/Button";
import Toggle from "../../components/ui/Toggle";
import TimePicker from "../../components/ui/TimePicker";
import Toast, { type ToastType } from "../../components/ui/Toast";
import { EyeIcon, SaveIcon } from "../../components/ui/AdminActionIcons";
import { getSettings, updateSetting } from "../../api/settings";

const DAYS = [
    { num: 1, label: "Senin" },
    { num: 2, label: "Selasa" },
    { num: 3, label: "Rabu" },
    { num: 4, label: "Kamis" },
    { num: 5, label: "Jumat" },
];

const SESSIONS = [
    { key: "pagi", label: "Sesi Pagi", badge: "P" },
    { key: "siang", label: "Sesi Siang", badge: "S" },
    { key: "sore", label: "Sesi Sore", badge: "Sr" },
];

interface SettingsState {
    allowedDays: number[];
    sessions: string[];
    notifyTime: string;
    pwUser: string;
    pwAdmin: string;
}

const EMPTY: SettingsState = {
    allowedDays: [],
    sessions: [],
    notifyTime: "",
    pwUser: "",
    pwAdmin: "",
};

function SectionCard({
    step,
    title,
    subtitle,
    children,
}: {
    step: number;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white border border-[#C2C6D8]/50 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
                <span className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-[#DBEAFE] text-[#256EEF] text-xs font-bold">
                    {step}
                </span>
                <div>
                    <h2 className="text-base font-bold text-[#141D23]">{title}</h2>
                    {subtitle && <p className="text-xs text-[#767676]">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

export default function SettingsPage() {
    const [form, setForm] = useState<SettingsState>(EMPTY);
    const [initial, setInitial] = useState<SettingsState>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [showPwUser, setShowPwUser] = useState(false);
    const [showPwAdmin, setShowPwAdmin] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    async function load() {
        setLoading(true);
        setLoadError(null);
        try {
            const raw = await getSettings();
            const next: SettingsState = {
                allowedDays: Array.isArray(raw.wfh_allowed_days)
                    ? (raw.wfh_allowed_days as unknown[]).map((d) => Number(d))
                    : [],
                sessions: Array.isArray(raw.wfh_sessions) ? (raw.wfh_sessions as string[]) : [],
                notifyTime: typeof raw.wfh_notify_start_time === "string" ? raw.wfh_notify_start_time : "",
                pwUser: typeof raw.password_default_user === "string" ? raw.password_default_user : "",
                pwAdmin: typeof raw.password_default_admin === "string" ? raw.password_default_admin : "",
            };
            setForm(next);
            setInitial(next);
        } catch {
            setLoadError("Gagal memuat pengaturan.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function toggleDay(num: number) {
        setForm((f) => ({
            ...f,
            allowedDays: f.allowedDays.includes(num)
                ? f.allowedDays.filter((d) => d !== num)
                : [...f.allowedDays, num].sort((a, b) => a - b),
        }));
    }

    function toggleSession(key: string, on: boolean) {
        setForm((f) => ({
            ...f,
            sessions: on ? [...f.sessions, key] : f.sessions.filter((s) => s !== key),
        }));
    }

    async function handleSave() {
        setFormError(null);

        // Backend `value` is required, so an empty array would be rejected (422).
        if (form.allowedDays.length === 0) {
            setFormError("Pilih minimal satu hari WFH.");
            return;
        }
        if (form.sessions.length === 0) {
            setFormError("Aktifkan minimal satu sesi absensi.");
            return;
        }

        setSaving(true);
        try {
            // Only PUT keys that actually changed (all keys already exist in backend).
            const tasks: Promise<unknown>[] = [];
            const changed = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);

            if (changed(form.allowedDays, initial.allowedDays))
                tasks.push(updateSetting("wfh_allowed_days", form.allowedDays));
            if (changed(form.sessions, initial.sessions))
                tasks.push(updateSetting("wfh_sessions", form.sessions));
            if (form.notifyTime !== initial.notifyTime)
                tasks.push(updateSetting("wfh_notify_start_time", form.notifyTime));
            if (form.pwUser !== initial.pwUser)
                tasks.push(updateSetting("password_default_user", form.pwUser));
            if (form.pwAdmin !== initial.pwAdmin)
                tasks.push(updateSetting("password_default_admin", form.pwAdmin));

            if (tasks.length === 0) {
                setToast({ message: "Tidak ada perubahan.", type: "success" });
                setSaving(false);
                return;
            }

            await Promise.all(tasks);
            setInitial(form);
            setToast({ message: "Pengaturan berhasil disimpan.", type: "success" });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setToast({ message: msg ?? "Gagal menyimpan pengaturan.", type: "error" });
        } finally {
            setSaving(false);
        }
    }

    const pwInputClass =
        "flex-1 px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none focus:border-[#256EEF]";

    return (
        <AppLayout
            breadcrumbs={[
                { label: "Beranda", href: "/" },
                { label: "Admin WFH" },
                { label: "Pengaturan" },
            ]}
        >
            <PageTitle title="Pengaturan" subtitle="Konfigurasi aplikasi WFH & akun" />

            {loadError && (
                <div className="rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] px-4 py-2 text-sm text-[#B91C1C]">
                    {loadError}
                </div>
            )}

            {loading ? (
                <div className="bg-white border border-[#C2C6D8]/50 rounded-xl p-8 text-center text-sm text-[#767676]">
                    Memuat pengaturan...
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {/* 1. Allowed days */}
                    <SectionCard
                        step={1}
                        title="Hari yang Diizinkan WFH"
                        subtitle="Pilih hari kerja (Senin–Jumat) yang diperbolehkan WFH"
                    >
                        <div className="flex flex-wrap gap-3">
                            {DAYS.map((d) => {
                                const active = form.allowedDays.includes(d.num);
                                return (
                                    <button
                                        key={d.num}
                                        type="button"
                                        onClick={() => toggleDay(d.num)}
                                        className={`flex items-center justify-center gap-2 min-w-[110px] px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${active
                                            ? "bg-[#256EEF] text-white border-[#256EEF]"
                                            : "bg-white text-[#424655] border-[#C2C6D8] hover:border-[#A0A0A0]"
                                            }`}
                                    >
                                        {active && (
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path
                                                    d="M3 7.5L6 10.5L11 4.5"
                                                    stroke="currentColor"
                                                    strokeWidth="1.6"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        )}
                                        {d.label}
                                    </button>
                                );
                            })}
                        </div>
                    </SectionCard>

                    {/* 2. Sessions */}
                    <SectionCard
                        step={2}
                        title="Konfigurasi Sesi Absensi"
                        subtitle="Aktifkan sesi absensi yang berlaku"
                    >
                        <div className="flex flex-col gap-3">
                            {SESSIONS.map((s) => {
                                const on = form.sessions.includes(s.key);
                                return (
                                    <div
                                        key={s.key}
                                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#C2C6D8]/60 bg-[#F8FAFF]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#256EEF] text-white text-xs font-bold">
                                                {s.badge}
                                            </span>
                                            <span className="text-sm font-medium text-[#141D23]">{s.label}</span>
                                        </div>
                                        <Toggle checked={on} onChange={(v) => toggleSession(s.key, v)} />
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>

                    {/* 3. Notification time */}
                    <SectionCard
                        step={3}
                        title="Peringatan Notifikasi Otomatis"
                        subtitle="Jam pengiriman pengingat harian ke pegawai WFH"
                    >
                        <div className="max-w-[220px]">
                            <TimePicker
                                label="Jam Pengiriman Notifikasi"
                                value={form.notifyTime}
                                onChange={(value) => setForm((f) => ({ ...f, notifyTime: value }))}
                                format="24h"
                                step={5}
                            />
                            <p className="mt-1 text-xs text-[#767676]">Waktu Indonesia Barat (WIB)</p>
                        </div>
                    </SectionCard>

                    {/* 4. Default passwords */}
                    <SectionCard
                        step={4}
                        title="Pengaturan Password Default"
                        subtitle="Password saat akun baru dibuat atau di-reset"
                    >
                        <div className="flex flex-col gap-4 max-w-md">
                            <div className="flex flex-col gap-[6px]">
                                <label className="text-sm font-medium text-[#424655]">Password User</label>
                                <p className="text-xs text-[#767676]">
                                    Berlaku untuk semua akun pegawai baru dan saat reset password.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type={showPwUser ? "text" : "password"}
                                        value={form.pwUser}
                                        onChange={(e) => setForm((f) => ({ ...f, pwUser: e.target.value }))}
                                        className={pwInputClass}
                                    />
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setShowPwUser((v) => !v)}
                                        className="gap-1.5"
                                    >
                                        <EyeIcon size={16} />
                                        {showPwUser ? "Sembunyikan" : "Tampilkan"}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-[6px]">
                                <label className="text-sm font-medium text-[#424655]">Password Admin</label>
                                <div className="flex gap-2">
                                    <input
                                        type={showPwAdmin ? "text" : "password"}
                                        value={form.pwAdmin}
                                        onChange={(e) => setForm((f) => ({ ...f, pwAdmin: e.target.value }))}
                                        className={pwInputClass}
                                    />
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setShowPwAdmin((v) => !v)}
                                        className="gap-1.5"
                                    >
                                        <EyeIcon size={16} />
                                        {showPwAdmin ? "Sembunyikan" : "Tampilkan"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {formError && (
                        <div className="rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] px-4 py-2 text-sm text-[#B91C1C]">
                            {formError}
                        </div>
                    )}

                    <div>
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            <SaveIcon size={17} />
                            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                        </Button>
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
