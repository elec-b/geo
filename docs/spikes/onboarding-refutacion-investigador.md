# Refutación: Investigación UX de Onboarding

**Fecha**: 2026-03-25
**Rol**: Abogado del diablo / Refutador
**Documento refutado**: `onboarding-investigacion-ux.md`

---

## Resumen

La investigación UX está bien estructurada y cubre las tendencias generales de la industria, pero comete un error fundamental: **trata a GeoExpert como si fuera una app de geografía más**, cuando en realidad es un sistema de aprendizaje con una complejidad mecánica significativamente mayor que cualquiera de las apps analizadas. La conclusión de "2-3 tooltips contextuales" puede ser insuficiente para un producto con 6 tipos de quiz, 3 niveles × 5 continentes, sellos con requisito de 0 errores y un algoritmo adaptativo invisible.

---

## Puntos débiles del análisis

### 1. Sesgo de selección grave: las apps comparadas no son comparables

El investigador compara GeoExpert con Seterra, Stack the Countries, GeoGuessr y StudyGe. Ninguna de estas apps tiene la complejidad mecánica de GeoExpert:

| App | Mecánicas simultáneas | Complejidad |
|-----|----------------------|-------------|
| **Seterra** | 1 tipo de quiz (señalar en mapa) | Baja |
| **Stack the Countries** | 1 mecánica (apilar) + flashcards | Baja |
| **GeoGuessr** | 1 mecánica (adivinar ubicación) | Baja |
| **StudyGe** | Mapa + quiz simple | Baja |
| **GeoExpert** | 6 tipos de quiz + modo Aventura adaptativo + 3 niveles × 5 continentes + sellos con 0 errores + pasaporte + algoritmo de etapas | **Alta** |

El argumento "las apps de geografía no usan onboarding" es como decir "los carritos de golf no necesitan manual de conducción, por lo tanto un coche con cambio manual tampoco". La complejidad subyacente es de orden diferente. GeoExpert tiene más en común mecánicamente con un RPG progresivo que con un quiz de geografía.

### 2. Sesgo de supervivencia no reconocido

La investigación analiza solo apps exitosas (Duolingo con 500M+ descargas, Seterra adquirida por GeoGuessr). Las apps de geografía que fracasaron por falta de guía al usuario no aparecen en el análisis. Afirmar que "ninguna usa onboarding modal" basándose solo en las supervivientes es una falacia. Es posible que muchas apps con interfaces complejas fracasaran precisamente porque los usuarios no entendieron qué hacer.

### 3. El público objetivo (8-15 años) se descarta sin evidencia

El investigador afirma que el público joven es "nativo digital, acostumbrado a descubrir interfaces por exploración". Esta es una generalización sin fuente específica. La investigación de desarrollo cognitivo (Piaget, Vygotsky) sugiere lo contrario:

- **8-11 años** (operaciones concretas): necesitan instrucciones más explícitas; la capacidad de inferir reglas abstractas de una interfaz es limitada.
- **12-15 años** (operaciones formales tempranas): mejor capacidad exploratoria, pero aún en desarrollo.

Que un niño de 10 años sepa usar TikTok (interfaz de un solo gesto: scroll) no implica que pueda descubrir por sí solo que GeoExpert tiene 6 tipos de juego con progresión pedagógica, que el modo Aventura se adapta, que los sellos requieren 0 errores, o que hay 3 niveles por continente. **No se citó ni un solo estudio sobre onboarding en apps para niños**.

### 4. Estadísticas sin contexto ni aplicabilidad verificable

La sección de datos cuantitativos mezcla fuentes de distinta fiabilidad:

- **Business of Apps**: fuente agregada razonable para promedios de retención.
- **UserGuiding**: es una empresa que *vende herramientas de onboarding*. Sus estadísticas ("onboarding optimizado = 40%+ D1", "+80% con quick wins", "+52% D30") tienen un conflicto de interés evidente. ¿Aplican a una app de niños sobre geografía con globo 3D, o a SaaS B2B (el mercado principal de UserGuiding)?

Además, las cifras se presentan sin contexto de las apps o segmentos donde se midieron. "+40% retención con onboarding personalizado" no es lo mismo en una app de productividad para adultos que en un juego educativo para niños.

### 5. Contradicción interna: los datos apoyan más onboarding, la conclusión menos

Es llamativo que la investigación presenta datos *a favor* de un onboarding más robusto y luego concluye lo mínimo:

- "+80% retención con quick wins tempranos" → pero la conclusión no propone quick wins estructurados.
- "+50% completion con gamificación en onboarding" → pero la conclusión no propone gamificar el onboarding.
- "+22% completion con barra de progreso" → pero la conclusión no incluye progreso en el onboarding.
- "72% valoran completar onboarding en <60s" → esto implica que **sí quieren un onboarding**, solo que breve.
- "+52% retención D30 con onboarding estructurado" → pero se recomienda solo tooltips.

Los propios datos del investigador sugieren que un onboarding breve pero *estructurado y gamificado* supera con creces a "2-3 tooltips". La conclusión parece ignorar parcialmente sus propios hallazgos.

### 6. "La interfaz ya es intuitiva" es una afirmación no verificada

El investigador afirma que "globo 3D + 3 tabs sigue patrones familiares". Pero:

- **Girar un globo** es intuitivo, sí.
- **Entender que hay 6 tipos de quiz organizados en 3 etapas pedagógicas** no lo es.
- **Entender que el modo Aventura elige automáticamente el tipo según tu progreso** no lo es.
- **Entender que los sellos requieren 0 errores en TODOS los países** no lo es.
- **Entender la relación nivel-continente y cómo desbloquear niveles** no lo es.
- **Entender la diferencia entre Jugar y las pruebas de sello** no lo es.

Que la *navegación* sea intuitiva (tab bar, globo) no significa que la *mecánica de juego* sea autoexplicativa. Son dos cosas distintas que el análisis confunde.

### 7. Gaps de investigación significativos

No se investigó:

- **Onboarding en apps para niños específicamente**: ni Seterra ni Duolingo tienen como target primario niños de 8-15.
- **Onboarding en juegos con mecánicas complejas**: el ejemplo de Clash Royale (5 tutoriales cortos con andamiaje decreciente) se menciona pero no se aplica a la recomendación. ¿Por qué no? GeoExpert tiene más mecánicas que Clash Royale.
- **Apps educativas con sistemas de progresión por niveles**: ¿Cómo manejan Prodigy Math, DragonBox o ABCmouse el onboarding? Son comparables más directos que Seterra.
- **Tasa de abandono por confusión mecánica** vs. por tutorial largo: se asume que el mayor riesgo es un tutorial molesto, pero ¿qué pasa si el mayor riesgo es que el usuario no entienda qué hacer?
- **El efecto del "descubrimiento tardío"**: si un usuario descubre los sellos o el modo Aventura después de 3 sesiones, ¿cuánto engagement se perdió? No se explora este coste de oportunidad.

---

## Lo que está bien argumentado

1. **Los anti-patrones están bien identificados**: Tutorial tipo "deck of cards" de 4+ pantallas, bloquear contenido con onboarding obligatorio, explicar lo obvio (un tab bar) y pedir permisos al principio son errores genuinos que GeoExpert debe evitar.

2. **Progressive disclosure es el enfoque correcto**: Revelar la complejidad gradualmente es claramente mejor que un dump de información. Esto no está en disputa.

3. **NNG como fuente principal es sólido**: Nielsen Norman Group es una fuente de alta calidad para principios generales de UX.

4. **La identificación de qué NO necesita explicación es acertada**: Girar el globo, tocar un país, navegar tabs — correcto, no necesitan onboarding.

5. **El enfoque "learn by doing" es válido como principio**: Que la mejor enseñanza sea jugando es correcto. La cuestión es *cuánto andamiaje necesita ese "doing"*.

---

## Conclusión: ¿cambian las conclusiones?

**Parcialmente sí.** La recomendación de "2-3 tooltips contextuales" puede ser correcta como *mínimo viable* para la navegación, pero es probablemente insuficiente para las mecánicas de juego. El análisis subestima la complejidad real de GeoExpert al compararlo con apps de una sola mecánica.

Los puntos que sobreviven de la investigación:
- No hacer tutorial frontal largo (correcto).
- Usar progressive disclosure (correcto).
- No explicar lo que ya es intuitivo (correcto).

Los puntos que necesitan revisión:
- **La recomendación final necesita más estructura**: algo entre "2-3 tooltips" y "tutorial largo" — posiblemente un onboarding breve gamificado (una mini-partida guiada) que aproveche los datos que el propio investigador encontró (+80% retención con quick wins, +50% con gamificación).
- **El público infantil necesita atención específica**: no se puede asumir que niños de 8-10 años descubren mecánicas complejas solos.
- **Las mecánicas propias de GeoExpert (sellos, niveles, aventura adaptativa) necesitan un momento de descubrimiento planificado**, no solo un tooltip eventual.

La conclusión del investigador apunta en la dirección correcta (menos es más, contextual > frontal) pero se queda corta en reconocer que GeoExpert necesita *más andamiaje* que las apps con las que se compara, precisamente porque es más ambiciosa.
