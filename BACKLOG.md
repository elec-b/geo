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
- [x] **Preparación lanzamiento (iOS + Android)**: In-app review (`@capacitor-community/in-app-review`, trigger tras sello ganado, ≥5 sesiones y ≥7 días). Orientación portrait-only (phones) + landscape libre (tablets). i18n de strings hardcodeados (perfil «Explorador», fallbacks de preguntas, labels de avatares en 32 idiomas). Hulls de archipiélago con colores de feedback (verde/rojo/ocre). Regeneración al vuelo de pregunta al cambiar idioma (incl. cola pendiente de prueba de sello). Versión 1.0.0 (`package.json` + MARKETING_VERSION). Privacy Policy + Support URL servidas desde repo `exploris-data` (GitHub Pages); sección «Privacidad» in-app en About (32 idiomas). Age rating 4+ (respuestas en `docs/stores/age-rating.md`, reutilizables para IARC)
- [x] **Bugs layout multi-idioma**: Script `scripts/layout-check.mjs` (Playwright + iPhone 14, 32 idiomas × 5 pantallas, detección de overflow DOM + screenshots, `npm run layout-check`). Fixes: `flex-wrap: wrap` en `.continent-filter` y `.stats-pills` (VI/JA), grid `min-content repeat(3, minmax(0, 1fr))` + `min-width: 0` en Pasaporte (HU «🔒45», VI continent-label), container queries (`container-type: inline-size` + `clamp()` con `cqi`) en LevelSelector y PassportView para nombres de nivel escalables, `hyphens: manual` global (solo FI mantiene soft hyphen), leyenda del Pasaporte dentro del grid guilloché con `grid-column: 1 / -1`. Pre-merge: 0 issues en 32 idiomas
- [x] **iOS submission (v1.0.0 build 2)**: Certificados y provisioning de distribución. App record en App Store Connect. Export compliance (`ITSAppUsesNonExemptEncryption = NO` en Info.plist). Testing en simuladores (iPhone SE/estándar/Pro Max/iPad) + safe areas, interrupciones, icono sin alpha, splash screens. Build Archive + upload (build 1, luego build 2 tras fix layout multi-idioma). Screenshots: 5 × 32 idiomas iPhone 6.7" en `docs/stores/screenshots/{globe_light,country_card_light,play_question_light,play_question_dark,passport_dark}/` + 1 × 32 idiomas iPad 13" — subida vía `scripts/upload-screenshots.mjs` (APP_IPHONE_67, 1206×2622 → 1290×2796) y `scripts/upload-ipad-screenshots.mjs` (APP_IPAD_PRO_3GEN_129, 2064×2752 → 2048×2732). Metadata 32 idiomas + Privacy/Support URLs vía `scripts/upload-metadata.mjs` (App Store Connect API). Declaraciones ASC: App Privacy «Data Not Collected», DAC7 (no servicios personales), Content Rights (terceros con licencias abiertas), Copyright «© 2026 Exploris», Age Rating 4+. Enviado a revisión 2026-04-17; respondido petición de info adicional 2026-04-18 (notas ampliadas en `docs/stores/app-review-notes.md` + screen recording desde iPhone real, enviado vía App Review page)

---

## Próximos pasos

> Ordenados por prioridad. Cada bloque debe completarse antes de avanzar al siguiente (salvo tareas marcadas como opcionales).

### Android — Setup
- [x] `npx cap add android` + configuración del proyecto. `@capacitor/android@8.3.1`, 4 plugins detectados (app, haptics, preferences, in-app-review), `JAVA_HOME`/`ANDROID_HOME` en `~/.zshrc` (JDK 21 bundled de Android Studio), scripts `device:android` y `device:android:live` en `package.json`, `CLAUDE.md § 5` documentado
- [x] Orientación portrait-only (teléfonos) y landscape libre (tablets, `sw600dp`). `android:screenOrientation="@integer/screen_orientation"` en MainActivity + recursos condicionados (`values/integers.xml` = 1 portrait, `values-sw600dp/integers.xml` = 13 fullUser)

### Android — Ajustes UX (rama propia — importante mantener compatibilidad con iOS / iPhone)

> Todas las tareas de este bloque se trabajan en **una única rama compartida:** fix/android-ux. Merge a `main` solo cuando todas estén completadas y verificadas en dispositivo; después se continúa con **Android — Build & Publish**.
- [x] **Android UX — Safe insets**: Tab bar y layout respetan la barra de navegación del sistema (gestos / 3 botones). Edge-to-edge en `MainActivity.java` + listener que propaga insets del sistema a CSS variables `--sat/--sar/--sab/--sal` vía `evaluateJavascript`. 11 hojas de estilo migradas de `env(safe-area-inset-*)` a `var(--sa*)` con fallback a `env()` para iOS. TabBar y AppHeader usan `calc(base + inset)`
- [x] **Android dev workflow — cable USB**: `npm run device:android:cable` y `device:android:cable:live` (adb -d, sin env var) validados en Samsung Galaxy A56 — build+install+launch en segundos. Reemplaza al wireless TLS (`device:android`) como opción preferida para iterar. Emulador descartado en este Mac (Intel + AMD Radeon Pro 560X): `gfxstream` cuelga el boot y `swiftshader_indirect` no representa perf real
- [x] **Bug rotación de estrella del sello**: el glyph ★ (U+2605) no está centrado dentro de su em-box en fuentes fallback de Samsung/Chromium, así que `transform: rotate()` sobre el `::after` inline usaba un pivote descentrado. Fix en `PassportView.css`: el `::after` pasa a ser una caja absoluta (`position: absolute; inset: 0`) que renderiza una estrella SVG de 5 puntas centrada geométricamente en viewBox 24×24 vía `mask-image` (con fallback `-webkit-mask`). Color preservado vía `background-color: var(--cell-color)`. `position: relative` añadido al padre como containing block explícito. Verificado en Android (Galaxy A56) e iOS sin regresión.
- [x] Safe areas del sistema (status bar, notch/punch-hole, barra de navegación): verificar en todas las pantallas (Explorar, Jugar, Pasaporte, Stats, Acerca de, bottom sheets) que nada quede tapado ni con padding excesivo
- [x] **Android — Botón atrás físico/gestual**: Stack LIFO de handlers (`src/stores/backHandlerStore.ts`) con hook `useBackHandler(enabled, fn)` (`src/hooks/useBackHandler.ts`). Listener central solo Android en `App.tsx` (`@capacitor/app`): `pop()` del stack; si vacío, `exitApp()`. Handlers registrados por cada overlay: Settings/Language (Language vuelve a Settings al cerrar), About, ProfileSelector, ProfileEditor, Stats, ficha de país (Explorar), modal celda (Pasaporte), StampChooser/AlreadyDominated/PoolExhausted/StampResult (Jugar), y pantalla playing de Jugar (vuelve al selector; si hay prueba de sello en curso, la cancela y dispara `onStampTestDone` para volver a Pasaporte). Verificado en Galaxy A56; iOS no afectado (early return por plataforma).
- [x] `text-wrap: pretty/balance` compat con Chrome 117+: verificado en Samsung Galaxy A56 en 5 idiomas (de, fi, hu, vi, es) — balanceo de títulos y anti-viudas funcionan correctamente. Samsung actualiza WebView vía Play Store, así que el fallback no llega a aplicarse en la práctica
- [ ] Icono adaptativo (foreground + background layers, diferente del iOS). Generar desde el SVG existente de `scripts/generate-icons.mjs`
- [ ] Testing UX final en emulador (distintos tamaños) y dispositivo real tras aplicar todos los fixes — smoke test de las 3 experiencias (Explorar, Jugar, Pasaporte) + sellos + cambio de perfil + idiomas clave

### Android — Build & Publish
- [ ] Signing: generar upload keystore (guardar en lugar seguro). Google gestiona la app signing key
- [ ] Build de producción (AAB)
- [ ] Crear app en Google Play Console
- [ ] Data Safety form («No data collected»)
- [ ] Clasificación de contenido IARC (reutilizar respuestas de `docs/stores/age-rating.md`)
- [ ] Metadata 32 idiomas (ya generada en `docs/stores/metadata/`, crear script de subida para Play Console)
- [ ] Screenshots para Google Play (reutilizar los de iPhone o generar nativos con barra de Android)
- [ ] Feature Graphic (1024×500, obligatoria en Google Play — banner promocional, no screenshot)
- [ ] Enviar a revisión

### Post-lanzamiento
- [ ] (Opcional) Confirmación al salir de prueba de sello en curso (diálogo si se toca otro tab)
- [ ] (Opcional) Forzar reinicio de prueba de sello al salir a otra app
