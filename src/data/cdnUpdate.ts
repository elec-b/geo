/**
 * Servicio de actualización silenciosa de datos vía CDN.
 *
 * Flujo:
 *   1. Al cargar datos (countryData.ts), se consulta si hay datos CDN más recientes
 *      que los bundled → si sí, se usan.
 *   2. Tras la carga inicial de la app (App.tsx), se verifica en background si el CDN
 *      tiene una versión más nueva → si sí, se descarga para el próximo inicio.
 *
 * Archivos gestionados:
 *   - countries-base.json  (~74 KB)  — datos base agnósticos a idioma
 *   - capitals.json        (~14 KB)  — coordenadas de capitales
 *   - i18n-all.json        (~1.9 MB) — traducciones de todos los idiomas combinadas
 *
 * Principios:
 *   - Nunca bloquea la UI.
 *   - Todos los errores se silencian (red caída, CDN inaccesible, JSON corrupto).
 *   - Offline siempre funciona (fallback a datos bundled).
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// --- Configuración ---

const CDN_BASE_URL = import.meta.env.VITE_CDN_URL || 'https://elec-b.github.io/exploris-data';
const CDN_MANIFEST_URL = `${CDN_BASE_URL}/manifest.json`;
const CDN_COUNTRIES_BASE_URL = `${CDN_BASE_URL}/countries-base.json`;
const CDN_CAPITALS_URL = `${CDN_BASE_URL}/capitals.json`;
const CDN_I18N_ALL_URL = `${CDN_BASE_URL}/i18n-all.json`;

const PREFS_KEY_VERSION = 'cdn-data-version';
const PREFS_KEY_COUNTRIES_BASE = 'cdn-countries-base';
const PREFS_KEY_CAPITALS = 'cdn-capitals';
const PREFS_KEY_I18N_ALL = 'cdn-i18n-all';

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

// --- Helpers de storage (agnóstico plataforma) ---

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

async function saveToStorage(key: string, json: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(key, json);
    return;
  }
  await Preferences.set({ key, value: json });
}

async function loadFromStorage(key: string): Promise<string | null> {
  try {
    if (!Capacitor.isNativePlatform()) {
      return localStorage.getItem(key);
    }
    const { value } = await Preferences.get({ key });
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

/**
 * Helper interno: verifica si hay datos CDN más recientes que los bundled.
 * Retorna true si la versión local (descargada) > versión bundled.
 */
async function hasCdnData(): Promise<boolean> {
  const [localVer, bundledVer] = await Promise.all([
    getLocalVersion(),
    getBundledVersion(),
  ]);
  return localVer > bundledVer;
}

// --- API pública: lectura de datos CDN (usadas por countryData.ts) ---

/**
 * Retorna countries-base.json desde CDN si la versión CDN > bundled, o null.
 */
export async function getCdnCountriesBase(): Promise<unknown[] | null> {
  try {
    if (!await hasCdnData()) return null;
    const json = await loadFromStorage(PREFS_KEY_COUNTRIES_BASE);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Retorna capitals.json desde CDN si la versión CDN > bundled, o null.
 */
export async function getCdnCapitals(): Promise<Record<string, { latlng: [number, number] }> | null> {
  try {
    if (!await hasCdnData()) return null;
    const json = await loadFromStorage(PREFS_KEY_CAPITALS);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Retorna los datos i18n para un locale desde el archivo combinado CDN.
 * Lee i18n-all.json y extrae el sub-objeto del locale pedido.
 */
export async function getCdnI18n(locale: string): Promise<Record<string, unknown> | null> {
  try {
    if (!await hasCdnData()) return null;
    const json = await loadFromStorage(PREFS_KEY_I18N_ALL);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const localeData = parsed[locale];
    if (typeof localeData !== 'object' || localeData === null) return null;
    return localeData as Record<string, unknown>;
  } catch {
    return null;
  }
}

// --- API pública: descarga en background (usada por App.tsx) ---

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

    // 3. Descargar los 3 archivos en paralelo
    const [baseResult, capsResult, i18nResult] = await Promise.allSettled([
      fetchAndValidate(CDN_COUNTRIES_BASE_URL, validateCountriesBase),
      fetchAndValidate(CDN_CAPITALS_URL, validateCapitals),
      fetchAndValidate(CDN_I18N_ALL_URL, validateI18nAll),
    ]);

    // 4. Guardar cada archivo que se descargó con éxito
    let saved = 0;

    if (baseResult.status === 'fulfilled' && baseResult.value) {
      await saveToStorage(PREFS_KEY_COUNTRIES_BASE, baseResult.value);
      saved++;
    }
    if (capsResult.status === 'fulfilled' && capsResult.value) {
      await saveToStorage(PREFS_KEY_CAPITALS, capsResult.value);
      saved++;
    }
    if (i18nResult.status === 'fulfilled' && i18nResult.value) {
      await saveToStorage(PREFS_KEY_I18N_ALL, i18nResult.value);
      saved++;
    }

    // 5. Actualizar versión solo si al menos un archivo se guardó
    if (saved > 0) {
      await setLocalVersion(cdnVersion);
      console.log(`[CDN] Datos actualizados v${cdnVersion} (${saved}/3 archivos)`);
    }
  } catch {
    // Silenciar cualquier error — la app funciona con datos bundled
  }
}

// --- Descarga + validación ---

async function fetchAndValidate(
  url: string,
  validate: (text: string) => boolean,
): Promise<string | null> {
  const resp = await fetchWithTimeout(url, DATA_TIMEOUT_MS);
  if (!resp.ok) return null;
  const text = await resp.text();
  if (!validate(text)) return null;
  return text;
}

function validateCountriesBase(text: string): boolean {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) && parsed.length >= 100;
  } catch {
    return false;
  }
}

function validateCapitals(text: string): boolean {
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      && Object.keys(parsed).length >= 100;
  } catch {
    return false;
  }
}

function validateI18nAll(text: string): boolean {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false;
    const locales = Object.keys(parsed);
    if (locales.length < 5) return false;
    // Verificar que al menos el primer locale tenga suficientes países
    const first = parsed[locales[0]];
    return typeof first === 'object' && first !== null && Object.keys(first).length >= 100;
  } catch {
    return false;
  }
}
