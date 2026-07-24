# Central Cord / Syrinx Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the central cord / syringomyelia picture — bilateral, suspended (cape-like), dissociated pain/temperature loss with preserved dorsal columns — *emerge* from a commissural spinothalamic structure in a bilateral central site, with no syndrome encoded as a rule.

**Architecture:** One genuinely new thing (the suspended/at-level distribution) enters as a distinct localising finding `suspended_sensory`, produced by a new `commissural_stt` structure in a new `central` cord part. Everything else reuses existing machinery: bilaterality via the `side:"bilateral"` composite, dissociation as an emergent consequence of the structure carrying only spinothalamic fibres, and localisation via the existing scorer.

**Tech Stack:** Node.js ES modules, zero dependencies. Hand-rolled standalone test runners (repo convention — see `test/cord.test.js`).

## Global Constraints

- **Node is not on PATH.** Prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`, run from repo root `Code/neurolocaliser-engine/`.
- **No git for this project** (user choice). Each "Checkpoint" step replaces the usual commit: run the full suite and confirm green.
- **UK spelling** everywhere.
- **Derive-don't-store:** no syndrome as an `if` rule; `syndromes.js` stays a phonebook keyed by emergent site.
- **Backward compatibility:** the existing 8 brainstem + 5 cord + 22 sensory-level tests must stay green. The transverse cord test is the key guard for the site-composite change.
- **Spec:** `docs/superpowers/specs/2026-07-12-central-cord-syrinx-design.md`.

## File Structure

- **Modify** `src/model/findings.js` — add `suspended_sensory` to `FINDINGS` and `CROSSES`.
- **Modify** `src/model/structures.js` — add `commissural_stt` (part `central`).
- **Modify** `src/model/sites.js` — `TERRITORY["cord|central"]`; `composeBilateralCordSites` gains the central site and redefines the transverse composite to below-level parts only.
- **Modify** `src/engine/score.js` — add `suspended_sensory` to `LOCALISING`.
- **Modify** `src/engine/inverse.js` — central/suspended branch in `describeLevel`, before the generic cord branches.
- **Modify** `src/data/syndromes.js` — `cord_central` phonebook entry.
- **Create** `test/central-cord.test.js` — emergence + level-note tests.
- **Modify** `package.json` — test script runs the fourth suite.
- **Modify** `README.md` — status line.

Run command used throughout (from `Code/neurolocaliser-engine/`):
```
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/central-cord.test.js
```

---

### Task 1: Central-cord anatomy — finding, structure, site, name

Adds the substrate so the central-cord syndrome emerges. All model + data edits land together because the emergence test exercises them as one unit (a finding with no structure, or a site with no name, is not independently meaningful).

**Files:**
- Modify: `src/model/findings.js`
- Modify: `src/model/structures.js`
- Modify: `src/model/sites.js`
- Modify: `src/engine/score.js`
- Modify: `src/data/syndromes.js`
- Test: `test/central-cord.test.js`

**Interfaces:**
- Consumes: existing `solve` from `src/engine/inverse.js`; `nameForSite` from `src/data/syndromes.js`; `composeBilateralCordSites` / `SITES` from `src/model/sites.js`.
- Produces: finding id `suspended_sensory`; structure id `commissural_stt` (level `cord`, part `central`); site id `bilateral_cord_central` (side `bilateral`, level `cord`, part `central`); phonebook key `cord_central`.

- [ ] **Step 1: Write the failing test**

Create `test/central-cord.test.js`:

```js
// central-cord.test.js — the central cord / syringomyelia (intramedullary) picture.
// A syrinx strikes the decussating spinothalamic fibres in the anterior white commissure:
// bilateral, SUSPENDED (cape-like) dissociated pain/temperature loss, dorsal columns preserved,
// sacral sparing. The suspended distribution is a distinct localising finding.
// Run: node test/central-cord.test.js

import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
function eq(label, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want);
  log.push({ label, ok: good, got, want });
  good ? pass++ : fail++;
}

const central = ["suspended_sensory@left", "suspended_sensory@right"];

// 1. Emergence — suspended dissociated loss localises to the central cord.
{
  const { best } = solve(new Set(central));
  ok("central -> bilateral_cord_central", best && best.site.id === "bilateral_cord_central");
  ok("  named Central cord", best && /central cord/i.test(nameForSite(best.site).name));
}
// 2. Dissociation guard — not confused with anterior cord (no weakness predicted).
{
  const { best } = solve(new Set(central));
  ok("central is not anterior cord", best && best.site.id !== "bilateral_cord_anterior");
}

// ---- report ----
console.log("\nNeuroLocaliser — CENTRAL CORD / syrinx tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}` + (r.ok ? "" : `  (got ${JSON.stringify(r.got)}, want ${JSON.stringify(r.want)})`));
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/central-cord.test.js`
Expected: FAIL — no site produces `suspended_sensory`, so `best` is `null` or a wrong site; `central -> bilateral_cord_central` fails.

- [ ] **Step 3: Add the finding**

In `src/model/findings.js`, inside `FINDINGS`, add after the `spinothalamic:` line (in the Long-tract group):

```js
  suspended_sensory:{ desc: "Suspended dissociated sensory loss (cape-like bilateral pain/temperature loss, dorsal columns preserved)", group: "Long tract" },
```

In the same file, inside the `CROSSES` object, add (near the other long-tract entries):

```js
  suspended_sensory: false, // bilateral by nature (commissural); crossing is moot for the bilateral central site
```

- [ ] **Step 4: Add the structure**

In `src/model/structures.js`, inside the `STRUCTURES` array, add to the `// ---- SPINAL CORD ----` block, after the `dc_cord` entry:

```js
  { id: "commissural_stt", level: "cord", part: "central", produces: "suspended_sensory", crosses: false,
    note: "decussating spinothalamic fibres in the anterior white commissure — a central (syrinx) lesion gives bilateral, suspended, dissociated pain/temperature loss with sacral sparing" },
```

- [ ] **Step 5: Add territory + central site, redefine transverse**

In `src/model/sites.js`, in the `TERRITORY` map, add after the `"cord|posterior"` entry:

```js
  "cord|central":     "central cord / periependymal (syrinx, intramedullary)",
```

In `src/model/sites.js`, replace the body of `composeBilateralCordSites`. Find:

```js
export function composeBilateralCordSites() {
  const cordParts = ["anterior", "posterior"];
  const structuresForPart = part =>
    STRUCTURES.filter(s => s.level === "cord" && s.part === part).map(s => s.id);

  const sites = [];
  for (const part of cordParts) {
    const structures = structuresForPart(part);
    if (structures.length === 0) continue;
    sites.push({
      id: `bilateral_cord_${part}`,
      side: "bilateral", level: "cord", part,
      territory: TERRITORY[`cord|${part}`],
      structures, composite: true
    });
  }

  const allCord = STRUCTURES.filter(s => s.level === "cord").map(s => s.id);
  if (allCord.length > 0) {
    sites.push({
      id: "bilateral_cord_transverse",
      side: "bilateral", level: "cord", part: "transverse",
      territory: "complete cord cross-section (transverse myelopathy)",
      structures: allCord, composite: true
    });
  }
  return sites;
}
```

Replace with:

```js
export function composeBilateralCordSites() {
  const cordParts = ["anterior", "posterior", "central"];
  const structuresForPart = part =>
    STRUCTURES.filter(s => s.level === "cord" && s.part === part).map(s => s.id);

  const sites = [];
  for (const part of cordParts) {
    const structures = structuresForPart(part);
    if (structures.length === 0) continue;
    sites.push({
      id: `bilateral_cord_${part}`,
      side: "bilateral", level: "cord", part,
      territory: TERRITORY[`cord|${part}`],
      structures, composite: true
    });
  }

  // Transverse = the complete cord CROSS-SECTION, i.e. the below-level long tracts (anterior +
  // posterior). It deliberately excludes the central commissural fibres: a complete transverse
  // lesion is described by below-level loss, not a suspended cape.
  const belowLevel = STRUCTURES
    .filter(s => s.level === "cord" && (s.part === "anterior" || s.part === "posterior"))
    .map(s => s.id);
  if (belowLevel.length > 0) {
    sites.push({
      id: "bilateral_cord_transverse",
      side: "bilateral", level: "cord", part: "transverse",
      territory: "complete cord cross-section (transverse myelopathy)",
      structures: belowLevel, composite: true
    });
  }
  return sites;
}
```

In `src/engine/score.js`, add `suspended_sensory` to the `LOCALISING` set. Find:

```js
const LOCALISING = new Set([
  "cn3_palsy","cn4_palsy","cn6_palsy","cn7_lmn","cn8_vertigo","cn_bulbar","cn12_palsy",
  "gaze_palsy","ino","horner","limb_ataxia","face_pain_loss","tremor_rubral"
]);
```

Replace with:

```js
const LOCALISING = new Set([
  "cn3_palsy","cn4_palsy","cn6_palsy","cn7_lmn","cn8_vertigo","cn_bulbar","cn12_palsy",
  "gaze_palsy","ino","horner","limb_ataxia","face_pain_loss","tremor_rubral",
  "suspended_sensory" // cape-like dissociated loss strongly pins the central/intramedullary cord
]);
```

- [ ] **Step 6: Add the phonebook entry**

In `src/data/syndromes.js`, inside `BY_SITE`, add after the `cord_transverse` entry (before the closing `};` of `BY_SITE`):

```js
  cord_central: {
    name: "Central cord syndrome (syringomyelia / intramedullary)",
    note: "Central expansion strikes the decussating spinothalamic fibres in the anterior white commissure: bilateral, suspended (cape-like) dissociated pain/temperature loss with dorsal columns preserved and characteristic sacral sparing.",
    ddx: ["Syringomyelia (± Chiari I)", "Intramedullary tumour (ependymoma, astrocytoma)", "Post-traumatic syrinx", "Hydromyelia"],
    red: "Sacral sparing + a suspended dissociated loss points intramedullary — MRI the cord; exclude a tumour or Chiari malformation."
  },
```

- [ ] **Step 7: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/central-cord.test.js`
Expected: PASS — `3 passed, 0 failed`.

- [ ] **Step 8: Checkpoint (no git) — regression guard**

Run the three existing suites and confirm none moved (the transverse test is the key guard):
`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js`
Expected: `8 passed`, then `5 passed`, then `22 passed` — all `0 failed`.

---

### Task 2: Suspended-level reporting in `describeLevel`

**Files:**
- Modify: `src/engine/inverse.js`
- Test: `test/central-cord.test.js` (append the level-note cases)

**Interfaces:**
- Consumes: `describeLevel(best, sensoryLevel)` and `solve(observedSet, options)` from Task 1's model; `normaliseLevel`, `regionOf`, `landmarkOf` already imported in `inverse.js`.
- Produces: for a central best site, `solve(...).level` is `{ given, applies:false, segment, region, landmark, note }` where `note` contains "suspended".

- [ ] **Step 1: Write the failing tests**

In `test/central-cord.test.js`, insert this block **immediately before** the `// ---- report ----` line:

```js
// 3. Suspended level note — a cape has no single below-the-level sensory level.
{
  const { level } = solve(new Set(central));
  ok("central level does not apply", level.applies === false);
  ok("  note flags suspended", /suspended/.test(level.note));
}
// 4. Suspended note carries a supplied level as the cape's approximate centre.
{
  const { level } = solve(new Set(central), { sensoryLevel: "C6" });
  ok("central+C6 still suspended", level.applies === false && /suspended/.test(level.note));
  eq("  segment carried", level.segment, "C6");
  eq("  region carried", level.region, "cervical");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/central-cord.test.js`
Expected: FAIL — for a central best site `describeLevel` currently returns the generic "level undetermined" note (no "suspended"), and case 4's `segment` is `null` because the generic cord+no-op path is taken.

- [ ] **Step 3: Add the central branch to `describeLevel`**

In `src/engine/inverse.js`, find the start of `describeLevel`:

```js
export function describeLevel(best, sensoryLevel) {
  const raw = (typeof sensoryLevel === "string" && sensoryLevel.trim() !== "") ? sensoryLevel : null;
  const isCord = !!best && best.site.level === "cord";
  const segment = normaliseLevel(raw);
  const base = { given: raw, applies: false, segment: null, region: null, landmark: null, note: "" };

  if (isCord && segment) {
```

Insert the central branch between the `base` line and the `if (isCord && segment)` line, so it reads:

```js
export function describeLevel(best, sensoryLevel) {
  const raw = (typeof sensoryLevel === "string" && sensoryLevel.trim() !== "") ? sensoryLevel : null;
  const isCord = !!best && best.site.level === "cord";
  const segment = normaliseLevel(raw);
  const base = { given: raw, applies: false, segment: null, region: null, landmark: null, note: "" };

  // Central (syrinx) lesions cause a SUSPENDED cape, not a below-the-level deficit — the single
  // "below the level" sensory level does not apply. Checked before the generic cord branches.
  if (isCord && best.site.part === "central") {
    return { given: raw, applies: false, segment,
      region: segment ? regionOf(segment) : null, landmark: segment ? landmarkOf(segment) : null,
      note: "suspended (cape-like) distribution — the sensory loss spans the lesion's segments and is spared above and below, so a single below-the-level sensory level does not apply" };
  }

  if (isCord && segment) {
```

(Leave the rest of `describeLevel` unchanged.)

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/central-cord.test.js`
Expected: PASS — `8 passed, 0 failed`.

- [ ] **Step 5: Checkpoint (no git) — regression guard**

The `describeLevel` change only fires for `part === "central"`, so the sensory-level suite (which uses hemi/anterior sites) must be untouched:
`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/sensory-level.test.js`
Expected: `22 passed, 0 failed`.

---

### Task 3: Wire-up — test script & README

**Files:**
- Modify: `package.json` (the `scripts.test` line)
- Modify: `README.md` (Running + Status sections)

**Interfaces:**
- Consumes: all four test files.
- Produces: `npm test` runs all four suites.

- [ ] **Step 1: Update the test script**

In `package.json`, replace:

```json
    "test": "node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js"
```

with:

```json
    "test": "node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js && node test/central-cord.test.js"
```

- [ ] **Step 2: Run the whole suite via npm**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: four blocks — `8 passed`, `5 passed`, `22 passed`, `8 passed` — and exit code 0.

- [ ] **Step 3: Update the README**

In `README.md`, under `## Running`, add after the `node test/sensory-level.test.js` line:

```
node test/central-cord.test.js   # central cord / syringomyelia
```

In `README.md`, in the `## Status` paragraph, replace the sentence
"Central cord and cauda equina are the next increments."
with:
"Central cord / syringomyelia now emerges too — bilateral, suspended (cape-like) dissociated pain/temperature loss with preserved dorsal columns and sacral sparing — from a commissural spinothalamic structure. Cauda equina / conus is the next increment."

- [ ] **Step 4: Checkpoint (no git)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all four suites green, exit 0.

---

### Post-plan (orchestrator, not a subagent step)

After Task 3 is green, update the living architecture artefact (same URL) via the Artifact tool:
add the central cord to region coverage (done), advance the "now" focus to cauda equina / conus,
bump the test count to 43 (8 + 5 + 22 + 8), and note `central` part / `commissural_stt` on the
structures/sites cards. Then refresh the project memory (`neurolocaliser-engine-state`) with the
central-cord capability and the new counts.

## Self-Review

**Spec coverage:**
- `suspended_sensory` finding + `CROSSES` → Task 1 Step 3. ✓
- `commissural_stt` structure (part `central`) → Task 1 Step 4. ✓
- `bilateral_cord_central` site + `cord|central` territory + transverse redefinition (below-level only) → Task 1 Step 5. ✓
- `suspended_sensory` in `LOCALISING` → Task 1 Step 5. ✓
- `cord_central` phonebook entry → Task 1 Step 6. ✓
- `describeLevel` central/suspended branch, before the generic cord branches → Task 2 Step 3. ✓
- Emergence + dissociation guard + suspended-note tests → Task 1 (targets 1,2) + Task 2 (targets 3,4). ✓
- Regression guards (esp. transverse) → Task 1 Step 8, Task 2 Step 5, Task 3 Step 4. ✓
- `central` NOT added to `PARTS` (so Brown-Séquard's hemi composite is untouched) → no task edits `PARTS`; the central site comes only from `composeBilateralCordSites`. ✓
- README/package.json wire-up → Task 3. ✓
- Out-of-scope items (traumatic central cord, LMN, sacral-sparing reasoning, level span) → no tasks created. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step states the exact command and expected output. ✓

**Type consistency:** `describeLevel` returns the same six-key shape (`given, applies, segment, region, landmark, note`) in the new branch as elsewhere; tests read `level.applies/segment/region/note`; `solve` return shape unchanged. Site/finding/structure ids are identical across tasks: `suspended_sensory`, `commissural_stt`, `bilateral_cord_central`, `cord_central`. Test tallies: Task 1 = 3 checks; Task 2 adds case 3 (2) + case 4 (3) = 5 → 8 total, matching Task 2 Step 4 and the npm block (`8 passed`). ✓
