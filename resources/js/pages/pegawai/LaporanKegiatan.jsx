import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

/* ---------------- Status Badge ---------------- */
function StatusBadge({ status }) {
    const map = {
        draf: 'bg-[#FCD9CC] text-[#C2410C]',
        terkirim: 'bg-[#C9F2D6] text-[#15803D]',
    };
    const label = { draf: 'Draf', terkirim: 'Terkirim' };
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
            <p className="text-center text-base font-bold text-gray-800 pb-3 border-b border-gray-100">
                {label}
            </p>
            <p className="text-center text-4xl font-extrabold text-brand-700 mt-4">{value}</p>
        </div>
    );
}

const INITIAL_ROWS = [
    { id: 1, start: '08.00', end: '10.00', activity: 'Review dan analisis kebutuhan.....', link: 'https://drive.google.com/file/123', status: 'draf' },
    { id: 2, start: '08.00', end: '10.00', activity: 'Review dan analisis kebutuhan.....', link: 'https://drive.google.com/file/123', status: 'draf' },
    { id: 3, start: '08.00', end: '10.00', activity: 'Review dan analisis kebutuhan.....', link: 'https://drive.google.com/file/123', status: 'terkirim' },
    { id: 4, start: '08.00', end: '10.00', activity: 'Review dan analisis kebutuhan.....', link: 'https://drive.google.com/file/123', status: 'terkirim' },
];

const EMPTY_FORM = { start: '', end: '', activity: '', link: '' };

export default function LaporanKegiatan() {
    const [rows, setRows] = useState(INITIAL_ROWS);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);

    const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const totalKegiatan = rows.length;

    // Sum durations (jam kerja) — parse "HH.MM" ranges
    const totalMinutes = rows.reduce((sum, r) => {
        const toMin = (t) => {
            const [h, m] = (t || '0.0').split('.').map(Number);
            return (h || 0) * 60 + (m || 0);
        };
        const diff = toMin(r.end) - toMin(r.start);
        return sum + (diff > 0 ? diff : 0);
    }, 0);
    const totalWaktu = `${Math.floor(totalMinutes / 60)}j ${totalMinutes % 60}m`;

    const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };
    const openEdit = (row) => {
        setForm({ start: row.start, end: row.end, activity: row.activity, link: row.link });
        setEditingId(row.id);
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (editingId) {
            setRows((rs) => rs.map((r) => (r.id === editingId ? { ...r, ...form } : r)));
        } else {
            setRows((rs) => [...rs, { id: Date.now(), ...form, status: 'draf' }]);
        }
        setShowModal(false);
    };

    const handleDelete = (id) => setRows((rs) => rs.filter((r) => r.id !== id));

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900">Laporan Kegiatan</h1>
            <p className="text-sm text-gray-500 mt-1">{today}</p>

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
                                <th className="text-left px-8 py-5">Jam Kerja</th>
                                <th className="text-left px-6 py-5">Kegiatan</th>
                                <th className="text-left px-6 py-5">Link</th>
                                <th className="text-center px-6 py-5">Status</th>
                                <th className="px-6 py-5" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400">Belum ada kegiatan.</td></tr>
                            ) : rows.map((r) => (
                                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                                    <td className="px-8 py-4 text-sm text-gray-600 whitespace-nowrap">{r.start} – {r.end}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[280px] truncate">{r.activity}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline break-all">
                                            {r.link}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-center"><StatusBadge status={r.status} /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-3">
                                            {r.status === 'draf' && (
                                                <button onClick={() => openEdit(r)} className="text-gray-500 hover:text-brand-500 transition-colors" title="Edit">
                                                    <Pencil size={17} />
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Hapus">
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                        <Button type="submit" form="form-kegiatan">Simpan</Button>
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
                                placeholder="08.00" required
                                className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Jam Selesai</label>
                            <input
                                type="text" value={form.end}
                                onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                                placeholder="10.00" required
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
