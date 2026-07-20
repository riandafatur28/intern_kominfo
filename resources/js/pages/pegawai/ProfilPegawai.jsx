import React, { useState, useRef, useEffect } from 'react';
import { Hash, Building2, Briefcase, ShieldCheck, Upload, Save, Camera, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, changePassword, uploadSignature, uploadPhoto } from '../../api/profile';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { assetUrl } from '../../utils/url';

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

const ROLE_LABELS = { admin: 'WFH Admin', kepala_tim: 'Kepala Tim', staf: 'Staf' };

export default function ProfilPegawai() {
    const { user, fetchUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [toast, setToast] = useState(null); // { type, message }

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const [form, setForm] = useState({
        name: '', email: '', phone: '', nip: '', rank: '', position: '', field: '',
    });
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
    const setPwdField = (k) => (e) => setPwd((p) => ({ ...p, [k]: e.target.value }));
    const [pwdErrors, setPwdErrors] = useState({});

    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPwd, setSavingPwd] = useState(false);

    const photoInputRef = useRef(null);
    const [photoLoading, setPhotoLoading] = useState(false);

    const signatureInputRef = useRef(null);
    const [signatureFile, setSignatureFile] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState(null);
    const [savingSignature, setSavingSignature] = useState(false);
    // Cache-buster: backend memakai nama file tetap ({id}.png), jadi tanpa ini
    // gambar lama bisa tampil dari cache setelah ganti tanda tangan.
    const [sigVersion, setSigVersion] = useState(() => Date.now());

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

    const loadProfile = () => {
        setLoading(true);
        setLoadError('');
        getProfile()
            .then(hydrate)
            .catch((e) => setLoadError(e.response?.data?.message || 'Gagal memuat profil.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const roleKey = (profile?.roles ?? user?.roles)?.[0];
    const roleLabel = ROLE_LABELS[roleKey] ?? 'Pegawai';
    const initials = (form.name || user?.name || 'BS')
        .split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2);
    const photoUrl = profile?.photo_url ?? user?.photo_url;

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const res = await updateProfile({
                phone: form.phone,
                position: form.position,
                rank: form.rank,
            });
            hydrate(res.data);
            await fetchUser?.();
            showToast('success', res.message || 'Profil berhasil diperbarui.');
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Gagal memperbarui profil.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSavePassword = async () => {
        setPwdErrors({});
        setSavingPwd(true);
        try {
            const res = await changePassword({
                current_password: pwd.current,
                password: pwd.next,
                password_confirmation: pwd.confirm,
            });
            setPwd({ current: '', next: '', confirm: '' });
            showToast('success', res.message || 'Password berhasil diperbarui.');
        } catch (err) {
            if (err.response?.status === 422) {
                setPwdErrors(err.response.data.errors || {});
                showToast('error', 'Periksa kembali input password Anda.');
            } else {
                showToast('error', err.response?.data?.message || 'Gagal memperbarui password.');
            }
        } finally {
            setSavingPwd(false);
        }
    };

    const onSignatureSelected = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSignatureFile(file);
        setSignaturePreview(URL.createObjectURL(file));
    };

    const handleSaveSignature = async () => {
        if (!signatureFile) {
            showToast('error', 'Pilih file tanda tangan terlebih dahulu.');
            return;
        }
        setSavingSignature(true);
        try {
            const fd = new FormData();
            fd.append('signature', signatureFile);
            const res = await uploadSignature(fd);
            setProfile((p) => ({ ...(p ?? {}), signature_url: res.data?.signature_url, signature_path: res.data?.signature_path }));
            setSignatureFile(null);
            setSigVersion(Date.now());
            showToast('success', res.message || 'Tanda tangan berhasil diunggah.');
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Gagal mengunggah tanda tangan.');
        } finally {
            setSavingSignature(false);
            if (signatureInputRef.current) signatureInputRef.current.value = '';
        }
    };

    const submitPhoto = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoLoading(true);
        try {
            const fd = new FormData();
            fd.append('photo', file);
            const res = await uploadPhoto(fd);
            setProfile((p) => ({ ...(p ?? {}), photo_url: res.data?.photo_url }));
            await fetchUser?.();
            showToast('success', res.message || 'Foto profil berhasil diunggah.');
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Gagal mengunggah foto profil.');
        } finally {
            setPhotoLoading(false);
            if (photoInputRef.current) photoInputRef.current.value = '';
        }
    };

    const serverSignature = profile?.signature_url
        ? `${assetUrl(profile.signature_url)}?t=${sigVersion}`
        : null;
    const signatureImg = signaturePreview ?? serverSignature;

    if (loading) {
        return (
            <div className="max-w-[1200px] mx-auto">
                <h1 className="text-3xl font-extrabold text-gray-900">Profil Saya</h1>
                <p className="text-sm text-gray-400 mt-1">Kelola informasi akun dan keamanan Anda</p>
                <LoadingSpinner text="Memuat profil..." />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="max-w-[1200px] mx-auto">
                <h1 className="text-3xl font-extrabold text-gray-900">Profil Saya</h1>
                <p className="text-sm text-gray-400 mt-1 mb-6">Kelola informasi akun dan keamanan Anda</p>
                <ErrorAlert message={loadError} onRetry={loadProfile} />
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900">Profil Saya</h1>
            <p className="text-sm text-gray-400 mt-1">Kelola informasi akun dan keamanan Anda</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* ---- Profile card ---- */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
                        <div className="relative w-24 h-24">
                            {photoUrl ? (
                                <img src={assetUrl(photoUrl)} alt="Foto profil" className="w-24 h-24 rounded-full object-cover border-2 border-brand-100" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-brand-500 flex items-center justify-center text-white text-3xl font-bold">
                                    {initials}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => photoInputRef.current?.click()}
                                disabled={photoLoading}
                                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60"
                                title="Ubah foto profil"
                            >
                                {photoLoading ? (
                                    <Loader2 size={14} className="animate-spin text-brand-500" />
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
                        <h2 className="mt-4 text-lg font-bold text-gray-900">{form.name || '-'}</h2>
                        <p className="text-sm text-gray-500">{form.position || roleLabel}</p>
                        <p className="text-sm text-gray-400">{form.field || '-'}</p>
                        {form.rank && (
                            <span className="mt-2 inline-block bg-brand-100 text-brand-600 text-[11px] font-semibold px-3 py-1 rounded-full">
                                {form.rank}
                            </span>
                        )}
                    </div>

                    <div className="pt-6 space-y-5">
                        <InfoRow icon={Hash} label="NIP" value={`NIP. ${form.nip || '-'}`} />
                        <InfoRow icon={Building2} label="Bidang" value={form.field || '-'} />
                        <InfoRow icon={Briefcase} label="Jabatan" value={form.position || '-'} />
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
                            <Field label="No Telpon" value={form.phone} onChange={set('phone')} placeholder="Masukkan no telpon" />
                            <Field label="NIP" value={form.nip} readOnly />
                            <Field label="Pangkat/Golongan" value={form.rank} onChange={set('rank')} placeholder="Masukkan pangkat/golongan" />
                            <Field label="Jabatan" value={form.position} onChange={set('position')} placeholder="Masukkan jabatan" />
                            <Field label="Bidang/Unit Kerja" value={form.field} readOnly />
                            <div className="flex items-end justify-end">
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                                >
                                    {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Simpan Perubahan
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
                            <input type="password" value={pwd.current} onChange={setPwdField('current')} className={`${fieldCls} ${pwdErrors.current_password ? 'border-red-300' : ''}`} />
                            {pwdErrors.current_password && <p className="text-xs text-red-500 mt-1">{pwdErrors.current_password[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1.5">Password Baru</label>
                            <input type="password" value={pwd.next} onChange={setPwdField('next')} className={`${fieldCls} ${pwdErrors.password ? 'border-red-300' : ''}`} />
                            {pwdErrors.password && <p className="text-xs text-red-500 mt-1">{pwdErrors.password[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1.5">Konfirmasi Password</label>
                            <input type="password" value={pwd.confirm} onChange={setPwdField('confirm')} className={fieldCls} />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleSavePassword}
                                disabled={savingPwd}
                                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                            >
                                {savingPwd ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Perbarui Password
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---- Tanda Tangan Digital ---- */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <div className="pb-5 border-b border-gray-100 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Tanda Tangan Digital</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Digunakan Otomatis dalam PDF</p>
                        </div>
                        {signatureFile ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[11px] font-semibold px-3 py-1 rounded-full shrink-0">
                                Belum disimpan
                            </span>
                        ) : profile?.signature_url ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[11px] font-semibold px-3 py-1 rounded-full shrink-0">
                                <CheckCircle2 size={13} /> Tersimpan
                            </span>
                        ) : null}
                    </div>
                    <div className="pt-6">
                        <button
                            type="button"
                            onClick={() => signatureInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/60 h-40 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                        >
                            {signatureImg ? (
                                <img src={signatureImg} alt="Tanda tangan" className="max-h-32 object-contain" />
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Upload size={18} className="text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-400">Belum ada tanda tangan</p>
                                </>
                            )}
                        </button>
                        <input
                            ref={signatureInputRef}
                            type="file"
                            accept="image/jpg,image/jpeg,image/png"
                            className="hidden"
                            onChange={onSignatureSelected}
                        />
                        <button
                            type="button"
                            onClick={() => signatureInputRef.current?.click()}
                            className="mt-4 flex items-center gap-2 border border-gray-200 text-sm font-semibold text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Upload size={16} />
                            {signatureFile ? signatureFile.name : 'Pilih Tanda Tangan'}
                        </button>
                        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                            Format: JPG/PNG dengan latar belakang putih. Tanda tangan ini akan otomatis muncul pada laporan PDF
                        </p>
                        <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={handleSaveSignature}
                                disabled={savingSignature}
                                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                            >
                                {savingSignature ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
