# Visión general de la app: GeoExpert

## Propósito
Un juego educativo para dominar la geografía mundial a través de la exploración interactiva en un globo terráqueo 3D y cuestionarios gamificados.

## Datos base
*   **Países y capitales**: Estándar internacional según la ONU → 195 países (a enero 2026).
*   **Continentes**: 5 (África, América, Asia, Europa, Oceanía).

---

## Los 3 modos de la app

La aplicación se divide en **3 experiencias principales**:

| Modo | Descripción | Objetivo |
|------|-------------|----------|
| **Mi nivel** | Dashboard de progreso real | Ver qué sabe el usuario |
| **Aprender** | Exploración libre del globo | Familiarizarse sin presión |
| **Jugar** | Camino guiado con retos | Subir de nivel de forma divertida |

---

## Sistema de niveles

### Los 3 niveles
| Nivel | Conocimiento requerido |
|-------|------------------------|
| **Turista** | Top 10 países más poblados de cada continente (top 5 en Oceanía) |
| **Mochilero** | 60% de los países de cada continente |
| **Guía** | 100% de los países de cada continente |

### Progresión por continente
*   El usuario tiene un **nivel independiente por cada continente**. Puede ser "Guía de Europa" mientras es "Turista de África".
*   **Nivel global** = el mínimo de los 5 continentes. Este es el nivel que el usuario puede "presumir" como resumen.

### Público objetivo
Personas de 8 a 15 años, pero diseñado para ser entretenido también para adultos.

---

## Mi nivel (modo A)

**La piedra angular de la app.** Un dashboard que muestra el conocimiento real del usuario sobre los 195 países del mundo y sus capitales.

### Dashboard
Matriz visual de **niveles × continentes** (3 filas × 5 columnas). Cada celda muestra el estado del usuario para esa combinación.

### Las 2 pruebas fundamentales
Para demostrar que el usuario realmente conoce un nivel-continente, debe superar:

| Prueba | Descripción | Tipo de juego |
|--------|-------------|---------------|
| **Prueba 1: Países** | Ubicar cualquier país del nivel en el mapa | Tipo C (texto → mapa) |
| **Prueba 2: Capitales** | Ubicar cualquier capital del nivel en el mapa | Tipo D (texto → mapa) |

*   Las pruebas se hacen **por separado** (el usuario elige cuál hacer).
*   Máximo **3 intentos diarios** por continente (se reinician cada día).

### Registro de fallos
*   Cuando el usuario falla en una prueba, se guarda el país/capital fallado.
*   El modo **Jugar** utilizará estos fallos para reforzar el aprendizaje.

---

## Aprender (modo B)

Un espacio seguro para explorar. El objetivo es familiarizarse con la ubicación y las formas de los países, así como con sus capitales.

### Repaso de países
Sobre el mapa (globo 3D) el usuario puede tocar un país → se ilumina → sale su ficha de pasaporte.
*   **Ficha de pasaporte**: Bandera, nombre, capital, continente, población (y ranking), superficie (y ranking), moneda y gentilicio.
*   **Capital**: Pequeña marca sobre la capital en el mapa.

### Repaso de capitales
Lista de países con sus capitales para repasar.
*   Al tocar una **capital**: zoom de precisión al punto exacto + pin distintivo. El país se resalta.
*   Al tocar un **país**: zoom de precisión al país + circulito sobre la capital.

### Controles comunes
*   **Filtros**: Botones rápidos para aislar continentes (ej. «solo África»).
*   **Etiquetas** (solo en repaso de países): Activar/desactivar nombres de países y/o capitales.
*   **Globo 3D**: Siempre se usa el globo terráqueo, nunca mapas planos.

---

## Jugar (modo C)

El **camino guiado** para ir subiendo de nivel progresivamente. Es probablemente el modo más divertido.

### Flujo para cada nivel-continente
1.  **Entrenamiento**: Preguntas variadas de los tipos A-F (solo países/capitales del nivel actual).
2.  **Refuerzo de fallos**: Repasos específicos de lo que el usuario suele fallar.
3.  **Prueba final**: Cuando el usuario está preparado (acierta consistentemente), hace la Prueba 1 o 2 para certificar su nivel.

### Tipos de juego

#### A. Desafío capital → país (texto → texto)
*   **Pregunta**: «¿Cuál es la capital de **Francia**?»
*   **Opciones**: París, Londres, Roma, Berlín.
*   **Visual**: Cámara viaja al país.

#### B. Desafío país → capital (texto → texto)
*   **Pregunta**: «**París** es la capital de...?»
*   **Opciones**: Francia, España, Italia, Alemania.
*   **Visual**: Pin en la ciudad.

#### C. Encuentra el país (texto → mapa) ⭐ Prueba 1
*   **Pregunta**: «**Brasil**»
*   **Acción**: Rotar globo y tocar la geometría correcta.

#### D. Encuentra la capital (texto → mapa) ⭐ Prueba 2
*   **Pregunta**: «**Madrid**»
*   **Acción**: Tocar la capital (o el país que la contiene, para facilitar en móviles).

#### E. ¡Nombra el país! (mapa → texto)
*   **Pregunta**: «¿Qué país está resaltado?» (brilla en dorado)
*   **Opciones**: Brasil, Argentina, Perú, Chile.

#### F. ¡Nombra la capital! (mapa → texto)
*   **Pregunta**: «¿Cuál es la capital de este país?» (país en dorado + círculo en capital)
*   **Opciones**: Brasilia, Buenos Aires, Lima, Santiago.

### Rondas de preguntas (TBD)
*   **Turista**: 10 preguntas por ronda.
*   **Mochilero**: 15 preguntas por ronda.
*   **Guía**: 20 preguntas por ronda.

### Metáfora: «El pasaporte de explorador»
El objetivo es llenar de sellos un pasaporte virtual e ir subiendo de nivel.

### Sistema de puntos XP (TBD)
*   **Base**: +10 puntos por acierto, -5 por fallo (mínimo 0 por ronda).
*   **Racha (combo)**: x2 a partir de 3 aciertos seguidos. Visual especial al activarse.

## Fuentes de datos (decisión técnica) [pendiente refinar]
Para garantizar precisión y rendimiento:
1.  **Mapas (geometría)**: **Natural Earth Data** (vía GeoJSON optimizados). Es el estándar open source para fronteras vectoriales ligeras.
2.  **Datos (texto)**: **REST Countries API** (o un dump estático de este dataset). Nos da: capital, población, bandera (SVG), y nombres nativos/traducciones.
    *   *Nota*: Usaremos un JSON estático local para no depender de la API en tiempo real (offline-first).

[TO DOUBLE-VALIDATE] -> considerar utilizar https://restcountries.com/ para obtener datos de países / capitales y todo lo necesario para la ficha de país. Por otro lado, utilizar ISO 3166 para los códigos de los países.


## Consideraciones visuales
* el mapa 3D / globo terráqueo es el protagonista cuando se muestre. No utilizaremos mapas 2D. Queremos que el usuario tenga verdadero sentido de la superficie de los países.
* Las fronteras de los países deben ser claras, pero también las de los continentes.
