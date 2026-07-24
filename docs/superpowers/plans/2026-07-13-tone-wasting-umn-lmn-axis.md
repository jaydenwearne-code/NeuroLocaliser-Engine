# Tone & Wasting — the UMN-vs-LMN axis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add muscle **tone** (`spasticity` / `hypotonia`) and **wasting** as pure anatomy-layer findings that complete the classic UMN-vs-LMN discriminator — no new solver mechanism, the exact shape of the reflexes increment.

**Architecture:** Three new findings enter the vocabulary. `spasticity` is a corticospinal (UMN) companion attached at every level the tract is modelled (crossing follows the tract: contra by default; cord + conus override `crosses:false`). `hypotonia` attaches only to the generalised-flaccid LMN sites (anterior horn, cauda, polyneuropathy). `wasting` attaches to the broad LMN set (those three + all 10 roots + the 13 motor nerves), excluding pure-sensory `lat_fem_cutaneous`, NMJ and muscle, and never appearing on the UMN side. All three are non-localising; the existing scorer does the discrimination.

**Tech Stack:** Node.js ES modules, zero dependencies. Hand-rolled standalone test scripts (repo convention).

## Global Constraints

- **Node is not on PATH.** Prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`, run from repo root `Code/neurolocaliser-engine/`.
- **No git for this project** (user choice). Each "Checkpoint" step replaces the commit: run the suite and confirm green.
- **UK spelling** everywhere (e.g. "localise").
- **Derive-don't-store:** no syndrome as an `if` rule; these are anatomy findings on existing structures, not new sites — `syndromes.js`, `sites.js`, `forward.js`, `inverse.js`, `score.js` are all UNCHANGED.
- **Non-localising:** `spasticity`, `hypotonia`, `wasting` must NOT be added to `LOCALISING` in `score.js` (they run the length of a system; the level is pinned by the accompanying localisers).
- **Backward compatibility:** the existing 569 assertions across 12 suites must stay green. The corticospinal sites now over-predict one extra non-localising finding (`spasticity`); LMN sites over-predict `wasting`/`hypotonia`. This is the same small, uniform over-prediction the reflexes increment already introduced (Babinski/Hoffmann) — winners must still win. If a close call flips, use superpowers:systematic-debugging (do NOT add to `LOCALISING` to force it).
- **Spec:** `docs/superpowers/specs/2026-07-13-tone-wasting-umn-lmn-axis-design.md`.

## File Structure

- **Modify** `src/model/findings.js` — 3 findings in `FINDINGS` + 3 `CROSSES` entries.
- **Modify** `src/model/structures.js` — a new "TONE & WASTING" block at the end of `STRUCTURES`: 8 `spasticity` + 3 `hypotonia` + 26 `wasting` = 37 structures.
- **Create** `test/tone.test.js`.
- **Modify** `package.json` (the `scripts.test` chain), `README.md` (Running + Status).

Run command used throughout (from `Code/neurolocaliser-engine/`):
```
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/tone.test.js
```

---

### Task 1: Tone & wasting anatomy — findings, structures, emergence

Everything the axis needs lands together (findings + structures + the full test), as one red→green cycle. The test exercises vocabulary, structure attachment, forward emission, the non-localising guarantee, LMN discrimination and the ALS-precursor invariant as one unit.

**Files:**
- Modify: `src/model/findings.js`, `src/model/structures.js`
- Test: `test/tone.test.js`

**Interfaces:**
- Consumes: `FINDINGS`, `CROSSES`, `NON_LATERALISED`, `isFinding` from `findings.js`; `LOCALISING` from `score.js`; `STRUCTURES` from `structures.js`; `expectedFindings` from `forward.js`; `SITE_BY_ID`, `composeHemiLevelSites`, `composeMotorUnitSites`, `composePolyneuropathySites`, `composeCaudaConusSites` from `sites.js`; `solve` from `inverse.js`.
- Produces: findings `spasticity` (`CROSSES:true`), `hypotonia` (`CROSSES:false`), `wasting` (`CROSSES:false`); structure ids `cst_midbrain_spast`, `cst_pons_spast`, `pyr_spast`, `cst_cord_spast`, `ic_spast`, `ctx_spast_leg`, `ctx_spast_arm`, `conus_spast`, `ah_hypotonia`, `cauda_hypotonia`, `poly_hypotonia`, `ah_wasting`, `cauda_wasting`, `poly_wasting`, `root_{c5,c6,c7,c8,t1,l2,l3,l4,l5,s1}_wasting`, and 13 `<nerve>_wasting`.

- [ ] **Step 1: Write the failing test**

Create `test/tone.test.js`:

```js
// tone.test.js — muscle TONE (spasticity / hypotonia) and WASTING as anatomy-layer findings that
// complete the UMN-vs-LMN discriminator (no new mechanism; the shape of the reflexes increment):
//   * spasticity (increased tone) — a corticospinal (UMN) companion at EVERY level the tract is
//     modelled; non-localising; crossing follows the tract (contra by default; cord + conus ipsi/local);
//   * hypotonia (reduced tone) — GENERALISED-flaccid LMN only (anterior horn, cauda, polyneuropathy);
//   * wasting (atrophy) — the broad LMN set (anterior horn, cauda, polyneuropathy, roots, motor nerves),
//     but NOT pure-sensory lat_fem_cutaneous, NOT NMJ/muscle, and NEVER on the UMN side.
// Run: node test/tone.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { expectedFindings } from "../src/engine/forward.js";
import { SITE_BY_ID, composeHemiLevelSites, composeMotorUnitSites,
         composePolyneuropathySites, composeCaudaConusSites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

const producersOf = f => STRUCTURES.filter(s => s.produces === f);
const levelsProducing = f => [...new Set(producersOf(f).map(s => s.level))].sort();
const partsProducing  = f => [...new Set(producersOf(f).map(s => s.part))].sort();

// --- 1: vocabulary & policy ---
for (const id of ["spasticity","hypotonia","wasting"]) ok(`finding ${id} exists`, isFinding(id));
ok("spasticity crosses (UMN, follows corticospinal — contra by default)", CROSSES.spasticity === true);
ok("hypotonia does not cross (LMN, local)", CROSSES.hypotonia === false);
ok("wasting does not cross (LMN, local)", CROSSES.wasting === false);
for (const id of ["spasticity","hypotonia","wasting"]) ok(`${id} is NOT localising`, !LOCALISING.has(id));
for (const id of ["spasticity","hypotonia","wasting"]) ok(`${id} is lateralised (not @none)`, !NON_LATERALISED.has(id));

// --- 2: structures ---
ok("spasticity produced across the whole corticospinal tract",
   ["midbrain","pons","medulla","cord","subcortex","cortex","conus"].every(l => levelsProducing("spasticity").includes(l)));
ok("the CORD + CONUS spasticity are ipsilateral/local (crosses:false)",
   producersOf("spasticity").filter(s => s.level === "cord" || s.level === "conus").every(s => s.crosses === false));
ok("hypotonia is generalised-flaccid ONLY (anterior horn, cauda, polyneuropathy)",
   JSON.stringify(levelsProducing("hypotonia")) === JSON.stringify(["cauda","motor_unit","polyneuropathy"]));
ok("hypotonia only at the anterior horn part of the motor unit",
   producersOf("hypotonia").filter(s => s.level === "motor_unit").every(s => s.part === "anterior_horn"));
ok("wasting spans the broad LMN set (motor unit, cauda, polyneuropathy, root, nerve)",
   ["motor_unit","cauda","polyneuropathy","root","nerve"].every(l => levelsProducing("wasting").includes(l)));
ok("wasting at all 10 roots", producersOf("wasting").filter(s => s.level === "root").length === 10);
ok("wasting at 13 motor nerves (every named nerve EXCEPT pure-sensory lat_fem_cutaneous)",
   producersOf("wasting").filter(s => s.level === "nerve").length === 13);
ok("NO wasting at pure-sensory lat_fem_cutaneous", !partsProducing("wasting").includes("lat_fem_cutaneous"));
ok("NO wasting at NMJ or muscle (weakness without wasting)",
   !producersOf("wasting").some(s => ["nmj_postsynaptic","nmj_presynaptic","muscle"].includes(s.part)));
ok("UMN has NO wasting — spasticity levels and wasting levels are disjoint",
   levelsProducing("spasticity").every(l => !levelsProducing("wasting").includes(l)));

// --- 3: forward emission (crossing follows the system) ---
{
  const hemi = Object.fromEntries(composeHemiLevelSites().map(s => [s.id, s]));
  const cordHemi = expectedFindings(hemi.left_cord_hemi);
  ok("left hemicord -> spasticity@left (ipsi, below the level)", cordHemi.has("spasticity@left"));
  const midbrain = expectedFindings(SITE_BY_ID.left_midbrain_medial);
  ok("left medial midbrain -> spasticity@right (contra)", midbrain.has("spasticity@right"));

  const ah = Object.fromEntries(composeMotorUnitSites().map(s => [s.id, s]));
  const ahExp = expectedFindings(ah.motor_unit_anterior_horn);
  ok("anterior horn (bilateral) -> hypotonia@left and @right", ahExp.has("hypotonia@left") && ahExp.has("hypotonia@right"));
  ok("anterior horn (bilateral) -> wasting@left and @right", ahExp.has("wasting@left") && ahExp.has("wasting@right"));

  const l5 = expectedFindings(SITE_BY_ID.right_root_l5);
  ok("right L5 root -> wasting@right (focal LMN wastes)", l5.has("wasting@right"));
  ok("right L5 root -> NO hypotonia (focal LMN keeps normal tone)", !l5.has("hypotonia@right"));

  const poly = Object.fromEntries(composePolyneuropathySites().map(s => [s.id, s]));
  const polyExp = expectedFindings(poly.polyneuropathy_length_dependent);
  ok("polyneuropathy -> hypotonia + wasting (bilateral)", polyExp.has("hypotonia@left") && polyExp.has("wasting@right"));

  const cc = Object.fromEntries(composeCaudaConusSites().map(s => [s.id, s]));
  const caudaExp = expectedFindings(cc.cauda_equina);
  ok("cauda equina -> hypotonia@midline + wasting@midline", caudaExp.has("hypotonia@midline") && caudaExp.has("wasting@midline"));
}

// --- 4: tone is a NON-localising annotation (never moves the winner) ---
{
  const without = solve(new Set(["cn3_palsy@left","hemiparesis@right","facial_weak_umn@right"])).best;
  const withSpast = solve(new Set(["cn3_palsy@left","hemiparesis@right","facial_weak_umn@right","spasticity@right"])).best;
  ok("Weber localises to medial midbrain without spasticity", without && without.site.id === "left_midbrain_medial");
  ok("...and still with spasticity (non-localising annotation)", withSpast && withSpast.site.id === "left_midbrain_medial");
}

// --- 5: UMN-vs-LMN discrimination — the generalised-flaccid picture rides the anterior horn ---
{
  const lmn = solve(new Set(["lmn_weakness@left","lmn_weakness@right","wasting@left","wasting@right",
                             "hypotonia@left","hypotonia@right","fasciculations@left","fasciculations@right"])).best;
  ok("flaccid + wasting + hypotonia + fasciculations -> anterior horn (LMN)", lmn && lmn.site.id === "motor_unit_anterior_horn");
}

// --- 6: ALS precursor — UMN and LMN NEVER co-locate (so ALS must span >=2 sites) ---
{
  const byPart = new Map();
  for (const s of STRUCTURES) {
    const key = `${s.level}|${s.part}`;
    if (!byPart.has(key)) byPart.set(key, new Set());
    byPart.get(key).add(s.produces);
  }
  const coLocated = [...byPart.values()].some(set => set.has("spasticity") && set.has("wasting"));
  ok("no single site produces BOTH spasticity and wasting (UMN+LMN co-occurrence spans sites — ALS precursor)", !coLocated);
}

// ---- report ----
console.log("\nNeuroLocaliser — TONE & WASTING (UMN-vs-LMN axis) tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/tone.test.js`
Expected: FAIL — `spasticity`/`hypotonia`/`wasting` are not findings yet, no structures produce them (many failing assertions).

- [ ] **Step 3: Add the three findings**

In `src/model/findings.js`, inside `FINDINGS`, add immediately after the `palmomental:` line (and before the blank line preceding `// Autonomic`):

```js
  palmomental:    { desc: "Palmomental reflex (frontal release — non-specific)", group: "Reflex" },

  // Tone & wasting — the UMN-vs-LMN axis (anatomy-layer companions, non-localising)
  spasticity:     { desc: "Increased tone / spasticity (clasp-knife — corticospinal / UMN)", group: "Tone / wasting" },
  hypotonia:      { desc: "Reduced tone / flaccidity (generalised LMN — anterior horn, cauda, polyneuropathy)", group: "Tone / wasting" },
  wasting:        { desc: "Muscle wasting / atrophy (lower motor neurone — anterior horn, root, nerve; NOT localising)", group: "Tone / wasting" },

```

(The blank line then the `// Autonomic` comment follow, unchanged.)

- [ ] **Step 4: Add the three `CROSSES` entries**

In `src/model/findings.js`, in the `CROSSES` map, find the final two lines:

```js
  // subcortical deep grey — contralateral (above all decussations)
  thalamic_pain: true, hemiballismus: true
};
```

Replace with:

```js
  // subcortical deep grey — contralateral (above all decussations)
  thalamic_pain: true, hemiballismus: true,
  // tone & wasting — spasticity follows the corticospinal tract (contra by default; cord + conus
  // structures override crosses:false → ipsi/local); hypotonia & wasting are LMN, local, never cross
  spasticity: true, hypotonia: false, wasting: false
};
```

- [ ] **Step 5: Add the 8 `spasticity` structures**

In `src/model/structures.js`, find the current end of the `STRUCTURES` array:

```js
  { id: "ctx_grasp", level: "cortex", part: "medial_pfc", produces: "grasp_reflex", note: "medial frontal — contralateral grasp reflex" },
  { id: "ctx_palmomental", level: "cortex", part: "orbitofrontal", produces: "palmomental", note: "frontal release — palmomental (non-specific)" }
];
```

Replace with (note the added comma after the `ctx_palmomental` line, then the new block, then `];`):

```js
  { id: "ctx_grasp", level: "cortex", part: "medial_pfc", produces: "grasp_reflex", note: "medial frontal — contralateral grasp reflex" },
  { id: "ctx_palmomental", level: "cortex", part: "orbitofrontal", produces: "palmomental", note: "frontal release — palmomental (non-specific)" },

  // ---- TONE & WASTING (UMN-vs-LMN axis; anatomy-layer companions, non-localising) ----
  // spasticity: increased tone — a corticospinal (UMN) companion at EVERY level the tract is modelled,
  // exactly like babinski/hoffmann. Crossing follows the tract: contra by default; cord + conus override
  // crosses:false (ipsi/local). Non-localising in score.js.
  { id: "cst_midbrain_spast", level: "midbrain", part: "medial", produces: "spasticity", note: "corticospinal (midbrain) — increased tone, contra" },
  { id: "cst_pons_spast", level: "pons", part: "medial", produces: "spasticity", note: "corticospinal (pons) — increased tone, contra" },
  { id: "pyr_spast", level: "medulla", part: "medial", produces: "spasticity", note: "corticospinal (medullary pyramid) — increased tone, contra" },
  { id: "cst_cord_spast", level: "cord", part: "anterior", produces: "spasticity", crosses: false, note: "corticospinal (cord) — increased tone IPSI, below the level" },
  { id: "ic_spast", level: "subcortex", part: "internal_capsule", produces: "spasticity", note: "corticospinal (internal capsule) — increased tone, contra" },
  { id: "ctx_spast_leg", level: "cortex", part: "motor_leg", produces: "spasticity", note: "corticospinal (leg motor cortex) — increased tone, contra" },
  { id: "ctx_spast_arm", level: "cortex", part: "motor_facearm", produces: "spasticity", note: "corticospinal (arm motor cortex) — increased tone, contra" },
  { id: "conus_spast", level: "conus", part: "medullaris", produces: "spasticity", crosses: false, note: "corticospinal fibres at the conus — increased tone (UMN), midline" },

  // hypotonia: reduced tone — GENERALISED-flaccid LMN only (anterior horn, cauda, polyneuropathy).
  // NOT at individual roots/nerves (focal LMN has clinically normal limb tone), NMJ, or muscle.
  { id: "ah_hypotonia", level: "motor_unit", part: "anterior_horn", produces: "hypotonia", note: "anterior horn — flaccid, hypotonic (generalised LMN)" },
  { id: "cauda_hypotonia", level: "cauda", part: "equina", produces: "hypotonia", crosses: false, note: "cauda equina — flaccid, hypotonic legs, midline" },
  { id: "poly_hypotonia", level: "polyneuropathy", part: "length_dependent", produces: "hypotonia", note: "length-dependent polyneuropathy — distal hypotonia (generalised LMN)" },

  // wasting: muscle atrophy — the broad LMN set. Requires innervated muscle, so it EXCLUDES pure-sensory
  // lat_fem_cutaneous, and (already LMN-excluded) NMJ + muscle. Non-localising, like fasciculations.
  { id: "ah_wasting", level: "motor_unit", part: "anterior_horn", produces: "wasting", note: "anterior horn — denervation wasting (generalised LMN)" },
  { id: "cauda_wasting", level: "cauda", part: "equina", produces: "wasting", crosses: false, note: "cauda equina — denervation wasting, midline" },
  { id: "poly_wasting", level: "polyneuropathy", part: "length_dependent", produces: "wasting", note: "polyneuropathy — distal denervation wasting" },
  { id: "root_c5_wasting", level: "root", part: "c5", produces: "wasting", note: "C5 — segmental wasting (deltoid/biceps)" },
  { id: "root_c6_wasting", level: "root", part: "c6", produces: "wasting", note: "C6 — segmental wasting" },
  { id: "root_c7_wasting", level: "root", part: "c7", produces: "wasting", note: "C7 — segmental wasting (triceps)" },
  { id: "root_c8_wasting", level: "root", part: "c8", produces: "wasting", note: "C8 — segmental wasting (intrinsic hand)" },
  { id: "root_t1_wasting", level: "root", part: "t1", produces: "wasting", note: "T1 — segmental wasting (intrinsic hand)" },
  { id: "root_l2_wasting", level: "root", part: "l2", produces: "wasting", note: "L2 — segmental wasting (hip flexors)" },
  { id: "root_l3_wasting", level: "root", part: "l3", produces: "wasting", note: "L3 — segmental wasting (quadriceps)" },
  { id: "root_l4_wasting", level: "root", part: "l4", produces: "wasting", note: "L4 — segmental wasting (quadriceps/TA)" },
  { id: "root_l5_wasting", level: "root", part: "l5", produces: "wasting", note: "L5 — segmental wasting (TA/EHL)" },
  { id: "root_s1_wasting", level: "root", part: "s1", produces: "wasting", note: "S1 — segmental wasting (calf)" },
  { id: "axil_wasting", level: "nerve", part: "axillary", produces: "wasting", note: "axillary — deltoid wasting" },
  { id: "mcut_wasting", level: "nerve", part: "musculocutaneous", produces: "wasting", note: "musculocutaneous — biceps wasting" },
  { id: "supra_wasting", level: "nerve", part: "suprascapular", produces: "wasting", note: "suprascapular — infraspinatus/supraspinatus wasting" },
  { id: "lthor_wasting", level: "nerve", part: "long_thoracic", produces: "wasting", note: "long thoracic — serratus anterior wasting" },
  { id: "rad_wasting", level: "nerve", part: "radial", produces: "wasting", note: "radial — extensor compartment wasting" },
  { id: "med_wasting", level: "nerve", part: "median", produces: "wasting", note: "median — thenar wasting" },
  { id: "uln_wasting", level: "nerve", part: "ulnar", produces: "wasting", note: "ulnar — hypothenar/interosseous wasting" },
  { id: "fem_wasting", level: "nerve", part: "femoral", produces: "wasting", note: "femoral — quadriceps wasting" },
  { id: "obt_wasting", level: "nerve", part: "obturator", produces: "wasting", note: "obturator — adductor wasting" },
  { id: "supglut_wasting", level: "nerve", part: "superior_gluteal", produces: "wasting", note: "superior gluteal — gluteus medius wasting" },
  { id: "sci_wasting", level: "nerve", part: "sciatic", produces: "wasting", note: "sciatic — hamstring/below-knee wasting" },
  { id: "cper_wasting", level: "nerve", part: "common_peroneal", produces: "wasting", note: "common peroneal — anterolateral compartment wasting" },
  { id: "tib_wasting", level: "nerve", part: "tibial", produces: "wasting", note: "tibial — calf/sole wasting" }
];
```

- [ ] **Step 6: Run test to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/tone.test.js`
Expected: PASS — `34 passed, 0 failed`.

- [ ] **Step 7: Checkpoint (no git) — full regression**

The additions touch only corticospinal + LMN sites via extra non-localising over-predictions; every prior winner must still win.
Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: the 12 existing suites unchanged (`8`, `5`, `22`, `8`, `8`, `116`, `62`, `65`, `50`, `91`, `103`, `31` passed, all `0 failed`) — but note `npm test` does not yet include `tone.test.js` (added in Task 2). If any prior suite drops an assertion, STOP and use superpowers:systematic-debugging; do NOT add tone findings to `LOCALISING` to force a pass.

---

### Task 2: Wire-up — test script & README

**Files:**
- Modify: `package.json` (the `scripts.test` line)
- Modify: `README.md` (Running list + Status paragraph)

**Interfaces:**
- Consumes: `test/tone.test.js` from Task 1.
- Produces: `npm test` runs all 13 suites in sequence.

- [ ] **Step 1: Update the test script**

In `package.json`, replace:

```json
    "test": "node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js && node test/central-cord.test.js && node test/cauda-conus.test.js && node test/cortex.test.js && node test/subcortex.test.js && node test/cranial-nerves.test.js && node test/motor-unit.test.js && node test/pns.test.js && node test/pns-nerves.test.js && node test/reflexes.test.js"
```

with:

```json
    "test": "node test/engine.test.js && node test/cord.test.js && node test/sensory-level.test.js && node test/central-cord.test.js && node test/cauda-conus.test.js && node test/cortex.test.js && node test/subcortex.test.js && node test/cranial-nerves.test.js && node test/motor-unit.test.js && node test/pns.test.js && node test/pns-nerves.test.js && node test/reflexes.test.js && node test/tone.test.js"
```

- [ ] **Step 2: Run the whole suite via npm**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: 13 blocks, the last being `34 passed, 0 failed`, and exit code 0.

- [ ] **Step 3: Update the README — Running list**

In `README.md`, under `## Running`, add after the `node test/reflexes.test.js …` line:

```
node test/tone.test.js           # tone & wasting — the UMN-vs-LMN axis (spasticity / hypotonia / wasting)
```

- [ ] **Step 4: Update the README — Status paragraph**

In `README.md`, find the line:

```
The visual pathway (chiasm onward) and a pathology layer (ALS and friends) are the remaining pieces.
```

Insert this paragraph immediately BEFORE it:

```
Muscle tone and wasting now complete the upper- vs lower-motor-neurone axis. Spasticity (increased,
clasp-knife tone) is a corticospinal companion at every level the tract is modelled — non-localising,
crossing with the tract (contralateral in the brainstem, ipsilateral in the cord) exactly like the
Babinski/Hoffmann release signs. On the lower-motor side the two signs are deliberately given different
footprints: hypotonia (flaccidity) attaches only where reduced tone is a real bedside finding — the
generalised-flaccid sites (anterior horn, cauda equina, polyneuropathy) — whereas wasting attaches to
the whole lower-motor set including individual roots and named motor nerves, because a focal root or
nerve lesion classically wastes and areflexes without a detectable tone change. Wasting requires
innervated muscle, so it is absent from the pure-sensory lateral femoral cutaneous nerve, the
neuromuscular junction (weakness without wasting) and the UMN side entirely — so no single site
produces both spasticity and wasting, which is exactly why a mixed UMN+LMN picture (ALS) must span two
sites, the precursor the future pathology layer will name.
```

- [ ] **Step 5: Checkpoint (no git)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 13 suites green, exit 0.

---

### Post-plan (orchestrator, not a subagent step)

After Task 2 is green:
- Update the **anatomy-review Artifact** (source in `docs/artifacts/`) to add a tone/wasting row per the UMN/LMN table, and the **flow Artifact**'s coverage/test count (bump total assertions 569 → 603, suites 12 → 13) — republish both to the same URLs.
- Refresh project memory (`neurolocaliser-engine-state`): tone/wasting increment done (spasticity UMN-companion across corticospinal; hypotonia generalised-flaccid only; wasting broad LMN minus lat_fem_cutaneous/NMJ/muscle; no site co-locates spasticity+wasting = ALS precursor), new counts (13 suites, 603 assertions), and strike "tone/spasticity" off the REQUIRED refinements.

## Self-Review

**Spec coverage:**
- 3 findings + `CROSSES` (table) → Task 1 Steps 3–4. ✓
- `spasticity` ×8 across corticospinal (cord + conus `crosses:false`) → Task 1 Step 5; test §2. ✓
- `hypotonia` ×3 generalised-flaccid only → Task 1 Step 5; test §2. ✓
- `wasting` ×26 broad LMN, excludes lat_fem_cutaneous/NMJ/muscle, disjoint from UMN → Task 1 Step 5; test §2. ✓
- Non-localising (no `score.js` change) → Global Constraints + test §1. ✓
- Forward emission (ipsi/contra/bilateral/midline) → test §3. ✓
- Non-localising annotation guarantee → test §4. ✓
- UMN-vs-LMN discrimination → test §5. ✓
- ALS-precursor invariant → test §6. ✓
- Regression (12 prior suites) → Task 1 Step 7, Task 2 Step 5. ✓
- Wire-up (package.json, README Running + Status) → Task 2. ✓
- Out-of-scope (myopathic wasting, extrapyramidal rigidity, grading, ALS naming) → no tasks. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step states the exact command and expected output. ✓

**Type consistency:** structure ids referenced in Produces match Step 5 exactly; nerve count = 13 (14 named nerves minus `lat_fem_cutaneous`) matches the `=== 13` assertion; root count = 10 matches `=== 10`; `spasticity` levels {midbrain,pons,medulla,cord,subcortex,cortex,conus} and `wasting` levels {motor_unit,cauda,polyneuropathy,root,nerve} are disjoint (satisfying the §2 disjoint assertion); `hypotonia` levels sort to `["cauda","motor_unit","polyneuropathy"]` matching the `JSON.stringify` assertion; findings ids identical across `findings.js`, `structures.js` and the test. Assertion tally: §1=12, §2=10, §3=8, §4=2, §5=1, §6=1 → **34**, matching Step 6's `34 passed`. ✓
