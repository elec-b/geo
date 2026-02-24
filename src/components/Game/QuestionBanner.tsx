// Banner con el nombre del país a localizar
import './QuestionBanner.css';

interface QuestionBannerProps {
  prompt: string;
}

export function QuestionBanner({ prompt }: QuestionBannerProps) {
  return (
    <div className="question-banner" key={prompt}>
      <span className="question-banner__label">Localiza</span>
      <span className="question-banner__country">{prompt}</span>
    </div>
  );
}
