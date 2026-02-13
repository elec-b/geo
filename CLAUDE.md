# Instrucciones para el desarrollo de GeoExpert

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
- **Nota histórica**: Se evaluó MapLibre GL JS v5 y se descartó. Ver `docs/spikes/pmtiles-vs-d3.md`

## 3. Reglas operativas

1. **Documentación primero**: Las actualizaciones en `DESIGN.md` deben preceder a los cambios de código para características importantes.
2. **Vista mobile first**: Diseña para la interacción táctil (dedos en la pantalla) incluso si desarrollas en escritorio.
3. **Diseño responsivo**: Todos los tamaños de UI (fuentes, botones, espaciado, dimensiones de layout) deben usar unidades relativas (`rem`). Reservar `px` exclusivamente para bordes decorativos (`1px solid`), sombras y blur. Las variables CSS en `variables.css` son la base — usar siempre variables, nunca valores hardcoded.
4. **Documentación MECE**: El contenido debe ser **MECE** (Mutually Exclusive, Collectively Exhaustive): sin solapamientos entre documentos y cubriendo todos los aspectos necesarios. Estructura:
   - **Raíz**: documentos core del proyecto (`CLAUDE.md`, `DESIGN.md`, `BACKLOG.md`)
   - **`docs/research/`**: investigaciones técnicas
   - **`docs/spikes/`**: resultados de spikes de validación
5. **Backlog**: `BACKLOG.md` organiza el trabajo en 3 secciones:
   - **Completado**: Tareas terminadas (historial reciente; para historial completo, usar git)
   - **En progreso**: Tareas activas o con trabajo parcial
   - **Próximos pasos**: Tareas planificadas pero no iniciadas

   Actualízalo al completar tareas importantes. No usamos categoría de "bugs" — todo son tareas.

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
