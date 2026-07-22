import React, { useState, useEffect, useCallback } from 'react'
import { FileText, CheckCircle2, XCircle, Clock, Check, X, Loader2, RefreshCw, Search, ChevronLeft } from 'lucide-react'
import { getAdminReports } from '../../api/admin'
import { wfhApi } from '../../api/wfh'
import { SkeletonTable, SkeletonBlock } from '../../components/ui/Skeleton'
import { useAuth } from '../../context/AuthContext'

const STATUS_META = {
    draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
    pending: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Disetujui', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-600' },
}

export default function PersetujuanLaporanIndividu() {
    const { hasPermission } = useAuth()
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
    const [rejectModal, setRejectModal] = useState(null)
    const [rejectReason, setRejectReason] = useState('')

    const showToast = (type, msg) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await getAdminReports({ status: tab, page, per_page: 20 })
            setReports(res.data || [])
            setMeta(res.meta || null)
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memuat laporan')
        } finally {
            setLoading(false)
        }
    }, [tab, page])

    useEffect(() => { fetchReports() }, [fetchReports])

    const openDetail = async (report) => {
        setSelected(report)
        setDetailLoading(true)
        setDetail(null)
        try {
            const res = await wfhApi.getReport(report.id)
            setDetail(res.data?.data ?? res.data ?? {})
        } catch (err) {
            showToast('error', 'Gagal memuat detail laporan')
        } finally {
            setDetailLoading(false)
        }
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

    const handleReject = async () => {
        if (!rejectModal || !rejectReason.trim()) return
        try {
            setActionLoading(rejectModal)
            await wfhApi.rejectReport(rejectModal, rejectReason.trim())
            showToast('success', 'Laporan ditolak')
            setRejectModal(null)
            setRejectReason('')
            setSelected(null)
            setDetail(null)
            await fetchReports()
        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal menolak laporan'
            showToast('error', err.response?.data?.errors?.reason?.[0] || msg)
        } finally {
            setActionLoading(null)
        }
    }

    const closeDetail = () => {
        setSelected(null)
        setDetail(null)
    }

    // ─── Toast ───
    const ToastIcon = toast?.type === 'success' ? CheckCircle2 : XCircle
    const toastColor = toast?.type === 'success' ? 'bg-green-600' : 'bg-red-600'

    return (
        <main className="max-w-[1200px] mx-auto">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 ${toastColor} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-slide-in`}>
                    <ToastIcon size={16} />
                    {toast.msg}
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRejectModal(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Tolak Laporan</h3>
                        <p className="text-sm text-gray-500 mb-4">Berikan alasan penolakan</p>
                        <textarea
                            className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                            rows={4}
                            placeholder="Alasan penolakan..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setRejectModal(null); setRejectReason('') }}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >Batal</button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || actionLoading === rejectModal}
                                className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                            >
                                {actionLoading === rejectModal ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                                Tolak
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Persetujuan Laporan Individu</h1>
                    <p className="text-sm text-gray-500 mt-1">Setujui atau tolak laporan WFH dari pegawai</p>
                </div>
                <button
                    onClick={() => { setPage(1); fetchReports() }}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Segarkan
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
                {[
                    { key: 'pending', label: 'Menunggu' },
                    { key: 'approved', label: 'Disetujui' },
                    { key: 'rejected', label: 'Ditolak' },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => { setTab(t.key); setPage(1); setSelected(null); setDetail(null) }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                    >{t.label}</button>
                ))}
            </div>

            {/* Main Layout: list + detail */}
            <div className="flex gap-6">
                {/* Left: Report List */}
                <div className="flex-1 min-w-0">
                    {loading ? (
                        <SkeletonTable rows={6} cols={5} />
                    ) : error ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{error}</div>
                    ) : reports.length === 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm text-gray-400">Tidak ada laporan dengan status ini.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {reports.map(r => {
                                const sm = STATUS_META[r.status] ?? {}
                                const user = r.user ?? {}
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => openDetail(r)}
                                        className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === r.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-gray-900 text-sm">{user.name || '-'}</span>
                                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${sm.cls || 'bg-gray-100 text-gray-600'}`}>
                                                {sm.label || r.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                                            <span>NIP: {user.nip || '-'}</span>
                                            <span>Tanggal: {r.report_date || '-'}</span>
                                            <span>Unit: {user.team?.name || '-'}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {meta && meta.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${page === p ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                >{p}</button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Detail Panel */}
                <div className="w-[420px] shrink-0">
                    {!selected ? (
                        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
                            Pilih laporan dari daftar untuk melihat detail.
                        </div>
                    ) : detailLoading ? (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <SkeletonBlock lines={8} />
                        </div>
                    ) : detail ? (
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-gray-900">Detail Laporan</h2>
                                <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="px-5 py-4 space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-400 text-xs block mb-0.5">Pegawai</span>
                                    <span className="font-semibold text-gray-900">{detail.user?.name || '-'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-gray-400 text-xs block mb-0.5">NIP</span>
                                        <span className="text-gray-800">{detail.user?.nip || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-xs block mb-0.5">Pangkat</span>
                                        <span className="text-gray-800">{detail.user?.rank || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-xs block mb-0.5">Jabatan</span>
                                        <span className="text-gray-800">{detail.user?.position || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-xs block mb-0.5">Unit Kerja</span>
                                        <span className="text-gray-800">{detail.user?.team?.name || '-'}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-xs block mb-0.5">Tanggal Pelaksanaan</span>
                                    <span className="text-gray-800">{detail.report_date || '-'}</span>
                                </div>
                                <div>
                                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_META[detail.status]?.cls || 'bg-gray-100 text-gray-600'}`}>
                                        {STATUS_META[detail.status]?.label || detail.status}
                                    </span>
                                </div>
                            </div>

                            {/* Activities */}
                            <div className="border-t border-gray-100">
                                <div className="px-5 py-3 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Kegiatan
                                </div>
                                {(!detail.activities || detail.activities.length === 0) ? (
                                    <div className="px-5 py-4 text-sm text-gray-400">Belum ada kegiatan.</div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {detail.activities.map((a, i) => (
                                            <div key={a.id || i} className="px-5 py-3">
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                    <Clock size={12} />
                                                    <span>{a.start_time || '?'} - {a.end_time || '?'}</span>
                                                </div>
                                                <p className="text-sm text-gray-800 mb-1">{a.activity}</p>
                                                {(a.links?.length > 0) && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {a.links.map((l, j) => (
                                                            <a key={j} href={l.url} target="_blank" rel="noopener noreferrer"
                                                               className="text-xs text-blue-600 hover:underline truncate max-w-[200px] block">{l.url}</a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Supervisor Info */}
                            {detail.supervisor && (
                                <div className="border-t border-gray-100 px-5 py-3">
                                    <span className="text-gray-400 text-xs block mb-0.5">Atasan Langsung</span>
                                    <span className="text-sm font-semibold text-gray-800">{detail.supervisor.name}</span>
                                    <span className="text-xs text-gray-500 ml-2">NIP. {detail.supervisor.nip}</span>
                                </div>
                            )}

                            {/* Approve/Reject — only for pending */}
                            {detail.status === 'pending' && (
                                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                                    {hasPermission('wfh.report.reject') && (
                                        <button
                                            onClick={() => setRejectModal(detail.id)}
                                            disabled={actionLoading === detail.id}
                                            className="flex items-center gap-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            {actionLoading === detail.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                                            Tolak
                                        </button>
                                    )}
                                    {hasPermission('wfh.report.approve') && (
                                        <button
                                            onClick={() => handleApprove(detail.id)}
                                            disabled={actionLoading === detail.id}
                                            className="flex items-center gap-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            {actionLoading === detail.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                            Setujui
                                        </button>
                                    )}
                                </div>
                            )}
                            {detail.status === 'approved' && detail.supervisor_signed_at && (
                                <div className="px-5 py-3 bg-green-50 border-t border-green-100 text-xs text-green-700 text-center font-semibold">
                                    Disetujui pada {new Date(detail.supervisor_signed_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}
                            {detail.status === 'rejected' && detail.reject_reason && (
                                <div className="px-5 py-3 bg-red-50 border-t border-red-100 text-xs text-red-700">
                                    <span className="font-semibold">Alasan ditolak:</span> {detail.reject_reason}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </main>
    )
}
