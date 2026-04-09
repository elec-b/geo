// TabBar - Navegación principal inferior
import { useTranslation } from 'react-i18next';
import { TABS } from './types';
import type { TabId } from './types';
import './TabBar.css';

// Iconos SVG inline por tab
function TabIcon({ iconId }: { iconId: string }) {
  switch (iconId) {
    case 'play':
      // Triángulo de play dentro de un círculo
      return (
        <svg className="tab-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'explore':
      // Globo terráqueo
      return (
        <svg className="tab-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case 'passport':
      // Libro/pasaporte
      return (
        <svg className="tab-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <circle cx="12" cy="10" r="3" />
          <path d="M8 18h8" />
        </svg>
      );
    default:
      return null;
  }
}

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  visible?: boolean;
}

export function TabBar({ activeTab, onTabChange, visible = true }: TabBarProps) {
  const { t } = useTranslation('common');

  return (
    <nav
      className={`tab-bar ${!visible ? 'tab-bar--hidden' : ''}`}
      role="tablist"
      aria-label={t('aria.navigation')}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const classNames = [
          'tab-bar__button',
          isActive && 'tab-bar__button--active',
          tab.id === 'play' && 'tab-bar__button--play',
        ].filter(Boolean).join(' ');

        return (
          <button
            key={tab.id}
            className={classNames}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
          >
            <TabIcon iconId={tab.iconId} />
            <span className="tab-bar__label">{t(tab.label)}</span>
          </button>
        );
      })}
    </nav>
  );
}
