import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, ChevronDown, Pencil, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { changesApi } from '../../api/changes';
import client from '../../api/client';
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
                <ChevronDown size={16} strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
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
    const { user, hasPermission } = useAuth();
    const [tab, setTab] = useState('form');
    const [form, setForm] = useState({
        description: '',
        reason: '',
        needed_by_date: todayStr(),
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // ——— Implementasi ———
    const [impl, setImpl] = useState({
        initiationId: '',
        tanggal: '',
        tipe: [],
        prioritas: 'Normal',
        dampak: 'Minor',
        dampakProduksi: '',
        upaya: '',
        kebutuhanBiaya: 'Tidak',
        jumlahBiaya: '',
        sumberDaya: '',
        rencanaPengujian: '',
        evalNama: '',
        evalBidang: '',
        evalJabatan: '',
    });
    const [submittingImpl, setSubmittingImpl] = useState(false);
    const [showImplModal, setShowImplModal] = useState(false);
    const [selectedImplInitiation, setSelectedImplInitiation] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [toast, setToast] = useState(null);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    // ——— Riwayat list
    const [riwayat, setRiwayat] = useState([]);
    const [riwayatLoading, setRiwayatLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(true);

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
            setPageLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRiwayat();
    }, [fetchRiwayat]);

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

    const toggleTipe = (t) => setImpl((f) => ({
        ...f,
        tipe: f.tipe.includes(t) ? f.tipe.filter((x) => x !== t) : [...f.tipe, t],
    }));

    const todayDate = () => new Date().toISOString().split('T')[0];

    const resetImpl = () => setImpl({
        initiationId: '', tanggal: todayDate(), tipe: [],
        prioritas: 'Normal', dampak: 'Minor', dampakProduksi: '', upaya: '',
        kebutuhanBiaya: 'Tidak', jumlahBiaya: '', sumberDaya: '',
        rencanaPengujian: '', evalNama: '', evalBidang: '', evalJabatan: '',
    });

    const openImplModal = async (initiation) => {
        setSelectedImplInitiation(initiation);
        resetImpl();
        setShowImplModal(true);
        // fetch team members (filter by field di backend)
        try {
            const res = await client.get('/team-members');
            setTeamMembers(res.data || []);
        } catch { setTeamMembers([]); }
    };

    const closeImplModal = () => {
        setShowImplModal(false);
        setSelectedImplInitiation(null);
    };

    const submitImplementasiModal = async (e, isDraft) => {
        e.preventDefault();
        if (!selectedImplInitiation) return showToast('error', 'Pilih inisiasi terlebih dahulu.');
        if (impl.kebutuhanBiaya === 'Ada' && !impl.jumlahBiaya) return showToast('error', 'Isi jumlah biaya.');

        setSubmittingImpl(true);
        try {
            const payload = {
                priority: impl.prioritas === 'Emergency' ? 'critical' : 'medium',
                impact: impl.dampak === 'Mayor' ? 'high' : 'low',
                production_impact: impl.dampakProduksi || null,
                required_effort: impl.upaya || null,
                cost_needed: impl.kebutuhanBiaya === 'Ada',
                cost_amount: impl.kebutuhanBiaya === 'Ada' ? Number(String(impl.jumlahBiaya).replace(/\D/g, '')) || null : null,
                resources: impl.sumberDaya || null,
                test_plan: impl.rencanaPengujian || null,
            };
            const res = await changesApi.createImplementation(selectedImplInitiation.id, payload);
            const createdId = res.data?.data?.id;
            if (!isDraft && createdId) {
                await changesApi.submitImplementation(createdId);
                showToast('success', 'Implementasi berhasil dikirim untuk ditinjau.');
            } else {
                showToast('success', 'Implementasi berhasil disimpan sebagai draf.');
            }
            closeImplModal();
        } catch (err) {
            showToast('error', err.response?.data?.message || Object.values(err.response?.data?.errors ?? {})[0]?.[0] || 'Gagal menyimpan implementasi.');
        } finally {
            setSubmittingImpl(false);
        }
    };

    const setImplField = (k) => (e) => setImpl((f) => ({ ...f, [k]: e.target.value }));

    const handleEvalNameChange = (e) => {
        const userId = e.target.value;
        const selected = teamMembers.find((m) => String(m.id) === userId);
        setImpl((f) => ({
            ...f,
            evalNama: userId,
            evalBidang: selected?.team?.field?.name || '',
            evalJabatan: selected?.position || '',
        }));
    };

    if (pageLoading) {
        return (
            <div className="max-w-[1200px] mx-auto space-y-6">
                <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
                <div className="flex gap-3">
                    <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="h-12 bg-gray-200 w-full animate-pulse" />
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
                                <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
                                <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
                            <div className="h-24 bg-gray-200 rounded w-full animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
                            <div className="h-20 bg-gray-200 rounded w-full animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                        {hasPermission('change.initiation.create') && (
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, true)}
                                disabled={saving}
                                className="px-8 py-3 rounded-xl text-sm font-bold bg-brand-100 text-brand-700 hover:bg-brand-200 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Menyimpan...' : 'Simpan Draf'}
                            </button>
                        )}
                        {hasPermission('change.initiation.create') && hasPermission('change.initiation.submit') && (
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-3 rounded-xl text-sm font-bold bg-brand-700 text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Mengirim...' : 'Kirim Laporan'}
                            </button>
                        )}
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
                        {riwayatLoading ? (
                            <SkeletonTable rows={5} cols={5} />
                        ) : riwayat.length === 0 ? (
                            <p className="text-center py-12 text-sm text-gray-400">Belum ada permohonan.</p>
                        ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                    <tr className="text-gray-700 text-sm font-bold border-b border-gray-100">
                                        <th className="text-left px-8 py-5">Nomor Dokumen</th>
                                        <th className="text-left px-6 py-5">Tanggal</th>
                                        <th className="text-left px-6 py-5">Deskripsi</th>
                                        <th className="text-left px-6 py-5">Status</th>
                                        <th className="text-left px-6 py-5">Dokumen</th>
                                        <th className="text-left px-6 py-5">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {riwayat.map((r) => (
                                        <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 text-sm text-gray-600">
                                            <td className="px-8 py-4">{r.doc_number || '-'}</td>
                                            <td className="px-6 py-4">{r.initiation_date}</td>
                                            <td className="px-6 py-4 max-w-[300px] truncate">{r.description}</td>
                                            <td className="px-6 py-4"><RiwayatStatus status={r.status} /></td>
                                            <td className="px-6 py-4">
                                                {(r.status === 'approved' || r.status === 'pending') && hasPermission('change.initiation.export_pdf') ? (
                                                    <button onClick={async () => {
                                                        try {
                                                            const res = await changesApi.getInitiationPdf(r.id);
                                                            const url = window.URL.createObjectURL(new Blob([res.data]));
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `CR-${r.doc_number || r.id}.pdf`;
                                                            document.body.appendChild(a); a.click(); a.remove();
                                                            window.URL.revokeObjectURL(url);
                                                        } catch (e) {
                                                            const msg = e.response?.data?.message || e.message || 'Gagal download PDF';
                                                            alert(msg);
                                                        }
                                                    }} className="text-brand-500 hover:underline cursor-pointer">
                                                        Lihat PDF
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {r.status === 'approved' && hasPermission('change.implementation.create') ? (
                                                    <button onClick={() => openImplModal(r)}
                                                        className="text-brand-500 hover:underline cursor-pointer text-sm font-semibold">
                                                        Buat Implementasi
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Implementasi */}
            {showImplModal && (
                <div className="fixed inset-0 z-40 flex items-start justify-center pt-10 pb-10 bg-black/40" onClick={closeImplModal}>
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl">
                            <h2 className="text-base font-bold text-gray-800">Buat Implementasi</h2>
                            <button onClick={closeImplModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Berdasarkan Inisiasi */}
                            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <h2 className="text-base font-bold text-gray-800 px-6 py-4 border-b border-gray-100">
                                    Berdasarkan Inisiasi
                                </h2>
                                <div className="p-6 space-y-5">
                                    <div>
                                        <Label>Bidang</Label>
                                        <input value={user?.team?.field?.name || '-'} readOnly className={`${inputCls} bg-gray-50 text-gray-500`} />
                                    </div>
                                    {selectedImplInitiation && (
                                        <p className="text-xs text-green-600">
                                            ✓ Inisiasi: {selectedImplInitiation.doc_number} — {selectedImplInitiation.description}
                                        </p>
                                    )}
                                    <div>
                                        <Label>Tanggal</Label>
                                        <div className="relative">
                                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
                                            <input type="date" value={impl.tanggal} onChange={setImplField('tanggal')} className={`${inputCls} pl-10`} />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Evaluasi Dampak Perubahan */}
                            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <h2 className="text-base font-bold text-gray-800 px-6 py-4 border-b border-gray-100">
                                    Evaluasi Dampak Perubahan
                                </h2>
                                <div className="p-6 space-y-5">
                                    <div>
                                        <Label>Tipe Perubahan</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {['Hardware','Network','Software','Utilities','Aplikasi','Prosedur','Operating System','Personil'].map((t) => {
                                                const active = impl.tipe.includes(t);
                                                return (
                                                    <label key={t}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${active ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                                        <input type="checkbox" checked={active} onChange={() => toggleTipe(t)} className="w-4 h-4 accent-white" />
                                                        {t}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <Label>Prioritas Perubahan</Label>
                                            <div className="flex flex-wrap gap-3">
                                                {['Normal','Emergency'].map((o) => (
                                                    <label key={o}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${impl.prioritas === o ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                                        <input type="radio" name="prioritas" checked={impl.prioritas === o} onChange={() => setImpl((f) => ({...f, prioritas: o}))} className="w-4 h-4 accent-white" />
                                                        {o}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Dampak Perubahan</Label>
                                            <div className="flex flex-wrap gap-3">
                                                {['Minor','Mayor'].map((o) => (
                                                    <label key={o}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${impl.dampak === o ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                                        <input type="radio" name="dampak" checked={impl.dampak === o} onChange={() => setImpl((f) => ({...f, dampak: o}))} className="w-4 h-4 accent-white" />
                                                        {o}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Dampak Terhadap Lingkungan Produksi</Label>
                                        <textarea value={impl.dampakProduksi} onChange={setImplField('dampakProduksi')} rows={3} className={`${inputCls} resize-none`} />
                                    </div>
                                    <div>
                                        <Label>Upaya / Tindakan yang Diperlukan</Label>
                                        <textarea value={impl.upaya} onChange={setImplField('upaya')} rows={3} className={`${inputCls} resize-none`} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <Label>Kebutuhan Biaya</Label>
                                            <div className="flex flex-wrap gap-3">
                                                {['Ada','Tidak'].map((o) => (
                                                    <label key={o}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${impl.kebutuhanBiaya === o ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                                        <input type="radio" name="kebutuhanBiaya" checked={impl.kebutuhanBiaya === o} onChange={() => setImpl((f) => ({...f, kebutuhanBiaya: o, jumlahBiaya: o === 'Tidak' ? '' : f.jumlahBiaya}))} className="w-4 h-4 accent-white" />
                                                        {o}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Jumlah Biaya</Label>
                                            <input value={impl.jumlahBiaya} onChange={setImplField('jumlahBiaya')} placeholder="Rp." disabled={impl.kebutuhanBiaya !== 'Ada'} className={`${inputCls} ${impl.kebutuhanBiaya !== 'Ada' ? 'bg-gray-50 text-gray-400' : ''}`} />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Kebutuhan Sumber Daya (Personil, H/W, S/W)</Label>
                                        <textarea value={impl.sumberDaya} onChange={setImplField('sumberDaya')} rows={2} className={`${inputCls} resize-none`} />
                                    </div>
                                    <div>
                                        <Label>Penjelasan Rencana Pengujian</Label>
                                        <textarea value={impl.rencanaPengujian} onChange={setImplField('rencanaPengujian')} rows={2} className={`${inputCls} resize-none`} />
                                    </div>
                                    <div>
                                        <Label>Dievaluasi Oleh</Label>
                                        <select value={impl.evalNama} onChange={handleEvalNameChange} className={inputCls}>
                                            <option value="">-- Pilih Nama --</option>
                                            {teamMembers.map((m) => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                        {impl.evalNama && (
                                            <div className="mt-2 flex gap-4 text-xs text-gray-500">
                                                <span>Bidang: <b>{impl.evalBidang || '-'}</b></span>
                                                <span>Jabatan: <b>{impl.evalJabatan || '-'}</b></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                                <span>Setelah dikirim, implementasi menunggu <b>tinjauan Team Lead</b>. Hasil implementasi, hasil pengujian, tanggal pelaksanaan &amp; rilis akan diisi oleh Team Lead pada tahap peninjauan.</span>
                            </div>

                            <div className="flex items-center justify-end gap-4">
                                <button type="button" onClick={closeImplModal}
                                    className="px-8 py-3 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                                    Batal
                                </button>
                                {hasPermission('change.implementation.create') && (
                                    <button type="button" onClick={(e) => submitImplementasiModal(e, true)} disabled={submittingImpl}
                                        className="px-8 py-3 rounded-xl text-sm font-bold bg-brand-100 text-brand-700 hover:bg-brand-200 transition-colors disabled:opacity-50">
                                        {submittingImpl ? 'Menyimpan...' : 'Simpan Draf'}
                                    </button>
                                )}
                                {hasPermission('change.implementation.create') && hasPermission('change.implementation.submit') && (
                                    <button type="button" onClick={(e) => submitImplementasiModal(e, false)} disabled={submittingImpl}
                                        className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-brand-700 text-white hover:bg-brand-600 transition-colors disabled:opacity-50">
                                        {submittingImpl && <Loader2 size={16} className="animate-spin" />}
                                        {submittingImpl ? 'Mengirim...' : 'Kirim untuk Ditinjau'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
}
