import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../../api/client";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../../components/ConfirmModal";
import type { Event, UserProfile } from "../../types";

interface EventForm {
  event_name: string;
  event_description: string;
  event_start: string;
  event_end: string;
  user_profile_id: string;
}

const EMPTY_FORM: EventForm = {
  event_name: "",
  event_description: "",
  event_start: "",
  event_end: "",
  user_profile_id: "",
};

function toDatetimeLocal(iso: string) {
  return iso ? iso.slice(0, 16) : "";
}

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const reload = () =>
    Promise.all([client.get("/events"), client.get("/user_profiles")])
      .then(([e, p]) => {
        setEvents(e.data);
        setProfiles(p.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      });

  useEffect(() => { reload(); }, []);

  const profileMap = new Map(profiles.map((p) => [p.user_profile_id, p]));

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (ev: Event) => {
    setEditId(ev.event_id);
    setForm({
      event_name: ev.event_name,
      event_description: ev.event_description,
      event_start: toDatetimeLocal(ev.event_start),
      event_end: toDatetimeLocal(ev.event_end),
      user_profile_id: String(ev.user_profile_id),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        event_name: form.event_name,
        event_description: form.event_description,
        event_start: new Date(form.event_start).toISOString(),
        event_end: new Date(form.event_end).toISOString(),
        user_profile_id: Number(form.user_profile_id),
      };
      if (editId) {
        await client.put(`/events/${editId}`, payload);
        toast("Événement mis à jour", "success");
      } else {
        await client.post("/events", payload);
        toast("Événement créé", "success");
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
      await client.delete(`/events/${deleteId}`);
      toast("Événement supprimé", "info");
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
        <h1 className="page-title">🗓️ Événements</h1>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Nouveau
        </button>
      </div>
      {error && <div className="error-msg" role="alert">{error}</div>}

      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 className="admin-modal-title">{editId ? "Modifier" : "Créer"} un événement</h2>
            <div className="form">
              <label htmlFor="ev-name">Nom</label>
              <input
                id="ev-name"
                value={form.event_name}
                onChange={(e) => setForm({ ...form, event_name: e.target.value })}
                placeholder="Nom de l'événement"
              />
              <label htmlFor="ev-desc">Description</label>
              <textarea
                id="ev-desc"
                className="admin-textarea"
                value={form.event_description}
                onChange={(e) => setForm({ ...form, event_description: e.target.value })}
                placeholder="Description"
                rows={3}
              />
              <label htmlFor="ev-start">Début</label>
              <input
                id="ev-start"
                type="datetime-local"
                value={form.event_start}
                onChange={(e) => setForm({ ...form, event_start: e.target.value })}
              />
              <label htmlFor="ev-end">Fin</label>
              <input
                id="ev-end"
                type="datetime-local"
                value={form.event_end}
                onChange={(e) => setForm({ ...form, event_end: e.target.value })}
              />
              <label htmlFor="ev-organizer">Organisateur</label>
              <select
                id="ev-organizer"
                value={form.user_profile_id}
                onChange={(e) => setForm({ ...form, user_profile_id: e.target.value })}
              >
                <option value="">-- Sélectionner --</option>
                {profiles.map((p) => (
                  <option key={p.user_profile_id} value={p.user_profile_id}>
                    {p.user_profile_name} ({p.user_profile_role})
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
        {events.length === 0 && <p className="empty-state">Aucun événement</p>}
        {events.map((ev) => (
          <div key={ev.event_id} className="admin-list-item">
            <div className="admin-list-item-info">
              <strong>{ev.event_name}</strong>
              <span className="admin-list-item-meta">
                {new Date(ev.event_start).toLocaleDateString("fr-FR")} →{" "}
                {new Date(ev.event_end).toLocaleDateString("fr-FR")}
              </span>
              <span className="admin-list-item-meta">
                Organisateur : {profileMap.get(ev.user_profile_id)?.user_profile_name ?? "—"}
              </span>
            </div>
            <div className="admin-list-item-actions">
              <button type="button" className="btn-icon" onClick={() => openEdit(ev)} aria-label="Modifier">
                ✏️
              </button>
              <button
                type="button"
                className="btn-icon btn-icon-danger"
                onClick={() => setDeleteId(ev.event_id)}
                aria-label="Supprimer"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={deleteId !== null}
        title="Supprimer l'événement"
        message="Supprimer cet événement ? Toutes les activités associées seront aussi supprimées."
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
