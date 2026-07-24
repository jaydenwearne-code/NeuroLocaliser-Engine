# PNS — radiculopathy & length-dependent polyneuropathy — design spec

**Date:** 2026-07-12
**Region increment:** the sensory-bearing peripheral nervous system, first slice — nerve roots
(radiculopathy, C5–T1 / L2–S1) and length-dependent polyneuropathy
**Status:** approved design, ready for implementation planning

## Context

The engine derives syndromes from anatomy (golden rule: no syndrome is an `if` rule). Built and green
(344 assertions, 9 suites): brainstem, cord core four, sensory level, central cord, cauda/conus, cortex,
subcortex, skull base, motor unit. The **motor-unit** increment did the *pure-motor* endings; this one
opens the **sensory-bearing** peripheral levels with its two ends — the focal/segmental **root** and the
diffuse/length-dependent **polyneuropathy** — which discriminate cleanly and motivate the flagged
`lmn_weakness` demotion. Plexus + named mononeuropathies are the next increment.

**This increment carries the one genuinely new mechanism the peripheral chain needs: length-dependence.**
Each half uses the *right* mechanism, not a forced analogy (see the two headline claims).

## Headline claims (what the tests must prove)

1. **Roots are finding-driven SITES, not an orthogonal axis.** The cord *sensory level* is an axis
   because the tracts are identical at every segment — nothing in the findings distinguishes T4 from T10.
   **Roots are the opposite:** each root has distinct dermatome/myotome/reflex findings, so the segment
   **emerges from the finding-set** (like cortical subregions), scored normally. A dermatome/myotome
   *mismatch* (C7 sensory + C5 myotome) then surfaces as a low score / multifocal hypothesis — the honest
   "not one root" — with no special machinery.
2. **Length-dependence is the orthogonal axis, and stocking-glove EMERGES.** Polyneuropathy is one
   diffuse bilateral site; *how far the deficit has ascended* is the orthogonal annotation (new
   `nerveLength.js`, the structural twin of `levels.js`). An **axon-length rank** coordinate places the
   `fingertips` at the **same rank as the `knees`**. A dying-back process has a length threshold and
   involves every region at or above it, so when the reach hits the knees the fingertips (equal rank) are
   recruited → **the glove appears**, derived from comparing axon lengths, not stored as a rule. "Hands
   numb but feet spared" is flagged **inconsistent** with length-dependence (feet are longer, must go
   first), separating it from a multifocal pattern.

## Decisions (settled with the user)

1. **Full root set** — C5, C6, C7, C8, T1 (upper limb) and L2, L3, L4, L5, S1 (lower limb): ten roots,
   each a per-segment site with dermatome + myotome + (where classic) reflex findings.
2. **`nerveLength.js` orthogonal axis** for polyneuropathy, with the axon-length-rank emergence of
   stocking-glove.
3. **`lmn_weakness` is demoted to non-localising here** (the flagged refactor). Roots use segment-specific
   `weak_*`; polyneuropathy uses `distal_motor_weakness`; cauda/conus keep saddle + sphincter (+ umn_signs)
   as their localisers. The cauda/conus and motor-unit suites are re-verified green after the demotion.

## Architecture

- **Roots** — normal left/right sites (`level: "root"`, `part`: the segment). No new mechanism: the
  segment emerges from the finding-set via the existing scorer; mismatch → multifocal via existing cover.
  All findings ipsilateral (`CROSSES: false`).
- **Polyneuropathy** — a bilateral site (composer-built, like the motor-unit sites), reusing bilateral
  emission. The **only** new machinery is `nerveLength.js` + a `describeLength()` annotation on the
  result (parallel to `describeLevel`), attached when the winner is the polyneuropathy site.
- **No changes** to `forward.js`. `score.js` gains the new localisers and **loses `lmn_weakness`**.
  `inverse.js` concatenates the polyneuropathy composer and calls `describeLength`.

## The root → finding map (`level: "root"`, one site per segment, ipsilateral)

| Root | Dermatome (`sensory_*`) | Myotome (`weak_*`) | Reflex (`reflex_*_loss`) |
|---|---|---|---|
| C5 | lateral upper arm | shoulder abduction | biceps |
| C6 | thumb / lateral forearm | elbow flexion / wrist ext | brachioradialis |
| C7 | middle finger | elbow extension | triceps |
| C8 | little finger | finger flexion | — |
| T1 | medial arm / axilla | finger abduction (intrinsics) | — |
| L2 | anterior thigh | hip flexion | — |
| L3 | lower anterior thigh / knee | knee extension | knee |
| L4 | medial shin | ankle dorsiflexion | knee |
| L5 | dorsum foot / great toe | great-toe extension (EHL) | — |
| S1 | lateral foot / sole | ankle plantarflexion | ankle |

Each root site also produces the shared `radicular_pain`. (The knee jerk is L3 **and** L4 — they
discriminate by dermatome/myotome, which is the point.)

## Findings vocabulary (`src/model/findings.js`)

27 new findings, group `"Root / LMN"` or `"Peripheral nerve"`, all `CROSSES: false`, none
`NON_LATERALISED`:
- **Dermatomal sensory (10):** `sensory_c5 … sensory_t1`, `sensory_l2 … sensory_s1`.
- **Myotomal weakness (10):** `weak_c5 … weak_t1`, `weak_l2 … weak_s1`.
- **Reflex loss (5):** `reflex_biceps_loss` (C5), `reflex_brachioradialis_loss` (C6),
  `reflex_triceps_loss` (C7), `reflex_knee_loss` (L3/L4), `reflex_ankle_loss` (S1).
- **Polyneuropathy (2):** `distal_sensory_loss`, `distal_motor_weakness` (bilateral).

Reused: `radicular_pain` (already exists).

**`LOCALISING` (score.js):** every `sensory_*`, `weak_*`, `reflex_*_loss` (each pins a segment), plus
`distal_sensory_loss` (the stocking-glove sensory hallmark). **Not** localising: `distal_motor_weakness`
(keeps parsimony room), `radicular_pain` (shared "it's a root" sign, not segment-specific — unchanged).
**Removed from `LOCALISING`: `lmn_weakness`** (decision 3).

## Structures (`src/model/structures.js`)

- `root` level: for each of the ten segments, structures producing its dermatome, myotome, (reflex where
  classic) and `radicular_pain`. ~35 structures, ids like `root_c7_derm`, `root_c7_myo`,
  `root_c7_reflex`, `root_c7_pain`. No `crosses`/gates.
- `polyneuropathy` level: `poly_sensory → distal_sensory_loss`, `poly_motor → distal_motor_weakness`.

## Sites (`src/model/sites.js`)

- Add `"root"` to `LEVELS`; add the ten segment parts (`c5 … s1`) to `PARTS` → `build Sites` makes
  `left_root_c7` / `right_root_c7` etc.
- `TERRITORY` entries per `root|<segment>` (dermatome/myotome/reflex summary).
- `composePolyneuropathySites()`: one **bilateral** site `polyneuropathy_length_dependent` (level
  `polyneuropathy`, not in `LEVELS`/`PARTS`, composer-only — like the motor-unit sites), structures
  derived. `TERRITORY` entry for it.

## New mechanism — `src/model/nerveLength.js` (orthogonal axis)

A pure module, the twin of `levels.js`: an ordered **axon-length rank** coordinate + pure helpers, no
knowledge of sites/scoring. Longer axon = higher rank = fails earlier (more vulnerable in a dying-back
process). The interleave of limbs is the point — `fingertips` share a rank with `knees`.

```js
export const LENGTH_RANK = {   // higher = longer axon = affected earlier
  toes: 10, feet: 9, ankles: 8, mid_calf: 7, knees: 6, thighs: 4, hips: 2,   // lower limb
  fingertips: 6, hands: 5, forearms: 4, upper_arms: 2                        // upper limb (fingertips == knees)
};
// describeLength(reach): threshold = LENGTH_RANK[reach]; involved = regions with rank >= threshold;
//   glove = LENGTH_RANK.fingertips >= threshold (DERIVED, not stored); + severity + note.
// describeLength({regions}): consistent length-dependent pattern iff observed == {rank >= min observed rank}
//   (e.g. hands-without-feet is INCONSISTENT — feet outrank hands and must be involved first).
```

`inverse.js` gains `describeLength(best, opts)` returning a `length` annotation, attached when the winner
is the polyneuropathy site (parallel to `describeLevel`); `solve(findings, { distalReach })` /
`{ distalRegions }` passes the axis input, and the result echoes a `length` object. Non-poly winners get a
gentle "not applicable" note.

## Phonebook (`src/data/syndromes.js`)

- `root_c5 … root_s1` → "C5 radiculopathy" … "S1 radiculopathy", each with dermatome/myotome/reflex note,
  ddx (disc, foraminal stenosis, tumour, herpes zoster) and the red flag (progressive/bilateral →
  image; myelopathy vs radiculopathy).
- `polyneuropathy_length_dependent` → "Length-dependent (stocking-glove) polyneuropathy", ddx (diabetes,
  alcohol, B12, uraemia, drugs/toxins, hereditary), red flag (rapidly ascending / non-length-dependent →
  think GBS / vasculitis / demyelinating, not a stocking-glove).

## Emergent syndromes (no rules — same scorer)

- **C7 radiculopathy** — `sensory_c7 + weak_c7 + reflex_triceps_loss` (± radicular pain), ipsilateral →
  `root_c7`; likewise each segment.
- **Mismatch is not one root** — `sensory_c7 + weak_c5` (one side) fails to fit any single root well →
  multifocal / no confident single site (the honest "two roots or a plexus" answer).
- **Root vs polyneuropathy** — unilateral dermatomal + radicular pain → root; bilateral distal symmetric →
  polyneuropathy.
- **Stocking-glove** — `describeLength(knees)` recruits the fingertips (equal rank) → glove; `ankles`
  does not; hands-without-feet is flagged non-length-dependent.

## Testing (TDD, red first) — `test/pns.test.js`

New standalone suite (added to `package.json` and the README/`npm test` chain):

1. **Vocabulary** — the 27 new findings exist, `CROSSES:false`, not `NON_LATERALISED`.
2. **Localising policy incl. the demotion** — `LOCALISING` (imported from `score.js`) **has**
   `sensory_c7` / `weak_c7` / `reflex_triceps_loss` / `distal_sensory_loss` and **does NOT have**
   `lmn_weakness` (demoted) or `radicular_pain`.
3. **Structures** — each root produces its dermatome/myotome/(reflex)/pain; poly produces the two distal
   findings; no `crosses`/gate fields.
4. **Sites & composer** — `left_root_c7` etc. exist; `composePolyneuropathySites` builds one bilateral
   site.
5. **Forward** — `left_root_c7` emits `sensory_c7@left` / `weak_c7@left` / `reflex_triceps_loss@left`;
   polyneuropathy emits `distal_sensory_loss@left` and `@right`.
6. **Root emergence** — C7 / S1 / L5 pictures localise to `root_c7` / `root_s1` / `root_l5`; a
   C7-sensory + C5-myotome picture does **not** yield a confident single root (multifocal or unexplained).
7. **Root vs polyneuropathy** — unilateral dermatomal → a root; bilateral distal → polyneuropathy.
8. **`nerveLength.js` unit** — `LENGTH_RANK.fingertips === LENGTH_RANK.knees`; `describeLength("ankles")`
   → no glove; `describeLength("knees")` → glove (fingertips involved); `describeLength({regions:["hands"]})`
   without feet → not length-dependent.
9. **Length annotation via solve** — `solve(poly, {distalReach:"knees"}).length.glove === true`;
   `{distalReach:"ankles"}` → `false`; a non-poly winner → `length.applies === false`.
10. **Laterality** — a right-sided C7 picture → `right_root_c7`.
11. **Phonebook** — `root_c7` names C7 radiculopathy; the poly site names the stocking-glove neuropathy.
12. **Regression + demotion safety** — all nine prior suites stay green, **especially cauda/conus and
    motor-unit** after removing `lmn_weakness` from `LOCALISING`.

## Modules touched

- `src/model/findings.js` — 27 findings + `CROSSES`.
- `src/model/structures.js` — `root` (10 segments, ~35 structures) + `polyneuropathy` (2).
- `src/model/sites.js` — `LEVELS` + `PARTS` + `TERRITORY` + `composePolyneuropathySites`.
- `src/model/nerveLength.js` — **new** orthogonal-axis module.
- `src/engine/score.js` — add localisers, **remove `lmn_weakness`**.
- `src/engine/inverse.js` — concat the poly composer; add `describeLength` + `distalReach`/`distalRegions`
  option; return `length`.
- `src/data/syndromes.js` — 10 root + 1 polyneuropathy entries.
- `test/pns.test.js` — new suite; `package.json`, `README.md`, `CONTRIBUTING.md` — register + roadmap.
- `docs/artifacts/*` — sync the new region.

## Out of scope (deferred)

- **Plexus (brachial/lumbosacral) + named mononeuropathies** (median/ulnar/radial/peroneal) — the next
  increment; plexus trunks/cords as composites of roots, nerves as territory sites.
- Thoracic roots beyond the dermatomal band; individual muscle grading; EMG/NCS; small-fibre and
  autonomic neuropathy; non-length-dependent neuropathies (GBS, MMN, vasculitic mononeuritis multiplex) —
  the latter belong with the pathology/tempo layers.
- The reflex arc as an explicit structure (reflexes are modelled as segment findings for now).

## Verification

`npm test` — new suite green and all nine prior suites green (with `lmn_weakness` demoted). Sync and
eyeball the two Artifacts. Not a medical device; anatomy tables still need neuroanatomist review.
