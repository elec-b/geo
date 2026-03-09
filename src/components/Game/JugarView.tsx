// JugarView — contenedor principal de la experiencia Jugar
// Gestiona el flujo selector → juego y el bridge con el globo.
import { useState, useCallback, useMemo, useEffect, useRef, type RefObject, type MutableRefObject } from 'react';
import type { GlobeD3Ref, FeedbackLabel } from '../Globe';
import { COUNTRY_CORRECT_COLOR, COUNTRY_INCORRECT_COLOR } from '../Globe/colors';
import type { GlobeControlProps } from '../Explore/ExploreView';
import type { CountryFeature } from '../../data/countries';
import type { GameQuestionChoice, QuestionTypeFilter } from '../../data/gameQuestions';
import type { CountryData, CapitalCoords, Continent, GameLevel, LevelDefinition, QuestionType } from '../../data/types';
import type { StampTestType } from '../../hooks/useGameSession';
import { CONTINENT_CENTERS, CONTINENT_ZOOM } from '../../data/continents';
import { NON_UN_TERRITORIES_BY_NAME } from '../../data/isoMapping';
import { useAppStore, type StampType } from '../../stores/appStore';
import { calculateProgress, isReadyForStamp, isTypeFullyDominated, getNextSuggestedType, getAttemptsWithInheritance, getInheritedTypes } from '../../data/learningAlgorithm';
import { useGameSession } from '../../hooks/useGameSession';
import { LevelSelector } from './LevelSelector';
import { QuestionBanner } from './QuestionBanner';
import { GameFeedback } from './GameFeedback';
import { ProgressBar } from './ProgressBar';
import { ChoicePanel } from './ChoicePanel';
import './JugarView.css';

type JugarScreen = 'selector' | 'playing';
type FeedbackStep = 'idle' | 'step1' | 'step2';

/** Pares microestado-contenedor — toque en uno se acepta como toque en el otro */
const MICROSTATE_PAIRS = new Set([
  'IT-VA', 'IT-SM', 'FR-MC', 'AT-LI', 'CH-LI',
  'ES-AD', 'FR-AD', 'BE-LU', 'DE-LU', 'FR-LU',
  'MY-SG', 'QA-BH', 'SA-BH',
]);

/** Labels de tipos de pregunta (para modales de progresión) */
const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  E: '¿Qué país es?',
  C: 'País → Capital',
  D: 'Capital → País',
  F: '¿Cuál es su capital?',
  A: 'Señala el país',
  B: 'Señala la capital',
};

/** Petición de prueba de sello desde Pasaporte */
export interface StampTestRequest {
  level: GameLevel;
  continent: Continent;
  stampType: StampTestType;
}

interface JugarViewProps {
  globeRef: RefObject<GlobeD3Ref | null>;
  countries: Map<string, CountryData>;
  capitals: Map<string, CapitalCoords>;
  levels: Map<string, LevelDefinition>;
  onGlobePropsChange: (props: GlobeControlProps) => void;
  /** Ref donde se registra el handler de click en país (bridge con App.tsx) */
  onCountryClickRef: MutableRefObject<((f: CountryFeature) => void) | undefined>;
  /** Petición de prueba de sello desde Pasaporte (se consume una vez) */
  stampTestRequest?: StampTestRequest | null;
  /** Callback cuando la prueba de sello termina (para volver a Pasaporte si viene de ahí) */
  onStampTestDone?: () => void;
}

export function JugarView({
  globeRef,
  countries,
  capitals,
  levels,
  onGlobePropsChange,
  onCountryClickRef,
  stampTestRequest,
  onStampTestDone,
}: JugarViewProps) {
  const [screen, setScreen] = useState<JugarScreen>('selector');

  // --- Store y algoritmo de aprendizaje ---
  const recordAttempt = useAppStore((s) => s.recordAttempt);
  const getAttempts = useAppStore((s) => s.getAttempts);
  const getStamps = useAppStore((s) => s.getStamps);
  const earnStamp = useAppStore((s) => s.earnStamp);
  const setLastPlayed = useAppStore((s) => s.setLastPlayed);

  // Modales de prueba de sello y fin de pool
  const [showStampChooser, setShowStampChooser] = useState(false);
  const [showStampResult, setShowStampResult] = useState(false);
  const [showPoolExhausted, setShowPoolExhausted] = useState(false);

  // Refs para nivel/continente/tipo activos (disponibles antes de que session se actualice)
  const activeLevelRef = useRef<GameLevel | null>(null);
  const activeContinentRef = useRef<Continent | null>(null);
  const activeQuestionTypeRef = useRef<QuestionTypeFilter>('mixed');

  // Callback de intento: registra en el store
  const handleAttempt = useCallback(
    (cca2: string, type: QuestionType, correct: boolean) => {
      if (activeLevelRef.current && activeContinentRef.current) {
        recordAttempt(activeLevelRef.current, activeContinentRef.current, cca2, type, correct);
      }
    },
    [recordAttempt],
  );

  // Callback para obtener intentos actualizados con herencia (el hook lo usa para el algoritmo)
  const getAttemptsForSession = useCallback(() => {
    if (!activeLevelRef.current || !activeContinentRef.current) return {};
    const ownAttempts = getAttempts(activeLevelRef.current, activeContinentRef.current);
    if (activeLevelRef.current === 'turista') return ownAttempts;
    return getAttemptsWithInheritance(
      ownAttempts, activeLevelRef.current, activeContinentRef.current,
      getStamps, getAttempts,
    );
  }, [getAttempts, getStamps]);

  // Callback para obtener países heredados: mapa de país → tipos sin datos propios
  const getInheritedCountries = useCallback((): Map<string, Set<QuestionType>> => {
    if (!activeLevelRef.current || !activeContinentRef.current || activeLevelRef.current === 'turista') {
      return new Map();
    }
    const ownAttempts = getAttempts(activeLevelRef.current, activeContinentRef.current);
    const merged = getAttemptsWithInheritance(
      ownAttempts, activeLevelRef.current, activeContinentRef.current,
      getStamps, getAttempts,
    );
    const map = new Map<string, Set<QuestionType>>();
    for (const cca2 of Object.keys(merged)) {
      const types = getInheritedTypes(cca2, ownAttempts, merged);
      if (types.size > 0) map.set(cca2, types);
    }
    return map;
  }, [getAttempts, getStamps]);

  const session = useGameSession(levels, countries, capitals, {
    onAttempt: handleAttempt,
    getAttempts: getAttemptsForSession,
    getInheritedCountries,
  });

  // Respuesta seleccionada para feedback visual en ChoicePanel
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // Secuencia de dos pasos para feedback geográfico en tipos A/B (error)
  const [feedbackStep, setFeedbackStep] = useState<FeedbackStep>('idle');

  // Secuencia de zoom out → zoom in entre preguntas (tipos C-F)
  type FlyOutStep = 'idle' | 'zoomingOut' | 'zoomingIn';
  const [flyOutStep, setFlyOutStep] = useState<FlyOutStep>('idle');
  const feedbackCoordsRef = useRef<{
    wrongCca2: string;
    wrongCoords: [number, number];
    correctCca2: string;
    correctCoords: [number, number];
  } | null>(null);

  // --- Países del continente actual (para highlight) ---

  const highlightedCountries = useMemo(() => {
    if (!session.continent) return null;
    const set = new Set<string>();
    for (const [cca2, data] of countries) {
      if (data.continent === session.continent) set.add(cca2);
    }
    for (const territory of Object.values(NON_UN_TERRITORIES_BY_NAME)) {
      if (territory.continent === session.continent && !set.has(territory.cca2)) {
        set.add(territory.cca2);
      }
    }
    return set;
  }, [session.continent, countries]);

  // --- Pines de capitales ---
  // B/C: todas las capitales del continente en juego
  // F: solo pin del país objetivo
  // Otros: vacío

  const capitalPins = useMemo((): [number, number][] => {
    const q = session.currentQuestion;
    if (!q) return [];

    if (q.type === 'B' || q.type === 'C') {
      // Mostrar todas las capitales del continente
      if (!session.continent) return [];
      const pins: [number, number][] = [];
      for (const [cca2, data] of countries) {
        if (data.continent !== session.continent) continue;
        const cap = capitals.get(cca2);
        if (cap) pins.push([cap.latlng[1], cap.latlng[0]]);
      }
      return pins;
    }

    // Tipo D: mostrar pin de capital del país correcto tras responder
    if (q.type === 'D' && session.feedbackState !== 'idle') {
      const cap = capitals.get(q.targetCca2);
      return cap ? [[cap.latlng[1], cap.latlng[0]]] : [];
    }

    if (q.type === 'F') {
      const cap = capitals.get(q.targetCca2);
      return cap ? [[cap.latlng[1], cap.latlng[0]]] : [];
    }

    return [];
  }, [session.currentQuestion, session.continent, session.feedbackState, countries, capitals]);

  // --- Etiquetas de feedback geográfico sobre el globo (solo tipos A/B, error) ---

  const globeFeedbackLabels = useMemo((): FeedbackLabel[] | null => {
    if (feedbackStep === 'idle' || !feedbackCoordsRef.current) return null;

    const q = session.currentQuestion;
    if (!q) return null;

    const coords = feedbackCoordsRef.current;

    if (feedbackStep === 'step1') {
      // Paso 1: etiqueta roja sobre el país equivocado
      let text: string;
      if (q.type === 'B') {
        const wrongCountry = countries.get(coords.wrongCca2);
        const wrongCap = capitals.get(coords.wrongCca2);
        text = wrongCountry && wrongCap
          ? `${wrongCap.name}\n${wrongCountry.name}`
          : (wrongCountry?.name ?? coords.wrongCca2);
      } else {
        text = countries.get(coords.wrongCca2)?.name ?? coords.wrongCca2;
      }
      return [{ text, coords: coords.wrongCoords, kind: 'incorrect' }];
    }

    // step2: etiqueta verde sobre el país correcto
    let text: string;
    if (q.type === 'B') {
      const rightCountry = countries.get(coords.correctCca2);
      const rightCap = capitals.get(coords.correctCca2);
      text = rightCountry && rightCap
        ? `${rightCap.name}\n${rightCountry.name}`
        : (rightCountry?.name ?? coords.correctCca2);
    } else {
      text = countries.get(coords.correctCca2)?.name ?? coords.correctCca2;
    }
    return [{ text, coords: coords.correctCoords, kind: 'correct' }];
  }, [feedbackStep, session.currentQuestion, countries, capitals]);

  // --- Color y cca2 del país seleccionado según el estado del juego ---

  const { highlightCca2, highlightColor } = useMemo(() => {
    const q = session.currentQuestion;
    const isAB = q && (q.type === 'A' || q.type === 'B');

    // Acierto (todos los tipos): verde
    if (session.feedbackState === 'correct') {
      return { highlightCca2: session.correctCca2, highlightColor: COUNTRY_CORRECT_COLOR };
    }

    // Error A/B step1: país equivocado en rojo
    if (session.feedbackState === 'incorrect' && isAB && feedbackStep === 'step1' && feedbackCoordsRef.current) {
      return { highlightCca2: feedbackCoordsRef.current.wrongCca2, highlightColor: COUNTRY_INCORRECT_COLOR };
    }

    // Error C-F, error A/B step2, pregunta E/F, idle: dorado (default)
    return { highlightCca2: session.correctCca2, highlightColor: undefined };
  }, [session.currentQuestion, session.feedbackState, session.correctCca2, feedbackStep]);

  // --- Sincronización de props del globo ---

  // Ocultar marcadores en tipos C-F (el usuario no hace click en el mapa)
  const hideMarkers = useMemo(() => {
    const q = session.currentQuestion;
    if (!q) return false;
    return q.type !== 'A' && q.type !== 'B';
  }, [session.currentQuestion]);

  useEffect(() => {
    onGlobePropsChange({
      selectedCountryCca2: highlightCca2,
      selectedCountryColor: highlightColor,
      capitalPins,
      highlightedCountries,
      showCountryLabels: false,
      showCapitalLabels: false,
      capitalLabelsData: null,
      feedbackLabels: globeFeedbackLabels,
      showMarkers: hideMarkers ? false : undefined,
    });
  }, [highlightCca2, highlightColor, capitalPins, highlightedCountries, globeFeedbackLabels, hideMarkers, onGlobePropsChange]);

  // Reset al desmontar (cambio de tab)
  useEffect(() => {
    return () => {
      onGlobePropsChange({
        selectedCountryCca2: null,
        selectedCountryColor: undefined,
        capitalPins: [],
        highlightedCountries: null,
        showCountryLabels: false,
        showCapitalLabels: false,
        capitalLabelsData: null,
        feedbackLabels: null,
        showMarkers: undefined,
      });
    };
  }, [onGlobePropsChange]);

  // Para tipos E/F: flyTo al país al cargar la primera pregunta (inicio de partida).
  // Las transiciones posteriores se gestionan con la secuencia flyOutStep.
  useEffect(() => {
    if (flyOutStep !== 'idle') return;
    const q = session.currentQuestion;
    if (!q || (q.type !== 'E' && q.type !== 'F')) return;
    if (!globeRef.current) return;

    const centroid = globeRef.current.getCentroid(q.targetCca2);
    if (centroid) {
      const baseZoom = globeRef.current.getCountryZoom(q.targetCca2);
      const zoom = baseZoom != null ? Math.max(baseZoom * 0.6, 2.0) : undefined;
      globeRef.current.flyTo(centroid[0], centroid[1], zoom, 600);
    }
  }, [session.currentQuestion, globeRef, flyOutStep]);

  // Para tipos A/B: zoom out automático al nivel continental si el objetivo no es visible.
  // Evita que el usuario quede desorientado tras un flyTo al país correcto en la pregunta anterior.
  useEffect(() => {
    const q = session.currentQuestion;
    if (!q || (q.type !== 'A' && q.type !== 'B')) return;
    if (!globeRef.current || !session.continent) return;
    // Solo actuar si no estamos en feedback (pregunta nueva)
    if (session.feedbackState !== 'idle') return;
    if (feedbackStep !== 'idle') return;

    // Obtener coordenadas del objetivo
    let targetCoords: [number, number] | null = null;
    if (q.type === 'A') {
      targetCoords = globeRef.current.getCentroid(q.targetCca2);
    } else {
      // Tipo B: coordenadas de la capital
      const cap = capitals.get(q.targetCca2);
      if (cap) targetCoords = [cap.latlng[1], cap.latlng[0]];
    }

    if (!targetCoords) return;
    if (!globeRef.current.isPointVisible(targetCoords[0], targetCoords[1])) {
      // Zoom out al nivel continental (sin centrar en el país)
      const [lon, lat] = CONTINENT_CENTERS[session.continent];
      globeRef.current.flyTo(lon, lat, CONTINENT_ZOOM[session.continent], 800);
    }
  }, [session.currentQuestion, session.continent, session.feedbackState, feedbackStep, globeRef, capitals]);

  // --- Handlers ---

  // Click en un país del globo durante el juego (solo tipos A/B)
  const handleCountryClick = useCallback(
    (feature: CountryFeature) => {
      let cca2 = feature.properties?.cca2;
      if (!cca2 || !session.isActive) return;

      // Ignorar clicks en globo para tipos C-F
      const q = session.currentQuestion;
      if (!q || (q.type !== 'A' && q.type !== 'B')) return;

      // Tolerancia microestado-contenedor: si tocas un vecino del objetivo, aceptar
      if (cca2 !== q.targetCca2) {
        const pair = [cca2, q.targetCca2].sort().join('-');
        if (MICROSTATE_PAIRS.has(pair)) cca2 = q.targetCca2;
      }

      const result = session.submitAnswer(cca2);

      // En error: iniciar secuencia de dos pasos (etiqueta roja → flyTo + etiqueta verde)
      if (result === 'incorrect' && q && globeRef.current) {
        const wrongCoords = globeRef.current.getCentroid(cca2);
        const correctCoords = globeRef.current.getCentroid(q.targetCca2);
        if (wrongCoords && correctCoords) {
          feedbackCoordsRef.current = {
            wrongCca2: cca2,
            wrongCoords,
            correctCca2: q.targetCca2,
            correctCoords,
          };
          setFeedbackStep('step1');
        }
      }
    },
    [session, globeRef],
  );

  // Registrar handler en ref para bridge con App.tsx
  onCountryClickRef.current = handleCountryClick;

  // Selección de continente en LevelSelector → flyTo
  const handleContinentSelect = useCallback(
    (continent: Continent) => {
      if (globeRef.current) {
        const [lon, lat] = CONTINENT_CENTERS[continent];
        globeRef.current.flyTo(lon, lat, undefined, 800);
      }
    },
    [globeRef],
  );

  // Inicio de partida — zoom al continente
  const handleStart = useCallback(
    (level: GameLevel, continent: Continent, questionType?: QuestionTypeFilter) => {
      // Setear refs antes de iniciar sesión (para que typeWeights se calcule correctamente)
      activeLevelRef.current = level;
      activeContinentRef.current = continent;
      activeQuestionTypeRef.current = questionType ?? 'mixed';

      setLastPlayed(continent, level);
      session.start(level, continent, questionType);
      setScreen('playing');
      setSelectedChoice(null);

      // Zoom al continente para que llene la pantalla
      if (globeRef.current) {
        const [lon, lat] = CONTINENT_CENTERS[continent];
        globeRef.current.flyTo(lon, lat, CONTINENT_ZOOM[continent], 1000);
      }
    },
    [session, globeRef],
  );

  // Selección de opción en ChoicePanel (tipos C-F)
  const handleChoiceSelect = useCallback(
    (answer: string) => {
      if (session.feedbackState !== 'idle' || flyOutStep !== 'idle') return;
      setSelectedChoice(answer);
      const q = session.currentQuestion;
      const result = session.submitAnswer(answer);

      if (result === 'incorrect' && q && globeRef.current) {
        // En error: flyTo al país correcto con zoom adaptativo
        const centroid = globeRef.current.getCentroid(q.targetCca2);
        if (centroid) {
          const zoom = globeRef.current.getCountryZoom(q.targetCca2) ?? undefined;
          globeRef.current.flyTo(centroid[0], centroid[1], zoom, 600);
        }
      } else if (result === 'correct' && q && (q.type === 'C' || q.type === 'D') && globeRef.current) {
        // Acierto en C/D: flyTo al centroide (no capital) para que el país no quede tapado por ChoicePanel
        const centroid = globeRef.current.getCentroid(q.targetCca2);
        if (centroid) {
          const zoom = globeRef.current.getCountryZoom(q.targetCca2) ?? undefined;
          globeRef.current.flyTo(centroid[0], centroid[1], zoom, 600);
        }
      }
    },
    [session, globeRef, capitals],
  );

  // Fin de animación de feedback → iniciar zoom out intermedio (solo C-F; A/B usa la secuencia de pasos)
  const handleFeedbackEnd = useCallback(() => {
    if (globeRef.current && session.continent) {
      // Zoom out al continente para dar perspectiva antes de la siguiente pregunta
      const [lon, lat] = CONTINENT_CENTERS[session.continent];
      globeRef.current.flyTo(lon, lat, CONTINENT_ZOOM[session.continent], 600);
      setFlyOutStep('zoomingOut');
      setSelectedChoice(null);
    } else {
      // Fallback: avanzar directamente
      session.nextQuestion();
      setSelectedChoice(null);
    }
  }, [session, globeRef]);

  // Resetear feedbackStep cuando hay acierto en A/B (el timer de GameFeedback avanza normalmente)
  const handleFeedbackEndAB = useCallback(() => {
    session.nextQuestion();
    setSelectedChoice(null);
    setFeedbackStep('idle');
    feedbackCoordsRef.current = null;
  }, [session]);

  // Lanzar prueba de sello (desde el chooser modal o desde Pasaporte)
  const handleStartStampTest = useCallback(
    (stampType: StampTestType) => {
      const level = activeLevelRef.current;
      const continent = activeContinentRef.current;
      if (!level || !continent) return;

      setShowStampChooser(false);
      session.startStampTest(level, continent, stampType);
      // No cambiar screen — ya estamos en 'playing' si viene del banner
      // Si viene de Pasaporte, handleStampTestRequest ya pone screen='playing'

      // Zoom al continente
      if (globeRef.current) {
        const [lon, lat] = CONTINENT_CENTERS[continent];
        globeRef.current.flyTo(lon, lat, CONTINENT_ZOOM[continent], 1000);
      }
    },
    [session, globeRef],
  );

  // Lanzar prueba de sello directamente (desde Pasaporte via props)
  const handleStampTestRequest = useCallback(
    (req: StampTestRequest) => {
      activeLevelRef.current = req.level;
      activeContinentRef.current = req.continent;
      activeQuestionTypeRef.current = req.stampType === 'countries' ? 'A' : 'B';

      session.startStampTest(req.level, req.continent, req.stampType);
      setScreen('playing');
      setSelectedChoice(null);

      if (globeRef.current) {
        const [lon, lat] = CONTINENT_CENTERS[req.continent];
        globeRef.current.flyTo(lon, lat, CONTINENT_ZOOM[req.continent], 1000);
      }
    },
    [session, globeRef],
  );

  // Efecto: lanzar prueba de sello desde Pasaporte cuando llega la petición
  const stampTestRequestProcessed = useRef(false);
  useEffect(() => {
    if (stampTestRequest && !stampTestRequestProcessed.current) {
      stampTestRequestProcessed.current = true;
      handleStampTestRequest(stampTestRequest);
    }
    if (!stampTestRequest) {
      stampTestRequestProcessed.current = false;
    }
  }, [stampTestRequest, handleStampTestRequest]);

  // Detectar pool agotado → mostrar modal de fin de sesión
  useEffect(() => {
    if (session.poolExhausted) {
      setShowPoolExhausted(true);
    }
  }, [session.poolExhausted]);

  // Detectar fin de prueba de sello → mostrar modal de resultado
  useEffect(() => {
    if (session.stampTestResult === 'passed' || session.stampTestResult === 'failed') {
      // Si pasó, registrar sello
      if (session.stampTestResult === 'passed' && session.stampTestType && session.level && session.continent) {
        const storeType: StampType = session.stampTestType === 'countries' ? 'countries' : 'capitals';
        earnStamp(session.level, session.continent, storeType);
      }
      setShowStampResult(true);
    }
  }, [session.stampTestResult, session.stampTestType, session.level, session.continent, earnStamp]);

  // Cerrar modal de resultado de prueba de sello
  const handleStampResultClose = useCallback(() => {
    setShowStampResult(false);
    session.end();
    activeLevelRef.current = null;
    activeContinentRef.current = null;
    activeQuestionTypeRef.current = 'mixed';
    setScreen('selector');
    setSelectedChoice(null);
    setFlyOutStep('idle');
    onStampTestDone?.();
  }, [session, onStampTestDone]);

  // Banner de ProgressBar tappable: abrir modal de elección de sello
  const handleStampBannerClick = useCallback(() => {
    setShowStampChooser(true);
  }, []);

  // Cerrar modal de fin de pool y volver al selector
  const handlePoolExhaustedClose = useCallback(() => {
    setShowPoolExhausted(false);
    session.end();
    activeLevelRef.current = null;
    activeContinentRef.current = null;
    activeQuestionTypeRef.current = 'mixed';
    setScreen('selector');
    setSelectedChoice(null);
    setFlyOutStep('idle');
  }, [session]);

  // Reiniciar sesión con un tipo sugerido desde el modal de fin de pool
  const handleStartSuggestedType = useCallback((type: QuestionType) => {
    const level = activeLevelRef.current;
    const continent = activeContinentRef.current;
    if (!level || !continent) return;
    setShowPoolExhausted(false);
    activeQuestionTypeRef.current = type;
    session.start(level, continent, type);
    setSelectedChoice(null);
    if (globeRef.current) {
      const [lon, lat] = CONTINENT_CENTERS[continent];
      globeRef.current.flyTo(lon, lat, CONTINENT_ZOOM[continent], 1000);
    }
  }, [session, globeRef]);

  // Reiniciar en modo aventura desde el modal de fin de pool
  const handleStartAdventure = useCallback(() => {
    const level = activeLevelRef.current;
    const continent = activeContinentRef.current;
    if (!level || !continent) return;
    setShowPoolExhausted(false);
    activeQuestionTypeRef.current = 'mixed';
    session.start(level, continent, 'mixed');
    setSelectedChoice(null);
    if (globeRef.current) {
      const [lon, lat] = CONTINENT_CENTERS[continent];
      globeRef.current.flyTo(lon, lat, CONTINENT_ZOOM[continent], 1000);
    }
  }, [session, globeRef]);

  // Salir de la partida
  const handleExit = useCallback(() => {
    session.end();
    activeLevelRef.current = null;
    activeContinentRef.current = null;
    activeQuestionTypeRef.current = 'mixed';
    setScreen('selector');
    setSelectedChoice(null);
    setFlyOutStep('idle');
  }, [session]);

  // --- Secuencia temporal para feedback de dos pasos (A/B error) ---

  useEffect(() => {
    if (feedbackStep === 'idle') return;

    let timer: ReturnType<typeof setTimeout>;

    if (feedbackStep === 'step1') {
      // Paso 1 → paso 2: tras 1200ms, flyTo al correcto + etiqueta verde
      timer = setTimeout(() => {
        setFeedbackStep('step2');
        const coords = feedbackCoordsRef.current;
        if (coords && globeRef.current) {
          const baseZoom = globeRef.current.getCountryZoom(coords.correctCca2);
          // Zoom más suave en error: mostrar el país en contexto con sus vecinos
          const zoom = baseZoom != null ? Math.max(baseZoom * 0.6, 2.0) : undefined;
          globeRef.current.flyTo(coords.correctCoords[0], coords.correctCoords[1], zoom, 600);
        }
      }, 1200);
    } else {
      // Paso 2 → idle: tras 1800ms, siguiente pregunta
      timer = setTimeout(() => {
        setFeedbackStep('idle');
        feedbackCoordsRef.current = null;
        session.nextQuestion();
        setSelectedChoice(null);
      }, 1800);
    }

    return () => clearTimeout(timer);
  }, [feedbackStep, session, globeRef]);

  // --- Secuencia temporal para zoom out intermedio (C-F) ---
  // Tras el feedback, se hace zoom out al continente → pausa → nextQuestion → zoom in al nuevo país

  useEffect(() => {
    if (flyOutStep !== 'zoomingOut') return;

    // Esperar a que termine la animación de flyTo (600ms) + pausa (400ms),
    // luego avanzar pregunta e iniciar zoom in
    const timer = setTimeout(() => {
      session.nextQuestion();
      setFlyOutStep('zoomingIn');
    }, 1000);

    return () => clearTimeout(timer);
  }, [flyOutStep, session]);

  // Zoom in al nuevo país tras el zoom out continental
  useEffect(() => {
    if (flyOutStep !== 'zoomingIn') return;
    const q = session.currentQuestion;

    // En modo mixto: si la siguiente pregunta es A/B, no hacer zoom in (revelaría la respuesta)
    if (!q || q.type === 'A' || q.type === 'B' || q.type === 'C' || q.type === 'D') {
      setFlyOutStep('idle');
      return;
    }
    if (!globeRef.current) {
      setFlyOutStep('idle');
      return;
    }

    const centroid = globeRef.current.getCentroid(q.targetCca2);
    if (centroid) {
      const baseZoom = globeRef.current.getCountryZoom(q.targetCca2);
      const zoom = baseZoom != null ? Math.max(baseZoom * 0.6, 2.0) : undefined;
      globeRef.current.flyTo(centroid[0], centroid[1], zoom, 600);
    }
    setFlyOutStep('idle');
  }, [flyOutStep, session.currentQuestion, globeRef]);

  // --- Progreso y readiness (para la barra) ---

  const progress = useMemo(() => {
    if (!session.level || !session.continent) return { current: 0, total: 0 };
    const att = getAttemptsForSession();
    const def = levels.get(`${session.level}-${session.continent}`);
    if (!def) return { current: 0, total: 0 };
    const mode = activeQuestionTypeRef.current === 'mixed' ? 'adventure' : activeQuestionTypeRef.current;
    return calculateProgress(att, def.countries, mode);
    // session.score en deps para recalcular tras cada respuesta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.level, session.continent, session.score, getAttemptsForSession, levels]);

  const readyForStamp = useMemo(() => {
    if (activeQuestionTypeRef.current !== 'mixed' || !session.level || !session.continent) return false;
    const att = getAttemptsForSession();
    const def = levels.get(`${session.level}-${session.continent}`);
    return def ? isReadyForStamp(att, def.countries) : false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.level, session.continent, session.score, getAttemptsForSession, levels]);

  // Invitación a sello desde tipo concreto A/B (Step 6c)
  const readyForStampType = useMemo((): 'countries' | 'capitals' | null => {
    const qt = activeQuestionTypeRef.current;
    if (qt !== 'A' && qt !== 'B') return null;
    if (!session.level || !session.continent) return null;
    const att = getAttemptsForSession();
    const def = levels.get(`${session.level}-${session.continent}`);
    if (!def) return null;
    const stamps = getStamps(session.level, session.continent);
    if (qt === 'A' && !stamps.countries && isTypeFullyDominated(att, def.countries, 'A')) return 'countries';
    if (qt === 'B' && !stamps.capitals && isTypeFullyDominated(att, def.countries, 'B')) return 'capitals';
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.level, session.continent, session.score, getAttemptsForSession, getStamps, levels]);

  // Siguiente tipo sugerido tras agotar pool de tipo concreto (Step 7)
  const nextSuggestedType = useMemo((): QuestionType | null => {
    if (!showPoolExhausted) return null;
    const qt = activeQuestionTypeRef.current;
    if (qt === 'mixed') return null;
    if (!session.level || !session.continent) return null;
    const att = getAttempts(session.level, session.continent);
    const def = levels.get(`${session.level}-${session.continent}`);
    if (!def) return null;
    return getNextSuggestedType(att, def.countries, qt as QuestionType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPoolExhausted, session.level, session.continent, getAttempts, levels]);

  // --- Render ---

  if (screen === 'selector') {
    return (
      <LevelSelector
        levels={levels}
        onStart={handleStart}
        onContinentSelect={handleContinentSelect}
      />
    );
  }

  const question = session.currentQuestion;
  const isABQuestion = question?.type === 'A' || question?.type === 'B';
  // Tipo C-F: pregunta con opciones de texto
  const choiceQuestion =
    question && !isABQuestion
      ? question as GameQuestionChoice : null;

  return (
    <>
      {question && (
        <QuestionBanner prompt={question.prompt} type={question.type} />
      )}

      {/* Panel de opciones para tipos C-F */}
      {choiceQuestion && (
        <ChoicePanel
          options={choiceQuestion.options}
          onSelect={handleChoiceSelect}
          disabled={session.feedbackState !== 'idle' || flyOutStep !== 'idle'}
          correctAnswer={session.feedbackState !== 'idle'
            ? choiceQuestion.correctAnswer
            : undefined}
          selectedAnswer={selectedChoice ?? undefined}
        />
      )}

      <GameFeedback
        state={session.feedbackState}
        onAnimationEnd={isABQuestion ? handleFeedbackEndAB : handleFeedbackEnd}
        skipTimer={isABQuestion && session.feedbackState === 'incorrect'}
        geoFeedback={isABQuestion && session.feedbackState === 'incorrect'}
      />

      <ProgressBar
        progressCurrent={session.stampTestProgress ? session.stampTestProgress.current : progress.current}
        progressTotal={session.stampTestProgress ? session.stampTestProgress.total : progress.total}
        score={session.score}
        onExit={handleExit}
        readyForStamp={readyForStamp}
        readyForStampType={readyForStampType}
        isAdventure={activeQuestionTypeRef.current === 'mixed'}
        isStampTest={session.stampTestResult === 'in_progress'}
        stampTestType={session.stampTestType}
        onStampBannerClick={handleStampBannerClick}
      />

      {/* Modal: elegir tipo de sello */}
      {showStampChooser && (
        <div className="jugar-modal-overlay">
          <div className="jugar-modal">
            <h3 className="jugar-modal__title">Prueba de sello</h3>
            <p className="jugar-modal__text">
              Elige una prueba. Deberás completarla sin errores para conseguir el sello.
            </p>
            <div className="jugar-modal__buttons">
              <button
                className="jugar-modal__btn jugar-modal__btn--countries"
                onClick={() => handleStartStampTest('countries')}
              >
                Sello de Países
              </button>
              <button
                className="jugar-modal__btn jugar-modal__btn--capitals"
                onClick={() => handleStartStampTest('capitals')}
              >
                Sello de Capitales
              </button>
            </div>
            <button
              className="jugar-modal__cancel"
              onClick={() => setShowStampChooser(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal: resultado de prueba de sello */}
      {showStampResult && (
        <div className="jugar-modal-overlay">
          <div className="jugar-modal">
            {session.stampTestResult === 'passed' ? (
              <>
                <div className="jugar-modal__stamp-icon jugar-modal__stamp-icon--earned">🏅</div>
                <h3 className="jugar-modal__title">Sello conseguido</h3>
                <p className="jugar-modal__text">
                  {session.score.correct} de {session.score.correct + session.score.incorrect} correctos. Sin errores.
                </p>
              </>
            ) : (
              <>
                <h3 className="jugar-modal__title">Prueba no superada</h3>
                <p className="jugar-modal__text">
                  {session.score.correct} de {session.score.correct + session.score.incorrect} correctos. Sigue practicando.
                </p>
              </>
            )}
            <button
              className="jugar-modal__btn jugar-modal__btn--primary"
              onClick={handleStampResultClose}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Modal: pool de preguntas agotado */}
      {showPoolExhausted && (
        <div className="jugar-modal-overlay">
          <div className="jugar-modal">
            <h3 className="jugar-modal__title">
              {activeQuestionTypeRef.current === 'mixed'
                ? 'Etapa completada'
                : `Has dominado ${QUESTION_TYPE_LABELS[activeQuestionTypeRef.current as QuestionType] ?? 'este tipo'}`}
            </h3>
            <p className="jugar-modal__text">
              {session.score.correct} aciertos, {session.score.incorrect} fallos en esta sesión.
            </p>
            <div className="jugar-modal__buttons">
              {nextSuggestedType && (
                <button
                  className="jugar-modal__btn jugar-modal__btn--primary"
                  onClick={() => handleStartSuggestedType(nextSuggestedType)}
                >
                  Jugar {QUESTION_TYPE_LABELS[nextSuggestedType]}
                </button>
              )}
              {activeQuestionTypeRef.current !== 'mixed' && (
                <button
                  className={`jugar-modal__btn${!nextSuggestedType ? ' jugar-modal__btn--primary' : ''}`}
                  onClick={handleStartAdventure}
                >
                  Aventura
                </button>
              )}
              <button
                className="jugar-modal__cancel"
                onClick={handlePoolExhaustedClose}
              >
                Volver al selector
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
