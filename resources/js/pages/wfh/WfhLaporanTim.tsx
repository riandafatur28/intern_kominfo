import { useEffect, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import TextArea from "../../components/ui/TextArea";
import Pagination from "../../components/ui/Pagination";
import { useAuth } from "../../hooks/useAuth";
import {
  listTeamReports,
  createTeamReport,
  approveTeamReport,
  rejectTeamReport,
  getTeamReportPdfUrl,
  type WfhTeamReport,
  extractWfhError,
} from "../../api/wfh";

type PageStatus = "loading" | "ready" | "error";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700" },
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Disetujui", color: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-700" },
};

export default function WfhLaporanTim() {
  const { user } = useAuth();

  /* ── List state ──────────────────────────────────────────────── */
  const [status, setStatus] = useState<PageStatus>("loading");
  const [errMsg, setErrMsg] = useState("");
  const [reports, setReports] = useState<WfhTeamReport[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  /* ── Create state ────────────────────────────────────────────── */
  const [showCreate, setShowCreate] = useState(false);
  const [createTeamId, setCreateTeamId] = useState("");
  const [createDate, setCreateDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [createErr, setCreateErr] = useState("");

  /* ── Reject state ────────────────────────────────────────────── */
  const [showReject, setShowReject] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadReports();
  }, [page]);

  async function loadReports() {
    setStatus("loading");
    setErrMsg("");
    try {
      const res = await listTeamReports({ per_page: 15 });
      setReports(res.data);
      setPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
      setTotal(res.meta.total);
      setStatus("ready");
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal memuat laporan tim."));
      setStatus("error");
    }
  }

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
      loadReports();
    } catch (e: unknown) {
      setCreateErr(extractWfhError(e, "Gagal membuat laporan tim."));
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(id: number) {
    setSaving(true);
    setErrMsg("");
    try {
      await approveTeamReport(id);
      loadReports();
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal menyetujui laporan."));
    } finally {
      setSaving(false);
    }
  }

  function openReject(id: number) {
    setRejectId(id);
    setRejectReason("");
    setShowReject(true);
  }

  async function handleConfirmReject() {
    if (!rejectId || !rejectReason.trim()) return;
    setSaving(true);
    try {
      await rejectTeamReport(rejectId, { reason: rejectReason });
      setShowReject(false);
      setRejectId(null);
      loadReports();
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal menolak laporan."));
    } finally {
      setSaving(false);
    }
  }

  function openPdf(report: WfhTeamReport) {
    const url = getTeamReportPdfUrl(
      report.team_id,
      report.report_date,
      report.id
    );
    window.open(url, "_blank");
  }

  if (status === "loading" && reports.length === 0) {
    return (
      <AppLayout breadcrumbs={[{ label: "Laporan Tim" }]}>
        <div className="text-center py-12 text-sm text-[#767676]">Memuat...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: "WFH" }, { label: "Laporan Tim" }]}>
      <div className="flex items-center justify-between">
        <PageTitle title="Laporan Tim" subtitle={`${total} laporan`} />
        <Button onClick={() => setShowCreate(true)}>
          + Buat Laporan Tim
        </Button>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
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
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-sm text-[#767676]">
                  Belum ada laporan tim.
                </td>
              </tr>
            )}
            {reports.map((r) => {
              const st = STATUS_LABEL[r.status] ?? {
                label: r.status,
                color: "bg-gray-100 text-gray-700",
              };
              return (
                <tr key={r.id} className="border-b border-[#F0F0F0] hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3 text-[#333]">{r.team.name}</td>
                  <td className="px-4 py-3 text-[#333]">{r.report_date}</td>
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
                        className="text-[#256EEF] hover:underline text-xs"
                        onClick={() => openPdf(r)}
                      >
                        PDF
                      </button>
                      {r.status === "pending" && (
                        <>
                          <button
                            className="text-green-600 hover:underline text-xs"
                            onClick={() => handleApprove(r.id)}
                            disabled={saving}
                          >
                            Setujui
                          </button>
                          <button
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => openReject(r.id)}
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

        {lastPage > 1 && (
          <div className="px-4 py-3 border-t border-[#E0E9F2]">
            <Pagination
              currentPage={page}
              lastPage={lastPage}
              total={total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* ── Create Modal ────────────────────────────────────────── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Buat Laporan Tim"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#767676]">
              ID Tim
            </label>
            <input
              type="number"
              value={createTeamId}
              onChange={(e) => setCreateTeamId(e.target.value)}
              className="border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm"
              placeholder="Masukkan ID tim"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#767676]">
              Tanggal
            </label>
            <input
              type="date"
              value={createDate}
              onChange={(e) => setCreateDate(e.target.value)}
              className="border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          {createMsg && (
            <p className="text-green-600 text-xs">{createMsg}</p>
          )}
          {createErr && (
            <p className="text-red-500 text-xs">{createErr}</p>
          )}
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

      {/* ── Reject Modal ────────────────────────────────────────── */}
      <Modal
        open={showReject}
        onClose={() => setShowReject(false)}
        title="Tolak Laporan Tim"
      >
        <div className="flex flex-col gap-4 p-4">
          <TextArea
            label="Alasan penolakan"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Masukkan alasan..."
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowReject(false)}
            >
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

      {/* ── Error ───────────────────────────────────────────────── */}
      {errMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {errMsg}
        </div>
      )}
    </AppLayout>
  );
}
