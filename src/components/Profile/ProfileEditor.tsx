// Editor de perfil — crear o editar nombre y avatar
import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { AVATARS, DEFAULT_AVATAR, AVATAR_MAP } from '../../data/avatars';
import type { UserProfile, AvatarId } from '../../stores/types';
import './ProfileEditor.css';

interface ProfileEditorProps {
  /** Si se pasa, modo edición; si no, modo creación */
  editProfile?: UserProfile;
  defaultName?: string;
  onClose: () => void;
  onSave: () => void;
}

export function ProfileEditor({ editProfile, defaultName, onClose, onSave }: ProfileEditorProps) {
  const createProfile = useAppStore((s) => s.createProfile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [name, setName] = useState(editProfile?.name ?? defaultName ?? 'Explorador');
  const [avatar, setAvatar] = useState<AvatarId>(editProfile?.avatar ?? DEFAULT_AVATAR);

  const isEdit = !!editProfile;
  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const trimmed = name.trim();

    if (isEdit) {
      updateProfile(editProfile.id, { name: trimmed, avatar });
    } else {
      createProfile(trimmed, avatar);
    }
    onSave();
  };

  // Cerrar al pulsar el overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const selectedDef = AVATAR_MAP.get(avatar) ?? AVATAR_MAP.get(DEFAULT_AVATAR)!;

  return (
    <div className="profile-editor-overlay" onClick={handleOverlayClick} role="dialog" aria-label={isEdit ? 'Editar perfil' : 'Crear perfil'}>
      <div className="profile-editor">
        <div className="profile-editor__header">
          <h2 className="profile-editor__title">{isEdit ? 'Editar perfil' : 'Crear perfil'}</h2>
          <button className="profile-editor__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* Avatar preview */}
        <div className="profile-editor__preview">
          <img
            src={selectedDef.path}
            alt={selectedDef.label}
            className="profile-editor__preview-avatar"
            draggable={false}
          />
        </div>

        {/* Grid de avatares */}
        <p className="profile-editor__avatar-label">Elige tu avatar</p>
        <div className="profile-editor__avatar-grid">
          {AVATARS.map((a) => (
            <button
              key={a.id}
              className={`profile-editor__avatar-option${a.id === avatar ? ' profile-editor__avatar-option--selected' : ''}`}
              onClick={() => setAvatar(a.id)}
              aria-label={a.label}
            >
              <img src={a.path} alt={a.label} draggable={false} />
            </button>
          ))}
        </div>

        {/* Input nombre */}
        <label className="profile-editor__name-label">Nombre</label>
        <input
          className="profile-editor__name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del perfil"
          maxLength={30}
          autoFocus={!isEdit}
        />

        {/* Acciones */}
        <div className="profile-editor__actions">
          <button
            className="profile-editor__save-btn"
            onClick={handleSave}
            disabled={!canSave}
          >
            {isEdit ? 'Guardar' : 'Crear'}
          </button>
          <button className="profile-editor__cancel-btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
