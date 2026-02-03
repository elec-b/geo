# Backlog de GeoExpert

> Historial de desarrollo más reciente y próximos pasos. Para el historial completo, consultar git.

---

## Completado

### Setup inicial
- [x] Proyecto React + Vite configurado
- [x] Globo 3D con `react-globe.gl` funcionando
- [x] Carga de países desde `world-atlas` (TopoJSON → GeoJSON)
- [x] Interacción táctil básica (click en países)
- [x] Tema espacial con fondo negro y estrellas
- [x] Colores simplificados: gris uniforme para todos los países
- [x] Resolución 50m (equilibrio detalle/rendimiento, incluye Baleares, Canarias, Caribe, Oceanía)
  - ⚠️ Falta Tuvalu (11,000 hab.) — no incluido en 50m, requeriría 10m que causa fallo de WebGL
- [x] Capacitor iOS configurado y probado en Simulator (iPhone 16e, iOS 26.1)
  - Tiempo de carga ~17s en Simulator (sin GPU real, no representativo)
  - Rendimiento fluido una vez cargado
  - Interacción táctil (zoom, rotación) funciona correctamente
- [x] Z-fighting en áreas grandes (Groenlandia) corregido con `polygonCapCurvatureResolution: 5`

---

## En progreso

### Globo base
- [ ] Quitar luz del polo norte (point light visible)
- [ ] Permitir rotación vertical completa (actualmente se bloquea al llegar a los polos)
- [ ] Aumentar zoom máximo para países pequeños (Liechtenstein, Andorra, Singapur) — problema "Fat Finger"
- [ ] Mejorar tiempo de carga inicial (~17s en Simulator) — splash screen, code splitting o lazy loading
  - WIP: Implementado splash screen HTML, lazy loading de Globe, TopoJSON externalizado, Vite code splitting
  - Pendiente: verificar que funciona correctamente y medir mejora real
- [ ] Detener rotación automática al interactuar (click/touch), no solo al seleccionar país
- [ ] Añadir animación de entrada suave

---

## Próximos pasos

### Datos de países
- [ ] Integrar REST Countries v3.1 (nombres, banderas, capitales)
- [ ] Crear `capitals.json` con coordenadas de 195 capitales
- [ ] Mapear IDs de Natural Earth a códigos ISO (cca2)

### Experiencia: Explorar
- [ ] Ficha de país al tocar (nombre, bandera, capital, población, superficie)
- [ ] Filtros por continente
- [ ] Marcador de capital sobre el mapa

### Experiencia: Jugar
- [ ] Tipo A: Localizar país en el mapa (texto → mapa)
- [ ] Tipo B: Localizar capital en el mapa (texto → mapa)
- [ ] Feedback visual: verde/rojo según acierto
- [ ] Barra de progreso

### Experiencia: Mi Pasaporte
- [ ] Vista de matriz niveles × continentes
- [ ] Sistema de sellos (Países y Capitales)

### Infraestructura
- [ ] Configurar Zustand para estado global
- [ ] Sistema de perfiles de usuario
- [ ] Añadir Capacitor para build Android
