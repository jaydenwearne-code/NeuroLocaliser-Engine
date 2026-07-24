# Findings as raw observations — de-interpret & decompose (HANDOFF design)

**Date:** 2026-07-21
**Status:** ✅ **IMPLEMENTED** (2026-07-21). Plan at `docs/superpowers/plans/2026-07-21-raw-observations-refactor.md`;
TDD-executed. Parts A + B1–B4 all done; 41 suites / 1512 assertions green; app verified in-browser (Wallenberg
10/10 via palatal/vocal/dysphagia+miosis+ptosis; Cavernous sinus 9/9 emerges from raw ductions). Remaining
follow-up: the `docs/artifacts/anatomy-model.html` labels (horner/parkinsonism/gerstmann) — edit + republish
pending user go-ahead.
**Origin:** user feedback (2026-07-20/21) on the web-app prototype: *"the findings are clustered already. The
user should put in an unlinked finding — 'left arm weak' rather than 'cortical arm'; or 'ptosis' and 'down and
out' as separate, not already paired expecting a 3rd-nerve palsy."*

## The problem

Several findings encode the **interpretation/localisation**, not the raw bedside **observation**. The
examiner sees raw signs; the engine should *derive* both the syndrome and the site (derive-don't-store). The
aphasia features (`speech_nonfluent`/`comprehension_impaired`/`repetition_impaired`/`naming_impaired`, from
which Broca/Wernicke/conduction emerge) are the **model to follow** — the rest should match that shape.

Two distinct defects, two fixes:

- **Type 1 — interpreted LABEL on an already-raw sign → RELABEL** (description only; no structural/test change).
- **Type 2 — the finding is a CLUSTER of separate signs → DECOMPOSE** into raw primitives; the syndrome
  re-emerges from a structure producing the cluster. (Touches `findings.js` + `structures.js` + `score.js`
  LOCALISING + `syndromes.js` + many test suites + `app/exam-map.js` + presets.)

**User decision:** do the RELABEL pass broadly, and DECOMPOSE **all** the clusters (ocular motility, bulbar,
facial UMN/LMN, and the syndrome-clusters). Below is the executable design.

---

## Part A — RELABEL pass (Type 1, low-risk)

Rewrite the `desc` of every finding whose description names a pathway/tract/CN/diagnosis, so it states only
what is **observed** (side is entered as the body side; the engine resolves ipsi/contra). Token ids stay the
same (renaming ids is churn for no user benefit — the UI shows `desc`). Examples (non-exhaustive; sweep all):

| id | now | → raw observation |
|---|---|---|
| `hemiparesis` | "Limb weakness (corticospinal)" | "Weakness of one side (arm ± leg ± face)" |
| `weak_arm` | "Contralateral arm weakness (cortical, regional)" | "Arm weakness" |
| `weak_leg` | "…(cortical, regional)" | "Leg weakness" |
| `weak_hand` | "…(cortical hand-knob — mimics ulnar…)" | "Isolated hand/finger weakness" |
| `dorsal_sensory` | "…(medial lemniscus)" | "Loss of vibration / joint-position sense" |
| `spinothalamic` | "…(spinothalamic)" | "Loss of pain / temperature on the body" |
| `face_pain_loss` | "…(trigeminal spinal tract)" | "Loss of pain / temperature on the face" |
| `face_touch_loss` | "…(principal / main sensory nucleus…)" | "Loss of light touch on the face" |
| `cortical_sensory_arm/leg/hand` | "Cortical (discriminative)…astereognosis" | "Loss of discriminative sense (stereognosis / 2-point), arm/leg/hand" |
| `optic_neuropathy` | "…(CN II)" | "Monocular visual loss" |
| `babinski`/`hoffmann` | "(corticospinal / UMN…)" | "Extensor plantar response" / "Hoffmann's sign" |
| `spasticity` | "(clasp-knife — corticospinal / UMN)" | "Increased tone (clasp-knife / spastic)" |
| `hearing_loss` | "…(CN VIII)" | "Sensorineural hearing loss ± tinnitus" |
| `v1/v2/v3_sensory` | "…division (V1/V2/V3)" | "Facial sensory loss — forehead / cheek / jaw" |
| `emotional_lability` | "…bilateral corticobulbar" | "Pathological laughing / crying" |
| … | (sweep the rest: `lacrimation_loss`, `taste_loss`, `gustatory_loss`, quadrantanopias, etc.) | drop the tract/CN parenthetical |

Keep the localising *mechanism* (CROSSES, LOCALISING) unchanged — only prose changes. Verify the full suite
stays green (descriptions aren't asserted, so this should be inert for tests).

---

## Part B — DECOMPOSE the clusters (Type 2)

### B1. Ocular motility (the flagship — CN III/IV/VI, divisions, INO, gaze)

**New raw findings** (ductions & lid; `CROSSES:false`, ipsilateral to the affected eye; LOCALISING):
`ptosis`, `weak_adduction`, `weak_abduction`, `weak_elevation`, `weak_depression`. Reuse existing
`fixed_dilated_pupil`, `light_near_dissociation`, `gaze_palsy`, `nystagmus_*`, `skew_deviation`.

**Retire:** `cn3_palsy`, `cn4_palsy`, `cn6_palsy`, `cn3_superior_div`, `cn3_inferior_div` (and re-key their
producers).

**Structures now produce raw ductions** (the syndrome emerges):
- **CN III** (skull_base `iii_trunk`, midbrain `cn3_fascicle`, pupil `cn3_compressive`/`cn3_ischaemic`):
  `ptosis` + `weak_adduction` + `weak_elevation` + `weak_depression` (+ `fixed_dilated_pupil` for compressive).
  → "ptosis + down-and-out (can't adduct/elevate/depress)" **emerges as a III palsy**; the pupil rule stays.
- **CN III superior division** (`iii_orbit_sup`): `ptosis` + `weak_elevation`. **Inferior** (`iii_orbit_inf`):
  `weak_adduction` + `weak_depression` + `fixed_dilated_pupil`. (Divisions now emerge from *which ductions*.)
- **CN VI** (`vi_*`, pons `cn6_nucleus`→fascicle): `weak_abduction`. (Nuclear VI still = `gaze_palsy` via
  `abducens_nucleus`.)
- **CN IV** (skull_base `iv_trunk`, `trochlear_cisternal`, midbrain `cn4_nucleus` contra): `weak_depression`
  (isolated vertical diplopia; consider a `head_tilt`/`vertical_diplopia` hallmark so isolated IV separates
  from a III that also has adduction/elevation/ptosis). **DECISION for the plan:** add `vertical_diplopia`
  (or `head_tilt`) as the IV-specific raw sign, or rely on the pattern (isolated `weak_depression` = IV).
- **INO** (`mlf_pons`/`mlf_midbrain`): **DECISION** — keep `ino` as a single *observable* sign (adduction lag
  on conjugate gaze + abducting-eye nystagmus, convergence spared — a discrete bedside pattern, like Babinski
  is one sign), OR decompose to `weak_adduction_conjugate` + `abducting_nystagmus` + `convergence_spared`.
  Recommend **keeping `ino`** as a compound-but-observed sign (it is elicited as a unit and the "convergence
  spared" dissociation is hard to encode as a positive token) — but relabel it plainly.

**Affected suites:** cranial-nerves, tier1-completeness (III divisions), pupil-efferent, engine (Weber uses
cn3), consciousness (Percheron/vertical gaze — uses `vertical_gaze_palsy`, unaffected), parinaud, trochlear,
+ `app/exam-map.js` (eye-movement step) + presets (Cavernous sinus preset uses cn3/cn4/cn6 tokens).

### B2. Bulbar (`cn_bulbar`) — unify with the already-decomposed IX/X course

The CN-peripheral-course increment already split IX/X into `gag_afferent_loss`, `taste_posterior`,
`palatal_weakness`, `vocal_cord_palsy`. `cn_bulbar` is the surviving lump (used by medulla `nuc_ambiguus`,
motor-unit `ah_bulbar`/`mg_bulbar`). **Decompose** into raw signs: add `dysphagia` (+ reuse `palatal_weakness`
+ `vocal_cord_palsy`; gag via `gag_afferent_loss`). Re-key `nuc_ambiguus` (Wallenberg) → `palatal_weakness` +
`vocal_cord_palsy` + `dysphagia`; motor-unit bulbar → `dysphagia` + `dysarthria` (+ tongue via `cn12_palsy`).
Retire `cn_bulbar`. **Affected:** engine (Wallenberg), motor-unit, cranial-nerves, causes categoriser keys.

### B3. Facial weakness (`cn7_lmn` / `facial_weak_umn`) — split off the discriminator

Raw: `facial_weakness` (one hemiface) + `forehead_spared` (a raw observation — forehead moves → UMN; forehead
weak → LMN). **CN VII (LMN)** → `facial_weakness` (whole hemiface, forehead NOT spared → does not emit
`forehead_spared`). **Corticobulbar (UMN)** → `facial_weakness` + `forehead_spared`. Keep `facial_weak_branch`
(parotid). Retire `cn7_lmn`/`facial_weak_umn` (or keep `facial_weakness` as the shared token + `forehead_spared`
as the UMN marker). **Affected:** cortex, subcortex (ic_cbt), brainstem (cbt/cn7), basis pontis, pseudobulbar,
cranial-nerves, tier1.

### B4. Syndrome-clusters (decompose per the user's "all clusters")

- `horner` → **DECISION**: decompose to `miosis` + `partial_ptosis` (+ existing `anhidrosis_*`), so `ptosis`
  overlaps with the ocular-motility `ptosis` (ptosis-alone becomes non-localising — good). Or keep `horner`
  as a recognised unit. Recommend decomposing `miosis` + reusing `ptosis` (partial) — ptosis then shared by
  III / Horner / MG, localising only in combination.
- `parkinsonism` → `bradykinesia` + `rest_tremor` + (reuse `rigidity`). `chorea`/`dystonia`/`hemiballismus`
  are already single movement observations — keep.
- `gerstmann` → `agraphia` + `acalculia` + `finger_agnosia` + `left_right_disorientation` (the tetrad; the
  angular-gyrus site produces all four).
- `balint_syndrome` → `optic_ataxia` + `oculomotor_apraxia` + `simultanagnosia` (bilateral parietal).
- `kluver_bucy` → keep or decompose (hyperorality/placidity/hypersexuality) — low priority; **keep** unless
  time permits.
- `cn12_palsy` → "tongue deviation/wasting" is fairly raw; relabel only.
- `gustatory_loss`, `emotional_lability`, `suspended_sensory` → relabel (Type 1), not decompose.

---

## Ordering (recommended for the new session)

1. **Part A relabel** (inert, confidence-builder; full suite stays green).
2. **B1 ocular motility** (biggest; the exemplar) — spec-then-TDD; update exam-map + presets.
3. **B2 bulbar**, **B3 facial** (medium).
4. **B4 syndrome-clusters** (horner/parkinsonism/gerstmann/balint), each small.
5. Re-verify the app end-to-end (the app auto-benefits — findings flow through `differential()` unchanged; only
   the vocabulary changes). Update `test/app-smoke.test.js` (exam-map coverage), `app/exam-map.js`, presets.

## Cross-cutting notes / risks

- **Token renames break tests** that hard-code the old ids (`cn3_palsy@…`, `cn_bulbar@…`, `cn7_lmn@…`) — grep
  and update every suite + `app/exam-map.js` + `PRESETS` + the causes categoriser/`syndromes.js` keys.
- **Laterality:** ductions/ptosis are ipsilateral to the eye (CROSSES:false); facial_weakness/forehead per the
  existing corticobulbar crossing.
- **`app/exam-map.js`** eye-movement & bulbar steps and **`PRESETS`** (Wallenberg, Cavernous sinus, etc.) must
  be re-pointed to the new raw tokens, or the smoke test + presets break.
- Keep the emergence tests: "ptosis + weak_adduction + weak_elevation + weak_depression → CN III site";
  "isolated weak_abduction → CN VI"; "facial_weakness + forehead_spared → corticobulbar (UMN)"; "dysphagia +
  palatal_weakness + vocal_cord_palsy → nucleus ambiguus (Wallenberg)".

## Current state at handoff (so the new session has context)

- Engine: **40 suites / 1494 assertions green.** Full neuraxis + causes layer (`src/data/causes.js`, 3-source
  `causesFor`) + web-app prototype (`app/`, narrowing-differential UI) all done and verified.
- The app's Localise panel is a **narrowing differential** (`app/app.js` `differential()`): findings are
  constraints; the site list narrows as findings accumulate. It consumes the finding vocabulary directly, so
  this refactor flows through it automatically once the tokens change.
- Run app: `node app/serve.mjs` → http://localhost:8137/app/ (launch.json at `Code/.claude/launch.json`).
- Unpublished TODO: the anatomy-model artefact regenerator (scratchpad `gen-anatomy.mjs`) + neuraxis diagram.

Not a medical device; not for clinical use.
