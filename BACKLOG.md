# Backlog de GeoExpert

> Historial de desarrollo más reciente y próximos pasos. Para el historial completo, consultar git.

---

## Completado

### Globo y motor de renderizado
- [x] Proyecto React + Vite + Capacitor iOS. D3.js `geoOrthographic()` sobre Canvas 2D
- [x] Zoom ×200, inercia, pinch+drag, marcadores de microestados, fronteras escalables, dirty flag

### Datos, i18n y estado
- [x] REST Countries + `world-atlas` 50m + capitales JSON (195 países). Zustand store multi-perfil
- [x] Datos en español completos (capitales, gentilicios, monedas, idiomas, IDH/IDH-D, Wikipedia slugs)
- [x] Antártida (ficha especial) y territorios no-ONU (ficha + disclaimer, etiquetas ámbar)

### Navegación y Explorar
- [x] Tab bar, header, z-index centralizado. Ficha de país completa con todos los campos y rankings
- [x] Globo: etiquetas anti-solapamiento, filtros por continente, flyTo con offset dinámico
- [x] Tabla: headers sticky/ordenables, toggle no-ONU, segmented control Globo|Tabla
- [x] Auditoría diseño responsivo (px → rem)

### Experiencia: Jugar
- [x] 6 tipos de juego (A-F) con feedback visual, zoom adaptativo, pines de capitales, flyTo entre preguntas
- [x] Flujo completo (continente → nivel → tipo), modo Aventura, LevelSelector sin paso intermedio
- [x] Algoritmo de aprendizaje v2: rachas, etapas, regresión, avance colectivo, inferencia, anti-repetición
- [x] Vista de estadísticas provisional (tabla de dominio por tipo, selector nivel×continente, reset)
- [x] Archipiélagos antimeridiano (Fiji, Tonga, Kiribati), zoom out A/B automático
- [x] Zoom E/F: ×0.6 + floor 2.0, centroide Oceanía ajustado, `isPointVisible` dependiente del zoom
- [x] Sistema de pruebas de sello (0 errores, invitación desde Jugar + acceso desde Pasaporte)
- [x] Texto del modal de sello adaptado según tipo (países/capitales)

### Experiencia: Pasaporte
- [x] Matriz niveles × continentes con sellos (Países/Capitales), acceso directo a pruebas
- [x] Color del pasaporte según nivel global (verde/azul/dorado)
- [x] Fondo opaco para legibilidad del dashboard

---

## Próximos pasos

> Ordenados de arriba a abajo por prioridad implícita. Cada sección depende de las anteriores.

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

