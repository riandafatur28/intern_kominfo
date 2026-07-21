import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Clock, Check, X, CheckCircle2, XCircle, ChevronRight, Loader2 } from "lucide-react"
import AntrianCard from "../../components/ui/AntrianCard"

export default function DashboardTeamLead() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  
  const [summary, setSummary] = useState({
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0
  })
  const [pendingRequests, setPendingRequests] = useState([])
  const [recentDecisions, setRecentDecisions] = useState([])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/changes/dashboard")
      const data = response.data

      if (data.summary) {
        setSummary(data.summary)
      }

      if (data.pending_queue) {
        const mappedPending = data.pending_queue.map((item) => ({
          db_id: item.id,
          id: item.doc_number || `CR-${item.id}`,
          name: item.initiator?.name || item.user_name || "Pemohon",
          bidang: item.field?.name || item.department || "General",
          jenis: item.change_type || "Change Request",
          tanggal: item.initiation_date || item.created_at || "-",
          desc: item.description || item.reason || "-"
        }))
        setPendingRequests(mappedPending)
      }

      if (data.recent_history) {
        const mappedHistory = data.recent_history.map((item) => ({
          db_id: item.id,
          id: item.doc_number || `CR-${item.id}`,
          name: item.initiator?.name || item.user_name || "Pemohon",
          date: item.reviewed_at || item.updated_at || item.initiation_date || "-",
          status: item.status === "approved" ? "Approved" : "Rejected",
          bidang: item.field?.name || item.department || "-"
        }))
        setRecentDecisions(mappedHistory)
      }
    } catch (err) {
      console.error("Gagal mengambil data dashboard:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleApprove = async (dbId) => {
    try {
      setActionLoadingId(dbId)
      await axios.post(`/api/changes/initiations/${dbId}/approve`)
      await fetchDashboardData()
    } catch (err) {
      console.error("Gagal menyetujui permohonan:", err)
      alert(err.response?.data?.message || "Gagal menyetujui permohonan.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (dbId) => {
    try {
      setActionLoadingId(dbId)
      await axios.post(`/api/changes/initiations/${dbId}/reject`, {
        reason: "Ditolak via Dashboard Team Lead"
      })
      await fetchDashboardData()
    } catch (err) {
      console.error("Gagal menolak permohonan:", err)
      alert(err.response?.data?.message || "Gagal menolak permohonan.")
    } finally {
      setActionLoadingId(null)
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-8 min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Memuat data dashboard...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
      <h1 className="mb-6 text-2xl md:text-3xl font-bold text-gray-900">Dashboard Team Lead</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* CARD 1: Menunggu Persetujuan */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900 block leading-none">
              {summary.pending_count}
            </span>
            <span className="text-sm font-semibold text-gray-500 mt-2 block">Menunggu Persetujuan</span>
            <span className="text-xs text-gray-400 mt-1 block">Perlu ditindaklanjuti</span>
          </div>
        </div>

        {/* CARD 2: Disetujui */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[160px] relative">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Check size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900 block leading-none">
              {summary.approved_count}
            </span>
            <span className="text-sm font-semibold text-gray-500 mt-2 block">Disetujui</span>
          </div>
        </div>

        {/* CARD 3: Ditolak */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
              <X size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900 block leading-none">
              {summary.rejected_count}
            </span>
            <span className="text-sm font-semibold text-gray-500 mt-2 block">Ditolak</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Antrian Persetujuan</h2>
              <p className="text-xs text-gray-400">{pendingRequests.length} permohonan menunggu review Anda</p>
            </div>
            <button
              onClick={() => navigate("/team-lead/permintaan-persetujuan")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 bg-gray-50/50">
                Tidak ada permohonan baru yang menunggu persetujuan Anda.
              </div>
            ) : (
              pendingRequests.map((req) => (
                <AntrianCard
                  key={req.db_id}
                  id={req.id}
                  name={req.name}
                  bidang={req.bidang}
                  jenis={req.jenis}
                  tanggal={req.tanggal}
                >
                  <p className="text-xs leading-relaxed text-gray-600 mb-3">{req.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleApprove(req.db_id)}
                      disabled={actionLoadingId === req.db_id}
                      className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      {actionLoadingId === req.db_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "✓ Setujui"}
                    </button>
                    <button
                      onClick={() => handleReject(req.db_id)}
                      disabled={actionLoadingId === req.db_id}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-200 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      {actionLoadingId === req.db_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "✕ Tolak"}
                    </button>
                    <button
                      onClick={() => navigate("/team-lead/permintaan-persetujuan")}
                      className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Lihat Detail <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </AntrianCard>
              ))
            )}
          </div>
        </div>

        {/* Riwayat Kanan */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-gray-900">Riwayat Persetujuan Terbaru</h2>
            <div className="space-y-4">
              {recentDecisions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Belum ada riwayat persetujuan.</p>
              ) : (
                recentDecisions.slice(0, 5).map((item, idx) => (
                  <div key={item.db_id || idx} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0 gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      {item.status === "Approved" ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{item.id} · {item.date}</p>
                      </div>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                      item.status === "Approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}>
                      {item.status === "Approved" ? "Disetujui" : "Ditolak"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}