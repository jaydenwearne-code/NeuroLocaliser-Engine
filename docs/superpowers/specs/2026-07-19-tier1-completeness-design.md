# Tier 1 completeness — CN I, insula, basis-pontis lacunes — design spec

**Date:** 2026-07-19
**Region increment:** three coverage-audit gaps (Increment A of Tier 1): the olfactory nerve (CN I), the
insular cortex, and the two missing lacunar syndromes (ataxic hemiparesis, dysarthria-clumsy-hand) homed at
the basis pontis. (Increment B — the peripheral-vestibular HINTS axis — is a separate follow-up.)
**Status:** approved design, ready for implementation planning
**Audit:** `docs/superpowers/audits/2026-07-19-neuraxis-coverage-audit.md` (Tier 1)

## Context

Final anatomy fills before a prototype. The engine (30 suites / 1262 assertions) covers the neuraxis
thoroughly; the audit found these three genuine gaps. All three are **pure anatomy-table extensions** — the
architecture has been stable for many increments, so no new forward/inverse/score mechanism is expected. The
one exception is a single per-structure `crosses` override on the pontocerebellar fibre (already a supported
mechanism, used by cord tracts and the trochlear nucleus).

## Findings vocabulary (`src/model/findings.js`)

| finding | desc | CROSSES | NON_LATERALISED | LOCALISING |
|---|---|---|---|---|
| `anosmia` | Loss of smell — olfactory nerve/tract (CN I) | false (ipsilateral) | no | **yes** |
| `gustatory_loss` | Central loss of taste — insula / frontal operculum | false (ipsilateral) | no | **yes** |
| `dysarthria` | Slurred / imprecise speech (articulation) — general sign | false | **yes (@none)** | **no** |

- `dysarthria` is **non-localising** on purpose: it arises from many sites (corticobulbar, basis pontis,
  insula, extrapyramidal, cerebellar). It is distinct from the existing cerebellar `ataxic_dysarthria`. The
  *combinations* localise (basis-pontis DCH = dysarthria + facial UMN; insula = dysarthria + gustatory) — the
  established movement-based philosophy (a shared/general sign refines, the specific sign pins).
- `anosmia` and `gustatory_loss` are LOCALISING (each pins its structure).

## CN I — new `olfactory` level

The olfactory bulb/tract sits on the cribriform plate / olfactory groove (anterior cranial fossa), distinct
from the middle/posterior-fossa foramina — so a small new level, not a `skull_base` part.

- **Level** `olfactory` (added to `LEVELS`); **part** `olfactory_groove` (added to `PARTS` + `TERRITORY`).
- **Structure** `olf_tract` → `anosmia` (level `olfactory`, part `olfactory_groove`); lateralised, no
  `crosses`, no gate. `buildSites` builds `left_/right_olfactory_olfactory_groove`.
- **Foster-Kennedy emerges as a 2-site cover**: an olfactory-groove/sphenoid-wing meningioma compresses the
  ipsilateral olfactory tract (`anosmia`) AND the ipsilateral optic nerve (`optic_neuropathy`, the existing
  skull-base `optic_canal` site). `solve({anosmia@L, optic_neuropathy@L})` → the multifocal cover
  (olfactory + optic_canal). The olfactory phonebook entry names Foster-Kennedy (ipsilateral anosmia +
  optic atrophy ± contralateral papilloedema; papilloedema is a raised-ICP sign for the future pathology
  layer, noted in ddx only). No dedicated composite — the honest "one mass, two structures" cover suffices.

## Insula — new cortex part `insula`

- **Part** `insula` added to the cortex `PARTS` + `TERRITORY`, but **NOT** to the `DIVISION` map —
  deliberately kept out of the vascular composites, exactly as the aphasia increment kept the language parts
  out. Reasons: (a) sweeping `gustatory_loss` into every whole-MCA prediction is clinically noisy, and
  (b) it would change the exact-set MCA composite assertions in `cortex.test.js`/`lobes.test.js`. The insular
  syndrome localises on its own primitive; a large MCA infarct that happens to include insular signs is a
  multifocal picture, not a reason to bundle gustatory loss into the MCA composite.
- **Structures** (level `cortex`, part `insula`):
  - `ins_dysarthria` → `dysarthria` (@none)
  - `ins_gustatory` → `gustatory_loss` (lateralised, ipsilateral)
- `buildSites` builds `left_/right_cortex_insula`. Isolated `gustatory_loss` → insula; `dysarthria +
  gustatory_loss` → insula. Not dominance-gated (taste/dysarthria are not language).

## Basis pontis — new `pons` part `basis_pontis`

The ventral (basilar) pons, distinct from the existing dorsal `pons|medial` tegmentum (cn6/cn7 nuclei, PPRF,
MLF) — so a basis-pontis lacune **spares** gaze/cn6/cn7, exactly the clinical picture. Carries the three
fibre systems of the ventral pons:

| structure | produces | crossing | note |
|---|---|---|---|
| `bp_cst` | `hemiparesis` | crosses:true (contra) | corticospinal in the basis pontis |
| `bp_cbt` | `facial_weak_umn` | crosses:true (contra) | corticobulbar (upper-face-sparing) |
| `bp_cbt_dys` | `dysarthria` | @none | corticobulbar → articulation |
| `bp_pcf` | `limb_ataxia` | **crosses:true override** (contra) | pontocerebellar fibres cross → ataxia on the SAME side as the weakness (both contralateral to the lesion) — the ataxic-hemiparesis hallmark |

- Add `basis_pontis` to `PARTS` + `TERRITORY` (`"pons|basis_pontis": "basilar perforators (ventral / basis
  pontis)"`). `buildSites` builds `left_/right_pons_basis_pontis`.
- **`bp_pcf` needs the `crosses:true` override** because `limb_ataxia`'s default is `false` (ipsilateral,
  the cerebellar convention). In the basis pontis the pontocerebellar fibres are pre-decussation, so the
  ataxia is contralateral — the same body side as the corticospinal weakness. This is the one non-data
  element, and it reuses the existing per-structure override (`forward.bodySideFor`).

### Emergence (no rules — same scorer)

- **Ataxic hemiparesis** — `{hemiparesis@R, limb_ataxia@R}` → `left_pons_basis_pontis`. It beats
  `left_midbrain_medial` (which also co-produces hemiparesis+ataxia but over-predicts the LOCALISING
  `cn3_palsy` + `tremor_rubral`, a heavier penalty) and beats a two-site {cst + cerebellum} cover by
  single-site parsimony.
- **Dysarthria-clumsy-hand** — `{dysarthria@none, facial_weak_umn@R}` (± mild `hemiparesis@R`) →
  `basis_pontis`. It beats the internal capsule (which explains `facial_weak_umn` but **not** `dysarthria`)
  and any cortical operculum site (which would over-predict aphasia features).
- **Pure ventral-pontine motor** — `{hemiparesis@R}` ties basis_pontis with pons|medial (both pontine pure
  motor); accepted (the classic pure-motor lacune is basis pontis anyway).

## Phonebook (`src/data/syndromes.js`)

- `olfactory_olfactory_groove` → **Olfactory groove syndrome / anosmia** (ddx: olfactory-groove /
  sphenoid-wing meningioma, head trauma with cribriform shearing, Kallmann; note Foster-Kennedy = ipsilateral
  anosmia + optic atrophy + contralateral papilloedema when the mass also compresses the optic nerve).
- `cortex_insula` → **Insular cortex syndrome** (dysarthria, central gustatory loss, ± visceral/autonomic;
  usually part of an MCA infarct).
- `pons_basis_pontis` → **Ventral pontine (basis pontis) lacune** — names both ataxic hemiparesis
  (pyramidal + crossed pontocerebellar ataxia) and dysarthria-clumsy-hand (corticobulbar dysarthria + facial
  weakness); ddx small-vessel lacunar infarct, basilar perforator disease.

## Architecture — modules touched

- `src/model/findings.js` — 3 findings; `CROSSES` (all false); `NON_LATERALISED` += `dysarthria`.
- `src/engine/score.js` — `LOCALISING` += `anosmia`, `gustatory_loss` (NOT `dysarthria`).
- `src/model/structures.js` — `olf_tract`; `ins_dysarthria` + `ins_gustatory`; `bp_cst` + `bp_cbt` +
  `bp_cbt_dys` + `bp_pcf` (the last with `crosses:true`).
- `src/model/sites.js` — `LEVELS` += `olfactory`; `PARTS` += `olfactory_groove`, `insula`, `basis_pontis`;
  `TERRITORY` += the three. **`DIVISION` unchanged** (insula stays out of the vascular composites).
- `src/engine/forward.js`, `src/engine/inverse.js` — **no change**.
- `src/data/syndromes.js` — 3 phonebook entries.
- `test/tier1-completeness.test.js` — new suite; register in `package.json`, `README.md`, `CONTRIBUTING.md`.
- Memory + artifacts — sync at the end.

## Testing (TDD, red first) — `test/tier1-completeness.test.js`

1. **Vocabulary** — the 3 findings exist; `anosmia`/`gustatory_loss` LOCALISING + lateralised; `dysarthria`
   NON_LATERALISED + NOT localising; all `CROSSES:false`.
2. **Structures** — `olfactory|olfactory_groove` → anosmia; `cortex|insula` → dysarthria+gustatory_loss;
   `pons|basis_pontis` → hemiparesis+facial_weak_umn+dysarthria+limb_ataxia; `bp_pcf` has `crosses:true`.
3. **CN I** — isolated `anosmia@L` → `left_olfactory_olfactory_groove`; `{anosmia@L, optic_neuropathy@L}` →
   a 2-site cover including olfactory + optic_canal (Foster-Kennedy); phonebook names Foster-Kennedy.
4. **Insula** — isolated `gustatory_loss@L` → `left_cortex_insula`; `{dysarthria@none, gustatory_loss@L}` →
   insula; regression: the whole-MCA composite is UNCHANGED (insula not in `DIVISION`, so
   `composeVascularCortexSites` does not include it).
5. **Basis pontis** — `{hemiparesis@R, limb_ataxia@R}` → `left_pons_basis_pontis` (ataxic hemiparesis, beats
   midbrain|medial); `{dysarthria@none, facial_weak_umn@R}` → basis_pontis (dysarthria-clumsy-hand, beats
   internal capsule); the ataxia side equals the weakness side (crossed pontocerebellar).
6. **Laterality mirror** — a right-sided basis-pontis picture mirrors.
7. **Regression** — all prior suites green (only additive; the new pons part is distinct from pons|medial, so
   existing pontine syndromes/Millard-Gubler/locked-in are untouched; verify Wallenberg/Weber/pure-motor).

## Out of scope (deferred)

- **Peripheral-vestibular HINTS axis** — Increment B (its own follow-up: head-impulse / test-of-skew /
  positional, peripheral-vs-central).
- **Corona radiata + capsular somatotopy** — Tier 2 (ataxic hemiparesis / DCH also occur at the internal
  capsule and corona radiata; this increment homes them at the basis pontis only, the classic unifying site).
- Papilloedema / raised-ICP signs (pathology layer); central gustatory laterality subtleties; olfactory
  hallucinations (uncinate seizures — ictal, not lesion).

## Verification

`PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" npm test` — new suite green, all prior suites
green. Not a medical device; anatomy tables still need neuroanatomist review.
