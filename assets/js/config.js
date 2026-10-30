/* =========================================================================
   CONFIGURACIÓN DEL PILOTAJE
   Este es el único archivo que normalmente hay que editar.
   ========================================================================= */
window.PILOT_CONFIG = {
  // 1) URL de la aplicación web de Google Apps Script (termina en /exec).
  //    Ver README.md, paso 2. Mientras esté vacía, la página funciona pero
  //    no envía datos (permite descargar una copia en JSON).
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbxZ2h5R8arNdbNNbP8VZ-Ls0MTsFpmGrbvKgyMka1a7NBG3F9Ppxx6dDHA_Csw5QT0/exec",

  // 2) Huella SHA-256 de la contraseña general.
  //    Contraseña por defecto: PilotoB12-2026
  //    Para cambiarla, abra tools/generar-hash.html, escriba la nueva
  //    contraseña y pegue aquí el resultado. Use la MISMA contraseña en
  //    apps-script/Code.gs (constante PILOT_PASSWORD).
  passwordHash: "62af20eb9dc8b6d77b8715ea706e15b231f6ee4f270ee334b5faf840fff83a37",

  // Dominios de correo permitidos para ingresar.
  allowedDomains: ["correounivalle.edu.co"],

  // Número máximo de reproducciones por audio.
  maxPlays: 2,

  // ¿Se permite pausar el audio? (false = condiciones de examen: sin pausa
  // ni adelantar/retroceder).
  allowPause: false,

  // Mostrar el cronómetro al participante.
  showTimer: true,

  // ¿Puede una misma persona (mismo correo, mismo navegador) presentar la
  // prueba más de una vez?
  allowRetake: false,

  // ¿Son obligatorios los comentarios de retroalimentación por ejercicio?
  requireFeedbackComments: true,

  // Escala de calificación (Univalle: 0.0 – 5.0).
  gradeMax: 5,
  passingGrade: 3.0,

  // Valoración cualitativa según la nota (de mayor a menor).
  ratingBands: [
    { min: 4.5, label: "Excelente" },
    { min: 4.0, label: "Sobresaliente" },
    { min: 3.5, label: "Bueno" },
    { min: 3.0, label: "Aceptable" },
    { min: 0.0, label: "Insuficiente" }
  ],

  appVersion: "1.0.0"
};
