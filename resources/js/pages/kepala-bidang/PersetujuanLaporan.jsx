import React, { useState, useEffect, useCallback } from "react"
import { FileText, CheckCircle2, XCircle, Clock, Check, X, Loader2, RefreshCw, Search } from "lucide-react"
import { getAdminReports, getReportDetail } from "../../api/admin"
import { wfhApi } from "../../api/wfh"
import { SkeletonTable, SkeletonCard, SkeletonBlock } from "../../components/ui/Skeleton"

const STATUS_META = {
  draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
  pending: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Disetujui', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-600' },
}

export default function PersetujuanLaporan() {
  const [tab, setTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const statusParam = tab === 'pending' ? 'pending' : tab === 'approved' ? 'approved' : 'rejected'

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getAdminReports({ status: statusParam, page, per_page: 20 })
      setReports(res.data || [])
      setMeta(res.meta || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat laporan')
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [statusParam, page])

  useEffect(() => { fetchReports() }, [fetchReports])

  const fetchDetail = useCallback(async (id) => {
    try {
      setDetailLoading(true)
      const data = await getReportDetail(id)
      setDetail(data)
    } catch (err) {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleSelect = (id) => {
    setSelected(id)
    fetchDetail(id)
  }

  const handleApprove = async (id) => {
    try {
      setActionLoading(id)
      await wfhApi.approveReport(id)
      showToast('success', 'Laporan berhasil disetujui')
      setSelected(null)
      setDetail(null)
      await fetchReports()
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Gagal menyetujui')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    try {
      setActionLoading(id)
      await wfhApi.rejectReport(id, 'Tidak memenuhi kriteria.')
      showToast('success', 'Laporan ditolak')
      setSelected(null)
      setDetail(null)
      await fetchReports()
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Gagal menolak')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'

  // ========== SKELETON ==========
  if (loading && reports.length === 0) {
    return (
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
        <div className="mb-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-48" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SkeletonBlock className="h-12 w-full mb-3" />
            <SkeletonTable rows={6} cols={3} />
          </div>
          <div className="lg:col-span-2">
            <SkeletonBlock className="h-64 w-full" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Persetujuan Laporan Kegiatan</h1>
          <p className="text-xs text-gray-400">
            {tab === 'pending'
              ? `${meta?.total ?? 0} laporan menunggu persetujuan`
              : `${meta?.total ?? 0} laporan ${tab === 'approved' ? 'disetujui' : 'ditolak'}`
            }
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {[
          { key: 'pending', label: 'Menunggu', icon: Clock },
          { key: 'approved', label: 'Disetujui', icon: CheckCircle2 },
          { key: 'rejected', label: 'Ditolak', icon: XCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setPage(1); setSelected(null); setDetail(null) }}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              tab === key
                ? 'bg-brand-100 text-brand-700'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — List */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Daftar Laporan</h3>
            </div>
            {reports.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">Tidak ada laporan.</div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {reports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                      selected === r.id ? 'bg-brand-50 border-l-2 border-brand-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-gray-900 truncate">{r.user?.name || '—'}</p>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${(STATUS_META[r.status] || STATUS_META.draft).cls}`}>
                        {(STATUS_META[r.status] || STATUS_META.draft).label}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(r.report_date)}</p>
                    {r.team && <p className="text-[10px] text-gray-400">{r.team.name}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="mt-3 flex items-center justify-center gap-1">
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded text-xs font-medium cursor-pointer ${
                    p === meta.current_page
                      ? 'bg-brand-100 text-brand-700'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — Detail */}
        <div className="lg:col-span-2">
          {detailLoading ? (
            <SkeletonBlock className="h-72 w-full" />
          ) : detail ? (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">{detail.user?.name || '—'}</p>
                  <p className="text-xs text-gray-400">{formatDate(detail.report_date)}</p>
                </div>
                <span className={`rounded px-2.5 py-0.5 text-[10px] font-bold ${(STATUS_META[detail.status] || STATUS_META.draft).cls}`}>
                  {(STATUS_META[detail.status] || STATUS_META.draft).label}
                </span>
              </div>

              <div className="p-5">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Kegiatan</h4>
                {detail.activities?.length > 0 ? (
                  <div className="space-y-3">
                    {detail.activities.map((a, i) => (
                      <div key={i} className="rounded-lg bg-gray-50 p-3">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
                          <Clock size={10} />
                          {a.start_time} — {a.end_time || '...'}
                        </div>
                        <p className="text-xs text-gray-800 font-medium">{a.activity}</p>
                        {a.link && (
                          <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-600 underline block mt-0.5">
                            {a.link}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Tidak ada kegiatan.</p>
                )}
              </div>

              {/* Approve/Reject buttons — only for pending */}
              {detail.status === 'pending' && (
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleReject(detail.id)}
                    disabled={actionLoading === detail.id}
                    className="flex items-center gap-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === detail.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    Tolak
                  </button>
                  <button
                    onClick={() => handleApprove(detail.id)}
                    disabled={actionLoading === detail.id}
                    className="flex items-center gap-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === detail.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Setujui
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
              Pilih laporan dari daftar untuk melihat detail.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
