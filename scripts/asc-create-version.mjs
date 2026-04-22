#!/usr/bin/env node
/**
 * Crea una nueva App Store version en ASC (si no existe) y devuelve su ID.
 * Uso: node scripts/asc-create-version.mjs 1.0.1
 *
 * Idempotente: si la versión ya existe, imprime el ID y sale. Usar antes de
 * upload-metadata.mjs en cada nuevo release para que la API tenga una versión
 * editable a la que asociar description/keywords/whatsNew/promotionalText.
 *
 * Requiere en .env.local: ASC_ISSUER_ID, ASC_KEY_ID, ASC_KEY_PATH, IOS_BUNDLE_ID.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

const VERSION = process.argv[2];
if (!VERSION) {
  console.error('Uso: node scripts/asc-create-version.mjs <versionString>');
  process.exit(1);
}

const ROOT = join(import.meta.dirname, '..');
const BASE = 'https://api.appstoreconnect.apple.com';

const env = {};
for (const line of readFileSync(join(ROOT, '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

function token() {
  return jwt.sign({}, readFileSync(join(ROOT, env.ASC_KEY_PATH), 'utf-8'), {
    algorithm: 'ES256', expiresIn: '20m',
    issuer: env.ASC_ISSUER_ID, header: { kid: env.ASC_KEY_ID, typ: 'JWT' },
    audience: 'appstoreconnect-v1',
  });
}
async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token()}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`API ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

const apps = await api(`/v1/apps?filter[bundleId]=${env.IOS_BUNDLE_ID}`);
const appId = apps.data[0]?.id;
if (!appId) throw new Error(`App no encontrada para ${env.IOS_BUNDLE_ID}`);

const versions = await api(`/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=50`);
const existing = versions.data.find(v => v.attributes.versionString === VERSION);
if (existing) {
  console.log(`Versión ${VERSION} ya existe: ${existing.id} (${existing.attributes.appStoreState})`);
  process.exit(0);
}

console.log(`Creando versión ${VERSION}...`);
const created = await api('/v1/appStoreVersions', {
  method: 'POST',
  body: JSON.stringify({
    data: {
      type: 'appStoreVersions',
      attributes: { platform: 'IOS', versionString: VERSION },
      relationships: {
        app: { data: { type: 'apps', id: appId } },
      },
    },
  }),
});

console.log(`Creada: ${created.data.id} (${created.data.attributes.appStoreState})`);
