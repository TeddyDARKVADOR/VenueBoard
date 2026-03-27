import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { Favorite, Queue, Register, UserProfile } from "../types";

function roleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "staff":
      return "Staff";
    case "speaker":
      return "Intervenant";
    default:
      return "Participant";
  }
}

export default function ProfilePage() {
  const { claims, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!claims) return;
    Promise.all([
      client.get(`/user_profiles/${claims.sub}`),
      client.get("/registers"),
      client.get("/queues"),
      client.get("/favorites"),
    ])
      .then(([p, r, q, f]) => {
        setProfile(p.data);
        setRegisters(r.data);
        setQueues(q.data);
        setFavorites(f.data);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [claims]);

  if (error) return <div className="page error-msg">{error}</div>;
  if (!profile) return <div className="loading-screen">Chargement...</div>;

  const myRegisters = registers.filter(
    (r) => r.user_profile_id === claims!.sub,
  ).length;
  const myQueues = queues.filter(
    (q) => q.user_profile_id === claims!.sub,
  ).length;
  const myFavorites = favorites.filter(
    (f) => f.user_profile_id === claims!.sub,
  ).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { icon: "👤", label: "Mes informations" },
    { icon: "🏆", label: "Mes badges" },
    { icon: "🤝", label: "Mes connexions" },
    { icon: "🔔", label: "Préférences notifications" },
    { icon: "⚙️", label: "Paramètres" },
    { icon: "❓", label: "Aide & Support" },
  ];

  return (
    <div className="page">
      <div className="profile-header">
        <div className="profile-avatar" />
        <div className="profile-name">{profile.user_profile_name}</div>
        <div className="profile-role-badge">
          {roleLabel(profile.user_profile_role)}
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat-value">{myRegisters}</div>
          <div className="profile-stat-label">Activités participées</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-value">{myQueues}</div>
          <div className="profile-stat-label">Files d'attente</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-value">{myFavorites}</div>
          <div className="profile-stat-label">Favoris</div>
        </div>
      </div>

      <div className="profile-menu">
        {menuItems.map((item) => (
          <div key={item.label} className="profile-menu-item">
            <div className="profile-menu-item-left">
              <span className="profile-menu-icon">{item.icon}</span>
              {item.label}
            </div>
            <span className="profile-menu-arrow">›</span>
          </div>
        ))}
      </div>

      <div className="profile-logout">
        <button className="btn btn-danger btn-full" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>

      <div className="profile-version">Version 1.0.0</div>
    </div>
  );
}
