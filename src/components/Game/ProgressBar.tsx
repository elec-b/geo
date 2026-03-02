// Barra de progreso + puntuación + botón salir (fija sobre el tab bar)
import type { GameScore } from '../../hooks/useGameSession';
import './ProgressBar.css';

interface ProgressBarProps {
  progress: number;           // 0-1
  score: GameScore;
  onExit: () => void;
  readyForStamp: boolean;
  isAdventure: boolean;
}

export function ProgressBar({ progress, score, onExit, readyForStamp, isAdventure }: ProgressBarProps) {
  const pct = Math.min(progress * 100, 100);
  const isFull = progress >= 1.0;

  return (
    <div className="progress-bar">
      {/* Banner de estado (readiness o dominio) */}
      {readyForStamp && isAdventure && (
        <div className="progress-bar__banner progress-bar__banner--ready">
          Ya est&aacute;s listo para las pruebas de sello
        </div>
      )}
      {!isAdventure && isFull && (
        <div className="progress-bar__banner progress-bar__banner--mastery">
          Dominas este juego
        </div>
      )}

      {/* Barra de progreso visual */}
      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill${isFull ? ' progress-bar__fill--complete' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="progress-bar__row">
        <div className="progress-bar__stats">
          <span className="progress-bar__correct">&check; {score.correct}</span>
          <span className="progress-bar__incorrect">&times; {score.incorrect}</span>
        </div>
        <button className="progress-bar__exit" onClick={onExit}>
          Salir
        </button>
      </div>
    </div>
  );
}
