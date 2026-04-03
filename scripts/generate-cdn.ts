/**
 * Script para generar los archivos del CDN de actualización de datos.
 * Lee la versión de public/data/data-version.json y copia los datos necesarios
 * al directorio cdn-output/, junto con un manifest.json.
 *
 * Ejecutar: npm run generate-cdn
 *
 * Flujo de actualización completo:
 *   1. npm run update-data          (actualizar fuentes → regenerar datos)
 *   2. Bumpeir versión en public/data/data-version.json
 *   3. npm run generate-cdn          (generar archivos CDN)
 *   4. Subir cdn-output/ al hosting  (GitHub Pages, Cloudflare, etc.)
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'public', 'data');
const OUTPUT_DIR = resolve(__dirname, '..', 'cdn-output');

function main() {
  // Leer versión
  const versionFile = resolve(DATA_DIR, 'data-version.json');
  if (!existsSync(versionFile)) {
    throw new Error('No se encontró public/data/data-version.json');
  }
  const { version } = JSON.parse(readFileSync(versionFile, 'utf-8'));
  if (typeof version !== 'number') {
    throw new Error('Campo "version" inválido en data-version.json');
  }

  // Crear directorio de salida
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Copiar countries-base.json
  const countriesBaseSrc = resolve(DATA_DIR, 'countries-base.json');
  const countriesBaseDst = resolve(OUTPUT_DIR, 'countries-base.json');
  copyFileSync(countriesBaseSrc, countriesBaseDst);
  const sizeKB = Math.round(readFileSync(countriesBaseSrc).length / 1024);

  // Generar manifest.json
  const manifest = {
    version,
    updatedAt: new Date().toISOString().split('T')[0],
  };
  writeFileSync(
    resolve(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8',
  );

  // Resumen
  console.log('--- CDN generado ---');
  console.log(`Versión:              ${version}`);
  console.log(`countries-base.json:  ${sizeKB} KB`);
  console.log(`Salida:               ${OUTPUT_DIR}/`);
  console.log('\nPara servir localmente:');
  console.log('  npx serve cdn-output -p 8080 --cors');
}

main();
