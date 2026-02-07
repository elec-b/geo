# Informe del Adversario Tecnico: Alternativas de Globo 3D

> **Objetivo**: Cuestionar, refutar y encontrar los puntos debiles de cada alternativa de globo 3D para GeoExpert (React 18 + Vite + Capacitor, 195 paises, interaccion tactil, 100% offline).

---

## 1. MapLibre GL JS v5 (globe projection)

### Puntos fuertes (reconocidos, pero no motivo de este informe)
- Tile-based rendering con frustum/horizon culling
- `geojson-vt` integrado para GeoJSON local sin tile server
- BSD-3, sin token, sin coste
- Comunidad activa (~7k GitHub stars, releases frecuentes)
- App de produccion real: [cartes-ign-app](https://github.com/IGNF/cartes-ign-app) usa MapLibre + Capacitor

### Puntos debiles y bugs encontrados

#### Bug de picking en circle layers (CORREGIDO)
- **Issue [#5255](https://github.com/maplibre/maplibre-gl-js/issues/5255)**: Los circle layers tenian area de click/hover mas pequena que lo renderizado visualmente en globe projection.
- **Estado**: CORREGIDO en v5.1.x (PR #5599 mergeado, marzo 2025).
- **Impacto para GeoExpert**: Bajo. Usaremos fill layers para poligonos de paises, no circle layers. Ademas ya esta corregido.

#### `maxBounds` no funciona en globe projection (ABIERTO)
- **Issue [#5474](https://github.com/maplibre/maplibre-gl-js/issues/5474)**: `maxBounds` y `setMaxBounds` no restringen el movimiento correctamente en globe.
- **Estado**: ABIERTO (febrero 2025). Etiquetado como "PR is more than welcomed" (los maintainers no lo priorizan).
- **Impacto para GeoExpert**: Bajo-Medio. No necesitamos maxBounds estrictamente; el globo completo es nuestro area de juego. Sin embargo, si quisieramos limitar la navegacion a un continente durante un reto, no funcionaria.

#### `flyTo()` con padding roto en globe (CORREGIDO)
- **Issue [#4891](https://github.com/maplibre/maplibre-gl-js/issues/4891)**: Al usar flyTo con padding en globe, el padding no se aplicaba correctamente la segunda vez.
- **Estado**: CORREGIDO en v5.1.1 (PR #5406).
- **Impacto para GeoExpert**: Ninguno. Ya corregido.

#### Globe light position inconsistente
- **Issue [#5229](https://github.com/maplibre/maplibre-gl-js/issues/5229)**: La iluminacion del globo es diferente a la de objetos extruidos.
- **Impacto para GeoExpert**: Bajo. No usamos extrusiones 3D significativas.

#### Render errors con pmtiles en globe
- **Issue [#5242](https://github.com/maplibre/maplibre-gl-js/issues/5242)**: Errores de renderizado en globe con pmtiles.
- **Impacto para GeoExpert**: Ninguno. Usamos GeoJSON local, no pmtiles.

#### Precision flotante en globe y transicion automatica a Mercator
- Globe projection cambia automaticamente a Mercator alrededor de zoom 12 por limitaciones de precision de punto flotante.
- **Impacto para GeoExpert**: Bajo. Nuestro caso de uso es zoom bajo-medio (ver paises completos). No necesitamos zoom nivel calle.

#### Documentacion de globe escasa
- **Issue [#5254](https://github.com/maplibre/maplibre-gl-js/issues/5254)**: Falta documentacion y ejemplos especificos para globe projection.
- **Impacto para GeoExpert**: Medio. Habra que experimentar mas y consultar el codigo fuente. Aumenta el tiempo de desarrollo.

#### Driver bug en algunos telefonos
- En algunos dispositivos hay un bug de driver que aplica `glDepthRange` y clipping en orden incorrecto, impidiendo el horizon clipping estandar.
- **Impacto para GeoExpert**: Desconocido. Dependera de los dispositivos especificos de nuestros usuarios.

#### CapacitorHttp y CORS
- MapLibre no usa automaticamente el plugin CapacitorHttp. Las requests desde workers no pasan por Capacitor.
- **Solucion**: Usar `addProtocol` en el main thread. Para nuestro caso (datos locales) esto es irrelevante -- no hacemos requests HTTP externas.
- **Impacto para GeoExpert**: Ninguno. Datos 100% locales.

#### WebGL context lost en v5.12+
- **Issue [#7022](https://github.com/maplibre/maplibre-gl-js/issues/7022)**: Error JS cuando el contexto WebGL se pierde antes de cargar el estilo.
- **Impacto para GeoExpert**: Medio. Esto puede ocurrir en WKWebView bajo presion de memoria. Hay que manejar el caso gracefully.

#### MapLibre Native NO tiene globe projection
- **Issue [maplibre-native #3161](https://github.com/maplibre/maplibre-native/issues/3161)**: La "ruta de escape a nativo" mencionada en RESEARCH_LOAD_PERFORMANCE.md NO es viable para globe. MapLibre Native no soporta globe projection y no hay timeline.
- **Impacto para GeoExpert**: Alto como riesgo estrategico. Si el WebView no rinde lo suficiente, NO podemos simplemente "saltar a nativo" manteniendo globe. Esto invalida parcialmente el argumento de "escape a nativo" del research anterior.

### Veredicto: VIABLE CON RIESGOS CONOCIDOS

**Riesgo principal**: Globe es una feature reciente (enero 2025, ~13 meses). Funciona, pero los bugs de picking ya corregidos demuestran que es una feature en maduracion activa. El riesgo mas serio es que MapLibre Native no tiene globe -- la ruta de escape no existe.

---

## 2. Globe.gl / three-globe (libreria base de react-globe.gl)

### Que es
- `three-globe` es el motor Three.js puro. `globe.gl` es un wrapper web-component. `react-globe.gl` es el wrapper React. `r3f-globe` es el wrapper R3F.
- **Mismo motor subyacente** que lo que ya tenemos. Misma teselacion, mismos problemas fundamentales.

### Puntos debiles

#### El problema fundamental NO cambia
- three-globe usa EXACTAMENTE la misma pipeline de teselacion que react-globe.gl: `geoPolygonTriangulate()` sincronamente para cada poligono.
- **No hay tile-based rendering, no hay LOD, no hay frustum culling, no hay web workers.**
- Cambiar de react-globe.gl a three-globe/globe.gl es como cambiar la carroceria del coche sin tocar el motor.

#### Rendimiento ligeramente mejor, pero insuficiente
- **Issue [#63](https://github.com/vasturiano/react-globe.gl/issues/63)**: three-globe es "mas fluido" que react-globe.gl porque elimina el overhead de React re-renders. Pero la teselacion inicial sigue siendo el mismo cuello de botella de ~15-17 segundos.
- **Issue [#51](https://github.com/vasturiano/globe.gl/issues/51)**: Framerate significativamente menor en globe.gl vs three-globe directo.
- **Issue [#164](https://github.com/vasturiano/react-globe.gl/issues/164)**: Problemas de rendimiento reportados con el globo.
- **Issue [#28](https://github.com/vasturiano/react-globe.gl/issues/28)**: Problemas de rendimiento desde 2020.

#### Materiales negros en moviles
- **Issue [#44](https://github.com/vasturiano/globe.gl/issues/44)**: En algunos dispositivos moviles, todos los materiales se renderizan en negro dependiendo de los drivers GPU.
- **Impacto para GeoExpert**: Medio-Alto. No podemos controlar que GPU tienen nuestros usuarios.

#### Bundle size elevado
- three-globe: arrastra Three.js completo (~600KB min+gzip con Three.js incluido).
- react-globe.gl trae three-globe + React wrapper. El bundle total de nuestro proyecto actual es 4.1MB en dev.

#### Ecosistema minusculo
- three-globe: ~1,500 stars, weekly downloads ~77k (razonable pero bajo)
- r3f-globe: **41 stars, 317 weekly downloads, 0 dependents**
- Un solo mantenedor (vasturiano) para todo el ecosistema globe.gl

#### No resuelve nuestro problema
- Seguiriamos con ~500 draw calls, ~1.25M triangulos, todo sincronamente en main thread.
- El tiempo de carga seguiria siendo inaceptable en movil.

### Veredicto: NO VIABLE

Cambiar a three-globe/globe.gl/r3f-globe es mover las sillas del Titanic. El problema de raiz (teselacion bruta sin optimizaciones de cartografia) permanece intacto.

---

## 3. react-three-fiber + custom globe (enfoque DIY)

### Que implica
- Construir un globo desde cero usando Three.js via react-three-fiber
- Parsear GeoJSON, triangular poligonos, gestionar camara, interaccion, picking manualmente

### Puntos debiles

#### Mismo motor = mismos problemas de teselacion
- Si usamos Three.js para renderizar poligonos de paises, necesitamos EXACTAMENTE la misma pipeline de teselacion que three-globe.
- earcut/Delaunay triangulation, mesh por poligono, etc.
- **No ganamos nada sobre three-globe excepto mas control... y mucho mas trabajo.**

#### Tiempo de desarrollo estimado: 4-8 semanas
- Esto es una estimacion optimista. Incluye:
  - Esfera base con texturas
  - GeoJSON parsing + triangulacion
  - Picking/raycasting por pais
  - Animaciones flyTo
  - Labels/pins
  - Optimizaciones de rendimiento
  - Testing en movil/WebView

#### Aun necesitariamos implementar las optimizaciones de un motor de mapas
- Frustum culling manual
- LOD manual
- Batching de draw calls manual
- Web Workers para teselacion manual
- Basically... reescribir MapLibre.

#### PerformanceMonitor no es magia
- react-three-fiber tiene `PerformanceMonitor` para ajustar DPR y efectos. Pero esto solo ayuda con el framerate de renderizado, NO con el tiempo de carga inicial (nuestro problema principal).

#### Dependencia de un solo desarrollador (tu)
- Cualquier bug especifico del globo custom sera tu problema. No hay comunidad, no hay Stack Overflow, no hay issues de referencia.

### Veredicto: NO VIABLE

Es la opcion que mas trabajo requiere, con menos garantias, y que al final enfrentara los mismos problemas fundamentales de teselacion que ya tenemos. Solo tendria sentido si necesitaramos algo MUY especifico que ninguna otra libreria ofrece.

---

## 4. CesiumJS

### Que es
Motor de globo 3D completo, usado por NASA, Bing Maps, y aplicaciones de geovisualizacion pesada.

### Puntos debiles

#### Bundle monstruoso
- Importar solo el Viewer: **~23MB** adicionales al bundle.
- Para una app movil que debe ser ligera y rapida, esto es inaceptable.
- La app entera de GeoExpert deberia pesar menos de 10MB idealmente.

#### CONTEXT_LOST_WEBGL en iOS
- **Issue [#10017](https://github.com/CesiumGS/cesium/issues/10017)**: iPhone SE crashea con CONTEXT_LOST_WEBGL al hacer pan/zoom ~50 veces.
- Multiples reportes en la comunidad de contextos WebGL perdidos ([forum](https://community.cesium.com/t/webgl-context-lost-errors-at-random-times/25674)).
- **Impacto para GeoExpert**: Critico. Una app de juego donde el usuario rota constantemente el globo triggerearia esto frecuentemente.

#### Performance en WebView significativamente peor
- Reportes consistentes de que CesiumJS en WebView es mucho mas lento que en Chrome/Safari standalone.
- WKWebView tiene limites de memoria mas estrictos que Safari.

#### Overkill absoluto
- CesiumJS esta disenado para terreno 3D, edificios, satelites, trayectorias.
- Para nuestro caso (poligonos planos de paises en un globo), es como usar un camion para ir a comprar pan.

#### Licencia clarificada pero con trampa
- CesiumJS es Apache-2.0 (gratuito, open source).
- PERO: Cesium ion (el servicio de tiles/hosting) tiene pricing. Si necesitas datos base (terreno, imagery), necesitas ion o un proveedor alternativo.
- Para nuestro caso (solo GeoJSON local), no necesitariamos ion. Pero la documentacion empuja hacia ion constantemente.

#### No hay wrapper React mantenido
- `resium` existe pero su nivel de actividad y compatibilidad con versiones recientes de CesiumJS es cuestionable.

### Veredicto: NO VIABLE

Demasiado pesado, demasiados crashes en iOS/WebView, overkill para nuestro caso de uso.

---

## 5. Mapbox GL JS (v3+)

### Que es
Fork propietario del que salio MapLibre. Tiene globe view desde v2.

### Puntos debiles

#### Licencia propietaria - Showstopper
- Desde diciembre 2020 (v2.0), Mapbox GL JS **ya no es open source**.
- Licencia: Mapbox Terms of Service. No BSD, no MIT, no Apache.
- **Token OBLIGATORIO** incluso para datos locales. Sin token, la libreria no inicializa.
- **Issue [#10200](https://github.com/mapbox/mapbox-gl-js/issues/10200)**: "How to use v2 in offline or network restricted environments" -- la respuesta oficial: necesitas token, necesitas validacion online periodica.
- **Impacto para GeoExpert**: Bloqueante. Nuestro requisito es 100% offline, sin tokens, sin dependencia de terceros.

#### Coste
- Free tier: 50,000 map loads/mes. Despues: $5 por cada 1,000 loads adicionales.
- Para una app movil con potencialmente miles de usuarios, esto se acumula rapido.
- Ademas, el pricing puede cambiar unilateralmente (ya lo hicieron una vez con la licencia).

#### Crashes en Capacitor/iOS documentados
- **Issue [#11170](https://github.com/mapbox/mapbox-gl-js/issues/11170)**: Error 403 en `map.init` al correr con Capacitor 3.x en iOS.
- **Issue [#6300](https://github.com/mapbox/mapbox-gl-js/issues/6300)**: App crasheando en todos los navegadores iOS.
- **Issue [#9415](https://github.com/mapbox/mapbox-gl-js/issues/9415)**: App Ionic crashea al hacer zoom out.
- **Issue [#10785](https://github.com/mapbox/mapbox-gl-js/issues/10785)**: Crash total en Mobile Safari en iOS Simulator.
- **[WebKit #172790](https://bugs.webkit.org/show_bug.cgi?id=172790)**: Out of memory crash con Mapbox GL JS.

#### Plugin offline de Capacitor obsoleto
- `mapbox-gl-capacitor-offline` esta basado en Mapbox GL JS **v0.53.1** (2019). Completamente obsoleto.

#### Globe view con deck.gl tiene flickering
- **Issue [#13574](https://github.com/mapbox/mapbox-gl-js/issues/13574)**: Layers de deck.gl flickeran y desaparecen en globe projection.

### Veredicto: NO VIABLE

La licencia propietaria y el token obligatorio son bloqueantes absolutos para nuestro caso de uso offline. Los crashes en Capacitor/iOS son la cereza del pastel.

---

## 6. deck.gl GlobeView

### Que es
Libreria de visualizacion de datos sobre mapas (by vis.gl/OpenJS Foundation). Tiene un GlobeView experimental.

### Puntos debiles

#### Explicitamente "Experimental"
- La documentacion oficial dice: "GlobeView is an experimental class [...] users should use it with caution."
- No ha "graduado" a estable despues de anos de existencia.

#### Panning jittery (regresion activa)
- **Issue [#9676](https://github.com/visgl/deck.gl/issues/9676)**: Desde v9.1.0 (2025), al hacer pan y arrastrar mas alla del globo, este "jitters" (tiembla/salta). Tambien, al hacer pan hacia los polos el tamano del globo cambia erroneamente.
- **Regresion**: Funcionaba bien en v9.0.37 y anteriores. Se rompio en v9.1.0+.
- **Impacto para GeoExpert**: Critico. Una app de juego donde el usuario rota constantemente el globo no puede tener jitter.

#### Sin evidencia en Capacitor/WebView
- No encontre ningun proyecto que use deck.gl GlobeView en Capacitor o WebView movil.
- deck.gl esta disenado para dashboards de datos en escritorio, no para apps moviles.

#### Tracker de graduacion estancado
- **Issue [#9199](https://github.com/visgl/deck.gl/issues/9199)**: Tracker para graduar GlobeView de experimental a estable. Sin progreso significativo.

### Veredicto: NO VIABLE

Experimental, con regresion activa de jitter, sin uso demostrado en movil.

---

## 7. Otras alternativas consideradas

### Leaflet + Leaflet.js globe plugins
- Leaflet no tiene soporte nativo de globo 3D.
- Los plugins (leaflet-globe, etc.) son proyectos abandonados con <100 stars.
- **Veredicto: No viable.**

### OpenLayers
- Soporte de globo experimental via `ol-cesium` (que trae CesiumJS, volviendo a los mismos problemas).
- **Veredicto: No viable.**

### D3.js + orthographic projection
- D3 puede renderizar una proyeccion ortografica que "parece" un globo.
- Pero: no es 3D real, no tiene picking eficiente, no tiene animaciones flyTo suaves, rendimiento pobre con 195 poligonos complejos en SVG/Canvas.
- **Veredicto: No viable para nuestro caso.**

---

## Limitaciones de WKWebView (aplica a TODAS las alternativas)

Cualquier solucion WebGL en Capacitor iOS enfrentara estas limitaciones:

| Limitacion | Detalle |
|-----------|---------|
| Memoria total de pagina | ~1.4-1.5 GB (variable segun dispositivo y carga del sistema) |
| Memoria de canvas | Limite de 256 MB para el total de canvas |
| WebGL context loss | Mas frecuente en WKWebView que en Safari standalone |
| Rendimiento vs Safari | WKWebView puede ser significativamente mas lento |
| Memory leaks al redimensionar canvas | Bug conocido en iOS -- leak al cambiar width/height de canvas WebGL |
| GPU Process | Desde iOS 15, "GPU Process: Canvas Rendering" activado por defecto redujo FPS en algunos casos |

**Conclusion**: Ninguna libreria WebGL esta exenta de estos problemas. La clave es elegir la que gestione mejor la memoria y los draw calls. MapLibre, con su tile-based rendering y culling, es la que menos presion pone sobre el WebGL context.

---

## Tabla resumen

| Alternativa | Resuelve teselacion lenta | Offline sin token | Licencia libre | Mobile probado | Bundle razonable | Veredicto |
|------------|:---:|:---:|:---:|:---:|:---:|-----------|
| **MapLibre GL JS v5** | Si (tiles) | Si | Si (BSD-3) | Si (cartes-ign) | Si (~770KB min, ~230KB gzip) | **Viable con riesgos** |
| Globe.gl / three-globe | No | Si | Si (MIT) | Parcial | Medio (~600KB con Three.js) | No viable |
| R3F + custom globe | No (mismo motor) | Si | Si | No probado | Medio | No viable |
| CesiumJS | Si (tiles) | Si* | Si (Apache-2.0) | No (crashes) | No (~23MB) | No viable |
| Mapbox GL JS v3 | Si (tiles) | **No** (token) | **No** (propietaria) | Parcial (crashes) | Si | No viable |
| deck.gl GlobeView | Parcial | Si | Si (MIT) | No probado | Medio-Alto | No viable |

---

## Ranking final (de mejor a peor)

1. **MapLibre GL JS v5** -- La unica alternativa viable. Con riesgos conocidos pero manejables.
2. **Globe.gl / three-globe directo** -- Ligeramente mejor que react-globe.gl, pero no resuelve el problema de fondo.
3. **CesiumJS** -- Potente pero demasiado pesado y propenso a crashes en iOS.
4. **react-three-fiber custom** -- Maximo control, maximo esfuerzo, mismos problemas.
5. **deck.gl GlobeView** -- Experimental y roto.
6. **Mapbox GL JS** -- Excelente tecnicamente, inaceptable comercial y legalmente.

---

## Conclusion del adversario

**Recomiendo MapLibre GL JS v5, a pesar de sus defectos.** He aqui por que:

### Los defectos son reales pero manejables
- Globe projection tiene ~13 meses de edad. Es joven.
- Los bugs de picking y flyTo ya estan corregidos.
- `maxBounds` en globe no funciona, pero no lo necesitamos.
- La documentacion es escasa, pero el codigo fuente es legible y la comunidad responde.

### El riesgo mas serio
**MapLibre Native NO tiene globe projection.** La "ruta de escape a nativo" mencionada en el research anterior no existe para globe. Si el rendimiento en WKWebView no es suficiente, NO tenemos plan B con MapLibre Native en globe mode.

**Mitigacion propuesta**: Antes de comprometerse con la migracion completa, hacer un **spike de 2-3 dias** donde:
1. Cargar los 195 paises como GeoJSON en MapLibre v5 con globe projection
2. Probar en iOS Simulator Y en dispositivo fisico (iPhone 12 minimo)
3. Medir: tiempo de carga, FPS durante rotacion, `queryRenderedFeatures` de poligonos
4. Verificar que la seleccion tactil de paises funciona correctamente en globe
5. Probar flyTo animado entre paises

Si el spike pasa estos 5 criterios con resultados aceptables (<3s carga, >30 FPS, picking preciso), proceder con la migracion completa. Si no, reevaluar.

### La alternativa realista si MapLibre falla
Si MapLibre v5 globe no rinde en WKWebView, la unica alternativa seria **MapLibre Native para iOS** (sin globe, usando Mercator con tilt para dar sensacion de profundidad) -- lo cual contradice el requisito del globo, pero seria funcional. Esto requeriria abandonar la web/Capacitor para iOS y usar Swift nativo con MapLibre iOS SDK.
