import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Filter, RefreshCw, FileDown, Search, ChevronDown, Check, X,
    Eye, MessageSquare, Download, Loader2,
} from 'lucide-react';
import { getMonitoringBoard, getReportDetail, approveReport, rejectReport } from '../../api/admin';
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

// Status laporan (report.status) — beda dari status board di atas.
const REPORT_STATUS = {
    draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
    pending: { label: 'Menunggu Persetujuan', cls: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Disetujui', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
};

function fmtDateTime(t) {
    if (!t) return null;
    const d = new Date(t);
    return isNaN(d) ? t : d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const pad2 = (n) => String(n).padStart(2, '0');
const toDateStr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// Default ke hari Jumat terakhir (hari WFH) secara dinamis, bukan tanggal statis.
function mostRecentFriday() {
    const d = new Date();
    const diff = (d.getDay() - 5 + 7) % 7; // 5 = Jumat
    d.setDate(d.getDate() - diff);
    return toDateStr(d);
}
const DEFAULT_DATE = mostRecentFriday();

// Semua hari Jumat (hari WFH) dalam sebuah bulan 'YYYY-MM'.
function fridaysInMonth(ym) {
    if (!ym) return [];
    const [y, m] = ym.split('-').map(Number);
    const res = [];
    const d = new Date(y, m - 1, 1);
    while (d.getMonth() === m - 1) {
        if (d.getDay() === 5) res.push(toDateStr(d));
        d.setDate(d.getDate() + 1);
    }
    return res;
}

// Pilih Jumat default dalam bulan: Jumat terakhir yang <= hari ini, jika tidak ada
// (bulan masa depan) pakai Jumat pertama.
function pickFridayForMonth(fridays) {
    if (!fridays.length) return '';
    const today = toDateStr(new Date());
    const past = fridays.filter((d) => d <= today);
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
    const canApprove = hasPermission('wfh.report.approve');
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
    const token = localStorage.getItem('token');
    const handleGeneratePdf = () => {
        if (!teamId) return;
        const url = `/api/admin/wfh/teams/${teamId}/pdf?date=${date}${token ? `&token=${token}` : ''}`;
        window.open(url, '_blank');
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-5 relative">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Monitoring WFH</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Filter bulan */}
                    <div className="relative flex items-center">
                        <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none z-10" />
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
                    <button
                        onClick={handleGeneratePdf}
                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                        <FileDown size={15} />
                        Generate Semua PDF
                    </button>
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
                                        <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="animate-spin inline text-blue-600" /></td></tr>
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
                                                        <PreviewDropdown emp={emp} date={date} onSendReminder={handleSendReminder} canApprove={canApprove} onChanged={fetchBoard} />
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
                                <div className="py-16 text-center"><Loader2 className="animate-spin inline text-blue-600" /></div>
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
                                            <PreviewDropdown emp={emp} date={date} onSendReminder={handleSendReminder} canApprove={canApprove} onChanged={fetchBoard} />
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

function PreviewDropdown({ emp, date, onSendReminder, canApprove, onChanged }) {
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

    const handleDownload = () => {
        window.open(`/api/wfh/reports/${emp.report_id}/pdf${token ? `?token=${token}` : ''}`, '_blank');
        setOpen(false);
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
                    canApprove={canApprove}
                    onChanged={onChanged}
                    onClose={() => setShowDetail(false)}
                />
            )}
        </div>
    );
}

function ReportDetailModal({ reportId, empName, date, canApprove, onChanged, onClose }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [acting, setActing] = useState(false);
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionMsg, setActionMsg] = useState('');

    useEffect(() => {
        if (!reportId) {
            setLoading(false);
            return;
        }
        getReportDetail(reportId)
            .then(setReport)
            .catch((e) => setError(e.response?.data?.message || 'Gagal memuat laporan.'))
            .finally(() => setLoading(false));
    }, [reportId]);

    const doApprove = async () => {
        setActing(true);
        setActionMsg('');
        try {
            await approveReport(reportId);
            onChanged?.();
            onClose();
        } catch (e) {
            setActionMsg(e.response?.data?.message || 'Gagal menyetujui laporan.');
        } finally {
            setActing(false);
        }
    };

    const doReject = async () => {
        if (!rejectReason.trim()) {
            setActionMsg('Alasan penolakan wajib diisi.');
            return;
        }
        setActing(true);
        setActionMsg('');
        try {
            await rejectReport(reportId, rejectReason.trim());
            onChanged?.();
            onClose();
        } catch (e) {
            setActionMsg(e.response?.data?.message || 'Gagal menolak laporan.');
        } finally {
            setActing(false);
        }
    };

    const rs = REPORT_STATUS[report?.status] ?? null;
    const showActions = canApprove && report?.status === 'pending';

    return (
        <Modal open onClose={onClose} title={`Laporan WFH — ${empName}`} width="max-w-2xl">
            {loading ? (
                <div className="py-10 text-center"><Loader2 className="animate-spin inline text-blue-600" /></div>
            ) : !reportId ? (
                <div className="p-4 bg-slate-50 text-slate-500 text-sm rounded-lg text-center">
                    Pegawai belum mengirim laporan untuk tanggal ini.
                </div>
            ) : error ? (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                        <span className="text-gray-400">Tanggal:</span>
                        <span className="font-semibold text-gray-800">{report?.report_date ?? date}</span>
                        {rs && <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${rs.cls}`}>{rs.label}</span>}
                    </div>

                    {/* Activities + links */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Aktivitas & Bukti Kerja</p>
                        {(report?.activities?.length ?? 0) === 0 ? (
                            <p className="text-sm text-gray-400">Belum ada aktivitas.</p>
                        ) : (
                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-left text-xs text-gray-500">
                                            <th className="px-4 py-2">Waktu</th>
                                            <th className="px-4 py-2">Aktivitas</th>
                                            <th className="px-4 py-2">Link Bukti</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.activities.map((a) => (
                                            <tr key={a.id} className="border-t border-gray-50 align-top">
                                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{fmtTime(a.start_time)}–{fmtTime(a.end_time)}</td>
                                                <td className="px-4 py-2 text-gray-700">{a.activity}</td>
                                                <td className="px-4 py-2">
                                                    {(a.links?.length ?? 0) === 0 ? (
                                                        <span className="text-gray-300">-</span>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {a.links.map((l) => (
                                                                <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all block text-xs">
                                                                    {l.url}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Signature status */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="border border-gray-100 rounded-lg p-3">
                            <p className="text-gray-400">TTD Pegawai</p>
                            <p className={`font-semibold ${report?.maker_signed_at ? 'text-green-600' : 'text-gray-400'}`}>
                                {report?.maker_signed_at ? `Ditandatangani · ${fmtDateTime(report.maker_signed_at)}` : 'Belum ditandatangani'}
                            </p>
                        </div>
                        <div className="border border-gray-100 rounded-lg p-3">
                            <p className="text-gray-400">TTD Atasan</p>
                            <p className={`font-semibold ${report?.supervisor_signed_at ? 'text-green-600' : 'text-gray-400'}`}>
                                {report?.supervisor_signed_at ? `Disetujui · ${fmtDateTime(report.supervisor_signed_at)}` : 'Belum disetujui'}
                            </p>
                        </div>
                    </div>

                    {/* Reject reason */}
                    {report?.status === 'rejected' && report?.reject_reason && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                            <span className="font-semibold">Alasan ditolak: </span>{report.reject_reason}
                        </div>
                    )}

                    {actionMsg && <div className="p-2 bg-red-50 text-red-600 text-sm rounded-lg">{actionMsg}</div>}

                    {/* Approve / Reject actions */}
                    {showActions && (
                        rejectMode ? (
                            <div className="space-y-2 border-t border-gray-100 pt-4">
                                <label className="block text-sm text-gray-600">Alasan Penolakan</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={3}
                                    placeholder="Jelaskan alasan penolakan..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => { setRejectMode(false); setActionMsg(''); }} disabled={acting} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">Batal</button>
                                    <button onClick={doReject} disabled={acting} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">
                                        {acting ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />} Kirim Penolakan
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                                <button onClick={() => setRejectMode(true)} disabled={acting} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
                                    <X size={15} /> Tolak
                                </button>
                                <button onClick={doApprove} disabled={acting} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
                                    {acting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Setujui
                                </button>
                            </div>
                        )
                    )}
                </div>
            )}
        </Modal>
    );
}
