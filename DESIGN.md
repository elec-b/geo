# GeoExpert

## Filosofía de diseño
- **Estética**: «Premium dark mode» (con tema claro como opción futura). Diseño limpio, oscuro y minimalista. Azules profundos, negros, acentos (púrpura/ámbar) y azules fríos.
- **Interacción**: Animaciones fluidas. Sin recargas de página bruscas. El globo siempre es el protagonista.
- **Feedback**: Corrección visual inmediata (filtro verde/rojo al 5% de opacidad), háptica en móvil (acierto: tap ligero único; error: doble tap ligero; toggles: tap ligero). Sin efectos de sonido (por ahora).

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
| Nivel | Conocimiento requerido |
|-------|------------------------|
| **Turista** | Top 10 países más poblados de cada continente (top 5 en Oceanía) |
| **Mochilero** | 60% de los países de cada continente |
| **Guía** | 100% de los países de cada continente |

### Progresión por continente
*   El usuario tiene un **nivel independiente por cada continente**. Puede ser "Guía de Europa" mientras es "Turista de África".
*   Cada combinación de nivel × continente es una **vía de progresión independiente** (3 × 5 = 15 vías). Para desbloquear el siguiente nivel en un continente, el usuario debe conseguir ambos sellos (Países y Capitales) del nivel actual.
*   **Nivel global** = el mínimo de los 5 continentes. Este es el nivel que el usuario puede "presumir" como resumen.

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
*   **Mensajes motivadores al no superar**: El modal muestra título y texto dinámicos según rendimiento: ≥90% «¡Muy cerca!», 70-89% «¡Buen intento!», 50-69% «Vas por buen camino», <50% «No te rindas».
*   **Tab bar durante prueba de sello**: Independientemente del origen (Pasaporte o Jugar), la tab bar muestra Pasaporte como pestaña activa mientras dura la prueba.
*   **Acceso**: El usuario puede intentar las pruebas desde Pasaporte (siempre disponible) o desde Jugar (cuando el algoritmo de aprendizaje lo invita).
*   **Acceso directo (Jugar)**: Cuando solo queda **un sello pendiente** en el nivel-continente, la app lanza directamente la prueba correspondiente sin mostrar modal de elección. El modal de elección solo aparece cuando faltan ambos sellos. Aplica desde el banner del selector y los modales de fin de sesión de Jugar. En Pasaporte se mantiene el modal con los sellos pendientes.
*   **Registro separado**: Las pruebas de sello tienen su propio registro de intentos, independiente de Jugar. Los fallos en pruebas de sello no afectan el algoritmo de aprendizaje de Jugar.

---

## Jugar

**La piedra angular de la app.** El camino guiado para ir subiendo de nivel progresivamente. Es la experiencia más divertida y la que más tiempo ocupará.

### Flujo general
1.  El usuario selecciona **continente**.
2.  El usuario selecciona **nivel** (solo los desbloqueados):
    - Turista: siempre disponible.
    - Mochilero: se desbloquea al conseguir ambos sellos de Turista en ese continente.
    - Guía: se desbloquea al conseguir ambos sellos de Mochilero en ese continente.
3.  El usuario pulsa **Empezar** → juega en modo **Aventura** (todos los tipos combinados, opción por defecto y destacada).
    — O expande «Elegir tipo concreto» y selecciona un tipo específico + Empezar → juega solo ese tipo.

### Selector de tipo de juego

El selector separa **Aventura** (opción principal) de los tipos concretos (opción avanzada):

- **Aventura** se presenta como botón de ancho completo con icono 🧭 y subtítulo «Se adapta a lo que sabes». Seleccionado por defecto. Estilo diferenciado con accent azul.
- **«o elige juego concreto ▾»**: separador con líneas horizontales y toggle colapsable (cerrado por defecto). Al expandir, muestra una grid 2×3 con los 6 tipos usando sus iconos y nombres cortos (ver § Nomenclatura visual).
  - Separador visual sutil entre los 4 tipos de opciones (E/C/D/F) y los 2 de señalar/examen (A/B).
  - A y B muestran badge 🔖.
  - Al seleccionar un tipo concreto, Aventura se deselecciona (y viceversa).
  - El estado colapsado/expandido no se persiste — siempre arranca colapsado.

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

### Nomenclatura visual de tipos de juego

Cada tipo tiene un **ID interno** (E/C/D/F/A/B) usado en el código, y una **nomenclatura visual** para el usuario basada en dos símbolos:

- **◯** = país (círculo grande, U+25EF — renderizado con `font-size: 1.2em` para diferenciarlo visualmente)
- **◎** = capital (bullseye, U+25CE — círculo pequeño con punto central)

Y un modificador de mecánica:
- **?** = quiz con opciones (los tipos sin **?** son de señalar en el globo)

| Interno | Icono | Nombre visible | Descripción |
|---------|-------|----------------|-------------|
| E | ◯? | Identifica país | País resaltado en el globo → elegir nombre (opciones) |
| C | ◯→◎ | País a capital | Nombre del país → elegir capital (opciones) |
| D | ◎→◯ | Capital a país | Nombre de la capital → elegir país (opciones) |
| F | ◎? | Identifica capital | Capital resaltada en el globo → elegir nombre (opciones) |
| A | ◯ | Señala el país | Nombre del país → tocar en el globo |
| B | ◎ | Señala la capital | Nombre de la capital → tocar ubicación en el globo |

Los iconos se usan en el selector de tipo de juego y en los headers de la tabla de estadísticas. Los modales y textos largos usan los **nombres visibles** en prosa (e.g. «¡Fenomenal! **País a capital** superado»).

Cada tipo mantiene su comportamiento visual:
*   **A/B**: Zoom + contexto continental. Feedback en 2 pasos al fallar.
*   **C/D**: Perspectiva continental → zoom al país tras responder. Pines de capitales.
*   **E/F**: País resaltado en dorado. Zoom adaptativo (×40 para microestados).

### Modo Aventura (por defecto)

Si el usuario pulsa Empezar sin elegir tipo, juega en modo **Aventura**: todos los tipos combinados con orden pedagógico.

*   Las preguntas siguen una **progresión adaptativa por país**, basada en la etapa de aprendizaje de cada uno (ver § Algoritmo de aprendizaje):
    1. **E** — reconocer países visualmente.
    2. **C, D y F** — aprender y asociar capitales.
    3. **A y B** — preparación directa para las pruebas de sello.
*   La selección de tipo se basa en la etapa de aprendizaje de cada país. La progresión natural lleva de E (reconocimiento) hacia A/B (preparación sello), pero el ritmo se adapta individualmente a cada país.
*   El algoritmo pondera más los tipos que el usuario necesita reforzar (ver § Algoritmo de aprendizaje).
*   Dentro del modo Aventura, el usuario puede probar A y B como **simulacro** de las pruebas de sello.
*   **Barra de progreso**: «XX% completado» (ver § Barra de progreso para detalle del cálculo).

### Modo tipo concreto

El usuario elige un tipo específico y juega exclusivamente ese tipo.

*   **Barra de progreso**: «X de Y países dominados» en ese tipo para el nivel-continente actual.
*   Si el usuario domina todos los países del continente en ese nivel para ese tipo → modal de fin de sesión con felicitación y sugerencia de siguiente paso (ver § Modal de fin de sesión).

### Tipo/modo ya completado

Cuando el usuario selecciona un tipo concreto (o modo Aventura) donde todos los países/capitales ya están dominados, la sesión no tiene preguntas pendientes. En lugar de iniciar una sesión vacía, se intercepta **antes** de empezar y se muestra un modal informativo.

**Indicador visual en el selector**: Las pills de tipo de juego muestran un **✓** sutil junto al nombre si el tipo está 100% dominado para el nivel-continente seleccionado. La pill sigue siendo seleccionable (no deshabilitada).

**Modal pre-sesión** (se muestra al pulsar Empezar/Continuar con tipo/modo ya completado):

**Tipo concreto E/C/D/F**:
*   Título: «Ya dominas *[tipo]*».
*   Texto: «Has acertado todos los países. Puedes resetear las estadísticas para volver a practicar.»
*   Botones: «Ir a Estadísticas» (acción principal), «Seleccionar otro juego» (cierre).

**Tipo concreto A/B**:
*   Título: «Ya dominas *[tipo]*».
*   Texto: «Has acertado todos los países. Puedes resetear las estadísticas para volver a practicar.»
*   Si el sello correspondiente no está ganado: botón adicional «Intentar prueba de sello» (acción principal).
*   Botones: [«Intentar prueba de sello»], «Ir a Estadísticas», «Seleccionar otro juego» (cierre).

**Modo Aventura**:
*   Título: «Entrenamiento completado».
*   Si faltan sellos por ganar:
    - Texto: «Has completado el entrenamiento de *[continente]* en nivel *[nivel]*.»
    - Botones de prueba de sello: solo los sellos **no ganados**.
    - Botones: [«Sello de Países»], [«Sello de Capitales»], «Ir a Estadísticas», «Seleccionar otro juego» (cierre).
*   Si ambos sellos están ganados:
    - Texto: «Has completado *[continente]* en nivel *[nivel]*. Puedes resetear las estadísticas para volver a practicar.»
    - Botones: «Ir a Estadísticas», «Seleccionar otro juego» (cierre).

### Algoritmo de aprendizaje

Sistema de aprendizaje exclusivo de Jugar. Las pruebas de sello tienen su propio registro independiente (ver § Estadísticas > Pruebas de sello).

#### Registro de intentos

Se registra cada intento del usuario con esta granularidad: **perfil × nivel × continente × país × tipo de juego**.

Para cada combinación se almacena:
*   **Aciertos**: total acumulado.
*   **Fallos**: total acumulado.
*   **Racha**: En acierto: `racha = max(1, racha + 1)`. En fallo: si racha > 0 → racha = 0; si racha ≤ 0 → racha -= 1. La regla `max(1, ...)` garantiza que **un solo acierto siempre lleva a dominio**, sin importar la racha previa. La racha negativa mide la persistencia de fallos.

El registro es **exclusivo de Jugar**: las pruebas de sello tienen su propio almacenamiento independiente (`stampAttempts`).

#### Dominio

Un solo acierto (racha ≥ 1) basta para considerar un país **dominado** en un tipo. La certificación real la dan las pruebas de sello (0 errores en todos los países). Los tipos A y B (localizar en el mapa) no admiten azar, lo que refuerza la fiabilidad del dominio.

| Racha | Estado |
|-------|--------|
| Sin intentos | Nunca preguntado |
| ≤ -2 | Fallo persistente (trigger de regresión) |
| -1 | Necesita refuerzo |
| 0 | Fallado (último intento fue un fallo) |
| ≥ 1 | Dominado |

**Nota**: Con la regla `max(1, ...)`, racha=0 solo se alcanza por fallo (desde racha > 0). Nunca se llega a racha=0 por acierto. Esto elimina la situación confusa de «acertar y no estar dominado».

**Inferencia ascendente**: Un acierto en un tipo difícil implica dominio en los tipos más fáciles que miden la misma habilidad:
*   Acierto en **A** (localizar país) → domina **E** (reconocer país).
*   Acierto en **B** (localizar capital) → domina **C**, **D** y **F** (conocer capital).

En la tabla de estadísticas, los tipos dominados por inferencia se muestran con **✓ gris** (no verde), porque el usuario no los ha verificado directamente. Si el usuario luego acierta el tipo inferido de forma directa, el ✓ gris pasa a verde.

#### Etapa de aprendizaje por país (modo Aventura)

En modo Aventura, cada país tiene una **etapa de aprendizaje** que determina qué tipo de pregunta priorizar:

| Etapa | Tipo(s) | Se avanza cuando... |
|-------|---------|---------------------|
| 1. Reconocimiento | E | Domina E (racha ≥ 1) |
| 2. Capitales | C, D, F | Domina C, D o F (racha ≥ 1 en cualquiera) |
| 3. Preparación sello | A, B | Domina A y B → país completado |

*   La etapa se **deriva** de los datos del registro (no se almacena por separado).
*   **Regresión individual**: aunque el avance colectivo empuja a todos los países hacia adelante, un país individual puede **regresar** si muestra fallos persistentes. Criterio: si algún tipo de su etapa actual alcanza racha ≤ -2 (3+ fallos consecutivos), el país regresa a la etapa anterior. La cascada es natural: si sigue fallando en la etapa anterior, vuelve a regresar. Esto permite detectar aciertos casuales en etapas tempranas y reconstruir desde la base.
*   **No es un bloqueo estricto**: todos los tipos pueden aparecer, pero el algoritmo favorece los de la etapa actual del país.

#### Avance colectivo

Las etapas no requieren que cada país avance individualmente. Cuando hay evidencia suficiente de que el usuario domina la etapa actual, **todos los países del nivel-continente avanzan** a la siguiente:

*   **Criterio**: Al menos el **40%** de los países (mínimo 3) dominan la etapa actual (racha ≥ 1 en los tipos de esa etapa).
*   No se exige un umbral de precisión global. El 40% de dominio ya es filtro suficiente, y los países que avanzan sin haber sido testeados entran como «nuevos» en la siguiente etapa, donde deberán demostrar su conocimiento.
*   Los países no testeados en etapas anteriores **saltan** directamente a la etapa actual.
*   El objetivo es evitar que un usuario que ya sabe tenga que demostrar su conocimiento país por país en cada tipo.

#### Selección de preguntas

**En modo Aventura**, cada pregunta se genera con dos decisiones: **qué país** y **qué tipo**.

**1. Selección de país** (cola de prioridad):
1.  **Refuerzo**: Países con racha < 0 en algún tipo de su etapa actual (prioridad: racha más negativa primero).
2.  **Nuevos**: Países sin intentos en los tipos de su etapa actual.
3.  **En progreso**: Países parcialmente testeados en su etapa actual.

Los países que dominan su etapa actual **no se preguntan** (ver § Etapa de aprendizaje por país para los criterios de avance de cada etapa). El pool activo se reduce naturalmente conforme el usuario avanza.

**Excepción anti-monotonía**: Si quedan ≤ 2 países pendientes en el pool activo, se intercala con un **país compañero** elegido entre los ya dominados — el que peor precisión histórica tenga (el que más le costó en el pasado). Esto evita la repetición obsesiva de los mismos 1-2 países.

**Fin de pool**: Cuando todos los países dominan su etapa actual, se muestra el **modal de fin de sesión** (ver § Modal de fin de sesión).

**2. Selección de tipo**: Según la etapa del país. Si la etapa tiene varios tipos (ej. etapa 2: C, D, F), se prioriza el tipo no dominado con peor racha.

**3. Anti-repetición**: Un país no se repite hasta que se hayan preguntado al menos otros N países, donde N = mín(8, pool_activo / 2). El buffer se calcula sobre el pool activo (no el total de países), garantizando alternancia incluso con pools reducidos.

**En modo tipo concreto**: Misma cola de prioridad con tipo fijo. Los países dominados en ese tipo salen del pool. Al dominar todos → modal de fin de sesión.

#### Barra de progreso

**En modo Aventura**:
*   Métrica: **progreso ponderado por etapas con crédito gradual**. En vez de crédito binario (dominado/no dominado), cada tipo aporta un factor según la racha del país en ese tipo:

    | Racha | Estado | Factor |
    |-------|--------|--------|
    | ≥ 1 | Dominado | 1.0 |
    | 0 | Fallado | 0.5 |
    | -1 | Necesita refuerzo | 0.25 |
    | ≤ -2 / sin intentos | Fallo persistente / nuevo | 0.0 |

    Contribución de cada país (sobre 100 puntos):

    ```
    factor(E) × 20 + factor(mejor_CDF) × 30 + factor(A) × 25 + factor(B) × 25
    ───────────────────────────────────────────────────────────────────────────
                                      100
    ```

    Así, cada transición de racha (acierto o fallo) mueve la barra de forma granular, sin esperar al dominio completo.
*   El progreso global es la media de todos los países del nivel-continente.
*   Texto: «XX% completado».
*   La barra refleja el estado real en todo momento (sin high-water mark). Las bajadas por regresión se suavizan con animación.
*   Países avanzados por avance colectivo sin haber sido testeados: reciben el crédito de la etapa que saltaron (para que la barra no contradiga el avance del algoritmo).

**En modo tipo concreto**:
*   Métrica: países con dominio en ese tipo (racha ≥ 1).
*   Texto: «X de Y países dominados».

**Elementos comunes**: barra visual (0-100%), contador de sesión (aciertos/fallos). La barra de progreso **solo muestra datos** — no contiene banners ni mensajes contextuales. Toda comunicación de hitos (felicitaciones, invitaciones a sello, sugerencias de progresión) se gestiona mediante el modal de fin de sesión.

#### Modal de fin de sesión

Se muestra cuando el pool de preguntas se agota (todos los países dominan la etapa/tipo actual). Es el **único canal** para comunicar hitos al usuario. Tres variantes según el modo de juego:

**Modo Aventura**:
*   El pool se agota cuando el 100% de los países dominan A y B (barra al 100%). Esto equivale a estar listo para las pruebas de sello.
*   Título motivador + invitación a prueba de sello: solo los sellos **no ganados** (si ambos ganados, no se muestran botones de sello).
*   Botón de cierre: «Seleccionar otro juego».
*   El usuario puede intentar las pruebas antes (siempre disponible desde Pasaporte).
*   La prueba de sello verifica el **100%** de los países con **0 errores** — es la certificación real.

**Modo tipo concreto A/B**:
*   Si el sello correspondiente no está ganado: título motivador («¡Fenomenal! *[tipo]* superado») + invitación a la prueba de sello (Países o Capitales según el tipo).
*   Si el sello ya está ganado: título motivador + solo botón «Seleccionar otro juego».

**Modo tipo concreto E/C/D/F**:
*   Título motivador: «¡Fenomenal! *[tipo]* superado» (nombre del tipo en cursiva).
*   Dos botones al mismo nivel (sin jerarquía visual):
    - «Jugar *[siguiente tipo]*» — siguiente tipo no dominado según progresión pedagógica (primero tipos de la misma etapa, luego de la siguiente: E → C/D/F → A/B). Solo visible si existe un tipo no dominado.
    - «Jugar *Aventura*» — cambia al modo guiado.
*   Botón de cierre: «Seleccionar otro juego».
*   Si todos los tipos (E/C/D/F/A/B) están dominados: título motivador + solo botón «Seleccionar otro juego» (las invitaciones a sello se gestionan en A/B).

#### Herencia de progreso entre niveles

Cuando el usuario desbloquea un nuevo nivel (tras conseguir ambos sellos del nivel anterior), los países del nivel anterior reciben **crédito heredado** en el nuevo nivel.

**Qué se hereda**:
*   Los países del nivel anterior reciben datos sintéticos en **tipos E, C, D y F** (racha sintética = 1). Semántica:
    - **Sello de países** (prueba tipo A aprobada) → hereda **E** (si sabes localizar un país, sabes nombrarlo).
    - **Sello de capitales** (prueba tipo B aprobada) → hereda **C, D y F** (si sabes localizar la capital, sabes las preguntas de texto).
*   **A y B nunca se heredan** — deben jugarse en cada nivel. Esto garantiza que el usuario demuestre localización en el mapa con el nuevo conjunto de países.
*   La herencia es **transitiva**: Guía hereda de Mochilero, que hereda de Turista.

**Mecanismo**: La herencia se calcula en **tiempo de lectura** (derivación), no se materializa como datos persistidos. Al consultar los intentos de un nivel, se mezclan los datos propios con los heredados del nivel anterior. Los datos propios siempre tienen prioridad. El trigger es la **existencia de ambos sellos** del nivel anterior (no los datos de intentos).

**Visibilidad**: Los países heredados muestran **✓ gris** en los tipos E, C, D y F en la tabla de estadísticas, al igual que cualquier tipo dominado por inferencia ascendente (ver § Estadísticas > Contenido). Los tipos A y B aparecen como **—** (sin datos). El usuario distingue lo que ha probado personalmente (✓ verde) de lo heredado/inferido (✓ gris).

**Impacto en el juego**:
*   **Tipos E, C, D y F**: Los países heredados **no se preguntan** en estos tipos (dominados por herencia). Se asume dominio suficiente porque el usuario aprobó las pruebas de sello del nivel anterior.
*   **Tipos A y B**: Los países heredados **sí se preguntan**, como países normales en etapa 3 (sin prioridad especial). Al no tener datos de A/B, se clasifican como «nuevos» en la cola de prioridad del algoritmo.
*   **Barra de progreso**: Los países heredados arrancan con crédito **50/100** (E=20 + CDF=30). La barra sube gradualmente a medida que se dominan A y B. Esto garantiza que la barra no pueda llegar a 100% hasta que el pool de preguntas se agote.
*   **Avance colectivo**: Los países heredados **no cuentan** para el umbral del 40%. El avance colectivo se calcula solo sobre los países nuevos en ese nivel.
*   **Pruebas de sello**: La herencia **no exime** de la prueba: el 100% de los países del nivel se evalúan con 0 errores.

### Prueba de sellos (dentro de Jugar)
El usuario puede intentar las pruebas desde aquí (cuando el algoritmo lo invita) o desde Pasaporte. Ver § «El pasaporte de explorador > Los 2 sellos» para requisitos (0 errores, sin límite de intentos).

---

## Explorar

Un espacio seguro para explorar. El objetivo es familiarizarse con la ubicación y las formas de los países, así como con sus capitales, de manera libre.

La experiencia ofrece dos modos de exploración, accesibles mediante un control segmentado:

### Globo
Vista interactiva del globo terráqueo. El usuario puede tocar un país → se ilumina → aparece su ficha de país.
*   **Posición inicial**: Cada vez que se abre la app, el globo comienza en una longitud aleatoria (latitud fija en el ecuador), para que el usuario no siempre vea la misma región.
*   **Ficha de país**: Bottom sheet con handle visual y drag-to-dismiss (sin botón X). Bandera, nombre completo del país (sin truncar), capital, continente, población (y ranking), superficie (y ranking), densidad de población (y ranking), moneda, gentilicio, idioma(s), IDH (y ranking), IDH-D (y ranking) y enlace a Wikipedia. La ficha se muestra pegada al borde inferior de la pantalla (encima del tab bar). Todos los campos textuales se muestran en el idioma de la app.
    - **Moneda**: Nombre traducido al idioma de la app + símbolo universal entre paréntesis. Ej: "Euro (€)", "Dólar estadounidense ($)".
    - **Idioma(s)**: Idiomas oficiales a nivel nacional, ordenados de más a menos hablantes, separados por coma. Máximo 3 visibles; si hay más, se trunca con "…". Los nombres se muestran en el idioma de la app (ej. "Francés", no "French").
    - **Criterio de idiomas**: Se listan únicamente los idiomas reconocidos oficialmente a nivel nacional/constitucional. Los idiomas cooficiales regionales (ej. catalán en España, sardo en Italia) no se incluyen. Este criterio es objetivo, reproducible y consistente entre países.
    - **IDH / IDH-D**: Índice de Desarrollo Humano (IDH) e IDH ajustado por Desigualdad (IDH-D). Fuente: UNDP. IDH-D muestra "N/D" si no está disponible. Cada métrica lleva icono (i) con tooltip descriptivo.
    - **Enlace a Wikipedia**: Icono redondo en la **cabecera** del bottom sheet (puzzle globe oficial de Wikipedia). Abre el artículo del país en Wikipedia en el idioma de la app. Si el artículo no existe en ese idioma, enlaza a la versión en inglés.
*   **Capital**: Doble círculo gris claro (◎) sobre la ubicación de la capital. Se muestra al seleccionar un país y también permanentemente cuando el toggle de etiquetas de capitales está activo.

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
*   **Centro visual**: Las etiquetas se posicionan en el centroide visual del país, que puede diferir del centroide geométrico para países con forma irregular o archipiélagos dispersos (ver § Motor de renderizado > Centroides visuales y archipiélagos).
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

### Estilo visual
Estética de **documento oficial premium**: contenedor con textura guilloché (`repeating-linear-gradient`). Los sellos son **círculos CSS** coloreados por continente (colores olímpicos).
*   **Sello de Países**: borde simple. **Sello de Capitales**: borde doble (`border-style: double`).
*   **Ganado**: fondo tintado, glow sutil, estrella (★), rotación aleatoria leve (-8° a +8°).
*   **Pendiente en nivel activo**: pulso de opacidad (`stampPulse`).
*   **Animación stampDrop**: al conseguir un sello nuevo, efecto de caída (scale 0→1.15→1 con rotación, 400ms). La estrella (★) gira simultáneamente con efecto «trompo» (5 vueltas en 3s, ease-out).

---

## Estadísticas

Vista que muestra el registro de intentos del usuario de forma visual. Accesible desde un **icono en el header**, junto al icono de perfil (a su derecha). Disponible desde cualquier pantalla.

La vista de estadísticas tiene dos pestañas: **Jugar** (datos de Jugar) y **Pruebas de sello** (datos de las pruebas de sello, reflejados en Pasaporte). Ambas comparten selector de nivel × continente.

### Defaults según origen

La vista se abre con pestaña, continente y nivel preseleccionados según el contexto de origen:

*   **Desde Explorar o Jugar** (header o modales): continente/nivel de `lastPlayed` (último juego). Pestaña «Jugar».
*   **Desde Pasaporte**: continente/nivel de `lastStampPlayed` (última prueba de sello intentada). Pestaña «Pruebas de sello».
*   **Fallback** (sin datos): Europa / Turista. Pestaña «Jugar».

`lastStampPlayed` se setea cada vez que el usuario inicia una prueba de sello (desde Pasaporte o desde los modales de Jugar).

### Toggle de visualización

Disponible en ambas pestañas. Permite alternar entre dos modos:
*   **Indicadores de dominio** (por defecto): iconos ✓/✗/— por celda (ver indicadores de cada pestaña).
*   **Porcentaje de acierto**: `aciertos / (aciertos + fallos) × 100` por celda. Celdas sin intentos muestran «—». Código de colores: rojo (<50%), ámbar (50-79%), verde (≥80%).

### Pestaña Jugar
*   Selector de nivel × continente.
*   Tabla de países con indicadores de dominio por tipo de juego. Los headers de columna usan los **iconos compactos** de la nomenclatura visual (◯?, ◯→◎, ◎→◯, ◎?, ◯, ◎).
*   Indicadores visuales por celda:
    - **✓ verde** — Dominado por intento propio (racha ≥ 1 en ese tipo específico, con datos propios del nivel actual).
    - **✓ gris** — Dominado por inferencia, no verificado directamente. Incluye dos casos: (1) inferencia ascendente dentro del mismo nivel (A dominado → E inferido; B dominado → C/D/F inferidos), y (2) herencia entre niveles — tipos E/C/D/F heredados del nivel anterior (ver § Herencia de progreso entre niveles).
    - **✗ rojo** — Necesita refuerzo (racha ≤ 0, tiene intentos).
    - **—** — Sin datos.
*   La tabla muestra los datos **con herencia aplicada** (lo mismo que usa el algoritmo de juego), no solo los datos propios. Esto garantiza que lo que el usuario ve coincida con lo que el algoritmo utiliza para seleccionar preguntas.

### Pestaña Pruebas de sello
*   Tabla de países con **dos columnas**: ◯ Países (tipo A) y ◎ Capitales (tipo B).
*   Registro independiente del de Jugar (`stampAttempts`). Sin herencia entre niveles — cada nivel evalúa el 100% de los países.
*   Se registran todos los intentos individuales, incluso si la prueba se abandona.
*   Indicadores visuales por celda:
    - **✓ verde** — Acertado en el último intento de prueba.
    - **✗ rojo** — Fallado en el último intento de prueba.
    - **—** — Sin intentos.

### Acciones
*   **Resetear estadísticas**: Por nivel-continente (con confirmación). Borra los intentos de **todos los tipos de juego** (E/C/D/F/A/B) de ese nivel-continente. No hay reset granular por tipo — por simplicidad, siempre se resetea todo. Los datos de pruebas de sello y los sellos ganados no se borran.
*   **Permanencia de sellos**: Los sellos ganados y el historial de pruebas de sello no se pueden borrar (decisión intencional — metáfora del pasaporte real). La pestaña «Pruebas de sello» muestra un aviso explicativo en la zona equivalente al botón de reseteo, con la alternativa de crear un nuevo perfil para empezar de cero.

---

## Perfiles de usuario

La app soporta **múltiples perfiles** en un mismo dispositivo.

### Gestión de perfiles
- **Sin límite** de perfiles (el usuario crea los que necesite)
- Cada perfil tiene su propio pasaporte y progreso independiente
- **Cambio rápido**: Desde cualquier pantalla, tap en el avatar → selector de perfil
- **Sin contraseñas**: Los perfiles son locales y de confianza (contexto familiar)

### Cambio de perfil
- Al seleccionar un perfil **distinto** al activo, la app:
  1. Termina cualquier sesión activa de Jugar (si existe).
  2. Cancela cualquier prueba de sello en curso (si existe).
  3. Reinicia el globo al estado inicial (posición aleatoria, zoom 1, rotación automática) y navega a **Explorar**.
- Si el usuario toca su **propio perfil** (ya activo), el selector se cierra sin cambios.
- **Sin confirmación**: Los intentos ya registrados durante la sesión se conservan en el perfil anterior (se persisten pregunta a pregunta). Solo se pierde el score efímero de la sesión en curso.
- **Eliminación del perfil activo**: Se aplica la misma limpieza antes de reasignar al primer perfil disponible.

### Creación de perfil
- **Nombre**: Por defecto "Explorador" para el primer perfil. Los siguientes usan nombres únicos automáticos ("Explorador 2", "Explorador 3"...). El usuario puede cambiar el nombre.
- **Avatar**: Selección de 12-15 iconos de animales, representativos y característicos de los 5 continentes. Debe haber animales de tierra, mar y aire.

---

## Configuración

Configuración **ultra-sencilla**. Un solo punto de acceso: el **botón de engranaje en el header** (siempre visible). Se abre como **bottom sheet** con handle visual y drag-to-dismiss (sin botón X).

| Ajuste | Opciones | Por defecto | Visibilidad |
|--------|----------|-------------|-------------|
| Vibración | On/Off | On | Siempre |
| Idioma de la app | Todos los soportados por iOS/Android | Idioma del teléfono (fallback: inglés) | Siempre |
| Tema claro/oscuro | Claro / Oscuro | Oscuro | Siempre |
| Mares y océanos | On/Off | On | Siempre |
| Marcadores de microestados y archipiélagos | On/Off | On | Siempre |

**Perfil activo**: No forma parte de la configuración. Se gestiona mediante tap en el avatar (ver § Perfiles de usuario).

**Etiquetas de países/capitales**: Son controles exclusivos de la experiencia Explorar (ver § Explorar), no forman parte de la configuración.

**Nota sobre tema claro/oscuro**: Tarea de baja prioridad, a implementar cuando la app esté prácticamente terminada. La identidad visual principal sigue siendo el dark mode.

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

### Centroides visuales y archipiélagos

El globo centra la vista usando el **centroide geométrico** (`d3.geoCentroid()`) de cada país. Para la mayoría de países funciona correctamente, pero algunos requieren **overrides manuales** porque el centroide geométrico cae en una ubicación no representativa:

*   **Países con territorios ultramarinos**: Territorios lejanos desplazan el centroide (ej. Francia → Guayana Francesa). Override: centro visual del territorio principal.
*   **Archipiélagos dispersos**: Islas repartidas sobre cientos o miles de km producen un centroide en vacío oceánico. Override: **coordenadas de la isla de la capital**, que es el punto de referencia más significativo.

**Criterio para aplicar override**: El centroide geométrico dista significativamente de la capital (>~200 km) **y** no cae sobre territorio del país (vacío oceánico).

**Archipiélagos con override**:

| País | Centroide geométrico | Override (isla capital) | Distancia | Motivo |
|------|---------------------|------------------------|-----------|--------|
| FM Micronesia | [153.3°E, 7.5°N] | ~[158°E, 7°N] (Pohnpei) | 540 km | 20 islas en ~2800 km; centroide en vacío |
| KI Kiribati | [167.9°W, 0.9°N] | ~[173°E, 1.3°N] (Tarawa) | 2124 km | Cruza antimeridiano; centroide en hemisferio opuesto |
| VU Vanuatu | [167.7°E, 16.2°S] | ~[168.3°E, 17.7°S] (Port Vila) | 182 km | Cadena N-S; centroide alejado de la isla principal |
| MH Islas Marshall | [170.3°E, 7.0°N] | ~[171.4°E, 7.1°N] (Majuro) | 116 km | Centroide en vacío entre atolones |
| SC Seychelles | ~[55.5°E, 5°S] | ~[55.5°E, 4.7°S] (Mahé) | — | 26 islas dispersas; centroide en vacío oceánico |
| MV Maldivas | ~[73°E, 2°N] | ~[73.5°E, 4.2°N] (Malé) | — | Cadena N-S de 800 km; centroide alejado de la capital |

Otros archipiélagos de Oceanía (Fiyi, Tonga, Samoa, Palau, Islas Salomón) tienen centroides suficientemente cercanos a la capital (<100 km) y no requieren override.

**Impacto en el juego**:
*   **E/F** (país resaltado): La vista centra en el override, garantizando que la isla principal y el pin de capital sean visibles.
*   **C/D** (quiz de capitales): Tras responder, el zoom al país centra en el override en vez de en vacío oceánico.
*   **A/B** (localizar en el mapa): El zoom-out contextual parte del override, ofreciendo perspectiva desde la isla principal.

**Relación con etiquetas**: Los mismos overrides se usan para posicionar las etiquetas de país sobre el globo (ver § Explorar > Anti-solapamiento de etiquetas > Centro visual).

**Hit testing para archipiélagos**: Los países insulares cuyo mar entre islas debe contar como zona de toque usan un *convex hull* envolvente. Los archipiélagos dispersos de la tabla deben incluirse en este mecanismo.

### Outlines de archipiélagos (convex hull siempre visible)

Un subconjunto de archipiélagos —los difíciles de seleccionar o identificar visualmente— muestra una **línea discontinua perimetral** (convex hull) siempre visible, facilitando la comprensión de qué islas forman parte de cada país. Los archipiélagos grandes (Indonesia, Japón, Filipinas) o fácilmente identificables (Nueva Zelanda, Cuba) no la muestran.

*   **Países con hull visible**: Oceanía (FJ, SB, VU, PG, KI, FM, MH, TV, TO, WS, PW), América (TT, AG, KN, VC) e Índico (SC, MV). El resto de archipiélagos (`ARCHIPELAGO_CODES`) conserva el hull para hit testing y selección, pero no se muestra por defecto.
*   **Visibilidad**: Zoom adaptativo por tamaño del hull. Fórmula: `clamp(K / extensiónAngularGrados, 1.5, 5)` con K=10. Fade-in progresivo de 1 unidad de zoom.
*   **Estilo**: Misma línea discontinua y color (blanco) que los marcadores de microestados.
*   **Relación con marcadores de microestados**: Si un país es a la vez microestado y archipiélago con hull visible (ej. Kiribati, Palau, Trinidad y Tobago), se muestra **solo el hull**, no el marcador circular. Los microestados-archipiélago sin hull visible (ej. Comoras, Cabo Verde) conservan su marcador circular.
*   **País seleccionado**: Al seleccionar cualquier archipiélago (con o sin hull visible), el hull cambia a estilo destacado (dorado, mayor opacidad).
*   **Control**: Sigue el toggle «Marcadores de microestados y archipiélagos». En Jugar, visible en tipos A/B, oculto en C-F.

### Etiquetas de mares y océanos

Nombres de mares, océanos y golfos principales sobre el globo, siguiendo la convención cartográfica de **serif itálica para masas de agua**.

*   **Datos**: JSON manual estático (`public/data/sea-labels.json`, ~25-30 entries). Campos: `id`, `name_es`, `lat`, `lon`, `scalerank`. Posicionadas visualmente sobre el globo. Preparado para i18n (futuro `name_en`, `name_fr`, etc.).
*   **Scope**: ~5 océanos, ~6 mares grandes, ~9 mares medianos, ~3 golfos selectos. Sin saturar la vista (~8-12 visibles a la vez en hemisferio).
*   **Renderizado**: Underlay (después de océano, antes de países) — cartográficamente correcto. Los mares cerrados (Mediterráneo, Negro) pueden quedar parcialmente cubiertos por tierra.
*   **Tipografía**: `italic 300 Georgia, "New York", serif`. Tamaño base variable por `scalerank` (14px océanos → 8px mares pequeños), escalado suavemente con `√zoom`.
*   **Letter-spacing**: Amplio (6px océanos → 2px mares pequeños), renderizado char-by-char para compatibilidad universal.
*   **Color**: `rgba(100, 180, 255, alpha)` con glow azul tenue. Alpha base 0.45, modulado por zoom y posición hemisférica.
*   **Visibilidad por zoom**: Variable por `scalerank`. Océanos visibles solo a zoom bajo (1-3), mares medianos persisten a zoom regional (2-8). Fade-out gradual.
*   **Fade hemisférico**: Opacidad gradual desde el 70% del borde del hemisferio visible. Evita pop-in/pop-out brusco.
*   **Filtro de continente**: Opacidad reducida al 50% cuando hay filtro activo (dan contexto sin protagonizar).
*   **Anti-solapamiento**: Array `usedRects` propio (independiente del de países/capitales, al ser capas distintas).
*   **Control**: Toggle «Mares y océanos» en Configuración, siempre visible (desde cualquier pestaña). Por defecto: On.
*   **Sin hit testing**: Puramente visual, no afecta la interacción con países.

---

## Fuentes de datos

### Datos geométricos (mapas)
- **Fuente**: Natural Earth Data vía `world-atlas` (NPM)
- **Resolución base**: 1:50m (incluye Baleares, Canarias, Caribe, Oceanía; equilibrio detalle/rendimiento)
- **Resolución mejorada para islas**: La resolución 1:50m es insuficiente para 10 países insulares (pocas islas representadas o país completamente ausente). Se usa un archivo override con geometrías 1:10m extraídas de `world-atlas`, que reemplaza las geometrías 50m de estos países al cargar:

  | País | 50m (polígonos) | 10m (polígonos) | Motivo |
  |------|----------------|----------------|--------|
  | FM Micronesia | 5 | 20 | Solo islas principales de 4 estados; faltan atolones exteriores |
  | MH Islas Marshall | 5 | 22 | Solo atolones principales |
  | TV Tuvalu | **0** | 9 | **Ausente en 50m** |
  | PW Palau | 2 | 9 | Solo islas mayores |
  | TO Tonga | 3 | 10 | Solo islas principales |
  | KI Kiribati | 19 | 35 | Faltan atolones menores |
  | VU Vanuatu | 14 | 27 | Faltan islas menores |
  | FJ Fiyi | 20 | 44 | Faltan islas menores |
  | SC Seychelles | 1 | 18 | Solo Mahé; faltan Praslin, La Digue y resto |
  | MV Maldivas | 2 | 22 | Solo 2 atolones; cadena N-S de 800 km invisible |

  - **Tamaño adicional**: ~52 KB gzip (~175 KB raw). Impacto mínimo.
  - **Filtro de polígonos diminutos**: Se descartan polígonos con extensión < 0.015° (~1.7 km). D3 puede malinterpretar atolones extremadamente pequeños como su complemento esférico, corrompiendo el renderizado del globo. Los polígonos filtrados son invisibles a cualquier nivel de zoom.
  - **Bordes**: Los países con override se excluyen del mesh de bordes 50m (que dibujaría contornos fantasma de la geometría antigua). Sus bordes se dibujan por separado desde la geometría 10m. Es seguro porque todos son islas sin fronteras terrestres compartidas.
  - **Generación**: Script de extracción que lee `countries-10m.json` de `world-atlas` y genera el archivo override. Compatible con el pipeline de actualización automática vía CDN.
  - **No se usa 1:10m completo**: El dataset 10m tiene 5.5× más puntos (~544K) y +720 KB gzip — demasiado para Canvas 2D en móvil. El override selectivo consigue el detalle necesario sin impacto en rendimiento.
- **Formato**: TopoJSON (base) + GeoJSON (override islas)
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
├── countries-50m.json        # TopoJSON de países (1:50m, base)
├── islands-10m.json           # GeoJSON override para 10 países insulares (1:10m)
├── countries.json            # Datos de países (generado por fetch-countries.ts)
├── capitals.json             # Coordenadas y nombres de capitales
└── sea-labels.json           # Etiquetas de mares y océanos (manual, ~25-30 entries)

scripts/
├── generate-island-overrides.ts   # Extrae geometrías 10m de países insulares de world-atlas
└── data/
    └── capitals-{lang}.json       # Traducciones de capitales (suplementario, ver § Internacionalización de datos)
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
*   **Validación con LLM**: Claude como validador primario para todos los idiomas. Para cada idioma genera un informe de anomalías (nombres en idioma incorrecto, ortografía, incoherencias, traducciones sospechosas). No genera traducciones — solo valida. El desarrollador valida personalmente español e inglés; para el resto de idiomas, Claude es la fuente de QA principal.
*   **Pipeline completo**: REST Countries → Wikidata (gaps) → Validación LLM (Claude) → Revisión humana de español e inglés → CDN.
*   **Cobertura de idiomas**: Todos los idiomas soportados por iOS y Android. El pipeline genera datos para cada idioma de forma automatizada.
*   **Idioma actual de generación**: Español (`spa`). Cuando se implemente i18n completa, se generarán archivos por idioma o un JSON multi-idioma.

### Identificadores
- **Clave primaria**: ISO 3166-1 alpha-2 (`cca2`)
- **Vinculación**: GeoJSON ↔ REST Countries ↔ Capitales

### Estándar de países
- **Criterio**: Solo países reconocidos por la ONU
- **Total**: 195 países (193 miembros + 2 observadores: Vaticano y Palestina)
- **Fuera del juego**: Territorios no reconocidos (Kosovo, Taiwán, etc.) no participan en el sistema de niveles/sellos (ver subsección siguiente)
- **Ventaja**: Evita controversias políticas y simplifica mantenimiento

### Territorios no miembros de la ONU
Además de los 195 países ONU, los datos geográficos (Natural Earth 1:50m) incluyen ~37 territorios que no son miembros ni observadores de la ONU. Se clasifican en dos categorías:

| Categoría | Etiqueta en ficha | Ejemplo | Cant. |
|-----------|-------------------|---------|-------|
| **Territorio dependiente** | "Territorio de [País]" | Groenlandia → "Territorio de Dinamarca" | 33 |
| **Soberanía en disputa** | "Soberanía en disputa" | Taiwán, Kosovo, Sáhara Occidental, Islas Malvinas | 4 |

Comportamiento:
*   **Son seleccionables** en la experiencia Explorar: al tocar, se muestra la ficha con un disclaimer contextual según su categoría.
*   Se muestran todos los datos disponibles (bandera, capital, población, superficie, moneda, gentilicio).
*   **No participan en el sistema de juego** (niveles, sellos, pruebas) — solo son visibles en Explorar.
*   **Color diferenciado (ámbar)**: En el globo, tanto las etiquetas (nombre de país y capital) como los pines de capitales de estos territorios se muestran en color ámbar, distinto al gris claro de los países ONU, para distinguirlos visualmente.
*   **Visibilidad en la tabla**: ver § «Explorar > Tabla > Toggle territorios no-ONU».
*   **Continente asignado**: Cada territorio tiene un continente asignado para que los filtros funcionen correctamente.
*   **Datos**: El script `fetch-countries.ts` incluye estos territorios con `unMember: false` y, para los dependientes, `sovereignCountry` con el `cca2` del país soberano.

### Antártida
A diferencia de los territorios no-ONU (que son estados de facto con población y gobierno), la Antártida es un caso especial único: no es un país ni un territorio soberano. Está gobernada por el Tratado Antártico (1959, 53 países firmantes). No tiene población permanente, capital, moneda ni gentilicio.

*   **Etiqueta en el globo**: Sí. Es el territorio más grande (~14M km²) sin ser un país; omitir su nombre sería un gap evidente en una app de geografía.
*   **Seleccionable con ficha especial**: Al tocar, muestra superficie y texto informativo sobre el Tratado Antártico. No muestra campos vacíos/irrelevantes (capital, población, moneda...).
*   **No aparece en la tabla**: No es un país — no tiene capital ni población.
*   **No participa en el juego**: No es un país.
*   **Color de etiqueta**: Ámbar (como territorios no-ONU).
*   **Continente**: Valor especial — no pertenece a ninguno de los 5 continentes de la app. Los filtros de continente la ignoran.

### Política de representación cartográfica

GeoExpert usa la representación **de facto** de Natural Earth sin modificaciones cartográficas. Las fronteras reflejan el control territorial efectivo, no las reclamaciones legales.

*   **Criterio de países**: Estándar de la ONU (195 miembros y observadores). Este es el criterio para el juego, no el de Natural Earth.
*   **Territorios disputados**: Se muestran tal como los representa Natural Earth (de facto). La ficha muestra «Soberanía en disputa» sin tomar partido. Los 4 casos actuales (TW, XK, EH, FK) ya siguen este criterio.
*   **Features sin mapeo ISO**: Algunas features del TopoJSON no corresponden a ningún país ni territorio mapeado (ej. Glaciar de Siachen, ~27 km²). Se renderizan como masa terrestre genérica, sin ficha ni interacción. No se crean datos sintéticos para ellas.
*   **Sin localización cartográfica**: No se implementan vistas específicas por país (ej. mapa diferente para usuarios de India vs. Pakistán). El mapa es universal.
