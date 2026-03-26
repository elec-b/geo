/**
 * Script para descargar datos de REST Countries v3.1 y generar
 * public/data/countries.json y public/data/capitals.json.
 *
 * Incluye los 195 países ONU + territorios no reconocidos visibles en el mapa.
 *
 * Ejecutar: npm run fetch-data
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Importar mapeos desde el proyecto
import { UN_COUNTRY_CODES, NON_UN_CODES, NON_UN_TERRITORIES_BY_ID, NON_UN_TERRITORIES_BY_NAME } from '../src/data/isoMapping.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'public', 'data');

// Mapeo de region de REST Countries → clave neutra de continente (i18n)
const REGION_MAP: Record<string, string> = {
  Africa: 'africa',
  Americas: 'america',
  Asia: 'asia',
  Europe: 'europe',
  Oceania: 'oceania',
  Antarctic: 'antarctica',
};

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
  demonyms?: Record<string, { m: string; f: string }>;
}

interface SupplementaryEntry {
  /** Override de nombre CLDR (solo ~8 casos donde CLDR prefiere endónimos) */
  name?: string;
  capital: string;
  demonym: string;
  languages?: string[];
}

interface CountryEntry {
  cca2: string;
  ccn3: string;
  name: string;
  capital: string;
  continent: string;
  population: number;
  area: number;
  flagSvg: string;
  currencies: { name: string; symbol: string }[];
  languages: string[];
  demonym: string;
  hdi: number | null;
  ihdi: number | null;
  wikipediaSlug: string | null;
  unMember: boolean;
  sovereignCountry?: string;
}

interface WikiEntry {
  slug: string;
  lang: string;
}

interface CapitalEntry {
  name: string;
  latlng: [number, number];
}

interface HdiEntry {
  hdi: number;
  ihdi: number | null;
}

// Lookup de soberano para territorios no-ONU dependientes
const sovereignByCca2 = new Map<string, string>();
for (const t of Object.values(NON_UN_TERRITORIES_BY_ID)) {
  if (t.sovereignCca2) sovereignByCca2.set(t.cca2, t.sovereignCca2);
}
for (const t of Object.values(NON_UN_TERRITORIES_BY_NAME)) {
  if (t.sovereignCca2) sovereignByCca2.set(t.cca2, t.sovereignCca2);
}

// --- CLDR: nombres de países vía Intl.DisplayNames (fuente primaria) ---
const territoryNames = new Intl.DisplayNames(['es'], { type: 'region' });

function cldrTerritoryName(cca2: string): string {
  const name = territoryNames.of(cca2);
  if (!name) throw new Error(`CLDR: sin nombre en español para ${cca2}`);
  return name;
}

// --- CLDR: nombres y símbolos de monedas ---
const currencyDisplayNames = new Intl.DisplayNames(['es'], { type: 'currency' });

function cldrCurrencyName(code: string): string {
  const raw = currencyDisplayNames.of(code);
  if (!raw || raw === code) return code; // fallback para códigos desconocidos (ej. KID)
  // CLDR devuelve minúsculas ("euro", "dólar estadounidense") → Title Case
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// Overrides de símbolos: monedas donde narrowSymbol devuelve el código ISO
// y la app tiene un símbolo más informativo. Incluye 5 correcciones del spike
// de validación (CDF, PEN, VES, CVE, SZL).
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
    const parts = new Intl.NumberFormat('es', {
      style: 'currency', currency: code, currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value ?? code;
  } catch {
    return code;
  }
}

// --- Diff entre runs: compara countries.json anterior vs nuevo ---
function diffAndReport(prev: CountryEntry[], next: CountryEntry[]): void {
  const prevMap = new Map(prev.map((c) => [c.cca2, c]));
  const nameChanges: string[] = [];
  const currencyChanges: string[] = [];
  const added: string[] = [];

  for (const entry of next) {
    const old = prevMap.get(entry.cca2);
    if (!old) {
      added.push(entry.cca2);
      continue;
    }
    if (old.name !== entry.name) {
      nameChanges.push(`  ${entry.cca2}: "${old.name}" → "${entry.name}"`);
    }
    const oldCur = old.currencies.map((c) => `${c.name} (${c.symbol})`).join(', ');
    const newCur = entry.currencies.map((c) => `${c.name} (${c.symbol})`).join(', ');
    if (oldCur !== newCur) {
      currencyChanges.push(`  ${entry.cca2}: "${oldCur}" → "${newCur}"`);
    }
  }

  const removed = [...prevMap.keys()].filter((k) => !next.some((c) => c.cca2 === k));

  if (nameChanges.length === 0 && currencyChanges.length === 0 && added.length === 0 && removed.length === 0) {
    console.log('\n✓ Sin cambios respecto al run anterior');
    return;
  }

  console.log('\n--- Diff entre runs ---');
  if (nameChanges.length > 0) {
    console.log(`\nNombres cambiados (${nameChanges.length}):`);
    nameChanges.forEach((l) => console.log(l));
  }
  if (currencyChanges.length > 0) {
    console.log(`\nMonedas cambiadas (${currencyChanges.length}):`);
    currencyChanges.forEach((l) => console.log(l));
  }
  if (added.length > 0) console.log(`\nNuevos: ${added.join(', ')}`);
  if (removed.length > 0) console.log(`\nEliminados: ${removed.join(', ')}`);
  console.log('--- Fin diff ---\n');
}

function toCountryEntry(
  c: RestCountry,
  isUN: boolean,
  supp: Record<string, SupplementaryEntry>,
  hdiData: Record<string, HdiEntry>,
  wikiData: Record<string, WikiEntry>,
): CountryEntry {
  // Capital y gentilicio en español (desde archivo suplementario)
  const suppEntry = supp[c.cca2];
  if (!suppEntry) throw new Error(`Sin datos suplementarios para ${c.cca2} (${c.name.common})`);

  // Nombre del país en español: override suplementario → CLDR (Intl.DisplayNames)
  const name = suppEntry.name ?? cldrTerritoryName(c.cca2);

  // Monedas: códigos de REST Countries → nombre y símbolo de CLDR + overrides
  // Se filtran códigos no reconocidos por CLDR (CKD, FOK, GGP, IMP, JEP, TVD…)
  const currencies: { name: string; symbol: string }[] = c.currencies
    ? Object.keys(c.currencies)
        .filter((code) => {
          const resolved = currencyDisplayNames.of(code);
          return resolved != null && resolved !== code;
        })
        .map((code) => ({
          name: cldrCurrencyName(code),
          symbol: currencySymbol(code),
        }))
    : [];

  // Idiomas: preferir suplementario (español), fallback a REST Countries
  const languages: string[] = suppEntry.languages
    ?? (c.languages ? Object.values(c.languages) : []);

  // HDI / IHDI
  const hdi = hdiData[c.cca2] ?? null;

  // Wikipedia slug (preferir es, prefijo "en:" si solo hay artículo en inglés)
  const wiki = wikiData[c.cca2] ?? null;
  const wikipediaSlug = wiki
    ? (wiki.lang === 'es' ? wiki.slug : `${wiki.lang}:${wiki.slug}`)
    : null;

  const sovereignCountry = sovereignByCca2.get(c.cca2);

  return {
    cca2: c.cca2,
    ccn3: c.ccn3 ?? '',
    name,
    capital: suppEntry.capital,
    continent: REGION_MAP[c.region] ?? c.region,
    population: c.population,
    area: c.area,
    flagSvg: c.flags.svg,
    currencies,
    languages,
    demonym: suppEntry.demonym,
    hdi: hdi?.hdi ?? null,
    ihdi: hdi?.ihdi ?? null,
    wikipediaSlug,
    unMember: isUN,
    ...(sovereignCountry ? { sovereignCountry } : {}),
  };
}

async function main() {
  // Cargar datos suplementarios (capitales, gentilicios e idiomas en español)
  const SUPP_PATH = resolve(__dirname, 'data', 'capitals-es.json');
  const supplementary: Record<string, SupplementaryEntry> =
    JSON.parse(readFileSync(SUPP_PATH, 'utf-8'));
  console.log(`Datos suplementarios cargados: ${Object.keys(supplementary).length} entradas`);

  // Cargar datos HDI / IHDI
  const HDI_PATH = resolve(__dirname, 'data', 'hdi.json');
  const hdiData: Record<string, HdiEntry> =
    JSON.parse(readFileSync(HDI_PATH, 'utf-8'));
  console.log(`Datos HDI cargados: ${Object.keys(hdiData).length} entradas`);

  // Cargar datos de Wikipedia (slugs en español)
  const WIKI_PATH = resolve(__dirname, 'data', 'wikipedia-es.json');
  const wikiData: Record<string, WikiEntry> =
    JSON.parse(readFileSync(WIKI_PATH, 'utf-8'));
  console.log(`Datos Wikipedia cargados: ${Object.keys(wikiData).length} entradas`);

  console.log('Descargando datos de REST Countries v3.1...');

  // --- 1. Países ONU (195) ---

  const response = await fetch('https://restcountries.com/v3.1/independent?status=true');
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
  }

  const mainCountries: RestCountry[] = await response.json();
  console.log(`Recibidos ${mainCountries.length} registros de la API`);

  // Filtrar a los que están en nuestro set de 195
  const unFiltered = mainCountries.filter((c) => UN_COUNTRY_CODES.has(c.cca2));

  // Detectar faltantes (ej: Palestina no aparece como independent)
  const present = new Set(unFiltered.map((c) => c.cca2));
  const missing = [...UN_COUNTRY_CODES].filter((code) => !present.has(code));

  if (missing.length > 0) {
    console.log(`Buscando ${missing.length} países faltantes: ${missing.join(', ')}`);
    const resp2 = await fetch(`https://restcountries.com/v3.1/alpha?codes=${missing.join(',')}`);
    if (resp2.ok) {
      const extra: RestCountry[] = await resp2.json();
      for (const c of extra) {
        if (UN_COUNTRY_CODES.has(c.cca2)) unFiltered.push(c);
      }
    }
  }

  console.log(`Países ONU: ${unFiltered.length}/195`);

  if (unFiltered.length !== 195) {
    const stillPresent = new Set(unFiltered.map((c) => c.cca2));
    const stillMissing = [...UN_COUNTRY_CODES].filter((code) => !stillPresent.has(code));
    console.warn(`⚠ Faltan ${stillMissing.length} países ONU: ${stillMissing.join(', ')}`);
  }

  // --- 2. Territorios no-ONU ---

  // Filtrar solo los que tienen códigos de REST Countries (excluir SOL, CYN que no existen en la API)
  const nonUnApiCodes = [...NON_UN_CODES].filter((c) => c.length === 2);
  console.log(`Buscando ${nonUnApiCodes.length} territorios no-ONU...`);

  const nonUnFiltered: RestCountry[] = [];
  // Hacer en lotes de 20 para no sobrecargar la API
  for (let i = 0; i < nonUnApiCodes.length; i += 20) {
    const batch = nonUnApiCodes.slice(i, i + 20);
    const resp = await fetch(`https://restcountries.com/v3.1/alpha?codes=${batch.join(',')}`);
    if (resp.ok) {
      const data: RestCountry[] = await resp.json();
      nonUnFiltered.push(...data);
    }
  }

  console.log(`Territorios no-ONU descargados: ${nonUnFiltered.length}`);

  // --- 3. Generar salida ---

  const countries: CountryEntry[] = [
    ...unFiltered.map((c) => toCountryEntry(c, true, supplementary, hdiData, wikiData)),
    ...nonUnFiltered.map((c) => toCountryEntry(c, false, supplementary, hdiData, wikiData)),
  ];

  // Ordenar alfabéticamente por cca2
  countries.sort((a, b) => a.cca2.localeCompare(b.cca2));

  // Generar capitals.json (keyed por cca2)
  const allApiCountries = [...unFiltered, ...nonUnFiltered];
  const capitals: Record<string, CapitalEntry> = {};
  const warnings: string[] = [];

  // Overrides de coordenadas de capital (la API devuelve datos incorrectos para algunos países)
  const CAPITAL_OVERRIDES: Record<string, [number, number]> = {
    'EH': [27.15, -13.20], // El Aaiún, Sáhara Occidental (API devuelve lat/lng invertidos)
    'GD': [12.05, -61.75], // St. George's, Grenada (API devuelve coords de Bermuda)
    'SN': [14.69, -17.44], // Dakar, Senegal (API imprecisa, cae fuera de la península)
  };

  for (const c of allApiCountries) {
    const capitalName = supplementary[c.cca2]?.capital ?? c.capital?.[0] ?? '';
    const override = CAPITAL_OVERRIDES[c.cca2];

    if (override) {
      capitals[c.cca2] = { name: capitalName, latlng: override };
    } else {
      const latlng = c.capitalInfo?.latlng;
      if (!latlng || latlng.length < 2) {
        warnings.push(`${c.cca2} (${c.name.common}): sin coordenadas de capital`);
        capitals[c.cca2] = { name: capitalName, latlng: [0, 0] };
      } else {
        capitals[c.cca2] = { name: capitalName, latlng: [latlng[0], latlng[1]] };
      }
    }
  }

  // Crear directorio si no existe
  mkdirSync(DATA_DIR, { recursive: true });

  // Diff contra el run anterior (si existe)
  const countriesPath = resolve(DATA_DIR, 'countries.json');
  if (existsSync(countriesPath)) {
    const prevData: CountryEntry[] = JSON.parse(readFileSync(countriesPath, 'utf-8'));
    diffAndReport(prevData, countries);
  }

  // Escribir archivos
  writeFileSync(countriesPath, JSON.stringify(countries, null, 2), 'utf-8');
  console.log(`✓ ${countries.length} países escritos → ${countriesPath}`);

  const capitalsPath = resolve(DATA_DIR, 'capitals.json');
  writeFileSync(capitalsPath, JSON.stringify(capitals, null, 2), 'utf-8');
  console.log(`✓ ${Object.keys(capitals).length} capitales escritas → ${capitalsPath}`);

  if (warnings.length > 0) {
    console.log(`\n⚠ ${warnings.length} capitales sin coordenadas:`);
    for (const w of warnings) {
      console.log(`  - ${w}`);
    }
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
