
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Send, Loader2, CheckCircle2, XCircle, ClipboardList, FileDown, Calendar, ChevronDown } from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { getReports, createReport, updateReport, deleteReport, submitReport } from '../../api/reports';
import { useAuth } from '../../context/AuthContext';
import { assetUrl } from '../../utils/url';
import { printWfhReport } from '../../pdf';

/* ---------------- Status Badge ---------------- */
// Status laporan dari backend: draft → pending → approved/rejected.
const STATUS_LABEL = { draft: 'Draf', pending: 'Menunggu Persetujuan', approved: 'Disetujui', rejected: 'Ditolak' };

function StatusBadge({ status }) {
    const map = {
        draft: 'bg-gray-100 text-gray-600',
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-600',
    };
    return (
        <span className={`inline-block px-4 py-1 rounded-full text-xs font-semibold ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[status] ?? status}
        </span>
    );
}

/* ---------------- Stat Card ---------------- */
function StatCard({ label, value }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 pt-5 pb-6">
            <p className="text-center text-base font-bold text-gray-800 pb-3 border-b border-gray-100">
                {label}
            </p>
            <p className="text-center text-3xl font-extrabold text-gray-900 mt-4">{value}</p>
        </div>
    );
}

const EMPTY_FORM = { start: '', end: '', activity: '', link: '' };

/** Local YYYY-MM-DD (avoids UTC shift from toISOString). */
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Normalisasi ke "HH:mm" (format H:i backend). Menerima "08.00"/"8:0"/"0800". */
function toApiTime(t) {
    if (!t) return '';
    const cleaned = String(t).trim().replace(/[.]/g, ':');
    const [h = '0', m = '0'] = cleaned.split(':');
    return `${String(parseInt(h, 10) || 0).padStart(2, '0')}:${String(parseInt(m, 10) || 0).padStart(2, '0')}`;
}

/** Ambil "HH:mm" dari berbagai format backend ("08:00:00" atau "2026-07-03T08:00:00"). */
function toTimeInput(t) {
    if (!t) return '';
    const m = String(t).match(/(\d{1,2}):(\d{2})/);
    return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
}

export default function LaporanKegiatan() {
    const { user } = useAuth();
    const [report, setReport] = useState(null); // full report object from backend (or null)
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);

    const [toast, setToast] = useState(null);
    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const status = report?.status ?? 'draft';
    const editable = !report || status === 'draft' || status === 'rejected';

    const mapActivities = (activities = []) =>
        activities.map((a) => ({
            id: a.id ?? Date.now() + Math.random(),
            start: toTimeInput(a.start_time),
            end: toTimeInput(a.end_time),
            activity: a.activity,
            link: a.links?.[0]?.url ?? '',
        }));

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            const res = await getReports({ per_page: 50 });
            const list = res.data ?? [];
            const iso = todayISO();
            const todays = list.find((r) => r.report_date === iso) ?? null;
            setReport(todays);
            setRows(todays ? mapActivities(todays.activities) : []);
        } catch (err) {
            setLoadError(err.response?.data?.message || 'Gagal memuat laporan.');
        } finally {
            setLoading(false);
        }
    }, [monthRange.date_from, monthRange.date_to]);

    useEffect(() => { load(); }, [load]);

    const totalKegiatan = rows.length;
    const totalMinutes = rows.reduce((sum, r) => {
        const toMin = (t) => {
            const [h, m] = String(t || '0:0').replace('.', ':').split(':').map(Number);
            return (h || 0) * 60 + (m || 0);
        };
        const diff = toMin(r.end) - toMin(r.start);
        return sum + (diff > 0 ? diff : 0);
    }, 0);
    const totalWaktu = `${Math.floor(totalMinutes / 60)}j ${totalMinutes % 60}m`;

    /** Persist the full activity list as a report (create or update). */
    const persist = async (list) => {
        const activities = list.map((r) => ({
            start_time: toApiTime(r.start),
            end_time: toApiTime(r.end),
            activity: r.activity,
            links: r.link ? [r.link] : [],
        }));

        if (list.length === 0) {
            // Backend requires at least one activity → delete the report instead.
            if (report?.id) {
                await deleteReport(report.id);
                setReport(null);
            }
            return;
        }

        const payload = { report_date: report?.report_date ?? todayISO(), activities };
        if (report?.id) {
            const res = await updateReport(report.id, payload);
            setReport(res.data);
            setRows(mapActivities(res.data.activities));
        } else {
            const res = await createReport(payload);
            setReport(res.data);
            setRows(mapActivities(res.data.activities));
        }
    };

    const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };
    const openEdit = (row) => {
        setForm({ start: row.start, end: row.end, activity: row.activity, link: row.link });
        setEditingId(row.id);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const next = editingId
            ? rows.map((r) => (r.id === editingId ? { ...r, ...form } : r))
            : [...rows, { id: Date.now(), ...form }];

        setSaving(true);
        try {
            await persist(next);
            setShowModal(false);
            showToast('success', 'Kegiatan tersimpan.');
        } catch (err) {
            const msg = err.response?.data?.message
                || Object.values(err.response?.data?.errors ?? {})[0]?.[0]
                || 'Gagal menyimpan kegiatan.';
            showToast('error', msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const next = rows.filter((r) => r.id !== id);
        try {
            await persist(next);
            if (next.length === 0) setRows([]);
            showToast('success', 'Kegiatan dihapus.');
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Gagal menghapus kegiatan.');
        }
    };

    const formatTanggal = (d) => {
        const src = d ?? todayISO();
        return new Date(src).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const handleDownloadPdf = () => {
        const sigPath = user?.signature_path;
        const sup = report?.supervisor;
        printWfhReport({
            nama: user?.name ?? '-',
            nip: user?.nip ?? '-',
            pangkat: user?.rank || '-',
            jabatan: user?.position || '-',
            unitKerja: user?.team?.field?.name || '-',
            tanggalPelaksanaan: formatTanggal(report?.report_date),
            kegiatan: rows.map((r) => ({
                waktu: `${r.start} – ${r.end}`,
                kegiatan: r.activity,
                links: r.link ? [r.link] : [],
            })),
            isApproved: status === 'approved',
            makerName: (user?.name || '').toUpperCase(),
            makerNip: user?.nip ?? '-',
            makerSignatureUrl: sigPath ? assetUrl(`/storage/${sigPath}`) : null,
            supervisorName: sup?.name ? sup.name.toUpperCase() : '-',
            supervisorNip: sup?.nip ?? '-',
            supervisorSignatureUrl: sup?.signature_path ? assetUrl(`/storage/${sup.signature_path}`) : null,
        });
    };

    const handleSubmitReport = async () => {
        if (!report?.id) {
            showToast('error', 'Tambahkan kegiatan terlebih dahulu.');
            return;
        }
        setSaving(true);
        try {
            const res = await submitReport(report.id);
            setReport(res.data ?? { ...report, status: 'submitted' });
            showToast('success', 'Laporan berhasil dikirim.');
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Gagal mengirim laporan.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900">Laporan Kegiatan</h1>

            {loadError && <div className="mt-6"><ErrorAlert message={loadError} onRetry={load} /></div>}

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 max-w-2xl">
                <StatCard label="Total Kegiatan" value={totalKegiatan} />
                <StatCard label="Total Waktu Kerja" value={totalWaktu} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6 flex-wrap">
                {editable && (
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-colors"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Tambah Kegiatan
                    </button>
                )}
                {editable && rows.length > 0 && (
                    <button
                        onClick={handleSubmitReport}
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
                {/* Table header bar */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-800">Rincian Kegiatan</h2>
                </div>

                {/* Desktop table */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full min-w-[720px]">
                        <thead>
                            <tr className="text-gray-700 text-sm font-bold border-b border-gray-100">
                                <th className="text-left px-8 py-5">Jam Kerja</th>
                                <th className="text-left px-6 py-5">Kegiatan</th>
                                <th className="text-left px-6 py-5">Link</th>
                                <th className="text-center px-6 py-5">Status</th>
                                <th className="px-6 py-5" />
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-12 text-gray-400"><Loader2 className="animate-spin inline mr-2" size={18} />Memuat...</td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-16 text-sm text-gray-400"><ClipboardList size={40} className="mx-auto mb-3 opacity-50" />Belum ada kegiatan.</td></tr>
                            ) : rows.map((r) => (
                                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                                    <td className="px-8 py-4 text-sm text-gray-600 whitespace-nowrap">{r.start} – {r.end}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[280px] truncate">{r.activity}</td>
                                    <td className="px-6 py-4 text-sm">
                                        {r.link ? (
                                            <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline break-all">
                                                {r.link}
                                            </a>
                                        ) : <span className="text-gray-400">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center"><StatusBadge status={status} /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-3">
                                            {editable && (
                                                <>
                                                    <button onClick={() => openEdit(r)} className="text-gray-500 hover:text-brand-500 transition-colors" title="Edit">
                                                        <Pencil size={17} />
                                                    </button>
                                                    <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Hapus">
                                                        <Trash2 size={17} />
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={handleDownloadPdf} className="text-gray-500 hover:text-indigo-600 transition-colors" title="Unduh PDF laporan">
                                                <FileDown size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-50">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400"><Loader2 className="animate-spin inline mr-2" size={18} />Memuat...</div>
                    ) : rows.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400"><ClipboardList size={40} className="mx-auto mb-3 opacity-50" />Belum ada kegiatan.</div>
                    ) : rows.map((r) => (
                        <div key={r.id} className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{r.start} – {r.end}</span>
                                <StatusBadge status={status} />
                            </div>
                            <p className="text-sm text-gray-600">{r.activity}</p>
                            {r.link && (
                                <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline break-all text-sm block">
                                    {r.link}
                                </a>
                            )}
                            <div className="flex items-center gap-4 pt-1">
                                {editable && (
                                    <>
                                        <button onClick={() => openEdit(r)} className="flex items-center gap-1 text-gray-500 hover:text-brand-500 text-sm">
                                            <Pencil size={15} /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(r.id)} className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm">
                                            <Trash2 size={15} /> Hapus
                                        </button>
                                    </>
                                )}
                                <button onClick={handleDownloadPdf} className="flex items-center gap-1 text-gray-500 hover:text-indigo-600 text-sm">
                                    <FileDown size={15} /> Unduh
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add / Edit modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingId && editingActivityIdx !== null ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
                footer={
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button type="submit" form="form-kegiatan" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
                    </div>
                }
            >
                <form id="form-kegiatan" onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Jam Mulai</label>
                            <input
                                type="time" value={form.start}
                                onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                                required
                                className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Jam Selesai</label>
                            <input
                                type="time" value={form.end}
                                onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                                required
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
        </div>
    );
}
