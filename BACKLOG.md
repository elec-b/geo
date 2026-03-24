# Backlog de GeoExpert

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
- [x] **Estadísticas**: Dos pestañas (Jugar + Pruebas de sello). Toggle ✓/%, código de colores, sorting por columna, defaults inteligentes según origen, aviso de permanencia de sellos
- [x] **Perfiles**: Multi-perfil con avatares, cambio rápido, progreso independiente, limpieza de sesión al cambiar
- [x] **Configuración**: Bottom sheet (vibración, idioma, tema, marcadores, mares/océanos). Feedback háptico
- [x] **UX general**: Bottom sheets con drag-to-dismiss, selección de texto deshabilitada, feedback verde/rojo al 5%, colores olímpicos unificados, anti-viudas tipográficas (`text-wrap: pretty/balance`)

---

## Próximos pasos

> Ordenados por prioridad. Cada bloque debe completarse antes de avanzar al siguiente (salvo tareas marcadas como opcionales).

### Terminar testing manual
- [X] Consigue todos los sellos para todos los continentes
- [X] Juega al menos en aventura para todos los continente-nivel
- [X] Anota feedback en backlog.md

### UX pre-lanzamiento
- [x] Mostrar n.º de países en modal de prueba de sello («Deberás completar X preguntas sin ningún error»)
- [x] Simplificar label «Marcadores de microestados y archipiélagos» → «Marcadores de islas y países pequeños»
- [x] Cambiar orden de tabs: Explorar, Jugar, Pasaporte
- [ ] En Explorar > Tabla, mostrar última acción relacionada (último continente-nivel de prueba de sello, último continente-nivel jugado, último continente-nivel de la tabla). Confirmar que entiendes lo que digo antes de implementar nada
- [ ] (Opcional) Onboarding mínimo para primera ejecución (2-3 tooltips o modal de bienvenida)

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
