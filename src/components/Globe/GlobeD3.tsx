// Globo con D3.js proyección ortográfica sobre Canvas 2D.
// Sin tiles, sin WebGL — renderiza GeoJSON directamente sobre una esfera 2D.
// Elimina por completo los artefactos de tile boundaries.
import { useRef, useEffect, useCallback } from 'react';
import { geoOrthographic, geoPath, geoContains } from 'd3-geo';
import type { GeoProjection, GeoPath } from 'd3-geo';
import type { FeatureCollection, Feature, Geometry, MultiLineString } from 'geojson';
import { loadCountriesGeoJson, loadBordersGeoJson } from '../../data/countries';
import type { CountryFeature, CountryProperties } from '../../data/countries';

// Colores del tema espacial (mismos que Globe.tsx)
const OCEAN_COLOR = '#0a0a1a';
const COUNTRY_FILL_COLOR = '#3a3a4a';
const COUNTRY_SELECTED_COLOR = '#8a7d5a';
const COUNTRY_HOVER_COLOR = '#2a2a3a';
const BORDER_COLOR = 'rgba(255, 255, 255, 0.2)';
const ATMOSPHERE_COLOR = 'rgba(100, 150, 255, 0.08)';

// Velocidad de rotación automática (°/s)
const ROTATION_SPEED = 6;

// Zoom
const MIN_SCALE = 0.8;
const MAX_SCALE = 200.0;
const ZOOM_WHEEL_FACTOR = 0.001;

// Inercia
const INERTIA_FRICTION = 0.85;
const INERTIA_MIN_VELOCITY = 0.5; // °/s
const VELOCITY_SAMPLES = 5;

interface GlobeD3Props {
  onCountryClick?: (country: CountryFeature) => void;
  onReady?: () => void;
}

export function GlobeD3({ onCountryClick, onReady }: GlobeD3Props) {
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
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);

  // Inercia
  const velocityRef = useRef<[number, number]>([0, 0]); // [vx, vy] en °/s
  const isInertiaRef = useRef(false);
  const dragSamplesRef = useRef<Array<{ x: number; y: number; time: number }>>([]);

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
      ctx.lineWidth = Math.max(0.3, 0.5 / Math.sqrt(scaleRef.current));
      ctx.stroke();
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

    // Convertir coordenadas de pantalla a coordenadas geográficas
    const coords = projection.invert?.([x, y]);
    if (!coords) return null;

    // Buscar el país que contiene esas coordenadas
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
        const dist = touchDist(e.touches[0], e.touches[1]);
        pinchRef.current = { startDist: dist, startScale: scaleRef.current };
        // Cancelar drag si estaba activo
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
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchRef.current = null;
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
    } else {
      // Hover: detectar país
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
