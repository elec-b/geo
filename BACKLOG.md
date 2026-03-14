# Backlog de GeoExpert

> Historial de desarrollo más reciente y próximos pasos. Para el historial completo, consultar git.

---

## Completado

- [x] **Motor de renderizado**: D3.js ortográfico + Canvas 2D. Zoom ×200, inercia, pinch+drag, marcadores de microestados, dirty flag
- [x] **Datos**: 195 países ONU + territorios no-ONU + Antártida. Datos en español completos (capitales, gentilicios, monedas, idiomas, IDH/IDH-D, Wikipedia). Override 1:10m para 8 islas del Pacífico
- [x] **Explorar**: Globo interactivo (etiquetas anti-solapamiento, filtros continente, flyTo) + Tabla (sticky headers, ordenable, toggle no-ONU). Ficha de país completa. Diseño responsivo (rem)
- [x] **Jugar**: 6 tipos (E/C/D/F/A/B), modo Aventura + tipo concreto. Algoritmo v3 (rachas, etapas, regresión, avance colectivo, inferencia, herencia entre niveles, anti-repetición). Barra de progreso ponderada. Pruebas de sello (0 errores). Zoom inteligente E/F y A/B (extensión angular, convex hull, centroides Oceanía ajustados)
- [x] **Pasaporte**: Matriz niveles × continentes con sellos, color según nivel global
- [x] **Perfiles**: Multi-perfil con avatares, cambio rápido, progreso independiente
- [x] **Configuración**: Bottom sheet (vibración, idioma, tema, marcadores). Feedback háptico
- [x] **UX Jugar**: Pre-selección continente/nivel, botón Continuar, niveles superados con 🏅, modales de fin de sesión con invitación a sello, selector sin paso intermedio, orden y colores olímpicos en pills de continente, tipo/modo ya completado (modal pre-sesión + ✓ en pills + correcciones en modales de fin), ocultar pines de capitales no-ONU en Jugar y pruebas de sello, hulls de archipiélagos siempre visibles (selectivos por continente, buffer proporcional, zoom adaptativo), fix flyTo antimeridiano (Samoa/Tonga), fix hit testing no-ONU (prioridad geometría sobre territorios no-ONU)
- [x] **Estadísticas**: Eliminado estado "en progreso" (▼ para racha ≤ 0), quitados contadores aciertos/fallos, toggle ✓/%, desacoplamiento datos sello/jugar (`stampAttempts` independiente), nueva pestaña "Pruebas de sello" con indicadores ✓/✗

---

## Próximos pasos

> Ordenados por prioridad. Las áreas se listan de mayor a menor urgencia.

### Multi-usuario
- [ ] Comprobar si cuando se cambia de usuario, si hay otro usuario en Jugar o en Pasaporte, el juego / prueba de sello en curso se para (si es que está en alguno de estos) - esta es la funcionalidad lógica. El nuevo usuario empieza en Explorar y elige juego. Pensar bien el diseño y reflejar en design.md antes de implementar.

### Explorar
- [ ] Usar el mismo código de colores para los selectores de Explorar que los que tenemos en el juego.
- [ ] Groenlandia aparece como país independiente pero es territorio de Dinamarca (reconocido por la ONU). Investigar por qué y corregir (también "impactará" en Jugar, obviamente)
- [ ] El Aaiun aparece mal ubicado - repasar
- [ ] Los circulitos de capitales de territorios no reconocidos por la ONU deben tener otro color distinto - apuntar también en design.md

### Pasaporte
- [ ] Mejorar estética: el grid está bien, pero debe transmitir la sensación de "pasaporte en una página". Pensar bien el aspecto visual antes de implementar
- [ ] Cuando el usuario no tiene un nivel global, no mostrar el texto "Sin nivel global"
- [ ] Pensar si quiero dar la posibilidad al usario de borrar sus sellos/medallas del pasaporte. En caso afirmativo, documentar en design.md antes de implementar.

### Testear exhaustivamente
- [ ] Consigue todos los sellos para todos los continentes
- [ ] Juega al menos en aventura para todos los continete-nivel
- [ ] Anota feedback en backlog.md

### UX general
- [ ] Bottom sheets (configuración y ficha de país): añadir handle + implementar drag-to-dismiss
- [ ] Feedback háptico: vibraciones más cortas/sutiles
- [ ] Renombrar los tipos de juego, quizás reasignar las letras, para que se vean de una manera lógica en la tabla de estadísticas y en el selector. El orden pedagógico que hay ahora tiene sentido, pero la secuencia de letras (E, C, D, F, A, B) no tanto... Es una mala "herencia" de cuando pensamos los distintos tipos de juegos. También debemos repensar los nombres que se muestran en el selector y mostrar letra + nombre del juego.  Hacer los cambios primero en design.md, después cambiar también en el codebase por coherencia, y finalmente aplicar el el selector y en la tabla de estadísticas. 
  - En la tabla de estadísticas, podemos mostrar simplemente la letra y si el usuario pulsa sobre ella, mostrar una descripción del juego (no sé si entra / si es recomendable poner el típico icono de interrogación, pequeño, al lado de la letra. Pensemos esto bien.)
- [ ][PENSAR] Sello automático: si el usuario supera tipo A o B con 0 errores de un solo intento / en una misma parte de la sesión, otorgar el sello directamente (equivalente a la prueba de sello). Documentar en DESIGN.md
- [ ][PENSAR] Borrados de sello y Resets
  - Queremos darle al usuario la posibilidad de borrar sus sellos? En la dimensión continente-nivel? En otra dimensión?
  - Queremos darle al usuario de resetear el juego completo y la posibilidad de empezar de cero?
  - (Aterrizar ambas cosas en design.md antes de implementar nada, esto es muy importante tenerlo claro)

### Internacionalización (UI completa)
- [ ] Elegir librería de i18n (i18next, react-intl u otra)
- [ ] Externalizar textos de la app a archivos de traducción
  - Los datos sintéticos en `countryData.ts` (SOL, CYN, AQ) tienen nombres hardcodeados en español
- [ ] Generar datos multi-idioma (ampliar script para todos los idiomas soportados)
- [ ] Traducción a idiomas disponibles en iOS y Android

### Testing
- [ ] Definir estrategia de testing para lógica de juego (Vitest o similar)

### Infraestructura y acabados
- [ ] Añadir Capacitor para build Android
- [ ] Actualización silenciosa de datos vía CDN (ver DESIGN.md)
- [ ] Sección "Acerca de": explicar criterios (países ONU, idiomas oficiales, fuentes UNDP, REST Countries, etc.)
- [ ] Solicitud de valoración in-app (SKStoreReviewController iOS + Play In-App Review Android)

### Tema visual
- [ ] Diseñar e implementar tema claro (baja prioridad, casi al final del desarrollo)

