# Spike: Rediseño visual del Pasaporte

**Fecha**: 2026-03-15
**Equipo**: Analista, Diseñador, Crítico, Sintetizador
**Objetivo**: Definir la dirección visual del Pasaporte y un plan de implementación accionable.

---

## Estado actual

### Componente
- **Archivo principal**: `src/components/Passport/PassportView.tsx` (213 líneas)
- **Estilos**: `src/components/Passport/PassportView.css` (160 líneas)
- **Estructura**: Grid CSS 5×3 (5 continentes × 3 niveles) con header de nivel global y leyenda inferior.

### Elementos visuales actuales
- **Header**: glassmorphism (`--glass-bg`, `--glass-border`), icono 📘, nombre de perfil + nivel global.
- **Grid**: `grid-template-columns: auto repeat(3, 1fr)`, gap `0.25rem`, max-width `22rem`.
- **Celdas**: fondo oscuro con borde coloreado por continente. Tres estados: locked (opacity 0.4), available (borde parcial), complete (borde + glow).
- **Sellos**: emojis (`🏅` ganado, `○` pendiente), `font-size-sm`.
- **Modal**: clases compartidas `.jugar-modal-*` (heredadas de Jugar). Cambios al modal afectan ambas vistas.

### Datos y lógica
- `getStamps(level, continent)` → `{ countries, capitals }` (booleanos).
- `isLevelUnlocked()` y `getGlobalLevel()` en `learningAlgorithm.ts`.
- Estado local mínimo: solo `selectedCell`.
- Patrones React modernos: `useCallback`, `useMemo`, derivación de estado.

### Constraints técnicos
- **Mobile-first**: max-width 22rem (352px), tap targets ≥ 44px.
- **Dark mode only** (light mode es tarea futura).
- **Vanilla CSS**: sin preprocesadores, variables en `:root` de `variables.css`.
- **Unidades rem**: para todo excepto bordes decorativos (1px).
- **Modal compartido**: las clases `.jugar-modal-*` se comparten con Jugar.

---

## Dirección visual propuesta

Transformar el Pasaporte de una tabla funcional a un **documento oficial premium**, manteniendo el grid 5×3 intacto y aplicando cambios exclusivamente visuales (CSS + markup mínimo).

### Principios
1. **Metáfora de pasaporte real**: bordes, texturas y tipografía que evoquen un documento oficial.
2. **Sellos como protagonistas**: círculos con doble borde y color por continente, no emojis.
3. **Animaciones sutiles**: estampado al conseguir sello, pulse en pendientes.
4. **Zero JS extra**: toda la estética se logra con CSS vanilla.
5. **Rendimiento móvil**: sin filtros SVG, sin operaciones GPU costosas.

---

## Elementos concretos

### 1. Contenedor con textura guilloché

Envolver el grid en un contenedor con borde doble sutil y textura de líneas finas (guilloché), evocando un documento oficial.

```css
.passport-container {
  border: 2px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  background-color: var(--glass-bg);

  /* Guilloché: líneas imperceptibles tipo documento oficial */
  background-image:
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, 0.02) 2px,
      rgba(255, 255, 255, 0.02) 4px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, 0.01) 2px,
      rgba(255, 255, 255, 0.01) 4px
    );
}
```

**Implementación**: CSS puro sobre `.passport-grid` o un wrapper nuevo. No SVG inline.

### 2. Tipografía "oficial" en cabecera

Aplicar estilo monoespaciado con letter-spacing a la cabecera del pasaporte para reforzar la metáfora de documento oficial.

```css
.passport-header__title {
  font-family: 'Courier New', monospace;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-weight: 600;
}
```

**Nota**: aplica al header global del pasaporte y opcionalmente a los labels de continente.

### 3. Sellos circulares con doble borde

Reemplazar emojis (`🏅`/`○`) por círculos CSS con doble borde coloreado por continente.

**Sello pendiente** (no conseguido):
```css
.passport-cell__stamp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;

  /* Doble borde: border + outline */
  border: 2px dashed var(--cell-color);
  outline: 1px solid var(--cell-color);
  outline-offset: 2px;

  opacity: 0.4;
  transition: all var(--transition-normal);
}
```

**Sello conseguido**:
```css
.passport-cell__stamp--earned {
  border-style: solid;
  opacity: 1;

  /* Fondo tintado por continente */
  background: color-mix(in srgb, var(--cell-color) 15%, transparent);

  /* Glow sutil */
  box-shadow: 0 0 0.5rem color-mix(in srgb, var(--cell-color) 20%, transparent);
}
```

**Contenido interior**: texto "P" (Países) o "C" (Capitales) con pseudo-elementos, o un `✓` en sellos ganados.

```css
.passport-cell__stamp--earned::after {
  content: '✓';
  font-size: var(--font-size-lg);
  color: var(--cell-color);
}
```

**Cambio en JSX**: reemplazar emojis por `<span>` vacíos con clases condicionales (`--earned`). Cambio mínimo (~5 líneas).

### 4. Rotación aleatoria de sellos

Cada sello ganado se muestra con una rotación aleatoria leve (-8° a +8°) para simular el efecto de un sello de tinta real estampado a mano.

```css
/* Rotaciones predefinidas por posición (CSS puro, sin JS) */
.passport-cell__stamp--earned:nth-child(1) { transform: rotate(-5deg); }
.passport-cell__stamp--earned:nth-child(2) { transform: rotate(3deg); }
```

**Alternativa**: inline style con `rotate` calculado en el componente (`Math.random() * 16 - 8`). Coste JS despreciable (se calcula una vez al montar).

### 5. Animación de estampado

Al conseguir un sello, animación de "caída" que simula el golpe de un sello sobre papel.

```css
@keyframes stampDrop {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-20deg);
  }
  70% {
    transform: scale(1.15) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(var(--stamp-rotation, 0deg));
  }
}

.passport-cell__stamp--animating {
  animation: stampDrop 400ms ease-out forwards;
}
```

**Trigger**: clase temporal `--animating` añadida cuando `stamps.X` pasa de `false` a `true`. Se puede detectar comparando estado previo con `useRef`.

### 6. Pulse en sellos pendientes

Animación sutil de respiración en sellos que el usuario puede intentar (nivel desbloqueado, sello no ganado).

```css
@keyframes stampPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

.passport-cell__stamp--available {
  animation: stampPulse 2s ease-in-out infinite;
}
```

### 7. Colores por continente

Los sellos heredan el color del continente usando las variables olímpicas existentes:

| Continente | Variable | Color |
|-----------|----------|-------|
| África | `--color-africa` | Gris claro (#e2e8f0) |
| América | `--color-america` | Rojo (#ef4444) |
| Asia | `--color-asia` | Ámbar (#fbbf24) |
| Europa | `--color-europe` | Azul (#3b82f6) |
| Oceanía | `--color-oceania` | Verde (#22c55e) |

No se necesitan variables nuevas. El color se aplica via `--cell-color` (inline style ya existente).

---

## Lo que NO hacer

1. **No hacer páginas deslizables por continente**. El grid 5×3 cabe en cualquier iPhone (max-width 22rem = 352px). Cambiar a scroll vertical entre páginas añade JS, scroll custom y refactor de layout innecesario. La estética "pasaporte" se logra con bordes y texturas, no con paginación.

2. **No usar filtros SVG (`feTurbulence`, `feDisplacementMap`)** para efecto de tinta. Con 15 sellos = 15 operaciones GPU por frame. Riesgo de lag y consumo de batería en iPhone. La rotación aleatoria CSS logra un efecto de tinta suficientemente realista.

3. **No usar SVG inline para guilloché**. `repeating-linear-gradient` CSS produce el mismo efecto visual sin parsing SVG, con rendimiento superior en móvil.

4. **No usar SVG con texto curvo** en la primera fase. Es moderadamente complejo (2-3h extra), requiere sincronización SVG ↔ React, y el beneficio visual es marginal en sellos de 2.5rem. Reservar para una fase posterior si se desea máximo realismo.

5. **No tocar el modal compartido** (`.jugar-modal-*`). Los cambios al modal afectan tanto Pasaporte como Jugar. Si se necesita un modal diferente para Pasaporte, extraerlo primero a un componente propio.

6. **No añadir librerías de animación** (Framer Motion, etc.). CSS keyframes son suficientes para las animaciones propuestas y el componente no usa ninguna librería de animación actualmente.

7. **No hardcodear valores de color o tamaño**. Usar siempre variables CSS de `variables.css`. No se necesitan variables nuevas.

---

## Plan de implementación sugerido

### Fase 1 — Cambio visual puro (estimación: 2-3h)

Todo CSS + markup mínimo. Sin cambio de layout, sin refactor React, sin librerías.

| Paso | Cambio | Archivo(s) | Tipo |
|------|--------|-----------|------|
| 1 | Contenedor guilloché (borde doble + `repeating-linear-gradient`) | `PassportView.css` | CSS |
| 2 | Tipografía oficial en header (monospace, letter-spacing, uppercase) | `PassportView.css` | CSS |
| 3 | Sellos circulares: reemplazar emojis por spans vacíos + CSS (doble borde, color por continente) | `PassportView.tsx` (~5 líneas), `PassportView.css` (~40 líneas) | CSS + JSX mínimo |
| 4 | Estado de sellos: `--earned` (sólido + glow), `--available` (dashed + pulse), `--locked` (opacity baja) | `PassportView.css` | CSS |
| 5 | Rotación aleatoria de sellos ganados (-8° a +8°) | `PassportView.css` o inline style | CSS |
| 6 | Animación `stampDrop` al conseguir sello | `PassportView.css` + `PassportView.tsx` (detección de transición) | CSS + JS mínimo |

**Riesgo**: Bajo. Cambios aislados en CSS del componente. Sin efectos secundarios en otros componentes.

**Validación**: Testear en dispositivo con `npm run device`. Verificar:
- Sellos se ven correctamente en los 3 estados (locked, available, earned)
- Animación de estampado funciona al conseguir un sello
- Guilloché visible pero no distractor
- Rendimiento fluido al hacer scroll y al interactuar

### Fase 2 — Refinamiento (opcional, 1-2h adicionales)

Solo si la Fase 1 se valida positivamente en dispositivo:

| Paso | Cambio |
|------|--------|
| 1 | Ajustar tamaños de sellos y espaciado tras feedback en dispositivo |
| 2 | Mejorar labels de continente (tipografía oficial, iconos decorativos) |
| 3 | Transiciones suaves entre estados de celda (locked → available → complete) |

### Fase 3 — Máximo realismo (post-lanzamiento, opcional)

| Paso | Cambio |
|------|--------|
| 1 | SVG con texto curvo en sellos ("PAÍSES" / "CAPITALES" en arco) |
| 2 | Efecto de tinta más elaborado (solo en sello expandido/detalle) |
| 3 | Layout en páginas por continente si hay demanda (refactor moderado) |

---

## Archivos afectados (Fase 1)

| Archivo | Cambios estimados | Riesgo |
|---------|-------------------|--------|
| `src/components/Passport/PassportView.css` | +60 líneas CSS, -20 líneas obsoletas | Bajo |
| `src/components/Passport/PassportView.tsx` | ~10 líneas JSX (emojis → spans + clases) | Bajo |
| `src/styles/variables.css` | Sin cambios | Ninguno |

**Total neto**: ~50 líneas nuevas de CSS + ~10 líneas modificadas de JSX.
