// Selector de continente + nivel para iniciar una partida
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Continent, GameLevel, LevelDefinition } from '../../data/types';
import type { QuestionTypeFilter } from '../../data/gameQuestions';
import { useAppStore } from '../../stores/appStore';
import { isLevelUnlocked, isTypeFullyDominated, getAttemptsWithInheritance, type StampsData } from '../../data/learningAlgorithm';
import { CONTINENTS, CONTINENT_CSS_VAR, inferContinentFromTimezone } from '../../data/continents';
import { LEVELS, LEVEL_EMOJI } from '../../data/levels';
import './LevelSelector.css';

const SPECIFIC_TYPES: { id: QuestionTypeFilter; icon: string; badge?: string }[] = [
  { id: 'E', icon: '◯?' },
  { id: 'C', icon: '◯→◎' },
  { id: 'D', icon: '◎→◯' },
  { id: 'F', icon: '◎?' },
  { id: 'A', icon: '◯', badge: '🔖' },
  { id: 'B', icon: '◎', badge: '🔖' },
];

interface LevelSelectorProps {
  levels: Map<string, LevelDefinition>;
  onStart: (level: GameLevel, continent: Continent, questionType?: QuestionTypeFilter) => void;
  onContinentSelect: (continent: Continent) => void;
  onStampBannerClick?: (level: GameLevel, continent: Continent) => void;
}

export function LevelSelector({ levels, onStart, onContinentSelect, onStampBannerClick }: LevelSelectorProps) {
  const { t } = useTranslation('game');
  const lastPlayed = useAppStore((s) => s.settings.lastPlayed);
  const getStamps = useAppStore((s) => s.getStamps);
  const activeProfile = useAppStore((s) => s.getActiveProfile());
  const getAttempts = useAppStore((s) => s.getAttempts);

  const getCountriesForLevel = useCallback((l: GameLevel, c: Continent) =>
    levels.get(`${l}-${c}`)?.countries ?? [],
  [levels]);

  const [selectedType, setSelectedType] = useState<QuestionTypeFilter>('mixed');
  const [typesExpanded, setTypesExpanded] = useState(false);
  const [lockedToast, setLockedToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Construir StampsData para verificar desbloqueo de niveles
  const stampsData = useMemo((): StampsData => {
    const data = {} as StampsData;
    for (const level of LEVELS) {
      data[level] = {} as Record<Continent, { countries: boolean; capitals: boolean }>;
      for (const continent of CONTINENTS) {
        data[level][continent] = getStamps(level, continent);
      }
    }
    return data;
  }, [getStamps, activeProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Defaults: lastPlayed > timezone
  const defaultContinent = lastPlayed?.continent ?? inferContinentFromTimezone();
  // Siempre pre-seleccionar el máximo nivel desbloqueado
  const defaultLevel = useMemo(() => {
    const unlocked = [...LEVELS].reverse().find((l) => isLevelUnlocked(l, defaultContinent, stampsData));
    return unlocked ?? ('tourist' as GameLevel);
  }, [defaultContinent, stampsData]);

  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(defaultContinent);
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(defaultLevel);

  // FlyTo al continente pre-seleccionado al montar
  const hasMounted = useRef(false);
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    if (selectedContinent) {
      onContinentSelect(selectedContinent);
    }
  }, [selectedContinent, onContinentSelect]);

  // Detectar si el nivel seleccionado está listo para pruebas de sello
  const stampReadiness = useMemo(() => {
    if (!selectedContinent) return null;
    const stamps = stampsData[selectedLevel]?.[selectedContinent];
    if (!stamps || (stamps.countries && stamps.capitals)) return null;

    if (!isLevelUnlocked(selectedLevel, selectedContinent, stampsData)) return null;

    const def = levels.get(`${selectedLevel}-${selectedContinent}`);
    if (!def) return null;

    const attempts = getAttemptsWithInheritance(
      getAttempts(selectedLevel, selectedContinent),
      selectedLevel,
      selectedContinent,
      getStamps,
      getCountriesForLevel,
    );

    const readyA = !stamps.countries && isTypeFullyDominated(attempts, def.countries, 'A');
    const readyB = !stamps.capitals && isTypeFullyDominated(attempts, def.countries, 'B');

    if (!readyA && !readyB) return null;
    if (readyA && readyB) return t('selector.stampReady.both');
    if (readyA) return t('selector.stampReady.countries');
    return t('selector.stampReady.capitals');
  }, [selectedLevel, selectedContinent, stampsData, levels, getStamps, getCountriesForLevel]);

  // Tipos de juego ya dominados para la combinación nivel-continente seleccionada
  const dominatedTypes = useMemo((): Set<QuestionTypeFilter> => {
    if (!selectedContinent) return new Set();
    const def = levels.get(`${selectedLevel}-${selectedContinent}`);
    if (!def) return new Set();

    const attempts = getAttemptsWithInheritance(
      getAttempts(selectedLevel, selectedContinent),
      selectedLevel,
      selectedContinent,
      getStamps,
      getCountriesForLevel,
    );

    const dominated = new Set<QuestionTypeFilter>();
    for (const type of ['E', 'C', 'D', 'F', 'A', 'B'] as const) {
      if (isTypeFullyDominated(attempts, def.countries, type)) {
        dominated.add(type);
      }
    }
    // Aventura: dominado si tanto A como B están dominados
    if (dominated.has('A') && dominated.has('B')) {
      dominated.add('mixed');
    }
    return dominated;
  }, [selectedLevel, selectedContinent, levels, getAttempts, getStamps, getCountriesForLevel]);

  const handleContinentSelect = useCallback(
    (continent: Continent) => {
      setSelectedContinent(continent);
      onContinentSelect(continent);
      // Siempre seleccionar el máximo nivel desbloqueado para el nuevo continente
      const unlocked = [...LEVELS].reverse().find((l) => isLevelUnlocked(l, continent, stampsData));
      if (unlocked) setSelectedLevel(unlocked);
    },
    [onContinentSelect, selectedLevel, stampsData],
  );

  const handleStart = useCallback(() => {
    if (!selectedContinent) return;
    onStart(selectedLevel, selectedContinent, selectedType);
  }, [selectedLevel, selectedContinent, selectedType, onStart]);

  const getCountryCount = (level: GameLevel, continent: Continent): number => {
    const def = levels.get(`${level}-${continent}`);
    return def?.countries.length ?? 0;
  };

  return (
    <div className="level-selector">
      <div className="level-selector__content">
        <div className="level-selector__scroll" ref={scrollRef}>
        <h2 className="level-selector__title">{t('selector.chooseContinent')}</h2>

        {/* Pills de continente */}
        <div className="level-selector__continents">
          {CONTINENTS.map((c) => (
            <button
              key={c}
              className={`level-selector__continent-pill ${selectedContinent === c ? 'level-selector__continent-pill--active' : ''}`}
              onClick={() => handleContinentSelect(c)}
              style={{ '--pill-color': `var(${CONTINENT_CSS_VAR[c]})` } as React.CSSProperties}
            >
              {t(`common:continent.${c}`)}
            </button>
          ))}
        </div>

        {/* Tarjetas de nivel */}
        <h2 className="level-selector__title level-selector__title--level">{t('selector.chooseLevel')}</h2>
        <div className="level-selector__levels">
          {LEVELS.map((l) => {
            const count = selectedContinent ? getCountryCount(l, selectedContinent) : null;
            const unlocked = selectedContinent
              ? isLevelUnlocked(l, selectedContinent, stampsData)
              : true;
            const stamps = selectedContinent ? stampsData[l]?.[selectedContinent] : null;
            const completed = stamps?.countries && stamps?.capitals;
            return (
              <button
                key={l}
                className={[
                  'level-selector__level-card',
                  selectedLevel === l && 'level-selector__level-card--active',
                  !unlocked && 'level-selector__level-card--locked',
                ].filter(Boolean).join(' ')}
                onClick={() => {
                  if (unlocked) {
                    setSelectedLevel(l);
                  } else {
                    setLockedToast(t('selector.lockedToast'));
                    setTimeout(() => setLockedToast(null), 2500);
                  }
                }}
              >
                <span className="level-selector__level-emoji">{unlocked ? LEVEL_EMOJI[l] : '🔒'}</span>
                <span className="level-selector__level-name">{t(`common:level.${l}`)}</span>
                <span className={`level-selector__level-count${completed ? ' level-selector__level-count--completed' : ''}`}>
                  {completed
                    ? t('selector.completed')
                    : count != null ? t('selector.countryCount', { count }) : '—'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tipo de juego */}
        <h2 className="level-selector__title level-selector__title--level">{t('selector.chooseGame')}</h2>

        {/* Botón Aventura (ancho completo, destacado) */}
        <button
          className={[
            'level-selector__aventura',
            selectedType === 'mixed' && 'level-selector__aventura--active',
            dominatedTypes.has('mixed') && 'level-selector__aventura--dominated',
          ].filter(Boolean).join(' ')}
          onClick={() => { setSelectedType('mixed'); setTypesExpanded(false); }}
        >
          <span className="level-selector__aventura-icon">🧭</span>
          <span className="level-selector__aventura-text">
            <span className="level-selector__aventura-name">{t('selector.adventure')}{dominatedTypes.has('mixed') ? ' ✓' : ''}</span>
            <span className="level-selector__aventura-desc">{t('selector.adventureDesc')}</span>
          </span>
        </button>

        {/* Toggle para tipos concretos */}
        <button
          className="level-selector__types-divider"
          onClick={() => {
            setTypesExpanded((v) => {
              if (!v) {
                requestAnimationFrame(() => {
                  scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
                });
              }
              return !v;
            });
          }}
        >
          <span className="level-selector__types-divider-line" />
          <span className="level-selector__types-divider-text">
            {t('selector.specificTypes')} {typesExpanded ? '▴' : '▾'}
          </span>
          <span className="level-selector__types-divider-line" />
        </button>

        {/* Grid de tipos concretos (colapsable) */}
        {typesExpanded && (
          <div className="level-selector__types-grid">
            {SPECIFIC_TYPES.map(({ id, icon, badge }) => {
              const isDominated = dominatedTypes.has(id);
              return (
                <button
                  key={id}
                  className={[
                    'level-selector__type-card',
                    selectedType === id && 'level-selector__type-card--active',
                    isDominated && 'level-selector__type-card--dominated',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedType(id)}
                >
                  <span className="level-selector__type-icon">{icon}</span>
                  <span className="level-selector__type-label">{t(`common:questionTypeShort.${id}`)}{badge ? ` ${badge}` : ''}{isDominated ? ' ✓' : ''}</span>
                </button>
              );
            })}
          </div>
        )}

        </div>

        <div className="level-selector__footer">
          {/* Toast de nivel bloqueado */}
          {lockedToast && (
            <div className="level-selector__toast">{lockedToast}</div>
          )}

          {/* Banner de invitación a pruebas de sello (clickable) */}
          {stampReadiness && !lockedToast && (
            <button
              className="level-selector__stamp-banner"
              onClick={() => selectedContinent && onStampBannerClick?.(selectedLevel, selectedContinent)}
            >
              {stampReadiness}
            </button>
          )}

          {/* Botón empezar / continuar */}
          <button
            className={`level-selector__start ${!selectedContinent ? 'level-selector__start--disabled' : ''}`}
            onClick={handleStart}
          >
            {selectedContinent && Object.keys(getAttempts(selectedLevel, selectedContinent)).length > 0
              ? t('selector.continue')
              : t('selector.start')}
          </button>
        </div>
      </div>
    </div>
  );
}
