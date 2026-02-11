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

---

## En progreso

*(Sin tareas en progreso)*

---

## Próximos pasos

### Globo base (post-migración D3)
- [ ] Corregir selección accidental de países durante pinch zoom (al hacer zoom con dos dedos, algunos países se marcan en gris como si estuvieran seleccionados)
- [ ] Permitir mover el globo mientras se hace pinch zoom (actualmente el pinch solo hace zoom, sin rotar simultáneamente)
- [ ] Eliminar la franja de luz vertical del fondo (la línea que atraviesa la pantalla detrás del globo de arriba a abajo)
- [ ] Añadir marcadores sobre el globo para facilitar la selección de microestados (Andorra, Mónaco, Vaticano…). El usuario podrá activar/desactivar los marcadores en la configuración
- [ ] Ajustar tema visual del globo D3 (atmósfera, colores finales)
- [ ] Optimizar hit testing si hay lag en dispositivos lentos

### Datos de países
- [ ] Integrar REST Countries v3.1 (nombres, banderas, capitales)
- [ ] Crear `capitals.json` con coordenadas de 195 capitales
- [ ] Mapear IDs de Natural Earth a códigos ISO (cca2)

### Experiencia: Explorar
- [ ] Ficha de país al tocar (nombre, bandera, capital, población, superficie)
- [ ] Filtros por continente
- [ ] Marcador de capital sobre el mapa

### Experiencia: Jugar
- [ ] Tipo A: Localizar país en el mapa (texto → mapa)
- [ ] Tipo B: Localizar capital en el mapa (texto → mapa)
- [ ] Feedback visual: verde/rojo según acierto
- [ ] Barra de progreso

### Experiencia: Mi Pasaporte
- [ ] Vista de matriz niveles × continentes
- [ ] Sistema de sellos (Países y Capitales)

### Perfiles de usuario
- [ ] Pantalla de creación de perfil (nombre + avatar)
- [ ] Selector de perfil (cambio rápido desde cualquier pantalla)
- [ ] Persistencia de perfiles (Capacitor Preferences o SQLite)
- [ ] Progreso independiente por perfil (pasaporte, sellos, fallos)

### Infraestructura
- [ ] Configurar Zustand para estado global
- [ ] Añadir Capacitor para build Android
- [ ] Actualización silenciosa de datos vía CDN (ver OVERVIEW.md § «Actualización automática»)
- [ ] Implementar feedback háptico (vibración en aciertos/errores)

### Internacionalización
- [ ] Elegir librería de i18n (i18next, react-intl u otra)
- [ ] Externalizar textos de la app a archivos de traducción
- [ ] Traducción a idiomas disponibles en iOS y Android

### Tema visual
- [ ] Diseñar e implementar tema claro (light mode) como alternativa al dark mode (baja prioridad, casi al final del desarrollo)
