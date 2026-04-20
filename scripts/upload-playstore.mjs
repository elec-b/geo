#!/usr/bin/env node

/**
 * Sube metadata, AAB, screenshots y crea releases en Google Play Console
 * via Android Publisher API v3.
 *
 * Uso:
 *   node scripts/upload-playstore.mjs --listings             # Textos (32 idiomas)
 *   node scripts/upload-playstore.mjs --screenshots          # Phone screenshots (32 × 5)
 *   node scripts/upload-playstore.mjs --screenshots-tablet   # 10-inch tablet (32 × 5)
 *   node scripts/upload-playstore.mjs --screenshots-tablet7  # 7-inch tablet (reutiliza set tablet)
 *   node scripts/upload-playstore.mjs --feature-graphic      # Feature graphic (32 × 1024×500)
 *   node scripts/upload-playstore.mjs --aab                  # Sube AAB al internal testing (adjunta release notes si existen)
 *   node scripts/upload-playstore.mjs --release-notes        # Actualiza release notes del release existente en internal
 *   node scripts/upload-playstore.mjs --release              # Promueve internal → production
 *   node scripts/upload-playstore.mjs --all                  # Todo en orden (una edit)
 *
 * Autenticación: lee .gcloud/playstore-uploader.json (service account).
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

const ROOT = join(import.meta.dirname, '..');
const SA_KEY_PATH = join(ROOT, '.gcloud', 'playstore-uploader.json');
const METADATA_DIR = join(ROOT, 'docs', 'stores', 'metadata');
const SCREENSHOTS_PHONE_DIR  = join(ROOT, 'docs', 'stores', 'screenshots', 'android', 'phone');
const SCREENSHOTS_TABLET_DIR = join(ROOT, 'docs', 'stores', 'screenshots', 'android', 'tablet');
const FEATURE_GRAPHIC_DIR    = join(ROOT, 'docs', 'stores', 'feature-graphic');
const RELEASE_NOTES_DIR      = join(ROOT, 'docs', 'stores', 'release-notes');
const AAB_PATH = join(ROOT, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const PACKAGE_NAME = 'com.exploris.app';
const API_BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
const UPLOAD_BASE = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3';

// Mapeo códigos del proyecto → locales de Google Play
// https://support.google.com/googleplay/android-developer/answer/9844778
const LOCALE_MAP = {
  'ca':      'ca',
  'cs':      'cs-CZ',
  'da':      'da-DK',
  'de':      'de-DE',
  'el':      'el-GR',
  'en':      'en-US',
  'es':      'es-ES',
  'fi':      'fi-FI',
  'fr':      'fr-FR',
  'hi':      'hi-IN',
  'hr':      'hr',
  'hu':      'hu-HU',
  'id':      'id',
  'it':      'it-IT',
  'ja':      'ja-JP',
  'ko':      'ko-KR',
  'ms':      'ms',
  'nb':      'nb-NO',
  'nl':      'nl-NL',
  'pl':      'pl-PL',
  'pt-BR':   'pt-BR',
  'pt-PT':   'pt-PT',
  'ro':      'ro',
  'ru':      'ru-RU',
  'sk':      'sk',
  'sv':      'sv-SE',
  'th':      'th',
  'tr':      'tr-TR',
  'uk':      'uk',
  'vi':      'vi',
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
};

// Tipos de screenshot de Google Play y su mapeo con nuestras carpetas
// Orden = orden en el que Play Store los muestra en la ficha (primero = hero)
const SCREENSHOT_TYPES = [
  { folder: 'globe_light',         prefix: 'globe_light_' },
  { folder: 'country_card_light',  prefix: 'country_card_light_' },
  { folder: 'play_pointer_light',  prefix: 'play_pointer_light_' },
  { folder: 'play_question_light', prefix: 'play_question_light_' },
  { folder: 'play_question_dark',  prefix: 'play_question_dark_' },
];

// --- Auth: JWT → access_token ---

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60_000) return cachedToken;

  const sa = JSON.parse(readFileSync(SA_KEY_PATH, 'utf-8'));
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    sa.private_key,
    { algorithm: 'RS256' }
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Auth: ${res.status} ${JSON.stringify(body)}`);

  cachedToken = body.access_token;
  tokenExpiry = Date.now() + body.expires_in * 1000;
  return cachedToken;
}

// --- API helpers ---

async function api(method, url, { body, contentType = 'application/json' } = {}) {
  const token = await getAccessToken();
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': contentType } : {}),
    },
  };
  if (body !== undefined) {
    opts.body = contentType === 'application/json' ? JSON.stringify(body) : body;
  }

  const res = await fetch(url, opts);
  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }

  if (!res.ok) {
    const err = new Error(`API ${method} ${url} → ${res.status}`);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  return parsed;
}

// --- Parser de .md de metadata ---

function parseMetadata(content) {
  const sections = content.split(/^## /m).slice(1);
  const fields = {};
  for (const section of sections) {
    const [header, ...bodyLines] = section.split('\n');
    let body = bodyLines.join('\n').trim();
    body = body.replace(/^·\s*\d+\/\d+\s*chars\s*$/m, '').trim();
    body = body.replace(/\s*·\s*\d+\/\d+\s*chars.*$/, '').trim();

    if (header.startsWith('Android Title')) {
      fields.title = body;
    } else if (header.startsWith('Short Description')) {
      fields.shortDescription = body;
    } else if (header.startsWith('Description')) {
      fields.fullDescription = body;
    }
  }
  return fields;
}

// --- Edit session ---

async function openEdit() {
  const res = await api('POST', `${API_BASE}/applications/${PACKAGE_NAME}/edits`, { body: {} });
  return res.id;
}

async function commitEdit(editId) {
  await api('POST', `${API_BASE}/applications/${PACKAGE_NAME}/edits/${editId}:commit`);
}

// --- Listings ---

async function uploadListings(editId) {
  const files = readdirSync(METADATA_DIR).filter(f => f.endsWith('.md'));
  let ok = 0, fail = 0;

  for (const file of files) {
    const lang = basename(file, '.md');
    const locale = LOCALE_MAP[lang];
    if (!locale) {
      console.warn(`  ⚠ ${lang}: sin mapeo de locale, saltando`);
      continue;
    }

    const content = readFileSync(join(METADATA_DIR, file), 'utf-8');
    const fields = parseMetadata(content);
    if (!fields.title || !fields.shortDescription || !fields.fullDescription) {
      console.warn(`  ⚠ ${lang}: faltan campos (title/short/full), saltando`);
      continue;
    }

    process.stdout.write(`  ${locale} (${lang})... `);
    try {
      await api('PUT',
        `${API_BASE}/applications/${PACKAGE_NAME}/edits/${editId}/listings/${locale}`,
        { body: fields }
      );
      console.log('OK');
      ok++;
    } catch (e) {
      const detail = e.body?.error?.message || e.message;
      console.log(`ERROR: ${detail}`);
      fail++;
    }
  }
  console.log(`  → ${ok} idiomas OK, ${fail} errores`);
}

// --- Screenshots ---

async function uploadScreenshots(editId, { sourceDir, imageType, label }) {
  const files = readdirSync(METADATA_DIR).filter(f => f.endsWith('.md'));
  let totalOk = 0, totalFail = 0;

  for (const file of files) {
    const lang = basename(file, '.md');
    const locale = LOCALE_MAP[lang];
    if (!locale) continue;

    process.stdout.write(`  ${locale} (${lang}) [${label}]: `);
    let langOk = 0, langFail = 0;

    // Limpia screenshots previas de este idioma+imageType antes de subir
    try {
      await api('DELETE',
        `${API_BASE}/applications/${PACKAGE_NAME}/edits/${editId}/listings/${locale}/${imageType}`
      );
    } catch (e) {
      if (e.status !== 404) {
        console.log(`reset ERROR: ${e.body?.error?.message || e.message}`);
        totalFail++;
        continue;
      }
    }

    for (const type of SCREENSHOT_TYPES) {
      const path = join(sourceDir, type.folder, `${type.prefix}${lang}.png`);
      if (!existsSync(path)) {
        process.stdout.write('·');
        continue;
      }
      try {
        const img = readFileSync(path);
        await api('POST',
          `${UPLOAD_BASE}/applications/${PACKAGE_NAME}/edits/${editId}/listings/${locale}/${imageType}`,
          { body: img, contentType: 'image/png' }
        );
        process.stdout.write('✓');
        langOk++;
      } catch (e) {
        process.stdout.write('✗');
        langFail++;
      }
    }
    console.log(` (${langOk} OK, ${langFail} err)`);
    totalOk += langOk;
    totalFail += langFail;
  }
  console.log(`  → ${totalOk} screenshots OK, ${totalFail} errores`);
}

// --- Feature Graphic (1024×500, uno por locale) ---

async function uploadFeatureGraphics(editId) {
  const files = readdirSync(METADATA_DIR).filter(f => f.endsWith('.md'));
  let ok = 0, fail = 0;

  for (const file of files) {
    const lang = basename(file, '.md');
    const locale = LOCALE_MAP[lang];
    if (!locale) continue;

    const path = join(FEATURE_GRAPHIC_DIR, `${lang}.png`);
    if (!existsSync(path)) {
      console.log(`  ${locale} (${lang}): sin archivo, skip`);
      continue;
    }

    process.stdout.write(`  ${locale} (${lang})... `);
    try {
      // Reset previo del feature graphic (si existe)
      try {
        await api('DELETE',
          `${API_BASE}/applications/${PACKAGE_NAME}/edits/${editId}/listings/${locale}/featureGraphic`
        );
      } catch (e) {
        if (e.status !== 404) throw e;
      }

      const img = readFileSync(path);
      await api('POST',
        `${UPLOAD_BASE}/applications/${PACKAGE_NAME}/edits/${editId}/listings/${locale}/featureGraphic?uploadType=media`,
        { body: img, contentType: 'image/png' }
      );
      console.log('OK');
      ok++;
    } catch (e) {
      const detail = e.body?.error?.message || e.message;
      console.log(`ERROR: ${detail}`);
      fail++;
    }
  }
  console.log(`  → ${ok} feature graphics OK, ${fail} errores`);
}

// --- AAB ---

async function uploadAab(editId) {
  if (!existsSync(AAB_PATH)) {
    throw new Error(`AAB no encontrado en ${AAB_PATH}. Ejecuta \`cd android && ./gradlew bundleRelease\` antes.`);
  }
  const aab = readFileSync(AAB_PATH);
  console.log(`  Subiendo ${(aab.length / 1024 / 1024).toFixed(2)} MB...`);

  const res = await api('POST',
    `${UPLOAD_BASE}/applications/${PACKAGE_NAME}/edits/${editId}/bundles?uploadType=media`,
    { body: aab, contentType: 'application/octet-stream' }
  );
  console.log(`  → versionCode ${res.versionCode}, SHA1 ${res.sha1?.slice(0, 10)}...`);
  return res.versionCode;
}

// Lee docs/stores/release-notes/<lang>.txt para los 32 idiomas y devuelve
// el array releaseNotes[] que espera Play Console (language = locale, text ≤500 chars).
function loadReleaseNotes() {
  if (!existsSync(RELEASE_NOTES_DIR)) return [];
  const notes = [];
  for (const [lang, locale] of Object.entries(LOCALE_MAP)) {
    const path = join(RELEASE_NOTES_DIR, `${lang}.txt`);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf-8').trim();
    if (!text) continue;
    if (text.length > 500) {
      console.warn(`  ⚠ ${lang}: release note excede 500 chars (${text.length}), truncando`);
      notes.push({ language: locale, text: text.slice(0, 500) });
    } else {
      notes.push({ language: locale, text });
    }
  }
  return notes;
}

async function assignToTrack(editId, versionCode, track = 'internal', releaseNotes = []) {
  const release = {
    versionCodes: [String(versionCode)],
    status: 'draft',
  };
  if (releaseNotes.length) release.releaseNotes = releaseNotes;

  await api('PUT',
    `${API_BASE}/applications/${PACKAGE_NAME}/edits/${editId}/tracks/${track}`,
    { body: { track, releases: [release] } }
  );
  const notesMsg = releaseNotes.length ? `, ${releaseNotes.length} locales con release notes` : '';
  console.log(`  → asignado al track "${track}" (status: draft${notesMsg})`);
}

// Actualiza las release notes del release existente en `track` sin re-subir AAB.
async function updateReleaseNotes(editId, track = 'internal') {
  const notes = loadReleaseNotes();
  if (!notes.length) {
    console.log(`  ⚠ No hay archivos en ${RELEASE_NOTES_DIR}, nada que actualizar.`);
    return;
  }

  const current = await api('GET',
    `${API_BASE}/applications/${PACKAGE_NAME}/edits/${editId}/tracks/${track}`
  );
  const release = current.releases?.[0];
  if (!release?.versionCodes?.length) {
    throw new Error(`No hay release en track "${track}". Sube un AAB primero con --aab.`);
  }

  await api('PUT',
    `${API_BASE}/applications/${PACKAGE_NAME}/edits/${editId}/tracks/${track}`,
    {
      body: {
        track,
        releases: [{
          versionCodes: release.versionCodes,
          status: release.status || 'draft',
          releaseNotes: notes,
        }],
      },
    }
  );
  console.log(`  → release notes actualizadas en "${track}" (${notes.length} idiomas)`);
}

// --- Release (promote internal → production) ---

async function promoteToProduction(editId) {
  // Lee el release actual en internal
  const internal = await api('GET',
    `${API_BASE}/applications/${PACKAGE_NAME}/edits/${editId}/tracks/internal`
  );
  const release = internal.releases?.[0];
  if (!release?.versionCodes?.length) {
    throw new Error('No hay release en internal. Ejecuta --aab primero.');
  }

  // Crea release en production con los mismos versionCodes
  await api('PUT',
    `${API_BASE}/applications/${PACKAGE_NAME}/edits/${editId}/tracks/production`,
    {
      body: {
        track: 'production',
        releases: [{
          versionCodes: release.versionCodes,
          status: 'draft',
          releaseNotes: release.releaseNotes,
        }],
      },
    }
  );
  console.log(`  → production release creado (status: draft, versionCodes: ${release.versionCodes.join(', ')})`);
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const flags = {
    listings:           args.includes('--listings')            || args.includes('--all'),
    screenshots:        args.includes('--screenshots')         || args.includes('--all'),
    screenshotsTablet:  args.includes('--screenshots-tablet')  || args.includes('--all'),
    screenshotsTablet7: args.includes('--screenshots-tablet7') || args.includes('--all'),
    featureGraphic:     args.includes('--feature-graphic')     || args.includes('--all'),
    aab:                args.includes('--aab')                 || args.includes('--all'),
    releaseNotes:       args.includes('--release-notes')       || args.includes('--all'),
    release:            args.includes('--release')             || args.includes('--all'),
  };

  if (!Object.values(flags).some(Boolean)) {
    console.error('Uso: node scripts/upload-playstore.mjs [--listings] [--screenshots] [--screenshots-tablet] [--screenshots-tablet7] [--feature-graphic] [--aab] [--release-notes] [--release] [--all]');
    process.exit(1);
  }

  console.log(`Abriendo edit session para ${PACKAGE_NAME}...`);
  const editId = await openEdit();
  console.log(`Edit ID: ${editId}\n`);

  if (flags.listings) {
    console.log('Subiendo listings (32 idiomas)...');
    await uploadListings(editId);
    console.log();
  }

  if (flags.screenshots) {
    console.log('Subiendo phone screenshots (32 idiomas × 5)...');
    await uploadScreenshots(editId, {
      sourceDir: SCREENSHOTS_PHONE_DIR,
      imageType: 'phoneScreenshots',
      label: 'phone',
    });
    console.log();
  }

  if (flags.screenshotsTablet) {
    console.log('Subiendo tablet (10-inch) screenshots (32 idiomas × 5)...');
    await uploadScreenshots(editId, {
      sourceDir: SCREENSHOTS_TABLET_DIR,
      imageType: 'tenInchScreenshots',
      label: 'tablet-10"',
    });
    console.log();
  }

  if (flags.screenshotsTablet7) {
    console.log('Subiendo tablet (7-inch) screenshots (reutiliza set de tablet, 32 idiomas × 5)...');
    await uploadScreenshots(editId, {
      sourceDir: SCREENSHOTS_TABLET_DIR,
      imageType: 'sevenInchScreenshots',
      label: 'tablet-7"',
    });
    console.log();
  }

  if (flags.featureGraphic) {
    console.log('Subiendo feature graphics (32 idiomas, 1024×500)...');
    await uploadFeatureGraphics(editId);
    console.log();
  }

  if (flags.aab) {
    console.log('Subiendo AAB al internal testing track...');
    const versionCode = await uploadAab(editId);
    const notes = loadReleaseNotes();
    if (notes.length) console.log(`  → ${notes.length} release notes locales encontradas, adjuntando al release`);
    await assignToTrack(editId, versionCode, 'internal', notes);
    console.log();
  }

  if (flags.releaseNotes && !flags.aab) {
    console.log('Actualizando release notes en internal...');
    await updateReleaseNotes(editId, 'internal');
    console.log();
  }

  if (flags.release) {
    console.log('Promoviendo internal → production...');
    await promoteToProduction(editId);
    console.log();
  }

  console.log('Commiteando edit...');
  await commitEdit(editId);
  console.log('\n✓ Cambios aplicados en Play Console (revísalos antes de enviar a revisión).');
}

main().catch(e => {
  console.error('\n✗ Error:');
  console.error(e.message);
  if (e.body) console.error(JSON.stringify(e.body, null, 2));
  process.exit(1);
});
