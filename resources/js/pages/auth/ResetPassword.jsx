import React, { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (password !== passwordConfirmation) {
            setError('Konfirmasi kata sandi tidak cocok.');
            return;
        }

        setLoading(true);
        // TODO: hubungkan ke endpoint backend reset-password (token, email) saat sudah tersedia.
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
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
                    <p className="text-sm text-text-secondary mt-1">Silakan Perbarui Kata Sandi Anda.</p>

                    {error && (
                        <div className="mt-5 p-3 bg-error-bg border border-error-border rounded-lg text-error text-sm">
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div className="mt-6 p-4 bg-success-bg border border-success-border rounded-lg text-success text-sm">
                            Kata sandi berhasil diperbarui. Mengalihkan ke halaman masuk...
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">
                                    Kata Sandi Baru
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan kata sandi baru"
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                    className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">
                                    Konfirmasi Kata sandi
                                </label>
                                <input
                                    type="password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
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
                                {loading ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
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
