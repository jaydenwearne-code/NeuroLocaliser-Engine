# Richer Why — Composed Anatomy + Derived Discrimination — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the thin Why synthesis with a composed anatomical **Course** narrative, a **Why this site** parsimony line, and a derived **Why not elsewhere** (level-grouped exclusions), and expand the neuraxis diagram by default.

**Architecture:** `src/model/tracts.js` waypoints gain `detail` + `supply` and each tract a `direction`. `src/engine/tracts.js` gains `tractNarrative(tract)` (composed prose) and `whyNotOthers(observed, selectedSite, opts)` (level-bucketed discriminators, derived from the candidate set). `app/app.js` `whyCard` renders the three blocks + expanded diagram.

**Tech Stack:** Zero-dependency ES modules, Node v24 off PATH. Standalone test scripts.

## Global Constraints

- **Node is off PATH.** Prefix `node`/`npm` with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- **Additive to the engine.** No change to localisation, ranking, `differential`, `causesFor`, or the exam tree. New model fields + new functions only; the Why change is app-side.
- **Derive the discrimination.** `whyNotOthers` is computed from `expectedFindings` over the candidate set — no authored per-site discriminating text. The anatomy narrative is *composed* from structured waypoint fields.
- **Wording tuned by eye.** Tests assert substrings/structure, not exact prose.
- **Branch off `main`:**
  ```bash
  cd "/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-engine"
  git checkout -b richer-why
  ```

---

### Task 1: Enrich the tract model (`detail` + `supply` + `direction`)

**Files:**
- Modify: `src/model/tracts.js` (add `direction` per tract; `detail` + `supply` per waypoint)
- Modify: `test/tracts.test.js` (consistency: every waypoint has detail + supply)

**Interfaces:**
- Each `TRACTS[i]` gains `direction: "descending" | "ascending"`; each `course[j]` gains
  `detail: string` and `supply: string`.

- [ ] **Step 1: Add the consistency assertion**

In `test/tracts.test.js`, inside the existing `for (const t of TRACTS)` consistency loop, after the
existing `for (const wp of t.course)` block, add a second loop (or extend it) — insert right after the
existing course-level assertion:

```js
for (const t2 of TRACTS) {
  ok(`${t2.id}: has a direction`, t2.direction === "descending" || t2.direction === "ascending");
  for (const wp of t2.course) ok(`${t2.id}/${wp.level}: has detail + supply`, !!wp.detail && !!wp.supply);
}
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/tracts.test.js 2>&1 | grep -E "FAIL|passed" | head
```
Expected: FAIL — waypoints lack `detail`/`supply` and tracts lack `direction`.

- [ ] **Step 3: Replace the `TRACTS` array with the enriched version**

In `src/model/tracts.js`, replace the entire `export const TRACTS = [ … ];` with:

```js
export const TRACTS = [
  {
    id: "corticospinal", label: "corticospinal tract", direction: "descending",
    findings: ["weak_arm", "weak_leg"],
    together: "the arm and leg fibres run close together, so a single lesion weakens both",
    course: [
      { level: "cortex",    label: "motor cortex",                  detail: "primary motor cortex",                supply: "MCA to the face/arm, ACA to the leg" },
      { level: "subcortex", label: "corona radiata / internal capsule", detail: "corona radiata and internal capsule", supply: "lenticulostriate perforators" },
      { level: "midbrain",  label: "cerebral peduncle",             detail: "cerebral peduncle",                   supply: "PCA / basilar perforators" },
      { level: "pons",      label: "basis pontis",                  detail: "basis pontis",                        supply: "basilar perforators" },
      { level: "medulla",   label: "medullary pyramid",             detail: "medullary pyramid",                   supply: "anterior spinal / vertebral" },
      { level: "cord",      label: "lateral corticospinal tract",   detail: "lateral corticospinal tract",         supply: "anterior spinal artery" },
    ],
    decussation: { between: ["medulla", "cord"], label: "pyramidal decussation" },
    crossingNote: "contralateral to the weakness above the pyramidal decussation, ipsilateral in the cord below it",
  },
  {
    id: "spinothalamic", label: "spinothalamic tract", direction: "ascending",
    findings: ["spinothalamic"],
    together: "the pain and temperature fibres",
    course: [
      { level: "subcortex", label: "VPL thalamus",           detail: "VPL of the thalamus",              supply: "thalamoperforators" },
      { level: "midbrain",  label: "lateral tegmentum",      detail: "lateral spinothalamic tract",      supply: "PCA / basilar perforators" },
      { level: "pons",      label: "lateral tegmentum",      detail: "lateral spinothalamic tract",      supply: "basilar perforators" },
      { level: "medulla",   label: "lateral medulla",        detail: "lateral medulla",                  supply: "PICA / vertebral" },
      { level: "cord",      label: "anterolateral cord",     detail: "anterolateral cord",               supply: "anterior spinal artery" },
    ],
    decussation: { inLevel: "cord", label: "anterior white commissure (crosses within 1–2 segments)" },
    crossingNote: "contralateral to the pain/temperature loss throughout, because it crosses low in the cord",
  },
  {
    id: "dorsal_column", label: "dorsal column–medial lemniscus", direction: "ascending",
    findings: ["dorsal_sensory", "sensory_ataxia"],
    together: "the vibration and proprioception fibres",
    course: [
      { level: "subcortex", label: "VPL thalamus",             detail: "VPL of the thalamus",             supply: "thalamoperforators" },
      { level: "midbrain",  label: "medial lemniscus",         detail: "medial lemniscus",                supply: "PCA / basilar perforators" },
      { level: "pons",      label: "medial lemniscus",         detail: "medial lemniscus",                supply: "basilar perforators" },
      { level: "medulla",   label: "gracile / cuneate nuclei", detail: "gracile and cuneate nuclei",      supply: "posterior spinal / PICA" },
      { level: "cord",      label: "dorsal columns",           detail: "dorsal columns",                  supply: "posterior spinal artery" },
    ],
    decussation: { between: ["medulla", "cord"], label: "sensory (internal arcuate) decussation" },
    crossingNote: "contralateral above the medullary sensory decussation, ipsilateral in the cord below it",
  },
  {
    id: "corticobulbar", label: "corticobulbar tract (to the facial nucleus)", direction: "descending",
    findings: ["forehead_spared"],
    together: "the upper-motor-neurone fibres to the facial nucleus",
    course: [
      { level: "cortex",    label: "motor cortex (face)",           detail: "primary motor cortex (face area)",   supply: "MCA (lower face)" },
      { level: "subcortex", label: "genu of the internal capsule",  detail: "genu of the internal capsule",       supply: "lenticulostriate perforators" },
      { level: "midbrain",  label: "cerebral peduncle",             detail: "cerebral peduncle",                  supply: "PCA / basilar perforators" },
      { level: "pons",      label: "facial nucleus",                detail: "facial nucleus",                     supply: "basilar perforators" },
    ],
    decussation: { between: ["midbrain", "pons"], label: "corticobulbar decussation (to the facial nucleus)" },
    crossingNote: "contralateral to the lower-face weakness; the forehead is spared because the upper face is bilaterally innervated",
  },
];
```

- [ ] **Step 4: Run the consistency test (green) + full suite**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/tracts.test.js 2>&1 | tail -2 && \
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: tracts test passes; `ALL SUITES GREEN`.

- [ ] **Step 5: Commit**

```bash
git add src/model/tracts.js test/tracts.test.js
git commit -m "feat(model): tract waypoint detail/supply + direction (richer-why foundation)"
```

---

### Task 2: `tractNarrative` + `whyNotOthers` (engine)

**Files:**
- Modify: `src/engine/tracts.js` (imports; `tractNarrative`; `whyNotOthers`)
- Modify: `test/tracts.test.js` (narrative substrings; discrimination buckets)

**Interfaces:**
- `export function tractNarrative(tract): string`.
- `export function whyNotOthers(observedSet, selectedSite, opts?): { selectedBucket: string, buckets: { bucket, label, supply, findings: string[] }[] }`.

- [ ] **Step 1: Write the failing tests**

First extend the imports at the top of `test/tracts.test.js`. Change:
```js
import { tractsFor } from "../src/engine/tracts.js";
```
to:
```js
import { tractsFor, tractNarrative, whyNotOthers } from "../src/engine/tracts.js";
import { candidateSites } from "../src/engine/inverse.js";
```
(The failing static import of the not-yet-defined `tractNarrative`/`whyNotOthers` is itself the red state.)

Then add before the final `console.log`:

```js
// ---- composed anatomy narrative ----
const cstTract = TRACTS.find(t => t.id === "corticospinal");
const narr = tractNarrative(cstTract);
for (const sub of ["primary motor cortex", "MCA", "ACA", "internal capsule", "pyramidal decussation"])
  ok(`corticospinal narrative mentions "${sub}"`, narr.includes(sub));

// ---- derived "why not the others" ----
const icSite = candidateSites().find(s => s.id === "right_subcortex_internal_capsule");
const wn = whyNotOthers(new Set(["weak_arm@left", "weak_leg@left"]), icSite, { dominantSide: "left" });
const bucket = name => wn.buckets.find(b => b.bucket === name);
ok("whyNotOthers has a cortical bucket with neglect", !!bucket("cortical") && bucket("cortical").findings.includes("neglect"));
ok("whyNotOthers has a brainstem bucket with a cranial-nerve sign",
   !!bucket("brainstem") && bucket("brainstem").findings.some(f => ["gaze_palsy","cn12_palsy","facial_weakness","weak_abduction"].includes(f)));
ok("whyNotOthers has a spinal cord bucket with a crossed sensory sign",
   !!bucket("spinal cord") && bucket("spinal cord").findings.some(f => ["spinothalamic","sensory_ataxia","dorsal_sensory"].includes(f)));
ok("each why-not bucket carries a blood supply", wn.buckets.every(b => !!b.supply));
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/tracts.test.js 2>&1 | grep -E "FAIL|is not|does not provide|passed" | head
```
Expected: FAIL — `tractNarrative` / `whyNotOthers` not exported.

- [ ] **Step 3: Add imports to `src/engine/tracts.js`**

At the top of `src/engine/tracts.js`, alongside the existing imports, add:
```js
import { expectedFindings } from "./forward.js";
import { LOCALISING } from "./score.js";
```
(The file already imports `differential` from `./inverse.js` and `TRACTS`/`neuraxisIndex` from `../model/tracts.js`.)

- [ ] **Step 4: Add `tractNarrative`**

Append to `src/engine/tracts.js`:

```js
// Compose the tract's anatomical journey from the structured waypoint fields (detail + supply), the
// decussation, and the crossing note. Physiological order: descending tracts read cortex→cord, ascending
// tracts read cord→thalamus. Prose is intentionally template-composed (tuned by eye).
function capFirst(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function joinAnd(xs) { return xs.length > 1 ? xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1] : (xs[0] || ""); }
export function tractNarrative(tract) {
  const asc = tract.direction === "ascending";
  const path = asc ? [...tract.course].reverse() : tract.course; // origin → termination
  const withSupply = w => w.supply ? `${w.detail} (${w.supply})` : w.detail;
  const origin = path[0];
  const rest = path.slice(1);
  const term = rest.length ? rest[rest.length - 1] : origin;
  const middle = rest.slice(0, -1);
  const middlePhrases = middle.map((w, i) => i === 0 ? withSupply(w) : w.detail); // supply on the first convergence level only
  let s = `The ${tract.label} ${asc ? "begins in the" : "arises in the"} ${withSupply(origin)}`;
  if (middle.length) s += `, ${asc ? "ascending" : "descending"} through the ${joinAnd(middlePhrases)}`;
  if (tract.decussation.label) s += `, ${asc ? "having decussated" : "decussating"} at the ${tract.decussation.label}`;
  s += `, to reach the ${term.detail}. ${capFirst(tract.crossingNote)}.`;
  return s;
}
```

- [ ] **Step 5: Add `whyNotOthers`**

Append to `src/engine/tracts.js`:

```js
// Level buckets for the "why not the other sites" reasoning.
const BUCKET = {
  cortex: "cortical", subcortex: "deep subcortical", aphasia_subcortical: "deep subcortical", thalamus: "deep subcortical",
  midbrain: "brainstem", pons: "brainstem", medulla: "brainstem", cord: "spinal cord",
};
const BUCKET_ORDER = ["cortical", "deep subcortical", "brainstem", "spinal cord"];
const bucketOf = level => BUCKET[level] || "other";

// For the SELECTED lesion, derive what each OTHER candidate on its tract(s) would additionally produce (and
// which is absent) — grouped by neuraxis-level bucket, with the bucket's blood supply. This is the "why this
// site and not the others" reasoning: the discriminating signs to examine for and exclude.
export function whyNotOthers(observedSet, selectedSite, opts = {}) {
  const tf = tractsFor(observedSet, opts);
  const relevant = tf.filter(t => t.sites.some(s => s.site.id === selectedSite.id));
  let selExp; try { selExp = expectedFindings(selectedSite, opts); } catch { selExp = new Set(); }
  const bucketSupply = {};
  for (const t of relevant) for (const w of t.tract.course) {
    const b = bucketOf(w.level); if (w.supply && !bucketSupply[b]) bucketSupply[b] = w.supply;
  }
  const byBucket = {}; const seen = new Set();
  for (const t of relevant) for (const s of t.sites) {
    if (s.site.id === selectedSite.id || seen.has(s.site.id)) continue; seen.add(s.site.id);
    let exp; try { exp = expectedFindings(s.site, opts); } catch { continue; }
    const b = bucketOf(s.site.level);
    for (const tok of exp) {
      if (selExp.has(tok) || observedSet.has(tok)) continue;
      const id = tok.split("@")[0];
      (byBucket[b] ??= new Map()).set(id, (byBucket[b].get(id) || 0) + (LOCALISING.has(id) ? 2 : 1));
    }
  }
  const buckets = BUCKET_ORDER.filter(b => byBucket[b]).map(b => ({
    bucket: b, label: b, supply: bucketSupply[b] || "",
    findings: [...byBucket[b].entries()].sort((a, c) => c[1] - a[1]).slice(0, 4).map(([id]) => id),
  }));
  return { selectedBucket: bucketOf(selectedSite.level), buckets };
}
```

- [ ] **Step 6: Run the tests (green) + full suite**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/tracts.test.js 2>&1 | tail -3 && \
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: tracts test passes (narrative + discrimination); `ALL SUITES GREEN`.

- [ ] **Step 7: Commit**

```bash
git add src/engine/tracts.js test/tracts.test.js
git commit -m "feat(engine): tractNarrative + whyNotOthers (composed anatomy + derived discrimination)"
```

---

### Task 3: Rich Why card + expanded diagram (app)

**Files:**
- Modify: `app/app.js` (import `tractNarrative`, `whyNotOthers`, `prevalenceOf`; rewrite `whyCard`)
- Modify: `app/index.html` (Why-block CSS)

**Interfaces:**
- Consumes: `tractNarrative`, `whyNotOthers` from `../src/engine/tracts.js`; `prevalenceOf` from `../src/model/prevalence.js`; existing `siteName`, `desc`, `esc`, `neuraxisBlock`, `whyBlock`, `umnLmnPattern`.

- [ ] **Step 1: Add imports**

In `app/app.js`, update the tracts import and add prevalence:
```js
import { tractsFor } from "../src/engine/tracts.js";
```
to:
```js
import { tractsFor, tractNarrative, whyNotOthers } from "../src/engine/tracts.js";
import { prevalenceOf } from "../src/model/prevalence.js";
```

- [ ] **Step 2: Rewrite `whyCard`**

In `app/app.js`, replace the whole `whyCard` function with:

```js
// ② Why — composed Course narrative + Why-this (parsimony) + Why-not (derived, level-grouped) + diagram
function whyCard(tf, sel, total) {
  const pat = umnLmnPattern(S.tokens);
  const umnlmn = pat.verdict
    ? `<div class="annot"><b>${pat.verdict === "mixed" ? "UMN + LMN (mixed)" : pat.verdict + " pattern"}:</b> ${esc(pat.note)}</div>`
    : "";
  if (!tf.length) {
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
```

(`synthesisHTML` is now unused by `whyCard`; leave it defined — harmless — or delete it if no other caller references it.)

- [ ] **Step 3: Add CSS to `app/index.html`**

Just before `</style>`, append:
```css
  .whynot{font-size:12.5px;line-height:1.5;margin:6px 0;color:var(--ink);}
  .whynot-list{margin:4px 0 2px;padding-left:18px;}
  .whynot-list li{margin:2px 0;}
  .whynot .wn-terr{color:var(--faint);font-family:var(--mono);font-size:10.5px;}
```

- [ ] **Step 4: Full suite (green — app.js not imported by tests)**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: `ALL SUITES GREEN`.

- [ ] **Step 5: Verify in the browser**

Start the server if needed. At `http://localhost:8137/app/`, tick `weak_arm@left` + `weak_leg@left`, select the **Pure motor lacune (internal capsule)** row, and check via JS + screenshot:
- The Why card shows a **Course** sentence naming primary motor cortex, MCA/ACA, internal capsule, and the pyramidal decussation.
- A **Why this site** parsimony line.
- A **Why not elsewhere** list with cortical / brainstem / spinal-cord entries, each with a blood-supply tag and discriminating signs, then "None reported — examine specifically to exclude."
- The **neuraxis diagram is expanded** by default.
- Selecting a different lesion (e.g. a brainstem row) **updates** the Why-this/Why-not text.
- A non-tract case (facial_weakness alone) still shows the per-site fallback with no Course/Why-not.
- No console errors. Capture a screenshot of the enriched Why card.

- [ ] **Step 6: Commit**

```bash
git add app/app.js app/index.html
git commit -m "feat(app): richer Why — course narrative, why-this, why-not; diagram expanded"
```

---

## Notes for the implementer

- `whyNotOthers` and the diagram both call over the candidate set — fine for a POC (a handful of sites).
- The `selectedBucket` return lets the app phrase same-bucket discriminators as "a neighbouring <bucket> lesion" rather than "if <bucket>", which reads correctly when the selected site and a discriminator share a level.
- Keep `tractNarrative` prose readable but do not block on perfection — the tests pin the required substrings; tune wording by eye in Task 3 Step 5.
- Do not remove `synthesisHTML` unless a grep shows no remaining caller.
