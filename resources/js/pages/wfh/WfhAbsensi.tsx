import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import DropdownMenu from "../../components/ui/DropdownMenu";
import TimePicker from "../../components/ui/TimePicker";
import {
  AddIcon,
  EditIcon,
  EyeIcon,
  MoreVerticalIcon,
  TrashIcon,
} from "../../components/ui/AdminActionIcons";
import FilterDropdown from "../../components/ui/FilterDropdown";
import Skeleton from "../../components/ui/Skeleton";
import { addReportAttendance, createReportActivity, createWfhReport,
  deleteReportActivity,
  deleteReportAttendance,
  extractWfhError,
  getWfhSessionConfig,
  listWfhReports,
  submitWfhReport,
  updateWfhReport,
  type WfhReport,
  type WfhReportActivity,
} from "../../api/wfh";
import { openPdfDirect } from "../../utils/swAuth";
import { catatanLaporan } from "../../utils/wfhReportNote";
import { formatTanggalLengkap } from "../../utils/userDisplay";

const SESI = ["pagi", "siang", "sore"] as const;

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "Belum Dikirim", color: "bg-gray-100 text-gray-600" },
  pending: { label: "Terkirim", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Disetujui", color: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-700" },
};

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

/** tanggal "YYYY-MM-DD" → 1..7 (Senin..Minggu), cocokkan allowed_days */
function wfhDayNumber(date: string): number {
  const iso = new Date(date + "T00:00:00").getDay(); // 0=Min..6=Sab
  return iso === 0 ? 7 : iso;
}

function capFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface SessionState {
  name: string;
  label: string;
  checkedIn: boolean;
  photoUrl: string | null;
  attendanceId: number | null;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtWaktu(iso?: string): string {
  if (!iso) return "-";
  const norm = iso.length > 23 ? iso.slice(0, 23) + "Z" : iso;
  const d = new Date(norm);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 5).replace(":", ".");
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}.${pad(d.getMinutes())}`;
}

/** report_date ISO UTC ("2026-07-30T17:00:00.000000Z") → "YYYY-MM-DD" WIB */
function normDate(iso: string): string {
  return iso.includes("T") || iso.includes("Z")
    ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
    : iso.slice(0, 10);
}

function todayDisplay(d?: string): string {
  const date = d ? new Date(d + "T00:00:00") : new Date();
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function WfhAbsensi() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ── Riwayat (tabel) ────────────────────────────────────────── */
  const [reports, setReports] = useState<WfhReport[]>([]);
  const [allowedDays, setAllowedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [dateFilter, setDateFilter] = useState(todayStr());

  /* ── Form absensi + bukti kerja ─────────────────────────────── */
  const [formOpen, setFormOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [formDate, setFormDate] = useState(todayStr());
  const [report, setReport] = useState<WfhReport | null>(null);
  const [sessions, setSessions] = useState<SessionState[]>([]);
  const [activities, setActivities] = useState<WfhReportActivity[]>([]);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  /* ── Upload ──────────────────────────────────────────────────── */
  const [uploadingSession, setUploadingSession] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  /* ── Kegiatan modal ──────────────────────────────────────────── */
  interface KegFormRow {
    id: number;
    nama: string;
    start_time: string;
    end_time: string;
    link: string;
  }
  const [kegModal, setKegModal] = useState(false);
  const [kegRows, setKegRows] = useState<KegFormRow[]>([
    { id: 1, nama: "", start_time: "", end_time: "", link: "" },
  ]);

  function addKegRow() {
    setKegRows((prev) => [...prev, { id: Date.now(), nama: "", start_time: "", end_time: "", link: "" }]);
  }

  /* Simpan/Batal hanya muncul saat inputan terakhir terisi */
  const lastKegRow = kegRows[kegRows.length - 1];
  const lastKegFilled =
    !!lastKegRow &&
    (lastKegRow.nama.trim() !== "" ||
      lastKegRow.start_time !== "" ||
      lastKegRow.end_time !== "" ||
      lastKegRow.link.trim() !== "");

  function updateKegRow(id: number, field: "nama" | "start_time" | "end_time" | "link", value: string) {
    setKegRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function removeKegRow(id: number) {
    setKegRows((prev) => prev.filter((r) => r.id !== id));
  }

  /* ── Toast ───────────────────────────────────────────────────── */
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  function showToast(msg: string, type: "success" | "error") {
    setToastMsg(msg);
    setToastType(type);
    setToastOpen(true);
  }

  /* ── Data ────────────────────────────────────────────────────── */
  async function loadTable() {
    try {
      const [cfgRes, listRes] = await Promise.all([
        getWfhSessionConfig(),
        listWfhReports({
          per_page: 100,
          date: dateFilter || undefined,
        }),
      ]);
      setAllowedDays(cfgRes.data.allowed_days);
      setReports(listRes.data);
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal memuat data."), "error");
    }
  }

  async function loadFormForDate(date: string) {
    let currentReport: WfhReport | null = null;
    try {
      // Item list sudah lengkap (attendances, activities) — resource sama
      // dengan show, jadi tak perlu request detail per id.
      // date param: ambil laporan persis tanggal form (tanpa param = semua).
      const listRes = await listWfhReports({ per_page: 100, date });
      currentReport = listRes.data[0] ?? null;
    } catch {
      // belum ada laporan untuk tanggal itu
    }

    const cfgRes = await getWfhSessionConfig();
    setAllowedDays(cfgRes.data.allowed_days);
    const init: SessionState[] = cfgRes.data.sessions.map((name) => ({
      name,
      label: capFirst(name),
      checkedIn: false,
      photoUrl: null,
      attendanceId: null,
    }));

    if (currentReport?.attendances) {
      for (const att of currentReport.attendances) {
        const found = init.find((s) => s.name === att.session);
        if (found) {
          found.checkedIn = true;
          found.photoUrl = att.photo_url;
          found.attendanceId = att.id;
        }
      }
    }

    setReport(currentReport);
    setSessions(init);
    setActivities(currentReport?.activities ?? []);
  }

  /* ── Init ────────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadTable(), loadFormForDate(todayStr())]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init-only, run once
  }, []);

  /* ── Reload server-side saat filter tanggal/bulan berubah ───── */
  const firstFilter = useRef(true);
  useEffect(() => {
    if (firstFilter.current) {
      firstFilter.current = false;
      return;
    }
    loadTable();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sengaja hanya 2 dep
  }, [dateFilter]);

  /* ── Ensure report exists (get-or-create per spec) ───────────── */
  async function ensureReport(date: string): Promise<WfhReport> {
    if (report && normDate(report.report_date) === date) return report;
    const res = await createWfhReport({ report_date: date, status: "draft" });
    setReport(res.data);
    return res.data;
  }

  /* ── Open form ───────────────────────────────────────────────── */
  async function openFormDate(date: string) {
    setFormDate(date);
    await loadFormForDate(date);
    setFormOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function handleTambahAbsensi() {
    openFormDate(dateFilter || todayStr());
  }

  /* ── Upload photo ────────────────────────────────────────────── */
  function handlePickFile(sessionName: string) {
    setActiveSession(sessionName);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;

    setSaving(true);
    setUploadingSession(activeSession);

    try {
      const rpt = await ensureReport(formDate);
      const attRes = await addReportAttendance(rpt.id, {
        session: activeSession,
        photo: file,
      });
      updateSessionState(activeSession, true, attRes.data.photo_url, attRes.data.id);
      showToast("Absensi berhasil.", "success");
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal upload absensi."), "error");
    } finally {
      setSaving(false);
      setUploadingSession(null);
      setActiveSession(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function updateSessionState(
    name: string,
    checkedIn: boolean,
    photoUrl: string | null,
    attendanceId: number | null
  ) {
    setSessions((prev) =>
      prev.map((s) =>
        s.name === name ? { ...s, checkedIn, photoUrl, attendanceId } : s
      )
    );
  }

  /* ── Delete attendance ───────────────────────────────────────── */
  async function handleDeleteAttendance(session: SessionState) {
    if (!session.attendanceId || !report) return;
    setSaving(true);
    try {
      await deleteReportAttendance(report.id, session.attendanceId);
      updateSessionState(session.name, false, null, null);
      showToast("Absensi dihapus.", "success");
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal hapus absensi."), "error");
    } finally {
      setSaving(false);
    }
  }

  /* ── Save all activities ──────────────────────────────────────── */
  async function handleSaveAllActivities() {
    const filled = kegRows.filter((r) => r.nama.trim());
    if (filled.length === 0) return;
    setSaving(true);
    try {
      const rpt = await ensureReport(formDate);
      for (const row of filled) {
        await createReportActivity(rpt.id, {
          start_time: row.start_time || "00:00",
          end_time: row.end_time || "00:00",
          activity: row.nama.trim(),
          links: row.link.trim() ? [{ url: row.link.trim() }] : undefined,
        });
      }
      await loadFormForDate(formDate);
      setKegRows([{ id: Date.now(), nama: "", start_time: "", end_time: "", link: "" }]);
      setKegModal(false);
      showToast("Kegiatan ditambahkan.", "success");
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal tambah kegiatan."), "error");
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete activity ─────────────────────────────────────────── */
  async function handleDeleteActivity(id: number) {
    if (!report) return;
    setSaving(true);
    try {
      await deleteReportActivity(report.id, id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
      showToast("Kegiatan dihapus.", "success");
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal hapus kegiatan."), "error");
    } finally {
      setSaving(false);
    }
  }

  /* ── PDF bukti kerja ──────────────────────────────────────────── */
  function openPdf(id: number) {
    openPdfDirect(`/api/wfh/reports/${id}/pdf`, (msg) => showToast(msg, "error"));
  }

  function handlePdfButton() {
    if (!report) return;
    if (report.status === "draft" || report.status === "rejected") {
      showToast("PDF bukti kerja tersedia setelah laporan disubmit.", "error");
      return;
    }
    openPdf(report.id);
  }

  /* ── Submit report ────────────────────────────────────────────── */
  async function handleSubmit() {
    setSaving(true);
    try {
      const rpt = await ensureReport(formDate);
      const res = await submitWfhReport(rpt.id);
      setReport(res.data);
      showToast("Laporan berhasil dikirim.", "success");
      loadTable();
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal kirim laporan."), "error");
    } finally {
      setSaving(false);
    }
  }

  /* ── Save report (draft) ─────────────────────────────────────── */
  async function handleSaveReport() {
    setSaving(true);
    try {
      const rpt = await ensureReport(formDate);
      await updateWfhReport(rpt.id, { report_date: formDate });
      showToast("Laporan disimpan.", "success");
      loadTable();
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal menyimpan laporan."), "error");
    } finally {
      setSaving(false);
    }
  }

  /* ── Riwayat rows: olah data dari response server (sudah difilter) ── */
  const rows = useMemo(() => {
    // Satu baris per tanggal; ambil laporan pertama per tanggal (urutan desc).
    const byDate = new Map<string, WfhReport>();
    for (const r of reports) {
      const d = normDate(r.report_date);
      if (!byDate.has(d)) byDate.set(d, r);
    }
    return [...byDate.entries()]
      .map(([date, report]) => ({ date, report }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [reports]);

  /* ── Hari WFH (dari konfigurasi admin) ───────────────────────── */
  const isWfhDay = (date: string) => allowedDays.includes(wfhDayNumber(date));

  /* ── Render ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "Beranda", href: "/profil" },
          { label: "Pegawai" },
          { label: "Absensi WFH" },
        ]}
      >
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-full" />
          <div className="bg-white rounded-[10px] shadow-sm overflow-hidden p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-4 border-b border-[#F0F0F0] last:border-b-0"
              >
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-6 w-6 rounded-full ml-auto" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Beranda", href: "/profil" },
        { label: "Pegawai" },
        { label: "Absensi WFH" },
      ]}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[32px] font-bold text-black leading-10">
          Absensi WFH
        </h1>
        <p className="text-lg text-[#767676]">
          Pantau status kehadiran dan pengumpulan tugas WFH Anda.
        </p>
      </div>

      {/* ── Tombol tambah absensi (di atas filtering, sembunyi saat form) ── */}
      {!formOpen &&
        (isWfhDay(todayStr()) ? (
          <div className="flex justify-end mb-4">
            <Button onClick={handleTambahAbsensi} className="gap-2">
              <AddIcon size={17} />
              Tambah Absensi
            </Button>
          </div>
        ) : (
          <div className="flex justify-end mb-4">
            <div className="w-full rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Hari ini bukan hari WFH Anda. Absensi dan pengumpulan tugas hanya
              dapat dilakukan pada hari WFH yang ditentukan admin (
              {allowedDays.map((d) => DAY_NAMES[d]).join(", ")}).
            </div>
          </div>
        ))}

      {/* ── Toolbar: filtering (sembunyi saat form terbuka) ────── */}
      {!formOpen && (
      <div className="bg-white rounded-[10px] shadow-sm p-5 mb-6 flex flex-wrap items-center gap-3">
        <FilterDropdown align="left" badge={Number(!!dateFilter)}>
          <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-[#424655]">
                Tanggal
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] outline-none focus:border-[#256EEF] text-[#424655]"
                />
              </label>
            </div>
          </FilterDropdown>
        <span className="text-sm text-[#767676]">{rows.length} hari</span>
      </div>
      )}

      {/* ── Tabel riwayat absensi (sembunyi saat form terbuka) ── */}
      {!formOpen && (
      <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <p className="text-center text-[13px] text-[#9CA3AF] py-8">
            Belum ada data. Klik &quot;+ Tambah Absensi&quot; untuk mengisi.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E0E9F2]">
                <th className="text-left px-4 py-3 font-medium text-[#141D23]">Tanggal</th>
                {SESI.map((s) => (
                  <th key={s} className="text-center px-4 py-3 font-medium text-[#141D23]">
                    {capFirst(s)}
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-medium text-[#141D23]">
                  Status Laporan
                </th>
                <th className="text-left px-4 py-3 font-medium text-[#141D23]">
                  Catatan
                </th>
                <th className="text-right px-4 py-3 font-medium text-[#141D23]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ date, report: rep }) => {
                const acts: {
                  label: string;
                  icon: React.ReactNode;
                  onClick: () => void;
                  disabled?: boolean;
                }[] = [
                  {
                    label: "Buka",
                    icon: <EditIcon size={16} />,
                    onClick: () => openFormDate(date),
                  },
                ];
                if (rep && (rep.status === "pending" || rep.status === "approved")) {
                  acts.push({
                    label: "Preview PDF",
                    icon: <EyeIcon size={16} />,
                    onClick: () => openPdf(rep.id),
                  });
                }
                return (
                  <tr key={date} className="border-b border-[#F0F0F0] hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3 text-[#333] whitespace-nowrap">
                      {todayDisplay(date)}
                    </td>
                    {SESI.map((s) => {
                      const att = rep?.attendances?.find((a) => a.session === s);
                      return (
                        <td key={s} className="px-4 py-3 text-center">
                          {att && att.checked_in ? <CheckIcon /> : <CloseIcon />}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      {rep ? (
                        <span
                          className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
                            STATUS_LABEL[rep.status]?.color ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABEL[rep.status]?.label ?? rep.status}
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          Belum Laporan
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#767676]">
                      {rep
                        ? catatanLaporan(rep)
                        : "Belum ada absensi · Belum upload tugas"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu
                        align="end"
                        trigger={
                          <button
                            type="button"
                            aria-label={`Aksi untuk ${todayDisplay(date)}`}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#424655] hover:bg-[#F6FAFF]"
                          >
                            <MoreVerticalIcon size={18} />
                          </button>
                        }
                        items={acts.map((a) => ({
                          label: a.label,
                          icon: a.icon,
                          disabled: a.disabled,
                          onClick: a.onClick,
                        }))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      )}

      {/* ── Form: absensi + bukti kerja ─────────────────────────── */}
      {formOpen && (
        <div ref={formRef} className="flex flex-col gap-4 mt-6 scroll-mt-6">
          {/* Tanggal WFH */}
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-4">
            <label className="text-xs font-bold text-[#374151] block mb-1.5">
              Tanggal WFH
            </label>
            <div className="text-[13px] text-[#374151]">
              {formatTanggalLengkap(formDate)}
            </div>
          </div>

          {!isWfhDay(formDate) && (
            <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Tanggal ini bukan hari WFH Anda. Absensi dan penambahan tugas
              tidak dapat dilakukan ({allowedDays.map((d) => DAY_NAMES[d]).join(", ")}).
            </div>
          )}

          {/* Absen */}
          {isWfhDay(formDate) && (
          <>
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-5">
            <h3 className="text-[15px] font-bold text-[#1f2937] mb-4">Absen</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {sessions.map((session) => (
                <div
                  key={session.name}
                  className="border-2 border-[#fbbf24] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-bold text-[#1f2937]">
                      Sesi {session.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        session.checkedIn
                          ? "bg-[#DCFCE7] text-[#15803D]"
                          : "bg-[#f59e0b] text-white"
                      }`}
                    >
                      {session.checkedIn ? "Terisi" : "Belum Diisi"}
                    </span>
                  </div>

                  {session.checkedIn && session.photoUrl ? (
                    imgFailed[session.name] ? (
                      <div className="bg-[#f9fafb] border border-dashed border-[#d1d5db] rounded h-[97px] flex flex-col items-center justify-center">
                        <span className="text-[11px] text-[#9ca3af]">Foto tidak tersedia</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={session.photoUrl}
                          alt={`Foto ${session.label}`}
                          className="w-full h-[97px] object-cover rounded border border-[#e5e7eb]"
                          onError={(e) => {
                            const el = e.currentTarget;
                            const rel = session.photoUrl?.replace(/^https?:\/\/[^/]+/, "");
                            if (rel && !el.src.startsWith(window.location.origin)) {
                              el.src = rel;
                              return;
                            }
                            setImgFailed((p) => ({ ...p, [session.name]: true }));
                          }}
                        />
                        <button
                          onClick={() => handleDeleteAttendance(session)}
                          disabled={saving}
                          className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-1 text-[#b91c1c] text-xs"
                          title="Hapus foto"
                          hidden={!session.attendanceId}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    )
                  ) : (
                    <div
                      className="bg-[#f9fafb] border border-dashed border-[#d1d5db] rounded h-[97px] flex flex-col items-center justify-center cursor-pointer hover:border-[#f59e0b] transition-colors"
                      onClick={() => !saving && handlePickFile(session.name)}
                    >
                      {uploadingSession === session.name ? (
                        <span className="text-[11px] text-[#f59e0b]">Mengunggah...</span>
                      ) : (
                        <>
                          <AddIcon size={26} className="text-[#f59e0b]" />
                          <span className="text-[11px] text-[#9ca3af] mt-0.5">Unggah Foto</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Daftar Kegiatan */}
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1f2937]">
                Daftar Kegiatan
              </h3>
              <button
                onClick={() => setKegModal(true)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-[#1E3A5F] text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <AddIcon size={14} />
                Tambah Kegiatan
              </button>
            </div>

            {activities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F9FAFB]">
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-[#4B5563]">
                        Nama Kegiatan
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-[#4B5563]">
                        Waktu
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-[#4B5563]">
                        Bukti Kegiatan
                      </th>
                      <th className="text-center px-4 py-2.5 text-xs font-bold text-[#4B5563] w-[100px]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((act) => (
                      <tr key={act.id} className="border-t border-[#E5E7EB]">
                        <td className="px-4 py-3 text-[#374151] text-[13px]">
                          {act.activity}
                        </td>
                        <td className="px-4 py-3 text-[#767676] text-[13px] whitespace-nowrap">
                          {act.start_time && act.start_time !== "00:00"
                            ? `${fmtWaktu(act.start_time)} – ${fmtWaktu(act.end_time)}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          {act.links && act.links.length > 0 ? (
                            <a
                              href={act.links[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#256EEF] hover:underline"
                            >
                              {act.links[0].url.length > 40
                                ? act.links[0].url.slice(0, 40) + "..."
                                : act.links[0].url}
                            </a>
                          ) : (
                            <span className="text-[#9CA3AF]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteActivity(act.id)}
                            disabled={saving}
                            className="text-[#F87171] hover:text-red-700"
                            title="Hapus kegiatan"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-[13px] text-[#9CA3AF] py-8">
                Belum ada kegiatan. Klik &quot;+ Tambah Kegiatan&quot;.
              </p>
            )}
          </div>
          </>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="!bg-[#1E3A5F] !border-[#1E3A5F] !text-white hover:!bg-[#16304f]"
              disabled={saving}
              onClick={handlePdfButton}
            >
              {report?.status === "approved" ? "Download" : "Preview"} PDF
            </Button>
            <Button variant="primary" disabled={saving} onClick={handleSaveReport}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button
              variant="primary"
              className="!bg-[#22c55e] !border-[#22c55e] hover:!bg-[#16a34a]"
              disabled={saving}
              onClick={handleSubmit}
            >
              {saving ? "Mengirim..." : "Kirim Laporan"}
            </Button>
            <Button
              variant="outline"
              className="!bg-[#e5e7eb] !border-[#e5e7eb] !text-[#374151] hover:!bg-gray-200"
              disabled={saving}
              onClick={() => setFormOpen(false)}
            >
              Tutup Form
            </Button>
          </div>
        </div>
      )}

      {/* ── Hidden file input ──────────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Modal: Tambah Kegiatan Baru ──────────────────────────── */}
      <Modal open={kegModal} onClose={() => setKegModal(false)} maxWidth="max-w-4xl" className="bg-[#EFF6FF]">
        <div className="p-6">
          <h3 className="text-base font-bold text-[#1E293B] mb-5">
            Tambah Kegiatan Baru
          </h3>

          {/* ── Scrollable form rows ────────────────────────────── */}
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {kegRows.map((row, idx) => (
              <div key={row.id} className="relative border-b border-white/40 pb-4 last:border-b-0">
                {kegRows.length > 1 && (
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] text-[#64748B] font-bold">
                      Kegiatan {idx + 1}
                    </span>
                    <button
                      onClick={() => removeKegRow(row.id)}
                      className="text-[#F87171] hover:text-red-600 text-xs font-bold"
                    >
                      Hapus
                    </button>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[#334155] mb-1.5">
                      Nama Kegiatan
                    </label>
                    <input
                      value={row.nama}
                      onChange={(e) => updateKegRow(row.id, "nama", e.target.value)}
                      placeholder="Masukkan nama kegiatan..."
                      className="w-full h-11 bg-white rounded-lg px-4 text-sm text-[#334155] outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition-all placeholder:text-[#949CA8]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TimePicker
                      label="Waktu Dimulai"
                      value={row.start_time}
                      onChange={(v) => updateKegRow(row.id, "start_time", v)}
                    />
                    <TimePicker
                      label="Waktu Selesai"
                      value={row.end_time}
                      onChange={(v) => updateKegRow(row.id, "end_time", v)}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#334155] mb-1.5">
                      Bukti Kegiatan (Link)
                    </label>
                    <input
                      value={row.link}
                      onChange={(e) => updateKegRow(row.id, "link", e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full h-11 bg-white rounded-lg px-4 text-sm text-[#334155] outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition-all placeholder:text-[#949CA8]"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* ── Tambah (kanan) + Simpan/Batal — hanya saat inputan terakhir terisi ── */}
            <div className="pt-4 flex flex-col items-end gap-3">
              <button
                onClick={addKegRow}
                className="inline-flex items-center gap-1.5 bg-[#1E3A5F] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                <AddIcon size={15} />
                Tambah Kegiatan
              </button>
              {lastKegFilled && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setKegModal(false);
                      setKegRows([{ id: Date.now(), nama: "", start_time: "", end_time: "", link: "" }]);
                    }}
                    className="bg-[#E2E8F0] text-[#475569] text-sm font-bold px-9 py-2.5 rounded-lg hover:opacity-80 transition-opacity"
                  >
                    Batal
                  </button>
                  <button
                    disabled={saving || !kegRows.some((r) => r.nama.trim())}
                    onClick={handleSaveAllActivities}
                    className="bg-[#2563EB] text-white text-sm font-bold px-10 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Toast ───────────────────────────────────────────────── */}
      <Toast
        open={toastOpen}
        message={toastMsg}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
    </AppLayout>
  );
}

/* ── Helpers & icons ──────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline-block" aria-label="Hadir">
      <circle cx="8" cy="8" r="7" fill="#E8F7EE" />
      <path d="M5 8.2l2 2 4-4.4" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline-block" aria-label="Tidak hadir">
      <circle cx="8" cy="8" r="7" fill="#FDECEC" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
