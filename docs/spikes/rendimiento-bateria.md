# Spike: Rendimiento y consumo de batería

> **Problema reportado**: El móvil se calienta al jugar y consume batería.
> **Método**: 3 investigadores + 3 refutadores (adversarial review). Cada hallazgo fue verificado y desafiado independientemente.

---

## Resumen ejecutivo

El calentamiento no se debe a un único bug, sino a la **acumulación de varios factores** que mantienen CPU activa constantemente durante el juego. No hay "crisis" de rendimiento, pero hay optimizaciones claras que reducirían significativamente el consumo.

**Hallazgos que sobreviven al doble escrutinio** (ordenados por impacto):

| # | Hallazgo | Impacto | Esfuerzo |
|---|----------|---------|----------|
| 1 | Canvas a DPR×3 sin necesidad | ALTO | Bajo |
| 2 | RAF nunca se detiene (ni entre preguntas) | ALTO | Bajo |
| 3 | Sin pausa de RAF al ir a background | MEDIO | Bajo |
| 4 | Persist middleware escribe a disco en cada intento | MEDIO | Bajo |
| 5 | Proyección D3 se recrea en cada draw | BAJO | Medio |

**Hallazgos descartados tras refutación**:
- React re-renders excesivos → React 19 batching los agrupa. No es problema.
- Zustand suscripciones amplias → Selectores granulares bien implementados.
- Haptics → Frecuencia baja, controlada, solo en eventos discretos.
- geoDistance() costoso → 300 calls × 0.5µs = 0.15ms. Negligible.
- measureText char-by-char → Solo para etiquetas de mares, ~10µs total.

---

## Hallazgos detallados

### 1. Canvas renderiza a DPR×3 (resolución nativa completa)

**Archivo**: `GlobeD3.tsx:1213-1222`

```tsx
const dpr = window.devicePixelRatio || 1;  // iPhone 14+: dpr = 3
canvas.width = rect.width * dpr;           // 390 × 3 = 1170 px
canvas.height = rect.height * dpr;         // 844 × 3 = 2532 px
```

El canvas renderiza a **1170×2532 píxeles** en un iPhone 14+. Cada `path(feature)`, `fill()`, `stroke()` y `fillText()` opera sobre esta resolución. Es ~3× más trabajo que a DPR=1 y ~2.25× más que a DPR=2.

**En Canvas 2D (a diferencia de WebGL), la rasterización es principalmente CPU**, no GPU. Más píxeles = más CPU = más calor.

**Propuesta**: Reducir a `Math.min(dpr, 2)`. La diferencia visual entre DPR=2 y DPR=3 es imperceptible en un globo con bordes suaves, pero el ahorro de rasterización es ~56% menos píxeles.

### 2. requestAnimationFrame nunca se detiene

**Archivo**: `GlobeD3.tsx:1104-1109`

```tsx
// El loop corre siempre, incondicionalmente
animFrameRef.current = requestAnimationFrame(animate);
```

El loop RAF corre a ~60fps permanentemente. El dirty flag (`shouldDraw`) evita llamar a `draw()` cuando no hay cambios — **esto funciona correctamente en idle**. El coste de un frame vacío es ~0.1-0.5ms (negligible).

**El problema real**: Durante el juego, entre pregunta y pregunta, hay ventanas de 1-3 segundos donde el globo está quieto pero RAF sigue corriendo. Sumado a que durante el juego la auto-rotación está desactivada y no hay interacción, estos frames vacíos podrían evitarse completamente.

**Propuesta**: Implementar un mecanismo de "sleep" que detenga RAF cuando no hay animaciones activas (no flyTo, no inercia, no drag, no auto-rotación) y lo rearme con `needsRedrawRef.current = true` cuando cambian props o hay interacción.

### 3. Sin pausa de RAF al ir a background

**Archivos**: `ios/App/AppDelegate.swift`, `capacitor.config.ts`

- `applicationDidEnterBackground()` está vacío en AppDelegate.
- No se usa `@capacitor/app` para escuchar eventos de ciclo de vida.
- iOS pausa RAF automáticamente en WKWebView, pero hay un delay de ~50-200ms.

**Propuesta**: Instalar `@capacitor/app` y escuchar `appStateChange` para pausar RAF explícitamente al ir a background y rearmarlo al volver a foreground.

### 4. Persist middleware escribe a Preferences en cada intento

**Archivos**: `appStore.ts` (persist middleware), `persistStorage.ts`, `useGameSession.ts:276-280`

Cada vez que el usuario responde una pregunta:
1. `submitAnswer()` → `recordAttempt()` → modifica el store
2. Zustand persist detecta el cambio → llama `setItem()`
3. `setItem()` serializa TODO el árbol de profiles a JSON
4. Escribe a Capacitor Preferences (async, no bloquea)

El write es asíncrono (no bloquea RAF), pero la **serialización JSON del árbol completo de profiles** sí consume CPU en el hilo principal. Con historial acumulado, el payload crece.

**Propuesta**: Debounce del persist — acumular cambios y escribir cada ~5 segundos en vez de por cada intento. Zustand persist no lo soporta nativamente, pero se puede implementar con un wrapper en `setItem`.

### 5. Proyección D3 se recrea en cada draw

**Archivo**: `GlobeD3.tsx:541-548`

```tsx
const projection = geoOrthographic()
  .scale(scaledRadius)
  .translate([cx, cy])
  .clipAngle(90)
  .rotate(rotationRef.current);
```

Se crean instancias nuevas de `geoOrthographic()` y `geoPath()` en cada llamada a `draw()`. Coste estimado: ~500-800µs por frame.

**Matiz** (del refutador): Esto solo ocurre cuando `shouldDraw = true`, no en frames vacíos. En gameplay con animaciones activas, son ~20-40 frames reales por segundo. El coste total es ~16-32ms/s — aceptable pero optimizable.

**Propuesta**: Cachear la proyección y solo recrearla cuando cambien `rotation`, `scale` o `translate`. Evaluar si `projection.rotate()` muta la instancia (lo que haría innecesario recrearla).

---

## Hallazgos menores (no urgentes)

- **Inercia post-drag**: Dibuja durante ~800-1200ms con friction 0.85. Aceptable para la UX pero podría tener early-stop más agresivo.
- **Etiquetas char-by-char**: Solo para mares (spacing > 0). Coste ~10µs. No merece optimización.
- **Colisión de etiquetas O(n²)**: ~100 etiquetas max → ~10K comparaciones → ~1ms. Aceptable.

---

## Plan de acción propuesto

### Fase 1 — Quick wins (impacto alto, esfuerzo bajo)

1. **Limitar DPR a 2**: Cambiar `window.devicePixelRatio` → `Math.min(window.devicePixelRatio, 2)` en el setup del canvas. ~56% menos píxeles.

2. **Parar RAF cuando idle**: Implementar sleep/wake. Dejar de llamar `requestAnimationFrame` cuando no hay nada que animar. Rearmar con cualquier trigger (prop change, touch, flyTo).

3. **Pausa en background**: Instalar `@capacitor/app`, escuchar `appStateChange`, cancelar RAF al ir a background.

4. **Debounce persist**: Wrapper en `setItem` que acumule writes y haga flush cada 5s (y en `beforeunload`/`appStateChange` para no perder datos).

### Fase 2 — Optimizaciones adicionales (si fase 1 no es suficiente)

5. **Cachear proyección D3**: Reutilizar instancia si rotation/scale/translate no cambiaron.
6. **Reducir inercia**: Bajar threshold de `INERTIA_MIN_VELOCITY` o reducir duración máxima.

---

## Metodología

Spike realizado con 6 agentes en modelo adversarial:

| Rol | Agente | Resultado |
|-----|--------|-----------|
| Investigador Canvas/D3 | canvas-render | 5 hallazgos, todos exagerados según refutador |
| Refutador Canvas/D3 | canvas-render-refuter | Guards hemisféricos y dirty flag son más efectivos de lo reportado |
| Investigador React/Zustand | react-state | Sin problemas críticos. React 19 batching funciona bien |
| Refutador React/Zustand | react-state-refuter | Confirma: React.memo sería contraproducente, setState batching correcto |
| Investigador iOS/Capacitor | ios-platform | "Calentamiento es normal" |
| Refutador iOS/Capacitor | ios-platform-refuter | Refuta conclusión: falta config WKWebView, persist por intento, sin lifecycle |

**Conclusión del escrutinio adversarial**: Los investigadores tendían a exagerar severidad (canvas) o a minimizar problemas (iOS). Los refutadores proporcionaron el contexto faltante. Los 5 hallazgos finales son los que sobreviven a ambas perspectivas.
