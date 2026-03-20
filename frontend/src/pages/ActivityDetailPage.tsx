import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../contexts/AuthContext";

interface Activity {
  activity_id: number;
  activity_name: string;
  activity_description: string;
  activity_start: string;
  activity_end: string;
  room_id: number;
}

interface Room {
  room_id: number;
  room_name: string;
  room_capacity: number;
}

interface Run {
  user_profile_id: number;
  activity_id: number;
}

interface UserProfile {
  user_profile_id: number;
  user_profile_name: string;
  user_profile_role: string;
}

interface Register {
  user_profile_id: number;
  activity_id: number;
}

interface Queue {
  position: number;
  user_profile_id: number;
  activity_id: number;
}

function getCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("workshop") || lower.includes("atelier"))
    return "atelier";
  if (lower.includes("networking") || lower.includes("pause"))
    return "networking";
  return "conference";
}

function getCategoryLabel(cat: string): string {
  switch (cat) {
    case "atelier":
      return "Atelier";
    case "networking":
      return "Networking";
    default:
      return "Conférence";
  }
}

function getBadgeClass(cat: string): string {
  switch (cat) {
    case "atelier":
      return "badge badge-atelier";
    case "networking":
      return "badge badge-networking";
    default:
      return "badge badge-conference";
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

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

  if (loading || !activity)
    return <div className="loading-screen">Chargement...</div>;

  const cat = getCategory(activity.activity_name);
  const capacity = room?.room_capacity ?? 0;

  return (
    <div className="page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <div className="detail-header-image" />

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
            {registerCount}/{capacity} places restantes
          </div>
          <div className="capacity-bar-track">
            <div
              className={`capacity-bar-fill${registerCount >= capacity ? " full" : ""}`}
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

      {!isRegistered && (
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
      )}

      {isRegistered && (
        <div className="detail-action">
          <button className="btn btn-outline btn-full" disabled>
            Déjà inscrit ✓
          </button>
        </div>
      )}
    </div>
  );
}
