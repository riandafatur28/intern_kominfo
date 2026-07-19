import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Contact, FileText, GitPullRequestArrow } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/* ---------------- Stat Card ---------------- */
function StatCard({ label, value, sub }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5 text-center">
            <p className="text-base font-bold text-gray-800">{label}</p>
            <p className="text-5xl font-extrabold text-gray-500 my-3 leading-none">{value}</p>
            <p className="text-xs text-gray-400">{sub}</p>
        </div>
    );
}

/* ---------------- Akses Modul Card ---------------- */
function ModuleCard({ icon: Icon, iconBg, iconColor, borderColor, title, desc, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`text-left bg-white rounded-2xl border ${borderColor} p-6 flex items-start justify-between gap-4 hover:shadow-md transition-shadow w-full`}
        >
            <div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon size={22} className={iconColor} strokeWidth={2} />
            </div>
        </button>
    );
}

export default function DashboardPegawai() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // TODO: ganti data statis ini dengan data dari endpoint backend dashboard
    // pegawai saat sudah tersedia.
    const stats = [
        { label: 'Absensi bulan ini', value: 10, sub: 'Dari 25 hari kerja' },
        { label: 'Laporan terkirim', value: 5, sub: 'Bulan Juli 2025' },
        { label: 'Perubahan diinisiasi', value: 3, sub: '1 Menunggu persetujuan' },
        { label: 'Persetujuan selesai', value: 2, sub: 'Bulan ini' },
    ];

    const activities = [
        { time: '07.30', text: 'Absensi pagi berhasil terkirim' },
        { time: '11.50', text: 'Laporan kegiatan "Review UI Dashboard" disimpan sebagai draf' },
        { time: '13.00', text: 'Inisiasi perubahan "Fitur Export PDF" diajukan' },
        { time: '15.35', text: 'Persetujuan "Update Endpoint API" telah disetujui' },
    ];

    const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="max-w-[1200px] mx-auto space-y-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Dashboard</h1>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((s) => (
                    <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
                ))}
            </div>

            {/* Aktivitas hari ini */}
            <div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <h2 className="text-lg font-bold text-gray-900">Aktivitas hari ini</h2>
                    <span className="text-base font-bold text-gray-900">{today}</span>
                </div>
                <div>
                    {activities.map((a, i) => (
                        <div
                            key={i}
                            className={`flex items-start gap-6 py-4 ${
                                i < activities.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                        >
                            <span className="text-sm text-gray-500 w-14 shrink-0">{a.time}</span>
                            <span className="text-sm text-gray-600">{a.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Akses Modul */}
            <div>
                <h2 className="text-base font-extrabold text-gray-900 tracking-wide mb-4">AKSES MODUL</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <ModuleCard
                        icon={Contact}
                        iconBg="bg-green-400"
                        iconColor="text-white"
                        borderColor="border-green-200"
                        title="Absensi WFH"
                        desc="Unggah foto WFH hari ini"
                        onClick={() => navigate('/absensi-wfh')}
                    />
                    <ModuleCard
                        icon={FileText}
                        iconBg="bg-orange-400"
                        iconColor="text-white"
                        borderColor="border-orange-200"
                        title="Laporan Kegiatan"
                        desc="Catat kegiatan anda hari ini"
                        onClick={() => navigate('/laporan-kegiatan')}
                    />
                    <ModuleCard
                        icon={GitPullRequestArrow}
                        iconBg="bg-amber-300"
                        iconColor="text-white"
                        borderColor="border-amber-200"
                        title="Inisiasi Perubahan"
                        desc="Ajukan perubahan Sistem"
                        onClick={() => navigate('/inisiasi-perubahan')}
                    />
                </div>
            </div>
        </div>
    );
}
