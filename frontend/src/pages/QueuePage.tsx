import { useEffect, useMemo, useState } from "react";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../components/ConfirmModal";
import type { Activity, Queue } from "../types";
import { formatTime } from "../utils";

export default function QueuePage() {
  const { claims } = useAuth();
  const { toast } = useToast();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmLeaveId, setConfirmLeaveId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([client.get("/activities"), client.get("/queues")]).then(
      ([a, q]) => {
        setActivities(a.data);
        setQueues(q.data);
      },
    ).catch((err) => setError(getErrorMessage(err)));
  }, []);

  const activityMap = useMemo(
    () => new Map(activities.map((a) => [a.activity_id, a])),
    [activities],
  );

  const myQueues = useMemo(
    () =>
      queues
        .filter((q) => q.user_profile_id === claims?.sub)
        .sort((a, b) => a.position - b.position),
    [queues, claims],
  );

  const now = new Date();

  const activeQueues = useMemo(
    () =>
      myQueues.filter((q) => {
        const a = activityMap.get(q.activity_id);
        return a && new Date(a.activity_end) >= now;
      }),
    [myQueues, activityMap],
  );

  const pastQueues = useMemo(
    () =>
      myQueues.filter((q) => {
        const a = activityMap.get(q.activity_id);
        return a && new Date(a.activity_end) < now;
      }),
    [myQueues, activityMap],
  );

  const first = activeQueues[0];
  const firstActivity = first ? activityMap.get(first.activity_id) : null;
  const rest = activeQueues.slice(1);

  const leaveQueue = async (activityId: number) => {
    try {
      await client.delete(`/queues/${activityId}`);
      setQueues((prev) =>
        prev.filter(
          (q) =>
            !(
              q.activity_id === activityId &&
              q.user_profile_id === claims!.sub
            ),
        ),
      );
      toast("Vous avez quitté la file", "info");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header-row">
        <h1 className="page-title">Ma file d'attente</h1>
        <span className="fav-total-count" style={{ marginBottom: 16 }}>
          {activeQueues.length}
        </span>
      </div>
      {error && <div className="error-msg" role="alert">{error}</div>}

      {first && firstActivity ? (
        <div className="queue-position-card">
          <div className="queue-position-number">{first.position}</div>
          <div className="queue-position-label">Votre position</div>
          <div className="queue-position-estimate">
            ~{first.position * 2} min
          </div>
          <div className="queue-position-bar">
            <div
              className="queue-position-bar-fill"
              style={{
                width: `${Math.max(10, 100 - first.position * 10)}%`,
              }}
            />
          </div>
          <div className="queue-activity-name">
            {firstActivity.activity_name}
          </div>
          <button
            className="btn btn-danger btn-sm"
            style={{ marginTop: 8 }}
            onClick={() => setConfirmLeaveId(first.activity_id)}
          >
            Quitter la file
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-text">
            Vous n'êtes dans aucune file d'attente
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="section-title">Activités en attente</h2>
          {rest.map((q) => {
            const a = activityMap.get(q.activity_id);
            if (!a) return null;
            return (
              <div key={q.activity_id} className="queue-item slide-up">
                <div className="queue-item-info">
                  <div className="queue-item-time">
                    {formatTime(a.activity_start)} -{" "}
                    {formatTime(a.activity_end)}
                  </div>
                  <div className="queue-item-name">{a.activity_name}</div>
                  <div className="queue-item-position">
                    Position : {q.position}
                  </div>
                </div>
                <button
                  className="queue-delete-btn"
                  onClick={() => setConfirmLeaveId(q.activity_id)}
                  aria-label={`Quitter la file pour ${a.activity_name}`}
                >
                  🗑
                </button>
              </div>
            );
          })}
        </>
      )}

      {pastQueues.length > 0 && (
        <div className="history-section">
          <div
            className="history-header"
            onClick={() => setHistoryOpen(!historyOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setHistoryOpen(!historyOpen)}
            aria-expanded={historyOpen}
          >
            <h2 className="section-title">Historique</h2>
            <span className="history-toggle">
              {historyOpen ? "▲" : "▼"}
            </span>
          </div>
          {historyOpen &&
            pastQueues.map((q) => {
              const a = activityMap.get(q.activity_id);
              if (!a) return null;
              return (
                <div key={q.activity_id} className="history-item slide-up">
                  <div className="history-item-time">
                    {formatTime(a.activity_start)} -{" "}
                    {formatTime(a.activity_end)}
                  </div>
                  <div className="history-item-name">{a.activity_name}</div>
                  <span className="status-badge status-participated">
                    Participé
                  </span>
                </div>
              );
            })}
        </div>
      )}

      <ConfirmModal
        open={confirmLeaveId !== null}
        title="Quitter la file"
        message="Êtes-vous sûr de vouloir quitter cette file d'attente ?"
        confirmLabel="Quitter"
        danger
        onConfirm={() => {
          if (confirmLeaveId !== null) leaveQueue(confirmLeaveId);
          setConfirmLeaveId(null);
        }}
        onCancel={() => setConfirmLeaveId(null)}
      />
    </div>
  );
}
