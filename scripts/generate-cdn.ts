/**
 * Script para generar los archivos del CDN de actualización de datos.
 * Lee la versión de public/data/data-version.json y copia los datos necesarios
 * al directorio cdn-output/, junto con un manifest.json.
 *
 * Ejecutar: npm run generate-cdn
 *
 * Flujo de actualización completo:
 *   1. npm run update-data          (actualizar fuentes → regenerar datos)
 *   2. Bumpear versión en public/data/data-version.json
 *   3. npm run generate-cdn          (generar archivos CDN)
 *   4. Subir cdn-output/ al hosting  (GitHub Pages, Cloudflare, etc.)
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
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

  // Crear directorios de salida
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(resolve(OUTPUT_DIR, 'i18n'), { recursive: true });

  // --- countries-base.json ---
  const countriesBaseSrc = resolve(DATA_DIR, 'countries-base.json');
  copyFileSync(countriesBaseSrc, resolve(OUTPUT_DIR, 'countries-base.json'));
  const countriesBaseKB = Math.round(readFileSync(countriesBaseSrc).length / 1024);

  // --- capitals.json ---
  const capitalsSrc = resolve(DATA_DIR, 'capitals.json');
  copyFileSync(capitalsSrc, resolve(OUTPUT_DIR, 'capitals.json'));
  const capitalsKB = Math.round(readFileSync(capitalsSrc).length / 1024);

  // --- i18n: combinar todos los idiomas en i18n-all.json + copiar individuales ---
  const i18nDir = resolve(DATA_DIR, 'i18n');
  const i18nFiles = readdirSync(i18nDir).filter(f => f.endsWith('.json')).sort();
  const i18nAll: Record<string, unknown> = {};
  let i18nLangs = 0;

  for (const file of i18nFiles) {
    const locale = basename(file, '.json');
    const content = readFileSync(resolve(i18nDir, file), 'utf-8');
    i18nAll[locale] = JSON.parse(content);
    // Copiar individual también
    copyFileSync(resolve(i18nDir, file), resolve(OUTPUT_DIR, 'i18n', file));
    i18nLangs++;
  }

  const i18nAllJson = JSON.stringify(i18nAll);
  writeFileSync(resolve(OUTPUT_DIR, 'i18n-all.json'), i18nAllJson, 'utf-8');
  const i18nAllKB = Math.round(i18nAllJson.length / 1024);

  // --- manifest.json ---
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
  console.log(`countries-base.json:  ${countriesBaseKB} KB`);
  console.log(`capitals.json:        ${capitalsKB} KB`);
  console.log(`i18n-all.json:        ${i18nAllKB} KB (${i18nLangs} idiomas)`);
  console.log(`Salida:               ${OUTPUT_DIR}/`);
  console.log('\nPara servir localmente:');
  console.log('  npx serve cdn-output -p 8080 --cors');
}

main();
