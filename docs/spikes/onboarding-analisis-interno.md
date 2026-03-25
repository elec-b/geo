# Analisis interno: experiencia de primera ejecucion

## Resumen ejecutivo

GeoExpert no tiene ningun flujo de onboarding. Al abrir la app por primera vez, el usuario ve un spinner ("Cargando globo..."), luego un globo 3D interactivo con controles de Explorar y una tab bar inferior. Se crea automaticamente un perfil llamado "Explorador" con avatar de leon. No hay tutoriales, tooltips, instrucciones de interaccion ni explicacion de las mecanicas del juego. El flujo para empezar a jugar requiere 3 decisiones (continente, nivel, tipo de juego) antes de la primera pregunta, lo que puede resultar abrumador para un usuario joven sin contexto.

---

## Flujo de primera ejecucion (paso a paso)

### 1. Splash / Carga
- **Archivo**: `src/components/UI/LoadingScreen.tsx`
- Se muestra un spinner con el texto "Cargando globo..." sobre fondo oscuro.
- Desaparece cuando el globo emite `onReady` (`App.tsx:155`).
- **No hay branding**, logo ni identidad visual de la app. Solo un spinner generico.

### 2. Estado inicial del store (perfil automatico)
- **Archivo**: `src/stores/appStore.ts:46-53`
- Se crea automaticamente un perfil por defecto:
  - Nombre: **"Explorador"**
  - Avatar: **leon** (`src/data/avatars.ts:27`)
  - Progreso: completamente vacio (todos los sellos en `earned: false`)
- No se pide nombre, avatar ni preferencias al usuario.
- El perfil se persiste con Capacitor Preferences bajo la clave `geoexpert-store`.

### 3. Pantalla inicial: Explorar (tab por defecto)
- **Archivo**: `App.tsx:38` — `activeTab` arranca en `'explore'`
- El usuario ve:
  - **Header**: icono de leon (avatar, izquierda), iconos de estadisticas y configuracion (derecha)
  - **Globo 3D**: proyeccion ortografica, auto-rotacion, tema espacial oscuro
  - **Controles de Explorar**: segmented "Globo | Tabla", filtros de continente (pills), toggles "Paises / Capitales"
  - **Tab bar inferior**: Explorar (activo) | Jugar | Pasaporte

### 4. Interaccion con el globo (sin guia)
- El globo soporta drag (rotar), pinch (zoom) y tap (seleccionar pais).
- **No hay ninguna instruccion** de como interactuar: ni tooltip, ni coachmark, ni animacion guiada.
- Al tocar un pais se abre una CountryCard (bottom sheet) con datos detallados (bandera, capital, poblacion, area, IDH, etc.).

### 5. Tab Jugar (LevelSelector)
- **Archivo**: `src/components/Game/LevelSelector.tsx`
- Al navegar a Jugar, se muestra el selector con 3 secciones:
  1. **"Elige continente"**: 5 pills (Europa, Africa, America, Asia, Oceania)
  2. **"Elige nivel"**: 3 tarjetas (Turista, Mochilero con candado, Guia con candado)
  3. **"Elige juego"**: boton Aventura destacado + divider "o elige juego concreto" que abre 6 tipos especificos
- Pre-selecciones inteligentes: continente basado en timezone (`inferContinentFromTimezone`, `src/data/continents.ts:23-32`), nivel maximo desbloqueado.
- Boton final: **"Empezar"** (cambia a "Continuar" si hay intentos previos).

### 6. Tab Pasaporte (matriz de sellos)
- **Archivo**: `src/components/Passport/PassportView.tsx`
- Muestra "Pasaporte de Explorador" con nivel global (vacio al inicio).
- Matriz 5 continentes x 3 niveles: primera fila (Turista) desbloqueada, las otras 2 con candados.
- Cada celda desbloqueada muestra 2 sellos vacios (pais + capital).
- Leyenda al pie: "○ Pais | ◎ Capital | ★ Conseguido | 🔒 Bloqueado"

---

## Estado vacio de cada experiencia

### Explorar
- **Funciona bien sin datos previos**. El globo se renderiza completo, los filtros de continente funcionan, la tabla de capitales esta poblada con datos estaticos.
- La CountryCard muestra datos completos de cualquier pais.
- **No depende del progreso del usuario.**

### Jugar
- El selector pre-selecciona continente (por timezone) y nivel Turista.
- Aventura esta seleccionado por defecto — una buena decision.
- El numero de paises por nivel se muestra correctamente (ej. "31 paises" para Europa Turista).
- **Sin progreso**, los niveles Mochilero y Guia muestran candado con "🔒" y un toast "Consigue los sellos del nivel anterior" al tocarlos.

### Pasaporte
- 10 celdas desbloqueadas (5 continentes x Turista) con sellos vacios.
- 20 celdas bloqueadas con candado.
- **No hay mensaje motivacional** tipo "Empieza a jugar para ganar sellos" ni indicacion de que hacer.

### Estadisticas
- Accesible desde el header (icono de barras).
- Sin datos, muestra la estructura pero sin informacion util visible.

---

## Puntos de friccion identificados (priorizados)

### Criticos (alta probabilidad de abandono)

1. **Sin instrucciones de interaccion con el globo**
   - No hay ningun indicador de que el globo se puede rotar (drag), hacer zoom (pinch) o tocar paises (tap).
   - Un nino de 8 anos podria no descubrir estas interacciones.
   - **Impacto**: El core de la app (el globo interactivo) podria pasar desapercibido como simple imagen.

2. **Sobrecarga de decisiones para empezar a jugar**
   - 3 niveles de seleccion: continente (5 opciones) + nivel (3, 2 bloqueados) + tipo de juego (1 + 6 ocultos).
   - Aunque hay pre-selecciones inteligentes, la pantalla tiene mucho texto y estructura para un usuario nuevo.
   - Los terminos "Turista/Mochilero/Guia" no se explican.
   - **Impacto**: Friccion alta para la audiencia de 8-15 anos.

3. **Sin pantalla de bienvenida ni contexto**
   - La app arranca directo en el globo sin explicar que es, que puede hacer el usuario, ni generar emocion.
   - **Impacto**: Falta el "momento wow" que enganche al usuario en los primeros 30 segundos.

### Importantes (reducen la experiencia)

4. **Terminologia de tipos de juego opaca**
   - "Identifica pais (◯?)", "Pais a capital (◯→◎)", "Senala el pais (◯)", etc.
   - Los iconos con circulos y flechas requieren aprendizaje.
   - La etiqueta "Aventura: Se adapta a lo que sabes" es buena pero insuficiente para explicar el concepto.

5. **Pasaporte sin guia motivacional**
   - Un usuario nuevo ve una matriz de sellos vacios y candados sin entender el objetivo final.
   - No hay "camino" visible ni indicacion de que el Pasaporte es el sistema de progresion principal.

6. **Perfil sin personalizacion inicial**
   - Se asigna "Explorador" + leon sin preguntar. El usuario podria no saber que es editable (requiere tocar el avatar en el header).
   - Para ninos, elegir nombre y avatar es parte de la diversión y genera apego.

7. **LoadingScreen anonima**
   - "Cargando globo..." no genera expectativa ni branding. Oportunidad perdida.

### Menores (mejoras deseables)

8. **Tab bar sin indicadores de novedad**
   - No hay badges ni pulsaciones que inviten a explorar los otros tabs.

9. **Los filtros de continente en Explorar son sutiles**
   - Funcionan bien, pero no hay indicacion de para que sirven mas alla del texto.

10. **El boton de estadisticas (icono de barras en header) no tiene label**
    - Un usuario nuevo no sabe que es ni por que lo usaria.

---

## Aspectos positivos del flujo actual (que ya funciona bien)

1. **Pre-seleccion inteligente de continente**: Usa el timezone del dispositivo (`inferContinentFromTimezone`) para sugerir el continente mas relevante. Un usuario en Madrid vera Europa pre-seleccionada.

2. **Nivel Turista siempre desbloqueado**: No hay barrera de entrada para empezar a jugar (`isLevelUnlocked` retorna `true` para 'turista').

3. **Aventura como opcion por defecto**: El modo "mixed" (Aventura) esta pre-seleccionado, que es el mas amigable — se adapta automaticamente al conocimiento del usuario.

4. **Globo 3D como pantalla de inicio**: La proyeccion ortografica es visualmente impactante y diferenciadora. Es un buen "hook" visual si el usuario descubre la interaccion.

5. **Sistema de perfiles robusto**: Multiples perfiles con avatares animales, facil de crear/editar/eliminar. El perfil por defecto garantiza que la app funciona sin configuracion.

6. **Progresion por sellos clara una vez entendida**: La matriz de Pasaporte con 3 niveles y 5 continentes es un mapa de progreso visual intuitivo.

7. **FlyTo al seleccionar continente**: Tanto en Explorar como en Jugar, al tocar un continente el globo rota suavemente, lo que refuerza la relacion entre la UI y el mapa.

8. **Datos del globo independientes del progreso**: Explorar funciona al 100% desde el primer momento, con CountryCards completas. Esto permite al usuario descubrir el contenido sin necesidad de jugar primero.

9. **Labels en espanol coherentes**: Toda la UI esta en espanol con terminologia consistente (continentes, niveles, tipos de juego).

10. **Tab bar sencilla**: 3 tabs bien definidos (Explorar, Jugar, Pasaporte) cubren el flujo completo sin sobrecargar.

---

## Mapa de archivos relevantes

| Aspecto | Archivo | Linea clave |
|---------|---------|-------------|
| Entry point | `src/App.tsx` | L38: `activeTab = 'explore'` |
| Perfil por defecto | `src/stores/appStore.ts` | L47-53: nombre "Explorador", avatar "lion" |
| Loading screen | `src/components/UI/LoadingScreen.tsx` | Spinner + "Cargando globo..." |
| Tab bar | `src/components/Navigation/types.ts` | L11-15: Explorar, Jugar, Pasaporte |
| Selector de juego | `src/components/Game/LevelSelector.tsx` | L165+: 3 secciones de seleccion |
| Pasaporte vacio | `src/components/Passport/PassportView.tsx` | L119+: matriz con sellos vacios |
| Inferencia continente | `src/data/continents.ts` | L23-32: timezone → continente |
| Desbloqueo niveles | `src/data/learningAlgorithm.ts` | L608-617: Turista siempre libre |
| Avatares | `src/data/avatars.ts` | 12 animales disponibles |
