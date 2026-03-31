// JugarView — contenedor principal de la experiencia Jugar
// Gestiona el flujo selector → juego y el bridge con el globo.
import { useState, useCallback, useMemo, useEffect, useRef, type RefObject, type MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { geoDistance } from 'd3-geo';
import type { GlobeD3Ref, FeedbackLabel } from '../Globe';
import { COUNTRY_CORRECT_COLOR, COUNTRY_INCORRECT_COLOR, COUNTRY_CORRECTION_COLOR } from '../Globe/colors';
import type { GlobeControlProps } from '../Explore/ExploreView';
import type { CountryFeature } from '../../data/countries';
import type { GameQuestionChoice, QuestionTypeFilter } from '../../data/gameQuestions';
import type { CountryData, CapitalCoords, Continent, GameLevel, LevelDefinition, QuestionType } from '../../data/types';
import type { StampTestType } from '../../hooks/useGameSession';
import { CONTINENT_CENTERS, CONTINENT_ZOOM, CONTINENT_CSS_VAR } from '../../data/continents';
import { NON_UN_TERRITORIES_BY_NAME } from '../../data/isoMapping';
import { useAppStore, type StampType } from '../../stores/appStore';
import { calculateProgress, isTypeFullyDominated, getNextSuggestedType, getAttemptsWithInheritance, getInheritedTypes } from '../../data/learningAlgorithm';
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
  'AS-WS', // Samoa Americana ↔ Samoa
]);

/** Margen de tolerancia para hit testing en tipos A/B y Pruebas de Sello.
 * Si el tap cae cerca del país objetivo (dentro del margen angular),
 * se acepta como acierto. El margen se reduce con el zoom. */
const BASE_TOLERANCE_RAD = 0.05;  // ~2.9° a zoom 1
const MIN_TOLERANCE_RAD = 0.005;  // ~0.29° (floor a zoom alto)

/** Offset vertical de flyTo: desplaza el país hacia arriba para compensar
 * el espacio de UI inferior (QuestionBanner + ChoicePanel + ProgressBar). */
const GAME_LAT_OFFSET_ECDF = 12;   // ~37px para tipos con ChoicePanel (E/C/D/F)
const GAME_LAT_OFFSET_AB = 7;      // ~22px para tipos sin ChoicePanel (A/B)
const OFFSET_ZOOM_THRESHOLD = 2.5; // Sin offset a zoom bajo (globo entero visible)
const OFFSET_FADE_RANGE = 1.0;     // Rango de transición suave

function getHitTolerance(zoom: number): number {
  return Math.max(MIN_TOLERANCE_RAD, BASE_TOLERANCE_RAD / zoom);
}

/** Verifica que no haya otro país con centroide más cercano al tap que distToTarget.
 * Evita regalar aciertos por tolerancia cuando hay microestados cercanos (ej. Caribe). */
function isTargetNearest(
  tapCoords: [number, number],
  targetCca2: string,
  distToTarget: number,
  centroids: Map<string, [number, number]>,
): boolean {
  for (const [cca2, centroid] of centroids) {
    if (cca2 === targetCca2) continue;
    if (geoDistance(tapCoords, centroid) < distToTarget) return false;
  }
  return true;
}

/** Zoom de contexto para tipos E/F (identificación visual).
 * Combina el zoom por área con la extensión angular del país para evitar
 * zoom excesivo en archipiélagos dispersos. */
function getEFZoom(globe: GlobeD3Ref, cca2: string): number | undefined {
  const base = globe.getCountryZoom(cca2);
  if (base == null) return undefined;
  const ext = globe.getCountryExtentZoom(cca2, 1.5);
  return Math.max(Math.min(base * 0.6, ext ?? Infinity), 2.0);
}

/** Zoom de contexto para tipos C/D (mostrar capital tras respuesta).
 * Margen más ajustado que E/F porque interesa ver la capital de cerca. */
function getCDZoom(globe: GlobeD3Ref, cca2: string): number | undefined {
  const base = globe.getCountryZoom(cca2);
  if (base == null) return undefined;
  const ext = globe.getCountryExtentZoom(cca2, 1.2);
  return Math.max(Math.min(base, ext ?? Infinity), 2.0);
}

/** Duración adaptativa para flyTo: más tiempo para saltos de zoom grandes. */
function getAdaptiveDuration(currentZoom: number, targetZoom: number): number {
  const ratio = Math.max(targetZoom, currentZoom) / Math.min(targetZoom, currentZoom);
  return Math.round(600 * (1 + Math.log2(Math.max(ratio, 1)) / 4));
}

/** Centro visual de un país: usa el centro del outline (hull) si existe,
 * para que archipiélagos extensos queden centrados en pantalla. */
function getVisualCenter(globe: GlobeD3Ref, cca2: string): [number, number] | null {
  return globe.getOutlineCenter(cca2) ?? globe.getCentroid(cca2);
}

/** Calcula el offset vertical (en grados) según tipo de juego y zoom.
 * A mayor zoom, offset completo; a zoom bajo (globo entero visible), sin offset. */
function getGameLatOffset(questionType: QuestionType, targetZoom: number): number {
  if (targetZoom < OFFSET_ZOOM_THRESHOLD) return 0;
  const fadeFactor = Math.min(1, (targetZoom - OFFSET_ZOOM_THRESHOLD) / OFFSET_FADE_RANGE);
  const hasChoicePanel = questionType === 'C' || questionType === 'D'
    || questionType === 'E' || questionType === 'F';
  return (hasChoicePanel ? GAME_LAT_OFFSET_ECDF : GAME_LAT_OFFSET_AB) * fadeFactor;
}

/** Wrapper de flyTo que aplica offset vertical según tipo de juego. */
function gameFlyTo(
  globe: GlobeD3Ref, lon: number, lat: number,
  zoom: number | undefined, duration: number, questionType: QuestionType,
): void {
  globe.flyTo(lon, lat, zoom, duration, getGameLatOffset(questionType, zoom ?? 1));
}

/** Centra el globo sobre el target si está descentrado (feedback visual de acierto) */
function centerOnCorrectAnswer(globe: GlobeD3Ref, targetCca2: string, questionType: QuestionType) {
  const centroid = globe.getCentroid(targetCca2);
  if (!centroid) return;
  const dist = globe.distanceFromCenter(centroid[0], centroid[1]);
  const currentZoom = globe.getCurrentZoom();
  const visibleAngle = Math.asin(Math.min(1, 1 / currentZoom));
  if (dist > visibleAngle * 0.5) {
    const targetZoom = getEFZoom(globe, targetCca2);
    gameFlyTo(globe, centroid[0], centroid[1], targetZoom, 600, questionType);
  }
}

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
  /** Ref donde se registra el handler de tap en océano (bridge con App.tsx) */
  onCountryDeselectRef: MutableRefObject<(() => void) | undefined>;
  /** Petición de prueba de sello desde Pasaporte (se consume una vez) */
  stampTestRequest?: StampTestRequest | null;
  /** Callback cuando la prueba de sello termina (para volver a Pasaporte si viene de ahí).
   *  Recibe info del sello si se ganó (para animación en Pasaporte). */
  onStampTestDone?: (earned?: { level: GameLevel; continent: Continent; stampType: StampTestType }) => void;
  /** Callback cuando se inicia una prueba de sello internamente (para que App.tsx actualice el tab) */
  onStampTestStarted?: () => void;
  /** Signal para resetear al selector (se incrementa al re-tocar tab Jugar) */
  resetSignal?: number;
  /** Callback para navegar a la vista de estadísticas */
  onNavigateStats?: () => void;
}

export function JugarView({
  globeRef,
  countries,
  capitals,
  levels,
  onGlobePropsChange,
  onCountryClickRef,
  onCountryDeselectRef,
  stampTestRequest,
  onStampTestDone,
  onStampTestStarted,
  resetSignal,
  onNavigateStats,
}: JugarViewProps) {
  const { t } = useTranslation('game');
  const [screen, setScreen] = useState<JugarScreen>('selector');

  // --- Store y algoritmo de aprendizaje ---
  const recordAttempt = useAppStore((s) => s.recordAttempt);
  const recordStampAttempt = useAppStore((s) => s.recordStampAttempt);
  const getAttempts = useAppStore((s) => s.getAttempts);
  const getStamps = useAppStore((s) => s.getStamps);
  const earnStamp = useAppStore((s) => s.earnStamp);
  const setLastPlayed = useAppStore((s) => s.setLastPlayed);
  const setLastStampPlayed = useAppStore((s) => s.setLastStampPlayed);

  // Modales de prueba de sello y fin de pool
  const [showStampChooser, setShowStampChooser] = useState(false);
  const [showStampResult, setShowStampResult] = useState(false);
  const [showPoolExhausted, setShowPoolExhausted] = useState(false);
  const [showAlreadyDominated, setShowAlreadyDominated] = useState(false);
  const [alreadyDominatedType, setAlreadyDominatedType] = useState<QuestionTypeFilter>('mixed');

  // Refs para nivel/continente/tipo activos (disponibles antes de que session se actualice)
  const activeLevelRef = useRef<GameLevel | null>(null);
  const activeContinentRef = useRef<Continent | null>(null);
  const activeQuestionTypeRef = useRef<QuestionTypeFilter>('mixed');

  // Callback de intento (Jugar): registra en el store
  const handleAttempt = useCallback(
    (cca2: string, type: QuestionType, correct: boolean) => {
      if (activeLevelRef.current && activeContinentRef.current) {
        recordAttempt(activeLevelRef.current, activeContinentRef.current, cca2, type, correct);
      }
    },
    [recordAttempt],
  );

  // Callback de intento (prueba de sello): registro independiente
  const handleStampAttempt = useCallback(
    (cca2: string, type: QuestionType, correct: boolean) => {
      if (activeLevelRef.current && activeContinentRef.current) {
        recordStampAttempt(activeLevelRef.current, activeContinentRef.current, cca2, type as 'A' | 'B', correct);
      }
    },
    [recordStampAttempt],
  );

  // Helper para obtener la lista de países de un nivel×continente
  const getCountriesForLevel = useCallback((l: GameLevel, c: Continent) =>
    levels.get(`${l}-${c}`)?.countries ?? [],
  [levels]);

  // Callback para obtener intentos actualizados con herencia (el hook lo usa para el algoritmo)
  const getAttemptsForSession = useCallback(() => {
    if (!activeLevelRef.current || !activeContinentRef.current) return {};
    const ownAttempts = getAttempts(activeLevelRef.current, activeContinentRef.current);
    if (activeLevelRef.current === 'tourist') return ownAttempts;
    return getAttemptsWithInheritance(
      ownAttempts, activeLevelRef.current, activeContinentRef.current,
      getStamps, getCountriesForLevel,
    );
  }, [getAttempts, getStamps, getCountriesForLevel]);

  // Callback para obtener países heredados: mapa de país → tipos sin datos propios
  const getInheritedCountries = useCallback((): Map<string, Set<QuestionType>> => {
    if (!activeLevelRef.current || !activeContinentRef.current || activeLevelRef.current === 'tourist') {
      return new Map();
    }
    const ownAttempts = getAttempts(activeLevelRef.current, activeContinentRef.current);
    const merged = getAttemptsWithInheritance(
      ownAttempts, activeLevelRef.current, activeContinentRef.current,
      getStamps, getCountriesForLevel,
    );
    const map = new Map<string, Set<QuestionType>>();
    for (const cca2 of Object.keys(merged)) {
      const types = getInheritedTypes(cca2, ownAttempts, merged);
      if (types.size > 0) map.set(cca2, types);
    }
    return map;
  }, [getAttempts, getStamps, getCountriesForLevel]);

  const session = useGameSession(levels, countries, capitals, {
    onAttempt: handleAttempt,
    onStampAttempt: handleStampAttempt,
    getAttempts: getAttemptsForSession,
    getInheritedCountries,
    t,
  });

  // Respuesta seleccionada para feedback visual en ChoicePanel
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // Secuencia de dos pasos para feedback geográfico en tipos A/B (error)
  const [feedbackStep, setFeedbackStep] = useState<FeedbackStep>('idle');

  // Secuencia de zoom out → zoom in entre preguntas (tipos C-F)
  type FlyOutStep = 'idle' | 'zoomingOut' | 'zoomingIn';
  const [flyOutStep, setFlyOutStep] = useState<FlyOutStep>('idle');
  const flyOutDurationRef = useRef(600);
  const lastChoiceFlyToDurationRef = useRef(0);
  const feedbackCoordsRef = useRef<{
    wrongCca2: string;
    wrongCoords: [number, number];
    correctCca2: string;
    correctCoords: [number, number];
    questionType: QuestionType;
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
        if (data.unMember === false) continue;
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

    // Error: A/B step2 → ocre (corrección espacial), C-F → rojo (has fallado este país)
    if (session.feedbackState === 'incorrect') {
      const color = isAB && feedbackStep === 'step2' ? COUNTRY_CORRECTION_COLOR : COUNTRY_INCORRECT_COLOR;
      return { highlightCca2: session.correctCca2, highlightColor: color };
    }

    // Pregunta E/F, idle: plata (default)
    return { highlightCca2: session.correctCca2, highlightColor: undefined };
  }, [session.currentQuestion, session.feedbackState, session.correctCca2, feedbackStep]);

  // --- Sincronización de props del globo ---

  // Color contrastante para el pin de capital del país target (solo tras responder, para no delatar)
  const capitalPinHighlight = useMemo((): { coords: [number, number]; color: string } | null => {
    const q = session.currentQuestion;
    if (!q || capitalPins.length === 0) return null;
    if (session.feedbackState === 'idle') return null;
    const cap = capitals.get(q.targetCca2);
    if (!cap) return null;
    return {
      coords: [cap.latlng[1], cap.latlng[0]],
      color: 'rgba(255, 255, 255, 0.85)',
    };
  }, [session.currentQuestion, capitalPins, capitals, session.feedbackState]);

  // Ocultar marcadores en tipos C-F (el usuario no hace click en el mapa)
  const hideMarkers = useMemo(() => {
    const q = session.currentQuestion;
    if (!q) return false;
    return q.type !== 'A';
  }, [session.currentQuestion]);

  useEffect(() => {
    onGlobePropsChange({
      selectedCountryCca2: highlightCca2,
      selectedCountryColor: highlightColor,
      capitalPins,
      capitalPinHighlight,
      highlightedCountries,
      showCountryLabels: false,
      showCapitalLabels: false,
      capitalLabelsData: null,
      feedbackLabels: globeFeedbackLabels,
      showMarkers: hideMarkers ? false : undefined,
    });
  }, [highlightCca2, highlightColor, capitalPins, capitalPinHighlight, highlightedCountries, globeFeedbackLabels, hideMarkers, onGlobePropsChange]);

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

    const center = getVisualCenter(globeRef.current, q.targetCca2);
    if (center) {
      const zoom = getEFZoom(globeRef.current, q.targetCca2);
      const duration = getAdaptiveDuration(globeRef.current.getCurrentZoom(), zoom ?? 1);
      gameFlyTo(globeRef.current, center[0], center[1], zoom, duration, q.type);
    }
  }, [session.currentQuestion, globeRef, flyOutStep]);

  // Para tipos A/B: zoom out automático al nivel continental si el objetivo no es visible.
  // Evita que el usuario quede desorientado tras un flyTo al país correcto en la pregunta anterior.
  // Si el globo está animando (flyTo continental en progreso), diferir la evaluación para evitar
  // race conditions con isPointVisible() evaluado desde una posición intermedia.
  useEffect(() => {
    const q = session.currentQuestion;
    if (!q || (q.type !== 'A' && q.type !== 'B')) return;
    if (!globeRef.current || !session.continent) return;
    // Solo actuar si no estamos en feedback (pregunta nueva)
    if (session.feedbackState !== 'idle') return;
    if (feedbackStep !== 'idle') return;

    const evaluate = () => {
      if (!globeRef.current || !session.continent) return;

      // Obtener coordenadas del objetivo (hull center para archipiélagos)
      let targetCoords: [number, number] | null = null;
      if (q.type === 'A') {
        targetCoords = getVisualCenter(globeRef.current, q.targetCca2);
      } else {
        // Tipo B: coordenadas de la capital
        const cap = capitals.get(q.targetCca2);
        if (cap) targetCoords = [cap.latlng[1], cap.latlng[0]];
      }

      if (!targetCoords) return;
      // Si ya es visible → no hacer nada
      if (globeRef.current.isPointVisible(targetCoords[0], targetCoords[1])) return;

      // Calcular distancia angular desde el centro de vista al objetivo
      const dist = globeRef.current.distanceFromCenter(targetCoords[0], targetCoords[1]);
      const continentZoom = CONTINENT_ZOOM[session.continent];

      // Zoom necesario para que el objetivo sea visible desde la posición actual.
      // Derivado de: dist < arcsin(1/zoom) × MARGIN → zoom = 1/sin(dist/MARGIN)
      // Margen 0.55 (menor que el 0.8 de isPointVisible) para que el objetivo
      // quede cómodamente dentro de la vista, no en el borde.
      const ZOOM_MARGIN = 0.70;
      const sinVal = Math.sin(dist / ZOOM_MARGIN);
      const neededZoom = sinVal > 0.01 ? 1 / sinVal : continentZoom;

      if (neededZoom > continentZoom) {
        // Objetivo cercano: zoom out proporcional desde la posición actual
        const center = globeRef.current.getViewCenter();
        globeRef.current.flyTo(center[0], center[1], neededZoom, 800);
      } else {
        // Objetivo lejano: volar a punto intermedio entre centro continental y objetivo
        // para evitar zoom-out excesivo en países extremos (ej. Japón, Filipinas)
        const [cLon, cLat] = CONTINENT_CENTERS[session.continent];
        // Normalizar delta para cruzar antimeridiano por camino más corto
        // (ej. Oceanía 160°E → Samoa -172°W: delta naïve -332° → normalizado 28°)
        let deltaLon = targetCoords[0] - cLon;
        if (deltaLon > 180) deltaLon -= 360;
        if (deltaLon < -180) deltaLon += 360;
        const midLon = cLon + deltaLon / 2;
        const midLat = (cLat + targetCoords[1]) / 2;
        const distFromMid = geoDistance(targetCoords, [midLon, midLat]);
        const sinFromMid = Math.sin(distFromMid / ZOOM_MARGIN);
        const zoomFromMid = sinFromMid > 0.01 ? 1 / sinFromMid : continentZoom;
        const finalZoom = Math.min(continentZoom, zoomFromMid);
        globeRef.current.flyTo(midLon, midLat, finalZoom, 800);
      }
    };

    // Si el globo está animando (ej. flyTo continental al inicio de sesión),
    // diferir la evaluación para que isPointVisible() use la posición final.
    if (globeRef.current.isAnimating()) {
      const timer = setTimeout(evaluate, 1100);
      return () => clearTimeout(timer);
    }

    evaluate();
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

      // Tolerancia geográfica: si tocamos un vecino pero estamos más cerca del target
      if (cca2 !== q.targetCca2 && globeRef.current) {
        const tapCoords = globeRef.current.getLastTapCoords();
        const targetCentroid = globeRef.current.getCentroid(q.targetCca2);
        if (tapCoords && targetCentroid) {
          const zoom = globeRef.current.getCurrentZoom();
          const tolerance = getHitTolerance(zoom);
          const distCentroidTarget = geoDistance(tapCoords, targetCentroid);
          const distBoundaryTarget = globeRef.current.getMinDistanceToBoundary(q.targetCca2, tapCoords);
          const distToTarget = distBoundaryTarget !== null
            ? Math.min(distCentroidTarget, distBoundaryTarget)
            : distCentroidTarget;
          const allCentroids = globeRef.current.getAllCentroids();
          if (distToTarget < tolerance && isTargetNearest(tapCoords, q.targetCca2, distToTarget, allCentroids)) {
            cca2 = q.targetCca2;
          }
        }
      }

      const result = session.submitAnswer(cca2);

      // En acierto: mostrar el país completo si no está bien centrado
      if (result === 'correct' && globeRef.current) {
        centerOnCorrectAnswer(globeRef.current, q.targetCca2, q.type);
      }

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
            questionType: q.type,
          };
          setFeedbackStep('step1');
        }
      }
    },
    [session, globeRef],
  );

  // Tap en océano durante el juego: tolerancia para taps cerca del objetivo
  const handleOceanClick = useCallback(() => {
    const q = session.currentQuestion;
    if (!q || !session.isActive) return;
    if (q.type !== 'A' && q.type !== 'B') return;
    if (!globeRef.current) return;

    const tapCoords = globeRef.current.getLastTapCoords();
    if (!tapCoords) return;

    const zoom = globeRef.current.getCurrentZoom();
    const tolerance = getHitTolerance(zoom);
    const allCentroids = globeRef.current.getAllCentroids();

    // Buscar el país más cercano al tap (centroide)
    let nearestCca2: string | null = null;
    let nearestDist = Infinity;
    for (const [cca2, centroid] of allCentroids) {
      const d = geoDistance(tapCoords, centroid);
      if (d < nearestDist) {
        nearestDist = d;
        nearestCca2 = cca2;
      }
    }

    // Refinar con distancia a frontera del país más cercano
    if (nearestCca2) {
      const boundaryDist = globeRef.current.getMinDistanceToBoundary(nearestCca2, tapCoords);
      if (boundaryDist !== null && boundaryDist < nearestDist) {
        nearestDist = boundaryDist;
      }
    }

    // Si no hay país cercano dentro de la tolerancia → océano vacío, ignorar
    if (!nearestCca2 || nearestDist >= tolerance) return;

    // Tolerancia microestado-contenedor
    const pair = [nearestCca2, q.targetCca2].sort().join('-');
    if (MICROSTATE_PAIRS.has(pair)) nearestCca2 = q.targetCca2;

    // Enviar como respuesta (correcta o incorrecta)
    const answeredCca2 = nearestCca2 === q.targetCca2 ? q.targetCca2 : nearestCca2;
    const result = session.submitAnswer(answeredCca2);

    if (result === 'correct' && globeRef.current) {
      centerOnCorrectAnswer(globeRef.current, q.targetCca2, q.type);
    }
    if (result === 'incorrect' && globeRef.current) {
      const correctCoords = globeRef.current.getCentroid(q.targetCca2);
      const wrongCoords = nearestCca2 !== q.targetCca2
        ? globeRef.current.getCentroid(nearestCca2) ?? tapCoords
        : tapCoords;
      if (correctCoords) {
        feedbackCoordsRef.current = {
          wrongCca2: answeredCca2,
          wrongCoords,
          correctCca2: q.targetCca2,
          correctCoords,
          questionType: q.type,
        };
        setFeedbackStep('step1');
      }
    }
  }, [session, globeRef]);

  // Registrar handlers en refs para bridge con App.tsx
  onCountryClickRef.current = handleCountryClick;
  onCountryDeselectRef.current = handleOceanClick;

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

      // Verificar si el tipo/modo ya está completado
      const def = levels.get(`${level}-${continent}`);
      if (def) {
        const att = getAttemptsWithInheritance(
          getAttempts(level, continent),
          level, continent, getStamps, getCountriesForLevel,
        );
        const qt = questionType ?? 'mixed';
        const dominated = qt === 'mixed'
          ? isTypeFullyDominated(att, def.countries, 'A') && isTypeFullyDominated(att, def.countries, 'B')
          : isTypeFullyDominated(att, def.countries, qt as QuestionType);
        if (dominated) {
          setAlreadyDominatedType(qt);
          setShowAlreadyDominated(true);
          return;
        }
      }

      session.start(level, continent, questionType);
      setScreen('playing');
      setSelectedChoice(null);

      // Zoom al continente para que llene la pantalla
      if (globeRef.current) {
        const [lon, lat] = CONTINENT_CENTERS[continent];
        globeRef.current.flyTo(lon, lat, CONTINENT_ZOOM[continent], 1000);
      }
    },
    [session, globeRef, levels, getAttempts, getStamps, setLastPlayed],
  );

  // Selección de opción en ChoicePanel (tipos C-F)
  const handleChoiceSelect = useCallback(
    (answer: string) => {
      if (session.feedbackState !== 'idle' || flyOutStep !== 'idle') return;
      setSelectedChoice(answer);
      const q = session.currentQuestion;
      const result = session.submitAnswer(answer);

      lastChoiceFlyToDurationRef.current = 0;

      if (result === 'incorrect' && q && globeRef.current) {
        // En error: flyTo al país correcto con zoom de contexto
        const isEF = q.type === 'E' || q.type === 'F';
        const center = isEF
          ? getVisualCenter(globeRef.current, q.targetCca2)
          : globeRef.current.getCentroid(q.targetCca2);
        if (center) {
          const zoom = isEF
            ? getEFZoom(globeRef.current, q.targetCca2)
            : getCDZoom(globeRef.current, q.targetCca2);
          const duration = getAdaptiveDuration(globeRef.current.getCurrentZoom(), zoom ?? 1);
          gameFlyTo(globeRef.current, center[0], center[1], zoom, duration, q.type);
        }
      } else if (result === 'correct' && q && (q.type === 'C' || q.type === 'D') && globeRef.current) {
        // Acierto en C/D: flyTo al centroide (no capital) para que el país no quede tapado por ChoicePanel
        const centroid = globeRef.current.getCentroid(q.targetCca2);
        if (centroid) {
          const zoom = getCDZoom(globeRef.current, q.targetCca2);
          const duration = getAdaptiveDuration(globeRef.current.getCurrentZoom(), zoom ?? 1);
          lastChoiceFlyToDurationRef.current = duration;
          gameFlyTo(globeRef.current, centroid[0], centroid[1], zoom, duration, q.type);
        }
      }
    },
    [session, globeRef, capitals],
  );

  // Fin de animación de feedback → iniciar zoom out intermedio (solo C-F; A/B usa la secuencia de pasos)
  const handleFeedbackEnd = useCallback(() => {
    const doZoomOut = () => {
      if (globeRef.current && session.continent) {
        // Zoom out al continente para dar perspectiva antes de la siguiente pregunta
        const [lon, lat] = CONTINENT_CENTERS[session.continent];
        const targetZoom = CONTINENT_ZOOM[session.continent];
        const duration = getAdaptiveDuration(globeRef.current.getCurrentZoom(), targetZoom);
        flyOutDurationRef.current = duration;
        globeRef.current.flyTo(lon, lat, targetZoom, duration);
        setFlyOutStep('zoomingOut');
        setSelectedChoice(null);
      } else {
        // Fallback: avanzar directamente
        session.nextQuestion();
        setSelectedChoice(null);
      }
    };

    // En C/D acierto, garantizar al menos 800ms de descanso sobre el país
    const flyToDur = lastChoiceFlyToDurationRef.current;
    const extraDelay = Math.max(0, flyToDur + 800 - 1200);
    lastChoiceFlyToDurationRef.current = 0;

    if (extraDelay > 0) {
      setTimeout(doZoomOut, extraDelay);
    } else {
      doZoomOut();
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
      setShowPoolExhausted(false);
      session.startStampTest(level, continent, stampType);
      setLastStampPlayed(continent, level);
      setScreen('playing');
      onStampTestStarted?.();

      // Zoom al continente
      if (globeRef.current) {
        const [lon, lat] = CONTINENT_CENTERS[continent];
        globeRef.current.flyTo(lon, lat, CONTINENT_ZOOM[continent], 1000);
      }
    },
    [session, globeRef, setLastStampPlayed, onStampTestStarted],
  );

  // Lanzar prueba de sello directamente (desde Pasaporte via props)
  const handleStampTestRequest = useCallback(
    (req: StampTestRequest) => {
      activeLevelRef.current = req.level;
      activeContinentRef.current = req.continent;
      activeQuestionTypeRef.current = req.stampType === 'countries' ? 'A' : 'B';

      session.startStampTest(req.level, req.continent, req.stampType);
      setLastStampPlayed(req.continent, req.level);
      setScreen('playing');
      setSelectedChoice(null);

      if (globeRef.current) {
        const [lon, lat] = CONTINENT_CENTERS[req.continent];
        globeRef.current.flyTo(lon, lat, CONTINENT_ZOOM[req.continent], 1000);
      }
    },
    [session, globeRef, setLastStampPlayed],
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
    // Capturar info del sello ganado antes de limpiar la sesión
    const earned = session.stampTestResult === 'passed' && session.level && session.continent && session.stampTestType
      ? { level: session.level, continent: session.continent, stampType: session.stampTestType }
      : undefined;

    setShowStampResult(false);
    session.end();
    activeLevelRef.current = null;
    activeContinentRef.current = null;
    activeQuestionTypeRef.current = 'mixed';
    setScreen('selector');
    setSelectedChoice(null);
    setFlyOutStep('idle');
    onStampTestDone?.(earned);
  }, [session, onStampTestDone]);

  // Abrir modal de sello desde el selector (sin sesión activa aún)
  const handleSelectorStampClick = useCallback(
    (level: GameLevel, continent: Continent) => {
      activeLevelRef.current = level;
      activeContinentRef.current = continent;
      activeQuestionTypeRef.current = 'mixed';
      setLastPlayed(continent, level);
      // Acceso directo: si solo falta 1 sello, lanzar prueba sin modal
      const stamps = getStamps(level, continent);
      if (stamps.countries && !stamps.capitals) {
        handleStartStampTest('capitals');
      } else if (!stamps.countries && stamps.capitals) {
        handleStartStampTest('countries');
      } else {
        setShowStampChooser(true);
      }
    },
    [setLastPlayed, getStamps, handleStartStampTest],
  );

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
    setShowStampResult(false);
    setShowPoolExhausted(false);
  }, [session]);

  // Reset al selector cuando se re-toca el tab Jugar
  useEffect(() => {
    if (resetSignal && screen !== 'selector') {
      handleExit();
    }
  }, [resetSignal]); // eslint-disable-line react-hooks/exhaustive-deps

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
          // Zoom de contexto: muestra el país correcto con sus vecinos
          const zoom = getEFZoom(globeRef.current, coords.correctCca2);
          gameFlyTo(globeRef.current, coords.correctCoords[0], coords.correctCoords[1], zoom, 600, coords.questionType);
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

    // Esperar a que termine la animación de flyTo + pausa (400ms),
    // luego avanzar pregunta e iniciar zoom in
    const timer = setTimeout(() => {
      session.nextQuestion();
      setFlyOutStep('zoomingIn');
    }, flyOutDurationRef.current + 400);

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

    const center = getVisualCenter(globeRef.current, q.targetCca2);
    if (center) {
      const zoom = getEFZoom(globeRef.current, q.targetCca2);
      const duration = getAdaptiveDuration(globeRef.current.getCurrentZoom(), zoom ?? 1);
      gameFlyTo(globeRef.current, center[0], center[1], zoom, duration, q.type);
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
    return calculateProgress(att, def.countries, mode, getInheritedCountries());
    // session.score en deps para recalcular tras cada respuesta
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
    if (qt === 'mixed' || qt === 'A' || qt === 'B') return null;
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
      <>
        <LevelSelector
          levels={levels}
          onStart={handleStart}
          onContinentSelect={handleContinentSelect}
          onStampBannerClick={handleSelectorStampClick}
        />
        {/* Modal: elegir tipo de sello (accesible desde el banner del selector) */}
        {showStampChooser && (
          <div className="jugar-modal-overlay">
            <div className="jugar-modal">
              <h3 className="jugar-modal__title">{t('modal.stampChooser.title')}</h3>
              <p className="jugar-modal__text">
                {t('modal.stampChooser.text', { count: levels.get(`${activeLevelRef.current}-${activeContinentRef.current}`)?.countries.length ?? '?' })}
              </p>
              <div className="jugar-modal__buttons">
                <button
                  className="jugar-modal__btn jugar-modal__btn--countries"
                  onClick={() => handleStartStampTest('countries')}
                >
                  {t('stamp.countries')}
                </button>
                <button
                  className="jugar-modal__btn jugar-modal__btn--capitals"
                  onClick={() => handleStartStampTest('capitals')}
                >
                  {t('stamp.capitals')}
                </button>
              </div>
              <button
                className="jugar-modal__cancel"
                onClick={() => setShowStampChooser(false)}
              >
                {t('common:cancel')}
              </button>
            </div>
          </div>
        )}
        {/* Modal: tipo/modo ya completado */}
        {showAlreadyDominated && (() => {
          const level = activeLevelRef.current;
          const continent = activeContinentRef.current;
          const qt = alreadyDominatedType;
          const stamps = level && continent ? getStamps(level, continent) : { countries: true, capitals: true };
          const isAB = qt === 'A' || qt === 'B';
          const typeLabel = qt !== 'mixed' ? t(`common:questionType.${qt}`) : '';

          // Rama Aventura
          if (qt === 'mixed') {
            const bothEarned = stamps.countries && stamps.capitals;
            const continentLabel = continent ? t(`common:continent.${continent}`) : '';
            const levelLabel = level ? t(`common:level.${level}`) : '';
            return (
              <div className="jugar-modal-overlay">
                <div className="jugar-modal">
                  <h3 className="jugar-modal__title">{t('modal.poolExhausted.trainingComplete')}</h3>
                  <p className="jugar-modal__text">
                    {bothEarned
                      ? <span dangerouslySetInnerHTML={{ __html: t('modal.poolExhausted.completedText', { continent: continentLabel, level: levelLabel }) }} />
                      : <span dangerouslySetInnerHTML={{ __html: t('modal.alreadyDominated.completedTraining', { continent: continentLabel, level: levelLabel }) }} />
                    }
                  </p>
                  <div className="jugar-modal__buttons">
                    {!stamps.countries && (
                      <button
                        className="jugar-modal__btn jugar-modal__btn--countries"
                        onClick={() => { setShowAlreadyDominated(false); handleStartStampTest('countries'); }}
                      >
                        {t('stamp.countries')}
                      </button>
                    )}
                    {!stamps.capitals && (
                      <button
                        className="jugar-modal__btn jugar-modal__btn--capitals"
                        onClick={() => { setShowAlreadyDominated(false); handleStartStampTest('capitals'); }}
                      >
                        {t('stamp.capitals')}
                      </button>
                    )}
                    <button
                      className="jugar-modal__btn jugar-modal__btn--primary"
                      onClick={() => { setShowAlreadyDominated(false); onNavigateStats?.(); }}
                    >
                      {t('modal.alreadyDominated.goToStats')}
                    </button>
                    <button className="jugar-modal__cancel" onClick={() => setShowAlreadyDominated(false)}>
                      {t('modal.poolExhausted.selectOther')}
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // Rama A/B
          if (isAB) {
            const stampType = qt === 'A' ? 'countries' : 'capitals';
            const hasStamp = qt === 'A' ? stamps.countries : stamps.capitals;
            return (
              <div className="jugar-modal-overlay">
                <div className="jugar-modal">
                  <h3 className="jugar-modal__title" dangerouslySetInnerHTML={{ __html: t('modal.alreadyDominated.title', { type: typeLabel }) }} />
                  <p className="jugar-modal__text">
                    {t('modal.alreadyDominated.allCorrect')}
                  </p>
                  <div className="jugar-modal__buttons">
                    {!hasStamp && (
                      <button
                        className={`jugar-modal__btn jugar-modal__btn--${stampType}`}
                        onClick={() => { setShowAlreadyDominated(false); handleStartStampTest(stampType); }}
                      >
                        {t('modal.alreadyDominated.tryStamp')}
                      </button>
                    )}
                    <button
                      className="jugar-modal__btn jugar-modal__btn--primary"
                      onClick={() => { setShowAlreadyDominated(false); onNavigateStats?.(); }}
                    >
                      {t('modal.alreadyDominated.goToStats')}
                    </button>
                    <button className="jugar-modal__cancel" onClick={() => setShowAlreadyDominated(false)}>
                      {t('modal.poolExhausted.selectOther')}
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // Rama E/C/D/F
          return (
            <div className="jugar-modal-overlay">
              <div className="jugar-modal">
                <h3 className="jugar-modal__title" dangerouslySetInnerHTML={{ __html: t('modal.alreadyDominated.title', { type: typeLabel }) }} />
                <p className="jugar-modal__text">
                  {t('modal.alreadyDominated.allCorrect')}
                </p>
                <div className="jugar-modal__buttons">
                  <button
                    className="jugar-modal__btn jugar-modal__btn--primary"
                    onClick={() => { setShowAlreadyDominated(false); onNavigateStats?.(); }}
                  >
                    {t('modal.alreadyDominated.goToStats')}
                  </button>
                  <button className="jugar-modal__cancel" onClick={() => setShowAlreadyDominated(false)}>
                    {t('modal.poolExhausted.selectOther')}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </>
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
      <div className="game-bottom-group">
        {question && (
          <QuestionBanner prompt={question.prompt} type={question.type} />
        )}
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
        <ProgressBar
          progressCurrent={session.stampTestProgress ? session.stampTestProgress.current : progress.current}
          progressTotal={session.stampTestProgress ? session.stampTestProgress.total : progress.total}
          score={session.score}
          isAdventure={activeQuestionTypeRef.current === 'mixed'}
          isStampTest={session.stampTestResult === 'in_progress'}
          stampTestType={session.stampTestType}
        />
      </div>

      <GameFeedback
        state={session.feedbackState}
        onAnimationEnd={isABQuestion ? handleFeedbackEndAB : handleFeedbackEnd}
        skipTimer={isABQuestion && session.feedbackState === 'incorrect'}
        geoFeedback={isABQuestion && session.feedbackState === 'incorrect'}
      />

      {/* Modal: elegir tipo de sello */}
      {showStampChooser && (() => {
        const stamps = activeLevelRef.current && activeContinentRef.current
          ? getStamps(activeLevelRef.current, activeContinentRef.current)
          : { countries: true, capitals: true };
        return (
        <div className="jugar-modal-overlay">
          <div className="jugar-modal">
            <h3 className="jugar-modal__title">{t('modal.stampChooser.title')}</h3>
            <p className="jugar-modal__text">
              {t('modal.poolExhausted.chooseStamp')}
            </p>
            <div className="jugar-modal__buttons">
              {!stamps.countries && (
                <button
                  className="jugar-modal__btn jugar-modal__btn--countries"
                  onClick={() => handleStartStampTest('countries')}
                >
                  {t('stamp.countries')}
                </button>
              )}
              {!stamps.capitals && (
                <button
                  className="jugar-modal__btn jugar-modal__btn--capitals"
                  onClick={() => handleStartStampTest('capitals')}
                >
                  {t('stamp.capitals')}
                </button>
              )}
            </div>
            <button
              className="jugar-modal__cancel"
              onClick={() => setShowStampChooser(false)}
            >
              {t('common:cancel')}
            </button>
          </div>
        </div>
        );
      })()}

      {/* Modal: resultado de prueba de sello */}
      {showStampResult && (
        <div className="jugar-modal-overlay">
          <div className="jugar-modal">
            {session.stampTestResult === 'passed' ? (
              <>
                <div
                  className={[
                    'jugar-modal__stamp-icon',
                    'jugar-modal__stamp-icon--earned',
                    session.stampTestType === 'capitals' && 'jugar-modal__stamp-icon--capitals',
                  ].filter(Boolean).join(' ')}
                  style={{ '--stamp-color': session.continent ? `var(${CONTINENT_CSS_VAR[session.continent]})` : 'var(--color-text-secondary)' } as React.CSSProperties}
                />
                <h3 className="jugar-modal__title">{t('modal.stampEarned.title')}</h3>
                <p className="jugar-modal__text">
                  {t('modal.stampEarned.text', { correct: session.score.correct, total: session.score.correct + session.score.incorrect })}
                </p>
              </>
            ) : (() => {
              const total = session.score.correct + session.score.incorrect;
              const pct = total > 0 ? (session.score.correct / total) * 100 : 0;
              const { title, encouragement } = pct >= 90
                ? { title: t('modal.stampFailed.veryClose'), encouragement: t('modal.stampFailed.veryCloseText') }
                : pct >= 70
                ? { title: t('modal.stampFailed.goodTry'), encouragement: t('modal.stampFailed.goodTryText') }
                : pct >= 50
                ? { title: t('modal.stampFailed.onTrack'), encouragement: t('modal.stampFailed.onTrackText') }
                : { title: t('modal.stampFailed.dontGiveUp'), encouragement: t('modal.stampFailed.dontGiveUpText') };
              return (
                <>
                  <h3 className="jugar-modal__title">{title}</h3>
                  <p className="jugar-modal__text">
                    {t('modal.stampFailed.score', { correct: session.score.correct, total })}<br />
                    {encouragement}
                  </p>
                </>
              );
            })()}
            <button
              className="jugar-modal__btn jugar-modal__btn--primary"
              onClick={handleStampResultClose}
            >
              {t('common:continue')}
            </button>
          </div>
        </div>
      )}

      {/* Modal: pool de preguntas agotado */}
      {showPoolExhausted && (() => {
        const qt = activeQuestionTypeRef.current;
        const isAB = qt === 'A' || qt === 'B';
        const typeLabel = qt !== 'mixed' ? t(`common:questionType.${qt}`) : '';

        // Rama Aventura — invitación a prueba de sello
        if (qt === 'mixed') {
          const stamps = activeLevelRef.current && activeContinentRef.current
            ? getStamps(activeLevelRef.current, activeContinentRef.current)
            : { countries: true, capitals: true };
          const bothEarned = stamps.countries && stamps.capitals;
          const continentLabel = activeContinentRef.current ? t(`common:continent.${activeContinentRef.current}`) : '';
          const levelLabel = activeLevelRef.current ? t(`common:level.${activeLevelRef.current}`) : '';
          return (
            <div className="jugar-modal-overlay">
              <div className="jugar-modal">
                <h3 className="jugar-modal__title">
                  {bothEarned
                    ? t('modal.poolExhausted.trainingComplete')
                    : <span dangerouslySetInnerHTML={{ __html: t('modal.poolExhausted.readyForStamp') }} />
                  }
                </h3>
                <p className="jugar-modal__text">
                  {bothEarned
                    ? <span dangerouslySetInnerHTML={{ __html: t('modal.poolExhausted.completedText', { continent: continentLabel, level: levelLabel }) }} />
                    : t('modal.poolExhausted.chooseStamp')
                  }
                </p>
                <div className="jugar-modal__buttons">
                  {!stamps.countries && (
                    <button
                      className="jugar-modal__btn jugar-modal__btn--countries"
                      onClick={() => handleStartStampTest('countries')}
                    >
                      {t('stamp.countries')}
                    </button>
                  )}
                  {!stamps.capitals && (
                    <button
                      className="jugar-modal__btn jugar-modal__btn--capitals"
                      onClick={() => handleStartStampTest('capitals')}
                    >
                      {t('stamp.capitals')}
                    </button>
                  )}
                  <button className="jugar-modal__cancel" onClick={handlePoolExhaustedClose}>
                    {t('modal.poolExhausted.selectOther')}
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // Rama A/B — invitación a sello o felicitación
        if (isAB) return (
          <div className="jugar-modal-overlay">
            <div className="jugar-modal">
              <h3 className="jugar-modal__title" dangerouslySetInnerHTML={{ __html: t('modal.poolExhausted.typePassed', { type: typeLabel }) }} />
              {readyForStampType && (
                <p className="jugar-modal__text">
                  {t('modal.poolExhausted.stampReady')}
                </p>
              )}
              <div className="jugar-modal__buttons">
                {readyForStampType && (
                  <button
                    className={`jugar-modal__btn jugar-modal__btn--${readyForStampType === 'countries' ? 'countries' : 'capitals'}`}
                    onClick={() => handleStartStampTest(readyForStampType)}
                  >
                    {readyForStampType === 'countries' ? t('modal.poolExhausted.tryStamp.countries') : t('modal.poolExhausted.tryStamp.capitals')}
                  </button>
                )}
                <button className="jugar-modal__cancel" onClick={handlePoolExhaustedClose}>
                  {t('modal.poolExhausted.selectOther')}
                </button>
              </div>
            </div>
          </div>
        );

        // Rama E/C/D/F — felicitación con sugerencia de progresión
        return (
          <div className="jugar-modal-overlay">
            <div className="jugar-modal">
              <h3 className="jugar-modal__title" dangerouslySetInnerHTML={{ __html: t('modal.poolExhausted.typePassed', { type: typeLabel }) }} />
              <div className="jugar-modal__buttons">
                {nextSuggestedType && (
                  <button
                    className="jugar-modal__btn"
                    onClick={() => handleStartSuggestedType(nextSuggestedType)}
                    dangerouslySetInnerHTML={{ __html: t('modal.poolExhausted.playType', { type: t(`common:questionType.${nextSuggestedType}`) }) }}
                  />
                )}
                {nextSuggestedType !== null && (
                  <button
                    className="jugar-modal__btn"
                    onClick={handleStartAdventure}
                    dangerouslySetInnerHTML={{ __html: t('modal.poolExhausted.playAdventure') }}
                  />
                )}
                <button className="jugar-modal__cancel" onClick={handlePoolExhaustedClose}>
                  {t('modal.poolExhausted.selectOther')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
