// Overlay de feedback visual tras respuesta (verde/rojo)
import { useEffect, useRef } from 'react';
import type { FeedbackState } from '../../hooks/useGameSession';
import './GameFeedback.css';

interface GameFeedbackProps {
  state: FeedbackState;
  onAnimationEnd: () => void;
  /** Nombre del país/capital que el usuario tocó (error) */
  incorrectLabel?: string;
  /** Nombre del país/capital correcto (error) */
  correctLabel?: string;
  /** Si true, no programa timer — el componente padre controla la secuencia */
  skipTimer?: boolean;
  /** Si true, las etiquetas van sobre el globo → overlay reducido (solo icono) */
  geoFeedback?: boolean;
}

export function GameFeedback({
  state, onAnimationEnd, incorrectLabel, correctLabel, skipTimer, geoFeedback,
}: GameFeedbackProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state === 'idle' || skipTimer) return;

    // Acierto: avance rápido (1.2s), error: más lento para leer los labels (2.5s)
    const duration = state === 'correct' ? 1200 : 2500;
    timerRef.current = setTimeout(onAnimationEnd, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, onAnimationEnd, skipTimer]);

  if (state === 'idle') return null;

  // Cuando hay feedback geográfico en error, no mostrar labels en el overlay (van sobre el globo)
  const showDetails = state === 'incorrect' && !geoFeedback && (incorrectLabel || correctLabel);

  return (
    <div
      className={`game-feedback game-feedback--${state}${geoFeedback ? ' game-feedback--geo' : ''}`}
      aria-live="assertive"
    >
      {showDetails && (
        <div className="game-feedback__details">
          {incorrectLabel && (
            <span className="game-feedback__wrong">{incorrectLabel}</span>
          )}
          {correctLabel && (
            <span className="game-feedback__right">{correctLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
