// Loader de datos geográficos para el globo
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Feature, Geometry, MultiLineString } from 'geojson';

// Interfaz para las propiedades de cada país en el GeoJSON
export interface CountryProperties {
  name: string;
  // Podemos añadir más propiedades después (código ISO, continente, etc.)
}

// Tipo para un Feature de país
export type CountryFeature = Feature<Geometry, CountryProperties>;

// Tipo de la topología de world-atlas
type WorldTopology = Topology<{
  countries: GeometryCollection<CountryProperties>;
}>;

// Cachés
let cachedTopology: WorldTopology | null = null;
let cachedGeoJson: FeatureCollection<Geometry, CountryProperties> | null = null;
let cachedBorders: Feature<MultiLineString> | null = null;

/**
 * Carga la topología base (compartida entre países y bordes)
 */
async function loadTopology(): Promise<WorldTopology> {
  if (cachedTopology) return cachedTopology;

  const response = await fetch('/data/countries-50m.json');
  const worldData = await response.json();
  cachedTopology = worldData as WorldTopology;
  return cachedTopology;
}

/**
 * Carga y convierte el TopoJSON de world-atlas a GeoJSON (polígonos de países)
 * Los datos se cargan desde public/data/ (empaquetado en la app, sin red)
 * 50m = equilibrio entre detalle y rendimiento
 */
export async function loadCountriesGeoJson(): Promise<FeatureCollection<Geometry, CountryProperties>> {
  if (cachedGeoJson) return cachedGeoJson;

  const topology = await loadTopology();

  const geojson = topojson.feature(
    topology,
    topology.objects.countries
  ) as FeatureCollection<Geometry, CountryProperties>;

  cachedGeoJson = geojson;
  return geojson;
}

/**
 * Extrae los bordes compartidos de la topología como líneas.
 * Usa topojson.mesh() que produce LineStrings limpias sin artefactos
 * de clipping de tiles (a diferencia de dibujar outlines de polígonos).
 */
export async function loadBordersGeoJson(): Promise<Feature<MultiLineString>> {
  if (cachedBorders) return cachedBorders;

  const topology = await loadTopology();

  const mesh = topojson.mesh(topology, topology.objects.countries);

  cachedBorders = {
    type: 'Feature',
    properties: {},
    geometry: mesh,
  };
  return cachedBorders;
}
