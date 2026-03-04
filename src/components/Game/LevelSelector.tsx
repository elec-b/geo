// Selector de continente + nivel para iniciar una partida
import { useState, useCallback } from 'react';
import type { Continent, GameLevel, LevelDefinition } from '../../data/types';
import type { QuestionTypeFilter } from '../../data/gameQuestions';
import './LevelSelector.css';

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
}

export function LevelSelector({ levels, onStart, onContinentSelect }: LevelSelectorProps) {
  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>('turista');
  const [selectedType, setSelectedType] = useState<QuestionTypeFilter>('mixed');

  const handleContinentSelect = useCallback(
    (continent: Continent) => {
      setSelectedContinent(continent);
      onContinentSelect(continent);
    },
    [onContinentSelect],
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
            return (
              <button
                key={id}
                className={`level-selector__level-card ${selectedLevel === id ? 'level-selector__level-card--active' : ''}`}
                onClick={() => setSelectedLevel(id)}
              >
                <span className="level-selector__level-emoji">{emoji}</span>
                <span className="level-selector__level-name">{label}</span>
                <span className="level-selector__level-count">
                  {count != null ? `${count} ${count === 1 ? 'país' : 'países'}` : '—'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pills de tipo de juego (orden pedagógico) */}
        <h2 className="level-selector__title level-selector__title--level">Tipo de juego</h2>
        <div className="level-selector__types">
          {QUESTION_TYPES.map(({ id, label, badge }) => (
            <button
              key={id}
              className={`level-selector__type-pill ${selectedType === id ? 'level-selector__type-pill--active' : ''}`}
              onClick={() => setSelectedType(id)}
            >
              {label}{badge ? ` ${badge}` : ''}
            </button>
          ))}
        </div>

        {/* Botón empezar */}
        <button
          className={`level-selector__start ${!selectedContinent ? 'level-selector__start--disabled' : ''}`}
          onClick={handleStart}
        >
          Empezar
        </button>
      </div>
    </div>
  );
}
