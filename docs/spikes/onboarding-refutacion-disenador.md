# Refutacion: Propuestas de diseno de onboarding

**Fecha**: 2026-03-25
**Rol**: Abogado del diablo / Refutador
**Documento refutado**: `onboarding-propuestas-diseno.md`

---

## Resumen

Las tres propuestas estan bien estructuradas y la recomendacion de la Opcion B es razonable como punto de partida. Sin embargo, el documento sobreestima el impacto del "momento wow" visual, subestima el coste de mantenimiento de tooltips posicionales sobre un canvas 2D, y no explora alternativas que podrian lograr el mismo objetivo con menos codigo y mayor durabilidad: una primera partida simplificada, empty states informativos, o micro-animaciones en el propio globo.

---

## Puntos debiles de las propuestas

### 1. La pregunta previa: es realmente necesario un onboarding?

Antes de evaluar las opciones, hay que cuestionar la premisa. El analisis interno identifica 3 fricciones "criticas", pero la propia investigacion UX y la refutacion del investigador revelan una tension:

- **La interfaz de navegacion ya es intuitiva** (tab bar + globo). Esto lo reconocen todos los documentos.
- **Las mecanicas complejas (6 tipos de quiz, sellos con 0 errores, modo Aventura adaptativo) no se resuelven con tooltips**. Un tooltip de 2 lineas no puede explicar que hay 6 tipos de quiz organizados en 3 etapas pedagogicas.
- **La friccion real esta en Jugar, no en Explorar**. El globo se explica solo (girar, pellizcar, tocar). Lo que no se explica solo es la estructura de progresion.

La alternativa mas fuerte contra cualquier onboarding es: **mejorar la UI existente en lugar de anadir una capa encima**. Por ejemplo:
- Mejor affordance en el globo: una micro-animacion de "deslizar" al cargar por primera vez (sin tooltip, sin texto).
- Texto mas claro en el selector de Jugar: en lugar de explicar con un tooltip que Aventura "se adapta", mejorar el subtitulo del boton.
- Empty states en Pasaporte: "Juega para ganar tu primer sello" en lugar de una matriz vacia sin contexto.

Estas mejoras de UI son permanentes, benefician a TODOS los usuarios (no solo a los de primera vez), y no requieren flags de estado ni logica condicional.

### 2. Tooltips sobre canvas 2D: complejidad tecnica subestimada

El documento califica la complejidad de implementacion como "Baja" (Opcion A) y "Baja-Media" (Opcion B). Esto es optimista. Problemas concretos:

- **Posicionamiento**: El globo se renderiza en un `<canvas>` con D3.js (ver `GlobeD3.tsx`, ~1000 lineas). Un tooltip "sobre el globo" no puede usar posicionamiento CSS estandar relativo a elementos DOM del canvas. Se necesita o bien un overlay absoluto posicionado manualmente, o bien coordinar con las dimensiones del canvas.
- **Responsividad**: GeoExpert se usa en distintos tamanos de iPhone. Un tooltip centrado sobre el globo en un iPhone 15 Pro Max puede cubrir el globo entero en un iPhone SE. Los wireframes ASCII del documento no abordan esto.
- **Interaccion con el header y tab bar**: El tooltip de Explorar aparece sobre un globo que ya esta parcialmente oculto por el header superior y los controles inferiores. El espacio util visible es menor del que sugiere el wireframe.
- **Auto-rotacion + tooltip**: Si el tooltip aparece "tras 1.5 segundos" mientras el globo rota, hay un timing sutil — el usuario puede estar ya interactuando. Se necesita logica para detectar si el usuario ya toco el globo antes de los 1.5s.

Ninguno de estos problemas es insuperable, pero clasificarlos como "Baja complejidad" es engañoso. Es mas cercano a "Media", con riesgo de ajustes iterativos post-implementacion.

### 3. El "momento wow" de la Opcion B: ver sin tocar es frustracion

La Opcion B propone un overlay semitransparente sobre el globo girando. El argumento es que esto genera un "momento wow". Cuestionamientos:

- **El globo es visible pero no interactuable**. El usuario VE el diferenciador de la app (el globo 3D) pero NO puede tocarlo. Esto contradice el principio de Apple de "dar rol activo al jugador durante el onboarding". Ver sin poder tocar genera frustracion, no wow.
- **El overlay oscurece el globo**. Un fondo semitransparente necesariamente reduce la calidad visual del globo. El "efecto premium" del globo (colores, detalle de fronteras, tema espacial) se degrada detras del overlay.
- **Compite con la auto-rotacion**: Si el globo rota detras del overlay, el movimiento compite con la lectura del texto. Si no rota, pierde el efecto dinamico. Es un dilema de atencion.
- **Tiempo real: 5 segundos ≠ 5 segundos**. El documento dice "<5 segundos de lectura". Pero el flujo real es: (1) la app carga, (2) el globo se inicializa, (3) aparece el overlay, (4) el usuario lee, (5) procesa, (6) busca el boton, (7) toca. Para un nino de 8-10 anos, esto puede ser 8-12 segundos. Y cada segundo antes de la primera interaccion es un segundo de potencial abandono.

La Opcion A (tooltips sin overlay) respeta mejor el principio de inmersion directa que defiende el propio documento.

### 4. El dato de "+80% retencion con quick wins" se usa sin rigor

El documento cita "+80% retencion con quick wins tempranos" como justificacion de la Opcion B. Problemas:

- La fuente es UserGuiding 2026, una empresa que vende herramientas de onboarding (conflicto de interes ya senalado por la refutacion del investigador).
- **Ver un globo girando detras de un overlay no es un "quick win"**. Un quick win es una accion del usuario con resultado positivo (completar un ejercicio, ganar un punto). La Opcion B no ofrece eso — ofrece un momento pasivo de contemplacion.
- Si se quiere aplicar este dato honestamente, la conclusion seria: **hacer que el usuario complete su primera pregunta de quiz lo antes posible**, no mostrarle un overlay con logo.

### 5. Skip rate y ROI: esfuerzo vs. impacto cuantificable

La investigacion cita que el 72% de usuarios quiere completar el onboarding en <60 segundos. Pero hay otra lectura: **el 72% quiere que el onboarding termine rapido porque no lo valora**. Los datos tambien dicen:

- Solo el 12% de usuarios reporta onboarding "efectivo".
- El 25% de apps se usan solo una vez y se abandonan.

Si la mayoria de usuarios no encuentra valor en el onboarding, y una parte significativa abandona independientemente, el esfuerzo de implementar y mantener tooltips + overlay puede no justificarse. La pregunta critica es: **cuantos usuarios se beneficiarian realmente vs. cuantos cerrarian el tooltip sin leer?**

No hay forma de saberlo sin A/B testing. Y una app pre-lanzamiento no tiene volumen para A/B testing significativo. Por tanto, la apuesta mas segura es la de menor coste de implementacion y mantenimiento.

### 6. Coste de mantenimiento ignorado

Cada tooltip esta acoplado a una posicion especifica de la UI. Cualquier cambio futuro puede romperlos:

- Si se redisena el header, el tooltip de Explorar puede quedar mal posicionado.
- Si se cambia el selector de Jugar (muy probable — la refutacion del investigador senala que es demasiado complejo), el tooltip de Jugar queda obsoleto.
- Si se anade o reordena un tab, los triggers cambian.

Los flags de onboarding tambien crean deuda tecnica sutil: cada flag es una bifurcacion en el codigo que hay que considerar en testing y en QA. Con 3-4 flags (`welcomeSeen`, `explorarSeen`, `jugarSeen`, `pasaporteSeen`), el numero de combinaciones de estado crece.

El documento no evalua este coste. Para una app pre-lanzamiento con un equipo pequeno y UI en evolucion rapida, cada tooltip acoplado a la UI es un punto de fragilidad.

### 7. Alternativas no exploradas

El documento presenta 3 opciones que son variaciones del mismo patron (tooltips + pantalla previa opcional). No explora alternativas fundamentalmente distintas:

**a) Primera partida simplificada como onboarding natural**
En lugar de explicar las mecanicas con texto, hacer que la primera sesion de Jugar sea una version simplificada: solo tipo E (el mas facil), solo 5 paises, con feedback extra-generoso. El usuario aprende jugando, no leyendo. Esto es el patron "learn by doing" que la investigacion recomienda pero que las propuestas no implementan.

**b) Empty states informativos**
El Pasaporte vacio es una oportunidad desperdiciada. En lugar de un tooltip que explique los sellos, un empty state bien disenado ("Tu pasaporte esta vacio. Juega para ganar tu primer sello de Europa") comunica lo mismo de forma permanente, sin flags, sin logica condicional, y beneficia a cualquier usuario que vea el Pasaporte vacio (no solo al de primera vez).

**c) Micro-animaciones en el globo**
En lugar de un tooltip que diga "Desliza para girar", una animacion sutil del globo que simule un drag al cargar por primera vez (como si una mano invisible lo girara). El usuario entiende la interaccion visualmente, sin texto. Esto es mas costoso de implementar que un tooltip, pero mas elegante y sin texto que mantener.

**d) Nada**
No hacer onboarding. Invertir el mismo tiempo de desarrollo en mejorar la affordance del globo, clarificar el selector de Jugar, y anadir empty states informativos. Estas mejoras benefician a todos los usuarios permanentemente, no solo a los de primera ejecucion.

### 8. La personalizacion relegada injustamente

La Opcion C (personalizacion) se descarta con argumentos validos (retrasa el globo, pide input antes de mostrar valor), pero la nota final del documento sugiere exactamente lo correcto: personalizar DESPUES de la primera partida. Sin embargo, esto se presenta como "nota" en vez de como propuesta formal. Si la investigacion de Khan Academy muestra que la personalizacion genera apego, y GeoExpert ya tiene el sistema de perfiles implementado, un prompt post-primera-partida ("Has ganado tu primer punto. Ponle nombre a tu pasaporte") merecia ser una Opcion D formal, no una nota al pie.

---

## Lo que esta bien argumentado

1. **La tabla comparativa es util y honesta**. No oculta las debilidades de cada opcion. La estructura de pros/contras por opcion facilita la decision.

2. **La Opcion A como minimo viable es correcta**. Si se va a hacer onboarding, tooltips contextuales son el patron con mejor ratio impacto/coste. La investigacion respalda esto.

3. **La decision de no pedir input antes de mostrar valor**. Descartar la personalizacion frontal (Opcion C) es acertado por las razones expuestas.

4. **La reutilizacion del globo como fondo**. La idea de que el globo este siempre presente (girando detras del overlay, visible mientras salen tooltips) es buena y alineada con la filosofia de DESIGN.md.

5. **Triggers independientes por tab**. Que cada tooltip tenga su propio flag y se muestre en contexto (no todos de golpe) es la implementacion correcta del progressive disclosure.

6. **El dismiss por interaccion**. Que el tooltip de Explorar se cierre al interactuar con el globo (no solo al pulsar "Entendido") es un detalle UX bien pensado.

---

## Alternativas o mejoras sugeridas

1. **Evaluar seriamente la opcion "nada"**: Antes de implementar onboarding, invertir en mejoras de affordance (micro-animacion del globo, empty states en Pasaporte, subtitulos mas claros en Jugar). Si estas mejoras eliminan las fricciones, el onboarding se vuelve innecesario.

2. **Si se hace onboarding, Opcion A > Opcion B**: El overlay de la Opcion B anade complejidad visual y tecnica sin un beneficio claro y demostrable. Los tooltips solos son mas simples, mas rapidos para el usuario, y mas faciles de mantener.

3. **Complementar con empty states**: Independientemente de la opcion elegida, los empty states en Pasaporte y Estadisticas deberian implementarse. No son onboarding — son buena UI, y benefician a todos los usuarios siempre.

4. **Considerar una primera partida guiada**: En lugar de tooltips en Jugar, que la primera sesion de Aventura incluya feedback extra (ej. tras la primera respuesta correcta, un mensaje breve: "Asi se juega. Sigue asi."). Esto es "learn by doing" real, no texto previo.

5. **Posponer la decision**: La app esta en pre-lanzamiento. Lanzar sin onboarding, recoger datos de abandono y friction points reales de usuarios reales, y luego decidir con evidencia si el onboarding es necesario y donde. Esto evita invertir esfuerzo en un problema que podria no existir.

---

## Conclusion: se sostiene la recomendacion del disenador?

**Parcialmente.** La Opcion B es una propuesta razonable y bien argumentada, pero la recomendacion se debilita por tres razones:

1. **No se evaluo la alternativa de no hacer onboarding** y en su lugar mejorar la UI existente (empty states, affordance, texto mas claro). Esta alternativa podria lograr el mismo resultado con menor coste y mayor durabilidad.

2. **El overlay "wow" es el punto mas debil**. Los propios datos y principios que cita el documento (Apple: "dar rol activo", NNG: "contextual > frontal", Duolingo: "probar antes de explicar") apoyan mas la Opcion A que la B. El overlay anade una capa pasiva que contradice la filosofia de inmersion directa.

3. **Las alternativas no exploradas (primera partida guiada, empty states, micro-animaciones) merecian evaluacion formal**. El espacio de soluciones se limito a variaciones de "tooltips + pantalla previa", cuando el propio principio de "learn by doing" que defiende la investigacion apunta en otra direccion.

Si se decide implementar onboarding, la **Opcion A con empty states informativos** seria una recomendacion mas conservadora y alineada con la evidencia: minimo coste, minimo mantenimiento, sin pantalla bloqueante, y las mejoras de empty state benefician a todos los usuarios permanentemente. El "momento wow" deberia buscarse en la primera interaccion con el globo (micro-animacion, feedback haptico) y en la primera pregunta acertada de Jugar, no en un overlay pasivo.
