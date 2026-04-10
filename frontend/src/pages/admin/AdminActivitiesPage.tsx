import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../../api/client";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../../components/ConfirmModal";
import type { Activity, Event, Room } from "../../types";

interface ActivityForm {
  activity_name: string;
  activity_description: string;
  activity_start: string;
  activity_end: string;
  event_id: string;
  room_id: string;
}

const EMPTY_FORM: ActivityForm = {
  activity_name: "",
  activity_description: "",
  activity_start: "",
  activity_end: "",
  event_id: "",
  room_id: "",
};

function toDatetimeLocal(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}

export default function AdminActivitiesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ActivityForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const reload = () =>
    Promise.all([
      client.get("/activities"),
      client.get("/events"),
      client.get("/rooms"),
    ])
      .then(([a, e, r]) => {
        setActivities(a.data);
        setEvents(e.data);
        setRooms(r.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      });

  useEffect(() => { reload(); }, []);

  const eventMap = new Map(events.map((e) => [e.event_id, e]));
  const roomMap = new Map(rooms.map((r) => [r.room_id, r]));

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (act: Activity) => {
    setEditId(act.activity_id);
    setForm({
      activity_name: act.activity_name,
      activity_description: act.activity_description,
      activity_start: toDatetimeLocal(act.activity_start),
      activity_end: toDatetimeLocal(act.activity_end),
      event_id: String(act.event_id),
      room_id: String(act.room_id),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        activity_name: form.activity_name,
        activity_description: form.activity_description,
        activity_start: new Date(form.activity_start).toISOString(),
        activity_end: new Date(form.activity_end).toISOString(),
        activity_real_start: null,
        activity_real_end: null,
        event_id: Number(form.event_id),
        room_id: Number(form.room_id),
      };
      if (editId) {
        await client.put(`/activities/${editId}`, payload);
        toast("Activité mise à jour", "success");
      } else {
        await client.post("/activities", payload);
        toast("Activité créée", "success");
      }
      setShowForm(false);
      await reload();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await client.delete(`/activities/${deleteId}`);
      toast("Activité supprimée", "info");
      setDeleteId(null);
      await reload();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" />Chargement...</div>;

  return (
    <div className="page fade-in">
      <button className="detail-back" type="button" onClick={() => navigate("/admin")}>
        ← Admin
      </button>
      <div className="admin-page-header">
        <h1 className="page-title"> Activités</h1>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Nouveau
        </button>
      </div>
      {error && <div className="error-msg" role="alert">{error}</div>}

      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 className="admin-modal-title">{editId ? "Modifier" : "Créer"} une activité</h2>
            <div className="form">
              <label htmlFor="act-name">Nom</label>
              <input
                id="act-name"
                value={form.activity_name}
                onChange={(e) => setForm({ ...form, activity_name: e.target.value })}
                placeholder="Nom de l'activité"
              />
              <label htmlFor="act-desc">Description</label>
              <textarea
                id="act-desc"
                className="admin-textarea"
                value={form.activity_description}
                onChange={(e) => setForm({ ...form, activity_description: e.target.value })}
                placeholder="Description"
                rows={3}
              />
              <label htmlFor="act-start">Début</label>
              <input
                id="act-start"
                type="datetime-local"
                value={form.activity_start}
                onChange={(e) => setForm({ ...form, activity_start: e.target.value })}
              />
              <label htmlFor="act-end">Fin</label>
              <input
                id="act-end"
                type="datetime-local"
                value={form.activity_end}
                onChange={(e) => setForm({ ...form, activity_end: e.target.value })}
              />
              <label htmlFor="act-event">Événement</label>
              <select
                id="act-event"
                value={form.event_id}
                onChange={(e) => setForm({ ...form, event_id: e.target.value })}
              >
                <option value="">-- Sélectionner --</option>
                {events.map((ev) => (
                  <option key={ev.event_id} value={ev.event_id}>
                    {ev.event_name}
                  </option>
                ))}
              </select>
              <label htmlFor="act-room">Salle</label>
              <select
                id="act-room"
                value={form.room_id}
                onChange={(e) => setForm({ ...form, room_id: e.target.value })}
              >
                <option value="">-- Sélectionner --</option>
                {rooms.map((r) => (
                  <option key={r.room_id} value={r.room_id}>
                    {r.room_name} (cap. {r.room_capacity})
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Sauvegarde…" : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-list">
        {activities.length === 0 && <p className="empty-state">Aucune activité</p>}
        {activities
          .slice()
          .sort((a, b) => new Date(a.activity_start).getTime() - new Date(b.activity_start).getTime())
          .map((act) => (
            <div key={act.activity_id} className="admin-list-item">
              <div className="admin-list-item-info">
                <strong>{act.activity_name}</strong>
                <span className="admin-list-item-meta">
                  {new Date(act.activity_start).toLocaleString("fr-FR", {
                    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                  })}
                  {" → "}
                  {new Date(act.activity_end).toLocaleTimeString("fr-FR", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
                <span className="admin-list-item-meta">
                  {eventMap.get(act.event_id)?.event_name ?? "—"} · {roomMap.get(act.room_id)?.room_name ?? "—"}
                </span>
              </div>
              <div className="admin-list-item-actions">
                <button type="button" className="btn-icon" onClick={() => openEdit(act)} aria-label="Modifier">
                  
                </button>
                <button
                  type="button"
                  className="btn-icon btn-icon-danger"
                  onClick={() => setDeleteId(act.activity_id)}
                  aria-label="Supprimer"
                >
                  
                </button>
              </div>
            </div>
          ))}
      </div>

      <ConfirmModal
        open={deleteId !== null}
        title="Supprimer l'activité"
        message="Supprimer cette activité ?"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
