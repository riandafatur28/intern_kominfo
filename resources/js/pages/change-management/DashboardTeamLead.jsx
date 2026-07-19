import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react"
import StatCard from "../../components/ui/StatCard"
import AntrianCard from "../../components/ui/AntrianCard"

const defaultPending = [
  {
    id: "CR-2026-006",
    name: "Rina Marlina",
    info: "Bidang Informasi · Normal Change · 2026-06-03",
    desc: "Pembaruan konten modul FAQ dan panduan pengguna di website utama.",
    bidang: "Bidang Informasi",
    jenis: "Normal Change",
    tanggal: "2026-06-03",
    alasan: "Pembaruan konten modul FAQ dan panduan pengguna di website utama.",
    dampak: "Tidak ada downtime, perubahan langsung diterapkan secara asinkron.",
    risiko: "Sangat Rendah - Hanya perubahan konten statis.",
    evidence: "https://gitlab.jatimprov.go.id/issues/9012",
    testing: "1. Visual check di browser Chrome dan Safari\n2. Verifikasi link navigasi baru",
    implementasi: "Langsung deploy melalui Git runner otomatis."
  },
  {
    id: "CR-2026-008",
    name: "Ahmad Fauzi",
    info: "Bidang Aplikasi · Normal Change · 2026-07-10",
    desc: "Integrasi sistem masuk tunggal (SSO) untuk semua layanan internal Kominfo.",
    bidang: "Bidang Aplikasi",
    jenis: "Normal Change",
    tanggal: "2026-07-10",
    alasan: "Memahkan pegawai mengakses berbagai aplikasi internal dengan satu akun aman.",
    dampak: "Potensi downtime singkat sekitar 5 menit saat migrasi sesi pengguna.",
    risiko: "Sedang - Memerlukan sinkronisasi database pengguna aktif.",
    evidence: "https://gitlab.jatimprov.go.id/issues/9015",
    testing: "1. Uji login dengan berbagai role pengguna\n2. Verifikasi keamanan token JWT",
    implementasi: "Deploy pada jam non-kerja (22:00 WIB)."
  },
  {
    id: "CR-2026-009",
    name: "Siti Rahma",
    info: "Bidang Jaringan · Emergency Change · 2026-07-12",
    desc: "Konfigurasi routing cadangan (failover) otomatis pada ISP sekunder.",
    bidang: "Bidang Jaringan",
    jenis: "Emergency Change",
    tanggal: "2026-07-12",
    alasan: "Menghindari putusnya koneksi internet utama jika terjadi gangguan pada link fiber optik utama.",
    dampak: "Tidak ada downtime selama konfigurasi hot-standby dilakukan.",
    risiko: "Rendah - Hanya menambahkan rute cadangan pada router core.",
    evidence: "https://gitlab.jatimprov.go.id/issues/9016",
    testing: "1. Simulasi pemutusan link utama\n2. Verifikasi waktu peralihan ke link cadangan",
    implementasi: "Konfigurasi langsung di router core utama."
  },
  {
    id: "CR-2026-010",
    name: "Bambang Wijaya",
    info: "Bidang Infrastruktur · Standard Change · 2026-07-14",
    desc: "Pemeliharaan rutin dan pembersihan ruang penyimpanan pada server database e-Planning.",
    bidang: "Bidang Infrastruktur",
    jenis: "Standard Change",
    tanggal: "2026-07-14",
    alasan: "Kapasitas disk penyimpanan server database utama sudah mencapai batas aman 85%.",
    dampak: "Layanan e-Planning akan diposisikan read-only selama proses optimasi (estimasi 15 menit).",
    risiko: "Rendah - Prosedur standar pembersihan log usang.",
    evidence: "https://gitlab.jatimprov.go.id/issues/9017",
    testing: "1. Cek fungsionalitas query e-Planning\n2. Verifikasi sisa kapasitas penyimpanan pasca-optimasi",
    implementasi: "Jadwal pemeliharaan berkala pada hari Sabtu jam 08:00 WIB."
  },
  {
    id: "CR-2026-011",
    name: "Dewi Lestari",
    info: "Bidang Informasi · Normal Change · 2026-07-15",
    desc: "Penambahan visualisasi grafik interaktif pada menu Dashboard Statistik Publik.",
    bidang: "Bidang Informasi",
    jenis: "Normal Change",
    tanggal: "2026-07-15",
    alasan: "Memenuhi permintaan masyarakat untuk visualisasi data statistik yang lebih interaktif dan mudah dibaca.",
    dampak: "Tidak ada downtime, modul visualisasi berupa komponen frontend statis.",
    risiko: "Sangat Rendah - Hanya perubahan pada sisi tampilan frontend.",
    evidence: "https://gitlab.jatimprov.go.id/issues/9018",
    testing: "1. Pengujian responsivitas grafik pada layar mobile dan desktop\n2. Validasi akurasi data grafik",
    implementasi: "Merge request ke branch production dan deploy via CI/CD."
  }
]

const defaultDecisions = [
  { 
    id: "CR-2026-004", 
    name: "Rizal Firmansyah", 
    date: "2026-07-16", 
    status: "Approved",
    bidang: "Bidang Jaringan",
    jenis: "Normal Change",
    catatan: "Disetujui secara instan via Simulator FE."
  },
  { 
    id: "CR-2026-001", 
    name: "Arif Budiman", 
    date: "2026-07-16", 
    status: "Approved",
    bidang: "Bidang Aplikasi",
    jenis: "Normal Change",
    catatan: "Disetujui secara otomatis melalui sistem."
  }
]

export default function DashboardTeamLead() {
  const navigate = useNavigate();

  const [pendingRequests, setPendingRequests] = useState(() => {
    const saved = localStorage.getItem("shared_pending_v2");
    return saved ? JSON.parse(saved) : defaultPending;
  });

  const [recentDecisions, setRecentDecisions] = useState(() => {
    const saved = localStorage.getItem("shared_decisions_v2");
    return saved ? JSON.parse(saved) : defaultDecisions;
  });

  useEffect(() => {
    localStorage.setItem("shared_pending_v2", JSON.stringify(pendingRequests));
  }, [pendingRequests]);

  useEffect(() => {
    localStorage.setItem("shared_decisions_v2", JSON.stringify(recentDecisions));
  }, [recentDecisions]);

  const handleApprove = (id) => {
    const target = pendingRequests.find(req => req.id === id);
    if (!target) return;
    setPendingRequests(prev => prev.filter(req => req.id !== id));
    setRecentDecisions(prev => [{
      id: target.id,
      name: target.name,
      date: new Date().toISOString().split('T')[0],
      status: "Approved",
      bidang: target.bidang,
      jenis: target.jenis,
      catatan: "Disetujui via Dashboard."
    }, ...prev]);
  };

  const handleReject = (id) => {
    const target = pendingRequests.find(req => req.id === id);
    if (!target) return;
    setPendingRequests(prev => prev.filter(req => req.id !== id));
    setRecentDecisions(prev => [{
      id: target.id,
      name: target.name,
      date: new Date().toISOString().split('T')[0],
      status: "Rejected",
      bidang: target.bidang,
      jenis: target.jenis,
      catatan: "Ditolak via Dashboard."
    }, ...prev]);
  };

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
      <h1 className="mb-6 text-2xl md:text-3xl font-bold text-gray-900">Dashboard Team Lead</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard 
          icon={Clock} 
          value={pendingRequests.length} 
          title="Menunggu Persetujuan" 
          subtitle="Perlu ditindaklanjuti" 
        />
        <StatCard 
          icon={CheckCircle2} 
          value={recentDecisions.filter(i => i.status === "Approved").length} 
          title="Disetujui" 
          badgeText="+3 hari ini"
          badgeColor="bg-green-100 text-green-700"
        />
        <StatCard 
          icon={XCircle} 
          value={recentDecisions.filter(i => i.status === "Rejected").length} 
          title="Ditolak" 
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                  key={req.id}
                  id={req.id}
                  name={req.name}
                  bidang={req.bidang}
                  jenis={req.jenis}
                  tanggal={req.tanggal}
                >
                  <p className="text-xs leading-relaxed text-gray-600 mb-3">{req.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleApprove(req.id)}
                      className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 cursor-pointer"
                    >
                      ✓ Setujui
                    </button>
                    <button 
                      onClick={() => handleReject(req.id)}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-200 cursor-pointer"
                    >
                      ✕ Tolak
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
              {recentDecisions.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0 gap-2">
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}