# NeuraxIs coverage audit — pre-prototype

**Date:** 2026-07-19
**Purpose:** final anatomy-coverage sweep of the whole neuraxis before building a prototype testing app.
**State audited:** 30 suites / 1262 assertions green; 32 structure `level`s; ~200 findings.

**Bottom line:** the high-yield neuraxis (cortex → white matter → deep grey → brainstem → cerebellum →
cranial nerves → cord → motor unit → roots/plexus/nerves → autonomic/pupil/visual) is modelled thoroughly.
The remaining gaps are long-tail; none blocks a prototype. Gaps below are tiered by teaching-yield and
separated into *genuine anatomy gaps*, *already-tracked deferrals*, and *out-of-scope-by-design*.

Grounding probes (run against the live model): no olfactory/anosmia finding (`[]`); no gustatory-cortical
finding and 0 `insula` structures; `limb_ataxia + hemiparesis` co-occur only at `midbrain|medial` (Claude's,
not the classic lacunar sites); no dysarthria-clumsy-hand finding; `gaze_palsy + ino` co-occur at
`pons|medial` (one-and-a-half already emerges); roots present are C5–T1 and L2–S1 only.

## Tier 1 — genuine gaps worth closing before "complete" (SELECTED FOR BUILD 2026-07-19)

| Gap | What's missing |
|---|---|
| **CN I (olfactory)** | Zero coverage — no anosmia finding. Foster-Kennedy (ipsilateral anosmia + optic atrophy + contralateral papilloedema) unrepresentable. |
| **Insular cortex** | No `insula` cortical part. Insular strokes (dysarthria, gustatory loss, vestibular, insular pain, autonomic) unlocalisable — the only cortical lobe with no representation. |
| **2 of 5 lacunar syndromes** | **Ataxic hemiparesis** homes only at `midbrain|medial`, not its classic lacunar sites (pontine base, posterior limb IC, corona radiata). **Dysarthria–clumsy-hand** has no finding at all. |
| **Peripheral vestibular apparatus** | `peripheral_vestibular|labyrinth` emits only `nystagmus_peripheral` + `cn8_vertigo`; no semicircular-canal / otolith / positional modelling → BPPV, Ménière, vestibular neuritis, HINTS peripheral-vs-central axis not localisable. |

## Tier 2 — backlog (BUILT 2026-07-20 — see CONTRIBUTING; residual deferrals noted inline)

- **Corona radiata** — ✅ DONE (`tier2-lacunar`; white-matter pure-motor lacune, ties the capsule). Capsular somatotopy: deferred.
- **Root coverage gaps** — ✅ DONE (`tier2-pns-depth`): C3/C4 (+phrenic/diaphragm), thoracic T4/T10/L1, sacral S2/S3. (C1/C2, full T2–T12 band, S4/S5: representative-only.)
- **Brachial plexus depth** — middle trunk (C7) ✅ DONE; **cords (lateral/medial/posterior)** ✅ DONE (`tier2-deferred`; nerve-unions).
- **A few named nerves** — ✅ DONE: phrenic, pudendal, saphenous, sural (lat_fem_cutaneous already existed).
- **Spinal cord tract combinations** — ✅ DONE (`tier2-cord-combined`): Friedreich + SCD explicit combined sites; + `sensory_ataxia`.
- **Nuclear VI = ipsilateral gaze palsy** — ✅ DONE (`tier2-brainstem`; `abducens_nucleus`→gaze_palsy). One-and-a-half / Foville emerge.
- **Pseudobulbar palsy** — ✅ DONE (`tier2-brainstem`; `emotional_lability` + bilateral-corticobulbar site).
- **Cortical hand-knob** — ✅ DONE (`tier2-cortical`; `weak_hand`, pseudo-peripheral hand). **Field-defect geometry (altitudinal/scotoma)** ✅ DONE (`tier2-deferred`; AION + optic neuritis). **Finer sensory-cortex somatotopy** ✅ DONE (`tier2-deferred`; cortical sensory hand / cheiro-oral). Only capsular somatotopy remains out of scope.

## Already tracked as deferred (not new)

Traumatic central cord (upper>lower + CST somatotopy), sacral-sparing as a reasoning finding, syrinx numeric
level span, thalamic subnuclei beyond the four modelled, IX/X autonomic detail (glossopharyngeal neuralgia,
carotid-sinus baroreflex).

## Out of scope by design (later layers, not anatomy)

Proptosis/chemosis/CCF haemodynamics, vascular **cause** attribution, cerebellar cognitive-affective
syndrome, seizure semiology — these wait for the **pathology layer**. Plus the three known remaining
*phases*: pathology layer (ALS/MND flagship), FND/non-organic layer, UI.

## Recommendation

The model is ready for a prototype now; no gap here blocks building/testing. Close the cheapest high-value
gaps (Tier 1) as one pure-data increment (zero new solver mechanism expected), then build the prototype and
let real tester behaviour prioritise Tier 2.
