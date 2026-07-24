# Pupillary Efferent (Parasympathetic) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Model the pupil so the pupil-involving-vs-sparing CN III distinction (aneurysm vs microvascular), the Adie tonic pupil, and Argyll Robertson light-near dissociation all localise.

**Architecture:** An all-new `pupil` level. `cn3_compressive`/`cn3_ischaemic`/`ciliary_ganglion` are lateralised sites (via `buildSites`); `pretectum` (Argyll Robertson) is a bilateral site via a small composer. The compressive-vs-ischaemic distinction emerges from whether the site emits `fixed_dilated_pupil` — no new solver mechanism, and no existing structures change.

**Tech Stack:** Node.js ES modules, zero dependencies. Hand-rolled standalone test scripts (repo convention).

## Global Constraints

- **Node is not on PATH.** Prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`, run from repo root `Code/neurolocaliser-engine/`.
- **No git for this project** (user choice). Each "Checkpoint" runs the suite and confirms green.
- **UK spelling** everywhere.
- **Derive-don't-store:** the phonebook stays keyed by emergent site id.
- **No new solver mechanism:** `forward.js` unchanged; `inverse.js` only registers the new composer; `score.js` only adds 2 findings to `LOCALISING`.
- **Backward compatibility:** all 15 existing suites end green. This is an all-new level with all-new findings and no edits to existing structures, so **no existing-test changes are expected**. If one shifts, use superpowers:systematic-debugging.
- **Spec:** `docs/superpowers/specs/2026-07-13-pupillary-efferent-design.md`. **Sub-project 2 of 3.**

## File Structure

- **Modify** `src/model/findings.js` — 2 findings + 2 `CROSSES` entries.
- **Modify** `src/engine/score.js` — 2 findings into `LOCALISING`.
- **Modify** `src/model/structures.js` — the pupil block (6 structures across 4 parts).
- **Modify** `src/model/sites.js` — `LEVELS` (+pupil), `PARTS` (+3), `TERRITORY` (+4), `composePupilPretectumSites()`.
- **Modify** `src/engine/inverse.js` — import + register `composePupilPretectumSites()`.
- **Modify** `src/data/syndromes.js` — 4 phonebook entries.
- **Create** `test/pupil-efferent.test.js`.
- **Modify** `package.json`, `README.md`.

Run command used throughout (from `Code/neurolocaliser-engine/`):
```
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pupil-efferent.test.js
```

---

### Task 1: New findings + crossing + localising policy

Foundational. Not emitted yet, so all 15 suites stay green.

**Files:** Modify `src/model/findings.js`, `src/engine/score.js`.

**Interfaces:** Produces findings `fixed_dilated_pupil` (`CROSSES:false`), `light_near_dissociation` (`CROSSES:false`); both localising.

- [ ] **Step 1: Add the two findings**

In `src/model/findings.js`, find:

```js
  horner:         { desc: "Horner's syndrome (descending sympathetic)", group: "Autonomic" },
```

Insert immediately BEFORE it:

```js
  fixed_dilated_pupil:     { desc: "Fixed dilated pupil (efferent parasympathetic defect — CN III / ciliary ganglion)", group: "Pupil" },
  light_near_dissociation: { desc: "Light-near dissociation (reacts to near, not light — Adie / Argyll Robertson)", group: "Pupil" },
```

- [ ] **Step 2: Add the two `CROSSES` entries**

In `src/model/findings.js`, in `CROSSES`, find:

```js
  horner: false,           // descending sympathetic -> ipsilateral
```

Insert immediately AFTER it:

```js
  // pupillary efferent (parasympathetic) — the affected eye, ipsilateral; never cross
  fixed_dilated_pupil: false, light_near_dissociation: false,
```

- [ ] **Step 3: Add the two localising findings**

In `src/engine/score.js`, find:

```js
  "bitemporal_hemianopia","rapd","macular_sparing", // visual-pathway localisers (field-defect geometry + RAPD)
```

Insert immediately AFTER it:

```js
  "fixed_dilated_pupil","light_near_dissociation", // pupillary efferent (parasympathetic) localisers
```

- [ ] **Step 4: Checkpoint (no git) — regression stays green**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: 15 suites unchanged (`8`, `5`, `22`, `8`, `8`, `116`, `62`, `65`, `50`, `91`, `103`, `31`, `34`, `62`, `34`) — all `0 failed`.

---

### Task 2: Pupil sites, structures, composer, phonebook, tests

Atomic red→green: the new level + composer + structures + phonebook + suite.

**Files:**
- Create: `test/pupil-efferent.test.js`
- Modify: `src/model/structures.js`, `src/model/sites.js`, `src/engine/inverse.js`, `src/data/syndromes.js`

**Interfaces:**
- Consumes: findings from Task 1; `solve`, `expectedFindings`, `STRUCTURES`, `SITE_BY_ID`, `composePupilPretectumSites`, `nameForSite`.
- Produces: sites `left/right_pupil_cn3_compressive`, `_cn3_ischaemic`, `_ciliary_ganglion` (buildSites) + the bilateral `pupil_pretectum` (composer).

- [ ] **Step 1: Write the failing test**

Create `test/pupil-efferent.test.js`:

```js
// pupil-efferent.test.js — the parasympathetic light-reflex efferent limb. Because the parasympathetic
// fibres run on the SURFACE of CN III, the pupil localises: a compressive lesion (aneurysm/uncal) is
// pupil-INVOLVING (fixed dilated), an ischaemic one is pupil-SPARING. Adie (ciliary ganglion) and Argyll
// Robertson (pretectum) share light-near dissociation, separated by the fixed dilated pupil + laterality.
// Run: node test/pupil-efferent.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { expectedFindings } from "../src/engine/forward.js";
import { SITE_BY_ID, composePupilPretectumSites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const nerveSet = part => STRUCTURES.filter(s => s.level === "pupil" && s.part === part).map(s => s.produces).sort();
const best = set => solve(new Set(set)).best;
const pretectum = () => composePupilPretectumSites().find(s => s.id === "pupil_pretectum");

// --- 1: vocabulary & policy ---
for (const id of ["fixed_dilated_pupil","light_near_dissociation"]) ok(`finding ${id} exists`, isFinding(id));
for (const id of ["fixed_dilated_pupil","light_near_dissociation"]) ok(`${id} does not cross`, CROSSES[id] === false);
for (const id of ["fixed_dilated_pupil","light_near_dissociation"]) ok(`${id} IS localising`, LOCALISING.has(id));
for (const id of ["fixed_dilated_pupil","light_near_dissociation"]) ok(`${id} is lateralised`, !NON_LATERALISED.has(id));

// --- 2: sites & structures ---
ok("left compressive CN III site exists", !!SITE_BY_ID.left_pupil_cn3_compressive);
ok("right ischaemic CN III site exists", !!SITE_BY_ID.right_pupil_cn3_ischaemic);
ok("left ciliary ganglion (Adie) site exists", !!SITE_BY_ID.left_pupil_ciliary_ganglion);
ok("pretectum bilateral site exists", !!pretectum() && pretectum().side === "bilateral");
ok("compressive CN III = cn3_palsy + fixed_dilated_pupil",
   JSON.stringify(nerveSet("cn3_compressive")) === JSON.stringify(["cn3_palsy","fixed_dilated_pupil"].sort()));
ok("ischaemic CN III = cn3_palsy ONLY (pupil-sparing)",
   JSON.stringify(nerveSet("cn3_ischaemic")) === JSON.stringify(["cn3_palsy"]));
ok("Adie = fixed_dilated_pupil + light_near_dissociation, NO cn3_palsy",
   JSON.stringify(nerveSet("ciliary_ganglion")) === JSON.stringify(["fixed_dilated_pupil","light_near_dissociation"].sort()));
ok("pretectum = light_near_dissociation, NO fixed dilated",
   JSON.stringify(nerveSet("pretectum")) === JSON.stringify(["light_near_dissociation"]));

// --- 3: forward emission ---
{
  const cmp = expectedFindings(SITE_BY_ID.left_pupil_cn3_compressive);
  ok("compressive -> cn3_palsy@left + fixed_dilated_pupil@left", cmp.has("cn3_palsy@left") && cmp.has("fixed_dilated_pupil@left"));
  const isch = expectedFindings(SITE_BY_ID.left_pupil_cn3_ischaemic);
  ok("ischaemic -> cn3_palsy@left, NO fixed dilated (pupil-sparing)", isch.has("cn3_palsy@left") && !isch.has("fixed_dilated_pupil@left"));
  const adie = expectedFindings(SITE_BY_ID.left_pupil_ciliary_ganglion);
  ok("Adie -> fixed_dilated_pupil@left + light_near_dissociation@left", adie.has("fixed_dilated_pupil@left") && adie.has("light_near_dissociation@left"));
  const ar = expectedFindings(pretectum());
  ok("pretectum -> light_near_dissociation@left AND @right (bilateral)", ar.has("light_near_dissociation@left") && ar.has("light_near_dissociation@right"));
}

// --- 4: discriminators emerge (via solve) ---
ok("cn3 palsy + fixed dilated pupil -> compressive (aneurysm)",
   best(["cn3_palsy@left","fixed_dilated_pupil@left"]).site.id === "left_pupil_cn3_compressive");
ok("isolated (pupil-sparing) cn3 palsy -> ischaemic (microvascular)",
   best(["cn3_palsy@left"]).site.id === "left_pupil_cn3_ischaemic");
ok("fixed dilated + light-near dissociation, unilateral, no CN III palsy -> Adie",
   best(["fixed_dilated_pupil@left","light_near_dissociation@left"]).site.id === "left_pupil_ciliary_ganglion");
ok("bilateral light-near dissociation -> Argyll Robertson (pretectum)",
   best(["light_near_dissociation@left","light_near_dissociation@right"]).site.id === "pupil_pretectum");
ok("Weber (cn3 + hemiparesis) still localises to the midbrain (bare pupil sites don't steal it)",
   best(["cn3_palsy@left","hemiparesis@right"]).site.id === "left_midbrain_medial");

// --- 5: phonebook ---
ok("compressive names aneurysm / compressive / emergency",
   /aneurysm|compressive|pupil-involving/i.test(nameForSite(best(["cn3_palsy@left","fixed_dilated_pupil@left"]).site).name));
ok("ischaemic names microvascular / ischaemic / pupil-sparing",
   /microvascular|ischaemic|pupil-sparing/i.test(nameForSite(best(["cn3_palsy@left"]).site).name));
ok("Adie names Adie / tonic",
   /adie|tonic/i.test(nameForSite(best(["fixed_dilated_pupil@left","light_near_dissociation@left"]).site).name));
ok("pretectum names Argyll Robertson",
   /argyll|robertson/i.test(nameForSite(best(["light_near_dissociation@left","light_near_dissociation@right"]).site).name));

// ---- report ----
console.log("\nNeuroLocaliser — PUPILLARY EFFERENT (parasympathetic) tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pupil-efferent.test.js`
Expected: FAIL — the pupil sites/structures don't exist yet.

- [ ] **Step 3: Add the pupil structures block**

In `src/model/structures.js`, find the end of the visual-pathway block:

```js
  { id: "lgn_hh",  level: "visual_pathway", part: "lgn", produces: "homonymous_hemianopia",
    note: "lateral geniculate nucleus — contralateral homonymous hemianopia, NO RAPD (post-geniculate for pupils)" },
```

Insert immediately after it:

```js

  // ---- PUPILLARY EFFERENT (parasympathetic light-reflex limb) ----
  // The parasympathetic fibres run on the SURFACE of CN III, so the pupil localises: a compressive lesion
  // (aneurysm/uncal) is pupil-INVOLVING, an ischaemic one is pupil-SPARING. Adie (ciliary ganglion) and
  // Argyll Robertson (pretectum) share light-near dissociation, separated by the fixed dilated pupil +
  // laterality (Adie unilateral tonic-dilated; AR small bilateral). Pretectum is a BILATERAL site.
  { id: "cmp_cn3",   level: "pupil", part: "cn3_compressive", produces: "cn3_palsy",
    note: "CN III trunk (subarachnoid) — compressive palsy (PCOM aneurysm / uncal herniation)" },
  { id: "cmp_pupil", level: "pupil", part: "cn3_compressive", produces: "fixed_dilated_pupil",
    note: "surface parasympathetic fibres compressed first — pupil-INVOLVING (surgical emergency)" },
  { id: "isch_cn3",  level: "pupil", part: "cn3_ischaemic", produces: "cn3_palsy",
    note: "CN III trunk — microvascular ischaemia (diabetes/hypertension); core hit, surface SPARED → pupil-sparing" },
  { id: "cg_pupil",  level: "pupil", part: "ciliary_ganglion", produces: "fixed_dilated_pupil",
    note: "ciliary ganglion (postganglionic parasympathetic) — dilated pupil (Adie)" },
  { id: "cg_lnd",    level: "pupil", part: "ciliary_ganglion", produces: "light_near_dissociation",
    note: "Adie tonic pupil — light-near dissociation (near response preserved, tonic re-dilation)" },
  { id: "ar_lnd",    level: "pupil", part: "pretectum", produces: "light_near_dissociation",
    note: "pretectum / dorsal midbrain (light-reflex relay) — Argyll Robertson (small bilateral, light-near dissociation)" },
```

- [ ] **Step 4: Register the level, parts, territory + the composer**

In `src/model/sites.js`, replace:

```js
const LEVELS = ["midbrain", "pons", "medulla", "cord", "cortex", "subcortex", "skull_base", "root", "nerve", "visual_pathway"];
```

with:

```js
const LEVELS = ["midbrain", "pons", "medulla", "cord", "cortex", "subcortex", "skull_base", "root", "nerve", "visual_pathway", "pupil"];
```

In `src/model/sites.js`, replace:

```js
  "optic_tract", "lgn"];
```

with (add the three lateralised pupil parts; `pretectum` is intentionally NOT here — composer only):

```js
  "optic_tract", "lgn",
  "cn3_compressive", "cn3_ischaemic", "ciliary_ganglion"];
```

In `src/model/sites.js`, replace:

```js
  "visual_pathway|lgn":         "lateral geniculate nucleus (thalamus)"
};
```

with:

```js
  "visual_pathway|lgn":         "lateral geniculate nucleus (thalamus)",
  "pupil|cn3_compressive": "CN III (subarachnoid) — compressive (PCOM aneurysm / uncal herniation)",
  "pupil|cn3_ischaemic":   "CN III trunk — microvascular ischaemia (diabetes / hypertension)",
  "pupil|ciliary_ganglion":"ciliary ganglion (postganglionic parasympathetic — Adie)",
  "pupil|pretectum":       "pretectum / dorsal midbrain (light-reflex relay — Argyll Robertson)"
};
```

In `src/model/sites.js`, find the end of `composeVisualPathwaySites`:

```js
  return structures.length ? [{ id: "visual_pathway_chiasm", side: "midline", level: "visual_pathway",
    part: "chiasm", territory: TERRITORY["visual_pathway|chiasm"], structures, composite: true }] : [];
}
```

Insert immediately after that closing `}`:

```js

// Argyll Robertson pupils are BILATERAL (a dorsal-midbrain/pretectal lesion affects both eyes), so the
// pretectum is a bilateral site (emits light-near dissociation on both sides) — like the motor-unit /
// polyneuropathy bilateral sites. The other pupil sites are ordinary lateralised sites (buildSites).
export function composePupilPretectumSites() {
  const structures = STRUCTURES.filter(s => s.level === "pupil" && s.part === "pretectum").map(s => s.id);
  return structures.length ? [{ id: "pupil_pretectum", side: "bilateral", level: "pupil",
    part: "pretectum", territory: TERRITORY["pupil|pretectum"], structures, composite: true }] : [];
}
```

- [ ] **Step 5: Register the composer in the solver**

In `src/engine/inverse.js`, replace:

```js
         composePlexusSites, composeVisualPathwaySites } from "../model/sites.js";
```

with:

```js
         composePlexusSites, composeVisualPathwaySites, composePupilPretectumSites } from "../model/sites.js";
```

In `src/engine/inverse.js`, replace:

```js
          ...composePolyneuropathySites(), ...composePlexusSites(), ...composeVisualPathwaySites()];
}
```

with:

```js
          ...composePolyneuropathySites(), ...composePlexusSites(), ...composeVisualPathwaySites(),
          ...composePupilPretectumSites()];
}
```

- [ ] **Step 6: Add the phonebook entries**

In `src/data/syndromes.js`, find the `visual_pathway_lgn:` entry (the last entry) and replace its terminal `}` (no trailing comma) so the four pupil entries follow. Specifically, replace:

```js
  visual_pathway_lgn: { name: "Lateral geniculate lesion", note: "Contralateral (often incongruous / sectoranopic) homonymous hemianopia with NO RAPD; look for thalamic sensory company (choroidal blood supply).", ddx: ["Anterior/posterior choroidal artery infarct", "Tumour", "Demyelination"], red: "A wedge/sectoranopia with thalamic sensory signs points to the lateral geniculate." }
```

with:

```js
  visual_pathway_lgn: { name: "Lateral geniculate lesion", note: "Contralateral (often incongruous / sectoranopic) homonymous hemianopia with NO RAPD; look for thalamic sensory company (choroidal blood supply).", ddx: ["Anterior/posterior choroidal artery infarct", "Tumour", "Demyelination"], red: "A wedge/sectoranopia with thalamic sensory signs points to the lateral geniculate." },
  pupil_cn3_compressive: { name: "Compressive (pupil-involving) CN III palsy", note: "A CN III palsy WITH a fixed dilated pupil — the surface parasympathetic fibres are compressed first.", ddx: ["Posterior communicating artery aneurysm", "Uncal herniation", "Tumour / cavernous mass"], red: "A fixed dilated pupil with a third-nerve palsy is a SURGICAL EMERGENCY — image the vessels (CTA/MRA) for an aneurysm now." },
  pupil_cn3_ischaemic: { name: "Ischaemic (pupil-sparing) CN III palsy", note: "A CN III palsy that SPARES the pupil — the core is infarcted (vasa nervorum) but the surface parasympathetic fibres survive; typically microvascular.", ddx: ["Diabetic / hypertensive microvascular infarct", "Giant cell arteritis", "Migraine"], red: "Pupil-sparing is reassuring, but recheck the pupil over days and review vascular risk (and ESR/CRP for GCA)." },
  pupil_ciliary_ganglion: { name: "Adie (tonic) pupil", note: "A dilated pupil with light-near dissociation and slow tonic re-dilation from a ciliary-ganglion (postganglionic parasympathetic) lesion; with absent deep-tendon reflexes it is Holmes-Adie.", ddx: ["Post-viral / idiopathic ciliary ganglionitis", "Orbital trauma / surgery", "Autonomic neuropathy"], red: "Benign — but confirm with dilute pilocarpine (denervation supersensitivity) and exclude an efferent CN III cause." },
  pupil_pretectum: { name: "Argyll Robertson pupils", note: "Small, irregular, bilateral pupils with light-near dissociation (accommodate but do not react to light) from a dorsal-midbrain / pretectal lesion.", ddx: ["Neurosyphilis (classic)", "Diabetes", "Dorsal midbrain lesion"], red: "Bilateral light-near dissociation warrants syphilis serology and a look at the dorsal midbrain." }
```

- [ ] **Step 7: Run the new suite to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/pupil-efferent.test.js`
Expected: PASS — `29 passed, 0 failed`.

- [ ] **Step 8: Checkpoint (no git) — full regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: the 15 existing suites green (unchanged). `pupil-efferent.test.js` is not yet in the chain (Task 3). If a test shifts, use superpowers:systematic-debugging.

---

### Task 3: Wire-up — test script & README

**Files:** Modify `package.json` (the `scripts.test` line), `README.md` (Running + Status).

**Interfaces:** Consumes `test/pupil-efferent.test.js`; produces `npm test` running all 16 suites.

- [ ] **Step 1: Update the test script**

In `package.json`, replace the tail of the `scripts.test` chain:

```json
 && node test/visual-pathway.test.js"
```

with:

```json
 && node test/visual-pathway.test.js && node test/pupil-efferent.test.js"
```

- [ ] **Step 2: Run the whole suite via npm**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: 16 blocks, the last being `29 passed, 0 failed`, exit code 0.

- [ ] **Step 3: Update the README — Running list**

In `README.md`, under `## Running`, add after the `node test/visual-pathway.test.js …` line:

```
node test/pupil-efferent.test.js # pupillary efferent — CN III pupil-involving/sparing, Adie, Argyll Robertson
```

- [ ] **Step 4: Update the README — Status paragraph**

In `README.md`, find the sentence (inside the visual-pathway paragraph):

```
The pupillary efferent limb (CN III, Adie,
light-near dissociation) and the sympathetic/Horner localising axis are the remaining pieces, followed by
a pathology layer (ALS and friends).
```

Replace it with:

```
The pupillary efferent (parasympathetic) limb now localises too: because the light-reflex fibres run on
the surface of the third nerve, a CN III palsy WITH a fixed dilated pupil is compressive (aneurysm — a
surgical emergency) while a pupil-sparing one is ischaemic (microvascular); an isolated tonic dilated
pupil with light-near dissociation is an Adie (ciliary ganglion) pupil, and small bilateral pupils with
light-near dissociation are Argyll Robertson (dorsal midbrain). The sympathetic/Horner three-order
localising axis is the remaining piece of this region, followed by a pathology layer (ALS and friends).
```

- [ ] **Step 5: Checkpoint (no git)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 16 suites green, exit 0.

---

### Post-plan (orchestrator, not a subagent step)

After Task 3 is green: refresh project memory (`neurolocaliser-engine-state`) — pupillary efferent sub-project 2 done (new `pupil` level; compressive-vs-ischaemic CN III via `fixed_dilated_pupil`; Adie at ciliary ganglion; Argyll Robertson at a bilateral pretectum composer; `light_near_dissociation`), new counts (16 suites, 728 assertions = prior 699 + 29). Sub-project 3 (Horner 3-order axis) is the last pending piece of the region. Artifact sync stays deferred.

## Self-Review

**Spec coverage:**
- 2 findings + `CROSSES` → Task 1 Steps 1–2. ✓
- 2 → `LOCALISING` → Task 1 Step 3. ✓
- `pupil` level: cn3_compressive/cn3_ischaemic/ciliary_ganglion (buildSites) + pretectum (bilateral composer) → Task 2 Steps 3–4. ✓
- Composer registered → Task 2 Step 5. ✓
- Phonebook (4) → Task 2 Step 6. ✓
- Discriminators (compressive, ischaemic, Adie, Argyll Robertson) + Weber guard → new suite §4. ✓
- Wire-up → Task 3. ✓
- Out-of-scope (Horner axis, midbrain-fascicle pupil detail, pharmacology) → no tasks (sub-project 3). ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step states the exact command and expected output. ✓

**Type consistency:** finding ids identical across findings/structures/score/tests; site ids `left/right_pupil_<part>` (buildSites) and `pupil_pretectum` (composer, `side:"bilateral"`) match the phonebook keys `pupil_<part>`; `cn3_palsy` reused (unchanged); compressive emits `[cn3_palsy, fixed_dilated_pupil]`, ischaemic `[cn3_palsy]`, Adie `[fixed_dilated_pupil, light_near_dissociation]`, pretectum `[light_near_dissociation]` — matching the §2 exact-set checks. New-suite tally: §1 = 2+2+2+2 = 8, §2 = 8, §3 = 4, §4 = 5, §5 = 4 → **total 29** (matches Task 2 Step 7 and Task 3 Step 2). Grand total 699 + 29 = 728.
