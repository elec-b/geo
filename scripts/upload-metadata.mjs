#!/usr/bin/env node

/**
 * Sube la metadata de la app a App Store Connect usando la API REST.
 * Lee los archivos generados por metadata-to-fastlane.mjs en fastlane/metadata/.
 *
 * Uso: node scripts/upload-metadata.mjs
 *
 * Requiere en .env.local:
 *   ASC_ISSUER_ID, ASC_KEY_ID, ASC_KEY_PATH
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

const ROOT = join(import.meta.dirname, '..');
const METADATA_DIR = join(ROOT, 'fastlane', 'metadata');
const BASE_URL = 'https://api.appstoreconnect.apple.com';

// --- Cargar .env.local ---
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

// --- JWT ---
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

// --- API helpers ---
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
  const body = await res.json();
  if (!res.ok) {
    const err = new Error(`API ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

// Paginar todos los resultados de un GET
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

// --- Leer metadata de un locale ---
function readLocaleMetadata(locale) {
  const dir = join(METADATA_DIR, locale);
  if (!existsSync(dir)) return null;

  const read = (file) => {
    const p = join(dir, file);
    return existsSync(p) ? readFileSync(p, 'utf-8').trim() : null;
  };

  return {
    name: read('name.txt'),
    subtitle: read('subtitle.txt'),
    description: read('description.txt'),
    keywords: read('keywords.txt'),
    promotionalText: read('promotional_text.txt'),
  };
}

// --- Upsert: intenta PATCH si existe, POST si no, y si POST da 409 busca el ID y hace PATCH ---
async function upsertLocalization({ type, existingId, attrs, locale, relationship, locsMap, parentPath }) {
  if (existingId) {
    await api(`/v1/${type}/${existingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ data: { type, id: existingId, attributes: attrs } }),
    });
    return;
  }

  try {
    const res = await api(`/v1/${type}`, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type,
          attributes: { locale, ...attrs },
          relationships: relationship,
        },
      }),
    });
    // Guardar el nuevo ID por si se necesita después
    if (res.data?.id) locsMap.set(locale, res.data.id);
  } catch (e) {
    if (e.status === 409) {
      // Ya existe — buscar el ID y hacer PATCH
      const allLocs = await apiGetAll(`${parentPath}?limit=200`);
      const found = allLocs.find(l => l.attributes.locale === locale);
      if (found) {
        locsMap.set(locale, found.id);
        await api(`/v1/${type}/${found.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ data: { type, id: found.id, attributes: attrs } }),
        });
      } else {
        throw e;
      }
    } else {
      throw e;
    }
  }
}

// --- Main ---
async function main() {
  console.log('Autenticando con App Store Connect API...\n');

  // 1. Buscar la app
  const appsRes = await api(`/v1/apps?filter[bundleId]=${BUNDLE_ID}`);
  const appId = appsRes.data[0]?.id;
  if (!appId) throw new Error(`App no encontrada para bundle ${BUNDLE_ID}`);
  console.log(`App encontrada: ${appId}`);

  // 2. Buscar la versión más reciente
  const versionsRes = await api(`/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=1`);
  const versionId = versionsRes.data[0]?.id;
  const versionString = versionsRes.data[0]?.attributes?.versionString;
  if (!versionId) throw new Error('No se encontró versión de App Store');
  console.log(`Versión: ${versionString} (${versionId})`);

  // 3. Obtener appInfo (para name y subtitle)
  const appInfoRes = await api(`/v1/apps/${appId}/appInfos`);
  const appInfoId = appInfoRes.data[0]?.id;
  if (!appInfoId) throw new Error('No se encontró appInfo');

  // 4. Obtener localizaciones existentes (version + appInfo) — paginando
  const versionLocsData = await apiGetAll(`/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=200`);
  const versionLocs = new Map(versionLocsData.map(l => [l.attributes.locale, l.id]));

  const appInfoLocsData = await apiGetAll(`/v1/appInfos/${appInfoId}/appInfoLocalizations?limit=200`);
  const appInfoLocs = new Map(appInfoLocsData.map(l => [l.attributes.locale, l.id]));

  console.log(`Localizaciones existentes en version: ${versionLocs.size}`);
  console.log(`Localizaciones existentes en appInfo: ${appInfoLocs.size}\n`);

  // 5. Iterar por cada locale disponible en fastlane/metadata/
  const locales = readdirSync(METADATA_DIR).filter(d =>
    existsSync(join(METADATA_DIR, d, 'description.txt'))
  );

  let ok = 0;
  let errors = 0;

  for (const locale of locales) {
    const meta = readLocaleMetadata(locale);
    if (!meta) continue;

    process.stdout.write(`${locale}... `);

    try {
      // --- App Store Version Localization (description, keywords, promotionalText) ---
      const versionAttrs = {};
      if (meta.description) versionAttrs.description = meta.description;
      if (meta.keywords) versionAttrs.keywords = meta.keywords;
      if (meta.promotionalText) versionAttrs.promotionalText = meta.promotionalText;

      if (Object.keys(versionAttrs).length > 0) {
        await upsertLocalization({
          type: 'appStoreVersionLocalizations',
          existingId: versionLocs.get(locale),
          attrs: versionAttrs,
          locale,
          relationship: {
            appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } },
          },
          locsMap: versionLocs,
          parentPath: `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations`,
        });
      }

      // --- App Info Localization (name, subtitle) ---
      const appInfoAttrs = {};
      if (meta.name) appInfoAttrs.name = meta.name;
      if (meta.subtitle) appInfoAttrs.subtitle = meta.subtitle;

      if (Object.keys(appInfoAttrs).length > 0) {
        await upsertLocalization({
          type: 'appInfoLocalizations',
          existingId: appInfoLocs.get(locale),
          attrs: appInfoAttrs,
          locale,
          relationship: {
            appInfo: { data: { type: 'appInfos', id: appInfoId } },
          },
          locsMap: appInfoLocs,
          parentPath: `/v1/appInfos/${appInfoId}/appInfoLocalizations`,
        });
      }

      console.log('OK');
      ok++;
    } catch (e) {
      const detail = e.body?.errors?.[0]?.detail || e.message;
      console.log(`ERROR: ${detail}`);
      errors++;
    }
  }

  console.log(`\n${ok} idiomas subidos, ${errors} errores`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
