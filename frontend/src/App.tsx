import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import ActivityDetailPage from "./pages/ActivityDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ProgrammePage from "./pages/ProgrammePage";
import QueuePage from "./pages/QueuePage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminActivitiesPage from "./pages/admin/AdminActivitiesPage";
import AdminRoomsPage from "./pages/admin/AdminRoomsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import StaffDashboardPage from "./pages/staff/StaffDashboardPage";
import StaffScanPage from "./pages/staff/StaffScanPage";
import StaffQueuePage from "./pages/staff/StaffQueuePage";
import BottomNav from "./components/BottomNav";

function AppRoutes() {
  const { claims, loading } = useAuth();

  if (loading) return <div className="loading-screen"><div className="spinner" />Chargement...</div>;

  if (!claims) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const isAdmin = claims.role === "admin";
  const isStaff = claims.role === "staff" || isAdmin;

  return (
    <div className="app-shell">
      <BottomNav />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<ProgrammePage />} />
          <Route path="/activity/:id" element={<ActivityDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {isStaff && (
            <>
              <Route path="/staff" element={<StaffDashboardPage />} />
              <Route path="/staff/scan" element={<StaffScanPage />} />
              <Route path="/staff/queue" element={<StaffQueuePage />} />
            </>
          )}

          {isAdmin && (
            <>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/events" element={<AdminEventsPage />} />
              <Route path="/admin/activities" element={<AdminActivitiesPage />} />
              <Route path="/admin/rooms" element={<AdminRoomsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </>
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
