# The raised-pressure and herniation round — four audit checks (design, 2026-11-05)

**Status: DESIGN — round 1 awaiting the owner's ruling. No engine code.**
- Branch `fix/raised-pressure` (worktree `Code/neurolocaliser-pressure/`), cut from `fix/content-gaps` at `4d781bd`. That branch is
  the finished content-gap fix, stacked on the false-multifocal fix, the cord fix and PR #18 (all open, none to be merged).
  Not pushed; no PR.
- Every number below was measured by applying candidate changes to throwaway copies of `4d781bd`, outside the repo. Nothing
  was committed except this document.

This is the fourth fix from the 2026-10-18 clinical audit, after the spinal cord, false-multifocal and content-gap fixes. The
yardstick is `npm run test:audit`; its baseline and rulings are in `2026-10-18-clinical-audit-suite.md`. On `4d781bd` the audit
counts **1034 passed, 13 failed**: 9 belong to the composite-sites round and **4 to this round**:
- bilateral VI + papilloedema (R1 #7): no multifocal claim, and the raised-pressure axis fires (the axis already fires);
- bilateral VI alone (R1 #8): no multifocal claim;
- uncal herniation, coma + a fixed dilated left pupil + extensor posturing (R1 #13): one process, with the compressive III in the
  top 3 (two checks).

**Headline (measured).** The recommended set fixes all four. Probes 101 → **104 / 111**; counted checks 1034 / 13 → **1038 / 9**,
and the 9 left are exactly the composite-sites round. Nothing that passes today fails. In `npm test` one assertion fails: a pin
that row 2 changes on purpose (row 12).

**Three answer cards are unsafe today beyond the four checks, and the set fixes all three:**
- **coma + a fixed dilated left pupil** reads "diffuse cerebrum + left ciliary ganglion", and the card selects the ciliary
  ganglion: *Holmes-Adie (tonic) pupil — ophthalmology outpatient, reassurance — routine*;
- **papilloedema alone** reads "right perisylvian language area — large MCA infarct — IMMEDIATE stroke team";
- **a sixth-nerve palsy with papilloedema**, the commonest false-localising picture, reads "left medial pons — basilar
  perforator infarct — acute stroke team".

---

## 1. What is wrong

The real answer card (`app/answer.js` `answerFor`) on `4d781bd`, with the raised-pressure banner where papilloedema is entered:

| Picture | Where line today | What and Next today |
|---|---|---|
| Bilateral VI + papilloedema (R1 #7) | No single place explains every finding — likely left VI and right VI (cisternal segment) | *Together: Neurosarcoidosis.* Next: Acute stroke team — basilar disease can progress to locked-in [emergency]. Red flag: basilar territory disease |
| Bilateral VI alone (R1 #8) | … likely left VI and right VI (cisternal segment) | *Together: Neurosarcoidosis* |
| Uncal: coma + fixed dilated L pupil + extensor posturing (R1 #13) | … likely midline paramedian tegmentum (ARAS) and left ciliary ganglion | *No catalogued disease spans these places* |
| Coma + fixed dilated L pupil | … likely bilateral diffuse cerebral involvement and left ciliary ganglion | Next: **Ophthalmology/neurology outpatient — reassurance is usually the main treatment [routine]**. Red flag: "Benign — but confirm with dilute pilocarpine" |
| Papilloedema alone | **Right perisylvian language area.** 177 other places also fit | *Most likely Large MCA territory (or ICA) infarct.* Next: **IMMEDIATE stroke team and neurointerventional referral [emergency]**. Why: "These findings need more than one lesion" |
| Left VI + papilloedema | **Left medial pons.** 1 other place also fits | *Most likely Basilar perforator infarct.* Next: Acute stroke team [emergency] |

R1 #7's card does not even agree with itself: the Where line names the two VI nerves, while the Next line and the red flag are
the medial pons's.

## 2. Why it happens

1. **Nothing in the model is "both VI nerves".** The VI is a left nerve and a right nerve, so two palsies need two places, and
   the roster then names a disease to join them (sarcoid, NF2, vasculitis, leptomeningeal disease). Yet the VI site's own
   causes, signed off, already read the pair as one process: *"bilateral VI palsies mean raised pressure or thiamine deficiency
   until proven otherwise"* (Wernicke's), and its raised-pressure plan examines *"eye abduction on both sides"*.
2. **Papilloedema removes the VI's own course from the list.** The raised-pressure axis keeps only intracranial levels, and the
   VI's cisternal and petrous course is level `skull_base`. So with papilloedema the list falls back to the pons. The cover is
   built without the pressure token, so it still uses the excluded VI nerves, and the card mixes the two: Where from the cover,
   Next and red flag from the pons. Exactly three parts outside the intracranial levels list raised pressure among their own
   causes: the VI's cisternal course, the VI at the petrous apex and the IV's cisternal course. They are the nerves the pressure
   itself injures, the false-localising signs.
3. **The compressive III has no herniation reading.** The III and the midbrain are separate places, so coma and a blown pupil
   need two. For the pupil, the cover then takes the place that predicts least beyond it, the ciliary ganglion (Adie's pupil:
   one extra sign) over the compressive III (four), and the card selects it.
4. **Papilloedema alone has no answer of its own.** Every intracranial place explains 0 of 0, and the first is whichever predicts
   least: a right-hemisphere aphasia composite that predicts almost nothing when the left hemisphere is dominant. The card
   names it, with its cause, its plan and its red flag.

## 3. The three decisions that are more than content

### 3.1 How a false-localising sign is shown (R1 #7)

R1 #7 asked *"How should a false-localising sign be shown?"*; the approved answer was "no multifocal claim; the raised-pressure
axis fires".

| Option | What it does | Audit | What else changes | `npm test` |
|---|---|---|---|---|
| A. Both VI nerves only (row 1 without row 2) | A bilateral VI site | **+1** | R1 #8 passes too (§3.2). But R1 #7's check passes for the wrong reason: papilloedema still removes the VI's course, so the card reads *"Left medial pons explains 1 of 2 findings — Basilar perforator infarct — Acute stroke team"*, while the invisible cover is the bilateral site | clean |
| **B. The pressure reaches the VI's course (rows 1 + 2, recommended)** | Under papilloedema the compartment filter keeps the nerve courses that raised pressure itself injures | **+1** | *"Bilateral VI — cisternal segment. Most likely Raised intracranial pressure (false localising sign)"*, with the banner. A single VI with papilloedema reads the VI nerve, not a pontine stroke (row 2) | 1 re-pin |
| C. Set aside only (row 3 without rows 1–2) | With papilloedema, the VI palsy is set aside and named | +1 | R1 #7 reads the pressure-only card (row 4). But a single VI with papilloedema still reads *"Left medial pons — basilar perforator infarct"*: one place explains it, so nothing is set aside | clean |
| D. Make the VI palsy non-localising | — | not prototyped | The false-multifocal design measured relaxing any one localising sign (§3, option C): it hid 43% of the sampled genuine two-lesion claims, and it named bilateral VI as one of the checks it passed only by suppressing claims | — |
| E. Papilloedema as a site finding | — | not prototyped | Tried and rejected on 2026-08-11: every intracranial site would over-predict it, and five suites rejected it | — |

**B, precisely.** A place stays in play under papilloedema when it is inside the skull, **or when raised pressure itself produces
its deficit** (`PRESSURE_REACHES`, row 2). The place is real — the nerve is the thing failing — and its signed-off causes name
the pressure first. The card then teaches the false-localising sign the way the VI's own plan does: *"a sixth-nerve palsy
therefore localises nowhere and demands that the pressure be explained"*.

**Row 3 adds a fallback for the pictures B cannot reach:** a VI palsy beside a hemisphere picture, with papilloedema. No place
explains both, so today a second lesion is claimed (*"left medial pons + right VI — Vasculitis"* for bilateral VI + papilloedema
+ right hemiparesis). Row 3 sets the VI aside as a false-localising sign, as the background step sets aside absent ankle jerks.
It is a narrow overturn of *"a LOCALISING sign is never relaxed away"*, the second after the same-family near-fit, so it needs
your ruling on its own.

### 3.2 Both VI nerves without papilloedema (R1 #8)

R1 #8 asked *"Is 'one process' right without papilloedema? (clivus, Wernicke, Miller Fisher …)"*; the approved answer was "no
multifocal claim".

| Option | What it does | Audit | What else changes |
|---|---|---|---|
| **A. One bilateral site on the VI's cisternal course (recommended)** | Both nerves climb the clivus side by side in the prepontine cistern, to Dorello's canals. One process there — raised or low CSF pressure, a clival tumour, basal meningitis, trauma — catches both | **+1** | It reuses every table keyed by the place (causes, workup, label, vascular and topography rows), so it adds no content to review. See row 1 for what else moves |
| B. Two palsies of one nerve read as one process | A rule over mirror pairs | not prototyped | It would read bilateral carpal tunnel as one lesion, and it is the `if (left X && right X)` rule the golden rule forbids |
| C. A clivus place with its own label and causes | A new part | not prototyped | New label, vascular, topography, cause and workup rows to review, for the same audit gain |
| D. Wernicke's and Miller Fisher as places | — | out of scope | Their eye signs come from other places (the VI nuclei; the peripheral nerves). Observations O6 and O7 |

### 3.3 How herniation is represented (R1 #13)

R1 #13 asked *"How should herniation be represented?"*; the approved answer was "one process; the compressive III in the top 3".

| Option | What it does | Audit | What else changes | `npm test` |
|---|---|---|---|---|
| **A. A reading of the compressive III (recommended)** | The same place, id, causes and plans, read at the tentorial edge: the uncus presses the III and the midbrain beside it — the ARAS (reduced consciousness), extensor posturing and the cerebral peduncle (contralateral weakness and Babinski). The cord fix's idiom: *variants keep the site's id* | **+2** | Coma with a blown pupil reads one place; see rows 5–7 | clean (gated) |
| A′. The same, ungated | Offered for every picture | +2 | An **awake** Weber picture (III + contralateral hemiparesis) leads with herniation, and an isolated Babinski's Why line adds "pupil pathway" | **7 fail**: one engine pin (a midbrain + medulla pair) and six Why-line pins, Weber's among them |
| A″. Without the peduncle | III + ARAS + posturing only | +2 | The classic picture with a contralateral hemiparesis stays two places: the reading + the left corona radiata | clean |
| B. A herniation site of its own (a new id) | A composite of the same rows | **+1** | Measured: the second check fails. A place that explains every finding is shown alone, so the compressive III leaves the top 3 (*"got left_uncal_herniation"*) | not run |
| C. A rule: coma + a dilated pupil = herniation | — | not prototyped | The golden rule: never `if (hasX && hasY) return syndrome` | — |
| D. A reading of the brainstem ARAS | — | not prototyped | Fails the top-3 check, for the same reason as B | — |

**When the reading is offered (the gate).** Spinal shock is offered only with a stated level, because without the gate it took
GBS's picture. The herniation reading needs a gate for the same kind of reason:

| Gate | What it changes beyond the probe |
|---|---|
| None (A′) | 7 assertions fail: the awake Weber picture leads with herniation |
| Reduced consciousness entered | Coma alone and coma + posturing list both III readings as "also fit"; **coma + one weak arm reads "right CN III (compressive) — uncal herniation"**, with no III sign entered; in the safety sample the reading takes the coma in 23 two-place covers (observation O3 of the content-gap design: the cover's tie-break prefers the larger place) |
| **Reduced consciousness, and one of the III's own signs on that side (recommended)** | Coma alone, coma + posturing and coma + a weak arm are unchanged. In the safety sample the reading takes the coma in 10 covers instead of 23, each pairing a picture with a ptosis, a duction or a pupil sign with a comatose one. A reading of a place is offered only when that place is implicated, and the midbrain only when consciousness is reduced |

## 4. Rulings — round 1 (14 rows)

Each row is one decision, with my recommendation. "+n" is counted audit checks fixed; the leave-one-out in §5 confirms them.

### A. The VI nerves and raised pressure

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 1 | Both VI nerves: one bilateral site on the cisternal course (§3.2) | **Yes.** `bilateral_skull_base_vi_cisternal`, built from the existing `vi_cisternal` row; no new structure. Its causes, workup, label (*"Bilateral VI — cisternal segment"*), vascular and topography rows are the cisternal VI's, keyed by the place. Rare, like every bilateral site | **+2**: R1 #8, and R1 #7, whose card also needs row 2 (§3.1). Bilateral VI alone: *"Bilateral VI — cisternal segment. Most likely Raised intracranial pressure (false localising sign) (must not miss). Must not miss: Skull base tumour or nasopharyngeal carcinoma."* A single VI palsy is unchanged (the other side is a known normal). In the sample, 1 claim becomes one place (both VIs at the petrous apex) and 4 covers take the bilateral site, none changing size or disease. **One cost found outside the sample:** a Miller Fisher picture (both VIs + truncal ataxia + areflexia), whose cover needed four places and was withheld, now fits in three and is claimed: *"Friedreich's + bilateral VI + vermis — Vasculitis"* (today *"Friedreich's ataxia explains 4 of 7"*). Both are wrong; the honest fix is a Miller Fisher reading (O7) |
| 2 | The pressure reaches the nerve courses it injures (`PRESSURE_REACHES`) | **Yes, for the VI: its cisternal course and the VI at the petrous apex.** Exactly three parts outside the skull's levels name raised pressure among their own signed-off causes; the third, the IV's cisternal course, was measured and is **deferred**: kept under papilloedema, its card leads with *"Head trauma"* and badges **routine** (today *urgent*) under the red banner, because its plan is not written for the pressure (O1). A test checks the set against the causes in both directions, with the IV as its one named exception | 0 on the audit alone, but R1 #7's card needs it (§3.1, A vs B). **A VI palsy with papilloedema:** today *"Left medial pons … Basilar perforator infarct — Acute stroke team"*; after *"Left VI — cisternal segment. 3 other places also fit: Left VI at the petrous apex, Left medial pons, and 1 more. Most likely Raised intracranial pressure (false localising sign)."* — urgent, with the banner. In the pressure sample (§5), the four VI pictures and the two VI findings with papilloedema move from the pons to the VI nerve, and Gradenigo's moves with them (still a partial fit, O9); nothing else changes. Without papilloedema nothing can change. One re-pin (row 12) |
| 3 | With papilloedema, a VI palsy that stops one place explaining the rest is set aside as a false-localising sign (§3.1) | **Yes — the narrow overturn, for the VI only.** It runs only when (a) papilloedema is entered, (b) no place explains every finding, (c) one place explains the rest (or nothing is left but the papilloedema), and (d) that place is the rest's own answer without the papilloedema. Like the background step, it never joins a cover, and the card names it (row 9). Setting a IV palsy aside too was measured, with the IV in row 2's set and before condition (d): 55 more pairs lost their claim, several of them a labyrinth or a facial-nerve picture that papilloedema replaces with a pontine place. Not recommended: a IV palsy is rarely the false-localising sign, and row 2 defers the IV | 0 on the audit (rows 1–2 already pass R1 #7). **Bilateral VI + papilloedema + right hemiparesis:** today *"Left medial pons and Right VI — Vasculitis"*; after *"Left corona radiata … The sixth-nerve palsies are set aside: with papilloedema they are a false-localising sign of the raised pressure, not further lesions."* In the pressure sample (genuine two-place pairs, papilloedema added), **81** claims beside a VI-only picture become the other place + the named VI. Without papilloedema the rule cannot run, so no other claim can change. Condition (d) keeps 6 pairs as claims: a jugular-foramen, carotid-space, orbital or trochlear picture, which papilloedema replaces with a brainstem or pupil place |
| 4 | Papilloedema with nothing else localised: the answer card names no place | **Yes.** The card says what the banner says, in four lines (row 10). The Where card's list below is unchanged (every intracranial place stays in play, as `fundus.test` pins) | The card no longer names the right perisylvian language area, a large MCA infarct and the stroke pathway. Also reached when row 3 leaves nothing but the papilloedema |

### B. Herniation

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 5 | The uncal reading of the compressive III (§3.3): the III's five rows + `aras_brainstem` + `aras_posturing` + the midbrain peduncle's contralateral weak arm, weak leg and Babinski (`cst_midbrain_arm`, `_leg`, `_bab`) | **Yes, option A, with the gate** (offered only with reduced consciousness entered and one of the III's own signs on that side). Reading key `uncal` | **+2** (R1 #13, both checks). Coma + a blown pupil, with or without posturing, a contralateral hemiparesis or Babinski, or the other III signs, reads one place (§6). The awake pictures are unchanged: a pupil-involving III palsy (aneurysm first), an isolated dilated pupil (Adie first), Weber, the complete III with the pupil not entered. In the sample, 2 claims become one place (a III division + coma), and in 10 covers the reading takes the coma from the diffuse cerebrum or the ARAS (the claim and its size stand; 7 lose their disease suggestion, mostly MS or vasculitis) |
| 6 | The reading leads with *"Uncal herniation"* on the What line | **Yes.** A reading may name the cause it leads with (`leads`). The site's own order stays for the awake picture, where the posterior communicating artery aneurysm leads, as it should. The Next line stays the site's plan: its first steps already say *"CT head first if there is any reduced consciousness"* and *"a dilating pupil with falling GCS means herniation"*, and its referral is IMMEDIATE neurosurgery. Selecting *Uncal herniation* in the What card still narrows the Next card to its own plan | What: *"Most likely Uncal herniation (must not miss). Must not miss: Posterior communicating artery aneurysm."* Without the row: *"Most likely Posterior communicating artery aneurysm. Must not miss: Uncal herniation."* |
| 7 | The reading's red flag | **Yes, new wording** (row 11). Without it the comatose patient's card says *"image the vessels (CTA/MRA) for an aneurysm now"*, which the site's own plan puts second to the CT head | — |

### C. Card wording (not measured by the audit)

| # | Decision | Recommendation |
|---|---|---|
| 8 | The reading's label on the Where line | *"Left CN III (compressive) — uncal herniation."* A dash, because the label already carries brackets. The cord ruling stands: "also fit" places stay plain (in practice the reading is almost always the answer itself) |
| 9 | The set-aside sentence (row 3), on the Where line | One palsy: *"The sixth-nerve palsy is set aside: with papilloedema it is a false-localising sign of the raised pressure, not a second lesion."* Both: *"The sixth-nerve palsies are set aside: with papilloedema they are a false-localising sign of the raised pressure, not further lesions."* The Why line and the count leave them out, as for background |
| 10 | The pressure-only card (row 4) | Where: *"Inside the skull — papilloedema means raised intracranial pressure, and on its own it does not say where."* Why: *"Papilloedema → raised intracranial pressure: it places the problem inside the skull but localises nothing."* What: *"Find what is raising the pressure: a mass, hydrocephalus or cerebral venous sinus thrombosis — idiopathic intracranial hypertension only once those are excluded."* Next: *"Image the head, with venography, before any lumbar puncture; neurosurgery if there is a mass or hydrocephalus."* Badge **urgent**: papilloedema with a normal conscious level is a same-day problem, and the red banner stays. With row 3's palsies, the Where line adds *"The sixth-nerve palsy is a false-localising sign of the raised pressure, not a second lesion."* |
| 11 | The reading's red flag (row 7) | *"A new dilated pupil with a falling conscious level is uncal herniation until proven otherwise — CT head now and call neurosurgery; start lowering the pressure while you wait."* It follows the signed-off herniation plan: *"a new unilateral dilated pupil in a drowsy patient is herniation until disproved"*; *"measures to lower intracranial pressure begin while neurosurgery is being called, not after"* |

### D. Tests, probes and the anatomy sheet

| # | Decision | Recommendation |
|---|---|---|
| 12 | Re-pins | **Approve this one, and only this one.** `fundus.test` *"papilloedema alone excludes the periphery"* → *"… keeps only intracranial places and the nerve courses the pressure reaches"* (row 2) |
| 13 | New audit probes, in PR #18's suite (as the earlier rounds' rows 13 and 19) | **Add four.** Each fails today and passes under the set: (a) left VI + papilloedema → a left VI site first, not the pons; the axis fires; (b) coma + fixed dilated left pupil → the left compressive III first, one lesion; (c) coma + fixed dilated left pupil + right hemiparesis → the left compressive III first, one lesion; (d) bilateral VI + papilloedema + right hemiparesis → a left hemisphere site first, one lesion (row 3). I have not added them |
| 14 | A new suite, and the anatomy sheet | `test/raised-pressure.test.js` pins rows 1–11 and the guards in §6 (the pictures that do not change). **No new anatomy-sheet rows:** no structure is added; the bilateral site and the reading reuse existing rows |

## 5. Measured on the prototype

**The recommended set** is rows 1–7; rows 8–11 are wording. Measured on a copy of `4d781bd`:

| | Today | Recommended set |
|---|---|---|
| Audit probes | 101 / 111 | **104 / 111** |
| Counted checks | 1034 passed, 13 failed | **1038 passed, 9 failed** — the composite-sites round exactly |
| (a) synonym swaps | 272 / 272 | 272 / 272 |
| (b) background | 292 / 292 | 292 / 292 |
| (c) mirror | 273 / 273 | 273 / 273 |
| `npm test` | 7355 / 0 | 7354 / 1: the row-12 pin |

Probes correct by region: cranial nerves and skull base 10 / 12 → **12 / 12**; consciousness and raised pressure 4 / 7 → **5 / 7**
(top of the basilar and bilateral PCA are the composite-sites round). Every other region is unchanged.

**What each row buys.** Leaving one row out of the full set at a time (measured on the full set; no check breaks in any):

| Left out | Audit | `npm test` | What is lost |
|---|---|---|---|
| 1 (bilateral VI) | 1037 / 10 | 7354 / 1 | R1 #8 |
| 2 (pressure reaches the nerve) | 1038 / 9 | 7355 / 0 | no check, but a VI with papilloedema reads a pontine stroke again |
| 3 (set-aside) | 1038 / 9 | 7354 / 1 | no check; bilateral VI + papilloedema + hemiparesis is two places again |
| 4 (pressure-only card) | 1038 / 9 | 7354 / 1 | no check; papilloedema alone names an MCA infarct again |
| 5 with the peduncle → without | 1038 / 9 | 7354 / 1 | no check; coma + blown pupil + contralateral hemiparesis is two places |
| 5's gate, both conditions | 1038 / 9 | **7347 / 8** | the awake Weber picture leads with herniation |
| 5's gate without its consciousness condition (the own-sign condition kept) | 1038 / 9 | **7347 / 8** | the same: Weber has the III's own signs, so the own-sign condition alone does not protect it |
| 6 and 7 (lead and red flag) | 1038 / 9 | 7354 / 1 | no check; the What line and red flag lead with the aneurysm |

So the audit needs only rows 1 and 5; rows 2–4, 6 and 7 are there for the cards. **Run time** (single runs, not controlled):
audit 14.6 s → 10.2 s; suites 66.8 s → 37.1 s.

**The safety sample.** Every 7th pair (9,490) of the 66,430 pairs among the 365 site pictures, on frozen baseline inputs, as in
the earlier rounds; 9,191 of them get a two-lesion claim today.

| | Recommended set |
|---|---|
| Two-lesion claims no longer made | **3**: two pair a III division with a comatose picture and become the uncal reading; one pairs the two VIs at the petrous apex and becomes the bilateral site |
| New two-lesion claims | **0** |
| Covers that change places | 14, none changing size. 4 take the bilateral VI site; 10 take the uncal reading for their coma (7 of them lose their disease suggestion, mostly MS or vasculitis) |
| The 365 site pictures | No first answer changes; the new bilateral site wins its own picture |
| The 389 offered single findings | Only papilloedema alone changes: its list gains the five VI places (178 → 183), and its card names no place (row 4) |

**The pressure and herniation sample.** The safety sample never contains papilloedema or coma, so it cannot see most of this
round. A second sample adds them to the same frozen inputs: every site picture and every single finding, + papilloedema and
+ reduced consciousness; and every 7th pair + papilloedema.

| Sample | Today | Recommended set |
|---|---|---|
| Site pictures + papilloedema (365) | no claims | no claims; 6 first answers move: the four VI pictures from the pons to the VI nerve, and Gradenigo's two (still a partial fit, O9) |
| Single findings + papilloedema (388) | no claims | 4 change: the VI palsy, each side, from the pons to the VI nerve; a down-going plantar, each side, to the pressure-only card |
| Site pictures + coma (362) | 359 claims | **351**: 8 become the uncal reading — the compressive III's own picture, the two III divisions and the pupil-sparing III (O12), each side |
| Single findings + coma (388) | 376 claims | **366**: 10 become the uncal reading — a ptosis, a duction or a dilated pupil, each side |
| Pairs + papilloedema (9,490) | 9,191 claims | **9,107**: 84 no longer made — 81 by row 3, every one beside a VI-only picture; 2 by the uncal reading; 1 by the bilateral site. **0 new**; 13 covers change places, none in size |

Of row 3's 81, the other place itself is the answer in 74 (a cortical, subcortical or brainstem picture beside the VI), and
another place explaining the same picture is in 7 (the thalamus for a lateral midbrain picture, the occipital cortex for the
LGN). Condition (d) keeps 6 more as claims, where papilloedema had replaced a jugular-foramen, carotid-space, orbital or
trochlear picture with a brainstem or pupil place.

## 6. The answer card, before and after

Captured from `answerFor`, with the engine's default answer selected, as the app does. Only the lines that change are shown.

| Picture | Today | Recommended set |
|---|---|---|
| Bilateral VI + papilloedema (R1 #7) | Left VI and right VI. *Together: Neurosarcoidosis.* Next: acute stroke team (basilar) [emergency] | **Bilateral VI — cisternal segment.** *Most likely Raised intracranial pressure (false localising sign) (must not miss). Must not miss: Skull base tumour or nasopharyngeal carcinoma.* Next: Neurology; urgent neurosurgery if raised intracranial pressure [urgent]. Banner unchanged |
| Bilateral VI alone (R1 #8) | Left VI and right VI. *Together: Neurosarcoidosis.* | **Bilateral VI — cisternal segment.** *Most likely Raised intracranial pressure (false localising sign) …* |
| Uncal: coma + L pupil + posturing (R1 #13) | ARAS and left ciliary ganglion. *No catalogued disease.* | **Left CN III (compressive) — uncal herniation.** *Most likely Uncal herniation (must not miss). Must not miss: Posterior communicating artery aneurysm.* Next: IMMEDIATE neurosurgery [emergency]. Red: row 11 |
| Coma + L pupil | Diffuse cerebrum and left ciliary ganglion. Next: **ophthalmology outpatient — reassurance [routine]** | **Left CN III (compressive) — uncal herniation.** As above [emergency] |
| Coma + L pupil + R hemiparesis (± posturing, ± R Babinski) | Three places (corona radiata, diffuse cerebrum or ARAS, ciliary ganglion). Next: hyperacute stroke pathway | **Left CN III (compressive) — uncal herniation.** As above |
| Coma + complete L III with the pupil; coma + L ptosis + pupil | Compressive III and diffuse cerebrum. Red: image the vessels for an aneurysm | **Left CN III (compressive) — uncal herniation.** Red: row 11 |
| Papilloedema + L pupil + coma | Diffuse cerebrum and left ciliary ganglion. Next: **outpatient reassurance [routine]**, under a red raised-pressure banner | **Left CN III (compressive) — uncal herniation** [emergency] |
| Left VI + papilloedema | Left medial pons. *Basilar perforator infarct.* Acute stroke team [emergency] | **Left VI — cisternal segment.** 3 other places also fit. *Most likely Raised intracranial pressure (false localising sign).* [urgent] |
| Papilloedema alone | Right perisylvian language area. *Large MCA infarct.* IMMEDIATE stroke team [emergency] | The four row-10 lines [urgent] |
| Bilateral VI + papilloedema + R hemiparesis | Left medial pons and right VI. *Vasculitis.* | **Left corona radiata …** + the row-9 sentence. *Most likely Small-vessel lacunar infarct* (O1) |
| Left VI + papilloedema + left hemiparesis | Right corona radiata and left VI. *Vasculitis.* | **Right corona radiata …** + the row-9 sentence |
| Bilateral VI + papilloedema + coma | Both VIs and diffuse cerebrum. *Vasculitis.* | **Bilateral diffuse cerebral involvement …** + the row-9 sentence. *Most likely Metabolic or toxic encephalopathy* (O1) |
| Gradenigo (VI + V1) + papilloedema | Left medial pons explains 1 of 2. *Basilar perforator infarct* | Left VI — cisternal segment explains 1 of 2. *Raised intracranial pressure* (O9) |
| Coma + both pupils fixed + posturing | ARAS and both ciliary ganglia | Left and right compressive III. Still two places (O4) |
| Coma + L pupil + posturing + both Babinski | ARAS, SCD and left ciliary ganglion | Left compressive III and SCD. Still two places (O3) |
| Coma + both VIs | Both VIs and diffuse cerebrum. *Vasculitis* | Bilateral VI and diffuse cerebrum. *Vasculitis* (O6) |
| Miller Fisher: both VIs + truncal ataxia + areflexia | Friedreich's ataxia explains 4 of 7 | Friedreich's, bilateral VI and vermis. *Vasculitis* (row 1's cost; O7) |
| **Unchanged by design:** a single VI palsy; Gradenigo; Millard-Gubler, with or without papilloedema; a VI + papilloedema + contralateral hemiparesis (the pons still explains all three); an isolated dilated pupil (Adie first); a complete III with the pupil, awake (aneurysm first); the complete III with the pupil not entered (ischaemic first); Weber, awake; an awake dilated pupil + contralateral hemiparesis (two places, O5); coma alone; coma + posturing (ARAS); coma + papilloedema; Kernohan's picture (coma + L pupil + L hemiparesis, O5); papilloedema + hemiparesis or hemianopia (O1); a IV palsy with papilloedema (still the contralateral trochlear nucleus, row 2's deferral); bilateral IV (O8) | | |

## 7. What this round does not fix, and what it found

**The other 9 failing checks** are the agreed composite-sites round: syrinx; bilateral INO; basilar coma (2); locked-in (2);
parasagittal (R1 #12); top of the basilar (R1 #14); bilateral PCA (R1 #15). None of them moves under this set.

**Observations for later, not rows of this round:**
- **O1. Papilloedema does not steer the What line.** It narrows the places but not their causes, so a hemiparesis with
  papilloedema still leads with a lacunar infarct, coma with papilloedema with a metabolic encephalopathy, a hemianopia with
  papilloedema with a PCA infarct, and a IV palsy with papilloedema with head trauma. A cause that cannot raise the pressure
  could be demoted as an onset demotes it today ("pressure follows the cause"). It needs a per-cause attribute across the cause
  rows, so it is its own design.
- **O2. The cover ignores the compartment filter.** `minimalSet` is solved without the papilloedema, so the cover can use places
  the list excludes; that is how R1 #7's card mixed two places. Rows 2–3 remove the VI case. Elsewhere it still decides some
  answers: the papilloedema + paraparesis probe passes "no multifocal claim" only because the cover keeps the cord, while its
  Why line says *"→ only the spinal cord"* under a banner that excludes the cord. Changing it would turn that probe into a claim,
  so it belongs with the parasagittal site (composite-sites round).
- **O3. Coma with both Babinski signs** reads a second place for the extra Babinski (SCD), with or without the reading: the
  composite-sites round's basilar-coma picture.
- **O4. Both pupils fixed in coma** reads the two III readings: central herniation (both III nerves, the midbrain) is not modelled.
- **O5. Two herniation pictures stay two places by the gate's design:** an alert patient whose pupil dilates before
  consciousness falls (early herniation), and Kernohan's notch (the hemiparesis on the side of the blown pupil, itself a
  false-localising sign).
- **O6. Coma with both VI palsies** reads two places + vasculitis. The one-process answers are Wernicke's (the VI nuclei, with
  confusion) and raised pressure before the discs swell; neither is a place in the model.
- **O7. Miller Fisher has no reading.** The acute polyradiculoneuropathy carries no ophthalmoplegia, so ophthalmoplegia + ataxia +
  areflexia reads Friedreich's ataxia today, and a three-place claim under row 1. A Miller Fisher reading of the GBS site would
  be the honest fix.
- **O8. The IV nerve.** A IV palsy with papilloedema still reads the contralateral trochlear nucleus in the midbrain, because the
  filter removes the nerve; row 2 defers the IV until its card can follow the pressure (O1). Both IV nerves after trauma read
  two places + sarcoid, while the trochlear site's own red flag already reads the pair as one injury (the tectal plate, where
  both nerves cross); a bilateral IV site would be row 1's shape.
- **O9. Papilloedema still filters the skull-base corridors** (Gradenigo, the jugular foramen, the cavernous sinus), so a
  corridor picture with papilloedema reads a brainstem place or a partial fit.
- **O10. The Why line names the reading's level, not its mechanism:** *"Left fixed dilated pupil + reduced consciousness → only
  the left pupil pathway."* "→ the left third nerve at the tentorial edge" would read better; it is a stations question.
- **O11. "Bilateral eye won't turn out"** is how the side word and the plain label combine for a both-sides clue; "both eyes
  won't turn out" would read better (a plain-labels question, like the content-gap design's O4).
- **O12. A recorded normal pupil** would keep a pupil-sparing III palsy in a comatose patient off the herniation reading (§5:
  coma + the ischaemic III's picture reads the reading). The model has no normal-pupil finding; like the normal hearing of the
  content-gap design's O5, it would demote as a down-going plantar does.

## 8. How it would be built (the plan follows the ruling)

- `src/model/sites.js`:
  - a composer for the bilateral cisternal VI (row 1);
  - `READINGS`, a table of the readings a primitive site can take (the compressive III's `uncal`, row 5): its rows, its gate
    (`needs` reduced consciousness; the place's own sign entered), the cause it leads with and its red flag. `buildSites` attaches
    them as `variants`, as `cordVariants` does for the cord.
- `src/model/compartments.js`: `PRESSURE_REACHES` (row 2: `skull_base|vi_cisternal`, `skull_base|vi_petrous_apex`), beside
  `INTRACRANIAL_COMPARTMENTS`, with the IV's deferral written at the set.
- `src/engine/inverse.js`:
  - the compartment filter keeps `PRESSURE_REACHES` (row 2);
  - `solverSites(opts, observed)` applies a reading's gate (row 5); `variantOf` carries `leads` and `red`;
  - `falseLocalisingAside` before the background step (row 3); the result carries `pressure.falseLocalising`.
- `src/data/causes.js` `causesFor`: a reading's `leads` puts that cause first (row 6). No cause is added or edited.
- `app/answer.js`: the pressure-only card (rows 4, 10), the set-aside sentence (row 9), the reading's red flag (row 11).
  `app/labels.js` `readingLabel`: *" — uncal herniation"* (row 8). `app/app.js`: the count leaves out the set-aside palsies, as
  it does background; the What card's red flag reads the reading's.
- Tests: the row-12 re-pin; `test/raised-pressure.test.js` (row 14), including the `PRESSURE_REACHES` ↔ causes cross-check; the
  row-13 probes in PR #18's suite.
- CLAUDE.md: the false-localising overturn (row 3), `PRESSURE_REACHES`, readings of a primitive site and their gate, and the
  traps (an ungated reading takes the awake Weber picture; a coma-only gate lets the reading take covers; the cover ignores the
  compartment filter).
