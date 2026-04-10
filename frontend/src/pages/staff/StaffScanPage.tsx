import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../../api/client";
import { useToast } from "../../contexts/ToastContext";
import type { Activity, Participant } from "../../types";

export default function StaffScanPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client
      .get("/activities")
      .then((r) => {
        setActivities(
          (r.data as Activity[]).sort(
            (a, b) =>
              new Date(a.activity_start).getTime() -
              new Date(b.activity_start).getTime(),
          ),
        );
        setLoading(false);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      });
  }, []);

  const loadParticipants = async (activityId: number) => {
    setSelectedId(activityId);
    setSearch("");
    try {
      const resp = await client.get(`/participants/${activityId}`);
      setParticipants(resp.data);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  const handleCheckIn = async (participant: Participant) => {
    if (participant.is_checked_in) return;
    setScanLoading(participant.user_profile_id);
    try {
      await client.post(
        `/checkin/${participant.activity_id}/${participant.user_profile_id}`,
      );
      setParticipants((prev) =>
        prev.map((p) =>
          p.user_profile_id === participant.user_profile_id
            ? { ...p, is_checked_in: true }
            : p,
        ),
      );
      toast(`${participant.user_profile_name} — entrée validée ✓`, "success");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setScanLoading(null);
    }
  };

  const selectedActivity = activities.find((a) => a.activity_id === selectedId);

  const filteredParticipants = participants.filter((p) =>
    p.user_profile_name.toLowerCase().includes(search.toLowerCase()),
  );

  const checkedCount = participants.filter((p) => p.is_checked_in).length;

  if (loading) return <div className="loading-screen"><div className="spinner" />Chargement...</div>;

  return (
    <div className="page fade-in">
      <button className="detail-back" type="button" onClick={() => navigate("/staff")}>
        ← Staff
      </button>
      <h1 className="page-title">🎫 Scanner les entrées</h1>
      {error && <div className="error-msg" role="alert">{error}</div>}

      <div className="scan-activity-select">
        <label className="scan-label" htmlFor="activity-select">
          Sélectionner une activité
        </label>
        <select
          id="activity-select"
          className="scan-select"
          value={selectedId ?? ""}
          onChange={(e) => {
            const id = Number(e.target.value);
            if (id) loadParticipants(id);
          }}
        >
          <option value="">-- Choisir une activité --</option>
          {activities.map((a) => (
            <option key={a.activity_id} value={a.activity_id}>
              {new Date(a.activity_start).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              — {a.activity_name}
            </option>
          ))}
        </select>
      </div>

      {selectedActivity && (
        <>
          <div className="scan-activity-header">
            <h2 className="scan-activity-name">{selectedActivity.activity_name}</h2>
            <span className="scan-counter">
              {checkedCount} / {participants.length} entrées validées
            </span>
          </div>

          <input
            className="admin-search"
            placeholder="Rechercher un participant…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="scan-list">
            {filteredParticipants.length === 0 && (
              <p className="empty-state">Aucun participant trouvé</p>
            )}
            {filteredParticipants.map((p) => (
              <div
                key={p.user_profile_id}
                className={`scan-item${p.is_checked_in ? " scan-item-done" : ""}`}
              >
                <div className="scan-item-info">
                  <span className="scan-item-name">{p.user_profile_name}</span>
                  {p.is_checked_in && (
                    <span className="scan-item-badge">✓ Présent</span>
                  )}
                </div>
                <button
                  type="button"
                  className={`btn ${p.is_checked_in ? "btn-outline" : "btn-primary"}`}
                  disabled={p.is_checked_in || scanLoading === p.user_profile_id}
                  onClick={() => handleCheckIn(p)}
                >
                  {(() => {
                    if (scanLoading === p.user_profile_id) return "…";
                    if (p.is_checked_in) return "Validé";
                    return "Valider";
                  })()}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
