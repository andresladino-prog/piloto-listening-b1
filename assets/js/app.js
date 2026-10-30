/* =========================================================================
   Pilotaje Listening B1.2 — lógica de la aplicación
   No requiere librerías externas.
   ========================================================================= */
(function () {
  "use strict";

  const C = window.PILOT_CONFIG;
  const EXAM = window.EXAM;
  const $app = document.getElementById("app");
  const $modal = document.getElementById("modal");
  const $who = document.getElementById("who");

  const KEY = "lp1:";              // prefijo de almacenamiento local
  const CURRENT = "lp1:current";   // último participante activo

  let state = null;
  let tick = null;
  let lastTick = 0;
  let playing = null;              // índice del audio que suena
  let starting = false;            // evita doble clic mientras inicia el audio
  const audios = {};

  /* ------------------------------------------------------------ utilidades */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* noop */ } }
  };

  function save() { if (state) store.set(KEY + state.email, JSON.stringify(state)); }

  function load(email) {
    const raw = store.get(KEY + email);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  async function sha256(text) {
    if (!(window.crypto && crypto.subtle)) throw new Error("nocrypto");
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const mm = String(m).padStart(2, "0"), ss = String(s).padStart(2, "0");
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  const round2 = (n) => Math.round(n * 100) / 100;
  const fmtNum = (n) => (Math.round(n * 100) / 100).toLocaleString("es-CO", { maximumFractionDigits: 2 });

  function normalize(s) {
    return String(s || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[−–—]/g, "-")
      .replace(/°\s*c\b|°|º/g, " ")
      .replace(/\b(degrees?|celsius)\b/g, " ")
      .replace(/[.,;:!?"'`´]+/g, " ")
      .replace(/-\s+/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* --------------------------------------------- unidades evaluables */
  function unitsOf(ex) {
    const out = [];
    ex.parts.forEach((p) => p.questions.forEach((q) => {
      if (q.type === "mc") {
        out.push({ id: q.id, qid: q.id, kind: "mc", key: q.key, points: q.points, text: stripTags(q.prompt) });
      } else if (q.type === "group") {
        q.items.forEach((it) => out.push({ id: it.id, qid: q.id, kind: "mc", key: it.key, points: it.points, text: it.label + " " + it.prompt }));
      } else if (q.type === "match" || q.type === "sequence") {
        q.rows.forEach((r, i) => out.push({
          id: `${q.id}.${i + 1}`, qid: q.id, kind: q.type, key: r.key,
          points: r.key ? q.points : 0, distractor: !r.key, text: r.text
        }));
      } else if (q.type === "gap") {
        q.blanks.forEach((b) => out.push({
          id: `${q.id}${b.letter}`, qid: q.id, kind: "gap", accept: b.accept,
          key: b.accept.join(" / "), points: q.points, text: b.text
        }));
      }
    }));
    return out;
  }

  function stripTags(html) { const d = document.createElement("div"); d.innerHTML = html; return d.textContent; }

  // Progreso: cuántas respuestas esperadas se han dado en un ejercicio
  function progressOf(exIdx) {
    const units = unitsOf(EXAM[exIdx]);
    const byQ = {};
    units.forEach((u) => {
      const q = byQ[u.qid] || (byQ[u.qid] = { expected: 0, filled: 0, rows: false });
      if (u.kind === "match" || u.kind === "sequence") {
        q.rows = true;
        if (!u.distractor) q.expected++;
        if (answered(u.id)) q.filled++;
      } else {
        q.expected++;
        if (answered(u.id)) q.filled++;
      }
    });
    let expected = 0, filled = 0;
    Object.values(byQ).forEach((q) => { expected += q.expected; filled += Math.min(q.filled, q.expected); });
    return { expected, filled };
  }

  function answered(id) {
    const v = state.answers[id];
    return v != null && String(v).trim() !== "";
  }

  /* ------------------------------------------------------- calificación */
  function grade() {
    let correct = 0, incorrect = 0, unanswered = 0, total = 0, max = 0;
    const exercises = EXAM.map((ex, i) => {
      let pts = 0, mx = 0, c = 0, n = 0, inc = 0, un = 0;
      const items = unitsOf(ex).map((u) => {
        const resp = state.answers[u.id] == null ? "" : String(state.answers[u.id]).trim();
        let ok = null;
        if (!u.distractor) {
          n++;
          mx += u.points;
          if (u.kind === "gap") ok = resp !== "" && u.accept.some((a) => normalize(a) === normalize(resp));
          else ok = resp !== "" && resp === u.key;
          if (ok) { c++; pts += u.points; }
          else if (resp === "") un++;
          else inc++;
        }
        return {
          exercise: ex.id, id: u.id, kind: u.kind, text: u.text, response: resp,
          key: u.distractor ? "(distractor)" : u.key, correct: ok,
          points: ok ? u.points : 0, maxPoints: u.points
        };
      });
      correct += c; incorrect += inc; unanswered += un; total += pts; max += mx;
      return {
        id: ex.id, label: ex.label, title: ex.title, score: round2(pts), max: round2(mx),
        correct: c, incorrect: inc, unanswered: un, items: n,
        seconds: Math.round(state.sectionTime[i]), plays: state.plays[i], detail: items
      };
    });
    const gradeVal = Math.round((total / max) * C.gradeMax * 10) / 10;
    const band = C.ratingBands.find((b) => gradeVal >= b.min) || C.ratingBands[C.ratingBands.length - 1];
    return {
      exercises, correct, incorrect, unanswered,
      total: round2(total), max: round2(max),
      grade: gradeVal, rating: band.label, passed: gradeVal >= C.passingGrade
    };
  }

  /* ------------------------------------------------------------ cronómetro */
  function startTick() {
    stopTick();
    lastTick = Date.now();
    tick = setInterval(onTick, 1000);
  }
  function stopTick() { if (tick) clearInterval(tick); tick = null; }
  function onTick() {
    if (!state || state.phase !== "exam") return;
    const now = Date.now();
    state.sectionTime[state.current] += (now - lastTick) / 1000;
    lastTick = now;
    save();
    const t = document.getElementById("timer");
    if (t) t.textContent = fmtTime(totalActive());
  }
  const totalActive = () => state.sectionTime.reduce((a, b) => a + b, 0);

  /* ---------------------------------------------------------------- audio */
  function getAudio(i) {
    if (audios[i]) return audios[i];
    const a = new Audio();
    a.preload = "auto";
    a.src = EXAM[i].audio;
    a.addEventListener("loadedmetadata", () => updatePlayer(i));
    a.addEventListener("timeupdate", () => updateProgress(i));
    a.addEventListener("ended", () => { playing = null; updatePlayer(i); setNavLock(false); });
    a.addEventListener("error", () => {
      if (playing === i) {
        // Si falla al inicio, no se descuenta la reproducción
        if (a.currentTime < 5 && state.plays[i] > 0) { state.plays[i]--; save(); }
        playing = null; setNavLock(false);
      }
      playerMsg(i, "No fue posible cargar el audio. Verifique su conexión e intente de nuevo.");
      updatePlayer(i);
    });
    audios[i] = a;
    return a;
  }

  function playAudio(i) {
    const a = getAudio(i);
    if (playing !== null && playing !== i) return;
    if (playing === i) {               // pausa / reanudar (solo si está permitido)
      if (!C.allowPause) return;
      if (a.paused) a.play(); else a.pause();
      updatePlayer(i);
      return;
    }
    if (state.plays[i] >= C.maxPlays || starting) return;
    starting = true;
    setNavLock(true);
    a.currentTime = 0;
    playerMsg(i, "");
    a.play().then(() => {
      state.plays[i]++;
      playing = i;
      save();
      updatePlayer(i);
      setNavLock(true);
    }).catch(() => {
      setNavLock(false);
      playerMsg(i, "El navegador no permitió reproducir el audio. Intente de nuevo.");
    }).finally(() => { starting = false; });
  }

  function updatePlayer(i) {
    const box = document.querySelector(`[data-player="${i}"]`);
    if (!box) return;
    const a = getAudio(i);
    const left = C.maxPlays - state.plays[i];
    const btn = box.querySelector(".play-btn");
    const status = box.querySelector(".play-status");
    const isPlaying = playing === i;
    let label;
    if (isPlaying) label = C.allowPause ? (a.paused ? "Reanudar" : "Pausar") : "Reproduciendo…";
    else if (left <= 0) label = "Reproducciones agotadas";
    else label = state.plays[i] === 0 ? "Reproducir audio" : "Reproducir de nuevo";
    btn.querySelector("span").textContent = label;
    btn.disabled = (isPlaying && !C.allowPause) || (!isPlaying && (left <= 0 || playing !== null));
    btn.classList.toggle("is-playing", isPlaying);
    const dots = Array.from({ length: C.maxPlays }, (_, k) =>
      `<i class="dot ${k < state.plays[i] ? "used" : ""}"></i>`).join("");
    status.innerHTML = `${dots}<span>${isPlaying ? `Reproducción ${state.plays[i]} de ${C.maxPlays}` :
      left > 0 ? `${left} de ${C.maxPlays} reproducciones disponibles` : "Ya utilizó todas las reproducciones"}</span>`;
    updateProgress(i);
  }

  function updateProgress(i) {
    const box = document.querySelector(`[data-player="${i}"]`);
    if (!box) return;
    const a = getAudio(i);
    const d = isFinite(a.duration) ? a.duration : 0;
    const cur = playing === i ? a.currentTime : 0;
    box.querySelector(".bar > i").style.width = d ? `${(cur / d) * 100}%` : "0%";
    box.querySelector(".play-time").textContent = `${fmtTime(cur)} / ${d ? fmtTime(d) : "--:--"}`;
  }

  function playerMsg(i, msg) {
    const el = document.querySelector(`[data-player="${i}"] .play-msg`);
    if (el) el.textContent = msg;
  }

  function setNavLock(on) {
    document.querySelectorAll("[data-nav]").forEach((b) => { b.disabled = on; });
    const n = document.getElementById("navlock");
    if (n) n.hidden = !on;
  }

  /* -------------------------------------------------------------- modal */
  function openModal(html) {
    $modal.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">${html}</div>`;
    $modal.hidden = false;
  }
  function closeModal() { $modal.hidden = true; $modal.innerHTML = ""; }

  /* ------------------------------------------------------------ pantallas */
  function render() {
    stopTick();
    $who.innerHTML = state ? `<span>${esc(state.name)} · ${esc(state.email)}</span>
      <button class="link" id="logout" type="button">Salir</button>` : "";
    window.onbeforeunload = null;
    if (!state) return renderLogin();
    switch (state.phase) {
      case "intro": return renderIntro();
      case "exam": return renderExam();
      case "results": return renderResults();
      case "feedback": return renderFeedback();
      case "done": return renderDone();
      default: return renderLogin();
    }
  }

  function renderLogin(msg) {
    $app.innerHTML = `
      <section class="card narrow">
        <p class="eyebrow">Escuela de Ciencias del Lenguaje · Universidad del Valle</p>
        <h1>Pilotaje — Prueba de proficiencia B1.2</h1>
        <p class="lead">Componente de <strong>Listening</strong>. Ingrese con su correo institucional y la contraseña que recibió del equipo.</p>
        <form id="login" novalidate>
          <label>Nombre completo
            <input name="name" type="text" autocomplete="name" required>
          </label>
          <label>Correo institucional
            <input name="email" type="email" autocomplete="email" placeholder="nombre.apellido@${esc(C.allowedDomains[0])}" required>
          </label>
          <label>Contraseña de pilotaje
            <input name="password" type="password" autocomplete="current-password" required>
          </label>
          <p class="error" id="loginErr" role="alert">${esc(msg || "")}</p>
          <button class="btn primary" type="submit">Ingresar</button>
        </form>
      </section>`;
  }

  async function doLogin(form) {
    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const pw = form.password.value;
    const err = document.getElementById("loginErr");
    const domainOk = C.allowedDomains.some((d) => new RegExp(`^[^@\\s]+@${d.replace(/\./g, "\\.")}$`).test(email));
    if (!name) { err.textContent = "Escriba su nombre."; return; }
    if (!domainOk) { err.textContent = `Use su correo institucional (@${C.allowedDomains.join(", @")}).`; return; }
    let hash;
    try { hash = await sha256(pw); }
    catch (e) { err.textContent = "Este navegador no permite validar la contraseña. Abra la página desde su dirección https."; return; }
    if (hash !== C.passwordHash) { err.textContent = "Contraseña incorrecta."; return; }

    const prev = load(email);
    if (prev && (prev.phase !== "done" || !C.allowRetake)) {
      state = prev;
      state.name = name;
      state.pw = pw;
      if (state.phase === "exam") state.reloads = (state.reloads || 0) + 1;
    } else {
      state = {
        v: 1, submissionId: uid(), name, email, pw,
        phase: "intro", current: 0, startedAt: null, endedAt: null,
        sectionTime: EXAM.map(() => 0), plays: EXAM.map(() => 0),
        answers: {}, results: null, feedback: null, sent: false, sentAt: null, reloads: 0
      };
    }
    store.set(CURRENT, email);
    save();
    render();
  }

  function renderIntro() {
    const rows = EXAM.map((ex) => `<li><strong>${esc(ex.label)}.</strong> ${esc(ex.kicker)} — <em>${esc(ex.title)}</em></li>`).join("");
    $app.innerHTML = `
      <section class="card narrow">
        <p class="eyebrow">Antes de empezar</p>
        <h1>Instrucciones</h1>
        <ol class="rules">
          <li>La prueba tiene tres ejercicios de comprensión auditiva:<ul>${rows}</ul></li>
          <li>Cada audio puede reproducirse <strong>máximo ${C.maxPlays} veces</strong>. ${C.allowPause ? "" : "No es posible pausarlo, adelantarlo ni retrocederlo."} Una reproducción cuenta desde el momento en que inicia.</li>
          <li>Mientras un audio suena no podrá cambiar de ejercicio, pero sí responder las preguntas de ese ejercicio.</li>
          <li>El cronómetro empieza al hacer clic en <em>Comenzar</em> y se detiene al finalizar la prueba. Puede moverse libremente entre los ejercicios; se registra el tiempo dedicado a cada uno.</li>
          <li>Sus respuestas se guardan automáticamente en este navegador.</li>
          <li>Al terminar verá su resultado y luego se le pedirá retroalimentación sobre cada ejercicio. La información se envía al equipo solo cuando complete ese último paso.</li>
          <li>Use audífonos y una conexión estable.</li>
        </ol>
        <button class="btn primary" id="start" type="button">Comenzar</button>
      </section>`;
  }

  /* ---------------- examen */
  function renderExam() {
    const i = state.current;
    const ex = EXAM[i];
    const tabs = EXAM.map((e, k) => {
      const p = progressOf(k);
      return `<button type="button" class="tab ${k === i ? "active" : ""}" data-nav data-go="${k}">
        <span>${esc(e.label)}</span><small>${p.filled}/${p.expected}</small></button>`;
    }).join("");

    $app.innerHTML = `
      <div class="exambar">
        <nav class="tabs" aria-label="Ejercicios">${tabs}</nav>
        ${C.showTimer ? `<div class="timer" title="Tiempo transcurrido"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg><span id="timer">${fmtTime(totalActive())}</span></div>` : ""}
      </div>
      <article class="card exercise">
        <header class="ex-head">
          <p class="eyebrow">${esc(ex.label)} · ${esc(ex.kicker)}</p>
          <h1>${esc(ex.title)}</h1>
          <p class="ex-intro">${esc(ex.intro)}</p>
        </header>
        <div class="player" data-player="${i}">
          <button type="button" class="play-btn" data-play="${i}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>Reproducir audio</span>
          </button>
          <div class="play-body">
            <div class="bar"><i></i></div>
            <div class="play-meta"><span class="play-status"></span><span class="play-time">--:-- / --:--</span></div>
            <p class="play-msg" role="status"></p>
          </div>
        </div>
        <p class="navlock" id="navlock" hidden>La navegación entre ejercicios se habilita cuando termine el audio.</p>
        ${ex.parts.map(renderPart).join("")}
      </article>
      <div class="exam-nav">
        <button type="button" class="btn" data-nav data-go="${i - 1}" ${i === 0 ? "hidden" : ""}>← ${i > 0 ? esc(EXAM[i - 1].label) : ""}</button>
        ${i < EXAM.length - 1
          ? `<button type="button" class="btn primary" data-nav data-go="${i + 1}">${esc(EXAM[i + 1].label)} →</button>`
          : `<button type="button" class="btn primary" data-nav id="finish">Finalizar prueba</button>`}
      </div>`;

    getAudio(i);
    updatePlayer(i);
    refreshUnique();
    setNavLock(playing !== null);
    window.onbeforeunload = (e) => { e.preventDefault(); e.returnValue = ""; };
    startTick();
  }

  function renderPart(p) {
    return `<section class="part">
      <h2>${esc(p.title)}</h2>
      ${p.instructions ? `<p class="instr">${esc(p.instructions)}</p>` : ""}
      ${p.questions.map(renderQuestion).join("")}
    </section>`;
  }

  function radios(name, options) {
    const cur = state.answers[name];
    return `<div class="options">${options.map(([k, t]) => `
      <label class="opt"><input type="radio" name="${esc(name)}" value="${esc(k)}" data-unit="${esc(name)}" ${cur === k ? "checked" : ""}>
        <b>${esc(k)}.</b><span>${esc(t)}</span></label>`).join("")}</div>`;
  }

  function select(unit, choices, group) {
    const cur = state.answers[unit] || "";
    return `<select data-unit="${esc(unit)}" ${group ? `data-unique="${esc(group)}"` : ""} aria-label="Respuesta">
      <option value="">—</option>
      ${choices.map((c) => `<option value="${esc(c)}" ${cur === c ? "selected" : ""}>${esc(c)}</option>`).join("")}
    </select>`;
  }

  function renderQuestion(q) {
    const head = `<p class="q-prompt"><span class="qn">${esc(q.num)}.</span> ${q.prompt}</p>`;
    if (q.type === "mc") {
      return `<fieldset class="q">${head}${radios(q.id, q.options)}</fieldset>`;
    }
    if (q.type === "group") {
      return `<div class="q">${head}${q.items.map((it) => `
        <fieldset class="sub">
          <p class="sub-prompt"><u>${esc(it.label)}</u> ${esc(it.prompt)}</p>
          ${radios(it.id, it.options)}
        </fieldset>`).join("")}</div>`;
    }
    if (q.type === "match") {
      const letters = q.bank.map((b) => b[0]);
      return `<div class="q">${head}
        <div class="match">
          <div class="bank"><h3>${esc(q.bankTitle)}</h3>
            <ul>${q.bank.map(([k, t]) => `<li><b>${esc(k)}.</b> ${esc(t)}</li>`).join("")}</ul></div>
          <div class="rows"><h3>${esc(q.rowsTitle)}</h3>
            ${q.rows.map((r, n) => `<div class="row">
              ${select(`${q.id}.${n + 1}`, letters, q.unique ? q.id : "")}
              <span>${q.numberedRows ? `<b>${n + 1}.</b> ` : ""}${esc(r.text)}</span></div>`).join("")}
          </div>
        </div></div>`;
    }
    if (q.type === "sequence") {
      return `<div class="q">${head}${q.note ? `<p class="note">(${esc(q.note)})</p>` : ""}
        <div class="rows seq">${q.rows.map((r, n) => `<div class="row">
          ${select(`${q.id}.${n + 1}`, q.choices, q.unique ? q.id : "")}<span>${esc(r.text)}</span></div>`).join("")}</div></div>`;
    }
    if (q.type === "gap") {
      return `<div class="q">${head}<ol class="gaps">${q.blanks.map((b) => {
        const id = `${q.id}${b.letter}`;
        const [pre, post] = b.text.split("___");
        return `<li><b>${esc(b.letter)}.</b> <span>${esc(pre)}<input type="text" class="gap" data-unit="${esc(id)}"
          value="${esc(state.answers[id] || "")}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
          aria-label="Gap ${esc(b.letter)}">${esc(post || "")}</span></li>`;
      }).join("")}</ol></div>`;
    }
    return "";
  }

  // Evita usar la misma letra dos veces dentro de un emparejamiento
  function refreshUnique() {
    const groups = {};
    document.querySelectorAll("select[data-unique]").forEach((s) => {
      (groups[s.dataset.unique] = groups[s.dataset.unique] || []).push(s);
    });
    Object.values(groups).forEach((sels) => {
      const used = sels.map((s) => s.value).filter(Boolean);
      sels.forEach((s) => {
        Array.from(s.options).forEach((o) => {
          o.disabled = o.value !== "" && o.value !== s.value && used.includes(o.value);
        });
      });
    });
  }

  function refreshTabCounts() {
    document.querySelectorAll(".tab").forEach((t) => {
      const p = progressOf(+t.dataset.go);
      t.querySelector("small").textContent = `${p.filled}/${p.expected}`;
    });
  }

  function goTo(k) {
    if (playing !== null || k < 0 || k >= EXAM.length) return;
    onTick();
    state.current = k;
    save();
    renderExam();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function askFinish() {
    if (playing !== null) return;
    const lines = EXAM.map((ex, k) => {
      const p = progressOf(k);
      const miss = p.expected - p.filled;
      return `<li>${esc(ex.label)}: ${miss ? `<strong>${miss} sin responder</strong>` : "completo"}</li>`;
    }).join("");
    const unplayed = EXAM.filter((ex, k) => state.plays[k] === 0).map((ex) => ex.label);
    openModal(`
      <h2>¿Finalizar la prueba?</h2>
      <ul class="plain">${lines}</ul>
      ${unplayed.length ? `<p class="warn">No ha reproducido el audio de: ${esc(unplayed.join(", "))}.</p>` : ""}
      <p>Después de finalizar no podrá cambiar sus respuestas.</p>
      <div class="modal-actions">
        <button class="btn" type="button" data-close>Volver a la prueba</button>
        <button class="btn primary" type="button" id="confirmFinish">Finalizar y ver resultados</button>
      </div>`);
  }

  function finishExam() {
    onTick();
    stopTick();
    Object.values(audios).forEach((a) => a.pause());
    state.endedAt = new Date().toISOString();
    state.results = grade();
    state.phase = "results";
    save();
    closeModal();
    render();
    window.scrollTo(0, 0);
  }

  /* ---------------- resultados */
  function renderResults() {
    const r = state.results;
    const wall = (new Date(state.endedAt) - new Date(state.startedAt)) / 1000;
    $app.innerHTML = `
      <section class="card">
        <p class="eyebrow">Resultado</p>
        <h1>Prueba finalizada</h1>
        <div class="scoreline">
          <div class="grade ${r.passed ? "pass" : "fail"}">
            <span class="g">${r.grade.toFixed(1)}</span><span class="of">/ ${C.gradeMax.toFixed(1)}</span>
            <span class="rating">${esc(r.rating)}</span>
          </div>
          <dl class="stats">
            <div><dt>Correctas</dt><dd>${r.correct}</dd></div>
            <div><dt>Incorrectas</dt><dd>${r.incorrect + r.unanswered}</dd></div>
            <div><dt>Puntaje</dt><dd>${fmtNum(r.total)} / ${fmtNum(r.max)}</dd></div>
            <div><dt>Tiempo</dt><dd>${fmtTime(totalActive())}</dd></div>
          </dl>
        </div>
        ${r.unanswered ? `<p class="muted">De las ${r.incorrect + r.unanswered} incorrectas, ${r.unanswered} ${r.unanswered === 1 ? "quedó" : "quedaron"} sin responder.</p>` : ""}
        <div class="table-wrap"><table class="summary">
          <thead><tr><th>Ejercicio</th><th>Puntaje</th><th>Correctas</th><th>Tiempo</th><th>Reproducciones</th></tr></thead>
          <tbody>${r.exercises.map((e) => `<tr>
            <td>${esc(e.label)} <span class="muted">· ${esc(e.title)}</span></td>
            <td>${fmtNum(e.score)} / ${fmtNum(e.max)}</td>
            <td>${e.correct} / ${e.items}</td>
            <td>${fmtTime(e.seconds)}</td>
            <td>${e.plays}</td></tr>`).join("")}</tbody>
        </table></div>
        <p class="muted small">Tiempo total entre inicio y fin (incluye pausas o recargas de la página): ${fmtTime(wall)}.</p>

        <details class="review">
          <summary>Ver respuestas y clave</summary>
          ${r.exercises.map((e) => `<h3>${esc(e.label)} — ${esc(e.title)}</h3>
            <div class="table-wrap"><table class="detail"><thead><tr><th>Ítem</th><th>Su respuesta</th><th>Clave</th><th></th></tr></thead>
            <tbody>${e.detail.map((d) => `<tr class="${d.correct === null ? "dist" : d.correct ? "ok" : "bad"}">
              <td><b>${esc(d.id)}</b><br><span class="muted">${esc(d.text)}</span></td>
              <td>${esc(d.response || "—")}</td><td>${esc(d.key || "—")}</td>
              <td>${d.correct === null ? "" : d.correct ? "✓" : "✗"}</td></tr>`).join("")}</tbody></table></div>`).join("")}
        </details>

        <div class="callout">
          <p><strong>Falta un paso.</strong> Sus resultados todavía no se han enviado. Para terminar, por favor comparta su retroalimentación sobre cada ejercicio.</p>
          <button class="btn primary" id="toFeedback" type="button">Continuar a la retroalimentación</button>
        </div>
      </section>`;
  }

  /* ---------------- retroalimentación */
  function renderFeedback(errors) {
    const fb = state.feedback || {};
    const req = C.requireFeedbackComments;
    const diff = ["Muy fácil", "Fácil", "Adecuado", "Difícil", "Muy difícil"];
    const lvl = ["Sí", "Parcialmente", "No"];
    $app.innerHTML = `
      <section class="card">
        <p class="eyebrow">Último paso</p>
        <h1>Retroalimentación</h1>
        <p class="lead">Este pilotaje busca evaluar la calidad del material. Sus comentarios sobre instrucciones, preguntas, opciones de respuesta, distractores, claves, calidad del audio y nivel de dificultad son lo más valioso de este ejercicio.</p>
        <form id="fbForm" novalidate>
          ${EXAM.map((ex) => {
            const f = fb[ex.id] || {};
            return `<fieldset class="fb">
              <legend>${esc(ex.label)} — ${esc(ex.title)}</legend>
              <div class="fb-row"><span class="fb-q">Dificultad percibida</span>
                <div class="seg">${diff.map((d, k) => `<label><input type="radio" name="${ex.id}-diff" value="${k + 1}" ${String(f.difficulty) === String(k + 1) ? "checked" : ""}><span>${d}</span></label>`).join("")}</div></div>
              <div class="fb-row"><span class="fb-q">¿Corresponde al nivel B1.2?</span>
                <div class="seg">${lvl.map((d) => `<label><input type="radio" name="${ex.id}-lvl" value="${d}" ${f.level === d ? "checked" : ""}><span>${d}</span></label>`).join("")}</div></div>
              <label class="fb-text">Comentarios sobre este ejercicio${req ? "" : " (opcional)"}
                <textarea name="${ex.id}-comment" rows="5" placeholder="Por ejemplo: ítems ambiguos, distractores débiles, claves dudosas, instrucciones poco claras, calidad del audio…">${esc(f.comment || "")}</textarea>
              </label>
              ${errors && errors[ex.id] ? `<p class="error">${esc(errors[ex.id])}</p>` : ""}
            </fieldset>`;
          }).join("")}
          <fieldset class="fb">
            <legend>Comentarios generales sobre la prueba (opcional)</legend>
            <label class="fb-text">Tiempo, orden de los ejercicios, plataforma, número de reproducciones, etc.
              <textarea name="general" rows="4">${esc(fb.general || "")}</textarea></label>
          </fieldset>
          <p class="error" id="fbErr" role="alert">${errors ? "Revise los campos marcados." : ""}</p>
          <button class="btn primary" type="submit">Enviar resultados y retroalimentación</button>
        </form>
      </section>`;
  }

  function collectFeedback(form) {
    const fb = {}, errors = {};
    EXAM.forEach((ex) => {
      const d = form.querySelector(`[name="${ex.id}-diff"]:checked`);
      const l = form.querySelector(`[name="${ex.id}-lvl"]:checked`);
      const c = form[`${ex.id}-comment`].value.trim();
      fb[ex.id] = { difficulty: d ? +d.value : "", level: l ? l.value : "", comment: c };
      const miss = [];
      if (!d) miss.push("dificultad");
      if (!l) miss.push("nivel");
      if (C.requireFeedbackComments && !c) miss.push("comentarios");
      if (miss.length) errors[ex.id] = "Falta: " + miss.join(", ") + ".";
    });
    fb.general = form.general.value.trim();
    return { fb, errors };
  }

  function buildPayload() {
    const r = state.results;
    return {
      password: state.pw,
      submissionId: state.submissionId,
      appVersion: C.appVersion,
      name: state.name,
      email: state.email,
      startedAt: state.startedAt,
      endedAt: state.endedAt,
      activeSeconds: Math.round(totalActive()),
      wallSeconds: Math.round((new Date(state.endedAt) - new Date(state.startedAt)) / 1000),
      reloads: state.reloads || 0,
      exercises: r.exercises.map((e) => ({
        id: e.id, title: e.title, score: e.score, max: e.max, correct: e.correct,
        incorrect: e.incorrect, unanswered: e.unanswered, items: e.items,
        seconds: e.seconds, plays: e.plays, feedback: state.feedback[e.id]
      })),
      totalScore: r.total, maxScore: r.max,
      correct: r.correct, incorrect: r.incorrect, unanswered: r.unanswered,
      grade: r.grade, rating: r.rating,
      generalComment: state.feedback.general,
      items: r.exercises.flatMap((e) => e.detail.map((d) => ({
        exercise: d.exercise, id: d.id, text: d.text, response: d.response, key: d.key,
        correct: d.correct === null ? "" : d.correct ? 1 : 0, points: d.points, maxPoints: d.maxPoints
      }))),
      userAgent: navigator.userAgent
    };
  }

  async function send() {
    renderDone("sending");
    if (!C.appsScriptUrl) {
      return renderDone("error", "La conexión con Google Sheets aún no está configurada (appsScriptUrl vacío en config.js).");
    }
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 45000);
    try {
      const res = await fetch(C.appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(buildPayload()),
        signal: ctrl.signal
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Respuesta inválida del servidor");
      state.sent = true;
      state.sentAt = new Date().toISOString();
      state.phase = "done";
      save();
      renderDone();
    } catch (e) {
      renderDone("error", e.name === "AbortError" ? "El servidor tardó demasiado en responder." : String(e.message || e));
    } finally {
      clearTimeout(to);
    }
  }

  function renderDone(mode, msg) {
    if (state.phase !== "done" && !mode) mode = "error";
    const r = state.results;
    let body;
    if (mode === "sending") {
      body = `<p class="eyebrow">Enviando</p><h1>Enviando su información…</h1><p class="lead">No cierre esta ventana.</p><div class="spinner" aria-hidden="true"></div>`;
    } else if (mode === "error") {
      body = `<p class="eyebrow">Envío pendiente</p><h1>No se pudo enviar la información</h1>
        <p class="error">${esc(msg || "")}</p>
        <p>Sus respuestas y comentarios siguen guardados en este navegador. Intente de nuevo; si el problema persiste, descargue la copia y envíela al coordinador del pilotaje.</p>
        <div class="actions"><button class="btn primary" id="retry" type="button">Intentar de nuevo</button>
        <button class="btn" id="download" type="button">Descargar copia (JSON)</button>
        <button class="btn" id="editFb" type="button">Editar retroalimentación</button></div>`;
    } else {
      body = `<p class="eyebrow">Completado</p><h1>Gracias por su participación</h1>
        <p class="lead">Sus resultados y su retroalimentación fueron enviados correctamente.</p>
        <dl class="stats inline">
          <div><dt>Nota</dt><dd>${r.grade.toFixed(1)} · ${esc(r.rating)}</dd></div>
          <div><dt>Correctas</dt><dd>${r.correct} de ${r.correct + r.incorrect + r.unanswered}</dd></div>
          <div><dt>Tiempo</dt><dd>${fmtTime(totalActive())}</dd></div>
        </dl>
        <div class="actions"><button class="btn" id="seeResults" type="button">Ver detalle del resultado</button>
        <button class="btn" id="download" type="button">Descargar copia (JSON)</button></div>`;
    }
    $app.innerHTML = `<section class="card narrow center">${body}</section>`;
  }

  function download() {
    const p = buildPayload();
    delete p.password;
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pilotaje-listening-${state.email.split("@")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* -------------------------------------------------------------- eventos */
  document.addEventListener("submit", (e) => {
    if (e.target.id === "login") { e.preventDefault(); doLogin(e.target); }
    if (e.target.id === "fbForm") {
      e.preventDefault();
      const { fb, errors } = collectFeedback(e.target);
      state.feedback = fb;
      save();
      if (Object.keys(errors).length) { renderFeedback(errors); return; }
      send();
    }
  });

  function onAnswer(e) {
    const t = e.target;
    if (!t.dataset || !t.dataset.unit || !state || state.phase !== "exam") return;
    state.answers[t.dataset.unit] = t.value;
    save();
    if (t.dataset.unique) refreshUnique();
    refreshTabCounts();
  }
  document.addEventListener("change", onAnswer);
  document.addEventListener("input", (e) => { if (e.target.classList.contains("gap")) onAnswer(e); });

  // Guarda borradores de retroalimentación mientras se escribe
  document.addEventListener("input", (e) => {
    const f = e.target.form;
    if (f && f.id === "fbForm" && state) { state.feedback = collectFeedback(f).fb; save(); }
  });

  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, [data-close]");
    if (!t) return;
    if (t.id === "logout") {
      if (playing !== null) return;
      if (state && state.phase === "exam") onTick();
      store.del(CURRENT); state = null; render(); return;
    }
    if (t.hasAttribute("data-close")) { closeModal(); return; }
    if (t.id === "start") {
      state.startedAt = new Date().toISOString();
      state.phase = "exam";
      save(); render(); return;
    }
    if (t.dataset.play != null) { playAudio(+t.dataset.play); return; }
    if (t.id === "finish") { askFinish(); return; }
    if (t.id === "confirmFinish") { finishExam(); return; }
    if (t.dataset.go != null) { goTo(+t.dataset.go); return; }
    if (t.id === "toFeedback") { state.phase = "feedback"; save(); render(); window.scrollTo(0, 0); return; }
    if (t.id === "retry") { send(); return; }
    if (t.id === "editFb") { state.phase = "feedback"; save(); render(); return; }
    if (t.id === "download") { download(); return; }
    if (t.id === "seeResults") { state.phase = "results"; render(); state.phase = "done"; hideFeedbackCallout(); return; }
  });

  function hideFeedbackCallout() {
    const c = document.querySelector(".callout");
    if (c) c.innerHTML = `<p>Sus resultados y retroalimentación ya fueron enviados.</p>`;
  }

  /* --------------------------------------------------------------- inicio */
  const last = store.get(CURRENT);
  if (last) {
    state = load(last);
    if (state && state.phase === "exam") state.reloads = (state.reloads || 0) + 1;
    if (state && state.phase === "feedback" && state.feedback && state.sent) state.phase = "done";
  }
  render();
})();
