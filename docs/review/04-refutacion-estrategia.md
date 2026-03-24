# Refutacion: Estrategia de lanzamiento

> Refutacion constructiva del analisis en `01-estrategia-lanzamiento.md`.
> Fecha: 2026-03-24

---

## Acuerdos

Puntos donde el estratega acierta y no hay nada que discutir:

1. **Testing exhaustivo como bloqueador**: Correcto. No se puede lanzar sin validar todos los flujos en dispositivo real. Este es el bloqueador mas importante y esta bien priorizado en Fase 1.

2. **Internacionalizacion como POST-LAUNCH**: Correcto. Lanzar en un solo idioma (espanol) es perfectamente viable para v1.0. La i18n es un esfuerzo enorme (pipeline CLDR, archivos de traduccion, validacion por idioma) que retrasaria el lanzamiento meses sin aportar valor inmediato al mercado hispanohablante.

3. **Tema claro como POST-LAUNCH**: Correcto. Apple no lo exige, el dark mode es la identidad visual del producto, y no hay evidencia de que sea motivo de rechazo en review.

4. **Privacy Policy como bloqueador**: Correcto. Es obligatoria desde 2018. Al no recopilar datos, la redaccion es trivial (1-2 horas), pero la URL publica debe existir antes del envio.

5. **Certificados y provisioning profiles**: Correcto. Es el paso tecnico mas mecanico pero imprescindible. El proyecto actualmente solo tiene configuracion Debug.

6. **Validacion automatica de capitales como POST-LAUNCH**: Correcto. Los 4 overrides manuales funcionan. Automatizar es mejora de mantenimiento, no de producto.

7. **La clasificacion correcta de tareas del backlog existente** es en general acertada. El estratega hizo un buen trabajo mapeando cada tarea a su urgencia real.

---

## Desacuerdos y matices

### 1. Sobreestimacion: "Triple-verificar actualizacion automatica" como BLOCKER

**Argumento del estratega**: Si la app no se actualiza correctamente via App Store, es un problema grave. Hay que verificar el mecanismo de actualizacion.

**Contraargumento**: Esto no es un bloqueador real. Las actualizaciones via App Store / Google Play son un mecanismo estandar del sistema operativo que funciona para las ~3 millones de apps existentes. Capacitor empaqueta un WebView con assets estaticos — no hay nada especial que pueda romper el ciclo de actualizacion. No existe un "mecanismo de actualizacion de Capacitor" — la actualizacion la gestiona iOS/Android como cualquier otra app nativa.

Lo que si merece verificacion (y es trivial) es que al subir una nueva version, el `MARKETING_VERSION` y `CURRENT_PROJECT_VERSION` incrementen correctamente. Pero esto es parte del flujo normal de release, no un bloqueador independiente.

**Veredicto**: Rebajarlo a una nota dentro de "Build de produccion", no a una tarea separada.

### 2. Sobreestimacion de complejidad: Fase 2 estimada en "1-2 semanas"

**Argumento del estratega**: La preparacion iOS (requisitos obligatorios) requiere 1-2 semanas.

**Contraargumento**: Para un desarrollador indie que ya tiene la app funcional en dispositivo, la mayoria de tareas de la Fase 2 son administrativas, no tecnicas:

- Privacy Policy: 1-2 horas (la app no recopila datos — es una pagina minimalista).
- Cuenta Apple Developer: ya deberia estar activa (se usa para firmar builds Debug en dispositivo).
- Certificados de distribucion: 30 minutos en el portal de Apple.
- Versionado 1.0.0: 5 minutos (cambiar `package.json` + verificar Xcode).
- Build Archive: 1-2 horas la primera vez (configurar scheme Release, probar el flujo).
- Icono: ya existe `AppIcon-512@2x.png`. Verificar formato: 10 minutos.
- Splash screen: ya existe `LaunchScreen.storyboard`. Verificar: 15 minutos.
- Safe areas: la app ya funciona en dispositivo con notch (se testea en iPhone real). Verificacion rapida.
- Clasificacion por edad: cuestionario de 5 minutos (sin violencia, sin compras, sin tracking).
- COPPA: la app no recopila datos ni tiene tracking. Declaracion simple.

**Estimacion mas realista**: 2-3 dias de trabajo concentrado, no 1-2 semanas. El estratega no distingue entre "tareas de hacer" y "tareas de esperar/investigar" — la mayoria son acciones de 15-60 minutos que se ejecutan en serie.

### 3. Sobreestimacion: Screenshots como proceso complejo

**Argumento del estratega**: Screenshots obligatorios para cada tamano de dispositivo, minimo 3, maximo 10, multiples resoluciones.

**Contraargumento**: Apple permite usar **una sola coleccion de screenshots** para todos los tamanos de iPhone si se sube la resolucion mas grande (6.9"). Desde 2023, App Store Connect acepta la opcion "Use 6.7-inch Display screenshots for all iPhone sizes". En la practica, para un desarrollador indie, esto significa tomar 3-5 capturas en un simulador de iPhone 16 Pro Max y usar esas para todo. No hay que generar screenshots separados por dispositivo.

**Estimacion real**: 1-2 horas incluyendo composicion con marcos de dispositivo (si se quiere calidad premium) o 30 minutos para capturas directas.

### 4. Subestimacion: Bloqueo de orientacion como tema trivial

**Argumento del estratega**: Lo lista como BLOCKER pero con un tono de "verificar y quitar orientaciones de Info.plist".

**Contraargumento**: Tiene razon en que es bloqueador, pero subestima el trabajo. Actualmente `Info.plist` permite landscape en iPhone Y iPad (incluido `UpsideDown` en iPad). Si la app no funciona en landscape (que casi seguro no funciona — toda la UI esta disenada para portrait con el globo, bottom sheets, etc.), hay que:

1. Eliminar las orientaciones landscape de `Info.plist`.
2. Decidir si se soporta iPad. Si `Info.plist` incluye iPad orientations, Apple podria exigir que la app funcione en iPad. Si NO se quiere soportar iPad, hay que marcarlo explicitamente en App Store Connect o ajustar el proyecto Xcode.

El riesgo real aqui es que Apple rechace la app porque permite landscape en `Info.plist` pero la UI se rompe al rotar. Esto deberia tener prioridad alta dentro de la Fase 1 (junto al testing), no estar enterrado en el listado.

### 5. iOS primero vs. simultaneo: el estratega acierta pero por las razones equivocadas

**Argumento del estratega**: Lanzar iOS primero, Android 3-4 semanas despues. Razon: el testing cerrado de Google Play (14 dias, 20 testers) es el paso mas largo.

**Contraargumento parcial**: La recomendacion de iOS primero es correcta, pero las razones principales son otras:

1. **La app se ha desarrollado y testeado exclusivamente en iOS**. No hay ni una sola linea de codigo Android, ni un test en dispositivo Android, ni configuracion de Capacitor para Android. El salto no es "anadir plataforma", es un proceso de validacion completo: gestos tactiles, rendimiento Canvas en Android WebView (Chrome), safe areas de Android, status bar, navegacion por gestos vs. botones, etc.

2. **El mercado hispanohablante mobile es ~55% Android, ~45% iOS** (datos globales de StatCounter para Latinoamerica). Lanzar solo en iOS significa perder a mas de la mitad del mercado objetivo. Pero es la decision correcta porque:
   - La calidad en una plataforma > calidad mediocre en dos.
   - Validar el producto con usuarios reales en iOS da feedback para mejorar antes de Android.
   - Los problemas especificos de Android WebView (rendimiento, fuentes, gestos) podrian requerir ajustes significativos.

3. **El testing cerrado de Google Play (14 dias, 20 testers)** es un requisito para cuentas personales nuevas. Si la cuenta de Google Play ya existiera con apps publicadas, esto no aplica. El estratega deberia haber preguntado si el desarrollador ya tiene cuenta con historial.

### 6. Clasificacion debatible: "Seccion Acerca de" como NICE-TO-HAVE

**Argumento del estratega**: Recomendable pero no obligatoria. App Store Review puede preguntar por fuentes de datos.

**Contraargumento**: Para una app de geografia que muestra datos de 195 paises (poblacion, superficie, IDH, capitales, monedas, idiomas), las fuentes son parte de la credibilidad del producto. Pero mas importante: **Apple Review rara vez pregunta por fuentes de datos**. Lo que si preguntan es:

- Que la app no sea una copia (no aplica).
- Que la app tenga valor suficiente (195 paises, 6 tipos de juego, pasaporte — sobra valor).
- Que funcione correctamente (testing).

La seccion "Acerca de" es genuinamente nice-to-have y no deberia priorizarse sobre, por ejemplo, la solicitud de valoracion in-app, que tiene un retorno inmediato y medible en visibilidad.

### 7. Sobrevalorado: "Actualización silenciosa de datos via CDN" como NICE-TO-HAVE v1.0

**Argumento del estratega**: Tenerlo listo da tranquilidad. Los datos cambian 1-2 veces/ano.

**Contraargumento**: Si los datos cambian 1-2 veces al ano, una actualizacion de la app via App Store es perfectamente suficiente. Implementar un CDN con versionado, descarga en background, merge de datos locales y manejo de errores de red es un esfuerzo de ingenieria desproporcionado para el problema que resuelve. Ni siquiera deberia ser NICE-TO-HAVE v1.0 — deberia ser POST-LAUNCH y solo si hay evidencia de que las actualizaciones de app no son suficientes.

**Riesgo adicional**: Un sistema de actualizacion silenciosa introduce un vector de problemas nuevos (datos corruptos, versiones incompatibles, fallos de red silenciosos) que una app v1.0 no necesita.

---

## Puntos ciegos del analisis

### 1. No menciona la App Store Review Guidelines 4.2 (Minimum Functionality)

Apple rechaza apps que considera "demasiado simples" o que son envoltorios web sin valor nativo. Una app Capacitor (WebView) tiene mayor escrutinio que una app nativa pura. El estratega deberia haber mencionado:

- Que la app debe sentirse nativa (transiciones, rendimiento, interaccion con gestos del sistema).
- Que el Canvas 2D con animaciones fluidas y Capacitor Haptics ayuda a pasar este filtro.
- Que conviene evitar que el reviewer perciba la app como "una pagina web en un WebView".

Este riesgo es bajo para GeoExpert (el globo interactivo, los sellos, la vibracion haptica le dan suficiente caracter nativo), pero deberia haberse evaluado.

### 2. No evalua el impacto de lanzar solo en espanol

El estratega dice "se puede lanzar en un solo idioma (espanol)" como si fuera neutral. Pero tiene implicaciones:

- **App Store es global por defecto**. Un usuario en Alemania que busque "geography quiz" encontrara la app pero no podra usarla. Esto genera reviews negativas de 1 estrella ("app is not in English") que hundirian el rating inicial.
- **Solucion**: Limitar la disponibilidad geografica en App Store Connect a paises hispanohablantes (~20 paises). Esto no esta mencionado en el analisis.
- **Alternativa**: Lanzar con los textos en espanol pero con la ficha de la store solo en espanol, y limitar territorio. Esto es una decision de go-to-market que el estratega ignoro completamente.

### 3. No considera que la app esta dirigida a menores (8-15 anos) y sus implicaciones en COPPA / App Tracking Transparency

El estratega menciona COPPA y menores de pasada, pero no profundiza:

- Si la app se marca como "directed to children" en App Store Connect, entra en la categoria **Kids** con restricciones adicionales (no se pueden recopilar IDFA, no se permiten enlaces web externos sin parental gate, etc.).
- La app tiene un **enlace a Wikipedia** en la ficha de cada pais. Si la app se categoriza como Kids, Apple podria exigir un parental gate (confirmacion de adulto) antes de abrir un enlace externo.
- La estrategia deberia ser: **no marcar la app como "directed to children"** en App Store Connect, sino como "general audience" con rating 4+. Esto evita las restricciones de Kids Category mientras permite que ninos la usen. La app no recopila datos, no tiene anuncios ni tracking, asi que COPPA no es un problema practico — pero la declaracion incorrecta si lo seria.

### 4. No menciona el tamano del bundle

La app empaqueta TopoJSON (50m + override 10m), datos de paises, capitales, etiquetas de mares, banderas, y el runtime de React + D3 + Capacitor. El tamano total del bundle afecta:

- **Tiempo de descarga** en App Store (Apple muestra "XXX MB" en la ficha).
- **Limite de descarga por datos moviles** (Apple bloquea descargas >200 MB sin WiFi).
- **Primera impresion**: una app de geografia que pesa 150 MB genera desconfianza; una de 15 MB no.

El estratega deberia haber recomendado medir el tamano del IPA final y verificar que es razonable (idealmente <50 MB).

### 5. No evalua la necesidad de un sitio web minimo

Para App Store Connect se necesitan dos URLs obligatorias:

- **Privacy Policy URL**: mencionada.
- **Support URL**: mencionada como campo de metadata, pero sin profundizar.

Ambas necesitan un lugar donde vivir. Las opciones son:

- GitHub Pages (gratis, rapido).
- Una landing page minima del producto (mejora percepcion profesional).
- Una pagina de Notion publica (rapido pero poco profesional).

El estratega deberia haber recomendado **crear una landing page minima** que sirva como privacy policy + soporte + presentacion del producto. Esto tambien es util para el enlace "Website" de App Store Connect y para marketing basico.

### 6. No menciona TestFlight

Antes de enviar a App Store Review, es muy recomendable distribuir la app via TestFlight a 5-10 beta testers (amigos, familia). TestFlight permite:

- Validar que el build de produccion funciona (no solo el Debug).
- Obtener feedback de usuarios reales que no son el desarrollador.
- Detectar crashes en dispositivos que no se tienen (iPhone SE, iPad, iOS 15).
- Generar confianza antes del envio oficial.

El estratega salto directamente de "Build Archive" a "Enviar a revision", ignorando este paso intermedio que reduce significativamente el riesgo de rechazo.

---

## Veredicto

El analisis del estratega es **solido en la estructura y en la clasificacion de las tareas existentes del backlog**. El mapeo BLOCKER/NICE-TO-HAVE/POST-LAUNCH es en general correcto, y la decision de lanzar iOS primero es acertada.

Sin embargo, hay varios puntos que cambiaria:

1. **Eliminar "Triple-verificar actualizacion"** como tarea independiente — es parte del flujo normal de release.

2. **Reducir la estimacion de Fase 2** de "1-2 semanas" a "2-3 dias" — la mayoria son tareas administrativas de minutos.

3. **Anadir una Fase 1.5: TestFlight** entre testing interno y envio a Review. Es el paso mas importante que falta en el plan.

4. **Anadir decision de disponibilidad geografica** (solo paises hispanohablantes) al ser una app monolingue en espanol.

5. **Priorizar la configuracion de orientacion** dentro de la Fase 1 (no es una verificacion, es un fix necesario — el `Info.plist` actual permite landscape).

6. **No categorizar como app para ninos** en App Store Connect (evita restricciones de Kids Category). Marcar como general audience 4+.

7. **Anadir medicion del tamano del IPA** como paso de verificacion antes del envio.

8. **Crear una landing page minima** que sirva como privacy policy + soporte. GitHub Pages es suficiente.

9. **Mover "Actualizacion via CDN" a POST-LAUNCH firme** — no merece ni NICE-TO-HAVE para v1.0.

La fases deberian quedar:

- **Fase 1**: Testing exhaustivo + fix orientacion portrait-only + fix items "Proximamente" en configuracion (ocultar o remover opciones no funcionales).
- **Fase 1.5**: TestFlight con 5-10 beta testers (1 semana).
- **Fase 2**: Preparacion administrativa iOS (2-3 dias).
- **Fase 3**: Metadata, screenshots, landing page (2-3 dias).
- **Fase 4**: Envio a Review.
- **Fase 5**: Android (evaluarlo despues de validar el producto en iOS).
