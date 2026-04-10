import type { UserProfile } from "../types";

interface SpeakerModalProps {
  speaker: UserProfile | null;
  activitiesCount: number;
  onClose: () => void;
}

function roleLabel(role: string): string {
  switch (role) {
    case "admin": return "Administrateur";
    case "staff": return "Staff";
    case "speaker": return "Intervenant";
    default: return "Participant";
  }
}

export default function SpeakerModal({ speaker, activitiesCount, onClose }: SpeakerModalProps) {
  if (!speaker) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Profil de ${speaker.user_profile_name}`}>
      <div className="modal-card speaker-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        <div className="speaker-modal-header">
          <div className="speaker-modal-avatar">
            {speaker.user_profile_name.charAt(0).toUpperCase()}
          </div>
          <h3 className="speaker-modal-name">{speaker.user_profile_name}</h3>
          <span className="profile-role-badge">{roleLabel(speaker.user_profile_role)}</span>
        </div>
        <div className="speaker-modal-stats">
          <div className="speaker-modal-stat">
            <div className="speaker-modal-stat-value">{activitiesCount}</div>
            <div className="speaker-modal-stat-label">Activités animées</div>
          </div>
        </div>
      </div>
    </div>
  );
}
