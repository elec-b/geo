// Hook de sesión de juego — gestiona el game loop de una partida
// Paradigma: selección pregunta-a-pregunta (no cola pre-generada)
import { useState, useCallback, useRef } from 'react';
import { generateSingleQuestion, generateQuestionsByType, type GameQuestion, type QuestionTypeFilter } from '../data/gameQuestions';
import { selectNextQuestion } from '../data/learningAlgorithm';
import type { CountryData, CapitalCoords, Continent, GameLevel, QuestionType } from '../data/types';
import type { LevelDefinition } from '../data/types';
import type { CountryAttempts } from '../stores/types';

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
  /** Función para obtener los intentos actualizados del store */
  getAttempts?: () => Record<string, CountryAttempts>;
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

  // Historial de países recientes para anti-repetición
  const recentCountriesRef = useRef<string[]>([]);
  // Historial de tipos recientes para distribución uniforme de C/D/F
  const recentTypesRef = useRef<QuestionType[]>([]);
  // Referencia al nivel actual para regenerar preguntas
  const levelKeyRef = useRef<string>('');
  // Tipo de pregunta seleccionado
  const questionTypeRef = useRef<QuestionTypeFilter>('mixed');
  // Cola de preguntas para modo tipo concreto (fallback)
  const questionsRef = useRef<GameQuestion[]>([]);

  // Refs para evitar invalidar memoización
  const onAttemptRef = useRef(options?.onAttempt);
  onAttemptRef.current = options?.onAttempt;
  const getAttemptsRef = useRef(options?.getAttempts);
  getAttemptsRef.current = options?.getAttempts;

  /** Configura correctCca2 según el tipo de pregunta */
  const applyHighlight = useCallback((question: GameQuestion) => {
    // E/F: resaltar el país ANTES de responder (el usuario debe identificarlo)
    if (question.type === 'E' || question.type === 'F') {
      setCorrectCca2(question.targetCca2);
    } else {
      setCorrectCca2(null);
    }
  }, []);

  /** Solicita la siguiente pregunta al algoritmo y la genera */
  const requestNextQuestion = useCallback((): GameQuestion | null => {
    const def = levels.get(levelKeyRef.current);
    if (!def) return null;

    const qt = questionTypeRef.current;

    if (qt !== 'mixed') {
      // Modo tipo concreto: usar cola pre-generada (regenerar si vacía)
      if (questionsRef.current.length === 0) {
        const lastCca2 = recentCountriesRef.current[recentCountriesRef.current.length - 1];
        questionsRef.current = generateQuestionsByType(qt, def.countries, countries, capitals, lastCca2);
      }
      const question = questionsRef.current.shift() ?? null;
      if (question) {
        recentCountriesRef.current.push(question.targetCca2);
      }
      return question;
    }

    // Modo aventura: selección pregunta-a-pregunta
    const attempts = getAttemptsRef.current?.() ?? {};
    const selection = selectNextQuestion(
      attempts, def.countries, recentCountriesRef.current,
      undefined, recentTypesRef.current,
    );
    if (!selection) return null;

    let question = generateSingleQuestion(selection, def.countries, countries, capitals);

    // Fallback: si no se pudo generar (ej: tipo B sin capital), intentar tipo A
    if (!question) {
      question = generateSingleQuestion(
        { cca2: selection.cca2, questionType: 'A' },
        def.countries, countries, capitals,
      );
    }

    if (question) {
      recentCountriesRef.current.push(question.targetCca2);
      // Anti-repetición de tipo: mantener los últimos 2 (buffer para 3 tipos C/D/F)
      recentTypesRef.current.push(question.type as QuestionType);
      if (recentTypesRef.current.length > 2) {
        recentTypesRef.current = recentTypesRef.current.slice(-2);
      }
    }

    return question;
  }, [levels, countries, capitals]);

  const start = useCallback(
    (newLevel: GameLevel, newContinent: Continent, questionType: QuestionTypeFilter = 'mixed') => {
      const key = `${newLevel}-${newContinent}`;
      const def = levels.get(key);
      if (!def) return;

      levelKeyRef.current = key;
      questionTypeRef.current = questionType;
      recentCountriesRef.current = [];
      recentTypesRef.current = [];
      questionsRef.current = [];

      setLevel(newLevel);
      setContinent(newContinent);
      setScore(INITIAL_SCORE);
      setFeedbackState('idle');
      setIsActive(true);

      // Generar primera pregunta
      // Para tipo concreto, pre-generar la cola
      if (questionType !== 'mixed') {
        questionsRef.current = generateQuestionsByType(questionType, def.countries, countries, capitals);
      }

      const question = requestNextQuestion();
      setCurrentQuestion(question);
      if (question) {
        applyHighlight(question);
      }
    },
    [levels, countries, capitals, requestNextQuestion, applyHighlight],
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
    const next = requestNextQuestion();
    setCurrentQuestion(next);
    setFeedbackState('idle');
    setLastAnswer(null);
    if (next) {
      applyHighlight(next);
    } else {
      setCorrectCca2(null);
    }
  }, [requestNextQuestion, applyHighlight]);

  const end = useCallback(() => {
    setIsActive(false);
    setCurrentQuestion(null);
    setFeedbackState('idle');
    setCorrectCca2(null);
    setLastAnswer(null);
    setScore(INITIAL_SCORE);
    setLevel(null);
    setContinent(null);
    recentCountriesRef.current = [];
    recentTypesRef.current = [];
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
