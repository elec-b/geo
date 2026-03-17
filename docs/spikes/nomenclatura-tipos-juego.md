# Spike: Nomenclatura de tipos de juego y rediseño del selector

> Fecha: 2026-03-17
> Estado: **Decisiones tomadas** — listo para implementar

---

## Problema

Los tipos de juego se identifican internamente como E, C, D, F, A, B. Esta secuencia no es intuitiva para el usuario y los nombres actuales son inconsistentes entre el selector ("¿Qué país es?"), la tabla de stats ("Rec.", "P→C") y los modales.

## Decisiones

### Nomenclatura visual

Dos símbolos base:
- **◯** (U+25EF, Large Circle) = país — renderizado con `font-size: 1.2em` para que se vea mayor que ◎
- **◎** (U+25CE, Bullseye) = capital

Un modificador de mecánica:
- **?** = quiz con opciones (los tipos sin **?** son de señalar en el globo)

| Interno | Icono | Nombre corto | Nombre completo (modales) |
|---------|-------|-------------|---------------------------|
| E | ◯? | Identifica país | Identifica el país |
| C | ◯→◎ | País a capital | País a capital |
| D | ◎→◯ | Capital a país | Capital a país |
| F | ◎? | Identifica capital | Identifica la capital |
| A | ◯ | Señala país | Señala el país |
| B | ◎ | Señala capital | Señala la capital |

### Selector de juego: opción colapsable

- **Aventura** como botón de ancho completo (icono 🧭, subtítulo «Todos los tipos combinados», accent cian). Seleccionado por defecto.
- **«Elegir tipo concreto»**: toggle colapsable, cerrado por defecto.
- Al expandir: grid 2×3 con iconos + nombres cortos.
- Separador sutil entre opciones (E/C/D/F) y examen (A/B). Badge 🔖 en A/B.
- Al seleccionar tipo concreto → Aventura se deselecciona (y viceversa).
- Estado colapsado no se persiste.

### Tabla de estadísticas

- Headers usan los iconos compactos: ◯? | ◯→◎ | ◎→◯ | ◎? | ◯ | ◎
- Sin popover de leyenda (innecesario con iconos autoexplicativos)

### Modales

Nombres completos en prosa: «¡Fenomenal! **País a capital** superado» (no iconos).

---

## Mapa de impacto

| Ubicación | Archivo | Cambio |
|-----------|---------|--------|
| Selector de juego | `LevelSelector.tsx` + `.css` | Rediseño: botón Aventura + toggle colapsable + grid 2×3 |
| Modales de fin | `JugarView.tsx:45-52` | Actualizar `QUESTION_TYPE_LABELS` con nombres nuevos |
| Stats — Jugar | `StatsView.tsx:116-123` | Actualizar `TYPE_LABELS.short` con iconos |
| Stats — Sellos | `StatsView.tsx:125-128` | Sin cambios (ya usa "Países"/"Capitales") |
| Pasaporte | `PassportView.tsx` | Sin cambios (usa "Sello de Países/Capitales") |
| Banner pregunta | `QuestionBanner.tsx` | Sin cambios (prompts dinámicos) |
| DESIGN.md | Secciones actualizadas | § Nomenclatura visual, § Selector, § Estadísticas |

Los IDs internos (E/C/D/F/A/B) y `QuestionType` **no cambian**.

---

## Plan de implementación incremental

### Fase 1 — Nomenclatura en stats y labels (mínimo esfuerzo, máximo impacto)
1. ✅ Actualizar DESIGN.md con nomenclatura definitiva
2. Cambiar `TYPE_LABELS` en `StatsView.tsx` (iconos en headers)
3. Cambiar `QUESTION_TYPE_LABELS` en `JugarView.tsx` (nombres en modales)
4. Cambiar `QUESTION_TYPES` labels en `LevelSelector.tsx` (nombres en pills)
5. CSS: `font-size: 1.2em` para ◯ en headers de stats
6. Testear en dispositivo

### Fase 2 — Rediseño del selector
1. Botón Aventura de ancho completo con icono 🧭 y subtítulo
2. Toggle «Elegir tipo concreto» (colapsable, cerrado por defecto)
3. Grid 2×3 con iconos + nombres + separador A/B
4. Lógica de selección mutuamente excluyente (aventura ↔ tipo concreto)
5. Testear en dispositivo

---

## Opciones descartadas

- **◉ (fisheye)** para país: muy pequeño a `font-size-xs`, indistinguible de un bullet
- **📍 (pushpin)** para capital: menos intuitivo que ◎ como "punto en el mapa"
- **👆** para señalar: reemplazado por 📝 (examen), más coherente con la mecánica
- **Popover de leyenda (ⓘ)** en stats: sobre-ingeniería para un beneficio marginal
- **Selector simple** (pills siempre visibles): menor jerarquía visual entre Aventura y tipos concretos
- **⭕ (emoji)** para país: renderiza en rojo en la mayoría de plataformas
