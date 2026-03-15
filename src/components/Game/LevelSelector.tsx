// Selector de continente + nivel para iniciar una partida
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Continent, GameLevel, LevelDefinition } from '../../data/types';
import type { QuestionTypeFilter } from '../../data/gameQuestions';
import { useAppStore } from '../../stores/appStore';
import { isLevelUnlocked, isTypeFullyDominated, getAttemptsWithInheritance, type StampsData } from '../../data/learningAlgorithm';
import { inferContinentFromTimezone } from '../../data/continents';
import './LevelSelector.css';

// Orden olímpico — colores vía CSS variables (compartidos con Explorar y Pasaporte)
const CONTINENTS: { id: Continent; label: string; cssVar: string }[] = [
  { id: 'Europa', label: 'Europa', cssVar: '--color-europe' },
  { id: 'África', label: 'África', cssVar: '--color-africa' },
  { id: 'América', label: 'América', cssVar: '--color-america' },
  { id: 'Asia', label: 'Asia', cssVar: '--color-asia' },
  { id: 'Oceanía', label: 'Oceanía', cssVar: '--color-oceania' },
];

const LEVELS: { id: GameLevel; label: string; emoji: string }[] = [
  { id: 'turista', label: 'Turista', emoji: '🧳' },
  { id: 'mochilero', label: 'Mochilero', emoji: '🎒' },
  { id: 'guía', label: 'Guía', emoji: '🗺️' },
];

const QUESTION_TYPES: { id: QuestionTypeFilter; label: string; badge?: string }[] = [
  { id: 'mixed', label: 'Aventura' },
  { id: 'E', label: '¿Qué país es?' },
  { id: 'C', label: 'País → Capital' },
  { id: 'D', label: 'Capital → País' },
  { id: 'F', label: '¿Cuál es su capital?' },
  { id: 'A', label: 'Señala el país', badge: '🔖' },
  { id: 'B', label: 'Señala la capital', badge: '🔖' },
];

interface LevelSelectorProps {
  levels: Map<string, LevelDefinition>;
  onStart: (level: GameLevel, continent: Continent, questionType?: QuestionTypeFilter) => void;
  onContinentSelect: (continent: Continent) => void;
  onStampBannerClick?: (level: GameLevel, continent: Continent) => void;
}

export function LevelSelector({ levels, onStart, onContinentSelect, onStampBannerClick }: LevelSelectorProps) {
  const lastPlayed = useAppStore((s) => s.settings.lastPlayed);
  const getStamps = useAppStore((s) => s.getStamps);
  const activeProfile = useAppStore((s) => s.getActiveProfile());
  const getAttempts = useAppStore((s) => s.getAttempts);

  const [selectedType, setSelectedType] = useState<QuestionTypeFilter>('mixed');
  const [lockedToast, setLockedToast] = useState<string | null>(null);

  // Construir StampsData para verificar desbloqueo de niveles
  const stampsData = useMemo((): StampsData => {
    const data = {} as StampsData;
    for (const level of LEVELS) {
      data[level.id] = {} as Record<Continent, { countries: boolean; capitals: boolean }>;
      for (const continent of CONTINENTS) {
        data[level.id][continent.id] = getStamps(level.id, continent.id);
      }
    }
    return data;
  }, [getStamps, activeProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Defaults: lastPlayed > timezone
  const defaultContinent = lastPlayed?.continent ?? inferContinentFromTimezone();
  // Siempre pre-seleccionar el máximo nivel desbloqueado
  const defaultLevel = useMemo(() => {
    const unlocked = [...LEVELS].reverse().find((l) => isLevelUnlocked(l.id, defaultContinent, stampsData));
    return unlocked?.id ?? ('turista' as GameLevel);
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
      getAttempts,
    );

    const readyA = !stamps.countries && isTypeFullyDominated(attempts, def.countries, 'A');
    const readyB = !stamps.capitals && isTypeFullyDominated(attempts, def.countries, 'B');

    if (!readyA && !readyB) return null;
    if (readyA && readyB) return '¡Listo para las pruebas de sello!';
    if (readyA) return '¡Listo para la prueba de países!';
    return '¡Listo para la prueba de capitales!';
  }, [selectedLevel, selectedContinent, stampsData, levels, getStamps, getAttempts]);

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
      getAttempts,
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
  }, [selectedLevel, selectedContinent, levels, getAttempts, getStamps]);

  const handleContinentSelect = useCallback(
    (continent: Continent) => {
      setSelectedContinent(continent);
      onContinentSelect(continent);
      // Siempre seleccionar el máximo nivel desbloqueado para el nuevo continente
      const unlocked = [...LEVELS].reverse().find((l) => isLevelUnlocked(l.id, continent, stampsData));
      if (unlocked) setSelectedLevel(unlocked.id);
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
        <h2 className="level-selector__title">Elige continente</h2>

        {/* Pills de continente */}
        <div className="level-selector__continents">
          {CONTINENTS.map(({ id, label, cssVar }) => (
            <button
              key={id}
              className={`level-selector__continent-pill ${selectedContinent === id ? 'level-selector__continent-pill--active' : ''}`}
              onClick={() => handleContinentSelect(id)}
              style={{ '--pill-color': `var(${cssVar})` } as React.CSSProperties}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tarjetas de nivel */}
        <h2 className="level-selector__title level-selector__title--level">Elige nivel</h2>
        <div className="level-selector__levels">
          {LEVELS.map(({ id, label, emoji }) => {
            const count = selectedContinent ? getCountryCount(id, selectedContinent) : null;
            const unlocked = selectedContinent
              ? isLevelUnlocked(id, selectedContinent, stampsData)
              : true;
            const stamps = selectedContinent ? stampsData[id]?.[selectedContinent] : null;
            const completed = stamps?.countries && stamps?.capitals;
            return (
              <button
                key={id}
                className={[
                  'level-selector__level-card',
                  selectedLevel === id && 'level-selector__level-card--active',
                  !unlocked && 'level-selector__level-card--locked',
                ].filter(Boolean).join(' ')}
                onClick={() => {
                  if (unlocked) {
                    setSelectedLevel(id);
                  } else {
                    setLockedToast('Consigue los sellos del nivel anterior');
                    setTimeout(() => setLockedToast(null), 2500);
                  }
                }}
              >
                <span className="level-selector__level-emoji">{unlocked ? emoji : '🔒'}</span>
                <span className="level-selector__level-name">{label}</span>
                <span className={`level-selector__level-count${completed ? ' level-selector__level-count--completed' : ''}`}>
                  {!unlocked
                    ? 'Bloqueado'
                    : completed
                    ? 'Superado ★'
                    : count != null ? `${count} ${count === 1 ? 'país' : 'países'}` : '—'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pills de tipo de juego (orden pedagógico) */}
        <h2 className="level-selector__title level-selector__title--level">Tipo de juego</h2>
        <div className="level-selector__types">
          {QUESTION_TYPES.map(({ id, label, badge }) => {
            const isDominated = dominatedTypes.has(id);
            return (
              <button
                key={id}
                className={[
                  'level-selector__type-pill',
                  selectedType === id && 'level-selector__type-pill--active',
                  isDominated && 'level-selector__type-pill--dominated',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedType(id)}
              >
                {label}{badge ? ` ${badge}` : ''}{isDominated ? ' ✓' : ''}
              </button>
            );
          })}
        </div>

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
            ? 'Continuar'
            : 'Empezar'}
        </button>
      </div>
    </div>
  );
}
