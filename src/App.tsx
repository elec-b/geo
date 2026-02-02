// GeoExpert - Aplicación principal
import { Globe } from './components/Globe';
import type { CountryFeature } from './data/countries';

function App() {
  // Handler cuando se hace click en un país
  const handleCountryClick = (country: CountryFeature) => {
    console.log('Click en:', country.properties?.name);
    // Aquí luego mostraremos la ficha del país
  };

  return (
    <Globe onCountryClick={handleCountryClick} />
  );
}

export default App;
