# Reflexes — sacral superficial + UMN release + frontal release — design spec

**Date:** 2026-07-12
**Region increment:** non-muscle reflexes as anatomy-layer findings — sacral superficial reflexes, UMN
release signs (Babinski/Hoffmann) across the whole corticospinal tract, and frontal release signs
**Status:** approved design, ready for implementation planning

## Context

The engine is a broad neuraxis of finding-driven sites. This increment adds the **non-muscle reflexes**,
all as **anatomy-layer findings produced by existing structures** (no new mechanism). They split three
ways by what they mean and where they localise. **Functional (FND) signs — Hoover's, give-way — are
explicitly NOT here; they go to a later non-organic layer** that must treat them as non-localising.

## Decisions (settled with the user)

1. **Sacral superficial reflexes** — `anal_wink_loss`, `bulbocavernosus_loss` (S2–4 arc) → the sacral
   structures at **conus + cauda**. LOCALISING to the sacral arc (they complete the sacral exam; the
   conus-vs-cauda discriminator stays the UMN-vs-LMN split).
2. **UMN release signs across ALL corticospinal sites** — `babinski` (leg / extensor plantar) +
   `hoffmann` (arm) attached wherever the corticospinal tract is modelled: brainstem
   (midbrain/pons/medulla, contra), cord (ipsi via the existing `crosses:false`), internal capsule
   (contra), cortex motor (contra). `umn_signs` stays at the conus, untouched. **Babinski/Hoffmann are
   NON-localising** (like `hemiparesis` — they run the length of the tract; they confirm UMN and feed
   the future ALS pathology layer, but the *level* is pinned by the accompanying localisers).
3. **Frontal release signs** — `grasp_reflex` (contra, LOCALISING) + `palmomental` (non-specific,
   non-localising) → the frontal cortex subregions (`medial_pfc`, `orbitofrontal`).

## Findings vocabulary (`src/model/findings.js`)

| Finding | CROSSES | LOCALISING | Home |
|---|---|---|---|
| `babinski` | true (cord override false) | no | corticospinal (all levels) |
| `hoffmann` | true (cord override false) | no | corticospinal (all levels) |
| `anal_wink_loss` | false | **yes** | conus + cauda (S2–4) |
| `bulbocavernosus_loss` | false | **yes** | conus + cauda (S2–4) |
| `grasp_reflex` | true | **yes** | frontal cortex (medial_pfc) |
| `palmomental` | true | no | frontal cortex (orbitofrontal) |

## Structures (`src/model/structures.js`) — 18 new, all companions of existing structures

- **Brainstem** (medial, contra): `cst_midbrain_bab/_hof`, `cst_pons_bab/_hof`, `pyr_bab/_hof` (the
  tract carries both limbs, so each level gets both Babinski + Hoffmann).
- **Cord** (anterior, `crosses:false` → ipsi below level): `cst_cord_bab`, `cst_cord_hof`.
- **Internal capsule** (contra): `ic_bab`, `ic_hof` (the capsule is compact — both).
- **Cortex** (somatotopic, contra): `ctx_bab` (motor_leg), `ctx_hof` (motor_facearm).
- **Sacral** (`crosses:false`, emitted @midline by the conus/cauda sites): `conus_anal`, `conus_bulbo`,
  `cauda_anal`, `cauda_bulbo`.
- **Frontal** (contra): `ctx_grasp` (medial_pfc), `ctx_palmomental` (orbitofrontal).

## Scoring (`src/engine/score.js`)

Add `anal_wink_loss`, `bulbocavernosus_loss`, `grasp_reflex` to `LOCALISING`. **Not** `babinski`,
`hoffmann`, `palmomental` (non-localising — Babinski/Hoffmann run the length of the tract; palmomental
is non-specific). This also keeps the over-prediction impact small (a corticospinal site gaining two
non-localising UMN findings adds only a 0.5×2 over-prediction where they aren't observed).

No changes to `forward.js` / `inverse.js`. Phonebook unchanged (these are signs within existing sites,
not new eponymous sites) — though the conus/cauda and myelopathy notes could mention them.

## Emergent behaviour (what the tests prove)

- **UMN signs accompany corticospinal lesions** — a cord hemicord (Brown-Séquard) now also emits
  `babinski@ipsi` + `hoffmann@ipsi`; a Weber (midbrain) emits them contralaterally; a bilateral cord
  (transverse) emits bilateral Babinski. Because they're non-localising, adding/omitting them does not
  change *which* site wins — they annotate the UMN quality (and set up ALS: bilateral corticospinal →
  bilateral Babinski = the UMN half).
- **Sacral reflexes pin the sacral arc** — `anal_wink_loss` + `bulbocavernosus_loss` localise to
  conus/cauda (not higher); with `umn_signs` → conus, with `lmn_weakness` → cauda (unchanged split).
- **Frontal release localises frontal** — `grasp_reflex` (contra) → the frontal cortex / ACA territory.

## Testing (TDD, red first) — `test/reflexes.test.js`

1. **Vocabulary** — the 6 findings exist; `CROSSES` per the table; `babinski`/`hoffmann` NOT localising,
   `anal_wink_loss`/`bulbocavernosus_loss`/`grasp_reflex` localising.
2. **Structures** — Babinski produced at midbrain/pons/medulla/cord/capsule/cortex; the cord Babinski/
   Hoffmann set `crosses:false`; sacral reflexes at conus + cauda; frontal at medial_pfc/orbitofrontal.
3. **Forward** — left cord hemicord emits `babinski@left` (ipsi); left midbrain-medial emits
   `babinski@right` (contra); conus emits `anal_wink_loss@midline`; left medial_pfc emits
   `grasp_reflex@right`.
4. **UMN signs don't change localisation** — Weber with and without Babinski both localise to the
   medial midbrain (Babinski is a non-localising annotation).
5. **Sacral arc** — `{anal_wink_loss, bulbocavernosus_loss, umn_signs, saddle_anaesthesia,
   sphincter_dysfunction}@midline` → conus; the sacral reflexes localise to the sacral region.
6. **Frontal release** — `{grasp_reflex@right, abulia@none}` → the medial-frontal / ACA site.
7. **Regression** — all 11 prior suites stay green (the corticospinal sites now over-predict two extra
   non-localising findings; the winners must still win). Fix any close-call shift revealed.

## Out of scope (deferred)

- **FND / non-organic signs** (Hoover's, give-way, entrainment, tubular fields) — their own later
  non-organic layer; they localise to nothing and need the solver to flag rather than localise.
- Cremasteric (L1–2) and abdominal (T8–12) superficial reflexes — need cord-segment granularity the
  generic cord level doesn't have yet (they'd ride the sensory-level axis later).
- Splitting `umn_signs` itself, and Hoffmann's cervical-vs-above precision (the generic cord can't
  separate cervical from thoracic — Hoffmann on the cord is a known simplification).

## Verification

`npm test` — new suite green and all 11 prior suites green after the corticospinal additions. Sync +
eyeball the Artifacts. Not a medical device; anatomy tables still need neuroanatomist review.
