// Loader de datos geográficos para el globo
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Feature, Geometry } from 'geojson';

// Importamos el TopoJSON de world-atlas (110m = resolución media, suficiente para móvil)
import worldData from 'world-atlas/countries-110m.json';

// Interfaz para las propiedades de cada país en el GeoJSON
export interface CountryProperties {
  name: string;
  // Podemos añadir más propiedades después (código ISO, continente, etc.)
}

// Tipo para un Feature de país
export type CountryFeature = Feature<Geometry, CountryProperties>;

/**
 * Convierte el TopoJSON de world-atlas a GeoJSON
 * @returns FeatureCollection con todos los países
 */
export function getCountriesGeoJson(): FeatureCollection<Geometry, CountryProperties> {
  const topology = worldData as unknown as Topology<{
    countries: GeometryCollection<CountryProperties>;
  }>;

  // Extraemos los países del TopoJSON y convertimos a GeoJSON
  const geojson = topojson.feature(
    topology,
    topology.objects.countries
  ) as FeatureCollection<Geometry, CountryProperties>;

  return geojson;
}

// Colores por continente (basado en el ID numérico del país)
// Los IDs de Natural Earth siguen un patrón por región
const CONTINENT_COLORS: Record<string, string> = {
  africa: '#f59e0b',    // Ámbar
  america: '#22c55e',   // Verde
  asia: '#ef4444',      // Rojo
  europe: '#3b82f6',    // Azul
  oceania: '#a855f7',   // Púrpura
  default: '#6b7280',   // Gris para casos no mapeados
};

// Mapeo aproximado de IDs a continentes (Natural Earth country IDs)
// Esto es una aproximación - luego lo mejoraremos con datos reales
function getContinentById(id: string | number): string {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;

  // Rangos aproximados basados en Natural Earth
  // África: 4-180 (muchos países)
  // Europa: 40-380
  // Asia: 4-860
  // América: 32-862
  // Oceanía: 36-598

  // Esta es una simplificación temporal - usaremos datos reales después
  if (numId >= 4 && numId <= 180) return 'africa';
  if (numId >= 200 && numId <= 400) return 'europe';
  if (numId >= 400 && numId <= 700) return 'asia';
  if (numId >= 700 && numId <= 862) return 'america';
  if (numId >= 36 && numId <= 200) return 'oceania';

  return 'default';
}

/**
 * Obtiene el color de un país según su continente
 * @param countryId - ID del país (de Natural Earth)
 * @returns Color hexadecimal
 */
export function getCountryColor(countryId: string | number): string {
  const continent = getContinentById(countryId);
  return CONTINENT_COLORS[continent] || CONTINENT_COLORS.default;
}

/**
 * Obtiene un color más claro para el hover
 * @param countryId - ID del país
 * @returns Color hexadecimal más brillante
 */
export function getCountryHoverColor(countryId: string | number): string {
  const continent = getContinentById(countryId);

  // Colores más brillantes para hover
  const hoverColors: Record<string, string> = {
    africa: '#fbbf24',
    america: '#4ade80',
    asia: '#f87171',
    europe: '#60a5fa',
    oceania: '#c084fc',
    default: '#9ca3af',
  };

  return hoverColors[continent] || hoverColors.default;
}
