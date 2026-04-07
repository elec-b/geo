// AboutSheet — pantalla completa informativa (Acerca de Exploris)
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { hapticSelection } from '../../utils/haptics';
import './AboutSheet.css';

interface AboutSheetProps {
  onClose: () => void;
}

/** IDs de las secciones colapsables */
const SECTIONS = ['countries', 'learn', 'gameTypes', 'stats', 'sources', 'privacy'] as const;
type SectionId = (typeof SECTIONS)[number];

/** URL de la política de privacidad pública */
const PRIVACY_POLICY_URL = 'https://elec-b.github.io/exploris-data/privacy.html';

export function AboutSheet({ onClose }: AboutSheetProps) {
  const { t } = useTranslation('about');
  const { t: tCommon } = useTranslation('common');
  const [expanded, setExpanded] = useState<Set<SectionId>>(new Set());

  const toggle = useCallback((id: SectionId) => {
    hapticSelection();
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="about-sheet-overlay" onClick={onClose}>
      <div className="about-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="about-sheet__header">
          <h2 className="about-sheet__title">{t('title')}</h2>
          <button className="about-sheet__close" onClick={onClose} aria-label={tCommon('close')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="about-sheet__scroll">
          {/* Intro (siempre visible) */}
          <p className="about-sheet__intro">{t('intro')}</p>

          {/* Países y datos */}
          <Section id="countries" expanded={expanded.has('countries')} onToggle={toggle}>
            <p className="about-sheet__text">{t('section.countries.body')}</p>
          </Section>

          {/* Cómo aprender */}
          <Section id="learn" expanded={expanded.has('learn')} onToggle={toggle}>
            <p className="about-sheet__text">{t('section.learn.tips.explore')}</p>
            <p className="about-sheet__text">{t('section.learn.tips.play')}</p>
            <p className="about-sheet__text">{t('section.learn.tips.passport')}</p>
          </Section>

          {/* Tipos de juego */}
          <Section id="gameTypes" expanded={expanded.has('gameTypes')} onToggle={toggle}>
            <p className="about-sheet__text">{t('section.gameTypes.intro')}</p>
            <ul className="about-sheet__game-types">
              <li>{t('section.gameTypes.E')}</li>
              <li>{t('section.gameTypes.C')}</li>
              <li>{t('section.gameTypes.D')}</li>
              <li>{t('section.gameTypes.F')}</li>
              <li>{t('section.gameTypes.A')}</li>
              <li>{t('section.gameTypes.B')}</li>
            </ul>
            <p className="about-sheet__text">{t('section.gameTypes.adventure')}</p>
            <p className="about-sheet__text about-sheet__text--muted">{t('section.gameTypes.stamps')}</p>
          </Section>

          {/* Estadísticas */}
          <Section id="stats" expanded={expanded.has('stats')} onToggle={toggle}>
            <p className="about-sheet__text">{t('section.stats.body')}</p>
          </Section>

          {/* Fuentes de datos */}
          <Section id="sources" expanded={expanded.has('sources')} onToggle={toggle}>
            <p className="about-sheet__text">{t('section.sources.body')}</p>
          </Section>

          {/* Privacidad */}
          <Section id="privacy" expanded={expanded.has('privacy')} onToggle={toggle}>
            <p className="about-sheet__text">{t('section.privacy.body')}</p>
            <a
              className="about-sheet__link"
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('section.privacy.linkLabel')}
            </a>
          </Section>
        </div>
      </div>
    </div>
  );
}

/** Sección colapsable genérica */
function Section({
  id,
  expanded,
  onToggle,
  children,
}: {
  id: SectionId;
  expanded: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation('about');

  return (
    <div className="about-sheet__section">
      <button
        className="about-sheet__section-header"
        onClick={() => onToggle(id)}
        aria-expanded={expanded}
      >
        <span className="about-sheet__section-title">{t(`section.${id}.title`)}</span>
        <span className={`about-sheet__chevron${expanded ? ' about-sheet__chevron--open' : ''}`}>›</span>
      </button>
      <div className={`about-sheet__section-body${expanded ? ' about-sheet__section-body--open' : ''}`}>
        <div className="about-sheet__section-content">
          {children}
        </div>
      </div>
    </div>
  );
}
