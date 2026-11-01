# The content-gap fixes — sixteen audit checks (design, 2026-11-01)

**Status: DESIGN — round 1 (20 rows) awaiting the owner's ruling. No engine code has changed.**
- Branch: `fix/content-gaps` (worktree `Code/neurolocaliser-content/`), cut from `fix/false-multifocal` at `417385f`.
  That branch is the finished false-multifocal fix, stacked on the cord fix and on PR #18 (open, not to be merged).
  Not pushed; no PR.
- Every number below was measured by applying candidate changes to throwaway copies of `417385f`, outside the repo.
  Nothing was committed except this document.

This is the third fix from the 2026-10-18 clinical audit, after the spinal cord and the false-multifocal fixes. The
yardstick is `npm run test:audit`; its baseline and rulings are in `2026-10-18-clinical-audit-suite.md`. On `417385f`
the audit counts **960 passed, 30 failed**. Of the 30, 9 belong to the agreed composite-sites round, 4 to the
raised-pressure round, 1 is a ranking issue, and **16 are this round**.

**Headline (measured).** The recommended set fixes all 16, and the ranking issue as a side effect. Probes 86 → 98 /
108; counted checks 960 / 30 → 1025 / 13. The 13 left are exactly the composite-sites and raised-pressure rounds.
Nothing that passes today fails. In `npm test`, 8 assertions and one test helper fail, in 5 suites. Each is a pin that
a row below changes on purpose; they are listed in row 18.

---

## 1. What is wrong

The real answer card (`app/answer.js` `answerFor`) for each failing probe on `417385f`:

| Probe (audit check) | Where line today | What line today |
|---|---|---|
| Bulbar-onset ALS: tongue + swallow + fasciculations (R1 #3) | No single place explains every finding — likely anterior horn cell, left hemimedulla and right hemimedulla | No catalogued disease spans these places |
| Ulnar nerve at the elbow, dorsal sensation lost (2) | … likely ulnar nerve at the wrist and ulnar nerve at the elbow | Together: Mononeuritis multiplex |
| C6 radiculopathy: dermatome + both reflexes + root pain | Left upper trunk of the brachial plexus | Obstetric brachial plexus injury (Erb's palsy) |
| Upper trunk (Erb) with deltoid-patch numbness | … likely C5 root and posterior cord | Together: Vasculitis |
| L4: knee extension + hip adduction + knee jerk + L4 dermatome (R1 #4) | Left lumbar plexus | Diabetic lumbosacral radiculoplexus neuropathy |
| UMN foot drop: foot drop + Babinski + brisk reflexes (2, R1 #5) | … likely right hand knob and left deep peroneal nerve | Together: Vasculitis |
| Horner + XII | Left Villaret (retroparotid space) | Skull base or retroparotid metastasis |
| HINTS-plus: vertigo + hearing loss + abnormal head impulse (R1 #9) | Left labyrinth (AICA is not listed) | Vestibular neuritis |
| Left MCA picture, patient set right-dominant (2, R1 #10) | … likely left anterior choroidal territory and right both watershed language zones | Together: Multiple sclerosis |
| Alexia without agraphia + right hemianopia | … likely left fusiform gyrus and left optic radiation | Together: Multiple sclerosis |
| Wrong-way eyes: gaze left + left hemiparesis (2) | … likely right corona radiata and left frontal eye field | Together: Multiple sclerosis |
| Thalamus: hemisensory loss + hemiataxia + face | Left hemimidbrain | Top-of-the-basilar occlusion — Next: IMMEDIATE neurointerventional referral |

Two of these send the reader the wrong way. A C6 radiculopathy is worked up as an obstetric plexus injury, with urgent
nerve-transfer surgery. A thalamic lacune is worked up as a top-of-the-basilar occlusion.

## 2. Why it happens

Every one of the 16 is a gap in the model's content, or a rule applied more strictly than the bedside does. Only two
rows need more than content: dominance (row 9, one step in the solver) and the pyramidal foot drop (row 13, one
matching relation in the families table).

1. **A plexus trunk is the union of its roots** (`composePlexusSites`). So a root that lacks one of its own signs loses
   to its trunk, which carries it from the neighbouring root:
   - The biceps jerk is a C5 row only, although the row's own note says "C5/6". So the upper trunk is the only place
     that explains a C6 picture with a lost biceps jerk.
   - The adductors are L2 and L3 rows only. The obturator nerve is L2–4, so the lumbar plexus wins the L4 picture.
2. **A trunk carries only root rows.** The upper trunk has the C5 and C6 dermatomes, but not the nerve territories it
   feeds. The deltoid patch a clinician tests is the axillary nerve's, so Erb's palsy needs "C5 + posterior cord".
3. **A place is missing one of its own signs:**
   - The ulnar nerve at the elbow has no claw. The model reads the ulnar paradox (the claw is worse distally) as "no
     claw at the elbow", and a test pins it.
   - The carotid space is the sympathetic chain alone, with no XII.
   - The PCA composite is the occipital lobe only, although `vascular.js` already puts the fusiform gyrus in PCA
     territory (P4).
   - The thalamus site is VPL + VPM. Its territory (thalamogeniculate) and its own eponym (Déjerine–Roussy) include
     hemiataxia.
   - The anterior horn's bulbar motor neurones give dysphagia and dysarthria, but not the tongue.
   - The pons gives the gaze palsy, but not the resting deviation that comes with it acutely.
   - AICA's labyrinthine branch gives the deafness, but not the abnormal head impulse.
4. **A word has no pyramidal reading.** A foot drop is a myotome and nerve word under the strict vocabulary (owner,
   2026-09-26). No corticospinal place predicts it, so "foot drop + Babinski" needs a peroneal nerve.
5. **A setting is applied as a hard gate.** The dominance setting decides which hemisphere's language structures exist
   at all (`forward.js` `structActiveAt`). Set right-dominant, a left hemisphere lesion cannot give aphasia.

## 3. The three decisions that are more than content

### 3.1 Dominance becomes a prior

R1 #10 asked *"Should the dominance setting be a prior rather than a hard rule?"*, and the approved answer was "left
MCA; one lesion".

| Option | What it does | Audit | What else changes | `npm test` |
|---|---|---|---|---|
| A. Keep the hard rule | — | R1 #10 fails (2) | — | — |
| **B. Fallback (recommended)** | Only when **no** place explains every finding with the dominance set: the places that explain every finding with the other dominance are the answer. They lead, no second lesion is claimed, and the card names the assumption | **+2** | Crossed aphasia (R1 #11) becomes one right-hemisphere lesion; right-sided neglect alone gets an answer for the first time. See below | clean |
| B′. Fallback only for a setting the clinician chose | As B, but never for the default (left) | not prototyped | The engine cannot tell a chosen setting from the default without a new input; and a rule that fires only for right dominance breaks the mirror property | — |
| C. Soft gate everywhere | Every hemispheric place also reads with the other dominance, demoted | not prototyped | Every aphasia, under any setting, would list right-hemisphere places as "also fit". A cover could be built from demoted readings | — |

**B, precisely.**
- It runs only when nothing explains every finding with the dominance set. An aphasia that the left hemisphere explains
  never lists a right-hemisphere place.
- It runs before the same-family near-fit, because a place that explains everything beats one that explains all but
  one finding.
- The card reads the place, the Why line and the red flag with the assumed dominance, and says so on the Where line
  (row 14).
- The principle would then read: *the dominance setting is a prior. The setting always wins when anything explains the
  picture with it; the other dominance is used only when nothing does, and the card says so.*

**What else B changes (measured):**
- **Crossed aphasia** (non-fluent aphasia + left face and arm weakness, right-handed): today "two lesions — Multiple
  sclerosis"; under B, "right MCA superior division … assumes the right hemisphere is dominant". R1 #11 approved "a
  right-hemisphere site in the top 3, no claim either way about multifocal", so it is consistent with that ruling.
  Crossed aphasia is rare in right-handers, which is why row 14's sentence says that otherwise no single place
  explains the findings.
- **Right-sided neglect alone**, left-dominant: today no place at all ("re-check a side, or non-organic"); under B,
  "left pulvinar … assumes the right hemisphere is dominant".
- **In the safety sample (§5)**, 14 of 9,211 two-lesion claims become one hemisphere with atypical dominance, all of
  them that crossed pattern. No picture that some place explains with the setting changes.

### 3.2 A pyramidal foot drop

R1 #5 approved "a right corticospinal site first (not the hand knob, not a nerve); one lesion" for "foot drop +
Babinski + brisk reflexes" on the left. The strict vocabulary stays: a foot drop entered alone still means L4/L5, the
peroneal nerve or the sciatic nerve. Weak hand + Babinski + brisk reflexes still means the hand knob (cortical-hand
ruling).

| Option | What it does | Audit | What else changes | `npm test` |
|---|---|---|---|---|
| A. Re-read the word (as row 20 did for the hand) | A foot drop entered with an UMN sign, or other pyramidal weakness, on that side reads as leg weakness | +2 | The L5 root and the peroneal nerve lose the foot drop whenever a Babinski is on that side. "L5 root + Babinski" then leads with the leg area of the cortex and the stroke plan, instead of the L5 root | clean |
| **A2. The place's leg weakness explains it (recommended)** | A place that gives pyramidal leg weakness also explains a foot drop entered with an UMN sign (Babinski, brisk reflexes, spasticity, Hoffmann's) or other pyramidal weakness (arm, face) on that side. The entered word is never re-read, so a root or nerve keeps its match | **+2** | "L5 root + Babinski" keeps the L5 root first and stays two lesions; the second place becomes the leg area of the cortex instead of the hand knob | clean |
| B. A cortical foot-drop row | The leg area of the motor cortex predicts a foot drop | +2 | Capsular and cord foot drops stay unexplained. An isolated foot drop lists the cortex. The foot-drop worked example's Why line changes | 2 fail: the leg cortex's pin and the worked example's Why line |

A2 is a new relation in the families table, `pyramidal`, with the same shape as `generic`: it reads the place's word,
never the entered one (row 13).

### 3.3 HINTS-plus: AICA's inner ear

The labyrinthine artery is an AICA branch, and the model already uses it for AICA's deafness (`cochlear_pons`, signed
off 2026-09-26). An AICA infarct that reaches the inner ear also breaks the VOR, so the head impulse is abnormal, and
the nystagmus can look peripheral. That is why HINTS-plus asks about hearing. R1 #9 approved "labyrinth first, AICA
(lateral pons) in the top 3".

**The cost is real, and the model cannot avoid it.** A place explains a picture when it predicts every finding in it,
and the inner-ear rows cannot be made to depend on hearing loss being present. So every peripheral-HINTS picture lists
AICA as also fitting, **with or without hearing loss**:

> **Vestibular neuritis** (vertigo + peripheral nystagmus + abnormal head impulse) — today: *"Left labyrinth."* / *"Left
> vertigo + peripheral-type nystagmus → only the left inner ear."* After: *"Left labyrinth. 3 other places also fit:
> Left lateral pons, Left lateral pons (trigeminal), and 1 more."* / *"… → the left pons or inner ear."* What, Next,
> urgency and the red flag do not change.

| Option | Audit | What else changes |
|---|---|---|
| **A. Add both inner-ear rows to the lateral pons (recommended)** | **+1** | The neuritis cost above. In return, AICA with an abnormal head impulse stops reading "lateral pons + labyrinth — Vasculitis" and reads one lesion. One re-pin (row 18) |
| A′. The head impulse row only | 0 | The probe also enters peripheral nystagmus |
| B. Decline | 0 | R1 #9 keeps failing |

A later mechanism could remove the cost without touching this row: a recorded **normal hearing**, as an explicit
normal, would demote AICA in a neuritis picture, as a down-going plantar demotes today. It is not prototyped.

## 4. Rulings — round 1 (20 rows)

Each row is one decision, with my recommendation. "+n" is counted audit checks fixed, measured alone and confirmed
inside the full set (leave-one-out, §5).

### A. Roots, plexus and nerves

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 1 | The ulnar nerve at the elbow gives the claw too | **Yes.** The paradox is about degree: the claw is milder at the elbow because FDP 4/5 is weak too, but it is there. Dorsal-hand sensation and FDP/FCU weakness separate elbow from wrist, which is what the elbow's own red flag already says. Overturns the pin "ulnar_elbow has … NO claw" | **+2.** The claw alone, and the Guyon picture, now list the elbow and the medial cord as also fitting, and their Why line reads "plexus or peripheral nerve" instead of "only the peripheral nerve". The wrist still leads. In the sample (§5), 3 two-lesion claims become one place: median + ulnar at the wrist, twice, now read as the medial cord, and the ulnar nerve at the elbow + at the wrist as the elbow. |
| 2 | The C6 root gives the biceps jerk (C5/6) | **Yes** | **+1.** "Left C6 root. 1 other place also fits: upper trunk." What: cervical spondylosis (was obstetric Erb's). In the sample, no claim changes; 4 covers grow from two places to three. In two, the cord's C6–7 at-level reading now also carries the biceps jerk, so the cover picks it first. In the other two, a biceps jerk lost on one side makes the other side's a known normal, which now excludes that side's C6 root. |
| 3 | The L4 root gives the adductors (obturator, L2–4) | **Yes** | **+1.** "Left L4 root. 2 other places also fit: lumbar plexus, sacral plexus." The sacral plexus is listed because a trunk takes every row of its roots (observation O1, §7). In the sample, 1 claim is withheld: weak hip adduction recorded on one side now excludes the other side's sacral plexus. 4 covers change; one grows from two places to three. |
| 4 | The upper trunk carries the axillary nerve's sensory fibres (deltoid patch) | **Yes.** It reuses the axillary row (`axil_sens`), the idiom the brachial cords already use | **+1.** Erb's picture: "Left upper trunk of the brachial plexus." In the sample, 1 claim is withheld (axillary numbness recorded on one side now excludes the other side's upper trunk), and in 5 covers the upper trunk replaces the axillary nerve (O3). |
| 5 | …and the musculocutaneous nerve's (lateral forearm) | **Not in this round; take it with the plexus round (O1).** The anatomy is right, since the upper trunk carries the lateral cutaneous nerve of the forearm, but no audit check needs it, and today its main effect is through the trunk's borrowed root-pain rows | 0 on the audit; one card changes (a musculocutaneous neuropathy lists the upper trunk too). In the sample it turns 5 two-lesion claims into one upper-trunk lesion, the classic Erb combinations (axillary + musculocutaneous; suprascapular + musculocutaneous). But the upper trunk then replaces the musculocutaneous nerve in 19 more covers, so 13 fewer covers name the two places that made the picture |

### B. Motor neurone

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 6 | The anterior horn's bulbar motor neurones include the hypoglossal nuclei (tongue) | **Yes** | **+1.** Bulbar ALS: "Bilateral anterior horn cell … Motor neurone disease." **Bilateral tongue weakness alone** changes most: today "two hypoglossal canals — Neurosarcoidosis", URGENT skull-base plan; after "anterior horn — MND", routine MND clinic. An isolated one-sided XII palsy still leads with the hypoglossal canal. Three motor-unit pins re-pinned (row 18). In the sample, no claim changes; in 46 covers that pair an isolated XII palsy with an LMN picture elsewhere, the anterior horn replaces the hypoglossal canal (observation O3). |

### C. Skull base and vestibular

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 7 | The carotid space gives a XII palsy (XII crosses the internal carotid below the skull base, and is the commonest cranial nerve palsy in carotid dissection) | **Yes** | **+1.** "Left carotid space … Most likely Carotid artery dissection (must not miss)", EMERGENCY. Villaret is unchanged, as it already carried XII. **An isolated ptosis changes lead:** it was the carotid space, which tied with the orbital III superior division and won on alphabetical order; it is now the orbital III ("Orbital trauma or fracture", urgent). Dissection is second. In the sample, no claim changes; 5 covers change places (the carotid space instead of Villaret when the XII and the Horner come from separate pictures). |
| 8 | AICA's labyrinthine branch: an abnormal head impulse and peripheral nystagmus (§3.3) | **Yes, option A** | **+1.** The cost in §3.3. In the sample, 5 claims are no longer made, each readable as one lesion: AICA with the inner ear three times (lateral pons, cerebellar hemisphere or hemipons, each with the labyrinth), and twice a same-family near-fit at the lateral pons (face numbness with a labyrinth picture on the same side). But in 26 covers a pontine place replaces the labyrinth, and 17 of them change the suggested disease, mostly vasculitis → MS (O3). |

### D. Hemispheres, thalamus, vision — and the pyramidal foot drop

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 9 | Dominance is a prior: the fallback (§3.1) | **Yes, option B** | **+2.** Crossed aphasia and right neglect as in §3.1. In the sample, 14 two-lesion claims become one hemisphere with atypical dominance, all of them the crossed pattern (§3.1). No cover changes. |
| 10 | The PCA territory includes the fusiform gyrus (`DIVISION`), as `vascular.js` already says | **Yes** | **+1.** "Left PCA territory." Also: a left hemianopia + prosopagnosia goes from "two lesions — MS" to "right PCA territory", and each PCA site now wins its own picture (the occipital site used to). In the sample, 1 claim becomes one place (occipital + fusiform → PCA). |
| 11 | An acute PPRF lesion leaves the eyes deviated away from it, toward the hemiparesis ("wrong-way eyes") | **Yes.** One crossed row beside the PPRF | **+2.** "Right medial pons … Basilar perforator infarct." Gaze deviation alone now reads "the cerebral cortex or pons", the classic teaching point: the eyes look toward a frontal lesion and away from a pontine one. In the sample, 2 claims become one pontine lesion: eyes to the right + left LMN facial palsy → left medial pons (Foville), and eyes to the right + left Horner → left hemipons. 3 are withheld: pictures that push the eyes both ways (a frontal eye field and a PPRF on the same side). In 18 covers, a contralateral pontine place replaces a frontal eye field (O3). |
| 12 | The thalamogeniculate territory reaches the ventral lateral nucleus: contralateral hemiataxia | **Yes, with the hand-listed thalamic-aphasia composite kept in step** (the B11 / `thal_face` trap; without it the probe of same-side face + body pain loss breaks, and so do a vignette and an accuracy test) | **+2:** the thalamus probe, and the right striatocapsular ranking check from the multifocal spec §7. A pure sensory stroke still leads with the thalamus, now with one sign over-predicted. Ataxic hemiparesis now also lists the thalamocapsular places. The audit gains 48 swap checks (the new ataxia sites enter the cerebellar swap loop), and all pass. Three subcortex pins re-pinned, including an exception to "no subcortex structure overrides crossing" (row 18). In the sample, 3 claims become one place: hemianopia + hemiataxia on one side → the anterior choroidal territory (twice), and thalamic aphasia + contralateral ataxia → the thalamic aphasia place. 1 is withheld. 230 covers change places: 83 move to the two places that made the picture and 87 away from them (O3). |
| 13 | A pyramidal foot drop (§3.2) | **Yes, option A2** | **+2.** "Right leg area of the motor cortex. 15 other places also fit … Most likely ACA infarct." Foot drop + weak arm + face goes from "two lesions — Vasculitis" to one capsular lesion. In the sample, no claim changes; in 5 covers a corticospinal place now takes a foot drop from the other picture (the corona radiata instead of the cortical face-arm area). |

### E. Card and phonebook wording (not measured by the audit)

| # | Decision | Recommendation |
|---|---|---|
| 14 | The Where line under the dominance fallback | *"This assumes the left hemisphere is dominant, though right dominance is set (atypical dominance). If that is unlikely for this patient, no single place explains these findings."* The second sentence is true by construction, since the fallback runs only when nothing explains the picture with the dominance set. It also reads correctly for a single finding (right neglect alone), and for crossed aphasia in a right-hander, where the alternative is two lesions. The prototype's first wording, "… check handedness before calling this two lesions", did neither |
| 15 | The red flag and the Where card's phonebook follow the dominance | **Yes.** `answer.js` and `app.js` call `nameForSite(site)` without the dominance, so **today a right-dominant patient's card shows the left-dominant variant's red flag** (measured: a right MCA aphasia, right-dominant, shows "risk as for the dominant side; neglect masks the severity"). Under row 9 they follow the assumed dominance. |
| 16 | `gaze_deviation`'s description | Direction-neutral: *"Conjugate gaze deviation — record the side the eyes look toward (toward a frontal lesion, away from a pontine one)"*. Today it says "toward the lesion (away from the weak side)", which row 11 contradicts. The plain label ("eyes deviated to one side") is unchanged |
| 17 | Phonebook notes and red flags that the new rows make stale | Carotid space: note *"… with a XII palsy in some (the hypoglossal crosses the internal carotid)"*; red *"A painful Horner, alone or with a XII palsy, is a carotid dissection until proven otherwise — urgent vessel imaging (stroke risk)."* PCA: dominant and non-dominant variants. The note adds *"dominant: alexia without agraphia (with the splenium); non-dominant: prosopagnosia"*, and the dominant red flag becomes the fusiform's *"New pure alexia with a right hemianopia is a left PCA stroke until proven otherwise."* Ulnar at the elbow: note adds *"the claw is milder than at the wrist (FDP 4/5 is weak too — the paradox)"*. Thalamus: note adds *"a larger thalamogeniculate infarct reaching the ventral lateral nucleus adds contralateral hemiataxia"* |

### F. Tests, probes and the anatomy sheet

| # | Decision | Recommendation |
|---|---|---|
| 18 | Re-pins | **Approve these, and only these**, each the direct consequence of its row: `nerve-segments` "ulnar_elbow … NO claw" → "… and a claw" (row 1). `motor-unit`: the anterior horn's exact list + the tongue; "pure LMN → anterior horn" reads the displayed answer, since one more bilateral prediction takes the scored `best` below zero (the display is unchanged); the phonebook helper reads the displayed answer, as it crashes on a null `best` today (row 6). `cranial-nerves` "carotid_space → Horner" → Horner + XII (row 7). `engine` Marie-Foix: the scored `best` is now the lateral medulla (5.5 against 5.0), already the displayed answer (owner ruling 2026-09-26: lateral medulla COMMON), so it asserts that the lateral pons explains all four findings (row 8). `subcortex`: the thalamus's exact list + hemiataxia; "no crosses override" gains the one exception `thal_ataxia` (the cerebellar relay has crossed in the midbrain, as `scp_midbrain`); "the pure sensory lacune over-predicts nothing" → over-predicts only the hemiataxia (row 12) |
| 19 | New audit probes, in PR #18's suite (as the cord fix's row 13 and the multifocal fix's row 19) | **Add three.** Each fails today and passes under the recommended set: (a) AICA picture + abnormal head impulse → left lateral pons first, one lesion (today "lateral pons + labyrinth — Vasculitis"); (b) left hemianopia + prosopagnosia → right PCA, one lesion (today "two lesions — MS"); (c) foot drop + weak arm + facial weakness, one side → a contralateral corticospinal site first, one lesion (today "two lesions — Vasculitis"). I have not added them |
| 20 | Anatomy sheet (`docs/artifacts/anatomy-model.html`) | **Add the nine new rows** below, with each id checked against `structures.js`. The reuses (the upper trunk's sensory rows, the PCA's fusiform rows, the thalamic-aphasia copy) need no new row |

The nine new structures, one finding each:

| id | level · part | finding | side | note |
|---|---|---|---|---|
| `uln_el_claw` | nerve · ulnar_elbow | ulnar claw | ipsi | claw, usually milder than at the wrist because FDP 4/5 is weak too (the ulnar paradox) |
| `root_c6_biceps` | root · c6 | biceps jerk lost | ipsi | biceps jerk (C5/6) |
| `root_l4_hipadd` | root · l4 | weak hip adduction | ipsi | adductors (obturator, L2–4) |
| `ah_bulbar_tongue` | motor_unit · anterior_horn | tongue weakness | both | bulbar motor neurones (hypoglossal nuclei) — tongue weakness, wasting and fasciculation (LMN) |
| `car_cn12` | skull_base · carotid_space | tongue weakness | ipsi | the hypoglossal nerve where it crosses the internal carotid — the commonest cranial nerve palsy in carotid dissection |
| `lab_art_hit` | pons · lateral | abnormal head impulse | — | labyrinthine artery (an AICA branch) — inner-ear infarct: the head impulse is abnormal, as in a peripheral lesion (why HINTS-plus asks about hearing) |
| `lab_art_nyst` | pons · lateral | peripheral nystagmus | — | labyrinthine artery — inner-ear infarct: peripheral-type nystagmus |
| `pprf_deviation` | pons · medial | gaze deviation | **contra** (`crosses: true`) | PPRF / abducens nucleus, acute — the eyes rest deviated away from the lesion, toward the hemiparesis ("wrong-way eyes") |
| `thal_ataxia` | subcortex · thalamus | limb ataxia | **contra** (`crosses: true`) | ventral lateral nucleus beside VPL (thalamogeniculate territory) — the cerebellar relay, already crossed in the midbrain: contralateral hemiataxia |

## 5. Measured on the prototype

**The recommended set** is rows 1–4 and 6–13; row 5 is deferred, and rows 14–17 are wording. Measured on a copy of
`417385f`:

| | Today | Recommended set |
|---|---|---|
| Audit probes | 86 / 108 | **98 / 108** |
| Counted checks | 960 passed, 30 failed (990) | **1025 passed, 13 failed (1038)**. The 48 extra are new cerebellar swap checks (row 12), all passing |
| (a) synonym swaps | 223 / 224 | **272 / 272**; 0 multifocal |
| (b) background | 292 / 292 | 292 / 292 |
| (c) mirror | 270 / 270 | 270 / 270 |
| `npm test` | 7289 / 0 | 8 assertions + 1 helper fail in 5 suites, all row 18; every other assertion passes. The families table gains 3 table checks (row 13) |

Probes correct by region:

| Region | Today | Recommended set |
|---|---|---|
| Spinal cord | 19 / 20 | 19 / 20 (syrinx: composite-sites round) |
| Cauda and conus | 2 / 2 | 2 / 2 |
| Motor neurone and neuromuscular | 8 / 9 | **9 / 9** |
| Roots, plexus and nerves | 14 / 19 | **19 / 19** |
| Brainstem | 11 / 14 | 11 / 14 (composite-sites round) |
| Cranial nerves and skull base | 9 / 12 | **10 / 12** (bilateral VI ×2: raised-pressure round) |
| Vestibular and cerebellar | 7 / 8 | **8 / 8** |
| Hemispheres, thalamus and vision | 8 / 13 | **12 / 13** (parasagittal: composite-sites round) |
| Consciousness and raised pressure | 4 / 7 | 4 / 7 (both rounds) |
| Robustness and functional | 4 / 4 | 4 / 4 |

**What each row buys.** Leaving one row out of the full set at a time:

| Left out | Audit | Lost |
|---|---|---|
| 1 (ulnar claw) | 1023 / 15 | ulnar at the elbow (2) |
| 2 (C6 biceps jerk) | 1024 / 14 | C6 radiculopathy |
| 3 (L4 adductors) | 1024 / 14 | L4 (R1 #4) |
| 4 (upper trunk, axillary) | 1024 / 14 | Erb |
| 5 (upper trunk, musculocutaneous; deferred) | 1025 / 13 | nothing: adding it fixes no check |
| 6 (tongue) | 1024 / 14 | bulbar ALS (R1 #3) |
| 7 (carotid XII) | 1024 / 14 | Horner + XII |
| 8 (AICA inner ear) | 1024 / 14 | HINTS-plus (R1 #9) |
| 9 (dominance) | 1023 / 15 | dominance (2, R1 #10) |
| 10 (PCA fusiform) | 1024 / 14 | alexia without agraphia |
| 11 (wrong-way eyes) | 1023 / 15 | wrong-way eyes (2) |
| 12 (thalamic hemiataxia) | 975 / 15 | the thalamus probe, the striatocapsular swap, and the 48 new swap checks |
| 13 (foot drop) | 1023 / 15 | UMN foot drop (2, R1 #5) |

Measured with row 5 in the set, which changes nothing. The gains add up exactly: 2 + 1 + 1 + 1 + 1 + 1 + 1 + 2 + 1 + 2 +
2 + 2 = 17 checks fixed (the 16, plus the striatocapsular swap), and the 48 new swap checks pass. **The rows do not
interact on the audit.**

**Run time** (single runs, not controlled): audit 17.3 s → 16.1 s; suites 53.8 s → 60.3 s.

**The safety sample.** Every 7th pair (9,490) of the 66,430 pairs among the 365 site pictures, as in the
false-multifocal design; each pair's picture is both sites' full pictures. **Every variant is asked the baseline
pictures**, so a site that gains a sign is not asked a different question. Today 9,211 of the pairs get a two-lesion
claim. The pairs are synthetic, so the truth is known: the two places that made the picture.

| | Recommended set |
|---|---|
| Two-lesion claims no longer made | **35**: 13 one place, 15 atypical dominance (§3.1), 2 same-family near-fits, 5 withheld |
| New two-lesion claims | **0** |
| Covers that change places | 341. 10 grow from two places to three; 68 change the suggested disease, 49 of them to none, almost all the tongue row's (O3) |
| Covers naming exactly the two places that made the picture | 7,304 → 7,212 |
| The 365 baseline site pictures | **No first answer changes.** Each PCA site now wins its own new picture (the occipital site did), and the right striatocapsular composite enters its own top 3 |
| The 389 offered single findings | 2 first answers change: isolated ptosis, each side (row 7). The rest only gain places |

- **The 13 that become one place** all read as one lesion: AICA with the inner ear (3); a pontine gaze picture (3:
  Foville; eyes + Horner; eyes + inner ear); occipital + fusiform → the PCA (1); hemianopia or thalamic aphasia with
  contralateral hemiataxia → the anterior choroidal or thalamic places (3); median + ulnar → the medial cord (2,
  debatable: two wrist entrapments are the alternative); the ulnar nerve at the elbow + at the wrist → the elbow (1).
- **The 15 that assume atypical dominance** are all the crossed pattern: one hemisphere's limb, face, gaze or field
  signs with the other hemisphere's language or neglect signs. This is row 9's choice, and row 14's sentence names the
  two-lesion alternative on the card.
- **The 5 withheld** each pair a sign that a new row adds with the same sign recorded only on the other side, or push
  the eyes both ways (a frontal eye field and a PPRF on one side). The known-negative rule then excludes a place, the
  cover grows past three, and the card shows the best partial fit instead of a claim, as it does today for an
  inconsistent picture.
- **The covers move mostly through O3** (§7): the cover's tie-break prefers the larger of two places that cover the
  same finding. A cover that changes places keeps its claim and its count, except the 10 that grow to three.

## 6. The answer card, before and after

Captured from `answerFor`, with the engine's default answer selected, as the app does. Only the lines that change are
shown.

| Picture | Today | Recommended set |
|---|---|---|
| Bulbar ALS (R1 #3) | No single place explains every finding — likely Bilateral anterior horn cell, Left hemimedulla and Right hemimedulla. *No catalogued disease spans these places.* | Bilateral anterior horn cell. **Why:** Bilateral tongue weakness (hypoglossal palsy) → only the motor unit. *Most likely Motor neurone disease / ALS.* |
| Bilateral tongue weakness alone | … Left hypoglossal canal and Right hypoglossal canal. *Together: Neurosarcoidosis.* Next: URGENT ENT / skull base and oncology | Bilateral anterior horn cell. *Most likely Motor neurone disease / ALS.* Next: Neuromuscular / MND clinic (routine) |
| Ulnar at the elbow | … Left ulnar nerve at the wrist and Left ulnar nerve at the elbow. *Together: Mononeuritis multiplex.* | Left ulnar nerve at the elbow. 1 other place also fits: Left medial cord of the brachial plexus. *Most likely Cubital tunnel syndrome.* |
| Ulnar at Guyon (dorsal sensation not entered) | Left ulnar nerve at the wrist. **Why:** Left ulnar claw hand → only the left peripheral nerve. | Left ulnar nerve at the wrist. 2 other places also fit: Left ulnar nerve at the elbow, Left medial cord. **Why:** … → the left plexus or peripheral nerve; see Where for what separates them. |
| C6 radiculopathy | Left upper trunk of the brachial plexus. *Most likely Obstetric brachial plexus injury (Erb's palsy).* Next: URGENT plastic/peripheral nerve surgery | Left C6 root. 1 other place also fits: Left upper trunk. *Most likely Cervical spondylosis / foraminal stenosis (C5/6).* Next: Spinal surgery if progressive weakness or refractory pain |
| Erb (upper trunk) | … Left C5 root and Left posterior cord. *Together: Vasculitis.* | Left upper trunk of the brachial plexus. **Why:** Left badge-area numbness (axillary nerve) + left weak elbow flexion → only the left plexus. *Most likely Obstetric brachial plexus injury (Erb's palsy).* (O2, §7) |
| L4 (R1 #4) | Left lumbar plexus. *Most likely Diabetic lumbosacral radiculoplexus neuropathy.* Next: URGENT general/vascular surgery … | Left L4 root. 2 other places also fit: Left lumbar plexus, Left sacral plexus. *Most likely Lumbar spondylosis / foraminal stenosis (L3/4).* |
| UMN foot drop (R1 #5) | … Right hand knob and Left deep peroneal nerve. *Together: Vasculitis.* | Right leg area of the motor cortex. 15 other places also fit … **Why:** Left foot drop (weak ankle dorsiflexion) + left up-going plantar (Babinski sign) → anywhere from the cerebral cortex to the spinal cord. *Most likely ACA infarct.* Next: Hyperacute stroke pathway |
| Foot drop + weak arm + face | … Right face/arm area and Left deep peroneal nerve. *Together: Vasculitis.* | Right corona radiata. 8 other places also fit … *Most likely Small-vessel lacunar infarct.* |
| L5 root + Babinski, one side | … Left L5 root and Right hand knob. *Vasculitis.* | … Left L5 root and Right leg area of the motor cortex. *Vasculitis.* (Under option A the cortex would lead, with the stroke plan) |
| Horner + XII | Left Villaret. *Most likely Skull base or retroparotid metastasis.* Next: URGENT ENT / head and neck | Left carotid space. 2 other places also fit: Left Villaret, Left hemimedulla. *Most likely Carotid artery dissection (must not miss).* Next: URGENT stroke/vascular team (EMERGENCY) |
| Isolated ptosis | Left carotid space … *Carotid artery dissection.* EMERGENCY | Left III — superior division, orbit. 17 other places also fit: Left carotid space, … *Orbital trauma or fracture.* Urgent |
| HINTS-plus (R1 #9) | Left labyrinth. **Why:** Peripheral-type nystagmus + left vertigo → only the left inner ear. | Left labyrinth. 3 other places also fit: Left lateral pons, … **Why:** Left hearing loss + peripheral-type nystagmus → the left pons or inner ear. |
| AICA picture + abnormal head impulse | … Left lateral pons and Left labyrinth. *Together: Vasculitis.* | Left lateral pons. 1 other place also fits. *Most likely AICA territory infarct (must not miss).* |
| Left MCA, right-dominant set (R1 #10) | … Left anterior choroidal territory and Right both watershed language zones. *Together: Multiple sclerosis.* | Left MCA territory. *(row 14 sentence)* **Why:** Non-fluent speech + right half-field loss → only the left cerebral cortex. *Most likely Proximal MCA (M1) / carotid-T occlusion (must not miss).* |
| Crossed aphasia (R1 #11) | … Right face/arm area and Left anterior watershed zone. *Together: Multiple sclerosis.* | Right MCA superior division territory. 2 other places also fit … *(row 14 sentence)* *Most likely MCA superior division infarct (must not miss).* |
| Right neglect alone, left-dominant | No place at all ("re-check a side, or non-organic") | Left pulvinar. 3 other places also fit … *(row 14 sentence)* *Most likely Posterior thalamic (pulvinar) infarct.* |
| Alexia without agraphia + right hemianopia | … Left fusiform gyrus and Left optic radiation. *Together: Multiple sclerosis.* | Left PCA territory. **Why:** Can't read but can write (alexia without agraphia) → only the left cerebral cortex. *Most likely PCA infarct.* |
| Left hemianopia + prosopagnosia | … Right fusiform gyrus and Right optic radiation. *Together: MS.* | Right PCA territory. *Most likely PCA infarct.* |
| Wrong-way eyes | … Right corona radiata and Left frontal eye field. *Together: MS.* | Right medial pons. 1 other place also fits: Right hemipons. **Why:** Left eyes deviated to one side + left arm weakness → only the right pons. *Most likely Basilar perforator infarct.* |
| Thalamic hemisensory + hemiataxia | Left hemimidbrain. *Most likely Top-of-the-basilar occlusion.* Next: IMMEDIATE stroke team and neurointerventional referral | Left thalamus. 4 other places also fit … *Most likely Thalamic lacunar infarct (VPL). After a previous stroke here: Déjerine-Roussy (central post-stroke pain).* Next: Acute stroke team |
| **Unchanged by design:** pure sensory stroke; hemibody pain loss alone; foot drop alone; the foot-drop worked example (with and without weak hip abduction); the cortical hand; Horner alone; Collet-Sicard; Villaret; central AVS; an aphasia alone; left neglect + hemianopia; isolated hemianopia; Foville; sensorimotor stroke; Claude; pure LMN; ALS with UMN + LMN signs (still "MND") | | |

## 7. What this round does not fix, and what it found

**The other 13 failing checks** are the agreed rounds:
- **Composite sites, 9:** syrinx; basilar coma (2); locked-in (2); top of the basilar; bilateral PCA; parasagittal
  (R1 #12); bilateral INO.
- **Raised pressure and herniation, 4:** bilateral VI with and without papilloedema (2); uncal herniation (2).

**Observations for later, not rows of this round:**
- **O1. A trunk takes every row of its roots.** The sacral plexus carries L4's quadriceps, knee jerk and (under row 3)
  adductors, which are lumbar-plexus functions; the lumbar plexus carries L4's tibialis anterior and posterior, which
  are sciatic. That is why the sacral plexus is listed for the L4 picture. The fix would tag each root row with the
  plexus it travels in, which is a plexus round of its own.
- **O2. The upper trunk's What line leads with "Obstetric brachial plexus injury (Erb's palsy)" at any age**, so an
  adult's Erb picture reads as a birth injury. It is a cause-ranking question for a content round.
- **O3. The cover's tie-break prefers the larger place.** When two places cover the same remaining finding, the cover
  picks the one that predicts more of the whole picture. Every row that gives a place a new sign therefore moves some
  covers to that place. In the sample:
  - the anterior horn replaces the hypoglossal canal in 46 covers (an XII palsy with LMN signs elsewhere), and their
    disease suggestion (neurosarcoidosis or vasculitis) drops to none (row 6);
  - a pontine place replaces the labyrinth in 26, 17 of them moving from vasculitis to MS (row 8);
  - a contralateral pontine place replaces a frontal eye field in 18 (row 11);
  - the upper trunk replaces the axillary nerve in 5 (row 4), and would replace the musculocutaneous nerve in 19 more
    (row 5);
  - the thalamic rows move 230 covers, 83 toward the two places that made the picture and 87 away (row 12).
  The claim and its number of places do not change, except 10 covers that grow to three. Changing the tie-break is its
  own decision, outside this round.
- **O4. "Left eyes deviated to one side"** is how the side word and the plain label combine today. "Eyes deviated to
  the left" would read better; it is a plain-labels question.
- **O5.** A recorded **normal hearing** would end the HINTS-plus cost (§3.3).

## 8. How it would be built (the plan follows the ruling)

- `src/model/structures.js`: the nine rows of §4 (row 20).
- `src/model/sites.js`:
  - `composePlexusSites` gains an optional `nerves` list per group (the upper trunk: `axil_sens`; `mcut_sens` waits
    for the plexus round, row 5);
  - `DIVISION` gains `fusiform: { territory: "PCA" }`;
  - the thalamic-aphasia composite gains `thal_ataxia`.
- `src/model/families.js`: the `leg_foot` family, relation `pyramidal` (head `weak_leg`, member
  `weak_ankle_dorsiflexion`, inside the UMN release signs + arm and facial weakness), citing R1 #5.
- `src/engine/families.js`: `predictedToken` and `indexTokens` read a place's `weak_leg` as the entered foot drop in
  that context. The entered word is never rewritten.
- `src/engine/inverse.js` `solveOne`: the dominance fallback, before the same-family near-fit; the result carries
  `dominance: { assumed, set }`.
- `app/answer.js`: the place, the Why line and the red flag read with the assumed dominance; the row-14 sentence.
  `app/app.js`: the Where card's `nameForSite` passes the dominance (row 15).
- `src/model/findings.js`: `gaze_deviation`'s description (row 16). `src/engine/score.js`: the `LOCALISING` comment
  for the ulnar claw (it now pins the ulnar nerve, not a segment).
- `src/data/syndromes.js`: the row-17 wording.
- `docs/artifacts/anatomy-model.html`: the nine rows.
- Tests: the row-18 re-pins; a new suite pinning rows 1–17 and the guards (the "unchanged by design" row of §6);
  the row-19 probes in PR #18's suite.
- CLAUDE.md: the dominance prior (§3.1), the `pyramidal` family relation, and the traps (the thalamic-aphasia copy;
  the subcortex crossing exception).
