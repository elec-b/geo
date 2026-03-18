# Backlog de GeoExpert

> Historial de desarrollo más reciente y próximos pasos. Para el historial completo, consultar git.

---

## Completado

- [x] **Motor de renderizado**: D3.js ortográfico + Canvas 2D. Zoom ×200, inercia, pinch+drag, marcadores de microestados, dirty flag
- [x] **Datos**: 195 países ONU + territorios no-ONU + Antártida. Datos en español completos (capitales, gentilicios, monedas, idiomas, IDH/IDH-D, Wikipedia). Override 1:10m para 8 islas del Pacífico
- [x] **Explorar**: Globo interactivo (etiquetas anti-solapamiento, filtros continente, flyTo) + Tabla (sticky headers, ordenable, toggle no-ONU). Ficha de país completa. Diseño responsivo (rem)
- [x] **Jugar**: 6 tipos (E/C/D/F/A/B), modo Aventura + tipo concreto. Algoritmo v3 (rachas, etapas, regresión, avance colectivo, inferencia, herencia entre niveles, anti-repetición). Barra de progreso ponderada. Pruebas de sello (0 errores). Zoom inteligente E/F y A/B (extensión angular, convex hull, centroides Oceanía ajustados)
- [x] **Pasaporte**: Rediseño visual premium — sellos circulares CSS (★ ganado, borde simple país / doble capital, coloreados por continente con rotación aleatoria), contenedor guilloché, animación stampDrop, cabecera "Pasaporte de <nombre>", leyenda simplificada. Eliminados colores por nivel. Modal de sello conseguido unificado con nuevo estilo. Selector "Superado ★" sin color
- [x] **Perfiles**: Multi-perfil con avatares, cambio rápido, progreso independiente, limpieza de sesión al cambiar perfil (termina juego/sello en curso, reinicia globo, navega a Explorar)
- [x] **Configuración**: Bottom sheet (vibración, idioma, tema, marcadores). Feedback háptico
- [x] **UX Jugar**: Pre-selección continente/nivel, botón Continuar, niveles superados con ★, modales de fin de sesión con invitación a sello, selector sin paso intermedio, orden y colores olímpicos en pills de continente, tipo/modo ya completado (modal pre-sesión + ✓ en pills + correcciones en modales de fin), ocultar pines de capitales no-ONU en Jugar y pruebas de sello, hulls de archipiélagos siempre visibles (selectivos por continente, buffer proporcional, zoom adaptativo), fix flyTo antimeridiano (Samoa/Tonga), fix hit testing no-ONU (prioridad geometría sobre territorios no-ONU), colores olímpicos unificados en selectores de Explorar/Pasaporte, circulitos de capitales no-ONU en ámbar
- [x] **Estadísticas**: Eliminado estado "en progreso" (✗ para racha ≤ 0), quitados contadores aciertos/fallos, toggle ✓/%, desacoplamiento datos sello/jugar (`stampAttempts` independiente), nueva pestaña "Pruebas de sello" con indicadores ✓/✗, defaults inteligentes según origen (Jugar→lastPlayed, Pasaporte/sello→lastStampPlayed), icono de refuerzo ▼→✗ (convención tick/cross)
- [x] **Datos**: Corregidas coordenadas de capitales incorrectas de REST Countries API: El Aaiún (lat/lng invertidos), Dakar (imprecisión costera). Añadidos CAPITAL_OVERRIDES en fetch-countries.ts
- [x] **Pasaporte**: Tab bar ilumina "Pasaporte" durante pruebas de sello (desde cualquier origen), navegación limpia al cambiar de tab durante sello, ocultado texto "Sin nivel global"
- [x] **Estadísticas**: Código de colores para porcentajes (rojo <50%, ámbar 50-79%, verde ≥80%) en ambas pestañas. Fix toggle ✓/▼→✓/✗
- [x] **Jugar**: Fix modales de sello — filtrar sellos ya ganados + acceso directo (sin modal) cuando solo falta 1 sello. Adaptar título/texto del modal pool exhausted Aventura cuando ambos sellos están ganados
- [x] **UX Jugar**: Filtros de feedback verde/rojo suavizados (opacidad 15% → 5%) en todos los tipos de juego y pruebas de sello
- [x] **Explorar**: Pin de capital de territorios no-ONU en ámbar (antes aparecía en cian como los ONU)
- [x] **UX Jugar**: Feedback háptico más sutil — acierto: tap ligero único; error: doble tap ligero; toggles: sin cambios
- [x] **Pasaporte**: Animación de estrella giratoria al conseguir sello — efecto "trompo" (10 vueltas en 3s con ease-out)
- [x] **UX general**: Bottom sheets (configuración y ficha de país) — handle visual + drag-to-dismiss + animación de cierre suave. Eliminados botones X
- [x] **Jugar**: Fix bug herencia entre niveles — barra de progreso llegaba a 100% sin mostrar modal de sello. Causa: herencia A/B sintética desalineaba progreso con pool. Solución: heredar E/CDF en vez de A/B (A y B se juegan siempre). Simplificación del algoritmo (~35 líneas eliminadas). Fix defensivo en session.start() para pool vacío al iniciar.
- [x] **UX Jugar**: Mensajes motivadores en prueba de sello no superada — título y texto dinámicos según rendimiento (4 franjas: ≥90% "¡Muy cerca!", 70-89% "¡Buen intento!", 50-69% "Vas por buen camino", <50% "No te rindas")
- [x] **UX Jugar**: Fix sincronización barra de progreso y contadores en Pruebas de Sello — ahora se mueven a la vez. Bonus: la barra llega a 100% en la última pregunta (antes nunca lo hacía)
- [x] **Jugar**: Fix posicionamiento del globo fuera de continente — race condition entre flyTo continental y efecto A/B que evaluaba isPointVisible() durante la animación. Solución: diferir evaluación A/B hasta que flyTo termine (isAnimating + delay). También: usar getVisualCenter() (hull center) en vez de getCentroid() para archipiélagos en tipo A, y añadir CENTROID_OVERRIDE para Papúa Nueva Guinea
- [x] **Jugar**: Fix herencia E/CDF no se aplicaba cuando solo había datos de sello (sin partidas regulares). Causa: `getAttemptsWithInheritance` verificaba A/B per-country en `attempts`, pero las pruebas de sello escriben en `stampAttempts`. Solución: si ambos sellos del nivel anterior están ganados, heredar E/CDF para todos los países del nivel (los sellos ya son prueba de dominio A/B). Eliminada recursión innecesaria.
- [x] **UX Jugar**: Margen de tolerancia adaptativo en hit testing para tipos A/B y Pruebas de Sello. Spike: `docs/spikes/hit-testing-archipielagos.md`. Taps "casi sobre el país" ahora se aceptan si están cerca del target (geoDistance < 0.05/zoom rad). Dos casos: tap en océano cerca del target, y tap en vecino cuando estás más cerca del target. AS-WS añadido a MICROSTATE_PAIRS. No afecta a Explorar.
- [x] **Nomenclatura y selector**: Nueva nomenclatura visual para tipos de juego basada en ◯ (país) y ◎ (capital). Iconos en headers de stats (◯?, ◯→◎, ◎→◯, ◎?, ◯, ◎), nombres descriptivos en selector y modales. Selector rediseñado: Aventura destacada (botón 🧭 ancho completo) + toggle colapsable «Elegir tipo concreto» con grid 2×3. Columnas de stats con ancho uniforme. Spike: `docs/spikes/nomenclatura-tipos-juego.md`
- [x] **Explorar**: Link de Wikipedia movido del pie del bottom sheet al header — icono redondo con el puzzle globe oficial de Wikipedia (apple-touch-icon externo, auto-actualizable, cacheado por WKWebView)
- [x] **Explorar**: Clasificación de territorios no-ONU — disclaimer contextual en ficha de país: "Territorio de [País]" (33 dependientes) o "Soberanía en disputa" (TW, XK, EH, FK). Mapa constante `SOVEREIGN_LABELS` con preposiciones en español. Spike: `docs/spikes/clasificacion-territorios.md`

---

## Próximos pasos

> Ordenados por prioridad. Las áreas se listan de mayor a menor urgencia.

### Explorar
- [ ] BUG: no puedo hacer scroll-down para cerrar la ficha de país de Singapur. Para otros países funciona bien. Investigar por qué es y si afecta a otros países. Solucionar después

### UX general
- [ ] Si dejo pulsado el teléfono sobre un punto de la pantalla, el teléfono selecciona algunas cosas (no parece texto, pero quizás lo interprete como texto?) y me da las opciones de "copy, look-up, etc." típicas. Queda mal, creo que deberíamos evitar que se pueda seleccionar
- [ ] Mejoras en el selector de juego
  - En la sección de elige nivel: cuando un nivel está bloqueado (aparece un candado), en vez de mostrar abajo el texto "Bloqueado" mostremos el número de países (ya se sabe que está bloqueado por el candado)
  - En la sección de tipo de juego:
    - En vez de "Tipo de juego", pondría "Elige juego" (por coherencia con los dos "elige" de arriba)
    - Elegir un texto mejor para Aventura. "Todos los tipos combinados" nos vale internamente, pero para el usuario algo como "Recomendado: aprende de manera guiada según lo que sepas" es mejor. Pensemos bien esto, dame distintas opciones
    - El (no botón) de "* Elegir tipo concreto", no queda bien, hay que diseñar algo mejor. Me parece bien que sea sutíl, pero ahora mismo es algo un poco cutre.
- [ ] Justificación / Explicación para el usuario de por qué no se pueden borrar sellos ni resetear las estadísticas de sello
  - (Idea que tengo: las estadísticas de sello y los sellos no se pueden borrar
    - en estadísticas en el lugar equivalente donde aparece "resetear estadísticas" en la pestaña jugar, mostrar en la pestaña de pruebas de sello un mensaje diciendo algo como "intencionadamente no se pueden borrar las estadísticas de las pruebas de sello ni borrar los sellos que ya tienes - crea un nuevo perfil si quieres empezar de cero". Pensar bien este mensaje. Validar coherencia con / anotar en design.md)

### Testear exhaustivamente
- [ ] Consigue todos los sellos para todos los continentes
- [ ] Juega al menos en aventura para todos los continete-nivel
- [ ] Anota feedback en backlog.md

### Internacionalización (UI completa)
- [ ] Elegir librería de i18n (i18next, react-intl u otra)
- [ ] Externalizar textos de la app a archivos de traducción
  - Los datos sintéticos en `countryData.ts` (SOL, CYN, AQ) tienen nombres hardcodeados en español
- [ ] Generar datos multi-idioma (ampliar script para todos los idiomas soportados)
- [ ] Símbolos y nombres de moneda via `Intl.NumberFormat` (CLDR): usar `narrowSymbol` como base + mapa de ~15 overrides curados para símbolos donde tenemos mejor dato (NT$, KSh, MOP$, etc.). Elimina mantenimiento manual de 232 símbolos. Revisar/actualizar DESIGN.md (§ Fuentes de datos, § Internacionalización de datos) para reflejar CLDR como fuente de símbolos. Asegurar coherencia con el principio de actualización automática de datos (§ Actualización automática). Spike: `docs/spikes/validacion-simbolos-moneda.md`
- [ ] Traducción a idiomas disponibles en iOS y Android


### Tema visual
- [ ] Diseñar e implementar tema claro (baja prioridad, casi al final del desarrollo)

### Infraestructura y acabados
- [ ][PENSAR/INVESTIGAR: hay alguna fuente mejor?] Validación automática de coordenadas de capitales en `fetch-countries.ts`: comprobar que cada capital cae dentro (o cerca) del polígono de su país usando `d3.geoContains()`. Si falla, buscar coords alternativas en Wikidata SPARQL como fallback. El script nunca debe fallar — si no se encuentran coords válidas, conservar las de la API + warning. Investigación completa hecha (auditoría de 229 capitales, diseño de pipeline con tolerancias 50/200/500 km, query SPARQL lista). De momento se usa CAPITAL_OVERRIDES manual (EH, GD, KI, SN).
- [ ] Añadir Capacitor para build Android
- [ ] Actualización silenciosa de datos vía CDN (ver DESIGN.md)
- [ ] Sección "Acerca de": explicar criterios (países ONU, idiomas oficiales, fuentes UNDP, REST Countries, etc.)
- [ ] Solicitud de valoración in-app (SKStoreReviewController iOS + Play In-App Review Android)

