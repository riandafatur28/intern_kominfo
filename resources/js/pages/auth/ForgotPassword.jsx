import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // TODO: hubungkan ke endpoint backend forgot-password saat sudah tersedia.
        setTimeout(() => {
            setLoading(false);
            setSent(true);
        }, 600);
    };

    return (
        <div className="min-h-screen flex flex-col bg-bg-page font-[Poppins]">
            <header className="px-8 py-6 flex items-center gap-3">
                <img src="/images/logo.png" alt="Logo Kominfo Jatim" className="h-12 object-contain" />
                <h1 className="text-lg font-bold text-brand-700 leading-tight">
                    Sistem Absensi &amp;<br />Manajemen Perubahan
                </h1>
            </header>

            <div className="flex-1 flex items-center justify-center px-4 pb-16">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-brand-700">Lupa Kata Sandi</h2>
                    <p className="text-sm text-text-secondary mt-1">
                        Masukkan email Anda untuk menerima tautan reset kata sandi.
                    </p>

                    {sent ? (
                        <div className="mt-6 p-4 bg-success-bg border border-success-border rounded-lg text-success text-sm">
                            Jika email terdaftar, tautan reset kata sandi telah dikirim. Silakan cek kotak masuk email Anda.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nama.pengguna@gmail.com"
                                    autoComplete="username"
                                    required
                                    className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 focus:ring-4 focus:ring-brand-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Mengirim...' : 'Kirim Tautan Reset'}
                            </button>
                        </form>
                    )}

                    <p className="text-center text-sm mt-6">
                        <Link to="/login" className="text-brand-500 font-medium hover:underline">
                            Kembali ke halaman masuk
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
