# Spike: Animación de estrella giratoria al conseguir sello

> **Objetivo**: Al conseguir un sello en Pasaporte, la estrella ★ gira rápido y se ralentiza hasta detenerse. Efecto "trompo".
>
> **Decisión**: Viable con ~10 líneas de CSS. Sin cambios en JSX ni en JS.

---

## Estado actual

La animación `stampDrop` (400ms) hace aparecer el sello con un efecto bounce:

```css
@keyframes stampDrop {
  0%   { opacity: 0; transform: scale(0) rotate(-20deg); }
  70%  { transform: scale(1.15) rotate(5deg); }
  100% { opacity: 1; transform: scale(1) rotate(var(--stamp-rotation, 0deg)); }
}
```

- **Sello**: `<span class="passport-cell__stamp">` con clases `--earned` y `--animating`
- **Estrella ★**: pseudo-elemento `::after` del sello (carácter Unicode `\2605`)
- **Rotación final**: variable CSS `--stamp-rotation` (aleatoria, -8° a 8°)
- **Limpieza**: la clase `--animating` se retira tras 500ms vía `useEffect`

---

## Propuesta descartada: dos animaciones simultáneas en el sello

Se propuso aplicar `stampDrop` + `starRotate` ambas sobre el `<span>` del sello:

```css
/* ❌ NO FUNCIONA */
.passport-cell__stamp--animating {
  animation:
    stampDrop 400ms ease-out forwards,
    starRotate 400ms cubic-bezier(...) forwards;
}
```

**Motivo del descarte**: Ambas animaciones modifican `transform`. En CSS, cuando dos animaciones actúan sobre la misma propiedad simultáneamente, **la última en la lista gana** — el efecto `scale()` de `stampDrop` desaparecería. El sello solo giraría sin el bounce de caída.

---

## Propuesta aprobada: animar `::after` por separado

Los pseudo-elementos pueden tener su propia `animation`, independiente del padre. Esto permite girar la estrella sin interferir con `stampDrop` del sello.

### CSS a añadir

```css
@keyframes starSpin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.passport-cell__stamp--animating::after {
  animation: starSpin 450ms ease-out forwards;
}
```

### Cambio adicional en JS

Extender el timeout de limpieza de `--animating` de 500ms → 550ms para que la animación de 450ms complete holgadamente antes de que se retire la clase.

### Secuencia completa

| Tiempo | Sello (`<span>`) | Estrella (`::after`) |
|--------|-------------------|----------------------|
| 0ms | `stampDrop` inicia: scale 0→1.15, rotate -20°→5°, opacity 0→1 | `starSpin` inicia: rota rápido |
| 280ms | Bounce: scale 1.15→1, rotate 5°→`--stamp-rotation` | Desacelera (ease-out) |
| 400ms | `stampDrop` termina. Sello estático. | Sigue desacelerando |
| 450ms | — | `starSpin` termina en 360° (= 0° visual) |
| 550ms | Clase `--animating` se retira | — |

### Por qué funciona

1. **Sin conflicto de `transform`**: padre y `::after` son elementos distintos con transforms independientes.
2. **`ease-out` = desaceleración natural**: empieza rápido, termina lento. Exactamente el efecto "trompo" deseado.
3. **360° = vuelta completa**: la estrella termina en su orientación original. Sin saltos visuales.
4. **450ms**: suficientemente largo para percibir la desaceleración, suficientemente corto para no aburrir. La estrella sigue girando ~50ms después de que el sello "aterriza" — refuerza la sensación de inercia.

### Lo que se descartó

| Idea | Motivo |
|------|--------|
| 720° (2 vueltas) | A 450ms, 2 vueltas es demasiado rápido (~4.4 rps). La estrella ★ de 5 puntas se vuelve un blur indistinguible. 1 vuelta basta. |
| Girar todo el sello (Opción B) | Conflicto de `transform` con `stampDrop`. Además el borde del sello (especialmente `border-style: double` de capitales) delataría la rotación del contenedor. |
| Refactorizar `::after` → `<span>` | Innecesario. `::after` acepta `animation` perfectamente. |
| `cubic-bezier` con valores > 1 | Riesgo de comportamiento inconsistente en WKWebView (Safari). `ease-out` estándar da el mismo efecto de desaceleración sin riesgo. |
| Duración > 500ms | La clase `--animating` se retira vía `useEffect`. Alargar demasiado requiere tocar más JS. 450ms + 550ms timeout es el cambio mínimo. |

---

## Plan de implementación

1. **`PassportView.css`**: Añadir keyframe `starSpin` + regla `.passport-cell__stamp--animating::after` (~6 líneas)
2. **`PassportView.tsx`**: Cambiar timeout de 500ms → 550ms (1 número)
3. **Testing**: Conseguir un sello en dispositivo, verificar que el bounce + giro se ven bien juntos

**Estimación**: ~10 líneas de cambio total (6 CSS + 1 JS).
