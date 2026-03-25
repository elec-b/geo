# Spike: Onboarding de primera ejecucion — Sintesis final

**Fecha**: 2026-03-25
**Metodo**: Agent team (3 agentes primarios + 3 refutadores + lider sintetizador)

---

## Resumen ejecutivo

Tras investigacion externa, analisis interno del codigo y tres rondas de refutacion, la conclusion principal es: **GeoExpert no necesita un onboarding formal pre-lanzamiento, sino mejoras quirurgicas a la UI existente**. La app ya tiene un flujo de primera ejecucion razonable (globo impactante, preselecciones inteligentes, 1 tap para empezar a jugar). Las fricciones reales son pocas y se resuelven mejor con mejoras permanentes de UI que con tooltips efimeros.

**Recomendacion**: Implementar 3 mejoras de UI + 1 tooltip minimo. No implementar overlay de bienvenida ni personalizacion frontal. Posponer mas onboarding a post-lanzamiento con datos reales.

---

## Lo que el equipo acordo (consenso)

1. **No hacer tutorial frontal largo** — 6 de 6 agentes de acuerdo. Skip rate alto, anti-patron reconocido por NNG y Apple.
2. **Progressive disclosure es el patron correcto** — revelar complejidad gradualmente, no de golpe.
3. **No explicar lo obvio** — rotar globo, tab bar, tocar pais son gestos estandar. No necesitan tooltip.
4. **El globo 3D ES el "momento wow"** — no ocultarlo detras de pantallas. La auto-rotacion + inercia comunican interactividad.
5. **LoadingScreen sin branding es oportunidad perdida** — "Cargando globo..." es funcional pero anonimo.
6. **Pasaporte vacio necesita un CTA motivacional** — la matriz de sellos sin contexto no guia al usuario.
7. **La complejidad interna (6 tipos, algoritmo, herencia) es invisible al usuario** — el usuario solo ve "Aventura" + "Empezar".

## Lo que el equipo debatio (sin consenso)

| Tema | A favor | En contra | Veredicto |
|------|---------|-----------|-----------|
| Overlay de bienvenida (Opcion B) | Genera branding y "wow" (disenador) | El usuario VE pero NO toca — frustracion pasiva (refutador-disenador) | **No implementar**. El globo ya es el wow. |
| Tooltips contextuales | Eliminan fricciones minimas (investigador, disenador) | Acoplados a la UI, coste de mantenimiento, la mayoria de usuarios los cierran sin leer (refutador-disenador) | **Implementar solo 1** (en Jugar). Los otros se resuelven mejor con mejoras de UI. |
| Personalizacion frontal | Genera apego en ninos (disenador, opcion C) | Retrasa el globo, NNG desaconseja pedir input antes de valor (todos los refutadores) | **No frontal. Si post-primera-partida** como feature separada. |
| La app necesita onboarding | La complejidad mecanica lo justifica (refutador-investigador) | Las preselecciones ya resuelven el flujo; las fricciones estan sobreestimadas (refutador-analista) | **Mejoras de UI > onboarding formal** |

---

## Propuesta final: 3 mejoras de UI + 1 tooltip

### 1. Branding en LoadingScreen (mejora de UI)
- Reemplazar "Cargando globo..." por logo de GeoExpert + tagline ("Descubre el mundo jugando").
- Se muestra SIEMPRE (no solo primera vez) — es branding, no onboarding.
- **Coste**: bajo. Modificar `LoadingScreen.tsx`.
- **Beneficio**: primera impresion premium para todos los usuarios.

### 2. Empty state en Pasaporte (mejora de UI)
- Cuando la matriz de sellos esta completamente vacia, mostrar un CTA motivacional:
  > "Tu pasaporte esta vacio. Juega para ganar tu primer sello."
- Con boton o enlace que lleve a Jugar.
- Se muestra SIEMPRE que no haya sellos (no solo primera vez) — es buena UI, no onboarding.
- **Coste**: bajo. Condicional en `PassportView.tsx`.
- **Beneficio**: guia al usuario sin tooltip, beneficia a cualquier perfil nuevo.

### 3. Micro-animacion de affordance en el globo (mejora de UI)
- Al cargar por primera vez el globo (flag unico), una animacion sutil simula un drag corto (como si una mano invisible girara el globo ligeramente), seguido de un zoom-in suave y zoom-out.
- Dura ~2 segundos. Sin texto. Comunica visualmente que el globo es interactivo.
- Alternativa mas simple: un pulso sutil en el primer pais visible (glow breve) que invite a tocarlo.
- **Coste**: medio. Animacion en `GlobeD3.tsx`.
- **Beneficio**: comunica interactividad sin texto ni tooltip.

### 4. Tooltip en Jugar — primera vez (onboarding minimo)
- Al navegar a Jugar por primera vez, tooltip sobre el boton "Empezar":
  > "Ya esta todo listo. Aventura se adapta a lo que sabes."
- Se cierra con "Empezar" (doble funcion) o al tocar fuera.
- Flag unico: `onboarding.jugarSeen`.
- **Coste**: bajo. Componente tooltip + 1 flag.
- **Beneficio**: refuerza que no hay que configurar nada — el flujo real es 0 decisiones + 1 tap.

### Descartado

| Propuesta | Razon de descarte |
|-----------|-------------------|
| Overlay de bienvenida (Opcion B) | El usuario ve sin poder tocar. Contradice principio de inmersion. El globo ya es el wow. |
| Personalizacion frontal (Opcion C) | Retrasa el globo. NNG y Apple desaconsejan pedir input antes de valor. |
| Tooltip de interaccion del globo | Auto-rotacion + inercia ya comunican interactividad. La micro-animacion (punto 3) es mejor que texto. |
| Tooltip de Pasaporte | El empty state (punto 2) es mejor: permanente, sin flag, beneficia a todos. |
| Primera partida simplificada | Buena idea pero scope excesivo para pre-lanzamiento. Evaluar post-lanzamiento. |

---

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigacion |
|--------|-------------|------------|
| Ninos de 8-10 no descubren mecanicas de Jugar | Media | El tooltip de Jugar mitiga parcialmente. Monitorear post-lanzamiento. |
| Micro-animacion del globo compite con auto-rotacion | Baja | La animacion ocurre UNA vez al cargar, antes de que el usuario interactue. |
| El tooltip de Jugar se cierra sin leer | Alta (normal) | Diseno como dismiss-por-accion: si el usuario pulsa "Empezar", ya hizo lo correcto. |
| Usuarios avanzados no necesitan nada de esto | Alta (esperado) | Las mejoras de UI son no-intrusivas. El tooltip es uno solo. |

---

## Proximos pasos

1. **Implementar las 4 mejoras** en este orden (de menor a mayor complejidad):
   - Empty state en Pasaporte
   - Branding en LoadingScreen
   - Tooltip en Jugar
   - Micro-animacion del globo
2. **Testear en dispositivo** con un usuario nuevo (perfil limpio).
3. **Post-lanzamiento**: recoger datos de abandono y friction points. Si hay evidencia de confusion, evaluar:
   - Mas tooltips contextuales
   - Primera partida simplificada
   - Personalizacion post-primera-partida

---

## Documentos del equipo

| Documento | Agente |
|-----------|--------|
| `onboarding-investigacion-ux.md` | Investigador UX |
| `onboarding-analisis-interno.md` | Analista interno |
| `onboarding-propuestas-diseno.md` | Disenador |
| `onboarding-refutacion-investigador.md` | Refutador del investigador |
| `onboarding-refutacion-analista.md` | Refutador del analista |
| `onboarding-refutacion-disenador.md` | Refutador del disenador |
