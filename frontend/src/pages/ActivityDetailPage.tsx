import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { Activity, Queue, Register, Room, Run, UserProfile } from "../types";
import { formatDate, formatTime, getBadgeClass, getCategory, getCategoryLabel } from "../utils";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { claims } = useAuth();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      client.get(`/activities/${id}`),
      client.get("/runs"),
      client.get("/user_profiles"),
      client.get("/registers"),
      client.get("/queues"),
    ]).then(async ([a, ru, p, reg, q]) => {
      const act: Activity = a.data;
      setActivity(act);
      setRuns(ru.data);
      setProfiles(p.data);
      setRegisters(reg.data);
      setQueues(q.data);
      const roomResp = await client.get(`/rooms/${act.room_id}`);
      setRoom(roomResp.data);
      setLoading(false);
    }).catch((err) => {
      setError(getErrorMessage(err));
      setLoading(false);
    });
  }, [id]);

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.user_profile_id, p])),
    [profiles],
  );

  const speaker = useMemo(() => {
    if (!activity) return null;
    const run = runs.find((r) => r.activity_id === activity.activity_id);
    if (!run) return null;
    return profileMap.get(run.user_profile_id) ?? null;
  }, [runs, activity, profileMap]);

  const registerCount = useMemo(() => {
    if (!activity) return 0;
    return registers.filter((r) => r.activity_id === activity.activity_id)
      .length;
  }, [registers, activity]);

  const myQueue = useMemo(() => {
    if (!activity || !claims) return null;
    return (
      queues.find(
        (q) =>
          q.activity_id === activity.activity_id &&
          q.user_profile_id === claims.sub,
      ) ?? null
    );
  }, [queues, activity, claims]);

  const isRegistered = useMemo(() => {
    if (!activity || !claims) return false;
    return registers.some(
      (r) =>
        r.activity_id === activity.activity_id &&
        r.user_profile_id === claims.sub,
    );
  }, [registers, activity, claims]);

  const joinQueue = async () => {
    if (!activity) return;
    const resp = await client.post(`/queues/${activity.activity_id}`);
    setQueues((prev) => [
      ...prev,
      {
        position: resp.data.position,
        user_profile_id: claims!.sub,
        activity_id: activity.activity_id,
      },
    ]);
    // Refresh registers in case joining queue auto-registered us
    const regResp = await client.get("/registers");
    setRegisters(regResp.data);
  };

  const leaveQueue = async () => {
    if (!activity) return;
    await client.delete(`/queues/${activity.activity_id}`);
    setQueues((prev) =>
      prev.filter(
        (q) =>
          !(
            q.activity_id === activity.activity_id &&
            q.user_profile_id === claims!.sub
          ),
      ),
    );
  };

  if (error) return <div className="page error-msg">{error}</div>;
  if (loading || !activity)
    return <div className="loading-screen">Chargement...</div>;

  const cat = getCategory(activity.activity_name);
  const capacity = room?.room_capacity ?? 0;
  const remaining = Math.max(capacity - registerCount, 0);
  const isPast = new Date(activity.activity_end) < new Date();

  return (
    <div className="page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <div className={`detail-header-image ${cat}`} />

      <div className="detail-category">
        <span className={getBadgeClass(cat)}>{getCategoryLabel(cat)}</span>
      </div>

      <h1 className="detail-title">{activity.activity_name}</h1>

      <div className="detail-meta">
        <div className="detail-meta-item">
          <span className="detail-meta-icon">🕐</span>
          {formatDate(activity.activity_start)},{" "}
          {formatTime(activity.activity_start)} -{" "}
          {formatTime(activity.activity_end)}
        </div>
        {room && (
          <div className="detail-meta-item">
            <span className="detail-meta-icon">📍</span>
            {room.room_name}
          </div>
        )}
      </div>

      <div className="detail-capacity">
        <div className="capacity-bar">
          <div className="capacity-bar-text">
            {remaining}/{capacity} places restantes
          </div>
          <div className="capacity-bar-track">
            <div
              className={`capacity-bar-fill${remaining === 0 ? " full" : ""}`}
              style={{
                width: `${capacity > 0 ? Math.min((registerCount / capacity) * 100, 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {speaker && (
        <>
          <h2 className="detail-section-title">Intervenant</h2>
          <div className="speaker-card">
            <div className="speaker-avatar" />
            <div className="speaker-info">
              <div className="speaker-name">{speaker.user_profile_name}</div>
              <div className="speaker-role">{speaker.user_profile_role}</div>
              <div className="speaker-bio">{activity.activity_description}</div>
            </div>
          </div>
        </>
      )}

      {!speaker && activity.activity_description && (
        <>
          <h2 className="detail-section-title">À propos</h2>
          <div className="detail-about">{activity.activity_description}</div>
        </>
      )}

      {isPast ? (
        <div className="detail-action">
          <button className="btn btn-outline btn-full" disabled>
            Activité terminée
          </button>
        </div>
      ) : !isRegistered ? (
        <div className="detail-action">
          {myQueue ? (
            <button
              className="btn btn-danger btn-full"
              onClick={leaveQueue}
            >
              Quitter la file (position {myQueue.position})
            </button>
          ) : (
            <button
              className="btn btn-primary btn-full"
              onClick={joinQueue}
            >
              Rejoindre la file d&apos;attente
            </button>
          )}
        </div>
      ) : (
        <div className="detail-action">
          <button className="btn btn-outline btn-full" disabled>
            Déjà inscrit ✓
          </button>
        </div>
      )}
    </div>
  );
}
