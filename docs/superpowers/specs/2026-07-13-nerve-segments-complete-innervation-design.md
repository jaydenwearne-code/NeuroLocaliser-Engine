# Complete nerve innervation + nerve-segment sites — design spec

**Date:** 2026-07-13
**Region increment:** extend each named nerve to its FULL motor innervation, and split the four
classically-segmented nerves (radial, ulnar, median, common peroneal) into **level segments** so the
elbow-vs-wrist (proximal-vs-distal) discriminator emerges
**Status:** approved design, ready for implementation planning

## Context

The plexus/nerves increment gave each named nerve a *representative* movement subset. This increment
(REQUIRED refinement (b)) completes the motor innervation and adds **nerve-segment sites** for the four
nerves where a proximal-vs-distal lesion is classically taught. A segment is just a `part` under the
existing `nerve` level (the roots pattern): a proximal segment emits the **superset** of the distal
one's findings, so which proximal muscle / cutaneous branch is **spared** localises the level — pure
parsimony (localising findings weigh 3×, over-prediction is penalised), **no new solver mechanism**.

The other 10 nerves stay single full-muscle-set sites. `buildSites` iterates `LEVELS × PARTS`, so each
new segment is registered in `PARTS` + `TERRITORY` and gets its own structures.

## Decisions (settled with the user)

1. **Split radial / ulnar / median / common_peroneal into level segments** (11 parts total). Other
   nerves keep a single part.
2. **Model the spared cutaneous branches additively** — a distal lesion spares the nerve's
   proximally-branching cutaneous nerve, so add a finding for that branch, present in the proximal
   segment only. (Not by splitting the existing territory findings.)
3. **Model the ulnar paradox** — `ulnar_claw` is produced by the **distal (wrist)** segment only,
   because the intact FDP 4/5 claws the fingers; the proximal (elbow) segment spares it (FDP also
   paralysed → less claw). `ulnar_claw` is LOCALISING (pins the distal ulnar lesion).
4. **No solver / forward / score-mechanism changes** — findings, structures, `PARTS`, `TERRITORY`,
   `LOCALISING` only.

## Findings vocabulary (`src/model/findings.js`) — 6 new

| Finding | CROSSES | LOCALISING | Meaning / role |
|---|---|---|---|
| `weak_forearm_pronation` | false | no | pronator teres/quadratus (median) — proximal-vs-distal median |
| `weak_thumb_adduction` | false | no | adductor pollicis (ulnar, Froment's sign) |
| `deep_peroneal_sensory` | false | **yes** | first dorsal web (deep peroneal) — deep-vs-superficial |
| `ulnar_dorsal_sensory` | false | **yes** | dorsal ulnar cutaneous — spared at Guyon (wrist) |
| `median_palmar_sensory` | false | **yes** | palmar cutaneous branch — spared in carpal tunnel |
| `ulnar_claw` | false | **yes** | ulnar claw hand — the paradox: present DISTAL (wrist) only |

All `CROSSES:false` (peripheral, ipsilateral); none in `NON_LATERALISED`. The four cutaneous/consequence
findings join `LOCALISING`; the two movements stay non-localising (movements are shared, per the plexus
increment's rule).

## Segment anatomy (`src/model/structures.js`) — the four segmented nerves

Each row = the structures (`produces`) at that `(level:"nerve", part)`. Bold = spared distally (the
discriminator). Reuses existing movement/reflex/sensory findings except the 6 new ones.

### Radial (`radial` → 3 parts)
- **`radial_axilla`** (crutch palsy): `weak_elbow_extension` (triceps), `reflex_triceps_loss`,
  `weak_elbow_flexion` (brachioradialis), `weak_forearm_supination`, `weak_wrist_extension`,
  `weak_finger_extension`, `radial_sensory`, `wasting`.
- **`radial_spiral_groove`** (Saturday-night): `weak_elbow_flexion`, `weak_forearm_supination`,
  `weak_wrist_extension`, `weak_finger_extension`, `radial_sensory`, `wasting`. **Spares triceps + its
  jerk.**
- **`radial_pin`** (posterior interosseous, pure motor): `weak_finger_extension`,
  `weak_forearm_supination`, `wasting`. **Spares wrist extension (no wrist drop) + all sensory.**

### Ulnar (`ulnar` → 2 parts)
- **`ulnar_elbow`** (cubital tunnel): `weak_finger_abduction`, `weak_thumb_adduction`,
  `weak_finger_flexion` (FDP 4/5), `weak_wrist_flexion` (FCU), `ulnar_sensory`, `ulnar_dorsal_sensory`,
  `wasting`. (**No `ulnar_claw`** — the paradox.)
- **`ulnar_wrist`** (Guyon): `weak_finger_abduction`, `weak_thumb_adduction`, `ulnar_claw`,
  `ulnar_sensory`, `wasting`. **Spares FDP 4/5 (finger flexion), FCU (wrist flexion), dorsal sensory** —
  and *gains* the claw.

### Median (`median` → 3 parts)
- **`median_proximal`** (pronator / supracondylar): `weak_forearm_pronation`, `weak_wrist_flexion`
  (FCR), `weak_finger_flexion`, `weak_thumb_abduction` (APB), `median_sensory`, `median_palmar_sensory`,
  `wasting`.
- **`median_ain`** (anterior interosseous, pure motor): `weak_finger_flexion` (deep), `weak_forearm_pronation`
  (PQ), `wasting`. **Spares thenar (thumb abduction), all sensory, wrist flexion (FCR).**
- **`median_carpal_tunnel`** (CTS): `weak_thumb_abduction` (APB), `median_sensory`, `wasting`.
  **Spares all forearm muscles + `median_palmar_sensory` (palmar sparing).**

### Common peroneal (`common_peroneal` → 3 parts)
- **`peroneal_common`** (fibular neck): `weak_ankle_dorsiflexion`, `weak_great_toe_extension`,
  `weak_foot_eversion`, `peroneal_sensory`, `deep_peroneal_sensory`, `wasting`.
- **`peroneal_deep`**: `weak_ankle_dorsiflexion`, `weak_great_toe_extension`, `deep_peroneal_sensory`,
  `wasting`. **Spares eversion.**
- **`peroneal_superficial`**: `weak_foot_eversion`, `peroneal_sensory`, `wasting`. **Spares dorsiflexion.**

Sites are `left_nerve_<part>` / `right_nerve_<part>` (buildSites). The most-proximal segment (`radial_axilla`,
`ulnar_elbow`, `median_proximal`, `peroneal_common`) subsumes the old whole-nerve site.

## Registration (`src/model/sites.js`)

- **`PARTS`**: remove `radial`, `median`, `ulnar`, `common_peroneal`; add the 11 segment parts.
- **`TERRITORY`**: remove the 4 old `nerve|…` labels; add 11 (e.g. `"nerve|radial_spiral_groove": "radial
  nerve at the spiral groove (Saturday-night palsy)"`, `"nerve|median_carpal_tunnel": "median nerve at
  the carpal tunnel (CTS)"`, etc.).

## Scoring (`src/engine/score.js`)

Add `deep_peroneal_sensory`, `ulnar_dorsal_sensory`, `median_palmar_sensory`, `ulnar_claw` to
`LOCALISING`. NOT `weak_forearm_pronation` / `weak_thumb_adduction` (movements stay non-localising). No
other changes. `forward.js`, `inverse.js` unchanged.

## Interaction with the tone/wasting increment

The four replaced whole-nerve parts each carried one `wasting` structure; wasting now rides each new
segment (each wastes its muscles). Nerve-level `wasting` structures rise **13 → 20** (9 unsegmented
motor nerves + 11 segments; `lat_fem_cutaneous` still excluded). Update the `tone.test.js` count
assertion (`=== 13` → `=== 20`) and its wording.

## Phonebook (`src/data/syndromes.js`)

If it keys any of the four nerves by their old site id, re-key to the segment ids (or the most-proximal
segment) so `nameForSite` still resolves; a missing key just yields the anatomical description (golden
rule intact). Confirm during implementation.

## Emergent behaviour (what the tests prove)

- **Radial level** — wrist drop + finger drop + **triceps weak (+ absent triceps jerk)** → axilla;
  same **with triceps spared** → spiral groove; **finger drop, wrist extension preserved, no sensory
  loss** → PIN.
- **Ulnar level (the paradox)** — intrinsic weakness + Froment + palmar-digit sensory, **with FDP 4/5
  + FCU + dorsal-hand sensory involved, no claw** → elbow; **with those spared and a claw** → wrist.
- **Median level** — thenar weakness + digital sensory loss **with palmar (thenar-skin) sparing** →
  carpal tunnel; **+ pronation/wrist/finger-flexion weakness + palmar sensory** → proximal; **deep-flexor
  weakness + pronation, no thenar, no sensory** → AIN.
- **Peroneal branch** — foot drop + eversion loss → common; **eversion spared** (dorsiflexion + great-toe
  ext + first-web sensory) → deep; **dorsiflexion spared** (eversion + dorsum sensory) → superficial.
- **Nerve-vs-root stays sharp** — the completed muscle sets keep the territory/movement discriminators
  from the plexus increment (L5-vs-peroneal, C8/T1-vs-ulnar) intact or sharper.

## Testing

New suite `test/nerve-segments.test.js`:
1. **Vocabulary** — the 6 findings exist; `CROSSES` false for all; the 4 cutaneous/consequence findings
   in `LOCALISING`, the 2 movements not; none in `NON_LATERALISED`.
2. **Registration** — `left_nerve_radial_axilla` / `_spiral_groove` / `_pin`, `…_ulnar_elbow` / `_wrist`,
   `…_median_proximal` / `_ain` / `_carpal_tunnel`, `…_peroneal_common` / `_deep` / `_superficial` all
   exist; the old `left_nerve_radial` / `_median` / `_ulnar` / `_common_peroneal` do NOT.
3. **Structure sets** — spot-check each segment's produced set (e.g. `radial_pin` has no `radial_sensory`
   and no `weak_wrist_extension`; `ulnar_wrist` has `ulnar_claw` and no `weak_finger_flexion`;
   `median_carpal_tunnel` has no `median_palmar_sensory`; `radial_axilla` has `reflex_triceps_loss`).
4. **Discriminators emerge** (via `solve`) — the five bullets above, each asserting the exact segment id.
5. **Regression** — all 13 prior suites green after updating `pns-nerves.test.js` (segment ids) and
   `tone.test.js` (wasting count 20). `pns.test.js` root/polyneuropathy assertions are untouched.

## Existing-test updates (part of this increment)

- **`pns-nerves.test.js`**: the `left_nerve_{median,ulnar,radial,common_peroneal}` existence loop →
  segment ids; discriminator tests re-pointed to the specific segment (e.g. a CTS-pattern input → `…_median_carpal_tunnel`;
  the L5-vs-peroneal foot-drop input → `…_peroneal_common` or `_superficial` per the exact movements).
  This sharpens the tests (finer localisation), it does not weaken them.
- **`tone.test.js`**: nerve `wasting` count `=== 13` → `=== 20`; wording updated.

## Out of scope (deferred)

- Sciatic peroneal-vs-tibial division, tarsal tunnel (distal tibial), and other lower-limb segments.
- Thumb opposition / extension as separate findings (redundant with abduction / finger extension — add
  no discriminator).
- Recovery-dependent claw severity grading (categorical present/absent only).
- Neuromuscular re-innervation, conduction block localisation (electrophysiology, not bedside anatomy).

## Verification

`PATH=… npm test` — new `nerve-segments.test.js` green and all 13 prior suites green after the
`pns-nerves.test.js` + `tone.test.js` updates. Then sync the anatomy Artifact's nerve section (deferred
with the reflexes/tone sync the user postponed). Not a medical device; anatomy tables still need
neuroanatomist review.
