// StatsView — modal fullscreen con estadísticas de aprendizaje por país
// Dos pestañas: Jugar (entrenamiento) y Pruebas de sello (certificación).
// Toggle para alternar entre indicadores de dominio y % de acierto.
import { useState, useMemo, useCallback } from 'react';
import type { CountryData, Continent, GameLevel, QuestionType, LevelDefinition } from '../../data/types';
import type { CountryAttempts, StampCountryAttempts } from '../../stores/types';
import { isDominated, isDirectlyDominated, getAttemptsWithInheritance } from '../../data/learningAlgorithm';
import { useAppStore } from '../../stores/appStore';
import './StatsView.css';

const CONTINENTS: Continent[] = ['África', 'América', 'Asia', 'Europa', 'Oceanía'];
const LEVELS: GameLevel[] = ['turista', 'mochilero', 'guía'];
const ALL_TYPES: QuestionType[] = ['E', 'C', 'D', 'F', 'A', 'B'];
const STAMP_TYPES: ('A' | 'B')[] = ['A', 'B'];

export type StatsTab = 'jugar' | 'sellos';

export interface StatsContext {
  tab?: StatsTab;
  continent?: Continent;
  level?: GameLevel;
}

interface StatsViewProps {
  countries: Map<string, CountryData>;
  levels: Map<string, LevelDefinition>;
  onClose: () => void;
  context?: StatsContext;
}

// --- Indicadores de celda (pestaña Jugar) ---

/** Indicador de dominio para la tabla de Jugar */
function JugarCellIndicator({ ca, type, isInferredType }: {
  ca: CountryAttempts | undefined;
  type: QuestionType;
  isInferredType: boolean;
}) {
  if (!ca) {
    return <span className="stats-cell stats-cell--empty">{'\u2014'}</span>;
  }

  if (isDominated(ca, type)) {
    return isInferredType
      ? <span className="stats-cell stats-cell--inferred">{'\u2713'}</span>
      : <span className="stats-cell stats-cell--dominated">{'\u2713'}</span>;
  }

  const rec = ca[type];
  if (!rec || (rec.correct === 0 && rec.incorrect === 0)) {
    return <span className="stats-cell stats-cell--empty">{'\u2014'}</span>;
  }

  return <span className="stats-cell stats-cell--reinforcement">{'\u2717'}</span>;
}

/** Clase CSS según el valor del porcentaje */
function percentClass(pct: number): string {
  if (pct < 50) return 'stats-cell--percent-low';
  if (pct < 80) return 'stats-cell--percent-mid';
  return 'stats-cell--percent-high';
}

/** Porcentaje de acierto para una celda de Jugar */
function JugarPercentCell({ ca, type }: {
  ca: CountryAttempts | undefined;
  type: QuestionType;
}) {
  if (!ca) {
    return <span className="stats-cell stats-cell--empty">{'\u2014'}</span>;
  }
  const rec = ca[type];
  if (!rec || (rec.correct === 0 && rec.incorrect === 0)) {
    return <span className="stats-cell stats-cell--empty">{'\u2014'}</span>;
  }
  const pct = Math.round((rec.correct / (rec.correct + rec.incorrect)) * 100);
  return <span className={`stats-cell stats-cell--percent ${percentClass(pct)}`}>{pct}%</span>;
}

// --- Indicadores de celda (pestaña Pruebas de sello) ---

/** Indicador de dominio para la tabla de Pruebas de sello */
function StampCellIndicator({ sca, type }: {
  sca: StampCountryAttempts | undefined;
  type: 'A' | 'B';
}) {
  if (!sca) {
    return <span className="stats-cell stats-cell--empty">{'\u2014'}</span>;
  }
  const rec = sca[type];
  if (!rec) {
    return <span className="stats-cell stats-cell--empty">{'\u2014'}</span>;
  }
  return rec.lastCorrect
    ? <span className="stats-cell stats-cell--dominated">{'\u2713'}</span>
    : <span className="stats-cell stats-cell--reinforcement">{'\u2717'}</span>;
}

/** Porcentaje de acierto para una celda de Pruebas de sello */
function StampPercentCell({ sca, type }: {
  sca: StampCountryAttempts | undefined;
  type: 'A' | 'B';
}) {
  if (!sca) {
    return <span className="stats-cell stats-cell--empty">{'\u2014'}</span>;
  }
  const rec = sca[type];
  if (!rec || (rec.correct === 0 && rec.incorrect === 0)) {
    return <span className="stats-cell stats-cell--empty">{'\u2014'}</span>;
  }
  const pct = Math.round((rec.correct / (rec.correct + rec.incorrect)) * 100);
  return <span className={`stats-cell stats-cell--percent ${percentClass(pct)}`}>{pct}%</span>;
}

/** Abreviaturas descriptivas para cada tipo de pregunta */
const TYPE_LABELS: Record<QuestionType, { short: string; full: string }> = {
  E: { short: '◯?', full: 'Identifica el país' },
  C: { short: '◯→◎', full: 'País a capital' },
  D: { short: '◎→◯', full: 'Capital a país' },
  F: { short: '◎?', full: 'Identifica la capital' },
  A: { short: '◯', full: 'Señala el país' },
  B: { short: '◎', full: 'Señala la capital' },
};

const STAMP_LABELS: Record<'A' | 'B', { short: string; full: string }> = {
  A: { short: '◯ Países', full: 'Prueba de sello de Países' },
  B: { short: '◎ Capitales', full: 'Prueba de sello de Capitales' },
};

export function StatsView({ countries, levels, onClose, context }: StatsViewProps) {
  const lastPlayed = useAppStore((s) => s.settings.lastPlayed);
  const lastStampPlayed = useAppStore((s) => s.settings.lastStampPlayed);

  const defaultTab = context?.tab ?? 'jugar';
  const source = defaultTab === 'sellos' ? lastStampPlayed : lastPlayed;

  const [selectedContinent, setSelectedContinent] = useState<Continent>(
    context?.continent ?? source?.continent ?? 'Europa',
  );
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(
    context?.level ?? source?.level ?? 'turista',
  );
  const [activeTab, setActiveTab] = useState<StatsTab>(defaultTab);
  const [showPercentage, setShowPercentage] = useState(false);

  const resetAttempts = useAppStore((s) => s.resetAttempts);
  const getStamps = useAppStore((s) => s.getStamps);
  const getStampAttempts = useAppStore((s) => s.getStampAttempts);

  // Países del nivel × continente actual
  const levelDef = levels.get(`${selectedLevel}-${selectedContinent}`);
  const levelCountries = levelDef?.countries ?? [];

  // --- Datos de Jugar ---
  const ownAttempts = useAppStore((s) => {
    const profile = s.profiles.find((p) => p.id === s.activeProfileId);
    if (!profile) return {};
    return profile.progress[selectedLevel]?.[selectedContinent]?.attempts ?? {};
  });

  const getCountriesForLevel = useCallback((l: GameLevel, c: Continent) =>
    levels.get(`${l}-${c}`)?.countries ?? [],
  [levels]);

  const allAttempts = useMemo(() => {
    if (selectedLevel === 'turista') return ownAttempts;
    return getAttemptsWithInheritance(
      ownAttempts, selectedLevel, selectedContinent,
      getStamps, getCountriesForLevel,
    );
  }, [ownAttempts, selectedLevel, selectedContinent, getStamps, getCountriesForLevel]);

  // --- Datos de Pruebas de sello ---
  const stampAttempts = useMemo(() => {
    return getStampAttempts(selectedLevel, selectedContinent);
  }, [getStampAttempts, selectedLevel, selectedContinent]);

  // Lista de países ordenados por nombre
  const sortedCountries = useMemo(() => {
    return levelCountries
      .map((cca2) => ({ cca2, name: countries.get(cca2)?.name ?? cca2 }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [levelCountries, countries]);

  const handleReset = () => {
    if (window.confirm(`¿Resetear estadísticas de Jugar para ${selectedLevel} - ${selectedContinent}?`)) {
      resetAttempts(selectedLevel, selectedContinent);
    }
  };

  return (
    <div className="stats-overlay">
      <div className="stats-view">
        {/* Cabecera */}
        <div className="stats-header">
          <h2 className="stats-header__title">Estadísticas</h2>
          <button className="stats-header__close" onClick={onClose} aria-label="Cerrar">
            {'\u2715'}
          </button>
        </div>

        {/* Pestañas: Jugar | Pruebas de sello */}
        <div className="stats-tabs">
          <button
            className={`stats-tab${activeTab === 'jugar' ? ' stats-tab--active' : ''}`}
            onClick={() => setActiveTab('jugar')}
          >
            Jugar
          </button>
          <button
            className={`stats-tab${activeTab === 'sellos' ? ' stats-tab--active' : ''}`}
            onClick={() => setActiveTab('sellos')}
          >
            Pruebas de sello
          </button>
        </div>

        {/* Selector de continente */}
        <div className="stats-pills">
          {CONTINENTS.map((c) => (
            <button
              key={c}
              className={`stats-pill${c === selectedContinent ? ' stats-pill--active' : ''}`}
              onClick={() => setSelectedContinent(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Selector de nivel */}
        <div className="stats-pills">
          {LEVELS.map((l) => (
            <button
              key={l}
              className={`stats-pill stats-pill--level${l === selectedLevel ? ' stats-pill--active' : ''}`}
              onClick={() => setSelectedLevel(l)}
            >
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>

        {/* Toggle ✓ / % */}
        <div className="stats-toggle-row">
          <button
            className="stats-toggle"
            onClick={() => setShowPercentage((v) => !v)}
            aria-label={showPercentage ? 'Mostrar indicadores' : 'Mostrar porcentajes'}
          >
            {showPercentage ? '\u2713 / \u2717' : '%'}
          </button>
        </div>

        {/* Tabla — Jugar */}
        {activeTab === 'jugar' && (
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th className="stats-table__th-name">País</th>
                  {ALL_TYPES.map((t) => (
                    <th key={t} className="stats-table__th-type" title={TYPE_LABELS[t].full}>
                      {TYPE_LABELS[t].short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCountries.map(({ cca2, name }) => {
                  const ca = allAttempts[cca2];
                  const ownCa = ownAttempts[cca2];
                  return (
                    <tr key={cca2}>
                      <td className="stats-table__td-name">{name}</td>
                      {ALL_TYPES.map((t) => {
                        const isInferredType = isDominated(ca, t) && !isDirectlyDominated(ownCa, t);
                        return (
                          <td key={t} className="stats-table__td-type">
                            {showPercentage
                              ? <JugarPercentCell ca={ca} type={t} />
                              : <JugarCellIndicator ca={ca} type={t} isInferredType={isInferredType} />
                            }
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabla — Pruebas de sello */}
        {activeTab === 'sellos' && (
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th className="stats-table__th-name">País</th>
                  {STAMP_TYPES.map((t) => (
                    <th key={t} className="stats-table__th-type" title={STAMP_LABELS[t].full}>
                      {STAMP_LABELS[t].short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCountries.map(({ cca2, name }) => {
                  const sca = stampAttempts[cca2];
                  return (
                    <tr key={cca2}>
                      <td className="stats-table__td-name">{name}</td>
                      {STAMP_TYPES.map((t) => (
                        <td key={t} className="stats-table__td-type">
                          {showPercentage
                            ? <StampPercentCell sca={sca} type={t} />
                            : <StampCellIndicator sca={sca} type={t} />
                          }
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Leyenda */}
        <div className="stats-legend">
          {activeTab === 'jugar' && !showPercentage && (
            <>
              <span><span className="stats-cell stats-cell--dominated">{'\u2713'}</span> Dominado</span>
              <span><span className="stats-cell stats-cell--inferred">{'\u2713'}</span> Inferido</span>
              <span><span className="stats-cell stats-cell--reinforcement">{'\u2717'}</span> Refuerzo</span>
              <span><span className="stats-cell stats-cell--empty">{'\u2014'}</span> Sin datos</span>
            </>
          )}
          {activeTab === 'sellos' && !showPercentage && (
            <>
              <span><span className="stats-cell stats-cell--dominated">{'\u2713'}</span> Acertado</span>
              <span><span className="stats-cell stats-cell--reinforcement">{'\u2717'}</span> Fallado</span>
              <span><span className="stats-cell stats-cell--empty">{'\u2014'}</span> Sin datos</span>
            </>
          )}
        </div>

        {/* Botón resetear (solo en pestaña Jugar) */}
        {activeTab === 'jugar' && (
          <button className="stats-reset" onClick={handleReset}>
            Resetear estadísticas
          </button>
        )}

        {/* Aviso de permanencia (solo en pestaña Sellos) */}
        {activeTab === 'sellos' && (
          <p className="stats-stamp-notice">
            Los sellos y el historial de pruebas son permanentes, como en un pasaporte real. Si quieres empezar de cero, crea un nuevo perfil.
          </p>
        )}
      </div>
    </div>
  );
}
