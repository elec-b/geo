/**
 * Script para descargar datos de REST Countries v3.1 y generar
 * public/data/countries.json y public/data/capitals.json.
 *
 * Incluye los 195 países ONU + territorios no reconocidos visibles en el mapa.
 *
 * Ejecutar: npm run fetch-data
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Importar mapeos desde el proyecto
import { UN_COUNTRY_CODES, NON_UN_CODES } from '../src/data/isoMapping.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'public', 'data');

// Mapeo de region de REST Countries → continente en español
const REGION_MAP: Record<string, string> = {
  Africa: 'África',
  Americas: 'América',
  Asia: 'Asia',
  Europe: 'Europa',
  Oceania: 'Oceanía',
  Antarctic: 'Antártida',
};

interface RestCountry {
  cca2: string;
  ccn3?: string;
  name: { common: string; official: string };
  translations?: Record<string, { official: string; common: string }>;
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
  capital: string;
  demonym: string;
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
  currencies: string[];
  languages: string[];
  demonym: string;
  unMember: boolean;
}

interface CapitalEntry {
  name: string;
  latlng: [number, number];
}

function toCountryEntry(c: RestCountry, isUN: boolean, supp: Record<string, SupplementaryEntry>): CountryEntry {
  // Nombre del país en español (desde REST Countries translations.spa)
  const name = c.translations?.spa?.common;
  if (!name) throw new Error(`Sin traducción española para ${c.cca2} (${c.name.common})`);

  // Capital y gentilicio en español (desde archivo suplementario)
  const suppEntry = supp[c.cca2];
  if (!suppEntry) throw new Error(`Sin datos suplementarios para ${c.cca2} (${c.name.common})`);

  return {
    cca2: c.cca2,
    ccn3: c.ccn3 ?? '',
    name,
    capital: suppEntry.capital,
    continent: REGION_MAP[c.region] ?? c.region,
    population: c.population,
    area: c.area,
    flagSvg: c.flags.svg,
    currencies: c.currencies ? Object.values(c.currencies).map((cur) => cur.name) : [],
    languages: c.languages ? Object.values(c.languages) : [],
    demonym: suppEntry.demonym,
    unMember: isUN,
  };
}

async function main() {
  // Cargar datos suplementarios (capitales y gentilicios en español)
  const SUPP_PATH = resolve(__dirname, 'data', 'capitals-es.json');
  const supplementary: Record<string, SupplementaryEntry> =
    JSON.parse(readFileSync(SUPP_PATH, 'utf-8'));
  console.log(`Datos suplementarios cargados: ${Object.keys(supplementary).length} entradas`);

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
    ...unFiltered.map((c) => toCountryEntry(c, true, supplementary)),
    ...nonUnFiltered.map((c) => toCountryEntry(c, false, supplementary)),
  ];

  // Ordenar alfabéticamente por cca2
  countries.sort((a, b) => a.cca2.localeCompare(b.cca2));

  // Generar capitals.json (keyed por cca2)
  const allApiCountries = [...unFiltered, ...nonUnFiltered];
  const capitals: Record<string, CapitalEntry> = {};
  const warnings: string[] = [];

  // Overrides de coordenadas de capital (la API devuelve datos incorrectos para algunos países)
  const CAPITAL_OVERRIDES: Record<string, [number, number]> = {
    'GD': [12.05, -61.75], // St. George's, Grenada (API devuelve coords de Bermuda)
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

  // Escribir archivos
  const countriesPath = resolve(DATA_DIR, 'countries.json');
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
