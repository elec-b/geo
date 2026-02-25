// GeoExpert - Aplicación principal
import { lazy, Suspense, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { TabBar } from './components/Navigation/TabBar';
import { AppHeader } from './components/Layout/AppHeader';
import { ExploreView, type GlobeControlProps } from './components/Explore/ExploreView';
import { JugarView } from './components/Game/JugarView';
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
  capitalPin: null,
  highlightedCountries: null,
  showCountryLabels: false,
  showCapitalLabels: false,
  capitalLabelsData: null,
};

function App() {
  const [globeReady, setGlobeReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('explore');
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

      <AppHeader />

      {/* Globo: siempre montado, sin wrapper — iOS rompe touch tras re-render si se envuelve */}
      <Suspense fallback={null}>
        <GlobeD3
          ref={globeRef}
          onCountryClick={(activeTab === 'explore' || activeTab === 'play') ? handleCountryClick : undefined}
          onCountryDeselect={(activeTab === 'explore' || activeTab === 'play') ? handleCountryDeselect : undefined}
          onReady={handleGlobeReady}
          showMarkers={showMarkers}
          selectedCountryCca2={globeControl.selectedCountryCca2}
          capitalPin={globeControl.capitalPin}
          highlightedCountries={globeControl.highlightedCountries}
          showCountryLabels={globeControl.showCountryLabels}
          showCapitalLabels={globeControl.showCapitalLabels}
          capitalLabelsData={globeControl.capitalLabelsData}
          countryPopulations={countryPopulations}
          countryNames={countryNames}
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
        />
      )}

      {activeTab === 'passport' && (
        <div className="tab-overlay tab-overlay--active tab-overlay--passport">
          <div className="tab-placeholder">
            <svg className="tab-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <circle cx="12" cy="10" r="3" />
              <path d="M8 18h8" />
            </svg>
            <span className="tab-placeholder__title">Mi Pasaporte</span>
            <span className="tab-placeholder__subtitle">Próximamente</span>
          </div>
        </div>
      )}

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}

export default App;
