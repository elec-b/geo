// Loader de datos geográficos para el globo
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Feature, Geometry } from 'geojson';

// Interfaz para las propiedades de cada país en el GeoJSON
export interface CountryProperties {
  name: string;
  // Podemos añadir más propiedades después (código ISO, continente, etc.)
}

// Tipo para un Feature de país
export type CountryFeature = Feature<Geometry, CountryProperties>;

// Caché del GeoJSON para evitar múltiples fetches
let cachedGeoJson: FeatureCollection<Geometry, CountryProperties> | null = null;

/**
 * Carga y convierte el TopoJSON de world-atlas a GeoJSON
 * Los datos se cargan desde public/data/ (empaquetado en la app, sin red)
 * 50m = equilibrio entre detalle y rendimiento
 * @returns Promise con FeatureCollection de todos los países
 */
export async function loadCountriesGeoJson(): Promise<FeatureCollection<Geometry, CountryProperties>> {
  // Retornar caché si ya se cargó
  if (cachedGeoJson) return cachedGeoJson;

  // Cargar TopoJSON desde public/data (archivo local en Capacitor)
  const response = await fetch('/data/countries-50m.json');
  const worldData = await response.json();

  const topology = worldData as Topology<{
    countries: GeometryCollection<CountryProperties>;
  }>;

  // Extraemos los países del TopoJSON y convertimos a GeoJSON
  const geojson = topojson.feature(
    topology,
    topology.objects.countries
  ) as FeatureCollection<Geometry, CountryProperties>;

  // Guardar en caché
  cachedGeoJson = geojson;
  return geojson;
}
