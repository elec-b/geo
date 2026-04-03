/**
 * Servicio de actualización silenciosa de datos vía CDN.
 *
 * Flujo:
 *   1. Al cargar datos (countryData.ts), se consulta si hay datos CDN más recientes
 *      que los bundled → si sí, se usan.
 *   2. Tras la carga inicial de la app (App.tsx), se verifica en background si el CDN
 *      tiene una versión más nueva → si sí, se descarga para el próximo inicio.
 *
 * Principios:
 *   - Nunca bloquea la UI.
 *   - Todos los errores se silencian (red caída, CDN inaccesible, JSON corrupto).
 *   - Offline siempre funciona (fallback a datos bundled).
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// --- Configuración ---

const CDN_BASE_URL = import.meta.env.VITE_CDN_URL || 'https://exploris.github.io/data';
const CDN_MANIFEST_URL = `${CDN_BASE_URL}/manifest.json`;
const CDN_COUNTRIES_BASE_URL = `${CDN_BASE_URL}/countries-base.json`;

const PREFS_KEY_VERSION = 'cdn-data-version';
const PREFS_KEY_COUNTRIES_BASE = 'cdn-countries-base';

const MANIFEST_TIMEOUT_MS = 5_000;
const DATA_TIMEOUT_MS = 15_000;

// --- Versión bundled (cacheada) ---

let bundledVersion: number | null = null;

async function getBundledVersion(): Promise<number> {
  if (bundledVersion !== null) return bundledVersion;
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}data/data-version.json`);
    const data = await resp.json();
    bundledVersion = data.version ?? 0;
  } catch {
    bundledVersion = 0;
  }
  return bundledVersion;
}

// --- Helpers ---

async function getLocalVersion(): Promise<number> {
  try {
    if (!Capacitor.isNativePlatform()) {
      const val = localStorage.getItem(PREFS_KEY_VERSION);
      return val ? parseInt(val, 10) : 0;
    }
    const { value } = await Preferences.get({ key: PREFS_KEY_VERSION });
    return value ? parseInt(value, 10) : 0;
  } catch {
    return 0;
  }
}

async function setLocalVersion(version: number): Promise<void> {
  const val = String(version);
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(PREFS_KEY_VERSION, val);
    return;
  }
  await Preferences.set({ key: PREFS_KEY_VERSION, value: val });
}

async function saveCountriesBase(json: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(PREFS_KEY_COUNTRIES_BASE, json);
    return;
  }
  await Preferences.set({ key: PREFS_KEY_COUNTRIES_BASE, value: json });
}

async function loadCountriesBase(): Promise<string | null> {
  try {
    if (!Capacitor.isNativePlatform()) {
      return localStorage.getItem(PREFS_KEY_COUNTRIES_BASE);
    }
    const { value } = await Preferences.get({ key: PREFS_KEY_COUNTRIES_BASE });
    return value;
  } catch {
    return null;
  }
}

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
}

// --- API pública ---

/**
 * Intenta obtener countries-base.json desde CDN (datos previamente descargados).
 * Retorna los datos parseados si la versión CDN > bundled, o null si no hay datos CDN
 * o son más antiguos que los bundled (ej. tras actualización de la app).
 */
export async function getCdnCountriesBase(): Promise<unknown[] | null> {
  try {
    const [localVer, bundledVer] = await Promise.all([
      getLocalVersion(),
      getBundledVersion(),
    ]);

    // Solo usar datos CDN si son más recientes que los bundled
    if (localVer <= bundledVer) return null;

    const json = await loadCountriesBase();
    if (!json) return null;

    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Verifica si hay datos más recientes en el CDN y los descarga.
 * Llamar desde App.tsx tras la carga inicial (en background, sin await).
 * Los datos se aplican en el próximo inicio de la app.
 */
export async function checkAndUpdate(): Promise<void> {
  try {
    // 1. Obtener versión del CDN
    const resp = await fetchWithTimeout(CDN_MANIFEST_URL, MANIFEST_TIMEOUT_MS);
    if (!resp.ok) return;
    const manifest = await resp.json();
    const cdnVersion = manifest?.version;
    if (typeof cdnVersion !== 'number') return;

    // 2. Comparar con max(bundled, local)
    const [localVer, bundledVer] = await Promise.all([
      getLocalVersion(),
      getBundledVersion(),
    ]);
    const currentMax = Math.max(localVer, bundledVer);
    if (cdnVersion <= currentMax) return;

    // 3. Descargar datos
    const dataResp = await fetchWithTimeout(CDN_COUNTRIES_BASE_URL, DATA_TIMEOUT_MS);
    if (!dataResp.ok) return;
    const jsonText = await dataResp.text();

    // Validación básica: debe ser un array JSON
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed) || parsed.length < 100) return;

    // 4. Guardar
    await saveCountriesBase(jsonText);
    await setLocalVersion(cdnVersion);

    console.log(`[CDN] Datos actualizados v${cdnVersion} (${parsed.length} países, ${Math.round(jsonText.length / 1024)} KB)`);
  } catch {
    // Silenciar cualquier error — la app funciona con datos bundled
  }
}
