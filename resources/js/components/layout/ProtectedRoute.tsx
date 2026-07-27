import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, needsPasswordChange } = useAuth();

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
