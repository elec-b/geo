// SettingsSheet — bottom sheet de configuración
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { hapticSelection } from '../../utils/haptics';
import { useBottomSheetDrag } from '../../hooks/useBottomSheetDrag';
import './SettingsSheet.css';

interface SettingsSheetProps {
  onClose: () => void;
}

export function SettingsSheet({ onClose }: SettingsSheetProps) {
  const { t } = useTranslation('settings');
  const sheetRef = useRef<HTMLDivElement>(null);
  const { dragHandlers, isClosing, closeAnimated } = useBottomSheetDrag({ sheetRef, onClose });

  const vibration = useAppStore((s) => s.settings.vibration);
  const showMarkers = useAppStore((s) => s.settings.showMarkers);
  const showSeaLabels = useAppStore((s) => s.settings.showSeaLabels);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const toggleVibration = () => {
    updateSettings({ vibration: !vibration });
    hapticSelection();
  };

  const toggleMarkers = () => {
    updateSettings({ showMarkers: !showMarkers });
    hapticSelection();
  };

  const toggleSeaLabels = () => {
    updateSettings({ showSeaLabels: !showSeaLabels });
    hapticSelection();
  };

  return (
    <div
      className={`settings-sheet-overlay${isClosing ? ' settings-sheet-overlay--closing' : ''}`}
      onClick={closeAnimated}
    >
      <div
        ref={sheetRef}
        className="settings-sheet"
        onClick={(e) => e.stopPropagation()}
        {...dragHandlers}
      >
        <div className="bottom-sheet-handle" />
        {/* Header */}
        <div className="settings-sheet__header">
          <h2 className="settings-sheet__title">{t('title')}</h2>
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
            <span className="settings-sheet__label">{t('vibration')}</span>
            <button
              className={`settings-sheet__toggle${vibration ? ' settings-sheet__toggle--active' : ''}`}
              role="switch"
              aria-checked={vibration}
              aria-label={t('vibration')}
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
            <span className="settings-sheet__label">{t('language')}</span>
            <span className="settings-sheet__value">{t('languageValue')}</span>
            <span className="settings-sheet__badge">{t('comingSoon')}</span>
          </div>

          {/* Tema (deshabilitado) */}
          <div className="settings-sheet__row settings-sheet__row--disabled">
            <svg className="settings-sheet__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <span className="settings-sheet__label">{t('theme')}</span>
            <span className="settings-sheet__value">{t('themeValue')}</span>
            <span className="settings-sheet__badge">{t('comingSoon')}</span>
          </div>

          {/* Marcadores de islas y países pequeños */}
          <div className="settings-sheet__row" onClick={toggleMarkers}>
            <svg className="settings-sheet__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="settings-sheet__label">{t('markers')}</span>
            <button
              className={`settings-sheet__toggle${showMarkers ? ' settings-sheet__toggle--active' : ''}`}
              role="switch"
              aria-checked={showMarkers}
              aria-label={t('markers')}
            >
              <span className="settings-sheet__toggle-thumb" />
            </button>
          </div>

          {/* Mares y océanos */}
          <div className="settings-sheet__row" onClick={toggleSeaLabels}>
            <svg className="settings-sheet__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12c2-2 4-3 6-3s4 2 6 3 4 1 6-1" />
              <path d="M2 17c2-2 4-3 6-3s4 2 6 3 4 1 6-1" />
              <path d="M2 7c2-2 4-3 6-3s4 2 6 3 4 1 6-1" />
            </svg>
            <span className="settings-sheet__label">{t('seaLabels')}</span>
            <button
              className={`settings-sheet__toggle${showSeaLabels ? ' settings-sheet__toggle--active' : ''}`}
              role="switch"
              aria-checked={showSeaLabels}
              aria-label={t('seaLabels')}
            >
              <span className="settings-sheet__toggle-thumb" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
