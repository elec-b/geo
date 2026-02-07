// GeoExpert - Aplicación principal
import { lazy, Suspense, useState, useCallback } from 'react';
import { LoadingScreen } from './components/UI/LoadingScreen';
import type { CountryFeature } from './data/countries';

// Lazy load del globo - se carga en segundo plano mientras se muestra LoadingScreen
const Globe = lazy(() => import('./components/Globe'));

function App() {
  const [globeReady, setGlobeReady] = useState(false);

  const handleCountryClick = useCallback((country: CountryFeature) => {
    console.log('Click en:', country.properties?.name);
  }, []);

  const handleGlobeReady = useCallback(() => setGlobeReady(true), []);

  return (
    <>
      <LoadingScreen visible={!globeReady} />
      <Suspense fallback={null}>
        <Globe onCountryClick={handleCountryClick} onReady={handleGlobeReady} />
      </Suspense>
    </>
  );
}

export default App;
