// Globo con D3.js proyección ortográfica sobre Canvas 2D.
// Sin tiles, sin WebGL — renderiza GeoJSON directamente sobre una esfera 2D.
// Elimina por completo los artefactos de tile boundaries.
import { useRef, useEffect, useCallback } from 'react';
import { geoOrthographic, geoPath, geoContains, geoCentroid, geoDistance } from 'd3-geo';
import type { GeoProjection, GeoPath } from 'd3-geo';
import type { FeatureCollection, Feature, Geometry, MultiLineString } from 'geojson';
import { loadCountriesGeoJson, loadBordersGeoJson } from '../../data/countries';
import type { CountryFeature, CountryProperties } from '../../data/countries';

// Colores del tema espacial (mismos que Globe.tsx)
const OCEAN_COLOR = '#0a0a1a';
const COUNTRY_FILL_COLOR = '#3a3a4a';
const COUNTRY_SELECTED_COLOR = '#8a7d5a';
const COUNTRY_HOVER_COLOR = '#2a2a3a';
const BORDER_COLOR = 'rgba(255, 255, 255, 0.3)';
const ATMOSPHERE_COLOR = 'rgba(100, 150, 255, 0.08)';

// Velocidad de rotación automática (°/s)
const ROTATION_SPEED = 6;

// Zoom
const MIN_SCALE = 0.8;
const MAX_SCALE = 200.0;
const ZOOM_WHEEL_FACTOR = 0.001;

// Marcadores de microestados
const MARKER_RADIUS = 8;        // px en pantalla (radio visual del anillo)
const MARKER_LINE_WIDTH = 1.0;
const MARKER_MAX_OPACITY = 0.5;
const MARKER_DASH = [3, 3];
const MARKER_ZOOM_START = 3;    // zoom a partir del cual empiezan a aparecer
const MARKER_ZOOM_FULL = 5;     // zoom a partir del cual tienen opacidad completa
const MARKER_HIT_RADIUS_MIN = 20;  // zona táctil a zoom bajo
const MARKER_HIT_RADIUS_MAX = 30;  // zona táctil a zoom alto
const MARKER_HIT_ZOOM_MAX = 20;    // zoom a partir del cual el radio táctil es máximo

// Nombres exactos de Natural Earth 50m para países difíciles de seleccionar
const MICROSTATES: string[] = [
  'Vatican',
  'Monaco',
  'San Marino',
  'Liechtenstein',
  'Andorra',
  'Malta',
  'Singapore',
  'Bahrain',
  'Luxembourg',
  'Comoros',
  'Mauritius',
  'São Tomé and Principe',
  'Cabo Verde',
  'Seychelles',
  'Maldives',
  'Brunei',
  'Trinidad and Tobago',
  'Antigua and Barb.',
  'Barbados',
  'Saint Lucia',
  'Grenada',
  'St. Vin. and Gren.',
  'Dominica',
  'St. Kitts and Nevis',
  'Palau',
  'Marshall Is.',
  'Micronesia',
  'Nauru',
  'Kiribati',
  'Tonga',
  'Samoa',
];

// Inercia
const INERTIA_FRICTION = 0.85;
const INERTIA_MIN_VELOCITY = 0.5; // °/s
const VELOCITY_SAMPLES = 5;

interface GlobeD3Props {
  onCountryClick?: (country: CountryFeature) => void;
  onReady?: () => void;
  showMarkers?: boolean;
}

export function GlobeD3({ onCountryClick, onReady, showMarkers = true }: GlobeD3Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado de datos cargados
  const countriesRef = useRef<FeatureCollection<Geometry, CountryProperties> | null>(null);
  const bordersRef = useRef<Feature<MultiLineString> | null>(null);

  // Estado de interacción
  const selectedRef = useRef<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  // Estado de rotación y drag
  const rotationRef = useRef<[number, number]>([-10, -20]); // [lambda, phi]
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

  // Flag para suprimir selección/hover accidental durante y después de un pinch
  const gestureWasPinchRef = useRef(false);

  // Inercia
  const velocityRef = useRef<[number, number]>([0, 0]); // [vx, vy] en °/s
  const isInertiaRef = useRef(false);
  const dragSamplesRef = useRef<Array<{ x: number; y: number; time: number }>>([]);

  // Marcadores de microestados
  const microstateCentroidsRef = useRef<Map<string, [number, number]>>(new Map());
  const showMarkersRef = useRef(showMarkers);
  showMarkersRef.current = showMarkers;

  // Proyección y path (se recrean en cada redibujado)
  const projectionRef = useRef<GeoProjection | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  // Sensibilidad del drag (grados por pixel)
  const DRAG_SENSITIVITY = 0.35;

  /**
   * Dibuja todo el globo en el canvas.
   */
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

    // Configurar proyección (radio escalado por zoom)
    const scaledRadius = radius * scaleRef.current;
    const projection = geoOrthographic()
      .scale(scaledRadius)
      .translate([cx, cy])
      .clipAngle(90)
      .rotate(rotationRef.current);

    projectionRef.current = projection;

    const path: GeoPath = geoPath().projection(projection).context(ctx);

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Atmósfera (halo exterior)
    const gradient = ctx.createRadialGradient(cx, cy, scaledRadius * 0.95, cx, cy, scaledRadius * 1.15);
    gradient.addColorStop(0, ATMOSPHERE_COLOR);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Océano (esfera de fondo)
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = OCEAN_COLOR;
    ctx.fill();

    // Países (relleno)
    for (const feature of countries.features) {
      const name = feature.properties?.name;
      let fillColor = COUNTRY_FILL_COLOR;

      if (name === selectedRef.current) {
        fillColor = COUNTRY_SELECTED_COLOR;
      } else if (name === hoveredRef.current) {
        fillColor = COUNTRY_HOVER_COLOR;
      }

      ctx.beginPath();
      path(feature);
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // Bordes
    if (borders) {
      ctx.beginPath();
      path(borders);
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = Math.max(0.5, 1.0 / Math.sqrt(scaleRef.current));
      ctx.stroke();
    }

    // Marcadores de microestados (anillos con fade-in según zoom)
    const zoom = scaleRef.current;
    if (showMarkersRef.current && zoom >= MARKER_ZOOM_START && microstateCentroidsRef.current.size > 0) {
      // Opacidad progresiva entre ZOOM_START y ZOOM_FULL
      const t = Math.min(1, (zoom - MARKER_ZOOM_START) / (MARKER_ZOOM_FULL - MARKER_ZOOM_START));
      const opacity = t * MARKER_MAX_OPACITY;
      const rotation = rotationRef.current;
      const viewCenter: [number, number] = [-rotation[0], -rotation[1]];
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.lineWidth = MARKER_LINE_WIDTH;
      ctx.setLineDash(MARKER_DASH);
      for (const [, centroid] of microstateCentroidsRef.current) {
        // Solo dibujar si está en el hemisferio visible
        if (geoDistance(centroid, viewCenter) > Math.PI / 2) continue;
        const pos = projection(centroid);
        if (!pos) continue;
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], MARKER_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }, []);

  /**
   * Loop de animación: rotación automática + inercia + redibujado.
   */
  const animate = useCallback(() => {
    const now = performance.now();
    const delta = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    if (isInertiaRef.current) {
      // Aplicar velocidad de inercia
      const [vx, vy] = velocityRef.current;
      const [lambda, phi] = rotationRef.current;
      rotationRef.current = [
        lambda + vx * delta,
        Math.max(-80, Math.min(80, phi + vy * delta)),
      ];
      // Aplicar fricción
      velocityRef.current = [vx * INERTIA_FRICTION, vy * INERTIA_FRICTION];
      // Detener cuando la velocidad es muy baja
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

  /**
   * Detecta qué país está bajo un punto [x, y] del canvas.
   */
  const hitTest = useCallback((x: number, y: number): Feature<Geometry, CountryProperties> | null => {
    const projection = projectionRef.current;
    const countries = countriesRef.current;
    if (!projection || !countries) return null;

    const zoom = scaleRef.current;
    const markersVisible = showMarkersRef.current && zoom >= MARKER_ZOOM_START
      && microstateCentroidsRef.current.size > 0;

    // 1. Si los marcadores son visibles, comprobar proximidad a marcadores PRIMERO
    //    (prioridad invertida: el usuario ve el anillo y toca sobre él)
    if (markersVisible) {
      // Radio táctil dinámico: crece con el zoom
      const zoomT = Math.min(1, (zoom - MARKER_ZOOM_START) / (MARKER_HIT_ZOOM_MAX - MARKER_ZOOM_START));
      const hitRadius = MARKER_HIT_RADIUS_MIN + zoomT * (MARKER_HIT_RADIUS_MAX - MARKER_HIT_RADIUS_MIN);
      for (const [name, centroid] of microstateCentroidsRef.current) {
        const pos = projection(centroid);
        if (!pos) continue;
        if (Math.hypot(x - pos[0], y - pos[1]) < hitRadius) {
          const feature = countries.features.find(f => f.properties?.name === name);
          if (feature) return feature as Feature<Geometry, CountryProperties>;
        }
      }
    }

    // 2. Búsqueda normal por geometría
    const coords = projection.invert?.([x, y]);
    if (!coords) return null;

    for (const feature of countries.features) {
      if (geoContains(feature, coords)) {
        return feature as Feature<Geometry, CountryProperties>;
      }
    }

    return null;
  }, []);

  /**
   * Ajusta el tamaño del canvas al contenedor (responsive + devicePixelRatio).
   */
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

  // Cargar datos y arrancar
  useEffect(() => {
    let cancelled = false;

    Promise.all([loadCountriesGeoJson(), loadBordersGeoJson()]).then(
      ([countries, borders]) => {
        if (cancelled) return;
        countriesRef.current = countries;
        bordersRef.current = borders;

        // Calcular centroides de microestados (una sola vez)
        const centroidsMap = new Map<string, [number, number]>();
        const microstateSet = new Set(MICROSTATES);
        for (const feature of countries.features) {
          const name = feature.properties?.name;
          if (name && microstateSet.has(name)) {
            centroidsMap.set(name, geoCentroid(feature) as [number, number]);
          }
        }
        microstateCentroidsRef.current = centroidsMap;

        resize();
        lastTimeRef.current = performance.now();
        animFrameRef.current = requestAnimationFrame(animate);
        onReady?.();
      }
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

  // --- Zoom: wheel + pinch (listeners nativos en el canvas) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Distancia entre dos puntos táctiles
    const touchDist = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      isAutoRotatingRef.current = false;
      const factor = 1 - e.deltaY * ZOOM_WHEEL_FACTOR;
      scaleRef.current = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleRef.current * factor));
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isAutoRotatingRef.current = false;
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
        // Cancelar drag si estaba activo
        isDraggingRef.current = false;
        dragStartRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();

        // Zoom (ratio de distancia entre dedos)
        const dist = touchDist(e.touches[0], e.touches[1]);
        const ratio = dist / pinchRef.current.startDist;
        scaleRef.current = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, pinchRef.current.startScale * ratio),
        );

        // Rotación simultánea (delta incremental del punto medio)
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
      if (e.touches.length < 2) {
        pinchRef.current = null;
      }
      // Resetear flag de pinch solo cuando todos los dedos se levantan
      if (e.touches.length === 0) {
        gestureWasPinchRef.current = false;
      }
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

  // Coordenadas del pointer relativas al canvas
  const getCanvasPos = useCallback((e: React.PointerEvent): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Si hay pinch activo, ignorar (el pinch tiene prioridad)
    if (pinchRef.current) return;

    // Cancelar inercia
    isInertiaRef.current = false;
    velocityRef.current = [0, 0];

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
      // Acumular muestras para cálculo de velocidad (inercia)
      const samples = dragSamplesRef.current;
      samples.push({ x, y, time: performance.now() });
      if (samples.length > VELOCITY_SAMPLES) samples.shift();
    } else if (!gestureWasPinchRef.current) {
      // Hover: detectar país (suprimido durante/después de pinch)
      const feature = hitTest(x, y);
      const name = feature?.properties?.name ?? null;
      if (name !== hoveredRef.current) {
        hoveredRef.current = name;
        const canvas = canvasRef.current;
        if (canvas) canvas.style.cursor = name ? 'pointer' : 'grab';
      }
    }
  }, [getCanvasPos, hitTest]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const wasDragging = isDraggingRef.current;
    isDraggingRef.current = false;

    // Suprimir tap/selección si el gesto incluyó un pinch
    if (gestureWasPinchRef.current) return;

    if (!wasDragging || !dragStartRef.current) return;

    const [x, y] = getCanvasPos(e);
    const dx = Math.abs(x - dragStartRef.current.x);
    const dy = Math.abs(y - dragStartRef.current.y);

    // Si el movimiento fue mínimo, es un click (no un drag)
    if (dx < 5 && dy < 5) {
      const feature = hitTest(x, y);

      if (feature) {
        const name = feature.properties?.name ?? null;
        console.log('País seleccionado (D3):', name);

        selectedRef.current = name;

        if (onCountryClick) {
          onCountryClick(feature as CountryFeature);
        }
      } else {
        // Click en océano — deseleccionar
        selectedRef.current = null;
      }
    } else {
      // Fue un drag real — calcular velocidad para inercia
      const samples = dragSamplesRef.current;
      const now = performance.now();
      const last = samples[samples.length - 1];
      // Solo aplicar inercia si el usuario estaba moviendo justo antes de soltar
      if (samples.length >= 2 && last && (now - last.time) < 80) {
        const first = samples[0];
        const dt = (last.time - first.time) / 1000; // segundos
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
}

export default GlobeD3;
