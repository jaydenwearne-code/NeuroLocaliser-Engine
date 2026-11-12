# Non-dominant hemisphere content — design (2026-11-12)

**Status: RULED 2026-11-12 — "approve as proposed"** (rows K1–K5 and J1–J5, §2). **Content round 1 (§5) is PROPOSED,
awaiting the owner's ruling.** Nothing is built: by K5 and item 2's order, both builds come after "the card follows its
cause" round is built on `fix/card-follows-cause`.

## 1. The defect

The duplicate-keys round (`docs/superpowers/specs/2026-11-12-duplicate-keys-design.md`) fixed every card FACE for the
non-dominant hemisphere: titles, Where lines, red flags and subtitles. Two things beneath the face still read as the dominant
hemisphere:

1. **The What and Next cards.** The cause lists (`CAUSES`), the site workups (`NEXT`) and the plans' per-place wording
   (`bySite`) are keyed by PLACE, so both hemispheres share them.
   - A word list over the 11 places whose picture depends on dominance flagged about 100 lines. Every one was read by hand.
     25 are real errors, all at four places: the operculum (11), the temporoparietal cortex (11), the MCA inferior division
     (2) and the fusiform gyrus (1). Counting the plan lines that leave with a dominant-only cause, that is 28 lines.
   - Two whole causes belong to the dominant side by their own plans' wording: the speech-arrest seizure (*"suggests a
     dominant frontal focus"*) and postictal aphasia. One belongs to the non-dominant side: developmental prosopagnosia,
     which appears on the alexia card.
   - The other hits are contrasts ("unlike…"), already name both sides ("…aphasia (dominant) or neglect (non-dominant)"),
     or presume mildly (row K3).
2. **The aphasia composites.** The thalamic and striatocapsular aphasia composites are built on both sides. Their
   non-dominant copy is exactly a real place without its aphasia:
   - `thalamic_aphasia_*` = the VPL thalamus;
   - `striatocapsular_aphasia_*` = the internal capsule and the corona radiata.

   Neither copy ever leads, but each is listed beside the real place on 5 pictures. A right thalamic lesion in a
   left-dominant patient read *"…also fit: Right thalamus (language)…"*, with *"Thalamic aphasia (dominant thalamus)"* in
   the list.

## 2. The rows (ruled "approve as proposed", 2026-11-12)

| Row | Ruling |
|---|---|
| K1 | **Hemisphere-tagged content.** A cause may carry `hemisphere: "dominant"` or `"nondominant"` (it exists on that side only — the structures' own vocabulary). Any text may be `{ dominant, nondominant }` (the phonebook's variant shape), written only where the sides differ: a cause's feature, a workup line, a plan's per-place slot. The lookups take the dominance and resolve it by `nameForSite()`'s rule, default left, so ~30 call sites pass it through. Rejected: a second content key (writes the shared causes twice — the drift the duplicate-keys round removed); neutral rewording only (cannot take a dominant-only cause off the other side's list). |
| K2 | Scope: the operculum and the temporoparietal cortex, plus the MCA inferior division (2) and the fusiform gyrus (1). |
| K3 | Leave the mild lines: *"track… neglect"* on the dominant parietal card, the temporal lobe's *"memory or language"*, the hypoglycaemia mimic's *"…with aphasia"*, the NIHSS line. |
| K4 | The non-dominant wording is new clinical text, ruled line by line as its own round (§5). |
| K5 | Order: after "the card follows its cause" (both change the same cause entries and app call sites). |
| J1 | The four aphasia composites are dominant-only: never offered in the non-dominant hemisphere (one check where the solver draws its candidates; the composer marks them). |
| J2 | Re-pin `accuracy-mechanisms`' "every site's own picture localises back to it" to the sites the solver offers (it already exempts the cortical copies, whose picture is empty). |
| J3 | **Audit yardstick:** the synonym-swap loop runs over the sites the solver offers. The 4 swap checks generated for the two removed copies go (counted checks 1,097 → 1,093). |
| J4 | **Audit yardstick:** the mirror check, for a picture with no localising claim ("papilloedema alone"), compares that claim (no place on either side) rather than the hidden first place of a full tie. See §4. |
| J5 | `test/hemisphere-names.test.js`: the two OPEN entries close, and a check asserts no dominant-only place is offered in the non-dominant hemisphere. |

## 3. Item 2, measured on a prototype (J1 only, on `1a2af7f`)

- **Cards** (every site id, both sides, a left-dominant patient):
  - 135 Where lines lose the duplicate (and one from the "also fit" count);
  - the copies' own 32 cards disappear;
  - no title, Why, What, Next, red flag or badge changes on any other card.
- **Tests:** one failure, the J2 invariant.
- **Audit:** 5 failures. 4 are the J3 swap checks; 1 is the J4 mirror check. Probes stay 127/127.
- The prototype and its measurements are in the session notes (`nondominant-content-prototype/`).

## 4. Why the mirror check broke (J4)

- **A full tie.** With papilloedema alone nothing is localised, so all 184–188 places tie on every rank key, and the
  solver's last tie-break is the site id in alphabetical order.
- **The id order is not mirror-symmetric.** Sides are a PREFIX in most ids (`left_cortex_angular`) and a SUFFIX in the
  composites' (`aphasia_global_right`).
- **Before: it passed by luck.** Both dominances' first was an aphasia composite (`aphasia_global_right` /
  `aphasia_global_left`), and those mirror.
- **After J1 they are gone.** Left dominance gives `left_cortex_anterior_temporal` first, and right dominance
  `left_cortex_angular`.
- **The check was comparing an arbitrary pick.** The card itself names no place on either side.

## 5. Content round 1 (K4) — PROPOSED, awaiting the owner's ruling

The dominant side keeps every current line word for word. Each row gives the non-dominant version, or a hemisphere tag. A
list must keep at least 6 causes on EACH side (the depth bar), so three rows add a cause that already has an authored plan
(O6, M2) or a new one (F2).

### The operculum (non-dominant: motor aprosodia)

| Row | Where | Non-dominant side (proposed) |
|---|---|---|
| O1 | MCA (superior division) infarct · feature | Abrupt flat, unmodulated speech (motor aprosodia) with face/arm weakness and gaze deviation toward the lesion |
| O2 | Cerebral abscess · feature | Fever and headache with rapidly progressive face/arm weakness and raised inflammatory markers; a ring-enhancing frontal lesion — hunt for the source in the sinuses, teeth, heart or a right-to-left shunt |
| O3 | Demyelination · feature | A younger patient whose weakness or flat, unmodulated speech evolves over days, with prior demyelinating episodes and lesions disseminated in time and space |
| O4 | Tumour (glioma / metastasis) · feature | KEEP as is ("Weeks of progressive speech difficulty…") — true on either side |
| O5 | Focal seizure with speech arrest · the cause | `hemisphere: "dominant"` — its own plan says speech arrest "suggests a dominant frontal focus" |
| O6 | NEW cause, both sides: Focal motor seizure with Todd's paresis (mimic; plan exists) | feature: *Witnessed jerking of the face or arm, then weakness that fades over hours — Todd's paresis imitates the stroke, and the jerking is the clue*. Its plan's operculum entry — flavour: *an opercular focus jerks the face and mouth, and the weakness after it imitates an opercular stroke; ask about the march, which no infarct produces*; level: *face and arm power, and speech, as they recover* |
| O7 | Workup · first-line | Urgent CT head then MRI (DWI) — acute flat speech with face/arm weakness is a stroke until proven otherwise |
| O8 | Workup · immediate | Characterise the speech: words, grammar and comprehension are intact but the tone is flat and unmodulated (motor aprosodia) — easily mistaken for low mood, so ask how the patient feels rather than reading it from their voice |
| O9 | Workup · monitoring | SPEECH AND LANGUAGE THERAPY early, for swallow safety and any dysarthria |
| O10 | Workup · monitoring | Tell staff and family that the flat tone is the deficit, not the patient's mood or attitude |
| O11 | Workup · monitoring | Screen for post-stroke depression by asking directly — flat speech can both hide it and imitate it |
| O12 | Tumour plan · operculum `level` | face and arm power and the tone of speech |
| O13 | Tumour plan · operculum `flavour` | this is non-dominant frontal cortex beside the face-arm motor strip, so motor mapping bears directly on what can be removed; the pre-operative examination of power is a baseline as well as a description |

### The temporoparietal cortex (non-dominant: sensory aprosodia, neglect)

| Row | Where | Non-dominant side (proposed) |
|---|---|---|
| T1 | MCA inferior division infarct · feature | Sudden confusion or agitation with neglect and a field cut, and no weakness — the absence of weakness is why it is so often mistaken for delirium or a psychiatric presentation, and the time window is lost |
| T2 | Delirium · feature | Fluctuating attention with a systemic trigger — a non-dominant temporoparietal stroke imitates it, so look for a CONSISTENT one-sided neglect and a field cut before accepting delirium |
| T3 | Glioma / metastasis · feature | Neglect, a field cut or a change in behaviour progressing over weeks, often with seizures and headache |
| T4 | Transverse or sigmoid sinus thrombosis (vein of Labbe) · feature | Headache and seizures with confusion or neglect, and temporal oedema or haemorrhage that does NOT respect the MCA territory — image the VENOUS sinuses, because the arterial study will be normal and the diagnosis is treatable |
| T5 | Postictal aphasia after a focal temporal seizure · the cause | `hemisphere: "dominant"` (6 causes remain on the non-dominant side) |
| T6 | Workup · first-line | Urgent CT head then MRI (DWI) — acute confusion with neglect and NO weakness is a stroke that is repeatedly missed as delirium |
| T7 | Workup · immediate | Test for neglect and extinction, and whether the patient can tell the emotion in a spoken sentence — the words are understood but the tone is not (sensory aprosodia) |
| T8 | Workup · monitoring | Swallow screen and SPEECH AND LANGUAGE THERAPY for swallow safety; occupational therapy for neglect before mobilising |
| T9 | Workup · monitoring | The patient may deny the deficit (anosognosia) and miss the tone of what is said — check understanding and capacity directly |
| T10 | MCA inferior division infarct plan · temporoparietal `level` | neglect and the visual field |
| T11 | Delirium plan · temporoparietal `flavour` | an acute confusional state imitates a non-dominant temporoparietal stroke, and both produce neglect-like inattention — the fluctuation over hours is what separates them (the MCA inferior division's approved wording, for this place) |

### The MCA inferior division and the fusiform gyrus

| Row | Where | Proposed |
|---|---|---|
| M1 | Focal temporal seizure with postictal aphasia · the cause | `hemisphere: "dominant"` |
| M2 | NEW non-dominant cause: Focal seizure (mimic; plan exists) | `hemisphere: "nondominant"`; feature: *Stereotyped episodes followed by confusion or neglect that fades over hours — a postictal deficit imitates the stroke*. Its plan's MCA-inferior entry — flavour: *confusion with neglect after a seizure imitates a non-dominant inferior-division stroke; the witnessed episode and the fade over hours are what separate them*; level: *document the semiology, and re-test neglect and the field as the patient recovers* |
| M3 | Delirium · feature (non-dominant side) | Fluctuating attention with a systemic trigger (infection, drugs, metabolic upset) — alertness waxes and wanes, whereas a non-dominant inferior-division stroke gives a CONSISTENT one-sided neglect in a fully alert patient |
| F1 | Developmental prosopagnosia · the cause | `hemisphere: "nondominant"` — it is a mimic of prosopagnosia, not of pure alexia |
| F2 | NEW dominant cause: Developmental dyslexia (congenital, routine) | `hemisphere: "dominant"`; feature: *LIFELONG difficulty with reading AND spelling, often with a family history — pure alexia is NEW and spares writing, so a patient who can write but not read back what they wrote has an acquired lesion*. New plan — confirmatory: *IT IS DEVELOPMENTAL: lifelong, with no injury and normal structural imaging; a NEW reading difficulty is an acquired lesion and needs imaging urgently* · *Ask the patient to write a sentence and read it back: in pure alexia they can write but not read it; in developmental dyslexia both are affected* · *Formal literacy assessment rather than self-report*; monitoring: *Reassure that it does not progress* · *Reasonable adjustments in education and work; text-to-speech helps*; referral: *Educational psychology or neuropsychology; neurology only if acquired*. Alternative: accept 5 causes on the dominant fusiform side. |

## 6. The build (after "the card follows its cause")

- **Mechanism (K1).**
  - A `hemisphereOf(site, dominantSide)` helper, by `nameForSite()`'s rule.
  - `causesFor`, `nextStepsFor`, `pathologyNextStepsFor` and the combined views take the dominance and resolve hemisphere
    tags and `{ dominant, nondominant }` texts.
  - `answer.js` and `app.js` pass the card's dominance (`dom` / `domView()`).
- **Guards.**
  - A hemisphere tag is allowed only where the picture depends on dominance (a real restriction).
  - A reviewed snapshot of every hemisphere-specific line, because no wording test can tell a claim from a contrast.
  - Each side keeps at least 6 causes.
  - The pathology gates (every cause has a plan, per-place plans differ, every `bySite` key is reachable) see both sides.
- **Item 2 (J1–J5)** as measured in §3, re-measured on the built round.
