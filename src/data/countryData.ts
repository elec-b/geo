// Loader de datos estáticos de países y capitales con caché en memoria
import type { CountryData, CapitalCoords } from './types';

let cachedCountries: Map<string, CountryData> | null = null;
let cachedCapitals: Map<string, CapitalCoords> | null = null;

/**
 * Carga countries.json y devuelve un Map<cca2, CountryData>.
 * El fetch solo se hace una vez; las siguientes llamadas devuelven la caché.
 */
export async function loadCountryData(): Promise<Map<string, CountryData>> {
  if (cachedCountries) return cachedCountries;

  const response = await fetch('/data/countries.json');
  const data: CountryData[] = await response.json();

  const map = new Map<string, CountryData>();
  for (const country of data) {
    map.set(country.cca2, country);
  }

  cachedCountries = map;
  return map;
}

/**
 * Carga capitals.json y devuelve un Map<cca2, CapitalCoords>.
 * El fetch solo se hace una vez; las siguientes llamadas devuelven la caché.
 */
export async function loadCapitals(): Promise<Map<string, CapitalCoords>> {
  if (cachedCapitals) return cachedCapitals;

  const response = await fetch('/data/capitals.json');
  const data: Record<string, CapitalCoords> = await response.json();

  const map = new Map<string, CapitalCoords>();
  for (const [cca2, coords] of Object.entries(data)) {
    map.set(cca2, coords);
  }

  cachedCapitals = map;
  return map;
}

/**
 * Getter síncrono para datos de países. Lanza error si no se ha cargado aún.
 */
export function getCountryData(): Map<string, CountryData> {
  if (!cachedCountries) throw new Error('Datos de países no cargados. Llama a loadCountryData() primero.');
  return cachedCountries;
}

/**
 * Getter síncrono para capitales. Lanza error si no se ha cargado aún.
 */
export function getCapitals(): Map<string, CapitalCoords> {
  if (!cachedCapitals) throw new Error('Datos de capitales no cargados. Llama a loadCapitals() primero.');
  return cachedCapitals;
}
