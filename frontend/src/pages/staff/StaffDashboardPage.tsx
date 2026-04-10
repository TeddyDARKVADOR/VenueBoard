import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";

interface StaffStats {
  activities: number;
  pendingQueues: number;
  checkedIn: number;
  totalRegisters: number;
}

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { claims } = useAuth();
  const isAdmin = claims?.role === "admin";

  const [stats, setStats] = useState<StaffStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      client.get("/activities"),
      client.get("/queues"),
      client.get("/registers"),
    ])
      .then(([a, q, r]) => {
        const registers = r.data as { is_checked_in?: boolean }[];
        setStats({
          activities: a.data.length,
          pendingQueues: q.data.length,
          checkedIn: registers.filter((reg) => reg.is_checked_in).length,
          totalRegisters: registers.length,
        });
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const sections = [
    {
      label: "Scanner les entrées",
      icon: "🎫",
      path: "/staff/scan",
      description: "Valider les inscriptions et cocher les participants",
    },
    {
      label: "Files d'attente",
      icon: "⏳",
      path: "/staff/queue",
      description: "Gérer et promouvoir les files d'attente",
    },
  ];

  return (
    <div className="page fade-in">
      <h1 className="page-title">🔧 Espace Staff</h1>
      {error && <div className="error-msg" role="alert">{error}</div>}

      {stats && (
        <div className="staff-stats">
          <div className="staff-stat">
            <span className="staff-stat-value">{stats.checkedIn}/{stats.totalRegisters}</span>
            <span className="staff-stat-label">Entrées validées</span>
          </div>
          <div className="staff-stat">
            <span className="staff-stat-value">{stats.pendingQueues}</span>
            <span className="staff-stat-label">En attente</span>
          </div>
          <div className="staff-stat">
            <span className="staff-stat-value">{stats.activities}</span>
            <span className="staff-stat-label">Activités</span>
          </div>
        </div>
      )}

      <div className="admin-grid">
        {sections.map((s) => (
          <button
            key={s.path}
            type="button"
            className="admin-card admin-card-wide"
            onClick={() => navigate(s.path)}
          >
            <span className="admin-card-icon">{s.icon}</span>
            <div>
              <div className="admin-card-label">{s.label}</div>
              <div className="admin-card-desc">{s.description}</div>
            </div>
          </button>
        ))}
        {isAdmin && (
          <button
            type="button"
            className="admin-card admin-card-wide"
            onClick={() => navigate("/admin")}
          >
            <span className="admin-card-icon">⚙️</span>
            <div>
              <div className="admin-card-label">Administration</div>
              <div className="admin-card-desc">Accéder au tableau de bord admin</div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
