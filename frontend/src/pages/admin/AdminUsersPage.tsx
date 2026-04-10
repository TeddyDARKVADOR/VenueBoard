import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../../api/client";
import { useToast } from "../../contexts/ToastContext";
import type { UserProfile, Role } from "../../types";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  staff: "Staff",
  speaker: "Intervenant",
  guest: "Participant",
};
const ALL_ROLES: Role[] = ["guest", "speaker", "staff", "admin"];

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const reload = () =>
    client
      .get("/user_profiles")
      .then((r) => {
        setProfiles(r.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      });

  useEffect(() => { reload(); }, []);

  const handleRoleChange = async (userId: number, newRole: Role) => {
    setUpdatingId(userId);
    try {
      await client.put(`/user_profiles/${userId}`, { user_profile_role: newRole });
      setProfiles((prev) =>
        prev.map((p) =>
          p.user_profile_id === userId ? { ...p, user_profile_role: newRole } : p,
        ),
      );
      toast("Rôle mis à jour", "success");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = profiles.filter((p) => {
    const matchSearch =
      !search ||
      p.user_profile_name.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || p.user_profile_role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) return <div className="loading-screen"><div className="spinner" />Chargement...</div>;

  return (
    <div className="page fade-in">
      <button className="detail-back" type="button" onClick={() => navigate("/admin")}>
        ← Admin
      </button>
      <h1 className="page-title">👥 Utilisateurs</h1>
      {error && <div className="error-msg" role="alert">{error}</div>}

      <div className="admin-filters">
        <input
          className="admin-search"
          placeholder="Rechercher un utilisateur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="chip-row">
          {(["all", ...ALL_ROLES] as ("all" | Role)[]).map((r) => (
            <button
              key={r}
              type="button"
              className={`chip${roleFilter === r ? " active" : ""}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === "all" ? "Tous" : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-list">
        {filtered.length === 0 && <p className="empty-state">Aucun utilisateur trouvé</p>}
        {filtered.map((profile) => (
          <div key={profile.user_profile_id} className="admin-list-item">
            <div className="admin-list-item-info">
              <strong>{profile.user_profile_name}</strong>
              <span className="admin-list-item-meta">
                ID #{profile.user_profile_id}
              </span>
            </div>
            <select
              className="admin-role-select"
              value={profile.user_profile_role}
              disabled={updatingId === profile.user_profile_id}
              onChange={(e) =>
                handleRoleChange(profile.user_profile_id, e.target.value as Role)
              }
              aria-label={`Rôle de ${profile.user_profile_name}`}
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
