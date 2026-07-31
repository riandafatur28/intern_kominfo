import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import TextArea from "../../components/ui/TextArea";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
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

type PageStatus = "loading" | "ready" | "error";
type Tab = "individu" | "tim";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "Belum Dikirim", color: "bg-gray-100 text-gray-600" },
  pending: { label: "Terkirim", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Disetujui", color: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-700" },
};

const SESI = ["pagi", "siang", "sore"] as const;

export default function WfhMonitoring() {
  const { user, hasPermission } = useAuth();

  /* ── Tabs & shared ───────────────────────────────────────────── */
  const [tab, setTab] = useState<Tab>("individu");
  const [teams, setTeams] = useState<Team[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  /* ── Individu filters ────────────────────────────────────────── */
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
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
  const [tLastPage, setTLastPage] = useState(1);
  const [tTotal, setTTotal] = useState(0);

  /* ── Individu reject ─────────────────────────────────────────── */
  const [showReject, setShowReject] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [saving, setSaving] = useState(false);

  /* ── Tim create ──────────────────────────────────────────────── */
  const [showCreate, setShowCreate] = useState(false);
  const [createTeamId, setCreateTeamId] = useState("");
  const [createDate, setCreateDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
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
            }) as MonitoringUser & { _draft?: boolean }
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
      const res = await listTeamReports({ per_page: 15 });
      // BE returns raw paginator {data,current_page,last_page,total} without meta envelope
      const raw = (res as any).meta ?? res;
      setTeamReports(raw.data ?? []);
      setTPage(raw.current_page ?? 1);
      setTLastPage(raw.last_page ?? 1);
      setTTotal(raw.total ?? 0);
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
  }, [tab, tPage]);

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

  function attendanceState(
    r: WfhReport,
    session: (typeof SESI)[number]
  ): boolean | null {
    const att = (r.attendances ?? []).find((a) => a.session === session);
    return att ? att.checked_in : null;
  }

  function catatanLaporan(r: WfhReport): string {
    if (r.status === "rejected" && r.reject_reason) return r.reject_reason;
    if (r.status === "draft") return "Belum dikirim";
    const missing = SESI.filter((s) => attendanceState(r, s) === false);
    const nAtt = (r.attendances ?? []).length;
    if (nAtt === 0) return "Tidak ada absensi";
    if (missing.length === 0) return "Lengkap";
    const names = { pagi: "Pagi", siang: "Siang", sore: "Sore" };
    return `Tidak absen ${missing.map((s) => names[s]).join(", ")}`;
  }

  const canApprove = hasPermission("wfh.report.approve");

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

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#E0E9F2] mb-6">
        {(
          [
            ["individu", "Laporan Individu"],
            ["tim", "Laporan Tim"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              tab === key
                ? "text-[#256EEF] border-b-2 border-[#256EEF]"
                : "text-[#767676] hover:text-[#333]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "individu" ? (
        /* ══════════════ TAB INDIVIDU ══════════════ */
        <>
          {/* Filters */}
          <div className="bg-white rounded-[10px] shadow-sm p-5 mb-6 flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#767676]">Tim</label>
              <select
                value={teamId}
                onChange={(e) => {
                  setTeamId(e.target.value);
                  setPage(1);
                }}
                className="border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm bg-white min-w-[160px]"
              >
                <option value="">Semua Tim</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#767676]">
                Status Laporan
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">Semua Status</option>
                <option value="draft">Draf</option>
                <option value="pending">Terkirim</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#767676]">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#767676]">
                Cari Pegawai
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama pegawai..."
                className="border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm min-w-[200px]"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={loadReports}>
                Perbarui
              </Button>
              <Button
                onClick={() => {
                  setTeamId("");
                  setStatusFilter("");
                  setSearch("");
                  setDate(new Date().toISOString().slice(0, 10));
                  setPage(1);
                }}
              >
                Lihat Semua
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            {status === "loading" ? (
              <div className="text-center py-12 text-sm text-[#767676]">
                Memuat...
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
                      const u = x as MonitoringUser & { _draft?: boolean };
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
                            {draft ? "Belum dikirim" : "Belum mengisi laporan"}
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              className="text-[#256EEF] hover:underline text-xs inline-flex items-center gap-1"
                              onClick={() => openPdf(r)}
                            >
                              <EyeIcon /> Preview
                            </button>
                            <button
                              className="text-[#256EEF] hover:underline text-xs inline-flex items-center gap-1"
                              onClick={() => openPdf(r)}
                            >
                              Unduh PDF
                            </button>
                            {r.status === "pending" && canApprove && (
                              <>
                                <button
                                  className="text-green-600 hover:underline text-xs"
                                  onClick={() => handleApprove(r)}
                                  disabled={saving}
                                >
                                  Setujui
                                </button>
                                <button
                                  className="text-red-500 hover:underline text-xs"
                                  onClick={() => openReject(r)}
                                  disabled={saving}
                                >
                                  Tolak
                                </button>
                              </>
                            )}
                          </div>
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
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#767676]">{tTotal} laporan</p>
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
                {teamReports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-sm text-[#767676]">
                      Belum ada laporan tim.
                    </td>
                  </tr>
                )}
                {teamReports.map((r) => {
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="text-[#256EEF] hover:underline text-xs inline-flex items-center gap-1"
                            onClick={() => openTPdf(r)}
                          >
                            <EyeIcon /> Preview
                          </button>
                          <button
                            className="text-[#256EEF] hover:underline text-xs inline-flex items-center gap-1"
                            onClick={() => openTPdf(r)}
                          >
                            Unduh PDF
                          </button>
                          {r.status === "pending" &&
                            hasPermission("wfh.team_report.approve") && (
                              <>
                                <button
                                  className="text-green-600 hover:underline text-xs"
                                  onClick={() => handleTApprove(r.id)}
                                  disabled={saving}
                                >
                                  Setujui
                                </button>
                                <button
                                  className="text-red-500 hover:underline text-xs"
                                  onClick={() => openTReject(r.id)}
                                  disabled={saving}
                                >
                                  Tolak
                                </button>
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {tLastPage > 1 && (
              <div className="px-4 py-3 border-t border-[#E0E9F2]">
                <Pagination
                  currentPage={tPage}
                  lastPage={tLastPage}
                  total={tTotal}
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

function inisial(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
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

function EyeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
