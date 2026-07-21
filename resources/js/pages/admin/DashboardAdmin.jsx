import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardCheck, FileClock, CheckCircle2, Calendar } from 'lucide-react';
import { getDashboardStats } from '../../api/dashboard';
import { SkeletonCard, SkeletonBlock } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';

/* ---------------- Stat Card ---------------- */
function StatCard({ icon: Icon, iconBg, iconColor, value, label, sub, valueSmall }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${iconBg}`}>
                <Icon size={18} className={iconColor} strokeWidth={2.2} />
            </div>
            <p className={`font-extrabold text-gray-900 leading-none ${valueSmall ? 'text-lg' : 'text-3xl'}`}>
                {value}
            </p>
            <p className="text-sm text-gray-500 mt-2 font-medium">{label}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
    );
}

/* ---------------- Compliance Bar Chart (pure SVG) ---------------- */
function ComplianceChart({ chart }) {
    const [hover, setHover] = useState(null);

    const data = chart;

    const maxTotal = Math.max(
        ...data.map((d) => d.laporan_terkirim + d.tidak_lengkap + d.belum_absensi),
        1
    );
    // Round axis up to a nice tick (multiple of 7 like design: 0,7,14,21,28)
    const axisMax = Math.ceil(maxTotal / 7) * 7 || 28;
    const ticks = [0, 1, 2, 3, 4].map((i) => Math.round((axisMax / 4) * i));

    const chartH = 260;

    return (
        <div className="relative">
            <div className="flex">
                {/* Y axis */}
                <div className="flex flex-col justify-between text-[11px] text-gray-400 pr-3 text-right" style={{ height: chartH }}>
                    {[...ticks].reverse().map((t) => (
                        <span key={t}>{t}</span>
                    ))}
                </div>

                {/* Plot area */}
                <div className="flex-1 relative" style={{ height: chartH }}>
                    {/* gridlines */}
                    {[...ticks].reverse().map((t, i) => (
                        <div
                            key={i}
                            className="absolute left-0 right-0 border-t border-gray-100"
                            style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
                        />
                    ))}

                    {/* bars */}
                    <div className="absolute inset-0 flex items-end justify-around px-4">
                        {data.map((d, i) => {
                            const total = d.laporan_terkirim + d.tidak_lengkap + d.belum_absensi;
                            const h = (total / axisMax) * chartH;
                            return (
                                <div
                                    key={d.date}
                                    className="flex flex-col items-center justify-end cursor-pointer group"
                                    style={{ height: chartH, width: 80 }}
                                    onMouseEnter={() => setHover(i)}
                                    onMouseLeave={() => setHover(null)}
                                >
                                    <div
                                        className="w-16 rounded-t-md shadow-sm transition-opacity group-hover:opacity-90"
                                        style={{ height: h, background: '#5B4FE5' }}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* tooltip */}
                    {hover !== null && data[hover] && (
                        <div
                            className="absolute bg-white rounded-lg shadow-lg border border-gray-100 p-3 text-xs z-10 pointer-events-none"
                            style={{
                                left: `${((hover + 0.5) / data.length) * 100}%`,
                                top: 20,
                                transform: 'translateX(-50%)',
                                minWidth: 150,
                            }}
                        >
                            <p className="font-bold text-gray-800 mb-1">
                                {new Date(data[hover].date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                            </p>
                            <p className="text-green-600">Laporan Terkirim : {data[hover].laporan_terkirim}</p>
                            <p className="text-amber-500">Tidak Lengkap : {data[hover].tidak_lengkap}</p>
                            <p className="text-red-500">Belum Absensi : {data[hover].belum_absensi}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* X axis labels */}
            <div className="flex ml-8">
                <div className="flex-1 flex justify-around px-4">
                    {data.map((d) => (
                        <span key={d.date} className="text-[11px] text-gray-400 text-center" style={{ width: 80 }}>
                            {new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ---------------- Calendar list ---------------- */
function WfhCalendar({ monthLabel, calendar }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm h-full">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Kalender WFH {monthLabel}</h3>
            <div className="space-y-2.5">
                {calendar.map((c) => (
                    <div
                        key={c.date}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl border text-sm ${
                            c.is_focus
                                ? 'bg-blue-50 border-blue-100'
                                : 'bg-white border-gray-100'
                        }`}
                    >
                        <Calendar
                            size={16}
                            className={c.is_focus ? 'text-blue-500' : 'text-gray-400'}
                        />
                        <span className={`font-medium ${c.is_focus ? 'text-blue-600' : 'text-gray-600'}`}>
                            {c.label}
                        </span>
                        {c.is_current && (
                            <span className="ml-auto bg-indigo-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                Terkini
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ---------------- Page ---------------- */
export default function DashboardAdmin() {
    const { hasPermission } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const navigate = useNavigate();

    const loadStats = () =>
        getDashboardStats({ month: 7, year: 2026 })
            .then(setData)
            .catch((e) => setError(e.response?.data?.message || 'Gagal memuat data dashboard.'))
            .finally(() => setLoading(false));

    useEffect(() => {
        loadStats();
    }, []);

    if (loading) {
        return (
            <div className="max-w-[1200px] mx-auto space-y-6">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <SkeletonBlock className="h-72" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SkeletonBlock className="h-64" />
                    <SkeletonBlock className="h-64" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
                {error}
            </div>
        );
    }

    const { stats, chart, calendar, field, month_label, focus_date_label } = data;

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Dashboard Admin</h1>

            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Users}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-500"
                    value={stats.total_pegawai}
                    label="Total Pegawai"
                />
                <StatCard
                    icon={ClipboardCheck}
                    iconBg="bg-green-50"
                    iconColor="text-green-500"
                    value={stats.laporan_terkirim}
                    label="Laporan Terkirim"
                    sub={focus_date_label}
                />
                <StatCard
                    icon={FileClock}
                    iconBg="bg-amber-50"
                    iconColor="text-amber-500"
                    value={stats.laporan_pending}
                    label="Laporan Pending"
                />
                <StatCard
                    icon={CheckCircle2}
                    iconBg="bg-pink-50"
                    iconColor="text-pink-500"
                    value={stats.wfh_selesai ? 'Selesai' : 'Berjalan'}
                    valueSmall
                    label="WFH Jumat Ini"
                    sub={focus_date_label}
                />
            </div>

            {/* Chart + Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800">Kepatuhan WFH Per Jumat</h3>
                    <p className="text-xs text-gray-400 mb-5">
                        {field?.name ?? 'Semua Bidang'}, {month_label}
                    </p>
                    <ComplianceChart chart={chart} />
                </div>
                <div className="lg:col-span-1">
                    <WfhCalendar monthLabel={month_label} calendar={calendar} />
                </div>
            </div>

            {/* Status bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-sm font-bold text-gray-800">
                        Status Laporan WFH- {focus_date_label}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {field?.name ?? 'Semua Bidang'}, {focus_date_label}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/status-laporan')}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                    Lihat Semua
                </button>
            </div>



            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg">
                    {toast}
                </div>
            )}
        </div>
    );
}
