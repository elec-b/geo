# Spike: Optimizar tiempo de `npm run device`

> Fecha: 2025-03-21

## Problema

`npm run device` tarda ~60s por despliegue. Para iterar rápido en dispositivo, es demasiado.

## Mediciones del pipeline actual

| Fase | Comando | Tiempo | % total |
|------|---------|--------|---------|
| 1. Type check | `tsc -b` | 4.4s | 7% |
| 2. Bundle | `vite build` | 3.1s | 5% |
| 3. Sync | `npx cap sync` | 2.0s | 3% |
| 4. Compilar | `xcodebuild` (Release) | ~45-50s | **82%** |
| 5. Instalar | `xcrun devicectl` | ~2-3s | 3% |

**Conclusión**: xcodebuild es el cuello de botella absoluto.

## Hallazgo principal: xcodebuild en Release

El comando actual no especifica `-configuration`, y el proyecto tiene `defaultConfigurationName = Release`. Esto significa que cada build de desarrollo usa configuración Release, lo cual implica:

| Setting | Release (actual) | Debug (óptimo) |
|---------|------------------|----------------|
| `SWIFT_COMPILATION_MODE` | `wholemodule` (recompila TODO) | incremental (solo archivos cambiados) |
| `SWIFT_OPTIMIZATION_LEVEL` | `-O` (optimiza) | `-Onone` (sin optimizar) |
| `DEBUG_INFORMATION_FORMAT` | `dwarf-with-dsym` (genera dSYM) | `dwarf` (sin dSYM) |
| `ONLY_ACTIVE_ARCH` | NO definido | `YES` (solo arch activa) |

El modo **wholemodule** es el más dañino: fuerza recompilación completa del módulo Swift ante cualquier cambio, anulando builds incrementales. El `.pbxproj` ya tiene Debug bien configurado.

## Plan de optimización

### Nivel 1 — Optimizar pipeline actual (de ~60s a ~25s)

1. **`-configuration Debug`** en xcodebuild → builds incrementales reales, sin optimización, sin dSYM
2. **`COMPILER_INDEX_STORE_ENABLE=NO`** → desactiva indexación innecesaria desde CLI (~10-15%)
3. **Eliminar `tsc -b`** del script de device → -4s (Vite ya transpila TS; type check queda en el IDE)
4. **`cap copy` en vez de `cap sync`** → -0.5s (solo copia assets; sync se ejecuta manualmente al añadir plugins)

Comando optimizado:
```bash
source .env.local && vite build && npx cap copy && xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination "id=$IOS_DEVICE_UDID" -derivedDataPath ios/DerivedData COMPILER_INDEX_STORE_ENABLE=NO build && xcrun devicectl device install app --device $IOS_DEVICE_ID ios/DerivedData/Build/Products/Debug-iphoneos/App.app && xcrun devicectl device process launch --terminate-existing --device $IOS_DEVICE_ID $IOS_BUNDLE_ID
```

### Nivel 2 — Live Reload (cambios web instantáneos)

Para cambios solo web (95% del desarrollo), evitar todo el ciclo build:
1. Configurar `server.url` condicional en `capacitor.config.ts` (con variable de entorno)
2. Vite dev server escucha en `0.0.0.0:5173`
3. WKWebView carga contenido vía Wi-Fi desde el Mac
4. HMR refleja cambios al instante

**Limitaciones**: misma red Wi-Fi, carga inicial más lenta (red vs disco), HTTP sin cifrar, código sin minificar. No reemplaza testing final con build real — es complementario.

**Configuración**:
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.geoexpert.app',
  appName: 'GeoExpert',
  webDir: 'dist',
  ...(process.env.LIVE_RELOAD && {
    server: {
      url: process.env.LIVE_RELOAD,
      cleartext: true,
    },
  }),
};
```

### Nivel 3 — Diagnóstico fino (si Nivel 1 no basta)

- `xcodebuild -showBuildTimingSummary` para ver desglose exacto
- Analizar si SPM re-resuelve paquetes innecesariamente
- Considerar cacheo más agresivo de DerivedData

## Notas

- `tsc -b` se mantiene en `npm run build` (producción) como guardia de calidad
- El DerivedData actual pesa 436 MB; con `-configuration Debug` se genera en `Debug-iphoneos/` (ruta distinta a `Release-iphoneos/`), así que el primer build Debug será completo
- Los plugins nativos (Haptics, Preferences) funcionan igual en Debug y en Live Reload
