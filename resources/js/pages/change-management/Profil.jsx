import React, { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, CheckCircle, Upload, Save, Camera } from 'lucide-react';
import { orgApi } from '../../api/organization';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function Profil() {
    const { user, fetchUser } = useAuth();
    const [form, setForm] = useState({ phone: '', rank: '', position: '' });
    const [loading, setLoading] = useState(false);
    const [sigLoading, setSigLoading] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const sigInputRef = useRef(null);
    const photoInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setForm({
                phone: user.phone || '',
                rank: user.rank || '',
                position: user.position || '',
            });
        }
    }, [user]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await orgApi.updateProfile(form);
            await fetchUser();
            setSuccess('Profil berhasil diperbarui');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal memperbarui profil';
            setError(msg);
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const fd = new FormData();
            fd.append('photo', file);
            await orgApi.uploadPhoto(fd);
            await fetchUser();
            setSuccess('Foto profil berhasil diunggah');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal mengunggah foto';
            setError(msg);
            setTimeout(() => setError(null), 5000);
        } finally {
            setPhotoLoading(false);
        }
    };

    const handleSignatureUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSigLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const fd = new FormData();
            fd.append('signature', file);
            await orgApi.uploadSignature(fd);
            await fetchUser();
            setSuccess('Tanda tangan berhasil diunggah');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            const data = err.response?.data;
            const msg = data?.errors?.signature?.[0] || data?.message || 'Gagal mengunggah tanda tangan';
            setError(msg);
            setTimeout(() => setError(null), 5000);
        } finally {
            setSigLoading(false);
        }
    };

    const initials = user?.name
        ?.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2) ?? 'U';

    return (
        <div className="max-w-[1280px]">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary">Profil Saya</h1>
                <p className="text-sm text-text-secondary mt-1">Kelola informasi profil dan tanda tangan digital Anda</p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-error-bg border border-error-border rounded-lg text-sm text-error">
                    <AlertCircle size={18} />{error}
                </div>
            )}
            {success && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-success-bg border border-success-border rounded-lg text-sm text-success">
                    <CheckCircle size={18} />{success}
                </div>
            )}

            <div className="flex gap-6">
                {/* Left Column — Profile Card + Signature */}
                <div className="w-[389px] shrink-0 space-y-6">
                    {/* Profile Photo Card */}
                    <Card>
                        <div className="flex flex-col items-center">
                            <div className="relative w-[72px] h-[69px]">
                                {user?.photo_url ? (
                                    <img src={user.photo_url} alt="Foto profil"
                                        className="w-full h-full rounded-full object-cover border-2 border-brand-100" />
                                ) : (
                                    <div className="w-full h-full bg-brand-500 rounded-full flex items-center justify-center text-white text-[32px] font-normal">
                                        {initials}
                                    </div>
                                )}
                                <button onClick={() => photoInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
                                    title="Ubah foto profil">
                                    {photoLoading ? (
                                        <Loader2 size={14} className="animate-spin text-brand-500" />
                                    ) : (
                                        <Camera size={14} className="text-gray-500" />
                                    )}
                                </button>
                                <input ref={photoInputRef} type="file" accept="image/jpg,image/jpeg,image/png"
                                    className="hidden" onChange={handlePhotoUpload} disabled={photoLoading} />
                            </div>
                            <p className="text-base font-semibold text-text-primary mt-4">{user?.name ?? '-'}</p>
                            <p className="text-sm text-text-secondary">Administrator Inisiasi Perubahan</p>

                            {/* Info lines */}
                            <div className="w-full space-y-3 mt-6 pt-6 border-t border-border-lighter">
                                {[
                                    { label: 'NIP', value: user?.nip ?? '-' },
                                    { label: 'BIDANG', value: user?.team?.field?.name ?? '-' },
                                    { label: 'JABATAN', value: user?.position || 'Administrator Inisiasi Perubahan' },
                                    { label: 'PERAN', value: user?.roles?.[0] ?? 'Initiation Admin' },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <p className="text-[11px] font-medium text-border uppercase tracking-wider">{item.label}</p>
                                        <p className="text-sm font-semibold text-text-primary mt-0.5">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Signature Card */}
                    <Card>
                        <h2 className="text-sm font-semibold text-text-primary">Tanda Tangan Digital</h2>
                        <p className="text-xs text-text-secondary mt-1">Digunakan otomatis dalam PDF</p>

                        <div className="mt-4">
                            {user?.signature_path ? (
                                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-border-light">
                                    <img src={user.signature_url} alt="Tanda tangan" className="max-h-24 object-contain" />
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-border-light rounded-lg h-32 flex items-center justify-center bg-gray-50">
                                    <p className="text-sm text-border">Belum ada tanda tangan</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => sigInputRef.current?.click()}
                            disabled={sigLoading}
                            className="mt-4 w-full text-center text-sm font-semibold text-text-primary hover:text-brand-500 transition-colors flex items-center justify-center gap-2 py-2.5 border border-border-light rounded-lg"
                        >
                            {sigLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Upload size={16} />
                            )}
                            {sigLoading ? 'Mengunggah...' : 'Upload Tanda Tangan'}
                        </button>
                        <input ref={sigInputRef} type="file" accept="image/png,image/jpeg" className="hidden"
                            onChange={handleSignatureUpload} disabled={sigLoading} />

                        <p className="text-[11px] text-text-secondary mt-3">
                            Format: JPG/PNG dengan latar belakang putih. Tanda tangan ini akan muncul otomatis di dokumen PDF.
                        </p>
                    </Card>
                </div>

                {/* Right Column — Edit Profile + Security */}
                <div className="flex-1 space-y-6">
                    {/* Edit Informasi Profil */}
                    <Card>
                        <h2 className="text-sm font-semibold text-text-primary">Edit Informasi Profil</h2>
                        <p className="text-xs text-text-secondary mt-1">Perbarui data profil Anda</p>

                        <form onSubmit={handleUpdate}>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-5 mt-6">
                                <div>
                                    <label className="text-xs font-semibold text-text-primary mb-1.5 block">Nama Lengkap *</label>
                                    <input type="text" value={user?.name ?? ''} readOnly
                                        className="w-full border border-border-light rounded-lg px-4 py-2.5 text-sm text-text-secondary outline-none bg-gray-50" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-text-primary mb-1.5 block">Email Dinas *</label>
                                    <input type="email" value={user?.email ?? ''} readOnly
                                        className="w-full border border-border-light rounded-lg px-4 py-2.5 text-sm text-text-secondary outline-none bg-gray-50" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-text-primary mb-1.5 block">No. Telepon</label>
                                    <input type="tel" value={form.phone}
                                        onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                                        pattern="[0-9+\s-]*" title="Hanya angka, +, -, dan spasi"
                                        className="w-full border border-border-light rounded-lg px-4 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                                        placeholder="081234567890" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-text-primary mb-1.5 block">NIP</label>
                                    <input type="text" value={user?.nip ?? '-'} readOnly
                                        className="w-full border border-border-light rounded-lg px-4 py-2.5 text-sm text-text-secondary outline-none bg-gray-50" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-text-primary mb-1.5 block">Pangkat / Golongan</label>
                                    <input type="text" value={form.rank}
                                        onChange={(e) => setForm(p => ({ ...p, rank: e.target.value }))}
                                        className="w-full border border-border-light rounded-lg px-4 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                                        placeholder="Penata" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-text-primary mb-1.5 block">Jabatan</label>
                                    <input type="text" value={form.position}
                                        onChange={(e) => setForm(p => ({ ...p, position: e.target.value }))}
                                        className="w-full border border-border-light rounded-lg px-4 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                                        placeholder="Administrator Inisiasi Perubahan" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-text-primary mb-1.5 block">Bidang / Unit Kerja</label>
                                    <input type="text" value={user?.team?.field?.name ?? '-'} readOnly
                                        className="w-full border border-border-light rounded-lg px-4 py-2.5 text-sm text-text-secondary outline-none bg-gray-50" />
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <Button type="submit" loading={loading}>
                                    <Save size={18} strokeWidth={2.5} />
                                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* ponytail: Password change section removed — no backend endpoint exists. Add when API tersedia. */}

                    {/* Footer */}
                    <p className="text-center text-xs text-text-secondary pb-4">
                        &copy; 2024 Office App - Dinas Komunikasi dan Informatika Provinsi Jawa Timur
                    </p>
                </div>
            </div>
        </div>
    );
}
