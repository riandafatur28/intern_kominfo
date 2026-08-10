import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import TextArea from "../../components/ui/TextArea";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
import DropdownMenu from "../../components/ui/DropdownMenu";
import {
  DownloadIcon,
  EyeIcon,
  MoreVerticalIcon,
} from "../../components/ui/AdminActionIcons";
import FilterDropdown from "../../components/ui/FilterDropdown";
import Skeleton from "../../components/ui/Skeleton";
import { useAuth } from "../../hooks/useAuth";
import { listTeams, type Team } from "../../api/teams";
import {
  adminListWfhReports,
  approveWfhReport,
  rejectWfhReport,
  listTeamReports,
  createTeamReport,
  approveTeamReport,
  rejectTeamReport,
  getWfhMonitoring,
  type WfhReport,
  type WfhTeamReport,
  type MonitoringUser,
  extractWfhError,
} from "../../api/wfh";
import { openPdfDirect } from "../../utils/swAuth";
import { formatTanggalLengkap } from "../../utils/userDisplay";
import { catatanLaporan } from "../../utils/wfhReportNote";

type PageStatus = "loading" | "ready" | "error";
type Tab = "individu" | "tim";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "Belum Dikirim", color: "bg-gray-100 text-gray-600" },
  pending: { label: "Terkirim", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Disetujui", color: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-700" },
};

const SESI = ["pagi", "siang", "sore"] as const;

const TODAY = new Date().toISOString().slice(0, 10);

export default function WfhMonitoring() {
  const { user, hasPermission } = useAuth();

  const canExportPdf = hasPermission("wfh.report.export_pdf");
  const canApprove = hasPermission("wfh.report.approve");
  const canReject = hasPermission("wfh.report.reject");
  const canTApprove = hasPermission("wfh.team_report.approve");
  const canTReject = hasPermission("wfh.team_report.reject");

  /* ── Tabs & shared ───────────────────────────────────────────── */
  const [tab, setTab] = useState<Tab>("individu");
  const [teams, setTeams] = useState<Team[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  /* ── Individu filters ────────────────────────────────────────── */
  const [date, setDate] = useState(TODAY);
  const [teamId, setTeamId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  /* ── Individu list ───────────────────────────────────────────── */
  const [status, setStatus] = useState<PageStatus>("loading");
  const [errMsg, setErrMsg] = useState("");
  const [reports, setReports] = useState<WfhReport[]>([]);
  /* Staff who haven't submitted a report that day (getWfhMonitoring no_report) */
  const [missingUsers, setMissingUsers] = useState<MonitoringUser[]>([]);
  const [page, setPage] = useState(1);

  /* ── Tim list ────────────────────────────────────────────────── */
  const [teamReports, setTeamReports] = useState<WfhTeamReport[]>([]);
  const [tPage, setTPage] = useState(1);

  /* ── Tim filters (sama seperti individu) ─────────────────────── */
  const [tSearch, setTSearch] = useState("");
  const [tTeamId, setTTeamId] = useState("");
  const [tStatus, setTStatus] = useState("");
  const [tDate, setTDate] = useState(TODAY);

  /* ── Individu reject ─────────────────────────────────────────── */
  const [showReject, setShowReject] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [saving, setSaving] = useState(false);

  /* ── Tim create ──────────────────────────────────────────────── */
  const [showCreate, setShowCreate] = useState(false);
  const [createTeamId, setCreateTeamId] = useState("");
  const [createDate, setCreateDate] = useState(TODAY);
  const [createMsg, setCreateMsg] = useState("");
  const [createErr, setCreateErr] = useState("");

  /* ── Tim reject ──────────────────────────────────────────────── */
  const [showTReject, setShowTReject] = useState(false);
  const [tRejectId, setTRejectId] = useState<number | null>(null);
  const [tRejectReason, setTRejectReason] = useState("");

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToastMsg(msg);
    setToastType(type);
    setToastOpen(true);
  }

  /* ── Data loading ────────────────────────────────────────────── */
  async function loadTeams() {
    try {
      // Kabid (kepala bidang) → tim dalam bidangnya; admin → semua tim.
      const fieldId = user?.team?.field?.id;
      const list = await listTeams(fieldId ?? undefined);
      setTeams(list);
    } catch {
      /* dropdown tetap kosong — tidak memblok halaman */
    }
  }

  async function loadReports() {
    setStatus("loading");
    setErrMsg("");
    try {
      // Tanggal tunggal → ambil semua laporan sekaligus (cap BE 100);
      // pagination dihitung client-side atas gabungan laporan + belum laporan.
      const params: {
        per_page?: number;
        team_id?: number;
        status?: string;
        date_from?: string;
        date_to?: string;
      } = { per_page: 100, date_from: date, date_to: date };
      if (teamId) params.team_id = Number(teamId);
      if (statusFilter) params.status = statusFilter;
      const [res, mon] = await Promise.all([
        adminListWfhReports(params),
        getWfhMonitoring({ date }),
      ]);
      // Draft = belum dikirim → bukan laporan resmi; tampil sebagai "Belum Dikirim"
      const visible = res.data.filter((r) => r.status !== "draft");
      setReports(visible);
      const reportIds = new Set(visible.map((r) => r.user_id));
      const draftUsers = res.data
        .filter((r) => r.status === "draft")
        .map(
          (r) =>
            ({
              id: r.user_id,
              name: r.user?.name ?? "-",
              nip: r.user?.nip ?? "",
              email: "",
              rank: null,
              position: null,
              phone: null,
              is_active: true,
              team_id: null,
              team: null,
              _draft: true,
              _report: r,
            }) as MonitoringUser & { _draft?: boolean; _report?: WfhReport }
        );
      // Staff tanpa laporan terkirim tanggal ini → "Belum Laporan" / "Belum Dikirim"
      setMissingUsers([
        ...draftUsers,
        ...(mon.data.no_report ?? []).filter((u) => !reportIds.has(u.id)),
      ]);
      setStatus("ready");
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal memuat monitoring."));
      setStatus("error");
    }
  }

  async function loadTeamReports() {
    setErrMsg("");
    try {
      const res = await listTeamReports({ per_page: 100 });
      // BE returns raw paginator {data,current_page,last_page,total} without meta envelope
      const raw = ((res as unknown as { meta?: { data?: WfhTeamReport[]; current_page?: number; last_page?: number; total?: number } }).meta ?? res) as { data?: WfhTeamReport[]; current_page?: number; last_page?: number; total?: number };
      setTeamReports(raw.data ?? []);
      setTPage(1);
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal memuat laporan tim."));
    }
  }

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "individu") loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, date, teamId, statusFilter]);

  useEffect(() => {
    if (tab === "tim") loadTeamReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, tSearch, tTeamId, tStatus, tDate]);

  useEffect(() => {
    setTPage(1);
  }, [tSearch, tTeamId, tStatus, tDate]);

  /* ── Actions: individu ───────────────────────────────────────── */
  async function openPdf(r: WfhReport) {
    // Buka langsung di tab (tanpa blob) — auth header dipasang Service Worker.
    openPdfDirect(`/api/wfh/reports/${r.id}/pdf`, (msg) => showToast(msg, "error"));
  }

  async function handleApprove(r: WfhReport) {
    setSaving(true);
    setErrMsg("");
    try {
      await approveWfhReport(r.id);
      showToast("Laporan disetujui.");
      loadReports();
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal menyetujui laporan."), "error");
    } finally {
      setSaving(false);
    }
  }

  function openReject(r: WfhReport) {
    setRejectId(r.id);
    setRejectReason("");
    setShowReject(true);
  }

  async function handleConfirmReject() {
    if (!rejectId || !rejectReason.trim()) return;
    setSaving(true);
    try {
      await rejectWfhReport(rejectId, { reason: rejectReason });
      setShowReject(false);
      setRejectId(null);
      showToast("Laporan ditolak.");
      loadReports();
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal menolak laporan."), "error");
    } finally {
      setSaving(false);
    }
  }

  /* ── Actions: tim ────────────────────────────────────────────── */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createTeamId) return;
    setSaving(true);
    setCreateMsg("");
    setCreateErr("");
    try {
      const res = await createTeamReport({
        team_id: Number(createTeamId),
        report_date: createDate,
      });
      setCreateMsg(res.message ?? "Laporan tim berhasil dibuat.");
      setShowCreate(false);
      loadTeamReports();
    } catch (e: unknown) {
      setCreateErr(extractWfhError(e, "Gagal membuat laporan tim."));
    } finally {
      setSaving(false);
    }
  }

  async function handleTApprove(id: number) {
    setSaving(true);
    try {
      await approveTeamReport(id);
      showToast("Laporan tim disetujui.");
      loadTeamReports();
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal menyetujui laporan."), "error");
    } finally {
      setSaving(false);
    }
  }

  function openTReject(id: number) {
    setTRejectId(id);
    setTRejectReason("");
    setShowTReject(true);
  }

  async function handleTConfirmReject() {
    if (!tRejectId || !tRejectReason.trim()) return;
    setSaving(true);
    try {
      await rejectTeamReport(tRejectId, { reason: tRejectReason });
      setShowTReject(false);
      setTRejectId(null);
      showToast("Laporan tim ditolak.");
      loadTeamReports();
    } catch (e: unknown) {
      showToast(extractWfhError(e, "Gagal menolak laporan."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function openTPdf(r: WfhTeamReport) {
    // report_date ISO UTC ("2026-07-30T17:00:00.000000Z") = 31 Juli WIB.
    // Kirim tanggal murni WIB supaya query data di PDF cocok.
    const iso = r.report_date;
    const tanggal = iso.includes("T") || iso.includes("Z")
      ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
      : iso.slice(0, 10);
    // Buka langsung di tab (tanpa blob) — auth header dipasang Service Worker.
    const params = new URLSearchParams({ date: tanggal });
    params.set("team_report_id", String(r.id));
    openPdfDirect(`/api/admin/wfh/teams/${r.team_id}/pdf?${params}`, (msg) => showToast(msg, "error"));
  }

  /* ── Derived ─────────────────────────────────────────────────── */
  type Row = WfhReport | (MonitoringUser & { _draft?: boolean });
  const PAGE_SIZE = 15;

  // Gabungan laporan (terkirim) + pegawai yang belum mengirim — satu list
  const rows = useMemo<Row[]>(() => {
    const q = search.trim().toLowerCase();
    const base: Row[] = [...reports, ...(statusFilter ? [] : missingUsers)];
    const scoped = teamId
      ? base.filter((x) => "status" in x || x.team_id === Number(teamId))
      : base;
    if (!q) return scoped;
    return scoped.filter((x) =>
      ("status" in x ? x.user?.name : x.name)?.toLowerCase().includes(q)
    );
  }, [reports, missingUsers, search, teamId, statusFilter]);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rowLastPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  // ── Tim rows (filter client-side, per_page 100) ───────────────
  const tRows = useMemo(() => {
    const q = tSearch.trim().toLowerCase();
    return teamReports.filter((r) => {
      if (tTeamId && r.team_id !== Number(tTeamId)) return false;
      if (tStatus && r.status !== tStatus) return false;
      if (tDate) {
        const iso = r.report_date;
        const tgl = iso.includes("T") || iso.includes("Z")
          ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
          : iso.slice(0, 10);
        if (tgl !== tDate) return false;
      }
      if (q && !`${r.team?.name ?? ""} ${r.creator?.name ?? ""}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [teamReports, tSearch, tTeamId, tStatus, tDate]);
  const tPageRows = tRows.slice((tPage - 1) * PAGE_SIZE, tPage * PAGE_SIZE);
  const tRowLastPage = Math.max(1, Math.ceil(tRows.length / PAGE_SIZE));

  function attendanceState(
    r: WfhReport,
    session: (typeof SESI)[number]
  ): boolean | null {
    const att = (r.attendances ?? []).find((a) => a.session === session);
    return att ? att.checked_in : null;
  }

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <AppLayout
      breadcrumbs={[
        { label: "Beranda" },
        { label: "Admin WFH" },
        { label: "Monitor WFH" },
      ]}
    >
      <PageTitle
        title="Monitoring WFH"
        subtitle="Pemantauan laporan dan absensi WFH pegawai"
      />

      {/* ── Tabs (gaya inisiasi) ────────────────────────────────── */}
      <div className="flex gap-3 mb-6">
        <TabButton
          active={tab === "individu"}
          onClick={() => setTab("individu")}
          icon={<UserIcon size={18} />}
        >
          Laporan Individu
        </TabButton>
        <TabButton
          active={tab === "tim"}
          onClick={() => setTab("tim")}
          icon={<UsersIcon size={18} />}
        >
          Laporan Tim
        </TabButton>
      </div>

      {tab === "individu" ? (
        /* ══════════════ TAB INDIVIDU ══════════════ */
        <>
          {/* Filters: satu dropdown + cari (pola Manajemen Pengguna) */}
          <div className="bg-white rounded-[10px] shadow-sm p-5 mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#767676]">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama pegawai..."
                className="w-full pl-9 pr-4 py-[10px] text-sm rounded-[10px] border border-[#C2C6D8] outline-none focus:border-[#256EEF] placeholder:text-[#767676]"
              />
            </div>
            <FilterDropdown badge={Number(!!teamId) + Number(!!statusFilter) + Number(date !== TODAY)}>
              <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-[#424655]">
                    Tim
                    <select
                      value={teamId}
                      onChange={(e) => {
                        setTeamId(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] outline-none focus:border-[#256EEF] text-[#424655] bg-white"
                    >
                      <option value="">Semua Tim</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
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
                      <option value="draft">Draf</option>
                      <option value="pending">Terkirim</option>
                      <option value="approved">Disetujui</option>
                      <option value="rejected">Ditolak</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-[#424655]">
                    Tanggal
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] outline-none focus:border-[#256EEF] text-[#424655]"
                    />
                  </label>
                </div>
            </FilterDropdown>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            {status === "loading" ? (
              <div className="p-5 flex flex-col gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 py-3 border-b border-[#F0F0F0] last:border-b-0"
                  >
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-6 w-6 rounded-full ml-auto" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-44" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : status === "error" ? (
              <div className="text-center py-12 text-sm text-red-500">
                {errMsg}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E0E9F2]">
                    <th className="text-left px-4 py-3 font-medium text-[#767676]">Pegawai</th>
                    <th className="text-center px-4 py-3 font-medium text-[#767676]">Pagi</th>
                    <th className="text-center px-4 py-3 font-medium text-[#767676]">Siang</th>
                    <th className="text-center px-4 py-3 font-medium text-[#767676]">Sore</th>
                    <th className="text-left px-4 py-3 font-medium text-[#767676]">
                      Status Laporan
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-[#767676]">Catatan</th>
                    <th className="text-right px-4 py-3 font-medium text-[#767676]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-sm text-[#767676]">
                        Tidak ada data pada tanggal ini.
                      </td>
                    </tr>
                  )}
                  {pageRows.map((x) => {
                    if (!("status" in x)) {
                      const u = x as MonitoringUser & { _draft?: boolean; _report?: WfhReport };
                      const draft = Boolean(u._draft);
                      return (
                        <tr
                          key={`missing-${u.id}`}
                          className="border-b border-[#F0F0F0] hover:bg-[#F9FAFB]"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="w-9 h-9 rounded-full bg-[#E0E9F2] text-[#256EEF] text-xs font-semibold flex items-center justify-center shrink-0">
                                {inisial(u.name)}
                              </span>
                              <div>
                                <div className="text-[#333] font-medium">
                                  {u.name}
                                </div>
                                <div className="text-xs text-[#767676]">
                                  {u.nip ?? ""}
                                </div>
                              </div>
                            </div>
                          </td>
                          {SESI.map((s) => (
                            <td key={s} className="px-4 py-3 text-center">
                              <CloseIcon />
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              {draft ? "Belum Dikirim" : "Belum Laporan"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#767676] text-xs">
                            {draft
                              ? u._report
                                ? catatanLaporan(u._report)
                                : "Belum dikirim"
                              : "Belum mengisi laporan"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[#D9D9D9] text-xs">—</span>
                          </td>
                        </tr>
                      );
                    }
                    const r = x;
                    const st = STATUS_LABEL[r.status] ?? {
                      label: r.status,
                      color: "bg-gray-100 text-gray-600",
                    };
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-[#F0F0F0] hover:bg-[#F9FAFB]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-[#256EEF] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                              {inisial(r.user?.name)}
                            </span>
                            <div>
                              <div className="text-[#333] font-medium">
                                {r.user?.name ?? "-"}
                              </div>
                              <div className="text-xs text-[#767676]">
                                {r.user?.nip ?? ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        {SESI.map((s) => (
                          <td key={s} className="px-4 py-3 text-center">
                            {attendanceState(r, s) === true ? (
                              <CheckIcon />
                            ) : (
                              <CloseIcon />
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${st.color}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#767676] text-xs">
                          {catatanLaporan(r)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {renderActions([
                            ...(canExportPdf
                              ? [
                                  {
                                    label: "Preview",
                                    icon: <EyeIcon size={16} />,
                                    onClick: () => openPdf(r),
                                  },
                                  {
                                    label: "Unduh PDF",
                                    icon: <DownloadIcon size={16} />,
                                    onClick: () => openPdf(r),
                                  },
                                ]
                              : []),
                            ...(r.status === "pending" && canApprove
                              ? [
                                  {
                                    label: "Setujui",
                                    icon: <ApproveIcon />,
                                    disabled: saving,
                                    onClick: () => handleApprove(r),
                                  },
                                ]
                              : []),
                            ...(r.status === "pending" && canReject
                              ? [
                                  {
                                    label: "Tolak",
                                    icon: <RejectIcon />,
                                    variant: "destructive" as const,
                                    disabled: saving,
                                    onClick: () => openReject(r),
                                  },
                                ]
                              : []),
                          ])}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {rows.length > PAGE_SIZE && (
              <div className="px-4 py-3 border-t border-[#E0E9F2]">
                <Pagination
                  currentPage={page}
                  lastPage={rowLastPage}
                  total={rows.length}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        /* ══════════════ TAB TIM ══════════════ */
        <>
          {/* Filters: cari + dropdown (sama seperti individu) */}
          <div className="bg-white rounded-[10px] shadow-sm p-5 mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#767676]">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                value={tSearch}
                onChange={(e) => setTSearch(e.target.value)}
                placeholder="Cari nama tim / pembuat..."
                className="w-full pl-9 pr-4 py-[10px] text-sm rounded-[10px] border border-[#C2C6D8] outline-none focus:border-[#256EEF] placeholder:text-[#767676]"
              />
            </div>
            <FilterDropdown badge={Number(!!tTeamId) + Number(!!tStatus) + Number(!!tDate)}>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-[#424655]">
                  Tim
                  <select
                    value={tTeamId}
                    onChange={(e) => setTTeamId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] outline-none focus:border-[#256EEF] text-[#424655] bg-white"
                  >
                    <option value="">Semua Tim</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-[#424655]">
                  Status Laporan
                  <select
                    value={tStatus}
                    onChange={(e) => setTStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] outline-none focus:border-[#256EEF] text-[#424655] bg-white"
                  >
                    <option value="">Semua Status</option>
                    <option value="draft">Draf</option>
                    <option value="pending">Terkirim</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-[#424655]">
                  Tanggal
                  <input
                    type="date"
                    value={tDate}
                    onChange={(e) => setTDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] outline-none focus:border-[#256EEF] text-[#424655]"
                  />
                </label>
              </div>
            </FilterDropdown>
          </div>

          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#767676]">{tRows.length} laporan</p>
            {hasPermission("wfh.team_report.create") && (
              <Button onClick={() => setShowCreate(true)}>
                + Buat Laporan Tim
              </Button>
            )}
          </div>

          <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E0E9F2]">
                  <th className="text-left px-4 py-3 font-medium text-[#333]">Tim</th>
                  <th className="text-left px-4 py-3 font-medium text-[#333]">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium text-[#333]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#333]">Pembuat</th>
                  <th className="text-right px-4 py-3 font-medium text-[#333]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-sm text-[#767676]">
                      {tSearch || tTeamId || tStatus || tDate
                        ? "Tidak ada laporan yang cocok."
                        : "Belum ada laporan tim."}
                    </td>
                  </tr>
                )}
                {tPageRows.map((r) => {
                  const st = STATUS_LABEL[r.status] ?? {
                    label: r.status,
                    color: "bg-gray-100 text-gray-600",
                  };
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-[#F0F0F0] hover:bg-[#F9FAFB]"
                    >
                      <td className="px-4 py-3 text-[#333]">{r.team.name}</td>
                      <td className="px-4 py-3 text-[#333]">{formatTanggalLengkap(r.report_date)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${st.color}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#767676]">
                        {r.creator.name}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {renderActions([
                          ...(canExportPdf
                            ? [
                                {
                                  label: "Preview",
                                  icon: <EyeIcon size={16} />,
                                  onClick: () => openTPdf(r),
                                },
                                {
                                  label: "Unduh PDF",
                                  icon: <DownloadIcon size={16} />,
                                  onClick: () => openTPdf(r),
                                },
                              ]
                            : []),
                          ...(r.status === "pending" && canTApprove
                            ? [
                                {
                                  label: "Setujui",
                                  icon: <ApproveIcon />,
                                  disabled: saving,
                                  onClick: () => handleTApprove(r.id),
                                },
                              ]
                            : []),
                          ...(r.status === "pending" && canTReject
                            ? [
                                {
                                  label: "Tolak",
                                  icon: <RejectIcon />,
                                  variant: "destructive" as const,
                                  disabled: saving,
                                  onClick: () => openTReject(r.id),
                                },
                              ]
                            : []),
                        ])}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {tRowLastPage > 1 && (
              <div className="px-4 py-3 border-t border-[#E0E9F2]">
                <Pagination
                  currentPage={tPage}
                  lastPage={tRowLastPage}
                  total={tRows.length}
                  onPageChange={setTPage}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Reject modal (individu) ──────────────────────────────── */}
      <Modal
        open={showReject}
        onClose={() => setShowReject(false)}
        title="Tolak Laporan"
      >
        <div className="flex flex-col gap-4 p-4">
          <TextArea
            label="Alasan penolakan"
            value={rejectReason}
            onChange={setRejectReason}
            placeholder="Masukkan alasan..."
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowReject(false)}>
              Batal
            </Button>
            <Button
              variant="outline"
              className="!text-red-500 !border-red-300 hover:!bg-red-50"
              onClick={handleConfirmReject}
              disabled={saving || !rejectReason.trim()}
            >
              {saving ? "Menyimpan..." : "Tolak"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Create modal (tim) ───────────────────────────────────── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Buat Laporan Tim"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#767676]">Tim</label>
            <select
              value={createTeamId}
              onChange={(e) => setCreateTeamId(e.target.value)}
              className="border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm bg-white"
              required
            >
              <option value="">Pilih tim</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#767676]">Tanggal</label>
            <input
              type="date"
              value={createDate}
              onChange={(e) => setCreateDate(e.target.value)}
              className="border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          {createMsg && <p className="text-green-600 text-xs">{createMsg}</p>}
          {createErr && <p className="text-red-500 text-xs">{createErr}</p>}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreate(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving || !createTeamId}>
              {saving ? "Menyimpan..." : "Buat"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Reject modal (tim) ───────────────────────────────────── */}
      <Modal
        open={showTReject}
        onClose={() => setShowTReject(false)}
        title="Tolak Laporan Tim"
      >
        <div className="flex flex-col gap-4 p-4">
          <TextArea
            label="Alasan penolakan"
            value={tRejectReason}
            onChange={setTRejectReason}
            placeholder="Masukkan alasan..."
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowTReject(false)}>
              Batal
            </Button>
            <Button
              variant="outline"
              className="!text-red-500 !border-red-300 hover:!bg-red-50"
              onClick={handleTConfirmReject}
              disabled={saving || !tRejectReason.trim()}
            >
              {saving ? "Menyimpan..." : "Tolak"}
            </Button>
          </div>
        </div>
      </Modal>

      <Toast
        open={toastOpen}
        type={toastType}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </AppLayout>
  );
}

/* ── Helpers & icons ──────────────────────────────────────────── */

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl border transition-colors ${
        active
          ? "bg-[#141D23] text-white border-[#141D23]"
          : "bg-white text-[#424655] border-[#C2C6D8] hover:bg-gray-50"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function UserIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 17c1-3 3.5-4.5 6.5-4.5s5.5 1.5 6.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="7.5" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 17c.8-2.6 2.8-4 5-4s4.2 1.4 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.5 4.5a2.5 2.5 0 110 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 13.5c1.7.5 2.8 1.8 3.2 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function inisial(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}


/* ── Render aksi: selalu dropdown (seragam, walau cuma 1 aksi) ── */
interface RowAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
}

function renderActions(acts: RowAction[]) {
  if (acts.length === 0) {
    return <span className="text-[#D9D9D9] text-xs">—</span>;
  }
  return (
    <DropdownMenu
      align="end"
      trigger={
        <button
          type="button"
          aria-label="Aksi"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[#424655] hover:bg-[#F6FAFF]"
        >
          <MoreVerticalIcon size={18} />
        </button>
      }
      items={acts.map((a) => ({
        label: a.label,
        icon: a.icon,
        disabled: a.disabled,
        variant: a.variant,
        onClick: a.onClick,
      }))}
    />
  );
}

function ApproveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-label="Setujui">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RejectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-label="Tolak">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="inline-block"
      aria-label="Hadir"
    >
      <circle cx="8" cy="8" r="7" fill="#E8F7EE" />
      <path
        d="M5 8.2l2 2 4-4.4"
        stroke="#16A34A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="inline-block"
      aria-label="Tidak hadir"
    >
      <circle cx="8" cy="8" r="7" fill="#FDECEC" />
      <path
        d="M5.5 5.5l5 5M10.5 5.5l-5 5"
        stroke="#DC2626"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}


