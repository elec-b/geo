// GeoExpert - Aplicación principal
// Spike: switch A/B para comparar GeoJSON vs PMTiles
//   ?source=pmtiles → usa PMTiles (spike Opción A)
//   sin parámetro   → usa GeoJSON (referencia actual)
import { lazy, Suspense, useState, useCallback } from 'react';
import { LoadingScreen } from './components/UI/LoadingScreen';
import type { CountryFeature } from './data/countries';

// Lazy load de los 3 globos (spike)
const Globe = lazy(() => import('./components/Globe'));
const GlobePMTiles = lazy(() => import('./components/Globe/GlobePMTiles'));
const GlobeD3 = lazy(() => import('./components/Globe/GlobeD3'));

// Seleccionar source vía query param: pmtiles | d3 | (default = geojson)
const source = new URLSearchParams(window.location.search).get('source');

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
        {source === 'pmtiles' ? (
          <GlobePMTiles onCountryClick={handleCountryClick} onReady={handleGlobeReady} />
        ) : source === 'd3' ? (
          <GlobeD3 onCountryClick={handleCountryClick} onReady={handleGlobeReady} />
        ) : (
          <Globe onCountryClick={handleCountryClick} onReady={handleGlobeReady} />
        )}
      </Suspense>
      {/* Indicador de source (solo durante el spike) */}
      <div style={{
        position: 'fixed',
        bottom: 8,
        right: 8,
        color: 'white',
        fontSize: 12,
        opacity: 0.5,
        zIndex: 10,
        fontFamily: 'monospace',
      }}>
        {source ?? 'geojson'}
      </div>
    </>
  );
}

export default App;
