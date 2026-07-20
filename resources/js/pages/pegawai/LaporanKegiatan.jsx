import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Send } from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { wfhApi } from '../../api/wfh';
import { useAuth } from '../../context/AuthContext';

/* ---------------- Status Badge ---------------- */
function StatusBadge({ status }) {
    const map = {
        draft: 'bg-[#FCD9CC] text-[#C2410C]',
        pending: 'bg-[#FEE9C7] text-[#B45309]',
        approved: 'bg-[#C9F2D6] text-[#15803D]',
        rejected: 'bg-red-100 text-red-700',
    };
    const label = {
        draft: 'Draf', pending: 'Menunggu',
        approved: 'Disetujui', rejected: 'Ditolak',
    };
    const key = status?.toLowerCase();
    return (
        <span className={`inline-block px-4 py-1 rounded-full text-xs font-semibold ${map[key] ?? 'bg-gray-100 text-gray-600'}`}>
            {label[key] ?? status}
        </span>
    );
}

/* ---------------- Stat Card ---------------- */
function StatCard({ label, value }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 pt-5 pb-6">
            <p className="text-center text-base font-bold text-gray-800 pb-3 border-b border-gray-100">{label}</p>
            <p className="text-center text-4xl font-extrabold text-brand-700 mt-4">{value}</p>
        </div>
    );
}

/* current time in HH:MM format */
function nowHHMM() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

const EMPTY_FORM = { start: nowHHMM(), end: '', activity: '', link: '' };

export default function LaporanKegiatan() {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);

    const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await wfhApi.getReports({ per_page: 50 });
            setRows(res.data.data || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Gagal memuat laporan.');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

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
            const diff = toMin(a.end_time) - toMin(a.start_time);
            return s + (diff > 0 ? diff : 0);
        }, sum);
    }, 0);
    const totalWaktu = `${Math.floor(totalMinutes / 60)}j ${totalMinutes % 60}m`;

    /* form handling */
    const openAdd = () => { setForm({ ...EMPTY_FORM, start: nowHHMM() }); setEditingId(null); setShowModal(true); };

    const openEdit = (row) => {
        const a = row.activities?.[0] || {};
        setForm({
            start: (a.start_time || '').slice(0, 5),
            end: (a.end_time || '').slice(0, 5),
            activity: a.activity || '',
            link: a.links?.[0]?.url || '',
        });
        setEditingId(row.id);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const activities = [{
                start_time: form.start,
                end_time: form.end,
                activity: form.activity,
                ...(form.link ? { links: [form.link] } : {}),
            }];
            if (editingId) {
                await wfhApi.updateReport(editingId, { activities, report_date: new Date().toISOString().slice(0, 10) });
            } else {
                await wfhApi.createReport({ activities, report_date: new Date().toISOString().slice(0, 10) });
            }
            setShowModal(false);
            await fetchReports();
        } catch (e) {
            setError(e.response?.data?.message || 'Gagal menyimpan laporan.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus laporan ini?')) return;
        try {
            await wfhApi.deleteReport(id);
            await fetchReports();
        } catch (e) {
            setError(e.response?.data?.message || 'Gagal menghapus laporan.');
        }
    };

    const handleSubmit = async (id) => {
        try {
            await wfhApi.submitReport(id);
            await fetchReports();
        } catch (e) {
            setError(e.response?.data?.message || 'Gagal mengirim laporan.');
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900">Laporan Kegiatan</h1>
            <p className="text-sm text-gray-500 mt-1">{today}</p>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 max-w-2xl">
                <StatCard label="Total Kegiatan" value={totalKegiatan} />
                <StatCard label="Total Waktu Kerja" value={totalWaktu} />
            </div>

            {/* Add button */}
            <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-600 text-white text-sm font-bold px-6 py-3.5 rounded-xl mt-6 transition-colors"
            >
                <Plus size={18} strokeWidth={2.5} />
                Tambah Kegiatan
            </button>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 mt-6 overflow-hidden">
                <div className="overflow-x-auto">
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
                                <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">Belum ada laporan kegiatan.</td></tr>
                            ) : rows.map((r) => {
                                const a = r.activities?.[0] || {};
                                const fmtTime = (t) => { if (!t) return '?'; const p = t.includes('T') ? t.split('T')[1] : t.includes(' ') ? t.split(' ')[1] : t; return p.slice(0, 5); };
                                return (
                                    <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                                        <td className="px-8 py-4 text-sm text-gray-600">{r.report_date}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                            {fmtTime(a.start_time)} – {fmtTime(a.end_time)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-[240px] truncate">{a.activity}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {a.links?.[0]?.url ? (
                                                <a href={a.links[0].url} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline break-all">
                                                    {a.links[0].url}
                                                </a>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center"><StatusBadge status={r.status} /></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-3">
                                                {r.status === 'draft' && (
                                                    <>
                                                        <button onClick={() => openEdit(r)} className="text-gray-500 hover:text-brand-500 transition-colors" title="Edit">
                                                            <Pencil size={17} />
                                                        </button>
                                                        <button onClick={() => handleSubmit(r.id)} className="text-blue-600 hover:text-blue-700 transition-colors" title="Kirim">
                                                            <Send size={17} />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Hapus">
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingId ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
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
