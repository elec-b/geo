// GeoExpert - Aplicación principal
import { lazy, Suspense, useState, useCallback } from 'react';
import { LoadingScreen } from './components/UI/LoadingScreen';
import type { CountryFeature } from './data/countries';

// Toggle A/B: cambiar a false para usar react-globe.gl original
const USE_MAPLIBRE = true;

// Lazy load de ambos componentes
const Globe = lazy(() => import('./components/Globe'));
const MapLibreGlobe = lazy(() => import('./components/Globe/MapLibreGlobe'));

function App() {
  const [globeReady, setGlobeReady] = useState(false);

  const handleCountryClick = useCallback((country: CountryFeature) => {
    console.log('Click en:', country.properties?.name);
  }, []);

  const handleGlobeReady = useCallback(() => setGlobeReady(true), []);

  const GlobeComponent = USE_MAPLIBRE ? MapLibreGlobe : Globe;

  return (
    <>
      <LoadingScreen visible={!globeReady} />
      <Suspense fallback={null}>
        <GlobeComponent onCountryClick={handleCountryClick} onReady={handleGlobeReady} />
      </Suspense>
    </>
  );
}

export default App;
