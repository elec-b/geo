// Banner con la pregunta del juego (estilo unificado A-F)
import { useTranslation } from 'react-i18next';
import type { GameQuestion } from '../../data/gameQuestions';
import './QuestionBanner.css';

interface QuestionBannerProps {
  prompt: string;
  type: GameQuestion['type'];
}

export function QuestionBanner({ prompt, type }: QuestionBannerProps) {
  const { t } = useTranslation('game');

  /** Instrucción según tipo de pregunta (A/B muestran label, C-F no) */
  const label = type === 'A' ? t('question.locate')
    : type === 'B' ? t('question.locateCapital')
    : null;

  return (
    <div className="question-banner" key={prompt}>
      {label && <span className="question-banner__label">{label}</span>}
      <span className="question-banner__text">{prompt}</span>
    </div>
  );
}
