// Componente de globo 3D usando MapLibre GL JS v5 (spike de validación)
import { useRef, useEffect, useCallback, useState } from 'react';
import { Map, type MapRef, Source, Layer } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { loadCountriesGeoJson } from '../../data/countries';
import type { CountryFeature } from '../../data/countries';
import type { FeatureCollection, Geometry } from 'geojson';

// Colores del tema espacial
const COUNTRY_FILL_COLOR = '#3a3a4a';
const COUNTRY_SELECTED_COLOR = '#8a7d5a';
const BORDER_COLOR = 'rgba(255, 255, 255, 0.2)';

// Coordenadas para test de flyTo
const FLY_TO_TARGETS = [
  { name: 'Brasil', lng: -47.9, lat: -15.8 },
  { name: 'Japón', lng: 139.7, lat: 35.7 },
  { name: 'Australia', lng: 149.1, lat: -35.3 },
  { name: 'Noruega', lng: 10.7, lat: 59.9 },
  { name: 'Sudáfrica', lng: 28.0, lat: -25.7 },
];

// Estilo base offline (sin tile server)
const EMPTY_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background' as const,
      paint: { 'background-color': '#000000' },
    },
  ],
};

interface MapLibreGlobeProps {
  onCountryClick?: (country: CountryFeature) => void;
  onReady?: () => void;
}

export function MapLibreGlobe({ onCountryClick, onReady }: MapLibreGlobeProps) {
  const mapRef = useRef<MapRef>(null);
  const [geojsonData, setGeojsonData] = useState<FeatureCollection<Geometry> | null>(null);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const rotationRef = useRef<number | null>(null);
  const isRotatingRef = useRef(true);
  const loadStartRef = useRef<number>(performance.now());
  const fpsFramesRef = useRef(0);
  const fpsLastTimeRef = useRef(0);
  const [flyToIndex, setFlyToIndex] = useState(0);

  // Cargar datos GeoJSON al montar
  useEffect(() => {
    loadCountriesGeoJson().then(setGeojsonData);
  }, []);

  // Contador de FPS (log cada 3 segundos)
  const startFpsCounter = useCallback(() => {
    fpsFramesRef.current = 0;
    fpsLastTimeRef.current = performance.now();

    const measure = () => {
      fpsFramesRef.current++;
      const now = performance.now();
      const elapsed = now - fpsLastTimeRef.current;
      if (elapsed >= 3000) {
        const fps = Math.round((fpsFramesRef.current * 1000) / elapsed);
        console.log(`[MapLibre FPS] ${fps} fps (últimos ${Math.round(elapsed)}ms)`);
        fpsFramesRef.current = 0;
        fpsLastTimeRef.current = now;
      }
      requestAnimationFrame(measure);
    };
    requestAnimationFrame(measure);
  }, []);

  // Rotación automática
  const startAutoRotation = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    isRotatingRef.current = true;
    let lastTime = performance.now();

    const rotate = () => {
      if (!isRotatingRef.current) return;
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const center = map.getCenter();
      // ~6°/s de rotación (lenta y suave)
      map.setCenter({ lng: center.lng + 6 * delta, lat: center.lat });
      rotationRef.current = requestAnimationFrame(rotate);
    };
    rotationRef.current = requestAnimationFrame(rotate);
  }, []);

  // Parar rotación
  const stopAutoRotation = useCallback(() => {
    isRotatingRef.current = false;
    if (rotationRef.current !== null) {
      cancelAnimationFrame(rotationRef.current);
      rotationRef.current = null;
    }
  }, []);

  // Evento: mapa cargado
  const handleMapLoad = useCallback(() => {
    const loadTime = performance.now() - loadStartRef.current;
    console.log(`[MapLibre] Mapa cargado en ${Math.round(loadTime)}ms`);

    const map = mapRef.current?.getMap();
    if (!map) return;

    // Configurar atmósfera del globo con colores del tema espacial
    map.setSky({
      'atmosphere-blend': 0.5,
    });

    startFpsCounter();
    startAutoRotation();
    onReady?.();
  }, [onReady, startFpsCounter, startAutoRotation]);

  // Evento: los datos del source se han cargado
  const handleSourceData = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Solo medir la primera vez que los datos están listos
    if (map.getSource('countries') && map.isSourceLoaded('countries')) {
      const dataTime = performance.now() - loadStartRef.current;
      console.log(`[MapLibre] Datos de países renderizados en ${Math.round(dataTime)}ms`);
      // Desregistrar para no loguear múltiples veces
      map.off('sourcedata', handleSourceData);
    }
  }, []);

  // Click en un país
  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      stopAutoRotation();

      const map = mapRef.current?.getMap();
      if (!map) return;

      const features = e.features;
      if (!features || features.length === 0) {
        // Click en el océano — deseleccionar
        if (selectedId !== null) {
          map.setFeatureState(
            { source: 'countries', id: selectedId },
            { selected: false }
          );
          setSelectedId(null);
        }
        return;
      }

      const feature = features[0] as MapGeoJSONFeature;
      const featureId = feature.id;
      const name = feature.properties?.name ?? 'Desconocido';

      console.log(`[MapLibre] País seleccionado: ${name} (id: ${featureId})`);

      // Deseleccionar el anterior
      if (selectedId !== null) {
        map.setFeatureState(
          { source: 'countries', id: selectedId },
          { selected: false }
        );
      }

      // Seleccionar el nuevo
      if (featureId !== undefined) {
        map.setFeatureState(
          { source: 'countries', id: featureId },
          { selected: true }
        );
        setSelectedId(featureId);
      }

      // Callback externo
      if (onCountryClick) {
        onCountryClick(feature as unknown as CountryFeature);
      }
    },
    [selectedId, onCountryClick, stopAutoRotation]
  );

  // Hover → cursor pointer
  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const canvas = map.getCanvas();
    canvas.style.cursor = e.features && e.features.length > 0 ? 'pointer' : 'grab';
  }, []);

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.getCanvas().style.cursor = 'grab';
  }, []);

  // Registrar sourcedata listener cuando el mapa esté disponible
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map && geojsonData) {
      map.on('sourcedata', handleSourceData);
      return () => {
        map.off('sourcedata', handleSourceData);
      };
    }
  }, [geojsonData, handleSourceData]);

  // Cleanup de la rotación al desmontar
  useEffect(() => {
    return () => {
      stopAutoRotation();
    };
  }, [stopAutoRotation]);

  // Test de flyTo
  const handleFlyToTest = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    stopAutoRotation();
    const target = FLY_TO_TARGETS[flyToIndex % FLY_TO_TARGETS.length];
    console.log(`[MapLibre flyTo] Volando a ${target.name} (${target.lat}, ${target.lng})`);

    map.flyTo({
      center: [target.lng, target.lat],
      zoom: 3,
      duration: 2000,
    });

    setFlyToIndex((i) => i + 1);
  }, [flyToIndex, stopAutoRotation]);

  return (
    <div className="globe-container">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: 20,
          longitude: 0,
          zoom: 1.5,
        }}
        minZoom={1}
        maxZoom={7}
        mapStyle={EMPTY_STYLE}
        projection="globe"
        onLoad={handleMapLoad}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={['countries-fill']}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {geojsonData && (
          <Source
            id="countries"
            type="geojson"
            data={geojsonData}
            promoteId="name"
          >
            {/* Relleno de países */}
            <Layer
              id="countries-fill"
              type="fill"
              paint={{
                'fill-color': [
                  'case',
                  ['boolean', ['feature-state', 'selected'], false],
                  COUNTRY_SELECTED_COLOR,
                  COUNTRY_FILL_COLOR,
                ],
                'fill-opacity': 0.9,
              }}
            />
            {/* Bordes de países */}
            <Layer
              id="countries-border"
              type="line"
              paint={{
                'line-color': BORDER_COLOR,
                'line-width': 0.5,
              }}
            />
          </Source>
        )}
      </Map>

      {/* Botón de test flyTo (solo para el spike) */}
      <button
        onClick={handleFlyToTest}
        style={{
          position: 'absolute',
          bottom: 80,
          right: 20,
          padding: '10px 16px',
          background: 'rgba(0, 240, 255, 0.2)',
          border: '1px solid rgba(0, 240, 255, 0.4)',
          borderRadius: 8,
          color: '#00f0ff',
          fontSize: 14,
          cursor: 'pointer',
          zIndex: 10,
          backdropFilter: 'blur(10px)',
        }}
      >
        flyTo → {FLY_TO_TARGETS[flyToIndex % FLY_TO_TARGETS.length].name}
      </button>
    </div>
  );
}

export default MapLibreGlobe;
