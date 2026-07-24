# Sympathetic / Horner Three-Order Axis (level-gated cord + Pancoast) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `horner` into a central/preganglionic/postganglionic axis via the anhidrosis distribution; model the cord oculosympathetic as a level-gated lateral-cord structure (cervical Brown-Séquard gets a Horner, thoracic doesn't); and add Pancoast as a preganglionic ∪ lower-trunk composite.

**Architecture:** Two anhidrosis findings. A **new level-gated-emission mechanism** (`emitAtOrAbove` on a structure; the forward model skips it unless a valid `sensoryLevel` at/above that segment is supplied — restrictive default). A `cord/lateral` gated sympathetic (rides the hemicord composite). A lean `sympathetic/preganglionic` primitive plus a `composePancoastSites` composite (preganglionic ∪ C8/T1). Central brainstem = the existing lateral medulla (ungated anhidrosis); postganglionic = the existing carotid space.

**Tech Stack:** Node.js ES modules, zero dependencies. Hand-rolled standalone test scripts.

## Global Constraints

- **Node is not on PATH.** Prefix every command with `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`, run from repo root `Code/neurolocaliser-engine/`.
- **No git for this project** (user choice). Each "Checkpoint" runs the suite and confirms green.
- **UK spelling** everywhere.
- **Derive-don't-store:** the phonebook stays keyed by emergent site id; Pancoast is a derived composite, not a rule.
- **Restrictive gate default:** a `emitAtOrAbove` structure emits ONLY when a valid `sensoryLevel` at/above the threshold is supplied (no level → skip). This is what keeps every existing level-less test unchanged.
- **Backward compatibility:** all 16 existing suites end green. Threading `sensoryLevel` into scoring is inert for non-gated structures; the only gated structures are the new cord sympathetic. Verified safe against the existing `sensoryLevel` tests (T10, T4, C6-on-a-syrinx, invalid Z9). If a test shifts, use superpowers:systematic-debugging.
- **Spec:** `docs/superpowers/specs/2026-07-13-horner-sympathetic-axis-design.md`. **Sub-project 3 of 3.**

## File Structure

- **Modify** `src/model/findings.js` — 2 findings + 2 `CROSSES` entries.
- **Modify** `src/engine/score.js` — 2 findings into `LOCALISING`.
- **Modify** `src/engine/forward.js` — import `normaliseLevel`/`isBelow`; the level gate in `expectedFindings` + `explain`.
- **Modify** `src/engine/inverse.js` — thread `sensoryLevel` into `opts`; register `composePancoastSites()`.
- **Modify** `src/model/structures.js` — cord/lateral (3 gated), medulla/lateral anhidrosis (2), sympathetic/preganglionic (2).
- **Modify** `src/model/sites.js` — `LEVELS` (+sympathetic), `PARTS` (+preganglionic), `TERRITORY` (+2), `composePancoastSites()`.
- **Modify** `src/data/syndromes.js` — 3 phonebook entries (cord_lateral, sympathetic_preganglionic, sympathetic_pancoast) + a postganglionic carotid entry.
- **Create** `test/horner-axis.test.js`.
- **Modify** `package.json`, `README.md`.

Run command used throughout (from `Code/neurolocaliser-engine/`):
```
PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/horner-axis.test.js
```

---

### Task 1: New findings + crossing + localising policy

Foundational. Not emitted yet, so all 16 suites stay green.

**Files:** Modify `src/model/findings.js`, `src/engine/score.js`.

**Interfaces:** Produces findings `anhidrosis_face`, `anhidrosis_body` (`CROSSES:false`); both localising.

- [ ] **Step 1: Add the two findings**

In `src/model/findings.js`, find:

```js
  horner:         { desc: "Horner's syndrome (descending sympathetic)", group: "Autonomic" },
```

Insert immediately AFTER it:

```js
  anhidrosis_face: { desc: "Facial anhidrosis (loss of sweating — sympathetic, central or preganglionic)", group: "Autonomic" },
  anhidrosis_body: { desc: "Hemibody (trunk/limb) anhidrosis (central sympathetic — whole hemibody)", group: "Autonomic" },
```

- [ ] **Step 2: Add the two `CROSSES` entries**

In `src/model/findings.js`, in `CROSSES`, find:

```js
  fixed_dilated_pupil: false, light_near_dissociation: false,
```

Insert immediately AFTER it:

```js
  // sympathetic anhidrosis — ipsilateral to the lesion, never cross
  anhidrosis_face: false, anhidrosis_body: false,
```

- [ ] **Step 3: Add the two localising findings**

In `src/engine/score.js`, find:

```js
  "fixed_dilated_pupil","light_near_dissociation", // pupillary efferent (parasympathetic) localisers
```

Insert immediately AFTER it:

```js
  "anhidrosis_face","anhidrosis_body", // sympathetic anhidrosis distribution — the Horner order axis
```

- [ ] **Step 4: Checkpoint (no git) — regression stays green**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: 16 suites unchanged (`8`, `5`, `22`, `8`, `8`, `116`, `62`, `65`, `50`, `91`, `103`, `31`, `34`, `62`, `34`, `29`) — all `0 failed`.

---

### Task 2: Level-gate mechanism, sympathetic sites, Pancoast composite, tests

Atomic: the level-gate mechanism, the cord/medulla/preganglionic structures, the Pancoast composer, and the tests land together as one red→green cycle.

**Files:**
- Create: `test/horner-axis.test.js`
- Modify: `src/engine/forward.js`, `src/engine/inverse.js`, `src/model/structures.js`, `src/model/sites.js`, `src/data/syndromes.js`

**Interfaces:**
- Consumes: findings from Task 1; `solve`, `expectedFindings`, `STRUCTURES`, `SITE_BY_ID`, `composeHemiLevelSites`, `composePancoastSites`, `nameForSite`.
- Produces: level-gated emission (`struct.emitAtOrAbove`); sites `left/right_cord_lateral`, `left/right_sympathetic_preganglionic`, `left/right_sympathetic_pancoast` (composer); `medulla/lateral` gains `anhidrosis_face`+`anhidrosis_body`.

- [ ] **Step 1: Write the failing test**

Create `test/horner-axis.test.js`:

```js
// horner-axis.test.js — the sympathetic / Horner three-order axis. The anhidrosis distribution is the
// discriminator (hemibody = central, face = preganglionic, none = postganglionic). The cord's
// oculosympathetic is LEVEL-GATED (Horner only at/above ~T1), so a cervical Brown-Séquard gets a Horner
// but a thoracic one does not. Pancoast = preganglionic ∪ lower-trunk (C8/T1) composite.
// Run: node test/horner-axis.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { expectedFindings } from "../src/engine/forward.js";
import { SITE_BY_ID, composeHemiLevelSites, composePancoastSites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const partSet = (level, part) => STRUCTURES.filter(s => s.level === level && s.part === part).map(s => s.produces).sort();
const best = (set, opts) => solve(new Set(set), opts).best;
const hemi = () => Object.fromEntries(composeHemiLevelSites().map(s => [s.id, s]));
const pancoast = () => composePancoastSites().find(s => s.id === "left_sympathetic_pancoast");

// --- 1: vocabulary & policy ---
for (const id of ["anhidrosis_face","anhidrosis_body"]) ok(`finding ${id} exists`, isFinding(id));
for (const id of ["anhidrosis_face","anhidrosis_body"]) ok(`${id} does not cross`, CROSSES[id] === false);
for (const id of ["anhidrosis_face","anhidrosis_body"]) ok(`${id} IS localising`, LOCALISING.has(id));
for (const id of ["anhidrosis_face","anhidrosis_body"]) ok(`${id} is lateralised`, !NON_LATERALISED.has(id));

// --- 2: sites & structures ---
ok("left preganglionic site exists", !!SITE_BY_ID.left_sympathetic_preganglionic);
ok("left cord lateral site exists", !!SITE_BY_ID.left_cord_lateral);
ok("cord lateral sympathetic is level-gated at T1",
   STRUCTURES.filter(s => s.level === "cord" && s.part === "lateral").every(s => s.emitAtOrAbove === "T1") &&
   STRUCTURES.some(s => s.level === "cord" && s.part === "lateral"));
ok("lateral medulla now produces anhidrosis_face + anhidrosis_body",
   partSet("medulla","lateral").includes("anhidrosis_face") && partSet("medulla","lateral").includes("anhidrosis_body"));
ok("preganglionic = horner + anhidrosis_face (lean)",
   JSON.stringify(partSet("sympathetic","preganglionic")) === JSON.stringify(["anhidrosis_face","horner"].sort()));
ok("carotid space stays horner-only (no anhidrosis)", (() => {
  const e = expectedFindings(SITE_BY_ID.left_skull_base_carotid_space);
  return e.has("horner@left") && !e.has("anhidrosis_face@left") && !e.has("anhidrosis_body@left");
})());
ok("Pancoast composite exists (preganglionic ∪ C8/T1)", !!pancoast());

// --- 3: the level gate (forward) ---
{
  const cerv = expectedFindings(SITE_BY_ID.left_cord_lateral, { sensoryLevel: "C7" });
  ok("cord lateral @C7 -> horner@left", cerv.has("horner@left"));
  ok("cord lateral @C7 -> anhidrosis_face@left + anhidrosis_body@left", cerv.has("anhidrosis_face@left") && cerv.has("anhidrosis_body@left"));
  const thor = expectedFindings(SITE_BY_ID.left_cord_lateral, { sensoryLevel: "T10" });
  ok("cord lateral @T10 -> NO horner / anhidrosis (below T1)", !thor.has("horner@left") && !thor.has("anhidrosis_face@left"));
  const none = expectedFindings(SITE_BY_ID.left_cord_lateral);
  ok("cord lateral (no level) -> nothing (restrictive default)", !none.has("horner@left") && !none.has("anhidrosis_face@left"));
  const H = hemi();
  ok("cervical hemicord (@C5) emits horner@left (Brown-Séquard gets the Horner)", expectedFindings(H.left_cord_hemi, { sensoryLevel: "C5" }).has("horner@left"));
  ok("thoracic hemicord (@T10) emits NO horner", !expectedFindings(H.left_cord_hemi, { sensoryLevel: "T10" }).has("horner@left"));
}

// --- 4: discriminators emerge (via solve) ---
const centralSet = ["horner@left","anhidrosis_face@left","anhidrosis_body@left"];
ok("isolated hemibody Horner + cervical level -> cord (central)",
   best(centralSet, { sensoryLevel: "C7" }).site.id === "left_cord_lateral");
ok("isolated hemibody Horner, no level -> lateral medulla (central, brainstem default)",
   best(centralSet).site.id === "left_medulla_lateral");
ok("cervical Brown-Séquard + Horner (@C5) -> one hemicord lesion",
   best(["hemiparesis@left","dorsal_sensory@left","spinothalamic@right","horner@left","anhidrosis_face@left","anhidrosis_body@left"], { sensoryLevel: "C5" }).site.id === "left_cord_hemi");
ok("isolated face-only Horner -> preganglionic",
   best(["horner@left","anhidrosis_face@left"]).site.id === "left_sympathetic_preganglionic");
ok("Horner + face anhidrosis + C8/T1 (wasting, T1 sensory, arm pain) -> Pancoast",
   best(["horner@left","anhidrosis_face@left","sensory_t1@left","weak_thumb_abduction@left","wasting@left","radicular_pain@left"]).site.id === "left_sympathetic_pancoast");
ok("the same C8/T1 signs WITHOUT the Horner -> lower trunk (Klumpke)",
   best(["sensory_t1@left","weak_thumb_abduction@left","wasting@left","radicular_pain@left"]).site.id === "left_plexus_lower_trunk");
ok("isolated Horner -> postganglionic (carotid)",
   best(["horner@left"]).site.id === "left_skull_base_carotid_space");
ok("full Wallenberg (no anhidrosis, no level) still -> lateral medulla",
   best(["face_pain_loss@left","spinothalamic@right","horner@left","cn_bulbar@left"]).site.id === "left_medulla_lateral");

// --- 5: phonebook ---
ok("cord central names cervical cord / syrinx",
   /cervical cord|syrinx|lateral cord|1st-order|central/i.test(nameForSite(best(centralSet, { sensoryLevel: "C7" }).site).name +
     nameForSite(best(centralSet, { sensoryLevel: "C7" }).site).note));
ok("preganglionic names preganglionic / stellate",
   /preganglionic|stellate/i.test(nameForSite(best(["horner@left","anhidrosis_face@left"]).site).name));
ok("Pancoast names Pancoast / superior sulcus",
   /pancoast|superior sulcus/i.test(nameForSite(best(["horner@left","anhidrosis_face@left","sensory_t1@left","weak_thumb_abduction@left","wasting@left","radicular_pain@left"]).site).name));
ok("carotid names carotid / dissection / postganglionic",
   /carotid|dissection|postganglionic/i.test((nameForSite(best(["horner@left"]).site).name || "") + (nameForSite(best(["horner@left"]).site).note || "")));

// ---- report ----
console.log("\nNeuroLocaliser — SYMPATHETIC / HORNER AXIS tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/horner-axis.test.js`
Expected: FAIL — the findings/sites/mechanism don't exist yet.

- [ ] **Step 3: Add the level-gate mechanism to the forward model**

In `src/engine/forward.js`, find the import:

```js
import { CROSSES, NON_LATERALISED } from "../model/findings.js";
```

replace with:

```js
import { CROSSES, NON_LATERALISED } from "../model/findings.js";
import { normaliseLevel, isBelow } from "../model/levels.js";
```

In `src/engine/forward.js`, in `expectedFindings`, find:

```js
    if (!structActiveAt(struct, site, dominantSide)) continue;
    const f = struct.produces;
    if (NON_LATERALISED.has(f)) {
```

replace with (add the level gate before emitting):

```js
    if (!structActiveAt(struct, site, dominantSide)) continue;
    // Level-gated emission (the first time the sensory level gates emission, not just annotates): a
    // structure with `emitAtOrAbove` fires only when a valid sensory level at/above that segment is
    // supplied — restrictive default (no level → skip). Used by the cord oculosympathetic (Horner ≥ ~T1).
    if (struct.emitAtOrAbove) {
      const lvl = normaliseLevel(opts.sensoryLevel);
      if (!lvl || isBelow(lvl, struct.emitAtOrAbove)) continue;
    }
    const f = struct.produces;
    if (NON_LATERALISED.has(f)) {
```

In `src/engine/forward.js`, in `explain`, find:

```js
    if (!s || !structActiveAt(s, site, dominantSide)) return [];
    const f = s.produces;
```

replace with:

```js
    if (!s || !structActiveAt(s, site, dominantSide)) return [];
    if (s.emitAtOrAbove) {
      const lvl = normaliseLevel(opts.sensoryLevel);
      if (!lvl || isBelow(lvl, s.emitAtOrAbove)) return [];
    }
    const f = s.produces;
```

- [ ] **Step 4: Thread `sensoryLevel` into scoring + register the Pancoast composer (inverse)**

In `src/engine/inverse.js`, find:

```js
  const opts = { dominantSide: options.dominantSide || "left" };
```

replace with:

```js
  const opts = { dominantSide: options.dominantSide || "left", sensoryLevel: options.sensoryLevel };
```

In `src/engine/inverse.js`, replace the import tail:

```js
         composePlexusSites, composeVisualPathwaySites, composePupilPretectumSites } from "../model/sites.js";
```

with:

```js
         composePlexusSites, composeVisualPathwaySites, composePupilPretectumSites,
         composePancoastSites } from "../model/sites.js";
```

In `src/engine/inverse.js`, find:

```js
          ...composePolyneuropathySites(), ...composePlexusSites(), ...composeVisualPathwaySites(),
          ...composePupilPretectumSites()];
}
```

replace with:

```js
          ...composePolyneuropathySites(), ...composePlexusSites(), ...composeVisualPathwaySites(),
          ...composePupilPretectumSites(), ...composePancoastSites()];
}
```

- [ ] **Step 5: Add the sympathetic structures**

In `src/model/structures.js`, find the existing medulla sympathetic:

```js
  { id: "sympathetic",    level: "medulla", part: "lateral", produces: "horner",
    note: "descending sympathetic fibres — ipsilateral Horner's" },
```

Insert immediately AFTER it (ungated brainstem central anhidrosis):

```js
  { id: "sym_med_anhface", level: "medulla", part: "lateral", produces: "anhidrosis_face",
    note: "central (1st-order) Horner — ipsilateral facial anhidrosis" },
  { id: "sym_med_anhbody", level: "medulla", part: "lateral", produces: "anhidrosis_body",
    note: "central (1st-order) Horner — ipsilateral hemibody anhidrosis" },
```

In `src/model/structures.js`, find the end of the spinal-cord block:

```js
  { id: "commissural_stt", level: "cord", part: "central", produces: "suspended_sensory", crosses: false,
    note: "decussating spinothalamic fibres in the anterior white commissure — a central (syrinx) lesion gives bilateral, suspended, dissociated pain/temperature loss with sacral sparing" },
```

Insert immediately AFTER it (the level-gated cord oculosympathetic — feeds the hemicord composite):

```js
  // Descending oculosympathetic in the LATERAL cord → central (1st-order) Horner, but only at/above ~T1
  // (below that the fibres have exited at the ciliospinal centre C8–T2). LEVEL-GATED via emitAtOrAbove.
  // Rides the hemicord composite, so a CERVICAL Brown-Séquard produces a Horner and a thoracic one does not.
  { id: "sym_cord_horner",  level: "cord", part: "lateral", produces: "horner", crosses: false, emitAtOrAbove: "T1",
    note: "descending sympathetic (lateral cord) — ipsilateral Horner, only if the lesion is at/above ~T1" },
  { id: "sym_cord_anhface", level: "cord", part: "lateral", produces: "anhidrosis_face", crosses: false, emitAtOrAbove: "T1",
    note: "central cord Horner — facial anhidrosis (≥ ~T1)" },
  { id: "sym_cord_anhbody", level: "cord", part: "lateral", produces: "anhidrosis_body", crosses: false, emitAtOrAbove: "T1",
    note: "central cord Horner — hemibody anhidrosis (≥ ~T1)" },
```

In `src/model/structures.js`, at the very end of the `STRUCTURES` array (after the last pupil structure `ar_lnd`, before the closing `];`), add the preganglionic block. Find:

```js
  { id: "ar_lnd",    level: "pupil", part: "pretectum", produces: "light_near_dissociation",
    note: "pretectum / dorsal midbrain (light-reflex relay) — Argyll Robertson (small bilateral, light-near dissociation)" }
];
```

replace with:

```js
  { id: "ar_lnd",    level: "pupil", part: "pretectum", produces: "light_near_dissociation",
    note: "pretectum / dorsal midbrain (light-reflex relay) — Argyll Robertson (small bilateral, light-near dissociation)" },

  // ---- SYMPATHETIC / HORNER AXIS — preganglionic (2nd-order) primitive ----
  // The lean preganglionic Horner (stellate ganglion). Pancoast is its composite with the lower trunk
  // (C8/T1), built by composePancoastSites. Ungated (not a cord lesion).
  { id: "preg_horner",  level: "sympathetic", part: "preganglionic", produces: "horner",
    note: "preganglionic (2nd-order) oculosympathetic — stellate ganglion / lung apex" },
  { id: "preg_anhface", level: "sympathetic", part: "preganglionic", produces: "anhidrosis_face",
    note: "preganglionic Horner — facial anhidrosis, body spared" }
];
```

- [ ] **Step 6: Register the level, part, territory + the Pancoast composer**

In `src/model/sites.js`, replace:

```js
const LEVELS = ["midbrain", "pons", "medulla", "cord", "cortex", "subcortex", "skull_base", "root", "nerve", "visual_pathway", "pupil"];
```

with:

```js
const LEVELS = ["midbrain", "pons", "medulla", "cord", "cortex", "subcortex", "skull_base", "root", "nerve", "visual_pathway", "pupil", "sympathetic"];
```

In `src/model/sites.js`, replace:

```js
  "cn3_compressive", "cn3_ischaemic", "ciliary_ganglion"];
```

with (add `preganglionic`; `"lateral"` is already in `PARTS` for the cord site):

```js
  "cn3_compressive", "cn3_ischaemic", "ciliary_ganglion", "preganglionic"];
```

In `src/model/sites.js`, find:

```js
  "pupil|pretectum":       "pretectum / dorsal midbrain (light-reflex relay — Argyll Robertson)"
};
```

replace with:

```js
  "pupil|pretectum":       "pretectum / dorsal midbrain (light-reflex relay — Argyll Robertson)",
  "cord|lateral":          "lateral cord (descending oculosympathetic — central Horner, ≥ ~T1)",
  "sympathetic|preganglionic": "preganglionic oculosympathetic (stellate ganglion / lung apex)"
};
```

In `src/model/sites.js`, find the end of `composePupilPretectumSites`:

```js
  return structures.length ? [{ id: "pupil_pretectum", side: "bilateral", level: "pupil",
    part: "pretectum", territory: TERRITORY["pupil|pretectum"], structures, composite: true }] : [];
}
```

Insert immediately after that closing `}`:

```js

// Pancoast (superior sulcus tumour) EMERGES as the union of the preganglionic oculosympathetic and the
// brachial plexus lower trunk (C8/T1) — like Erb = C5∪C6. A full Pancoast picture (preganglionic Horner +
// hand wasting + T1 sensory + arm pain) beats the two primitives by parsimony; an isolated preganglionic
// Horner stays at the lean primitive, an isolated Klumpke stays at the lower trunk.
export function composePancoastSites() {
  const symp = STRUCTURES.filter(s => s.level === "sympathetic" && s.part === "preganglionic").map(s => s.id);
  const lowerTrunk = STRUCTURES.filter(s => s.level === "root" && (s.part === "c8" || s.part === "t1")).map(s => s.id);
  if (symp.length === 0 || lowerTrunk.length === 0) return [];
  return SIDES.map(side => ({
    id: `${side}_sympathetic_pancoast`, side, level: "sympathetic", part: "pancoast",
    territory: "lung apex — Pancoast (superior sulcus) tumour",
    structures: [...symp, ...lowerTrunk], composite: true
  }));
}
```

- [ ] **Step 7: Add the phonebook entries**

In `src/data/syndromes.js`, find the last pupil entry `pupil_pretectum:` and insert these four entries immediately after it (inside `BY_SITE`, before the closing `};`):

```js
  cord_lateral: { name: "Central (first-order) Horner's — cervical cord", note: "Descending sympathetic in the lateral cervical cord (syringomyelia, cord tumour/infarct); ipsilateral hemibody anhidrosis. Only a lesion at/above ~T1 gives a Horner.", ddx: ["Syringomyelia", "Intramedullary tumour", "Cord infarct", "Demyelination"], red: "A Horner with suspended sensory loss or long-tract signs → image the cervical cord." },
  sympathetic_preganglionic: { name: "Preganglionic (second-order) Horner's", note: "A Horner from the preganglionic oculosympathetic (ciliospinal centre → stellate ganglion); facial anhidrosis with the body spared.", ddx: ["Pancoast (apical lung) tumour", "Thyroid / mediastinal mass", "Iatrogenic (CVC, surgery)", "Trauma"], red: "A preganglionic Horner with C8/T1 wasting or arm pain → image the lung apex for a Pancoast tumour." },
  sympathetic_pancoast: { name: "Pancoast syndrome (superior sulcus tumour)", note: "A preganglionic Horner PLUS lower-trunk (C8/T1) involvement — hand-intrinsic wasting, T1 sensory loss and aching arm/shoulder pain — from an apical lung tumour.", ddx: ["Bronchogenic (superior sulcus) carcinoma", "Apical TB / infection", "Metastasis"], red: "A Horner with hand wasting and arm pain is a Pancoast tumour until proven otherwise — image the lung apex urgently." },
  skull_base_carotid_space: { name: "Postganglionic (third-order) Horner's — carotid", note: "A Horner from the postganglionic fibres on the internal carotid (carotid dissection, cavernous lesion); isolated, often painful, with NO anhidrosis (the facial sudomotor fibres left with the external carotid).", ddx: ["Internal carotid artery dissection", "Cavernous sinus lesion", "Cluster headache"], red: "A painful isolated Horner is a carotid dissection until proven otherwise — urgent vessel imaging (stroke risk)." },
```

- [ ] **Step 8: Run the new suite to verify it passes**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node test/horner-axis.test.js`
Expected: PASS — `33 passed, 0 failed`.

- [ ] **Step 9: Checkpoint (no git) — full regression**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: the 16 existing suites green. Particular attention: `sensory-level` (T10/T4/invalid — the gated cord sympathetic stays off), `central-cord` (C6 — the cord lateral site doesn't steal the syrinx winner), `cord`/`engine` (Wallenberg + Brown-Séquard unaffected), `pns`/`pns-nerves` (the Pancoast composite doesn't steal Klumpke/Erb). If a test shifts, use superpowers:systematic-debugging (check `rankSingle`); do NOT relax the restrictive gate default.

---

### Task 3: Wire-up — test script & README

**Files:** Modify `package.json`, `README.md`.

**Interfaces:** Consumes `test/horner-axis.test.js`; produces `npm test` running all 17 suites.

- [ ] **Step 1: Update the test script**

In `package.json`, replace the tail of the `scripts.test` chain:

```json
 && node test/pupil-efferent.test.js"
```

with:

```json
 && node test/pupil-efferent.test.js && node test/horner-axis.test.js"
```

- [ ] **Step 2: Run the whole suite via npm**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: 17 blocks, the last being `33 passed, 0 failed`, exit code 0.

- [ ] **Step 3: Update the README — Running list**

In `README.md`, under `## Running`, add after the `node test/pupil-efferent.test.js …` line:

```
node test/horner-axis.test.js    # sympathetic / Horner 3-order axis (central/preganglionic/postganglionic + Pancoast)
```

- [ ] **Step 4: Update the README — Status paragraph**

In `README.md`, find the sentence:

```
The sympathetic/Horner three-order
localising axis is the remaining piece of this region, followed by a pathology layer (ALS and friends).
```

Replace it with:

```
The sympathetic pathway now localises Horner's syndrome along its three neurons by the anhidrosis
distribution: a hemibody-anhidrosis Horner is central (lateral medulla, or — with a cervical sensory
level — the lateral cord), facial anhidrosis with the body spared is preganglionic (stellate ganglion),
and an isolated Horner with no anhidrosis is postganglionic (carotid dissection). The cord's
oculosympathetic is modelled as a level-gated finding — the first time the sensory level gates emission
rather than only annotating it — so a cervical Brown-Séquard produces a Horner while a thoracic one does
not, and Pancoast emerges as the union of the preganglionic sympathetic and the C8/T1 lower trunk. A
pathology layer (ALS and friends) and a non-organic (functional) layer are the remaining pieces.
```

- [ ] **Step 5: Checkpoint (no git)**

Run: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
Expected: all 17 suites green, exit 0.

---

### Post-plan (orchestrator, not a subagent step)

After Task 3 is green: refresh project memory (`neurolocaliser-engine-state`) — Horner axis sub-project 3 done (COMPLETES the visual/pupil/autonomic region); the **new level-gated-emission mechanism** (`emitAtOrAbove`, restrictive default, sensoryLevel threaded into scoring — first time the level gates emission); `anhidrosis_face`/`anhidrosis_body`; cord/lateral gated sympathetic feeding the hemicord (cervical Brown-Séquard → Horner); lateral-medulla ungated anhidrosis; lean `sympathetic/preganglionic`; Pancoast composite (preganglionic ∪ C8/T1); carotid postganglionic. New counts (17 suites, 761 assertions = prior 728 + 33). All three visual/pupil/autonomic sub-projects done. Remaining roadmap: pathology layer (ALS), FND layer, UI, + the deferred Artifact sync (reflexes/tone/nerve-segments/visual/pupil/horner). Artifact sync stays deferred.

## Self-Review

**Spec coverage:**
- 2 findings + `CROSSES` → Task 1 Steps 1–2. ✓
- 2 → `LOCALISING` → Task 1 Step 3. ✓
- Level-gate mechanism (forward gate + explain + sensoryLevel threading) → Task 2 Steps 3–4. ✓
- cord/lateral gated sympathetic + medulla anhidrosis + preganglionic → Task 2 Step 5. ✓
- `sympathetic` level + `preganglionic` part + territory + Pancoast composer + registration → Task 2 Steps 4,6. ✓
- Phonebook (cord_lateral, preganglionic, pancoast, carotid) → Task 2 Step 7. ✓
- Gate forward tests + discriminators (central cord/medulla, cervical BS, preganglionic, Pancoast, Klumpke, postganglionic, Wallenberg guard) → new suite §3–4. ✓
- Wire-up → Task 3. ✓
- Out-of-scope (bilateral cord Horner, thoracic body anhidrosis, pain finding, pharmacology) → no tasks. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step states the exact command and expected output. ✓

**Type consistency:** finding ids identical across findings/structures/score/tests; `emitAtOrAbove:"T1"` only on the three cord/lateral structures; gate uses `normaliseLevel`+`isBelow` (imported into forward.js); `sensoryLevel` threaded via `opts` (already the arg to `rankSingle`/`minimalSet`/`scoreSite`/`expectedFindings`); Pancoast composer id `${side}_sympathetic_pancoast` → level_part `sympathetic_pancoast` matches the phonebook key; `cord|lateral` rides `buildSites` (part already in `PARTS`) + `composeHemiLevelSites`; preganglionic set = `["anhidrosis_face","horner"]` matches the §2 exact-set. New-suite tally: §1 = 2+2+2+2 = 8, §2 = 7, §3 = 6, §4 = 8, §5 = 4 → **total 33** (matches Task 2 Step 8 and Task 3 Step 2). Grand total 728 + 33 = 761.
