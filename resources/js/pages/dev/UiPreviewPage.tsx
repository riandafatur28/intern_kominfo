import { useState, type ReactNode } from "react";
import Button from "../../components/ui/Button";
import DatePicker from "../../components/ui/DatePicker";
import TimePicker from "../../components/ui/TimePicker";
import DropdownMenu from "../../components/ui/DropdownMenu";
import SidebarProfileMenu from "../../components/ui/SidebarProfileMenu";
import ConfirmModal from "../../components/ui/ConfirmModal";

/**
 * ⚠️ DEV-ONLY: UI Kit Preview Page — QA pribadi sebelum handoff ke tim.
 *
 * BUKAN bagian dari fitur aplikasi. Halaman ini HANYA untuk development/testing.
 * SEBELUM DEPLOY PRODUCTION: hapus route "/dev/components" di Root.jsx
 * beserta file ini (atau pindahkan ke konvensi folder dev-only proyek).
 * Akses langsung via URL — tidak di-link dari menu aplikasi.
 */

const ChevronDownIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
        <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PencilIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path d="M4 13.5V16h2.5l7.4-7.4-2.5-2.5L4 13.5zM15.7 6.3a1 1 0 000-1.4l-1.6-1.6a1 1 0 00-1.4 0l-1.2 1.2 3 3 1.2-1.2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
);

const TrashIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path d="M3 5h14M8 5V3.5A1.5 1.5 0 019.5 2h1A1.5 1.5 0 0112 3.5V5m2 0v11a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 016 16V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#141D23]">{title}</h2>
            {children}
        </section>
    );
}

function DemoCard({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-3">
            <div className="bg-white border border-[#C2C6D8] rounded-xl p-5">
                {children}
            </div>
            <p className="text-xs text-[#767676] leading-4">{label}</p>
        </div>
    );
}

export default function UiPreviewPage() {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [customOpen, setCustomOpen] = useState(false);

    const [date, setDate] = useState("");
    const [timeEmpty, setTimeEmpty] = useState("");
    const [timePrefilled, setTimePrefilled] = useState("09:30");
    const [time12, setTime12] = useState("14:30");
    const [timeStep, setTimeStep] = useState("");
    const [timeError, setTimeError] = useState("");
    const [timeCombined, setTimeCombined] = useState("");

    return (
        <div className="h-screen overflow-y-auto bg-[#F6FAFF] p-8">
            <div className="mx-auto max-w-[56rem] flex flex-col gap-10">
                <header className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-[#141D23]">UI Kit Preview</h1>
                    <p className="text-sm text-[#424655]">
                        Halaman dev-only untuk QA komponen sebelum handoff. Akses: <code className="bg-[#E0E9F2] rounded px-1.5 py-0.5 text-xs">/dev/components</code>
                    </p>
                    <div className="bg-[#FEF3C7] border border-[#F59E0B]/40 rounded-lg px-4 py-2 text-xs text-[#92400E]">
                        ⚠️ DEV-ONLY — hapus route ini sebelum deploy production (lihat komentar di file).
                    </div>
                </header>

                {/* ── DropdownMenu ── */}
                <Section title="1. DropdownMenu">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <DemoCard label="props: trigger (Button 'Aksi' + chevron-down), items: Edit (icon pensil), Hapus (icon trash, variant 'destructive'). Default align='end' side='bottom'.">
                            <DropdownMenu
                                trigger={
                                    <Button variant="outline" size="sm" type="button">
                                        Aksi
                                        <ChevronDownIcon className="ml-1.5" />
                                    </Button>
                                }
                                items={[
                                    { label: "Edit", icon: <PencilIcon />, onClick: () => console.log("Edit") },
                                    { label: "Hapus", icon: <TrashIcon />, variant: "destructive", onClick: () => console.log("Hapus") },
                                ]}
                            />
                        </DemoCard>
                        <DemoCard label="props: items dengan disabled: true dan separator: true, align='start'. Trigger konsisten pakai Button 'Aksi'.">
                            <DropdownMenu
                                align="start"
                                trigger={
                                    <Button variant="outline" size="sm" type="button">
                                        Aksi
                                        <ChevronDownIcon className="ml-1.5" />
                                    </Button>
                                }
                                items={[
                                    { label: "Edit", icon: <PencilIcon />, onClick: () => console.log("Edit") },
                                    { label: "Nonaktif", separator: true, disabled: true, onClick: () => console.log("tidak jalan") },
                                    { label: "Hapus", icon: <TrashIcon />, variant: "destructive", separator: true, onClick: () => console.log("Hapus") },
                                ]}
                            />
                        </DemoCard>
                    </div>
                </Section>

                {/* ── TimePicker ── */}
                <Section title="2. TimePicker">
                    <p className="text-xs text-[#767676] -mt-2">
                        Selection-based (jam + menit): klik trigger → panel kolom scroll pilihan (Jam/Menit, +AM/PM saat format='12h'), footer tombol 'Saat ini' (isi waktu device saat ini + tutup). Value internal selalu 24h (HH:mm).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <DemoCard label="props: label, value: '' (kosong) — trigger tampil placeholder 'HH:mm'.">
                            <TimePicker label="Jam" value={timeEmpty} onChange={setTimeEmpty} />
                        </DemoCard>
                        <DemoCard label="props: value: '09:30' (prefilled, format 24h default).">
                            <TimePicker label="Jam" value={timePrefilled} onChange={setTimePrefilled} />
                        </DemoCard>
                        <DemoCard label="props: format='12h', value: '14:30' → tampil '02:30 PM', panel + kolom AM/PM.">
                            <TimePicker label="Jam (12h)" value={time12} onChange={setTime12} format="12h" />
                        </DemoCard>
                        <DemoCard label="props: step={5} — daftar Menit tiap 5 (00,05,10,...).">
                            <TimePicker label="Jam" value={timeStep} onChange={setTimeStep} step={5} />
                        </DemoCard>
                        <DemoCard label="props: error (dari validasi luar, mis. jam kerja 08:00-17:00) — border merah tetap tampil; pilihan list tidak bisa menghasilkan nilai invalid.">
                            <TimePicker label="Jam" value={timeError} onChange={setTimeError} error="Di luar jam kerja (08:00-17:00)" />
                        </DemoCard>
                        <DemoCard label="props: disabled — trigger tidak bisa dibuka.">
                            <TimePicker label="Jam" value="09:00" disabled />
                        </DemoCard>
                        <DemoCard label="Gabungan DatePicker + TimePicker berdampingan (grid 2 kolom) — tinggi & radius sejajar.">
                            <div className="grid grid-cols-2 gap-4 items-end">
                                <DatePicker label="Tanggal" value={date} onChange={setDate} />
                                <TimePicker label="Jam" value={timeCombined} onChange={setTimeCombined} />
                            </div>
                        </DemoCard>
                    </div>
                </Section>

                {/* ── SidebarProfileMenu ── */}
                <Section title="3. SidebarProfileMenu">
                    <DemoCard label="Standalone di luar sidebar (bukan konteks asli). Trigger = area user (avatar + nama + role). Popover buka ke atas, match-width; item 'Log out' membuka ConfirmModal; logout jalan setelah 'Ya, Keluar'. Data dari useAuth (user login saat ini).">
                        <SidebarProfileMenu />
                    </DemoCard>
                </Section>

                {/* ── ConfirmModal ── */}
                <Section title="4. ConfirmModal">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <DemoCard label="Trigger button di luar modal. props: title 'Konfirmasi Keluar', message default, confirmLabel 'Ya, Keluar' (red), cancelLabel 'Batal'. (onConfirm demo: hanya menutup modal — logout real ada di SidebarProfileMenu).">
                            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
                                Buka Konfirmasi Keluar
                            </Button>
                        </DemoCard>
                        <DemoCard label="Variasi custom: title 'Hapus Data', message custom, confirmLabel 'Ya, Hapus'.">
                            <Button variant="outline" size="sm" onClick={() => setCustomOpen(true)}>
                                Buka Modal Custom
                            </Button>
                        </DemoCard>
                    </div>
                </Section>
            </div>

            <ConfirmModal
                open={confirmOpen}
                title="Konfirmasi Keluar"
                message="Apakah Anda yakin ingin keluar?"
                confirmLabel="Ya, Keluar"
                cancelLabel="Batal"
                onConfirm={() => setConfirmOpen(false)}
                onCancel={() => setConfirmOpen(false)}
            />
            <ConfirmModal
                open={customOpen}
                title="Hapus Data"
                message="Data akan dihapus permanen dan tidak dapat dikembalikan."
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
                onConfirm={() => setCustomOpen(false)}
                onCancel={() => setCustomOpen(false)}
            />
        </div>
    );
}
