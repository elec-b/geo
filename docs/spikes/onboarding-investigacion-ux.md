# Spike: Investigación UX de Onboarding

**Fecha**: 2026-03-25
**Objetivo**: Investigar patrones de onboarding en apps de geografía y educativas premium para informar el diseño del onboarding de GeoExpert.

---

## Resumen ejecutivo

El consenso de la industria en 2025-2026 es claro: **menos es más**. Las apps educativas exitosas (Duolingo, Khan Academy) no usan tutoriales frontales largos — usan *progressive disclosure* y *learn by doing*. Nielsen Norman Group recomienda evitar onboarding siempre que sea posible e invertir en mejor diseño de UI. Las apps de geografía (Seterra, Stack the Countries) prácticamente no tienen onboarding: dejan que el usuario explore directamente. Para GeoExpert, con su interfaz intuitiva de globo + tabs, un onboarding de 2-3 tooltips contextuales es el enfoque correcto.

---

## 1. Patrones encontrados en apps de referencia

### 1.1 Apps de geografía

#### Seterra (adquirida por GeoGuessr en 2022)
- **Sin onboarding formal**: el usuario abre la app y elige directamente una categoría (continentes, países, capitales, banderas).
- **Patrón**: *inmersión directa*. La interfaz es lo suficientemente simple como para no necesitar explicación.
- **Personalización mínima**: el usuario elige modo (cronometrado vs. relajado) sobre la marcha, no en un flujo de setup.

#### Stack the Countries
- **Onboarding implícito**: el juego empieza con niveles fáciles que enseñan la mecánica (tocar, mover, apilar países).
- **Flash cards como warm-up**: ofrece 193 tarjetas de países como recurso de estudio previo al juego, pero no es obligatorio.
- **Patrón**: *learn by doing* — el primer nivel ES el tutorial.

#### GeoGuessr
- **Primer contacto por gameplay**: lanza al usuario a una partida con pistas contextuales mínimas.
- **Sin tutorial explícito**: la mecánica (mirar Street View, colocar pin en mapa) se descubre jugando.

#### StudyGe
- **Exploración libre del mapa** como punto de entrada, con quizzes accesibles desde la navegación.
- **Sin flujo de onboarding**: el mapa interactivo IS la experiencia.

**Conclusión apps de geografía**: Ninguna usa onboarding modal o tutorial. Todas confían en que la interfaz del mapa/quiz se explica sola. El patrón dominante es *inmersión directa + dificultad progresiva*.

### 1.2 Apps educativas gamificadas

#### Duolingo (500M+ descargas)
- **Flujo de 7 pasos en móvil**: selección de idioma → motivación → nivel previo → objetivo diario → mini-lección → signup.
- **Registro diferido (gradual engagement)**: el usuario hace una mini-lección ANTES de crear cuenta. Experimentaron y confirmaron que dejar al usuario probar antes de pedir credenciales mejora retención día 1.
- **Progressive disclosure**: no muestra ligas, quests ni streak freezes el día 1. Cada mecánica aparece cuando el usuario tiene contexto para valorarla.
- **Tooltips in-context**: slideout modals durante lecciones guían interacciones nuevas, no en un tutorial previo.
- **Personalización como hook**: las preguntas iniciales (¿por qué aprendes? ¿cuánto tiempo diario?) no solo recopilan datos — hacen que el usuario sienta que la app se adapta a él.

#### Khan Academy
- **Avatar como primer paso**: el usuario elige un avatar, creando sentido de propiedad.
- **Selección de materia inmediata**: después del avatar, elige qué estudiar y empieza.
- **Gamificación gradual**: puntos y badges aparecen orgánicamente al completar ejercicios, no se explican por adelantado.

#### Quizlet (60M usuarios mensuales)
- **Onboarding por creación**: el acto de crear un set de flashcards ES el onboarding — el usuario aprende la herramienta usándola.
- **Sin tutorial**: la interfaz de estudio es lo suficientemente familiar (flashcards) para no necesitar explicación.

### 1.3 Patrones de la industria de juegos móviles

#### Apple Developer Guidelines (oficiales)
- **Enseñar el core loop** con tutoriales cortos y segmentados (no uno largo).
- **Dar rol activo al jugador** durante el onboarding — nada de pantallas pasivas.
- **Ofrecer skip**: algunos jugadores ya conocen la mecánica o quieren empezar inmediatamente.
- **No mostrar splash screens, acuerdos ni disclaimers** al lanzar.
- **Diferir contenido no esencial** (ratings, push notifications, torneos) hasta después del onboarding.
- **Permitir re-jugar tutoriales** y acceso a sección "Cómo jugar".

#### Ejemplo destacado: Clash Royale
- Divide el onboarding en **5 tutoriales cortos**.
- Los primeros son más guiados; los últimos retan al jugador a aplicar lo aprendido.
- Patrón: *andamiaje decreciente* (scaffolding que se retira gradualmente).

---

## 2. Tendencias actuales (2025-2026)

| Tendencia | Descripción | Adopción |
|-----------|-------------|----------|
| **Progressive disclosure** | Revelar funciones cuando el usuario tiene contexto para usarlas | Estándar de la industria |
| **Registro diferido** | Dejar probar antes de pedir signup | Duolingo, muchas apps freemium |
| **Tooltips contextuales** | 1-3 hints en el momento justo, no tutorial previo | Recomendado por NNG |
| **Learn by doing** | El primer uso real ES el tutorial | Juegos, apps educativas |
| **Personalización temprana** | 1-2 preguntas para adaptar la experiencia | Duolingo, Khan Academy |
| **Gamificación del onboarding** | Completar el onboarding como un "logro" | +50% completion vs. estático |
| **Guest mode** | Explorar sin cuenta, prompt para guardar progreso | Tendencia creciente |

---

## 3. Anti-patrones

### 3.1 Tutorial frontal largo (deck-of-cards)
- **NNG lo desaconseja explícitamente**: "los tutoriales tipo cartas no mejoran el rendimiento en tareas".
- Los usuarios quieren USAR la app, no leer sobre ella.
- **Skip rate alto**: si el tutorial tiene 4+ pantallas, la mayoría lo salta.
- Un tutorial de 30s frustra al 18% de usuarios; a 90s la frustración sube al 28%.

### 3.2 Bloquear el contenido con onboarding obligatorio
- El 72% de usuarios abandona si el onboarding requiere demasiados pasos.
- Ejemplo negativo: apps que piden registro + tutorial + permisos antes de mostrar contenido.

### 3.3 Explicar lo obvio
- NNG: "si tu app necesita un tutorial para funciones estándar, el problema es el diseño, no la falta de tutorial".
- No explicar que un tab bar sirve para navegar, ni que un botón de play inicia el juego.

### 3.4 Información fuera de contexto
- Mostrar cómo funciona una feature antes de que el usuario la encuentre = información olvidada.
- Las instrucciones sin contexto requieren memorización, que falla.

### 3.5 No ofrecer skip
- Apple lo dice explícitamente: siempre dar opción de saltar el tutorial.
- Jugadores experimentados se frustran con tutoriales forzados.

### 3.6 Pedir todo al principio
- Notifications, ratings, localización, registro — todo junto = abandono.
- Diferir permisos no esenciales a cuando sean relevantes.

---

## 4. Datos cuantitativos

| Métrica | Valor | Fuente |
|---------|-------|--------|
| Retención D1 promedio iOS | 25.6% | Business of Apps 2025 |
| Retención D1 promedio Android | 22.6% | Business of Apps 2025 |
| Retención D7 promedio global | 10.7% | Business of Apps 2025 |
| Usuarios que dejan la app en 3 días | 77% de DAUs | Industria promedio |
| Apps usadas solo una vez y abandonadas | 25% | Industria promedio |
| Retención D1 con onboarding optimizado | 40%+ | UserGuiding 2026 |
| Aumento retención con onboarding personalizado | +40% | UserGuiding 2026 |
| Aumento retención con "quick wins" tempranos | +80% | UserGuiding 2026 |
| Aumento completion con gamificación en onboarding | +50% | UserGuiding 2026 |
| Aumento completion con barra de progreso | +22% | UserGuiding 2026 |
| Completion con onboarding interactivo vs. estático | +50% activación | UserGuiding 2026 |
| Usuarios que valoran completar onboarding en <60s | 72% | Industria 2025 |
| Usuarios que reportan onboarding efectivo | Solo 12% | UserGuiding 2026 |
| Retención D30 con onboarding estructurado | +52% | UserGuiding 2026 |

---

## 5. Relevancia para GeoExpert

### 5.1 Factores a favor de un onboarding mínimo
- **La interfaz ya es intuitiva**: globo 3D + 3 tabs (Explorar, Jugar, Pasaporte) sigue patrones familiares.
- **Público joven (8-15)**: nativo digital, acostumbrado a descubrir interfaces por exploración.
- **Apps de geografía comparables no usan onboarding**: Seterra, StudyGe, Stack the Countries confían en la interfaz.
- **El globo invita a la interacción**: girar el globo es un gesto natural que no necesita explicación.

### 5.2 Qué SÍ podría necesitar explicación (lo "novel")
NNG recomienda onboarding solo para lo que es **genuinamente novedoso**. En GeoExpert:
1. **El algoritmo adaptativo de Jugar**: que la app detecta qué países necesitas reforzar no es obvio. Un tooltip tras la primera partida podría comunicar esto.
2. **Los sellos del Pasaporte**: la metáfora del pasaporte con sellos por dominar países es una mecánica propia que merece un momento de descubrimiento.
3. **Tipos de quiz en Jugar**: hay 6 tipos diferentes (A → F). No es necesario explicarlos todos, pero sí el concepto de que van de más fácil a más difícil.

### 5.3 Qué NO necesita explicación
- Girar el globo (gesto natural).
- Tocar un país para ver info (patrón estándar de mapa).
- Navegar entre tabs (patrón universal).
- Empezar una partida (botón de "Jugar" es autoexplicativo).

### 5.4 Patrón recomendado
Basado en la investigación, el patrón que mejor encaja con GeoExpert es:

**Tooltips contextuales (2-3 máximo) + learn by doing**

- **No** modal de bienvenida con múltiples pantallas.
- **No** tutorial previo al primer uso.
- **Sí** tooltips que aparecen en el momento justo (primera vez que el usuario entra a Jugar, primera vez que abre Pasaporte).
- **Sí** dejar que el usuario explore el globo libremente como primera acción (el globo ES el onboarding).
- **Sí** celebrar el primer logro (primer sello en Pasaporte) como refuerzo positivo.

Este enfoque se alinea con: Duolingo (progressive disclosure), Apple Guidelines (enseñar el core loop jugando), NNG (contextual > upfront), y las apps de geografía existentes (inmersión directa).

---

## Fuentes

- [Duolingo onboarding UX breakdown — UserGuiding](https://userguiding.com/blog/duolingo-onboarding-ux)
- [Onboarding Tutorials vs. Contextual Help — Nielsen Norman Group](https://www.nngroup.com/articles/onboarding-tutorials/)
- [Mobile-App Onboarding: Components and Techniques — NNG](https://www.nngroup.com/articles/mobile-app-onboarding/)
- [100+ User Onboarding Statistics 2026 — UserGuiding](https://userguiding.com/blog/user-onboarding-statistics)
- [Choosing the right onboarding UX pattern — Appcues](https://www.appcues.com/blog/choosing-the-right-onboarding-ux-pattern)
- [Mobile App Onboarding Best Practices 2026 — LowCode Agency](https://www.lowcode.agency/blog/mobile-onboarding-best-practices)
- [App Onboarding Rates 2026 — Business of Apps](https://www.businessofapps.com/data/app-onboarding-rates/)
- [Onboarding for Games — Apple Developer](https://developer.apple.com/app-store/onboarding-for-games/)
- [Top 5 App Onboarding Best Practices 2026 — SEM Nexus](https://semnexus.com/the-top-5-app-onboarding-best-practices-to-skyrocket-retention-in-2026/)
- [Duolingo Customer Retention Strategy 2026 — Propel](https://www.trypropel.ai/resources/duolingo-customer-retention-strategy)
- [6 mistakes to avoid in mobile app onboarding — Decode Agency](https://decode.agency/article/mobile-app-onboarding-mistakes/)
