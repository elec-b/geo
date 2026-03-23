# Spike: Validación de símbolos de moneda

**Fecha**: 2026-03-18
**Método**: Agent team (auditor interno + validador externo + refutador) + 3 subagentes de investigación en profundidad
**Fuentes consultadas**: REST Countries API v3.1, Xe.com, OANDA, Wikipedia, bancos centrales (BCRP, BCV, Banque Centrale du Congo), ISO 4217, Unicode CLDR, `Intl.NumberFormat`, worlddata.info, Elevatepay

---

## Parte 1: Auditoría de los datos actuales

Se auditaron los 232 países/territorios de la app (195 ONU + 37 no-ONU) comparando los símbolos de moneda actuales contra múltiples fuentes reputadas.

### Origen de los errores

Todos los errores provienen de **`scripts/data/capitals-es.json`** (datos suplementarios manuales). El pipeline (`fetch-countries.ts:113`) da prioridad al suplementario sobre REST Countries API. Esto es necesario porque REST Countries devuelve los **nombres** de moneda en inglés, y necesitamos la traducción al español. Pero el suplementario sobreescribe el **objeto entero** `{name, symbol}`, no solo el `name`. Como el `symbol` es universal (€, $, ¥), no necesita traducción — y al escribirlo manualmente se introdujeron errores.

### Errores factuales encontrados (5)

| País | CCA2 | Actual | Correcto | Motivo |
|------|------|--------|----------|--------|
| Congo (Rep. Dem.) | CD | `Fr` | `FC` | Franco congoleño (CDF) usa `FC` (Franc Congolais), no el genérico `Fr` de los francos CFA. Confirmado por banco central, Xe, REST Countries |
| Perú | PE | `S/.` | `S/` | Ley 30381 (nov 2015): "Nuevo Sol" → "Sol", símbolo cambió de `S/.` a `S/`. Confirmado por BCRP. Nota: Xe.com aún muestra `S/.` — la confusión es generalizada |
| Venezuela | VE | `Bs.` | `Bs.S` | Bolívar soberano (VES) desde 2018. `Bs.` era del bolívar fuerte (VEF), obsoleto. Confirmado por BCV. También renombrar "Bolívar venezolano" → "Bolívar soberano" |
| Cabo Verde | CV | `$` | `Esc` | El escudo caboverdiano usa `Esc`, no `$`. `$` es del dólar |
| Suazilandia | SZ | `E` | `L` | ISO 4217 = SZL. `L` (lilangeni, singular) es el estándar. `E` (emalangeni, plural) es inconsistente con el nombre "Lilangeni suazi" en la app |

### Casos donde la app eligió mejor que REST Countries (14)

| CCA2 | App | API | Por qué la app es mejor |
|------|-----|-----|------------------------|
| TW | `NT$` | `$` | `NT$` (New Taiwan Dollar) distingue de otros dólares |
| MO | `MOP$` | `P` | `MOP$` es específico; `P` es demasiado genérico |
| KE | `KSh` | `Sh` | `KSh` distingue el chelín keniano del tanzano y ugandés |
| TZ | `TSh` | `Sh` | `TSh` distingue el chelín tanzano |
| UG | `USh` | `Sh` | `USh` distingue el chelín ugandés |
| MV | `Rf` | `.ރ` | `Rf` (latín) es más legible que `.ރ` (thaana) |
| LK | `Rs` | `Rs  රු` | `Rs` es limpio; la API agrega script cingalés |
| MK | `ден` | `den` | Forma cirílica nativa, más auténtica |
| TM | `T` | `m` | `T` es reconocido; `m` minúscula es genérica |
| TJ | `SM` | `ЅМ` | Latín más universalmente legible |
| CH | `Fr` | `Fr.` | Sin punto, consistente con los otros 20 francos |
| GL | `kr` | `kr.` | Sin punto, consistente con Dinamarca |
| PE | `S/.` vs `S/ ` | — | La API tiene un espacio trailing (bug de datos) |
| SD | `ج.س.` | `ج.س` | Diferencia mínima (punto final) |

### Casos debatibles sin acción necesaria

- **Myanmar (MM)**: `K` vs `Ks` — ambas formas válidas (singular/plural)
- **Vanuatu (VU)**: `VT` vs `Vt` — capitalización, no afecta comprensión
- **Diferencias cirílico/latín** (KG, RS, UZ): la app elige la forma más legible globalmente
- **13 diferencias cosméticas** adicionales: puntos finales, capitalización — no requieren acción

### Edge cases informativos

- **Zimbabwe (ZW)**: Desde abril 2024 usa "Zimbabwe Gold (ZiG)", pero REST Countries no lo ha actualizado. Símbolo `$` coincide. Prioridad baja.
- **Panamá (PA)**: 2 monedas (Balboa + USD). Correcto.
- **Cuba (CU)**: CUC eliminado en 2021. La app lo maneja bien.

---

## Parte 2: Investigación de fuentes de símbolos

### ¿Quién define los símbolos de moneda?

**ISO 4217 NO define símbolos** — solo códigos de 3 letras (USD, EUR) y códigos numéricos. No existe ningún estándar internacional que defina oficialmente los símbolos gráficos de las monedas.

Los símbolos son **convenciones de facto**, definidos soberanamente por cada banco central (ej. el BCE diseñó €, el RBI de India adoptó ₹ en 2010, el Banco Central de Rusia adoptó ₽ en 2013). No hay coordinación internacional, por eso `$` lo comparten ~30 monedas.

### Las 3 fuentes disponibles

| Aspecto | REST Countries | Unicode CLDR | `Intl.NumberFormat` |
|---------|---------------|-------------|---------------------|
| **Mantenedor** | Comunidad (repo archivado jun 2024, adquirido por apilayer) | Unicode Consortium | Motores JS (V8, JSC, SpiderMonkey) — usan CLDR/ICU internamente |
| **Locale-aware** | No — un solo símbolo por moneda | Sí — símbolo adaptado al idioma | Sí — igual que CLDR |
| **Desambiguación** | Pobre: USD, CAD, AUD → todos `$` | Buena: en `es`, CAD=`CAD`, USD=`US$` | Buena: idem |
| **Calidad** | Variable (algunos errores, datos de Wikipedia) | Alta (proceso formal de revisión) | Alta (es CLDR) |
| **Dependencias** | Fetch HTTP a la API | NPM `cldr-numbers-full` (~grande) | **Cero** — built-in en JS |
| **Actualización** | Incierta (repo archivado) | ~2 releases/año | Con cada actualización de OS/browser |

### CLDR: `symbol` vs `symbol-alt-narrow`

CLDR define dos variantes por moneda y locale:

| Campo | Regla | Ejemplo (locale `es`) | Uso |
|-------|-------|----------------------|-----|
| `symbol` | **Único** dentro del locale — nunca dos monedas comparten símbolo | USD=`US$`, CAD=`CAD`, EUR=`€` | Contexto donde hay varias monedas |
| `symbol-alt-narrow` | Puede repetirse — el glifo más corto | USD=`$`, CAD=`$`, EUR=`€` | Contexto donde la moneda es obvia |

**Hallazgo importante**: En locale `es`, CLDR usa el **código ISO como símbolo** para monedas no habituales en el mundo hispanohablante (CAD→`CAD`, GBP→`GBP`, JPY→`JPY`). Esto es correcto para desambiguación pero poco educativo.

### `Intl.NumberFormat` — extracción de símbolos

Funciona y es la vía más práctica (cero dependencias):

```javascript
function getCurrencySymbol(currencyCode, locale = 'es') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol' // o 'symbol'
    }).formatToParts(0)
      .find(p => p.type === 'currency')?.value || currencyCode;
  } catch {
    return currencyCode;
  }
}
```

Opciones de `currencyDisplay`:
- `'narrowSymbol'`: `$`, `£`, `¥` — corto pero ambiguo
- `'symbol'`: `US$`, `GBP`, `JPY` — desambiguado pero a veces usa el código ISO
- `'code'`: `USD`, `GBP` — siempre el código
- `'name'`: `dólares estadounidenses` — nombre completo

Compatible con Safari 14.1+ / iOS 14.5+ (`narrowSymbol`).

---

## Parte 3: Conclusiones y recomendación

### El dilema

Ninguna fuente individual es perfecta para nuestra app:

| Fuente | Problema |
|--------|----------|
| **Datos manuales actuales** | 5 errores, riesgo de desactualización |
| **REST Countries** | 14 casos donde tenemos mejor símbolo; repo archivado |
| **CLDR `narrowSymbol`** | Demasiado genérico: ~30 monedas → `$` |
| **CLDR `symbol`** | En locale `es`, usa códigos ISO para muchas monedas (CAD, GBP, JPY) |

### Recomendación: enfoque híbrido para i18n

Cuando se implemente la internacionalización completa:

1. **Código de moneda** (qué moneda usa cada país): de REST Countries (ya lo tenemos)
2. **Nombre de moneda** (traducido): de `Intl.DisplayNames` o CLDR — elimina la necesidad de traducir nombres manualmente
3. **Símbolo de moneda**: `Intl.NumberFormat` con `narrowSymbol` como **base**, con un mapa de **overrides curados** para los ~15 casos donde tenemos un símbolo mejor (NT$, KSh, TSh, USh, MOP$, Rf, etc.)

```
symbol = CURATED_OVERRIDES[currencyCode] ?? Intl.narrowSymbol(currencyCode, locale)
```

Esto combina lo mejor de ambos mundos:
- **Automatización**: ~95% de los símbolos vienen de CLDR (siempre actualizado, locale-aware)
- **Calidad**: los ~15 overrides preservan nuestros símbolos superiores
- **Mantenimiento**: solo hay que mantener ~15 overrides, no 232 entradas manuales

### Acción inmediata (pre-i18n)

Corregir los 5 errores en `scripts/data/capitals-es.json` y regenerar datos. La refactorización del pipeline se haría como parte de la tarea de internacionalización.

---

## Datos del spike

- **Símbolos únicos en la app**: 94
- **Símbolo más compartido**: `$` (58 países), `€` (30), `Fr` (21 tras corregir Congo), `£` (9)
- **Símbolos vacíos/nulos**: 0
- **Coincidencia app vs REST Countries**: 83% (192/232)
- **Discrepancias**: 40 (de las cuales 14 son a favor de la app)
