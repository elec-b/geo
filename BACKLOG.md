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
- [x] **UX Jugar**: Mejoras en selector de juego — nivel bloqueado muestra n.º de países (en vez de "Bloqueado"), título "Elige juego" (coherencia), subtítulo Aventura "Se adapta a lo que sabes", separador "o elige juego concreto" con líneas. Scroll automático al expandir tipos + panel scrollable en pantallas pequeñas
- [x] **Explorar**: Fix drag-to-dismiss de ficha de país (Singapur y potencialmente otros). Causa: conflicto `touch-action: pan-y` + `overflow-y: auto` + `setPointerCapture` en iOS. Solución: separar drag zone (handle+header, `touch-action: none`) de scroll zone (body, `touch-action: pan-y`)
- [x] **Estadísticas**: Símbolos ◯/◎ en headers de columna de la pestaña "Pruebas de sello" (coherencia visual con pestaña "Jugar")
- [x] **UX general**: Deshabilitada selección de texto y menú contextual de long-press en iOS (`user-select: none` + `-webkit-touch-callout: none` en reset global)
- [x] **Estadísticas**: Aviso de permanencia en pestaña "Pruebas de sello" — mensaje explicativo de que sellos e historial son permanentes (metáfora pasaporte real), con alternativa de crear nuevo perfil. Documentado en DESIGN.md
- [x] **Explorar**: Etiquetas de mares y océanos en el globo — 28 entries (5 océanos, 6 mares grandes, 11 medianos incl. Caspio y Amarillo, 3 pequeños, 3 golfos). Underlay serif itálica (Georgia), estilo discreto. minZoom individual por etiqueta, sin límite máximo. Toggle «Mares y océanos» en Configuración (visible desde todas las pestañas). Auditoría de posiciones contra islas (Gotland, Ryukyu). Fix letter-spacing uniforme (char-by-char left-aligned)
- [x] **Configuración**: Toggle de marcadores de microestados y archipiélagos visible desde todas las pestañas (antes solo en Explorar). Eliminado prop `isExploreTab`
- [x] **Jugar**: FlyTo más suave en todos los tipos — interpolación logarítmica del zoom (distribución visual uniforme), duración adaptativa proporcional al ratio de zoom, y pausa extra sobre el país correcto en C/D acierto
- [x] **UX Jugar**: Reposicionar pregunta y opciones — grupo unificado abajo (`.game-bottom-group` flex column: QuestionBanner + ChoicePanel + ProgressBar). Todos los tipos A-F y pruebas de sello muestran pregunta en zona inferior. Estilo unificado (font-size-xl, bold). Posición responsiva con `max()` para compatibilidad con distintos dispositivos
- [x] **Jugar**: Buffer de anti-repetición aumentado de min(3, pool/2) a min(8, pool/2) — países fallados no reaparecen hasta 5-8 preguntas después (con pools de 10+). Pools pequeños sin cambio
- [x] **Explorar**: Rediseño del símbolo de capitales — doble circunferencia (◎) en gris claro (#e0e0e0), labels de capital en gris tenue (jerarquía visual país > capital). Eliminadas referencias a "cian" en DESIGN.md. Grosor y opacidad igualados a las fronteras (lineWidth dinámico + rgba 0.5)
- [x] **Datos**: Override 1:10m para SC y MV (SC: 1→18, MV: 2→22 polys), filtro de polígonos diminutos, mesh de bordes filtrado para excluir override countries, bordes 10m dibujados por separado. Fix race condition en carga paralela que causaba contornos fantasma 50m. Spike: `docs/spikes/archipielagos-resolucion-10m.md`
- [x] **UX Jugar**: Ocultar marcadores de microestados en tipo B y pruebas de sello de capitales — los anillos se solapaban con los pines de capital (◎). Solo tipo A mantiene marcadores visibles
- [x] **UX Jugar**: Pin de capital (◎) contrastante en juegos — el pin del país target se muestra en blanco tras responder (visible sobre verde/dorado/rojo). Solo post-respuesta para no delatar en tipo B/sello. Colores de territorio acierto/error más mate (#459960 verde bosque, #c45250 rojo teja) — menos agresivos, mejor contraste con pin blanco
- [x] **Cartografía**: Política de territorios disputados en DESIGN.md (criterio ONU, representación de facto de Natural Earth). Fix Siachen — features sin código ISO heredan dimming de países vecinos (mapa `ORPHAN_NEIGHBORS`), eliminando triángulos visibles con filtro de continente
- [x] **UX Explorar**: Fade-out gradual de marcadores de microestados al hacer zoom-in — cada marcador se desvanece individualmente cuando el país proyectado es suficientemente grande (radio angular pre-computado × projection.scale()). Hit testing deshabilitado para marcadores invisibles. Microestados con área 0 (VA, MC) conservan marcador permanente
- [x] **UX Jugar**: Offset vertical de flyTo durante juegos — el país se centra en la zona visible (entre header y bottom group) en vez de en el centro geométrico del canvas. Offset adaptativo por tipo (E/C/D/F: 12°, A/B/sello: 7°), con fade-in progresivo (solo a zoom ≥ 2.5). Spike: `docs/spikes/flyto-offset-juegos.md`
- [x] **Explorar**: Fix espaciado desigual en etiquetas de mares — `textAlign: 'center'` se filtraba entre iteraciones del loop de renderizado, causando gaps dependientes del ancho de cada carácter en las etiquetas char-by-char
- [x] **Estadísticas**: Sorting por cualquier columna en ambas pestañas (Jugar y Pruebas de sello) — headers tappables con indicador ▲/▼, ordenamiento por estado de dominio o porcentaje según modo activo, desempate por nombre, reset al cambiar pestaña
- [x] **Jugar**: Fix hull gigante envolviendo el planeta (Indonesia, Asia-Guía) — el convex hull 2D (Andrew's) tenía winding order invertido en proyección esférica, causando que D3 dibujara el complemento del hull. Fix: verificar `geoArea()` y hacer `reverse()` si cubre más de media esfera. Spike: `docs/spikes/hull-gigante-indonesia.md`
- [x] **Hit testing**: Fix fat finger Timor Oriental ↔ Indonesia — el hull invisible de Indonesia interceptaba taps cercanos a Timor. Fix: en fase 3 del hit testing (hulls), antes de retornar el match por hull, comparar contra centroides de todos los países y preferir el más cercano al tap. Genérico para cualquier hull que tape a un vecino. Spike: `docs/spikes/fat-finger-timor-indonesia.md`
- [x] **Rendimiento**: Optimización de batería/calentamiento — DPR limitado a 2 (~56% menos píxeles), RAF sleep/wake (loop se detiene cuando no hay animaciones), pausa de RAF en background (`@capacitor/app`). Spike: `docs/spikes/rendimiento-bateria.md`
- [x] **Cartografía**: Hull visible para archipiélagos africanos (KM, ST, CV) — línea discontinua perimetral para Comoras, Santo Tomé y Príncipe y Cabo Verde. Hit testing mejorado (mar entre islas). Reemplaza marcadores circulares de microestado. MU descartado (isla principal suficiente). Spike: `docs/spikes/hull-comoras-santotome.md`
- [x] **UX Explorar**: Subir selectores de Explorar (segmented, pills de continente, toggles etiquetas, toggle no-ONU en tabla) — controles más cerca del header para ganar espacio vertical
- [x] **UX Explorar**: Color de capitales en tabla coherente con el globo (gris claro en vez de cian). Pills de Países/Capitales con fondo semitransparente y texto más claro para mejor legibilidad sobre el globo
- [x] **Datos**: Corregir ~27 errores ortográficos en español (tildes, grafías no hispanizadas, nombres sin traducir). 21 nombres de país, 3 capitales, 1 gentilicio. Overrides en `capitals-es.json`, verificados contra RAE/DPD
- [x] **Hit testing**: Tolerancia fat finger mejorada para países alargados/enclavados (Gambia-Senegal, Lesoto, Chile, etc.) — distancia efectiva = min(centroide, frontera más cercana) en vez de solo centroide. Aplica a tipos A/B y pruebas de sello
- [x] **Hit testing**: Tolerancia fat finger v2 — verificar país más cercano antes de aceptar por tolerancia (evita regalar aciertos entre microestados cercanos del Caribe, Golfo Pérsico, etc.). Taps en océano cerca de un país incorrecto ahora registran error en vez de ser silenciosos
- [x] **Cartografía**: Separar 5 territorios franceses de ultramar (GF, GP, MQ, RE, YT) del MultiPolygon de Francia — script nuevo `generate-overseas-overrides.ts` que descompone por proximidad geográfica. Cada territorio es ahora feature independiente con continente correcto (América/África), seleccionable con ficha propia
- [x] **Pasaporte**: Animación de estrella ★ más suave — de 10 a 5 vueltas (1800deg en 3s), arranque más lento

---

## Próximos pasos

> Ordenados por prioridad. Cada bloque debe completarse antes de avanzar al siguiente (salvo tareas marcadas como opcionales).

### Terminar testing manual
- [EN PROGRESO] Consigue todos los sellos para todos los continentes
- [EN PROGRESO] Juega al menos en aventura para todos los continente-nivel
- [EN PROGRESO] Anota feedback en backlog.md

### UX pre-lanzamiento
- [ ] Mostrar n.º de países en modal de prueba de sello («Debes ubicar X países sin errores»)
- [ ] Simplificar label «Marcadores de microestados y archipiélagos» en Configuración (ej. «Marcadores de islas y países pequeños»)
- [ ] Mejorar texto de modales de dominio — no sugerir «resetea estadísticas» como flujo normal; proponer «Prueba otro continente» o «Sube de nivel»
- [ ] Considerar cambiar orden de tabs: Explorar, Jugar, Pasaporte (lectura izquierda→derecha más natural)
- [ ] En Explorar > Tabla, mostrar última acción relacionada (último continente-nivel de prueba de sello, último continente-nivel jugado, último continente-nivel de la tabla). Confirmar que entiendes lo que digo antes de implementar nada
- [ ] (Opcional) Onboarding mínimo para primera ejecución (2-3 tooltips o modal de bienvenida)
- [ ] (Opcional) Modal de celebración al desbloquear un nuevo nivel (tras conseguir ambos sellos)

### Internacionalización
> Pre-lanzamiento. La app se lanza en todos los idiomas soportados por iOS/Android. Las tareas siguen la cadena de dependencias: a → b → c → d → e → f → g.

- [ ] **(a)** Elegir librería de i18n (i18next, react-intl u otra)
- [ ] **(b)** Externalizar textos de la app a archivos de traducción
  - Migrar tipos `Continent` y `GameLevel` de literales en español a claves neutras (`africa`, `tourist`, etc.)
  - Añadir `version` + `migrate` a Zustand persist para migrar datos de usuarios existentes
  - Los datos sintéticos en `countryData.ts` (SOL, CYN, AQ) tienen nombres hardcodeados en español
- [ ] **(c)** Cambiar fuente de nombres de países a CLDR + ~6 overrides/idioma. Pipeline con diff entre runs que flaggee cambios para revisión. Absorbe los overrides manuales de español. Spike: `docs/spikes/typos-español-i18n.md` § 4
- [ ] **(d)** Símbolos y nombres de moneda via `Intl.NumberFormat` (CLDR): usar `narrowSymbol` como base + mapa de ~15 overrides curados. Spike: `docs/spikes/validacion-simbolos-moneda.md`
- [ ] **(e)** Generar datos multi-idioma (ampliar script para todos los idiomas soportados)
- [ ] **(f)** Validación con Claude: validador primario para todos los idiomas. El desarrollador valida español e inglés personalmente; para el resto, Claude genera informe de anomalías por idioma (ortografía, traducciones incorrectas, incoherencias). No genera traducciones — solo valida
- [ ] **(g)** Traducir textos de UI a todos los idiomas soportados

### Acabados pre-lanzamiento
- [ ] Diseñar e implementar tema claro
- [ ] Validación automática de coordenadas de capitales en `fetch-countries.ts` (d3.geoContains + Wikidata SPARQL como fallback). De momento funciona con CAPITAL_OVERRIDES manual (EH, GD, KI, SN)
- [ ] Revisar que los datos de la ficha de país están actualizados + asegurar que se actualicen bien en el futuro
- [ ] Actualización silenciosa de datos vía CDN (ver DESIGN.md)
- [ ] Sección «Acerca de»: explicar criterios (países ONU, fuentes UNDP, REST Countries, etc.)

### Preparación y publicación iOS
- [ ] Fix orientación: eliminar landscape de Info.plist (la UI es portrait-only). Decidir si se soporta iPad
- [ ] Privacy policy en URL pública (la app no recopila datos — declararlo explícitamente). Landing page mínima (GitHub Pages): privacy policy + URL de soporte
- [ ] Certificados y provisioning profiles de distribución (actualmente solo Debug)
- [ ] Build de producción (Archive / Release)
- [ ] Versionado: 0.1.0 → 1.0.0 (package.json + MARKETING_VERSION + CURRENT_PROJECT_VERSION en Xcode)
- [ ] Testing en simuladores: iPhone SE, iPhone estándar, iPhone Pro Max, iPad (si se soporta)
- [ ] Verificar safe areas, status bar, interrupciones (llamadas, notificaciones, background/foreground)
- [ ] Verificar icono (sin alpha) y splash screen en todos los tamaños
- [ ] Metadata App Store Connect: nombre, subtítulo, descripción, palabras clave, categoría (Educación), copyright, URLs
- [ ] Screenshots (3-5, resolución 6.9" reutilizable para todos los tamaños)
- [ ] Clasificación por edad: general audience 4+ (NO categorizar como «directed to children» — evita restricciones de Kids Category y parental gates para el enlace a Wikipedia)
- [ ] Enviar a App Store Review
- [ ] (Recomendado) Solicitud de valoración in-app (SKStoreReviewController) — alto ROI, bajo esfuerzo

### Preparación y publicación Android
- [ ] Cuenta Google Play Console + verificación de identidad ($25, pago único)
- [ ] `npx cap add android` + configuración del proyecto
- [ ] Testing en emulador y dispositivos Android reales (mínimo 2-3 resoluciones/versiones)
- [ ] Icono adaptativo (foreground + background layers, diferente del iOS)
- [ ] Build de producción (AAB) + signing key (guardar keystore en lugar seguro)
- [ ] Metadata Google Play: título, descripciones, categoría, Data Safety form, contacto
- [ ] Screenshots + Feature Graphic (1024×500, obligatoria)
- [ ] Testing cerrado (≥20 testers, ≥14 días) — requisito para cuentas personales nuevas
- [ ] Clasificación de contenido (cuestionario IARC)
- [ ] Enviar a revisión

### Post-lanzamiento
- [ ] (Opcional) Confirmación al salir de prueba de sello en curso (diálogo si se toca otro tab)
- [ ] (Opcional) Forzar reinicio de prueba de sello al salir a otra app
