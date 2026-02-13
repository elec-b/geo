// GeoExpert - Aplicación principal
import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { TabBar } from './components/Navigation/TabBar';
import { AppHeader } from './components/Layout/AppHeader';
import { loadCountryData, loadCapitals } from './data/countryData';
import { buildLevelDefinitions } from './data/levels';
import { useAppStore } from './stores/appStore';
import type { CountryFeature } from './data/countries';
import type { TabId } from './components/Navigation/types';
import './components/Layout/AppShell.css';

const GlobeD3 = lazy(() => import('./components/Globe/GlobeD3'));

function App() {
  const [globeReady, setGlobeReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('explore');
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

      <AppHeader />

      {/* Globo: siempre montado, sin wrapper — iOS rompe touch tras re-render si se envuelve */}
      <Suspense fallback={null}>
        <GlobeD3
          onCountryClick={handleCountryClick}
          onReady={handleGlobeReady}
          showMarkers={showMarkers}
        />
      </Suspense>

      {/* Overlay de tab activo — solo se monta cuando es necesario */}
      {activeTab === 'play' && (
        <div className="tab-overlay tab-overlay--active">
          <div className="tab-placeholder">
            <svg className="tab-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
            </svg>
            <span className="tab-placeholder__title">Jugar</span>
            <span className="tab-placeholder__subtitle">Próximamente</span>
          </div>
        </div>
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
