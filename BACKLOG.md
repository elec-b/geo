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

### Perfiles de usuario
- [x] Pantalla de creación de perfil (nombre por defecto «Explorador» + numeración automática)
- [x] Selector de avatares (iconos de animales representativos de los 5 continentes)
- [x] Selector de perfil (cambio rápido desde cualquier pantalla, tap en avatar)
- [x] Progreso independiente por perfil (pasaporte, sellos, fallos)

### Configuración y háptica
- [x] Bottom sheet desde el engranaje del header (vibración, idioma, tema, marcadores de microestados — este último solo visible en Explorar)
- [x] Feedback háptico (acierto/fallo en juego, toggles en configuración) con `@capacitor/haptics`

---

## Próximos pasos

> Ordenados de arriba a abajo por prioridad implícita. Cada sección depende de las anteriores.

### Refinamientos tras la primera vuelta completa a la app
Esta sección contiene notas rápidas -> habrá que reordenar en el backlog cuando queramos llevar a cabo estos refinamientos.

#### Jugar
- Cuando el usuario pulsa en Jugar, debe 1) elegir continente, 2) elegir nivel, 3) elegir tipo de juego. Debemos pre-seleccionar 1) 2) y 3):
  - para 1) continente en el que está el móvil (iphone/android) (sin saltarnos políticas de privacidad, no queremos leer nada de info confidencial)
  - para 2) el máximo nivel al que pueda jugar el usuario para un continente dado
    - si el usuario hace click en un nivel en el que todavía no puede jugar (e.g. es turista en África y hace click en mochilero), se le debe mostrar un mensaje indicando que debe superar las pruebas de sello que corresponda / del nivel anterior para poder jugar en ese nivel.
  - para 3) aventura (aunque haremos mejoras en cómo se debe mostrar la selección de tipo de juego)
- Re-pensar bien la lógica de juego cuando se progresa de nivel:
  - Si el usuario tiene los sellos de turista, cuando juega en mochilero:
    - su tabla de estadísticas debería empezar con todos los países en turista con tick an A y B (esto cambia, si en la prueba de sello comete un error en A o en B)
    - los países de nivel turista no deben contar para (según design.md) "Al menos el **40%** de los países (mínimo 3) tienen ≥ 1 acierto en la etapa actual" pero creo que sí para "y la precisión global de la sesión es **≥ 80%**."
  - (la misma lógica aplica cuando se pasa de mochilero a guía)
  - pensemos bien esto y anotémoslo en design.md, después las tareas a acometer se deben reflejar bien en este backlog
- Cuando se juega en Europa, y una pregunta nos pregunta por la capital de Italia, es fácil que, si el usuario intenta pulsar sobre Roma, se seleccione Ciudad del Vaticano... Se me ocurre que para que no haya problemas con Italia/Roma y Vaticano/Ciudad del Vaticano, cuando se pregunte por uno de estos dos, solo se pueda seleccionar el correcto cuando el usuario pulsa sobre Roma (no cuando pulsa sobre otra área de Italia). Esto es solo una propuesta, puede que haya una solución mejor.
- Hacer que la barra de progreso avance desde el inicio, para dar sensación de progreso al usuario - no solo debe avanzar en el momento en que empezamos a marcar x de y países están listos para sello. Pensar juntos propuesta y anotar escribir en design.md
- Oceanía
  - verificar Micronesia, qué se le muestra al usuario en los juegos C a F? Tiene suficiente perspectiva

### Explorar
- (También aplica para jugar) Groenlandia es territorio de Dinamarca (la ONU así lo reconoce). Investigar por qué no está esto reflejado así en nuestra app y tomar una decisión.

#### Estadísticas
- Cuando el usuario va a estadísticas, lo que debe ver por defecto nada más pulsar el botón es:
  - último país y nivel en el que ha jugado o ha hecho prueba de sello (lo último que haya ocurrido)
  - fallback: si nunca ha jugado o ha hecho prueba de sello -> continente al que pertenece el móvil según su configuración y nivel guía
- Al resetear estadísticas, no se ven borradas instantáneamente. Tuve que ir a otro continente-nivel y volver al que estaba para verlas borradas
- Tabla de estadísticas: hay que merjorarla - el usuario no sabrá a qué nos referimos con las letras A, B, etc.

#### Pasaporte
- mejorar la estética del pasaporte: el grid está bien hecho, pero debe dar la sensación de que es un "pasaporte en una página". Pensar bien qué aspecto tiene que tener antes de hacerlo.

#### Feedback háptico
- funciona bien, pero quizás podemos hacer más cortas/sutiles las vibraciones.


### Internacionalización (UI completa)
- [ ] Elegir librería de i18n (i18next, react-intl u otra)
- [ ] Externalizar textos de la app a archivos de traducción
  - ⚠️ Los datos sintéticos en `countryData.ts` (SOL, CYN, AQ) tienen nombres hardcodeados en español. Integrar en el sistema de traducción
- [ ] Generar datos multi-idioma (ampliar script para todos los idiomas soportados)
- [ ] Traducción a idiomas disponibles en iOS y Android

### Testing
- [ ] Definir estrategia de testing para lógica de juego (Vitest o similar)

### Infraestructura y acabados
- [ ] Añadir Capacitor para build Android
- [ ] Actualización silenciosa de datos vía CDN (ver DESIGN.md § «Actualización automática»)
- [ ] Sección "Acerca de" en la app: explicar los criterios utilizados (países ONU, idiomas oficiales nacionales, fuentes de datos UNDP, REST Countries, etc.). Implementar cuando la app esté en fase de acabados
- [ ] Solicitud de valoración no intrusiva (in-app review): `SKStoreReviewController` (iOS) + Play In-App Review (Android). Mostrar tras experiencia positiva y uso mínimo (ver DESIGN.md § «Solicitud de valoración»)

### Tema visual
- [ ] Diseñar e implementar tema claro (light mode) como alternativa al dark mode (baja prioridad, casi al final del desarrollo)

### Otros
- [ ] Poner un handle los paneles inferiores de configuración y en el de explorar cuando se pulsa sobre un país. Implementar drag-to-dismiss, para que el usuario haga scroll-down y se cierre

