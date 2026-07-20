import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Calendar, RefreshCw, FileDown, Search, ChevronDown, Check, X,
    Eye, MessageSquare, Download, Loader2,
} from 'lucide-react';
import axios from 'axios';
import { getMonitoringBoard, getReportDetail } from '../../api/admin';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { wfhApi } from '../../api/wfh';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    { value: 'terkirim', label: 'Terkirim' },
    { value: 'tidak_lengkap', label: 'Tidak Lengkap' },
    { value: 'belum_absensi', label: 'Belum Absensi' },
];

const STATUS_BADGE = {
    terkirim: { label: 'Terkirim', cls: 'bg-green-100 text-green-700' },
    tidak_lengkap: { label: 'Tidak Lengkap', cls: 'bg-yellow-100 text-yellow-700' },
    belum_absensi: { label: 'Belum Absensi', cls: 'bg-slate-300 text-slate-600' },
};

const now = new Date();
const day = now.getDay();
const fri = new Date(now);
fri.setDate(now.getDate() + ((5 - day + 7) % 7));
function mostRecentFriday() {
    const d = new Date();
    const diff = (d.getDay() - 5 + 7) % 7;
    d.setDate(d.getDate() - diff);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

const DEFAULT_DATE = mostRecentFriday();

function fridaysInMonth(ym) {
    if (!ym) return [];
    const [y, m] = ym.split('-').map(Number);
    const res = [];
    const d = new Date(y, m - 1, 1);
    while (d.getMonth() === m - 1) {
        if (d.getDay() === 5) {
            const yy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            res.push(`${yy}-${mm}-${dd}`);
        }
        d.setDate(d.getDate() + 1);
    }
    return res;
}

function pickFridayForMonth(fridays) {
    if (!fridays.length) return '';
    const today = new Date();
    const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const past = fridays.filter((f) => f <= t);
    return past.length ? past[past.length - 1] : fridays[0];
}

function fmtFriday(d) {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtTime(t) {
    if (!t) return '-';
    if (/^\d{2}:\d{2}/.test(t)) return t.slice(0, 5);
    const d = new Date(t);
    return isNaN(d) ? t : d.toISOString().slice(11, 16);
}

export default function MonitorWfh() {
    const { user, hasPermission } = useAuth();
    const [month, setMonth] = useState(DEFAULT_DATE.slice(0, 7));
    const [date, setDate] = useState(DEFAULT_DATE);
    const fridays = useMemo(() => fridaysInMonth(month), [month]);

    const handleMonthChange = (val) => {
        setMonth(val);
        setDate(pickFridayForMonth(fridaysInMonth(val)));
        setPage(1);
    };
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [toast, setToast] = useState('');

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchBoard = useCallback(() => {
        setLoading(true);
        setError('');
        getMonitoringBoard({
            date,
            search: debouncedSearch || undefined,
            status: status || undefined,
            page,
        })
            .then(setData)
            .catch((e) => setError(e.response?.data?.message || 'Gagal memuat data monitoring.'))
            .finally(() => setLoading(false));
    }, [date, debouncedSearch, status, page]);

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    const handleSendReminder = (emp) => {
        // TODO: hubungkan ke endpoint backend pengiriman notifikasi/peringatan
        // saat sudah tersedia (misal: POST /api/admin/wfh/reminders).
        setToast(`Peringatan untuk ${emp.name} akan dikirim setelah fitur notifikasi backend tersedia.`);
        setTimeout(() => setToast(''), 4000);
    };

    const stats = data?.stats;
    const employees = data?.employees ?? [];
    const meta = data?.meta;

    const teamId = user?.team?.id;
    const [pdfLoading, setPdfLoading] = useState(false);
    const handleGeneratePdf = async () => {
        if (!teamId) return;
        setPdfLoading(true);
        try {
            const res = await axios.get(`/api/admin/wfh/teams/${teamId}/pdf`, { params: { date }, responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `WFH-Team-${teamId}-${date}.pdf`;
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            const msg = e.response?.data?.message || e.message || 'Gagal download PDF';
            alert(msg);
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-5 relative">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Monitoring WFH</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Filter bulan */}
                    <div className="relative flex items-center">
                        <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none z-10" />
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => handleMonthChange(e.target.value)}
                            title="Filter bulan WFH"
                            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Pilih Jumat di bulan tsb */}
                    <div className="relative">
                        <select
                            value={date}
                            onChange={(e) => { setDate(e.target.value); setPage(1); }}
                            title="Pilih hari WFH (Jumat)"
                            className="appearance-none pl-4 pr-9 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {fridays.length === 0 ? (
                                <option value="">Tidak ada Jumat</option>
                            ) : (
                                fridays.map((f) => (
                                    <option key={f} value={f}>{fmtFriday(f)}</option>
                                ))
                            )}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                        onClick={fetchBoard}
                        className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Perbarui
                    </button>
                    {hasPermission('wfh.report.export_pdf') && (
                        <button
                            onClick={handleGeneratePdf}
                            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                            {pdfLoading ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
                            {pdfLoading ? 'Memproses...' : 'Generate Semua PDF'}
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[220px] max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari Pegawai"
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="relative">
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label={`WFH ${stats?.month_label?.toUpperCase() ?? ''}`}>
                    <p className="text-2xl font-extrabold text-indigo-600">
                        {stats?.jumat_terlaksana ?? 0} Jumat
                    </p>
                    <p className="text-xs text-gray-400 mb-2">
                        dari {stats?.jumat_total ?? 0} Jumat yang dijadwalkan
                    </p>
                    <div className="flex gap-1">
                        {Array.from({ length: stats?.jumat_total ?? 0 }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full ${i < (stats?.jumat_terlaksana ?? 0) ? 'bg-indigo-500' : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                </StatCard>

                <StatCard label="Total Laporan Masuk">
                    <p className="text-2xl font-extrabold text-gray-900">{stats?.laporan_masuk ?? 0}</p>
                    <p className="text-xs text-gray-400">
                        dari {stats?.laporan_diharapkan ?? 0} total yang diharapkan
                    </p>
                </StatCard>

                <StatCard label="Tingkat Kepatuhan">
                    <p className="text-2xl font-extrabold text-green-600">{stats?.tingkat_kepatuhan ?? 0}%</p>
                    <p className="text-xs text-gray-400">rata-rata 2 Jumat terakhir</p>
                </StatCard>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {error ? (
                    <div className="p-6 text-red-600 text-sm bg-red-50">{error}</div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/70 text-left text-xs font-semibold text-gray-500">
                                        <th className="px-6 py-4">Pegawai</th>
                                        <th className="px-3 py-4 text-center">Pagi</th>
                                        <th className="px-3 py-4 text-center">Siang</th>
                                        <th className="px-3 py-4 text-center">Sore</th>
                                        <th className="px-6 py-4">Status Laporan</th>
                                        <th className="px-6 py-4">Catatan</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-0 py-0"><SkeletonTable rows={5} cols={7} /></td></tr>
                                    ) : employees.length === 0 ? (
                                        <tr><td colSpan={7} className="py-16 text-center text-gray-400 text-sm">Tidak ada pegawai ditemukan.</td></tr>
                                    ) : (
                                        employees.map((emp) => (
                                            <tr key={emp.id} className="border-t border-gray-50 hover:bg-gray-50/40">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar initials={emp.initials} color={emp.avatar_color} />
                                                        <span className="text-sm font-semibold text-gray-800">{emp.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 text-center"><SessionMark ok={emp.sessions.pagi} /></td>
                                                <td className="px-3 py-4 text-center"><SessionMark ok={emp.sessions.siang} /></td>
                                                <td className="px-3 py-4 text-center"><SessionMark ok={emp.sessions.sore} /></td>
                                                <td className="px-6 py-4"><StatusBadge status={emp.report_status} /></td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{emp.catatan}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <PreviewDropdown emp={emp} date={date} onSendReminder={handleSendReminder} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-50">
                            {loading ? (
                                <div className="p-6 space-y-4 animate-pulse">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                                                <div className="h-3 bg-gray-100 rounded w-1/3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : employees.length === 0 ? (
                                <div className="py-16 text-center text-gray-400 text-sm">Tidak ada pegawai ditemukan.</div>
                            ) : (
                                employees.map((emp) => (
                                    <div key={emp.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar initials={emp.initials} color={emp.avatar_color} />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{emp.name}</p>
                                                    <p className="text-xs text-gray-400">{emp.nip}</p>
                                                </div>
                                            </div>
                                            <PreviewDropdown emp={emp} date={date} onSendReminder={handleSendReminder} />
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <SessionPill label="Pagi" ok={emp.sessions.pagi} />
                                            <SessionPill label="Siang" ok={emp.sessions.siang} />
                                            <SessionPill label="Sore" ok={emp.sessions.sore} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <StatusBadge status={emp.report_status} />
                                            <span className="text-xs text-gray-500">{emp.catatan}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Footer / pagination */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-gray-400">
                    Halaman {meta?.current_page ?? 1} dari {meta?.last_page ?? 1}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                        Sebelumnya
                    </button>
                    {Array.from({ length: meta?.last_page ?? 1 }).map((_, i) => {
                        const p = i + 1;
                        return (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-10 h-10 text-sm font-semibold rounded-lg transition-colors ${p === (meta?.current_page ?? 1)
                                    ? 'bg-indigo-500 text-white'
                                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {p}
                            </button>
                        );
                    })}
                    <button
                        disabled={page >= (meta?.last_page ?? 1)}
                        onClick={() => setPage((p) => Math.min(meta?.last_page ?? 1, p + 1))}
                        className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                        Berikutnya
                    </button>
                </div>
            </div>

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg max-w-sm">
                    {toast}
                </div>
            )}
        </div>
    );
}

function StatCard({ label, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">            <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
            {children}
        </div>
    );
}

function Avatar({ initials, color }) {
    return (
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {initials}
        </div>
    );
}

function SessionMark({ ok }) {
    return ok ? (
        <Check size={18} className="text-green-500 inline" strokeWidth={3} />
    ) : (
        <X size={18} className="text-red-500 inline" strokeWidth={3} />
    );
}

function SessionPill({ label, ok }) {
    return (
        <span className="flex items-center gap-1">
            <SessionMark ok={ok} /> {label}
        </span>
    );
}

function StatusBadge({ status }) {
    const meta = STATUS_BADGE[status] ?? STATUS_BADGE.belum_absensi;
    return (
        <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${meta.cls}`}>
            {meta.label}
        </span>
    );
}

function PreviewDropdown({ emp, date, onSendReminder }) {
    const [open, setOpen] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [menuPos, setMenuPos] = useState(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const token = localStorage.getItem('token');

    const MENU_WIDTH = 208; // w-52

    const openMenu = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
            setMenuPos({
                top: rect.bottom + 4,
                left: Math.max(8, rect.right - MENU_WIDTH),
            });
        }
        setOpen(true);
    };

    const toggleMenu = () => (open ? setOpen(false) : openMenu());

    // Tutup dropdown saat klik di luar, scroll, atau resize
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (
                triggerRef.current?.contains(e.target) ||
                menuRef.current?.contains(e.target)
            ) return;
            setOpen(false);
        };
        const handleClose = () => setOpen(false);
        document.addEventListener('mousedown', handleClick);
        window.addEventListener('scroll', handleClose, true);
        window.addEventListener('resize', handleClose);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            window.removeEventListener('scroll', handleClose, true);
            window.removeEventListener('resize', handleClose);
        };
    }, [open]);

    const handleDownload = async () => {
        setOpen(false);
        try {
            const res = await wfhApi.getReportPdf(emp.report_id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `WFH-${emp.name || emp.report_id}.pdf`;
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            const msg = e.response?.data?.message || e.message || 'Gagal download PDF';
            alert(msg);
        }
    };

    const handleReminder = () => {
        onSendReminder?.(emp);
        setOpen(false);
    };

    return (
        <div className="inline-flex flex-col items-center" ref={triggerRef}>
            {/* Trigger: Preview + tombol dropdown */}
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => setShowDetail(true)}
                    title="Preview laporan"
                    className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                    <Eye size={19} />
                    <span className="text-[11px] font-medium text-gray-500">Preview</span>
                </button>
                <button
                    type="button"
                    onClick={toggleMenu}
                    aria-label="Aksi lainnya"
                    aria-expanded={open}
                    className="p-0.5 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                    <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown: Peringatan + Unduh (portal agar tidak terpotong tabel) */}
            {open && menuPos && createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
                    className="bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 text-left"
                >
                    <button
                        onClick={handleReminder}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
                    >
                        <MessageSquare size={16} /> Peringatan
                    </button>
                    <button
                        onClick={handleDownload}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                    >
                        <Download size={16} /> Unduh Perorangan
                    </button>
                </div>,
                document.body
            )}

            {showDetail && (
                <ReportDetailModal
                    reportId={emp.report_id}
                    empName={emp.name}
                    date={date}
                    onClose={() => setShowDetail(false)}
                />
            )}
        </div>
    );
}

function ReportDetailModal({ reportId, empName, date, onClose }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getReportDetail(reportId)
            .then(setReport)
            .catch((e) => setError(e.response?.data?.message || 'Gagal memuat laporan.'))
            .finally(() => setLoading(false));
    }, [reportId]);

    return (
        <Modal open onClose={onClose} title={`Laporan WFH — ${empName}`} width="max-w-2xl">
            {loading ? (
                <div className="p-6 space-y-3 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-full" />
                        <div className="h-3 bg-gray-100 rounded w-5/6" />
                        <div className="h-3 bg-gray-100 rounded w-4/6" />
                    </div>
                </div>
            ) : error ? (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">Tanggal:</span>
                        <span className="font-semibold text-gray-800">{report?.report_date ?? date}</span>
                        <StatusBadge status={report?.status === 'approved' || report?.status === 'pending' ? 'terkirim' : 'tidak_lengkap'} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Aktivitas</p>
                        {(report?.activities?.length ?? 0) === 0 ? (
                            <p className="text-sm text-gray-400">Belum ada aktivitas.</p>
                        ) : (
                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-left text-xs text-gray-500">
                                            <th className="px-4 py-2">Waktu</th>
                                            <th className="px-4 py-2">Aktivitas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.activities.map((a) => (
                                            <tr key={a.id} className="border-t border-gray-50">
                                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{fmtTime(a.start_time)}–{fmtTime(a.end_time)}</td>
                                                <td className="px-4 py-2 text-gray-700">{a.activity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
}
