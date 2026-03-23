# Spike: Estadísticas de pruebas de sello — desacoplamiento de datos

**Fecha**: 2026-03-14
**Branch**: `feature/jugar`
**Objetivo**: Diseñar una tabla de estadísticas separada para pruebas de sello, desacoplando los datos de sello de los de jugar A/B.

---

## Contexto

Las pruebas de sello (certificaciones de 0 errores) y los tipos de juego A/B (localizar país/capital en el mapa) comparten actualmente el mismo registro de intentos. Esto impide mostrar estadísticas específicas de las pruebas de sello y genera inconsistencias (ej. resetear estadísticas borra datos de sello pero mantiene sellos ganados).

---

## Hallazgos: acoplamiento total

Las pruebas de sello y jugar A/B están **100% acoplados** en el código actual:

### Registro compartido
- Ambas modalidades usan exactamente el mismo `recordAttempt()` (`appStore.ts:136-177`).
- Los intentos se almacenan en `profile.progress[level][continent].attempts[cca2][type]` — un único campo `attempts` sin distinción de origen.
- La estructura `CountryAttempts` (`types.ts:24-31`) no tiene metadatos que identifiquen si un intento vino de juego normal o prueba de sello.

### Flujo de grabación (prueba de sello)
1. `JugarView.tsx:571-589` — `handleStartStampTest()` inicia sesión de sello.
2. `useGameSession.ts:221-257` — `startStampTest()` configura `isStampTestRef = true` y pre-genera cola con todos los países.
3. `useGameSession.ts:259-302` — `submitAnswer()` llama a `onAttemptRef.current()`.
4. `JugarView.tsx:128-135` — `handleAttempt()` invoca `recordAttempt()` (mismo que jugar normal).
5. `appStore.ts:136-177` — `recordAttempt()` actualiza `attempts[cca2][type]`.

### Vista de Estadísticas
- `StatsView.tsx:76-190` consume `attempts` sin distinguir origen.
- No hay forma de filtrar "solo datos de pruebas de sello".

### Sello ganado
- Al pasar (0 errores): `earnStamp()` (`appStore.ts:185-215`) marca `stampCountries/stampCapitals.earned = true` con `earnedDate`.
- Al fallar: solo se graban intentos individuales, indistinguibles de juego normal.
- No se almacena: cuántos intentos de prueba hubo, si fue primer intento o n-ésimo.

### Reset
- `resetAttempts()` (`appStore.ts:233-259`) vacía `attempts: {}` pero **no** toca sellos ganados.
- Inconsistencia: sello ganado sin datos que lo justifiquen.

### Inferencia y herencia
- Inferencia ascendente (`learningAlgorithm.ts:121-141`): A dominado → E inferido, B dominado → C/D/F inferidos. Opera sobre `attempts` (acoplado).
- Herencia entre niveles (`learningAlgorithm.ts:566-612`): requiere ambos sellos del nivel anterior. No distingue origen de datos.

---

## Decisiones tomadas

### 1. Desacoplamiento total (Jugar = entrenamiento, Sello = certificación)

Los fallos en pruebas de sello **no** alimentan el algoritmo de aprendizaje de Jugar. Cada sistema tiene su propio registro de intentos.

**Contradicción resuelta**: DESIGN.md decía *"Fallos compartidos: Los fallos en las pruebas de sello alimentan el registro de fallos compartido"*. Esta decisión cambia esa regla. Al implementar, actualizar DESIGN.md (ver § Cambios propuestos en DESIGN.md).

**Implicaciones**:
- `recordAttempt()` solo se llama desde Jugar.
- Nueva función `recordStampAttempt()` para pruebas de sello.
- Inferencia ascendente y barra de progreso usan solo datos de Jugar.
- Un fallo en prueba de sello no "castiga" el progreso en Jugar.

### 2. Sin herencia en pruebas de sello

Las pruebas de sello **no heredan** datos entre niveles. Para conseguir un sello, se evalúan el 100% de los países del nivel con 0 errores, incluyendo los que ya se superaron en el nivel anterior (DESIGN.md § Herencia: *"La herencia no exime de la prueba"*). La tabla de estadísticas de sello muestra solo los datos propios de cada nivel-continente, sin ✓ gris heredados.

### 3. Registro de todos los intentos individuales

Se registran todos los aciertos/fallos de cada país/capital durante una prueba de sello, **incluso si la prueba no se completa** (abandono). Esto permite calcular % de acierto por país.

### 4. Toggle de visualización

La tabla de pruebas de sello muestra, por cada continente-nivel, **una columna para Países y otra para Capitales**. Permite alternar entre:
- **Indicadores de dominio**: ✓ verde (ganado), ✗ rojo (fallado en último intento), — (sin intentos).
- **Porcentaje de acierto**: % de acierto por país en pruebas de sello.

No se muestra número de intentos de prueba. Misma mecánica de toggle que la prevista para la tabla de entrenamiento (ver BACKLOG.md).

### 4b. Pruebas abandonadas

Un abandono (prueba no completada) registra igualmente las respuestas individuales de cada país/capital. Esto permite calcular el % de acierto con todos los datos disponibles.

### 5. Reset: solo estadísticas de Jugar

- Resetear estadísticas borra **solo datos de Jugar** (`gameAttempts`).
- Los datos de pruebas de sello (`stampAttempts`) y los sellos ganados **no se pueden resetear** (por ahora — TBD, ver § Preguntas abiertas).

---

## Preguntas abiertas

1. **Reset de sellos**: ¿Debe el usuario poder borrar sellos ganados o resetear estadísticas de pruebas de sello? Decisión aplazada (TBD). Relacionado con el item de BACKLOG.md sobre borrados de sello y resets.

---

## Cambios propuestos en DESIGN.md

### § Pasaporte > Los 2 sellos
- Cambiar *"Fallos compartidos"* por *"Registro separado"*: las pruebas de sello registran en almacenamiento independiente.
- Eliminar *"Registro de fallos"* (subsección que describía el sistema compartido).

### § Jugar > Algoritmo de aprendizaje
- Cambiar intro de *"Sistema compartido entre Jugar y Pruebas de sello"* a *"Sistema de aprendizaje exclusivo de Jugar"*.
- Cambiar *"El registro es compartido"* a *"El registro es exclusivo de Jugar"*.

### § Estadísticas
- Renombrar *"Contenido"* a *"Tabla de entrenamiento"* (o similar) para distinguir de la nueva tabla.
- Añadir nueva subsección *"Pruebas de sello"* con: descripción de la tabla, indicadores visuales, toggle ✓/%, comportamiento contextual. Sin herencia (cada nivel evalúa el 100% de países).
- Actualizar *"Acciones > Resetear estadísticas"* para aclarar que solo borra datos de Jugar.

---

## Impacto en código

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `src/stores/types.ts` | Añadir `StampTestAttempt`, `stampAttempts` en `LevelContinentProgress` |
| `src/stores/appStore.ts` | Nueva función `recordStampAttempt()`, separar de `recordAttempt()` |
| `src/hooks/useGameSession.ts` | En `startStampTest()`, usar `recordStampAttempt()` en vez de `recordAttempt()` |
| `src/components/Stats/StatsView.tsx` | Añadir pestaña "Pruebas de sello" con nueva tabla |
| `src/data/learningAlgorithm.ts` | Verificar que inferencia/herencia usan solo `gameAttempts` (ya lo hacen, pero confirmar tras separación) |
| `src/components/Game/JugarView.tsx` | Actualizar `handleAttempt()` para distinguir contexto sello vs jugar |
