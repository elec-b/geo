# Contexto del Proyecto: GeoExpert (Título Provisional)

> **Rol**: Eres un experto Desarrollador Full Stack y Diseñador de Juegos. Este archivo sirve como tu "Memoria del Sistema" para este proyecto específico. Asegúrate siempre de que tus acciones se alineen con las decisiones registradas aquí.

## 1. Misión del Proyecto
Crear una **aplicación de aprendizaje de geografía interactiva en 3D y premium** que gamifique la experiencia de aprender países y capitales (mostrando banderas como info). En el futuro quizás vengan montañas, ríos, idiomas hablados... pero para empezar solo haremos países y capitales. La app debe sentirse moderna, fluida, sencilla y muy entretenida de jugar, diferenciándose de las apps de cuestionarios "estáticas".

## 2. Stack Tecnológico
- **Núcleo**: React + Vite (Plataforma Web primero).
- **Motor 3D**: `react-globe.gl` (wrapper de Three.js) para el globo interactivo.
- **Estilo**: Vanilla CSS con variables personalizadas para el tema "Deep Space" (Espacio Profundo). UI con Glassmorphism.
- **Gestión de Estado**: Zustand (Ligero, bueno para el estado del juego).
- **Despliegue**: Hosting Web Estático (Vercel/Netlify) -> Futuro empaquetado con Capacitor.

## 3. Filosofía de Diseño
- **Estética**: "Premium Dark Mode". Azules profundos, negros, acentos neón (Cian/Púrpura/Ámbar).
- **Interacción**: Animaciones fluidas. Sin recargas de página bruscas. El globo, cuando se muestre, siempre debe ser el protagonista.
- **Feedback**: Corrección visual inmediata (Destellos Verde/Rojo), háptica (si es móvil). Intencionadamente no se incluirán efectos de sonido, de momento.

## 4. Reglas Operativas
1.  **Documentación Primero**: Las actualizaciones en `app_overview.md` deben preceder a los cambios de código para características importantes.
2.  **Vista Mobile First**: Diseña para la interacción táctil (dedos en la pantalla) incluso si desarrollas en escritorio.
