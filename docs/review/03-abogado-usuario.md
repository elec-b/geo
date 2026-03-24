# Revision de backlog: Perspectiva del usuario

> Analisis desde la perspectiva del usuario final (publico principal: 8-15 anos, pero tambien adultos).

---

## Flujo por flujo

### Primera apertura

**Que ve el usuario**: Una pantalla de carga ("Cargando globo...") con un spinner. Luego aparece el globo en una posicion aleatoria con el header (avatar + iconos de estadisticas y configuracion) y el tab bar (Jugar, Explorar, Pasaporte). No hay onboarding, tutorial ni pista de que hacer.

**Problemas detectados**:

1. **Sin onboarding ni guia inicial**: Un usuario de 12 anos que abre la app por primera vez ve un globo bonito con 3 pestanas, pero no tiene claro cual tocar primero ni que hace cada una. No hay mensaje de bienvenida, tooltip ni flujo guiado. El tab que se abre por defecto (segun los TABS: Jugar) muestra directamente el selector con "Elige continente / Elige nivel / Elige juego", que puede abrumar a alguien que no conoce la mecanica.

2. **El perfil se crea sin presentacion**: El perfil "Explorador" aparece por defecto sin que el usuario sepa que puede personalizarlo (nombre + avatar). Un adolescente que comparte tablet con su hermano no descubrira los perfiles hasta que toque el avatar por curiosidad.

3. **No hay contexto sobre la mecanica de progresion**: Conceptos como "Turista/Mochilero/Guia", "sellos", "pruebas de sello" no se introducen en ningun lugar. El usuario tiene que deducir la mecanica por exploracion, lo cual es un deficit importante para los mas jovenes.

4. **La pantalla de carga es minimalista**: Solo "Cargando globo..." con spinner. No hay branding, logo de la app ni pista de que es GeoExpert. Una primera impresion desaprovechada para generar entusiasmo.

### Explorar

**Flujo**: El usuario ve el globo con controles superiores (Globo/Tabla, pills de continente, toggles Paises/Capitales). Puede tocar un pais para ver su ficha.

**Aspectos positivos**:
- La ficha de pais es completa y bien organizada (bandera, datos, ranking, Wikipedia).
- El drag-to-dismiss del bottom sheet es natural en iOS.
- Los filtros de continente con flyTo dan buena respuesta visual.
- La tabla con ordenamiento es util para repasar.

**Problemas detectados**:

1. **Segmented "Globo / Tabla" poco descriptivo**: "Globo" y "Tabla" son nombres tecnicos. Para un usuario de 12 anos, "Paises" y "Lista" serian mas intuitivos. Ademas, el nombre "Tabla" en Explorar no sugiere que toque un pais en la tabla y el globo salte a el.

2. **Toggles "Paises" y "Capitales" no son evidentes**: Son botones de texto plano sin icono ni indicador visual claro de que son toggles on/off. Un usuario podria no verlos o no entender que son activables. No tienen estado visual claro cuando estan activos vs inactivos (depende del CSS, pero al ser botones flotantes sobre un globo oscuro, la affordance es baja).

3. **El toggle "no-ONU" en la tabla esta escondido**: Solo aparece dentro de la tabla, no hay indicacion previa de que existen territorios no-ONU. Un usuario curioso que busque Puerto Rico o Hong Kong no los encontrara hasta activar ese toggle.

4. **El orden de los tabs no favorece la exploracion**: Los tabs son "Jugar, Explorar, Pasaporte". Para un usuario nuevo, lo natural seria que "Explorar" fuera la puerta de entrada (bajo presion, sin reto). El tab seleccionado por defecto deberia ser Explorar en la primera sesion, o al menos haber una indicacion de empezar por ahi.

### Jugar

**Flujo**: Selector (continente -> nivel -> tipo) -> Sesion de juego -> Modal de fin.

**Aspectos positivos**:
- La Aventura como opcion destacada es un buen default.
- Los mensajes motivadores en pruebas de sello fallidas estan bien calibrados.
- La herencia entre niveles evita repeticion innecesaria.
- El feedback de 2 pasos en A/B (rojo -> verde) es didactico.
- El banner "Listo para las pruebas de sello" es buena guia.
- La barra de progreso ponderada da informacion util.

**Problemas detectados**:

1. **Selector de juego con demasiados pasos**: 3 selecciones secuenciales (continente, nivel, tipo) antes de poder jugar. Para un usuario que vuelve cada dia, es mucho ceremonial. El boton "Continuar" (que aparece si ya hay intentos) mitiga parcialmente esto, pero sigue requiriendo ver el selector completo. Un "Continuar donde lo dejaste" rapido desde el home seria valioso.

2. **La nomenclatura de tipos es criptica para un adolescente**: Los iconos de tipos (circulo?, circulo-flecha-circulo, etc.) son elegantes pero abstractos. Un usuario de 12 anos no va a entender intuitivamente que "circulito?, circulito-flecha-circulito" significa "Identifica pais" o "Pais a capital". Los nombres largos debajo ayudan, pero el primer vistazo es confuso. Sin embargo, esto se mitiga parcialmente porque la Aventura (default) no requiere esta eleccion.

3. **No hay boton de "Salir" visible durante la partida**: El unico modo de salir de una sesion activa es volver a tocar el tab "Jugar" (que dispara el resetSignal). Esto no es descubrible. Un usuario que quiera cambiar de continente o de tipo tiene que deducir que tocar "Jugar" otra vez lo lleva al selector. No hay boton X, flecha atras ni gesto de escape visible.

4. **El feedback de error en C/D/E/F es fugaz**: El overlay verde/rojo al 5% de opacidad es muy sutil. Con un filtro a 5% de opacidad, muchos usuarios (especialmente en pantallas con brillo bajo) podrian no percibir el feedback. El feedback se basa en el color de los botones (verde/rojo en ChoicePanel), pero al ser transitorio (1.2s acierto, 2.5s error), un usuario distraido podria no ver cual era la respuesta correcta.

5. **Sin modo "practica libre" o repeticion selectiva**: Si un usuario falla sistematicamente con los paises del sudeste asiatico, no puede elegir "practicar solo estos 5 paises". El algoritmo los reprioriza, pero el usuario no tiene control.

6. **El concepto "dominado" es binario y poco explicado**: "1 de Y paises dominados" aparece en la barra de progreso para tipos concretos, pero el usuario no sabe que "dominar" = un solo acierto. Puede parecer demasiado facil (lo acerte una vez y ya?) o el usuario puede no entender por que un pais que fallo 4 veces y acerto 1 ya "esta dominado".

7. **Prueba de sello: 0 errores sin advertencia del volumen**: El usuario que pulsa "Sello de Paises" en Guia-Europa no sabe que va a tener que acertar ~50 paises seguidos sin fallar. El modal dice "completala sin errores" pero no dice "vas a tener que ubicar los 50 paises de Europa". La cuenta aparece en la barra de progreso una vez empezada, pero para entonces ya esta comprometido. Para un adolescente, descubrir que son 50 preguntas sin error puede ser frustrante.

### Pasaporte

**Flujo**: Matriz 5x3 con sellos. Tocar celda pendiente -> modal para elegir tipo de sello.

**Aspectos positivos**:
- La metafora del pasaporte con sellos circulares y estetica guilloche es premium.
- La animacion stampDrop es un momento de deleite.
- La leyenda (circulo = Pais, circuloConPunto = Capital, estrella = Conseguido) esta presente.
- El "Nivel global" en el header es un buen resumen.

**Problemas detectados**:

1. **La matriz 5x3 es densa en pantallas pequenas**: 15 celdas + headers + leyenda en un iPhone SE o similar. Cada celda tiene 2 sellos diminutos + un numero de paises. La informacion se comprime mucho y puede ser dificil de parsear visualmente, especialmente para ninos.

2. **No hay indicacion de "que hacer ahora"**: Un usuario con el pasaporte mayoritariamente vacio (inicio) ve 15 celdas con candados y una sola fila desbloqueada. No hay texto del tipo "Empieza jugando en Turista para desbloquear sellos". Solo la leyenda silenciosa. El usuario tiene que volver a Jugar por su cuenta.

3. **Los sellos pendientes pulsan pero el feedback es un modal generico**: Cuando el usuario toca una celda con sellos pendientes, aparece un modal con "Prueba de sello - Turista - Europa" y botones "Sello de Paises / Sello de Capitales". No hay indicacion de si el usuario esta preparado (cuanto ha practicado, que porcentaje domina). Podria ser frustrante lanzarse a una prueba de 50 paises sin saber que solo domina el 30%.

4. **Los sellos "ganados" no comunican que continente representan visualmente**: Los colores por continente (olimpicos) estan, pero sin etiqueta de texto en el sello mismo. Un usuario daltronico o que no ha memorizado los colores no distinguira entre sellos de distintos continentes dentro de la celda.

### Estadisticas

**Flujo**: Accesible desde el icono de barras en el header. Tabla con indicadores por pais y tipo.

**Problemas detectados**:

1. **Los iconos de tipos de juego en los headers son muy pequenos**: En una tabla de 6 columnas (circulo?, circulo-flecha-circulito, ...) en una pantalla de telefono, cada header tiene ~50px de ancho. Los simbolos Unicode compuestos son ilegibles a ese tamano.

2. **La tabla es util pero no accionable**: Un usuario ve que tiene X roja en "Senala el pais" para Alemania, pero no puede tocar esa celda para practicar Alemania especificamente. Es informacion pasiva. Para un adolescente, una tabla densa de checkmarks y cruces no es motivante.

3. **El reset de estadisticas es destructivo y nervioso**: El boton de reset borra TODOS los tipos de un nivel-continente de golpe. Un usuario que quiera re-practicar solo "Pais a capital" para Europa tiene que borrar TODO su progreso de Europa, incluyendo los tipos que ya domina. Esto puede ser un golpe duro, especialmente si el usuario no entiende las consecuencias.

4. **El toggle checkmark/porcentaje es poco descubrible**: Es un boton sin contexto claro. Un usuario que nunca lo toque no vera los porcentajes de acierto.

5. **La pantalla es fullscreen sin navegacion clara**: El acceso es desde el icono del header, pero no hay boton de "volver" evidente. La navegacion depende de un boton X o gesto. (Requiere verificacion del CSS/comportamiento, pero el componente StatsView recibe un `onClose` — necesita un affordance visual de salida).

### Configuracion

**Flujo**: Engranaje en header -> Bottom sheet con toggles.

**Aspectos positivos**:
- Ultra-sencilla, cumple la filosofia de "funcionar out of the box".
- Handle visual + drag-to-dismiss es coherente con la ficha de pais.

**Problemas detectados**:

1. **"Marcadores de microestados y archipielagos" es un termino tecnico**: Un usuario de 12 anos no sabe que es un "microestado" ni un "archipielago" en este contexto. Algo como "Marcadores de islas y paises pequenos" o simplemente "Marcadores en el mapa" seria mas accesible.

2. **Idioma y Tema marcados como "Proximamente" son visibles sin utilidad**: Mostrar features deshabilitadas puede generar expectativa frustrada ("cuando estara?") o percepcion de app incompleta. Aunque hay un argumento valido de transparencia, para un usuario joven esto puede restar en la percepcion de calidad.

3. **No hay opcion de volumen/sonido**: La app no tiene efectos de sonido (segun DESIGN.md "por ahora"), pero tampoco un toggle preparado. Si se anaden sonidos en el futuro, el toggle aparecera de la nada, cambiando la interfaz.

---

## Gaps de UX no contemplados en el backlog

### 1. Sin onboarding / tutorial de primera ejecucion
No hay tarea en el backlog para un flujo de primera ejecucion que guie al usuario. Esto es especialmente critico dado el publico objetivo (8-15 anos). No hace falta un tutorial largo: 3-4 pantallas (o tooltips modales) explicando "Explora el globo", "Juega para aprender", "Llena tu pasaporte" bastarian.

### 2. Sin boton de "Salir" o "Volver" durante las sesiones de juego
El unico mecanismo para salir de una sesion activa es tocar de nuevo el tab "Jugar" (resetSignal). No hay un boton explicito visible durante la partida. Esto no esta documentado como tarea de mejora.

### 3. Sin indicador de preparacion antes de pruebas de sello
Cuando el usuario va a intentar una prueba de sello (desde Pasaporte o desde un modal), no se muestra cuantos paises domina ni cual es su nivel de preparacion. El backlog no contempla anadir un indicador tipo "Dominas X de Y paises para esta prueba".

### 4. Sin celebracion al subir de nivel
Cuando el usuario consigue ambos sellos de un nivel-continente y desbloquea el siguiente nivel, no hay celebracion ni modal especifico. El usuario descubre el desbloqueo la proxima vez que abre el selector o el pasaporte. Es un momento de progresion importante desperdiciado.

### 5. Sin accesibilidad para daltronismo
Los colores son fundamentales en la app: continentes olímpicos, feedback verde/rojo, colores en estadisticas. No hay modo alto contraste ni alternativa para daltronicos. No esta en el backlog.

### 6. Sin racha o estadistica motivacional global
No hay un indicador de "racha diaria" (cuantos dias seguidos ha jugado), "paises aprendidos esta semana" ni similares. Para un publico joven, estas metricas gamificadas son motivadores potentes. No esta en el backlog.

### 7. Sin animacion o transicion entre pestanas
El cambio entre Jugar, Explorar y Pasaporte es un corte seco (un tab se muestra, otro desaparece). No hay transicion suave. Para una app que aspira a ser "premium", las transiciones entre vistas son esperables.

### 8. Sin retroalimentacion de progreso a largo plazo
El usuario no tiene una vista de "cuanto has aprendido en total" (n. de paises que puede ubicar, comparacion con la primera semana, etc.). El Pasaporte muestra sellos (binario), las estadisticas muestran dominio por tipo (granular), pero no hay un resumen motivacional del tipo "Ya conoces 87 de 195 paises".

### 9. Sin pista / ayuda durante el juego
Si un usuario de 10 anos no sabe donde esta Kirguistan, no tiene ningun mecanismo de ayuda. No hay boton de pista, zoom al area general ni "saltear pregunta". El algoritmo lo reprioriza despues de fallar, pero la experiencia inmediata es de fracaso sin salida.

### 10. Sin confirmacion al salir de una prueba de sello en curso
Si el usuario esta en pregunta 47 de 50 de una prueba de sello y toca el tab "Explorar", pierde toda la prueba sin advertencia. El backlog menciona esta preocupacion en "Muy muy opcional" pero solo para salir a otra app (que ya funciona parcialmente). El caso de tocar otro tab deberia tener al menos un dialogo de confirmacion ("Estas en una prueba de sello. Si sales, perderas el progreso").

---

## Priorizacion de mejoras por impacto

Ordenadas de mayor a menor impacto en la experiencia de usuario:

1. **Boton de salir/volver durante sesiones de juego** — Impacto critico. El usuario queda "atrapado" en la sesion sin descubrir que tocar de nuevo el tab Jugar es la salida. Es un problema de usabilidad basica que afecta a todos los usuarios.

2. **Onboarding / primera ejecucion** — Impacto alto. Sin guia, un usuario de 12 anos puede abandonar en los primeros 2 minutos. 3-4 pantallas modales bastarian. Especialmente relevante pre-lanzamiento.

3. **Indicador de preparacion pre-prueba de sello + volumen de la prueba** — Impacto alto. El modal deberia decir "Tendras que ubicar 50 paises sin errores. Dominas 43 de 50". Evita frustración al descubrirlo despues de empezar.

4. **Celebracion al desbloquear un nuevo nivel** — Impacto medio-alto. Es un momento de maxima recompensa que actualmente pasa desapercibido. Una animacion + modal celebratorio cuando se consiguen los 2 sellos reforzaria enormemente la motivacion.

5. **Confirmar salida durante prueba de sello** — Impacto medio. Perder una prueba de sello en la pregunta 47/50 por un tap accidental es una experiencia devastadora. Un dialogo simple lo previene.

6. **Simplificar terminologia de Configuracion** — Impacto bajo-medio. "Microestados y archipielagos" es jerga. Cambio rapido, mejora la percepcion de accesibilidad.

7. **Estadistica motivacional global / resumen de progreso** — Impacto medio para retencion. Un "Ya conoces X de 195 paises" en algun lugar visible (home? pasaporte?) reforzaria el sentido de logro a largo plazo.

8. **Rachas diarias u otro motivador temporal** — Impacto medio para retencion a largo plazo. Estandar en apps de aprendizaje (Duolingo, etc.). No urgente pero relevante post-lanzamiento.

9. **Accesibilidad para daltonismo** — Impacto bajo en volumen (8% hombres, 0.5% mujeres) pero alto en inclusion. Patrones o iconos complementarios al color resolverian la mayoria de casos.

10. **Transiciones animadas entre pestanas** — Impacto bajo en funcionalidad, medio en percepcion premium. Es un pulido estetico que puede abordarse al final.

---

## Observaciones sobre DESIGN.md

1. **El tab por defecto no esta especificado**: DESIGN.md no define cual es el tab que se muestra al abrir la app. Segun el codigo (`types.ts: TABS[0]`), es "Jugar", lo cual puede no ser optimo para nuevos usuarios que no entienden la mecanica. Podria beneficiarse de una regla: "Primera sesion -> Explorar; sesiones posteriores -> ultimo tab usado".

2. **La seccion de Pruebas de sello dice "0 errores requeridos" pero no menciona cuantas preguntas**: DESIGN.md deberia especificar que la prueba incluye el 100% de los paises del nivel-continente (lo hace, pero de forma dispersa). El usuario deberia saberlo antes de empezar.

3. **No hay definicion de "primera ejecucion"**: DESIGN.md no contempla el flujo de primera apertura de la app. Para una app con publico joven, este flujo es critico.

4. **El texto de los modales de "Ya dominas" sugiere "resetea estadisticas"**: Este mensaje es confuso. Un usuario de 12 anos no deberia verse animado a resetear estadísticas como flujo normal. Seria mas natural sugerir "Sube de nivel" o "Prueba otro continente".

5. **La filosofia "sin menús complicados" entra en tension con el selector de Jugar**: El selector de Jugar tiene 3 niveles de seleccion (continente, nivel, tipo) con un toggle colapsable adicional. Para una app que busca ser "ultra-sencilla", es un flujo relativamente complejo. Aventura como default mitiga esto, pero el selector sigue siendo lo primero que ve el usuario al abrir "Jugar".
