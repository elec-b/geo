# Instrucciones para el desarrollo de GeoExpert

> **Rol**: Eres un experto desarrollador full stack y diseñador de juegos. Asegúrate siempre de que tus acciones se alineen con las decisiones registradas aquí y en `OVERVIEW.md`.

## 1. Misión del proyecto
Crear una **aplicación de aprendizaje de geografía interactiva en 3D y premium** que gamifique la experiencia de aprender países y capitales (mostrando banderas como info). La app debe sentirse moderna, fluida, sencilla y muy entretenida de jugar, diferenciándose de las apps de cuestionarios «estáticas».

Un objetivo fundamental es que el usuario tenga **verdadera consciencia de la superficie de los países**. Para ello, el mapa siempre se muestra sobre un globo terráqueo — proyecciones como Mercator generan confusión sobre la superficie real.

## 2. Stack tecnológico

### Núcleo
- **Framework**: React 18 + Vite
- **Empaquetado móvil**: Capacitor (iOS primero, Android después)
- **Motor 3D**: `react-globe.gl` (Three.js + WebGL)

### Estado y datos
- **Gestión de estado**: Zustand
- **Persistencia local**: Capacitor Preferences (key-value) o SQLite

### Estilo
- **CSS**: Vanilla CSS con variables (tema espacial)
- **UI**: Diseño limpio, oscuro y minimalista con animaciones fluidas. Prioridad a la legibilidad y rendimiento.

### Datos geográficos
- **Geometrías**: `world-atlas` (TopoJSON)
- **Países**: REST Countries v3.1 (dump estático)
- **Capitales**: JSON local con coordenadas

### Por qué Capacitor + react-globe.gl
1. `react-globe.gl` soporta GeoJSON nativo con selección táctil
2. Capacitor empaqueta web como app nativa sin reescribir código
3. Rendimiento >60 FPS en iPhone 12+
4. 100% offline con datos locales

### Plataformas objetivo
- **iOS y Android**: Prioridad principal (App Store y Google Play)
- **Web**: No es prioridad. Solo si resulta trivial publicar.

## 3. Reglas operativas

1. **Documentación primero**: Las actualizaciones en `OVERVIEW.md` deben preceder a los cambios de código para características importantes.
2. **Vista mobile first**: Diseña para la interacción táctil (dedos en la pantalla) incluso si desarrollas en escritorio.
3. **Documentación MECE**: Toda la documentación del proyecto se escribe en archivos `.md` en la raíz del repositorio. El contenido debe ser **MECE** (Mutually Exclusive, Collectively Exhaustive): sin solapamientos entre documentos y cubriendo todos los aspectos necesarios.
4. **Backlog**: `BACKLOG.md` contiene el historial de desarrollo más reciente y próximos pasos. Actualízalo al completar tareas importantes.

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
│   └── UI/           # Botones, modales, etc.
├── stores/           # Zustand stores
├── data/             # Loaders y tipos de datos
├── hooks/            # Custom hooks
└── styles/           # CSS global y variables

public/
├── data/             # JSON de países, geometrías, capitales
└── assets/           # Iconos, imágenes

ios/                  # Proyecto Xcode (generado por Capacitor)
android/              # Proyecto Android (futuro)
```

## 5. Comandos de desarrollo

```bash
# Desarrollo web
npm run dev           # Servidor local (Vite)
npm run build         # Build de producción

# iOS (requiere Xcode)
npx cap add ios       # Añadir plataforma iOS (solo 1 vez)
npx cap sync          # Sincronizar código web → iOS
npx cap open ios      # Abrir en Xcode
npx cap run ios       # Build y ejecutar en simulador/dispositivo
```
