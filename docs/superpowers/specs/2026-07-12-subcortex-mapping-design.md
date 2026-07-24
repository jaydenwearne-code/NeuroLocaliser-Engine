# Subcortex — regional mapping design spec

**Date:** 2026-07-12
**Region increment:** the subcortex — internal capsule, thalamus, subthalamic nucleus, optic radiation
**Status:** approved design, ready for implementation planning

## Context

The engine derives syndromes from anatomy (golden rule: no syndrome is an `if` rule; `syndromes.js`
is a phonebook keyed by emergent site). Built and green (167 assertions, 6 suites): brainstem, the
spinal-cord core four, the dermatomal sensory-level mechanism, central cord / syrinx, cauda equina /
conus, and the cortex.

This increment adds the **subcortex** — the deep grey and white matter between the cortex and the
brainstem. Its defining clinical teaching point is the **cortical-vs-subcortical distinction**: a deep
lesion produces long-tract signs (dense hemiparesis, hemisensory loss, hemianopia) with **no cortical
signs** (no aphasia, neglect, gaze deviation, or higher-cortical behaviour). That absence is the
localiser.

Everything subcortical is **contralateral** (above all decussations, like the cortex), **lateralised**
(no `@none` / `@midline` / `@bilateral` tokens), and **dominance-independent** for the findings modelled
here. Consequently this is the first region that introduces **no new forward-model mechanism** — it
extends only the declarative anatomy tables (`findings.js`, `structures.js`, `sites.js`) plus one
composer that follows the existing `composeVascularCortexSites` precedent exactly. If the tests confirm
that, it is strong evidence the solver architecture has stabilised: adding a region is now pure data.

## The headline claim (what the tests must prove)

**The cortical-vs-subcortical distinction emerges from parsimony, not from a rule.** The internal
capsule packs face + arm + leg corticospinal/corticobulbar fibres into one compact site. A patient with
proportional face+arm+leg weakness and nothing else is explained by the capsule with zero
over-prediction. Any *cortical* explanation for all three together must span MCA + ACA territory and
therefore over-predicts aphasia / neglect / cortical-sensory / gaze signs — which the scorer's
over-prediction penalty punishes. The capsule wins because it is the tightest fit, not because the
engine knows the phrase "pure motor lacune".

Verified arithmetic for `{ weak_arm@R, weak_leg@R, facial_weak_umn@R }` (left-sided lesion):
- `left_subcortex_internal_capsule`: matches 3, unexplained 0, over-predict 0 → **score 3**.
- `left_cortex_mca_superior`: matches 2 (arm, face), misses `weak_leg` (−1), over-predicts 4 cortical
  signs (−2) → **score −1** (filtered out).
- No cortical composite carries leg + arm + face together, so none competes.

## Decisions (settled with the user)

1. **Scope:** internal capsule, thalamus (VPL), subthalamic nucleus, and optic radiation — plus the
   sensorimotor-lacune and anterior-choroidal composites. Richer basal-ganglia movement disorders
   (chorea, dystonia, parkinsonism) are **deferred**; hemiballismus is the one movement finding this
   pass.
2. **Approach A — reuse + parsimony (not a bespoke finding).** The capsule reuses the *existing*
   somatotopic findings `weak_arm` / `weak_leg` / `facial_weak_umn`. No `dense_hemiparesis` token is
   invented; the pure-motor localisation is emergent (see headline claim).
3. **Optic radiation is a standalone primitive** producing isolated `homonymous_hemianopia`. It
   therefore **ties** the occipital / PCA cortex site for an isolated hemianopia — which is honest, you
   cannot distinguish a pure isolated hemianopia by field defect alone. The existing cortex assertion is
   **relaxed** to accept "occipital / PCA **or** deep optic radiation" (see Testing).
4. **`thalamic_pain` stays on the VPL thalamus site.** Déjerine–Roussy (central post-stroke pain) is
   the same lesion as the pure-sensory lacune, delayed. The thalamus site therefore predicts
   `dorsal_sensory` + `spinothalamic` + `thalamic_pain`.
   **Emergent finding at implementation (documented, not forced):** a pure two-modality *body* sensory
   loss with no pain does **not** localise uniquely to the thalamus — the lateral (lemniscal/
   spinothalamic) midbrain tegmentum (`left_midbrain_lateral` = medial lemniscus + spinothalamic) is an
   equally clean contralateral ML+STT emitter and out-scores the thalamus (2 vs 1.5, the thalamus
   carrying a 0.5 `thalamic_pain` over-prediction). This is a genuine clinical ddx (thalamic vs
   lemniscal), so the engine **surfaces** it rather than hiding it. `thalamic_pain` is the discriminator
   that pins the thalamus uniquely (→ Déjerine–Roussy). The tests assert the convergence/ddx for the
   pain-free case and the unique thalamic localisation once pain is present.
5. **Pathology-agnostic, as established by the cortex.** The anatomy carries no pathology assumption.
   Vascular territory is a *separate annotation*; the deep-vascular syndromes (sensorimotor lacune,
   anterior choroidal) are a *lesion-shape composer*, not the organising primitive.

## Architecture — no new mechanism

The subcortex reuses every mechanism already in the solver:

- **Crossing** — all new findings are contralateral. `thalamic_pain` and `hemiballismus` get
  `CROSSES: true`; the reused findings (`weak_arm`, `weak_leg`, `facial_weak_umn`, `dorsal_sensory`,
  `spinothalamic`, `homonymous_hemianopia`) are already `true` in the brainstem/cortex default map, and
  no subcortex structure sets a per-structure `crosses` override (unlike the cord, whose below-decussation
  tracts flip). The forward model's standard `bodySideFor` places every finding contralateral.
- **Emission** — every subcortex site is a left/right primitive or a left/right composite; none is
  `midline` / `bilateral` / `@none`. The standard one-sided emission path handles them.
- **Gating** — no hemisphere or bilateral-only gate; `structActiveAt` passes every subcortex structure
  unchanged (they carry neither `hemisphere` nor `bilateralOnly`).
- **Composites** — `composeDeepVascularSites()` is a direct sibling of `composeVascularCortexSites()`,
  driven by a `DEEP_TERRITORY`-style grouping, and is concatenated in `inverse.candidateSites()`.

So the only edits are: three new rows of `LEVELS` / `PARTS` data, new structures, two new findings, two
`LOCALISING` additions, one new composer, its inclusion in `candidateSites()`, and phonebook entries.

## The region → function map

| Part (`subcortex\|…`) | Structures → finding (all **contra**) | Vascular territory | Emergent single-lacune syndrome |
|---|---|---|---|
| `internal_capsule` | `weak_arm`, `weak_leg`, `facial_weak_umn` | lenticulostriate (MCA perforators) | **Pure motor lacune** |
| `thalamus` (VPL) | `dorsal_sensory`, `spinothalamic`, `thalamic_pain` | thalamoperforators / thalamogeniculate (PCA) | **Pure sensory lacune / Déjerine–Roussy** |
| `subthalamic` | `hemiballismus` | posterior/thalamoperforators | **Hemiballismus** |
| `optic_radiation` | `homonymous_hemianopia` | anterior choroidal / deep MCA | isolated hemianopia, **no cortical signs** |

**Deep-vascular composites** (`composeDeepVascularSites()`):
- **Sensorimotor lacune** = `internal_capsule` + `thalamus` → contra weakness **and** hemisensory loss,
  no cortical signs (thalamocapsular lacune).
- **Anterior choroidal** = `internal_capsule` + `thalamus` + `optic_radiation` → the classic triad
  (hemiplegia + hemianaesthesia + homonymous hemianopia from one small vessel) — the subcortical analog
  of the whole-MCA composite.

## Findings vocabulary (`src/model/findings.js`)

Two new findings; the rest are reused.

```js
// Subcortical / deep grey
thalamic_pain:  { desc: "Contralateral central post-stroke pain (Déjerine–Roussy, thalamic VPL)", group: "Subcortical" },
hemiballismus:  { desc: "Contralateral hemiballismus / violent proximal flinging (subthalamic nucleus)", group: "Subcortical" },
```

`CROSSES`: `thalamic_pain: true`, `hemiballismus: true`. Neither is in `NON_LATERALISED`.

## Structures (`src/model/structures.js`)

A `subcortex` level. One structure = one finding, as always. No `crosses` overrides (defaults are
already contralateral), no `hemisphere` / `bilateralOnly` gates.

```
internal_capsule: ic_cst_arm → weak_arm; ic_cst_leg → weak_leg; ic_cbt_face → facial_weak_umn
thalamus:         thal_dc → dorsal_sensory; thal_stt → spinothalamic; thal_pain → thalamic_pain
subthalamic:      stn → hemiballismus
optic_radiation:  optic_rad → homonymous_hemianopia
```

## Sites (`src/model/sites.js`)

- Add `"subcortex"` to `LEVELS` **after `"cortex"`** (so an isolated-hemianopia tie resolves to the
  earlier-built occipital cortex site by stable sort — see Testing).
- Add the four new parts to `PARTS`: `internal_capsule`, `thalamus`, `subthalamic`, `optic_radiation`.
- Add `TERRITORY` entries for the four `subcortex|…` keys.
- Add a `DEEP_TERRITORY` annotation (sibling of the cortical `DIVISION`) mapping each part to its deep
  vessel, used by the composer.
- Add `composeDeepVascularSites()`: builds `sensorimotor` (capsule + thalamus) and `anterior_choroidal`
  (capsule + thalamus + optic radiation) composite sites per side, structures derived not hand-listed,
  exactly like `composeVascularCortexSites`.

## Forward model (`src/engine/forward.js`)

**No changes.** Every subcortex finding is lateralised and contralateral; the standard emission path and
`bodySideFor` handle them.

## Scoring (`src/engine/score.js`)

Add `thalamic_pain` and `hemiballismus` to `LOCALISING` (each strongly pins the deep grey nucleus). The
reused somatotopic findings stay **non-localising** — the pure-motor localisation is meant to emerge from
parsimony, not from a localiser weight (Approach A).

## Inverse solver (`src/engine/inverse.js`)

- Import and concatenate `composeDeepVascularSites()` in `candidateSites()`.
- `describeLevel` needs **no new branch**: a subcortex winner is not cord/cauda/conus, so with no
  sensory level it returns the neutral base, and with a stray sensory level it correctly reports "a
  sensory level suggests a spinal cord lesion, but the findings localise to `…subcortex…`".

## Phonebook (`src/data/syndromes.js`)

Descriptive entries keyed by emergent site id:
- `subcortex_internal_capsule` → **Pure motor lacune** (lenticulostriate; dense proportional face/arm/leg
  weakness, no cortical signs; ddx small-vessel lacune, deep haemorrhage; red flag: capsular warning
  syndrome / stuttering lacune).
- `subcortex_thalamus` → **Pure sensory lacune / Déjerine–Roussy** (VPL; hemisensory loss ± delayed
  central pain).
- `subcortex_subthalamic` → **Hemiballismus** (subthalamic nucleus).
- `subcortex_sensorimotor` → **Sensorimotor lacune** (thalamocapsular).
- `subcortex_anterior_choroidal` → **Anterior choroidal artery syndrome** (hemiplegia + hemianaesthesia
  + hemianopia triad).

Keyed side-agnostically where the eponym is used bilaterally, matching existing entries.

## Emergent syndromes (no rules — same scorer)

- **Pure motor lacune** — capsule beats every cortical explanation by parsimony (headline claim).
- **Pure sensory (ML+STT convergence)** — both body modalities, same side, no motor: the VPL thalamus
  and the lateral midbrain tegmentum are co-candidates (both clean contralateral ML+STT emitters); it
  beats every cord pattern (Brown-Séquard splits the sides; anterior/posterior cord spare a modality)
  and every cortical pattern. A genuine ddx the engine surfaces (see decision 4).
- **Déjerine–Roussy** — the same thalamus site with `thalamic_pain` added: uniquely thalamic (the
  lateral midbrain cannot explain central pain), the full house.
- **Hemiballismus** — subthalamic nucleus, an isolated deep localiser.
- **Sensorimotor lacune** / **anterior choroidal** — the composers, derived by unioning parts.
- **Cortical-vs-subcortical control**: a cortical presentation (weakness **with** aphasia/neglect) still
  localises to cortex, unchanged — the subcortex does not steal cortical cases.

## Testing (TDD, red first) — `test/subcortex.test.js`

New standalone suite (added to `package.json` `test` and the README/`npm test` chain). Assertions:

1. **Pure motor lacune** — `{ weak_arm, weak_leg, facial_weak_umn }` contra → best is
   `…_subcortex_internal_capsule`; beats every cortex site/composite; over-predicts nothing.
2. **Cortical-vs-subcortical** — add `aphasia_expressive` → best flips back to a dominant cortex site
   (capsule no longer explains everything). The absence/presence of cortical signs is the discriminator.
3. **Pure sensory (ML+STT convergence)** — `{ dorsal_sensory, spinothalamic }` contra → best is the
   thalamus **or** the lateral midbrain tegmentum (the honest ML+STT ddx), never cord or cortex; the VPL
   thalamus is a ranked candidate. (Uniqueness comes with pain — assertion 4.)
4. **Déjerine–Roussy** — add `thalamic_pain` → thalamus site, now exact (no over-prediction); phonebook
   names it.
5. **Hemiballismus** — `{ hemiballismus }` contra → subthalamic site; is a localising finding.
6. **Sensorimotor lacune** — weakness + hemisensory loss, no cortical signs → `…_subcortex_sensorimotor`
   composite outranks capsule-alone and thalamus-alone.
7. **Anterior choroidal** — weakness + hemisensory + hemianopia, no cortical signs →
   `…_subcortex_anterior_choroidal`; phonebook names the triad.
8. **Optic radiation tie (relaxation)** — isolated `homonymous_hemianopia` → the top candidates include
   **both** occipital/PCA and deep optic radiation at equal score; assert the deep optic radiation is a
   ranked candidate. Update the existing cortex-suite assertion from "→ occipital/PCA" to "occipital/PCA
   **or** deep optic radiation" (occipital remains `best` by stable sort because `subcortex` is built
   after `cortex`).
9. **Laterality** — a right-sided (contra-left) presentation mirrors correctly.
10. **Regression** — all six prior suites stay green.

## Modules touched

- `src/model/findings.js` — 2 findings, 2 `CROSSES` entries.
- `src/model/structures.js` — `subcortex` level, ~7 structures.
- `src/model/sites.js` — `LEVELS` + `PARTS` + `TERRITORY` + `DEEP_TERRITORY` + `composeDeepVascularSites`.
- `src/engine/score.js` — 2 `LOCALISING` additions.
- `src/engine/inverse.js` — concat the new composer in `candidateSites()`.
- `src/data/syndromes.js` — 5 phonebook entries.
- `test/subcortex.test.js` — new suite; `test/cortex.test.js` — relax the hemianopia assertion.
- `package.json`, `README.md`, `CONTRIBUTING.md` — register the suite; move subcortex Done, mark next.
- `docs/artifacts/architecture.html`, `docs/artifacts/anatomy-model.html` — sync the new region.

## Out of scope (deferred)

- Basal-ganglia movement disorders beyond hemiballismus (hemichorea, hemidystonia, vascular
  parkinsonism), and the substantia nigra (degenerative, not a discrete vascular lacune).
- Corona radiata vs internal capsule fractionation; capsular somatotopy (genu vs posterior limb).
- Ataxic hemiparesis and dysarthria–clumsy-hand lacunes (need a mixed cerebellar+pyramidal finding pair).
- Thalamic subnuclei beyond VPL (DM behavioural/amnesic thalamic syndromes, thalamic aphasia,
  vertical-gaze paresis of paramedian thalamopeduncular lesions).
- Deep haemorrhage vs infarct as first-class pathology objects (awaits the pathology + adjacency layer
  the cortex increment foreshadowed).

## Verification

`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` — the new suite green and all six
prior suites still green. Then eyeball the two synced Artifacts (the in-app browser cannot render
file://, localhost, or claude.ai, so verify statically and ask the user to view).

Not a medical device; not for clinical use. Anatomy tables still need neuroanatomist review.
