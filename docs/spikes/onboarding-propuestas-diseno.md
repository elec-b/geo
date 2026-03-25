# Spike: Propuestas de diseño de onboarding

**Fecha**: 2026-03-25
**Objetivo**: Proponer 2-3 opciones concretas de onboarding para GeoExpert, basadas en la investigacion UX y el analisis interno.

---

## Contexto

GeoExpert no tiene onboarding. El usuario abre la app y ve un globo 3D interactivo sin instrucciones. Las fricciones principales son: (1) no hay guia de interaccion con el globo, (2) sobrecarga de decisiones en Jugar, y (3) falta un "momento wow" inicial. Al mismo tiempo, la interfaz es intuitiva, el globo es visualmente impactante, y las apps de geografia comparables no usan onboarding formal. El publico objetivo (8-15 anos) es nativo digital.

La investigacion UX recomienda **tooltips contextuales (2-3 max) + learn by doing** como patron optimo.

---

## Opcion A: "Descubre tu mundo" — Tooltips contextuales progresivos

### Concepto
Onboarding invisible distribuido en el tiempo. No hay flujo de bienvenida. En su lugar, tooltips breves aparecen la primera vez que el usuario llega a cada zona clave de la app. El globo se muestra inmediatamente — el onboarding ocurre **alrededor** del globo, no antes.

### Flujo paso a paso

**Paso 1 — Primera apertura (tab Explorar)**
- La app carga normalmente. El globo aparece con auto-rotacion.
- Tras 1.5 segundos, aparece un tooltip flotante sobre el globo:

```
┌─────────────────────────────────┐
│  Desliza para girar el globo    │
│  Pellizca para hacer zoom       │
│  Toca un pais para descubrirlo  │
│                                 │
│            [Entendido]          │
└─────────────────────────────────┘
```

- Tooltip con fondo semitransparente oscuro, bordes redondeados, tipografia de la app.
- Boton "Entendido" cierra el tooltip. Tambien se cierra si el usuario interactua con el globo (drag/pinch/tap).
- La auto-rotacion del globo continua detras del tooltip para mantener el efecto visual.

**Paso 2 — Primera vez en tab Jugar**
- Al navegar a Jugar por primera vez, tooltip sobre la seccion de selector:

```
┌───────────────────────────────────────┐
│  Aventura se adapta a lo que sabes.   │
│  Empieza aqui — ya esta todo listo.   │
│                                       │
│              [Empezar]                │
└───────────────────────────────────────┘
```

- El tooltip senala el boton "Empezar" (que ya tiene continente y nivel pre-seleccionados).
- El texto refuerza que no hay que configurar nada — las pre-selecciones inteligentes ya hicieron el trabajo.
- "Empezar" en el tooltip actua como el boton real de Empezar (doble funcion).

**Paso 3 — Primera vez en tab Pasaporte**
- Al navegar a Pasaporte por primera vez, tooltip sobre la matriz de sellos:

```
┌──────────────────────────────────────────┐
│  Este es tu pasaporte de explorador.     │
│  Juega para ganar sellos y subir         │
│  de nivel en cada continente.            │
│                                          │
│              [Entendido]                 │
└──────────────────────────────────────────┘
```

- Resalta brevemente la primera celda desbloqueada (Turista del continente del usuario) con un glow sutil.

### Trigger
- Cada tooltip se muestra **una sola vez**, la primera vez que el usuario entra a la zona correspondiente.
- Se guarda un flag por tooltip en el store (`onboarding.explorarSeen`, `onboarding.jugarSeen`, `onboarding.pasaporteSeen`).

### Dismiss / Skip
- Cada tooltip se cierra con su boton, o al interactuar con el area debajo.
- No hay boton de "Saltar todo" porque los tooltips son independientes — el usuario ni sabe que hay mas.

### Persistencia
- Solo se muestra 1 vez por tooltip. No re-activable (la informacion se vuelve obvia con el uso).
- Si el usuario desinstala y reinstala, se muestran de nuevo (los flags van con el store).

### Pros
- **Minimo**: 3 tooltips, ~10 segundos totales de lectura. Cero pantallas bloqueantes.
- **Contextual**: La informacion aparece donde y cuando es relevante (alineado con NNG y Duolingo).
- **No bloquea el "momento wow"**: El globo se ve inmediatamente.
- **Facil de implementar**: Solo tooltips posicionados + flags booleanos en el store.
- **Respeta al usuario experimentado**: Si alguien ya sabe usar mapas interactivos, cierra el tooltip y sigue.

### Contras
- **Sin "momento wow" activo**: No genera emocion, solo elimina friccion.
- **Sin personalizacion**: No se pregunta nombre/avatar. El usuario arranca como "Explorador" + leon.
- **Tooltip de Jugar podria ignorarse**: Si el usuario no va a Jugar en la primera sesion, el tooltip aparece despues (que es correcto, pero pierde oportunidad de guiar).

### Complejidad de implementacion: **Baja**
- Componente `<Tooltip>` reutilizable (posicion, texto, boton).
- 3 flags booleanos en `appStore`.
- Sin animaciones complejas ni cambios en el flujo existente.

### Impacto UX estimado: **Medio**
- Elimina las 3 fricciones principales con coste minimo. No transforma la experiencia pero la suaviza.

---

## Opcion B: "Bienvenido, explorador" — Momento wow inicial + tooltips

### Concepto
Combinar un breve momento de bienvenida (1 pantalla, <10 segundos) que aprovecha el globo como protagonista, seguido de los mismos tooltips contextuales de la Opcion A. La pantalla de bienvenida genera emocion y contexto; los tooltips manejan la guia practica.

### Flujo paso a paso

**Paso 0 — Momento de bienvenida (solo primera ejecucion)**
- Reemplaza el spinner "Cargando globo..." por una pantalla con branding mientras carga.
- Cuando el globo esta listo, transicion suave a una pantalla de bienvenida **sobre** el globo (overlay semitransparente):

```
┌─────────────────────────────────────┐
│                                     │
│           [logo GeoExpert]          │
│                                     │
│     Descubre el mundo jugando       │
│                                     │
│     196 paises te esperan en        │
│     un globo que cabe en tu mano    │
│                                     │
│         [ Explorar el globo ]       │
│                                     │
│                                     │
└─────────────────────────────────────┘
        (globo girando detras,
         visible a traves del
         overlay semitransparente)
```

- El globo gira lentamente detras del overlay, creando un efecto visual premium.
- Un unico boton: "Explorar el globo" — cierra el overlay y el usuario aterriza en Explorar con el globo al frente.
- Tiempo total: <5 segundos de lectura. 1 tap para continuar.

**Pasos 1-3: Identicos a la Opcion A**
- Tooltip del globo (interaccion) al aterrizar en Explorar.
- Tooltip de Jugar (primera vez en tab Jugar).
- Tooltip de Pasaporte (primera vez en tab Pasaporte).

### Trigger
- La pantalla de bienvenida se muestra **solo en la primera ejecucion** (flag `onboarding.welcomeSeen`).
- Los tooltips siguen el mismo trigger que la Opcion A.

### Dismiss / Skip
- La pantalla de bienvenida se cierra con el boton "Explorar el globo".
- Sin boton de skip explicito (es una sola pantalla con 1 accion — skip no tiene sentido).
- Tooltips: igual que Opcion A.

### Persistencia
- Todo se muestra 1 sola vez. No re-activable.

### Pros
- **"Momento wow"**: El globo girando detras del overlay genera la emocion que falta en el flujo actual.
- **Branding**: Primera impresion con identidad de la app (logo, tagline, estetica premium).
- **Contextual**: Los tooltips posteriores mantienen la guia practica donde es relevante.
- **Rapido**: La pantalla de bienvenida es 1 tap, <5 segundos. No es un tutorial.
- **El globo sigue siendo protagonista**: No se oculta — se enmarca.

### Contras
- **Una pantalla extra**: Aunque es rapida, es un paso mas antes de la interaccion libre.
- **Sin personalizacion**: Igual que Opcion A — no se pide nombre/avatar.
- **Ligeramente mas complejo**: Requiere el overlay + transicion, ademas de los tooltips.

### Complejidad de implementacion: **Baja-Media**
- Overlay semitransparente sobre el globo (CSS + 1 flag).
- Transicion fade-out al cerrar.
- Modificar `LoadingScreen.tsx` para incluir branding durante la carga.
- Tooltips: identicos a Opcion A.

### Impacto UX estimado: **Medio-Alto**
- El "momento wow" mejora la primera impresion (dato: +80% retencion con quick wins tempranos). El branding crea percepcion de calidad. Los tooltips eliminan friccion.

---

## Opcion C: "Tu pasaporte, tu aventura" — Personalizacion rapida + tooltips

### Concepto
Antes de mostrar el globo, una micro-interaccion de 2 pasos (~15-20 segundos) donde el usuario elige su nombre y avatar. Esto genera apego inmediato ("es MI pasaporte") y aprovecha el patron de Duolingo/Khan Academy de personalizar temprano. Seguido de los tooltips contextuales.

### Flujo paso a paso

**Paso 0a — Pantalla de bienvenida con personalizacion (primera ejecucion)**

```
┌─────────────────────────────────────┐
│                                     │
│           [logo GeoExpert]          │
│                                     │
│     Descubre el mundo jugando       │
│                                     │
│     Como te llamas?                 │
│     ┌─────────────────────────┐     │
│     │  Explorador             │     │
│     └─────────────────────────┘     │
│                                     │
│          [ Siguiente > ]            │
│                                     │
└─────────────────────────────────────┘
```

- Campo de texto pre-rellenado con "Explorador" (el usuario puede cambiarlo o dejarlo).
- El globo carga en background mientras el usuario escribe.

**Paso 0b — Selector de avatar**

```
┌─────────────────────────────────────┐
│                                     │
│       Elige tu companero            │
│       de viaje                      │
│                                     │
│    🦁  🐻  🦊  🐼  🐸  🦉        │
│    🐙  🦜  🐺  🦈  🐢  🦋        │
│                                     │
│    (leon seleccionado por defecto)  │
│                                     │
│      [ Explorar el globo ]          │
│                                     │
└─────────────────────────────────────┘
```

- Grid de 12 avatares (los que ya existen en `avatars.ts`).
- Leon pre-seleccionado (consistente con el default actual).
- "Explorar el globo" cierra el flujo y aterriza en Explorar.

**Pasos 1-3: Identicos a Opcion A**
- Tooltip del globo, Tooltip de Jugar, Tooltip de Pasaporte.

### Trigger
- Pasos 0a y 0b solo en primera ejecucion (flag `onboarding.profileSetupSeen`).
- Tooltips: igual que Opcion A.

### Dismiss / Skip
- Paso 0a: "Siguiente" avanza. No hay skip — pero el campo viene pre-rellenado, asi que un tap en "Siguiente" es suficiente para saltarlo sin escribir nada.
- Paso 0b: avatar pre-seleccionado. Un tap en "Explorar el globo" confirma el default sin elegir.
- En la practica, el "skip" es aceptar los defaults (2 taps para pasar los 2 pasos).

### Persistencia
- Se muestra 1 sola vez. El nombre y avatar se guardan en el perfil existente.
- No re-activable como onboarding (el usuario puede editar nombre/avatar desde el header en cualquier momento).

### Pros
- **Personalizacion genera apego**: Para un nino de 8-15 anos, elegir nombre y avatar es parte de la diversion (patron Khan Academy).
- **"Es MI pasaporte"**: Cuando el usuario vea "Pasaporte de [su nombre]" en vez de "Pasaporte de Explorador", la conexion emocional es mayor.
- **Uso real del sistema de perfiles**: El sistema ya soporta nombres y avatares personalizados — esta opcion lo activa desde el inicio.
- **Tooltips contextuales**: Misma guia practica que las opciones A y B.

### Contras
- **2 pantallas antes del globo**: Retrasa el "momento wow" entre 10-20 segundos. Esto va contra el principio de inmersion directa.
- **Pedir input al usuario antes de mostrar valor**: NNG y Apple desaconsejan pedir configuracion antes de que el usuario haya visto la app. El usuario no sabe por que eligiria un avatar si no sabe para que es la app.
- **Mas complejo**: 2 pantallas nuevas con input de texto + grid de avatares + integracion con el store.
- **El 72% valora onboarding < 60 segundos**: Aunque 2 pasos estan dentro del limite, cada paso adicional incrementa abandono.
- **El campo de nombre puede ser incomodo**: Un nino podria no querer escribir su nombre real, y "Explorador" como default es menos personal de lo que parece.

### Complejidad de implementacion: **Media**
- 2 pantallas nuevas (nombre + avatar).
- Input de texto con teclado virtual (gestion de focus en movil).
- Integracion con `appStore` para guardar nombre/avatar antes de mostrar el globo.
- Tooltips: identicos a Opcion A.

### Impacto UX estimado: **Medio**
- La personalizacion genera apego, pero el retraso del globo reduce el impacto del "momento wow". Equilibrio neto positivo pero no tan claro como la Opcion B.

---

## Tabla comparativa

| Criterio | A: Tooltips | B: Wow + Tooltips | C: Perfil + Tooltips |
|----------|-------------|-------------------|----------------------|
| Pasos antes del globo | 0 | 1 (5s) | 2 (15-20s) |
| "Momento wow" | No | Si | Parcial |
| Personalizacion | No | No | Si |
| Elimina friccion del globo | Si | Si | Si |
| Elimina friccion de Jugar | Si | Si | Si |
| Explica Pasaporte | Si | Si | Si |
| Complejidad | Baja | Baja-Media | Media |
| Impacto UX | Medio | Medio-Alto | Medio |
| Tiempo total onboarding | ~10s (distribuido) | ~15s (5s + distribuido) | ~30s (20s + distribuido) |
| Riesgo de abandono | Muy bajo | Bajo | Moderado |

---

## Recomendacion: Opcion B — "Bienvenido, explorador"

Recomiendo la **Opcion B** por las siguientes razones:

1. **Equilibrio optimo entre impacto y minimalismo**. Una sola pantalla de 5 segundos transforma la primera impresion sin ser invasiva. Los datos muestran que un "quick win" temprano (ver algo impactante) aumenta la retencion un 80%.

2. **El globo como protagonista**. En lugar de ocultar el globo detras de pantallas de configuracion, la Opcion B lo enmarca: el globo gira detras del overlay de bienvenida. El diferenciador de GeoExpert (el globo 3D) es visible desde el segundo 0.

3. **Branding en la primera impresion**. Actualmente la app abre con "Cargando globo..." — una oportunidad perdida. La Opcion B aprovecha ese momento para presentar la identidad de la app.

4. **Baja complejidad de implementacion**. Es la Opcion A + 1 overlay con transicion. No requiere inputs de usuario, teclado virtual ni pantallas nuevas complejas.

5. **Alineada con la investigacion**. NNG recomienda tooltips contextuales. Apple recomienda no bloquear con configuracion. Duolingo usa progressive disclosure. La Opcion B toma lo mejor de cada patron sin ninguno de sus anti-patrones.

La **Opcion A** es una alternativa solida si se prefiere la maxima simplicidad (0 pantallas extra). La **Opcion C** se descarta como opcion principal porque retrasa el globo — pero la personalizacion de nombre/avatar podria implementarse como feature independiente fuera del onboarding (por ejemplo, un prompt suave tras la primera partida completada).

### Nota sobre la personalizacion
Si se quiere incorporar la personalizacion sin retrasar el globo, una variante hibrida seria: usar la Opcion B para el onboarding inicial, y tras completar la primera sesion de Jugar, mostrar un modal que invite a personalizar nombre y avatar ("Has ganado tu primer punto. Ponle nombre a tu pasaporte."). Esto sigue el patron de Duolingo de pedir registro/personalizacion DESPUES de que el usuario haya probado la app.
