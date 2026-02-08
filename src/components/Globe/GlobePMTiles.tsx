// Spike: Globo 3D con PMTiles en vez de GeoJSON
// Usa vector tiles pre-generados por tippecanoe para evitar artefactos
// de geojson-vt en tile boundaries con globe projection.
import { useRef, useEffect, useCallback, useState } from 'react';
import { Map, type MapRef } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { CountryFeature } from '../../data/countries';

// Colores del tema espacial (mismos que Globe.tsx)
const COUNTRY_FILL_COLOR = '#3a3a4a';
const COUNTRY_SELECTED_COLOR = '#8a7d5a';
const BORDER_COLOR = 'rgba(255, 255, 255, 0.2)';

// URL base para PMTiles (se resuelve desde public/)
const PMTILES_URL = `pmtiles://${location.origin}/data/world.pmtiles`;

// Estilo completo con PMTiles como source (en vez de GeoJSON + Source/Layer)
const PMTILES_STYLE = {
  version: 8 as const,
  sources: {
    world: {
      type: 'vector' as const,
      url: PMTILES_URL,
      promoteId: { countries: 'name' },
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background' as const,
      paint: { 'background-color': '#000000' },
    },
    {
      id: 'countries-fill',
      type: 'fill' as const,
      source: 'world',
      'source-layer': 'countries',
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          COUNTRY_SELECTED_COLOR,
          COUNTRY_FILL_COLOR,
        ],
        'fill-opacity': 0.9,
      },
    },
    {
      id: 'countries-border',
      type: 'line' as const,
      source: 'world',
      'source-layer': 'borders',
      paint: {
        'line-color': BORDER_COLOR,
        'line-width': 0.5,
      },
    },
  ],
};

interface GlobePMTilesProps {
  onCountryClick?: (country: CountryFeature) => void;
  onReady?: () => void;
}

export function GlobePMTiles({ onCountryClick, onReady }: GlobePMTilesProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const rotationRef = useRef<number | null>(null);
  const isRotatingRef = useRef(true);

  // Rotación automática (~6°/s)
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
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Atmósfera del globo
    map.setSky({ 'atmosphere-blend': 0.5 });

    startAutoRotation();
    onReady?.();
  }, [onReady, startAutoRotation]);

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
            { source: 'world', sourceLayer: 'countries', id: selectedId },
            { selected: false }
          );
          setSelectedId(null);
        }
        return;
      }

      const feature = features[0] as MapGeoJSONFeature;
      const featureId = feature.id;
      const name = feature.properties?.name ?? 'Desconocido';

      console.log('País seleccionado (PMTiles):', name);

      // Deseleccionar el anterior
      if (selectedId !== null) {
        map.setFeatureState(
          { source: 'world', sourceLayer: 'countries', id: selectedId },
          { selected: false }
        );
      }

      // Seleccionar el nuevo
      if (featureId !== undefined) {
        map.setFeatureState(
          { source: 'world', sourceLayer: 'countries', id: featureId },
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
    map.getCanvas().style.cursor = e.features && e.features.length > 0 ? 'pointer' : 'grab';
  }, []);

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.getCanvas().style.cursor = 'grab';
  }, []);

  // Cleanup de la rotación al desmontar
  useEffect(() => {
    return () => stopAutoRotation();
  }, [stopAutoRotation]);

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
        mapStyle={PMTILES_STYLE}
        projection="globe"
        onLoad={handleMapLoad}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={['countries-fill']}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      />
    </div>
  );
}

export default GlobePMTiles;
