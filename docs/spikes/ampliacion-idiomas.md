# Spike: Ampliación de cobertura de idiomas (26 → ~34)

**Fecha**: 2026-03-26
**Contexto**: Tenemos 26 idiomas implementados (tier 1 + tier 2 del spike anterior). App Store soporta 39 locales, Google Play ~87. Este spike evalúa qué idiomas añadir antes del lanzamiento.
**Método**: Agent team de 4 agentes (investigador de locales + refutador, analista de impacto + refutador) con revisión cruzada.
**Fuentes**: Apple Developer (App Store localizations), Google Play Console Help (table/4419860), Ethnologue 25ª ed., CLDR (Intl.DisplayNames verificado en Node.js v24), Wikidata, GSMA Mobile Economy 2025.

---

## 1. Estado actual

26 idiomas implementados, cubriendo ~65% de usuarios de smartphone:

es, en, fr, de, it, pt-BR, pt-PT, ru, ja, ko, zh-Hans, zh-Hant, hi, th, vi, tr, pl, nl, sv, ro, uk, cs, hu, id, ms, nb

Los 26 están soportados en **ambas stores** (App Store + Google Play), aunque los códigos de locale difieren (ver § Mapeo de códigos).

---

## 2. Gaps identificados

### En ambas stores (App Store + Google Play) — 8 idiomas

Estos permiten metadata localizada en las dos tiendas. Son los candidatos más evidentes.

| Código | Idioma | Nombre nativo | Código iOS | Código Android |
|--------|--------|---------------|------------|----------------|
| ar | Árabe | العربية | ar | ar |
| ca | Catalán | Català | ca | ca |
| da | Danés | Dansk | da | da-DK |
| el | Griego | Ελληνικά | el | el-GR |
| fi | Finés | Suomi | fi | fi-FI |
| he | Hebreo | עברית | he | iw-IL |
| hr | Croata | Hrvatski | hr | hr |
| sk | Eslovaco | Slovenčina | sk | sk |

### Solo en Google Play — ~38 idiomas adicionales

Destacados: búlgaro (bg), serbio (sr), suajili (sw), lituano (lt), esloveno (sl), letón (lv), estonio (et), gallego (gl-ES), euskera (eu-ES), filipino (fil), bengalí (bn-BD), tamil (ta-IN), telugu (te-IN), maratí (mr-IN), persa (fa), afrikáans (af).

Lista completa en el informe del investigador.

### Variantes regionales reutilizables

Nuestras traducciones base se pueden mapear a variantes de los stores sin trabajo adicional:

| Variante | iOS | Android | Base nuestra |
|----------|-----|---------|-------------|
| Español (LatAm) | es-MX | es-419 | es |
| Français (Canada) | fr-CA | fr-CA | fr |
| English (UK) | en-GB | en-GB | en |
| English (Australia) | en-AU | en-AU | en |
| Chinese (Hong Kong) | — | zh-HK | zh-Hant |

**Recomendación**: Registrar estas variantes en ambas stores usando nuestras traducciones base. Coste cero, mejora descubrimiento.

---

## 3. Recomendación: añadir 6 idiomas (→ 32 total)

### Criterio de priorización

El spike anterior priorizó por volumen de hablantes. Este spike incorpora las correcciones de los refutadores:

- **Presencia en ambas stores** (metadata localizada = descubrimiento)
- **Script compatible** (Latin/Cyrillic/Greek — sin trabajo de layout)
- **CLDR verificado** (Intl.DisplayNames funciona al 100%)
- **Valor por usuario** (mercados nórdicos y europeos: alto revenue per capita, alta propensión a reseñar)
- **Isla lingüística** (sin fallback a otro idioma soportado)

### Tier A — Añadir antes del lanzamiento (6 idiomas)

Todos están en **ambas stores**, usan **scripts compatibles**, y tienen **CLDR completo**. Pipeline-ready.

| Código | Idioma | Hablantes | Stores | Justificación |
|--------|--------|-----------|--------|---------------|
| **el** | Griego | ~13.5M | Ambas | Más hablantes que cs (8M), hu (8M) o nb (4M) que ya tenemos. Script griego bien soportado |
| **ca** | Catalán | ~10M | Ambas | Identidad cultural fuerte, alta propensión a reseñar. Diferenciación: ausente en Babbel, Rosetta Stone, Busuu |
| **da** | Danés | ~6M | Ambas | Mercado nórdico de alto valor. Inconsistente excluirlo si nb (4M) está incluido |
| **fi** | Finés | ~5.5M | Ambas | Isla lingüística total (lengua urálica, ininteligible desde cualquier otro idioma soportado). Alto poder adquisitivo |
| **sk** | Eslovaco | ~5.5M | Ambas | Script latino, CLDR completo. Parcialmente inteligible con checo (que ya tenemos) pero suficientemente diferente |
| **hr** | Croata | ~6M | Ambas | Script latino, CLDR completo. Croacia + Bosnia (bosnio ≈ croata) |

**Total con estos 6**: 32 idiomas, cubriendo ~32/39 locales de App Store (~82%).

### Tier B — Evaluar post-lanzamiento

#### B1. Solo Google Play, Latin/Cyrillic (bajo esfuerzo)

| Código | Idioma | Hablantes | Nota |
|--------|--------|-----------|------|
| bg | Búlgaro | ~7M | Cyrillic (ya manejamos). Solo GP |
| sw | Suajili | ~100M+ | Lingua franca de África oriental. Latin. Solo GP. **Sleeper hit** |
| sr | Serbio | ~9M | Decisión pendiente: cirílico vs latino |
| lt | Lituano | ~3M | Alta penetración digital |
| sl | Esloveno | ~2.5M | |
| af | Afrikáans | ~16M | Muy cercano al neerlandés |
| gl | Gallego | ~2.4M | Relevante en contexto español |
| lv | Letón | ~1.5M | |
| et | Estonio | ~1.1M | |

#### B2. RTL — requiere proyecto técnico separado

| Código | Idioma | Hablantes | Nota |
|--------|--------|-----------|------|
| ar | Árabe | ~420M | **Mayor bloque no cubierto**. 26+ países. Prerrequisito: RTL layout |
| he | Hebreo | ~9M | Si implementamos RTL para árabe, viene "gratis". Nota: Google usa `iw-IL` (código legacy) |
| fa | Persa | ~110M | Tercer beneficiario de RTL |

**Prerrequisito técnico**: CSS logical properties, `dir="rtl"` dinámico, Canvas text direction en GlobeD3.tsx, mirroring de componentes. Spike técnico necesario para estimar esfuerzo (¿1-2 semanas o 1-2 meses?).

#### B3. Scripts índicos — requiere verificar fonts

| Código | Idioma | Hablantes | Script | Nota |
|--------|--------|-----------|--------|------|
| mr | Maratí | ~83M | Devanagari | **Mismo script que Hindi** — el más fácil |
| bn | Bengalí | ~270M | Bengali | 7° idioma más hablado del mundo |
| ta | Tamil | ~85M | Tamil | Wikipedia >150K artículos |
| te | Telugu | ~82M | Telugu | |
| kn | Canarés | ~44M | Kannada | |

Ninguno está en App Store — solo GP. Reconsiderar si Apple los añade.

### Descartados

| Idioma | Razón |
|--------|-------|
| Filipino (fil) | 96% idéntico a inglés en `Intl.DisplayNames`. Solo 9 de 200 nombres de países difieren. Usuarios usan "Taglish" |
| Urdu (ur) | RTL + script Nastaliq + no en App Store |
| Panyabí (pa) | No en ningún store de apps |
| Amárico (am) | Script Ge'ez + baja penetración smartphone |
| Otros 13 | Mercados muy pequeños o barreras técnicas altas (birmano, jemer, lao, georgiano, armenio, kazajo, kirguís, mongol, nepalí, cingalés, romanche, zulú, bielorruso) |

---

## 4. Mapeo de códigos: nuestros locales → stores

Hallazgo crítico del refutador: **19 de 26** de nuestros códigos no coinciden directamente con los de los stores. Necesitamos un mapeo explícito al publicar metadata.

| Nuestro código | Apple App Store | Google Play | ¿Coincide? |
|----------------|-----------------|-------------|------------|
| es | es-ES (+ es-MX) | es-ES (+ es-419, es-US) | Necesita mapeo |
| en | en-US (+ en-GB, en-AU, en-CA) | en-US (+ en-GB, en-AU, en-CA, en-IN) | Necesita mapeo |
| fr | fr-FR (+ fr-CA) | fr-FR (+ fr-CA) | Necesita mapeo |
| de | de-DE | de-DE | Necesita mapeo |
| it | it | it-IT | Difiere entre stores |
| pt-BR | pt-BR | pt-BR | ✅ |
| pt-PT | pt-PT | pt-PT | ✅ |
| ru | ru | ru-RU | Difiere entre stores |
| ja | ja | ja-JP | Difiere entre stores |
| ko | ko | ko-KR | Difiere entre stores |
| zh-Hans | zh-Hans | zh-CN | Difiere entre stores |
| zh-Hant | zh-Hant | zh-TW | Difiere entre stores |
| hi | hi | hi-IN | Difiere entre stores |
| th | th | th | ✅ |
| vi | vi | vi | ✅ |
| tr | tr | tr-TR | Difiere entre stores |
| pl | pl | pl-PL | Difiere entre stores |
| nl | nl-NL | nl-NL | Necesita mapeo (nuestro `nl` → `nl-NL`) |
| sv | sv | sv-SE | Difiere entre stores |
| ro | ro | ro | ✅ |
| uk | uk | uk | ✅ |
| cs | cs | cs-CZ | Difiere entre stores |
| hu | hu | hu-HU | Difiere entre stores |
| id | id | id | ✅ |
| ms | ms | ms (+ ms-MY) | ✅ (Google tiene doble entrada) |
| **nb** | **no** | **no-NO** | **❌ Nuestro código no existe en ningún store** |

**Acción requerida**: Crear tabla de mapeo en el script de publicación / fastlane config. Especialmente crítico para `nb` → `no`/`no-NO`.

---

## 5. Riesgos identificados

### Calidad de gentilicios

Los gentilicios son 100% manuales (~237 por idioma). Riesgo de calidad variable:

- **Alto riesgo**: Idiomas con morfología compleja (finés, húngaro, griego, checo) donde declinaciones/sufijos pueden ser erróneos
- **Mitigación**: Pilotar 20 gentilicios con Claude antes de añadir un idioma. Si calidad <90%, exigir revisión humana

### "CLDR completo" no garantiza calidad perfecta

`Intl.DisplayNames` se probó con 36 países de muestra, no con los 195. Posibles gaps en países pequeños o territorios. Verificar cobertura completa antes de lanzar cada idioma.

### Bosnio ≈ Croata

Lingüísticamente casi idénticos. Si añadimos croata (hr), no es claro si bosnio (bs) aporta valor o confusión. Recomendación: solo hr por ahora.

### Serbio: dos scripts

Serbio usa cirílico oficialmente pero latin popularmente. Decisión pendiente: ¿cuál usar? ¿Ambos?

---

## 6. Esfuerzo estimado

### Por idioma nuevo (pipeline existente)

| Componente | Automático (CLDR/Wikidata) | Manual (LLM + revisión) |
|------------|---------------------------|------------------------|
| Nombres de países (195) | ✅ CLDR | ~6 overrides |
| Monedas (~180) | ✅ CLDR | — |
| Nombres de idiomas (~120) | ✅ CLDR | — |
| Capitales (237) | Parcial (Wikidata) | Revisión |
| Gentilicios (237) | ❌ | LLM + revisión |
| Sea labels (~30) | ❌ | LLM + revisión |
| UI strings (~190) | ❌ | LLM + revisión |
| Wikipedia slugs (195) | ✅ API | Verificación |

**Total por idioma**: ~694 entradas manuales (la mayoría automatizables con LLM + revisión).
**6 idiomas del Tier A**: ~4.164 entradas manuales. Con pipeline LLM, el grueso es revisión.

### Variantes regionales

**Coste cero**: reusar traducciones base para es-MX/es-419, fr-CA, en-GB/en-AU.

---

## 7. Resumen ejecutivo

| Acción | Idiomas | Personas adicionales | Esfuerzo |
|--------|---------|---------------------|----------|
| **Tier A: añadir antes del lanzamiento** | el, ca, da, fi, sk, hr | ~47M | Pipeline + QA |
| Variantes regionales (coste cero) | es-419, fr-CA, en-GB, en-AU, zh-HK | Mejora descubrimiento | Solo metadata |
| Tier B1: post-lanzamiento (GP only) | bg, sw, sr, lt, sl, af, gl... | ~140M+ | Pipeline + QA |
| Tier B2: RTL (proyecto técnico) | ar, he, fa | ~540M | Spike técnico + RTL layout + pipeline |
| Tier B3: scripts índicos | mr, bn, ta, te, kn | ~560M+ | Verificar fonts + pipeline |

**Resultado**: De 26 → 32 idiomas, cubriendo 32/39 locales de App Store. Los 7 locales restantes de App Store son: ar, he + 5 variantes regionales que se cubren con traducciones base.

Con las variantes regionales registradas, la cobertura efectiva de App Store sería **~37/39** (solo quedan ar y he, que requieren RTL).
