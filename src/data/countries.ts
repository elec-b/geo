// Loader de datos geográficos para el globo
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Feature, Geometry, MultiLineString } from 'geojson';
import { ISO_NUMERIC_TO_ALPHA2, NON_UN_TERRITORIES_BY_ID, NON_UN_TERRITORIES_BY_NAME } from './isoMapping';

// Interfaz para las propiedades de cada país en el GeoJSON
export interface CountryProperties {
  name: string;
  cca2: string | null;    // null para geometrías no reconocidas (Kosovo, Somaliland…)
  isUNMember: boolean;
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

  // Inyectar geometrías 10m para islas con resolución 50m insuficiente
  const overrideResp = await fetch('/data/islands-10m.json');
  const overrides = await overrideResp.json() as FeatureCollection;
  const overrideIds = new Set(overrides.features.map(f => String((f as any).id)));
  geojson.features = [
    ...geojson.features.filter(f => !overrideIds.has(String((f as any).id))),
    ...(overrides.features as any[]),
  ];

  // Enriquecer cada feature con cca2 e isUNMember
  for (const feature of geojson.features) {
    const numericId = (feature as any).id as string | undefined;
    const name = feature.properties?.name;

    // Primero buscar en los 195 países ONU
    let cca2: string | null = numericId ? (ISO_NUMERIC_TO_ALPHA2[numericId] ?? null) : null;
    let isUNMember = cca2 !== null;

    // Si no es ONU, buscar en territorios no reconocidos (por ID o por nombre)
    if (!cca2) {
      const byId = numericId ? NON_UN_TERRITORIES_BY_ID[numericId] : undefined;
      const byName = name ? NON_UN_TERRITORIES_BY_NAME[name] : undefined;
      const territory = byId ?? byName;
      if (territory) {
        cca2 = territory.cca2;
        isUNMember = false;
      }
    }

    // Caso especial: Antártida (no es un país ni territorio soberano)
    if (!cca2 && numericId === '010') {
      cca2 = 'AQ';
      isUNMember = false;
    }

    feature.properties = { ...feature.properties, cca2, isUNMember };
  }

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
