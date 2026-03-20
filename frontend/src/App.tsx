import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ActivityDetailPage from "./pages/ActivityDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ProgrammePage from "./pages/ProgrammePage";
import QueuePage from "./pages/QueuePage";
import RegisterPage from "./pages/RegisterPage";
import BottomNav from "./components/BottomNav";

function AppRoutes() {
  const { claims, loading } = useAuth();

  if (loading) return <div className="loading-screen">Chargement...</div>;

  if (!claims) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <div className="app-content">
        <Routes>
          <Route path="/" element={<ProgrammePage />} />
          <Route path="/activity/:id" element={<ActivityDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
