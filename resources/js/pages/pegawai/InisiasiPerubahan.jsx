import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Pencil, Loader2 } from 'lucide-react';
import { changesApi } from '../../api/changes';
import { useAuth } from '../../context/AuthContext';

/* ---------------- Reusable field bits ---------------- */
function Label({ children }) {
    return <label className="block text-sm text-text-secondary mb-1.5">{children}</label>;
}

const inputCls =
    'w-full px-4 py-2.5 border border-brand-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all';

function SelectField({ label, value, onChange, options }) {
    return (
        <div>
            <Label>{label}</Label>
            <div className="relative">
                <select
                    value={value}
                    onChange={onChange}
                    className={`${inputCls} appearance-none pr-10 bg-white cursor-pointer`}
                >
                    <option value="">Select</option>
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
            </div>
        </div>
    );
}

/* ---------------- Status badge ---------------- */
function RiwayatStatus({ status }) {
    const map = {
        draft: { label: 'Draf', cls: 'text-gray-600' },
        pending: { label: 'Menunggu', cls: 'text-amber-600' },
        approved: { label: 'Disetujui', cls: 'text-green-600' },
        rejected: { label: 'Ditolak', cls: 'text-red-600' },
    };
    const s = map[status] || { label: status, cls: 'text-gray-600' };
    return (
        <span className={`${s.cls}`}>
            {s.label}
            {status === 'draft' && <Pencil size={13} className="inline ml-1 text-brand-500" />}
        </span>
    );
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

export default function InisiasiPerubahan() {
    const { user } = useAuth();
    const [tab, setTab] = useState('form');
    const [form, setForm] = useState({
        description: '',
        reason: '',
        needed_by_date: todayStr(),
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Riwayat list
    const [riwayat, setRiwayat] = useState([]);
    const [riwayatLoading, setRiwayatLoading] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const fetchRiwayat = useCallback(async () => {
        setRiwayatLoading(true);
        try {
            const res = await changesApi.getInitiations({ per_page: 50 });
            setRiwayat(res.data.data || []);
        } catch {
            // silent
        } finally {
            setRiwayatLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab === 'riwayat') fetchRiwayat();
    }, [tab, fetchRiwayat]);

    const handleSubmit = async (e, isDraft) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                ...form,
                field_id: user?.team?.field?.id,
            };
            const res = await changesApi.createInitiation(payload);
            if (!isDraft) {
                await changesApi.submitInitiation(res.data.data.id);
            }
            setSuccess(isDraft ? 'Draf berhasil disimpan.' : 'Inisiasi berhasil dikirim.');
            setForm({ description: '', reason: '', needed_by_date: todayStr() });
        } catch (e) {
            setError(e.response?.data?.message || 'Gagal menyimpan inisiasi.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900">Inisiasi Perubahan</h1>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
            )}
            {success && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-3 mt-6">
                <button
                    onClick={() => setTab('form')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                        tab === 'form'
                            ? 'bg-brand-100 text-brand-700 border-brand-200'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    Form Permohonan
                </button>
                <button
                    onClick={() => setTab('riwayat')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                        tab === 'riwayat'
                            ? 'bg-brand-100 text-brand-700 border-brand-200'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    Riwayat
                </button>
            </div>

            {tab === 'form' ? (
                <form onSubmit={(e) => handleSubmit(e, false)} className="mt-5 space-y-5">
                    {/* Informasi Permohonan */}
                    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <h2 className="text-base font-bold text-gray-800 px-6 py-4 border-b border-gray-100">
                            Informasi Permohonan
                        </h2>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <Label>Bidang</Label>
                                    <input value={user?.team?.field?.name || '-'} readOnly className={`${inputCls} bg-gray-50 text-gray-500`} />
                                </div>
                                <div>
                                    <Label>Tanggal Pengajuan</Label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={form.needed_by_date || todayStr()}
                                            onChange={set('needed_by_date')}
                                            className={`${inputCls} pl-10`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Label>Deskripsi Permohonan</Label>
                                <textarea
                                    value={form.description}
                                    onChange={set('description')}
                                    placeholder="Jelaskan latar belakang dan tujuan perubahan..."
                                    rows={4}
                                    className={`${inputCls} resize-none`}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Alasan / Justifikasi</Label>
                                <textarea
                                    value={form.reason}
                                    onChange={set('reason')}
                                    placeholder="Mengapa perubahan ini diperlukan?"
                                    rows={3}
                                    className={`${inputCls} resize-none`}
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    {/* Footer buttons */}
                    <div className="flex items-center justify-end gap-4 pb-4">
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={saving}
                            className="px-8 py-3 rounded-xl text-sm font-bold bg-brand-100 text-brand-700 hover:bg-brand-200 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Draf'}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 rounded-xl text-sm font-bold bg-brand-700 text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Mengirim...' : 'Kirim Laporan'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="mt-5">
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-base font-bold text-gray-800">Daftar Riwayat Permohonan</h2>
                        <div className="relative">
                            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input type="date" defaultValue={todayStr()} className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none focus:ring-2 focus:ring-brand-100" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                    <tr className="text-gray-700 text-sm font-bold border-b border-gray-100">
                                        <th className="text-left px-8 py-5">Nomor Dokumen</th>
                                        <th className="text-left px-6 py-5">Tanggal</th>
                                        <th className="text-left px-6 py-5">Deskripsi</th>
                                        <th className="text-left px-6 py-5">Status</th>
                                        <th className="text-left px-6 py-5">Dokumen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {riwayatLoading ? (
                                        <tr><td colSpan={5} className="text-center py-12"><Loader2 className="inline animate-spin text-brand-500" size={24} /></td></tr>
                                    ) : riwayat.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400">Belum ada permohonan.</td></tr>
                                    ) : riwayat.map((r) => (
                                        <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 text-sm text-gray-600">
                                            <td className="px-8 py-4">{r.doc_number || '-'}</td>
                                            <td className="px-6 py-4">{r.initiation_date}</td>
                                            <td className="px-6 py-4 max-w-[300px] truncate">{r.description}</td>
                                            <td className="px-6 py-4"><RiwayatStatus status={r.status} /></td>
                                            <td className="px-6 py-4">
                                                {r.status === 'approved' || r.status === 'pending' ? (
                                                    <a href={`/api/changes/initiations/${r.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">
                                                        Lihat PDF
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
