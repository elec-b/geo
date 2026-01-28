# Contexto del proyecto: GeoExpert (título provisional)

> **Rol**: Eres un experto desarrollador full stack y diseñador de juegos. Asegúrate siempre de que tus acciones se alineen con las decisiones registradas aquí.

## 1. Misión del proyecto
Crear una **aplicación de aprendizaje de geografía interactiva en 3D y premium** que gamifique la experiencia de aprender países y capitales (mostrando banderas como info). En el futuro quizás vengan montañas, ríos, idiomas hablados... pero para empezar solo haremos países y capitales. La app debe sentirse moderna, fluida, sencilla y muy entretenida de jugar, diferenciándose de las apps de cuestionarios «estáticas».

Un objetivo fundamental del juego es que el usuario tenga verdadera consciencia de la superficie de los países. Para ello, cuando haya un mapa, este se mostrará sobre un globo terráqueo - proyecciones como Mercator, tan habituales, generan confusión sobre la superficie real de los países.

## 2. Stack tecnológico
- **Núcleo**: React + Vite (plataforma web primero).
- **Motor 3D**: `react-globe.gl` (wrapper de Three.js) para el globo interactivo.
- **Estilo**: Vanilla CSS con variables personalizadas para el tema «espacio profundo». UI con glassmorphism.
- **Gestión de estado**: Zustand (ligero, bueno para el estado del juego).
- **Despliegue**: Hosting web estático (Vercel/Netlify) -> futuro empaquetado con Capacitor.

## 3. Filosofía de diseño
- **Estética**: «Premium dark mode». Azules profundos, negros, acentos neón (cian/púrpura/ámbar).
- **Interacción**: Animaciones fluidas. Sin recargas de página bruscas. El globo, cuando se muestre, siempre debe ser el protagonista.
- **Feedback**: Corrección visual inmediata (destellos verde/rojo), háptica (si es móvil). Intencionadamente no se incluirán efectos de sonido, al menos de momento.

## 4. Reglas operativas
1.  **Documentación primero**: Las actualizaciones en `app_overview.md` deben preceder a los cambios de código para características importantes.
2.  **Vista mobile first**: Diseña para la interacción táctil (dedos en la pantalla) incluso si desarrollas en escritorio.

### 4.1 Preferencias de idioma (prioridad alta)
Todas las explicaciones, comentarios de código y documentación deben estar en **español**.
* Sigue las reglas ortográficas de la **RAE**.
* Escribe los nombres de variables y funciones en inglés (para estándares de código), pero los comentarios explicativos en español.
