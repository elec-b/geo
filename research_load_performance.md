# Investigación: Rendimiento de Carga del Globo

## Estado Actual
- **Archivo de datos:** `public/data/countries-50m.json`
- **Formato:** TopoJSON
- **Tamaño:** 739KB (sin comprimir)
- **Tiempo de carga total:** ~30 segundos en dev mode
- **Librería:** react-globe.gl v2.37 (wrapper de three-globe → Three.js)

---

## Diagnóstico: ¿Por qué tarda ~30 segundos?

### Lo que NO es el problema
El parsing de datos (fetch + JSON.parse + topojson.feature) toma **~25ms**. Representa el **0.08%** del tiempo total. Cambiar de formato (GeoJSON, Geobuf) no habría mejorado nada perceptible.

### Lo que SÍ es el problema
react-globe.gl ejecuta un pipeline pesado para cada polígono:

1. **Descomposición MultiPolygon**: 241 países → **~500+ polígonos individuales** (Rusia ~80, Indonesia ~50, etc.)
2. **Para CADA polígono**, ejecuta `geoPolygonTriangulate()`:
   - Interpolación de contornos (subdivide arcos >5° en muchos puntos)
   - Generación de puntos interiores con **grilla esférica de Fibonacci**
   - Test `point-in-polygon` para filtrar puntos interiores
   - **Triangulación Delaunay** (o earcut, según el caso)
3. **Crea un `THREE.Mesh` + `THREE.LineSegments` por cada polígono** → ~500 draw calls
4. Todo esto ocurre **síncronamente en el hilo principal**

### Desglose estimado de los ~30 segundos

| Fase | Tiempo estimado | % |
|------|----------------|---|
| Bundle parse (4.1MB JS en dev mode) | 2-5s | ~15% |
| React lazy() + Suspense mount | 0.5-1s | ~3% |
| Fetch + parse datos (739KB) | ~0.3s | ~1% |
| **geoPolygonTriangulate() × 500** | **15-22s** | **~60%** |
| ConicPolygonGeometry + GeoJsonGeometry × 500 | 3-5s | ~15% |
| Compilación de shaders WebGL | 1-3s | ~5% |
| animateIn + setTimeout(500ms) | ~1.7s | ~5% |

**Nota importante** (del adversario de autopsia): parte de los 30s puede ser overhead de Vite dev mode. Nunca se midió en production build (`npm run build`). El tiempo real en producción podría ser significativamente menor.

### Resultado: ~1.25 millones de triángulos en ~500 meshes separados
- ~500 polígonos × ~2500 triángulos = ~1.25M triángulos
- ~500 objetos Three.js individuales = ~500 draw calls por frame
- Sin frustum culling: renderiza los 500 polígonos siempre, incluidos los que están detrás del globo

---

## ¿Es react-globe.gl la herramienta correcta?

### Veredicto: NO para polígonos complejos de países

react-globe.gl **no implementa ninguna** de las técnicas estándar de la industria para globos 3D:

| Técnica | Industria (Mapbox, CesiumJS, Google Earth) | react-globe.gl |
|---------|---------------------------------------------|----------------|
| Tile-based rendering | ✅ | ❌ Carga todo el GeoJSON |
| Level of Detail (LOD) | ✅ | ❌ Misma resolución siempre |
| Frustum culling | ✅ | ❌ Renderiza todo |
| Horizon culling | ✅ | ❌ Renderiza todo |
| Draw call batching/merging | ✅ | ❌ 1 mesh por polígono |
| GPU instancing | ✅ | ❌ No |
| Web Workers | ✅ | ❌ Todo en main thread |
| Streaming progresivo | ✅ | ❌ Todo o nada |

**Evidencia adicional:**
- La capa de polígonos NO tiene opción de merge (a diferencia de hexágonos y puntos, que SÍ la tienen)
- Solo **3 proyectos** en npm dependen de react-globe.gl
- Shopify construyó su famoso globo BFCM con Three.js + react-three-fiber, **NO** con react-globe.gl
- Los proyectos exitosos con react-globe.gl usan puntos y arcos (geometrías simples), no polígonos complejos
- La librería fue diseñada para **data visualization**, no para cartografía interactiva

### Google Earth no es referente válido
Google Earth usa un motor **nativo C++** que accede directamente a Metal (iOS) / Vulkan (Android). En web usa WebAssembly con multithreading. **No usa WebGL ni JavaScript.** La comparación es como comparar un coche con un avión.

### WKWebView tiene limitaciones reales
- WebGL en WKWebView puede dar **<1 FPS** donde Safari va fluido
- Límite de canvas de 256MB en iOS
- Apps 3D que funcionan en Safari pueden crashear en WKWebView con pantalla blanca

---

## Alternativas evaluadas

### Descartadas

| Alternativa | Razón de descarte |
|-------------|-------------------|
| **CesiumJS** | Bundle ~23MB, crashes en iOS/Capacitor (CONTEXT_LOST_WEBGL), overkill |
| **Mapbox GL JS** | Licencia propietaria desde v2, token obligatorio incluso offline, crashes en Capacitor |
| **deck.gl GlobeView** | Marcado como "Experimental", panning jittery desde v9.1, sin evidencia en Capacitor |
| **Three.js directo** | 4-8 semanas de desarrollo, mismo motor base que react-globe.gl (mismos problemas fundamentales de teselación) |

### Viables

#### MapLibre GL JS v5 — La mejor alternativa
- **Globe projection estable desde v5.0.0** (enero 2025)
- **GeoJSON nativo**: tiene `geojson-vt` integrado que convierte GeoJSON a vector tiles al vuelo en el browser — no necesita tile server
- **Offline**: funciona con estilo vacío + GeoJSON local. Sin token. Plugin de Capacitor existente (`maplibre-gl-capacitor-offline`)
- **Bundle**: ~770KB minified (~230KB gzip) — razonable
- **Rendimiento**: tile-based con frustum culling, horizon culling, LOD adaptativo
- **Selección táctil**: `queryRenderedFeatures()` nativo
- **Licencia**: BSD-3 (gratuita, sin restricciones)
- **Escape a nativo**: MapLibre Native existe para iOS/Android si el WebView no rinde
- **Migración**: ~1-2 semanas estimadas

**Riesgos** (del adversario):
- Globe view es muy reciente (enero 2025) — bugs activos de picking (área de click más pequeña que lo renderizado)
- `maxBounds` no funciona en globe projection
- Sin documentación/ejemplos específicos de globe projection

---

## Recomendación Final

### Paso 1 (inmediato, 30 minutos): Medir en producción

**Antes de tomar ninguna decisión, medir el tiempo REAL en production build.** Los 30 segundos pueden incluir mucho overhead de Vite dev mode que desaparece en producción.

```bash
npm run build && npx serve dist
```

Además, probar estas optimizaciones rápidas en react-globe.gl:
- `animateIn={false}` (ahorra ~1.2s)
- `polygonsTransitionDuration={0}` (ahorra ~1s)
- `rendererConfig={{ antialias: false }}` (reportado como 2x FPS mejora)
- Eliminar el `setTimeout(500ms)` en Globe.tsx
- Probar `polygonCapCurvatureResolution={12}` o superior

**Si el tiempo en producción baja a <5 segundos**: react-globe.gl es viable con estas optimizaciones. Seguir con él.

### Paso 2 (si producción sigue >5s): Migrar a MapLibre GL JS v5

MapLibre es la mejor alternativa porque:
1. **Resuelve el problema de raíz**: usa tile-based rendering con culling, no teselación bruta de todos los polígonos
2. **GeoJSON funciona sin tile server**: `geojson-vt` convierte al vuelo
3. **100% offline**: sin tokens ni servicios externos
4. **Plugin de Capacitor existente**: ya probado por otros
5. **Licencia libre**: sin costes
6. **Ruta de escape**: si el WebView no rinde, MapLibre Native da rendimiento nativo

**Riesgo a mitigar**: el globe view tiene bugs de picking (enero 2025). Verificar que la selección de países funcione correctamente antes de comprometerse con la migración.

### Decisión sobre formato de datos

Independientemente de la librería elegida:
- **Si seguimos con react-globe.gl**: el formato de datos es irrelevante (el cuello de botella es la teselación, no el parsing)
- **Si migramos a MapLibre**: GeoJSON directo es el formato nativo. La conversión a GeoJSON pre-convertido (investigada previamente) encaja perfectamente

---

## Historial de opciones descartadas

| Opción | Resultado | Lección |
|--------|-----------|---------|
| Carga progresiva 110m→50m | Falló por sincronización | No resuelve el problema de fondo |
| GeoJSON pre-convertido | Rendimiento idéntico al actual | El parsing no era el cuello de botella |
| Geobuf (Protocol Buffers) | Proyecto abandonado (5+ años) | Ganancia marginal, riesgo injustificado |
| Web Worker para parsing | No reduce tiempo total | El cuello de botella es la teselación, no el parsing |
