import React, { useState, useEffect, useCallback } from "react"
import { Clock, Check, X, CheckCircle2, XCircle, ChevronRight, RefreshCw, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { changesApi } from "../../api/changes"
import { useAuth } from "../../context/AuthContext"
import StatCard from "../../components/ui/StatCard"
import AntrianCard from "../../components/ui/AntrianCard"
import { SkeletonCard, SkeletonLine, SkeletonBlock } from "../../components/ui/Skeleton"

export default function DashboardTeamLead() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingList, setPendingList] = useState([]);
  const [recentApproved, setRecentApproved] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [pendingRes, recentRes] = await Promise.all([
        changesApi.getInitiations({ status: 'pending', per_page: 50 }),
        changesApi.getInitiations({ status: 'approved,rejected', per_page: 10 }),
      ]);

      const pending = pendingRes.data?.data ?? [];
      const allRecent = recentRes.data?.data ?? [];

      setPendingList(pending);
      setRecentApproved(allRecent.slice(0, 5));

      setStats({
        pending: pending.length,
        approved: allRecent.filter(i => i.status === 'approved' || i.review_status === 'approved').length,
        rejected: allRecent.filter(i => i.status === 'rejected' || i.review_status === 'rejected').length,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const selected = pendingList.find(i => i.id === selectedId) ?? pendingList[0];

  // ========== SKELETON LOADING ==========
  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
        <div className="mb-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-72" />
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <SkeletonLine width="w-36" className="mb-3" />
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-28 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            <SkeletonBlock className="h-64 w-full" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-400">
            {user?.team?.field?.name
              ? `Bidang ${user.team.field.name} — ${pendingList.length} permohonan menunggu review`
              : `${pendingList.length} permohonan menunggu review`
            }
          </p>
        </div>
        <button
          onClick={fetchData}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
          <XCircle size={14} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} value={stats.pending} title="Menunggu" subtitle="Review diperlukan" />
        <StatCard icon={CheckCircle2} value={stats.approved} title="Disetujui" subtitle="Bulan ini" />
        <StatCard icon={XCircle} value={stats.rejected} title="Ditolak" subtitle="Bulan ini" />
        <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500">
            <ChevronRight className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-gray-800">Persetujuan</p>
          <p className="text-xs text-gray-400 mt-1">Lanjut ke halaman</p>
          <button
            onClick={() => navigate('/team-lead/permintaan-persetujuan')}
            className="mt-3 text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
          >
            Lihat Semua →
          </button>
        </div>
      </div>

      {/* Main Grid: Antrian (kiri) + Riwayat (kanan) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kiri — Antrian */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Antrian Persetujuan</h2>

          {pendingList.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <CheckCircle2 size={40} className="mx-auto text-green-300 mb-3" />
              <p className="text-sm font-semibold text-gray-600">Semua permohonan sudah diproses</p>
              <p className="text-xs text-gray-400 mt-1">Tidak ada inisiasi yang menunggu review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingList.map((item) => (
                <AntrianCard
                  key={item.id}
                  id={item.doc_number}
                  name={item.initiator?.name ?? '—'}
                  bidang={item.field?.name ?? '—'}
                  jenis="Change Initiation"
                  tanggal={item.initiation_date}
                  isActive={selected?.id === item.id}
                  onClick={() => setSelectedId(item.id)}
                >
                  <p className="mt-2 text-xs text-gray-600 line-clamp-2">{item.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    {hasPermission('change.initiation.approve') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleApprove(item.id); }}
                        disabled={actionLoading === item.id}
                        className="flex items-center gap-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === item.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Setujui
                      </button>
                    )}
                    {hasPermission('change.initiation.reject') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReject(item.id); }}
                        disabled={actionLoading === item.id}
                        className="flex items-center gap-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === item.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                        Tolak
                      </button>
                    )}
                  </div>
                </AntrianCard>
              ))}
            </div>
          )}
        </div>

        {/* Kanan — Riwayat */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-gray-900">Riwayat Persetujuan Terbaru</h2>
            <div className="space-y-4">
              {recentApproved.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Belum ada keputusan.</p>
              ) : (
                recentApproved.map((item) => {
                  const isApproved = item.status === 'approved' || item.review_status === 'approved';
                  return (
                    <div key={item.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0 gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        {isApproved ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{item.initiator?.name ?? '—'}</p>
                          <p className="text-[10px] text-gray-400 truncate">{item.doc_number} · {item.initiation_date}</p>
                        </div>
                      </div>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                        isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {isApproved ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
