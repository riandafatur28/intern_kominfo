import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contact, FileText, GitPullRequestArrow } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { wfhApi } from '../../api/wfh';
import { changesApi } from '../../api/changes';

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
    const [stats, setStats] = useState([
        { label: 'Absensi bulan ini', value: 0, sub: 'Memuat...' },
        { label: 'Laporan terkirim', value: 0, sub: 'Memuat...' },
        { label: 'Perubahan diinisiasi', value: 0, sub: 'Memuat...' },
        { label: 'Persetujuan selesai', value: 0, sub: 'Memuat...' },
    ]);
    const [activities, setActivities] = useState([]);

    const fetchData = useCallback(() => {
        Promise.all([
            wfhApi.getReports({ per_page: 50 }).catch(() => ({ data: { data: [] } })),
            changesApi.getInitiations({ per_page: 50 }).catch(() => ({ data: { data: [] } })),
        ]).then(([reportsRes, initiationsRes]) => {
            const reports = reportsRes.data.data || [];
            const initiations = initiationsRes.data.data || [];

            const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

            const monthReports = reports.filter(
                (r) => r.report_date && r.report_date.startsWith(thisMonth)
            );
            const monthInitiations = initiations.filter(
                (r) => r.initiation_date && r.initiation_date.startsWith(thisMonth)
            );

            const submitted = monthReports.filter(
                (r) => r.status === 'pending' || r.status === 'approved'
            ).length;
            const approved = initiations.filter((r) => r.status === 'approved').length;
            const pending = initiations.filter((r) => r.status === 'pending').length;

            setStats([
                {
                    label: 'Absensi bulan ini',
                    value: monthReports.length,
                    sub: `Dari ${new Date().getDate()} hari berjalan`,
                },
                { label: 'Laporan terkirim', value: submitted, sub: 'Telah disetujui / menunggu' },
                {
                    label: 'Perubahan diinisiasi',
                    value: monthInitiations.length,
                    sub: `${pending} Menunggu persetujuan`,
                },
                { label: 'Persetujuan selesai', value: approved, sub: 'Bulan ini' },
            ]);

            // Build activity feed
            const acts = [];
            // Last 5 reports
            const sorted = [...reports]
                .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
                .slice(0, 5);
            sorted.forEach((r) => {
                const t = r.report_date
                    ? new Date(r.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit', minute: '2-digit',
                      })
                    : '';
                const statusMap = {
                    draft: 'disimpan sebagai draf',
                    pending: 'dikirim untuk disetujui',
                    approved: 'telah disetujui',
                    rejected: 'ditolak',
                };
                acts.push({
                    time: t || r.report_date,
                    text: `Laporan kegiatan ${r.report_date} ${statusMap[r.status] || r.status}`,
                });
            });
            // Last 5 initiations
            const sortedInit = [...initiations]
                .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
                .slice(0, 5);

            const initActs = sortedInit.map((r) => {
                const t = r.initiation_date
                    ? new Date(r.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit', minute: '2-digit',
                      })
                    : '';
                const statusMap = {
                    draft: 'disimpan sebagai draf',
                    pending: 'diajukan',
                    approved: 'telah disetujui',
                    rejected: 'ditolak',
                };
                return {
                    time: t || r.initiation_date,
                    text: `Inisiasi "${r.description?.slice(0, 50) || ''}" ${statusMap[r.status] || r.status}`,
                };
            });
            setActivities([...acts.slice(0, 5), ...initActs.slice(0, 3)].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 8));
        }).catch(() => {
            // fallback — keep zeros
            setStats((s) => s.map((st) => ({ ...st, sub: '' })));
        });
    }, []);

    useEffect(() => {
        fetchData();
        const onVisible = () => { if (document.visibilityState === 'visible') fetchData(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [fetchData]);

    const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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
                    {activities.length === 0 ? (
                        <p className="text-sm text-gray-400 py-4">Belum ada aktivitas.</p>
                    ) : (
                        activities.map((a, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-6 py-4 ${
                                    i < activities.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                            >
                                <span className="text-sm text-gray-500 w-14 shrink-0">{a.time}</span>
                                <span className="text-sm text-gray-600">{a.text}</span>
                            </div>
                        ))
                    )}
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
