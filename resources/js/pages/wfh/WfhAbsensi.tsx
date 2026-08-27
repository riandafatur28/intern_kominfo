import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import Button from "../../components/ui/Button";
import PageTitle from "../../components/ui/PageTitle";
import Toast from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import DatePicker from "../../components/ui/DatePicker";
import Pagination from "../../components/ui/Pagination";
import DropdownMenu from "../../components/ui/DropdownMenu";
import TimePicker from "../../components/ui/TimePicker";
import {
  AddIcon,
  DownloadIcon,
  EditIcon,
  EyeIcon,
  MoreVerticalIcon,
  SaveIcon,
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
  updateReportActivity,
  type WfhReport,
  type WfhReportActivity,
} from "../../api/wfh";
import { openPdfDirect } from "../../utils/swAuth";
import { catatanLaporan } from "../../utils/wfhReportNote";
import {
  capFirst,
  fmtWaktu,
  normDate,
  todayDisplay,
  todayStr,
  wfhDayNumber,
} from "../../utils/wfhDate";

const SESI = ["pagi", "siang", "sore"] as const;

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "Belum Dikirim", color: "bg-gray-100 text-gray-600" },
  pending: { label: "Terkirim", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Disetujui", color: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-700" },
};

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

interface SessionState {
  name: string;
  label: string;
  checkedIn: boolean;
  photoUrl: string | null;
  attendanceId: number | null;
}

export default function WfhAbsensi() {
  const navigate = useNavigate();
  const { date: dateParam } = useParams<{ date?: string }>();
  const isForm = !!dateParam;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ── Riwayat (tabel) ────────────────────────────────────────── */
  const [reports, setReports] = useState<WfhReport[]>([]);
  const [allowedDays, setAllowedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [dateFilter, setDateFilter] = useState(todayStr());
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  /* ── Form absensi + bukti kerja ─────────────────────────────── */
  const formRef = useRef<HTMLDivElement>(null);
  const [formDate, setFormDate] = useState(dateParam ?? todayStr());
  const [report, setReport] = useState<WfhReport | null>(null);
  const [sessions, setSessions] = useState<SessionState[]>([]);
  const [activities, setActivities] = useState<WfhReportActivity[]>([]);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  const isSubmitted =
    report?.status === "pending" || report?.status === "approved";

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
  const [editingActId, setEditingActId] = useState<number | null>(null);

  function addKegRow() {
    setKegRows((prev) => [...prev, { id: Date.now(), nama: "", start_time: "", end_time: "", link: "" }]);
  }

  function updateKegRow(id: number, field: "nama" | "start_time" | "end_time" | "link", value: string) {
    setKegRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function removeKegRow(id: number) {
    setKegRows((prev) => prev.filter((r) => r.id !== id));
  }

  function handleOpenEditActivity(act: WfhReportActivity) {
    setEditingActId(act.id);
    setKegRows([{
      id: act.id,
      nama: act.activity,
      start_time: act.start_time && act.start_time !== "00:00" ? act.start_time.slice(0, 5) : "",
      end_time: act.end_time && act.end_time !== "00:00" ? act.end_time.slice(0, 5) : "",
      link: act.links?.[0]?.url ?? "",
    }]);
    setKegModal(true);
  }

  async function handleUpdateActivity() {
    if (!report || !editingActId) return;
    const row = kegRows[0];
    if (!row.nama.trim() || !row.start_time || !row.end_time) {
      showToast("Semua field kegiatan wajib diisi.", "error");
      return;
    }
    setSaving(true);
    try {
      await updateReportActivity(report.id, editingActId, {
        start_time: row.start_time,
        end_time: row.end_time,
        activity: row.nama.trim(),
        links: row.link.trim() ? [{ url: row.link.trim() }] : undefined,
      });
      await loadFormForDate(formDate);
      setEditingActId(null);
      setKegRows([{ id: Date.now(), nama: "", start_time: "", end_time: "", link: "" }]);
      setKegModal(false);
      showToast("Kegiatan berhasil diperbarui.", "success");
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal update kegiatan."), "error");
    } finally {
      setSaving(false);
    }
  }

  function handleCloseKegModal() {
    setKegModal(false);
    setEditingActId(null);
    setKegRows([{ id: Date.now(), nama: "", start_time: "", end_time: "", link: "" }]);
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

  /* ── Init / sync dengan rute ─────────────────────────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setFormDate(dateParam ?? todayStr());
      if (isForm && dateParam) {
        setReports([]);
        await loadFormForDate(dateParam);
      } else {
        await Promise.all([loadTable(), loadFormForDate(todayStr())]);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sengaja hanya 2 dep
  }, [dateParam]);

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

  /* ── Open form (navigasi ke rute tanggal) ───────────────────── */
  function openFormDate(date: string) {
    navigate(`/wfh/absensi/${date}`);
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
    
    for (const row of filled) {
      if (!row.start_time || !row.end_time) {
        showToast("Semua field kegiatan wajib diisi (nama, waktu mulai, waktu selesai).", "error");
        return;
      }
    }
    
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

  /* ── Riwayat rows: olah data dari response server (sudah difilter) ── */
  const rows = useMemo(() => {
    // Satu baris per tanggal; ambil laporan pertama per tanggal (urutan desc).
    const byDate = new Map<string, WfhReport>();
    for (const r of reports) {
      if (statusFilter && r.status !== statusFilter) continue;
      const d = normDate(r.report_date);
      if (!byDate.has(d)) byDate.set(d, r);
    }
    return [...byDate.entries()]
      .map(([date, report]) => ({ date, report }))
      .sort((a, b) =>
        sortOrder === "oldest"
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date)
      );
  }, [reports, statusFilter, sortOrder]);

  const PAGE_SIZE = 20;
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rowLastPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  /* ── Hari WFH (dari konfigurasi admin) ───────────────────────── */
  const isWfhDay = (date: string) => allowedDays.includes(wfhDayNumber(date));

  /* ── Render ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "Beranda", href: "/" },
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
      breadcrumbs={
        isForm
          ? [
              { label: "Beranda", href: "/" },
              { label: "Absensi WFH", href: "/wfh/absensi" },
              { label: "Isi Absensi" },
            ]
          : [
              { label: "Beranda", href: "/" },
              { label: "Absensi WFH" },
            ]
      }
    >
      {/* ── Header ─────────────────────────────────────────────── */}
{/* ── Header + tombol tambah (satu baris, pola sama dgn halaman lain) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle
          title="Absensi WFH"
          subtitle="Pantau status kehadiran dan pengumpulan tugas WFH Anda."
        />
        {!isForm &&
          (isWfhDay(todayStr()) ? (
            <Button onClick={handleTambahAbsensi} className="gap-2">
              <AddIcon size={17} />
              Tambah Absensi
            </Button>
          ) : (
            <div className="w-full rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Hari ini bukan hari WFH Anda. Absensi dan pengumpulan tugas hanya
              dapat dilakukan pada hari WFH yang ditentukan admin (
              {allowedDays.map((d) => DAY_NAMES[d]).join(", ")}).
            </div>
          ))}
      </div>

      {/* ── Toolbar: filtering (sembunyi saat form terbuka) ────── */}
      {!isForm && (
      <div className="flex flex-wrap items-center gap-3">
        <div className="ml-auto">
          <FilterDropdown badge={Number(dateFilter !== todayStr()) + Number(!!statusFilter) + Number(sortOrder !== "newest")}>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-[#424655]">
                Tanggal
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] outline-none focus:border-[#256EEF] text-[#424655] bg-white"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-[#424655]">
                Status Laporan
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] outline-none focus:border-[#256EEF] text-[#424655] bg-white"
                >
                  <option value="">Semua Status</option>
                  {Object.entries(STATUS_LABEL).map(([val, { label }]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-[#424655]">
                Urutan
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value as "newest" | "oldest");
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] outline-none focus:border-[#256EEF] text-[#424655] bg-white"
                >
                  <option value="newest">Tanggal Terbaru</option>
                  <option value="oldest">Tanggal Terlama</option>
                </select>
              </label>
            </div>
          </FilterDropdown>
        </div>
      </div>
      )}

      {/* ── Tabel riwayat absensi (sembunyi saat form terbuka) ── */}
      {!isForm && (
      <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <p className="text-center text-[13px] text-[#9CA3AF] py-8">
            Belum ada data. Klik &quot;+ Tambah Absensi&quot; untuk mengisi.
          </p>
        ) : (
          <>
          <div className="overflow-x-auto">
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
              {pageRows.map(({ date, report: rep }) => {
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
          </div>

          <div className="px-4 py-3 border-t border-[#E0E9F2]">
            <Pagination
              currentPage={page}
              lastPage={rowLastPage}
              total={rows.length}
              from={(page - 1) * PAGE_SIZE + 1}
              to={Math.min(page * PAGE_SIZE, rows.length)}
              unit="laporan"
              onPageChange={setPage}
            />
          </div>
          </>
        )}
      </div>
      )}

      {/* ── Form: absensi + bukti kerja ─────────────────────────── */}
      {isForm && (
        <div ref={formRef} className="flex flex-col gap-4 scroll-mt-6">
          {/* Tanggal WFH — rata kanan, tanpa kartu (transparan) */}
          <div className="ml-auto w-full max-w-[24rem]">
            <DatePicker
              label="Tanggal WFH"
              value={formDate}
              onChange={(v) => {
                if (v) openFormDate(v);
              }}
            />
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
                          hidden={!session.attendanceId || isSubmitted}
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-[15px] font-bold text-[#1f2937]">
                Daftar Kegiatan
              </h3>
              {!isSubmitted && (
              <button
                onClick={() => { setEditingActId(null); setKegRows([{ id: Date.now(), nama: "", start_time: "", end_time: "", link: "" }]); setKegModal(true); }}
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-[#1E3A5F] text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <AddIcon size={14} />
                Tambah Kegiatan
              </button>
              )}
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
                      <th className="text-right px-4 py-2.5 text-xs font-bold text-[#4B5563] w-[60px]">
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
                        <td className="px-4 py-3 text-right">
                          {!isSubmitted && (
                          <DropdownMenu
                            align="end"
                            trigger={
                              <button
                                type="button"
                                aria-label={`Aksi untuk kegiatan`}
                                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#424655] hover:bg-[#F6FAFF]"
                              >
                                <MoreVerticalIcon size={18} />
                              </button>
                            }
                            items={[
                              {
                                label: "Edit",
                                icon: <EditIcon size={16} />,
                                disabled: saving,
                                onClick: () => handleOpenEditActivity(act),
                              },
                              {
                                label: "Hapus",
                                icon: <TrashIcon size={16} />,
                                variant: "destructive" as const,
                                disabled: saving,
                                onClick: () => handleDeleteActivity(act.id),
                              },
                            ]}
                          />
                          )}
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
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="!bg-[#e5e7eb] !border-[#e5e7eb] !text-[#374151] hover:!bg-gray-200"
              disabled={saving}
              onClick={() => navigate("/wfh/absensi")}
            >
              <BackIcon size={16} /> Kembali
            </Button>
            {isSubmitted && (
              <Button
                variant="outline"
                className="!bg-[#1E3A5F] !border-[#1E3A5F] !text-white hover:!bg-[#16304f]"
                disabled={saving}
                onClick={handlePdfButton}
              >
                {report?.status === "approved" ? (
                  <>
                    <DownloadIcon size={16} /> Download PDF
                  </>
                ) : (
                  <>
                    <EyeIcon size={16} /> Preview PDF
                  </>
                )}
              </Button>
            )}
            {!isSubmitted && (
              <Button
                variant="primary"
                className="!bg-[#22c55e] !border-[#22c55e] hover:!bg-[#16a34a]"
                disabled={saving}
                onClick={handleSubmit}
              >
                <SendIcon size={16} /> {saving ? "Mengirim..." : "Kirim Laporan"}
              </Button>
            )}
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

      {/* ── Modal: Tambah / Edit Kegiatan ──────────────────────────── */}
      <Modal open={kegModal} onClose={handleCloseKegModal} maxWidth="max-w-4xl" className="bg-[#EFF6FF]">
        <div className="p-6">
          <h3 className="text-base font-bold text-[#1E293B] mb-5">
            {editingActId ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
          </h3>

          {/* ── Scrollable form rows ────────────────────────────── */}
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {kegRows.map((row, idx) => (
              <div key={row.id} className="relative border-b border-white/40 pb-4 last:border-b-0 last:pb-0">
                {kegRows.length > 1 && (
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] text-[#64748B] font-bold">
                      Kegiatan {idx + 1}
                    </span>
                    <button
                      onClick={() => removeKegRow(row.id)}
                      className="inline-flex items-center gap-1 text-[#F87171] hover:text-red-600 text-xs font-bold"
                    >
                      <TrashIcon size={13} />
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
          </div>

          {/* ── Tambah row (rapat ke form) + Simpan/Batal (selalu terlihat) ── */}
          <div className="pt-4">
            {!editingActId && (
            <div className="flex justify-end">
              <button
                onClick={addKegRow}
                className="inline-flex items-center gap-1.5 bg-[#1E3A5F] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                <AddIcon size={15} />
                Tambah Kegiatan
              </button>
            </div>
            )}
            <div className="flex items-center justify-end gap-3 mt-10">
              <button
                onClick={handleCloseKegModal}
                className="inline-flex items-center gap-1.5 bg-[#E2E8F0] text-[#475569] text-sm font-bold px-9 py-2.5 rounded-lg hover:opacity-80 transition-opacity"
              >
                <XIcon size={15} />
                Batal
              </button>
              <button
                disabled={saving || !kegRows.every((r) => r.nama.trim() && r.start_time && r.end_time)}
                onClick={editingActId ? handleUpdateActivity : handleSaveAllActivities}
                className="inline-flex items-center gap-1.5 bg-[#2563EB] text-white text-sm font-bold px-10 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SaveIcon size={15} />
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
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

function BackIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M9.5 4.5L4 10l5.5 5.5M4 10h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 10l14-6-3.5 12L9 12l3-2-3-2-6 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

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
