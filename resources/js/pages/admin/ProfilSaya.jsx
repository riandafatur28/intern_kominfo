import React, { useEffect, useRef, useState } from 'react';
import { Hash, Building2, Briefcase, MapPin, Loader2, CheckCircle2, XCircle, Camera } from 'lucide-react';
import { getProfile, updateProfile, changePassword, uploadPhoto } from '../../api/profile';
import { SkeletonCard, SkeletonLine } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
    admin: 'WFH Admin',
    kepala_tim: 'Kepala Tim',
    staf: 'Staf',
};

function roleLabel(roles = []) {
    if (!roles.length) return '-';
    return ROLE_LABELS[roles[0]] ?? roles[0];
}

function initialsOf(name = '') {
    return (
        name
            .split(' ')
            .map((s) => s[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U'
    );
}

export default function ProfilSaya() {
    const { user: authUser, fetchUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [photoLoading, setPhotoLoading] = useState(false);
    const photoInputRef = useRef(null);

    // Toast notification
    const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

    // Edit profile form
    const [form, setForm] = useState({ name: '', email: '', phone: '', nip: '', rank: '', position: '', field: '' });
    const [savingProfile, setSavingProfile] = useState(false);

    // Password form
    const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [savingPwd, setSavingPwd] = useState(false);
    const [pwdErrors, setPwdErrors] = useState({});

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const hydrate = (p) => {
        setProfile(p);
        setForm({
            name: p.name ?? '',
            email: p.email ?? '',
            phone: p.phone ?? '',
            nip: p.nip ?? '',
            rank: p.rank ?? '',
            position: p.position ?? '',
            field: p.team?.field?.name ?? '',
        });
    };

    useEffect(() => {
        setLoading(true);
        getProfile()
            .then(hydrate)
            .catch((e) => setError(e.response?.data?.message || 'Gagal memuat profil.'))
            .finally(() => setLoading(false));
    }, []);

    const submitProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const res = await updateProfile({
                phone: form.phone,
                position: form.position,
                rank: form.rank,
            });
            hydrate(res.data);
            showToast('success', res.message || 'Profil berhasil diperbarui.');
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Gagal memperbarui profil.');
        } finally {
            setSavingProfile(false);
        }
    };

    const submitPassword = async (e) => {
        e.preventDefault();
        setPwdErrors({});
        setSavingPwd(true);
        try {
            const res = await changePassword(pwd);
            setPwd({ current_password: '', password: '', password_confirmation: '' });
            showToast('success', res.message || 'Password berhasil diperbarui.');
        } catch (err) {
            const status = err.response?.status;
            if (status === 422) {
                setPwdErrors(err.response.data.errors || {});
                showToast('error', 'Periksa kembali input password Anda.');
            } else {
                showToast('error', err.response?.data?.message || 'Gagal memperbarui password.');
            }
        } finally {
            setSavingPwd(false);
        }
    };

    const submitPhoto = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoLoading(true);
        try {
            const fd = new FormData();
            fd.append('photo', file);
            await uploadPhoto(fd);
            // Refresh full profile agar dapat photo_url + data lainnya
            const fresh = await getProfile();
            hydrate(fresh);
            await fetchUser?.();
            showToast('success', 'Foto profil berhasil diunggah.');
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Gagal mengunggah foto profil.');
        } finally {
            setPhotoLoading(false);
            if (photoInputRef.current) photoInputRef.current.value = '';
        }
    };

    if (loading) {
        return (
            <div className="max-w-[800px] mx-auto space-y-6">
                <div className="h-8 w-36 bg-gray-200 rounded animate-pulse" />
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse shrink-0" />
                        <div className="space-y-2 flex-1">
                            <SkeletonLine width="w-1/3" />
                            <SkeletonLine width="w-1/4" />
                        </div>
                    </div>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse shrink-0" />
                            <div className="flex-1 space-y-1">
                                <SkeletonLine width="w-1/5" className="h-3" />
                                <SkeletonLine width="w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
                <SkeletonCard />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm max-w-[1100px] mx-auto">
                {error}
            </div>
        );
    }

    const p = profile;
    const fieldName = p.team?.field?.name ?? '-';
    const roleTxt = roleLabel(p.roles ?? authUser?.roles);

    return (
        <div className="max-w-[1100px] mx-auto space-y-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Profil Saya</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Profile summary card */}
                <div className="lg:col-span-5">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
                        <div className="flex flex-col items-center text-center pb-6">
                            <div className="relative w-24 h-24">
                                {p.photo_url ? (
                                    <img src={p.photo_url} alt="Foto profil" className="w-24 h-24 rounded-full object-cover border-2 border-indigo-100" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
                                        {initialsOf(p.name)}
                                    </div>
                                )}
                                <button
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={photoLoading}
                                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60"
                                    title="Ubah foto profil"
                                >
                                    {photoLoading ? (
                                        <Loader2 size={14} className="animate-spin text-indigo-500" />
                                    ) : (
                                        <Camera size={14} className="text-gray-500" />
                                    )}
                                </button>
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/jpg,image/jpeg,image/png"
                                    className="hidden"
                                    onChange={submitPhoto}
                                    disabled={photoLoading}
                                />
                            </div>
                            <h2 className="mt-4 text-lg font-bold text-gray-900">{p.name}</h2>
                            <p className="text-sm text-gray-500">{p.position || 'Pegawai'}</p>
                            <p className="text-sm text-gray-400">{fieldName}</p>
                            {p.rank && (
                                <span className="mt-2 inline-block bg-indigo-100 text-indigo-500 text-[11px] font-semibold px-3 py-1 rounded-full">
                                    {p.rank}
                                </span>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-5 space-y-4">
                            <InfoRow icon={Hash} label="NIP" value={`NIP. ${p.nip || '-'}`} />
                            <InfoRow icon={Building2} label="Bidang" value={fieldName} />
                            <InfoRow icon={Briefcase} label="Jabatan" value={p.position || '-'} />
                            <InfoRow icon={MapPin} label="Peran" value={roleTxt} />
                        </div>
                    </div>
                </div>

                {/* Right: Edit Informasi Profil */}
                <div className="lg:col-span-7">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-gray-900">Edit Informasi Profil</h2>
                            <p className="text-xs text-gray-400">Perbarui Data Profil Anda</p>
                        </div>

                        <form onSubmit={submitProfile}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                                <Field label="Nama Lengkap" value={form.name} readOnly />
                                <Field label="Email Dinas" value={form.email} readOnly />
                                <Field
                                    label="No Telpon"
                                    value={form.phone}
                                    onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                                    placeholder="Masukkan no telpon"
                                />
                                <Field label="NIP" value={form.nip} readOnly />
                                <Field
                                    label="Pangkat/Golongan"
                                    value={form.rank}
                                    onChange={(v) => setForm((f) => ({ ...f, rank: v }))}
                                    placeholder="Masukkan pangkat/golongan"
                                />
                                <Field
                                    label="Jabatan"
                                    value={form.position}
                                    onChange={(v) => setForm((f) => ({ ...f, position: v }))}
                                    placeholder="Masukkan jabatan"
                                />
                                <Field label="Bidang/Unit Kerja" value={form.field} readOnly />
                                <div className="flex items-end justify-end">
                                    <button
                                        type="submit"
                                        disabled={savingProfile}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                                    >
                                        {savingProfile && <Loader2 size={15} className="animate-spin" />}
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Keamanan Akun */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Keamanan Akun</h2>
                    <p className="text-xs text-gray-400">Pengaturan Password dan Keamanan</p>
                </div>

                <form onSubmit={submitPassword}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                        <Field
                            label="Password Lama"
                            type="password"
                            value={pwd.current_password}
                            onChange={(v) => setPwd((s) => ({ ...s, current_password: v }))}
                            placeholder="••••••••"
                            error={pwdErrors.current_password?.[0]}
                        />
                        <Field
                            label="Konfirmasi Password"
                            type="password"
                            value={pwd.password_confirmation}
                            onChange={(v) => setPwd((s) => ({ ...s, password_confirmation: v }))}
                            placeholder="••••••••"
                        />
                        <Field
                            label="Password Baru"
                            type="password"
                            value={pwd.password}
                            onChange={(v) => setPwd((s) => ({ ...s, password: v }))}
                            placeholder="••••••••"
                            error={pwdErrors.password?.[0]}
                        />
                        <div className="flex items-end justify-end">
                            <button
                                type="submit"
                                disabled={savingPwd}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                            >
                                {savingPwd && <Loader2 size={15} className="animate-spin" />}
                                Perbarui Password
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
                        toast.type === 'success'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white'
                    }`}
                >
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <Icon size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, readOnly = false, type = 'text', placeholder = '', error }) {
    return (
        <div>
            <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                readOnly={readOnly}
                onChange={onChange ? (e) => onChange(e.target.value) : undefined}
                placeholder={placeholder}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-800 outline-none transition-colors ${
                    error ? 'border-red-300' : 'border-gray-200'
                } ${
                    readOnly
                        ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                        : 'bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                }`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
