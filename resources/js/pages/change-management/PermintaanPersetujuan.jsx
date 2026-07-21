import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Clock, CheckCircle2, XCircle, AlertTriangle, ExternalLink, Check, X, Loader2 } from "lucide-react"
import AntrianCard from "../../components/ui/AntrianCard"
import DetailCard from "../../components/ui/DetailCard"

export default function PermintaanPersetujuan() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("antrian")

  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [pendingRequests, setPendingRequests] = useState([])
  const [recentDecisions, setRecentDecisions] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)

  const mapRequestData = (item) => ({
    id: item.doc_number || (typeof item.id === "number" ? `CR-2026-0${item.id}` : item.id),
    rawId: item.id,
    name: item.initiator?.name || item.name || "Pemohon",
    bidang: item.field?.name || item.bidang || "Bidang Information",
    jenis: item.change_type || item.jenis || "Change Request",
    tanggal: item.initiation_date || item.created_at || item.tanggal || "-",
    alasan: item.reason || item.description || item.alasan || "-",
    dampak: item.impact || item.dampak || "-",
    risiko: item.risk_analysis || item.risiko || "-",
    evidence: item.evidence_url || item.evidence || "#",
    testing: item.testing_plan || item.testing || "-",
    implementasi: item.implementation_plan || item.implementasi || "-",
    status: item.status === "approved" ? "Approved" : item.status === "rejected" ? "Rejected" : item.status,
    catatan: item.notes || item.catatan || item.rejection_reason || "-",
    date: item.updated_at ? item.updated_at.split("T")[0] : new Date().toISOString().split("T")[0]
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      if (activeTab === "antrian") {
        const res = await axios.get("/api/changes/initiations", {
          params: { status: "pending" }
        })
        const list = (res.data.data || res.data || []).map(mapRequestData)
        setPendingRequests(list)
        if (list.length > 0) {
          setSelectedRequest(list[0])
        } else {
          setSelectedRequest(null)
        }
      } else {
        const res = await axios.get("/api/changes/initiations", {
          params: { status: "history" }
        })
        const list = (res.data.data || res.data || []).map(mapRequestData)
        setRecentDecisions(list)
      }
    } catch (err) {
      console.error("Gagal mengambil data dari server:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const handleApprove = async (id) => {
    const target = pendingRequests.find((req) => req.id === id || req.rawId === id)
    if (!target) return

    try {
      setActionLoading(true)
      const targetId = target.rawId || target.id
      await axios.post(`/api/changes/initiations/${targetId}/approve`, {
        catatan: "Disetujui setelah dilakukan tinjauan dokumen teknis."
      })

      const approvedItem = {
        ...target,
        status: "Approved",
        date: new Date().toISOString().split("T")[0],
        catatan: "Disetujui setelah dilakukan tinjauan dokumen teknis."
      }

      setPendingRequests((prev) => prev.filter((req) => req.id !== target.id))
      setRecentDecisions((prev) => [approvedItem, ...prev])
      setSelectedRequest(null)
    } catch (err) {
      console.error("Gagal menyetujui permohonan:", err)
      alert(err.response?.data?.message || "Gagal menyetujui permohonan.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (id) => {
    const target = pendingRequests.find((req) => req.id === id || req.rawId === id)
    if (!target) return

    const reason = window.prompt("Masukkan alasan penolakan permohonan ini:", "Tidak memenuhi kriteria kelayakan rilis.")
    if (reason === null) return

    try {
      setActionLoading(true)
      const targetId = target.rawId || target.id
      await axios.post(`/api/changes/initiations/${targetId}/reject`, {
        reason: reason || "Tidak memenuhi kriteria kelayakan rilis."
      })

      const rejectedItem = {
        ...target,
        status: "Rejected",
        date: new Date().toISOString().split("T")[0],
        catatan: reason || "Tidak memenuhi kriteria kelayakan rilis."
      }

      setPendingRequests((prev) => prev.filter((req) => req.id !== target.id))
      setRecentDecisions((prev) => [rejectedItem, ...prev])
      setSelectedRequest(null)
    } catch (err) {
      console.error("Gagal menolak permohonan:", err)
      alert(err.response?.data?.message || "Gagal menolak permohonan.")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Permintaan Persetujuan</h1>
          <p className="text-xs text-gray-400">
            {activeTab === "antrian"
              ? `${pendingRequests.length} permohonan menunggu review`
              : `${recentDecisions.length} permohonan telah diproses`}
          </p>
        </div>

        <button
          onClick={() => setActiveTab(activeTab === "antrian" ? "riwayat" : "antrian")}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
        >
          {activeTab === "antrian" ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Riwayat Persetujuan
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-orange-500" /> Antrian Persetujuan
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-400 bg-white rounded-xl border border-gray-200">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-sm">Memuat data...</span>
        </div>
      ) : activeTab === "antrian" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1 h-fit">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Antrian Persetujuan</h2>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">Tidak ada antrian</div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <AntrianCard
                    key={req.id}
                    id={req.id}
                    name={req.name}
                    bidang={req.bidang}
                    jenis={req.jenis}
                    tanggal={req.tanggal}
                    isActive={selectedRequest && selectedRequest.id === req.id}
                    onClick={() => setSelectedRequest(req)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedRequest ? (
              <>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                      {selectedRequest.id}
                    </span>
                    <div className="mt-2 flex items-center gap-3">
                      <h3 className="text-xl font-extrabold text-gray-900 leading-none">{selectedRequest.jenis}</h3>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        Menunggu Persetujuan
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">
                      {selectedRequest.name} · {selectedRequest.bidang} · {selectedRequest.tanggal}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      disabled={actionLoading}
                      className="rounded-lg bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Tolak
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={actionLoading}
                      className="rounded-lg bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Setujui
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailCard title="Alasan Perubahan">
                    <p className="text-xs text-gray-600 leading-relaxed">{selectedRequest.alasan}</p>
                  </DetailCard>

                  <DetailCard title="Dampak">
                    <p className="text-xs text-gray-600 leading-relaxed">{selectedRequest.dampak}</p>
                  </DetailCard>

                  <DetailCard title="Analisis Risiko">
                    <div className="flex gap-2 items-start bg-amber-50/50 border border-amber-100 p-3 rounded-lg text-amber-800 text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                      <p>{selectedRequest.risiko}</p>
                    </div>
                  </DetailCard>

                  <DetailCard title="Link Bukti / Evidence">
                    <a
                      href={selectedRequest.evidence}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                    >
                      {selectedRequest.evidence} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </DetailCard>

                  <DetailCard title="Rencana Testing">
                    <pre className="text-xs text-gray-600 leading-relaxed font-sans whitespace-pre-line">
                      {selectedRequest.testing}
                    </pre>
                  </DetailCard>

                  <DetailCard title="Rencana Implementasi">
                    <p className="text-xs text-gray-600 leading-relaxed">{selectedRequest.implementasi}</p>
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{recentDecisions.filter((item) => item.status === "Approved").length}</p>
                <p className="text-xs font-semibold text-gray-500">Disetujui</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                <XCircle size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{recentDecisions.filter((item) => item.status === "Rejected").length}</p>
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
                    <th className="p-4">No. Permohonan</th>
                    <th className="p-4">Pemohon</th>
                    <th className="p-4">Bidang</th>
                    <th className="p-4">Jenis</th>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Keputusan</th>
                    <th className="p-4">Catatan TL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                  {recentDecisions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        Belum ada riwayat keputusan.
                      </td>
                    </tr>
                  ) : (
                    recentDecisions.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-medium text-gray-400">{item.id}</td>
                        <td className="p-4 font-bold text-gray-900">{item.name}</td>
                        <td className="p-4 text-gray-500">{item.bidang}</td>
                        <td className="p-4 font-semibold text-gray-800">{item.jenis}</td>
                        <td className="p-4 text-gray-400">{item.date}</td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              item.status === "Approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                            }`}
                          >
                            {item.status === "Approved" ? "Disetujui" : "Ditolak"}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400 italic max-w-xs truncate">{item.catatan}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}