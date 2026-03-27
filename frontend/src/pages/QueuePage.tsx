import { useEffect, useMemo, useState } from "react";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { Activity, Queue } from "../types";
import { formatTime } from "../utils";

export default function QueuePage() {
  const { claims } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  };

  return (
    <div className="page">
      <div className="page-header-row">
        <h1 className="page-title">Ma file d'attente</h1>
        <span className="fav-total-count" style={{ marginBottom: 16 }}>
          {activeQueues.length}
        </span>
      </div>
      {error && <div className="error-msg">{error}</div>}

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
            onClick={() => leaveQueue(first.activity_id)}
          >
            Quitter la file
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
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
              <div key={q.activity_id} className="queue-item">
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
                  onClick={() => leaveQueue(q.activity_id)}
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
                <div key={q.activity_id} className="history-item">
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
    </div>
  );
}
