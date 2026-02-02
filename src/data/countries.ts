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

// Colores uniformes para todos los países (diseño minimalista)
const COUNTRY_COLOR = '#3a3a4a';       // Gris oscuro
const COUNTRY_HOVER_COLOR = '#5a5a6a'; // Gris más claro para hover

/**
 * Obtiene el color base de un país
 * @param _countryId - ID del país (no usado, color uniforme)
 * @returns Color hexadecimal gris
 */
export function getCountryColor(_countryId: string | number): string {
  return COUNTRY_COLOR;
}

/**
 * Obtiene el color para el estado hover
 * @param _countryId - ID del país (no usado, color uniforme)
 * @returns Color hexadecimal gris claro
 */
export function getCountryHoverColor(_countryId: string | number): string {
  return COUNTRY_HOVER_COLOR;
}
