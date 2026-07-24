// app.js — NeuroLocaliser prototype UI. Pure consumer of the engine + causes layer (no model changes).
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { FINDINGS, NON_LATERALISED } from "../src/model/findings.js";
import { nameForSite } from "../src/data/syndromes.js";
import { causesFor, CATEGORIES, TEMPO } from "../src/data/causes.js";
import { umnLmnPattern, functionalFlag } from "../src/engine/patterns.js";
import { nextStepsFor } from "../src/data/nextSteps.js";
import { EXAM_FLOW, PRESETS } from "./exam-map.js";

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
      <div class="presets" id="presets">${PRESETS.map((p,i)=>`<button data-p="${i}">${esc(p.label)}</button>`).join("")}</div>
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

function examAccordion() {
  const used = new Set(EXAM_FLOW.flatMap(s => s.findings));
  const other = Object.keys(FINDINGS).filter(f => !used.has(f));
  const steps = other.length ? [...EXAM_FLOW, { id:"other", label:"Other findings", findings:other }] : EXAM_FLOW;
  return steps.map(step => `
    <details data-step="${step.id}"><summary>${esc(step.label)}<span class="c">${step.findings.filter(f=>FINDINGS[f]).length}</span></summary>
      ${step.findings.filter(f=>FINDINGS[f]).map(f=>frow(f)).join("")}
    </details>`).join("");
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
  document.getElementById("presets").onclick = e => { const i = e.target.dataset.p; if (i==null) return;
    S.tokens = new Set(PRESETS[+i].tokens); renderChips(); renderResults(); markSides(); };
  document.getElementById("acc").onclick = e => { const b = e.target.closest("button[data-f]"); if (!b) return;
    toggleToken(`${b.dataset.f}@${b.dataset.s}`); };
  markSides();
}
function filterFindings(q) {
  const acc = document.getElementById("acc");
  acc.querySelectorAll(".frow").forEach(r => {
    const f = r.dataset.fid; const hit = !q || f.includes(q) || desc(f).toLowerCase().includes(q);
    r.style.display = hit ? "" : "none";
  });
  acc.querySelectorAll("details").forEach(d => { if (q) d.open = true; });
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
  el.innerHTML = diffBlock(list, cands, total, r.explainAll.length, r) + whyBlock(sel, total) + whatBlock(sel.site);
  } catch (err) { el.innerHTML = `<h3>Possible lesions</h3><div class="empty" style="text-align:left;color:var(--contra)">render error: ${esc(String(err))}<br><small>${esc((err.stack||"").split("\n").slice(0,4).join(" | "))}</small></div>`; return; }
  const dl = document.getElementById("difflist");
  if (dl) dl.onclick = e => { const row = e.target.closest(".drow"); if (!row) return; S.selected = row.dataset.k; renderResults(); };
}

function siteName(site){ const e = nameForSite(site); return e.name; }
function siteLoc(site){ return `${site.side} · ${site.level} · ${site.part}`; }

function diffBlock(list, cands, total, nAll, r) {
  const narrow = nAll
    ? `<b>${nAll}</b> lesion${nAll>1?"s":""} explain${nAll>1?"":"s"} all ${total} finding${total>1?"s":""}${nAll>1?` — add findings to narrow`:""}.`
    : `<b>No single lesion</b> explains all ${total} findings — ranked by how many each explains (best ${cands[0].n}/${total}).`;
  // near-fit (drop-1, non-localising) — surfaced BEFORE the multifocal hypothesis
  let near = "";
  if (!nAll && r.nearFit) near = `<div class="annot"><b>Near-fit:</b> ${esc(siteName(r.nearFit.site))} explains all but <code>${esc(r.nearFit.missing)}</code> — re-check that finding, or consider a second lesion.</div>`;
  let multi = "";
  if (!nAll && r.multi) multi = `<div class="multi"><b>⚠ Likely multifocal.</b> Minimal cover — ${r.multi.sites.length} sites: ${r.multi.sites.map(s=>esc(siteName(s.site))).join(" + ")}${r.multi.uncovered.length?`; still unexplained: ${r.multi.uncovered.map(esc).join(", ")}`:""}.</div>`;
  // functional (non-organic) positive signs — independent of localisation. Suppressed (shown only as a muted
  // note, never the alarming banner) whenever an un-fakeable objective finding is present, so a serious sign
  // is never masked as functional.
  const fnd = functionalFlag(S.tokens);
  const funcFlag = fnd.functional
    ? `<div class="multi" style="border-color:var(--gold);background:var(--gold-bg,transparent)"><b>⚠ Consider functional.</b> ${esc(fnd.note)}</div>`
    : fnd.suppressed
    ? `<div class="annot"><b>Functional sign noted:</b> ${esc(fnd.note)}</div>`
    : "";
  let annot = "";
  if (r.level && r.level.applies) annot += `<div class="annot"><b>Sensory level:</b> ${esc(r.level.note || (r.level.landmark||r.level.segment||""))}</div>`;
  if (r.length && r.length.applies) annot += `<div class="annot"><b>Length:</b> ${esc(r.length.note||"")}${r.length.glove?" · stocking-glove":""}</div>`;
  const pat = umnLmnPattern(S.tokens);
  const umnlmn = pat.verdict
    ? `<div class="annot"><b>${pat.verdict === "mixed" ? "UMN + LMN (mixed)" : pat.verdict + " pattern"}:</b> ${esc(pat.note)}</div>`
    : "";
  const rows = list.map(c => {
    const on = c.site.id === S.selected ? " on" : "";
    const w = Math.round((c.n/total)*54);
    const fit = c.n===total ? `<span class="dall">✓ all</span>` : `<span class="dfrac">${c.n}/${total}</span>`;
    return `<div class="drow${on}" data-k="${esc(c.site.id)}"><div class="dn"><b>${esc(siteName(c.site))}</b><span class="dloc">${esc(siteLoc(c.site))}${c.site.territory?` · ${esc(c.site.territory)}`:""}</span></div><div class="dfit">${fit}<div class="dbar" style="width:${w}px"></div></div></div>`;
  }).join("");
  return `<h3>Possible lesions <span style="color:var(--faint);font-weight:600">(${list.length})</span></h3>
    <p class="narrow">${narrow}</p>
    ${near}${multi}${funcFlag}${umnlmn}${annot}
    <div class="difflist" id="difflist">${rows}</div>
    <p style="font-size:11px;color:var(--faint);margin:6px 0 0">Click a lesion to see its reasoning & causes below.</p>`;
}

function whyBlock(c, total) {
  const observed = [...S.tokens];
  const explained = new Set(c.explained);
  const ok = c.explained.map(t=>`<div class="why-item"><span class="k ok">✓</span><span class="t">${esc(t)}</span><span class="d">${esc(desc(fid(t)))}</span></div>`).join("");
  const no = observed.filter(t=>!explained.has(t)).map(t=>`<div class="why-item"><span class="k no">✗</span><span class="t">${esc(t)}</span><span class="d">not explained by this site</span></div>`).join("");
  const missed = [...c.exp].filter(t=>!S.tokens.has(t));
  const warn = missed.map(t=>`<div class="why-item"><span class="k warn">⚠</span><span class="t">${esc(t)}</span><span class="d">predicted here but not reported</span></div>`).join("");
  return `<h3 style="margin-top:14px">Why — <span style="color:var(--terra)">${esc(siteName(c.site))}</span> explains ${c.n}/${total}</h3>
    <div class="why-list">${ok}${no}</div>
    ${warn?`<details style="margin-top:6px"><summary style="font-size:11.5px;color:var(--muted)">Predicted here but not reported <span class="c">${missed.length}</span></summary><div class="why-list" style="margin-top:4px">${warn}</div></details>`:""}`;
}

function whatBlock(site) {
  const res = causesFor(site, { onset: S.onset || undefined });
  const ph = nameForSite(site);
  const red = ph.red ? `<div class="multi" style="border-style:solid;border-color:var(--red);background:var(--red-bg)"><b>Red flag:</b> ${esc(ph.red)}</div>` : "";
  const groups = res.byCategory.map(g => `
    <div class="catgrp"><div class="cathead"><span class="catdot" style="background:var(${g.tint})"></span>${esc(g.label)}</div>
      ${g.causes.map(c=>`<div class="cause"><span class="cn">${esc(c.name)}</span><span class="tp">${c.tempo.map(x=>x[0].toUpperCase()).join("")}</span><span class="lk">${c.likelihood}</span>${c.red?`<span class="rf">RED</span>`:""}</div>`).join("")}
    </div>`).join("");
  const nx = nextStepsFor(site);
  const urgTint = nx.urgency === "emergency" ? "--red" : nx.urgency === "urgent" ? "--gold" : "--faint";
  const urgLabel = nx.urgency === "emergency" ? "EMERGENCY" : nx.urgency === "urgent" ? "URGENT" : "routine";
  const next = `<h3 style="margin-top:14px">Next steps <span class="derived">(educational — not clinical advice)</span></h3>
    <div class="multi" style="border-style:solid;border-color:var(${urgTint})"><b>Urgency:</b> ${esc(urgLabel)} · <b>Referral:</b> ${esc(nx.referral)}</div>
    <ul class="nextlist">${nx.investigations.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
    ${nx.curated ? "" : `<p class="derived">Investigations derived from site type — not individually curated.</p>`}`;
  return `<h3 style="margin-top:14px">What — causes${S.onset?` · <span style="color:var(--terra)">${esc(S.onset)}</span> onset`:""}${res.derived?` <span class="derived">(derived from site type — not yet individually curated)</span>`:""}</h3>
    ${red}
    ${groups || `<div class="empty">No causes for this onset — try a different tempo.</div>`}
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

// ================= modes =================
document.getElementById("modes").onclick = e => { const m = e.target.dataset.mode; if (!m || m===S.mode) return;
  S.mode = m; document.querySelectorAll("#modes button").forEach(b=>b.classList.toggle("on", b.dataset.mode===m));
  S.mode==="localise" ? renderLocalise() : renderAtlas(); };
renderLocalise();
