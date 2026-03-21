/**
 * Extrae geometrías 1:10m de 8 países insulares del Pacífico desde world-atlas.
 * Genera public/data/pacific-islands-10m.json (FeatureCollection GeoJSON).
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

// IDs numéricos ISO 3166 de los 8 países a extraer
const PACIFIC_IDS = new Set([
  '583',  // FM — Micronesia
  '584',  // MH — Islas Marshall
  '798',  // TV — Tuvalu
  '585',  // PW — Palaos
  '776',  // TO — Tonga
  '296',  // KI — Kiribati
  '548',  // VU — Vanuatu
  '242',  // FJ — Fiyi
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
};

// Leer topología 10m
const topoPath = join(ROOT, 'node_modules/world-atlas/countries-10m.json');
const topoRaw = readFileSync(topoPath, 'utf-8');
const topology = JSON.parse(topoRaw) as Topology<{ countries: GeometryCollection }>;

// Convertir a GeoJSON
const allFeatures = topojson.feature(topology, topology.objects.countries) as FeatureCollection;

// Filtrar los 8 países
const filtered = allFeatures.features.filter(f => PACIFIC_IDS.has(String((f as any).id)));

const result: FeatureCollection = {
  type: 'FeatureCollection',
  features: filtered,
};

// Estadísticas
console.log(`\n--- Overrides 10m para islas del Pacífico ---\n`);
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
for (const id of PACIFIC_IDS) {
  if (!foundIds.has(id)) {
    console.warn(`  ⚠ ${ID_TO_NAME[id] ?? id} (${id}) NO encontrado en 10m`);
  }
}

// Escribir resultado
const outPath = join(ROOT, 'public/data/pacific-islands-10m.json');
const json = JSON.stringify(result);
writeFileSync(outPath, json, 'utf-8');

const sizeKB = (Buffer.byteLength(json, 'utf-8') / 1024).toFixed(1);
console.log(`\n  Total: ${filtered.length} features, ${sizeKB} KB`);
console.log(`  → ${outPath}\n`);
