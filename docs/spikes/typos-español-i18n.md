# Spike: Typos en español y estrategia de QA para i18n

**Fecha**: 2026-03-22
**Contexto**: La app muestra "Iran" (sin tilde) en vez de "Irán". Investigar si hay más errores y cómo prevenir esto para otros idiomas.
**Método**: Equipo de 4 agentes (auditor + refutador, investigador + refutador) con revisión cruzada.

---

## 1. Origen de los errores

### Pipeline de datos actual

```
REST Countries API (translations.spa.common)
        ↓
fetch-countries.ts (línea ~109)
  → suppEntry.name ?? c.translations?.spa?.common
        ↓
capitals-es.json (archivo suplementario manual)
  → Provee: capital, demonym, currencies, languages
  → Puede proveer: name (override), pero solo 1 de 232 lo usa (Sierra Leona)
        ↓
public/data/countries.json + capitals.json
```

### Causa raíz

**REST Countries API** devuelve nombres incorrectos o no hispanizados en `translations.spa.common`. El script `fetch-countries.ts` confía en ellos sin validación. No hay problemas de encoding (UTF-8 verificado), ni de build (Vite sirve los JSON sin transformación), ni de normalización Unicode (NFC correcto).

**Pista interna reveladora**: los `demonym` y `wikipediaSlug` del propio archivo ya usan las formas RAE correctas (ej. demonym="birmano" pero name="Myanmar"), lo que indica correcciones parciales que no alcanzaron el campo `name`.

---

## 2. Inventario de errores

### 2.1 Nombres de países — 20 errores confirmados

#### Tildes faltantes

| cca2 | Actual | Correcto (RAE) | Evidencia |
|------|--------|-----------------|-----------|
| IR | Iran | **Irán** | Aguda en -n. Wiki: "Irán" |
| BD | Bangladesh | **Bangladés** | Aguda en -s. Wiki: "Bangladés" |
| ML | Mali | **Malí** | Aguda en vocal. Wiki: "Malí" |
| EH | Sahara Occidental | **Sáhara Occidental** | Falta tilde en esdrújula |

#### Grafía no hispanizada

| cca2 | Actual | Correcto (RAE/DPD) | Evidencia |
|------|--------|---------------------|-----------|
| BH | Bahrein | **Baréin** | DPD: sin h. Wiki: "Baréin" |
| BW | Botswana | **Botsuana** | DPD: w→u. Wiki: "Botsuana" |
| LS | Lesotho | **Lesoto** | DPD: sin h. Wiki: "Lesoto" |
| MW | Malawi | **Malaui** | DPD: w→u. Wiki: "Malaui" |
| FO | Islas Faroe | **Islas Feroe** | Wiki: "Islas_Feroe" |
| TC | Islas Turks y Caicos | **Islas Turcas y Caicos** | Wiki: "Islas_Turcas_y_Caicos" |

#### Nombre extranjero sin traducir

| cca2 | Actual | Correcto (RAE) | Evidencia |
|------|--------|-----------------|-----------|
| DJ | Djibouti | **Yibuti** | Francés, no español. Wiki: "Yibuti". Capital ya dice "Yibuti" |
| GD | Grenada | **Granada** | Inglés. Wiki: "Granada_(país)". Demonym: "granadino" |
| MM | Myanmar | **Birmania** | RAE prefiere "Birmania". Demonym: "birmano" |
| AI | Anguilla | **Anguila** | DPD: una sola l |
| MF | Saint Martin | **San Martín** | Wiki: "San_Martín_(Francia)" |
| SX | Sint Maarten | **San Martín** | Wiki: "San_Martín_(Países_Bajos)" |

#### Nombre incompleto o inconsistente

| cca2 | Actual | Correcto (RAE) | Razón |
|------|--------|-----------------|-------|
| VC | San Vicente y Granadinas | **San Vicente y las Granadinas** | Falta artículo "las" |
| SK | República Eslovaca | **Eslovaquia** | Inconsistente con CZ="Chequia" (nombre corto) |

#### Posibles errores adicionales (requieren verificación)

| cca2 | Actual | Propuesta | Notas |
|------|--------|-----------|-------|
| BN | Brunei | **Brunéi** | Aguda en vocal — verificar si RAE pone tilde |
| PW | Palau | **Palaos** | CLDR usa "Palaos" — verificar DPD |
| KG | Kirguizistán | **Kirguistán** | CLDR usa forma más corta — verificar RAE |

### 2.2 Capitales — 3 errores

| cca2 | Actual | Correcto | Razón |
|------|--------|----------|-------|
| GD | Saint George | **Saint George's** | Falta apóstrofo posesivo |
| EE | Tallin | **Tallín** | DPD: doble l + tilde (aguda en -n) |
| BJ | Porto Novo | **Porto-Novo** | Falta guion (nombre oficial) |

### 2.3 Gentilicios — 1 error

| cca2 | Actual | Correcto (DPD) | Razón |
|------|--------|----------------|-------|
| LK | ceilanés | **esrilanqués** | DPD: "ceilanés" refiere al antiguo Ceilán |

### 2.4 Monedas — 1 error debatible

| cca2 | Actual | Propuesta | Notas |
|------|--------|-----------|-------|
| HT | Gurda haitiana | **Gourde haitiano** | Sin forma canónica RAE; "gourde" sin adaptar es más seguro |

### 2.5 Resumen

| Categoría | Errores confirmados | Debatibles / por verificar |
|-----------|--------------------:|------------|
| Nombres de países | 20 | +3 por verificar (BN, PW, KG) + MM y SK con matices |
| Capitales | 3 | — |
| Gentilicios | 1 | — |
| Monedas | 0 | 1 (HT) |
| **Total** | **~24** | +4 por verificar |

---

## 3. Solución inmediata

Añadir overrides de `name` en `capitals-es.json` para todos los países afectados. El mecanismo ya existe (`suppEntry.name ?? c.translations?.spa?.common`) pero casi no se usa.

---

## 4. Estrategia de QA para i18n futura

### 4.1 Fuentes de datos por campo

| Dato | Fuente primaria | Validación cruzada | Override manual |
|------|----------------|---------------------|-----------------|
| Nombre de país | **CLDR** (`territories.json`) | Wikipedia slug | `capitals-{lang}.json` |
| Capital | `capitals-{lang}.json` (manual) | Wikidata SPARQL (P36) | — |
| Gentilicio | `capitals-{lang}.json` (manual) | — (sin fuente automática fiable) | — |
| Moneda (nombre) | **CLDR** (`currencies.json`) | REST Countries (fallback) | `capitals-{lang}.json` |
| Idioma (nombre) | **CLDR** (`languages.json`) | REST Countries (fallback) | `capitals-{lang}.json` |

### 4.2 Por qué CLDR como fuente primaria

- Mantenido por Unicode Consortium (el estándar que usan iOS, Android, Chrome)
- Cubre 300+ territorios en 40+ idiomas, incluidos scripts no latinos (ar, zh, ja, ko, hi, vi, th)
- Se actualiza 2 veces/año (abril y octubre)
- Disponible como JSON en GitHub (`cldr-json`), sin API — un curl o `npm install`
- Coste de mantenimiento mínimo vs. mantener 232 nombres manualmente

**Fiabilidad para español** (verificación empírica contra RAE/DPD):
- De ~195 países, CLDR **coincide con la RAE en ~190** (~97%).
- En los 20 casos donde la app tiene errores, CLDR tiene la forma correcta en todos.
- Las adaptaciones ortográficas (Bangladés, Baréin, Botsuana, Yibuti, Lesoto, Malaui, Palaos) y tildes (Irán, Brunéi, Sáhara) son correctas.

**Limitaciones de CLDR** (5 casos donde prefiere endónimos oficiales sobre exónimos españoles):

| cca2 | CLDR dice | Mejor para la app (RAE) | Tipo de divergencia |
|------|-----------|-------------------------|---------------------|
| CI | Côte d'Ivoire | **Costa de Marfil** | Endónimo francés vs exónimo español |
| TL | Timor-Leste | **Timor Oriental** | Endónimo portugués vs exónimo español |
| PS | Territorios Palestinos | **Palestina** | Denominación geopolítica formal |
| HK | RAE de Hong Kong (China) | **Hong Kong** | Demasiado formal |
| MO | RAE de Macao (China) | **Macao** | Demasiado formal |

Estos 5 casos se resolverían con overrides manuales en el suplementario. El patrón es consistente: CLDR prefiere endónimos oficiales, la RAE prefiere exónimos tradicionales en español.

### 4.3 Pipeline propuesto

```
npm run fetch-data
    ↓
1. CLDR → nombres de países, monedas, idiomas (fuente primaria)
2. REST Countries → población, superficie, banderas, coordenadas
3. capitals-{lang}.json → capitales, gentilicios, overrides
    ↓
npm run validate-i18n  (NUEVO)
    ↓
4. Cross-check CLDR ∩ Wikipedia ∩ REST Countries → flaggear divergencias
5. Diff automático entre runs → detectar cambios para revisión humana
    ↓
6. Reporte de discrepancias → revisión humana si hay flags
    ↓
Commit
```

### 4.4 Limitaciones y consideraciones

- **Gentilicios**: No hay fuente automática fiable en ningún idioma. Requieren curación manual por idioma. Es el campo más costoso de escalar. Mejor approach: tabla manual curada una vez + diff automatizado que flaggee cambios entre runs.
- **LLM como validador**: No recomendado como paso automatizado del pipeline. No es determinista, no escala a idiomas de pocos recursos (vietnamita, tailandés, birmano), y crea falso sentido de seguridad. Mejor reservar para auditorías puntuales manuales.
- **Wikidata**: Útil como **señal de alerta** (si difiere del suplementario, flag para revisión), no como fuente autoritativa — los labels no tienen control editorial y son vulnerables a vandalismo.
- **GeoNames**: Fuente complementaria con nombres en 100+ idiomas (CC-BY). No tiene gentilicios ni monedas, pero puede validar capitales donde Wikidata no sea fiable.

### 4.5 Casos donde CLDR no es ideal (requieren override manual)

| cca2 | CLDR dice | Mejor para el juego | Razón |
|------|-----------|---------------------|-------|
| CI | Côte d'Ivoire | Costa de Marfil | Nombre español común |
| PS | Territorios Palestinos | Palestina | Más corto, nombre común |
| TL | Timor-Leste | Timor Oriental | Nombre español establecido |
| MM | Myanmar (Birmania) | Birmania | RAE; dual form no es clean para UI |
| HK | RAE de Hong Kong (China) | Hong Kong | Demasiado formal |
| MO | RAE de Macao (China) | Macao | Demasiado formal |

---

## 5. Decisiones pendientes

1. ¿Usar "Birmania" (RAE) o "Myanmar" (nombre oficial ONU)? El demonym ya dice "birmano".
2. ¿Corregir "Gurda haitiana" → "Gourde haitiano"? Sin forma canónica RAE.
3. ¿Cuándo integrar CLDR como fuente primaria? ¿Antes o después de la tarea de i18n del backlog?
4. ¿Implementar el script de validación cruzada ahora (para español) o cuando se lance i18n multi-idioma?
