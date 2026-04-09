/**
 * Script para actualizar HDI e IHDI desde el CSV oficial del UNDP HDR 2025.
 * Genera scripts/data/hdi.json en el formato esperado por fetch-countries.ts.
 *
 * Ejecutar: npm run update-hdi
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, 'data', 'hdi.json');

// --- URL del CSV del HDR 2025 (serie temporal completa) ---
const HDR_CSV_URL =
  'https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv';

// --- Overrides manuales para países sin cobertura HDR ---
// Fuentes suplementarias (no UNDP). Mantener hasta que aparezcan en un HDR futuro.
const MANUAL_OVERRIDES: Record<string, { hdi: number | null; ihdi: number | null }> = {
  KP: { hdi: 0.733, ihdi: null },   // Corea del Norte — no reporta a UNDP
  TW: { hdi: 0.926, ihdi: null },   // Taiwán — no miembro ONU
  XK: { hdi: 0.750, ihdi: null },   // Kosovo — soberanía en disputa
  MC: { hdi: 0.956, ihdi: null },   // Mónaco — solo componentes parciales en HDR
  VA: { hdi: null, ihdi: null },    // Vaticano — excluido del HDR
};

// --- Mapeo ISO alpha-3 → alpha-2 (estándar ISO 3166-1) ---
// Solo los países que aparecen en el HDR. El estándar es estable.
const ISO3_TO_ISO2: Record<string, string> = {
  AFG: 'AF', ALB: 'AL', DZA: 'DZ', AND: 'AD', AGO: 'AO', ATG: 'AG', AZE: 'AZ',
  ARG: 'AR', AUS: 'AU', AUT: 'AT', BHS: 'BS', BHR: 'BH', BGD: 'BD', ARM: 'AM',
  BRB: 'BB', BEL: 'BE', BTN: 'BT', BOL: 'BO', BIH: 'BA', BWA: 'BW', BRA: 'BR',
  BLZ: 'BZ', SLB: 'SB', BRN: 'BN', BGR: 'BG', MMR: 'MM', BDI: 'BI', BLR: 'BY',
  KHM: 'KH', CMR: 'CM', CAN: 'CA', CPV: 'CV', CAF: 'CF', LKA: 'LK', TCD: 'TD',
  CHL: 'CL', CHN: 'CN', COL: 'CO', COM: 'KM', COG: 'CG', COD: 'CD', CRI: 'CR',
  HRV: 'HR', CUB: 'CU', CYP: 'CY', CZE: 'CZ', BEN: 'BJ', DNK: 'DK', DMA: 'DM',
  DOM: 'DO', DJI: 'DJ', ECU: 'EC', SLV: 'SV', GNQ: 'GQ', ETH: 'ET', ERI: 'ER',
  EST: 'EE', EGY: 'EG', SWZ: 'SZ', FJI: 'FJ', FIN: 'FI', FRA: 'FR', GAB: 'GA',
  GEO: 'GE', GMB: 'GM', DEU: 'DE', GHA: 'GH', GRC: 'GR', GRD: 'GD', GTM: 'GT',
  GIN: 'GN', GUY: 'GY', GNB: 'GW', HTI: 'HT', HND: 'HN', HUN: 'HU', ISL: 'IS',
  IND: 'IN', IDN: 'ID', IRN: 'IR', IRQ: 'IQ', IRL: 'IE', ISR: 'IL', ITA: 'IT',
  CIV: 'CI', JAM: 'JM', JPN: 'JP', JOR: 'JO', KAZ: 'KZ', KEN: 'KE', KIR: 'KI',
  PRK: 'KP', KOR: 'KR', KWT: 'KW', KGZ: 'KG', LAO: 'LA', LBN: 'LB', LSO: 'LS',
  LVA: 'LV', LBR: 'LR', LBY: 'LY', LIE: 'LI', LTU: 'LT', LUX: 'LU', MDG: 'MG',
  MWI: 'MW', MYS: 'MY', MDV: 'MV', MLI: 'ML', MLT: 'MT', MHL: 'MH', MRT: 'MR',
  MUS: 'MU', MEX: 'MX', FSM: 'FM', MDA: 'MD', MCO: 'MC', MNG: 'MN', MNE: 'ME',
  MAR: 'MA', MOZ: 'MZ', MKD: 'MK', NAM: 'NA', NRU: 'NR', NPL: 'NP', NLD: 'NL',
  NZL: 'NZ', NIC: 'NI', NER: 'NE', NGA: 'NG', NOR: 'NO', OMN: 'OM', PAK: 'PK',
  PLW: 'PW', PSE: 'PS', PAN: 'PA', PNG: 'PG', PRY: 'PY', PER: 'PE', PHL: 'PH',
  POL: 'PL', PRT: 'PT', QAT: 'QA', ROU: 'RO', RUS: 'RU', RWA: 'RW', KNA: 'KN',
  LCA: 'LC', VCT: 'VC', WSM: 'WS', SMR: 'SM', STP: 'ST', SAU: 'SA', SEN: 'SN',
  SRB: 'RS', SYC: 'SC', SLE: 'SL', SGP: 'SG', SVK: 'SK', SVN: 'SI', SOM: 'SO',
  ZAF: 'ZA', SSD: 'SS', ESP: 'ES', SDN: 'SD', SUR: 'SR', SWE: 'SE', CHE: 'CH',
  SYR: 'SY', TJK: 'TJ', THA: 'TH', TLS: 'TL', TGO: 'TG', TON: 'TO', TTO: 'TT',
  TUN: 'TN', TUR: 'TR', TKM: 'TM', TUV: 'TV', TZA: 'TZ', UGA: 'UG', UKR: 'UA',
  ARE: 'AE', GBR: 'GB', USA: 'US', BFA: 'BF', URY: 'UY', UZB: 'UZ', VAT: 'VA',
  VEN: 'VE', VNM: 'VN', VUT: 'VU', YEM: 'YE', ZMB: 'ZM', ZWE: 'ZW',
  // Territorios adicionales que pueden aparecer en el CSV
  HKG: 'HK', MAC: 'MO', TWN: 'TW', XKX: 'XK',
};

// --- Parser CSV simple ---
// El CSV de UNDP usa comas como delimitador. Algunos campos pueden estar entre comillas.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    rows.push(fields);
  }
  return rows;
}

// --- Main ---
async function main() {
  console.log('Descargando CSV del HDR 2025...');
  const response = await fetch(HDR_CSV_URL);
  if (!response.ok) throw new Error(`Error HTTP: ${response.status} al descargar el CSV`);
  const csvText = await response.text();

  const rows = parseCSV(csvText);
  if (rows.length < 2) throw new Error('CSV vacío o mal formado');

  const headers = rows[0];

  // Buscar columna iso3
  const iso3Col = headers.indexOf('iso3');
  if (iso3Col === -1) throw new Error('Columna "iso3" no encontrada en el CSV');

  // Buscar las columnas hdi_YYYY e ihdi_YYYY más recientes (patrón dinámico)
  const hdiCols = headers
    .map((h, i) => ({ name: h, index: i }))
    .filter(c => /^hdi_\d{4}$/.test(c.name))
    .sort((a, b) => b.name.localeCompare(a.name));
  const ihdiCols = headers
    .map((h, i) => ({ name: h, index: i }))
    .filter(c => /^ihdi_\d{4}$/.test(c.name))
    .sort((a, b) => b.name.localeCompare(a.name));

  if (hdiCols.length === 0) throw new Error('No se encontraron columnas hdi_YYYY en el CSV');
  if (ihdiCols.length === 0) throw new Error('No se encontraron columnas ihdi_YYYY en el CSV');

  const hdiCol = hdiCols[0];
  const ihdiCol = ihdiCols[0];
  const dataYear = hdiCol.name.replace('hdi_', '');

  console.log(`Columnas seleccionadas: ${hdiCol.name} (index ${hdiCol.index}), ${ihdiCol.name} (index ${ihdiCol.index})`);
  console.log(`Año de datos: ${dataYear}`);

  // Parsear datos por país
  const result: Record<string, { hdi: number | null; ihdi: number | null }> = {};
  let parsed = 0;
  let skippedNoIso2 = 0;
  const unmappedIso3: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const iso3 = row[iso3Col];
    if (!iso3 || iso3.length !== 3) continue;

    const cca2 = ISO3_TO_ISO2[iso3];
    if (!cca2) {
      // Registros de agregados regionales (ej. "SSA", "EAP") — ignorar
      unmappedIso3.push(iso3);
      skippedNoIso2++;
      continue;
    }

    // Si es un override manual, saltar (se añadirá después)
    if (MANUAL_OVERRIDES[cca2]) continue;

    const hdiRaw = row[hdiCol.index];
    const ihdiRaw = row[ihdiCol.index];

    const hdiVal = hdiRaw && hdiRaw !== '..' && hdiRaw !== '' ? parseFloat(hdiRaw) : null;
    const ihdiVal = ihdiRaw && ihdiRaw !== '..' && ihdiRaw !== '' ? parseFloat(ihdiRaw) : null;

    // Solo incluir si tiene al menos HDI
    if (hdiVal !== null && !isNaN(hdiVal)) {
      result[cca2] = {
        hdi: Math.round(hdiVal * 1000) / 1000,  // 3 decimales
        ihdi: ihdiVal !== null && !isNaN(ihdiVal) ? Math.round(ihdiVal * 1000) / 1000 : null,
      };
      parsed++;
    }
  }

  // Añadir overrides manuales
  for (const [cca2, data] of Object.entries(MANUAL_OVERRIDES)) {
    result[cca2] = data;
  }

  // Ordenar por cca2 y construir output con _meta al inicio
  const sorted = Object.keys(result).sort();
  const output: Record<string, unknown> = {
    _meta: {
      source: `HDR 2025 (${hdiCol.name})`,
      dataYear: parseInt(dataYear),
      generatedAt: new Date().toISOString().split('T')[0],
      url: HDR_CSV_URL,
    },
  };
  for (const key of sorted) {
    output[key] = result[key];
  }

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + '\n', 'utf-8');

  // Resumen
  console.log('\n--- Resumen ---');
  console.log(`Países del CSV:       ${parsed}`);
  console.log(`Overrides manuales:   ${Object.keys(MANUAL_OVERRIDES).length} (${Object.keys(MANUAL_OVERRIDES).join(', ')})`);
  console.log(`Total en hdi.json:    ${sorted.length}`);
  console.log(`Registros sin mapeo:  ${skippedNoIso2} (agregados regionales)`);
  if (unmappedIso3.length > 0 && unmappedIso3.length <= 20) {
    console.log(`  ISO-3 sin mapeo:    ${unmappedIso3.join(', ')}`);
  }
  console.log(`\nEscrito: ${OUTPUT}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
