import { useCallback, useEffect, useState, type FormEvent } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import FormField from "../../components/ui/FormField";
import TextArea from "../../components/ui/TextArea";
import Pagination from "../../components/ui/Pagination";
import { useAuth } from "../../hooks/useAuth";
import {
  listWfhReports,
  createWfhReport,
  getWfhReport,
  updateWfhReport,
  deleteWfhReport,
  submitWfhReport,
  approveWfhReport,
  rejectWfhReport,
  reviseWfhReport,
  createReportActivity,
  updateReportActivity,
  deleteReportActivity,
  type WfhReport,
  extractWfhError,
} from "../../api/wfh";
import { openPdfDirect } from "../../utils/swAuth";
import { formatTanggalLengkap } from "../../utils/userDisplay";


type PageStatus = "loading" | "ready" | "error";
type FormMode = "create" | "edit" | "detail" | null;

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700" },
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Disetujui", color: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-700" },
};

/* ISO datetime dari API ("2026-07-31T04:00:00.000000Z") → "HH:MM" untuk <input type="time"> */
function toTimeInput(iso: string): string {
  const norm = iso.length > 23 ? iso.slice(0, 23) + "Z" : iso;
  const d = new Date(norm);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 5);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function WfhLaporan() {
  const { hasPermission } = useAuth();

  /* ── List state ──────────────────────────────────────────────── */
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [errMsg, setErrMsg] = useState("");
  const [reports, setReports] = useState<WfhReport[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  // Filter server-side (BE tanpa param = semua laporan)
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));

  /* ── Form / detail state ─────────────────────────────────────── */
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedReport, setSelectedReport] = useState<WfhReport | null>(null);
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [formErr, setFormErr] = useState("");

  /* ── Create / Edit fields ────────────────────────────────────── */
  const [reportDate, setReportDate] = useState("");
  const [activities, setActivities] = useState<
    { id?: number; start_time: string; end_time: string; activity: string; links: string[] }[]
  >([]);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);

  /* ── Load list ───────────────────────────────────────────────── */
  const loadReports = useCallback(async () => {
    setPageStatus("loading");
    setErrMsg("");
    try {
      const res = await listWfhReports({
        per_page: 15,
        date: dateFilter || undefined,
      });
      setReports(res.data);
      setPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
      setTotal(res.meta.total);
      setPageStatus("ready");
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal memuat laporan."));
      setPageStatus("error");
    }
  }, [dateFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports, page, dateFilter]);

  /* ── Create new ──────────────────────────────────────────────── */
  function handleCreate() {
    setFormMode("create");
    setSelectedReport(null);
    setReportDate(new Date().toISOString().slice(0, 10));
    setActivities([{ start_time: "", end_time: "", activity: "", links: [] }]);
    setFormMsg("");
    setFormErr("");
  }

  /* ── View detail ─────────────────────────────────────────────── */
  async function handleView(id: number) {
    setPageStatus("loading");
    setFormMsg("");
    setFormErr("");
    try {
      const res = await getWfhReport(id);
      setSelectedReport(res.data);
      setFormMode("detail");
      setPageStatus("ready");
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal memuat detail laporan."));
      setPageStatus("error");
    }
  }

  /* ── Edit ────────────────────────────────────────────────────── */
  function handleEdit(report: WfhReport) {
    setSelectedReport(report);
    setReportDate(report.report_date);
    setActivities(
      report.activities.map((a) => ({
        id: a.id,
        start_time: toTimeInput(a.start_time),
        end_time: toTimeInput(a.end_time),
        activity: a.activity,
        links: a.links.map((l) => l.url),
      }))
    );
    setFormMode("edit");
    setFormMsg("");
    setFormErr("");
  }

  /* ── Submit form (create / update) ───────────────────────────── */
  async function handleSubmitForm(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormMsg("");
    setFormErr("");
    try {
      if (formMode === "create") {
        // Backend mengabaikan activities embedded di POST /wfh/reports
        // (v6.0.0 sub-resource) → buat report dulu, append via sub-resource
        const res = await createWfhReport({
          report_date: reportDate,
          status: "draft",
        });
        const rid = res.data.id;
        for (const a of activities) {
          if (!a.activity.trim()) continue;
          await createReportActivity(rid, {
            start_time: a.start_time,
            end_time: a.end_time,
            activity: a.activity.trim(),
            links: a.links.filter(Boolean).map((url) => ({ url })),
          });
        }
        setFormMsg(res.message);
      } else if (formMode === "edit" && selectedReport) {
        const rid = selectedReport.id;
        await updateWfhReport(rid, { report_date: reportDate });
        // Sub-resource diff: hapus yang dihilangkan, update yang punya id,
        // create yang baru (baris tanpa id)
        const keep = new Set(
          activities.map((a) => a.id).filter((id): id is number => id != null)
        );
        for (const orig of selectedReport.activities) {
          if (!keep.has(orig.id)) {
            await deleteReportActivity(rid, orig.id);
          }
        }
        for (const a of activities) {
          const payload = {
            start_time: a.start_time,
            end_time: a.end_time,
            activity: a.activity,
            links: a.links.filter(Boolean).map((url) => ({ url })),
          };
          if (a.id) {
            await updateReportActivity(rid, a.id, payload);
          } else if (a.activity.trim()) {
            await createReportActivity(rid, payload);
          }
        }
        setFormMsg("Laporan berhasil disimpan.");
      }
      setFormMode(null);
      loadReports();
    } catch (e: unknown) {
      setFormErr(extractWfhError(e, "Gagal menyimpan laporan."));
    } finally {
      setSaving(false);
    }
  }

  /* ── Actions ─────────────────────────────────────────────────── */
  async function handleSubmit(reportId: number) {
    setSaving(true);
    try {
      await submitWfhReport(reportId);
      loadReports();
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal mengirim laporan."));
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(reportId: number) {
    setSaving(true);
    try {
      await approveWfhReport(reportId);
      loadReports();
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal menyetujui laporan."));
    } finally {
      setSaving(false);
    }
  }

  function openRejectModal(reportId: number) {
    setRejectTargetId(reportId);
    setRejectReason("");
    setShowRejectModal(true);
  }

  async function handleConfirmReject() {
    if (!rejectTargetId || !rejectReason.trim()) return;
    setSaving(true);
    try {
      await rejectWfhReport(rejectTargetId, { reason: rejectReason });
      setShowRejectModal(false);
      setRejectTargetId(null);
      loadReports();
    } catch (e: unknown) {
      setFormErr(extractWfhError(e, "Gagal menolak laporan."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRevise(reportId: number) {
    setSaving(true);
    try {
      await reviseWfhReport(reportId);
      loadReports();
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal merevisi laporan."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(reportId: number) {
    if (!confirm("Hapus laporan ini?")) return;
    setSaving(true);
    try {
      await deleteWfhReport(reportId);
      loadReports();
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal menghapus laporan."));
    } finally {
      setSaving(false);
    }
  }

  async function openPdf(report: WfhReport) {
    // Per spec: PDF resmi tersedia mulai status pending; draft/rejected belum sah
    if (report.status === "draft" || report.status === "rejected") {
      setErrMsg("PDF bukti kerja tersedia setelah laporan disubmit.");
      return;
    }
    // Buka langsung di tab (tanpa blob) — auth header dipasang Service Worker.
    openPdfDirect(`/api/wfh/reports/${report.id}/pdf`, (msg) => setErrMsg(msg));
  }

  /* ── Activity helpers ────────────────────────────────────────── */
  function addActivityRow() {
    setActivities((prev) => [
      ...prev,
      { start_time: "", end_time: "", activity: "", links: [] },
    ]);
  }

  function removeActivityRow(idx: number) {
    setActivities((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateActivityField(
    idx: number,
    field: string,
    value: string
  ) {
    setActivities((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a))
    );
  }

  function updateActivityLinks(idx: number, val: string) {
    const urls = val
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    setActivities((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, links: urls } : a))
    );
  }

  /* ── Render ──────────────────────────────────────────────────── */
  if (pageStatus === "loading" && reports.length === 0) {
    return (
      <AppLayout breadcrumbs={[{ label: "Beranda", href: "/" }, { label: "Laporan WFH" }]}>
        <div className="text-center py-12 text-sm text-[#767676]">Memuat...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Beranda", href: "/" },
        { label: formMode === "detail" ? "Detail Laporan" : "Laporan WFH" },
      ]}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle title="Laporan WFH" subtitle={`${total} laporan`} />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] outline-none focus:border-[#256EEF] text-[#424655] bg-white"
          />
          <Button onClick={handleCreate}>+ Buat Laporan Baru</Button>
        </div>
      </div>

      {/* ── Create/Edit form ────────────────────────────────────── */}
      {(formMode === "create" || formMode === "edit") && (
        <div className="bg-white rounded-[10px] shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            {formMode === "create" ? "Buat Laporan Baru" : "Edit Laporan"}
          </h2>

          <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
            <FormField label="Tanggal" error={formErr}>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm"
                required
              />
            </FormField>

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-[#333]">Kegiatan</h3>

              {activities.map((act, i) => (
                <div key={i} className="border border-[#E0E9F2] rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#767676]">
                      Kegiatan #{i + 1}
                    </span>
                    {activities.length > 1 && (
                      <button
                        type="button"
                        className="text-red-500 text-xs hover:underline"
                        onClick={() => removeActivityRow(i)}
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Mulai">
                      <input
                        type="time"
                        value={act.start_time}
                        onChange={(e) =>
                          updateActivityField(i, "start_time", e.target.value)
                        }
                        className="w-full border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm"
                        required
                      />
                    </FormField>
                    <FormField label="Selesai">
                      <input
                        type="time"
                        value={act.end_time}
                        onChange={(e) =>
                          updateActivityField(i, "end_time", e.target.value)
                        }
                        className="w-full border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm"
                        required
                      />
                    </FormField>
                  </div>
                  <FormField label="Kegiatan">
                    <textarea
                      value={act.activity}
                      onChange={(e) =>
                        updateActivityField(i, "activity", e.target.value)
                      }
                      className="w-full border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm"
                      rows={2}
                      required
                    />
                  </FormField>
                  <FormField label="Link (1 baris per link)">
                    <textarea
                      value={act.links.join("\n")}
                      onChange={(e) => updateActivityLinks(i, e.target.value)}
                      className="w-full border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm"
                      rows={2}
                      placeholder="https://..."
                    />
                  </FormField>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addActivityRow}>
                + Tambah Kegiatan
              </Button>
            </div>

            {formMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                {formMsg}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormMode(null)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Detail view ─────────────────────────────────────────── */}
      {formMode === "detail" && selectedReport && (
        <DetailView
          report={selectedReport}
          onBack={() => {
            setFormMode(null);
            loadReports();
          }}
          onEdit={handleEdit}
          hasPermission={hasPermission}
          onApprove={handleApprove}
          onReject={(id) => openRejectModal(id)}
          onRevise={handleRevise}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
          onPdf={openPdf}
        />
      )}

      {/* ── Report list ─────────────────────────────────────────── */}
      {!formMode && (
        <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E0E9F2]">
                <th className="text-left px-4 py-3 font-medium text-[#333]">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-[#333]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[#333]">Kegiatan</th>
                <th className="text-right px-4 py-3 font-medium text-[#333]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-sm text-[#767676]">
                    Belum ada laporan.
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
                    <td className="px-4 py-3 text-[#333]">{formatTanggalLengkap(r.report_date)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${st.color}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#767676]">
                      {r.activity_count} kegiatan
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="text-[#256EEF] hover:underline text-xs"
                          onClick={() => handleView(r.id)}
                        >
                          Detail
                        </button>
                        {(r.status === "draft" || r.status === "rejected") && (
                          <button
                            className="text-[#256EEF] hover:underline text-xs"
                            onClick={() => handleEdit(r)}
                          >
                            Edit
                          </button>
                        )}
                        {r.status === "draft" && (
                          <button
                            className="text-[#256EEF] hover:underline text-xs"
                            onClick={() => handleSubmit(r.id)}
                            disabled={saving}
                          >
                            Kirim
                          </button>
                        )}
                        {r.status === "pending" && hasPermission("wfh.report.approve") && (
                          <button
                            className="text-green-600 hover:underline text-xs"
                            onClick={() => handleApprove(r.id)}
                            disabled={saving}
                          >
                            Setujui
                          </button>
                        )}
                        {r.status === "pending" && hasPermission("wfh.report.reject") && (
                          <button
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => openRejectModal(r.id)}
                            disabled={saving}
                          >
                            Tolak
                          </button>
                        )}
                        {r.status === "rejected" && (
                          <button
                            className="text-[#256EEF] hover:underline text-xs"
                            onClick={() => handleRevise(r.id)}
                            disabled={saving}
                          >
                            Revisi
                          </button>
                        )}
                        <button
                          className="text-[#256EEF] hover:underline text-xs"
                          onClick={() => openPdf(r)}
                        >
                          PDF
                        </button>
                        {r.status === "draft" && (
                          <button
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(r.id)}
                            disabled={saving}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

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
      )}

      {/* ── Reject Modal ────────────────────────────────────────── */}
      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
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
          {formErr && (
            <p className="text-red-500 text-xs">{formErr}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
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

      {/* ── Error message ───────────────────────────────────────── */}
      {errMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {errMsg}
        </div>
      )}
    </AppLayout>
  );
}

/* ── Detail View sub-component ──────────────────────────────────── */
function DetailView({
  report,
  onBack,
  onEdit,
  hasPermission,
  onApprove,
  onReject,
  onRevise,
  onDelete,
  onSubmit,
  onPdf,
}: {
  report: WfhReport;
  onBack: () => void;
  onEdit: (r: WfhReport) => void;
  hasPermission: (perm: string) => boolean;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onRevise: (id: number) => void;
  onDelete: (id: number) => void;
  onSubmit: (id: number) => void;
  onPdf: (report: WfhReport) => void;
}) {
  const st = STATUS_LABEL[report.status] ?? {
    label: report.status,
    color: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="bg-white rounded-[10px] shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Detail Laporan</h2>
        <button className="text-[#256EEF] text-sm hover:underline" onClick={onBack}>
          &larr; Kembali
        </button>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <span className="text-[#767676]">Tanggal:</span>{" "}
          <span className="font-medium">{formatTanggalLengkap(report.report_date)}</span>
        </div>
        <div>
          <span className="text-[#767676]">Status:</span>{" "}
          <span
            className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${st.color}`}
          >
            {st.label}
          </span>
        </div>
        <div>
          <span className="text-[#767676]">Pembuat:</span>{" "}
          <span className="font-medium">{report.user.name}</span>
        </div>
        {report.supervisor && (
          <div>
            <span className="text-[#767676]">Atasan:</span>{" "}
            <span className="font-medium">{report.supervisor.name}</span>
          </div>
        )}
        {report.reject_reason && (
          <div className="col-span-2">
            <span className="text-[#767676]">Alasan ditolak:</span>{" "}
            <span className="text-red-600">{report.reject_reason}</span>
          </div>
        )}
      </div>

      {/* Activities */}
      <h3 className="text-sm font-medium text-[#333] mb-3">
        Kegiatan ({report.activities.length})
      </h3>
      <div className="flex flex-col gap-3">
        {report.activities.map((act) => (
          <div
            key={act.id}
            className="border border-[#E0E9F2] rounded-lg p-4"
          >
            <div className="text-xs text-[#767676] mb-1">
              {toTimeInput(act.start_time).replace(":", ".")} – {toTimeInput(act.end_time).replace(":", ".")}
            </div>
            <p className="text-sm text-[#333]">{act.activity}</p>
            {act.links.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {act.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#256EEF] hover:underline"
                  >
                    {link.url}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button
          className="text-[#256EEF] hover:underline text-sm"
          onClick={() => onPdf(report)}
        >
          PDF
        </button>
        {(report.status === "draft" || report.status === "rejected") && (
          <button
            className="text-[#256EEF] hover:underline text-sm"
            onClick={() => onEdit(report)}
          >
            Edit
          </button>
        )}
        {report.status === "draft" && (
          <button
            className="text-[#256EEF] hover:underline text-sm"
            onClick={() => onSubmit(report.id)}
          >
            Kirim
          </button>
        )}
        {report.status === "pending" && hasPermission("wfh.report.approve") && (
          <button
            className="text-green-600 hover:underline text-sm"
            onClick={() => onApprove(report.id)}
          >
            Setujui
          </button>
        )}
        {report.status === "pending" && hasPermission("wfh.report.reject") && (
          <button
            className="text-red-500 hover:underline text-sm"
            onClick={() => onReject(report.id)}
          >
            Tolak
          </button>
        )}
        {report.status === "rejected" && (
          <button
            className="text-[#256EEF] hover:underline text-sm"
            onClick={() => onRevise(report.id)}
          >
            Revisi
          </button>
        )}
        {report.status === "draft" && (
          <button
            className="text-red-500 hover:underline text-sm"
            onClick={() => onDelete(report.id)}
          >
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}
