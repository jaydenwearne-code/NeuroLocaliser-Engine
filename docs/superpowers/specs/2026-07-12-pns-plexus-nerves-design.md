# PNS — plexus & named peripheral nerves (movement-based) — design spec

**Date:** 2026-07-12
**Region increment:** the focal peripheral nervous system — brachial & lumbosacral plexus, and the full
set of named upper- and lower-limb peripheral nerves, on a movement-based weakness vocabulary
**Status:** approved design, ready for implementation planning

## Context

The engine derives syndromes from anatomy (golden rule: no syndrome is an `if` rule). Built and green
(439 assertions, 10 suites): …cord…cortex…subcortex…skull base…motor unit…PNS roots + polyneuropathy.
The roots increment built per-segment radiculopathy sites (C5–T1 / L2–S1) with **lumped** myotome
findings (`weak_c7` …). This increment adds the **focal PNS between root and polyneuropathy** — the
plexus and the named nerves — and, to make the nerve-vs-root discriminators *emerge*, upgrades the
weakness vocabulary from segment-lumped to **movement-based** (Approach A, settled with the user).

## Headline claim (what the tests must prove)

**Nerve-vs-root discriminators emerge from shared MOVEMENT findings + distinct sensory territory.** A
nerve and a root can share a presentation (foot drop) and are separated by which movements are *spared*.
That only works if the movement is a shared finding produced by both. So weakness findings become
**movements** (`weak_ankle_dorsiflexion`, `weak_foot_inversion`, `weak_thumb_abduction`, …), produced by
whichever roots *and* nerves supply that muscle. The **sensory territory** (dermatome for a root,
cutaneous territory for a nerve) is the clean localiser; movements refine and discriminate:
- **L5 vs common peroneal** — both make `weak_ankle_dorsiflexion` (foot drop); only L5 adds
  `weak_foot_inversion` + `weak_hip_abduction`; the peroneal nerve spares them.
- **C8/T1 vs ulnar** — both make `weak_finger_abduction`; only the root adds `weak_thumb_abduction`
  (median APB, C8/T1); the ulnar nerve spares it.
- **C6 vs carpal tunnel (median)** — distinct territory + `weak_elbow_flexion`/reflex (root) vs
  `weak_thumb_abduction` + median territory (nerve).

## Decisions (settled with the user)

1. **Approach A — movement-based weakness vocabulary.** Replace the lumped `weak_c5…weak_s1` /
   `weak_l2…weak_s1` with shared movement findings. Dermatomes (`sensory_c5…`) and reflexes are
   unchanged; the roots' myotome structures are re-pointed at movements. `pns.test.js` root assertions
   that referenced `weak_c7` etc. are updated to the movement findings.
2. **Comprehensive named nerves**, both limbs — not just the classics. Upper: **axillary,
   musculocutaneous, suprascapular, long thoracic, radial, median, ulnar**. Lower: **femoral, obturator,
   lateral femoral cutaneous, superior gluteal, sciatic, common peroneal, tibial**.
3. **Plexus = plain root composites** (no new findings): brachial `upper_trunk` (C5–6, Erb) and
   `lower_trunk` (C8–T1, Klumpke); lumbosacral `lumbar_plexus` (L2–4) and `sacral_plexus` (L4–S1).
4. **Localising policy:** sensory findings (dermatomes + nerve territories) LOCALISE; **movements are
   non-localising** (shared across roots/nerves — they refine, not pin); reflexes stay localising. A
   pure-motor nerve (long thoracic, superior gluteal, suprascapular) localises by parsimony on its
   characteristic movement pattern.

## Architecture

No new solver mechanism. All ipsilateral (`CROSSES:false`); nerves are normal left/right sites
(`level:"nerve"`); plexus are composers (unions of the existing root sites); the movement upgrade is a
vocabulary change in `findings.js` + a re-point of the root myotome structures. Everything is
finding-driven and scored by the existing engine.

## Movement vocabulary (`src/model/findings.js`) — shared by roots AND nerves

**Removed:** `weak_c5, weak_c6, weak_c7, weak_c8, weak_t1, weak_l2, weak_l3, weak_l4, weak_l5, weak_s1`.

**Added — upper limb (12):** `weak_shoulder_abduction`, `weak_shoulder_external_rotation`,
`weak_scapular_stabilisation` (serratus / winging), `weak_elbow_flexion`, `weak_elbow_extension`,
`weak_forearm_supination`, `weak_wrist_extension`, `weak_finger_extension`, `weak_wrist_flexion`,
`weak_finger_flexion`, `weak_thumb_abduction` (APB), `weak_finger_abduction` (interossei).

**Added — lower limb (11):** `weak_hip_flexion`, `weak_hip_adduction`, `weak_hip_abduction`,
`weak_knee_extension`, `weak_knee_flexion`, `weak_ankle_dorsiflexion`, `weak_great_toe_extension`,
`weak_foot_eversion`, `weak_foot_inversion`, `weak_ankle_plantarflexion`, `weak_toe_flexion`.

**Added — nerve cutaneous territories (11, LOCALISING):** `axillary_sensory`, `musculocutaneous_sensory`,
`radial_sensory`, `median_sensory`, `ulnar_sensory`, `femoral_sensory`, `obturator_sensory`,
`lat_fem_cutaneous_sensory`, `sciatic_sensory`, `peroneal_sensory`, `tibial_sensory`.

All `CROSSES:false`. `LOCALISING` gains every `*_sensory` territory; movements are **not** added to
`LOCALISING`; the dermatome `sensory_*` and `reflex_*_loss` stay localising.

## Roots re-pointed to movements (`src/model/structures.js`)

Dermatome + reflex unchanged; myotome structure(s) now emit movements (a root supplies several):

| Root | Movements (myotome) |
|---|---|
| C5 | shoulder_abduction, elbow_flexion, shoulder_external_rotation |
| C6 | elbow_flexion, wrist_extension, forearm_supination |
| C7 | elbow_extension, wrist_flexion, finger_extension |
| C8 | finger_flexion, finger_abduction, thumb_abduction |
| T1 | finger_abduction, thumb_abduction |
| L2 | hip_flexion, hip_adduction |
| L3 | knee_extension, hip_adduction |
| L4 | knee_extension, ankle_dorsiflexion, foot_inversion |
| L5 | ankle_dorsiflexion, great_toe_extension, foot_eversion, foot_inversion, hip_abduction |
| S1 | ankle_plantarflexion, foot_eversion, knee_flexion, toe_flexion |

## Named nerves (`level:"nerve"`, one site per nerve, ipsilateral)

| Nerve | Sensory territory | Movements | Reflex |
|---|---|---|---|
| axillary | axillary (lateral shoulder) | shoulder_abduction | — |
| musculocutaneous | musculocutaneous (lateral forearm) | elbow_flexion, forearm_supination | biceps |
| suprascapular | — (deep) | shoulder_external_rotation, shoulder_abduction | — |
| long_thoracic | — (motor) | scapular_stabilisation (winging) | — |
| radial | radial (dorsal web) | wrist_extension, finger_extension | — |
| median | median (radial 3½ digits) | thumb_abduction | — |
| ulnar | ulnar (little finger + medial hand) | finger_abduction, finger_flexion | — |
| femoral | femoral (ant. thigh + saphenous) | hip_flexion, knee_extension | knee |
| obturator | obturator (medial thigh) | hip_adduction | — |
| lat_fem_cutaneous | lateral thigh (meralgia) | — (pure sensory) | — |
| superior_gluteal | — (motor) | hip_abduction (Trendelenburg) | — |
| sciatic | sciatic (below knee) | knee_flexion, ankle_dorsiflexion, ankle_plantarflexion, foot_eversion, foot_inversion | ankle |
| common_peroneal | peroneal (dorsum foot) | ankle_dorsiflexion, great_toe_extension, foot_eversion | — |
| tibial | tibial (sole) | ankle_plantarflexion, foot_inversion, toe_flexion | ankle |

(Median is modelled as the carpal-tunnel presentation; proximal/AIN median and PIN radial are deferred
variants. Suprascapular/long-thoracic/superior-gluteal are motor-only, localising by parsimony.)

## Sites & composers (`src/model/sites.js`)

- Add `"nerve"` to `LEVELS`; add the 14 nerve names to `PARTS` → `left_nerve_median` etc.
- `TERRITORY` per `nerve|<name>`.
- `composeBrachialPlexusSites()` + `composeLumbosacralPlexusSites()` (or one `composePlexusSites`):
  `upper_trunk`=C5∪C6, `lower_trunk`=C8∪T1, `lumbar_plexus`=L2∪L3∪L4, `sacral_plexus`=L4∪L5∪S1 — plain
  unions of the root sites' structures (level `plexus`, composer-only, ipsilateral left/right).

## Scoring / inverse / phonebook

- `score.js` — add the 11 `*_sensory` nerve territories to `LOCALISING`; movements NOT added. (Dermatome
  `sensory_*` and reflexes already localising.)
- `inverse.js` — concat the plexus composers in `candidateSites()`. No `describe*` change.
- `syndromes.js` — 14 nerve entries + 4 plexus entries (Erb, Klumpke, lumbar/sacral plexopathy), each
  with the classic lesion site, ddx and red flag (e.g. axillary → surgical-neck fracture / dislocation;
  radial → spiral-groove "Saturday-night"; common peroneal → fibular neck; carpal tunnel; meralgia).

## Emergent discriminators (no rules — same scorer)

- **L5 vs common peroneal**, **C8/T1 vs ulnar**, **C6 vs carpal tunnel** — as in the headline.
- **Axillary vs C5** — isolated deltoid weakness + regimental-badge (axillary) sensory → axillary; C5
  adds elbow flexion, biceps reflex and the C5 dermatome.
- **Root vs plexus** — a single dermatome/pain → root; a two-adjacent-root pattern (C5+C6) without a
  single dermatome → the trunk composite (Erb), by parsimony over two root sites.
- **Sciatic vs peroneal** — sciatic adds knee flexion + plantarflexion + tibial territory; peroneal is
  confined to dorsiflexion/eversion + dorsal-foot sensory.

## Testing (TDD, red first) — `test/pns-nerves.test.js` (+ update `test/pns.test.js`)

1. **Vocabulary** — the removed `weak_c7` etc. no longer exist; the new movement + territory findings
   exist, `CROSSES:false`.
2. **Localising policy** — `LOCALISING` has `median_sensory`/`peroneal_sensory`/… and the dermatomes;
   does NOT have the movements (`weak_ankle_dorsiflexion`, `weak_thumb_abduction`, …).
3. **Roots re-pointed** — C7 root now produces `weak_elbow_extension`/`weak_wrist_flexion`/
   `weak_finger_extension` (not `weak_c7`); L5 produces inversion + hip abduction + dorsiflexion + …
4. **Nerves & plexus** — `left_nerve_median` etc. exist; `composePlexus*` build `upper_trunk`=C5∪C6 etc.
5. **Discriminators** — L5-vs-peroneal (both foot-drop; inversion/hip-abd present→L5, absent→peroneal);
   C8/T1-vs-ulnar (thumb abduction present→root, spared→ulnar); C6-vs-carpal-tunnel; axillary-vs-C5.
6. **Root vs plexus** — C5+C6 pattern (no single dermatome dominance) → `upper_trunk` (Erb) beats two
   roots; a single C5 dermatome + radicular pain → `root_c5`.
7. **Pure-motor nerves** — winging → long_thoracic; isolated hip abduction → superior_gluteal (beats L5
   by parsimony); meralgia (pure lateral-thigh sensory) → lat_fem_cutaneous.
8. **Phonebook** — the nerves and Erb/Klumpke name correctly.
9. **Regression** — all 10 prior suites green after the movement refactor (esp. the updated `pns.test.js`).

## Modules touched

- `src/model/findings.js` — remove 10 lumped myotomes; add ~34 (movements + territories) + `CROSSES`.
- `src/model/structures.js` — re-point 10 roots' myotomes to movements; add 14 nerves (~40 structures).
- `src/model/sites.js` — `LEVELS`+`PARTS`+`TERRITORY`+`composePlexusSites`.
- `src/engine/score.js` — add territories to `LOCALISING`.
- `src/engine/inverse.js` — concat plexus composers.
- `src/data/syndromes.js` — 14 nerve + 4 plexus entries.
- `test/pns-nerves.test.js` (new) + `test/pns.test.js` (update root myotome assertions);
  `package.json`, `README.md`, `CONTRIBUTING.md`, `docs/artifacts/*`.

## Out of scope (deferred)

- Median/AIN and radial/PIN sub-lesions; nerve-segment level (elbow vs wrist for ulnar); cords vs trunks
  of the plexus; medial/lateral pectoral, thoracodorsal, subscapular, pudendal.
- Nerve conduction / EMG localisation, entrapment-specific signs (Tinel/Phalen).
- Anything requiring the tempo/pathology layers (plexitis, neuralgic amyotrophy, malignant infiltration).

## Verification

`npm test` — new suite green, all prior suites green after the movement refactor. Sync + eyeball the
Artifacts. Not a medical device; anatomy tables still need neuroanatomist review.
