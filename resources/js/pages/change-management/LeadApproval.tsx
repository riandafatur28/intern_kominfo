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

export default function LeadApproval() {
  const { user, hasPermission } = useAuth();
  const [view, setView] = useState<View>("queue");

  /* ── Queue ───────────────────────────────────────────────────── */
  const [queue, setQueue] = useState<ChangePackage[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // listChangePackages() is a light "summary" read (no attachment rows) so the queue
  // table stays cheap; fetch the full package (with lampiran) once a row is picked,
  // same as staf's detail view does via getChangePackage().
  const [selectedDetail, setSelectedDetail] = useState<ChangePackage | null>(null);
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
      setSelectedId((prev) =>
        prev != null && res.data.some((p) => p.initiation.id === prev)
          ? prev
          : (res.data[0]?.initiation.id ?? null)
      );
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

  const selected = useMemo(
    () => queue.find((p) => p.initiation.id === selectedId) ?? null,
    [queue, selectedId]
  );

  // Upgrade the light queue row to a full detail (with lampiran) as soon as its id is
  // selected. Keep rendering the light `selected` row in the meantime so the header
  // (doc number, initiator, status) shows instantly without waiting on the fetch.
  useEffect(() => {
    if (selectedId == null) {
      setSelectedDetail(null);
      return;
    }
    let cancelled = false;
    getChangePackage(selectedId)
      .then((res) => {
        if (!cancelled) setSelectedDetail(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const historyCounts = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    for (const p of history) {
      if (p.initiation.status === "approved") approved++;
      else if (p.initiation.status === "rejected") rejected++;
    }
    return { approved, rejected };
  }, [history]);

  async function handleApprove() {
    if (!selected) return;
    setSaving(true);
    setErrMsg("");
    try {
      await approveChangePackage(selected.initiation.id);
      await loadQueue();
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal menyetujui permohonan."));
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

  async function handleReject() {
    if (!selected) return;
    setSaving(true);
    setErrMsg("");
    try {
      await rejectChangePackage(selected.initiation.id);
      await loadQueue();
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal menolak permohonan."));
    } finally {
      setSaving(false);
    }
  }

  const canDecide = hasPermission("change.initiation.approve") || hasPermission("change.initiation.reject");

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
        <div className="grid grid-cols-[320px_1fr] gap-6 items-start">
          {/* ── Queue list ─────────────────────────────────────── */}
          <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E0E9F2]">
              <h3 className="text-xs font-semibold text-[#767676] tracking-wide">ANTRIAN PERSETUJUAN</h3>
            </div>
            {queueLoading ? (
              <div className="text-center py-8 text-sm text-[#767676]">Memuat...</div>
            ) : queue.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#767676]">Tidak ada permohonan menunggu.</div>
            ) : (
              <div className="flex flex-col">
                {queue.map((p) => (
                  <button
                    key={p.initiation.id}
                    onClick={() => setSelectedId(p.initiation.id)}
                    className={`text-left px-4 py-3 border-b border-[#F0F0F0] transition-colors ${
                      p.initiation.id === selectedId ? "bg-[#DBEAFE]" : "hover:bg-[#F6FAFF]"
                    }`}
                  >
                    <p className="text-xs text-[#767676]">{p.initiation.doc_number}</p>
                    <p className="text-sm font-semibold text-[#256EEF]">{p.initiation.initiator?.name}</p>
                    <p className="text-xs text-[#767676] mt-1">{p.initiation.field?.name}</p>
                    <p className="text-xs text-[#767676]">
                      {changeClassLabel(p.implementation?.priority)} • {p.initiation.initiation_date}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Detail panel ───────────────────────────────────── */}
          {selected ? (
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-[10px] shadow-sm p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#767676]">{selected.initiation.doc_number}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[#141D23]">
                      {changeClassLabel(selected.implementation?.priority)}
                    </span>
                    <span
                      className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${statusBadge(selected.initiation.status).color}`}
                    >
                      {selected.initiation.status === "pending"
                        ? "Menunggu Persetujuan"
                        : statusBadge(selected.initiation.status).label}
                    </span>
                  </div>
                  <p className="text-xs text-[#767676] mt-1">
                    {selected.initiation.initiator?.name} · {selected.initiation.field?.name} ·{" "}
                    {selected.initiation.initiation_date}
                  </p>
                </div>
                {canDecide && (
                  <div className="flex gap-3 shrink-0">
                    <Button
                      className="!bg-green-50 !text-green-700 !border-green-200 hover:!bg-green-100"
                      variant="outline"
                      onClick={handleApprove}
                      disabled={saving}
                    >
                      Setujui
                    </Button>
                    <Button
                      variant="outline"
                      className="!text-red-500 !border-red-300 hover:!bg-red-50"
                      onClick={handleReject}
                      disabled={saving}
                    >
                      Tolak
                    </Button>
                  </div>
                )}
              </div>

              <PackageDetailView pkg={selectedDetail ?? selected} />
            </div>
          ) : (
            <div className="bg-white rounded-[10px] shadow-sm p-12 text-center text-sm text-[#767676]">
              Pilih permohonan pada antrian untuk melihat detail.
            </div>
          )}
        </div>
      ) : (
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
