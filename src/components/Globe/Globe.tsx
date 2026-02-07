// Componente principal del globo 3D (MapLibre GL JS v5, globe projection)
import { useRef, useEffect, useCallback, useState } from 'react';
import { Map, type MapRef, Source, Layer } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { loadCountriesGeoJson, loadBordersGeoJson } from '../../data/countries';
import type { CountryFeature } from '../../data/countries';
import type { FeatureCollection, Feature, Geometry, MultiLineString } from 'geojson';

// Colores del tema espacial
const COUNTRY_FILL_COLOR = '#3a3a4a';
const COUNTRY_SELECTED_COLOR = '#8a7d5a';
const BORDER_COLOR = 'rgba(255, 255, 255, 0.2)';

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

interface GlobeProps {
  onCountryClick?: (country: CountryFeature) => void;
  onReady?: () => void;
}

export function Globe({ onCountryClick, onReady }: GlobeProps) {
  const mapRef = useRef<MapRef>(null);
  const [geojsonData, setGeojsonData] = useState<FeatureCollection<Geometry> | null>(null);
  const [bordersData, setBordersData] = useState<Feature<MultiLineString> | null>(null);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const rotationRef = useRef<number | null>(null);
  const isRotatingRef = useRef(true);

  // Cargar datos GeoJSON al montar (polígonos + bordes en paralelo)
  useEffect(() => {
    Promise.all([loadCountriesGeoJson(), loadBordersGeoJson()]).then(
      ([countries, borders]) => {
        setGeojsonData(countries);
        setBordersData(borders);
      }
    );
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
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Configurar atmósfera del globo con colores del tema espacial
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

      console.log('País seleccionado:', name);

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
          </Source>
        )}
        {/* Bordes: source separada con topojson.mesh() para evitar artefactos de tile clipping */}
        {bordersData && (
          <Source id="borders" type="geojson" data={bordersData}>
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
    </div>
  );
}

export default Globe;
