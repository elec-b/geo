# Spike: PMTiles vs D3.js ortográfico para eliminar seams en globe

**Fecha**: 2026-02-08
**Branch**: `spike/pmtiles-vs-d3`
**Objetivo**: Eliminar artefactos visuales (seams/bandas en tile boundaries) en el globo 3D.

---

## Contexto

MapLibre GL JS v5 con `projection="globe"` muestra bandas visibles en los límites de tiles cuando se usa `source type: geojson`. Internamente, `geojson-vt` convierte GeoJSON a vector tiles al vuelo, y la subdivisión de geometría en tile boundaries produce seams de 1 pixel al reproyectar en la esfera.

**Hipótesis inicial**: Usar PMTiles (vector tiles pre-generados con tippecanoe) eliminaría los seams al evitar `geojson-vt`.

---

## Opción A: MapLibre + PMTiles — FALLA

### Qué se hizo
1. Convertimos `countries-50m.json` (TopoJSON) → GeoJSON → PMTiles con tippecanoe v2.79
2. Flags: `--detect-shared-borders`, `--no-tile-compression`, `-zg`
3. Resultado: `world.pmtiles` (514 KB, mucho menor que el TopoJSON original de 756 KB)
4. Creamos `GlobePMTiles.tsx` que usa `source type: vector` con protocolo `pmtiles://`

### Resultado
**Los artefactos persisten.** Se ven bandas circulares prominentes alrededor de los polos (tile boundaries de la cuadrícula Mercator reproyectados sobre la esfera). La Antártida no es visible (tippecanoe eligió maxzoom 2 con `-zg`, insuficiente para los polos).

### Conclusión
**El problema NO era `geojson-vt`**. Es inherente a la reproyección Mercator → esfera de MapLibre. Cualquier fuente basada en tiles (GeoJSON, PMTiles, vector tiles remotos) producirá los mismos artefactos al reproyectar sobre el globo. Los seams son un problema arquitectural del globe rendering de MapLibre, documentado internamente como "very prone to subtle errors resulting in single-pixel seams".

---

## Opción C: D3.js ortográfico + Canvas — PASA

### Qué se hizo
1. Instalamos `d3-geo`
2. Creamos `GlobeD3.tsx`: proyección `geoOrthographic()` sobre `<canvas>` 2D
3. Reutiliza los datos existentes (`loadCountriesGeoJson()`, `loadBordersGeoJson()`)
4. Implementamos: rotación automática, drag para rotar, click en país, hover, selección visual

### Resultado
- **Sin artefactos**: no hay tiles, no hay seams. Los polígonos se renderizan directamente sobre la esfera
- **Interacción funcional**: click en país detecta correctamente, selección visual con cambio de color
- **Rotación fluida**: automática (~6°/s) y manual por drag
- **Aspecto visual**: limpio, coherente con el tema espacial

### Pendientes (pulir en el futuro)
- Zoom (pinch/wheel → ajustar `projection.scale()`)
- Inercia en el drag (momentum al soltar)
- Posible optimización de hit testing si hay lag en dispositivos lentos

---

## Decisión

**Adoptar D3.js con proyección ortográfica + Canvas 2D** como motor de renderizado del globo.

### Razones
1. Elimina los artefactos de raíz (no hay tiles)
2. Rendimiento excelente en Canvas 2D (sin WebGL, sin riesgos de WKWebView)
3. 100% offline, sin dependencias externas
4. Bundle ligero (`d3-geo` ≈ 30 KB)
5. API simple y bien documentada

### Trade-offs aceptados
- No es 3D real (es una proyección 2D que simula 3D)
- Sin inclinación de cámara ni perspectiva
- El zoom es cambio de escala, no acercamiento 3D

Para nuestro caso de uso (consciencia de superficie de países, quiz geográfico), la proyección ortográfica es suficiente y elimina toda la complejidad de tiles + WebGL.
