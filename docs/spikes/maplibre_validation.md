# Spike: Validación de MapLibre GL JS v5

> **Fecha de inicio**: febrero 2026
> **Rama**: `spike/maplibre-globe-validation`
> **Objetivo**: Validar que MapLibre GL JS v5 con globe projection cumple los requisitos de rendimiento y funcionalidad para reemplazar react-globe.gl.

---

## Criterios de éxito

| # | Criterio | Objetivo | Resultado | Pasa |
|---|----------|----------|-----------|------|
| 1 | Tiempo de carga (195 países) | <3s | _pendiente_ | |
| 2 | FPS durante rotación | >30 FPS | _pendiente_ | |
| 3 | Picking preciso (20 países variados) | 100% (20/20) | _pendiente_ | |
| 4 | flyTo fluido (5 países distantes) | Sin jitter | _pendiente_ | |
| 5 | Sin CONTEXT_LOST tras 2 min de uso | 0 errores | _pendiente_ | |

---

## Métricas por entorno

### Chrome/Safari desktop (dev mode)

| Métrica | Valor |
|---------|-------|
| Tiempo de carga | _pendiente_ |
| FPS rotación | _pendiente_ |
| Picking OK | _pendiente_ |
| Notas | |

### Production build + iOS Simulator

| Métrica | Valor |
|---------|-------|
| Tiempo de carga | _pendiente_ |
| FPS rotación | _pendiente_ |
| Picking OK | _pendiente_ |
| CONTEXT_LOST | _pendiente_ |
| Notas | |

### Dispositivo físico iOS (si disponible)

| Métrica | Valor |
|---------|-------|
| Tiempo de carga | _pendiente_ |
| FPS rotación | _pendiente_ |
| Picking OK | _pendiente_ |
| CONTEXT_LOST | _pendiente_ |
| Notas | |

---

## Comparativa react-globe.gl vs MapLibre

| Aspecto | react-globe.gl | MapLibre GL JS v5 |
|---------|---------------|-------------------|
| Tiempo de carga (iOS Sim) | ~17s | _pendiente_ |
| FPS durante rotación | _pendiente_ | _pendiente_ |
| Bundle size (gzip) | ~350KB + Three.js ~170KB | ~230KB |
| Draw calls | ~500 | _pendiente_ |

---

## Problemas encontrados

_Documentar aquí cualquier problema, bug o limitación encontrada durante el spike._

1. —

---

## Test de flyTo

Países probados:

| País | Coordenadas | Resultado |
|------|-------------|-----------|
| Brasil | [-47.9, -15.8] | _pendiente_ |
| Japón | [139.7, 35.7] | _pendiente_ |
| Australia | [149.1, -35.3] | _pendiente_ |
| Noruega | [10.7, 59.9] | _pendiente_ |
| Sudáfrica | [28.0, -25.7] | _pendiente_ |

---

## Test de picking (20 países)

| # | País | Tamaño | Resultado |
|---|------|--------|-----------|
| 1 | Rusia | Grande | _pendiente_ |
| 2 | Canadá | Grande | _pendiente_ |
| 3 | Brasil | Grande | _pendiente_ |
| 4 | Australia | Grande | _pendiente_ |
| 5 | China | Grande | _pendiente_ |
| 6 | España | Mediano | _pendiente_ |
| 7 | Japón | Mediano (islas) | _pendiente_ |
| 8 | Nueva Zelanda | Mediano (islas) | _pendiente_ |
| 9 | Italia | Mediano | _pendiente_ |
| 10 | Cuba | Mediano (isla) | _pendiente_ |
| 11 | Suiza | Pequeño | _pendiente_ |
| 12 | Países Bajos | Pequeño | _pendiente_ |
| 13 | Bélgica | Pequeño | _pendiente_ |
| 14 | Israel | Pequeño | _pendiente_ |
| 15 | Singapur | Muy pequeño | _pendiente_ |
| 16 | Luxemburgo | Muy pequeño | _pendiente_ |
| 17 | Indonesia | Archipiélago | _pendiente_ |
| 18 | Filipinas | Archipiélago | _pendiente_ |
| 19 | Chile | Forma alargada | _pendiente_ |
| 20 | Noruega | Forma alargada | _pendiente_ |

---

## Decisión

- [ ] **Proceder** con migración completa a MapLibre GL JS v5
- [ ] **No proceder** — razón: ___

### Justificación

_Rellenar tras completar las pruebas._
