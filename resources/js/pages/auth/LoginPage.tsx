import { useState, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";

const BG_IMAGE =
  "https://lh3.googleusercontent.com/aida/AP1WRLv4NiIgWfyLUWd2lwn_PKhJPcmXD4sk1K0cSf7SNJFKRmo0obaBmo0gVqvMRFt8-FGOUIXgygBZXSLwheIwbdkILt_5zRrkKGkXbNTe7EtwJGSRnbVyLTOvrpRKOxYHAiRQFjodBrjFCYhaCienw2zpWRUzrqC1ZPAmd7KhV1ViXg3ZN9XfVBbpSrXJrH5laLNHhNFoGQjpwhTJ-OZ-NaD0oHBKbV-TvZK2c1b5Y3eO5QyQMf3Xih0A5OI";

const GEOMETRIC_LINES = [
  "M0 768 L2.06394 768.258 C34.0603 512.287 70.0419 320.444 110.981 192.634 C131.455 128.717 153.124 80.9577 176.061 49.2183 C199.007 17.4664 222.962 2.08 248 2.08 C273.122 2.08 300.103 17.5556 329.087 49.4001 C358.03 81.2008 388.681 129.013 421.145 192.942 C486.065 320.783 558.024 512.65 638.015 768.62 L640 768 L641.985 767.38 C561.976 511.35 489.935 319.217 424.855 191.058 C392.319 126.987 361.47 78.7992 332.163 46.5999 C302.897 14.4444 274.878 -2.08 248 -2.08 C221.038 -2.08 195.993 14.5336 172.689 46.7817 C149.376 79.0423 127.545 127.283 107.019 191.366 C65.9581 319.556 29.9397 511.713 -2.06394 767.742 L0 768 Z",
  "M0 0 L-0.973782 0.365168 C47.0475 128.422 99.0982 224.544 153.205 288.671 C207.308 352.792 263.572 385.04 320 385.04 C376.428 385.04 432.692 352.792 486.795 288.671 C540.902 224.544 592.953 128.422 640.974 0.365168 L640 0 L639.026 -0.365168 C591.047 127.578 539.098 223.456 485.205 287.329 C431.308 351.208 375.572 382.96 320 382.96 C264.428 382.96 208.692 351.208 154.795 287.329 C100.902 223.456 48.9525 127.578 0.973782 -0.365168 L0 0 Z",
];

export default function LoginPage() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      // error set by context
    }
  };

  const inputClasses =
    "w-full h-[51px] px-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm placeholder-outline-variant focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all";

  return (
    <div className="flex w-full h-full">
      {/* Left Side: Login Form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-surface to-surface-container flex flex-col justify-center items-center p-gutter relative">
        <div className="w-full max-w-[448px] bg-surface-container-lowest p-6 sm:p-10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,59,181,0.10)] border border-outline-variant/30">
          <h1 className="font-headline-md text-headline-md text-primary mb-2">
            Hi! Selamat Datang
          </h1>
          <p className="text-sm text-on-surface-variant">
            Silakan masukkan data Anda.
          </p>

          <form onSubmit={handleSubmit} className="pt-6 space-y-6">
            <div>
              <label
                className="block font-label-md text-label-md text-on-surface mb-1"
                htmlFor="email"
              >
                Nama Pengguna atau Email
              </label>
              <input
                className={inputClasses}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama.pengguna@gmail.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  className="block font-label-md text-label-md text-on-surface"
                  htmlFor="password"
                >
                  Kata sandi
                </label>
                <Link
                  to="/lupa-sandi"
                  className="font-label-md text-label-md text-primary hover:underline"
                >
                  Lupa sandi?
                </Link>
              </div>
              <div className="relative">
                <input
                  className={`${inputClasses} pr-12`}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-outline hover:text-primary transition-colors"
                  aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded"
                id="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label
                className="ml-2 block text-sm text-on-surface-variant"
                htmlFor="remember-me"
              >
                Ingat saya di perangkat ini
              </label>
            </div>

            {error && (
              <p className="text-sm text-error text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-[0_4px_6px_-4px_rgba(0,59,181,0.25),0_10px_15px_-3px_rgba(0,59,181,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Memproses..."
              ) : (
                <>
                  <span className="material-symbols-outlined text-[15px]">login</span>
                  Masuk ke Sistem
                </>
              )}
            </button>
          </form>
        </div>

        <div className="absolute bottom-8 w-full px-4 flex flex-col items-center gap-1 font-caption text-caption text-on-surface-variant/70">
          <span className="text-on-surface-variant">
            © 2026 Diskominfo Jatim
          </span>
        </div>
      </div>

      {/* Right Side: Branding & Imagery */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-primary flex-col px-margin-desktop py-12 overflow-hidden"
        style={{
          backgroundImage: `url('${BG_IMAGE}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 to-primary-container/85 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-dot-pattern opacity-30" />
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          viewBox="0 0 640 1024"
          preserveAspectRatio="none"
        >
          <path
            d={GEOMETRIC_LINES[0]}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={4.16}
            strokeLinejoin="round"
          />
          <path
            d={GEOMETRIC_LINES[1]}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2.08}
            strokeLinejoin="round"
          />
        </svg>

        <div className="absolute bottom-0 right-0 w-96 h-96 border border-white/10 rounded-tl-full opacity-20 blur-[1px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 border border-white/10 rounded-tl-full opacity-30 blur-[1px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[544px] h-full flex flex-col justify-between mx-auto">
          <div className="flex items-center gap-4 pb-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-2 shadow-lg shadow-black/10">
              <img
                src="/assets/logo.png"
                alt="Logo Diskominfo Jatim"
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="font-headline-md text-[24px] leading-[30px] font-bold text-white">
              Dinas Komunikasi dan Informatika
              <br />
              Provinsi Jawa Timur
            </div>
          </div>

          <div className="flex-grow flex flex-col justify-center">
            <div className="bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md shadow-2xl p-8 flex flex-col gap-4">
              <span className="self-start inline-flex items-center bg-white/20 border border-white/30 rounded-full px-4 py-1.5 font-label-sm text-label-sm text-white tracking-[0.35px]">
                SISTEM INTERNAL
              </span>
              <h2 className="font-headline-md text-headline-md text-white">
                APTIKA E-Office
              </h2>
              <p className="text-sm text-inverse-primary/90">
                Platform terintegrasi untuk efisiensi administrasi dan
                kolaborasi digital di lingkungan Bidang Aplikasi dan
                Informatika (APTIKA), Diskominfo Jawa Timur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
