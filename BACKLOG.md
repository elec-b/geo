# Backlog de GeoExpert

> Historial de desarrollo más reciente y próximos pasos. Para el historial completo, consultar git.

---

## Completado

### Globo y motor de renderizado
- [x] Proyecto React + Vite + Capacitor iOS. D3.js `geoOrthographic()` sobre Canvas 2D
- [x] Zoom ×200, inercia, pinch+drag, marcadores de microestados, fronteras escalables, dirty flag

### Datos, i18n y estado
- [x] REST Countries + `world-atlas` 50m + capitales JSON (195 países). Zustand store multi-perfil
- [x] Datos en español completos (capitales, gentilicios, monedas, idiomas, IDH/IDH-D, Wikipedia slugs)
- [x] Antártida (ficha especial) y territorios no-ONU (ficha + disclaimer, etiquetas ámbar)

### Navegación y Explorar
- [x] Tab bar, header, z-index centralizado. Ficha de país completa con todos los campos y rankings
- [x] Globo: etiquetas anti-solapamiento, filtros por continente, flyTo con offset dinámico
- [x] Tabla: headers sticky/ordenables, toggle no-ONU, segmented control Globo|Tabla
- [x] Auditoría diseño responsivo (px → rem)

### Experiencia: Jugar
- [x] 6 tipos de juego (A-F) con feedback visual, zoom adaptativo, pines de capitales, flyTo entre preguntas
- [x] Flujo completo (continente → nivel → tipo), modo Aventura, LevelSelector sin paso intermedio
- [x] Algoritmo de aprendizaje v2: rachas, etapas, regresión, avance colectivo, inferencia, anti-repetición
- [x] Vista de estadísticas provisional (tabla de dominio por tipo, selector nivel×continente, reset)
- [x] Archipiélagos antimeridiano (Fiji, Tonga, Kiribati), zoom out A/B automático
- [x] Zoom E/F: ×0.6 + floor 2.0, centroide Oceanía ajustado, `isPointVisible` dependiente del zoom
- [x] Sistema de pruebas de sello (0 errores, invitación desde Jugar + acceso desde Pasaporte)
- [x] Texto del modal de sello adaptado según tipo (países/capitales)

### Experiencia: Pasaporte
- [x] Matriz niveles × continentes con sellos (Países/Capitales), acceso directo a pruebas
- [x] Color del pasaporte según nivel global (verde/azul/dorado)
- [x] Fondo opaco para legibilidad del dashboard

### Perfiles de usuario
- [x] Pantalla de creación de perfil (nombre por defecto «Explorador» + numeración automática)
- [x] Selector de avatares (iconos de animales representativos de los 5 continentes)
- [x] Selector de perfil (cambio rápido desde cualquier pantalla, tap en avatar)
- [x] Progreso independiente por perfil (pasaporte, sellos, fallos)

### Configuración y háptica
- [x] Bottom sheet desde el engranaje del header (vibración, idioma, tema, marcadores de microestados — este último solo visible en Explorar)
- [x] Feedback háptico (acierto/fallo en juego, toggles en configuración) con `@capacitor/haptics`

---

## Próximos pasos

> Ordenados por prioridad. Las áreas se listan de mayor a menor urgencia.

### Algoritmo de aprendizaje v3 (diseño documentado en DESIGN.md)
- [ ] Racha `max(1, streak+1)`: un acierto siempre lleva a dominado (1 línea en appStore.ts)
- [ ] Selección inteligente: eliminar categoría maintenance, implementar país compañero (≤2 pendientes), fin de sesión cuando pool vacío
- [ ] Avance colectivo: eliminar requisito de precisión global (solo 40% de dominio)
- [ ] Barra de progreso ponderada (20/30/50) en modo Aventura, con crédito para países avanzados por avance colectivo
- [ ] Invitaciones a sello: umbral 80%→100% en Aventura + invitación a sello desde modo tipo concreto A/B
- [ ] Sugerencia de progresión al completar modo tipo concreto E/C/D/F: CTA al siguiente tipo + Aventura
- [ ] Herencia conservadora entre niveles: derivación en lectura de A/B, verificación de baja frecuencia, sin contar para avance colectivo
- [ ] Anti-repetición: buffer sobre pool activo N = mín(3, pool_activo / 2)

### Jugar
- [ ] Pre-seleccionar continente/nivel/tipo al entrar: 1) continente del dispositivo (sin leer info sensible), 2) máximo nivel desbloqueado, 3) aventura. Mostrar mensaje si el usuario pulsa un nivel no desbloqueado
- [ ] Conflicto Italia/Vaticano: al preguntar por la capital de Italia, evitar que se seleccione accidentalmente Vaticano (y viceversa). Evaluar solución (ej. solo aceptar tap en el punto exacto de Roma)
- [ ] Verificar Micronesia en Oceanía: ¿tiene suficiente perspectiva en los juegos C-F? En los juegos en los que hay que identificar la capital, parece también haber problemas con la ubicación de la capital.
- [ ] Testeando Oceanía (pero quizás aplicable para todos los continentes?): en los juegos E y F, el zoom in sobre los grupos de islas es demasiado grande (e.g. Islas Salomón o Islas Fiji), no hay perspectiva de lo que hay al lado.

### Estadísticas
- [ ] Bug: al resetear estadísticas, los datos no se ven borrados hasta cambiar de continente-nivel y volver
- [ ] Default inteligente: al abrir, mostrar el último continente-nivel jugado o en el que se hizo prueba de sello. Fallback: continente del dispositivo + nivel guía
- [ ] Mejorar tabla: reemplazar las letras A-F por nombres o iconos comprensibles para el usuario

### Explorar
- [ ] Groenlandia aparece como país independiente pero es territorio de Dinamarca (reconocido por la ONU). Investigar por qué y corregir

### Pasaporte
- [ ] Mejorar estética: el grid está bien, pero debe transmitir la sensación de "pasaporte en una página". Pensar bien el aspecto visual antes de implementar

### UX general
- [ ] Bottom sheets (configuración y ficha de país): añadir handle + implementar drag-to-dismiss
- [ ] Feedback háptico: vibraciones más cortas/sutiles

### Internacionalización (UI completa)
- [ ] Elegir librería de i18n (i18next, react-intl u otra)
- [ ] Externalizar textos de la app a archivos de traducción
  - Los datos sintéticos en `countryData.ts` (SOL, CYN, AQ) tienen nombres hardcodeados en español
- [ ] Generar datos multi-idioma (ampliar script para todos los idiomas soportados)
- [ ] Traducción a idiomas disponibles en iOS y Android

### Testing
- [ ] Definir estrategia de testing para lógica de juego (Vitest o similar)

### Infraestructura y acabados
- [ ] Añadir Capacitor para build Android
- [ ] Actualización silenciosa de datos vía CDN (ver DESIGN.md)
- [ ] Sección "Acerca de": explicar criterios (países ONU, idiomas oficiales, fuentes UNDP, REST Countries, etc.)
- [ ] Solicitud de valoración in-app (SKStoreReviewController iOS + Play In-App Review Android)

### Tema visual
- [ ] Diseñar e implementar tema claro (baja prioridad, casi al final del desarrollo)

