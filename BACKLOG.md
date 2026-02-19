# Backlog de GeoExpert

> Historial de desarrollo más reciente y próximos pasos. Para el historial completo, consultar git.

---

## Completado

### Setup inicial
- [x] Proyecto React + Vite configurado
- [x] Globo 3D con MapLibre GL JS v5 (globe projection)
- [x] Carga de países desde `world-atlas` (TopoJSON → GeoJSON)
- [x] Interacción táctil básica (click en países)
- [x] Tema espacial con fondo negro y estrellas
- [x] Colores simplificados: gris uniforme para todos los países
- [x] Resolución 50m (equilibrio detalle/rendimiento, incluye Baleares, Canarias, Caribe, Oceanía)
  - ⚠️ Falta Tuvalu (11,000 hab.) — no incluido en 50m (limitación del dataset, no del motor)
- [x] Capacitor iOS configurado y probado en Simulator (iPhone 16e, iOS 26.1)

### Spike: motor de renderizado del globo
- [x] Spike PMTiles vs D3.js ortográfico (ver `docs/spikes/pmtiles-vs-d3.md`)
  - PMTiles (tippecanoe) → **FALLA**: los seams son inherentes a la reproyección Mercator→esfera de MapLibre, no a `geojson-vt`
  - D3.js ortográfico + Canvas 2D → **PASA**: sin artefactos, sin tiles, rendimiento fluido
  - **Decisión**: migrar a D3.js `geoOrthographic()` sobre Canvas 2D como motor del globo

### Migración a D3.js
- [x] Adoptar `GlobeD3.tsx` como componente principal del globo (reemplazar MapLibre)
- [x] Giro de la Tierra de Oeste a Este
- [x] Implementar zoom (pinch/wheel → `projection.scale()`)
  - Zoom máximo ×200 para poder ver microestados (Vaticano, Mónaco, San Marino)
  - Bordes y sensibilidad del drag se ajustan proporcionalmente al nivel de zoom
- [x] Añadir inercia al drag (momentum al soltar)
  - Solo se activa si el usuario suelta "en movimiento" (pausa >80 ms la cancela)
  - Auto-rotación se detiene permanentemente tras la primera interacción del usuario
- [x] Limpiar código de MapLibre y PMTiles
  - Eliminados `Globe.tsx`, `GlobePMTiles.tsx`, `pmtiles-protocol.ts`, `world.pmtiles`
  - Eliminadas dependencias `maplibre-gl`, `react-map-gl`, `pmtiles` (~1.2 MB menos)
  - Rehabilitado `StrictMode` en `main.tsx` (ya no hay WebGL)
- [x] Probar en iOS Simulator vía Capacitor

### Prueba en dispositivo real (iPhone)
- [x] Probar interacción táctil del globo en dispositivo real
  - Drag, pinch zoom y selección de países funcionan correctamente en general
  - Se pueden seleccionar la mayoría de microestados (Andorra, Mónaco, San Marino) con zoom alto
  - ⚠️ Vaticano no se puede seleccionar (demasiado pequeño incluso con zoom máximo) → se necesitan marcadores

### Mejoras de interacción y visuales del globo
- [x] Corregir selección accidental de países durante pinch zoom
  - Flag `gestureWasPinchRef` suprime hover y selección mientras haya pinch activo
- [x] Permitir mover el globo mientras se hace pinch zoom
  - Rotación simultánea basada en el desplazamiento incremental del punto medio entre dedos
- [x] Eliminar la franja de luz vertical del fondo
  - Gradientes radiales `at top`/`at bottom` reemplazados por uno centrado
- [x] Añadir marcadores de microestados sobre el globo (31 países)
  - Anillos discontinuos (dashed) con fade-in gradual (zoom ×3→×5)
  - Hit testing con prioridad invertida: marcadores antes que geometría cuando son visibles
  - Radio táctil dinámico (20→30px según zoom)
  - Prop `showMarkers` para activar/desactivar (default: `true`)
- [x] Mejorar visibilidad de fronteras al hacer zoom
  - `lineWidth` mínimo subido de 0.3 a 0.5px, opacidad de 0.2 a 0.3

### Datos y estado
- [x] Tabla de mapeo ISO numeric → alpha-2 (`src/data/isoMapping.ts`, 195 entradas)
- [x] Enriquecer GeoJSON con `cca2` e `isUNMember`; migrar selección/hover/marcadores de `name` a `cca2`
- [x] Integrar REST Countries v3.1 → `public/data/countries.json` (195 países) y `public/data/capitals.json` (195 capitales con coordenadas)
  - Script de generación: `npm run fetch-data` (`scripts/fetch-countries.ts`)
  - Mapeo `region` → 5 continentes en español
- [x] Tipos centrales y loader con caché (`src/data/types.ts`, `src/data/countryData.ts`)
- [x] Zustand store para estado global multi-perfil (`src/stores/appStore.ts`)
  - Acciones: `createProfile`, `setActiveProfile`, `deleteProfile`, `updateSettings`
  - `showMarkers` del store conectado al globo en tiempo real
- [x] Definición de niveles por continente (`src/data/levels.ts`)
  - Turista: top 10 por población (top 5 en Oceanía), Mochilero: 60%, Guía: 100%

### Navegación
- [x] Implementar tab bar inferior con 3 tabs (Jugar, Explorar, Mi Pasaporte)
  - Glassmorphism + `safe-area-inset-bottom` para home indicator iOS
  - Iconos SVG inline, micro-animación `scale(1.1)` en tab activo, glow cian en "Jugar"
  - Roles ARIA (`tablist`, `tab`, `aria-selected`)
- [x] Header superior con placeholders de avatar y configuración
  - Transparente con `pointer-events: none`, solo botones interactivos
- [x] Sistema de z-index centralizado en variables CSS (`--z-stars` hasta `--z-modal`)
- [x] Overlays placeholder para tabs "Jugar" y "Mi Pasaporte" (próximamente)
  - Renderizado condicional (no opacity toggle) para evitar bug de touch en iOS WebKit
  - Efecto blur en "Pasaporte" via `backdrop-filter` en overlay (sin wrapper sobre el globo)
- [x] Tab por defecto: Explorar (globo interactivo, sin overlay)

---

## En progreso

### Experiencia: Explorar
Primera implementación funcional completada. Feedback del usuario aplicado parcialmente.
- [x] Ficha de país al tocar (bandera, nombre, capital, continente, población y ranking, superficie y ranking, moneda, gentilicio)
- [x] Marcador de capital sobre el mapa (pin cian al tocar un país)
- [x] Filtros por continente (pills horizontales con colores por continente)
- [x] Etiquetas de países/capitales (toggles "Países" y "Capitales")
- [x] Modo «Repaso de capitales» (tabla país–capital; al tocar país → zoom al país + marca en capital; al tocar capital → zoom al punto exacto + pin + país resaltado)
- [x] Segmented control ("Globo" | "Tabla") para cambiar entre modos
- [x] API imperativa del globo: `flyTo(lon, lat, zoom?, duration?)` con animación suave
- [x] Feedback — Cambios de diseño (aplicados):
  - [x] Renombrar modos: "Países" → "Globo", "Capitales" → "Tabla"
  - [x] Filtro de continente: `flyTo` al centro del continente al seleccionar
  - [x] Anti-solapamiento de etiquetas: zoom progresivo por `geoArea` + colisión de bounding boxes
  - [x] Override de centroides para países con forma irregular (FR, US, RU, etc.)
  - [x] No solapar etiqueta de país con la de su propia capital
  - [x] Circulitos permanentes de capital cuando toggle "Capitales" está activo
  - [x] Tabla: columna de población con formato adaptado ("1.4B", "45M", "800k")
  - [x] Tabla: headers ordenables (tap para alternar asc/desc)
  - [x] Tabla: vista plana cuando filtro es "Todos" (sin agrupación por continentes)
  - [x] Tabla: affordance visual (underline) en celdas tappables
  - [x] Territorios no-ONU: seleccionables con ficha + disclaimer «no reconocido por la ONU»
  - [x] Territorios no-ONU: continente asignado para que funcionen los filtros
- [x] Feedback — Bugs resueltos:
  - [x] Botón "volver a la tabla" se solapaba con filtros → reposicionado dentro del bloque de controles
  - [x] Controles demasiado abajo en pantalla → subidos bajo el header
- [x] Feedback — Diseño responsivo:
  - [x] Auditoría px → rem en toda la app (`variables.css`, `AppHeader`, `TabBar`, `ExploreView`, `ContinentFilter`, `TableView`, `CountryCard`, `AppShell`)
- [x] Feedback — Bugs pendientes (testado en iPhone):
  - [x] Filtros de continentes y selección globo/tabla no visible en modo tabla → fix de z-index (`--z-controls: 15`)
  - [x] Tabla posicionada demasiado abajo en pantalla (debería arrancar más arriba)
  - [x] Pills de filtro se salen de la pantalla → padding reducido + `justify-content: center`
  - [x] Guyana (América del Sur) se identifica como Brunei: error en mapeo de país del TopoJSON
  - [x] Antártida: definir tratamiento (no es un país, no pertenece a un continente; actualmente se resalta con cualquier filtro)
  - [x] Sáhara Occidental: capital mal ubicada, `flyTo` apunta al centro de África en vez de a El Aaiún
- [ ] Feedback adicional del usuario (pendiente de incorporar):
  - [x] Renombrar `CapitalsReview.tsx/.css` → `TableView.tsx/.css` (el nombre ya no refleja la UI "Tabla")
  - [x] Eliminar botón "volver a tabla" — redundante con el segmented control "Globo | Tabla"
  - [x] Pills de continente: "Todos" y "Oceanía" se salían por los lados. Ancho y tamaño de letra completamente relativos para que quepan todos con el mismo tamaño de letra
  - [x] Etiquetas país + capital: cuando ambas están activas y hay espacio suficiente, mostrar las dos en vez de eliminar una
    - *Intento 1*: se modificó colisión para excluir el rect del país padre (`collidesExcluding`) y se añadió separación vertical simétrica. Mejora parcial — en ciertos niveles de zoom siguen solapándose país y capital
    - *Intento 2*: tras calcular el rect de la capital, se comprueba si solapa con el rect del país padre; si solapan, se desplaza la capital justo debajo del padre (+2px gap). Resuelve el problema
  - [x] Tabla → Globo: al tocar un país o capital en la tabla, el segmented ilumina "Globo", y al volver a "Tabla" se preserva la posición exacta de scroll
    - *Intento 1*: segmented control ahora ilumina "Globo" correctamente (usa `visualMode` derivado). Se implementó `scrollIntoView` al volver, pero el comportamiento correcto es preservar el offset exacto, no hacer scroll al país seleccionado
    - *Intento 2*: en vez de desmontar `<TableView>` con renderizado condicional, se mantiene montado y se oculta con `display: none`. El DOM y el scrollTop se preservan automáticamente. Se eliminó `scrollToCca2`, `scrollRef` y `data-cca2` (limpieza del intento 1). Resuelve el problema
  - [ ] Etiqueta de Australia no se ve (país enorme); solucionar y revisar que no haya más casos similares
    - *Intento 1*: se añadió override de centroide `'AU': [134, -25]` (y otros 7 países grandes). No resolvió el problema — la causa no es el centroide. Investigar: ¿colisión con Indonesia/PNG? ¿zoom mínimo asignado por `geoArea` demasiado alto?
    - *Intento 2*: se pre-ordenaron las features por `geoArea` descendente (`sortedFeaturesRef`) para que países grandes dibujen primero y ganen la colisión de bounding boxes. Se sigue sin ver Australia (y aparece el punto con la capital, pero no su nombre). La causa no es el orden de iteración — investigar si hay colisión con otro país grande visible desde la vista de Oceanía (ej. India, China) o si el problema es diferente
  - [ ] Tabla: headers (País, Capital, Pob.) fijos (sticky) al hacer scroll, solo el contenido se desplaza. Evita solapamiento con el menú superior
    - *Intento 1*: se añadió `position: sticky; top: 0` al header. El header se pega correctamente, pero las filas de la tabla se ven por encima de los controles flotantes (menú + pills) al hacer scroll — falta clipear el contenido visible
    - *Intento 2*: se añadió `background: rgba(10,10,26,0.92)` + `backdrop-filter: blur(12px)` a `.explore-controls`. Oculta las filas pero queda mal visualmente con el globo (pierde transparencia). Revertir y buscar otra solución: clipear el scroll de la tabla para que las filas no se rendericen por encima del header, sin tocar la transparencia de los controles

---

## Próximos pasos

> Ordenados de arriba a abajo por prioridad implícita. Cada sección depende de las anteriores.

### Experiencia: Jugar
- [ ] Definir estrategia de testing para lógica de juego (Vitest o similar)
- [ ] Tipo A: Localizar país en el mapa (texto → mapa) — Sello de Países
- [ ] Tipo B: Localizar capital en el mapa (texto → mapa) — Sello de Capitales
- [ ] Feedback visual: verde/rojo según acierto
- [ ] Tipo C: Capital → País (texto → texto, opciones múltiples)
- [ ] Tipo D: País → Capital (texto → texto, opciones múltiples)
- [ ] Tipo E: Seleccionar país resaltado (mapa → texto, opciones múltiples)
- [ ] Tipo F: Seleccionar capital de país resaltado (mapa → texto, opciones múltiples)
- [ ] Algoritmo de generación de distractores (opciones plausibles: mismo continente, nombre similar, etc.)
- [ ] Algoritmo de entrenamiento libre (mezcla tipos A-F, refuerzo de fallos)
- [ ] Registro de fallos (guardar país/capital fallado, reforzar, actualizar al acertar)
- [ ] Barra de progreso (indica preparación para prueba de sello)
- [ ] Sistema de pruebas de sello (invitación automática, 0 errores, límite 3 intentos diarios)

### Experiencia: Mi Pasaporte
- [ ] Vista de matriz niveles × continentes (3 filas × 5 columnas)
- [ ] Sistema de sellos (Países y Capitales) con estado conseguido/pendiente
- [ ] Acceso directo a pruebas de sello desde el dashboard
- [ ] Indicador de intentos restantes (3 diarios por sello y continente)
- [ ] Color del pasaporte según nivel global (verde/azul/dorado)

### Perfiles de usuario
- [ ] Pantalla de creación de perfil (nombre por defecto «Explorador» + numeración automática)
- [ ] Selector de avatares (12-15 iconos de animales representativos de los 5 continentes: tierra, mar y aire)
- [ ] Selector de perfil (cambio rápido desde cualquier pantalla, tap en avatar)
- [ ] Progreso independiente por perfil (pasaporte, sellos, fallos)

### Configuración
- [ ] Pantalla de configuración global (perfil activo, marcadores de microestados, vibración, idioma, tema)
- [ ] Configuración del globo en overlay (marcadores de microestados, tema)

### Internacionalización
- [ ] Elegir librería de i18n (i18next, react-intl u otra)
- [ ] Externalizar textos de la app a archivos de traducción
- [ ] Traducción a idiomas disponibles en iOS y Android

### Layout y UI general
- [ ] Iconos de perfil y configuración del header demasiado arriba en pantalla: bajar mínimamente respecto al safe area

### Infraestructura y acabados
- [ ] Implementar feedback háptico (vibración en aciertos/errores)
- [ ] Añadir Capacitor para build Android
- [ ] Actualización silenciosa de datos vía CDN (ver DESIGN.md § «Actualización automática»)

### Tema visual
- [ ] Diseñar e implementar tema claro (light mode) como alternativa al dark mode (baja prioridad, casi al final del desarrollo)
