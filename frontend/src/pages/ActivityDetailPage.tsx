import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../components/ConfirmModal";
import SpeakerModal from "../components/SpeakerModal";
import type { Activity, Queue, Register, Room, Run, UserProfile } from "../types";
import { formatDate, formatTime, getBadgeClass, getCategory, getCategoryLabel } from "../utils";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { claims } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<UserProfile | null>(null);

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

  const speakerActivitiesCount = useMemo(() => {
    if (!speaker) return 0;
    return runs.filter((r) => r.user_profile_id === speaker.user_profile_id).length;
  }, [runs, speaker]);

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
    try {
      const resp = await client.post(`/queues/${activity.activity_id}`);
      setQueues((prev) => [
        ...prev,
        {
          position: resp.data.position,
          user_profile_id: claims!.sub,
          activity_id: activity.activity_id,
        },
      ]);
      const regResp = await client.get("/registers");
      setRegisters(regResp.data);
      toast("Vous avez rejoint la file d'attente", "success");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  const leaveQueue = async () => {
    if (!activity) return;
    try {
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
      toast("Vous avez quitté la file", "info");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  if (loading || !activity)
    return <div className="loading-screen"><div className="spinner" />Chargement...</div>;

  const cat = getCategory(activity.activity_name);
  const capacity = room?.room_capacity ?? 0;
  const remaining = Math.max(capacity - registerCount, 0);
  const isPast = new Date(activity.activity_end) < new Date();

  return (
    <div className="page fade-in">
      <button className="detail-back" onClick={() => navigate(-1)} aria-label="Retour">
        ← Retour
      </button>

      {error && <div className="error-msg" role="alert">{error}</div>}

      <div className={`detail-header-image ${cat}`} />

      <div className="detail-category">
        <span className={getBadgeClass(cat)}>{getCategoryLabel(cat)}</span>
        {isPast && <span className="badge badge-past">Terminée</span>}
      </div>

      <h1 className="detail-title">{activity.activity_name}</h1>

      <div className="detail-meta">
        <div className="detail-meta-item">
          {formatDate(activity.activity_start)},{" "}
          {formatTime(activity.activity_start)} -{" "}
          {formatTime(activity.activity_end)}
        </div>
        {room && (
          <div className="detail-meta-item">
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
          <div
            className="speaker-card clickable"
            onClick={() => setSelectedSpeaker(speaker)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSelectedSpeaker(speaker)}
          >
            <div className="speaker-avatar">
              {speaker.user_profile_name.charAt(0).toUpperCase()}
            </div>
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
              onClick={() => setConfirmLeave(true)}
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

      <ConfirmModal
        open={confirmLeave}
        title="Quitter la file"
        message="Êtes-vous sûr de vouloir quitter la file d'attente ? Vous perdrez votre position."
        confirmLabel="Quitter"
        danger
        onConfirm={() => {
          setConfirmLeave(false);
          leaveQueue();
        }}
        onCancel={() => setConfirmLeave(false)}
      />

      <SpeakerModal
        speaker={selectedSpeaker}
        activitiesCount={speakerActivitiesCount}
        onClose={() => setSelectedSpeaker(null)}
      />
    </div>
  );
}
