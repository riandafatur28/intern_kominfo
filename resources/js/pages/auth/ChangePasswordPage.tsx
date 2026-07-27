import { useState, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function ChangePasswordPage() {
  const { changePassword, error: authError, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      navigate("/", { replace: true });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
          ?.response?.data?.errors?.current_password?.[0] ||
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal mengubah password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAFF] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-8">
        <div className="flex justify-center mb-8">
          <img src="/assets/logo.png" alt="Logo" className="w-[80px] h-[80px] object-contain" />
        </div>

        <h1 className="text-xl font-bold text-[#141D23] text-center mb-1">
          Ubah Password
        </h1>
        <p className="text-sm text-[#767676] text-center mb-8">
          Anda harus mengubah password sebelum melanjutkan
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-[6px]">
            <label className="text-sm font-medium text-[#424655]">
              Password Saat Ini
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password lama"
              required
              className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none hover:border-[#A0A0A0] focus:border-[#256EEF] transition-colors placeholder:text-[#767676]"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="text-sm font-medium text-[#424655]">
              Password Baru
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              required
              className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none hover:border-[#A0A0A0] focus:border-[#256EEF] transition-colors placeholder:text-[#767676]"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="text-sm font-medium text-[#424655]">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              required
              className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none hover:border-[#A0A0A0] focus:border-[#256EEF] transition-colors placeholder:text-[#767676]"
            />
          </div>

          {(error || authError) && (
            <p className="text-xs text-[#FF0000] text-center">{error || authError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-[#256EEF] text-white text-sm font-medium rounded-xl hover:bg-[#1d5cd4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "Ubah Password"}
          </button>

          <button
            type="button"
            onClick={logout}
            className="text-xs text-[#767676] text-center hover:text-[#FF0000] transition-colors"
          >
            Keluar (logout)
          </button>
        </form>
      </div>
    </div>
  );
}
