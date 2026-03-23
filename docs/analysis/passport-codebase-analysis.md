# Análisis del codebase actual — Pasaporte

**Autor**: Analista
**Fecha**: 2026-03-15
**Objetivo**: Documentar la estructura actual del Pasaporte, constrains técnicos y viabilidad de cambios.

---

## 1. Estructura del componente

### Archivo principal: `src/components/Passport/PassportView.tsx` (213 líneas)

**Responsabilidades**:
- Renderizar matriz visual 5 continentes × 3 niveles (15 celdas)
- Gestionar estado de selección de celdas (para abrir modal)
- Mostrar header con nivel global del usuario
- Mostrar leyenda de símbolos
- Invocar modal para elegir tipo de sello (países o capitales)

**Estructura jerárquica**:
```
PassportView (contenedor)
├─ Header con nivel global
│  ├─ Icono (📘)
│  └─ Info (nombre perfil, nivel global)
├─ Grid 5×3
│  ├─ Esquina vacía + encabezados de niveles
│  ├─ 5 filas de continentes × 3 celdas de nivel
│  │  └─ Cada celda: sello(s), icono lock, contador de países
└─ Leyenda
└─ Modal (elegir Países vs Capitales)
```

### Datos y lógica

**Fuentes de datos**:
1. `getStamps()` desde `useAppStore` — obtiene booleanos `{ countries, capitals }` por nivel-continente
2. `isLevelUnlocked()` — determina si un nivel está desbloqueado (lógica en `learningAlgorithm.ts`)
3. `getGlobalLevel()` — calcula nivel global del usuario (0-2 continentes completados)
4. `levels: Map<string, LevelDefinition>` — propiedades del nivel (incluyendo count de países)

**Estado local**:
- `selectedCell: { level, continent } | null` — qué celda está seleccionada para abrir modal

**Interacciones**:
- Click en celda desbloqueada y no completa → abre modal
- Modal: botones "Sello de Países" y "Sello de Capitales" (solo si sello pendiente)
- Cancelar → cierra modal

---

## 2. Estilos actuales

### Archivo: `src/components/Passport/PassportView.css` (160 líneas)

**Arquitectura CSS**:
- Flexbox para header y leyenda
- CSS Grid para matriz (col: auto + 3×1fr)
- Todas las unidades en `rem` (responsive)
- Variables CSS para colores y espaciado
- Transiciones fluidas en hover/active

**Componentes visuales**:

#### Header (`.passport-header`)
- Fondo: `var(--glass-bg)` (glassmorphism sutil)
- Border: `var(--glass-border)` 1px
- Border-radius: `var(--radius-lg)` (1rem)
- Padding: `var(--spacing-md)` horizontal, vertical
- Icono: 2rem
- Nombre: `font-size-lg` (1.125rem), weight 600
- Nivel: `font-size-sm` (0.875rem), color `--color-text-secondary`
- Color dinámico: `--passport-color` (inline style)

#### Grid (`.passport-grid`)
- Layout: `grid-template-columns: auto repeat(3, 1fr)` — primera columna labels, 3 columnas iguales
- Gap: `var(--spacing-xs)` (0.25rem)
- Max-width: 22rem
- Labels de continente: `font-size-sm`, weight 600, `var(--cell-color)` dinámico
- Encabezados de nivel: emoji + nombre pequeño

#### Celdas (`.passport-cell`)
- Padding: `var(--spacing-sm)` (0.5rem)
- Border-radius: `var(--radius-md)` (0.5rem)
- Min-height: 3.5rem
- Transiciones: background, border-color en `--transition-fast` (150ms)
- Tap highlight deshabilitado: `-webkit-tap-highlight-color: transparent`

**Estados de celda**:
- `--locked`: opacity 0.4, cursor default
- `--available`: border color mixto (40% del color continente), hover background light
- `--complete`: border y glow completo, background con tinte

**Símbolos dentro de celdas**:
- Lock: `font-size-sm` (0.875rem), opacity 0.6
- Stamps: dos iconos pequeños (○ o 🏅), `font-size-sm`
- Counter: `font-size 0.625rem`, color muted

#### Leyenda (`.passport-legend`)
- Flex wrap, gap `--spacing-md`
- Items: `font-size-xs` (0.75rem), `--color-text-muted`

### Variables CSS relevantes (de `variables.css`)

```css
/* Colores continentes (olímpicos) */
--color-africa: #e2e8f0;     /* Gris claro */
--color-america: #ef4444;    /* Rojo */
--color-asia: #fbbf24;       /* Ámbar */
--color-europe: #3b82f6;     /* Azul */
--color-oceania: #22c55e;    /* Verde */

/* Colores de nivel global */
--color-success: #22c55e;    /* Verde (Turista) */
--color-accent-amber: #f59e0b; /* Ámbar (Guía) */
/* Mochilero usa --color-europe (#3b82f6) */

/* Glassmorphism */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);

/* Tipografía */
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;

/* Espaciado */
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;
```

---

## 3. Modal de selección de sello

**Componente**: Mismo archivo `PassportView.tsx`, lines 173–209

**Markup**: Usa clases `.jugar-modal-*` (heredadas de Jugar, compartidas)

**Estructura**:
- Overlay con fondo oscuro (probablemente z-modal)
- Modal centrado:
  - Título: "Prueba de sello"
  - Descripción: nivel + continente
  - 1-2 botones: "Sello de Países" y "Sello de Capitales" (según disponibilidad)
  - Botón Cancelar

**Estilos compartidos**: Las clases `.jugar-modal-*` están definidas en otra hoja CSS (buscar en componentes Game).

---

## 4. ¿Qué es FÁCIL de cambiar?

### Solo CSS
- **Colores** de continentes en header/grid (cambiar `--cell-color` o inline styles)
- **Layout del grid**: gap, padding, border-radius, transiciones
- **Tipografía**: sizes, weights (respetando variables)
- **Background/glassmorphism**: opacidad, blur, colores
- **Sombras y glow** en celdas completes
- **Iconos y emojis**: reemplazar símbolos (○, 🏅, 🔒) por otros
- **Leyenda**: posición, formato, estilos
- **Header**: tamaño icono, posición, colores dinámicos

### Cambios menores de estructura
- **Agregar más información en celdas** (ej. mini-barra de progreso, más texto)
- **Reorden de elementos** dentro de celdas sin cambiar el contenido
- **Agregar transiciones/animaciones** (fade-in, pulse, etc.)

---

## 5. ¿Qué es DIFÍCIL de cambiar?

### Requiere cambio de componente
- **Cambiar el grid de 5×3 a otra dimensión** (ej. 1D horizontal, vertical):
  - Reescribir el loop de CONTINENTS/LEVELS
  - Ajustar `grid-template-columns` dinámicamente
  - Reposicionar labels

- **Agregar nueva información del sello** más allá de `{ countries, capitals }`:
  - Modificar `learningAlgorithm.ts` para devolver más datos en `getStamps()`
  - Cambiar estructura `StampsData`

- **Cambiar la lógica de unlock** de niveles:
  - Reescribir `isLevelUnlocked()` en `learningAlgorithm.ts`

- **Agregar sellos de otros tipos** (ej. ciudades, ríos, montañas):
  - Refactor de `StampTestType` en hooks/stores
  - Nueva lógica de persistencia

- **Cambiar el modal de selección** a otro componente UI (ej. picker/carousel):
  - Extraer modal a componente separado
  - Nueva lógica de estado

- **Integración con Nav/Tab bar**:
  - El componente está dentro de `tab-overlay` (clase en Passport, probablemente en Layout)
  - Cambios en navegación requieren tocar TabBar

### Requiere cambio de datos
- **Agregar/quitar continentes o niveles**: tocar CONTINENTES/LEVELS, `learningAlgorithm.ts`, tipos

---

## 6. Constraints de diseño

### Mobile-first
- Tamaño máximo del grid: **22rem** (352px). No escalará más allá.
- Padding alrededor: `var(--spacing-md)` a `var(--spacing-lg)`
- Fuentes pequeñas: `font-size-xs` a `font-size-lg` máximo
- Tap targets: min 44px (celdas son ~3.5rem, OK para toque)

### Dark mode
- Todos los colores deben tener suficiente contraste en fondo oscuro (#0a0a1a)
- No se soporta light mode actualmente (tarea futura de baja prioridad)

### Vanilla CSS
- No hay preprocesador (SASS, Less)
- Todas las variables en `:root` de `variables.css`
- No usar calc() complejo ni custom properties en media queries (iOS < 15 puede tener problemas)

### Responsividad
- Unidades: `rem` para todo excepto bordes decorativos (1px)
- Viewport base: mobile (320px–480px)
- No hay media queries actualmente — el componente es fluido

---

## 7. Patrones de código observados

### React patterns
- `useCallback` para handlers (click en celdas)
- `useMemo` para construir `StampsData` completo desde getters
- Estado local con `useState` (solo `selectedCell`)
- Derivación de estado (no guardar booleans que se pueden calcular)

### Tipos TypeScript
- `Continent` enum/union: 'África', 'América', 'Asia', 'Europa', 'Oceanía'
- `GameLevel`: 'turista' | 'mochilero' | 'guía'
- `StampsData`: `Record<GameLevel, Record<Continent, { countries, capitals }>>`

### Accesibilidad
- `title` en stamps (tooltips)
- `aria-live="assertive"` en GameFeedback (en otro componente)
- `-webkit-tap-highlight-color: transparent` para UX táctil

---

## 8. Integración con otros sistemas

### Data flow
```
PassportView (lee)
├─ useAppStore.getStamps(level, continent) → { countries, capitals }
├─ useAppStore.getActiveProfile() → { name }
├─ learningAlgorithm.isLevelUnlocked() → boolean
├─ learningAlgorithm.getGlobalLevel(stampsData) → GameLevel | null
└─ levels (prop) → Map<string, LevelDefinition>

PassportView (escribe)
└─ onStartStampTest() → callback al padre
```

### Padres posibles
- Probablemente `JugarView` o `AppContainer` pasa `levels` prop
- El callback `onStartStampTest` navega a una prueba modal

### Hermanos
- `StatsView` (en tabs) — comparte selector de nivel×continente
- `ExploreView` — tiene propios selector de continentes

---

## 9. Recomendaciones para el equipo de diseño

### Fácil implementar (0–2h)
- Cambio de colores continentes (nuevos `--color-*`)
- Iconos/emojis diferentes para niveles y estados
- Header más/menos prominente (tamaño, borde, background)
- Leyenda repositionada (arriba, lado, reducida)
- Animaciones de fade/pulse al cargar o en hover

### Moderadamente complejo (2–6h)
- Grid reordenado (ej. 3×5 en lugar de 5×3)
- Agregar mini-barra de progreso en celdas (% countries + capitals)
- Cambiar símbolos por iconos SVG customizados
- Header remodelado (avatares, estadísticas adicionales)
- Transiciones suaves entre estados (locked→available→complete)

### Complejo (6h+)
- Cambiar visualización de matriz a otra (ej. mapa interactivo, circular, 3D)
- Agregar sellos adicionales (3+ tipos)
- Integración con globo (mostrar Pasaporte como overlay sobre mapa)
- Navegación a profundidad (click en sello → expandir detalles)

---

## 10. Estándares y convenciones

**Nomenclatura CSS**:
- BEM: `.block__element--modifier`
- Prefijos por sección: `.passport-*`, `.jugar-*`, `.game-*`

**Nomenclatura TypeScript**:
- PascalCase para componentes, types, interfaces
- camelCase para funciones, variables
- Comentarios en español

**Persistencia**:
- `useAppStore` (Zustand)
- Las stampsData se construyen en memoria desde getters, no se almacenan localmente

---

## Conclusión

El Pasaporte es un **componente bastante limpio y modular**:
- ✅ CSS bien estructurado con variables (fácil retoque visual)
- ✅ Lógica separada en `learningAlgorithm.ts` (fácil editar reglas de unlock)
- ✅ React patterns modernos (hooks, memoization)
- ✅ Responsive por defecto (unidades rem, sin hardcodes)
- ⚠️ Modal compartido con Jugar (`jugar-modal-*` classes) — cambios a modal afectan ambas vistas
- ⚠️ Max-width hardcoded a 22rem — escalabilidad limitada sin refactor

**Para propuestas de rediseño**:
- Si el cambio es visual (colores, layout grid, iconos, animaciones): **implementación rápida**.
- Si requiere cambiar estructura de datos (más sellos, nuevos tipos): **necesita refactor de algorithmo + tipos**.
- Si involucra cambiar modal o navegar hacia pruebas: **necesita tocar JugarView y flows de navegación**.
