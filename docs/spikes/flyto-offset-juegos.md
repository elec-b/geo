# Spike: Offset vertical de flyTo durante juegos

## Problema

Tras mover las preguntas y opciones al bloque inferior (`.game-bottom-group`), el **centro visual efectivo** de la pantalla ya no coincide con el **centro geométrico del canvas**. Cuando `flyTo` centra un país en el canvas, el país queda desplazado hacia abajo respecto a la zona visible real, parcialmente tapado o demasiado cerca del bloque de UI inferior.

Esto afecta a:
- **E/F**: el país resaltado queda bajo, difícil de examinar con las opciones encima
- **C/D**: tras responder, el zoom al país lo coloca bajo el panel de opciones
- **A/B y pruebas de sello**: el target queda bajo tras acierto/fallo (bottom group más corto, pero aún afecta)

## Estado actual

### flyTo (GlobeD3.tsx:433-459)

```typescript
flyTo(lon, lat, zoom?, duration = 800, latOffset = 0)
```

Acepta `latOffset` como 5.º parámetro, pero **es dead code**: ninguna de las ~21 llamadas desde `JugarView.tsx` lo usa. La infraestructura existe y está implementada:

```typescript
const effectiveOffset = targetScale > 1 ? latOffset / targetScale : latOffset;
// ...
endRotation: [endLon, -(lat - effectiveOffset)]
```

### isPointVisible (GlobeD3.tsx:484-492)

```typescript
const visibleAngle = Math.asin(Math.min(1, 1 / zoom)) * 0.8;
return dist < visibleAngle;
```

Fórmula puramente angular con margen del 80%. **No considera overlays de UI** — un punto "visible" geométricamente puede estar tapado por el header o el bottom group. Problema documentado en MEMORY.md.

### Compensaciones existentes (ninguna es offset vertical)

| Mecanismo | Ubicación | Qué hace |
|-----------|-----------|----------|
| Zoom adaptativo | `getCountryZoom` | `0.6/sqrt(area)`, clamped [1.5, 40] |
| Zoom suave E/F | `getEFZoom` | base×0.6, piso 2.0 |
| Auto zoom-out A/B | JugarView:435-507 | Si target no visible, zoom out adaptativo |
| centerOnCorrectAnswer | JugarView:96-106 | Re-centra si acierto A/B queda descentrado |

Todas son soluciones de **zoom o centering horizontal**, ninguna aplica offset vertical.

## Geometría de pantalla

### Mediciones (iPhone 14 Pro, 844px viewport lógico)

| Elemento | CSS base | Con safe area iOS | Total visual |
|----------|----------|-------------------|--------------|
| Header | 3.5rem (56px) | + env(safe-area-inset-top) ≈ 47px | ~103px* |
| Tab bar | 3.75rem (60px) | + env(safe-area-inset-bottom) ≈ 34px | ~94px |
| game-bottom-group (E/C/D/F) | QuestionBanner + ChoicePanel 2×2 + ProgressBar | — | ~230px |
| game-bottom-group (A/B/sello) | QuestionBanner + ProgressBar (sin opciones) | — | ~110px |

*\* Header usa `box-sizing: border-box` + `pointer-events: none` (transparente). Los botones glass son pequeños. A efectos de "zona de atención", el header tiene impacto menor que el bottom group.*

### Posición del game-bottom-group

```css
bottom: max(var(--tabbar-height), calc(var(--tabbar-height) + env(safe-area-inset-bottom) - 1.5rem));
/* ≈ max(60px, 60 + 34 - 24) = max(60, 70) = 70px desde el borde inferior del viewport */
```

El borde superior del bottom group queda a:
- **E/C/D/F**: 844 - 70 - 230 = **544px** desde arriba
- **A/B/sello**: 844 - 70 - 110 = **664px** desde arriba

### Centro visual efectivo

Considerando el header como zona de atención mínima (~50px, solo status bar/notch):

| Tipo | Zona visible | Centro visible | Centro canvas | **Desplazamiento** |
|------|-------------|---------------|---------------|---------------------|
| E/C/D/F | 50px → 544px | **297px** | 422px | **125px arriba** |
| A/B/sello | 50px → 664px | **357px** | 422px | **65px arriba** |

Si consideramos el header completo (~100px) como zona de atención:

| Tipo | Centro visible | **Desplazamiento** |
|------|---------------|---------------------|
| E/C/D/F | **322px** | **100px arriba** |
| A/B/sello | **382px** | **40px arriba** |

## Relación latOffset ↔ píxeles

### Fórmula del offset

La proyección ortográfica usa:
- `radius = Math.min(width, height) / 2 - 20` (GlobeD3.tsx:535)
- iPhone 14 Pro portrait: `radius = 393/2 - 20 = 176.5px`
- Escala: `scaledRadius = radius × zoom`

Desplazamiento en píxeles para un `latOffset` dado:

```
pixel_offset = scaledRadius × sin(effectiveOffset × π/180)
             = radius × zoom × sin((latOffset / zoom) × π/180)
             ≈ radius × latOffset × π/180    (para ángulos pequeños)
```

**El zoom se cancela.** Un `latOffset` constante produce un desplazamiento en píxeles constante, independiente del zoom:

```
pixel_offset ≈ radius × latOffset × π/180
```

### Tabla de conversión (radius = 176.5px)

| latOffset (°) | Pixel offset | % viewport (844px) |
|---------------|-------------|---------------------|
| 5° | ~15px | 1.8% |
| 10° | ~31px | 3.7% |
| 15° | ~46px | 5.5% |
| 20° | ~61px | 7.2% |
| 25° | ~77px | 9.1% |
| 30° | ~92px | 10.9% |

### Problema: a zoom bajo, el offset desplaza visiblemente el globo

A zoom ≈ 1, el globo es un círculo de ~353px de diámetro. Un offset de 60px desplaza el círculo un 17% de su diámetro — **se nota mucho** y queda raro.

A zoom ≥ 3, el globo desborda la pantalla (>1000px diámetro). Un offset de 60px es invisible — solo desplaza qué parte de la Tierra se ve.

## Propuesta de solución

### Enfoque: latOffset condicional por tipo de juego y zoom

No intentar centrar perfectamente en la zona visible (requeriría offsets enormes a bajo zoom). En su lugar, aplicar un offset **modesto y progresivo** que mejore la visibilidad sin distorsionar la vista.

### Parámetros propuestos

```typescript
// Constantes (calibrar empíricamente en dispositivo)
const GAME_LAT_OFFSET_ECDF = 12;  // ~37px, para tipos con ChoicePanel
const GAME_LAT_OFFSET_AB = 7;     // ~22px, para tipos sin ChoicePanel
const OFFSET_ZOOM_THRESHOLD = 2.5; // No aplicar a zoom bajo (globo visible entero)
const OFFSET_FADE_RANGE = 1.0;     // Rango de transición suave
```

### Función de cálculo

```typescript
function getGameLatOffset(gameType: GameType, targetZoom: number): number {
  // Sin offset a zoom bajo (globo entero visible, se notaría feo)
  if (targetZoom < OFFSET_ZOOM_THRESHOLD) return 0;

  // Fade-in progresivo entre threshold y threshold + range
  const fadeFactor = Math.min(1, (targetZoom - OFFSET_ZOOM_THRESHOLD) / OFFSET_FADE_RANGE);

  // Offset base según tipo de juego
  const baseOffset = isChoiceType(gameType)
    ? GAME_LAT_OFFSET_ECDF   // E/C/D/F: bottom group grande
    : GAME_LAT_OFFSET_AB;    // A/B/sello: bottom group pequeño

  return baseOffset * fadeFactor;
}
```

### Resultado esperado por escenario

| Escenario | Zoom típico | latOffset | Pixel shift | Comportamiento |
|-----------|------------|-----------|-------------|----------------|
| Rusia E/F | 1.5 | 0° | 0px | Sin offset (globo visible entero) |
| España E/F | 5 | 12° | ~37px | País sube ~37px, mejor visibilidad |
| Singapur E/F | 30 | 12° | ~37px | Microestado centrado ~37px arriba |
| España A/B | 5 | 7° | ~22px | Sube modestamente |
| Continente zoom | 1.2 | 0° | 0px | Sin offset (vista continental) |

### Puntos de aplicación

Aplicar `latOffset` en todas las llamadas a `flyTo` durante juegos y pruebas de sello. Hay ~21 call sites en JugarView.tsx. Para simplificar, centralizar en una función helper:

```typescript
// En JugarView.tsx
function gameFlyTo(
  globe: GlobeRef,
  lon: number, lat: number,
  zoom: number, duration: number,
  gameType: GameType
) {
  const offset = getGameLatOffset(gameType, zoom);
  globe.flyTo(lon, lat, zoom, duration, offset);
}
```

Y reemplazar las llamadas directas `globeRef.current.flyTo(...)` por `gameFlyTo(globeRef.current, ...)`.

### Qué NO cambiar

- **isPointVisible**: Sigue siendo angular puro. El offset del flyTo ya compensa la posición visual; no necesitamos que isPointVisible conozca el layout de UI.
- **Explorar**: Sin offset. Solo aplica en Jugar y pruebas de sello.
- **Zooms continentales**: Sin offset (zoom < 2.5, threshold los excluye automáticamente).

## Alternativas descartadas

### A. Offset por desplazamiento de la proyección (`translate`)
Mover `translate([cx, cy])` a `translate([cx, cy - offset])` desplazaría todo el renderizado del globo hacia arriba. Sería más simple pero:
- Requeriría condicionalidad (solo en juegos)
- Afectaría hit testing (coordenadas de toque descuadradas)
- Transición visible al entrar/salir de Jugar
- Invasivo para el motor de renderizado

### B. Centrar perfectamente en zona visible
Requeriría offsets de 65-125px (21-40° latOffset). A zoom bajo se ve antinatural. A zoom alto podría funcionar, pero los valores extremos generarían efectos secundarios (países apareciendo casi en el borde superior del globo visible).

### C. Reemplazar isPointVisible con proyección a píxeles
Ya descartado previamente (timing durante animaciones, DPR, acoplamiento con bounds de UI). No resuelve el problema de centering — solo el de visibilidad.

## Plan de implementación

1. Añadir `getGameLatOffset()` y `gameFlyTo()` como funciones helper en JugarView.tsx
2. Reemplazar las ~21 llamadas a `flyTo` por `gameFlyTo` (identificando el tipo de juego en cada una)
3. Excluir zooms continentales (ya excluidos por el threshold de zoom)
4. Calibrar constantes (`GAME_LAT_OFFSET_ECDF`, `GAME_LAT_OFFSET_AB`, `OFFSET_ZOOM_THRESHOLD`) en dispositivo real
5. Testear con países de distintos tamaños y zooms: Rusia (1.5), Francia (5), Singapur (30)
6. Testear pruebas de sello (que usan los mismos flyTo)

## Riesgo

**Bajo**. El cambio es aditivo — pasa un parámetro que hoy es 0 en todos los casos. Si el offset resulta incómodo, se revierte poniendo las constantes a 0.
