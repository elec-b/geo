// JugarView — contenedor principal de la experiencia Jugar
// Gestiona el flujo selector → juego y el bridge con el globo.
import { useState, useCallback, useMemo, useEffect, useRef, type RefObject, type MutableRefObject } from 'react';
import type { GlobeD3Ref, FeedbackLabel } from '../Globe';
import type { GlobeControlProps } from '../Explore/ExploreView';
import type { CountryFeature } from '../../data/countries';
import type { GameQuestionChoice, QuestionTypeFilter } from '../../data/gameQuestions';
import type { CountryData, CapitalCoords, Continent, GameLevel, LevelDefinition } from '../../data/types';
import { CONTINENT_CENTERS, CONTINENT_ZOOM } from '../../data/continents';
import { NON_UN_TERRITORIES_BY_NAME } from '../../data/isoMapping';
import { useGameSession } from '../../hooks/useGameSession';
import { LevelSelector } from './LevelSelector';
import { QuestionBanner } from './QuestionBanner';
import { GameFeedback } from './GameFeedback';
import { ScoreBar } from './ScoreBar';
import { ChoicePanel } from './ChoicePanel';
import './JugarView.css';

type JugarScreen = 'selector' | 'playing';
type FeedbackStep = 'idle' | 'step1' | 'step2';

interface JugarViewProps {
  globeRef: RefObject<GlobeD3Ref | null>;
  countries: Map<string, CountryData>;
  capitals: Map<string, CapitalCoords>;
  levels: Map<string, LevelDefinition>;
  onGlobePropsChange: (props: GlobeControlProps) => void;
  /** Ref donde se registra el handler de click en país (bridge con App.tsx) */
  onCountryClickRef: MutableRefObject<((f: CountryFeature) => void) | undefined>;
}

export function JugarView({
  globeRef,
  countries,
  capitals,
  levels,
  onGlobePropsChange,
  onCountryClickRef,
}: JugarViewProps) {
  const [screen, setScreen] = useState<JugarScreen>('selector');
  const session = useGameSession(levels, countries, capitals);

  // Respuesta seleccionada para feedback visual en ChoicePanel
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // Secuencia de dos pasos para feedback geográfico en tipos A/B (error)
  const [feedbackStep, setFeedbackStep] = useState<FeedbackStep>('idle');
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

  // --- Sincronización de props del globo ---

  useEffect(() => {
    onGlobePropsChange({
      selectedCountryCca2: session.correctCca2,
      capitalPins,
      highlightedCountries,
      showCountryLabels: false,
      showCapitalLabels: false,
      capitalLabelsData: null,
      feedbackLabels: globeFeedbackLabels,
    });
  }, [session.correctCca2, capitalPins, highlightedCountries, globeFeedbackLabels, onGlobePropsChange]);

  // Reset al desmontar (cambio de tab)
  useEffect(() => {
    return () => {
      onGlobePropsChange({
        selectedCountryCca2: null,
        capitalPins: [],
        highlightedCountries: null,
        showCountryLabels: false,
        showCapitalLabels: false,
        capitalLabelsData: null,
        feedbackLabels: null,
      });
    };
  }, [onGlobePropsChange]);

  // Para tipos E/F: flyTo al país al cargar la pregunta
  useEffect(() => {
    const q = session.currentQuestion;
    if (!q || (q.type !== 'E' && q.type !== 'F')) return;
    if (!globeRef.current) return;

    const centroid = globeRef.current.getCentroid(q.targetCca2);
    if (centroid) {
      globeRef.current.flyTo(centroid[0], centroid[1], undefined, 600);
    }
  }, [session.currentQuestion, globeRef]);

  // --- Handlers ---

  // Click en un país del globo durante el juego (solo tipos A/B)
  const handleCountryClick = useCallback(
    (feature: CountryFeature) => {
      const cca2 = feature.properties?.cca2;
      if (!cca2 || !session.isActive) return;

      // Ignorar clicks en globo para tipos C-F
      const q = session.currentQuestion;
      if (!q || (q.type !== 'A' && q.type !== 'B')) return;

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
      if (session.feedbackState !== 'idle') return;
      setSelectedChoice(answer);
      const q = session.currentQuestion;
      const result = session.submitAnswer(answer);

      if (result === 'incorrect' && q && globeRef.current) {
        // En error: flyTo al país correcto
        const centroid = globeRef.current.getCentroid(q.targetCca2);
        if (centroid) {
          globeRef.current.flyTo(centroid[0], centroid[1], undefined, 600);
        }
      } else if (result === 'correct' && q && (q.type === 'C' || q.type === 'D') && globeRef.current) {
        // Acierto en C/D: flyTo a la capital para asociar visualmente
        const cap = capitals.get(q.targetCca2);
        if (cap) {
          globeRef.current.flyTo(cap.latlng[1], cap.latlng[0], undefined, 600);
        }
      }
    },
    [session, globeRef, capitals],
  );

  // Fin de animación de feedback → siguiente pregunta (solo C-F; A/B usa la secuencia de pasos)
  const handleFeedbackEnd = useCallback(() => {
    session.nextQuestion();
    setSelectedChoice(null);
  }, [session]);

  // Resetear feedbackStep cuando hay acierto en A/B (el timer de GameFeedback avanza normalmente)
  const handleFeedbackEndAB = useCallback(() => {
    session.nextQuestion();
    setSelectedChoice(null);
    setFeedbackStep('idle');
    feedbackCoordsRef.current = null;
  }, [session]);

  // Salir de la partida
  const handleExit = useCallback(() => {
    session.end();
    setScreen('selector');
    setSelectedChoice(null);
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
          globeRef.current.flyTo(coords.correctCoords[0], coords.correctCoords[1], undefined, 600);
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
          disabled={session.feedbackState !== 'idle'}
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
        hideIcon={isABQuestion && feedbackStep === 'step2'}
      />

      <ScoreBar score={session.score} onExit={handleExit} />
    </>
  );
}
