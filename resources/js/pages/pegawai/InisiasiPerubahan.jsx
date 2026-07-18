import React, { useState } from 'react';
import { Calendar, Pencil } from 'lucide-react';

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
function RiwayatStatus({ status }) {
    if (status === 'draf') {
        return (
            <span className="inline-flex items-center gap-1 text-gray-600">
                Draf <Pencil size={13} className="text-brand-500" />
            </span>
        );
    }
    return <span className="text-gray-600">{status === 'disetujui' ? 'Disetujui' : 'Menunggu'}</span>;
}

const RIWAYAT_ROWS = [
    { no: 'CR-2026-002', tgl: '2026-07-07', prioritas: 'Emergency Change', status: 'disetujui', pdf: true },
    { no: 'CR-2026-002', tgl: '2026-07-07', prioritas: 'Emergency Change', status: 'menunggu', pdf: false },
    { no: 'CR-2026-002', tgl: '2026-07-07', prioritas: 'Emergency Change', status: 'draf', pdf: false },
    { no: 'CR-2026-002', tgl: '2026-07-07', prioritas: 'Emergency Change', status: 'disetujui', pdf: true },
];

export default function InisiasiPerubahan() {
    const [tab, setTab] = useState('form');
    const [form, setForm] = useState({
        nomor: 'CR-2026-002',
        tanggal: '2026-07-10',
        tipe: '', prioritas: '', dampak: '',
        dampakProduksi: '', upaya: '',
        kebutuhanBiaya: '', jumlahBiaya: '',
        sumberDaya: '', rencanaPengujian: '',
        evalNama: '', evalBidang: '', evalJabatan: '',
    });
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = (e, isDraft) => {
        e.preventDefault();
        // TODO: hubungkan ke endpoint backend (POST /api/changes/initiations)
        // saat integrasi backend dilakukan. isDraft menentukan status draf/kirim.
        void isDraft;
    };

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900">Inisiasi Perubahan</h1>

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
                                    <Label>Nomor Permohonan</Label>
                                    <input value={form.nomor} readOnly className={`${inputCls} bg-gray-50 text-gray-500`} />
                                </div>
                                <div>
                                    <Label>Tanggal Pengajuan</Label>
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
                            className="px-8 py-3 rounded-xl text-sm font-bold bg-brand-100 text-brand-700 hover:bg-brand-200 transition-colors"
                        >
                            Simpan Draf
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 rounded-xl text-sm font-bold bg-brand-700 text-white hover:bg-brand-600 transition-colors"
                        >
                            Kirim Laporan
                        </button>
                    </div>
                </form>
            ) : (
                <div className="mt-5">
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-base font-bold text-gray-800">Daftar Riwayat Permohonan</h2>
                        <div className="relative">
                            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input type="date" defaultValue="2026-07-10" className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none focus:ring-2 focus:ring-brand-100" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                    <tr className="text-gray-700 text-sm font-bold border-b border-gray-100">
                                        <th className="text-left px-8 py-5">Nomor</th>
                                        <th className="text-left px-6 py-5">Tanggal</th>
                                        <th className="text-left px-6 py-5">Prioritas Perubahan</th>
                                        <th className="text-left px-6 py-5">Status</th>
                                        <th className="text-left px-6 py-5">Dokumen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {RIWAYAT_ROWS.map((r, i) => (
                                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 text-sm text-gray-600">
                                            <td className="px-8 py-4">{r.no}</td>
                                            <td className="px-6 py-4">{r.tgl}</td>
                                            <td className="px-6 py-4">{r.prioritas}</td>
                                            <td className="px-6 py-4"><RiwayatStatus status={r.status} /></td>
                                            <td className="px-6 py-4">
                                                {r.pdf ? (
                                                    <a href="#" className="text-brand-500 hover:underline">Lihat PDF</a>
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
