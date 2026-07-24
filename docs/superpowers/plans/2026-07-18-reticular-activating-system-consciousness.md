# Reticular activating system & reduced level of consciousness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the anatomical sites of reduced level of consciousness emerge — brainstem ARAS, bilateral
paramedian thalamus (Percheron), diffuse bihemispheric, and locked-in (the ventral-vs-tegmental contrast).

**Architecture:** Pure anatomy-table extension. Three new findings, five structures (two of them
`bilateralOnly` on the existing thalamus, three on composer-only levels), one `composeConsciousnessSites()`
composer returning four sites. The "arousal needs both hemispheres, so a unilateral lesion impairs nothing"
principle reuses the existing `bilateralOnly` gate — **no new solver mechanism**.

**Tech Stack:** Zero-dependency ES modules, Node v24. Standalone test scripts (no framework), one
`ok(label, cond)` helper per file, `process.exit(fail === 0 ? 0 : 1)`.

## Global Constraints

- **Runtime:** no Node on PATH. Prefix every command:
  `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" <cmd>`.
- **Not a git repository.** No commit steps; each task's checkpoint is "run the suite(s) and confirm green".
- **The golden rule:** never `if (hasX && hasY) return syndrome`. Findings come from structures sharing a
  site; names come from the `syndromes.js` phonebook keyed by emergent site id.
- **All three new findings are `@none`** (NON_LATERALISED) and **LOCALISING**.
- **`bilateralOnly` is load-bearing:** the two thalamus consciousness structures MUST carry
  `bilateralOnly: true` so a unilateral thalamic lesion stays pure-sensory (regression: subcortex suite
  unchanged).
- **TDD, red-first.** Add each test block, watch it fail, add the anatomy, watch it pass. Keep all prior
  suites green at every task boundary.

---

### Task 1: Findings & scoring vocabulary

**Files:**
- Modify: `src/model/findings.js` (3 findings + CROSSES + NON_LATERALISED)
- Modify: `src/engine/score.js:59` (LOCALISING — add 3)
- Create: `test/consciousness.test.js` (harness + vocabulary block)
- Modify: `package.json` (test chain), `README.md` (suite list)

**Interfaces:**
- Produces: findings `reduced_consciousness`, `preserved_vertical_gaze`, `extensor_posturing`; all in
  `NON_LATERALISED` and `LOCALISING`. Consumed by Tasks 2–3.

- [ ] **Step 1: Write the failing test** — create `test/consciousness.test.js`:

```javascript
// consciousness.test.js — reduced level of consciousness (arousal) and the ARAS. Coma needs EITHER the
// brainstem ARAS (a single paramedian tegmental lesion) OR both hemispheres (bilateral thalamus / diffuse
// cortex); a UNILATERAL hemispheric/thalamic lesion impairs nothing (content vs arousal — the bilateralOnly
// gate). Locked-in is the ventral-vs-tegmental contrast: awake but quadriplegic.
// Run: node test/consciousness.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID, composeConsciousnessSites } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve, rankSingle } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// --- Task 1: vocabulary ---
for (const id of ["reduced_consciousness", "preserved_vertical_gaze", "extensor_posturing"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} is NON_LATERALISED (@none)`, NON_LATERALISED.has(id));
  ok(`${id} has a CROSSES entry`, id in CROSSES);
  ok(`${id} is LOCALISING`, LOCALISING.has(id));
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

> Practical note: this final file imports `composeConsciousnessSites`, `rankSingle`, etc. that later tasks
> add. To keep Task 1 runnable in isolation, temporarily trim the imports to the three actually used in the
> vocabulary block (`FINDINGS`/`CROSSES`/`NON_LATERALISED`/`isFinding`, `LOCALISING`), and restore the full
> import line in Task 2. (`rankSingle` is already exported from inverse.js; `composeConsciousnessSites` is
> added in Task 2.)

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/consciousness.test.js`
Expected: FAIL — the three findings don't exist yet (12 assertions fail).

- [ ] **Step 3: Add the three findings** to `src/model/findings.js`. Add a new group after the pupil /
autonomic findings (anywhere in `FINDINGS` is fine; place near the cortical/behavioural block):

```javascript
  // Consciousness / arousal (ascending reticular activating system; non-lateralised)
  reduced_consciousness:   { desc: "Reduced level of consciousness / impaired arousal (ascending reticular activating system)", group: "Consciousness" },
  preserved_vertical_gaze: { desc: "Preserved vertical eye movements / blink-to-command with quadriplegia + anarthria (locked-in hallmark)", group: "Consciousness" },
  extensor_posturing:      { desc: "Decerebrate (extensor) posturing — structural upper-brainstem coma", group: "Consciousness" },
```

- [ ] **Step 4: Add CROSSES entries.** After the dorsal-midbrain CROSSES line
(`src/model/findings.js:220`):

```javascript
  reduced_consciousness: false, preserved_vertical_gaze: false, extensor_posturing: false, // consciousness / arousal — @none
```

- [ ] **Step 5: Add to NON_LATERALISED.** Change the last entry of the set
(`src/model/findings.js:283`) to add a trailing comma and append the new line:

```javascript
  "nystagmus_convergence_retraction","vertical_gaze_palsy","lid_retraction", // dorsal midbrain / pretectal — no side
  "reduced_consciousness","preserved_vertical_gaze","extensor_posturing" // consciousness / arousal — no side
```

- [ ] **Step 6: Add the three localisers** to `src/engine/score.js`. Change the last LOCALISING entry
line (`src/engine/score.js:59`) to add a trailing comma and append:

```javascript
  "anal_wink_loss","bulbocavernosus_loss","grasp_reflex",
  // consciousness / arousal — the ARAS/coma localisers + the locked-in hallmark + decerebrate posturing
  "reduced_consciousness","preserved_vertical_gaze","extensor_posturing"
```

- [ ] **Step 7: Register the suite.** In `package.json`, append to the `test` chain:
` && node test/consciousness.test.js`. In `README.md`, add to the suite list (after the parinaud line):

```
node test/consciousness.test.js  # reduced level of consciousness — ARAS / thalamus / diffuse / locked-in
```

- [ ] **Step 8: Run test to verify vocabulary passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/consciousness.test.js`
Expected: PASS — 12 assertions (3 findings × 4 checks), `0 failed`.

- [ ] **Step 9: Full-suite checkpoint** (no regressions from vocabulary additions):

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all suites `0 failed` (new findings have no producer yet).

---

### Task 2: Structures, sites & forward model

**Files:**
- Modify: `src/model/structures.js` (2 `bilateralOnly` thalamus structures after `thal_pain:203`; 3 composer-only structures after the dorsal-midbrain block `:301`)
- Modify: `src/model/sites.js` (3 TERRITORY entries after `:130`; new `composeConsciousnessSites()` after `composeDorsalMidbrainSites` `:496`)
- Modify: `src/engine/inverse.js:18,32` (import + register in `candidateSites()`)
- Modify: `test/consciousness.test.js` (restore full imports; add sites + forward block)

**Interfaces:**
- Consumes: findings from Task 1; existing `cst_pons` structure.
- Produces: structures `thal_aras`/`thal_vgaze_bilat` (subcortex/thalamus, `bilateralOnly`),
  `aras_brainstem`/`aras_posturing` (brainstem_aras/paramedian_tegmentum), `cereb_diffuse`
  (cerebrum/diffuse), `li_ocular` (locked_in/ventral_pons). Export `composeConsciousnessSites()` returning
  four sites: `cerebrum_diffuse`, `brainstem_aras`, `thalamus_bilateral_percheron`, `locked_in` (ids). All
  registered in `candidateSites()`. Consumed by Task 3.

- [ ] **Step 1: Write the failing test** — restore the full import line from Task 1 Step 1, then append
before the print block:

```javascript
// --- Task 2: structures, sites, forward ---
const CS = Object.fromEntries(composeConsciousnessSites().map(s => [s.id, s]));
for (const id of ["cerebrum_diffuse", "brainstem_aras", "thalamus_bilateral_percheron", "locked_in"]) {
  ok(`${id} site exists`, !!CS[id]);
}
ok("brainstem_aras is midline", CS.brainstem_aras && CS.brainstem_aras.side === "midline");
ok("cerebrum_diffuse is bilateral", CS.cerebrum_diffuse && CS.cerebrum_diffuse.side === "bilateral");

// Forward emissions.
{
  const dif = expectedFindings(CS.cerebrum_diffuse);
  ok("diffuse -> reduced_consciousness@none only",
     dif.has("reduced_consciousness@none") && dif.size === 1);
  const ar = expectedFindings(CS.brainstem_aras);
  ok("brainstem_aras -> reduced_consciousness@none + extensor_posturing@none",
     ar.has("reduced_consciousness@none") && ar.has("extensor_posturing@none"));
  const per = expectedFindings(CS.thalamus_bilateral_percheron);
  ok("percheron -> reduced_consciousness@none + vertical_gaze_palsy@none",
     per.has("reduced_consciousness@none") && per.has("vertical_gaze_palsy@none"));
  const li = expectedFindings(CS.locked_in);
  ok("locked_in -> hemiparesis@left + @right (quadriplegia)",
     li.has("hemiparesis@left") && li.has("hemiparesis@right"));
  ok("locked_in -> preserved_vertical_gaze@none", li.has("preserved_vertical_gaze@none"));
  ok("locked_in does NOT emit reduced_consciousness (ventral, ARAS spared)",
     !li.has("reduced_consciousness@none"));
}
// The bilateralOnly gate: the UNILATERAL VPL thalamus does NOT emit arousal findings.
{
  const uni = expectedFindings(SITE_BY_ID.left_subcortex_thalamus);
  ok("unilateral thalamus does NOT emit reduced_consciousness",
     !uni.has("reduced_consciousness@none"));
  ok("unilateral thalamus does NOT emit vertical_gaze_palsy (bilateralOnly gate)",
     !uni.has("vertical_gaze_palsy@none"));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/consciousness.test.js`
Expected: FAIL — `composeConsciousnessSites is not exported` / undefined.

- [ ] **Step 3: Add the two `bilateralOnly` thalamus structures** to `src/model/structures.js`, after the
`thal_pain` structure (`src/model/structures.js:203-204`):

```javascript
  { id: "thal_aras", level: "subcortex", part: "thalamus", produces: "reduced_consciousness", bilateralOnly: true,
    note: "intralaminar / paramedian thalamus — arousal relay of the ARAS; BILATERAL only (a unilateral thalamic lesion spares consciousness — content vs arousal)" },
  { id: "thal_vgaze_bilat", level: "subcortex", part: "thalamus", produces: "vertical_gaze_palsy", bilateralOnly: true,
    note: "meso-diencephalic junction — Percheron's vertical gaze palsy; BILATERAL only" },
```

- [ ] **Step 4: Add the three composer-only structures** to `src/model/structures.js`, after the
dorsal-midbrain `tect_lid` structure (`src/model/structures.js:301-302`):

```javascript

  // ---- CONSCIOUSNESS / AROUSAL (ARAS, diffuse cortex, locked-in) ----
  // Composer-only levels (not in LEVELS/PARTS) — assembled by composeConsciousnessSites(). The brainstem
  // ARAS is a midline paramedian tegmental lesion (a single lesion suffices); it carries decerebrate
  // (extensor) posturing, the co-located structural-coma motor sign. The diffuse-cortex and thalamus
  // arousal structures are bilateralOnly (need both hemispheres). Locked-in is a bilateral ventral-pons
  // (basis pontis) site: bilateral corticospinal (cst_pons) → quadriplegia, ARAS spared → awake.
  { id: "aras_brainstem", level: "brainstem_aras", part: "paramedian_tegmentum", produces: "reduced_consciousness",
    note: "paramedian rostral pons/midbrain tegmentum — ascending reticular activating system (arousal)" },
  { id: "aras_posturing", level: "brainstem_aras", part: "paramedian_tegmentum", produces: "extensor_posturing",
    note: "upper brainstem (red nucleus↔vestibular nuclei) — decerebrate (extensor) posturing" },
  { id: "cereb_diffuse", level: "cerebrum", part: "diffuse", produces: "reduced_consciousness", bilateralOnly: true,
    note: "diffuse bihemispheric cortical dysfunction (metabolic / anoxic) — the structural correlate of encephalopathy" },
  { id: "li_ocular", level: "locked_in", part: "ventral_pons", produces: "preserved_vertical_gaze",
    note: "locked-in — preserved vertical eye movements / blink (dorsal tegmentum spared by a ventral basis pontis lesion)" },
```

- [ ] **Step 5: Add the TERRITORY entries** to `src/model/sites.js`, after the `dorsal_midbrain|tectum`
line (`src/model/sites.js:130`):

```javascript
  "cerebrum|diffuse": "diffuse bihemispheric cortex (metabolic / anoxic encephalopathy)",
  "brainstem_aras|paramedian_tegmentum": "paramedian rostral brainstem tegmentum (ARAS)",
  "locked_in|ventral_pons": "ventral pons / basis pontis (basilar territory — locked-in)",
```

- [ ] **Step 6: Add the composer** to `src/model/sites.js`, after `composeDorsalMidbrainSites()`'s closing
brace (`src/model/sites.js:496`):

```javascript

// CONSCIOUSNESS / AROUSAL SITES. Four composer-only sites. Arousal needs EITHER the brainstem ARAS (a
// single midline paramedian tegmental lesion) OR both hemispheres (bilateral thalamus / diffuse cortex) —
// the bilateralOnly gate (Anton/Balint) makes a UNILATERAL thalamic/cortical lesion emit nothing. Locked-in
// is the ventral-vs-tegmental contrast (bilateral basis pontis: quadriplegia, ARAS spared → awake).
export function composeConsciousnessSites() {
  const byLevelPart = (lvl, part) => STRUCTURES.filter(s => s.level === lvl && s.part === part).map(s => s.id);
  const thalBilat = STRUCTURES.filter(s => s.level === "subcortex" && s.part === "thalamus" && s.bilateralOnly).map(s => s.id);
  const sites = [];
  const diffuse = byLevelPart("cerebrum", "diffuse");
  if (diffuse.length) sites.push({ id: "cerebrum_diffuse", side: "bilateral", level: "cerebrum", part: "diffuse",
    territory: TERRITORY["cerebrum|diffuse"], structures: diffuse, composite: true });
  const aras = byLevelPart("brainstem_aras", "paramedian_tegmentum");
  if (aras.length) sites.push({ id: "brainstem_aras", side: "midline", level: "brainstem_aras", part: "paramedian_tegmentum",
    territory: TERRITORY["brainstem_aras|paramedian_tegmentum"], structures: aras, composite: true });
  if (thalBilat.length) sites.push({ id: "thalamus_bilateral_percheron", side: "bilateral", level: "subcortex", part: "thalamus",
    territory: TERRITORY["subcortex|thalamus"], structures: thalBilat, composite: true });
  const li = byLevelPart("locked_in", "ventral_pons");
  if (li.length) sites.push({ id: "locked_in", side: "bilateral", level: "locked_in", part: "ventral_pons",
    territory: TERRITORY["locked_in|ventral_pons"], structures: ["cst_pons", ...li], composite: true });
  return sites;
}
```

- [ ] **Step 7: Register in the solver.** In `src/engine/inverse.js`, add `composeConsciousnessSites` to
the `sites.js` import (`src/engine/inverse.js:18`) and to the concat in `candidateSites()` (`:32`), after
`composeDorsalMidbrainSites()`:

```javascript
          ...composeCentralNystagmusSites(), ...composeDorsalMidbrainSites(), ...composeConsciousnessSites()];
```

- [ ] **Step 8: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/consciousness.test.js`
Expected: PASS — Task 1 + Task 2 blocks, `0 failed`.

- [ ] **Step 9: Full-suite checkpoint** (the four new sites are now solver candidates — confirm nothing is
mis-pulled, especially the unilateral VPL thalamus and bilateral-hemiparesis cord inputs):

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all suites `0 failed`. If subcortex or cord shifts, STOP and surface it (the `bilateralOnly` gate
should keep the unilateral thalamus pure-sensory; `locked_in` over-predicts `preserved_vertical_gaze` so it
loses any existing bilateral-hemiparesis input).

---

### Task 3: Emergent naming & inverse emergence

**Files:**
- Modify: `src/data/syndromes.js` (4 phonebook entries, keyed by exact site id)
- Modify: `test/consciousness.test.js` (emergence block)

**Interfaces:**
- Consumes: the four sites from Task 2; `solve`, `rankSingle`, `nameForSite`.
- Produces: phonebook names for the four sites.

- [ ] **Step 1: Write the failing test** — append to `test/consciousness.test.js` before the print block:

```javascript
// --- Task 3: emergent naming + inverse emergence ---
// 1. Isolated reduced_consciousness -> diffuse (strict): ARAS over-predicts posturing, Percheron
//    over-predicts vertical gaze, so the diffuse site (nothing over-predicted) wins.
{
  const { best } = solve(new Set(["reduced_consciousness@none"]));
  ok("isolated reduced_consciousness -> cerebrum_diffuse", best && best.site.id === "cerebrum_diffuse");
  ok("cerebrum_diffuse names a diffuse / encephalopathy picture",
     best && /diffuse|encephalopath|bihemispheric/i.test(nameForSite(best.site).name));
  // brainstem_aras is a real competing candidate (structural coma), just lower without its companion
  const ids = rankSingle(new Set(["reduced_consciousness@none"])).map(r => r.site.id);
  ok("brainstem_aras is in the ranked candidates for isolated arousal", ids.includes("brainstem_aras"));
}
// 2. reduced_consciousness + extensor_posturing -> brainstem ARAS (structural brainstem coma).
{
  const { best } = solve(new Set(["reduced_consciousness@none", "extensor_posturing@none"]));
  ok("arousal + posturing -> brainstem_aras", best && best.site.id === "brainstem_aras");
  ok("brainstem_aras names an ARAS / brainstem picture",
     best && /aras|brainstem|arousal/i.test(nameForSite(best.site).name));
}
// 3. reduced_consciousness + vertical_gaze_palsy -> Percheron (bilateral paramedian thalamus).
{
  const { best } = solve(new Set(["reduced_consciousness@none", "vertical_gaze_palsy@none"]));
  ok("arousal + vertical gaze palsy -> thalamus_bilateral_percheron",
     best && best.site.id === "thalamus_bilateral_percheron");
  ok("percheron names a paramedian thalamic / Percheron picture",
     best && /percheron|paramedian thalam/i.test(nameForSite(best.site).name));
}
// 4. Quadriplegia + preserved vertical gaze -> locked-in.
{
  const { best } = solve(new Set(["hemiparesis@left", "hemiparesis@right", "preserved_vertical_gaze@none"]));
  ok("quadriplegia + preserved gaze -> locked_in", best && best.site.id === "locked_in");
  ok("locked_in names locked-in syndrome", best && /locked[- ]?in/i.test(nameForSite(best.site).name));
}
// 5. REGRESSION: an isolated vertical_gaze_palsy still -> the tectal Parinaud site (Percheron over-predicts
//    reduced_consciousness, so it loses the isolated case).
{
  const { best } = solve(new Set(["vertical_gaze_palsy@none", "nystagmus_convergence_retraction@none"]));
  ok("isolated vertical gaze -> dorsal_midbrain_tectum (Parinaud unchanged)",
     best && best.site.id === "dorsal_midbrain_tectum");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/consciousness.test.js`
Expected: FAIL — the site-id emergence assertions should PASS (sites registered in Task 2), but the naming
assertions FAIL (`nameForSite` returns the anatomical fallback until the phonebook entries exist).

- [ ] **Step 3: Add the four phonebook entries** to `src/data/syndromes.js`, inside `BY_SITE` (order is
irrelevant — it is a lookup; place near the other composite entries). Each keyed by exact site id:

```javascript
  cerebrum_diffuse: {
    name: "Diffuse bihemispheric / cortical dysfunction (encephalopathy)",
    note: "Impaired arousal from bilateral / diffuse cortical dysfunction with no focal signs.",
    ddx: ["Metabolic (hypoglycaemia, hepatic / uraemic, Na / Ca)", "Hypoxic-ischaemic injury", "Drug / toxin", "Sepsis", "Non-convulsive status epilepticus", "Bilateral cortical stroke"],
    red: "Coma with no focal signs and intact brainstem reflexes is metabolic / diffuse until proven otherwise — check glucose, sodium and a blood gas immediately."
  },
  brainstem_aras: {
    name: "Brainstem ARAS (rostral tegmental) arousal failure",
    note: "A paramedian upper-pons / midbrain tegmental lesion knocks out the ascending reticular activating system; decerebrate (extensor) posturing and other brainstem signs accompany it.",
    ddx: ["Top-of-basilar / midbrain infarct", "Pontine haemorrhage", "Central (transtentorial) herniation", "Demyelination"],
    red: "Impaired arousal with brainstem signs (extensor posturing, asymmetric / fixed pupils, gaze palsy) is a posterior-circulation emergency — image the vessels."
  },
  thalamus_bilateral_percheron: {
    name: "Bilateral paramedian thalamic syndrome (artery of Percheron)",
    note: "One artery (of Percheron) supplies both paramedian thalami ± the rostral midbrain → impaired arousal + vertical gaze palsy + memory / confusion.",
    ddx: ["Artery of Percheron infarct", "Deep cerebral venous thrombosis", "Top-of-basilar syndrome"],
    red: "Sudden coma with vertical gaze palsy and a near-normal early CT → suspect a Percheron infarct or deep venous thrombosis; get vascular imaging."
  },
  locked_in: {
    name: "Locked-in syndrome (ventral pontine)",
    note: "A bilateral basis pontis lesion → quadriplegia + anarthria with PRESERVED consciousness; the dorsal tegmental ARAS is spared, so the patient is awake and communicates by vertical eye movements / blink.",
    ddx: ["Basilar (ventral pontine) infarct", "Central pontine myelinolysis", "Pontine haemorrhage"],
    red: "Do not mistake locked-in for coma or a vegetative state — the patient is fully aware; establish a vertical-eye-movement / blink communication channel."
  },
```

- [ ] **Step 4: Run test to verify the full consciousness suite passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/consciousness.test.js`
Expected: PASS — every block, `0 failed`.

- [ ] **Step 5: Full-suite checkpoint (all suites green)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: every suite `0 failed`. The 21 prior suites are unchanged; the consciousness suite adds its total.

- [ ] **Step 6: Update docs of record** (no git; history lives in docs):
  - `README.md`: add a paragraph to the "Status" narrative — reduced level of consciousness now emerges
    (ARAS / bilateral thalamus / diffuse cortex + locked-in), with the `bilateralOnly` gate making a
    unilateral lesion impair nothing, and decerebrate posturing as the structural-coma companion.
  - `CONTRIBUTING.md`: add the increment to the changelog narrative near the Parinaud entry; strike
    "RAS/consciousness" from the remaining coverage-audit gaps.

---

## Self-Review

**Spec coverage:**
- 3 findings (`reduced_consciousness`, `preserved_vertical_gaze`, `extensor_posturing`), NON_LATERALISED, CROSSES, LOCALISING → Task 1 ✓
- 5 structures (2 bilateralOnly thalamus + 3 composer-only) → Task 2 Steps 3–4 ✓
- `composeConsciousnessSites()` returning 4 sites + TERRITORY + solver registration → Task 2 Steps 5–7 ✓
- Phonebook (4, exact-id) → Task 3 Step 3 ✓
- Emergence: isolated → diffuse; +posturing → ARAS; +vertical gaze → Percheron; quadriplegia+preserved gaze → locked-in; unilateral thalamus gate; Parinaud regression → Tasks 2–3 ✓
- New suite in `package.json` + README → Task 1 Step 7 ✓
- All prior suites green → every task checkpoint ✓

**Placeholder scan:** none — all code blocks are literal.

**Type consistency:** `composeConsciousnessSites` identical across sites.js export, inverse.js
import/registration, and the test import. Structure ids (`thal_aras`, `thal_vgaze_bilat`, `aras_brainstem`,
`aras_posturing`, `cereb_diffuse`, `li_ocular`) and site ids (`cerebrum_diffuse`, `brainstem_aras`,
`thalamus_bilateral_percheron`, `locked_in`) consistent across tasks. Finding ids match between
findings.js, score.js, structures.js `produces`, and the test assertions. `cst_pons` referenced by the
locked-in composer exists in structures.js.

**YAGNI check:** no graded arousal, no decorticate posturing, no brainstem reflex battery, no herniation
mechanism, no corticobulbar/anarthria structure (all deferred per spec).
