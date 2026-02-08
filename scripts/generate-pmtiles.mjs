// Script de un solo uso: convierte TopoJSON (world-atlas 50m) a GeoJSON
// para que tippecanoe pueda generar PMTiles.
//
// Uso:
//   node scripts/generate-pmtiles.mjs
//
// Después ejecutar tippecanoe manualmente (ver instrucciones al final).

import { readFileSync, writeFileSync } from 'fs';
import * as topojson from 'topojson-client';

const INPUT = 'public/data/countries-50m.json';
const OUT_COUNTRIES = 'public/data/countries.geojson';
const OUT_BORDERS = 'public/data/borders.geojson';

// Leer topología
const topoData = JSON.parse(readFileSync(INPUT, 'utf-8'));

// Convertir países a GeoJSON (polígonos)
const geojson = topojson.feature(topoData, topoData.objects.countries);
writeFileSync(OUT_COUNTRIES, JSON.stringify(geojson));
console.log(`Países: ${geojson.features.length} features → ${OUT_COUNTRIES}`);

// Extraer bordes compartidos como líneas con topojson.mesh()
const mesh = topojson.mesh(topoData, topoData.objects.countries);
const bordersCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { layer: 'borders' },
      geometry: mesh,
    },
  ],
};
writeFileSync(OUT_BORDERS, JSON.stringify(bordersCollection));
console.log(`Bordes: MultiLineString → ${OUT_BORDERS}`);

console.log('\nAhora ejecuta tippecanoe:');
console.log(`
tippecanoe -o public/data/countries.pmtiles -l countries -zg \\
  --no-tile-compression --detect-shared-borders \\
  public/data/countries.geojson

tippecanoe -o public/data/borders.pmtiles -l borders -zg \\
  --no-tile-compression \\
  public/data/borders.geojson

tile-join -o public/data/world.pmtiles --no-tile-compression \\
  public/data/countries.pmtiles public/data/borders.pmtiles
`);
