# Visión General de la App: GeoExpert

## Propósito
Un juego educativo para dominar la geografía mundial a través de la exploración interactiva en un globo terráqueo 3D y cuestionarios gamificados.

## Viaje del Usuario
1.  **Onboarding**: El usuario aterriza en un globo 3D giratorio. "Empezar a Aprender" activa un zoom suave hacia su región.
2.  **Selección de Modo**: Un menú tipo panel de cristal se superpone al globo (que se desenfoca ligeramente).
3.  **Gameplay (Juego)**: El globo es el controlador principal. Las preguntas aparecen en un HUD (Heads Up Display).
4.  **Progresión**: Los usuarios ganan XP por respuesta correcta.

## Arquitectura de Modos
La aplicación se divide en dos experiencias principales: **Aprender** (Exploración sin presión) y **Jugar** (Retos con puntuación).

## 1. Modo Aprendizaje: "El Atlas"
Un espacio seguro para explorar.
*   **Interacción (Países)**: Toca un país -> Se ilumina -> Sale su Ficha.
    *   **Ficha de Pasaporte**: Muestra Bandera, Nombre, Capital y Continente.
*   **Repaso de (Capitales)**: Lista de países con sus capitales, al tocar una capital, la cámara hace un **zoom de precisión** al punto exacto de la ciudad y coloca un pin 3D distintivo.
*   **Filtros**: Botones rápidos para aislar regiones (ej. "Solo África")
*   **Objetivo**: Familiarizarse con la ubicación y las formas de los países, así como con sus capitales, antes de competir.

## 2. Modo Juego (Competitivo)

### Dinámica de Juego
Rondas de preguntas cuyo número depende del nivel:
*   **Niveles 1-4 (Turista)**: 10 preguntas por ronda.
*   **Niveles 5-9 (Mochilero)**: 15 preguntas por ronda.
*   **Niveles 10-15 (Guía)**: 20 preguntas por ronda.

El objetivo es conseguir la máxima puntuación para desbloquear "Sellos" en el Pasaporte Virtual y subir de nivel.

### Tipos de Reto
#### A. Desafío de Capitales (Texto -> Texto)
*   **Pregunta**: "¿Cuál es la capital de **Francia**?" -> **Opciones**: París, Londres, Roma, Berlín.
*   **Visual**: Cámara viaja al país.

#### B. Desafío de Países (Texto -> Texto)
*   **Pregunta**: "**París** es la capital de...?" -> **Opciones**: Francia, España, Italia, Alemania.
*   **Visual**: Pin en la ciudad.

#### C. Encuentra el País (Texto -> Mapa)
*   **Pregunta**: "Toca en **Brasil**."
*   **Acción**: Rotar globo y tocar la geometría correcta.

#### D. Encuentra la Capital (Texto -> Mapa)
*   **Pregunta**: "Toca dónde está **Madrid**."
*   **Acción**: El usuario debe tocar el país correcto (España) o un marcador específico si el zoom lo permite. (Para simplificar en móviles: Tocar el país que contiene la capital es válido al principio).

#### E. ¡Nómbralo! (Mapa -> Texto)
*   **Pregunta**: "¿Qué país está resaltado?" (El país brilla en dorado).
*   **Opciones**: Brasil, Argentina, Perú, Chile.

## Gamificación & Journey (Público: 8+ años)

### Metáfora: "El Pasaporte de Explorador"
El perfil del usuario es un Pasaporte 3D. El objetivo es llenarlo de sellos.

### Sistema de Puntos (XP)
*   **Base**: +10 puntos por acierto. -5 puntos por cada fallo (mínimo 0 puntos por ronda).
*   **Racha (Combo)**: x2 puntos a partir de 3 aciertos seguidos. Mostrar visual cuando se active multiplicador

### Recompensas y Desbloqueos
El "Nivel" indicará tu rango de explorador.
1.  **Niveles 1-4 (Turista)**: Solo países muy grandes y famosos.
2.  **Niveles 5-9 (Mochilero)**: Se desbloquean continentes completos.
3.  **Niveles 10-15 (Guía)**: Países más pequeños y capitales difíciles.

### Los Sellos (Coleccionables)
Funcionan como "Jefes Finales". Al completar una racha perfecta en un continente, obtienes su sello emblemático (Torre Eiffel, Pirámides, etc.).

## Fuentes de Datos (Decisión Técnica) [PENDIENTE REFINAR]
Para garantizar precisión y rendimiento:
1.  **Mapas (Geometría)**: **Natural Earth Data** (vía GeoJSON optimizados). Es el estándar open source para fronteras vectoriales ligeras.
2.  **Datos (Texto)**: **REST Countries API** (o un dump estático de este dataset). Nos da: Capital, Población, Bandera (SVG), y Nombres nativos/traducciones.
    *   *Nota*: Usaremos un JSON estático local para no depender de la API en tiempo real (offline-first).
