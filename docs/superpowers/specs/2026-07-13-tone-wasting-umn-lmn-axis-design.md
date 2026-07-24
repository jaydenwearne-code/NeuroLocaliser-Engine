# Tone & wasting — the UMN-vs-LMN axis — design spec

**Date:** 2026-07-13
**Region increment:** muscle **tone** (`spasticity` / `hypotonia`) and **wasting** as anatomy-layer
findings that complete the classic upper- vs lower-motor-neurone discriminator
**Status:** approved design, ready for implementation planning

## Context

The engine already carries the two halves of the UMN/LMN split in fragments: UMN via `babinski`/
`hoffmann` (corticospinal, non-localising) and `umn_signs` (conus); LMN via `lmn_weakness`,
`fasciculations`, and the areflexia findings (`reflex_*_loss`). What is missing is **tone** — the
single most-taught UMN-vs-LMN discriminator — and **wasting**, the LMN atrophy sign. This increment
adds both as **pure anatomy-layer findings produced by existing structures** (no new mechanism), in the
exact shape of the reflexes increment.

The key modelling insight (settled with the user) is that **tone and wasting have different anatomical
footprints** and must not be collapsed into one "LMN sign":

- A **generalised flaccid** lesion (anterior horn, cauda, polyneuropathy) reduces **tone** at the
  bedside → `hypotonia`.
- A **focal** LMN lesion (a single root or mononeuropathy) classically causes **wasting and areflexia
  *without* a detectable tone change** → `wasting`, but **not** `hypotonia`.

So `hypotonia` gets a narrow "generalised-flaccid" footprint and `wasting` gets the broad LMN footprint.

## Decisions (settled with the user)

1. **`spasticity` (UMN, increased tone, clasp-knife)** attached wherever the corticospinal tract is
   modelled — brainstem (midbrain/pons/medulla, contra), cord (ipsi via `crosses:false`), internal
   capsule (contra), cortex motor (contra), and the conus (`crosses:false`, alongside its `umn_signs`).
   **Non-localising** (like `babinski`/`hoffmann` — it runs the length of the tract; the level is pinned
   by the accompanying localisers).
2. **`hypotonia` (LMN, reduced/flaccid tone)** — **generalised-flaccid sites only**: anterior horn,
   cauda, polyneuropathy. **Scope B.** Deliberately NOT attached to individual roots/nerves (a focal
   radiculopathy/mononeuropathy has clinically normal limb tone) and NOT to NMJ (myasthenia = normal
   tone) or muscle. Non-localising.
3. **`wasting` (LMN, muscle atrophy)** — the **broad LMN set**: anterior horn, cauda, polyneuropathy,
   **all 10 roots, and the named motor nerves**. Non-localising — the exact analogue of `fasciculations`
   (a general LMN companion pinned to a level by the weakness pattern it accompanies).
   - **Correctness nuance: wasting requires innervated muscle.** It attaches only to sites with a motor
     component. This **excludes `lat_fem_cutaneous`** (pure-sensory meralgia — no muscle to waste), and
     (already excluded on the LMN list) **NMJ** (myasthenia = weakness *without* wasting) and **muscle**.
4. **No wasting on the UMN side.** `spasticity` is the only UMN tone sign; the "UMN has no significant
   wasting" contrast is modelled by *absence*. A regression guard asserts corticospinal sites never
   predict `wasting`.

The resulting teaching table (the thing this increment makes emergent):

| | tone | wasting | reflexes / plantars (already modelled) |
|---|---|---|---|
| **UMN** | `spasticity` ↑ | — (none) | `babinski`/`hoffmann`, hyperreflexia (`umn_signs`) |
| **LMN** | `hypotonia` ↓ (generalised only) | `wasting` | areflexia (`reflex_*_loss`), `fasciculations` |

## Findings vocabulary (`src/model/findings.js`)

| Finding | CROSSES | LOCALISING | Home |
|---|---|---|---|
| `spasticity` | true (cord + conus override false) | no | corticospinal (all levels) |
| `hypotonia`  | false | no | anterior horn, cauda, polyneuropathy |
| `wasting`    | false | no | anterior horn, cauda, polyneuropathy, roots, motor nerves |

All three are **lateralised** (they carry a body side — NOT added to `NON_LATERALISED`). At bilateral
sites (anterior horn, polyneuropathy) the forward model emits each finding on **both `@left` and
`@right`**; at the cauda `@midline`; at roots/nerves `@left`/`@right`.

## Structures (`src/model/structures.js`) — companions of existing structures

**`spasticity` — 8, mirroring the Babinski attachment:**
- Brainstem (medial, contra): `cst_midbrain_spast`, `cst_pons_spast`, `pyr_spast`.
- Cord (anterior, `crosses:false` → ipsi below level): `cst_cord_spast`.
- Internal capsule (contra): `ic_spast`.
- Cortex (contra): `ctx_spast_leg` (motor_leg), `ctx_spast_arm` (motor_facearm).
- Conus (`crosses:false`, emitted @midline): `conus_spast` (companion of `conus_cst`/`umn_signs`).

**`hypotonia` — 3 (generalised-flaccid, `crosses:false`):**
- `ah_hypotonia` (motor_unit / anterior_horn, @bilateral).
- `cauda_hypotonia` (cauda / equina, @midline).
- `poly_hypotonia` (polyneuropathy / length_dependent, @bilateral).

**`wasting` — 26 (`crosses:false`):**
- Generalised-flaccid (3): `ah_wasting` (@bilateral), `cauda_wasting` (@midline), `poly_wasting`
  (@bilateral).
- Roots (10): `root_{c5,c6,c7,c8,t1,l2,l3,l4,l5,s1}_wasting` (@ipsi).
- Motor nerves (13 — every named nerve **except** `lat_fem_cutaneous`): `axillary`,
  `musculocutaneous`, `suprascapular`, `long_thoracic`, `radial`, `median`, `ulnar`, `femoral`,
  `obturator`, `superior_gluteal`, `sciatic`, `common_peroneal`, `tibial` (@ipsi).

## Scoring (`src/engine/score.js`)

No additions to `LOCALISING` — all three findings are non-localising (tone/wasting run the length of a
system; the level is pinned by the accompanying localisers, exactly like `babinski` and
`fasciculations`). The over-prediction impact is the same small non-localising weight (1) already
tolerated for the reflexes increment.

No changes to `forward.js` / `inverse.js`. Phonebook (`syndromes.js`) unchanged — these are signs within
existing sites, not new eponymous sites.

## Emergent behaviour (what the tests prove)

- **Tone accompanies the right system.** A cord hemicord (Brown-Séquard) emits `spasticity@ipsi`; a
  Weber (midbrain) emits `spasticity@contra`; an anterior-horn site emits `hypotonia` and `wasting`
  bilaterally (`@left` + `@right`); a right L5 radiculopathy emits `wasting@right` but **no** `hypotonia`
  (focal LMN → wasting without a tone change).
- **Tone/wasting discriminate without localising.** Because a UMN site predicts `spasticity@side` and
  an LMN site predicts `hypotonia`/`wasting@side`, an observed tone/wasting finding is a matched (+1)
  sign for the correct hypothesis and unexplained for the wrong one — so it *tips* an otherwise
  ambiguous weakness case toward UMN vs LMN, while never changing *which* level wins on its own (the
  non-localising annotation guarantee, verified Weber-style).
- **ALS precursor gets richer.** `spasticity` (UMN, corticospinal) co-occurring with `wasting` +
  `fasciculations` (LMN, anterior horn) and **no** sensory loss resolves to the multifocal
  UMN-cord + LMN-anterior-horn cover — the pattern the future ALS pathology layer will *name* (not built
  here).

## Testing (TDD, red first) — `test/tone.test.js`

1. **Vocabulary** — `spasticity`, `hypotonia`, `wasting` exist; `CROSSES` per the table
   (`spasticity:true`, `hypotonia:false`, `wasting:false`); none in `LOCALISING`; none in
   `NON_LATERALISED`.
2. **Structures** — `spasticity` produced at midbrain/pons/medulla/cord/capsule/cortex/conus; the cord +
   conus `spasticity` set `crosses:false`. `hypotonia` produced at exactly {anterior_horn, cauda,
   polyneuropathy}. `wasting` produced at anterior_horn/cauda/polyneuropathy + all 10 roots + the motor
   nerves; **`wasting` NOT produced at `lat_fem_cutaneous`, NMJ, or muscle**; **`spasticity` NEVER
   produced with `wasting` at a corticospinal site** (UMN-has-no-wasting guard).
3. **Forward** — left cord hemicord → `spasticity@left` (ipsi); left midbrain-medial → `spasticity@right`
   (contra); anterior horn → `hypotonia`/`wasting` on both `@left` and `@right`; right L5 root →
   `wasting@right` **and NOT** `hypotonia@right`.
4. **Non-localising annotation** — a Weber case with and without `spasticity` both localise to the medial
   midbrain (tone is a non-localising annotation, never moves the winner).
5. **UMN-vs-LMN discrimination** — an ambiguous weakness case gains `spasticity` → resolves to the UMN
   site; the same base case gains `wasting` → resolves to the LMN site.
6. **ALS precursor** — `{spasticity, wasting, fasciculations}` (no sensory loss) resolves to a multifocal
   UMN-corticospinal + LMN-anterior-horn cover.
7. **Regression** — all 12 prior suites stay green (corticospinal sites now over-predict one extra
   non-localising `spasticity`; LMN sites over-predict `wasting`/`hypotonia` — winners must still win).

## Out of scope (deferred)

- **Myopathic wasting.** Muscle-level wasting (proximal, myopathy) is a different mechanism from LMN
  denervation atrophy; kept out to keep this a clean UMN-vs-LMN motor-neurone axis. Revisit with the
  muscle/pathology work.
- **Cogwheel/lead-pipe rigidity** (extrapyramidal tone) — belongs with a future basal-ganglia/movement
  increment, not the pyramidal UMN axis.
- **Grading tone** (0–4 clonus, MRC power) — the engine is categorical (present/absent), unchanged here.
- **Naming ALS/MND** — the co-occurrence is surfaced as a multifocal cover; *naming* it is the deferred
  pathology layer.

## Verification

`npm test` — new `tone.test.js` green and all 12 prior suites green after the corticospinal + LMN
additions. Update the anatomy-review Artifact to show the tone/wasting row, per the edit-here-republish
workflow in `docs/artifacts/`. Not a medical device; anatomy tables still need neuroanatomist review.
