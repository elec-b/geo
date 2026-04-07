# Metadata de stores

Metadata de Exploris para App Store y Google Play, lista para subir a App Store Connect y Google Play Console. Localizada a los idiomas soportados por la app.

> **Estado**: Iteración inicial. Solo `es.md` y `en.md` están redactados (idiomas semilla, validados manualmente). Los otros 30 idiomas se generarán a partir de estos como tarea posterior, usando como referencia terminológica el namespace `about` del idioma correspondiente en `src/i18n/locales/{lang}/about.json`.

---

## Estructura

```
docs/stores/
├── README.md             # este archivo
└── metadata/
    ├── es.md             # español (idioma semilla)
    ├── en.md             # inglés (idioma semilla)
    └── …                 # los 30 idiomas restantes (pendientes)
```

Cada `{lang}.md` contiene todos los campos en un único archivo, con su conteo de caracteres explícito (`NN/MAX`) para validar que ningún campo excede el límite de la store.

---

## Campos y límites por plataforma

| Campo | App Store (iOS) | Google Play (Android) | Límite | Notas |
|---|---|---|---|---|
| **Name / Title** | iOS Name | Android Title | 30 chars | iOS: solo el nombre. Android: admite sufijo de categoría/keyword (ej. `Exploris: Geografía`) |
| **Subtitle** | sí | — | 30 chars | iOS only. Slogan con keyword principal |
| **Short description** | — | sí | 80 chars | Android only. Equivalente al subtitle pero más largo |
| **Promotional text** | sí | — | 170 chars | iOS only. Editable sin resubmit (novedades, promociones) |
| **Description** | sí | sí | 4000 chars | Cuerpo principal. Mismo texto en ambas stores |
| **Keywords** | sí | — | 100 chars | iOS only. Coma-separadas, **sin espacios** después de coma. Android indexa el texto completo de la descripción |
| **Category** | sí | sí | fijo | Education |
| **Copyright** | sí | — | fijo | © 2026 Exploris |

**Importante sobre keywords iOS**: Apple cuenta cada carácter, incluidas las comas. **No** insertar espacios después de las comas (los espacios cuentan y reducen el espacio útil). Apple normaliza acentos en la búsqueda, así que se pueden mantener tildes.

---

## Mapeo de idiomas a locales de stores

Los 32 idiomas que soporta la app:

```
ca, cs, da, de, el, en, es, fi, fr, hi, hr, hu, id, it, ja, ko, ms,
nb, nl, pl, pt-BR, pt-PT, ro, ru, sk, sv, th, tr, uk, vi, zh-Hans, zh-Hant
```

Casi todos están soportados como locales 1:1 en App Store Connect y Google Play Console. Excepciones conocidas y casos de fallback:

| App lang | App Store locale | Play Store locale | Notas |
|---|---|---|---|
| `ca` | — (fallback `es`) | `ca` | Catalán no existe como locale en App Store; sí en Play |
| `nb` | `no` | `nb-NO` | App Store usa `no` (Norwegian) como cubo único |
| `pt-BR` | `pt-BR` | `pt-BR` | OK |
| `pt-PT` | `pt-PT` | `pt-PT` | OK |
| `zh-Hans` | `zh-Hans` | `zh-CN` | Naming distinto pero equivalente |
| `zh-Hant` | `zh-Hant` | `zh-TW` | Naming distinto pero equivalente |
| resto | igual | igual | 1:1 |

> El mapeo definitivo se confirmará al subir la metadata. Si una store no soporta un locale concreto, se usará el contenido del idioma padre.

---

## Formato de cada `{lang}.md`

Cada archivo sigue esta estructura. Las cabeceras `##` son predecibles para permitir parsing posterior (ej. conversión a layout `fastlane/metadata/{locale}/*.txt`):

```markdown
# Exploris — App Store / Google Play metadata ({lang})

## iOS Name (≤30)
Exploris

## Android Title (≤30)
[texto] · NN/30 chars

## Subtitle — iOS only (≤30)
[texto] · NN/30 chars

## Short Description — Android only (≤80)
[texto] · NN/80 chars

## Promotional Text — iOS only (≤170)
[texto] · NN/170 chars

## Keywords — iOS only (≤100)
keyword1,keyword2,keyword3,… · NN/100 chars

## Description (≤4000)
[cuerpo del texto: hook, diferenciadores, cómo funciona, público, fuentes, privacidad, CTA]

· NN/4000 chars

## Category
Education

## Copyright
© 2026 Exploris
```

---

## Plantilla de descripción

Estructura recomendada del cuerpo de la descripción (usar como guía, no copiar literal):

1. **Hook** (1-2 frases): qué es Exploris, diferenciador inmediato (globo 3D real, sin distorsión, sin anuncios).
2. **Por qué Exploris es diferente** (bullets, 5-7 puntos): globo terráqueo real, pasaporte con sellos, 6 tipos de juego, modo Aventura adaptativo, 195 países ONU, 32 idiomas, sin anuncios y sin recopilación de datos.
3. **Cómo funciona** (3 párrafos cortos): Explorar, Jugar, Pasaporte.
4. **Para quién** (1 párrafo): 8-15 años pero atractivo para adultos.
5. **Fuentes de datos**: ONU, Natural Earth, Banco Mundial, Wikidata.
6. **Privacidad**: sin recopilación de datos, funciona offline.
7. **CTA final**: «Descarga Exploris…».

---

## Consistencia con la app

La metadata **debe usar la misma terminología** que ven los usuarios dentro de la app. Antes de redactar o validar un idioma, revisar:

- `src/i18n/locales/{lang}/about.json` — descripciones de funcionalidades, tipos de juego, fuentes, privacidad
- `src/i18n/locales/{lang}/common.json` — nombres de pestañas (Explorar/Jugar/Pasaporte), niveles (Turista/Mochilero/Guía), continentes

Términos clave a vigilar por idioma:

| Concepto | ES | EN |
|---|---|---|
| Modo guiado | Aventura | Adventure |
| Documento de progreso | Pasaporte | Passport |
| Marca de logro | Sello / sellos | Stamp / stamps |
| Prueba final | Prueba de sello | Stamp test |
| Pestaña 1 | Explorar | Explore |
| Pestaña 2 | Jugar | Play |
| Pestaña 3 | Pasaporte | Passport |
| Niveles | Turista, Mochilero, Guía | Tourist, Backpacker, Guide |

---

## Proceso de subida (alto nivel)

Pendiente de definir cuando esté listo el primer build de TestFlight / Play Console internal track. Resumen del flujo previsto:

1. **Verificar** longitudes de cada campo en cada `{lang}.md` (script o revisión manual).
2. **Mapear** cada `{lang}.md` al locale correspondiente de cada store (ver tabla de mapeo).
3. **Subir** vía interfaz web de App Store Connect / Google Play Console, o vía `fastlane deliver` / `fastlane supply` si se monta el pipeline.
4. **Previsualizar** la ficha en el dispositivo real (TestFlight / internal track) antes de submit a revisión.

---

## Referencias

- `docs/spikes/naming-app.md` § 7 — Tips de ASO (App Store Optimization)
- `DESIGN.md` — diferenciadores de producto, filosofía de diseño
- `src/i18n/locales/{lang}/about.json` — fuente de verdad terminológica por idioma
