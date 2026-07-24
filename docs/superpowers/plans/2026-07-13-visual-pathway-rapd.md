# Visual Pathway + Afferent RAPD — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the middle of the visual pathway (chiasm, optic tract, LGN) so the field-defect geometry localises, and add the afferent RAPD — the sign that separates the pre-geniculate stations from the rest.

**Architecture:** New `visual_pathway` level with `optic_tract`/`lgn` sites (via `buildSites`) and a `chiasm` midline site (via a small composer, like cauda/conus). RAPD is added to the existing optic-nerve (optic canal) site and the optic tract; `macular_sparing` is added to the occipital cortex. All localisation emerges from the existing scorer — no forward/inverse/score-mechanism change (only the `LOCALISING` set grows).

**Tech Stack:** Node.js ES modules, zero dependencies. Hand-rolled standalone test scripts (repo convention).

## Global Constraints

- **Node is not on PATH.** Prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`, run from repo root `Code/neurolocaliser-engine/`.
- **No git for this project** (user choice). Each "Checkpoint" runs the suite and confirms green.
- **UK spelling** everywhere (e.g. "localise").
- **Derive-don't-store:** the phonebook stays keyed by emergent site id; no syndrome as an `if` rule.
- **No new solver mechanism:** `forward.js` unchanged; `inverse.js` changes only to register the new composer; `score.js` changes only to add 3 findings to `LOCALISING`.
- **Backward compatibility:** all 14 existing suites end green. `macular_sparing` on occipital shifts a *bare* featureless HH off occipital to the retrochiasmal (LGN/deep-radiation) tie — the three affected occipital-HH tests are updated as part of this increment. If anything else shifts, use superpowers:systematic-debugging.
- **Spec:** `docs/superpowers/specs/2026-07-13-visual-pathway-rapd-design.md`. **Sub-project 1 of 3.**

## File Structure

- **Modify** `src/model/findings.js` — 3 findings + 3 `CROSSES` entries.
- **Modify** `src/engine/score.js` — 3 findings into `LOCALISING`.
- **Modify** `src/model/structures.js` — `opt_rapd` (optic canal), `ctx_macular` (occipital), and the visual-pathway block (chiasm/optic_tract/lgn).
- **Modify** `src/model/sites.js` — `LEVELS` (+visual_pathway), `PARTS` (+optic_tract,+lgn), `TERRITORY` (+3), and `composeVisualPathwaySites()`.
- **Modify** `src/engine/inverse.js` — import + register `composeVisualPathwaySites()` in `candidateSites`.
- **Modify** `src/data/syndromes.js` — 3 phonebook entries.
- **Modify** `test/cortex.test.js`, `test/subcortex.test.js` — 3 occipital-HH updates.
- **Create** `test/visual-pathway.test.js`.
- **Modify** `package.json`, `README.md`.

Run command used throughout (from `Code/neurolocaliser-engine/`):
```
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/visual-pathway.test.js
```

---

### Task 1: New findings + crossing + localising policy

Foundational. `rapd`/`bitemporal_hemianopia` aren't emitted yet, and `macular_sparing` isn't attached to any structure yet, so all 14 suites stay green after this task.

**Files:** Modify `src/model/findings.js`, `src/engine/score.js`.

**Interfaces:** Produces findings `bitemporal_hemianopia` (`CROSSES:false`), `rapd` (`CROSSES:false` default), `macular_sparing` (`CROSSES:true`); all three localising.

- [ ] **Step 1: Add the three findings**

In `src/model/findings.js`, find:

```js
  homonymous_hemianopia:   { desc: "Homonymous hemianopia (± macular sparing)", group: "Cortical" },
```

Insert immediately after it:

```js
  bitemporal_hemianopia:   { desc: "Bitemporal hemianopia (optic chiasm — decussating nasal fibres)", group: "Visual pathway" },
  rapd:                    { desc: "Relative afferent pupillary defect (RAPD — optic nerve / optic tract)", group: "Visual pathway" },
  macular_sparing:         { desc: "Macular sparing (occipital / PCA hallmark of a homonymous hemianopia)", group: "Visual pathway" },
```

- [ ] **Step 2: Add the three `CROSSES` entries**

In `src/model/findings.js`, in `CROSSES`, find:

```js
  neglect: true, homonymous_hemianopia: true, superior_quadrantanopia: true, inferior_quadrantanopia: true,
```

Insert immediately after it:

```js
  // visual pathway: bitemporal is midline; RAPD is ipsilateral at the optic nerve (the optic-tract
  // structure overrides crosses:true → contralateral); macular sparing rides the hemianopia (contra).
  bitemporal_hemianopia: false, rapd: false, macular_sparing: true,
```

- [ ] **Step 3: Add the three localising findings**

In `src/engine/score.js`, find:

```js
  "homonymous_hemianopia","superior_quadrantanopia","inferior_quadrantanopia",
```

Insert immediately after it:

```js
  "bitemporal_hemianopia","rapd","macular_sparing", // visual-pathway localisers (field-defect geometry + RAPD)
```

- [ ] **Step 4: Checkpoint (no git) — regression stays green**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: 14 suites unchanged (`8`, `5`, `22`, `8`, `8`, `116`, `62`, `65`, `50`, `91`, `103`, `31`, `34`, `62`) — all `0 failed`.

---

### Task 2: Visual-pathway sites, structures, composer, phonebook, tests

Atomic: registering the level + composer, attaching RAPD/macular-sparing, and updating the occipital-HH tests land together as one red→green cycle.

**Files:**
- Create: `test/visual-pathway.test.js`
- Modify: `src/model/structures.js`, `src/model/sites.js`, `src/engine/inverse.js`, `src/data/syndromes.js`, `test/cortex.test.js`, `test/subcortex.test.js`

**Interfaces:**
- Consumes: findings from Task 1; `solve`, `expectedFindings`, `STRUCTURES`, `SITE_BY_ID`, `composeVisualPathwaySites`, `nameForSite`.
- Produces: sites `left/right_visual_pathway_optic_tract`, `left/right_visual_pathway_lgn`, and the midline `visual_pathway_chiasm` (via `composeVisualPathwaySites()`); `rapd` at `skull_base/optic_canal` + `visual_pathway/optic_tract`; `macular_sparing` at `cortex/occipital`.

- [ ] **Step 1: Write the failing test**

Create `test/visual-pathway.test.js`:

```js
// visual-pathway.test.js — the visual pathway as a field-defect-geometry localiser + afferent RAPD.
// Pupil (afferent) fibres leave the pathway at the optic TRACT, so an RAPD accompanies the optic nerve
// and optic tract but NOT the LGN/radiation/occipital — it separates pre- from post-geniculate. The
// chiasm (bitemporal, midline) is the one genuinely new finding + site; the rest reuse HH.
// Run: node test/visual-pathway.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { expectedFindings } from "../src/engine/forward.js";
import { SITE_BY_ID, composeVisualPathwaySites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const producesAt = (level, part, f) => STRUCTURES.some(s => s.level === level && s.part === part && s.produces === f);
const best = set => solve(new Set(set)).best;
const chiasm = () => composeVisualPathwaySites().find(s => s.id === "visual_pathway_chiasm");

// --- 1: vocabulary & policy ---
for (const id of ["bitemporal_hemianopia","rapd","macular_sparing"]) ok(`finding ${id} exists`, isFinding(id));
ok("bitemporal_hemianopia does not cross (midline)", CROSSES.bitemporal_hemianopia === false);
ok("rapd does not cross by default (optic nerve ipsi)", CROSSES.rapd === false);
ok("macular_sparing crosses (contra, like HH)", CROSSES.macular_sparing === true);
for (const id of ["bitemporal_hemianopia","rapd","macular_sparing"]) ok(`${id} IS localising`, LOCALISING.has(id));
for (const id of ["bitemporal_hemianopia","rapd","macular_sparing"]) ok(`${id} is lateralised`, !NON_LATERALISED.has(id));

// --- 2: sites & structures ---
ok("left optic tract site exists", !!SITE_BY_ID.left_visual_pathway_optic_tract);
ok("right LGN site exists", !!SITE_BY_ID.right_visual_pathway_lgn);
ok("chiasm midline site exists", !!chiasm() && chiasm().side === "midline");
ok("optic canal now produces rapd", producesAt("skull_base","optic_canal","rapd"));
ok("occipital now produces macular_sparing", producesAt("cortex","occipital","macular_sparing"));
ok("optic tract produces rapd (afferent)", producesAt("visual_pathway","optic_tract","rapd"));
ok("LGN does NOT produce rapd (post-geniculate for pupils)", !producesAt("visual_pathway","lgn","rapd"));

// --- 3: forward emission ---
{
  ok("chiasm -> bitemporal_hemianopia@midline", expectedFindings(chiasm()).has("bitemporal_hemianopia@midline"));
  const ot = expectedFindings(SITE_BY_ID.left_visual_pathway_optic_tract);
  ok("left optic tract -> homonymous_hemianopia@right (contra)", ot.has("homonymous_hemianopia@right"));
  ok("left optic tract -> rapd@right (contra)", ot.has("rapd@right"));
  const lgn = expectedFindings(SITE_BY_ID.left_visual_pathway_lgn);
  ok("left LGN -> homonymous_hemianopia@right", lgn.has("homonymous_hemianopia@right"));
  ok("left LGN -> NO rapd", !lgn.has("rapd@right") && !lgn.has("rapd@left"));
  const oc = expectedFindings(SITE_BY_ID.left_skull_base_optic_canal);
  ok("left optic canal -> optic_neuropathy@left + rapd@left (ipsi)", oc.has("optic_neuropathy@left") && oc.has("rapd@left"));
  const occ = expectedFindings(SITE_BY_ID.left_cortex_occipital);
  ok("left occipital -> macular_sparing@right (contra)", occ.has("macular_sparing@right"));
}

// --- 4: discriminators emerge (via solve) ---
ok("monocular loss + ipsi RAPD -> optic nerve (optic canal)",
   best(["optic_neuropathy@left","rapd@left"]).site.id === "left_skull_base_optic_canal");
ok("bitemporal hemianopia -> chiasm",
   best(["bitemporal_hemianopia@midline"]).site.id === "visual_pathway_chiasm");
ok("HH + contra RAPD -> optic tract",
   best(["homonymous_hemianopia@right","rapd@right"]).site.id === "left_visual_pathway_optic_tract");
ok("HH + macular sparing -> occipital / PCA",
   ["left_cortex_occipital","left_cortex_pca"].includes(best(["homonymous_hemianopia@right","macular_sparing@right"]).site.id));
{
  const b = best(["homonymous_hemianopia@right"]);
  ok("bare HH -> a retrochiasmal RAPD-negative site (LGN / deep radiation / occipital)",
     ["left_visual_pathway_lgn","left_subcortex_optic_radiation","left_cortex_occipital","left_cortex_pca"].includes(b.site.id));
  ok("bare HH is NOT the optic tract (no RAPD)", b.site.id !== "left_visual_pathway_optic_tract");
}

// --- 5: phonebook ---
ok("chiasm names parasellar / chiasm / bitemporal",
   /chiasm|parasellar|pituitary|bitemporal/i.test(nameForSite(best(["bitemporal_hemianopia@midline"]).site).name));
ok("optic tract names the tract",
   /optic tract|tract/i.test(nameForSite(best(["homonymous_hemianopia@right","rapd@right"]).site).name));

// ---- report ----
console.log("\nNeuroLocaliser — VISUAL PATHWAY + RAPD tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/visual-pathway.test.js`
Expected: FAIL — the visual-pathway sites/structures don't exist yet.

- [ ] **Step 3: Add the RAPD structure at the optic canal**

In `src/model/structures.js`, find:

```js
  { id: "opt_cn2",  level: "skull_base", part: "optic_canal", produces: "optic_neuropathy",
    note: "optic nerve (II) in the optic canal — the orbital-apex discriminator (monocular visual loss)" },
```

Insert immediately after it:

```js
  { id: "opt_rapd", level: "skull_base", part: "optic_canal", produces: "rapd",
    note: "optic nerve (II) — afferent pupillary defect (RAPD), ipsilateral; the afferent limb of the light reflex" },
```

- [ ] **Step 4: Add the macular-sparing structure at the occipital cortex**

In `src/model/structures.js`, find:

```js
  { id: "ctx_visual_cortex", level: "cortex", part: "occipital", produces: "homonymous_hemianopia",
    note: "primary visual cortex — PCA territory" },
```

Insert immediately after it:

```js
  { id: "ctx_macular", level: "cortex", part: "occipital", produces: "macular_sparing",
    note: "occipital pole (dual MCA/PCA supply) — macular sparing, the PCA-occipital hallmark" },
```

- [ ] **Step 5: Add the visual-pathway structures block**

In `src/model/structures.js`, find:

```js
  { id: "optic_rad", level: "subcortex", part: "optic_radiation", produces: "homonymous_hemianopia",
    note: "deep optic radiation (retrolenticular/anterior choroidal) — hemianopia with NO cortical signs" },
```

Insert immediately after it:

```js

  // ---- VISUAL PATHWAY (chiasm → optic tract → LGN; optic nerve is the skull-base optic canal, the
  // radiation is subcortex/temporal/parietal, the terminus is occipital cortex). Field-defect geometry
  // localises. RAPD (afferent) rides the optic nerve + optic tract only — pupil fibres leave at the
  // tract — so it separates pre- from post-geniculate. Chiasm is a MIDLINE site (composeVisualPathwaySites).
  { id: "chiasm_bitemp", level: "visual_pathway", part: "chiasm", produces: "bitemporal_hemianopia", crosses: false,
    note: "optic chiasm — decussating nasal fibres → bitemporal hemianopia (pituitary/parasellar), midline" },
  { id: "ot_hh",   level: "visual_pathway", part: "optic_tract", produces: "homonymous_hemianopia",
    note: "optic tract — contralateral (incongruous) homonymous hemianopia" },
  { id: "ot_rapd", level: "visual_pathway", part: "optic_tract", produces: "rapd", crosses: true,
    note: "optic tract — contralateral RAPD (afferent fibres still present → the pre-geniculate marker)" },
  { id: "lgn_hh",  level: "visual_pathway", part: "lgn", produces: "homonymous_hemianopia",
    note: "lateral geniculate nucleus — contralateral homonymous hemianopia, NO RAPD (post-geniculate for pupils)" },
```

- [ ] **Step 6: Register the level, parts, territory + the composer**

In `src/model/sites.js`, replace:

```js
const LEVELS = ["midbrain", "pons", "medulla", "cord", "cortex", "subcortex", "skull_base", "root", "nerve"];
```

with:

```js
const LEVELS = ["midbrain", "pons", "medulla", "cord", "cortex", "subcortex", "skull_base", "root", "nerve", "visual_pathway"];
```

In `src/model/sites.js`, find (the tail of `PARTS`):

```js
  "peroneal_common", "peroneal_deep", "peroneal_superficial", "tibial"];
```

replace with (add the two lateralised visual-pathway parts; `chiasm` is intentionally NOT here — it is built only by the composer, like the cord `central` part):

```js
  "peroneal_common", "peroneal_deep", "peroneal_superficial", "tibial",
  "optic_tract", "lgn"];
```

In `src/model/sites.js`, find:

```js
  "nerve|tibial":           "tibial nerve (L4-S3)"
};
```

replace with:

```js
  "nerve|tibial":           "tibial nerve (L4-S3)",
  "visual_pathway|chiasm":      "optic chiasm (parasellar / suprasellar — pituitary, craniopharyngioma)",
  "visual_pathway|optic_tract": "optic tract (post-chiasmal, pre-geniculate)",
  "visual_pathway|lgn":         "lateral geniculate nucleus (thalamus)"
};
```

In `src/model/sites.js`, find the end of `composeCaudaConusSites`:

```js
  return [ ...build("cauda_equina", "cauda", "equina"),
           ...build("conus_medullaris", "conus", "medullaris") ];
}
```

Insert immediately after that closing `}`:

```js

// The optic CHIASM is a MIDLINE site (bitemporal hemianopia has no side) — built like the cauda/conus
// midline sites. The optic tract and LGN are ordinary lateralised sites (buildSites handles them).
export function composeVisualPathwaySites() {
  const structures = STRUCTURES.filter(s => s.level === "visual_pathway" && s.part === "chiasm").map(s => s.id);
  return structures.length ? [{ id: "visual_pathway_chiasm", side: "midline", level: "visual_pathway",
    part: "chiasm", territory: TERRITORY["visual_pathway|chiasm"], structures, composite: true }] : [];
}
```

- [ ] **Step 7: Register the composer in the solver**

In `src/engine/inverse.js`, replace the import block:

```js
import { SITES, composeHemiLevelSites, composeBilateralCordSites, composeCaudaConusSites,
         composeVascularCortexSites, composeBilateralCortexSites, composeDeepVascularSites,
         composeSkullBaseSites, composeMotorUnitSites, composePolyneuropathySites,
         composePlexusSites } from "../model/sites.js";
```

with:

```js
import { SITES, composeHemiLevelSites, composeBilateralCordSites, composeCaudaConusSites,
         composeVascularCortexSites, composeBilateralCortexSites, composeDeepVascularSites,
         composeSkullBaseSites, composeMotorUnitSites, composePolyneuropathySites,
         composePlexusSites, composeVisualPathwaySites } from "../model/sites.js";
```

In `src/engine/inverse.js`, find the end of `candidateSites`:

```js
          ...composePolyneuropathySites(), ...composePlexusSites()];
}
```

replace with:

```js
          ...composePolyneuropathySites(), ...composePlexusSites(), ...composeVisualPathwaySites()];
}
```

- [ ] **Step 8: Add the phonebook entries**

In `src/data/syndromes.js`, find the `nerve_tibial:` entry (the last nerve entry) and insert these three entries immediately after it (inside `BY_SITE`, before the closing `};`):

```js
  visual_pathway_chiasm: { name: "Chiasmal (parasellar) lesion", note: "Bitemporal hemianopia from compression of the decussating nasal fibres at the optic chiasm.", ddx: ["Pituitary macroadenoma (from below)", "Craniopharyngioma (from above)", "Meningioma", "Internal carotid aneurysm"], red: "Bitemporal field loss with headache or endocrine change — image the sella; acuity/colour loss or apoplexy are emergencies." },
  visual_pathway_optic_tract: { name: "Optic tract lesion", note: "Contralateral incongruous homonymous hemianopia WITH a relative afferent pupillary defect (the pupil fibres are still in the tract).", ddx: ["Craniopharyngioma / parasellar tumour", "Anterior/posterior choroidal infarct", "Demyelination"], red: "A homonymous hemianopia WITH an RAPD localises to the optic tract (pre-geniculate), not the occipital cortex." },
  visual_pathway_lgn: { name: "Lateral geniculate lesion", note: "Contralateral (often incongruous / sectoranopic) homonymous hemianopia with NO RAPD; look for thalamic sensory company (choroidal blood supply).", ddx: ["Anterior/posterior choroidal artery infarct", "Tumour", "Demyelination"], red: "A wedge/sectoranopia with thalamic sensory signs points to the lateral geniculate." },
```

- [ ] **Step 9: Update the occipital-HH tests (macular-sparing consequence)**

In `test/cortex.test.js`, replace:

```js
ok("occipital -> hemianopia+anton", eq(cortexOf("occipital"), ["cortical_blindness","homonymous_hemianopia"].sort()));
```

with:

```js
ok("occipital -> hemianopia+anton+macular sparing", eq(cortexOf("occipital"), ["cortical_blindness","homonymous_hemianopia","macular_sparing"].sort()));
```

In `test/cortex.test.js`, replace:

```js
  const res = solve(new Set(["homonymous_hemianopia@right"]));
  ok("isolated hemianopia names PCA", /posterior cerebral|pca/i.test(nameForSite(res.best.site, { dominantSide: res.dominantSide }).name));
```

with (macular sparing makes it the occipital/PCA picture):

```js
  const res = solve(new Set(["homonymous_hemianopia@right","macular_sparing@right"]));
  ok("hemianopia with macular sparing names PCA", /posterior cerebral|pca/i.test(nameForSite(res.best.site, { dominantSide: res.dominantSide }).name));
```

In `test/subcortex.test.js`, replace:

```js
  const { single, best } = solve(new Set(["homonymous_hemianopia@right"]));
  ok("isolated hemianopia still resolves to occipital/PCA as best",
     best && (best.site.id === "left_cortex_occipital" || best.site.id === "left_cortex_pca"));
```

with (a bare RAPD-negative HH is now retrochiasmal-unspecified — LGN / deep radiation / occipital):

```js
  const { single, best } = solve(new Set(["homonymous_hemianopia@right"]));
  ok("isolated (RAPD-negative) hemianopia resolves to a retrochiasmal site (deep radiation / LGN / occipital)",
     best && ["left_subcortex_optic_radiation","left_visual_pathway_lgn","left_cortex_occipital","left_cortex_pca"].includes(best.site.id));
```

- [ ] **Step 10: Run the new suite to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/visual-pathway.test.js`
Expected: PASS — `34 passed, 0 failed`.

- [ ] **Step 11: Checkpoint (no git) — full regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: the 14 existing suites green (cortex still 116, subcortex still 62 after the updates). `visual-pathway.test.js` is not yet in the chain (Task 3). If a non-occipital test shifts, use superpowers:systematic-debugging (check `rankSingle`); do NOT weaken a `LOCALISING` weight to force it.

---

### Task 3: Wire-up — test script & README

**Files:** Modify `package.json` (the `scripts.test` line), `README.md` (Running + Status).

**Interfaces:** Consumes `test/visual-pathway.test.js`; produces `npm test` running all 15 suites.

- [ ] **Step 1: Update the test script**

In `package.json`, replace the tail of the `scripts.test` chain:

```json
 && node test/tone.test.js && node test/nerve-segments.test.js"
```

with:

```json
 && node test/tone.test.js && node test/nerve-segments.test.js && node test/visual-pathway.test.js"
```

- [ ] **Step 2: Run the whole suite via npm**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: 15 blocks, the last being `34 passed, 0 failed`, exit code 0.

- [ ] **Step 3: Update the README — Running list**

In `README.md`, under `## Running`, add after the `node test/nerve-segments.test.js …` line:

```
node test/visual-pathway.test.js # visual pathway (chiasm/tract/LGN) + afferent RAPD
```

- [ ] **Step 4: Update the README — Status paragraph**

In `README.md`, find the line:

```
The visual pathway (chiasm onward) and a pathology layer (ALS and friends) are the remaining pieces.
```

Replace it with:

```
The visual pathway now emerges as a field-defect-geometry localiser: the chiasm (bitemporal hemianopia,
a parasellar/pituitary lesion), the optic tract and lateral geniculate (contralateral homonymous
hemianopia) join the existing optic nerve, radiations and occipital cortex. The organising sign is the
afferent RAPD: because the pupil fibres leave the pathway at the optic tract, an RAPD accompanies an
optic-nerve or optic-tract lesion but not an LGN, radiation or occipital one — so a homonymous hemianopia
WITH an RAPD localises to the optic tract, while macular sparing marks the occipital (PCA) terminus and a
bare featureless hemianopia stays retrochiasmal-unspecified. The pupillary efferent limb (CN III, Adie,
light-near dissociation) and the sympathetic/Horner localising axis are the remaining pieces, followed by
a pathology layer (ALS and friends).
```

- [ ] **Step 5: Checkpoint (no git)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 15 suites green, exit 0.

---

### Post-plan (orchestrator, not a subagent step)

After Task 3 is green: refresh project memory (`neurolocaliser-engine-state`) — visual pathway sub-project 1 done (chiasm/optic_tract/lgn under a new `visual_pathway` level + midline chiasm composer; `bitemporal_hemianopia`/`rapd`/`macular_sparing`; RAPD separates pre- from post-geniculate; macular-sparing consequence for bare HH), new counts (15 suites, 699 assertions = prior 665 + 34). Note sub-projects 2 (pupillary efferent) and 3 (Horner axis) still pending. Artifact sync stays deferred.

## Self-Review

**Spec coverage:**
- 3 findings + `CROSSES` → Task 1 Steps 1–2. ✓
- 3 → `LOCALISING` → Task 1 Step 3. ✓
- `rapd` at optic canal (+ optic tract), `macular_sparing` at occipital → Task 2 Steps 3–5. ✓
- `visual_pathway` level + `optic_tract`/`lgn` (buildSites) + `chiasm` midline composer → Task 2 Steps 5–6. ✓
- Composer registered in solver → Task 2 Step 7. ✓
- Phonebook chiasm/optic_tract/lgn → Task 2 Step 8. ✓
- Occipital-HH test updates (macular-sparing consequence) → Task 2 Step 9. ✓
- Discriminators (monocular+RAPD, bitemporal, tract, occipital, bare-HH) → new suite §4. ✓
- Wire-up → Task 3. ✓
- Out-of-scope (efferent pupil, Horner axis, junctional scotoma, congruity grading) → no tasks (sub-projects 2/3). ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step states the exact command and expected output. ✓

**Type consistency:** finding ids identical across findings/structures/score/tests; `rapd` crossing = `false` default (optic nerve ipsi) with the `ot_rapd` structure overriding `crosses:true` (contra) — matching `bodySideFor`'s per-structure override; site ids `left_visual_pathway_optic_tract`/`_lgn` (buildSites) and `visual_pathway_chiasm` (composer, `side:"midline"`) match the phonebook keys `visual_pathway_<part>`; `homonymous_hemianopia` reused (already `CROSSES:true`), so `ot_hh`/`lgn_hh` need no override. New-suite tally: §1 = 3+3+3+3 = 12, §2 = 7, §3 = 7, §4 = 6, §5 = 2 → **total 34** (matches Task 2 Step 10 and Task 3 Step 2). Grand total 665 + 34 = 699.
