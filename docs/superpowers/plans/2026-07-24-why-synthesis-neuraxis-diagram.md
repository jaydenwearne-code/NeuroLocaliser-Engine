# "Why" Synthesis + Neuraxis Diagram (Sub-project B) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the finding-echo "why" with tract-level synthesis, and add a derived, clickable neuraxis diagram — both generated from a new tract taxonomy the engine derives over.

**Architecture:** `src/model/tracts.js` (declarative long-tract anatomy + neuraxis ordering) → `src/engine/tracts.js` `tractsFor()` maps observed findings to implicated tracts and their candidate sites ordered rostro-caudally → `app/neuraxis-diagram.js` builds an inline SVG → `app/app.js` renders the synthesis narrative + diagram, falling back to today's per-site "why" for non-tract findings.

**Tech Stack:** Zero-dependency ES modules, Node v24 (off PATH — see Global Constraints). Standalone test scripts with a local `ok(label, cond)` helper. Inline SVG strings (no framework).

## Global Constraints

- **Node is off PATH.** Prefix every `node`/`npm` command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- **Zero dependencies, no build step, `"type": "module"`.** No new packages.
- **Derive, don't store.** The synthesis prose and the diagram are generated from the tract taxonomy + the derived candidate set — not from stored per-pattern paragraphs. `tractsFor` returns structured facts; the app composes sentences/SVG from them.
- **Model layer for anatomy.** `tracts.js` lives in `src/model/`; the engine imports it. Do not import `src/data/syndromes.js` into the engine or the diagram builder — keep them phonebook-free (the app passes display labels in).
- **Additive to the engine.** Do not change localisation, ranking, `differential`, `solve`, causes, or the scored path. `tractsFor` is new; the `whyBlock` change is app-only and guarded by a fallback.
- **Core tracts only:** corticospinal, spinothalamic, dorsal-column–medial-lemniscus. Corticobulbar is out of scope.
- **Test wiring is mandatory.** New suites go into both the `test` script in `package.json` and the README `npm test` chain.
- **Branch off `main`:**
  ```bash
  cd "/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-engine"
  git checkout -b why-synthesis-neuraxis
  ```

---

### Task 1: Tract taxonomy + `tractsFor` engine derivation

**Files:**
- Create: `src/model/tracts.js`
- Create: `src/engine/tracts.js`
- Create: `test/tracts.test.js`
- Modify: `package.json:7` (append suite), `README.md` (append suite)

**Interfaces:**
- `src/model/tracts.js` produces: `export const NEURAXIS: string[]`; `export function neuraxisIndex(level): number`; `export const TRACTS: Tract[]` where `Tract = { id, label, findings: string[], together, course: {level,label}[], decussation: {between:[string,string]}|{inLevel:string}, crossingNote }`.
- `src/engine/tracts.js` produces: `export function tractsFor(observedSet, opts?): { tract, findingsMatched: string[], sides: string[], sites: {site,level,neuraxisIndex,explained}[], decussation }[]`.

- [ ] **Step 1: Write the failing test**

Create `test/tracts.test.js`:

```js
// tracts.test.js — Sub-project B: long-tract taxonomy + tractsFor derivation.
import { TRACTS, NEURAXIS, neuraxisIndex } from "../src/model/tracts.js";
import { tractsFor } from "../src/engine/tracts.js";
import { STRUCTURES } from "../src/model/structures.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };
const opts = { dominantSide: "left" };

// ---- consistency guard: every course level has a structure producing a tract finding ----
for (const t of TRACTS) {
  for (const wp of t.course) {
    const has = STRUCTURES.some(s => s.level === wp.level && t.findings.includes(s.produces));
    ok(`${t.id}: course level ${wp.level} has a producing structure`, has);
  }
}

// ---- corticospinal implicated by arm+leg weakness, and no other core tract ----
const cst = tractsFor(new Set(["weak_arm@left", "weak_leg@left"]), opts);
ok("weak_arm+weak_leg implicates exactly one tract", cst.length === 1);
ok("that tract is corticospinal", cst[0] && cst[0].tract.id === "corticospinal");

// ---- candidate sites ordered rostral→caudal by neuraxis ----
const idx = id => cst[0].sites.findIndex(s => s.site.id === id);
ok("cortex site precedes pons site", idx("right_cortex_mca") > -1 && idx("right_pons_basis_pontis") > -1
   && idx("right_cortex_mca") < idx("right_pons_basis_pontis"));
ok("pons precedes medulla", idx("right_pons_basis_pontis") < idx("right_medulla_medial"));
ok("medulla precedes the cord composite", idx("right_medulla_medial") < idx("left_cord_hemi"));
ok("sites are sorted by non-decreasing neuraxisIndex",
   cst[0].sites.every((s, i, a) => i === 0 || a[i - 1].neuraxisIndex <= s.neuraxisIndex));

// ---- corticospinal decussation is medulla→cord ----
ok("corticospinal decussates between medulla and cord",
   cst[0].decussation.between && cst[0].decussation.between[0] === "medulla" && cst[0].decussation.between[1] === "cord");

// ---- multi-tract (Brown-Séquard): all three long tracts implicated ----
const bs = tractsFor(new Set(["weak_arm@left", "dorsal_sensory@left", "spinothalamic@right"]), opts);
const ids = new Set(bs.map(t => t.tract.id));
ok("Brown-Séquard implicates corticospinal", ids.has("corticospinal"));
ok("Brown-Séquard implicates dorsal_column", ids.has("dorsal_column"));
ok("Brown-Séquard implicates spinothalamic", ids.has("spinothalamic"));

// ---- non-tract input → empty (fallback) ----
ok("a non-tract finding implicates no tract", tractsFor(new Set(["dysarthria@none"]), opts).length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/tracts.test.js
```
Expected: FAIL — `Cannot find module '../src/model/tracts.js'`.

- [ ] **Step 3: Create `src/model/tracts.js`**

```js
// tracts.js — the long ascending/descending tracts as DECLARATIVE anatomy. New model the engine derives
// the "why" synthesis and the neuraxis diagram from (in keeping with "derive, don't store"). Each tract
// states the findings it carries, its rostro-caudal course at NEURAXIS-level granularity (the `label`
// carries the anatomical detail), and where it decussates (so laterality flips). Course levels are verified
// against structures.js by test/tracts.test.js. Corticobulbar is a deliberate fast-follow (not here).

// Rostral → caudal. `aphasia_subcortical` (striatocapsular) sits with the deep subcortex.
export const NEURAXIS = ["cortex", "subcortex", "aphasia_subcortical", "midbrain", "pons", "medulla", "cord"];
export function neuraxisIndex(level) {
  const i = NEURAXIS.indexOf(level);
  return i === -1 ? NEURAXIS.length : i; // unknown levels sort last
}

export const TRACTS = [
  {
    id: "corticospinal", label: "corticospinal tract",
    findings: ["weak_arm", "weak_leg"],
    together: "the arm and leg fibres run close together, so a single lesion weakens both",
    course: [
      { level: "cortex",   label: "motor cortex" },
      { level: "subcortex", label: "corona radiata / internal capsule" },
      { level: "midbrain", label: "cerebral peduncle" },
      { level: "pons",     label: "basis pontis" },
      { level: "medulla",  label: "medullary pyramid" },
      { level: "cord",     label: "lateral corticospinal tract" },
    ],
    decussation: { between: ["medulla", "cord"], label: "pyramidal decussation" },
    crossingNote: "contralateral to the weakness above the pyramidal decussation, ipsilateral in the cord below it",
  },
  {
    id: "spinothalamic", label: "spinothalamic tract",
    findings: ["spinothalamic"],
    together: "the pain and temperature fibres",
    course: [
      { level: "subcortex", label: "VPL thalamus" },
      { level: "midbrain", label: "lateral tegmentum" },
      { level: "pons",     label: "lateral tegmentum" },
      { level: "medulla",  label: "lateral medulla" },
      { level: "cord",     label: "anterolateral cord" },
    ],
    decussation: { inLevel: "cord", label: "anterior white commissure (crosses within 1–2 segments)" },
    crossingNote: "contralateral to the pain/temperature loss throughout, because it crosses low in the cord",
  },
  {
    id: "dorsal_column", label: "dorsal column–medial lemniscus",
    findings: ["dorsal_sensory", "sensory_ataxia"],
    together: "the vibration and proprioception fibres",
    course: [
      { level: "subcortex", label: "VPL thalamus" },
      { level: "midbrain", label: "medial lemniscus" },
      { level: "pons",     label: "medial lemniscus" },
      { level: "medulla",  label: "gracile / cuneate nuclei" },
      { level: "cord",     label: "dorsal columns" },
    ],
    decussation: { between: ["medulla", "cord"], label: "sensory (internal arcuate) decussation" },
    crossingNote: "contralateral above the medullary sensory decussation, ipsilateral in the cord below it",
  },
];
```

- [ ] **Step 4: Create `src/engine/tracts.js`**

```js
// tracts.js (engine) — map observed findings to the long tract(s) they implicate, with the candidate
// lesion sites arranged along each tract's course. Structured facts only (no prose / no SVG); the app
// composes the narrative and the diagram from these. Candidate sites come from differential(), so the
// known-negative exclusion + prevalence ranking already applied. A site is "on the tract" when it PREDICTS
// one of the tract's findings — keyed on shared findings, not (level,part), so composites (hemicord, whole
// MCA) map correctly even though the cord/anterior primitive is a buildingBlock.
import { TRACTS, neuraxisIndex } from "../model/tracts.js";
import { differential } from "./inverse.js";

const idOf = tok => tok.split("@")[0];
const sideOf = tok => tok.split("@")[1];

export function tractsFor(observedSet, opts = {}) {
  const observed = [...observedSet];
  const cands = differential(observedSet, opts);
  const out = [];
  for (const tract of TRACTS) {
    const findingSet = new Set(tract.findings);
    const matched = observed.filter(t => findingSet.has(idOf(t)));
    if (!matched.length) continue;
    const sides = [...new Set(matched.map(sideOf))];
    const sites = cands
      .filter(c => [...c.exp].some(t => findingSet.has(idOf(t))))
      .map(c => ({ site: c.site, level: c.site.level, neuraxisIndex: neuraxisIndex(c.site.level), explained: c.explained }))
      .sort((a, b) => a.neuraxisIndex - b.neuraxisIndex || a.site.id.localeCompare(b.site.id));
    out.push({ tract, findingsMatched: matched, sides, sites, decussation: tract.decussation });
  }
  return out;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/tracts.test.js
```
Expected: PASS — final line `N passed, 0 failed` (no FAIL lines). If the consistency guard fails for a level, a course `level` lacks a producing structure — correct the course, not the guard.

- [ ] **Step 6: Wire the suite into `package.json` and README**

In `package.json` line 7, append to the chain: ` && node test/tracts.test.js`.
In `README.md`, after the `node test/ranking-realism.test.js …` line, add:
```
node test/tracts.test.js         # Sub-project B — long-tract taxonomy + tractsFor derivation
```

- [ ] **Step 7: Run the full suite**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: `ALL SUITES GREEN`.

- [ ] **Step 8: Commit**

```bash
git add src/model/tracts.js src/engine/tracts.js test/tracts.test.js package.json README.md
git commit -m "feat(engine): tract taxonomy + tractsFor derivation (why-synthesis foundation)"
```

---

### Task 2: Derived neuraxis SVG builder

**Files:**
- Create: `app/neuraxis-diagram.js`
- Create: `test/neuraxis-diagram.test.js`
- Modify: `package.json:7`, `README.md`

**Interfaces:**
- Produces: `export function neuraxisSVG(tractsResult, opts?): string` where `opts = { selectedId?: string|null, labelFor?: (site)=>string }`. Returns a self-contained `<svg>…</svg>` string. Each candidate site renders a node carrying `data-k="<site.id>"`; each tract's decussation renders a marker with class `decussation`.

- [ ] **Step 1: Write the failing test**

Create `test/neuraxis-diagram.test.js`:

```js
// neuraxis-diagram.test.js — the derived SVG builder is a pure string function (DOM-free, testable in node).
import { neuraxisSVG } from "../app/neuraxis-diagram.js";
import { tractsFor } from "../src/engine/tracts.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

const tf = tractsFor(new Set(["weak_arm@left", "weak_leg@left"]), { dominantSide: "left" });
const svg = neuraxisSVG(tf, { selectedId: "right_pons_basis_pontis", labelFor: s => s.id });

ok("returns an <svg>", typeof svg === "string" && svg.trim().startsWith("<svg") && svg.includes("</svg>"));
ok("has a node for each candidate site on the tract",
   tf[0].sites.every(s => svg.includes(`data-k="${s.site.id}"`)));
ok("marks the decussation", svg.includes('class="decussation"'));
ok("emphasises the selected node", svg.includes('data-k="right_pons_basis_pontis"') && /data-sel="1"[^>]*data-k="right_pons_basis_pontis"|data-k="right_pons_basis_pontis"[^>]*data-sel="1"/.test(svg));
ok("empty input yields empty string", neuraxisSVG([], {}) === "");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-diagram.test.js
```
Expected: FAIL — `Cannot find module '../app/neuraxis-diagram.js'`.

- [ ] **Step 3: Create `app/neuraxis-diagram.js`**

```js
// neuraxis-diagram.js — build a schematic, DERIVED neuraxis SVG for the implicated tract(s). Pure string
// in → string out (no DOM), so it is unit-testable in node. Rostral (cortex) at top → caudal (cord) at
// bottom; each tract is a line down its course that visibly crosses sides at its decussation; each candidate
// lesion is a node (data-k=<site.id>) placed in its level's band; the selected node is emphasised
// (data-sel="1"). The app wires node clicks to selection. Theme-aware via currentColor + CSS vars.
import { NEURAXIS } from "../src/model/tracts.js";

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ROW_H = 46, TOP = 24, LEFT_LANE = 46, RIGHT_LANE = 104, NODE_X = 150, W = 430;

export function neuraxisSVG(tracts, opts = {}) {
  if (!tracts || !tracts.length) return "";
  const { selectedId = null, labelFor = s => s.id } = opts;

  // rows = the union of course levels across implicated tracts, in NEURAXIS order
  const levelsUsed = new Set();
  for (const t of tracts) for (const wp of t.course) levelsUsed.add(wp.level);
  for (const t of tracts) for (const s of t.sites) levelsUsed.add(s.level);
  const rows = NEURAXIS.filter(l => levelsUsed.has(l));
  const rowY = level => TOP + rows.indexOf(level) * ROW_H + ROW_H / 2;
  const H = TOP * 2 + rows.length * ROW_H;

  // level band labels
  let bands = rows.map(l =>
    `<text x="6" y="${rowY(l) + 4}" class="nx-band">${esc(l.replace(/_/g, " "))}</text>`).join("");

  // decussation markers (dashed line between the two levels, or within a level)
  const decu = tracts.map(t => {
    const d = t.decussation;
    let y;
    if (d.between) {
      const a = rows.indexOf(d.between[0]), b = rows.indexOf(d.between[1]);
      if (a < 0 || b < 0) return "";
      y = TOP + Math.max(a, b) * ROW_H + 2; // just above the caudal band
    } else if (d.inLevel) {
      const i = rows.indexOf(d.inLevel); if (i < 0) return "";
      y = rowY(d.inLevel);
    } else return "";
    return `<g class="decussation"><line x1="${LEFT_LANE}" y1="${y}" x2="${RIGHT_LANE}" y2="${y}" class="nx-decus"/>`
      + `<text x="${(LEFT_LANE + RIGHT_LANE) / 2}" y="${y - 3}" class="nx-decus-t">${esc(d.label || "decussation")}</text></g>`;
  }).join("");

  // one poly-line per tract, crossing lanes at the decussation
  const lines = tracts.map((t, ti) => {
    const crossLevel = t.decussation.between ? t.decussation.between[1] : t.decussation.inLevel;
    const crossIdx = rows.indexOf(crossLevel);
    const pts = t.course.filter(wp => rows.includes(wp.level)).map(wp => {
      const i = rows.indexOf(wp.level);
      const lane = (crossIdx >= 0 && i >= crossIdx) ? RIGHT_LANE : LEFT_LANE; // below/at decussation → other lane
      return `${lane},${rowY(wp.level)}`;
    });
    return pts.length > 1 ? `<polyline points="${pts.join(" ")}" class="nx-tract nx-tract-${ti}"/>` : "";
  }).join("");

  // candidate site nodes (dedup by id across tracts), placed at their level band
  const seen = new Set(), nodes = [];
  let stack = {}; // per-level vertical stacking so nodes don't overlap
  for (const t of tracts) for (const s of t.sites) {
    if (seen.has(s.site.id)) continue; seen.add(s.site.id);
    const k = s.level; stack[k] = (stack[k] || 0);
    const y = rowY(s.level) + (stack[k] - 0) * 15 - 6; stack[k]++;
    const sel = s.site.id === selectedId ? ` data-sel="1"` : "";
    nodes.push(
      `<g class="nx-node${sel ? " sel" : ""}"${sel} data-k="${esc(s.site.id)}">`
      + `<circle cx="${NODE_X}" cy="${y}" r="4" class="nx-dot"/>`
      + `<text x="${NODE_X + 9}" y="${y + 4}" class="nx-label">${esc(labelFor(s.site))}</text></g>`);
  }

  return `<svg viewBox="0 0 ${W} ${H}" class="neuraxis" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="neuraxis tract diagram">`
    + bands + decu + lines + nodes.join("") + `</svg>`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/neuraxis-diagram.test.js
```
Expected: PASS — `5 passed, 0 failed`.

- [ ] **Step 5: Wire the suite into `package.json` and README**

In `package.json` line 7, append: ` && node test/neuraxis-diagram.test.js`.
In `README.md`, after the `node test/tracts.test.js …` line, add:
```
node test/neuraxis-diagram.test.js # Sub-project B — derived neuraxis SVG builder
```

- [ ] **Step 6: Run the full suite**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: `ALL SUITES GREEN`.

- [ ] **Step 7: Commit**

```bash
git add app/neuraxis-diagram.js test/neuraxis-diagram.test.js package.json README.md
git commit -m "feat(app): derived neuraxis SVG builder (pure, unit-tested)"
```

---

### Task 3: Wire synthesis + diagram into the app

**Files:**
- Modify: `app/app.js` (imports; `renderResults` computes `tractsFor`; new `synthesisHTML` + `neuraxisBlock`; render + node-click wiring; per-site "why" collapsed when synthesis present; CSS)
- Modify: `app/index.html` (add the small CSS block for `.neuraxis` / `.synth`)

**Interfaces:**
- Consumes: `tractsFor` from `src/engine/tracts.js`; `neuraxisSVG` from `app/neuraxis-diagram.js`; existing `siteName`, `esc`, `desc`, `fid`, `S.selected`, `renderResults`.

- [ ] **Step 1: Add imports**

In `app/app.js`, after the existing engine imports, add:
```js
import { tractsFor } from "../src/engine/tracts.js";
import { neuraxisSVG } from "./neuraxis-diagram.js";
```

- [ ] **Step 2: Add the synthesis + diagram renderers**

In `app/app.js`, add these functions just above `function whyBlock(` :

```js
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
  return `<h3 style="margin-top:14px">Why — synthesis</h3>${clauses}${converge}`;
}

function neuraxisBlock(tf, selectedId) {
  if (!tf.length) return "";
  const svg = neuraxisSVG(tf, { selectedId, labelFor: s => siteName(s) });
  return `<div class="neuraxis-wrap"><div class="nx-cap">Neuraxis — click a site to select it</div>${svg}</div>`;
}
```

- [ ] **Step 3: Compute `tractsFor` in `renderResults` and render synthesis + diagram + wire clicks**

In `app/app.js` `renderResults`, replace the single line:
```js
  el.innerHTML = diffBlock(list, cands, total, r.explainAll.length, r) + whyBlock(sel, total) + whatBlock(sel.site);
```
with:
```js
  const tf = tractsFor(S.tokens, { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined });
  el.innerHTML = diffBlock(list, cands, total, r.explainAll.length, r)
    + synthesisHTML(tf) + neuraxisBlock(tf, sel.site.id)
    + whyBlock(sel, total, tf.length > 0) + whatBlock(sel.site);
  const nx = el.querySelector(".neuraxis");
  if (nx) nx.onclick = e => { const g = e.target.closest("[data-k]"); if (!g) return; S.selected = g.dataset.k; renderResults(); };
```

- [ ] **Step 4: Make the per-site "why" collapse when synthesis is present**

In `app/app.js`, change the `whyBlock` signature and heading so it becomes a collapsible detail when a synthesis leads. Replace the `function whyBlock(c, total) {` line and its `return` template:

Change the signature line:
```js
function whyBlock(c, total) {
```
to:
```js
function whyBlock(c, total, collapsed = false) {
```

And replace its `return` (the ``return `<h3 style="margin-top:14px">Why — …`` block) with:

```js
  const body = `<div class="why-list">${ok}${no}</div>
    ${warn ? `<details style="margin-top:6px"><summary style="font-size:11.5px;color:var(--muted)">Predicted here but not reported <span class="c">${missed.length}</span></summary><div class="why-list" style="margin-top:4px">${warn}</div></details>` : ""}`;
  const head = `<span style="color:var(--terra)">${esc(siteName(c.site))}</span> explains ${c.n}/${total}`;
  return collapsed
    ? `<details class="why-site" style="margin-top:10px"><summary style="font-weight:700">Why this specific site — ${head}</summary><div style="margin-top:6px">${body}</div></details>`
    : `<h3 style="margin-top:14px">Why — ${head}</h3>${body}`;
```

(The `ok`, `no`, `missed`, `warn` locals above this return are unchanged.)

- [ ] **Step 5: Add CSS to `app/index.html`**

In `app/index.html`, inside the existing `<style>` block, append:

```css
.synth{font-size:12.5px;line-height:1.5;margin:6px 0;color:var(--fg)}
.synth .cross{color:var(--muted)}
.synth.converge{border-left:2px solid var(--terra);padding-left:8px}
.neuraxis-wrap{margin:10px 0;border:1px solid var(--line);border-radius:8px;padding:8px;overflow-x:auto}
.nx-cap{font-size:11px;color:var(--faint);margin-bottom:4px}
.neuraxis{max-width:100%;height:auto;color:var(--fg)}
.neuraxis .nx-band{font-size:9px;fill:var(--faint);text-transform:capitalize}
.neuraxis .nx-decus{stroke:var(--gold);stroke-dasharray:3 2;stroke-width:1}
.neuraxis .nx-decus-t{font-size:8px;fill:var(--gold);text-anchor:middle}
.neuraxis .nx-tract{fill:none;stroke:var(--terra);stroke-width:1.5;opacity:.55}
.neuraxis .nx-dot{fill:var(--muted)}
.neuraxis .nx-node{cursor:pointer}
.neuraxis .nx-node .nx-label{font-size:9.5px;fill:var(--fg)}
.neuraxis .nx-node.sel .nx-dot{fill:var(--terra);stroke:var(--terra);stroke-width:2}
.neuraxis .nx-node.sel .nx-label{fill:var(--terra);font-weight:700}
.neuraxis .nx-node:hover .nx-label{fill:var(--terra)}
```

(If a variable name here — `--line`, `--fg` — is not defined in `index.html`, substitute the nearest existing one; check the `:root` block first.)

- [ ] **Step 6: Run app-smoke + full suite**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-smoke.test.js 2>&1 | tail -1 && \
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: app-smoke `0 failed`; then `ALL SUITES GREEN`.

- [ ] **Step 7: Verify in the browser**

Start the server (if not running): `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs`.
At `http://localhost:8137/app/`, drive via JS (the reliable path):
- Add `weak_arm@left` + `weak_leg@left`. Confirm a **"Why — synthesis"** block appears naming the **corticospinal tract** with the course sites and the pyramidal-decussation crossing note; a **neuraxis diagram** renders with candidate nodes and a decussation marker; the per-site "why" is now a collapsible.
- Click a diagram node → the differential selection updates (the clicked site becomes selected; its causes/next-steps update).
- Load a Brown-Séquard-style set (`weak_arm@left`, `dorsal_sensory@left`, `spinothalamic@right`) → synthesis names **all three** tracts + the convergence sentence.
- Add a purely non-tract finding set (e.g. a Bell's palsy preset) → confirm the synthesis block is **absent** and the classic per-site "why" shows (fallback).
- Confirm no console errors (`read_console_messages`). Capture a screenshot of the corticospinal synthesis + diagram.

- [ ] **Step 8: Commit**

```bash
git add app/app.js app/index.html
git commit -m "feat(app): tract synthesis narrative + clickable neuraxis diagram in the why panel"
```

---

## Notes for the implementer

- `tractsFor` must stay prose-free and SVG-free — structured facts only. All wording lives in the app; all anatomy in `tracts.js`. This is what keeps it derived and testable.
- Do not import `syndromes.js` into `neuraxis-diagram.js` — the app passes `labelFor: s => siteName(s)` so the builder stays phonebook-free.
- The synthesis is additive and guarded: when `tractsFor` returns `[]` the app renders exactly today's per-site "why". Never let a tract-less input lose its explanation.
- Node counts / exact SVG geometry are not asserted (they drift with styling); the builder test pins the structural contract (a `data-k` node per site, a `decussation` marker, selected emphasis).
- Visual polish (spacing, overlap of stacked nodes) is expected to need a pass by eye in Step 7 — adjust constants in `neuraxis-diagram.js` / the CSS, not the contract.
