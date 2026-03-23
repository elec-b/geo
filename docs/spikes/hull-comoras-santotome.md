# Spike: Hull visible para Comoras (KM) y Santo Tomé y Príncipe (ST)

**Fecha**: 2026-03-23
**Contexto**: Feedback de testing exhaustivo en África-Guía (Aventura, tipo A/B).

## Pregunta

¿Deberían Comoras y Santo Tomé y Príncipe tener hull visible y/o override 10m, como ya se hizo para otros archipiélagos del Índico (Seychelles, Maldivas)?

También se evaluó Mauricio (MU).

## Análisis

### Override 10m: no necesario

| País | 50m (polys) | 10m (polys) | Ratio | Veredicto |
|------|------------|------------|-------|-----------|
| KM Comoras | 3 | 3 | 1.0x | Sin mejora |
| ST Santo Tomé y Príncipe | 2 | ~2 | ~1.0x | Sin mejora |
| MU Mauricio | 1 | 3 | 3.0x | Isla principal suficiente |
| SC Seychelles (ref.) | 1 | 18 | 18x | Ya con override |
| MV Maldivas (ref.) | 2 | 22 | 11x | Ya con override |

KM y ST ya tienen todas sus islas principales representadas en 50m. El spike original (`archipielagos-resolucion-10m.md`) los descartó explícitamente.

### Hull visible: sí para KM y ST

Testeado en dispositivo (iPhone, África-Guía):

- **KM (Comoras)**: 3 islas (Grande Comore, Anjouan, Mohéli) en ~350 km N-S en el canal de Mozambique. Sin hull, cuesta identificar visualmente que las 3 islas son un solo país. Ya estaba en `ARCHIPELAGO_CODES` (hit testing), faltaba hull visible.
- **ST (Santo Tomé y Príncipe)**: 2 islas en el Golfo de Guinea, ~140 km de separación. Similar a KM — sin hull, no es evidente que las dos islas forman un país. No estaba en `ARCHIPELAGO_CODES` ni en `HULL_VISIBLE_CODES`.
- **MU (Mauricio)**: Isla principal dominante, Rodrigues a 580 km al este. No necesita hull — la isla principal es suficiente para reconocimiento y hit testing.

### Efecto en marcadores de microestado

Ambos (KM, ST) son microestados. Al añadirlos a `HULL_VISIBLE_CODES`, dejan de mostrar el marcador circular y muestran el hull en su lugar — mismo comportamiento que KI, PW, TT, SC, MV (ver DESIGN.md § Outlines de archipiélagos).

### CENTROID_OVERRIDE: no necesario

Ambos tienen centroides geométricos cercanos a sus capitales (Moroni en Grande Comore, Santo Tomé en la isla homónima). No hay problema de centroide en vacío oceánico.

## Decisión

| País | Override 10m | ARCHIPELAGO_CODES | HULL_VISIBLE_CODES |
|------|-------------|-------------------|-------------------|
| KM | No | Ya estaba | **Añadido** |
| ST | No | **Añadido** | **Añadido** |
| MU | No | No | No |

## Cambios

Archivo único: `src/components/Globe/GlobeD3.tsx`
- `ST` añadido a `ARCHIPELAGO_CODES`
- `KM` y `ST` añadidos a `HULL_VISIBLE_CODES` (grupo `// Índico / África`)
