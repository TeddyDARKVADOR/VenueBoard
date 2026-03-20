import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/", label: "Programme", icon: "📋" },
  { path: "/favorites", label: "Favoris", icon: "♥" },
  { path: "/queue", label: "File d'attente", icon: "⏳" },
  { path: "/profile", label: "Profil", icon: "👤" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const active =
          tab.path === "/"
            ? location.pathname === "/" || location.pathname.startsWith("/activity")
            : location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            type="button"
            className={`bottom-nav-item${active ? " active" : ""}`}
            onClick={() => navigate(tab.path)}
          >
            <span className="bottom-nav-icon">{tab.icon}</span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
