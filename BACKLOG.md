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

### Experiencia: Explorar
- [x] Ficha de país al tocar (bandera, nombre completo, capital, continente, población, superficie, densidad — todos con ranking — moneda, gentilicio)
- [x] Marcador de capital (pin cian al tocar un país; circulitos permanentes con toggle "Capitales")
- [x] Filtros por continente (pills horizontales, `flyTo` al centro del continente)
- [x] Etiquetas de países/capitales (toggles independientes, anti-solapamiento por `geoArea` + colisión de bounding boxes, centroides con override para 23 países irregulares, etiqueta de país no solapa con su propia capital)
- [x] Tabla de países (headers sticky y ordenables, población formateada, affordance visual en celdas tappables, vista plana con filtro "Todos", toggle no-ONU con color ámbar)
- [x] Segmented control "Globo | Tabla" (preserva scroll al volver a tabla, toggles de etiquetas visibles al venir de tabla)
- [x] API imperativa `flyTo(lon, lat, zoom?, duration?)` con animación suave, camino más corto (`wrapLon`)
- [x] Territorios no-ONU: seleccionables con ficha + disclaimer, continente asignado, etiquetas en color ámbar
- [x] Ficha de Somalilandia y Chipre del Norte (datos sintéticos en `countryData.ts`)
- [x] Posición inicial aleatoria del globo (longitud aleatoria, latitud fija en 0)
- [x] Bugs resueltos: z-index tabla, pills responsive, Guyana/Brunei, Antártida, Sáhara Occidental, Grenada, Australia duplicada en TopoJSON
- [x] Auditoría diseño responsivo: px → rem en toda la app
- [x] `flyTo` offset dinámico: `latOffset` se divide por el zoom objetivo (`targetScale`) dentro de `flyTo()`. A zoom 5× el offset pasa de 15° a ~3°; a zoom 20× baja a ~0.75°. Resuelve desplazamiento excesivo en microestados y territorios no-ONU
- [x] Etiquetas: `ctx.measureText()` reemplaza estimación `fontSize * length * 0.55` para bounding boxes precisas; capitales que colisionan entre sí se apilan verticalmente (+2px gap) en vez de descartarse (Roma + Ciudad del Vaticano coexisten)

---

## Próximos pasos

> Ordenados de arriba a abajo por prioridad implícita. Cada sección depende de las anteriores.

### Datos en español
- [ ] Crear archivo `scripts/data/capitals-es.json` con traducciones de capitales al español (las que difieren del inglés: Londres, Roma, Pekín, etc.)
- [ ] Modificar `fetch-countries.ts`: usar `translations.spa.common` para países, archivo suplementario para capitales, `demonyms.spa.m` para gentilicios. Sin fallback a inglés — reportar error si falta traducción
- [ ] Regenerar `countries.json` y `capitals.json` con datos en español
- [ ] Etiquetas del globo en español: nueva prop `countryNames` en GlobeD3 (capitales salen del JSON regenerado automáticamente)
- [ ] Verificar ordenamiento de tabla con locale español (ñ, tildes)

### Explorar: Antártida
- [ ] Reconocer Antártida (ID `010`) en el GeoJSON → `cca2: 'AQ'` (ver DESIGN.md § «Antártida»)
- [ ] Datos sintéticos: nombre, superficie (~14M km²), sin capital/población/moneda
- [ ] Ficha especial: superficie + texto informativo del Tratado Antártico (1959)
- [ ] Etiqueta ámbar en el globo (aparece automáticamente via sistema existente)
- [ ] Excluir de la tabla (no es un país)

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

### Internacionalización (UI completa)
- [ ] Elegir librería de i18n (i18next, react-intl u otra)
- [ ] Externalizar textos de la app a archivos de traducción
  - ⚠️ Los datos sintéticos en `countryData.ts` (SOL, CYN, y AQ cuando se implemente) tienen nombres hardcodeados en español. Integrar en el sistema de traducción
- [ ] Generar datos multi-idioma (ampliar script para todos los idiomas soportados)
- [ ] Traducción a idiomas disponibles en iOS y Android

### Layout y UI general
- [ ] Iconos de perfil y configuración del header demasiado arriba en pantalla: bajar mínimamente respecto al safe area

### Infraestructura y acabados
- [ ] Implementar feedback háptico (vibración en aciertos/errores)
- [ ] Añadir Capacitor para build Android
- [ ] Actualización silenciosa de datos vía CDN (ver DESIGN.md § «Actualización automática»)

### Tema visual
- [ ] Diseñar e implementar tema claro (light mode) como alternativa al dark mode (baja prioridad, casi al final del desarrollo)
