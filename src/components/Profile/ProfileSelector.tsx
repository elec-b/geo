// Selector de perfil — modal con lista de perfiles y acciones
import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { AvatarIcon } from './AvatarIcon';
import { DEFAULT_AVATAR } from '../../data/avatars';
import type { UserProfile } from '../../stores/types';
import './ProfileSelector.css';

interface ProfileSelectorProps {
  onClose: () => void;
  onProfileChange: (id: string) => void;
  onCreateNew: () => void;
  onEdit: (profile: UserProfile) => void;
}

/** Calcula el siguiente nombre por defecto: "Explorador", "Explorador 2", etc. */
function getNextDefaultName(profiles: UserProfile[]): string {
  const nums = profiles
    .map((p) => p.name)
    .filter((n) => /^Explorador\s*\d*$/.test(n))
    .map((n) => {
      const m = n.match(/^Explorador\s*(\d*)$/);
      return m ? (m[1] ? parseInt(m[1]) : 1) : 0;
    })
    .filter((n) => n > 0);

  if (nums.length === 0) return 'Explorador';
  return `Explorador ${Math.max(...nums) + 1}`;
}

export { getNextDefaultName };

export function ProfileSelector({ onClose, onProfileChange, onCreateNew, onEdit }: ProfileSelectorProps) {
  const profiles = useAppStore((s) => s.profiles);
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const deleteProfile = useAppStore((s) => s.deleteProfile);
  const createProfile = useAppStore((s) => s.createProfile);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    onProfileChange(id);
  };

  const handleDelete = (id: string) => {
    const wasActive = id === activeProfileId;
    deleteProfile(id);

    // Leer el estado actualizado
    const remaining = useAppStore.getState().profiles;

    if (remaining.length === 0) {
      // Si no quedan perfiles, crear uno por defecto
      createProfile('Explorador', DEFAULT_AVATAR);
      const newId = useAppStore.getState().activeProfileId!;
      onProfileChange(newId);
    } else if (wasActive) {
      // Si se eliminó el activo, activar el primero (con limpieza de sesión)
      onProfileChange(remaining[0].id);
    }

    setConfirmDeleteId(null);
  };

  // Cerrar al pulsar el overlay (no la card)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="profile-selector-overlay" onClick={handleOverlayClick} role="dialog" aria-label="Seleccionar perfil">
      <div className="profile-selector">
        <div className="profile-selector__header">
          <h2 className="profile-selector__title">Perfiles</h2>
          <button className="profile-selector__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="profile-selector__list">
          {profiles.map((profile) => (
            <div key={profile.id}>
              {confirmDeleteId === profile.id ? (
                <div className="profile-selector__confirm">
                  <p className="profile-selector__confirm-text">
                    ¿Eliminar «{profile.name}»?
                  </p>
                  <div className="profile-selector__confirm-actions">
                    <button
                      className="profile-selector__confirm-btn"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="profile-selector__confirm-btn profile-selector__confirm-btn--delete"
                      onClick={() => handleDelete(profile.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`profile-selector__item${profile.id === activeProfileId ? ' profile-selector__item--active' : ''}`}
                  onClick={() => handleSelect(profile.id)}
                >
                  <AvatarIcon avatarId={profile.avatar} size="md" />
                  <div className="profile-selector__item-info">
                    <div className="profile-selector__item-name">{profile.name}</div>
                  </div>
                  {profile.id === activeProfileId && (
                    <span className="profile-selector__item-check">✓</span>
                  )}
                  <div className="profile-selector__item-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="profile-selector__action-btn"
                      onClick={() => onEdit(profile)}
                      aria-label={`Editar ${profile.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                    <button
                      className="profile-selector__action-btn profile-selector__action-btn--delete"
                      onClick={() => setConfirmDeleteId(profile.id)}
                      aria-label={`Eliminar ${profile.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="profile-selector__create-btn" onClick={onCreateNew}>
          Crear perfil
        </button>
      </div>
    </div>
  );
}
