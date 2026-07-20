import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function ForgotPassword() {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (password !== passwordConfirmation) {
            setError('Konfirmasi kata sandi tidak cocok.');
            return;
        }

        setLoading(true);
        // TODO: hubungkan ke endpoint backend untuk memperbarui kata sandi
        // berdasarkan identitas user (email) saat backend sudah tersedia.
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
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Masukkan kata sandi baru"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                        className="w-full px-4 py-2.5 pr-10 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">
                                    Konfirmasi Kata sandi
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswordConfirm ? 'text' : 'password'}
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                        className="w-full px-4 py-2.5 pr-10 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
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
