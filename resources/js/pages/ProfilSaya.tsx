import { useEffect, useState, type FormEvent } from "react";
import AppLayout from "../layouts/AppLayout";
import PageTitle from "../components/ui/PageTitle";
import FormSection from "../components/ui/FormSection";
import FormField from "../components/ui/FormField";
import Button from "../components/ui/Button";
import SignatureUpload from "../components/ui/SignatureUpload";
import { useAuth } from "../hooks/useAuth";
import { fetchProfile, updateProfile, uploadSignature, deleteSignature } from "../api/profile";
import { extractErrorMessage } from "../lib/errors";


function bustCache(url: string | null): string | null {
  if (!url) return url;
  return `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
}

const LockIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SaveIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M4 3h9l3 3v11a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M7 3v4h5V3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="6.5" y="12" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

type PageStatus = "loading" | "ready" | "saving" | "error" | "success";

export default function ProfilSaya() {
  const { setUser, changePassword } = useAuth();

  const [name, setName] = useState("");
  const [nip, setNip] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [rank, setRank] = useState("");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [status, setStatus] = useState<PageStatus>("loading");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passError, setPassError] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  // Halaman profil tidak boleh di-cache browser (Back/Forward/bfcache) —
  // bantuan client-side; header Cache-Control server tetap tanggung jawab backend.
  useEffect(() => {
    const metaCache = document.createElement("meta");
    metaCache.httpEquiv = "Cache-Control";
    metaCache.content = "no-store, no-cache, must-revalidate";
    const metaPragma = document.createElement("meta");
    metaPragma.httpEquiv = "Pragma";
    metaPragma.content = "no-cache";
    document.head.appendChild(metaCache);
    document.head.appendChild(metaPragma);
    return () => {
      document.head.removeChild(metaCache);
      document.head.removeChild(metaPragma);
    };
  }, []);

  useEffect(() => {
    fetchProfile()
      .then((u) => {
        console.log("GET /profile response:", u);
        console.log("signature_url:", u.signature_url, "signature_path:", u.signature_path);
        setName(u.name);
        setNip(u.nip);
        setEmail(u.email);
        setPhone(u.phone ?? "");
        setPosition(u.position ?? "");
        setRank(u.rank ?? "");
        setSignatureUrl(bustCache(u.signature_url ?? null));
        setTeamName(u.team?.field?.name ?? u.team?.name ?? "");
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }, []);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileError("");
    setStatus("saving");
    try {
      const updated = await updateProfile({ phone, position, rank });
      setUser(updated);
      setProfileMsg("Profil berhasil disimpan.");
      setStatus("ready");
    } catch (e: unknown) {
      setProfileError(extractErrorMessage(e, "Gagal menyimpan profil."));
      setStatus("error");
    }
  };

  const handleSignatureUpload = async (file: File | null) => {
    setSignatureFile(file);
    if (!file) return;
    setProfileMsg("");
    setProfileError("");
    try {
      const result = await uploadSignature(file);
      setSignatureUrl(bustCache(result.signature_url));
      setSignatureFile(null);
      setProfileMsg("Tanda tangan berhasil diunggah.");
    } catch (e: unknown) {
      setProfileError(extractErrorMessage(e, "Gagal mengunggah tanda tangan."));
    }
  };

  const handleSignatureDelete = async () => {
    setSignatureFile(null);
    setProfileMsg("");
    setProfileError("");
    try {
      await deleteSignature();
      setSignatureUrl(null);
      setProfileMsg("Tanda tangan berhasil dihapus.");
    } catch (e: unknown) {
      setProfileError(extractErrorMessage(e, "Gagal menghapus tanda tangan."));
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPassMsg("");
    setPassError("");

    if (newPassword.length < 8) {
      setPassError("Password baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Konfirmasi password tidak sesuai.");
      return;
    }

    setPassLoading(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setPassMsg("Password berhasil diubah.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: unknown) {
      setPassError(extractErrorMessage(e, "Gagal mengubah password."));
    } finally {
      setPassLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <AppLayout breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Profil Saya" },
      ]}>
        <PageTitle title="Profil Saya" subtitle="Memuat data..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[
      { label: "Dashboard", href: "/" },
      { label: "Profil Saya" },
    ]}>
      <PageTitle
        title="Profil Saya"
        subtitle="Kelola informasi profil dan tanda tangan Anda"
      />

      <div className="flex flex-col gap-6">
        <FormSection title="Data Diri">
          <form id="profile-form" onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-2 gap-6">
              <FormField label="Nama Lengkap">
                <input
                  type="text"
                  value={name}
                  disabled
                  className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none bg-gray-50 cursor-not-allowed"
                />
              </FormField>
              <FormField label="NIP">
                <input
                  type="text"
                  value={nip}
                  disabled
                  className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none bg-gray-50 cursor-not-allowed"
                />
              </FormField>
              <FormField label="Email">
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none bg-gray-50 cursor-not-allowed"
                />
              </FormField>
              <FormField label="Bidang / Tim">
                <input
                  type="text"
                  value={teamName || "-"}
                  disabled
                  className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none bg-gray-50 cursor-not-allowed"
                />
              </FormField>
              <FormField label="Pangkat / Golongan">
                <input
                  type="text"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  placeholder="cth: III/c - Penata"
                  className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none hover:border-[#A0A0A0] focus:border-[#256EEF] transition-colors placeholder:text-[#767676]"
                />
              </FormField>
              <FormField label="Jabatan">
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="cth: Staff Bidang Aplikasi"
                  className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none hover:border-[#A0A0A0] focus:border-[#256EEF] transition-colors placeholder:text-[#767676]"
                />
              </FormField>
              <FormField label="No. Telepon">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="cth: 081234567890"
                  className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none hover:border-[#A0A0A0] focus:border-[#256EEF] transition-colors placeholder:text-[#767676]"
                />
              </FormField>
            </div>
          </form>
        </FormSection>

        <FormSection title="Tanda Tangan">
          <SignatureUpload
            label="Upload Tanda Tangan"
            value={signatureFile || signatureUrl}
            onChange={(f) => {
              if (f) handleSignatureUpload(f);
              else handleSignatureDelete();
            }}
          />
        </FormSection>

        <FormSection title="Keamanan">
          <form onSubmit={handleChangePassword}>
            <div className="grid grid-cols-2 gap-6">
              <FormField label="Password Saat Ini">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  required
                  className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none hover:border-[#A0A0A0] focus:border-[#256EEF] transition-colors placeholder:text-[#767676]"
                />
              </FormField>
              <div />
              <FormField label="Password Baru">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none hover:border-[#A0A0A0] focus:border-[#256EEF] transition-colors placeholder:text-[#767676]"
                />
              </FormField>
              <FormField label="Konfirmasi Password Baru">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  required
                  className="w-full px-4 py-[10px] text-sm text-[#141D23] rounded-[10px] border border-[#C2C6D8] outline-none hover:border-[#A0A0A0] focus:border-[#256EEF] transition-colors placeholder:text-[#767676]"
                />
              </FormField>
            </div>

            {passError && (
              <p className="text-xs text-[#FF0000] mt-4">{passError}</p>
            )}
            {passMsg && (
              <p className="text-xs text-green-600 mt-4">{passMsg}</p>
            )}

            <div className="flex items-center gap-4 mt-6">
              <Button variant="primary" type="submit" size="sm" disabled={passLoading}>
                <LockIcon className="mr-1.5" />
                {passLoading ? "Memproses..." : "Ubah Password"}
              </Button>
            </div>
          </form>
        </FormSection>

        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            type="submit"
            form="profile-form"
            disabled={status === "saving"}
          >
            <SaveIcon className="mr-1.5" />
            {status === "saving" ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          {profileError && (
            <p className="text-xs text-[#FF0000] mt-4">{profileError}</p>
          )}
          {profileMsg && (
            <span className="text-xs text-green-600">{profileMsg}</span>
          )}
        </div>
      </div>
    </AppLayout>
  );
}