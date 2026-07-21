import React, { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, CheckCircle2, XCircle, AlertTriangle, ExternalLink, Check, X, Loader2, RefreshCw } from "lucide-react"
import { changesApi } from "../../api/changes"
import { useAuth } from "../../context/AuthContext"
import AntrianCard from "../../components/ui/AntrianCard"
import DetailCard from "../../components/ui/DetailCard"
import { SkeletonCard, SkeletonLine, SkeletonBlock, SkeletonTable } from "../../components/ui/Skeleton"

export default function PermintaanPersetujuan() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("antrian");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [pendingList, setPendingList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [pendingRes, historyRes] = await Promise.all([
        changesApi.getInitiations({ status: 'pending', per_page: 50 }),
        changesApi.getInitiations({ status: 'approved,rejected', per_page: 50 }),
      ]);

      const pending = pendingRes.data?.data ?? [];
      const history = historyRes.data?.data ?? [];

      setPendingList(pending);
      setHistoryList(history);
      if (pending.length > 0 && !selectedId) {
        setSelectedId(pending[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selected = pendingList.find(i => i.id === selectedId) ?? null;

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      await changesApi.approveInitiation(id);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyetujui');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(id);
      await changesApi.rejectInitiation(id, 'Tidak memenuhi kriteria kelayakan.');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menolak');
    } finally {
      setActionLoading(null);
    }
  };

  // ========== SKELETON LOADING ==========
  if (loading && pendingList.length === 0 && historyList.length === 0) {
    return (
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
        <div className="mb-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-48" />
        </div>
        {activeTab === "antrian" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-2">
              <SkeletonLine width="w-32" className="mb-3" />
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-16 w-full" />
              ))}
            </div>
            <div className="lg:col-span-2 space-y-4">
              <SkeletonBlock className="h-24 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <SkeletonTable rows={4} cols={6} />
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Permintaan Persetujuan</h1>
          <p className="text-xs text-gray-400">
            {activeTab === "antrian"
              ? `${pendingList.length} permohonan menunggu review`
              : `${historyList.length} permohonan telah diproses`
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setActiveTab(activeTab === "antrian" ? "riwayat" : "antrian")}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
          >
            {activeTab === "antrian" ? (
              <><CheckCircle2 className="h-4 w-4 text-green-500" /> Riwayat Persetujuan</>
            ) : (
              <><Clock className="h-4 w-4 text-orange-500" /> Antrian Persetujuan</>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
          <XCircle size={14} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {activeTab === "antrian" ? (
        /* ===== TAB ANTRIAN ===== */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Daftar antrian — kiri */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1 h-fit">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Antrian Persetujuan</h2>
            {pendingList.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">Tidak ada antrian</div>
            ) : (
              <div className="space-y-2">
                {pendingList.map((req) => (
                  <AntrianCard
                    key={req.id}
                    id={req.doc_number}
                    name={req.initiator?.name ?? '—'}
                    bidang={req.field?.name ?? '—'}
                    jenis="Change Initiation"
                    tanggal={req.initiation_date}
                    isActive={selected?.id === req.id}
                    onClick={() => setSelectedId(req.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail — kanan */}
          <div className="lg:col-span-2 space-y-6">
            {selected ? (
              <>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                      {selected.doc_number}
                    </span>
                    <div className="mt-2 flex items-center gap-3">
                      <h3 className="text-xl font-extrabold text-gray-900 leading-none">Change Initiation</h3>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        Menunggu Persetujuan
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">
                      {selected.initiator?.name ?? '—'} · {selected.field?.name ?? '—'} · {selected.initiation_date}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleReject(selected.id)}
                      disabled={!hasPermission('change.initiation.reject')}
                      disabled={actionLoading === selected.id}
                      className="rounded-lg bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === selected.id ? <Loader2 size={14} className="animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      Tolak
                    </button>
                    <button
                      onClick={() => handleApprove(selected.id)}
                      disabled={!hasPermission('change.initiation.approve')}
                      disabled={actionLoading === selected.id}
                      className="rounded-lg bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === selected.id ? <Loader2 size={14} className="animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Setujui
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailCard title="Alasan Perubahan">
                    <p className="text-xs text-gray-600 leading-relaxed">{selected.reason || '—'}</p>
                  </DetailCard>

                  <DetailCard title="Deskripsi">
                    <p className="text-xs text-gray-600 leading-relaxed">{selected.description || '—'}</p>
                  </DetailCard>

                  <DetailCard title="Tanggal Dibutuhkan">
                    <p className="text-xs text-gray-600">{selected.needed_by_date || '—'}</p>
                  </DetailCard>

                  <DetailCard title="Pemohon">
                    <p className="text-xs text-gray-600 font-semibold">{selected.initiator?.name ?? '—'}</p>
                    <p className="text-[10px] text-gray-400">{selected.initiator?.position ?? ''}</p>
                  </DetailCard>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
                Tidak ada detail permohonan untuk ditampilkan.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===== TAB RIWAYAT ===== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {historyList.filter(i => i.status === 'approved' || i.review_status === 'approved').length}
                </p>
                <p className="text-xs font-semibold text-gray-500">Disetujui</p>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                <XCircle size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {historyList.filter(i => i.status === 'rejected' || i.review_status === 'rejected').length}
                </p>
                <p className="text-xs font-semibold text-gray-500">Ditolak</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Riwayat Keputusan</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
                    <th className="p-4">Dokumen</th>
                    <th className="p-4">Pemohon</th>
                    <th className="p-4">Bidang</th>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Keputusan</th>
                    <th className="p-4">Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                  {historyList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">Belum ada riwayat keputusan.</td>
                    </tr>
                  ) : (
                    historyList.map((item) => {
                      const isApproved = item.status === 'approved' || item.review_status === 'approved';
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-medium text-gray-400">{item.doc_number}</td>
                          <td className="p-4 font-bold text-gray-900">{item.initiator?.name ?? '—'}</td>
                          <td className="p-4 text-gray-500">{item.field?.name ?? '—'}</td>
                          <td className="p-4 text-gray-400">{item.initiation_date}</td>
                          <td className="p-4">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                            }`}>
                              {isApproved ? 'Disetujui' : 'Ditolak'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-400 italic max-w-xs truncate">
                            {item.review_reason || (isApproved ? 'Disetujui' : 'Ditolak')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
