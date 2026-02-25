// JugarView — contenedor principal de la experiencia Jugar
// Gestiona el flujo selector → juego y el bridge con el globo.
import { useState, useCallback, useMemo, useEffect, type RefObject, type MutableRefObject } from 'react';
import type { GlobeD3Ref } from '../Globe';
import type { GlobeControlProps } from '../Explore/ExploreView';
import type { CountryFeature } from '../../data/countries';
import type { GameQuestionChoice } from '../../data/gameQuestions';
import type { CountryData, CapitalCoords, Continent, LevelDefinition } from '../../data/types';
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

  // --- Sincronización de props del globo ---

  useEffect(() => {
    onGlobePropsChange({
      selectedCountryCca2: session.correctCca2,
      capitalPin: null,
      highlightedCountries,
      showCountryLabels: false,
      showCapitalLabels: false,
      capitalLabelsData: null,
    });
  }, [session.correctCca2, highlightedCountries, onGlobePropsChange]);

  // Reset al desmontar (cambio de tab)
  useEffect(() => {
    return () => {
      onGlobePropsChange({
        selectedCountryCca2: null,
        capitalPin: null,
        highlightedCountries: null,
        showCountryLabels: false,
        showCapitalLabels: false,
        capitalLabelsData: null,
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

      // En error: flyTo al país correcto para que el usuario lo vea
      if (result === 'incorrect' && q && globeRef.current) {
        const centroid = globeRef.current.getCentroid(q.targetCca2);
        if (centroid) {
          globeRef.current.flyTo(centroid[0], centroid[1], undefined, 600);
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
    (level: Parameters<typeof session.start>[0], continent: Parameters<typeof session.start>[1]) => {
      session.start(level, continent);
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
      const result = session.submitAnswer(answer);

      // En error: flyTo al país correcto
      if (result === 'incorrect' && session.currentQuestion && globeRef.current) {
        const centroid = globeRef.current.getCentroid(session.currentQuestion.targetCca2);
        if (centroid) {
          globeRef.current.flyTo(centroid[0], centroid[1], undefined, 600);
        }
      }
    },
    [session, globeRef],
  );

  // Fin de animación de feedback → siguiente pregunta
  const handleFeedbackEnd = useCallback(() => {
    session.nextQuestion();
    setSelectedChoice(null);
  }, [session]);

  // Salir de la partida
  const handleExit = useCallback(() => {
    session.end();
    setScreen('selector');
    setSelectedChoice(null);
  }, [session]);

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
  // Tipo C-F: pregunta con opciones de texto
  const choiceQuestion =
    question && question.type !== 'A' && question.type !== 'B'
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

      <GameFeedback state={session.feedbackState} onAnimationEnd={handleFeedbackEnd} />

      <ScoreBar score={session.score} onExit={handleExit} />
    </>
  );
}
