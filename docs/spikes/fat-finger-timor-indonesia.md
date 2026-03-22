# Spike: Fat finger Timor Oriental ↔ Indonesia (y casos similares)

## Contexto

**Problema reportado**: Al jugar Asia-Guía (100% países), en tipos A/B y pruebas de sello, tocar Timor Oriental es difícil porque Indonesia es enorme y lo rodea. ¿Hay más casos así?

**Relación con spike anterior**: El spike `hull-gigante-indonesia.md` resolvió un bug de winding order que hacía que el hull de Indonesia envolviera todo el planeta. Ese fix (commit `636b984`) ya está aplicado. El hull ahora envuelve correctamente las islas de Indonesia, pero el problema de fat finger es distinto: el hull correcto de Indonesia incluye legítimamente la zona de Timor oriental.

## Equipo de análisis

Spike investigado con 4 agentes en paralelo:
- **code-analyst**: analizó pipeline de hit testing y comportamiento de hulls
- **geo-analyst**: inventarió pares de países con riesgo de fat finger
- **code-refuter**: verificó hallazgos de hit testing, encontró causa raíz geográfica
- **geo-refuter**: cuestionó inventario, identificó pares faltantes y falsos positivos

## Hallazgos

### 1. Pipeline de hit testing (GlobeD3.tsx)

El `hitTest` resuelve taps en 4 fases de prioridad descendente:

| Fase | Mecanismo | Cuándo retorna |
|------|-----------|----------------|
| 1 | Marcadores microestados ONU (hitRadius 20-30px) | Tap cerca de marcador circular |
| 2 | `geoContains(feature, coords)` — geometría real | Tap dentro del polígono del país |
| 3 | `pointInPolygon(coords, hull)` — convex hulls | Tap dentro del hull de un archipiélago |
| 4 | Hit area microestados no-ONU | Tap cerca de marcador no-ONU |

**Clave**: Fase 3 usa los hulls de TODOS los `ARCHIPELAGO_CODES`, incluidos los invisibles (no en `HULL_VISIBLE_CODES`). Indonesia tiene hull invisible que participa en hit testing.

### 2. Causa raíz: la isla compartida de Timor

Indonesia y Timor-Leste comparten la isla física de Timor:
- **Indonesia** conserva coordenadas de Timor occidental (~124°E) en su geometría
- **Timor-Leste** tiene la mitad oriental (~124-127°E)
- El convex hull de Indonesia envuelve TODAS sus islas, incluyendo Timor occidental → el hull cubre la zona de Timor-Leste

**Secuencia del fat finger**:
1. Usuario toca cerca de Timor-Leste (pero ligeramente fuera de su polígono, o en el mar entre islas)
2. Fase 2: `geoContains(TL, coords)` retorna `false` (tap fuera del polígono exacto)
3. Fase 3: `pointInPolygon(coords, hullID)` retorna `true` (tap dentro del hull invisible de Indonesia)
4. Hit testing retorna Indonesia → el juego marca error

### 3. Mitigación existente (JugarView.tsx)

Hay un margen de tolerancia adaptativo (spike anterior `hit-testing-archipielagos.md`):

```
Si distancia(tap, targetCentroid) < tolerancia AND distancia(tap, targetCentroid) < distancia(tap, detectedCentroid):
    → aceptar como target
```

**Limitación**: La tolerancia es `BASE_TOLERANCE_RAD (0.05) / zoom`. A zoom alto (3-10 en A/B), la tolerancia se reduce a 0.005-0.015 rad (~0.3-0.9°). Los centroides de Indonesia ([118°E, 3°S]) y Timor-Leste ([125°E, 9°S]) están a ~8° de distancia, así que en la mayoría de taps la tolerancia sí debería preferir Timor. Sin embargo, si el tap cae genuinamente fuera del rango de tolerancia, falla.

`MICROSTATE_PAIRS` no incluye ID-TL (y no debería — no es una relación microestado-contenedor).

### 4. Otros pares con riesgo de fat finger

Se investigaron pares en todos los continentes. El inventario inicial (54 pares) fue parcialmente refutado: algunos son falsos positivos (islas distantes que el zoom separa bien) y faltan pares en Medio Oriente, Sudeste asiático y Europa oriental.

**Pares confirmados de alta severidad** (requieren validación en dispositivo):

| Par | Continente | Nivel | Problema |
|-----|-----------|-------|----------|
| TL-ID | Asia | Guía | Hull invisible de Indonesia cubre zona de Timor |
| LS-ZA | África | Guía | Lesoto es enclave completo de Sudáfrica |
| SZ-ZA | África | Guía | Suazilandia semi-enclave de Sudáfrica |
| PS-IL | Asia | Guía | Palestina (Cisjordania/Gaza) rodeada por Israel |
| BN-MY | Asia | Guía | Brunéi enclavado en Borneo (Malasia) |
| GM-SN | África | Guía | Gambia penetra dentro de Senegal |

**Pares ya manejados por MICROSTATE_PAIRS** (14 pares, principalmente enclaves europeos):
IT-VA, IT-SM, FR-MC, AT-LI, CH-LI, ES-AD, FR-AD, BE-LU, DE-LU, FR-LU, MY-SG, QA-BH, SA-BH, AS-WS.

**Pares a investigar más** (inventario no exhaustivo):
- Medio Oriente: Líbano, Jordania, Kuwait (rodeados de vecinos grandes)
- Sudeste asiático: Camboya entre Tailandia y Vietnam
- Caribe: arco de islas pequeñas cercanas entre sí (AG, LC, GD, VC, DM)
- África occidental: Guinea-Bisáu
- Europa: Moldavia, Kosovo, Macedonia del Norte

**Nota sobre falsos positivos**: Pares como Nauru-Palau o Tuvalu-Kiribati fueron descartados — la distancia real (>2500 km) y el zoom extremo eliminan el riesgo.

## Soluciones propuestas

### Solución A: Excluir hulls invisibles del hit testing cuando hay match en fase 2 cerca (recomendada)

Modificar fase 3 del hit testing para que, cuando el tap cae dentro de un hull invisible, se verifique si hay algún país **cercano** cuya geometría real está a poca distancia. Si lo hay, preferir ese país.

**Implementación**: En la fase 3, tras encontrar match por hull, calcular `geoDistance(tap, centroide_de_cada_país_cercano)` y preferir el país más cercano si la distancia es menor que un umbral.

**Ventaja**: Solución genérica que cubre TL-ID y cualquier futuro caso de hull que tape a un vecino.

### Soluciones descartadas

- **Ampliar MICROSTATE_PAIRS**: Lista manual que no escala.
- **Tolerancia direccional en JugarView**: Podría ser demasiado permisivo.
- **Combinación de ambas**: Sobre-ingeniería para el problema actual.

## Recomendación

**Solución A**. Es genérica, localizada en un solo punto del pipeline, y cubre tanto TL-ID como cualquier futuro caso de hull que tape a un vecino. La tolerancia existente en JugarView.tsx actúa como segunda red de seguridad sin necesidad de cambios adicionales.

## Próximos pasos

1. Implementar solución A en `hitTest` (GlobeD3.tsx, fase 3)
2. Validar en dispositivo con los pares de alta severidad (TL-ID, LS-ZA, SZ-ZA, PS-IL, BN-MY, GM-SN)
