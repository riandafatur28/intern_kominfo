import React, { useState, useEffect, useCallback } from "react"
import { FileText, CheckCircle2, XCircle, Clock, ChevronRight, RefreshCw } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { getAdminReports } from "../../api/admin"
import { useAuth } from "../../context/AuthContext"
import StatCard from "../../components/ui/StatCard"
import { SkeletonCard } from "../../components/ui/Skeleton"

export default function DashboardKepalaBidang() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        getAdminReports({ status: 'pending', per_page: 1 }),
        getAdminReports({ status: 'approved', per_page: 1 }),
        getAdminReports({ status: 'rejected', per_page: 1 }),
      ])

      setStats({
        pending: pendingRes.meta?.total ?? 0,
        approved: approvedRes.meta?.total ?? 0,
        rejected: rejectedRes.meta?.total ?? 0,
        total: (pendingRes.meta?.total ?? 0) + (approvedRes.meta?.total ?? 0) + (rejectedRes.meta?.total ?? 0),
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
        <div className="mb-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-56 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Kepala Bidang</h1>
          <p className="text-xs text-gray-400">
            {user?.team?.field?.name
              ? `Bidang ${user.team.field.name} — ${stats.pending} laporan menunggu persetujuan`
              : `${stats.pending} laporan menunggu persetujuan`
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
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">{error}</div>
      )}

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} value={stats.pending} title="Menunggu" subtitle="Perlu persetujuan" />
        <StatCard icon={CheckCircle2} value={stats.approved} title="Disetujui" subtitle="Total" />
        <StatCard icon={XCircle} value={stats.rejected} title="Ditolak" subtitle="Total" />
        <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500">
            <FileText className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-gray-800">Persetujuan Laporan</p>
          <p className="text-xs text-gray-400 mt-1">{stats.pending} perlu review</p>
          <button
            onClick={() => navigate('/kepala-bidang/persetujuan-laporan')}
            className="mt-3 text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
          >
            Lihat Semua →
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/kepala-bidang/persetujuan-laporan')}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-left hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">Persetujuan Laporan Kegiatan</p>
              <p className="text-xs text-gray-400">Setujui atau tolak laporan kerja pegawai</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" />
          </div>
        </button>

        <button
          onClick={() => navigate('/kepala-bidang/profil')}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-left hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">Profil Saya</p>
              <p className="text-xs text-gray-400">Kelola informasi profil Anda</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" />
          </div>
        </button>
      </div>
    </main>
  )
}
