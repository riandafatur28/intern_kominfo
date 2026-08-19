import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { verifyOtp, resetPassword } from "../../api/auth";
import { extractErrorMessage } from "../../lib/errors";

/**
 * Halaman Reset Password (flow OTP): masukkan email + kode OTP + password baru.
 * 1) POST /api/auth/verify-otp (email + code) → reset_token
 * 2) POST /api/auth/reset-password (reset_token + password baru)
 */
export default function ResetPasswordPage() {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const inputClasses =
        "w-full h-[51px] px-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm placeholder-outline-variant focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all";

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage("Konfirmasi password baru tidak sesuai.");
            setStatus("error");
            return;
        }
        setStatus("loading");
        try {
            const token = await verifyOtp(email, code);
            const msg = await resetPassword(token, newPassword, confirmPassword);
            setMessage(msg);
            setStatus("success");
        } catch (err: unknown) {
            setMessage(extractErrorMessage(err, "Gagal mereset password. Coba lagi."));
            setStatus("error");
        }
    };

    return (
        <div className="flex w-full h-full bg-gradient-to-br from-surface to-surface-container">
            <div className="w-full flex flex-col justify-center items-center p-gutter">
                <div className="w-full max-w-[448px] bg-surface-container-lowest p-6 sm:p-10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,59,181,0.10)] border border-outline-variant/30">
                    <h1 className="font-headline-md text-headline-md text-primary mb-2">
                        Reset Password
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                        Masukkan email, kode OTP yang dikirim, dan password baru Anda.
                    </p>

                    <form onSubmit={handleSubmit} className="pt-6 space-y-5">
                        <div>
                            <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="email">
                                Email
                            </label>
                            <input
                                className={inputClasses}
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@kominfo.go.id"
                                required
                            />
                        </div>

                        <div>
                            <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="otp">
                                Kode OTP
                            </label>
                            <input
                                className={inputClasses}
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                placeholder="123456"
                                required
                            />
                        </div>

                        <div>
                            <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="new-password">
                                Password Baru
                            </label>
                            <div className="relative">
                                <input
                                    className={`${inputClasses} pr-12`}
                                    id="new-password"
                                    type={showNewPass ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPass((v) => !v)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-outline hover:text-primary transition-colors"
                                    aria-label={showNewPass ? "Sembunyikan password baru" : "Tampilkan password baru"}
                                >
                                    <span className="material-symbols-outlined">
                                        {showNewPass ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="confirm-password">
                                Konfirmasi Password Baru
                            </label>
                            <div className="relative">
                                <input
                                    className={`${inputClasses} pr-12`}
                                    id="confirm-password"
                                    type={showConfirmPass ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Ulangi password baru"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPass((v) => !v)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-outline hover:text-primary transition-colors"
                                    aria-label={showConfirmPass ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi"}
                                >
                                    <span className="material-symbols-outlined">
                                        {showConfirmPass ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {status === "success" && (
                            <p className="text-sm text-[#15803D] bg-[#F0FDF4] border border-[#86EFAC]/50 rounded-lg px-4 py-2">
                                {message}{" "}
                                <Link to="/login" className="font-medium underline">
                                    Silakan login
                                </Link>
                            </p>
                        )}
                        {status === "error" && (
                            <p className="text-sm text-[#B91C1C] bg-[#FEF2F2] border border-[#FCA5A5]/50 rounded-lg px-4 py-2">
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="w-full h-11 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-[0_4px_6px_-4px_rgba(0,59,181,0.25),0_10px_15px_-3px_rgba(0,59,181,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === "loading" ? "Memproses..." : "Reset Password"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-on-surface-variant">
                        <Link to="/login" className="text-primary hover:underline">
                            Kembali ke Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
