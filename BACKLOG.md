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
- [ ] Clasificación por edad: 4+ (iOS) / Everyone (Android). Dos cuestionarios separados (Apple tiene el suyo propio en App Store Connect; Google usa IARC vía Play Console). NO categorizar como «directed to children» — evita Kids Category / Families Policy (incompatibles con el enlace a Wikipedia). Respuestas preparadas en `docs/stores/age-rating.md` (enlace Wikipedia verificado como externo en iPhone); pendiente de transcribir a las consolas cuando existan los app records + verificar comportamiento equivalente en Android tras `cap add android`

### iOS — Build & Test
- [ ] Certificados y provisioning profiles de distribución (actualmente solo Debug)
- [ ] Crear app record en App Store Connect
- [ ] Export compliance: `ITSAppUsesNonExemptEncryption = NO` en Info.plist (HTTPS al CDN es cifrado del sistema, exento)
- [ ] MARKETING_VERSION + CURRENT_PROJECT_VERSION en Xcode (sync con package.json)
- [ ] Testing en simuladores: iPhone SE, estándar, Pro Max, iPad (si se soporta)
- [ ] Verificar safe areas, status bar, interrupciones (llamadas, notificaciones, background/foreground)
- [ ] Verificar icono (sin alpha) y splash screen en todos los tamaños
- [ ] Build de producción (Archive)
- [ ] TestFlight: subir build, validar instalación + CDN + permisos en dispositivo real (5-7 días)

### iOS — Submission
- [ ] Metadata en App Store Connect + App Privacy label («No data collected») + screenshots (3-5, resolución 6.9" reutilizable para todos los tamaños)
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
