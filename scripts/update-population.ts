/**
 * Script para actualizar datos de población desde la World Bank API.
 * Genera scripts/data/population.json para uso en fetch-countries.ts.
 *
 * Ejecutar: npm run update-population
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UN_COUNTRY_CODES, NON_UN_CODES } from '../src/data/isoMapping.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, 'data', 'population.json');

// World Bank API — indicador SP.POP.TOTL (población total)
const WB_BASE = 'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL';

// Vaticano no existe en la World Bank API
const MANUAL_OVERRIDES: Record<string, number> = {
  VA: 800,
};

// Todos los cca2 que nos interesan (ONU + territorios no-ONU)
const ALL_CODES = new Set([...UN_COUNTRY_CODES, ...NON_UN_CODES]);

interface WBRecord {
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
}

async function fetchYear(year: number): Promise<WBRecord[]> {
  const url = `${WB_BASE}?date=${year}&format=json&per_page=400`;
  console.log(`Consultando World Bank API (año ${year})...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  const data = await response.json();
  // La API devuelve [metadata, records]
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Respuesta inesperada de World Bank API');
  }
  return data[1] as WBRecord[];
}

async function main() {
  // Intentar desde el año anterior (el año actual rara vez tiene datos completos)
  const currentYear = new Date().getFullYear();
  let records: WBRecord[] = [];
  let dataYear = 0;

  for (let year = currentYear - 1; year >= currentYear - 4; year--) {
    const yearRecords = await fetchYear(year);
    const withData = yearRecords.filter(r => r.value !== null);
    console.log(`  Año ${year}: ${withData.length} registros con datos`);

    if (withData.length >= 190) {
      records = yearRecords;
      dataYear = year;
      break;
    }
  }

  if (records.length === 0) {
    throw new Error('No se encontraron datos de población suficientes en los últimos 3 años');
  }

  console.log(`\nUsando datos del año ${dataYear}`);

  // Filtrar y mapear a nuestros cca2
  const result: Record<string, number> = {};
  let matchedUN = 0;
  let matchedNonUN = 0;
  const gaps: string[] = [];

  for (const record of records) {
    const cca2 = record.country.id;
    if (!ALL_CODES.has(cca2)) continue;
    if (record.value === null) continue;

    result[cca2] = record.value;
    if (UN_COUNTRY_CODES.has(cca2)) matchedUN++;
    else matchedNonUN++;
  }

  // Añadir overrides manuales
  for (const [cca2, pop] of Object.entries(MANUAL_OVERRIDES)) {
    result[cca2] = pop;
  }

  // Detectar gaps (códigos sin datos en WB)
  for (const code of ALL_CODES) {
    if (!result[code] && !MANUAL_OVERRIDES[code]) {
      gaps.push(code);
    }
  }

  // Ordenar por cca2 y construir output
  const sorted = Object.keys(result).sort();
  const output: Record<string, unknown> = {
    _meta: {
      source: 'World Bank SP.POP.TOTL',
      dataYear,
      generatedAt: new Date().toISOString().split('T')[0],
      url: `${WB_BASE}?date=${dataYear}`,
    },
  };
  for (const key of sorted) {
    output[key] = result[key];
  }

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + '\n', 'utf-8');

  // Resumen
  console.log('\n--- Resumen ---');
  console.log(`Países ONU con datos:       ${matchedUN}/195`);
  console.log(`Territorios no-ONU:         ${matchedNonUN}`);
  console.log(`Overrides manuales:         ${Object.keys(MANUAL_OVERRIDES).length} (${Object.keys(MANUAL_OVERRIDES).join(', ')})`);
  console.log(`Total en population.json:   ${sorted.length}`);
  if (gaps.length > 0) {
    console.log(`Gaps (sin datos):           ${gaps.length} — ${gaps.join(', ')}`);
  }
  console.log(`\nEscrito: ${OUTPUT}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
