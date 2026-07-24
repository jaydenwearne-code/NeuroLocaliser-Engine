# Visual pathway + afferent RAPD — design spec

**Date:** 2026-07-13
**Region increment:** the visual pathway as a field-defect-geometry localiser — chiasm, optic tract and
LGN filling the middle between the existing optic nerve (skull base) and the existing radiation/occipital
stations — plus the afferent **RAPD**, which is what distinguishes the pre-geniculate stations.
**Status:** approved design, ready for implementation planning
**Sub-project 1 of 3** (visual pathway → pupillary efferent → sympathetic/Horner axis).

## Context

The engine already localises the two ends of the visual pathway: monocular loss (`optic_neuropathy`) at
the optic canal (skull base), and retrogeniculate defects (`homonymous_hemianopia` at the deep optic
radiation + occipital cortex; `superior_`/`inferior_quadrantanopia` at the temporal/parietal radiations).
This increment fills the **middle** — chiasm, optic tract, LGN — so the field-defect **geometry** pins
the station, and adds the **RAPD**.

The organising insight: **pupil (afferent) fibres leave the visual pathway at the optic tract** (to the
pretectum), so an RAPD accompanies **optic-nerve** and **optic-tract** lesions but **not** LGN /
radiation / occipital ones. The RAPD is therefore the discriminator that separates the pre-geniculate
stations from the rest — which is exactly why the roadmap says to build it here. It emerges from the
existing scorer (localising findings weigh 3×; over-prediction penalised) — **no new solver mechanism**.

## Decisions (settled with the user)

1. **Include a distinct LGN site** (reusing `homonymous_hemianopia`, no RAPD).
2. **Add `macular_sparing`** as a positive occipital (PCA) hallmark. **Consequence (accepted):** occipital's
   canonical emission becomes `homonymous_hemianopia` + `macular_sparing`, so an **isolated, featureless
   HH** (no RAPD, no macular sparing, no quadrant, no cortical company) now localises to the
   **retrochiasmal-unspecified** group (LGN / deep radiation tie) rather than defaulting to occipital —
   clinically honest. The existing occipital-HH tests are updated to include `macular_sparing` (the full
   PCA picture) or to accept the retrochiasmal group.
3. **No solver-mechanism change** — new `visual_pathway` level (lateralised `optic_tract` + `lgn` via
   `buildSites`), a `chiasm` midline site via a small composer (reusing the existing `@midline` emission),
   findings/structures/`LOCALISING`, phonebook.

## Findings vocabulary (`src/model/findings.js`) — 3 new

| Finding | CROSSES | LOCALISING | Role |
|---|---|---|---|
| `bitemporal_hemianopia` | false (`@midline`) | **yes** | chiasm — crossing nasal fibres |
| `rapd` | false (optic nerve → ipsi); **optic-tract structure overrides `crosses:true`** | **yes** | afferent limb — separates pre- from post-geniculate |
| `macular_sparing` | true (contra, like HH) | **yes** | occipital (PCA) hallmark |

Reuse `optic_neuropathy` (optic nerve, exists) and `homonymous_hemianopia` (exists, `crosses:true`).
None are `NON_LATERALISED`.

## Sites & structures

- **Optic nerve (prechiasmal)** — **reuse** `skull_base / optic_canal`. Add one structure
  `opt_rapd` (produces `rapd`, ipsilateral). The orbital-apex union (composeSkullBaseSites) picks it up
  automatically. → monocular loss + ipsilateral RAPD localises to the optic nerve.
- **Optic chiasm** — new `visual_pathway / chiasm`, **midline** site via `composeVisualPathwaySites()`
  (analogue of `composeCaudaConusSites`). Structure `chiasm_bitemp` → `bitemporal_hemianopia@midline`.
- **Optic tract** — new `visual_pathway / optic_tract` (L/R via `buildSites`). Structures `ot_hh`
  (`homonymous_hemianopia`, contra) + `ot_rapd` (`rapd`, **`crosses:true`** → contra).
- **LGN** — new `visual_pathway / lgn` (L/R via `buildSites`). Structure `lgn_hh`
  (`homonymous_hemianopia`, contra). No RAPD.
- **Occipital** — **reuse** `cortex / occipital`. Add structure `ctx_macular` → `macular_sparing` (contra).

Registration (`sites.js`): `LEVELS += "visual_pathway"`; `PARTS += "optic_tract", "lgn"` (NOT `chiasm`
— it is built only by the composer, like the cord `central` part); `TERRITORY += ` chiasm/optic_tract/lgn
labels; `composeVisualPathwaySites()` added to `inverse.candidateSites()`.

## Scoring (`src/engine/score.js`)

Add `bitemporal_hemianopia`, `rapd`, `macular_sparing` to `LOCALISING`. No scoring-code change.

## Emergent localisation (what the tests prove)

| Field defect | Localises to |
|---|---|
| monocular loss + **ipsilateral RAPD** | optic nerve (optic canal) |
| **bitemporal** hemianopia | chiasm (parasellar / pituitary) |
| homonymous hemianopia + **contralateral RAPD** | optic tract |
| homonymous hemianopia + **macular sparing** | occipital (PCA) |
| homonymous hemianopia + superior/inferior quadrant | radiation (temporal / parietal, existing) |
| **bare** homonymous hemianopia (no RAPD, no macular sparing, no quadrant) | retrochiasmal-unspecified — LGN / deep radiation tie (NOT optic tract; RAPD-negative) |

## Phonebook (`src/data/syndromes.js`)

- `visual_pathway_chiasm` → "Chiasmal (parasellar) lesion — bitemporal hemianopia" (pituitary adenoma,
  craniopharyngioma; red flag: endocrine + acuity, image the sella).
- `visual_pathway_optic_tract` → "Optic tract lesion — contralateral incongruous homonymous hemianopia
  with a (contralateral) RAPD".
- `visual_pathway_lgn` → "Lateral geniculate lesion — contralateral (often incongruous / sectoranopic)
  homonymous hemianopia; look for thalamic company (choroidal supply)".

## Testing — new `test/visual-pathway.test.js`

1. **Vocabulary** — the 3 findings exist; `CROSSES` per the table; all 3 in `LOCALISING`; none `NON_LATERALISED`.
2. **Sites/structures** — `left_visual_pathway_optic_tract` / `_lgn` exist; the chiasm midline site exists
   (`side:"midline"`); `skull_base/optic_canal` now produces `rapd`; `cortex/occipital` now produces
   `macular_sparing`.
3. **Forward** — chiasm → `bitemporal_hemianopia@midline`; left optic tract → `homonymous_hemianopia@right`
   + `rapd@right` (contra); left LGN → `homonymous_hemianopia@right` and **NOT** `rapd`; left optic canal →
   `optic_neuropathy@left` + `rapd@left` (ipsi); occipital → `macular_sparing`.
4. **Discriminators** (via `solve`) — monocular+ipsiRAPD → optic canal; bitemporal → chiasm;
   HH+contraRAPD → optic tract; HH+macular sparing → occipital/PCA; **bare HH → a retrochiasmal
   RAPD-negative site (LGN or deep radiation), NOT the optic tract**.
5. **Phonebook** — chiasm names parasellar/chiasm; optic tract names the tract.
6. **Regression** — all 14 prior suites green after the occipital-HH test updates below.

## Existing-test updates (part of this increment)

- `test/cortex.test.js`: the exact-set `occipital -> hemianopia+anton` gains `macular_sparing`; the two
  isolated-HH solve inputs (`isolated hemianopia -> occipital/PCA` and `isolated hemianopia names PCA`)
  gain `macular_sparing@right` so they still localise to occipital/PCA.
- `test/subcortex.test.js`: the "isolated hemianopia genuinely cannot be told apart" assertion broadens
  its accepted set to the retrochiasmal group (`left_subcortex_optic_radiation` / `left_visual_pathway_lgn`
  / `left_cortex_occipital` / `left_cortex_pca`) — reflecting that a bare featureless HH is now
  RAPD-negative retrochiasmal, no longer uniquely occipital.

## Out of scope (deferred)

- The pupillary **efferent** limb (CN III pupil-involving-vs-sparing, fixed dilated pupil, Adie) and
  **light-near dissociation** — sub-project 2.
- Sympathetic/**Horner** 3-order localisation — sub-project 3.
- Junctional scotoma (optic-nerve/chiasm junction), congruity as a graded finding, sectoranopia,
  monocular altitudinal defects, retinal/AION specifics.

## Verification

`PATH=… npm test` — new `visual-pathway.test.js` green and all 14 prior suites green after the
cortex/subcortex updates. Artifact sync stays deferred (with reflexes/tone/nerve-segments). Not a medical
device; anatomy tables still need neuroanatomist review.
