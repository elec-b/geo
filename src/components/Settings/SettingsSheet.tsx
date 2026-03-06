// SettingsSheet — bottom sheet de configuración
import { useAppStore } from '../../stores/appStore';
import { hapticSelection } from '../../utils/haptics';
import './SettingsSheet.css';

interface SettingsSheetProps {
  isExploreTab: boolean;
  onClose: () => void;
}

export function SettingsSheet({ isExploreTab, onClose }: SettingsSheetProps) {
  const vibration = useAppStore((s) => s.settings.vibration);
  const showMarkers = useAppStore((s) => s.settings.showMarkers);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const toggleVibration = () => {
    updateSettings({ vibration: !vibration });
    hapticSelection();
  };

  const toggleMarkers = () => {
    updateSettings({ showMarkers: !showMarkers });
    hapticSelection();
  };

  return (
    <div className="settings-sheet-overlay" onClick={onClose}>
      <div className="settings-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-sheet__header">
          <h2 className="settings-sheet__title">Configuraci&oacute;n</h2>
          <button
            className="settings-sheet__close"
            onClick={onClose}
            aria-label="Cerrar configuración"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Filas de ajustes */}
        <div className="settings-sheet__rows">
          {/* Vibración */}
          <div className="settings-sheet__row" onClick={toggleVibration}>
            <svg className="settings-sheet__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="2" width="8" height="20" rx="2" />
              <path d="M4 8l-2 2 2 2" />
              <path d="M20 8l2 2-2 2" />
            </svg>
            <span className="settings-sheet__label">Vibraci&oacute;n</span>
            <button
              className={`settings-sheet__toggle${vibration ? ' settings-sheet__toggle--active' : ''}`}
              role="switch"
              aria-checked={vibration}
              aria-label="Vibración"
            >
              <span className="settings-sheet__toggle-thumb" />
            </button>
          </div>

          {/* Idioma (deshabilitado) */}
          <div className="settings-sheet__row settings-sheet__row--disabled">
            <svg className="settings-sheet__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="settings-sheet__label">Idioma</span>
            <span className="settings-sheet__value">Espa&ntilde;ol</span>
            <span className="settings-sheet__badge">Pr&oacute;ximamente</span>
          </div>

          {/* Tema (deshabilitado) */}
          <div className="settings-sheet__row settings-sheet__row--disabled">
            <svg className="settings-sheet__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <span className="settings-sheet__label">Tema</span>
            <span className="settings-sheet__value">Oscuro</span>
            <span className="settings-sheet__badge">Pr&oacute;ximamente</span>
          </div>

          {/* Marcadores de microestados (solo en Explorar) */}
          {isExploreTab && (
            <div className="settings-sheet__row" onClick={toggleMarkers}>
              <svg className="settings-sheet__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="settings-sheet__label">Marcadores de microestados</span>
              <button
                className={`settings-sheet__toggle${showMarkers ? ' settings-sheet__toggle--active' : ''}`}
                role="switch"
                aria-checked={showMarkers}
                aria-label="Marcadores de microestados"
              >
                <span className="settings-sheet__toggle-thumb" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
