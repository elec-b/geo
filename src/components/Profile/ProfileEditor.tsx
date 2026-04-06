// Editor de perfil — crear o editar nombre y avatar
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { ANIMAL_AVATARS, COLOR_AVATARS, DEFAULT_AVATAR, AVATAR_MAP, isColorAvatar } from '../../data/avatars';
import type { UserProfile, AvatarId } from '../../stores/types';
import './ProfileEditor.css';

interface ProfileEditorProps {
  /** Si se pasa, modo edición; si no, modo creación */
  editProfile?: UserProfile;
  defaultName?: string;
  onClose: () => void;
  onSave: (created: boolean) => void;
}

export function ProfileEditor({ editProfile, defaultName, onClose, onSave }: ProfileEditorProps) {
  const { t } = useTranslation('profile');
  const createProfile = useAppStore((s) => s.createProfile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const isEdit = !!editProfile;
  const [name, setName] = useState(isEdit ? (editProfile?.name ?? '') : '');
  const [avatar, setAvatar] = useState<AvatarId>(editProfile?.avatar ?? DEFAULT_AVATAR);

  // En creación, vacío = nombre por defecto; en edición, se requiere nombre
  const canSave = isEdit ? name.trim().length > 0 : true;

  const handleSave = () => {
    if (!canSave) return;
    const trimmed = name.trim();

    if (isEdit) {
      updateProfile(editProfile.id, { name: trimmed, avatar });
    } else {
      const finalName = trimmed || defaultName || t('defaultName');
      createProfile(finalName, avatar);
    }
    onSave(!isEdit);
  };

  // Cerrar al pulsar el overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const selectedDef = AVATAR_MAP.get(avatar) ?? AVATAR_MAP.get(DEFAULT_AVATAR)!;

  return (
    <div className="profile-editor-overlay" onClick={handleOverlayClick} role="dialog" aria-label={isEdit ? t('editor.titleEdit') : t('editor.titleCreate')}>
      <div className="profile-editor">
        <div className="profile-editor__header">
          <h2 className="profile-editor__title">{isEdit ? t('editor.titleEdit') : t('editor.titleCreate')}</h2>
          <button className="profile-editor__close" onClick={onClose} aria-label={t('common:close')}>
            ✕
          </button>
        </div>

        {/* Avatar preview */}
        <div className="profile-editor__preview">
          {isColorAvatar(selectedDef) ? (
            <div
              className="profile-editor__preview-avatar profile-editor__preview-avatar--color"
              style={{ backgroundColor: selectedDef.color }}
              role="img"
              aria-label={t(selectedDef.label)}
            />
          ) : (
            <img
              src={selectedDef.path}
              alt={t(selectedDef.label)}
              className="profile-editor__preview-avatar"
              draggable={false}
            />
          )}
        </div>

        {/* Grid de avatares animales */}
        <p className="profile-editor__avatar-label">{t('editor.chooseAvatar')}</p>
        <div className="profile-editor__avatar-grid">
          {ANIMAL_AVATARS.map((a) => (
            <button
              key={a.id}
              className={`profile-editor__avatar-option${a.id === avatar ? ' profile-editor__avatar-option--selected' : ''}`}
              onClick={() => setAvatar(a.id)}
              aria-label={t(a.label)}
            >
              <img src={a.path} alt={t(a.label)} draggable={false} />
            </button>
          ))}
        </div>

        {/* Grid de avatares de color */}
        <p className="profile-editor__avatar-label">{t('editor.chooseColor')}</p>
        <div className="profile-editor__color-grid">
          {COLOR_AVATARS.map((c) => (
            <button
              key={c.id}
              className={`profile-editor__color-option${c.id === avatar ? ' profile-editor__color-option--selected' : ''}`}
              onClick={() => setAvatar(c.id)}
              aria-label={t(c.label)}
            >
              <div className="profile-editor__color-swatch" style={{ backgroundColor: c.color }} />
            </button>
          ))}
        </div>

        {/* Input nombre */}
        <label className="profile-editor__name-label">{t('editor.nameLabel')}</label>
        <input
          className="profile-editor__name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isEdit ? t('editor.namePlaceholder') : (defaultName || t('defaultName'))}
          maxLength={30}
          autoFocus={false}
        />

        {/* Acciones */}
        <div className="profile-editor__actions">
          <button
            className="profile-editor__save-btn"
            onClick={handleSave}
            disabled={!canSave}
          >
            {isEdit ? t('editor.save') : t('editor.create')}
          </button>
          <button className="profile-editor__cancel-btn" onClick={onClose}>
            {t('common:cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
