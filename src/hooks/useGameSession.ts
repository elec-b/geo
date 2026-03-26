// Hook de sesión de juego — gestiona el game loop de una partida
// Paradigma: selección pregunta-a-pregunta (no cola pre-generada)
import { useState, useCallback, useRef } from 'react';
import type { TFunction } from 'i18next';
import { generateSingleQuestion, generateQuestionsByType, type GameQuestion, type QuestionTypeFilter } from '../data/gameQuestions';
import { selectNextQuestion, isDominated } from '../data/learningAlgorithm';
import type { CountryData, CapitalCoords, Continent, GameLevel, QuestionType } from '../data/types';
import type { LevelDefinition } from '../data/types';
import type { CountryAttempts } from '../stores/types';
import { hapticSuccess, hapticError } from '../utils/haptics';

export type FeedbackState = 'idle' | 'correct' | 'incorrect';

export interface GameScore {
  correct: number;
  incorrect: number;
  total: number;
}

/** Resultado de una prueba de sello */
export type StampTestResult = 'in_progress' | 'passed' | 'failed' | null;

/** Tipo de sello para la prueba */
export type StampTestType = 'countries' | 'capitals';

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
  /** Estado de la prueba de sello (null si no es prueba de sello) */
  stampTestResult: StampTestResult;
  /** Progreso de la prueba de sello: cuántos países van de cuántos */
  stampTestProgress: { current: number; total: number } | null;
  /** Tipo de sello en prueba (null si no es prueba) */
  stampTestType: StampTestType | null;
  /** true cuando el pool de preguntas activas se ha agotado */
  poolExhausted: boolean;
}

interface GameSessionActions {
  start: (level: GameLevel, continent: Continent, questionType?: QuestionTypeFilter) => void;
  /** Inicia una prueba de sello (tipo A para países, tipo B para capitales) */
  startStampTest: (level: GameLevel, continent: Continent, stampType: StampTestType) => void;
  submitAnswer: (answer: string) => 'correct' | 'incorrect' | 'ignored';
  nextQuestion: () => void;
  end: () => void;
}

const INITIAL_SCORE: GameScore = { correct: 0, incorrect: 0, total: 0 };

export interface GameSessionOptions {
  onAttempt?: (cca2: string, type: QuestionType, correct: boolean) => void;
  /** Callback para intentos en pruebas de sello (registro independiente de Jugar) */
  onStampAttempt?: (cca2: string, type: QuestionType, correct: boolean) => void;
  /** Función para obtener los intentos actualizados del store */
  getAttempts?: () => Record<string, CountryAttempts>;
  /** Función para obtener los países heredados: mapa de país → tipos sin datos propios */
  getInheritedCountries?: () => Map<string, Set<QuestionType>>;
  /** Función de traducción i18next (para prompts de preguntas) */
  t?: TFunction;
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
  const [stampTestResult, setStampTestResult] = useState<StampTestResult>(null);
  const [stampTestProgress, setStampTestProgress] = useState<{ current: number; total: number } | null>(null);
  const [stampTestType, setStampTestType] = useState<StampTestType | null>(null);
  const [poolExhausted, setPoolExhausted] = useState(false);

  // Control de prueba de sello
  const isStampTestRef = useRef(false);
  const stampTestTotalRef = useRef(0);
  const stampTestErrorsRef = useRef(0);

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
  const onStampAttemptRef = useRef(options?.onStampAttempt);
  onStampAttemptRef.current = options?.onStampAttempt;
  const getAttemptsRef = useRef(options?.getAttempts);
  getAttemptsRef.current = options?.getAttempts;
  const getInheritedCountriesRef = useRef(options?.getInheritedCountries);
  getInheritedCountriesRef.current = options?.getInheritedCountries;
  const tRef = useRef(options?.t);
  tRef.current = options?.t;

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
        const attempts = getAttemptsRef.current?.() ?? {};
        const pending = def.countries.filter((cca2) => !isDominated(attempts[cca2], qt as QuestionType));
        if (pending.length === 0) return null; // pool agotado
        const lastCca2 = recentCountriesRef.current[recentCountriesRef.current.length - 1];
        questionsRef.current = generateQuestionsByType(qt, pending, countries, capitals, lastCca2, def.countries, tRef.current);
      }
      const question = questionsRef.current.shift() ?? null;
      if (question) {
        recentCountriesRef.current.push(question.targetCca2);
      }
      return question;
    }

    // Modo aventura: selección pregunta-a-pregunta
    const attempts = getAttemptsRef.current?.() ?? {};
    const inheritedSet = getInheritedCountriesRef.current?.();
    const selection = selectNextQuestion(
      attempts, def.countries, recentCountriesRef.current,
      undefined, recentTypesRef.current, inheritedSet,
    );
    if (!selection) return null;

    let question = generateSingleQuestion(selection, def.countries, countries, capitals, tRef.current);

    // Fallback: si no se pudo generar (ej: tipo B sin capital), intentar tipo A
    if (!question) {
      question = generateSingleQuestion(
        { cca2: selection.cca2, questionType: 'A' },
        def.countries, countries, capitals, tRef.current,
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
      isStampTestRef.current = false;
      stampTestTotalRef.current = 0;
      stampTestErrorsRef.current = 0;

      setLevel(newLevel);
      setContinent(newContinent);
      setScore(INITIAL_SCORE);
      setFeedbackState('idle');
      setIsActive(true);
      setStampTestResult(null);
      setStampTestProgress(null);
      setStampTestType(null);
      setPoolExhausted(false);

      // Generar primera pregunta
      // Para tipo concreto, pre-generar la cola (solo países no dominados)
      if (questionType !== 'mixed') {
        const attempts = getAttemptsRef.current?.() ?? {};
        const pending = def.countries.filter((cca2) => !isDominated(attempts[cca2], questionType as QuestionType));
        if (pending.length > 0) {
          questionsRef.current = generateQuestionsByType(questionType, pending, countries, capitals, undefined, def.countries, tRef.current);
        }
      }

      const question = requestNextQuestion();
      setCurrentQuestion(question);
      if (question) {
        applyHighlight(question);
      } else {
        setPoolExhausted(true);
      }
    },
    [levels, countries, capitals, requestNextQuestion, applyHighlight],
  );

  const startStampTest = useCallback(
    (newLevel: GameLevel, newContinent: Continent, stampType: StampTestType) => {
      const key = `${newLevel}-${newContinent}`;
      const def = levels.get(key);
      if (!def) return;

      const gameType: QuestionTypeFilter = stampType === 'countries' ? 'A' : 'B';

      levelKeyRef.current = key;
      questionTypeRef.current = gameType;
      recentCountriesRef.current = [];
      recentTypesRef.current = [];
      isStampTestRef.current = true;
      stampTestTotalRef.current = def.countries.length;
      stampTestErrorsRef.current = 0;

      setLevel(newLevel);
      setContinent(newContinent);
      setScore(INITIAL_SCORE);
      setFeedbackState('idle');
      setIsActive(true);
      setStampTestResult('in_progress');
      setStampTestType(stampType);
      setStampTestProgress({ current: 0, total: def.countries.length });

      // Pre-generar cola completa con todos los países (sin repeticiones)
      questionsRef.current = generateQuestionsByType(gameType, def.countries, countries, capitals, undefined, undefined, tRef.current);

      const question = questionsRef.current.shift() ?? null;
      setCurrentQuestion(question);
      if (question) {
        recentCountriesRef.current.push(question.targetCca2);
        applyHighlight(question);
      }
    },
    [levels, countries, capitals, applyHighlight],
  );

  const submitAnswer = useCallback(
    (answer: string): 'correct' | 'incorrect' | 'ignored' => {
      if (feedbackState !== 'idle' || !currentQuestion) return 'ignored';

      // A/B: comparar cca2; C-F: comparar texto de la opción
      const isCorrect =
        currentQuestion.type === 'A' || currentQuestion.type === 'B'
          ? answer === currentQuestion.targetCca2
          : answer === (currentQuestion as { correctAnswer: string }).correctAnswer;

      // Registrar intento en el store (callback distinto según contexto)
      if (isStampTestRef.current) {
        onStampAttemptRef.current?.(currentQuestion.targetCca2, currentQuestion.type as QuestionType, isCorrect);
      } else {
        onAttemptRef.current?.(currentQuestion.targetCca2, currentQuestion.type as QuestionType, isCorrect);
      }

      // Tras responder, siempre mostrar el país correcto en dorado
      setCorrectCca2(currentQuestion.targetCca2);

      // Actualizar progreso de prueba de sello (sincronizado con score
      // para que barra y contadores se muevan a la vez)
      if (isStampTestRef.current) {
        setStampTestProgress((prev) =>
          prev ? { current: prev.current + 1, total: prev.total } : null,
        );
      }

      if (isCorrect) {
        hapticSuccess();
        setFeedbackState('correct');
        setLastAnswer(null);
        setScore((prev) => ({
          correct: prev.correct + 1,
          incorrect: prev.incorrect,
          total: prev.total + 1,
        }));
        return 'correct';
      } else {
        hapticError();
        setFeedbackState('incorrect');
        setLastAnswer(answer);
        setScore((prev) => ({
          correct: prev.correct,
          incorrect: prev.incorrect + 1,
          total: prev.total + 1,
        }));
        // Contar errores en prueba de sello
        if (isStampTestRef.current) {
          stampTestErrorsRef.current++;
        }
        return 'incorrect';
      }
    },
    [feedbackState, currentQuestion],
  );

  const nextQuestion = useCallback(() => {
    if (isStampTestRef.current) {
      // Prueba de sello: avanzar por la cola sin reciclar
      const next = questionsRef.current.shift() ?? null;
      setFeedbackState('idle');
      setLastAnswer(null);

      if (next) {
        setCurrentQuestion(next);
        recentCountriesRef.current.push(next.targetCca2);
        applyHighlight(next);
      } else {
        // Cola agotada → prueba terminada
        setCurrentQuestion(null);
        setCorrectCca2(null);
        setStampTestResult(stampTestErrorsRef.current === 0 ? 'passed' : 'failed');
      }
    } else {
      const next = requestNextQuestion();
      setCurrentQuestion(next);
      setFeedbackState('idle');
      setLastAnswer(null);
      if (next) {
        applyHighlight(next);
      } else {
        setCorrectCca2(null);
        setPoolExhausted(true);
      }
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
    setStampTestResult(null);
    setStampTestProgress(null);
    setStampTestType(null);
    setPoolExhausted(false);
    isStampTestRef.current = false;
    stampTestTotalRef.current = 0;
    stampTestErrorsRef.current = 0;
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
    stampTestResult,
    stampTestProgress,
    stampTestType,
    poolExhausted,
    start,
    startStampTest,
    submitAnswer,
    nextQuestion,
    end,
  };
}
