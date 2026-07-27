import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ManajemenInisiasi from "./pages/ManajemenInisiasi";
import StatusArsip from "./pages/StatusArsip";
import ProfilSaya from "./pages/ProfilSaya";
import LoginPage from "./pages/auth/LoginPage";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage";
import ComponentPreview from "./pages/dev/ComponentPreview";

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
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inisiasi"
          element={
            <ProtectedRoute>
              <ManajemenInisiasi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/status"
          element={
            <ProtectedRoute>
              <StatusArsip />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profil"
          element={
            <ProtectedRoute>
              <ProfilSaya />
            </ProtectedRoute>
          }
        />

        {/* Dev */}
        <Route path="/dev/preview" element={<ComponentPreview />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
