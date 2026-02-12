/**
 * Script para descargar datos de REST Countries v3.1 y generar
 * public/data/countries.json y public/data/capitals.json.
 *
 * Ejecutar: npm run fetch-data
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Importar la lista de 195 códigos reconocidos desde el proyecto
import { UN_COUNTRY_CODES } from '../src/data/isoMapping.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'public', 'data');

// Mapeo de region de REST Countries → continente en español
const REGION_MAP: Record<string, string> = {
  Africa: 'África',
  Americas: 'América',
  Asia: 'Asia',
  Europe: 'Europa',
  Oceania: 'Oceanía',
  Antarctic: 'Antártida', // No debería aparecer en los 195, pero por si acaso
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
}

interface CapitalEntry {
  name: string;
  latlng: [number, number];
}

async function main() {
  console.log('Descargando datos de REST Countries v3.1...');

  // Usamos /independent para obtener estados soberanos (v3.1 requiere endpoint específico)
  const response = await fetch('https://restcountries.com/v3.1/independent?status=true');
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
  }

  const mainCountries: RestCountry[] = await response.json();
  console.log(`Recibidos ${mainCountries.length} registros de la API`);

  // Filtrar a los que están en nuestro set de 195
  const filtered = mainCountries.filter((c) => UN_COUNTRY_CODES.has(c.cca2));

  // Detectar faltantes (ej: Palestina no aparece como independent)
  const present = new Set(filtered.map((c) => c.cca2));
  const missing = [...UN_COUNTRY_CODES].filter((code) => !present.has(code));

  if (missing.length > 0) {
    console.log(`Buscando ${missing.length} países faltantes: ${missing.join(', ')}`);
    const resp2 = await fetch(`https://restcountries.com/v3.1/alpha?codes=${missing.join(',')}`);
    if (resp2.ok) {
      const extra: RestCountry[] = await resp2.json();
      for (const c of extra) {
        if (UN_COUNTRY_CODES.has(c.cca2)) filtered.push(c);
      }
    }
  }

  console.log(`Total: ${filtered.length} países reconocidos`);

  if (filtered.length !== 195) {
    const stillPresent = new Set(filtered.map((c) => c.cca2));
    const stillMissing = [...UN_COUNTRY_CODES].filter((code) => !stillPresent.has(code));
    console.warn(`⚠ Faltan ${stillMissing.length} países: ${stillMissing.join(', ')}`);
  }

  // Ordenar alfabéticamente por cca2
  filtered.sort((a, b) => a.cca2.localeCompare(b.cca2));

  // Generar countries.json
  const countries: CountryEntry[] = filtered.map((c) => ({
    cca2: c.cca2,
    ccn3: c.ccn3 ?? '',
    name: c.name.common,
    capital: c.capital?.[0] ?? '',
    continent: REGION_MAP[c.region] ?? c.region,
    population: c.population,
    area: c.area,
    flagSvg: c.flags.svg,
    currencies: c.currencies ? Object.values(c.currencies).map((cur) => cur.name) : [],
    languages: c.languages ? Object.values(c.languages) : [],
    demonym: c.demonyms?.eng?.m ?? '',
  }));

  // Generar capitals.json (keyed por cca2)
  const capitals: Record<string, CapitalEntry> = {};
  const warnings: string[] = [];

  for (const c of filtered) {
    const capitalName = c.capital?.[0] ?? '';
    const latlng = c.capitalInfo?.latlng;

    if (!latlng || latlng.length < 2) {
      warnings.push(`${c.cca2} (${c.name.common}): sin coordenadas de capital`);
      // Usar [0, 0] como placeholder
      capitals[c.cca2] = { name: capitalName, latlng: [0, 0] };
    } else {
      capitals[c.cca2] = { name: capitalName, latlng: [latlng[0], latlng[1]] };
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

  // Mostrar warnings
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
