#!/usr/bin/env node

/**
 * Sube screenshots a App Store Connect.
 * Escala de 1206×2622 (iPhone 17, 6.3") al tamaño requerido por ASC.
 *
 * Uso: node scripts/upload-screenshots.mjs
 *
 * Requiere en .env.local:
 *   ASC_ISSUER_ID, ASC_KEY_ID, ASC_KEY_PATH, IOS_BUNDLE_ID
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

// ─── Configuración ───────────────────────────────────────────

const ROOT = join(import.meta.dirname, '..');
const SCREENSHOTS_DIR = join(ROOT, 'docs', 'stores', 'screenshots');
const SCALED_DIR = join(ROOT, 'docs', 'stores', 'screenshots', '_scaled');
const BASE_URL = 'https://api.appstoreconnect.apple.com';

// Candidatos de display type a probar (orden de preferencia)
const DISPLAY_CANDIDATES = [
  { type: 'APP_IPHONE_67', width: 1290, height: 2796 },
  { type: 'APP_IPHONE_69', width: 1260, height: 2736 },
  { type: 'APP_IPHONE_65', width: 1284, height: 2778 },
];

// Screenshots en orden de visualización en la store
const CATEGORIES = [
  { dir: 'globe_light', prefix: 'globe_light' },
  { dir: 'country_card_light', prefix: 'country_card_light' },
  { dir: 'play_question_light', prefix: 'play_question_light' },
  { dir: 'play_question_dark', prefix: 'play_question_dark' },
  { dir: 'passport_dark', prefix: 'passport_dark' },
];

// Nuestro locale → locale de App Store Connect
const LOCALE_MAP = {
  'ca': 'ca', 'cs': 'cs', 'da': 'da', 'de': 'de-DE',
  'el': 'el', 'en': 'en-US', 'es': 'es-ES', 'fi': 'fi',
  'fr': 'fr-FR', 'hi': 'hi', 'hr': 'hr', 'hu': 'hu',
  'id': 'id', 'it': 'it', 'ja': 'ja', 'ko': 'ko',
  'ms': 'ms', 'nb': 'no', 'nl': 'nl-NL', 'pl': 'pl',
  'pt-BR': 'pt-BR', 'pt-PT': 'pt-PT', 'ro': 'ro', 'ru': 'ru',
  'sk': 'sk', 'sv': 'sv', 'th': 'th', 'tr': 'tr',
  'uk': 'uk', 'vi': 'vi', 'zh-Hans': 'zh-Hans', 'zh-Hant': 'zh-Hant',
};

// ─── Cargar .env.local ───────────────────────────────────────

function loadEnv() {
  const envPath = join(ROOT, '.env.local');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

const env = loadEnv();
const ISSUER_ID = env.ASC_ISSUER_ID;
const KEY_ID = env.ASC_KEY_ID;
const KEY_PATH = join(ROOT, env.ASC_KEY_PATH);
const BUNDLE_ID = env.IOS_BUNDLE_ID;

// ─── JWT ─────────────────────────────────────────────────────

function generateToken() {
  const privateKey = readFileSync(KEY_PATH, 'utf-8');
  return jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '20m',
    issuer: ISSUER_ID,
    header: { kid: KEY_ID, typ: 'JWT' },
    audience: 'appstoreconnect-v1',
  });
}

// ─── API helpers ─────────────────────────────────────────────

async function api(path, options = {}) {
  const token = generateToken();
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // DELETE devuelve 204 sin body
  if (res.status === 204) return null;

  const body = await res.json();
  if (!res.ok) {
    const detail = body?.errors?.[0]?.detail || `HTTP ${res.status}`;
    const err = new Error(detail);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

async function apiGetAll(path) {
  let all = [];
  let url = path;
  while (url) {
    const res = await api(url);
    all = all.concat(res.data);
    url = res.links?.next || null;
  }
  return all;
}

// Pequeña pausa para no saturar la API
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Escalado de screenshots ─────────────────────────────────

function scaleAllScreenshots(targetWidth, targetHeight) {
  console.log(`Escalando a ${targetWidth}×${targetHeight}...`);
  mkdirSync(SCALED_DIR, { recursive: true });

  let count = 0;
  for (const ourLocale of Object.keys(LOCALE_MAP)) {
    for (let i = 0; i < CATEGORIES.length; i++) {
      const cat = CATEGORIES[i];
      const src = join(SCREENSHOTS_DIR, cat.dir, `${cat.prefix}_${ourLocale}.png`);
      // Nombre con prefijo numérico para mantener el orden
      const dst = join(SCALED_DIR, `${ourLocale}_${i + 1}_${cat.prefix}.png`);

      if (!existsSync(src)) {
        console.warn(`  ⚠ Falta: ${cat.prefix}_${ourLocale}.png`);
        continue;
      }

      execSync(`sips -z ${targetHeight} ${targetWidth} "${src}" --out "${dst}"`, {
        stdio: 'pipe',
      });
      count++;
    }
  }
  console.log(`  ${count} screenshots escalados\n`);
}

// ─── Detectar display type ───────────────────────────────────

async function detectDisplayType(testLocId) {
  for (const candidate of DISPLAY_CANDIDATES) {
    try {
      const res = await api('/v1/appScreenshotSets', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            type: 'appScreenshotSets',
            attributes: { screenshotDisplayType: candidate.type },
            relationships: {
              appStoreVersionLocalization: {
                data: { type: 'appStoreVersionLocalizations', id: testLocId },
              },
            },
          },
        }),
      });
      console.log(`Display type detectado: ${candidate.type} (${candidate.width}×${candidate.height})`);
      // Borrar el set de prueba
      await api(`/v1/appScreenshotSets/${res.data.id}`, { method: 'DELETE' });
      return candidate;
    } catch (e) {
      if (e.status === 409) {
        // Ya existe un set de este tipo — perfecto, lo usamos
        console.log(`Display type detectado (ya existente): ${candidate.type} (${candidate.width}×${candidate.height})`);
        return candidate;
      }
      // Otro error → probar el siguiente candidato
      console.log(`  ${candidate.type}: no aceptado (${e.message})`);
    }
  }
  throw new Error('Ningún display type fue aceptado por la API');
}

// ─── Subida de screenshots para un locale ────────────────────

async function uploadForLocale(locId, ourLocale, displayType) {
  // 1. Obtener o crear screenshot set
  const setsRes = await api(
    `/v1/appStoreVersionLocalizations/${locId}/appScreenshotSets`
  );
  let set = setsRes.data.find(
    (s) => s.attributes.screenshotDisplayType === displayType
  );

  if (!set) {
    const createRes = await api('/v1/appScreenshotSets', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'appScreenshotSets',
          attributes: { screenshotDisplayType: displayType },
          relationships: {
            appStoreVersionLocalization: {
              data: { type: 'appStoreVersionLocalizations', id: locId },
            },
          },
        },
      }),
    });
    set = createRes.data;
  }

  // 2. Borrar screenshots existentes en el set
  const existingRes = await api(
    `/v1/appScreenshotSets/${set.id}/appScreenshots`
  );
  for (const ss of existingRes.data) {
    await api(`/v1/appScreenshots/${ss.id}`, { method: 'DELETE' });
    await sleep(100);
  }

  // 3. Subir cada screenshot en orden
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const filePath = join(SCALED_DIR, `${ourLocale}_${i + 1}_${cat.prefix}.png`);

    if (!existsSync(filePath)) continue;

    const fileData = readFileSync(filePath);
    const fileSize = fileData.length;
    const md5 = createHash('md5').update(fileData).digest('hex');

    // 3a. Reservar
    const reserveRes = await api('/v1/appScreenshots', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'appScreenshots',
          attributes: {
            fileName: `${cat.prefix}_${ourLocale}.png`,
            fileSize,
          },
          relationships: {
            appScreenshotSet: {
              data: { type: 'appScreenshotSets', id: set.id },
            },
          },
        },
      }),
    });

    const screenshotId = reserveRes.data.id;
    const ops = reserveRes.data.attributes.uploadOperations;

    // 3b. Subir chunks
    for (const op of ops) {
      const chunk = fileData.subarray(op.offset, op.offset + op.length);
      const headers = {};
      for (const h of op.requestHeaders) headers[h.name] = h.value;

      const uploadRes = await fetch(op.url, {
        method: op.method,
        headers,
        body: chunk,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload chunk falló: ${uploadRes.status}`);
      }
    }

    // 3c. Confirmar
    await api(`/v1/appScreenshots/${screenshotId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'appScreenshots',
          id: screenshotId,
          attributes: {
            uploaded: true,
            sourceFileChecksum: md5,
          },
        },
      }),
    });

    await sleep(200);
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('Autenticando con App Store Connect API...\n');

  // 1. Buscar app y versión
  const appsRes = await api(`/v1/apps?filter[bundleId]=${BUNDLE_ID}`);
  const appId = appsRes.data[0]?.id;
  if (!appId) throw new Error(`App no encontrada para bundle ${BUNDLE_ID}`);
  console.log(`App: ${appId}`);

  const versionsRes = await api(
    `/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=1`
  );
  const versionId = versionsRes.data[0]?.id;
  const versionString = versionsRes.data[0]?.attributes?.versionString;
  if (!versionId) throw new Error('No se encontró versión');
  console.log(`Versión: ${versionString} (${versionId})`);

  // 2. Obtener localizaciones
  const locsData = await apiGetAll(
    `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=200`
  );
  const versionLocs = new Map(locsData.map((l) => [l.attributes.locale, l.id]));
  console.log(`Localizaciones: ${versionLocs.size}\n`);

  // 3. Detectar display type con la primera localización disponible
  const testLocale = 'en-US';
  const testLocId = versionLocs.get(testLocale);
  if (!testLocId) throw new Error(`Localización ${testLocale} no encontrada`);

  const display = await detectDisplayType(testLocId);

  // 4. Escalar screenshots
  scaleAllScreenshots(display.width, display.height);

  // 5. Subir para cada locale
  let ok = 0;
  let errors = 0;
  const localeEntries = Object.entries(LOCALE_MAP);

  for (let idx = 0; idx < localeEntries.length; idx++) {
    const [ourLocale, ascLocale] = localeEntries[idx];
    const locId = versionLocs.get(ascLocale);

    if (!locId) {
      console.log(`${ascLocale}: sin localización, saltando`);
      continue;
    }

    process.stdout.write(`[${idx + 1}/${localeEntries.length}] ${ascLocale}... `);

    try {
      await uploadForLocale(locId, ourLocale, display.type);
      console.log('OK (5 screenshots)');
      ok++;
    } catch (e) {
      const detail = e.body?.errors?.[0]?.detail || e.message;
      console.log(`ERROR: ${detail}`);
      errors++;
    }

    // Pausa entre locales para evitar rate limiting
    await sleep(500);
  }

  console.log(`\n${ok} idiomas subidos, ${errors} errores`);

  // Limpiar directorio temporal
  console.log(`\nScreenshots escalados en: ${SCALED_DIR}`);
  console.log('Puedes borrar _scaled/ cuando quieras.');
}

main().catch((e) => {
  console.error('\nError fatal:', e.message);
  if (e.body) console.error(JSON.stringify(e.body, null, 2));
  process.exit(1);
});
