import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    if (!authLoading && isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal. Periksa email dan password.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigate('/forgot-password', { state: { email } });
    };

    return (
        <div className="min-h-screen flex flex-col bg-bg-page font-[Poppins]">
            {/* Header */}
            <header className="px-6 sm:px-8 py-6 flex items-center gap-3 sm:gap-4">
                <img
                    src="/images/logo-auth.png"
                    alt="Logo Kominfo Jatim"
                    className="h-16 sm:h-20 w-auto object-contain shrink-0"
                />
                <h1 className="text-base sm:text-lg font-bold text-brand-700 leading-[1.2]">
                    Sistem Absensi &amp;<br />Manajemen Perubahan
                </h1>
            </header>

            {/* Form */}
            <div className="flex-1 flex items-center justify-center px-4 pb-16">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-brand-700">Hi! Selamat Datang</h2>
                    <p className="text-sm text-text-secondary mt-1">Silakan masukkan data Anda.</p>

                    {error && (
                        <div className="mt-5 p-3 bg-error-bg border border-error-border rounded-lg text-error text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1.5">
                                Nama Pengguna atau Email
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

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-bold text-text-primary">
                                    Kata sandi
                                </label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-sm text-brand-500 font-medium hover:underline"
                                >
                                    Lupa sandi?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
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

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-border-light text-brand-500 focus:ring-brand-100"
                            />
                            <span className="text-sm text-text-secondary">Ingat saya di perangkat ini</span>
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 focus:ring-4 focus:ring-brand-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Memproses...' : 'Masuk ke Sistem'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
