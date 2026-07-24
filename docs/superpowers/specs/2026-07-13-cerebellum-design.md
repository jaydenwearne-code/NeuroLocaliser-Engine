# Cerebellum (as an organ) — design spec

**Date:** 2026-07-13
**Region increment:** add the **cerebellum** as a new anatomical level so the cerebellar syndromes
localise by subdivision — **hemisphere** (ipsilateral appendicular signs), **vermis** (midline axial
signs), **flocculonodular** lobe (vestibulocerebellar) — plus a **pancerebellar** composite for the
diffuse degenerations. Until now the cerebellum existed only as its brainstem peduncles (SCP/MCP/ICP →
`limb_ataxia`); this models the organ itself.
**Status:** approved design, ready for implementation planning

## Context

The neuraxis is otherwise complete, but the cerebellum is only represented by its **peduncles** in the
brainstem: `scp_midbrain`, `mcp_pons`, `icp_medulla` (and `cpa_ataxia` at the CPA) all produce
`limb_ataxia` (ipsilateral, LOCALISING), and `red_nucleus` produces `tremor_rubral`. There is no
cerebellum-as-target and, crucially, no **hemisphere-vs-vermis** localising split — the single most
important cerebellar localisation on exam (appendicular/limb signs = hemisphere; axial/truncal/gait
signs = vermis).

This increment adds the organ following the standard recipe (findings → structures → sites → phonebook →
tests-first) with **no new solver mechanism**: it reuses ipsilateral crossing (`limb_ataxia` is already
`crosses:false`), non-lateralised `@none` emission (the higher-cortical pattern), midline composer sites
(the cauda/conus pattern), and a bilateral composite (the basal-ganglia / motor-unit pattern).

## Design decisions (settled during brainstorming)

1. **Three parts** — hemisphere + vermis + **flocculonodular** (the vestibulocerebellum). The user chose
   to include the flocculonodular lobe rather than fold its signs into the vestibular system.
2. **Appendicular companions, all localising** — the hemisphere carries `limb_ataxia` (reused) plus
   `dysmetria`, `dysdiadochokinesis`, `intention_tremor`, and **all four are LOCALISING**. They don't
   discriminate *which* cerebellar part (all hemisphere), but the user chose to weight the appendicular
   cluster fully rather than treat the companions as non-localising enrichment.
3. **Pancerebellar composite** — include a bilateral diffuse site for the degenerations (paraneoplastic,
   toxic, alcoholic, hereditary SCA), analogous to the basal-ganglia bilateral-disease sites.
4. **Axial/vestibulocerebellar signs are non-lateralised** — `truncal_ataxia`, `ataxic_dysarthria`,
   `nystagmus` go in `NON_LATERALISED` (emit `@none`). Clinically correct (there is no "left truncal
   ataxia") and the technical enabler for the pancerebellar composite (see below).

## Anatomy: level, structures, findings

**New level `cerebellum`** with three parts:

| Part | Laterality | Structures → findings |
|------|-----------|----------------------|
| `hemisphere` | ipsilateral (lateralised, `buildSites`) | `limb_ataxia` *(reused)*, `dysmetria`, `dysdiadochokinesis`, `intention_tremor` — `crosses:false`, LOCALISING |
| `vermis` | midline (composer) | `truncal_ataxia`, `ataxic_dysarthria` — NON_LATERALISED (`@none`) |
| `flocculonodular` | midline (composer) | `nystagmus` — NON_LATERALISED (`@none`) |

**Findings (`findings.js`) — six new:**
- Appendicular (group "Cerebellar"): `dysmetria`, `dysdiadochokinesis`, `intention_tremor`. Add to
  `CROSSES` with `false` (ipsilateral, matching `limb_ataxia`).
- Axial / vestibulocerebellar (group "Cerebellar"): `truncal_ataxia`, `ataxic_dysarthria`, `nystagmus`.
  Add to **`NON_LATERALISED`** so they emit `@none`. (They may still be given a `CROSSES` entry for map
  completeness — the value is moot because `NON_LATERALISED` short-circuits emission to `@none` before
  the crossing rule is consulted; follow the existing convention used for the sideless higher-cortical
  findings.)
- `limb_ataxia` is reused unchanged (already `crosses:false`, already LOCALISING).

### The two laterality classes (the crux)

The forward model (`expectedFindings`) resolves side in this order: `NON_LATERALISED` → `@none`; else
midline site → `@midline`; else bilateral site → `@left`+`@right`; else the crossing rule. So:

- **Appendicular** findings are lateralised and ipsilateral: a `left_cerebellum_hemisphere` lesion emits
  `limb_ataxia@left`, `dysmetria@left`, `dysdiadochokinesis@left`, `intention_tremor@left`.
- **Axial** findings are `NON_LATERALISED` → always `@none`, regardless of the emitting site's side. This
  is what makes the vermis (`midline`), flocculonodular (`midline`), and pancerebellar (`bilateral`)
  sites all emit `truncal_ataxia@none` / `nystagmus@none` **consistently** — a bilateral site would
  otherwise emit them `@left`+`@right` and fail to match a `@none` vermis-style input.

### Discrimination from the existing peduncles (emerges by company)

A cerebellar **hemisphere** lesion emits the rich appendicular cluster (4 LOCALISING findings). The
brainstem peduncle structures emit `limb_ataxia` embedded in brainstem company (e.g. the lateral medulla
also emits `face_pain_loss` + `spinothalamic` + `horner` = Wallenberg). So a *pure appendicular* picture
localises to the cerebellar hemisphere; `limb_ataxia` accompanied by crossed brainstem signs localises to
the peduncle/brainstem site. No special-casing — the over-prediction penalty + 3× localising weight do it.

## Sites & composers

- **hemisphere** → `buildSites`: add `cerebellum` to `LEVELS`, `hemisphere` to `PARTS`, and
  `TERRITORY["cerebellum|hemisphere"]`. Yields `left_cerebellum_hemisphere` / `right_cerebellum_hemisphere`.
- **vermis + flocculonodular** → new **`composeCerebellumMidlineSites()`** (side `"midline"`, the
  cauda/conus pattern), ids `cerebellum_vermis` / `cerebellum_flocculonodular`. These parts are **not**
  in `PARTS`, so `buildSites` never makes left/right copies. `TERRITORY` entries added for both.
- **pancerebellar** → new **`composeCerebellumPancerebellarSites()`** (side `"bilateral"`, the
  basal-ganglia pattern), id `cerebellum_pancerebellar`, unioning **all** cerebellum structures. Emits
  the appendicular findings `@left`+`@right` and the axial findings `@none`.
- Both composers registered in `inverse.candidateSites()` alongside the others.

## Scoring (`score.js`)

All six new findings → `LOCALISING` (3× weight): `dysmetria`, `dysdiadochokinesis`, `intention_tremor`,
`truncal_ataxia`, `ataxic_dysarthria`, `nystagmus`. (No non-localising members — the user chose the
appendicular companions localising, and the axial signs pin their midline parts.)

## Emergent naming (`syndromes.js` — phonebook, no logic)

Keyed by emergent site id, attached after localisation:

| Key | Named | ddx / note |
|---|---|---|
| `cerebellum_hemisphere` | Cerebellar hemisphere syndrome | ipsilateral appendicular ataxia; PICA/SCA infarct, tumour/mets, MS, abscess |
| `cerebellum_vermis` | Cerebellar vermis syndrome | truncal/gait ataxia, ataxic dysarthria; medulloblastoma, alcoholic (superior vermis) degeneration, ADEM |
| `cerebellum_flocculonodular` | Flocculonodular syndrome | nystagmus, vertigo, gait imbalance; medulloblastoma / ependymoma (children) |
| `cerebellum_pancerebellar` | Pancerebellar syndrome | diffuse; paraneoplastic, toxic (phenytoin, lithium, alcohol), hereditary SCA, hypothyroid |

The hemisphere entry is side-agnostic (ipsilateral either side → the same syndrome), so it is a plain
entry keyed by `cerebellum_hemisphere` (the `nameForSite` level_part fallback resolves both
`left_/right_cerebellum_hemisphere`). The three composite sites (`cerebellum_vermis`,
`cerebellum_flocculonodular`, `cerebellum_pancerebellar`) key on their exact site id.

## Tests — `test/cerebellum.test.js` (new; added to `npm test` chain + README)

TDD, red-first, house style (`ok(label, cond)`, `process.exit`):

1. **Vocabulary:** the 6 findings exist; `dysmetria`/`dysdiadochokinesis`/`intention_tremor` are
   `crosses:false` and LOCALISING and NOT in `NON_LATERALISED`; `truncal_ataxia`/`ataxic_dysarthria`/
   `nystagmus` are in `NON_LATERALISED` and LOCALISING; `limb_ataxia` still `crosses:false` + LOCALISING.
2. **Structures:** hemisphere → the 4 appendicular findings; vermis → truncal_ataxia + ataxic_dysarthria;
   flocculonodular → nystagmus. No cerebellum structure sets a `crosses` override (appendicular inherit
   `false` from `CROSSES`; axial are `NON_LATERALISED`).
3. **Forward:**
   - `left_cerebellum_hemisphere` → `limb_ataxia@left` + `dysmetria@left` + `dysdiadochokinesis@left` +
     `intention_tremor@left` (ipsilateral); NOT any `@right`.
   - `cerebellum_vermis` (midline) → `truncal_ataxia@none` + `ataxic_dysarthria@none`.
   - `cerebellum_flocculonodular` → `nystagmus@none`.
   - `cerebellum_pancerebellar` (bilateral) → appendicular `@left` AND `@right`; axial `@none` (assert no
     `truncal_ataxia@left`).
4. **Inverse emergence:**
   - pure appendicular `limb_ataxia@left`+`dysmetria@left`+`dysdiadochokinesis@left`+`intention_tremor@left`
     → `left_cerebellum_hemisphere`, named hemisphere syndrome;
   - `truncal_ataxia@none`+`ataxic_dysarthria@none` → `cerebellum_vermis`;
   - `nystagmus@none` → `cerebellum_flocculonodular`;
   - the full diffuse set (bilateral appendicular `@left`+`@right` + axial `@none`) →
     `cerebellum_pancerebellar`, named pancerebellar.
5. **Regression watch (explicit):** all 18 existing suites stay green. In particular the existing
   `limb_ataxia` peduncle localisations must NOT be pulled to the cerebellar hemisphere:
   - a full Wallenberg (lateral medulla) still → the medulla site;
   - a CPA mass with ataxia still → the CPA site;
   - any brainstem test whose winner emits `limb_ataxia` keeps its winner (the cerebellar hemisphere
     only explains `limb_ataxia` and over-predicts the 3 appendicular companions → penalised).
   If any brainstem/CPA assertion shifts, that is a real finding to surface, not silently patched.

## What this increment does NOT do (YAGNI / deferred)

- **No new solver mechanism** — reuses ipsilateral crossing, `@none` emission, midline composer, and
  bilateral composite patterns already in the codebase.
- **Nystagmus is single-source here (flocculonodular only).** FLAGGED for a later increment: nystagmus is
  genuinely **multi-source** — brainstem (MLF/INO, gaze centres, vestibular nuclei), cerebellum
  (flocculonodular), and peripheral vestibular / inner ear. The right long-term model is a **shared,
  multi-source finding** (as `limb_ataxia` already spans peduncles + hemisphere, discriminated by
  company), adding brainstem and peripheral-vestibular producers and the **peripheral-vs-central**
  distinction (unidirectional/fatigable/suppressed-by-fixation vs gaze-evoked/direction-changing/
  vertical). Out of scope now; do not forget.
- **No anterior-lobe / superior-vermis split** — one `vermis` part suffices; the alcoholic
  gait-predominant picture is noted in the vermis phonebook ddx, not a separate site.
- **No cerebellar hypotonia / pendular reflexes / rebound** — the appendicular cluster is enough to pin
  the hemisphere; these would be non-localising enrichment. Deferred.
- **No cognitive-affective (Schmahmann) syndrome** — posterior-vermis/cognitive cerebellum deferred.
