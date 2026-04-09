/**
 * Extrae geometrías 1:10m de países insulares con resolución 50m insuficiente.
 * Genera public/data/islands-10m.json (FeatureCollection GeoJSON).
 *
 * Estos países tienen geometrías incompletas en 1:50m (pocas islas o ausentes).
 * El archivo generado se usa como override en el loader de countries.ts.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection } from 'geojson';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// IDs numéricos ISO 3166 de los 11 países/territorios a extraer
const OVERRIDE_IDS = new Set([
  // Pacífico (9)
  '583',  // FM — Micronesia
  '584',  // MH — Islas Marshall
  '798',  // TV — Tuvalu
  '585',  // PW — Palaos
  '776',  // TO — Tonga
  '296',  // KI — Kiribati
  '548',  // VU — Vanuatu
  '242',  // FJ — Fiyi
  '612',  // PN — Pitcairn (Adamstown ausente en 50m, solo Henderson)
  // Índico (2)
  '690',  // SC — Seychelles
  '462',  // MV — Maldivas
]);

const ID_TO_NAME: Record<string, string> = {
  '583': 'Micronesia',
  '584': 'Marshall Islands',
  '798': 'Tuvalu',
  '585': 'Palau',
  '776': 'Tonga',
  '296': 'Kiribati',
  '548': 'Vanuatu',
  '242': 'Fiji',
  '612': 'Pitcairn Islands',
  '690': 'Seychelles',
  '462': 'Maldives',
};

// Leer topología 10m
const topoPath = join(ROOT, 'node_modules/world-atlas/countries-10m.json');
const topoRaw = readFileSync(topoPath, 'utf-8');
const topology = JSON.parse(topoRaw) as Topology<{ countries: GeometryCollection }>;

// Convertir a GeoJSON
const allFeatures = topojson.feature(topology, topology.objects.countries) as FeatureCollection;

// Filtrar los países con override
const filtered = allFeatures.features.filter(f => OVERRIDE_IDS.has(String((f as any).id)));

// Filtrar polígonos diminutos (< 0.015° ≈ 1.7 km).
// D3 usa geometría esférica para determinar la orientación de los rings.
// Polígonos extremadamente pequeños (atolones < ~1.7 km) pueden ser
// malinterpretados como su complemento esférico, pintando todo el globo
// con el color de país y destruyendo el contraste océano/tierra.
const MIN_POLY_SPAN_DEG = 0.015;

let droppedCount = 0;
for (const f of filtered) {
  const geom = f.geometry as any;
  if (geom.type !== 'MultiPolygon') continue;
  const before = geom.coordinates.length;
  geom.coordinates = geom.coordinates.filter((poly: number[][][]) => {
    const ring = poly[0];
    const lons = ring.map((c: number[]) => c[0]);
    const lats = ring.map((c: number[]) => c[1]);
    const span = Math.max(Math.max(...lons) - Math.min(...lons), Math.max(...lats) - Math.min(...lats));
    return span >= MIN_POLY_SPAN_DEG;
  });
  droppedCount += before - geom.coordinates.length;
}

const result: FeatureCollection = {
  type: 'FeatureCollection',
  features: filtered,
};

// Estadísticas
console.log(`\n--- Overrides 10m para islas con resolución 50m insuficiente ---`);
if (droppedCount > 0) {
  console.log(`  ⚠ ${droppedCount} polígono(s) < ${MIN_POLY_SPAN_DEG}° descartados\n`);
} else {
  console.log('');
}
for (const f of filtered) {
  const id = String((f as any).id);
  const geom = f.geometry;
  const polys = geom.type === 'Polygon' ? 1
    : geom.type === 'MultiPolygon' ? (geom as any).coordinates.length
    : 0;
  console.log(`  ${ID_TO_NAME[id] ?? id} (${id}): ${polys} polígono(s)`);
}

// Comprobar países no encontrados
const foundIds = new Set(filtered.map(f => String((f as any).id)));
for (const id of OVERRIDE_IDS) {
  if (!foundIds.has(id)) {
    console.warn(`  ⚠ ${ID_TO_NAME[id] ?? id} (${id}) NO encontrado en 10m`);
  }
}

// Escribir resultado
const outPath = join(ROOT, 'public/data/islands-10m.json');
const json = JSON.stringify(result);
writeFileSync(outPath, json, 'utf-8');

const sizeKB = (Buffer.byteLength(json, 'utf-8') / 1024).toFixed(1);
console.log(`\n  Total: ${filtered.length} features, ${sizeKB} KB`);
console.log(`  → ${outPath}\n`);
