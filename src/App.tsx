// GeoExpert - Aplicación principal
import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { loadCountryData, loadCapitals } from './data/countryData';
import { buildLevelDefinitions } from './data/levels';
import { useAppStore } from './stores/appStore';
import type { CountryFeature } from './data/countries';

const GlobeD3 = lazy(() => import('./components/Globe/GlobeD3'));

function App() {
  const [globeReady, setGlobeReady] = useState(false);
  const showMarkers = useAppStore((s) => s.settings.showMarkers);

  // Precargar datos estáticos en paralelo con el globo
  useEffect(() => {
    Promise.all([loadCountryData(), loadCapitals()]).then(([countries, capitals]) => {
      console.log(`Datos: ${countries.size} países, ${capitals.size} capitales`);

      // Generar definiciones de niveles (verificación temporal)
      const levels = buildLevelDefinitions(countries);
      const continents = ['África', 'América', 'Asia', 'Europa', 'Oceanía'] as const;
      for (const continent of continents) {
        const t = levels.get(`turista-${continent}`)!.countries.length;
        const m = levels.get(`mochilero-${continent}`)!.countries.length;
        const g = levels.get(`guía-${continent}`)!.countries.length;
        console.log(`${continent}: T=${t}, M=${m}, G=${g}`);
      }
      const totalGuia = continents.reduce(
        (sum, c) => sum + levels.get(`guía-${c}`)!.countries.length,
        0,
      );
      console.log(`Total Guía: ${totalGuia}`);
    });
  }, []);

  const handleCountryClick = useCallback((country: CountryFeature) => {
    console.log('Click en:', country.properties?.cca2, country.properties?.name);
  }, []);

  const handleGlobeReady = useCallback(() => setGlobeReady(true), []);

  return (
    <>
      <LoadingScreen visible={!globeReady} />
      <Suspense fallback={null}>
        <GlobeD3
          onCountryClick={handleCountryClick}
          onReady={handleGlobeReady}
          showMarkers={showMarkers}
        />
      </Suspense>
    </>
  );
}

export default App;
