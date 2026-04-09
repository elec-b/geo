# Spike: Validación automática de coordenadas de capitales

**Fecha**: 2026-04-02
**Método**: Agent team de 5 agentes (explorador de contexto + analista de geometría + investigador de fuentes + 2 refutadores). Análisis exhaustivo con scripts de validación reales.
**Contexto**: Evaluar si implementar validación automática de coordenadas de capitales (`d3.geoContains` + Wikidata SPARQL) o mantener el sistema actual de overrides manuales (`CAPITAL_COORD_OVERRIDES` en `fetch-countries.ts`).
**Fuentes**: REST Countries v3.1, Wikidata SPARQL, Natural Earth 1:50m/1:10m, spike previo `verificacion-i18n-datos.md` (2026-03-27).

---

## 1. Estado actual

- **Fuente de coordenadas**: REST Countries API v3.1 (`capitalInfo.latlng`). Archivado desde junio 2024 (datos congelados).
- **Overrides manuales**: 3 países en `CAPITAL_COORD_OVERRIDES` (`fetch-countries.ts:173-177`): EH, GD, SN. BACKLOG mencionaba 4 (KI), pero KI no está en el código.
- **Sin validación automática** post-generación de `capitals.json`.
- **`d3.geoContains`** ya se usa en la app (`GlobeD3.tsx:1216`) para hit testing de clicks, pero no para validar coordenadas.

---

## 2. Hallazgos: análisis de geometría

Se ejecutó `d3.geoContains(countryFeature, [lng, lat])` contra las 237 capitales de `capitals.json` con la geometría 1:50m.

### Resultados para los 195 países ONU

| Categoría | Cantidad | Detalle |
|-----------|----------|---------|
| **Pasan geoContains** | ~167 | Capital dentro del polígono simplificado |
| **Falsos positivos** (<8 km del borde) | 27 | Capitales costeras/fronterizas que caen fuera por simplificación 50m |
| **Error real** | 1 | KI (Kiribati): capital en atolón no representado en geometría |

**Ejemplos de falsos positivos**: Estocolmo (~1 km), Lisboa (~2.8 km), Copenhague (~0.6 km), Reikiavik (~0.5 km), Beirut (~0.9 km). Son capitales correctamente geolocalizadas que caen en el agua según la geometría simplificada.

**Único error real ONU**: Kiribati — South Tarawa está en un atolón que ni la geometría 50m ni la 10m representan con suficiente detalle. Distancia >500 km al polígono más cercano.

### Territorios no-ONU (no participan en el juego)

4 errores adicionales, irrelevantes para la experiencia de juego: MO (coords [0,0]), WF (459 km), PN (192 km), TC (63 km), EH (170 km — ya tiene override).

### Comparación 50m vs 10m

| País | 50m | 10m | Cambio |
|------|-----|-----|--------|
| TO (Tonga) | **PASA** | **FALLA** (2.0 km) | **Regresión** |
| KI | FALLA | FALLA | Sin cambio |
| MH | FALLA (1.5 km) | FALLA (1.6 km) | Sin cambio |
| FJ | FALLA (0.7 km) | FALLA (1.9 km) | Peor |

**Hallazgo crítico**: la geometría 10m **no resuelve ningún fallo** e introduce una regresión en Tonga. La mayor precisión costera puede hacer que un punto que estaba "dentro" del polígono simplificado caiga "fuera" del detallado. **Tonga es un bug activo en la app** (ya usa 10m vía `islands-10m.json`).

### Tolerancia propuesta

La simplificación 50m elimina detalles costeros de ~1-5 km. El umbral natural es:
- **8 km**: cubre 27 de 28 fallos ONU (96%). Solo KI queda fuera.
- **5 km**: cubre ~19 de 28 (68%). Insuficiente para GM, GN, IL.

---

## 3. Hallazgos: fuentes externas

### Wikidata SPARQL
- **Cobertura**: 193 de 195 países ONU (falta EH — no es estado soberano en Wikidata).
- **Precisión**: 90% de capitales difieren <5 km vs REST Countries. Mediana: 1.76 km.
- **Licencia**: CC0 (dominio público).
- **Rate limits**: suficientes (una query devuelve todo).
- **Riesgos**: vandalizable (sin garantía formal), duplicados por capitales múltiples (Bolivia tiene 2).

### Anomalías REST Countries vs Wikidata
| País | Diferencia | Causa |
|------|-----------|-------|
| Bolivia | 413 km | Sucre vs La Paz — decisión editorial, no error |
| Guinea Ecuatorial | 45 km | Malabo vs Ciudad de la Paz — capital en transición, no materializada |
| Argentina | 26 km | Desplazamiento menor, irrelevante a escala del globo |
| Kiribati | 11 km | Ambas fuentes imprecisas para South Tarawa |

**Conclusión del refutador**: si eliminamos decisiones editoriales (BO, GQ) y diferencias insignificantes (<50 km en globo 1:50m), hay **cero discrepancias reales de coordenadas** entre REST Countries y Wikidata para los 195 países ONU.

### Otras fuentes evaluadas
- **GeoNames**: viabilidad media, requiere registro y atribución CC-BY.
- **Nominatim (OSM)**: **descartado** — su política prohíbe queries sistemáticas.
- **Natural Earth Populated Places**: buena opción como dataset offline de cross-check, dominio público.

---

## 4. Objeciones de los refutadores

### Refutador de fuentes (veredicto: **no automatizar**)
1. **Cero errores reales entre los 195 ONU**: los 4 errores del analista (MO, WF, PN, TC) son todos territorios no-ONU.
2. **Pipeline de 4 capas es overengineering**: estimación realista ~300 líneas (no ~100), para corregir 0 errores reales.
3. **REST Countries está congelado**: no va a introducir nuevos errores. Las capitales del mundo cambian ~1 vez por década. Un override manual de 1 línea es más eficiente que mantener un pipeline.
4. **Las anomalías son editoriales, no técnicas**: Bolivia (Sucre vs La Paz), Guinea Ecuatorial (capital no materializada) requieren criterio humano, no automatización.

### Refutador de geometría (veredicto: **validación simple sí vale la pena**)
1. **Números del analista parcialmente incorrectos**: los resultados varían según cómo se combinan las geometrías 50m+10m y si se usa Map (bug de IDs duplicados con Australia).
2. **La regresión de Tonga con 10m es un bug activo**: la app ya usa la geometría 10m para Tonga, y la capital cae fuera. Demuestra que los overrides de geometría pueden romper la validación silenciosamente.
3. **Una validación build-time simple detectaría regresiones futuras**: no un pipeline de fuentes externas, sino un `geoContains` + tolerancia como check en el proceso de generación.

---

## 5. Decisiones editoriales pendientes

Identificadas en `verificacion-i18n-datos.md` (§2.3) y confirmadas por este spike:

| País | Opciones | Estado |
|------|----------|--------|
| **Bolivia** | Sucre (constitucional) vs La Paz (sede gobierno) | REST Countries usa Sucre; 31 de 32 idiomas usan La Paz |
| **Guinea Ecuatorial** | Malabo vs Ciudad de la Paz | Proclamada ene. 2026, no materializada. Mantener Malabo |
| **Sri Lanka** | Sri Jayawardenepura Kotte vs Colombo | Decisión pendiente |
| **Montserrat** | Plymouth (de iure) vs Brades (de facto) | Territorio no-ONU |

Estas son decisiones humanas que ningún pipeline automatizado puede resolver.

---

## 6. Recomendación

### No implementar pipeline automatizado de fuentes externas

El problema real entre los 195 países ONU es demasiado pequeño (0-1 errores de coordenadas) para justificar un pipeline de múltiples fuentes (~300 líneas, dependencias externas, manejo de edge cases).

### Sí implementar: validación build-time simple

Un check ligero en `fetch-countries.ts` que ejecute `geoContains` + tolerancia de 8 km tras generar `capitals.json`. Propósito: **detectar regresiones** cuando se modifiquen geometrías (como el bug activo de Tonga con 10m). No corrige nada automáticamente — solo emite warnings.

### Acciones concretas

1. **Añadir KI a `CAPITAL_COORD_OVERRIDES`** — única capital ONU con error real (atolón no representado).
2. **Añadir check `geoContains` + 8 km de tolerancia** en `fetch-countries.ts` como paso de validación post-generación. Emitir warning para fallos, no bloquear.
3. **Resolver decisiones editoriales** con el usuario: Bolivia (La Paz vs Sucre), Guinea Ecuatorial (mantener Malabo), Sri Lanka.
4. **Documentar Wikidata SPARQL y Natural Earth** como fuentes de referencia para verificación manual cuando sea necesario (no automatizar).
5. **(Opcional) Añadir overrides para territorios no-ONU** que lo necesiten: MO ([0,0]), WF, PN, TC — baja prioridad, no afectan el juego.

### Lo que NO hacer

- No construir pipeline de múltiples fuentes externas.
- No usar geometría 10m para validación (introduce regresiones).
- No bloquear el build por fallos de `geoContains` en capitales costeras (son falsos positivos inherentes a la simplificación 50m).
