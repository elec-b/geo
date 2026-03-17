# Spike: Hit testing en archipiélagos y margen de tolerancia

> **Objetivo**: Investigar por qué tocar un país a veces se considera error en Pruebas de Sello y tipos A/B, y diseñar una solución general.
>
> **Resultado**: Problema reproducible con Samoa, Túnez, Guatemala. Solución propuesta: margen de proximidad adaptativo en la validación del juego.

---

## 1. Problema reportado

En Pruebas de Sello y tipos A/B ("Señala el país/capital"), el usuario toca sobre o muy cerca del país correcto pero la app lo considera error. Ocurre con todo tipo de países:
- **Archipiélagos** (Samoa): tap cae en océano entre islas o cerca de territorio no-ONU
- **Países pequeños** (Túnez): tap cae ligeramente fuera de la frontera
- **Países rodeados de vecinos** (Guatemala): tap cae en un vecino

---

## 2. Causa raíz

### Pipeline de hit testing (GlobeD3.tsx:932-1011)

| Fase | Mecanismo | Qué retorna |
|------|-----------|-------------|
| 1 | Marcadores microestados ONU (20-30px) | Microestado ONU más cercano |
| 2 | `geoContains` (geometría real) | Primer país cuyo polígono contiene el punto |
| 3 | `pointInPolygon` en convex hulls | Archipiélago cuyo hull contiene el punto |
| 4 | Hit area microestados no-ONU (20-30px) | Microestado no-ONU más cercano |
| — | null | Nada encontrado |

El hitTest funciona correctamente — retorna el país cuya geometría contiene el punto tocado. El problema es que **la geometría 50m es imprecisa** y **el dedo humano (~44px) no es un punto**. Un tap "sobre el país" puede caer técnicamente fuera de su polígono.

### Validación del juego (JugarView.tsx:462-477)

```
hitTest(x,y) → feature → cca2 → submitAnswer(cca2)
```

La única tolerancia actual es `MICROSTATE_PAIRS` (11 pares hardcodeados como IT-VA, FR-MC). Si el hitTest retorna un vecino que no está en MICROSTATE_PAIRS, o retorna null, es error o sin respuesta.

### Investigación de geometría (Samoa)

Verificado en datos raw: Samoa (WS) tiene 2 polígonos limpios en [-172.78°, -171.45°], **NO cruza el antimeridiano**, geometría intacta. El problema no es de datos corruptos sino de precisión táctil.

---

## 3. Solución: Margen de Proximidad Adaptativo

### Concepto

En contexto de juego (A/B y Pruebas de Sello), si el hitTest no retorna el país target, verificar si el tap estaba **lo suficientemente cerca** del target para aceptarlo. Usa `geoDistance` al centroide del target.

### Ubicación: `handleCountryClick` en JugarView.tsx

- El juego conoce el `targetCca2`; el hitTest no (y no debería)
- No afecta a Explorar, solo aplica en juego
- Compatible con MICROSTATE_PAIRS existente

### Casos cubiertos

| Situación | Hoy | Con margen |
|-----------|-----|-----------|
| hitTest → target | Correcto ✅ | Sin cambio |
| hitTest → vecino (en MICROSTATE_PAIRS) | Correcto ✅ | Sin cambio |
| hitTest → vecino (NO en MICROSTATE_PAIRS) | Error ❌ | Si tap más cerca de target → aceptar |
| hitTest → null (océano/fuera de geometría) | Sin respuesta | Si tap cerca de target → aceptar |

### Algoritmo

```
1. hitTest retorna feature (o null)
2. Si cca2 === target → aceptar (sin cambio)
3. Si cca2 !== target y MICROSTATE_PAIRS → aceptar (sin cambio)
4. Calcular geoDistance(tapCoords, targetCentroid)
5. Si cca2 !== target (vecino):
   - Calcular geoDistance(tapCoords, detectedCentroid)
   - Si distancia al target < distancia al detectado → aceptar como target
6. Si cca2 === null:
   - Si distancia al target < margen → aceptar como target
```

### Margen angular

Base: **0.05 radianes** (~2.9°, ~320 km), escalado inversamente con zoom:

```
marginRad = 0.05 / zoom
```

| Zoom | Margen | Equivalente |
|------|--------|-------------|
| 1.5 (continental) | 0.033 rad (~1.9°) | ~210 km |
| 3 | 0.017 rad (~0.95°) | ~105 km |
| 5 | 0.010 rad (~0.57°) | ~63 km |
| 10 | 0.005 rad (~0.29°) | ~32 km |
| 20+ | 0.0025 rad (~0.14°) | ~16 km |

A zoom bajo (continental, donde el problema es peor), el margen es más generoso. A zoom alto (usuario ha hecho zoom-in), el margen se reduce porque las geometrías son más grandes en pantalla.

### Resolución de conflictos

Cuando hitTest retorna un **vecino** en vez del target, el paso 5 compara distancias al centroide. Esto funciona correctamente porque:
- Si tocas en la frontera Túnez-Argelia: Túnez (pequeño) tiene el centroide mucho más cerca que Argelia (enorme, centroide en el Sáhara)
- Si tocas entre Guatemala y El Salvador: distancias similares, pero el margen actúa como "bonus" para el target

---

## 4. Zonas de riesgo analizadas

### Pares críticos (centroides < 1°)

| Par | Distancia | MICROSTATE_PAIRS |
|-----|-----------|------------------|
| Bélgica-Luxemburgo | ~0.5-1° | ✅ Ya cubierto |
| Samoa-S. Americana | ~0.5° | ✅ Fix aplicado (AS-WS) |
| Rep. Dominicana-Haití | ~0.5-1° | ❌ Evaluar |

### Pares altos (1-2°)

Balcanes (Serbia-Bosnia, Montenegro), América Central (Guatemala y vecinos), Caribe (Antigua-Dominica), Oriente Medio (Qatar-Bahréin, ya en MICROSTATE_PAIRS).

### Pares medios (2-3°)

Túnez-Argelia, Túnez-Libia, varios pares en África occidental.

**Conclusión**: El margen de ~1° a zoom continental no causa conflictos con la mayoría de pares porque el paso 5 (comparar distancias) resuelve ambigüedades. Solo es problemático cuando el tap está equidistante de ambos centroides, lo cual es muy raro.

---

## 5. Cambios necesarios

### 5.1 GlobeD3.tsx — Exponer inversión de coordenadas

Nuevo método en `GlobeD3Ref`:

```typescript
getClickCoords(x: number, y: number): [number, number] | null
```

Usa `projectionRef.current.invert([x, y])` para convertir coordenadas canvas → geo.

### 5.2 GlobeD3.tsx — Notificar taps en océano al juego

Actualmente, cuando hitTest retorna null, se llama a `onDeselectRef` pero NO a `onCountryClick`. Para que el juego pueda evaluar el margen, necesita recibir los taps en océano.

Opción más limpia: modificar `onCountryClick` para aceptar `null`:

```typescript
onCountryClick?.(feature as CountryFeature | null, x, y);
```

### 5.3 JugarView.tsx — Lógica de margen

Añadir constantes y funciones helper. Modificar `handleCountryClick` para incluir la lógica de proximidad (pasos 4-6 del algoritmo).

### 5.4 DESIGN.md — Documentar

Documentar el sistema de tolerancia: concepto, parámetros, comportamiento.

---

## 6. Fix inmediato aplicado

Añadido `'AS-WS'` a MICROSTATE_PAIRS (JugarView.tsx:41) como parche para el caso más crítico reportado (Samoa ↔ Samoa Americana).

---

## 7. Archivos relevantes

| Archivo | Líneas | Contenido |
|---------|--------|-----------|
| `GlobeD3.tsx` | 932-1011 | hitTest: las 4 fases |
| `GlobeD3.tsx` | 1448-1465 | handlePointerUp: dispatch de clicks |
| `JugarView.tsx` | 37-41 | MICROSTATE_PAIRS |
| `JugarView.tsx` | 462-508 | handleCountryClick |
| `useGameSession.ts` | 265-273 | submitAnswer |
