# Accuracy Round 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: IMPLEMENTED (2026-09-26).** Spec: `docs/superpowers/specs/2026-09-25-accuracy-round-1-design.md` (approved,
all rulings recorded in its §3).

**Goal:** Fix the localisation, ranking and urgency errors found by the 2026-09-25 engine audit, and pin them
with a permanent 84-case clinical vignette suite plus two invariants.

**Architecture:** Mostly declarative anatomy (new structures in `src/model/structures.js`, composer tweaks in
`src/model/sites.js`), three small engine mechanisms (a structure emission override in `forward.js`, an
`asymmetric` site flag honoured by the known-negative filter, a transitive ranking key in `differential()`),
one new site (acute polyradiculoneuropathy) with curated content, onset-aware urgency in `nextSteps.js`, and a
pure `app/sides.js` so the finding panel never offers a side that returns nothing.

**Tech Stack:** Node v24 ES modules, zero dependencies, no build step. Tests are standalone scripts.

## Global Constraints

- Run everything with the local Node prefix: `PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`.
  Every `node`/`npm` command below assumes it.
- Branch: `feat/accuracy-round-1` (already created off `main`). Never commit to `main`.
- Zero dependencies. ES modules only. No build step.
- Tests are standalone scripts with a local `ok(label, cond)` helper that print `PASS`/`FAIL` and
  `process.exit(fail === 0 ? 0 : 1)`. A new suite is added to the `test` script in `package.json`.
- **Golden rule:** never `if (hasX && hasY) return "someSyndrome"`. Syndromes emerge from structures
  sharing a (level, part).
- **Per-(level,part) tables are keyed `${level}|${part}`, never by part alone.**
- One structure produces exactly ONE finding.
- Vocabulary is STRICT (owner ruling): no implication between generic and specific findings.
- Clinical content: no drug doses; no specific numeric thresholds or intervals in workup text.
- `test/brand.test.js` scans the stylesheet as TEXT including comments — never write the accent custom
  property name in a CSS comment. This plan adds no CSS.
- Every new structure gets a row in `docs/artifacts/anatomy-model.html` (format below).
- Every commit message ends with a blank line then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Where an existing assertion encoded a defect this round fixes, change it in the same commit and say so
  in the commit message.** Never edit an assertion silently. The exact expected edits are listed per task
  (found by prototyping the whole change set against the full suite on 2026-09-26).

**Anatomy sheet row format** (`docs/artifacts/anatomy-model.html`). Badges: `bi` IPSI, `bc` CONTRA,
`bb` BILAT, `bm` MIDLINE, `bnone` NONE. Hemisphere gate: `<span class="gate dom">DOM</span>`.
```html
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">STRUCTURE_ID</div><div class="fn">what it produces — the teaching point</div></div></div>
```
Insert each new row on the line after the named anchor row (find it with
`grep -n 'class="id">ANCHOR_ID<' docs/artifacts/anatomy-model.html`).

---

### Task 1: The clinical vignette suite (red baseline)

**Files:**
- Create: `test/clinical-vignettes.test.js`

**Interfaces:**
- Consumes: `solve()` from `src/engine/inverse.js`, `functionalFlag()` from `src/engine/patterns.js`.
- Produces: the acceptance test for the whole round. It is NOT added to `package.json` until Task 12.

- [ ] **Step 1: Write the suite**

Create `test/clinical-vignettes.test.js` with exactly this content:

```js
// clinical-vignettes.test.js — the engine against the bedside (accuracy round 1, 2026-09-26).
//
// Each case is a presentation entered the way a clinician would record it, with the lesion a clinician
// would expect. These are CLINICAL CLAIMS, reviewed by the owner, not derived from the model — that is the
// point: every other suite checks the model against itself, this one checks it against the textbook.
//
// Three kinds of assertion:
//   first  — the expected lesion is ranked FIRST (r.display[0])
//   top    — the expected lesion is within the first k, where the case is genuinely ambiguous at the
//            bedside (the reason is stated per case)
//   single — a single-lesion textbook case must NOT produce a multifocal claim (r.multi === null). This is
//            the class the round-1 audit found: a site missing one of its own cardinal features made the
//            complete picture read as TWO lesions.
//
// Tokens follow the engine's STRICT vocabulary (owner ruling 2026-09-25): `weak_leg`/`weak_arm` are
// pyramidal weakness; a lower-motor-neurone picture is entered with LMN / myotome / reflex findings.
import { solve } from "../src/engine/inverse.js";
import { functionalFlag } from "../src/engine/patterns.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };
const L = s => s.split(/\s+/).filter(Boolean);

// [label, tokens, { first?: RegExp, top?: [k, RegExp], single?: true }]
const CASES = [
  // ---- brainstem ----
  ["Weber", "ptosis@left weak_adduction@left weak_elevation@left weak_depression@left weak_arm@right weak_leg@right facial_weakness@right forehead_spared@right", { first: /^left_midbrain_medial$/, single: true }],
  ["Wallenberg (with dysphagia)", "face_pain_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left cn8_vertigo@left", { first: /^left_medulla_lateral$/, single: true }],
  ["Medial medullary (Dejerine)", "cn12_palsy@left weak_arm@right weak_leg@right dorsal_sensory@right", { first: /^left_medulla_medial$/, single: true }],
  ["Millard-Gubler", "weak_abduction@left facial_weakness@left weak_arm@right weak_leg@right", { first: /^left_pons_medial$/, single: true }],
  ["Foville", "gaze_palsy@left facial_weakness@left weak_arm@right weak_leg@right", { first: /^left_pons_medial$/, single: true }],
  // INO: the MLF runs from the pons to the midbrain, so either level is correct.
  ["INO", "ino@left", { top: [3, /^left_(pons|midbrain)_/] }],
  ["One-and-a-half", "gaze_palsy@left ino@left", { first: /^left_pons_medial$/, single: true }],
  ["AICA — lateral inferior pons", "facial_weakness@left forehead_involved@left hearing_loss@left face_pain_loss@left spinothalamic@right limb_ataxia@left cn8_vertigo@left", { first: /^left_pons_lateral$/, single: true }],
  ["Crossed: right LMN face, left body", "facial_weakness@right forehead_involved@right weak_arm@left weak_leg@left", { first: /^right_pons_medial$/, single: true }],
  ["Locked-in", "weak_arm@left weak_arm@right weak_leg@left weak_leg@right preserved_vertical_gaze@none", { first: /^locked_in$/, single: true }],
  ["Pseudobulbar palsy", "dysarthria@none emotional_lability@none", { first: /^pseudobulbar_corticobulbar$/ }],
  ["Parinaud", "vertical_gaze_palsy@none light_near_dissociation@left light_near_dissociation@right nystagmus_convergence_retraction@none lid_retraction@none", { first: /^parinaud_dorsal_midbrain$/, single: true }],
  ["Percheron (drowsy, vertical gaze, amnesia)", "reduced_consciousness@none vertical_gaze_palsy@none amnesia@none", { first: /^thalamus_bilateral_percheron$/, single: true }],

  // ---- deep and cortical ----
  // Pure motor hemiparesis: capsule, corona radiata and basis pontis are all correct lacunar answers.
  ["Pure motor hemiparesis", "facial_weakness@right forehead_spared@right weak_arm@right weak_leg@right", { first: /^left_(subcortex_(internal_capsule|corona_radiata)|pons_basis_pontis)$/, single: true }],
  ["Pure sensory stroke (face, arm, leg)", "spinothalamic@right dorsal_sensory@right face_sensory_loss@right", { first: /^left_subcortex_thalamus$/, single: true }],
  ["Hemibody pain-temperature loss alone", "spinothalamic@left", { first: /^right_subcortex_thalamus$/ }],
  ["Thalamic pain", "thalamic_pain@left", { first: /^right_subcortex_thalamus$/ }],
  ["Sensorimotor stroke", "weak_arm@right weak_leg@right spinothalamic@right dorsal_sensory@right", { first: /^left_subcortex_sensorimotor$/, single: true }],
  ["Anterior choroidal triad", "weak_arm@right weak_leg@right spinothalamic@right homonymous_hemianopia@right", { first: /^left_subcortex_anterior_choroidal$/, single: true }],
  ["Complete dominant MCA", "speech_nonfluent@none comprehension_impaired@none weak_arm@right facial_weakness@right forehead_spared@right homonymous_hemianopia@right", { first: /^left_cortex_mca$/, single: true }],
  ["Complete non-dominant MCA", "neglect@left anosognosia@none weak_arm@left facial_weakness@left forehead_spared@left homonymous_hemianopia@left", { first: /^right_cortex_mca$/, single: true }],
  ["ACA with incontinence", "weak_leg@right cortical_sensory_leg@right abulia@none urinary_incontinence@none", { first: /^left_cortex_aca$/, single: true }],
  ["PCA — hemianopia with macular sparing", "homonymous_hemianopia@right macular_sparing@right", { first: /^left_cortex_(occipital|pca)$/, single: true }],
  ["Broca with anomia and face-arm weakness", "speech_nonfluent@none naming_impaired@none weak_arm@right facial_weakness@right forehead_spared@right", { first: /^left_cortex_mca_superior$/, single: true }],
  ["Wernicke with anomia", "comprehension_impaired@none repetition_impaired@none naming_impaired@none", { first: /^left_cortex_temporoparietal$/, single: true }],
  ["Wernicke with hemianopia (inferior division)", "comprehension_impaired@none repetition_impaired@none naming_impaired@none homonymous_hemianopia@right", { first: /^left_cortex_mca_inferior$/, single: true }],
  ["Conduction aphasia", "repetition_impaired@none", { first: /^left_cortex_arcuate$/ }],
  ["Gerstmann tetrad", "agraphia@none acalculia@none finger_agnosia@none left_right_disorientation@none", { first: /^left_cortex_parietal$/, single: true }],
  ["Isolated anomia", "naming_impaired@none", { first: /^left_cortex_angular$/ }],
  ["Cortical hand", "weak_hand@right", { first: /^left_cortex_hand_knob$/ }],
  ["UMN face (forehead spared)", "facial_weakness@left forehead_spared@left", { first: /^right_(cortex|subcortex)_/ }],
  ["Hemiparesis alone", "weak_arm@right weak_leg@right", { first: /^left_(subcortex|cortex)_/ }],
  ["Arm weakness alone", "weak_arm@right", { first: /^left_(cortex|subcortex)_/ }],
  // Ataxic hemiparesis: basis pontis and the capsule/corona are all recognised lacunar sites.
  ["Ataxic hemiparesis", "weak_leg@right limb_ataxia@right", { top: [3, /^left_(pons_basis_pontis|subcortex_)/] }],
  ["Parkinsonism", "bradykinesia@left rest_tremor@left rigidity@left", { first: /^right_basal_ganglia_substantia_nigra$/, single: true }],
  ["Hemiballismus", "hemiballismus@left", { first: /^right_basal_ganglia_subthalamic$/ }],
  ["Cerebellar hemisphere", "limb_ataxia@left dysmetria@left intention_tremor@left dysdiadochokinesis@left", { first: /^left_cerebellum_hemisphere$/, single: true }],
  ["Vermis", "truncal_ataxia@none", { first: /^cerebellum_vermis$/ }],
  // HINTS central with ataxia: lateral medulla and cerebellum are both correct.
  ["HINTS central + ataxia", "cn8_vertigo@left skew_deviation@none nystagmus_gaze_evoked@none limb_ataxia@left", { top: [2, /^left_(medulla_lateral|cerebellum_hemisphere|medulla_hemi)$/] }],

  // ---- visual pathway ----
  ["Chiasm", "bitemporal_hemianopia@midline", { first: /^visual_pathway_chiasm$/ }],
  ["Optic neuritis", "central_scotoma@left rapd@left", { first: /^left_skull_base_optic_neuritis$/, single: true }],
  ["Central retinal artery occlusion", "retinal_pallor@left va_reduced_no_pinhole@left", { first: /^left_visual_pathway_retina$/, single: true }],

  // ---- cranial nerves and skull base ----
  ["Bell's palsy (forehead weak)", "facial_weakness@left forehead_involved@left", { first: /^left_skull_base_vii_stylomastoid$/ }],
  ["Facial nerve + hyperacusis + taste", "facial_weakness@left forehead_involved@left hyperacusis@left taste_loss@left", { first: /^left_skull_base_vii_(tympanic|geniculate)$/, single: true }],
  ["CN III compressive (pupil involved)", "ptosis@left weak_adduction@left weak_elevation@left weak_depression@left fixed_dilated_pupil@left", { first: /^left_pupil_cn3_compressive$/, single: true }],
  ["CN III pupil-sparing", "ptosis@left weak_adduction@left weak_elevation@left weak_depression@left", { first: /^left_pupil_cn3_ischaemic$/, single: true }],
  ["CN VI", "weak_abduction@left", { first: /^left_skull_base_vi_/ }],
  ["CN IV", "vertical_diplopia@left weak_depression@left", { top: [2, /trochlear/] }],
  ["Cavernous sinus", "weak_abduction@left ptosis@left weak_adduction@left v1_sensory@left v2_sensory@left", { first: /^left_skull_base_cavernous_sinus$/, single: true }],
  ["CPA (vestibular schwannoma)", "hearing_loss@left v1_sensory@left facial_weakness@left limb_ataxia@left", { first: /^left_skull_base_cpa$/, single: true }],
  ["Jugular foramen (Vernet)", "gag_afferent_loss@left palatal_weakness@left vocal_cord_palsy@left weak_scm@left weak_trapezius@left", { first: /^left_skull_base_jugular_foramen$/, single: true }],
  ["Collet-Sicard", "palatal_weakness@left vocal_cord_palsy@left weak_scm@left weak_trapezius@left cn12_palsy@left gag_afferent_loss@left", { first: /^left_skull_base_collet_sicard$/, single: true }],
  // Horner alone does not localise along the three-neurone chain; any point on it is correct.
  ["Horner (ptosis + miosis)", "ptosis@left miosis@left", { top: [3, /sympathetic|carotid|medulla_lateral|pons_lateral/] }],
  ["Pancoast", "weak_finger_abduction@left sensory_c8@left sensory_t1@left miosis@left ptosis@left", { first: /^left_sympathetic_pancoast$/, single: true }],

  // ---- vestibular ----
  ["Vestibular neuritis", "cn8_vertigo@left nystagmus_peripheral@none head_impulse_abnormal@none", { first: /^left_peripheral_vestibular_labyrinth$/, single: true }],
  ["Labyrinthitis (with hearing loss)", "cn8_vertigo@left hearing_loss@left nystagmus_peripheral@none head_impulse_abnormal@none", { first: /^left_peripheral_vestibular_labyrinth$/, single: true }],
  // Vertigo + hearing loss without HINTS: the labyrinth first, AICA stroke must still be on the list.
  ["Vertigo + hearing loss — AICA on the list", "cn8_vertigo@left hearing_loss@left", { top: [3, /^left_pons_lateral$/] }],
  ["Posterior-canal BPPV", "nystagmus_positional_posterior@none cn8_vertigo@left", { first: /^left_peripheral_vestibular_posterior_canal$/, single: true }],
  ["Isolated vertigo", "cn8_vertigo@left", { first: /^left_peripheral_vestibular_posterior_canal$/ }],

  // ---- cord and below ----
  ["Brown-Sequard", "weak_leg@left dorsal_sensory@left spinothalamic@right babinski@left", { first: /^left_cord_hemi$/, single: true }],
  ["Anterior cord with sphincter", "weak_leg@left weak_leg@right spinothalamic@left spinothalamic@right sphincter_dysfunction@midline", { first: /^bilateral_cord_anterior$/, single: true }],
  ["Transverse myelopathy with sphincter", "weak_leg@left weak_leg@right spinothalamic@left spinothalamic@right dorsal_sensory@left dorsal_sensory@right sphincter_dysfunction@midline", { first: /^bilateral_cord_transverse$/, single: true }],
  // Cord compression: anterior and transverse are both correct cross-sections for this picture.
  ["Cord compression with retention", "weak_leg@left weak_leg@right babinski@left babinski@right sphincter_dysfunction@midline spinothalamic@left spinothalamic@right", { first: /^bilateral_cord_(anterior|transverse)$/, single: true }],
  ["Cervical myelopathy", "weak_arm@left weak_arm@right weak_leg@left weak_leg@right babinski@left babinski@right hoffmann@left hoffmann@right dorsal_sensory@left dorsal_sensory@right", { first: /^bilateral_cord_transverse$/, single: true }],
  ["Central cord / syrinx", "suspended_sensory@left suspended_sensory@right", { first: /^bilateral_cord_central$/ }],
  ["Subacute combined degeneration", "dorsal_sensory@left dorsal_sensory@right sensory_ataxia@none babinski@left babinski@right reflex_ankle_loss@left reflex_ankle_loss@right", { first: /^combined_degeneration_scd$/, single: true }],
  // Saddle + sphincter alone: conus and cauda are both correct until the reflexes or the pain decide.
  ["Saddle anaesthesia + sphincter", "saddle_anaesthesia@midline sphincter_dysfunction@midline", { top: [2, /^(cauda_equina|conus_medullaris)$/] }],
  ["Cauda equina, asymmetric ankle jerk", "saddle_anaesthesia@midline sphincter_dysfunction@midline reflex_ankle_loss@right radicular_pain@midline", { first: /^cauda_equina$/, single: true }],
  ["Conus", "saddle_anaesthesia@midline sphincter_dysfunction@midline umn_signs@midline", { first: /^conus_medullaris$/, single: true }],

  // ---- roots, plexus, nerves ----
  ["L5 radiculopathy", "weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_hip_abduction@left sensory_l5@left", { first: /^left_root_l5$/, single: true }],
  ["S1 radiculopathy", "weak_ankle_plantarflexion@left sensory_s1@left reflex_ankle_loss@left", { first: /^left_root_s1$/, single: true }],
  ["Common peroneal palsy", "weak_ankle_dorsiflexion@left weak_foot_eversion@left peroneal_sensory@left", { first: /^left_nerve_peroneal_common$/, single: true }],
  // Foot drop with weak inversion: L4 and L5 both supply tibialis anterior and posterior.
  ["Foot drop with weak inversion", "weak_ankle_dorsiflexion@left weak_foot_inversion@left", { top: [2, /^left_root_l5$/] }],
  ["Carpal tunnel", "median_sensory@left weak_thumb_abduction@left", { first: /^left_nerve_median_carpal_tunnel$/, single: true }],
  // The ulnar claw is deliberately absent: it is WORSE with the distal (wrist) lesion — the ulnar paradox.
  ["Ulnar neuropathy at the elbow", "ulnar_sensory@left ulnar_dorsal_sensory@left weak_finger_abduction@left", { first: /^left_nerve_ulnar_elbow$/, single: true }],
  ["Radial nerve, spiral groove", "weak_wrist_extension@left weak_finger_extension@left radial_sensory@left", { first: /^left_nerve_radial_spiral_groove$/, single: true }],
  // Erb: C5 root and upper trunk give the same picture; both are correct.
  ["Erb (upper trunk)", "weak_shoulder_abduction@left weak_elbow_flexion@left weak_shoulder_external_rotation@left sensory_c5@left reflex_biceps_loss@left", { top: [2, /^left_(plexus_upper_trunk|root_c5)$/] }],
  ["Femoral neuropathy", "weak_knee_extension@left reflex_knee_loss@left femoral_sensory@left", { first: /^left_nerve_femoral$/, single: true }],
  ["Meralgia paraesthetica", "lat_fem_cutaneous_sensory@left", { first: /^left_nerve_lat_fem_cutaneous$/ }],
  ["Length-dependent neuropathy with areflexia", "distal_sensory_loss@left distal_sensory_loss@right reflex_ankle_loss@left reflex_ankle_loss@right", { first: /^polyneuropathy_length_dependent$/, single: true }],
  ["Guillain-Barré (symmetric LMN + areflexia)", "lmn_weakness@left lmn_weakness@right reflex_knee_loss@left reflex_knee_loss@right reflex_ankle_loss@left reflex_ankle_loss@right", { first: /^polyradiculoneuropathy_acute$/, single: true }],
  ["Bilateral LMN facial weakness", "facial_weakness@left facial_weakness@right forehead_involved@left forehead_involved@right", { first: /^polyradiculoneuropathy_acute$/ }],

  // ---- motor unit ----
  ["Ocular myasthenia, one side", "fatigable_ocular@left", { first: /^motor_unit_nmj_postsynaptic$/ }],
  ["Unilateral fasciculations", "fasciculations@left", { first: /^motor_unit_anterior_horn$/ }],
  ["Lambert-Eaton", "facilitating_weakness@left facilitating_weakness@right proximal_weakness@left proximal_weakness@right autonomic_features@left autonomic_features@right", { first: /^motor_unit_nmj_presynaptic$/, single: true }],
];

for (const [label, toks, want] of CASES) {
  const r = solve(new Set(L(toks)), { dominantSide: "left" });
  const ids = r.display.map(c => c.site.id);
  if (want.first) ok(`${label}: first is ${want.first}`, want.first.test(ids[0] || ""), `got ${ids.slice(0, 3).join(", ")}`);
  if (want.top) {
    const [k, re] = want.top;
    ok(`${label}: in the top ${k}`, ids.slice(0, k).some(id => re.test(id)), `got ${ids.slice(0, k).join(", ")}`);
  }
  if (want.single) ok(`${label}: no false multifocal claim`, r.multi === null && r.singleExplainsAll,
    r.multi ? `multi = ${r.multi.sites.map(s => s.id).join(" + ")}` : "no single site explains all");
}

// ---- functional: positive functional signs with no organic sign raise the flag ----
ok("Functional leg weakness raises the functional flag",
   functionalFlag(new Set(["weak_leg@left", "hoovers_sign@none", "give_way_weakness@none"])).functional === true);

console.log(`\nclinical vignettes: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to record the red baseline**

Run: `node test/clinical-vignettes.test.js | tail -1`
Expected: `clinical vignettes: 112 passed, 30 failed`. (Measured on `main` at `c184fdc`. The failures are the
audit's findings; every later task turns some of them green. The complete set reaches 142/0 at Task 9.)

- [ ] **Step 3: Commit (not yet in the npm chain)**

```bash
git add test/clinical-vignettes.test.js
git commit -m "test: clinical vignette suite — the engine against the bedside (red baseline 112/30)

Not yet in the npm test chain; it joins in the round's close-out once green.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Structure emission override (spec A2)

**Files:**
- Modify: `src/engine/forward.js` (`expectedFindings` emission branch; `explain` sides branch)
- Create: `test/accuracy-mechanisms.test.js`
- Modify: `package.json` (add the new suite to the `test` chain, after `test/ranking-realism.test.js`)

**Interfaces:**
- Produces: an optional structure field `emit: "midline" | "bilateral"`. `"midline"` emits `${f}@midline`
  whatever the site side; `"bilateral"` emits `@left` and `@right` from any site. NON_LATERALISED findings
  still emit `@none` first. Used by Tasks 7 (cord sphincter, cauda ankle jerk).

- [ ] **Step 1: Write the failing test**

Create `test/accuracy-mechanisms.test.js`:

```js
// accuracy-mechanisms.test.js — the engine mechanisms added by accuracy round 1 (spec 2026-09-25 §4A).
// Content (which structures sit where) is asserted in the regional suites; this suite pins the machinery.
import { STRUCTURE_BY_ID } from "../src/model/structures.js";
import { expectedFindings, explain } from "../src/engine/forward.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };

// ---- A2: structure emission override ----
// Synthetic structures, injected and removed again, so the mechanism is tested independently of content.
{
  STRUCTURE_BY_ID.zz_emit_mid = { id: "zz_emit_mid", level: "cord", part: "zz", produces: "sphincter_dysfunction", emit: "midline" };
  STRUCTURE_BY_ID.zz_emit_bi = { id: "zz_emit_bi", level: "cauda", part: "zz", produces: "reflex_ankle_loss", emit: "bilateral" };
  STRUCTURE_BY_ID.zz_plain = { id: "zz_plain", level: "cauda", part: "zz", produces: "saddle_anaesthesia" };
  const bilat = { id: "zz_bilat", side: "bilateral", level: "cord", part: "zz", structures: ["zz_emit_mid"] };
  const mid = { id: "zz_mid", side: "midline", level: "cauda", part: "zz", structures: ["zz_emit_bi", "zz_plain"] };
  const left = { id: "zz_left", side: "left", level: "cauda", part: "zz", structures: ["zz_emit_bi"] };
  const eb = expectedFindings(bilat), em = expectedFindings(mid), el = expectedFindings(left);
  ok("emit:'midline' at a BILATERAL site emits @midline only",
     eb.has("sphincter_dysfunction@midline") && !eb.has("sphincter_dysfunction@left") && !eb.has("sphincter_dysfunction@right"));
  ok("emit:'bilateral' at a MIDLINE site emits @left and @right, not @midline",
     em.has("reflex_ankle_loss@left") && em.has("reflex_ankle_loss@right") && !em.has("reflex_ankle_loss@midline"));
  ok("a structure without `emit` keeps the site's own rule (midline site → @midline)", em.has("saddle_anaesthesia@midline"));
  ok("emit:'bilateral' at a one-sided site still emits both sides",
     el.has("reflex_ankle_loss@left") && el.has("reflex_ankle_loss@right"));
  const xm = explain(mid).filter(e => e.structure === "zz_emit_bi").map(e => e.bodySide).sort();
  ok("explain() agrees with expectedFindings() for emit:'bilateral'", JSON.stringify(xm) === JSON.stringify(["left", "right"]));
  const xb = explain(bilat).map(e => e.bodySide);
  ok("explain() agrees with expectedFindings() for emit:'midline'", JSON.stringify(xb) === JSON.stringify(["midline"]));
  delete STRUCTURE_BY_ID.zz_emit_mid; delete STRUCTURE_BY_ID.zz_emit_bi; delete STRUCTURE_BY_ID.zz_plain;
}

console.log(`\naccuracy mechanisms: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node test/accuracy-mechanisms.test.js`
Expected: FAIL on the four emission assertions and both `explain()` assertions.

- [ ] **Step 3: Implement the override in `src/engine/forward.js`**

In `expectedFindings`, replace:

```js
    const f = struct.produces;
    if (NON_LATERALISED.has(f)) {
      out.add(signed(f, "none"));
    } else if (site.side === "midline") {
```

with:

```js
    const f = struct.produces;
    if (NON_LATERALISED.has(f)) {
      out.add(signed(f, "none"));
    } else if (struct.emit === "midline") {
      // A finding with no side of its own (bladder control) produced by a BILATERAL site must match the
      // token the midline sites emit, or cord compression with retention reads as two lesions.
      out.add(signed(f, "midline"));
    } else if (struct.emit === "bilateral") {
      // A lateralised finding (an ankle jerk) produced by a MIDLINE site: the clinician records it per side.
      out.add(signed(f, "left"));
      out.add(signed(f, "right"));
    } else if (site.side === "midline") {
```

In `explain`, replace:

```js
    const sides = NON_LATERALISED.has(f) ? ["none"]
      : site.side === "midline" ? ["midline"]
```

with:

```js
    const sides = NON_LATERALISED.has(f) ? ["none"]
      : s.emit === "midline" ? ["midline"]
      : s.emit === "bilateral" ? ["left", "right"]
      : site.side === "midline" ? ["midline"]
```

Also extend the file-top comment block of `expectedFindings` ("Emission per structure:") with one line:
`//   - a structure's own \`emit\` ("midline" | "bilateral") overrides the site-side rule below`.

- [ ] **Step 4: Run the test and the full suite**

Run: `node test/accuracy-mechanisms.test.js && npm test 2>&1 | grep -c "^FAIL"`
Expected: the new suite passes; the full-suite FAIL count is `0` (no existing structure uses `emit`).

- [ ] **Step 5: Add the suite to the chain and commit**

In `package.json`, in the `test` script, insert ` && node test/accuracy-mechanisms.test.js` immediately after
`node test/ranking-realism.test.js`.

```bash
git add src/engine/forward.js test/accuracy-mechanisms.test.js package.json
git commit -m "feat: structure emission override (emit: midline | bilateral)

A structure may override the site-side emission rule, so a bilateral cord site can emit bladder
dysfunction @midline (matching cauda/conus) and a midline cauda site can emit an ankle jerk per side.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Asymmetry-tolerant sites (spec A1, rulings 3 and 4)

**Files:**
- Modify: `src/model/sites.js` (`composeMotorUnitSites`, `composeCaudaConusSites`)
- Modify: `src/engine/inverse.js` (`differential`, `ruledOutSites`)
- Modify: `test/accuracy-mechanisms.test.js`

**Interfaces:**
- Produces: `site.asymmetric === true` on the four `motor_unit_*` sites and `cauda_equina`. `differential()`
  and `ruledOutSites()` never exclude an asymmetric site by a known negative.

- [ ] **Step 1: Add the failing tests**

In `test/accuracy-mechanisms.test.js`, add to the imports:

```js
import { candidateSites, differential, ruledOutSites } from "../src/engine/inverse.js";
```

and insert before the final `console.log`:

```js
// ---- A1: asymmetry-tolerant sites (owner rulings 2026-09-25) ----
{
  const cs = candidateSites();
  const byId = id => cs.find(s => s.id === id);
  const asym = ["motor_unit_anterior_horn", "motor_unit_nmj_postsynaptic", "motor_unit_nmj_presynaptic", "motor_unit_muscle", "cauda_equina"];
  ok("the four motor-unit sites and the cauda equina are asymmetric", asym.every(id => byId(id)?.asymmetric === true),
     asym.filter(id => byId(id)?.asymmetric !== true).join(", "));
  const sym = ["conus_medullaris", "polyneuropathy_length_dependent", "combined_degeneration_scd", "combined_degeneration_friedreich", "locked_in", "bilateral_cord_transverse"];
  ok("symmetric-by-definition sites are NOT asymmetric", sym.every(id => byId(id) && !byId(id).asymmetric),
     sym.filter(id => byId(id)?.asymmetric).join(", "));
  const ids = toks => differential(new Set(toks), { dominantSide: "left" }).map(c => c.site.id);
  ok("one-sided fatigable ptosis keeps myasthenia as a candidate", ids(["fatigable_ocular@left"]).includes("motor_unit_nmj_postsynaptic"));
  ok("one-sided fasciculations keep the anterior horn as a candidate", ids(["fasciculations@left"]).includes("motor_unit_anterior_horn"));
  ok("one-sided LMN weakness is no longer a dead end", ids(["lmn_weakness@left"]).length > 0);
  ok("a symmetric site is still excluded by a one-sided entry (distal sensory loss, left only)",
     !ids(["distal_sensory_loss@left"]).includes("polyneuropathy_length_dependent"));
  const ruled = ruledOutSites(new Set(["fatigable_ocular@left", "fasciculations@left"]), { dominantSide: "left" });
  ok("ruledOutSites never lists an asymmetric site", !ruled.some(x => x.site.asymmetric), ruled.map(x => x.site.id).join(", "));
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `node test/accuracy-mechanisms.test.js`
Expected: FAIL on the first asymmetric assertion, the three candidate assertions and the ruled-out one.

- [ ] **Step 3: Flag the sites in `src/model/sites.js`**

In `composeMotorUnitSites`, replace:

```js
    sites.push({ id: `motor_unit_${part}`, side: "bilateral", level: "motor_unit", part,
      territory: TERRITORY[`motor_unit|${part}`], structures, composite: true });
```

with:

```js
    // ASYMMETRIC (owner ruling 2026-09-25): the motor-unit diseases often present on one side first —
    // unilateral fatigable ptosis is classic myasthenia, and MND starts in one limb. The site still predicts
    // BOTH sides (the un-entered side is an ordinary unreported prediction), but the known-negative filter
    // must not treat the other side as examined-and-normal and exclude the whole disease.
    sites.push({ id: `motor_unit_${part}`, side: "bilateral", level: "motor_unit", part,
      territory: TERRITORY[`motor_unit|${part}`], structures, composite: true, asymmetric: true });
```

In `composeCaudaConusSites`, replace:

```js
  return [ ...build("cauda_equina", "cauda", "equina"),
```

with:

```js
  // The cauda equina is often ASYMMETRIC (its own phonebook note says so; owner ruling 2026-09-25) — one
  // absent ankle jerk must not exclude it. The conus is early and symmetric by its own description.
  return [ ...build("cauda_equina", "cauda", "equina").map(s => ({ ...s, asymmetric: true })),
```

- [ ] **Step 4: Honour the flag in `src/engine/inverse.js`**

In `differential`, replace:

```js
    for (const neg of negatives) if (exp.has(neg)) { contradicted = true; break; } // known-negative → not a candidate
```

with:

```js
    // An ASYMMETRIC site (motor-unit disease, cauda equina) may present on one side: the un-entered side is
    // not evidence against it, so the known-negative exclusion does not apply to it.
    if (!site.asymmetric) for (const neg of negatives) if (exp.has(neg)) { contradicted = true; break; } // known-negative → not a candidate
```

In `ruledOutSites`, replace:

```js
    let contradictedBy = null;
```

with:

```js
    if (site.asymmetric) continue; // never excluded by a known negative, so never "ruled out" by one
    let contradictedBy = null;
```

- [ ] **Step 5: Run the test and the full suite**

Run: `node test/accuracy-mechanisms.test.js && npm test 2>&1 | grep -c "^FAIL"`
Expected: the suite passes; full-suite FAIL count `0`.

- [ ] **Step 6: Commit**

```bash
git add src/model/sites.js src/engine/inverse.js test/accuracy-mechanisms.test.js
git commit -m "feat: asymmetry-tolerant motor-unit and cauda sites

Unilateral fatigable ptosis now keeps myasthenia; one-sided fasciculations, LMN weakness and the other
motor-unit findings no longer return zero candidates. Owner rulings 3 and 4 (spec 2026-09-25).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Tighter-fit ranking + polyneuropathy prior (spec A3, A6)

**Files:**
- Modify: `src/engine/inverse.js` (the `cands.sort` comparator in `differential`)
- Modify: `src/model/prevalence.js`
- Modify: `test/differential.test.js:50-58` (the ordering assertion encodes the old rule)
- Modify: `test/accuracy-mechanisms.test.js`

**Interfaces:**
- Produces: `export const PREVALENCE_ALLOWANCE = 3` and `export function rankKey(c)` from `inverse.js`,
  where `rankKey(c) = c.over - PREVALENCE_ALLOWANCE * c.prevalence`. Differential order: `n` desc →
  `rankKey` asc → prevalence desc → over asc → id asc.

- [ ] **Step 1: Add the failing tests**

In `test/accuracy-mechanisms.test.js`, add to the imports:

```js
import { PREVALENCE_ALLOWANCE, rankKey, solve } from "../src/engine/inverse.js";
import { prevalenceOf, COMMON, UNCOMMON, RARE } from "../src/model/prevalence.js";
```

(merge `solve`, `PREVALENCE_ALLOWANCE`, `rankKey` into the existing `inverse.js` import line), and insert before
the final `console.log`:

```js
// ---- A3: tighter-fit ranking ----
{
  ok("each prevalence tier is worth 3 unreported predictions", PREVALENCE_ALLOWANCE === 3);
  ok("rankKey = over − 3 × prevalence", rankKey({ over: 7, prevalence: 2 }) === 1 && rankKey({ over: 0, prevalence: 0 }) === 0);
  // Transitivity: the order must be a total preorder, or Array.sort is undefined. Check every pair of a
  // large real differential against the documented key.
  const d = differential(new Set(["weak_arm@left"]), { dominantSide: "left" });
  let consistent = true;
  for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) {
    const a = d[i], b = d[j];
    const before = a.n > b.n || (a.n === b.n && (rankKey(a) < rankKey(b) || (rankKey(a) === rankKey(b)
      && (a.prevalence > b.prevalence || (a.prevalence === b.prevalence && (a.over < b.over
      || (a.over === b.over && a.site.id.localeCompare(b.site.id) <= 0)))))));
    if (!before) consistent = false;
  }
  ok(`the differential is a total order under the documented key (${d.length} candidates)`, consistent);
  const first = toks => solve(new Set(toks), { dominantSide: "left" }).display[0]?.site.id;
  ok("thalamic pain → the thalamus, not the sensorimotor stroke that predicts 7 unreported signs",
     first(["thalamic_pain@left"]) === "right_subcortex_thalamus", first(["thalamic_pain@left"]));
}

// ---- A6: prevalence ordering ----
{
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  ok("length-dependent polyneuropathy is COMMON (the bilateral rule no longer shadows it)",
     prevalenceOf(byId("polyneuropathy_length_dependent")) === COMMON);
  ok("other bilateral sites stay RARE", ["locked_in", "motor_unit_muscle", "bilateral_cord_transverse"].every(id => prevalenceOf(byId(id)) === RARE));
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `node test/accuracy-mechanisms.test.js`
Expected: FAIL (import error first — `PREVALENCE_ALLOWANCE`/`rankKey` are not exported).

- [ ] **Step 3: Implement the ranking key in `src/engine/inverse.js`**

Directly above `export function differential(`, add:

```js
// ---- ranking (accuracy round 1, spec 2026-09-25 A3) ----
// Coverage first, always. Among sites that explain the same number of findings, the old order put
// PREVALENCE before tightness, so a common site predicting seven signs the patient does not have beat an
// uncommon site predicting exactly what was entered (hemisensory loss → "sensorimotor stroke"; thalamic
// pain → the same). Now each prevalence tier is worth PREVALENCE_ALLOWANCE unreported predictions.
// A LINEAR key, deliberately: the pairwise rule first measured ("tighter wins when the gap is ≥ 3") is not
// transitive — three sites can beat each other in a cycle — and gave identical results on every measured
// set (84 vignettes, 364 complete pictures, 233 single findings) while this one is a total order.
export const PREVALENCE_ALLOWANCE = 3;
export const rankKey = c => c.over - PREVALENCE_ALLOWANCE * c.prevalence;
```

Replace the sort line in `differential`:

```js
  cands.sort((a, b) => b.n - a.n || b.prevalence - a.prevalence || a.over - b.over || a.site.id.localeCompare(b.site.id));
```

with:

```js
  cands.sort((a, b) => b.n - a.n || rankKey(a) - rankKey(b) || b.prevalence - a.prevalence
    || a.over - b.over || a.site.id.localeCompare(b.site.id));
```

and update the comment line above it to:
`// coverage first (localisation), then fit weighed against prior (rankKey), then prevalence, tightness, id.`

- [ ] **Step 4: Fix the polyneuropathy prior in `src/model/prevalence.js`**

Replace:

```js
  if (site.side === "bilateral") return RARE;   // rare wins
```

with:

```js
  // Bilateral sites are rare EXCEPT where the bilateral picture IS the common disease. A length-dependent
  // polyneuropathy is bilateral by definition and the commonest neurological condition there is; listing it
  // in COMMON_LEVELS did nothing while this rule ran first (accuracy round 1, A6).
  if (site.side === "bilateral") return COMMON_BILATERAL_LEVELS.has(site.level) ? COMMON : RARE;
```

and add, directly after the `COMMON_LEVELS` declaration:

```js
const COMMON_BILATERAL_LEVELS = new Set(["polyneuropathy"]);
```

- [ ] **Step 5: Update the ordering assertion in `test/differential.test.js`**

Add `rankKey` to that file's `inverse.js` import, then replace the loop body and label at lines 50-58:

```js
for (let i = 1; i < d.length; i++) {
  const a = d[i - 1], b = d[i];
  const bad = a.n < b.n
    || (a.n === b.n && a.prevalence < b.prevalence)
    || (a.n === b.n && a.prevalence === b.prevalence && a.over > b.over)
    || (a.n === b.n && a.prevalence === b.prevalence && a.over === b.over && a.site.id.localeCompare(b.site.id) > 0);
  if (bad) { ordered = false; break; }
}
ok("differential is sorted by n desc, prevalence desc, over asc, then site.id asc", ordered);
```

with:

```js
// Accuracy round 1 (2026-09-26): fit is weighed against prior (rankKey) BEFORE prevalence alone — the old
// order let a common site that over-predicts beat an exact uncommon fit. See inverse.js PREVALENCE_ALLOWANCE.
for (let i = 1; i < d.length; i++) {
  const a = d[i - 1], b = d[i];
  const bad = a.n < b.n
    || (a.n === b.n && rankKey(a) > rankKey(b))
    || (a.n === b.n && rankKey(a) === rankKey(b) && a.prevalence < b.prevalence)
    || (a.n === b.n && rankKey(a) === rankKey(b) && a.prevalence === b.prevalence && a.over > b.over)
    || (a.n === b.n && rankKey(a) === rankKey(b) && a.prevalence === b.prevalence && a.over === b.over && a.site.id.localeCompare(b.site.id) > 0);
  if (bad) { ordered = false; break; }
}
ok("differential is sorted by n desc, rankKey asc, prevalence desc, over asc, then site.id asc", ordered);
```

- [ ] **Step 6: Run the tests and the full suite**

Run: `node test/accuracy-mechanisms.test.js && node test/differential.test.js && npm test 2>&1 | grep "^FAIL"`
Expected: both suites pass; no FAIL lines in the full run.

- [ ] **Step 7: Commit**

```bash
git add src/engine/inverse.js src/model/prevalence.js test/differential.test.js test/accuracy-mechanisms.test.js
git commit -m "feat: weigh fit against prior in the differential; polyneuropathy is common

Each prevalence tier is worth 3 unreported predictions, as a linear (transitive) key. Measured: 2 more
vignettes and 8 more complete pictures localise correctly, none worse. test/differential.test.js's
ordering assertion encoded the old prevalence-first rule and is updated to the new key.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: "Forehead also weak" + the AICA lateral pons (spec B12, B13)

**Files:**
- Modify: `src/model/findings.js` (FINDINGS entry + CROSSES)
- Modify: `src/engine/score.js` (LOCALISING)
- Modify: `app/exam-map.js` (VII group)
- Modify: `src/model/structures.js` (13 new structures)
- Modify: `app/examples.js` (Wallenberg gains dysphagia)
- Modify: `test/cranial-nerves.test.js:51-59,89` (exact sets now include the forehead)
- Modify: `test/engine.test.js:77-80` (the two-lesion case needs a medullary sign)
- Modify: `test/discriminators.test.js:59-70`
- Modify: `test/accuracy-mechanisms.test.js`
- Modify: `docs/artifacts/anatomy-model.html`

**Interfaces:**
- Produces: finding id `forehead_involved` (ipsilateral, LOCALISING). The lateral pons predicts
  `facial_weakness`, `forehead_involved`, `hearing_loss`, `face_pain_loss`, `miosis`, `ptosis` ipsilaterally.

- [ ] **Step 1: Add the failing tests**

In `test/accuracy-mechanisms.test.js`, add to the imports:

```js
import { SITE_BY_ID } from "../src/model/sites.js";
import { FINDINGS, CROSSES } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { EXAM_TREE, flattenFindings } from "../app/exam-map.js";
```

and insert before the final `console.log`:

```js
// ---- B13: forehead also weak — the LMN facial discriminator ----
{
  ok("forehead_involved is a finding, ipsilateral, LOCALISING, and in the exam tree",
     !!FINDINGS.forehead_involved && CROSSES.forehead_involved === false && LOCALISING.has("forehead_involved")
     && flattenFindings(EXAM_TREE).includes("forehead_involved"));
  const lmnVII = ["left_skull_base_iam", "left_skull_base_cpa", "left_skull_base_vii_geniculate", "left_skull_base_vii_tympanic",
                  "left_skull_base_vii_mastoid", "left_skull_base_vii_stylomastoid", "left_pons_medial", "left_pons_lateral"];
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  ok("every LMN facial site predicts the forehead weak on the SAME side",
     lmnVII.every(id => expectedFindings(byId(id), { dominantSide: "left" }).has("forehead_involved@left")),
     lmnVII.filter(id => !expectedFindings(byId(id), { dominantSide: "left" }).has("forehead_involved@left")).join(", "));
  ok("the parotid (a single branch) does not predict the forehead", !expectedFindings(byId("left_skull_base_vii_parotid")).has("forehead_involved@left"));
  ok("no UMN facial site predicts it", !expectedFindings(byId("right_cortex_motor_facearm")).has("forehead_involved@left"));
}

// ---- B12: the AICA / lateral inferior pontine syndrome ----
{
  const e = expectedFindings(SITE_BY_ID.left_pons_lateral, { dominantSide: "left" });
  const want = ["facial_weakness@left", "forehead_involved@left", "hearing_loss@left", "face_pain_loss@left", "miosis@left", "ptosis@left"];
  ok("the lateral pons predicts the AICA features, all ipsilateral", want.every(t => e.has(t)), want.filter(t => !e.has(t)).join(", "));
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `node test/accuracy-mechanisms.test.js`
Expected: FAIL on all five new assertions.

- [ ] **Step 3: Add the finding**

In `src/model/findings.js`, after the `forehead_spared:` FINDINGS entry, add:

```js
  forehead_involved: { desc: "Forehead also weak (cannot raise the eyebrow or wrinkle the forehead)", group: "Cranial nerve" },
```

In `CROSSES`, replace `facial_weakness: true, forehead_spared: true,` with:

```js
  facial_weakness: true, forehead_spared: true,
  // the LMN mirror of forehead_spared: the facial nucleus and nerve are ipsilateral to the face they move
  forehead_involved: false,
```

In `src/engine/score.js`, replace `  "forehead_spared",` with:

```js
  "forehead_spared",
  // forehead_involved is the LMN discriminator (the mirror of forehead_spared): without it, isolated facial
  // weakness could never separate Bell's palsy from a cortical lesion (accuracy round 1, B13)
  "forehead_involved",
```

In `app/exam-map.js`, in the `cn7` group, replace `"facial_weakness","forehead_spared",` with
`"facial_weakness","forehead_spared","forehead_involved",`.

- [ ] **Step 4: Add the structures**

In `src/model/structures.js`, directly after the `cn7_fascicle` entry, add:

```js
  { id: "cn7_fasc_forehead", level: "pons", part: "medial", produces: "forehead_involved",
    note: "VII fascicle — LMN, so the forehead is weak too" },
```

Directly after the `cn8_pons_nyst` entry (the last `pons|lateral` row), add:

```js
  // ADDED 2026-09-26 (accuracy round 1, owner-approved B12): the classic AICA / lateral INFERIOR pontine
  // syndrome. The model held only the peduncle, spinothalamic and vestibular rows here, so an AICA stroke
  // with deafness and facial palsy localised to the lateral MEDULLA. All ipsilateral. The Wallenberg-vs-AICA
  // discriminators now EMERGE: bulbar signs (nucleus ambiguus) are medullary; facial palsy and deafness pontine.
  { id: "cn7_nuc_lat", level: "pons", part: "lateral", produces: "facial_weakness", crosses: false,
    note: "facial nucleus (caudal pontine tegmentum) — IPSI LMN facial weakness (AICA)" },
  { id: "cn7_nuc_lat_forehead", level: "pons", part: "lateral", produces: "forehead_involved",
    note: "facial nucleus — LMN, so the forehead is weak too" },
  { id: "cochlear_pons", level: "pons", part: "lateral", produces: "hearing_loss",
    note: "cochlear nuclei / labyrinthine artery (an AICA branch) — IPSI sensorineural deafness" },
  { id: "sp5_pons", level: "pons", part: "lateral", produces: "face_pain_loss",
    note: "spinal trigeminal nucleus and tract (caudal pons) — IPSI facial pain/temperature loss" },
  { id: "sym_pons_miosis", level: "pons", part: "lateral", produces: "miosis",
    note: "descending sympathetic fibres (lateral tegmentum) — IPSI Horner (miosis)" },
  { id: "sym_pons_ptosis", level: "pons", part: "lateral", produces: "ptosis",
    note: "descending sympathetic fibres (lateral tegmentum) — IPSI Horner (ptosis)" },
```

After each LMN VII motor row, add the forehead row — after `iam_vii_motor`:

```js
  { id: "iam_vii_forehead", level: "skull_base", part: "iam", produces: "forehead_involved", note: "IAM — VII LMN, forehead weak" },
```

after `vii_gen_motor`:

```js
  { id: "vii_gen_forehead", level: "skull_base", part: "vii_geniculate", produces: "forehead_involved", note: "geniculate — VII LMN, forehead weak" },
```

after `vii_tym_motor`:

```js
  { id: "vii_tym_forehead", level: "skull_base", part: "vii_tympanic", produces: "forehead_involved", note: "tympanic — VII LMN, forehead weak" },
```

after `vii_mas_motor`:

```js
  { id: "vii_mas_forehead", level: "skull_base", part: "vii_mastoid", produces: "forehead_involved", note: "mastoid — VII LMN, forehead weak" },
```

after `vii_sty_motor`:

```js
  { id: "vii_sty_forehead", level: "skull_base", part: "vii_stylomastoid", produces: "forehead_involved", note: "stylomastoid — VII LMN, forehead weak (Bell's palsy)" },
```

after `cpa_cn7`:

```js
  { id: "cpa_cn7_forehead", level: "skull_base", part: "cpa", produces: "forehead_involved", note: "CPA — VII LMN, forehead weak" },
```

- [ ] **Step 5: Update the assertions that encoded the old exact sets**

`test/cranial-nerves.test.js` lines 51-59 and 89 — add `"forehead_involved"` to each LMN VII set:

```js
ok("iam -> VII triad + motor + VIII hearing",
   eq(baseOf("iam"), ["facial_weakness","forehead_involved","lacrimation_loss","hyperacusis","taste_loss","hearing_loss"]));
ok("vii_geniculate -> motor + lacrimation + hyperacusis + taste",
   eq(baseOf("vii_geniculate"), ["facial_weakness","forehead_involved","lacrimation_loss","hyperacusis","taste_loss"]));
ok("vii_tympanic -> motor + hyperacusis + taste (lacrimation SPARED)",
   eq(baseOf("vii_tympanic"), ["facial_weakness","forehead_involved","hyperacusis","taste_loss"]));
ok("vii_mastoid -> motor + taste (hyperacusis SPARED)",
   eq(baseOf("vii_mastoid"), ["facial_weakness","forehead_involved","taste_loss"]));
ok("vii_stylomastoid -> motor only (taste SPARED)", eq(baseOf("vii_stylomastoid"), ["facial_weakness","forehead_involved"]));
```

and

```js
ok("cpa -> VII + hearing + V1 + ataxia", eq(baseOf("cpa"), ["facial_weakness","forehead_involved","hearing_loss","v1_sensory","limb_ataxia"]));
```

`test/engine.test.js` — the right lateral medulla in the two-lesion case now ties with the right lateral pons,
which is anatomically honest; give it a medullary sign. Replace lines 77-80 with:

```js
// A bulbar sign (dysphagia) is what makes the second lesion MEDULLARY rather than lateral pontine (AICA):
// since accuracy round 1 the lateral pons predicts facial pain loss, crossed body pain loss and Horner too.
check("Two lesions: L midbrain + R lateral medulla",
  ["ptosis@left", "weak_adduction@left", "weak_elevation@left", "weak_depression@left", "weak_arm@right","weak_leg@right",
   "face_pain_loss@right", "spinothalamic@left", "miosis@right","ptosis@right","dysphagia@right"],
  null, { expectMulti: true, anySite: true, expectSites: ["left_midbrain_medial", "right_medulla_lateral"] });
```

`app/examples.js` — replace the Wallenberg comment and tokens:

```js
    // The full syndrome is 13 findings, which nobody records at the bedside. This is the clinically
    // representative seven and still resolves 7/7. DYSPHAGIA is in it on purpose: without a bulbar sign
    // the picture is shared with the AICA lateral pons (accuracy round 1) — the nucleus ambiguus is what
    // makes it medullary.
    tokens: ["cn8_vertigo@left", "face_pain_loss@left", "spinothalamic@right",
             "ptosis@left", "miosis@left", "limb_ataxia@left", "dysphagia@left"],
```

`test/discriminators.test.js` — replace the Wallenberg block (lines 59-70) with two blocks:

```js
// ---- WALLENBERG: two candidates, and the discriminators all point one way ----
{
  const { obs, r } = build(["cn8_vertigo@left", "face_pain_loss@left", "spinothalamic@right",
                            "ptosis@left", "miosis@left", "limb_ataxia@left", "dysphagia@left"]);
  const cands = r.display, d = discriminators(cands, obs);
  ok(`Wallenberg narrows to two (${cands.length})`, cands.length === 2);
  ok("discriminators are offered for the pair", d.length > 0);
  // hemimedullary adds the pyramid and hypoglossal; Wallenberg does not
  const names = d.map(x => x.token);
  ok("a corticospinal or hypoglossal sign is offered, which is what separates them",
     names.some(t => /weak_arm|weak_leg|cn12|babinski|dorsal_sensory/.test(t)), names.slice(0, 6).join(", "));
}

// ---- WALLENBERG WITHOUT A BULBAR SIGN ties with AICA (accuracy round 1) ----
// The lateral pons and the lateral medulla share facial pain loss, crossed body pain loss, Horner, ataxia and
// vertigo. What separates them is exactly what the compare panel must offer: bulbar signs point to the
// medulla, facial palsy and deafness to the pons.
{
  const { obs, r } = build(["cn8_vertigo@left", "face_pain_loss@left", "spinothalamic@right",
                            "ptosis@left", "miosis@left", "limb_ataxia@left"]);
  const ids = r.display.map(c => c.site.id);
  ok("without a bulbar sign, the lateral pons and lateral medulla are both candidates",
     ids.includes("left_medulla_lateral") && ids.includes("left_pons_lateral"), ids.join(", "));
  const pair = r.display.filter(c => c.site.id === "left_medulla_lateral" || c.site.id === "left_pons_lateral");
  const names = discriminators(pair, obs).map(x => x.token);
  ok("the discriminators name a bulbar sign AND a facial-or-hearing sign",
     names.some(t => /dysphagia|palatal|vocal_cord/.test(t)) && names.some(t => /facial_weakness|forehead_involved|hearing_loss/.test(t)),
     names.join(", "));
}
```

- [ ] **Step 6: Anatomy sheet rows**

In `docs/artifacts/anatomy-model.html` insert after anchor `cn7_fascicle`:

```html
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">cn7_fasc_forehead</div><div class="fn">forehead weak too — LMN (added 2026-09-26)</div></div></div>
```

after anchor `cn8_pons_nyst`:

```html
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">cn7_nuc_lat</div><div class="fn">whole-hemiface weakness — facial nucleus, the AICA palsy (added 2026-09-26)</div></div></div>
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">cn7_nuc_lat_forehead</div><div class="fn">forehead weak too — LMN</div></div></div>
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">cochlear_pons</div><div class="fn">sensorineural deafness — cochlear nuclei / <b>labyrinthine artery, an AICA branch</b>: deafness is what separates AICA from PICA</div></div></div>
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">sp5_pons</div><div class="fn">facial pain / temperature loss — spinal trigeminal nucleus, caudal pons</div></div></div>
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">sym_pons_miosis</div><div class="fn">miosis — descending sympathetic, lateral tegmentum</div></div></div>
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">sym_pons_ptosis</div><div class="fn">ptosis — descending sympathetic, lateral tegmentum</div></div></div>
```

after each of `iam_viii`, `vii_gen_motor`, `vii_tym_motor`, `vii_mas_motor`, `vii_sty_motor`, `cpa_cn7`, one row
(ids `iam_vii_forehead`, `vii_gen_forehead`, `vii_tym_forehead`, `vii_mas_forehead`, `vii_sty_forehead`,
`cpa_cn7_forehead`), each:

```html
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">ID_HERE</div><div class="fn">forehead weak too — LMN</div></div></div>
```

- [ ] **Step 7: Run everything**

Run: `node test/accuracy-mechanisms.test.js && node test/cranial-nerves.test.js && node test/engine.test.js && node test/discriminators.test.js && node test/examples.test.js && npm test 2>&1 | grep "^FAIL"`
Expected: all pass; no FAIL lines.

- [ ] **Step 8: Commit**

```bash
git add src/model/findings.js src/engine/score.js app/exam-map.js src/model/structures.js app/examples.js test/ docs/artifacts/anatomy-model.html
git commit -m "feat: 'forehead also weak' finding and the AICA lateral inferior pons

B12 + B13 (owner-approved). Bell's palsy with the forehead weak now localises to the facial nerve; the
AICA picture (facial palsy, deafness, facial + crossed body pain loss, Horner) localises to the lateral
pons instead of the medulla. Existing assertions that encoded the old exact VII sets are updated; the
Wallenberg example and two tests gain dysphagia, the sign that makes the picture medullary.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Vestibular — BPPV vertigo, labyrinthitis hearing, canal priors (spec B3, B4, ruling 8)

**Files:**
- Modify: `src/model/structures.js`, `src/model/prevalence.js`
- Modify: `test/nystagmus.test.js:60-61,99-104`, `test/vestibular-hints.test.js:35-37`, `test/multifocal.test.js:239-245`
- Modify: `test/accuracy-mechanisms.test.js`, `docs/artifacts/anatomy-model.html`

- [ ] **Step 1: Add the failing tests**

Insert before the final `console.log` of `test/accuracy-mechanisms.test.js`:

```js
// ---- B3 / B4 / ruling 8: the vestibular periphery ----
{
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  for (const c of ["posterior_canal", "horizontal_canal", "anterior_canal"])
    ok(`BPPV ${c} predicts vertigo on its own side`, expectedFindings(byId(`left_peripheral_vestibular_${c}`)).has("cn8_vertigo@left"));
  ok("the labyrinth predicts hearing loss (labyrinthitis / Ménière)", expectedFindings(byId("left_peripheral_vestibular_labyrinth")).has("hearing_loss@left"));
  ok("posterior-canal BPPV is COMMON", prevalenceOf(byId("left_peripheral_vestibular_posterior_canal")) === COMMON);
  ok("anterior-canal BPPV is RARE", prevalenceOf(byId("left_peripheral_vestibular_anterior_canal")) === RARE);
  ok("horizontal-canal BPPV stays UNCOMMON", prevalenceOf(byId("left_peripheral_vestibular_horizontal_canal")) === UNCOMMON);
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `node test/accuracy-mechanisms.test.js` — Expected: FAIL on the six new assertions.

- [ ] **Step 3: Add the structures**

In `src/model/structures.js`, after `vest_head_impulse`:

```js
  // ADDED 2026-09-26 (B4, owner-approved): the labyrinth now predicts hearing loss. Vestibular neuritis (no
  // hearing loss) still matches — the hearing becomes an unreported prediction — while labyrinthitis and
  // Ménière no longer read as "labyrinth + CPA". This REVERSES the earlier neuritis-only modelling.
  { id: "vest_periph_hearing", level: "peripheral_vestibular", part: "labyrinth", produces: "hearing_loss",
    note: "cochlea (labyrinthine artery) — IPSI sensorineural hearing loss: labyrinthitis / Ménière" },
```

After `bppv_ant`:

```js
  // ADDED 2026-09-26 (B3): BPPV is VERTIGO — without these, vertigo + a positive Dix-Hallpike read as two lesions.
  { id: "bppv_post_vertigo",  level: "peripheral_vestibular", part: "posterior_canal",  produces: "cn8_vertigo", note: "posterior canal BPPV — brief positional vertigo" },
  { id: "bppv_horiz_vertigo", level: "peripheral_vestibular", part: "horizontal_canal", produces: "cn8_vertigo", note: "horizontal canal BPPV — positional vertigo on rolling" },
  { id: "bppv_ant_vertigo",   level: "peripheral_vestibular", part: "anterior_canal",   produces: "cn8_vertigo", note: "anterior canal BPPV — positional vertigo" },
```

- [ ] **Step 4: Canal priors in `src/model/prevalence.js` (owner ruling 8)**

Replace:

```js
const RARE_PARTS = new Set(["cerebellum/pancerebellar", "cord/transverse"]);
```

with:

```js
// anterior-canal BPPV is the rarest canal (owner ruling 2026-09-26: once the canals predict vertigo, an
// alphabetical tie-break put it first for isolated vertigo)
const RARE_PARTS = new Set(["cerebellum/pancerebellar", "cord/transverse", "peripheral_vestibular/anterior_canal"]);
```

and add `"peripheral_vestibular/posterior_canal",` as a new line inside `COMMON_PARTS` (after
`"subcortex/anterior_choroidal", "subcortex/sensorimotor",`) with the comment
`// posterior-canal BPPV — the commonest cause of vertigo (owner ruling 2026-09-26)`.

- [ ] **Step 5: Update the assertions that encoded the old modelling**

`test/nystagmus.test.js` lines 60-61 (the neuritis-only ruling is reversed by B4):

```js
  // REVERSED 2026-09-26 (owner, B4): the labyrinth predicts hearing loss, so labyrinthitis and Ménière match
  // one site; vestibular neuritis still matches with hearing as an unreported prediction.
  ok("left labyrinth emits hearing_loss@left (labyrinthitis / Ménière)", lab.has("hearing_loss@left"));
```

`test/nystagmus.test.js` lines 99-104:

```js
// isolated cn8_vertigo prefers a PERIPHERAL site over the central nucleus clusters. Since 2026-09-26 the
// BPPV canals predict vertigo and posterior-canal BPPV is COMMON (owner ruling 8), so it leads.
{
  const { best } = solve(new Set(["cn8_vertigo@left"]));
  ok("isolated vertigo -> a peripheral site (posterior-canal BPPV)",
     best && best.site.id === "left_peripheral_vestibular_posterior_canal");
}
```

`test/vestibular-hints.test.js` lines 35-37:

```js
ok("posterior_canal -> positional_posterior + vertigo", eq(baseOf("peripheral_vestibular", "posterior_canal"), ["cn8_vertigo", "nystagmus_positional_posterior"]));
ok("horizontal_canal -> positional_horizontal + vertigo", eq(baseOf("peripheral_vestibular", "horizontal_canal"), ["cn8_vertigo", "nystagmus_positional_horizontal"]));
ok("anterior_canal -> positional_anterior + vertigo", eq(baseOf("peripheral_vestibular", "anterior_canal"), ["cn8_vertigo", "nystagmus_positional_anterior"]));
```

`test/multifocal.test.js` — the mirrored-labyrinth case was built from each labyrinth's full prediction; with
hearing loss added, each side contributes TWO findings and neither alone forces a second lesion. The test is
about the per-entry `collapsesTo` shape, not the labyrinth's contents, so pin the tokens. Replace:

```js
  const toks = new Set([...expectedFindings(left), ...expectedFindings(right)]);
```

with:

```js
  // Explicit tokens, not the two sites' full predictions: since 2026-09-26 each labyrinth also predicts
  // hearing loss, and a side contributing two findings has no SINGLE forcing finding — which is not what
  // this block tests. Vertigo on each side is the one finding the other labyrinth cannot explain.
  const toks = new Set(["nystagmus_peripheral@none", "head_impulse_abnormal@none", "cn8_vertigo@left", "cn8_vertigo@right"]);
  void left; void right;
```

- [ ] **Step 6: Anatomy sheet rows**

After anchor `vest_head_impulse`:

```html
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">vest_periph_hearing</div><div class="fn">hearing loss — the cochlea: <b>labyrinthitis or Ménière</b>, where neuritis spares it (added 2026-09-26)</div></div></div>
```

After anchor `bppv_ant`:

```html
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">bppv_post_vertigo</div><div class="fn">brief positional vertigo — posterior canal</div></div></div>
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">bppv_horiz_vertigo</div><div class="fn">positional vertigo on rolling — horizontal canal</div></div></div>
            <div class="row"><span class="badge bi">IPSI</span><div class="m"><div class="id">bppv_ant_vertigo</div><div class="fn">positional vertigo — anterior canal</div></div></div>
```

- [ ] **Step 7: Run everything**

Run: `node test/accuracy-mechanisms.test.js && node test/nystagmus.test.js && node test/vestibular-hints.test.js && node test/multifocal.test.js && npm test 2>&1 | grep "^FAIL"`
Expected: all pass; no FAIL lines.

- [ ] **Step 8: Commit**

```bash
git add src/model/structures.js src/model/prevalence.js test/ docs/artifacts/anatomy-model.html
git commit -m "feat: BPPV predicts vertigo, the labyrinth predicts hearing loss; canal priors

B3 + B4 + owner ruling 8. BPPV and labyrinthitis no longer read as two lesions. The neuritis-only
labyrinth assertion is reversed by the owner's ruling; the isolated-vertigo and canal-set assertions are
updated; the mirrored-labyrinth multifocal test now pins explicit tokens.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Cord, cauda, neuropathy — sphincter and ankle jerks (spec B1, B5, B6, B7)

**Files:**
- Modify: `src/model/structures.js`, `src/model/sites.js` (`composeBilateralCordSites`)
- Modify: `test/pns.test.js:47-48`, `test/accuracy-mechanisms.test.js`, `docs/artifacts/anatomy-model.html`

- [ ] **Step 1: Add the failing tests**

Insert before the final `console.log` of `test/accuracy-mechanisms.test.js`:

```js
// ---- B1 / B5 / B6 / B7: sphincter and ankle jerks ----
{
  const cs = candidateSites(); const e = id => expectedFindings(cs.find(s => s.id === id), { dominantSide: "left" });
  ok("the bilateral ANTERIOR cord predicts sphincter dysfunction @midline", e("bilateral_cord_anterior").has("sphincter_dysfunction@midline"));
  ok("the TRANSVERSE cord predicts sphincter dysfunction @midline", e("bilateral_cord_transverse").has("sphincter_dysfunction@midline"));
  ok("the central cord does NOT (owner: late and inconsistent)", !e("bilateral_cord_central").has("sphincter_dysfunction@midline"));
  ok("the hemicord does NOT", ![...e("left_cord_hemi")].some(t => t.startsWith("sphincter_dysfunction")));
  ok("the cauda predicts an absent ankle jerk on EACH side", e("cauda_equina").has("reflex_ankle_loss@left") && e("cauda_equina").has("reflex_ankle_loss@right"));
  ok("the cauda does NOT predict knee jerks (owner: ankle only)", ![...e("cauda_equina")].some(t => t.startsWith("reflex_knee_loss")));
  ok("the polyneuropathy predicts absent ankle jerks", e("polyneuropathy_length_dependent").has("reflex_ankle_loss@left"));
  ok("SCD predicts absent ankle jerks", e("combined_degeneration_scd").has("reflex_ankle_loss@right"));
  ok("no cord structure is a standalone site at the composite-only `autonomic` part",
     !cs.some(s => s.level === "cord" && s.part === "autonomic"));
}
```

- [ ] **Step 2: Run to verify it fails** — `node test/accuracy-mechanisms.test.js`, FAIL on the new
  positive assertions.

- [ ] **Step 3: Add the structures**

In `src/model/structures.js`, after `stt_cord`:

```js
  // ADDED 2026-09-26 (accuracy round 1, owner-approved B1): bladder and bowel control from BOTH sides of the
  // cord. A composite-only part (not in sites.js PARTS, like cord|central), pulled in by the bilateral
  // ANTERIOR and TRANSVERSE composites only — sphincter failure needs both descending pathways, so the
  // hemicord does not get it, and in a syrinx it is late and inconsistent (owner: central cord NO).
  // emit:"midline" because bladder function has no side: it must match the token cauda/conus emit.
  { id: "cord_sphincter", level: "cord", part: "autonomic", produces: "sphincter_dysfunction", crosses: false, emit: "midline",
    note: "bilateral descending autonomic pathways — sphincter dysfunction below the level" },
```

After `cauda_bulbo`:

```js
  // ADDED 2026-09-26 (B7): the S1 roots in the cauda carry the ankle jerk. emit:"bilateral" because the
  // clinician records it per side and the cauda site is midline; the site is ASYMMETRIC (owner), so one absent
  // ankle jerk does not exclude it. Knee jerks deliberately NOT added (owner: ankle only).
  { id: "cauda_ankle_reflex", level: "cauda", part: "equina", produces: "reflex_ankle_loss", crosses: false, emit: "bilateral",
    note: "S1 roots in the cauda — ankle jerk lost, often asymmetrically" },
```

After `poly_motor`:

```js
  // ADDED 2026-09-26 (B5): the ankle jerks go first — the longest reflex arc. The site's own note already said so.
  { id: "poly_ankle_reflex", level: "polyneuropathy", part: "length_dependent", produces: "reflex_ankle_loss",
    note: "length-dependent — the ANKLE jerks are lost first (the longest reflex arc)" },
```

After `scd_bab`:

```js
  // ADDED 2026-09-26 (B6): absent ankle jerks WITH extensor plantars — the co-existing B12 neuropathy.
  { id: "scd_ankle_reflex", level: "combined_degeneration", part: "scd", produces: "reflex_ankle_loss",
    note: "SCD — ankle jerks lost with extensor plantars (co-existing neuropathy)" },
```

- [ ] **Step 4: Pull the autonomic part into the bilateral cord composites**

In `src/model/sites.js` `composeBilateralCordSites`, replace:

```js
  const sites = [];
  for (const part of cordParts) {
    const structures = structuresForPart(part);
```

with:

```js
  // Bladder/bowel control (cord|autonomic, composite-only) belongs to the ANTERIOR and TRANSVERSE bilateral
  // lesions only — accuracy round 1, B1.
  const autonomic = structuresForPart("autonomic");
  const sites = [];
  for (const part of cordParts) {
    const structures = [...structuresForPart(part), ...(part === "anterior" ? autonomic : [])];
```

and replace `      structures: belowLevel, composite: true` with
`      structures: [...belowLevel, ...autonomic], composite: true`.

- [ ] **Step 5: Update the polyneuropathy exact-set assertion**

`test/pns.test.js` lines 47-48:

```js
ok("polyneuropathy -> distal sensory + motor + hypotonia + wasting + absent ankle jerks",
   eq(STRUCTURES.filter(s => s.level === "polyneuropathy").map(s => s.produces).sort(), ["distal_motor_weakness","distal_sensory_loss","hypotonia","reflex_ankle_loss","wasting"].sort()));
```

- [ ] **Step 6: Anatomy sheet rows**

After anchor `stt_cord`:

```html
            <div class="row"><span class="badge bm">MIDLINE</span><div class="m"><div class="id">cord_sphincter</div><div class="fn">sphincter dysfunction — <b>bilateral anterior and transverse lesions only</b>; a hemicord or a syrinx does not reliably take the bladder (added 2026-09-26)</div></div></div>
```

After anchor `cauda_bulbo`:

```html
            <div class="row"><span class="badge bb">BILAT</span><div class="m"><div class="id">cauda_ankle_reflex</div><div class="fn">ankle jerk lost — recorded per side, and <b>often asymmetric</b></div></div></div>
```

After anchor `poly_wasting`:

```html
            <div class="row"><span class="badge bb">BILAT</span><div class="m"><div class="id">poly_ankle_reflex</div><div class="fn">ankle jerks lost first — the longest reflex arc</div></div></div>
```

After anchor `scd_bab`:

```html
            <div class="row"><span class="badge bb">BILAT</span><div class="m"><div class="id">scd_ankle_reflex</div><div class="fn">absent ankle jerks <b>with</b> extensor plantars — the co-existing neuropathy</div></div></div>
```

- [ ] **Step 7: Run everything** — `node test/accuracy-mechanisms.test.js && node test/pns.test.js && npm test 2>&1 | grep "^FAIL"`; expected all pass, no FAIL lines.

- [ ] **Step 8: Commit**

```bash
git add src/model/structures.js src/model/sites.js test/ docs/artifacts/anatomy-model.html
git commit -m "feat: cord sphincter, and ankle jerks at the cauda, neuropathy and SCD

B1, B5, B6, B7 (owner-approved). Cord compression with retention is one lesion again; neuropathy with
areflexia, cauda with an absent ankle jerk and SCD with absent ankle jerks all localise to their own site.
The polyneuropathy exact-set assertion gains the ankle jerk.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Supratentorial — MCA hemianopia, naming, ACA, thalamus face, Percheron (spec B2, B8-B11, ruling 7)

**Files:**
- Modify: `src/model/structures.js`, `src/model/sites.js` (`DIVISION`, `composeVascularCortexSites`, `composeAphasiaSites`), `src/model/prevalence.js`
- Modify: `test/cortex.test.js:36`, `test/subcortex.test.js:29-30,124-128`, `test/accuracy-mechanisms.test.js`, `docs/artifacts/anatomy-model.html`

- [ ] **Step 1: Add the failing tests**

Insert before the final `console.log` of `test/accuracy-mechanisms.test.js`:

```js
// ---- B2 / B8 / B9 / B10 / B11 / ruling 7: supratentorial ----
{
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  const e = id => expectedFindings(byId(id), { dominantSide: "left" });
  ok("the complete MCA predicts homonymous hemianopia", e("left_cortex_mca").has("homonymous_hemianopia@right"));
  ok("the MCA inferior division predicts homonymous hemianopia", e("left_cortex_mca_inferior").has("homonymous_hemianopia@right"));
  ok("the MCA superior division does not", !e("left_cortex_mca_superior").has("homonymous_hemianopia@right"));
  ok("Percheron predicts amnesia", e("thalamus_bilateral_percheron").has("amnesia@none"));
  const aph = ["left_cortex_operculum", "left_cortex_temporoparietal", "left_cortex_arcuate", "left_cortex_watershed_anterior",
               "left_cortex_watershed_posterior", "aphasia_global_left", "aphasia_mixed_transcortical_left", "striatocapsular_aphasia_left",
               "left_cortex_mca_superior", "left_cortex_mca_inferior", "left_cortex_mca"];
  ok("every dominant aphasia site predicts anomia", aph.every(id => e(id).has("naming_impaired@none")), aph.filter(id => !e(id).has("naming_impaired@none")).join(", "));
  ok("the non-dominant operculum does not", !expectedFindings(byId("right_cortex_operculum"), { dominantSide: "left" }).has("naming_impaired@none"));
  ok("the ACA predicts incontinence, gait apraxia and alien limb",
     ["urinary_incontinence@none", "gait_apraxia@none", "alien_limb@none"].every(t => e("left_cortex_aca").has(t)));
  ok("the VPL thalamus predicts contralateral facial sensory loss", e("left_subcortex_thalamus").has("face_sensory_loss@right"));
  ok("so does the thalamic-aphasia composite, which hand-lists the VPL rows", e("thalamic_aphasia_left").has("face_sensory_loss@right"));
  ok("the lateral midbrain is RARE (owner ruling 7)", prevalenceOf(byId("left_midbrain_lateral")) === RARE);
}
```

- [ ] **Step 2: Run to verify it fails** — `node test/accuracy-mechanisms.test.js`.

- [ ] **Step 3: Add the structures**

In `src/model/structures.js`, after `ctx_broca_repetition`:

```js
  // ADDED 2026-09-26 (B9): anomia is part of EVERY aphasia (score.js already said so), but only the angular
  // gyrus and the thalamus predicted it, so Broca or Wernicke with anomia read as two lesions.
  { id: "ctx_broca_naming", level: "cortex", part: "operculum", produces: "naming_impaired", hemisphere: "dominant",
    note: "frontal operculum (Broca) — word-finding failure; anomia accompanies every aphasia" },
```

after `ctx_wernicke_repetition`:

```js
  { id: "ctx_wernicke_naming", level: "cortex", part: "temporoparietal", produces: "naming_impaired", hemisphere: "dominant",
    note: "dominant temporoparietal (Wernicke) — anomia with paraphasic errors" },
```

after `ctx_arcuate`:

```js
  { id: "ctx_arcuate_naming", level: "cortex", part: "arcuate", produces: "naming_impaired", hemisphere: "dominant",
    note: "arcuate / supramarginal (conduction) — naming marred by phonemic paraphasias" },
```

after `ctx_tcma`:

```js
  { id: "ctx_tcma_naming", level: "cortex", part: "watershed_anterior", produces: "naming_impaired", hemisphere: "dominant",
    note: "anterior watershed (transcortical motor) — anomia" },
```

after `ctx_tcsa`:

```js
  { id: "ctx_tcsa_naming", level: "cortex", part: "watershed_posterior", produces: "naming_impaired", hemisphere: "dominant",
    note: "posterior watershed (transcortical sensory) — marked anomia" },
```

after `sc_aphasia_nonfluent`:

```js
  { id: "sc_aphasia_naming", level: "aphasia_subcortical", part: "striatocapsular", produces: "naming_impaired", hemisphere: "dominant",
    note: "dominant striatum / internal capsule — anomia of striatocapsular aphasia" },
```

after `thal_pain`:

```js
  // ADDED 2026-09-26 (B11): VPM sits beside VPL, and the pure-sensory lacune is face, arm AND leg — as this
  // site's own phonebook note says. Without it a pure sensory stroke localised to the lateral midbrain.
  { id: "thal_face", level: "subcortex", part: "thalamus", produces: "face_sensory_loss",
    note: "VPM beside VPL — contralateral facial sensory loss (the pure-sensory lacune is face-arm-leg)" },
```

after `thal_vgaze_bilat`:

```js
  // ADDED 2026-09-26 (B8): memory and confusion are the third limb of the Percheron triad (its own note).
  { id: "thal_amnesia_bilat", level: "thalamus_arousal", part: "paramedian", produces: "amnesia", bilateralOnly: true,
    note: "bilateral paramedian (dorsomedial) thalami — amnesia / confusion (Percheron)" },
```

- [ ] **Step 4: Sites**

In `src/model/sites.js` `DIVISION`, replace `  occipital:      { territory: "PCA" }` with:

```js
  occipital:      { territory: "PCA" },
  // ADDED 2026-09-26 (B10, owner-approved): the paracentral lobule (micturition, gait) and the SMA (alien limb)
  // are medial frontal ACA territory. Without them an ACA stroke with incontinence read as two lesions.
  paracentral:    { territory: "ACA" },
  sma:            { territory: "ACA" }
```

In `composeVascularCortexSites` `groups`, replace the `mca_inferior` and `mca` entries with:

```js
    // B2 (2026-09-26, owner-approved): both the inferior division and the complete MCA reach the geniculo-
    // calcarine radiation, so both predict homonymous hemianopia — the inferior division already predicted
    // BOTH quadrantanopias. The superior division does not.
    { part: "mca_inferior", parts: mcaInf, deepParts: ["optic_radiation"], terr: "MCA inferior division (temporoparietal)" },
    { part: "mca", parts: [...mcaSup, ...mcaInf], deepParts: ["internal_capsule", "optic_radiation"], terr: "complete MCA territory (cortical + deep lenticulostriate)" },
```

In `composeAphasiaSites`, replace the four hand-listed arrays with:

```js
  const perisylvian = ["ctx_broca_fluency", "ctx_broca_repetition", "ctx_broca_naming", "ctx_wernicke_comp", "ctx_wernicke_repetition", "ctx_wernicke_naming", "ctx_arcuate", "ctx_arcuate_naming"];
  const bothWatersheds = ["ctx_tcma", "ctx_tcma_naming", "ctx_tcsa", "ctx_tcsa_naming"];
  // thal_face keeps this composite in step with the VPL site (B11): without it the NON-dominant composite —
  // whose dominant-only rows emit nothing — is a VPL lesion missing the face, and out-ranks the real one.
  const thalamic = ["th_aphasia_comp", "th_aphasia_naming", "thal_dc", "thal_stt", "thal_face", "thal_pain"];
  const striatocapsular = ["sc_aphasia_nonfluent", "sc_aphasia_naming", "ic_cst_arm", "ic_cst_leg", "ic_cbt_face", "ic_cbt_forehead", "ic_bab", "ic_hof", "ic_spast"];
```

- [ ] **Step 5: Ruling 7 in `src/model/prevalence.js`**

Add `"midbrain/lateral"` to `RARE_PARTS`, so the set reads:

```js
// anterior-canal BPPV is the rarest canal (owner ruling 2026-09-26: once the canals predict vertigo, an
// alphabetical tie-break put it first for isolated vertigo). The isolated lateral-midbrain sensory syndrome
// is rare (owner ruling 7, 2026-09-26): it predicts the same pure hemisensory picture as the VPL thalamus,
// which is the common lacune.
const RARE_PARTS = new Set(["cerebellum/pancerebellar", "cord/transverse", "peripheral_vestibular/anterior_canal", "midbrain/lateral"]);
```

- [ ] **Step 6: Update the assertions that encoded the old exact sets**

`test/cortex.test.js` line 36:

```js
ok("operculum -> broca features + anomia + dysprosody", eq(cortexOf("operculum"), ["speech_nonfluent","repetition_impaired","naming_impaired","motor_dysprosody"].sort()));
```

`test/subcortex.test.js` lines 29-30:

```js
ok("thalamus -> dorsal+spinothalamic+face+thalamic_pain",
   eq(subOf("thalamus"), ["dorsal_sensory","face_sensory_loss","spinothalamic","thalamic_pain"].sort()));
```

`test/subcortex.test.js` lines 124-128 — the Déjerine–Roussy picture is face, arm and leg (B11):

```js
// Déjerine–Roussy: the same thalamus site, now with central pain — face, arm and leg (B11, 2026-09-26).
{
  const res = solve(new Set(["dorsal_sensory@right","spinothalamic@right","face_sensory_loss@right","thalamic_pain@right"]));
  ok("thalamic pain -> left_subcortex_thalamus (exact)", res.best && res.best.site.id === "left_subcortex_thalamus");
  ok("Déjerine–Roussy over-predicts nothing", res.best && res.best.missedByPatient.length === 0);
}
```

- [ ] **Step 7: Anatomy sheet rows**

One row after each anchor, with the gate span for the dominant-only rows:

| anchor | new id | badge | text |
|---|---|---|---|
| `ctx_broca_repetition` | `ctx_broca_naming` | `bnone` NONE | `anomia — part of every aphasia <span class="gate dom">DOM</span>` |
| `ctx_wernicke_repetition` | `ctx_wernicke_naming` | `bnone` NONE | `anomia with paraphasias <span class="gate dom">DOM</span>` |
| `ctx_arcuate` | `ctx_arcuate_naming` | `bnone` NONE | `naming marred by phonemic paraphasias <span class="gate dom">DOM</span>` |
| `ctx_tcma` | `ctx_tcma_naming` | `bnone` NONE | `anomia <span class="gate dom">DOM</span>` |
| `ctx_tcsa` | `ctx_tcsa_naming` | `bnone` NONE | `marked anomia <span class="gate dom">DOM</span>` |
| `sc_aphasia_nonfluent` | `sc_aphasia_naming` | `bnone` NONE | `anomia <span class="gate dom">DOM</span>` |
| `thal_pain` | `thal_face` | `bc` CONTRA | `facial sensory loss — VPM beside VPL: the pure-sensory lacune is <b>face, arm and leg</b>` |
| `thal_vgaze_bilat` | `thal_amnesia_bilat` | `bnone` NONE | `amnesia / confusion — the third limb of the Percheron triad, bilateral only` |

Each row uses the row format from Global Constraints, e.g.:

```html
            <div class="row"><span class="badge bnone">NONE</span><div class="m"><div class="id">ctx_broca_naming</div><div class="fn">anomia — part of every aphasia <span class="gate dom">DOM</span></div></div></div>
```

- [ ] **Step 8: Run everything** — `node test/accuracy-mechanisms.test.js && node test/cortex.test.js && node test/subcortex.test.js && npm test 2>&1 | grep "^FAIL"`; expected all pass, no FAIL lines.

- [ ] **Step 9: Commit**

```bash
git add src/model/ test/ docs/artifacts/anatomy-model.html
git commit -m "feat: MCA hemianopia, anomia in every aphasia, ACA medial frontal, thalamic face, Percheron amnesia

B2, B8, B9, B10, B11 and owner ruling 7 (lateral midbrain rare). Complete and inferior-division MCA,
Broca/Wernicke with anomia, ACA with incontinence and the Percheron triad no longer read as two lesions;
a pure sensory stroke localises to the thalamus. The operculum and thalamus exact-set assertions gain the
new rows, and the Dejerine-Roussy case gains the face.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: The acute polyradiculoneuropathy (Guillain–Barré) site (spec B14)

**Files:**
- Modify: `src/model/structures.js`, `src/model/sites.js` (TERRITORY + new composer), `src/model/compartments.js`,
  `src/model/topography.js`, `src/model/prevalence.js`, `app/labels.js`, `app/app.js` (`REGION_ORDER`)
- Modify: `src/data/syndromes.js`, `src/data/causes.js`, `src/data/nextSteps.js`
- Modify: `src/data/pathology/inflammatory.js`, `src/data/pathology/metabolic.js`, `src/data/pathology/mimic.js`,
  `src/data/pathology/infective.js`
- Modify: `test/tone.test.js:38-39`, `test/accuracy-mechanisms.test.js`, `docs/artifacts/anatomy-model.html`

**Interfaces:**
- Produces: site id `polyradiculoneuropathy_acute` (side `bilateral`, level `polyradiculoneuropathy`, part
  `acute`, compartment `root`, RARE, symmetric). Curated `CAUSES`, `NEXT` and phonebook entries under that id.

- [ ] **Step 1: Add the failing tests**

In `test/accuracy-mechanisms.test.js` add to imports:

```js
import { CAUSES } from "../src/data/causes.js";
import { nextStepsFor, pathologyNextStepsFor } from "../src/data/nextSteps.js";
import { compartmentOf } from "../src/model/compartments.js";
import { BY_SITE } from "../src/data/syndromes.js";
```

(merge `nextStepsFor` into any existing import of that module), and insert before the final `console.log`:

```js
// ---- B14: the acute polyradiculoneuropathy (Guillain-Barré) site ----
{
  const gbs = candidateSites().find(s => s.id === "polyradiculoneuropathy_acute");
  ok("the GBS site exists, bilateral and SYMMETRIC", !!gbs && gbs.side === "bilateral" && !gbs.asymmetric);
  const e = gbs ? expectedFindings(gbs) : new Set();
  const want = ["lmn_weakness@left", "proximal_weakness@right", "distal_motor_weakness@left", "hypotonia@left",
                "reflex_biceps_loss@left", "reflex_brachioradialis_loss@left", "reflex_triceps_loss@left", "reflex_knee_loss@right",
                "reflex_ankle_loss@left", "facial_weakness@left", "forehead_involved@right", "dysphagia@left", "weak_diaphragm@right",
                "autonomic_features@left"];
  ok("it predicts motor, areflexia, LMN face, bulbar, respiratory and autonomic failure", want.every(t => e.has(t)), want.filter(t => !e.has(t)).join(", "));
  ok("it predicts NO sensory loss (owner: motor-predominant)", ![...e].some(t => /sensory/.test(t)));
  ok("compartment root, RARE", gbs && compartmentOf(gbs) === "root" && prevalenceOf(gbs) === RARE);
  ok("it has a phonebook entry", !!BY_SITE.polyradiculoneuropathy_acute);
  const causes = CAUSES.polyradiculoneuropathy_acute || [];
  ok(`it has a curated cause list (${causes.length} ≥ 6, each with a feature, ≥1 red)`,
     causes.length >= 6 && causes.every(c => c.feature) && causes.some(c => c.red));
  const nx = gbs ? nextStepsFor(gbs) : {};
  ok("its workup is curated, EMERGENCY, and fills all four tiers",
     nx.curated === true && nx.urgency === "emergency" && ["immediate", "investigations", "confirmatory", "monitoring"].every(k => (nx[k] || []).length > 0));
  ok("every cause at the site has an authored pathology plan",
     causes.every(c => gbs && pathologyNextStepsFor(gbs, c.name).pathologyCurated), causes.filter(c => !pathologyNextStepsFor(gbs, c.name).pathologyCurated).map(c => c.name).join(", "));
}
```

- [ ] **Step 2: Run to verify it fails** — `node test/accuracy-mechanisms.test.js`.

- [ ] **Step 3: Structures**

In `src/model/structures.js`, after `poly_ankle_reflex` (added in Task 7):

```js
  // ---- ACUTE POLYRADICULONEUROPATHY (Guillain-Barré; bilateral, symmetric site) ----
  // ADDED 2026-09-26 (accuracy round 1, owner-approved B14). Roots and nerves inflamed together, so the
  // weakness is PROXIMAL as well as distal (not length-dependent) and EVERY reflex goes. Motor-predominant:
  // no sensory row, by owner ruling — predicting it would blur GBS into the length-dependent neuropathy.
  { id: "gbs_lmn",             level: "polyradiculoneuropathy", part: "acute", produces: "lmn_weakness",               note: "ascending flaccid (LMN) weakness, legs usually before arms" },
  { id: "gbs_prox",            level: "polyradiculoneuropathy", part: "acute", produces: "proximal_weakness",          note: "PROXIMAL as well as distal — the roots are involved, so it is not length-dependent" },
  { id: "gbs_distal",          level: "polyradiculoneuropathy", part: "acute", produces: "distal_motor_weakness",      note: "distal weakness" },
  { id: "gbs_hypotonia",       level: "polyradiculoneuropathy", part: "acute", produces: "hypotonia",                  note: "flaccid" },
  { id: "gbs_areflex_biceps",  level: "polyradiculoneuropathy", part: "acute", produces: "reflex_biceps_loss",         note: "biceps jerk lost — generalised areflexia" },
  { id: "gbs_areflex_br",      level: "polyradiculoneuropathy", part: "acute", produces: "reflex_brachioradialis_loss", note: "supinator jerk lost" },
  { id: "gbs_areflex_triceps", level: "polyradiculoneuropathy", part: "acute", produces: "reflex_triceps_loss",        note: "triceps jerk lost" },
  { id: "gbs_areflex_knee",    level: "polyradiculoneuropathy", part: "acute", produces: "reflex_knee_loss",           note: "knee jerk lost" },
  { id: "gbs_areflex_ankle",   level: "polyradiculoneuropathy", part: "acute", produces: "reflex_ankle_loss",          note: "ankle jerk lost" },
  { id: "gbs_face",            level: "polyradiculoneuropathy", part: "acute", produces: "facial_weakness", crosses: false, note: "BILATERAL LMN facial weakness (facial nerve roots) — never Bell's palsy" },
  { id: "gbs_forehead",        level: "polyradiculoneuropathy", part: "acute", produces: "forehead_involved",          note: "LMN, so the forehead is weak too" },
  { id: "gbs_bulbar",          level: "polyradiculoneuropathy", part: "acute", produces: "dysphagia",                  note: "bulbar weakness — swallow and cough" },
  { id: "gbs_resp",            level: "polyradiculoneuropathy", part: "acute", produces: "weak_diaphragm",             note: "diaphragm weakness — measure the vital capacity, not the saturation" },
  { id: "gbs_autonomic",       level: "polyradiculoneuropathy", part: "acute", produces: "autonomic_features",         note: "dysautonomia — arrhythmia and labile blood pressure" },
```

- [ ] **Step 4: Site, tables, label**

In `src/model/sites.js` `TERRITORY`, after the `"polyneuropathy|length_dependent"` entry:

```js
  "polyradiculoneuropathy|acute": "nerve roots and peripheral nerves diffusely (acute inflammatory polyradiculoneuropathy)",
```

Directly above `export function composePolyneuropathySites()`:

```js
// ACUTE POLYRADICULONEUROPATHY (Guillain-Barré; accuracy round 1, B14). One diffuse bilateral site, like the
// polyneuropathy — but SYMMETRIC by definition (no `asymmetric` flag): an asymmetric picture points away from
// GBS, toward mononeuritis multiplex or a structural cause. Picked up by candidateSites() via reflection.
export function composePolyradiculoneuropathySites() {
  const structures = STRUCTURES.filter(s => s.level === "polyradiculoneuropathy" && s.part === "acute").map(s => s.id);
  if (structures.length === 0) return [];
  return [{ id: "polyradiculoneuropathy_acute", side: "bilateral", level: "polyradiculoneuropathy",
    part: "acute", territory: TERRITORY["polyradiculoneuropathy|acute"], structures, composite: true }];
}
```

`src/model/compartments.js`: replace `root: "root", plexus: "plexus", nerve: "nerve", polyneuropathy: "nerve",`
with `root: "root", plexus: "plexus", nerve: "nerve", polyneuropathy: "nerve", polyradiculoneuropathy: "root",`.

`src/model/topography.js`: after the `"polyneuropathy|length_dependent"` row add:

```js
  "polyradiculoneuropathy|acute":                { lobe: null        , surface: true , system: null },
```

(`surface: true` because the compartment is `root`, which the suite's exhaustive rule requires.)

`src/model/prevalence.js`: add `"polyradiculoneuropathy"` to `RARE_LEVELS` (after `"central_vestibular"`).

`app/labels.js` `PART_LABEL`: after `"polyneuropathy|length_dependent": ...`, add
`  "polyradiculoneuropathy|acute": "acute polyradiculoneuropathy",`.

`app/app.js` `REGION_ORDER`: replace the trailing `"motor_unit","root","plexus","nerve","polyneuropathy"];`
with `"motor_unit","root","plexus","nerve","polyneuropathy","polyradiculoneuropathy"];`.

- [ ] **Step 5: Phonebook** — `src/data/syndromes.js`, after the `polyneuropathy_length_dependent` entry:

```js
  polyradiculoneuropathy_acute: {
    name: "Acute polyradiculoneuropathy (Guillain–Barré)",
    note: "Roots and nerves inflamed together: ascending, roughly symmetric flaccid weakness over days, PROXIMAL as well as distal, with GENERALISED areflexia, often bilateral facial weakness, and few objective sensory signs — a motor-predominant picture whose danger is respiratory, bulbar and autonomic failure.",
    ddx: ["Guillain–Barré syndrome (AIDP / AMAN)", "Acute-onset CIDP", "Botulism (descending)", "Tick paralysis", "Acute intermittent porphyria", "Hypokalaemic periodic paralysis (mimic)"],
    red: "Measure the forced vital capacity, not the oxygen saturation — respiratory failure shows late on the monitor and early in the patient. A sensory level or early sphincter failure means cord compression until an MRI says otherwise."
  },
```

- [ ] **Step 6: Causes** — `src/data/causes.js`, directly after the closing `],` of
`polyneuropathy_length_dependent:` in `CAUSES`:

```js
  // ---- ACUTE POLYRADICULONEUROPATHY (Guillain-Barré site; accuracy round 1, B14, 2026-09-26) ----
  polyradiculoneuropathy_acute: [
    c("Guillain-Barré syndrome", "inflammatory", ["acute","subacute"], "common", true,
      "Ascending, roughly SYMMETRIC flaccid weakness over days with the reflexes LOST early and few objective sensory signs despite tingling — often weeks after a diarrhoeal (Campylobacter) or respiratory illness; back and limb pain are common and easily mistaken for a disc"),
    c("Acute-onset CIDP", "inflammatory", ["subacute","chronic"], "uncommon", false,
      "A presumed Guillain-Barré that keeps worsening well beyond the usual nadir, or relapses after treatment — the distinction matters because CIDP needs maintenance treatment rather than a single course"),
    c("Botulism", "infective", ["hyperacute","acute"], "rare", true,
      "DESCENDING paralysis that starts with the eyes, pupils and swallow and spreads to the limbs, in an alert, afebrile patient — the direction of travel is the discriminator from Guillain-Barré, which ascends; ask about home-preserved food and injecting drug use"),
    c("Tick paralysis", "infective", ["acute"], "rare", true,
      "An ascending flaccid paralysis indistinguishable at the bedside from Guillain-Barré, usually in a child after outdoor exposure, with a NORMAL CSF protein — search the scalp and skin folds, because removing the tick cures it"),
    c("Elsberg syndrome (CMV or HSV-2 polyradiculitis)", "infective", ["acute","subacute"], "rare", false,
      "A painful lumbosacral polyradiculitis with URINARY RETENTION in an immunocompromised patient (CMV) or after genital herpes — the CSF shows cells, which Guillain-Barré does not"),
    c("Lyme radiculitis (Bannwarth syndrome)", "infective", ["subacute"], "rare", false,
      "Severe radicular pain that is worse at night, followed by patchy weakness and often a facial palsy, weeks after a tick bite or an erythema migrans rash in an endemic area — a lymphocytic CSF separates it from Guillain-Barré"),
    c("Acute intermittent porphyria", "metabolic", ["acute","subacute"], "rare", true,
      "A motor-predominant neuropathy that can begin in the ARMS, preceded by severe abdominal pain, confusion or psychiatric change and hyponatraemia, often triggered by a drug, alcohol or fasting — many drugs given for the pain make it worse"),
    c("Hypokalaemic periodic paralysis", "mimic", ["hyperacute","acute"], "rare", false,
      "Flaccid weakness on waking or after a carbohydrate-heavy meal or rest after exertion, sparing the face and breathing, with a LOW potassium and full recovery between attacks — thyrotoxicosis is a common trigger, so check the thyroid"),
  ],
```

- [ ] **Step 7: Workup** — `src/data/nextSteps.js` `NEXT`, directly after the `polyneuropathy_length_dependent: ns(...)` entry:

```js
  // ACUTE POLYRADICULONEUROPATHY (Guillain-Barré; accuracy round 1, B14).
  polyradiculoneuropathy_acute: ns(
    ["FORCED VITAL CAPACITY at the bedside now and serially — with bulbar function and cough, it decides the level of care",
     "Nerve conduction studies (demyelinating vs axonal; may be normal in the first days) and LUMBAR PUNCTURE for albuminocytological dissociation — raised protein WITHOUT cells, which may also be normal early",
     "Bloods: potassium, calcium, magnesium, phosphate, creatine kinase, glucose, renal and liver function, and HIV, CMV, EBV and Campylobacter serology; urine porphobilinogen where abdominal pain or hyponatraemia accompany it",
     "MRI of the spine if there is a sensory level, early sphincter failure or marked asymmetry — cord compression must not be called Guillain-Barré"],
    "emergency",
    "Neurology urgently, with critical care involved early — before, not after, the vital capacity falls.",
    { immediate: ["AIRWAY AND BREATHING FIRST: a single-breath count, the strength of the cough and swallow, and any paradoxical abdominal movement",
                  "Test EVERY reflex and power proximally and distally in all four limbs, and look for bilateral facial weakness",
                  "Look for a SENSORY LEVEL and ask about the bladder — either points to the cord, not the roots",
                  "Cardiac monitoring and repeated blood pressure — autonomic instability causes arrhythmia and wide swings in pressure"],
      confirmatory: ["Repeat nerve conduction studies if the first are normal or equivocal — they can lag behind the clinical picture",
                     "Anti-ganglioside antibodies (GQ1b for the ocular and bulbar variants, GM1 for the axonal form)",
                     "Look for the trigger: Campylobacter stool culture, and a history of recent infection or vaccination"],
      monitoring: ["Serial vital capacity and bulbar assessment at defined intervals — a FALLING vital capacity, weak cough or failing swallow means critical care review now",
                   "Continuous cardiac monitoring for autonomic arrhythmia, and treat the pain, which is common and severe",
                   "Thromboprophylaxis and pressure-area care in the immobile patient",
                   "Immunotherapy (immunoglobulin or plasma exchange) is started by neurology — early treatment shortens the illness"] }),
```

- [ ] **Step 8: Pathology plans**

Three NEW plans. In `src/data/pathology/inflammatory.js`, inside `export default {`, add (next to the other
single-disease `dz(...)` plans):

```js
  // Accuracy round 1 (B14): the GBS that is not GBS. The COURSE is the diagnosis.
  "Acute-onset CIDP": dz("Acute-onset CIDP", {
    confirmatory: [
      "Nerve conduction studies showing DEMYELINATION — slowed conduction, conduction block and prolonged distal latencies — in several limbs; the pattern overlaps Guillain-Barré, so it is the COURSE, not a single study, that separates them",
      "CSF protein is raised without cells, as in Guillain-Barré — a raised cell count points to an infective or infiltrative polyradiculopathy instead",
      "Serum protein electrophoresis with immunofixation, and nodal or paranodal antibodies where the picture is atypical — a paraprotein or a nodopathy changes the treatment",
    ],
    monitoring: [
      "SAFETY NET: suspect CIDP when a presumed Guillain-Barré keeps worsening beyond the usual nadir or relapses after immunoglobulin — re-examine rather than simply repeating the first treatment",
      "Track power and function with a disability scale at each review, so a slow decline is seen rather than remembered",
      "Maintenance immunotherapy is the rule, and the response to it is itself confirmatory — document it objectively",
    ],
    urgency: "urgent",
    referral: "Neurology (neuromuscular), with the same respiratory vigilance as Guillain-Barré while the course declares itself",
  }),
```

In `src/data/pathology/metabolic.js`:

```js
  // Accuracy round 1 (B14): a neuropathy that the wrong analgesic makes worse.
  "Acute intermittent porphyria": dz("Acute intermittent porphyria", {
    confirmatory: [
      "URINE PORPHOBILINOGEN on a sample taken DURING the attack — it is the screening test, markedly raised in an acute attack, and it can be normal between attacks",
      "Serum sodium (hyponatraemia is common and contributes to seizures), with renal and liver function",
      "Nerve conduction studies show an axonal, motor-predominant neuropathy; genetic testing and family screening follow once the biochemistry confirms it",
    ],
    monitoring: [
      "SAFETY NET: STOP every porphyrinogenic drug and check each new prescription against a porphyria drug database before it is given — many analgesics, anticonvulsants and anaesthetic agents precipitate or worsen an attack",
      "Monitor vital capacity, bulbar function and sodium — the neuropathy can progress to respiratory failure like Guillain-Barré",
      "Haem therapy is the specific treatment and is started early by the specialist team; carbohydrate loading is only a bridge",
    ],
    urgency: "emergency",
    referral: "Acute medicine with neurology and the regional porphyria service",
  }),
```

In `src/data/pathology/mimic.js`:

```js
  // Accuracy round 1 (B14): the flaccid paralysis that a potassium level diagnoses.
  "Hypokalaemic periodic paralysis": dz("Hypokalaemic periodic paralysis", {
    confirmatory: [
      "SERUM POTASSIUM DURING THE ATTACK — it is low, and the level between attacks may be normal, so the attack sample is the one that counts",
      "Thyroid function in every case — thyrotoxic periodic paralysis is common in some populations and is cured by treating the thyroid",
      "Consider the familial channelopathy where attacks began in adolescence or there is a family history; a long exercise test on EMG supports it between attacks",
    ],
    monitoring: [
      "SAFETY NET: an ECG during the attack — hypokalaemia causes arrhythmia, and potassium replaced too fast or too freely causes REBOUND hyperkalaemia as potassium shifts back out of the cells",
      "Weakness that spares the face and breathing and recovers fully is the pattern; weakness that involves breathing or does not recover is NOT periodic paralysis — re-examine for Guillain-Barré",
      "Avoid the triggers — carbohydrate loads and rest straight after exertion — and review diuretics and other potassium-wasting drugs",
    ],
    urgency: "urgent",
    referral: "Acute medicine; endocrinology if thyrotoxic, the neuromuscular clinic for the familial form",
  }),
```

Four REUSED plans need a `bySite` entry for the new site, or `test/pathology-next-steps.test.js` §6 fails
(a shared pathology must differentiate across its places). `Guillain-Barré syndrome` is a `family()` member in
`src/data/pathology/inflammatory.js` — add a `bySite` key to its member object:

```js
    "Guillain-Barré syndrome": {
      slots: { level: "facial movement on BOTH sides, plus limb power and reflexes",
               flavour: "a BILATERAL facial palsy is Guillain-Barré until proven otherwise — and the areflexia and the ascending pattern are what to look for once the face has drawn attention" },
      bySite: {
        polyradiculoneuropathy_acute: {
          level: "power proximally and distally in all four limbs, every reflex, the face, the swallow and the vital capacity",
          flavour: "a demyelinating pattern (AIDP) or a pure motor axonal one (AMAN) — the axonal form after Campylobacter recovers more slowly",
        },
      },
    },
```

In `src/data/pathology/infective.js`, add to the `dz("Botulism", {...})` options object:

```js
    bySite: {
      polyradiculoneuropathy_acute: { level: "the DIRECTION of spread — eyes, pupils and swallow first, then the limbs" },
    },
```

to `dz("Tick paralysis", {...})`:

```js
    bySite: {
      polyradiculoneuropathy_acute: { level: "limb power and the reflexes as the paralysis ascends" },
    },
```

to `dz("Elsberg syndrome (CMV or HSV-2 polyradiculitis)", {...})`:

```js
    bySite: {
      polyradiculoneuropathy_acute: { level: "leg power, the reflexes and the bladder" },
    },
```

and to the EXISTING `bySite` object of `"Lyme radiculitis (Bannwarth syndrome)"`, a new key:

```js
      polyradiculoneuropathy_acute: {
        level: "the pattern of weakness across several roots, and the face",
        flavour: "a multi-root picture with a facial palsy is the one most easily mistaken for Guillain-Barré — the lymphocytic CSF separates them",
      },
```

- [ ] **Step 9: Update the hypotonia level assertion**

`test/tone.test.js` lines 38-39:

```js
ok("hypotonia is generalised-flaccid ONLY (anterior horn, cauda, polyneuropathy, GBS)",
   JSON.stringify(levelsProducing("hypotonia")) === JSON.stringify(["cauda","motor_unit","polyneuropathy","polyradiculoneuropathy"]));
```

(If `levelsProducing` returns a different order, match it — the assertion is about the SET; keep the file's
own ordering convention.)

- [ ] **Step 10: Anatomy sheet**

After the `poly_ankle_reflex` row (Task 7), add a new region block for the site. Copy the markup of the
"Length-dependent polyneuropathy" region (the `region-title` div at its heading and its column wrapper),
retitle it `Acute polyradiculoneuropathy (Guillain–Barré)` with the note
`roots AND nerves: proximal as well as distal, every reflex lost, the face often both sides — motor-predominant, so there is no sensory row · symmetric by definition`,
and give it one `BILAT` row per `gbs_*` structure from Step 3, using each structure's `note` as its text.

- [ ] **Step 11: Run everything**

Run: `node test/accuracy-mechanisms.test.js && node test/tone.test.js && node test/causes-depth.test.js && node test/next-steps.test.js && node test/pathology-next-steps.test.js && node test/app-naming.test.js && node test/compartments.test.js && node test/topography.test.js && node test/localising-audit.test.js && npm test 2>&1 | grep "^FAIL"`
Expected: all pass; no FAIL lines. Then `node test/clinical-vignettes.test.js | tail -1` →
`clinical vignettes: 142 passed, 0 failed`.

- [ ] **Step 12: Commit**

```bash
git add src/ app/labels.js app/app.js test/ docs/artifacts/anatomy-model.html
git commit -m "feat: acute polyradiculoneuropathy (Guillain-Barre) site with curated content

B14 (owner-approved: symmetric, motor-predominant, no sensory row). Symmetric LMN weakness with
areflexia now localises to GBS instead of Friedreich's ataxia. Eight curated causes, an emergency
four-tier workup, three new pathology plans (acute-onset CIDP, acute intermittent porphyria,
hypokalaemic periodic paralysis) and bySite entries for the four reused plans. The hypotonia-levels
assertion gains the new level.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Stroke tempo and onset-aware urgency (spec B15, A4, B16)

**Files:**
- Modify: `src/data/causes.js:2585-2586,2681` (tempo)
- Modify: `src/data/nextSteps.js` (imports, `nextStepsFor`, `resolveUrgency`, `pathologyNextStepsFor`, `combinedNextSteps`)
- Modify: `app/app.js` (three call sites)
- Modify: `test/accuracy-mechanisms.test.js`

**Interfaces:**
- Produces: `export function hyperacuteVascular(site, onset) -> boolean` from `nextSteps.js`;
  `nextStepsFor(site, opts = {})`, `pathologyNextStepsFor(site, causeName, opts = {})`,
  `resolveUrgency(site, causeName, opts = {})`, `combinedNextSteps(sites, entityName = null, opts = {})`.
  `opts.onset` is a TEMPO id. With no `opts`, every function returns exactly what it returned before.

- [ ] **Step 1: Add the failing tests**

Add `hyperacuteVascular` and `combinedNextSteps` to the test's `nextSteps.js` import and `causesFor` to a
`causes.js` import, then insert before the final `console.log`:

```js
// ---- B15 / A4 / B16: stroke at hyperacute onset ----
{
  const cs = candidateSites(); const byId = id => cs.find(s => s.id === id);
  const ic = byId("left_subcortex_internal_capsule");
  const lac = causesFor(ic, { onset: "hyperacute" }).all.map(c => c.name);
  ok("a lacunar infarct is CONCORDANT with hyperacute onset at the capsule (B15)", lac.includes("Small-vessel lacunar infarct"));
  ok("the capsule badges emergency at hyperacute onset", nextStepsFor(ic, { onset: "hyperacute" }).urgency === "emergency");
  ok("…and keeps its curated badge with no onset", nextStepsFor(ic).urgency === "urgent");
  ok("a peripheral vestibular site does NOT escalate (peripheral compartment)", nextStepsFor(byId("left_peripheral_vestibular_labyrinth"), { onset: "hyperacute" }).urgency !== "emergency");
  ok("a microvascular CN III does NOT escalate", nextStepsFor(byId("left_pupil_cn3_ischaemic"), { onset: "hyperacute" }).urgency !== "emergency");
  ok("hyperacuteVascular is false without hyperacute onset", !hyperacuteVascular(ic, "acute") && !hyperacuteVascular(ic, undefined));
  // The no-onset call is byte-identical to the pre-change call, at every site kind.
  const seen = new Set(); let identical = true;
  for (const s of cs) { const k = `${s.level}_${s.part}`; if (seen.has(k)) continue; seen.add(k);
    if (JSON.stringify(nextStepsFor(s)) !== JSON.stringify(nextStepsFor(s, {}))) identical = false; }
  ok(`nextStepsFor(site) === nextStepsFor(site, {}) at all ${seen.size} site kinds`, identical);
  // B16: a VASCULAR cause selected at hyperacute onset keeps the emergency badge. Tested on a cause whose
  // AUTHORED plan urgency is routine, so the assertion can only pass because of B16.
  const vl = byId("left_thalamus_vl");
  ok("precondition: the thalamic infarct plan is authored below emergency",
     pathologyNextStepsFor(vl, "Thalamic infarct or haemorrhage").urgency !== "emergency");
  ok("a selected vascular cause at hyperacute onset is EMERGENCY (B16)",
     pathologyNextStepsFor(vl, "Thalamic infarct or haemorrhage", { onset: "hyperacute" }).urgency === "emergency");
  // …but only a vascular cause that can BE hyperacute: post-stroke pain is vascular and chronic.
  const vpl = byId("left_subcortex_thalamus");
  ok("a chronic vascular cause (post-stroke pain) is NOT escalated by a hyperacute onset",
     pathologyNextStepsFor(vpl, "Déjerine-Roussy (central post-stroke pain)", { onset: "hyperacute" }).urgency
       === pathologyNextStepsFor(vpl, "Déjerine-Roussy (central post-stroke pain)").urgency);
  ok("a selected NON-vascular cause keeps its authored urgency",
     pathologyNextStepsFor(ic, "Demyelinating plaque", { onset: "hyperacute" }).urgency === pathologyNextStepsFor(ic, "Demyelinating plaque").urgency);
  ok("combinedNextSteps threads the onset", combinedNextSteps([ic, byId("left_root_l5")], null, { onset: "hyperacute" }).urgency === "emergency");
}
```

- [ ] **Step 2: Run to verify it fails** — `node test/accuracy-mechanisms.test.js` (import error on
  `hyperacuteVascular`).

- [ ] **Step 3: Tempo (B15)** — in `src/data/causes.js`:

line 2585, `c("Small-vessel lacunar infarct", "vascular", ["acute"],` → `["hyperacute","acute"]`;
line 2586, `c("Hypertensive haemorrhage", "vascular", ["acute"],` → `["hyperacute","acute"]`;
line 2681, `c("Small precentral (hand-knob) infarct", "vascular", ["acute"],` → `["hyperacute","acute"]`.
Add above line 2585: `// Tempo aligned 2026-09-26 (B15): the same causes are hyperacute at every other site that names them.`

- [ ] **Step 4: Onset-aware urgency in `src/data/nextSteps.js`**

Replace `import { CAUSES } from "./causes.js";` with:

```js
import { CAUSES, causesFor } from "./causes.js";
import { compartmentOf } from "../model/compartments.js";
```

Directly above `// ---- public API ----` (and after `causeEntry`), add:

```js
// ---- hyperacute stroke escalation (accuracy round 1, A4 + B16, owner-approved 2026-09-25) ----
// A CNS site whose LEADING cause at hyperacute onset is vascular is inside the thrombolysis window — an
// emergency, whatever its curated badge says when the tempo is unknown. Derived from the causes layer, never
// hand-listed. Peripheral compartments are excluded on purpose: a peripheral HINTS pattern is the reassuring
// one, and a microvascular cranial neuropathy is not a thrombolysis question.
const STROKE_WINDOW_COMPARTMENTS = new Set(["brain", "brainstem", "cerebellum", "cord", "optic"]);
export function hyperacuteVascular(site, onset) {
  if (onset !== "hyperacute" || !STROKE_WINDOW_COMPARTMENTS.has(compartmentOf(site))) return false;
  let lead;
  try { lead = causesFor(site, { onset }).all.find(c => c.cat !== "mimic"); } catch { return false; }
  return !!lead && lead.cat === "vascular";
}
```

Change `nextStepsFor`:

```js
export function nextStepsFor(site, opts = {}) {
```

and its `urgency:` line to:

```js
    urgency: hyperacuteVascular(site, opts.onset) ? "emergency" : base.urgency,
```

Change `resolveUrgency` to:

```js
export function resolveUrgency(site, causeName, opts = {}) {
  const siteUrgency = nextStepsFor(site, opts).urgency || "routine";
  if (!causeName) return siteUrgency;
  const plan = pathologyPlanFor(causeName, site);
  const chosen = (plan && plan.urgency) || siteUrgency;
  const entry = causeEntry(site, causeName);
  // B16 (owner, 2026-09-25): a VASCULAR cause selected at hyperacute onset in a CNS compartment keeps the
  // emergency badge — the authored plan urgency must not quieten a stroke inside the treatment window. Only a
  // cause that can itself BE hyperacute: post-stroke pain is vascular but chronic, and is not a window.
  if (entry && entry.cat === "vascular" && entry.tempo.includes("hyperacute") && opts.onset === "hyperacute"
      && STROKE_WINDOW_COMPARTMENTS.has(compartmentOf(site))) return "emergency";
  if (!entry || !entry.red) return chosen;
  return URGENCY_RANK[chosen] >= URGENCY_RANK[RED_FLOOR] ? chosen : RED_FLOOR;
}
```

Change `pathologyNextStepsFor`'s signature and first lines to:

```js
export function pathologyNextStepsFor(site, causeName, opts = {}) {
  const base = nextStepsFor(site, opts);
```

and its `urgency:` line to `    urgency:      resolveUrgency(site, causeName, opts),`.

Change `combinedNextSteps`:

```js
export function combinedNextSteps(sites, entityName = null, opts = {}) {
  const all = sites.map(s => nextStepsFor(s, opts));
```

Update the header comment's signature line to
`//   nextStepsFor(site, { onset }) -> { immediate, investigations, confirmatory, monitoring, urgency, referral, curated }`.

- [ ] **Step 5: Thread the onset through `app/app.js`**

In `resultHeader`, replace `const u = nextStepsFor(sel.site).urgency;` with
`const u = nextStepsFor(sel.site, { onset: S.onset || undefined }).urgency;`.

In `nextCard`, replace:

```js
  const nx = combined
    ? combinedNextSteps(sites, S.selectedEntity || null)
    : pathologyNextStepsFor(site, S.selectedPathology || null);
```

with:

```js
  // The onset is threaded through so a hyperacute stroke badges EMERGENCY (accuracy round 1, A4/B16).
  const onsetOpt = { onset: S.onset || undefined };
  const nx = combined
    ? combinedNextSteps(sites, S.selectedEntity || null, onsetOpt)
    : pathologyNextStepsFor(site, S.selectedPathology || null, onsetOpt);
```

- [ ] **Step 6: Run everything** — `node test/accuracy-mechanisms.test.js && node test/next-steps.test.js && node test/pathology-next-steps.test.js && node test/multifocal-next-steps.test.js && node test/app-smoke.test.js && npm test 2>&1 | grep "^FAIL"`; expected all pass, no FAIL lines.

- [ ] **Step 7: Commit**

```bash
git add src/data/causes.js src/data/nextSteps.js app/app.js test/accuracy-mechanisms.test.js
git commit -m "feat: hyperacute stroke badges EMERGENCY; lacunar infarct is hyperacute

B15, A4, B16 (owner-approved). A CNS site whose leading cause at hyperacute onset is vascular badges
emergency (21 site kinds), including when a hyperacute-compatible vascular cause is selected. Peripheral compartments are
excluded. With no onset every call is byte-identical to before (asserted at every site kind).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: The finding panel never offers a dead side (spec A5)

**Files:**
- Create: `app/sides.js`
- Create: `test/side-offers.test.js`
- Modify: `app/app.js` (imports; lines 30-36 side map; `frow`; the `acc` click handler; `markSides`)
- Modify: `package.json` (chain)

**Interfaces:**
- Produces: `buildSideOffers(sites) -> { [findingId]: Array<{ key: "left"|"right"|"midline"|"none"|"both", tokens: string[] }> }`
  and `offersFor(findingId) -> Array<...>` (from a module-level map built once over `candidateSites()`;
  unknown findings get `[{ key: "none", tokens: [`${f}@none`] }]`).

- [ ] **Step 1: Write the failing test**

Create `test/side-offers.test.js`:

```js
// side-offers.test.js — the finding panel must never offer a side that returns nothing (accuracy round 1, A5).
// Before this, eleven real findings entered on one side returned ZERO candidates and the app suggested the
// picture "may be non-organic" — unilateral fasciculations, fatigable ptosis, LMN weakness among them.
import { offersFor, buildSideOffers } from "../app/sides.js";
import { candidateSites, solve } from "../src/engine/inverse.js";
import { FINDINGS } from "../src/model/findings.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };

const map = buildSideOffers(candidateSites());
const dead = [];
let options = 0;
for (const [f, offers] of Object.entries(map)) for (const o of offers) {
  options++;
  if (!solve(new Set(o.tokens), { dominantSide: "left" }).differential.length) dead.push(`${f}:${o.key}`);
}
ok(`every offered option returns at least one candidate (${options} options)`, dead.length === 0, dead.join(", "));

// Findings no site produces are AXES or FLAGS, handled elsewhere (pressure axis, refractive flag, functional
// flag). Pin the set so a new unproduced finding cannot slip in unnoticed.
const unproduced = Object.keys(FINDINGS).filter(f => !map[f]).sort();
ok("only the axis/flag findings are unproduced",
   JSON.stringify(unproduced) === JSON.stringify(["entrainment", "exam_inconsistency", "give_way_weakness", "hoovers_sign", "papilloedema", "va_reduced_pinhole_corrects"]),
   unproduced.join(", "));

const keys = f => offersFor(f).map(o => o.key).join(",");
ok("a symmetric-only finding offers ONLY 'both' (distal sensory loss)", keys("distal_sensory_loss") === "both", keys("distal_sensory_loss"));
ok("'both' adds the two sides together", JSON.stringify(offersFor("distal_sensory_loss")[0].tokens) === JSON.stringify(["distal_sensory_loss@left", "distal_sensory_loss@right"]));
ok("an asymmetric-site finding offers left and right (fasciculations)", keys("fasciculations") === "left,right", keys("fasciculations"));
ok("an ordinary lateralised finding offers left and right (arm weakness)", keys("weak_arm") === "left,right", keys("weak_arm"));
ok("a non-lateralised finding offers one 'none' button", keys("naming_impaired") === "none", keys("naming_impaired"));
ok("a midline finding offers midline (saddle anaesthesia)", keys("saddle_anaesthesia").includes("midline"), keys("saddle_anaesthesia"));
ok("an unknown finding degrades to a single 'none' button", keys("zz_not_a_finding") === "none");

console.log(`\nside offers: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run to verify it fails** — `node test/side-offers.test.js` (module not found).

- [ ] **Step 3: Implement `app/sides.js`**

```js
// sides.js — which side buttons the finding panel offers for each finding. Pure and DOM-free, so the
// invariant can be tested directly (test/side-offers.test.js): NO OFFERED OPTION MAY RETURN NOTHING.
//
// The panel used to offer every side any site emitted. A finding produced only by a SYMMETRIC bilateral
// site (a length-dependent neuropathy, a syrinx) was then offered as "L" and "R", and one side on its own
// excluded the only producer — zero candidates, and the empty state suggested the picture was non-organic.
// Such a finding now gets a single "Both" button that enters the two sides together (accuracy round 1, A5).
import { candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { NON_LATERALISED } from "../src/model/findings.js";

export function buildSideOffers(sites) {
  const sides = {};        // finding -> Set of body sides some site emits it on
  const oneSided = {};     // finding -> true if a ONE-SIDED or ASYMMETRIC site emits it @left/@right
  for (const site of sites) {
    let exp; try { exp = expectedFindings(site); } catch { continue; }
    for (const tok of exp) {
      const [f, s] = tok.split("@");
      (sides[f] ??= new Set()).add(s);
      if ((s === "left" || s === "right") && (site.side === "left" || site.side === "right" || site.asymmetric)) oneSided[f] = true;
    }
  }
  const out = {};
  for (const [f, set] of Object.entries(sides)) {
    if (NON_LATERALISED.has(f) || (set.size === 1 && set.has("none"))) { out[f] = [{ key: "none", tokens: [`${f}@none`] }]; continue; }
    const offers = [];
    const lr = ["left", "right"].filter(s => set.has(s));
    if (lr.length && !oneSided[f]) offers.push({ key: "both", tokens: lr.map(s => `${f}@${s}`) });
    else for (const s of lr) offers.push({ key: s, tokens: [`${f}@${s}`] });
    if (set.has("midline")) offers.push({ key: "midline", tokens: [`${f}@midline`] });
    out[f] = offers;
  }
  return out;
}

const OFFERS = buildSideOffers(candidateSites());
export const offersFor = f => OFFERS[f] || [{ key: "none", tokens: [`${f}@none`] }];
```

- [ ] **Step 4: Wire it into `app/app.js`**

Add `import { offersFor } from "./sides.js";` beside the other `./` imports.

Delete lines 30-36 (the `SIDES` map comment, the `const SIDES = {};` loop and `const sidesOf = ...`), leaving
the `CANDIDATES` line above them.

Replace `frow`'s first four lines:

```js
function frow(f) {
  const sides = sidesOf(f);
  const btns = (NON_LATERALISED.has(f) || (sides.length===1 && sides[0]==="none"))
    ? `<button data-f="${f}" data-s="none">add</button>`
    : sides.filter(s=>s!=="none").map(s=>`<button data-f="${f}" data-s="${s}">${sideTag(s)}</button>`).join("");
```

with:

```js
function frow(f) {
  // data-t carries the token(s) a button toggles: "Both" enters two at once (app/sides.js explains why).
  const label = o => o.key === "none" ? "add" : o.key === "both" ? "Both" : sideTag(o.key);
  const btns = offersFor(f).map(o => `<button data-f="${f}" data-s="${o.key}" data-t="${o.tokens.join(" ")}">${label(o)}</button>`).join("");
```

Replace the `acc` click handler:

```js
  on("acc", "onclick", e => { const b = e.target.closest("button[data-f]"); if (!b) return;
    toggleToken(`${b.dataset.f}@${b.dataset.s}`); });
```

with:

```js
  on("acc", "onclick", e => { const b = e.target.closest("button[data-t]"); if (!b) return;
    toggleTokens(b.dataset.t.split(" ")); });
```

Directly after `function toggleToken(tok) {...}` add:

```js
// A panel button may carry several tokens ("Both"): all on → all off, otherwise all on.
function toggleTokens(toks) {
  const allOn = toks.every(t => S.tokens.has(t));
  for (const t of toks) allOn ? S.tokens.delete(t) : S.tokens.add(t);
  renderChips(); renderResults(); markSides(); syncLevelCtrls();
}
```

Replace the body of `markSides`'s loop:

```js
  acc.querySelectorAll("button[data-f]").forEach(b => b.classList.toggle("on", S.tokens.has(`${b.dataset.f}@${b.dataset.s}`)));
```

with:

```js
  acc.querySelectorAll("button[data-t]").forEach(b => b.classList.toggle("on", b.dataset.t.split(" ").every(t => S.tokens.has(t))));
```

If `NON_LATERALISED` is no longer referenced anywhere in `app/app.js` after this change, remove it from that
file's import line (check with `grep -n NON_LATERALISED app/app.js`).

- [ ] **Step 5: Run the tests** — `node test/side-offers.test.js && node test/app-smoke.test.js && npm test 2>&1 | grep "^FAIL"`; expected all pass, no FAIL lines.

- [ ] **Step 6: Add the suite to the chain and commit**

In `package.json`, add ` && node test/side-offers.test.js` immediately after `node test/accuracy-mechanisms.test.js`.

```bash
git add app/sides.js app/app.js test/side-offers.test.js package.json
git commit -m "feat: the finding panel never offers a side that returns nothing

app/sides.js (pure) builds the side buttons; a finding only a symmetric bilateral site produces gets a
single 'Both' button. test/side-offers.test.js asserts every offered option yields a candidate.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Close-out — the vignette gate, self-localisation, docs, verification

**Files:**
- Modify: `package.json`, `test/accuracy-mechanisms.test.js`, `CLAUDE.md`, `README.md`
- Modify: `docs/superpowers/specs/2026-09-25-accuracy-round-1-design.md` (status line), this plan (status line)

- [ ] **Step 1: Self-localisation invariant** — insert before the final `console.log` of
  `test/accuracy-mechanisms.test.js`:

```js
// ---- every site's own complete picture localises back to it (true on 2026-09-25; now pinned) ----
{
  const missing = [];
  for (const s of candidateSites()) {
    let E; try { E = expectedFindings(s, { dominantSide: "left" }); } catch { continue; }
    if (!E.size) continue; // non-dominant mirrors of dominant-only cortex predict nothing, by design
    if (!solve(E, { dominantSide: "left" }).explainAll.some(c => c.site.id === s.id)) missing.push(s.id);
  }
  ok("every non-empty site's complete picture is explained by that site", missing.length === 0, missing.join(", "));
}
```

- [ ] **Step 2: Put the vignette suite in the chain**

Run: `node test/clinical-vignettes.test.js | tail -1` → `clinical vignettes: 142 passed, 0 failed`.
In `package.json` add ` && node test/clinical-vignettes.test.js` after `node test/side-offers.test.js`.

- [ ] **Step 3: Full suite**

Run: `npm test 2>&1 | grep -E "^FAIL" ; npm test > /dev/null 2>&1; echo "exit=$?"`
Expected: no FAIL lines, `exit=0`. Count the totals for the docs:
`npm test 2>&1 | grep -oE "[0-9]+ passed" | awk '{s+=$1} END {print s}'` and the number of suites in the chain.

- [ ] **Step 4: Docs**

`README.md` line 17: update the suite and assertion counts to the numbers from Step 3; line 93: update
"`npm test` runs all 72" to the new suite count.

`CLAUDE.md`: add a section before `## Commands`:

```markdown
## Accuracy round 1 (DONE 2026-09-26) — ✅ CLINICALLY SIGNED OFF (rulings in the spec §3)

**The engine was interrogated against the bedside** — every site's own picture, 84 textbook/ED vignettes,
every finding alone on every side, phonebook-vs-model, crossing along every tract. **No site was
unreachable and no new crossing error existed**, but the COMMON pictures failed in three classes, all now
pinned by `test/clinical-vignettes.test.js` (142 assertions — the only suite that checks the model against
the textbook rather than against itself):

1. **False two-lesion claims** — a site missing one of its OWN cardinal features (its phonebook note named
   it) made the complete picture fail "explains all", so `minimalSet()` invented a second lesion: cord
   compression + retention, MCA + hemianopia, BPPV, labyrinthitis, aphasia + anomia, ACA + incontinence,
   Percheron + amnesia, neuropathy/cauda/SCD + absent ankle jerks.
2. **Dead sides** — eleven findings produced only by bilateral systemic sites returned ZERO candidates on
   one side (and suggested non-organic). Fixed two ways: motor-unit sites and the cauda are `asymmetric`
   (the known-negative filter skips them), and `app/sides.js` offers a single "Both" button for a finding
   only symmetric sites produce. `test/side-offers.test.js` asserts no offered option returns nothing.
3. **Wrong first answers** — Bell's palsy → cortex (new `forehead_involved`, the LMN mirror of
   `forehead_spared`); pure sensory stroke → midbrain (thalamus gains VPM face; lateral midbrain RARE);
   AICA → medulla (the lateral pons gains facial nucleus, cochlear, spinal V, Horner); GBS → Friedreich's
   (new `polyradiculoneuropathy_acute` site).

**Mechanisms, each small:** a structure `emit: "midline" | "bilateral"` override (`forward.js`); the
`asymmetric` site flag; a LINEAR ranking key `over − 3 × prevalence` after coverage (`PREVALENCE_ALLOWANCE`
— the pairwise "gap ≥ 3" rule was measured first and is NOT transitive); polyneuropathy COMMON (the bilateral
rule had shadowed it); BPPV posterior canal COMMON / anterior RARE; `nextStepsFor(site, { onset })` badges a
CNS site EMERGENCY at hyperacute onset when its leading cause is vascular, and keeps it when a vascular cause
is selected.

**Vocabulary stays STRICT** (owner): `weak_leg`/`weak_arm` mean PYRAMIDAL weakness to the engine; an LMN
picture is entered with LMN/myotome/reflex findings. The label should say so — parked for the UI round.

**Traps worth knowing:** the Wallenberg worked example needs a BULBAR sign (it now carries `dysphagia`) —
without one the lateral medulla and the AICA lateral pons genuinely tie, and the compare panel's job is to
name dysphagia vs facial palsy/deafness. A hand-listed composite (thalamic aphasia) must be updated when its
source site gains a row, or the stale copy out-ranks the real site.

**Open for the owner (not changed):** myasthenia does not predict plain `ptosis`; the pontine Horner rows
omit anhidrosis; an isolated Babinski ranks the cortical hand knob first.

Spec/plan: `docs/superpowers/specs/2026-09-25-accuracy-round-1-design.md`,
`docs/superpowers/plans/2026-09-26-accuracy-round-1.md`.
```

Also update the test-count line near the top of `CLAUDE.md` ("**69 test suites / 5212 assertions green**")
to the Step 3 numbers.

Set the spec's status line to `**Status: IMPLEMENTED (2026-09-26) on feat/accuracy-round-1.**` and this
plan's status line to `**Status: IMPLEMENTED (2026-09-26).**`

- [ ] **Step 5: Browser verification**

Only with the owner's go-ahead on the usage counter (opening the app on localhost posts a row to the
owner's usage sheet — spec §5). If approved, verify in the preview:
`preview_start {name: "neurolocaliser"}` → open `/app/` → enter `distal sensory loss` and confirm a single
"Both" button that enters two chips; enter `fasciculations` Left and confirm the Where card lists the anterior
horn; load the Wallenberg example and confirm it resolves to the lateral medulla; set onset to hyperacute on a
pure motor hemiparesis and confirm the header pill reads EMERGENCY. Check `read_console_messages` for errors.

- [ ] **Step 6: Commit**

```bash
git add package.json test/accuracy-mechanisms.test.js CLAUDE.md README.md docs/superpowers/
git commit -m "test: clinical vignettes join the chain; accuracy round 1 recorded

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
