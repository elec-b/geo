// ExploreView — contenedor de la experiencia Explorar
// Gestiona modo (países/capitales), selección, filtros y etiquetas.
import { useState, useCallback, useMemo, useEffect, type RefObject, type MutableRefObject } from 'react';
import type { GlobeD3Ref } from '../Globe';
import type { CountryFeature } from '../../data/countries';
import type { CountryData, CapitalCoords, Continent } from '../../data/types';
import type { CountryRankings } from '../../data/rankings';
import { CountryCard } from './CountryCard';
import { ContinentFilter } from './ContinentFilter';
import { TableView } from './TableView';
import './ExploreView.css';

type ExploreMode = 'countries' | 'capitals';

/** Props que ExploreView controla en el globo */
export interface GlobeControlProps {
  selectedCountryCca2: string | null;
  capitalPin: [number, number] | null;
  highlightedCountries: Set<string> | null;
  showCountryLabels: boolean;
  showCapitalLabels: boolean;
  capitalLabelsData: Map<string, CapitalCoords> | null;
}

interface ExploreViewProps {
  globeRef: RefObject<GlobeD3Ref | null>;
  countries: Map<string, CountryData>;
  capitals: Map<string, CapitalCoords>;
  rankings: Map<string, CountryRankings>;
  onGlobePropsChange: (props: GlobeControlProps) => void;
  /** Ref donde se registra el handler de click en país (bridge con App.tsx) */
  onCountryClickRef: MutableRefObject<((f: CountryFeature) => void) | undefined>;
  /** Ref donde se registra el handler de deselección (bridge con App.tsx) */
  onCountryDeselectRef: MutableRefObject<(() => void) | undefined>;
}

export function ExploreView({
  globeRef,
  countries,
  capitals,
  rankings,
  onGlobePropsChange,
  onCountryClickRef,
  onCountryDeselectRef,
}: ExploreViewProps) {
  const [mode, setMode] = useState<ExploreMode>('countries');
  const [selectedCca2, setSelectedCca2] = useState<string | null>(null);
  const [continentFilter, setContinentFilter] = useState<Continent | null>(null);
  const [showCountryLabels, setShowCountryLabels] = useState(false);
  const [showCapitalLabels, setShowCapitalLabels] = useState(false);
  const [capitalsGlobeView, setCapitalsGlobeView] = useState(false);

  // --- Estado derivado ---

  const highlightedCountries = useMemo(() => {
    if (!continentFilter) return null;
    const set = new Set<string>();
    for (const [cca2, data] of countries) {
      if (data.continent === continentFilter) set.add(cca2);
    }
    return set;
  }, [continentFilter, countries]);

  const capitalLabelsData = useMemo(
    () => (showCapitalLabels ? capitals : null),
    [showCapitalLabels, capitals],
  );

  const capitalPin = useMemo((): [number, number] | null => {
    if (!selectedCca2) return null;
    const cap = capitals.get(selectedCca2);
    return cap ? [cap.latlng[1], cap.latlng[0]] : null;
  }, [selectedCca2, capitals]);

  // --- Sincronización de props del globo ---

  useEffect(() => {
    onGlobePropsChange({
      selectedCountryCca2: selectedCca2,
      capitalPin,
      highlightedCountries,
      showCountryLabels,
      showCapitalLabels,
      capitalLabelsData,
    });
  }, [selectedCca2, capitalPin, highlightedCountries, showCountryLabels, showCapitalLabels, capitalLabelsData, onGlobePropsChange]);

  // Reset al desmontar (cambio de tab)
  useEffect(() => {
    return () => {
      onGlobePropsChange({
        selectedCountryCca2: null,
        capitalPin: null,
        highlightedCountries: null,
        showCountryLabels: false,
        showCapitalLabels: false,
        capitalLabelsData: null,
      });
    };
  }, [onGlobePropsChange]);

  // --- Handlers de interacción ---

  // Modo países: click en país del globo
  const handleCountryClick = useCallback(
    (feature: CountryFeature) => {
      const cca2 = feature.properties?.cca2;
      if (!cca2) return;
      setSelectedCca2(cca2);
      const cap = capitals.get(cca2);
      if (cap && globeRef.current) {
        globeRef.current.flyTo(cap.latlng[1], cap.latlng[0]);
      }
    },
    [capitals, globeRef],
  );

  // Click en océano o cierre de ficha
  const handleDeselect = useCallback(() => {
    setSelectedCca2(null);
  }, []);

  // Registrar handlers en refs para bridge con App.tsx
  onCountryClickRef.current = handleCountryClick;
  onCountryDeselectRef.current = handleDeselect;

  // Modo capitales: tap en fila de la tabla → país
  const handleCapitalsCountryTap = useCallback(
    (cca2: string) => {
      setSelectedCca2(cca2);
      setCapitalsGlobeView(true);
      const cap = capitals.get(cca2);
      if (cap && globeRef.current) {
        globeRef.current.flyTo(cap.latlng[1], cap.latlng[0], undefined, 600);
      }
    },
    [capitals, globeRef],
  );

  // Modo capitales: tap en fila de la tabla → capital
  const handleCapitalsCapitalTap = useCallback(
    (cca2: string) => {
      setSelectedCca2(cca2);
      setCapitalsGlobeView(true);
      const cap = capitals.get(cca2);
      if (cap && globeRef.current) {
        globeRef.current.flyTo(cap.latlng[1], cap.latlng[0], 5, 600);
      }
    },
    [capitals, globeRef],
  );


  // Cambio de filtro de continente con flyTo
  const CONTINENT_CENTERS: Record<Continent, [number, number]> = {
    'África': [20, 0],
    'América': [-80, 10],
    'Asia': [90, 35],
    'Europa': [15, 50],
    'Oceanía': [140, -25],
  };

  const handleContinentChange = useCallback(
    (continent: Continent | null) => {
      setContinentFilter(continent);
      if (continent && globeRef.current) {
        const [lon, lat] = CONTINENT_CENTERS[continent];
        globeRef.current.flyTo(lon, lat, undefined, 800);
      }
    },
    [globeRef],
  );

  // Cambio de modo
  const switchMode = useCallback((newMode: ExploreMode) => {
    setMode(newMode);
    setCapitalsGlobeView(false);
    setSelectedCca2(null);
  }, []);

  // --- Datos del país seleccionado ---

  const selectedCountry = selectedCca2 ? countries.get(selectedCca2) : null;
  const selectedRankings = selectedCca2 ? rankings.get(selectedCca2) : undefined;
  // Modo visual: refleja lo que el usuario ve (globo o tabla)
  const visualMode = (mode === 'capitals' && capitalsGlobeView) ? 'countries' : mode;

  // Handlers del segmented adaptados al contexto
  const handleGlobeClick = useCallback(() => {
    if (mode === 'capitals' && capitalsGlobeView) {
      // Ya ve el globo desde tabla → cambio normal a modo países
      switchMode('countries');
    } else {
      switchMode('countries');
    }
  }, [mode, capitalsGlobeView, switchMode]);

  const handleTableClick = useCallback(() => {
    if (mode === 'capitals' && capitalsGlobeView) {
      // Volver a tabla sin resetear selección
      setCapitalsGlobeView(false);
    } else {
      switchMode('capitals');
    }
  }, [mode, capitalsGlobeView, switchMode]);

  return (
    <>
      {/* Barra de controles flotante */}
      <div className="explore-controls">
        {/* Segmented control */}
        <div className="explore-segmented" role="tablist">
          <button
            className={`explore-segmented__btn ${visualMode === 'countries' ? 'explore-segmented__btn--active' : ''}`}
            onClick={handleGlobeClick}
            role="tab"
            aria-selected={visualMode === 'countries'}
          >
            Globo
          </button>
          <button
            className={`explore-segmented__btn ${visualMode === 'capitals' ? 'explore-segmented__btn--active' : ''}`}
            onClick={handleTableClick}
            role="tab"
            aria-selected={visualMode === 'capitals'}
          >
            Tabla
          </button>
        </div>

        {/* Filtros de continente */}
        <ContinentFilter active={continentFilter} onChange={handleContinentChange} />

        {/* Toggles de etiquetas (solo modo países) */}
        {mode === 'countries' && (
          <div className="explore-labels">
            <button
              className={`explore-labels__btn ${showCountryLabels ? 'explore-labels__btn--active' : ''}`}
              onClick={() => setShowCountryLabels(prev => !prev)}
              aria-pressed={showCountryLabels}
            >
              Países
            </button>
            <button
              className={`explore-labels__btn ${showCapitalLabels ? 'explore-labels__btn--active' : ''}`}
              onClick={() => setShowCapitalLabels(prev => !prev)}
              aria-pressed={showCapitalLabels}
            >
              Capitales
            </button>
          </div>
        )}
      </div>

      {/* Tabla de capitales (pantalla completa, se oculta con display:none para preservar scroll) */}
      {mode === 'capitals' && (
        <TableView
          countries={countries}
          continentFilter={continentFilter}
          onCountryTap={handleCapitalsCountryTap}
          onCapitalTap={handleCapitalsCapitalTap}
          style={{ display: capitalsGlobeView ? 'none' : undefined }}
        />
      )}

      {/* Ficha de país (bottom sheet, visible en modo países o al volver de tabla) */}
      {visualMode === 'countries' && selectedCountry && (
        <CountryCard
          country={selectedCountry}
          rankings={selectedRankings}
          onClose={handleDeselect}
        />
      )}
    </>
  );
}
