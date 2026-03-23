# Spike: Archipiélagos con resolución insuficiente en 1:50m

## Motivación

Testeando África-Guía, Seychelles muestra **1 sola isla** en la geometría 1:50m cuando el archipiélago tiene 115 islas reales (26 representadas en 1:10m). Ya se resolvió un problema similar para 8 países insulares de Oceanía con overrides selectivos 1:10m (`pacific-islands-10m.json`). Este spike investiga si otros archipiélagos necesitan el mismo tratamiento.

---

## Auditoría cartográfica

### Overrides existentes (8 países del Pacífico)

| País | Alpha2 | ID | 50m polys | 10m polys | Ratio |
|------|--------|----|-----------|-----------|-------|
| Tuvalu | TV | 798 | 0 | 9 | INF |
| Palaos | PW | 585 | 2 | 9 | 4.5x |
| Islas Marshall | MH | 584 | 5 | 22 | 4.4x |
| Micronesia | FM | 583 | 5 | 20 | 4.0x |
| Tonga | TO | 776 | 3 | 10 | 3.3x |
| Fiyi | FJ | 242 | 20 | 44 | 2.2x |
| Vanuatu | VU | 548 | 14 | 27 | 1.9x |
| Kiribati | KI | 296 | 19 | 35 | 1.8x |

### Candidatos nuevos evaluados

| País | Alpha2 | ID | Continente | 50m | 10m | Ratio | Veredicto |
|------|--------|----|------------|-----|-----|-------|-----------|
| **Maldivas** | MV | 462 | Asia | 2 | 176 | **88x** | **Override 10m** |
| **Seychelles** | SC | 690 | África | 1 | 26 | **26x** | **Override 10m** |
| Bahamas | BS | 044 | América | 15 | 42 | 2.8x | Sin cambios (15 polys suficientes) |
| Islas Salomón | SB | 090 | Oceanía | 21 | 48 | 2.3x | Sin cambios (ya tiene hull+outline) |
| Papúa N. Guinea | PG | 598 | Oceanía | 26 | 58 | 2.2x | Sin cambios (ya tiene hull+outline+centroide) |
| Mauricio | MU | 480 | África | 1 | 3 | 3.0x | Sin cambios (isla principal suficiente) |

### Candidatos descartados (50m ≈ 10m, no necesitan override)

Comoras (KM), Cabo Verde (CV), Santo Tomé y Príncipe (ST), San Cristóbal y Nieves (KN), Trinidad y Tobago (TT), Antigua y Barbuda (AG), Granada (GD). En todos estos casos la representación 50m es prácticamente idéntica a la 10m en número de polígonos.

---

## Análisis de impacto en gameplay

### Seychelles (SC) — Impacto ALTO

- **Reconocimiento visual (E/F)**: 1 isla = irreconocible como archipiélago. Con 26 polys (10m), se vería un grupo de islas reconocible.
- **Hit testing (A/B)**: Solo marcador de microestado. Sin hull útil — con 1 polígono, el convex hull envuelve solo Mahé (~28km), no las islas exteriores (50-150km).
- **Zoom**: Excesivo (fallback microestado, zoom ~40). Con más islas, `getCountryZoom` calcularía un zoom más adecuado.
- **Alternativa hull**: **NO funciona.** ARCHIPELAGO_CODES calcula el hull sobre los vértices de la geometría existente. Con 1 poly, el hull no se extiende a Praslin, La Digue ni islas exteriores.
- **Conclusión**: Override 10m es la **única solución viable**.

### Maldivas (MV) — Impacto ALTO

- **Reconocimiento visual (E/F)**: 2 atolones = 2 puntos irreconocibles. La silueta icónica de la cadena N-S de 800km es invisible. Con 176 polys (10m), se vería la cadena completa.
- **Hit testing (A/B)**: Solo marcador de microestado. Sin hull. Tocar entre los 2 atolones cae en océano.
- **Zoom**: Excesivo (fallback microestado). La extensión angular de 2 polys es mínima.
- **Alternativa hull**: Funciona **parcialmente** si los 2 polys están separados a lo largo de la cadena. Pero visualmente seguirían siendo "2 motas dentro de un outline".
- **Conclusión**: Override 10m preferido. Hull como fallback aceptable pero inferior.

### Bahamas (BS) — Impacto BAJO

- **Reconocimiento visual**: 15 islas muestran la cadena SE desde Florida. Reconocible.
- **Hit testing**: Hull funcional (ya en ARCHIPELAGO_CODES). Los cayos extra del 10m caen dentro del hull existente.
- **Zoom**: Correcto (area-based + hull extent).
- **Conclusión**: Solo añadir a HULL_VISIBLE_CODES (outline visual). No necesita override (+17.9 KB gzip no justificado).

### SB, PG, MU — Sin cambios necesarios

- **Islas Salomón / Papúa N. Guinea**: Ya tienen máxima compensación (ARCHIPELAGO_CODES + HULL_VISIBLE_CODES + CENTROID_OVERRIDES en PG). Gameplay resuelta.
- **Mauricio**: La isla principal es suficiente. Rodrigues (580km al este) no afecta reconocimiento ni hit testing.

---

## Evaluación de rendimiento

### Impacto del override propuesto (SC + MV)

| Dimensión | Valor | % sobre base |
|-----------|-------|-------------|
| Coords adicionales | +1.462 | +1.4% |
| Gzip adicional | +14.2 KB | +5.1% |
| Raw adicional | +57.1 KB | +7.7% |
| Render Canvas | +0.4ms/frame | +2.4% budget 60fps |
| Memoria heap | +57 KB | +1.4% |
| Arranque (parse) | +0.4ms | — |

**Veredicto**: Coste bajo en todas las dimensiones. Muy por debajo de los umbrales de veto (50 KB gzip, 5% coords).

### Tamaño estimado del archivo final

| Archivo | Raw | Gzip |
|---------|-----|------|
| `islands-10m.json` (8 Pacífico + SC + MV) | ~218 KB | ~62 KB |
| Incremento sobre `pacific-islands-10m.json` | +57 KB | +15 KB |

---

## Alternativas evaluadas y descartadas

### A. Solo ARCHIPELAGO_CODES + HULL_VISIBLE_CODES (0 bytes)
- **Para SC**: No funciona. Con 1 polígono, el hull no cubre el archipiélago.
- **Para MV**: Funciona parcialmente. Hull elongado aceptable para hit testing, pero visualmente pobre.
- **Veredicto**: Insuficiente como solución única.

### B. Hulls más generosos sin geometría real
- Requeriría hulls hardcodeados (coordenadas manuales), no derivados de geometría.
- Añade complejidad y mantenimiento sin mejorar la fidelidad visual.
- **Veredicto**: Más complejo y peor resultado que el override 10m.

### C. Solo islas principales (selección curada del 10m)
- Extraer solo 3-5 islas más grandes en vez del dataset completo.
- Mejor ratio coste/beneficio, pero requiere curación manual por país.
- **Veredicto**: Viable como optimización futura si el tamaño se convierte en problema. Por ahora el 10m completo es aceptable.

### D. Douglas-Peucker sobre 10m
- Simplificar geometrías para reducir puntos manteniendo forma.
- Añade paso de build y complejidad al pipeline.
- **Veredicto**: Prematura. El coste actual (+14 KB gzip) no justifica la complejidad.

---

## Criterio objetivo para futuros overrides

Un país necesita override 10m si y solo si:
1. Tiene **≤ 2 polígonos** en 1:50m
2. La geometría 50m es **irreconocible** como archipiélago (hull sobre polígonos existentes no cubre las islas principales)
3. El coste es **< 15 KB raw** por país (o justificación excepcional de gameplay)

Este criterio filtra correctamente a SC y MV como únicos candidatos actuales.

---

## Diseño de implementación

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `scripts/generate-pacific-overrides.ts` | Renombrar a `generate-island-overrides.ts`. Añadir IDs 690 (SC) y 462 (MV) al Set |
| `public/data/pacific-islands-10m.json` | Eliminar. Reemplazar por `islands-10m.json` (generado por el script) |
| `src/data/countries.ts` | 1 línea: URL del fetch `pacific-islands-10m.json` → `islands-10m.json` |
| `src/components/Globe/GlobeD3.tsx` | Añadir MV, SC a `ARCHIPELAGO_CODES` y `HULL_VISIBLE_CODES`. Evaluar `CENTROID_OVERRIDES` para SC y MV |
| `DESIGN.md` | Actualizar tabla de overrides, nombre de archivo, estructura |

### IDs del script

```typescript
const OVERRIDE_IDS = new Set([
  // Pacífico (8 existentes)
  '583', '584', '798', '585', '776', '296', '548', '242',
  // Índico (2 nuevos)
  '690',  // SC — Seychelles
  '462',  // MV — Maldivas
]);
```

### Centroides a evaluar post-generación
- **SC**: Centroide de 26 polys dispersos probablemente cae en agua → override a Mahé (~55.5, -4.7)
- **MV**: Centroide de 176 atolones en cadena N-S → override a Malé (~73.5, 4.2)

### Secuencia
1. Renombrar script, añadir IDs, ejecutar → `islands-10m.json`
2. Verificar tamaño (~218 KB raw)
3. Borrar `pacific-islands-10m.json`
4. Actualizar URL en `countries.ts`
5. Añadir códigos a constantes en `GlobeD3.tsx`
6. Calcular centroides, añadir overrides si necesario
7. Actualizar `DESIGN.md`
8. Test en dispositivo

---

## Decisión

**Pendiente de aprobación del usuario.** Resumen de la propuesta:

| Acción | País | Coste | Beneficio |
|--------|------|-------|-----------|
| Override 10m | SC Seychelles | +3.4 KB gzip | 1→26 polígonos. Única solución viable |
| Override 10m | MV Maldivas | +10.8 KB gzip | 2→176 polígonos. Cadena reconocible |
| Sin cambios | BS, SB, PG, MU, KM, CV, ST, KN, TT, AG, GD | 0 | Ya resueltos o innecesarios |

**Coste total**: +14.2 KB gzip, +1.462 coords (+1.4%). Impacto en rendimiento imperceptible.

**Decisión**: Aprobado. Bahamas no necesita cambios (hull visible descartado por el usuario).
