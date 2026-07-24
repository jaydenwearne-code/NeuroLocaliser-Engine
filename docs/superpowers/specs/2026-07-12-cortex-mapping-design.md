# Cortex — regional mapping design spec

**Date:** 2026-07-12
**Region increment:** the cerebral cortex — lobar/gyral subregions, mapped to function
**Status:** approved design, ready for implementation planning

## Context

The engine derives syndromes from anatomy (golden rule: no syndrome is an `if` rule; `syndromes.js`
is a phonebook keyed by emergent site). Built and green (51 tests): brainstem, the spinal-cord core
four, the dermatomal sensory-level mechanism, central cord / syrinx, and cauda equina / conus.

This increment adds the **cortex** — the first region where **location across a 2-D surface** matters
rather than a cross-sectional pattern of tracts. It introduces:

- **Somatotopy** — "weakness" fractionates by body region (leg vs arm vs face), which is what makes
  the ACA-vs-MCA dissociation emerge.
- **Hemispheric dominance** — the first findings that depend on *which* hemisphere is hit
  (dominant → aphasia; non-dominant → neglect/dysprosody), a dominant↔non-dominant **mirror** across
  homotopic cortex.
- **Bilateral cortical syndromes** — Anton's and Balint's, which cannot arise from one hemisphere.

Everything cortical is **contralateral** (above all decussations), so crossing reuses the brainstem
default; gaze deviation is the one ipsilateral cortical sign.

## Decisions (settled with the user)

1. **Scope: the full lobar map, including soft and bilateral signs.** Not just the vascular triad —
   the complete region→function table (motor/sensory somatotopy, the dominant↔non-dominant mirror,
   frontal behavioural signs, temporal limbic/memory signs, visual-field defects, and the bilateral
   occipital/parietal syndromes).
2. **Dominance is a `solve()` option.** `solve(findings, { dominantSide })` defaults to `"left"`; a
   clinician can override for a right-dominant patient. No existing caller must pass it.
3. **Visual-field defects split by subregion** — temporal → superior quadrantanopia, parietal →
   inferior quadrantanopia, occipital → homonymous hemianopia.
4. **Anatomy-first, pathology-agnostic (the precedent).** The anatomical model has **zero pathology
   assumptions**. Vascular territory is a *separate annotation*, and vascular syndromes are the first
   *lesion-shape composer* — not the organising primitive. See "Architecture" below.

## Architecture — anatomy-first, pathology-agnostic

This is the load-bearing principle this increment sets, so later pathology work (space-occupying
lesions, seizures, demyelination) is clean:

- **The anatomy is the substrate.** Subregions, structures and findings describe what each piece of
  cortex *does*. No structure "knows" about arteries or diseases.
- **Vascular territory / MCA division is a separate annotation** — a `TERRITORY`/`DIVISION` map keyed
  by subregion, exactly like the existing `TERRITORY` const in `sites.js`. Metadata, not identity.
- **Lesion shapes are composers.** The single-subregion **primitives are the focal-lesion shape** — a
  focal tumour, plaque or seizure focus hitting one subregion localises regardless of pathology. The
  **vascular composers** (ACA / MCA-superior / MCA-inferior / whole-MCA / PCA) are the *first*
  lesion-shape family: the stroke differential. **Bilateral composers** give Anton/Balint.
- **Non-vascular multifocal explanations already come free**: the existing minimal-set solver explains
  a lesion straddling subregions without respecting a territory (a mass crossing ACA/MCA) as a derived
  set of subregions. Future pathologies add composers keyed on **anatomical adjacency**, not territory.
- **Pathology colour stays descriptive** — the phonebook's `ddx`/`red` per site carries "which
  pathologies do this," and is never reasoned with.

## The region → function map

`level: "cortex"`. `part` = a cortical **subregion**. Each subregion is annotated with a vascular
`territory` and (for MCA) a `division`.

| Lobe | Subregion (`part`) | Territory·Div | Structure → finding | Gate / laterality |
|---|---|---|---|---|
| Frontal | `motor_leg` | ACA | `ctx_motor_leg` → `weak_leg` | contra |
| Frontal | `motor_facearm` | MCA·sup | `ctx_motor_face` → `facial_weak_umn`*, `ctx_motor_arm` → `weak_arm` | contra |
| Frontal | `operculum` | MCA·sup | `ctx_broca` → `aphasia_expressive` · `ctx_motor_prosody` → `motor_dysprosody` | **dom / nondom** · sideless |
| Frontal | `frontal_eye_field` | MCA·sup | `ctx_fef` → `gaze_deviation` | ipsi (eyes toward lesion) |
| Frontal | `dlpfc` | MCA·sup | `ctx_dlpfc` → `executive_dysfunction` | either · sideless |
| Frontal | `medial_pfc` | ACA | `ctx_medial_pfc` → `abulia` | either · sideless |
| Frontal | `orbitofrontal` | ACA | `ctx_orbitofrontal` → `disinhibition` | either · sideless |
| Parietal | `sensory_facearm` | MCA·sup | `ctx_sensory_arm` → `cortical_sensory_arm` | contra |
| Parietal | `sensory_leg` | ACA | `ctx_sensory_leg` → `cortical_sensory_leg` | contra |
| Parietal | `parietal` | MCA·inf | `ctx_gerstmann` → `gerstmann` (dom); `ctx_neglect` → `neglect`, `ctx_anosognosia` → `anosognosia`, `ctx_constructional` → `constructional_apraxia`, `ctx_prosopagnosia` → `prosopagnosia` (nondom); `ctx_inf_quadrant` → `inferior_quadrantanopia`; `ctx_balint` → `balint_syndrome` | mixed (see below) |
| Temporal | `temporoparietal` | MCA·inf | `ctx_wernicke` → `aphasia_receptive` · `ctx_sensory_prosody` → `sensory_dysprosody` | **dom / nondom** · sideless |
| Temporal | `temporal` | MCA·inf | `ctx_hallucinations` → `hallucinations`, `ctx_mood` → `mood_change` (either); `ctx_verbal_memory` → `verbal_memory_impairment` (dom), `ctx_nonverbal_memory` → `nonverbal_memory_impairment` (nondom); `ctx_sup_quadrant` → `superior_quadrantanopia` (contra) | mixed |
| Occipital | `occipital` | PCA | `ctx_visual_cortex` → `homonymous_hemianopia` (contra); `ctx_anton` → `cortical_blindness` | contra; Anton bilateral-only |

\* `facial_weak_umn` is **reused** from the pons (same UMN sign). Per-structure attributes: `parietal`
`ctx_neglect` is `nondominant` **and** contra; `ctx_gerstmann` `dominant`·sideless; `ctx_anosognosia`
/`ctx_constructional`/`ctx_prosopagnosia` `nondominant`·sideless; `ctx_inf_quadrant` contra (ungated);
`ctx_balint` `bilateralOnly`·sideless. `occipital` `ctx_anton` `bilateralOnly`·sideless.

## Findings vocabulary (`src/model/findings.js`)

**26 new findings.** Group `"Cortical"` unless noted. `desc` values are the bedside description.

Lateralised (crossing applies):
- `weak_arm` — "Contralateral arm weakness (cortical, regional)" — CROSSES true
- `weak_leg` — "Contralateral leg weakness (cortical, regional)" — CROSSES true
- `cortical_sensory_arm` — "Cortical (discriminative) sensory loss, arm (astereognosis, agraphaesthesia)" — true
- `cortical_sensory_leg` — "Cortical (discriminative) sensory loss, leg" — true
- `gaze_deviation` — "Conjugate gaze deviation toward the lesion (away from the weak side)" — CROSSES **false** (ipsi)
- `neglect` — "Hemispatial neglect / inattention to the contralesional side" — true
- `homonymous_hemianopia` — "Homonymous hemianopia (± macular sparing)" — true
- `superior_quadrantanopia` — "Contralateral superior homonymous quadrantanopia (temporal / Meyer's loop)" — true
- `inferior_quadrantanopia` — "Contralateral inferior homonymous quadrantanopia (parietal radiation)" — true

Non-lateralised / sideless (emitted `@none`; listed in `NON_LATERALISED`; CROSSES entries `false` for
map completeness):
- `aphasia_expressive` — "Non-fluent (Broca's) expressive aphasia"
- `aphasia_receptive` — "Fluent (Wernicke's) receptive aphasia"
- `gerstmann` — "Gerstmann syndrome (agraphia, acalculia, finger agnosia, L–R disorientation)"
- `motor_dysprosody` — "Motor (expressive) aprosodia — flat, unmodulated speech"
- `sensory_dysprosody` — "Sensory (receptive) aprosodia — cannot read emotional prosody"
- `anosognosia` — "Anosognosia (denial / unawareness of deficit)"
- `constructional_apraxia` — "Constructional apraxia"
- `prosopagnosia` — "Prosopagnosia (impaired face recognition)"
- `executive_dysfunction` — "Executive dysfunction (poor planning, organising, sequencing)"
- `abulia` — "Apathy / abulia (reduced spontaneous behaviour)"
- `disinhibition` — "Disinhibition, personality change, irritability"
- `hallucinations` — "Hallucinations (olfactory/gustatory/visual/auditory) or episodic fear"
- `mood_change` — "Episodic mood change"
- `verbal_memory_impairment` — "Short-term verbal / written memory impairment"
- `nonverbal_memory_impairment` — "Short-term non-verbal memory impairment (e.g. music)"
- `cortical_blindness` — "Cortical blindness with unawareness (Anton's syndrome)" — bilateral-only
- `balint_syndrome` — "Balint syndrome (optic ataxia, oculomotor apraxia, simultanagnosia)" — bilateral-only

`NON_LATERALISED` (new exported set) contains every sideless finding above. `isFinding` unchanged.

## Structures (`src/model/structures.js`)

Add a cortex block. Fields already supported: `id`, `level`, `part`, `produces`, `note`, optional
`crosses`. **New optional fields:** `hemisphere: "dominant" | "nondominant"` (hemisphere gate) and
`bilateralOnly: true`. Structures without these behave exactly as today, so no existing structure
changes. Crossing is inherited from `findings.CROSSES` (contra) except `ctx_fef` (`gaze_deviation`
is `false` at the finding level, so no per-structure override is needed). Every cortex structure is
listed in the map table above; the block groups them by subregion with `note`s.

## Sites (`src/model/sites.js`)

- `LEVELS += "cortex"`. `PARTS += ["motor_leg","motor_facearm","operculum","frontal_eye_field",
  "dlpfc","medial_pfc","orbitofrontal","sensory_facearm","sensory_leg","parietal","temporoparietal",
  "temporal","occipital"]`. `buildSites` then generates left/right primitives for each subregion
  (empty `(level,part)` combos are skipped as today, so brainstem×cortex-parts etc. never appear).
- `TERRITORY` gains a `cortex|<part>` entry per subregion (human-readable, e.g.
  `"cortex|operculum": "MCA superior division (frontal operculum / Broca's area)"`).
- **New `DIVISION`/territory annotation** used by the vascular composer — a map from `part` to
  `{ territory: "ACA"|"MCA"|"PCA", division?: "superior"|"inferior" }`. This is the pathology-agnostic
  annotation layer; structures do not carry it.
- **`composeVascularCortexSites()`** — for each side, union the subregions sharing a territory into
  composite sites: `cortex_aca`, `cortex_mca_superior`, `cortex_mca_inferior`, `cortex_mca` (all MCA),
  `cortex_pca`. Each derives its structures from the annotation map (not hand-listed), sets
  `composite: true`, `side` left/right, `part` = `aca`/`mca_superior`/`mca_inferior`/`mca`/`pca`.
- **`composeBilateralCortexSites()`** — for each subregion containing ≥1 `bilateralOnly` structure
  (`occipital`, `parietal`), build one `side: "bilateral"` site (`bilateral_occipital`,
  `bilateral_parietal`) pulling *all* that subregion's structures. This is what surfaces Anton and
  Balint.

## Forward model (`src/engine/forward.js`)

`expectedFindings(site, opts = {})` and `explain(site, opts = {})` gain a resolved
`dominantSide = opts.dominantSide || "left"`. Per structure, in order:

1. **Bilateral-only gate:** if `struct.bilateralOnly` and `site.side !== "bilateral"`, skip.
2. **Hemisphere gate:** a hemisphere-gated structure emits **only on the matching unilateral (left/
   right) site**. If `struct.hemisphere` is set: on a left/right site compute the required side
   (`dominant` → `dominantSide`; `nondominant` → `otherSide(dominantSide)`) and skip if
   `site.side !== requiredSide`; on a `bilateral` or `midline` site, skip it entirely. This keeps the
   dominant↔non-dominant mirror a *unilateral* discriminator and keeps the bilateral syndromes crisp:
   `bilateral_parietal` emits `balint_syndrome` + bilateral `inferior_quadrantanopia` (not the whole
   gated Gerstmann/neglect pile), so a `[balint_syndrome@none]` input isn't sunk by over-prediction.
3. **Emission:**
   - if `NON_LATERALISED.has(finding)` → `finding@none` (once; crossing not consulted);
   - else if `site.side === "midline"` → `finding@midline` (unchanged);
   - else if `site.side === "bilateral"` → `finding@left` + `finding@right`;
   - else → `finding@<bodySideFor(...)>` (unchanged one-sided path).

`explain` mirrors the same gates and side computation. All existing (brainstem/cord/cauda) sites are
unaffected: no non-cortex structure has `hemisphere`/`bilateralOnly`, and no non-cortex finding is in
`NON_LATERALISED`.

## Scoring (`src/engine/score.js`)

`scoreSite(site, observedSet, opts = {})` passes `opts` through to `expectedFindings`. Add the crisp
cortical localisers to `LOCALISING`: `aphasia_expressive`, `aphasia_receptive`, `gerstmann`,
`motor_dysprosody`, `sensory_dysprosody`, `neglect`, `anosognosia`, `constructional_apraxia`,
`prosopagnosia`, `gaze_deviation`, `homonymous_hemianopia`, `superior_quadrantanopia`,
`inferior_quadrantanopia`, `cortical_blindness`, `balint_syndrome`, `abulia`. The soft signs
(`hallucinations`, `mood_change`, `verbal_memory_impairment`, `nonverbal_memory_impairment`,
`executive_dysfunction`, `disinhibition`) and the regional motor/sensory findings stay
non-localising — honest, since they pin location weakly. Adding ids to `LOCALISING` cannot affect
inputs that don't contain them, so existing suites are unaffected.

## Inverse solver (`src/engine/inverse.js`)

- `candidateSites()` → append `...composeVascularCortexSites()` and `...composeBilateralCortexSites()`
  (cortex primitives already arrive via `SITES`).
- Thread `dominantSide`: `rankSingle(observedSet, opts)`, `minimalSet(observedSet, opts)`,
  `solve(observedSet, options)` resolves `dominantSide = options.dominantSide || "left"`, passes it to
  scoring, and echoes it back on the result (`{ ..., dominantSide }`) so consumers can name correctly.
- `describeLevel` is unchanged: a cortex best site is not `level === "cord"`, so with no sensory level
  it returns the neutral base, and with a stray sensory level the existing non-cord branch reports the
  inconsistency gently. (Cortex needs no new level branch.)

## Phonebook (`src/data/syndromes.js`)

`nameForSite(site, opts = {})` becomes **dominance-aware for cortex**. For a `cortex` site it computes
`role = site.side === (opts.dominantSide || "left") ? "dominant" : "nondominant"` (bilateral →
`"bilateral"`), and a `BY_SITE` entry may be either the existing flat shape (all non-cortex entries,
unchanged) **or** `{ dominant, nondominant, bilateral? }` variants. Add entries:

- Vascular composites: `cortex_aca`, `cortex_mca_superior`, `cortex_mca_inferior`, `cortex_mca`,
  `cortex_pca` (each with `dominant`/`nondominant` variants where the eponym differs — e.g. dominant
  MCA-superior → Broca's-type; non-dominant → dysprosody/neglect-type).
- Focal subregions worth naming: `cortex_parietal` (dominant → Gerstmann syndrome; non-dominant →
  neglect/anosognosia syndrome), `cortex_temporoparietal` (dominant → Wernicke; non-dominant →
  sensory aprosodia), `cortex_operculum`, `cortex_medial_pfc` (abulia), `cortex_orbitofrontal`
  (orbitofrontal syndrome), `cortex_temporal`.
- Bilateral: `bilateral_occipital` (Anton's syndrome), `bilateral_parietal` (Balint's syndrome).

Each entry keeps the existing shape: `name`, `note`, `ddx` (stroke *and* non-stroke — tumour, abscess,
demyelination, seizure focus as relevant), `red`. Unnamed subregions fall back to the anatomical
description, as today.

## Emergent syndromes (no rules — same scorer)

- **ACA** → contralateral leg weakness + leg cortical sensory loss + abulia; arm/face spared.
- **MCA superior (dominant)** → contralateral face+arm weakness + cortical sensory + Broca's aphasia +
  gaze deviation toward lesion. *(non-dominant: motor dysprosody instead of aphasia.)*
- **MCA inferior (dominant)** → Wernicke's aphasia + superior/inferior quadrantanopia + Gerstmann.
  *(non-dominant: neglect + anosognosia + constructional apraxia + prosopagnosia + sensory dysprosody.)*
- **Whole MCA (dominant)** → global aphasia + dense contralateral face/arm deficit + hemianopia
  (both quadrants) + gaze deviation.
- **PCA** → isolated homonymous hemianopia (the occipital visual cortex is the *only* emitter of the
  hemianopia token; a complete radiation lesion instead presents as both quadrants).
- **Bilateral occipital → Anton's** (cortical blindness with unawareness).
- **Bilateral parietal → Balint's** (optic ataxia, oculomotor apraxia, simultanagnosia).

## Testing (TDD, red first) — `test/cortex.test.js`

1. **ACA** — `[weak_leg@right, cortical_sensory_leg@right, abulia@none]` → best `cortex_aca` (left);
   name matches /anterior cerebral/i.
2. **MCA superior, dominant (Broca)** — `[facial_weak_umn@right, weak_arm@right,
   aphasia_expressive@none, gaze_deviation@left]` → best `cortex_mca_superior` (left); name Broca/MCA
   superior.
3. **MCA inferior, dominant (Wernicke)** — `[aphasia_receptive@none, superior_quadrantanopia@right,
   gerstmann@none]` → best `cortex_mca_inferior` (left).
4. **Focal non-dominant parietal (neglect)** — `[neglect@left, anosognosia@none,
   inferior_quadrantanopia@left]` → best `cortex_parietal` (right); name mentions neglect; result has
   **no** aphasia and **no** Gerstmann. (This is the point of subregion primitives: a *focal* parietal
   picture localises to the parietal subregion, tighter than the whole MCA-inferior composite — the
   composite would over-call the territory. Dominance flips the same subregion to Gerstmann on the
   left, per test 5.)
5. **Dominance gate flips** — `expectedFindings(left cortex_operculum)` contains
   `aphasia_expressive@none` by default; with `{dominantSide:"right"}` it does **not** (it yields
   `motor_dysprosody@none` instead). Direct forward-model test of the gate.
6. **Whole MCA (dominant, global)** — the union input → best `cortex_mca` (composite), name global/
   complete MCA.
7. **PCA isolated** — `[homonymous_hemianopia@right]` → best `cortex_pca` (not `cortex_mca_inferior`).
8. **Quadrantanopia localisation** — isolated `superior_quadrantanopia@right` → best is the `temporal`
   subregion; isolated `inferior_quadrantanopia@right` → best is the `parietal` subregion. The two
   field defects localise to different lobes (they do not collapse).
9. **Anton (bilateral occipital)** — `[cortical_blindness@none]` → best `bilateral_occipital`; a single
   occipital site does **not** explain `cortical_blindness` (bilateral-only). Name Anton's.
10. **Balint (bilateral parietal)** — `[balint_syndrome@none]` → best `bilateral_parietal`; name Balint's.
11. **Regression** — the existing 8 + 5 + 22 + 8 + 8 = 51 tests stay green (new gates fire only on
    cortex structures; sideless emission only for `NON_LATERALISED`; `dominantSide` is default-valued).

## Modules touched

- `src/model/findings.js` — 26 findings, `CROSSES` entries, new `NON_LATERALISED` set.
- `src/model/structures.js` — cortex block (13 subregions), new `hemisphere` / `bilateralOnly` fields.
- `src/model/sites.js` — `LEVELS`/`PARTS`/`TERRITORY` additions, `DIVISION` annotation map,
  `composeVascularCortexSites()`, `composeBilateralCortexSites()`.
- `src/engine/forward.js` — bilateral-only gate, hemisphere gate, sideless `@none` emission, `opts`.
- `src/engine/score.js` — `LOCALISING` additions, `opts` passthrough.
- `src/engine/inverse.js` — candidate list, `dominantSide` plumbing, result echo.
- `src/data/syndromes.js` — dominance-aware `nameForSite`, cortex + bilateral entries.
- `test/cortex.test.js` (new), `package.json` test script, `README.md` status.
- Post: both artefacts (flow coverage strip + anatomy model — add a Cortex region section) and memory.

## Out of scope (deferred)

- **Pathologies as first-class objects** (space-occupying, seizure, demyelination) — this spec sets the
  anatomy-first precedent; the pathology layer and adjacency-based composers come later.
- Alexia without agraphia (dominant PCA/splenium), transcortical aphasias, apraxias beyond
  constructional, and finer somatotopy (hand vs shoulder). Macular-sparing / field-defect geometry
  beyond quadrant vs hemi. Subcortical (internal capsule, thalamus, basal ganglia) — a separate region.
- Right-hemisphere as ever *anatomically* dominant is not modelled beyond the `dominantSide` flag.
- Anatomy-table review by a neuroanatomist / neurologist (territory and division assignments here are
  POC simplifications) remains outstanding — as for every prior region.

## Verification

`cd Code/neurolocaliser-engine && PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test`
→ all six suites green (brainstem 8 + cord 5 + sensory-level 22 + central-cord 8 + cauda-conus 8 +
cortex). Node lives in `~/.local` (no system runtime); see project memory.
