// Barra de progreso + puntuación (fija sobre el tab bar)
import type { GameScore, StampTestType } from '../../hooks/useGameSession';
import './ProgressBar.css';

interface ProgressBarProps {
  progressCurrent: number;
  progressTotal: number;
  score: GameScore;
  isAdventure: boolean;
  /** true si estamos en una prueba de sello */
  isStampTest?: boolean;
  /** Tipo de sello en prueba */
  stampTestType?: StampTestType | null;
}

export function ProgressBar({
  progressCurrent, progressTotal, score,
  isAdventure, isStampTest, stampTestType,
}: ProgressBarProps) {
  const pct = progressTotal > 0 ? Math.min((progressCurrent / progressTotal) * 100, 100) : 0;
  const isFull = progressTotal > 0 && progressCurrent >= progressTotal;

  const label = isStampTest
    ? `Prueba de sello: ${progressCurrent} de ${progressTotal}`
    : isAdventure
      ? `${Number.isInteger(progressCurrent) ? progressCurrent : progressCurrent.toFixed(1)}% completado`
      : `${progressCurrent} de ${progressTotal} dominados`;

  return (
    <div className="progress-bar">
      {/* Banner informativo de prueba de sello activa */}
      {isStampTest && (
        <div className="progress-bar__banner progress-bar__banner--stamp-test">
          Prueba de sello: {stampTestType === 'countries' ? 'Países' : 'Capitales'}
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
      </div>
    </div>
  );
}
