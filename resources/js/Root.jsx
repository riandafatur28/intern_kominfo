import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ProfilSaya from "./pages/ProfilSaya";
import LoginPage from "./pages/auth/LoginPage";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage";

export default function Root() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        {/* Must change password — no other pages accessible */}
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Protected pages */}
        <Route
          path="/"
          element={<Navigate to="/profil" replace />}
        />
        <Route
          path="/profil"
          element={
            <ProtectedRoute>
              <ProfilSaya />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
