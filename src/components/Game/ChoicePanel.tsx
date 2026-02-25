// Panel de opciones múltiples para tipos C-F
import './ChoicePanel.css';

interface ChoicePanelProps {
  options: string[];
  onSelect: (answer: string) => void;
  disabled: boolean;
  correctAnswer?: string;
  selectedAnswer?: string;
}

export function ChoicePanel({
  options,
  onSelect,
  disabled,
  correctAnswer,
  selectedAnswer,
}: ChoicePanelProps) {
  return (
    <div className="choice-panel">
      {options.map((option) => {
        let modifier = '';
        if (selectedAnswer) {
          if (option === correctAnswer) modifier = ' choice-panel__btn--correct';
          else if (option === selectedAnswer) modifier = ' choice-panel__btn--incorrect';
        }

        return (
          <button
            key={option}
            className={`choice-panel__btn${modifier}`}
            onClick={() => onSelect(option)}
            disabled={disabled}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
