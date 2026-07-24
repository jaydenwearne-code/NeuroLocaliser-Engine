# Thalamic nuclei + hypothalamus by region — design spec

**Date:** 2026-07-19
**Region increment:** map the remaining thalamic nuclei (VA/VL, VPM, pulvinar, anterior/DM) and add the
**hypothalamus** as a new region by nucleus. The thalamus already has VPL (sensory), intralaminar/paramedian
(arousal — Percheron), LGN (visual) and the dominant thalamic aphasia; this fills the motor relay, the face
sensory relay, the attention (pulvinar) and the limbic-memory (anterior/DM) nuclei, and adds the whole
hypothalamus (DI, thermoregulation, appetite, sleep/circadian, memory, endocrine).
**Status:** approved (scope: all thalamic nuclei + full hypothalamus). No new solver mechanism.

## Thalamus — additions

Existing (unchanged): VPL `subcortex/thalamus` (dorsal_sensory + spinothalamic + thalamic_pain);
`thalamus_arousal/paramedian` (reduced_consciousness + vertical_gaze_palsy); `visual_pathway/lgn`;
`aphasia_subcortical/thalamic` (dominant thalamic aphasia).

New nuclei (new lateralised `subcortex` parts, kept out of `DIVISION`/`DEEP_TERRITORY`):
- **VA/VL — motor relay** → `subcortex/thalamus_vl`, finding `thalamic_tremor` (NEW, `@none`) — the delayed
  dystonic "thalamic hand" / tremor of the ventrolateral (dentato-/pallido-thalamic) relay. A **distinct**
  finding (not reused `limb_ataxia`/`dystonia`) so it does not steal isolated cerebellar/basal-ganglia inputs.
- **VPM — face sensory relay** → extend the existing `subcortex/thalamus` (VPL) part with `thal_vpm` →
  `face_sensory_loss` (NEW, contralateral) — so the thalamic sensory relay covers face as well as body.
- **Pulvinar — attention** → `subcortex/thalamus_pulvinar`, reuses **`neglect`** (non-dominant). *(Accepted
  behaviour change: an ISOLATED `neglect` now resolves to the lean thalamic pulvinar rather than the rich
  cortical parietal — a defensible "pure neglect = focal lesion" read; `neglect` WITH other parietal signs
  (anosognosia, constructional/dressing apraxia) still resolves to the cortex, which explains them. The
  lobes-test regression is updated to test that discriminator.)*
- **Anterior + dorsomedial — limbic/memory** → `subcortex/thalamus_limbic`, finding `amnesia` (NEW, `@none`)
  — diencephalic anterograde amnesia (Papez / mammillothalamic). `amnesia` is **shared** with the
  hypothalamic mammillary bodies (Wernicke-Korsakoff), like a distributed circuit finding.
- **MGN — auditory relay**: noted, not given a localiser — a unilateral MGN lesion is clinically silent for
  hearing (auditory cortex is bilaterally represented; cortical deafness needs bilateral, already modelled).

## Hypothalamus — new region

New **`hypothalamus` LEVEL** (composer-only, MIDLINE sites via `composeHypothalamusSites()` — hypothalamic
functions are midline/bilateral). All findings `@none` (NON_LATERALISED), LOCALISING. Parts → findings:

| part | finding (NEW unless noted) | syndrome |
|------|------|----------|
| `supraoptic` | `diabetes_insipidus` | ADH failure (supraoptic / paraventricular) |
| `thermoregulatory` | `thermodysregulation` | anterior/preoptic (hyperthermia) ↔ posterior (hypothermia/poikilothermia) |
| `ventromedial` | `hyperphagia` | VMN — hyperphagia / obesity (+ rage) |
| `lateral` | `narcolepsy` | lateral area — orexin loss (narcolepsy); note aphagia/wasting |
| `suprachiasmatic` | `circadian_disruption` | SCN — sleep-wake / circadian |
| `mammillary` | `amnesia` (reused) | Wernicke-Korsakoff amnesia |
| `tuberal` | `endocrine_dysfunction` | arcuate/tuberal → pituitary axis (hypopituitarism, hyperprolactinaemia, precocious puberty) |

## Findings (`findings.js`)

9 new, all `@none` (NON_LATERALISED except `face_sensory_loss` which is contralateral — lateralised),
`CROSSES:false`, LOCALISING: `thalamic_tremor`, `face_sensory_loss` (contra), `amnesia`, `diabetes_insipidus`,
`thermodysregulation`, `hyperphagia`, `narcolepsy`, `circadian_disruption`, `endocrine_dysfunction`.

## Sites / mechanism

- Thalamic nuclei: new `subcortex` parts (`thalamus_vl`, `thalamus_pulvinar`, `thalamus_limbic`) via
  `buildSites` (lateralised); `thal_vpm` added to the existing `thalamus` part. Kept out of `DEEP_TERRITORY`
  so the deep-vascular composites are unchanged. TERRITORY entries added.
- Hypothalamus: new `hypothalamus` level; `composeHypothalamusSites()` builds one MIDLINE site per part
  (the cauda/conus midline pattern), registered in `inverse.candidateSites()`. TERRITORY entries.
- No new solver mechanism.

## Emergence (tests — `test/thalamus-hypothalamus.test.js`)

Thalamus: `thalamic_tremor` → `thalamus_vl`; `face_sensory_loss@right` (with body sensory) → the VPL/VPM
thalamus; `neglect@left` + `anosognosia@none` → cortex parietal (discriminator), isolated `neglect@left` →
`thalamus_pulvinar` (accepted); `amnesia` → `thalamus_limbic` (or mammillary — company disambiguates).
Hypothalamus: each finding → its midline hypothalamic part; `diabetes_insipidus` → supraoptic, etc.
Regression: pure body sensory still → VPL thalamus; existing thalamic aphasia / Percheron / arousal unchanged.

## Phonebook (`syndromes.js`, by `level_part`)

`subcortex_thalamus_vl` (ventrolateral / motor-relay thalamic syndrome — thalamic tremor); `subcortex_thalamus_pulvinar`
(pulvinar — thalamic neglect); `subcortex_thalamus_limbic` (anterior/dorsomedial — diencephalic amnesia);
plus the 7 hypothalamic parts (`hypothalamus_supraoptic` diabetes insipidus, `hypothalamus_thermoregulatory`,
`hypothalamus_ventromedial`, `hypothalamus_lateral`, `hypothalamus_suprachiasmatic`, `hypothalamus_mammillary`,
`hypothalamus_tuberal`).

## What this does NOT do (YAGNI)

- **No MGN localiser** (clinically silent unilaterally), no reticular nucleus (modulatory), no separate VA
  vs VL split, no VPM as a separate site (folded into the VPL sensory relay).
- **No SIADH / hyponatraemia axis, no specific pituitary hormones** — `endocrine_dysfunction` is the single
  tuberal/arcuate finding; `diabetes_insipidus` the single ADH finding.
- **No amnesia subtyping** (anterograde vs retrograde) or the full Papez circuit as a traced pathway —
  `amnesia` is one finding shared by the anterior/DM thalamus and the mammillary bodies.
