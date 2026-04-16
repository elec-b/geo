# Backlog de Exploris

> Historial de desarrollo más reciente y próximos pasos. Para el historial completo, consultar git.

---

## Completado

> Resumen por área. Para el historial granular de cada tarea, consultar git.

- [x] **Motor de renderizado**: D3.js ortográfico + Canvas 2D. Zoom ×200, inercia, pinch+drag, marcadores de microestados con fade-out adaptativo, dirty flag, DPR ≤ 2, RAF sleep/wake + pausa en background
- [x] **Datos**: 195 países ONU + ~37 territorios no-ONU + Antártida. Datos en español completos (capitales, gentilicios, monedas, idiomas, IDH/IDH-D, Wikipedia). Override 1:10m para 10 países insulares. ~27 correcciones ortográficas (RAE/DPD). Territorios franceses de ultramar separados. CAPITAL_OVERRIDES para coords incorrectas de REST Countries
- [x] **Explorar**: Globo interactivo (etiquetas anti-solapamiento, filtros continente, flyTo, etiquetas de mares/océanos). Tabla ordenable (sticky headers, toggle no-ONU). Ficha de país completa con drag-to-dismiss, Wikipedia, clasificación de territorios. Diseño responsivo (rem)
- [x] **Jugar**: 6 tipos (E/C/D/F/A/B), modo Aventura + tipo concreto. Algoritmo v3 (rachas, etapas, regresión, avance colectivo, inferencia, herencia E/CDF entre niveles, anti-repetición ×8). Barra de progreso ponderada. Pruebas de sello (0 errores). Nomenclatura visual ◯/◎. Selector: Aventura destacada + grid 2×3 colapsable. FlyTo suave con offset vertical adaptativo. Zoom inteligente. Mensajes motivadores
- [x] **Hit testing**: Tolerancia fat finger adaptativa (centroide + frontera más cercana), verificación de país más cercano, hulls de archipiélagos (con fix winding order esférico), fix Timor-Indonesia, fix no-ONU
- [x] **Cartografía**: Hulls visibles para archipiélagos (Oceanía, Caribe, Índico, África). Política de territorios disputados (de facto, criterio ONU). Fix Siachen (orphan neighbors)
- [x] **Pasaporte**: Sellos circulares CSS premium (guilloché, colores olímpicos, rotación aleatoria). Animación stampDrop + estrella giratoria (5 vueltas). Tab bar ilumina Pasaporte durante pruebas de sello
- [x] **Estadísticas**: Dos pestañas (Jugar + Pruebas de sello). Toggle ✓/%, código de colores, sorting por columna, defaults inteligentes según origen, aviso de permanencia de sellos. Click en país navega a Explorar con ficha (Stats se minimiza y restaura). Auto-selección de nivel al cambiar continente
- [x] **Perfiles**: Multi-perfil con avatares, cambio rápido, progreso independiente, limpieza de sesión al cambiar
- [x] **Configuración**: Bottom sheet (vibración, idioma, tema, marcadores, mares/océanos). Feedback háptico
- [x] **UX general**: Bottom sheets con drag-to-dismiss, selección de texto deshabilitada, feedback verde/rojo al 2%, colores olímpicos unificados, anti-viudas tipográficas (`text-wrap: pretty/balance`), fix animación sello capital (limpieza de `--animating`), emoji de nivel Turista cambiado de 🧳 a 📸
- [x] **Testing manual**: Todos los sellos en todos los continentes, aventura en todos los continente-nivel, feedback anotado
- [x] **UX pre-lanzamiento**: N.º de países en modal de sello, label simplificado de marcadores, orden de tabs (Explorar/Jugar/Pasaporte), persistencia de continente y sorting en Tabla, onboarding en Pasaporte. Persistencia de modo Explorar (Globo/Tabla) entre tabs, reset a Globo+Todos al abrir app
- [x] **Internacionalización**: 32 idiomas (26 base + 6 ampliación) + 5 variantes regionales. i18next con lazy loading y plurales CLDR. Datos multi-idioma: CLDR (países/monedas/idiomas), Wikidata SPARQL (capitales/Wikipedia slugs), Claude (gentilicios/mares). 175 archivos UI, 6682 Wikipedia slugs. Verificación contra fuentes autoritativas (32 idiomas). ~100 overrides de nombres, fixes de layout multi-idioma, selector de idioma en bottom sheet dedicado
- [x] **Logo/branding**: Globo wireframe SVG (blanco→gris, paralelos curvos, glow sutil). LoadingScreen con logo + título "Exploris". Icono iOS 1024×1024 y splash screens generados desde SVG. Script `generate-icons.mjs`
- [x] **Acerca de**: Pantalla completa con secciones colapsables (países, cómo aprender, tipos de juego, estadísticas, fuentes). Icono info en header. Namespace i18n `about` traducido a 32 idiomas. Fuentes de datos: mención a Banco Mundial, actualización automática vía CDN, mapas solo con nuevas versiones
- [x] **Perfiles**: Mejoras al crear nuevo perfil — cerrar sesión activa y navegar a Explorar, input de nombre con placeholder, avatares de color (10 círculos) como alternativa a animales
- [x] **Marcadores de microestados**: Mejorar visibilidad en tema claro (color más oscuro + opacidad 0.5→0.7)
- [x] **Acabados pre-lanzamiento**: Temas claro/oscuro (paleta premium, 14 variables semánticas). Mejoras de Explorar (columna nivel, spacing selectores), Pasaporte (candados, guilloché), Estadísticas (spacing leyenda). Hull dorado para archipiélagos seleccionados. Validación de coordenadas de capitales. Hit testing de hulls visibles. Auditoría y migración de fuentes de datos (UNDP HDR, World Bank API). CDN operativo (countries-base + capitals + i18n-all). Naming: Exploris
- [x] **Metadata stores**: Redacción completa para App Store y Google Play en los 32 idiomas (`docs/stores/metadata/`). Consistencia terminológica con `about.json` de cada idioma (Aventura/Pasaporte/sello en su variante local). Validación automática de longitudes por campo (name, subtitle, shortDescription, promotionalText, description, keywords) — todos los archivos dentro de límites. Lista para subir cuando se proceda con las stores

---

## Próximos pasos

> Ordenados por prioridad. Cada bloque debe completarse antes de avanzar al siguiente (salvo tareas marcadas como opcionales).

### Preparación compartida (iOS + Android)
- [x] Solicitud de valoración in-app (SKStoreReviewController en iOS, Google Play In-App Review en Android). Plugin `@capacitor-community/in-app-review`, trigger tras animación de sello ganado, condiciones: ≥5 sesiones y ≥7 días
- [x] Fix orientación portrait-only (iOS hecho; Android pendiente de `cap add`). Tablets soportados (iPad + Android) con landscape
- [x] Fix: nombre de perfil por defecto y otros strings en español hardcodeados (perfil "Explorador" traducido al idioma activo, fallbacks de preguntas en inglés, labels de avatares i18n en 32 idiomas)
- [x] Hulls de archipiélago con colores de feedback (verde acierto, rojo error, ocre corrección) en vez de siempre dorado. Aplica a Jugar y pruebas de sello, ambos temas
- [x] Fix: al cambiar de idioma con pregunta en curso, la pregunta se regenera al vuelo en el nuevo idioma (prompt y opciones). Prueba de sello reconstruye la cola pendiente sin terminar prematuramente. Si el usuario está viendo feedback tras responder, se mantiene hasta pulsar siguiente
- [x] Versionado: 0.1.0 → 1.0.0 (package.json + MARKETING_VERSION en Xcode). CURRENT_PROJECT_VERSION se mantiene en 1 para primera release
- [x] Privacy policy + URL de soporte en página pública: reutilizado repo `exploris-data` (GitHub Pages). Páginas en inglés (index/privacy/support). Sección «Privacidad» in-app en About con link externo, traducida a 32 idiomas
- [x] Clasificación por edad: iOS completado (4+). Android pendiente de `cap add android`. Respuestas en `docs/stores/age-rating.md`

### iOS — Build & Test
- [x] Certificados y provisioning profiles de distribución (actualmente solo Debug)
- [x] Crear app record en App Store Connect
- [x] Export compliance: `ITSAppUsesNonExemptEncryption = NO` en Info.plist (HTTPS al CDN es cifrado del sistema, exento)
- [x] MARKETING_VERSION + CURRENT_PROJECT_VERSION en Xcode (sync con package.json)
- [x] Testing en simuladores: iPhone SE, estándar, Pro Max, iPad (si se soporta)
- [x] Verificar safe areas, status bar, interrupciones (llamadas, notificaciones, background/foreground)
- [x] Verificar icono (sin alpha) y splash screen en todos los tamaños
- [x] Build de producción (Archive) + upload a App Store Connect
- [x] TestFlight: validación en dispositivo real (testeado directamente en iPhone, sin distribución TestFlight)

### Bugs de layout multi-idioma
- [x] Automatización del check: script `scripts/layout-check.mjs` (Playwright + iPhone 14 viewport) que cicla los 32 idiomas × 4 pantallas (Explorar/Jugar/Pasaporte/Stats), detecta overflow DOM y captura screenshots. Ejecutar con `npm run layout-check`. Output en `layout-check-output/` (ignorado en git)
- [x] Pills de continente: `flex-wrap: wrap` en `.continent-filter` y `.stats-pills` → saltan a 2 filas en VI/JA cuando no caben (antes: clipped 13-27 px)
- [x] Celdas bloqueadas del Pasaporte en HU: grid `min-content repeat(3, minmax(0, 1fr))` + `min-width: 0` en `.passport-cell` y `.passport-grid__level-header` (antes: «🔒45» clipped 2 px)
- [x] Nombres de nivel largos: sync `<html lang>` con i18n en `App.tsx` + `overflow-wrap: break-word` + `hyphens: auto` en `.passport-grid__level-name` y `.level-selector__level-name`. Soft hyphens (`\u00AD`) en frontera de compuesto para FI (`Selkäreppu-turisti`), DE (`Back-packer`, `Reise-leiter`), NL/SV (`Back-packer`), HU (`Háti-zsákos`, `Idegen-vezető`). `:lang()` con `hyphens: manual` en esos 5 idiomas para forzar uso exclusivo de los shy (el diccionario del navegador a veces prefería corte silábico sub-óptimo)
- [x] VI Pasaporte: continent-label con `white-space: normal` + grid `min-content` → «Châu Đại Dương» envuelve a 2 líneas, deja respirar las columnas de nivel
- [x] ES «Mochilero» truncaba en Pasaporte: ensanchado widget a 24 rem + reducido padding de `.passport-view` y `.passport-grid` (gana ~32 px; Mochilero, Guide y equivalentes caben en 1 línea)
- [x] Leyenda del Pasaporte en tema claro: movida dentro del grid guilloché (ocupa las 4 columnas con `grid-column: 1 / -1`), separador superior sutil (`border-top`) y margen `spacing-md` para respiro. Fondo glass del grid garantiza contraste en ambos temas; los 4 labels («País», «Capital», «Conseguido», «🔒 Bloqueado») se leen con claridad en claro y oscuro
- [ ] Pre-merge a main de `fix/layout-multi-idioma`: re-ejecutar `npm run layout-check` y verificar que los 10 issues previos en VI/passport-cell quedan resueltos por el fix de `min-content`. Si queda algo, último ajuste antes del merge


### iOS — Re-build (tras fix de layout multi-idioma)
- [ ] Bump `CURRENT_PROJECT_VERSION` a 2 en Xcode (App Store Connect requiere build number nuevo)
- [ ] Build de producción (Archive) + upload a App Store Connect
- [ ] Validación en dispositivo real

### iOS — Submission
- [x] Age Rating: cuestionario completado en App Store Connect (4+)
- [x] Metadata (32 idiomas): subida automatizada vía App Store Connect API (`scripts/upload-metadata.mjs`). Incluye name, subtitle, description, keywords, promotional text
- [x] App Privacy label («No data collected») — verificar que esté configurado
- [ ] Screenshots + subida a App Store Connect
  - [x] Globo en Explorar (tema claro) — 32 idiomas (`docs/stores/screenshots/globe_light/`)
  - [x] Ficha de país (tema claro) — 32 idiomas (`docs/stores/screenshots/country_card_light/`)
  - [x] Jugar: pregunta de Aventura en curso (tema claro) — 32 idiomas (`docs/stores/screenshots/play_question_light/`)
  - [x] Jugar: pregunta de Aventura en curso (tema oscuro) — 32 idiomas (`docs/stores/screenshots/play_question_dark/`)
  - [ ] Rehacer `globe_light_vi` y `country_card_light_vi` tras el fix de bugs de layout multi-idioma
  - [ ] Pasaporte con sellos ganados (tema oscuro) — hacer después del fix de layout
  - [ ] Globo con mares/océanos (tema oscuro)
  - [ ] Subir screenshots a App Store Connect (automatizar con API como metadata)
- [ ] Copyright: `© 2026 Exploris`
- [ ] Enviar a App Store Review

### Android — Setup (iniciar en paralelo con iOS Build & Test)
- [ ] Cuenta Google Play Console + verificación de identidad ($25, pago único)
- [ ] `npx cap add android` + configuración del proyecto
- [ ] Icono adaptativo (foreground + background layers, diferente del iOS)
- [ ] Orientación portrait-only en AndroidManifest.xml
- [ ] Signing: generar upload keystore (guardar en lugar seguro). Google gestiona la app signing key
- [ ] Build de producción (AAB)
- [ ] Testing en emulador y dispositivos Android reales (mínimo 2-3 resoluciones/versiones). Verificar `text-wrap: pretty/balance` (requiere Chrome 117+)

### Android — Closed Testing (lanzar cuanto antes: 14 días obligatorios)
- [ ] Data Safety form («No data collected»)
- [ ] Clasificación de contenido IARC (reutilizar cuestionario de la preparación compartida)
- [ ] Setup closed testing con ≥12 testers reales, 14 días consecutivos (requisito para cuentas personales nuevas, dic 2024)
- [ ] Subir AAB a closed testing track → esperar 14 días

### Android — Submission
- [ ] Apply for Production en Play Console (tras completar closed testing)
- [ ] Metadata Google Play + screenshots + Feature Graphic (1024×500, obligatoria)
- [ ] Enviar a revisión

### Post-lanzamiento
- [ ] (Opcional) Confirmación al salir de prueba de sello en curso (diálogo si se toca otro tab)
- [ ] (Opcional) Forzar reinicio de prueba de sello al salir a otra app
