# Pressure follows the cause — papilloedema steers the What line, the plan and the badge (design, 2026-11-09)

**Status: DESIGN — round 1, awaiting the owner's ruling. No engine code.**
- Branch `fix/pressure-follows-cause` (worktree `Code/neurolocaliser-pressure-cause/`), cut from `fix/raised-pressure` at
  `e31d5c9`. That branch is the implemented raised-pressure round, stacked on the content-gap fix, the false-multifocal fix,
  the cord fix and PR #18 (none to be merged). Not pushed; no PR.
- Every number below was measured by applying candidate changes to throwaway copies of `e31d5c9`, outside the repo. Nothing
  was committed except this document.

This is observation O1 of the raised-pressure round (spec 2026-11-05 §7): **papilloedema narrows the places but not their
causes.** The raised-pressure axis keeps only the places inside the skull, and the VI's own course. But the What line, the
Next plan and the badge still follow each place's usual cause, which is most often an infarct that cannot raise the pressure.

**The audit cannot see this.** It counts places and claims, never causes, and reads 1050 passed / 9 failed on `e31d5c9`
under every option measured here. So this design is measured on the real answer card instead:
- **The card sample.** The answer card (`answerFor`) for every frozen site picture (365) and every offered single finding
  (388), each with papilloedema added, at each of the five onsets (none, hyperacute, acute, subacute, chronic). That gives
  436 papilloedema cards per onset (the rest are pressure-only or two-place cards). The same 753 pictures without
  papilloedema are the guard.
- **The pairs sample.** Every 49th pair of site pictures, with papilloedema: 1,226 cards, 1,179 of them two-place.
- **The captured cards.** The 46 pictures captured for this round, and the 41 approved in the raised-pressure round.
- **`npm test`**, and the audit with four proposed probes of a new kind (row 20).

**Headline (measured).**
- **Today.** With papilloedema and no onset, the What line leads with a cause that cannot raise the intracranial pressure on
  **316 of 434** cards: a vascular cause, nearly always an infarct, on 245; a degenerative disease on 24; a demyelinating
  plaque on 20. The Next line and the badge follow that cause's plan. 202 of the 316 badge emergency, most of them a
  hyperacute stroke pathway; 11 badge routine.
- **The recommended set.** It demotes those causes, as an onset already demotes a cause whose tempo misses ("demote, never
  drop"). The plan then follows the cause that is left, as the onset rule already does. With no onset, 385 cards change:
  - on 292 the plan follows a cause that can raise the pressure;
  - on 24 no cause at the place can, so the card follows the pressure itself, with the raised-pressure round's approved
    lines.
  The What and Next lines name the same cause on every card with no onset, and no card badges routine.
- **Without papilloedema nothing changes:** 0 of 3,765 guard cards differ. The hyperacute escalation is untouched: no
  hyperacute card loses its emergency badge.
- **The IV joins the pressure's reach.** The raised-pressure round deferred it. Its card now leads with *"Tumour or raised
  intracranial pressure"*, not with the trochlear nucleus's demyelination.
- **The tests.** `npm test` goes 7413 / 0 → 7410 / 3; the three are the IV row's re-pins. The audit's existing checks do not
  move. With row 20's four probes, the audit reads 1058 / 14 today → 1063 / 9.
- **The cost, for your ruling (rows 11–13).** With no onset, 59 cards leave emergency: a stroke plan becomes a tumour's urgent
  plan. 40 cards rise to emergency, and 21 rise from routine to urgent.

---

## 1. What is wrong

The real answer card on `e31d5c9`, under the red raised-pressure banner:

| Picture | Where line | What and Next today |
|---|---|---|
| Papilloedema + right hemiparesis | Left corona radiata | *Most likely Small-vessel lacunar infarct. Must not miss: Hypoglycaemia.* Next: Acute stroke team — hyperacute pathway [emergency] |
| Coma + papilloedema | Bilateral diffuse cerebral involvement | *Most likely Metabolic or toxic encephalopathy. Must not miss: Sepsis or systemic infection.* Next: Acute medicine [emergency]. Red: *"metabolic / diffuse until proven otherwise"* |
| Papilloedema + right hemianopia | Left primary visual cortex | *Most likely PCA infarct.* Next: Hyperacute stroke pathway — posterior-circulation stroke [emergency] |
| Papilloedema + left IV palsy | Right trochlear nucleus (the IV nerve is filtered out) | *Most likely Demyelination.* Next: Neurology and ophthalmology [urgent]. Red: *"A CONTRALATERAL (crossed) superior oblique palsy localises into the dorsal midbrain"* |
| Papilloedema + truncal ataxia | Midline cerebellar vermis | *Most likely Alcohol-related cerebellar degeneration. Must not miss: Medulloblastoma.* |
| Papilloedema + left leg weakness | Right leg area of the motor cortex | *Most likely ACA infarct.* Next: Hyperacute stroke pathway [emergency] |
| Papilloedema + a fixed dilated left pupil, awake | Left ciliary ganglion | *Most likely Holmes-Adie (tonic) pupil.* Next: outpatient — reassurance [routine]. Red: *"Benign"* |
| Papilloedema + right hemiparesis, chronic onset | Left corona radiata | *Most likely Cerebral small-vessel disease. Could represent an old stroke.* Next: a memory service [routine] |

The audit's own probe for the first picture is labelled *"papilloedema + right hemiparesis → left hemisphere mass"*
(owner-approved, round 1). Its check is a left-hemisphere site and one lesion. That check passes, while the card names a
lacune.

## 2. Why it happens

1. **The causes never hear the pressure.** `raisedPressureAxis` narrows the compartment, but `causesFor(site, { onset })`
   takes only the onset. Each place's list is written for that place's usual presentation, so the commonest lesion there
   leads: a lacune at the corona radiata, an infarct in a cortical territory. Of the 183 places papilloedema keeps in play,
   126 lead with a vascular cause.
2. **The plan and the badge follow the site**, or at a slow onset the onset rule, and the site's plan is written for that
   leading cause.
3. **Nothing in the content says which causes can raise the pressure.** The 98 cause lists at the in-play places hold 641
   rows (435 names), out of 1,304 rows in all:

| Existing signal | Rows it marks | Why it cannot be the attribute |
|---|---|---|
| `RAISES_PRESSURE` (`nextSteps.js`, over the name, feature and pathognomonic sign) | 24 | It was written to trigger the fundal-photography prompt at a site. It misses every tumour, abscess and haemorrhage whose text does not mention the discs. Used as the attribute, 351 of 436 cards would name no cause at all |
| The cause's own plan names the pressure (papilloedema, herniation, hydrocephalus, mass effect) | 202 | It takes in the dementias and two mimics, because their plans say "image for hydrocephalus or a mass". It misses intracerebral haemorrhage at 12 places and HSV encephalitis at 8 |
| The category (neoplastic, infective and traumatic can) | 192 | The categories split inside: haemorrhage vs infarct, sarcoid vs MS, PRES vs Wernicke's, obstructive hydrocephalus vs a hereditary ataxia, a brain injury vs a nerve injury. Used alone, intracerebral haemorrhage leaves the must-not-miss slot on 46 cards, and 174 cards leave emergency |

So the attribute is new content. The decision is how to hold it so that you review it once.

## 3. The decisions that are more than content

### 3.1 How papilloedema acts on the causes

| Option | What it does | Measured |
|---|---|---|
| **A. Demote (recommended)** | A cause that cannot raise the pressure moves to the demoted list, exactly as a cause whose tempo misses the onset does today (`demotion.axis: "pressure"`). It stays listed and selectable | §5 |
| B. Re-rank | Pressure-capable causes first, the rest still in the running | Not prototyped. Where nothing at the place can raise the pressure, the What line still names the lacune, which is the defect |
| C. Drop | Remove them | Contradicts the 2026-08-14 ruling: tempo demotes, it never drops |

**The What line alone is not enough.** Demoting the causes without touching the plan leaves the What and Next lines naming
different causes on **352 of 436 cards** — *"Most likely Hypertensive deep haemorrhage"* above *"Acute stroke team —
hyperacute pathway"*. So rows 9–12 make the plan and the badge follow, as the onset rule does.

### 3.2 Which causes can raise the pressure (the attribute)

**The principle (row 3).** A cause can raise the pressure when the process itself can raise the intracranial pressure enough
to swell the discs:
- a mass (tumour, abscess, haematoma), or bleeding;
- obstruction of the venous outflow or of the CSF (venous sinus thrombosis, hydrocephalus);
- meningitis or encephalitis;
- a swelling brain (trauma, a space-occupying infarct, a cerebellar infarct).

A lacune cannot, nor can an arterial infarct that is not space-occupying, a demyelinating plaque, a degeneration, a toxic or
metabolic encephalopathy, a microvascular palsy or a mimic.

**How it is held.** Each option was measured with the same mechanics (rows 1, 9–12) and no retina exemption, over the card
sample with no onset:

| Option | Content to review | Cards changed | No cause named (the pressure leads) | Leave emergency | What else |
|---|---|---|---|---|---|
| R. The `RAISES_PRESSURE` regex | none | 429 | **351** | 0 | Names no cause on 80% of cards |
| P. The plan text | none | 413 | 40 | **169** | Dementias lead; haemorrhages and HSV encephalitis are demoted |
| C. The category alone | 10 defaults | 417 | 32 | **174** | Intracerebral haemorrhage leaves the must-not-miss on 46 cards; obstructive hydrocephalus is demoted |
| N. Narrow: only lacunar and small-vessel infarcts, microvascular palsies and metabolic or toxic encephalopathy cannot | 1 pattern | **70** | 0 | 0 | The territorial infarcts stay, so papilloedema + hemianopia still reads a PCA infarct and the hyperacute pathway. Hypoglycaemia leads where the lacune is demoted, sepsis where the encephalopathy is |
| N2. N, plus every mimic and degenerative cause | 1 pattern | 97 | 0 | 0 | The same, without the mimics |
| E. Category default + named exceptions, with any large-MCA or carotid-T infarct able | 10 defaults + ~100 names | 397 | 36 | 86 | *"Proximal MCA (M1) / carotid-T occlusion — assess for thrombolysis"* stays for papilloedema + a hemisphere syndrome; the Wallenberg picture goes to a lateral medullary tumour (urgent) |
| **Ep. E, strict about infarcts: only a named space-occupying infarct, and the posterior-fossa infarcts that take the cerebellum (recommended)** | 10 defaults + ~100 names (Appendix A) | 397 | 36 | 59 | Every O1 card fixed (§6). The Wallenberg picture keeps its stroke plan |
| A. A field on every cause row | 641 rows | — | — | — | Not prototyped: the same classification as Ep, scattered across a 3,276-line file and 98 lists |

**Why Ep, held as a table.**
- It reads as one clinical claim: the principle, ten defaults and the named exceptions, in one place (`causes.js`).
  Appendix A lists every in-play name under it.
- A future cause gets the category's default, never silence.
- A test pins the classification of every in-play cause (row 21). A new cause at an in-play place, or a renamed one, fails
  the suite until someone looks at it.

### 3.3 When no cause at the place can raise the pressure

On 24 cards with no onset, every cause at the place is demoted. At hyperacute onset it is 142 cards, because few of the
causes that can raise the pressure are tagged hyperacute: at the ischaemic III, the medial medulla, the VI and the IV, nothing
fits both.

| Option | What the card says | Measured |
|---|---|---|
| a. The What line says so; the site plan stands | *"No cause here typically raises the intracranial pressure — 6 set aside"*, above the site's plan | The What and Next lines disagree on 36 cards (with no retina exemption); the ciliary ganglion keeps *"reassurance, routine"* |
| **b. The card follows the pressure itself (recommended)** | The raised-pressure round's approved pressure-only lines. What: *"Find what is raising the pressure: a mass, hydrocephalus or cerebral venous sinus thrombosis — idiopathic intracranial hypertension only once those are excluded."* Next: *"Image the head, with venography, before any lumbar puncture; neurosurgery if there is a mass or hydrocephalus."* The badge is the more urgent of urgent and the site's own. The red line is the banner's | Coma + papilloedema, the Adie pupil, parkinsonism, a dystonia, the pancerebellar degeneration and the mixed transcortical aphasia (24 cards) |
| c. Author a "raised intracranial pressure" cause at each such place | New content at about ten places | Not prototyped. Option b says the same thing in approved words |

**The red line (part of row 10).** The site's red flag was written for its own causes, and all of them are set aside.
Coma's says *"metabolic / diffuse until proven otherwise"*; the ciliary ganglion's says *"Benign"*. So the red line is the
banner's, as on the pressure-only card (raised-pressure round, row 10).

### 3.4 The plan, and the badge

- **The plan follows the cause the What line names (row 9).** `pressureFollows` is `onsetFollows`'s mirror, and the tier
  split is unchanged: immediate and first-line steps stay the site's. It fires in two cases:
  - the pressure sets the site's usual cause aside, at any in-play place;
  - or the approved onset rule fires.
  It never fires anywhere else. So papilloedema does not widen the onset rule to the non-stroke places that the 2026-09-29
  design left for its own decision. Measured: letting it follow whenever either axis set the cause aside followed
  *"Obstructive hydrocephalus / shunt failure"* at the pretectum at acute onset, purely because of the onset.
- **The badge follows the followed cause's plan**, resolved as a selection of it would be (the must-not-miss floor
  included). Three further rows:
  - row 11 adds a floor: with papilloedema the badge is never routine;
  - row 12 asks whether, with no onset, the badge may fall below the site's own;
  - row 13 keeps the hyperacute escalation reading the onset only. Letting it read the pressure took 19 hyperacute cards
    from emergency to urgent.

### 3.5 The IV

The raised-pressure round kept the IV's cisternal course out of `PRESSURE_REACHES`. Kept under papilloedema, its card led
with *"Head trauma"* and badged routine, because its plan was not written for the pressure (spec 2026-11-05, row 2, O8).
Under this design that card changes:

| | Today (the IV filtered) | Row 15 without this design | Row 15 with this design |
|---|---|---|---|
| Where | Right trochlear nucleus, midbrain | Left IV — cisternal segment | **Left IV — cisternal segment.** 1 other place also fits: Right trochlear nucleus |
| What | *Most likely Demyelination. Must not miss: Tumour (pineal or tectal).* | *Most likely Head trauma. Must not miss: Tumour or raised intracranial pressure.* | ***Most likely Tumour or raised intracranial pressure (must not miss).** Must not miss: Basal meningitis.* |
| Next | Neurology and ophthalmology [urgent] | Ophthalmology/orthoptics; neurology if progressive [routine] | **Neurosurgery and acute neurology; ophthalmology where vision is threatened [emergency]** |

The IV's own signed-off cause row already says *"a fourth-nerve palsy with papilloedema is a pressure problem rather than a
trochlear one"*. Without row 15, the What line is still fixed: the trochlear nucleus leads with *"Tumour (pineal or
tectal)"* [emergency]. But the place stays the contralateral nucleus, with its "crossed palsy" red flag, for a palsy that
could equally be the nerve.

## 4. Rulings — round 1 (21 rows)

Each row is one decision, with my recommendation. Measured effects are over the card sample (436 papilloedema cards per
onset) unless stated.

### A. What papilloedema does to the causes

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 1 | Papilloedema demotes the causes that cannot raise the intracranial pressure (§3.1) | **Yes — demote, never drop.** A second demotion axis in `causesFor(site, { onset, pressure })`, beside the tempo. It applies only at the places papilloedema keeps in play (the compartment filter's own test), so a place reached only through the cover keeps its order. A cause demoted by both axes carries both reasons | With rows 9–11: 385 of 436 cards change with no onset. Today 316 lead with a cause that cannot raise the pressure; after, none does. With no papilloedema, 0 of 3,765 cards change |
| 2 | How the attribute is held (§3.2) | **A category default with named exceptions, in one table in `causes.js`** (`CAN_RAISE_PRESSURE`), checked by a test that pins every in-play cause's class. Not the regex, the plan text, the category alone, a narrow list, or a field on 641 rows | §3.2's table |
| 3 | The principle and the category defaults | **Yes, as §3.2 states it.** Neoplastic, infective and traumatic causes can. Vascular, inflammatory, metabolic, congenital, degenerative and iatrogenic causes cannot, nor can a mimic, unless named in row 4 | 264 of the 641 in-play rows can, 377 cannot |
| 4 | The named exceptions (Appendix A, about 100 names) | **Approve the list in Appendix A**, or strike the names you disagree with. In short, these CAN: haemorrhages, venous thromboses, aneurysms and subarachnoid blood, AVMs and dural fistulae, pituitary apoplexy, ADEM, neurosarcoidosis, neuro-Behçet's, PRES, obstructive hydrocephalus, Dandy-Walker, Chiari I, craniopharyngioma. These CANNOT: a small pontine haemorrhage; paraneoplastic syndromes; perineural spread; orbital, sinonasal, nasopharyngeal and skull-base corridor tumours (the raised-pressure round's own reason for filtering the corridors); a stalk metastasis; sepsis; post-viral anosmia; zoster; neurosyphilis; Whipple's; MERS; and an injury to a nerve, a vessel, the orbit, the craniocervical junction or the suprachiasmatic nucleus. **Judgement calls worth a second look:** Wernicke's (cannot; disc swelling is described but uncommon); Chiari I (can); PRES (can); petrous apicitis (can: otitic hydrocephalus); cavernous sinus thrombosis (can); a "small" metastasis (can, as a tumour grows and swells) against a small pontine haemorrhage (cannot); pituitary macroadenoma and Langerhans cell histiocytosis (can, by the default); autoimmune encephalitis and CNS vasculitis (cannot); radiation necrosis (cannot); basilar invagination (cannot as a congenital cause, can as the "craniocervical junction compression" tumour row) | Appendix A lists every name; §6 and Appendix B show what they change on the card |
| 5 | Infarcts: which can | **Only a named space-occupying infarct (malignant MCA infarction), and the posterior-fossa infarcts that take the cerebellum (PICA, SCA, named cerebellar infarcts), which swell and block the fourth ventricle (Ep).** A "large MCA territory" or carotid-T occlusion cannot until named as swelling; AICA cannot (its cerebellar territory rarely swells) | Ep against E: papilloedema + neglect + left hemiparesis reads *"Large intracerebral haemorrhage. Must not miss: Malignant MCA infarction"*, not *"carotid-T occlusion — assess for thrombolysis"*. Ep against no posterior-fossa rule: 27 Wallenberg cards keep the PICA infarct and its stroke plan, instead of a lateral medullary tumour [urgent] |
| 6 | Hypoxic-ischaemic injury and global hypoperfusion | **Cannot.** Diffuse swelling after an arrest is a consequence of a known event; papilloedema is not how it presents | Coma + papilloedema follows the pressure (row 10), not *"Hypoxic-ischaemic brain injury"* |
| 7 | The retina is exempt | **Yes.** A swollen disc beside a retinal stroke is the eye's own disease until shown otherwise, and giant cell arteritis must keep the lead | 12 cards keep *"Most likely Giant cell arteritis"* and their emergency ophthalmology plan, under the banner. Without the exemption they follow the pressure |
| 8 | A must-not-miss that cannot raise the pressure leaves the What line's must-not-miss slot, as at a slow onset | **Yes.** It stays listed (demoted) and selectable, and the site's immediate steps keep its bedside check: the corona radiata's first step is still *"Bedside glucose and blood pressure"* | With no onset, these leave the slot: vertebral artery dissection (27 cards), giant cell arteritis at the ischaemic III (16), vertebral dissection (11), vertebrobasilar TIA (11), hypoglycaemia (9), manganese or CO toxicity (9), limbic encephalitis (8), skull-base tumour or nasopharyngeal carcinoma at the VI (8), and 21 more names on 1–6 cards each. Each place's new must-not-miss is one that can raise the pressure, such as meningitis at the VI |

### B. The plan and the badge

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 9 | The plan follows the cause the What line names (§3.4) | **Yes**, when the pressure sets the site's usual cause aside, or when the approved onset rule fires; never elsewhere. Confirmatory, monitoring, referral and urgency become the followed cause's; immediate and first-line stay the site's. No clinical text is written | Plans followed: 292 cards with no onset, 207 hyperacute, 244 acute, 289 subacute, 304 chronic. The What and Next lines name the same cause on every card with no onset or at subacute onset. 16 cards at slow onsets still differ, at 2 place kinds: the paracentral lobule at hyperacute and acute onset, and the temporal lobe at chronic onset. Those disagree today, without papilloedema, at the same onsets. They are the onset rule's own deferred non-stroke scope, not this rule's |
| 10 | When no cause at the place can raise the pressure (§3.3) | **The card follows the pressure itself:** the pressure-only card's approved What and Next lines; the badge is the more urgent of urgent and the site's own; the red line is the banner's | 24 cards with no onset, 142 hyperacute, 82 acute, 86 subacute, 83 chronic. Coma + papilloedema: *"Find what is raising the pressure …"* [emergency]. The Adie pupil: the same [urgent], was *"reassurance"* [routine] |
| 11 | The urgency floor: with papilloedema the badge is never routine | **Yes.** It mirrors the pressure-only card's badge (*"papilloedema with a normal conscious level is a same-day problem"*), and the red floor (*"a must-not-miss never renders as routine"*) | With no onset, 21 cards rise from routine. Without the floor, 28 cards badge routine under the red banner, among them the parasagittal meningioma, the low-grade glioma and the cavernoma, whose authored plans are routine |
| 12 | With no onset, may the badge fall below the site's own? | **Yes — it follows the cause.** This is the 2026-08-21 ruling (*"badge follows selection, safety in the tier split"*) and the 2026-09-29 one (urgency resolved as a selection would be). Papilloedema itself means the process has run for long enough to swell the discs | 59 cards leave emergency with no onset: a cortical or medullary infarct's stroke plan becomes a tumour's urgent plan, and the stroke team's immediate steps stay on screen. 40 rise to emergency (an abscess, a haemorrhage, a compressive III, the IV). Alternative measured: with no onset the badge never falls below the site's own, so the 59 keep emergency beside a tumour's referral |
| 13 | The hyperacute escalation is untouched | **Yes.** It reads the onset, not the pressure | No hyperacute card loses emergency. Letting the escalation read the pressure took 19 away |
| 14 | With papilloedema, the chronic What line drops *"Could represent an old stroke."* | **Yes.** An old stroke cannot raise the pressure, and the line now names a cause that can | 272 chronic cards lose the clause, e.g. papilloedema + a chronic hemianopia: *"Most likely Glioma / metastasis. Must not miss: Dural arteriovenous fistula."* |

### C. The IV

| # | Decision | Recommendation | Measured effect |
|---|---|---|---|
| 15 | The IV's cisternal course joins `PRESSURE_REACHES` (§3.5) | **Yes.** The raised-pressure round deferred it until its card could follow the pressure, and it now does. The cross-check test then reads: the set is exactly the three parts outside the skull whose own causes name raised pressure, with no exception | 3 re-pins (row 19). IV + papilloedema: the IV nerve first, *"Tumour or raised intracranial pressure"* [emergency]. **Cost:** a IV palsy with papilloedema badges emergency (the herniation family's plan), while a VI palsy with papilloedema badges urgent, because the pressure keeps the VI's own lead and its site plan stands (O8) |

### D. Wording (not measured by the audit)

| # | Decision | Recommendation |
|---|---|---|
| 16 | The What card's band for the demoted causes | Title *"less likely with papilloedema"*, beside the tempo band's *"less likely given X onset"*. Note: *"Papilloedema means the intracranial pressure is raised. These causes do not raise it: they can explain the deficit, but not the papilloedema."* Each cause carries *"does not raise the pressure"*; a cause demoted by both axes carries both |
| 17 | The Next card's note when the plan follows | Pressure: *"Following the most likely cause, {cause}. Papilloedema sets aside {set-aside}, which cannot raise the intracranial pressure and is what this site's usual plan is written for."* Onset and pressure: *"Following the most likely cause, {cause}. A {onset} onset and papilloedema set aside {set-aside}, which this site's usual plan is written for."* The approved onset sentence stays where only the onset sets the cause aside |
| 18 | The Next card's note when the pressure leads | *"No cause usually found here raises the intracranial pressure, so the plan follows the papilloedema itself."* The tiers stay the site's; the referral is the pressure-only card's Next line |

### E. Tests, probes and the anatomy sheet

| # | Decision | Recommendation |
|---|---|---|
| 19 | Re-pins | **Approve these three, and only these** (all row 15), in `raised-pressure.test.js`: *"row 2: PRESSURE_REACHES is the VI's cisternal course and the VI at the petrous apex"* → the three parts; *"every other part that names it is the deferred IV"* → no other part names it; *"row 2 guard: a IV palsy + papilloedema still leads with the contralateral trochlear nucleus"* → leads with the IV nerve |
| 20 | Four audit probes of a new kind, in PR #18's suite | **Add them**, with a `lead` check: the answer card's leading cause, read from its "Most likely" clause only. This is a yardstick change, so it needs your word. (a) papilloedema + right hemiparesis → leads with a cause that can raise the pressure, not a lacune; (b) coma + papilloedema → leads with the pressure, not a metabolic encephalopathy; (c) papilloedema + right hemianopia → does not lead with an infarct; (d) IV palsy + papilloedema → the IV nerve first, led by the pressure or a tumour. Each fails today and passes under the set. I have not added them |
| 21 | A new suite, and the anatomy sheet | `test/pressure-follows.test.js` pins rows 1–18. It holds the guard (no papilloedema → byte-identical), the classification snapshot of every in-play cause, the follow conditions, the floor, the untouched escalation, the retina, the IV and §6's cards, plus a ratchet on the measured counts. **No anatomy-sheet rows:** no structure is added |

## 5. Measured on the prototype

**The recommended set** is rows 1–15 (rows 16–18 are wording), on a copy of `e31d5c9`:

| | Today | Recommended set |
|---|---|---|
| Audit, counted checks | 1050 passed, 9 failed | 1050 / 9 — no existing check moves |
| Audit with row 20's four probes | 1058 / 14 (probes 108 / 119) | **1063 / 9 (probes 112 / 119)**; without row 15, 1062 / 10 (the IV probe's place check) |
| Synonym swaps · background · mirror | 272 · 292 · 277 | 272 · 292 · 281 (the four new probes mirror cleanly) |
| `npm test` | 87 suites, 7413 / 0 | 7410 / 3: row 19's three re-pins. Without row 15, 7413 / 0 |
| Run time (single runs) | audit 10.9 s, suites 38.4 s | 10.4 s, 38.2 s |

**The card sample** (436 papilloedema cards per onset; the guard is the same pictures without papilloedema):

| Onset | Today: What leads with a cause that cannot raise the pressure | Cards changed | Plan follows | The pressure leads | Leave emergency | Rise to emergency | Routine → urgent |
|---|---|---|---|---|---|---|---|
| none | 316 | 385 | 292 | 24 | 59 | 40 | 21 |
| hyperacute | 303 | 385 | 207 | 142 | **0** | 2 | 21 |
| acute | 298 | 377 | 244 | 82 | 4 | 55 | 21 |
| subacute | 260 | 307 | 289 | 86 | 15 | 95 | 18 |
| chronic | 130 | 406 | 304 | 83 | 4 | 19 | 76 |
| guard (no papilloedema) | — | **0 of 3,765** | — | — | — | — | — |

No card badges routine after, at any onset. At subacute onset, most of the 95 that rise to emergency are demyelination
(urgent) giving way to one of three things:
- the pressure itself, at a place whose own plan is an emergency (39);
- a brainstem or cerebellar abscess (26);
- at the ischaemic III, a compressive lesion in place of giant cell arteritis (16).

**What each mechanism row buys** (on the E classifier, with no onset):

| Set | Cards whose What and Next lines name different causes | Badged routine | What it shows |
|---|---|---|---|
| Row 1 only (the What line) | **352** | 21 | The card disagrees with itself |
| + row 9 (the plan follows) | 36 | 34 | The 36 are *"No cause here typically raises …"* above a site plan; 18 of the 34 routine cards are emergency today |
| + row 10 (the pressure leads) | 0 | 28 | |
| + row 11 (the floor) — the recommended mechanics | 0 | **0** | |
| + the escalation reading the pressure (not recommended, row 13) | 0 | 0 | 19 hyperacute cards leave emergency |

**The pairs sample** (1,179 two-place cards with papilloedema). The Together card's Next union follows automatically, as it
does for the onset, because it unions each place's plan. Its Next line changes on 816 cards and its badge on 214: 129 leave
emergency, 54 rise to it, 31 rise from routine. Its disease does not change on any of them (O2).

**The captured cards.**
- This round's 46: 34 change, all with papilloedema. The 12 unchanged include every picture without papilloedema.
- The raised-pressure round's 41 approved cards: 14 change, all with papilloedema. The 27 unchanged include every card
  without papilloedema and every uncal-herniation card.

## 6. The answer card, before and after

Captured from `answerFor`, with the engine's default place selected, as the app does. Only the lines that change are shown.

| Picture | Today | Recommended set |
|---|---|---|
| Papilloedema + right hemiparesis | Lacunar infarct. Acute stroke team — hyperacute pathway [emergency] | ***Most likely Hypertensive deep haemorrhage (must not miss). Must not miss: Diffuse axonal injury.*** Next: Acute stroke pathway with neurosurgery; critical care if conscious level is falling [emergency] |
| … at subacute onset | Demyelinating plaque. Neurology / MS service [urgent] | ***Most likely Small metastasis / glioma.*** Neuro-oncology with neurosurgery [urgent] |
| … at chronic onset | Small-vessel disease. *Could represent an old stroke.* Memory service [routine] | ***Most likely Small metastasis / glioma.*** Neuro-oncology with neurosurgery [urgent] |
| Coma + papilloedema | Metabolic or toxic encephalopathy. Acute medicine [emergency]. Red: *"metabolic / diffuse until proven otherwise"* | ***Find what is raising the pressure: a mass, hydrocephalus or cerebral venous sinus thrombosis …*** Next: *Image the head, with venography, before any lumbar puncture …* [emergency]. No red line under the banner |
| Papilloedema + right hemianopia | PCA infarct. Hyperacute stroke pathway [emergency] | ***Most likely Occipital haemorrhage (must not miss). Must not miss: PRES.*** Acute stroke pathway with neurosurgery [emergency] |
| … at chronic onset | Glioma / metastasis. *Could represent an old stroke.* | Glioma / metastasis (the clause dropped, row 14) |
| Papilloedema + left IV palsy | Right trochlear nucleus. Demyelination [urgent] | **Left IV — cisternal segment** (+ the nucleus). ***Tumour or raised intracranial pressure*** [emergency] (row 15) |
| Papilloedema + truncal ataxia | Alcohol-related degeneration | ***Most likely Medulloblastoma (must not miss).*** Neuro-oncology with neurosurgery [emergency] |
| Papilloedema + left leg weakness | ACA infarct. Hyperacute stroke pathway [emergency] | ***Most likely Parasagittal meningioma. Must not miss: Superior sagittal sinus thrombosis.*** Neurosurgery [urgent] |
| Papilloedema + left neglect + left hemiparesis | Carotid-T occlusion. Assess for thrombolysis / thrombectomy [emergency] | ***Most likely Large intracerebral haemorrhage. Must not miss: Malignant MCA infarction.*** Acute stroke pathway with neurosurgery [emergency] |
| Papilloedema + non-fluent speech + right arm | MCA superior division infarct. Thrombolysis and thrombectomy assessment [emergency] | ***Most likely Intracerebral haemorrhage. Must not miss: Cerebral abscess.*** [emergency] |
| Papilloedema + right hemisensory loss | Thalamic lacune | ***Thalamic haemorrhage. Must not miss: Deep cerebral venous thrombosis.*** [emergency] |
| Papilloedema + amnesia | Artery of Percheron infarct | ***Deep cerebral venous thrombosis*** [emergency] |
| Papilloedema + diabetes insipidus | Pituitary surgery / trauma | ***Craniopharyngioma or germinoma*** — pituitary MDT [urgent] |
| Papilloedema + a fixed dilated left pupil, awake | Holmes-Adie pupil. Reassurance [routine]. Red: *"Benign"* | ***Find what is raising the pressure …*** [urgent]; no red line |
| Papilloedema + a VI palsy, or both | Raised ICP (false localising). Must not miss: skull-base tumour | Raised ICP (false localising). **Must not miss: Meningitis or meningeal disease** (the tumour cannot raise it) |
| Millard-Gubler + papilloedema | Basilar perforator infarct | ***Pontine haemorrhage. Must not miss: Brainstem abscess or tuberculoma.*** |
| **Unchanged by design:** every picture without papilloedema; papilloedema alone (the pressure-only card); the uncal herniation cards; the awake complete III; Parinaud's (dorsal midbrain lesion); bitemporal hemianopia (pituitary); cerebellar limb ataxia (a cerebellar infarct can); the vestibular nuclei and the Wallenberg picture (PICA); the temporal lobe (HSV encephalitis); the paracentral lobule (parasagittal meningioma); papilloedema + a retinal stroke (row 7) | | |

Appendix B lists every changed card with no onset, one row per place.

## 7. What this does not fix, and what it found

**The audit's 9 failing checks** are the agreed composite-sites round. None moves.

**Observations for later, not rows of this round:**
- **O1. The place ranking ignores the pressure.** Inside the compartment the place that predicts least still wins. The Adie
  pupil leads the compressive III for a dilated pupil with papilloedema, and the lacunar places lead a hemiparesis.
  A "place follows the pressure" rule, demoting a place none of whose causes can raise it, is its own design. It moves
  localisation, so it moves the audit.
- **O2. The Together card's disease ignores the pressure.** On 0 of 1,179 two-place cards does the named disease change: MS
  is still named for two frontal places with papilloedema. The roster would need the same attribute.
- **O3. The raised-pressure cause rows are acute and subacute only.** At chronic onset the VI + papilloedema card loses
  *"Raised intracranial pressure (false localising sign)"* and follows the pressure itself, though idiopathic intracranial
  hypertension is chronic. A content question for the VI rows.
- **O4. The cover still ignores the compartment filter** (raised-pressure round, O2). Both IV palsies with papilloedema read
  the two IV nerves and neurosarcoidosis.
- **O5. A few places have only a rare cause that can raise the pressure, and it leads.** The basis pontis leads with Listeria
  rhombencephalitis, and the pontomesencephalic tegmentum with *"Paraneoplastic or posterior-fossa tumour"*. The
  thermoregulatory hypothalamus leads with traumatic brain injury, whose plan is written for the sequel (*"Neurorehabilitation
  with endocrinology"*, urgent; it was emergency for the neuroleptic malignant syndrome). The survivors keep the place's own
  order, so the corona radiata names the hypertensive haemorrhage before the glioma; both are uncommon.
- **O6. The site's red flag stays when the plan follows**, as it does for the onset rule. The MCA superior division's
  *"a large-vessel stroke until proven otherwise"* sits beside *"Most likely Intracerebral haemorrhage"*.
- **O7. The IV place's red flag is about both IV nerves after trauma,** and is shown for one palsy with papilloedema.
- **O8. A IV palsy with papilloedema badges emergency and a VI palsy urgent** (row 15's cost). The VI's site plan stands
  because the pressure keeps its lead.
- **O9. The fundal-photography prompt (`RAISES_PRESSURE`) is unchanged.** It asks a different question: does any cause at
  this site name disc swelling.

## 8. How it will be built (the plan follows the ruling)

- `src/data/causes.js`:
  - `CAN_RAISE_PRESSURE`: the category defaults, the `can` and `cannot` name patterns and the exempt retina (rows 2–7), each
    citing this ruling. `canRaisePressure(cause, site)`.
  - `causesFor(site, { onset, pressure })`: the second axis (row 1), applied only where the compartment filter keeps the
    place (it reads `LEVEL_COMPARTMENT`, `INTRACRANIAL_COMPARTMENTS` and `PRESSURE_REACHES` from `compartments.js`).
    `combinedCauses` passes `pressure`.
- `src/data/nextSteps.js`:
  - `pressureFollows(site, { onset, pressure })` beside `onsetFollows`, which is unchanged (row 9). `nextStepsFor` uses it
    when papilloedema is entered; `followed` gains `pressure` and the reasons.
  - The floor in `nextStepsFor`, `pathologyNextStepsFor` and `combinedNextSteps` (row 11).
  - `hyperacuteVascular` unchanged (row 13).
- `src/model/compartments.js`: `PRESSURE_REACHES` gains `skull_base|trochlear_cisternal`; the deferral comment goes (row 15).
- `app/answer.js`:
  - `causesFor` and `resolveNext` pass `pressure`;
  - with papilloedema and nothing left at the place, the What and Next lines are `PRESSURE_ONLY`'s, the badge at least
    urgent, and the red line the banner's (row 10);
  - the old-stroke clause only without papilloedema (row 14).
- `app/app.js`: the What card's band (row 16), the Next card's notes (rows 17–18), and `whatBlock` and the Together card pass
  `pressure`.
- Tests: `test/pressure-follows.test.js` (row 21), the three re-pins (row 19), and the four probes in PR #18's suite with the
  `lead` check (row 20).
- CLAUDE.md: the second demotion axis, the attribute table, the follow rule's scope, and the traps:
  - letting the escalation read the pressure drops hyperacute emergencies;
  - following on either axis widens the onset rule;
  - a What-line probe must read the "Most likely" clause only: on the base, the IV probe passed by matching the
    must-not-miss.

---

## Appendix A — the classification (every cause at an in-play place)

The 641 rows at the 98 cause lists papilloedema keeps in play (435 names), grouped by category: the default, the exceptions,
and every other name. "×n" is the number of the 98 cause lists that hold the name.

**Vascular** — default **cannot**. 190 rows: 84 can (45 names), 106 cannot (83 names).

- *Can (the exceptions):* Intracerebral haemorrhage (×12); Superior sagittal sinus thrombosis (×5); Thalamic haemorrhage (×5); Deep cerebral venous thrombosis (×4); Pontine haemorrhage (×4); Arteriovenous malformation (×3); Deep hypertensive haemorrhage (×3); Midbrain haemorrhage (×3); Cerebellar haemorrhage (×2); Cortical vein thrombosis (×2); Dural arteriovenous fistula (×2); Hypothalamic stroke or haemorrhage (×2); Large intracerebral haemorrhage (×2); Occipital haemorrhage (×2); Pituitary apoplexy (×2); Transverse or sigmoid sinus thrombosis (vein of Labbe) (×2); ACA vasospasm after subarachnoid haemorrhage; Aneurysm or deep haemorrhage; Anterior communicating artery aneurysm (rupture ± vasospasm); Anterior communicating artery aneurysm rupture; Brainstem haemorrhage; Brainstem haemorrhage or cavernoma; Brainstem or cerebellar haemorrhage / cavernoma; Cerebellar / brainstem stroke (PICA / AICA); Cerebellar infarct (PICA); Cerebellar infarct (SCA / PICA); Cerebellar infarct (vermian); Cerebellar or brainstem infarct; Deep haemorrhage; Deep haemorrhage or aneurysm; Haemorrhage; Haemorrhage / cavernous malformation; Haemorrhage into the subthalamic region; Hypertensive deep haemorrhage; Hypertensive haemorrhage; Hypertensive pontine haemorrhage; Internal carotid aneurysm; Malignant MCA infarction (space-occupying oedema); Medullary haemorrhage; PICA / vertebral artery occlusion; Pontine haemorrhage or cavernoma; Posterior communicating artery aneurysm; Ruptured anterior communicating artery aneurysm; Striatal infarct or haemorrhage; Thalamic infarct or haemorrhage.
- *Cannot (the default):* Cavernous malformation (×4); MCA inferior division infarct (×4); ACA infarct (×3); Cavernous malformation with recurrent bleeds (×3); Small-vessel lacunar infarct (×3); Anterior cerebral artery infarct (×2); Artery of Percheron infarct (×2); Basilar artery dissection (×2); Basilar artery occlusion (×2); Border-zone (watershed) infarct from hypoperfusion (×2); Brainstem infarct (×2); MCA superior division infarct (×2); MCA territory infarct (×2); Moyamoya disease (×2); PCA infarct (×2); Severe carotid stenosis or occlusion (×2); ACA territory infarct; AICA territory infarct; AICA territory infarct involving the trigeminal complex; Anterior choroidal artery infarct; Anterior choroidal or carotid-origin atherosclerosis; Anterior or posterior choroidal artery infarct; Anterior spinal / vertebral artery infarct; Artery of Percheron or paramedian thalamic infarct; Auditory (verbal) agnosia from a dominant temporal lesion; Basilar perforator disease with progression; Basilar perforator infarct; Bilateral ACA territory infarct; Bilateral medial medullary infarct; Bilateral temporal (Heschl's gyrus) infarcts; Bilateral vascular disease (multi-infarct / lacunar state); Brainstem stroke / cavernoma (with hypertrophic olivary degeneration); Branch atheromatous disease of the lenticulostriate origin; Capsular warning syndrome; Cardiac arrest / profound global hypoperfusion; Cardioembolic infarct (AF, endocarditis, post-MI thrombus); Cardioembolism; Cardioembolism (atrial fibrillation, valve disease, endocarditis); Carotid atherosclerosis with artery-to-artery embolism; Carotid or ophthalmic artery dissection; Cavernous sinus lesion; Central post-stroke pain (Déjerine-Roussy); Critical carotid stenosis or occlusion; Déjerine-Roussy (central post-stroke pain); Dominant thalamic infarct; Dorsal midbrain infarct; Frontal infarct (ACA or MCA branch); Global cerebral hypoperfusion (watershed 'isolation of the speech area'); Internal carotid artery dissection; Lacunar infarct of the subthalamic nucleus; Large MCA territory (or ICA) infarct; MCA (angular branch) infarct; MCA (superior division) infarct; MCA branch infarct; MCA branch infarct (supramarginal gyrus); MCA infarct (postcentral / parietal branch); MCA or PCA branch infarct of the optic radiation; Microvascular (diabetic / hypertensive) palsy; Microvascular (diabetic / hypertensive) third-nerve palsy; Middle or posterior cerebral artery infarct; PCA perforator infarct; PCA territory infarct; PCA territory infarct with splenial involvement; Pontine infarct; Posterior cerebral / basilar perforator infarct; Posterior thalamic (pulvinar) infarct; Proximal MCA (M1) / carotid-T occlusion; Small brainstem infarct; Small cortical infarct or TIA; Small pontine haemorrhage; Small precentral (hand-knob) infarct; Striatocapsular infarct from PROXIMAL MCA occlusion; Thalamic lacunar infarct; Thalamic lacunar infarct (VPL); Thalamocapsular lacunar infarct; Top-of-the-basilar / brainstem infarct; Top-of-the-basilar embolism; Top-of-the-basilar occlusion; Vascular parkinsonism; Vertebral artery dissection; Vertebral artery occlusion or dissection; Vertebral dissection; Vertebrobasilar TIA.

**Neoplastic / compressive** — default **can**. 113 rows: 103 can (69 names), 10 cannot (9 names).

- *Cannot (the exceptions):* Paraneoplastic cerebellar degeneration (×2); Esthesioneuroblastoma or sinonasal malignancy; Metastasis to the pituitary stalk; Nasopharyngeal carcinoma; Orbital tumour or metastasis; Paraneoplastic autonomic neuropathy; Perineural spread of head-and-neck malignancy; Petrous apex tumour or cholesteatoma; Skull base tumour or nasopharyngeal carcinoma.
- *Can (the default):* Glioma / metastasis (×16); Tumour / metastasis (×5); Small metastasis / glioma (×4); Thalamic tumour or metastasis (×4); Parasagittal meningioma (×3); Butterfly glioma or lymphoma (×2); Cerebellopontine angle tumour (×2); Craniopharyngioma or germinoma (×2); Hypothalamic tumour or infiltration (×2); Medulloblastoma (×2); Parasagittal / falx meningioma (×2); Tumour (glioma / metastasis) (×2); Bilateral thalamic glioma; Bilateral tumour or metastases; Brainstem glioma; Brainstem tumour or trauma; Cerebellopontine angle tumour (vestibular schwannoma, meningioma); Craniocervical junction compression (foramen-magnum meningioma, basilar invagination); Craniopharyngioma (and its surgical treatment); Deep tumour or metastasis; Dorsal midbrain (pretectal) lesion; Falx / parasagittal meningioma; Falx metastasis or lymphoma; Foramen-magnum meningioma; Fourth ventricular ependymoma; Frontal glioma or metastasis; Frontal tumour (glioma, meningioma, metastasis); Frontal tumour / metastasis; Glioma / metastasis presenting with a large hemispheric deficit; Glioma of the medial frontal lobe; Hypothalamic glioma; Hypothalamic glioma or germinoma; Langerhans cell histiocytosis; Large tumour or metastasis with oedema; Lateral medullary tumour / metastasis; Low-grade glioma; Mass effect with transtentorial herniation; Medullary tumour / metastasis; Meningioma (tuberculum sellae); Metastasis / haemangioblastoma; Midbrain tumour / metastasis; Olfactory groove meningioma; Paraneoplastic or posterior-fossa tumour; Parasagittal metastasis; Partially or late-presenting compressive lesion; Pineal region tumour (germinoma); Pineal region tumour with hydrocephalus; Pituitary macroadenoma; Pituitary macroadenoma with stalk compression; Pituitary macroadenoma with suprasellar extension; Pontine glioma; Pontine glioma (esp. children); Pontine glioma / metastasis; Posterior fossa tumour; Raised intracranial pressure; Raised intracranial pressure (false localising sign); Small metastasis or demyelinating plaque; Small metastasis or glioma; Small tumour or metastasis; Subfrontal / olfactory groove meningioma; Suprasellar tumour (craniopharyngioma, germinoma, glioma); Third ventricular tumour or colloid cyst; Tumour (glioma, metastasis, craniopharyngioma); Tumour (pineal or tectal); Tumour of the SMA / medial frontal region; Tumour or demyelination; Tumour or meningeal disease at the skull base; Tumour or surgical injury; Uncal herniation.

**Inflammatory / demyelinating / autoimmune** — default **cannot**. 71 rows: 5 can (5 names), 66 cannot (28 names).

- *Can (the exceptions):* Acute disseminated encephalomyelitis (ADEM); Langerhans cell histiocytosis or neurosarcoidosis; Neuro-Behçet's disease; Neurosarcoidosis; Neurosarcoidosis or infiltrative disease.
- *Cannot (the default):* Demyelination (×29); Demyelination (MS) (×5); Demyelinating plaque (×3); Focal cortical demyelination (×2); Giant cell arteritis (×2); Juxtacortical demyelinating plaque (×2); Limbic encephalitis (×2); Anti-LGI1 encephalitis; Anti-Ma2 (paraneoplastic) diencephalitis; Anti-Ma2 paraneoplastic or autoimmune hypothalamitis; Autoimmune / limbic encephalitis; Autoimmune or post-infectious encephalitis; Bickerstaff brainstem encephalitis; Chronic rhinosinusitis / nasal polyps; CNS vasculitis; CNS vasculitis (primary angiitis or secondary); Demyelination (chiasmal neuritis); Demyelination (large juxtacortical plaque); Demyelination (multiple sclerosis); Demyelination / neurodegeneration; Limbic / autoimmune encephalitis (LGI1, NMDA receptor, paraneoplastic); Lymphocytic hypophysitis; Multiple sclerosis; Multiple sclerosis (callosal plaques); NMOSD — area postrema syndrome; Retinal vasculitis or a hypercoagulable state; Severe brainstem demyelination; Sydenham's chorea or autoimmune chorea (SLE, antiphospholipid).

**Mimic** — default **cannot**. 60 rows: 0 can (0 names), 60 cannot (44 names).

- *Can (the exceptions):* none.
- *Cannot (the default):* Hypoglycaemia (×6); Non-convulsive status epilepticus (×4); Delirium (×3); Focal seizure with Todd's paresis (×3); Focal motor seizure with Todd's paresis (×2); Migraine with visual aura (×2); Myasthenia gravis (×2); Normal-pressure hydrocephalus (×2); Afferent (optic nerve) lesion imitating light-near dissociation; Anorexia nervosa (the mimic); Circadian rhythm disorder from schedule or light exposure (the mimic); Complete neuromuscular paralysis (severe GBS, botulism, prolonged blockade); Depression; Essential tremor (the mimic); Focal motor seizure of the hand with Todd's paresis; Focal motor seizure of the leg with Todd's paresis; Focal seizure; Focal seizure with speech arrest; Focal seizure with transient Gerstmann features; Focal seizure with versive gaze deviation; Focal sensorimotor seizure with Todd's phenomenon; Focal sensory seizure; Focal sensory seizure (Jacksonian march); Focal sensory seizure of the leg; Focal temporal seizure with postictal aphasia; Insular (opercular) epilepsy; Migraine or occipital seizure; Migraine sensory aura; Miller Fisher syndrome; Nephrogenic diabetes insipidus (the mimic); Non-arteritic AION (the mimic); Normal-pressure hydrocephalus (the mimic); Occipital seizure; Ophthalmoplegic migraine (recurrent painful ophthalmoplegic neuropathy); Peripheral (cochlear) deafness; Peripheral nerve or root lesion (the mimic); Postictal (peri-ictal) aphasia; Postictal aphasia after a focal temporal seizure; Retinal migraine (vasospasm); Seizure or postictal auditory disturbance; Supplementary motor area seizure; Transient global amnesia (the mimic); Ulnar or median neuropathy (the mimic); Vestibular migraine.

**Metabolic / toxic / nutritional** — default **cannot**. 52 rows: 5 can (2 names), 47 cannot (35 names).

- *Can (the exceptions):* Posterior reversible encephalopathy syndrome (PRES) (×4); PRES (posterior reversible encephalopathy).
- *Cannot (the default):* Wernicke's encephalopathy (×7); Alcohol-related cerebellar degeneration (×2); Central pontine myelinolysis (osmotic demyelination) (×2); Hypoxic-ischaemic brain injury (×2); Non-ketotic hyperglycaemia (×2); Osmotic demyelination syndrome (central pontine myelinolysis) (×2); Wilson's disease (young-onset) (×2); Acute dystonic reaction; Alcohol-related or B12/thiamine deficiency; Anticholinergic or sympathomimetic toxidrome; Anticonvulsant / drug toxicity (phenytoin, lithium, carbamazepine); Autonomic neuropathy (diabetes, amyloid, Sjogren's); Bariatric surgery, hyperemesis or malnutrition; Bilateral pallidal injury (hypoxia / kernicterus / manganese); Carbon monoxide poisoning; Diabetic autonomic neuropathy; Drug intoxication or withdrawal; Drug toxicity (anticonvulsants, alcohol); Drug toxicity (anticonvulsants, lithium); Drug toxicity (lithium, phenytoin, carbamazepine); Drug-induced movement disorder (levodopa, antipsychotics, stimulants); Drug-induced parkinsonism; Extrapontine osmotic demyelination; Global hypoxic-ischaemic injury; Hypothyroidism, coeliac disease or vitamin E deficiency; Korsakoff syndrome (thiamine deficiency); Manganese or carbon monoxide toxicity; Marchiafava-Bignami disease; Metabolic or drug-induced coma; Metabolic or toxic encephalopathy; Microvascular (diabetic) ischaemic palsy; Neuroleptic malignant syndrome / serotonin syndrome; Status dystonicus; Tardive dystonia (dopamine-blocker exposure); Wernicke-Korsakoff syndrome (thiamine deficiency).

**Infective** — default **can**. 48 rows: 41 can (20 names), 7 cannot (7 names).

- *Cannot (the exceptions):* Neurosyphilis (general paresis); Neurosyphilis (tabes dorsalis); Post-viral anosmia; Reversible splenial lesion syndrome (MERS); Sepsis or systemic infection; Varicella zoster or viral ganglionitis; Whipple's disease.
- *Can (the default):* Cerebral abscess (×8); Herpes simplex encephalitis (×8); Brainstem abscess or tuberculoma (×6); Basal meningitis (tuberculous, carcinomatous or fungal) (×3); Brainstem abscess; Brainstem encephalitis (Listeria, enterovirus); Brainstem encephalitis / meningoencephalitis; Brainstem encephalitis or tuberculoma; Cavernous sinus thrombosis; Cerebellar abscess; Cerebellar abscess or tuberculoma; Cerebral abscess or empyema; Herpes simplex or limbic encephalitis; Japanese encephalitis / flavivirus encephalitis; Listeria rhombencephalitis; Meningitis or meningeal disease; Petrous apicitis (Gradenigo's syndrome); Post-infectious acute cerebellitis; Thalamic abscess or cerebral toxoplasmosis; Toxoplasmosis or HIV-related lesion.

**Degenerative** — default **cannot**. 37 rows: 0 can (0 names), 37 cannot (30 names).

- *Can (the exceptions):* none.
- *Cannot (the default):* Posterior cortical atrophy (Benson's syndrome) (×3); Frontotemporal dementia (behavioural variant) (×2); Holmes-Adie (tonic) pupil (×2); Progressive ataxia with palatal tremor (PAPT) (×2); Progressive supranuclear palsy (×2); Wilson's disease (×2); Advanced Alzheimer's or a degenerative aphasia; Alcohol / toxic / paraneoplastic degeneration; Alzheimer's disease (medial temporal); Alzheimer's disease / posterior cortical atrophy; Atypical parkinsonism (PSP / MSA); Cerebral small-vessel disease (confluent leukoaraiosis); Corticobasal degeneration; Corticobasal syndrome from other pathology (PSP, Alzheimer's); Creutzfeldt-Jakob disease; Creutzfeldt-Jakob disease (Heidenhain variant); Diffuse neurodegenerative disease; Frontotemporal dementia; Mesial temporal sclerosis / temporal lobe epilepsy; Motor neurone disease (ALS); Multiple system atrophy (MSA-C); Narcolepsy with cataplexy (orexin/hypocretin loss); Neurodegenerative disease (Alzheimer's, Parkinson's); Neurodegenerative disease (Parkinson's, Alzheimer's); Parkinson's disease; Primary progressive aphasia (semantic or logopenic variant); Semantic dementia (semantic variant PPA); Spinocerebellar / cerebellar degeneration; Superficial siderosis; Variant Creutzfeldt-Jakob disease.

**Traumatic / mechanical** — default **can**. 31 rows: 20 can (13 names), 11 cannot (10 names).

- *Cannot (the exceptions):* Head trauma (×2); Craniocervical junction trauma; Craniocervical junction trauma (odontoid fracture); Head trauma (cribriform plate shearing); Head trauma with petrous fracture; Orbital trauma or surgery; Pituitary or hypothalamic surgery / trauma; Total blindness (non-24-hour sleep-wake disorder); Trauma / surgery; Vertebral artery injury from neck trauma or manipulation.
- *Can (the default):* Traumatic brain injury (×5); Diffuse axonal injury (×4); Bilateral traumatic or hypoxic injury; Duret haemorrhage / brainstem injury from herniation; Interhemispheric (falx) subdural haematoma or parasagittal contusion; Pontine contusion with diffuse axonal injury; Pontine trauma or tumour; Tectal contusion after head injury; Temporal pole contusion; Traumatic brain injury (orbitofrontal contusion); Uncal herniation compressing the third nerve; Vertex extradural haematoma; Vertex extradural haematoma / parasagittal contusion.

**Congenital / hereditary** — default **cannot**. 29 rows: 6 can (5 names), 23 cannot (20 names).

- *Can (the exceptions):* Chiari I malformation (×2); Cerebellar malformation (Dandy-Walker, vermian hypoplasia); Craniopharyngioma; Obstructive hydrocephalus / shunt failure; Obstructive hydrocephalus compressing the pretectum.
- *Cannot (the default):* Fabry disease (×2); Normal pressure hydrocephalus (×2); Spinocerebellar ataxia (hereditary) (×2); Azygos (unpaired) ACA supplying both hemispheres; Bilateral perisylvian injury (Worster-Drought / cerebral palsy); CADASIL; Craniocervical instability / basilar invagination; Decompensated congenital fourth nerve palsy; Developmental prosopagnosia; Episodic ataxia type 2; Huntington's disease; Hypothalamic hamartoma; Kallmann syndrome; Pantothenate kinase-associated neurodegeneration (PKAN); Prader-Willi syndrome; Primary / genetic dystonia (e.g. DYT1); Sickle cell disease; Sickle cell disease or hyperviscosity; Syringobulbia; Vertebrobasilar dolichoectasia.

**Iatrogenic** — default **cannot**. 10 rows: 0 can (0 names), 10 cannot (10 names).

- *Can (the exceptions):* none.
- *Cannot (the default):* Aberrant regeneration after a third nerve palsy; Anterior temporal lobectomy (post-surgical); Corpus callosotomy (surgical); Cranial irradiation of the hypothalamic region; Post-DBS or post-surgical injury; Post-surgical injury (anterior temporal lobectomy); Post-surgical or post-DBS change; Posterior fossa surgery (dentate injury / cerebellar mutism); Radiation or post-surgical injury; SMA syndrome after tumour resection.

**In all:** 264 rows can, 377 cannot, of 641.

**With row 15 (the IV's cisternal course in play), six more rows:** *Tumour or raised intracranial pressure* and *Basal meningitis (tuberculous, carcinomatous or fungal)* can; *Head trauma*, *Microvascular (diabetic / hypertensive) palsy*, *Congenital fourth-nerve palsy (decompensating)* and *Schwannoma / meningioma / metastasis* (the corridor tumour) cannot.

## Appendix B — every changed card with no onset

One row per place (left and right merged; "cards" counts the frozen pictures and single findings that land there). A row
whose leading cause is "unchanged" changed only its must-not-miss or its badge. The place is the card's place with the set:
where row 15 moves the place (the IV rows), "today" is the card today, which reads the trochlear nucleus.

| Place (cards) | Most likely: today → with the set | Badge | Next line with the set |
|---|---|---|---|
| Perisylvian language area (1) | Large MCA territory (or ICA) infarct → **Large intracerebral haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Both watershed language zones (1) | Global cerebral hypoperfusion (watershed 'isolation of the speech area') → ***the pressure itself*** | emergency | Image the head, with venography, before any lumbar puncture; neurosurgery if there is a… |
| Globus pallidus (5) | Primary / genetic dystonia (e.g. DYT1) → ***the pressure itself*** | urgent | Image the head, with venography, before any lumbar puncture; neurosurgery if there is a… |
| Striatum (5) | Huntington's disease → **Striatal infarct or haemorrhage** | urgent → **emergency** | Acute stroke pathway — time-critical, and reperfusion may be on the table |
| Substantia nigra (9) | Parkinson's disease → ***the pressure itself*** | urgent | Image the head, with venography, before any lumbar puncture; neurosurgery if there is a… |
| Subthalamic nucleus (4) | Lacunar infarct of the subthalamic nucleus → **Haemorrhage into the subthalamic region** | urgent → **emergency** | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Bilateral anterior temporal lobe (2) | Semantic dementia (semantic variant PPA) → **Herpes simplex encephalitis** | urgent → **emergency** | Acute neurology with infectious diseases; critical care if conscious level is falling |
| Bilateral primary auditory cortex (Heschl's gyrus) (2) | Peripheral (cochlear) deafness → **Bilateral tumour or metastases** | urgent | Neuro-oncology multidisciplinary team with neurosurgery |
| Bilateral fusiform gyrus (3) | PCA territory infarct → **Glioma / metastasis** | urgent | Neuro-oncology multidisciplinary team, with neurosurgery |
| Bilateral primary visual cortex (2) | PCA infarct → **Occipital haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Bilateral inferior parietal lobule (4) | MCA inferior division infarct → **Glioma / metastasis** | emergency → **urgent** | Neuro-oncology multidisciplinary team, with neurosurgery |
| Midline paramedian tegmentum (ARAS) (2) | Top-of-the-basilar / brainstem infarct → **Mass effect with transtentorial herniation** | emergency | Neurosurgery and acute neurology; ophthalmology where vision is threatened |
| Vestibular nuclei (11) | Cerebellar / brainstem stroke (PICA / AICA) (unchanged) | emergency | (unchanged) |
| Bilateral whole cerebellum (1) | Alcohol-related cerebellar degeneration → ***the pressure itself*** | urgent | Image the head, with venography, before any lumbar puncture; neurosurgery if there is a… |
| Midline cerebellar vermis (3) | Alcohol-related cerebellar degeneration → **Medulloblastoma** | emergency | Neuro-oncology multidisciplinary team with neurosurgery |
| Bilateral diffuse cerebral involvement (2) | Metabolic or toxic encephalopathy → ***the pressure itself*** | emergency | Image the head, with venography, before any lumbar puncture; neurosurgery if there is a… |
| Midline anterior corpus callosum (2) | Anterior cerebral artery infarct → **Butterfly glioma or lymphoma** | urgent | Neuro-oncology multidisciplinary team with neurosurgery |
| Midline splenium of the corpus callosum (2) | PCA territory infarct with splenial involvement → **Butterfly glioma or lymphoma** | urgent | Neuro-oncology multidisciplinary team with neurosurgery |
| ACA territory (2) | ACA infarct → **Parasagittal meningioma** | emergency → **urgent** | Neurosurgery, with neuro-oncology where the diagnosis is uncertain |
| Angular gyrus (2) | MCA (angular branch) infarct → **Glioma / metastasis** | emergency → **urgent** | Neuro-oncology multidisciplinary team, with neurosurgery |
| Arcuate fasciculus (2) | MCA branch infarct (supramarginal gyrus) → **Intracerebral haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Dorsolateral prefrontal cortex (3) | Frontotemporal dementia (behavioural variant) → **Frontal tumour (glioma, meningioma, metastasis)** | urgent | Neuro-oncology multidisciplinary team with neurosurgery |
| Frontal eye field (4) | MCA territory infarct → **Intracerebral haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Fusiform gyrus (4) | PCA territory infarct → **Glioma / metastasis** | urgent | Neuro-oncology multidisciplinary team, with neurosurgery |
| Hand knob of the motor cortex (8) | Small precentral (hand-knob) infarct → **Cortical vein thrombosis** | emergency | Acute stroke or neurology service, with haematology; neurosurgery if there is mass effect… |
| Insular cortex (5) | MCA territory infarct → **Low-grade glioma** | emergency → **urgent** | Neuro-oncology multidisciplinary team with neurosurgery |
| MCA territory (2) | Proximal MCA (M1) / carotid-T occlusion → **Large intracerebral haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| MCA inferior division territory (2) | MCA inferior division infarct → **Herpes simplex encephalitis** | emergency | Acute neurology with infectious diseases; critical care if conscious level is falling |
| MCA superior division territory (2) | MCA superior division infarct → **Intracerebral haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Medial prefrontal cortex (5) | Anterior cerebral artery infarct → **Falx / parasagittal meningioma** | urgent | Neurosurgery, with neuro-oncology where the diagnosis is uncertain |
| Face/arm area of the motor cortex (10) | MCA superior division infarct → **Intracerebral haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Leg area of the motor cortex (7) | ACA infarct → **Parasagittal meningioma** | emergency → **urgent** | Neurosurgery, with neuro-oncology where the diagnosis is uncertain |
| Primary visual cortex (10) | PCA infarct → **Occipital haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Frontal operculum (Broca's area) (3) | MCA (superior division) infarct → **Haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Paracentral lobule (4) | Parasagittal / falx meningioma (unchanged) | emergency | (unchanged) |
| Inferior parietal lobule (12) | MCA inferior division infarct → **Glioma / metastasis** | emergency → **urgent** | Neuro-oncology multidisciplinary team, with neurosurgery |
| PCA territory (2) | PCA infarct → **Occipital haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Premotor cortex (3) | MCA branch infarct → **Glioma / metastasis** | urgent | Neuro-oncology multidisciplinary team, with neurosurgery |
| Face/arm area of the sensory cortex (4) | MCA infarct (postcentral / parietal branch) → **Intracerebral haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Hand area of the sensory cortex (4) | Small cortical infarct or TIA → **Small tumour or metastasis** | urgent | Neuro-oncology multidisciplinary team with neurosurgery |
| Leg area of the sensory cortex (4) | ACA infarct → **Parasagittal meningioma** | emergency → **urgent** | Neurosurgery, with neuro-oncology where the diagnosis is uncertain |
| Supplementary motor area (3) | SMA syndrome after tumour resection → **Parasagittal / falx meningioma** | urgent | Neurosurgery, with neuro-oncology where the diagnosis is uncertain |
| Temporal lobe (8) | Herpes simplex encephalitis (unchanged) | emergency | (unchanged) |
| Posterior superior temporal gyrus (Wernicke's area) (3) | MCA inferior division infarct → **Intracerebral haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Anterior watershed zone (2) | Border-zone (watershed) infarct from hypoperfusion → **Tumour of the SMA / medial frontal region** | emergency → **urgent** | Neuro-oncology multidisciplinary team with neurosurgery |
| Posterior watershed zone (2) | Border-zone (watershed) infarct from hypoperfusion → **Glioma / metastasis** | emergency → **urgent** | Neuro-oncology multidisciplinary team, with neurosurgery |
| Dentate nucleus (2) | Brainstem or cerebellar haemorrhage / cavernoma (unchanged) | routine → **urgent** | (unchanged) |
| Red nucleus (4) | Brainstem haemorrhage or cavernoma (unchanged) | routine → **urgent** | (unchanged) |
| Midline Guillain–Mollaret triangle (3) | Brainstem stroke / cavernoma (with hypertrophic olivary degeneration) → **Brainstem abscess or tuberculoma** | routine → **emergency** | Neurosurgery and infectious diseases jointly, with acute neurology |
| Midline lateral hypothalamic area (2) | Narcolepsy with cataplexy (orexin/hypocretin loss) → **Hypothalamic tumour or infiltration** | urgent | Pituitary multidisciplinary team — endocrinology, neurosurgery and ophthalmology together |
| Midline suprachiasmatic nucleus (2) | Neurodegenerative disease (Alzheimer's, Parkinson's) → **Suprasellar tumour (craniopharyngioma, germinoma, glioma)** | routine → **urgent** | Pituitary multidisciplinary team — endocrinology, neurosurgery and ophthalmology together |
| Midline supraoptic / paraventricular nuclei (2) | Pituitary or hypothalamic surgery / trauma → **Craniopharyngioma or germinoma** | urgent | Pituitary multidisciplinary team — endocrinology, neurosurgery and ophthalmology together |
| Midline anterior + posterior hypothalamic nuclei (2) | Neuroleptic malignant syndrome / serotonin syndrome → **Traumatic brain injury** | emergency → **urgent** | Neurorehabilitation with endocrinology; neurosurgery per imaging. |
| Bilateral ventral pons (basis pontis) (3) | Basilar artery occlusion → **Pontine haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Hemimedulla (9) | Vertebral artery occlusion or dissection → **Medullary haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Lateral medulla (27) | PICA / vertebral artery occlusion (unchanged) | emergency | (unchanged) |
| Medial medulla (11) | Anterior spinal / vertebral artery infarct → **Medullary tumour / metastasis** | emergency → **urgent** | Neuro-oncology multidisciplinary team with neurosurgery |
| Hemimidbrain (2) | Top-of-the-basilar occlusion → **Midbrain haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Medial midbrain (2) | PCA perforator infarct → **Haemorrhage / cavernous malformation** | emergency → **urgent** | Neurovascular / neurosurgical multidisciplinary team, with neurointervention |
| Trochlear nucleus, midbrain (4) | Demyelination → **Tumour (pineal or tectal)** | urgent → **emergency** | Neurosurgery urgently for the hydrocephalus; neuro-oncology for the tumour |
| Olfactory groove (4) | Olfactory groove meningioma (unchanged) | routine → **urgent** | (unchanged) |
| Basis pontis (2) | Small-vessel lacunar infarct → **Listeria rhombencephalitis** | emergency | Acute neurology with infectious diseases; critical care if conscious level or swallow is… |
| Hemipons (4) | Basilar artery occlusion → **Hypertensive pontine haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Lateral pons (12) | AICA territory infarct → **Pontine haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Lateral pons (trigeminal) (2) | AICA territory infarct involving the trigeminal complex → **Cerebellopontine angle tumour** | emergency → **urgent** | Neuro-oncology multidisciplinary team with neurosurgery |
| Medial pons (14) | Basilar perforator infarct → **Pontine haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Pontine trigeminal complex (10) | Demyelination (multiple sclerosis) → **Cerebellopontine angle tumour** | urgent | Neuro-oncology multidisciplinary team with neurosurgery |
| Midline pontomesencephalic tegmentum (2) | Wernicke's encephalopathy → **Paraneoplastic or posterior-fossa tumour** | emergency → **urgent** | Neuro-oncology multidisciplinary team with neurosurgery |
| Bilateral corticobulbar tracts, bilateral (2) | Bilateral vascular disease (multi-infarct / lacunar state) → **Bilateral traumatic or hypoxic injury** | urgent | ED or neurosurgery per the imaging; neurorehabilitation for persisting deficits. |
| Ciliary ganglion (6) | Holmes-Adie (tonic) pupil → ***the pressure itself*** | routine → **urgent** | Image the head, with venography, before any lumbar puncture; neurosurgery if there is a… |
| CN III (ischaemic) (16) | Microvascular (diabetic / hypertensive) third-nerve palsy → **Partially or late-presenting compressive lesion** | urgent → **emergency** | Neurosurgery and acute neurology; ophthalmology where vision is threatened |
| Bilateral pretectum (1) | Dorsal midbrain (pretectal) lesion (unchanged) | urgent | (unchanged) |
| IV — cisternal segment (6) | Demyelination → **Tumour or raised intracranial pressure** | urgent → **emergency** | Neurosurgery and acute neurology; ophthalmology where vision is threatened |
| VI — cisternal segment (8) | Raised intracranial pressure (false localising sign) (unchanged) | urgent | (unchanged) |
| Striatocapsular white matter (1) | Striatocapsular infarct from PROXIMAL MCA occlusion → **Deep hypertensive haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Anterior choroidal territory (2) | Anterior choroidal artery infarct → **Deep hypertensive haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Corona radiata (5) | Small-vessel lacunar infarct → **Hypertensive deep haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Sensorimotor white matter (4) | Thalamocapsular lacunar infarct → **Deep hypertensive haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Thalamus (10) | Thalamic lacunar infarct (VPL) → **Thalamic haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Thalamus (language) (1) | Dominant thalamic infarct → **Thalamic haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Bilateral paramedian thalamus (1) | Artery of Percheron infarct → **Deep cerebral venous thrombosis** | emergency | Acute stroke or neurology service, with haematology; neurosurgery if there is mass effect… |
| Anterior + dorsomedial thalamic nuclei (4) | Artery of Percheron infarct → **Deep cerebral venous thrombosis** | emergency | Acute stroke or neurology service, with haematology; neurosurgery if there is mass effect… |
| Pulvinar (2) | Posterior thalamic (pulvinar) infarct → **Thalamic haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Ventral posteromedial thalamic nucleus (4) | Thalamic lacunar infarct → **Thalamic haemorrhage** | emergency | Acute stroke pathway with neurosurgery; critical care if conscious level is falling |
| Optic tract (4) | Middle or posterior cerebral artery infarct → **Tumour (glioma, metastasis, craniopharyngioma)** | urgent | Pituitary multidisciplinary team — endocrinology, neurosurgery and ophthalmology together |

85 rows, 385 cards.
