# Investigacion: Alternativas de Globo 3D para GeoExpert

> **Fecha**: febrero 2026
> **Contexto**: La app usa react-globe.gl, que tarda ~17s en production build para renderizar poligonos de 195 paises. Se necesita una alternativa que resuelva el cuello de botella de teselacion sincrona.

---

## Tabla Comparativa

| Criterio | MapLibre GL JS v5 | Globe.gl / three-globe | react-three-fiber + custom | CesiumJS | Mapbox GL JS v3 | deck.gl GlobeView | Leaflet + plugins |
|---|---|---|---|---|---|---|---|
| **Globe 3D (esfera)** | Si (v5, ene 2025) | Si (nativo) | Si (custom) | Si (nativo) | Si (v2+) | Si (experimental) | Parcial (WebGL Earth) |
| **GeoJSON poligonos** | Si (geojson-vt integrado) | Si (teselacion directa) | Si (manual) | Si (GeoJsonDataSource) | Si (nativo) | Si (GeoJsonLayer) | Si (basico) |
| **Tile rendering** | Si (vector tiles) | No | No (salvo custom) | Si | Si | Si (experimental) | Si (raster tiles) |
| **Frustum/horizon culling** | Si | No | Manual | Si | Si | Si | No en globe |
| **LOD adaptativo** | Si | No | Manual | Si | Si | Parcial | No en globe |
| **Seleccion tactil** | Si (queryRenderedFeatures) | Si (raycasting) | Si (raycasting) | Si (pick) | Si (queryRenderedFeatures) | Si (picking) | Si (click events) |
| **flyTo animacion** | Si (nativo) | Si (pointOfView) | Manual | Si (flyTo) | Si (nativo) | Manual | No en globe |
| **Marcadores/pins** | Si (Marker + Popup) | Si (HTML markers) | Manual | Si (Entity) | Si (Marker + Popup) | Manual | Si (nativo) |
| **Etiquetas texto** | Si (symbol layer) | Parcial (HTML labels) | Manual | Si (Label) | Si (symbol layer) | Manual | Si |
| **Offline sin token** | Si (BSD-3, sin token) | Si (MIT) | Si (MIT) | Si* (Apache 2.0) | **No** (token obligatorio) | Si (MIT) | Si (BSD-2) |
| **Bundle size (gzip)** | ~230 KB | ~180 KB (+ three.js ~170 KB) | ~236 KB (+ three.js ~170 KB) | ~4-5 MB (minimo) | ~230 KB | ~300 KB (+ deps) | ~40 KB (sin globe plugin) |
| **React wrapper** | react-map-gl/maplibre | react-globe.gl (nativo) | @react-three/fiber (nativo) | resium (wrapper) | react-map-gl | react-map-gl | react-leaflet |
| **Comunidad (npm/semana)** | ~930K descargas | ~25K descargas | ~1.5M descargas (r3f) | ~70K descargas | ~600K descargas | ~200K descargas | ~700K descargas |
| **GitHub stars** | ~8.5K | ~2.1K (globe.gl) | ~28K (@react-three/fiber) | ~13K | ~11K | ~12K | ~42K |
| **Capacitor evidencia** | Si (plugin existente) | Si (es WebGL puro) | Si (es WebGL puro) | Problematico (CONTEXT_LOST) | Si (pero con token) | Sin evidencia | No en modo globe |
| **Licencia** | BSD-3-Clause | MIT | MIT | Apache 2.0 | **Propietaria** | MIT | BSD-2-Clause |
| **Coste** | Gratis | Gratis | Gratis | Gratis* (ion es de pago) | Pago por map load | Gratis | Gratis |

*CesiumJS es gratuito pero el servicio Cesium ion (tiles, terreno) es de pago. Para uso offline con datos propios es gratuito.

---

## Analisis Detallado por Alternativa

### 1. MapLibre GL JS v5

**Descripcion**: Fork open source de Mapbox GL JS (v1), mantenido por la comunidad MapLibre. La v5 (enero 2025) anade globe projection como funcionalidad estable.

**Puntos fuertes**:
- **Tile-based rendering con geojson-vt**: convierte GeoJSON a vector tiles al vuelo en el browser. Esto significa que NO necesita un tile server — el GeoJSON local de 739KB se procesa eficientemente sin teselacion bruta.
- **Frustum culling + horizon culling**: solo renderiza los tiles visibles, no los 500+ poligonos como react-globe.gl.
- **LOD adaptativo**: diferentes niveles de detalle segun el zoom. A zoom bajo (globo entero), usa geometria simplificada.
- **queryRenderedFeatures()**: seleccion tactil nativa y eficiente. No depende de raycasting manual.
- **flyTo() nativo**: animaciones de camara suaves y optimizadas.
- **Markers y Popups**: API nativa para pins en coordenadas de capitales, con popups HTML personalizables.
- **Symbol layers**: etiquetas de texto vectoriales renderizadas en GPU, con collision detection para evitar superposiciones.
- **100% offline**: funciona con un style JSON vacio + GeoJSON inline o local. Sin token, sin servidor.
- **Plugin Capacitor**: existe `maplibre-gl-capacitor-offline` probado en Android y (parcialmente) iOS.
- **React wrapper maduro**: `react-map-gl/maplibre` (por Uber/vis.gl), con bundle reducido (~57KB para el wrapper).
- **Ruta de escape a nativo**: MapLibre Native existe para iOS (Swift) y Android (Kotlin). Si el WebView no rinde, se puede migrar a renderizado nativo sin cambiar la logica de datos.
- **Licencia BSD-3**: sin restricciones comerciales, sin token, sin costes.
- **Comunidad activa**: ~930K descargas/semana npm, 8.5K GitHub stars, TSC con reuniones mensuales abiertas.

**Puntos debiles / riesgos**:
- **Globe view es reciente** (enero 2025): hay bugs activos de picking — el area clickeable puede ser mas pequena que el poligono renderizado en globe mode.
- **maxBounds no funciona en globe projection**: no se puede restringir la navegacion a una region.
- **Documentacion de globe escasa**: la mayoria de ejemplos y tutoriales son para Mercator; los ejemplos especificos de globe son pocos.
- **Transicion globe-mercator a zoom ~12**: automatica e irreversible por precision de punto flotante.
- **No es Three.js**: la personalizacion visual (shaders custom, efectos 3D) es mas limitada que con Three.js directo.

**Funcionalidades requeridas — cobertura**:
1. Globe projection (esfera 3D rotable): SI
2. Poligonos GeoJSON de 195 paises con colores: SI (fill layer con data-driven styling)
3. Seleccion tactil de paises: SI (queryRenderedFeatures)
4. Resaltar paises individuales: SI (feature-state o filtro de capa)
5. Animar camara a pais/coordenada: SI (flyTo)
6. Pins/marcadores en capitales: SI (Marker class)
7. Etiquetas de nombres: SI (symbol layer)
8. Filtrar por continente: SI (filter en capa)

**Evidencia real**:
- [Plugin Capacitor offline](https://github.com/Yermo/maplibre-gl-capacitor-offline) existe y ha sido probado
- [Ejemplo de globe con atmosfera](https://maplibre.org/maplibre-gl-js/docs/examples/display-a-globe-with-an-atmosphere/) en documentacion oficial
- [react-map-gl soporta MapLibre v5](https://visgl.github.io/react-map-gl/docs/whats-new)
- [Guia de rendimiento para GeoJSON grande](https://maplibre.org/maplibre-gl-js/docs/guides/large-data/)

---

### 2. Globe.gl / three-globe (libreria base de react-globe.gl)

**Descripcion**: Globe.gl es el wrapper vanilla JS de three-globe, que a su vez es la libreria base de react-globe.gl. Usar three-globe directamente (sin el wrapper React) da mas control sobre Three.js.

**Puntos fuertes**:
- **Ya conocemos la API**: es la misma base que react-globe.gl, con la que ya estamos familiarizados.
- **Mas control sobre Three.js**: acceso directo al renderer, scene y camera de Three.js.
- **three-globe es mas fluido que globe.gl** segun reportes de usuarios en GitHub issues.
- **Integracion con react-three-fiber**: existe `r3f-globe` (del mismo autor) que integra three-globe como componente de R3F.
- **MIT license**: sin restricciones.

**Puntos debiles / riesgos**:
- **MISMO PROBLEMA FUNDAMENTAL**: la teselacion es identica. `geoPolygonTriangulate()` se ejecuta para cada poligono, sincronamente en el hilo principal. Cambiar de react-globe.gl a three-globe/globe.gl NO resuelve el cuello de botella de 17 segundos.
- **Sin tile rendering**: sigue cargando todo el GeoJSON de golpe.
- **Sin frustum culling**: sigue renderizando los 500+ poligonos aunque esten detras del globo.
- **Sin LOD**: misma resolucion siempre, independiente del zoom.
- **Sin draw call batching para poligonos**: sigue creando 1 mesh por poligono.
- **Comunidad pequena**: solo ~3 proyectos en npm dependen de react-globe.gl.

**Veredicto**: DESCARTADA. No resuelve el problema. Es mover las sillas del Titanic.

**Evidencia**:
- [Issue #164: Performance Issues with globe](https://github.com/vasturiano/react-globe.gl/issues/164)
- [Issue #63: three-globe vs react-globe.gl performance](https://github.com/vasturiano/react-globe.gl/issues/63)
- [Issue #28: Performance issues](https://github.com/vasturiano/react-globe.gl/issues/28)

---

### 3. react-three-fiber + custom globe

**Descripcion**: Construir un globo personalizado usando @react-three/fiber (R3F), el renderer React de Three.js. Enfoque "desde cero" similar al que uso Shopify para su famoso globo BFCM.

**Puntos fuertes**:
- **Control total**: shaders personalizados, geometrias optimizadas, efectos visuales ilimitados.
- **Ecosistema R3F maduro**: ~28K GitHub stars, ~1.5M descargas/semana. Drei (helpers), Postprocessing, etc.
- **OffscreenCanvas**: existe `@react-three/offscreen` para renderizar en Web Worker (pero NO funciona en Safari/WKWebView).
- **Raycasting nativo**: Three.js tiene raycaster integrado para deteccion de clicks/touch.
- **Se puede implementar batching manual**: merge de geometrias, instancing, etc.
- **Bundle razonable**: R3F ~236KB gzip + Three.js ~170KB gzip = ~400KB total.

**Puntos debiles / riesgos**:
- **Esfuerzo de desarrollo estimado: 4-8 semanas** para replicar las funcionalidades basicas (GeoJSON parsing, teselacion, frustum culling, LOD, camara, touch).
- **El problema de teselacion persiste**: sigue necesitando convertir GeoJSON a geometria 3D. Sin usar tiles, el problema de fondo es el mismo.
- **Implementar frustum culling y LOD desde cero**: es trabajo complejo y propenso a bugs.
- **OffscreenCanvas no funciona en Safari/WKWebView**: el principal mecanismo de optimizacion (worker thread) no esta disponible en el target principal (iOS).
- **Mantenimiento continuo**: cada feature nueva (labels, pins, popups) hay que implementarla manualmente.
- **Sin tile rendering nativo**: habria que implementar un sistema de tiles propio o integrar geojson-vt manualmente.

**Funcionalidades requeridas — cobertura**:
1. Globe projection: SI (esfera custom)
2. Poligonos GeoJSON: SI (con implementacion manual)
3. Seleccion tactil: SI (raycaster)
4. Resaltar paises: SI (material swap)
5. Animar camara: SI (manual con tween)
6. Pins/marcadores: SI (manual)
7. Etiquetas: SI (manual, HTML overlay o texto 3D)
8. Filtrar por continente: SI (manual)

**Veredicto**: VIABLE PERO COSTOSA. Solo justificable si necesitamos efectos visuales que MapLibre no puede ofrecer. El ROI no justifica 4-8 semanas de desarrollo custom cuando MapLibre ofrece todo lo necesario out-of-the-box.

**Evidencia**:
- [geo-globe-three: ejemplo Next.js + R3F + GeoJSON](https://github.com/NombanaMtechniix/geo-globe-three)
- [r3f-globe: componente R3F del autor de globe.gl](https://github.com/vasturiano/r3f-globe)
- [react-three-offscreen: worker thread](https://github.com/pmndrs/react-three-offscreen) (NO funciona en Safari)

---

### 4. CesiumJS

**Descripcion**: Motor 3D de grado profesional para globos virtuales, desarrollado por Cesium (empresa). Usado por la NASA, NOAA, Army, etc. Licencia Apache 2.0.

**Puntos fuertes**:
- **El motor de globos mas completo del mercado**: terreno 3D, imagery layers, 3D Tiles, atmosfera, sol/luna, animaciones temporales.
- **GeoJsonDataSource**: carga GeoJSON directamente sobre el globo con estilos personalizables.
- **Picking nativo**: click en entidades con toda la informacion del feature.
- **flyTo() nativo**: animaciones de camara cinematograficas.
- **Tile-based con LOD**: sistema de tiles quadtree con streaming progresivo.
- **Offline posible**: puede funcionar sin Cesium ion usando datos locales y la guia offline.
- **Apache 2.0**: licencia libre.
- **WebGPU renderer en desarrollo**: mejora de 2-4x rendimiento prevista.
- **React wrapper**: `resium` (wrapper React de CesiumJS).

**Puntos debiles / riesgos**:
- **Bundle ENORME**: ~4-5 MB minificado como minimo. Con tree-shaking mejora pero sigue siendo masivo. Un reporte menciona ~23MB importando Viewer.
- **CONTEXT_LOST_WEBGL en iOS**: hay reportes de crashes en WebView movil con CesiumJS. El motor es muy exigente con los recursos GPU.
- **Overkill para el caso de uso**: CesiumJS esta disenado para visualizacion geoespacial profesional (drones, satelites, ciudades 3D). Para un quiz de geografia es como usar un tanque para ir al supermercado.
- **Complejidad de configuracion**: requiere configuracion especial de webpack/vite para copiar assets estaticos (workers, imagery).
- **Rendimiento en WKWebView dudoso**: sin evidencia solida de que funcione bien en Capacitor iOS.
- **Cesium ion de pago**: las tiles por defecto (Bing imagery, Cesium World Terrain) requieren un token de ion. Para uso offline hay que proveer tus propias tiles.

**Veredicto**: DESCARTADA. Bundle demasiado grande, crashes reportados en iOS WebView, overkill para el caso de uso.

**Evidencia**:
- [Issue #8116: Globe failing in mobile Firefox](https://github.com/CesiumGS/cesium/issues/8116)
- [Offline Guide oficial](https://github.com/CesiumGS/cesium/blob/main/Documentation/OfflineGuide/README.md)
- [Community thread: bundle size grande](https://community.cesium.com/t/large-bundle-size/10724)

---

### 5. Mapbox GL JS v3

**Descripcion**: La libreria de mapas comercial de Mapbox. Licencia propietaria desde v2 (diciembre 2020). Requiere token de acceso para cualquier uso.

**Puntos fuertes**:
- **Globe projection solida**: disponible desde v2 (2021), mas madura que la de MapLibre.
- **Motor de rendering identico conceptualmente a MapLibre** (MapLibre es fork de Mapbox GL JS v1).
- **Documentacion excelente**: ejemplos, tutoriales, guias de migracion.
- **Estilos de alta calidad**: Mapbox Streets, Satellite, etc.
- **React wrapper**: `react-map-gl` (mismo wrapper, endpoint diferente).

**Puntos debiles / riesgos**:
- **LICENCIA PROPIETARIA**: Mapbox GL JS v2+ ya no es open source. Requiere aceptar los terminos de servicio de Mapbox.
- **TOKEN OBLIGATORIO**: no funciona sin un access token de Mapbox, incluso para datos locales. La inicializacion del mapa requiere token.
- **Facturacion por map load**: cada inicializacion del objeto Map cuenta como un map load facturable.
- **No funciona offline sin token**: contradice el requisito de 100% offline.
- **Vendor lock-in**: dependencia total de Mapbox como empresa.

**Veredicto**: DESCARTADA. Licencia propietaria + token obligatorio + coste por uso = incompatible con los requisitos del proyecto (100% offline, sin costes, sin dependencias externas).

**Evidencia**:
- [Mapbox GL JS pricing](https://docs.mapbox.com/mapbox-gl-js/guides/pricing/)
- [Mapbox GL new license (Geoapify)](https://www.geoapify.com/mapbox-gl-new-license-and-6-free-alternatives/)
- [HN: Mapbox GL JS is no longer open source](https://news.ycombinator.com/item?id=25347310)

---

### 6. deck.gl GlobeView

**Descripcion**: Framework de visualizacion de datos geoespaciales de Uber/vis.gl. GlobeView es una vista experimental que renderiza en una esfera 3D.

**Puntos fuertes**:
- **GeoJsonLayer potente**: renderizado eficiente de poligonos GeoJSON con GPU acceleration.
- **Picking nativo**: seleccion de features por click/touch.
- **MIT license**: libre y sin costes.
- **Buena integracion con React**: via `react-map-gl` o standalone.
- **Tile rendering**: TileLayer soportado (aunque experimental en GlobeView).
- **Comunidad solida**: ~200K descargas/semana, ~12K GitHub stars.

**Puntos debiles / riesgos**:
- **GlobeView es EXPERIMENTAL**: marcado explicitamente como experimental en la documentacion oficial.
- **SIN ROTACION** (pitch/bearing): la camara siempre apunta al centro de la Tierra con norte arriba. No se puede inclinar ni rotar el globo libremente, solo pan y zoom.
- **Panning jittery**: reportes de jitter en la navegacion desde v9.1.
- **TileLayer experimental en GlobeView**: el rendering de tiles no esta completamente soportado en modo globo.
- **MaskExtension no soportada**: limita opciones de estilizado.
- **Sin evidencia en Capacitor**: no encontre testimonios de uso en apps empaquetadas con Capacitor.
- **No es un mapa**: deck.gl esta orientado a visualizacion de datos, no a cartografia interactiva. No tiene labels, markers nativos, ni popups.

**Veredicto**: DESCARTADA. GlobeView experimental + sin rotacion + sin markers/labels nativos = no cumple los requisitos funcionales. La limitacion de "camara fija mirando al centro" es un deal-breaker para una app interactiva de geografia.

**Evidencia**:
- [GlobeView (Experimental) docs](https://deck.gl/docs/api-reference/core/globe-view)
- [Discussion #6860: Roadmap for Globe View?](https://github.com/visgl/deck.gl/discussions/6860)
- [Discussion #7118: Mapbox globe incompatible](https://github.com/visgl/deck.gl/discussions/7118)

---

### 7. Leaflet + plugins (WebGL Earth / 3D Globe)

**Descripcion**: Leaflet es la libreria de mapas 2D mas popular. Plugins como WebGL Earth intentan anadir capacidad de globo 3D.

**Puntos fuertes**:
- **Leaflet es maduro y ligero**: ~40KB gzip, ~42K GitHub stars, ~700K descargas/semana.
- **Ecosistema de plugins enorme**: cientos de plugins para todo tipo de funcionalidad.
- **Excelente soporte tactil y movil**: disenado para mobile-first.
- **BSD-2 license**: libre.

**Puntos debiles / riesgos**:
- **NO tiene globe projection nativa**: Leaflet es fundamentalmente 2D (Mercator).
- **WebGL Earth esta desactualizado**: ultima actualizacion en 2014. Usa Cesium como backend, heredando todos sus problemas de bundle.
- **Leaflet.GlobeMiniMap es solo un minimap**: no un reemplazo del mapa principal.
- **eegeo.js/WRLD ya no existe**: el servicio cerro.
- **Los plugins de globo son hacks**: no estan integrados con el motor de rendering de Leaflet.
- **Sin soporte nativo de GeoJSON en 3D**: los poligonos GeoJSON de Leaflet son 2D.

**Veredicto**: DESCARTADA. Leaflet es excelente para mapas 2D pero no tiene soporte viable de globe 3D. Los plugins estan desactualizados o son wrappers de otras librerias (CesiumJS).

---

## Ranking Final (de mejor a peor)

| # | Alternativa | Viabilidad | Justificacion |
|---|---|---|---|
| **1** | **MapLibre GL JS v5** | RECOMENDADA | Resuelve el problema de raiz. Tile-based, offline, gratis, con todas las funcionalidades necesarias |
| 2 | react-three-fiber + custom | Viable pero costosa | Control total pero 4-8 semanas de desarrollo y mantenimiento continuo |
| 3 | deck.gl GlobeView | No viable | Experimental, sin rotacion, sin markers nativos |
| 4 | CesiumJS | No viable | Bundle enorme, crashes en iOS WebView, overkill |
| 5 | Globe.gl / three-globe | No viable | Mismo problema de teselacion que react-globe.gl |
| 6 | Mapbox GL JS v3 | No viable | Token obligatorio + licencia propietaria + coste |
| 7 | Leaflet + plugins | No viable | Sin globe 3D real |

---

## Recomendacion

### MapLibre GL JS v5 es la unica alternativa que cumple TODOS los requisitos

**Por que MapLibre resuelve el problema**:
- El cuello de botella actual es la teselacion sincrona de 500+ poligonos en el hilo principal (~17s).
- MapLibre usa `geojson-vt` para convertir GeoJSON a vector tiles al vuelo, con frustum culling, horizon culling y LOD adaptativo.
- Esto transforma un proceso de "cargar todo de golpe" en un proceso de "renderizar solo lo visible al nivel de detalle necesario".

**Checklist de requisitos**:
- [x] Globe projection (esfera 3D rotable)
- [x] Poligonos GeoJSON de 195 paises con colores diferenciados
- [x] Seleccion tactil de paises (queryRenderedFeatures)
- [x] Resaltar paises individuales (feature-state)
- [x] Animar camara a pais/coordenada (flyTo)
- [x] Pins/marcadores en capitales (Marker)
- [x] Etiquetas de nombres (symbol layer)
- [x] Filtrar por continente (filter expression)
- [x] 100% offline sin token
- [x] Licencia libre (BSD-3)
- [x] Compatible con Capacitor (plugin existente)
- [x] React wrapper maduro (react-map-gl/maplibre)

**Riesgos a mitigar antes de comprometerse**:
1. **Verificar picking en globe mode**: hacer un PoC rapido que demuestre que `queryRenderedFeatures` funciona correctamente en globe projection al tocar paises.
2. **Probar en WKWebView real**: no solo en Safari, sino en el WebView de Capacitor iOS en un dispositivo fisico.
3. **Confirmar rendimiento de GeoJSON local**: cargar los 739KB de datos de paises y medir tiempo hasta interactive.

**Estimacion de migracion**: ~1-2 semanas para reemplazar react-globe.gl por MapLibre con todas las funcionalidades existentes.

---

## Fuentes Principales

- [MapLibre GL JS documentacion](https://maplibre.org/maplibre-gl-js/docs/)
- [MapLibre Globe View roadmap](https://maplibre.org/roadmap/maplibre-gl-js/globe-view/)
- [react-map-gl (wrapper React)](https://visgl.github.io/react-map-gl/docs/whats-new)
- [maplibre-gl-capacitor-offline (plugin)](https://github.com/Yermo/maplibre-gl-capacitor-offline)
- [MapLibre GL JS GitHub](https://github.com/maplibre/maplibre-gl-js)
- [MapLibre guia de rendimiento GeoJSON](https://maplibre.org/maplibre-gl-js/docs/guides/large-data/)
- [Globe.gl GitHub](https://github.com/vasturiano/globe.gl)
- [react-globe.gl issues de rendimiento](https://github.com/vasturiano/react-globe.gl/issues/164)
- [CesiumJS Offline Guide](https://github.com/CesiumGS/cesium/blob/main/Documentation/OfflineGuide/README.md)
- [Mapbox GL JS pricing](https://docs.mapbox.com/mapbox-gl-js/guides/pricing/)
- [deck.gl GlobeView docs](https://deck.gl/docs/api-reference/core/globe-view)
- [react-three-offscreen](https://github.com/pmndrs/react-three-offscreen)
