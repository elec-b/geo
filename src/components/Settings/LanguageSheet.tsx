// LanguageSheet — bottom sheet dedicado para selección de idioma
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { hapticSelection } from '../../utils/haptics';
import { useBottomSheetDrag } from '../../hooks/useBottomSheetDrag';
import { SUPPORTED_LOCALES, changeAppLanguage } from '../../i18n';
import { invalidateCache } from '../../data/countryData';
import './LanguageSheet.css';

interface LanguageSheetProps {
  onClose: () => void;
}

export function LanguageSheet({ onClose }: LanguageSheetProps) {
  const { t } = useTranslation('settings');
  const sheetRef = useRef<HTMLDivElement>(null);
  const { dragHandlers, isClosing, closeAnimated } = useBottomSheetDrag({ sheetRef, onClose });

  const locale = useAppStore((s) => s.settings.locale);
  const updateSettings = useAppStore((s) => s.updateSettings);

  // Ordenar idiomas alfabéticamente por nombre nativo, lectura por columna
  const sorted = Object.entries(SUPPORTED_LOCALES).sort((a, b) => a[1].localeCompare(b[1]));
  const half = Math.ceil(sorted.length / 2);
  const cols: typeof sorted = [];
  for (let i = 0; i < half; i++) {
    cols.push(sorted[i]);
    if (i + half < sorted.length) cols.push(sorted[i + half]);
  }

  return (
    <div
      className={`language-sheet-overlay${isClosing ? ' language-sheet-overlay--closing' : ''}`}
      onClick={closeAnimated}
    >
      <div
        ref={sheetRef}
        className="language-sheet"
        onClick={(e) => e.stopPropagation()}
        {...dragHandlers}
      >
        <div className="bottom-sheet-handle" />
        <div className="language-sheet__header">
          <h2 className="language-sheet__title">{t('language')}</h2>
          <span className="language-sheet__current">{SUPPORTED_LOCALES[locale] ?? locale}</span>
        </div>

        <div className="language-sheet__grid">
          {cols.map(([code, name]) => (
            <button
              key={code}
              className={`language-sheet__option${code === locale ? ' language-sheet__option--active' : ''}`}
              onClick={async () => {
                if (code === locale) {
                  closeAnimated();
                  return;
                }
                hapticSelection();
                invalidateCache();
                updateSettings({ locale: code });
                await changeAppLanguage(code);
                closeAnimated();
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
