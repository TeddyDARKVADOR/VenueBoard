import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const tabs = [
  { path: "/", label: "Programme", icon: "📋" },
  { path: "/favorites", label: "Favoris", icon: "♥" },
  { path: "/queue", label: "File d'attente", icon: "⏳" },
  { path: "/profile", label: "Profil", icon: "👤" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <nav className="app-nav">
      <div className="nav-brand">VenueBoard</div>
      <div className="nav-items">
        {tabs.map((tab) => {
          const active =
            tab.path === "/"
              ? location.pathname === "/" || location.pathname.startsWith("/activity")
              : location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              type="button"
              className={`nav-item${active ? " active" : ""}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          className="nav-item nav-logout"
          onClick={logout}
        >
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}
