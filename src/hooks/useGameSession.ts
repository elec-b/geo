// Hook de sesión de juego — gestiona el game loop de una partida
import { useState, useCallback, useRef } from 'react';
import { generateQuestions, type GameQuestion } from '../data/gameQuestions';
import type { CountryData, Continent, GameLevel } from '../data/types';
import type { LevelDefinition } from '../data/types';

export type FeedbackState = 'idle' | 'correct' | 'incorrect';

export interface GameScore {
  correct: number;
  incorrect: number;
  total: number;
}

export interface GameSessionState {
  currentQuestion: GameQuestion | null;
  score: GameScore;
  feedbackState: FeedbackState;
  /** cca2 del país correcto (para resaltar en dorado tras respuesta) */
  correctCca2: string | null;
  isActive: boolean;
  /** Nivel y continente actuales */
  level: GameLevel | null;
  continent: Continent | null;
}

interface GameSessionActions {
  start: (level: GameLevel, continent: Continent) => void;
  submitAnswer: (cca2: string) => 'correct' | 'incorrect' | 'ignored';
  nextQuestion: () => void;
  end: () => void;
}

const INITIAL_SCORE: GameScore = { correct: 0, incorrect: 0, total: 0 };

/**
 * Hook que gestiona el estado efímero de una sesión de juego.
 * Sin persistencia — el score se pierde al salir.
 */
export function useGameSession(
  levels: Map<string, LevelDefinition>,
  countries: Map<string, CountryData>,
): GameSessionState & GameSessionActions {
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [score, setScore] = useState<GameScore>(INITIAL_SCORE);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle');
  const [correctCca2, setCorrectCca2] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [level, setLevel] = useState<GameLevel | null>(null);
  const [continent, setContinent] = useState<Continent | null>(null);

  // Cola de preguntas pendientes
  const questionsRef = useRef<GameQuestion[]>([]);
  // Referencia al nivel actual para regenerar preguntas
  const levelKeyRef = useRef<string>('');

  const start = useCallback(
    (newLevel: GameLevel, newContinent: Continent) => {
      const key = `${newLevel}-${newContinent}`;
      const def = levels.get(key);
      if (!def) return;

      levelKeyRef.current = key;
      const questions = generateQuestions(def.countries, countries);
      questionsRef.current = questions.slice(1);

      setLevel(newLevel);
      setContinent(newContinent);
      setScore(INITIAL_SCORE);
      setFeedbackState('idle');
      setCorrectCca2(null);
      setCurrentQuestion(questions[0]);
      setIsActive(true);
    },
    [levels, countries],
  );

  const submitAnswer = useCallback(
    (cca2: string): 'correct' | 'incorrect' | 'ignored' => {
      if (feedbackState !== 'idle' || !currentQuestion) return 'ignored';

      const isCorrect = cca2 === currentQuestion.targetCca2;
      setCorrectCca2(currentQuestion.targetCca2);

      if (isCorrect) {
        setFeedbackState('correct');
        setScore((prev) => ({
          correct: prev.correct + 1,
          incorrect: prev.incorrect,
          total: prev.total + 1,
        }));
        return 'correct';
      } else {
        setFeedbackState('incorrect');
        setScore((prev) => ({
          correct: prev.correct,
          incorrect: prev.incorrect + 1,
          total: prev.total + 1,
        }));
        return 'incorrect';
      }
    },
    [feedbackState, currentQuestion],
  );

  const nextQuestion = useCallback(() => {
    // Si no quedan preguntas, regenerar el ciclo
    if (questionsRef.current.length === 0) {
      const def = levels.get(levelKeyRef.current);
      if (def) {
        const lastCca2 = currentQuestion?.targetCca2;
        questionsRef.current = generateQuestions(def.countries, countries, lastCca2);
      }
    }

    const next = questionsRef.current.shift() ?? null;
    setCurrentQuestion(next);
    setFeedbackState('idle');
    setCorrectCca2(null);
  }, [levels, countries, currentQuestion]);

  const end = useCallback(() => {
    setIsActive(false);
    setCurrentQuestion(null);
    setFeedbackState('idle');
    setCorrectCca2(null);
    setScore(INITIAL_SCORE);
    setLevel(null);
    setContinent(null);
    questionsRef.current = [];
  }, []);

  return {
    currentQuestion,
    score,
    feedbackState,
    correctCca2,
    isActive,
    level,
    continent,
    start,
    submitAnswer,
    nextQuestion,
    end,
  };
}
