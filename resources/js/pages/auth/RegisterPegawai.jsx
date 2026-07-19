import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterPegawai() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        nip: '',
        password: '',
        password_confirmation: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.password_confirmation) {
            setError('Konfirmasi kata sandi tidak cocok.');
            return;
        }

        setLoading(true);
        // TODO: hubungkan ke endpoint backend registrasi pegawai saat tersedia
        // (mis. POST /api/auth/register). Saat ini belum ada endpoint publik.
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        }, 600);
    };

    return (
        <div className="min-h-screen flex flex-col bg-bg-page font-[Poppins]">
            <header className="px-8 py-6 flex items-center gap-3">
                <img src="/images/logo-auth.png" alt="Logo Kominfo Jatim" className="h-12 object-contain" />
                <h1 className="text-lg font-bold text-brand-700 leading-tight">
                    Sistem Absensi &amp;<br />Manajemen Perubahan
                </h1>
            </header>

            <div className="flex-1 flex items-center justify-center px-4 pb-16">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-brand-700">Daftar Akun Pegawai</h2>
                    <p className="text-sm text-text-secondary mt-1">Lengkapi data Anda untuk membuat akun.</p>

                    {error && (
                        <div className="mt-5 p-3 bg-error-bg border border-error-border rounded-lg text-error text-sm">
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div className="mt-6 p-4 bg-success-bg border border-success-border rounded-lg text-success text-sm">
                            Pendaftaran berhasil. Mengalihkan ke halaman masuk...
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={setField('name')}
                                    placeholder="Masukkan nama lengkap"
                                    required
                                    className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">
                                    Email Dinas
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={setField('email')}
                                    placeholder="nama.pengguna@jatimprov.go.id"
                                    autoComplete="username"
                                    required
                                    className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">
                                    NIP
                                </label>
                                <input
                                    type="text"
                                    value={form.nip}
                                    onChange={setField('nip')}
                                    placeholder="Masukkan NIP"
                                    inputMode="numeric"
                                    required
                                    className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">
                                    Kata Sandi
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={setField('password')}
                                    placeholder="Minimal 8 karakter"
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                    className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">
                                    Konfirmasi Kata Sandi
                                </label>
                                <input
                                    type="password"
                                    value={form.password_confirmation}
                                    onChange={setField('password_confirmation')}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                    className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 focus:ring-4 focus:ring-brand-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Memproses...' : 'Daftar'}
                            </button>
                        </form>
                    )}

                    <p className="text-center text-sm mt-6 text-text-secondary">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="text-brand-500 font-medium hover:underline">
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
