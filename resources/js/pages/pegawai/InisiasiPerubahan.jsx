import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Pencil, Loader2, CheckCircle2, XCircle, FileText, FileDown } from 'lucide-react';
import { changesApi } from '../../api/changes';
import { getFields } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { assetUrl } from '../../utils/url';
import { openPrintWindow, fillPrintWindow, changeInitiationHtml, changeImplementationHtml } from '../../pdf';
import ErrorAlert from '../../components/ui/ErrorAlert';

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
                <select value={value} onChange={onChange} className={`${inputCls} appearance-none pr-10 bg-white cursor-pointer`}>
                    <option value="">Pilih</option>
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
            </div>
        </div>
    );
}

/** Radio pills (single choice). */
function RadioPills({ label, value, onChange, options }) {
    return (
        <div>
            <Label>{label}</Label>
            <div className="flex flex-wrap gap-2">
                {options.map((o) => (
                    <button
                        type="button"
                        key={o}
                        onClick={() => onChange(o)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${value === o ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {o}
                    </button>
                ))}
            </div>
        </div>
    );
}

function SectionCard({ title, children }) {
    return (
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <h2 className="text-base font-bold text-gray-800 px-6 py-4 border-b border-gray-100">{title}</h2>
            <div className="p-6 space-y-5">{children}</div>
        </section>
    );
}

/* ---------------- Riwayat status ---------------- */
const STATUS_LABEL = { draft: 'Draf', pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' };

function RiwayatStatus({ status }) {
    if (status === 'draft') return <span className="inline-flex items-center gap-1 text-gray-600">Draf <Pencil size={13} className="text-brand-500" /></span>;
    if (status === 'rejected') return <span className="text-red-500">Ditolak</span>;
    return <span className="text-gray-600">{STATUS_LABEL[status] ?? status}</span>;
}

const STATUS_FILTERS = [
    { value: '', label: 'Semua' },
    { value: 'draft', label: 'Draf' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
];

/* ---------------- Constants (sesuai dokumen) ---------------- */
const TIPE_OPTIONS = ['Hardware', 'Network', 'Software', 'Utilities', 'Aplikasi', 'Prosedur', 'Operating System', 'Personil'];
// Dokumen memakai Normal/Emergency & Minor/Mayor; backend memakai enum berbeda.
const PRIORITY_MAP = { Normal: 'medium', Emergency: 'critical' };
const IMPACT_MAP = { Minor: 'low', Mayor: 'high' };
// Kebalikan (untuk menampilkan di PDF).
const PRIORITY_REV = { medium: 'Normal', critical: 'Emergency' };
const IMPACT_REV = { low: 'Minor', high: 'Mayor' };

const fmtTanggalID = (d) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

/** Petakan detail inisiasi (API) ke data template PDF. */
function mapInitiationToPdf(d) {
    return {
        docNumber: d.doc_number ?? '',
        tanggal: fmtTanggalID(d.initiation_date),
        halaman: 1,
        bidang: d.field?.name ?? '-',
        neededByDate: d.needed_by_date ? fmtTanggalID(d.needed_by_date) : '-',
        description: d.description ?? '-',
        reason: d.reason ?? '-',
        initiatorName: d.initiator?.name ?? '-',
        initiatorNip: d.initiator?.nip ?? '-',
        initiatorPosition: d.initiator?.position ?? '-',
        initiatorSignatureUrl: d.initiator?.signature_path ? assetUrl(`/storage/${d.initiator.signature_path}`) : null,
        // Tampilkan TTD hanya bila sudah dikirim/disetujui.
        isApproved: ['pending', 'approved'].includes(d.status),
    };
}

/** Petakan sebuah implementasi + inisiasi induknya ke data template PDF. */
function mapImplementationToPdf(impl, initiation) {
    return {
        docNumber: '',
        tanggal: fmtTanggalID(impl.execution_date || initiation.initiation_date),
        halaman: '',
        bidang: initiation.field?.name ?? '-',
        changeTypeNames: (impl.change_types ?? []).map((t) => t.name),
        priority: PRIORITY_REV[impl.priority] ?? '',
        impact: IMPACT_REV[impl.impact] ?? '',
        productionImpact: impl.production_impact ?? '',
        requiredEffort: impl.required_effort ?? '',
        costNeeded: !!impl.cost_needed,
        costAmount: impl.cost_amount ?? '',
        resources: impl.resources ?? '',
        testPlan: impl.test_plan ?? '',
        evaluator: {},
        reviewStatus: impl.review_status ?? '',
        reviewResponse: impl.review_response ?? '',
        executionDate: impl.execution_date ? fmtTanggalID(impl.execution_date) : '',
        responsibleLabel: '',
        reviewer: {},
        implementationResult: impl.implementation_result ?? '',
        testingResult: impl.testing_result ?? '',
        releaseDate: impl.release_date ? fmtTanggalID(impl.release_date) : '',
        attachments: (impl.attachments ?? []).map((a) => assetUrl(a.url)),
        responsible: {},
    };
}

const EMPTY_INISIASI = { field_id: '', needed_by_date: '', description: '', reason: '' };
const EMPTY_IMPL = {
    field_id: '',
    tanggal: '',
    halaman: '',
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
};

export default function InisiasiPerubahan() {
    const { user } = useAuth();
    const ownField = user?.team?.field ?? null;

    // Daftar bidang untuk dropdown (inisiator bisa mengajukan untuk banyak bidang).
    const [fields, setFields] = useState([]);
    useEffect(() => {
        getFields()
            .then((fs) => setFields(fs.length ? fs : (ownField ? [ownField] : [])))
            .catch(() => setFields(ownField ? [ownField] : []));
    }, [ownField]);

    const [tab, setTab] = useState('inisiasi');
    const [toast, setToast] = useState(null);
    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    /* ===== Tab 1: Inisiasi ===== */
    const [ini, setIni] = useState({ ...EMPTY_INISIASI, field_id: ownField?.id ?? '' });
    const setIniField = (k) => (e) => setIni((f) => ({ ...f, [k]: e.target.value }));
    const [submittingIni, setSubmittingIni] = useState(false);

    // Default bidang ke bidang user sendiri saat data user tersedia.
    useEffect(() => {
        if (ownField?.id) setIni((f) => (f.field_id ? f : { ...f, field_id: ownField.id }));
    }, [ownField]);

    const resetInisiasi = () => setIni({ ...EMPTY_INISIASI, field_id: ownField?.id ?? '' });

    const submitInisiasi = async (e, isDraft) => {
        e.preventDefault();
        if (!ini.field_id) return showToast('error', 'Pilih bidang terlebih dahulu.');
        if (!ini.description.trim()) return showToast('error', 'Deskripsi perubahan wajib diisi.');
        if (!ini.reason.trim()) return showToast('error', 'Alasan perubahan wajib diisi.');

        setSubmittingIni(true);
        try {
            const res = await changesApi.createInitiation({
                field_id: ini.field_id,
                needed_by_date: ini.needed_by_date || null,
                description: ini.description.trim(),
                reason: ini.reason.trim(),
            });
            const created = res.data?.data;
            if (!isDraft && created?.id) {
                await changesApi.submitInitiation(created.id);
                showToast('success', 'Permohonan inisiasi berhasil dikirim.');
            } else {
                showToast('success', 'Inisiasi berhasil disimpan sebagai draf.');
            }
            resetInisiasi();
            setTab('riwayat');
        } catch (err) {
            showToast('error', err.response?.data?.message || (err.response?.status === 403 ? 'Anda tidak punya izin membuat inisiasi.' : 'Gagal menyimpan inisiasi.'));
        } finally {
            setSubmittingIni(false);
        }
    };

    /* ===== Tab 2: Implementasi ===== */
    const [impl, setImpl] = useState(EMPTY_IMPL);
    const setImplField = (k, v) => setImpl((f) => ({ ...f, [k]: v }));
    const [approvedList, setApprovedList] = useState([]);
    const [submittingImpl, setSubmittingImpl] = useState(false);

    // Default bidang implementasi ke bidang user sendiri.
    useEffect(() => {
        if (ownField?.id) setImpl((f) => (f.field_id ? f : { ...f, field_id: ownField.id }));
    }, [ownField]);

    // Inisiasi disetujui yang cocok dengan bidang terpilih (untuk tautan backend).
    const matchedInitiation = approvedList.find((i) => String(i.field_id) === String(impl.field_id)) ?? null;

    const loadApproved = useCallback(async () => {
        try {
            const res = await changesApi.getInitiations({ per_page: 100, status: 'approved' });
            setApprovedList(res.data?.data ?? []);
        } catch {
            setApprovedList([]);
        }
    }, []);

    useEffect(() => {
        if (tab === 'implementasi') loadApproved();
    }, [tab, loadApproved]);

    const toggleTipe = (t) => setImpl((f) => ({
        ...f,
        tipe: f.tipe.includes(t) ? f.tipe.filter((x) => x !== t) : [...f.tipe, t],
    }));

    const submitImplementasi = async (e, isDraft) => {
        e.preventDefault();
        if (!impl.field_id) return showToast('error', 'Pilih bidang terlebih dahulu.');
        if (!matchedInitiation) return showToast('error', 'Belum ada inisiasi yang disetujui untuk bidang ini. Ajukan & setujui inisiasi dulu.');
        if (impl.kebutuhanBiaya === 'Ada' && !impl.jumlahBiaya) return showToast('error', 'Isi jumlah biaya.');

        setSubmittingImpl(true);
        try {
            const payload = {
                priority: PRIORITY_MAP[impl.prioritas] ?? null,
                impact: IMPACT_MAP[impl.dampak] ?? null,
                production_impact: impl.dampakProduksi || null,
                required_effort: impl.upaya || null,
                cost_needed: impl.kebutuhanBiaya === 'Ada',
                cost_amount: impl.kebutuhanBiaya === 'Ada' ? Number(String(impl.jumlahBiaya).replace(/\D/g, '')) || null : null,
                resources: impl.sumberDaya || null,
                test_plan: impl.rencanaPengujian || null,
            };
            const res = await changesApi.createImplementation(matchedInitiation.id, payload);
            const createdId = res.data?.data?.id;
            if (!isDraft && createdId) {
                await changesApi.submitImplementation(createdId);
                showToast('success', 'Implementasi berhasil dikirim untuk ditinjau.');
            } else {
                showToast('success', 'Implementasi berhasil disimpan sebagai draf.');
            }
            setImpl(EMPTY_IMPL);
            setTab('riwayat');
        } catch (err) {
            showToast('error', err.response?.data?.message || Object.values(err.response?.data?.errors ?? {})[0]?.[0] || 'Gagal menyimpan implementasi.');
        } finally {
            setSubmittingImpl(false);
        }
    };

    /* ===== Tab 3: Riwayat ===== */
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
            const res = await changesApi.getInitiations({ per_page: 10, page, status: statusFilter || undefined });
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

    // Unduh Formulir Inisiasi Perubahan (PDF digenerate di frontend).
    const printInitiation = async (id) => {
        const win = openPrintWindow();
        if (!win) return showToast('error', 'Popup diblokir browser. Izinkan popup untuk situs ini.');
        try {
            const res = await changesApi.getInitiation(id);
            const d = res.data?.data;
            fillPrintWindow(win, changeInitiationHtml(mapInitiationToPdf(d)));
        } catch {
            try { win.close(); } catch { /* ignore */ }
            showToast('error', 'Gagal menyiapkan dokumen PDF.');
        }
    };

    // Unduh Formulir Persetujuan/Implementasi Perubahan (PDF digenerate di frontend).
    const printImplementation = async (id) => {
        const win = openPrintWindow();
        if (!win) return showToast('error', 'Popup diblokir browser. Izinkan popup untuk situs ini.');
        try {
            const res = await changesApi.getInitiation(id);
            const d = res.data?.data;
            const impls = d.implementations ?? [];
            const impl = impls[impls.length - 1];
            if (!impl) {
                try { win.close(); } catch { /* ignore */ }
                return showToast('error', 'Belum ada implementasi untuk inisiasi ini.');
            }
            fillPrintWindow(win, changeImplementationHtml(mapImplementationToPdf(impl, d)));
        } catch {
            try { win.close(); } catch { /* ignore */ }
            showToast('error', 'Gagal menyiapkan dokumen PDF.');
        }
    };

    const TabButton = ({ id, children }) => (
        <button
            onClick={() => setTab(id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold border transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${tab === id ? 'bg-brand-100 text-brand-700 border-brand-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900">Inisiasi Perubahan</h1>

            {/* Tabs */}
            <div className="flex items-center gap-3 mt-6 flex-wrap">
                <TabButton id="inisiasi">Inisiasi Perubahan</TabButton>
                <TabButton id="implementasi">Implementasi Perubahan</TabButton>
                <TabButton id="riwayat">Riwayat</TabButton>
            </div>

            {/* ===== TAB INISIASI (sesuai Formulir Inisiasi Perubahan) ===== */}
            {tab === 'inisiasi' && (
                <form onSubmit={(e) => submitInisiasi(e, false)} className="mt-5 space-y-5">
                    <SectionCard title="Inisiator Perubahan">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <Label>Bidang</Label>
                                <div className="relative">
                                    <select value={ini.field_id} onChange={setIniField('field_id')}
                                        className={`${inputCls} appearance-none pr-10 bg-white cursor-pointer`}>
                                        <option value="">— Pilih bidang —</option>
                                        {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                                </div>
                            </div>
                            <div>
                                <Label>Hasil Perubahan Dibutuhkan Pada Tanggal</Label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
                                    <input type="date" value={ini.needed_by_date} onChange={setIniField('needed_by_date')} className={`${inputCls} pl-10`} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label>Deskripsi Perubahan</Label>
                            <textarea value={ini.description} onChange={setIniField('description')} rows={3} placeholder="Jelaskan perubahan yang diusulkan" className={`${inputCls} resize-none`} />
                        </div>
                        <div>
                            <Label>Alasan Perubahan</Label>
                            <textarea value={ini.reason} onChange={setIniField('reason')} rows={3} placeholder="Jelaskan alasan/tujuan perubahan" className={`${inputCls} resize-none`} />
                        </div>
                    </SectionCard>

                    <div className="flex items-center justify-end gap-4 pb-4">
                        <button type="button" onClick={(e) => submitInisiasi(e, true)} disabled={submittingIni}
                            className="px-8 py-3 rounded-xl text-sm font-bold bg-brand-100 text-brand-700 hover:bg-brand-200 disabled:opacity-60 transition-colors">
                            Simpan Draf
                        </button>
                        <button type="submit" disabled={submittingIni}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-brand-700 text-white hover:bg-brand-600 disabled:opacity-60 transition-colors">
                            {submittingIni && <Loader2 size={16} className="animate-spin" />}
                            Kirim Permohonan
                        </button>
                    </div>
                </form>
            )}

            {/* ===== TAB IMPLEMENTASI (sesuai Formulir Persetujuan/Implementasi Perubahan) ===== */}
            {tab === 'implementasi' && (
                <form onSubmit={(e) => submitImplementasi(e, false)} className="mt-5 space-y-5">
                    <SectionCard title="Berdasarkan Inisiasi">
                        <div>
                            <Label>Bidang</Label>
                            <div className="relative">
                                <select value={impl.field_id} onChange={(e) => setImplField('field_id', e.target.value)}
                                    className={`${inputCls} appearance-none pr-10 bg-white cursor-pointer`}>
                                    <option value="">— Pilih bidang —</option>
                                    {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <Label>Nomor</Label>
                                <input value="Otomatis dibuat sistem" readOnly className={`${inputCls} bg-gray-50 text-gray-500`} />
                            </div>
                            <div>
                                <Label>Tanggal</Label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
                                    <input type="date" value={impl.tanggal} onChange={(e) => setImplField('tanggal', e.target.value)} className={`${inputCls} pl-10`} />
                                </div>
                            </div>
                            <div>
                                <Label>Halaman</Label>
                                <input value={impl.halaman} onChange={(e) => setImplField('halaman', e.target.value)} placeholder="Halaman" className={inputCls} />
                            </div>
                        </div>
                        {impl.field_id && !matchedInitiation && (
                            <p className="text-xs text-amber-600">Belum ada inisiasi yang disetujui untuk bidang ini. Ajukan & setujui inisiasi dulu agar implementasi bisa dikirim.</p>
                        )}
                    </SectionCard>

                    <SectionCard title="Evaluasi Dampak Perubahan">
                        <div>
                            <Label>Tipe Perubahan</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {TIPE_OPTIONS.map((t) => {
                                    const active = impl.tipe.includes(t);
                                    return (
                                        <button type="button" key={t} onClick={() => toggleTipe(t)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${active ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}>
                                            {t}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <RadioPills label="Prioritas Perubahan" value={impl.prioritas} onChange={(v) => setImplField('prioritas', v)} options={['Normal', 'Emergency']} />
                            <RadioPills label="Dampak Perubahan" value={impl.dampak} onChange={(v) => setImplField('dampak', v)} options={['Minor', 'Mayor']} />
                        </div>
                        <div>
                            <Label>Dampak Terhadap Lingkungan Produksi</Label>
                            <textarea value={impl.dampakProduksi} onChange={(e) => setImplField('dampakProduksi', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                        </div>
                        <div>
                            <Label>Upaya / Tindakan yang Diperlukan</Label>
                            <textarea value={impl.upaya} onChange={(e) => setImplField('upaya', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <RadioPills label="Kebutuhan Biaya" value={impl.kebutuhanBiaya} onChange={(v) => setImplField('kebutuhanBiaya', v)} options={['Ada', 'Tidak']} />
                            <div>
                                <Label>Jumlah Biaya</Label>
                                <input value={impl.jumlahBiaya} onChange={(e) => setImplField('jumlahBiaya', e.target.value)} placeholder="Rp." disabled={impl.kebutuhanBiaya !== 'Ada'} className={`${inputCls} ${impl.kebutuhanBiaya !== 'Ada' ? 'bg-gray-50 text-gray-400' : ''}`} />
                            </div>
                        </div>
                        <div>
                            <Label>Kebutuhan Sumber Daya (Personil, H/W, S/W)</Label>
                            <textarea value={impl.sumberDaya} onChange={(e) => setImplField('sumberDaya', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
                        </div>
                        <div>
                            <Label>Penjelasan Rencana Pengujian</Label>
                            <textarea value={impl.rencanaPengujian} onChange={(e) => setImplField('rencanaPengujian', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
                        </div>
                        <div>
                            <Label>Dievaluasi Oleh</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input value={impl.evalNama} onChange={(e) => setImplField('evalNama', e.target.value)} placeholder="Nama" className={inputCls} />
                                <input value={impl.evalBidang} onChange={(e) => setImplField('evalBidang', e.target.value)} placeholder="Bidang" className={inputCls} />
                                <input value={impl.evalJabatan} onChange={(e) => setImplField('evalJabatan', e.target.value)} placeholder="Jabatan" className={inputCls} />
                            </div>
                        </div>
                    </SectionCard>

                    <div className="flex items-start gap-2 text-xs text-gray-500 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                        <span>
                            Setelah dikirim, implementasi menunggu <b>tinjauan Team Lead</b>. Hasil implementasi, hasil
                            pengujian, tanggal pelaksanaan &amp; rilis akan diisi oleh Team Lead pada tahap peninjauan.
                        </span>
                    </div>

                    <div className="flex items-center justify-end gap-4 pb-4">
                        <button type="button" onClick={(e) => submitImplementasi(e, true)} disabled={submittingImpl}
                            className="px-8 py-3 rounded-xl text-sm font-bold bg-brand-100 text-brand-700 hover:bg-brand-200 disabled:opacity-60 transition-colors">
                            Simpan Draf
                        </button>
                        <button type="submit" disabled={submittingImpl}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-brand-700 text-white hover:bg-brand-600 disabled:opacity-60 transition-colors">
                            {submittingImpl && <Loader2 size={16} className="animate-spin" />}
                            Kirim untuk Ditinjau
                        </button>
                    </div>
                </form>
            )}

            {/* ===== TAB RIWAYAT ===== */}
            {tab === 'riwayat' && (
                <div className="mt-5">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {STATUS_FILTERS.map((f) => (
                            <button key={f.value} onClick={() => { setStatusFilter(f.value); setPage(1); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${statusFilter === f.value ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {rowsError ? (
                        <ErrorAlert message={rowsError} onRetry={loadRiwayat} />
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => printInitiation(r.id)} title="Unduh Formulir Inisiasi"
                                                            className="inline-flex items-center gap-1 text-brand-500 hover:underline">
                                                            <FileDown size={14} /> Inisiasi
                                                        </button>
                                                        {(r.implementations?.length ?? 0) > 0 && (
                                                            <button onClick={() => printImplementation(r.id)} title="Unduh Formulir Implementasi"
                                                                className="inline-flex items-center gap-1 text-brand-500 hover:underline">
                                                                <FileDown size={14} /> Implementasi
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

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
                                        <div className="flex items-center gap-4 pt-1">
                                            <button onClick={() => printInitiation(r.id)} className="inline-flex items-center gap-1 text-brand-500 hover:underline text-sm">
                                                <FileDown size={14} /> Inisiasi
                                            </button>
                                            {(r.implementations?.length ?? 0) > 0 && (
                                                <button onClick={() => printImplementation(r.id)} className="inline-flex items-center gap-1 text-brand-500 hover:underline text-sm">
                                                    <FileDown size={14} /> Implementasi
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {meta && meta.last_page > 1 && (
                        <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
                            <p className="text-sm text-gray-400">Halaman {meta.current_page} dari {meta.last_page} · {meta.total} permohonan</p>
                            <div className="flex gap-2">
                                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Sebelumnya</button>
                                <button disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}
                                    className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Selanjutnya</button>
                            </div>
                        </div>
                    )}
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
