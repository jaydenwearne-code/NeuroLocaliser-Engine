# Clinical audit suite — the external accuracy baseline (2026-10-18)

**Status: built, NOT merged, no PR. Review round 1 was RULED by the owner on 2026-10-18.**
- All 17 proposed answers were approved.
- The synonym groups follow my recommendations.
- Row 20, left open by round 1, was ruled the same day.
- **Two checks are still pending**: weak arm entered for an ISOLATED weak hand, which row 20 does not reach. See
  "Row 20" below.

## What it is

The 2026-10-18 neurology / neurosurgery audit found that all 7158 assertions in `npm test` pass while adversarial
bedside cases mislocalise badly. The existing suites check the model against itself. This suite checks it against
the bedside, and it is the baseline the fixes will be measured against.

`test/clinical-audit.test.js` holds:

- **101 probes**: the audit's `c1–c6.json` cases. Each states the answer a neurologist would expect.
- **Three metamorphic properties**, from the audit's `perturb.mjs`:
  - **(a)** Swap one finding for another word in a site's complete picture. The rule depends on the words:
    - **always:** no multifocal claim may appear;
    - **only where the words are equivalent:** the site should also stay in the top 3.
  - **(b)** Add a common background finding to a complete brain or brainstem picture. The first answer should not
    change, and vasculitis or MS should never be offered as the unifying cause.
  - **(c)** Mirror every side, and the dominant hemisphere. The answer should mirror too.

Run it with `npm run test:audit`; add `-- --verbose` to see every metamorphic PASS line. **It is deliberately NOT in
`npm test`.** Most of it fails today, and that is the point. Wiring it in would turn the main suite red, and loosening
an assertion until it passes would destroy the measurement. When a fix lands, the numbers below should move.

Every expectation is one of two kinds:
- **Counted:** a textbook answer, or a judgement you have approved. It counts towards the exit code.
- **Pending:** a judgement awaiting your ruling. It runs and prints `PEND (would pass / would FAIL)`, but it does not
  count.

Approving a pending expectation means changing `R(...)` to `T(...)` in the suite. The 17 approved in round 1 are each
marked `// owner-approved 2026-10-18 (round 1, row N)`.

## Baseline (main @ `ac4fad3`, 2026-10-18, after round 1 and row 20)

| | today |
|---|---|
| Probes (all counted) | **66 / 101 correct** (65%). The 84 textbook probes score 62; the 17 approved in round 1 score 4 |
| (a) synonym swaps | **114 / 138 called multifocal** (108 offered MS or metastases); 13 lost the site from the top 3. Counted checks 103 / 224; pending (the two cortical-hand swaps) 0 / 2 would pass |
| (b) + bilateral absent ankle jerks | **73 / 73 multifocal**; leading unifier vasculitis 38, MS 33, MND 2; first answer kept 71/73 (both insulae → Friedreich's) |
| (b) + diabetic stocking sensory loss | **73 / 73 multifocal**; leading unifier vasculitis 73; first answer kept 73/73 |
| (c) mirror | 263 / 263 mirror cleanly |

Probes correct by region:

| region | correct |
|---|---|
| spinal cord | **6/16** |
| cauda and conus | 2/2 |
| motor neurone and neuromuscular | 7/9 |
| roots, plexus and nerves | 13/18 |
| brainstem | **8/13** |
| cranial nerves and skull base | 9/12 |
| vestibular and cerebellar | 6/7 |
| hemispheres, thalamus and vision | **7/13** |
| consciousness and raised pressure | **4/7** |
| robustness and functional | 4/4 |

## Review round 1 — RULED 2026-10-18

> *"For review round 1, i agree with all your expected answers. For synonym groups, I agree with your
> recommendations."* — the owner

Every "expected answer" below is now counted, exactly as written. Where a row offered an alternative, the expected
answer was approved, not the alternative. For example, row 1 still requires ONE cord site; the cord + C6-root pair is
not accepted.

| # | Probe | Expected answer (approved) | Today | The judgement that was asked |
|---|---|---|---|---|
| 1 | C5/6 myeloradiculopathy (L biceps + supinator jerks lost, L elbow flexion weak, legs UMN) | a cord site first; no multifocal claim | conus + upper trunk, "vasculitis" | Without a segment axis, "cord + C6 root at one level" can't be one site. Is that pair acceptable instead? |
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

**The synonym-swap groups for property (a), as ruled.**

| # | Group | Recommendation (approved) | What counts now |
|---|---|---|---|
| 18 | limb_ataxia / dysmetria / intention_tremor / dysdiadochokinesis | Equivalent: dysmetria is how limb ataxia is examined | stays in the top 3 **and** no multifocal claim (54 swaps; 48 multifocal today) |
| 19 | face_pain_loss / face_sensory_loss / face_touch_loss | **Not** equivalent: pain vs touch is a localising dissociation (medulla vs pons), and `face_sensory_loss` is named by its anatomy (VPM) | no multifocal claim only (44 swaps; 28 multifocal today) |
| 20 | weak_arm / weak_hand | *(given after round 1, ruled the same day)* Equivalent **inside a hemiparesis**: pyramidal weakness is distal-predominant, so "weak hand" alongside leg or face weakness is the same hemiparesis. Weak hand alone still points to the hand knob | no multifocal claim for all 34 (2 pass); stays in the top 3 for the 32 swaps inside a hemiparesis (31 pass); the 2 cortical-hand swaps are **pending** — see "Row 20" below |
| 21 | dysarthria / ataxic_dysarthria | Specific → generic is safe; generic → specific is a different claim | no multifocal claim for all 6 swaps (0/6 pass); top 3 only for ataxic → plain |

On row 21: all 6 swaps today go plain → ataxic. Only the midline vermis and the pancerebellar site predict ataxic
dysarthria, and the swap property covers only lateralised sites. So the ataxic → plain check has no case yet; it is
wired in for when one appears.

**"No multifocal claim" counts for every swap, including the non-equivalent ones.** It came from the line under the
round-1 table: *"whatever you rule, entering a single non-equivalent word should still give ONE other site, not two
lesions plus MS"*. I applied it as part of your blanket approval. Say so if you did not mean it to count.

**How rows 6 and 19 fit together:**
- Row 19 says `face_sensory_loss` is not a synonym of `face_pain_loss`, so the swap property no longer requires the
  lateral medulla to survive that one word.
- Row 6 says that a Wallenberg picture entered with `face_sensory_loss` should still put the lateral medulla FIRST:
  the rest of the picture is decisive.
- The probe asserts it and the swap property stays silent. They do not conflict.

## Row 20 — RULED 2026-10-18

Round 1 left row 20 open, because the table asked a question instead of making a recommendation. My recommendation
followed: weak hand and weak arm are the same finding inside a hemiparesis.

> *"Row 20: yes, inside a hemiparesis weak_hand is the same finding as weak_arm. Count its 34 top-3 checks."* — the
> owner

**Two of those 34 are not inside a hemiparesis**, and the "34" was my miscount when I wrote the reply button:

- **32 swaps, all counted:** "weak arm" → "weak hand" in a picture with leg or face weakness on the same side.
  - 31 pass.
  - The one failure is the right striatocapsular-aphasia composite.
  - The 32 include the four face-and-arm pictures (MCA superior division, cortical face-arm area). The hand is part of
    a pyramidal weak arm there too, and all four pass.
- **2 swaps, pending:** "weak hand" → "weak arm" in the cortical-hand picture (weak hand + Babinski + brisk reflexes,
  left and right).
  - That is an ISOLATED weak hand reported as a whole weak arm. It is outside "inside a hemiparesis", and outside the
    recommendation you approved, which kept weak hand alone pointing to the hand knob.
  - Today the hand knob drops out of the top 3 (corona radiata, internal capsule and sensorimotor stroke lead). That
    is arguably correct, because a lesion confined to the hand knob does not weaken the whole arm.
  - So I have **not** counted these 2. They print as `PEND`.
  - To count them anyway, change the arm / hand group's `"ruling"` to `"counted"` in the suite. To drop them, change
    it to `null`.

**The 2026-08-15 `LOCALISING` ruling on `weak_hand` stands.** Row 20 concerns weak hand alongside other pyramidal
weakness, not weak hand on its own.

## Counted, and failing today

These are the defects the fixes will be measured against. The 13 approved in round 1 that fail today are marked
(R1 #n).

Spinal cord:
- asymmetric compression → conus + cortex
- spastic legs alone → conus first
- central cord → + locked-in
- syrinx → three sites
- T8 compression with saddle loss → + conus
- C5-level compression → + conus
- spastic legs at T10 → conus, with the level dismissed as "below the cord"
- spinal shock, both entries → GBS, Friedreich's, + cord
- C5/6 myeloradiculopathy → conus + upper trunk (R1 #1)

Motor neurone and peripheral:
- GBS → + length-dependent neuropathy, "vasculitis"
- bulbar ALS → anterior horn + both medullae, no unifier (R1 #3)
- ulnar at the elbow → two ulnar lesions
- C6 radiculopathy → upper trunk
- Erb → C5 + posterior cord
- L4 → lumbar plexus (R1 #4)
- UMN foot drop → hand knob + deep peroneal (R1 #5)

Brainstem:
- Wallenberg entered with dysmetria → + cerebellum, "MS"
- Wallenberg entered with `face_sensory_loss` → + VPM thalamus (R1 #6)
- bilateral INO → two trochlear sites, "MS"
- basilar (coma + quadriparesis + both Babinski) → cord + diffuse cerebrum
- full locked-in → three sites

Skull base and vestibular:
- Horner + XII → Villaret first. The carotid space does not produce XII.
- bilateral VI, with or without papilloedema → two VI lesions + sarcoid (R1 #7, #8)
- HINTS-plus → AICA missing from the top 3 (R1 #9)

Hemispheres:
- alexia without agraphia + hemianopia → two sites
- wrong-way eyes → corona radiata + left frontal eye field
- thalamic sensory-ataxic picture → midbrain
- dysarthria–clumsy hand → pons + hand knob
- left MCA in a right-dominant patient → two lesions (R1 #10)
- parasagittal → cord + ACA (R1 #12)

Consciousness:
- uncal herniation → ARAS + ciliary ganglion (R1 #13)
- top of the basilar → Percheron + both occipitals, "MS" (R1 #14)
- bilateral PCA → limbic thalamus + both occipitals, "MS" (R1 #15)

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
