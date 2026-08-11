import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Route guard: validasi ulang status auth SETIAP mount + saat halaman
 * di-restore dari bfcache (Back/Forward). Token expired/revoked → dilempar
 * paksa ke /login (interceptor client.ts + window.location.replace).
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, needsPasswordChange, refreshUser } = useAuth();

  useEffect(() => {
    const mustChange = localStorage.getItem("must_change_password") === "true";
    const revalidate = () => {
      if (localStorage.getItem("token") && !mustChange) {
        void refreshUser().catch(() => {
          // Interceptor client.ts menangani redirect /login saat token invalid.
        });
      }
    };

    // Validasi ulang setiap kali komponen ter-mount (bukan cuma initial load).
    revalidate();

    // Halaman di-restore dari bfcache (Back/Forward) → pastikan sesi masih valid.
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      if (!localStorage.getItem("token")) {
        window.location.replace("/login");
        return;
      }
      if (localStorage.getItem("must_change_password") !== "true") {
        void refreshUser().catch(() => {
          // token invalid → interceptor redirect /login.
        });
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [refreshUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6FAFF] flex items-center justify-center">
        <div className="text-sm text-[#767676]">Memuat...</div>
      </div>
    );
  }

  if (!user && !needsPasswordChange) {
    return <Navigate to="/login" replace />;
  }

  // User authenticated but must change password first
  if (needsPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
}
