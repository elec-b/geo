/**
 * Script para descargar datos de REST Countries v3.1 y generar datos multi-idioma:
 *   - public/data/countries-base.json  (datos agnósticos al idioma)
 *   - public/data/i18n/{lang}.json     (traducciones por idioma)
 *   - public/data/capitals.json        (coordenadas, sin nombre)
 *
 * Incluye los 195 países ONU + territorios no reconocidos visibles en el mapa.
 *
 * Ejecutar: npm run fetch-data
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { geoContains, geoDistance, geoArea } from 'd3-geo';
import * as topojson from 'topojson-client';

// Importar mapeos desde el proyecto
import { ISO_NUMERIC_TO_ALPHA2, UN_COUNTRY_CODES, NON_UN_CODES, NON_UN_TERRITORIES_BY_ID, NON_UN_TERRITORIES_BY_NAME } from '../src/data/isoMapping.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'public', 'data');
const I18N_DIR = resolve(DATA_DIR, 'i18n');
const SCRIPTS_DATA = resolve(__dirname, 'data');

// --- Idiomas soportados ---
// Mapa de clave interna → locale BCP 47 para Intl.DisplayNames
const SUPPORTED_LANGUAGES: Record<string, string> = {
  es: 'es', en: 'en', fr: 'fr', de: 'de', it: 'it',
  'pt-BR': 'pt-BR', 'pt-PT': 'pt-PT',
  ru: 'ru', ja: 'ja', ko: 'ko',
  'zh-Hans': 'zh-Hans', 'zh-Hant': 'zh-Hant',
  hi: 'hi', th: 'th', vi: 'vi', tr: 'tr',
  pl: 'pl', nl: 'nl', sv: 'sv', ro: 'ro',
  uk: 'uk', cs: 'cs', hu: 'hu',
  id: 'id', ms: 'ms', nb: 'nb',
  el: 'el', ca: 'ca', da: 'da', fi: 'fi', sk: 'sk', hr: 'hr',
};

// Mapeo de region de REST Countries → clave neutra de continente
const REGION_MAP: Record<string, string> = {
  Africa: 'africa',
  Americas: 'america',
  Asia: 'asia',
  Europe: 'europe',
  Oceania: 'oceania',
  Antarctic: 'antarctica',
};

// --- Tipos ---

interface RestCountry {
  cca2: string;
  ccn3?: string;
  name: { common: string; official: string };
  capital?: string[];
  capitalInfo?: { latlng?: [number, number] };
  region: string;
  population: number;
  area: number;
  flags: { svg: string; png: string };
  currencies?: Record<string, { name: string; symbol?: string }>;
  languages?: Record<string, string>;
}

interface HdiEntry {
  hdi: number;
  ihdi: number | null;
}

/** Entrada agnóstica al idioma en countries-base.json */
interface BaseEntry {
  cca2: string;
  ccn3: string;
  continent: string;
  population: number;
  area: number;
  flagSvg: string;
  /** Códigos ISO de monedas + símbolos (universales) */
  currencies: { code: string; symbol: string }[];
  hdi: number | null;
  ihdi: number | null;
  unMember: boolean;
  sovereignCountry?: string;
}

/** Entrada de traducción por idioma en i18n/{lang}.json */
interface I18nEntry {
  name: string;
  capital: string;
  demonym: string;
  languages: string[];
  currencyNames: string[];
  wikipediaSlug: string | null;
}

// --- Overrides de símbolos de monedas (universales) ---

const SYMBOL_OVERRIDES: Record<string, string> = {
  AED: 'د.إ',  ALL: 'L',    ANG: 'ƒ',    AWG: 'ƒ',    BGN: 'лв',
  BHD: '.د.ب', BIF: 'Fr',   BTN: 'Nu.',  CDF: 'FC',   CHF: 'Fr',
  CVE: 'Esc',  DJF: 'Fr',   DZD: 'د.ج',  EGP: '£',    ERN: 'Nfk',
  ETB: 'Br',   GMD: 'D',    HTG: 'G',    IQD: 'ع.د',  IRR: '﷼',
  JOD: 'د.ا',  KES: 'KSh',  KID: '$',    KWD: 'د.ك',  LSL: 'L',
  LYD: 'ل.د',  MAD: 'د.م.', MDL: 'L',    MKD: 'ден',  MOP: 'MOP$',
  MRU: 'UM',   MVR: 'Rf',   MWK: 'MK',   MZN: 'MT',   OMR: 'ر.ع.',
  PAB: 'B/.',  PEN: 'S/',   PGK: 'K',    QAR: 'ر.ق',  RSD: 'din.',
  SAR: 'ر.س',  SCR: '₨',   SDG: 'ج.س.', SLE: 'Le',   SOS: 'Sh',
  SZL: 'L',    TJS: 'SM',   TMT: 'T',    TND: 'د.ت',  TZS: 'TSh',
  UGX: 'USh',  UZS: 'сўм',  VES: 'Bs.S', VUV: 'VT',   WST: 'T',
  XAF: 'Fr',   XOF: 'Fr',   XPF: 'Fr',   YER: '﷼',   ZWL: '$',
};

function currencySymbol(code: string): string {
  if (SYMBOL_OVERRIDES[code]) return SYMBOL_OVERRIDES[code];
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency', currency: code, currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value ?? code;
  } catch {
    return code;
  }
}

// --- Lookup de soberano ---
const sovereignByCca2 = new Map<string, string>();
for (const t of Object.values(NON_UN_TERRITORIES_BY_ID)) {
  if (t.sovereignCca2) sovereignByCca2.set(t.cca2, t.sovereignCca2);
}
for (const t of Object.values(NON_UN_TERRITORIES_BY_NAME)) {
  if (t.sovereignCca2) sovereignByCca2.set(t.cca2, t.sovereignCca2);
}

// --- CLDR helpers ---

/** Códigos de moneda que CLDR reconoce (cacheado por la primera verificación con 'en') */
const validCurrencyCodes = new Set<string>();
const invalidCurrencyCodes = new Set<string>();

function isValidCurrencyCode(code: string): boolean {
  if (validCurrencyCodes.has(code)) return true;
  if (invalidCurrencyCodes.has(code)) return false;
  const dn = new Intl.DisplayNames(['en'], { type: 'currency' });
  const resolved = dn.of(code);
  if (resolved != null && resolved !== code) {
    validCurrencyCodes.add(code);
    return true;
  }
  invalidCurrencyCodes.add(code);
  return false;
}

function cldrCurrencyName(code: string, locale: string): string {
  const dn = new Intl.DisplayNames([locale], { type: 'currency' });
  const raw = dn.of(code);
  if (!raw || raw === code) return code;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function cldrCountryName(cca2: string, locale: string): string {
  const dn = new Intl.DisplayNames([locale], { type: 'region' });
  const name = dn.of(cca2);
  return name ?? cca2;
}

function cldrLanguageName(langCode: string, locale: string): string {
  const dn = new Intl.DisplayNames([locale], { type: 'language' });
  const name = dn.of(langCode);
  if (!name || name === langCode) return langCode;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// --- Overrides de coordenadas de capital ---
// Coordenadas corregidas manualmente donde REST Countries es incorrecto o impreciso.
// Formato: [lat, lng] (mismo que REST Countries capitalInfo.latlng).
const CAPITAL_COORD_OVERRIDES: Record<string, [number, number]> = {
  EH: [27.15, -13.20],   // El Aaiún — REST Countries sin dato fiable
  GD: [12.05, -61.75],   // St. George's — error conocido en REST Countries
  SN: [14.69, -17.44],   // Dakar — corrección de coordenada
  KI: [1.36, 173.09],    // South Tarawa — centroide del atolón principal
  MO: [22.20, 113.55],   // Macao — REST Countries devuelve [0, 0]
  WF: [-13.28, -176.17], // Mata-Utu — REST Countries apunta a isla incorrecta
  PN: [-25.07, -130.10], // Adamstown — refinar precisión
};

// Capitales donde geoContains falla >20 km por limitación de la geometría simplificada,
// no por error de coordenadas. Se excluyen del bloqueo de validación.
const GEOCONTAINS_EXCEPTIONS = new Set([
  'EH', // El Aaiún: polígono simplificado no llega a la costa
  'KI', // South Tarawa: atolón no representado en geometría
  'TC', // Cockburn Town: Grand Turk demasiado pequeña para 50m
  'WF', // Mata-Utu: archipiélago disperso
  'PN', // Adamstown: isla diminuta (cubierta por override 10m, pero no por 50m)
]);

// --- Helpers de geometría ---

/** Extrae todos los vértices [lng, lat] de un Polygon o MultiPolygon. */
function extractCoordinates(geometry: GeoJSON.Geometry): [number, number][] {
  const result: [number, number][] = [];
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      for (const coord of ring) result.push([coord[0], coord[1]]);
    }
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      for (const ring of poly) {
        for (const coord of ring) result.push([coord[0], coord[1]]);
      }
    }
  }
  return result;
}

// --- Generación ---

async function main() {
  // Cargar datos fuente
  const capitalsAll: Record<string, Record<string, string>> =
    JSON.parse(readFileSync(resolve(SCRIPTS_DATA, 'capitals-all.json'), 'utf-8'));
  const demonymsAll: Record<string, Record<string, string>> =
    JSON.parse(readFileSync(resolve(SCRIPTS_DATA, 'demonyms-all.json'), 'utf-8'));
  const langCodesBase: Record<string, { languageCodes: string[] }> =
    JSON.parse(readFileSync(resolve(SCRIPTS_DATA, 'supplementary-base.json'), 'utf-8'));
  const nameOverrides: Record<string, Record<string, string>> =
    JSON.parse(readFileSync(resolve(SCRIPTS_DATA, 'country-name-overrides.json'), 'utf-8'));
  const hdiData: Record<string, HdiEntry> =
    JSON.parse(readFileSync(resolve(SCRIPTS_DATA, 'hdi.json'), 'utf-8'));

  // Población (World Bank, override de REST Countries) — opcional
  const populationData: Record<string, number> =
    existsSync(resolve(SCRIPTS_DATA, 'population.json'))
      ? JSON.parse(readFileSync(resolve(SCRIPTS_DATA, 'population.json'), 'utf-8'))
      : {};

  // Wikipedia slugs (solo español por ahora; los demás se generarán con fetch-wikipedia-i18n)
  const wikiEs: Record<string, { slug: string; lang: string }> =
    existsSync(resolve(SCRIPTS_DATA, 'wikipedia-es.json'))
      ? JSON.parse(readFileSync(resolve(SCRIPTS_DATA, 'wikipedia-es.json'), 'utf-8'))
      : {};

  // Wikipedia slugs multi-idioma (si existe)
  const wikiAll: Record<string, Record<string, string>> =
    existsSync(resolve(SCRIPTS_DATA, 'wikipedia-all.json'))
      ? JSON.parse(readFileSync(resolve(SCRIPTS_DATA, 'wikipedia-all.json'), 'utf-8'))
      : {};

  console.log('Fuentes cargadas:');
  console.log(`  Capitales: ${Object.keys(capitalsAll).length} países`);
  console.log(`  Gentilicios: ${Object.keys(demonymsAll).length} países`);
  console.log(`  Códigos de idiomas: ${Object.keys(langCodesBase).length} países`);
  console.log(`  Overrides de nombre: ${Object.keys(nameOverrides).length} idiomas`);
  console.log(`  HDI: ${Object.keys(hdiData).filter(k => k !== '_meta').length} países`);
  console.log(`  Población (WB): ${Object.keys(populationData).filter(k => k !== '_meta').length} países`);
  console.log(`  Wikipedia (es): ${Object.keys(wikiEs).length} países`);
  console.log(`  Wikipedia (multi): ${Object.keys(wikiAll).length} países`);

  // --- Descargar REST Countries ---
  console.log('\nDescargando datos de REST Countries v3.1...');

  const response = await fetch('https://restcountries.com/v3.1/independent?status=true');
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  const mainCountries: RestCountry[] = await response.json();

  const unFiltered = mainCountries.filter((c) => UN_COUNTRY_CODES.has(c.cca2));
  const present = new Set(unFiltered.map((c) => c.cca2));
  const missing = [...UN_COUNTRY_CODES].filter((code) => !present.has(code));

  if (missing.length > 0) {
    console.log(`Buscando ${missing.length} faltantes: ${missing.join(', ')}`);
    const resp2 = await fetch(`https://restcountries.com/v3.1/alpha?codes=${missing.join(',')}`);
    if (resp2.ok) {
      const extra: RestCountry[] = await resp2.json();
      for (const c of extra) {
        if (UN_COUNTRY_CODES.has(c.cca2)) unFiltered.push(c);
      }
    }
  }

  console.log(`Países ONU: ${unFiltered.length}/195`);

  // Territorios no-ONU
  const nonUnApiCodes = [...NON_UN_CODES].filter((c) => c.length === 2);
  const nonUnFiltered: RestCountry[] = [];
  for (let i = 0; i < nonUnApiCodes.length; i += 20) {
    const batch = nonUnApiCodes.slice(i, i + 20);
    const resp = await fetch(`https://restcountries.com/v3.1/alpha?codes=${batch.join(',')}`);
    if (resp.ok) {
      const data: RestCountry[] = await resp.json();
      nonUnFiltered.push(...data);
    }
  }
  console.log(`Territorios no-ONU: ${nonUnFiltered.length}`);

  const allApiCountries = [...unFiltered, ...nonUnFiltered];
  const allCca2 = allApiCountries.map((c) => c.cca2).sort();
  const unSet = new Set([...UN_COUNTRY_CODES]);

  // --- 1. Generar countries-base.json ---

  const baseEntries: BaseEntry[] = allApiCountries.map((c) => {
    const currencyCodes = c.currencies
      ? Object.keys(c.currencies).filter(isValidCurrencyCode)
      : [];

    const hdi = hdiData[c.cca2] ?? null;
    const sovereign = sovereignByCca2.get(c.cca2);

    return {
      cca2: c.cca2,
      ccn3: c.ccn3 ?? '',
      continent: REGION_MAP[c.region] ?? c.region,
      population: populationData[c.cca2] ?? c.population,
      area: c.area,
      flagSvg: c.flags.svg,
      currencies: currencyCodes.map((code) => ({
        code,
        symbol: currencySymbol(code),
      })),
      hdi: hdi?.hdi ?? null,
      ihdi: hdi?.ihdi ?? null,
      unMember: unSet.has(c.cca2),
      ...(sovereign ? { sovereignCountry: sovereign } : {}),
    };
  });

  baseEntries.sort((a, b) => a.cca2.localeCompare(b.cca2));

  // --- 2. Generar capitals.json (solo coordenadas) ---

  const capitals: Record<string, { latlng: [number, number] }> = {};
  const warnings: string[] = [];

  for (const c of allApiCountries) {
    const override = CAPITAL_COORD_OVERRIDES[c.cca2];
    if (override) {
      capitals[c.cca2] = { latlng: override };
    } else {
      const latlng = c.capitalInfo?.latlng;
      if (!latlng || latlng.length < 2) {
        warnings.push(`${c.cca2} (${c.name.common}): sin coordenadas`);
        capitals[c.cca2] = { latlng: [0, 0] };
      } else {
        capitals[c.cca2] = { latlng: [latlng[0], latlng[1]] };
      }
    }
  }

  // --- 3. Generar i18n/{lang}.json para cada idioma ---

  mkdirSync(I18N_DIR, { recursive: true });

  for (const [langKey, locale] of Object.entries(SUPPORTED_LANGUAGES)) {
    const overrides = nameOverrides[langKey] ?? {};
    const i18nData: Record<string, I18nEntry> = {};

    for (const cca2 of allCca2) {
      const baseEntry = baseEntries.find((b) => b.cca2 === cca2);
      if (!baseEntry) continue;

      // Nombre del país
      const name = overrides[cca2] ?? cldrCountryName(cca2, locale);

      // Capital
      const capital = capitalsAll[cca2]?.[langKey] ?? '';

      // Gentilicio
      const demonym = demonymsAll[cca2]?.[langKey] ?? '';

      // Idiomas oficiales (traducidos con CLDR)
      const langCodes = langCodesBase[cca2]?.languageCodes ?? [];
      const languages = langCodes.map((code) => cldrLanguageName(code, locale));

      // Nombres de monedas (traducidos con CLDR)
      const currencyNames = baseEntry.currencies.map((c) =>
        cldrCurrencyName(c.code, locale),
      );

      // Wikipedia slug
      let wikipediaSlug: string | null = null;
      if (wikiAll[cca2]?.[langKey]) {
        wikipediaSlug = wikiAll[cca2][langKey];
      } else if (langKey === 'es' && wikiEs[cca2]) {
        const w = wikiEs[cca2];
        wikipediaSlug = w.lang === 'es' ? w.slug : `${w.lang}:${w.slug}`;
      }

      i18nData[cca2] = { name, capital, demonym, languages, currencyNames, wikipediaSlug };
    }

    const i18nPath = resolve(I18N_DIR, `${langKey}.json`);
    writeFileSync(i18nPath, JSON.stringify(i18nData, null, 2), 'utf-8');
    console.log(`  ✓ i18n/${langKey}.json (${Object.keys(i18nData).length} países)`);
  }

  // --- 4. Escribir base y capitals ---

  const basePath = resolve(DATA_DIR, 'countries-base.json');
  writeFileSync(basePath, JSON.stringify(baseEntries, null, 2), 'utf-8');
  console.log(`\n✓ ${baseEntries.length} países → countries-base.json`);

  const capitalsPath = resolve(DATA_DIR, 'capitals.json');
  writeFileSync(capitalsPath, JSON.stringify(capitals, null, 2), 'utf-8');
  console.log(`✓ ${Object.keys(capitals).length} capitales → capitals.json`);

  if (warnings.length > 0) {
    console.log(`\n⚠ ${warnings.length} capitales sin coordenadas:`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  // --- 5. Validación de coordenadas (geoContains) ---
  // Verifica que cada capital cae dentro del polígono de su país (geometría 50m).
  // Bloquea la generación si se detecta un error inesperado (>8 km del borde).

  console.log('\n--- Validación de coordenadas ---');

  const topoPath = resolve(DATA_DIR, 'countries-50m.json');
  const topo = JSON.parse(readFileSync(topoPath, 'utf-8'));
  const geo = topojson.feature(topo, topo.objects.countries) as GeoJSON.FeatureCollection;

  // Mapear features por cca2. Para IDs duplicados (ej. Australia/Ashmore), quedarse con la de mayor área.
  const featureByCca2 = new Map<string, GeoJSON.Feature>();
  for (const f of geo.features) {
    const id = String(f.id).padStart(3, '0');
    const cca2 = ISO_NUMERIC_TO_ALPHA2[id]
      ?? NON_UN_TERRITORIES_BY_ID[id]?.cca2;
    if (!cca2) continue;
    const existing = featureByCca2.get(cca2);
    if (!existing || geoArea(f) > geoArea(existing)) {
      featureByCca2.set(cca2, f);
    }
  }

  const EARTH_RADIUS_KM = 6371;
  const TOLERANCE_KM = 20;
  let insideCount = 0;
  let coastalCount = 0;
  let exceptionCount = 0;
  const noGeometry: string[] = [];
  const errors: string[] = [];

  for (const [cca2, data] of Object.entries(capitals)) {
    const [lat, lng] = data.latlng;
    if (lat === 0 && lng === 0) continue; // Sin coordenadas reales

    const feature = featureByCca2.get(cca2);
    if (!feature) {
      noGeometry.push(cca2);
      continue;
    }

    if (geoContains(feature, [lng, lat])) {
      insideCount++;
      continue;
    }

    // Capital fuera del polígono: calcular distancia al borde más cercano
    let minDist = Infinity;
    const coords = extractCoordinates(feature.geometry);
    for (const [vLng, vLat] of coords) {
      const d = geoDistance([lng, lat], [vLng, vLat]) * EARTH_RADIUS_KM;
      if (d < minDist) minDist = d;
    }

    if (minDist <= TOLERANCE_KM) {
      coastalCount++;
    } else if (GEOCONTAINS_EXCEPTIONS.has(cca2)) {
      exceptionCount++;
    } else {
      errors.push(`${cca2} a ${minDist.toFixed(1)} km de su polígono`);
    }
  }

  console.log(`  ✓ ${insideCount} capitales dentro de su polígono`);
  if (coastalCount > 0) console.log(`  ℹ ${coastalCount} capitales costeras (<${TOLERANCE_KM} km del borde) — OK`);
  if (exceptionCount > 0) console.log(`  ⚠ ${exceptionCount} excepciones conocidas (${[...GEOCONTAINS_EXCEPTIONS].join(', ')})`);
  if (noGeometry.length > 0) console.log(`  ✗ ${noGeometry.length} capitales sin geometría (${noGeometry.join(', ')})`);

  if (errors.length > 0) {
    console.log('');
    for (const e of errors) console.log(`  ✗ ERROR: ${e}`);
    console.error('\n✗ Validación fallida. Revisar coordenadas o añadir a CAPITAL_COORD_OVERRIDES / GEOCONTAINS_EXCEPTIONS.');
    process.exit(1);
  }

  console.log('✓ Validación de coordenadas completada');

  // --- 6. Resumen ---
  console.log(`\n✓ Generación completada: ${Object.keys(SUPPORTED_LANGUAGES).length} idiomas`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
