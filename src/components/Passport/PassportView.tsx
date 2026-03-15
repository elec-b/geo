// PassportView — Dashboard de progreso del usuario
// Muestra la matriz 5 continentes × 3 niveles con sellos circulares (estética de pasaporte oficial).
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { isLevelUnlocked, getGlobalLevel, type StampsData } from '../../data/learningAlgorithm';
import type { Continent, GameLevel, LevelDefinition } from '../../data/types';
import type { StampTestType } from '../../hooks/useGameSession';
import './PassportView.css';

const CONTINENTS: { id: Continent; label: string; cssVar: string }[] = [
  { id: 'África', label: 'África', cssVar: '--color-africa' },
  { id: 'América', label: 'América', cssVar: '--color-america' },
  { id: 'Asia', label: 'Asia', cssVar: '--color-asia' },
  { id: 'Europa', label: 'Europa', cssVar: '--color-europe' },
  { id: 'Oceanía', label: 'Oceanía', cssVar: '--color-oceania' },
];

const LEVELS: { id: GameLevel; label: string; emoji: string }[] = [
  { id: 'turista', label: 'Turista', emoji: '🧳' },
  { id: 'mochilero', label: 'Mochilero', emoji: '🎒' },
  { id: 'guía', label: 'Guía', emoji: '🗺️' },
];


/** Rotación determinista por posición (hash simple → rango [-8, 8]) */
function computeStampRotations(): Map<string, number> {
  const rotations = new Map<string, number>();
  for (const level of LEVELS) {
    for (const continent of CONTINENTS) {
      for (const type of ['countries', 'capitals'] as const) {
        const key = `${level.id}-${continent.id}-${type}`;
        let hash = 0;
        for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
        rotations.set(key, (Math.abs(hash) % 17) - 8);
      }
    }
  }
  return rotations;
}

const STAMP_ROTATIONS = computeStampRotations();

interface EarnedStampInfo {
  level: GameLevel;
  continent: Continent;
  stampType: StampTestType;
}

interface PassportViewProps {
  levels: Map<string, LevelDefinition>;
  onStartStampTest: (level: GameLevel, continent: Continent, stampType: StampTestType) => void;
  recentlyEarnedStamp?: EarnedStampInfo | null;
  onStampAnimationDone?: () => void;
}

export function PassportView({ levels, onStartStampTest, recentlyEarnedStamp, onStampAnimationDone }: PassportViewProps) {
  const getStamps = useAppStore((s) => s.getStamps);
  const activeProfile = useAppStore((s) => s.getActiveProfile());

  // Estado del modal de selección de sello
  const [selectedCell, setSelectedCell] = useState<{ level: GameLevel; continent: Continent } | null>(null);

  // Construir StampsData completo para funciones puras
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

  const globalLevel = useMemo(() => getGlobalLevel(stampsData), [stampsData]);

  // Limpiar animación de sello tras completarse
  useEffect(() => {
    if (!recentlyEarnedStamp) return;
    const timer = setTimeout(() => {
      onStampAnimationDone?.();
    }, 500);
    return () => clearTimeout(timer);
  }, [recentlyEarnedStamp, onStampAnimationDone]);

  // ¿Es este sello el recién ganado? (para animación stampDrop)
  const isRecentlyEarned = useCallback(
    (level: GameLevel, continent: Continent, type: StampTestType) => {
      if (!recentlyEarnedStamp) return false;
      return recentlyEarnedStamp.level === level &&
        recentlyEarnedStamp.continent === continent &&
        recentlyEarnedStamp.stampType === type;
    },
    [recentlyEarnedStamp],
  );

  // Handler: tocar celda con sello pendiente → abrir modal
  const handleCellClick = useCallback(
    (level: GameLevel, continent: Continent) => {
      if (!isLevelUnlocked(level, continent, stampsData)) return;
      const stamps = stampsData[level][continent];
      // Si ambos sellos ganados, no hacer nada
      if (stamps.countries && stamps.capitals) return;
      setSelectedCell({ level, continent });
    },
    [stampsData],
  );

  // Handler: iniciar prueba de sello desde el modal
  const handleStartTest = useCallback(
    (stampType: StampTestType) => {
      if (!selectedCell) return;
      setSelectedCell(null);
      onStartStampTest(selectedCell.level, selectedCell.continent, stampType);
    },
    [selectedCell, onStartStampTest],
  );

  return (
    <div className="passport-view tab-overlay tab-overlay--active tab-overlay--passport">
      {/* Header con nivel global */}
      <div className="passport-header">
        <span className="passport-header__name">Pasaporte de {activeProfile?.name ?? 'Explorador'}</span>
        {globalLevel && (
          <span className="passport-header__level">
            Nivel global: {LEVELS.find((l) => l.id === globalLevel)?.label}
          </span>
        )}
      </div>

      {/* Matriz 5×3 */}
      <div className="passport-grid">
        {/* Cabecera de niveles */}
        <div className="passport-grid__corner" />
        {LEVELS.map((level) => (
          <div key={level.id} className="passport-grid__level-header">
            <span className="passport-grid__level-emoji">{level.emoji}</span>
            <span className="passport-grid__level-name">{level.label}</span>
          </div>
        ))}

        {/* Filas por continente */}
        {CONTINENTS.map((continent) => (
          <>
            <div
              key={`label-${continent.id}`}
              className="passport-grid__continent-label"
              style={{ color: `var(${continent.cssVar})` }}
            >
              {continent.label}
            </div>
            {LEVELS.map((level) => {
              const stamps = stampsData[level.id][continent.id];
              const unlocked = isLevelUnlocked(level.id, continent.id, stampsData);
              const bothEarned = stamps.countries && stamps.capitals;
              const countryCount = levels.get(`${level.id}-${continent.id}`)?.countries.length ?? 0;

              return (
                <button
                  key={`${level.id}-${continent.id}`}
                  className={[
                    'passport-cell',
                    !unlocked && 'passport-cell--locked',
                    bothEarned && 'passport-cell--complete',
                    unlocked && !bothEarned && 'passport-cell--available',
                  ].filter(Boolean).join(' ')}
                  disabled={!unlocked || bothEarned}
                  onClick={() => handleCellClick(level.id, continent.id)}
                  style={{ '--cell-color': `var(${continent.cssVar})` } as React.CSSProperties}
                >
                  {!unlocked ? (
                    <span className="passport-cell__lock">🔒</span>
                  ) : (
                    <div className="passport-cell__stamps">
                      <span
                        className={[
                          'passport-cell__stamp',
                          'passport-cell__stamp--countries',
                          stamps.countries && 'passport-cell__stamp--earned',
                          !stamps.countries && unlocked && !bothEarned && 'passport-cell__stamp--available',
                          isRecentlyEarned(level.id, continent.id, 'countries') && 'passport-cell__stamp--animating',
                        ].filter(Boolean).join(' ')}
                        style={stamps.countries ? { '--stamp-rotation': `${STAMP_ROTATIONS.get(`${level.id}-${continent.id}-countries`) ?? 0}deg` } as React.CSSProperties : undefined}
                        title="Sello de Países"
                      />
                      <span
                        className={[
                          'passport-cell__stamp',
                          'passport-cell__stamp--capitals',
                          stamps.capitals && 'passport-cell__stamp--earned',
                          !stamps.capitals && unlocked && !bothEarned && 'passport-cell__stamp--available',
                          isRecentlyEarned(level.id, continent.id, 'capitals') && 'passport-cell__stamp--animating',
                        ].filter(Boolean).join(' ')}
                        style={stamps.capitals ? { '--stamp-rotation': `${STAMP_ROTATIONS.get(`${level.id}-${continent.id}-capitals`) ?? 0}deg` } as React.CSSProperties : undefined}
                        title="Sello de Capitales"
                      />
                    </div>
                  )}
                  {unlocked && (
                    <span className="passport-cell__count">{countryCount}</span>
                  )}
                </button>
              );
            })}
          </>
        ))}
      </div>

      {/* Leyenda */}
      <div className="passport-legend">
        <span className="passport-legend__item">○ País</span>
        <span className="passport-legend__item">◎ Capital</span>
        <span className="passport-legend__item">★ Conseguido</span>
        <span className="passport-legend__item passport-legend__item--muted">🔒 Bloqueado</span>
      </div>

      {/* Modal: elegir qué sello intentar */}
      {selectedCell && (
        <div className="jugar-modal-overlay">
          <div className="jugar-modal">
            <h3 className="jugar-modal__title">Prueba de sello</h3>
            <p className="jugar-modal__text">
              {LEVELS.find((l) => l.id === selectedCell.level)?.label} — {selectedCell.continent}
            </p>
            <p className="jugar-modal__text">
              Completa la prueba sin errores para conseguir el sello.
            </p>
            <div className="jugar-modal__buttons">
              {!stampsData[selectedCell.level][selectedCell.continent].countries && (
                <button
                  className="jugar-modal__btn jugar-modal__btn--countries"
                  onClick={() => handleStartTest('countries')}
                >
                  Sello de Países
                </button>
              )}
              {!stampsData[selectedCell.level][selectedCell.continent].capitals && (
                <button
                  className="jugar-modal__btn jugar-modal__btn--capitals"
                  onClick={() => handleStartTest('capitals')}
                >
                  Sello de Capitales
                </button>
              )}
            </div>
            <button
              className="jugar-modal__cancel"
              onClick={() => setSelectedCell(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
