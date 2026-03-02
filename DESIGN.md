# GeoExpert

## Filosofía de diseño
- **Estética**: «Premium dark mode» (con tema claro como opción futura). Diseño limpio, oscuro y minimalista. Azules profundos, negros, acentos neón (cian/púrpura/ámbar).
- **Interacción**: Animaciones fluidas. Sin recargas de página bruscas. El globo siempre es el protagonista.
- **Feedback**: Corrección visual inmediata (destellos verde/rojo), háptica en móvil. Sin efectos de sonido (por ahora).

---

## Datos base
*   **Países y capitales**: Estándar internacional según la ONU (ver sección «Estándar de países» más abajo).
*   **Continentes**: 5 (África, América, Asia, Europa, Oceanía).

---

## Las 3 experiencias de la app

La aplicación se divide en **3 experiencias**:

| Experiencia | Descripción | Objetivo |
|-------------|-------------|----------|
| **Jugar** | Camino guiado con retos | Subir de nivel de forma divertida |
| **Explorar** | Exploración libre del globo | Familiarizarse sin presión |
| **Pasaporte** | Dashboard de progreso | Ver qué sabe el usuario |

---

## Sistema de niveles

### Los 3 niveles
| Nivel | Conocimiento requerido | Color del pasaporte |
|-------|------------------------|---------------------|
| **Turista** | Top 10 países más poblados de cada continente (top 5 en Oceanía) | Verde |
| **Mochilero** | 60% de los países de cada continente | Azul |
| **Guía** | 100% de los países de cada continente | Dorado |

### Progresión por continente
*   El usuario tiene un **nivel independiente por cada continente**. Puede ser "Guía de Europa" mientras es "Turista de África".
*   Cada combinación de nivel × continente es una **vía de progresión independiente** (3 × 5 = 15 vías). Para desbloquear el siguiente nivel en un continente, el usuario debe conseguir ambos sellos (Países y Capitales) del nivel actual.
*   **Nivel global** = el mínimo de los 5 continentes. Este es el nivel que el usuario puede "presumir" como resumen.
*   El **color del pasaporte** cambiará según el nivel global del usuario.

### Público objetivo
Personas de 8 a 15 años, pero diseñado para ser entretenido también para adultos.

---

## El pasaporte de explorador

El pasaporte es la **metáfora central** de la app. Representa el progreso del usuario como una matriz de 3 niveles × 5 continentes. El objetivo es llenar el pasaporte de sellos e ir subiendo de nivel.

### Los 2 sellos
Para certificar que el usuario domina un nivel-continente, debe conseguir ambos sellos:

| Sello | Descripción | Tipo de juego |
|-------|-------------|---------------|
| **Sello de Países** | Ubicar cualquier país del nivel en el mapa | Tipo A (texto → mapa) |
| **Sello de Capitales** | Ubicar cualquier capital del nivel en el mapa | Tipo B (texto → mapa) |

*   **Ambos sellos son necesarios** para completar un nivel-continente. Conseguir ambos sellos desbloquea el siguiente nivel en ese continente.
*   **0 errores requeridos**: el usuario debe completar la prueba sin fallos para conseguir el sello.
*   **Sin límite de intentos**: el usuario puede repetir la prueba de sello tantas veces como quiera. El requisito de 0 errores ya es filtro suficiente, y cada reintento es práctica valiosa.
*   **Acceso**: El usuario puede intentar las pruebas desde Pasaporte (siempre disponible) o desde Jugar (cuando el algoritmo de aprendizaje lo invita).
*   **Fallos compartidos**: Los fallos en las pruebas de sello alimentan el registro de fallos compartido (ver § Jugar > Algoritmo de aprendizaje).

### Registro de fallos
Los fallos del usuario se registran en un sistema compartido (ver § Jugar > Algoritmo de aprendizaje). Tanto el entrenamiento en Jugar como las pruebas de sello alimentan este registro.

---

## Jugar

**La piedra angular de la app.** El camino guiado para ir subiendo de nivel progresivamente. Es la experiencia más divertida y la que más tiempo ocupará.

### Flujo general
1.  El usuario selecciona **continente**.
2.  El usuario selecciona **nivel** (solo los desbloqueados):
    - Turista: siempre disponible.
    - Mochilero: se desbloquea al conseguir ambos sellos de Turista en ese continente.
    - Guía: se desbloquea al conseguir ambos sellos de Mochilero en ese continente.
3.  El usuario pulsa **Empezar** → juega en modo **Aventura** (todos los tipos combinados).
    — O selecciona un tipo de juego concreto + Empezar → juega solo ese tipo.

### Tipos de juego

Organizados por orden pedagógico (de iniciación a certificación):

| Tipo | Nombre | Mecánica | Propósito |
|------|--------|----------|-----------|
| E | ¿Qué país es? | País resaltado → elegir nombre (4 opciones) | Reconocimiento visual |
| C | País → Capital | «¿Capital de Francia?» → elegir (4 opciones) | Aprender capitales (dato) |
| D | Capital → País | «París es la capital de…?» → elegir (4 opciones) | Aprender capitales (inverso) |
| F | ¿Cuál es su capital? | País resaltado + capital → elegir capital (4 opciones) | Capitales con ubicación |
| A | Señala el país 🔖 | Nombre del país → tocar en el globo | Preparación sello de países |
| B | Señala la capital 🔖 | Nombre de la capital → tocar en el globo | Preparación sello de capitales |

🔖 = Preparación para prueba de sello (badge visual en el selector).

Cada tipo mantiene su comportamiento visual:
*   **A/B**: Zoom + contexto continental. Feedback en 2 pasos al fallar.
*   **C/D**: Perspectiva continental → zoom al país tras responder. Pines de capitales.
*   **E/F**: País resaltado en dorado. Zoom adaptativo (×40 para microestados).

### Modo Aventura (por defecto)

Si el usuario pulsa Empezar sin elegir tipo, juega en modo **Aventura**: todos los tipos combinados con orden pedagógico.

*   Las preguntas siguen una **progresión adaptativa por país**, basada en la etapa de aprendizaje de cada uno (ver § Algoritmo de aprendizaje):
    1. **E** — reconocer países visualmente.
    2. **C y D** — asociar país ↔ capital (dato puro).
    3. **F** — capitales con ubicación en el mapa.
    4. **A y B** — preparación directa para las pruebas de sello.
*   La selección de tipo se basa en la etapa de aprendizaje de cada país. La progresión natural lleva de E (reconocimiento) hacia A/B (preparación sello), pero el ritmo se adapta individualmente a cada país.
*   El algoritmo pondera más los tipos que el usuario necesita reforzar (ver § Algoritmo de aprendizaje).
*   Dentro del modo Aventura, el usuario puede probar A y B como **simulacro** de las pruebas de sello.
*   **Barra de progreso**: «X de Y países listos para sello». Cuando se completa → mensaje invitando al usuario a intentar las pruebas.

### Modo tipo concreto

El usuario elige un tipo específico y juega exclusivamente ese tipo.

*   **Barra de progreso**: «X de Y países dominados» en ese tipo para el nivel-continente actual.
*   Si el usuario domina todos los países del continente en ese nivel para ese tipo → mensaje de felicitación.

### Algoritmo de aprendizaje

Sistema compartido entre Jugar y Pruebas de sello (Pasaporte). Ambas experiencias alimentan el mismo registro de intentos.

#### Registro de intentos

Se registra cada intento del usuario con esta granularidad: **perfil × nivel × continente × país × tipo de juego**.

Para cada combinación se almacena:
*   **Aciertos**: total acumulado.
*   **Fallos**: total acumulado.
*   **Racha**: aciertos consecutivos (se resetea a 0 al fallar).

El registro es **compartido**: tanto Jugar (en todos los modos) como las Pruebas de sello alimentan los mismos datos.

#### Dominio

El **dominio** de un país en un tipo de juego se determina por la racha de aciertos consecutivos:

| Racha | Estado | Descripción |
|-------|--------|-------------|
| Sin intentos | — | Nunca preguntado |
| 0 | Necesita refuerzo | Falló recientemente |
| 1 | En progreso | Un acierto, aún no consolidado |
| ≥ 2 | Dominado | Responde de forma fiable |

#### Etapa de aprendizaje por país (modo Aventura)

En modo Aventura, cada país tiene una **etapa de aprendizaje** que determina qué tipo de pregunta priorizar. Las etapas siguen el orden pedagógico de los tipos de juego:

| Etapa | Tipo(s) | Se avanza cuando... |
|-------|---------|---------------------|
| 1. Reconocimiento | E | Domina E (racha ≥ 2) |
| 2. Capitales | C, D | Domina C y D |
| 3. Ubicación asistida | F | Domina F |
| 4. Preparación sello | A, B | Domina A y B → país completado |

*   La etapa se **deriva** de los datos del registro (no se almacena por separado).
*   Es **progresiva**: una vez alcanzada una etapa, no se regresa aunque baje la racha de un tipo anterior. El mecanismo de refuerzo se encarga de recuperar los fallos (ver «Selección de preguntas»).
*   **No es un bloqueo estricto**: todos los tipos pueden aparecer en cualquier momento, pero el algoritmo favorece fuertemente los tipos de la etapa actual del país.

#### Selección de preguntas

**En modo Aventura**, cada pregunta se genera con dos decisiones: **qué país** preguntar y **qué tipo** usar.

**1. Selección de país** (cola de prioridad):
1.  **Refuerzo**: Países con racha = 0 en algún tipo ya intentado (acaban de fallar).
2.  **Nuevos**: Países sin intentos en los tipos de su etapa actual.
3.  **En progreso**: Países con racha = 1 (un acierto, no consolidado).
4.  **Mantenimiento**: Países completados (baja frecuencia, para refrescar).

**2. Selección de tipo**: Según la etapa de aprendizaje del país seleccionado. Si la etapa tiene varios tipos (ej. etapa 2: C y D), se alterna entre ellos.

**3. Anti-repetición**: Un país no se repite hasta que se hayan preguntado al menos otros N países (N = mín(3, total_países ÷ 2)).

**En modo tipo concreto**: La misma cola de prioridad para selección de país, pero el tipo es siempre el elegido.

#### Barra de progreso

**En modo Aventura**:
*   Muestra la preparación para las pruebas de sello.
*   Métrica: países del nivel-continente donde el usuario domina A **y** B (racha ≥ 2 en ambos).
*   Texto: «X de Y países listos para sello».
*   Al completarse (X = Y) → mensaje «¡Ya estás listo para las pruebas de sello!»

**En modo tipo concreto**:
*   Muestra el dominio de ese tipo en el nivel-continente.
*   Métrica: países del nivel-continente donde el usuario domina ese tipo (racha ≥ 2).
*   Texto: «X de Y países dominados».
*   Al completarse → mensaje de felicitación.

**Elementos comunes**:
*   Barra visual (0-100%) proporcional a X / Y.
*   Contador de aciertos y fallos de la sesión actual.
*   Botón para salir de la partida.

#### Detección de preparación para sello

*   Solo activa en modo Aventura.
*   Criterio: **todos** los países del nivel-continente dominan A y B (racha ≥ 2 en ambos).
*   Cuando se cumple → barra llena → mensaje de invitación a las pruebas de sello.
*   El usuario puede intentar las pruebas antes del 100% (acceso siempre disponible desde Pasaporte).

### Prueba de sellos (dentro de Jugar)
El usuario puede intentar las pruebas desde aquí (cuando el algoritmo lo invita) o desde Pasaporte. Ver § «El pasaporte de explorador > Los 2 sellos» para requisitos (0 errores, sin límite de intentos).

---

## Explorar

Un espacio seguro para explorar. El objetivo es familiarizarse con la ubicación y las formas de los países, así como con sus capitales, de manera libre.

La experiencia ofrece dos modos de exploración, accesibles mediante un control segmentado:

### Globo
Vista interactiva del globo terráqueo. El usuario puede tocar un país → se ilumina → aparece su ficha de país.
*   **Posición inicial**: Cada vez que se abre la app, el globo comienza en una longitud aleatoria (latitud fija en el ecuador), para que el usuario no siempre vea la misma región.
*   **Ficha de país**: Bandera, nombre completo del país (sin truncar), capital, continente, población (y ranking), superficie (y ranking), densidad de población (y ranking), moneda, gentilicio, idioma(s), IDH (y ranking), IDH-D (y ranking) y enlace a Wikipedia. La ficha se muestra pegada al borde inferior de la pantalla (encima del tab bar). Todos los campos textuales se muestran en el idioma de la app.
    - **Moneda**: Nombre traducido al idioma de la app + símbolo universal entre paréntesis. Ej: "Euro (€)", "Dólar estadounidense ($)".
    - **Idioma(s)**: Idiomas oficiales a nivel nacional, ordenados de más a menos hablantes, separados por coma. Máximo 3 visibles; si hay más, se trunca con "…". Los nombres se muestran en el idioma de la app (ej. "Francés", no "French").
    - **Criterio de idiomas**: Se listan únicamente los idiomas reconocidos oficialmente a nivel nacional/constitucional. Los idiomas cooficiales regionales (ej. catalán en España, sardo en Italia) no se incluyen. Este criterio es objetivo, reproducible y consistente entre países.
    - **IDH / IDH-D**: Índice de Desarrollo Humano (IDH) e IDH ajustado por Desigualdad (IDH-D). Fuente: UNDP. IDH-D muestra "N/D" si no está disponible. Cada métrica lleva icono (i) con tooltip descriptivo.
    - **Enlace a Wikipedia**: Botón que abre el artículo del país en Wikipedia en el idioma de la app. Si el artículo no existe en ese idioma, enlaza a la versión en inglés.
*   **Capital**: Círculo cian sobre la ubicación de la capital. Se muestra al seleccionar un país y también permanentemente cuando el toggle de etiquetas de capitales está activo.

### Tabla
Tabla de países con sus capitales y población, diseñada para facilitar el repaso.
*   **Columnas**: País (con bandera), Capital, Población (formato adaptado: «1.4B», «45M», «800k»).
*   **Ordenamiento**: Los headers de columna son tappables y permiten ordenar ascendente/descendente por país, capital o población. Por defecto siempre se ordena de mayor a menor población.
*   **Agrupación**: Si el filtro es un continente específico → tabla de ese continente. Si el filtro es «Todos» → tabla única sin agrupación por continentes.
*   **Interacción — tocar país**: Zoom al país + marca en la capital + se muestra el globo.
*   **Interacción — tocar capital**: Zoom de precisión al punto exacto + pin distintivo + país resaltado + se muestra el globo.
*   **Affordance**: Los nombres de países y capitales deben tener un indicador visual sutil que sugiera que son tappables.
*   **Toggle territorios no-ONU**: Interruptor para mostrar/ocultar territorios no reconocidos por la ONU. Por defecto: solo territorios ONU.

### Controles comunes
*   **Filtros de continente**: Pills horizontales para aislar continentes (ej. «solo África»). Al seleccionar un continente, el globo rota automáticamente para orientar la vista hacia él.
*   **Etiquetas** (solo en modo Globo):
    - Toggle «Países»: Activa/desactiva nombres de países sobre el globo.
    - Toggle «Capitales»: Activa/desactiva nombres de capitales sobre el globo. Cuando está activo, los círculos de las capitales se muestran permanentemente.
*   **Globo 3D**: Siempre se usa el globo terráqueo, nunca mapas planos.

### Anti-solapamiento de etiquetas
Las etiquetas de países y capitales sobre el globo deben ser legibles a cualquier nivel de zoom:
*   **Zoom lejano**: Mostrar solo países con mayor superficie o relevancia visual, evitando solapamiento.
*   **Zoom progresivo**: Añadir más etiquetas conforme aumenta el zoom.
*   **Zoom cercano**: Mostrar todas las etiquetas de la región visible.
*   **País y capital propios**: La etiqueta de un país no debe solaparse con la de su propia capital, especialmente cuando la capital está centrada en el país.
*   **Centro visual**: Revisar la ubicación de etiquetas para países con formas irregulares (ej. Francia) — el centroide geométrico no siempre es el mejor punto visual.
*   **Prioridad por población**: Cuando etiquetas de distintos países o capitales compiten por el mismo espacio (ej. Roma vs. Ciudad del Vaticano), priorizar la de mayor población. Solo al hacer zoom suficiente se muestran todas. Esto aplica tanto a etiquetas de capitales entre sí como a la mezcla de etiquetas de países y capitales.

---

## Pasaporte

El dashboard que muestra el progreso del usuario: su pasaporte con los sellos conseguidos.

### Dashboard
Matriz visual de **niveles × continentes** (3 filas × 5 columnas). Cada celda muestra:
- Sello de Países: conseguido o pendiente
- Sello de Capitales: conseguido o pendiente

### Acceso a los sellos
Desde el dashboard, el usuario puede intentar conseguir cualquier sello pendiente (sin límite de intentos).

---

## Estadísticas

Vista que muestra el registro de intentos del usuario de forma visual. Accesible desde un **icono en el header**, junto al icono de perfil (a su derecha). Disponible desde cualquier pantalla.

### Contenido
*   Selector de nivel × continente.
*   Tabla de países con indicadores de dominio por tipo de juego (E, C, D, F, A, B).
*   Indicadores visuales por celda: dominado, en progreso, necesita refuerzo, sin datos.
*   Totales agregados: aciertos y fallos globales del nivel-continente.

### Acciones
*   **Resetear estadísticas**: Por nivel-continente (con confirmación). Borra todos los intentos de ese nivel-continente para el perfil activo.

---

## Perfiles de usuario

La app soporta **múltiples perfiles** en un mismo dispositivo.

### Gestión de perfiles
- **Sin límite** de perfiles (el usuario crea los que necesite)
- Cada perfil tiene su propio pasaporte y progreso independiente
- **Cambio rápido**: Desde cualquier pantalla, tap en el avatar → selector de perfil
- **Sin contraseñas**: Los perfiles son locales y de confianza (contexto familiar)

### Creación de perfil
- **Nombre**: Por defecto "Explorador" para el primer perfil. Los siguientes usan nombres únicos automáticos ("Explorador 2", "Explorador 3"...). El usuario puede cambiar el nombre.
- **Avatar**: Selección de 12-15 iconos de animales, representativos y característicos de los 5 continentes. Debe haber animales de tierra, mar y aire.

---

## Configuración

Configuración **ultra-sencilla**. Solo lo esencial, organizada en dos niveles:

### a) Configuración global (pantalla de inicio)

| Ajuste | Opciones | Por defecto |
|--------|----------|-------------|
| Perfil activo | Selector de perfiles | Último usado |
| Marcadores de microestados | On/Off | On |
| Vibración | On/Off | On |
| Idioma de la app | Todos los soportados por iOS/Android | Idioma del teléfono (fallback: inglés) |
| Tema claro/oscuro | Claro / Oscuro | Oscuro |

### b) Configuración del globo (durante la interacción)

Subconjunto de la configuración global, accesible mientras se interactúa con el globo:

| Ajuste | Opciones | Por defecto |
|--------|----------|-------------|
| Marcadores de microestados | On/Off | On |
| Tema claro/oscuro | Claro / Oscuro | Oscuro |

**Nota sobre tema claro/oscuro**: Tarea de baja prioridad, a implementar cuando la app esté prácticamente terminada. La identidad visual principal sigue siendo el dark mode.

**Nota sobre etiquetas de países/capitales**: Son controles exclusivos de la experiencia Explorar (ver § Explorar), no forman parte de la configuración general.

**Filosofía**: Sin menús complicados. La app debe funcionar bien "out of the box".

**Internacionalización**: La app se traduce a todos los idiomas que soporten iOS y Android. Se usa el idioma del sistema por defecto.

---

## Solicitud de valoración (In-App Review)

La app invita al usuario a valorarla en App Store / Google Play de forma **no intrusiva**, usando las APIs nativas de cada plataforma:

- **Mecanismo**: `SKStoreReviewController` (iOS) y Google Play In-App Review API (Android). Ambas muestran un diálogo nativo del sistema — no un popup custom de la app.
- **Momento**: Se muestra tras una experiencia positiva (ej. conseguir un sello, subir de nivel) y solo después de un uso mínimo (varias sesiones o varios días desde la instalación).
- **Frecuencia**: iOS limita automáticamente a 3 solicitudes por app y año. Android tiene restricciones similares. La app respeta estos límites y no insiste.
- **Sin bloqueo**: Nunca interrumpe una partida ni un flujo activo. El usuario puede ignorar el diálogo sin consecuencia alguna.

---

## Motor de renderizado

### D3.js con proyección ortográfica + Canvas 2D

La app usa **D3.js (`d3-geo`)** con **proyección ortográfica** sobre **Canvas 2D** para renderizar el globo terráqueo.

**Características clave**:
- **Proyección ortográfica**: simula la vista de la Tierra desde el espacio. Fiel a las superficies reales de los países (sin distorsión Mercator)
- **Canvas 2D**: rendering directo sin WebGL ni tiles. Elimina artefactos de tile boundaries
- **100% offline**: funciona con GeoJSON local empaquetado, sin servicios externos
- **Licencia**: ISC (D3.js)
- **Bundle**: ~30 KB gzip (`d3-geo`)

**Por qué D3 y no MapLibre**: MapLibre GL JS v5 tiene globe projection, pero produce artefactos visibles (seams en tile boundaries) al reproyectar tiles Mercator sobre la esfera. Es un problema arquitectural sin solución a corto plazo (ver `docs/spikes/pmtiles-vs-d3.md`). D3 renderiza los polígonos directamente sobre la esfera sin tiles intermedios, eliminando los artefactos por completo.

**Nota sobre la proyección**: `geoOrthographic()` no es una proyección de áreas iguales, pero la distorsión es mínima en el centro de la vista y equivalente a mirar un globo terráqueo físico desde cualquier ángulo. El usuario puede rotar para centrar cualquier país.

---

## Fuentes de datos

### Datos geométricos (mapas)
- **Fuente**: Natural Earth Data vía `world-atlas` (NPM)
- **Resolución**: 1:50m (incluye Baleares, Canarias, Caribe, Oceanía; equilibrio detalle/rendimiento)
  - ⚠️ Tuvalu (11 000 hab.) no está incluido en 50m
- **Formato**: TopoJSON
- **Almacenamiento**: Empaquetado en el bundle de la app

### Datos de países
- **Fuente**: REST Countries v3.1
- **Filtro**: Solo países reconocidos por la ONU (193 miembros + 2 observadores = 195)
- **Campos utilizados**:
  - `cca2`: Código ISO 3166-1 alpha-2 (clave primaria)
  - `translations.{lang}.common`: Nombre del país en el idioma destino
  - `capital`: Nombre de la capital (traducido vía archivo suplementario)
  - `population`, `area`: Para la ficha
  - `flags.svg`: URL de bandera
  - `currencies`: Nombre (traducido vía suplementario) y símbolo
  - `languages`: Idiomas oficiales (traducidos vía suplementario)
  - `demonyms`: Gentilicio (completado vía suplementario)
- **Tamaño**: ~150 KB (gzipped)

### Actualización automática de datos
- **Estrategia**: Verificación silenciosa al abrir la app (si hay conexión)
- **Funcionamiento**:
  1. Al iniciar, la app compara versión local vs versión en servidor
  2. Si hay nueva versión, descarga en background (~200 KB)
  3. El usuario nunca nota la actualización
- **Servidor**: JSON estático en CDN (GitHub Pages, Cloudflare, etc.)
- **Frecuencia real**: Los datos de países cambian muy poco (~1-2 veces/año)
- **Offline**: La app siempre funciona con datos locales empaquetados

### Coordenadas de capitales
- **Fuente**: REST Countries v3.1 (`capitalInfo.latlng`)
- **Formato**: JSON local generado por `npm run fetch-data`
- **Tamaño**: ~8 KB

### Estructura de archivos de datos
```
public/data/
├── countries-50m.json # TopoJSON de países (1:50m)
├── countries.json     # Datos de países (generado por fetch-countries.ts)
└── capitals.json      # Coordenadas y nombres de capitales

scripts/data/
└── capitals-{lang}.json  # Traducciones de capitales (suplementario, ver § Internacionalización de datos)
```

### Internacionalización de datos
El script `fetch-countries.ts` genera `countries.json` y `capitals.json` en el idioma configurado. Sin fallback a inglés: si falta una traducción, el script reporta error.

*   **Nombres de países**: `translations.{lang}.common` de REST Countries v3.1. Disponible para ~25 idiomas.
*   **Nombres de capitales**: REST Countries no traduce capitales. Se usa un archivo suplementario `scripts/data/capitals-{lang}.json` con las traducciones necesarias.
*   **Gentilicios**: `demonyms.{lang}.m` de REST Countries. Para países sin gentilicio en el idioma destino, se completa en el archivo suplementario.
*   **Nombres de monedas**: REST Countries devuelve `currencies[].name` solo en inglés. Se traducen en el archivo suplementario.
*   **Símbolos de monedas**: `currencies[].symbol` de REST Countries es universal (€, $, ¥) — no requiere traducción.
*   **Nombres de idiomas**: REST Countries devuelve `languages` en inglés. Se traducen en el archivo suplementario. **Criterio de selección**: solo idiomas oficiales a nivel nacional/constitucional (no regionales ni cooficiales autonómicos).
*   **Slugs de Wikipedia**: Slug del artículo Wikipedia para cada país y cada idioma soportado. Se construyen y validan en el pipeline de datos. Se almacenan en los datos estáticos para evitar links rotos en runtime.
*   **Fuente suplementaria (multi-idioma)**: Wikidata (SPARQL) para capitales, monedas, idiomas, slugs de Wikipedia y otros datos que REST Countries no cubra. Para español solo, basta un archivo manual por idioma (actualmente `scripts/data/capitals-es.json`; se ampliará con los campos adicionales).
*   **Validación con LLM**: Como capa final de QA, un LLM revisa el dataset generado y reporta anomalías (nombres en idioma incorrecto, ortografía, incoherencias). No genera traducciones — solo valida.
*   **Pipeline completo**: REST Countries → Wikidata (gaps) → Validación LLM → Revisión humana (si hay flags) → CDN.
*   **Idioma actual de generación**: Español (`spa`). Cuando se implemente i18n completa, se generarán archivos por idioma o un JSON multi-idioma.

### Identificadores
- **Clave primaria**: ISO 3166-1 alpha-2 (`cca2`)
- **Vinculación**: GeoJSON ↔ REST Countries ↔ Capitales

### Estándar de países
- **Criterio**: Solo países reconocidos por la ONU
- **Total**: 195 países (193 miembros + 2 observadores: Vaticano y Palestina)
- **Fuera del juego**: Territorios no reconocidos (Kosovo, Taiwán, etc.) no participan en el sistema de niveles/sellos (ver subsección siguiente)
- **Ventaja**: Evita controversias políticas y simplifica mantenimiento

### Territorios no reconocidos por la ONU
Algunos territorios aparecen en los datos geográficos (Natural Earth 1:50m) pero no son miembros ni observadores de la ONU (ej. Sáhara Occidental, Kosovo, Taiwán):

*   **Son seleccionables** en la experiencia Explorar: al tocar, se muestra la ficha de país con un indicador claro de que NO es reconocido por la ONU.
*   Se muestran todos los datos disponibles (bandera, capital, población, superficie, moneda, gentilicio).
*   **No participan en el sistema de juego** (niveles, sellos, pruebas) — solo son visibles en Explorar.
*   **Color de etiquetas diferenciado**: En el globo, las etiquetas (nombre de país y capital) de estos territorios se muestran en un color distinto al de los países ONU, para distinguirlos visualmente.
*   **Visibilidad en la tabla**: ver § «Explorar > Tabla > Toggle territorios no-ONU».
*   **Continente asignado**: Cada territorio debe tener un continente asignado para que los filtros de continente funcionen correctamente (ej. Sáhara Occidental → África). Al filtrar por otro continente, se oscurecen como cualquier otro país.
*   **Datos**: El script `fetch-countries.ts` debe incluir estos territorios marcados con `unMember: false`.

### Antártida
A diferencia de los territorios no-ONU (que son estados de facto con población y gobierno), la Antártida es un caso especial único: no es un país ni un territorio soberano. Está gobernada por el Tratado Antártico (1959, 53 países firmantes). No tiene población permanente, capital, moneda ni gentilicio.

*   **Etiqueta en el globo**: Sí. Es el territorio más grande (~14M km²) sin ser un país; omitir su nombre sería un gap evidente en una app de geografía.
*   **Seleccionable con ficha especial**: Al tocar, muestra superficie y texto informativo sobre el Tratado Antártico. No muestra campos vacíos/irrelevantes (capital, población, moneda...).
*   **No aparece en la tabla**: No es un país — no tiene capital ni población.
*   **No participa en el juego**: No es un país.
*   **Color de etiqueta**: Ámbar (como territorios no-ONU).
*   **Continente**: Valor especial — no pertenece a ninguno de los 5 continentes de la app. Los filtros de continente la ignoran.
