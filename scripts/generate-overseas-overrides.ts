/**
 * Separa los territorios de ultramar del MultiPolygon de Francia (ID 250)
 * en el TopoJSON 50m. Genera features GeoJSON independientes para cada
 * territorio, permitiendo filtrado por continente correcto.
 *
 * Francia tiene ~10 polígonos en 50m: metrópoli (continental, Córcega, Olerón)
 * + 5 territorios de ultramar (GF, GP×3, MQ, RE, YT). El script clasifica
 * cada polígono por proximidad geográfica a la capital del territorio.
 *
 * Output: public/data/overseas-overrides.json (FeatureCollection)
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as topojson from 'topojson-client';
import { geoCentroid, geoDistance } from 'd3-geo';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Feature, Geometry, Position } from 'geojson';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ID numérico ISO 3166 de Francia en el TopoJSON
const FRANCE_ID = '250';

// Territorios de ultramar a separar (capital como punto de referencia)
const OVERSEAS_TERRITORIES: {
  id: string;
  cca2: string;
  name: string;
  point: [number, number]; // [lon, lat] de la capital
}[] = [
  { id: '254', cca2: 'GF', name: 'Guayana Francesa',  point: [-52.3, 4.9] },   // Cayena
  { id: '312', cca2: 'GP', name: 'Guadalupe',          point: [-61.5, 16.0] },  // Basse-Terre
  { id: '474', cca2: 'MQ', name: 'Martinica',          point: [-61.0, 14.6] },  // Fort-de-France
  { id: '638', cca2: 'RE', name: 'Reunión',            point: [55.5, -21.1] },  // Saint-Denis
  { id: '175', cca2: 'YT', name: 'Mayotte',            point: [45.2, -12.8] },  // Mamoudzou
];

// Umbral de distancia en radianes (~5° ≈ 550 km).
// Suficiente para capturar todos los polígonos de cada territorio sin
// ambigüedad con la metrópoli (el polígono metropolitano más cercano a
// cualquier territorio está a >30°).
const DISTANCE_THRESHOLD_RAD = 5 * (Math.PI / 180);

// Leer topología 50m
const topoPath = join(ROOT, 'public/data/countries-50m.json');
const topoRaw = readFileSync(topoPath, 'utf-8');
const topology = JSON.parse(topoRaw) as Topology<{ countries: GeometryCollection }>;

// Convertir a GeoJSON
const allFeatures = topojson.feature(topology, topology.objects.countries) as FeatureCollection;

// Encontrar Francia
const france = allFeatures.features.find(f => String((f as any).id) === FRANCE_ID);
if (!france) {
  console.error(`  ✗ Francia (ID ${FRANCE_ID}) no encontrada en el TopoJSON`);
  process.exit(1);
}

const geom = france.geometry as any;
if (geom.type !== 'MultiPolygon') {
  console.error(`  ✗ Francia no es MultiPolygon (es ${geom.type})`);
  process.exit(1);
}

console.log(`\n--- Separación de territorios de ultramar de Francia ---`);
console.log(`  Francia (ID ${FRANCE_ID}): ${geom.coordinates.length} polígonos en 50m\n`);

// Clasificar cada polígono del MultiPolygon
// territoryId → coordenadas de los polígonos asignados
const territoryPolygons = new Map<string, Position[][][]>();
const metropolitanPolygons: Position[][][] = [];

for (const polyCoords of geom.coordinates as Position[][][]) {
  // Crear un GeoJSON Polygon temporal para calcular su centroide
  const tempFeature: Feature<Geometry> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: polyCoords },
  };
  const centroid = geoCentroid(tempFeature as any) as [number, number];

  // Buscar el territorio más cercano
  let bestTerritory: typeof OVERSEAS_TERRITORIES[number] | null = null;
  let bestDistance = Infinity;

  for (const territory of OVERSEAS_TERRITORIES) {
    const dist = geoDistance(centroid, territory.point);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestTerritory = territory;
    }
  }

  if (bestTerritory && bestDistance < DISTANCE_THRESHOLD_RAD) {
    // Asignar al territorio
    const existing = territoryPolygons.get(bestTerritory.id) ?? [];
    existing.push(polyCoords);
    territoryPolygons.set(bestTerritory.id, existing);
    console.log(`  Polígono [${centroid[0].toFixed(1)}°, ${centroid[1].toFixed(1)}°] → ${bestTerritory.name} (${bestTerritory.cca2}), dist: ${(bestDistance * 180 / Math.PI).toFixed(1)}°`);
  } else {
    // Queda como metrópoli
    metropolitanPolygons.push(polyCoords);
    console.log(`  Polígono [${centroid[0].toFixed(1)}°, ${centroid[1].toFixed(1)}°] → Francia metropolitana`);
  }
}

// Construir features de salida
const outputFeatures: Feature<Geometry>[] = [];

// 1. Francia metropolitana (ID 250, MultiPolygon reducido)
if (metropolitanPolygons.length === 0) {
  console.error('\n  ✗ No quedaron polígonos para Francia metropolitana');
  process.exit(1);
}

const metroFeature: any = {
  type: 'Feature',
  id: FRANCE_ID,
  properties: { name: 'France' },
  geometry: metropolitanPolygons.length === 1
    ? { type: 'Polygon', coordinates: metropolitanPolygons[0] }
    : { type: 'MultiPolygon', coordinates: metropolitanPolygons },
};
outputFeatures.push(metroFeature);

// 2. Territorios de ultramar
for (const territory of OVERSEAS_TERRITORIES) {
  const polys = territoryPolygons.get(territory.id);
  if (!polys || polys.length === 0) {
    console.warn(`\n  ⚠ ${territory.name} (${territory.cca2}): sin polígonos en 50m — omitido`);
    continue;
  }

  const feature: any = {
    type: 'Feature',
    id: territory.id,
    properties: { name: territory.name },
    geometry: polys.length === 1
      ? { type: 'Polygon', coordinates: polys[0] }
      : { type: 'MultiPolygon', coordinates: polys },
  };
  outputFeatures.push(feature);
}

// Estadísticas
console.log(`\n  Resultado:`);
for (const f of outputFeatures) {
  const id = String((f as any).id);
  const name = f.properties?.name ?? id;
  const g = f.geometry as any;
  const nPolys = g.type === 'Polygon' ? 1
    : g.type === 'MultiPolygon' ? g.coordinates.length
    : 0;
  const nVerts = g.type === 'Polygon'
    ? g.coordinates.reduce((s: number, r: any[]) => s + r.length, 0)
    : g.type === 'MultiPolygon'
      ? g.coordinates.reduce((s: number, p: any[][]) =>
          s + p.reduce((s2: number, r: any[]) => s2 + r.length, 0), 0)
      : 0;
  console.log(`    ${name} (${id}): ${nPolys} polígono(s), ${nVerts} vértices`);
}

// Verificar territorios no encontrados
for (const territory of OVERSEAS_TERRITORIES) {
  if (!territoryPolygons.has(territory.id)) {
    console.warn(`  ⚠ ${territory.name} (${territory.cca2}) NO encontrado en el MultiPolygon`);
  }
}

// Escribir resultado
const result: FeatureCollection = {
  type: 'FeatureCollection',
  features: outputFeatures,
};

const outPath = join(ROOT, 'public/data/overseas-overrides.json');
const json = JSON.stringify(result);
writeFileSync(outPath, json, 'utf-8');

const sizeKB = (Buffer.byteLength(json, 'utf-8') / 1024).toFixed(1);
console.log(`\n  Total: ${outputFeatures.length} features, ${sizeKB} KB`);
console.log(`  → ${outPath}\n`);
