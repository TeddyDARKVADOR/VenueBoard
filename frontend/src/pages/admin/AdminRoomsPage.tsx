import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../../api/client";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../../components/ConfirmModal";
import type { Room } from "../../types";

interface RoomForm {
  room_name: string;
  room_location: string;
  room_capacity: string;
}

const EMPTY_FORM: RoomForm = {
  room_name: "",
  room_location: "",
  room_capacity: "",
};

export default function AdminRoomsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<RoomForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const reload = () =>
    client
      .get("/rooms")
      .then((r) => {
        setRooms(r.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      });

  useEffect(() => { reload(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (room: Room) => {
    setEditId(room.room_id);
    setForm({
      room_name: room.room_name,
      room_location: room.room_location ?? "",
      room_capacity: String(room.room_capacity),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        room_name: form.room_name,
        room_location: form.room_location,
        room_capacity: Number(form.room_capacity),
      };
      if (editId) {
        await client.put(`/rooms/${editId}`, payload);
        toast("Salle mise à jour", "success");
      } else {
        await client.post("/rooms", payload);
        toast("Salle créée", "success");
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
      await client.delete(`/rooms/${deleteId}`);
      toast("Salle supprimée", "info");
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
        <h1 className="page-title">🏛️ Salles</h1>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Nouveau
        </button>
      </div>
      {error && <div className="error-msg" role="alert">{error}</div>}

      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 className="admin-modal-title">{editId ? "Modifier" : "Créer"} une salle</h2>
            <div className="form">
              <label htmlFor="room-name">Nom</label>
              <input
                id="room-name"
                value={form.room_name}
                onChange={(e) => setForm({ ...form, room_name: e.target.value })}
                placeholder="Nom de la salle"
              />
              <label htmlFor="room-location">Emplacement</label>
              <input
                id="room-location"
                value={form.room_location}
                onChange={(e) => setForm({ ...form, room_location: e.target.value })}
                placeholder="ex: Bâtiment A, Niveau 2"
              />
              <label htmlFor="room-capacity">Capacité</label>
              <input
                id="room-capacity"
                type="number"
                min={1}
                value={form.room_capacity}
                onChange={(e) => setForm({ ...form, room_capacity: e.target.value })}
                placeholder="ex: 100"
              />
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
        {rooms.length === 0 && <p className="empty-state">Aucune salle</p>}
        {rooms.map((room) => (
          <div key={room.room_id} className="admin-list-item">
            <div className="admin-list-item-info">
              <strong>{room.room_name}</strong>
              <span className="admin-list-item-meta">
                {room.room_location} · Capacité : {room.room_capacity} places
              </span>
            </div>
            <div className="admin-list-item-actions">
              <button type="button" className="btn-icon" onClick={() => openEdit(room)} aria-label="Modifier">
                ✏️
              </button>
              <button
                type="button"
                className="btn-icon btn-icon-danger"
                onClick={() => setDeleteId(room.room_id)}
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
        title="Supprimer la salle"
        message="Supprimer cette salle ?"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
