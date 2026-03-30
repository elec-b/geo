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
- [x] **UX general**: Bottom sheets con drag-to-dismiss, selección de texto deshabilitada, feedback verde/rojo al 5%, colores olímpicos unificados, anti-viudas tipográficas (`text-wrap: pretty/balance`), fix animación sello capital (limpieza de `--animating`), emoji de nivel Turista cambiado de 🧳 a 📸
- [x] **Testing manual**: Todos los sellos en todos los continentes, aventura en todos los continente-nivel, feedback anotado
- [x] **UX pre-lanzamiento**: N.º de países en modal de sello, label simplificado de marcadores, orden de tabs (Explorar/Jugar/Pasaporte), persistencia de continente y sorting en Tabla, onboarding en Pasaporte. Persistencia de modo Explorar (Globo/Tabla) entre tabs, reset a Globo+Todos al abrir app
- [x] **Internacionalización**: 32 idiomas (26 base + 6 ampliación) + 5 variantes regionales. i18next con lazy loading y plurales CLDR. Datos multi-idioma: CLDR (países/monedas/idiomas), Wikidata SPARQL (capitales/Wikipedia slugs), Claude (gentilicios/mares). 175 archivos UI, 6682 Wikipedia slugs. Verificación contra fuentes autoritativas (32 idiomas). ~100 overrides de nombres, fixes de layout multi-idioma, selector de idioma en bottom sheet dedicado
- [x] **Logo/branding**: Globo wireframe SVG (blanco→gris, paralelos curvos, glow sutil). LoadingScreen con logo + título "Exploris". Icono iOS 1024×1024 y splash screens generados desde SVG. Script `generate-icons.mjs`
- [x] **Acerca de**: Pantalla completa con secciones colapsables (países, cómo aprender, tipos de juego, estadísticas, fuentes). Icono info en header. Namespace i18n `about` (es + en + 30 placeholders)

---

## Próximos pasos

> Ordenados por prioridad. Cada bloque debe completarse antes de avanzar al siguiente (salvo tareas marcadas como opcionales).

### Acabados pre-lanzamiento
- [x] (**mejora**) Columna de nivel en tabla de Explorar (icono 📸/🎒/🗺️, sorting por tier, header 🏆 en gris)
- [ ] (**mejora**) En Pasaporte, en los continente-nivel bloqueados, mostrar el número de países debajo del candado
- [ ] (**mejora**) Cambié algunas cosas del about.json en español... Pero no en los otros idiomas. Volver a repetir traducciones para todos los idiomas de la app.
- [ ] Cuando se crea un nuevo perfil:
    - cerrar la sesión actual (salir del Juego o de la prueba de Sello o de las Estadísticas que haya en curso; quizás lo más fácil sea simplemente ir a Explorar)
    - al introducir el nombre, no tener que borrar la palabra "Explorador". El usuario debe poder escribir directamente su nombre. Si no se escribe nada el nombre será Explorador (y podemos seguir mostrando la palabra como la opción por defecto, pero el color de la fuente será apagado)
    - [ ] Permitir al usuario elegir un color de logo, además de los iconos de animales que ya tenemos
- [ ] Refinar tema oscuro.
    - Buscar tonos más en escala de negros y grises en vez de tantos tonos azules
    - Si cambia, asegurar que todo es coherente, incluyendo el logo / icono, que ahora tiene fondo azul
- [ ] Diseñar e implementar tema claro
- [ ] Actualizar HDI/IDH-D: regenerar `hdi.json` desde el Excel oficial del HDR 2025 (spike en `docs/spikes/auditoria-datos-ficha.md` — 192 de 194 países desactualizados + errores de origen). Idealmente con script automatizado
- [ ] Validación automática de coordenadas de capitales en `fetch-countries.ts` (d3.geoContains + Wikidata SPARQL como fallback). De momento funciona con CAPITAL_OVERRIDES manual (EH, GD, KI, SN)
- [ ] Auditar y migrar TODAS las fuentes de datos, asegurar que en la actualidad se mantienen: REST Countries fue archivado en junio 2024 (datos de población congelados, desfase <7% en países grandes). Evaluar World Bank API o UN Stats como reemplazo. Abordar junto con la tarea de CDN. Detalle de algunos datos de la ficha en `docs/spikes/auditoria-datos-ficha.md`
- [ ] Actualización silenciosa de datos vía CDN (ver DESIGN.md)
- [x] Nombre de la app: **Exploris** (spike en `docs/spikes/naming-app.md` — 23 nombres evaluados, nombre anterior inviable por colisión directa)

### Preparación y publicación iOS
- [ ] Fix orientación: eliminar landscape de Info.plist (la UI es portrait-only). Decidir si se soporta iPad
- [ ] Privacy policy en URL pública (la app no recopila datos — declararlo explícitamente). Landing page mínima (GitHub Pages): privacy policy + URL de soporte
- [ ] Certificados y provisioning profiles de distribución (actualmente solo Debug)
- [ ] Build de producción (Archive / Release)
- [ ] Versionado: 0.1.0 → 1.0.0 (package.json + MARKETING_VERSION + CURRENT_PROJECT_VERSION en Xcode)
- [ ] Testing en simuladores: iPhone SE, iPhone estándar, iPhone Pro Max, iPad (si se soporta)
- [ ] Verificar safe areas, status bar, interrupciones (llamadas, notificaciones, background/foreground)
- [ ] Verificar icono (sin alpha) y splash screen en todos los tamaños
- [ ] Metadata App Store Connect: nombre, subtítulo, descripción, palabras clave, categoría (Educación), copyright, URLs. Ver tips de ASO/descubrimiento en `docs/spikes/naming-app.md` § 7
- [ ] Screenshots (3-5, resolución 6.9" reutilizable para todos los tamaños)
- [ ] Clasificación por edad: general audience 4+ (NO categorizar como «directed to children» — evita restricciones de Kids Category y parental gates para el enlace a Wikipedia)
- [ ] Enviar a App Store Review
- [ ] (Recomendado) Solicitud de valoración in-app (SKStoreReviewController) — alto ROI, bajo esfuerzo

### Preparación y publicación Android
- [ ] Cuenta Google Play Console + verificación de identidad ($25, pago único)
- [ ] `npx cap add android` + configuración del proyecto
- [ ] Testing en emulador y dispositivos Android reales (mínimo 2-3 resoluciones/versiones). Verificar `text-wrap: pretty/balance` (requiere Chrome 117+, agosto 2023)
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
