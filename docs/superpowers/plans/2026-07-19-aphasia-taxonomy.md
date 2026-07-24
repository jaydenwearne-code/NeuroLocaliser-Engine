# Aphasia taxonomy — Implementation Plan (as-built)

Full spec: `docs/superpowers/specs/2026-07-19-aphasia-taxonomy-design.md`. Implemented inline; all 26 suites
green (1044 assertions). This records the as-built shape.

## What was done
1. **Findings** (`findings.js`): removed `aphasia_expressive` / `aphasia_receptive`; added the 4 features
   `speech_nonfluent`, `comprehension_impaired`, `repetition_impaired` (LOCALISING) and `naming_impaired`
   (NON-localising) — all `@none` (NON_LATERALISED), `CROSSES:false`.
2. **Scoring** (`score.js`): removed the 2 old, added the 3 localising features (not `naming_impaired`).
3. **Structures** (`structures.js`): decomposed Broca (operculum → `ctx_broca_fluency` +
   `ctx_broca_repetition`) and Wernicke (temporoparietal → `ctx_wernicke_comp` + `ctx_wernicke_repetition`),
   all dominant; added `ctx_arcuate` (arcuate → repetition), `ctx_tcma` (watershed_anterior → nonfluent),
   `ctx_tcsa` (watershed_posterior → comprehension), `ctx_anomic` (angular → naming); added subcortical
   feature structures at composer-only level `aphasia_subcortical` (`th_aphasia_comp`, `th_aphasia_naming`,
   `sc_aphasia_nonfluent`).
4. **Sites** (`sites.js`): added parts `arcuate` / `watershed_anterior` / `watershed_posterior` / `angular`
   to `PARTS` (kept OUT of `DIVISION` so they don't join the vascular composites); TERRITORY entries; new
   composer `composeAphasiaSites()` building `aphasia_global` (perisylvian union), `aphasia_mixed_transcortical`
   (both watersheds), `thalamic_aphasia` (mirrors VPL thalamus + comprehension/naming) and
   `striatocapsular_aphasia` (mirrors internal capsule + nonfluent). Registered in `inverse.candidateSites()`.
5. **Phonebook** (`syndromes.js`): named all 8 cortical + 2 subcortical (by `level_part`).
6. **Tests**: new `test/aphasia.test.js` (30 assertions — the 8 types + 2 subcortical + regressions);
   updated `test/cortex.test.js` (feature refactor) and `test/subcortex.test.js` (see ripple below).
   Registered in `package.json` + README.

## Ripple resolved (recorded)
The subcortex "cortical-vs-subcortical distinction" test asserted `{weak_arm, facial, aphasia}` → cortex
(MCA superior). With **striatocapsular aphasia** now modelled, aphasia + pure motor is legitimately
*subcortical*, so a minimal face+arm+aphasia input resolves to `striatocapsular_aphasia` (it over-predicts
fewer signs than the rich MCA-superior composite). The test's real intent is the cortical-vs-subcortical
distinction, so it was updated to add a genuinely **cortical** discriminator (`gaze_deviation`, a frontal-eye-
field sign a subcortical lesion cannot produce) → flips cleanly to MCA superior. Known model behaviour: a
minimal aphasia + face/arm-weakness picture with NO cortical signs localises to striatocapsular aphasia — a
defensible deep-lesion read; a cortical sign (gaze deviation, cortical sensory loss, hemianopia) moves it to
the cortex.
