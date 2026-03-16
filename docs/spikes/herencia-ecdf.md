# Spike: Cambiar herencia entre niveles de A/B a E/CDF

> **Objetivo**: Corregir la desalineacion entre barra de progreso y pool de preguntas cuando hay herencia entre niveles.
>
> **Decision**: Cambiar los datos sinteticos heredados de `{A:1, B:1}` a `{E:1, C:1, D:1, F:1}`.

---

## 1. Problema

En modo Aventura, al jugar un nivel superior (mochilero/guia) con herencia del nivel anterior, la barra de progreso llega a 100% pero el pool de preguntas no se agota. El modal de prueba de sello nunca aparece.

**Reproduccion**: Completar turista en un continente (ambos sellos). Entrar en mochilero. La barra muestra un progreso alto desde el principio (los paises heredados cuentan como si ya dominaran A y B). Al jugar, la barra alcanza 100% antes de que el algoritmo deje de generar preguntas, porque el pool sigue activo: los paises heredados tienen A/B sinteticos pero el algoritmo los clasifica como "pendientes de verificacion" y sigue preguntandolos.

---

## 2. Causa raiz

La funcion `getAttemptsWithInheritance` (linea 566-612 de `learningAlgorithm.ts`) hereda `{A: streak:1, B: streak:1}` para cada pais del nivel anterior:

```ts
// learningAlgorithm.ts:590-593
merged[cca2] = {
  A: { correct: 0, incorrect: 0, streak: 1 },
  B: { correct: 0, incorrect: 0, streak: 1 },
};
```

Esto genera dos efectos contradictorios:

1. **Progreso inflado**: `calculateProgress` (linea 454) usa `inferredStreakFactor` para calcular credito. Un pais heredado con A=1 y B=1 obtiene credito completo en los 6 tipos via inferencia ascendente (A domina E; B domina C/D/F). El credito por pais es `fE*20 + fCDF*30 + fA*25 + fB*25 = 100`. Es decir, el pais aparece como 100% completado en la barra.

2. **Pool no se agota**: En `selectNextQuestion` (lineas 270-274), el check `isActive` para paises heredados es:
   ```ts
   if (!fixedType && inheritedCountries?.has(cca2)) {
     const inheritedTypes = inheritedCountries.get(cca2)!;
     return inheritedTypes.has('A') || inheritedTypes.has('B');
   }
   ```
   Como A y B son precisamente los tipos heredados (sinteticos, sin datos propios), `isActive` devuelve `true`. El pais queda en el pool activo.

**Resultado**: La barra dice 100% pero `selectNextQuestion` sigue devolviendo preguntas. La condicion para mostrar el modal de prueba de sello (`poolExhausted`) nunca se alcanza.

---

## 3. Propuesta

Cambiar la semantica de la herencia. En lugar de heredar A y B (los tipos mas dificiles, de la etapa 3), heredar E y C/D/F (las etapas 1 y 2):

| Sello del nivel anterior | Significado pedagogico | Se hereda |
|---|---|---|
| Paises (prueba tipo A aprobada) | Si sabes localizar, sabes nombrar | **E** (streak: 1) |
| Capitales (prueba tipo B aprobada) | Si sabes localizar capital, sabes texto | **C, D, F** (streak: 1) |

**A y B nunca se heredan** — deben jugarse en cada nivel.

Esto resuelve el bug porque:
- El progreso por pais heredado pasa de 100 a 50 (solo credito por E + CDF, no por A/B).
- El pool clasifica al pais como normal (no "heredado con A/B pendiente"), lo coloca en etapa 3 (E y CDF dominados), y lo trata como "en progreso" hasta que A y B se dominen con datos propios.
- Cuando A y B se dominan para todos los paises, el pool se agota normalmente → `poolExhausted: true` → modal de sello.

---

## 4. Cambios de codigo

### 4.1 `src/data/learningAlgorithm.ts`

#### a) `getAttemptsWithInheritance` (lineas 586-595)

**Antes:**
```ts
// Copiar herencia: solo paises que dominan A y B en el nivel anterior
for (const [cca2, ca] of Object.entries(prevAttempts)) {
  if (isDominated(ca, 'A') && isDominated(ca, 'B')) {
    merged[cca2] = {
      A: { correct: 0, incorrect: 0, streak: 1 },
      B: { correct: 0, incorrect: 0, streak: 1 },
    };
  }
}
```

**Despues:**
```ts
// Copiar herencia: E del sello de paises, C/D/F del sello de capitales
for (const [cca2, ca] of Object.entries(prevAttempts)) {
  if (isDominated(ca, 'A') && isDominated(ca, 'B')) {
    merged[cca2] = {
      E: { correct: 0, incorrect: 0, streak: 1 },
      C: { correct: 0, incorrect: 0, streak: 1 },
      D: { correct: 0, incorrect: 0, streak: 1 },
      F: { correct: 0, incorrect: 0, streak: 1 },
    };
  }
}
```

> Nota: La condicion de entrada (`isDominated(ca, 'A') && isDominated(ca, 'B')`) no cambia — sigue siendo "ambos sellos ganados". Lo que cambia es QUE se escribe en `merged`.

#### b) `selectNextQuestion` — simplificar isActive (lineas 270-274)

**Antes:**
```ts
const isActive = (cca2: string): boolean => {
  if (!fixedType && inheritedCountries?.has(cca2)) {
    const inheritedTypes = inheritedCountries.get(cca2)!;
    return inheritedTypes.has('A') || inheritedTypes.has('B');
  }
  const ca = allAttempts[cca2];
  if (fixedType) return !isDominated(ca, fixedType);
  const stage = stages.get(cca2) ?? 1;
  return !STAGE_TYPES[stage].every((t) => isDominated(ca, t));
};
```

**Despues:**
```ts
const isActive = (cca2: string): boolean => {
  const ca = allAttempts[cca2];
  if (fixedType) return !isDominated(ca, fixedType);
  const stage = stages.get(cca2) ?? 1;
  return !STAGE_TYPES[stage].every((t) => isDominated(ca, t));
};
```

El check especial de heredados desaparece. Con la nueva herencia, E/C/D/F ya estan dominados, asi que `getCountryStage` coloca al pais en etapa 3. El `isActive` generico revisa si A y B estan dominados — como no lo estan (no se heredan), el pais es activo. El flujo normal funciona.

#### c) `selectNextQuestion` — eliminar categoria "inherited" (lineas 291, 312-340, 364, 395-403)

La categoria `inherited` en la clasificacion de paises (linea 291: `const inherited: string[] = []`) y todo el bloque `else if (inheritedCountries?.has(cca2))` (lineas 312-340) se pueden eliminar. Tambien la seleccion de tipo especial para heredados (lineas 395-403).

**Antes (clasificacion, lineas 312-340):**
```ts
} else if (inheritedCountries?.has(cca2)) {
  // Pais heredado: clasificar segun estado de verificacion A/B
  const inheritedTypes = inheritedCountries.get(cca2)!;
  const stageTypes = STAGE_TYPES[stage];
  const ownTypes = stageTypes.filter((t) => !inheritedTypes.has(t));
  const needsReinforcement = ownTypes.some((t) => {
    const r = ca?.[t];
    return r && r.streak < 0;
  });
  if (needsReinforcement) {
    reinforcement.push(cca2);
  } else if (inheritedTypes.has('A') || inheritedTypes.has('B')) {
    inherited.push(cca2);
  } else {
    // A y B ya verificados → tratar como pais normal
    if (stageTypes.every((t) => isDominated(ca, t))) {
      dominated.push(cca2);
    } else if (!ca || stageTypes.every((t) => !ca[t])) {
      fresh.push(cca2);
    } else if (stageTypes.some((t) => { const r = ca[t]; return r && r.streak < 0; })) {
      reinforcement.push(cca2);
    } else {
      inProgress.push(cca2);
    }
  }
}
```

**Despues**: Este bloque entero desaparece. Los paises heredados caen en la rama generica "modo aventura" (lineas 341-354), que los clasifica correctamente: estan en etapa 3, A/B no dominados → `inProgress`.

**Antes (seleccion de tipo, lineas 395-403):**
```ts
} else if (inheritedCountries?.has(selectedCca2) && inherited.includes(selectedCca2)) {
  // Pais heredado: solo preguntar A o B (los que aun no tienen datos propios)
  const inheritedTypes = inheritedCountries.get(selectedCca2)!;
  const candidates: QuestionType[] = [];
  if (inheritedTypes.has('A')) candidates.push('A');
  if (inheritedTypes.has('B')) candidates.push('B');
  questionType = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : 'A';
}
```

**Despues**: Este bloque desaparece. El pais heredado, en etapa 3, recibe un tipo via `selectTypeForCountry(ca, 3, recentTypes)`, que selecciona entre `['A', 'B']` priorizando el no dominado. Es exactamente el comportamiento deseado.

**Antes (prioridad, linea 364):**
```ts
else if (inherited.length > 0) selectedCca2 = pick(inherited);
```

**Despues**: Esta linea desaparece junto con `const inherited: string[] = []`.

#### d) `selectNextQuestion` — parametro `inheritedCountries` (linea 261)

Con las simplificaciones anteriores, el parametro `inheritedCountries` solo se usa en `getEffectiveStages` (linea 266) para excluir heredados del umbral de avance colectivo. Este uso sigue siendo correcto y necesario: los paises heredados no deben inflar el conteo de avance colectivo.

El parametro se mantiene, pero su uso se reduce a una unica linea.

#### e) Comentarios del JSDoc (lineas 229-253)

Actualizar la documentacion de `selectNextQuestion` para reflejar la eliminacion de la categoria "heredados":
- Eliminar la linea `4. Heredados: paises con A/B heredados pendientes de verificacion (prioridad baja)`.

#### f) `calculateProgress` — sin cambios necesarios

La funcion ya usa `inferredStreakFactor`, que calcula credito por inferencia ascendente (A→E, B→C/D/F). Con la nueva herencia:
- E heredado (streak:1) → `fE = 1.0` → credito 20
- C/D/F heredados (streak:1) → `fCDF = max(1.0, 1.0, 1.0) = 1.0` → credito 30
- A sin datos → `fA = 0` → credito 0
- B sin datos → `fB = 0` → credito 0

**Credito por pais heredado = 20 + 30 + 0 + 0 = 50** (de 100). La barra arranca en ~50% para paises heredados, no en 100%. Correcto.

#### g) `isDominated`, `getCountryStage` — sin cambios

Estas funciones ya trabajan con inferencia ascendente. Un pais heredado con E=1 y C/D/F=1 sera:
- `isDominated(ca, 'E')` → `true` (directo, streak:1)
- `isDominated(ca, 'C')` → `true` (directo, streak:1)
- `getCountryStage(ca)` → etapa 3 (E dominado + algun CDF dominado → etapa 3)

El pais entra directamente en etapa 3 y necesita dominar A y B. Correcto.

#### h) `isReadyForStamp` — sin cambios

Sigue requiriendo que todos los paises dominen A y B. Como A y B no se heredan, esto solo se cumple cuando se juegan todos.

### 4.2 `src/hooks/useGameSession.ts`

#### a) `start` (lineas 181-223) — sin cambios directos

La funcion `start` llama a `requestNextQuestion`, que a su vez llama a `selectNextQuestion`. Los cambios en el algoritmo se propagan automaticamente.

**Fix secundario** (linea 216-220): Si `requestNextQuestion()` devuelve `null` al inicio (caso extremo: todos los paises ya dominan A y B), no se marca `poolExhausted`. Anadir:

```ts
const question = requestNextQuestion();
setCurrentQuestion(question);
if (question) {
  applyHighlight(question);
} else {
  setPoolExhausted(true);
}
```

#### b) `nextQuestion` (lineas 312-345) — sin cambios

La rama no-stamp (lineas 333-344) ya maneja `null` correctamente con `setPoolExhausted(true)`.

### 4.3 `src/components/Game/JugarView.tsx`

#### a) `getAttemptsForSession` (lineas 163-171) — sin cambios

Sigue llamando a `getAttemptsWithInheritance`, que ahora devolvera E/CDF en vez de A/B. Transparente.

#### b) `getInheritedCountries` (lineas 174-189) — sin cambios funcionales

`getInheritedTypes` (de `learningAlgorithm.ts`) compara `merged[cca2]` con `own[cca2]` tipo por tipo. Con la nueva herencia, para un pais sin datos propios, devolvera `{E, C, D, F}` en vez de `{A, B}`. El mapa resultante sigue siendo correcto.

#### c) `handleStart` (lineas 507-544) — sin cambios

La verificacion de "ya dominado" (lineas 517-531) calcula:
```ts
const dominated = qt === 'mixed'
  ? isTypeFullyDominated(att, def.countries, 'A') && isTypeFullyDominated(att, def.countries, 'B')
  : isTypeFullyDominated(att, def.countries, qt as QuestionType);
```

Con la nueva herencia, A y B no estan en los datos heredados → `isTypeFullyDominated` para A/B sera `false` a menos que se hayan jugado. Correcto: no salta el modal "ya dominado" prematuramente.

#### d) `progress` useMemo (lineas 847-856) — sin cambios

Llama a `calculateProgress`, que ahora dara credito 50 por pais heredado en vez de 100. La barra reflejara el estado real.

---

## 5. Impacto en la barra de progreso

| Escenario | Antes (hereda A/B) | Despues (hereda E/CDF) |
|---|---|---|
| Pais heredado sin datos propios | 100/100 | 50/100 |
| Pais heredado con A dominado | 100/100 | 75/100 |
| Pais heredado con B dominado | 100/100 | 75/100 |
| Pais heredado con A y B dominados | 100/100 | 100/100 |
| Pais no heredado sin datos | 0/100 | 0/100 (sin cambio) |

**Desglose de credito (hereda E/CDF):**
- `fE = 1.0` (E heredado) → 20 puntos
- `fCDF = 1.0` (C/D/F heredados) → 30 puntos
- `fA = 0` (no heredado) → 0 puntos
- `fB = 0` (no heredado) → 0 puntos
- **Total: 50 puntos**

La barra arranca en ~50% cuando todos los paises son heredados. Al ir dominando A y B, sube gradualmente hasta 100%. Alineado con el pool.

---

## 6. Impacto en el pool (selectNextQuestion)

Con la nueva herencia, un pais heredado tiene `{E:1, C:1, D:1, F:1}` en sus attempts:

1. `getCountryStage` lo coloca en **etapa 3** (E dominado + CDF dominado).
2. `isActive` revisa etapa 3 → `STAGE_TYPES[3] = ['A', 'B']` → ni A ni B dominados → **activo**.
3. Clasificacion: `stageTypes.every(t => !ca[t])` es `true` para A/B (sin datos) → entra en **fresh**.
4. `selectTypeForCountry(ca, 3, recentTypes)` elige entre A y B (ambos no dominados).

El pais se comporta como un pais normal en etapa 3. El pool se agota cuando TODOS los paises dominan A y B → `selectNextQuestion` devuelve `null` → `poolExhausted: true` → modal de sello.

---

## 7. Impacto en handleStart

La verificacion de dominacion en `handleStart` (lineas 517-531) comprueba:

```ts
const dominated = qt === 'mixed'
  ? isTypeFullyDominated(att, def.countries, 'A') && isTypeFullyDominated(att, def.countries, 'B')
  : isTypeFullyDominated(att, def.countries, qt as QuestionType);
```

- **Antes**: Con herencia A/B, un nivel mochilero recien desbloqueado podria tener A y B "dominados" (sinteticos) → `dominated = true` → el modal "ya completado" aparecia prematuramente.
- **Despues**: Con herencia E/CDF, `isTypeFullyDominated(att, countries, 'A')` es `false` (A no tiene datos) → `dominated = false` → la sesion inicia normalmente.

---

## 8. Simplificaciones posibles

El cambio permite eliminar codigo especifico para heredados en `selectNextQuestion`:

| Elemento | Lineas | Razon de eliminacion |
|---|---|---|
| `const inherited: string[]` | 291 | Sin categoria especial |
| Bloque `else if (inheritedCountries?.has(cca2))` | 312-340 | Paises heredados se clasifican con la rama generica |
| `else if (inherited.length > 0)` | 364 | Sin categoria para seleccionar |
| Bloque de seleccion de tipo para heredados | 395-403 | `selectTypeForCountry` con etapa 3 ya elige A/B |
| Check especial en `isActive` | 271-274 | El check generico de etapa funciona |
| Comentario JSDoc sobre categoria "heredados" | 244 | Documentacion obsoleta |

**Reduccion neta estimada**: ~35 lineas eliminadas, 4 lineas cambiadas en `getAttemptsWithInheritance`.

---

## 9. Edge cases

### 9.1. Pais heredado con datos propios parciales

Escenario: El usuario juega un pais heredado, domina A pero no B.
- Merged: `{E:1(h), C:1(h), D:1(h), F:1(h), A:1(propio)}`
- Etapa 3. `isActive`: B no dominado → activo. `selectTypeForCountry(ca, 3)`: elige B.
- Correcto.

### 9.2. Herencia transitiva (guia ← mochilero ← turista)

La funcion `getAttemptsWithInheritance` es recursiva (linea 581-583). El resultado de mochilero ya contiene `{E:1, C:1, D:1, F:1}`. Al calcular guia:
- `prevAttempts` de mochilero tendra E/CDF heredados + A/B propios (si se jugaron).
- `isDominated(ca, 'A') && isDominated(ca, 'B')` verifica A/B propios de mochilero.
- Si ambos dominados → hereda `{E:1, C:1, D:1, F:1}` a guia.
- Correcto: la misma semantica se aplica en cada salto.

### 9.3. Pais sin capital (sin tipo B/D en nivel anterior)

Algunos paises no tienen capital en los datos (ej: territorios). Si en el nivel anterior B no se domino directamente pero A si, la condicion `isDominated(ca, 'A') && isDominated(ca, 'B')` seria `false` → no se hereda. Esto es correcto: los sellos requieren ambos.

### 9.4. Regresion en pais heredado

Si el usuario responde mal A dos veces seguidas (streak: -2) en un pais heredado:
- `applyRegression` revisa etapa 3 (A/B): A tiene streak -2 → regresa a etapa 2.
- Etapa 2 = C/D/F. Todos dominados (heredados). No hay regresion adicional.
- El pais queda en etapa 2, dominado → sale del pool temporalmente.
- Al responder otras preguntas y volver, el pais sube de nuevo a etapa 3.
- Correcto: la regresion funciona como con cualquier pais.

### 9.5. Avance colectivo y paises heredados

`getEffectiveStages` (linea 198-201) excluye paises heredados del conteo de avance colectivo:
```ts
const ownCountries = inheritedCountries
  ? countries.filter((cca2) => !inheritedCountries.has(cca2))
  : countries;
```
Con la nueva herencia, `inheritedCountries` contendra `{E, C, D, F}` en vez de `{A, B}`. El filtro sigue identificando correctamente a los paises heredados (los que tienen `inheritedCountries.has(cca2)`). Sin cambio necesario.

### 9.6. Modo tipo concreto (no aventura)

Si el usuario juega modo tipo concreto (ej: solo tipo E), `inheritedCountries` no afecta (el check `if (!fixedType && ...)` cortocircuita). Los paises heredados con E=1 ya estan dominados para tipo E → quedan fuera del pool. Correcto.

---

## 10. Fix secundario: question === null en session.start()

En `useGameSession.ts`, la funcion `start` (lineas 216-220):

```ts
const question = requestNextQuestion();
setCurrentQuestion(question);
if (question) {
  applyHighlight(question);
}
```

Si `requestNextQuestion()` devuelve `null` (caso extremo: pool agotado desde el inicio), `poolExhausted` queda en `false` (se reseteo en linea 204) y la UI muestra una pantalla vacia sin feedback.

**Fix**: Anadir `else { setPoolExhausted(true); }`:

```ts
const question = requestNextQuestion();
setCurrentQuestion(question);
if (question) {
  applyHighlight(question);
} else {
  setPoolExhausted(true);
}
```

Este caso no deberia ocurrir con la nueva herencia (A/B nunca estan dominados al inicio de un nivel heredado), pero es una proteccion defensiva para evitar pantallas vacias.

---

## Plan de implementacion

1. **`learningAlgorithm.ts`**: Cambiar datos sinteticos en `getAttemptsWithInheritance` (4 lineas).
2. **`learningAlgorithm.ts`**: Eliminar categoria "inherited" y codigo asociado en `selectNextQuestion` (~35 lineas).
3. **`learningAlgorithm.ts`**: Actualizar JSDoc de `selectNextQuestion`.
4. **`useGameSession.ts`**: Anadir `setPoolExhausted(true)` en `start` cuando `question === null`.
5. **Testing**: Completar turista en un continente, entrar en mochilero, verificar que la barra arranca en ~50% y que el modal de sello aparece al dominar A y B.

**Estimacion**: ~4 lineas cambiadas + ~35 lineas eliminadas + 1 linea anadida.
