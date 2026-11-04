# The composite sites — nine audit checks (design, 2026-11-05)

**Status: DESIGN. Round 1 (16 rows) awaits the owner's ruling. There is no engine code.**
- Branch: `fix/composite-sites` (worktree `Code/neurolocaliser-composite/`), cut from `fix/content-gaps` at `4d781bd`.
  That is PR #19, open and not to be merged, stacked on #21 → #20 → #18. This branch is not pushed and has no PR.
- Every number below was measured by applying candidate changes to throwaway copies of `4d781bd`, outside the repo.
  Nothing was committed except this document.

This is the fourth fix from the 2026-10-18 clinical audit, after the spinal cord, false-multifocal and content-gap fixes.
The yardstick is `npm run test:audit`; its baseline and rulings are in `2026-10-18-clinical-audit-suite.md`. On
`4d781bd` the audit counts **1034 passed, 13 failed**. Of the 13, 9 belong to this round and 4 to the raised-pressure
round.

**Headline (measured).** The recommended set fixes all 9:
- probes go from 101 to **108 / 111**;
- counted checks go from 1034 / 13 to **1043 / 4**, and the 4 left are exactly the raised-pressure round;
- nothing that passes today fails;
- `npm test` stays green with no re-pins. It goes from 7355 to 7361 assertions, the 6 new ones being table-driven checks
  over the new places.

In the frozen safety sample:
- 2 two-lesion claims become one place, and both read clinically as one lesion;
- no claim is added;
- no site picture changes its first answer.

**One row changes the audit itself.** Row 7 widens one regex, the parasagittal family, so it is your call on the
yardstick (§3.2).

---

## 1. What is wrong

The real answer card (`app/answer.js` `answerFor`) for each failing probe on `4d781bd`:

| Probe (audit checks) | Where line today | What / Next today |
|---|---|---|
| Syrinx: cape + wasted hands + spastic legs | No single place explains every finding — likely Bilateral anterior cord and Bilateral central cord | Together: Metastases |
| Bilateral INO | … likely Left trochlear nucleus, midbrain and Right trochlear nucleus, midbrain | Together: Multiple sclerosis |
| Basilar: coma + quadriparesis + both Babinski (2) | … likely Bilateral anterior cord and Bilateral diffuse cerebral involvement | Together: Multiple sclerosis. Next: *Spinal surgery / neurology — cord compression is time-critical* |
| Locked-in, full picture (2) | … likely Left hemipons, Right hemipons and Bilateral ventral pons (basis pontis) | Together: Multiple sclerosis |
| Parasagittal meningioma: both legs UMN + cortical incontinence (R1 #12) | … likely Bilateral anterior cord and Left ACA territory | Together: Multiple sclerosis. Next: *Spinal surgery / neurology* |
| Top of the basilar: coma + vertical gaze palsy + cortical blindness (R1 #14) | … likely Bilateral paramedian thalamus and Bilateral primary visual cortex | Together: Multiple sclerosis |
| Bilateral PCA: cortical blindness + amnesia (R1 #15) | … likely Left anterior + dorsomedial thalamic nuclei and Bilateral primary visual cortex | Together: Multiple sclerosis |

Three of these send the reader the wrong way:
- **The basilar coma and the parasagittal meningioma both get the cord's plan and red flag.** The paracentral lobule's own
  cause list warns that patients with a parasagittal meningioma "are repeatedly investigated with spine imaging alone".
- **A comatose pontine haemorrhage is told its patient is awake.** The picture is coma + both horizontal gaze palsies +
  quadriparesis, and its probe passes. The card reads *"Bilateral ventral pons (basis pontis) explains 4 of 7 findings"*,
  with the locked-in red flag *"Do not mistake locked-in for coma or a vegetative state — the patient is fully aware"*.
- **That probe passes only by accident.** Its cover needs four places (locked-in + both medial pontine sites + diffuse
  cerebrum), one more than the engine will claim (measured).

## 2. Why it happens

1. **A hand-listed composite went stale.**
   - `locked_in` is `["cst_pons_arm", "cst_pons_leg", li_ocular]`, a list written with the consciousness sites.
   - The pons has gained rows since: Babinski and brisk reflexes (2026-09-29), and the basis pontis's face and speech
     rows. None of them reached the list.
   - So the locked-in site predicts no Babinski, no facial weakness, no anarthria and no gaze palsy.
   - That is why the full locked-in picture needs three places, and why coma + quadriparesis + Babinski cannot use the
     pons at all.
   - This is the hand-listed-composite trap a fourth time, after B11 / `thal_face`, `ic_hyper` and `thal_ataxia`.
2. **One lesion spans places the model holds only one side or one half of:**
   - the two MLFs: each sits in a one-sided site (the medial pons, the trochlear nucleus);
   - the two paracentral lobules: each ACA and paracentral site is one hemisphere;
   - the ventral and the tegmental pons: locked-in is ventral (awake), and the ARAS site is tegmental (no limb signs);
   - the basilar apex: Percheron's thalami and the two PCAs are separate sites.
3. **The central cord stops at the commissure, the arm fibres and the wasting.** The syrinx's reach into the lateral
   columns was deferred by the cord fix (its spec §7) because it collided with R1 #12.
4. **R1 #12's top 3 is fragile.**
   - It passes today only because exactly two cord sites explain "both legs + Babinski" and rank above the one-sided ACA.
   - Any new place that explains them pushes the ACA out. Measured for the locked-in derivation (row 1) and for the
     ungated syrinx reading (row 4 without row 5). The basilar reading (row 2) explains them too.
   - The audit's parasagittal regex lists only one-sided sites.

## 3. The decisions that are more than content

### 3.1 A reading of an existing site, or a new place?

The cord fix set the precedent. Its segment is carried by READINGS (variants) of the existing cord sites, with the same
ids, content and links; new ids were measured and rejected. This round meets the same choice for every composite.

**The principle I recommend:** *a lesion that is the same lesion grown larger is a READING of its site, with the same
id, content and links. A lesion that is a different place is a NEW SITE. Either way it is DERIVED from its source rows,
never hand-listed.*

| Composite | Form | Why |
|---|---|---|
| Locked-in | the existing site, re-derived (row 1) | It is the bilateral basis pontis; only its list is wrong |
| Basilar coma | a reading of the ARAS site, `brainstem_aras` (row 2) | The tegmental lesion grown into the basis pontis. The ARAS's causes, plan and red flag fit (*"Impaired arousal with brainstem signs … is a posterior-circulation emergency — image the vessels"*) |
| Syrinx | a reading of the central cord (row 4) | The central lesion grown into the lateral columns |
| Both MLFs | a new site (row 3) | A small paramedian lesion, not a larger medial pons |
| Both paracentral lobules | a new site (row 6) | As a reading of the one-sided sites, the same bilateral place would be listed twice, under a left and a right id |
| Top of the basilar | a new site (row 8) | One vessel's territory spanning two existing places |

Two alternatives were measured or considered and rejected:
- **The basilar coma as a new site** (`bilateral_pons_basilar`, same content and rows): −2 against the recommended set
  (measured). The audit's PONS regex names today's pontine ids, so two first-answer checks fail: the basilar coma's, and
  the pontine haemorrhage's, which passes today.
- **A locked-in reading with coma** (not prototyped). The card would name "Locked-in syndrome" and show its red flag,
  *"the patient is fully aware"*, for a comatose patient. That is the defect in §1.

### 3.2 The audit's parasagittal regex (row 7)

R1 #12 approved *"a parasagittal site in the top 3; one lesion"*, after asking *"There is no bilateral parasagittal site.
Should this be ONE lesion?"*. The suite tests "a parasagittal site" with `PARASAG =
/^(left|right)_cortex_(aca|paracentral|motor_leg)$/`, which lists only one-sided sites.

With the bilateral paracentral site (row 6), that site alone explains the R1 #12 picture. The card lists only the places
that explain everything, so the top 3 holds the bilateral site alone, and the regex misses it.

| Option | R1 #12 | R1 #16 (papilloedema + paraparesis + sphincter; passes today) | Verdict |
|---|---|---|---|
| **A. Admit `bilateral_paracentral` to PARASAG (recommended)** | passes, both checks | passes: the bilateral site leads | The regex catches up with the place R1 #12 asked for |
| B. Keep the regex | still fails its top-3 check | **breaks**: its top 3 becomes the bilateral site, the locked-in site and the basilar reading, which all explain both legs + Babinski | net −1 |
| C. A bilateral reading of `left_`/`right_cortex_paracentral` | would pass | would pass | The same bilateral place is listed twice, with nothing to separate the two rows |

**Why A is not loosening.** No other site can pass through it, and every other check is unchanged (measured). It still
needs your ruling, because the yardstick is yours and its rule is "never loosen an assertion to make it pass". The audit
spec would record the change, as it recorded each round's added probes.

### 3.3 The syrinx reading needs its cape (row 5)

With the leg rows, the central cord's syrinx reading explains a spastic paraparesis on its own terms.
- **Ungated, it leads "spastic legs + a C4 level".** A cervical level rules out the anterior cord's arms-spared reading,
  so the anterior cord predicts 9 signs the patient lacks, while the syrinx reading predicts 8.
- **That breaks two checks** (measured): the cord fix's own approved probe (the level note must name C4), and R1 #12's
  top 3.

**Recommended: the reading is offered only when the suspended (cape) sensory loss is entered.** That cape is what defines
the central cord. Spinal shock already works this way: it is offered only with a stated level (cord fix, row 1c).
- The gate costs nothing and protects both checks (measured).
- It also dissolves the conflict the cord fix deferred. The syrinx row no longer depends on the parasagittal site, and
  measured alone it fixes the syrinx and breaks nothing.
- Alternative, not prototyped: a RARE tier for the reading alone. The reading would still sit in the list for every
  spastic paraparesis.

### 3.4 One place for the top of the basilar (row 8)

R1 #14 and #15 approved *"one process (no multifocal claim, or embolic leads)"*.

| Option | What the card says |
|---|---|
| **A. A basilar-apex site (recommended)** | One place: both P1 perforator territories, which are the paramedian thalami as in Percheron, and both PCAs (the occipital and fusiform cortex). It explains both probes, because Percheron's amnesia row comes with it. This treats the basilar tip as the MCA composite treats the MCA: one vessel's territory is one place |
| B. Make the embolic shower lead the roster for posterior-circulation pairs | Still *"No single place explains every finding — likely Bilateral paramedian thalamus and Bilateral primary visual cortex. Together: Embolic shower"*. It needs a new roster rule, and the anatomy is one occlusion at the tip, not a shower. Not prototyped |

## 4. Rulings — round 1 (16 rows)

Each row is one decision, with my recommendation. "+n" is counted audit checks fixed, confirmed by leaving the row out of
the full set (§5).

### A. The pons

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 1 | **Re-derive the locked-in site from its source:** both sides of the basis pontis, plus the paramedian pons's two horizontal-gaze rows (`pprf`, `abducens_nucleus`), plus its own preserved-vertical-gaze row. This replaces the stale hand list. Classic locked-in loses horizontal gaze, and keeps vertical gaze and blinking | **Yes, shipped with row 2** | **+2** (the full locked-in picture: first answer and one lesion). Without the gaze rows it is −2 (measured). Alone it breaks two checks. The pontine haemorrhage picture becomes "locked-in + diffuse cerebrum", because its cover now fits in two places; row 2 makes it one place. It also pushes the ACA out of R1 #12's top 3, which rows 6–7 restore. It brings two over-predictions with it: forehead sparing (as the signed-off pseudobulbar site does) and the basis pontis's limb ataxia (O4). Cards: quadriparesis + both Babinski now lists the ventral pons and reads *"→ the pons or spinal cord"* (was *"only the spinal cord"*), which is the textbook differential. In the sample, 1 claim becomes one place (both basis pontis → locked-in) and 12 covers change (§5) |
| 2 | **The basilar reading of the ARAS** (same id `brainstem_aras`): the tegmental lesion reaching the basis pontis, both sides, with the same gaze rows. The reading sits in the pons on the Why line, because its level's own station, "brainstem (several levels)", would make an isolated Babinski read *"cortex → cord, brainstem (several levels), conus"* (2 `why.test` pins, measured) | **Yes, as a reading, not a new site (§3.1)** | **+2** (basilar coma: first answer and one lesion), and the pontine haemorrhage picture becomes one place instead of passing by accident. As a new site it is −2 (measured, §3.1). Card: *"Bilateral paramedian tegmentum (ARAS) — with the basis pontis … Most likely Top-of-the-basilar / brainstem infarct (must not miss) … Acute stroke team + ICU"*, with the ARAS red flag. That replaces the cord plan, and for the haemorrhage the locked-in red flag |
| 3 | **Both MLFs:** a new site, `bilateral_pons_mlf`, built from the paramedian pons's INO row on both sides. Its causes and plan fall back to the medial pons; its phonebook entry is its own (row 11) | **Yes** | **+1.** Card: *"Bilateral medial pons … Bilateral eye lags turning in on side gaze → only the pons"*. With no onset the What line is the perforator infarct, EMERGENCY; subacute, *Demyelination (MS)* and the MS service; chronic, the medial pons's only slow cause, pontine glioma (O5). A one-sided INO is unchanged, because the other side's normal excludes the bilateral site. The sample does not change |

### B. The cord and the cortex

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 4 | **The syrinx reading of the central cord** (same id): it adds the cord's leg corticospinal rows, which are the anterior cord's corticospinal rows other than the arm rows (leg weakness, Babinski, brisk reflexes, spasticity) | **Yes, with row 5** | **+1.** Card: *"Bilateral central cord (reaching the corticospinal tracts) … Bilateral cape-like pain loss → only the spinal cord … Most likely Syringomyelia (± Chiari)"*, with neurosurgery URGENT (was *"Together: Metastases"*). The bare cape, the central cord picture and the cord vignette are unchanged |
| 5 | **The reading needs its cape (§3.3).** A reading may declare the finding it `needs`, and `solverSites` receives what was entered | **Yes** | Protects 2 checks: the C4 level probe and R1 #12's top 3. Measured: rows 4–5 alone give +1 and break nothing |
| 6 | **Both paracentral lobules:** a new site, `bilateral_paracentral`. It unions the three paracentral parts (leg motor, leg sensory, the micturition and gait centre) on both sides. Causes and plan fall back to `cortex_paracentral`, which is already written for both legs (*"BILATERAL leg weakness with urinary incontinence … MIMICS A SPINAL CORD LESION"*) | **Yes** | **+1** (R1 #12's no-multifocal check). Card: *"Bilateral paracentral lobule … Bilateral leg weakness + urinary incontinence → only the cerebral cortex … Most likely Parasagittal / falx meningioma (must not miss)"*, with URGENT neurosurgery. The What line follows the onset: hyperacute bilateral ACA infarct, subacute superior sagittal sinus thrombosis. A spastic paraparesis now lists it as "also fits", which is the mimic the content warns about. In the sample, 5 covers change (O2) |
| 7 | **Admit `bilateral_paracentral` to the audit's PARASAG regex (§3.2).** A change to the yardstick | **Yes, option A** | **+1** (R1 #12's top 3), and R1 #16 keeps passing. Without it, R1 #16 breaks once rows 1, 2 and 6 land |

### C. The posterior circulation

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 8 | **The top of the basilar:** a new site, `top_of_basilar`. It unions Percheron's rows (both paramedian thalami) and both PCA cortical territories (occipital + fusiform), on both sides. It has its own content key, `thalamus_arousal|basilar_apex` (rows 10–12) | **Yes, option A (§3.4)** | **+2** (R1 #14, R1 #15). Card: *"Bilateral thalami and occipital lobes (top of the basilar) … Most likely Top-of-the-basilar embolism (must not miss) … IMMEDIATE stroke team and neurointerventional referral"* (was *"Together: Multiple sclerosis"*). Subacute onset leads with PRES. Percheron's triad, Anton's and a bilateral hemianopia keep their first answer and list it as "also fits". In the sample, 1 claim becomes one place (both fusiform gyri + coma) and 1 cover changes |

### D. The Why line

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 9 | **A place that spans two stations sits where its carriers are.** For one picture, the top of the basilar sits at the stations of the structures that carry what was entered (`carrierStations`). Every other site keeps its one station, exactly as today | **Yes** | Audit and `npm test` unchanged. Without it, the station comes from the site's level (the thalamus). Anton's alone would read *"→ the cerebral cortex or thalamus"*, and R1 #15 *"→ only the thalamus"* for a cortical blindness. With it, Anton's reads *"→ only the cerebral cortex"*, as today, and R1 #14 and #15 read *"→ only the cerebral cortex and thalamus"* |

### E. Card and phonebook wording (not measured by the audit)

| # | Decision | Recommendation |
|---|---|---|
| 10 | Place and reading labels | **The syrinx reading:** *" (reaching the corticospinal tracts)"*, in brackets like the cord's other readings ("(arms spared)"). **The basilar reading:** *" — with the basis pontis"*, with a dash because the ARAS label already ends in brackets. **The top of the basilar's label:** *"thalami and occipital lobes (top of the basilar)"*, so the Where line reads *"Bilateral thalami and occipital lobes (top of the basilar)"*; the prototype's *"Bilateral top of the basilar"* reads badly. Both MLFs and the paracentral lobules keep their inherited labels: *"Bilateral medial pons"*, *"Bilateral paracentral lobule"* |
| 11 | Three phonebook entries (the table below) | **Approve as written** |
| 12 | The top of the basilar's content | **Causes, in this order:** <br>1. Top-of-the-basilar embolism (red; *"Sudden drowsiness, vertical gaze palsy and visual loss together, with little or no weakness — one embolus at the tip blocks both posterior cerebral arteries and the thalamoperforators at once; it is regularly mistaken for delirium"*) <br>2. Basilar artery occlusion (red) <br>3. Vertebral artery dissection (red) <br>4. Posterior reversible encephalopathy syndrome (PRES) (red) <br>5. Deep cerebral venous thrombosis (red) <br>6. Cardiac arrest / profound global hypoperfusion (red) <br>7. Non-convulsive status epilepticus (mimic) <br>Every name reuses an authored plan. **Add an eighth, Creutzfeldt-Jakob disease (the Heidenhain variant)**: a chronic onset sets all seven aside (*"No cause here typically starts this way — 7 set aside"*, measured) and leaves the stroke plan standing. That is the defect the onset-follows rule exists to prevent; the eighth is not prototyped. **Workup:** EMERGENCY CT + CTA of the basilar artery; MRI DWI of both thalami, the midbrain and both occipital lobes; ECG and monitoring; venography if the thalamic change is not arterial; immediate stroke and neurointerventional referral. **Three plan slots**, which the plan-differentiation invariant requires (measured): vertebral artery dissection, top-of-the-basilar embolism and cardiac arrest each name *"conscious level, vertical gaze and both visual fields"* at this place. No existing site's plan changes. The tables need a vascular row (basilar artery, no segment), a topography row (no lobe: only cortex keys carry one, test-enforced) and a territory line |
| 13 | The shared anterior-horn wasting note | **Drop "generalised":** *"anterior horn cells — denervation wasting (LMN)"*. The central cord reuses the motor unit's row, so the syrinx's Why card would quote *"(generalised LMN)"* for wasted hands (cord spec D8, deferred to this round). A cord-level wasting row was measured instead and rejected: `tone.test` pins *"UMN has NO wasting — spasticity levels and wasting levels are disjoint"* |

The three phonebook entries (row 11):

| Site | Name | Note | Red flag |
|---|---|---|---|
| `bilateral_pons_mlf` | Bilateral internuclear ophthalmoplegia (both MLFs) | The two medial longitudinal fasciculi lie side by side in the paramedian tegmentum, so one small paramedian lesion takes both: neither eye adducts on lateral gaze, with nystagmus of the abducting eye on each side; convergence may be spared. | A bilateral INO in an older patient, or with any other brainstem sign, is a posterior-circulation stroke until imaging says otherwise. |
| `bilateral_paracentral` | Parasagittal syndrome (both paracentral lobules) | A lesion at the vertex takes both medial hemispheres: a spastic paraparesis with cortical-type urinary incontinence, often with cortical sensory loss in the legs and a magnetic gait — it mimics a spinal cord lesion almost perfectly. | Bilateral leg weakness with urinary incontinence and a normal spine MRI is a parasagittal lesion until proven otherwise — image the brain. |
| `top_of_basilar` | Top-of-the-basilar syndrome (basilar apex) | An embolus at the basilar tip blocks both P1 segments, with the thalamoperforators to both paramedian thalami, and both PCAs beyond: reduced arousal, vertical gaze palsy and amnesia with cortical blindness or bilateral field loss — often with PRESERVED power. | Drowsiness with vertical gaze palsy and visual loss is a basilar-tip occlusion until proven otherwise — CTA now; it is a thrombectomy target, and it is regularly called delirium. |

Their differentials: both MLFs list MS, brainstem infarct, Wernicke's, tumour and myasthenia (pseudo-INO). The
paracentral lobules list meningioma, bilateral ACA infarct, superior sagittal sinus thrombosis and NPH (mimic). The top of
the basilar lists embolism, basilar thrombosis, PRES and deep venous thrombosis (which mimics the thalamic half).

### F. Tests, probes and the anatomy sheet

| # | Decision | Recommendation |
|---|---|---|
| 14 | Re-pins | **None.** Measured: `npm test` is 86 suites, 7361 assertions, 0 failures. A new suite, `test/composite-sites.test.js`, pins rows 1–9 and the guards (§6's unchanged pictures) |
| 15 | New audit probes, in PR #18's suite (as each earlier round added) | **Add four.** Each fails today and passes under the set: <br>(a) cape + spastic legs, without wasted hands → `bilateral_cord_central` first, one lesion (today: anterior + central cord, "Metastases"); <br>(b) quadriplegia + both Babinski + preserved vertical gaze → `locked_in` first, one lesion (today: anterior cord + locked-in, "MS"); <br>(c) coma + vertical gaze palsy + a hemianopia on each side → `top_of_basilar` first, one lesion (today: Percheron + both occipital lobes, "MS"); <br>(d) both legs weak + both Babinski + cortical sensory loss in both legs → `bilateral_paracentral` first, one lesion (today: three places, cord + both ACAs, "MS"). <br>Also measured and passing, not proposed: coma + extensor posturing + quadriparesis (today: locked-in + ARAS, "MS"), and locked-in with both facial palsies and anarthria. I have not added any of them |
| 16 | Anatomy sheet (`docs/artifacts/anatomy-model.html`) | **No new rows:** every composite reuses existing structures. One note changes (row 13) |

## 5. Measured on the prototype

**The recommended set** is rows 1–9 and 13, with rows 10–12's content as drafted in the prototype. Two exceptions were
not prototyped: row 10's label for the top of the basilar (the prototype used *"top of the basilar (both thalami and
occipital lobes)"*), and row 12's eighth cause. Neither changes a check. Measured on a copy of `4d781bd`:

| | Today | Recommended set |
|---|---|---|
| Audit probes | 101 / 111 | **108 / 111** |
| Counted checks | 1034 passed, 13 failed | **1043 passed, 4 failed**: bilateral VI ×2 and uncal herniation ×2, the raised-pressure round |
| (a) synonym swaps | 272 / 272 | 272 / 272 |
| (b) background | 292 / 292 | 292 / 292 |
| (c) mirror | 273 / 273 | 273 / 273 |
| `npm test` | 7355 / 0 | **7361 / 0**, no re-pins. The 6 new assertions are `pathology-next-steps` table checks over the new places |

Probes correct by region:

| Region | Today | Recommended set |
|---|---|---|
| Spinal cord | 19 / 20 | **20 / 20** |
| Brainstem | 12 / 15 | **15 / 15** |
| Hemispheres, thalamus and vision | 13 / 14 | **14 / 14** |
| Consciousness and raised pressure | 4 / 7 | **6 / 7** (uncal herniation: raised-pressure round) |
| Cranial nerves and skull base | 10 / 12 | 10 / 12 (bilateral VI ×2: raised-pressure round) |
| All other regions | all correct | unchanged |

**What each row buys.** Each row left out of the full set, one at a time (measured without row 9, which changes no check):

| Left out | Audit | Lost |
|---|---|---|
| 1 (locked-in re-derived) | 1041 / 6 | the full locked-in picture (2) |
| 2 (basilar reading) | 1040 / 7 | the basilar coma (2), and the pontine haemorrhage's one-lesion check |
| 3 (both MLFs) | 1042 / 5 | bilateral INO |
| 4 (syrinx reading) | 1042 / 5 | syrinx |
| 5 (its gate) | 1042 / 5 | spastic legs + C4: the level note (the syrinx reading leads) |
| 6 (both paracentral lobules) | 1041 / 6 | R1 #12 (2) |
| 7 (the PARASAG regex) | 1041 / 6 | R1 #12's top 3, and R1 #16's top 3 (passes today) |
| 8 (top of the basilar) | 1041 / 6 | R1 #14, R1 #15 |
| 13 (the wasting note) | 1043 / 4 | nothing (wording) |

**Each row alone, against today:**
- rows 1 + 2: 1037 / 10;
- row 1 alone: 1034 / 13 (+2, −2);
- row 3: 1035 / 12;
- rows 4 + 5: 1035 / 12, and row 4 alone 1033 / 14;
- rows 6 + 7: 1035 / 12, and row 6 alone 1034 / 13;
- row 8: 1036 / 11.

**The rows interact only on R1 #12's top 3.** Rows 1–2, and row 4 without its gate, threaten it; rows 6–7 restore it.

**Run time:** single runs, not controlled. No slowdown was seen (audit 14.9 s → 10.7 s, suites 58.6 s → 38.7 s).

**The safety sample.** It takes every 7th pair (9,490) of the 66,430 pairs among the 365 site pictures, as in the earlier
rounds. Each pair's picture is both sites' full pictures, frozen from `4d781bd`, so every variant is asked the same
question. Today 9,191 of the pairs get a two-lesion claim. The pairs are synthetic, so the truth is known: the two places
that made the picture.

| | Recommended set |
|---|---|
| Two-lesion claims no longer made | **2**, both one lesion: both basis pontis → locked-in (row 1); both fusiform gyri + coma → the top of the basilar (row 8) |
| New two-lesion claims | **0** |
| Covers that change places | 21. 3 grow from two places to three; 1 changes the suggested disease (diffuse cerebrum + myasthenia, "none" → ARAS + myasthenia, "Paraneoplastic"). By row: locked-in 12 (the 3 that grow), basilar reading 3, paracentral lobules 5, top of the basilar 1, both MLFs 0, syrinx 0 |
| Covers naming exactly the two places that made the picture | 7,324 → 7,311 (12 move away from the true pair, 0 toward it, 9 neither) |
| The 365 baseline site pictures | **No first answer changes.** Nine gain a place in their list. The top of the basilar is second for Anton's, the bilateral fusiform and Percheron; it also joins the limbic thalami, the mammillary bodies and the diffuse cerebrum. The bilateral paracentral site joins the two paracentral pictures. Each new site wins its own picture |
| The 389 offered single findings | **No first answer changes.** Ten gain a place, e.g. cortical blindness 1 → 2 and urinary incontinence 4 → 5 |

- **The 12 locked-in covers** are mostly the known-negative rule working on a frozen picture. The frozen locked-in
  picture is the old site's (quadriplegia + preserved vertical gaze). The re-derived site predicts Babinski, face and gaze
  on both sides, so a partner picture with one of those signs on one side only now excludes it, and the cover assembles
  other places. A real locked-in picture carries those signs on both sides.
- **The paracentral and top-of-the-basilar covers move through O3**, the cover's tie-break, which prefers the larger of
  two places that cover the same finding.

## 6. The answer card, before and after

Captured from `answerFor`, with the engine's default answer selected, as the app does. Only the lines that change are
shown.

| Picture | Today | Recommended set |
|---|---|---|
| Syrinx | … Bilateral anterior cord and Bilateral central cord. *Together: Metastases.* Next: spinal surgery (EMERGENCY) | Bilateral central cord (reaching the corticospinal tracts) *(row 10 label)*. **Why:** Bilateral cape-like pain loss → only the spinal cord. *Most likely Syringomyelia (± Chiari).* Next: neurosurgery for a syrinx or Chiari (URGENT) |
| Bilateral INO | … Left and Right trochlear nucleus. *Together: Multiple sclerosis.* | Bilateral medial pons. **Why:** Bilateral eye lags turning in on side gaze → only the pons. *Most likely Basilar perforator infarct* (subacute: *Demyelination (MS)*, the MS service) |
| Basilar: coma + quadriparesis + both Babinski | … Bilateral anterior cord and Bilateral diffuse cerebral involvement. *Together: Multiple sclerosis.* Next: *Spinal surgery — cord compression is time-critical* | Bilateral paramedian tegmentum (ARAS) — with the basis pontis. **Why:** Bilateral arm weakness + reduced consciousness → only the pons. *Most likely Top-of-the-basilar / brainstem infarct.* Next: acute stroke team + ICU. Red: the ARAS's posterior-circulation flag |
| Pontine haemorrhage: coma + both gaze palsies + quadriparesis | Bilateral ventral pons explains 4 of 7 findings. Red: *"Do not mistake locked-in for coma … the patient is fully aware"* | Bilateral paramedian tegmentum (ARAS) — with the basis pontis. **Why:** Bilateral horizontal gaze palsy → only the pons. Red: the ARAS's flag |
| Locked-in, full picture | … Left hemipons, Right hemipons and Bilateral ventral pons. *Together: Multiple sclerosis.* | Bilateral ventral pons (basis pontis). *Most likely Basilar artery occlusion.* Red: the locked-in flag |
| Parasagittal meningioma (R1 #12) | … Bilateral anterior cord and Left ACA territory. *Together: Multiple sclerosis.* Next: spinal surgery | Bilateral paracentral lobule. **Why:** Bilateral leg weakness + urinary incontinence → only the cerebral cortex. *Most likely Parasagittal / falx meningioma.* Next: URGENT neurosurgery if a parasagittal mass |
| Papilloedema + paraparesis + sphincter (R1 #16) | Left leg area of the motor cortex explains 2 of 5. *Most likely ACA infarct.* | Bilateral paracentral lobule explains 4 of 5. *Most likely Parasagittal / falx meningioma* |
| Top of the basilar (R1 #14) | … Bilateral paramedian thalamus and Bilateral primary visual cortex. *Together: Multiple sclerosis.* | Bilateral thalami and occipital lobes (top of the basilar) *(row 10 label)*. **Why:** Cortical blindness + reduced consciousness → only the cerebral cortex and thalamus. *Most likely Top-of-the-basilar embolism.* Next: IMMEDIATE stroke + neurointerventional referral |
| Bilateral PCA (R1 #15) | … Left anterior + dorsomedial thalamic nuclei and Bilateral primary visual cortex. *Together: Multiple sclerosis.* | As R1 #14. **Why:** Cortical blindness + can't form new memories → only the cerebral cortex and thalamus |
| Quadriparesis + both Babinski | Bilateral anterior cord. 1 other place also fits. **Why:** … → only the spinal cord | Bilateral anterior cord. 3 other places also fit: Bilateral ventral pons, … **Why:** Bilateral arm weakness → the pons or spinal cord |
| Paraparesis + both Babinski | Bilateral anterior cord (arms spared). 1 other place also fits. **Why:** … → only the spinal cord | … 4 other places also fit: Bilateral paracentral lobule, Bilateral transverse cord, and 2 more (the two pontine places). **Why:** Bilateral leg weakness → the cerebral cortex, pons or spinal cord (O1) |
| Spastic legs, with or without a C4 level | anterior cord first | anterior cord first; the bilateral paracentral lobule is also listed |
| Percheron triad; Anton's alone; bilateral hemianopia | their own place | the same first answer; the top of the basilar is also listed |
| **Unchanged by design:** the bare cape; both arms weak + cape; a one-sided INO; the locked-in vignette (quadriplegia + preserved vertical gaze); coma + extensor posturing; one weak leg + Babinski + incontinence (one ACA) | | |

## 7. What this round does not fix, and what it found

**The other 4 failing checks** are the raised-pressure round: bilateral VI with and without papilloedema (2), and uncal
herniation (2). Nothing here touches them; the uncal picture fails exactly as today.

**Observations for later, not rows of this round:**
- **O1. Bilateral places become "also fits" for parts of their picture.** The pontine places now explain any
  quadriparesis or paraparesis with Babinski, and bilateral facial weakness + dysarthria. The top of the basilar now
  explains Anton's, a bilateral hemianopia and Percheron's triad. The first answers do not change, but a paraparesis's Why
  line names the pons. That is the model's rule: a place fits when it predicts everything entered. A recorded normal arm
  strength would remove the pons, the way a down-going plantar demotes today. Not built.
- **O2. The cover's tie-break prefers the larger place (O3 of the content-gap round).** It moves 21 covers here. Its own
  design is `fix/cover-tiebreak`.
- **O3. The basilar reading's What line leads with the ARAS list's "Top-of-the-basilar / brainstem infarct".** The
  locked-in's list leads with basilar artery occlusion, the commoner pontine cause. That is a cause-order question for a
  content round.
- **O4. The re-derived locked-in brings the basis pontis's forehead-sparing and limb-ataxia rows.** The forehead follows
  the signed-off pseudobulbar site. Limb ataxia cannot be examined in plegic limbs. Both are over-predictions only.
- **O5. Both MLFs inherit the medial pons's causes.** At a chronic onset the What line reads "Pontine glioma (esp.
  children). Could represent an old stroke."
- **O6. A bilateral one-and-a-half (both INOs + both horizontal gaze palsies) still reads as two places:** both MLFs +
  locked-in. A "both paramedian pontine tegmenta" site would make it one. No probe asks for it, so it is not proposed.
- **O7. The parasagittal site is the paracentral lobules only.** A bilateral ACA infarct with abulia and grasp reflexes
  would need both whole ACA territories. Not proposed.

## 8. How it would be built (the plan follows the ruling)

- `src/model/sites.js`:
  - `locked_in` derived as row 1;
  - `brainstem_aras` gains the `basis` reading (`side: "bilateral"`, `station: "pons"`);
  - `bilateral_cord_central` gains the `syrinx` reading (`needs: ["suspended_sensory"]`);
  - three composers: `composeBilateralMlfSites`, `composeParasagittalSites`, `composeTopOfBasilarSites`
    (`carrierStations: true`);
  - a territory line.
- `src/engine/inverse.js`: `variantOf` carries a reading's `side` and `station`; `solverSites(opts, entered)` honours
  `needs`; its four callers pass what was entered.
- `src/model/stations.js`: `stationOf` reads a site's own `station`.
- `src/engine/why.js`: `stationsAt` (row 9), used by the locus index, the meet and the clues; a one-place meet over two
  stations joins them with "and".
- `app/labels.js`: the two reading labels and the top of the basilar's label (row 10).
- `src/model/structures.js`: the wasting note (row 13).
- `src/data/syndromes.js`: the three entries (row 11).
- `src/data/causes.js` and `src/data/nextSteps.js`: the top of the basilar (row 12).
- `src/data/pathology/vascular.js`: the three plan slots (row 12).
- `src/model/vascular.js`, `src/model/topography.js`: the top of the basilar's rows.
- `docs/artifacts/anatomy-model.html`: the wasting note.
- Tests:
  - `test/composite-sites.test.js`;
  - in PR #18's suite, the PARASAG regex (row 7) and the four probes (row 15).
- Docs: CLAUDE.md and the audit spec. Record:
  - the reading-or-place principle (§3.1);
  - the `needs` gate;
  - the traps: the locked-in hand list went stale, and R1 #12's top 3 passed only because exactly two cord sites
    outranked the ACA.
