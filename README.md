# Pilotaje — Listening B1.2 (Univalle)

Página web estática para pilotear con docentes de la Escuela de Ciencias del Lenguaje los tres ejercicios de *listening* de la prueba de proficiencia B1.2. Los resultados, tiempos y retroalimentación se guardan en una hoja de Google Sheets.

## Qué hace

* Ingreso con correo `@correounivalle.edu.co` + contraseña general.
* Tres ejercicios con sus audios. Cada audio se reproduce **máximo 2 veces**, sin pausa ni adelantar/retroceder (configurable).
* Cronómetro: tiempo total y tiempo por ejercicio.
* Al finalizar: nota (0.0–5.0), valoración, correctas, incorrectas y sin responder, por ejercicio y en total. Opción de ver respuestas y clave.
* Retroalimentación por ejercicio (dificultad percibida, adecuación al nivel B1.2, comentarios) y comentario general.
* Envío a Google Sheets solo al completar la retroalimentación. Si el envío falla, permite reintentar o descargar una copia en JSON.
* Las respuestas se guardan en el navegador: si la persona recarga la página, continúa donde iba.

## Estructura

```
index.html
assets/css/styles.css
assets/js/config.js       ← configuración (URL de Apps Script, contraseña, escala)
assets/js/exam-data.js    ← preguntas y claves de respuesta
assets/js/app.js          ← lógica
audio/listening-1.mp3, listening-2.mp3, listening-3.mp3
apps-script/Code.gs       ← código para pegar en Google Apps Script
tools/generar-hash.html   ← utilidad para cambiar la contraseña
.nojekyll
```

## Paso 1 · Contraseña

Contraseña por defecto: **`PilotoB12-2026`**.

Para cambiarla: abra `tools/generar-hash.html` en el navegador, genere el hash y péguelo en `assets/js/config.js` (`passwordHash`). Escriba la misma contraseña, sin hash, en `apps-script/Code.gs` (`PILOT\_PASSWORD`). Las dos deben coincidir; si no, el servidor rechaza los envíos.

## Paso 2 · Google Sheets + Apps Script

1. Cree una hoja de cálculo nueva en Google Drive (p. ej. *Pilotaje Listening B1.2 – Resultados*).
2. En la hoja: **Extensiones → Apps Script**.
3. Borre el contenido de `Code.gs`, pegue el contenido de `apps-script/Code.gs` y guarde.
4. En el selector de funciones elija **`setup`** y haga clic en **Ejecutar**. Autorice los permisos (puede aparecer "Google no ha verificado esta aplicación": *Configuración avanzada → Ir a … (no seguro)*; es su propio script). Se crean las hojas **Respuestas**, **Items** y **Resumen**.
5. **Implementar → Nueva implementación → tipo: Aplicación web**

   * Ejecutar como: **Yo**
   * Quién tiene acceso: **Cualquier usuario** (*Anyone*)
6. Copie la **URL de la aplicación web** (termina en `/exec`) y péguela en `assets/js/config.js` → `appsScriptUrl`.
7. Prueba rápida: abra esa URL en el navegador; debe mostrar `{"ok":true,"service":"listening-pilot",...}`.

> \*\*Si con la cuenta institucional no aparece la opción "Cualquier usuario"\*\*, el administrador de Google Workspace de la universidad lo tiene restringido. En ese caso cree la hoja y el script con una cuenta Gmail personal y compártala con los colegas del equipo.

> \*\*Si modifica `Code.gs` después\*\*, debe ir a \*Implementar → Gestionar implementaciones → editar (lápiz) → Versión: nueva versión → Implementar\*. Así la URL se mantiene.

### Qué queda en la hoja

* **Respuestas**: una fila por participante. Nombre, correo, número de intento, inicio/fin (hora de Bogotá), tiempo total (activo y de reloj), tiempo y reproducciones por ejercicio, puntaje por ejercicio, correctas/incorrectas/sin responder, nota, valoración, retroalimentación y navegador.
* **Items**: una fila por ítem y participante, con la respuesta dada, la clave y si fue correcta. Sirve para análisis de ítems (filas de distractores de emparejamiento con clave `(distractor)`, no puntúan).
* **Resumen**: número de participantes, tiempo promedio/mediano/mínimo/máximo, tiempo y puntaje promedio por ejercicio, dificultad percibida promedio e **índice de facilidad por ítem**.

## Paso 3 · Publicar en GitHub Pages

1. Cree un repositorio en GitHub (puede ser privado solo con plan de pago; con cuenta gratuita, Pages requiere repositorio **público**).
2. Suba **todo el contenido** de esta carpeta a la raíz del repositorio (*Add file → Upload files*, arrastre las carpetas). Incluya `.nojekyll`.
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. En 1–2 minutos la página queda en `https://SU-USUARIO.github.io/NOMBRE-REPO/`.

## Paso 4 · Prueba antes de enviar a los colegas

1. Ingrese con su correo, complete la prueba y la retroalimentación.
2. Verifique que aparezcan filas en **Respuestas** e **Items** y que **Resumen** calcule.
3. Borre las filas de prueba (no borre la fila de encabezados).
4. Para repetir la prueba en el mismo navegador durante sus ensayos: ponga `allowRetake: true` en `config.js`, o borre los datos del sitio en el navegador.

Prueba local: desde esta carpeta ejecute `python3 -m http.server 8000` y abra `http://localhost:8000`.

## Configuración (`assets/js/config.js`)

|Opción|Por defecto|Qué controla|
|-|-|-|
|`maxPlays`|2|Reproducciones por audio|
|`allowPause`|false|Permitir pausar el audio|
|`showTimer`|true|Mostrar el cronómetro|
|`allowRetake`|false|Repetir la prueba con el mismo correo en el mismo navegador|
|`requireFeedbackComments`|true|Comentario obligatorio por ejercicio|
|`passingGrade`|3.0|Nota mínima aprobatoria (color del resultado)|
|`ratingBands`|Excelente ≥4.5, Sobresaliente ≥4.0, Bueno ≥3.5, Aceptable ≥3.0, Insuficiente <3.0|Valoración cualitativa|

## Calificación

Cada ejercicio vale 10 puntos (total 30) según las pautas de los documentos Word:

* **Listening 1**: selección múltiple 1 pt × 3; emparejamiento 1 pt × 4; completar 0.75 pt × 4.
* **Listening 2**: 1 pt por respuesta (1 + 1 + 4 + 4).
* **Listening 3**: selección múltiple 1 pt × 2; secuencia 0.5 pt × 4; emparejamiento 1 pt × 3; completar 1 pt × 3.

Nota = (puntaje total / 30) × 5, redondeada a un decimal.

En los espacios para completar no se distinguen mayúsculas/minúsculas y se ignoran puntuación final, espacios extra y "°C"/"degrees". No se toleran errores de ortografía. Las respuestas aceptadas están en `exam-data.js` (`accept`). La respuesta textual de cada persona queda en la hoja **Items**, así que se puede recalificar.

## Limitaciones (pilotaje, no examen de alto impacto)

* Es un sitio estático: **la clave de respuestas está en el código fuente** (`exam-data.js`) y cualquier persona con conocimientos técnicos puede verla. Aceptable para un pilotaje con colegas; **no** apto para la aplicación real con estudiantes.
* La contraseña se valida en el navegador (hash) y otra vez en el servidor al enviar. No es una autenticación fuerte.
* El límite de 2 reproducciones y la reanudación se guardan en el navegador. Abrir la página en otro navegador o borrar los datos del sitio reinicia el intento (queda registrado en la hoja como "Intento #").
* Si la persona recarga la página mientras suena un audio, esa reproducción se cuenta como usada.

