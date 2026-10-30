/**
 * Pilotaje Listening B1.2 — receptor de datos para Google Sheets
 *
 * Instalación (ver README.md, paso 2):
 *   1. Abra la hoja de cálculo > Extensiones > Apps Script.
 *   2. Pegue este archivo completo en Code.gs y guarde.
 *   3. Cambie PILOT_PASSWORD si cambió la contraseña en config.js.
 *   4. Ejecute una vez la función `setup` (autorice los permisos).
 *   5. Implementar > Nueva implementación > Aplicación web
 *        Ejecutar como: Yo
 *        Quién tiene acceso: Cualquier usuario
 *      Copie la URL que termina en /exec y péguela en assets/js/config.js.
 *
 * Hojas que crea:
 *   Respuestas  una fila por participante (resultados, tiempos, retroalimentación)
 *   Items       una fila por ítem y participante (para análisis de ítems)
 *   Resumen     promedios de tiempo y puntaje, índice de facilidad por ítem
 */

const PILOT_PASSWORD = 'PilotoB12-2026';
const ALLOWED_DOMAIN = 'correounivalle.edu.co';
const TZ = 'America/Bogota';
const EX_IDS = ['L1', 'L2', 'L3'];

const SHEET_MAIN = 'Respuestas';
const SHEET_ITEMS = 'Items';
const SHEET_SUMMARY = 'Resumen';

function mainHeaders_() {
  const h = [
    'Fecha de envío', 'ID envío', 'Intento #', 'Nombre', 'Correo',
    'Inicio', 'Fin', 'Tiempo total (s)', 'Tiempo total (h:mm:ss)', 'Tiempo reloj (s)', 'Recargas'
  ];
  EX_IDS.forEach(id => h.push(`${id} tiempo (s)`));
  EX_IDS.forEach(id => h.push(`${id} reproducciones`));
  EX_IDS.forEach(id => h.push(`${id} puntaje (/10)`, `${id} correctas`, `${id} incorrectas`, `${id} sin responder`));
  h.push('Puntaje total', 'Puntaje máximo', 'Correctas', 'Incorrectas', 'Sin responder', 'Nota (0-5)', 'Valoración');
  EX_IDS.forEach(id => h.push(`${id} dificultad (1-5)`, `${id} ¿nivel B1.2?`, `${id} comentarios`));
  h.push('Comentarios generales', 'Navegador', 'Versión');
  return h;
}

const ITEM_HEADERS = ['Fecha de envío', 'ID envío', 'Correo', 'Ejercicio', 'Ítem', 'Enunciado', 'Respuesta', 'Clave', 'Correcto (1/0)', 'Puntos', 'Puntos máx.'];

/* ------------------------------------------------------------------ web */
function doGet() {
  return json_({ ok: true, service: 'listening-pilot', time: new Date().toISOString() });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const d = JSON.parse(e.postData.contents);

    if (d.password !== PILOT_PASSWORD) return json_({ ok: false, error: 'Contraseña inválida' });
    const email = String(d.email || '').toLowerCase().trim();
    if (!email.endsWith('@' + ALLOWED_DOMAIN)) return json_({ ok: false, error: 'Correo no autorizado' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ensureSheets_(ss);

    // Evita duplicados si el participante reintenta el envío
    const last = sh.main.getLastRow();
    let attempt = 1;
    if (last > 1) {
      const ids = sh.main.getRange(2, 2, last - 1, 1).getValues().flat();
      if (ids.indexOf(d.submissionId) !== -1) return json_({ ok: true, duplicate: true });
      const mails = sh.main.getRange(2, 5, last - 1, 1).getValues().flat().map(String);
      attempt = mails.filter(m => m.toLowerCase() === email).length + 1;
    }

    const now = new Date();
    const fmt = iso => iso ? Utilities.formatDate(new Date(iso), TZ, 'yyyy-MM-dd HH:mm:ss') : '';
    const ex = {};
    (d.exercises || []).forEach(x => { ex[x.id] = x; });
    const g = (id, k) => (ex[id] && ex[id][k] !== undefined) ? ex[id][k] : '';
    const fb = (id, k) => (ex[id] && ex[id].feedback && ex[id].feedback[k] !== undefined) ? ex[id].feedback[k] : '';

    const row = [
      now, d.submissionId, attempt, d.name, email,
      fmt(d.startedAt), fmt(d.endedAt), d.activeSeconds, hms_(d.activeSeconds), d.wallSeconds, d.reloads
    ];
    EX_IDS.forEach(id => row.push(g(id, 'seconds')));
    EX_IDS.forEach(id => row.push(g(id, 'plays')));
    EX_IDS.forEach(id => row.push(g(id, 'score'), g(id, 'correct'), g(id, 'incorrect'), g(id, 'unanswered')));
    row.push(d.totalScore, d.maxScore, d.correct, d.incorrect, d.unanswered, d.grade, d.rating);
    EX_IDS.forEach(id => row.push(fb(id, 'difficulty'), fb(id, 'level'), fb(id, 'comment')));
    row.push(d.generalComment || '', d.userAgent || '', d.appVersion || '');
    sh.main.appendRow(row.map(safe_));

    const items = (d.items || []).map(it => [
      now, d.submissionId, email, it.exercise, it.id, it.text, it.response, it.key, it.correct, it.points, it.maxPoints
    ].map(safe_));
    if (items.length) {
      sh.items.getRange(sh.items.getLastRow() + 1, 1, items.length, ITEM_HEADERS.length).setValues(items);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e) { /* noop */ }
  }
}

/* ---------------------------------------------------------------- hojas */
function setup() {
  ensureSheets_(SpreadsheetApp.getActiveSpreadsheet());
}

function ensureSheets_(ss) {
  const main = ss.getSheetByName(SHEET_MAIN) || ss.insertSheet(SHEET_MAIN);
  if (main.getLastRow() === 0) {
    const h = mainHeaders_();
    main.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#f3e3e5');
    main.setFrozenRows(1);
    main.setFrozenColumns(5);
  }
  const items = ss.getSheetByName(SHEET_ITEMS) || ss.insertSheet(SHEET_ITEMS);
  if (items.getLastRow() === 0) {
    items.getRange(1, 1, 1, ITEM_HEADERS.length).setValues([ITEM_HEADERS]).setFontWeight('bold').setBackground('#f3e3e5');
    items.setFrozenRows(1);
  }
  if (!ss.getSheetByName(SHEET_SUMMARY)) buildSummary_(ss);
  return { main, items };
}

function buildSummary_(ss) {
  const s = ss.insertSheet(SHEET_SUMMARY);
  const h = mainHeaders_();
  const col = name => {
    const i = h.indexOf(name);
    if (i < 0) throw new Error('Columna no encontrada: ' + name);
    return `${SHEET_MAIN}!${letter_(i + 1)}2:${letter_(i + 1)}`;
  };
  const t = r => `=IFERROR(TEXT(AVERAGE(${r})/86400,"[h]:mm:ss"),"—")`;

  const rows = [
    ['Indicador', 'Valor'],
    ['Participantes', `=COUNTA(${col('Correo')})`],
    ['Tiempo promedio total', t(col('Tiempo total (s)'))],
    ['Tiempo mediano total', `=IFERROR(TEXT(MEDIAN(${col('Tiempo total (s)')})/86400,"[h]:mm:ss"),"—")`],
    ['Tiempo mínimo total', `=IFERROR(TEXT(MIN(${col('Tiempo total (s)')})/86400,"[h]:mm:ss"),"—")`],
    ['Tiempo máximo total', `=IFERROR(TEXT(MAX(${col('Tiempo total (s)')})/86400,"[h]:mm:ss"),"—")`]
  ];
  EX_IDS.forEach(id => rows.push([`Tiempo promedio ${id}`, t(col(`${id} tiempo (s)`))]));
  EX_IDS.forEach(id => rows.push([`Puntaje promedio ${id} (/10)`, `=IFERROR(ROUND(AVERAGE(${col(`${id} puntaje (/10)`)}),2),"—")`]));
  EX_IDS.forEach(id => rows.push([`Dificultad percibida promedio ${id} (1-5)`, `=IFERROR(ROUND(AVERAGE(${col(`${id} dificultad (1-5)`)}),2),"—")`]));
  rows.push(['Puntaje total promedio (/30)', `=IFERROR(ROUND(AVERAGE(${col('Puntaje total')}),2),"—")`]);
  rows.push(['Nota promedio (0-5)', `=IFERROR(ROUND(AVERAGE(${col('Nota (0-5)')}),2),"—")`]);

  s.getRange(1, 1, rows.length, 2).setValues(rows);
  s.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f3e3e5');

  const r0 = rows.length + 3;
  s.getRange(r0 - 1, 1).setValue('Índice de facilidad por ítem (proporción de aciertos; distractores excluidos)').setFontWeight('bold');
  s.getRange(r0, 1).setFormula(
    `=IFERROR(QUERY(${SHEET_ITEMS}!A:K,"select E, avg(I), count(I) where I is not null group by E order by E label E 'Ítem', avg(I) 'Facilidad', count(I) 'N'",1),"Sin datos aún")`
  );
  s.setColumnWidth(1, 330);
  s.setColumnWidth(2, 140);
}

/* ------------------------------------------------------------ utilidades */
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function hms_(sec) {
  sec = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function letter_(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
// Evita que un texto que empiece por = + - @ se interprete como fórmula
function safe_(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}
