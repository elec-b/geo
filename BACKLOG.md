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

### Algoritmo v3 y mejoras Jugar/Estadísticas
- [x] Algoritmo v3: racha max(1), selección inteligente (país compañero, fin de pool), avance colectivo sin precisión global, anti-repetición por pool activo
- [x] Barra de progreso ponderada en Aventura: crédito gradual por racha (streakToFactor), 1 decimal visible, crédito por avance colectivo
- [x] Invitación a sello (umbral 100% en Aventura), sugerencia de progresión al completar tipo E/C/D/F
- [x] Herencia conservadora entre niveles (derivación en lectura, verificación baja frecuencia, ✓ gris en estadísticas)
- [x] Pre-selección continente/nivel al entrar + toast nivel bloqueado
- [x] Conflicto Italia/Vaticano resuelto (tap en microestado acepta país grande)
- [x] Estadísticas: reset inmediato, default inteligente (último continente-nivel jugado), labels abreviados con tooltip
- [x] Alinear estadísticas con algoritmo de juego: fix bug tipo concreto (cola sin filtrar dominados), stats con herencia aplicada, heredados solo A/B con prioridad baja
- [x] ✓ gris para inferencia intra-nivel: A dominado → E gris; B dominado → C/D/F grises. Leyenda "Heredado" → "Inferido"

---

## Próximos pasos

> Ordenados por prioridad. Las áreas se listan de mayor a menor urgencia.

### Estadísticas y algoritmo
- [ ] Bug: modo tipo concreto (C/D/E/F) con pocos países pendientes genera opciones sin distractores suficientes. Repro: jugar tipo C en África-Mochilero hasta dominar 32/33 → al regenerar la cola para el último país, `generateQuestionsByType` pasa solo los países pendientes a los generadores batch, que los usan como pool de distractores → `pickOptions` devuelve 1 opción en vez de 4. Fix: pasar todos los países del nivel como pool de distractores, no solo los pendientes

### Jugar
- [ ] Modal completar tipo E/C/D/F: texto motivador ("¡Fenomenal! X superado", nombre en cursiva), quitar resumen aciertos/fallos, botones sin jerarquía visual ("Jugar X" / "Jugar Aventura", cursiva), "Seleccionar otro" en vez de "Volver al selector"
- [ ] Invitación a sello tipo A/B: corregir — si el usuario domina 100% en A o B, invitar al sello (no a tipos anteriores no dominados como D o F)
- [ ] Pre-selección nivel: verificar que se pre-selecciona el máximo nivel desbloqueado
- [ ] Indicar niveles superados en el selector (estilo visual sencillo, similar al toast de nivel bloqueado)
- [ ] Quitar botón "salir" de la barra de progreso; usar tab bar "Jugar" para volver al selector
- [ ] Verificar Micronesia en Oceanía: ¿tiene suficiente perspectiva en los juegos C-F? En los juegos en los que hay que identificar la capital, parece también haber problemas con la ubicación de la capital.
- [ ] Zoom Oceanía E/F: el zoom in sobre los grupos de islas es demasiado grande (e.g. Islas Salomón o Islas Fiji), no hay perspectiva de lo que hay al lado. Quizás aplicable para todos los continentes
- [ ] Zoom en Oceanía en A (comprobar también en E): no se muestra el continente completo, hay que alejar un poco más para que se vea completo en pantalla. Verificar antes coherencia con la regla que tenemos de hacer zoom out solo si no se ve el país. Discutir antes de implementar.
- [ ] Cuando un juego de un continente-nivel ya se ha jugado parcialmente, el botón inferior, en vez de mostrar "empezar" debe mostrar "reanudar" o "continuar" o algo así (piensa bien la palabra)

### Estadísticas
- [ ] Quitar contadores de aciertos/fallos del bottom
- [ ] Botón toggle para mostrar % de acierto por país (en vez de iconos de dominio).
- [ ] Añadir otra tabla para mostrar resultados en pruebas de sello. Pensar bien el diseño antes y anotar en design.md (queremos mostrar tick o cross, de manera similar a las de los juegos? Queremos mostrar % de acierto? Ambas cosas?)

### Explorar
- [ ] Groenlandia aparece como país independiente pero es territorio de Dinamarca (reconocido por la ONU). Investigar por qué y corregir (también "impactará" en Jugar, obviamente)
- [ ] Verificar Micronesia, Kiribati, Samoa... ¿Están bien ubicados los marcadores de micro estado? (Deberían estar en la capital) ¿Hay alguna manera mejor de reflejar estos dispersos conjuntos de islas?
- [ ] El Aaiun aparece mal ubicado - repasar

### Pasaporte
- [ ] Mejorar estética: el grid está bien, pero debe transmitir la sensación de "pasaporte en una página". Pensar bien el aspecto visual antes de implementar

### Multi-usuario
- [ ] Comprobar si cuando se cambia de usuario, si hay otro usuario en Jugar o en Pasaporte, el juego / prueba de sello se para (si es que está en alguno de estos) - esta es la funcionalidad lógica. El nuevo usuario empieza en Explorar. 

### UX general
- [ ] Bottom sheets (configuración y ficha de país): añadir handle + implementar drag-to-dismiss
- [ ] Feedback háptico: vibraciones más cortas/sutiles
- [ ] Iconos de tipos de juego: evaluar iconos por tipo (y aplicarlos en selector de Jugar, modales y tabla de estadísticas). Diseñar antes de implementar
- [ ][PENSAR] Sello automático: si el usuario supera tipo A o B con 0 errores de un solo intento / en una misma parte de la sesión, otorgar el sello directamente (equivalente a la prueba de sello). Documentar en DESIGN.md


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

