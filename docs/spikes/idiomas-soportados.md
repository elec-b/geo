# Spike: Idiomas soportados por la app

**Fecha**: 2026-03-26
**Contexto**: Determinar la lista concreta de idiomas para el lanzamiento, cruzando cobertura de fuentes de datos con alcance potencial de personas.
**Método**: Agent team de 4 agentes (investigador de fuentes + refutador, analista de mercado + refutador) con revisión cruzada.
**Fuentes**: CLDR (unicode-org/cldr-json), REST Countries v3.1, Wikidata, W3Techs, GSMA Mobile Economy 2025, AppTweak, Statista, Apple Developer (locales del App Store).

---

## 1. Hallazgos clave

### Fuentes de datos

- **CLDR** es la fuente primaria (el código ya usa `Intl.DisplayNames`). Tiene ~95 idiomas con cobertura "modern" completa (territorios, monedas, idiomas).
- **REST Countries** solo se usa para datos agnósticos al idioma (población, superficie, banderas, coordenadas). Sus 26 traducciones **no limitan** los idiomas soportables.
- **Wikidata** es útil como validación cruzada para capitales, con cobertura >95% en los ~20 idiomas principales.
- **Cuello de botella real**: curación manual por idioma (~694 traducciones manuales: 237 capitales + 237 gentilicios + ~120 nombres de idiomas + ~30 sea labels + ~190 UI strings). Gran parte automatizable con LLM + revisión.

### Alcance potencial

Estimaciones de usuarios de smartphone por idioma de dispositivo (base: ~5.650M smartphones globales, GSMA 2025). "Idioma de dispositivo" es más relevante que "hablantes nativos" — muchos usuarios configuran su teléfono en un idioma distinto a su lengua materna (ej. ~45% de usuarios urbanos en India usan inglés).

| # | Idioma | Usuarios smartphone (est.) | % acumulado |
|---|--------|---------------------------|-------------|
| 1 | Inglés | ~1.020M | 18% |
| 2 | Chino simplificado | ~1.000M | 36% |
| 3 | Español | ~270M | 41% |
| 4 | Hindi | ~200M (rango: 150-250M) | 44% |
| 5 | Árabe | ~195M | 48% |
| 6 | Indonesio | ~175M | 51% |
| 7 | Portugués | ~160M | 54% |
| 8 | Francés | ~140M | 56% |
| 9 | Ruso | ~125M | 58% |
| 10 | Japonés | ~97M | 60% |
| 11 | Bengalí | ~100-115M | 62% |
| 12 | Alemán | ~82M | 63% |
| 13 | Turco | ~62M | 64% |
| 14 | Tailandés | ~55M | 65% |
| 15 | Coreano | ~52M | 66% |
| 16 | Vietnamita | ~52M | 67% |
| 17 | Persa | ~50M | 68% |
| 18 | Italiano | ~46M | 69% |
| 19 | Telugu | ~45M | 69% |
| 20 | Tamil | ~45M | 70% |

**Curva acumulada**: ~6 idiomas = 50%, ~10 = 60%, ~20 = 70%. La cola larga (~30% restante) se reparte entre 180+ idiomas.

### Restricciones técnicas

- **App Store soporta 40 locales** — techo práctico para metadata y descubrimiento.
- **RTL (árabe, hebreo, urdu, persa)** requiere trabajo de layout significativo: CSS logical properties, Canvas text direction en GlobeD3.tsx, mirroring de componentes. No es solo traducción — es una feature de infraestructura.
- **Variantes que requieren decisión**: zh-Hans vs zh-Hant (mercados y scripts distintos), pt-BR vs pt-PT (diferencias menores), sr vs sr-Latn (2 scripts).

---

## 2. Lista recomendada: 3 tiers

**Criterio de priorización**: Maximizar el número de personas que pueden usar la app en su idioma, limitado por viabilidad técnica (cobertura CLDR, presencia en App Store, complejidad de implementación).

### Tier 1 — Lanzamiento (16 idiomas → ~3.700M personas)

Idiomas con mayor alcance de personas, cobertura CLDR completa, presentes en el App Store, y sin necesidad de RTL.

| # | Idioma | ISO | Personas alcanzadas (est.) | Regiones principales |
|---|--------|-----|---------------------------|---------------------|
| 1 | Inglés | en | ~1.020M | Global (USA, UK, India parcial, Australia, Nigeria, Filipinas) |
| 2 | Chino simplificado | zh-Hans | ~1.000M | China continental, Singapur |
| 3 | Español | es | ~270M | México, España, LatAm, USA hispano. Ya implementado |
| 4 | Hindi | hi | ~200M | India (~30% de dispositivos). CLDR modern, en App Store |
| 5 | Indonesio | id | ~175M | Indonesia |
| 6 | Portugués (BR) | pt-BR | ~160M | Brasil |
| 7 | Francés | fr | ~140M | Francia, África francófona, Canadá, Bélgica, Suiza |
| 8 | Ruso | ru | ~125M | Rusia, Bielorrusia, Kazajistán |
| 9 | Japonés | ja | ~97M | Japón |
| 10 | Alemán | de | ~82M | Alemania, Austria, Suiza |
| 11 | Turco | tr | ~62M | Turquía |
| 12 | Tailandés | th | ~55M | Tailandia |
| 13 | Coreano | ko | ~52M | Corea del Sur |
| 14 | Vietnamita | vi | ~52M | Vietnam |
| 15 | Italiano | it | ~46M | Italia |
| 16 | Polaco | pl | ~30M | Polonia |

**Cobertura estimada**: ~3.700M personas (~65% de usuarios de smartphone).

**Notas**:
- **Hindi** sube a tier 1 frente a la versión anterior (enfocada en revenue). Aunque muchos indios usan inglés en dispositivo, ~200M personas sí lo configuran en hindi. Es una población enorme que merece acceso en su idioma.
- **zh-Hans**: China tiene barreras para distribución (ICP license en App Store chino). La localización sigue siendo útil para Singapur, diáspora, y eventual entrada a China.

### Tier 2 — Expansión cercana (10 idiomas → +~250M personas)

Idiomas con alcance moderado o que requieren decisiones adicionales.

| # | Idioma | ISO | Personas (est.) | Notas |
|---|--------|-----|-----------------|-------|
| 17 | Chino tradicional | zh-Hant | ~25M | Taiwán, Hong Kong. Localización separada de zh-Hans |
| 18 | Holandés | nl | ~18M | Países Bajos, Bélgica flamenca |
| 19 | Malayo | ms | ~18M | Malasia |
| 20 | Sueco | sv | ~5M | Suecia. Poca población, alta penetración |
| 21 | Rumano | ro | ~12M | Rumanía. CLDR completo |
| 22 | Ucraniano | uk | ~20M | CLDR modern, en App Store |
| 23 | Checo | cs | ~8M | CLDR completo |
| 24 | Húngaro | hu | ~8M | CLDR completo |
| 25 | Portugués (PT) | pt-PT | ~8M | Si se decide separar de pt-BR |
| 26 | Noruego bokmål | nb | ~4M | CLDR modern, en App Store |

### Tier 3 — Requiere infraestructura RTL (+~320M personas)

Idiomas con alcance muy significativo pero que necesitan trabajo de layout previo.

| # | Idioma | ISO | Personas (est.) | Notas |
|---|--------|-----|-----------------|-------|
| 27 | Árabe | ar | ~195M | Egipto, Arabia Saudí, Irak, Marruecos, Argelia. Requiere RTL |
| 28 | Persa | fa | ~50M | Irán. Requiere RTL |
| 29 | Urdu | ur | ~50M | Pakistán (~35% de dispositivos). Requiere RTL |
| 30 | Hebreo | he | ~7M | Israel. Requiere RTL |

**Prerrequisito**: Migrar CSS a logical properties, implementar `dir="rtl"` dinámico, adaptar renderizado de texto en Canvas (GlobeD3.tsx).

**Nota**: Árabe solo ocupa ~195M personas, más que japonés, alemán o turco. El único motivo de estar en tier 3 es la barrera técnica de RTL, no falta de importancia. Una vez implementada la infraestructura RTL, estos idiomas deberían priorizarse por alcance.

### Idiomas considerados pero no incluidos

| Idioma | Personas (est.) | Razón de exclusión |
|--------|-----------------|-------------------|
| Bengalí (bn) | ~100-115M | **No está en los 40 locales del App Store**. Sin metadata localizada, la app no es descubrible. Reconsiderar si Apple lo añade |
| Telugu (te) | ~45M | No está en el App Store |
| Tamil (ta) | ~45M | No está en el App Store |
| Maratí (mr) | ~40M | No está en el App Store |
| Serbio (sr) | ~8M | 2 scripts (cirílico/latino) para población reducida |
| Finés (fi), Estonio (et), Eslovaco (sk), Croata (hr), Danés (da) | 1-5M c/u | Poblaciones pequeñas. Considerar post-lanzamiento según demanda |

---

## 3. Esfuerzo estimado por idioma

| Componente | Entradas | Automatizable | Manual |
|------------|----------|---------------|--------|
| Nombres de países (195) | 195 | Sí (CLDR) | ~6 overrides/idioma |
| Nombres de monedas | ~180 | Sí (CLDR / `Intl.NumberFormat`) | — |
| Nombres de idiomas | ~120 | Sí (CLDR) | — |
| Capitales | 237 | Parcial (Wikidata seed) | Revisión + correcciones |
| Gentilicios | 237 | No | 100% manual |
| Sea labels | ~30 | No | 100% manual |
| UI strings (i18next) | ~190 | No | 100% manual (o LLM + revisión) |
| Wikipedia slugs | 195 | Sí (API Wikipedia) | Verificación |
| **Total por idioma** | **~1.384** | **~690 auto** | **~694 manual** |

**Estrategia de reducción de esfuerzo manual**:
- Gentilicios: seedear con LLM (Claude) + revisión humana para es/en, validación LLM para el resto.
- Sea labels: ~30 entradas — traducción directa con LLM + revisión.
- UI strings: ~190 strings — traducción con LLM + revisión por idioma.
- Capitales: Wikidata SPARQL seed + revisión.

**Esfuerzo total estimado para tier 1 (16 idiomas)**: ~11.100 traducciones manuales. Con estrategia LLM, el grueso del trabajo es revisión, no redacción.

---

## 4. Decisiones pendientes

1. **¿pt-BR y pt-PT separados o unificados?** Diferencias en nombres de países son mínimas (ej. "Irã" vs "Irão"). Recomendación: lanzar con pt-BR, añadir pt-PT en tier 2 si hay demanda.
2. **¿Cuándo implementar RTL?** RTL desbloquea ~320M personas (principalmente árabe). Recomendación: planificar como siguiente paso tras tier 1.
3. **¿Automatizar traducciones con LLM?** Para gentilicios, sea labels y UI strings, Claude puede generar borradores. El desarrollador valida es/en; para el resto, Claude valida (alineado con BACKLOG.md tarea f).
4. **¿zh-Hans viable sin ICP license?** China continental requiere ICP license. Sin ella, zh-Hans alcanza ~30M (Singapur + diáspora). zh-Hant (Taiwán/HK, ~25M) no tiene barreras. Evaluar cuál priorizar.
5. **¿Noruego (nb) y danés (da) en tier 2?** CLDR modern, en App Store, pero poblaciones pequeñas (~4-6M). Bajo esfuerzo marginal si el pipeline ya funciona.
6. **¿Bengalí a futuro?** ~100-115M personas sin acceso a la app en su idioma por no estar en el App Store. Si Apple lo añade, debería ser prioridad alta.

---

## 5. Limitaciones del análisis

- **Datos de usuarios de internet por idioma** basados en Internet World Stats 2020, proyectados a 2025-2026. La penetración en India, África y sudeste asiático ha cambiado significativamente.
- **"Idioma de dispositivo" es una estimación**, no un dato medido. No existe fuente pública definitiva. Las cifras cruzan múltiples fuentes con metodologías distintas.
- **Hindi es la cifra más incierta** del análisis (rango real: 150-250M). La proporción hindi/inglés en dispositivos indios está en transición rápida.
- **Estimaciones de Wikidata** son inferencias, no verificadas con SPARQL queries reales.
