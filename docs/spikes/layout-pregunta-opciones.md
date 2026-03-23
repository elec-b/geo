# Spike: Reposicionar pregunta y opciones en la UI de Jugar

> Fecha: 2026-03-19
> Estado: **Análisis completo** — pendiente de decisión

---

## Problema

En la experiencia Jugar, la pregunta (`QuestionBanner`) está en la parte **superior** de la pantalla y las opciones (`ChoicePanel`) en la **inferior**. Esto genera incomodidad:

- El usuario lee arriba → toca abajo, recorriendo ~10cm con la mirada
- La pregunta está en la **zona roja** del pulgar (difícil de alcanzar) — aunque esto es menos relevante porque el banner no es interactivo (`pointer-events: none`)
- El problema real es de **proximidad visual**: la pregunta y las opciones están demasiado separadas, obligando al ojo a recorrer toda la pantalla en cada pregunta

### Idea original del usuario

> «Que la pregunta esté a la izquierda de la barra de progreso, abajo. Y si tienen que salir las 4 opciones para los juegos C a F, que salgan donde salen ahora — no habría que modificar nada.»

---

## Layout actual

### Distribución vertical (iPhone ~844px)

```
Tipos C-F (opciones):                Tipos A-B (señalar):
┌──────────────────────┐             ┌──────────────────────┐
│ SafeArea top (~44px) │             │ SafeArea top (~44px) │
│ QuestionBanner ~60px │ ← zona roja│ QuestionBanner ~60px │
│                      │             │                      │
│                      │             │                      │
│   GLOBO (canvas)     │ ~550-650px  │   GLOBO (canvas)     │ ~630-730px
│   fullscreen         │             │   fullscreen         │
│                      │             │                      │
│ ChoicePanel 2×2      │ ~80px       │                      │
│ ProgressBar          │ ~56px       │ ProgressBar          │ ~56px
│ TabBar               │ ~60px+safe  │ TabBar               │ ~60px+safe
└──────────────────────┘             └──────────────────────┘
```

### Componentes clave

| Componente | Archivo | Posición CSS |
|-----------|---------|-------------|
| QuestionBanner | `QuestionBanner.tsx/.css` | `fixed; top: safe-area + 0.5rem` |
| ChoicePanel | `ChoicePanel.tsx/.css` | `fixed; bottom: tabbar + safe-area + 5.5rem` |
| ProgressBar | `ProgressBar.tsx/.css` | `fixed; bottom: tabbar + safe-area` |
| Globo | `GlobeD3.tsx` | Canvas fullscreen, z-index 1 |

### Notas de implementación

- El globo siempre ocupa pantalla completa — los overlays **flotan encima** sin redimensionarlo
- QuestionBanner: `pointer-events: none`, animación `translateY(-0.5rem)`, `max-width: 20rem` para C-F
- ChoicePanel: grid `1fr 1fr`, `width: min(90%, 22rem)`, animación `translateY(0.5rem)`
- Hay un **gap de 5.5rem** (~88px) entre ProgressBar y ChoicePanel cuyo propósito no está documentado
- En pruebas de sello, ProgressBar incluye un banner adicional «Prueba de sello: Países/Capitales»

---

## Investigación UX

### Thumb zones (Hoober, Clark)

- **49%** de usuarios sostienen el móvil con una mano (pulgar como dedo principal)
- **75%** de interacciones son con el pulgar (Josh Clark)
- **Zona verde** (tercio inferior): alcance cómodo sin cambiar agarre
- **Zona roja** (parte superior): requiere cambiar agarre o segunda mano
- **Matiz**: Hoober advierte no tratar las zonas como regla absoluta — los usuarios cambian de agarre según contexto

### Benchmark de apps

| App | Pregunta | Opciones | Mapa/visual |
|-----|----------|----------|-------------|
| **Duolingo** | Centro | Abajo (zona verde) | N/A |
| **Kahoot!** | No visible en móvil | 4 botones fullscreen | N/A |
| **Trivia Crack** | Arriba | Lista vertical debajo | N/A |
| **GeoGuessr** | N/A | Tap en mapa | Mapa fullscreen, overlays mínimos |
| **Seterra** | Banner compacto | Tap en mapa | Mapa maximizado |

### Patrones clave

1. **Apps de quiz**: Pregunta arriba/centro + opciones abajo. Ninguna pone pregunta + opciones ambas en la zona inferior.
2. **Apps de geografía**: Mapa protagonista, UI compacta como overlays.
3. **Tendencia 2024-25**: Diseño «bottom-up» — mover interacción hacia el bottom.

### Trade-off central

Más UI abajo = más cómodo para el pulgar, **pero** menos espacio visible para el globo (que es el diferenciador de GeoExpert frente a apps de quiz estáticas).

---

## Propuestas evaluadas

### Propuesta A: Pregunta sobre opciones (zona inferior)

Mover el QuestionBanner de arriba a justo **encima** del ChoicePanel.

```
Tipos C-F:                           Tipos A-B:
┌──────────────────────┐             ┌──────────────────────┐
│ SafeArea top         │             │ SafeArea top         │
│                      │             │                      │
│                      │             │                      │
│   GLOBO (canvas)     │ más visible │   GLOBO (canvas)     │
│                      │             │                      │
│                      │             │                      │
│ "¿Capital de España?"│ ← nueva pos │ "Localiza: España"   │ ← nueva pos
│ [Madrid]  [Lisboa]   │             │                      │
│ [París]   [Roma]     │             │ ProgressBar          │
│ ProgressBar          │             │ TabBar               │
│ TabBar               │             └──────────────────────┘
└──────────────────────┘
```

**Pros**:
- Lectura + opciones en la misma zona visual (~2cm vs ~10cm actual)
- Libera zona superior → más globo visible arriba
- Complejidad de implementación baja-media
- Zona verde del pulgar para todo el bloque

**Contras y huecos (refutación)**:
- **Ganancia neta de globo exagerada**: Se liberan ~60px arriba pero se añaden ~30px abajo (el banner). Ganancia neta C-F: **~30px**, no ~90px. Para A/B: **~0px** (redistribución sin ganancia neta)
- **isPointVisible() necesita recalibración**: Más overlay abajo → más países «visibles» pero tapados por UI. El margen actual (0.8) fue calibrado con el layout existente
- **Posición bottom condicional**: Para C-F, el banner va encima del ChoicePanel. Para A/B, encima de ProgressBar. Requiere lógica CSS o JS condicional
- **Rompe patrón establecido**: Ninguna app del benchmark pone pregunta + opciones ambas en zona inferior
- **Pruebas de sello en iPhone SE**: ProgressBar con banner de sello (~70-80px) + QuestionBanner (~50px) + TabBar (~60px+safe) → ~200px de zona inferior, dejando solo ~320px para el globo

**Complejidad real**: Baja-media (no solo CSS — animación invertida + posición condicional + recalibración isPointVisible)

### Propuesta B: Pregunta en la ProgressBar (idea del usuario)

Fusionar la pregunta con ProgressBar: texto a la izquierda, progreso a la derecha.

```
┌────────────────────────────┐
│ ¿Capital   │ 45% ━━━      │
│ de España? │ ✓12  ✗3      │
└────────────────────────────┘
```

**Pros**:
- Máxima compactación — elimina una fila entera de UI
- Idea original del usuario

**Contras**:
- **Espacio horizontal insuficiente**: En iPhone 375px, ProgressBar (min-width: 14rem ≈ 224px) + pregunta → ~150px para texto. «¿Cuál es la capital de República Centroafricana?» (48 chars) no cabe
- **Válido solo para E/F/A/B**: Los prompts de E y F son fijos y cortos. Los de C y D tienen nombres de países/capitales variables y largos
- **Conflicto con banner de sello**: ProgressBar ya incluye banner «Prueba de sello» — añadir pregunta = demasiado contenido
- **Layout shift**: El ancho de la pregunta cambia con cada país → la ProgressBar salta
- **Sin precedentes**: Ninguna app fusiona pregunta con progreso

**Variante no explorada**: Fusionar solo para E/F/A/B (prompts cortos/fijos) y usar banner separado para C/D. Añade complejidad condicional.

**Complejidad**: Media-alta. **Descartada como opción principal**, pero viable como **fallback** de A' con dos palancas (ver § Fallback: Propuesta B rehabilitada).

### Propuesta C: Opciones en columna única + pregunta integrada

Grid 2×2 → lista vertical 1 columna, con pregunta como primer elemento.

**Descartada**: Sacrifica ~80px más de globo que el layout actual. Contradice «globo protagonista».

---

## Alternativa no explorada por el diseñador: Tratamiento diferenciado A/B vs C-F

El refutador señala que A/B y C-F son flujos cognitivos diferentes:

- **C-F**: Lectura → lectura → toque. El usuario lee la pregunta, lee las opciones, toca una opción. Beneficio claro de tener pregunta + opciones juntas.
- **A/B**: Lectura → búsqueda visual → toque en el globo. El usuario lee el nombre y luego **busca en el mapa**. El banner no es interactivo — mantenerlo arriba no perjudica la ergonomía del pulgar y **maximiza el globo visible** para la búsqueda.

### Propuesta A': Diferenciada (recomendación del refutador)

| Tipo | Posición de la pregunta | Razón |
|------|------------------------|-------|
| **C-F** | Abajo, encima de ChoicePanel | Crea bloque compacto de lectura + opciones |
| **A-B** | Arriba (sin cambio) | Maximiza globo para búsqueda visual; banner no es interactivo |

Esto simplifica la implementación (no hay posición bottom condicional entre C-F y A/B) y evita el impacto negativo en `isPointVisible()` para A/B.

---

## Oportunidad: Reducir el gap de 5.5rem

Actualmente hay **5.5rem (~88px)** de espacio entre ProgressBar y ChoicePanel. Ningún agente investigó por qué existe este gap. Si se puede reducir a ~3rem (~48px), se ganan ~40px que pueden absorber el QuestionBanner encima del ChoicePanel con **coste neto cero** de espacio para el globo.

**Acción requerida**: Investigar el origen del gap de 5.5rem antes de implementar.

---

## Casos edge a validar

| Caso | Riesgo | Mitigación |
|------|--------|------------|
| **iPhone SE** (320×568) | Zona inferior acumulada en pruebas de sello | Presupuesto de píxeles explícito antes de implementar |
| **Textos largos** (i18n futuro: alemán, ruso) | QuestionBanner podría necesitar 2 líneas | `max-width: 20rem` ya existe; validar con textos largos |
| **Landscape** | Layout no validado | Forzar portrait en Capacitor (tarea separada) |
| **Screen readers** | Orden DOM ≠ orden visual si banner se mueve | Validar con VoiceOver |
| **isPointVisible()** | Margen angular calibrado con layout actual | Recalibrar si se mueve banner para C-F |

---

## Recomendación

### Opción recomendada: Propuesta A' (diferenciada)

1. **C-F**: Mover QuestionBanner al bottom, encima de ChoicePanel
2. **A-B**: Mantener QuestionBanner arriba (sin cambio)
3. **Investigar el gap de 5.5rem** y reducirlo si es posible para compensar espacio

### Razones

- Resuelve el problema core para C-F (distancia ojo-mano)
- No degrada A/B (globo maximizado para búsqueda visual)
- Implementación más simple que Propuesta A pura (sin posición condicional en A/B)
- Compatible con pruebas de sello (que son A/B → sin cambio)

### Antes de implementar

1. Medir el presupuesto de píxeles exacto en iPhone SE y iPhone 16 Pro Max
2. Investigar y posiblemente reducir el gap de 5.5rem
3. Prototipar en dispositivo para validar la sensación antes de commitear

---

## Fallback: Propuesta B rehabilitada

Si la Propuesta A' no funciona tras prototipar, la Propuesta B se vuelve viable con dos palancas:

### Palanca 1: Compactar la ProgressBar

La ProgressBar actual ocupa ~56px de alto con layout vertical (label → barra → stats) y `min-width: 14rem` (~224px). Se puede compactar:

- **Layout horizontal**: Barra de progreso + stats en una sola fila, eliminando la etiqueta de texto
- **Reducir min-width**: De 14rem a ~8-9rem (~128-144px)
- **Resultado**: ~30px de alto en vez de ~56px, y ~200px libres para la pregunta (en iPhone 375px)

### Palanca 2: Acortar los prompts de C y D

Los textos actuales de C y D son innecesariamente largos. En un contexto de quiz las fórmulas completas son redundantes:

| Tipo | Prompt actual | Prompt corto | Ahorro |
|------|--------------|-------------|--------|
| C | «¿Cuál es la capital de República Centroafricana?» (48 chars) | «Capital de República Centroafricana» (35 chars) | -13 chars |
| D | «Sri Jayawardenepura Kotte es la capital de...» (45 chars) | «Capital: Sri Jayawardenepura Kotte» (34 chars) | -11 chars |

Con ambas palancas, el texto más largo (~35 chars a ~1rem) cabe en ~200px. Los prompts de E/F/A/B ya son cortos y caben sin problema.

### Viabilidad revisada

| Contra original | Mitigación |
|----------------|------------|
| Espacio horizontal insuficiente | ProgressBar compactada + prompts cortos → ~200px disponibles |
| Conflicto con banner de sello | Pruebas de sello son tipo A/B → si se aplica tratamiento diferenciado (A/B arriba), no hay conflicto |
| Layout shift | ProgressBar compactada con ancho fijo elimina el problema |

**Complejidad**: Media (refactorizar ProgressBar + acortar prompts + validar en dispositivo).

---

## Decisión del usuario

Pendiente. Plan de acción propuesto:

1. **Implementar A'** (C-F abajo, A/B arriba) — prototipar en dispositivo
2. **Si A' no convence** → Implementar B con las dos palancas (ProgressBar compacta + prompts cortos)
3. **Statu quo** como última opción si ninguna mejora justifica el cambio
