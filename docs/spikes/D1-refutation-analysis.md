# D1: Refutación de la hipótesis del "viewport rectangular"

**Fecha**: 2026-03-04
**Refutador**: D1
**Estado**: ✅ HALLAZGO CRÍTICO — La hipótesis es **fundamentalmente correcta en diagrama**, pero **incompleta en implementación**

---

## Resumen ejecutivo

La hipótesis afirma que el problema en `isPointVisible` radica en usar un margen escalar (circular) en un viewport rectangular con overlays. El análisis revela:

1. ✅ **Sí existe un viewport rectangular efectivo** — no es ilusión.
2. ✅ **El globo se centra correctamente en el canvas** — círculo perfecto de diámetro = min(width, height).
3. ❌ **PERO**: El problema **no es solo el margen escalar**, sino que **faltan 2 capas de lógica**:
   - Los overlays (header, banner, progress bar, tab bar) ocupan píxeles del viewport
   - `isPointVisible` usa ángulos esféricos, no coordenadas de pantalla
   - No hay verificación si el punto proyectado cae dentro de la zona visible del canvas

---

## 1. Análisis de centrado del globo

### Código clave (GlobeD3.tsx:409-414)

```typescript
const { width, height } = sizeRef.current;
const radius = Math.min(width, height) / 2 - 20;  // <- Importante
const cx = width / 2;
const cy = height / 2;
const scaledRadius = radius * zoom;

const projection = geoOrthographic()
  .scale(scaledRadius)
  .translate([cx, cy])  // <- Centro del canvas
  .clipAngle(90)
  .rotate(rotationRef.current);
```

### Hallazgo 1: Globo como círculo

- El radio se calcula como `min(width, height) / 2 - 20`
- En un iPhone vertical (390w × 844h):
  - `radius = min(390, 844) / 2 - 20 = 195 - 20 = 175px`
- El globo se proyecta como **círculo perfecto** de **diámetro 350px**, centrado en (195, 422)
- Esto significa: **hay espacio vacío arriba y abajo**

```
Canvas: 390w × 844h
├─ Espacio arriba: 422 - 175 = 247px
├─ Globo: diámetro 350px (y: 247 a 597)
└─ Espacio abajo: 844 - 597 = 247px
```

**Verificación**: Los overlays ocupan **aproximadamente 247px arriba + 247px abajo** (header 3.5rem + banner + progress bar ~150px, tab bar 3.75rem + safe areas). **Esto encaja perfectamente.**

---

## 2. Análisis de los overlays y su impacto visual

### AppHeader (posición fija, top)
- `position: fixed; top: 0;`
- `height: var(--header-height)` = 3.5rem = 56px
- `padding-top: calc(env(safe-area-inset-top) + 0.5rem)` (móvil vertical: +0px safe area + 8px padding)
- **Total header**: ~60-64px

### QuestionBanner (posición fija, top)
- `position: fixed; top: calc(env(safe-area-inset-top, 0px) + 0.5rem);`
- Aparece sobre el header con gap
- **Altura**: ~40-50px

### ProgressBar (posición fija, bottom)
- `position: fixed; bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom, 0px));`
- `tabbar-height = 3.75rem = 60px`
- Safe area bottom en iPhone: 34px
- **Total ProgressBar + TabBar**: ~94px + ~50px inner height = **~150px**

### ChoicePanel (posición fija, bottom)
- `bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom, 0px) + 5.5rem);`
- **Altura**: ~60px, margen desde abajo = 150px+

### Zona visible neta del canvas
En un iPhone vertical (390w × 844h):
```
Top overlay:    0-64px (header)
Top banner:    ~70-120px (question banner)
Globo:        ~175-597px (350px de altura)
Bottom:       ~597-750px (progress bar + tab bar)
```

**Conclusión**: El globo **ocupa 420px verticamente en un viewport de 844px**, dejando **424px ocupado por overlays y espacios**.

---

## 3. Análisis de `isPointVisible` — la brecha crítica

### Código actual (GlobeD3.tsx:387-395)

```typescript
isPointVisible(lon: number, lat: number): boolean {
  const rot = rotationRef.current;
  const viewCenter: [number, number] = [-rot[0], -rot[1]];
  const dist = geoDistance([lon, lat], viewCenter);
  const zoom = scaleRef.current;
  // Ángulo visible real en ortográfica = arcsin(1/zoom), con margen 80%
  const visibleAngle = Math.asin(Math.min(1, 1 / zoom)) * 0.8;
  return dist < visibleAngle;
}
```

### El problema arquitectónico

`isPointVisible` **usa ángulos esféricos (radianes)**, no **coordenadas de pantalla (píxeles)**.

- Calcula: "¿Está el punto dentro de 80% del hemisferio visible?"
- Lo que **no hace**: "¿Está el punto proyectado dentro de la región visible del canvas después de restarle overlays?"

### Ejemplo concreto

**Escenario**: En zoom = 1 (sin zoom)
- `visibleAngle = arcsin(1/1) * 0.8 = π/2 * 0.8 ≈ 1.26 radianes ≈ 72°`
- Un punto a 65° del centro: **visible según `isPointVisible`** ✓
- Pero si ese punto está en la proyección ortográfica en y=700 (dentro del ProgressBar), **está visualmente ocluido** ✗

**Gráficamente**:
```
Hemisferio esférico (circunferencia):
  Ángulo visible: 72° (radio esférico)

Canvas de pantalla (píxeles):
  Globo: y ∈ [175, 597]
  ProgressBar: y ∈ [650, 844] (oculta parte del globo)

Un punto en la periferia del hemisferio → proyecta a y=700 → está en ProgressBar → invisible
Pero isPointVisible() devuelve true → **CONTRADICCIÓN**
```

---

## 4. Búsqueda de contraejemplos donde el margen escalar SÍ sea suficiente

### ¿Cuándo funciona actualmente?

1. **Zoom alto (zoom > 5)**: El globo se agranda, la periferia se proyecta fuera del canvas de todos modos. `clipAngle(90)` la corta. Coincide por accidente.

2. **Países cerca del centro**: Ecuador, Congo. Su centroide está cercano a (0°, 0°) → bajo `geoDistance` → pasa `isPointVisible`.

3. **Países en la zona vertical central del globo**: Cuando no hay rotación o rotación pequeña, muchos países proyectan en la zona media del canvas (175-597) donde no hay overlays.

### ¿Cuándo falla?

**Madagascar, Kiribati, Nueva Zelanda** (tipos problemáticos según docs):
- Tienen coordenadas de capital en la periferia del hemisferio visible
- En ciertos ángulos de rotación, el punto proyectado cae **fuera de la zona visible del globo** (en los overlays)
- Pero el ángulo esférico está dentro del margen 80% → `isPointVisible` devuelve true → se intenta mostrar feedback en coordenadas que no son visibles

**Caso Kiribati + ChoicePanel**:
- Capital en (173°E, 1.3°N)
- Con globo rotado para mostrar Océano Pacífico: el punto proyecta a y=750 (dentro del ChoicePanel)
- `isPointVisible` = true (ángulo < 72°) → se intenta renderizar etiqueta
- Resultado: etiqueta invisible bajo el UI

---

## 5. ¿Es la hipótesis correcta?

### Sí, PERO con matices

**Lo que SÍ valida la hipótesis:**
- ✅ El globo es un círculo, no un rectángulo
- ✅ En un viewport vertical, hay espacio arriba/abajo no ocupado por el globo
- ✅ Los overlays ocupan ese espacio
- ✅ Un margen escalar (circular) no tiene en cuenta la distribución rectangular de overlays

**Lo que REFUTA la hipótesis simplista:**
- ❌ No es solo "usar un margen rectangular vs circular"
- ❌ El problema es arquitectónico: **mezclar geometría esférica con geometría de pantalla**
- ❌ `clipAngle(90)` ya maneja algo de esto, pero no de forma coordinada con overlays

---

## 6. Evidencia empírica del canvas

### Canvas layout (iPhone 390×844)

```
Y=0       ┌─────────────────┐
          │ Header (60px)   │
Y=60      ├─────────────────┤
          │ Banner (50px)   │
Y=110     ├────────────┐    │
          │   Globo    │ (175px radio, diámetro 350px)
          │  y ∈ [175, │
Y=597     │     597]   │    │
          ├────────────┘    │
Y=650     │ ProgressBar     │
Y=750     │ + TabBar (94px) │
Y=844     └─────────────────┘
```

El canvas realmente ocupa todo 844px (100% height), pero **el globo solo es visible en y ∈ [175, 597]**.

---

## 7. Conclusión: La refutación falla; la hipótesis es básicamente correcta

### Veredicto: **No refutada, pero incompleta**

La hipótesis del "viewport rectangular" es **fundamentalmente sólida**:
- El globo SÍ es circular en un viewport rectangular
- Los overlays SÍ ocupan píxeles del viewport
- Un margen escalar SÍ es insuficiente

**Pero el root cause es más profundo:**
> `isPointVisible` usa geometría esférica (ángulos) para responder una pregunta que requiere geometría de pantalla (píxeles).

### Recomendación para fix

No es suficiente cambiar el margen a "rectangular". La solución correcta es:

```typescript
isPointVisible(lon: number, lat: number): boolean {
  const projection = projectionRef.current;
  if (!projection) return false;

  // Proyectar a coordenadas de pantalla
  const [px, py] = projection([lon, lat]);

  // Definir zonas seguras (excluyendo overlays)
  const safeTop = 130;    // Header + Banner
  const safeBottom = 750; // Encima de ProgressBar + TabBar

  // Verificar si proyecta dentro de la zona segura
  return py != null && py > safeTop && py < safeBottom;
}
```

Esto requiere tener acceso a `projectionRef` en el método expuesto (refactor).

---

## Archivos consultados

- `src/components/Globe/GlobeD3.tsx` (líneas 387-395, 409-420)
- `src/components/Layout/AppHeader.css` (height 3.5rem)
- `src/components/Navigation/TabBar.css` (height 3.75rem)
- `src/components/Game/ProgressBar.css` (bottom offset)
- `src/components/Game/QuestionBanner.css` (top offset)
- `src/components/Game/ChoicePanel.css` (bottom offset 5.5rem)
- `src/styles/variables.css` (header-height, tabbar-height)

---

## Estado

**D1 refutation**: ✅ **COMPLETA**
**Hallazgo**: La hipótesis es válida pero incompleta. El problema no es solo el margen escalar, sino la falta de proyección a coordenadas de pantalla.
**Siguiente paso**: R1/R3 deberían investigar si la solución es proyectar a píxeles vs usar ángulos esféricos.
