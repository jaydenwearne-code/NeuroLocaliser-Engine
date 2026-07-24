# Corpus callosum — callosal disconnection (split-brain) syndrome — design spec

**Date:** 2026-07-19
**Region increment:** map the corpus callosum as a midline tract region so the **callosal disconnection
(split-brain) syndrome** emerges — the last classic disconnection syndrome not yet modelled (conduction /
arcuate, pure alexia / splenium-VWFA, transcortical / watershed, and INO / MLF are already done). A tract
is just a site; the disconnection deficit is the finding it emits — no new mechanism.
**Status:** approved, ready to build.

## Context

Disconnection syndromes = white-matter tract lesions that disconnect two intact grey regions. The engine
already models several (arcuate → conduction aphasia; splenium/VWFA → alexia without agraphia; watershed →
transcortical/isolation aphasias; MLF → INO / one-and-a-half; central tegmental tract → palatal tremor). The
corpus callosum itself is unmodelled (only mentioned in the alexia note).

Callosal signs (Geschwind): the deficits fall on the hand/field controlled by the **non-dominant**
hemisphere (the left hand, for a left-dominant person), which is cut off from left-hemisphere language.
- **Anterior (genu / body):** left-hand ideomotor / verbal-command **apraxia** (+ left-hand agraphia),
  **alien hand / intermanual conflict**.
- **Splenium (posterior):** left-hand **tactile anomia** (objects felt with the left hand cannot be named,
  though they can be used); the splenium is also the visual half of pure alexia (already at the VWFA).

## Design decisions

1. **A new `corpus_callosum` level, MIDLINE sites** (the corpus callosum is midline) built by
   `composeCorpusCallosumSites()` (the hypothalamus / cauda pattern, id == `corpus_callosum_<part>`), two
   parts: `anterior` and `splenium`.
2. **Findings are `@none`** — the callosal syndrome is recognised as a whole; the left-hand specificity is
   noted in the phonebook rather than modelled as a body side (the "non-dominant-hand" laterality is
   dominance-relative and awkward to lateralise; `@none` keeps it clean and in-pattern with the other
   cognitive findings).
3. **Reuse `alien_limb`** (already produced by the SMA) for the callosal alien hand — so an *isolated*
   `alien_limb` still resolves to the SMA (the commoner frontal alien hand, a lean buildSites site), while
   `alien_limb` + `callosal_apraxia` resolves to the callosum (which explains both).
4. **Do not duplicate `alexia_without_agraphia`** at the splenium — it stays at the VWFA; the splenium
   phonebook note cross-references its visual-disconnection role. The splenium's distinct sign here is
   `tactile_anomia`.

## Findings (`findings.js`)

2 new, `@none` (NON_LATERALISED), `CROSSES:false`, LOCALISING:
- `callosal_apraxia` — left-hand (unilateral) apraxia + agraphia from anterior callosal disconnection.
- `tactile_anomia` — left-hand tactile anomia (cannot name objects felt with the left hand; splenial/body
  callosal disconnection).

## Structures / sites

New composer-only level `corpus_callosum`:
- `cc_apraxia` (part `anterior`) → `callosal_apraxia`.
- `cc_alien`   (part `anterior`) → `alien_limb` (reused).
- `cc_tactile` (part `splenium`) → `tactile_anomia`.

`composeCorpusCallosumSites()` → midline sites `corpus_callosum_anterior` ({callosal_apraxia, alien_limb})
and `corpus_callosum_splenium` ({tactile_anomia}); registered in `inverse.candidateSites()`. TERRITORY
entries added. `LOCALISING` += the two findings.

## Emergence (tests — `test/callosal.test.js`)

- `callosal_apraxia@none` → `corpus_callosum_anterior`; `tactile_anomia@none` → `corpus_callosum_splenium`.
- `callosal_apraxia@none` + `alien_limb@none` → `corpus_callosum_anterior` (explains both).
- **Regression:** isolated `alien_limb@none` still → `cortex_sma` (the SMA keeps it; the callosum anterior
  over-predicts `callosal_apraxia`).
- Naming: the sites name the callosal disconnection (anterior / splenial).

## Phonebook (`syndromes.js`, by `level_part`)

`corpus_callosum_anterior` (anterior callosal disconnection — left-hand apraxia / agraphia, alien hand);
`corpus_callosum_splenium` (splenial disconnection — left-hand tactile anomia; also the visual half of pure
alexia, whose word-form deficit sits at the VWFA).

## YAGNI / deferred

- No dominance-relative left-hand lateralisation (findings are `@none`).
- No diagonistic dyspraxia, no Marchiafava-Bignami as a separate entity, no left-hemialexia as a separate
  finding (folded into the splenial note / existing alexia).
