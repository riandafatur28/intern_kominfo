import React, { useState } from 'react';
import { Hash, Building2, Briefcase, ShieldCheck, Upload, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/* ---------------- Info row (profile card) ---------------- */
function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <Icon size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-bold text-gray-800 break-words">{value}</p>
            </div>
        </div>
    );
}

/* ---------------- Field ---------------- */
const fieldCls =
    'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all';

function Field({ label, value, onChange, type = 'text', placeholder = '', readOnly = false }) {
    return (
        <div>
            <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                readOnly={readOnly}
                className={`${fieldCls} ${readOnly ? 'bg-gray-50 text-gray-500' : ''}`}
            />
        </div>
    );
}

export default function ProfilPegawai() {
    const { user } = useAuth();

    const initials = user?.name
        ?.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2) ?? 'S';

    const roleLabel = user?.roles?.[0] === 'admin' ? 'WFH Admin' : 'Pegawai';

    const [form, setForm] = useState({
        name: user?.name ?? 'Susanti',
        email: user?.email ?? 'Susanti@jatimprov.go.id',
        phone: user?.phone ?? '0895377689890',
        nip: user?.nip ?? '1985021520100112002',
        rank: user?.rank ?? 'Penata Tingkat 1',
        position: user?.position ?? 'Administrator WFH',
        field: user?.team?.field?.name ?? 'Bidang Aplikasi',
    });
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
    const setPwdField = (k) => (e) => setPwd((p) => ({ ...p, [k]: e.target.value }));

    const handleSaveProfile = (e) => {
        e.preventDefault();
        // TODO: hubungkan ke PUT /api/profile saat integrasi backend.
    };

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900">Profil Saya</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* ---- Profile card ---- */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
                        <div className="w-24 h-24 rounded-full bg-brand-500 flex items-center justify-center text-white text-3xl font-bold">
                            {initials}
                        </div>
                        <h2 className="mt-4 text-lg font-bold text-gray-900">{form.name}</h2>
                        <p className="text-sm text-gray-500">{form.position}</p>
                        <p className="text-sm text-gray-400">{form.field}</p>
                        {form.rank && (
                            <span className="mt-2 inline-block bg-brand-100 text-brand-600 text-[11px] font-semibold px-3 py-1 rounded-full">
                                {form.rank}
                            </span>
                        )}
                    </div>

                    <div className="pt-6 space-y-5">
                        <InfoRow icon={Hash} label="NIP" value={`NIP. ${form.nip}`} />
                        <InfoRow icon={Building2} label="Bidang" value={form.field} />
                        <InfoRow icon={Briefcase} label="Jabatan" value={form.position} />
                        <InfoRow icon={ShieldCheck} label="Peran" value={roleLabel} />
                    </div>
                </div>

                {/* ---- Edit Informasi Profil ---- */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <div className="pb-5 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Edit Informasi Profil</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Perbarui Data Profil Anda</p>
                    </div>
                    <form onSubmit={handleSaveProfile} className="pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <Field label="Nama Lengkap" value={form.name} onChange={set('name')} />
                            <Field label="Email Dinas" value={form.email} onChange={set('email')} type="email" />
                            <Field label="No Telpon" value={form.phone} onChange={set('phone')} />
                            <Field label="NIP" value={form.nip} onChange={set('nip')} />
                            <Field label="Pangkat/Golongan" value={form.rank} onChange={set('rank')} />
                            <Field label="Jabatan" value={form.position} onChange={set('position')} />
                            <Field label="Bidang/Unit Kerja" value={form.field} onChange={set('field')} />
                            <div className="flex items-end justify-end">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                                >
                                    <Save size={16} />
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* ---- Keamanan Akun ---- */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <div className="pb-5 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Keamanan Akun</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Pengaturan Password dan Keamanan</p>
                    </div>
                    <div className="pt-6 space-y-5">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1.5">Password Lama</label>
                            <input type="password" value={pwd.current} onChange={setPwdField('current')} className={fieldCls} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1.5">Password Baru</label>
                            <input type="password" value={pwd.next} onChange={setPwdField('next')} className={fieldCls} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1.5">Konfirmasi Password</label>
                            <input type="password" value={pwd.confirm} onChange={setPwdField('confirm')} className={fieldCls} />
                        </div>
                    </div>
                </div>

                {/* ---- Tanda Tangan Digital ---- */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <div className="pb-5 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Tanda Tangan Digital</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Digunakan Otomatis dalam PDF</p>
                    </div>
                    <div className="pt-6">
                        <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/60 h-40 flex flex-col items-center justify-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Upload size={18} className="text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-400">Belum ada tanda tangan</p>
                        </div>
                        <button className="mt-4 flex items-center gap-2 border border-gray-200 text-sm font-semibold text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <Upload size={16} />
                            Upload Tanda Tangan
                        </button>
                        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                            Format: JPG/PNG dengan latar belakang putih. Tanda tangan ini akan otomatis muncul pada laporan PDF
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
