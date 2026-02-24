// Overlay de feedback visual tras respuesta (verde/rojo)
import { useEffect, useRef } from 'react';
import type { FeedbackState } from '../../hooks/useGameSession';
import './GameFeedback.css';

interface GameFeedbackProps {
  state: FeedbackState;
  onAnimationEnd: () => void;
}

export function GameFeedback({ state, onAnimationEnd }: GameFeedbackProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state === 'idle') return;

    // Acierto: avance rápido (1.2s), error: más lento para ver el país correcto (2s)
    const duration = state === 'correct' ? 1200 : 2000;
    timerRef.current = setTimeout(onAnimationEnd, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, onAnimationEnd]);

  if (state === 'idle') return null;

  return (
    <div
      className={`game-feedback game-feedback--${state}`}
      aria-live="assertive"
    >
      <span className="game-feedback__icon">
        {state === 'correct' ? '✓' : '✗'}
      </span>
    </div>
  );
}
