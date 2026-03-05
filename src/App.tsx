// GeoExpert - Aplicación principal
import { lazy, Suspense, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { TabBar } from './components/Navigation/TabBar';
import { AppHeader } from './components/Layout/AppHeader';
import { StatsView } from './components/Stats/StatsView';
import { ExploreView, type GlobeControlProps } from './components/Explore/ExploreView';
import { JugarView, type StampTestRequest } from './components/Game/JugarView';
import { PassportView } from './components/Passport/PassportView';
import { ProfileSelector, getNextDefaultName } from './components/Profile/ProfileSelector';
import { ProfileEditor } from './components/Profile/ProfileEditor';
import { loadCountryData, loadCapitals } from './data/countryData';
import { buildRankings, type CountryRankings } from './data/rankings';
import { buildLevelDefinitions } from './data/levels';
import { useAppStore } from './stores/appStore';
import type { GlobeD3Ref } from './components/Globe';
import type { CountryFeature } from './data/countries';
import type { CountryData, CapitalCoords, LevelDefinition } from './data/types';
import type { TabId } from './components/Navigation/types';
import './components/Layout/AppShell.css';

const GlobeD3 = lazy(() => import('./components/Globe/GlobeD3'));

/** Estado inicial de las props controladas del globo */
const DEFAULT_GLOBE_CONTROL: GlobeControlProps = {
  selectedCountryCca2: null,
  capitalPins: [],
  highlightedCountries: null,
  showCountryLabels: false,
  showCapitalLabels: false,
  capitalLabelsData: null,
  feedbackLabels: null,
};

function App() {
  const [globeReady, setGlobeReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('explore');
  const [showStats, setShowStats] = useState(false);
  const showMarkers = useAppStore((s) => s.settings.showMarkers);

  // Datos cargados
  const [countries, setCountries] = useState<Map<string, CountryData> | null>(null);
  const [capitals, setCapitals] = useState<Map<string, CapitalCoords> | null>(null);
  const [rankings, setRankings] = useState<Map<string, CountryRankings> | null>(null);
  const [levels, setLevels] = useState<Map<string, LevelDefinition> | null>(null);

  // Ref del globo (para flyTo)
  const globeRef = useRef<GlobeD3Ref>(null);

  // Props controladas del globo (gestionadas por el tab activo)
  const [globeControl, setGlobeControl] = useState<GlobeControlProps>(DEFAULT_GLOBE_CONTROL);

  // Ref del tab activo (para evitar re-render del globo al cambiar de tab)
  const activeTabRef = useRef<TabId>(activeTab);
  activeTabRef.current = activeTab;

  // Modales de gestión de perfiles
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [editingProfile, setEditingProfile] = useState<import('./stores/types').UserProfile | null>(null);

  // Prueba de sello lanzada desde Pasaporte
  const [stampTestRequest, setStampTestRequest] = useState<StampTestRequest | null>(null);

  // Callback para lanzar prueba de sello desde Pasaporte → cambia a tab Jugar
  const handleStartStampTest = useCallback(
    (level: import('./data/types').GameLevel, continent: import('./data/types').Continent, stampType: import('./hooks/useGameSession').StampTestType) => {
      setStampTestRequest({ level, continent, stampType });
      setActiveTab('play');
    },
    [],
  );

  // Callback cuando la prueba de sello termina → limpiar request
  const handleStampTestDone = useCallback(() => {
    setStampTestRequest(null);
    setActiveTab('passport');
  }, []);

  // Bridge de handlers: cada tab registra sus callbacks aquí
  const exploreClickRef = useRef<((f: CountryFeature) => void) | undefined>(undefined);
  const exploreDeselectRef = useRef<(() => void) | undefined>(undefined);
  const jugarClickRef = useRef<((f: CountryFeature) => void) | undefined>(undefined);

  // Callback estable para el globo (delega al tab activo via refs)
  const handleCountryClick = useCallback((feature: CountryFeature) => {
    if (activeTabRef.current === 'explore') {
      exploreClickRef.current?.(feature);
    } else if (activeTabRef.current === 'play') {
      jugarClickRef.current?.(feature);
    }
  }, []);

  const handleCountryDeselect = useCallback(() => {
    if (activeTabRef.current === 'explore') {
      exploreDeselectRef.current?.();
    }
  }, []);

  const handleGlobeReady = useCallback(() => setGlobeReady(true), []);

  // Precargar datos estáticos en paralelo con el globo
  useEffect(() => {
    Promise.all([loadCountryData(), loadCapitals()]).then(([countriesData, capitalsData]) => {
      const ranksData = buildRankings(countriesData);
      const levelsData = buildLevelDefinitions(countriesData);
      setCountries(countriesData);
      setCapitals(capitalsData);
      setRankings(ranksData);
      setLevels(levelsData);
    });
  }, []);

  // Mapa de poblaciones para prioridad de etiquetas en el globo
  const countryPopulations = useMemo(() => {
    if (!countries) return null;
    const map = new Map<string, number>();
    for (const [cca2, data] of countries) {
      map.set(cca2, data.population);
    }
    return map;
  }, [countries]);

  // Mapa de nombres en español para etiquetas del globo
  const countryNames = useMemo(() => {
    if (!countries) return null;
    const map = new Map<string, string>();
    for (const [cca2, data] of countries) {
      map.set(cca2, data.name);
    }
    return map;
  }, [countries]);

  const dataReady = countries && capitals && rankings && levels;

  return (
    <>
      <LoadingScreen visible={!globeReady} />

      <AppHeader
        onStatsClick={() => setShowStats(true)}
        onAvatarClick={() => setShowProfileSelector(true)}
      />

      {/* Globo: siempre montado, sin wrapper — iOS rompe touch tras re-render si se envuelve */}
      <Suspense fallback={null}>
        <GlobeD3
          ref={globeRef}
          onCountryClick={(activeTab === 'explore' || activeTab === 'play') ? handleCountryClick : undefined}
          onCountryDeselect={(activeTab === 'explore' || activeTab === 'play') ? handleCountryDeselect : undefined}
          onReady={handleGlobeReady}
          showMarkers={globeControl.showMarkers ?? showMarkers}
          selectedCountryCca2={globeControl.selectedCountryCca2}
          selectedCountryColor={globeControl.selectedCountryColor}
          capitalPins={globeControl.capitalPins}
          highlightedCountries={globeControl.highlightedCountries}
          showCountryLabels={globeControl.showCountryLabels}
          showCapitalLabels={globeControl.showCapitalLabels}
          capitalLabelsData={globeControl.capitalLabelsData}
          countryPopulations={countryPopulations}
          countryNames={countryNames}
          feedbackLabels={globeControl.feedbackLabels}
        />
      </Suspense>

      {/* Experiencia Explorar */}
      {activeTab === 'explore' && dataReady && (
        <ExploreView
          globeRef={globeRef}
          countries={countries}
          capitals={capitals}
          rankings={rankings}
          onGlobePropsChange={setGlobeControl}
          onCountryClickRef={exploreClickRef}
          onCountryDeselectRef={exploreDeselectRef}
        />
      )}

      {/* Experiencia Jugar */}
      {activeTab === 'play' && dataReady && (
        <JugarView
          globeRef={globeRef}
          countries={countries}
          capitals={capitals}
          levels={levels}
          onGlobePropsChange={setGlobeControl}
          onCountryClickRef={jugarClickRef}
          stampTestRequest={stampTestRequest}
          onStampTestDone={handleStampTestDone}
        />
      )}

      {activeTab === 'passport' && dataReady && (
        <PassportView
          levels={levels}
          onStartStampTest={handleStartStampTest}
        />
      )}

      {showStats && dataReady && (
        <StatsView
          countries={countries}
          levels={levels}
          onClose={() => setShowStats(false)}
        />
      )}

      {showProfileSelector && (
        <ProfileSelector
          onClose={() => setShowProfileSelector(false)}
          onCreateNew={() => {
            setEditingProfile(null);
            setShowProfileEditor(true);
          }}
          onEdit={(profile) => {
            setEditingProfile(profile);
            setShowProfileEditor(true);
          }}
        />
      )}

      {showProfileEditor && (
        <ProfileEditor
          editProfile={editingProfile ?? undefined}
          defaultName={editingProfile ? undefined : getNextDefaultName(useAppStore.getState().profiles)}
          onClose={() => {
            setShowProfileEditor(false);
            setEditingProfile(null);
          }}
          onSave={() => {
            setShowProfileEditor(false);
            setShowProfileSelector(false);
            setEditingProfile(null);
          }}
        />
      )}

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}

export default App;
