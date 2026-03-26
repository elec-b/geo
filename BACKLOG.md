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
- [x] **Testing manual**: Todos los sellos en todos los continentes, aventura en todos los continente-nivel, feedback anotado
- [x] **UX pre-lanzamiento**: N.º de países en modal de sello, label simplificado de marcadores, orden de tabs (Explorar/Jugar/Pasaporte), persistencia de continente y sorting en Tabla, onboarding en Pasaporte

---

## Próximos pasos

> Ordenados por prioridad. Cada bloque debe completarse antes de avanzar al siguiente (salvo tareas marcadas como opcionales).

### Internacionalización
> Pre-lanzamiento. La app se lanza en todos los idiomas soportados por iOS/Android. Las tareas siguen la cadena de dependencias: a → b → c → d → e → f → g -> h.

- [x] **(a)** Librería de i18n: `i18next` + `react-i18next`
- [x] **(b)** Externalizar textos de la app a archivos de traducción. Tipos `Continent`/`GameLevel` migrados a claves neutras, Zustand persist v1 con migración automática, ~200 strings externalizados en 7 namespaces i18next
- [x] **(c)** Nombres de países desde CLDR (`Intl.DisplayNames`) + 8 overrides/es. Diff entre runs. Absorbe 24 overrides manuales
- [x] **(d)** Nombres y símbolos de moneda desde CLDR (`Intl.DisplayNames` + `Intl.NumberFormat` narrowSymbol) + 59 overrides de símbolo. Filtro de códigos no reconocidos. 5 correcciones de símbolos (CD, PE, VE, CV, SZ). Eliminadas 237 entradas manuales de monedas
- [x] **(e)** Generar datos multi-idioma: 26 idiomas (tier 1 + tier 2). Arquitectura base+i18n: `countries-base.json` (agnóstico) + `i18n/{lang}.json` (×26). CLDR para países/monedas/idiomas, Wikidata SPARQL para capitales, Claude para gentilicios/sea labels. Script refactorizado, runtime multi-idioma con caché por locale
- [x] **(f)** Validación inline: CLDR automático, Wikidata 6.162 capitales, spot-check es/en/ja/fr. Pendiente: validación profunda del dev para es e en
- [x] **(g)** UI traducida a 26 idiomas (175 archivos). i18next con lazy loading dinámico. Selector de idioma funcional en Configuración. Detección automática de idioma del dispositivo
- [ ] **(h)** Wikipedia slugs multi-idioma (solo es tiene slugs; otros idiomas no muestran enlace Wikipedia). Ampliar `fetch-wikipedia.ts` para consultar sitelinks en los 26 idiomas
- [ ] **(fix)** en algunos idiomas, e.g. japonés o ruso, en Jugar, hay que hacer scroll down para ver el botón de empezar / continuar. Pensar qué es lo mejor desde un punto de vista de UX, e.g. si hacer auto-scroll down para ver el botón, ampliar altura y anchura del modal del selector, dejarlo como está u otra cosa distinta. Hacer pequeño spike, útil para todos los idiomas.
- [ ] **(fix)** en algunos idiomas, e.g. chino, en Jugar, el selector de continente no se posiciona como los 5 anillos olímpicos, e.g. aparecen 4 continentes arriba y 1 abajo; siempre que se pueda, queremos mantener 3 arriba y 2 abajo, como los anillos de los juegos olímpicos
- [ ] **(fix)** en el selector de jugar, aparece el número de países de cada nivel en inglés, e.g. para europa-turista "10 countries", para europa-mochilero "27 contries", debería aparecer en ruso. Chequear para todos los países.
- [ ] **(check)** no tenemos griego como idioma? algún otro idioma relevante que nos hayamos dejado?
- [ ] **(check)** en configuración, qué criterio se elige para ordenar los idiomas disponibles? (solo es una pregunta, quizás no haya que cambiar nada)
- [ ] **(final-check)** Lanzar agent team, para verificar datos de internacionalización creados vs. fuentes reputadas. Similar al check que se hizo en Español frente a la RAE (apéndice del diccionario panhispánico de dudas) y otras fuentes. Crear spike sugiriendo cambios. Importante pensar también en cómo mantener esto bien automáticamente en el futuro (ya caputrado en design.md, pero es un punto muy importante y que debe estar presente a lo largo del proyecto)

### Acabados pre-lanzamiento
- [ ] Logo/branding en LoadingScreen (antes de publicar en stores)
- [ ] Diseñar e implementar tema claro
- [ ] Validación automática de coordenadas de capitales en `fetch-countries.ts` (d3.geoContains + Wikidata SPARQL como fallback). De momento funciona con CAPITAL_OVERRIDES manual (EH, GD, KI, SN)
- [ ] Revisar que los datos de la ficha de país están actualizados + asegurar que se actualicen bien en el futuro
- [ ] Actualización silenciosa de datos vía CDN (ver DESIGN.md)
- [ ] Sección «Acerca de»: explicar criterios (países ONU, fuentes UNDP, REST Countries, etc.)
- [ ] Permitir al usuario elegir un color de logo, además de los iconos de animales que ya tenemos
- [ ] En el selector de Jugar y en Pasaporte (y en cualquier otro sitio que aplique y me haya olvidado), en vez de mostrar un emoji de maleta para el nivel turista, mostrar un emoji de gafas de sol. 
- [ ] Bug: al conseguir un sello de capital, la estrella toca el doble círculo interior y se ve mal, luego se ve bien cuando se entra y se sale de pasaporte

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
