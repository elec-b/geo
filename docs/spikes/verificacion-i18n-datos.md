# Spike: Verificación de datos i18n contra fuentes autoritativas (32 idiomas)

**Fecha**: 2026-03-27
**Contexto**: Cruzar los ~23,600 puntos de datos i18n contra fuentes del Spike 1 (fuentes-autoritativas-i18n.md). Para español ya se verificó contra la RAE/DPD (encontrando ~27 errores, ya corregidos). Este spike replica esa verificación para los 31 idiomas restantes.
**Método**: Agent team de 9 agentes (4 pares auditor+refutador + líder). Todo exhaustivo, 32 idiomas, sin tiering.
**Fuentes**: CNT/PTVM (fr), StAGN + Auswärtiges Amt (de), PCGN (en), Taalunie (nl), Språkrådet (nb), Kotus (fi), IEC Nomenclàtor (ca), KSNG (pl), ОКСМ (ru), MOFA (ja/zh-Hant), CLDR, Wikidata, Wikipedia en 32 idiomas, Wiktionnaire/Wiktionary, Duden, Larousse.

---

## 1. Nombres de países (237 × 32)

### 1.1 Overrides existentes verificados

Los **177 overrides** en `country-name-overrides.json` (24 idiomas) fueron verificados exhaustivamente contra fuentes nacionales y Wikipedia. **Todos son correctos.** Ninguno necesita corrección ni eliminación.

### 1.2 Overrides faltantes confirmados (implementar)

6 overrides nuevos confirmados por auditor + refutador con fuente autoritativa:

| Idioma | País | Actual (CLDR) | Propuesto | Fuente |
|--------|------|--------------|-----------|--------|
| **es** | SZ | Esuatini | **Suazilandia** | RAE recomienda mantener "Suazilandia" |
| **nl** | MV | Maldiven | **Malediven** | Taalunie |
| **nl** | SZ | Eswatini | **Swaziland** | Taalunie |
| **ca** | CI | Côte d'Ivoire | **Costa d'Ivori** | IEC Nomenclàtor |
| **ca** | LA | Lao | **Laos** | IEC + tradición de uso |
| **ca** | TL | Timor-Leste | **Timor Oriental** | IEC + Viquipèdia |

### 1.3 Overrides dudosos (decisión del usuario)

~12 casos donde ambas formas son válidas. Variantes regionales o de estilo, no errores:

| Idioma | País | Actual | Alternativa | Naturaleza |
|--------|------|--------|-------------|------------|
| es | RO | Rumanía | Rumania | Variante regional (España vs América) |
| es | SA | Arabia Saudí | Arabia Saudita | Variante regional |
| es | EH | Sáhara Occidental | Sahara Occidental | Acentuación (ambas RAE) |
| fr | KG | Kirghizstan | Kirghizistan | Coexisten oficialmente |
| nl | BY | Belarus | Wit-Rusland | Oficial vs consuetudinario |
| pt-PT | SV | Salvador | El Salvador | Falta artículo "El" |

### 1.4 Divergencias sin autoridad (10 idiomas Grupo B)

544 divergencias CLDR vs. Wikipedia documentadas para idiomas sin fuente nacional. Patrones principales:

| Idioma | Divergencias | Patrón principal |
|--------|-------------|-----------------|
| hi | 93 | Transliteraciones CLDR (anglicismos) vs Wikipedia (más fieles) |
| pt-BR | 34 | Variantes ortográficas brasileñas vs europeas (ê/é, ô/ó) — CLDR pt-BR correcto |
| pt-PT | 31 | Variantes ortográficas europeas — CLDR pt-PT correcto |
| vi | 31 | CLDR usa anglicismos (Australia, Italy); Wikipedia usa nombres vietnamitas (Úc, Ý) |
| ms | 22 | Patrón similar a vi — mezcla de anglicismos y formas malayas |
| th | 15 | Transliteraciones tailandesas |
| it | 12 | Micro-divergencias (Cechia vs R. Ceca, mayúsculas) |
| da | 11 | Artículos definidos ("De/Den") omitidos por CLDR |
| ro | 10 | Formas oficiales vs coloquiales |
| sv | 2 | Mínimas |

**Nota**: Las 34 divergencias pt-BR y 31 pt-PT son mayoritariamente variantes ortográficas legítimas entre portugués brasileño y europeo, no errores. Las 93 divergencias hindi son variaciones de transliteración sin autoridad para decidir.

**Resolución (28 Marzo)**: Spike detallado con análisis caso por caso → `divergencias-cldr-wikipedia.md`. Resultado: 346 divergencias analizadas por agent team (2 auditores + 2 refutadores). 94 overrides nuevos aprobados, 248 mantenidos como CLDR. Principales cambios: vi (29 anglicismos→nombres nativos), hi (19 transliteraciones mejoradas), ms (15 nombres malayos nativos).

### 1.5 Hallazgo transversal: Eswatini/Swaziland

CLDR adoptó "Eswatini" (endónimo) para muchos idiomas, pero el uso consuetudinario mantiene el nombre tradicional en 7+ idiomas. Ya existe override para es y nl. Otros idiomas afectados: it, fi, da, sv, cs, el, th, vi (sin override — documentado como divergencia).

---

## 2. Capitales (237 × 32)

### 2.1 Errores confirmados (corregir)

| Idioma | País | Actual | Correcto | Tipo | Severidad |
|--------|------|--------|----------|------|-----------|
| **zh-Hant** | **TODOS (237)** | Caracteres simplificados | **Caracteres tradicionales** | Error sistémico del pipeline | **CRÍTICO** |
| da | GT | Guatamala City | **Guatemala City** | Typo | Menor |
| uk | ZA | Кейптаун (Cd. del Cabo) | **Преторія** (Pretoria) | Capital incorrecta | Medio |
| pl | AD | Andora (nombre del país) | **Andorra la Vella** | Capital incorrecta | Medio |
| sk | AD | Andorra (nombre del país) | **Andorra la Vella** | Capital incorrecta | Medio |
| th | SG | ประเทศสิงคโปร์ | **สิงคโปร์** | Prefijo "país" innecesario | Medio |

**Error más grave**: zh-Hant usa caracteres simplificados en las 237 capitales (idénticas byte a byte a zh-Hans). Los nombres de países (`name`) sí fueron convertidos correctamente, lo que indica un bug en el pipeline de generación que omitió la conversión de capitales.

### 2.2 Datos a limpiar

| Tipo | Entradas | Idiomas afectados | Acción |
|------|----------|-------------------|--------|
| Disambiguation innecesaria (", País" tras capital) | ~36 | id (10), hr (6), ms (6), ro (5), vi (5), hi (2), de (1) | Strip texto tras `,` o `(` |
| Apóstrofos curvos (') → rectos (') | ~13 | de, fi, hu, it, sk | Normalizar en pipeline |
| Sufijo "District"/"市"/"區"/"地区" innecesario | ~8 | en, ja, ko, hi, zh-Hans, zh-Hant | Limpiar |

**Recomendación**: Añadir pasos de limpieza al pipeline: (1) strip disambiguation, (2) normalizar apóstrofos, (3) validar capital ≠ nombre del país.

### 2.3 Inconsistencias entre idiomas (decisión del usuario)

| País | Problema | Opción A | Opción B | Idiomas A / B |
|------|----------|----------|----------|---------------|
| **GQ** (Guinea Ec.) | Capital en transición | Malabo (capital oficial histórica) | Ciudad de la Paz (nueva capital, proclamada ene. 2026) | 1 / 20 |
| **BO** (Bolivia) | Doble capital | Sucre (constitucional) | La Paz (sede gobierno) | 1 / 31 |
| **LK** (Sri Lanka) | Doble capital | Sri Jayawardenepura Kotte (oficial) | Colombo (comercial/ejecutiva) | 1 / 31 |
| **MS** (Montserrat) | Capital destruida | Plymouth (de iure, ciudad fantasma) | Brades (de facto) | 13 / 8 |

**Nota**: En los 4 casos, solo `es` difiere de la mayoría. La inconsistencia (1 vs 31) es el problema real — cualquier decisión editorial es válida, pero debe ser consistente.

### 2.4 Transliteraciones alternativas válidas (no errores)

Documentadas ~10 transliteraciones alternativas (ej: es "Asjabad" vs "Ashgabat", es "Tiflis" vs "Tbilisi", nl "Asjchabad" vs "Ashgabat"). Todas son formas aceptadas en su idioma. Sin acción.

---

## 3. Gentilicios (237 × 32)

### 3.1 Errores confirmados — bugs de formato (corregir)

| Idioma | País | Actual | Correcto | Tipo |
|--------|------|--------|----------|------|
| **fi** | CD | kongolainenkinshasa | **kongolainen** | Ciudad concatenada al gentilicio |
| **fi** | CG | kongolainenbrazzaville | **kongolainen** | Ciudad concatenada al gentilicio |
| **fi** | SZ | swazimaalaiinen | **swazimaalainen** | Doble 'i' (typo) |
| **fi** | TG | togolaiinen | **togolainen** | Doble 'i' (typo) |
| **pl** | FM | mikronezysjki | **mikronezyjski** | Transposición s↔j |

### 3.2 Errores confirmados — duplicados Niger/Nigeria (corregir)

| Idioma | País | Actual | Correcto | Problema |
|--------|------|--------|----------|---------|
| **hi** | NE | नाइजीरियन (=NG Nigeria) | **नाइजरी** | Gentilicio de Niger duplicado con Nigeria |
| **el** | NE | νιγηριανός (=NG Nigeria) | **νιγηρινός** | Mismo problema. Verificar con nativo |

### 3.3 Errores rechazados tras refutación

| Hallazgo auditor | Veredicto refutador | Razón |
|-----------------|---------------------|-------|
| fr/MK "macédonien" → "nord-macédonien" | ⚠ Dudoso → NO corregir | "Macédonien" sigue siendo la forma dominante en francés |
| de/MK "mazedonisch" → "nordmazedonisch" | ✗ Rechazado | Duden y Auswärtiges Amt usan "mazedonisch" |
| es/KE "keniano" → "keniata" | ✗ Rechazado | "Keniano" ES la forma RAE preferida (auditor se equivocó) |
| fr: AG, VU, SO, CR, PG, TL | ⚠ Dudoso → NO corregir | Variantes válidas sin fuente CNIG que desempate |

### 3.4 Patrones documentados (convenciones válidas, NO errores)

#### CJK: Forma posesiva (Xの / X의 / X的) — 100% de entradas

Los 237 países en ja, ko, zh-Hans y zh-Hant usan la forma posesiva ("de X") en vez de la forma con 人/인 ("persona de X"). **Es una decisión de diseño consistente y válida**:
- La forma posesiva funciona como adjetivo, apropiada para una tarjeta informativa
- La forma X人 existe para países grandes (日本人, 中国人) pero no para países pequeños
- La forma posesiva es universalmente aplicable y gramaticalmente correcta
- Consistencia 100% (237/237 en los 4 idiomas CJK)

#### SEA: Nombre del país sin derivar (vi, id, ms, th) — 100% de entradas

Los 237 países en vietnamita, indonesio, malayo y tailandés usan el nombre del país directamente como gentilicio/adjetivo. **Es la convención lingüística natural de estas lenguas**:
- Estas lenguas NO tienen sufijos derivativos tipo -ese, -ian, -isch
- Usan "người/orang/ชาว + país" para personas, y el nombre solo como adjetivo
- Consistencia 100% (237/237 en los 4 idiomas SEA)

#### Otros patrones válidos
- **ro**: 51 entradas con "din X" (perifrassis para territorios sin gentilicio) — correcto
- **hu**: 50 entradas sin sufijo -i (formas históricas/étnicas) — correcto
- **tr**: 11 entradas con nombre de territorio (islas sin gentilicio turco) — correcto

### 3.5 Inconsistencias internas documentadas

| Patrón | Idiomas | Correcto? |
|--------|---------|-----------|
| CD/CG ambos "congolés/congolais" | 27 idiomas | Sí — ambos son Congo |
| DM/DO ambos "dominicano" | en, it, nl, id, hi | Problema — Dominica ≠ Rep. Dominicana |
| GF/GY ambos "guyanais/guianense" | pl, pt-BR, pt-PT | Problema — deberían diferenciarse |
| NE/NG duplicados | hi, el | **Error confirmado** (ver §3.2) |

---

## 4. Mares y océanos (28 × 32)

### 4.1 Errores confirmados (14 total, corregir)

| # | Idioma | Cuerpo de agua | Actual | Correcto | Fuente |
|---|--------|---------------|--------|----------|--------|
| 1 | **ca** | Black Sea | Mar Negre | **Mar Negra** | ca.wikipedia (femenino en catalán) |
| 2 | **nl** | Caribbean Sea | Caribische Zee | **Caraïbische Zee** | nl.wikipedia |
| 3 | **fi** | Caribbean Sea | Karibia | **Karibianmeri** | fi.wikipedia ("Karibia" es la región, no el mar) |
| 4 | **fi** | Philippine Sea | Filippiinienimeri | **Filippiinienmeri** | fi.wikipedia (sobra una "i") |
| 5 | **fi** | Weddell Sea | Weddenmeri | **Weddellinmeri** | fi.wikipedia |
| 6 | **fi** | South China Sea | Etelä-Kiinanmeri | **Etelä-Kiinan meri** | fi.wikipedia (falta espacio) |
| 7 | **nb** | Caribbean Sea | Karibhavet | **Det karibiske hav** | no.wikipedia |
| 8 | **nb** | Persian Gulf | Persabukta | **Persiabukten** | no.wikipedia (falta "i" + sufijo -en no -a) |
| 9 | **hr** | Weddell Sea | Weddellov more | **Weddellovo more** | hr.wikipedia (falta "o") |
| 10 | **id** | Mediterranean | Laut Mediterania | **Laut Tengah** | id.wikipedia (nombre estándar indonesio) |
| 11 | **it** | Arctic Ocean | Oceano Artico | **Mar Glaciale Artico** | it.wikipedia ("Oceano Artico non è in uso in Italia") |
| 12 | **el** | Weddell Sea | Θάλασσα Ουέντελ | **Θάλασσα Γουέντελ** | Transliteración: W→Γου en griego |
| 13 | **hi** | Pacific Ocean | प्रशांत महासागर | **प्रशान्त महासागर** | hi.wikipedia (virama vs anusvara) |
| 14 | **da** | Caribbean Sea | Caribien | **Caribiske Hav** | da.wikipedia ("Caribien" es la región, no el mar) |

**Nota**: Errores 3 y 14 (fi y da) confunden la región caribeña con el mar Caribe — mismo tipo de error.

### 4.2 Nombres alternativos válidos (no errores)

13 casos donde nuestra forma difiere de Wikipedia pero es un nombre alternativo reconocido:
- nb "Nordishavet" (Arctic) — sinónimo de "Polhavet" según Språkrådet
- hr "Sjeverni ledeni ocean" (Arctic) — sinónimo de "Arktički ocean"
- sv "Södra ishavet" (Southern) — sinónimo de "Antarktiska oceanen"
- it "Mar dei Caraibi" (Caribbean) — alternativa a "Mare Caraibico"
- ko "동해" (Sea of Japan) — nombre coreano oficial ("Mar del Este")
- vi "Biển Đông" (South China Sea) — nombre vietnamita oficial ("Mar del Este")

### 4.3 Nombres políticamente sensibles — verificados correctos

| Cuerpo de agua | Idioma sensible | Nuestro nombre | Veredicto |
|----------------|----------------|----------------|-----------|
| South China Sea | vi | Biển Đông (Mar del Este) | ✓ Correcto para Vietnam |
| South China Sea | zh-Hans/Hant | 南海 (Mar del Sur) | ✓ Correcto para China |
| Sea of Japan | ko | 동해 (Mar del Este) | ✓ Correcto para Corea |
| Sea of Japan | ja | 日本海 | ✓ Correcto para Japón |
| Persian Gulf | tr | Basra Körfezi (Golfo de Basra) | ✓ Nombre turco estándar |

Todos los idiomas usan nombres apropiados para su contexto cultural. Sin conflictos.

---

## 5. Resumen cuantitativo

| Tipo | Verificados | Errores confirmados | Tasa error | Notas |
|------|------------|--------------------|-----------|----|
| Nombres países | 7,584 + 177 overrides | **6 overrides faltantes** + ~12 dudosos | <0.1% | CLDR muy robusto |
| Capitales | 7,584 | **237 zh-Hant** + 5 puntuales + ~57 limpiezas | ~3.9%* | *Dominado por bug sistémico zh-Hant |
| Gentilicios | 7,584 | **7 confirmados** (5 formato + 2 duplicados) | 0.09% | Calidad excepcional para datos LLM |
| Mares/océanos | 896 | **14 confirmados** | 1.6% | Finés con 4 errores (idioma más afectado) |
| **Total** | **23,648** | **~269** (237 sistémico + 32 puntuales) | **1.1%** | Sin zh-Hant: **0.14%** |

### Calidad por idioma (errores puntuales, excl. zh-Hant sistémico)

| Idioma | Errores | Tipo |
|--------|---------|------|
| **fi** (finés) | 8 | 4 gentilicios (formato) + 4 mares (ortografía) |
| **nb** (noruego) | 2 | 2 mares |
| **da** (danés) | 2 | 1 capital (typo) + 1 mar |
| **hi** (hindi) | 2 | 1 gentilicio (duplicado NE/NG) + 1 mar (sutil) |
| **el** (griego) | 2 | 1 gentilicio (duplicado NE/NG) + 1 mar |
| **pl** (polaco) | 2 | 1 gentilicio (typo) + 1 capital (AD) |
| **sk** (eslovaco) | 1 | 1 capital (AD) |
| **uk** (ucraniano) | 1 | 1 capital (ZA) |
| **hr** (croata) | 1 | 1 mar |
| **ca** (catalán) | 1 | 1 mar |
| **nl** (neerlandés) | 1 | 1 mar |
| **id** (indonesio) | 1 | 1 mar |
| **it** (italiano) | 1 | 1 mar |
| **th** (tailandés) | 1 | 1 capital (SG) |

---

## 6. Correcciones recomendadas (para tarea posterior)

### 6.1 Crítico — Error sistémico

**zh-Hant capitales**: Las 237 capitales en chino tradicional usan caracteres simplificados (idénticas a zh-Hans). Fix en el pipeline de generación (`fetch-countries.ts`): aplicar conversión simplificado→tradicional al campo `capital` igual que se hace con `name`.

### 6.2 Alto — Errores puntuales a corregir

**En `scripts/data/capitals-all.json`:**
- da/GT: "Guatamala City" → "Guatemala City"
- uk/ZA: "Кейптаун" → "Преторія"
- pl/AD: "Andora" → "Andorra la Vella"
- sk/AD: "Andorra" → "Andorra la Vella"
- th/SG: "ประเทศสิงคโปร์" → "สิงคโปร์"

**En `scripts/data/demonyms-all.json`:**
- fi/CD: "kongolainenkinshasa" → "kongolainen"
- fi/CG: "kongolainenbrazzaville" → "kongolainen"
- fi/SZ: "swazimaalaiinen" → "swazimaalainen"
- fi/TG: "togolaiinen" → "togolainen"
- pl/FM: "mikronezysjki" → "mikronezyjski"
- hi/NE: "नाइजीरियन" → "नाइजरी"
- el/NE: "νιγηριανός" → "νιγηρινός" (verificar con nativo)

**En `scripts/data/country-name-overrides.json`:**
- es/SZ: "Suazilandia"
- nl/MV: "Malediven", nl/SZ: "Swaziland"
- ca/CI: "Costa d'Ivori", ca/LA: "Laos", ca/TL: "Timor Oriental"

**En `public/data/sea-labels.json`:**
- Los 14 errores de la tabla §4.1

### 6.3 Medio — Limpiezas de pipeline

- ~36 capitales con disambiguation innecesaria → strip tras "," o "("
- ~13 apóstrofos curvos → normalizar a rectos
- ~8 sufijos innecesarios ("District", "市", "區")
- Capitalización inconsistente entre idiomas (GQ especialmente)

### 6.4 Decisiones editoriales pendientes (requieren input del usuario)

- **GQ**: ¿Malabo o Ciudad de la Paz? (capital en transición desde ene. 2026)
- **BO**: ¿Sucre o La Paz? (unificar; actualmente 1 vs 31 idiomas)
- **LK**: ¿Sri Jayawardenepura Kotte o Colombo? (unificar; actualmente 1 vs 31)
- **MS**: ¿Plymouth o Brades? (capital destruida vs de facto)
- **~12 overrides dudosos** de nombres de países (variantes regionales)

---

## 7. Estrategia de mantenimiento futuro

### Script propuesto: `npm run validate-i18n`

```
Para cada idioma L y país P:
  1. CLDR name vs. Wikipedia article title → FLAG si difieren
  2. Capital (nuestro dato) vs. Wikidata label → FLAG si difieren
  3. Sea labels vs. Wikidata labels (Q-items) → FLAG si difieren
  4. Gentilicio: verificar NE ≠ NG, CD ≠ CG (duplicados conocidos)
  5. Capital ≠ nombre del país (validación anti-Andorra)
  6. Normalizar apóstrofos curvos → rectos
  7. Strip disambiguation tras "," o "(" en capitales
Output: informe de discrepancias (diff vs. run anterior)
```

### Frecuencia
- **CLDR**: 2 releases/año (abril y octubre) → re-ejecutar pipeline
- **Wikidata**: trimestral
- **Gentilicios/mares**: estáticos, solo si feedback de usuarios
- **Fuentes nacionales** (CNT, KSNG, StAGN): bajo demanda, cuando publiquen nueva edición

### Feedback loop post-lanzamiento
Botón "Reportar error" en ficha de país → especialmente valioso para hi, th, vi, ms (idiomas sin fuente autoritativa accesible).
