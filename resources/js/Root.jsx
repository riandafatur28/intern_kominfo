import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ProfilSaya from "./pages/ProfilSaya";
import WfhAbsensi from "./pages/wfh/WfhAbsensi";
import WfhMonitoring from "./pages/wfh/WfhMonitoring";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import SettingsPage from "./pages/admin/SettingsPage";
import RolePermissionPage from "./pages/admin/RolePermissionPage";
import AdminMonitoring from "./pages/change-management/AdminMonitoring";
import LeadApproval from "./pages/change-management/LeadApproval";
import UserInisiasi from "./pages/change-management/UserInisiasi";


export default function Root() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lupa-sandi" element={<ForgotPasswordPage />} />
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
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute>
              <RolePermissionPage />
            </ProtectedRoute>
          }
        />

        {/* WFH Routes */}
        <Route
          path="/wfh/absensi"
          element={
            <ProtectedRoute>
              <WfhAbsensi />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wfh/monitoring"
          element={
            <ProtectedRoute>
              <WfhMonitoring />
            </ProtectedRoute>
          }
        />

        {/* Change Management Routes */}
        <Route
          path="/change-management/monitoring"
          element={
            <ProtectedRoute>
              <AdminMonitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-management/persetujuan"
          element={
            <ProtectedRoute>
              <LeadApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-management/inisiasi"
          element={
            <ProtectedRoute>
              <UserInisiasi />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
