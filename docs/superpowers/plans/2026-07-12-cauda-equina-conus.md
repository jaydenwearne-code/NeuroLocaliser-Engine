# Cauda Equina / Conus Medullaris Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make cauda equina and conus medullaris *emerge* from a new below-cord region — with the classic CES-vs-conus distinction falling out of a UMN-vs-LMN finding split — and no syndrome encoded as a rule.

**Architecture:** Five new findings enter the vocabulary (lmn_weakness, saddle_anaesthesia, sphincter_dysfunction, umn_signs, radicular_pain). Two new midline sites (cauda_equina, conus_medullaris) are composed from below-cord structures. A new `side: "midline"` emission in the forward model tags each finding `@midline` (no laterality). The existing scorer does the discrimination.

**Tech Stack:** Node.js ES modules, zero dependencies. Hand-rolled standalone test runners (repo convention).

## Global Constraints

- **Node is not on PATH.** Prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`, run from repo root `Code/neurolocaliser-engine/`.
- **No git for this project** (user choice). Each "Checkpoint" step replaces the commit: run the full suite and confirm green.
- **UK spelling** everywhere (e.g. "anaesthesia", "localise").
- **Derive-don't-store:** no syndrome as an `if` rule; `syndromes.js` stays a phonebook keyed by emergent site.
- **Backward compatibility:** the existing 8 + 5 + 22 + 8 = 43 tests must stay green. Midline emission fires only for `side: "midline"` sites; the new findings never appear in existing inputs; the new `describeLevel` branch fires only for cauda/conus best sites.
- **Spec:** `docs/superpowers/specs/2026-07-12-cauda-equina-conus-design.md`.

## File Structure

- **Modify** `src/model/findings.js` — 5 findings + 5 `CROSSES` entries.
- **Modify** `src/model/structures.js` — 7 below-cord structures (levels `cauda`, `conus`).
- **Modify** `src/model/sites.js` — 2 territories + `composeCaudaConusSites()`.
- **Modify** `src/engine/forward.js` — `midline` emission in `expectedFindings` + `explain`.
- **Modify** `src/engine/score.js` — 4 findings → `LOCALISING`.
- **Modify** `src/engine/inverse.js` — import + candidate list + `describeLevel` branch.
- **Modify** `src/data/syndromes.js` — `cauda_equina` + `conus_medullaris` entries.
- **Create** `test/cauda-conus.test.js`.
- **Modify** `package.json`, `README.md`.

Run command used throughout (from `Code/neurolocaliser-engine/`):
```
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cauda-conus.test.js
```

---

### Task 1: Below-cord anatomy — findings, structures, midline sites, emergence

Everything needed for CES + conus to emerge lands together: the emergence tests exercise findings, structures, the site composer, midline emission and the phonebook as one unit.

**Files:**
- Modify: `src/model/findings.js`, `src/model/structures.js`, `src/model/sites.js`, `src/engine/forward.js`, `src/engine/score.js`, `src/engine/inverse.js`, `src/data/syndromes.js`
- Test: `test/cauda-conus.test.js`

**Interfaces:**
- Consumes: `solve` from `inverse.js`; `nameForSite` from `syndromes.js`; `STRUCTURES` from `structures.js`; `TERRITORY` (module-local in `sites.js`).
- Produces: findings `lmn_weakness`, `umn_signs`, `saddle_anaesthesia`, `sphincter_dysfunction`, `radicular_pain`; site ids `cauda_equina` (level `cauda`, part `equina`), `conus_medullaris` (level `conus`, part `medullaris`), both `side: "midline"`; phonebook keys `cauda_equina`, `conus_medullaris`; exported `composeCaudaConusSites()`.

- [ ] **Step 1: Write the failing test**

Create `test/cauda-conus.test.js`:

```js
// cauda-conus.test.js — the below-cord region: cauda equina vs conus medullaris.
// Both share saddle anaesthesia + sphincter dysfunction; the discriminator is UMN-vs-LMN —
// pure LMN (+ radicular pain) → cauda equina; UMN signs present → conus. Findings are midline.
// Run: node test/cauda-conus.test.js

import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

const ces = ["lmn_weakness@midline","saddle_anaesthesia@midline","sphincter_dysfunction@midline","radicular_pain@midline"];
const conus = ["umn_signs@midline","saddle_anaesthesia@midline","sphincter_dysfunction@midline"];

// 1. Cauda equina emergence
{
  const { best } = solve(new Set(ces));
  ok("CES -> cauda_equina", best && best.site.id === "cauda_equina");
  ok("  named Cauda equina", best && /cauda equina/i.test(nameForSite(best.site).name));
}
// 2. Conus emergence
{
  const { best } = solve(new Set(conus));
  ok("conus -> conus_medullaris", best && best.site.id === "conus_medullaris");
  ok("  named Conus", best && /conus/i.test(nameForSite(best.site).name));
}
// 3. Discrimination — shared saddle + sphincter don't collapse them
{
  const cesBest = solve(new Set(ces)).best;
  const conusBest = solve(new Set(conus)).best;
  ok("CES is not conus", cesBest && cesBest.site.id !== "conus_medullaris");
  ok("conus is not cauda", conusBest && conusBest.site.id !== "cauda_equina");
}

// ---- report ----
console.log("\nNeuroLocaliser — CAUDA EQUINA / CONUS tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cauda-conus.test.js`
Expected: FAIL — no site produces these findings, so `best` is `null`/wrong.

- [ ] **Step 3: Add the five findings**

In `src/model/findings.js`, inside `FINDINGS`, add after the `suspended_sensory:` line:

```js
  lmn_weakness:   { desc: "Flaccid, areflexic (lower motor neurone) weakness", group: "Root / LMN" },
  umn_signs:      { desc: "Upper motor neurone signs (hyperreflexia, extensor plantar)", group: "Root / LMN" },
  saddle_anaesthesia:{ desc: "Saddle anaesthesia (S2–S5 perineal sensory loss)", group: "Root / LMN" },
  sphincter_dysfunction:{ desc: "Bladder / bowel dysfunction (retention, incontinence, lax anal tone)", group: "Root / LMN" },
  radicular_pain: { desc: "Radicular pain (sciatica), often asymmetric", group: "Root / LMN" },
```

In the same file, inside `CROSSES`, add after the `suspended_sensory: false,` line:

```js
  lmn_weakness: false, umn_signs: false, saddle_anaesthesia: false,
  sphincter_dysfunction: false, radicular_pain: false, // midline / local — never cross
```

- [ ] **Step 4: Add the seven structures**

In `src/model/structures.js`, replace the end of the `// ---- SPINAL CORD ----` block. Find:

```js
  { id: "commissural_stt", level: "cord", part: "central", produces: "suspended_sensory", crosses: false,
    note: "decussating spinothalamic fibres in the anterior white commissure — a central (syrinx) lesion gives bilateral, suspended, dissociated pain/temperature loss with sacral sparing" }
];
```

Replace with:

```js
  { id: "commissural_stt", level: "cord", part: "central", produces: "suspended_sensory", crosses: false,
    note: "decussating spinothalamic fibres in the anterior white commissure — a central (syrinx) lesion gives bilateral, suspended, dissociated pain/temperature loss with sacral sparing" },

  // ---- CAUDA EQUINA (lumbosacral nerve roots, below the conus) ----
  { id: "ls_roots_motor",       level: "cauda", part: "equina", produces: "lmn_weakness",         crosses: false,
    note: "lumbosacral motor roots — flaccid, areflexic (LMN) leg weakness" },
  { id: "sacral_roots_sensory", level: "cauda", part: "equina", produces: "saddle_anaesthesia",    crosses: false,
    note: "S2–S5 sensory roots — saddle anaesthesia" },
  { id: "sacral_roots_autonom", level: "cauda", part: "equina", produces: "sphincter_dysfunction", crosses: false,
    note: "sacral parasympathetic roots — bladder/bowel/sphincter dysfunction" },
  { id: "ls_roots_pain",        level: "cauda", part: "equina", produces: "radicular_pain",         crosses: false,
    note: "compressed lumbosacral roots — radicular pain (sciatica), often asymmetric" },

  // ---- CONUS MEDULLARIS (sacral cord tip, ~T12–L1 vertebral) ----
  { id: "conus_cst",            level: "conus", part: "medullaris", produces: "umn_signs",            crosses: false,
    note: "corticospinal fibres at the conus — UMN signs (hyperreflexia, extensor plantar)" },
  { id: "conus_sacral_sensory", level: "conus", part: "medullaris", produces: "saddle_anaesthesia",    crosses: false,
    note: "sacral cord segments — early symmetric saddle anaesthesia" },
  { id: "conus_sacral_autonom", level: "conus", part: "medullaris", produces: "sphincter_dysfunction", crosses: false,
    note: "sacral autonomic centres — early symmetric bladder/bowel dysfunction" }
];
```

- [ ] **Step 5: Add territories + the site composer**

In `src/model/sites.js`, in the `TERRITORY` map, add after the `"cord|central"` entry:

```js
  "cauda|equina":     "lumbosacral nerve roots (thecal sac)",
  "conus|medullaris": "conus medullaris (distal cord tip, S2–S5)"
```

In `src/model/sites.js`, add this exported function at the end of the file:

```js
// The cauda equina (nerve roots) and conus medullaris (sacral cord tip) sit BELOW the cord.
// They are midline sites: their findings (saddle, sphincter, root weakness) have no side, so the
// forward model emits them once, @midline. Structures are DERIVED from the catalogue, not listed.
export function composeCaudaConusSites() {
  const build = (id, level, part) => {
    const structures = STRUCTURES.filter(s => s.level === level && s.part === part).map(s => s.id);
    return structures.length ? [{ id, side: "midline", level, part,
      territory: TERRITORY[`${level}|${part}`], structures, composite: true }] : [];
  };
  return [ ...build("cauda_equina", "cauda", "equina"),
           ...build("conus_medullaris", "conus", "medullaris") ];
}
```

- [ ] **Step 6: Add midline emission to the forward model**

In `src/engine/forward.js`, in `expectedFindings`, replace:

```js
    if (bilateral) {
      out.add(signed(struct.produces, "left"));
      out.add(signed(struct.produces, "right"));
    } else {
      out.add(signed(struct.produces, bodySideFor(struct.produces, site.side, struct)));
    }
```

with:

```js
    if (site.side === "midline") {
      out.add(signed(struct.produces, "midline"));
    } else if (bilateral) {
      out.add(signed(struct.produces, "left"));
      out.add(signed(struct.produces, "right"));
    } else {
      out.add(signed(struct.produces, bodySideFor(struct.produces, site.side, struct)));
    }
```

In `src/engine/forward.js`, in `explain`, replace:

```js
    const sides = bilateral
      ? ["left", "right"]
      : [bodySideFor(s.produces, site.side, s)];
```

with:

```js
    const sides = site.side === "midline" ? ["midline"]
      : bilateral ? ["left", "right"]
      : [bodySideFor(s.produces, site.side, s)];
```

- [ ] **Step 7: Add the candidate sites + LOCALISING findings**

In `src/engine/inverse.js`, replace the import:

```js
import { SITES, composeHemiLevelSites, composeBilateralCordSites } from "../model/sites.js";
```

with:

```js
import { SITES, composeHemiLevelSites, composeBilateralCordSites, composeCaudaConusSites } from "../model/sites.js";
```

In `src/engine/inverse.js`, replace `candidateSites`:

```js
function candidateSites() {
  return [...SITES, ...composeHemiLevelSites(), ...composeBilateralCordSites()];
}
```

with:

```js
function candidateSites() {
  return [...SITES, ...composeHemiLevelSites(), ...composeBilateralCordSites(), ...composeCaudaConusSites()];
}
```

In `src/engine/score.js`, replace the `LOCALISING` set:

```js
const LOCALISING = new Set([
  "cn3_palsy","cn4_palsy","cn6_palsy","cn7_lmn","cn8_vertigo","cn_bulbar","cn12_palsy",
  "gaze_palsy","ino","horner","limb_ataxia","face_pain_loss","tremor_rubral",
  "suspended_sensory" // cape-like dissociated loss strongly pins the central/intramedullary cord
]);
```

with:

```js
const LOCALISING = new Set([
  "cn3_palsy","cn4_palsy","cn6_palsy","cn7_lmn","cn8_vertigo","cn_bulbar","cn12_palsy",
  "gaze_palsy","ino","horner","limb_ataxia","face_pain_loss","tremor_rubral",
  "suspended_sensory", // cape-like dissociated loss strongly pins the central/intramedullary cord
  "saddle_anaesthesia","sphincter_dysfunction","umn_signs","lmn_weakness" // pin the below-cord region + CES/conus
]);
```

- [ ] **Step 8: Add the phonebook entries**

In `src/data/syndromes.js`, inside `BY_SITE`, add after the `cord_central` entry (before the closing `};`):

```js
  cauda_equina: {
    name: "Cauda equina syndrome",
    note: "Compression of the lumbosacral nerve roots below the conus: flaccid, areflexic (LMN) leg weakness, often asymmetric, with radicular pain (sciatica), saddle anaesthesia and bladder/bowel dysfunction.",
    ddx: ["Central lumbar disc prolapse", "Tumour / metastasis", "Epidural abscess or haematoma", "Trauma"],
    red: "A surgical emergency — new saddle anaesthesia, bladder dysfunction or bilateral sciatica needs urgent MRI and decompression."
  },
  conus_medullaris: {
    name: "Conus medullaris syndrome",
    note: "Lesion of the sacral cord tip: early, symmetric saddle anaesthesia and bladder/bowel dysfunction with a mixed UMN + LMN picture (UMN signs — hyperreflexia, extensor plantars) and relatively symmetric, less radicular leg involvement.",
    ddx: ["Intramedullary or extramedullary tumour", "Disc / compression at T12–L1", "Ischaemia", "Demyelination"],
    red: "Early symmetric sphincter involvement with UMN signs — urgent MRI of the conus; distinguish from cauda equina as it changes the level imaged."
  }
```

- [ ] **Step 9: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cauda-conus.test.js`
Expected: PASS — `6 passed, 0 failed`.

- [ ] **Step 10: Checkpoint (no git) — regression guard**

Run the four existing suites; none should move:
`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js && node test/central-cord.test.js`
Expected: `8 passed`, `5 passed`, `22 passed`, `8 passed` — all `0 failed`.

---

### Task 2: Below-cord level note in `describeLevel`

**Files:**
- Modify: `src/engine/inverse.js`
- Test: `test/cauda-conus.test.js` (append the level-note case)

**Interfaces:**
- Consumes: `describeLevel(best, sensoryLevel)`; `normaliseLevel`/`regionOf`/`landmarkOf` already imported in `inverse.js`.
- Produces: for a cauda/conus best site, `solve(...).level` is `{ ..., applies:false, note }` with the note naming the saddle / below-the-cord distribution.

- [ ] **Step 1: Write the failing test**

In `test/cauda-conus.test.js`, insert this block **immediately before** the `// ---- report ----` line:

```js
// 4. Below-cord level note — a sacral/saddle picture, not a single below-the-level sensory level.
{
  const { level } = solve(new Set(ces));
  ok("CES level does not apply", level.applies === false);
  ok("  note flags below-cord / saddle", /below the cord|saddle/i.test(level.note));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cauda-conus.test.js`
Expected: FAIL on "note flags below-cord / saddle" — `describeLevel` currently returns the `base` empty-note object for a cauda best site (not cord, no raw level), so the note is `""`.

- [ ] **Step 3: Add the cauda/conus branch**

In `src/engine/inverse.js`, in `describeLevel`, find the central branch and the pin branch:

```js
  if (isCord && best.site.part === "central") {
    return { given: raw, applies: false, segment,
      region: segment ? regionOf(segment) : null, landmark: segment ? landmarkOf(segment) : null,
      note: "suspended (cape-like) distribution — the sensory loss spans the lesion's segments and is spared above and below, so a single below-the-level sensory level does not apply" };
  }

  if (isCord && segment) {
```

Insert the below-cord branch between the central branch and `if (isCord && segment)`, so it reads:

```js
  if (isCord && best.site.part === "central") {
    return { given: raw, applies: false, segment,
      region: segment ? regionOf(segment) : null, landmark: segment ? landmarkOf(segment) : null,
      note: "suspended (cape-like) distribution — the sensory loss spans the lesion's segments and is spared above and below, so a single below-the-level sensory level does not apply" };
  }

  // Below the cord: cauda equina / conus. Not a cord "sensory level" — the saddle (S2–S5)
  // distribution is the localiser. Placed before the non-cord "inconsistency" branch so a
  // stated level here is reported gently rather than flagged as contradicting a cord lesion.
  if (best && (best.site.level === "cauda" || best.site.level === "conus")) {
    return { given: raw, applies: false, segment,
      region: segment ? regionOf(segment) : null, landmark: segment ? landmarkOf(segment) : null,
      note: "below the cord — a cauda equina / conus lesion; the saddle (S2–S5) distribution is the localiser, not a single sensory level" };
  }

  if (isCord && segment) {
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cauda-conus.test.js`
Expected: PASS — `8 passed, 0 failed`.

- [ ] **Step 5: Checkpoint (no git) — regression guard**

The branch fires only for cauda/conus best sites, so the sensory-level suite (cord sites) is untouched:
`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/sensory-level.test.js`
Expected: `22 passed, 0 failed`.

---

### Task 3: Wire-up — test script & README

**Files:**
- Modify: `package.json` (the `scripts.test` line)
- Modify: `README.md` (Running + Status sections)

**Interfaces:**
- Consumes: all five test files.
- Produces: `npm test` runs all five suites.

- [ ] **Step 1: Update the test script**

In `package.json`, replace:

```json
    "test": "node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js && node test/central-cord.test.js"
```

with:

```json
    "test": "node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js && node test/central-cord.test.js && node test/cauda-conus.test.js"
```

- [ ] **Step 2: Run the whole suite via npm**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: five blocks — `8 passed`, `5 passed`, `22 passed`, `8 passed`, `8 passed` — and exit code 0.

- [ ] **Step 3: Update the README**

In `README.md`, under `## Running`, add after the `node test/central-cord.test.js` line:

```
node test/cauda-conus.test.js    # cauda equina / conus medullaris
```

In `README.md`, in the `## Status` paragraph, replace the sentence
"Cauda equina / conus is the next increment."
with:
"The below-cord region now emerges too — cauda equina (pure LMN roots: flaccid weakness, saddle anaesthesia, sphincter loss, radicular pain) and conus medullaris (mixed UMN+LMN with early symmetric saddle/sphincter), distinguished by a UMN-vs-LMN finding split. Cortex, cranial nerves/skull base and root→plexus→nerve→muscle are the remaining regions."

- [ ] **Step 4: Checkpoint (no git)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all five suites green, exit 0.

---

### Post-plan (orchestrator, not a subagent step)

After Task 3 is green: update **both** artefacts via the Artifact tool (same URLs) — the flow
diagram's coverage strip (add cauda/conus done, advance focus, bump to 51 tests) and the anatomy
model (add a below-cord section: cauda equina + conus with their structures, findings and the
midline/@midline note). Then refresh the project memory (`neurolocaliser-engine-state`) with the
below-cord region and the new counts (51 tests: 8 + 5 + 22 + 8 + 8).

## Self-Review

**Spec coverage:**
- 5 findings + `CROSSES` → Task 1 Step 3. ✓
- 7 structures (levels cauda/conus) → Task 1 Step 4. ✓
- 2 territories + `composeCaudaConusSites` → Task 1 Step 5. ✓
- `midline` emission in `expectedFindings` + `explain` → Task 1 Step 6. ✓
- candidate list + `LOCALISING` (saddle, sphincter, umn_signs, lmn_weakness) → Task 1 Step 7. ✓
- `cauda_equina` + `conus_medullaris` phonebook → Task 1 Step 8. ✓
- `describeLevel` below-cord branch, before the non-cord inconsistency branch → Task 2 Step 3. ✓
- Emergence (CES, conus) + discrimination + midline-note tests → Task 1 (1,2,3) + Task 2 (4). ✓
- Regression guards → Task 1 Step 10, Task 2 Step 5, Task 3 Step 4. ✓
- README/package.json wire-up → Task 3. ✓
- Out-of-scope (symmetry as scored feature, dermatome/myotome mapping) → no tasks. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step states the exact command and expected output. ✓

**Type consistency:** `describeLevel` returns the same six-key shape (`given, applies, segment, region, landmark, note`) in the new branch; `radicular_pain` is intentionally excluded from `LOCALISING`; site ids/levels/parts are consistent across tasks (`cauda_equina`/`cauda`/`equina`, `conus_medullaris`/`conus`/`medullaris`); findings ids identical in structures, findings, score and tests. Test tallies: Task 1 = 6 checks; Task 2 adds 2 → 8 total, matching Task 2 Step 4 and the npm block (`8 passed`). Grand total 43 + 8 = 51. ✓
