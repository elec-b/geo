// Barra de progreso + puntuación + botón salir (fija sobre el tab bar)
import type { GameScore } from '../../hooks/useGameSession';
import './ProgressBar.css';

interface ProgressBarProps {
  progressCurrent: number;
  progressTotal: number;
  score: GameScore;
  onExit: () => void;
  readyForStamp: boolean;
  isAdventure: boolean;
}

export function ProgressBar({ progressCurrent, progressTotal, score, onExit, readyForStamp, isAdventure }: ProgressBarProps) {
  const pct = progressTotal > 0 ? Math.min((progressCurrent / progressTotal) * 100, 100) : 0;
  const isFull = progressTotal > 0 && progressCurrent >= progressTotal;

  const label = isAdventure
    ? `${progressCurrent} de ${progressTotal} listos para sello`
    : `${progressCurrent} de ${progressTotal} dominados`;

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

      {/* Etiqueta de progreso */}
      <div className="progress-bar__label">{label}</div>

      {/* Barra de progreso visual */}
      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill${isFull ? ' progress-bar__fill--complete' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="progress-bar__row">
        <div className="progress-bar__stats">
          <span className="progress-bar__correct">{'\u2713'} {score.correct}</span>
          <span className="progress-bar__incorrect">{'\u2717'} {score.incorrect}</span>
        </div>
        <button className="progress-bar__exit" onClick={onExit}>
          Salir
        </button>
      </div>
    </div>
  );
}
