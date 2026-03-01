# Backlog de GeoExpert

> Historial de desarrollo más reciente y próximos pasos. Para el historial completo, consultar git.

---

## Completado

### Globo y motor de renderizado
- [x] Proyecto React + Vite + Capacitor iOS. Spike PMTiles vs D3.js → D3.js `geoOrthographic()` sobre Canvas 2D (ver `docs/spikes/pmtiles-vs-d3.md`)
- [x] Zoom ×200, inercia al drag, pinch+drag simultáneo, marcadores de microestados (31 países, dashed, fade-in), fronteras escalables
- [x] Dirty flag en loop de renderizado para reducir calentamiento y consumo de batería

### Datos, i18n y estado
- [x] REST Countries v3.1 + `world-atlas` 50m + capitales JSON. Mapeo ISO numeric→alpha-2 (195 países). Zustand store multi-perfil
- [x] Datos en español: nombres, capitales, gentilicios, monedas, idiomas (suplementario `capitals-es.json`). IDH/IDH-D (UNDP 2023/2024)
- [x] Antártida (ficha especial, Tratado Antártico), territorios no-ONU (ficha + disclaimer, etiquetas ámbar)
- [x] Script Wikipedia (`fetch-wikipedia.ts`): Wikidata SPARQL → slugs validados (257 entradas, cobertura 100%)

### Navegación y Explorar
- [x] Tab bar (Jugar/Explorar/Pasaporte), header, z-index centralizado. Tab por defecto: Explorar
- [x] Ficha de país completa (bandera, capital, población, superficie, densidad, moneda, gentilicio, idiomas, IDH, IDH-D, Wikipedia — todos con ranking)
- [x] Globo: etiquetas anti-solapamiento (`measureText`, prioridad por población), filtros por continente, `flyTo` con offset dinámico
- [x] Tabla: headers sticky/ordenables, affordance tappable, toggle no-ONU, segmented control Globo|Tabla
- [x] Auditoría diseño responsivo (px → rem)

### Experiencia: Jugar
- [x] Arquitectura: event bridge en App.tsx, generación de preguntas (Fisher-Yates), `useGameSession`, `LevelSelector`, `QuestionBanner`, `GameFeedback`, `ScoreBar`, `ChoicePanel`
- [x] 6 tipos de juego (A-F): A/B (texto→mapa), C/D (texto→texto), E/F (mapa→texto). Distractores por nivel/continente, modo mixto
- [x] Feedback visual: colores verde/rojo/dorado, etiquetas sobre el globo (A/B error en 2 pasos), overlays sin iconos
- [x] Zoom adaptativo C-F (centroide, ×40 microestados, marcadores ocultos en C-F, fallback para microestados sin geoArea)
- [x] Pines de capitales (B/C: todas del continente, D: tras responder, F: país objetivo)

---

## Próximos pasos

> Ordenados de arriba a abajo por prioridad implícita. Cada sección depende de las anteriores.

### Experiencia: Jugar — Pendiente
- [x] Bug: países no-ONU (por ejemplo Åland, Chipre del Norte) aparecen en preguntas de juego. Filtrar para que solo participen los 195 países ONU
- [x] FlyTo con perspectiva continental entre preguntas. Refuerza el aprendizaje espacial. Comportamiento distinto según tipo:
  - **E/F**: ya funcionan bien, no hacer cambios
  - **C/D**: las preguntas se hacen con perspectiva continental (zoom out), tras la respuesta del usuario zoom in a la zona del globo - se mantiene el enfoque que hay ahora (países más grandes menos zoom in necesario, países más pequeños más zoom in necesario)
- [x] Vaticano: permitir mayor zoom-in en E/F — con el máximo actual (×25) no se distingue nada. Es el único caso (0.44 km²; Mónaco, el siguiente más pequeño con 2 km², ya se ve bien).
- [ ] Registro de fallos (guardar país/capital fallado, reforzar, actualizar al acertar)
- [ ] Barra de progreso (indica preparación para prueba de sello)
- [ ] Selector de tipo de juego: decidir diseño final y comportamiento (ver DESIGN.md § «Selector de tipo de juego»). Actualmente es un prototipo con pills
- [ ] Sistema de pruebas de sello (invitación automática, 0 errores, sin límite de intentos)

### Experiencia: Mi Pasaporte
- [ ] Vista de matriz niveles × continentes (3 filas × 5 columnas)
- [ ] Sistema de sellos (Países y Capitales) con estado conseguido/pendiente
- [ ] Acceso directo a pruebas de sello desde el dashboard
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
  - ⚠️ Los datos sintéticos en `countryData.ts` (SOL, CYN, AQ) tienen nombres hardcodeados en español. Integrar en el sistema de traducción
- [ ] Generar datos multi-idioma (ampliar script para todos los idiomas soportados)
- [ ] Traducción a idiomas disponibles en iOS y Android

### Testing
- [ ] Definir estrategia de testing para lógica de juego (Vitest o similar)

### Infraestructura y acabados
- [ ] Implementar feedback háptico (vibración en aciertos/errores)
- [ ] Añadir Capacitor para build Android
- [ ] Actualización silenciosa de datos vía CDN (ver DESIGN.md § «Actualización automática»)
- [ ] Sección "Acerca de" en la app: explicar los criterios utilizados (países ONU, idiomas oficiales nacionales, fuentes de datos UNDP, REST Countries, etc.). Implementar cuando la app esté en fase de acabados
- [ ] Solicitud de valoración no intrusiva (in-app review): `SKStoreReviewController` (iOS) + Play In-App Review (Android). Mostrar tras experiencia positiva y uso mínimo (ver DESIGN.md § «Solicitud de valoración»)

### Tema visual
- [ ] Diseñar e implementar tema claro (light mode) como alternativa al dark mode (baja prioridad, casi al final del desarrollo)
