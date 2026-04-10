import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../../api/client";

interface Stats {
  events: number;
  activities: number;
  rooms: number;
  users: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      client.get("/events"),
      client.get("/activities"),
      client.get("/rooms"),
      client.get("/user_profiles"),
    ])
      .then(([e, a, r, u]) => {
        setStats({
          events: e.data.length,
          activities: a.data.length,
          rooms: r.data.length,
          users: u.data.length,
        });
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const sections = [
    { label: "Événements", icon: "🗓️", path: "/admin/events", count: stats?.events },
    { label: "Activités", icon: "🎤", path: "/admin/activities", count: stats?.activities },
    { label: "Salles", icon: "🏛️", path: "/admin/rooms", count: stats?.rooms },
    { label: "Utilisateurs", icon: "👥", path: "/admin/users", count: stats?.users },
  ];

  return (
    <div className="page fade-in">
      <h1 className="page-title">⚙️ Administration</h1>
      {error && <div className="error-msg" role="alert">{error}</div>}
      <div className="admin-grid">
        {sections.map((s) => (
          <button
            key={s.path}
            type="button"
            className="admin-card"
            onClick={() => navigate(s.path)}
          >
            <span className="admin-card-icon">{s.icon}</span>
            <span className="admin-card-label">{s.label}</span>
            {stats && (
              <span className="admin-card-count">{s.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
