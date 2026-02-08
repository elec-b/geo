// Spike Opción C: Globo con D3.js proyección ortográfica sobre Canvas 2D.
// Sin tiles, sin WebGL — renderiza GeoJSON directamente sobre una esfera 2D.
// Elimina por completo los artefactos de tile boundaries.
import { useRef, useEffect, useCallback, useState } from 'react';
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

// Velocidad de rotación automática (°/s, misma que Globe.tsx)
const ROTATION_SPEED = 6;

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
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  // Estado de rotación y drag
  const rotationRef = useRef<[number, number]>([-10, -20]); // [lambda, phi]
  const isAutoRotatingRef = useRef(true);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; rotation: [number, number] } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(performance.now());

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

    // Configurar proyección
    const projection = geoOrthographic()
      .scale(radius)
      .translate([cx, cy])
      .clipAngle(90)
      .rotate(rotationRef.current);

    projectionRef.current = projection;

    const path: GeoPath = geoPath().projection(projection).context(ctx);

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Atmósfera (halo exterior)
    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.15);
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
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }, []);

  /**
   * Loop de animación: rotación automática + redibujado.
   */
  const animate = useCallback(() => {
    const now = performance.now();
    const delta = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    if (isAutoRotatingRef.current && !isDraggingRef.current) {
      const [lambda, phi] = rotationRef.current;
      rotationRef.current = [lambda - ROTATION_SPEED * delta, phi];
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

  // --- Eventos de interacción ---

  // Coordenadas del pointer relativas al canvas
  const getCanvasPos = useCallback((e: React.PointerEvent): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    isAutoRotatingRef.current = false;
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

    if (isDraggingRef.current && dragStartRef.current) {
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;
      rotationRef.current = [
        dragStartRef.current.rotation[0] + dx * DRAG_SENSITIVITY,
        Math.max(-80, Math.min(80, dragStartRef.current.rotation[1] - dy * DRAG_SENSITIVITY)),
      ];
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
        setSelectedName(name);

        if (onCountryClick) {
          onCountryClick(feature as CountryFeature);
        }
      } else {
        // Click en océano — deseleccionar
        selectedRef.current = null;
        setSelectedName(null);
      }
    }

    dragStartRef.current = null;
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
