# Spike: Etiquetas de mares y océanos en el globo D3

> **Fecha**: 2026-03-18
> **Veredicto**: **VIABLE** — complejidad baja-media, alto valor visual, sin riesgos técnicos bloqueantes.

---

## Pregunta

¿Es viable añadir etiquetas de texto (nombres) sobre mares y océanos al globo D3 ortográfico?

## Metodología

Investigación con 6 agentes en paralelo (3 investigadores + 3 refutadores):
- **Datos**: datasets disponibles, scope, licencias
- **Renderizado**: texto en Canvas 2D, letter-spacing, visibilidad, estilo, performance
- **Codebase**: pipeline de draw(), punto de inserción, conflictos, estimación

---

## 1. Fuente de datos

### Veredicto: JSON manual estático (~2-3 KB)

**Natural Earth** (`ne_10m_geography_marine_polys`) es la mejor referencia (dominio público, ~200 features con `name`, `scalerank`, `min_label`/`max_label`). Pero usarlo directamente como dataset tiene problemas:
- Los polígonos oceánicos están divididos por el antimeridiano → `d3.geoCentroid()` no da posiciones útiles para océanos
- `name_es` **no confirmado** para el dataset de marine polys (sí para otros datasets de NE)
- Para ~25-30 etiquetas, un pipeline GIS es overkill

**Decisión**: Crear `public/data/sea-labels.json` manualmente:
```json
[
  { "id": "pacific", "name_es": "OCÉANO PACÍFICO", "lat": 0, "lon": -160, "scalerank": 0 },
  { "id": "mediterranean", "name_es": "MAR MEDITERRÁNEO", "lat": 35, "lon": 18, "scalerank": 2 },
  ...
]
```

**Proceso**:
1. Definir lista consultando atlas de referencia en español (IGN / RAE)
2. Posicionar visualmente cada etiqueta sobre nuestro propio globo (modo dev)
3. Guardar en JSON con campos: `id`, `name_es` (y futuro `name_en`, etc.), `lat`, `lon`, `scalerank`
4. Verificar nombres contra convenciones de la RAE (ej. "Golfo Pérsico" vs "Golfo Arábigo")

**Ventajas**: control total de posición, sin dependencias, i18n trivial (añadir campos `name_xx`), dominio público.

### Scope: ~25-30 etiquetas

| Tipo | Cantidad | Ejemplos | scalerank |
|------|----------|----------|-----------|
| Océanos | 5-7 | Pacífico (N/S), Atlántico (N/S), Índico, Ártico, Austral | 0 |
| Mares grandes | 10-12 | Mediterráneo, Caribe, China Meridional, Arábigo, Coral | 1-2 |
| Mares medianos | 5-8 | Báltico, Negro, Rojo, Norte, Japón, Ojotsk | 3 |
| Golfos selectos | 3-5 | Golfo de México, Pérsico, Bengala | 2-3 |

**Nota**: no saturar la vista — en proyección ortográfica solo se ve un hemisferio (~12-15 etiquetas visibles a la vez). El filtrado por zoom/scalerank es esencial (ver §3).

---

## 2. Renderizado

### Texto: recto con rotación sutil por etiqueta

- **Texto completamente horizontal** se ve amateur sobre un globo minimalista — falta profundidad visual.
- **Texto curvo** (carácter a carácter) es demasiado complejo para V1 y con rendimiento cuestionable.
- **Solución pragmática**: texto recto pero con `ctx.rotate(angle)` por etiqueta, donde el ángulo se calcula según la posición geográfica. Coste mínimo (~2 líneas extra por label), resultado visual muy superior.

### Tipografía: serif itálica (convención cartográfica)

La convención cartográfica universal es **serif itálica para masas de agua** (distingue agua de tierra visualmente). Fuentes confirmadas: Colorado Pressbooks, Axis Maps, Wikipedia.

```js
ctx.font = 'italic 300 14px Georgia, "New York", serif';
```

**Georgia** está disponible como fuente del sistema en iOS. **New York** (companion serif de San Francisco) disponible desde iOS 13.

Usar sans-serif "por coherencia con la UI" sacrifica la sensación cartográfica. El contraste tipográfico serif (agua) vs sans-serif (tierra) es exactamente el propósito de la convención.

### Letter-spacing

`ctx.letterSpacing` es estándar (HTML Living Standard). Compatibilidad:
- Safari/iOS: **18.4+** (WebKit lo añadió sin prefijo)
- Chrome: 99+, Firefox: 115+

**Fallback para iOS < 18.4**: renderizar carácter por carácter con `measureText()`. Con spacing amplio (3-8px), la pérdida de kerning es imperceptible.

```js
const supportsLetterSpacing = 'letterSpacing' in ctx;
// Si no: drawSpacedText(ctx, text, x, y, spacing) — char por char
```

### Color y contraste

| Alpha | Color efectivo sobre #0a0a1a | Ratio WCAG | Veredicto |
|-------|------------------------------|------------|-----------|
| 0.25 | #213553 | 1.59:1 | Invisible |
| 0.40 | #2e4e76 | 2.30:1 | Sutil pero legible |
| 0.50 | #375f8d | 2.97:1 | Claramente legible, discreto |

**Decisión**: `rgba(100, 180, 255, 0.45)` — compromiso entre sutileza y legibilidad.

**Glow en vez de shadow**: una sombra oscura sobre fondo oscuro es inútil. Mejor un glow azul tenue:
```js
ctx.shadowColor = 'rgba(100, 180, 255, 0.15)';
ctx.shadowBlur = 6;
```

### Visibilidad hemisférica

- Check básico: `projection([lon, lat])` devuelve `null` si está detrás (clipAngle(90))
- **Fade gradual** para evitar pop-in/pop-out brusco:
  ```js
  const dist = geoDistance(labelCenter, viewCenter);
  const fadeStart = (Math.PI / 2) * 0.7; // empieza al 70%
  const opacity = dist < fadeStart ? 1.0 :
                  Math.max(0, 1 - (dist - fadeStart) / (Math.PI / 2 - fadeStart));
  ```

### Performance

**Sin preocupación.** 25-30 `fillText()` + `measureText()` ≈ 0.1ms por frame. El render actual ya dibuja ~500 paths (países + borders + hulls + marcadores + etiquetas). Las etiquetas de mares serían ~1% de overhead adicional.

---

## 3. Integración en el codebase

### Pipeline de draw() actual (GlobeD3.tsx, líneas 478-881)

```
1. clearRect                    (503)
2. Atmósfera (halo)             (505-510)
3. Océano (relleno)             (512-516)
4. Países (relleno + dimming)   (524-545)
5. Bordes                       (547-554)
6. Hulls                        (556-630)
7. Marcadores microestados      (632-650)
8. Circulitos capitales         (652-669)
9. Pines capital                (671-694)
10. Feedback labels             (696-733)
11. Etiquetas países            (735-811)
12. Etiquetas capitales         (813-880)
```

### Punto de inserción: debate underlay vs overlay

Dos propuestas enfrentadas:

| Estrategia | Línea | Pros | Contras |
|------------|-------|------|---------|
| **Underlay** (~517) | Después de océano, antes de países | Cartográficamente correcto (agua "bajo" tierra), efecto de profundidad | Mares cerrados (Mediterráneo, Negro, Rojo) quedarían parcialmente cubiertos por tierra |
| **Overlay** (~735) | Después de feedback, antes de labels países | Siempre legible | Texto flotando sobre tierra, anti-cartográfico |

**Veredicto: Underlay (~517)** es la opción correcta. Los mares cerrados con texto parcialmente cubierto no son un bug — es cómo funcionan los mapas reales. La clave es **posicionar bien las etiquetas** para que caigan en la zona de agua más amplia (ej. Mediterráneo centrado en el Jónico, no sobre Italia). Los mares MUY cerrados (Caspio, Azov) simplemente tendrían etiquetas más pequeñas o se mostrarían solo a zoom alto donde hay más espacio visible de agua.

### Visibilidad por zoom (variable por scalerank)

Rango fijo (1-4) es demasiado simple. Debe ser variable:

| Tipo | scalerank | Zoom visible | Fade out |
|------|-----------|-------------|----------|
| Océanos | 0 | 1.0 – 3.0 | 2.5–3.0 |
| Mares grandes | 1-2 | 1.0 – 6.0 | 5.0–6.0 |
| Mares medianos | 3+ | 2.0 – 8.0 | 7.0–8.0 |

Razonamiento: los océanos desaparecen pronto (a zoom continental ya no aportan), pero mares medianos persisten como referencia geográfica a zoom regional.

### Props y control

- Nueva prop `showSeaLabels` (default: `true` en Explorar, `false` en Jugar)
- JugarView ya pone `showCountryLabels: false` — el patrón está establecido
- Pruebas de sello cubiertas automáticamente (se gestionan dentro de JugarView)
- **Toggle en ExploreView**: necesario para coherencia con los toggles existentes de "Países" y "Capitales"

### Filtro de continente y DIMMED_ALPHA

Cuando hay filtro de continente activo:
- Países fuera del filtro: alpha 0.15
- Etiquetas de países/capitales fuera del filtro: **no se pintan**

Las etiquetas de mares no pertenecen a ningún continente. **Deben reducir su opacidad** cuando hay filtro activo (al ~50% de su opacidad nominal → ~22% final) para no ser lo más prominente en pantalla. No ocultarlas completamente porque dan contexto geográfico.

### Anti-solapamiento

Con underlay (línea ~517), las etiquetas de mares NO comparten `usedRects` con las de países (están en capas distintas, separadas por la tierra). Solo necesitan anti-solapamiento entre ellas mismas (array propio).

### Hit testing

No afectado. Las etiquetas de texto son puramente visuales, sin hit area. El hit test usa `geoContains()` sobre geometría de países.

---

## 4. Estimación de esfuerzo

| Componente | Líneas | Ubicación |
|-----------|--------|-----------|
| Datos (JSON manual) | ~60-80 | `public/data/sea-labels.json` |
| Constantes (colores, fonts, thresholds) | ~8 | GlobeD3.tsx (top) |
| Prop + ref sync | ~5 | GlobeD3.tsx |
| Rendering en draw() | ~50-60 | GlobeD3.tsx (~línea 517) |
| Loader/import | ~5 | GlobeD3.tsx o data/ |
| Toggle en ExploreView | ~10 | ExploreView.tsx |
| **Total** | **~140-170** | |

GlobeD3.tsx pasaría de ~1519 a ~1590 líneas (~+70 en el archivo). Sostenible, pero el próximo cambio significativo al pipeline debería venir con refactorización (extraer fases de draw a funciones).

---

## 5. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Texto fragmentado en mares cerrados | Media | Posicionamiento cuidadoso; mares muy cerrados solo a zoom alto |
| `name_es` no disponible en NE | Alta | No depender de NE para nombres; usar atlas RAE/IGN |
| `ctx.letterSpacing` no funciona en iOS < 18.4 | Baja (76%+ en iOS 26) | Fallback char-by-char ya diseñado |
| Saturación visual en pantalla móvil | Media | Filtrado por scalerank + zoom; máx ~8-10 visibles a la vez |
| GlobeD3.tsx demasiado grande | Baja | +70 líneas es sostenible; refactorizar en el siguiente cambio |

---

## 6. Recomendación

**Implementar.** La feature es viable con complejidad baja-media y alto valor visual/educativo. Puntos clave:

1. **JSON manual** con ~25-30 entries, posicionadas visualmente sobre nuestro globo
2. **Underlay** (después de océano, antes de países) — línea ~517
3. **Serif itálica** (Georgia) — convención cartográfica para agua
4. **Alpha ~0.45** con glow azul tenue — sutil pero legible
5. **Zoom variable** por scalerank — océanos desaparecen antes que mares
6. **Rotación sutil** por etiqueta — evita aspecto amateur
7. **Opacidad reducida** cuando hay filtro de continente activo
8. **Off en modo juego** (nueva prop `showSeaLabels`)

### Propuesta de implementación por fases

**Fase 1 (MVP)**: 5-7 océanos + 8-10 mares principales. Texto recto sin rotación. Alpha fijo. Zoom fijo por scalerank. ~2-3 horas.

**Fase 2 (polish)**: Rotación sutil. Fade hemisférico. Opacidad reducida con filtro. Toggle en ExploreView. +15-20 mares/golfos. ~2-3 horas.
