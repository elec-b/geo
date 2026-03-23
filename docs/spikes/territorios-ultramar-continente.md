# Spike: Territorios de ultramar y filtro de continente

## Problema

Al filtrar por "América" (en Explorar o Jugar), la **Guayana Francesa aparece atenuada** junto con el resto de Europa, dejando un hueco visual evidente entre Brasil y Surinam.

![Screenshot: GF atenuada con filtro América](Screenshot%202026-03-23%20at%2015.49.05.png)

## Causa raíz

La Guayana Francesa **no es una feature separada** en world-atlas 50m. Es uno de los 10 polígonos del MultiPolygon de Francia (ID 250). El pipeline:

```
TopoJSON feature ID 250 (Francia, 10 polígonos)
  → isoMapping: '250' → 'FR'
  → countries.json: FR.continent = 'Europa'
  → GlobeD3: filtro América → 'FR' no está en Set → isDimmed = true
  → TODO el MultiPolygon se atenúa (incluida GF geométricamente)
```

**No es un error de lógica** — el código funciona correctamente. El problema es que world-atlas 50m agrupa GF dentro de FR.

### Territorios franceses afectados (sin feature separada)

| Código ISO | Nombre | Continente geográfico | En world-atlas 50m |
|------------|--------|-----------------------|--------------------|
| **GF (254)** | **Guayana Francesa** | **América** | No (parte de FR) |
| GP (312) | Guadalupe | América | No (parte de FR) |
| MQ (474) | Martinica | América | No (parte de FR) |
| RE (638) | Reunión | África | No (parte de FR) |
| YT (175) | Mayotte | África | No (parte de FR) |

### Territorios franceses que SÍ son features separadas (ya funcionan bien)

| ID TopoJSON | Código | Nombre | Continente | En isoMapping |
|-------------|--------|--------|------------|---------------|
| 540 | NC | Nueva Caledonia | Oceanía | ✓ |
| 258 | PF | Polinesia Francesa | Oceanía | ✓ |
| 666 | PM | San Pedro y Miquelón | América | ✓ |
| 663 | MF | San Martín | América | ✓ |
| 652 | BL | San Bartolomé | América | ✓ |
| 876 | WF | Wallis y Futuna | Oceanía | ✓ |

### ¿Otros países con el mismo problema?

**No.** Francia es el único país ONU cuyos territorios de ultramar están fundidos en su MultiPolygon en world-atlas 50m. Otros casos potenciales (UK, NL, DK) tienen features separadas:
- Groenlandia (ID 304) → feature separada, `continent: 'América'` ✓
- Islas Caimán, Bermudas, etc. → features separadas ✓

El caso de los 5 territorios franceses es una decisión específica de Natural Earth/world-atlas.

### Dato curioso

El equipo ya era consciente: `GlobeD3.tsx:109` tiene un override de centroide con comentario `'FR': [2.5, 46.5], // Francia metropolitana (no Guayana)`.

## Opciones

### Opción A: Separar GF del MultiPolygon de FR en el pipeline de datos

Extraer los polígonos de GF (y opcionalmente GP, MQ, RE, YT) del MultiPolygon de Francia, crear features separadas con IDs propios, y mapearlas en `isoMapping.ts`.

**Implementación:**
1. Ampliar `scripts/generate-island-overrides.ts` (o crear script nuevo) para:
   - Leer el TopoJSON 50m
   - Identificar los polígonos del MultiPolygon de FR por bounding box o punto interior conocido
   - Extraer GF como feature separada con ID 254
   - Reducir el MultiPolygon de FR a sus polígonos europeos
2. Añadir `'254': { cca2: 'GF', continent: 'América', sovereignCca2: 'FR' }` a `isoMapping.ts`
3. Añadir datos de GF a `capitals-es.json` y regenerar `countries.json`

**Pros:**
- Solución limpia y permanente
- GF se comporta como cualquier otro territorio no-ONU (seleccionable, ficha, filtrable)
- Coherente con el patrón de NC, PF, etc.
- Se propaga automáticamente a todo el código (dimming, tabla, etiquetas)

**Contras:**
- Modifica el pipeline de datos (complejidad)
- Hay que decidir criterio geométrico para separar polígonos (bounding box vs. punto interior)
- ¿Hacerlo para los 5 territorios o solo GF?
- Los polígonos de GP y MQ son muy pequeños en 50m (¿visibles?)

**Archivos:** `scripts/generate-island-overrides.ts` o script nuevo, `isoMapping.ts`, `capitals-es.json`, regenerar `countries.json`

### Opción B: Override de renderizado (iluminar polígonos de FR por posición geográfica)

Mantener FR como MultiPolygon único, pero al renderizar con filtro de continente activo, iterar sobre los polígonos individuales y decidir dimming por posición geográfica (centroide de cada polígono).

**Implementación:**
1. En `GlobeD3.tsx`, cuando `feature.id === '250'` (Francia) y hay filtro activo:
   - Descomponer el MultiPolygon en polígonos individuales
   - Para cada polígono, calcular centroide → determinar continente geográfico
   - Renderizar cada polígono con su propio `globalAlpha`

**Pros:**
- No modifica datos
- Resuelve el problema visual

**Contras:**
- Lógica especial para un solo país (Francia)
- Complejidad de renderizado por frame (descomponer MultiPolygon + centroide por polígono)
- No resuelve la ficha: tocar GF sigue abriendo la ficha de Francia
- No resuelve la tabla: GF sigue sin aparecer como territorio filtrable por América
- Solución parcial (solo visual)

**Archivos:** `GlobeD3.tsx`

### Opción C: Aceptar el comportamiento actual

Documentar que los territorios de ultramar integrados en el MultiPolygon de su soberano heredan su dimming. Cartográficamente correcto: GF es territorio francés.

**Pros:**
- Cero esfuerzo
- Cartográficamente defensible

**Contras:**
- Hueco visual evidente entre Brasil y Surinam
- Inconsistencia: NC y PF (también francesas) sí se iluminan con Oceanía
- Mala experiencia de usuario para una app de geografía

## Recomendación

**Opción A** (separar en datos). Es la solución más limpia y coherente con el patrón existente (ya se hizo para NC, PF, PM, MF, BL, WF). El precedente de `generate-island-overrides.ts` demuestra que el proyecto ya modifica el TopoJSON cuando world-atlas es insuficiente.

**Alcance recomendado:**
- **Mínimo viable:** Solo GF (el único con impacto visual significativo por tamaño y ubicación)
- **Completo:** GF + RE + YT (los visibles; GP y MQ son islas pequeñas que probablemente no se noten)

**Criterio de separación:** Punto interior conocido (coordenadas de la capital: Cayena [52.3°W, 4.9°N]) para identificar qué polígono(s) del MultiPolygon pertenecen a GF. Es más robusto que bounding box.

## Impacto en el juego

Ninguno. GF no es país ONU → no participa en niveles, sellos ni pruebas. El impacto es exclusivamente visual (dimming) y de exploración (ficha de país, tabla).
