import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Send, Loader2, CheckCircle2, XCircle, ClipboardList, FileDown, ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { wfhApi } from '../../api/wfh';
import { useAuth } from '../../context/AuthContext';
import { printWfhReport } from '../../pdf';

/* ---------------- Status Badge ---------------- */
function StatusBadge({ status }) {
    const map = {
        draft: 'bg-[#FCD9CC] text-[#C2410C]',
        pending: 'bg-[#FEE9C7] text-[#B45309]',
        approved: 'bg-[#C9F2D6] text-[#15803D]',
        rejected: 'bg-red-100 text-red-600',
    };
    const label = {
        draft: 'Draf', pending: 'Menunggu',
        approved: 'Disetujui', rejected: 'Ditolak',
    };
    return (
        <span className={`inline-block px-4 py-1 rounded-full text-xs font-semibold ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {label[status] ?? status}
        </span>
    );
}

/* ---------------- Stat Card ---------------- */
function StatCard({ label, value }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 pt-5 pb-6">
            <p className="text-center text-base font-bold text-gray-800 pb-3 border-b border-gray-100">{label}</p>
            <p className="text-center text-3xl font-extrabold text-gray-900 mt-4">{value}</p>
        </div>
    );
}

/* current time in HH:MM format */
function nowHHMM() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function fmtTime(t) {
    if (!t) return '?';
    // handle "12:22" or "2026-07-21T05:22:54.000000Z"
    const p = t.includes('T') ? t.split('T')[1] : t.includes(' ') ? t.split(' ')[1] : t;
    return p.slice(0, 5);
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(d) {
    if (!d) return '-';
    const p = d.split('-');
    if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
    return d;
}

function getWeekRange(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay(); // 0=Sun
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const mon = new Date(d.setDate(diff));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return {
        date_from: mon.toISOString().slice(0, 10),
        date_to: sun.toISOString().slice(0, 10),
    };
}

function getMonthRange(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
        date_from: first.toISOString().slice(0, 10),
        date_to: last.toISOString().slice(0, 10),
    };
}

const EMPTY_FORM = { start: nowHHMM(), end: '', activity: '', link: '' };

export default function LaporanKegiatan() {
    const { user, hasPermission } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [editingActivityIdx, setEditingActivityIdx] = useState(null);

    /* ── Filter / period ── */
    const [viewMode, setViewMode] = useState('daily'); // daily | weekly | monthly
    const [selectedDate, setSelectedDate] = useState(todayStr());

    const dateRange = (() => {
        if (viewMode === 'daily') return { date_from: selectedDate, date_to: selectedDate };
        if (viewMode === 'weekly') return getWeekRange(selectedDate);
        return getMonthRange(selectedDate);
    })();

    const navigatePeriod = (dir) => {
        const d = new Date(selectedDate + 'T00:00:00');
        if (viewMode === 'daily') d.setDate(d.getDate() + dir);
        else if (viewMode === 'weekly') d.setDate(d.getDate() + dir * 7);
        else d.setMonth(d.getMonth() + dir);
        setSelectedDate(d.toISOString().slice(0, 10));
    };

    const periodLabel = (() => {
        if (viewMode === 'daily') return formatDate(selectedDate);
        if (viewMode === 'weekly') {
            const r = getWeekRange(selectedDate);
            return `${formatDate(r.date_from)} — ${formatDate(r.date_to)}`;
        }
        const d = new Date(selectedDate + 'T00:00:00');
        return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    })();

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await wfhApi.getReports({
                date_from: dateRange.date_from,
                date_to: dateRange.date_to,
                per_page: 100,
            });
            setRows(res.data.data || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Gagal memuat laporan.');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [dateRange.date_from, dateRange.date_to]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    /* aggregate stats */
    const totalKegiatan = rows.reduce((sum, r) => sum + (r.activities?.length ?? 0), 0);
    const totalMinutes = rows.reduce((sum, r) => {
        if (!r.activities) return sum;
        return r.activities.reduce((s, a) => {
            const toMin = (t) => {
                if (!t) return 0;
                const [h, m] = t.split(':').map(Number);
                return (h || 0) * 60 + (m || 0);
            };
            const diff = toMin(fmtTime(a.end_time)) - toMin(fmtTime(a.start_time));
            return s + (diff > 0 ? diff : 0);
        }, sum);
    }, 0);
    const totalWaktu = `${Math.floor(totalMinutes / 60)}j ${totalMinutes % 60}m`;

    /* ── Form handling ── */

    // Find today's draft report (so we can append to it)
    const todayDraft = rows.find(r => r.report_date === todayStr() && r.status === 'draft');

    // "Tambah Kegiatan" — append to today's draft or create new report
    const openAdd = () => {
        setForm({ ...EMPTY_FORM, start: nowHHMM() });
        if (todayDraft) {
            // Append to existing today's draft
            setEditingId(todayDraft.id);
            setEditingActivityIdx(null); // new activity
        } else {
            setEditingId(null);
            setEditingActivityIdx(null);
        }
        setShowModal(true);
    };

    // "Edit" — edit a specific activity in a report
    const openEdit = (report, activityIdx) => {
        const a = report.activities[activityIdx];
        setForm({
            start: fmtTime(a.start_time),
            end: fmtTime(a.end_time),
            activity: a.activity || '',
            link: a.links?.[0]?.url || '',
        });
        setEditingId(report.id);
        setEditingActivityIdx(activityIdx);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const td = todayStr();
            if (editingId) {
                // Update existing report: merge old activities with new/changed one
                const target = rows.find(r => r.id === editingId);
                const oldActs = target?.activities ?? [];

                let newActivities;
                if (editingActivityIdx !== null && editingActivityIdx < oldActs.length) {
                    // Editing an existing activity
                    newActivities = oldActs.map((a, i) =>
                        i === editingActivityIdx
                            ? {
                                start_time: form.start,
                                end_time: form.end,
                                activity: form.activity,
                                ...(form.link ? { links: [form.link] } : {}),
                            }
                            : {
                                start_time: fmtTime(a.start_time),
                                end_time: fmtTime(a.end_time),
                                activity: a.activity,
                                ...(a.links?.length ? { links: a.links.map(l => l.url) } : {}),
                            }
                    );
                } else {
                    // Appending new activity
                    newActivities = [
                        ...oldActs.map(a => ({
                            start_time: fmtTime(a.start_time),
                            end_time: fmtTime(a.end_time),
                            activity: a.activity,
                            ...(a.links?.length ? { links: a.links.map(l => l.url) } : {}),
                        })),
                        {
                            start_time: form.start,
                            end_time: form.end,
                            activity: form.activity,
                            ...(form.link ? { links: [form.link] } : {}),
                        },
                    ];
                }

                await wfhApi.updateReport(editingId, {
                    activities: newActivities,
                    report_date: target?.report_date || td,
                });
            } else {
                // Create new report with this one activity
                await wfhApi.createReport({
                    activities: [{
                        start_time: form.start,
                        end_time: form.end,
                        activity: form.activity,
                        ...(form.link ? { links: [form.link] } : {}),
                    }],
                    report_date: td,
                });
            }
            setShowModal(false);
            await fetchReports();
            showToast('success', 'Kegiatan tersimpan.');
        } catch (e) {
            showToast('error', e.response?.data?.message || 'Gagal menyimpan laporan.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus laporan ini?')) return;
        try {
            await wfhApi.deleteReport(id);
            await fetchReports();
            showToast('success', 'Kegiatan dihapus.');
        } catch (e) {
            showToast('error', e.response?.data?.message || 'Gagal menghapus laporan.');
        }
    };

    const handleDownloadPdf = async (id) => {
        try {
            // Cari semua report di tanggal yang sama
            const report = rows.find(r => r.id === id);
            const sameDateReports = report
                ? rows.filter(r => r.report_date === report.report_date)
                : [];

            // Fetch report pertama buat data user & supervisor
            const res = await wfhApi.getReport(id);
            const r = res.data?.data ?? res.data ?? {};
            const u = r.user ?? {};
            const s = r.supervisor ?? {};

            // Gabung kegiatan dari semua report di tanggal sama
            const allKegiatan = [];
            for (const sr of sameDateReports) {
                for (const a of (sr.activities ?? [])) {
                    allKegiatan.push({
                        waktu: a.start_time && a.end_time ? `${fmtTime(a.start_time)} - ${fmtTime(a.end_time)}` : fmtTime(a.start_time),
                        kegiatan: a.activity,
                        links: (a.links ?? []).map((l) => l.url).filter(Boolean),
                    });
                }
            }

            printWfhReport({
                nama: u.name || user?.name || '-',
                nip: u.nip || user?.nip || '-',
                pangkat: u.rank || user?.rank || '-',
                jabatan: u.position || user?.position || '-',
                unitKerja: user?.team?.name || '-',
                tanggalPelaksanaan: r.report_date || '-',
                kegiatan: allKegiatan,
                isApproved: r.status === 'approved',
                makerName: u.name || user?.name,
                makerNip: u.nip || user?.nip,
                makerSignatureUrl: u.signature_url || null,
                supervisorName: s.name || '-',
                supervisorNip: s.nip || '-',
                supervisorSignatureUrl: s.signature_url || null,
                city: 'Surabaya',
            });
        } catch (e) {
            showToast('error', e.response?.data?.message || 'Gagal mencetak laporan.');
        }
    };

    const handleSubmit = async (id) => {
        try {
            await wfhApi.submitReport(id);
            await fetchReports();
            showToast('success', 'Laporan berhasil dikirim.');
        } catch (e) {
            showToast('error', e.response?.data?.message || 'Gagal mengirim laporan.');
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900">Laporan Kegiatan</h1>
            <p className="text-sm text-gray-500 mt-1">{today}</p>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
            )}

            {/* Filter / period */}
            <div className="flex items-center gap-3 mt-6 flex-wrap">
                {/* Mode */}
                <div className="relative">
                    <select
                        value={viewMode}
                        onChange={(e) => { setViewMode(e.target.value); setSelectedDate(todayStr()); }}
                        className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="daily">Harian</option>
                        <option value="weekly">Mingguan</option>
                        <option value="monthly">Bulanan</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Nav */}
                <div className="flex items-center gap-1">
                    <button onClick={() => navigatePeriod(-1)} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition-colors cursor-pointer" title="Sebelumnya">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-semibold text-gray-700 min-w-[180px] text-center select-none">{periodLabel}</span>
                    <button onClick={() => navigatePeriod(1)} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition-colors cursor-pointer" title="Selanjutnya">
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Date / Month picker */}
                {viewMode === 'daily' && (
                    <div className="relative">
                        <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none z-10" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}
                {viewMode === 'monthly' && (
                    <div className="relative">
                        <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none z-10" />
                        <input
                            type="month"
                            value={selectedDate.slice(0, 7)}
                            onChange={(e) => setSelectedDate(e.target.value + '-01')}
                            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}

                <button
                    onClick={() => setSelectedDate(todayStr())}
                    className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                    Hari Ini
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 max-w-2xl">
                <StatCard label="Total Kegiatan" value={totalKegiatan} />
                <StatCard label="Total Waktu Kerja" value={totalWaktu} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6 flex-wrap">
                {hasPermission('wfh.report.create') && (
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-colors"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Tambah Kegiatan
                    </button>
                )}
                {rows.length > 0 && hasPermission('wfh.report.submit') && (
                    <button
                        onClick={() => {
                            rows.filter(r => r.status === 'draft').forEach(r => handleSubmit(r.id));
                        }}
                        disabled={saving}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-colors"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Kirim Semua Laporan
                    </button>
                )}
            </div>

            {/* Table — grouped by report, each shows all activities */}
            <div className="bg-white rounded-2xl border border-gray-200 mt-6 overflow-hidden">
                {/* Desktop table */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full min-w-[720px]">
                        <thead>
                            <tr className="text-gray-700 text-sm font-bold border-b border-gray-100">
                                <th className="text-left px-8 py-5">Tanggal</th>
                                <th className="text-left px-6 py-5">Jam Kerja</th>
                                <th className="text-left px-6 py-5">Kegiatan</th>
                                <th className="text-left px-6 py-5">Link</th>
                                <th className="text-center px-6 py-5">Status</th>
                                <th className="px-6 py-5" />
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-0 py-0"><SkeletonTable rows={4} cols={6} /></td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-16 text-sm text-gray-400"><ClipboardList size={40} className="mx-auto mb-3 opacity-50" />Belum ada kegiatan.</td></tr>
                            ) : rows.map((r) => {
                                const acts = r.activities ?? [];
                                const rowspan = Math.max(acts.length, 1);
                                return acts.map((a, idx) => (
                                    <tr key={`${r.id}-${idx}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                                        {idx === 0 && (
                                            <td className="px-8 py-4 text-sm text-gray-600 align-top" rowSpan={rowspan}>
                                                {formatDate(r.report_date)}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                            {fmtTime(a.start_time)} – {fmtTime(a.end_time)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-[240px]">{a.activity}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {a.links?.[0]?.url ? (
                                                <a href={a.links[0].url} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline break-all">
                                                    {a.links[0].url}
                                                </a>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center align-top">
                                            {idx === 0 ? <StatusBadge status={r.status} /> : ''}
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex items-center justify-end gap-3">
                                                {r.status === 'draft' && hasPermission('wfh.report.update') && (
                                                    <button onClick={() => openEdit(r, idx)} className="text-gray-500 hover:text-brand-500 transition-colors" title="Edit">
                                                        <Pencil size={17} />
                                                    </button>
                                                )}
                                                {idx === 0 && r.status === 'draft' && hasPermission('wfh.report.submit') && (
                                                    <button onClick={() => handleSubmit(r.id)} className="text-blue-600 hover:text-blue-700 transition-colors" title="Kirim">
                                                        <Send size={17} />
                                                    </button>
                                                )}
                                                {idx === 0 && hasPermission('wfh.report.export_pdf') && (
                                                    <button onClick={() => handleDownloadPdf(r.id)} className="text-indigo-500 hover:text-indigo-600 transition-colors" title="Cetak Laporan">
                                                        <FileDown size={17} />
                                                    </button>
                                                )}
                                                {idx === 0 && hasPermission('wfh.report.delete') && (
                                                    <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Hapus">
                                                        <Trash2 size={17} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ));
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-50">
                    {loading ? (
                        <div className="px-4 py-6"><SkeletonTable rows={3} cols={1} /></div>
                    ) : rows.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400"><ClipboardList size={40} className="mx-auto mb-3 opacity-50" />Belum ada kegiatan.</div>
                    ) : rows.map((r) => {
                        const acts = r.activities ?? [];
                        return (
                            <div key={r.id} className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700">{formatDate(r.report_date)}</span>
                                    <StatusBadge status={r.status} />
                                </div>
                                {acts.map((a, idx) => (
                                    <div key={idx} className="border-l-2 border-gray-200 pl-3 space-y-1">
                                        <span className="text-xs text-gray-500">{fmtTime(a.start_time)} – {fmtTime(a.end_time)}</span>
                                        <p className="text-sm text-gray-600">{a.activity}</p>
                                        {a.links?.[0]?.url && (
                                            <a href={a.links[0].url} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline break-all text-sm block">
                                                {a.links[0].url}
                                            </a>
                                        )}
                                        {r.status === 'draft' && hasPermission('wfh.report.update') && (
                                            <button onClick={() => openEdit(r, idx)} className="flex items-center gap-1 text-gray-500 hover:text-brand-500 text-sm pt-1">
                                                <Pencil size={14} /> Edit
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {r.status === 'draft' && hasPermission('wfh.report.submit') && (
                                    <button onClick={() => handleSubmit(r.id)} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm">
                                        <Send size={15} /> Kirim
                                    </button>
                                )}
                                {hasPermission('wfh.report.export_pdf') && (
                                    <button onClick={() => handleDownloadPdf(r.id)} className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 text-sm">
                                        <FileDown size={15} /> Cetak
                                    </button>
                                )}
                                {hasPermission('wfh.report.delete') && (
                                    <button onClick={() => handleDelete(r.id)} className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm">
                                        <Trash2 size={15} /> Hapus
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}
                >
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    {toast.message}
                </div>
            )}

            {/* Add / Edit modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingId && editingActivityIdx !== null ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
                footer={
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button type="submit" form="form-kegiatan" disabled={saving}>
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                }
            >
                <form id="form-kegiatan" onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Jam Mulai</label>
                            <input
                                type="text" value={form.start}
                                onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                                placeholder="08:00" required
                                className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                            />
                            <p className="text-[10px] text-gray-400 mt-0.5">Format HH:MM · otomatis terisi waktu sekarang</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Jam Selesai</label>
                            <input
                                type="text" value={form.end}
                                onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                                placeholder="10:00" required
                                className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Kegiatan</label>
                        <textarea
                            value={form.activity}
                            onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value }))}
                            placeholder="Jelaskan kegiatan Anda..." required rows={3}
                            className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Link Bukti</label>
                        <input
                            type="url" value={form.link}
                            onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                            placeholder="https://drive.google.com/..."
                            className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
