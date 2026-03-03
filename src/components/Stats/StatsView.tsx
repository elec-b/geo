// StatsView — modal fullscreen con estadísticas de aprendizaje por país
import { useState, useMemo } from 'react';
import type { CountryData, Continent, GameLevel, QuestionType, LevelDefinition } from '../../data/types';
import type { CountryAttempts } from '../../stores/types';
import { isDominated } from '../../data/learningAlgorithm';
import { useAppStore } from '../../stores/appStore';
import './StatsView.css';

const CONTINENTS: Continent[] = ['África', 'América', 'Asia', 'Europa', 'Oceanía'];
const LEVELS: GameLevel[] = ['turista', 'mochilero', 'guía'];
const ALL_TYPES: QuestionType[] = ['E', 'C', 'D', 'F', 'A', 'B'];

interface StatsViewProps {
  countries: Map<string, CountryData>;
  levels: Map<string, LevelDefinition>;
  onClose: () => void;
}

/** Indicador visual para una celda de la tabla */
function CellIndicator({ ca, type }: { ca: CountryAttempts | undefined; type: QuestionType }) {
  if (!ca) {
    return <span className="stats-cell stats-cell--empty">{'\u2014'}</span>;
  }

  const rec = ca[type];
  if (!rec || (rec.correct === 0 && rec.incorrect === 0)) {
    return <span className="stats-cell stats-cell--empty">{'\u2014'}</span>;
  }

  if (isDominated(ca, type)) {
    return <span className="stats-cell stats-cell--dominated">{'\u2713'}</span>;
  }

  if (rec.streak < 0) {
    return <span className="stats-cell stats-cell--reinforcement">{'\u25BC'}</span>;
  }

  return <span className="stats-cell stats-cell--progress">{'\u25CF'}</span>;
}

export function StatsView({ countries, levels, onClose }: StatsViewProps) {
  const [selectedContinent, setSelectedContinent] = useState<Continent>('Europa');
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>('turista');

  const getAttempts = useAppStore((s) => s.getAttempts);
  const resetAttempts = useAppStore((s) => s.resetAttempts);

  // Países del nivel × continente actual
  const levelDef = levels.get(`${selectedLevel}-${selectedContinent}`);
  const levelCountries = levelDef?.countries ?? [];

  // Intentos del perfil activo
  const allAttempts = getAttempts(selectedLevel, selectedContinent);

  // Lista de países ordenados por nombre
  const sortedCountries = useMemo(() => {
    return levelCountries
      .map((cca2) => ({ cca2, name: countries.get(cca2)?.name ?? cca2 }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [levelCountries, countries]);

  // Totales agregados
  const totals = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    for (const cca2 of levelCountries) {
      const ca = allAttempts[cca2];
      if (!ca) continue;
      for (const t of ALL_TYPES) {
        const rec = ca[t];
        if (!rec) continue;
        correct += rec.correct;
        incorrect += rec.incorrect;
      }
    }
    return { correct, incorrect };
  }, [allAttempts, levelCountries]);

  const handleReset = () => {
    if (window.confirm(`¿Resetear estadísticas de ${selectedLevel} - ${selectedContinent}?`)) {
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

        {/* Tabla */}
        <div className="stats-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th className="stats-table__th-name">País</th>
                {ALL_TYPES.map((t) => (
                  <th key={t} className="stats-table__th-type">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCountries.map(({ cca2, name }) => {
                const ca = allAttempts[cca2];
                return (
                  <tr key={cca2}>
                    <td className="stats-table__td-name">{name}</td>
                    {ALL_TYPES.map((t) => (
                      <td key={t} className="stats-table__td-type">
                        <CellIndicator ca={ca} type={t} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="stats-totals">
          <span className="stats-totals__correct">{'\u2713'} {totals.correct} aciertos</span>
          <span className="stats-totals__incorrect">{'\u2717'} {totals.incorrect} fallos</span>
        </div>

        {/* Leyenda */}
        <div className="stats-legend">
          <span><span className="stats-cell stats-cell--dominated">{'\u2713'}</span> Dominado</span>
          <span><span className="stats-cell stats-cell--progress">{'\u25CF'}</span> En progreso</span>
          <span><span className="stats-cell stats-cell--reinforcement">{'\u25BC'}</span> Refuerzo</span>
          <span><span className="stats-cell stats-cell--empty">{'\u2014'}</span> Sin datos</span>
        </div>

        {/* Botón resetear */}
        <button className="stats-reset" onClick={handleReset}>
          Resetear estadísticas
        </button>
      </div>
    </div>
  );
}
