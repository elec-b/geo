# Fuentes de datos y CDN

> Referencia centralizada de todas las fuentes de datos de Exploris: origen, año de referencia, frecuencia de actualización y cobertura CDN.
>
> Última actualización: 2026-04-05

---

## Resumen

La app combina 6 fuentes principales con overrides manuales y validación por LLM. Los datos se dividen en dos categorías según su mecanismo de entrega:

- **Bundled + CDN**: Empaquetados en la app y actualizables silenciosamente vía CDN (GitHub Pages). Incluye todos los datos de países, capitales, traducciones, población, HDI, etc.
- **Solo bundled**: Empaquetados en la app, no actualizables vía CDN. Incluye geometrías (TopoJSON) y etiquetas de mares/océanos.

| Categoría | Fuente | Año de los datos | Generación | CDN |
|-----------|--------|:---:|:---:|:---:|
| **Población** | [World Bank API](https://data.worldbank.org/indicator/SP.POP.TOTL) (SP.POP.TOTL) | 2024 (estimación) | 2026-04-03 | Sí |
| **HDI / IHDI** | [UNDP HDR 2025](https://hdr.undp.org/data-center/human-development-index) (CSV) | 2023 | 2026-04-03 | Sí |
| **Superficie** | [REST Countries](https://restcountries.com/) (CIA World Factbook) | estático | jun 2024 | Sí |
| **Coordenadas capitales** | [REST Countries](https://restcountries.com/) + 8 overrides | estático | 2026-04-02 | Sí |
| **Capitales (nombres, 32 idiomas)** | [Wikidata SPARQL](https://query.wikidata.org/) (P36) | tiempo real | 2026-03-26 | Sí |
| **Países (nombres, 32 idiomas)** | [CLDR](https://cldr.unicode.org/) (`Intl.DisplayNames`) + overrides | según Node.js | 2026-03-26 | Sí |
| **Monedas** | [REST Countries](https://restcountries.com/) + [CLDR](https://cldr.unicode.org/) | estático | 2026-03-26 | Sí |
| **Idiomas oficiales** | [REST Countries](https://restcountries.com/) + [CLDR](https://cldr.unicode.org/) | estático | 2026-03-26 | Sí |
| **Gentilicios (32 idiomas)** | [Wikidata](https://www.wikidata.org/) + Claude (validación) | — | 2026-03-26 | Sí |
| **Wikipedia slugs (32 idiomas)** | [Wikidata SPARQL](https://query.wikidata.org/) (sitelinks) | tiempo real | 2026-03-26 | Sí |
| **Banderas** | [REST Countries](https://restcountries.com/) → [flagcdn](https://flagcdn.com/) (SVG) | — | jun 2024 | Sí |
| **Geometrías** (50m + islas 10m) | [Natural Earth](https://www.naturalearthdata.com/) 4.1.0 ([world-atlas](https://github.com/topojson/world-atlas) 2.0.2) | — | 2026-03-21 | **No** |
| **Mares/océanos** | Curación manual | — | 2026-03-18 | **No** |

---

## Datos actualizables vía CDN

Estos datos se empaquetan en la app y, si hay conexión, se actualizan silenciosamente en background. Los datos nuevos se aplican en el siguiente inicio de la app. Archivos CDN: `countries-base.json`, `capitals.json`, `i18n-all.json`.

### Población

| | |
|---|---|
| **Fuente** | [World Bank API](https://data.worldbank.org/indicator/SP.POP.TOTL) — indicador `SP.POP.TOTL` |
| **Tipo de dato** | Estimaciones a mitad de año (no censos) |
| **Año de los datos** | 2024 |
| **Última generación** | 2026-04-03 |
| **Frecuencia de actualización** | Anual (World Bank publica nuevas estimaciones cada año) |
| **Script** | `scripts/update-population.ts` |
| **Archivo generado** | `scripts/data/population.json` |
| **Cobertura** | 195 países ONU + territorios. Override manual: Vaticano (800 hab.) |
| **Notas** | El script busca automáticamente el año más reciente con datos disponibles (mínimo 190 países con valor). Migrado desde REST Countries en abril 2026 |

### IDH e IDH-D (Índice de Desarrollo Humano)

| | |
|---|---|
| **Fuente** | [UNDP Human Development Report 2025](https://hdr.undp.org/data-center/human-development-index) (CSV) |
| **Tipo de dato** | Índice compuesto (salud, educación, ingresos). IDH-D ajusta por desigualdad |
| **Año de los datos** | 2023 (el HDR 2025, publicado en mayo 2025, reporta datos del año 2023) |
| **Última generación** | 2026-04-03 |
| **Frecuencia de actualización** | Anual (cada edición del HDR recalcula retroactivamente toda la serie) |
| **Script** | `scripts/update-hdi.ts` |
| **Archivo generado** | `scripts/data/hdi.json` |
| **Cobertura** | 192 países del HDR + 4 overrides manuales (KP, TW, XK, MC) |
| **Notas** | Los valores no son comparables entre ediciones del HDR (UNDP recalcula la metodología). IDH-D no disponible para todos los países |

### Superficie

| | |
|---|---|
| **Fuente** | [REST Countries v3.1](https://restcountries.com/) (originalmente CIA World Factbook) |
| **Tipo de dato** | Superficie en km² |
| **Año de los datos** | Estático (no cambia significativamente) |
| **Última generación** | Junio 2024 (fecha de archivo de REST Countries) |
| **Frecuencia de actualización** | No requiere — cambios de superficie son excepcionales |
| **Notas** | REST Countries está archivada desde junio 2024. La API sigue online pero sin actualizaciones. No se necesita migración: la superficie de los países es esencialmente estática |

### Coordenadas de capitales

| | |
|---|---|
| **Fuente** | [REST Countries v3.1](https://restcountries.com/) (`capitalInfo.latlng`) + 8 overrides manuales |
| **Tipo de dato** | Latitud/longitud del punto de la capital |
| **Última generación** | 2026-04-02 |
| **Frecuencia de actualización** | No requiere — los cambios de capital son excepcionales |
| **Script** | `scripts/fetch-countries.ts` (con validación `geoContains` + tolerancia 20 km) |
| **Archivo generado** | `public/data/capitals.json` |
| **Overrides** | EH, GD, SN, KI, MO, WF, PN (coords incorrectas en REST Countries) |

### Nombres de capitales (32 idiomas)

| | |
|---|---|
| **Fuente** | [Wikidata SPARQL](https://query.wikidata.org/) (propiedad P36 + `rdfs:label`) |
| **Tipo de dato** | Nombre traducido de la capital en cada idioma |
| **Última generación** | 2026-03-26 |
| **Frecuencia de actualización** | Bajo demanda — los nombres de capitales raramente cambian |
| **Script** | `scripts/fetch-capitals-i18n.ts` |
| **Archivo generado** | `scripts/data/capitals-all.json` |
| **Cobertura** | 195 países × 32 idiomas |

### Nombres de países (32 idiomas)

| | |
|---|---|
| **Fuente** | [CLDR](https://cldr.unicode.org/) vía `Intl.DisplayNames` (Node.js runtime) + overrides manuales |
| **Tipo de dato** | Nombre común del país en cada idioma |
| **Última generación** | 2026-03-26 |
| **Frecuencia de actualización** | Bajo demanda — depende de la versión de CLDR del runtime Node.js |
| **Script** | `scripts/fetch-countries.ts` |
| **Overrides** | `scripts/data/country-name-overrides.json` (~100 correcciones en 10+ idiomas, verificadas contra RAE/DPD para español) |
| **Notas** | CLDR usa el nombre más consuetudinario, no necesariamente el oficial. Divergencias con autoridades nacionales de toponimia en ~3-5% de los casos |

### Monedas

| | |
|---|---|
| **Fuente** | [REST Countries v3.1](https://restcountries.com/) (códigos ISO 4217 + símbolo) + [CLDR](https://cldr.unicode.org/) (nombres traducidos) |
| **Tipo de dato** | Código, símbolo universal y nombre traducido |
| **Última generación** | 2026-03-26 |
| **Frecuencia de actualización** | No requiere — cambios de moneda son excepcionales |

### Idiomas oficiales

| | |
|---|---|
| **Fuente** | [REST Countries v3.1](https://restcountries.com/) (códigos ISO 639) + [CLDR](https://cldr.unicode.org/) (nombres traducidos) |
| **Tipo de dato** | Idiomas oficiales a nivel nacional, traducidos a cada idioma de la app |
| **Última generación** | 2026-03-26 |
| **Frecuencia de actualización** | No requiere — cambios poco frecuentes |
| **Criterio** | Solo idiomas oficiales a nivel nacional/constitucional (sin cooficiales regionales) |

### Gentilicios (32 idiomas)

| | |
|---|---|
| **Fuente** | [Wikidata](https://www.wikidata.org/) + generación y validación por Claude |
| **Última generación** | 2026-03-26 |
| **Archivo** | `scripts/data/demonyms-all.json` |
| **Cobertura** | 195 países × 32 idiomas |

### Wikipedia slugs (32 idiomas)

| | |
|---|---|
| **Fuente** | [Wikidata SPARQL](https://query.wikidata.org/) (sitelinks) |
| **Tipo de dato** | Slug del artículo de Wikipedia para cada país en cada idioma |
| **Última generación** | 2026-03-26 |
| **Script** | `scripts/fetch-wikipedia-all.ts` |
| **Archivo generado** | `scripts/data/wikipedia-all.json` |
| **Cobertura** | 195 países × 23 Wikipedias únicas → 32 locales de la app |

### Banderas

| | |
|---|---|
| **Fuente** | [REST Countries v3.1](https://restcountries.com/) → [flagcdn](https://flagcdn.com/) (URL SVG remota) |
| **Tipo de dato** | URL al archivo SVG de la bandera |
| **Notas** | Las URLs apuntan a flagcdn.com, un servicio externo. No se almacenan localmente |

---

## Datos solo bundled (no CDN)

Estos datos se empaquetan en la app y solo se actualizan con nuevas versiones de la app. Son demasiado pesados o demasiado estáticos para justificar actualización CDN.

### Geometrías (mapas)

| | |
|---|---|
| **Fuente** | [Natural Earth Data](https://www.naturalearthdata.com/) vía [`world-atlas`](https://github.com/topojson/world-atlas) v2.0.2 (NPM) |
| **Versión Natural Earth** | 4.1.0 |
| **Resolución base** | 1:50m (TopoJSON, ~756 KB) |
| **Override islas** | 1:10m para 10 países insulares (~175 KB gzip) |
| **Última generación** | 2026-03-21 |
| **Frecuencia de actualización** | Muy rara — las fronteras cambian excepcionalmente |
| **Motivo de exclusión CDN** | Tamaño excesivo para descarga silenciosa en móvil |
| **Script override** | `scripts/generate-island-overrides.ts` |

### Etiquetas de mares y océanos

| | |
|---|---|
| **Fuente** | Curación manual |
| **Archivo** | `public/data/sea-labels.json` |
| **Contenido** | 5 océanos + 16 mares principales (id, nombre, coordenadas, escala) |
| **Última generación** | 2026-03-18 |
| **Frecuencia de actualización** | Nunca — datos geográficos estáticos |
| **Motivo de exclusión CDN** | Datos estáticos, no cambian |

---

## Infraestructura CDN

| | |
|---|---|
| **Hosting** | GitHub Pages — repo `elec-b/exploris-data` |
| **URL** | `https://elec-b.github.io/exploris-data/` |
| **Archivos servidos** | `manifest.json`, `countries-base.json`, `capitals.json`, `i18n-all.json` |
| **Tamaño total** | ~2 MB raw (~600 KB gzipped) |
| **Versionado** | Entero incremental en `manifest.json` (versión bundled en `public/data/data-version.json`) |
| **Lógica de actualización** | Descarga si `versión CDN > max(versión bundled, versión descargada)` |
| **Resiliencia** | Todos los errores silenciados. Timeouts: 5s manifest, 15s datos. App siempre funciona offline |
| **Código** | `src/data/cdnUpdate.ts` (servicio), `src/data/countryData.ts` (carga), `src/App.tsx` (check background) |

### Pipeline de actualización

```
1. Actualizar fuentes:        npm run update-data
2. Regenerar datos países:    npm run fetch-data
3. Bump versión:              editar public/data/data-version.json
4. Generar archivos CDN:      npm run generate-cdn
5. Subir al hosting:          cd cdn-output && git add . && git commit && git push
```

---

## Resumen de fuentes

| Fuente | Estado | Datos que aporta |
|--------|--------|------------------|
| **World Bank API** | Activa | Población |
| **UNDP HDR** | Activa (anual) | HDI, IDH-D |
| **Wikidata SPARQL** | Activa (tiempo real) | Capitales (nombres), Wikipedia slugs, gentilicios |
| **CLDR** (`Intl.DisplayNames`) | Activa (según Node.js) | Nombres de países, monedas, idiomas |
| **REST Countries v3.1** | Archivada (jun 2024) | Superficie, banderas, coordenadas capitales, estructura monedas/idiomas |
| **Natural Earth** (world-atlas) | Activa | Geometrías de países |
| **Claude** (LLM) | Validación | Gentilicios, verificación ortográfica, QA multi-idioma |
