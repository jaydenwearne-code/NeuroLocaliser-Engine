// app.js — NeuroLocaliser prototype UI. Pure consumer of the engine + causes layer (no model changes).
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { FINDINGS, NON_LATERALISED } from "../src/model/findings.js";
import { nameForSite } from "../src/data/syndromes.js";
import { causesFor, CATEGORIES, TEMPO } from "../src/data/causes.js";
import { umnLmnPattern, functionalFlag } from "../src/engine/patterns.js";
import { nextStepsFor } from "../src/data/nextSteps.js";
import { tractsFor, tractNarrative, whyNotOthers } from "../src/engine/tracts.js";
import { prevalenceOf } from "../src/model/prevalence.js";
import { neuraxisSVG } from "./neuraxis-diagram.js";
import { EXAM_TREE, flattenFindings } from "./exam-map.js";
import { checkPassphrase, GATE_STORAGE_KEY } from "./gate.js";
import { encodeCase, decodeCase } from "./case-url.js";
import { buildFeedbackURL } from "./feedback.js";

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

const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const fid = t => t.split("@")[0];
const sideTag = s => s === "left" ? "L" : s === "right" ? "R" : s === "midline" ? "M" : s === "bilateral" ? "B" : "•";
const desc = f => (FINDINGS[f] && FINDINGS[f].desc) || f;

const S = { mode:"localise", tokens:new Set(), dominant:"left", onset:"", sensoryLevel:"", distalReach:"", atlas:null };
const app = document.getElementById("app");

// ---- shareable case URLs: hydrate S from the URL hash on boot, keep the hash live on every change ----
const VALID_FINDINGS = new Set(Object.keys(FINDINGS));
const VALID_SITES = new Set(CANDIDATES.map(s => s.id));

function restoreFromURL() {
  const st = decodeCase(location.hash, { validFindings: VALID_FINDINGS, validSites: VALID_SITES });
  if (st.tokens) S.tokens = st.tokens;
  if (st.onset) S.onset = st.onset;
  if (st.mode) S.mode = st.mode;
  if (st.selected) S.selected = st.selected;
  if (st.dominant) S.dominant = st.dominant;
  if (st.sensoryLevel) S.sensoryLevel = st.sensoryLevel;
  if (st.distalReach) S.distalReach = st.distalReach;
}

function syncURL() {
  const hash = encodeCase(S);
  history.replaceState(null, "", hash ? "#" + hash : location.pathname + location.search);
}

// ================= LOCALISE =================
function renderLocalise() {
  app.innerHTML = `
  <div class="ctrls">
    <label>Dominant hemisphere <select id="dom"><option value="left">left</option><option value="right">right</option></select></label>
    <label>Onset (for causes) <select id="onset"><option value="">all</option>${TEMPO.map(t=>`<option value="${t.id}">${esc(t.label)}</option>`).join("")}</select></label>
    <label>Sensory level <input type="text" id="slevel" placeholder="e.g. T10" size="6"></label>
    <label>Distal reach <input type="text" id="reach" placeholder="e.g. knees" size="7"></label>
  </div>
  <div class="grid">
    <div class="pane">
      <h3>Examination findings</h3>
      <input class="search" id="search" placeholder="Search findings… (e.g. Horner, ataxia, gaze)">
      <div class="chips" id="chips"></div>
      <div class="accordion" id="acc">${examAccordion()}</div>
    </div>
    <div class="pane" id="results"></div>
  </div>`;
  document.getElementById("dom").value = S.dominant;
  document.getElementById("onset").value = S.onset;
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
  return `<div class="frow" data-fid="${f}" title="${esc(f)}"><div class="nm"><span class="fd-primary">${esc(desc(f))}</span> <span class="fid-mini">${esc(f)}</span></div><div class="sides">${btns}</div></div>`;
}

function wireLocalise() {
  document.getElementById("dom").onchange = e => { S.dominant = e.target.value; renderResults(); markSides(); };
  document.getElementById("onset").onchange = e => { S.onset = e.target.value; renderResults(); };
  document.getElementById("slevel").oninput = e => { S.sensoryLevel = e.target.value.trim(); renderResults(); };
  document.getElementById("reach").oninput = e => { S.distalReach = e.target.value.trim(); renderResults(); };
  document.getElementById("search").oninput = e => filterFindings(e.target.value.toLowerCase());
  document.getElementById("acc").onclick = e => { const b = e.target.closest("button[data-f]"); if (!b) return;
    toggleToken(`${b.dataset.f}@${b.dataset.s}`); };
  markSides();
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
function toggleToken(tok) { S.tokens.has(tok) ? S.tokens.delete(tok) : S.tokens.add(tok); renderChips(); renderResults(); markSides(); }
function markSides() {
  const acc = document.getElementById("acc"); if (!acc) return;
  acc.querySelectorAll("button[data-f]").forEach(b => b.classList.toggle("on", S.tokens.has(`${b.dataset.f}@${b.dataset.s}`)));
}
function renderChips() {
  const el = document.getElementById("chips");
  if (!S.tokens.size) { el.innerHTML = `<span class="fd" style="color:var(--faint);font-size:11.5px">No findings yet — tick from the exam steps, or try a worked example above.</span>`; return; }
  el.innerHTML = [...S.tokens].map(t => { const [f,s]=t.split("@");
    return `<span class="chip"><span class="sd">${sideTag(s)}</span>${esc(f)}<span class="x" data-t="${t}">×</span></span>`; }).join("");
  el.onclick = e => { const t = e.target.dataset.t; if (t) toggleToken(t); };
}

function renderResults() {
  const el = document.getElementById("results");
  if (!S.tokens.size) { el.innerHTML = `<h3>Possible lesions</h3><div class="empty">Add a finding — every lesion that could produce it appears, and the list narrows as you add more.</div>`; return; }
  try {
  const total = S.tokens.size;
  const r = solve(S.tokens, { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined, distalReach: S.distalReach || undefined });
  const cands = r.differential;
  if (!cands.length) {
    const fnd = functionalFlag(S.tokens);
    const fmsg = fnd.functional
      ? `<div class="multi" style="border-color:var(--gold)"><b>⚠ Consider functional.</b> ${esc(fnd.note)}</div>`
      : "";
    el.innerHTML = `<h3>Possible lesions</h3>${fmsg}<div class="empty">No site produces any of these findings on the sides given — re-check a side${fnd.functional?", or this is likely non-organic (see above)":", or this may be non-organic"}.</div>`;
    return;
  }
  const list = r.display;
  // S.selected is the user's click-override; persist it while still shown, else the engine's default.
  let sel = list.find(c => c.site.id === S.selected) || list.find(c => c.site.id === r.defaultSite) || list[0];
  S.selected = sel.site.id;
  syncURL();
  const tf = tractsFor(S.tokens, { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined });
  el.innerHTML = resultHeader(sel, list, total, r)
    + whereCard(list, cands, total, r)
    + whyCard(tf, sel, total)
    + whatCard(sel.site);
  const nx = el.querySelector(".neuraxis");
  if (nx) nx.onclick = e => { const g = e.target.closest("[data-k]"); if (!g) return; S.selected = g.dataset.k; renderResults(); };
  } catch (err) { el.innerHTML = `<h3>Possible lesions</h3>` + errorPanel(err); return; }
  const dl = document.getElementById("difflist");
  if (dl) dl.onclick = e => { const row = e.target.closest(".drow"); if (!row) return; S.selected = row.dataset.k; renderResults(); };
}

function siteName(site){ const e = nameForSite(site); return e.name; }
function siteLoc(site){ return `${site.side} · ${site.level} · ${site.part}`; }

// cap is trusted HTML (literal labels we control, e.g. "Why" or `Where <span…>(N)</span>`) — not user input.
function card(capHTML, body) {
  return `<section class="out-card"><div class="out-cap">${capHTML}</div>${body}</section>`;
}

// A "Report a problem" link → the external form, pre-filled with the LIVE case URL (syncURL ran first),
// the top candidate, and the findings. Only teaching-vocabulary findings leave, only on click.
function feedbackButton(list) {
  const top = (list && list[0]) ? `${siteName(list[0].site)} (${list[0].site.id})` : "";
  const url = buildFeedbackURL({ caseUrl: location.href, topResult: top, findings: [...S.tokens].join(", ") });
  return `<a class="report-btn" href="${esc(url)}" target="_blank" rel="noopener" title="Opens a feedback form — do not include patient identifiers">⚑ Report a problem</a>`;
}

// A friendly failure panel — never a blank/broken page. Carries the case link + a report button so a
// tester can send exactly what broke. Technical detail is tucked behind a disclosure.
function errorPanel(err) {
  const url = buildFeedbackURL({ caseUrl: location.href, topResult: "(render error)", findings: [...S.tokens].join(", ") });
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
  return `<div class="out-head">
    <div class="oh-lead"><div class="oh-lead-txt"><b>${esc(siteName(sel.site))}</b><span class="oh-loc">${esc(siteLoc(sel.site))}${sel.site.territory?` · ${esc(sel.site.territory)}`:""}</span></div>${feedbackButton(list)}</div>
    <p class="oh-status">${status}</p>${funcFlag}</div>`;
}

// ① Where — the differential list + localisation annotations + (collapsed) ruled-out
function whereCard(list, cands, total, r) {
  const nAll = r.explainAll.length;
  const near = (!nAll && r.nearFit)
    ? `<div class="annot"><b>Near-fit:</b> ${esc(siteName(r.nearFit.site))} explains all but <code>${esc(r.nearFit.missing)}</code> — re-check that finding, or consider a second lesion.</div>` : "";
  const multi = (!nAll && r.multi)
    ? `<div class="multi"><b>⚠ Likely multifocal.</b> Minimal cover — ${r.multi.sites.length} sites: ${r.multi.sites.map(s=>esc(siteName(s.site))).join(" + ")}${r.multi.uncovered.length?`; still unexplained: ${r.multi.uncovered.map(esc).join(", ")}`:""}.</div>` : "";
  let annot = "";
  if (r.level && r.level.applies) annot += `<div class="annot"><b>Sensory level:</b> ${esc(r.level.note || (r.level.landmark||r.level.segment||""))}</div>`;
  if (r.length && r.length.applies) annot += `<div class="annot"><b>Length:</b> ${esc(r.length.note||"")}${r.length.glove?" · stocking-glove":""}</div>`;
  const rows = list.map(c => {
    const on = c.site.id === S.selected ? " on" : "";
    const w = Math.round((c.n/total)*54);
    const fit = c.n===total ? `<span class="dall">✓ all</span>` : `<span class="dfrac">${c.n}/${total}</span>`;
    return `<div class="drow${on}" data-k="${esc(c.site.id)}"><div class="dn"><b>${esc(siteName(c.site))}</b><span class="dloc">${esc(siteLoc(c.site))}${c.site.territory?` · ${esc(c.site.territory)}`:""}</span></div><div class="dfit">${fit}<div class="dbar" style="width:${w}px"></div></div></div>`;
  }).join("");
  const ruled = (r.ruledOut && r.ruledOut.length)
    ? `<details class="ruledout" style="margin-top:6px"><summary style="font-size:11.5px;color:var(--muted)">Ruled out by a normal finding <span class="c">${r.ruledOut.length}</span></summary>
        <div class="why-list" style="margin-top:4px">${r.ruledOut.map(x => {
          const side = x.contradictedBy.split("@")[1];
          return `<div class="why-item"><span class="k no">✗</span><span class="t">${esc(siteName(x.site))}</span><span class="d">would also cause ${esc(desc(fid(x.contradictedBy)))} on the ${esc(side)} — which is normal here</span></div>`;
        }).join("")}</div></details>`
    : "";
  const cap = `Where <span class="oc-n">(${list.length})</span>`;
  return card(cap, `<div class="difflist" id="difflist">${rows}</div>${near}${multi}${annot}${ruled}`);
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

function whyBlock(c, total, collapsed = false) {
  const observed = [...S.tokens];
  const explained = new Set(c.explained);
  const ok = c.explained.map(t=>`<div class="why-item"><span class="k ok">✓</span><span class="t">${esc(t)}</span><span class="d">${esc(desc(fid(t)))}</span></div>`).join("");
  const no = observed.filter(t=>!explained.has(t)).map(t=>`<div class="why-item"><span class="k no">✗</span><span class="t">${esc(t)}</span><span class="d">not explained by this site</span></div>`).join("");
  const missed = [...c.exp].filter(t=>!S.tokens.has(t));
  const warn = missed.map(t=>`<div class="why-item"><span class="k warn">⚠</span><span class="t">${esc(t)}</span><span class="d">predicted here but not reported</span></div>`).join("");
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
    return card("Why", `${umnlmn}${whyBlock(sel, total, false)}`);
  }
  const course = tf.map(t => `<p class="synth"><b>Course.</b> ${esc(tractNarrative(t.tract))}</p>`).join("");
  const opts = { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined };
  const wn = whyNotOthers(S.tokens, sel.site, opts);
  const common = prevalenceOf(sel.site) === 2;
  const tractLabels = tf.map(t => esc(t.tract.label)).join(" and ");
  const whyThis = `<p class="synth"><b>Why this site.</b> The deficit is confined to ${tractLabels} fibres with no accompanying signs, so the lesion lies where the tract runs in relative isolation — a small, deep lesion such as ${esc(siteName(sel.site))}.${common ? " Lesions here are also common." : ""}</p>`;
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
  return card("Why", `${course}${umnlmn}${whyThis}${whyNot}${diagram}${whyBlock(sel, total, true)}`);
}

// ③ What — causes + sieve + next steps (whatBlock body, wrapped in the card shell)
function whatCard(site) {
  return card("What", whatBlock(site));
}

function whatBlock(site) {
  const res = causesFor(site, { onset: S.onset || undefined });
  const ph = nameForSite(site);
  const red = ph.red ? `<div class="multi" style="border-style:solid;border-color:var(--red);background:var(--red-bg)"><b>Red flag:</b> ${esc(ph.red)}</div>` : "";
  const groups = res.byCategory.map(g => `
    <div class="catgrp"><div class="cathead"><span class="catdot" style="background:var(${g.tint})"></span>${esc(g.label)}</div>
      ${g.causes.map(c=>`<div class="cause"><span class="cn">${esc(c.name)}</span><span class="tp">${c.tempo.map(x=>x[0].toUpperCase()).join("")}</span><span class="lk">${c.likelihood}</span>${c.red?`<span class="rf">RED</span>`:""}</div>`).join("")}
    </div>`).join("");
  const compN = (res.completion || []).reduce((n, g) => n + g.causes.length, 0);
  const sieve = compN ? `
    <details class="sieve" style="margin-top:8px"><summary>Complete the surgical sieve <span class="c">+${compN}</span></summary>
      <p class="derived" style="margin:4px 0 6px">Derived from site type — the other sieve categories a lesion here could fall into (not vetted per site).</p>
      ${res.completion.map(g => `
        <div class="catgrp"><div class="cathead"><span class="catdot" style="background:var(${g.tint})"></span>${esc(g.label)}</div>
          ${g.causes.map(c=>`<div class="cause generic"><span class="cn">${esc(c.name)}</span><span class="tp">${c.tempo.map(x=>x[0].toUpperCase()).join("")}</span><span class="lk">${c.likelihood}</span>${c.red?`<span class="rf">RED</span>`:""}</div>`).join("")}
        </div>`).join("")}
    </details>` : "";
  const nx = nextStepsFor(site);
  const urgTint = nx.urgency === "emergency" ? "--red" : nx.urgency === "urgent" ? "--gold" : "--faint";
  const urgLabel = nx.urgency === "emergency" ? "EMERGENCY" : nx.urgency === "urgent" ? "URGENT" : "routine";
  const next = `<h3 style="margin-top:14px">Next steps <span class="derived">(educational — not clinical advice)</span></h3>
    <div class="multi" style="border-style:solid;border-color:var(${urgTint})"><b>Urgency:</b> ${esc(urgLabel)} · <b>Referral:</b> ${esc(nx.referral)}</div>
    <ul class="nextlist">${nx.investigations.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
    ${nx.curated ? "" : `<p class="derived">Investigations derived from site type — not individually curated.</p>`}`;
  return `${S.onset || res.derived ? `<p class="what-cap">${S.onset?`<span style="color:var(--terra)">${esc(S.onset)}</span> onset`:""}${res.derived?` <span class="derived">(derived from site type — not yet individually curated)</span>`:""}</p>` : ""}
    ${red}
    ${groups || `<div class="empty">No causes for this onset — try a different tempo.</div>`}
    ${sieve}
    ${next}`;
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
  const groups = res.byCategory.map(g=>`<div class="catgrp"><div class="cathead"><span class="catdot" style="background:var(${g.tint})"></span>${esc(g.label)}</div>${g.causes.map(c=>`<div class="cause"><span class="cn">${esc(c.name)}</span><span class="tp">${c.tempo.map(x=>x[0].toUpperCase()).join("")}</span>${c.red?`<span class="rf">RED</span>`:""}</div>`).join("")}</div>`).join("");
  document.getElementById("adetail").innerHTML = `<h3>${esc(siteName(site))}</h3>
    <div class="where-best" style="margin-bottom:10px"><div class="loc">${esc(siteLoc(site))}</div>${site.territory?`<div class="terr">${esc(site.territory)}</div>`:""}</div>
    <h3>Produces (findings)</h3><div class="why-list">${rows||'<div class="empty">—</div>'}</div>
    <h3 style="margin-top:14px">Causes</h3>${groups}`;
}

// ================= modes + bootstrap =================
function boot() {
  restoreFromURL();
  document.getElementById("modes").onclick = e => { const m = e.target.dataset.mode; if (!m || m===S.mode) return;
    S.mode = m; document.querySelectorAll("#modes button").forEach(b=>b.classList.toggle("on", b.dataset.mode===m));
    S.mode==="localise" ? renderLocalise() : renderAtlas(); syncURL(); };
  // Reflect the (possibly URL-restored) mode in the toggle before the first render.
  document.querySelectorAll("#modes button").forEach(b => b.classList.toggle("on", b.dataset.mode === S.mode));
  try { S.mode === "atlas" ? renderAtlas() : renderLocalise(); }
  catch (err) { app.innerHTML = errorPanel(err); }
}

function reveal() {
  document.getElementById("gate").classList.remove("show");
  document.getElementById("app-shell").classList.add("show");
}

async function startGate() {
  const gateEl = document.getElementById("gate");
  if (localStorage.getItem(GATE_STORAGE_KEY) === "ok") { reveal(); boot(); return; }
  gateEl.classList.add("show");
  document.getElementById("gate-form").onsubmit = async ev => {
    ev.preventDefault();
    const errEl = document.getElementById("gate-err");
    if (!document.getElementById("gate-ack").checked) { errEl.textContent = "Please tick the acknowledgment to continue."; return; }
    const okPass = await checkPassphrase(document.getElementById("gate-pass").value);
    if (!okPass) { errEl.textContent = "Incorrect passphrase."; return; }
    try { localStorage.setItem(GATE_STORAGE_KEY, "ok"); } catch {}
    reveal(); boot();
  };
}
startGate();
