# Visión general de la app: GeoExpert

## Propósito
Un juego educativo para dominar la geografía mundial a través de la exploración interactiva en un globo terráqueo 3D y cuestionarios gamificados.
La aplicación se divide en dos experiencias principales: **Aprender** (exploración sin presión) y **Jugar** (retos con puntuación (XP)).

## Aprender
Un espacio seguro para explorar. El objetivo es familiarizarse con la ubicación y las formas de los países, así como con sus capitales.

Tipos de repaso:
*   **Repaso de países**: Toca un país -> se ilumina -> sale su ficha de pasaporte.
    *   **Ficha de pasaporte**: Muestra bandera, nombre, capital, continente, población (y ranking población), superficie (y ranking superficie), moneda y gentilicio.
*   **Repaso de capitales**: Lista de países con sus capitales. 
    *   Al tocar una capital, la cámara hace un **zoom de precisión** al punto exacto de la ciudad y coloca un pin distintivo. El país se resalta.
    *   Al tocar un país, la cámara hace un **zoom de precisión** al país. El país se resalta. Un pin aparece (menos distintivo) aparece sobre la capital

Para ambos tipos de repaso:
*   **Filtros**: Botones rápidos para aislar continentes (ej. «solo África»).
*   **Globo 3d**: Cuando se señalen los países y las capitales sobre el mapa, este siempre será un globo terráqueo 3D. 

## Jugar

### Tipos de juego
#### A. Desafío de capital-país (texto -> texto)
*   **Pregunta**: «¿Cuál es la capital de **Francia**?» -> **Opciones**: París, Londres, Roma, Berlín.
*   **Visual**: Cámara viaja al país.

#### B. Desafío de país-capital (texto -> texto)
*   **Pregunta**: «**París** es la capital de...?» -> **Opciones**: Francia, España, Italia, Alemania.
*   **Visual**: Pin en la ciudad.

#### C. Encuentra el país (texto -> mapa)
*   **Pregunta**: «**Brasil**»
*   **Acción**: Rotar globo y tocar la geometría correcta.

#### D. Encuentra la capital (texto -> mapa)
*   **Pregunta**: «**Madrid**»
*   **Acción**: El usuario debe tocar la capital del país correcto (España). Para simplificar en móviles: tocar el país que contiene la capital es válido.

#### E. ¡Nómbralo! (mapa -> texto)
*   **Pregunta**: «¿Qué país está resaltado?» (El país brilla en dorado).
*   **Opciones**: Brasil, Argentina, Perú, Chile.

## Lista de países y capitales
Se utilizará el estándar internacional de países y capitales según la ONU -> 195 países a 28 de enero de 2026.

## Gamificación y journey
El contenido de esta sección (y subsecciones anidadas) aplica solo para la experiencia de Jugar, no para la de Aprender.

### Público: 8+ años
El público objetivo es personas con edad entre 8 y 15 años. Pero idealmente debe ser entretenido de jugar también para adultos y personas mayores.

### Dinámica de juego
El objetivo del juego es conseguir puntos, con los distintos tipos de juegos, para conseguir sellos sobre un pasaporte virtual. De esta manera, el usuario avanzará por los 15 niveles del juego.

Clasificamos los niveles dentro de 3 grupos:
*   **Turista**: Niveles 1-4
*   **Mochilero**: Niveles 5-9
*   **Guía**: Niveles 10-15

En Turista, el usuario solo podrá jugar con / recibirá preguntas sobre los países y capitales más poblados y famosos.

En Mochilero, el usuario podrá jugar con / recibir preguntas sobre los  países más grandes y famosos.

En Guía, el usuario podrá jugar con / recibir preguntas sobre los países más grandes y famosos.

Rondas de preguntas cuyo número depende del nivel:
*   **Niveles 1-4 (turista)**: 10 preguntas por ronda.
*   **Niveles 5-9 (mochilero)**: 15 preguntas por ronda.
*   **Niveles 10-15 (guía)**: 20 preguntas por ronda.

### Metáfora: «El pasaporte de explorador»
El objetivo es llenar de sellos un pasaporte e ir subiendo de nivel.

### Sistema de puntos (XP)
*   **Base**: +10 puntos por acierto. -5 puntos por cada fallo (suelo de 0 puntos por ronda, no hay puntuación negativa).
*   **Racha (combo)**: x2 puntos a partir de 3 aciertos seguidos. Mostrar visual cuando se active multiplicador.

### Recompensas y desbloqueos
El «nivel» indicará tu rango de explorador.
1.  **Niveles 1-4 (turista)**: Solo países muy grandes y famosos.
2.  **Niveles 5-9 (mochilero)**: Se desbloquean continentes completos.
3.  **Niveles 10-15 (guía)**: Países más pequeños y capitales difíciles.

## Fuentes de datos (decisión técnica) [pendiente refinar]
Para garantizar precisión y rendimiento:
1.  **Mapas (geometría)**: **Natural Earth Data** (vía GeoJSON optimizados). Es el estándar open source para fronteras vectoriales ligeras.
2.  **Datos (texto)**: **REST Countries API** (o un dump estático de este dataset). Nos da: capital, población, bandera (SVG), y nombres nativos/traducciones.
    *   *Nota*: Usaremos un JSON estático local para no depender de la API en tiempo real (offline-first).

[TO DOUBLE-VALIDATE] -> considerar utilizar https://restcountries.com/ para obtener datos de países / capitales y todo lo necesario para la ficha de país.


## Consideraciones visuales
* el mapa 3D / globo terráqueo es el protagonista cuando se muestre. No utilizaremos mapas 2D. Queremos que el usuario tenga verdadero sentido de la superficie de los países.
* Las fronteras de los países deben ser claras, pero también las de los continentes.
