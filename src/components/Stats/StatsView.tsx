// StatsView — modal fullscreen con estadísticas de aprendizaje por país
// Dos pestañas: Jugar (entrenamiento) y Pruebas de sello (certificación).
// Toggle para alternar entre indicadores de dominio y % de acierto.
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { CountryData, Continent, GameLevel, QuestionType, LevelDefinition } from '../../data/types';
import type { CountryAttempts, StampCountryAttempts } from '../../stores/types';
import { isDominated, isDirectlyDominated, getAttemptsWithInheritance } from '../../data/learningAlgorithm';
import { useAppStore } from '../../stores/appStore';
import { CONTINENTS } from '../../data/continents';
import { LEVELS } from '../../data/levels';
import './StatsView.css';
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
  onCountryClick?: (cca2: string) => void;
  context?: StatsContext;
  style?: React.CSSProperties;
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

/** Iconos cortos para cada tipo de pregunta (invariantes de idioma) */
const TYPE_SHORT: Record<QuestionType, string> = {
  E: '◯?', C: '◯→◎', D: '◎→◯', F: '◎?', A: '◯', B: '◎',
};

// --- Sorting ---

type StatsSortKey = 'name' | QuestionType;
type SortDir = 'asc' | 'desc';

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return null;
  return <span className="stats-table__sort-indicator">{dir === 'asc' ? ' ▲' : ' ▼'}</span>;
}

/** Valor numérico para ordenar columnas de Jugar en modo indicador */
function getJugarIndicatorValue(
  ca: CountryAttempts | undefined,
  ownCa: CountryAttempts | undefined,
  type: QuestionType,
): number {
  if (!ca) return 0;
  if (isDominated(ca, type)) {
    return isDirectlyDominated(ownCa, type) ? 2 : 1;
  }
  const rec = ca[type];
  if (!rec || (rec.correct === 0 && rec.incorrect === 0)) return 0;
  return -1;
}

/** Valor numérico para ordenar columnas de Jugar en modo porcentaje */
function getJugarPercentValue(ca: CountryAttempts | undefined, type: QuestionType): number {
  if (!ca) return -1;
  const rec = ca[type];
  if (!rec || (rec.correct === 0 && rec.incorrect === 0)) return -1;
  return Math.round((rec.correct / (rec.correct + rec.incorrect)) * 100);
}

/** Valor numérico para ordenar columnas de Sellos en modo indicador */
function getStampIndicatorValue(sca: StampCountryAttempts | undefined, type: 'A' | 'B'): number {
  if (!sca) return 0;
  const rec = sca[type];
  if (!rec) return 0;
  return rec.lastCorrect ? 1 : -1;
}

/** Valor numérico para ordenar columnas de Sellos en modo porcentaje */
function getStampPercentValue(sca: StampCountryAttempts | undefined, type: 'A' | 'B'): number {
  if (!sca) return -1;
  const rec = sca[type];
  if (!rec || (rec.correct === 0 && rec.incorrect === 0)) return -1;
  return Math.round((rec.correct / (rec.correct + rec.incorrect)) * 100);
}

export function StatsView({ countries, levels, onClose, onCountryClick, context, style }: StatsViewProps) {
  const { t } = useTranslation('stats');
  const lastPlayed = useAppStore((s) => s.settings.lastPlayed);
  const lastStampPlayed = useAppStore((s) => s.settings.lastStampPlayed);

  const defaultTab = context?.tab ?? 'jugar';
  const source = defaultTab === 'sellos' ? lastStampPlayed : lastPlayed;

  const [selectedContinent, setSelectedContinent] = useState<Continent>(
    context?.continent ?? source?.continent ?? 'europe',
  );
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(
    context?.level ?? source?.level ?? 'tourist',
  );
  const [activeTab, setActiveTab] = useState<StatsTab>(defaultTab);
  const [showPercentage, setShowPercentage] = useState(false);
  const [sortKey, setSortKey] = useState<StatsSortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = useCallback((key: StatsSortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const handleTabChange = useCallback((tab: StatsTab) => {
    setActiveTab(tab);
    setSortKey('name');
    setSortDir('asc');
  }, []);

  const resetAttempts = useAppStore((s) => s.resetAttempts);
  const getAttempts = useAppStore((s) => s.getAttempts);
  const getStamps = useAppStore((s) => s.getStamps);
  const getStampAttempts = useAppStore((s) => s.getStampAttempts);

  // Al cambiar continente, seleccionar el nivel más alto con datos
  const handleContinentChange = useCallback((c: Continent) => {
    setSelectedContinent(c);
    const levelsDesc: GameLevel[] = ['guide', 'backpacker', 'tourist'];
    const hasData = (level: GameLevel): boolean => {
      if (activeTab === 'jugar') {
        const att = getAttempts(level, c);
        return Object.keys(att).some((k) => {
          const ca = att[k];
          return ca && Object.values(ca).some((v) => v && (v.correct > 0 || v.incorrect > 0));
        });
      }
      const sa = getStampAttempts(level, c);
      return Object.keys(sa).length > 0;
    };
    const best = levelsDesc.find(hasData) ?? 'tourist';
    setSelectedLevel(best);
  }, [activeTab, getAttempts, getStampAttempts]);

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
    if (selectedLevel === 'tourist') return ownAttempts;
    return getAttemptsWithInheritance(
      ownAttempts, selectedLevel, selectedContinent,
      getStamps, getCountriesForLevel,
    );
  }, [ownAttempts, selectedLevel, selectedContinent, getStamps, getCountriesForLevel]);

  // --- Datos de Pruebas de sello ---
  const stampAttempts = useMemo(() => {
    return getStampAttempts(selectedLevel, selectedContinent);
  }, [getStampAttempts, selectedLevel, selectedContinent]);

  // Lista de países ordenados según columna activa
  const sortedCountries = useMemo(() => {
    const list = levelCountries
      .map((cca2) => ({ cca2, name: countries.get(cca2)?.name ?? cca2 }));

    list.sort((a, b) => {
      let cmp: number;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (activeTab === 'jugar') {
        const caA = allAttempts[a.cca2];
        const caB = allAttempts[b.cca2];
        const valA = showPercentage
          ? getJugarPercentValue(caA, sortKey)
          : getJugarIndicatorValue(caA, ownAttempts[a.cca2], sortKey);
        const valB = showPercentage
          ? getJugarPercentValue(caB, sortKey)
          : getJugarIndicatorValue(caB, ownAttempts[b.cca2], sortKey);
        cmp = valA - valB;
      } else {
        const st = sortKey as 'A' | 'B';
        const valA = showPercentage
          ? getStampPercentValue(stampAttempts[a.cca2], st)
          : getStampIndicatorValue(stampAttempts[a.cca2], st);
        const valB = showPercentage
          ? getStampPercentValue(stampAttempts[b.cca2], st)
          : getStampIndicatorValue(stampAttempts[b.cca2], st);
        cmp = valA - valB;
      }
      if (cmp === 0) cmp = a.name.localeCompare(b.name);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [levelCountries, countries, sortKey, sortDir, activeTab, showPercentage, allAttempts, ownAttempts, stampAttempts]);

  const handleReset = () => {
    if (window.confirm(t('reset.confirm', {
      level: t(`common:level.${selectedLevel}`),
      continent: t(`common:continent.${selectedContinent}`),
    }))) {
      resetAttempts(selectedLevel, selectedContinent);
    }
  };

  return (
    <div className="stats-overlay" style={style}>
      <div className="stats-view">
        {/* Cabecera */}
        <div className="stats-header">
          <h2 className="stats-header__title">{t('title')}</h2>
          <button className="stats-header__close" onClick={onClose} aria-label={t('aria.close')}>
            {'\u2715'}
          </button>
        </div>

        {/* Pestañas: Jugar | Pruebas de sello */}
        <div className="stats-tabs">
          <button
            className={`stats-tab${activeTab === 'jugar' ? ' stats-tab--active' : ''}`}
            onClick={() => handleTabChange('jugar')}
          >
            {t('tabs.play')}
          </button>
          <button
            className={`stats-tab${activeTab === 'sellos' ? ' stats-tab--active' : ''}`}
            onClick={() => handleTabChange('sellos')}
          >
            {t('tabs.stamps')}
          </button>
        </div>

        {/* Selector de continente */}
        <div className="stats-pills">
          {CONTINENTS.map((c) => (
            <button
              key={c}
              className={`stats-pill${c === selectedContinent ? ' stats-pill--active' : ''}`}
              onClick={() => handleContinentChange(c)}
            >
              {t(`common:continent.${c}`)}
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
              {t(`common:level.${l}`)}
            </button>
          ))}
        </div>

        {/* Toggle ✓ / % */}
        <div className="stats-toggle-row">
          <button
            className="stats-toggle"
            onClick={() => setShowPercentage((v) => !v)}
            aria-label={showPercentage ? t('aria.showIndicators') : t('aria.showPercent')}
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
                  <th className="stats-table__th-name">
                    <button className="stats-table__sort-btn stats-table__sort-btn--left" onClick={() => toggleSort('name')}>
                      {t('table.country')}<SortIndicator active={sortKey === 'name'} dir={sortDir} />
                    </button>
                  </th>
                  {ALL_TYPES.map((qt) => (
                    <th key={qt} className="stats-table__th-type" title={t(`typeLabel.${qt}`)}>
                      <button className="stats-table__sort-btn" onClick={() => toggleSort(qt)}>
                        {TYPE_SHORT[qt]}<SortIndicator active={sortKey === qt} dir={sortDir} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCountries.map(({ cca2, name }) => {
                  const ca = allAttempts[cca2];
                  const ownCa = ownAttempts[cca2];
                  return (
                    <tr key={cca2} onClick={() => onCountryClick?.(cca2)} className={onCountryClick ? 'stats-table__tr--clickable' : ''}>
                      <td className="stats-table__td-name">{name}</td>
                      {ALL_TYPES.map((qt) => {
                        const isInferredType = isDominated(ca, qt) && !isDirectlyDominated(ownCa, qt);
                        return (
                          <td key={qt} className="stats-table__td-type">
                            {showPercentage
                              ? <JugarPercentCell ca={ca} type={qt} />
                              : <JugarCellIndicator ca={ca} type={qt} isInferredType={isInferredType} />
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
                  <th className="stats-table__th-name">
                    <button className="stats-table__sort-btn stats-table__sort-btn--left" onClick={() => toggleSort('name')}>
                      {t('table.country')}<SortIndicator active={sortKey === 'name'} dir={sortDir} />
                    </button>
                  </th>
                  {STAMP_TYPES.map((st) => (
                    <th key={st} className="stats-table__th-type" title={t(`stampLabel.${st}.full`)}>
                      <button className="stats-table__sort-btn" onClick={() => toggleSort(st)}>
                        {t(`stampLabel.${st}.short`)}<SortIndicator active={sortKey === st} dir={sortDir} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCountries.map(({ cca2, name }) => {
                  const sca = stampAttempts[cca2];
                  return (
                    <tr key={cca2} onClick={() => onCountryClick?.(cca2)} className={onCountryClick ? 'stats-table__tr--clickable' : ''}>
                      <td className="stats-table__td-name">{name}</td>
                      {STAMP_TYPES.map((st) => (
                        <td key={st} className="stats-table__td-type">
                          {showPercentage
                            ? <StampPercentCell sca={sca} type={st} />
                            : <StampCellIndicator sca={sca} type={st} />
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
              <span><span className="stats-cell stats-cell--dominated">{'\u2713'}</span> {t('legend.dominated')}</span>
              <span><span className="stats-cell stats-cell--inferred">{'\u2713'}</span> {t('legend.inferred')}</span>
              <span><span className="stats-cell stats-cell--reinforcement">{'\u2717'}</span> {t('legend.reinforcement')}</span>
              <span><span className="stats-cell stats-cell--empty">{'\u2014'}</span> {t('legend.noData')}</span>
            </>
          )}
          {activeTab === 'sellos' && !showPercentage && (
            <>
              <span><span className="stats-cell stats-cell--dominated">{'\u2713'}</span> {t('legend.correct')}</span>
              <span><span className="stats-cell stats-cell--reinforcement">{'\u2717'}</span> {t('legend.incorrect')}</span>
              <span><span className="stats-cell stats-cell--empty">{'\u2014'}</span> {t('legend.noData')}</span>
            </>
          )}
        </div>

        {/* Botón resetear (solo en pestaña Jugar) */}
        {activeTab === 'jugar' && (
          <button className="stats-reset" onClick={handleReset}>
            {t('reset.button')}
          </button>
        )}

        {/* Aviso de permanencia (solo en pestaña Sellos) */}
        {activeTab === 'sellos' && (
          <p className="stats-stamp-notice">
            {t('stampNotice')}
          </p>
        )}
      </div>
    </div>
  );
}
