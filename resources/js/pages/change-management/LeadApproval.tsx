import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import Button from "../../components/ui/Button";
import PackageDetailView from "./components/PackageDetailView";
import { useAuth } from "../../hooks/useAuth";
import {
  listChangePackages,
  getChangePackage,
  approveChangePackage,
  rejectChangePackage,
  getChangeInitiationPdfUrl,
  getChangeImplementationPdfUrl,
  type ChangePackage,
  extractChangeError,
} from "../../api/changeManagement";
import { statusBadge, changeClassLabel } from "./shared";
import { formatTanggalLengkap } from "../../utils/userDisplay";
import { openPdfDirect } from "../../utils/swAuth";

type View = "queue" | "history";

function formatSlash(iso: string | null | undefined): string {
  if (!iso) return "-";
  const m = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

function EyeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LeadApproval() {
  const { user, hasPermission } = useAuth();
  const [view, setView] = useState<View>("queue");

  /* ── Queue ───────────────────────────────────────────────────── */
  const [queue, setQueue] = useState<ChangePackage[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueSelected, setQueueSelected] = useState<ChangePackage | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [saving, setSaving] = useState(false);

  /* ── History ─────────────────────────────────────────────────── */
  const [history, setHistory] = useState<ChangePackage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historySelected, setHistorySelected] = useState<ChangePackage | null>(null);

  async function loadQueue() {
    setQueueLoading(true);
    setErrMsg("");
    try {
      const res = await listChangePackages({ status: "pending", per_page: 100 });
      setQueue(res.data);
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal memuat antrian persetujuan."));
    } finally {
      setQueueLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    setErrMsg("");
    try {
      const [approved, rejected] = await Promise.all([
        listChangePackages({ status: "approved", per_page: 100 }),
        listChangePackages({ status: "rejected", per_page: 100 }),
      ]);
      const merged = [...approved.data, ...rejected.data].filter(
        (p) => p.initiation.reviewer_id === user?.id
      );
      merged.sort((a, b) => (a.initiation.reviewed_at! < b.initiation.reviewed_at! ? 1 : -1));
      setHistory(merged);
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal memuat riwayat persetujuan."));
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view === "history") loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const historyCounts = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    for (const p of history) {
      if (p.initiation.status === "approved") approved++;
      else if (p.initiation.status === "rejected") rejected++;
    }
    return { approved, rejected };
  }, [history]);

  async function handleViewDetail(id: number) {
    setErrMsg("");
    setSaving(true);
    try {
      const res = await getChangePackage(id);
      setQueueSelected(res.data);
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal memuat detail permohonan."));
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(pkg: ChangePackage) {
    setSaving(true);
    setErrMsg("");
    try {
      await approveChangePackage(pkg.initiation.id);
      setQueueSelected(null);
      await loadQueue();
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal menyetujui permohonan."));
    } finally {
      setSaving(false);
    }
  }

  async function handleReject(pkg: ChangePackage) {
    setSaving(true);
    setErrMsg("");
    try {
      await rejectChangePackage(pkg.initiation.id);
      setQueueSelected(null);
      await loadQueue();
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal menolak permohonan."));
    } finally {
      setSaving(false);
    }
  }

  async function handleViewHistory(id: number) {
    setErrMsg("");
    try {
      const res = await getChangePackage(id);
      setHistorySelected(res.data);
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal memuat detail permohonan."));
    }
  }

  const canDecide = hasPermission("change.initiation.approve") || hasPermission("change.initiation.reject");

  /* ── Detail Riwayat (tidak diubah) ───────────────────────────── */
  if (historySelected) {
    return (
      <AppLayout breadcrumbs={[{ label: "Beranda" }, { label: "Team Lead" }, { label: "Detail Permohonan" }]}>
        <div className="flex items-center justify-between">
          <PageTitle title={historySelected.initiation.doc_number} subtitle={historySelected.initiation.initiator?.name} />
          <button className="text-[#256EEF] text-sm hover:underline" onClick={() => setHistorySelected(null)}>
            &larr; Kembali ke Riwayat
          </button>
        </div>
        {errMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{errMsg}</div>
        )}
        <PackageDetailView pkg={historySelected} />
        {historySelected.initiation.status === "approved" && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => openPdfDirect(getChangeInitiationPdfUrl(historySelected.initiation.id), setErrMsg)}
            >
              Unduh PDF Inisiasi
            </Button>
            <Button
              variant="outline"
              onClick={() => openPdfDirect(getChangeImplementationPdfUrl(historySelected.initiation.id), setErrMsg)}
            >
              Unduh PDF Implementasi
            </Button>
          </div>
        )}
      </AppLayout>
    );
  }

  /* ── Detail Antrian (mirip halaman detail riwayat) ───────────── */
  if (queueSelected) {
    return (
      <AppLayout breadcrumbs={[{ label: "Beranda" }, { label: "Team Lead" }, { label: "Detail Permohonan" }]}>
        <div className="flex items-center justify-between">
          <PageTitle title={queueSelected.initiation.doc_number} subtitle={queueSelected.initiation.initiator?.name} />
          <button className="text-[#256EEF] text-sm hover:underline" onClick={() => setQueueSelected(null)}>
            &larr; Kembali ke Antrian
          </button>
        </div>
        {errMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{errMsg}</div>
        )}
        <PackageDetailView pkg={queueSelected} />
        {canDecide && (
          <div className="flex gap-3">
            <Button
              className="!bg-green-50 !text-green-700 !border-green-200 hover:!bg-green-100"
              variant="outline"
              onClick={() => handleApprove(queueSelected)}
              disabled={saving}
            >
              Setujui
            </Button>
            <Button
              variant="outline"
              className="!text-red-500 !border-red-300 hover:!bg-red-50"
              onClick={() => handleReject(queueSelected)}
              disabled={saving}
            >
              Tolak
            </Button>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Beranda" }, { label: "Team Lead" }, { label: "Permintaan Persetujuan" }]}>
      <div className="flex items-center justify-between">
        {view === "queue" ? (
          <PageTitle title="Permintaan Persetujuan" subtitle={`${queue.length} permohonan menunggu review`} />
        ) : (
          <PageTitle title="Riwayat Persetujuan" subtitle="Keputusan yang sudah Anda buat" />
        )}
        <Button variant="outline" onClick={() => setView(view === "queue" ? "history" : "queue")}>
          {view === "queue" ? "Riwayat Persetujuan" : "Permintaan Persetujuan"}
        </Button>
      </div>

      {errMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{errMsg}</div>
      )}

      {view === "queue" ? (
        <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E0E9F2]">
            <h3 className="text-sm font-semibold text-[#141D23]">Antrian Persetujuan</h3>
          </div>
          {queueLoading ? (
            <div className="text-center py-10 text-sm text-[#767676]">Memuat...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E0E9F2]">
                  <th className="text-left px-4 py-3 font-medium text-[#767676]">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium text-[#767676]">Nomor</th>
                  <th className="text-left px-4 py-3 font-medium text-[#767676]">Judul</th>
                  <th className="text-left px-4 py-3 font-medium text-[#767676]">Inisiator</th>
                  <th className="text-left px-4 py-3 font-medium text-[#767676]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-sm text-[#767676]">
                      Tidak ada permohonan menunggu persetujuan.
                    </td>
                  </tr>
                )}
                {queue.map((p) => (
                  <tr key={p.initiation.id} className="border-b border-[#F0F0F0] hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3 text-[#333] whitespace-nowrap">{formatSlash(p.initiation.initiation_date)}</td>
                    <td className="px-4 py-3 font-medium text-[#256EEF] whitespace-nowrap">{p.initiation.doc_number}</td>
                    <td className="px-4 py-3 text-[#333] max-w-xs">
                      <span className="line-clamp-2">{p.initiation.description}</span>
                    </td>
                    <td className="px-4 py-3 text-[#333] whitespace-nowrap">{p.initiation.initiator?.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetail(p.initiation.id)}
                          title="Lihat detail permohonan"
                          className="p-2 rounded-lg text-[#256EEF] hover:bg-[#EBF3FF] transition-colors"
                        >
                          <EyeIcon />
                        </button>
                        {canDecide && (
                          <>
                            <Button
                              size="sm"
                              className="!bg-green-50 !text-green-700 !border-green-200 hover:!bg-green-100"
                              variant="outline"
                              onClick={() => handleApprove(p)}
                              disabled={saving}
                            >
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="!text-red-500 !border-red-300 hover:!bg-red-50"
                              onClick={() => handleReject(p)}
                              disabled={saving}
                            >
                              Tolak
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* ── View riwayat: TIDAK DIUBAH ── */
        <>
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-green-50 border border-green-100 rounded-[10px] p-5 flex items-center gap-4">
              <CheckCircleIcon />
              <div>
                <p className="text-2xl font-bold text-green-700">{historyCounts.approved}</p>
                <p className="text-sm text-green-700">Disetujui</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-[10px] p-5 flex items-center gap-4">
              <XCircleIcon />
              <div>
                <p className="text-2xl font-bold text-red-600">{historyCounts.rejected}</p>
                <p className="text-sm text-red-600">Ditolak</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E0E9F2]">
              <h3 className="text-sm font-semibold text-[#141D23]">Riwayat Keputusan</h3>
            </div>
            {historyLoading ? (
              <div className="text-center py-10 text-sm text-[#767676]">Memuat...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E0E9F2]">
                    <th className="text-left px-4 py-3 font-medium text-[#767676]">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-[#767676]">Nomor</th>
                    <th className="text-left px-4 py-3 font-medium text-[#767676]">Pemohon</th>
                    <th className="text-left px-4 py-3 font-medium text-[#767676]">Prioritas Perubahan</th>
                    <th className="text-left px-4 py-3 font-medium text-[#767676]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-sm text-[#767676]">
                        Belum ada keputusan.
                      </td>
                    </tr>
                  )}
                  {history.map((p) => {
                    const st = statusBadge(p.initiation.status);
                    return (
                      <tr key={p.initiation.id} className="border-b border-[#F0F0F0] hover:bg-[#F9FAFB]">
                        <td className="px-4 py-3 text-[#333]">{formatTanggalLengkap(p.initiation.reviewed_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            className="text-[#256EEF] font-medium hover:underline"
                            onClick={() => handleViewHistory(p.initiation.id)}
                          >
                            {p.initiation.doc_number}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[#333]">{p.initiation.initiator?.name}</td>
                        <td className="px-4 py-3 text-[#333]">{changeClassLabel(p.implementation?.priority)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-600 shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500 shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" />
    </svg>
  );
}