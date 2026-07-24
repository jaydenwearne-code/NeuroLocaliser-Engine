# Cortex Regional Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the cerebral cortex as a region to the derive-don't-store engine — the full lobar map (somatotopy, the dominant↔non-dominant mirror, behavioural/limbic signs, visual-field defects, and the bilateral Anton/Balint syndromes) — so cortical stroke and focal-lobe syndromes emerge from anatomy, not rules.

**Architecture:** `part` becomes a cortical **subregion** (gyrus/functional area); vascular territory is a separate annotation and ACA/MCA/PCA syndromes emerge as **composites**. Four small forward-model mechanisms carry the new physiology: a **hemisphere gate** (`dominant`/`nondominant` structures, resolved by a `dominantSide` option on `solve()`, default `"left"`), **sideless `@none` emission** for non-lateralised higher-cortical findings, **bilateral-only** structures for Anton/Balint, and the existing per-structure crossing for the lateralised findings. The anatomy stays pathology-agnostic.

**Tech Stack:** Zero-dependency Node.js ES modules (`"type": "module"`). No test framework — each `test/*.test.js` file is a standalone script with a local `ok(label, cond)` helper that prints `PASS`/`FAIL` and `process.exit(fail === 0 ? 0 : 1)`.

## Global Constraints

- **Node runtime is off PATH.** Prefix every command: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" ...`. Example: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`.
- **Golden rule:** no syndrome is an `if` rule. Syndromes emerge from structures sharing a site; `src/data/syndromes.js` is a descriptive phonebook only.
- **Not a git repository.** The repo has no git. **Skip every `git add`/`git commit` step** in this plan (they are written for the plan template but do not apply here). "Commit" = the suite is green and the task is complete. Do not run `git init`.
- **TDD, red first.** Write the failing test, run it red, implement minimally, run it green. Every task must keep **all prior suites** green (brainstem 8 + cord 5 + sensory-level 22 + central-cord 8 + cauda-conus 8 = 51 existing).
- **Regression command (run after every task):** `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`.
- **Spec:** `docs/superpowers/specs/2026-07-12-cortex-mapping-design.md` is the source of truth for every finding id, structure, territory and gate.

---

## File structure

| File | Responsibility | Change |
|---|---|---|
| `src/model/findings.js` | Finding vocabulary + `CROSSES` + new `NON_LATERALISED` set | Modify |
| `src/model/structures.js` | Cortex structure block; new `hemisphere`/`bilateralOnly` fields | Modify |
| `src/model/sites.js` | `LEVELS`/`PARTS`/`TERRITORY`; `DIVISION` map; two cortex composers | Modify |
| `src/engine/forward.js` | Bilateral-only gate, hemisphere gate, sideless emission, `opts` | Modify |
| `src/engine/score.js` | `LOCALISING` additions; `opts` passthrough | Modify |
| `src/engine/inverse.js` | Candidate list; `dominantSide` plumbing; result echo | Modify |
| `src/data/syndromes.js` | Dominance-aware `nameForSite`; cortex + bilateral entries | Modify |
| `test/cortex.test.js` | New emergence suite | Create |
| `package.json` | Add cortex suite to `test` script | Modify |
| `README.md` | Status line | Modify |

**Task ordering rationale:** the model tables and the forward-model mechanisms must exist before any cortex syndrome can emerge, so Tasks 1–4 build the substrate and are verified by direct forward-model assertions (no phonebook needed). Tasks 5–10 add the composers, scoring, plumbing and phonebook, each unlocking a family of emergent syndromes. Every task appends to `test/cortex.test.js` and keeps `npm test` green.

---

### Task 1: Cortical findings vocabulary

**Files:**
- Modify: `src/model/findings.js`
- Test: `test/cortex.test.js` (create)

**Interfaces:**
- Consumes: `FINDINGS`, `CROSSES`, `isFinding` (existing exports).
- Produces: 26 new finding ids in `FINDINGS`; matching `CROSSES` entries; new export `export const NON_LATERALISED` (a `Set` of the sideless finding ids). `facial_weak_umn` is reused unchanged.

- [ ] **Step 1: Write the failing test**

Create `test/cortex.test.js`:

```js
// cortex.test.js — the cerebral cortex region: lobar subregions mapped to function.
// Somatotopy + hemisphere dominance + sideless higher-cortical findings + bilateral syndromes.
// Run: node test/cortex.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// --- Task 1: vocabulary ---
const LATERALISED = ["weak_arm","weak_leg","cortical_sensory_arm","cortical_sensory_leg",
  "gaze_deviation","neglect","homonymous_hemianopia","superior_quadrantanopia","inferior_quadrantanopia"];
const SIDELESS = ["aphasia_expressive","aphasia_receptive","gerstmann","motor_dysprosody",
  "sensory_dysprosody","anosognosia","constructional_apraxia","prosopagnosia","executive_dysfunction",
  "abulia","disinhibition","hallucinations","mood_change","verbal_memory_impairment",
  "nonverbal_memory_impairment","cortical_blindness","balint_syndrome"];

for (const id of [...LATERALISED, ...SIDELESS]) ok(`finding ${id} exists`, isFinding(id));
ok("gaze_deviation is ipsi (CROSSES false)", CROSSES.gaze_deviation === false);
ok("weak_arm crosses (contra)", CROSSES.weak_arm === true);
ok("neglect crosses (contra)", CROSSES.neglect === true);
ok("superior_quadrantanopia crosses", CROSSES.superior_quadrantanopia === true);
for (const id of SIDELESS) ok(`${id} is NON_LATERALISED`, NON_LATERALISED.has(id));
for (const id of LATERALISED) ok(`${id} is NOT NON_LATERALISED`, !NON_LATERALISED.has(id));
ok("facial_weak_umn reused (still exists)", isFinding("facial_weak_umn"));

// ---- report ----
console.log("\nNeuroLocaliser — CORTEX tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: FAIL — `NON_LATERALISED` is not exported (import error / undefined), findings don't exist.

- [ ] **Step 3: Add the findings and the NON_LATERALISED set**

In `src/model/findings.js`, add a Cortical block inside the `FINDINGS` object (after the existing Root/LMN group):

```js
  // Cortical — somatotopic motor/sensory (lateralised)
  weak_arm:       { desc: "Contralateral arm weakness (cortical, regional)", group: "Cortical" },
  weak_leg:       { desc: "Contralateral leg weakness (cortical, regional)", group: "Cortical" },
  cortical_sensory_arm: { desc: "Cortical (discriminative) sensory loss, arm — astereognosis, agraphaesthesia", group: "Cortical" },
  cortical_sensory_leg: { desc: "Cortical (discriminative) sensory loss, leg", group: "Cortical" },
  gaze_deviation: { desc: "Conjugate gaze deviation toward the lesion (away from the weak side)", group: "Cortical" },
  neglect:        { desc: "Hemispatial neglect / inattention to the contralesional side", group: "Cortical" },
  homonymous_hemianopia:   { desc: "Homonymous hemianopia (± macular sparing)", group: "Cortical" },
  superior_quadrantanopia: { desc: "Contralateral superior homonymous quadrantanopia (temporal / Meyer's loop)", group: "Cortical" },
  inferior_quadrantanopia: { desc: "Contralateral inferior homonymous quadrantanopia (parietal radiation)", group: "Cortical" },
  // Cortical — non-lateralised higher-cortical / behavioural (emitted @none)
  aphasia_expressive: { desc: "Non-fluent (Broca's) expressive aphasia", group: "Cortical" },
  aphasia_receptive:  { desc: "Fluent (Wernicke's) receptive aphasia", group: "Cortical" },
  gerstmann:          { desc: "Gerstmann syndrome (agraphia, acalculia, finger agnosia, L–R disorientation)", group: "Cortical" },
  motor_dysprosody:   { desc: "Motor (expressive) aprosodia — flat, unmodulated speech", group: "Cortical" },
  sensory_dysprosody: { desc: "Sensory (receptive) aprosodia — cannot read emotional prosody", group: "Cortical" },
  anosognosia:        { desc: "Anosognosia (denial / unawareness of deficit)", group: "Cortical" },
  constructional_apraxia: { desc: "Constructional apraxia", group: "Cortical" },
  prosopagnosia:      { desc: "Prosopagnosia (impaired face recognition)", group: "Cortical" },
  executive_dysfunction: { desc: "Executive dysfunction (poor planning, organising, sequencing)", group: "Cortical" },
  abulia:             { desc: "Apathy / abulia (reduced spontaneous behaviour)", group: "Cortical" },
  disinhibition:      { desc: "Disinhibition, personality change, irritability", group: "Cortical" },
  hallucinations:     { desc: "Hallucinations (olfactory/gustatory/visual/auditory) or episodic fear", group: "Cortical" },
  mood_change:        { desc: "Episodic mood change", group: "Cortical" },
  verbal_memory_impairment:    { desc: "Short-term verbal / written memory impairment", group: "Cortical" },
  nonverbal_memory_impairment: { desc: "Short-term non-verbal memory impairment (e.g. music)", group: "Cortical" },
  cortical_blindness: { desc: "Cortical blindness with unawareness (Anton's syndrome)", group: "Cortical" },
  balint_syndrome:    { desc: "Balint syndrome (optic ataxia, oculomotor apraxia, simultanagnosia)", group: "Cortical" },
```

In the `CROSSES` map, add (lateralised — contra except gaze):

```js
  weak_arm: true, weak_leg: true, cortical_sensory_arm: true, cortical_sensory_leg: true,
  neglect: true, homonymous_hemianopia: true, superior_quadrantanopia: true, inferior_quadrantanopia: true,
  gaze_deviation: false, // conjugate deviation TOWARD the lesion — ipsilateral
  // sideless higher-cortical: crossing is moot, kept false for map completeness
  aphasia_expressive: false, aphasia_receptive: false, gerstmann: false, motor_dysprosody: false,
  sensory_dysprosody: false, anosognosia: false, constructional_apraxia: false, prosopagnosia: false,
  executive_dysfunction: false, abulia: false, disinhibition: false, hallucinations: false,
  mood_change: false, verbal_memory_impairment: false, nonverbal_memory_impairment: false,
  cortical_blindness: false, balint_syndrome: false,
```

After the `CROSSES` export (before `isFinding`), add the sideless set:

```js
// Findings with no body side — emitted `@none` by the forward model (higher-cortical / behavioural).
export const NON_LATERALISED = new Set([
  "aphasia_expressive","aphasia_receptive","gerstmann","motor_dysprosody","sensory_dysprosody",
  "anosognosia","constructional_apraxia","prosopagnosia","executive_dysfunction","abulia",
  "disinhibition","hallucinations","mood_change","verbal_memory_impairment",
  "nonverbal_memory_impairment","cortical_blindness","balint_syndrome"
]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: PASS (all Task-1 assertions).

- [ ] **Step 5: Add cortex suite to the test runner and confirm no regression**

In `package.json`, extend the `test` script (append ` && node test/cortex.test.js`):

```json
    "test": "node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js && node test/central-cord.test.js && node test/cauda-conus.test.js && node test/cortex.test.js"
```

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all six suites PASS (51 prior + cortex vocabulary). Task complete when green.

---

### Task 2: Cortex structure catalogue

**Files:**
- Modify: `src/model/structures.js`
- Test: `test/cortex.test.js` (append)

**Interfaces:**
- Consumes: `STRUCTURES`, `STRUCTURE_BY_ID` (existing). New optional structure fields `hemisphere: "dominant"|"nondominant"` and `bilateralOnly: true` (read by later tasks; ignored until Task 4).
- Produces: 13 cortex subregions' structures in `STRUCTURES`, each `level: "cortex"` with a subregion `part`. Structure ids and `produces` exactly as listed in the spec's map table.

- [ ] **Step 1: Write the failing test**

Append to `test/cortex.test.js` (before the `// ---- report ----` block):

```js
// --- Task 2: structure catalogue ---
import { STRUCTURES, STRUCTURE_BY_ID } from "../src/model/structures.js";
const cortexOf = part => STRUCTURES.filter(s => s.level === "cortex" && s.part === part).map(s => s.produces).sort();
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

ok("motor_leg -> weak_leg", eq(cortexOf("motor_leg"), ["weak_leg"]));
ok("motor_facearm -> face+arm", eq(cortexOf("motor_facearm"), ["facial_weak_umn","weak_arm"].sort()));
ok("operculum -> broca+dysprosody", eq(cortexOf("operculum"), ["aphasia_expressive","motor_dysprosody"].sort()));
ok("frontal_eye_field -> gaze", eq(cortexOf("frontal_eye_field"), ["gaze_deviation"]));
ok("occipital -> hemianopia+anton", eq(cortexOf("occipital"), ["cortical_blindness","homonymous_hemianopia"].sort()));
ok("parietal has gerstmann+neglect+balint", ["gerstmann","neglect","balint_syndrome","inferior_quadrantanopia"]
   .every(f => cortexOf("parietal").includes(f)));
ok("temporal has memory+halluc+sup-quadrant", ["verbal_memory_impairment","nonverbal_memory_impairment","hallucinations","superior_quadrantanopia"]
   .every(f => cortexOf("temporal").includes(f)));
ok("broca is dominant-gated", STRUCTURE_BY_ID.ctx_broca.hemisphere === "dominant");
ok("neglect is nondominant-gated", STRUCTURE_BY_ID.ctx_neglect.hemisphere === "nondominant");
ok("anton is bilateralOnly", STRUCTURE_BY_ID.ctx_anton.bilateralOnly === true);
ok("balint is bilateralOnly", STRUCTURE_BY_ID.ctx_balint.bilateralOnly === true);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: FAIL — no cortex structures exist yet (`cortexOf` returns `[]`; `STRUCTURE_BY_ID.ctx_broca` is undefined).

- [ ] **Step 3: Add the cortex structure block**

In `src/model/structures.js`, add before the closing `];` of `STRUCTURES` (after the conus block). One structure = one finding; crossing is inherited from `findings.CROSSES` (no per-structure `crosses` needed — `gaze_deviation` is already `false` there):

```js
  // ---- CEREBRAL CORTEX (part = subregion; territory is annotated separately in sites.js) ----
  // Frontal
  { id: "ctx_motor_leg",   level: "cortex", part: "motor_leg",   produces: "weak_leg",
    note: "paracentral lobule (leg motor) — ACA territory" },
  { id: "ctx_motor_face",  level: "cortex", part: "motor_facearm", produces: "facial_weak_umn",
    note: "precentral face (lower face UMN) — MCA superior division" },
  { id: "ctx_motor_arm",   level: "cortex", part: "motor_facearm", produces: "weak_arm",
    note: "precentral arm — MCA superior division" },
  { id: "ctx_broca",       level: "cortex", part: "operculum", produces: "aphasia_expressive", hemisphere: "dominant",
    note: "frontal operculum (Broca) — dominant hemisphere" },
  { id: "ctx_motor_prosody", level: "cortex", part: "operculum", produces: "motor_dysprosody", hemisphere: "nondominant",
    note: "right frontal operculum homologue — non-dominant motor aprosodia" },
  { id: "ctx_fef",         level: "cortex", part: "frontal_eye_field", produces: "gaze_deviation",
    note: "frontal eye field — conjugate deviation toward the lesion (ipsi)" },
  { id: "ctx_dlpfc",       level: "cortex", part: "dlpfc", produces: "executive_dysfunction",
    note: "dorsolateral prefrontal cortex — executive dysfunction" },
  { id: "ctx_medial_pfc",  level: "cortex", part: "medial_pfc", produces: "abulia",
    note: "medial prefrontal cortex — apathy/abulia — ACA territory" },
  { id: "ctx_orbitofrontal", level: "cortex", part: "orbitofrontal", produces: "disinhibition",
    note: "orbitofrontal cortex — disinhibition, personality change" },
  // Parietal (primary sensory in MCA superior; association parietal in MCA inferior)
  { id: "ctx_sensory_arm", level: "cortex", part: "sensory_facearm", produces: "cortical_sensory_arm",
    note: "postcentral face/arm sensory — MCA superior division" },
  { id: "ctx_sensory_leg", level: "cortex", part: "sensory_leg", produces: "cortical_sensory_leg",
    note: "postcentral leg sensory (paracentral) — ACA territory" },
  { id: "ctx_gerstmann",   level: "cortex", part: "parietal", produces: "gerstmann", hemisphere: "dominant",
    note: "dominant angular/supramarginal gyrus — Gerstmann" },
  { id: "ctx_neglect",     level: "cortex", part: "parietal", produces: "neglect", hemisphere: "nondominant",
    note: "non-dominant parietal — hemispatial neglect (contralesional)" },
  { id: "ctx_anosognosia", level: "cortex", part: "parietal", produces: "anosognosia", hemisphere: "nondominant",
    note: "non-dominant parietal — anosognosia" },
  { id: "ctx_constructional", level: "cortex", part: "parietal", produces: "constructional_apraxia", hemisphere: "nondominant",
    note: "non-dominant parietal — constructional apraxia" },
  { id: "ctx_prosopagnosia", level: "cortex", part: "parietal", produces: "prosopagnosia", hemisphere: "nondominant",
    note: "non-dominant occipitotemporal/parietal — prosopagnosia (simplified)" },
  { id: "ctx_inf_quadrant", level: "cortex", part: "parietal", produces: "inferior_quadrantanopia",
    note: "parietal (dorsal) optic radiations — inferior quadrantanopia" },
  { id: "ctx_balint",      level: "cortex", part: "parietal", produces: "balint_syndrome", bilateralOnly: true,
    note: "bilateral parieto-occipital — Balint syndrome (needs both sides)" },
  // Temporal
  { id: "ctx_wernicke",    level: "cortex", part: "temporoparietal", produces: "aphasia_receptive", hemisphere: "dominant",
    note: "dominant temporoparietal (Wernicke)" },
  { id: "ctx_sensory_prosody", level: "cortex", part: "temporoparietal", produces: "sensory_dysprosody", hemisphere: "nondominant",
    note: "non-dominant temporoparietal — sensory aprosodia" },
  { id: "ctx_hallucinations", level: "cortex", part: "temporal", produces: "hallucinations",
    note: "temporal lobe (either side) — hallucinations / episodic fear" },
  { id: "ctx_mood",        level: "cortex", part: "temporal", produces: "mood_change",
    note: "temporal lobe (either side) — episodic mood change" },
  { id: "ctx_verbal_memory", level: "cortex", part: "temporal", produces: "verbal_memory_impairment", hemisphere: "dominant",
    note: "dominant temporal — verbal short-term memory" },
  { id: "ctx_nonverbal_memory", level: "cortex", part: "temporal", produces: "nonverbal_memory_impairment", hemisphere: "nondominant",
    note: "non-dominant temporal — non-verbal short-term memory" },
  { id: "ctx_sup_quadrant", level: "cortex", part: "temporal", produces: "superior_quadrantanopia",
    note: "temporal (Meyer's loop) optic radiations — superior quadrantanopia" },
  // Occipital
  { id: "ctx_visual_cortex", level: "cortex", part: "occipital", produces: "homonymous_hemianopia",
    note: "primary visual cortex — PCA territory" },
  { id: "ctx_anton",       level: "cortex", part: "occipital", produces: "cortical_blindness", bilateralOnly: true,
    note: "bilateral occipital — Anton's syndrome (needs both sides)" },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: PASS (Task 1 + Task 2 assertions).

- [ ] **Step 5: Confirm no regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all six suites PASS. Task complete when green. (Cortex structures exist but no cortex sites yet — the existing suites are untouched because no existing site references `level: "cortex"`.)

---

### Task 3: Cortex primitive sites (subregions)

**Files:**
- Modify: `src/model/sites.js`
- Test: `test/cortex.test.js` (append)

**Interfaces:**
- Consumes: `SITES`, `SITE_BY_ID`, `buildSites` (existing). `STRUCTURES` filtered by `(level, part)`.
- Produces: left/right `cortex` primitive sites via the existing `buildSites` double-loop (e.g. `left_cortex_parietal`), each with `territory` from `TERRITORY`. A new exported `DIVISION` map (`part -> { territory, division? }`) consumed by Task 5's composer.

- [ ] **Step 1: Write the failing test**

Append to `test/cortex.test.js`:

```js
// --- Task 3: primitive subregion sites ---
import { SITE_BY_ID, DIVISION } from "../src/model/sites.js";
ok("left_cortex_parietal exists", !!SITE_BY_ID.left_cortex_parietal);
ok("right_cortex_operculum exists", !!SITE_BY_ID.right_cortex_operculum);
ok("cortex parietal has a territory", /parietal/i.test(SITE_BY_ID.left_cortex_parietal.territory || ""));
ok("DIVISION maps operculum to MCA superior",
   DIVISION.operculum && DIVISION.operculum.territory === "MCA" && DIVISION.operculum.division === "superior");
ok("DIVISION maps motor_leg to ACA", DIVISION.motor_leg && DIVISION.motor_leg.territory === "ACA");
ok("DIVISION maps occipital to PCA", DIVISION.occipital && DIVISION.occipital.territory === "PCA");
ok("DIVISION maps parietal to MCA inferior",
   DIVISION.parietal && DIVISION.parietal.territory === "MCA" && DIVISION.parietal.division === "inferior");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: FAIL — `DIVISION` not exported; `left_cortex_parietal` undefined (cortex not in `LEVELS`/`PARTS`).

- [ ] **Step 3: Extend LEVELS/PARTS/TERRITORY and add DIVISION**

In `src/model/sites.js`:

Add `"cortex"` to `LEVELS`:

```js
const LEVELS = ["midbrain", "pons", "medulla", "cord", "cortex"];
```

Add the 13 cortex subregion parts to `PARTS`:

```js
const PARTS = ["medial", "lateral", "anterior", "posterior",
  "motor_leg", "motor_facearm", "operculum", "frontal_eye_field", "dlpfc", "medial_pfc", "orbitofrontal",
  "sensory_facearm", "sensory_leg", "parietal", "temporoparietal", "temporal", "occipital"];
```

Add cortex entries to the `TERRITORY` map (human-readable labels):

```js
  "cortex|motor_leg":        "ACA (paracentral — leg motor)",
  "cortex|motor_facearm":    "MCA superior division (precentral — face/arm motor)",
  "cortex|operculum":        "MCA superior division (frontal operculum / Broca's area)",
  "cortex|frontal_eye_field":"MCA superior division (frontal eye field)",
  "cortex|dlpfc":            "MCA (dorsolateral prefrontal cortex)",
  "cortex|medial_pfc":       "ACA (medial prefrontal cortex)",
  "cortex|orbitofrontal":    "ACA (orbitofrontal cortex)",
  "cortex|sensory_facearm":  "MCA superior division (postcentral — face/arm sensory)",
  "cortex|sensory_leg":      "ACA (paracentral — leg sensory)",
  "cortex|parietal":         "MCA inferior division (inferior parietal lobule)",
  "cortex|temporoparietal":  "MCA inferior division (temporoparietal / Wernicke's area)",
  "cortex|temporal":         "MCA inferior division (temporal lobe)",
  "cortex|occipital":        "PCA (primary visual cortex)",
```

After `export const SITE_BY_ID = ...`, add the vascular annotation map (pathology-agnostic — subregion → territory/division; used by the composer, not baked into structures):

```js
// Vascular annotation: which artery (and MCA division) supplies each cortical subregion.
// This is metadata, NOT part of the anatomy — structures never reference it. Vascular syndromes
// are composed from it (composeVascularCortexSites); other pathologies will use other composers.
export const DIVISION = {
  motor_leg:      { territory: "ACA" },
  sensory_leg:    { territory: "ACA" },
  medial_pfc:     { territory: "ACA" },
  orbitofrontal:  { territory: "ACA" },
  motor_facearm:  { territory: "MCA", division: "superior" },
  sensory_facearm:{ territory: "MCA", division: "superior" },
  operculum:      { territory: "MCA", division: "superior" },
  frontal_eye_field:{ territory: "MCA", division: "superior" },
  dlpfc:          { territory: "MCA", division: "superior" },
  parietal:       { territory: "MCA", division: "inferior" },
  temporoparietal:{ territory: "MCA", division: "inferior" },
  temporal:       { territory: "MCA", division: "inferior" },
  occipital:      { territory: "PCA" }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: PASS.

- [ ] **Step 5: Confirm no regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all six suites PASS. (New cortex sites exist but the forward model does not yet handle the gates, so no cortex syndrome emerges through `solve()` yet — but existing suites are unaffected: `expectedFindings` on non-cortex sites is unchanged.) Task complete when green.

---

### Task 4: Forward-model gates and sideless emission

**Files:**
- Modify: `src/engine/forward.js`
- Test: `test/cortex.test.js` (append)

**Interfaces:**
- Consumes: `STRUCTURE_BY_ID`, `CROSSES`, `NON_LATERALISED` (findings.js), `bodySideFor`, `otherSide`, `signed` (existing).
- Produces: `expectedFindings(site, opts = {})` and `explain(site, opts = {})` now accept `opts.dominantSide` (default `"left"`) and apply, per structure: (1) bilateral-only gate, (2) hemisphere gate (unilateral only), (3) sideless `@none` emission. Signatures are backward-compatible (opts optional).

- [ ] **Step 1: Write the failing test**

Append to `test/cortex.test.js`:

```js
// --- Task 4: forward-model gates ---
import { expectedFindings } from "../src/engine/forward.js";
import { SITE_BY_ID as S } from "../src/model/sites.js";

// sideless emission: Broca on a dominant (default left) operculum site -> @none
{
  const exp = expectedFindings(S.left_cortex_operculum);
  ok("left operculum emits aphasia_expressive@none (default dominant=left)", exp.has("aphasia_expressive@none"));
  ok("left operculum does NOT emit motor_dysprosody (dominant side)", !exp.has("motor_dysprosody@none"));
}
// hemisphere gate flips with dominantSide
{
  const exp = expectedFindings(S.left_cortex_operculum, { dominantSide: "right" });
  ok("with dominant=right, left operculum drops aphasia", !exp.has("aphasia_expressive@none"));
  ok("with dominant=right, left operculum emits motor_dysprosody", exp.has("motor_dysprosody@none"));
}
// lateralised cortical findings still cross; gaze is ipsi
{
  const exp = expectedFindings(S.left_cortex_motor_facearm);
  ok("left motor_facearm -> weak_arm@right (contra)", exp.has("weak_arm@right"));
  ok("left motor_facearm -> facial_weak_umn@right (contra)", exp.has("facial_weak_umn@right"));
  const fef = expectedFindings(S.left_cortex_frontal_eye_field);
  ok("left FEF -> gaze_deviation@left (ipsi)", fef.has("gaze_deviation@left"));
}
// bilateral-only structure does NOT emit on a unilateral site
{
  const exp = expectedFindings(S.left_cortex_occipital);
  ok("unilateral occipital emits homonymous_hemianopia@right", exp.has("homonymous_hemianopia@right"));
  ok("unilateral occipital does NOT emit cortical_blindness", !exp.has("cortical_blindness@none"));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: FAIL — current `expectedFindings` ignores `hemisphere`/`bilateralOnly`/`NON_LATERALISED`, so it emits e.g. `aphasia_expressive@left` (crossing path), `motor_dysprosody@left`, and `cortical_blindness@left`.

- [ ] **Step 3: Implement the gates in forward.js**

Replace the imports and the `expectedFindings`/`explain` bodies in `src/engine/forward.js`. Update the import line:

```js
import { STRUCTURE_BY_ID } from "../model/structures.js";
import { CROSSES, NON_LATERALISED } from "../model/findings.js";
```

Add a helper after `bodySideFor` (before `signed`):

```js
// Required lesion side for a hemisphere-gated structure, given the dominant side.
// dominant -> the dominant hemisphere; nondominant -> the other. Returns null if ungated.
function requiredSideFor(struct, dominantSide) {
  if (!struct || !struct.hemisphere) return null;
  return struct.hemisphere === "dominant" ? dominantSide : otherSide(dominantSide);
}

// Should this structure emit at this site, given the dominant side? Applies the two gates.
function structActiveAt(struct, site, dominantSide) {
  // Bilateral-only structures (Anton, Balint) manifest ONLY on a both-hemispheres site.
  if (struct.bilateralOnly && site.side !== "bilateral") return false;
  // Hemisphere-gated structures emit only on the matching unilateral (left/right) side;
  // on bilateral or midline sites they do not emit (the mirror is a unilateral discriminator).
  if (struct.hemisphere) {
    if (site.side !== "left" && site.side !== "right") return false;
    if (site.side !== requiredSideFor(struct, dominantSide)) return false;
  }
  return true;
}
```

Replace `expectedFindings`:

```js
// Expected signed findings for a lesion at a site. Emission per structure:
//   - non-lateralised findings (higher-cortical/behavioural) -> `${finding}@none`
//   - midline site  -> `${finding}@midline`
//   - bilateral site -> both `@left` and `@right`
//   - one-sided site -> crossing rule places it ipsi/contra
// Two gates run first (structActiveAt): bilateral-only and hemisphere (dominant/non-dominant).
export function expectedFindings(site, opts = {}) {
  const dominantSide = opts.dominantSide || "left";
  const out = new Set();
  for (const structId of site.structures) {
    const struct = STRUCTURE_BY_ID[structId];
    if (!struct) continue;
    if (!structActiveAt(struct, site, dominantSide)) continue;
    const f = struct.produces;
    if (NON_LATERALISED.has(f)) {
      out.add(signed(f, "none"));
    } else if (site.side === "midline") {
      out.add(signed(f, "midline"));
    } else if (site.side === "bilateral") {
      out.add(signed(f, "left"));
      out.add(signed(f, "right"));
    } else {
      out.add(signed(f, bodySideFor(f, site.side, struct)));
    }
  }
  return out;
}
```

Replace `explain` to mirror the same gates and emission:

```js
// Human-readable explanation: which structure produced each expected finding (and on which side).
export function explain(site, opts = {}) {
  const dominantSide = opts.dominantSide || "left";
  return site.structures.flatMap(structId => {
    const s = STRUCTURE_BY_ID[structId];
    if (!s || !structActiveAt(s, site, dominantSide)) return [];
    const f = s.produces;
    const sides = NON_LATERALISED.has(f) ? ["none"]
      : site.side === "midline" ? ["midline"]
      : site.side === "bilateral" ? ["left", "right"]
      : [bodySideFor(f, site.side, s)];
    return sides.map(bodySide => ({ finding: f, bodySide, structure: s.id, note: s.note }));
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: PASS.

- [ ] **Step 5: Confirm no regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all six suites PASS. (No existing structure has `hemisphere`/`bilateralOnly`, and no existing finding is in `NON_LATERALISED`, so brainstem/cord/cauda emission is byte-for-byte unchanged.) Task complete when green.

---

### Task 5: Vascular + bilateral cortex composers

**Files:**
- Modify: `src/model/sites.js`, `src/engine/inverse.js`
- Test: `test/cortex.test.js` (append)

**Interfaces:**
- Consumes: `STRUCTURES`, `DIVISION`, `TERRITORY` (sites.js); `composeHemiLevelSites`, `composeBilateralCordSites`, `composeCaudaConusSites` (existing pattern).
- Produces: `composeVascularCortexSites()` → per side, composites `cortex_aca`, `cortex_mca_superior`, `cortex_mca_inferior`, `cortex_mca`, `cortex_pca` (ids `${side}_cortex_${part}`, `part` = `aca`/`mca_superior`/`mca_inferior`/`mca`/`pca`). `composeBilateralCortexSites()` → `bilateral_occipital`, `bilateral_parietal` (`side: "bilateral"`). Both wired into `inverse.candidateSites()`.

- [ ] **Step 1: Write the failing test**

Append to `test/cortex.test.js`:

```js
// --- Task 5: composers ---
import { composeVascularCortexSites, composeBilateralCortexSites } from "../src/model/sites.js";
{
  const vasc = composeVascularCortexSites();
  const byId = Object.fromEntries(vasc.map(s => [s.id, s]));
  ok("left_cortex_aca composite exists", !!byId.left_cortex_aca);
  ok("left_cortex_mca_superior exists", !!byId.left_cortex_mca_superior);
  ok("left_cortex_mca (whole) exists", !!byId.left_cortex_mca);
  ok("left_cortex_pca exists", !!byId.left_cortex_pca);
  ok("aca composite includes ctx_motor_leg", byId.left_cortex_aca.structures.includes("ctx_motor_leg"));
  ok("mca_superior includes ctx_broca", byId.left_cortex_mca_superior.structures.includes("ctx_broca"));
  ok("whole mca includes both broca and wernicke",
     byId.left_cortex_mca.structures.includes("ctx_broca") && byId.left_cortex_mca.structures.includes("ctx_wernicke"));
  ok("mca_superior does NOT include ctx_wernicke (inferior)", !byId.left_cortex_mca_superior.structures.includes("ctx_wernicke"));
}
{
  const bilat = composeBilateralCortexSites();
  const byId = Object.fromEntries(bilat.map(s => [s.id, s]));
  ok("bilateral_occipital exists", !!byId.bilateral_occipital && byId.bilateral_occipital.side === "bilateral");
  ok("bilateral_parietal exists", !!byId.bilateral_parietal && byId.bilateral_parietal.side === "bilateral");
  ok("bilateral_occipital carries ctx_anton", byId.bilateral_occipital.structures.includes("ctx_anton"));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: FAIL — composer functions not exported.

- [ ] **Step 3: Add the two composers**

In `src/model/sites.js`, after `composeCaudaConusSites()`, add:

```js
// CORTICAL VASCULAR COMPOSITES. Anatomy is organised by subregion; vascular syndromes are DERIVED
// by grouping subregions by their DIVISION annotation (territory + MCA division). One artery on one
// side is a composite site; the whole-MCA composite unions both divisions. Pathology-agnostic: this
// is one lesion-shape family (stroke), not the organising primitive.
export function composeVascularCortexSites() {
  const partsWhere = pred => Object.keys(DIVISION).filter(pred);
  const structuresForParts = parts =>
    STRUCTURES.filter(s => s.level === "cortex" && parts.includes(s.part)).map(s => s.id);

  const aca = partsWhere(p => DIVISION[p].territory === "ACA");
  const mcaSup = partsWhere(p => DIVISION[p].territory === "MCA" && DIVISION[p].division === "superior");
  const mcaInf = partsWhere(p => DIVISION[p].territory === "MCA" && DIVISION[p].division === "inferior");
  const pca = partsWhere(p => DIVISION[p].territory === "PCA");

  const groups = [
    { part: "aca", parts: aca, terr: "anterior cerebral artery (medial hemisphere)" },
    { part: "mca_superior", parts: mcaSup, terr: "MCA superior division (fronto-opercular)" },
    { part: "mca_inferior", parts: mcaInf, terr: "MCA inferior division (temporoparietal)" },
    { part: "mca", parts: [...mcaSup, ...mcaInf], terr: "complete MCA territory" },
    { part: "pca", parts: pca, terr: "posterior cerebral artery (occipital)" }
  ];

  const sites = [];
  for (const g of groups) {
    const structures = structuresForParts(g.parts);
    if (structures.length === 0) continue;
    for (const side of SIDES) {
      sites.push({ id: `${side}_cortex_${g.part}`, side, level: "cortex", part: g.part,
        territory: g.terr, structures, composite: true });
    }
  }
  return sites;
}

// BILATERAL CORTICAL COMPOSITES. Built only for subregions that contain a `bilateralOnly` structure
// (occipital → Anton, parietal → Balint): a both-hemispheres lesion. Structures are derived; the
// forward model's bilateral emission + bilateral-only gate surface the bilateral-only syndromes and
// skip the unilateral hemisphere-gated mirror findings.
export function composeBilateralCortexSites() {
  const bilateralParts = [...new Set(
    STRUCTURES.filter(s => s.level === "cortex" && s.bilateralOnly).map(s => s.part)
  )];
  return bilateralParts.map(part => ({
    id: `bilateral_${part}`,
    side: "bilateral", level: "cortex", part,
    territory: `bilateral ${part} (${TERRITORY[`cortex|${part}`] || part})`,
    structures: STRUCTURES.filter(s => s.level === "cortex" && s.part === part).map(s => s.id),
    composite: true
  }));
}
```

In `src/engine/inverse.js`, extend the import and `candidateSites()`:

```js
import { SITES, composeHemiLevelSites, composeBilateralCordSites, composeCaudaConusSites,
         composeVascularCortexSites, composeBilateralCortexSites } from "../model/sites.js";
```

```js
function candidateSites() {
  return [...SITES, ...composeHemiLevelSites(), ...composeBilateralCordSites(),
          ...composeCaudaConusSites(), ...composeVascularCortexSites(), ...composeBilateralCortexSites()];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: PASS.

- [ ] **Step 5: Confirm no regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all six suites PASS. (New candidate sites only match cortex findings, which never appear in the existing suites' inputs, so their rankings are unchanged.) Task complete when green.

---

### Task 6: Scoring + dominantSide plumbing through solve()

**Files:**
- Modify: `src/engine/score.js`, `src/engine/inverse.js`
- Test: `test/cortex.test.js` (append)

**Interfaces:**
- Consumes: `scoreSite`, `expectedFindings`, `LOCALISING`, `findingIdOf` (existing).
- Produces: `scoreSite(site, observedSet, opts = {})` forwards `opts` to `expectedFindings`. `rankSingle(observedSet, opts)`, `minimalSet(observedSet, opts)` thread `opts`. `solve(observedSet, options = {})` resolves `dominantSide = options.dominantSide || "left"`, passes `{ dominantSide }` to scoring, and returns it on the result as `dominantSide`. `LOCALISING` gains the crisp cortical localisers.

- [ ] **Step 1: Write the failing test**

Append to `test/cortex.test.js`:

```js
// --- Task 6: scoring + dominantSide plumbing → first emergent syndromes ---
import { solve } from "../src/engine/inverse.js";

// ACA: focal leg weakness + leg cortical sensory + abulia
{
  const { best } = solve(new Set(["weak_leg@right","cortical_sensory_leg@right","abulia@none"]));
  ok("ACA -> left_cortex_aca", best && best.site.id === "left_cortex_aca");
}
// MCA superior, dominant (default left): Broca picture
{
  const { best } = solve(new Set(["facial_weak_umn@right","weak_arm@right","aphasia_expressive@none","gaze_deviation@left"]));
  ok("MCA-sup dominant -> left_cortex_mca_superior", best && best.site.id === "left_cortex_mca_superior");
}
// dominantSide option echoed and honoured: a left MCA-superior lesion in a RIGHT-dominant patient
// produces dysprosody, not aphasia — so the same aphasia input no longer localises there.
{
  const res = solve(new Set(["aphasia_expressive@none","weak_arm@right"]), { dominantSide: "right" });
  ok("solve echoes dominantSide", res.dominantSide === "right");
  ok("right-dominant: aphasia does NOT localise to left operculum",
     !(res.best && res.best.site.structures && res.best.site.structures.includes("ctx_broca") && res.best.site.side === "left"));
}
// Focal non-dominant parietal: neglect picture localises to the parietal subregion (tighter than whole MCA-inf)
{
  const { best } = solve(new Set(["neglect@left","anosognosia@none","inferior_quadrantanopia@left"]));
  ok("focal neglect -> right_cortex_parietal", best && best.site.id === "right_cortex_parietal");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: FAIL — `solve` does not thread `dominantSide` (so the `dominantSide: "right"` case still emits aphasia and mislocalises), `res.dominantSide` is undefined, and the ACA/MCA localisers may tie or misrank because the cortical findings aren't yet in `LOCALISING`.

- [ ] **Step 3: Add LOCALISING entries and thread opts**

In `src/engine/score.js`, add the crisp cortical localisers to the `LOCALISING` set (append inside the `new Set([...])`):

```js
  "aphasia_expressive","aphasia_receptive","gerstmann","motor_dysprosody","sensory_dysprosody",
  "neglect","anosognosia","constructional_apraxia","prosopagnosia","gaze_deviation",
  "homonymous_hemianopia","superior_quadrantanopia","inferior_quadrantanopia",
  "cortical_blindness","balint_syndrome","abulia"
```

Update `scoreSite` to accept and forward `opts`:

```js
export function scoreSite(site, observedSet, opts = {}) {
  const expected = expectedFindings(site, opts);
```

(everything else in `scoreSite` unchanged.)

In `src/engine/inverse.js`, thread `opts` through the ranking functions and `solve`:

```js
export function rankSingle(observedSet, opts = {}) {
  return candidateSites()
    .map(site => scoreSite(site, observedSet, opts))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
```

```js
export function minimalSet(observedSet, opts = {}) {
  const needAll = new Set(localisingObserved(observedSet));
  if (needAll.size === 0) return null;

  const sites = candidateSites().map(site => {
    const exp = expectedFindings(site, opts);
    const covers = new Set([...needAll].filter(f => exp.has(f)));
    return { site, exp, covers };
  }).filter(s => s.covers.size > 0);
```

(the rest of `minimalSet` unchanged.)

Update `solve` to resolve and thread `dominantSide` and echo it:

```js
export function solve(observedSet, options = {}) {
  const opts = { dominantSide: options.dominantSide || "left" };
  const single = rankSingle(observedSet, opts);
  const best = single[0] || null;
  const singleExplainsAll = best ? coversAllLocalising(best, observedSet) : false;

  let multi = null;
  if (!singleExplainsAll) {
    const ms = minimalSet(observedSet, opts);
    if (ms && ms.sites.length > 1) multi = ms;
  }

  const level = describeLevel(best, options.sensoryLevel);
  return { single, best, singleExplainsAll, multi, level, dominantSide: opts.dominantSide };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: PASS.

- [ ] **Step 5: Confirm no regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all six suites PASS. (`scoreSite`/`rankSingle`/`minimalSet` default `opts` to `{}` → `expectedFindings` defaults `dominantSide` to `"left"`; adding ids to `LOCALISING` cannot affect inputs that lack them, so the 51 prior tests are unchanged.) Task complete when green.

---

### Task 7: Composite vs primitive emergence (whole-MCA, PCA, quadrantanopias)

**Files:**
- Test: `test/cortex.test.js` (append) — no source changes; this task verifies the scorer already produces the right composite-vs-focal behaviour built in Tasks 4–6.

**Interfaces:**
- Consumes: `solve` (Task 6).
- Produces: nothing new — a behavioural gate on the emergent localisation.

- [ ] **Step 1: Write the failing test**

Append to `test/cortex.test.js`:

```js
// --- Task 7: composite vs focal emergence ---
// Whole-MCA (dominant, global) picture spanning both divisions -> the whole-MCA composite.
{
  const global = new Set(["facial_weak_umn@right","weak_arm@right","aphasia_expressive@none",
    "aphasia_receptive@none","superior_quadrantanopia@right","gerstmann@none","gaze_deviation@left"]);
  const { best } = solve(global);
  ok("global MCA -> left_cortex_mca (whole)", best && best.site.id === "left_cortex_mca");
}
// Isolated homonymous hemianopia -> PCA (occipital is the only hemianopia emitter), not MCA-inferior.
{
  const { best } = solve(new Set(["homonymous_hemianopia@right"]));
  ok("isolated hemianopia -> left_cortex_pca", best && best.site.id === "left_cortex_pca");
}
// Quadrantanopias localise to different lobes and do not collapse.
{
  const sup = solve(new Set(["superior_quadrantanopia@right"])).best;
  const inf = solve(new Set(["inferior_quadrantanopia@right"])).best;
  ok("superior quadrant -> temporal subregion", sup && sup.site.part === "temporal");
  ok("inferior quadrant -> parietal subregion", inf && inf.site.part === "parietal");
  ok("the two field defects localise differently", sup && inf && sup.site.id !== inf.site.id);
}
```

- [ ] **Step 2: Run test to verify it passes (should already pass)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: PASS — these behaviours emerge from Tasks 4–6. If any assertion fails, do NOT add a rule; treat it as a scoring/territory bug and re-derive: check the relevant site's `expectedFindings` (over-prediction penalty vs coverage) against the spec. The intended outcomes: whole-MCA covers both divisions' localisers so it out-covers either single division; PCA is the sole `homonymous_hemianopia` source; `superior_quadrantanopia` comes only from `temporal`, `inferior_quadrantanopia` only from `parietal`.

- [ ] **Step 3: Confirm no regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all six suites PASS. Task complete when green.

---

### Task 8: Bilateral syndromes (Anton, Balint)

**Files:**
- Test: `test/cortex.test.js` (append) — verifies the bilateral-only path from Tasks 4–5.

**Interfaces:**
- Consumes: `solve` (Task 6), `composeBilateralCortexSites` (Task 5).
- Produces: emergence gate for the two bilateral syndromes.

- [ ] **Step 1: Write the failing test**

Append to `test/cortex.test.js`:

```js
// --- Task 8: bilateral syndromes ---
// Anton: cortical blindness (bilateral-only) -> bilateral_occipital; no single occipital explains it.
{
  const { best } = solve(new Set(["cortical_blindness@none"]));
  ok("cortical_blindness -> bilateral_occipital", best && best.site.id === "bilateral_occipital");
}
// Balint: balint_syndrome (bilateral-only) -> bilateral_parietal, not sunk by over-prediction.
{
  const { best } = solve(new Set(["balint_syndrome@none"]));
  ok("balint_syndrome -> bilateral_parietal", best && best.site.id === "bilateral_parietal");
}
// A unilateral occipital picture (isolated hemianopia) must NOT be called Anton.
{
  const { best } = solve(new Set(["homonymous_hemianopia@right"]));
  ok("unilateral hemianopia is not bilateral_occipital", best && best.site.id !== "bilateral_occipital");
}
```

- [ ] **Step 2: Run test to verify it passes (should already pass)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: PASS — `cortical_blindness`/`balint_syndrome` are `bilateralOnly`, so only the bilateral composites emit them; the bilateral emission skips the hemisphere-gated mirror findings, keeping the fit tight enough to survive the over-prediction penalty. If Balint fails with `best === null`, the bilateral site is being sunk by over-prediction — verify the hemisphere gate skips gated structures on bilateral sites (Task 4, `structActiveAt`).

- [ ] **Step 3: Confirm no regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all six suites PASS. Task complete when green.

---

### Task 9: Dominance-aware phonebook (`syndromes.js`)

**Files:**
- Modify: `src/data/syndromes.js`
- Test: `test/cortex.test.js` (append)

**Interfaces:**
- Consumes: `BY_SITE`, `nameForSite` (existing). `solve().dominantSide` (Task 6).
- Produces: `nameForSite(site, opts = {})` — for `cortex` sites, resolves `role = site.side === (opts.dominantSide||"left") ? "dominant" : "nondominant"` (bilateral → `"bilateral"`) and reads a variant entry `{ dominant, nondominant, bilateral? }`; non-cortex entries keep the existing flat shape and behaviour. New cortex + bilateral entries.

- [ ] **Step 1: Write the failing test**

Append to `test/cortex.test.js`:

```js
// --- Task 9: dominance-aware phonebook ---
import { nameForSite } from "../src/data/syndromes.js";
{
  const res = solve(new Set(["neglect@left","anosognosia@none","inferior_quadrantanopia@left"]));
  ok("right parietal names neglect syndrome",
     /neglect/i.test(nameForSite(res.best.site, { dominantSide: res.dominantSide }).name));
}
{
  const res = solve(new Set(["gerstmann@none","inferior_quadrantanopia@right"]));
  ok("left parietal names Gerstmann",
     /gerstmann/i.test(nameForSite(res.best.site, { dominantSide: res.dominantSide }).name));
}
{
  const res = solve(new Set(["cortical_blindness@none"]));
  ok("bilateral occipital names Anton", /anton/i.test(nameForSite(res.best.site).name));
}
{
  const res = solve(new Set(["facial_weak_umn@right","weak_arm@right","aphasia_expressive@none","gaze_deviation@left"]));
  ok("dominant MCA-sup names Broca/MCA",
     /broca|middle cerebral|mca superior/i.test(nameForSite(res.best.site, { dominantSide: res.dominantSide }).name));
}
// non-cortex entries still work (regression on the phonebook signature change)
{
  const res = solve(new Set(["cn3_palsy@left","hemiparesis@right","facial_weak_umn@right"]));
  ok("Weber still names (flat entry unaffected)", /weber/i.test(nameForSite(res.best.site).name));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: FAIL — cortex sites fall through to the generic anatomical fallback (no eponyms), so `/neglect/i`, `/gerstmann/i`, `/anton/i`, `/broca/i` don't match.

- [ ] **Step 3: Make nameForSite dominance-aware and add entries**

In `src/data/syndromes.js`, add cortex entries to `BY_SITE` (variant shape for the ones whose eponym depends on side; flat for the rest). Keyed by `${level}_${part}`:

```js
  // ---- CEREBRAL CORTEX (variant entries: dominant vs non-dominant) ----
  cortex_aca: {
    name: "Anterior cerebral artery (ACA) syndrome",
    note: "Medial hemisphere: contralateral leg-predominant weakness and cortical sensory loss, with abulia/apathy (medial prefrontal). Arm and face relatively spared.",
    ddx: ["ACA infarct", "Parasagittal meningioma or metastasis", "Anterior communicating artery aneurysm", "Superior sagittal sinus thrombosis"],
    red: "Bilateral ACA territory (azygos ACA) causes paraparesis + abulia that can mimic a cord or psychiatric picture — image the vessels."
  },
  cortex_mca_superior: {
    dominant: {
      name: "Dominant MCA superior division syndrome (Broca)",
      note: "Fronto-opercular: contralateral face/arm-predominant weakness, cortical sensory loss, non-fluent (Broca's) aphasia, and conjugate gaze deviation toward the lesion.",
      ddx: ["MCA superior division infarct", "Intracerebral haemorrhage", "Tumour", "Focal seizure with Todd's paresis"],
      red: "A gaze-deviated, aphasic, face/arm-weak patient is a large-vessel stroke until proven otherwise — time-critical."
    },
    nondominant: {
      name: "Non-dominant MCA superior division syndrome",
      note: "Fronto-opercular: contralateral face/arm-predominant weakness and cortical sensory loss with motor aprosodia (flat, unmodulated speech) and gaze deviation toward the lesion.",
      ddx: ["MCA superior division infarct", "Haemorrhage", "Tumour", "Focal seizure"],
      red: "Same large-vessel urgency as the dominant side; the language exam looks deceptively normal."
    }
  },
  cortex_mca_inferior: {
    dominant: {
      name: "Dominant MCA inferior division syndrome (Wernicke)",
      note: "Temporoparietal: fluent (Wernicke's) receptive aphasia, contralateral quadrantanopia, ± Gerstmann features, with little or no weakness.",
      ddx: ["MCA inferior division infarct", "Haemorrhage", "Tumour", "Herpes simplex encephalitis (temporal)"],
      red: "Fluent-but-nonsensical speech without weakness is easily mistaken for delirium/psychiatric — it is a stroke syndrome."
    },
    nondominant: {
      name: "Non-dominant MCA inferior division syndrome (neglect)",
      note: "Temporoparietal: hemispatial neglect, anosognosia, constructional apraxia, sensory aprosodia and a contralateral quadrantanopia, with little or no weakness.",
      ddx: ["MCA inferior division infarct", "Haemorrhage", "Tumour"],
      red: "Dense neglect with anosognosia underestimates the deficit — the patient denies it; corroborate and image."
    }
  },
  cortex_mca: {
    dominant: {
      name: "Complete dominant MCA syndrome (global aphasia)",
      note: "Whole MCA territory: dense contralateral face/arm-predominant hemiparesis and hemisensory loss, global aphasia, homonymous field loss and gaze deviation toward the lesion.",
      ddx: ["Proximal MCA / carotid-T occlusion", "Large intracerebral haemorrhage", "Malignant MCA infarction"],
      red: "Malignant MCA infarction risks fatal oedema — monitor conscious level; consider decompressive hemicraniectomy early."
    },
    nondominant: {
      name: "Complete non-dominant MCA syndrome",
      note: "Whole MCA territory: dense contralateral hemiparesis and hemisensory loss, profound neglect/anosognosia, homonymous field loss and gaze deviation toward the lesion.",
      ddx: ["Proximal MCA / carotid-T occlusion", "Large haemorrhage", "Malignant MCA infarction"],
      red: "Malignant MCA infarction risk as for the dominant side; neglect masks the severity."
    }
  },
  cortex_pca: {
    name: "Posterior cerebral artery (PCA) syndrome",
    note: "Occipital: isolated contralateral homonymous hemianopia (often with macular sparing); minimal other deficit.",
    ddx: ["PCA infarct", "Occipital haemorrhage", "Tumour", "Posterior reversible encephalopathy (PRES)", "Migrainous / seizure aura"],
    red: "An isolated hemianopia is easily missed — confrontation-test fields; consider a posterior-circulation cause."
  },
  cortex_parietal: {
    dominant: {
      name: "Dominant parietal syndrome (Gerstmann)",
      note: "Angular/supramarginal gyrus: agraphia, acalculia, finger agnosia and right–left disorientation, ± inferior quadrantanopia.",
      ddx: ["Infarct (MCA inferior division)", "Tumour (glioma, metastasis)", "Focal seizure", "Neurodegeneration (posterior cortical)"],
      red: "A focal cortical syndrome without weakness still needs imaging — tumour and stroke present identically here."
    },
    nondominant: {
      name: "Non-dominant parietal syndrome (neglect)",
      note: "Hemispatial neglect, anosognosia, constructional apraxia and prosopagnosia, ± inferior quadrantanopia.",
      ddx: ["Infarct (MCA inferior division)", "Tumour", "Focal seizure"],
      red: "Neglect with anosognosia leads patients to deny deficits — corroborate history and examine formally."
    }
  },
  cortex_temporoparietal: {
    dominant: {
      name: "Dominant temporoparietal syndrome (Wernicke's aphasia)",
      note: "Fluent, paraphasic speech with impaired comprehension and repetition; ± quadrantanopia.",
      ddx: ["MCA inferior division infarct", "Tumour", "Herpes simplex encephalitis", "Focal seizure"],
      red: "Acute fluent aphasia can be mistaken for confusion — it is a localising cortical sign."
    },
    nondominant: {
      name: "Non-dominant temporoparietal syndrome (sensory aprosodia)",
      note: "Impaired comprehension of emotional prosody, ± quadrantanopia and neglect features.",
      ddx: ["MCA inferior division infarct", "Tumour", "Focal seizure"],
      red: "Subtle; the deficit is in emotional communication rather than words."
    }
  },
  cortex_medial_pfc: {
    name: "Medial frontal (ACA) behavioural syndrome",
    note: "Apathy / abulia — reduced spontaneous behaviour and initiation, out of proportion to weakness.",
    ddx: ["ACA infarct", "Parasagittal tumour", "Anterior communicating aneurysm rupture", "Normal-pressure hydrocephalus"],
    red: "Abulia is easily labelled 'depression' — an acute-onset case warrants imaging."
  },
  cortex_orbitofrontal: {
    name: "Orbitofrontal syndrome",
    note: "Disinhibition, personality change and irritability with relatively preserved elementary neurology.",
    ddx: ["Orbitofrontal contusion (head injury)", "Subfrontal meningioma", "Frontotemporal dementia", "Anterior communicating aneurysm"],
    red: "Personality change with anosmia suggests a subfrontal mass — image before attributing to psychiatry."
  },
  cortex_temporal: {
    name: "Temporal lobe syndrome",
    note: "Material-specific short-term memory impairment (verbal if dominant, non-verbal if non-dominant), episodic hallucinations/fear or mood change, ± superior quadrantanopia.",
    ddx: ["Temporal tumour", "Herpes simplex encephalitis", "Mesial temporal sclerosis / focal seizures", "MCA inferior division infarct"],
    red: "New olfactory/gustatory hallucinations or episodic fear may be focal seizures — consider EEG and imaging."
  },
  bilateral_occipital: {
    name: "Anton's syndrome (bilateral occipital)",
    note: "Cortical blindness with denial of blindness (visual anosognosia) — pupils and fundi normal, patient confabulates vision.",
    ddx: ["Bilateral PCA infarction (top-of-basilar)", "PRES / eclampsia", "Hypoxic-ischaemic injury", "Bilateral occipital tumour"],
    red: "Top-of-the-basilar embolism is a treatable cause of bilateral occipital stroke — image the posterior circulation urgently."
  },
  bilateral_parietal: {
    name: "Balint's syndrome (bilateral parieto-occipital)",
    note: "Simultanagnosia, optic ataxia and oculomotor apraxia from bilateral parieto-occipital dysfunction.",
    ddx: ["Watershed infarction (bilateral)", "Posterior cortical atrophy", "PRES", "Hypoxic-ischaemic injury"],
    red: "Bilateral watershed infarcts imply global hypoperfusion — look for a cardiac/haemodynamic cause."
  },
```

Replace `nameForSite` with a dominance-aware version (non-cortex behaviour identical to today):

```js
// Recognise the eponym for a chosen site. Falls back to a plain anatomical description.
// For cortex sites the eponym can depend on hemisphere, so an entry may be a
// { dominant, nondominant, bilateral } variant object; resolve by the site side vs dominantSide.
export function nameForSite(site, opts = {}) {
  const key = `${site.level}_${site.part}`;
  const entry = BY_SITE[key];
  const anatomical = `${site.side} ${site.level}, ${site.part}`;
  if (entry) {
    const variant = (entry.dominant || entry.nondominant || entry.bilateral)
      ? (site.side === "bilateral"
          ? (entry.bilateral || entry.dominant)
          : (site.side === (opts.dominantSide || "left") ? entry.dominant : entry.nondominant))
      : entry;
    return { ...variant, anatomical };
  }
  return {
    name: `${site.side} ${site.level} (${site.part})`,
    note: "No eponym for this exact combination — the engine still localises it anatomically.",
    ddx: [], red: null, anatomical
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/cortex.test.js`
Expected: PASS.

- [ ] **Step 5: Confirm no regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all six suites PASS — including the existing brainstem/cord suites that call `nameForSite(site)` with no `opts` (their `BY_SITE` entries are flat, so `variant = entry` and the output is identical to before). Task complete when green.

---

### Task 10: README status line

**Files:**
- Modify: `README.md`
- Test: covered by `npm test` (documentation-only task; folded here as the final deliverable).

**Interfaces:**
- Consumes: nothing. Produces: accurate status text.

- [ ] **Step 1: Update the Running section**

In `README.md`, add the cortex suite to the command list under "## Running":

```
node test/cortex.test.js         # cerebral cortex (lobar map, dominance, Anton/Balint)
```

- [ ] **Step 2: Update the Status paragraph**

In `README.md`, append to the "## Status" section (after the cauda equina / conus sentences), before the "Cortex, cranial nerves..." line — and update that remaining-regions line to drop the cortex:

```
The cerebral cortex now emerges too — organised by lobar subregion (motor/sensory somatotopy, the
dominant↔non-dominant mirror of Broca↔dysprosody, Wernicke↔dysprosody and Gerstmann↔neglect,
plus frontal behavioural and temporal limbic signs and the superior/inferior quadrantanopias), with
vascular territory kept as a separate annotation so ACA/MCA/PCA stroke syndromes emerge as composites
while focal-lobe syndromes localise on their own. Hemispheric dominance is a `solve()` option
(default left), and the bilateral occipital/parietal syndromes (Anton's, Balint's) emerge from
both-hemispheres sites. Subcortex (internal capsule, thalamus, basal ganglia), cranial nerves / skull
base and root→plexus→nerve→muscle are the remaining regions.
```

Change the pre-existing remaining-regions sentence ("Cortex, cranial nerves/skull base and
root→plexus→nerve→muscle are the remaining regions.") to remove "Cortex," since it is now done.

- [ ] **Step 3: Confirm the full suite is green**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all six suites PASS, cortex suite included. Final task complete when green.

---

## Post-implementation (not tasks — do after all 10 are green)

These are follow-ups the increment expects, per the spec's "Modules touched":

1. **Re-sync both Artifacts** — add a Cortex region to the anatomy model (`anatomy-model.html`) and update the flow-diagram coverage strip (`architecture.html`) with a "Cortex" chip; republish each to its existing URL (flow 🧠 `4ea6afce-...`, anatomy 🩻 `6f9562ec-...`).
2. **Update project memory** — extend `neurolocaliser-engine-state.md` with the cortex increment (mechanisms: subregion parts + vascular composites, hemisphere gate + `dominantSide` option, sideless `@none`, bilateral-only Anton/Balint) and bump the test count.

## Self-review notes (addressed in this plan)

- **Spec coverage:** all 26 findings (Task 1), 13 subregions (Task 2), `LEVELS`/`PARTS`/`TERRITORY`/`DIVISION` (Task 3), the four gates (Task 4), both composers (Task 5), `LOCALISING` + `dominantSide` plumbing (Task 6), composite/focal + PCA/quadrant emergence (Task 7), Anton/Balint (Task 8), dominance-aware phonebook + entries (Task 9), README (Task 10). The spec's 11 test scenarios map onto Tasks 1–9's assertions.
- **Type consistency:** `expectedFindings(site, opts)` / `explain(site, opts)` / `scoreSite(site, observedSet, opts)` / `rankSingle(observedSet, opts)` / `minimalSet(observedSet, opts)` / `solve(observedSet, options)` / `nameForSite(site, opts)` — `opts.dominantSide` (string) is threaded consistently; composite site ids are `${side}_cortex_${part}` throughout; `DIVISION`/`NON_LATERALISED` names match across tasks.
- **No git:** per Global Constraints, every "commit" is replaced by "suite green"; no `git` commands are run.
