// Banner con la pregunta del juego (estilo unificado A-F)
import type { GameQuestion } from '../../data/gameQuestions';
import './QuestionBanner.css';

interface QuestionBannerProps {
  prompt: string;
  type: GameQuestion['type'];
}

/** Instrucción según tipo de pregunta (A/B muestran label, C-F no) */
function getLabel(type: GameQuestion['type']): string | null {
  switch (type) {
    case 'A': return 'Localiza';
    case 'B': return 'Localiza la capital';
    default: return null;
  }
}

export function QuestionBanner({ prompt, type }: QuestionBannerProps) {
  const label = getLabel(type);

  return (
    <div className="question-banner" key={prompt}>
      {label && <span className="question-banner__label">{label}</span>}
      <span className="question-banner__text">{prompt}</span>
    </div>
  );
}
