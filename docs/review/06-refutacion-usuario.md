# Refutacion: Perspectiva del usuario

> Refutacion del analisis en `03-abogado-usuario.md`. Verificado contra el codigo fuente real.

---

## Acuerdos

Los siguientes gaps estan bien identificados y merecen atencion:

1. **Sin onboarding / primera ejecucion** (Gap #1). Es real. No existe ningun componente de onboarding, tutorial ni tooltip en todo el codebase (`grep` de "onboarding", "tutorial", "primera vez", "welcome" devuelve 0 resultados). Para una app con publico 8-15 anos, un flujo minimo de primera sesion es importante. Sin embargo, la urgencia se matiza: ver Desacuerdos.

2. **Indicador de preparacion antes de prueba de sello** (Gap #3). El modal de Pasaporte (`PassportView.tsx:221-253`) dice "Completa la prueba sin errores para conseguir el sello" pero no indica cuantos paises ni cuanto domina el usuario. Igualmente, en los modales de Jugar el texto es generico. Anadir "X paises" en el texto del modal seria un cambio de 1-2 lineas con alto retorno.

3. **Terminologia "microestados y archipielagos" en Configuracion**. Confirmado en `SettingsSheet.tsx:101`: el label es literal "Marcadores de microestados y archipielagos". Un cambio de texto trivial que mejora accesibilidad.

4. **Texto "resetea estadisticas" como sugerencia en modales de dominio**. Confirmado en `JugarView.tsx:1156`, `1201`, `1233`: el texto dice "Puedes resetear las estadisticas para volver a practicar". Para un adolescente, sugerir borrar progreso como flujo normal es confuso. Seria mas natural destacar "Prueba otro continente" o "Sube de nivel".

---

## Desacuerdos y matices

### 1. "El tab por defecto es Jugar" — FALSO

El analisis afirma: *"El tab seleccionado por defecto (segun los TABS: Jugar) muestra directamente el selector"*. Esto es incorrecto. `App.tsx:38` muestra:

```tsx
const [activeTab, setActiveTab] = useState<TabId>('explore');
```

El tab por defecto es **Explorar**, no Jugar. El array `TABS` en `types.ts` define el orden visual (Jugar, Explorar, Pasaporte), pero el estado inicial es `'explore'`. Esto invalida tanto la observacion de "Primera apertura" como la sugerencia del gap #4 ("el tab por defecto deberia ser Explorar en la primera sesion"). **Ya lo es.**

### 2. "Sin boton de salir durante la partida" — parcialmente correcto, pero el tab bar esta siempre visible

El analisis dice que "el unico modo de salir de una sesion activa es volver a tocar el tab Jugar (resetSignal)" y que "esto no es descubrible". Verificacion:

- `App.tsx:316`: `<TabBar activeTab={...} onTabChange={handleTabChange} />` — la tab bar se renderiza **sin** `visible={false}`. No hay ninguna condicion que la oculte durante el juego.
- El tab bar es visible en todo momento, con las 3 pestanas accesibles.
- Tocar "Explorar" o "Pasaporte" navega a esa pestana. Tocar "Jugar" de nuevo activa `resetSignal` y vuelve al selector.

El usuario tiene 3 tabs visibles en pantalla que lo llevan fuera de la partida. No es un boton "X" explicito, pero tampoco esta "atrapado" — la navegacion es estandar de cualquier tab-based app (Instagram, Spotify, etc.). Un boton de "Salir" dedicado es mejora de polish, no un defecto critico de usabilidad.

**Veredicto**: Desescalar de "impacto critico" a "mejora deseable" (prioridad baja-media).

### 3. "Selector de juego con demasiados pasos" — mitigado por el diseno actual

El analisis critica los "3 selecciones secuenciales (continente, nivel, tipo)". Pero el codigo muestra:

- `LevelSelector.tsx:69-77`: Continente y nivel se **pre-seleccionan** automaticamente (ultimo jugado o inferido por timezone + maximo nivel desbloqueado).
- `LevelSelector.tsx:227-240`: Aventura es el default visual (boton destacado a ancho completo).
- Los tipos concretos estan **colapsados** por defecto (`typesExpanded` empieza en `false`).
- `LevelSelector.tsx:302-310`: El boton principal dice "Continuar" si hay intentos previos.

En la practica, un usuario recurrente abre Jugar, ve continente y nivel ya seleccionados, Aventura ya destacada, y pulsa "Continuar". **Es un solo tap.** La critica sobre "demasiado ceremonial" no refleja la experiencia real. Un "Continuar donde lo dejaste" desde el home seria redundante con lo que ya existe.

### 4. "Feedback de error en C/D/E/F es fugaz (5% opacidad)" — ignorar la complejidad del sistema

El analisis dice que el overlay al 5% es "muy sutil". Pero el feedback no se limita al overlay:

- `GameFeedback.tsx:39-54`: El overlay muestra labels con el nombre incorrecto (rojo, 1.25rem, bold, text-shadow) y el correcto (verde, 1rem, text-shadow).
- `ChoicePanel`: Los botones se colorean verde (correcto) / rojo (incorrecto) durante 2.5 segundos.
- Para tipos A/B: hay feedback geografico sobre el globo (labels con flechas), el pais se colorea verde/rojo, y hay un sistema de 2 pasos con zoom.
- `ProgressBar.tsx:51-52`: Contadores de aciertos/errores se actualizan en tiempo real.
- Feedback haptico: vibración diferenciada acierto/error.

El overlay es intencionalmente sutil (evitar que sea agresivo — fue refinado de 15% a 5% segun el backlog). El feedback real viene de los labels textuales, los colores en botones/territorio y la vibracion. El analisis evalua el overlay aislado, no el sistema completo.

### 5. "Sin modo practica libre o repeticion selectiva" — fuera de scope v1.0

El analisis propone practicar "solo estos 5 paises del sudeste asiatico". Esto es feature creep clasico. El algoritmo adaptativo ya reprioriza paises fallados (buffer de anti-repeticion de 8 preguntas, luego reaparecen). La solucion del algoritmo es automatica y mas efectiva que la seleccion manual para el publico objetivo (8-15 anos), que probablemente no sabe cuales son "los 5 paises del sudeste asiatico que fallo".

### 6. "Concepto dominado es binario y poco explicado" — matizado

El analisis dice que "un solo acierto" parece "demasiado facil". Pero el diseno es intencional (DESIGN.md § Dominio):

> "Un solo acierto (racha >= 1) basta para considerar un pais dominado en un tipo. La certificacion real la dan las pruebas de sello (0 errores en todos los paises)."

El dominio es el umbral minimo de entrenamiento. La certificacion real es la prueba de sello (100% sin errores). Esto es analogo a Duolingo, donde completar una leccion es rapido pero el "dominio" real viene de la prueba de nivel. Explicar esto en un tooltip podria ayudar, pero no es un defecto de diseno.

### 7. "Prueba de sello: 0 errores sin advertencia del volumen" — parcialmente valido

La ProgressBar muestra "Prueba de sello: X de Y" desde la primera pregunta (`ProgressBar.tsx:23-24`). El usuario ve inmediatamente cuantas preguntas tiene. Pero es cierto que **antes** de empezar no lo sabe. El impacto real: si un usuario de 12 anos toca "Sello de Paises" en Turista-Oceania (14 paises), no es lo mismo que Guia-Europa (~50). Anadir el conteo al modal es un cambio trivial y valioso (coincide con el Acuerdo #2).

### 8. "Matriz 5x3 densa en pantallas pequenas" — no verificable, pero cuestionable

El analisis asume densidad excesiva. Sin embargo:
- La matriz es 5 filas x 3 columnas + headers = dimensiones razonables.
- Cada celda tiene 2 sellos + un numero. Es informacion minima.
- Un iPhone SE tiene 320pt de ancho — ~100pt por celda de nivel, suficiente para 2 sellos y un numero.
- La estetica guilloche y los colores por continente ayudan a la navegacion visual.

Sin evidencia de testing real en dispositivo, este punto es especulativo.

### 9. "Sin celebracion al subir de nivel" (Gap #4) — correcto pero no urgente

Es cierto que no hay un modal explicito de "nivel desbloqueado". Pero:
- El sello se gana con animacion `stampDrop` (confirmado en `PassportView.tsx:181`).
- Al conseguir el segundo sello, el usuario ve la animacion de la estrella giratoria.
- La proxima vez que abre el selector, el nuevo nivel aparece desbloqueado.

Seria bonito un modal celebratorio, pero la animacion de sello ya es un "momento de deleite". Es polish, no critico.

### 10. "Sin racha diaria o estadistica motivacional global" (Gaps #6 y #8) — post-lanzamiento

Rachas diarias (estilo Duolingo) y "Ya conoces X de 195 paises" son features de retencion validas, pero:
- Son ortogonales a la funcionalidad core.
- Requieren persistencia de fechas y logica de streaks.
- El pasaporte con sellos ya funciona como sistema de progresion visual.
- Para v1.0 de una app indie, el scope debe ser realista. Estos son candidatos para v1.1 o v1.2.

### 11. "Sin pista/ayuda durante el juego" (Gap #9) — decision de diseno intencional

El analisis propone pistas o "saltear pregunta". Esto contradice la filosofia del juego:
- El algoritmo adaptativo **es** la ayuda: si fallas, el pais se reprioriza y aparece mas tarde.
- Los tipos C/D/F muestran opciones (multiple choice) — no es "sin salida".
- Los tipos A/B son de localizacion en el mapa; una "pista" seria basicamente dar la respuesta.
- El error es parte del aprendizaje. Un boton de skip reduciria el esfuerzo cognitivo que genera retencion.

### 12. "Sin accesibilidad para daltonismo" (Gap #5) — post-lanzamiento

Valido como problema de inclusion, pero:
- 8% de hombres afectados es significativo, si.
- Sin embargo, la app ya usa iconos/simbolos ademas de color: checkmarks, cruces, estrellas, emojis de niveles.
- Los sellos tienen bordes diferenciados (simple = pais, doble = capital).
- Un modo alto contraste es deseable pero no bloqueante para v1.0.

### 13. "Sin transiciones animadas entre pestanas" (Gap #7) — cosmetico

El cambio de tab sin animacion es estandar en muchisimas apps de produccion. React no anima desmontajes de componentes por defecto, y anadir una libreria de transiciones (framer-motion, etc.) para este unico caso anade bundle y complejidad. Es polish estetico de baja prioridad.

### 14. "Sin confirmacion al salir de prueba de sello en curso" (Gap #10) — ya contemplado

El backlog ya menciona este punto en "Muy muy opcional" (`BACKLOG.md:104`). El tab bar funciona como salida (confirmado en `App.tsx:76-86`: `handleTabChange` limpia `stampTestActive` al cambiar de tab). No hay dialogo de confirmacion, pero el comportamiento es determinista y predecible. Un dialogo seria mejora, pero no es un gap "no contemplado" — ya esta documentado.

### 15. "StatsView sin navegacion clara de salida" — FALSO

El analisis dice que "no hay boton de volver evidente" y que "la navegacion depende de un boton X o gesto". Verificacion:

- `StatsView.tsx:292`: `<button className="stats-header__close" onClick={onClose} aria-label="Cerrar">{'\u2715'}</button>` — hay un boton X explicito en la cabecera.
- Es un modal fullscreen con boton de cerrar, patron estandar en iOS.

### 16. "Reset de estadisticas destructivo" — es intencional

El analisis critica que el reset borre todos los tipos de un nivel-continente. DESIGN.md § Acciones dice:

> "No hay reset granular por tipo — por simplicidad, siempre se resetea todo."

Ademas, hay `window.confirm()` antes de ejecutar (`StatsView.tsx:281`). Los sellos y el historial de pruebas de sello son permanentes (decision explicita documentada). Es una simplificacion intencional, no un descuido.

---

## Puntos ciegos del analisis

1. **El tab por defecto ya es Explorar**: El analisis construye varias observaciones (primera apertura, orden de tabs, sugerencia de que Explorar sea default) sobre la premisa incorrecta de que el default es Jugar. Esto invalida la observacion 4 de Explorar y la observacion 1 de DESIGN.md.

2. **El feedback es multimodal, no solo el overlay**: El analisis evalua el overlay de feedback aislado (5% opacidad) sin considerar los labels textuales, los colores en botones/territorio, el feedback haptico y el sistema de 2 pasos en A/B. El resultado es una critica a un componente que es intencionalmente sutil porque el feedback principal viene de otros canales.

3. **No distingue entre "tab bar visible" y "boton de salir"**: La tab bar esta siempre visible durante el juego (verificado en codigo). Tocar cualquier otro tab sale de la partida. Esto no es "estar atrapado" — es navegacion estandar. El analisis equipara "sin boton X dedicado" con "sin forma de salir", lo cual es inexacto.

4. **No considera el costo de cada mejora**: El analisis lista 10 gaps como si fueran equivalentes. Pero onboarding de 3-4 pantallas vs. anadir "X paises" a un modal tienen costos radicalmente distintos. Un analisis de UX para una app indie deberia ponderar esfuerzo/impacto.

5. **Sobreestima la incapacidad del publico objetivo**: Un usuario de 12 anos maneja apps con mucha mas complejidad que esta (Roblox, Fortnite, TikTok). La app tiene 3 tabs con iconos y labels, un selector con defaults inteligentes, y Aventura como opcion destacada. La premisa de que un adolescente "no sabra que tocar" subestima al publico.

6. **Ignora que la app ya pre-selecciona por timezone**: `LevelSelector.tsx:69` usa `inferContinentFromTimezone()` como fallback. Un usuario europeo vera Europa pre-seleccionada. Esto reduce drasticamente la friccion de la primera sesion que el analisis critica.

---

## Veredicto

### Gaps reales y accionables para v1.0 (coste bajo, impacto alto)
1. **Anadir conteo de paises al modal de prueba de sello** — "Debes ubicar X paises sin errores". Cambio de 2-3 lineas.
2. **Simplificar terminologia de Configuracion** — cambiar "microestados y archipielagos" por "Paises pequenos e islas" o similar.
3. **Mejorar texto de modales de dominio** — reemplazar "resetea estadisticas" por alternativas constructivas ("Prueba otro continente", "Sube de nivel").

### Gaps reales pero de prioridad media (v1.0 si hay tiempo)
4. **Onboarding minimo** — 2-3 tooltips o un modal de bienvenida. No requiere 3-4 pantallas; la app es suficientemente intuitiva para que basten senales ligeras.
5. **Celebracion al desbloquear nivel** — un modal breve. Mejora la recompensa emocional.
6. **Confirmacion al salir de prueba de sello** — un dialogo simple si el usuario toca otro tab. Ya esta en "Muy muy opcional" del backlog.

### Gaps imaginados o mal diagnosticados
7. "El tab por defecto es Jugar" — **falso** (ya es Explorar).
8. "Sin forma de salir del juego" — **exagerado** (tab bar siempre visible).
9. "StatsView sin navegacion de cierre" — **falso** (boton X existe).
10. "Feedback fugaz e insuficiente" — **evaluacion parcial** (sistema multimodal).

### Fuera de scope v1.0 (post-lanzamiento)
11. Rachas diarias / estadisticas motivacionales globales.
12. Accesibilidad para daltonismo.
13. Transiciones animadas entre pestanas.
14. Modo practica libre / repeticion selectiva.
15. Pistas o ayuda durante el juego.
