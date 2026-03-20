import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface Favorite {
  user_profile_id: number;
  activity_id: number;
}

interface Run {
  user_profile_id: number;
  activity_id: number;
}

interface UserProfile {
  user_profile_id: number;
  user_profile_name: string;
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

export default function FavoritesPage() {
  const { claims } = useAuth();
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

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
    });
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
    await client.delete(`/favorites/${activityId}`);
    setFavorites((prev) =>
      prev.filter(
        (f) =>
          !(f.user_profile_id === claims!.sub && f.activity_id === activityId),
      ),
    );
  };

  const displayed = tab === "upcoming" ? upcoming : past;

  return (
    <div className="page">
      <div className="fav-title-row">
        <h1>Mes favoris</h1>
        <span className="fav-total-count">{myFavIds.length}</span>
      </div>

      <div className="tabs">
        <button
          className={`tab${tab === "upcoming" ? " active" : ""}`}
          onClick={() => setTab("upcoming")}
        >
          À venir <span className="tab-count">{upcoming.length}</span>
        </button>
        <button
          className={`tab${tab === "past" ? " active" : ""}`}
          onClick={() => setTab("past")}
        >
          Passés <span className="tab-count">{past.length}</span>
        </button>
      </div>

      {displayed.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">♥</div>
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
            className="activity-card"
            onClick={() => navigate(`/activity/${activity.activity_id}`)}
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
                  removeFav(activity.activity_id);
                }}
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
    </div>
  );
}
