# Aphasia taxonomy — the speech pathways & the 8 classic aphasias (+ subcortical) — design spec

**Date:** 2026-07-19
**Region increment:** replace the two stored aphasia findings (`aphasia_expressive`/`aphasia_receptive`)
with **four language features** — fluency, comprehension, repetition, naming — from which the **8 classic
aphasias** (Broca, Wernicke, conduction, global, transcortical motor/sensory, mixed transcortical, anomic)
**emerge** by parsimony over the feature set. **Repetition** is the master discriminator: perisylvian
lesions impair it; transcortical (watershed) lesions spare it (so a repetition-spared syndrome wins when
`repetition_impaired` is absent from the input — the perisylvian sites over-predict it). Plus two
**subcortical aphasias** (thalamic, striatocapsular), distinguished from the cortical ones by their
subcortical company. No new solver mechanism.
**Status:** approved design, ready for implementation

## Context

Currently only Broca (`ctx_broca`, cortex·operculum → `aphasia_expressive`, dominant) and Wernicke
(`ctx_wernicke`, cortex·temporoparietal → `aphasia_receptive`, dominant) exist, with non-dominant
homologues `motor_dysprosody` / `sensory_dysprosody`. The classic (Boston) aphasia classification is a
decision tree over three examinable features + naming:

| Aphasia | Fluency | Comprehension | Repetition |
|---------|---------|---------------|------------|
| Broca | non-fluent | intact | **impaired** |
| Wernicke | fluent | impaired | **impaired** |
| Conduction | fluent | intact | **impaired** |
| Global | non-fluent | impaired | **impaired** |
| Transcortical motor | non-fluent | intact | *spared* |
| Transcortical sensory | fluent | impaired | *spared* |
| Mixed transcortical | non-fluent | impaired | *spared* |
| Anomic | fluent | intact | *spared* |

## Design decisions (settled during brainstorming)

1. **Feature-based emergence** (decompose): remove `aphasia_expressive`/`aphasia_receptive`; add the four
   features; every aphasia type emerges from which features co-occur at a site.
2. **Scope:** the 8 classic cortical aphasias **+ subcortical** (thalamic, striatocapsular).
3. `naming_impaired` is **non-localising** — anomia is in every aphasia, so it does not discriminate the
   type (and a Broca-plus-anomia input still resolves to Broca); isolated `naming_impaired` → **anomic**,
   the least-localising aphasia (angular gyrus).
4. The new language subregions are **kept out of the `DIVISION` map** so they stay standalone language
   sites and are not swept into the MCA/ACA/PCA vascular composites.

## The findings (`findings.js`)

**Remove** `aphasia_expressive`, `aphasia_receptive` (from `FINDINGS`, `CROSSES`, `NON_LATERALISED`,
`LOCALISING`). **Add** (all **NON_LATERALISED** `@none`, `CROSSES:false`):

| Finding | Meaning | LOCALISING? |
|---------|---------|-------------|
| `speech_nonfluent` | non-fluent / effortful / agrammatic output (fluency) | yes |
| `comprehension_impaired` | impaired auditory comprehension | yes |
| `repetition_impaired` | impaired repetition (the transcortical discriminator) | yes |
| `naming_impaired` | anomia / word-finding failure (present in all aphasias) | **no** |

## Anatomical homes (`structures.js`, `sites.js`)

All language structures are `hemisphere: "dominant"` (so they emit only on the dominant-side site; default
dominant = left). The non-dominant `motor_dysprosody` / `sensory_dysprosody` homologues are unchanged.

**Perisylvian core — refactor the existing Broca/Wernicke (replace the 2 structures with feature structures):**
- operculum (Broca): `ctx_broca_fluency` → `speech_nonfluent`; `ctx_broca_repetition` → `repetition_impaired`.
- temporoparietal (Wernicke): `ctx_wernicke_comp` → `comprehension_impaired`; `ctx_wernicke_repetition` → `repetition_impaired`.

**New cortical language subregions (new `PARTS`, dominant; NOT in `DIVISION`; `TERRITORY` entries added):**
- `arcuate`: `ctx_arcuate` → `repetition_impaired` (arcuate fasciculus / supramarginal — conduction).
- `watershed_anterior`: `ctx_tcma` → `speech_nonfluent` (ACA-MCA border / SMA — transcortical motor).
- `watershed_posterior`: `ctx_tcsa` → `comprehension_impaired` (MCA-PCA border — transcortical sensory).
- `angular`: `ctx_anomic` → `naming_impaired` (angular gyrus — anomic).

**Cortical composites (new composer `composeAphasiaSites()`, dominant-gated, registered in
`inverse.candidateSites()`):**
- `aphasia_global_${side}`: structures = the perisylvian union
  `[ctx_broca_fluency, ctx_broca_repetition, ctx_wernicke_comp, ctx_wernicke_repetition, ctx_arcuate]`
  → `speech_nonfluent` + `comprehension_impaired` + `repetition_impaired`.
- `aphasia_mixed_transcortical_${side}`: structures = `[ctx_tcma, ctx_tcsa]`
  → `speech_nonfluent` + `comprehension_impaired` (repetition spared).

**Subcortical aphasias (dominant-gated composites; MIRROR the base site's full signature + the aphasia
feature, so they are never leaner than the plain thalamus/capsule for a pure sensory/motor input):**
- New dedicated structures (composer-only level `aphasia_subcortical`, so they do not pollute the plain
  subcortex/basal-ganglia sites): `th_aphasia_comp` (part `thalamic`) → `comprehension_impaired` (dominant);
  `th_aphasia_naming` (part `thalamic`) → `naming_impaired` (dominant); `sc_aphasia_nonfluent`
  (part `striatocapsular`) → `speech_nonfluent` (dominant).
- `thalamic_aphasia_${side}`: structures = `[th_aphasia_comp, th_aphasia_naming, thal_dc, thal_stt, thal_pain]`
  (reuse the VPL thalamus sensory structures) → `comprehension_impaired@none` + `naming@none` +
  `dorsal_sensory@contra` + `spinothalamic@contra` (+ thalamic_pain over-predicted).
- `striatocapsular_aphasia_${side}`: structures = `[sc_aphasia_nonfluent, ic_cst_arm, ic_cst_leg, ic_cbt_face, ic_bab, ic_hof, ic_spast]`
  (reuse the internal-capsule motor + UMN structures) → `speech_nonfluent@none` + contralateral
  hemiparesis/UMN.

**Why the composites and subcortical sites don't steal existing pictures:** each corner/composite carries
extra findings, so on the "base" input (pure motor lacune, pure sensory thalamus, a single cortical aphasia)
the plain site over-predicts less and wins; the composite wins only when its distinctive company appears.
Verified arithmetic for the subcortical mirror in particular (a pure-motor capsular input with the full
UMN signature → internal capsule, not striatocapsular).

## Scoring (`score.js`)

`LOCALISING`: **remove** `aphasia_expressive`, `aphasia_receptive`; **add** `speech_nonfluent`,
`comprehension_impaired`, `repetition_impaired`. `naming_impaired` is **not** added (non-localising).

## Emergent behaviour (tests — `test/aphasia.test.js`)

Feature triads (all `@none`); the winning site's phonebook name is the aphasia:
1. `{speech_nonfluent, repetition_impaired}` → **Broca** (operculum).
2. `{comprehension_impaired, repetition_impaired}` → **Wernicke** (temporoparietal).
3. `{repetition_impaired}` → **conduction** (arcuate) — the perisylvian sites over-predict their fluency/comprehension.
4. `{speech_nonfluent, comprehension_impaired, repetition_impaired}` → **global**.
5. `{speech_nonfluent}` → **transcortical motor** (repetition spared; Broca over-predicts repetition).
6. `{comprehension_impaired}` → **transcortical sensory** (repetition spared).
7. `{speech_nonfluent, comprehension_impaired}` → **mixed transcortical** (repetition spared; global over-predicts repetition).
8. `{naming_impaired}` → **anomic** (angular).
9. `{comprehension_impaired, dorsal_sensory@right, spinothalamic@right}` → **thalamic aphasia** (beats transcortical sensory + plain VPL thalamus).
10. `{speech_nonfluent, weak_arm@right, weak_leg@right, facial_weak_umn@right, babinski@right, hoffmann@right, spasticity@right}` → **striatocapsular aphasia** (beats transcortical motor + plain internal capsule).
11. **Regressions:** a pure-sensory `{dorsal_sensory@right, spinothalamic@right}` still → the plain VPL
    thalamus; a pure-motor capsular input (full UMN signature) still → the internal capsule; the
    non-dominant operculum still → `motor_dysprosody`.

## Emergent naming (`syndromes.js` — phonebook, by `level_part` / exact id)

`cortex_operculum` → "Broca's aphasia (non-fluent; repetition impaired)"; `cortex_temporoparietal` →
"Wernicke's aphasia (fluent; comprehension + repetition impaired)"; `cortex_arcuate` → "Conduction aphasia
(arcuate fasciculus)"; `cortex_watershed_anterior` → "Transcortical motor aphasia (anterior watershed)";
`cortex_watershed_posterior` → "Transcortical sensory aphasia (posterior watershed)"; `cortex_angular` →
"Anomic aphasia (angular gyrus)"; `aphasia_global` → "Global aphasia (perisylvian)"; `aphasia_mixed_transcortical`
→ "Mixed transcortical aphasia (isolation of the speech area — both watersheds)"; `thalamic_aphasia` →
"Thalamic aphasia (dominant thalamus)"; `striatocapsular_aphasia` → "Striatocapsular aphasia (dominant
striatum / internal capsule)".

*(Note: `cortex_operculum` / `cortex_temporoparietal` currently have no phonebook entry — the aphasia was
the finding; now the site is named. Non-dominant operculum/temporoparietal still resolve via their
dysprosody findings; keep any existing non-dominant naming.)*

## Regression watch (the refactor ripples)

The two removed findings are referenced across `test/cortex.test.js` (a `SIDELESS` list, an operculum
structure-set assertion, `ctx_broca` hemisphere assertion, sideless-emission tests) and possibly composite
MCA tests. Update every `aphasia_expressive`/`aphasia_receptive` reference to the decomposed features
(operculum dominant now emits `speech_nonfluent` + `repetition_impaired`; temporoparietal dominant emits
`comprehension_impaired` + `repetition_impaired`). Verify the MCA/ACA/PCA vascular composites are unchanged
(the new language parts are out of `DIVISION`). If any assertion shifts unexpectedly, surface it — don't
silently patch.

## What this does NOT do (YAGNI / deferred)

- **No pure alexia** (alexia without agraphia) — a reading-specific disconnection, deferred.
- **No aprosody taxonomy expansion** — the non-dominant homologues stay as `motor_dysprosody` /
  `sensory_dysprosody`, not a full mirrored 8.
- **No dysarthria/apraxia of speech, no agraphia/alexia axes, no crossed aphasia** — the four core features
  are enough to make the taxonomy emerge.
- **No fluency/comprehension grading** — binary features.
