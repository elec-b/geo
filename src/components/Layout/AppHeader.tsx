// AppHeader - Barra superior con avatar, estadísticas y configuración
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { AvatarIcon } from '../Profile/AvatarIcon';
import { DEFAULT_AVATAR } from '../../data/avatars';
import './AppHeader.css';

interface AppHeaderProps {
  onStatsClick?: () => void;
  onAvatarClick?: () => void;
  onSettingsClick?: () => void;
  onAboutClick?: () => void;
}

export function AppHeader({ onStatsClick, onAvatarClick, onSettingsClick, onAboutClick }: AppHeaderProps) {
  const { t } = useTranslation('common');
  const activeAvatar = useAppStore((s) => {
    const profile = s.profiles.find((p) => p.id === s.activeProfileId);
    return profile?.avatar ?? DEFAULT_AVATAR;
  });

  return (
    <header className="app-header">
      {/* Grupo izquierdo: avatar + info */}
      <div className="app-header__left">
        <button
          className="app-header__button app-header__button--avatar"
          onClick={onAvatarClick}
          aria-label={t('aria.userProfile')}
        >
          <AvatarIcon avatarId={activeAvatar} size="sm" />
        </button>
        <button
          className="app-header__button"
          onClick={onAboutClick}
          aria-label={t('aria.about')}
        >
          <svg className="app-header__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </button>
      </div>

      {/* Botones derechos: estadísticas + configuración */}
      <div className="app-header__right">
        {onStatsClick && (
          <button
            className="app-header__button"
            onClick={onStatsClick}
            aria-label={t('aria.stats')}
          >
            <svg className="app-header__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="12" width="4" height="9" rx="1" />
              <rect x="10" y="7" width="4" height="14" rx="1" />
              <rect x="17" y="3" width="4" height="18" rx="1" />
            </svg>
          </button>
        )}
        <button
          className="app-header__button"
          onClick={onSettingsClick}
          aria-label={t('aria.settings')}
        >
          <svg className="app-header__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
