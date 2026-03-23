# Análisis de viabilidad — Propuesta visual del Pasaporte

**Fecha**: 2026-03-15
**Analista**: Analista (respuesta a propuesta del diseñador)
**Estado**: Evaluación técnica + recomendaciones

---

## Resumen ejecutivo

La propuesta del diseñador es **altamente viable**. La mayoría de cambios son CSS puro sin tocar lógica React. Estimación: **4-6 horas de implementación**.

---

## Propuesta del diseñador: Desglose por componente

### 1. Layout "Libro de pasaporte" (scroll vertical entre páginas)

**Propuesta**: Grid 5×3 → 5 páginas (una por continente) con scroll vertical.

**Análisis técnico**:
- **Cambio necesario**: Refactor del loop en PassportView.tsx (lines 109–162)
  - Actual: Un loop CONTINENTS que rinde filas simultáneas
  - Nuevo: Un loop CONTINENTS que rinde "páginas" (contenedores separados)
  - Cada página: cabecera + grid 1×3 (los 3 niveles como columnas)

- **CSS**:
  - Contenedor padre: `display: flex; flex-direction: column; gap: var(--spacing-lg)`
  - Cada página: `border: 1px solid var(--glass-border); padding: var(--spacing-lg); border-radius: var(--radius-lg)`
  - O más sofisticado: `page-break-inside: avoid` + guillochés decorativos

- **Impacto React**: **BAJO** — solo reordenar JSX, sin cambiar estado ni lógica. ~15 líneas modificadas.

- **Impacto CSS**: **MODERADO** — redefinir grid a flex, añadir espaciado entre páginas. ~30 líneas nuevas.

- **Responsividad**: Ya es mobile-first (max-width 22rem), no hay cambio. Scroll vertical funciona.

**Viabilidad**: ✅ **FÁCIL** (1-2 horas)

---

### 2. Cabecera de página (nombre continente + icono decorativo)

**Propuesta**: Nombre del continente con silueta simplificada + tipografía oficial monoespaciada.

**Código actual**:
```jsx
<div className="passport-grid__continent-label"
     style={{ color: `var(${continent.cssVar})` }}>
  {continent.label}
</div>
```

**Cambio**:
```jsx
<div className="passport-page__header">
  <span className="passport-page__header-icon">
    {/* SVG inline: silueta del continente o icono decorativo */}
  </span>
  <h2 className="passport-page__header-title">{continent.label.toUpperCase()}</h2>
</div>
```

**CSS necesario**:
```css
.passport-page__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--glass-border);
}

.passport-page__header-title {
  font-family: 'Courier New', monospace; /* O similar para "oficial" */
  letter-spacing: 0.15em;
  font-size: var(--font-size-lg);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--cell-color); /* Dinámico por continente */
}

.passport-page__header-icon {
  font-size: 2.5rem;
  opacity: 0.7;
}
```

**Iconos decorativos**: Emojis (🌍 genérico) o SVG inline simplificado (siluetas).

**Viabilidad**: ✅ **MUY FÁCIL** (30 min — puro CSS + reordenar JSX)

---

### 3. Sellos: Forma circular con doble borde

**Propuesta**: Circular (en lugar de emojis ○/🏅), doble borde, efecto tinta.

**Código actual** (líneas 140–154):
```jsx
<div className="passport-cell__stamps">
  <span className="passport-cell__stamp">
    {stamps.countries ? '🏅' : '○'}
  </span>
  <span className="passport-cell__stamp">
    {stamps.capitals ? '🏅' : '○'}
  </span>
</div>
```

**Cambio mínimo**: Solo CSS, el HTML queda igual (o quitas emojis, dejas spans vacíos).

**CSS puro para "sello"**:
```css
.passport-cell__stamp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;

  /* Doble borde: outline + border */
  border: 2px solid var(--cell-color);
  outline: 1px solid var(--cell-color);
  outline-offset: 2px;

  /* Sello pendiente: discontinuo */
  border-style: dashed;
  opacity: 0.4;

  /* Transición para "conseguido" */
  transition: all var(--transition-normal);
}

.passport-cell__stamp--earned {
  border-style: solid;
  opacity: 1;

  /* Efecto tinta: color del continente, semi-transparente */
  background: color-mix(in srgb, var(--cell-color) 15%, transparent);

  /* Glow sutil */
  box-shadow: 0 0 8px color-mix(in srgb, var(--cell-color) 20%, transparent);
}

/* Contenido dentro del sello: texto o icono */
.passport-cell__stamp::before {
  content: '★'; /* Estrella central */
  font-size: var(--font-size-lg);
  color: var(--cell-color);
  opacity: 0.6;
}

.passport-cell__stamp--earned::before {
  content: '✓'; /* Tick en ganados */
  opacity: 1;
  color: var(--cell-color);
}
```

**Alternativa más sofisticada**: SVG inline + CSS `clip-path` para texto curvo.

```html
<svg class="passport-stamp__svg" viewBox="0 0 100 100">
  <defs>
    <path id="circlePath" d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0"/>
    <text>
      <textPath href="#circlePath" startOffset="0%" text-anchor="start">
        PAÍSES
      </textPath>
    </text>
  </defs>
  <circle cx="50" cy="50" r="40" ... />
  <!-- Estrella/tick central -->
</svg>
```

**Pero esto requiere**:
- SVG en cada sello → más markup
- CSS para posicionar text curvo
- Más JS si quieres rotación aleatoria dinámica

**Recomendación analista**: Empezar con **CSS puro (doble borde + fondo tintado)** y añadir SVG curvo después si quieres detalles más realistas. Es incrementalmente viable.

**Viabilidad CSS puro**: ✅ **FÁCIL** (1 hora)
**Viabilidad con SVG curvo**: ⚠️ **MODERADO** (2-3 horas, por mantener sincronización SVG ↔ React)

---

### 4. Animación de sello al conseguir

**Propuesta**: `scale(0) → scale(1.1) → scale(1)` + `rotate`.

**Implementación**:
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
    transform: scale(1) rotate(0deg);
  }
}

.passport-cell__stamp--earned {
  animation: stampDrop var(--transition-normal) ease-out forwards;
}
```

**Alternativa con Framer Motion**: Si la app usa Framer Motion en otros lados, usar `<motion.div>`. Pero PassportView no la usa actualmente.

**Trigger**:
- En el componente, cuando `stamps.countries` pasa de `false` → `true`, añadir clase `--stamp-animating` temporalmente (con setTimeout).
- O usar `<motion.div>` y clave la animación en el estado.

**Viabilidad**: ✅ **FÁCIL** (30 min con CSS keyframes)

---

### 5. Borde decorativo (guilloché simplificado)

**Propuesta**: `repeating-linear-gradient` sutil en el fondo de la "página".

**CSS puro**:
```css
.passport-page {
  border: 2px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);

  /* Textura guilloché: líneas muy finas */
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
  background-color: var(--glass-bg);
}
```

**Resultado**: Líneas apenas perceptibles (muy sutil, como documentos oficiales). Impacto en renderizado: **nulo** (CSS puro).

**Viabilidad**: ✅ **MUY FÁCIL** (15 min)

---

## Cambios de archivo por archivo

### PassportView.tsx

**Cambios**:
1. Refactor loop CONTINENTS (lines 109–162):
   - Agrupar niveles en una estructura de "página"
   - Mover cabecera de continente dentro de la página
2. Remplazar emojis de nivel en LEVELS (icono → usa CSS)
3. Modificar celdas para que no rendericen emojis de sello (deixar como spans vacíos para CSS)

**Líneas totales modificadas**: ~30 líneas de JSX
**Cambios en lógica**: Ninguno (state, handlers, callbacks idénticos)
**Riesgo**: **BAJO** — refactor estructural pero sin tocar estado

### PassportView.css

**Cambios**:
1. Eliminar `.passport-grid` y redefinir como `.passport-pages` (flex column)
2. Añadir `.passport-page` (contenedor de "página")
3. Añadir `.passport-page__header` y `.passport-page__header-*`
4. Redefinir `.passport-cell` como "slot" de sello (no celda de grid)
5. Redefinir `.passport-cell__stamp` con doble borde circular
6. Añadir `@keyframes stampDrop`
7. Añadir decoración guilloché en `.passport-page`

**Líneas nuevas**: ~100 líneas CSS
**Líneas eliminadas**: ~40 líneas (el grid actual)
**Neto**: +60 líneas CSS

**Riesgo**: **BAJO** — CSS aislado, sin efectos secundarios en otros componentes

### variables.css

**Cambios**: Ninguno necesario (todas las variables ya existen)

---

## Evaluación de constraints

| Constraint | Impacto | Solución |
|-----------|--------|----------|
| **Mobile-first** | ✅ Bajo | Scroll vertical funciona bien en móvil, mejor UX que grid comprimida |
| **Dark mode** | ✅ Bajo | Colores olímpicos + glassmorphism se adaptan |
| **Vanilla CSS** | ✅ Bajo | Guilloché es CSS puro, sellos son spans + CSS |
| **Unidades rem** | ✅ Bajo | Todo en rem, sin hardcodes |
| **Max-width 22rem** | ⚠️ Moderado | Páginas son más altas (scroll), pero ancho OK |
| **Modal compartida** | ✅ Bajo | Modal está afuera de grid, no cambia |

---

## Alternativa más conservadora

Si el diseñador prefiere **no cambiar el layout a páginas**, se puede aplicar toda la estética visual a la grid actual:

- Mantener grid 5×3
- Envolver en contenedor con borde + guilloché
- Cambiar emojis por sellos CSS circulares
- Tipografía más "oficial" en cabecera global
- Animaciones en sellos

**Impacto**: Solo 20–30 líneas CSS nuevas, 0 cambios React.
**Viabilidad**: ✅ **INMEDIATA** (2-3 horas)

---

## Recomendación

**Implementar en esta secuencia**:

1. **Fase 1 (2-3h)**: Cambio visual mínimo (sellos CSS circulares, animaciones, guilloché)
   - Sin refactor de layout
   - Testeable en 1 sesión
   - Alta recompensa visual

2. **Fase 2 (2-3h)**: Refactor a "páginas" si resulta (después de Fase 1)
   - Layout en scroll vertical
   - Cabecera de continente mejorada
   - Puede hacerse incremental sin romper Fase 1

3. **Fase 3 (opcional)**: SVG curvo en sellos si se quiere máximo realismo
   - Texto curvo "PAÍSES / CAPITALES"
   - Rotación aleatoria dinámica
   - Post-lanzamiento

---

## Viabilidad general

| Aspecto | Dificultad | Tiempo | Riesgo |
|---------|-----------|--------|--------|
| Sellos CSS (doble borde, animación) | Fácil | 1-2h | Bajo |
| Guilloché decorativo | Muy fácil | 30 min | Nulo |
| Cabecera "oficial" | Fácil | 30 min | Bajo |
| Refactor a páginas | Moderado | 2-3h | Bajo |
| SVG sellos curvo | Moderado | 2-3h | Moderado |
| **TOTAL (Fases 1+2)** | **Moderado** | **4-6h** | **Bajo** |

---

## Conclusión

✅ **La propuesta es altamente viable**. La arquitectura actual de PassportView (sin lógica compleja, CSS encapsulado, variables centralizadas) permite cambios visuales rápidos sin riesgo de regresión.

Recomendación: **Empezar con Fase 1** (sellos + guilloché) para obtener feedback visual del usuario antes de comprometerse a refactor de layout.
