import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";

const guestTabs = [
  { path: "/", label: "Programme", icon: "" },
  { path: "/favorites", label: "Favoris", icon: "" },
  { path: "/queue", label: "File", icon: "" },
  { path: "/profile", label: "Profil", icon: "" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { claims, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = claims?.role === "admin";
  const isStaff = claims?.role === "staff" || isAdmin;

  const tabs = [
    ...guestTabs,
    ...(isStaff ? [{ path: "/staff", label: "Staff", icon: "" }] : []),
    ...(isAdmin ? [{ path: "/admin", label: "Admin", icon: "" }] : []),
  ];

  return (
    <nav className="app-nav" role="navigation" aria-label="Navigation principale">
      <div className="nav-brand">
        VenueBoard
        <ThemeToggle />
      </div>
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
              aria-current={active ? "page" : undefined}
              aria-label={tab.label}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          className="nav-item nav-logout"
          onClick={handleLogout}
          aria-label="Déconnexion"
        >
          <span className="nav-label">Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}
