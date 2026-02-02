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
- [x] Resolución 10m para incluir todas las islas (Baleares, Canarias, etc.)

---

## En progreso

### ⚠️ Problema con resolución del mapa
- Se cambió de 110m a 10m para incluir islas (Baleares, Canarias)
- **Resultado**: El mapa no carga (archivo de 3.7 MB demasiado pesado)
- **Próximo paso**: Probar con 50m (756 KB) o investigar alternativas (Natural Earth directo, lazy loading)

### Globo base
- [ ] Mejorar rendimiento en móvil (throttle de eventos)
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
- [ ] Añadir Capacitor para build iOS
