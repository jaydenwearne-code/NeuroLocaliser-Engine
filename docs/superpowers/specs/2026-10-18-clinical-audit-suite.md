# Clinical audit suite — the external accuracy baseline (2026-10-18)

**Status: built, NOT merged, no PR. Review round 1 was RULED by the owner on 2026-10-18.**
- All 17 proposed answers were approved.
- The synonym groups follow my recommendations.
- Row 20, left open by round 1, was ruled the same day, and so were the two checks it did not reach.
- **Nothing is pending.** Every expectation in the suite now counts.

## What it is

The 2026-10-18 neurology / neurosurgery audit found that all 7158 assertions in `npm test` pass while adversarial
bedside cases mislocalise badly. The existing suites check the model against itself. This suite checks it against
the bedside, and it is the baseline the fixes will be measured against.

`test/clinical-audit.test.js` holds:

- **105 probes**: the audit's 101 `c1–c6.json` cases, plus 4 added by the spinal cord fix (last section). Each states
  the answer a neurologist would expect.
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
| (a) synonym swaps | **114 / 138 called multifocal** (108 offered MS or metastases); 13 lost the site from the top 3. Counted checks 103 / 224; nothing pending |
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
| 20 | weak_arm / weak_hand | *(given after round 1, ruled the same day)* Equivalent **inside a hemiparesis**: pyramidal weakness is distal-predominant, so "weak hand" alongside leg or face weakness is the same hemiparesis. Weak hand alone still points to the hand knob | no multifocal claim for all 34 (2 pass); stays in the top 3 for the 32 swaps inside a hemiparesis (31 pass); not for the 2 cortical-hand swaps (a different finding) — see "Row 20" below |
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
- **2 swaps, top-3 check dropped:** "weak hand" → "weak arm" in the cortical-hand picture (weak hand + Babinski +
  brisk reflexes, left and right).
  - That is an ISOLATED weak hand reported as a whole weak arm. It is outside "inside a hemiparesis", and outside the
    recommendation you approved, which kept weak hand alone pointing to the hand knob.
  - Today the hand knob drops out of the top 3 (corona radiata, internal capsule and sensorimotor stroke lead). That
    is arguably correct, because a lesion confined to the hand knob does not weaken the whole arm.
  - Ruled the same day:

    > *"Drop the 2 cortical-hand swap checks: weak arm entered for an isolated weak hand is a different finding."* —
    > the owner

  - Their top-3 check is gone. As for every swap between different findings, their no-multifocal check still counts,
    and both pass: corona radiata alone explains weak arm + Babinski + brisk reflexes.

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

## Spinal cord fix, round 1, row 13: four probes added (2026-10-22)

The spinal cord fix's round 1 (`2026-10-22-spinal-cord-fix-design.md`, row 13, approved as written) added four
counted probes. They cover pictures that the sensory-level options decide and that no probe covered. Each fails on
the 2026-10-18 baseline:

| Probe | Expected answer (approved) | Baseline |
|---|---|---|
| saddle + sphincter + both Babinski, level T10 | a cord site first; the level note names T10 | conus first; "below the cord" |
| spastic legs, level C4 | a cord site first; the level note names C4 | conus first; "below the cord" |
| R triceps jerk lost + weak elbow extension + both legs UMN | a cord site first; one lesion | conus + R C7 root, "vasculitis" |
| flaccid areflexic legs, level T6 (no sphincter or pain loss) | a cord site first | GBS first |

Baseline with them (measured): **66 / 105** probes, spinal cord **6 / 20**. Counted checks are 658 passed and 323
failed. Each probe is also mirrored, so the mirror property now runs **267** checks, all clean.

## False-multifocal fix, round 1, row 19: three probes added (2026-10-22)

The false-multifocal fix's round 1 (`2026-10-22-false-multifocal-design.md`, row 19, approved as written) added three
counted probes. They cover pictures that the word families and the background step decide, and that no probe covered.
Each fails on the `1afeddb` baseline (the spinal cord fix), where the engine called each one two lesions:

| Probe | Expected answer (approved) | Baseline |
|---|---|---|
| Wallenberg + limb ataxia + its listed refinement past-pointing | the left lateral medulla first; one lesion | lateral medulla + cerebellar hemisphere, "MS" |
| truncal ataxia + gaze-evoked nystagmus + slurred speech (plain dysarthria) | a cerebellar site first; one lesion | whole cerebellum + hemipons, "MS" |
| carpal tunnel + absent ankle jerks on both sides | carpal tunnel first; one lesion | carpal tunnel + SCD, "vasculitis" |

Each probe is also mirrored, so the mirror property runs **270** checks.

**After the fix (measured on `fix/false-multifocal`):** probes **86 / 108**; counted checks 960 passed, 30 failed;
synonym swaps 223 / 224, none called multifocal; background 292 / 292, none called multifocal, first answer kept 146 /
146; mirror 270 / 270.

## Content-gap fix, round 1, row 19: three probes added (2026-11-01)

The content-gap fix's round 1 (`2026-11-01-content-gaps-design.md`, row 19, approved as written) added three counted
probes. They cover pictures that the new rows decide, and that no probe covered. Each fails on `417385f` (the
false-multifocal fix):

| Probe | Expected answer (approved) | Baseline |
|---|---|---|
| AICA picture + abnormal head impulse | the left lateral pons first; one lesion | lateral pons + labyrinth, "Vasculitis" |
| left hemianopia + prosopagnosia | the right PCA first; one lesion | right fusiform + right optic radiation, "MS" |
| foot drop + weak arm + facial weakness, one side | a contralateral corticospinal site first; one lesion | face-arm cortex + deep peroneal nerve, "Vasculitis" |

Each probe is also mirrored, so the mirror property runs **273** checks.

**After the fix (measured on `fix/content-gaps`):** probes **101 / 111**; counted checks 1034 passed, 13 failed. The 13
are exactly the composite-sites round (9) and the raised-pressure round (4). Synonym swaps 272 / 272, including 48 new
cerebellar swaps from the thalamic hemiataxia, all passing; background 292 / 292; mirror 273 / 273.

## Composite-sites round, round 1, rows 7 and 15: one regex widened, four probes added (2026-11-05)

The composite-sites round's round 1 (`2026-11-05-composite-sites-design.md`, approved as written) changed the suite twice:

- **Row 7.** `PARASAG` also admits `bilateral_paracentral`. R1 #12 asked for "a parasagittal site", and the bilateral one
  is the place it asked for. With it, both of R1 #12's checks pass. Without it, R1 #16 (passing until then) would break
  once the pontine places existed, because its top 3 would be the bilateral site, locked-in and the ARAS's basilar reading.
- **Row 15.** Four counted probes cover pictures the composite sites decide, which no probe covered. Each fails on
  `4d781bd`:

| Probe | Expected answer (approved) | Before |
|---|---|---|
| cape + spastic legs, without wasted hands | `bilateral_cord_central` first; one lesion | anterior + central cord, "Metastases" |
| quadriplegia + both Babinski + preserved vertical gaze | `locked_in` first; one lesion | anterior cord + locked-in, "MS" |
| coma + vertical gaze palsy + a hemianopia on each side | `top_of_basilar` first; one lesion | paramedian thalami + both occipital lobes, "MS" |
| both legs weak + both Babinski + cortical sensory loss in both legs | `bilateral_paracentral` first; one lesion | cord + both ACAs, "MS" |

Each probe is also mirrored, so the mirror property runs **277** checks.

**After the fix (measured on `fix/composite-sites`):** probes **112 / 115**; counted checks 1055 passed, 4 failed. The 4
are exactly the raised-pressure round. Synonym swaps 272 / 272; background 292 / 292; mirror 277 / 277.

## Plexus round, round 1, row 15: four probes added (2026-11-05)

The plexus round's round 1 (`2026-11-04-plexus-round-design.md`, row 15, approved as written) added four counted
probes. They cover plexopathies entered in the nerve-territory words a clinician tests, and no probe covered them. Each
fails on `4d781bd` (the content-gap fix), where 7 of their 8 checks fail:

| Probe | Expected answer (approved) | Baseline |
|---|---|---|
| Erb with deltoid-patch and lateral-forearm numbness | the left upper trunk first; one lesion | upper trunk + musculocutaneous nerve, "Vasculitis" |
| lumbar plexopathy in nerve words (front- and inner-thigh numbness) | the left lumbar plexus first; one lesion | femoral + obturator nerves, "Mononeuritis multiplex" |
| sciatic numbness + sciatic motor signs + weak gluteus medius | the left sacral plexus first; one lesion | sciatic nerve + sacral plexus, "Vasculitis" |
| little-finger + T1 numbness + weak thumb and finger abduction | the left lower trunk first; one lesion | T1 root + medial cord, "Vasculitis" |

Each probe is also mirrored, so the mirror property runs **277** checks.

**After the round (measured on `fix/plexus-round`):**
- Probes **105 / 115**; counted checks 1046 passed, 13 failed. The 13 are the composite-sites round (9) and the
  raised-pressure round (4).
- Roots, plexus and nerves: 24 / 24.
- Synonym swaps 272 / 272; background 292 / 292; mirror 277 / 277.

**After rows 8–9 of the plexus round (2026-11-06, measured on `fix/plexus-round`):** counted checks 1047 passed, 13
failed. The extra check is the whole lumbosacral plexus's own mirror, and it passes; mirror 278 / 278. No probe changed.

## Raised-pressure round, round 1, row 13: four probes added (2026-11-05)

The raised-pressure round's round 1 (`2026-11-05-raised-pressure-design.md`, row 13, approved as written) added four counted
probes. They cover pictures that the new rows decide, and that no probe covered. Each fails on `4d781bd` (the content-gap
fix):

| Probe | Expected answer (approved) | Baseline |
|---|---|---|
| VI palsy + papilloedema | a left VI site first, not the pons; the raised-pressure axis fires | left medial pons first (basilar perforator infarct) |
| coma + fixed dilated left pupil | the left compressive III first; one lesion | diffuse cerebrum + left ciliary ganglion (Adie pupil, routine) |
| coma + fixed dilated left pupil + right hemiparesis | the left compressive III first; one lesion | three places |
| bilateral VI + papilloedema + right hemiparesis | a left hemisphere site first; one lesion | left medial pons + right VI, "Vasculitis" |

Each probe is also mirrored, so the mirror property runs **277** checks.

**After the fix (measured on `fix/raised-pressure`):** probes **108 / 115**; counted checks 1050 passed, 9 failed. The 9 are
exactly the composite-sites round. Synonym swaps 272 / 272; background 292 / 292; mirror 277 / 277.

## Pressure-follows-the-cause round, round 1, row 20: four probes and a new check (2026-11-10)

The round's round 1 (`2026-11-09-pressure-follows-cause-design.md`, row 20, approved as written) added one assertion kind and
four counted probes. **`lead` / `leadNot`** read the answer card's leading cause, from its "Most likely" clause only (never the
must-not-miss), or "(the pressure)" when the card follows the pressure itself. It is the first check that reads a cause rather
than a place: a yardstick change, approved with the row. Each probe fails on `e31d5c9` (the raised-pressure round):

| Probe | Expected answer (approved) | Baseline |
|---|---|---|
| papilloedema + right hemiparesis | leads with a cause that can raise the pressure (a mass or a bleed) | "Small-vessel lacunar infarct" |
| coma + papilloedema | leads with the pressure, not a metabolic encephalopathy | "Metabolic or toxic encephalopathy" |
| papilloedema + right hemianopia | does not lead with an infarct | "PCA infarct" |
| IV palsy + papilloedema | the IV nerve first; leads with the pressure or a tumour | the contralateral trochlear nucleus; "Demyelination" |

Each probe is also mirrored, so the mirror property runs **281** checks.

**After the fix (measured on `fix/pressure-follows-cause`):** probes **112 / 119**; counted checks 1063 passed, 9 failed. The 9
are exactly the composite-sites round. Synonym swaps 272 / 272; background 292 / 292; mirror 281 / 281.

## Integration of the open fixes: no probe added, no assertion changed (2026-11-10)

The local branch `integrate/all-open-fixes` merges every open fix: PR #25 (which holds #18 → #20 → #21 → #19 → #24), then
#23, #22 and #17. It is not pushed and not merged. The probe blocks of every round are kept whole: 111 + 4 composite sites
+ 4 plexus + 4 raised pressure + 4 pressure follows = **127**. The composite round's PARASAG widening (row 7) stands.

**Measured on the integration:** probes **127 / 127**; counted checks 1097 passed, **0 failed**, 0 pending. Synonym swaps
272 / 272; background 292 / 292; mirror 290 / 290. Each round's remaining failures were exactly another round's probes: the
composite tip's 4 (raised pressure), the pressure tip's 9 (composite sites), the plexus tip's 13 (both).

## Non-dominant content round, rows J3 and J4: two yardstick rulings, no probe added (2026-11-12)

On `fix/card-follows-cause`. The non-dominant content round made the four aphasia composites dominant-only (row J1): their
non-dominant copy was exactly a real place without its aphasia (the VPL thalamus; the capsule and corona radiata), and the
solver no longer offers it. Two checks were asking about that copy, and the owner ruled both ("approve as proposed"):

- **J3, synonym swaps:** "site stays in the top 3" is asserted only for a site the solver OFFERS (the audit asks the engine,
  `solverSites`, rather than restating the rule). The 4 such checks on the two removed copies go. The "no multifocal claim"
  checks are about the picture, so they still run for every site, the copies included. Swaps tried: 162, unchanged.
- **J4, mirror:** for a picture with NO localising claim (papilloedema alone), the check compares the claim (no place on
  either side) rather than the hidden first place of a full tie. Every place explains nothing there, so all tie, and the last
  tie-break is the site id, which is not mirror-symmetric: sides are a prefix in most ids and a suffix in the composites'. The
  check had passed only because both sides' tie-break first was an aphasia composite.

**Measured:** probes **127 / 127**; counted checks **1093** passed (1097 − the 4 J3 checks), **0 failed**, 0 pending. Swaps
162 tried, 6 lost from the top 3 (unchanged); mirror 290 / 290.
