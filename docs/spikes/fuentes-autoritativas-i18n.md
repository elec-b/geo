# Spike: Fuentes autoritativas para nombres geográficos (32 idiomas)

**Fecha**: 2026-03-27
**Contexto**: La app GeoExpert soporta 32 idiomas. Para español se validaron los datos contra la RAE/DPD (encontrando ~27 errores). Este spike identifica el equivalente a la RAE para cada uno de los 31 idiomas restantes, evaluando accesibilidad y cobertura para preparar el Spike 2 (verificación de datos).
**Método**: Agent team de 5 agentes (2 investigadores + 2 refutadores + líder sintetizador) con revisión cruzada.
**Fuentes**: WebSearch, documentación UNGEGN, portales gubernamentales, CLDR documentation.

---

## 1. Idiomas con autoridad de toponimia identificada y accesible

21 de los 32 idiomas tienen una autoridad que publica datos de exónimos consultables o descargables.

| Idioma | Autoridad | Tipo | Publicación / URL | Accesibilidad | Cobertura | Relación CLDR |
|--------|-----------|------|-------------------|---------------|-----------|---------------|
| **es** | RAE / DPD | Académica | Apéndice de topónimos del DPD | Web (rae.es) | Países, capitales, gentilicios | Indirecta |
| **fr** | CNT (Commission nationale de toponymie) / CNIG | Gubernamental | [PTVM feb. 2025 (PDF)](https://cnig.gouv.fr/IMG/pdf/liste_pays_territoires_et_villes_du_monde_fev_2025.pdf) | PDF descargable | Países, capitales, territorios, ciudades >3M hab., gentilicios | Indirecta (vetters) |
| **de** | StAGN + Auswärtiges Amt | Académica + Gubernamental | [stagn.de](https://stagn.de) (BD exónimos, CC) + *Verzeichnis der Staatennamen* (AA, 2024) | BD online (GeoPackage) + PDF | Países, gentilicios, adjetivos, capitales, ríos, montañas | Indirecta |
| **en** | BGN (USA) + PCGN (UK) | Gubernamental | [PCGN Country Names (CSV)](https://www.gov.uk/government/publications/country-names) + BGN GeoNames Server | CSV descargable + web | Países, capitales, nombres oficiales | Alta (vetters Google/Apple/MS) |
| **nl** | Taalunie — Commissie Aardrijkskundige Namen | Intergubernamental | [namen.taalunie.org](https://namen.taalunie.org/dutch-exonyms) | Web consultable | Países, capitales, gentilicios, adjetivos, accidentes geográficos | Indirecta |
| **nb** | Språkrådet (Consejo de la Lengua Noruega) | Gubernamental | [sprakradet.no — lista de estados](https://sprakradet.no/stedsnavn-og-navn-pa-statsorgan/navnelister-norsk-skrivemate/utanlandske-stadnamn-namn-pa-stater-og-sprak-transkripsjon/) | Web consultable | Países, idiomas, transcripción | Indirecta |
| **fi** | Kotus / Kotoistus | Gubernamental | [kaino.kotus.fi/maidennimet](https://kaino.kotus.fi/maidennimet/index.php?h=en) + kotoistus.fi | Web consultable | Países en 7 idiomas, capitales | **Directa** (Kotoistus contribuye a CLDR) |
| **ca** | IEC — Oficina d'Onomàstica | Académica | [nomenclator-mundial.iec.cat](https://nomenclator-mundial.iec.cat/) (8.500 topónimos) | Web consultable | Países, capitales, ciudades, ríos, montañas, islas | Indirecta |
| **ru** | Росстандарт — ОКСМ (Clasificador de países) | Gubernamental | classifikators.ru, base.garant.ru | Web consultable | Países (nombres cortos y oficiales) | Indirecta |
| **pl** | KSNG (Komisja Standaryzacji Nazw Geograficznych) | Gubernamental | [*Urzędowy wykaz nazw państw* VII ed. (2023), PDF en gov.pl](https://www.gov.pl) | PDF descargable | 195 países + 69 territorios, capitales | Indirecta |
| **cs** | ČÚZK — Názvoslovná komise | Gubernamental | Lista de exónimos checos; Toponymic Guidelines UNGEGN | Parcial (documentos UNGEGN) | Países, exónimos | Indirecta |
| **sk** | ÚGKK SR — Comisión de Nomenclatura | Gubernamental | Datos descargables (GPKG, SHP, CSV). 36.000+ nombres verificados | Descargable (múltiples formatos) | Países, topónimos | Indirecta |
| **hr** | DGU — Povjerenstvo za standardizaciju geografskih imena | Gubernamental | [rgi.dgu.hr](https://rgi.dgu.hr) + recomendaciones 2020 | Web consultable | Países, nombres geográficos extranjeros | Indirecta |
| **uk** | StateGeoCadastre (Державна служба геодезії) | Gubernamental | Registro Estatal (2018) + [GitHub gontsa/geonames-ua](https://github.com/gontsa/geonames-ua) | Descargable (GitHub) | Países, topónimos | Indirecta |
| **hu** | HCGN (Földrajzinév-bizottság) | Gubernamental | BD FNT (105.000 registros) + Toponymic Guidelines UNGEGN | Parcial | Países, exónimos | Indirecta |
| **ja** | MOFA (外務省) | Gubernamental | [mofa.go.jp/mofaj/area/](https://www.mofa.go.jp/mofaj/area/) | Web consultable | Países (relaciones diplomáticas) | Indirecta |
| **ko** | NIKL (국립국어원) — Reglas de transliteración | Gubernamental | Notificación gubernamental 85-11 (1986) | Normativa oficial | Países (transcripción oficial) | Indirecta |
| **zh-Hans** | Min. de Asuntos Civiles / Instituto de Nombres Geográficos | Gubernamental | Regulaciones 2024 + estándares nacionales de transcripción | Normativa oficial | Países, topónimos | Indirecta |
| **tr** | TDK (Türk Dil Kurumu) + HGM | Gubernamental + Académica | Yazım Kılavuzu (guía de escritura) | Web consultable | Países (grafías oficiales) | Indirecta |
| **id** | BIG + Badan Bahasa + KEMLU | Gubernamental | Documento de exónimos actualizado 2024 | Institucional | Países, exónimos (actualizado 2024) | Indirecta |
| **zh-Hant** | MOFA ROC (外交部) + MOE (教育部) | Gubernamental | [Tabla de nombres de países (PDF)](https://ws.mofa.gov.tw/) + [Diccionario Revisado de Mandarín](https://dict.revised.moe.edu.tw/) | PDF descargable + web | Países (nombre formal, abreviado, en inglés), por región | Indirecta (CLDR zh-Hant independiente) |
| **el** | HMGS (ΓΥΣ — Γεωγραφική Υπηρεσία Στρατού) | Gubernamental | Gazetteer Nacional (PDF + XLSX) + estándar ELOT 743 | Descargable | Topónimos, transliteración | Indirecta |

---

## 2. Idiomas sin autoridad específica de exónimos

10 de los 32 idiomas no tienen una autoridad que publique listas de nombres de países extranjeros accesibles online. Para estos, CLDR + Wikipedia es la mejor fuente práctica.

| Idioma | Situación | Mejor fuente práctica | Notas |
|--------|-----------|----------------------|-------|
| **it** | IGMI existe pero cubre solo toponimia doméstica. No publica lista de exónimos de países | CLDR + Treccani (enciclopedia) | Uno de los idiomas principales sin fuente de exónimos accesible |
| **pt-BR** | IBGE es autoridad geográfica pero su foco es toponimia doméstica. API existe pero sin lista dedicada de exónimos | CLDR + Atlas Geográfico Escolar IBGE | IBGE participa en DPLPNG (UNGEGN) |
| **pt-PT** | No existe comisión nacional de exónimos. Las "Comissões de Toponímia" son municipales | CLDR (locale pt-PT) + Ciberdúvidas da Língua Portuguesa | Gap más notable entre idiomas europeos |
| **sv** | Lantmäteriet cubre toponimia doméstica. Utrikes namnbok existe pero sin lista descargable | CLDR + Utrikes namnbok (government.se, referencia puntual) | Suecia prefiere endónimos; pocos exónimos |
| **da** | Stednavneudvalget cubre toponimia doméstica. Sin lista de exónimos de países | CLDR + Wikipedia danesa | Dinamarca tiene muy pocos exónimos vigentes (~10 ciudades) |
| **ro** | Academia Rumana tiene Comisión de Geonomía pero foco es ciencia, no estandarización de exónimos | CLDR + Wikipedia rumana | Sin presencia web clara de autoridad de exónimos |
| **hi** | Survey of India recoge topónimos en Devanagari pero no publica lista de exónimos de países | CLDR + Wikipedia hindi | No hay autoridad de exónimos para hindi |
| **th** | National Committee on Geographical Names existe (1992) pero sin lista descargable | CLDR + Wikipedia tailandesa | Autoridad existe pero acceso muy limitado |
| **vi** | DOSM creó proyecto GNIS (2005) pero sin lista de nombres de países descargable | CLDR + Wikipedia vietnamita | Sin comité nacional de nombres activo |
| **ms** | JUPEM + DBP son autoridades pero sin publicación de exónimos accesible confirmada | CLDR + Wikipedia malaya | Indonesia (2024) actualizó exónimos; Malasia no tiene equivalente |

---

## 3. Fuentes transversales (todos los idiomas)

| Fuente | Tipo | Cobertura | Acceso | Uso recomendado |
|--------|------|-----------|--------|-----------------|
| **CLDR** (Unicode Common Locale Data Repository) | Estándar internacional | Nombres de países, monedas, idiomas para ~100+ locales | Integrado en Node.js (`Intl.DisplayNames`) | Fuente primaria ya integrada en el pipeline. Busca el nombre "más consuetudinario", no necesariamente el oficial |
| **Wikidata** | Colaborativa | Labels de países, capitales, mares en ~400 idiomas | API SPARQL (query.wikidata.org) | Segunda fuente de verdad. Editable (riesgo de vandalismo menor) |
| **Wikipedia** | Colaborativa | Títulos de artículos = nombre preferido en cada idioma | Sitelinks via Wikidata | Tercera fuente. Útil para detectar divergencias CLDR vs. uso real |
| **UNGEGN** (UN Group of Experts on Geographical Names) | Intergubernamental | Directrices, informes nacionales, resoluciones | unstats.un.org | Meta-fuente: documenta qué autoridad tiene cada país. No es fuente directa de datos |

### Hallazgo clave sobre CLDR

**CLDR NO consulta sistemáticamente las autoridades nacionales.** Su proceso es:
- Datos aportados por voluntarios y empleados de Apple/Google/Microsoft/IBM via Survey Tool
- Criterio: "el nombre más consuetudinario en tu idioma", no necesariamente el oficial
- Las referencias recomendadas a los vetters son periódicos/revistas, NO autoridades de toponimia
- **Excepción**: Finlandés — Kotoistus alimenta directamente CLDR como organización contribuyente

**Implicación**: CLDR es una buena base pero puede diverger de las fuentes oficiales en ~3-5% de los casos (mismo ratio observado en español vs. RAE). La verificación del Spike 2 tiene valor real.

---

## 4. Recomendaciones para el Spike 2 (verificación de datos)

### Grupo A — Verificar contra fuente nacional (13 idiomas)
Idiomas con fuente online accesible y buena cobertura. Prioridad alta.

| Idioma | Fuente de verificación | Formato | Cubre |
|--------|----------------------|---------|-------|
| fr | CNT/PTVM (PDF) | Tabla de países/capitales/gentilicios | Países ✓ Capitales ✓ Gentilicios ✓ |
| de | StAGN BD + Auswärtiges Amt | BD online + PDF | Países ✓ Gentilicios ✓ Capitales (BD) |
| en | PCGN Country Names (CSV) | CSV/PDF | Países ✓ Capitales ✓ |
| nl | namen.taalunie.org | Web | Países ✓ Capitales ✓ Gentilicios ✓ |
| nb | Språkrådet lista | Web | Países ✓ |
| fi | Kotus maidennimet | Web | Países ✓ Capitales ✓ |
| ca | IEC Nomenclàtor mundial | Web | Países ✓ Capitales ✓ |
| pl | KSNG Urzędowy wykaz (PDF) | PDF | Países ✓ Capitales ✓ |
| ru | ОКСМ | Web | Países ✓ |
| sk | ÚGKK SR | Descargable (CSV) | Países ✓ |
| hr | DGU rgi.dgu.hr | Web | Países ✓ |
| uk | geonames-ua (GitHub) | Descargable | Países ✓ |
| ja | MOFA lista de países | Web | Países ✓ |
| zh-Hant | MOFA Taiwán (PDF) | PDF descargable | Países ✓ |

### Grupo B — Verificar contra CLDR + Wikipedia (19 idiomas)
Idiomas sin fuente nacional accesible, o con fuente que solo cubre países (no gentilicios/mares).

Método: comparar CLDR name vs. Wikipedia article title. Divergencias = candidatos a override.

it, pt-BR, pt-PT, sv, da, ro, zh-Hans, hi, th, vi, tr, ko, id, ms, el, cs, hu + los del Grupo A para **gentilicios y mares** (que ninguna fuente nacional cubre completamente excepto fr, de, nl).

### Prioridad por tipo de dato

| Dato | Método Grupo A | Método Grupo B | Prioridad |
|------|---------------|---------------|-----------|
| **Gentilicios** | Diccionarios (Larousse fr, Duden de, Taalunie nl) | Wikipedia + consistencia interna | **ALTA** (generados por Claude) |
| **Mares/océanos** | N/A (ninguna fuente los cubre) | Wikipedia article titles + Wikidata labels (Q-items) | **ALTA** (generados por Claude, verificables al 100%) |
| Nombres de países | Fuente nacional + overrides existentes | CLDR vs. Wikipedia | Media-baja (CLDR ya es robusto) |
| Capitales | Fuente nacional (donde cubra) | Wikidata vs. Wikipedia infobox | Media |

---

## 5. Implicaciones para mantenimiento futuro

### Fuentes automatizables

| Fuente | Automatizable? | Método | Frecuencia recomendada |
|--------|---------------|--------|----------------------|
| CLDR | ✓ Sí | Ya integrado (`Intl.DisplayNames`). Re-ejecutar tras actualizar Node.js | Semestral (CLDR release en abril y octubre) |
| Wikidata labels | ✓ Sí | SPARQL query existente (`fetch-capitals-i18n.ts`, `fetch-wikipedia-all.ts`) | Trimestral |
| Wikipedia titles | ✓ Sí | Comparar slugs existentes vs. Wikidata sitelinks actuales | Trimestral |
| PCGN (en) | ⚠ Parcial | CSV descargable, parseable | Anual |
| KSNG (pl) | ✗ No | PDF, requiere lectura manual | Bajo demanda |
| CNT (fr) | ✗ No | PDF, requiere lectura manual | Bajo demanda |

### Script propuesto: `npm run validate-i18n`

```
Para cada idioma L y país P:
  1. CLDR name vs. Wikipedia article title → FLAG si difieren
  2. Capital (Wikidata label) vs. nuestros datos → FLAG si difieren
  3. Sea labels vs. Wikidata labels (Q-items) → FLAG si difieren
  4. Gentilicio: patrón morfológico por familia lingüística (regex)
Output: informe de discrepancias (diff vs. run anterior)
```

Las fuentes no automatizables (CNT, KSNG, StAGN) se consultan manualmente solo cuando se detectan discrepancias o cuando publican nueva edición.

### Feedback loop post-lanzamiento

Botón "Reportar error" en la ficha de país → invaluable para idiomas sin fuente autoritativa (hi, th, vi, ms, etc.).

---

## 6. Decisiones pendientes

1. **¿Incluir gentilicios de fuentes nacionales como overrides?** Algunas fuentes (fr CNT, de StAGN, nl Taalunie) publican gentilicios oficiales. ¿Integramos estos al pipeline o solo los usamos como referencia de verificación?

2. **¿Script de cruce CLDR vs. Wikipedia?** Implementar antes del Spike 2 permitiría pre-filtrar las divergencias automáticamente, reduciendo el trabajo manual del agent team.

3. **¿Umbral de confianza por idioma?** Para idiomas Grupo A (fuente nacional), la corrección es clara. Para Grupo B (solo CLDR + Wikipedia), ¿aceptamos divergencias sin corrección si no hay fuente autoritativa que desempate?
