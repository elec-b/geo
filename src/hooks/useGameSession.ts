// Hook de sesión de juego — gestiona el game loop de una partida
import { useState, useCallback, useRef } from 'react';
import { generateMixedQuestions, generateQuestionsByType, type GameQuestion, type QuestionTypeFilter } from '../data/gameQuestions';
import type { CountryData, CapitalCoords, Continent, GameLevel, QuestionType } from '../data/types';
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
  /** cca2 del país correcto (para resaltar en dorado) */
  correctCca2: string | null;
  /** Última respuesta incorrecta (cca2 para A/B, texto para C-F). null si acertó o idle. */
  lastAnswer: string | null;
  isActive: boolean;
  /** Nivel y continente actuales */
  level: GameLevel | null;
  continent: Continent | null;
}

interface GameSessionActions {
  start: (level: GameLevel, continent: Continent, questionType?: QuestionTypeFilter) => void;
  submitAnswer: (answer: string) => 'correct' | 'incorrect' | 'ignored';
  nextQuestion: () => void;
  end: () => void;
}

const INITIAL_SCORE: GameScore = { correct: 0, incorrect: 0, total: 0 };

export interface GameSessionOptions {
  onAttempt?: (cca2: string, type: QuestionType, correct: boolean) => void;
  typeWeights?: Record<QuestionType, number> | null;
}

/**
 * Hook que gestiona el estado efímero de una sesión de juego.
 * El score de sesión se pierde al salir; los intentos se persisten via onAttempt.
 */
export function useGameSession(
  levels: Map<string, LevelDefinition>,
  countries: Map<string, CountryData>,
  capitals: Map<string, CapitalCoords>,
  options?: GameSessionOptions,
): GameSessionState & GameSessionActions {
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [score, setScore] = useState<GameScore>(INITIAL_SCORE);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle');
  const [correctCca2, setCorrectCca2] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [level, setLevel] = useState<GameLevel | null>(null);
  const [continent, setContinent] = useState<Continent | null>(null);

  // Cola de preguntas pendientes
  const questionsRef = useRef<GameQuestion[]>([]);
  // Referencia al nivel actual para regenerar preguntas
  const levelKeyRef = useRef<string>('');
  // Tipo de pregunta seleccionado (para regenerar ciclos)
  const questionTypeRef = useRef<QuestionTypeFilter>('mixed');

  // Refs para evitar invalidar memoización (patrón estándar en React)
  const onAttemptRef = useRef(options?.onAttempt);
  onAttemptRef.current = options?.onAttempt;
  const typeWeightsRef = useRef(options?.typeWeights ?? null);
  typeWeightsRef.current = options?.typeWeights ?? null;

  /** Configura correctCca2 según el tipo de pregunta */
  const applyHighlight = useCallback((question: GameQuestion) => {
    // E/F: resaltar el país ANTES de responder (el usuario debe identificarlo)
    if (question.type === 'E' || question.type === 'F') {
      setCorrectCca2(question.targetCca2);
    } else {
      setCorrectCca2(null);
    }
  }, []);

  /** Genera preguntas según el tipo seleccionado */
  const generateQuestions = useCallback(
    (levelCountries: string[], lastCca2?: string) => {
      const qt = questionTypeRef.current;
      if (qt === 'mixed') {
        return generateMixedQuestions(levelCountries, countries, capitals, lastCca2, typeWeightsRef.current);
      }
      return generateQuestionsByType(qt, levelCountries, countries, capitals, lastCca2);
    },
    [countries, capitals],
  );

  const start = useCallback(
    (newLevel: GameLevel, newContinent: Continent, questionType: QuestionTypeFilter = 'mixed') => {
      const key = `${newLevel}-${newContinent}`;
      const def = levels.get(key);
      if (!def) return;

      levelKeyRef.current = key;
      questionTypeRef.current = questionType;
      const questions = generateQuestions(def.countries);
      questionsRef.current = questions.slice(1);

      setLevel(newLevel);
      setContinent(newContinent);
      setScore(INITIAL_SCORE);
      setFeedbackState('idle');
      setCurrentQuestion(questions[0]);
      setIsActive(true);
      applyHighlight(questions[0]);
    },
    [levels, generateQuestions, applyHighlight],
  );

  const submitAnswer = useCallback(
    (answer: string): 'correct' | 'incorrect' | 'ignored' => {
      if (feedbackState !== 'idle' || !currentQuestion) return 'ignored';

      // A/B: comparar cca2; C-F: comparar texto de la opción
      const isCorrect =
        currentQuestion.type === 'A' || currentQuestion.type === 'B'
          ? answer === currentQuestion.targetCca2
          : answer === (currentQuestion as { correctAnswer: string }).correctAnswer;

      // Registrar intento en el store (via callback)
      onAttemptRef.current?.(currentQuestion.targetCca2, currentQuestion.type as QuestionType, isCorrect);

      // Tras responder, siempre mostrar el país correcto en dorado
      setCorrectCca2(currentQuestion.targetCca2);

      if (isCorrect) {
        setFeedbackState('correct');
        setLastAnswer(null);
        setScore((prev) => ({
          correct: prev.correct + 1,
          incorrect: prev.incorrect,
          total: prev.total + 1,
        }));
        return 'correct';
      } else {
        setFeedbackState('incorrect');
        setLastAnswer(answer);
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
        questionsRef.current = generateQuestions(def.countries, lastCca2);
      }
    }

    const next = questionsRef.current.shift() ?? null;
    setCurrentQuestion(next);
    setFeedbackState('idle');
    setLastAnswer(null);
    if (next) {
      applyHighlight(next);
    } else {
      setCorrectCca2(null);
    }
  }, [levels, generateQuestions, currentQuestion, applyHighlight]);

  const end = useCallback(() => {
    setIsActive(false);
    setCurrentQuestion(null);
    setFeedbackState('idle');
    setCorrectCca2(null);
    setLastAnswer(null);
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
    lastAnswer,
    isActive,
    level,
    continent,
    start,
    submitAnswer,
    nextQuestion,
    end,
  };
}
