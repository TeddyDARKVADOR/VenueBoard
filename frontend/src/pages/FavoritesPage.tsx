import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../components/ConfirmModal";
import type { Activity, Favorite, Run, UserProfile } from "../types";
import { formatTime, getBadgeClass, getCategory, getCategoryLabel } from "../utils";

export default function FavoritesPage() {
  const { claims } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [error, setError] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      client.get("/activities"),
      client.get("/favorites"),
      client.get("/runs"),
      client.get("/user_profiles"),
    ]).then(([a, f, r, p]) => {
      setActivities(a.data);
      setFavorites(f.data);
      setRuns(r.data);
      setProfiles(p.data);
    }).catch((err) => setError(getErrorMessage(err)));
  }, []);

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.user_profile_id, p])),
    [profiles],
  );

  const speakerByActivity = useMemo(() => {
    const map = new Map<number, string>();
    for (const run of runs) {
      const p = profileMap.get(run.user_profile_id);
      if (p) map.set(run.activity_id, p.user_profile_name);
    }
    return map;
  }, [runs, profileMap]);

  const activityMap = useMemo(
    () => new Map(activities.map((a) => [a.activity_id, a])),
    [activities],
  );

  const myFavIds = useMemo(
    () =>
      favorites
        .filter((f) => f.user_profile_id === claims?.sub)
        .map((f) => f.activity_id),
    [favorites, claims],
  );

  const now = new Date();

  const upcoming = useMemo(
    () =>
      myFavIds
        .map((id) => activityMap.get(id))
        .filter((a): a is Activity => !!a && new Date(a.activity_end) >= now)
        .sort(
          (a, b) =>
            new Date(a.activity_start).getTime() -
            new Date(b.activity_start).getTime(),
        ),
    [myFavIds, activityMap],
  );

  const past = useMemo(
    () =>
      myFavIds
        .map((id) => activityMap.get(id))
        .filter((a): a is Activity => !!a && new Date(a.activity_end) < now)
        .sort(
          (a, b) =>
            new Date(b.activity_start).getTime() -
            new Date(a.activity_start).getTime(),
        ),
    [myFavIds, activityMap],
  );

  const removeFav = async (activityId: number) => {
    try {
      await client.delete(`/favorites/${activityId}`);
      setFavorites((prev) =>
        prev.filter(
          (f) =>
            !(f.user_profile_id === claims!.sub && f.activity_id === activityId),
        ),
      );
      toast("Retiré des favoris", "info");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  const displayed = tab === "upcoming" ? upcoming : past;

  return (
    <div className="page fade-in">
      <div className="fav-title-row">
        <h1>Mes favoris</h1>
        <span className="fav-total-count">{myFavIds.length}</span>
      </div>
      {error && <div className="error-msg" role="alert">{error}</div>}

      <div className="tabs" role="tablist">
        <button
          className={`tab${tab === "upcoming" ? " active" : ""}`}
          onClick={() => setTab("upcoming")}
          role="tab"
          aria-selected={tab === "upcoming"}
        >
          À venir <span className="tab-count">{upcoming.length}</span>
        </button>
        <button
          className={`tab${tab === "past" ? " active" : ""}`}
          onClick={() => setTab("past")}
          role="tab"
          aria-selected={tab === "past"}
        >
          Passés <span className="tab-count">{past.length}</span>
        </button>
      </div>

      {displayed.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-text">
            {tab === "upcoming"
              ? "Aucun favori à venir"
              : "Aucun favori passé"}
          </div>
        </div>
      )}

      {displayed.map((activity) => {
        const cat = getCategory(activity.activity_name);
        const speaker = speakerByActivity.get(activity.activity_id);

        return (
          <div
            key={activity.activity_id}
            className="activity-card slide-up"
            onClick={() => navigate(`/activity/${activity.activity_id}`)}
            role="article"
          >
            <div className="activity-card-header">
              <span className="activity-time">
                {formatTime(activity.activity_start)} -{" "}
                {formatTime(activity.activity_end)}
              </span>
              <button
                className="fav-btn active"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmRemoveId(activity.activity_id);
                }}
                aria-label="Retirer des favoris"
              >
                ♥
              </button>
            </div>
            <div className="activity-title">{activity.activity_name}</div>
            {speaker && <div className="activity-speaker">{speaker}</div>}
            <span className={getBadgeClass(cat)}>{getCategoryLabel(cat)}</span>
          </div>
        );
      })}

      <ConfirmModal
        open={confirmRemoveId !== null}
        title="Retirer des favoris"
        message="Voulez-vous retirer cette activité de vos favoris ?"
        confirmLabel="Retirer"
        danger
        onConfirm={() => {
          if (confirmRemoveId !== null) removeFav(confirmRemoveId);
          setConfirmRemoveId(null);
        }}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </div>
  );
}
