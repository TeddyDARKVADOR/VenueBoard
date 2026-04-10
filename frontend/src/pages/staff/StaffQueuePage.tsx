import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../../api/client";
import { useToast } from "../../contexts/ToastContext";
import type { Activity, Queue, UserProfile } from "../../types";

export default function StaffQueuePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [queues, setQueues] = useState<Queue[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const reload = () =>
    Promise.all([
      client.get("/queues"),
      client.get("/activities"),
      client.get("/user_profiles"),
    ])
      .then(([q, a, p]) => {
        setQueues(q.data);
        setActivities(a.data);
        setProfiles(p.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      });

  useEffect(() => { reload(); }, []);

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.user_profile_id, p])),
    [profiles],
  );

  const queuesByActivity = useMemo(() => {
    const map = new Map<number, Queue[]>();
    for (const q of queues) {
      const list = map.get(q.activity_id) ?? [];
      list.push(q);
      map.set(q.activity_id, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [queues]);

  const activitiesWithQueue = useMemo(
    () =>
      activities.filter((a) => (queuesByActivity.get(a.activity_id)?.length ?? 0) > 0),
    [activities, queuesByActivity],
  );

  const handlePromoteQueue = async () => {
    setActionLoading(true);
    try {
      await client.get("/queues_to_register");
      await reload();
      toast("Files d'attente promues en inscriptions", "success");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCleanPositions = async () => {
    setActionLoading(true);
    try {
      await client.get("/queues_positions");
      await reload();
      toast("Positions recalculées", "success");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" />Chargement...</div>;

  return (
    <div className="page fade-in">
      <button className="detail-back" type="button" onClick={() => navigate("/staff")}>
        ← Staff
      </button>
      <h1 className="page-title">⏳ Files d'attente</h1>
      {error && <div className="error-msg" role="alert">{error}</div>}

      <div className="queue-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePromoteQueue}
          disabled={actionLoading}
        >
          Promouvoir les files → inscriptions
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleCleanPositions}
          disabled={actionLoading}
        >
          Recalculer les positions
        </button>
      </div>

      <div className="queue-summary">
        <span className="queue-summary-total">
          {queues.length} personne{queues.length > 1 ? "s" : ""} en attente
        </span>
      </div>

      {activitiesWithQueue.length === 0 && (
        <p className="empty-state">Aucune file d'attente active</p>
      )}

      <div className="admin-list">
        {activitiesWithQueue.map((act) => {
          const list = queuesByActivity.get(act.activity_id) ?? [];
          const isOpen = selectedId === act.activity_id;
          return (
            <div key={act.activity_id} className="queue-activity-block">
              <button
                type="button"
                className="queue-activity-header"
                onClick={() =>
                  setSelectedId(isOpen ? null : act.activity_id)
                }
              >
                <span className="queue-activity-name">{act.activity_name}</span>
                <span className="queue-activity-count">
                  {list.length} en attente {isOpen ? "▲" : "▼"}
                </span>
              </button>
              {isOpen && (
                <div className="queue-participant-list">
                  {list.map((q) => (
                    <div key={q.user_profile_id} className="queue-participant-item">
                      <span className="queue-position">#{q.position}</span>
                      <span className="queue-participant-name">
                        {profileMap.get(q.user_profile_id)?.user_profile_name ?? `Utilisateur #${q.user_profile_id}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
