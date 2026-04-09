# Spike: Botón «Empezar» oculto en idiomas con textos largos

**Fecha**: 2026-03-26
**Contexto**: En idiomas como japonés, ruso o alemán, el botón «Empezar/Continuar» del selector de Jugar queda fuera del viewport y requiere scroll down para ser visible. El scroll es invisible (scrollbar oculta por diseño). El usuario no tiene indicación de que debe hacer scroll.
**Método**: Análisis del layout CSS actual + presupuesto vertical + evaluación de opciones.

---

## 1. Diagnóstico

### Presupuesto vertical del selector (estado colapsado, sin grid de tipos)

| Sección | Altura estimada |
|---------|----------------|
| Padding top | 2rem |
| Título «Elige continente» | ~1.2rem |
| Gap | 1.5rem |
| Pills de continente (2 filas) | ~3.5rem |
| Gap | 1.5rem |
| Título «Elige nivel» | ~1.4rem |
| Gap | 1.5rem |
| Tarjetas de nivel (3 cards) | ~5rem |
| Gap | 1.5rem |
| Título «Elige juego» | ~1.4rem |
| Gap | 1.5rem |
| Botón Aventura | ~3.5rem |
| Gap | 1.5rem |
| Separador «o elige juego concreto» | ~0.75rem |
| Gap | 1.5rem |
| Botón Empezar | ~2.5rem |
| Padding bottom | 2rem |
| **Total** | **~34rem (~544px)** |

### Espacio disponible (max-height del modal)

```
max-height = 100dvh - header(3.5rem) - tabbar(3.75rem) - safe-area-top - safe-area-bottom - 3rem
```

| Dispositivo | Viewport | Safe areas | Disponible |
|-------------|----------|------------|------------|
| iPhone SE (3ª gen) | 667px | 20+0=20px | ~503px |
| iPhone 15 | 852px | 59+34=93px | ~615px |
| iPhone 15 Pro Max | 932px | 59+34=93px | ~695px |
| Android compacto (~360×640) | 640px | ~24+48=72px | ~424px |

### Por qué falla en ciertos idiomas

En idiomas CJK (japonés, chino, coreano) y en idiomas con palabras largas (ruso, alemán):
- Las **pills de continente** pueden pasar de 2 a 3 filas (+~1.5rem)
- Los **nombres de nivel** pueden envolver (+~1rem por card)
- Los **títulos de sección** pueden ser más largos
- El `countryCount` en tarjetas de nivel ocupa más espacio

El contenido pasa de ~544px a ~580-620px, superando el espacio disponible en iPhones estándar. En iPhone SE o Android compacto, el problema se da incluso en inglés si se expande la grid de tipos.

---

## 2. Opciones evaluadas

### A. Auto-scroll al botón
Al abrir el selector (o al seleccionar continente/nivel), hacer `scrollIntoView` del botón.

- **Pro**: Cero cambios de layout.
- **Contra**: El usuario pierde de vista la selección que acaba de hacer. Efecto desorientador. No resuelve el problema de fondo (el usuario no sabe que puede hacer scroll hacia arriba si necesita cambiar algo). Parche, no solución.
- **Veredicto**: Descartado.

### B. Reducir spacing global
Bajar gap de 1.5rem a 1rem, padding de 2rem a 1.5rem.

- **Pro**: Simple, gana ~6rem.
- **Contra**: Afecta a todos los idiomas (incluidos los que no tienen problema). El selector se siente más apretado.
- **Veredicto**: Posible como complemento, no como solución principal.

### C. Sticky «Empezar» en la parte inferior del modal
`position: sticky; bottom: 0` dentro del contenedor scrollable.

- **Pro**: Siempre visible, sin reestructurar el layout.
- **Contra**: El glassmorphism del fondo no cubre bien el contenido que hace scroll por debajo del botón. Requiere un gradient/fade-out para que no se vea texto cortado debajo del botón. Visualmente frágil.
- **Veredicto**: Viable pero visualmente inferior a la opción D.

### D. Botón fijo fuera del scroll (patrón estándar móvil)
Separar el botón «Empezar» del contenido scrollable. El modal se divide en dos zonas:
1. **Zona scrollable**: todo el contenido actual menos el botón.
2. **Zona fija inferior**: el botón «Empezar/Continuar» (+ banner de sello si aplica).

- **Pro**: Patrón estándar en apps móviles (checkout, formularios, etc.). El CTA siempre visible. Funciona en cualquier idioma y cualquier dispositivo. Resuelve el problema de raíz.
- **Contra**: Requiere reestructurar el JSX (mover botón fuera del scroll container) y ajustar CSS (la zona fija necesita su propio fondo/borde).
- **Veredicto**: Recomendado.

### E. Reducir contenido visible (colapsar secciones)
Colapsar «Elige juego» por defecto, mostrando solo continente + nivel + botón Empezar.

- **Pro**: Reduce drásticamente la altura.
- **Contra**: Rompe el flujo actual donde Aventura ya está seleccionado y visible. Añade un tap extra. Contradice el diseño actual (DESIGN.md § Selector).
- **Veredicto**: Descartado.

---

## 3. Recomendación

**Opción D** (botón fijo fuera del scroll), opcionalmente combinada con **ajustes menores de spacing** (opción B) para ganar margen extra.

### Cambios concretos

**CSS** (`LevelSelector.css`):

```css
/* El contenedor principal usa flex column con el botón al final */
.level-selector__content {
  /* ... existente ... */
  /* QUITAR overflow-y: auto de aquí */
}

/* Nueva zona scrollable (todo menos el botón) */
.level-selector__scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

.level-selector__scroll::-webkit-scrollbar {
  display: none;
}

/* Zona fija inferior (botón + banner de sello) */
.level-selector__footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--glass-border);
}
```

**JSX** (`LevelSelector.tsx`):

```tsx
<div className="level-selector__content">
  <div className="level-selector__scroll">
    {/* Títulos, pills, niveles, aventura, tipos... */}
  </div>
  <div className="level-selector__footer">
    {/* Banner de sello (si aplica) */}
    {/* Botón Empezar/Continuar */}
  </div>
</div>
```

### Ajustes menores de spacing (complemento)

Para ganar margen adicional en pantallas pequeñas, sin afectar la estética en pantallas normales:

- Reducir gap general de `--spacing-lg` (1.5rem) a `--spacing-md` (1rem) entre las secciones de título → contenido (el gap grande se mantiene entre bloques lógicos).
- Reducir padding del modal de `--spacing-xl` (2rem) a `--spacing-lg` (1.5rem).

Esto gana ~4rem (~64px) adicionales, suficiente para cubrir iPhone SE y Android compacto.

---

## 4. Impacto

- **Archivos**: `LevelSelector.tsx`, `LevelSelector.css`
- **Riesgo**: Bajo. Es reestructuración visual, no lógica.
- **Testing**: Verificar en japonés, ruso, alemán, español, inglés. Con y sin grid de tipos expandida. Con y sin banner de sello.
