# Nystagmus — multi-source directional taxonomy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic `nystagmus` finding with a directional taxonomy whose type localises across the three sources — inner ear (peripheral vestibular), cerebellum (gaze-evoked), and brainstem (upbeat, downbeat, and the shared central gaze-evoked at the vestibular nuclei) — adding the missing peripheral vestibular (labyrinth) site and two central directional-nystagmus generators.

**Architecture:** Declarative table edits (findings → structures → sites) + one composer + a phonebook entry + a new TDD suite. No new solver mechanism: reuses ipsilateral crossing, `@none` non-lateralised emission, the midline composer pattern, and the shared-localiser-by-company behaviour (`limb_ataxia`-style). Refits the just-built cerebellum region (`nystagmus` → `nystagmus_gaze_evoked`).

**Tech Stack:** Zero-dependency ES modules, Node v24 (off PATH), no test framework.

## Global Constraints

- **Runtime:** prefix every command `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" …`.
- **Zero dependencies, no build step.** Not a git repository — each task's checkpoint is a test run.
- **TDD, red-first.** All existing suites (19) stay green after every task.
- **The golden rule:** syndromes emerge from structures sharing a site; `syndromes.js` is a phonebook.
- **Taxonomy:** the generic `nystagmus` is REMOVED. Four typed findings, all `@none` (NON_LATERALISED) + LOCALISING: `nystagmus_peripheral` (labyrinth), `nystagmus_gaze_evoked` (cerebellum flocculonodular + brainstem vestibular nuclei — shared central), `nystagmus_downbeat` (craniocervical junction), `nystagmus_upbeat` (pontomesencephalic). `ino` unchanged. `cn8_vertigo` stays LOCALISING + `crosses:false`, description updated, now emitted by the labyrinth too.
- **New level:** `peripheral_vestibular` (lateralised); parts `labyrinth` in `LEVELS`/`PARTS`. The two central generators are composer-only midline sites (`craniocervical_junction_foramen_magnum`, `pontomesencephalic_tegmentum`), NOT in `PARTS`.

---

### Task 1: Taxonomy refit — findings, scoring, cerebellum, suite scaffold

**This task is atomic:** removing the generic `nystagmus` and refitting the flocculonodular structure must land together so no suite is left red.

**Files:**
- Modify: `src/model/findings.js` (FINDINGS, CROSSES, NON_LATERALISED, cn8_vertigo desc)
- Modify: `src/engine/score.js` (LOCALISING)
- Modify: `src/model/structures.js` (`cb_flocc_nystagmus` → gaze-evoked)
- Modify: `test/cerebellum.test.js` (rename references)
- Create: `test/nystagmus.test.js` (vocabulary assertions)

**Interfaces:**
- Produces: findings `nystagmus_peripheral`/`nystagmus_gaze_evoked`/`nystagmus_downbeat`/`nystagmus_upbeat` (all NON_LATERALISED + LOCALISING); generic `nystagmus` no longer exists.

- [ ] **Step 1: Write the failing test.** Create `test/nystagmus.test.js`:

```js
// nystagmus.test.js — the multi-source directional nystagmus taxonomy. Nystagmus TYPE localises:
// peripheral (labyrinth / inner ear), gaze-evoked (cerebellum flocculonodular + brainstem vestibular
// nuclei — shared central), downbeat (craniocervical junction), upbeat (pontomesencephalic tegmentum),
// INO (MLF, pre-existing). All typed findings are NON_LATERALISED (@none) + LOCALISING.
// Run: node test/nystagmus.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- Task 1: taxonomy vocabulary ---
const TYPES = ["nystagmus_peripheral", "nystagmus_gaze_evoked", "nystagmus_downbeat", "nystagmus_upbeat"];
for (const id of TYPES) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} is NON_LATERALISED (@none)`, NON_LATERALISED.has(id));
  ok(`${id} is LOCALISING`, LOCALISING.has(id));
}
ok("generic `nystagmus` is GONE", !isFinding("nystagmus"));
ok("generic `nystagmus` not in NON_LATERALISED", !NON_LATERALISED.has("nystagmus"));
ok("generic `nystagmus` not in LOCALISING", !LOCALISING.has("nystagmus"));
ok("cn8_vertigo still LOCALISING + crosses:false",
   LOCALISING.has("cn8_vertigo") && CROSSES.cn8_vertigo === false);
ok("ino unchanged (exists + LOCALISING)", isFinding("ino") && LOCALISING.has("ino"));

// ---- report ----
console.log("\nNeuroLocaliser — NYSTAGMUS tests\n" + "=".repeat(52));
for (const { label, ok: good } of log) console.log(`${good ? "PASS" : "FAIL"}  ${label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nystagmus.test.js`
Expected: FAIL — the typed findings don't exist; `generic nystagmus is GONE` fails (it still exists).

- [ ] **Step 3: Replace the generic finding with the taxonomy.** In `src/model/findings.js`, replace the `nystagmus:` line (currently in the Cerebellar group) with the four typed findings:

```js
  nystagmus_peripheral:  { desc: "Peripheral vestibular nystagmus — unidirectional horizontal-torsional, fatigable, fixation-suppressed (labyrinth / inner ear)", group: "Vestibular / nystagmus" },
  nystagmus_gaze_evoked: { desc: "Gaze-evoked / direction-changing nystagmus — the central type (cerebellum flocculonodular, brainstem vestibular nuclei)", group: "Vestibular / nystagmus" },
  nystagmus_downbeat:    { desc: "Downbeat nystagmus — craniocervical junction (Chiari) / floor of IV ventricle", group: "Vestibular / nystagmus" },
  nystagmus_upbeat:      { desc: "Upbeat nystagmus — pontomesencephalic / medullary tegmentum", group: "Vestibular / nystagmus" },
```

- [ ] **Step 4: Update the cn8_vertigo description.** In `src/model/findings.js`, change the `cn8_vertigo` entry:

```js
  cn8_vertigo:    { desc: "Vertigo (peripheral or central vestibular)", group: "Cranial nerve" },
```

- [ ] **Step 5: Update the CROSSES map.** In `src/model/findings.js`, replace the `nystagmus: false` fragment on the axial line with the four typed entries. The current line is:

```js
  truncal_ataxia: false, ataxic_dysarthria: false, nystagmus: false, // axial — NON_LATERALISED (@none); value moot
```

Replace with:

```js
  truncal_ataxia: false, ataxic_dysarthria: false, // axial cerebellar — NON_LATERALISED (@none)
  nystagmus_peripheral: false, nystagmus_gaze_evoked: false, nystagmus_downbeat: false, nystagmus_upbeat: false, // nystagmus types — NON_LATERALISED (@none); value moot
```

- [ ] **Step 6: Update NON_LATERALISED.** In `src/model/findings.js`, replace the `nystagmus` entry in the set:

```js
  "truncal_ataxia","ataxic_dysarthria", // axial cerebellar — no side
  "nystagmus_peripheral","nystagmus_gaze_evoked","nystagmus_downbeat","nystagmus_upbeat" // nystagmus types — no side
```

(Replaces the old `"truncal_ataxia","ataxic_dysarthria","nystagmus" // axial / vestibulocerebellar — no side` line — keep it as the LAST element group; ensure the preceding line still ends with a comma.)

- [ ] **Step 7: Update LOCALISING.** In `src/engine/score.js`, replace the `nystagmus` token on the cerebellar-organ line:

```js
  "dysmetria","dysdiadochokinesis","intention_tremor","truncal_ataxia","ataxic_dysarthria", // cerebellar organ
  "nystagmus_peripheral","nystagmus_gaze_evoked","nystagmus_downbeat","nystagmus_upbeat", // nystagmus taxonomy
```

- [ ] **Step 8: Refit the flocculonodular structure.** In `src/model/structures.js`, change the `cb_flocc_nystagmus` structure to produce `nystagmus_gaze_evoked` (rename id for clarity):

```js
  { id: "cb_flocc_gaze",  level: "cerebellum", part: "flocculonodular", produces: "nystagmus_gaze_evoked",
    note: "flocculonodular lobe (vestibulocerebellum) — gaze-evoked / central nystagmus" },
```

- [ ] **Step 9: Update the cerebellum suite for the rename.** In `test/cerebellum.test.js`, make these four edits:

Line ~23 (AXIAL vocab list) — the generic `nystagmus` was in the AXIAL list, but the vocabulary block asserts `crosses:false` + NON_LATERALISED + LOCALISING, which still hold for `nystagmus_gaze_evoked`. Change the AXIAL array to reference the renamed finding:

```js
const AXIAL = ["truncal_ataxia", "ataxic_dysarthria", "nystagmus_gaze_evoked"];
```

Line ~44 (structure assertion):

```js
ok("flocculonodular -> nystagmus_gaze_evoked", eq(cbOf("flocculonodular"), ["nystagmus_gaze_evoked"]));
```

Line ~76 (forward assertion):

```js
  ok("flocculonodular -> nystagmus_gaze_evoked@none", f.has("nystagmus_gaze_evoked@none"));
```

Line ~82 (pancerebellar forward):

```js
  ok("pancerebellar -> nystagmus_gaze_evoked@none", p.has("nystagmus_gaze_evoked@none"));
```

Lines ~101–102 (emergence):

```js
  const { best } = solve(new Set(["nystagmus_gaze_evoked@none"]));
  ok("nystagmus_gaze_evoked -> cerebellum_flocculonodular", best && best.site.id === "cerebellum_flocculonodular");
```

Line ~108 (pancerebellar emergence input):

```js
  set.add("truncal_ataxia@none"); set.add("ataxic_dysarthria@none"); set.add("nystagmus_gaze_evoked@none");
```

- [ ] **Step 10: Run the new + cerebellum suites.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nystagmus.test.js && PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cerebellum.test.js`
Expected: both PASS.

- [ ] **Step 11: Full regression checkpoint.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 19 suites PASS, `0 failed`. (Nothing yet emits the new nystagmus types except the flocculonodular refit, which the cerebellum suite covers.) `nystagmus.test.js` not in the chain yet — run directly.

---

### Task 2: Central vestibular nuclei — shared gaze-evoked nystagmus

**Files:**
- Modify: `src/model/structures.js` (add nystagmus companions at the vestibular nuclei)
- Modify: `test/engine.test.js` (add the token to the Wallenberg / Marie-Foix inputs for realism)
- Modify: `test/nystagmus.test.js` (append nuclei forward + shared-localiser assertions)

**Interfaces:**
- Consumes: findings from Task 1.
- Produces: `cn8_pons_nyst` (pons·lateral) and `icp_vestib_nyst` (medulla·lateral), both → `nystagmus_gaze_evoked`.

- [ ] **Step 1: Write the failing test.** In `test/nystagmus.test.js`, insert before the report block:

```js
// --- Task 2: central vestibular nuclei emit the shared gaze-evoked type ---
{
  const wall = expectedFindings(SITE_BY_ID.left_medulla_lateral);
  ok("lateral medulla (Wallenberg) -> nystagmus_gaze_evoked@none", wall.has("nystagmus_gaze_evoked@none"));
  ok("lateral medulla still -> cn8_vertigo@left", wall.has("cn8_vertigo@left"));
  const lp = expectedFindings(SITE_BY_ID.left_pons_lateral);
  ok("lateral pons -> nystagmus_gaze_evoked@none", lp.has("nystagmus_gaze_evoked@none"));
}
// isolated gaze-evoked -> lean cerebellar flocculonodular, NOT the over-predicting nucleus clusters
{
  const { best } = solve(new Set(["nystagmus_gaze_evoked@none"]));
  ok("isolated gaze-evoked -> cerebellum_flocculonodular (lean site wins)",
     best && best.site.id === "cerebellum_flocculonodular");
}
// Wallenberg WITH the nystagmus still -> lateral medulla (shared by company)
{
  const { best } = solve(new Set(["face_pain_loss@left", "spinothalamic@right", "horner@left",
    "cn_bulbar@left", "cn8_vertigo@left", "limb_ataxia@left", "nystagmus_gaze_evoked@none"]));
  ok("Wallenberg + gaze-evoked -> left_medulla_lateral", best && best.site.id === "left_medulla_lateral");
}
```

- [ ] **Step 2: Run to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nystagmus.test.js`
Expected: FAIL — lateral medulla / pons do not emit `nystagmus_gaze_evoked` yet.

- [ ] **Step 3: Add the nuclei companions.** In `src/model/structures.js`, add next to the existing `cn8_pons` and `icp_vestib` structures (in the PONS and MEDULLA blocks):

```js
  { id: "cn8_pons_nyst",  level: "pons", part: "lateral", produces: "nystagmus_gaze_evoked",
    note: "vestibular nuclei (pons) — central gaze-evoked nystagmus" },
```

```js
  { id: "icp_vestib_nyst", level: "medulla", part: "lateral", produces: "nystagmus_gaze_evoked",
    note: "vestibular nuclei (medulla) — central gaze-evoked nystagmus (rides Wallenberg)" },
```

- [ ] **Step 4: Run to verify the new assertions pass.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nystagmus.test.js`
Expected: PASS for Task 1–2 assertions.

- [ ] **Step 5: Add the token to the brainstem Wallenberg inputs (realism).** In `test/engine.test.js`, add `"nystagmus_gaze_evoked@none"` to the two lateral-brainstem inputs so they reflect that these syndromes include central nystagmus. Wallenberg (~line 59):

```js
check("Wallenberg (L face + R body STT + L Horner + bulbar + ataxia)",
  ["face_pain_loss@left", "spinothalamic@right", "horner@left", "cn_bulbar@left",
   "cn8_vertigo@left", "limb_ataxia@left", "nystagmus_gaze_evoked@none"],
  "left_medulla_lateral");
```

Marie-Foix / lateral pons (~line 84):

```js
check("Lateral pons (Marie-Foix: L ataxia + R body STT + L vertigo)",
  ["limb_ataxia@left", "spinothalamic@right", "cn8_vertigo@left", "nystagmus_gaze_evoked@none"],
  "left_pons_lateral");
```

- [ ] **Step 6: Full regression checkpoint (Wallenberg watch).**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 19 suites PASS, `0 failed`. Confirm the Wallenberg / lateral-pons winners are unchanged (`left_medulla_lateral` / `left_pons_lateral`), and the `horner-axis` central-Horner suite (which uses the lateral medulla) is green. If a winner shifted, STOP and report.

---

### Task 3: Peripheral vestibular (labyrinth) site

**Files:**
- Modify: `src/model/structures.js` (peripheral vestibular block)
- Modify: `src/model/sites.js` (`LEVELS`, `PARTS`, `TERRITORY`)
- Modify: `test/nystagmus.test.js` (append labyrinth site + forward assertions)

**Interfaces:**
- Produces: `left/right_peripheral_vestibular_labyrinth`, emitting `nystagmus_peripheral@none` + `cn8_vertigo@<ipsi>`.

- [ ] **Step 1: Write the failing test.** In `test/nystagmus.test.js`, insert before the report block:

```js
// --- Task 3: peripheral vestibular (labyrinth) site ---
ok("left_peripheral_vestibular_labyrinth exists", !!SITE_BY_ID.left_peripheral_vestibular_labyrinth);
{
  const lab = expectedFindings(SITE_BY_ID.left_peripheral_vestibular_labyrinth);
  ok("left labyrinth -> nystagmus_peripheral@none", lab.has("nystagmus_peripheral@none"));
  ok("left labyrinth -> cn8_vertigo@left (ipsi)", lab.has("cn8_vertigo@left"));
  ok("left labyrinth emits NO hearing_loss (vestibular neuritis, not labyrinthitis)",
     ![...lab].some(t => t.startsWith("hearing_loss")));
}
```

- [ ] **Step 2: Run to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nystagmus.test.js`
Expected: FAIL — `left_peripheral_vestibular_labyrinth` undefined (crashes on `expectedFindings(undefined)`; confirm via `2>&1 | tail`).

- [ ] **Step 3: Add the labyrinth structures.** In `src/model/structures.js`, add a new block (place it after the CEREBELLUM block):

```js
  // ---- PERIPHERAL VESTIBULAR (labyrinth / inner ear) ----
  // The peripheral end of the vestibular system: unidirectional fixation-suppressed nystagmus + vertigo.
  // Ipsilateral (cn8_vertigo inherits CROSSES:false; nystagmus_peripheral is NON_LATERALISED @none). No
  // hearing_loss on the core site — vestibular neuritis spares hearing; labyrinthitis/Ménière (+ hearing)
  // is labyrinth + cochlear, left to emerge by company.
  { id: "vest_periph_nyst",   level: "peripheral_vestibular", part: "labyrinth", produces: "nystagmus_peripheral",
    note: "labyrinth — peripheral (unidirectional, fixation-suppressed) nystagmus" },
  { id: "vest_periph_vertigo", level: "peripheral_vestibular", part: "labyrinth", produces: "cn8_vertigo",
    note: "labyrinth / vestibular nerve — vertigo (vestibular neuritis, labyrinthitis, Ménière, BPPV)" },
```

- [ ] **Step 4: Register the level, part, territory.** In `src/model/sites.js`:

Add `"peripheral_vestibular"` to `LEVELS` (place it after `"cerebellum"`):

```js
const LEVELS = ["midbrain", "pons", "medulla", "cord", "cortex", "subcortex", "basal_ganglia", "cerebellum", "peripheral_vestibular", "skull_base", "root", "nerve", "visual_pathway", "pupil", "sympathetic"];
```

Add `"labyrinth"` to `PARTS` (on the cerebellum/hemisphere line):

```js
  "hemisphere", "labyrinth",
```

Add the `TERRITORY` entry (near the cerebellum entries):

```js
  "peripheral_vestibular|labyrinth": "labyrinthine artery (inner ear / vestibular nerve)",
```

- [ ] **Step 5: Run to verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nystagmus.test.js`
Expected: PASS for Task 1–3 assertions.

- [ ] **Step 6: Full regression checkpoint.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 19 suites PASS, `0 failed`. In particular confirm the existing Wallenberg / lateral-pons winners still hold (the labyrinth now competes for `cn8_vertigo` but over-predicts `nystagmus_peripheral` for a Wallenberg input).

---

### Task 4: Central directional generators (downbeat + upbeat)

**Files:**
- Modify: `src/model/structures.js` (CVJ + pontomesencephalic structures)
- Modify: `src/model/sites.js` (`composeCentralNystagmusSites` + TERRITORY)
- Modify: `src/engine/inverse.js` (import + register in `candidateSites`)
- Modify: `test/nystagmus.test.js` (append composer-site + forward assertions)

**Interfaces:**
- Produces: `composeCentralNystagmusSites()` → `craniocervical_junction_foramen_magnum` (→ `nystagmus_downbeat`) and `pontomesencephalic_tegmentum` (→ `nystagmus_upbeat`), both `side: "midline"`.

- [ ] **Step 1: Add the composer import + write the failing test.** In `test/nystagmus.test.js`, change the sites import to add the composer, and append the assertions.

Change the import line to:

```js
import { SITE_BY_ID, composeCentralNystagmusSites } from "../src/model/sites.js";
```

Insert before the report block:

```js
// --- Task 4: central directional generators (downbeat CVJ, upbeat pontomesencephalic) ---
const CN = Object.fromEntries(composeCentralNystagmusSites().map(s => [s.id, s]));
ok("craniocervical_junction_foramen_magnum exists (midline)",
   CN.craniocervical_junction_foramen_magnum && CN.craniocervical_junction_foramen_magnum.side === "midline");
ok("pontomesencephalic_tegmentum exists (midline)",
   CN.pontomesencephalic_tegmentum && CN.pontomesencephalic_tegmentum.side === "midline");
{
  const cvj = expectedFindings(CN.craniocervical_junction_foramen_magnum);
  ok("CVJ -> nystagmus_downbeat@none", cvj.has("nystagmus_downbeat@none"));
  const pm = expectedFindings(CN.pontomesencephalic_tegmentum);
  ok("pontomesencephalic -> nystagmus_upbeat@none", pm.has("nystagmus_upbeat@none"));
}
```

- [ ] **Step 2: Run to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nystagmus.test.js`
Expected: FAIL — `SyntaxError … does not provide an export named 'composeCentralNystagmusSites'`.

- [ ] **Step 3: Add the generator structures.** In `src/model/structures.js`, add after the PERIPHERAL VESTIBULAR block:

```js
  // ---- CENTRAL DIRECTIONAL NYSTAGMUS GENERATORS (midline; type is the localiser) ----
  { id: "cvj_downbeat",  level: "craniocervical_junction", part: "foramen_magnum", produces: "nystagmus_downbeat",
    note: "craniocervical junction / floor of IV ventricle — downbeat nystagmus (Chiari, foramen-magnum lesion)" },
  { id: "ponto_upbeat",  level: "pontomesencephalic", part: "tegmentum", produces: "nystagmus_upbeat",
    note: "pontomesencephalic / medullary tegmentum — upbeat nystagmus" },
```

- [ ] **Step 4: Add the composer + TERRITORY.** In `src/model/sites.js`, add the two `TERRITORY` entries (near the cerebellum/vestibular ones):

```js
  "craniocervical_junction|foramen_magnum": "craniocervical junction / floor of IV ventricle",
  "pontomesencephalic|tegmentum":           "pontomesencephalic / medullary tegmentum",
```

Then add the composer (place near `composeCerebellumMidlineSites`):

```js
// CENTRAL DIRECTIONAL NYSTAGMUS SITES. Downbeat (craniocervical junction) + upbeat (pontomesencephalic)
// are periventricular/tegmental midline generators that don't fit the vascular medial/lateral split —
// MIDLINE sites (cauda/conus pattern). id == level_part; not in PARTS (composer-only).
export function composeCentralNystagmusSites() {
  const build = (id, level, part) => {
    const structures = STRUCTURES.filter(s => s.level === level && s.part === part).map(s => s.id);
    return structures.length ? [{ id, side: "midline", level, part,
      territory: TERRITORY[`${level}|${part}`], structures, composite: true }] : [];
  };
  return [ ...build("craniocervical_junction_foramen_magnum", "craniocervical_junction", "foramen_magnum"),
           ...build("pontomesencephalic_tegmentum", "pontomesencephalic", "tegmentum") ];
}
```

- [ ] **Step 5: Register the composer.** In `src/engine/inverse.js`, add `composeCentralNystagmusSites` to the `../model/sites.js` import and to the `candidateSites()` return array:

```js
         composeCerebellumMidlineSites, composeCerebellumPancerebellarSites,
         composeCentralNystagmusSites } from "../model/sites.js";
```

```js
          ...composeCerebellumMidlineSites(), ...composeCerebellumPancerebellarSites(),
          ...composeCentralNystagmusSites()];
```

- [ ] **Step 6: Run to verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nystagmus.test.js`
Expected: PASS for Task 1–4 assertions.

- [ ] **Step 7: Full regression checkpoint.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 19 suites PASS, `0 failed`.

---

### Task 5: Phonebook naming + inverse emergence

**Files:**
- Modify: `src/data/syndromes.js` (peripheral vestibular + CVJ + pontomesencephalic entries; flocculonodular note)
- Modify: `test/nystagmus.test.js` (append emergence + naming + discrimination assertions)

**Interfaces:**
- Produces: phonebook keys `peripheral_vestibular_labyrinth`, `craniocervical_junction_foramen_magnum`, `pontomesencephalic_tegmentum`.

- [ ] **Step 1: Write the failing test.** In `test/nystagmus.test.js`, insert before the report block:

```js
// --- Task 5: inverse emergence + naming + peripheral-vs-central discrimination ---
{
  const { best } = solve(new Set(["nystagmus_peripheral@none", "cn8_vertigo@left"]));
  ok("peripheral nystagmus + vertigo -> left_peripheral_vestibular_labyrinth",
     best && best.site.id === "left_peripheral_vestibular_labyrinth");
  ok("labyrinth names a peripheral vestibular syndrome",
     best && /peripheral vestibular/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["nystagmus_downbeat@none"]));
  ok("downbeat -> craniocervical_junction_foramen_magnum",
     best && best.site.id === "craniocervical_junction_foramen_magnum");
  ok("downbeat names a craniocervical junction syndrome",
     best && /craniocervical|downbeat/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["nystagmus_upbeat@none"]));
  ok("upbeat -> pontomesencephalic_tegmentum",
     best && best.site.id === "pontomesencephalic_tegmentum");
  ok("upbeat names a pontomesencephalic syndrome",
     best && /pontomesencephalic|upbeat/i.test(nameForSite(best.site).name));
}
// isolated cn8_vertigo prefers the peripheral labyrinth over the central nucleus clusters
{
  const { best } = solve(new Set(["cn8_vertigo@left"]));
  ok("isolated vertigo -> peripheral labyrinth (fewer over-predictions)",
     best && best.site.id === "left_peripheral_vestibular_labyrinth");
}
```

- [ ] **Step 2: Run to verify it fails.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nystagmus.test.js`
Expected: FAIL — the site-id assertions PASS (solver localises without the phonebook), the `name` regexes FAIL (fall back to plain anatomical strings). The isolated-vertigo assertion should PASS already.

> **Note:** the fallback name for a midline site is `"midline craniocervical_junction (foramen_magnum)"`, which *contains* "craniocervical" — so that regex could pass off the fallback. To ensure the phonebook is genuinely tested, the regexes above also accept the type word (`downbeat`/`upbeat`), which only appears in the phonebook name. Confirm at Step 2 that the `craniocervical|downbeat` and `pontomesencephalic|upbeat` naming assertions are RED before adding the phonebook (if a fallback substring makes one green early, tighten it to the `/downbeat/`/`/upbeat/` half only).

- [ ] **Step 3: Add the phonebook entries.** In `src/data/syndromes.js`, add (near the cerebellum block):

```js
  peripheral_vestibular_labyrinth: {
    name: "Peripheral vestibular syndrome (labyrinth / vestibular nerve)",
    note: "Unidirectional, fixation-suppressed, fatigable horizontal-torsional nystagmus with vertigo — the peripheral (benign) end of the acute vestibular syndrome. Hearing loss/tinnitus (if present) points to a cochlear/labyrinthine process (labyrinthitis, Ménière) rather than pure vestibular neuritis.",
    ddx: ["Vestibular neuritis (no hearing loss)", "Labyrinthitis (+ hearing loss)", "Ménière's disease", "BPPV (positional)", "Vestibular schwannoma (nerve)"],
    red: "An acute vestibular syndrome with CENTRAL features (direction-changing/gaze-evoked or vertical nystagmus, normal head-impulse, skew) is a posterior-circulation stroke until proven otherwise — image, do not reassure."
  },
  craniocervical_junction_foramen_magnum: {
    name: "Downbeat nystagmus — craniocervical junction",
    note: "Downbeat nystagmus localises to the craniocervical junction / floor of the IV ventricle (and the flocculus). A central sign — never peripheral.",
    ddx: ["Chiari I malformation", "Foramen-magnum lesion (meningioma)", "Cerebellar degeneration (SCA)", "Drugs (lithium, anticonvulsants)", "Wernicke's"],
    red: "New downbeat nystagmus warrants craniocervical-junction imaging — a Chiari or foramen-magnum lesion is surgically treatable."
  },
  pontomesencephalic_tegmentum: {
    name: "Upbeat nystagmus — pontomesencephalic / medullary tegmentum",
    note: "Upbeat nystagmus localises to the pontomesencephalic junction or the medullary tegmentum. A central sign.",
    ddx: ["Brainstem tegmental infarct / demyelination", "Wernicke's encephalopathy", "Tumour", "Drugs"],
    red: "Upbeat nystagmus with other brainstem signs needs urgent imaging; consider thiamine (Wernicke's) empirically if any nutritional risk."
  },
```

- [ ] **Step 4: Update the flocculonodular note (gaze-evoked).** In `src/data/syndromes.js`, in the existing `cerebellum_flocculonodular` entry, update the `note` to name gaze-evoked nystagmus:

```js
    note: "Gaze-evoked / direction-changing nystagmus, vertigo and gait imbalance from a flocculonodular / vestibulocerebellar lesion, often with the limbs and speech spared.",
```

- [ ] **Step 5: Run to verify it passes.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/nystagmus.test.js`
Expected: PASS — all emergence + naming + discrimination assertions green.

- [ ] **Step 6: Full regression checkpoint.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 19 suites PASS, `0 failed`.

---

### Task 6: Wire suite into chain + full regression

**Files:**
- Modify: `package.json` (`test` script)
- Modify: `README.md` (test-chain listing)

- [ ] **Step 1: Add the suite to package.json.** In `package.json`, append `nystagmus.test.js` to the `test` chain (after `cerebellum.test.js`):

```json
    "test": "node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js && node test/central-cord.test.js && node test/cauda-conus.test.js && node test/cortex.test.js && node test/subcortex.test.js && node test/cranial-nerves.test.js && node test/motor-unit.test.js && node test/pns.test.js && node test/pns-nerves.test.js && node test/reflexes.test.js && node test/tone.test.js && node test/nerve-segments.test.js && node test/visual-pathway.test.js && node test/pupil-efferent.test.js && node test/horner-axis.test.js && node test/basal-ganglia.test.js && node test/cerebellum.test.js && node test/nystagmus.test.js"
```

- [ ] **Step 2: Add the suite to the README listing.** In `README.md`, add a line after the `cerebellum.test.js` line:

```
node test/nystagmus.test.js      # nystagmus taxonomy (peripheral/gaze-evoked/downbeat/upbeat, multi-source)
```

- [ ] **Step 3: Full regression checkpoint.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 20 suites PASS, `0 failed` on every line.

---

### Task 7: Sync the anatomy artifact

**Files:**
- Modify: `docs/artifacts/anatomy-model.html`

- [ ] **Step 1: Relabel the flocculonodular row.** In the Cerebellum region block, change the `cb_flocc_nystagmus` row to the new id/label:

Run: `grep -n "cb_flocc_nystagmus\|flocculonodular" docs/artifacts/anatomy-model.html`

Update the row's `<div class="id">cb_flocc_nystagmus</div>` → `cb_flocc_gaze` and its `<div class="fn">nystagmus …</div>` → `gaze-evoked nystagmus (central)`.

- [ ] **Step 2: Add a Nystagmus / vestibular region block.** Modelled on a sibling region block (copy the exact `region-title`/`level`/`level-head`/`cols flow`/`col`/`col-h`/`p`/`terr`/`rows`/`row`/`badge`/`m`/`id`/`fn` nesting). Place it after the Cerebellum block. Columns:
  - `labyrinth` (peripheral_vestibular) — badge `bi` IPSI for `vest_periph_vertigo` (cn8_vertigo) and badge `bnone` NONE for `vest_periph_nyst` (nystagmus_peripheral, unidirectional/fixation-suppressed)
  - `foramen_magnum` (craniocervical junction) — badge `bm` MIDLINE: `cvj_downbeat` (downbeat nystagmus)
  - `pontomesencephalic` tegmentum — badge `bm` MIDLINE: `ponto_upbeat` (upbeat nystagmus)
  Region note: "nystagmus TYPE localises · peripheral (inner ear) vs central (cerebellum / brainstem) · shared gaze-evoked at the vestibular nuclei · no new mechanism".
  Also note the shared central `nystagmus_gaze_evoked` at the brainstem vestibular nuclei (a line in the note, or a small annotation) so the sheet reflects that the lateral pons/medulla also emit it.

- [ ] **Step 3: Add compose-grid lines.** In the composite summary (`cmp`/`cid`/`cd` grid), near the cerebellum lines:

```html
        <div class="cmp"><div class="cid">left/right · peripheral_vestibular_labyrinth</div><div class="cd">Inner ear → peripheral nystagmus + vertigo (vestibular neuritis / labyrinthitis / Ménière)</div></div>
        <div class="cmp"><div class="cid">craniocervical_junction · pontomesencephalic (midline)</div><div class="cd">Central directional nystagmus → downbeat (CVJ / Chiari) · upbeat (pontomesencephalic tegmentum)</div></div>
```

- [ ] **Step 4: Verify the artifact is well-formed.**

Run: `cd docs/artifacts && O=$(grep -oE "<div" anatomy-model.html | wc -l); C=$(grep -oE "</div>" anatomy-model.html | wc -l); echo "open=$O close=$C"`
Expected: `open` == `close`. Confirm the referenced ids (`cb_flocc_gaze`, `vest_periph_nyst`, `vest_periph_vertigo`, `cvj_downbeat`, `ponto_upbeat`) exist in `structures.js`.

- [ ] **Step 5: Final full-suite confirmation.**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 20 suites PASS, `0 failed`.

---

## Self-review notes

- **Spec coverage:** taxonomy refit + cerebellum rename (T1), shared central nystagmus at the vestibular nuclei + Wallenberg ripple (T2), peripheral vestibular labyrinth site (T3), central directional generators (T4), phonebook + emergence + peripheral-vs-central discrimination (T5), chain wiring (T6), artifact (T7). All spec sections map to a task.
- **Atomicity:** the finding removal + flocculonodular refit + cerebellum-suite update are all in Task 1 so no suite is left red mid-task.
- **Wallenberg ripple** is handled explicitly (T2 Step 5) and gated (T2 Step 6) — `check()` asserts the winner only, so the winners hold; the inputs gain the token for realism.
- **Composite sites not in `SITE_BY_ID`** — the labyrinth (T3) is a `buildSites` lateralised site (in `SITE_BY_ID`); the two central generators (T4) are composer-only and are looked up via `composeCentralNystagmusSites()`.
- **Naming-vs-fallback trap** (the cerebellum increment hit this): T5 Step 2 flags that the midline fallback name contains the level word, so the naming regexes also require the type word (`downbeat`/`upbeat`) that only the phonebook supplies.
- **Type/name consistency:** `composeCentralNystagmusSites` used identically in sites.js/inverse.js/test; site ids `craniocervical_junction_foramen_magnum` / `pontomesencephalic_tegmentum` == their `level_part` phonebook keys; `nystagmus_gaze_evoked` shared by flocculonodular + 2 nuclei.
