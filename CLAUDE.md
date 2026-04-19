# Instrucciones para el desarrollo de Exploris

> **Rol**: Eres un experto desarrollador full stack y diseñador de juegos. Asegúrate siempre de que tus acciones se alineen con las decisiones registradas aquí y en `DESIGN.md`.

## 1. Misión del proyecto
Crear una **aplicación de aprendizaje de geografía interactiva en 3D y premium** que gamifique la experiencia de aprender países y capitales (mostrando banderas como info). La app debe sentirse moderna, fluida, sencilla y muy entretenida de jugar, diferenciándose de las apps de cuestionarios «estáticas».

Un objetivo fundamental es que el usuario tenga **verdadera consciencia de la superficie de los países**. Para ello, el mapa siempre se muestra sobre un globo terráqueo — proyecciones como Mercator generan confusión sobre la superficie real.

## 2. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + Vite |
| Empaquetado móvil | Capacitor (iOS primero, Android después) |
| Motor del globo | D3.js (`d3-geo`) — proyección ortográfica sobre Canvas 2D |
| Estado | Zustand |
| Persistencia | Capacitor Preferences (key-value) o SQLite |
| Estilo | Vanilla CSS con variables (tema espacial, dark mode) |
| Datos geográficos | `world-atlas` (TopoJSON 1:50m), REST Countries v3.1, capitales JSON local |

- **Plataformas**: iOS y Android (App Store y Google Play). Web no es prioridad.
- **Justificación técnica del stack**: ver `DESIGN.md` § «Motor de renderizado»
- **Fuentes de datos (detalle)**: ver `DESIGN.md` § «Fuentes de datos»
- **Nota histórica**: Se evaluó MapLibre GL JS v5 y se descartó por artefactos de tile seams.

## 3. Reglas operativas

1. **Documentación primero**: Las actualizaciones en `DESIGN.md` deben preceder a los cambios de código para características importantes.
2. **Vista mobile first**: Diseña para la interacción táctil (dedos en la pantalla) incluso si desarrollas en escritorio.
3. **Diseño responsivo**: Todos los tamaños de UI (fuentes, botones, espaciado, dimensiones de layout) deben usar unidades relativas (`rem`). Reservar `px` exclusivamente para bordes decorativos (`1px solid`), sombras y blur. Las variables CSS en `variables.css` son la base — usar siempre variables, nunca valores hardcoded.
4. **Documentación MECE**: El contenido debe ser **MECE** (Mutually Exclusive, Collectively Exhaustive): sin solapamientos entre documentos y cubriendo todos los aspectos necesarios. Estructura:
   - **Raíz**: documentos core del proyecto (`CLAUDE.md`, `DESIGN.md`, `BACKLOG.md`)
   - **`docs/spikes/`**: resultados de spikes de validación
5. **Backlog**: `BACKLOG.md` organiza el trabajo en 2 secciones:
   - **Completado**: Tareas terminadas (historial reciente condensado; para historial completo, usar git)
   - **Próximos pasos**: Tareas planificadas, ordenadas por prioridad

   Actualízalo **solo después de testear en dispositivo y con confirmación explícita del usuario**. No actualizar el backlog de forma anticipada. No usamos categoría de "bugs" — todo son tareas.

   **Flujo de mantenimiento**: Al completar una tarea, moverla de «Próximos pasos» a «Completado» (tal cual o clarificando brevemente lo que se hizo). Cuando «Completado» crece demasiado, comprimir agrupando por área en pocas líneas (1 línea por área con las capacidades clave).

### 3.1 Preferencias de idioma (prioridad alta)
Todas las explicaciones, comentarios de código y documentación deben estar en **español**.
* Sigue las reglas ortográficas de la **RAE**.
* Escribe los nombres de variables y funciones en inglés (para estándares de código), pero los comentarios explicativos en español.

## 4. Estructura del proyecto

```
src/
├── components/       # Componentes React
│   ├── Globe/        # Globo 3D y controles
│   ├── Game/         # Lógica de juego
│   ├── Explore/      # Exploración libre
│   ├── Navigation/   # Tab bar
│   ├── Layout/       # Header, app shell
│   └── UI/           # Botones, modales, etc.
├── stores/           # Zustand stores
├── data/             # Loaders y tipos de datos
├── hooks/            # Custom hooks
└── styles/           # CSS global y variables

public/
├── data/             # JSON de países, geometrías, capitales
└── assets/           # Iconos, imágenes

ios/                  # Proyecto Xcode (generado por Capacitor)
android/              # Proyecto Android Studio (generado por Capacitor)
```

## 5. Comandos de desarrollo

```bash
# Desarrollo web
npm run dev           # Servidor local (Vite)
npm run build         # Build de producción

# iOS (requiere Xcode)
npx cap add ios       # Añadir plataforma iOS (solo 1 vez)
npx cap sync ios      # Sincronizar código web + plugins → iOS
npx cap open ios      # Abrir en Xcode
npx cap run ios       # Build y ejecutar en simulador/dispositivo

# Android (requiere Android Studio + JDK 21)
npx cap add android   # Añadir plataforma Android (solo 1 vez)
npx cap sync android  # Sincronizar código web + plugins → Android
npx cap open android  # Abrir en Android Studio
npx cap run android   # Build y ejecutar en emulador/dispositivo

# Despliegue directo a dispositivo
npm run device              # iOS: Build + compilar (Debug) + instalar + lanzar en iPhone
npm run device:live         # iOS con dev server local (requiere npm run dev en otro terminal)
npm run device:android        # Android wireless (TLS): usa $ANDROID_DEVICE_ID de .env.local
npm run device:android:live   # Wireless con dev server local
npm run device:android:cable  # Android por cable USB (adb -d, único USB conectado, sin env var)
npm run device:android:cable:live # Cable + dev server local
```

> **Nota iOS**: Requiere `.env.local` con `IOS_DEVICE_UDID`, `IOS_DEVICE_ID`, `IOS_BUNDLE_ID`. Para obtenerlos: `xcrun devicectl list devices`.
>
> **Nota Android**: Requiere `.env.local` con `ANDROID_DEVICE_ID` (serial del dispositivo; obtener con `$ANDROID_HOME/platform-tools/adb devices`), más las variables `JAVA_HOME` y `ANDROID_HOME` exportadas en el shell. Convención:
> ```
> export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
> export ANDROID_HOME="$HOME/Library/Android/sdk"
> export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
> ```
> `.env.local` no se sube a git.
>
> **Live Reload**: `npm run device:live` + `npm run dev` permite ver cambios web al instante en el iPhone (HMR vía Wi-Fi). Ideal para iterar en UI. Para testing final, usar siempre `npm run device`.
>
> **Android — cable vs wireless**: para iterar usar siempre **cable USB** con `npm run device:android:cable` — más rápido que TLS (no transferencia por Wi-Fi, no despertar pantalla del dispositivo) y no requiere env var (`adb -d` apunta al único dispositivo USB conectado).

> **Verificación preferida**: Para testear cambios, usar `npm run device` (despliegue directo al iPhone) en vez de `npm run dev`. El testing real se hace siempre en dispositivo. Preguntar siempre al usuario antes de usar `npm run device`.
