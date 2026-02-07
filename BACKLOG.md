# Backlog de GeoExpert

> Historial de desarrollo más reciente y próximos pasos. Para el historial completo, consultar git.

---

## Completado

### Setup inicial
- [x] Proyecto React + Vite configurado
- [x] Globo 3D con MapLibre GL JS v5 (globe projection)
- [x] Carga de países desde `world-atlas` (TopoJSON → GeoJSON)
- [x] Interacción táctil básica (click en países)
- [x] Tema espacial con fondo negro y estrellas
- [x] Colores simplificados: gris uniforme para todos los países
- [x] Resolución 50m (equilibrio detalle/rendimiento, incluye Baleares, Canarias, Caribe, Oceanía)
  - ⚠️ Falta Tuvalu (11,000 hab.) — no incluido en 50m (limitación del dataset, no del motor)
- [x] Capacitor iOS configurado y probado en Simulator (iPhone 16e, iOS 26.1)

---

## En progreso

### Globo base

- [ ] Permitir rotación vertical completa (actualmente se bloquea al llegar a los polos)
- [ ] Aumentar zoom máximo para poder seleccionar países pequeños (Liechtenstein, Andorra, Singapur) — problema "Fat Finger"
- [ ] Detener rotación automática al interactuar (click/touch), no solo al seleccionar país

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

### Perfiles de usuario
- [ ] Pantalla de creación de perfil (nombre + avatar)
- [ ] Selector de perfil (cambio rápido desde cualquier pantalla)
- [ ] Persistencia de perfiles (Capacitor Preferences o SQLite)
- [ ] Progreso independiente por perfil (pasaporte, sellos, fallos)

### Infraestructura
- [ ] Configurar Zustand para estado global
- [ ] Añadir Capacitor para build Android
- [ ] Actualización silenciosa de datos vía CDN (ver OVERVIEW.md § «Actualización automática»)
- [ ] Implementar feedback háptico (vibración en aciertos/errores)

### Internacionalización
- [ ] Elegir librería de i18n (i18next, react-intl u otra)
- [ ] Externalizar textos de la app a archivos de traducción
- [ ] Traducción a idiomas disponibles en iOS y Android
