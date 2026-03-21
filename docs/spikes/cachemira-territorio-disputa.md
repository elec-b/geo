# Spike: Cachemira y territorios no identificados en el globo

> **Fecha**: 2026-03-21
> **Objetivo**: Investigar el triángulo entre China, Pakistán e India (Cachemira), y proponer cómo manejarlo en GeoExpert.
> **Hallazgo adicional**: Existen 6 features huérfanas en el TopoJSON, no solo Siachen.

---

## 1. Contexto: qué es Cachemira

Cachemira es una **región histórica** (~222.000 km²) en la confluencia del Himalaya occidental, dividida de facto entre tres países:

| Subregión | Administra | Área aprox. |
|-----------|-----------|-------------|
| Jammu y Cachemira (incl. Srinagar) | India | ~55.500 km² |
| Ladakh (incl. Leh) | India | ~59.000 km² |
| Azad Cachemira | Pakistán | ~13.300 km² |
| Gilgit-Baltistán | Pakistán | ~73.000 km² |
| Aksai Chin | China | ~37.200 km² |
| Trans-Karakoram Tract | China | ~5.800 km² |
| Glaciar de Siachen | Disputado India-Pak | ~2.100 km² |

### Matiz importante (del refutador)

"Cachemira" como etiqueta única es **ya una decisión política**:
- **Aksai Chin** no es históricamente "Cachemira" — era un territorio de tránsito entre Tíbet y Xinjiang. Agruparlo bajo "Cachemira" adopta implícitamente la narrativa india.
- **Ladakh** tiene identidad cultural, lingüística y religiosa distinta (budista tibetana vs. musulmana sunní). Los propios ladakíes celebraron la separación de J&K en 2019.

### Líneas de control

| Línea | Separa | Desde |
|-------|--------|-------|
| **LoC** (Line of Control) | India ↔ Pakistán | 1972 (Acuerdo de Simla) |
| **LAC** (Line of Actual Control) | India ↔ China | 1962 (guerra sino-india) |
| **AGPL** (Actual Ground Position Line) | India ↔ Pakistán (Siachen) | 1984 |

### Contexto ONU

- Resoluciones 39, 47, 80, 91 del CSNU (plebiscito nunca realizado).
- UNMOGIP (observadores) sigue activo — la ONU considera el estatus final **no resuelto**.
- India argumenta que el Acuerdo de Simla (1972) bilateralizó el conflicto.

---

## 2. Cómo lo manejan otros proveedores de mapas

| Proveedor | Enfoque |
|-----------|---------|
| **Natural Earth** (nuestra fuente) | De facto: Siachen como feature independiente sin ID. Resto integrado en India/Pak/China |
| **Google Maps** | Localizado: desde India muestra todo como indio; desde fuera, líneas discontinuas |
| **Apple Maps** | Localizado: similar a Google |
| **OpenStreetMap** | De facto ("on the ground"), tags `boundary=disputed` |

---

## 3. Estado actual en nuestros datos

### 3.1 Cómo aparece Cachemira en countries-50m.json

Natural Earth 50m **NO tiene un polígono "Kashmir"** separado. La zona está repartida:

| Punto geográfico | Feature asignada |
|-----------------|-----------------|
| Srinagar (74.8°E, 34.1°N) | India (id:356) |
| Muzaffarabad (73.5°E, 34.4°N) | Pakistán (id:586) |
| Aksai Chin (79°E, 35°N) | China (id:156) |
| Glaciar Siachen (77.1°E, 35.4°N) | "Siachen Glacier" (sin ID, sin ISO) |

Al tocar Siachen en Explorar: **no pasa nada** (`cca2 = null` → guard en ExploreView lo ignora). Es un "agujero negro" en la interacción.

Al tocar el resto de la zona: devuelve India, Pakistán o China correctamente.

### 3.2 Hallazgo: 6 features huérfanas, no solo Siachen

El refutador de geodatos descubrió que hay **6 features** en el TopoJSON que no están mapeadas a ningún código:

| Feature | ID | ISO oficial | Soberano | Área (km²) |
|---------|-----|------------|----------|-----------|
| Siachen Glacier | (sin ID) | — | Disputado | ~27 |
| Indian Ocean Ter. | (sin ID) | CX/CC | Australia | ~1.800 |
| S. Geo. and the Is. | 239 | GS | Reino Unido | ~46.000 |
| Br. Indian Ocean Ter. | 086 | IO | Reino Unido | ~1.700 |
| Fr. S. Antarctic Lands | 260 | TF | Francia | ~87.700 |
| Heard I. and McDonald Is. | 334 | HM | Australia | ~5.300 |

Las 5 features no-Siachen tienen códigos ISO oficiales y encajan perfectamente en el patrón existente de `NON_UN_TERRITORIES_BY_ID` / `NON_UN_TERRITORIES_BY_NAME`. Son territorios dependientes, no disputados.

**El problema real no es "Cachemira" sino una cobertura incompleta de territorios remotos en el mapeo.**

---

## 4. Análisis de opciones para Siachen/Cachemira

### Opción A: Añadir Siachen como territorio en disputa

Añadir a `NON_UN_TERRITORIES_BY_NAME` con código inventado.

- **A favor**: Elimina el agujero negro; mínima intervención (unas pocas líneas).
- **En contra**:
  - Siachen es **visualmente irrelevante** (~27 km², <5 píxeles a zoom de India). Solo visible a zoom 15+.
  - Requiere datos sintéticos completos para un glaciar militarizado sin población civil.
  - Siachen no tiene capital, moneda, gentilicio — la ficha sería casi vacía.
  - Conceptualmente no es comparable a Kosovo/Taiwán/Sáhara Occidental (territorios con población y gobiernos).
  - El código `XX-SC` es inconsistente con la convención existente (2-3 chars sin guión).

### Opción B: Geometría custom de "Cachemira"

Crear GeoJSON recortando de India/Pakistán/China.

- **En contra**: Modificación mayor del pipeline. Crea fronteras artificiales. No refleja ninguna realidad de facto. Descartada.

### Opción C: Statu quo documentado (recomendada para Siachen)

No hacer nada especial con Siachen. Documentar que Natural Earth ya refleja la realidad de facto y que el triángulo es visualmente irrelevante.

- **A favor**: Cero riesgo de introducir sesgo. Sin código nuevo. Coherente con el enfoque de facto de Natural Earth.
- **En contra**: Un usuario haciendo zoom extremo en la zona podría tocar Siachen sin respuesta. Riesgo mínimo.

### Opción D: Parche completo de features huérfanas (recomendada para los 5 territorios restantes)

Añadir las 5 features no-Siachen a los mapeos existentes:

```
NON_UN_TERRITORIES_BY_ID:
  239 → { cca2: 'GS', continent: 'America', sovereignCca2: 'GB' }  // Georgia del Sur
  086 → { cca2: 'IO', continent: 'Asia', sovereignCca2: 'GB' }     // Terr. Británico Oc. Índico
  260 → { cca2: 'TF', continent: 'Africa', sovereignCca2: 'FR' }   // Tierras Australes Francesas (*)
  334 → { cca2: 'HM', continent: 'Oceania', sovereignCca2: 'AU' }  // Heard y McDonald

NON_UN_TERRITORIES_BY_NAME:
  'Indian Ocean Ter.' → { cca2: 'CX', continent: 'Asia', sovereignCca2: 'AU' }
```

(*) TF y HM son subantárticos. Asignar a "África" (TF, convención geográfica francesa) y "Oceanía" (HM, convención australiana). Es discutible pero necesario dado que el tipo `Continent` no incluye "Antártida" para territorios no-ONU.

- **A favor**: Resuelve 5 de 6 agujeros negros. Usa códigos ISO oficiales. Encaja perfectamente en la arquitectura existente. Estos territorios ya tienen datos en REST Countries (fetch-countries.ts los descargaría automáticamente).
- **Esfuerzo**: ~10 líneas de mapeo + verificar que fetch-countries.ts los descarga correctamente.

---

## 5. Objeciones del refutador geopolítico incorporadas

### 5.1 Necesidad de política general de territorios disputados

> "La decisión sobre Cachemira no puede tomarse aisladamente. Necesita una política general que se aplique de forma coherente."

Casos análogos que deben resolverse con los mismos criterios:
- **Crimea** (Rusia/Ucrania) — Natural Earth: de facto bajo Rusia
- **Arunachal Pradesh** (India/China) — Natural Earth: de facto bajo India
- **Golán** (Israel/Siria) — Natural Earth: de facto bajo Israel
- **Taiwán, Kosovo, Sáhara Occidental, Malvinas** — ya manejados en la app

**Nuestra política actual** (implícita, ahora explicitada):
> GeoExpert usa la representación de facto de Natural Earth. Los territorios disputados se marcan con "Soberanía en disputa" en su ficha. No tomamos partido sobre reclamaciones legales. Los 195 países ONU son la base del juego; los territorios disputados son solo visibles en Explorar.

Esta política ya es **coherente con todos los casos**: Natural Earth resuelve Crimea, Arunachal Pradesh y Golán de la misma forma (de facto). No necesitamos intervenir caso por caso.

### 5.2 Riesgo legal en India

- La ley de 2016 (Geospatial Information Regulation Bill) **no se aprobó**. Pero la IT Act permite bloquear apps.
- **Riesgo real**: bajo en probabilidad (app pequeña), alto en impacto si ocurre (eliminación del store indio).
- **Mitigación**: Nuestro mapa ya muestra la perspectiva de facto, que coincide mayoritariamente con la administración india de J&K y Ladakh. El único punto conflictivo sería que la LoC no aparece como frontera internacional, pero esto es estándar en toda la cartografía no india.
- **Decisión**: Aceptar el riesgo. No implementar localización por país (complejidad desproporcionada para una app indie). Si algún día se necesita, Natural Earth ofrece viewpoints (`fclass_in`) pero nuestro dataset simplificado no los incluye.

### 5.3 Perspectiva del usuario final

> "¿Los usuarios quieren precisión geopolítica o simplemente saber qué país es?"

El 95% de los usuarios solo quiere aprender geografía. El enfoque de facto es perfectamente adecuado para este público. La ficha "Soberanía en disputa" cubre el 5% que necesita más contexto.

---

## 6. Decisión

### Para Siachen/Cachemira: Opción C (statu quo documentado)

- Natural Earth ya refleja la realidad de facto.
- Siachen es visualmente irrelevante y conceptualmente no comparable a los territorios disputados existentes.
- El "agujero negro" solo es detectable con zoom extremo en una zona específica.
- No creamos datos sintéticos para un glaciar militarizado.

### Para las 5 features huérfanas: Opción D (parche de mapeos)

- Tarea independiente del spike de Cachemira.
- Son territorios con ISO oficial que simplemente faltan en `isoMapping.ts`.
- REST Countries ya tiene sus datos — solo falta el mapeo.
- Añadir al backlog como tarea separada.

### Política general: Explicitar en DESIGN.md

Añadir una sección breve en DESIGN.md § Territorios no-ONU que documente:
> "GeoExpert usa la representación de facto de Natural Earth sin modificaciones. No se implementa localización cartográfica por país."

---

## 7. Resumen de acciones

| Acción | Prioridad | Esfuerzo |
|--------|-----------|----------|
| Documentar política de territorios disputados en DESIGN.md | Alta | 5 min |
| Parchear 5 features huérfanas en `isoMapping.ts` | Media | ~30 min |
| Verificar que fetch-countries.ts descarga GS, IO, TF, HM, CX | Media | 10 min |
| Nada especial para Siachen/Cachemira | — | 0 |
