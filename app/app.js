// app.js — NeuroLocaliser prototype UI. Pure consumer of the engine + causes layer (no model changes).
import { solve, candidateSites, raisedPressureAxis } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { FINDINGS, NON_LATERALISED } from "../src/model/findings.js";
import { nameForSite } from "../src/data/syndromes.js";
import { causesFor, combinedCauses, canonicalKey, CAUSES, CATEGORIES, TEMPO } from "../src/data/causes.js";
import { umnLmnPattern, functionalFlag, refractiveFlag } from "../src/engine/patterns.js";
import { nextStepsFor, combinedNextSteps, pathologyNextStepsFor } from "../src/data/nextSteps.js";
import { tractsFor, tractNarrative, whyNotOthers } from "../src/engine/tracts.js";
import { COURSES } from "../src/model/course.js";
import { prevalenceOf } from "../src/model/prevalence.js";
import { neuraxisSVG } from "./neuraxis-diagram.js";
import { EXAM_TREE, flattenFindings } from "./exam-map.js";
import { checkPassphrase, GATE_STORAGE_KEY } from "./gate.js";
import { encodeCase, decodeCase } from "./case-url.js";
import { feedbackHref } from "./feedback.js";
import { recordOpen } from "./usage.js";
import { renderCodeStroke, stopStrokeClock } from "./code-stroke.js";
import { combinedSites } from "./combined-sites.js";
import { unifyingDiagnoses, forcingFindings } from "../src/engine/multifocal.js";
import { MULTIFOCAL } from "../src/data/multifocal.js";
import { togetherGuardState } from "./together-guard.js";
import { plainSiteName, shortFindingLabel } from "./labels.js";
import { VERSION, markSVG, faviconDataURI } from "./brand.js";
import { EXAMPLES, CROSS_SITE_EXAMPLES } from "./examples.js";

// ---- all candidate sites (one enumeration, owned by the engine) ----
const CANDIDATES = candidateSites();
// which body-sides can each finding appear on? (data-driven side controls)
const SIDES = {};
for (const site of CANDIDATES) {
  let exp; try { exp = expectedFindings(site); } catch { continue; }
  for (const tok of exp) { const [f, s] = tok.split("@"); (SIDES[f] ??= new Set()).add(s); }
}
const sidesOf = f => [...(SIDES[f] || ["none"])];

// dedupe sites by level_part for the atlas (one representative per site kind)
const ATLAS = [];
{ const seen = new Set();
  for (const s of CANDIDATES) { const k = `${s.level}_${s.part}`; if (seen.has(k)) continue; seen.add(k); ATLAS.push(s); } }
const REGION_ORDER = ["cortex","subcortex","corpus_callosum","thalamus","hypothalamus","basal_ganglia","aphasia_subcortical",
  "midbrain","dorsal_midbrain","pons","pontomesencephalic","medulla","brainstem_aras","guillain_mollaret","locked_in",
  "cerebellum","cerebrum","thalamus_arousal","pseudobulbar","cord","combined_degeneration","cauda","conus","craniocervical_junction",
  "olfactory","visual_pathway","skull_base","peripheral_vestibular","central_vestibular","pupil","sympathetic",
  "motor_unit","root","plexus","nerve","polyneuropathy"];

const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const fid = t => t.split("@")[0];
const sideTag = s => s === "left" ? "L" : s === "right" ? "R" : s === "midline" ? "M" : s === "bilateral" ? "B" : "•";
const desc = f => (FINDINGS[f] && FINDINGS[f].desc) || f;

const S = { mode:"localise", tokens:new Set(), dominant:"left", onset:"", course:"", sensoryLevel:"", distalReach:"", atlas:null, pinned:new Set(), selectedPathology:undefined, selectedEntity:undefined, scope:"site",
  stroke:{ age:"", lkw:"", mrs:"", sbp:"", dbp:"", glucose:"", affectedSide:"", nihss:{}, thrombolysisTicks:new Set(), thrombectomyTicks:new Set() } };
const app = document.getElementById("app");

// ---- shareable case URLs: hydrate S from the URL hash on boot, keep the hash live on every change ----
const VALID_FINDINGS = new Set(Object.keys(FINDINGS));
const VALID_SITES = new Set(CANDIDATES.map(s => s.id));
// Every cause name in the app — a hand-edited px= token that names no real pathology is dropped on
// decode, exactly as an unknown finding or site id is.
const VALID_PATHOLOGIES = new Set(Object.keys(CAUSES).flatMap(k => CAUSES[k].map(c => c.name)));
// Every cross-site entity in the roster — a hand-edited ux= token that names no real entity is dropped on
// decode, exactly as px= is.
const VALID_ENTITIES = new Set(MULTIFOCAL.map(e => e.name));

function restoreFromURL() {
  const st = decodeCase(location.hash, { validFindings: VALID_FINDINGS, validSites: VALID_SITES, validPathologies: VALID_PATHOLOGIES, validEntities: VALID_ENTITIES });
  if (st.tokens) S.tokens = st.tokens;
  if (st.onset) S.onset = st.onset;
  if (st.course) S.course = st.course;
  if (st.mode) S.mode = st.mode;
  if (st.selected) S.selected = st.selected;
  if (st.selectedPathology) S.selectedPathology = st.selectedPathology;
  if (st.selectedEntity) S.selectedEntity = st.selectedEntity;
  if (st.scope) S.scope = st.scope;
  if (st.dominant) S.dominant = st.dominant;
  if (st.sensoryLevel) S.sensoryLevel = st.sensoryLevel;
  if (st.distalReach) S.distalReach = st.distalReach;
  if (st.pinned) S.pinned = st.pinned;
}

function syncURL() {
  const hash = encodeCase(S);
  history.replaceState(null, "", hash ? "#" + hash : location.pathname + location.search);
}

// ================= LOCALISE =================
// The sensory-level and distal-reach inputs annotate a cord / length-dependent picture and mean nothing
// otherwise, so they only mount once such a finding is present. Onset, course and dominant hemisphere moved
// into the card they act on (What / Together / the header) — see the 2026-08-16 UI-clarity spec.
// Deliberately NOT weak_arm / weak_leg: limb weakness is the commonest finding in the app and is usually
// cortical, so triggering on it put these inputs on screen for almost every case — the noise this pass
// exists to remove. A sensory level or a length-dependent picture is what makes them mean anything.
const CORD_AXIS_FINDINGS = new Set(["spinothalamic","dorsal_column","sensory_level","sensory_ataxia",
  "sphincter_dysfunction","saddle_anaesthesia","glove_stocking","distal_sensory_loss"]);

function renderLocalise() {
  const hasCord = [...S.tokens].some(t => CORD_AXIS_FINDINGS.has(fid(t)));
  app.innerHTML = `
  <div class="grid">
    <div class="pane">
      <h3>Examination findings</h3>
      <input class="search" id="search" placeholder="Search findings… (e.g. Horner, ataxia, gaze)">
      <div class="chips" id="chips"></div>
      <div class="ctrls ctrls-inline" id="levelctrls"${hasCord ? "" : " hidden"}>
        <label>Sensory level <input type="text" id="slevel" placeholder="e.g. T10" size="6"></label>
        <label>Distal reach <input type="text" id="reach" placeholder="e.g. knees" size="7"></label>
      </div>
      <div class="accordion" id="acc">${examAccordion()}</div>
    </div>
    <div class="pane" id="results"></div>
  </div>`;
  const sl = document.getElementById("slevel"); if (sl) sl.value = S.sensoryLevel;
  const dr = document.getElementById("reach"); if (dr) dr.value = S.distalReach;
  wireLocalise();
  renderChips(); renderResults();
}

function countFindings(node) {
  if (node.findings) return node.findings.filter(f => FINDINGS[f]).length;
  return (node.groups || []).reduce((n, g) => n + countFindings(g), 0);
}
function renderNode(node, depth) {
  const cnt = countFindings(node);
  if (node.findings) {
    const rows = node.findings.filter(f => FINDINGS[f]).map(f => frow(f)).join("");
    return `<details data-step="${esc(node.id)}" class="nx-lvl nx-lvl${depth}"><summary>${esc(node.label)}<span class="c">${cnt}</span></summary>${rows}</details>`;
  }
  const kids = (node.groups || []).map(g => renderNode(g, depth + 1)).join("");
  return `<details data-gid="${esc(node.id)}" class="nx-lvl nx-lvl${depth}"><summary>${esc(node.label)}<span class="c">${cnt}</span></summary><div class="nx-children">${kids}</div></details>`;
}
function examAccordion() {
  const used = new Set(flattenFindings(EXAM_TREE));
  const other = Object.keys(FINDINGS).filter(f => !used.has(f));
  const tree = other.length ? [...EXAM_TREE, { id: "other", label: "Other findings", findings: other }] : EXAM_TREE;
  return tree.map(n => renderNode(n, 0)).join("");
}
function frow(f) {
  const sides = sidesOf(f);
  const btns = (NON_LATERALISED.has(f) || (sides.length===1 && sides[0]==="none"))
    ? `<button data-f="${f}" data-s="none">add</button>`
    : sides.filter(s=>s!=="none").map(s=>`<button data-f="${f}" data-s="${s}">${sideTag(s)}</button>`).join("");
  // The id stays in the title attribute — reachable for a bug report, off the screen for a clinician.
  return `<div class="frow" data-fid="${f}" title="${esc(f)} — ${esc(desc(f))}"><div class="nm"><span class="fd-primary">${esc(desc(f))}</span></div><div class="sides">${btns}</div></div>`;
}

function wireLocalise() {
  // Controls now live in the cards they act on, so each may be absent on any given render. Every handler is
  // bound defensively; S remains the single source of truth either way, and the case URL still serialises a
  // value whose control is not currently mounted (guarded in test/app-smoke.test.js).
  const on = (id, ev, fn) => { const el = document.getElementById(id); if (el) el[ev] = fn; };
  on("slevel", "oninput", e => { S.sensoryLevel = e.target.value.trim(); renderResults(); });
  on("reach", "oninput", e => { S.distalReach = e.target.value.trim(); renderResults(); });
  on("search", "oninput", e => filterFindings(e.target.value.toLowerCase()));
  on("acc", "onclick", e => { const b = e.target.closest("button[data-f]"); if (!b) return;
    toggleToken(`${b.dataset.f}@${b.dataset.s}`); });
  markSides();
}

// The section nav and the urgency pill are in-page jumps, and THE URL HASH IS THE SHAREABLE CASE — letting
// the browser follow `href="#sec-next"` natively overwrites the whole case with "#sec-next", so anyone who
// clicked the nav before copying the link would share a case with no findings in it. Scroll manually and
// keep the hash. (Found by clicking it; no unit test can see this.)
function wireJumpLinks(root) {
  root.querySelectorAll('a[href^="#sec-"]').forEach(a => {
    a.onclick = e => {
      e.preventDefault();
      const target = document.getElementById(a.getAttribute("href").slice(1));
      // behavior:"auto", not "smooth" — smooth was measured as a no-op in the in-app browser (scrollY never
      // moved), and an instant jump is the better behaviour anyway for "get me to Next Steps now".
      if (target) target.scrollIntoView({ behavior: "auto", block: "start" });
    };
  });
}

// The onset / course selects live INSIDE cards that re-render on every state change, so they are rebound
// after each render rather than once at boot.
function wireCardControls() {
  const o = document.getElementById("onset");
  if (o) o.onchange = e => { S.onset = e.target.value; renderResults(); };
  const c = document.getElementById("course");
  if (c) c.onchange = e => { S.course = e.target.value; renderResults(); };
}
function filterFindings(q) {
  const acc = document.getElementById("acc");
  acc.querySelectorAll(".frow").forEach(r => {
    const f = r.dataset.fid; const hit = !q || f.includes(q) || desc(f).toLowerCase().includes(q);
    r.style.display = hit ? "" : "none";
    if (hit && q) { let el = r.parentElement; while (el && el !== acc) { if (el.tagName === "DETAILS") el.open = true; el = el.parentElement; } }
  });
  if (!q) acc.querySelectorAll("details").forEach(d => { d.open = false; });
}
function toggleToken(tok) { S.tokens.has(tok) ? S.tokens.delete(tok) : S.tokens.add(tok); renderChips(); renderResults(); markSides(); syncLevelCtrls(); }
// Show the level inputs the moment a cord / length-dependent finding appears. Toggling visibility rather
// than re-rendering renderLocalise() keeps the accordion's open sections and scroll position intact.
function syncLevelCtrls() {
  const el = document.getElementById("levelctrls"); if (!el) return;
  el.hidden = ![...S.tokens].some(t => CORD_AXIS_FINDINGS.has(fid(t)));
}
function markSides() {
  const acc = document.getElementById("acc"); if (!acc) return;
  acc.querySelectorAll("button[data-f]").forEach(b => b.classList.toggle("on", S.tokens.has(`${b.dataset.f}@${b.dataset.s}`)));
}
// Loading an example is just setting state — it round-trips through the case URL like any hand-entered
// case, so a tester can share the exact example they were looking at. renderLocalise() rather than a
// narrower re-render, because an example may introduce a cord finding and so need the level inputs mounted.
function loadExample(id) {
  const ex = EXAMPLES.find(e => e.id === id) || CROSS_SITE_EXAMPLES.find(e => e.id === id);
  if (!ex) return;
  S.tokens = new Set(ex.tokens);
  S.onset = ex.onset || "";
  S.course = ex.course || "";
  S.selected = undefined;
  S.selectedPathology = undefined;
  // A CROSS-SITE archetype arrives with its claim already made — pinned pair, all-sites scope, entity
  // selected — so the case opens on the workup it exists to teach rather than making the reader rebuild it.
  // The validity gate still governs: if the entity does not fire, pruneSelectedEntity drops it on the first
  // render, so a stale archetype degrades to an ordinary two-lesion case instead of lying.
  S.pinned = new Set(ex.pinned || []);
  S.selectedEntity = ex.entity || undefined;
  S.scope = ex.entity ? "all" : "site";
  renderLocalise();
}

function renderChips() {
  const el = document.getElementById("chips");
  if (!S.tokens.size) {
    // The on-ramp, not furniture: only ever shown while the pane is empty, gone the moment the user enters
    // anything. The old copy pointed at examples that had not existed since presets were removed in the
    // 2026-07-25 UI restructure — it promised something the app could not deliver.
    const egBtn = e => `<button class="eg" data-eg="${esc(e.id)}"><b>${esc(e.label)}</b><span>${esc(e.teaches)}</span></button>`;
    // The four worked cases stay the on-ramp — each teaches a different output card. The 13 cross-site
    // archetypes sit behind a disclosure rather than beside them: they answer a narrower question ("what
    // ONE disease hits both these places?") and putting 17 cards in one row would bury the four.
    el.innerHTML = `<div class="egs"><span class="egs-lead">No findings yet — tick from the exam steps, or start from a case:</span>
      <div class="egs-row">${EXAMPLES.map(egBtn).join("")}</div>
      <details class="egs-more"><summary>One disease, several places — ${CROSS_SITE_EXAMPLES.length} cross-site archetypes</summary>
        <div class="egs-row">${CROSS_SITE_EXAMPLES.map(egBtn).join("")}</div>
      </details></div>`;
    el.onclick = e => { const b = e.target.closest("[data-eg]"); if (b) loadExample(b.dataset.eg); };
    return;
  }
  el.innerHTML = [...S.tokens].map(t => { const [f,s]=t.split("@");
    return `<span class="chip" title="${esc(f)} — ${esc(desc(f))}"><span class="sd">${sideTag(s)}</span>${esc(shortFindingLabel(f))}<span class="x" data-t="${t}">×</span></span>`; }).join("");
  el.onclick = e => { const t = e.target.dataset.t; if (t) toggleToken(t); };
}

function renderResults() {
  const el = document.getElementById("results");
  if (!S.tokens.size) { el.innerHTML = `<h3>Possible lesions</h3><div class="empty">Add a finding — every lesion that could produce it appears, and the list narrows as you add more.</div>`; return; }
  try {
  // Papilloedema is an AXIS, not a site finding (see raisedPressureAxis): no site's expected findings
  // contain it, so it must not be counted in the "explains n/total" denominator or every intracranial site
  // would look as if it had failed to account for it. The full token set still drives the flags below.
  const total = [...S.tokens].filter(t => !t.startsWith("papilloedema@")).length;
  // solve() still receives the FULL set — differential() needs the pressure token to apply the compartment
  // filter, and strips it internally before matching.
  const r = solve(S.tokens, { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined, distalReach: S.distalReach || undefined });
  const cands = r.differential;
  const refr = refractiveFlag(S.tokens);
  const rmsg = refr.refractive
    ? `<div class="multi" style="border-color:var(--gold)"><b>👓 Refractive, not neurological.</b> ${esc(refr.note)}</div>` : "";
  const press = raisedPressureAxis(S.tokens);
  const pmsg = press.present
    ? `<div class="multi" style="border-color:var(--red);background:var(--red-bg)"><b>⚑ Raised intracranial pressure.</b> ${esc(press.note)}</div>` : "";
  if (!cands.length) {
    const fnd = functionalFlag(S.tokens);
    const fmsg = fnd.functional
      ? `<div class="multi" style="border-color:var(--gold)"><b>⚠ Consider functional.</b> ${esc(fnd.note)}</div>`
      : "";
    el.innerHTML = `<h3>Possible lesions</h3>${rmsg}${fmsg}<div class="empty">No site produces any of these findings on the sides given — re-check a side${refr.refractive?", or this is refractive rather than neurological (see above)":fnd.functional?", or this is likely non-organic (see above)":", or this may be non-organic"}.</div>`;
    return;
  }
  const list = r.display;
  // S.selected is the user's click-override; persist it while still shown, else the engine's default.
  let sel = list.find(c => c.site.id === S.selected) || list.find(c => c.site.id === r.defaultSite) || list[0];
  S.selected = sel.site.id;
  const tf = tractsFor(S.tokens, { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined });
  const together = togetherCard(r, list);
  // AFTER togetherCard, never before: the cross-site validity gate lives in that call, and the hash IS the
  // shareable case — writing it from unpruned state would put an entity in the link the card no longer offers.
  syncURL();
  const has = new Set(["where", "why", "what", "next"]);
  if (together) has.add("together");
  el.innerHTML = resultHeader(sel, list, total, r)
    + sectionNav(has)
    + pmsg + rmsg
    + whereCard(list, cands, total, r)
    + together
    + whyCard(tf, sel, total)
    + whatCard(sel.site, r, list)
    + nextCard(sel.site, r, list);
  wireCardControls();
  wireJumpLinks(el);
  const nx = el.querySelector(".neuraxis");
  if (nx) nx.onclick = e => { const g = e.target.closest("[data-k]"); if (!g) return; S.selectedPathology = undefined; S.selected = g.dataset.k; renderResults(); };
  // Selecting a cause narrows the Next card to that pathology; clicking the selected one clears it.
  // Bound on BOTH cards: the What rows and the Next card's chip carry data-px, so one handler shape
  // serves them and the chip's x needs no separate wiring. card() emits id="sec-<anchor>" (app.js:301).
  for (const secId of ["sec-what", "sec-next", "sec-together"]) {
    const sec = document.getElementById(secId);
    if (!sec) continue;
    // data-ux (a cross-site entity, from the Together card or the Next card's chip) and data-px (a
    // per-site pathology) are DIFFERENT CLAIMS and must not share a field: four entity names are also
    // verbatim per-site cause names, so one string could not say which was meant.
    const select = target => {
      const uxRow = target.closest("[data-ux]");
      if (uxRow) {
        const name = uxRow.dataset.ux;
        S.selectedEntity = S.selectedEntity === name ? undefined : name;
        renderResults();
        return true;
      }
      const row = target.closest("[data-px]");
      if (!row) return false;
      const name = row.dataset.px;
      S.selectedPathology = S.selectedPathology === name ? undefined : name;
      renderResults();
      return true;
    };
    sec.onclick = e => { select(e.target); };
    // A DIV WITH role="button" DOES NOT FIRE CLICK ON ENTER — only real <button>s do. These rows carry
    // role="button", tabindex="0" and aria-pressed, so they announce themselves to assistive tech as
    // buttons and take focus, and before this they then did nothing when operated. Space is included and
    // its default suppressed, or the page scrolls instead of selecting.
    sec.onkeydown = e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (!e.target.closest("[data-ux],[data-px]")) return;
      e.preventDefault();
      select(e.target);
    };
  }
  } catch (err) { el.innerHTML = `<h3>Possible lesions</h3>` + errorPanel(err); return; }
  const dl = document.getElementById("difflist");
  if (dl) dl.onclick = e => {
    const pin = e.target.closest("[data-pin]");
    if (pin) {                      // pin toggle — must not fall through to row selection
      const id = pin.dataset.pin;
      S.pinned.has(id) ? S.pinned.delete(id) : S.pinned.add(id);
      renderResults();
      return;
    }
    const row = e.target.closest(".drow");
    if (!row) return;
    S.selectedPathology = undefined;   // a pathology chosen at one lesion is meaningless at another
    S.selected = row.dataset.k;
    renderResults();
  };
  const el2 = document.getElementById("results");
  el2.querySelectorAll("[data-scope]").forEach(b => {
    b.onclick = () => { S.scope = b.dataset.scope; renderResults(); };
  });
}

// siteName keeps returning a plain STRING — all 15 call sites (diagram labels, feedback payload, why
// blocks, together rows, code-stroke) depend on that. Only the composition changed.
function siteName(site){ return plainSiteName(site, { dominantSide: S.dominant }).name; }
function siteSub(site){ return plainSiteName(site, { dominantSide: S.dominant }).sub; }
function siteRaw(site){ return plainSiteName(site, { dominantSide: S.dominant }).raw; }

// cap is trusted HTML (literal labels we control, e.g. "Why" or `Where <span…>(N)</span>`) — not user input.
// `anchor` gives the section nav a jump target.
function card(capHTML, body, anchor) {
  return `<section class="out-card"${anchor ? ` id="sec-${anchor}"` : ""}><div class="out-cap">${capHTML}</div>${body}</section>`;
}

// The reasoning chain stays in ONE scroll in a fixed order — a trainee must not be able to skip Why, which
// is the teaching payload — so the nav is a jump list, not a tab strip: nothing is hidden by it. It is what
// lets a time-poor reader reach Next Steps in one click instead of four screens of scrolling. Sections that
// do not render for this case are omitted rather than shown disabled.
function sectionNav(has) {
  const items = [["where","Where"],["together","Together"],["why","Why"],["what","What"],["next","Next"]]
    .filter(([k]) => has.has(k));
  if (items.length < 2) return "";
  return `<nav class="secnav">${items.map(([k,l]) =>
    `<a href="#sec-${k}" data-sec="${k}">${l}</a>`).join("")}</nav>`;
}

// A "Report a problem" link → the external form, pre-filled with the LIVE case URL (syncURL ran first),
// the top candidate, and the findings. Only teaching-vocabulary findings leave, only on click.
function feedbackButton(list) {
  const top = (list && list[0]) ? `${siteName(list[0].site)} (${list[0].site.id})` : "";
  const url = feedbackHref({ caseUrl: location.href, topResult: top, findings: [...S.tokens].join(", ") });
  return `<a class="report-btn" href="${esc(url)}" target="_blank" rel="noopener" title="Send feedback — do not include patient identifiers">⚑ Report a problem</a>`;
}

// A friendly failure panel — never a blank/broken page. Carries the case link + a report button so a
// tester can send exactly what broke. Technical detail is tucked behind a disclosure.
function errorPanel(err) {
  const url = feedbackHref({ caseUrl: location.href, topResult: "(render error)", findings: [...S.tokens].join(", ") });
  return `<div class="err-panel">
    <b>Something went wrong showing this case.</b>
    <p>This is a prototype and your input is safe. Please help us by reporting it — the exact case is attached automatically.</p>
    <a class="report-btn" href="${esc(url)}" target="_blank" rel="noopener">⚑ Report this problem</a>
    <details style="margin-top:8px"><summary style="font-size:11px;color:var(--muted)">Technical detail</summary><small style="color:var(--muted)">${esc(String(err))}</small></details>
  </div>`;
}

// compact header: the leading/selected lesion + status + functional flag (safety — kept prominent)
function resultHeader(sel, list, total, r) {
  const nAll = r.explainAll.length;
  const status = nAll
    ? `<b>${nAll}</b> lesion${nAll>1?"s":""} explain${nAll>1?"":"s"} all ${total} finding${total>1?"s":""}${nAll>1?" — click one to narrow":""}.`
    : `<b>No single lesion</b> explains all ${total} findings — best explains ${list[0].n}/${total}.`;
  const fnd = functionalFlag(S.tokens);
  const funcFlag = fnd.functional
    ? `<div class="multi" style="border-color:var(--gold);background:var(--gold-bg,transparent)"><b>⚠ Consider functional.</b> ${esc(fnd.note)}</div>`
    : fnd.suppressed
    ? `<div class="annot"><b>Functional sign noted:</b> ${esc(fnd.note)}</div>`
    : "";
  // Urgency already exists in the workup layer but was only visible four screens down — it is the one signal
  // a time-poor reader needs before anything else, so it sits in the header and links to the Next card.
  let urg = "";
  try {
    const u = nextStepsFor(sel.site).urgency;
    const tint = u === "emergency" ? "--red" : u === "urgent" ? "--gold" : "--faint";
    const lab = u === "emergency" ? "EMERGENCY" : u === "urgent" ? "URGENT" : "routine";
    const emerg = u === "emergency" ? " urg-emergency" : "";
    urg = `<a class="urg-pill${emerg}" href="#sec-next"${emerg ? "" : ` style="color:var(${tint});border-color:var(${tint})"`}>${lab}</a>`;
  } catch { urg = ""; }
  // ONE scope control, here, governing both the What and the Next cards — they used to render a copy each
  // off the same S.scope, which is two controls for one decision.
  const { sites: scopeSites } = combinedSites(r, list, S.pinned);
  const scope = scopeSites.length >= 2 ? scopeToggle(scopeSites.length) : "";
  return `<div class="out-head">
    <div class="oh-lead"><div class="oh-lead-txt"><b>${esc(siteName(sel.site))}</b>${siteSub(sel.site)?`<span class="oh-loc">${esc(siteSub(sel.site))}</span>`:""}
      <details class="oh-raw"><summary>site id</summary><code>${esc(siteRaw(sel.site))} · ${esc(sel.site.id)}</code></details>
    </div>${urg}${feedbackButton(list)}</div>
    <p class="oh-status">${status}</p>${scope}${funcFlag}</div>`;
}

// Five places tell the reader "the engine considered this and set it aside" — in five phrasings and five
// styles. They are ONE concept and get one component. The REASON text still distinguishes them, because the
// mechanisms genuinely differ: a known-negative EXCLUDES a site, a tempo/course mismatch only DEMOTES it.
// `reason` is trusted HTML (literal copy we control, sometimes with <b>) — never user input.
// `open` keeps a band expanded across a re-render. renderResults() rebuilds the whole results column, so a
// <details> the user opened closes again on the next click — which is invisible for a purely informational
// band, but wrong the moment the band contains something SELECTABLE: clicking a demoted cross-site entity
// re-renders, the band snaps shut, and the row you just chose disappears while its chip quietly appears two
// cards away. Callers pass `open` when the band holds the current selection.
function setAside(reason, n, body, open = false) {
  return `<details class="setaside"${open ? " open" : ""}><summary>Set aside — ${reason} <span class="c">${n}</span></summary>
    <div class="setaside-body">${body}</div></details>`;
}

// ① Where — the differential list + localisation annotations + (collapsed) ruled-out
function whereCard(list, cands, total, r) {
  const nAll = r.explainAll.length;
  const near = (!nAll && r.nearFit)
    ? `<div class="annot"><b>Near-fit:</b> ${esc(siteName(r.nearFit.site))} explains all but <code>${esc(r.nearFit.missing)}</code> — re-check that finding, or consider a second lesion.</div>` : "";
  const multi = (!nAll && r.multi)
    // NB: minimalSet() yields RAW site objects (unlike r.nearFit, which is a {site,missing} wrapper).
    ? `<div class="multi"><b>⚠ Likely multifocal.</b> Minimal cover — ${r.multi.sites.length} sites: ${r.multi.sites.map(s=>esc(siteName(s))).join(" + ")}${r.multi.uncovered.length?`; still unexplained: ${r.multi.uncovered.map(esc).join(", ")}`:""}.</div>` : "";
  let annot = "";
  if (r.level && r.level.applies) annot += `<div class="annot"><b>Sensory level:</b> ${esc(r.level.note || (r.level.landmark||r.level.segment||""))}</div>`;
  if (r.length && r.length.applies) annot += `<div class="annot"><b>Length:</b> ${esc(r.length.note||"")}${r.length.glove?" · stocking-glove":""}</div>`;
  const rows = list.map(c => {
    const on = c.site.id === S.selected ? " on" : "";
    const w = Math.round((c.n/total)*54);
    const fit = c.n===total ? `<span class="dall">✓ all</span>` : `<span class="dfrac">${c.n}/${total}</span>`;
    const pinned = S.pinned.has(c.site.id) ? " pinned" : "";
    return `<div class="drow${on}" data-k="${esc(c.site.id)}"><div class="dn"><b>${esc(siteName(c.site))}</b><span class="dloc">${esc(siteSub(c.site))}</span></div><div class="dfit">${fit}<div class="dbar" style="width:${w}px"></div></div><button class="pin${pinned}" data-pin="${esc(c.site.id)}" title="Pin this site to compare across lesions">📌</button></div>`;
  }).join("");
  const ruled = (r.ruledOut && r.ruledOut.length)
    ? setAside("contradicted by a normal finding", r.ruledOut.length,
        `<div class="why-list">${r.ruledOut.map(x => {
          const side = x.contradictedBy.split("@")[1];
          return `<div class="why-item"><span class="k no">✗</span><span class="t">${esc(siteName(x.site))}</span><span class="d">would also cause ${esc(desc(fid(x.contradictedBy)))} on the ${esc(side)} — which is normal here</span></div>`;
        }).join("")}</div>`)
    : "";
  const cap = `Where <span class="oc-n">(${list.length})</span>`;
  return card(cap, `<div class="difflist" id="difflist">${rows}</div>${near}${multi}${annot}${ruled}`, "where");
}

// A `spread`/`motor` clause has no single site — it is satisfied by the SET of sites, or by the observed
// findings, so `satisfiedBy` is null for those (see multifocal.js). The clause object still carries its
// own descriptive text (`{spread:"2 sites"}` / `{spread:"2 compartments"}` / `{motor:"mixed"}`); render
// THAT rather than discarding it, or the entity shows no derivation at all — spec: "never a bare disease
// name". `sites` is the full combined-site set the Together card is comparing, so a spread clause can name
// exactly which sites it disseminated across.
// What tissue the disease attacks, in words a clinician reads — the derivation line under each entity.
// Keep this in step with SUBSTRATES in src/model/substrate.js: an unmapped substrate renders an empty
// line, which is how the pattern->substrate migration silently blanked every derivation until it was
// caught by driving the UI (the unit suites assert engine output, not the app's consumption of it).
const SUBSTRATE_TEXT = {
  vessel: "blood vessels — present throughout the CNS and the PNS alike",
  parenchyma: "brain and cord parenchyma",
  leptomeninges: "the CSF-bathed surfaces — meninges, cranial-nerve exits, roots",
  myelin_cns: "central myelin",
  schwann: "Schwann cells of the peripheral nerves",
  neuron_population: "a selectively vulnerable neuronal population",
  motor_neuron: "upper and lower motor neurones",
};
const DISTRIBUTION_TEXT = {
  segment: "in distinct arterial branch territories",
  any: "disseminated in space",
  nerveTrunk: "confined to the peripheral nerve trunks",
};

function clauseText(clause, sites) {
  if (clause.substrate) {
    const what = SUBSTRATE_TEXT[clause.substrate] || clause.substrate;
    const how = clause.distribution ? `, ${DISTRIBUTION_TEXT[clause.distribution] || clause.distribution}` : "";
    return `attacks ${esc(what)}${esc(how)} — ${sites.map(s => esc(siteName(s))).join(" + ")}`;
  }
  if (clause.motor) return "mixed upper + lower motor neurone signs on examination";
  return "";
}

// One entry in the Together card's disease list — same visual language as renderCause() ("What") so the
// two cards read as one system, plus a `.dloc` line naming why each entry fits (a real site name where a
// clause resolved to one, the clause's own descriptive text otherwise) and, when the roster names a red
// flag, the actual SENTENCE (not just the badge) — see review Task 14 fixes B/C.
// The row is SELECTABLE (spec 2026-08-21) — clicking it narrows the all-sites Next card to this disease.
// `.cause.sel` carries the terracotta, reusing the allowlisted rule: the selected entity IS the answer the
// Next card is now about, exactly as the selected per-site pathology is.
function unifyingRow(e, sites) {
  const whyLine = e.why
    .map(w => (w.satisfiedBy && w.satisfiedBy.id) ? esc(siteName(w.satisfiedBy)) : clauseText(w.clause, sites))
    .filter(Boolean).join(" · ");
  const path = e.confirm ? `<div class="cpath"><span class="cpath-ic">🔎</span><span><b>Confirm on exam:</b> ${esc(e.confirm)}</span></div>` : "";
  const red = e.red ? `<div class="multi" style="border-style:solid;border-color:var(--red);background:var(--red-bg)"><b>Red flag:</b> ${esc(e.red)}</div>` : "";
  const on = S.selectedEntity === e.name;
  return `<div class="cause${on ? " sel" : ""}" data-ux="${esc(e.name)}" role="button" tabindex="0" aria-pressed="${on}"><div class="cline"><span class="cn">${esc(e.name)}</span><span class="lk">${esc(e.likelihood)}</span>${e.red ? `<span class="rf">⚑ RED</span>` : ""}</div>${e.feature ? `<div class="cfeat">${esc(e.feature)}</div>` : ""}${whyLine ? `<div class="dloc">${whyLine}</div>` : ""}${red}${path}</div>`;
}

// forcingFindings() runs one solve() per LOCALISING finding — ~190 ms on a two-lesion case, and it grew
// when the 2026-08-14 LOCALISING audit promoted 12 more findings. renderResults() re-runs on EVERY input
// event, including each keystroke in the sensory-level and distal-reach fields — and those fields do not
// change the finding set, so the guard was recomputing an identical answer per keystroke.
//
// The memo is keyed on the finding set plus the dominant hemisphere ONLY. `sensoryLevel` and `distalReach`
// are deliberately excluded: they are ANNOTATION axes (see CLAUDE.md — the sensory level annotates the
// winner, it never changes it), and this was verified rather than assumed — 7 sensoryLevel variants and a
// distalReach variant all produce a byte-identical forcingFindings result.
//
// Kept in the app layer on purpose: the engine function stays simple and cache-free; the repeated
// identical calls are an app-render concern, so the fix belongs where the repetition is.
let _ffKey = null, _ffVal = null;
function forcingFindingsMemo() {
  const key = [...S.tokens].sort().join("|") + "#" + S.dominant;
  if (key !== _ffKey) { _ffKey = key; _ffVal = forcingFindings(S.tokens, { dominantSide: S.dominant }); }
  return _ffVal;
}

// ② Together — the cross-site view. PARSIMONY FIRST: the card's first job is to try to talk you out of a
// multifocal claim, because a localising sign entered on the wrong side is the one real path to
// over-calling. The disease list comes second, framed conditionally. Order matters and must not change:
// guard → which sites → disease list (concordant open, tempo/course mismatches collapsed).
// THE VALIDITY GATE. `S.selectedEntity` is a claim about the CURRENT site set, so it survives exactly as
// long as the Together card still offers it. One rule here subsumes the enumerated clears — fewer than two
// sites, a findings edit that stops the entity firing, a re-pin onto a pair it does not fit — because in
// every one of those cases the roster stops returning it. Scattering `S.selectedEntity = undefined` across
// the handlers would be four places to forget instead of one.
//
// A findings edit that leaves the entity STILL FIRING deliberately keeps the selection: the claim is still
// on offer and still true, so dropping it would be busywork for the reader.
function pruneSelectedEntity(offered) {
  if (S.selectedEntity && !offered.has(S.selectedEntity)) S.selectedEntity = undefined;
}

function togetherCard(r, list) {
  const { sites, source } = combinedSites(r, list, S.pinned);
  if (sites.length < 2) { S.selectedEntity = undefined; return ""; }

  const ff = forcingFindingsMemo();
  // The card can render on the PINNED path even when a single lesion already explains everything (the
  // card's own copy invites exactly this: "Pin two sites in the list above to test a different pair") — so
  // the guard must check that FIRST, or it falls into the "several findings" branch and asserts a
  // multifocal claim that is flatly false. togetherGuardState() (app/together-guard.js) is the pure,
  // directly-tested decision; see review Task 14 Fix A / test/together-guard.test.js.
  const gState = togetherGuardState(r, ff);
  // Each forcing finding carries ITS OWN collapse target (see multifocal.js) — different findings can
  // collapse the picture onto different sites, so they are named in pairs, never under one shared claim.
  const guard = gState.kind === "single"
    ? `<div class="annot"><b>A single lesion already explains every finding here.</b> You've pinned a second site to compare anyway — this is a hypothetical "what if" comparison, not a claim that the picture is actually multifocal.</div>`
    : gState.kind === "forcing"
    ? `<div class="multi" style="border-color:var(--gold)"><b>Check this first.</b> This is multifocal only because of: ${gState.findings.map(f =>
        `${tokenLabel(f.token)}${f.collapsesTo ? ` — drop it and a single ${esc(siteName(f.collapsesTo))} lesion explains everything` : ""}`
      ).join("; ")}. If any of these signs is uncertain, re-check it before accepting a multifocal picture.</div>`
    : `<div class="annot"><b>Several findings independently require a second site</b> — no single observation is carrying the multifocal claim.</div>`;

  const srcLine = `<div class="annot">Showing <b>${source === "pinned" ? "your selection" : "the engine's minimal cover"}</b>: ${sites.map(s => esc(siteName(s))).join(" + ")}.${source === "cover" ? " Pin two sites in the list above to test a different pair." : ""}</div>`;

  const u = unifyingDiagnoses(sites, S.tokens, { onset: S.onset || undefined, course: S.course || undefined });
  pruneSelectedEntity(new Set([...u.concordant, ...u.discordant].map(e => e.name)));
  const fits = u.concordant.length
    ? u.concordant.map(e => unifyingRow(e, sites)).join("")
    : `<div class="empty">No catalogued cross-site process fits this combination — which is itself informative: consider two unrelated lesions.</div>`;

  // Soft-axis mismatches DEMOTE, they never drop (owner ruling). The band names WHICH axis missed and what
  // would have to be true.
  const axisLabel = es => {
    const axes = [...new Set(es.flatMap(e => e.demotions.map(d => d.axis)))];
    return axes.length === 2 ? "tempo and course" : axes[0] === "course" ? "the course" : "the tempo";
  };
  // Held OPEN while the selection lives inside it — a demoted entity is selectable (tempo and course
  // demote, they never drop), so the band must not close over the row the reader just picked.
  const selectedIsDemoted = u.discordant.some(e => e.name === S.selectedEntity);
  const disc = u.discordant.length
    ? setAside(`less likely given ${esc(axisLabel(u.discordant))}`, u.discordant.length,
        u.discordant.map(e => `${unifyingRow(e, sites)}<div class="annot">${e.demotions.map(d => `You entered <b>${esc(d.entered)}</b>; this is typically ${d.expected.map(esc).join(" / ")}.`).join(" ")}</div>`).join(""),
        selectedIsDemoted)
    : "";

  // The course control lives HERE — it exists only for the cross-site roster, so it has no meaning until
  // this card is on screen. That is also why its label no longer has to explain itself.
  const courseCtrl = `<div class="card-ctrl"><label>Course
      <select id="course">
        <option value="">all</option>
        ${COURSES.map(c=>`<option value="${c.id}"${S.course===c.id?" selected":""}>${esc(c.label)}</option>`).join("")}
      </select></label></div>`;
  return card(`Together <span class="oc-n">(${sites.length} sites)</span>`, courseCtrl + guard + srcLine + fits + disc, "together");
}

const sideName = s => s === "left" ? "left" : s === "right" ? "right" : s === "bilateral" ? "both sides" : "the affected side";

// Tract-level SYNTHESIS composed from the derived facts (no stored paragraphs). Leads the "why".
function synthesisHTML(tf) {
  if (!tf.length) return "";
  const clauses = tf.map(t => {
    const labels = t.sites.map(s => siteName(s.site));
    const shown = labels.slice(0, 6).map(esc).join(" · ");
    const more = labels.length > 6 ? ` … (+${labels.length - 6})` : "";
    return `<p class="synth"><b>${esc(t.tract.label)}</b> — ${esc(t.tract.together)}. A lesion can lie anywhere along its course: ${shown}${more}. <span class="cross">${esc(t.tract.crossingNote)}.</span></p>`;
  }).join("");
  const converge = tf.length > 1
    ? `<p class="synth converge">These tracts cross at <b>different</b> points, so their combination pins the level and side: ${tf.map(t => esc(t.tract.label)).join(" + ")}.</p>`
    : "";
  return `${clauses}${converge}`;
}

function neuraxisBlock(tf, selectedId) {
  if (!tf.length) return "";
  const svg = neuraxisSVG(tf, { selectedId, labelFor: s => siteName(s) });
  return `<div class="neuraxis-wrap"><div class="nx-cap">Neuraxis — click a site to select it</div>${svg}</div>`;
}

// A `finding@side` token as a clinician reads it: "Right · Arm weakness". The raw token stays in the title
// so a bug report can still name it exactly. Used wherever the Why card lists individual findings.
function tokenLabel(t) {
  const [f, side] = t.split("@");
  const sd = sideTag(side);
  return `<span class="t" title="${esc(t)}">${sd !== "•" ? `<span class="sd">${sd}</span> ` : ""}${esc(shortFindingLabel(f))}</span>`;
}

function whyBlock(c, total, collapsed = false) {
  const observed = [...S.tokens];
  const explained = new Set(c.explained);
  const ok = c.explained.map(t=>`<div class="why-item"><span class="k ok">✓</span>${tokenLabel(t)}</div>`).join("");
  const no = observed.filter(t=>!explained.has(t)).map(t=>`<div class="why-item"><span class="k no">✗</span>${tokenLabel(t)}<span class="d">not explained by this site</span></div>`).join("");
  const missed = [...c.exp].filter(t=>!S.tokens.has(t));
  const warn = missed.map(t=>`<div class="why-item"><span class="k warn">⚠</span>${tokenLabel(t)}<span class="d">predicted here but not reported</span></div>`).join("");
  const body = `<div class="why-list">${ok}${no}</div>
    ${warn?`<details style="margin-top:6px"><summary style="font-size:11.5px;color:var(--muted)">Predicted here but not reported <span class="c">${missed.length}</span></summary><div class="why-list" style="margin-top:4px">${warn}</div></details>`:""}`;
  const head = `<span style="color:var(--terra)">${esc(siteName(c.site))}</span> explains ${c.n}/${total}`;
  return collapsed
    ? `<details class="why-site" style="margin-top:10px"><summary style="font-weight:700">Why this specific site — ${head}</summary><div style="margin-top:6px">${body}</div></details>`
    : `<h3 style="margin-top:14px">Why — ${head}</h3>${body}`;
}

// ② Why — composed Course narrative + Why-this (parsimony) + Why-not (derived, level-grouped) + diagram
function whyCard(tf, sel, total) {
  const pat = umnLmnPattern(S.tokens);
  const umnlmn = pat.verdict
    ? `<div class="annot"><b>${pat.verdict === "mixed" ? "UMN + LMN (mixed)" : pat.verdict + " pattern"}:</b> ${esc(pat.note)}</div>`
    : "";
  if (!tf.length) {
    // non-tract findings: no tract narrative/diagram — lead with the per-site explanation, expanded.
    return card("Why", `${umnlmn}${whyBlock(sel, total, false)}`, "why");
  }
  const course = tf.map(t => `<p class="synth"><b>Course.</b> ${esc(tractNarrative(t.tract))}</p>`).join("");
  const opts = { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined };
  const wn = whyNotOthers(S.tokens, sel.site, opts);
  const common = prevalenceOf(sel.site) === 2;
  const tractLabels = tf.map(t => esc(t.tract.label)).join(" and ");
  const whyThis = `<p class="synth"><b>Why this site.</b> The findings map onto the ${tractLabels}, so the lesion lies somewhere along that pathway; the accompanying signs (and the ones that are absent) place it at ${esc(siteName(sel.site))}.${common ? " Lesions here are also common." : ""}</p>`;
  const lines = wn.buckets.map(b => {
    const signs = b.findings.map(id => esc(desc(id))).join(", ");
    const lead = b.bucket === wn.selectedBucket ? `A neighbouring ${esc(b.bucket)} lesion` : `If ${esc(b.bucket)}`;
    const terr = b.supply ? ` <span class="wn-terr">(${esc(b.supply)})</span>` : "";
    return `<li>${lead}${terr} — you'd also expect ${signs}.</li>`;
  }).join("");
  const whyNot = lines
    ? `<div class="whynot"><b>Why not elsewhere.</b><ul class="whynot-list">${lines}</ul><p class="derived">None reported — examine specifically to exclude.</p></div>`
    : "";
  const diagram = `<details class="nx-toggle" open style="margin-top:6px"><summary>Neuraxis diagram</summary>${neuraxisBlock(tf, sel.site.id)}</details>`;
  return card("Why", `${course}${umnlmn}${whyThis}${whyNot}${diagram}${whyBlock(sel, total, true)}`, "why");
}

// Merged causes/workup render through the cards that already OWN that presentation, rather than a third
// rendering of the category dots that could drift out of sync.
function scopeToggle(n) {
  return `<div class="scope"><button class="sc${S.scope==="site"?" on":""}" data-scope="site">This site</button><button class="sc${S.scope==="all"?" on":""}" data-scope="all">All ${n} sites</button></div>`;
}

// One shared cause row, in the merged What card. `dem` adds the "usually X onset" line the demoted band
// needs — the concordant list omits it, since a concordant entry needs no such caveat.
function sharedCauseRow(s, nSites, dem) {
  const loc = dem
    ? `at ${s.count} of ${nSites} sites · usually ${s.demotion.expected.map(esc).join(" / ")} onset`
    : `at ${s.count} of ${nSites} sites`;
  return `<div class="cause${s.red?" red":""}"><b>${esc(s.name)}</b>${s.red?` <span class="rf">⚑ RED</span>`:""} <span class="dloc">${loc}</span>${s.feature?` — ${esc(s.feature)}`:""}</div>`;
}

// perSite = the remainder — every per-site cause that did NOT make the shared bucket (spec: "so nothing is
// hidden"). combinedCauses() doesn't pre-strip these (`perSite` carries every cause per site, shared or
// not), so the shared/non-shared split is redone here with the SAME canonicalKey() the engine used to
// build the shared bucket in the first place, rather than a second alias table that could drift from it.
//
// A row is suppressed only when its OWN verbatim name is the one actually shown in the shared list — not
// merely when it canonicalises onto the same shared entity. The shared bucket displays ONE label (the
// shortest name) per entity, so a same-entity cause worded differently (e.g. "Central pontine
// myelinolysis" when the shared row shows "Demyelination (MS)") must stay in the remainder under its own
// name, or the true name is hidden along with the duplicate — measured over 4,032 pair-views: 23.7% hid at
// least one distinctly-named cause this way. Visually secondary to `shared`: grouped by site, collapsed by
// default.
function perSiteRemainderHTML(cc, sites) {
  const shownNameFor = new Map(cc.shared.map(s => [s.entity ? `entity:${s.entity}` : `name:${s.name}`, s.name]));
  const bySite = cc.perSite
    .map(({ site, causes }) => ({ site, remainder: causes.filter(c => shownNameFor.get(canonicalKey(c.name).key) !== c.name) }))
    .filter(x => x.remainder.length);
  if (!bySite.length) return "";
  const n = bySite.reduce((sum, x) => sum + x.remainder.length, 0);
  // A remainder row can be tempo-DEMOTED just like a shared one — `combinedCauses()` builds perSite from
  // `all.concat(demoted)`. The single-site What card and the shared band both say so; without this the
  // remainder was the one view of three that showed a demoted cause with no hint it was demoted.
  const body = bySite.map(({ site, remainder }) =>
    `<div class="catgrp"><div class="cathead">${esc(siteName(site))}</div>${remainder.map(c =>
      renderCause(c) + (c.demotion
        ? `<div class="annot" style="margin:-4px 0 6px">Less likely given <b>${esc(c.demotion.entered)}</b> onset — usually ${c.demotion.expected.map(esc).join(" / ")}.</div>`
        : "")
    ).join("")}</div>`
  ).join("");
  return setAside("only plausible at one site", n, body);
}

// ③ What — the curated differential for this site. Categories with no plausible cause are omitted,
// never padded with region generics (see the depth spec, 2026-08-11). Branches to the cross-site shared-
// causes view when the scope toggle is set to "all" and the combined view actually has ≥2 sites.
function whatCard(site, r, list) {
  // S.pinned MUST be passed: without it this resolves the engine's cover while the Together card resolves
  // the user's pinned pair, and the two cards silently describe DIFFERENT sites on the same screen.
  const { sites } = combinedSites(r, list, S.pinned);
  if (sites.length >= 2 && S.scope === "all") {
    const cc = combinedCauses(sites, { onset: S.onset || undefined });
    // Tempo mismatches DEMOTE, never drop (owner ruling) — a shared cause is demoted iff EVERY contributing
    // site's own source was demoted. The "no shared cause" message must only fire when there is truly
    // nothing shared, never merely because everything that IS shared got demoted — that's a different,
    // narrower claim ("no cause is plausible at more than one site" is false when one is, just at the wrong
    // tempo) and the code cannot support the stronger one.
    const concordantShared = cc.shared.filter(s => !s.demoted);
    const demotedShared = cc.shared.filter(s => s.demoted);
    const shared = concordantShared.length
      ? concordantShared.map(s => sharedCauseRow(s, sites.length, false)).join("")
      : demotedShared.length
      ? `<div class="empty">Every shared cause is demoted given <b>${esc(S.onset)}</b> onset — see "Less likely given the tempo" below.</div>`
      : `<div class="empty">No cause is plausible at more than one of these sites — which argues for two unrelated processes.</div>`;
    const dem = demotedShared.length
      ? setAside(`less likely given <b>${esc(S.onset)}</b> onset`, demotedShared.length,
          `<div class="annot">A cause shared here does not typically present with <b>${esc(S.onset)}</b> onset — the mismatch between tempo and site is itself informative.</div>
           ${demotedShared.map(s => sharedCauseRow(s, sites.length, true)).join("")}`)
      : "";
    const remainder = perSiteRemainderHTML(cc, sites);
    return card(`What <span class="oc-n">(all sites)</span>`, shared + dem + remainder, "what");
  }
  return card("What", whatBlock(site), "what");
}

// One cause: the row (name · tempo · likelihood · red) plus an optional discriminating-feature line.
// The row is SELECTABLE (spec 2026-08-18) — clicking it narrows the Next card to this pathology.
// `--terra` on the selected row is a legitimate use of the identity colour: the selected pathology IS the
// answer the Next card is now about.
function renderCause(c) {
  const path = c.pathognomonic ? `<div class="cpath"><span class="cpath-ic">🔎</span><span><b>Confirm on exam:</b> ${esc(c.pathognomonic)}</span></div>` : "";
  const on = S.selectedPathology === c.name;
  return `<div class="cause${on?" sel":""}" data-px="${esc(c.name)}" role="button" tabindex="0" aria-pressed="${on}"><div class="cline"><span class="cn">${esc(c.name)}</span><span class="tp" title="typical tempo">${c.tempo.map(x=>x[0].toUpperCase()).join("")}</span><span class="lk">${esc(c.likelihood)}</span>${c.red?`<span class="rf">⚑ RED</span>`:""}</div>${c.feature?`<div class="cfeat">${esc(c.feature)}</div>`:""}${path}</div>`;
}

function whatBlock(site) {
  const res = causesFor(site, { onset: S.onset || undefined });
  const ph = nameForSite(site);
  const red = ph.red ? `<div class="multi" style="border-style:solid;border-color:var(--red);background:var(--red-bg)"><b>Red flag:</b> ${esc(ph.red)}</div>` : "";
  // Curated causes only — a category with nothing plausible at this site is simply not shown.
  const bySpec = Object.fromEntries(res.byCategory.map(g => [g.cat, g]));
  // Per category the leading causes stay open, and EVERY red-flagged must-not-miss stays open regardless of
  // its rank — the must-not-miss list is never what gets collapsed. The remainder keeps its NAMES on screen
  // in the summary line, so nothing is hidden, only ranked.
  //
  // MEASURED EFFECT IS SMALL, and the design spec overstated it. After the 2026-08-11 depth sweep the mean
  // site carries 6.4 causes spread across the sieve categories, so <=2 per category is already the norm:
  // only 73 of 377 sites (19%) collapse anything at all, and the mean first read falls just 6.4 -> 6.1
  // entries. It earns its place on the dense sites (length-dependent polyneuropathy goes 8 -> 5) and costs
  // nothing on the rest. The real density on screen was the ALL-SITES view and the demoted bands, not a
  // single site's category lists.
  const OPEN_PER_CAT = 2;
  const groups = CATEGORIES.map(cat => {
    const causes = bySpec[cat.id]?.causes || [];
    if (!causes.length) return "";
    const open = causes.filter((c, i) => i < OPEN_PER_CAT || c.red);
    const rest = causes.filter(c => !open.includes(c));
    const more = rest.length
      ? `<details class="more-causes"><summary>+${rest.length} more — ${rest.map(c => esc(c.name)).join(", ")}</summary>${rest.map(renderCause).join("")}</details>`
      : "";
    return `<div class="catgrp"><div class="cathead"><span class="catdot" style="background:var(${cat.tint})"></span>${esc(cat.label)}</div>${open.map(renderCause).join("")}${more}</div>`;
  }).join("");
  // Lead: the common causes to think of first (given the chosen tempo, if any).
  const leadCauses = res.all.filter(x => x.likelihood === "common").slice(0, 3).map(x => x.name);
  const lead = leadCauses.length
    ? `<p class="what-lead">${S.onset ? `Given <b>${esc(S.onset)}</b> onset, think first of` : "Most likely"}: ${leadCauses.map(esc).join("; ")}.</p>` : "";
  // The onset control lives HERE, in the card it acts on — it filters/demotes causes and nothing else.
  const cap = `<div class="card-ctrl"><label>Onset
      <select id="onset">
        <option value="">all</option>
        ${TEMPO.map(t=>`<option value="${t.id}"${S.onset===t.id?" selected":""}>${esc(t.label)}</option>`).join("")}
      </select></label>${res.derived ? `<span class="derived">(derived from site type — not individually curated)</span>` : ""}</div>`;
  // Tempo mismatches are demoted, never deleted — the teaching line that used to REPLACE the content now
  // heads the disclosure. Spec 2026-08-14 §7.
  const dem = res.demoted && res.demoted.length
    ? setAside(`less likely given <b>${esc(S.onset)}</b> onset`, res.demoted.length,
        `<div class="annot">A lesion here does not typically present with <b>${esc(S.onset)}</b> onset — the mismatch between tempo and site is itself informative.</div>
         ${res.demoted.map(x => `<div class="cause"><b>${esc(x.name)}</b> <span class="dloc">usually ${x.demotion.expected.map(esc).join(" / ")}</span>${x.feature ? ` — ${esc(x.feature)}` : ""}</div>`).join("")}`)
    : "";
  return `${cap}${lead}${red}${groups}${dem}`;
}

// ④ Next steps — its own card, tiered (immediate → first-line → confirmatory → monitoring) + urgency/referral.
// Branches only on which workup OBJECT is fed to the one shared renderer (nextBlock) — combinedNextSteps()
// returns the same field names/types as nextStepsFor() (minus `curated`) precisely so this works without a
// second four-tier renderer.
function nextCard(site, r, list) {
  // S.pinned MUST be passed — see the note in whatCard().
  const { sites } = combinedSites(r, list, S.pinned);
  const combined = sites.length >= 2 && S.scope === "all";
  // Per-site selection is single-site only; the CROSS-SITE selection is the combined view's answer to
  // "whose pathology?" — the disease the Together card named as spanning these sites (spec 2026-08-21).
  const nx = combined
    ? combinedNextSteps(sites, S.selectedEntity || null)
    : pathologyNextStepsFor(site, S.selectedPathology || null);
  const cap = combined ? `Next steps <span class="oc-n">(all sites)</span>` : "Next steps";
  return card(cap, nextBlock(nx, combined), "next");
}

// `combined` distinguishes the two shapes nextBlock is fed: nextStepsFor()'s single-site plan (which carries
// a real `curated` flag) vs combinedNextSteps()'s union-of-plans (which never sets `curated` — the merged
// tiers may mix curated and derived sites, so neither true nor false would be honest). Do not read
// nx.curated for the combined case; say what actually happened instead — see review Task 14 A1.
function nextBlock(nx, combined) {
  const urgTint = nx.urgency === "emergency" ? "--red" : nx.urgency === "urgent" ? "--gold" : "--faint";
  const urgLabel = nx.urgency === "emergency" ? "EMERGENCY" : nx.urgency === "urgent" ? "URGENT" : "routine";
  // `scope` tags which tiers the selection actually changed. NOT dimming: opacity reads as "disabled"
  // rather than "unaffected", and these tiers are live and correct — they are simply site-level, because
  // they are what you do BEFORE the cause is known and what identifies it.
  const tier = (title, items, scope) => (items && items.length)
    ? `<div class="ns-tier"><h4 class="ns-h">${esc(title)}${scope ? `<span class="ns-scope">— ${esc(scope)}</span>` : ""}</h4><ul class="nextlist">${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>` : "";
  const px = !combined && nx.pathology;
  const ux = combined && nx.entity;
  const pxHead = px
    ? `<div class="px-line">Plan for: <button class="px-chip" data-px="${esc(nx.pathology)}" title="Clear the selected pathology">${esc(nx.pathology)} <span class="px-x" aria-hidden="true">×</span></button></div>`
    : ux
    ? `<div class="px-line">Plan for: <button class="px-chip" data-ux="${esc(nx.entity)}" title="Clear the selected cross-site diagnosis">${esc(nx.entity)} <span class="px-x" aria-hidden="true">×</span></button></div>`
    : "";
  // The honest fallback (spec 2026-08-18): an uncurated pathology shows the SITE plan and says so, rather
  // than deriving generic content to fill the gap. There is deliberately NO cross-site equivalent — every
  // entity has an authored plan (the gate in test/multifocal-next-steps.test.js), so `ux` never falls back.
  const pxFallback = px && !nx.pathologyCurated
    ? `<p class="derived">General plan for this site — not specific to ${esc(nx.pathology)}.</p>` : "";
  const provenance = ux
    ? `<p class="derived">Immediate and first-line steps are merged from each site's own plan; the tiers below them are the workup for ${esc(nx.entity)}.</p>`
    : combined
    ? `<p class="derived">Merged from each site's individual workup plan — see "This site" for any one site's own tiers.</p>`
    : (nx.curated ? "" : `<p class="derived">Tiers derived from site type + urgency — not individually curated.</p>`);
  return `<p class="what-cap"><span class="derived">Educational teaching prompts — not clinical advice.</span></p>
    <div class="multi" style="border-style:solid;border-color:var(${urgTint})"><b>Urgency:</b> ${esc(urgLabel)} · <b>Referral:</b> ${esc(nx.referral)}</div>
    ${ux && nx.entityBecause ? `<p class="derived ns-because"><b>Why this urgency:</b> ${esc(nx.entityBecause)}</p>` : ""}
    ${pxHead}
    ${tier("Immediate / bedside", nx.immediate, px || ux ? "site" : "")}
    ${tier("First-line investigations", nx.investigations, px || ux ? "site" : "")}
    ${ux ? tier("First-line investigations", nx.entityFirstLine, nx.entity) : ""}
    ${pxFallback}
    ${tier("Confirmatory / specialist", nx.confirmatory, px && nx.pathologyCurated ? nx.pathology : ux ? nx.entity : "")}
    ${tier("Monitoring / safety-netting", nx.monitoring, px && nx.pathologyCurated ? nx.pathology : ux ? nx.entity : "")}
    ${provenance}`;
}

// ================= ATLAS =================
function renderAtlas() {
  const byLevel = {};
  for (const s of ATLAS) (byLevel[s.level] ??= []).push(s);
  const levels = REGION_ORDER.filter(l => byLevel[l]).concat(Object.keys(byLevel).filter(l=>!REGION_ORDER.includes(l)));
  const list = levels.map(l => `<div class="lvl-grp"><div class="gh">${esc(l.replace(/_/g,' '))}</div>${
    byLevel[l].map(s=>`<button class="site-btn" data-k="${s.level}_${s.part}">${esc(s.part.replace(/_/g,' '))} <span class="sp">${esc(s.level)}</span></button>`).join("")}</div>`).join("");
  app.innerHTML = `<div class="grid">
    <div class="pane"><h3>Browse the neuraxis</h3><p style="font-size:11.5px;color:var(--muted);margin:0 0 8px">Pick a site to see what a lesion there produces — the forward direction.</p><div class="atlas-levels" id="alist">${list}</div></div>
    <div class="pane" id="adetail"><h3>Site</h3><div class="empty">Pick a site on the left.</div></div>
  </div>`;
  document.getElementById("alist").onclick = e => { const b = e.target.closest(".site-btn"); if (!b) return;
    document.querySelectorAll(".site-btn").forEach(x=>x.classList.remove("on")); b.classList.add("on");
    S.atlas = b.dataset.k; renderAtlasDetail(); };
  if (S.atlas) { const b = document.querySelector(`.site-btn[data-k="${S.atlas}"]`); if (b){ b.classList.add("on"); renderAtlasDetail(); } }
}
function renderAtlasDetail() {
  const site = ATLAS.find(s => `${s.level}_${s.part}` === S.atlas); if (!site) return;
  const exp = [...expectedFindings(site)];
  const rows = exp.map(t => { const [f,s]=t.split("@");
    const cls = s==="left"||s==="right" ? "bc" : s==="bilateral" ? "bb" : s==="midline" ? "bm" : "bnone";
    return `<div class="why-item"><span class="badge ${cls}">${sideTag(s)}</span><span class="t">${esc(f)}</span><span class="d">${esc(desc(f))}</span></div>`; }).join("");
  const res = causesFor(site, {});
  const groups = res.byCategory.map(g=>`<div class="catgrp"><div class="cathead"><span class="catdot" style="background:var(${g.tint})"></span>${esc(g.label)}</div>${g.causes.map(c=>`<div class="cause"><span class="cn">${esc(c.name)}</span><span class="tp">${c.tempo.map(x=>x[0].toUpperCase()).join("")}</span>${c.red?`<span class="rf">⚑ RED</span>`:""}</div>`).join("")}</div>`).join("");
  document.getElementById("adetail").innerHTML = `<h3>${esc(siteName(site))}</h3>
    <div class="where-best" style="margin-bottom:10px"><div class="loc">${esc(siteSub(site) || siteRaw(site))}</div><div class="terr">${esc(siteRaw(site))}</div></div>
    <h3>Produces (findings)</h3><div class="why-list">${rows||'<div class="empty">—</div>'}</div>
    <h3 style="margin-top:14px">Causes</h3>${groups}`;
}

// ================= modes + bootstrap =================
function renderStroke(){ renderCodeStroke({ S, app, esc, siteName, solve, syncURL }); }

function boot() {
  restoreFromURL();
  document.getElementById("modes").onclick = e => { const m = e.target.dataset.mode; if (!m || m===S.mode) return;
    stopStrokeClock();
    S.mode = m; document.querySelectorAll("#modes button").forEach(b=>b.classList.toggle("on", b.dataset.mode===m));
    m==="localise" ? renderLocalise() : m==="atlas" ? renderAtlas() : renderStroke(); syncURL(); };
  // Reflect the (possibly URL-restored) mode in the toggle before the first render.
  document.querySelectorAll("#modes button").forEach(b => b.classList.toggle("on", b.dataset.mode === S.mode));
  // Dominant hemisphere is a per-USER constant, not a per-case knob, so it lives in the static header and is
  // bound once here rather than on every render of the localise view.
  const domSel = document.getElementById("dom");
  if (domSel) { domSel.value = S.dominant;
    domSel.onchange = e => { S.dominant = e.target.value;
      if (S.mode === "localise") { renderResults(); markSides(); } syncURL(); }; }
  try { S.mode==="atlas" ? renderAtlas() : S.mode==="stroke" ? renderStroke() : renderLocalise(); }
  catch (err) { app.innerHTML = errorPanel(err); }
}

// `first` = this browser had never unlocked before. The gate stores an "ok" flag and skips the passphrase
// on every later visit, so instrumenting the passphrase submit would count FIRST UNLOCKS rather than opens
// — a different and much less useful number. Counting here, with the flag, gives both.
//
// recordOpen never throws and never awaits the network (see app/usage.js), so it cannot delay or block the
// reveal. It also ships with mode "off", so until an endpoint is configured this line does nothing at all.
function reveal({ first = false } = {}) {
  recordOpen({ first });
  document.getElementById("gate").classList.remove("show");
  document.getElementById("app-shell").classList.add("show");
}

// One geometry, three call sites — the header mark, the gate mark and the favicon all come from brand.js,
// so there is no second copy of the logo to drift. Runs before the gate is shown.
function paintBrand() {
  // 32px balances the two-line lockup (byline + 26px wordmark ≈ 53px tall); 26px read small beside it.
  document.querySelectorAll("[data-brand-mark]").forEach(el => { el.innerHTML = markSVG({ size: 32 }); });
  document.querySelectorAll("[data-brand-version]").forEach(el => { el.textContent = `v${VERSION} \u00b7 Beta`; });
  let link = document.querySelector('link[rel="icon"]');
  if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
  link.type = "image/svg+xml";
  link.href = faviconDataURI(getComputedStyle(document.documentElement).getPropertyValue("--terra").trim() || "#d36d52");
}

async function startGate() {
  paintBrand();
  const gateEl = document.getElementById("gate");
  if (localStorage.getItem(GATE_STORAGE_KEY) === "ok") { reveal({ first: false }); boot(); return; }
  gateEl.classList.add("show");
  document.getElementById("gate-form").onsubmit = async ev => {
    ev.preventDefault();
    const errEl = document.getElementById("gate-err");
    if (!document.getElementById("gate-ack").checked) { errEl.textContent = "Please tick the acknowledgment to continue."; return; }
    const okPass = await checkPassphrase(document.getElementById("gate-pass").value);
    if (!okPass) { errEl.textContent = "Incorrect passphrase."; return; }
    try { localStorage.setItem(GATE_STORAGE_KEY, "ok"); } catch {}
    reveal({ first: true }); boot();
  };
}
startGate();
