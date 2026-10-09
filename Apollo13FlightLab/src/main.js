import "./style.css";
import { assetURL } from "./assets.js";
import {
  CHAPTERS,
  END_TIME,
  missionState,
  timeToProgress,
  progressToTime,
  advanceTime,
  formatGET,
  parseGET,
} from "./mission.js";
import { FlightScene } from "./scene.js";
import { createAGC, oct, CYCLES_PER_SECOND } from "./agc.js";
import routines from "../data/routines.json";
import provenance from "../data/provenance.json";
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const icons = {
  play: "►",
  pause: "Ⅱ",
  prev: "‹",
  next: "›",
  reset: "↺",
  expand: "↗",
};
$("#app").innerHTML = `
<header class="topbar"><a class="brand" href="#" aria-label="Apollo 13 Flight Lab home"><span class="mission-mark">13<svg viewBox="0 0 50 50" aria-hidden="true"><ellipse cx="25" cy="25" rx="24" ry="9" transform="rotate(-38 25 25)"/></svg></span><span>APOLLO 13<small>FLIGHT LAB</small></span></a><div class="header-middle"><span class="status-dot"></span> A MISSION THROUGH ITS CODE</div><button id="about-open" class="quiet-button">Sources & fidelity <span>↗</span></button></header>
<main class="workspace">
<section class="flight-panel" aria-label="Mission visualization"><div id="viewport"><div class="scene-heading"><div class="eyebrow"><span id="section-label">LAUNCH</span><span class="divider-dot">/</span><span id="chapter-count">01 — 22</span></div><h1 id="phase-title">Leave the Earth</h1><p class="date-caption">11–17 APRIL 1970 <span>•</span> AS-508 / CSM-109 / LM-7</p></div><div class="view-switch" role="group" aria-label="3D view"><button id="flight-view" class="selected" aria-pressed="true">Spacecraft</button><button id="map-view" aria-pressed="false">Mission path</button></div><div id="scene-error" role="alert" hidden></div><div class="view-corner"><span class="tiny-label" id="scene-scale">ILLUSTRATIVE 3D · APPROXIMATE GEOMETRY</span><div class="view-actions"><button id="camera-home" title="Reset camera" aria-label="Reset camera">⌖</button><button id="zoom-in" aria-label="Zoom in">+</button><button id="zoom-out" aria-label="Zoom out">−</button><button id="rotate-view" aria-label="Toggle automatic camera orbit" aria-pressed="false">⟳</button></div></div><div class="drag-hint">DRAG TO ORBIT <span>·</span> SCROLL TO ZOOM</div><div class="map-labels" hidden><span>EARTH</span><span>MOON</span></div><div class="mission-status"><span class="status-dot amber"></span><span id="engine-state">5 × F-1</span><span class="status-separator">/</span><span id="power-state">CMC ONLINE</span></div></div>
<div class="metrics"><div><span class="tiny-label">GROUND ELAPSED TIME</span><strong id="get">000:00:00</strong></div><div><span class="tiny-label" id="distance-label">MODEL ALTITUDE</span><strong id="distance">0 <small>km</small></strong></div><div><span class="tiny-label">MODEL SPEED</span><strong id="speed">0.00 <small>km/s</small></strong></div><button id="vectors" class="vector-button selected" aria-pressed="true"><span>↗</span> Thrust vector</button></div>
<div class="story"><div class="story-index" id="story-index">01</div><div><p id="story-summary"></p><p class="story-note" id="story-note"></p></div></div>
</section>
<aside class="inspector" aria-label="Guidance source explorer"><div class="inspector-tabs" role="tablist" aria-label="Computer panels"><button role="tab" aria-selected="true" aria-controls="mapping-panel" id="mapping-tab">Source map</button><button role="tab" aria-selected="false" aria-controls="lab-panel" id="lab-tab">Live AGC <span class="live-dot"></span></button><button role="tab" aria-selected="false" aria-controls="files-panel" id="files-tab">Files</button></div>
<section id="mapping-panel" class="inspector-body" role="tabpanel" aria-labelledby="mapping-tab"><div class="panel-overline"><span class="tiny-label">GUIDANCE RESPONSIBILITY</span><span class="badge">MODELED FLIGHT</span></div><h2 id="authority"></h2><div class="routine-list" id="routine-list"></div><div class="routine-description"><div class="routine-topline"><span id="routine-computer" class="tiny-label"></span><span class="reconstruction">RECONSTRUCTED SOURCE</span></div><h3 id="routine-title"></h3><div class="signal-chain"><div><span>01 · INPUT</span><p id="routine-input"></p></div><i>↓</i><div><span>02 · COMPUTATION / ACTION</span><p id="routine-operation"></p></div><i>↓</i><div class="signal-output"><span>03 · OUTPUT</span><p id="routine-output"></p></div></div><p class="effect" id="routine-effect"></p></div><div class="source-heading"><span id="source-path"></span><a id="source-link" target="_blank" rel="noopener">Original lines ↗</a></div><div class="code-window" id="mapped-code" tabindex="0" aria-label="Original source code excerpt"></div><div class="mapping-footer"><span>RELATED SOURCE · NOT A LIVE MISSION TRACE</span><button id="next-routine">Next code segment →</button></div></section>
<section id="lab-panel" class="inspector-body" role="tabpanel" aria-labelledby="lab-tab" hidden><div class="panel-overline"><span class="tiny-label">AUTHENTIC CPU EXECUTION</span><span class="badge cyan">yaAGC / WASM</span></div><h2>The computer is running real code.</h2><p class="panel-copy">A separate cold-start laboratory. The actual yaAGC engine executes reconstructed Apollo 13 rope memory. It does not fly the 3D mission.</p><label class="select-label" for="lab-program">ROPE IMAGE</label><select id="lab-program"><option value="Manche72R3">Odyssey · MANCHE72 rev 3</option><option value="LM131R1">Aquarius · LM131 rev 1</option></select><p id="lab-status" class="lab-status" role="status">Open this panel to load the computer.</p><div class="cpu-registers" aria-label="Actual CPU registers"><div><span>A</span><b id="reg-a">00000</b></div><div><span>L</span><b id="reg-l">00000</b></div><div><span>Q</span><b id="reg-q">00000</b></div><div><span>Z / PC</span><b id="reg-z">04000</b></div><div><span>FB</span><b id="reg-fb">00000</b></div><div><span>CYCLES</span><b id="reg-cycles">0</b></div></div><div class="lab-buttons"><button id="lab-run" disabled>► Run CPU</button><button id="lab-step" disabled>1 cycle</button><button id="lab-batch" disabled>+10 ms</button><button id="lab-reset" aria-label="Reset CPU" disabled>↺</button></div><div class="lab-secondary"><button id="lab-lamp" disabled>Send lamp-test keys · V35E</button><span id="cpu-time">0.000 s CPU time</span></div><div class="pc-heading"><span>PROGRAM COUNTER SAMPLE</span><b id="pc-address">02,2000</b></div><a id="pc-source" target="_blank" rel="noopener"></a><div class="code-window live-code" id="live-code" tabindex="0" aria-label="Source near actual CPU program counter"></div><div class="output-heading">REAL I/O CHANNEL WRITES <span>OCTAL</span></div><div id="io-log" class="io-log">No output yet. Step or run the CPU.</div><p class="lab-caution">Synthetic peripheral defaults, no flight pad load and no reconstructed sensor stream. Power-on alarms are expected. The PC is sampled, so this is not a complete instruction trace. I/O timestamps identify the end of a drain batch (at most 128 cycles), not the exact write cycle. All register and I/O values above come from the emulator.</p></section>
<section id="files-panel" class="inspector-body" role="tabpanel" aria-labelledby="files-tab" hidden><div class="panel-overline"><span class="tiny-label">COMPLETE FLIGHT-SOFTWARE SOURCE</span><span class="badge">PINNED COMMIT</span></div><h2>Read the original routines.</h2><p class="panel-copy">Browse all source files in both reconstructed flown revisions. Source line numbers and links refer to the pinned Virtual AGC commit.</p><label class="select-label" for="file-program">COMPUTER</label><select id="file-program"><option value="Manche72R3">Odyssey · MANCHE72 rev 3</option><option value="LM131R1">Aquarius · LM131 rev 1</option></select><label class="select-label" for="file-search">FILTER FILES</label><input id="file-search" placeholder="Try P40, SERVICER, RESTART…" type="search"><label class="select-label" for="file-select">SOURCE FILE</label><select id="file-select"><option>Loading…</option></select><div class="file-meta"><span id="file-count"></span><a id="file-source" target="_blank" rel="noopener">Open on GitHub ↗</a></div><div class="code-window full-code" id="file-code" tabindex="0" aria-label="Complete selected source file"></div></section>
</aside></main>
<section class="timeline-panel" aria-label="Mission timeline"><div class="transport"><div class="transport-buttons"><button id="reset" aria-label="Reset mission" title="Reset mission">↺</button><button id="previous" aria-label="Previous chapter">‹</button><button id="play" class="play-button" aria-label="Play mission">►</button><button id="next" aria-label="Next chapter">›</button></div><div class="playback-select"><label for="playback">PLAYBACK</label><select id="playback"><option value="tour">Guided tour</option><option value="1">Real time · 1×</option><option value="10">10×</option><option value="100">100×</option><option value="1000">1,000×</option></select></div><div class="timeline-description"><span class="tiny-label">THE ACTUAL APOLLO 13 MISSION</span><p>Outward bound. A different way home.</p></div><div class="jump"><label for="jump-time">JUMP TO GET</label><input id="jump-time" value="000:00:00" aria-label="Jump to mission time in hours minutes seconds" maxlength="9"><button id="jump-go" aria-label="Go to mission time">→</button></div></div><div class="timeline-track"><input id="timeline" type="range" min="0" max="10000" step="1" value="0" aria-label="Mission timeline, coasts compressed"><div id="chapter-ticks" class="chapter-ticks"></div></div><div class="timeline-labels"><button data-jump="0">LAUNCH</button><button data-jump="4">EARTH ORBIT</button><button data-jump="7">TRANSLUNAR</button><button data-jump="9" class="abort-label">THE ACCIDENT</button><button data-jump="12">AROUND THE MOON</button><button data-jump="15">RETURN</button><button data-jump="19">REENTRY</button><button data-jump="21">HOME</button></div><div class="timeline-foot"><span>STORY-SCALE TIMELINE · LONG COASTS COMPRESSED</span><span>SPACE: PLAY / PAUSE <span class="kbd-separator">·</span> ← →: CHAPTER</span><span id="mission-end">142:54:41 TOTAL</span></div></section>
<footer class="bottom-bar"><span>BUILT ON VIRTUAL AGC <span>·</span> LM131R1 + MANCHE72R3</span><span>MODELED MOTION. TRACEABLE SOURCE. REAL CPU.</span><a href="https://github.com/magen-hub-alt/virtualagc" target="_blank" rel="noopener">Project fork ↗</a></footer>
<dialog id="about-dialog"><div class="dialog-top"><span class="eyebrow">THE EVIDENCE BEHIND THE EXPERIENCE</span><button id="about-close" aria-label="Close sources and fidelity">×</button></div><h2>A real mission.<br>A carefully labeled model.</h2><p class="dialog-intro">Apollo 13 did not land on the Moon. This lab follows the mission that actually happened, while separating historical events, source-level explanation and live computer execution.</p><div class="fidelity-grid"><div><span class="badge">HISTORICAL</span><h3>Mission events</h3><p>Launch, the accident, rescue maneuvers and return follow published mission records. Major event times are rounded to seconds; docking, activation, staging and parachute chapters use explanatory boundaries.</p></div><div><span class="badge amber-badge">MODELED</span><h3>Spacecraft & motion</h3><p>Procedural Saturn V, CSM and LM geometry uses recognizable architecture and approximate proportions. Flight dynamics, state readouts, plume behavior, entry plasma and module drift are illustrative. The route map is schematic and enlarges the planets.</p></div><div><span class="badge cyan">EXECUTED</span><h3>Live AGC laboratory</h3><p>The unmodified yaAGC CPU engine is compiled to WebAssembly. It runs assembled rope images, exposes actual registers and I/O, and maps sampled memory addresses to source. It has no Apollo 13 pad load, sensor replay or closed-loop link to the mission renderer.</p></div></div><h3>Which software actually flew?</h3><p><b>Aquarius: LM131 revision 1.</b> Reconstructed from the Luminary 131 listing and the changed B5 rope module. The assembled 36,864 data words in this build match the upstream composite dump, excluding parity bits.</p><p><b>Odyssey: MANCHE72 revision 3.</b> Reconstructed from Comanche 072 and approved changes. Bank checksums match the repository’s reference set; upstream documents two instruction-order ambiguities inherited from Comanche 072. Neither plain Luminary 131 nor Comanche 072 is presented as the flown revision.</p><p>Source mappings explain a routine’s role and hardware effects. They do not assert that a particular line executed at a particular mission second. Saturn used its own LVDC, manual corrections involved the crew, and parachutes used the Earth landing system.</p><div class="source-links"><a target="_blank" rel="noopener" href="https://www.ibiblio.org/apollo/Luminary.html">LM source provenance ↗</a><a target="_blank" rel="noopener" href="https://www.ibiblio.org/apollo/Colossus.html">CM source provenance ↗</a><a target="_blank" rel="noopener" href="https://ntrs.nasa.gov/api/citations/19710015677/downloads/19710015677.pdf">NASA/JPL chronology, Table 31 ↗</a><a target="_blank" rel="noopener" href="https://www.nasa.gov/history/detailed-chronology-of-events-surrounding-the-apollo-13-accident/">NASA accident chronology ↗</a><a target="_blank" rel="noopener" href="https://www.nasa.gov/missions/apollo/apollo-13-mission-details/">NASA mission details ↗</a><a target="_blank" rel="noopener" href="https://www.apollojournals.org/afj/ap13fj/index.html">Apollo 13 Flight Journal ↗</a><a target="_blank" rel="noopener" href="https://github.com/virtualagc/virtualagc/tree/${provenance.commit}">Pinned Virtual AGC source ↗</a></div><p class="license-note">AGC source: public-domain notices in the original files. yaAGC and this application: GPL-2.0-or-later. Three.js: MIT. Earth coastlines: Natural Earth, public domain. Moon surface is procedural. Upstream commit <span>${provenance.commit}</span>.</p></dialog><div id="toast" role="status"></div>`;
let time = 0,
  playing = false,
  playback = "tour",
  selectedRoutine = 0,
  lastChapter = -1,
  activePanel = "mapping",
  scene,
  lab = null,
  labRunning = false,
  labBusy = false,
  labGeneration = 0,
  labIndex = null,
  fileIndex = null,
  lastFrame = performance.now(),
  lastDOM = 0;
const indexCache = new Map();
const asset = (name) => assetURL(`agc/${name}`);
async function getIndex(program) {
  if (!indexCache.has(program))
    indexCache.set(
      program,
      fetch(asset(`${program}-source.json`))
        .then((r) => {
          if (!r.ok) throw Error("Source index could not be loaded.");
          return r.json();
        })
        .catch((e) => {
          indexCache.delete(program);
          throw e;
        }),
    );
  return indexCache.get(program);
}
const srcURL = (program, file, line) =>
  `https://github.com/virtualagc/virtualagc/blob/${provenance.commit}/${program}/${file}${line ? "#L" + line : ""}`;
function codeRows(lines, start = 1, highlight = 0) {
  return lines
    .map((line, i) => {
      const n = start + i,
        comment = line.indexOf("#");
      const code = comment >= 0 ? line.slice(0, comment) : line,
        note = comment >= 0 ? line.slice(comment) : "";
      return `<div class="code-line ${n === highlight ? "active-line" : ""}"><span class="line-number">${n}</span><code>${esc(code)}<span class="code-comment">${esc(note)}</span></code></div>`;
    })
    .join("");
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("visible"), 3000);
}
function renderRoutine() {
  const state = missionState(time),
    ids = state.chapter.routines;
  selectedRoutine = Math.min(selectedRoutine, ids.length - 1);
  const r = routines.find((r) => r.id === ids[selectedRoutine]);
  $("#routine-list").innerHTML = ids
    .map(
      (id, i) =>
        `<button class="${i === selectedRoutine ? "selected" : ""}" data-routine="${i}" aria-pressed="${i === selectedRoutine}">${String(i + 1).padStart(2, "0")} <span>${esc(routines.find((r) => r.id === id).title.split(" · ")[0])}</span></button>`,
    )
    .join("");
  $("#routine-title").textContent = r.title;
  $("#routine-computer").textContent = r.program;
  $("#routine-input").textContent = r.input;
  $("#routine-operation").textContent = r.operation;
  $("#routine-output").textContent = r.output;
  $("#routine-effect").textContent = r.effect;
  $(".reconstruction").textContent =
    r.kind === "related"
      ? "RECONSTRUCTED SOURCE"
      : r.kind.toUpperCase() + " ACTION";
  $("#source-path").textContent = r.path
    ? r.path.split("/").at(-1)
    : "NO AGC SOURCE CLAIM";
  $("#source-link").hidden = !r.path;
  if (r.url) $("#source-link").href = r.url;
  $("#mapped-code").innerHTML = r.path
    ? codeRows(r.code, r.start)
    : `<div class="no-source"><span>○</span><p>This event belongs to ${r.kind === "manual" ? "crew operations" : "physical hardware"}.</p><small>No fabricated computer routine is attached to it.</small></div>`;
  $("#mapped-code").scrollTop = 0;
  scene?.setFocus(r.id);
}
function renderState(force = false) {
  const s = missionState(time);
  $("#get").textContent = formatGET(time);
  $("#timeline").value = Math.round(timeToProgress(time) * 10000);
  $("#timeline").style.setProperty(
    "--progress",
    timeToProgress(time) * 100 + "%",
  );
  $("#distance-label").textContent =
    s.altitude > 2000 ? "MODEL EARTH DISTANCE" : "MODEL ALTITUDE";
  const d = s.altitude > 2000 ? s.earthDistance : s.altitude;
  $("#distance").innerHTML =
    `${d.toLocaleString("en-US", { maximumFractionDigits: d < 10 ? 1 : 0 })} <small>km</small>`;
  $("#speed").innerHTML = `${s.speed.toFixed(2)} <small>km/s</small>`;
  $("#engine-state").textContent = s.throttle
    ? s.engine + " · " + Math.round(s.throttle * 100) + "%"
    : "COAST / " + (s.parachutes ? "RECOVERY" : "ENGINE OFF");
  $("#power-state").textContent =
    s.lmPower && !s.cmPower
      ? "LGC ONLINE · CMC OFF"
      : s.lmPower
        ? "LGC + CMC"
        : "CMC";
  $("#play").textContent = playing ? icons.pause : icons.play;
  $("#play").setAttribute(
    "aria-label",
    playing ? "Pause mission" : "Play mission",
  );
  $("#previous").disabled = s.index === 0;
  $("#next").disabled = s.index === CHAPTERS.length - 1;
  $("#viewport").dataset.atmosphere = s.time < 120 ? "true" : "false";
  if (document.activeElement !== $("#jump-time"))
    $("#jump-time").value = formatGET(time);
  if (force || lastChapter !== s.index) {
    lastChapter = s.index;
    selectedRoutine = 0;
    $("#section-label").textContent = s.chapter.section;
    $("#chapter-count").textContent =
      String(s.index + 1).padStart(2, "0") + " — " + CHAPTERS.length;
    $("#phase-title").textContent = s.chapter.title;
    $("#story-index").textContent = String(s.index + 1).padStart(2, "0");
    $("#story-summary").textContent = s.chapter.summary;
    $("#story-note").textContent = s.chapter.note;
    $("#authority").textContent = s.authority;
    document.querySelectorAll("[data-chapter]").forEach((b) => {
      b.classList.toggle("active", Number(b.dataset.chapter) === s.index);
      b.setAttribute(
        "aria-current",
        Number(b.dataset.chapter) === s.index ? "step" : "false",
      );
    });
    renderRoutine();
  }
}
function seek(t, pause = true) {
  $("#jump-time").removeAttribute("aria-invalid");
  time = Math.max(0, Math.min(END_TIME, t));
  if (pause) playing = false;
  renderState();
}
$("#chapter-ticks").innerHTML = CHAPTERS.map(
  (c, i) =>
    `<button data-chapter="${i}" style="left:${(i / (CHAPTERS.length - 1)) * 100}%" title="${esc(c.label)} · ${formatGET(c.start)}" aria-label="${esc(c.label)}, ${formatGET(c.start)}"><span></span></button>`,
).join("");
scene = new FlightScene($("#viewport"), (e) => {
  $("#scene-error").hidden = false;
  $("#scene-error").textContent =
    "3D view unavailable: " +
    e.message +
    " The timeline and source explorer still work.";
});
$("#routine-list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-routine]");
  if (b) {
    selectedRoutine = Number(b.dataset.routine);
    renderRoutine();
  }
});
$("#next-routine").onclick = () => {
  selectedRoutine =
    (selectedRoutine + 1) % missionState(time).chapter.routines.length;
  renderRoutine();
};
$("#play").onclick = () => {
  if (time >= END_TIME) seek(0);
  playing = !playing;
  renderState();
};
$("#reset").onclick = () => {
  seek(0);
  scene.home();
};
$("#previous").onclick = () =>
  seek(CHAPTERS[Math.max(0, missionState(time).index - 1)].start);
$("#next").onclick = () =>
  seek(
    CHAPTERS[Math.min(CHAPTERS.length - 1, missionState(time).index + 1)].start,
  );
$("#timeline").addEventListener("input", (e) =>
  seek(progressToTime(Number(e.target.value) / 10000)),
);
$("#playback").onchange = (e) => {
  playback = e.target.value;
};
function jump() {
  const t = parseGET($("#jump-time").value);
  if (t === null) {
    $("#jump-time").setAttribute("aria-invalid", "true");
    toast("Use hours:minutes:seconds, for example 079:27:39.");
    return;
  }
  $("#jump-time").removeAttribute("aria-invalid");
  seek(t);
}
$("#jump-go").onclick = jump;
$("#jump-time").addEventListener("keydown", (e) => {
  if (e.key === "Enter") jump();
});
$("#chapter-ticks").onclick = (e) => {
  const b = e.target.closest("[data-chapter]");
  if (b) seek(CHAPTERS[Number(b.dataset.chapter)].start);
};
document
  .querySelectorAll("[data-jump]")
  .forEach(
    (b) => (b.onclick = () => seek(CHAPTERS[Number(b.dataset.jump)].start)),
  );
function setView(view) {
  scene.setView(view);
  $("#flight-view").classList.toggle("selected", view === "flight");
  $("#map-view").classList.toggle("selected", view === "map");
  $("#flight-view").setAttribute("aria-pressed", view === "flight");
  $("#map-view").setAttribute("aria-pressed", view === "map");
  $(".map-labels").hidden = view !== "map";
  $("#scene-scale").textContent =
    view === "map"
      ? "SCHEMATIC PATH · BODIES ENLARGED · NOT AN EPHEMERIS"
      : "ILLUSTRATIVE 3D · APPROXIMATE GEOMETRY";
}
$("#flight-view").onclick = () => setView("flight");
$("#map-view").onclick = () => setView("map");
$("#camera-home").onclick = () => scene.home();
$("#zoom-in").onclick = () => scene.zoom(0.8);
$("#zoom-out").onclick = () => scene.zoom(1.25);
$("#rotate-view").onclick = (e) => {
  scene.autoRotate = !scene.autoRotate;
  e.currentTarget.setAttribute("aria-pressed", scene.autoRotate);
  e.currentTarget.classList.toggle("selected", scene.autoRotate);
};
$("#vectors").onclick = (e) => {
  scene.showVectors = !scene.showVectors;
  e.currentTarget.setAttribute("aria-pressed", scene.showVectors);
  e.currentTarget.classList.toggle("selected", scene.showVectors);
};
function openAbout() {
  playing = false;
  labRunning = false;
  if (lab) renderCPU();
  $("#about-dialog").showModal();
  renderState();
}
$("#about-open").onclick = openAbout;
$("#about-close").onclick = () => $("#about-dialog").close();
$("#about-dialog").addEventListener("click", (e) => {
  if (e.target === $("#about-dialog")) {
    const r = e.target.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      e.target.close();
  }
});
async function switchPanel(panel) {
  activePanel = panel;
  for (const name of ["mapping", "lab", "files"]) {
    $(`#${name}-panel`).hidden = name !== panel;
    $(`#${name}-tab`).setAttribute("aria-selected", name === panel);
  }
  if (panel !== "lab") {
    labRunning = false;
    if (lab) renderCPU();
  }
  if (panel === "lab" && !lab && !labBusy) await loadLab();
  if (panel === "files" && !fileIndex) await loadFiles();
}
for (const panel of ["mapping", "lab", "files"])
  $(`#${panel}-tab`).onclick = () => switchPanel(panel);
$(".inspector-tabs").addEventListener("keydown", (e) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
  e.preventDefault();
  const names = ["mapping", "lab", "files"];
  let i = names.indexOf(activePanel);
  i =
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? 2
        : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
  switchPanel(names[i]);
  $(`#${names[i]}-tab`).focus();
});
async function loadLab() {
  const generation = ++labGeneration,
    program = $("#lab-program").value;
  labRunning = false;
  labBusy = true;
  lab = null;
  $("#lab-status").textContent = "Loading the assembled rope…";
  document
    .querySelectorAll(".lab-buttons button,#lab-lamp")
    .forEach((b) => (b.disabled = true));
  try {
    const [wasm, rope, index] = await Promise.all([
      fetch(asset("yaAGC.wasm")).then((r) => {
        if (!r.ok) throw Error("CPU file failed to load");
        return r.arrayBuffer();
      }),
      fetch(asset(`${program}.bin`)).then((r) => {
        if (!r.ok) throw Error("Rope image failed to load");
        return r.arrayBuffer();
      }),
      getIndex(program),
    ]);
    if (generation !== labGeneration) return;
    const nextLab = await createAGC(
      wasm,
      new Uint8Array(rope),
      program === "LM131R1",
    );
    if (generation !== labGeneration) return;
    lab = nextLab;
    labIndex = index;
    $("#lab-status").textContent =
      `${program} loaded · 36,864 rope words · cold start`;
    document
      .querySelectorAll(".lab-buttons button,#lab-lamp")
      .forEach((b) => (b.disabled = false));
    renderCPU();
  } catch (e) {
    if (generation === labGeneration)
      $("#lab-status").textContent = "Could not load CPU: " + e.message;
  } finally {
    if (generation === labGeneration) labBusy = false;
  }
}
function renderCPU() {
  if (!lab) return;
  const s = lab.snapshot();
  for (const key of ["a", "l", "q", "z", "fb"])
    $("#reg-" + key).textContent = oct(s[key], key === "z" ? 4 : 5);
  $("#reg-cycles").textContent = s.cycles.toLocaleString();
  $("#cpu-time").textContent =
    (s.cycles / CYCLES_PER_SECOND).toFixed(3) + " s CPU time";
  $("#pc-address").textContent = s.address ?? "ERASABLE";
  $("#lab-run").textContent = labRunning ? "Ⅱ Pause CPU" : "► Run CPU";
  const entry = labIndex.addresses[s.address];
  if (entry) {
    const [file, line] = entry;
    $("#pc-source").textContent = file + ":" + line;
    $("#pc-source").href = srcURL(labIndex.program, file, line);
    const start = Math.max(1, line - 4);
    $("#live-code").innerHTML = codeRows(
      labIndex.files[file].slice(start - 1, line + 7),
      start,
      line,
    );
  } else {
    $("#pc-source").textContent = "Address has no mapped source line";
    $("#pc-source").removeAttribute("href");
    $("#live-code").innerHTML =
      '<p class="empty-note">The PC currently points to erasable memory or an unmapped word.</p>';
  }
  const outputs = lab.outputs().slice(-8).reverse();
  $("#io-log").innerHTML = outputs.length
    ? outputs
        .map(
          (o) =>
            `<div><span>CH ${oct(o.channel, 3)}</span><b>${oct(o.value)}</b><small>SAMPLE ${o.cycle.toLocaleString()}</small></div>`,
        )
        .join("")
    : "No output yet. Step or run the CPU.";
}
$("#lab-program").onchange = loadLab;
$("#lab-run").onclick = () => {
  if (lab) {
    labRunning = !labRunning;
    renderCPU();
  }
};
$("#lab-step").onclick = () => {
  labRunning = false;
  lab?.step(1);
  renderCPU();
};
$("#lab-batch").onclick = () => {
  labRunning = false;
  lab?.step(853);
  renderCPU();
};
$("#lab-reset").onclick = async () => {
  labRunning = false;
  await lab?.reset();
  renderCPU();
};
$("#lab-lamp").onclick = () => {
  if (!lab) return;
  labRunning = false;
  lab.lampTest();
  renderCPU();
  toast("Advanced through startup, then sent V35 Enter to the emulated DSKY.");
};
async function loadFiles() {
  const program = $("#file-program").value;
  $("#file-count").textContent = "Loading source…";
  try {
    const index = await getIndex(program);
    if ($("#file-program").value !== program) return;
    fileIndex = index;
    renderFileOptions();
  } catch (e) {
    $("#file-count").textContent = e.message;
  }
}
function renderFileOptions() {
  if (!fileIndex) return;
  const q = $("#file-search").value.toLowerCase();
  const files = Object.keys(fileIndex.files).filter((f) =>
    f.toLowerCase().includes(q),
  );
  $("#file-select").innerHTML = files
    .map((f) => `<option>${esc(f)}</option>`)
    .join("");
  $("#file-count").textContent = `${files.length} files · ${fileIndex.program}`;
  if (!files.length) {
    $("#file-code").innerHTML =
      '<p class="empty-note">No files match this filter.</p>';
    $("#file-source").hidden = true;
    return;
  }
  if (!q && files.includes("MAIN.agc")) $("#file-select").value = "MAIN.agc";
  renderFile();
}
function renderFile() {
  const file = $("#file-select").value,
    lines = fileIndex?.files[file];
  if (!lines) return;
  $("#file-code").innerHTML = codeRows(lines);
  $("#file-code").scrollTop = 0;
  $("#file-source").hidden = false;
  $("#file-source").href = srcURL(fileIndex.program, file);
}
$("#file-program").onchange = loadFiles;
$("#file-search").oninput = renderFileOptions;
$("#file-select").onchange = renderFile;
document.addEventListener("keydown", (e) => {
  if (
    $("#about-dialog").open ||
    ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(e.target.tagName) ||
    e.target.closest(".inspector-tabs")
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    $("#play").click();
  }
  if (e.code === "ArrowLeft") {
    e.preventDefault();
    $("#previous").click();
  }
  if (e.code === "ArrowRight") {
    e.preventDefault();
    $("#next").click();
  }
});
$(".brand").onclick = (e) => {
  e.preventDefault();
  seek(0);
  scene.home();
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    playing = false;
    labRunning = false;
    renderState();
    if (lab) renderCPU();
  }
});
function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  if (playing) {
    time = advanceTime(
      time,
      dt,
      playback === "tour" ? 1 : Number(playback),
      playback === "tour" ? "tour" : "realtime",
    );
    if (time >= END_TIME) playing = false;
  }
  scene?.update(missionState(time), now / 1000);
  if (labRunning && lab && activePanel === "lab") {
    lab.step(Math.round(dt * CYCLES_PER_SECOND));
  }
  if (now - lastDOM > 90) {
    renderState();
    if (activePanel === "lab" && labRunning) renderCPU();
    lastDOM = now;
  }
  requestAnimationFrame(frame);
}
renderState(true);
requestAnimationFrame(frame);
