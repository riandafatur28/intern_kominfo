import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

/**
 * ⚠️ UI placeholder — endpoint reset password BELUM ADA.
 * Halaman ini hanya antarmuka (form email + tombol kirim).
 * Saat endpoint backend tersedia, ganti handleSubmit dengan panggilan API.
 */
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const inputClasses =
        "w-full h-[51px] px-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm placeholder-outline-variant focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all";

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // TODO: endpoint reset password — belum tersedia, UI placeholder dulu.
        setSubmitted(true);
    };

    return (
        <div className="flex w-full h-full bg-gradient-to-br from-surface to-surface-container">
            <div className="w-full flex flex-col justify-center items-center p-gutter">
                <div className="w-full max-w-[448px] bg-surface-container-lowest p-10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,59,181,0.10)] border border-outline-variant/30">
                    <h1 className="font-headline-md text-headline-md text-primary mb-2">
                        Lupa Sandi
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                        Masukkan email terdaftar. Kami akan mengirimkan tautan untuk
                        mereset kata sandi Anda.
                    </p>

                    <form onSubmit={handleSubmit} className="pt-6 space-y-6">
                        <div>
                            <label
                                className="block font-label-md text-label-md text-on-surface mb-1"
                                htmlFor="email"
                            >
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

                        {submitted && (
                            <p className="text-sm text-[#92400E] bg-[#FEF3C7] border border-[#F59E0B]/40 rounded-lg px-4 py-2">
                                Endpoint pengiriman reset sandi belum tersedia — UI ini
                                placeholder sementara.
                            </p>
                        )}

                        <button
                            type="submit"
                            className="w-full h-11 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-[0_4px_6px_-4px_rgba(0,59,181,0.25),0_10px_15px_-3px_rgba(0,59,181,0.25)]"
                        >
                            Kirim Tautan Reset
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
