// GeoExpert - Aplicación principal
import { lazy, Suspense } from 'react';
import { LoadingScreen } from './components/UI/LoadingScreen';
import type { CountryFeature } from './data/countries';

// Lazy load del globo - se carga en segundo plano mientras se muestra LoadingScreen
const Globe = lazy(() => import('./components/Globe'));

function App() {
  // Handler cuando se hace click en un país
  const handleCountryClick = (country: CountryFeature) => {
    console.log('Click en:', country.properties?.name);
    // Aquí luego mostraremos la ficha del país
  };

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Globe onCountryClick={handleCountryClick} />
    </Suspense>
  );
}

export default App;
