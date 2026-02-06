# Investigación: Rendimiento de Carga del Globo

## Estado Actual
- **Archivo de datos:** `public/data/countries-50m.json`
- **Formato:** TopoJSON
- **Tamaño:** 739KB (sin comprimir)
- **Proceso:** Fetch en cliente → JSON Parse → Conversión TopoJSON a GeoJSON (Hilo Principal)

## Análisis del Cuello de Botella
El archivo de 739KB es relativamente pequeño para transferencia de red (especialmente con gzip), pero el **costo de CPU** de parsear y convertir TopoJSON a GeoJSON es significativo.
- `topojson.feature()` es una operación síncrona que reconstruye miles de coordenadas de polígonos.
- Ejecutar esto en el **Hilo Principal** bloquea el render loop del navegador, causando la sensación de "congelamiento" o "estático" durante la carga.

## Opciones de Optimización (Ordenadas por Prioridad)

### 1. Web Worker (Recomendado)
**Impacto:** Alto (Percibido)

Mover el `fetch`, `JSON.parse` y la conversión `topojson.feature` a un Worker en segundo plano.
- **Pros:** Mantiene el UI (spinner/globo) 100% responsivo durante el procesamiento.
- **Contras:** Ligero aumento de complejidad (mensajería asíncrona).

### 2. GeoJSON Pre-convertido
**Impacto:** Medio (Trade-off)

Convertir TopoJSON a GeoJSON offline y servir `countries.geojson`.
- **Pros:** Sin conversión TopoJSON costosa en runtime.
- **Contras:** El tamaño del archivo se dispara (739KB → ~5MB+). El tiempo de transferencia de red aumenta, posiblemente negando el ahorro de CPU.

### 3. Carga Progresiva (Revisitar)
**Impacto:** Alto

Cargar 110m (~100KB) primero, luego 50m.
- **Por qué falló antes:** La sincronización/transición causaba problemas, o la carga de 50m eventualmente bloqueaba el hilo de todas formas.
- **Solución:** Combinar con **Web Worker** para que la carga de 50m ocurra silenciosamente en segundo plano sin congelar la rotación del 110m.

### 4. Formato Binario (Geobuf)
**Impacto:** Alto

Usar `geobuf` (Protocol Buffers para GeoJSON).
- **Pros:** Parseo extremadamente rápido y tamaño reducido.
- **Contras:** Requiere añadir una librería decodificadora (`geobuf`, `pbf`).

## Conclusión
Para que la carga se sienta "instantánea" o al menos fluida, debemos mover el trabajo pesado fuera del hilo principal. **Web Worker** es la solución más limpia que no requiere cambiar formatos de datos ni aumentar el uso de ancho de banda.
