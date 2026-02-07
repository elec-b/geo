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

---

## En progreso

### Globo base
- [ ] Quitar artefactos visuales (bandas/seams en tile boundaries) de la capa fill en globe projection
  - **Causa raíz (posible, pero no ultra-confirmada)**: `geojson-vt` corta polígonos en tile boundaries y al reproyectarlos en la esfera aparecen bandas visibles. Es un issue abierto en MapLibre (#5084, #4367) sin fix.
  - **Ya probado sin éxito**: fill-antialias:false, buffer:512, fill-opacity:1, topojson.mesh(), quitar setSky(), fill-extrusion con height:0, maxzoom:2
  - **maxzoom:0 elimina las bandas** pero distorsiona los polos (Antártida rota)
  - **Pista**: explorar https://maplibre.org — hay buenos mapas que no tienen este problema. Posiblemente usan vector tiles nativos o un approach diferente al GeoJSON source
  - **Refactor ya hecho**: bordes separados con `topojson.mesh()` en `countries.ts` y `Globe.tsx` (vale la pena conservar independientemente)
- [ ] Permitir rotación vertical completa (actualmente se bloquea al llegar a los polos) — (probablemente) añadir `maxPitch={85}` al componente Map

---

## Próximos pasos

### Globo base
- [ ] Eliminar luz en la parte superior izquierda del globo (representa la luz del sol tocando el planeta, pero no nos interesa para nuestra app)

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
