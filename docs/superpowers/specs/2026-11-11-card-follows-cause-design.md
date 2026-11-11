# The card follows its cause — every sentence on a card has one owner (design, 2026-11-11)

**Status: DESIGNED.** The approach and design sections 1–4 were approved in conversation (2026-11-11). Round 1's rows (§4) and
the content table (Appendix A) await the owner's ruling.
- Branch `fix/card-follows-cause`, cut from `integrate/all-open-fixes` at `b6fdb73`; worktree `Code/neurolocaliser-card-cause/`.
- Nothing is pushed, and no fix branch is touched.

**In one paragraph.** The answer card's What line, Next line and badge follow the cause the card names, read with the onset,
papilloedema and the reader's selection. Its red flag and its title do not. They are written once per place, and some of them
assert the place's usual cause: "…is a dominant MCA stroke — time-critical", "pupil-sparing is reassuring". So whenever
anything moves the card's cause, the flag contradicts the card. It has done so on the live app since v0.10.1 (onset) and
2026-08-18 (selection). The fix gives every sentence one owner:
- the place, for sentences true whatever the cause;
- the cause, for sentences about one cause.

The card shows cause-owned sentences only for the cause it names.

## 1. What is wrong

The integration's browser check found the symptom. Coma + vertical gaze palsy + a hemianopia on each side + papilloedema read:
- What: *"Most likely Posterior reversible encephalopathy syndrome (PRES)"*.
- Next: PRES's plan.
- Red flag: *"Drowsiness with vertical gaze palsy and visual loss is a basilar-tip occlusion until proven otherwise — CTA now; it
  is a thrombectomy target"*.

The owner then re-ruled PRES, and the card now leads with deep cerebral venous thrombosis, under the same flag.

**18 places, 77 cards, whose flag contradicts the card** (papilloedema, every onset, each place's own picture). They fall into
five kinds:
- **The flag directs treatment for the set-aside stroke.** Wernicke's area follows an intracerebral haemorrhage beside
  *"…image and **consider thrombolysis**"*. The global aphasia says *"…reperfusion assessment"*; the internal capsule says *"…a
  lacune in evolution; **treat**"*.
- **The flag reassures.** The ischaemic III follows a compressive lesion beside *"Pupil-sparing **is reassuring**"*.
- **The flag asks for a lumbar puncture despite papilloedema.** The bilateral anterior temporal lobes say *"…while imaging **and
  doing an LP**"*; the lateral hypothalamus says *"…CSF hypocretin"*.
- **The flag says the picture *is* a stroke.** There are eight places, including the ARAS, which follows transtentorial
  herniation beside *"a posterior-circulation emergency — image the vessels"*.
- **The flag names a different mechanism.** There are four: the watersheds, the bilateral parietal and the bilateral fusiform.

**It is not a pressure problem.** On every axis that moves the card's cause, the place's flag stays, 100% of the time:

| Axis (cards whose What/Next follow a cause other than the place's usual one) | Live app, v0.10.2 (`ac4fad3`) | Integration (`b6fdb73`) |
|---|---|---|
| Onset (onset follows the cause, live since v0.10.1) | 101 of 101 keep the place's flag | 103 of 103 |
| A selected cause (per-pathology next steps, live since 2026-08-18) | 842 of 842 | 868 of 868 |
| Papilloedema (pressure follows the cause, #25) | — | 281 of 281 |

**The same class in the title.** Seven card titles name a pathology:
- the five "…lacune" syndromes;
- "Mammillary body syndrome (Wernicke-Korsakoff)";
- "Pancoast syndrome (superior sulcus tumour)".

22 cards that follow another cause show "…lacune" above a What line leading with demyelination, glioma or Listeria.

## 2. Why it happens

The card has two kinds of source:

| On the card | Source | Follows the card's cause? |
|---|---|---|
| Where, Why | the place (and its reading), the entered findings | not about the cause |
| What | the cause ranking, read with onset, papilloedema and the selection (`causesFor` → `leadingCause`) | yes |
| Next, badge | the followed or selected cause's authored plan | yes |
| **Red flag** | the place's phonebook entry (`syndromes.js` `red`) | **no** |
| **Title, phone strip** | the place's phonebook `name` | **no** |

**The derivation is sound:** What, Next and the badge read one `leadingCause`, and a test pins that the followed cause is the
What line's lead. **The content model is not.** It has no slot for a warning that belongs to a cause, so authors put cause
warnings on the place, where nothing can make them follow. 37 of the 166 flags and 7 of the titles do.

Every axis that moves the cause has re-exposed this, and each got its own special case:
- the uncal reading's own flag (raised-pressure round);
- the Together card's disease flag (`entityRed`);
- the pressure-leads blank (pressure-follows row 10).

The onset and selection axes never got one. Another per-axis patch would be the fourth.

## 3. The design (approved in conversation, 2026-11-11)

### 3.1 Who owns each sentence

- **Place flag** (the phonebook's `red`, unchanged in shape). It holds only sentences true *whatever the cause*:
  - a localising point;
  - a safety rule for the place ("keep nil by mouth", "do not mistake locked-in for coma");
  - a warning conditional on findings it names itself ("…with jaw claudication is GCA", "on anticoagulation, image for a
    haematoma").
- **Cause flag** (new). An optional `flag` sentence on the cause entry *at that place*: each place already reads its own cause
  list. Example: Broca's area's "MCA (superior division) infarct" carries *"Acute non-fluent aphasia + right hemiparesis is a
  dominant MCA stroke — time-critical."*
- **A restriction.** Eight cause lists are read by two places: a place and its bilateral composite, such as both occipital
  lobes reading the occipital lobe's list. Eight places also have per-hemisphere (or bilateral) flags, and five of them
  have one that moves. A cause flag written for one place or one hemisphere carries `only`: the place, or the hemisphere.
  A guard checks every restriction names a place or hemisphere that really reads that list. Copying the list for the
  composite was rejected: it is the hand-copy trap this engine has hit four times.
- **The uncal reading's flag** (on the reading in `sites.js`, not in the phonebook) moves onto the cause the reading leads
  with, "Uncal herniation" in the compressive III's list. Selecting the aneurysm there shows the aneurysm's flag, not
  herniation's.
- **The Together card's disease flag** is already owned by the disease: unchanged.
- **Titles** name the place or the syndrome, never a pathology.

### 3.2 The one rule

- **The card's cause** is decided once, in `app/answer.js`:
  - the cause the reader selected;
  - else the What line's most likely cause, read with the onset and papilloedema (the plan follows exactly this cause);
  - **none** when the card names no cause: the pressure leads, the papilloedema-only card, or a two-place card (where the
    Together card's disease keeps its flag).
- **The red line** is the card's cause's flag at this place, if it has one, then the place flag. The same function feeds the
  answer card's ⚑ line, the What card's "Red flag" and a selection made in the What card.
- **The three special cases become this rule.** The pressure-leads blank goes: with place flags cause-neutral by construction,
  its reason ("written for causes now set aside") goes with it. So **the place flag shows when the pressure leads**, which
  reverses that part of the pressure-follows round's row 10.
- **A future axis** (course, age, …) only has to move the What line's cause; the flag follows.

### 3.3 The content review

Every flag gets one of three classes:

| Class | Test | Proposed |
|---|---|---|
| **Stays on the place** | True whatever the cause | 129 |
| **Moves to a cause** | Asserts one cause for the picture on the card, or acts or reassures on one cause | 36, word for word |
| **Splits** | Both | 1 |

**Every proposed target is the place's usual cause.** So with no onset, papilloedema or selection, the card reads as today
everywhere except the split. 11 moves carry a restriction. Four rows carry an alternative target for the owner to prefer. One
row has no matching cause: the bilateral parietal's watershed flag, where the list has no border-zone cause. Wording is never
changed except in the split and the titles. Appendix A lists every row; Appendix B lists the titles.

### 3.4 What keeps it fixed

1. **A card never shows another cause's flag (structural).** One sweep covers every place's own picture × every onset × with and
   without papilloedema × every selectable cause. The cause flag shown must be the flag of the card's own cause at that place,
   and that cause must be the one the What line names. Any future axis acts through the What line, so the sweep covers it.
2. **The place flags are a reviewed snapshot.** A new or reworded place flag fails the suite until someone has asked "is it true
   whatever the cause?" and updated the snapshot. It is the mechanism the pressure round uses for its cause classification
   (row 21).
3. **A floor for the dangerous phrasings.** No place flag uses "until proven otherwise", "is a … stroke / infarct / occlusion
   …", "time-critical", thrombolysis / thrombectomy / reperfusion, "reassuring" / "benign" or "treat … empirically"
   without a reasoned allowlist entry. Thirteen staying flags need one, each a place claim or a conditional one (Appendix A).

   **Measured limit:** no wording test can tell a place fact from a cause claim.
   - The floor alone misses 19 of today's 37 moved flags ("AICA strokes can cause deafness").
   - A stricter "names one of its own causes" test was measured and rejected: it would need 92 of the 129 staying flags
     allowlisted and still miss 8 moved ones.

   So guard 2's forced human look is the real gate, as the owner's review is for all content.
4. **No title names a pathology**, checked the same way with an allowlist.
5. **Every restriction is real.**
6. **Nothing else moves.** With no onset, papilloedema or selection, Where, Why, What, Next and the badge are identical on every
   card. The red line changes only at the split, and the titles only at the 7.

## 4. Rulings — round 1 (awaiting the owner)

### A. The mechanism

| Row | Recommendation |
|---|---|
| M1 | **Ownership:** a place flag is true whatever the cause; a cause flag is an optional `flag` on the cause entry at that place, with an optional restriction (`only`: a place reading the same list, or a hemisphere). |
| M2 | **The card's cause:** the selection, else the What line's most likely cause; none when the pressure leads, on the papilloedema-only card, or on a two-place card (the Together card keeps its disease flag). |
| M3 | **The red line:** the card's cause's flag, then the place flag; one function for the answer card, the What card and a selection. |
| M4 | **The special cases go:** the uncal reading's flag moves onto its herniation cause; the pressure-leads blank goes, so the place flag shows there (**reverses part of pressure-follows row 10**). |
| M5 | **Guards:** the six of §3.4. |
| M6 | **Scope:** the card face only. The immediate / first-line tiers wait for a later audit (§6). |

### B. The content: Appendix A, row by row

| Row | Recommendation |
|---|---|
| A | **Approve C1–C37 and P1–P129 as proposed**, or strike or change rows. |
| A-alt | **Choose for the four rows that offer an alternative target:** C4 (ACA: its infarct, or the azygos ACA); C8/C9 (malignant MCA: the M1 occlusion, or the malignant infarction itself); C16 (the internal capsule: the lacune, or the capsular warning syndrome). |
| A-parietal | **C15, the bilateral parietal watershed flag:** attach it to the list's infarct (proposed), or reword it as a place fact. |
| A-split | **C33, the diffuse cerebrum:** approve the split's two halves, or reword them. |
| A-LP | **P22, `bilateral_anterior_temporal`:** it stays (conditional on fever and confusion). With papilloedema the LP must follow imaging; reword it to "image, then LP"? |

### C. Titles: Appendix B, T1–T7

Approve the seven cause-neutral names, or reword them. "Wernicke's aphasia" stays: it names the area, not the disease.

## 5. Measured — a simulation of the proposed set on the integration (`b6fdb73`)

The proposed classification was applied in a scratch simulation (no engine change) to every card. Every target cause exists in
its place's list, every restriction names a real place or hemisphere, and every per-hemisphere flag is reachable.

| Axis | Cards | Red line changes | Of which |
|---|---|---|---|
| Default (no onset, papilloedema or selection) | 214 places | **1** | the split |
| Onset | 856 | 77 | a moved flag no longer sits beside another cause |
| Papilloedema | 550 | 164 | 113 lose a flag written for another cause; **51 gain** the place flag where the pressure leads |
| A selected cause | 1,166 | 196 | a moved flag no longer sits beside the selected cause |

**A moved flag beside a cause other than its own: 0 on every axis.** Titles: 7 names change. The plan's dry run re-measures all
of this with the real code, and the build must equal it.

## 6. What this does not fix

- **The immediate / first-line tiers.** They stay the place's by the tier-split ruling ("done before the cause is known"). 49
  places mention stroke steps ("time last known well") on 195 cards that follow a non-stroke cause. That content is triage that
  is still reasonable; a later audit (owner's scope choice, 2026-11-11).
- **#25's IV note wording** ("Papilloedema sets aside Head trauma, which cannot raise the intracranial pressure") is a template
  wording point, not this root cause. It still awaits its ruling.
- **The What line's "Must not miss" clause and the Together card** already follow the cause: unchanged.

## 7. How it will be built (after the ruling)

1. An implementation plan (writing-plans) on this branch, with a dry run that must reproduce §5.
2. TDD:
   1. the guards first, failing;
   2. the content move (the cause `flag`s, the restrictions, the split, the titles);
   3. the rule in `app/answer.js`, read by the answer card, the What card and the strip;
   4. the special cases removed.
3. Measure (`npm test`, the audit, the §5 simulation), then browser-check the cards in Appendix A.
4. Docs: CLAUDE.md, and the authoring rule ("a warning about one cause goes on that cause") in the `c()` builder's comment.
5. It merges into `integrate/all-open-fixes` only on the owner's word. Nothing is pushed.

## Appendix A — every red flag (166)

### A.1 Moves to a cause and the split (C1–C37; the split is C33, the diffuse cerebrum)

C-rows are numbered in phonebook order. "(usual)" marks the place's usual cause, which is every proposed target.

| Row | Flag | Sentence | To the cause | Restriction / note |
|---|---|---|---|---|
| C1 | `bilateral_pons_mlf` | *"A bilateral INO in an older patient, or with any other brainstem sign, is a posterior-circulation stroke until imaging says otherwise."* | Basilar perforator infarct (usual) | only `bilateral_pons_mlf` |
| C2 | `pons_lateral` | *"AICA strokes can cause deafness — the labyrinthine artery is a branch."* | AICA territory infarct (usual) | — |
| C3 | `medulla_hemi` | *"A large vertebral territory event — high stakes, image the vessels."* | Vertebral artery occlusion or dissection (usual) | — |
| C4 | `cortex_aca` | *"Bilateral ACA territory (azygos ACA) causes paraparesis + abulia that can mimic a cord or psychiatric picture — image the vessels."* | ACA infarct (usual) | alt: Azygos (unpaired) ACA supplying both hemispheres |
| C5 | `cortex_mca_superior.dominant` | *"A gaze-deviated, aphasic, face/arm-weak patient is a large-vessel stroke until proven otherwise — time-critical."* | MCA superior division infarct (usual) | only the dominant hemisphere |
| C6 | `cortex_mca_superior.nondominant` | *"Same large-vessel urgency as the dominant side; the language exam looks deceptively normal."* | MCA superior division infarct (usual) | only the non-dominant hemisphere |
| C7 | `cortex_mca_inferior.dominant` | *"Fluent-but-nonsensical speech without weakness is easily mistaken for delirium/psychiatric — it is a stroke syndrome."* | MCA inferior division infarct (usual) | only the dominant hemisphere |
| C8 | `cortex_mca.dominant` | *"Malignant MCA infarction risks fatal oedema — monitor conscious level; consider decompressive hemicraniectomy early."* | Proximal MCA (M1) / carotid-T occlusion (usual) | only the dominant hemisphere; alt: Malignant MCA infarction (space-occupying oedema) |
| C9 | `cortex_mca.nondominant` | *"Malignant MCA infarction risk as for the dominant side; neglect masks the severity."* | Proximal MCA (M1) / carotid-T occlusion (usual) | only the non-dominant hemisphere; alt: Malignant MCA infarction (space-occupying oedema) |
| C10 | `cortex_pca.dominant` | *"New pure alexia with a right hemianopia is a left PCA stroke until proven otherwise."* | PCA infarct (usual) | only the dominant hemisphere |
| C11 | `cortex_temporoparietal` | *"Fluent jargon aphasia without weakness is easily missed as an acute stroke — image and consider thrombolysis."* | MCA inferior division infarct (usual) | — |
| C12 | `bilateral_occipital` | *"Top-of-the-basilar embolism is a treatable cause of bilateral occipital stroke — image the posterior circulation urgently."* | PCA infarct (usual) | only `bilateral_occipital` |
| C13 | `bilateral_fusiform` | *"Bilateral ventral occipitotemporal lesions imply a posterior-circulation or degenerative process — image the PCA territories."* | PCA territory infarct (usual) | only `bilateral_fusiform` |
| C14 | `cortex_fusiform.dominant` | *"New pure alexia with a right hemianopia is a left PCA stroke until proven otherwise."* | PCA territory infarct (usual) | only the dominant hemisphere |
| C15 | `bilateral_parietal` | *"Bilateral watershed infarcts imply global hypoperfusion — look for a cardiac/haemodynamic cause."* | MCA inferior division infarct (usual) | only `bilateral_parietal`; The list has no border-zone cause, so the flag attaches to its infarct; or reword it as a place fact. |
| C16 | `subcortex_internal_capsule` | *"A stuttering or fluctuating pure-motor deficit is the capsular warning syndrome — a lacune in evolution; treat and monitor closely."* | Small-vessel lacunar infarct (usual) | alt: Capsular warning syndrome |
| C17 | `central_vestibular_nucleus` | *"Vertigo with a NORMAL head impulse, a skew deviation, or direction-changing nystagmus is a stroke until proven otherwise — MRI-DWI; do not discharge as labyrinthitis."* | Cerebellar / brainstem stroke (PICA / AICA) (usual) | — |
| C18 | `subcortex_sensorimotor` | *"A deep sensorimotor stroke without cortical signs is small-vessel until proven otherwise — but image to exclude haemorrhage."* | Thalamocapsular lacunar infarct (usual) | — |
| C19 | `skull_base_vii_geniculate` | *"Ramsay Hunt has worse recovery than Bell's — treat zoster early (aciclovir + steroids)."* | Herpes zoster oticus (Ramsay Hunt) (usual) | — |
| C20 | `skull_base_collet_sicard` | *"Four unilateral lower-cranial-nerve palsies point to a skull-base or nasopharyngeal malignancy — image and consider ENT referral."* | Skull base metastasis (usual) | — |
| C21 | `motor_unit_nmj_presynaptic` | *"Lambert-Eaton is paraneoplastic until proven otherwise — screen for small-cell lung cancer (CT chest, smoking history)."* | Small cell lung carcinoma (paraneoplastic LEMS) (usual) | — |
| C22 | `nerve_lat_fem_cutaneous` | *"Purely sensory and benign — but new cases warrant a diabetes check and a look for a compressive cause."* | Meralgia paraesthetica (inguinal ligament entrapment) (usual) | — |
| C23 | `pupil_cn3_ischaemic` | *"Pupil-sparing is reassuring, but recheck the pupil over days and review vascular risk (and ESR/CRP for GCA)."* | Microvascular (diabetic / hypertensive) third-nerve palsy (usual) | — |
| C24 | `pupil_ciliary_ganglion` | *"Benign — but confirm with dilute pilocarpine (denervation supersensitivity) and exclude an efferent CN III cause."* | Holmes-Adie (tonic) pupil (usual) | — |
| C25 | `cortex_operculum` | *"Acute non-fluent aphasia + right hemiparesis is a dominant MCA stroke — time-critical."* | MCA (superior division) infarct (usual) | — |
| C26 | `cortex_watershed_anterior` | *"Preserved repetition with non-fluent aphasia suggests a border-zone infarct — check for carotid stenosis / hypoperfusion."* | Border-zone (watershed) infarct from hypoperfusion (usual) | — |
| C27 | `cortex_watershed_posterior` | *"Preserved repetition with poor comprehension suggests a border-zone infarct or a degenerative aphasia."* | Border-zone (watershed) infarct from hypoperfusion (usual) | — |
| C28 | `cortex_aphasia_global` | *"Global aphasia with hemiplegia is a large dominant MCA stroke — urgent imaging / reperfusion assessment."* | Large MCA territory (or ICA) infarct (usual) | — |
| C29 | `cortex_aphasia_mixed_transcortical` | *"Echolalia with otherwise severe aphasia suggests global border-zone hypoperfusion — look for a haemodynamic cause."* | Global cerebral hypoperfusion (watershed 'isolation of the speech area') (usual) | — |
| C30 | `hypothalamus_lateral` | *"Excessive daytime sleepiness with cataplexy — consider CSF hypocretin and MRI."* | Narcolepsy with cataplexy (orexin/hypocretin loss) (usual) | — |
| C31 | `corpus_callosum_splenium` | *"Splenial signs travel with a left PCA territory lesion (right hemianopia, pure alexia) — image the posterior circulation."* | PCA territory infarct with splenial involvement (usual) | — |
| C32 | `pons_lateral_trigeminal` | *"AICA territory can cause deafness (labyrinthine artery) — a lateral pontine picture warrants posterior-circulation imaging."* | AICA territory infarct involving the trigeminal complex (usual) | — |
| C33 | `cerebrum_diffuse` | **Split.** Stays: *"Coma with no focal signs: check glucose, sodium and a blood gas immediately."* Moves: *"Coma with no focal signs and intact brainstem reflexes is metabolic / diffuse until proven otherwise."* | Metabolic or toxic encephalopathy (usual) | — |
| C34 | `brainstem_aras` | *"Impaired arousal with brainstem signs (extensor posturing, asymmetric / fixed pupils, gaze palsy) is a posterior-circulation emergency — image the vessels."* | Top-of-the-basilar / brainstem infarct (usual) | — |
| C35 | `top_of_basilar` | *"Drowsiness with vertical gaze palsy and visual loss is a basilar-tip occlusion until proven otherwise — CTA now; it is a thrombectomy target, and it is regularly called delirium."* | Top-of-the-basilar embolism (usual) | — |
| C36 | `sympathetic_pancoast` | *"A Horner with hand wasting and arm pain is a Pancoast tumour until proven otherwise — image the lung apex urgently."* | Apical lung (superior sulcus) carcinoma (usual) | — |
| C37 | `skull_base_carotid_space` | *"A painful Horner, alone or with a XII palsy, is a carotid dissection until proven otherwise — urgent vessel imaging (stroke risk)."* | Carotid artery dissection (usual) | — |

### A.2 Stays on the place (P1–P129)

"allowlist" marks the 13 staying flags that use a dangerous phrasing; each is a place claim or a conditional one.

| Row | Flag | Sentence (stays on the place) | Note |
|---|---|---|---|
| P1 | `midbrain_medial` | Crossed midbrain signs can be haemorrhage, not just infarct — image before assuming stroke. | — |
| P2 | `midbrain_lateral` | Posterior circulation imaging is warranted for any crossed midbrain picture. | — |
| P3 | `pons_medial` | Basilar territory disease can progress to locked-in syndrome — watch closely. | — |
| P4 | `medulla_medial` | Bilateral involvement threatens respiration — monitor and image urgently. | — |
| P5 | `medulla_lateral` | Swallowing can fail early — keep nil by mouth until assessed. | — |
| P6 | `cord_hemi` | A structural cord lesion until proven otherwise — urgent MRI; a compressive cause is a surgical emergency. | allowlist: until proven otherwise |
| P7 | `cord_anterior` | A new bilateral cord picture is compression until whole-spine MRI says otherwise; only then does preserved vibration with a dissociated sensory loss point to ASA territory and an aortic or vascular cause. | allowlist: until proven otherwise |
| P8 | `cord_posterior` | Check B12/copper before it becomes irreversible — a treatable cause of a progressive myelopathy. | — |
| P9 | `cord_transverse` | A new bilateral myelopathy with a sensory level is a neurological emergency — MRI the whole cord to exclude compression before anything else. | — |
| P10 | `cord_central` | Sacral sparing + a suspended dissociated loss points intramedullary — MRI the cord; exclude a tumour or Chiari malformation. | — |
| P11 | `cauda_equina` | A surgical emergency — new saddle anaesthesia, bladder dysfunction or bilateral sciatica needs urgent MRI and decompression. | — |
| P12 | `conus_medullaris` | Early symmetric sphincter involvement with UMN signs — urgent MRI of the conus; distinguish from cauda equina as it changes the level imaged. | — |
| P13 | `cortex_mca_inferior.nondominant` | Dense neglect with anosognosia underestimates the deficit — the patient denies it; corroborate and image. | — |
| P14 | `cortex_pca.nondominant` | An isolated hemianopia is easily missed — confrontation-test fields; consider a posterior-circulation cause. | — |
| P15 | `cortex_occipital` | Confrontation-test the fields — an isolated hemianopia is easily overlooked; posterior circulation imaging is warranted. | — |
| P16 | `cortex_parietal.dominant` | A focal cortical syndrome without weakness still needs imaging — tumour and stroke present identically here. | — |
| P17 | `cortex_parietal.nondominant` | Neglect with anosognosia leads patients to deny deficits — corroborate history and examine formally. | — |
| P18 | `cortex_medial_pfc` | Profound apathy / akinetic mutism after SAH or ACA stroke — image the medial frontal lobes. | — |
| P19 | `cortex_orbitofrontal` | New disinhibition / personality change is a frontal sign — image the orbitofrontal region (and consider subfrontal masses). | — |
| P20 | `cortex_temporal` | New olfactory/gustatory hallucinations or episodic fear may be focal seizures — consider EEG and imaging. | — |
| P21 | `bilateral_auditory` | Deafness with a normal audiogram and intact brainstem responses points to bilateral cortical lesions — image both temporal lobes. | — |
| P22 | `bilateral_anterior_temporal` | Acute Klüver-Bucy features with fever / confusion — treat empirically for HSV encephalitis while imaging and doing an LP. | allowlist: treat empirically; Conditional on fever and confusion, so it stays. Wording: with papilloedema the LP must follow imaging — "image, then LP"? |
| P23 | `cortex_fusiform.nondominant` | Acquired prosopagnosia points to the right (or bilateral) fusiform — image the medial occipitotemporal region. | — |
| P24 | `subcortex_thalamus` | Central post-stroke pain is often refractory and misattributed — it is a thalamic sign, not functional. | Teaching point about central pain; it asserts no cause for the picture. |
| P25 | `peripheral_vestibular_labyrinth` | An acute vestibular syndrome with CENTRAL features (direction-changing/gaze-evoked or vertical nystagmus, NORMAL head-impulse, skew) is a posterior-circulation stroke until proven otherwise — image, do not reassure. | allowlist: until proven otherwise, is a <pathology> |
| P26 | `craniocervical_junction_foramen_magnum` | New downbeat nystagmus warrants craniocervical-junction imaging — a Chiari or foramen-magnum lesion is surgically treatable. | — |
| P27 | `pontomesencephalic_tegmentum` | Upbeat nystagmus with other brainstem signs needs urgent imaging; consider thiamine (Wernicke's) empirically if any nutritional risk. | Thiamine is a safety check for the place, conditional on nutritional risk. |
| P28 | `cerebellum_hemisphere` | A space-occupying posterior-fossa lesion can cause brainstem compression and obstructive hydrocephalus — a neurosurgical emergency; image urgently. | — |
| P29 | `cerebellum_vermis` | Truncal ataxia with headache and vomiting in a child suggests a midline posterior-fossa tumour — image and refer. | — |
| P30 | `cerebellum_flocculonodular` | New central (gaze-evoked, direction-changing) nystagmus with imbalance warrants posterior-fossa imaging. | — |
| P31 | `cerebellum_pancerebellar` | A subacute pancerebellar syndrome can be paraneoplastic — screen for an occult malignancy (anti-Yo/Hu/Tr) alongside imaging. | — |
| P32 | `basal_ganglia_subthalamic` | Check glucose — non-ketotic hyperglycaemia is a treatable, striatal cause of acute hemiballismus/hemichorea. | — |
| P33 | `basal_ganglia_substantia_nigra.dominant` | Acute or rapidly progressive hemiparkinsonism is structural until proven otherwise — image the midbrain. | allowlist: until proven otherwise |
| P34 | `basal_ganglia_substantia_nigra.nondominant` | Acute or rapidly progressive hemiparkinsonism is structural until proven otherwise — image the midbrain. | allowlist: until proven otherwise |
| P35 | `basal_ganglia_substantia_nigra.bilateral` | A symmetric, tremor-poor, rapidly progressive or early-falls parkinsonism suggests a Parkinson-plus syndrome — not idiopathic PD. | — |
| P36 | `basal_ganglia_striatum.dominant` | Check glucose — non-ketotic hyperglycaemia is a treatable cause of acute hemichorea/hemiballismus. | — |
| P37 | `basal_ganglia_striatum.nondominant` | Check glucose — non-ketotic hyperglycaemia is a treatable cause of acute hemichorea/hemiballismus. | — |
| P38 | `basal_ganglia_striatum.bilateral` | New chorea warrants a treatable-cause screen (glucose, thyroid, autoimmune, pregnancy/drug history) before attributing it to Huntington's. | — |
| P39 | `basal_ganglia_globus_pallidus` | Young-onset dystonia needs Wilson's disease excluded (copper studies, slit-lamp) — it is treatable. | — |
| P40 | `subcortex_anterior_choroidal` | The full triad from one small perforator can look like a large cortical stroke — the absence of cortical signs points deep; image to confirm. | — |
| P41 | `skull_base_optic_aion` | Altitudinal visual loss with jaw claudication, scalp tenderness or raised ESR/CRP is giant-cell arteritis — start high-dose steroids immediately to save the other eye. | — |
| P42 | `combined_degeneration_scd` | Check B12 (and methylmalonic acid) early — SCD is treatable but irreversible if missed. | — |
| P43 | `skull_base_iam` | Progressive unilateral sensorineural hearing loss with facial palsy needs an MRI of the IAM/CPA. | — |
| P44 | `skull_base_vii_stylomastoid` | Forehead-SPARING facial weakness is an UPPER-motor (central) lesion, not this — re-examine the forehead. | — |
| P45 | `skull_base_petrous_apex` | Gradenigo's triad after otitis media is a surgical emergency — image the petrous apex. | — |
| P46 | `skull_base_sup_orbital_fissure` | Painful ophthalmoplegia can be Tolosa-Hunt, but exclude a mass or aneurysm first — image before steroids. | — |
| P47 | `skull_base_cavernous_sinus` | A septic cavernous sinus thrombosis is an emergency — fever, proptosis and rapidly progressive multi-nerve palsy need urgent imaging and antibiotics. | — |
| P48 | `skull_base_orbital_apex` | In a diabetic or immunocompromised patient, apex syndrome with a black nasal eschar is invasive mucormycosis — a surgical emergency. | — |
| P49 | `skull_base_jugular_foramen` | A pulsatile tinnitus with lower-cranial-nerve palsies suggests a glomus tumour — image the skull base with contrast. | — |
| P50 | `skull_base_hypoglossal_canal` | An isolated XII palsy is a skull-base lesion until proven otherwise — image the clivus and occipital condyle. | allowlist: until proven otherwise |
| P51 | `skull_base_villaret` | The added Horner's places the lesion in the retroparotid/retropharyngeal space — image the deep neck as well as the skull base. | — |
| P52 | `skull_base_cpa` | Unilateral sensorineural hearing loss deserves an MRI of the internal auditory meatus — a schwannoma is eminently treatable when small. | — |
| P53 | `motor_unit_anterior_horn` | New progressive painless weakness with fasciculations and no sensory loss needs urgent neurology — if upper motor neurone signs are also present, think ALS. | — |
| P54 | `motor_unit_nmj_postsynaptic` | A myasthenic crisis with bulbar/respiratory failure is an emergency — watch the forced vital capacity, not just the oxygen saturation. | — |
| P55 | `motor_unit_muscle` | Proximal weakness with a rash or dysphagia may be dermatomyositis — check CK and screen for an underlying malignancy. | — |
| P56 | `root_c5` | Progressive or bilateral cervical radiculopathy — image and exclude a myelopathy (long-tract signs change everything). | — |
| P57 | `root_c6` | C6 and C7 overlap clinically — the reflex (brachioradialis vs triceps) and the affected digit help separate them. | — |
| P58 | `root_c7` | New bilateral or progressive signs, or any long-tract sign, means image to exclude cord compression. | — |
| P59 | `root_c8` | C8/T1 signs with a Horner's suggest a Pancoast tumour — image the lung apex. | — |
| P60 | `root_t1` | Wasting of the hand intrinsics with a Horner's — exclude an apical lung lesion. | — |
| P61 | `root_l2` | Proximal leg weakness with weight loss may be diabetic amyotrophy or a retroperitoneal lesion — image and check glucose. | — |
| P62 | `root_l3` | Knee buckling from quadriceps weakness — assess falls risk; image the high lumbar spine. | — |
| P63 | `root_l4` | Foot drop can be L4/L5 or a peroneal palsy — the knee jerk and dorsiflexion pattern separate them. | — |
| P64 | `root_l5` | Distinguish an L5 root from a common peroneal palsy: L5 also weakens foot inversion and hip abduction, the peroneal nerve does not. | — |
| P65 | `root_s1` | Bilateral S1/S2 signs with saddle anaesthesia or sphincter change is cauda equina — a surgical emergency. | — |
| P66 | `polyneuropathy_length_dependent` | A rapidly ascending or NON-length-dependent pattern (hands before feet, asymmetric, or areflexia out of proportion) points away from a stocking-glove axonopathy — think Guillain-Barré, vasculitis or a demyelinating neuropathy, and act urgently. | — |
| P67 | `polyradiculoneuropathy_acute` | Measure the forced vital capacity, not the oxygen saturation — respiratory failure shows late on the monitor and early in the patient. A sensory level or early sphincter failure means cord compression until an MRI says otherwise. | allowlist: until proven otherwise |
| P68 | `plexus_upper_trunk` | Acute painful upper-limb weakness with patchy wasting may be neuralgic amyotrophy — but exclude traction injury and malignant infiltration. | — |
| P69 | `plexus_lower_trunk` | A lower-trunk plexopathy with a Horner's is a Pancoast tumour until proven otherwise — image the lung apex. | allowlist: until proven otherwise, is a <pathology> |
| P70 | `plexus_lumbar_plexus` | Painful proximal leg weakness with weight loss needs imaging of the retroperitoneum and a diabetes screen. | — |
| P71 | `plexus_sacral_plexus` | A progressive painful sacral plexopathy suggests pelvic malignancy — image the pelvis. | — |
| P72 | `plexus_lumbosacral_plexus` | A painful whole-leg plexopathy with weight loss is diabetic amyotrophy or malignant infiltration until imaging and a diabetes screen say otherwise — and on anticoagulation, image urgently for a haematoma. | allowlist: until proven otherwise |
| P73 | `nerve_axillary` | Check axillary function after every shoulder dislocation/reduction — it is easily missed. | — |
| P74 | `nerve_musculocutaneous` | Isolated musculocutaneous palsy is rare — look for a wider plexus lesion. | — |
| P75 | `nerve_suprascapular` | Deep shoulder pain with external-rotation weakness — image the notch for a ganglion. | — |
| P76 | `nerve_long_thoracic` | Painful winging after a viral illness is often neuralgic amyotrophy — usually recovers, but confirm the pattern. | — |
| P77 | `nerve_radial_axilla` | Triceps weakness + lost triceps jerk marks a lesion above the spiral groove — separate from a C7 root by the intact dermatome/other C7 muscles. | — |
| P78 | `nerve_radial_spiral_groove` | Wrist drop with a preserved triceps jerk localises to the spiral groove, not the axilla. | — |
| P79 | `nerve_radial_pin` | Finger drop with a preserved wrist extension and no sensory loss is the PIN, not a spiral-groove radial palsy. | — |
| P80 | `nerve_median_proximal` | Median weakness that includes pronation and forearm flexors (not just thenar) localises proximal to the carpal tunnel. | — |
| P81 | `nerve_median_ain` | An inability to make the 'OK' sign with no sensory loss is the anterior interosseous nerve. | — |
| P82 | `nerve_median_carpal_tunnel` | Nocturnal hand paraesthesiae with thenar wasting and palmar sparing is carpal tunnel — treat before permanent wasting. | — |
| P83 | `nerve_ulnar_elbow` | Dorsal-hand sensory loss and FDP/FCU weakness localise the ulnar lesion to the elbow, not the wrist. | — |
| P84 | `nerve_ulnar_wrist` | A worse claw with spared FDP and dorsal-hand sensation localises the ulnar lesion to the wrist — the paradox that the distal lesion looks worse. | — |
| P85 | `nerve_femoral` | Femoral palsy with anticoagulation is a retroperitoneal haematoma until proven otherwise — image urgently. | allowlist: until proven otherwise |
| P86 | `nerve_obturator` | Medial-thigh pain with adductor weakness — consider an obturator hernia or pelvic mass. | — |
| P87 | `nerve_superior_gluteal` | A Trendelenburg gait localises to gluteus medius (superior gluteal) or an L5 root — the sensory exam separates them. | — |
| P88 | `nerve_sciatic` | A dense sciatic palsy after hip surgery needs early recognition — the peroneal division is the most vulnerable and may look like an isolated foot drop. | — |
| P89 | `nerve_peroneal_common` | Foot drop with SPARED inversion and hip abduction is peroneal, not L5 — the spared movements are the whole discriminator. | — |
| P90 | `nerve_peroneal_deep` | Foot drop with spared eversion localises below the peroneal bifurcation to the deep branch. | — |
| P91 | `nerve_peroneal_superficial` | Weak eversion with preserved dorsiflexion is the superficial peroneal branch. | — |
| P92 | `nerve_tibial` | Sole numbness with weak toe flexion localises to the tibial nerve — tarsal-tunnel entrapment is treatable. | — |
| P93 | `visual_pathway_chiasm` | Bitemporal field loss with headache or endocrine change — image the sella; acuity/colour loss or apoplexy are emergencies. | — |
| P94 | `visual_pathway_optic_tract` | A homonymous hemianopia WITH an RAPD localises to the optic tract (pre-geniculate), not the occipital cortex. | — |
| P95 | `visual_pathway_lgn` | A wedge/sectoranopia with thalamic sensory signs points to the lateral geniculate. | — |
| P96 | `pupil_cn3_compressive` | A fixed dilated pupil with a third-nerve palsy is a SURGICAL EMERGENCY — image the vessels (CTA/MRA) for an aneurysm now. | — |
| P97 | `pupil_pretectum` | Bilateral light-near dissociation warrants syphilis serology and a look at the dorsal midbrain. | — |
| P98 | `dorsal_midbrain_tectum` | A supranuclear vertical gaze palsy warrants dorsal-midbrain imaging — look for a tectal lesion or early hydrocephalus. | — |
| P99 | `cortex_premotor` | Apraxia with normal power is a cortical (premotor / parietal) sign — image the frontoparietal cortex. | — |
| P100 | `cortex_sma` | A medial frontal / parasagittal lesion — image the interhemispheric frontal region and the ACA territory. | — |
| P101 | `cortex_paracentral` | Bilateral leg weakness with urinary incontinence is a parasagittal lesion until proven otherwise — image the interhemispheric fissure. | allowlist: until proven otherwise |
| P102 | `bilateral_paracentral` | Bilateral leg weakness with urinary incontinence and a normal spine MRI is a parasagittal lesion until proven otherwise — image the brain. | allowlist: until proven otherwise |
| P103 | `cortex_dlpfc` | A dysexecutive syndrome warrants frontal imaging and cognitive assessment. | — |
| P104 | `cortex_arcuate` | Repetition out of proportion to fluency and comprehension points to the arcuate fasciculus. | — |
| P105 | `cortex_angular` | Isolated anomia localises poorly — correlate with the rest of the exam and imaging. | — |
| P106 | `aphasia_subcortical_thalamic` | Aphasia with contralateral sensory loss and no cortical signs points to the dominant thalamus. | — |
| P107 | `aphasia_subcortical_striatocapsular` | Aphasia with a dense contralateral hemiparesis and no cortical signs points to a deep dominant (striatocapsular) lesion. | — |
| P108 | `thalamus_vpm` | Crossed facial sensory loss (contralateral, no ipsilateral brainstem signs) points above the pons — image the thalamus. | — |
| P109 | `thalamus_vl` | A new movement disorder with a deep contralateral lesion — image the thalamus. | — |
| P110 | `thalamus_pulvinar` | Neglect can arise from a deep thalamic lesion as well as the cortex — image both. | — |
| P111 | `thalamus_limbic` | Acute amnesia with a diencephalic lesion — give thiamine before glucose if any nutritional risk (Wernicke). | — |
| P112 | `hypothalamus_supraoptic` | Polyuria with rising sodium after pituitary surgery or head injury is central DI — measure paired serum/urine osmolality. | — |
| P113 | `hypothalamus_thermoregulatory` | Unexplained persistent hyper/hypothermia with other hypothalamic signs — image the hypothalamus. | — |
| P114 | `hypothalamus_ventromedial` | New-onset hyperphagic obesity with visual or endocrine signs — image the suprasellar / hypothalamic region. | — |
| P115 | `hypothalamus_suprachiasmatic` | Persistent circadian disruption with other hypothalamic features warrants imaging. | — |
| P116 | `hypothalamus_mammillary` | Give parenteral thiamine BEFORE glucose in any at-risk patient with confusion / amnesia — Wernicke is a treatable emergency. | — |
| P117 | `hypothalamus_tuberal` | Combined endocrine dysfunction with visual-field loss points to a suprasellar mass — image and check the pituitary axis. | — |
| P118 | `corpus_callosum_anterior` | A one-handed (left) apraxia with alien-hand behaviour is a callosal / medial-frontal lesion — image the interhemispheric region. | — |
| P119 | `guillain_mollaret_triangle` | New palatal tremor warrants MRI looking for hypertrophic olivary degeneration and the causative brainstem/cerebellar lesion. | — |
| P120 | `guillain_mollaret_rubral` | Palatal tremor plus rubral (Holmes) tremor localises to the midbrain — image the dorsal midbrain. | — |
| P121 | `guillain_mollaret_dentate` | Palatal tremor with cerebellar signs points to the dentate / superior cerebellar peduncle — image the cerebellum and its peduncles. | — |
| P122 | `pons_trigeminal` | A trigeminal motor + main-sensory deficit points into the pons — image the brainstem. | — |
| P123 | `skull_base_trochlear_cisternal` | Bilateral trochlear palsy after head trauma suggests a dorsal-midbrain (tectal plate) injury — image it. | — |
| P124 | `midbrain_trochlear` | A CONTRALATERAL (crossed) superior oblique palsy localises into the dorsal midbrain, not the nerve — image the brainstem. | — |
| P125 | `thalamus_bilateral_percheron` | Sudden coma with vertical gaze palsy and a near-normal early CT → suspect a Percheron infarct or deep venous thrombosis; get vascular imaging. | — |
| P126 | `locked_in` | Do not mistake locked-in for coma or a vegetative state — the patient is fully aware; establish a vertical-eye-movement / blink communication channel. | — |
| P127 | `parinaud_dorsal_midbrain` | Vertical gaze palsy + light-near dissociation, especially in a young patient — image the pineal region and ventricles; obstructive hydrocephalus is a neurosurgical emergency. | — |
| P128 | `cord_lateral` | A Horner with suspended sensory loss or long-tract signs → image the cervical cord. | — |
| P129 | `sympathetic_preganglionic` | A preganglionic Horner with C8/T1 wasting or arm pain → image the lung apex for a Pancoast tumour. | — |

## Appendix B — titles that name a pathology

| Row | Place | Now | Proposed |
|---|---|---|---|
| T1 | `subcortex_internal_capsule` | Pure motor lacune (internal capsule) | Pure motor hemiparesis (internal capsule) |
| T2 | `subcortex_corona_radiata` | Corona radiata lacune (pure motor) | Pure motor hemiparesis (corona radiata) |
| T3 | `subcortex_thalamus` | Pure sensory lacune / Déjerine–Roussy (thalamic VPL) | Pure sensory syndrome / Déjerine–Roussy (thalamic VPL) |
| T4 | `subcortex_sensorimotor` | Sensorimotor lacune (thalamocapsular) | Sensorimotor syndrome (thalamocapsular) |
| T5 | `pons_basis_pontis` | Ventral pontine (basis pontis) lacune | Ventral pontine (basis pontis) syndrome |
| T6 | `hypothalamus_mammillary` | Mammillary body syndrome (Wernicke-Korsakoff) | Mammillary body syndrome (diencephalic amnesia) |
| T7 | `sympathetic_pancoast` | Pancoast syndrome (superior sulcus tumour) | Pancoast syndrome (superior sulcus) |
