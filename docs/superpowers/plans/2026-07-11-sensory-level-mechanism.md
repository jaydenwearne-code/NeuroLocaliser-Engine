# Sensory-Level Mechanism Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the spinal-cord model a dermatomal *sensory level* so the engine reports "Brown-Séquard at ~T10" — pinning the segment when a sensory level is supplied, staying level-agnostic when it isn't.

**Architecture:** The sensory level is an axis *orthogonal* to the cross-sectional pattern: the tracts are identical at every segment, so the level never changes which site wins. A new pure module `src/model/levels.js` holds the ordered dermatome coordinate; `solve()` gains an optional `options.sensoryLevel` and attaches a computed `level` object to its result. No new findings, no per-segment sites, no change to scoring.

**Tech Stack:** Node.js ES modules, zero dependencies. Hand-rolled test runners (the repo convention — see `test/engine.test.js`, `test/cord.test.js`), each a standalone script ending in `process.exit`.

## Global Constraints

- **Node is not on PATH.** Run everything with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"` prefixed, from the repo root `Code/neurolocaliser-engine/`.
- **No git for this project** (user choice). Every "Checkpoint" step below replaces the usual commit: run the full suite and confirm green before moving on.
- **UK spelling** everywhere (e.g. "unrecognised", "localise").
- **Derive-don't-store:** no syndrome encoded as a rule; `levels.js` knows nothing of findings/sites/scoring.
- **Backward compatibility:** `solve(observedSet)` with no second argument must stay byte-identical in behaviour; the existing 8 brainstem + 5 cord tests must remain green.
- **Spec:** `docs/superpowers/specs/2026-07-11-sensory-level-mechanism-design.md`.

## File Structure

- **Create** `src/model/levels.js` — ordered dermatome coordinate + pure helpers (`CORD_LEVELS`, `normaliseLevel`, `isKnownLevel`, `levelIndex`, `isBelow`, `regionOf`, `landmarkOf`). One responsibility: the level axis. No imports.
- **Modify** `src/engine/inverse.js` — import from `levels.js`; add exported `describeLevel(best, sensoryLevel)`; add `options` param to `solve` and include `level` in its return. Additive only.
- **Create** `test/sensory-level.test.js` — hand-rolled runner covering the `levels.js` units (Task 1) and the `solve()` level layer (Task 2).
- **Modify** `package.json` — `test` script runs the third suite.
- **Modify** `README.md` — status line notes the sensory level.

Run command used throughout (from `Code/neurolocaliser-engine/`):
```
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/sensory-level.test.js
```

---

### Task 1: `levels.js` — ordered dermatome coordinate

**Files:**
- Create: `src/model/levels.js`
- Test: `test/sensory-level.test.js` (the `levels.js` units section)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `CORD_LEVELS: string[]` — ordered `C2…C8, T1…T12, L1…L5, S1…S5`.
  - `normaliseLevel(raw): string | null` — trims + upper-cases; canonical segment or `null`.
  - `isKnownLevel(raw): boolean`
  - `levelIndex(raw): number` — 0-based; `-1` if unknown.
  - `isBelow(a, b): boolean` — true iff `a` is further caudal than `b`; false if either unknown.
  - `regionOf(raw): "cervical"|"thoracic"|"lumbar"|"sacral"|null`
  - `landmarkOf(raw): string | null` — teaching anchors only.

- [ ] **Step 1: Write the failing test**

Create `test/sensory-level.test.js` with the runner scaffold and the `levels.js` unit checks:

```js
// sensory-level.test.js — the sensory-level (dermatomal) mechanism.
// Level is ORTHOGONAL to the cross-sectional pattern: it never changes which site wins, it only
// reports WHERE along the cord. Run: node test/sensory-level.test.js

import { solve } from "../src/engine/inverse.js";
import { CORD_LEVELS, levelIndex, isBelow, regionOf, landmarkOf, isKnownLevel } from "../src/model/levels.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
function eq(label, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want);
  log.push({ label, ok: good, got, want });
  good ? pass++ : fail++;
}

// ---- levels.js units ----
ok("CORD_LEVELS indices strictly monotonic", CORD_LEVELS.every((n, i) => levelIndex(n) === i));
ok("isBelow(T11, T10) is true", isBelow("T11", "T10") === true);
ok("isBelow(T10, T11) is false", isBelow("T10", "T11") === false);
eq("regionOf(L1)", regionOf("L1"), "lumbar");
eq("landmarkOf(T10)", landmarkOf("T10"), "umbilicus");
ok("unknown level not known", isKnownLevel("Z9") === false);
ok("case/space-insensitive", isKnownLevel(" t10 ") === true);

// ---- report ----
console.log("\nNeuroLocaliser — SENSORY-LEVEL mechanism tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}` + (r.ok ? "" : `  (got ${JSON.stringify(r.got)}, want ${JSON.stringify(r.want)})`));
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/sensory-level.test.js`
Expected: FAIL — `Cannot find module '.../src/model/levels.js'` (the module doesn't exist yet).

- [ ] **Step 3: Write the module**

Create `src/model/levels.js`:

```js
// levels.js — the ordered spinal-cord dermatome coordinate.
//
// The cord's cross-sectional pattern (which tracts, which sides) says WHICH syndrome; this module
// supplies the orthogonal axis — WHERE along the cord. A plain ordered list of segments plus pure
// helpers, with no knowledge of findings, sites or scoring. Index position defines "below": a
// higher index is further caudal.

export const CORD_LEVELS = [
  "C2","C3","C4","C5","C6","C7","C8",
  "T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12",
  "L1","L2","L3","L4","L5",
  "S1","S2","S3","S4","S5"
];

const INDEX = Object.fromEntries(CORD_LEVELS.map((name, i) => [name, i]));

// Normalise a raw input to a canonical segment name, or null if unrecognised.
export function normaliseLevel(raw) {
  if (typeof raw !== "string") return null;
  const name = raw.trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(INDEX, name) ? name : null;
}

export function isKnownLevel(raw) { return normaliseLevel(raw) !== null; }

// 0-based position in CORD_LEVELS; -1 if unknown.
export function levelIndex(raw) {
  const name = normaliseLevel(raw);
  return name === null ? -1 : INDEX[name];
}

// True if segment a is BELOW segment b (further caudal). False if either is unknown or a is at/above b.
export function isBelow(a, b) {
  const ia = levelIndex(a), ib = levelIndex(b);
  if (ia < 0 || ib < 0) return false;
  return ia > ib;
}

// Region from the segment prefix; null if unknown.
export function regionOf(raw) {
  const name = normaliseLevel(raw);
  if (name === null) return null;
  return { C: "cervical", T: "thoracic", L: "lumbar", S: "sacral" }[name[0]] || null;
}

// Teaching landmark for the common sensory anchors only; null otherwise. Descriptive.
const LANDMARKS = { C4: "clavicle", T4: "nipple", T6: "xiphisternum", T10: "umbilicus", L1: "groin" };
export function landmarkOf(raw) {
  const name = normaliseLevel(raw);
  return name === null ? null : (LANDMARKS[name] || null);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/sensory-level.test.js`
Expected: PASS — `7 passed, 0 failed`.

- [ ] **Step 5: Checkpoint (no git)**

Run the full existing suite to confirm nothing else moved:
`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/engine.test.js && node test/cord.test.js`
Expected: `8 passed` then `5 passed`.

---

### Task 2: `solve()` level layer — `describeLevel` + optional `sensoryLevel`

**Files:**
- Modify: `src/engine/inverse.js`
- Test: `test/sensory-level.test.js` (append the `solve()` level-layer section)

**Interfaces:**
- Consumes: `normaliseLevel`, `regionOf`, `landmarkOf` from `src/model/levels.js`; existing `rankSingle`, `coversAllLocalising`, `minimalSet` in `inverse.js`.
- Produces:
  - `describeLevel(best, sensoryLevel): { given, applies, segment, region, landmark, note }` where `best` is a scored-site result (`{ site, ... }`) or `null`.
  - `solve(observedSet, options = {})` now returns `{ single, best, singleExplainsAll, multi, level }`; `options.sensoryLevel` is an optional segment string.

- [ ] **Step 1: Write the failing tests**

In `test/sensory-level.test.js`, insert the following block **immediately before** the `// ---- report ----` line:

```js
// ---- solve() level layer ----
const brownSeq = ["hemiparesis@left", "dorsal_sensory@left", "spinothalamic@right"];
const asa = ["hemiparesis@left","hemiparesis@right","spinothalamic@left","spinothalamic@right"];
const weber = ["cn3_palsy@left","hemiparesis@right","facial_weak_umn@right"];

// 1. Pin — cord + valid level
{
  const { best, level } = solve(new Set(brownSeq), { sensoryLevel: "T10" });
  ok("Brown-Séquard+T10 -> left_cord_hemi", best && best.site.id === "left_cord_hemi");
  ok("  level applies", level.applies === true);
  eq("  segment", level.segment, "T10");
  eq("  region", level.region, "thoracic");
}
// 2. Agnostic — cord, no level
{
  const { best, level } = solve(new Set(brownSeq));
  ok("Brown-Séquard (no level) -> left_cord_hemi", best && best.site.id === "left_cord_hemi");
  ok("  level undetermined", level.applies === false && level.segment === null);
}
// 3. Second pattern + level
{
  const { best, level } = solve(new Set(asa), { sensoryLevel: "T4" });
  ok("ASA+T4 -> bilateral_cord_anterior", best && best.site.id === "bilateral_cord_anterior");
  eq("  segment", level.segment, "T4");
  eq("  region", level.region, "thoracic");
}
// 5. Inconsistency — non-cord best but a level was given
{
  const { best, level } = solve(new Set(weber), { sensoryLevel: "T10" });
  ok("Weber+T10 -> left_midbrain_medial", best && best.site.id === "left_midbrain_medial");
  ok("  level does not apply", level.applies === false);
  ok("  note flags inconsistency", /suggests a spinal cord lesion/.test(level.note));
}
// 6. Graceful invalid — cord + unknown level, no throw
{
  const { best, level } = solve(new Set(brownSeq), { sensoryLevel: "Z9" });
  ok("cord+invalid -> still left_cord_hemi", best && best.site.id === "left_cord_hemi");
  ok("  level not applied", level.applies === false);
  ok("  note flags unrecognised", /unrecognised/.test(level.note));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/sensory-level.test.js`
Expected: FAIL — the new cases throw/mismatch because `solve` does not yet return `level` (`Cannot read properties of undefined (reading 'applies')`).

- [ ] **Step 3: Add the import**

In `src/engine/inverse.js`, add to the imports at the top of the file (after the existing `import { expectedFindings } ...` line):

```js
import { normaliseLevel, regionOf, landmarkOf } from "../model/levels.js";
```

- [ ] **Step 4: Add `describeLevel`**

In `src/engine/inverse.js`, add this exported function immediately above the `// ---- TOP-LEVEL SOLVE ----` comment:

```js
// ---- SENSORY LEVEL (orthogonal to which site wins) ----
// The cross-sectional pattern says WHICH syndrome; the sensory level says WHERE along the cord.
// It never changes the localisation — it annotates it. Reports the segment when the best site is
// in the cord and a valid level was given; otherwise explains why the level does not apply.
export function describeLevel(best, sensoryLevel) {
  const raw = (typeof sensoryLevel === "string" && sensoryLevel.trim() !== "") ? sensoryLevel : null;
  const isCord = !!best && best.site.level === "cord";
  const segment = normaliseLevel(raw);
  const base = { given: raw, applies: false, segment: null, region: null, landmark: null, note: "" };

  if (isCord && segment) {
    return { given: raw, applies: true, segment, region: regionOf(segment), landmark: landmarkOf(segment),
      note: `lesion at or just above ${segment} (the sensory level typically sits a segment or two below the lesion)` };
  }
  if (isCord && raw && !segment) {
    return { ...base, note: `unrecognised sensory level '${raw}'; expected a segment such as T10` };
  }
  if (isCord && !raw) {
    return { ...base, note: "level undetermined — a sensory level is needed to localise the segment" };
  }
  if (!isCord && raw) {
    return { given: raw, applies: false, segment, region: segment ? regionOf(segment) : null,
      landmark: segment ? landmarkOf(segment) : null,
      note: `a sensory level suggests a spinal cord lesion, but the findings localise to ${best ? best.site.id : "(no site)"}` };
  }
  return base;
}
```

- [ ] **Step 5: Thread it through `solve`**

In `src/engine/inverse.js`, replace the existing `solve` function:

```js
export function solve(observedSet) {
  const single = rankSingle(observedSet);
  const best = single[0] || null;
  const singleExplainsAll = best ? coversAllLocalising(best, observedSet) : false;

  let multi = null;
  if (!singleExplainsAll) {
    const ms = minimalSet(observedSet);
    // Only surface a multifocal hypothesis if it needs >1 site (otherwise the single ranking already has it).
    if (ms && ms.sites.length > 1) multi = ms;
  }

  return { single, best, singleExplainsAll, multi };
}
```

with:

```js
export function solve(observedSet, options = {}) {
  const single = rankSingle(observedSet);
  const best = single[0] || null;
  const singleExplainsAll = best ? coversAllLocalising(best, observedSet) : false;

  let multi = null;
  if (!singleExplainsAll) {
    const ms = minimalSet(observedSet);
    // Only surface a multifocal hypothesis if it needs >1 site (otherwise the single ranking already has it).
    if (ms && ms.sites.length > 1) multi = ms;
  }

  const level = describeLevel(best, options.sensoryLevel);
  return { single, best, singleExplainsAll, multi, level };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/sensory-level.test.js`
Expected: PASS — `22 passed, 0 failed`.

- [ ] **Step 7: Checkpoint (no git) — regression guard**

Confirm the existing suites are untouched (backward compatibility):
`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/engine.test.js && node test/cord.test.js`
Expected: `8 passed, 0 failed` then `5 passed, 0 failed`.

---

### Task 3: Wire-up — test script & README

**Files:**
- Modify: `package.json:6-8` (the `scripts.test` line)
- Modify: `README.md` (Running + Status sections)

**Interfaces:**
- Consumes: the three test files from Tasks 1–2 and the existing suites.
- Produces: `npm test` runs all three suites.

- [ ] **Step 1: Update the test script**

In `package.json`, replace:

```json
    "test": "node test/engine.test.js && node test/cord.test.js"
```

with:

```json
    "test": "node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js"
```

- [ ] **Step 2: Run the whole suite via npm**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: three blocks — `8 passed`, `5 passed`, `22 passed` — and exit code 0.

- [ ] **Step 3: Update the README status**

In `README.md`, replace the two `node test/...` lines under `## Running` with:

```
npm test                      # runs all three emergence suites, no dependencies
node test/engine.test.js      # brainstem syndromes
node test/cord.test.js        # spinal cord syndromes
node test/sensory-level.test.js  # dermatomal sensory-level mechanism
```

In `README.md`, in the `## Status` paragraph, replace the sentence
"The cord is modelled as one generic level for now; multi-level discrimination via a sensory level, plus central cord and cauda equina, are the next increments."
with:
"The cord carries a dermatomal **sensory level** (orthogonal to the cross-sectional pattern): given a stated sensory level the engine pins the segment (e.g. Brown-Séquard at ~T10), otherwise it reports the level as undetermined. Central cord and cauda equina are the next increments."

- [ ] **Step 4: Checkpoint (no git)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all three suites green.

---

### Post-plan (orchestrator, not a subagent step)

After Task 3 is green, update the living architecture artefact (same URL) via the Artifact tool:
flip `levels.js`, the `inverse.js` level layer, and `sensory-level.test.js` from "this step" to
"built", advance the header to the next step (central cord / cauda equina), and bump the test
count to 35 (8 + 5 + 22). Then refresh the two project memories if the state summary changed.

## Self-Review

**Spec coverage:**
- `levels.js` with `CORD_LEVELS`/`levelIndex`/`isBelow`/`regionOf`/`landmarkOf`/`isKnownLevel`/`normaliseLevel` → Task 1. ✓
- `solve(observedSet, options)` + `describeLevel` rules table (cord+valid, cord+absent, cord+invalid, non-cord+present, non-cord+absent) → Task 2, Steps 4–5. ✓
- Input normalisation (trim/upper-case, raw preserved in `given`) → `normaliseLevel` (Task 1) + `describeLevel` (Task 2). ✓
- Clinical offset reported not matched → in the cord+valid `note`. ✓
- `nameForSite` untouched → no task modifies `syndromes.js`. ✓
- Backward compatibility → Task 2 Step 7 + Task 3 Step 4 regression checkpoints. ✓
- Six TDD targets → Task 1 (target 4) + Task 2 (targets 1,2,3,5,6). ✓
- README/package.json wire-up → Task 3. ✓
- Out-of-scope items (central cord, cauda equina, inferred level) → no tasks created for them. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step states the exact command and expected output. ✓

**Type consistency:** `describeLevel(best, sensoryLevel)` returns the same six-key object shape in every branch (`given, applies, segment, region, landmark, note`); tests read `level.applies/segment/region/note`; `solve` returns `{ single, best, singleExplainsAll, multi, level }` and tests destructure `{ best, level }`. Test tallies: Task 1 = 7 checks; Task 2 adds cases 1(4)+2(2)+3(3)+5(3)+6(3) = 15 → 22 total, matching Step 6. ✓
