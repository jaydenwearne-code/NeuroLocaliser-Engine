# The false-multifocal fix — one place, one word to re-check (design, 2026-10-22)

**Status: IMPLEMENTED (2026-10-22) on `fix/false-multifocal`. Round 1: all 20 recommendations APPROVED as written.**

> *"Round 1 of the false-multifocal fix: I approve all 20 recommendations as written."* — the owner

Every recommendation in §4 is now a ruling, including the overturn in row 5 (§3, option B) and the wording rows 10, 14
and 15. Plan: `docs/superpowers/plans/2026-10-22-false-multifocal.md`.
- **Audit:** 86 / 108 probes. That is 79 / 105 before, plus the three row-19 probes, which fail on the baseline and pass
  now. Counted checks: 960 passed, 30 failed. Swaps 223 / 224, background 292 / 292, mirror 270 / 270.
- **`npm test`:** 85 suites, 7289 assertions, green, with no re-pins. The new suite is `test/false-multifocal.test.js`;
  `relaxation.test` gained the same-family case.
- **As prototyped:** the implementation reproduces the prototype check for check: the same 272 checks gained, nothing
  lost.
- Branch: `fix/false-multifocal` (worktree `Code/neurolocaliser-multifocal/`).
- Cut from `fix/cord-localisation` at `1afeddb`. That branch is the finished spinal cord fix, stacked on
  `test/clinical-audit-suite` (PR #18), which stays open and is not to be merged. Not pushed; no PR.
- Every number below was measured by applying candidate changes to throwaway copies of `1afeddb`. Nothing was
  committed except this document.

This is the second fix from the 2026-10-18 clinical audit, after the spinal cord. The yardstick is
`npm run test:audit`; its baseline and rulings are in `2026-10-18-clinical-audit-suite.md`.

---

## 1. What is wrong

The engine claims two lesions, and names a disease that would join them, when one lesion explains the picture. On
`1afeddb` this class holds **269 of the 302 failing counted audit checks**:

| Audit property | Failing counted checks | What happens today |
|---|---|---|
| (a) synonym swaps | 121 of 224 | 114 of the 138 swaps are called multifocal, and 108 of those offer MS or metastases. 7 counted checks lose the site from the top 3 where the words are equivalent |
| (b) background signs | 148 of 292 | All 146 pictures are called multifocal. The leading unifier is vasculitis 111 times, MS 33, MND 2. Two first answers flip: both insulae + absent ankle jerks read "Friedreich's ataxia" |

Two probes in the class fail: Wallenberg entered with past-pointing (`dysmetria`), and Wallenberg entered with face
numbness (`face_sensory_loss`, R1 #6).

**What the clinician reads.** This is the real answer card (`app/answer.js` `answerFor`) for a Wallenberg entered with
past-pointing:

> **Where** No single place explains every finding — likely Left lateral medulla and Left cerebellar hemisphere.
> **Why** These findings need more than one lesion — see Together.
> **What** Together: Multiple sclerosis.

**The app leads the clinician into it.** The follow-ups list (signed off 2026-09-29) shows past-pointing, slow
alternating movements and intention tremor under limb ataxia, as *"the same deficit described more precisely"*. Tick
limb ataxia in a Wallenberg, then tick its past-pointing refinement, and the card above is the result. This was
measured; no audit probe covers it.

## 2. Why it happens

Four mechanisms, matching the audit's list of root causes:

1. **The vocabulary names findings by anatomy.**
   - Past-pointing, slow alternating movements and intention tremor each come from one structure, in the cerebellar
     hemisphere. Limb ataxia has seven producers: the three peduncles, the hemisphere, the basis pontis, the CPA and
     Friedreich's.
   - In the same way, hand weakness comes only from the hand knob, face numbness only from the VPM thalamus and the
     trigeminal lemniscus, and scanning speech only from the vermis and the whole cerebellum.
   - So one bedside word pulls in a second place.
2. **Nothing sits between "one place explains it all" and "two lesions".**
   - `solve()` claims multifocal whenever no single place explains every finding and two or three places cover them.
   - The near-fit (drop one finding) is computed but never withholds that claim.
   - The near-fit also refuses every LOCALISING sign, and every word in the four synonym groups is LOCALISING.
3. **There is no background (Hickam) layer.**
   - A common finding on both sides needs a place of its own. The audit uses age-related absent ankle jerks and
     diabetic glove-and-stocking numbness.
   - So the cover adds the length-dependent polyneuropathy (vasculitis, 111) or SCD / Friedreich's (MS 33, MND 2).
   - The list is sorted by coverage, so Friedreich's (slurred speech + both ankle jerks, 3 findings) outranks the insula
     (its own 2).
4. **The roster joins whatever cover it is given.** Vasculitis fires on about 92% of site pairs (measured 2026-08-15;
   you accepted that breadth). MS fires on any two places separated in the CNS, including brain + SCD.

The parsimony guard exists: *"Check this first: this is multifocal only because of …"*. But it is on the Together card,
closed below the answer. Since v0.10.0 the answer card's first lines state the claim and the disease.

## 3. The key decision: may a localising sign be set aside?

**The signed-off principle.** *"A LOCALISING sign is never relaxed away: it is too specific to ignore"* (`inverse.js`
`nearFit`; pinned by `relaxation.test.js`). The multi-location design (2026-08-14, §4) is built on it: instead of
relaxing the sign, the Together card names it and hands the judgement to the clinician. **Overturning it needs your
ruling.**

**Your round-1 line asks for more than the principle allows.**
- The line: *"whatever you rule, entering a single non-equivalent word should still give ONE other site, not two lesions
  plus MS"*. It is counted for every swap.
- The facial sensory words (row 19) and plain → scanning speech (row 21) are not equivalent, and all of them are
  LOCALISING.
- So they can make no multifocal claim only if the engine sets one of them aside.

Four options were measured:

| Option | What it does | Audit (counted) | Genuine two-lesion claims the option itself hides | `npm test` | Verdict |
|---|---|---|---|---|---|
| A. Keep the principle | rows 1–4 and the background rule only | 916 / 65. The 34 non-equivalent swap checks and R1 #6 still fail | 0 | 7209 / 0 | cannot meet the round-1 line |
| **B. Narrow overturn** | one word may be set aside when the place predicts **a word from the same family, on the same side, that was not entered** | **951 / 30** | **0** | **7209 / 0** | **recommended** |
| C. Relax any one localising sign | drop-one for every finding; a near-fit withholds the claim. Measured with rows 2, 3 and 12 | 963 / 18 | 3,934 of 9,226 (43%) | 7207 / 2 | rejected |
| D. Today's near-fit withholds the claim | drop-one for non-localising findings only; measured alone | 680 / 301 (+1) | 93 (1%) | 7209 / 0 | rejected |

**Why C is rejected.**
- Beyond what B fixes, it passes 13 more probe checks only by suppressing claims: bilateral VI, top of the basilar,
  uncal herniation and others. Their honest fixes are the composite-sites and raised-pressure rounds.
- It breaks the genuine "INO + optic neuritis → MS" probe, `pns.test`'s two-root hypothesis and `relaxation.test`.
- Four archetypes lose their claim in the app: x-mets, x-embolic, x-paraneo and x-syphilis. Their second place rests on
  one localising sign. The archetype suite pins both places, so it cannot see this.

**Option B, precisely.**
- **When it applies.** No single place explains every finding; one place explains all but one finding, X; and that place
  predicts a word Y that:
  - is in X's family (row 6);
  - is on X's side;
  - was not entered.
- **What follows.**
  - The place is a **near-fit**. It leads the list, and **no multifocal claim** is made.
  - The card names both words (row 10).
  - The Why line is drawn without X.
- **When it does not apply.** Both words entered (face pain loss AND face numbness) is not a substitution, and the claim
  stands (row 7).

The principle would then read: *a localising sign is never relaxed away — except a word entered instead of a
same-family word that the place predicts on that side. Then the place is a near-fit, the card names both words, and no
second lesion is claimed.*

## 4. Rulings — round 1 (all 20 APPROVED as written, 2026-10-22)

Each row is one decision, with my recommendation. The owner approved the table as written, so every recommendation
below is now a ruling.

### A. The words: your rows 18–21, applied to the engine

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 1 | How a family works | **A content table of word families**, each citing the ruling it comes from. The engine **matches** through it and **never rewrites** the word: the card, the Why line and the case link keep exactly what was entered. | The mechanism for rows 2–6. **Rejected:** making every limb-ataxia structure also produce the other three words (18 new anatomy rows). The audit's swap loop skips a word the place already predicts, so 54 counted checks would quietly stop being tested. |
| 2 | The cerebellar limb signs are one finding (row 18) | **Yes** | **+55:** all 54 cerebellar swap checks, and the Wallenberg-with-past-pointing probe. 6 sampled two-lesion pictures become one lesion, each a crossed brainstem syndrome (cerebellar hemisphere + a III palsy → Claude's). **Teaching consequence:** past-pointing alone now fits 10 places along the cerebellar limb pathway, not 2 (hemisphere, dentate). |
| 3 | Hand weakness inside a hemiparesis is arm weakness (row 20) | **Yes.** "Inside a hemiparesis" means leg or facial weakness on that side, which is the audit's own test. Hand weakness alone, or with only Babinski or brisk reflexes, still means the hand knob. | **+33:** 32 swap checks, and the lacunar dysarthria–clumsy hand probe (today "basis pontis + hand knob, MS"). 7 sampled pictures become one lesion (hand knob + a place whose hemiparesis includes the arm). The cortical-hand vignette still passes. |
| 4 | Plain dysarthria is explained by a place that gives scanning speech (row 21, specific → generic) | **Yes** | 0 on the audit, which has no case. A cerebellar picture entered with the common label "slurred speech" stops reading "whole cerebellum + hemipons, MS" (§6). |

### B. The near-fit

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 5 | **A same-family word may be set aside** (§3, option B). **This overturns a signed-off principle.** | **Yes** | **+35:** 34 swap checks (28 facial, 6 dysarthria) and R1 #6. It hides no genuine claim: all 15 sampled pictures that become one lesion come from rows 2, 3 and 12. |
| 6 | Which families allow it | **The facial sensory words (row 19), and plain → scanning speech (row 21). Not hand weakness outside a hemiparesis.** | Adding hand/arm gains nothing on the audit and hides 7 genuine two-lesion pictures, measured with the other rows in place (hand knob + Horner's, + vocal cord palsy, + facial nerve …). It would read hand weakness with a Babinski as arm weakness, which row 20 kept apart outside a hemiparesis. |
| 7 | Both words entered | **Not a substitution; the claim stands.** The rule is "instead of", never "as well as". | Wallenberg + face pain loss + face numbness stays "lateral medulla + VPM thalamus". |
| 8 | A minimum picture size | **None** | A minimum of three findings costs 4 counted checks: the trigeminal-nucleus pictures have two findings. The two-finding case is shown in §6. |
| 9 | The near-fit place leads the list | **Yes** | 0 on the audit and `npm test`. Without it, a two-finding picture can lead with a place the near-fit line does not name. |
| 10 | Card wording for the near-fit | **Where:** *"Left lateral medulla explains 5 of 6 findings. It gives face pain loss, but face numbness (thalamic pattern) was entered — re-examine that before calling this two lesions."* **Why:** drawn without the set-aside word. **Where card:** the near-fit note names both words. | The Where and Why lines are captured in §6. The Where card's note is not prototyped. |

### C. Background (Hickam)

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 11 | Which findings are background | **Absent ankle jerks on both sides, and glove-and-stocking numbness on both sides.** Never one side: an absent ankle jerk on one side is an S1 sign. Not hearing loss on both sides, which is NF2's own picture. | These are the audit's two. |
| 12 | The rule | **A background pair is set aside when it is what stops one place explaining the rest.** It is kept when a place in the answer predicts it on both sides (GBS keeps its absent ankle jerks). It is set aside as a pair, never one side. It never joins a multifocal cover: a genuine two-lesion picture with background keeps its claim, without a background place. | **+149:** all 148 background checks, and the GBS probe. 2 sampled pictures become one lesion (cord + SCD → cord, with the ankle jerks set aside). The SCD and length-dependent-neuropathy vignettes are unchanged, because one place explains each and nothing is set aside. |
| 13 | Scope | **Any answer, not only a brain answer** | Brain-only, which is all the audit tests, would leave GBS + stocking numbness failing. It would also leave carpal tunnel, or an L5 root, + absent ankle jerks reading "+ SCD, vasculitis". |
| 14 | Card wording for background | *"Absent ankle jerks on both sides are set aside: common with age and in a neuropathy, and probably a separate condition."* / *"Glove-and-stocking numbness on both sides is set aside: a length-dependent neuropathy (most often diabetic) is common, and probably a separate condition."* **On the Where line after the place**, and after a two-lesion line too. | Captured in §6 after a place. After a two-lesion line it is not prototyped. |
| 15 | A cord answer with background set aside | **Add:** *"With a myelopathy, check B12 (subacute combined degeneration) before calling them separate."* | Wording only, not prototyped. Spastic legs + absent ankle jerks read "SCD + conus, MND" today. Under row 12 the cord leads and SCD leaves the list, because its model has no brisk reflexes (your 2026-09-29 ruling). This line keeps B12 in view. |
| 16 | GBS + stocking numbness | **Keep GBS motor-predominant** (your accuracy-round ruling), and accept that the stocking numbness reads "set aside" | Making GBS predict distal sensory loss also fixes the probe, but it breaks that ruling's test in `accuracy-mechanisms`. |

### D. Mechanics, roster and tests

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 17 | The multifocal cover counts a family once | **Yes** | 0 on the audit and `npm test`. Without it, 5 sampled covers grow from two places to three. One cerebellar sign on each side then covers four words, so a hemipons wins the cover's first pick. |
| 18 | The cross-site roster | **No change** | Rows 1–17 stop false covers reaching it. Two observations for later: MS is offered for brain + SCD, and vasculitis for a stroke + a length-dependent neuropathy. |
| 19 | New audit probes, in PR #18's suite (as the cord fix's row 13) | **Add three.** Each fails today and passes under the recommended set: (a) Wallenberg + limb ataxia + past-pointing → the lateral medulla first, one lesion; (b) truncal ataxia + gaze-evoked nystagmus + slurred speech → a cerebellar site first, one lesion; (c) carpal tunnel + absent ankle jerks on both sides → carpal tunnel first, one lesion. | I have not added them. |
| 20 | Re-pins | **None needed** | `npm test` is 7209 / 0 on the prototype. New tests pin rows 2–17 and the guards in §5. |

## 5. Measured on the prototype

**The recommended set** is every engine row above: 1–9, 11–13 and 17, with 10 and 14 as wording. Row 15's line was not
prototyped. It was measured on a copy of `1afeddb`.

| | Today | Recommended set |
|---|---|---|
| Audit probes | 79 / 105 | **83 / 105** |
| Counted checks | 679 passed, 302 failed | **951 passed, 30 failed** |
| (a) synonym swaps | 103 / 224; 114 of 138 multifocal | **223 / 224**; 0 multifocal |
| (b) background | 144 / 292; 146 of 146 multifocal | **292 / 292**; 0 multifocal; first answer kept 146 / 146 |
| (c) mirror | 267 / 267 | 267 / 267 |
| Probe regions | — | Motor neurone 7 → 8 / 9 (GBS); brainstem 8 → 10 / 13 (both Wallenbergs); hemispheres 7 → 8 / 13 (dysarthria–clumsy hand). Every other region unchanged. Nothing that passes today fails |
| `npm test` | 7209 / 0 | **7209 / 0** |
| Genuine two-lesion claims (9,226 sampled) | — | 15 become one lesion (6 from row 2, 7 from row 3, 2 from row 12); 0 new claims; 0 covers grow |
| Run time (single runs, not controlled) | audit 7.3 s, suites 26 s | 8.9 s, 32 s. The build must cache the family-matched sets |

**What each row buys.** Leaving one change out at a time:

| Left out | Audit | Lost |
|---|---|---|
| row 2 (cerebellar family) | 896 / 85 | 54 swap checks + Wallenberg with past-pointing |
| row 3 (hemiparesis) | 918 / 63 | 32 swap checks + dysarthria–clumsy hand |
| row 5 (near-fit) | 916 / 65 | 34 swap checks + R1 #6 |
| row 12 (background) | 802 / 179 | 148 background checks + GBS |
| row 4, 9 or 17, or adding hand/arm to row 6 | 951 / 30 | nothing on the audit |

The four gains add up exactly (55 + 33 + 35 + 149 = 272). The changes do not interact on the audit.

**Guards that still hold (measured).**
- Two lesions, still claimed:
  - Wallenberg + Broca's aphasia (the signed-off 2026-08-14 case);
  - Wallenberg + a right L5 root;
  - the x-mets, x-paraneo and x-syphilis pictures;
  - mononeuritis multiplex;
  - hyperacute right arm + left leg → embolic;
  - INO + optic neuritis → MS;
  - right MCA + face pain loss on the hemiparesis side (`relaxation.test`).
- One place, nothing set aside: the SCD vignette, the length-dependent neuropathy vignette, and absent ankle jerks alone.
- The x-mets picture + absent ankle jerks keeps the same two places, with the ankle jerks set aside.

**The safety sample.** It is every 7th pair (9,490) of the 66,430 pairs among the 365 sites that have a picture. Each
pair's picture is both sites' full pictures together, and today 9,226 of them get a multifocal claim. The pairs are
synthetic, so "genuine" means only that no single place explains them today. All 15 that become one lesion read
clinically as one lesion:
- 6 crossed brainstem syndromes (row 2);
- 7 hemipareses with the hand knob inside them (row 3);
- 2 cord lesions with background ankle jerks (row 12).

## 6. The answer card, before and after

Captured from `answerFor`, with the engine's default answer selected, as the app does. The Why line is shown where it
changes.

| Picture | Today | Recommended set |
|---|---|---|
| Wallenberg with past-pointing (probe), or with limb ataxia + past-pointing | No single place explains every finding — likely Left lateral medulla and Left cerebellar hemisphere. *Together: Multiple sclerosis.* | Left lateral medulla. 1 other place also fits: Left hemimedulla. *Most likely PICA / vertebral artery occlusion. Must not miss: Vertebral artery dissection.* |
| Wallenberg with face numbness (R1 #6) | … Left lateral medulla and Right ventral posteromedial thalamic nucleus. *Together: Multiple sclerosis.* | Left lateral medulla explains 5 of 6 findings. It gives face pain loss, but face numbness (thalamic pattern) was entered — re-examine that before calling this two lesions. **Why:** Left swallowing difficulty (dysphagia) + right body pain loss (spinothalamic loss) → only the left medulla. |
| Wallenberg with face touch loss | … lateral medulla and Left lateral pons (trigeminal). *MS* | Left lateral medulla explains 5 of 6 findings. It gives face pain loss, but face touch loss was entered — re-examine … |
| Thalamic sensory stroke with face touch loss | … Left thalamus and Right pontine trigeminal complex. *MS* | Left thalamus explains 2 of 3 findings. It gives face numbness (thalamic pattern), but face touch loss was entered — re-examine … |
| Face numbness left + body pain loss right (two findings) | … Right VPM thalamus and Left cord hemisection. *MS* | Left lateral medulla explains 1 of 2 findings. It gives face pain loss, but face numbness (thalamic pattern) was entered … The red flag becomes the lateral medulla's swallow line. |
| AICA picture with intention tremor | … Left lateral pons and Left cerebellar hemisphere. *MS* | Left lateral pons. 1 other place also fits. *AICA territory infarct (must not miss).* |
| Dysarthria–clumsy hand (probe) | … Left basis pontis and Left hand knob. *MS* | Left basis pontis. *Small-vessel lacunar infarct.* |
| Capsular hemiparesis entered with hand weakness | … Left corona radiata and Left hand knob. *MS* | Left corona radiata. 8 other places also fit … |
| Cerebellar picture with slurred speech | … Bilateral whole cerebellum and Left hemipons. *MS* | Bilateral whole cerebellum. *Alcohol-related cerebellar degeneration.* |
| Left MCA + absent ankle jerks on both sides | … Left MCA territory and Bilateral subacute combined degeneration. *MS* | Left MCA territory. Absent ankle jerks on both sides are set aside: common with age and in a neuropathy, and probably a separate condition. |
| Left MCA + glove-and-stocking numbness | … + Bilateral length-dependent polyneuropathy. *Vasculitis* | Left MCA territory. Glove-and-stocking numbness on both sides is set aside: … |
| Left insula + absent ankle jerks | … Bilateral Friedreich's ataxia and Left insular cortex. *MS.* **Next: neurogenetics; cardiology referral essential** | Left insular cortex. Absent ankle jerks … set aside … *MCA territory infarct (must not miss).* **Next: acute stroke team** |
| GBS + stocking numbness (probe) | … acute polyradiculoneuropathy and length-dependent polyneuropathy. *Vasculitis* | Bilateral acute polyradiculoneuropathy. Glove-and-stocking numbness on both sides is set aside: … *Guillain-Barré syndrome (must not miss).* |
| Spastic legs + absent ankle jerks | … Bilateral subacute combined degeneration and Midline conus medullaris. *Motor neurone disease* | Bilateral anterior cord (arms spared). 2 other places also fit: conus, transverse cord. Absent ankle jerks … set aside … *Compressive myelopathy.* (Row 15 would add the B12 line.) |
| Carpal tunnel + absent ankle jerks | … carpal tunnel and SCD. *Vasculitis* | Left median nerve at the carpal tunnel. 2 other places also fit … Absent ankle jerks … set aside … |
| L5 root + absent ankle jerks | … Left sacral plexus and SCD. *Vasculitis* | Left L5 root. 1 other place also fits: Left sacral plexus. Absent ankle jerks … set aside … |
| **Unchanged by design (row 6):** left Horner's + right hand weakness + Babinski + brisk reflexes | … Left hemimedulla and Left hand knob. *MS* | unchanged |
| **Unchanged:** hyperacute R arm + L leg; INO + optic neuritis; left MCA + ONE absent ankle jerk | two lesions (embolic shower; MS; vasculitis) | unchanged |

**What capturing the card exposed.** The first background prototype set aside GBS's own absent ankle jerks, the sign
that defines GBS. It checked what was entered rather than what the place predicts. Row 12's "kept when a place in the
answer predicts both sides" is the fix, and the card above is after it. No test or probe could see this.

**The Next line follows the answer.** The insula case went from neurogenetics and cardiology to the acute stroke team.

## 7. What this round does not fix (the other 30 failing checks)

- **In the class, 1.** Right striatocapsular aphasia, with arm weakness swapped for hand weakness, ranks 4th, not in the
  top 3. Every place above it explains the picture, so this is a ranking among them (a rare composite that
  over-predicts), not a multifocal claim.
- **The composite-sites round, 9:** syrinx; basilar coma (2); locked-in (2); top of the basilar; bilateral PCA;
  parasagittal (R1 #12); bilateral INO.
- **The raised-pressure / herniation round, 4:** bilateral VI with and without papilloedema (2); uncal herniation (2).
- **Content and ranking elsewhere, 16:**
  - The 16: bulbar ALS; ulnar nerve at the elbow (2); C6 root; Erb's palsy; L4 root; UMN foot drop (2); Horner's + XII;
    HINTS-plus; dominance (2); alexia without agraphia; wrong-way eyes (2); thalamic hemiataxia.
  - Several are false two-lesion claims caused by gaps in the model:
    - the elbow lesion lacks the ulnar claw;
    - the upper trunk lacks deltoid-patch sensation;
    - a pyramidal foot drop has no word of its own.
  - They need content rows, not this mechanism, and are proposed as a follow-up.

## 8. How it would be built (the plan follows the ruling)

- `src/model/families.js`, content only:
  - `FINDING_FAMILIES`: members, relation (same / same inside a hemiparesis / specific → generic / not equivalent), and
    the ruling each cites;
  - `BACKGROUND`: finding, both sides, and the wording key.
- `src/engine/families.js`, the matching helpers:
  - a word's family head;
  - the hemiparesis context;
  - specific → generic;
  - the same-family word a place predicts.
- `src/engine/inverse.js`:
  - `differential`, `ruledOutSites`, `nearFit` and `minimalSet` match through the families. The cover counts a family
    once (row 17).
  - `solve` gains the background step: set the pair aside, then localise the rest.
  - `solve` gains the same-family near-fit: it withholds the claim and leads the list.
  - The result carries `background` and the near-fit's `instead`.
- `src/engine/score.js`, `src/engine/why.js`, `app/discriminators.js`: match through the families.
- `app/answer.js`: the Where sentences (rows 10, 14, 15), and the Why line without the set-aside words.
- `app/app.js`:
  - the finding count leaves out set-aside background;
  - the Where card names the near-fit's two words and the background.
- Tests: a new suite for rows 2–17 and the §5 guards; `relaxation.test` gains the same-family case. The row-19 probes go
  into PR #18's suite.
- CLAUDE.md: the near-fit principle (§3), the families and the background step.
