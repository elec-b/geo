# Backlog de GeoExpert

> Historial de desarrollo más reciente y próximos pasos. Para el historial completo, consultar git.

---

## Completado

- [x] **Motor de renderizado**: D3.js ortográfico + Canvas 2D. Zoom ×200, inercia, pinch+drag, marcadores de microestados, dirty flag
- [x] **Datos**: 195 países ONU + territorios no-ONU + Antártida. Datos en español completos (capitales, gentilicios, monedas, idiomas, IDH/IDH-D, Wikipedia). Override 1:10m para 8 islas del Pacífico
- [x] **Explorar**: Globo interactivo (etiquetas anti-solapamiento, filtros continente, flyTo) + Tabla (sticky headers, ordenable, toggle no-ONU). Ficha de país completa. Diseño responsivo (rem)
- [x] **Jugar**: 6 tipos (E/C/D/F/A/B), modo Aventura + tipo concreto. Algoritmo v3 (rachas, etapas, regresión, avance colectivo, inferencia, herencia entre niveles, anti-repetición). Barra de progreso ponderada. Pruebas de sello (0 errores). Zoom inteligente E/F y A/B (extensión angular, convex hull, centroides Oceanía ajustados)
- [x] **Pasaporte**: Matriz niveles × continentes con sellos, color según nivel global
- [x] **Perfiles**: Multi-perfil con avatares, cambio rápido, progreso independiente, limpieza de sesión al cambiar perfil (termina juego/sello en curso, reinicia globo, navega a Explorar)
- [x] **Configuración**: Bottom sheet (vibración, idioma, tema, marcadores). Feedback háptico
- [x] **UX Jugar**: Pre-selección continente/nivel, botón Continuar, niveles superados con 🏅, modales de fin de sesión con invitación a sello, selector sin paso intermedio, orden y colores olímpicos en pills de continente, tipo/modo ya completado (modal pre-sesión + ✓ en pills + correcciones en modales de fin), ocultar pines de capitales no-ONU en Jugar y pruebas de sello, hulls de archipiélagos siempre visibles (selectivos por continente, buffer proporcional, zoom adaptativo), fix flyTo antimeridiano (Samoa/Tonga), fix hit testing no-ONU (prioridad geometría sobre territorios no-ONU), colores olímpicos unificados en selectores de Explorar/Pasaporte, circulitos de capitales no-ONU en ámbar
- [x] **Estadísticas**: Eliminado estado "en progreso" (✗ para racha ≤ 0), quitados contadores aciertos/fallos, toggle ✓/%, desacoplamiento datos sello/jugar (`stampAttempts` independiente), nueva pestaña "Pruebas de sello" con indicadores ✓/✗, defaults inteligentes según origen (Jugar→lastPlayed, Pasaporte/sello→lastStampPlayed), icono de refuerzo ▼→✗ (convención tick/cross)
- [x] **Datos**: Corregidas coordenadas de capitales incorrectas de REST Countries API: El Aaiún (lat/lng invertidos), Dakar (imprecisión costera). Añadidos CAPITAL_OVERRIDES en fetch-countries.ts

---

## Próximos pasos

> Ordenados por prioridad. Las áreas se listan de mayor a menor urgencia.

### Pasaporte
- [ ] Cuando juego una prueba de sello, en el menú inferior, aparece iluminado/seleccionado "Jugar", debería estar iluminado/seleccionado "Pasaporte"
  - [ ] Relacionado: si estoy en una prueba de sello y la dejo a medias, si pulso Jugar, no puede salir la prueba de sello que estaba haciendo. (Cuando se pulsa Jugar o Pasaporte se va "al inidio de Jugar" (selección de Juego) o al "inicio de Pasaporte" (visión de sellos obtenidos))
- [ ] Cuando el usuario no tiene un nivel global, no mostrar el texto "Sin nivel global"
- [ ] Mejorar estética: el grid está bien, pero debe transmitir la sensación de "pasaporte en una página". Pensar bien el aspecto visual antes de implementar

### UX general
- [ ] En los juegos, cuando hay acierto, solo mostrar el país coloreado en verde; quitar el filtro verde que se pone en toda la pantalla, es molesto
  - hacer lo equivalente para los fallos
  - esto también aplica para las pruebas de sello
- [ ] Bottom sheets (configuración y ficha de país): añadir handle + implementar drag-to-dismiss
- [ ] Feedback háptico: vibraciones más cortas/sutiles
- [ ] Renombrar los tipos de juego, quizás reasignar las letras, para que se vean de una manera lógica en la tabla de estadísticas y en el selector. El orden pedagógico que hay ahora tiene sentido, pero la secuencia de letras (E, C, D, F, A, B) no tanto... Es una mala "herencia" de cuando pensamos los distintos tipos de juegos. También debemos repensar los nombres que se muestran en el selector y mostrar letra + nombre del juego.  Hacer los cambios primero en design.md, después cambiar también en el codebase por coherencia, y finalmente aplicar el el selector y en la tabla de estadísticas. 
  - En la tabla de estadísticas, podemos mostrar simplemente la letra y si el usuario pulsa sobre ella, mostrar una descripción del juego (no sé si entra / si es recomendable poner el típico icono de interrogación, pequeño, al lado de la letra. Pensemos esto bien.)
- [ ][PENSAR] Sello automático: si el usuario supera tipo A o B con 0 errores de un solo intento / en una misma parte de la sesión, otorgar el sello directamente (equivalente a la prueba de sello). Documentar en DESIGN.md
- [ ][PENSAR] Borrados de sello y Resets
  - (Idea que tengo: las estadísticas de sello y los sellos con se pueden borrar
    - en estadísticas en el lugar equivalente donde aparece "resetear estadísticas" en la pestaña jugar, mostrar en la pestaña de pruebas de sello un mensaje diciendo algo como "intencionadamente no se pueden borrar las estadísticas de las pruebas de sello ni borrar los sellos que ya tienes - crea un nuevo perfil si quieres empezar de cero". Pensar bien este mensaje. Validar coherencia con / anotar en design.md)
  - Queremos darle al usuario la posibilidad de borrar sus sellos? En la dimensión continente-nivel? En otra dimensión?
  - Queremos darle al usuario de resetear el juego completo y la posibilidad de empezar de cero?
  - (Aterrizar ambas cosas en design.md antes de implementar nada, esto es muy importante tenerlo claro)

### Testear exhaustivamente
- [ ] Consigue todos los sellos para todos los continentes
- [ ] Juega al menos en aventura para todos los continete-nivel
- [ ] Anota feedback en backlog.md


### Explorar
- [ ] Groenlandia aparece como país independiente pero es territorio de Dinamarca (reconocido por la ONU). Investigación hecha: los datos y filtros son correctos (unMember: false, no participa en Jugar, etiquetas en ámbar). El "problema" es solo visual (mismo color de relleno que países ONU) y de nomenclatura (ver tarea siguiente sobre territorios).
- [ ] El Aaiún aparece mal ubicado — coordenadas invertidas (lat ↔ lng) en REST Countries API. Pendiente de corregir en capitals.json + CAPITAL_OVERRIDES en fetch-countries.ts. También se detectaron coords incorrectas para SN (Dakar, 22 km off). Ver tarea de validación automática más abajo.
- [ ][PENSAR] Clasificación de territorios no-ONU: actualmente todos los territorios que no son países ONU se etiquetan como "Territorio no reconocido por la ONU", pero esto es incorrecto para muchos de ellos. Hay dos categorías muy distintas:
  - **Territorios de países ONU**: Groenlandia (Dinamarca), Puerto Rico (EEUU), Wallis y Futuna (Francia), Guayana Francesa (Francia), etc. Son territorios plenamente reconocidos — simplemente no son estados independientes. La etiqueta debería ser "Territorio de [País soberano]".
  - **Estados disputados / no reconocidos**: Kosovo, Taiwán, Sáhara Occidental, etc. Para estos sí tiene sentido "Territorio no reconocido por la ONU" o similar.
  - Propuesta: añadir un campo `sovereignCountry` (o similar) en los datos para distinguir ambos casos y mostrar la etiqueta correcta en la ficha de país. Pensar bien las categorías y redactar en DESIGN.md antes de implementar.

### Internacionalización (UI completa)
- [ ] Elegir librería de i18n (i18next, react-intl u otra)
- [ ] Externalizar textos de la app a archivos de traducción
  - Los datos sintéticos en `countryData.ts` (SOL, CYN, AQ) tienen nombres hardcodeados en español
- [ ] Generar datos multi-idioma (ampliar script para todos los idiomas soportados)
- [ ] Traducción a idiomas disponibles en iOS y Android

### Tema visual
- [ ] Diseñar e implementar tema claro (baja prioridad, casi al final del desarrollo)

### Infraestructura y acabados
- [ ][PENSAR/INVESTIGAR: hay alguna fuente mejor?] Validación automática de coordenadas de capitales en `fetch-countries.ts`: comprobar que cada capital cae dentro (o cerca) del polígono de su país usando `d3.geoContains()`. Si falla, buscar coords alternativas en Wikidata SPARQL como fallback. El script nunca debe fallar — si no se encuentran coords válidas, conservar las de la API + warning. Investigación completa hecha (auditoría de 229 capitales, diseño de pipeline con tolerancias 50/200/500 km, query SPARQL lista). De momento se usa CAPITAL_OVERRIDES manual (EH, GD, KI, SN).
- [ ] Añadir Capacitor para build Android
- [ ] Actualización silenciosa de datos vía CDN (ver DESIGN.md)
- [ ] Sección "Acerca de": explicar criterios (países ONU, idiomas oficiales, fuentes UNDP, REST Countries, etc.)
- [ ] Solicitud de valoración in-app (SKStoreReviewController iOS + Play In-App Review Android)

