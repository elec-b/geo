# Clasificación por edad (Age Rating)

Respuestas preparadas para los cuestionarios de Age Rating de App Store Connect (Apple) y Google Play Console (IARC). Este documento es la **fuente de verdad** al rellenar los formularios en cada consola.

> **Estado**: respuestas decididas y validadas contra el diseño de Exploris. Pendiente de transcribir a las consolas cuando existan los *app records* (bloques `iOS Build & Test` y `Android Setup` del backlog).

---

## Objetivo

| Plataforma | Rating objetivo | Categoría infantil |
|---|---|---|
| App Store (iOS) | **4+** | **No** (no marcar *Made for Kids* ni solicitar *Kids Category*) |
| Google Play (Android) | **Everyone** / **PEGI 3** | **No** (no opt-in a *Designed for Families* ni a la *Families Policy*) |

### Por qué NO categorizamos como «directed to children»

Exploris incluye un icono de Wikipedia en la ficha de país (`src/components/Explore/CountryCard.tsx:129`) que abre el artículo del país **en el navegador externo del sistema** (Safari en iOS, Chrome en Android), y un enlace a la *privacy policy* alojada en GitHub Pages (`src/components/About/AboutSheet.tsx:92`).

Ambos apuntan a contenido web no auditado por nosotros. Las categorías infantiles de ambas tiendas son incompatibles con esto:

- **Apple Kids Category**: prohíbe cualquier enlace fuera de la app sin un *parental gate* previo.
- **Google Families Policy**: exige que todo contenido enlazado esté moderado para niños; Wikipedia no lo cumple.

Cumplir con ellas implicaría retirar el enlace a Wikipedia o añadir un parental gate — ambos empeoran la UX y la misión educativa de la app. La decisión es mantener el enlace y no optar a las categorías infantiles. La app **sigue siendo adecuada y descargable por niños**, simplemente no aparece listada en las secciones *Kids*/*Families* de las tiendas.

---

## Pre-requisito verificado

**Comportamiento del enlace Wikipedia en iOS/Android**: debe abrir el navegador **externo** (Safari/Chrome), saliendo de la app. Si la app abre el enlace en un WebView embebido o SFSafariViewController, tendríamos «navegación web sin restricciones dentro de la app» y el rating Apple saltaría a 17+.

Verificación en dispositivo (iPhone): Explorar → tocar país → pulsar icono Wikipedia → comprobar que Safari pasa a primer plano y Exploris queda en background. Idem para el link de Privacy Policy en About. Verificación equivalente en Android cuando se añada la plataforma.

> El código actual usa `window.open(url, '_blank')`, que en Capacitor por defecto sale al navegador del sistema. No hay plugin `@capacitor/browser` instalado.

---

## Apple — App Store Connect → App Information → Age Rating

Apple tiene su propio cuestionario (no participa en IARC). 14 categorías de contenido + flags adicionales.

| Categoría | Respuesta | Justificación |
|---|---|---|
| Cartoon or Fantasy Violence | **None** | No hay violencia, ni cartoon ni fantasy. |
| Realistic Violence | **None** | No aplica. |
| Prolonged Graphic or Sadistic Realistic Violence | **None** | No aplica. |
| Profanity or Crude Humor | **None** | No aplica. |
| Mature/Suggestive Themes | **None** | No aplica. |
| Horror/Fear Themes | **None** | No aplica. |
| Medical/Treatment Information | **None** | No aplica. |
| Alcohol, Tobacco, or Drug Use or References | **None** | No aplica. |
| Sexual Content or Nudity | **None** | No aplica. |
| Graphic Sexual Content and Nudity | **None** | No aplica. |
| Simulated Gambling | **None** | No aplica. |
| Contests | **None** | No hay concursos ni sorteos. |
| **Unrestricted Web Access** | **No** | El único enlace externo (Wikipedia) abre Safari del sistema, fuera de la app. No hay WebView embebido de navegación libre. |
| Gambling | **No** | No aplica. |

**Flags adicionales**:

- **Made for Kids** (App Store Kids Category): **No marcar**. La app es adecuada para 4+, pero no se solicita listing en Kids Category.
- **Loot Boxes**: No.
- **User-Generated Content**: No. Los perfiles son locales, no hay chat ni red social.

Rating resultante esperado: **4+**.

---

## Google Play — Play Console → Policy → App content → Content rating (IARC)

El cuestionario IARC cubre ~9 bloques. Para Exploris todas las categorías de contenido se responden negativamente.

| Bloque | Pregunta clave | Respuesta |
|---|---|---|
| Category | Tipo de app | **Reference, News, or Educational** |
| Violence | ¿Hay violencia de cualquier tipo? | **No** |
| Sexuality | ¿Hay contenido sexual o desnudez? | **No** |
| Language | ¿Hay lenguaje ofensivo, profanidad, crude humor? | **No** |
| Controlled Substances | ¿Referencias a alcohol, tabaco, drogas? | **No** |
| Gambling | ¿Gambling real o simulado? | **No** |
| Crude Humor | ¿Humor crudo/escatológico? | **No** |
| User Interaction | ¿Usuarios pueden interactuar entre sí (chat, forums, UGC)? | **No** |
| User Interaction | ¿La app comparte la ubicación del usuario con otros? | **No** |
| User Interaction | ¿La app permite compras digitales? | **No** |
| Miscellaneous | ¿La app accede a internet sin restricciones? (*Unrestricted internet access*) | **No** — mismo razonamiento que Apple: los enlaces externos salen al navegador del sistema, no hay navegación libre embebida. |

### Target Audience and Content (sección separada del IARC)

Este formulario es independiente y es el que dispara —o no— la **Families Policy**.

| Campo | Respuesta | Justificación |
|---|---|---|
| **Target age groups** | **13-15, 16-17, 18+** (marcar los tres). **No marcar** «Ages 5 and under», «Ages 6-8» ni «Ages 9-12». | Aunque el público real de Exploris empieza en 8 años, marcar rangos <13 dispara la *Designed for Families* / *Families Policy*, incompatible con el enlace a Wikipedia. La app sigue siendo descargable por niños; solo no se lista en la sección *Families*. |
| **Does your app unintentionally appeal to children?** | **No** | La estética es limpia y premium (temas claro/oscuro), no infantilizada. No usa personajes, mascotas, sonidos cartoon ni lenguaje dirigido a niños pequeños. |
| **Store listing preview** | Aceptar que la app **no** aparecerá en *Designed for Families*. | Decisión consciente. |

### Data Safety (sección aparte, ya prevista en backlog)

- **Data collected**: **None** — ningún dato sale del dispositivo. Toda la persistencia es local (Capacitor Preferences).
- **Data shared**: **None**.
- **Encryption in transit**: sí (HTTPS al CDN de datos).
- **User can request data deletion**: N/A (no hay datos).

Rating resultante esperado: **Everyone** (PEGI 3, ESRB Everyone, USK 0, ClassInd L).

---

## Checklist de subida

Marcar cuando el cuestionario esté **enviado y aprobado** en cada consola. Solo entonces la tarea se mueve a `Completado` en `BACKLOG.md`.

- [ ] Verificación en dispositivo iPhone: Wikipedia y Privacy Policy abren en Safari externo (paso bloqueante previo)
- [ ] Apple — Age Rating enviado en App Store Connect, rating mostrado: 4+
- [ ] Apple — Screenshot del rating guardado como evidencia
- [ ] Google Play — Content Rating (IARC) enviado, certificado recibido
- [ ] Google Play — Target Audience form enviado con 13+, sin Families Policy
- [ ] Google Play — Data Safety form enviado: *No data collected*
- [ ] Google Play — Screenshot del rating guardado como evidencia

---

## Referencias internas

- `src/components/Explore/CountryCard.tsx:129` — enlace Wikipedia (`window.open`)
- `src/components/About/AboutSheet.tsx:92` — enlace privacy policy
- `BACKLOG.md` — tarea en bloque «Preparación compartida (iOS + Android)»
- `DESIGN.md` § *Perfiles de usuario* — confirmación de que no hay red social ni UGC
