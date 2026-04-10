import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../components/ConfirmModal";
import type { Activity, Favorite, Queue, Register, UserProfile } from "../types";
import { formatTime, getBadgeClass, getCategory, getCategoryLabel } from "../utils";

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

function getBadges(registerCount: number, favCount: number, queueCount: number) {
  const badges: { icon: string; label: string; earned: boolean }[] = [
    { icon: "", label: "Première inscription", earned: registerCount >= 1 },
    { icon: "", label: "Explorateur", earned: registerCount >= 3 },
    { icon: "", label: "Habitué", earned: registerCount >= 5 },
    { icon: "", label: "Expert", earned: registerCount >= 8 },
    { icon: "", label: "Collectionneur", earned: favCount >= 3 },
    { icon: "", label: "Patient", earned: queueCount >= 2 },
  ];
  return badges;
}

export default function ProfilePage() {
  const { claims, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!claims) return;
    Promise.all([
      client.get(`/user_profiles/${claims.sub}`),
      client.get("/registers"),
      client.get("/queues"),
      client.get("/favorites"),
      client.get("/activities"),
    ])
      .then(([p, r, q, f, a]) => {
        setProfile(p.data);
        setRegisters(r.data);
        setQueues(q.data);
        setFavorites(f.data);
        setActivities(a.data);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [claims]);

  const activityMap = useMemo(
    () => new Map(activities.map((a) => [a.activity_id, a])),
    [activities],
  );

  if (error) return <div className="page error-msg" role="alert">{error}</div>;
  if (!profile) return <div className="loading-screen"><div className="spinner" />Chargement...</div>;

  const myRegisters = registers.filter(
    (r) => r.user_profile_id === claims!.sub,
  );
  const myQueues = queues.filter(
    (q) => q.user_profile_id === claims!.sub,
  );
  const myFavorites = favorites.filter(
    (f) => f.user_profile_id === claims!.sub,
  );

  const badges = getBadges(myRegisters.length, myFavorites.length, myQueues.length);
  const earnedCount = badges.filter((b) => b.earned).length;

  const myPastActivities = myRegisters
    .map((r) => activityMap.get(r.activity_id))
    .filter((a): a is Activity => !!a && new Date(a.activity_end) < new Date())
    .sort((a, b) => new Date(b.activity_start).getTime() - new Date(a.activity_start).getTime());

  const handleLogout = () => {
    logout();
    toast("Déconnexion réussie", "info");
    navigate("/login");
  };

  return (
    <div className="page fade-in">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.user_profile_name.charAt(0).toUpperCase()}
        </div>
        <div className="profile-name">{profile.user_profile_name}</div>
        <div className="profile-role-badge">
          {roleLabel(profile.user_profile_role)}
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat-value">{myRegisters.length}</div>
          <div className="profile-stat-label">Inscriptions</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-value">{myQueues.length}</div>
          <div className="profile-stat-label">Files d'attente</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-value">{myFavorites.length}</div>
          <div className="profile-stat-label">Favoris</div>
        </div>
      </div>

      <h2 className="section-title">Badges ({earnedCount}/{badges.length})</h2>
      <div className="badges-grid">
        {badges.map((b) => (
          <div
            key={b.label}
            className={`badge-card${b.earned ? " earned" : ""}`}
          >
            <span className="badge-card-icon">{b.icon}</span>
            <span className="badge-card-label">{b.label}</span>
          </div>
        ))}
      </div>

      {myPastActivities.length > 0 && (
        <div className="history-section">
          <div
            className="history-header"
            onClick={() => setHistoryOpen(!historyOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setHistoryOpen(!historyOpen)}
            aria-expanded={historyOpen}
          >
            <h2 className="section-title">Historique ({myPastActivities.length})</h2>
            <span className="history-toggle">
              {historyOpen ? "▲" : "▼"}
            </span>
          </div>
          {historyOpen &&
            myPastActivities.map((a) => {
              const cat = getCategory(a.activity_name);
              return (
                <div key={a.activity_id} className="history-item slide-up">
                  <div className="history-item-time">
                    {formatTime(a.activity_start)} - {formatTime(a.activity_end)}
                  </div>
                  <div className="history-item-name">{a.activity_name}</div>
                  <span className={getBadgeClass(cat)}>{getCategoryLabel(cat)}</span>
                </div>
              );
            })}
        </div>
      )}

      <div className="profile-logout">
        <button className="btn btn-danger btn-full" onClick={() => setConfirmLogout(true)}>
          Se déconnecter
        </button>
      </div>

      <div className="profile-version">Version 1.1.0</div>

      <ConfirmModal
        open={confirmLogout}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter ?"
        confirmLabel="Se déconnecter"
        danger
        onConfirm={() => {
          setConfirmLogout(false);
          handleLogout();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
