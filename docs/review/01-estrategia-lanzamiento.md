# Revisión de backlog: Estrategia de lanzamiento

> Análisis del backlog desde la perspectiva de publicación en App Store (iOS) y Google Play (Android).
> Fecha: 2026-03-24

---

## 1. Clasificación de tareas existentes del backlog

### Testear exhaustivamente
- **Clasificación**: BLOCKER v1.0
- **Justificación**: No se puede publicar sin haber verificado que todos los flujos funcionan correctamente en dispositivo real. Incluye conseguir todos los sellos y jugar todos los continente-nivel en aventura. Cualquier bug crítico descubierto aquí bloquea el lanzamiento.

### Internacionalización (UI completa)
- **[i18n] CLDR + overrides/idioma**: POST-LAUNCH
- **[i18n] LLM como auditoría**: POST-LAUNCH
- **Elegir librería de i18n**: POST-LAUNCH
- **Externalizar textos a archivos de traducción**: NICE-TO-HAVE v1.0 (ver nota)
- **Generar datos multi-idioma**: POST-LAUNCH
- **Símbolos y nombres de moneda vía CLDR**: POST-LAUNCH
- **Traducción a idiomas disponibles en iOS y Android**: POST-LAUNCH
- **Justificación**: La app puede lanzarse en un solo idioma (español) para v1.0. La internacionalización es un esfuerzo grande que no bloquea el lanzamiento inicial. Sin embargo, si se quiere llegar a mercados más amplios desde el día 1, al menos inglés sería deseable (NICE-TO-HAVE). **Nota**: Externalizar textos no es estrictamente necesario para lanzar, pero hacerlo antes facilita enormemente añadir idiomas después sin refactorizar.

### Tema visual
- **Diseñar e implementar tema claro**: POST-LAUNCH
- **Justificación**: El dark mode ya funciona. Un tema claro es una mejora de accesibilidad, no un bloqueador. Apple no lo exige.

### Infraestructura y acabados
- **Validación automática de coordenadas de capitales**: POST-LAUNCH
  - Justificación: Ya se usa CAPITAL_OVERRIDES manual para los 4 casos problemáticos. La automatización es mejora de mantenimiento, no de funcionalidad.
- **Añadir Capacitor para build Android**: BLOCKER v1.0 (si se quiere lanzar en ambas stores)
  - Justificación: Sin esto, no hay APK/AAB para Google Play. Si se decide lanzar solo iOS primero, pasa a POST-LAUNCH.
- **Actualización silenciosa de datos vía CDN**: NICE-TO-HAVE v1.0
  - Justificación: Los datos de países cambian ~1-2 veces/año. Se puede lanzar sin esto y actualizar con nuevas versiones de la app. Pero tenerlo listo da tranquilidad.
- **Sección «Acerca de»**: NICE-TO-HAVE v1.0
  - Justificación: App Store Review puede preguntar por las fuentes de datos. Tener una sección visible que explique criterios (ONU, UNDP, REST Countries) da profesionalidad y transparencia. No es estrictamente obligatorio, pero recomendable.
- **Solicitud de valoración in-app**: NICE-TO-HAVE v1.0
  - Justificación: Las valoraciones son críticas para la visibilidad en las stores. Implementar `SKStoreReviewController` es sencillo (~1 hora) y el retorno es alto. No bloquea, pero lanzar sin esto es desperdiciar las primeras descargas.
- **Triple-verificar actualización automática**: BLOCKER v1.0
  - Justificación: Si la app no se actualiza correctamente vía App Store / Google Play, es un problema grave. Hay que verificar que el mecanismo de actualización estándar de Capacitor funciona (no es actualización OTA de código, sino que el usuario recibe nuevas versiones via la store normalmente).

### Muy muy opcional
- **Forzar reinicio de prueba de sello al salir de la app**: POST-LAUNCH
  - Justificación: Es un edge case menor de UX. No afecta funcionalidad core ni bloquea revisión de las stores.

---

## 2. Tareas que faltan para v1.0

### 2.1 Requisitos de App Store (iOS)

#### BLOCKER

- [ ] **App Store Connect: cuenta de desarrollador**
  - Verificar que la cuenta Apple Developer Program ($99/año) está activa y configurada.
  - Crear el App ID en el portal de desarrollador (si no existe ya).
  - Configurar el Bundle ID (`com.geoexpert.app`) en App Store Connect.

- [ ] **Certificados y provisioning profiles de distribución**
  - Crear un certificado de distribución (no solo de desarrollo).
  - Crear un provisioning profile de distribución (App Store).
  - Actualmente solo se usa Debug (`-configuration Debug` en el script `device`). Para subir a la store se necesita un build Release/Archive firmado con el perfil de distribución.

- [ ] **Build de producción iOS (Archive)**
  - Configurar el scheme de Xcode para Release (en vez de Debug).
  - Crear un script o documentar el proceso de `xcodebuild archive` + `xcodebuild -exportArchive`.
  - Alternativa: usar Xcode > Product > Archive manualmente.

- [ ] **Versionado de la app**
  - `package.json` tiene `"version": "0.1.0"`. Para el lanzamiento debe ser `1.0.0`.
  - Verificar que `MARKETING_VERSION` y `CURRENT_PROJECT_VERSION` en el proyecto Xcode están correctos (1.0.0 y 1 respectivamente).

- [ ] **Privacy Policy (URL pública)**
  - Obligatoria para TODAS las apps en App Store desde 2018.
  - Debe estar alojada en una URL pública accesible (no dentro de la app).
  - Contenido mínimo: qué datos se recopilan (en este caso, ninguno aparentemente — la app es offline y sin analytics), cómo se almacenan, contacto del desarrollador.
  - Aunque la app no recopile datos, la política es obligatoria y debe declarar explícitamente que no se recopilan datos.

- [ ] **Metadata de App Store Connect**
  - Nombre de la app (30 chars máx.)
  - Subtítulo (30 chars máx.)
  - Descripción (4000 chars máx.)
  - Palabras clave (100 chars, separadas por coma)
  - URL de soporte (obligatoria)
  - URL de la privacy policy (obligatoria)
  - Categoría: Educación (principal) + Juegos > Trivia (secundaria, opcional)
  - Clasificación por edad (age rating): requiere cuestionario en App Store Connect
  - Copyright

- [ ] **Screenshots para App Store**
  - Obligatorios para cada tamaño de dispositivo soportado:
    - iPhone 6.9" (iPhone 16 Pro Max) — OBLIGATORIO
    - iPhone 6.7" (iPhone 15 Plus / 14 Pro Max) — OBLIGATORIO
    - iPhone 6.5" (iPhone 11 Pro Max) — OBLIGATORIO si se soporta
    - iPhone 5.5" (iPhone 8 Plus) — solo si se soporta
    - iPad 13" / 12.9" — solo si se soporta iPad
  - Mínimo 3 screenshots por tamaño, máximo 10.
  - Recomendación: 5-6 screenshots mostrando globo, juego, pasaporte, explorar, estadísticas.
  - Formato: PNG o JPEG, sin alpha.

- [ ] **Icono de la app (App Store)**
  - Ya existe `AppIcon-512@2x.png` (1024x1024). Verificar que cumple requisitos: sin alpha, sin esquinas redondeadas (iOS las aplica), sin capas de transparencia.

- [ ] **Clasificación por edad (age rating)**
  - Rellenar el cuestionario de Content Description en App Store Connect.
  - La app no tiene violencia, compras in-app, contenido para adultos, etc. Debería clasificar como 4+ (compatible con el público objetivo de 8-15 años).

#### NICE-TO-HAVE v1.0

- [ ] **App Preview (vídeo)**
  - Vídeo de 15-30 segundos mostrando el gameplay. Opcional pero aumenta conversión significativamente.

- [ ] **Texto promocional**
  - 170 chars, editable sin nueva versión. Útil para campañas.

- [ ] **Localización de la ficha en App Store**
  - Si la app es solo en español, la ficha puede ser solo en español. Pero si se quiere visibilidad global, al menos inglés.

### 2.2 Requisitos de Google Play (Android)

#### BLOCKER (si se lanza en Android)

- [ ] **Google Play Console: cuenta de desarrollador**
  - Registro ($25, pago único). Verificación de identidad obligatoria (desde 2023).

- [ ] **Añadir plataforma Android con Capacitor**
  - `npx cap add android` + configuración del proyecto.
  - Ya está en el backlog pero merece detallarse: verificar que todo el flujo funciona (build, deploy, testing en emulador/dispositivo).

- [ ] **Build de producción Android (AAB)**
  - Google Play requiere Android App Bundle (.aab), no APK.
  - Configurar signing key (keystore) para release builds.
  - IMPORTANTE: Guardar el keystore en lugar seguro — perderlo significa no poder actualizar la app nunca más.

- [ ] **Icono adaptativo Android**
  - Android usa «adaptive icons» (foreground + background layers, 108×108dp).
  - El icono iOS (1024×1024 estático) NO sirve directamente — hay que crear las capas.
  - Se necesitan versiones para distintas densidades (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi).

- [ ] **Versionado Android**
  - `versionCode` (entero incremental) y `versionName` ("1.0.0") en `build.gradle`.

- [ ] **Target SDK**
  - Google Play exige targetSdkVersion ≥ 34 (Android 14) desde agosto 2024 para nuevas apps.
  - Capacitor 8 debería cumplir, pero hay que verificar.

- [ ] **Privacy Policy (URL pública)**
  - Misma que iOS. Google Play la exige también.

- [ ] **Metadata de Google Play Console**
  - Título (50 chars), descripción corta (80 chars), descripción completa (4000 chars).
  - Categoría: Educación.
  - Clasificación de contenido: cuestionario IARC.
  - Declaración de permisos y datos (Data Safety form) — obligatoria desde 2022.
  - Contacto del desarrollador (email obligatorio, website y teléfono opcionales).

- [ ] **Screenshots para Google Play**
  - Mínimo 2, máximo 8 por tipo de dispositivo.
  - Teléfono: resolución mínima 320px lado corto, máximo 3840px lado largo.
  - Tablet 7" y 10": recomendados si se soporta.

- [ ] **Feature Graphic (imagen destacada)**
  - 1024×500px. OBLIGATORIO en Google Play. Se muestra en la parte superior de la ficha.

- [ ] **Testing en dispositivo Android real**
  - No basta con emulador. Probar en al menos 2-3 dispositivos con distintas resoluciones y versiones de Android.

#### NICE-TO-HAVE v1.0

- [ ] **Vídeo promocional (YouTube)**
  - Google Play permite enlazar un vídeo de YouTube. Opcional pero recomendable.

- [ ] **Testing cerrado / abierto**
  - Google Play exige un periodo de testing cerrado con ≥20 testers durante ≥14 días consecutivos ANTES de poder publicar en producción (requisito desde noviembre 2023 para cuentas de desarrollador personal).

### 2.3 Requisitos legales (ambas plataformas)

#### BLOCKER

- [ ] **Privacy Policy**
  - URL pública, accesible desde fuera de la app.
  - Debe cubrir: qué datos se recopilan, cómo se usan, cómo se almacenan, derechos del usuario, contacto.
  - Aunque la app sea 100% offline sin analytics, la política debe existir y declarar explícitamente que no se recopilan datos personales.
  - Considerar GDPR (si se distribuye en Europa) y COPPA (si el público objetivo incluye menores de 13 años — relevante dado que el target es 8-15 años).

- [ ] **Cumplimiento COPPA / normativa de menores**
  - El público objetivo de 8-15 años activa regulaciones de protección de menores.
  - **iOS**: Declarar en App Store Connect si la app está dirigida a menores. Si sí: no se permite tracking, no se permiten anuncios personalizados, restricciones adicionales.
  - **Android**: Si la app está «Designed for Families» en Google Play, debe cumplir requisitos adicionales del programa Familias.
  - Dado que la app no tiene anuncios, tracking ni compras, el cumplimiento debería ser sencillo, pero hay que hacer las declaraciones correctas.

#### NICE-TO-HAVE v1.0

- [ ] **Términos de servicio (Terms of Service)**
  - No estrictamente obligatorios para las stores, pero recomendables. Cubren limitación de responsabilidad, licencia de uso, etc.

### 2.4 Requisitos técnicos comunes

#### BLOCKER

- [ ] **Bloqueo de orientación a portrait**
  - `Info.plist` permite landscape (`UIInterfaceOrientationLandscapeLeft`, `UIInterfaceOrientationLandscapeRight`). Si la app no soporta landscape (UI diseñada solo para portrait), estas orientaciones deben eliminarse o la app debe funcionar correctamente en landscape. De lo contrario, el reviewer de Apple puede rechazar.

- [ ] **Splash screen / Launch screen**
  - iOS: Ya existe (`LaunchScreen.storyboard` + `Splash.imageset`). Verificar que se ve correctamente en todos los tamaños de dispositivo.
  - Android: Configurar splash screen con el tema/icono de la app (Android 12+ usa `SplashScreen API`).

- [ ] **Testing en múltiples tamaños de pantalla iOS**
  - Probar en iPhone SE (pantalla pequeña), iPhone estándar, iPhone Pro Max.
  - Verificar que el layout responsivo funciona correctamente (el globo, los bottom sheets, los selectores, la barra de progreso).
  - Si se soporta iPad, probar también en iPad.

- [ ] **Manejo del status bar y safe areas**
  - Verificar que la app respeta las safe areas en dispositivos con notch/Dynamic Island.
  - Verificar que el contenido no queda oculto detrás del status bar o del home indicator.

- [ ] **Manejo de interrupciones**
  - Verificar comportamiento correcto al recibir llamada, notificación, o al bloquear/desbloquear el dispositivo.
  - La app ya tiene pausa de RAF en background (`@capacitor/app`), pero verificar que la sesión de juego se preserva.

#### NICE-TO-HAVE v1.0

- [ ] **Crash reporting**
  - Sin crash reporting, los bugs en producción serán invisibles. Opciones: Sentry, Firebase Crashlytics, Bugsnag.
  - Recomendación fuerte para v1.0 — un crash no reportado puede hundir las valoraciones.

- [ ] **Analytics básicos**
  - Saber cuántos usuarios tiene la app, qué pantallas visitan, en qué continente/nivel juegan más.
  - Opciones: Firebase Analytics (gratuito), Posthog, Mixpanel.
  - Importante para tomar decisiones post-launch (qué mejorar, qué funciona).
  - NOTA: Si se añaden analytics, actualizar la Privacy Policy y las declaraciones en las stores.

- [ ] **Rendimiento en dispositivos antiguos**
  - Canvas 2D con DPR=2 y RAF optimizado debería funcionar bien, pero conviene probar en un iPhone 8 o SE (2ª gen) y en un Android de gama media-baja.

### 2.5 Requisitos de monetización (si aplica)

La app actualmente no tiene modelo de monetización visible (sin compras in-app, sin anuncios, sin suscripciones). Esto simplifica el lanzamiento, pero:

- [ ] **Definir modelo de negocio** (POST-LAUNCH, pero conviene tener la estrategia clara)
  - App gratuita: sin ingresos, máxima adopción.
  - App de pago: barrera de entrada, pero ingresos directos.
  - Freemium: base gratis + contenido premium (más continentes, más niveles, etc.).
  - Sin urgencia para v1.0, pero afecta a la ficha de la store (precio, compras in-app, etc.).

---

## 3. Priorización recomendada

### Fase 1: Completar testing y bugs (semana actual)
1. Terminar el testing exhaustivo (todos los sellos, todos los continente-nivel)
2. Corregir bugs encontrados durante el testing
3. Verificar bloqueo de orientación (¿la app funciona en landscape o solo portrait?)

### Fase 2: Preparación iOS — requisitos obligatorios (1-2 semanas)
1. Privacy Policy (redactar y alojar en URL pública)
2. Cuenta Apple Developer Program (verificar que está activa)
3. Certificados y provisioning profiles de distribución
4. Versionado: subir a 1.0.0
5. Build de producción (Archive) — probar el flujo completo
6. Verificar icono de la app (sin alpha, formato correcto)
7. Verificar splash screen en todos los tamaños
8. Testing en múltiples tamaños de iPhone (SE, estándar, Pro Max)
9. Manejo de safe areas y interrupciones
10. Clasificación por edad (cuestionario)
11. Cumplimiento COPPA (declaraciones correctas por público 8-15 años)

### Fase 3: Metadata y screenshots iOS (3-5 días)
1. Screenshots para todos los tamaños obligatorios
2. Nombre, subtítulo, descripción, palabras clave
3. Categoría, URL de soporte, copyright
4. Sección «Acerca de» en la app (recomendado antes del review)
5. Solicitud de valoración in-app (SKStoreReviewController)

### Fase 4: Envío a App Store Review
1. Subir build a App Store Connect via Xcode/Transporter
2. Rellenar toda la metadata
3. Enviar a revisión (tiempo medio: 24-48h, puede ser hasta 7 días la primera vez)
4. Resolver posibles rechazos

### Fase 5: Android (en paralelo o después de iOS)
1. Cuenta Google Play Console + verificación de identidad
2. `npx cap add android` + configuración del proyecto
3. Testing en emulador y dispositivo real
4. Icono adaptativo
5. Build de producción (AAB) + signing key
6. Screenshots + Feature Graphic
7. Metadata de Google Play
8. Data Safety form
9. Testing cerrado (≥20 testers, ≥14 días) — este es el paso más largo
10. Envío a revisión

### Fase 6: Post-launch
1. Internacionalización (inglés como segundo idioma prioritario)
2. Crash reporting + analytics
3. Actualización silenciosa de datos vía CDN
4. Tema claro
5. Validación automática de coordenadas
6. Resto del backlog

---

## 4. Observaciones sobre DESIGN.md

### Correcciones necesarias

1. **Animación stampDrop**: DESIGN.md dice «10 vueltas en 3s» (línea ~407), pero el último commit del backlog dice que se redujo a 5 vueltas. DESIGN.md no refleja este cambio.

### Elementos que faltan

2. **Versión mínima de iOS soportada**: No se documenta cuál es el deployment target de iOS. Esto es relevante para la ficha de App Store y para decidir qué APIs se pueden usar. Capacitor 8 requiere iOS 14+, pero convendría documentar la decisión explícita.

3. **Versión mínima de Android**: Cuando se añada Android, documentar minSdkVersion y targetSdkVersion.

4. **Modelo de datos de persistencia**: DESIGN.md menciona Capacitor Preferences para persistencia pero no detalla el esquema de datos (claves, formato). No es crítico para el lanzamiento, pero sí para mantenimiento.

5. **Comportamiento offline explícito**: Aunque se menciona que la app funciona offline, no se documenta explícitamente qué ocurre cuando no hay conexión (para el CDN de actualización de datos, para el icono de Wikipedia, etc.).

### Elementos que sobran o están desactualizados

6. **No se han detectado elementos que sobren**. El documento es coherente con el estado actual del backlog. La estructura MECE se mantiene.

---

## 5. Resumen ejecutivo

### Para lanzar solo en iOS
- **Bloqueadores**: Testing exhaustivo, privacy policy, certificados de distribución, build Release, metadata + screenshots, versionado 1.0.0, verificar orientaciones y safe areas, cumplimiento COPPA.
- **Estimación de trabajo nuevo** (excluyendo testing): ~1-2 semanas de trabajo.
- **Riesgo principal**: Primer envío a App Store Review — el reviewer puede encontrar issues no anticipados.

### Para lanzar también en Android
- **Bloqueador adicional más largo**: Testing cerrado de 14 días con 20 testers en Google Play. Esto solo debe empezarse cuando la app esté estable.
- **Recomendación**: Lanzar iOS primero, en paralelo preparar Android. Android llega ~3-4 semanas después de iOS.

### Lo que NO bloquea v1.0
- Internacionalización (se puede lanzar solo en español)
- Tema claro
- Actualización vía CDN
- Analytics / crash reporting (muy recomendado pero no obligatorio)
- Validación automática de coordenadas
