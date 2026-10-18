# Clinical audit suite — the external accuracy baseline (2026-10-18)

**Status: built, NOT merged, no PR. Review round 1 (below) is waiting for the owner.**

## What it is

The 2026-10-18 neurology / neurosurgery audit found that all 7158 assertions in `npm test` pass while adversarial
bedside cases mislocalise badly. The existing suites check the model against itself. This suite checks it against
the bedside, and it is the baseline the fixes will be measured against.

`test/clinical-audit.test.js` holds:

- **101 probes**: the audit's `c1–c6.json` cases. Each states the answer a neurologist would expect.
- **Three metamorphic properties**, from the audit's `perturb.mjs`:
  - **(a)** Swap one finding for a bedside-equivalent word in a site's complete picture. The site should stay in
    the top 3, and no multifocal claim should appear.
  - **(b)** Add a common background finding to a complete brain or brainstem picture. The first answer should not
    change, and vasculitis or MS should never be offered as the unifying cause.
  - **(c)** Mirror every side, and the dominant hemisphere. The answer should mirror too.

Run it with `npm run test:audit`; add `-- --verbose` to see every metamorphic PASS line. **It is deliberately NOT in
`npm test`.** Most of it fails today, and that is the point. Wiring it in would turn the main suite red, and loosening
an assertion until it passes would destroy the measurement. When a fix lands, the numbers below should move.

Every expectation is either **counted** (a textbook answer, which counts towards the exit code) or **pending** (a
clinical judgement). A pending expectation runs and prints `PEND (would pass / would FAIL)`, but it does not count
until you approve it. Approving one means changing `R(...)` to `T(...)` in the suite.

## Baseline (main @ `ac4fad3`, 2026-10-18)

| | today |
|---|---|
| Probes with a textbook answer | **62 / 84 correct** (74%) |
| Probes awaiting your ruling | 4 / 17 would pass |
| (a) synonym swaps | **114 / 138 called multifocal** (108 offered MS or metastases); 13 lost the site from the top 3 |
| (b) + bilateral absent ankle jerks | **73 / 73 multifocal**; leading unifier vasculitis 38, MS 33, MND 2; first answer kept 71/73 (both insulae → Friedreich's) |
| (b) + diabetic stocking sensory loss | **73 / 73 multifocal**; leading unifier vasculitis 73; first answer kept 73/73 |
| (c) mirror | 263 / 263 mirror cleanly |

By region (textbook probes correct): spinal cord **6/15**, cauda and conus 2/2, motor neurone and neuromuscular 6/7,
roots/plexus/nerves 13/16, brainstem **8/12**, cranial nerves and skull base 9/10, vestibular and cerebellar 6/6,
hemispheres/thalamus/vision **6/10**, consciousness and raised pressure 3/3, robustness and functional 3/3.

## Review round 1 — expected answers that need your ruling

For each row, please say **approve**, **change the expected answer to …**, or **drop**. "Today" is what the engine
says now.

| # | Probe | Expected answer (proposed) | Today | The judgement |
|---|---|---|---|---|
| 1 | C5/6 myeloradiculopathy (L biceps + supinator jerks lost, L elbow flexion weak, legs UMN) | a cord site first; no multifocal claim | conus + upper trunk, "vasculitis" | Without a segment axis, "cord + C6 root at one level" can't be one site. Is that pair acceptable as the answer instead? |
| 2 | ALS: mixed UMN + LMN | multifocal, with MND as the leading unifier | passes (anterior horn + conus, MND) | Is multifocal-with-MND the right form for ALS, rather than a single "motor system" answer? |
| 3 | Bulbar ALS (bilateral XII, dysphagia, fasciculations) | anterior horn first; no multifocal claim unless MND is named | anterior horn + both medullae, no unifier | as #2 |
| 4 | Knee extension + hip adduction + knee jerk + L4 dermatome | L4 root first | lumbar plexus | Does a dermatomal sensory loss put the root ahead of the plexus? |
| 5 | UMN foot drop: weak dorsiflexion + Babinski + brisk (left) | a right corticospinal site first (not the hand knob, not a nerve); one lesion | hand knob + deep peroneal nerve, "vasculitis" | Collides with strict vocabulary (2026-09-26) and with the hand knob ranking first for an isolated Babinski |
| 6 | Wallenberg with facial numbness entered as `face_sensory_loss` | lateral medulla; one lesion | lateral medulla + right VPM thalamus, "MS" | `face_sensory_loss` is defined as discriminative (VPM) loss. Should a clinician's "face numbness" still count as Wallenberg? |
| 7 | Bilateral VI + papilloedema | no multifocal claim; the raised-pressure axis fires | two VI lesions + sarcoid / NF2 | How should a false-localising sign be shown? |
| 8 | Bilateral VI alone | no multifocal claim | two VI lesions + sarcoid / NF2 | Is "one process" right without papilloedema? (clivus, Wernicke, Miller Fisher …) |
| 9 | Vertigo + hearing loss + abnormal head impulse | labyrinth first; AICA (lateral pons) in the top 3 | labyrinth only | HINTS-plus: should new hearing loss keep AICA on the list? |
| 10 | Left MCA picture with the patient set right-dominant | left MCA; one lesion | anterior choroidal + right transcortical aphasia, "MS" | Should the dominance setting be a prior rather than a hard rule? |
| 11 | Aphasia + LEFT hemiparesis in a right-hander | a right-hemisphere site in the top 3 (no claim either way about multifocal) | passes; multifocal with a left watershed site | Crossed aphasia against two lesions: is a two-lesion answer acceptable here? |
| 12 | Both legs UMN + cortical incontinence (parasagittal meningioma) | a parasagittal site in the top 3; one lesion | top 3 passes; multifocal = cord + left ACA | There is no bilateral parasagittal site. Should this be ONE lesion? |
| 13 | Coma + fixed dilated L pupil + extensor posturing (uncal) | one process; compressive III in the top 3 | ARAS + ciliary ganglion | How should herniation be represented? |
| 14 | Top of the basilar: coma + vertical gaze palsy + cortical blindness | one process (no multifocal claim, or embolic leads) | Percheron + both occipitals, "MS" | Is one vascular event the right claim? |
| 15 | Bilateral PCA: cortical blindness + amnesia | as #14 | thalamus (limbic) + both occipitals, "MS" | as #14 |
| 16 | Papilloedema + paraparesis + sphincter | a parasagittal site in the top 3; one lesion | passes | Is a parasagittal mass the expected reading? |
| 17 | Babinski AND a down-going plantar on the same side | no multifocal claim | passes | Or should the engine flag the contradiction? |

**The synonym-swap groups for property (a)** are the same kind of judgement. Only the first group counts today.

| # | Group | Counts today? | Swaps | Multifocal today | My recommendation |
|---|---|---|---|---|---|
| 18 | limb_ataxia / dysmetria / intention_tremor / dysdiadochokinesis | **yes** (textbook) | 54 | 48 | Dysmetria is how limb ataxia is examined. Object if you disagree. |
| 19 | face_pain_loss / face_sensory_loss / face_touch_loss | no | 44 | 28 | Pain vs touch is a real localising dissociation (medulla vs pons), so **not** equivalent. `face_sensory_loss` is named by its anatomy (VPM). |
| 20 | weak_arm / weak_hand | no | 34 | 32 | `weak_hand` means ISOLATED hand weakness, and was made LOCALISING on 2026-08-15. Should it still be a fair word inside a hemiparesis? |
| 21 | dysarthria / ataxic_dysarthria | no | 6 | 6 | Specific → generic should be safe; generic → specific is a different claim |

Whatever you rule, entering a single non-equivalent word should still give ONE other site, not two lesions plus "MS".
That is why even the pending swaps print what they would score.

## Counted today, and failing (for information; object to any of them)

Spinal cord:
- asymmetric compression → conus + cortex
- spastic legs alone → conus first
- central cord → + locked-in
- syrinx → three sites
- T8 compression with saddle loss → + conus
- C5-level compression → + conus
- spastic legs at T10 → conus, with the level dismissed as "below the cord"
- spinal shock, both entries → GBS, Friedreich's, + cord

Peripheral:
- GBS → + length-dependent neuropathy, "vasculitis"
- ulnar at the elbow → two ulnar lesions
- C6 radiculopathy → upper trunk
- Erb → C5 + posterior cord

Brainstem:
- Wallenberg entered with dysmetria → + cerebellum, "MS"
- bilateral INO → two trochlear sites, "MS"
- basilar (coma + quadriparesis + both Babinski) → cord + diffuse cerebrum
- full locked-in → three sites

Skull base:
- Horner + XII → Villaret first. The carotid space does not produce XII.

Hemispheres:
- alexia without agraphia + hemianopia → two sites
- wrong-way eyes → corona radiata + left frontal eye field
- thalamic sensory-ataxic picture → midbrain
- dysarthria–clumsy hand → pons + hand knob

## Changes made to the audit inputs

- c1 "central cord" entered `suspended_sensory@midline`, which the app cannot enter. It was dropped; the c2 left + right
  version is kept.
- c1 "MG generalised" entered `fatigable_weakness@none`. The app offers only left and right, so both are entered.
- The c2 copies of "ALS: UMN+LMN mixed" and "GBS: ascending areflexic" were identical to c1 and are kept once.
- The harness check asserts that every probe token is a finding the app offers on that side. A renamed or re-sided
  finding then fails loudly instead of making a probe vacuous.
- The swap and background loops are `perturb.mjs` verbatim, so the 114 / 138 and 73 / 73 figures reproduce exactly.
- Mirror ties: a fully symmetric picture whose answer is exactly tied with its own mirror image is broken by site id.
  The mirror check accepts the unflipped answer ONLY in that exact-tie case.
