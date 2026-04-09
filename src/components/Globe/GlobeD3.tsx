// Globo con D3.js proyección ortográfica sobre Canvas 2D.
// Sin tiles, sin WebGL — renderiza GeoJSON directamente sobre una esfera 2D.
// Elimina por completo los artefactos de tile boundaries.
import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { geoOrthographic, geoPath, geoContains, geoCentroid, geoDistance, geoArea } from 'd3-geo';
import type { GeoProjection, GeoPath, GeoPermissibleObjects } from 'd3-geo';
import type { FeatureCollection, Feature, Geometry, MultiLineString } from 'geojson';
import { loadCountriesGeoJson, loadBordersGeoJson, getOverrideCca2s } from '../../data/countries';
import type { CountryFeature, CountryProperties } from '../../data/countries';
import type { CapitalCoords } from '../../data/types';
import { useAppStore } from '../../stores/appStore';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { getGlobeTheme, type GlobeThemeColors } from '../../styles/globeTheme';

// Rotación automática (°/s)
const ROTATION_SPEED = 6;

// Zoom
const MIN_SCALE = 0.8;
const MAX_SCALE = 200.0;
const ZOOM_WHEEL_FACTOR = 0.001;

// Zoom adaptativo por tamaño de país (tipos C-F)
const ADAPTIVE_ZOOM_K = 0.6;
const ADAPTIVE_ZOOM_MIN = 1.5;
const ADAPTIVE_ZOOM_MAX = 40;

// Marcadores de microestados
const MARKER_RADIUS = 8;
const MARKER_LINE_WIDTH = 1.0;
const MARKER_MAX_OPACITY = 0.5;
const MARKER_DASH = [3, 3];
const MARKER_ZOOM_START = 3;
const MARKER_ZOOM_FULL = 5;
const MARKER_HIT_RADIUS_MIN = 20;
const MARKER_HIT_RADIUS_MAX = 30;
const MARKER_HIT_ZOOM_MAX = 20;
// Fade-out de marcadores: cuando el país proyectado es suficientemente grande
const MARKER_FADE_OUT_START_PX = 20; // Radio proyectado del país donde empieza fade-out
const MARKER_FADE_OUT_END_PX = 40;   // Radio proyectado donde el marcador es invisible

const MICROSTATE_CODES = new Set([
  'VA', 'MC', 'SM', 'LI', 'AD', 'MT', 'SG', 'BH', 'LU', 'KM',
  'MU', 'ST', 'CV', 'SC', 'MV', 'BN', 'TT', 'AG', 'BB', 'LC',
  'GD', 'VC', 'DM', 'KN', 'PW', 'MH', 'FM', 'NR', 'KI', 'TO',
  'WS', 'TV',
]);

// Territorios no-ONU pequeños que necesitan hit area ampliado (sin marcador visual)
const NON_UN_MICROSTATE_CODES = new Set([
  'JE', 'GG', 'IM', 'MO', 'BM', 'AX', 'AI', 'MS', 'VG', 'KY', 'TC',
  'BL', 'MF', 'SX', 'PM', 'AS', 'GU', 'MP', 'WF', 'NF', 'CK',
  'AW', 'CW', 'VI', 'SH', 'FO', 'FK',
]);

// Inercia
const INERTIA_FRICTION = 0.85;
const INERTIA_MIN_VELOCITY = 0.5;
const VELOCITY_SAMPLES = 5;

// Pin de capital (doble círculo ◎)
const CAPITAL_PIN_OUTER_R = 7;
const CAPITAL_PIN_INNER_R = 4.5;
const LABEL_FONT_BASE = 9;



/** Features sin código ISO: heredan dimming de sus países vecinos */
const ORPHAN_NEIGHBORS: Record<string, string[]> = {
  'Siachen Glacier': ['IN', 'PK', 'CN'],
};

// Etiquetas de mares y océanos (underlay — convención cartográfica: serif itálica)
// Estilo discreto: texto pequeño, sin glow, preposicionado en centro del agua
const SEA_FONT_BASE: Record<number, number> = { 0: 11, 1: 9, 2: 8, 3: 7 };
const SEA_LETTER_SPACING: Record<number, number> = { 0: 3, 1: 2, 2: 1, 3: 0 };

interface SeaLabel {
  id: string;
  lat: number;
  lon: number;
  scalerank: number;
  minZoom: number;
  [key: string]: string | number; // name_{locale} campos dinámicos
}

// Overrides de centroides visuales para países con forma irregular.
// [lon, lat] del centro visual del territorio principal (no el centroide geométrico).
const CENTROID_OVERRIDES: Record<string, [number, number]> = {
  'FR': [2.5, 46.5],     // Francia metropolitana (no Guayana)
  'US': [-98, 39],        // EE.UU. continental (no Alaska/Hawái)
  'RU': [55, 60],         // Rusia (centro visual, no Siberia oriental)
  'NZ': [174, -41],       // Nueva Zelanda (islas principales)
  'NL': [5.3, 52.2],      // Países Bajos (no Caribe)
  'CL': [-71, -35],       // Chile (centro visual)
  'NO': [10, 62],         // Noruega (no Svalbard)
  'MY': [109, 4],         // Malasia (entre Península y Borneo)
  'ID': [118, -3],        // Indonesia (centro del archipiélago)
  'JP': [138, 36],        // Japón (Honshū)
  'GB': [-2, 53],         // Reino Unido (Gran Bretaña)
  'DK': [10, 56],         // Dinamarca (no Groenlandia)
  'PT': [-8, 39.5],       // Portugal (no Azores)
  'ES': [-3.7, 40],       // España (peninsular)
  'CA': [-100, 56],       // Canadá (centro visual)
  'AU': [134, -25],       // Australia (centro del continente)
  'BR': [-53, -14],       // Brasil (centro visual)
  'CN': [104, 35],        // China (centro visual)
  'IN': [79, 22],         // India (centro visual)
  'KZ': [67, 48],         // Kazajistán (centro visual)
  'SA': [44, 24],         // Arabia Saudita (centro visual)
  'MX': [-102, 23],       // México (centro visual)
  'AR': [-64, -34],       // Argentina (centro visual)
  'PG': [147.2, -6.5],    // Papúa Nueva Guinea → isla principal (centroide geométrico disperso)
  // Archipiélagos dispersos de Oceanía (centroide en isla de la capital)
  'FM': [158.2, 6.9],     // Micronesia → Pohnpei (540 km del centroide geométrico)
  'KI': [173.0, 1.3],     // Kiribati → Tarawa (2124 km, cruza antimeridiano)
  'VU': [168.3, -17.7],   // Vanuatu → Éfaté/Port Vila (182 km)
  'MH': [171.4, 7.1],     // Islas Marshall → Majuro (116 km)
  'TV': [179.2, -8.5],    // Tuvalu → Funafuti (atolones en ~600 km)
  // Archipiélagos del Índico (centroide en isla de la capital)
  'SC': [55.5, -4.7],     // Seychelles → Mahé
  'MV': [73.5, 4.2],      // Maldivas → Malé
};

// --- Archipiélagos (hit testing mejorado) ---

// Países insulares cuyo mar entre islas debe contar como hit area
const ARCHIPELAGO_CODES = new Set([
  'PH', 'ID', 'JP', 'NZ', 'FJ', 'SB', 'VU', 'PG', 'GB', 'DK', 'GR', 'HR',
  'BS', 'CU', 'CV', 'KM', 'ST', 'TO', 'WS', 'MY', 'TT', 'EE', 'SE', 'FI', 'CL',
  'NO', 'KI', 'FM', 'MH', 'TV', 'PW', 'AG', 'KN', 'VC', 'SC', 'MV',
]);

// Subconjunto de archipiélagos cuyo hull se renderiza siempre visible.
// Criterio: archipiélagos difíciles de seleccionar o de identificar visualmente.
const HULL_VISIBLE_CODES = new Set([
  // Oceanía
  'FJ', 'SB', 'VU', 'PG', 'KI', 'FM', 'MH', 'TV', 'TO', 'WS', 'PW',
  // América
  'TT', 'AG', 'KN', 'VC',
  // Índico / África
  'SC', 'MV', 'KM', 'ST', 'CV',
]);

/**
 * Normaliza coordenadas para países que cruzan el antimeridiano.
 * Si el rango de longitudes > 180°, mapea lon negativas a [180, 360] sumando 360.
 */
function normalizeForAntimeridian(coords: [number, number][]): { coords: [number, number][]; shifted: boolean } {
  const lons = coords.map(c => c[0]);
  if (Math.max(...lons) - Math.min(...lons) <= 180) return { coords, shifted: false };

  const shifted = coords.map<[number, number]>(([lon, lat]) => [lon < 0 ? lon + 360 : lon, lat]);
  return { coords: shifted, shifted: true };
}

/** Convex hull — Andrew's monotone chain, O(n log n) */
function computeConvexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;

  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/** Point-in-polygon — ray casting, O(n) */
function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  let inside = false;
  const [px, py] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// --- Interfaces ---

/** Etiqueta puntual de feedback sobre el globo (máx. 2: error + correcto) */
export interface FeedbackLabel {
  text: string;           // Nombre del país (o "Capital\nPaís" para tipo B)
  coords: [number, number]; // [lon, lat]
  kind: 'incorrect' | 'correct';
}

export interface GlobeD3Props {
  onCountryClick?: (country: CountryFeature) => void;
  onCountryDeselect?: () => void;
  onReady?: () => void;
  showMarkers?: boolean;
  /** País seleccionado (controlado). undefined = modo interno. */
  selectedCountryCca2?: string | null;
  /** Color override para el país seleccionado. Si no se pasa, usa dorado. */
  selectedCountryColor?: string;
  /** Array de coordenadas [lon, lat] para mostrar pines de capitales */
  capitalPins?: [number, number][];
  /** Set de cca2 a resaltar (filtro continente). null = todos visibles. */
  highlightedCountries?: Set<string> | null;
  showCountryLabels?: boolean;
  showCapitalLabels?: boolean;
  /** Datos de capitales para etiquetas (Map<cca2, CapitalCoords>) */
  capitalLabelsData?: Map<string, CapitalCoords> | null;
  /** Población por país (Map<cca2, population>) para prioridad de etiquetas */
  countryPopulations?: Map<string, number> | null;
  /** Nombres de países traducidos (Map<cca2, nombre>) para etiquetas del globo */
  countryNames?: Map<string, string> | null;
  /** Etiquetas puntuales de feedback geográfico (error/correcto sobre el globo) */
  feedbackLabels?: FeedbackLabel[] | null;
  /** Mostrar etiquetas de mares y océanos (underlay) */
  showSeaLabels?: boolean;
  /** Pin de capital destacado con color contrastante (para juegos con territorio coloreado) */
  capitalPinHighlight?: { coords: [number, number]; color: string } | null;
}

export interface GlobeD3Ref {
  flyTo(lon: number, lat: number, zoom?: number, duration?: number, latOffset?: number): void;
  getCentroid(cca2: string): [number, number] | null;
  getCountryZoom(cca2: string): number | null;
  /** Retorna true si el punto está dentro del hemisferio visible (con margen) */
  isPointVisible(lon: number, lat: number): boolean;
  /** Retorna el centro de la vista actual [lon, lat] */
  getViewCenter(): [number, number];
  /** Retorna la distancia angular (radianes) desde el centro de la vista al punto dado */
  distanceFromCenter(lon: number, lat: number): number;
  /** Retorna el nivel de zoom actual */
  getCurrentZoom(): number;
  /** Retorna zoom que muestra toda la extensión territorial del país con margen */
  getCountryExtentZoom(cca2: string, margin?: number): number | null;
  /** Retorna true si hay una animación flyTo en progreso */
  isAnimating(): boolean;
  /** Retorna el centro del outline (hull) para archipiélagos, o null si no aplica */
  getOutlineCenter(cca2: string): [number, number] | null;
  /** Reinicia el globo al estado idle: posición aleatoria, zoom 1, rotación automática */
  resetToIdle(): void;
  /** Retorna las coordenadas geográficas [lon, lat] del último tap (para tolerancia en juego) */
  getLastTapCoords(): [number, number] | null;
  /** Retorna la distancia angular mínima (radianes) desde un punto a la frontera del país */
  getMinDistanceToBoundary(cca2: string, point: [number, number]): number | null;
  /** Retorna todos los centroides (ONU + no-ONU) para validación de vecindad */
  getAllCentroids(): Map<string, [number, number]>;
}

// --- Utilidades ---

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Normaliza longitud al rango [-180, 180) para evitar acumulación por auto-rotación */
function wrapLon(lon: number): number {
  return ((lon % 360) + 540) % 360 - 180;
}

// --- Componente ---

export const GlobeD3 = forwardRef<GlobeD3Ref, GlobeD3Props>(function GlobeD3(
  {
    onCountryClick,
    onCountryDeselect,
    onReady,
    showMarkers = true,
    selectedCountryCca2,
    selectedCountryColor,
    capitalPins = [],
    highlightedCountries,
    showCountryLabels = false,
    showCapitalLabels = false,
    capitalLabelsData,
    countryPopulations,
    countryNames,
    feedbackLabels,
    showSeaLabels = true,
    capitalPinHighlight,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Datos cargados
  const countriesRef = useRef<FeatureCollection<Geometry, CountryProperties> | null>(null);
  const bordersRef = useRef<Feature<MultiLineString> | null>(null);
  const overrideCca2sRef = useRef<Set<string>>(new Set());

  // Interacción (estado interno para modo no controlado)
  const selectedRef = useRef<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  // Rotación y drag
  // Posición inicial aleatoria (solo longitud) para que cada sesión arranque en un punto distinto
  const rotationRef = useRef<[number, number]>([Math.random() * 360 - 180, 0]);
  const isAutoRotatingRef = useRef(true);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; rotation: [number, number] } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(performance.now());

  // Zoom
  const scaleRef = useRef(1.0);
  const pinchRef = useRef<{
    startDist: number;
    startScale: number;
    prevMidX: number;
    prevMidY: number;
  } | null>(null);
  const gestureWasPinchRef = useRef(false);

  // Inercia
  const velocityRef = useRef<[number, number]>([0, 0]);
  const isInertiaRef = useRef(false);
  const dragSamplesRef = useRef<Array<{ x: number; y: number; time: number }>>([]);

  // Coordenadas geo del último tap (para tolerancia en juego)
  const lastTapCoordsRef = useRef<[number, number] | null>(null);

  // Marcadores, centroides, zoom mínimo y features ordenados para etiquetas
  const microstateCentroidsRef = useRef<Map<string, [number, number]>>(new Map());
  const nonUnMicroCentroidsRef = useRef<Map<string, [number, number]>>(new Map());
  const countryCentroidsRef = useRef<Map<string, [number, number]>>(new Map());
  const labelMinZoomRef = useRef<Map<string, number>>(new Map());
  const capitalMinZoomRef = useRef<Map<string, number>>(new Map());
  const sortedFeaturesRef = useRef<CountryFeature[]>([]);
  const nonUnCodesRef = useRef<Set<string>>(new Set());
  const geoAreasRef = useRef<Map<string, number>>(new Map());
  const microstateAngularRadiiRef = useRef<Map<string, number>>(new Map());
  const geoExtentsRef = useRef<Map<string, number>>(new Map());
  const archipelagoHullsRef = useRef<Map<string, { hull: [number, number][]; shifted: boolean; minZoom: number }>>(new Map());
  const hullCentroidsRef = useRef<Map<string, [number, number]>>(new Map());
  // Dirty flag: evita redibujar el canvas a 60fps cuando el globo está en reposo
  const needsRedrawRef = useRef(true); // true para el draw inicial
  // Sleep/wake: detiene el loop RAF cuando no hay nada que animar
  const isLoopSleepingRef = useRef(false);
  const animateRef = useRef<(() => void) | null>(null);

  // Despertar el loop RAF si está dormido (usa solo refs, seguro desde cualquier contexto)
  const wakeLoop = () => {
    if (isLoopSleepingRef.current && animateRef.current) {
      isLoopSleepingRef.current = false;
      lastTimeRef.current = performance.now();
      animFrameRef.current = requestAnimationFrame(animateRef.current);
    }
  };

  const showMarkersRef = useRef(showMarkers);
  if (showMarkersRef.current !== showMarkers) needsRedrawRef.current = true;
  showMarkersRef.current = showMarkers;

  const showSeaLabelsRef = useRef(showSeaLabels);
  if (showSeaLabelsRef.current !== showSeaLabels) needsRedrawRef.current = true;
  showSeaLabelsRef.current = showSeaLabels;

  // Tema activo (colores del canvas)
  const theme = useAppStore((s) => s.settings.theme);
  const globeThemeRef = useRef<GlobeThemeColors>(getGlobeTheme(theme));
  if (globeThemeRef.current !== getGlobeTheme(theme)) {
    globeThemeRef.current = getGlobeTheme(theme);
    needsRedrawRef.current = true;
  }

  // Locale activo (para sea labels multi-idioma)
  const locale = useAppStore((s) => s.settings.locale);
  const localeRef = useRef(locale);
  if (localeRef.current !== locale) needsRedrawRef.current = true;
  localeRef.current = locale;

  // Datos de etiquetas de mares/océanos
  const seaLabelsRef = useRef<SeaLabel[]>([]);
  const seaLabelsLoadedRef = useRef(false);

  // Proyección y tamaño
  const projectionRef = useRef<GeoProjection | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const DRAG_SENSITIVITY = 0.35;

  // Refs sincronizados con props (acceso en callbacks sin re-creación)
  const selectedCca2PropRef = useRef(selectedCountryCca2);
  if (selectedCca2PropRef.current !== selectedCountryCca2) needsRedrawRef.current = true;
  selectedCca2PropRef.current = selectedCountryCca2;
  const isControlledRef = useRef(selectedCountryCca2 !== undefined);
  isControlledRef.current = selectedCountryCca2 !== undefined;
  const selectedColorPropRef = useRef(selectedCountryColor);
  if (selectedColorPropRef.current !== selectedCountryColor) needsRedrawRef.current = true;
  selectedColorPropRef.current = selectedCountryColor;
  const capitalPinsRef = useRef(capitalPins);
  if (capitalPinsRef.current !== capitalPins) needsRedrawRef.current = true;
  capitalPinsRef.current = capitalPins;
  const capitalPinHighlightRef = useRef(capitalPinHighlight);
  if (capitalPinHighlightRef.current !== capitalPinHighlight) needsRedrawRef.current = true;
  capitalPinHighlightRef.current = capitalPinHighlight;
  const highlightedRef = useRef(highlightedCountries);
  if (highlightedRef.current !== highlightedCountries) needsRedrawRef.current = true;
  highlightedRef.current = highlightedCountries;
  const showCountryLabelsRef = useRef(showCountryLabels);
  if (showCountryLabelsRef.current !== showCountryLabels) needsRedrawRef.current = true;
  showCountryLabelsRef.current = showCountryLabels;
  const showCapitalLabelsRef = useRef(showCapitalLabels);
  if (showCapitalLabelsRef.current !== showCapitalLabels) needsRedrawRef.current = true;
  showCapitalLabelsRef.current = showCapitalLabels;
  const capitalLabelsRef = useRef(capitalLabelsData);
  if (capitalLabelsRef.current !== capitalLabelsData) needsRedrawRef.current = true;
  capitalLabelsRef.current = capitalLabelsData;
  const onDeselectRef = useRef(onCountryDeselect);
  onDeselectRef.current = onCountryDeselect;
  const countryPopulationsRef = useRef(countryPopulations);
  if (countryPopulationsRef.current !== countryPopulations) needsRedrawRef.current = true;
  countryPopulationsRef.current = countryPopulations;
  const countryNamesRef = useRef(countryNames);
  if (countryNamesRef.current !== countryNames) needsRedrawRef.current = true;
  countryNamesRef.current = countryNames;
  const feedbackLabelsRef = useRef(feedbackLabels);
  if (feedbackLabelsRef.current !== feedbackLabels) needsRedrawRef.current = true;
  feedbackLabelsRef.current = feedbackLabels;

  // Si algún sync check marcó dirty y el loop está dormido, despertarlo
  // (useEffect sin deps: corre después de cada render, coste negligible — solo lee 2 refs)
  useEffect(() => {
    if (needsRedrawRef.current) wakeLoop();
  });

  // Animación flyTo
  const flyToAnimRef = useRef<{
    startRotation: [number, number];
    endRotation: [number, number];
    startScale: number;
    endScale: number;
    startTime: number;
    duration: number;
  } | null>(null);

  // --- API imperativa (flyTo) ---

  useImperativeHandle(ref, () => ({
    flyTo(lon: number, lat: number, zoom?: number, duration = 800, latOffset = 0) {
      isAutoRotatingRef.current = false;
      isInertiaRef.current = false;
      velocityRef.current = [0, 0];
      isDraggingRef.current = false;
      dragStartRef.current = null;

      const targetScale = zoom ?? scaleRef.current;
      // Offset proporcional: a mayor zoom, menor desplazamiento angular
      const effectiveOffset = targetScale > 1 ? latOffset / targetScale : latOffset;

      // Normalizar longitud de inicio y calcular delta por camino más corto
      const startLon = wrapLon(rotationRef.current[0]);
      const endLon = -lon;
      let deltaLon = endLon - startLon;
      if (deltaLon > 180) deltaLon -= 360;
      if (deltaLon < -180) deltaLon += 360;

      flyToAnimRef.current = {
        startRotation: [startLon, rotationRef.current[1]],
        endRotation: [startLon + deltaLon, -(lat - effectiveOffset)],
        startScale: scaleRef.current,
        endScale: targetScale,
        startTime: performance.now(),
        duration,
      };
      wakeLoop();
    },
    getCentroid(cca2: string): [number, number] | null {
      return countryCentroidsRef.current.get(cca2) ?? null;
    },
    getAllCentroids() {
      return countryCentroidsRef.current;
    },
    getCountryZoom(cca2: string): number | null {
      const area = geoAreasRef.current.get(cca2);
      if (area == null || area <= 0) {
        // Fallback para microestados cuyo polígono en TopoJSON 50m es tan
        // simplificado que d3.geoArea() devuelve 0 (ej. Vaticano).
        return MICROSTATE_CODES.has(cca2) ? ADAPTIVE_ZOOM_MAX : null;
      }
      return Math.max(ADAPTIVE_ZOOM_MIN, Math.min(ADAPTIVE_ZOOM_MAX, ADAPTIVE_ZOOM_K / Math.sqrt(area)));
    },
    getCountryExtentZoom(cca2: string, margin: number = 1.5): number | null {
      const extent = geoExtentsRef.current.get(cca2);
      if (extent == null || extent <= 0) return null;
      const angle = Math.min(extent * margin, Math.PI / 2);
      return 1 / Math.sin(angle);
    },
    isAnimating(): boolean {
      return flyToAnimRef.current !== null;
    },
    getOutlineCenter(cca2: string): [number, number] | null {
      return hullCentroidsRef.current.get(cca2) ?? null;
    },
    isPointVisible(lon: number, lat: number): boolean {
      const rot = rotationRef.current;
      const viewCenter: [number, number] = [-rot[0], -rot[1]];
      const dist = geoDistance([lon, lat], viewCenter);
      const zoom = scaleRef.current;
      // Ángulo visible real en ortográfica = arcsin(1/zoom), con margen 80%
      const visibleAngle = Math.asin(Math.min(1, 1 / zoom)) * 0.8;
      return dist < visibleAngle;
    },
    getViewCenter(): [number, number] {
      const rot = rotationRef.current;
      return [-rot[0], -rot[1]];
    },
    distanceFromCenter(lon: number, lat: number): number {
      const rot = rotationRef.current;
      const viewCenter: [number, number] = [-rot[0], -rot[1]];
      return geoDistance([lon, lat], viewCenter);
    },
    getCurrentZoom(): number {
      return scaleRef.current;
    },
    resetToIdle() {
      // Cancelar animaciones y estado de interacción
      flyToAnimRef.current = null;
      isInertiaRef.current = false;
      velocityRef.current = [0, 0];
      isDraggingRef.current = false;
      dragStartRef.current = null;
      // Reiniciar posición, zoom y rotación automática
      rotationRef.current = [Math.random() * 360 - 180, 0];
      scaleRef.current = 1.0;
      isAutoRotatingRef.current = true;
      needsRedrawRef.current = true;
      wakeLoop();
    },
    getLastTapCoords(): [number, number] | null {
      return lastTapCoordsRef.current;
    },
    getMinDistanceToBoundary(cca2: string, point: [number, number]): number | null {
      const countries = countriesRef.current;
      if (!countries) return null;

      let minDist = Infinity;
      let found = false;

      for (const feature of countries.features) {
        if (feature.properties?.cca2 !== cca2) continue;
        found = true;

        const checkRing = (ring: number[][]) => {
          for (const pt of ring) {
            const d = geoDistance(point, [pt[0], pt[1]] as [number, number]);
            if (d < minDist) minDist = d;
          }
        };

        const geom = feature.geometry;
        if (geom.type === 'Polygon') {
          for (const ring of (geom as any).coordinates) checkRing(ring);
        } else if (geom.type === 'MultiPolygon') {
          for (const poly of (geom as any).coordinates)
            for (const ring of poly) checkRing(ring);
        }
      }

      return found ? minDist : null;
    },
  }));

  // --- Renderizado del globo ---

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const countries = countriesRef.current;
    const borders = bordersRef.current;
    if (!countries) return;

    const { width, height } = sizeRef.current;
    const radius = Math.min(width, height) / 2 - 20;
    const cx = width / 2;
    const cy = height / 2;
    const zoom = scaleRef.current;
    const scaledRadius = radius * zoom;

    const projection = geoOrthographic()
      .scale(scaledRadius)
      .translate([cx, cy])
      .clipAngle(90)
      .rotate(rotationRef.current);

    projectionRef.current = projection;
    const path: GeoPath = geoPath().projection(projection).context(ctx);

    ctx.clearRect(0, 0, width, height);

    // Atmósfera (halo exterior)
    const gradient = ctx.createRadialGradient(cx, cy, scaledRadius * 0.95, cx, cy, scaledRadius * 1.15);
    const gt = globeThemeRef.current;
    gradient.addColorStop(0, gt.atmosphere);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Océano
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = gt.ocean;
    ctx.fill();

    // Etiquetas de mares y océanos (underlay: después de océano, antes de países)
    if (showSeaLabelsRef.current && seaLabelsRef.current.length > 0) {
      const rotation = rotationRef.current;
      const viewCenter: [number, number] = [-rotation[0], -rotation[1]];
      const hasContinentFilter = highlightedRef.current !== null;

      ctx.save();
      ctx.textBaseline = 'middle';

      for (const label of seaLabelsRef.current) {
        // Visibilidad por minZoom individual (sin límite máximo)
        if (zoom < label.minZoom) continue;

        const pos = projection([label.lon, label.lat]);
        if (!pos) continue;

        // Fade hemisférico gradual (desde 70% del borde)
        const dist = geoDistance([label.lon, label.lat], viewCenter);
        const fadeHemiStart = (Math.PI / 2) * 0.7;
        let hemiOpacity = 1.0;
        if (dist > fadeHemiStart) {
          hemiOpacity = Math.max(0, 1 - (dist - fadeHemiStart) / (Math.PI / 2 - fadeHemiStart));
        }
        if (hemiOpacity <= 0) continue;

        // Fade-in suave al entrar en el rango de zoom (1 unidad de zoom de transición)
        const fadeInEnd = label.minZoom + 1.0;
        const zoomOpacity = zoom < fadeInEnd ? (zoom - label.minZoom) / 1.0 : 1.0;

        let alpha = 0.35 * zoomOpacity * hemiOpacity;
        if (hasContinentFilter) alpha *= 0.5;
        if (alpha < 0.02) continue;

        // Font y texto
        const fontBase = SEA_FONT_BASE[label.scalerank] ?? 7;
        const fontSize = Math.round(fontBase + Math.sqrt(zoom) * 1.2);
        ctx.font = `italic 300 ${fontSize}px Georgia, "New York", serif`;
        ctx.fillStyle = `rgba(${gt.seaLabelRgb}, ${alpha})`;

        const spacing = SEA_LETTER_SPACING[label.scalerank] ?? 0;
        const seaNameKey = `name_${localeRef.current.replace('-', '_')}`;
        const text = (label[seaNameKey] as string) ?? (label.name_es as string) ?? '';

        if (spacing > 0) {
          // Resetear textAlign para evitar herencia de 'center' de iteración anterior
          ctx.textAlign = 'left';
          // Char-by-char con letter-spacing
          const charWidths: number[] = [];
          let totalWidth = 0;
          for (let i = 0; i < text.length; i++) {
            const cw = ctx.measureText(text[i]).width;
            charWidths.push(cw);
            totalWidth += cw + (i < text.length - 1 ? spacing : 0);
          }
          let xCursor = pos[0] - totalWidth / 2;
          for (let i = 0; i < text.length; i++) {
            ctx.fillText(text[i], xCursor, pos[1]);
            xCursor += charWidths[i] + spacing;
          }
        } else {
          // Sin letter-spacing: un solo fillText centrado
          ctx.textAlign = 'center';
          ctx.fillText(text, pos[0], pos[1]);
        }
      }

      ctx.restore();
    }

    // País seleccionado efectivo (controlado vs interno)
    const effectiveSelected = isControlledRef.current
      ? selectedCca2PropRef.current
      : selectedRef.current;
    const filter = highlightedRef.current;

    // Países (relleno)
    for (const feature of countries.features) {
      const cca2 = feature.properties?.cca2;
      let fillColor = gt.countryFill;

      if (cca2 && cca2 === effectiveSelected) {
        fillColor = selectedColorPropRef.current ?? gt.selected;
      } else if (cca2 && cca2 === hoveredRef.current) {
        fillColor = gt.countryHover;
      }

      // Dimming por filtro de continente (color sólido, no alpha)
      if (filter != null) {
        let isDimmed: boolean;
        if (cca2 != null) {
          isDimmed = !filter.has(cca2);
        } else {
          // Features sin código ISO: heredan dimming de países vecinos
          const neighbors = ORPHAN_NEIGHBORS[feature.properties?.name as string];
          isDimmed = neighbors ? !neighbors.some(n => filter.has(n)) : false;
        }
        if (isDimmed) fillColor = gt.countryDimmed;
      }

      ctx.beginPath();
      path(feature);
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // Bordes (mesh 50m, excluye países con override 10m)
    const borderLineWidth = Math.max(0.5, 1.0 / Math.sqrt(zoom));
    if (borders) {
      ctx.beginPath();
      path(borders);
      ctx.strokeStyle = gt.border;
      ctx.lineWidth = borderLineWidth;
      ctx.stroke();
    }

    // Bordes de países con override 10m (excluidos del mesh para evitar contornos fantasma)
    if (overrideCca2sRef.current.size > 0) {
      ctx.strokeStyle = gt.border;
      ctx.lineWidth = borderLineWidth;
      for (const feature of countries.features) {
        const cca2 = feature.properties?.cca2;
        if (cca2 && overrideCca2sRef.current.has(cca2)) {
          ctx.beginPath();
          path(feature);
          ctx.stroke();
        }
      }
    }

    // Outline de convex hull para archipiélagos seleccionados
    // Muestra una línea punteada perimetral que delimita la extensión territorial
    if (effectiveSelected && HULL_VISIBLE_CODES.has(effectiveSelected) && archipelagoHullsRef.current.has(effectiveSelected)) {
      const hullData = archipelagoHullsRef.current.get(effectiveSelected)!;
      // Deshacer normalización de antimeridiano para coordenadas GeoJSON
      const ring = hullData.hull.map(([x, y]) =>
        [hullData.shifted && x > 180 ? x - 360 : x, y] as [number, number],
      );
      ring.push(ring[0]); // cerrar anillo

      const hullGeoJSON = {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'Polygon' as const, coordinates: [ring] },
      };

      ctx.beginPath();
      path(hullGeoJSON as GeoPermissibleObjects);
      ctx.strokeStyle = selectedColorPropRef.current ?? gt.selectedHull;
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'butt';
    }

    // Hulls de archipiélagos siempre visibles (zoom adaptativo por tamaño)
    // Mismo estilo que marcadores de microestados (línea discontinua blanca con fade-in)
    if (showMarkersRef.current && archipelagoHullsRef.current.size > 0) {
      const rotation = rotationRef.current;
      const viewCenter: [number, number] = [-rotation[0], -rotation[1]];
      for (const [cca2, hullData] of archipelagoHullsRef.current) {
        // Solo renderizar hulls de archipiélagos seleccionados como siempre visibles
        if (!HULL_VISIBLE_CODES.has(cca2)) continue;
        // Skip si está seleccionado (se renderiza aparte con estilo dorado)
        if (cca2 === effectiveSelected) continue;
        // Fade-in adaptativo: cada hull tiene su propio minZoom
        if (zoom < hullData.minZoom) continue;
        const t = Math.min(1, (zoom - hullData.minZoom) / 1.0);
        const opacity = t * MARKER_MAX_OPACITY;
        if (opacity <= 0) continue;

        // Comprobar visibilidad (centroide del hull dentro del hemisferio visible)
        const hullCenter = hullCentroidsRef.current.get(cca2);
        if (hullCenter && geoDistance(hullCenter, viewCenter) > Math.PI / 2) continue;

        // Dibujar hull
        const ring = hullData.hull.map(([x, y]) =>
          [hullData.shifted && x > 180 ? x - 360 : x, y] as [number, number],
        );
        ring.push(ring[0]);
        const hullGeoJSON = {
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'Polygon' as const, coordinates: [ring] },
        };
        ctx.beginPath();
        path(hullGeoJSON as GeoPermissibleObjects);
        ctx.strokeStyle = `rgba(${gt.markerRgb}, ${opacity})`;
        ctx.lineWidth = MARKER_LINE_WIDTH;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.setLineDash(MARKER_DASH);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'butt';
    }

    // Marcadores de microestados (fade-in global + fade-out per-microestado)
    if (showMarkersRef.current && zoom >= MARKER_ZOOM_START && microstateCentroidsRef.current.size > 0) {
      const fadeInT = Math.min(1, (zoom - MARKER_ZOOM_START) / (MARKER_ZOOM_FULL - MARKER_ZOOM_START));
      const fadeInOpacity = fadeInT * MARKER_MAX_OPACITY;
      const rotation = rotationRef.current;
      const viewCenter: [number, number] = [-rotation[0], -rotation[1]];
      const angularRadii = microstateAngularRadiiRef.current;

      ctx.lineWidth = MARKER_LINE_WIDTH;
      ctx.setLineDash(MARKER_DASH);

      for (const [cca2, centroid] of microstateCentroidsRef.current) {
        if (geoDistance(centroid, viewCenter) > Math.PI / 2) continue;
        const pos = projection(centroid);
        if (!pos) continue;

        // Fade-out cuando el país proyectado es suficientemente grande
        let markerOpacity = fadeInOpacity;
        const angularRadius = angularRadii.get(cca2);
        if (angularRadius) {
          const projectedRadius = angularRadius * scaledRadius;
          if (projectedRadius >= MARKER_FADE_OUT_END_PX) continue;
          if (projectedRadius > MARKER_FADE_OUT_START_PX) {
            const fadeOutT = (projectedRadius - MARKER_FADE_OUT_START_PX)
                           / (MARKER_FADE_OUT_END_PX - MARKER_FADE_OUT_START_PX);
            markerOpacity = fadeInOpacity * (1 - fadeOutT);
          }
        }

        ctx.strokeStyle = `rgba(${gt.markerRgb}, ${markerOpacity})`;
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], MARKER_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Circulitos de todas las capitales (cuando toggle "Capitales" está activo)
    if (showCapitalLabelsRef.current && capitalLabelsRef.current) {
      const rotation = rotationRef.current;
      const viewCenter: [number, number] = [-rotation[0], -rotation[1]];
      for (const [cca2, capital] of capitalLabelsRef.current) {
        if (filter && !filter.has(cca2)) continue;
        const coords: [number, number] = [capital.latlng[1], capital.latlng[0]];
        if (geoDistance(coords, viewCenter) > Math.PI / 2) continue;
        const pos = projection(coords);
        if (!pos) continue;
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 2.5, 0, Math.PI * 2);
        ctx.fillStyle = nonUnCodesRef.current.has(cca2) ? gt.capitalPinNonUn : gt.capitalPin;
        ctx.globalAlpha = 0.6;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Pines de capitales (doble círculo ◎ — bullseye)
    const pins = capitalPinsRef.current;
    if (pins.length > 0) {
      const rotation = rotationRef.current;
      const viewCenter: [number, number] = [-rotation[0], -rotation[1]];
      const selCca2 = selectedCca2PropRef.current;
      const pinColor = (selCca2 && nonUnCodesRef.current.has(selCca2))
        ? gt.capitalPinNonUn
        : gt.capitalPin;
      ctx.lineWidth = Math.max(0.5, 1.0 / Math.sqrt(zoom));
      const hl = capitalPinHighlightRef.current;
      for (const pinCoords of pins) {
        if (geoDistance(pinCoords, viewCenter) >= Math.PI / 2) continue;
        const pos = projection(pinCoords);
        if (!pos) continue;
        // Color: destacado si coincide con el pin del país target
        const currentColor = (hl && pinCoords[0] === hl.coords[0] && pinCoords[1] === hl.coords[1])
          ? hl.color
          : pinColor;
        // Anillo exterior
        ctx.strokeStyle = currentColor;
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], CAPITAL_PIN_OUTER_R, 0, Math.PI * 2);
        ctx.stroke();
        // Anillo interior
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], CAPITAL_PIN_INNER_R, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Etiquetas de feedback geográfico (máx 2: error rojo + correcto verde)
    const fbLabels = feedbackLabelsRef.current;
    if (fbLabels && fbLabels.length > 0) {
      const rotation = rotationRef.current;
      const viewCenter: [number, number] = [-rotation[0], -rotation[1]];
      for (const label of fbLabels) {
        if (geoDistance(label.coords, viewCenter) > Math.PI / 2) continue;
        const pos = projection(label.coords);
        if (!pos) continue;

        // Color según tema: el color del país (rojo/verde) ya indica acierto/error
        const color = gt.label;
        const lines = label.text.split('\n');
        const mainSize = Math.round(12 + Math.sqrt(zoom) * 2);
        const subSize = Math.round(mainSize * 0.75);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = gt.labelShadow;
        ctx.shadowBlur = 4;
        ctx.fillStyle = color;

        // Offset hacia arriba para no solapar con el highlight dorado
        const baseY = pos[1] - 14;

        if (lines.length === 1) {
          ctx.font = `700 ${mainSize}px -apple-system, sans-serif`;
          ctx.fillText(lines[0], pos[0], baseY);
        } else {
          // Dos líneas: primera más grande (capital), segunda más pequeña (país)
          ctx.font = `700 ${mainSize}px -apple-system, sans-serif`;
          ctx.fillText(lines[0], pos[0], baseY - subSize - 2);
          ctx.font = `600 ${subSize}px -apple-system, sans-serif`;
          ctx.fillText(lines[1], pos[0], baseY);
        }
        ctx.shadowBlur = 0;
      }
    }

    // Etiquetas de países y capitales (con anti-solapamiento)
    const showCountryLbls = showCountryLabelsRef.current && countryCentroidsRef.current.size > 0;
    const showCapitalLbls = showCapitalLabelsRef.current && capitalLabelsRef.current;

    if (showCountryLbls || showCapitalLbls) {
      const rotation = rotationRef.current;
      const viewCenter: [number, number] = [-rotation[0], -rotation[1]];

      // Array compartido de bounding boxes para colisión entre etiquetas
      const usedRects: Array<[number, number, number, number]> = []; // [x, y, w, h]

      // Mapa cca2 → índice en usedRects (para excluir rect del padre al dibujar capitales)
      const countryRectIndex = new Map<string, number>();

      const collidesExcluding = (rect: [number, number, number, number], excludeIdx?: number) =>
        usedRects.some(([rx, ry, rw, rh], i) =>
          i !== excludeIdx &&
          rect[0] < rx + rw && rect[0] + rect[2] > rx &&
          rect[1] < ry + rh && rect[1] + rect[3] > ry
        );

      // --- Etiquetas de países ---
      if (showCountryLbls) {
        const fontSize = Math.round(LABEL_FONT_BASE + Math.sqrt(zoom) * 2.5);
        ctx.font = `500 ${fontSize}px -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = gt.labelShadow;
        ctx.shadowBlur = 3;

        // Iterar features ordenados por área descendente: países grandes tienen prioridad visual
        for (const feature of sortedFeaturesRef.current) {
          const cca2 = feature.properties?.cca2;
          if (!cca2) continue;
          if (filter && !filter.has(cca2)) continue;

          // Filtro por zoom mínimo (anti-solapamiento por densidad)
          const minZoom = labelMinZoomRef.current.get(cca2);
          if (minZoom !== undefined && zoom < minZoom) continue;

          const centroid = countryCentroidsRef.current.get(cca2);
          if (!centroid) continue;
          if (geoDistance(centroid, viewCenter) > Math.PI / 2) continue;

          const pos = projection(centroid);
          if (!pos) continue;

          // Separación vertical simétrica si la capital está muy cerca
          let yOffset = 0;
          if (showCapitalLbls && capitalLabelsRef.current) {
            const capData = capitalLabelsRef.current.get(cca2);
            if (capData) {
              const capCoords: [number, number] = [capData.latlng[1], capData.latlng[0]];
              const capPos = projection(capCoords);
              if (capPos) {
                const dist = Math.hypot(pos[0] - capPos[0], pos[1] - capPos[1]);
                if (dist < fontSize * 1.5) {
                  yOffset = -fontSize * 0.7;
                }
              }
            }
          }

          const labelName = countryNamesRef.current?.get(cca2) ?? feature.properties.name;
          const textW = ctx.measureText(labelName).width;
          const rect: [number, number, number, number] = [
            pos[0] - textW / 2, pos[1] + yOffset - fontSize / 2, textW, fontSize,
          ];
          if (collidesExcluding(rect)) continue;
          countryRectIndex.set(cca2, usedRects.length);
          usedRects.push(rect);

          ctx.fillStyle = feature.properties.isUNMember ? gt.label : gt.labelNonUn;
          ctx.fillText(labelName, pos[0], pos[1] + yOffset);
        }
        ctx.shadowBlur = 0;
      }

      // --- Etiquetas de capitales ---
      if (showCapitalLbls && capitalLabelsRef.current) {
        const fontSize = Math.round(LABEL_FONT_BASE - 1 + Math.sqrt(zoom) * 2);
        ctx.font = `${fontSize}px -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = gt.labelShadow;
        ctx.shadowBlur = 3;

        const sortedCapitals = [...capitalLabelsRef.current.entries()]
          .sort((a, b) => {
            const popA = countryPopulationsRef.current?.get(a[0]) ?? 0;
            const popB = countryPopulationsRef.current?.get(b[0]) ?? 0;
            return popB - popA;
          });
        for (const [cca2, capital] of sortedCapitals) {
          if (filter && !filter.has(cca2)) continue;

          // Capitales usan escala de zoom más permisiva (compiten por colisión)
          const minZoom = capitalMinZoomRef.current.get(cca2);
          if (minZoom !== undefined && zoom < minZoom) continue;

          const coords: [number, number] = [capital.latlng[1], capital.latlng[0]];
          if (geoDistance(coords, viewCenter) > Math.PI / 2) continue;

          const pos = projection(coords);
          if (!pos) continue;

          let yPos = pos[1] + 6;
          const textW = ctx.measureText(capital.name).width;
          const rect: [number, number, number, number] = [
            pos[0] - textW / 2, yPos, textW, fontSize,
          ];
          // Si solapa con el rect del país padre, mover justo debajo (+2px gap)
          const parentIdx = countryRectIndex.get(cca2);
          if (parentIdx !== undefined) {
            const parentRect = usedRects[parentIdx];
            if (
              rect[0] < parentRect[0] + parentRect[2] && rect[0] + rect[2] > parentRect[0] &&
              rect[1] < parentRect[1] + parentRect[3] && rect[1] + rect[3] > parentRect[1]
            ) {
              yPos = parentRect[1] + parentRect[3] + 2;
              rect[1] = yPos;
            }
          }
          // Excluir el rect del país padre para que la capital solo compita contra OTROS
          if (collidesExcluding(rect, parentIdx)) {
            // Intentar apilar debajo del rect que colisiona
            const collidingIdx = usedRects.findIndex(([rx, ry, rw, rh], i) =>
              i !== parentIdx &&
              rect[0] < rx + rw && rect[0] + rect[2] > rx &&
              rect[1] < ry + rh && rect[1] + rect[3] > ry
            );
            if (collidingIdx === -1) continue;
            const collidingRect = usedRects[collidingIdx];
            yPos = collidingRect[1] + collidingRect[3] + 2;
            rect[1] = yPos;
            // Re-verificar tras desplazamiento
            if (collidesExcluding(rect, parentIdx)) continue;
          }
          usedRects.push(rect);

          ctx.fillStyle = nonUnCodesRef.current.has(cca2) ? gt.labelCapitalNonUn : gt.labelCapital;
          ctx.fillText(capital.name, pos[0], yPos);
        }
        ctx.shadowBlur = 0;
      }
    }
  }, []);

  // --- Loop de animación ---

  const animate = useCallback(() => {
    const now = performance.now();
    const delta = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    let shouldDraw = needsRedrawRef.current;

    // flyTo tiene prioridad sobre inercia y auto-rotación
    const flyTo = flyToAnimRef.current;
    if (flyTo) {
      const elapsed = now - flyTo.startTime;
      const t = Math.min(1, elapsed / flyTo.duration);
      const ease = easeInOutCubic(t);

      rotationRef.current = [
        flyTo.startRotation[0] + (flyTo.endRotation[0] - flyTo.startRotation[0]) * ease,
        flyTo.startRotation[1] + (flyTo.endRotation[1] - flyTo.startRotation[1]) * ease,
      ];

      // Interpolación logarítmica: el ojo percibe cambios de zoom como
      // multiplicaciones, no sumas. Log distribuye el cambio visual uniformemente.
      const logStart = Math.log(flyTo.startScale);
      const logEnd = Math.log(flyTo.endScale);
      scaleRef.current = Math.exp(logStart + (logEnd - logStart) * ease);

      if (t >= 1) flyToAnimRef.current = null;
      shouldDraw = true;
    } else if (isInertiaRef.current) {
      const [vx, vy] = velocityRef.current;
      const [lambda, phi] = rotationRef.current;
      rotationRef.current = [
        wrapLon(lambda + vx * delta),
        Math.max(-80, Math.min(80, phi + vy * delta)),
      ];
      velocityRef.current = [vx * INERTIA_FRICTION, vy * INERTIA_FRICTION];
      if (Math.hypot(velocityRef.current[0], velocityRef.current[1]) < INERTIA_MIN_VELOCITY) {
        isInertiaRef.current = false;
        velocityRef.current = [0, 0];
      }
      shouldDraw = true;
    } else if (isAutoRotatingRef.current && !isDraggingRef.current) {
      const [lambda, phi] = rotationRef.current;
      rotationRef.current = [wrapLon(lambda + ROTATION_SPEED * delta), phi];
      shouldDraw = true;
    }

    if (isDraggingRef.current || pinchRef.current) {
      shouldDraw = true;
    }

    if (shouldDraw) {
      draw();
      needsRedrawRef.current = false;
    }

    // Sleep/wake: solo programar siguiente frame si hay motivo para seguir
    const shouldContinue = flyToAnimRef.current !== null
      || isInertiaRef.current
      || (isAutoRotatingRef.current && !isDraggingRef.current)
      || isDraggingRef.current
      || pinchRef.current !== null;

    if (shouldContinue || needsRedrawRef.current) {
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      isLoopSleepingRef.current = true;
    }
  }, [draw]);

  // Actualizar ref de animate para acceso desde wakeLoop
  animateRef.current = animate;

  // --- Hit test ---

  const hitTest = useCallback((x: number, y: number): Feature<Geometry, CountryProperties> | null => {
    const projection = projectionRef.current;
    const countries = countriesRef.current;
    if (!projection || !countries) return null;

    // Almacenar coordenadas geo del tap para tolerancia en juego
    const tapCoords = projection.invert?.([x, y]);
    lastTapCoordsRef.current = tapCoords ? [tapCoords[0], tapCoords[1]] : null;

    const zoom = scaleRef.current;
    const markersVisible = showMarkersRef.current && zoom >= MARKER_ZOOM_START
      && microstateCentroidsRef.current.size > 0;

    // Prioridad a marcadores de microestados (el usuario ve el anillo y toca sobre él)
    if (markersVisible) {
      const zoomT = Math.min(1, (zoom - MARKER_ZOOM_START) / (MARKER_HIT_ZOOM_MAX - MARKER_ZOOM_START));
      const hitRadius = MARKER_HIT_RADIUS_MIN + zoomT * (MARKER_HIT_RADIUS_MAX - MARKER_HIT_RADIUS_MIN);
      const angularRadii = microstateAngularRadiiRef.current;
      const { width, height } = sizeRef.current;
      const currentScaledRadius = (Math.min(width, height) / 2 - 20) * zoom;

      for (const [cca2, centroid] of microstateCentroidsRef.current) {
        // Saltar hit test si el marcador está completamente invisible por fade-out
        const angularRadius = angularRadii.get(cca2);
        if (angularRadius && angularRadius * currentScaledRadius >= MARKER_FADE_OUT_END_PX) continue;

        const pos = projection(centroid);
        if (!pos) continue;
        if (Math.hypot(x - pos[0], y - pos[1]) < hitRadius) {
          const feature = countries.features.find(f => f.properties?.cca2 === cca2);
          if (feature) return feature as Feature<Geometry, CountryProperties>;
        }
      }
    }

    // Búsqueda normal por geometría (reutilizar invert del inicio)
    const coords = tapCoords;
    if (!coords) return null;

    for (const feature of countries.features) {
      if (geoContains(feature, coords)) {
        return feature as Feature<Geometry, CountryProperties>;
      }
    }

    // Fallback: convex hulls de archipiélagos (tocar mar entre islas)
    const hulls = archipelagoHullsRef.current;
    if (hulls.size > 0) {
      let bestFeature: Feature<Geometry, CountryProperties> | null = null;
      let bestDist = Infinity;
      for (const [cca2, { hull, shifted }] of hulls) {
        // Normalizar el punto de consulta al mismo espacio que el hull
        const testPoint: [number, number] = shifted && (coords as [number, number])[0] < 0
          ? [(coords as [number, number])[0] + 360, (coords as [number, number])[1]]
          : coords as [number, number];
        if (!pointInPolygon(testPoint, hull)) continue;
        const feature = countries.features.find(f => f.properties?.cca2 === cca2);
        if (!feature) continue;
        // Si hay hulls solapados, elegir el más cercano al centroide
        const centroid = countryCentroidsRef.current.get(cca2);
        if (centroid) {
          const dist = geoDistance(coords as [number, number], centroid);
          if (dist < bestDist) {
            bestDist = dist;
            bestFeature = feature as Feature<Geometry, CountryProperties>;
          }
        } else {
          bestFeature = feature as Feature<Geometry, CountryProperties>;
        }
      }
      // Los hulls visibles (archipiélagos pequeños) no contienen islas de
      // otros países — tap dentro del hull = siempre ese país.
      // El centroid override solo aplica a hulls invisibles de archipiélagos
      // grandes (ej. Indonesia) que pueden contener vecinos (ej. Timor-Leste).
      if (bestFeature) {
        const bestCca2 = bestFeature.properties?.cca2;
        if (!bestCca2 || !HULL_VISIBLE_CODES.has(bestCca2)) {
          for (const [cca2, centroid] of countryCentroidsRef.current) {
            if (hulls.has(cca2)) continue;
            const dist = geoDistance(coords as [number, number], centroid);
            if (dist < bestDist) {
              const feat = countries.features.find(f => f.properties?.cca2 === cca2);
              if (feat) {
                bestDist = dist;
                bestFeature = feat as Feature<Geometry, CountryProperties>;
              }
            }
          }
        }
        return bestFeature;
      }
    }

    // Hit area ampliado para microestados no-ONU (sin marcador visual).
    // Último: no deben interceptar taps sobre geometría real ni hulls de países ONU
    // (ej. Samoa Americana no debe capturar taps sobre Samoa)
    if (zoom >= MARKER_ZOOM_START && nonUnMicroCentroidsRef.current.size > 0) {
      const zoomT = Math.min(1, (zoom - MARKER_ZOOM_START) / (MARKER_HIT_ZOOM_MAX - MARKER_ZOOM_START));
      const hitRadius = MARKER_HIT_RADIUS_MIN + zoomT * (MARKER_HIT_RADIUS_MAX - MARKER_HIT_RADIUS_MIN);
      for (const [cca2, centroid] of nonUnMicroCentroidsRef.current) {
        const pos = projection(centroid);
        if (!pos) continue;
        if (Math.hypot(x - pos[0], y - pos[1]) < hitRadius) {
          const feature = countries.features.find(f => f.properties?.cca2 === cca2);
          if (feature) return feature as Feature<Geometry, CountryProperties>;
        }
      }
    }

    return null;
  }, []);

  // --- Resize ---

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    sizeRef.current = { width: rect.width, height: rect.height };
    draw();
  }, [draw]);

  // --- Carga de datos ---

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadCountriesGeoJson(), loadBordersGeoJson()]).then(
      ([countries, borders]) => {
        if (cancelled) return;
        countriesRef.current = countries;
        bordersRef.current = borders;
        overrideCca2sRef.current = getOverrideCca2s();

        // Pre-calcular centroides (con overrides visuales) y zoom mínimo por importancia
        const allCentroids = new Map<string, [number, number]>();
        const microCentroids = new Map<string, [number, number]>();
        const nonUnMicroCentroids = new Map<string, [number, number]>();
        const areas = new Map<string, number>();

        for (const feature of countries.features) {
          const cca2 = feature.properties?.cca2;
          if (cca2) {
            const area = geoArea(feature);
            // Si ya existe un feature con más área para este cca2, ignorar el duplicado
            if (areas.has(cca2) && area <= areas.get(cca2)!) continue;

            const centroid = CENTROID_OVERRIDES[cca2] ?? (geoCentroid(feature) as [number, number]);
            allCentroids.set(cca2, centroid);
            if (MICROSTATE_CODES.has(cca2) && !HULL_VISIBLE_CODES.has(cca2)) {
              microCentroids.set(cca2, centroid);
            }
            if (NON_UN_MICROSTATE_CODES.has(cca2)) {
              nonUnMicroCentroids.set(cca2, centroid);
            }
            areas.set(cca2, area);
          }
        }

        // Radio angular de microestados para fade-out de marcadores
        const microstateAngularRadii = new Map<string, number>();
        for (const [cca2] of microCentroids) {
          const area = areas.get(cca2);
          if (area && area > 0) {
            microstateAngularRadii.set(cca2, Math.sqrt(area / Math.PI));
          }
        }

        // Extensión angular por país (distancia máxima centroide → vértice).
        // Para países con override de centroide, filtramos vértices lejanos (>15°)
        // para excluir territorios ultramarinos que distorsionan la extensión.
        const EXTENT_DIST_THRESHOLD = 0.26; // ~15° en radianes
        const extents = new Map<string, number>();
        for (const feature of countries.features) {
          const cca2 = feature.properties?.cca2;
          if (!cca2) continue;
          const centroid = allCentroids.get(cca2);
          if (!centroid) continue;

          const hasOverride = cca2 in CENTROID_OVERRIDES;
          const threshold = hasOverride ? EXTENT_DIST_THRESHOLD : Infinity;
          let maxDist = extents.get(cca2) ?? 0;

          const checkDist = (ring: number[][]) => {
            for (const pt of ring) {
              const d = geoDistance([pt[0], pt[1]] as [number, number], centroid);
              if (d <= threshold && d > maxDist) maxDist = d;
            }
          };

          const geom = feature.geometry;
          if (geom.type === 'Polygon') {
            for (const ring of geom.coordinates) checkDist(ring as number[][]);
          } else if (geom.type === 'MultiPolygon') {
            for (const poly of geom.coordinates)
              for (const ring of poly) checkDist(ring as number[][]);
          }

          extents.set(cca2, maxDist);
        }

        // Asignar zoom mínimo para anti-solapamiento de etiquetas
        const sortedByArea = [...areas.entries()].sort((a, b) => b[1] - a[1]);
        const total = sortedByArea.length;
        const minZoomMap = new Map<string, number>();
        sortedByArea.forEach(([cca2], i) => {
          const pct = i / total;
          if (pct < 0.15) minZoomMap.set(cca2, 1.0);       // Top 15%: siempre visibles
          else if (pct < 0.4) minZoomMap.set(cca2, 2.0);    // Top 40%: zoom ×2
          else if (pct < 0.7) minZoomMap.set(cca2, 4.0);    // Top 70%: zoom ×4
          else minZoomMap.set(cca2, 8.0);                    // Resto: zoom ×8
        });

        // Escala más permisiva para capitales (entran antes al loop, compiten en colisión)
        const capitalMinZoomMap = new Map<string, number>();
        sortedByArea.forEach(([cca2], i) => {
          const pct = i / total;
          if (pct < 0.15) capitalMinZoomMap.set(cca2, 1.0);
          else if (pct < 0.4) capitalMinZoomMap.set(cca2, 1.5);
          else if (pct < 0.7) capitalMinZoomMap.set(cca2, 2.5);
          else capitalMinZoomMap.set(cca2, 4.0);
        });

        // Convex hulls para archipiélagos (hit testing del mar entre islas)
        const hullsByCca2 = new Map<string, { hull: [number, number][]; shifted: boolean; minZoom: number }>();
        const coordsByCca2 = new Map<string, [number, number][]>();

        for (const feature of countries.features) {
          const cca2 = feature.properties?.cca2;
          if (!cca2 || !ARCHIPELAGO_CODES.has(cca2)) continue;

          // Extraer coordenadas de la geometría
          const geom = feature.geometry;
          const coords = coordsByCca2.get(cca2) ?? [];
          const extract = (ring: number[][]) => {
            for (const pt of ring) coords.push([pt[0], pt[1]]);
          };

          if (geom.type === 'Polygon') {
            for (const ring of geom.coordinates) extract(ring as number[][]);
          } else if (geom.type === 'MultiPolygon') {
            for (const poly of geom.coordinates)
              for (const ring of poly) extract(ring as number[][]);
          }
          coordsByCca2.set(cca2, coords);
        }

        // Padding angular proporcional al tamaño del hull para que el outline
        // no quede pegado a las islas. Archipiélagos pequeños (Caribe) usan menos
        // margen para evitar solapamiento visual con países vecinos.
        const HULL_BUFFER_MIN = 0.15;  // ~17 km mínimo
        const HULL_BUFFER_MAX = 0.8;   // ~89 km máximo
        const HULL_BUFFER_FRAC = 0.15; // 15% de la extensión del hull
        for (const [cca2, coords] of coordsByCca2) {
          if (coords.length < 3) continue;
          // Normalizar coordenadas para países que cruzan el antimeridiano (ej. Fiji)
          const normalized = normalizeForAntimeridian(coords);
          const rawHull = computeConvexHull(normalized.coords);
          // Centroide del hull crudo
          let cx = 0, cy = 0;
          for (const [x, y] of rawHull) { cx += x; cy += y; }
          cx /= rawHull.length; cy /= rawHull.length;
          // Extensión angular cruda: distancia máxima centroide → vértice (sin buffer)
          let rawExtent = 0;
          for (const [x, y] of rawHull) {
            const dx = x - cx, dy = y - cy;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > rawExtent) rawExtent = d;
          }
          // Buffer proporcional al tamaño, acotado
          const bufferDeg = Math.max(HULL_BUFFER_MIN, Math.min(HULL_BUFFER_MAX, rawExtent * HULL_BUFFER_FRAC));
          const buffered = rawHull.map(([x, y]) => {
            const dx = x - cx, dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.001) return [x, y] as [number, number];
            const scale = bufferDeg / dist;
            return [x + dx * scale, y + dy * scale] as [number, number];
          });
          // Asegurar winding order correcto para proyección esférica (left-hand rule de D3).
          // Si geoArea > 2π, el polígono cubre más de media esfera → invertir vértices.
          const testRing = buffered.map(([x, y]) =>
            [normalized.shifted && x > 180 ? x - 360 : x, y] as [number, number],
          );
          testRing.push(testRing[0]);
          if (geoArea({ type: 'Polygon', coordinates: [testRing] }) > 2 * Math.PI) {
            buffered.reverse();
          }
          // Extensión angular del hull buffered para zoom adaptativo
          let maxDistDeg = 0;
          for (const [bx, by] of buffered) {
            const dx = bx - cx, dy = by - cy;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > maxDistDeg) maxDistDeg = d;
          }
          // Zoom adaptativo: hulls grandes visibles antes, pequeños después
          // K / extensión, clamped a [1.5, MARKER_ZOOM_FULL]
          const HULL_ZOOM_K = 10;
          const hullMinZoom = Math.max(1.5, Math.min(MARKER_ZOOM_FULL, HULL_ZOOM_K / Math.max(maxDistDeg, 0.1)));
          hullsByCca2.set(cca2, {
            hull: buffered,
            shifted: normalized.shifted,
            minZoom: hullMinZoom,
          });
        }
        archipelagoHullsRef.current = hullsByCca2;

        // Centros de hull para centrar flyTo en archipiélagos
        const hullCentroids = new Map<string, [number, number]>();
        for (const [cca2, hullData] of hullsByCca2) {
          let hcx = 0, hcy = 0;
          for (const [x, y] of hullData.hull) { hcx += x; hcy += y; }
          hcx /= hullData.hull.length; hcy /= hullData.hull.length;
          // Deshacer shift de antimeridiano
          if (hullData.shifted && hcx > 180) hcx -= 360;
          hullCentroids.set(cca2, [hcx, hcy]);
        }
        hullCentroidsRef.current = hullCentroids;

        // Para archipiélagos: actualizar extensión angular con el hull buffered
        // para que el zoom muestre el outline completo, no solo las islas
        for (const [cca2, hullData] of hullsByCca2) {
          const centroid = allCentroids.get(cca2);
          if (!centroid) continue;
          let maxDist = extents.get(cca2) ?? 0;
          for (const [x, y] of hullData.hull) {
            // Deshacer shift de antimeridiano para distancia correcta
            const lon = hullData.shifted && x > 180 ? x - 360 : x;
            const d = geoDistance([lon, y] as [number, number], centroid);
            if (d > maxDist) maxDist = d;
          }
          extents.set(cca2, maxDist);
        }
        geoExtentsRef.current = extents;

        // Guardar áreas para re-ordenamiento posterior cuando lleguen datos de población
        geoAreasRef.current = areas;

        // Features ordenados por población descendente (fallback a geoArea).
        // Población se carga async; al inicio puede no estar disponible, se re-ordena en useEffect.
        const pops = countryPopulationsRef.current;
        const seenCca2 = new Set<string>();
        sortedFeaturesRef.current = [...countries.features]
          .sort((a, b) => {
            const cca2A = a.properties?.cca2 ?? '';
            const cca2B = b.properties?.cca2 ?? '';
            const popA = pops?.get(cca2A) ?? 0;
            const popB = pops?.get(cca2B) ?? 0;
            if (popA || popB) return popB - popA;
            return (areas.get(cca2B) ?? 0) - (areas.get(cca2A) ?? 0);
          })
          .filter(f => {
            const cca2 = f.properties?.cca2;
            if (!cca2 || seenCca2.has(cca2)) return false;
            seenCca2.add(cca2);
            return true;
          }) as CountryFeature[];

        // Construir set de códigos no-ONU para diferenciar etiquetas de capitales
        const nonUn = new Set<string>();
        for (const feature of countries.features) {
          const cca2 = feature.properties?.cca2;
          if (cca2 && !feature.properties.isUNMember) nonUn.add(cca2);
        }
        nonUnCodesRef.current = nonUn;

        countryCentroidsRef.current = allCentroids;
        microstateCentroidsRef.current = microCentroids;
        microstateAngularRadiiRef.current = microstateAngularRadii;
        nonUnMicroCentroidsRef.current = nonUnMicroCentroids;
        labelMinZoomRef.current = minZoomMap;
        capitalMinZoomRef.current = capitalMinZoomMap;

        resize();
        lastTimeRef.current = performance.now();
        animFrameRef.current = requestAnimationFrame(animate);
        onReady?.();
      },
    );

    return () => {
      cancelled = true;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [animate, resize, onReady]);

  // Carga de etiquetas de mares y océanos
  useEffect(() => {
    if (seaLabelsLoadedRef.current) return;
    fetch(`${import.meta.env.BASE_URL}data/sea-labels.json`)
      .then(r => r.json())
      .then((data: SeaLabel[]) => {
        seaLabelsRef.current = data;
        seaLabelsLoadedRef.current = true;
        needsRedrawRef.current = true;
        wakeLoop();
      })
      .catch(() => { /* silencioso: sin etiquetas de mar si falla */ });
  }, []);

  // Re-ordenar features por población cuando los datos llegan (carga async)
  useEffect(() => {
    if (!countryPopulations || sortedFeaturesRef.current.length === 0) return;
    const areas = geoAreasRef.current;
    sortedFeaturesRef.current = [...sortedFeaturesRef.current].sort((a, b) => {
      const cca2A = a.properties?.cca2 ?? '';
      const cca2B = b.properties?.cca2 ?? '';
      const popA = countryPopulations.get(cca2A) ?? 0;
      const popB = countryPopulations.get(cca2B) ?? 0;
      if (popA || popB) return popB - popA;
      return (areas.get(cca2B) ?? 0) - (areas.get(cca2A) ?? 0);
    });
  }, [countryPopulations]);

  // Responsive
  useEffect(() => {
    const observer = new ResizeObserver(() => resize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [resize]);

  // Pausar RAF al ir a background, reanudar al volver (solo en nativo)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        wakeLoop();
      } else {
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        isLoopSleepingRef.current = true;
      }
    });

    return () => { listener.then(l => l.remove()); };
  }, []);

  // --- Zoom: wheel + pinch (listeners nativos) ---

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touchDist = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      isAutoRotatingRef.current = false;
      flyToAnimRef.current = null;
      const factor = 1 - e.deltaY * ZOOM_WHEEL_FACTOR;
      scaleRef.current = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleRef.current * factor));
      needsRedrawRef.current = true;
      wakeLoop();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isAutoRotatingRef.current = false;
        flyToAnimRef.current = null;
        gestureWasPinchRef.current = true;
        const dist = touchDist(e.touches[0], e.touches[1]);
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        pinchRef.current = {
          startDist: dist,
          startScale: scaleRef.current,
          prevMidX: midX,
          prevMidY: midY,
        };
        isDraggingRef.current = false;
        dragStartRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();

        const dist = touchDist(e.touches[0], e.touches[1]);
        const ratio = dist / pinchRef.current.startDist;
        scaleRef.current = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, pinchRef.current.startScale * ratio),
        );

        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const dx = midX - pinchRef.current.prevMidX;
        const dy = midY - pinchRef.current.prevMidY;
        const sensitivity = DRAG_SENSITIVITY / scaleRef.current;
        rotationRef.current = [
          rotationRef.current[0] + dx * sensitivity,
          Math.max(-80, Math.min(80, rotationRef.current[1] - dy * sensitivity)),
        ];
        pinchRef.current.prevMidX = midX;
        pinchRef.current.prevMidY = midY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchRef.current = null;
      if (e.touches.length === 0) gestureWasPinchRef.current = false;
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // --- Eventos de interacción ---

  const getCanvasPos = useCallback((e: React.PointerEvent): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (pinchRef.current) return;

    isInertiaRef.current = false;
    velocityRef.current = [0, 0];
    flyToAnimRef.current = null;

    isDraggingRef.current = true;
    isAutoRotatingRef.current = false;
    dragSamplesRef.current = [];
    const [x, y] = getCanvasPos(e);
    dragStartRef.current = {
      x,
      y,
      rotation: [...rotationRef.current] as [number, number],
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    wakeLoop();
  }, [getCanvasPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const [x, y] = getCanvasPos(e);

    if (isDraggingRef.current && dragStartRef.current && !pinchRef.current) {
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;
      const sensitivity = DRAG_SENSITIVITY / scaleRef.current;
      rotationRef.current = [
        dragStartRef.current.rotation[0] + dx * sensitivity,
        Math.max(-80, Math.min(80, dragStartRef.current.rotation[1] - dy * sensitivity)),
      ];
      const samples = dragSamplesRef.current;
      samples.push({ x, y, time: performance.now() });
      if (samples.length > VELOCITY_SAMPLES) samples.shift();
    } else if (!gestureWasPinchRef.current) {
      // Hover: detectar país (suprimido durante pinch)
      const feature = hitTest(x, y);
      const cca2 = feature?.properties?.cca2 ?? null;
      if (cca2 !== hoveredRef.current) {
        hoveredRef.current = cca2;
        needsRedrawRef.current = true;
        wakeLoop();
        const canvas = canvasRef.current;
        if (canvas) canvas.style.cursor = cca2 ? 'pointer' : 'grab';
      }
    }
  }, [getCanvasPos, hitTest]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const wasDragging = isDraggingRef.current;
    isDraggingRef.current = false;

    if (gestureWasPinchRef.current) return;
    if (!wasDragging || !dragStartRef.current) return;

    const [x, y] = getCanvasPos(e);
    const dx = Math.abs(x - dragStartRef.current.x);
    const dy = Math.abs(y - dragStartRef.current.y);

    if (dx < 5 && dy < 5) {
      // Click (no drag)
      const feature = hitTest(x, y);

      if (feature) {
        if (!isControlledRef.current) {
          selectedRef.current = feature.properties?.cca2 ?? null;
          needsRedrawRef.current = true;
          wakeLoop();
        }
        onCountryClick?.(feature as CountryFeature);
      } else {
        // Click en océano → deseleccionar
        if (!isControlledRef.current) {
          selectedRef.current = null;
          needsRedrawRef.current = true;
          wakeLoop();
        }
        onDeselectRef.current?.();
      }
    } else {
      // Drag real → calcular velocidad para inercia
      const samples = dragSamplesRef.current;
      const now = performance.now();
      const last = samples[samples.length - 1];
      if (samples.length >= 2 && last && (now - last.time) < 80) {
        const first = samples[0];
        const dt = (last.time - first.time) / 1000;
        if (dt > 0.01) {
          const sensitivity = DRAG_SENSITIVITY / scaleRef.current;
          const vx = ((last.x - first.x) * sensitivity) / dt;
          const vy = (-(last.y - first.y) * sensitivity) / dt;
          if (Math.hypot(vx, vy) > INERTIA_MIN_VELOCITY) {
            velocityRef.current = [vx, vy];
            isInertiaRef.current = true;
          }
        }
      }
    }

    dragStartRef.current = null;
    dragSamplesRef.current = [];
  }, [getCanvasPos, hitTest, onCountryClick]);

  return (
    <div
      ref={containerRef}
      className="globe-container"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
});

export default GlobeD3;
