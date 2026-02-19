// Globo con D3.js proyección ortográfica sobre Canvas 2D.
// Sin tiles, sin WebGL — renderiza GeoJSON directamente sobre una esfera 2D.
// Elimina por completo los artefactos de tile boundaries.
import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { geoOrthographic, geoPath, geoContains, geoCentroid, geoDistance, geoArea } from 'd3-geo';
import type { GeoProjection, GeoPath } from 'd3-geo';
import type { FeatureCollection, Feature, Geometry, MultiLineString } from 'geojson';
import { loadCountriesGeoJson, loadBordersGeoJson } from '../../data/countries';
import type { CountryFeature, CountryProperties } from '../../data/countries';
import type { CapitalCoords } from '../../data/types';

// --- Constantes del tema espacial ---

const OCEAN_COLOR = '#0a0a1a';
const COUNTRY_FILL_COLOR = '#3a3a4a';
const COUNTRY_SELECTED_COLOR = '#8a7d5a';
const COUNTRY_HOVER_COLOR = '#2a2a3a';
const BORDER_COLOR = 'rgba(255, 255, 255, 0.3)';
const ATMOSPHERE_COLOR = 'rgba(100, 150, 255, 0.08)';

// Rotación automática (°/s)
const ROTATION_SPEED = 6;

// Zoom
const MIN_SCALE = 0.8;
const MAX_SCALE = 200.0;
const ZOOM_WHEEL_FACTOR = 0.001;

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

const MICROSTATE_CODES = new Set([
  'VA', 'MC', 'SM', 'LI', 'AD', 'MT', 'SG', 'BH', 'LU', 'KM',
  'MU', 'ST', 'CV', 'SC', 'MV', 'BN', 'TT', 'AG', 'BB', 'LC',
  'GD', 'VC', 'DM', 'KN', 'PW', 'MH', 'FM', 'NR', 'KI', 'TO',
  'WS',
]);

// Inercia
const INERTIA_FRICTION = 0.85;
const INERTIA_MIN_VELOCITY = 0.5;
const VELOCITY_SAMPLES = 5;

// Pin de capital
const CAPITAL_PIN_INNER = 4;
const CAPITAL_PIN_OUTER = 7;
const CAPITAL_PIN_COLOR = '#00f0ff';

// Etiquetas
const LABEL_COLOR = 'rgba(255, 255, 255, 0.8)';
const LABEL_CAPITAL_COLOR = 'rgba(0, 240, 255, 0.7)';
const LABEL_SHADOW = 'rgba(0, 0, 0, 0.7)';
const LABEL_FONT_BASE = 9;

// Opacidad de países fuera del filtro de continente
const DIMMED_ALPHA = 0.15;

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
};

// --- Interfaces ---

export interface GlobeD3Props {
  onCountryClick?: (country: CountryFeature) => void;
  onCountryDeselect?: () => void;
  onReady?: () => void;
  showMarkers?: boolean;
  /** País seleccionado (controlado). undefined = modo interno. */
  selectedCountryCca2?: string | null;
  /** Coordenadas [lon, lat] para mostrar pin de capital */
  capitalPin?: [number, number] | null;
  /** Set de cca2 a resaltar (filtro continente). null = todos visibles. */
  highlightedCountries?: Set<string> | null;
  showCountryLabels?: boolean;
  showCapitalLabels?: boolean;
  /** Datos de capitales para etiquetas (Map<cca2, CapitalCoords>) */
  capitalLabelsData?: Map<string, CapitalCoords> | null;
}

export interface GlobeD3Ref {
  flyTo(lon: number, lat: number, zoom?: number, duration?: number): void;
}

// --- Utilidades ---

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// --- Componente ---

export const GlobeD3 = forwardRef<GlobeD3Ref, GlobeD3Props>(function GlobeD3(
  {
    onCountryClick,
    onCountryDeselect,
    onReady,
    showMarkers = true,
    selectedCountryCca2,
    capitalPin,
    highlightedCountries,
    showCountryLabels = false,
    showCapitalLabels = false,
    capitalLabelsData,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Datos cargados
  const countriesRef = useRef<FeatureCollection<Geometry, CountryProperties> | null>(null);
  const bordersRef = useRef<Feature<MultiLineString> | null>(null);

  // Interacción (estado interno para modo no controlado)
  const selectedRef = useRef<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  // Rotación y drag
  const rotationRef = useRef<[number, number]>([-10, -20]);
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

  // Marcadores, centroides, zoom mínimo y features ordenados para etiquetas
  const microstateCentroidsRef = useRef<Map<string, [number, number]>>(new Map());
  const countryCentroidsRef = useRef<Map<string, [number, number]>>(new Map());
  const labelMinZoomRef = useRef<Map<string, number>>(new Map());
  const sortedFeaturesRef = useRef<CountryFeature[]>([]);
  const showMarkersRef = useRef(showMarkers);
  showMarkersRef.current = showMarkers;

  // Proyección y tamaño
  const projectionRef = useRef<GeoProjection | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const DRAG_SENSITIVITY = 0.35;

  // Refs sincronizados con props (acceso en callbacks sin re-creación)
  const selectedCca2PropRef = useRef(selectedCountryCca2);
  selectedCca2PropRef.current = selectedCountryCca2;
  const isControlledRef = useRef(selectedCountryCca2 !== undefined);
  isControlledRef.current = selectedCountryCca2 !== undefined;
  const capitalPinRef = useRef(capitalPin);
  capitalPinRef.current = capitalPin;
  const highlightedRef = useRef(highlightedCountries);
  highlightedRef.current = highlightedCountries;
  const showCountryLabelsRef = useRef(showCountryLabels);
  showCountryLabelsRef.current = showCountryLabels;
  const showCapitalLabelsRef = useRef(showCapitalLabels);
  showCapitalLabelsRef.current = showCapitalLabels;
  const capitalLabelsRef = useRef(capitalLabelsData);
  capitalLabelsRef.current = capitalLabelsData;
  const onDeselectRef = useRef(onCountryDeselect);
  onDeselectRef.current = onCountryDeselect;

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
    flyTo(lon: number, lat: number, zoom?: number, duration = 800) {
      isAutoRotatingRef.current = false;
      isInertiaRef.current = false;
      velocityRef.current = [0, 0];
      isDraggingRef.current = false;
      dragStartRef.current = null;

      flyToAnimRef.current = {
        startRotation: [...rotationRef.current] as [number, number],
        endRotation: [-lon, -lat],
        startScale: scaleRef.current,
        endScale: zoom ?? scaleRef.current,
        startTime: performance.now(),
        duration,
      };
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
    gradient.addColorStop(0, ATMOSPHERE_COLOR);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Océano
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = OCEAN_COLOR;
    ctx.fill();

    // País seleccionado efectivo (controlado vs interno)
    const effectiveSelected = isControlledRef.current
      ? selectedCca2PropRef.current
      : selectedRef.current;
    const filter = highlightedRef.current;

    // Países (relleno)
    for (const feature of countries.features) {
      const cca2 = feature.properties?.cca2;
      let fillColor = COUNTRY_FILL_COLOR;

      if (cca2 && cca2 === effectiveSelected) {
        fillColor = COUNTRY_SELECTED_COLOR;
      } else if (cca2 && cca2 === hoveredRef.current) {
        fillColor = COUNTRY_HOVER_COLOR;
      }

      // Dimming por filtro de continente
      const isDimmed = filter != null && (cca2 == null || !filter.has(cca2));
      if (isDimmed) ctx.globalAlpha = DIMMED_ALPHA;

      ctx.beginPath();
      path(feature);
      ctx.fillStyle = fillColor;
      ctx.fill();

      if (isDimmed) ctx.globalAlpha = 1;
    }

    // Bordes
    if (borders) {
      ctx.beginPath();
      path(borders);
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = Math.max(0.5, 1.0 / Math.sqrt(zoom));
      ctx.stroke();
    }

    // Marcadores de microestados (anillos con fade-in según zoom)
    if (showMarkersRef.current && zoom >= MARKER_ZOOM_START && microstateCentroidsRef.current.size > 0) {
      const t = Math.min(1, (zoom - MARKER_ZOOM_START) / (MARKER_ZOOM_FULL - MARKER_ZOOM_START));
      const opacity = t * MARKER_MAX_OPACITY;
      const rotation = rotationRef.current;
      const viewCenter: [number, number] = [-rotation[0], -rotation[1]];
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.lineWidth = MARKER_LINE_WIDTH;
      ctx.setLineDash(MARKER_DASH);
      for (const [, centroid] of microstateCentroidsRef.current) {
        if (geoDistance(centroid, viewCenter) > Math.PI / 2) continue;
        const pos = projection(centroid);
        if (!pos) continue;
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
        ctx.fillStyle = CAPITAL_PIN_COLOR;
        ctx.globalAlpha = 0.6;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Pin de capital seleccionada (circulito relleno + anillo exterior)
    const pinCoords = capitalPinRef.current;
    if (pinCoords) {
      const rotation = rotationRef.current;
      const viewCenter: [number, number] = [-rotation[0], -rotation[1]];
      if (geoDistance(pinCoords, viewCenter) < Math.PI / 2) {
        const pos = projection(pinCoords);
        if (pos) {
          ctx.beginPath();
          ctx.arc(pos[0], pos[1], CAPITAL_PIN_OUTER, 0, Math.PI * 2);
          ctx.strokeStyle = CAPITAL_PIN_COLOR;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(pos[0], pos[1], CAPITAL_PIN_INNER, 0, Math.PI * 2);
          ctx.fillStyle = CAPITAL_PIN_COLOR;
          ctx.fill();
        }
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
        ctx.shadowColor = LABEL_SHADOW;
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

          // Estimación de bounding box (evita measureText por frame)
          const textW = fontSize * feature.properties.name.length * 0.55;
          const rect: [number, number, number, number] = [
            pos[0] - textW / 2, pos[1] + yOffset - fontSize / 2, textW, fontSize,
          ];
          if (collidesExcluding(rect)) continue;
          countryRectIndex.set(cca2, usedRects.length);
          usedRects.push(rect);

          ctx.fillStyle = LABEL_COLOR;
          ctx.fillText(feature.properties.name, pos[0], pos[1] + yOffset);
        }
        ctx.shadowBlur = 0;
      }

      // --- Etiquetas de capitales ---
      if (showCapitalLbls && capitalLabelsRef.current) {
        const fontSize = Math.round(LABEL_FONT_BASE - 1 + Math.sqrt(zoom) * 2);
        ctx.font = `${fontSize}px -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = LABEL_SHADOW;
        ctx.shadowBlur = 3;

        for (const [cca2, capital] of capitalLabelsRef.current) {
          if (filter && !filter.has(cca2)) continue;

          // Capitales también respetan zoom mínimo del país al que pertenecen
          const minZoom = labelMinZoomRef.current.get(cca2);
          if (minZoom !== undefined && zoom < minZoom) continue;

          const coords: [number, number] = [capital.latlng[1], capital.latlng[0]];
          if (geoDistance(coords, viewCenter) > Math.PI / 2) continue;

          const pos = projection(coords);
          if (!pos) continue;

          let yPos = pos[1] + 6;
          const textW = fontSize * capital.name.length * 0.55;
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
          if (collidesExcluding(rect, parentIdx)) continue;
          usedRects.push(rect);

          ctx.fillStyle = LABEL_CAPITAL_COLOR;
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
      scaleRef.current = flyTo.startScale + (flyTo.endScale - flyTo.startScale) * ease;

      if (t >= 1) flyToAnimRef.current = null;
    } else if (isInertiaRef.current) {
      const [vx, vy] = velocityRef.current;
      const [lambda, phi] = rotationRef.current;
      rotationRef.current = [
        lambda + vx * delta,
        Math.max(-80, Math.min(80, phi + vy * delta)),
      ];
      velocityRef.current = [vx * INERTIA_FRICTION, vy * INERTIA_FRICTION];
      if (Math.hypot(velocityRef.current[0], velocityRef.current[1]) < INERTIA_MIN_VELOCITY) {
        isInertiaRef.current = false;
        velocityRef.current = [0, 0];
      }
    } else if (isAutoRotatingRef.current && !isDraggingRef.current) {
      const [lambda, phi] = rotationRef.current;
      rotationRef.current = [lambda + ROTATION_SPEED * delta, phi];
    }

    draw();
    animFrameRef.current = requestAnimationFrame(animate);
  }, [draw]);

  // --- Hit test ---

  const hitTest = useCallback((x: number, y: number): Feature<Geometry, CountryProperties> | null => {
    const projection = projectionRef.current;
    const countries = countriesRef.current;
    if (!projection || !countries) return null;

    const zoom = scaleRef.current;
    const markersVisible = showMarkersRef.current && zoom >= MARKER_ZOOM_START
      && microstateCentroidsRef.current.size > 0;

    // Prioridad a marcadores de microestados (el usuario ve el anillo y toca sobre él)
    if (markersVisible) {
      const zoomT = Math.min(1, (zoom - MARKER_ZOOM_START) / (MARKER_HIT_ZOOM_MAX - MARKER_ZOOM_START));
      const hitRadius = MARKER_HIT_RADIUS_MIN + zoomT * (MARKER_HIT_RADIUS_MAX - MARKER_HIT_RADIUS_MIN);
      for (const [cca2, centroid] of microstateCentroidsRef.current) {
        const pos = projection(centroid);
        if (!pos) continue;
        if (Math.hypot(x - pos[0], y - pos[1]) < hitRadius) {
          const feature = countries.features.find(f => f.properties?.cca2 === cca2);
          if (feature) return feature as Feature<Geometry, CountryProperties>;
        }
      }
    }

    // Búsqueda normal por geometría
    const coords = projection.invert?.([x, y]);
    if (!coords) return null;

    for (const feature of countries.features) {
      if (geoContains(feature, coords)) {
        return feature as Feature<Geometry, CountryProperties>;
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
    const dpr = window.devicePixelRatio || 1;

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

        // Pre-calcular centroides (con overrides visuales) y zoom mínimo por importancia
        const allCentroids = new Map<string, [number, number]>();
        const microCentroids = new Map<string, [number, number]>();
        const areas = new Map<string, number>();

        for (const feature of countries.features) {
          const cca2 = feature.properties?.cca2;
          if (cca2) {
            const area = geoArea(feature);
            // Si ya existe un feature con más área para este cca2, ignorar el duplicado
            if (areas.has(cca2) && area <= areas.get(cca2)!) continue;

            const centroid = CENTROID_OVERRIDES[cca2] ?? (geoCentroid(feature) as [number, number]);
            allCentroids.set(cca2, centroid);
            if (MICROSTATE_CODES.has(cca2)) {
              microCentroids.set(cca2, centroid);
            }
            areas.set(cca2, area);
          }
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

        // Features ordenados por área descendente (países grandes primero para prioridad de etiquetas)
        // Filtrar duplicados de cca2 para evitar iteraciones desperdiciadas
        const seenCca2 = new Set<string>();
        sortedFeaturesRef.current = [...countries.features]
          .sort((a, b) => (areas.get(b.properties?.cca2 ?? '') ?? 0) - (areas.get(a.properties?.cca2 ?? '') ?? 0))
          .filter(f => {
            const cca2 = f.properties?.cca2;
            if (!cca2 || seenCca2.has(cca2)) return false;
            seenCca2.add(cca2);
            return true;
          }) as CountryFeature[];

        countryCentroidsRef.current = allCentroids;
        microstateCentroidsRef.current = microCentroids;
        labelMinZoomRef.current = minZoomMap;

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

  // Responsive
  useEffect(() => {
    const observer = new ResizeObserver(() => resize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [resize]);

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
        }
        onCountryClick?.(feature as CountryFeature);
      } else {
        // Click en océano → deseleccionar
        if (!isControlledRef.current) {
          selectedRef.current = null;
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
