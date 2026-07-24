# Unify the Two Localiser Engines — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `solve()` the single source of truth by moving the app's `differential()` ranking into the engine and returning the broad narrowing differential alongside the existing scored best-fit — so the app becomes a pure consumer with no localisation logic of its own.

**Architecture:** `src/engine/inverse.js` gains an exported, reflection-based `candidateSites()` (one enumeration for both the engine and the app) and an exported `differential()` (count/superset ranking, phonebook-free tie-break on `site.id`). `solve()` is extended with four additive fields (`differential`, `explainAll`, `display`, `defaultSite`). `app/app.js` deletes its own `differential()` and `CANDIDATES` rebuild and reads everything off the one `solve()` result, keeping only the user's click-selection as view state.

**Tech Stack:** Zero-dependency ES modules, Node v24 (off PATH — see Global Constraints). No test runner: each suite is a standalone script with a local `ok(label, cond)` helper that `process.exit`s non-zero on any failure.

## Global Constraints

- **Node is off PATH.** Prefix every `node`/`npm` command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`. Do not re-diagnose "node not found" — the runtime exists at that path.
- **Zero dependencies, no build step, `"type": "module"`.** No `node_modules`, no new imports beyond project-local ES modules. Do not add packages.
- **The golden rule:** the engine must not depend on the phonebook (`src/data/syndromes.js`). `inverse.js` must not import `nameForSite`. Tie-break on `site.id`, never on display name.
- **Behaviour is preserved, not changed.** The `solve()` additions are purely additive; every existing suite must stay green. Validated against real output in `docs/superpowers/specs/2026-07-24-unify-localiser-engines-design.md`.
- **Test wiring is mandatory.** Any new suite must be added both to the `test` script in `package.json` and to the `npm test` chain list in `README.md`.
- **Branch first.** The repo is on `main`. Before Task 1, create a working branch:
  ```bash
  cd "/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-engine"
  git checkout -b unify-localiser-engines
  ```

---

### Task 1: Reflection-based, exported `candidateSites()`

Replace the hard-coded composer list in `inverse.js` with a single reflection-based enumeration (verified to yield the identical 379-site set) and **export** it so the app can reuse it. Behaviour-identical: this is the "one candidate enumeration" clean-up.

**Files:**
- Modify: `src/engine/inverse.js:12-43` (the sites import block + `candidateSites()`)

**Interfaces:**
- Produces: `export function candidateSites(): Site[]` — `[...SITES]` plus every `compose*` export of `src/model/sites.js`, applied and flattened. Order: `SITES` first, then composers in `Object.keys` order.
- Consumes: `src/model/sites.js` (namespace import).

- [ ] **Step 1: Confirm the full suite is green before touching anything**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | tail -3
```
Expected: final line reports `0 failed` for the last suite and a non-error exit (this is the behaviour baseline).

- [ ] **Step 2: Replace the named-composer import block with a namespace import**

In `src/engine/inverse.js`, replace lines 12-23 (the entire `import { SITES, composeHemiLevelSites, … composeCombinedDegenerationSites } from "../model/sites.js";` block) with:

```js
import * as sitesMod from "../model/sites.js";
const { SITES } = sitesMod;
```

Leave the other imports (lines 24-27: `score.js`, `forward.js`, `levels.js`, `nerveLength.js`) unchanged.

- [ ] **Step 3: Replace `candidateSites()` with the reflection version and export it**

In `src/engine/inverse.js`, replace the whole existing `function candidateSites() { … }` (lines 29-43) with:

```js
// One enumeration of every candidate lesion site, shared by the engine and the app. Reflection over
// the sites module auto-includes any new `compose*` — no hand-maintained list to drift out of sync.
export function candidateSites() {
  const out = [...SITES];
  for (const k of Object.keys(sitesMod)) {
    if (k.startsWith("compose") && typeof sitesMod[k] === "function") {
      try { out.push(...sitesMod[k]()); } catch { /* skip a composer that throws on empty input */ }
    }
  }
  return out;
}
```

- [ ] **Step 4: Run the full suite — behaviour must be unchanged**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: `ALL SUITES GREEN` (no suite reports a non-zero failure count). If any suite fails, the candidate set changed — stop and diff the set against the design's assumption before proceeding.

- [ ] **Step 5: Commit**

```bash
git add src/engine/inverse.js
git commit -m "refactor(engine): reflection-based exported candidateSites()"
```

---

### Task 2: `differential()` in the engine + extend `solve()`

Move the count/superset ranking into `inverse.js` (tie-break on `site.id`), have `solve()` compute and return the four new fields, and pin all of it with a new standalone suite.

**Files:**
- Modify: `src/engine/inverse.js` (add `differential()` near the ranking helpers; extend `solve()` return)
- Create: `test/differential.test.js`
- Modify: `package.json:7` (append the suite to the `test` script)
- Modify: `README.md` (append the suite to the `npm test` chain list)

**Interfaces:**
- Consumes: `candidateSites()` (Task 1), `expectedFindings` (already imported in `inverse.js`).
- Produces:
  - `export function differential(observedSet: Set<string>, opts?): Cand[]` where `Cand = { site, exp: Set<string>, explained: string[], over: number, n: number }`, sorted by `n` desc, then `over` asc, then `site.id` asc.
  - `solve()` return gains: `differential: Cand[]`, `explainAll: Cand[]` (subset where `n === observedSet.size`), `display: Cand[]` (`explainAll` if non-empty else `differential`), `defaultSite: string | null` (`display[0]?.site.id ?? null`).

- [ ] **Step 1: Write the failing test**

Create `test/differential.test.js`:

```js
// differential.test.js — the broad narrowing differential, now owned by the engine (moved out of app.js).
// Every candidate site COMPATIBLE with the findings so far (predicted ⊇ some observed); ranked by how many
// findings it explains, then tightness, then site.id (phonebook-free tie-break). explainAll = strict superset;
// display = explainAll if any, else the full differential; defaultSite = the site to select by default.
import { solve, differential } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };
const ids = list => list.map(c => c.site.id);
const opts = { dominantSide: "left" };

// --- one finding fans out to many candidate sites ---
const one = solve(new Set(["weak_arm@left"]), opts);
ok("one finding → many candidate sites", one.differential.length > 1);
ok("a lone finding is explained by all listed sites (explainAll == differential)",
   one.explainAll.length === one.differential.length);

// --- adding constraints narrows the displayed set (monotone while explainAll stays non-empty) ---
const two = solve(new Set(["weak_arm@left","weak_leg@left"]), opts);
const three = solve(new Set(["weak_arm@left","weak_leg@left","neglect@left"]), opts);
ok("adding weak_leg narrows or holds the display", two.display.length <= one.display.length);
ok("adding the neglect localiser narrows further", three.display.length < two.display.length);
ok("weak_arm + weak_leg + neglect pins the non-dominant MCA", three.display.length === 1
   && three.display[0].site.id === "right_cortex_mca");
ok("defaultSite is the id of display[0]", three.defaultSite === "right_cortex_mca");

// --- explainAll is the strict superset set; empty when a stray finding no site explains is present ---
const stray = solve(new Set(["weak_arm@left","weak_leg@left","facial_weakness@left","forehead_spared@left",
  "neglect@left","cortical_sensory_arm@left","dorsal_sensory@left"]), opts);
ok("a stray unexplained finding empties explainAll", stray.explainAll.length === 0);
ok("with empty explainAll, display falls back to the full differential",
   stray.display.length === stray.differential.length);
ok("defaultSite is still the top of the differential (the near-fit site)",
   stray.defaultSite === "right_cortex_mca");

const clean = solve(new Set(["weak_arm@left","weak_leg@left","facial_weakness@left","forehead_spared@left",
  "neglect@left","cortical_sensory_arm@left"]), opts);
ok("a clean superset populates explainAll", clean.explainAll.length >= 1
   && clean.explainAll.some(c => c.site.id === "right_cortex_mca"));
ok("when explainAll is non-empty, display === explainAll",
   JSON.stringify(ids(clean.display)) === JSON.stringify(ids(clean.explainAll)));

// --- every explainAll entry explains ALL observed findings (n === total) ---
const total = 6;
ok("every explainAll entry has n === total", clean.explainAll.every(c => c.n === total));

// --- differential() is exported and ordering respects (n desc, over asc, site.id asc) at every step ---
const d = differential(new Set(["weak_arm@left","weak_leg@left"]), opts);
let ordered = true;
for (let i = 1; i < d.length; i++) {
  const a = d[i - 1], b = d[i];
  const bad = a.n < b.n
    || (a.n === b.n && a.over > b.over)
    || (a.n === b.n && a.over === b.over && a.site.id.localeCompare(b.site.id) > 0);
  if (bad) { ordered = false; break; }
}
ok("differential is sorted by n desc, over asc, then site.id asc", ordered);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/differential.test.js
```
Expected: FAIL — the import `differential` is not yet exported and `solve()` lacks the new fields, so it errors (e.g. `differential is not a function`) or asserts fail.

- [ ] **Step 3: Add the `differential()` function to `inverse.js`**

In `src/engine/inverse.js`, immediately after `rankSingle` (the `export function rankSingle(…) { … }` block, ending at the current line 55) insert:

```js
// ---- NARROWING DIFFERENTIAL (count / superset) ----
// Every candidate site COMPATIBLE with the findings so far — i.e. whose predicted findings include at least
// one observed token. One finding → many sites; each added finding intersects the set → it narrows. This is
// deliberately NOT the best-fit score (which penalises over-prediction and under-returns on sparse input) —
// it is the broad differential the app shows and narrows. Tie-break on site.id keeps the engine independent
// of the phonebook (the golden rule).
export function differential(observedSet, opts = {}) {
  const observed = [...observedSet];
  const cands = [];
  for (const site of candidateSites()) {
    let exp; try { exp = expectedFindings(site, opts); } catch { continue; }
    const explained = observed.filter(t => exp.has(t));
    if (!explained.length) continue;
    cands.push({ site, exp, explained, over: [...exp].filter(t => !observedSet.has(t)).length, n: explained.length });
  }
  cands.sort((a, b) => b.n - a.n || a.over - b.over || a.site.id.localeCompare(b.site.id));
  return cands;
}
```

- [ ] **Step 4: Extend `solve()` to compute and return the four new fields**

In `src/engine/inverse.js`, in `solve()`, replace the final `return` statement (currently line 209, `return { single, best, singleExplainsAll, multi, nearFit: nf, level, length, dominantSide: opts.dominantSide };`) with:

```js
  const diff = differential(observedSet, opts);
  const total = observedSet.size;
  const explainAll = diff.filter(c => c.n === total);
  const display = explainAll.length ? explainAll : diff;
  const defaultSite = display[0]?.site.id ?? null;
  return { single, best, singleExplainsAll, multi, nearFit: nf, level, length, dominantSide: opts.dominantSide,
           differential: diff, explainAll, display, defaultSite };
```

- [ ] **Step 5: Run the new test to verify it passes**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/differential.test.js
```
Expected: PASS — final line `13 passed, 0 failed`.

- [ ] **Step 6: Wire the suite into `package.json`**

In `package.json`, in the `test` script (line 7), append to the end of the chain (before the closing quote):

```
 && node test/differential.test.js
```
so the chain ends `… && node test/next-steps.test.js && node test/differential.test.js`.

- [ ] **Step 7: Wire the suite into the README chain**

In `README.md`, in the fenced `npm test` command list, add a line after the `node test/next-steps.test.js …` line:

```
node test/differential.test.js   # narrowing differential + explainAll/display/defaultSite (engine-owned)
```

- [ ] **Step 8: Run the whole suite — everything green**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: `ALL SUITES GREEN`.

- [ ] **Step 9: Commit**

```bash
git add src/engine/inverse.js test/differential.test.js package.json README.md
git commit -m "feat(engine): differential() + solve() returns display/explainAll/defaultSite"
```

---

### Task 3: `app.js` consumes the unified `solve()`

Delete the app's own localisation logic; read the differential, the displayed list, the explains-all count, and the default selection off the single `solve()` result. Keep only the user's click-selection as view state.

**Files:**
- Modify: `app/app.js:2` (import), `app/app.js:13-17` (CANDIDATES), `app/app.js:119-135` (delete local `differential()`), `app/app.js:137-160` (`renderResults` selection logic)

**Interfaces:**
- Consumes: `candidateSites`, `solve` from `src/engine/inverse.js`. From the `solve()` result: `differential`, `display`, `explainAll`, `defaultSite` (Task 2).

- [ ] **Step 1: Import `candidateSites` from the engine**

In `app/app.js`, change line 2 from:
```js
import { solve } from "../src/engine/inverse.js";
```
to:
```js
import { solve, candidateSites } from "../src/engine/inverse.js";
```

- [ ] **Step 2: Replace the local `CANDIDATES` rebuild with the engine's enumeration**

In `app/app.js`, replace lines 13-17 (the `// ---- all candidate sites … ----` comment plus the `const CANDIDATES = [...SITES];` loop) with:

```js
// ---- all candidate sites (one enumeration, owned by the engine) ----
const CANDIDATES = candidateSites();
```

Then delete the two now-dead imports (verified: `SITES` and `sitesMod` were each used **only** in the block just replaced) — remove these lines near the top of `app/app.js`:

```js
import { SITES } from "../src/model/sites.js";
import * as sitesMod from "../src/model/sites.js";
```

- [ ] **Step 3: Delete the app's local `differential()` function**

In `app/app.js`, delete the entire block at lines 119-135 — the comment starting `// build the NARROWING DIFFERENTIAL:` through the end of `function differential() { … }` (the line `return cands; }`). The engine now owns this.

- [ ] **Step 4: Rewrite the selection logic in `renderResults` to read the single `solve()` result**

In `app/app.js`, inside `renderResults`, replace this block (currently lines 141-156):

```js
  const total = S.tokens.size;
  const cands = differential();
  if (!cands.length) {
    const fnd = functionalFlag(S.tokens);
    const fmsg = fnd.functional
      ? `<div class="multi" style="border-color:var(--gold)"><b>⚠ Consider functional.</b> ${esc(fnd.note)}</div>`
      : "";
    el.innerHTML = `<h3>Possible lesions</h3>${fmsg}<div class="empty">No site produces any of these findings on the sides given — re-check a side${fnd.functional?", or this is likely non-organic (see above)":", or this may be non-organic"}.</div>`;
    return;
  }
  const explainAll = cands.filter(c => c.n === total);
  const list = explainAll.length ? explainAll : cands;
  let sel = list.find(c => c.site.id === S.selected) || list[0];
  S.selected = sel.site.id;
  const r = solve(S.tokens, { dominantSide: S.dominant, sensoryLevel: S.sensoryLevel || undefined, distalReach: S.distalReach || undefined });
  el.innerHTML = diffBlock(list, cands, total, explainAll.length, r) + whyBlock(sel, total) + whatBlock(sel.site);
```

with (one `solve()` call; the engine supplies the differential, the displayed list, the explains-all count, and the default selection):

```js
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
```

- [ ] **Step 5: Confirm no dangling references to the deleted function**

Run:
```bash
cd "/Users/jaydenwearne/Desktop/Personal/Claude Code/Projects/NeuroLocaliser/Code/neurolocaliser-engine"
grep -n "differential()" app/app.js || echo "no local differential() calls remain"
```
Expected: `no local differential() calls remain` (the only `differential` reference left in `app.js`, if any, is a comment or none).

- [ ] **Step 6: Run the app-smoke suite and the full suite**

Run:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/app-smoke.test.js && PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test 2>&1 | grep -E "failed" | grep -v "0 failed" || echo "ALL SUITES GREEN"
```
Expected: app-smoke prints `0 failed`, then `ALL SUITES GREEN`.

- [ ] **Step 7: Verify in the browser (behaviour preserved end-to-end)**

Start the server and load the app:
```bash
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs
```
Then, in the browser preview at `http://localhost:8137/app/`, reproduce the trace cases and confirm the on-screen result matches the design's expectations:
- Tick **weak_arm (left)** alone → a broad list of candidate lesions appears (does not collapse to one).
- Add **weak_leg (left)** → the list narrows.
- Add **neglect (left)** → the list narrows to **Complete non-dominant MCA syndrome**, selected by default, with its Why/What panels shown.
- Load the **Wallenberg** preset → left lateral medulla ranks top with the vascular/dissection red flag.
- Confirm the browser console shows no errors (`read_console_messages`).

Capture a screenshot of the narrowed MCA case as proof.

- [ ] **Step 8: Commit**

```bash
git add app/app.js
git commit -m "refactor(app): consume unified solve() — drop app-side localisation logic"
```

---

## Notes for the implementer

- **Do not** import `nameForSite` (or anything from `src/data/syndromes.js`) into `src/engine/inverse.js`. The tie-break is `site.id`, deliberately. This is the one place the old app code differed and the one boundary this refactor must respect.
- The four new `solve()` fields are **additive**; if any pre-existing suite goes red after Task 2, the cause is almost certainly an accidental edit to `single`/`best`/`multi`/`nearFit`/`level`/`length`, not the additions — diff against `HEAD` before debugging further.
- Counts like "379 sites" or "42 differential rows" are **not** asserted in tests on purpose — they drift as anatomy coverage grows. The suite pins relational behaviour (fan-out, narrowing, superset, ordering) instead.
