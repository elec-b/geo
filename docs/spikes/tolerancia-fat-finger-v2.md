# Spike: Tolerancia fat finger v2 — evitar aciertos regalados entre microestados cercanos

**Fecha**: 2026-03-24
**Estado**: Propuesta
**Contexto**: Pruebas de sello (tipos A/B) regalan aciertos al pulsar "por la zona" en microestados del Caribe (KN, AG, DM, LC, VC, GD) y potencialmente en otros clusters.

---

## 1. Problema

La fórmula de tolerancia `max(0.005, 0.05 / zoom)` no discrimina entre un tap legítimo cerca del target y un tap ambiguo entre dos países cercanos. A zoom bajo (1.0–2.5), la tolerancia alcanza 0.02–0.05 rad (~130–320 km), superando la distancia entre islas adyacentes del Caribe (~95–210 km).

### Escenario típico (prueba de sello tipo A)

1. Pregunta: "Señala San Cristóbal y Nieves (KN)"
2. FlyTo continental en progreso (zoom ≈ 1.5)
3. Usuario toca océano a ~0.02 rad de AG (Antigua)
4. `handleOceanClick`: `distBoundary(KN, tap) ≈ 0.02 rad < tolerance(0.033 rad)` → **acierto regalado**

El usuario ni siquiera tocó cerca de KN — tocó cerca de AG, pero KN está dentro del radio de tolerancia.

### Clusters afectados

| Cluster | Pares críticos | Distancia mín | Problema a zoom ≤ |
|---------|---------------|--------------|-------------------|
| **Caribe (Antillas Menores)** | KN↔AG, LC↔VC, DM↔LC, VC↔GD | 0.0148 rad (95 km) | ≤ 3.4 |
| **Golfo Pérsico** | QA↔BH | 0.0224 rad (143 km) | ≤ 2.2 |
| **Sudeste Asiático** | SG↔MY | 0.0499 rad (318 km) | ≤ 1.0 (límite) |

### Dónde NO hay problema

- **Microestados europeos** (VA, SM, MC, LI, AD): cubiertos por `MICROSTATE_PAIRS`, no usan tolerancia geográfica.
- **Timor-Indonesia**: separados por >500 km. Fix en hitTest fase 3 (hulls) es independiente.
- **Islas solitarias** (MU, IS, CU, MG): vecino ONU más cercano está a >400 km.
- **Zoom alto** (tipos E/F, zoom >10): tolerancia mínima 0.005 rad, siempre menor que la distancia entre islas.

---

## 2. Causa raíz

`handleOceanClick` (JugarView.tsx:600-637) acepta un tap como acierto si `distToTarget < tolerance`, **sin verificar si hay otro país más cercano al punto de tap**. La tolerancia es un radio ciego.

`handleCountryClick` (JugarView.tsx:554-571) tiene una verificación parcial (`distToTarget < distToDetected`) pero solo compara contra el país que el hitTest devolvió, no contra todos los países cercanos.

---

## 3. Solución propuesta

**Principio**: Solo aplicar tolerancia si el target es el país más cercano al tap. Si hay ambigüedad (otro país más cerca), no regalar el acierto.

### Pseudocódigo

```typescript
function isTargetNearest(
  tapCoords: [number, number],
  targetCca2: string,
  distToTarget: number,          // min(distCentroid, distBoundary) — como hoy
  countryCentroids: Map<string, [number, number]>
): boolean {
  for (const [cca2, centroid] of countryCentroids) {
    if (cca2 === targetCca2) continue;
    if (geoDistance(tapCoords, centroid) < distToTarget) {
      return false;  // otro país está más cerca → ambiguo
    }
  }
  return true;
}
```

### Aplicación en handleOceanClick

```typescript
// Antes (hoy):
if (dist < tolerance) → ACIERTO

// Después:
if (dist < tolerance && isTargetNearest(tapCoords, targetCca2, dist, centroids)) → ACIERTO
```

### Aplicación en handleCountryClick

```typescript
// Antes (hoy):
if (distToTarget < tolerance && distToTarget < distToDetected) → redirigir a target

// Después:
if (distToTarget < tolerance && isTargetNearest(tapCoords, targetCca2, distToTarget, centroids)) → redirigir
```

### Decisiones de diseño

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| **Métrica para target** | `min(distCentroid, distBoundary)` | Mantiene ayuda fat finger en países alargados (Gambia, Chile) |
| **Métrica para competidores** | `distCentroid` | Conservador: si un centroide está más cerca, hay ambigüedad segura. Usar distBoundary sería demasiado estricto (rechazaría taps válidos cerca de países grandes) |
| **Países incluidos como competidores** | Todos (ONU + no-ONU) | Martinica (MQ) entre DM y LC es relevante; excluirla sesgaría hacia DM |
| **MICROSTATE_PAIRS** | Sin cambios, se evalúa antes | Resuelve VA/IT, SM/IT, MC/FR, etc. — casos donde la geometría del contenedor domina |
| **BASE_TOLERANCE_RAD** | Sin cambios (0.05) | El check de vecindad es la protección, no el radio |
| **Pruebas de sello vs juego** | Misma lógica | La protección aplica igualmente en ambos contextos |

---

## 4. Análisis de la asimetría de métricas

El crítico señaló que usar `distBoundary` para el target pero `distCentroid` para competidores crea un sesgo a favor del target. **Esto es intencional**:

- **Para el target**: usamos la mejor métrica disponible (incluyendo frontera) porque queremos ayudar con fat finger legítimo — el usuario intentó tocar ese país.
- **Para competidores**: usamos centroide porque es un proxy conservador de "hay otro país significativamente presente aquí". Si el centroide de un competidor está más cerca que la frontera del target, hay ambigüedad real.

**Caso límite**: un competidor con frontera muy cercana pero centroide lejano (ej. Indonesia-Timor). En este caso, la tolerancia favorece al target (Timor), lo cual es el comportamiento deseado — el fix de Timor en hitTest fase 3 ya maneja el caso inverso (hull de Indonesia interceptando el tap).

---

## 5. Comportamiento esperado por escenario

### Caribe — aciertos regalados eliminados

| Pregunta | Tap en... | distToTarget | Competidor más cercano | Resultado |
|----------|----------|-------------|----------------------|-----------|
| KN | Océano entre KN y AG | 0.010 rad | AG centroide: 0.008 rad | **ERROR** (AG más cerca) |
| KN | Océano pegado a KN | 0.003 rad | AG centroide: 0.012 rad | **ACIERTO** (KN más cerca) |
| AG | Océano pegado a AG | 0.003 rad | KN centroide: 0.012 rad | **ACIERTO** (AG más cerca) |
| LC | Océano entre LC y VC | 0.008 rad | VC centroide: 0.007 rad | **ERROR** (VC más cerca) |

### Timor-Indonesia — sin regresión

| Pregunta | Tap en... | distToTarget | Competidor más cercano | Resultado |
|----------|----------|-------------|----------------------|-----------|
| TL | Océano al sur de Timor | 0.005 rad | ID centroide: 0.15 rad (Java) | **ACIERTO** (TL claramente más cerca) |
| TL | Sobre Indonesia (hull) | hitTest→ID, redirigido a TL por fase 3 | N/A (hitTest resuelve) | **ACIERTO** |

### Gambia-Senegal — sin regresión

| Pregunta | Tap en... | Mecanismo | Resultado |
|----------|----------|-----------|-----------|
| GM | Sobre Senegal | MICROSTATE_PAIRS (no aplica — GM/SN no están) | Tolerancia: distBoundary(GM) < distCentroid(SN) → **ACIERTO** |

### Islas solitarias — sin cambio

| Pregunta | Tap en... | Competidor más cercano | Resultado |
|----------|----------|----------------------|-----------|
| MU | Océano 50km de Mauricio | MG centroide: 1900 km | **ACIERTO** |
| IS | Océano 30km de Islandia | GB centroide: 1600 km | **ACIERTO** |

---

## 6. Performance

- 195–232 llamadas a `geoDistance()` por tap (ONU + no-ONU)
- Cada `geoDistance`: ~6 operaciones trigonométricas
- Total: ~1400 operaciones flotantes ≈ **<0.01ms** en iPhone
- Solo se ejecuta en tipos A/B cuando el tap es en océano o en país incorrecto
- **Impacto despreciable**

### Optimización opcional (no necesaria)

Los centroides ya están precomputados en `countryCentroidsRef` de GlobeD3.tsx. Solo hay que exponerlos vía la ref del globo.

---

## 7. Plan de implementación

### Archivos afectados
- `src/components/Game/JugarView.tsx` — añadir `isTargetNearest()`, modificar `handleOceanClick` y `handleCountryClick`
- `src/components/Globe/GlobeD3.tsx` — exponer `getAllCentroids()` en la ref (si no está ya accesible)

### Cambios estimados
- ~25 líneas nuevas (función `isTargetNearest` + integración en ambos handlers)
- 0 líneas eliminadas (no se toca la lógica existente, solo se añade una condición)
- Sin nuevas dependencias ni datos

### Casos de prueba manual
1. **Caribe**: Preguntar por KN, tocar entre KN y AG → debe ser error
2. **Caribe**: Preguntar por KN, tocar muy cerca de KN → debe ser acierto
3. **Timor**: Preguntar por TL, tocar océano al sur → debe ser acierto
4. **Timor**: Preguntar por TL, tocar sobre Indonesia (hull) → debe ser acierto (fase 3)
5. **Brasil**: Preguntar por BR, tocar océano cerca de la costa → debe ser acierto
6. **Mauricio**: Preguntar por MU, tocar océano cerca → debe ser acierto
7. **Golfo Pérsico**: Preguntar por QA, tocar entre QA y BH → debe ser error
8. **Prueba de sello completa América-Guía**: No debe regalar aciertos en Antillas Menores
