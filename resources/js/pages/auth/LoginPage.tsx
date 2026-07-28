import { useState, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      // error set by context
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 pt-[13px] pl-[31px]">
        <img src="/assets/logo.png" alt="Logo Kominfo" className="w-[84px] h-[101px] object-contain" />
        <h1 className="text-base font-bold text-[#1F46B5] leading-5 max-w-[300px]">
          Sistem Absensi & Manajemen Perubahan
        </h1>
      </div>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center -mt-[100px]">
        <div
          className="w-[603px] bg-white rounded-[20px] px-[35px] pt-[13px] pb-[62px]"
          style={{
            boxShadow: "5px 5px 50px rgba(164, 230, 255, 0.25)",
            border: "1px solid #C5ECFF",
          }}
        >
          {/* Welcome */}
          <h2 className="text-base font-semibold text-[#084474] leading-5">
            Hi! Selamat Datang
          </h2>
          <p className="text-sm font-normal text-[#084474] leading-5 mb-[60px]">
            Silakan masukkan data Anda.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Email / Username */}
            <label className="text-sm font-medium text-[#084474] leading-5 mb-[6px]">
              Nama Pengguna atau Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama.pengguna@gmail.com"
              required
              className="w-full h-[44px] px-4 text-sm text-[#141D23] rounded-[10px] border border-[#A4E6FF] outline-none hover:border-[#7CD5FF] focus:border-[#1D4ED8] transition-colors placeholder:text-[#5B6478] mb-[28px]"
            />

            {/* Password */}
            <label className="text-sm font-medium text-[#084474] leading-5 mb-[6px]">
              Kata sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              required
              className="w-full h-[44px] px-4 text-sm text-[#141D23] rounded-[10px] border border-[#A4E6FF] outline-none hover:border-[#7CD5FF] focus:border-[#1D4ED8] transition-colors placeholder:text-[#9CA3B5] mb-[28px]"
            />

            {/* Remember me */}
            <label className="flex items-center gap-3 mb-[40px] cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-[13px] h-[13px] rounded border border-[#767676] accent-[#1D4ED8]"
              />
              <span className="text-xs font-normal text-[#5B6478] leading-4">
                Ingat saya di perangkat ini
              </span>
            </label>

            {/* Error */}
            {error && (
              <p className="text-xs text-[#FF0000] text-center -mb-4 mb-6">{error}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-[463px] h-[40px] mx-auto bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl hover:bg-[#1a45c2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)" }}
            >
              {loading ? "Memproses..." : "Masuk ke Sistem"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}