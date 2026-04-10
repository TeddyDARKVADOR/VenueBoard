import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import SpeakerModal from "../components/SpeakerModal";
import type { Activity, Category, Favorite, Register, Room, Run, UserProfile } from "../types";
import { formatTime, getBadgeClass, getCategory, getCategoryLabel } from "../utils";

type AvailabilityFilter = "all" | "available" | "full";

export default function ProgrammePage() {
  const { claims } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Category>("all");
  const [availFilter, setAvailFilter] = useState<AvailabilityFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<UserProfile | null>(null);

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

  const speakerProfileByActivity = useMemo(() => {
    const map = new Map<number, UserProfile>();
    for (const run of runs) {
      const p = profileMap.get(run.user_profile_id);
      if (p) map.set(run.activity_id, p);
    }
    return map;
  }, [runs, profileMap]);

  const speakerActivitiesCount = useMemo(() => {
    const map = new Map<number, number>();
    for (const run of runs) {
      map.set(run.user_profile_id, (map.get(run.user_profile_id) ?? 0) + 1);
    }
    return map;
  }, [runs]);

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
    if (availFilter !== "all") {
      list = list.filter((a) => {
        const room = roomMap.get(a.room_id);
        const count = registerCount.get(a.activity_id) ?? 0;
        const capacity = room?.room_capacity ?? 0;
        const isFull = capacity > 0 && count >= capacity;
        return availFilter === "available" ? !isFull : isFull;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.activity_name.toLowerCase().includes(q) ||
          (speakerProfileByActivity.get(a.activity_id)?.user_profile_name ?? "")
            .toLowerCase()
            .includes(q) ||
          (roomMap.get(a.room_id)?.room_name ?? "").toLowerCase().includes(q),
      );
    }
    return list.sort(
      (a, b) =>
        new Date(a.activity_start).getTime() -
        new Date(b.activity_start).getTime(),
    );
  }, [activities, filter, availFilter, search, speakerProfileByActivity, roomMap, registerCount]);

  const toggleFav = async (activityId: number) => {
    try {
      if (myFavorites.has(activityId)) {
        await client.delete(`/favorites/${activityId}`);
        setFavorites((prev) =>
          prev.filter(
            (f) =>
              !(f.user_profile_id === claims!.sub && f.activity_id === activityId),
          ),
        );
        toast("Retiré des favoris", "info");
      } else {
        await client.post(`/favorites/${activityId}`);
        setFavorites((prev) => [
          ...prev,
          { user_profile_id: claims!.sub, activity_id: activityId },
        ]);
        toast("Ajouté aux favoris", "success");
      }
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  const chips: { key: Category; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "conference", label: "Conférences" },
    { key: "atelier", label: "Ateliers" },
    { key: "networking", label: "Networking" },
  ];

  const availChips: { key: AvailabilityFilter; label: string }[] = [
    { key: "all", label: "Toutes" },
    { key: "available", label: "Places dispo" },
    { key: "full", label: "Complet" },
  ];

  const upcomingCount = activities.filter(
    (a) => new Date(a.activity_end) >= new Date(),
  ).length;

  return (
    <div className="page fade-in">
      <div className="page-header-row">
        <h1 className="page-title">Programme</h1>
        <span className="fav-total-count">{upcomingCount} à venir</span>
      </div>
      {error && <div className="error-msg" role="alert">{error}</div>}

      <div className="search-bar">
        <input
          placeholder="Rechercher activité, intervenant, salle…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher une activité"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch("")} aria-label="Effacer la recherche">
            ✕
          </button>
        )}
      </div>

      <div className="filter-chips" role="group" aria-label="Filtrer par catégorie">
        {chips.map((c) => (
          <button
            key={c.key}
            className={`chip${filter === c.key ? " active" : ""}`}
            onClick={() => setFilter(c.key)}
            aria-pressed={filter === c.key}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="filter-chips" role="group" aria-label="Filtrer par disponibilité">
        {availChips.map((c) => (
          <button
            key={c.key}
            className={`chip chip-secondary${availFilter === c.key ? " active" : ""}`}
            onClick={() => setAvailFilter(c.key)}
            aria-pressed={availFilter === c.key}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-text">Aucune activité trouvée</div>
        </div>
      )}

      <div className="activity-grid">
        {filtered.map((activity) => {
          const cat = getCategory(activity.activity_name);
          const room = roomMap.get(activity.room_id);
          const speakerProfile = speakerProfileByActivity.get(activity.activity_id);
          const count = registerCount.get(activity.activity_id) ?? 0;
          const capacity = room?.room_capacity ?? 0;
          const pct = capacity > 0 ? (count / capacity) * 100 : 0;
          const isFav = myFavorites.has(activity.activity_id);
          const isPast = new Date(activity.activity_end) < new Date();

          return (
            <div
              key={activity.activity_id}
              className={`activity-card slide-up${isPast ? " past" : ""}`}
              data-category={cat}
              onClick={() => !isPast && navigate(`/activity/${activity.activity_id}`)}
              role="article"
              aria-label={activity.activity_name}
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
                  aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                  aria-pressed={isFav}
                >
                  {isFav ? "♥" : "♡"}
                </button>
              </div>
              <div className="activity-title">{activity.activity_name}</div>
              {speakerProfile && (
                <button
                  className="activity-speaker clickable"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSpeaker(speakerProfile);
                  }}
                  type="button"
                >
                  {speakerProfile.user_profile_name}
                </button>
              )}
              <div className="activity-badges">
                <span className={getBadgeClass(cat)}>{getCategoryLabel(cat)}</span>
                {isPast && <span className="badge badge-past">Terminée</span>}
                {!isPast && pct >= 100 && <span className="badge badge-full">Complet</span>}
              </div>
              {room && (
                <>
                  <div className="activity-room">📍 {room.room_name}</div>
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
                </>
              )}
            </div>
          );
        })}
      </div>

      <SpeakerModal
        speaker={selectedSpeaker}
        activitiesCount={
          selectedSpeaker
            ? speakerActivitiesCount.get(selectedSpeaker.user_profile_id) ?? 0
            : 0
        }
        onClose={() => setSelectedSpeaker(null)}
      />
    </div>
  );
}
