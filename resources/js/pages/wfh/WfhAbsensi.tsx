import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import {
  getWfhSessionConfig,
  createWfhReport,
  listWfhReports,
  getWfhReport,
  addReportAttendance,
  deleteReportAttendance,
  createReportActivity,
  deleteReportActivity,
  updateWfhReport,
  submitWfhReport,
  type WfhReport,
  type WfhReportActivity,
  extractWfhError,
} from "../../api/wfh";
import { openPdfDirect } from "../../utils/swAuth";

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

function parseTimeRange(input: string): { start_time: string; end_time: string } | null {
  const m = input.match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/);
  if (m) {
    return {
      start_time: `${m[1].padStart(2, "0")}:${m[2]}`,
      end_time: `${m[3].padStart(2, "0")}:${m[4]}`,
    };
  }
  const single = input.match(/(\d{1,2})[.:](\d{2})/);
  if (single) {
    return {
      start_time: `${single[1].padStart(2, "0")}:${single[2]}`,
      end_time: `${single[1].padStart(2, "0")}:${single[2]}`,
    };
  }
  return null;
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
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [report, setReport] = useState<WfhReport | null>(null);
  const [sessions, setSessions] = useState<SessionState[]>([]);
  const [activities, setActivities] = useState<WfhReportActivity[]>([]);
  const [reportDate, setReportDate] = useState(todayStr());
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  /* ── Upload ──────────────────────────────────────────────────── */
  const [uploadingSession, setUploadingSession] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  /* ── Kegiatan modal ──────────────────────────────────────────── */
  interface KegFormRow {
    id: number;
    nama: string;
    waktu: string;
    link: string;
  }
  const [kegModal, setKegModal] = useState(false);
  const [kegRows, setKegRows] = useState<KegFormRow[]>([{ id: 1, nama: "", waktu: "", link: "" }]);

  function addKegRow() {
    setKegRows((prev) => [...prev, { id: Date.now(), nama: "", waktu: "", link: "" }]);
  }

  function updateKegRow(id: number, field: "nama" | "waktu" | "link", value: string) {
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

  /* ── Init ────────────────────────────────────────────────────── */
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init-only, run once
  }, []);

  async function loadData() {
    setLoading(true);
    setErrMsg("");
    try {
      const cfgRes = await getWfhSessionConfig();
      const sessionNames = cfgRes.data.sessions;
      const today = todayStr();

      // Find today's report
      let currentReport: WfhReport | null = null;
      try {
        const listRes = await listWfhReports({ per_page: 100 });
        // report_date bisa ISO UTC ("2026-07-30T17:00:00.000000Z") = hari ini WIB
        const todayReport = listRes.data.find((r) => {
          const d = r.report_date.includes("T") || r.report_date.includes("Z")
            ? new Date(r.report_date).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
            : r.report_date.slice(0, 10);
          return d === today;
        });
        if (todayReport) {
          const detailRes = await getWfhReport(todayReport.id);
          currentReport = detailRes.data;
        }
      } catch {
        // no report yet
      }

      // Build session states
      const init: SessionState[] = sessionNames.map((name) => ({
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

      // Load activities
      if (currentReport) {
        loadActivities(currentReport.id);
      }
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal memuat data."));
    } finally {
      setLoading(false);
    }
  }

  async function loadActivities(reportId: number) {
    try {
      // GET /activities route doesn't exist; report detail embeds activities
      const res = await getWfhReport(reportId);
      setActivities(res.data?.activities ?? []);
    } catch {
      // no activities yet
    }
  }

  /* ── Ensure report exists ────────────────────────────────────── */
  async function ensureReport(date: string): Promise<WfhReport> {
    if (report) return report;
    const res = await createWfhReport({ report_date: date, status: "draft" });
    setReport(res.data);
    return res.data;
  }

  /* ── Date change ──────────────────────────────────────────────── */
  async function handleDateChange(date: string) {
    setReportDate(date);
    if (report) {
      try {
        await updateWfhReport(report.id, { report_date: date });
      } catch (e: unknown) {
        showToast(extractWfhError(e, "Gagal ubah tanggal."), "error");
      }
    }
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
    setErrMsg("");

    try {
      const rpt = await ensureReport(reportDate);
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
      const rpt = report || (await ensureReport(reportDate));
      for (const row of filled) {
        const times = parseTimeRange(row.waktu);
        await createReportActivity(rpt.id, {
          start_time: times?.start_time ?? "00:00",
          end_time: times?.end_time ?? "00:00",
          activity: row.nama.trim(),
          links: row.link.trim() ? [{ url: row.link.trim() }] : undefined,
        });
      }
      await loadActivities(rpt.id);
      setKegRows([{ id: Date.now(), nama: "", waktu: "", link: "" }]);
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
  async function handlePdfButton() {
    if (!report) return;
    if (report.status === "draft" || report.status === "rejected") {
      showToast("PDF bukti kerja tersedia setelah laporan disubmit.", "error");
      return;
    }
    // Buka langsung di tab (tanpa blob) — auth header dipasang Service Worker.
    openPdfDirect(`/api/wfh/reports/${report.id}/pdf`, (msg) => showToast(msg, "error"));
  }

  /* ── Submit report ────────────────────────────────────────────── */
  async function handleSubmit() {
    setSaving(true);
    try {
      // Buat draft dulu kalau belum ada, lalu submit (guard konten ada di BE)
      const rpt = report || (await ensureReport(reportDate));
      const res = await submitWfhReport(rpt.id);
      setReport(res.data);
      showToast("Laporan berhasil dikirim.", "success");
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
      const rpt = report || (await ensureReport(reportDate));
      await updateWfhReport(rpt.id, { report_date: reportDate });
      showToast("Laporan disimpan.", "success");
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal menyimpan laporan."), "error");
    } finally {
      setSaving(false);
    }
  }

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
        <div className="text-center py-12 text-sm text-[#767676]">Memuat...</div>
      </AppLayout>
    );
  }

  if (errMsg && !report && sessions.length === 0) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "Beranda", href: "/profil" },
          { label: "Pegawai" },
          { label: "Absensi WFH" },
        ]}
      >
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {errMsg}
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
        <p className="text-lg font-bold text-black mt-1">
          Status Kehadiran Hari Ini
        </p>
        <p className="text-lg text-[#767676]">{todayDisplay(reportDate)}</p>
      </div>

      {/* ── Card: Tanggal WFH ──────────────────────────────────── */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-4">
        <label className="text-xs font-bold text-[#374151] block mb-1.5">
          Tanggal WFH
        </label>
        <input
          type="date"
          value={reportDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-[214px] h-[35px] border border-[#d1d5db] rounded px-3 text-[13px] text-[#374151] outline-none focus:border-[#256EEF] transition-colors"
        />
      </div>

      {/* ── Card: Absen ────────────────────────────────────────── */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-5">
        <h3 className="text-[15px] font-bold text-[#1f2937] mb-4">Absen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {sessions.map((session) => (
            <div
              key={session.name}
              className="border-2 border-[#fbbf24] rounded-lg p-3"
            >
              {/* Header: name + badge */}
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

              {/* Photo area */}
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
                      // Fallback 1: retry path relatif (host API absolut beda origin/port)
                      const rel = session.photoUrl?.replace(/^https?:\/\/[^/]+/, "");
                      if (rel && !el.src.startsWith(window.location.origin)) {
                        el.src = rel;
                        return;
                      }
                      // Fallback 2: placeholder
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
                      <span className="text-[28px] text-[#f59e0b] leading-none">+</span>
                      <span className="text-[11px] text-[#9ca3af] mt-0.5">Unggah Foto</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Card: Daftar Kegiatan ──────────────────────────────── */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-[#1f2937]">
            Daftar Kegiatan
          </h3>
          <button
            onClick={() => setKegModal(true)}
            className="bg-[#1E3A5F] text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            + Tambah Kegiatan
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
                        className="text-[#F87171] hover:text-red-700 text-xs font-medium"
                      >
                        Hapus
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

      {/* ── Action buttons ──────────────────────────────────────── */}
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
          Simpan
        </Button>
        <Button
          variant="primary"
          className="!bg-[#22c55e] !border-[#22c55e] hover:!bg-[#16a34a]"
          disabled={saving}
          onClick={handleSubmit}
        >
          Kirim Laporan
        </Button>
        <Button
          variant="outline"
          className="!bg-[#e5e7eb] !border-[#e5e7eb] !text-[#374151] hover:!bg-gray-200"
          onClick={() => nav("/profil")}
        >
          Kembali
        </Button>
      </div>

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
          {/* Header: title left, + Tambah right */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-[#1E293B]">Tambah Kegiatan Baru</h3>
            <button
              onClick={addKegRow}
              className="bg-[#1E3A5F] text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              + Tambah
            </button>
          </div>

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
                  <div>
                    <label className="block text-[13px] font-bold text-[#334155] mb-1.5">
                      Waktu Kegiatan
                    </label>
                    <input
                      value={row.waktu}
                      onChange={(e) => updateKegRow(row.id, "waktu", e.target.value)}
                      placeholder="08.00-11.00"
                      className="w-full h-11 bg-white rounded-lg px-4 text-sm text-[#334155] outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition-all placeholder:text-[#949CA8]"
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
          </div>

          {/* ── Actions ─────────────────────────────────────────── */}
          <div className="flex items-center gap-3 justify-end mt-5">
            <button
              onClick={() => {
                setKegModal(false);
                setKegRows([{ id: Date.now(), nama: "", waktu: "", link: "" }]);
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
              Simpan
            </button>
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
