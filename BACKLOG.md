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
- [x] Flujo completo (continente → nivel → tipo), modo Aventura, selector de tipo con nombres definitivos (A-F)
- [x] FlyTo entre preguntas con perspectiva continental (C/D: zoom-out → zoom-in al responder; Vaticano: zoom ×200)
- [x] Filtrado de países no-ONU del juego; fix `npm run device`
- [x] Algoritmo de aprendizaje v2: racha negativa, etapas (reconocimiento/capitales/sello), regresión en cascada, avance colectivo (40%/80%), inferencia ascendente, cola de prioridad, anti-repetición, perfil por defecto auto-creado
- [x] Vista de estadísticas provisional: icono en header, tabla de dominio por tipo (A-F), selector nivel×continente, reset con confirmación
- [x] LevelSelector sin paso intermedio: todo el formulario visible desde el inicio (continente + nivel + tipo + Empezar)
- [x] ChoicePanel 2×2: grid de 2 columnas para tipos C-F, más espacio vertical para el globo
- [x] Archipiélagos antimeridiano: normalización de coordenadas para hulls de países que cruzan la línea de fecha (Fiji, Tonga…)
- [x] Zoom out automático en tipos A/B cuando el objetivo no es visible (flyTo continental)
- [x] ChoicePanel 2×2: offset corregido (3.5rem → 5.5rem) para evitar solapamiento con ProgressBar
- [x] Kiribati añadido a `ARCHIPELAGO_CODES` — convex hull con normalización antimeridiano
- [x] `isPointVisible` corregido: ángulo visible dependiente del zoom (`arcsin(1/zoom) * 0.8`) en vez de umbral fijo
- [x] Zoom E/F reducido (×0.6) para mostrar vecinos en archipiélagos extensos (Islas Salomón, etc.)
- [x] Zoom E/F: floor 2.0 para que países grandes (Australia, Rusia, Brasil) no queden diminutos con el ×0.6
- [x] Centroide Oceanía [155°E→148°E] + zoom continental [2.5→2.0] para que Australia no quede cortada en A/B
- [x] `isPointVisible` margen 80% en móvil vertical: resuelto con centroide y zoom continental ajustados

---

## Próximos pasos

> Ordenados de arriba a abajo por prioridad implícita. Cada sección depende de las anteriores.

### Experiencia: Jugar — Refinamientos pendientes
- [x] Sistema de pruebas de sello (0 errores, invitación desde Jugar + acceso desde Pasaporte, sin límite de intentos)
- [ ] Texto del modal de prueba de sello: adaptar según tipo (países/capitales), claro para niños y adultos

### Experiencia: Pasaporte
- [x] Renombrar «Mi Pasaporte» → «Pasaporte» en el código (tab bar, AppShell, types)
- [x] Vista de matriz niveles × continentes (5 filas continentes × 3 columnas niveles)
- [x] Sistema de sellos (Países y Capitales) con estado conseguido/pendiente
- [x] Acceso directo a pruebas de sello desde el dashboard
- [x] Color del pasaporte según nivel global (verde/azul/dorado)
- [ ] Fondo opaco en PassportView: el globo detrás interfiere con la legibilidad del dashboard

### Perfiles de usuario
- [ ] Pantalla de creación de perfil (nombre por defecto «Explorador» + numeración automática)
- [ ] Selector de avatares (12-15 iconos de animales representativos de los 5 continentes: tierra, mar y aire)
- [ ] Selector de perfil (cambio rápido desde cualquier pantalla, tap en avatar)
- [ ] Progreso independiente por perfil (pasaporte, sellos, fallos)

### Configuración
- [ ] Pantalla de configuración global (perfil activo, marcadores de microestados, vibración, idioma, tema)
- [ ] Configuración del globo en overlay (marcadores de microestados, tema)

### Refinamientos tras la primera vuelta completa a la app
- [ ] Cuando el usuario pulsa en jugar, debe 1) elegir continente, 2) elegir nivel, 3) elegir tipo de juego. Debemos pre-seleccionar 1) 2) y 3):
  - para 1) continente en el que está el móvil (iphone/android) (sin saltarnos políticas de privacidad, no queremos leer nada de info confidencial)
  - para 2) el máximo nivel al que pueda jugar el usuario para un continente dado
  - para 3) aventura (aunque haremos mejoras en cómo se debe mostrar la selección de tipo de juego)
- [ ] Cuando se juega en Europa, y una pregunta nos pregunta por la capital de Italia, es fácil que, si el usuario intenta pulsar sobre Roma, se seleccione Ciudad del Vaticano... Se me ocurre que para que no haya problemas con Italia/Roma y Vaticano/Ciudad del Vaticano, cuando se pregunte por uno de estos dos, solo se pueda seleccionar el correcto cuando el usuario pulsa sobre Roma (no cuando pulsa sobre otra área de Italia). Esto es solo una propuesta, puede que haya una solución mejor.
- tabla de estadísticas: hay que merjorarla - el usuario no sabrá a qué nos referimos con las letras A, B, etc.
- en Jugar, hacer que la progress bar avance desde el inicio, para dar sensación de progreso al usuario - no solo debe avanzar inidicando que x de y países están listos para sello.


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

