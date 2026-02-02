# Backlog de GeoExpert

> Historial de desarrollo más reciente y próximos pasos. Para el historial completo, consultar git.

---

## Completado

### 2025-02 — Setup inicial
- [x] Proyecto React + Vite configurado
- [x] Globo 3D con `react-globe.gl` funcionando
- [x] Carga de países desde `world-atlas` (TopoJSON → GeoJSON)
- [x] Interacción táctil básica (click en países)
- [x] Tema espacial con fondo negro y estrellas
- [x] Colores simplificados: gris uniforme para todos los países

---

## En progreso

### Globo base
- [ ] Mejorar rendimiento en móvil (throttle de eventos)
- [ ] Añadir animación de entrada suave

---

## Próximos pasos

### Datos de países
- [ ] Integrar REST Countries v3.1 (nombres, banderas, capitales)
- [ ] Crear JSON local con coordenadas de capitales
- [ ] Mapear IDs de Natural Earth a códigos ISO

### Modo de juego: Localiza
- [ ] Diseñar UI del modo «Localiza el país»
- [ ] Implementar selección de país y feedback visual
- [ ] Sistema de puntuación basado en distancia

### Infraestructura
- [ ] Configurar Zustand para estado global
- [ ] Añadir Capacitor para build iOS
- [ ] Probar en simulador iPhone

---

## Ideas futuras
- Modo «Capitales»: localizar capitales en el mapa
- Modo «Banderas»: identificar país por su bandera
- Sistema de niveles por continente
- Estadísticas de progreso del usuario
