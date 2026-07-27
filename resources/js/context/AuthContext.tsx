import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { UserPayload } from "../api/auth";
import { login as apiLogin, fetchMe, logout as apiLogout, changePassword as apiChangePassword } from "../api/auth";

export interface AuthState {
  user: UserPayload | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => Promise<void>;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
  needsPasswordChange: boolean;
  setUser: (u: UserPayload) => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

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
    fetchMe()
      .then((u) => {
        setUser(u);
        localStorage.setItem("permissions", JSON.stringify(u.permissions));
        localStorage.setItem("roles", JSON.stringify(u.roles));
        if (u.must_change_password) {
          setNeedsPasswordChange(true);
          localStorage.setItem("must_change_password", "true");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("must_change_password");
        localStorage.removeItem("permissions");
        localStorage.removeItem("roles");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("permissions", JSON.stringify(data.user.permissions));
      localStorage.setItem("roles", JSON.stringify(data.user.roles));
      setUser(data.user);
      if (data.user.must_change_password) {
        setNeedsPasswordChange(true);
        localStorage.setItem("must_change_password", "true");
      } else {
        setNeedsPasswordChange(false);
        localStorage.removeItem("must_change_password");
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Login gagal. Coba lagi.";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    apiLogout();
    localStorage.removeItem("token");
    localStorage.removeItem("must_change_password");
    localStorage.removeItem("permissions");
    localStorage.removeItem("roles");
    setUser(null);
    setNeedsPasswordChange(false);
    window.location.href = "/login";
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => {
    await apiChangePassword(currentPassword, newPassword, newPasswordConfirmation);
    // After successful change, must_change_password becomes false
    setNeedsPasswordChange(false);
    localStorage.removeItem("must_change_password");
    // Re-fetch user to get updated data
    const u = await fetchMe();
    setUser(u);
    localStorage.setItem("permissions", JSON.stringify(u.permissions));
    localStorage.setItem("roles", JSON.stringify(u.roles));
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
        needsPasswordChange,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
