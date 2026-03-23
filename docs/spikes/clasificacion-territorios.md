# Spike: Clasificación de territorios no-ONU

> Fecha: 2026-03-18
> Estado: **Propuesta** — pendiente de revisión

---

## 1. Problema

Actualmente, los 37 territorios no-ONU reciben un único disclaimer genérico en la ficha de país: **"Territorio no reconocido por la ONU"**. Esto es:

- **Impreciso**: Groenlandia no es un "territorio no reconocido" — es un territorio autónomo de Dinamarca. Llamarlo "no reconocido" sugiere que busca independencia o reconocimiento, cuando su relación con Dinamarca es estable y clara.
- **Uniforme para realidades muy distintas**: Puerto Rico (territorio de EE.UU.) y Taiwán (estado de facto con soberanía disputada) reciben la misma etiqueta, cuando su situación es radicalmente diferente.
- **Poco informativo**: El usuario no aprende nada sobre la relación política del territorio. "Territorio de Dinamarca" es mucho más útil que "no reconocido por la ONU".

---

## 2. Categorías propuestas

**Dos categorías bastan.** La diferencia fundamental entre los 37 territorios es binaria: ¿tiene un país soberano claro o no?

### Categoría A: Territorio dependiente (34 territorios)

- **Etiqueta en la ficha**: `"Territorio de [País soberano]"`
- **Ejemplos**: "Territorio de Dinamarca" (Groenlandia), "Territorio del Reino Unido" (Bermudas), "Territorio de China" (Hong Kong)
- **Incluye**: territorios de ultramar, regiones autónomas, regiones administrativas especiales (HK, MO), estados en libre asociación (Islas Cook, Niue), dependencias de la Corona, colectividades francesas de ultramar, territorios estadounidenses no incorporados.
- **Justificación de agrupar bajo una sola etiqueta**: Las distinciones internas (colectividad *sui generis* vs. territorio de ultramar, libre asociación vs. dependencia) son matices de derecho constitucional comparado que no aportan valor al usuario de una app de geografía. Lo relevante es *a qué país pertenece*. Quienes quieran más detalle pueden acceder a Wikipedia desde la ficha.

### Categoría B: Soberanía en disputa (3 territorios)

- **Etiqueta en la ficha**: `"Soberanía en disputa"`
- **Territorios**: Taiwán (TW), Kosovo (XK), Sáhara Occidental (EH)
- **Justificación**: En estos tres casos no hay un país soberano universalmente aceptado. Taiwán se autogobierna pero la RPC reclama su soberanía; Kosovo declaró independencia pero Serbia no lo reconoce; el Sáhara Occidental está controlado mayoritariamente por Marruecos pero la RASD reclama soberanía. La etiqueta "Soberanía en disputa" es neutral, precisa y evita tomar partido.

### ¿Por qué no 3+ categorías?

Se evaluó separar subcategorías (regiones administrativas especiales, estados en libre asociación, dependencias de la Corona, etc.). Se descartó porque:

1. **Complejidad sin beneficio**: Añadir 5–7 etiquetas distintas obliga al usuario a entender nomenclatura jurídica. "Territorio de Nueva Zelanda" es más claro que "Estado en libre asociación con Nueva Zelanda".
2. **Más campos en el modelo**: Cada subcategoría necesitaría un campo `territoryType` o similar, con lógica de renderizado para cada valor.
3. **Mantenimiento**: Un solo campo `sovereignCountry` cubre 34 de 37 territorios; los 3 restantes se detectan por ausencia.

---

## 3. Modelo de datos

### Campo nuevo: `sovereignCountry`

| Propiedad | Detalle |
|-----------|---------|
| **Nombre** | `sovereignCountry` |
| **Tipo** | `string \| undefined` |
| **Valor** | Código `cca2` del país soberano (ej: `"DK"` para Dinamarca) |
| **Cuándo presente** | Solo en territorios no-ONU con soberano claro (categoría A) |
| **Cuándo ausente** | Países ONU, Antártida, y territorios con soberanía en disputa (categoría B) |

### Cambios en `src/data/types.ts`

Añadir al interface `CountryData`:

```ts
/** cca2 del país soberano, para territorios dependientes no-ONU */
sovereignCountry?: string;
```

### Cambios en `src/data/isoMapping.ts`

Añadir campo `sovereignCca2` al interface `NonUnTerritory`:

```ts
interface NonUnTerritory {
  cca2: string;
  continent: Continent;
  sovereignCca2?: string;  // Nuevo: cca2 del país soberano
}
```

Actualizar cada entrada de `NON_UN_TERRITORIES_BY_ID` y `NON_UN_TERRITORIES_BY_NAME` con el soberano correspondiente. Los 3 territorios disputados (TW, XK, EH) no llevan `sovereignCca2`.

### Cambios en `scripts/fetch-countries.ts`

En `toCountryEntry()`, leer el `sovereignCca2` desde el mapeo de isoMapping:

```ts
// Buscar soberano para territorios no-ONU
const allNonUn = {
  ...Object.fromEntries(
    Object.values(NON_UN_TERRITORIES_BY_ID).map(t => [t.cca2, t])
  ),
  ...Object.fromEntries(
    Object.values(NON_UN_TERRITORIES_BY_NAME).map(t => [t.cca2, t])
  ),
};
const sovereignCountry = allNonUn[c.cca2]?.sovereignCca2;
```

Incluir en la salida solo si existe:

```ts
return {
  ...restOfFields,
  unMember: isUN,
  ...(sovereignCountry ? { sovereignCountry } : {}),
};
```

### Ejemplo en `countries.json`

```json
{
  "cca2": "GL",
  "name": "Groenlandia",
  "capital": "Nuuk",
  "continent": "América",
  "unMember": false,
  "sovereignCountry": "DK",
  ...
}
```

```json
{
  "cca2": "TW",
  "name": "Taiwán",
  "capital": "Taipéi",
  "continent": "Asia",
  "unMember": false,
  ...
}
```

(Taiwán no tiene `sovereignCountry` → la UI muestra "Soberanía en disputa".)

---

## 4. Cambios en UI

### 4.1 Ficha de país (`CountryCard.tsx`)

Reemplazar el disclaimer genérico actual:

```tsx
// ANTES
!country.unMember ? (
  <div className="country-card__disclaimer">
    Territorio no reconocido por la ONU
  </div>
)
```

Por lógica contextual:

```tsx
// DESPUÉS
!country.unMember ? (
  <div className="country-card__disclaimer">
    {country.sovereignCountry
      ? `Territorio de ${getSovereignName(country.sovereignCountry)}`
      : 'Soberanía en disputa'}
  </div>
)
```

Donde `getSovereignName(cca2)` busca el nombre en español del país soberano en el array de países cargado. Implementación sugerida: recibir como prop un mapa `cca2 → name` o bien una función de lookup, para evitar acoplar CountryCard a la carga de datos.

### 4.2 Color de relleno en el globo

**No cambiar.** El relleno del polígono es `#3a3a4a` para todos los países (ONU y no-ONU). Mantenerlo uniforme por estas razones:

1. **La diferenciación ya existe**: Las etiquetas y pines en ámbar (vs. cian) ya distinguen claramente los territorios no-ONU.
2. **Dos categorías con tres colores de relleno** (ONU, dependiente, disputado) añadirían ruido visual sin beneficio proporcional — solo 3 territorios serían "disputados".
3. **Simplicidad**: Un solo color de relleno mantiene el globo limpio y el foco en las etiquetas.

### 4.3 Otros cambios visuales

**Ninguno adicional.** La paleta ámbar para pines/etiquetas no-ONU y cian para ONU se mantiene. La clasificación en 2 categorías solo afecta al texto del disclaimer, no al tratamiento visual en el globo.

---

## 5. Cambios en DESIGN.md

Texto exacto que reemplaza la sección actual «Territorios no reconocidos por la ONU»:

---

> ### Territorios no miembros de la ONU
> Además de los 195 países ONU, los datos geográficos (Natural Earth 1:50m) incluyen ~37 territorios que no son miembros ni observadores de la ONU. Se clasifican en dos categorías:
>
> | Categoría | Etiqueta en ficha | Ejemplo | Cant. |
> |-----------|-------------------|---------|-------|
> | **Territorio dependiente** | "Territorio de [País]" | Groenlandia → "Territorio de Dinamarca" | 34 |
> | **Soberanía en disputa** | "Soberanía en disputa" | Taiwán, Kosovo, Sáhara Occidental | 3 |
>
> Comportamiento:
> *   **Son seleccionables** en la experiencia Explorar: al tocar, se muestra la ficha con un disclaimer contextual según su categoría.
> *   Se muestran todos los datos disponibles (bandera, capital, población, superficie, moneda, gentilicio).
> *   **No participan en el sistema de juego** (niveles, sellos, pruebas) — solo son visibles en Explorar.
> *   **Color diferenciado (ámbar)**: En el globo, tanto las etiquetas (nombre de país y capital) como los pines de capitales de estos territorios se muestran en color ámbar, distinto al cian de los países ONU, para distinguirlos visualmente.
> *   **Visibilidad en la tabla**: ver § «Explorar > Tabla > Toggle territorios no-ONU».
> *   **Continente asignado**: Cada territorio tiene un continente asignado para que los filtros funcionen correctamente.
> *   **Datos**: El script `fetch-countries.ts` incluye estos territorios con `unMember: false` y, para los dependientes, `sovereignCountry` con el `cca2` del país soberano.

---

## 6. Tabla de asignación

| # | Código | Nombre | Soberano | Categoría | Etiqueta resultante |
|---|--------|--------|----------|-----------|---------------------|
| 1 | AI | Anguila | GB | Dependiente | Territorio del Reino Unido |
| 2 | AS | Samoa Americana | US | Dependiente | Territorio de Estados Unidos |
| 3 | AW | Aruba | NL | Dependiente | Territorio de Países Bajos |
| 4 | AX | Ålandia | FI | Dependiente | Territorio de Finlandia |
| 5 | BL | San Bartolomé | FR | Dependiente | Territorio de Francia |
| 6 | BM | Bermudas | GB | Dependiente | Territorio del Reino Unido |
| 7 | CK | Islas Cook | NZ | Dependiente | Territorio de Nueva Zelanda |
| 8 | CW | Curazao | NL | Dependiente | Territorio de Países Bajos |
| 9 | EH | Sáhara Occidental | — | Disputa | Soberanía en disputa |
| 10 | FK | Islas Malvinas | GB | Dependiente | Territorio del Reino Unido |
| 11 | FO | Islas Feroe | DK | Dependiente | Territorio de Dinamarca |
| 12 | GG | Guernsey | GB | Dependiente | Territorio del Reino Unido |
| 13 | GL | Groenlandia | DK | Dependiente | Territorio de Dinamarca |
| 14 | GU | Guam | US | Dependiente | Territorio de Estados Unidos |
| 15 | HK | Hong Kong | CN | Dependiente | Territorio de China |
| 16 | IM | Isla de Man | GB | Dependiente | Territorio del Reino Unido |
| 17 | JE | Jersey | GB | Dependiente | Territorio del Reino Unido |
| 18 | KY | Islas Caimán | GB | Dependiente | Territorio del Reino Unido |
| 19 | MF | Saint Martin | FR | Dependiente | Territorio de Francia |
| 20 | MO | Macao | CN | Dependiente | Territorio de China |
| 21 | MP | Islas Marianas del Norte | US | Dependiente | Territorio de Estados Unidos |
| 22 | MS | Montserrat | GB | Dependiente | Territorio del Reino Unido |
| 23 | NC | Nueva Caledonia | FR | Dependiente | Territorio de Francia |
| 24 | NF | Isla Norfolk | AU | Dependiente | Territorio de Australia |
| 25 | NU | Niue | NZ | Dependiente | Territorio de Nueva Zelanda |
| 26 | PF | Polinesia Francesa | FR | Dependiente | Territorio de Francia |
| 27 | PM | San Pedro y Miquelón | FR | Dependiente | Territorio de Francia |
| 28 | PN | Islas Pitcairn | GB | Dependiente | Territorio del Reino Unido |
| 29 | PR | Puerto Rico | US | Dependiente | Territorio de Estados Unidos |
| 30 | SH | Santa Elena, Ascensión y Tristán de Acuña | GB | Dependiente | Territorio del Reino Unido |
| 31 | SX | Sint Maarten | NL | Dependiente | Territorio de Países Bajos |
| 32 | TC | Islas Turks y Caicos | GB | Dependiente | Territorio del Reino Unido |
| 33 | TW | Taiwán | — | Disputa | Soberanía en disputa |
| 34 | VG | Islas Vírgenes Británicas | GB | Dependiente | Territorio del Reino Unido |
| 35 | VI | Islas Vírgenes de EE.UU. | US | Dependiente | Territorio de Estados Unidos |
| 36 | WF | Wallis y Futuna | FR | Dependiente | Territorio de Francia |
| 37 | XK | Kosovo | — | Disputa | Soberanía en disputa |

### Resumen por soberano

| País soberano | Código | Territorios |
|---------------|--------|-------------|
| Reino Unido | GB | AI, BM, FK, GG, IM, JE, KY, MS, PN, SH, TC, VG (12) |
| Francia | FR | BL, MF, NC, PF, PM, WF (6) |
| Estados Unidos | US | AS, GU, MP, PR, VI (5) |
| Países Bajos | NL | AW, CW, SX (3) |
| Dinamarca | DK | FO, GL (2) |
| China | CN | HK, MO (2) |
| Nueva Zelanda | NZ | CK, NU (2) |
| Finlandia | FI | AX (1) |
| Australia | AU | NF (1) |
| *Sin soberano* | — | EH, TW, XK (3) |
| | | **Total: 37** |

---

## Revisión del refutador

> Fecha: 2026-03-18
> Revisor: Refutador (Agent Team — Task #3)

### Eje 1 — Casos borde geopolíticos

#### Islas Malvinas (FK) — ⚠️ OBJECIÓN PRINCIPAL

La propuesta clasifica las Malvinas como **"Territorio del Reino Unido"**. Esto es problemático:

1. **Argentina reclama soberanía** y la ONU ha emitido múltiples resoluciones (2065, 3160, 31/49, etc.) instando a negociaciones sobre soberanía. No es un caso cerrado como Bermudas o las Caimán.
2. **App en español**: La audiencia principal incluye hispanohablantes, con alta probabilidad de usuarios argentinos. Etiquetar las Malvinas como "Territorio del Reino Unido" sin matiz se percibirá como tomar partido.
3. **Asimetría con el Sáhara Occidental**: El Sáhara está clasificado como "Soberanía en disputa" aunque Marruecos lo controla de facto. Las Malvinas están en una situación análoga (UK las administra de facto, Argentina las reclama), pero se clasifican como dependencia. El criterio no es consistente.

**Sugerencia**: Mover FK a "Soberanía en disputa" (4 territorios en vez de 3). Esto es la opción más neutral y coherente con el criterio aplicado al Sáhara Occidental. Alternativa mínima: añadir un matiz al disclaimer, ej. "Territorio administrado por el Reino Unido (soberanía reclamada por Argentina)".

#### Hong Kong y Macao — ✅ Aceptable

"Territorio de China" es correcto. El matiz "1 país, 2 sistemas" es interesante pero constituye exactamente el tipo de detalle jurídico que la propuesta justifica omitir. Quien quiera saber más puede acceder a Wikipedia desde la ficha. Sin objeción.

#### Sáhara Occidental — ✅ Aceptable

"Soberanía en disputa" es neutral y preciso. Sin objeción.

#### Taiwán y Kosovo — ✅ Aceptable

Sin objeción. Ambos son casos claros de soberanía disputada.

#### Groenlandia — ✅ Aceptable

"Territorio de Dinamarca" es correcto. Su alto grado de autonomía no cambia la relación constitucional con la Corona danesa. Sin objeción.

---

### Eje 2 — Sensibilidad política

- La etiqueta **"Soberanía en disputa"** es neutral y no toma partido. ✅
- El cambio de **"no reconocido por la ONU"** a **"Territorio de [País]"** es una mejora significativa: es más preciso y menos estigmatizante. ✅
- **Único punto sensible**: Malvinas (ver eje 1). Es el caso con mayor riesgo de controversia para la audiencia del producto.

---

### Eje 3 — Coherencia con DESIGN.md

- El texto propuesto para DESIGN.md encaja bien con el tono y estructura del documento existente. ✅
- El cambio de título de "Territorios no reconocidos por la ONU" → "Territorios no miembros de la ONU" es una mejora de precisión: Groenlandia no es "no reconocida", simplemente no es miembro. ✅
- No contradice ninguna decisión existente sobre Antártida, exclusión del juego, colores ámbar, etc. ✅
- **Pequeña mejora**: El texto actual en DESIGN.md dice "circulitos de capitales" pero el texto propuesto dice "pines de capitales". Esto es un fix correcto (el término actual del codebase es `CAPITAL_PIN`). ✅

---

### Eje 4 — Over-engineering ⚠️

#### 4a. Campo `sovereignCountry` — ✅ Correcto

Almacenar el `cca2` del soberano como referencia en los datos es modelado limpio. Un campo opcional string es la forma más simple y correcta de representar esta relación. Sin objeción.

#### 4b. `getSovereignName()` — ⚠️ SIMPLIFICAR

La propuesta sugiere una función genérica que busca el nombre del soberano en el array de países cargado. Esto tiene dos problemas:

1. **Preposiciones en español**: "de Dinamarca", pero "**del** Reino Unido", "de **los** Estados Unidos" (o "de Estados Unidos"?), "de **los** Países Bajos" (o "de Países Bajos"?). Una función genérica que solo busca el nombre no resuelve esto — necesitaría lógica adicional para las contracciones del/de los.

2. **Acoplamiento innecesario**: La propuesta menciona recibir un mapa `cca2 → name` como prop o función de lookup, lo cual acopla CountryCard a la carga de datos solo para 9 valores que **nunca cambian**.

**Sugerencia — mapa constante**: Solo hay 9 países soberanos. Un mapa hardcoded en el componente (o en un archivo de constantes compartido) es más simple, resuelve las preposiciones y no requiere props adicionales:

```tsx
const SOVEREIGN_LABELS: Record<string, string> = {
  'GB': 'del Reino Unido',
  'FR': 'de Francia',
  'US': 'de Estados Unidos',
  'NL': 'de Países Bajos',
  'DK': 'de Dinamarca',
  'CN': 'de China',
  'NZ': 'de Nueva Zelanda',
  'FI': 'de Finlandia',
  'AU': 'de Australia',
};

// Uso:
`Territorio ${SOVEREIGN_LABELS[country.sovereignCountry]}`
```

Esto elimina `getSovereignName()`, no necesita props adicionales, y resuelve correctamente todas las preposiciones. Si algún día se añade un 10° soberano (improbable), se añade una línea al mapa.

#### 4c. Cambios en `isoMapping.ts` — ✅ Razonable

Añadir `sovereignCca2` a las ~36 entradas existentes es mecánico pero necesario. La alternativa (un mapa separado) fragmentaría la información sin beneficio. Sin objeción.

---

### Eje 5 — Impacto en el codebase

| Archivo | Cambio | Riesgo |
|---------|--------|--------|
| `src/data/types.ts` | +1 campo opcional | Nulo |
| `src/data/isoMapping.ts` | +1 campo en interface + ~36 entradas | Bajo (mecánico) |
| `scripts/fetch-countries.ts` | ~10 líneas para leer sovereign | Bajo |
| `src/components/Explore/CountryCard.tsx` | Cambiar disclaimer | Bajo |

- **Archivos tocados**: 4 — razonable para el cambio. ✅
- **Riesgo de regresión**: Bajo. El cambio solo afecta al texto del disclaimer, no a la lógica de renderizado, juego o navegación. ✅
- **Regeneración de datos**: Hay que re-ejecutar `npm run fetch-data` para que `countries.json` incluya el nuevo campo. Esto debería mencionarse en el spike como paso de implementación. ℹ️

---

### Veredicto

**La propuesta es buena y está casi lista para implementar**, con dos ajustes recomendados:

1. **[Crítico] Islas Malvinas → "Soberanía en disputa"**: Moverlas de categoría A a B para mantener neutralidad y coherencia con el criterio del Sáhara Occidental. Especialmente importante para una app en español con audiencia hispana.

2. **[Simplificación] Reemplazar `getSovereignName()` por mapa constante**: Un `Record<string, string>` de 9 entradas con preposiciones ya resueltas es más simple, correcto y desacoplado que una función de lookup genérica.

Con estos dos ajustes, la propuesta se puede implementar directamente.
