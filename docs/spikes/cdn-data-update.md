# Spike: Actualización silenciosa de datos vía CDN (Exploris)

**Fecha**: 2026-04-03  
**Método**: Análisis de código + revisión de stack técnico  
**Contexto**: Diseño de funcionalidad de "actualización silenciosa de datos vía CDN" para React + Capacitor (iOS/Android)  
**Fuentes**: `src/data/countryData.ts`, `src/App.tsx`, `package.json`, `src/stores/appStore.ts`, `src/stores/persistStorage.ts`

---

## 1. Cómo se cargan los datos actualmente

### Entry point de carga
**Archivo**: `src/App.tsx`, líneas 216-229

```typescript
// Cargar datos de países en el idioma activo
useEffect(() => {
  invalidateCache();
  loadCountryData(locale).then((countriesData) => {
    loadCapitals().then((capitalsData) => {
      const ranksData = buildRankings(countriesData);
      const levelsData = buildLevelDefinitions(countriesData);
      setCountries(countriesData);
      setCapitals(capitalsData);
      setRankings(ranksData);
      setLevels(levelsData);
    });
  });
}, [locale]);
```

### Flujo de carga de datos

1. **`loadCountryData(locale)`** (`src/data/countryData.ts`, líneas 191-228)
   - **Primer fetch**: carga `countries-base.json` una sola vez (se cachea en memoria)
     ```typescript
     const resp = await fetch(`${import.meta.env.BASE_URL}data/countries-base.json`);
     cachedBase = await resp.json();
     ```
   - **Segundo fetch**: carga `data/i18n/{locale}.json` (cambia por idioma)
     ```typescript
     const i18nResp = await fetch(`${import.meta.env.BASE_URL}data/i18n/${locale}.json`);
     const i18nData: Record<string, I18nEntry> = await i18nResp.json();
     ```
   - **Fusión**: combina base + i18n con datos sintéticos (Somalilandia, Chipre del Norte, Antártida)
   - **Resultado**: retorna `Map<cca2, CountryData>`

2. **`loadCapitals()`** (`src/data/countryData.ts`, líneas 234-261)
   - Fetch de `capitals.json`
   - Combina con nombres de capitales desde `countryData`
   - Inyecta capitales sintéticas
   - Retorna `Map<cca2, CapitalCoords>`

3. **Datos derivados**:
   - `buildRankings(countriesData)` — generadas en memoria
   - `buildLevelDefinitions(countriesData)` — generadas en memoria

### Archivos de datos públicos

```
public/data/
├── countries-base.json          # Base agnóstica a idioma (~75KB)
├── capitals.json                # Coordenadas de capitales (~14KB)
├── i18n/{lang}.json            # Traducidos (34 idiomas)
├── countries-50m.json          # TopoJSON de fronteras (~756KB)
├── islands-10m.json            # TopoJSON de islas (~180KB)
├── sea-labels.json             # Labels de océanos
├── overseas-overrides.json     # Overrides de territorios
```

### Caché en memoria
- **`cachedBase`**: `BaseEntry[]` — cargado una vez
- **`cachedLocale`**: último idioma cargado
- **`cachedCountries`**: `Map<string, CountryData>` — cacheado por locale
- **`cachedCapitals`**: `Map<string, CapitalCoords>` — invalidado al cambiar locale
- Getter síncrono: `getCountryData()` y `getCapitals()` lanzan error si no se ha precargado

---

## 2. Capacitor Preferences: implementación actual

### Instalación
✅ **Instalado**: `@capacitor/preferences@^8.0.1` (en `package.json`)

### Uso actual
**Archivo**: `src/stores/persistStorage.ts` (líneas 1-29)

Es un **adapter de storage para Zustand** que unifica web + nativa:

```typescript
const isNative = Capacitor.isNativePlatform();

export const capacitorStorage: StateStorage = {
  getItem: async (key: string) => {
    if (!isNative) return localStorage.getItem(key);
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string) => {
    if (!isNative) {
      localStorage.setItem(key, value);
      return;
    }
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    if (!isNative) {
      localStorage.removeItem(key);
      return;
    }
    await Preferences.remove({ key });
  },
};
```

### Datos persistidos (appStore)
**Archivo**: `src/stores/appStore.ts`, líneas 354-410

```typescript
persist(
  (set, get) => ({...}),
  {
    name: 'exploris-store',
    storage: createJSONStorage(() => capacitorStorage),
    version: 1,
    partialize: (state) => ({
      profiles: state.profiles,        // Perfiles de usuario
      activeProfileId: state.activeProfileId,
      settings: state.settings,        // Tema, idioma, últimas vistas
    }),
  }
)
```

**Claves persistidas**:
- `profiles`: array de perfiles con progreso (intentos, sellos, etc.)
- `activeProfileId`: perfil activo
- `settings`: tema, idioma, ubicación última, etc.

**Tamaño estimado**: pocos KB (progreso del jugador, sin datos geográficos)

---

## 3. Capacitor Filesystem: disponibilidad

❌ **NO instalado**: `@capacitor/filesystem` no aparece en `package.json`

**Necesario para**: guardar datos descargados en el sistema de archivos nativo (importante para CDN updates)

**Recomendación**: hay que instalar si se quiere persistencia de datos descargados:
```bash
npm install @capacitor/filesystem
```

---

## 4. App lifecycle: implementación actual

### Instalación
✅ **Instalado**: `@capacitor/app@^8.0.1` (en `package.json`)

### Uso actual
**Archivo**: `src/components/Globe/GlobeD3.tsx`, línea 1613

```typescript
const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
  // Código para pausar/reanudar globo
});
```

**Evento**: `appStateChange` — cuando la app entra en foreground/background

**No hay**:
- Listeners explícitos para `appInit`, `appResume`, `appPause`, etc.
- Inicialización en App.tsx de este ciclo

**Potencial**: Se puede aprovechar para lanzar la verificación de CDN:
- Al `appStateChange` (isActive: true) → verificar si hay actualizaciones pendientes
- O en `App.tsx` mount inicial

---

## 5. Conectividad: ausencia actual

❌ **NO instalado**: `@capacitor/network` no está en `package.json`

**Recomendación**: hay que instalarlo para detectar:
- Red disponible (WiFi vs. móvil)
- Banda ancha disponible
- Decidir si descargar datos pesados (islas, borders TopoJSON)

```bash
npm install @capacitor/network
```

---

## 6. Entry point de la app (App.tsx)

**Estructura**:
1. **Líneas 40-100**: estado local (tabs, modales, globo, datos)
2. **Líneas 205-229**: precarga de datos en paralelo con renderizado del globo
   - `loadCountryData(locale)` → `loadCapitals()` → rankings + levels
   - **Patrón**: cadena secuencial (no paralela)
   - **Oportunidad**: aquí es donde se podría hacer una verificación inicial de CDN

3. **Líneas 259-412**: renderizado
   - `LoadingScreen` visible mientras `!globeReady`
   - GlobeD3, tabs, vistas (Explorar, Jugar, Pasaporte)

**No hay splash screen dedicado** — el `LoadingScreen` es mínimo.

**Patrón de inicialización**:
```typescript
// App → LoadingScreen → GlobeD3.onReady() → setGlobeReady(true)
// Datos paralelos: loadCountryData() → setCountries()
```

---

## 7. Datos base vs i18n: cuáles actualizar vía CDN

### `countries-base.json` (~75 KB)
- **Contenido**: población, área, HDI, divisa, códigos ISO, banderas SVG
- **Frecuencia de cambios**: baja-media (población anual, HDI cada 2 años)
- **Decisión**: ✅ **SÍ actualizar vía CDN** (datos potencialmente viejos)

### `i18n/{lang}.json` (34 idiomas, ~1-3 KB cada uno)
- **Contenido**: nombres, capitales, gentilicios, idiomas, slugs Wikipedia
- **Frecuencia de cambios**: baja (nuevos países/cambios políticos raros)
- **Decisión**: ✅ **POSIBLEMENTE actualizar** (menos crítico que base)

### `capitals.json` (~14 KB)
- **Contenido**: coordenadas lat/lng de capitales
- **Frecuencia de cambios**: muy baja (movimiento de capitales raro)
- **Decisión**: ✅ **POSIBLEMENTE actualizar** (pero menos prioridad)

### TopoJSON de fronteras/islas (~936 KB total)
- **Contenido**: geometrías para renderizar el globo
- **Frecuencia de cambios**: muy baja (fronteras no cambian a menudo)
- **Decisión**: ⚠️ **OPCIONAL / NO PRIORITARIO** (muy grande, no cambia)

### Síntesis
**Prioritarios para CDN update**:
1. `countries-base.json` (datos cuantitativos, dinámicos)
2. `i18n/{lang}.json` (nombres, datos translatados)
3. `capitals.json` (coordenadas)

**No prioritarios** (TopoJSON es estático):
- `countries-50m.json`
- `islands-10m.json`

---

## 8. Patrón recomendado para CDN updates

### Arquitectura alta
```
App.tsx (mount)
  ↓
CDN Check Service (nuevo)
  ├─ ¿Conectado? → ¿Hay versión más reciente?
  │   ├─ Sí → Descargar en background
  │   │   ├─ countries-base.json
  │   │   ├─ i18n/{lang}.json
  │   │   └─ capitals.json
  │   └─ Guardar en Filesystem (o Preferences si es pequeño)
  │
  └─ Cargar datos de Filesystem/Preferences (fallback a public/)
```

### Componentes necesarios
1. **Capacitor Filesystem** (instalación requerida)
2. **Capacitor Network** (instalación requerida)
3. **Service de verificación de versiones** (nuevo módulo)
4. **Service de descarga + persistencia** (nuevo módulo)
5. **Modificación de `loadCountryData()`** para soportar sources alternativos

---

## 9. Consideraciones técnicas clave

| Aspecto | Status | Nota |
|--------|--------|------|
| **Preferences instalado** | ✅ | Ya usado para perfiles/settings |
| **Filesystem instalado** | ❌ | Necesario para guardar datos grandes |
| **Network disponible** | ❌ | Necesario para detectar conectividad |
| **App lifecycle hooks** | ✅ | Parcial; solo appStateChange en GlobeD3 |
| **Loading screen** | ✅ | Existe; puede ampliarse |
| **Entry point claro** | ✅ | App.tsx es el lugar perfecto |
| **Caché en memoria** | ✅ | Invalidación funcional con `invalidateCache()` |
| **Fallback offline** | ⚠️ | Necesario para datos públicos (public/) si falla CDN |

---

## 10. Resumen de hallazgos

### Flujo actual
1. App monta → LoadingScreen visible
2. `loadCountryData(locale)` carga base + i18n vía fetch
3. `loadCapitals()` carga capitales
4. Datos se cachean en memoria
5. Zustand persiste progreso del jugador (no datos geográficos)

### Disponibilidad de APIs
- ✅ Preferences (storage key-value)
- ❌ Filesystem (necesario)
- ❌ Network (necesario)
- ✅ App lifecycle (parcial)

### Oportunidades de integración
1. **Punto de inicialización**: App.tsx mount (antes o paralelo a loadCountryData)
2. **Storage**: Filesystem para datos medianos; Preferences para metadatos (versión CDN)
3. **Trigger de actualización**: app resume (`appStateChange`) o periódico (timer)
4. **Fallback**: siempre servir desde `public/` si CDN falla

### Datos a actualizar
- **Prioritarios**: countries-base.json, i18n/{lang}.json, capitals.json
- **No prioritarios**: TopoJSON (muy grande, raramente cambia)

---

## Próximos pasos recomendados (fuera de este spike)

1. **Instalación**: `npm install @capacitor/filesystem @capacitor/network`
2. **Diseño de CDN**: elegir almacén (S3, Cloudflare, etc.) y formato de versionamiento
3. **Módulo de verificación**: crear `src/services/cdnDataUpdate.ts`
4. **Modificación de loaders**: adaptar `loadCountryData()` para soportar múltiples sources
5. **Testing**: verificar offline, fallback, y actualizaciones en dispositivo
