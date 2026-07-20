import React, { useEffect, useRef, useState } from 'react';
import { Hash, Building2, Briefcase, ShieldCheck, Upload, Save, Camera, Loader2 } from 'lucide-react';
import { SkeletonLine, SkeletonBlock } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, changePassword, uploadPhoto } from '../../api/profile';

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

const fieldCls =
    'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all';

function Field({ label, value, onChange, type = 'text', placeholder = '', readOnly = false, error }) {
    return (
        <div>
            <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                readOnly={readOnly}
                className={`${fieldCls} ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''} ${error ? 'border-red-300' : ''}`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

export default function ProfilPegawai() {
    const { user: authUser, fetchUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null); // { type, message }
    const photoInputRef = useRef(null);

    const [form, setForm] = useState({
        name: '', email: '', phone: '', nip: '', rank: '', position: '', field: '',
    });
    const setF = (k) => (v) => setForm((f) => ({ ...f, [k]: typeof v === 'function' ? v(f[k]) : v }));

    const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
    const setPwdF = (k) => (e) => setPwd((p) => ({ ...p, [k]: e.target.value }));

    const [photoLoading, setPhotoLoading] = useState(false);

    const initials = (profile?.name || form.name || 'U')
        .split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2);

    const roleLabel = (() => {
        const roles = profile?.roles || authUser?.roles || [];
        if (!roles.length) return '-';
        const labels = { admin: 'WFH Admin', kepala_bidang: 'Kepala Bidang', kepala_tim: 'Kepala Tim', staf: 'Staf' };
        return labels[roles[0]] || roles[0];
    })();

    useEffect(() => {
        getProfile()
            .then((p) => {
                setProfile(p);
                setForm({
                    name: p.name || '',
                    email: p.email || '',
                    phone: p.phone || '',
                    nip: p.nip || '',
                    rank: p.rank || '',
                    position: p.position || '',
                    field: p.team?.field?.name || '',
                });
            })
            .catch(() => {
                // fallback to auth user
                const u = authUser;
                if (u) {
                    setForm({
                        name: u.name || '',
                        email: u.email || '',
                        phone: u.phone || '',
                        nip: u.nip || '',
                        rank: u.rank || '',
                        position: u.position || '',
                        field: u.team?.field?.name || '',
                    });
                }
            })
            .finally(() => setLoading(false));
    }, [authUser]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            await updateProfile({ phone: form.phone, position: form.position, rank: form.rank });
            await fetchUser?.();
            setToast({ type: 'success', message: 'Profil berhasil diperbarui.' });
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Gagal memperbarui profil.' });
        }
        setTimeout(() => setToast(null), 3500);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwd.next !== pwd.confirm) {
            setToast({ type: 'error', message: 'Konfirmasi password tidak cocok.' });
            return;
        }
        try {
            await changePassword({ current_password: pwd.current, password: pwd.next, password_confirmation: pwd.confirm });
            setToast({ type: 'success', message: 'Password berhasil diubah.' });
            setPwd({ current: '', next: '', confirm: '' });
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Gagal mengubah password.' });
        }
        setTimeout(() => setToast(null), 3500);
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoLoading(true);
        try {
            const fd = new FormData();
            fd.append('photo', file);
            await uploadPhoto(fd);
            await fetchUser?.();
            setToast({ type: 'success', message: 'Foto profil berhasil diunggah.' });
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Gagal mengunggah foto.' });
        } finally {
            setPhotoLoading(false);
        }
        setTimeout(() => setToast(null), 3500);
    };

    if (loading) {
        return (
            <div className="max-w-[1200px] mx-auto space-y-6">
                <div className="h-8 w-36 bg-gray-200 rounded animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
                            <SkeletonLine width="w-1/3" className="mt-4" />
                            <SkeletonLine width="w-1/2" className="mt-2" />
                        </div>
                        <div className="space-y-3 pt-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse shrink-0" />
                                    <div className="flex-1 space-y-1">
                                        <SkeletonLine width="w-1/4" className="h-3" />
                                        <SkeletonLine width="w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <SkeletonBlock className="h-64" />
                        <SkeletonBlock className="h-48" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900">Profil Saya</h1>

            {toast && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                    toast.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                    {toast.message}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* ---- Profile card ---- */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100 relative">
                        <div className="w-24 h-24 rounded-full bg-brand-500 flex items-center justify-center text-white text-3xl font-bold relative overflow-hidden">
                            {photoLoading ? (
                                <Loader2 size={28} className="animate-spin" />
                            ) : (
                                initials
                            )}
                            <button
                                onClick={() => photoInputRef.current?.click()}
                                className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                            >
                                <Camera size={20} className="text-white" />
                            </button>
                        </div>
                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
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
                        <InfoRow icon={Hash} label="NIP" value={form.nip} />
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
                            <Field label="Nama Lengkap" value={form.name} readOnly />
                            <Field label="Email Dinas" value={form.email} readOnly />
                            <Field label="No Telpon" value={form.phone} onChange={(e) => setF('phone')(e.target.value)} />
                            <Field label="NIP" value={form.nip} readOnly />
                            <Field label="Pangkat/Golongan" value={form.rank} onChange={(e) => setF('rank')(e.target.value)} />
                            <Field label="Jabatan" value={form.position} onChange={(e) => setF('position')(e.target.value)} />
                            <Field label="Bidang/Unit Kerja" value={form.field} readOnly />
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
                    <form onSubmit={handleChangePassword}>
                        <div className="pt-6 space-y-5">
                            <Field label="Password Lama" value={pwd.current} onChange={setPwdF('current')} type="password" />
                            <Field label="Password Baru" value={pwd.next} onChange={setPwdF('next')} type="password" />
                            <Field label="Konfirmasi Password" value={pwd.confirm} onChange={setPwdF('confirm')} type="password" />
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                            >
                                <Save size={16} />
                                Ubah Password
                            </button>
                        </div>
                    </form>
                </div>

                {/* ---- Tanda Tangan Digital ---- */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <div className="pb-5 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Tanda Tangan Digital</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Digunakan Otomatis dalam PDF</p>
                    </div>
                    <div className="pt-6">
                        {profile?.signature_path ? (
                            <img src={profile.signature_path} alt="Tanda Tangan" className="max-h-32 border border-gray-100 rounded-lg mb-4" />
                        ) : (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/60 h-40 flex flex-col items-center justify-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Upload size={18} className="text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-400">Belum ada tanda tangan</p>
                            </div>
                        )}
                        <button
                            onClick={() => document.getElementById('signature-input')?.click()}
                            className="mt-4 flex items-center gap-2 border border-gray-200 text-sm font-semibold text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Upload size={16} />
                            {profile?.signature_path ? 'Ganti Tanda Tangan' : 'Upload Tanda Tangan'}
                        </button>
                        <input id="signature-input" type="file" accept="image/*" className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                    const fd = new FormData();
                                    fd.append('photo', file);
                                    await uploadPhoto(fd);
                                    const p = await getProfile();
                                    setProfile(p);
                                    setToast({ type: 'success', message: 'Tanda tangan berhasil diunggah.' });
                                } catch (err) {
                                    setToast({ type: 'error', message: 'Gagal mengunggah tanda tangan.' });
                                }
                                setTimeout(() => setToast(null), 3500);
                            }}
                        />
                        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                            Format: JPG/PNG dengan latar belakang putih. Tanda tangan ini akan otomatis muncul pada laporan PDF
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
