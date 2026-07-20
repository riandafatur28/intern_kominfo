import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Pencil, Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { changesApi } from '../../api/changes';
import { useAuth } from '../../context/AuthContext';
import ErrorAlert from '../../components/ui/ErrorAlert';

const STATUS_FILTERS = [
    { value: '', label: 'Semua' },
    { value: 'draft', label: 'Draf' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
];

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

/* ---------------- Status badge for Riwayat ---------------- */
const STATUS_LABEL = { draft: 'Draf', pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' };

function RiwayatStatus({ status }) {
    if (status === 'draft') {
        return (
            <span className="inline-flex items-center gap-1 text-gray-600">
                Draf <Pencil size={13} className="text-brand-500" />
            </span>
        );
    }
    if (status === 'rejected') {
        return <span className="text-red-500">Ditolak</span>;
    }
    return <span className="text-gray-600">{STATUS_LABEL[status] ?? status}</span>;
}

const EMPTY_FORM = {
    tanggal: '',
    tipe: '', prioritas: '', dampak: '',
    dampakProduksi: '', upaya: '',
    kebutuhanBiaya: '', jumlahBiaya: '',
    sumberDaya: '', rencanaPengujian: '',
    evalNama: '', evalBidang: '', evalJabatan: '',
};

/** Compose the rich form fields into the backend's flat `description` string. */
function buildDescription(form) {
    const parts = [];
    if (form.tipe) parts.push(`Tipe Perubahan: ${form.tipe}`);
    if (form.prioritas) parts.push(`Prioritas: ${form.prioritas}`);
    if (form.dampak) parts.push(`Dampak: ${form.dampak}`);
    if (form.dampakProduksi) parts.push(`Dampak terhadap lingkungan produksi: ${form.dampakProduksi}`);
    if (form.kebutuhanBiaya) parts.push(`Kebutuhan biaya: ${form.kebutuhanBiaya}${form.jumlahBiaya ? ` (${form.jumlahBiaya})` : ''}`);
    if (form.sumberDaya) parts.push(`Kebutuhan sumber daya: ${form.sumberDaya}`);
    if (form.rencanaPengujian) parts.push(`Rencana pengujian: ${form.rencanaPengujian}`);
    if (form.evalNama || form.evalBidang || form.evalJabatan) {
        parts.push(`Dievaluasi oleh: ${[form.evalNama, form.evalBidang, form.evalJabatan].filter(Boolean).join(' / ')}`);
    }
    return parts.join('\n');
}

export default function InisiasiPerubahan() {
    const { user } = useAuth();
    const fieldId = user?.team?.field?.id ?? null;

    const [tab, setTab] = useState('form');
    const [form, setForm] = useState(EMPTY_FORM);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    // Riwayat
    const [rows, setRows] = useState([]);
    const [loadingRows, setLoadingRows] = useState(false);
    const [rowsError, setRowsError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState(null);

    const loadRiwayat = useCallback(async () => {
        setLoadingRows(true);
        setRowsError('');
        try {
            const res = await changesApi.getInitiations({
                per_page: 10,
                page,
                status: statusFilter || undefined,
            });
            setRows(res.data?.data ?? []);
            setMeta(res.data?.meta ?? null);
        } catch (err) {
            setRowsError(err.response?.data?.message || 'Gagal memuat riwayat permohonan.');
        } finally {
            setLoadingRows(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        if (tab === 'riwayat') loadRiwayat();
    }, [tab, loadRiwayat]);

    const handleSubmit = async (e, isDraft) => {
        e.preventDefault();

        if (!fieldId) {
            showToast('error', 'Akun Anda belum terhubung dengan bidang. Hubungi admin.');
            return;
        }
        const description = buildDescription(form);
        const reason = form.upaya?.trim();
        if (!description) {
            showToast('error', 'Lengkapi minimal detail perubahan terlebih dahulu.');
            return;
        }
        if (!reason) {
            showToast('error', 'Isi kolom "Upaya / Tindakan yang Diperlukan".');
            return;
        }

        setSubmitting(true);
        try {
            const res = await changesApi.createInitiation({
                field_id: fieldId,
                needed_by_date: form.tanggal || null,
                description,
                reason,
            });
            const created = res.data?.data;

            if (!isDraft && created?.id) {
                await changesApi.submitInitiation(created.id);
                showToast('success', 'Permohonan berhasil dikirim untuk persetujuan.');
            } else {
                showToast('success', 'Permohonan berhasil disimpan sebagai draf.');
            }

            setForm(EMPTY_FORM);
            setTab('riwayat');
        } catch (err) {
            const msg = err.response?.data?.message
                || (err.response?.status === 403 ? 'Anda tidak memiliki izin untuk membuat inisiasi.' : 'Gagal menyimpan permohonan.');
            showToast('error', msg);
        } finally {
            setSubmitting(false);
        }
    };

    const downloadPdf = async (id) => {
        try {
            const res = await changesApi.getInitiationPdf(id);
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch {
            showToast('error', 'Gagal membuka dokumen PDF.');
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900">Inisiasi Perubahan</h1>
            <p className="text-sm text-gray-400 mt-1">Ajukan dan pantau permohonan perubahan sistem Anda</p>

            {/* Tabs */}
            <div className="flex items-center gap-3 mt-6">
                <button
                    onClick={() => setTab('form')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold border transition-colors ${tab === 'form'
                        ? 'bg-brand-100 text-brand-700 border-brand-200'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    Form Permohonan
                </button>
                <button
                    onClick={() => setTab('riwayat')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold border transition-colors ${tab === 'riwayat'
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
                                    <Label>Nomor Permohonan</Label>
                                    <input value="Otomatis dibuat sistem" readOnly className={`${inputCls} bg-gray-50 text-gray-500`} />
                                </div>
                                <div>
                                    <Label>Tanggal Dibutuhkan</Label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
                                        <input type="date" value={form.tanggal} onChange={set('tanggal')} className={`${inputCls} pl-10`} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <SelectField label="Tipe Perubahan" value={form.tipe} onChange={set('tipe')} options={['Hardware', 'Software', 'Network', 'Prosedur']} />
                                <SelectField label="Prioritas Perubahan" value={form.prioritas} onChange={set('prioritas')} options={['Normal Change', 'Emergency Change', 'Standard Change']} />
                                <SelectField label="Dampak Perubahan" value={form.dampak} onChange={set('dampak')} options={['Rendah', 'Sedang', 'Tinggi']} />
                            </div>
                        </div>
                    </section>

                    {/* Detail Perubahan */}
                    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <h2 className="text-base font-bold text-gray-800 px-6 py-4 border-b border-gray-100">
                            Detail Perubahan
                        </h2>
                        <div className="p-6 space-y-5">
                            <div>
                                <Label>Dampak Terhadap Lingkungan Produksi</Label>
                                <textarea value={form.dampakProduksi} onChange={set('dampakProduksi')} rows={3} className={`${inputCls} resize-none`} />
                            </div>
                            <div>
                                <Label>Upaya / Tindakan yang Diperlukan</Label>
                                <textarea value={form.upaya} onChange={set('upaya')} rows={3} className={`${inputCls} resize-none`} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <SelectField label="Kebutuhan Biaya" value={form.kebutuhanBiaya} onChange={set('kebutuhanBiaya')} options={['Ya', 'Tidak']} />
                                <div>
                                    <Label>Jumlah Biaya</Label>
                                    <input value={form.jumlahBiaya} onChange={set('jumlahBiaya')} placeholder="Rp." className={inputCls} />
                                </div>
                            </div>
                            <div>
                                <Label>Kebutuhan Sumber Daya</Label>
                                <input value={form.sumberDaya} onChange={set('sumberDaya')} className={inputCls} />
                            </div>
                            <div>
                                <Label>Penjelasan Rencana Pengujian</Label>
                                <input value={form.rencanaPengujian} onChange={set('rencanaPengujian')} className={inputCls} />
                            </div>
                            <div>
                                <Label>Dievaluasi Oleh</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input value={form.evalNama} onChange={set('evalNama')} placeholder="Nama" className={inputCls} />
                                    <input value={form.evalBidang} onChange={set('evalBidang')} placeholder="Bidang" className={inputCls} />
                                    <input value={form.evalJabatan} onChange={set('evalJabatan')} placeholder="Jabatan" className={inputCls} />
                                </div>
                            </div>
                            <div>
                                <Label>Tanda Tangan</Label>
                                <div className="w-64 h-32 border border-brand-200 rounded-lg bg-white" />
                            </div>
                        </div>
                    </section>

                    {/* Footer buttons */}
                    <div className="flex items-center justify-end gap-4 pb-4">
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={submitting}
                            className="px-8 py-3 rounded-xl text-sm font-bold bg-brand-100 text-brand-700 hover:bg-brand-200 disabled:opacity-60 transition-colors"
                        >
                            Simpan Draf
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-brand-700 text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
                        >
                            {submitting && <Loader2 size={16} className="animate-spin" />}
                            Kirim Permohonan
                        </button>
                    </div>
                </form>
            ) : (
                <div className="mt-5">
                    <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                        <h2 className="text-base font-bold text-gray-800">Daftar Riwayat Permohonan</h2>
                    </div>

                    {/* Status filter */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${statusFilter === f.value
                                        ? 'bg-brand-500 border-brand-500 text-white'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {rowsError ? (
                        <ErrorAlert message={rowsError} onRetry={loadRiwayat} />
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            {/* Desktop table */}
                            <div className="overflow-x-auto hidden md:block">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr className="text-gray-700 text-sm font-bold border-b border-gray-100">
                                            <th className="text-left px-8 py-5">Nomor</th>
                                            <th className="text-left px-6 py-5">Tanggal</th>
                                            <th className="text-left px-6 py-5">Deskripsi</th>
                                            <th className="text-left px-6 py-5">Status</th>
                                            <th className="text-left px-6 py-5">Dokumen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingRows ? (
                                            <tr><td colSpan={5} className="text-center py-12 text-gray-400"><Loader2 className="animate-spin inline mr-2" size={18} />Memuat...</td></tr>
                                        ) : rows.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-16 text-sm text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-50" />Belum ada permohonan.</td></tr>
                                        ) : rows.map((r) => (
                                            <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 text-sm text-gray-600">
                                                <td className="px-8 py-4 whitespace-nowrap">{r.doc_number}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{r.initiation_date ?? '-'}</td>
                                                <td className="px-6 py-4 max-w-[280px] truncate" title={r.description}>{(r.description || '-').split('\n')[0]}</td>
                                                <td className="px-6 py-4"><RiwayatStatus status={r.status} /></td>
                                                <td className="px-6 py-4">
                                                    {r.status === 'approved' ? (
                                                        <button onClick={() => downloadPdf(r.id)} className="text-brand-500 hover:underline">Lihat PDF</button>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden divide-y divide-gray-50">
                                {loadingRows ? (
                                    <div className="py-12 text-center text-gray-400"><Loader2 className="animate-spin inline mr-2" size={18} />Memuat...</div>
                                ) : rows.length === 0 ? (
                                    <div className="py-16 text-center text-sm text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-50" />Belum ada permohonan.</div>
                                ) : rows.map((r) => (
                                    <div key={r.id} className="p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-800">{r.doc_number}</span>
                                            <RiwayatStatus status={r.status} />
                                        </div>
                                        <p className="text-xs text-gray-400">{r.initiation_date ?? '-'}</p>
                                        <p className="text-sm text-gray-600 line-clamp-2">{(r.description || '-').split('\n')[0]}</p>
                                        {r.status === 'approved' && (
                                            <button onClick={() => downloadPdf(r.id)} className="text-brand-500 hover:underline text-sm">Lihat PDF</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {meta && meta.last_page > 1 && (
                        <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
                            <p className="text-sm text-gray-400">
                                Halaman {meta.current_page} dari {meta.last_page} · {meta.total} permohonan
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    disabled={page >= meta.last_page}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

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
