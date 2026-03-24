# Revisión de backlog: Análisis técnico

**Fecha**: 2026-03-24
**Método**: Revisión cruzada de BACKLOG.md, DESIGN.md y el codebase real (archivos fuente, scripts, configuración, datos estáticos).

---

## Evaluación de tareas existentes

### 1. Testear exhaustivamente (EN PROGRESO)

- **Viabilidad**: No es una tarea de desarrollo — es testing manual por parte del usuario. No hay tests automatizados en el proyecto (ni unitarios ni e2e). El codebase no tiene dependencias de testing (`package.json` no incluye jest, vitest, playwright, ni similares).
- **Scope**: Indefinido. "Consigue todos los sellos" y "juega para todos los continente-nivel" es un volumen de testing alto (15 combinaciones × 6 tipos + 30 pruebas de sello).
- **Riesgo**: Bajo riesgo técnico — es testing manual. Riesgo de scope: puede generar un flujo continuo de tareas de feedback que alargue indefinidamente esta fase.

---

### 2. Internacionalización (i18n) — 6 subtareas

#### 2a. [i18n] Cambiar fuente de nombres de países a CLDR + ~6 overrides/idioma

- **Viabilidad**: Alta. El spike `docs/spikes/typos-español-i18n.md` documenta en detalle los 21+ errores de REST Countries y propone CLDR como fuente autoritativa. El pipeline actual en `scripts/fetch-countries.ts` (líneas 108-110) ya tiene el mecanismo de override (`suppEntry.name ?? c.translations?.spa?.common`), lo que facilita la transición.
- **Scope**: Moderado. Implica: (1) añadir CLDR como fuente de datos en el pipeline, (2) generar un diff automático entre runs para revisión humana, (3) absorber los overrides manuales de `capitals-es.json` que ya existen. No es un cambio masivo si se hace incrementalmente.
- **Dependencias**: Independiente, pero es la base para el pipeline multi-idioma.
- **Riesgo**: Bajo. CLDR es una fuente estable y bien documentada.

#### 2b. [i18n] LLM como auditoría puntual

- **Viabilidad**: Alta. Es un paso de QA, no de pipeline. Requiere integración manual (una pasada por idioma nuevo).
- **Scope**: Bien dimensionada.
- **Riesgo**: Bajo.

#### 2c. Elegir librería de i18n

- **Viabilidad**: Alta. `i18next` + `react-i18next` es la opción estándar del ecosistema React. `react-intl` es alternativa viable.
- **Scope**: Bien dimensionada como tarea de investigación/decisión.
- **Dependencias**: Bloquea la externalización de textos.
- **Riesgo**: La elección en sí es de bajo riesgo. El impacto alto viene al externalizar textos (siguiente tarea).

#### 2d. Externalizar textos de la app a archivos de traducción

- **Viabilidad**: Alta, pero es la **tarea más grande de i18n**. Revisando el codebase:
  - **Textos hardcodeados en español**: Hay ~30 ocurrencias en 12 archivos de strings visibles al usuario (`"Configuración"`, `"Próximamente"`, `"Explorador"`, `"Aventura"`, etc.). Los componentes principales afectados son:
    - `SettingsSheet.tsx` — labels, badges
    - `PassportView.tsx` — labels de niveles, continentes
    - `LevelSelector.tsx` — textos del selector
    - `JugarView.tsx` (~1500 líneas) — modales, mensajes motivadores, labels
    - `ProfileSelector.tsx`, `ProfileEditor.tsx` — gestión de perfiles
    - `StatsView.tsx` — headers, etiquetas
    - `AppHeader.tsx` — título
  - **Datos sintéticos en `countryData.ts`**: 3 entries (SOL, CYN, AQ) con nombres hardcodeados en español (líneas 8-60). Correctamente señalado en el backlog.
  - **Tipos con valores en español**: `src/data/types.ts` define `Continent` con valores literales en español (`'África' | 'América' | ...`) y `GameLevel` con valores en español (`'turista' | 'mochilero' | 'guía'`). Esto se usa como clave en el store (`appStore.ts`), niveles (`levels.ts`), y a lo largo de todo el código. Cambiar estos tipos requiere migrar datos persistidos o mantener una capa de mapping.
  - **`isoMapping.ts`**: ~340 líneas de mapeos con comentarios en español, pero los datos son ISO codes — no requiere i18n.
- **Scope**: **Subestimada**. Debería dividirse en al menos 2 subtareas: (1) textos de UI, (2) claves internas (tipos Continent/GameLevel). El cambio de claves internas tiene impacto en datos persistidos por Capacitor Preferences.
- **Dependencias**: Depende de la elección de librería (2c).
- **Riesgo técnico alto**: Los tipos `Continent` y `GameLevel` son literales en español usados como claves de persistencia en Zustand (`appStore.ts:8-9`). Cambiarlos a identificadores neutros (`africa`, `america`, etc.) requiere una **migración de datos** del store persistido (`capacitorStorage` via Capacitor Preferences), o todos los usuarios pierden su progreso al actualizar. Esto no está contemplado en el backlog.

#### 2e. Generar datos multi-idioma

- **Viabilidad**: Alta. El pipeline en `scripts/fetch-countries.ts` ya es parametrizable (usa `translations.spa`). Extenderlo a otros idiomas es mecánico.
- **Scope**: Bien dimensionada.
- **Dependencias**: Depende de 2a (CLDR) y 2d (externalización).

#### 2f. Símbolos y nombres de moneda vía `Intl.NumberFormat` (CLDR)

- **Viabilidad**: Alta. El spike `docs/spikes/validacion-simbolos-moneda.md` documenta exhaustivamente las 3 fuentes (REST Countries, CLDR, `Intl.NumberFormat`) y recomienda `Intl.NumberFormat` con `narrowSymbol` + ~15 overrides. Es built-in en JS (cero dependencias). El codebase actual toma los símbolos de `capitals-es.json` (archivo suplementario manual de ~42 KB).
- **Scope**: Bien dimensionada.
- **Dependencias**: Independiente — puede hacerse antes del resto de i18n.
- **Riesgo**: Bajo. La investigación ya está hecha.

#### 2g. Traducción a idiomas de iOS y Android

- **Viabilidad**: Alta, pero depende de que todo lo anterior esté hecho.
- **Scope**: Enorme — implica traducir toda la UI + datos a N idiomas. No se ha definido cuántos idiomas ni cuáles.
- **Riesgo**: Moderado. La calidad de las traducciones es crítica para una app de geografía educativa.

---

### 3. Tema visual — Diseñar e implementar tema claro

- **Viabilidad**: Alta. El codebase ya usa CSS variables centralizadas en `src/styles/variables.css` (~50+ variables para colores, tipografía, espaciado). Un tema claro sería un override de las variables `--color-bg-*`, `--color-text-*`, `--glass-*` y `--shadow-*`. No hay valores hardcodeados de color en inline styles significativos.
- **Scope**: Bien dimensionada. El settings ya tiene el placeholder deshabilitado (`SettingsSheet.tsx:85-93`, badge "Próximamente"). El tipo `AppSettings.theme` en `stores/types.ts:63` ya está definido (actualmente fijo en `'dark'`).
- **Dependencias**: Ninguna fuerte. Es independiente de i18n.
- **Riesgo**: Bajo para la implementación base. Riesgo moderado para el globo Canvas — el canvas no usa CSS variables, los colores están hardcodeados en `GlobeD3.tsx` (1848 líneas). Habrá que parametrizar los colores del canvas (océano, fronteras, etiquetas, etc.).

---

### 4. Infraestructura y acabados — 6 subtareas

#### 4a. Validación automática de coordenadas de capitales

- **Viabilidad**: Alta. El backlog nota que la investigación está completa. Actualmente hay 3 overrides manuales en `scripts/fetch-countries.ts:245-249` (`CAPITAL_OVERRIDES` para EH, GD, SN). El script no usa `d3.geoContains()` ni Wikidata SPARQL — eso sería la automatización propuesta.
- **Scope**: Moderada. La nota "[PENSAR/INVESTIGAR: hay alguna fuente mejor?]" sugiere que no hay decisión firme todavía.
- **Dependencias**: Independiente.
- **Riesgo**: Bajo — el pipeline ya funciona con overrides manuales. La automatización es mejora de mantenimiento.

#### 4b. Añadir Capacitor para build Android

- **Viabilidad**: Alta. Capacitor ya está configurado para iOS (`capacitor.config.ts`, `package.json` con `@capacitor/ios`). Añadir Android es `npx cap add android` + configuración de proyecto Gradle. No hay `@capacitor/android` en `package.json` actualmente ni directorio `android/`.
- **Scope**: Potencialmente subestimada. Capacitor genera el proyecto Android, pero hay trabajo de:
  - Testing en múltiples resoluciones y versiones de Android
  - Firma del APK/AAB para Google Play
  - Configurar `npm run device` equivalente para Android
  - Posibles ajustes CSS/touch para Android (diferencias en safe areas, comportamiento de scroll, etc.)
  - El script `npm run device` está 100% orientado a iOS (Xcode, `xcrun devicectl`)
- **Dependencias**: Independiente de i18n, pero idealmente después del tema claro (Android tiene más usuarios con tema claro).
- **Riesgo**: Moderado. El código Capacitor es multiplataforma, pero el testing y ajustes fine-tune para Android pueden consumir más tiempo del esperado.

#### 4c. Actualización silenciosa de datos vía CDN

- **Viabilidad**: Alta. DESIGN.md documenta el diseño (§ Actualización automática de datos). El codebase actual NO tiene implementación alguna — los datos se cargan del bundle local (`fetch('/data/...')`). No hay código de check de versión, descarga en background, ni lógica de CDN.
- **Scope**: Moderada. Requiere: servidor (CDN con JSON versionado), lógica de versionado en la app, descarga/almacenamiento local, fallback al bundle. Capacitor Preferences o filesystem para almacenar datos actualizados.
- **Dependencias**: Independiente, pero interactúa con i18n (si los datos se generan multi-idioma, el CDN debe servir por idioma).
- **Riesgo**: Moderado. Edge cases: datos parcialmente descargados, incompatibilidad de versiones entre datos y código, tamaño de descarga multi-idioma.

#### 4d. Sección "Acerca de"

- **Viabilidad**: Alta. Es UI pura.
- **Scope**: Pequeña.
- **Dependencias**: Ninguna.
- **Riesgo**: Bajo.

#### 4e. Solicitud de valoración in-app

- **Viabilidad**: Alta. DESIGN.md documenta el diseño (§ Solicitud de valoración). No hay código implementado — ni importación de plugin Capacitor para in-app review, ni lógica de cuándo mostrar. Existe `@capacitor-community/in-app-review` como plugin.
- **Scope**: Pequeña-moderada (plugin + lógica de timing + persistencia del contador).
- **Dependencias**: Depende de Capacitor Android (4b) si se quiere hacer para ambas plataformas a la vez.
- **Riesgo**: Bajo. Las APIs nativas (SKStoreReviewController, Play In-App Review) manejan la frecuencia automáticamente.

#### 4f. Triple-verificar actualización automática para usuarios

- **Viabilidad**: Es más una tarea de verificación que de desarrollo. En iOS, App Store gestiona actualizaciones automáticamente. En Android, Google Play ídem.
- **Scope**: Pequeña — verificar configuración de distribución.
- **Riesgo**: Bajo.

---

### 5. Muy muy opcional — Forzar reinicio de prueba de sello al salir a otra app

- **Viabilidad**: Parcial. El codebase ya usa `@capacitor/app` para `appStateChange` en `GlobeD3.tsx:1620-1634` (pausar/reanudar RAF). Se podría añadir un listener similar en `App.tsx` que detecte el paso a background y cancele la prueba de sello activa. El estado `stampTestActive` en `App.tsx:71` ya gestiona esto.
- **Scope**: Pequeña (un listener + reset de estado). Pero tiene implicaciones de UX: ¿qué pasa si el usuario recibe una llamada? ¿Un mensaje de WhatsApp? Forzar reinicio podría ser frustrante.
- **Riesgo**: Bajo técnicamente. Riesgo de UX moderado — la decisión de diseño es más importante que la implementación.

---

## Deuda técnica no reflejada en el backlog

### 1. Archivos monolíticos

- **`GlobeD3.tsx`**: 1848 líneas. Es el archivo más grande del proyecto con diferencia. Contiene renderizado canvas, hit testing, animaciones flyTo, inercia, zoom, pinch, drag, labels, sea labels, hulls, marcadores, overrides, y lifecycle management. No está modularizado.
- **`JugarView.tsx`**: 1499 líneas. Contiene toda la lógica de juego, modales, pruebas de sello, feedback, y coordinación entre tipos.
- Estos archivos no bloquean funcionalidad nueva, pero dificultan el mantenimiento y aumentan el riesgo de regresiones al modificarlos.

### 2. Migración de datos persistidos para i18n

Como se señaló en la evaluación de la tarea 2d: los tipos `Continent` (`'África'`, `'América'`...) y `GameLevel` (`'turista'`, `'mochilero'`, `'guía'`) son strings en español usados como **claves de persistencia** en Zustand/Capacitor Preferences. Una implementación de i18n que cambie estos valores requiere migrar los datos existentes de todos los usuarios, o mantener un mapping permanente de español→clave neutra. Esto debería ser una tarea explícita antes de o junto con la externalización de textos.

### 3. Sin tests automatizados

El proyecto no tiene ningún framework de testing configurado. No hay tests unitarios para el algoritmo de aprendizaje (`learningAlgorithm.ts`, 654 líneas), ni para la generación de niveles (`levels.ts`), ni para el hit testing, ni para el store. El testing es enteramente manual vía `npm run device`. Para el algoritmo de aprendizaje — que tiene reglas complejas de dominio, herencia, inferencia, avance colectivo, y regresión — la falta de tests es un riesgo silencioso.

### 4. DESIGN.md desactualizado en animación de estrella

DESIGN.md (§ Estilo visual, línea ~407) dice: "La estrella (★) gira simultáneamente con efecto «trompo» (10 vueltas en 3s, ease-out)." El CSS real en `PassportView.css:236` usa `1800deg` (5 vueltas), coherente con el último commit `2186f1e` que cambió de 10 a 5 vueltas. **DESIGN.md no se actualizó.**

### 5. Ausencia de esquema de actualización del store

`appStore.ts` usa `zustand/persist` con `capacitorStorage`, pero no tiene **versión de esquema** ni migración. Si se añade un campo al estado (ej. nuevos settings para i18n, nuevas propiedades de perfil), los usuarios existentes tendrán `undefined` en esos campos. Zustand persist soporta `version` + `migrate`, pero no está configurado. Esto es relevante para cualquier cambio al schema del store.

---

## Dependencias entre tareas

```
2c (elegir lib i18n)
  └──→ 2d (externalizar textos)
        └──→ 2g (traducir idiomas)
        └──→ [NUEVA: migración de claves Continent/GameLevel]

2a (CLDR como fuente)
  └──→ 2e (datos multi-idioma)
        └──→ 2g (traducir idiomas)

2f (símbolos moneda Intl) → independiente

3 (tema claro) → independiente

4b (Android) → independiente
  └──→ 4e (in-app review, si se quiere ambas plataformas)

4c (CDN) → independiente, pero interactúa con 2e (datos multi-idioma)

4a (validación capitales) → independiente
4d (acerca de) → independiente
5 (reinicio sello background) → independiente
```

**Cadena crítica de i18n**: 2c → 2d → migración de datos → 2g. La tarea 2d es la más compleja y contiene un riesgo oculto (migración de claves persistidas).

---

## Observaciones sobre DESIGN.md

### Divergencias código ↔ documentación

1. **Animación de estrella**: DESIGN.md dice "10 vueltas" (línea ~407). El código dice 1800deg = 5 vueltas. El commit `2186f1e` hizo este cambio. DESIGN.md no se actualizó.

2. **Tipo `AppSettings.theme`**: DESIGN.md dice "Claro / Oscuro" como opciones (§ Configuración, línea ~491). El tipo real en `stores/types.ts:63` es `theme: 'dark'` (literal fijo, no union type). Esto es coherente con el placeholder "Próximamente" en la UI, pero la documentación no refleja que por ahora solo existe dark.

3. **Tipo `AppSettings.locale`**: Similar — DESIGN.md dice "Todos los soportados por iOS/Android". El tipo real es `locale: 'es'` (literal fijo). Coherente con la UI ("Próximamente"), pero DESIGN.md no lo refleja.

### Contenido correcto y bien mantenido

- La documentación del algoritmo de aprendizaje (§ Algoritmo de aprendizaje) coincide con el código en `learningAlgorithm.ts` y `gameQuestions.ts`.
- La estructura de archivos de datos (§ Estructura de archivos de datos) coincide con `public/data/`.
- La política de territorios y estándar de países coincide con `isoMapping.ts`.
- El diseño de estadísticas y sellos coincide con los stores y componentes.
- Los centroides visuales y overrides documentados coinciden con los datos.

### Contenido que podría mejorarse

- No se menciona que `GlobeD3.tsx` (1848 líneas) y `JugarView.tsx` (1499 líneas) son los dos archivos centrales del proyecto y potenciales cuellos de botella para la mantenibilidad.
- No se documenta el esquema de persistencia (Zustand persist + Capacitor Preferences) ni la ausencia de migraciones de versión. Esto es relevante para cualquier cambio futuro al estado.
- Los scripts de generación de datos (`scripts/`) están documentados en la estructura, pero no se documenta el flujo completo: `npm run fetch-data` → REST Countries API → `capitals-es.json` → `countries.json` + `capitals.json`. El pipeline tiene dependencias externas (REST Countries, Wikipedia) que podrían fallar.
