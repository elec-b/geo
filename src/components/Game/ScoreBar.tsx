// Barra de puntuación + botón salir (fija sobre el tab bar)
import type { GameScore } from '../../hooks/useGameSession';
import './ScoreBar.css';

interface ScoreBarProps {
  score: GameScore;
  onExit: () => void;
}

export function ScoreBar({ score, onExit }: ScoreBarProps) {
  return (
    <div className="score-bar">
      <div className="score-bar__stats">
        <span className="score-bar__correct">✓ {score.correct}</span>
        <span className="score-bar__incorrect">✗ {score.incorrect}</span>
        <span className="score-bar__separator">|</span>
        <span className="score-bar__total">Pregunta {score.total + 1}</span>
      </div>
      <button className="score-bar__exit" onClick={onExit}>
        Salir
      </button>
    </div>
  );
}
