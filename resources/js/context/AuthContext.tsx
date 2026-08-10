import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { UserPayload } from "../api/auth";
import { login as apiLogin, fetchMe, logout as apiLogout, changePassword as apiChangePassword } from "../api/auth";
import { syncSwAuth } from "../utils/swAuth";
import { extractErrorMessage } from "../lib/errors";

export interface AuthState {
  user: UserPayload | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => Promise<void>;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
  /** Re-fetches /auth/me so permission-gated menus follow the latest server state. */
  refreshUser: () => Promise<UserPayload>;
  needsPasswordChange: boolean;
  setUser: (u: UserPayload) => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  const refreshUser = useCallback(async (): Promise<UserPayload> => {
    const nextUser = await fetchMe();
    setUser(nextUser);
    localStorage.setItem("permissions", JSON.stringify(nextUser.permissions));
    localStorage.setItem("roles", JSON.stringify(nextUser.roles));
    if (nextUser.must_change_password) {
      setNeedsPasswordChange(true);
      localStorage.setItem("must_change_password", "true");
    } else {
      setNeedsPasswordChange(false);
      localStorage.removeItem("must_change_password");
    }
    return nextUser;
  }, []);

  // Bersihkan key legacy versi lama (auth_token, auth_user, sidebar_collapsed)
  // yang tidak pernah dipakai kode saat ini — biar localStorage konsisten
  // antar pengguna/versi. One-time di boot, tanpa syarat.
  useEffect(() => {
    ["auth_token", "auth_user", "sidebar_collapsed"].forEach((k) =>
      localStorage.removeItem(k)
    );
  }, []);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const mustChange = localStorage.getItem("must_change_password") === "true";
    if (!token) {
      setLoading(false);
      return;
    }
    // If we know user must change password, don't call /auth/me (it returns 403)
    if (mustChange) {
      setNeedsPasswordChange(true);
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("must_change_password");
        localStorage.removeItem("permissions");
        localStorage.removeItem("roles");
      })
      .finally(() => setLoading(false));
  }, [refreshUser]);

  // Permission dapat berubah saat admin mengedit role. Saat pengguna kembali
  // ke tab aplikasi, ambil ulang /auth/me agar sidebar dan tombol terkini.
  useEffect(() => {
    const refreshOnFocus = () => {
      if (
        localStorage.getItem("token") &&
        localStorage.getItem("must_change_password") !== "true"
      ) {
        void refreshUser().catch(() => undefined);
      }
    };
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [refreshUser]);

  // Jaga token SW tetap sinkron (login/logout/mount)
  useEffect(() => {
    syncSwAuth();
    const onChange = () => syncSwAuth();
    window.addEventListener("storage", onChange);
    navigator.serviceWorker?.addEventListener?.("controllerchange", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      navigator.serviceWorker?.removeEventListener?.("controllerchange", onChange);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("permissions", JSON.stringify(data.user.permissions));
      localStorage.setItem("roles", JSON.stringify(data.user.roles));
      syncSwAuth();
      setUser(data.user);
      if (data.user.must_change_password) {
        setNeedsPasswordChange(true);
        localStorage.setItem("must_change_password", "true");
      } else {
        setNeedsPasswordChange(false);
        localStorage.removeItem("must_change_password");
      }
    } catch (e: unknown) {
      setError(extractErrorMessage(e, "Login gagal. Coba lagi."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Tunggu revoke token selesai di server sebelum redirect — kalau tidak,
      // navigasi membatalkan fetch dan token lama tetap valid (keamanan bocor).
      await apiLogout();
    } catch {
      // Request gagal (network/401) → tetap bersihkan state client.
    }
    localStorage.removeItem("token");
    localStorage.removeItem("must_change_password");
    localStorage.removeItem("permissions");
    localStorage.removeItem("roles");
    sessionStorage.clear();
    syncSwAuth();
    setUser(null);
    setNeedsPasswordChange(false);
    setError(null);
    // replace (bukan href/navigate) supaya history tidak menyimpan halaman
    // ter-auth sebagai entry yang bisa di-back dengan state lama.
    window.location.replace("/login");
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => {
    await apiChangePassword(currentPassword, newPassword, newPasswordConfirmation);
    // After successful change, must_change_password becomes false.
    // No need to re-fetch user — only must_change_password changed,
    // which is already tracked locally. fetchMe() added unnecessary
    // API call that could fail and mask a successful password change.
    setNeedsPasswordChange(false);
    localStorage.removeItem("must_change_password");
  }, []);

  const hasPermission = useCallback(
    (perm: string) => user?.permissions?.includes(perm) ?? false,
    [user]
  );

  const hasRole = useCallback(
    (role: string) => user?.roles?.includes(role) ?? false,
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        changePassword,
        hasPermission,
        hasRole,
        refreshUser,
        needsPasswordChange,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
