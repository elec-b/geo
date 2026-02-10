// GeoExpert - Aplicación principal
import { lazy, Suspense, useState, useCallback } from 'react';
import { LoadingScreen } from './components/UI/LoadingScreen';
import type { CountryFeature } from './data/countries';

const GlobeD3 = lazy(() => import('./components/Globe/GlobeD3'));

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
        <GlobeD3 onCountryClick={handleCountryClick} onReady={handleGlobeReady} />
      </Suspense>
    </>
  );
}

export default App;
