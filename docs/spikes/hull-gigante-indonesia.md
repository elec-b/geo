# Spike: Hull gigante envolviendo el planeta (Indonesia, Asia-Guía)

## Contexto

**Bug reportado**: Al jugar Asia-Guía y preguntar Indonesia, la línea discontinua del convex hull aparece rodeando todo el globo en vez de delimitar solo las islas del archipiélago.

**Estado actual**: El bug está **enmascarado** desde el commit `e96ea32` (14 marzo 2026), que añadió el gating `HULL_VISIBLE_CODES` al renderizado de hulls seleccionados. Indonesia no está en `HULL_VISIBLE_CODES`, así que su hull ya no se renderiza. Sin embargo, la causa raíz sigue presente en el código.

## Investigación

### Equipo de análisis

Spike investigado con 4 agentes en paralelo:
- **Investigador de código**: analizó cálculo y renderizado de hulls en `GlobeD3.tsx`
- **Investigador de datos**: examinó geometría de Indonesia y archipiélagos similares
- **Refutador de código**: verificó conclusiones y buscó explicaciones alternativas
- **Refutador de datos**: cuestionó hipótesis sobre datos vs algoritmo

### Hallazgos sobre Indonesia

| Métrica | Valor |
|---------|-------|
| Polígonos | 133 islas |
| Vértices totales | 3.717 |
| Rango longitud | 95.21°E — 140.98°E |
| Span longitudinal | 45.77° |
| Cruza antimeridiano | NO |
| Override 10m | NO |
| Vértices del hull | 21 |
| En ARCHIPELAGO_CODES | SÍ |
| En HULL_VISIBLE_CODES | NO |

### Paths de renderizado del hull

Solo existen **2 paths** de renderizado, ambos gateados por `HULL_VISIBLE_CODES`:

1. **Líneas 695-725** (`GlobeD3.tsx`): Hull del país seleccionado (estilo dorado, línea discontinua `[6, 4]`).
   - Condición: `effectiveSelected && HULL_VISIBLE_CODES.has(effectiveSelected) && archipelagoHullsRef.current.has(effectiveSelected)`
   - **Antes de `e96ea32`**: no verificaba `HULL_VISIBLE_CODES` → renderizaba Indonesia.

2. **Líneas 729-769**: Hulls siempre visibles (estilo blanco, fade-in por zoom).
   - Condición: `HULL_VISIBLE_CODES.has(cca2)` en línea 734.

No hay tercer path. El hit testing (líneas 1159-1169) usa los hulls sin renderizarlos.

### Cálculo del hull

- **Algoritmo**: Andrew's monotone chain (O(n log n)) — `computeConvexHull()`, línea 174.
- **Coordenadas**: Todos los vértices de geometrías Polygon/MultiPolygon del país.
- **Normalización de antimeridiano** (línea 1362): Si span > 180°, mapea longitudes negativas a [180, 360]. Para Indonesia: 45.77° < 180° → no normaliza.
- **Buffer proporcional** (línea 1377): Amplía 15% de extensión angular (acotado 0.15°-0.8°).

El cálculo es **correcto en 2D** — produce 21 vértices válidos que envuelven las islas de Indonesia.

## Diagnóstico: causa raíz

### El problema: winding order esférico

El bug es un conflicto entre **geometría euclidiana 2D** y **topología esférica**:

1. Andrew's monotone chain calcula un convex hull en coordenadas planas (lon, lat). El resultado es correcto en el plano.

2. El hull se convierte a GeoJSON Polygon y se pasa a `d3.geoPath()` con proyección ortográfica.

3. D3 interpreta polígonos GeoJSON según la **regla de la mano izquierda** (left-hand rule): el área a la izquierda de la dirección de los bordes es el "interior". En la esfera, el winding order determina si el interior es el polígono pequeño (las islas) o su complemento (todo el resto del globo).

4. Para un hull de 45.77° de extensión, si los vértices están en orden horario en la esfera, D3 interpreta como "interior" el **complemento del hull** (~314° del globo), dibujando la línea discontinua rodeando todo el planeta.

### Por qué solo afecta a archipiélagos grandes

- Archipiélagos pequeños (Fiji, Vanuatu, Islas Salomón): su hull es lo suficientemente pequeño para que el winding order no cause inversión topológica en la proyección.
- Indonesia (45.77°), Filipinas (~50°), Rusia (cruza antimeridiano): la extensión angular hace que la ambigüedad del winding order sea crítica.

### Cronología del bug

| Fecha | Evento |
|-------|--------|
| Pre 14-mar | Hull de Indonesia SE renderizaba (sin gating HULL_VISIBLE_CODES). El usuario observó el hull gigante. |
| 14-mar (`e96ea32`) | Se añadió `HULL_VISIBLE_CODES` al renderizado. Indonesia excluida → bug enmascarado. |
| 22-mar (`ed8e288`) | El usuario documentó el bug observado anteriormente en BACKLOG.md. |

## Propuesta de solución

### Opción A: Forzar winding order correcto (recomendada)

Después de calcular el hull con Andrew's y antes de crear el GeoJSON, asegurar que el anillo del polígono tiene **winding order anti-horario** (counter-clockwise) en la esfera. D3 proporciona `d3.geoArea()` para verificar:

```typescript
// Si el área esférica > 2π steradians, el polígono cubre más de la mitad
// de la esfera → invertir el winding order
const testGeoJSON = {
  type: 'Polygon',
  coordinates: [ring]
};
if (d3.geoArea(testGeoJSON) > 2 * Math.PI) {
  ring.reverse();
}
```

**Ventaja**: Corrige la causa raíz. Permite añadir Indonesia (y otros archipiélagos grandes) a `HULL_VISIBLE_CODES` sin riesgo.

**Coste**: Mínimo — un check de `geoArea()` por hull durante el cálculo (no en cada frame).

### Opción B: Usar d3.geoConvexHull (si existe) o librería esférica

Reemplazar Andrew's (euclidiano) por un algoritmo de convex hull esférico. No existe en D3 estándar, pero librerías como `spherical-geometry-js` ofrecen alternativas.

**Ventaja**: Corrección teórica completa.
**Coste**: Dependencia nueva. Posible sobringeniería para el caso actual.

### Opción C: Limitar renderizado a hulls < N° de extensión

Mantener el masking actual: solo renderizar hulls cuya extensión angular sea menor a un umbral (ej. 30°).

**Ventaja**: Zero code changes si el umbral ya se cumple.
**Desventaja**: No resuelve la causa raíz. Archipiélagos como Filipinas o Japón podrían tener problemas si se añaden a `HULL_VISIBLE_CODES`.

## Recomendación

**Opción A** — forzar winding order con `d3.geoArea()`. Es un fix de ~5 líneas que corrige la causa raíz y permite habilitar hulls para todos los archipiélagos sin riesgo. Aplicar en `computeConvexHull()` o justo después del buffering (línea ~1395).

Tras el fix, evaluar si Indonesia debería añadirse a `HULL_VISIBLE_CODES` (probablemente no — su hull sería muy grande visualmente, pero al menos el hit testing y el renderizado seleccionado funcionarían correctamente).

## Otros archipiélagos en riesgo

| País | Span longitudinal | Cruza antimeridiano | En HULL_VISIBLE_CODES | Riesgo |
|------|-------------------|---------------------|-----------------------|--------|
| Rusia | >80° | SÍ | NO | Alto |
| Filipinas | ~50° | NO | NO | Medio |
| Indonesia | 45.77° | NO | NO | Alto (bug observado) |
| Japón | ~28° | NO | NO | Bajo |
| Chile | ~75° (N-S) | NO | NO | Bajo (extensión latitudinal) |
| Fiji | ~5° (normalizado) | SÍ | SÍ | Bajo (ya normalizado) |
