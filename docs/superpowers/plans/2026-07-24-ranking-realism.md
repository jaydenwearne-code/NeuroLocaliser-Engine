# Ranking Realism (Sub-project A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the displayed differential clinically credible — exclude lesion sites contradicted by a known-negative finding (killing bilateral-lesion-for-unilateral-input), and order otherwise-tied sites by how common a lesion there actually is.

**Architecture:** A new model file `src/model/prevalence.js` supplies a coarse per-site prevalence tier. `src/engine/inverse.js` gains `knownNegatives()` (contralateral homolog logic) and `ruledOutSites()`; its `differential()` filters out contradicted sites and adds prevalence to the ranking key; `solve()` returns `ruledOut` for a teaching footnote. `app/app.js` renders that footnote.

**Tech Stack:** Zero-dependency ES modules, Node v24 (off PATH — see Global Constraints). Standalone test scripts with a local `ok(label, cond)` helper.

## Global Constraints

- **Node is off PATH.** Prefix every `node`/`npm` command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
- **Zero dependencies, no build step, `"type": "module"`.** No new packages.
- **Prevalence is model-layer, not phonebook.** It lives in `src/model/` and the engine imports it (engine→model is the existing dependency direction). Do not import `src/data/syndromes.js` into the engine.
- **Scope is `differential()` only.** Do NOT change scoring weights, `scoreSite`, `nearFit`, `minimalSet`, or the annotation logic. The scored `solve()` fields (`single`, `best`, `singleExplainsAll`, `multi`, `nearFit`, `level`, `length`) must be untouched so existing scored suites stay green.
- **Test wiring is mandatory.** New suites go into both the `test` script in `package.json` and the README `npm test` chain.
- **Branch off the unify work.** This builds on the engine-owned `differential()`. From the current `unify-localiser-engines` branch:
  ```bash
  cd "/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-engine"
  git checkout -b ranking-realism
  ```

---

### Task 1: Prevalence model (`src/model/prevalence.js`)

A coarse per-site tier (common/uncommon/rare) used only as a tiebreak. Rule-based with precedence *rare wins → explicit (level,part) → level default → global default of uncommon*.

**Files:**
- Create: `src/model/prevalence.js`
- Create: `test/ranking-realism.test.js` (prevalence section first; later tasks extend it)
- Modify: `package.json:7` (append the suite)
- Modify: `README.md` (append the suite to the chain)

**Interfaces:**
- Produces: `export function prevalenceOf(site): 2 | 1 | 0` and `export const COMMON = 2, UNCOMMON = 1, RARE = 0`.
- Consumes: a `site` object with `.side`, `.level`, `.part`.

- [ ] **Step 1: Write the failing test**

Create `test/ranking-realism.test.js`:

```js
// ranking-realism.test.js — Sub-project A: contralateral known-negative exclusion + prevalence tiebreak.
import { prevalenceOf, COMMON, UNCOMMON, RARE } from "../src/model/prevalence.js";
import { candidateSites, differential, knownNegatives, solve } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };
const cs = candidateSites();
const site = id => cs.find(s => s.id === id);

// ---- prevalence tiers ----
ok("internal capsule is common", prevalenceOf(site("right_subcortex_internal_capsule")) === COMMON);
ok("corona radiata is common", prevalenceOf(site("right_subcortex_corona_radiata")) === COMMON);
ok("thalamus is uncommon (not common)", prevalenceOf(site("right_subcortex_thalamus")) === UNCOMMON);
ok("medial medulla (brainstem) is uncommon", prevalenceOf(site("right_medulla_medial")) === UNCOMMON);
ok("locked-in (bilateral/composite) is rare", prevalenceOf(site("locked_in")) === RARE);
ok("a named nerve is common", cs.some(s => s.level === "nerve") && prevalenceOf(cs.find(s => s.level === "nerve")) === COMMON);
ok("a root is common", cs.some(s => s.level === "root") && prevalenceOf(cs.find(s => s.level === "root")) === COMMON);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/ranking-realism.test.js
```
Expected: FAIL — `Cannot find module '../src/model/prevalence.js'` (also `knownNegatives` not yet exported, but the import of the missing module fails first).

- [ ] **Step 3: Create `src/model/prevalence.js`**

```js
// prevalence.js — how COMMON is a lesion at this site? A coarse prior used ONLY to break ties in the
// displayed differential (never to override coverage). The tier reflects the prevalence of the PATHOLOGIES
// that affect the site: cortical/subcortical strokes and peripheral (root / nerve / polyneuropathy)
// pathologies are common; thalamic and brainstem strokes and cord / cerebellar / plexus lesions are less
// common; bilateral / composite and eponymous-rarity localisations are rare. Clinician-tunable — edit the
// sets below. Precedence: rare wins → explicit (level,part) → level default → global default (uncommon).

export const COMMON = 2, UNCOMMON = 1, RARE = 0; // higher sorts first

// Rare by level — bilateral / composite / eponymous-rarity localisations.
const RARE_LEVELS = new Set([
  "locked_in", "combined_degeneration", "guillain_mollaret", "pseudobulbar", "brainstem_aras",
  "thalamus_arousal", "corpus_callosum", "hypothalamus", "pontomesencephalic", "dorsal_midbrain",
  "craniocervical_junction", "central_vestibular",
]);
// Common by level — default for the whole level unless a rare rule fires.
const COMMON_LEVELS = new Set(["cortex", "basal_ganglia", "root", "nerve", "polyneuropathy"]);
// Common by (level, part) — the lacunar subcortical parts.
const COMMON_PARTS = new Set([
  "subcortex/internal_capsule", "subcortex/corona_radiata",
  "subcortex/anterior_choroidal", "subcortex/sensorimotor",
]);
// Rare by (level, part).
const RARE_PARTS = new Set(["cerebellum/pancerebellar", "cord/transverse"]);

export function prevalenceOf(site) {
  const lp = `${site.level}/${site.part}`;
  if (site.side === "bilateral") return RARE;   // rare wins
  if (RARE_LEVELS.has(site.level)) return RARE;
  if (RARE_PARTS.has(lp)) return RARE;
  if (COMMON_PARTS.has(lp)) return COMMON;      // explicit (level,part) before level default
  if (COMMON_LEVELS.has(site.level)) return COMMON;
  return UNCOMMON;                              // global default
}
```

- [ ] **Step 4: Wire the suite into `package.json`**

In `package.json` line 7, append to the end of the `test` chain (before the closing quote):
```
 && node test/ranking-realism.test.js
```

- [ ] **Step 5: Wire the suite into the README chain**

In `README.md`, after the `node test/differential.test.js …` line, add:
```
node test/ranking-realism.test.js # Sub-project A — known-negative exclusion + prevalence tiebreak
```

- [ ] **Step 6: Run the test to verify it passes**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/ranking-realism.test.js
```
Expected: FAIL still — the file now imports `knownNegatives`/`solve` from `inverse.js`; `knownNegatives` is not yet exported, so the import errors. That is expected; the prevalence assertions themselves are correct and will pass once Task 2 adds `knownNegatives`. **Do not** proceed to commit yet — Task 1 and Task 2 land together in one commit at the end of Task 2. Verify instead that prevalence alone is correct with a focused check:

```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node --input-type=module -e '
import { prevalenceOf, COMMON, UNCOMMON, RARE } from "./src/model/prevalence.js";
const c = { side:"right", level:"subcortex", part:"internal_capsule" };
const t = { side:"right", level:"subcortex", part:"thalamus" };
const b = { side:"bilateral", level:"locked_in", part:"ventral_pons" };
console.log(prevalenceOf(c)===COMMON, prevalenceOf(t)===UNCOMMON, prevalenceOf(b)===RARE);
'
```
Expected: `true true true`.

---

### Task 2: Known-negative exclusion + prevalence tiebreak in `differential()`

**Files:**
- Modify: `src/engine/inverse.js` (add `knownNegatives`; import `prevalenceOf`; filter + comparator in `differential()`)
- Modify: `test/differential.test.js` (update the ordering assertion to include prevalence)
- Test: `test/ranking-realism.test.js` (add exclusion + ordering assertions)

**Interfaces:**
- Consumes: `prevalenceOf` from `../model/prevalence.js`; `candidateSites`, `expectedFindings` (already in `inverse.js`).
- Produces:
  - `export function knownNegatives(observedSet: Set<string>): Set<string>` — the opposite-side homolog of each lateralised observed token whose homolog is not itself observed.
  - `differential()` now excludes sites whose expected findings intersect `knownNegatives`, adds `prevalence` to each `Cand`, and sorts by `n desc → prevalence desc → over asc → site.id asc`.

- [ ] **Step 1: Add the exclusion + ordering assertions to the ranking-realism test**

In `test/ranking-realism.test.js`, insert before the final `console.log`:

```js
// ---- known-negative exclusion ----
const neg = knownNegatives(new Set(["weak_arm@left"]));
ok("knownNegatives of weak_arm@left includes weak_arm@right", neg.has("weak_arm@right"));
ok("knownNegatives excludes the entered side", !neg.has("weak_arm@left"));
const negBoth = knownNegatives(new Set(["weak_arm@left", "weak_arm@right"]));
ok("a finding entered on both sides yields no negative", !negBoth.has("weak_arm@left") && !negBoth.has("weak_arm@right"));

const opts = { dominantSide: "left" };
const d = differential(new Set(["weak_arm@left", "weak_leg@left"]), opts);
const has = id => d.some(c => c.site.id === id);
ok("locked-in is excluded for unilateral input", !has("locked_in"));
ok("wrong-side Brown-Séquard (right_cord_hemi) is excluded", !has("right_cord_hemi"));
ok("correct-side Brown-Séquard (left_cord_hemi) survives", has("left_cord_hemi"));

// ---- prevalence tiebreak: the lacune outranks a tying brainstem site ----
const rank = id => d.findIndex(c => c.site.id === id);
ok("internal capsule (common) outranks medial medulla (uncommon) on the tie",
   rank("right_subcortex_internal_capsule") > -1 && rank("right_medulla_medial") > -1
   && rank("right_subcortex_internal_capsule") < rank("right_medulla_medial"));
```

Also add `import` coverage is already present (Task 1 imported `differential`, `knownNegatives`, `solve`, `candidateSites`).

- [ ] **Step 2: Run to verify the new assertions fail**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/ranking-realism.test.js
```
Expected: FAIL at import (`knownNegatives` is not exported yet).

- [ ] **Step 3: Add `knownNegatives` and the import to `inverse.js`**

In `src/engine/inverse.js`, add the prevalence import next to the existing imports (after the `import { describeReach } …` line):

```js
import { prevalenceOf } from "../model/prevalence.js";
```

Then add `knownNegatives` immediately before the `differential` function:

```js
// A lateralised finding entered on one side implies its opposite side was examined and found normal —
// a KNOWN NEGATIVE. Any site that predicts a known-negative would produce a sign the patient demonstrably
// lacks, so it is not a candidate. Only left↔right have a homolog; midline / bilateral / none are skipped.
const OPPOSITE_SIDE = { left: "right", right: "left" };
export function knownNegatives(observedSet) {
  const neg = new Set();
  for (const tok of observedSet) {
    const [f, side] = tok.split("@");
    const other = OPPOSITE_SIDE[side];
    if (!other) continue;
    const homolog = `${f}@${other}`;
    if (!observedSet.has(homolog)) neg.add(homolog);
  }
  return neg;
}
```

- [ ] **Step 4: Update `differential()` to filter + reorder**

In `src/engine/inverse.js`, replace the whole `differential` function body with:

```js
export function differential(observedSet, opts = {}) {
  const observed = [...observedSet];
  const negatives = knownNegatives(observedSet);
  const cands = [];
  for (const site of candidateSites()) {
    let exp; try { exp = expectedFindings(site, opts); } catch { continue; }
    let contradicted = false;
    for (const neg of negatives) if (exp.has(neg)) { contradicted = true; break; } // known-negative → not a candidate
    if (contradicted) continue;
    const explained = observed.filter(t => exp.has(t));
    if (!explained.length) continue;
    cands.push({ site, exp, explained, over: [...exp].filter(t => !observedSet.has(t)).length,
                 n: explained.length, prevalence: prevalenceOf(site) });
  }
  // coverage first (localisation), then prevalence (commoner lesion), then tightness, then deterministic id.
  cands.sort((a, b) => b.n - a.n || b.prevalence - a.prevalence || a.over - b.over || a.site.id.localeCompare(b.site.id));
  return cands;
}
```

- [ ] **Step 5: Update the ordering assertion in `test/differential.test.js`**

The comparator now includes prevalence. In `test/differential.test.js`, replace the ordering-check block (the `for` loop computing `bad` and the `ok("differential is sorted …")` line) with:

```js
const d = differential(new Set(["weak_arm@left","weak_leg@left"]), opts);
let ordered = true;
for (let i = 1; i < d.length; i++) {
  const a = d[i - 1], b = d[i];
  const bad = a.n < b.n
    || (a.n === b.n && a.prevalence < b.prevalence)
    || (a.n === b.n && a.prevalence === b.prevalence && a.over > b.over)
    || (a.n === b.n && a.prevalence === b.prevalence && a.over === b.over && a.site.id.localeCompare(b.site.id) > 0);
  if (bad) { ordered = false; break; }
}
ok("differential is sorted by n desc, prevalence desc, over asc, then site.id asc", ordered);
```

- [ ] **Step 6: Run ranking-realism + differential + the full suite**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/ranking-realism.test.js && \
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/differential.test.js && \
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: ranking-realism prints `N passed, 0 failed`; differential prints `13 passed, 0 failed`; then `ALL SUITES GREEN`. If a pre-existing `differential.test.js` relational assertion (e.g. `two.display.length <= one.display.length`) fails, STOP — the exclusion changed counts unexpectedly; recheck before continuing.

- [ ] **Step 7: Commit (Tasks 1 + 2 together)**

```bash
git add src/model/prevalence.js src/engine/inverse.js test/ranking-realism.test.js test/differential.test.js package.json README.md
git commit -m "feat(engine): known-negative exclusion + prevalence tiebreak in differential()"
```

---

### Task 3: `solve()` returns `ruledOut` (teaching footnote data)

**Files:**
- Modify: `src/engine/inverse.js` (add `ruledOutSites`; extend `solve()` return)
- Test: `test/ranking-realism.test.js` (add `ruledOut` assertions)

**Interfaces:**
- Produces: `export function ruledOutSites(observedSet, opts): [{ site, contradictedBy }]` — sites that would have explained ≥1 observed finding but were contradicted by a known-negative (first-matching negative token). `solve()` return gains `ruledOut: [{ site, contradictedBy }]`.

- [ ] **Step 1: Add the `ruledOut` assertions**

In `test/ranking-realism.test.js`, insert before the final `console.log`:

```js
// ---- ruledOut teaching footnote ----
const r = solve(new Set(["weak_arm@left", "weak_leg@left"]), { dominantSide: "left" });
ok("solve() returns a ruledOut array", Array.isArray(r.ruledOut));
const li = r.ruledOut.find(x => x.site.id === "locked_in");
ok("locked-in is listed in ruledOut", !!li);
ok("locked-in was contradicted by a right-sided weakness known-negative",
   !!li && (li.contradictedBy === "weak_arm@right" || li.contradictedBy === "weak_leg@right"));
const rNone = solve(new Set(["weak_arm@left", "weak_arm@right"]), { dominantSide: "left" });
ok("ruledOut is empty when no finding has a known-negative", rNone.ruledOut.length === 0);
```

- [ ] **Step 2: Run to verify the new assertions fail**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/ranking-realism.test.js
```
Expected: FAIL — `r.ruledOut` is `undefined` (not yet on the `solve()` result).

- [ ] **Step 3: Add `ruledOutSites` and extend `solve()`**

In `src/engine/inverse.js`, add `ruledOutSites` immediately after `differential`:

```js
// The sites the known-negative filter removed — but only those that WOULD have explained something (so the
// footnote lists relevant near-misses like locked-in, not every unrelated bilateral site). Each is paired
// with the first known-negative token that contradicted it, for a teaching note.
export function ruledOutSites(observedSet, opts = {}) {
  const negatives = knownNegatives(observedSet);
  if (!negatives.size) return [];
  const out = [];
  for (const site of candidateSites()) {
    let exp; try { exp = expectedFindings(site, opts); } catch { continue; }
    let explainsSomething = false;
    for (const t of observedSet) if (exp.has(t)) { explainsSomething = true; break; }
    if (!explainsSomething) continue;
    let contradictedBy = null;
    for (const neg of negatives) if (exp.has(neg)) { contradictedBy = neg; break; }
    if (contradictedBy) out.push({ site, contradictedBy });
  }
  return out;
}
```

Then, in `solve()`, extend the return. Replace the existing return block:

```js
  const diff = differential(observedSet, opts);
  const total = observedSet.size;
  const explainAll = diff.filter(c => c.n === total);
  const display = explainAll.length ? explainAll : diff;
  const defaultSite = display[0]?.site.id ?? null;
  return { single, best, singleExplainsAll, multi, nearFit: nf, level, length, dominantSide: opts.dominantSide,
           differential: diff, explainAll, display, defaultSite };
```

with:

```js
  const diff = differential(observedSet, opts);
  const total = observedSet.size;
  const explainAll = diff.filter(c => c.n === total);
  const display = explainAll.length ? explainAll : diff;
  const defaultSite = display[0]?.site.id ?? null;
  const ruledOut = ruledOutSites(observedSet, opts);
  return { single, best, singleExplainsAll, multi, nearFit: nf, level, length, dominantSide: opts.dominantSide,
           differential: diff, explainAll, display, defaultSite, ruledOut };
```

- [ ] **Step 4: Run ranking-realism + the full suite**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/ranking-realism.test.js && \
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: ranking-realism prints `N passed, 0 failed`; then `ALL SUITES GREEN`.

- [ ] **Step 5: Commit**

```bash
git add src/engine/inverse.js test/ranking-realism.test.js
git commit -m "feat(engine): solve() returns ruledOut (known-negative teaching footnote)"
```

---

### Task 4: Render the `ruledOut` footnote in the app

**Files:**
- Modify: `app/app.js` (`diffBlock` — append a collapsible when `r.ruledOut` is non-empty)

**Interfaces:**
- Consumes: `r.ruledOut` (Task 3). Uses existing helpers `siteName`, `esc`, `desc`, `fid`.

- [ ] **Step 1: Add the footnote to `diffBlock`**

In `app/app.js`, inside `diffBlock(list, cands, total, nAll, r)`, add this before the final `return`:

```js
  const ruled = (r.ruledOut && r.ruledOut.length)
    ? `<details class="ruledout" style="margin-top:6px"><summary style="font-size:11.5px;color:var(--muted)">Ruled out by a normal finding <span class="c">${r.ruledOut.length}</span></summary>
        <div class="why-list" style="margin-top:4px">${r.ruledOut.map(x => {
          const side = x.contradictedBy.split("@")[1];
          return `<div class="why-item"><span class="k no">✗</span><span class="t">${esc(siteName(x.site))}</span><span class="d">would also cause ${esc(desc(fid(x.contradictedBy)))} on the ${esc(side)} — which is normal here</span></div>`;
        }).join("")}</div></details>`
    : "";
```

Then include `${ruled}` in the returned template string — place it immediately after the `<div class="difflist" …>…</div>` line and before the trailing `<p>Click a lesion…</p>`:

```js
  return `<h3>Possible lesions <span style="color:var(--faint);font-weight:600">(${list.length})</span></h3>
    <p class="narrow">${narrow}</p>
    ${near}${multi}${funcFlag}${umnlmn}${annot}
    <div class="difflist" id="difflist">${rows}</div>
    ${ruled}
    <p style="font-size:11px;color:var(--faint);margin:6px 0 0">Click a lesion to see its reasoning & causes below.</p>`;
```

- [ ] **Step 2: Run the full suite (unaffected) and app-smoke**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-smoke.test.js 2>&1 | tail -1 && \
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: app-smoke `0 failed`; then `ALL SUITES GREEN`.

- [ ] **Step 3: Verify in the browser**

Start the server (if not already running):
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs
```
At `http://localhost:8137/app/`, drive via the real toggle path (the earlier reliable method):
- Add `weak_arm@left` and `weak_leg@left` (JS: `document.querySelector('[data-f="weak_arm"][data-s="left"]').click()` etc.).
- Confirm: `locked_in` is **absent** from the differential rows; the top rows are the common lacunar/cortical sites (internal capsule / corona radiata) ahead of brainstem/cord; a **"Ruled out by a normal finding"** collapsible appears listing Locked-in ("would also cause weakness on the right — which is normal here").
- Confirm no console errors (`read_console_messages`). Capture a screenshot as proof.

- [ ] **Step 4: Commit**

```bash
git add app/app.js
git commit -m "feat(app): render ruledOut known-negative teaching footnote"
```

---

## Notes for the implementer

- The prevalence tiers are the clinician's dials; keep them in `src/model/prevalence.js` as plain sets so they are trivially editable. Do not scatter prevalence logic into the engine.
- Do NOT touch `scoreSite`/`rankSingle`/`nearFit`/`minimalSet`. If a scored suite (e.g. `relaxation.test.js`) goes red, you changed something out of scope — revert and re-scope.
- Counts are not asserted (they drift with coverage); the suite pins relational behaviour (exclusion membership, rank order, tier values).
- `left_cord_hemi` must survive and `right_cord_hemi` / `locked_in` must be excluded for left-sided input — this is the crux of Component 1 and is asserted directly.
