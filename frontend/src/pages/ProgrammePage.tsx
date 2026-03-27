import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { Activity, Category, Favorite, Register, Room, Run, UserProfile } from "../types";
import { formatTime, getBadgeClass, getCategory, getCategoryLabel } from "../utils";

export default function ProgrammePage() {
  const { claims } = useAuth();
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Category>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      client.get("/activities"),
      client.get("/rooms"),
      client.get("/runs"),
      client.get("/user_profiles"),
      client.get("/favorites"),
      client.get("/registers"),
    ]).then(([a, ro, ru, p, f, reg]) => {
      setActivities(a.data);
      setRooms(ro.data);
      setRuns(ru.data);
      setProfiles(p.data);
      setFavorites(f.data);
      setRegisters(reg.data);
    }).catch((err) => setError(getErrorMessage(err)));
  }, []);

  const roomMap = useMemo(
    () => new Map(rooms.map((r) => [r.room_id, r])),
    [rooms],
  );

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

  const myFavorites = useMemo(
    () =>
      new Set(
        favorites
          .filter((f) => f.user_profile_id === claims?.sub)
          .map((f) => f.activity_id),
      ),
    [favorites, claims],
  );

  const registerCount = useMemo(() => {
    const map = new Map<number, number>();
    for (const r of registers) {
      map.set(r.activity_id, (map.get(r.activity_id) ?? 0) + 1);
    }
    return map;
  }, [registers]);

  const filtered = useMemo(() => {
    let list = activities;
    if (filter !== "all") {
      list = list.filter((a) => getCategory(a.activity_name) === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.activity_name.toLowerCase().includes(q) ||
          (speakerByActivity.get(a.activity_id) ?? "")
            .toLowerCase()
            .includes(q),
      );
    }
    return list.sort(
      (a, b) =>
        new Date(a.activity_start).getTime() -
        new Date(b.activity_start).getTime(),
    );
  }, [activities, filter, search, speakerByActivity]);

  const toggleFav = async (activityId: number) => {
    if (myFavorites.has(activityId)) {
      await client.delete(`/favorites/${activityId}`);
      setFavorites((prev) =>
        prev.filter(
          (f) =>
            !(f.user_profile_id === claims!.sub && f.activity_id === activityId),
        ),
      );
    } else {
      await client.post(`/favorites/${activityId}`);
      setFavorites((prev) => [
        ...prev,
        { user_profile_id: claims!.sub, activity_id: activityId },
      ]);
    }
  };

  const chips: { key: Category; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "conference", label: "Conférences" },
    { key: "atelier", label: "Ateliers" },
    { key: "networking", label: "Networking" },
  ];

  return (
    <div className="page">
      <h1 className="page-title">Programme</h1>
      {error && <div className="error-msg">{error}</div>}

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          placeholder="Rechercher une activité..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-chips">
        {chips.map((c) => (
          <button
            key={c.key}
            className={`chip${filter === c.key ? " active" : ""}`}
            onClick={() => setFilter(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">Aucune activité trouvée</div>
        </div>
      )}

      <div className="activity-grid">
      {filtered.map((activity) => {
        const cat = getCategory(activity.activity_name);
        const room = roomMap.get(activity.room_id);
        const speaker = speakerByActivity.get(activity.activity_id);
        const count = registerCount.get(activity.activity_id) ?? 0;
        const capacity = room?.room_capacity ?? 0;
        const pct = capacity > 0 ? (count / capacity) * 100 : 0;
        const isFav = myFavorites.has(activity.activity_id);
        const isPast = new Date(activity.activity_end) < new Date();

        return (
          <div
            key={activity.activity_id}
            className={`activity-card${isPast ? " past" : ""}`}
            data-category={cat}
            onClick={() => !isPast && navigate(`/activity/${activity.activity_id}`)}
          >
            <div className="activity-card-header">
              <span className="activity-time">
                {formatTime(activity.activity_start)} -{" "}
                {formatTime(activity.activity_end)}
              </span>
              <button
                className={`fav-btn${isFav ? " active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFav(activity.activity_id);
                }}
              >
                {isFav ? "♥" : "♡"}
              </button>
            </div>
            <div className="activity-title">{activity.activity_name}</div>
            {speaker && <div className="activity-speaker">{speaker}</div>}
            <span className={getBadgeClass(cat)}>{getCategoryLabel(cat)}</span>
            {isPast && <span className="badge badge-past">Terminée</span>}
            {room && (
              <div className="capacity-bar">
                <div className="capacity-bar-text">
                  {count}/{capacity} places
                </div>
                <div className="capacity-bar-track">
                  <div
                    className={`capacity-bar-fill${pct >= 100 ? " full" : pct >= 80 ? " low" : ""}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
