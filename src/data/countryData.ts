// Loader de datos estáticos de países y capitales con caché en memoria
import type { CountryData, CapitalCoords } from './types';

let cachedCountries: Map<string, CountryData> | null = null;
let cachedCapitals: Map<string, CapitalCoords> | null = null;

// Datos sintéticos para territorios sin entrada en REST Countries API
const SYNTHETIC_COUNTRIES: CountryData[] = [
  {
    cca2: 'SOL',
    ccn3: '',
    name: 'Somalilandia',
    capital: 'Hargeisa',
    continent: 'África',
    population: 5700000,
    area: 137600,
    flagSvg: '',
    currencies: ['Chelín somalilándés'],
    languages: ['Somalí', 'Árabe'],
    demonym: 'Somalilándés',
    unMember: false,
  },
  {
    cca2: 'CYN',
    ccn3: '',
    name: 'Chipre del Norte',
    capital: 'Nicosia del Norte',
    continent: 'Europa',
    population: 382230,
    area: 3355,
    flagSvg: '',
    currencies: ['Lira turca'],
    languages: ['Turco'],
    demonym: 'Turcochipriota',
    unMember: false,
  },
];

const SYNTHETIC_CAPITALS: Array<[string, CapitalCoords]> = [
  ['SOL', { name: 'Hargeisa', latlng: [9.56, 44.06] }],
  ['CYN', { name: 'Nicosia del Norte', latlng: [35.19, 33.36] }],
];

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

  // Inyectar territorios sin entrada en REST Countries API
  for (const synthetic of SYNTHETIC_COUNTRIES) {
    if (!map.has(synthetic.cca2)) map.set(synthetic.cca2, synthetic);
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

  // Inyectar capitales de territorios sintéticos
  for (const [cca2, coords] of SYNTHETIC_CAPITALS) {
    if (!map.has(cca2)) map.set(cca2, coords);
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
