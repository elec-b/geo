# Refutacion: Revision tecnica

**Fecha**: 2026-03-24
**Metodo**: Verificacion directa del codigo contra las afirmaciones del documento `02-revision-tecnica.md`.

---

## Acuerdos

### 1. Divergencia DESIGN.md y animacion de estrella -- CORRECTO

DESIGN.md linea 407 dice «10 vueltas en 3s». El CSS real en `PassportView.css:236` dice `1800deg` = 5 vueltas. El commit `2186f1e` cambio de 10 a 5. DESIGN.md no se actualizo. Es una divergencia real y trivial de corregir.

### 2. Zustand persist sin version ni migrate -- CORRECTO

Verificado en `appStore.ts:327-336`: el bloque `persist()` solo tiene `name`, `storage` y `partialize`. No hay `version` ni `migrate`. El revisor tiene razon en que esto sera necesario antes de cambiar el esquema del store.

### 3. Tipos con literales en espanol como claves de persistencia -- CORRECTO

`types.ts:4` define `Continent = 'Africa' | 'America' | ...` y `GameLevel = 'turista' | 'mochilero' | 'guia'`. Estos se usan como claves en `ProfileProgress` (linea 47: `Record<GameLevel, Record<Continent, LevelContinentProgress>>`). Al persistir, quedan serializados como JSON. Cambiarlos requeriria migrar datos o mantener mapping. Esto esta bien identificado.

### 4. Evaluacion de tareas 2a-2f de i18n -- BIEN CALIBRADA

Las viabilidades, dependencias y riesgos individuales estan bien evaluados. La cadena critica 2c -> 2d -> migracion -> 2g es correcta.

### 5. Colores hardcodeados en GlobeD3 para tema claro -- CORRECTO

Verificado: `GlobeD3.tsx:17-81` tiene constantes como `OCEAN_COLOR = '#0a0a1a'`, `COUNTRY_FILL_COLOR = '#3a3a4a'`, `LABEL_COLOR = 'rgba(255, 255, 255, 0.8)'`, etc. Son ~20 constantes de color al inicio del archivo. Para tema claro habria que parametrizarlas. No es un riesgo tecnico alto, pero es trabajo real.

---

## Desacuerdos y matices

### 1. «Archivos monoliticos» como deuda tecnica -- SOBREDIMENSIONADO

**Afirmacion del revisor**: GlobeD3.tsx (1848 lineas) y JugarView.tsx (1499 lineas) son monoliticos, dificultan mantenimiento y aumentan riesgo de regresiones.

**Verificacion**: GlobeD3.tsx tiene 1848 lineas, pero esta bien organizado internamente con secciones claramente delimitadas:
- `// --- Constantes del tema espacial ---` (lineas 15-95)
- `// --- Archipielagos ---` (linea 144)
- `// --- Interfaces ---` (linea 216)
- `// --- Utilidades ---` (linea 282)
- `// --- API imperativa (flyTo) ---` (linea 455)
- `// --- Renderizado del globo ---` (linea 582)
- `// --- Loop de animacion ---` (linea 1111)
- `// --- Hit test ---` (linea 1185)
- `// --- Resize ---` (linea 1296)
- `// --- Carga de datos ---` (linea 1318)
- `// --- Zoom: wheel + pinch ---` (linea 1637)
- `// --- Eventos de interaccion ---` (linea 1719)

Es un solo componente `forwardRef` porque **necesita serlo**: Canvas 2D requiere acceso compartido al contexto, a la proyeccion, y a decenas de refs que coordinan animaciones, inercia, zoom, hit testing y rendering en un solo RAF loop. Fragmentar esto en multiples archivos introduciria complejidad de coordinacion (callbacks, contextos compartidos, re-renders) sin beneficio real.

Ademas, el codebase total tiene ~9060 lineas en 41 archivos. Estos dos archivos representan el 37% del codigo, pero son los dos centros de gravedad natural de la app: el motor grafico y la logica de juego. Un proyecto de este tamano no necesita mas modularidad -- es un overhead innecesario.

**Conclusion**: No es deuda tecnica. Es la estructura correcta para un componente Canvas imperative con este nivel de complejidad. Refactorizarlo no mejoraria la mantenibilidad y podria empeorarla.

### 2. «Sin tests automatizados» como riesgo -- SOBREDIMENSIONADO PARA V1.0

**Afirmacion del revisor**: La falta de tests es un «riesgo silencioso», especialmente para `learningAlgorithm.ts` (654 lineas).

**Matiz**: Es deuda tecnica real, pero no es un riesgo de lanzamiento. Razones:

1. **La app se testea exhaustivamente en dispositivo real**. El backlog tiene una tarea explicita «EN PROGRESO» de testing manual que cubre 15 combinaciones continente-nivel x 6 tipos + pruebas de sello. Esto es mas exhaustivo que la mayoria de tests unitarios para una app de este tipo.

2. **El algoritmo de aprendizaje ha sido estabilizado**. El historial del backlog muestra al menos 5 fixes mayores al algoritmo (herencia E/CDF, barra de progreso, anti-repeticion, etc.), todos descubiertos y corregidos durante testing manual. El algoritmo esta en su version madura.

3. **Los tests unitarios serian utiles para regresiones futuras**, pero no bloquean el lanzamiento de v1.0. Es un proyecto de un solo desarrollador, no un equipo grande donde los tests son esenciales para coordinacion.

4. **Agregar tests ahora seria prematuro**: el scope de i18n va a cambiar tipos fundamentales (`Continent`, `GameLevel`). Escribir tests antes de esa migracion significa reescribirlos despues.

**Conclusion**: Anadir tests es deseable post-v1.0 o post-i18n, pero no es un riesgo que bloquee el lanzamiento ni que deba priorizarse sobre las tareas actuales del backlog.

### 3. «Tipos en espanol son riesgo para i18n» -- CORRECTO PERO MAL ENMARCADO

**Afirmacion del revisor**: Los tipos `Continent` y `GameLevel` en espanol son un riesgo tecnico alto para i18n porque son claves de persistencia.

**Matiz**: El revisor identifica correctamente el problema tecnico, pero lo enmarca como un «riesgo oculto» o algo no contemplado. Sin embargo:

1. El backlog ya lista la externalizacion de textos (tarea 2d) que implicitamente incluye este trabajo.
2. La migracion de Zustand persist es trivial una vez que se anade `version` + `migrate`. Zustand tiene soporte nativo para esto. Es un mapping mecanico: `'Africa' -> 'africa'`, `'turista' -> 'tourist'`, etc.
3. No hay base de usuarios instalada todavia (la app no esta publicada), asi que la «migracion de datos de todos los usuarios» es irrelevante para v1.0.

**Conclusion**: Es trabajo real que debe planificarse como subtarea de 2d, pero no es un riesgo «oculto» ni especialmente complejo. Si la app se publica antes de hacer i18n (escenario probable), si sera relevante para la primera actualizacion que cambie estos tipos. En ese caso, `version: 1` + `migrate` resuelve el problema en ~30 lineas de codigo.

### 4. Scope de «externalizar textos» subestimada -- PARCIALMENTE DE ACUERDO

**Afirmacion del revisor**: Hay ~30 ocurrencias en 12 archivos de strings hardcodeados en espanol. Deberia dividirse en 2 subtareas: textos UI y claves internas.

**Verificacion parcial**: El numero de 12 archivos afectados parece sobreestimado. Busque strings en espanol hardcodeados en componentes y la mayoria son `aria-label` (accesibilidad) y nombres CSS, no textos visibles al usuario. Los archivos con textos reales visibles son menos de los 12 citados. Pero la recomendacion de dividir la tarea en subtareas (UI vs. claves internas) es razonable.

### 5. Tarea 4b (Android) «potencialmente subestimada» -- PARCIALMENTE CORRECTO

El revisor tiene razon en que hay trabajo mas alla de `npx cap add android`. Pero la lista de preocupaciones (testing en multiples resoluciones, firma APK/AAB, ajustes CSS/touch) es estandar para cualquier app Capacitor y no es especifica de este proyecto. El script `npm run device` siendo iOS-only es un hecho, no un riesgo. Se necesitara un equivalente para Android, pero eso es esperable y no es scope creep.

---

## Puntos ciegos del analisis

### 1. No evalua la calidad del codigo -- solo el tamano

El revisor se enfoca en lineas de codigo como metrica de complejidad (1848, 1499, 654...), pero no evalua si el codigo es legible, si tiene bugs conocidos, o si la arquitectura es adecuada para los requisitos. GlobeD3.tsx tiene 74 usos de hooks (useRef, useEffect, useCallback, etc.), lo cual es denso pero tipico de un componente Canvas imperative en React. La organizacion interna con secciones claras indica codigo mantenido activamente, no un monolito abandonado.

### 2. No considera la fase del proyecto

El analisis aplica estandares de un proyecto en produccion con equipo a un proyecto pre-lanzamiento de un solo desarrollador. Los tests automatizados, la modularizacion agresiva, y las migraciones de esquema son importantes en proyectos maduros con multiples contribuidores. Para un MVP pre-App Store con un unico desarrollador que testea manualmente en dispositivo, el costo-beneficio es diferente.

### 3. No evalua lo que funciona bien

El revisor documenta 5 problemas de deuda tecnica pero dedica poco espacio a senalar que:
- La arquitectura de datos es solida (ISO codes como claves, separacion clara datos/logica/UI)
- El pipeline de generacion de datos (`scripts/`) esta bien documentado y tiene overrides manuales para casos problematicos
- La persistencia funciona correctamente con el esquema actual
- Las CSS variables estan bien centralizadas (`variables.css` con 78 lineas bien organizadas)
- El store Zustand es compacto (338 lineas) y cubre toda la logica de estado sin over-engineering

### 4. Sobreestima el impacto de la divergencia DESIGN.md

Se identifican 3 divergencias documentacion-codigo. Dos de ellas (theme: `'dark'` y locale: `'es'` como literales fijos) no son divergencias reales — son el estado correcto de una feature no implementada todavia. DESIGN.md describe el diseno objetivo, no el estado actual del codigo. Solo la animacion de estrella (10 vs 5 vueltas) es una divergencia genuina.

---

## Veredicto

### Riesgos reales (requieren accion)
1. **Migracion de tipos espanol -> neutro para i18n**: Real, pero solucionable con `version` + `migrate` en Zustand. Debe planificarse como subtarea explicita de 2d. Complejidad baja si se hace antes de publicar; moderada si ya hay usuarios.
2. **Divergencia DESIGN.md animacion estrella**: Real, trivial. Corregir «10 vueltas» por «5 vueltas» en DESIGN.md.

### Riesgos teoricos (no bloquean lanzamiento)
1. **Tests automatizados**: Deseable post-v1.0 o post-i18n. No bloquea el lanzamiento.
2. **Zustand persist sin version**: Solo se activa si se cambia el esquema. Mientras no se haga i18n, no hay impacto. Anadirlo preventivamente seria over-engineering.
3. **Archivos monoliticos**: No es deuda tecnica real. Es la estructura adecuada para los requisitos del componente.

### Recomendacion de prioridad
El backlog actual esta bien priorizado. El unico ajuste concreto que surge de esta revision es hacer explicita la subtarea de migracion de tipos dentro de la tarea 2d de i18n, y corregir DESIGN.md sobre la animacion. Todo lo demas es deuda tecnica tolerable o mejoras post-lanzamiento.
