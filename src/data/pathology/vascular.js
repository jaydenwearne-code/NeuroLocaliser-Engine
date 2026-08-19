// vascular.js — pathology workups for the VASCULAR category (ischaemic / haemorrhagic).
//
// The clock is the first investigation in this category, not the scan: for most of these the question
// 'when was the patient last known well' decides what can still be offered.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ ALL SIGNED OFF by the owner (a clinician), 2026-08-18.
//   Tranche 1 — posterior circulation stroke, intracerebral haemorrhage.
//   Tranche 2 — the infarct family (round 1); the four haemorrhage/haematoma families (round 2); venous
//   thrombosis and the vascular malformations (round 2b); and dissection, large-vessel occlusion,
//   compressive aneurysm, perforator disease and central vestibular stroke (round 5).
import { dz, family } from "./builders.js";

// ---- the INFARCT family (tranche 2, round 1) ----
// 28 named infarcts share one clinical argument: the clock, then CT to exclude blood, then the vessel,
// then the cause. What differs is the territory and what you watch. Writing that out 28 times is exactly
// the drift the family builder exists to prevent.
//
// THREE GROUPS DIVERGE FROM THE SPINE and say so explicitly rather than being forced through it:
//   * the four CORD infarcts — the brain reperfusion pathway does not apply at all (full override)
//   * malignant MCA — the decompressive-craniectomy window is the whole point (monitoringExtra)
//   * the posterior-fossa three — swelling obstructs the fourth ventricle (monitoringExtra)
// ---- ROUND 2 (tranche 2): haemorrhage and haematoma ----
// The 31 names matching "haemorrhage|haematoma" are NOT one family. They split into four genuinely
// different first moves, which is the "a family is a clinical claim, not a string match" rule biting:
//   * INTRAPARENCHYMAL — blood inside the brain. Reverse, control pressure, hunt the underlying cause.
//   * COMPRESSIVE (extra-axial) — blood pressing on cord or cortex. The answer is DECOMPRESSION.
//   * RETROPERITONEAL — not intracranial at all. Anticoagulation, CT abdomen, nerve compression.
//   * ANEURYSM / SAH — the bleed is a symptom of a vessel that will bleed again.
// Forcing them through one spine would have produced a plan that is true of none of them.

const INTRAPARENCHYMAL_SPINE = {
  confirmatory: [
    "NON-CONTRAST CT is immediate and diagnostic — here it is not excluding blood, it IS the diagnosis, and it changes the next hour completely",
    "ESTABLISH ANTICOAGULANT AND ANTIPLATELET EXPOSURE AND REVERSE IT — the most time-critical action of all, ahead of any further imaging",
    "CT angiography looking for an underlying vascular lesion and for contrast extravasation within the haematoma, which predicts expansion — {flavour}",
    "THE LOCATION IS THE AETIOLOGY, and it should be read off the first scan: DEEP (basal ganglia, thalamus, pons, cerebellum) says HYPERTENSIVE; LOBAR in an OLDER patient says CEREBRAL AMYLOID ANGIOPATHY; and ANY location in a YOUNG or normotensive patient says look for an ARTERIOVENOUS MALFORMATION, cavernoma or aneurysm until the vessels have been imaged. Here: {aetiology}",
    "Delayed MRI with blood-sensitive sequences once stable, for the cause the acute blood conceals: cavernoma, underlying tumour, or the lobar microbleeds of amyloid angiopathy",
  ],
  monitoring: [
    "SAFETY NET: haematoma EXPANSION happens in the first hours and is the commonest cause of early deterioration — a falling conscious level means repeat imaging immediately, not observation",
    "Blood pressure, conscious level and {level} on a frequent, defined schedule; early intensive blood-pressure lowering is a treatment here, not a background measurement",
    "Swallow screen before anything by mouth, and watch for seizures",
    "Record the SITE and pattern for the discharge summary — a lobar bleed in an older patient raises amyloid angiopathy and changes future anticoagulation decisions permanently",
  ],
  urgency: "emergency",
  referral: "Acute stroke pathway with neurosurgery; critical care if conscious level is falling",
};

const COMPRESSIVE_SPINE = {
  confirmatory: [
    "URGENT MRI of {level} — the question is not whether there is blood but whether it is COMPRESSING something, and that is a surgical question",
    "Reverse anticoagulation immediately and check clotting — most of these occur on anticoagulation, and reversal is what makes surgery possible",
    "Refer to the surgical team IN PARALLEL with the imaging, not after it: {flavour}",
    "Establish the precipitant — trauma, a recent procedure, spinal injection or lumbar puncture — because it changes both the risk of recurrence and the consent conversation",
  ],
  monitoring: [
    "SAFETY NET: the deficit from a compressive haematoma is often REVERSIBLE, and the window is measured in hours — a progressive deficit is a call to theatre, not a reason for another scan",
    "Serial examination of {level} at defined intervals, documented, so progression is visible rather than inferred",
    "Track bladder and bowel function explicitly where the cord or cauda is involved — retention is frequently established before the patient reports it",
  ],
  urgency: "emergency",
  referral: "Emergency neurosurgery or spinal surgery — decompression is time-critical",
};

const RETROPERITONEAL_SPINE = {
  confirmatory: [
    "CT ABDOMEN AND PELVIS — this is not a neurological investigation and it is the one that makes the diagnosis; a femoral or lumbar plexus palsy on anticoagulation is a retroperitoneal bleed until imaged",
    "FBC and clotting urgently, with a haemoglobin that may be falling faster than the patient looks — and reverse the anticoagulation",
    "Examine {level}, and check for the psoas sign: the hip held FLEXED and externally rotated, painful to extend",
    "{flavour}",
  ],
  monitoring: [
    "SAFETY NET: this is a HAEMODYNAMIC emergency before it is a neurological one — pulse, blood pressure and serial haemoglobin outrank the nerve examination in the first hours",
    "Serial examination of {level} — the nerve deficit tracks the expanding haematoma, so a worsening deficit means the bleed is not controlled",
    "Most recover with correction and time rather than surgery, but a deficit that deepens after the bleeding has stopped warrants a surgical opinion",
  ],
  urgency: "emergency",
  referral: "Acute medicine or general surgery with haematology; neurology for the nerve injury once stable",
};

const ANEURYSM_SPINE = {
  confirmatory: [
    "CT ANGIOGRAPHY to find the aneurysm — the bleed is the symptom, the vessel is the diagnosis, and an unsecured aneurysm rebleeds",
    "Where CT is negative but the history is convincing, LUMBAR PUNCTURE at least 12 hours after onset looking for XANTHOCHROMIA — a normal CT does not exclude subarachnoid haemorrhage beyond the first hours",
    "Digital subtraction angiography where CT angiography is negative and the pattern is aneurysmal — {flavour}",
    "Examine {level} and document it before any intervention, since it is the baseline everything afterwards is judged against",
  ],
  monitoring: [
    "SAFETY NET: REBLEEDING is the early killer and VASOSPASM the late one — deterioration in the first hours suggests rebleeding, deterioration at days 4-14 suggests vasospasm, and they are managed in opposite directions",
    "Track {level} and conscious level; a new or worsening focal deficit in the vasospasm window is an indication for urgent imaging, not for sedation",
    "Watch sodium — hyponatraemia is common here and fluid RESTRICTION is the wrong answer, because it worsens vasospasm",
    "Watch for hydrocephalus, which is treatable and presents as a slow decline in conscious level rather than a focal sign",
  ],
  urgency: "emergency",
  referral: "Emergency neurosurgery / neurointervention — an unsecured aneurysm is secured, not observed",
};

// ---- PROMOTED from round 5 on clinical grounds (owner ruling, 2026-08-18) ----
// Cerebral venous thrombosis is the treatable stroke that gets missed, because it breaks every arterial
// rule the reader has been taught: the deficit crosses territories, the patient is young, the CT looks
// wrong for an infarct, and the arterial study is normal. It is also the cause that legitimately fires
// the fundal-photography prompt at the parasagittal sites, so it was already load-bearing in the app
// while having no workup of its own.
//
// CAVERNOUS sinus thrombosis is INCLUDED — it is a dural venous sinus thrombosis and shares the venogram,
// the anticoagulation question and the source hunt — but it overrides heavily, because the orbit and the
// septic source dominate its first hour.
// ---- VASCULAR MALFORMATIONS: the abnormal shunt that is often CURABLE ----
// Closes the loop the aetiology line opened. That line tells the reader "in a young or normotensive
// patient, look for an arteriovenous malformation, cavernoma or aneurysm" — and until 2026-08-18 the app
// had NO arteriovenous malformation anywhere to find, so the instruction pointed at nothing.
//
// What unites these: an abnormal connection or vessel cluster that BLED, or will. The workup question is
// always the same two — what exactly is the lesion, and does treating it carry less risk than leaving it.
// The Chiari and Dandy-Walker entries match the word "malformation" and belong nowhere near this: they
// are structural, not vascular.
const MALFORMATION_SPINE = {
  confirmatory: [
    "CATHETER ANGIOGRAPHY is the reference standard for a shunting lesion — CT and MR angiography can both miss a small fistula, and a normal non-invasive study does not exclude one when the picture is convincing",
    "MRI with blood-sensitive sequences (SWI or gradient-echo) for the lesion itself and for OLD, silent haemorrhage — previous bleeding changes the risk calculation more than any other single finding: {flavour}",
    "Establish whether there is CORTICAL VENOUS DRAINAGE or reflux, since that is what converts an indolent lesion into one that bleeds",
    "Screen for MULTIPLE lesions and for a familial syndrome — multiple cavernomas suggest the familial form, and that changes the conversation with the family as well as the patient",
  ],
  monitoring: [
    "Track {level}, and document a clear baseline: the decision to treat rests on the risk of the NEXT bleed against the risk of the intervention, and that arithmetic needs a starting point",
    "SAFETY NET: a new or worsening deficit, a new headache, or a first seizure means reimaging — a rebleed is the event these lesions are managed to prevent",
    "Seizure risk is substantial for supratentorial lesions: counsel about DRIVING, which is a legal obligation and is routinely forgotten in the discussion about the lesion itself",
    "Management is a multidisciplinary decision — resection, embolisation, radiosurgery or observation — and 'observation' is a legitimate active choice here, not a failure to treat",
  ],
  urgency: "urgent",
  referral: "Neurovascular / neurosurgical multidisciplinary team, with neurointervention",
};

const CVST_SPINE = {
  confirmatory: [
    "CT or MR VENOGRAM — the arterial study will be normal and is not reassurance. If venous thrombosis is being considered at all, the venous phase must be asked for explicitly, because it is not part of a standard stroke protocol",
    "A haemorrhage or oedema that CROSSES ARTERIAL TERRITORIES, or sits where no single artery would put it, is the imaging signature: {flavour}",
    "Hunt the cause: a prothrombotic state, pregnancy or the puerperium, the combined oral contraceptive, dehydration, malignancy, and a LOCAL source such as sinusitis, mastoiditis or a dental infection",
    "Thrombophilia screening has a place, but timing matters — acute thrombosis and anticoagulation both distort the results, so it is usually deferred rather than sent in the first hours",
  ],
  monitoring: [
    "ANTICOAGULATION IS THE TREATMENT EVEN WHERE THERE IS HAEMORRHAGE — this is the counter-intuitive point of the whole diagnosis, and the venous blood is a consequence of the obstruction rather than a contraindication to relieving it",
    "Track {level}, and watch for the deterioration that comes from propagating thrombus rather than from the original lesion",
    "SAFETY NET: raised intracranial pressure is the parallel problem — headache, vomiting, a falling conscious level or visual obscurations mean reimaging, and papilloedema here threatens VISION independently of the stroke",
    "Seizures are common and often the presenting event; treat them, and do not attribute a post-ictal deficit to progression without reimaging",
  ],
  urgency: "emergency",
  referral: "Acute stroke or neurology service, with haematology; neurosurgery if there is mass effect or hydrocephalus",
};

// ---- ROUND 5 (tranche 2): the rest of the vascular red set ----

// ARTERIAL DISSECTION. A tear in the wall, in a patient who is usually YOUNG and has no vascular risk
// factors. Two mechanisms follow from it — distal embolism and local occlusion — and the pain precedes
// the stroke, which is the window everyone misses.
const DISSECTION_SPINE = {
  confirmatory: [
    "ASK ABOUT PAIN AND ITS TIMING — neck, face or occipital pain, often days BEFORE the deficit. That interval is the diagnostic window, and it is routinely dismissed as musculoskeletal or migrainous",
    "CT or MR ANGIOGRAPHY of the neck AND head, with fat-saturated axial T1 for the intramural haematoma — the crescent of blood in the wall is the finding, and a standard angiogram can miss it: {flavour}",
    "Ask about the precipitant: trauma, but also trivial events — coughing, vomiting, sport, chiropractic manipulation, or nothing at all",
    "Examine {level}, and look for a HORNER'S SYNDROME, which accompanies a carotid dissection and is the sign that makes the diagnosis before any imaging",
  ],
  monitoring: [
    "SAFETY NET: the deficit that matters is the EMBOLIC one that follows, and it can arrive days after the pain — a patient sent home with 'neck pain' who returns with a stroke is the pattern this diagnosis is known for",
    "Track {level}; antithrombotic treatment is the mainstay and the choice between antiplatelet and anticoagulation is a specialist one, but starting something promptly matters more than which",
    "Where the dissection extends INTRACRANIALLY, subarachnoid haemorrhage becomes a risk and anticoagulation becomes hazardous — so the extent changes the treatment",
    "Screen for a connective-tissue disorder where there is no trauma, recurrence, or a family history — fibromuscular dysplasia, Ehlers-Danlos and Marfan syndrome all present this way",
  ],
  urgency: "emergency",
  referral: "Acute stroke pathway with neurointervention; vascular surgery where the aorta or subclavian is involved",
};

// LARGE-VESSEL OCCLUSION, STENOSIS AND GLOBAL HYPOPERFUSION. The lesion is proximal and the deficit is
// downstream — so imaging the brain alone answers the wrong question. THE VESSEL IS THE DIAGNOSIS.
const LVO_SPINE = {
  confirmatory: [
    "CT ANGIOGRAPHY FROM ARCH TO VERTEX — the plain scan shows the consequence, the angiogram shows the cause, and only the second decides whether thrombectomy is possible",
    "Establish the TIME LAST KNOWN WELL before anything else; and where the window is uncertain, PERFUSION imaging may still identify salvageable tissue",
    "Define the MECHANISM, because it dictates prevention: cardiac rhythm monitoring for atrial fibrillation, echocardiography, and imaging of the carotid and vertebral origins — {flavour}",
    "Examine {level}, and check blood pressure in BOTH arms plus the peripheral pulses where an arch or subclavian lesion is possible",
  ],
  monitoring: [
    "SAFETY NET: a FLUCTUATING or stepwise deficit in large-vessel disease means the territory is being perfused marginally — lying the patient FLAT and avoiding hypotension is a treatment, and sitting them up can extend the infarct",
    "Track {level} frequently; deterioration means reimaging for extension, malignant oedema or haemorrhagic transformation",
    "Blood pressure management here is the reverse of the usual instinct while the vessel is occluded: permissive hypertension supports collateral flow until reperfusion is achieved",
    "Secondary prevention starts on the ward, not in clinic — antithrombotics, lipids, glucose, and the carotid intervention decision all have their own clocks",
  ],
  urgency: "emergency",
  referral: "Acute stroke pathway with neurointervention; vascular surgery for carotid intervention",
};

// ANEURYSM CAUSING MASS EFFECT rather than haemorrhage. The deficit is the WARNING, and the window before
// rupture is what the whole workup exists to use.
const COMPRESSIVE_ANEURYSM_SPINE = {
  confirmatory: [
    "URGENT CT or MR ANGIOGRAPHY — a compressive cranial neuropathy from an aneurysm is a WARNING of imminent rupture, and the interval before it is the reason this cannot wait for an outpatient scan",
    "Where non-invasive imaging is negative and the clinical picture is convincing, CATHETER ANGIOGRAPHY: a small aneurysm can be missed, and the consequence of missing it is subarachnoid haemorrhage",
    "Examine {level} with particular attention to the PUPIL — {flavour}",
    "Assess the aneurysm's size, site and morphology with the neurovascular team, since these determine whether clipping or coiling is appropriate",
  ],
  monitoring: [
    "SAFETY NET: a NEW SEVERE HEADACHE in a patient with a known unsecured aneurysm is a sentinel bleed until proven otherwise — CT then lumbar puncture for xanthochromia, and do not attribute it to the known lesion",
    "Track {level}: a progressing compressive deficit suggests the aneurysm is enlarging, which raises the rupture risk further",
    "Once SECURED, the neurological deficit may recover over weeks to months — recovery is better the earlier the aneurysm is treated, which is another reason speed matters",
    "Screen first-degree relatives where there is a family history of aneurysm or subarachnoid haemorrhage",
  ],
  urgency: "emergency",
  referral: "Emergency neurosurgery and neurointervention — an unsecured symptomatic aneurysm is secured, not observed",
};

// PERFORATOR DISEASE. Small vessels, big consequences, and a course that FLUCTUATES and progresses over
// hours to days — which is why these are repeatedly discharged after a normal early scan.
const PERFORATOR_SPINE = {
  confirmatory: [
    "EARLY IMAGING IS OFTEN NORMAL — a small perforator infarct may not appear on DWI for hours, and a normal early scan in a convincing story is not reassurance. Repeat it rather than reconsidering the diagnosis",
    "MRI with DWI, and vessel imaging to distinguish a true small-vessel lacune from BRANCH ATHEROMATOUS DISEASE at the perforator's ORIGIN — the second behaves differently and is not the same illness: {flavour}",
    "Full stroke work-up regardless, since a proximal plaque occluding a perforator origin is an atherosclerotic rather than a small-vessel problem",
    "Examine {level} repeatedly and document each time — the trajectory is the diagnostic information here",
  ],
  monitoring: [
    "SAFETY NET: THIS IS THE GROUP THAT DETERIORATES AFTER ADMISSION. Stuttering, fluctuating or stepwise progression over hours to days is characteristic, and a patient who was mild on arrival can be severely disabled by day two",
    "Track {level} hourly while it is fluctuating; avoid hypotension and keep the patient FLAT, because perfusion of a marginal territory is pressure-dependent",
    "Reimage on progression — and reconsider the mechanism, since progression suggests branch atheroma or a proximal source rather than simple lipohyalinosis",
    "Counsel honestly at the outset that worsening over the first days is expected rather than a complication, so that neither the family nor the team treats it as an error",
  ],
  urgency: "emergency",
  referral: "Acute stroke pathway",
};

// CENTRAL CAUSES OF THE ACUTE VESTIBULAR SYNDROME. The whole point is that the BEDSIDE EXAMINATION
// outperforms early imaging here, which is the opposite of the reader's instinct.
const CENTRAL_VESTIBULAR_SPINE = {
  confirmatory: [
    "HINTS AT THE BEDSIDE OUTPERFORMS EARLY MRI in the acute vestibular syndrome: a NORMAL head impulse, direction-changing nystagmus, or skew deviation each point CENTRAL, and together they are more sensitive than DWI in the first 48 hours",
    "MRI with DWI is still needed, but a NEGATIVE early scan does NOT exclude a posterior-fossa stroke — up to a fifth are missed in the first day, so a central examination outranks a normal scan: {flavour}",
    "CT or MR angiography of the vertebrobasilar circulation, looking for dissection and for basilar disease",
    "Examine {level}, and specifically test whether the patient can SIT OR WALK UNAIDED — inability to do so in an acute vestibular syndrome is a central sign and is easy to omit from the bed",
  ],
  monitoring: [
    "SAFETY NET: a fluctuating posterior-circulation picture can herald BASILAR OCCLUSION, and posterior-fossa infarcts swell at 2-4 days — deterioration in conscious level is a neurosurgical emergency, not a nursing observation",
    "Track {level}; and watch for the hydrocephalus that follows fourth-ventricle compression",
    "Do not let a diagnosis of peripheral vertigo be made by the absence of other signs alone — the commonest error is treating a stroke as labyrinthitis because nothing else was found on a limited examination",
    "Swallow screen before anything by mouth where the brainstem may be involved",
  ],
  urgency: "emergency",
  referral: "Acute stroke pathway; neurosurgery if posterior-fossa swelling develops",
};

const INFARCT_SPINE = {
  confirmatory: [
    "Establish the TIME LAST KNOWN WELL before anything else — it is what decides whether reperfusion is on the table, and it cannot be reconstructed later",
    "Non-contrast CT first to exclude haemorrhage, then CT angiography from arch to vertex for a large-vessel occlusion",
    "MRI with DWI where the diagnosis is uncertain or the CT is normal — {flavour}",
    "Aetiology work-up once the diagnosis is secure: cardiac rhythm monitoring for atrial fibrillation, echocardiography, carotid or vertebral imaging, and a vascular risk profile",
  ],
  monitoring: [
    "Swallow screen before anything by mouth — the single most preventable early complication",
    "Neurological observations tracking {level}, on a defined schedule rather than as needed",
    "SAFETY NET: any deterioration in conscious level or new deficit means immediate reimaging for haemorrhagic transformation or extension, not observation",
    "Glucose, temperature and blood pressure are treatments here, not background measurements",
  ],
  urgency: "emergency",
  referral: "Acute stroke pathway — time-critical, and reperfusion may be on the table",
};

// The cord has no equivalent of the brain reperfusion pathway, and the commonest cause is aortic rather
// than cardioembolic. Built per-member so the four do not emit identical text (which the invariant would
// and should reject).
const cordInfarct = (where, clue) => [
  `MRI ${where} — but a NORMAL early MRI DOES NOT EXCLUDE IT: cord infarction is frequently occult in the first hours, and the clinical picture outranks the scan`,
  "Image the AORTA — aortic dissection, aneurysm and recent aortic surgery are the classic causes, and dissection is the one that kills while the cord is being investigated",
  clue,
  "Once compression is excluded, exclude the inflammatory mimic: CSF, aquaporin-4 and MOG antibodies — a transverse myelitis is treatable and looks similar at the bedside",
];

export default {
  // ---- ROUND 5 SINGLETONS ----

  // A vascular event inside a pituitary lesion. Sight and life are both at stake, and the treatment is
  // endocrine before it is surgical.
  "Pituitary apoplexy": dz("Pituitary apoplexy", {
    confirmatory: [
      "GIVE STEROIDS FIRST, IMAGE SECOND. Acute adrenal insufficiency is what kills here, the treatment is safe, and waiting for confirmation is the error this diagnosis is known for",
      "URGENT PITUITARY MRI — CT frequently misses the haemorrhage, so a normal CT does not exclude it in a patient with the syndrome",
      "FULL PITUITARY AXIS BLOODS TAKEN BEFORE STEROIDS where that causes no delay: cortisol, thyroid, prolactin and gonadal axis — but never delay treatment to obtain them",
      "Examine {level} — acuity, colour vision, FORMAL FIELDS and each eye movement, since the expanding lesion takes the chiasm and the cavernous sinus contents together",
    ],
    monitoring: [
      "SAFETY NET: sudden severe headache with visual loss and ophthalmoplegia is the syndrome, and it is regularly admitted as subarachnoid haemorrhage or meningitis — a normal CT and a normal CSF should send you to the pituitary rather than to the ward",
      "Track {level} and the fields at defined intervals: deteriorating vision is the main indication for urgent decompression, and the recovery is better the earlier it happens",
      "Watch SODIUM and fluid balance; and remember that most survivors need lifelong hormone replacement, which is the part that gets lost at discharge",
    ],
    urgency: "emergency",
    referral: "Endocrinology and neurosurgery together, with ophthalmology — steroids do not wait for either",
    bySite: {
      visual_pathway_chiasm: {
        level: "FORMAL visual fields and acuity, both eyes",
        flavour: "upward expansion takes the chiasm — a bitemporal defect appearing over hours rather than months, which is what marks it as apoplexy rather than an adenoma discovered late",
      },
      pupil_cn3_compressive: {
        level: "the third nerve including the PUPIL, and the other cavernous nerves",
        flavour: "lateral expansion into the cavernous sinus takes III first — a painful third-nerve palsy here is apoplexy rather than an aneurysm, and the pituitary is where to look on the scan",
      },
    },
  }),

  // The one cause of visual loss where treatment saves the OTHER eye, and the window is measured in hours.
  "Arteritic AION — giant-cell arteritis": dz("Arteritic AION — giant-cell arteritis", {
    confirmatory: [
      "ESR AND CRP IMMEDIATELY, and START HIGH-DOSE STEROIDS ON SUSPICION — the second eye is what is being protected, it can go within days, and the loss is permanent. Treatment does not wait for the biopsy",
      "TEMPORAL ARTERY BIOPSY within about the first fortnight of starting steroids — the yield persists that long, so treatment first and biopsy second is the correct order, and a long segment is taken because skip lesions are common",
      "Ask the questions that make the diagnosis and are not volunteered: JAW CLAUDICATION (the most specific), scalp tenderness, temporal headache, and the proximal ache of polymyalgia rheumatica",
      "Examine {level} — acuity, colour vision, the pupil and the DISC. A pale, swollen disc distinguishes the arteritic form from the non-arteritic, in which the disc is hyperaemic",
    ],
    monitoring: [
      "SAFETY NET: TRANSIENT visual loss or diplopia in this context is the warning before permanent infarction — it is an emergency in its own right and must not be triaged as a symptom that has resolved",
      "Track {level} in BOTH eyes; the fellow eye is the one the treatment exists to save",
      "Steroids here run for many months with a slow taper, so bone protection, glucose monitoring and gastric protection are part of the plan from day one rather than afterthoughts",
      "Watch for the large-vessel complications — aortitis and aneurysm — which develop later and are missed once the eye has stabilised",
    ],
    urgency: "emergency",
    referral: "Same-day ophthalmology and rheumatology — steroids before either",
  }),

  // A structural lesion at the sympathetic outflow, listed here because it presents as a Horner's.
  "Cervical cord or T1-T2 lesion": dz("Cervical cord or T1-T2 lesion", {
    confirmatory: [
      "MRI of the cervical cord and cervicothoracic junction — a preganglionic Horner's from a CENTRAL lesion means the cord itself, and the level is where the sympathetic outflow leaves",
      "Examine {level}, and look for the long-tract signs that distinguish a cord lesion from an apical or neck cause — a Horner's WITH pyramidal signs is intramedullary until imaged",
      "Ask about ANHIDROSIS and its extent: a preganglionic lesion affects the face, which is what separates it from a postganglionic one",
      "Consider the causes at this level — syringomyelia, demyelination, intramedullary tumour, and trauma — which look identical at the pupil and different on the scan",
    ],
    monitoring: [
      "SAFETY NET: a Horner's syndrome is never a diagnosis, only a localiser — the work-up is not complete until the level is established, and the causes at each level run from benign to lethal",
      "Track {level}; a progressive cord deficit changes the urgency regardless of what the pupil is doing",
      "Where a syrinx is found, look above it for the craniocervical junction abnormality that usually causes it",
    ],
    urgency: "urgent",
    referral: "Neurology with neurosurgery or spinal surgery as the cause dictates",
  }),

  // ---- ARTERIAL DISSECTION ----
  ...family("arterial-dissection", DISSECTION_SPINE, {
    "Carotid artery dissection": {
      slots: { level: "the lower cranial nerves and the sympathetic supply",
               flavour: "a painful HORNER'S with lower cranial nerve palsies and no other explanation is a carotid dissection until the neck angiogram says otherwise — the nerves are stretched over the expanded vessel" },
      bySite: {
        skull_base_carotid_space: { level: "IX, X, XI, XII and the pupil together" },
        skull_base_villaret:      { level: "the four lower nerves WITH a Horner's — the retroparotid combination" },
      },
    },
    "Internal carotid artery dissection": {
      slots: { level: "the hemispheric deficit, plus the pupil and lid for a Horner's",
               flavour: "the classic triad is unilateral head or neck pain, a partial Horner's, and cerebral ischaemia hours to days later — any two of the three should trigger the angiogram" },
    },
    "Carotid dissection or aneurysm": {
      slots: { level: "tongue movement, with the pupil and the neck",
               flavour: "the hypoglossal nerve crosses the carotid, so an isolated tongue palsy with neck pain points at the vessel rather than at the skull base" },
    },
    "Carotid or ophthalmic artery dissection": {
      slots: { level: "acuity, the fundus, and the pupil",
               flavour: "TRANSIENT MONOCULAR VISUAL LOSS with neck pain in a young patient is a dissection until imaged — and the retinal examination may show the embolus that came from it" },
    },
    "Vertebral artery dissection": {
      slots: { level: "the crossed brainstem signs, and the neck for pain",
               flavour: "OCCIPITAL or posterior neck pain preceding a lateral medullary syndrome — and in a young patient with a Wallenberg picture, dissection is more likely than atherosclerosis" },
    },
    "Vertebral dissection": {
      slots: { level: "tongue, swallow and the long tracts",
               flavour: "the vertebral supplies the medial medulla through its perforators, so a medial medullary syndrome in a young patient warrants the same neck angiogram" },
    },
    "Vertebral artery occlusion or dissection": {
      slots: { level: "all the medullary functions — swallow, tongue, and the crossed pattern",
               flavour: "occlusion and dissection produce the same deficit; the angiogram separates them, and only dissection changes the antithrombotic conversation and the advice about neck manipulation" },
    },
    "Basilar artery dissection": {
      slots: { level: "conscious level, eye movements and all four limbs",
               flavour: "dissection of the basilar is rare and dangerous — it can occlude perforators progressively, and intracranial extension makes anticoagulation hazardous because of the subarachnoid risk" },
      bySite: {
        pons_medial:            { level: "eye movements, facial power and swallow" },
        locked_in_ventral_pons: { level: "VERTICAL eye movements and blinking — the only channel left" },
      },
    },
  }),

  // ---- LARGE-VESSEL OCCLUSION, STENOSIS AND HYPOPERFUSION ----
  ...family("large-vessel-occlusion", LVO_SPINE, {
    "Basilar artery occlusion": {
      slots: { level: "conscious level, pupils, eye movements and all four limbs",
               flavour: "the deadliest occlusion and the most often missed, because it presents as confusion, dizziness or fluctuating drowsiness rather than as a hemiparesis" },
      monitoringExtra: ["A FLUCTUATING posterior-circulation picture is basilar thrombosis until the angiogram says otherwise — the fluctuation is the warning, not the reassurance, and the window for intervention is wider here than in the anterior circulation"],
      bySite: {
        pons_hemi:              { level: "all four limbs, eye movements and conscious level" },
        locked_in_ventral_pons: { level: "vertical gaze and blinking — and ESTABLISH COMMUNICATION before assuming the patient is unaware" },
      },
    },
    "Top-of-the-basilar embolism": {
      slots: { level: "conscious level, pupils, vertical gaze and the visual fields",
               flavour: "a bewildering mixture of visual, oculomotor and behavioural signs with PRESERVED POWER — the pattern itself is the diagnosis, and it is regularly called delirium" },
    },
    "Top-of-the-basilar occlusion": {
      slots: { level: "conscious level, the third nerve and all four limbs",
               flavour: "distal basilar occlusion strikes the midbrain and both thalami at once, which is why bilateral signs with preserved power should send you to the vessel" },
    },
    "Proximal MCA (M1) / carotid-T occlusion": {
      slots: { level: "gaze deviation, power, language and the field",
               flavour: "the archetypal thrombectomy target — a dense hemiparesis with gaze deviation and cortical signs, where the angiogram rather than the plain CT decides what happens next" },
    },
    "Severe carotid stenosis or occlusion": {
      slots: { level: "PROXIMAL limb power, and blood pressure",
               flavour: "a border-zone pattern means the mechanism is HAEMODYNAMIC — so the question is what dropped the perfusion, and the carotid is where to look" },
      bySite: {
        cortex_watershed_anterior:  { level: "proximal arm and leg — the man-in-a-barrel pattern" },
        cortex_watershed_posterior: { level: "the visual field and higher visual processing" },
      },
    },
    "Critical carotid stenosis or occlusion": {
      slots: { level: "language — specifically REPETITION, which is preserved",
               flavour: "a transcortical picture with preserved repetition means the perisylvian language cortex is spared while everything around it is not — the 'isolation of the speech area' of severe hypoperfusion" },
    },
    "Global cerebral hypoperfusion (watershed 'isolation of the speech area')": {
      slots: { level: "repetition against spontaneous speech and comprehension",
               flavour: "the patient echoes but cannot generate or understand — a striking and specific sign that the whole border zone around the language cortex has been under-perfused" },
    },
    "Cardiac arrest / profound global hypoperfusion": {
      slots: { level: "conscious level, brainstem reflexes and the visual fields",
               flavour: "hypoxic-ischaemic injury affects the watershed and the selectively vulnerable regions — and PROGNOSTICATION must not be attempted early, since sedation, hypothermia and organ failure all confound the examination" },
      confirmatoryExtra: ["Multimodal prognostication no earlier than the accepted interval after rewarming and off sedation — clinical examination, EEG, somatosensory evoked potentials and neuron-specific enolase together, never a single test"],
    },
    "Moyamoya disease": {
      slots: { level: "the deficit and its RELATION TO HYPERVENTILATION or crying in a child",
               flavour: "progressive stenosis of the distal carotids with a basal collateral network — the 'puff of smoke' on angiography, and in children it presents with ischaemia while in adults it more often bleeds" },
      confirmatoryExtra: [
        "CATHETER ANGIOGRAPHY defines the collateral pattern and stages the disease — this is one place where non-invasive imaging is genuinely not enough, because surgical planning depends on it",
        "Avoid HYPERVENTILATION and dehydration, both of which precipitate ischaemia here — and mention it explicitly to anaesthetics before any procedure",
      ],
      bySite: {
        cortex_aphasia_mixed_transcortical: { level: "repetition against spontaneous speech" },
        cortex_watershed_anterior:          { level: "proximal limb power" },
      },
      urgency: "urgent",
      referral: "Neurosurgery with a cerebrovascular service — revascularisation is the definitive treatment",
    },
    "Anterior choroidal or carotid-origin atherosclerosis": {
      slots: { level: "power, sensation and the visual field — the triad of that territory",
               flavour: "the anterior choroidal artery arises from the internal carotid, so its territory infarct warrants imaging the CAROTID rather than being filed as small-vessel disease" },
    },
    "Carotid atherosclerosis with artery-to-artery embolism": {
      slots: { level: "acuity and the FUNDUS, looking along the arterioles",
               flavour: "a bright refractile plaque at an arteriolar bifurcation is a Hollenhorst plaque — visible proof of the embolic source, and an indication to image the carotid urgently" },
      confirmatoryExtra: ["Transient monocular visual loss is a TIA of the eye and carries the same early stroke risk as any other TIA — the carotid work-up is urgent, not routine"],
    },
    "Cardioembolism (atrial fibrillation, valve disease, endocarditis)": {
      slots: { level: "the fundus and acuity, with a full cardiac examination",
               flavour: "a retinal embolus with a murmur or an irregular pulse redirects the work-up to the HEART — and endocarditis in particular changes everything about the antithrombotic decision" },
      confirmatoryExtra: ["Blood cultures and echocardiography where endocarditis is possible: anticoagulating an infected embolic source risks haemorrhage, so the diagnosis must come before the treatment"],
    },
    "Cardioembolism": {
      slots: { level: "power, sensation and the field together",
               flavour: "an embolus lodging in a deep territory rather than a cortical one — prolonged rhythm monitoring is what finds the paroxysmal atrial fibrillation a single ECG misses" },
    },
  }),

  // ---- ANEURYSM CAUSING MASS EFFECT ----
  ...family("compressive-aneurysm", COMPRESSIVE_ANEURYSM_SPINE, {
    "Posterior communicating artery aneurysm": {
      slots: { level: "the third nerve, and the PUPIL above all",
               flavour: "the pupillary fibres run superficially, so an aneurysm compressing the third nerve DILATES THE PUPIL — a painful third-nerve palsy with a fixed pupil is this until the angiogram excludes it" },
    },
    "Internal carotid aneurysm": {
      slots: { level: "the visual FIELDS formally, plus acuity",
               flavour: "a carotid or ophthalmic-segment aneurysm compresses the chiasm or optic nerve — and the field defect may be asymmetric and atypical rather than the textbook bitemporal pattern" },
    },
    "Carotid aneurysm": {
      slots: { level: "III, IV, VI and the V1/V2 territories one at a time",
               flavour: "within the cavernous sinus an aneurysm produces a painful ophthalmoplegia — and rupture here gives a carotid-cavernous fistula rather than subarachnoid haemorrhage, which is a different emergency" },
    },
    "Aortic arch or subclavian artery aneurysm": {
      slots: { level: "the pupil and lid, plus facial sweating and the arm",
               flavour: "a preganglionic Horner's with arm symptoms points BELOW the neck — image the chest, and check the blood pressure in both arms" },
      referral: "Vascular or cardiothoracic surgery urgently, with neurology for the sympathetic deficit",
    },
    "Aortic arch aneurysm or cardiac enlargement (Ortner's syndrome)": {
      slots: { level: "voice and swallow, with laryngoscopy",
               flavour: "ORTNER'S SYNDROME — the left recurrent laryngeal nerve compressed between the aorta and pulmonary artery by an aneurysm or an enlarged left atrium. A cardiac cause of hoarseness, and one nobody looks for" },
      confirmatoryExtra: ["Echocardiography as well as CT: a dilated left atrium in mitral disease compresses the same nerve, and that is a cardiological rather than a surgical problem"],
      urgency: "urgent",
      referral: "Cardiology and cardiothoracic surgery, with ENT for the voice",
    },
  }),

  // ---- PERFORATOR DISEASE ----
  ...family("perforator-disease", PERFORATOR_SPINE, {
    "Capsular warning syndrome": {
      slots: { level: "power in face, arm and leg, with NO cortical signs",
               flavour: "REPEATED, stereotyped, fully resolving pure-motor episodes over hours — an unstable perforator that is about to complete, and one of the highest early-stroke-risk presentations there is" },
      monitoringExtra: ["ADMIT. These episodes recur and a large proportion end in a completed capsular infarct within days — this is not a TIA to be worked up as an outpatient"],
    },
    "Branch atheromatous disease of the lenticulostriate origin": {
      slots: { level: "power across face, arm and leg equally",
               flavour: "a plaque at the ORIGIN of the perforator rather than disease within it — the infarct extends to the ventricular surface, which is the imaging clue, and it behaves like large-vessel disease" },
    },
    "Basilar perforator disease with progression": {
      slots: { level: "power, eye movements and swallow, hourly",
               flavour: "a paramedian pontine infarct reaching the ventral surface — this is the classic stuttering deficit that worsens over the first day and is repeatedly attributed to something else" },
    },
  }),

  // ---- CENTRAL CAUSES OF THE ACUTE VESTIBULAR SYNDROME ----
  ...family("central-vestibular-stroke", CENTRAL_VESTIBULAR_SPINE, {
    "Posterior circulation stroke (the must-not-miss)": {
      slots: { level: "gaze holding, skew, and truncal stability",
               flavour: "a peripheral-looking acute vestibular syndrome that is actually a stroke — the reason the whole HINTS examination exists" },
    },
    "Cerebellar / brainstem stroke (PICA / AICA)": {
      slots: { level: "gaze-evoked nystagmus, limb coordination and gait",
               flavour: "PICA gives vertigo with ataxia, AICA adds HEARING LOSS — and deafness with vertigo is a brainstem stroke sign, not a reason to diagnose labyrinthitis" },
    },
    "Vertebrobasilar TIA": {
      slots: { level: "the deficit at the time, and whether it has fully resolved",
               flavour: "RECURRENT brief episodes of vertigo with other posterior-circulation symptoms — isolated recurrent vertigo can be a TIA, and it is the warning before the completed stroke" },
      monitoringExtra: ["Treat this as a stroke warning rather than a benign episode: the early recurrence risk is front-loaded into the first days, so the work-up is urgent and admission is often appropriate"],
    },
    "Central lesion causing DOWNBEAT nystagmus": {
      slots: { level: "the nystagmus in different gaze positions, plus gait and coordination",
               flavour: "DOWNBEAT nystagmus is a CRANIOCERVICAL JUNCTION or floccular sign and is never peripheral — the differential is Chiari, cerebellar degeneration, stroke, and drugs, so image the junction" },
      confirmatoryExtra: ["Review the DRUG CHART: lithium, phenytoin and carbamazepine all produce downbeat nystagmus, and stopping the drug is easier than anything else on this list"],
      urgency: "urgent",
    },
  }),

  ...family("vascular-malformation", MALFORMATION_SPINE, {
    "Arteriovenous malformation": {
      slots: { level: "the focal deficit and any seizure activity",
               flavour: "a nidus with feeding arteries and draining veins, and flow voids on MRI — the Spetzler-Martin grade (size, eloquence, venous drainage) is what the surgical conversation turns on" },
      confirmatoryExtra: ["An UNRUPTURED arteriovenous malformation is a genuinely contested treatment decision, and intervening is not automatically better than observing — this belongs in a specialist discussion, not in a first-line plan"],
      bySite: {
        cortex_occipital:     { level: "the visual field, formally" },
        cortex_parietal:      { level: "cortical sensation, neglect and the field" },
        cerebellum_hemisphere:{ level: "limb coordination and conscious level",
                                flavour: "in the posterior fossa the MASS EFFECT on the fourth ventricle threatens life before the malformation itself does, so the acute question is surgical rather than endovascular" },
      },
    },
    "Dural arteriovenous fistula": {
      slots: { level: "the focal deficit, and ask directly about the tinnitus",
               flavour: "a shunt within the DURA rather than the parenchyma — often invisible on routine MRI, which is why the catheter angiogram matters here more than anywhere else in this family" },
      confirmatoryExtra: [
        "ASK ABOUT PULSATILE TINNITUS and auscultate over the mastoid and orbit — it is the symptom patients do not think to mention and the one that makes the diagnosis",
        "The grading that matters is whether it drains into CORTICAL VEINS: without that it is a nuisance, with it the annual haemorrhage risk is substantial and treatment is usually recommended",
      ],
      bySite: {
        cortex_temporal:  { level: "language, seizures, and the tinnitus" },
        cortex_occipital: { level: "the visual field, and the tinnitus" },
      },
    },
    "Spinal dural arteriovenous fistula": {
      slots: { level: "gait, sphincter function and the sensory level",
               flavour: "the commonest spinal vascular malformation and the most missed — a slowly PROGRESSIVE myelopathy in a middle-aged or older man, worse with exertion or standing, with cord oedema and serpiginous flow voids on the dorsal surface" },
      confirmatory: [
        "MRI of the whole cord: T2 hyperintensity extending over several segments with dilated perimedullary vessels on the DORSAL surface — the flow voids are the finding, and they are missed if only the symptomatic level is imaged",
        "SPINAL CATHETER ANGIOGRAPHY is required to find the feeding segmental artery and is what makes treatment possible — MRA is a screening test, not a substitute",
        "This is repeatedly mistaken for transverse myelitis and treated with steroids, which can make it WORSE — a progressive myelopathy that deteriorated on steroids should send you back to look for a fistula",
        "Ask about exertional or postural worsening, which reflects venous hypertension and is the historical clue",
      ],
      monitoringExtra: ["Deficits become irreversible with time because the mechanism is chronic venous congestion, so the delay to diagnosis is itself the prognosis — this is a diagnosis to make early rather than confidently"],
      referral: "Neurointervention and spinal neurosurgery — it is treatable, and often curable, by embolisation or ligation",
      bySite: {
        cord_anterior: {
          level: "gait, power and the sensory level, with the ANTERIOR cord pattern",
          flavour: "venous congestion hits the anterior cord hardest because it is the watershed — so the picture imitates an anterior spinal artery syndrome, but arrives over months rather than minutes",
        },
        conus_medullaris: {
          level: "sphincter function and saddle sensation FIRST, then the legs",
          flavour: "the conus is the commonest site, and sphincter symptoms often precede the gait problem by months — an older man with progressive urinary difficulty and subtle leg signs is the presentation that gets attributed to the prostate",
        },
      },
    },
    "Cavernous malformation": {
      slots: { level: "the focal deficit and any seizures",
               flavour: "a popcorn-like lesion with a complete haemosiderin rim on blood-sensitive sequences, and NO flow voids — it is angiographically OCCULT, so a normal angiogram does not exclude it" },
      bySite: {
        medulla_lateral:        { level: "swallow, and the crossed sensory pattern" },
        midbrain_lateral:       { level: "the third nerve and contralateral limb signs" },
        pons_lateral:           { level: "hearing, facial power and crossed signs" },
        pons_lateral_trigeminal:{ level: "facial sensation and the corneal reflex" },
      },
    },
    "Cavernous malformation with recurrent bleeds": {
      slots: { level: "the deficit after each event, compared against the last",
               flavour: "REPEATED bleeding is the defining feature and the argument for intervening — brainstem cavernomas rebleed more often than those elsewhere, and each event may leave a little more behind" },
      monitoringExtra: ["Document the deficit after EVERY event, not just the first: the treatment decision rests on the trajectory across bleeds rather than on any single one"],
      bySite: {
        guillain_mollaret_rubral:   { level: "tremor, palate and eye movements" },
        guillain_mollaret_dentate:  { level: "limb coordination and any tremor" },
        guillain_mollaret_triangle: { level: "palatal tremor specifically, which may appear MONTHS after the bleed" },
      },
    },
    "Haemorrhage / cavernous malformation": {
      slots: { level: "the third nerve, pupils and conscious level",
               flavour: "the name holds both possibilities and the blood-sensitive MRI settles it — a complete haemosiderin rim around the blood says the lesion was there first" },
    },
    "Brainstem stroke / cavernoma (with hypertrophic olivary degeneration)": {
      slots: { level: "palatal tremor, and the limbs for coordination",
               flavour: "hypertrophic olivary degeneration is a DELAYED consequence — the olive enlarges and becomes T2-bright months after the original lesion, so an enlarging olive here is expected rather than alarming" },
      confirmatoryExtra: ["Do not mistake the enlarging olive for a new tumour: it is the downstream effect of the original Guillain-Mollaret triangle lesion and needs no separate work-up"],
    },
    // A fistula, but the orbit dominates: direct high-flow shunting into the cavernous sinus.
    "Carotid-cavernous fistula": {
      slots: { level: "eye movements, acuity, the pupil and intraocular pressure",
               flavour: "PULSATILE PROPTOSIS with a bruit over the orbit, chemosis and dilated corkscrew episcleral vessels — a direct fistula usually follows head trauma, an indirect one arises spontaneously in older patients" },
      confirmatory: [
        "URGENT ophthalmology assessment including INTRAOCULAR PRESSURE — vision is the function at risk, and raised pressure with venous congestion is what destroys it",
        "CT or MR angiography of the orbits and cavernous sinus showing a dilated superior ophthalmic vein, then CATHETER ANGIOGRAPHY to define the fistula and plan treatment",
        "Ask about HEAD TRAUMA, which precedes the direct high-flow type, and examine for a bruit the patient may have been describing for weeks",
        "Assess cortical venous drainage: as elsewhere in this family, it is what converts an eye problem into a haemorrhage risk",
      ],
      monitoringExtra: ["Track acuity and intraocular pressure at defined intervals — deterioration in either is the indication to treat, and the deficit becomes irreversible once the optic nerve is compromised"],
      urgency: "emergency",
      referral: "Neurointervention with ophthalmology — endovascular closure is the definitive treatment",
      bySite: {
        skull_base_iii_orbit_sup: {
          level: "elevation of the lid and the superior rectus, with the pupil",
          flavour: "a superior division third-nerve deficit here reflects congestion at the orbital apex rather than compression, so it can improve once the fistula is closed",
        },
        skull_base_sup_orbital_fissure: {
          level: "every eye movement separately, plus V1 sensation and corneal sensation",
          flavour: "at the fissure the fistula affects III, IV, VI and V1 together — a painful total ophthalmoplegia with a numb forehead, which is the fissure syndrome rather than an isolated palsy",
        },
        skull_base_cavernous_sinus: {
          level: "III, IV, VI and the V1/V2 territories one at a time, with acuity and pressure",
          flavour: "within the sinus the SIXTH nerve runs free in the venous blood rather than in the wall, which is why it is affected earliest and most often",
        },
      },
    },
  }),

  // ---- CEREBRAL VENOUS THROMBOSIS: the treatable stroke that breaks the arterial rules ----
  ...family("venous-sinus-thrombosis", CVST_SPINE, {
    "Superior sagittal sinus thrombosis": {
      slots: { level: "leg power in BOTH legs, and conscious level",
               flavour: "PARASAGITTAL and often BILATERAL, straddling the midline — a bilateral leg deficit that no single arterial territory explains, with the empty delta sign on contrast" },
      monitoringExtra: ["Papilloedema is common here because the sagittal sinus drains the arachnoid granulations — check the discs at presentation and again, since visual loss is a separate and preventable outcome"],
      bySite: {
        cortex_motor_leg:    { level: "both legs, tested separately — asymmetry does not exclude it" },
        cortex_sensory_leg:  { level: "sensation in both legs, and the sensory level if one seems to be present" },
        cortex_paracentral:  { level: "leg power and CONTINENCE, which the paracentral lobule governs" },
        cortex_sma:          { level: "initiation and spontaneous movement, which can look like reduced consciousness" },
        cortex_aca:          { level: "leg power, initiation and continence together" },
      },
    },
    "Deep cerebral venous thrombosis": {
      slots: { level: "conscious level and memory, which recover slowly if at all",
               flavour: "BILATERAL THALAMIC swelling — the internal cerebral veins, vein of Galen and straight sinus drain both thalami, so bilateral thalamic change should prompt a venogram before anything else. The differential is artery of Percheron infarction, and the venogram is what separates them" },
      monitoringExtra: ["This is the deep venous pattern with the worst prognosis, and conscious level can deteriorate over days — a falling GCS here is thrombus propagation until reimaged"],
      bySite: {
        thalamus_arousal_paramedian: { level: "conscious level and the sleep-wake cycle" },
        thalamus_limbic:             { level: "memory and behaviour once arousal permits testing" },
        aphasia_subcortical_thalamic:{ level: "language — fluctuating, with intact repetition" },
        subcortex_thalamus:          { level: "conscious level, sensation and gaze together" },
      },
    },
    "Transverse or sigmoid sinus thrombosis (vein of Labbe)": {
      slots: { level: "language, and any seizure activity",
               flavour: "a TEMPORAL haemorrhage or oedema that does not respect the MCA territory — the vein of Labbe drains the temporal lobe into the transverse sinus, and this is the pattern most often worked up as HSV encephalitis or an inferior-division infarct" },
      confirmatoryExtra: ["Look at the MASTOID and middle ear on the same scan: an adjacent infection is both the cause and a separate surgical problem, and it is easy to overlook once the intracranial finding has been seen"],
      bySite: {
        cortex_temporal:        { level: "comprehension, memory and seizure activity" },
        cortex_temporoparietal: { level: "comprehension and repetition, and any neglect" },
      },
    },
    "Cortical vein thrombosis": {
      slots: { level: "the focal deficit, and whether it fluctuates",
               flavour: "an ISOLATED cortical vein thrombosis without sinus involvement — a juxtacortical haemorrhage with disproportionate surrounding oedema, and the cord sign of the thrombosed vein itself" },
      confirmatoryExtra: ["Blood-sensitive sequences (SWI or gradient-echo) are more sensitive than the venogram for an isolated cortical vein, so ask for them specifically when the venogram is normal but the picture is convincing"],
      bySite: {
        cortex_sensory_hand: { level: "cortical sensory function in the hand" },
        cortex_hand_knob:    { level: "isolated hand function, which mimics a peripheral nerve lesion" },
      },
    },
    "Jugular vein thrombosis": {
      slots: { level: "swallow, voice and palatal elevation",
               flavour: "thrombosis at the jugular bulb compresses the lower cranial nerves as they leave the skull base — look for a central line, a recent neck procedure, or an adjacent deep neck infection" },
    },
    "Jugular vein thrombosis or dissection": {
      slots: { level: "voice, swallow and shoulder shrug",
               flavour: "the two mechanisms look identical on the nerve examination — the vessel imaging separates them, and dissection additionally raises the question of an embolic source" },
      confirmatoryExtra: ["If it is a DISSECTION rather than a thrombosis, the concern shifts to distal embolism and the antithrombotic decision changes — image the arteries as well as the veins"],
    },
    // Cavernous sinus thrombosis: still a dural sinus thrombosis, but the orbit and the source dominate.
    "Cavernous sinus thrombosis": {
      slots: { level: "each eye movement separately, plus acuity and the pupil",
               flavour: "PROPTOSIS, chemosis and a painful ophthalmoplegia — and because the two cavernous sinuses communicate, a picture that starts on one side and CROSSES to the other is close to diagnostic" },
      confirmatory: [
        "URGENT contrast MRI or CT of the ORBITS AND CAVERNOUS SINUS with venography — this is an orbital emergency as much as an intracranial one",
        "FIND THE SOURCE: the sinuses, the face, the orbit and the teeth. Spread from the danger triangle of the face is the classic route, and the source needs treating in its own right",
        "Blood cultures before antibiotics, plus inflammatory markers; aspirate or biopsy the source where there is one to sample",
        "Formal ophthalmology assessment — acuity, pupil and intraocular pressure — because vision is the function most likely to be lost and the least likely to return",
      ],
      monitoringExtra: ["Watch the OTHER eye: bilateral involvement means the thrombus has crossed and marks a substantial deterioration, and it is what distinguishes this from an orbital cellulitis"],
      referral: "Emergency ophthalmology and ENT with infectious diseases, plus neurology — and the anticoagulation decision is a specialist one here rather than automatic",
      bySite: {
        pupil_cn3_compressive:      { level: "the third nerve and the PUPIL specifically" },
        skull_base_cavernous_sinus: { level: "all of III, IV, VI and the V1/V2 sensory territories, one at a time" },
      },
    },
    "Septic cavernous sinus thrombosis": {
      slots: { level: "each eye movement, acuity, the pupil, and the systemic observations",
               flavour: "the septic form — fever and rigors with proptosis and ophthalmoplegia, usually from a facial, sinus or dental source that must be found and drained" },
      confirmatory: [
        "BLOOD CULTURES BEFORE ANTIBIOTICS, and imaging of the orbits, cavernous sinus AND paranasal sinuses in one study",
        "Identify and DRAIN the source — antimicrobial treatment alone frequently fails while a collection remains, and Staphylococcus aureus is the usual organism",
        "Lumbar puncture where meningitis is a possibility and there is no contraindication, since the two coexist",
        "Formal ophthalmology assessment for acuity, pupil and intraocular pressure",
      ],
      monitoringExtra: ["Watch for the metastatic complications of a staphylococcal bacteraemia — endocarditis, septic emboli and abscesses elsewhere — which are missed while attention is on the orbit"],
      referral: "Emergency ENT and ophthalmology with infectious diseases and neurosurgery",
    },
  }),

  // ARTERIAL, not venous — it sits in the thrombosis word-cluster and nowhere near its workup.
  "Subclavian or axillary artery aneurysm with thrombosis": dz("Subclavian or axillary artery aneurysm with thrombosis", {
    confirmatory: [
      "This is a VASCULAR problem presenting as a nerve problem: image the subclavian and axillary arteries with duplex ultrasound and CT angiography, not the brachial plexus alone",
      "Examine the LIMB as well as the nerve — pulses, capillary refill, temperature and blood pressure in both arms; distal emboli from the aneurysm are what threaten the hand",
      "Chest imaging for a CERVICAL RIB or fibrous band: thoracic outlet compression is the usual cause of a subclavian aneurysm in a younger patient, and it is correctable",
      "Nerve conduction studies define the plexus deficit, but they are the second question, not the first",
    ],
    monitoring: [
      "SAFETY NET: the limb outranks the nerve. Acute ischaemia — a cold, pale, pulseless hand — is a vascular emergency and must not wait behind a neurological work-up",
      "Watch for recurrent distal embolism, which can present as fluctuating hand symptoms and is often attributed to the plexus lesion",
      "The neurological recovery follows the vascular repair, so set that expectation rather than pursuing the nerve deficit separately",
    ],
    urgency: "emergency",
    referral: "Vascular surgery urgently; thoracic surgery where a cervical rib is found, with neurology for the plexus injury",
  }),

  // ---- INTRAPARENCHYMAL haemorrhage: blood inside the brain ----
  ...family("intraparenchymal-haemorrhage", INTRAPARENCHYMAL_SPINE, {
    "Thalamic haemorrhage": {
      slots: { level: "conscious level, gaze and the sensory deficit",
               flavour: "a thalamic bleed sits next to the third ventricle — look for intraventricular extension and hydrocephalus, which is what usually decides the outcome",
               aetiology: "DEEP, so hypertensive is the working diagnosis — but a thalamic bleed in a normotensive patient should still prompt vessel imaging, and a deep venous thrombosis can produce a thalamic bleed that looks arterial" },
      monitoringExtra: ["A thalamic bleed classically gives DOWNWARD and inward gaze deviation with small unreactive pupils — a striking sign that is often the first thing to change"],
      bySite: {
        thalamus_vpm: { level: "facial and limb sensation, and any evolving central pain" },
        thalamus_vl: { level: "power, tremor and coordination" },
        thalamus_pulvinar: { level: "visual attention and neglect" },
        aphasia_subcortical_thalamic: { level: "language — fluent with intact repetition, which is the thalamic signature" },
        subcortex_thalamus: { level: "conscious level, sensation and gaze together" },
      },
    },
    "Pontine haemorrhage": {
      slots: { level: "conscious level, pupils and respiratory pattern",
               flavour: "a pontine bleed is usually hypertensive and central — pinpoint reactive pupils with coma is the classic picture, and prognosis relates closely to volume",
               aetiology: "DEEP and central — the most characteristically hypertensive location of all, so the chronic blood pressure is the finding to establish, not just today's reading" },
      monitoringExtra: ["AIRWAY FIRST: a pontine haemorrhage threatens ventilation and swallow before anything else, and critical care involvement should not wait for the neurosurgical opinion"],
      bySite: {
        pons_medial: { level: "eye movements, facial power and swallow" },
        pons_lateral: { level: "hearing, facial sensation and crossed signs" },
        pons_lateral_trigeminal: { level: "facial sensation and the corneal reflex" },
        locked_in_ventral_pons: { level: "VERTICAL eye movements and blinking — the only channel left, and the one that distinguishes locked-in from coma" },
      },
    },
    "Midbrain haemorrhage": {
      slots: { level: "the third nerve, pupils and vertical gaze",
               flavour: "a midbrain bleed sits at the aqueduct — look specifically for obstructive hydrocephalus, which is treatable and easily missed while attention is on the deficit",
               aetiology: "deep, but the midbrain is a RARE site for a hypertensive bleed — that rarity raises a cavernoma or arteriovenous malformation proportionally, so image the vessels rather than assume" },
      bySite: {
        midbrain_lateral: { level: "the third nerve with contralateral limb signs" },
        midbrain_hemi: { level: "conscious level, pupils and all four limbs" },
        dorsal_midbrain_tectum: { level: "vertical gaze, convergence-retraction nystagmus and pupillary reactions" },
      },
    },
    "Deep hypertensive haemorrhage": {
      slots: { level: "power, and language where the dominant side is involved",
               flavour: "a deep bleed in the basal ganglia or internal capsule with a hypertensive history is the commonest pattern of all — but in a NORMOTENSIVE patient, image the vessels for an underlying lesion",
               aetiology: "the archetypal DEEP hypertensive location — but in a NORMOTENSIVE patient this same picture demands vessel imaging, because the location no longer explains itself" },
      bySite: {
        aphasia_subcortical_striatocapsular: { level: "language and power together" },
        subcortex_anterior_choroidal: { level: "power, sensation and the visual field — the triad of that territory" },
        subcortex_sensorimotor: { level: "power and sensation in the same distribution" },
      },
    },
    "Large intracerebral haemorrhage": {
      slots: { level: "conscious level above all else",
               flavour: "volume is the strongest single predictor — measure it on the first scan so expansion on the second is unambiguous",
               aetiology: "read where the bulk of it SITS: deep points to hypertension, lobar in an older patient to amyloid angiopathy, and either in a young patient to an underlying malformation" },
      monitoringExtra: ["A large hemispheric haematoma behaves like a malignant infarct: watch for midline shift and herniation, and involve neurosurgery early rather than at deterioration"],
      bySite: {
        cortex_aphasia_global: { level: "language and conscious level" },
        cortex_mca: { level: "conscious level, power and gaze deviation" },
      },
    },
    "Occipital haemorrhage": {
      slots: { level: "the visual fields, formally rather than to confrontation",
               flavour: "a LOBAR occipital bleed in an older patient raises cerebral amyloid angiopathy — look for the lobar microbleeds on the delayed blood-sensitive sequences",
               aetiology: "LOBAR — so cerebral amyloid angiopathy in an older patient, and an arteriovenous malformation in a younger one. The occipital lobe is also a favoured site for both" },
      bySite: {
        cortex_pca: { level: "the visual field and any higher visual disturbance" },
        cortex_occipital: { level: "the field defect, and whether the patient is AWARE of it" },
      },
    },
    "Hypothalamic stroke or haemorrhage": {
      slots: { level: "temperature, sodium, and conscious level",
               flavour: "a hypothalamic lesion declares itself through the ENDOCRINE and autonomic axes rather than through a focal deficit, so the abnormal result usually arrives before the sign",
               aetiology: "a deep midline location that is unusual for simple hypertension — consider a pituitary or suprasellar lesion bleeding, and image the sella specifically" },
      monitoringExtra: ["Check sodium, cortisol and thyroid function early: diabetes insipidus and adrenal insufficiency here are life-threatening and entirely treatable"],
      bySite: {
        hypothalamus_thermoregulatory: { level: "core temperature, which can swing in either direction" },
        hypothalamus_lateral: { level: "appetite, weight and arousal" },
      },
    },
    "Hypertensive pontine haemorrhage": {
      slots: { level: "conscious level, pupils and the gag reflex",
               flavour: "the hypertensive pontine bleed is the archetype — central, and the blood pressure that caused it must still be treated",
               aetiology: "DEEP and central: the name states the mechanism, and the job is to confirm the hypertension is chronic and to treat it, not merely to record it" },
      monitoringExtra: ["AIRWAY AND VENTILATION FIRST — this is the bleed most likely to need intubation before the imaging is complete"],
    },
    "Small pontine haemorrhage": {
      slots: { level: "eye movements and the crossed signs specifically",
               flavour: "a small pontine bleed can produce a deficit out of all proportion to its size — do not be reassured by the volume here as you would in the hemisphere",
               aetiology: "DEEP, so hypertensive — but a SMALL pontine bleed in a young or normotensive patient is a cavernoma until the blood-sensitive MRI says otherwise" },
    },
    "Medullary haemorrhage": {
      slots: { level: "swallow, tongue movement and the respiratory pattern",
               flavour: "medullary bleeds are rare and disproportionately raise an underlying CAVERNOMA or arteriovenous malformation — image the vessels rather than assuming hypertension",
               aetiology: "a RARE location, and rarity is itself the clue — an underlying cavernoma or arteriovenous malformation is proportionally far more likely here than hypertension" },
      monitoringExtra: ["Respiratory drive and swallow are the functions at risk, and both can fail without a dramatic change in conscious level"],
    },
    "Brainstem haemorrhage": {
      slots: { level: "conscious level, pupils and eye movements",
               flavour: "in the brainstem the compartment is tiny, so an underlying lesion is proportionally more likely than in a hemispheric bleed — the delayed MRI matters more here",
               aetiology: "deep, but in a small compartment where an underlying lesion is proportionally more likely — the delayed blood-sensitive MRI matters more here than anywhere else" },
    },
    "Haemorrhage into the subthalamic region": {
      slots: { level: "the involuntary movements, and their amplitude over time",
               flavour: "a subthalamic bleed produces HEMIBALLISMUS — violent proximal flinging that is exhausting and occasionally dangerous in its own right",
               aetiology: "DEEP — the classic hypertensive small-vessel territory, sitting beside the internal capsule" },
      monitoringExtra: ["Severe hemiballismus can cause rhabdomyolysis and exhaustion — monitor creatine kinase and hydration, not just the movement itself"],
    },
    "Hypertensive haemorrhage": {
      slots: { level: "pure motor power, without cortical signs",
               flavour: "a capsular bleed gives a dense PURE MOTOR deficit with no language or neglect — the absence of cortical signs is the localising information",
               aetiology: "DEEP, in the capsular territory of the lenticulostriate perforators — the commonest hypertensive site after the putamen" },
    },
    "Hypertensive deep haemorrhage": {
      slots: { level: "power across face, arm and leg equally",
               flavour: "a corona radiata bleed sits in white matter, so the deficit is motor and the higher functions are spared",
               aetiology: "deep white matter — hypertensive small-vessel disease, and the same vessels that produce lacunes" },
    },
    "Deep haemorrhage": {
      slots: { level: "the visual field",
               flavour: "a bleed into the optic radiation gives a field defect with little else — easily missed unless the fields are formally tested",
               aetiology: "deep white matter rather than cortex, so hypertensive rather than amyloid — amyloid angiopathy spares the deep structures, which is the discriminator" },
    },
    "Haemorrhage": {
      slots: { level: "speech output, and face and arm power",
               flavour: "an opercular bleed threatens speech disproportionately to its size",
               aetiology: "LOBAR — cortical and superficial, so cerebral amyloid angiopathy in an older patient and an underlying malformation in a younger one" },
    },
    "Cerebellar haemorrhage": {
      slots: { level: "conscious level and truncal stability",
               flavour: "MEASURE THE HAEMATOMA and look at the fourth ventricle: in the posterior fossa, SIZE AND BRAINSTEM COMPRESSION rather than the deficit drive the surgical decision, and a patient can look well and still need evacuation",
               aetiology: "DEEP, in the posterior fossa — hypertensive is the commonest by far, though a cerebellar bleed in a young patient still warrants vessel imaging" },
      monitoringExtra: [
        "THE POSTERIOR FOSSA HAS NO ROOM: deterioration can be abrupt and irreversible, so a falling conscious level is a call to the surgeon and the scanner in the same breath",
        "Watch for obstructive hydrocephalus from fourth-ventricle compression — treatable, and what usually kills here",
      ],
      referral: "Emergency neurosurgery — posterior-fossa haematomas are evacuated on size and brainstem compression, so refer BEFORE the patient deteriorates",
      bySite: {
        cerebellum_vermis: { level: "conscious level, with the fourth ventricle on every scan",
          flavour: "a MIDLINE haematoma sits directly on the fourth ventricle, so obstructive hydrocephalus arrives EARLY and may dominate before any brainstem sign appears" },
        cerebellum_hemisphere: { level: "conscious level, and the ipsilateral limbs for worsening ataxia",
          flavour: "a HEMISPHERIC haematoma compresses the brainstem laterally — the classic setting in which size and brainstem distortion, rather than the deficit, drive evacuation" },
      },
    },
    // The "or cavernoma" names: same acute answer, plus the lesion hunt that changes the FUTURE.
    "Pontine haemorrhage or cavernoma": {
      slots: { level: "facial sensation and eye movements",
               flavour: "a small brainstem bleed in a YOUNGER, normotensive patient is a cavernoma until the blood-sensitive MRI says otherwise",
               aetiology: "deep, but the name already names the alternative — a small brainstem bleed in a young normotensive patient is a cavernoma" },
      confirmatoryExtra: ["Delayed MRI with SWI or gradient-echo is the study that finds the cavernoma, and it also screens for the multiple lesions of the FAMILIAL form — which changes the conversation with the family, not just the patient"],
    },
    "Brainstem haemorrhage or cavernoma": {
      slots: { level: "tremor, palate and eye movements",
               flavour: "a lesion in the Guillain-Mollaret triangle may declare itself late, as palatal tremor developing months after the bleed",
               aetiology: "deep and small-volume, which in the brainstem points to a cavernoma rather than to hypertension" },
      confirmatoryExtra: ["Blood-sensitive MRI for a cavernoma, and screen for multiple lesions — brainstem cavernomas rebleed at a materially higher rate than those elsewhere, which drives the surgical discussion"],
    },
    "Brainstem or cerebellar haemorrhage / cavernoma": {
      slots: { level: "limb coordination and any tremor",
               flavour: "a dentate lesion gives ipsilateral limb ataxia; blood here also threatens the fourth ventricle, so look at it explicitly",
               aetiology: "posterior fossa — hypertensive if large and deep, cavernoma if small and in a younger patient" },
      confirmatoryExtra: ["Blood-sensitive MRI for an underlying cavernoma, and assess the fourth ventricle for obstruction on the acute scan"],
    },
  }),

  // ---- COMPRESSIVE (extra-axial) haematoma: the answer is DECOMPRESSION ----
  ...family("compressive-haematoma", COMPRESSIVE_SPINE, {
    "Spinal epidural haematoma": {
      slots: { level: "power, sensory level and sphincter function",
               flavour: "sudden severe back pain followed by a progressive cord or cauda syndrome, usually on anticoagulation or after a spinal procedure — the time from deficit to decompression is the strongest predictor of recovery" },
      bySite: {
        cord_hemi: { level: "the asymmetry between the two sides, and the sensory level" },
        cauda_equina: { level: "saddle sensation, sphincter tone and the anal wink" },
      },
    },
    "Compressive myelopathy (tumour, disc, abscess, haematoma)": {
      slots: { level: "the sensory level, power and sphincter function",
               flavour: "the name lists four causes and the MRI distinguishes them — but the DECOMPRESSION question is the same for all four, and it is the one with a clock on it" },
      confirmatoryExtra: ["Once compression is confirmed, the cause changes the ADJUNCT rather than the urgency: cultures if infective, staging if malignant, reversal if haemorrhagic"],
    },
    "Vertex extradural haematoma": {
      slots: { level: "both legs, and continence",
               flavour: "a VERTEX extradural is the one that hides — it sits at the top of the head where axial CT slices are thinnest, and it is classically missed on the first read" },
      confirmatoryExtra: ["Ask explicitly for CORONAL reformats: a vertex collection can be invisible on axial images alone, and it is often venous from a torn sagittal sinus rather than arterial"],
    },
    "Vertex extradural haematoma / parasagittal contusion": {
      slots: { level: "leg power specifically, since the arm may be entirely normal",
               flavour: "a parasagittal lesion produces a LEG-predominant deficit that is regularly mistaken for a cord problem" },
      confirmatoryExtra: ["Coronal reformats again — and where the picture is bilateral leg weakness after trauma, image the head before the spine"],
    },
    "Interhemispheric (falx) subdural haematoma or parasagittal contusion": {
      slots: { level: "leg power and initiation, with continence",
               flavour: "an interhemispheric subdural tracks along the falx and can be a thin sliver on axial slices while producing a substantial leg deficit" },
      confirmatoryExtra: ["In an older patient on anticoagulation, look for the second, chronic collection alongside the acute one — mixed-density collections are common and change the surgical plan"],
    },
  }),

  // ---- RETROPERITONEAL haematoma: not intracranial at all ----
  ...family("retroperitoneal-haematoma", RETROPERITONEAL_SPINE, {
    "Retroperitoneal haematoma": {
      slots: { level: "hip flexion, knee extension and the knee jerk",
               flavour: "the classic setting is anticoagulation, sometimes after femoral arterial access — and the femoral nerve is compressed in the iliacus compartment where the psoas cannot expand" },
      bySite: {
        plexus_lumbar_plexus: { level: "hip flexion, knee extension, thigh adduction and sensation over the thigh" },
        nerve_femoral: { level: "knee extension and the knee jerk, with sensation over the anterior thigh and medial calf" },
      },
    },
    "Psoas abscess or retroperitoneal haematoma": {
      slots: { level: "hip flexion and the L3 myotome",
               flavour: "the same compartment, two causes with opposite treatments — FEVER AND INFLAMMATORY MARKERS separate abscess from haematoma, so send them before deciding" },
      confirmatoryExtra: ["If it is an abscess: blood cultures before antibiotics, and drainage rather than reversal — the two diagnoses look identical on the nerve examination alone"],
    },
    "Retroperitoneal or pelvic haematoma": {
      slots: { level: "ankle movement, hip extension and sphincter function",
               flavour: "a pelvic collection reaches the sacral plexus, so ask explicitly about bladder, bowel and sexual function, which are rarely volunteered" },
    },
  }),

  // ---- ANEURYSM / SAH: the bleed is a symptom of a vessel that will bleed again ----
  ...family("aneurysm-sah", ANEURYSM_SPINE, {
    "Aneurysm or deep haemorrhage": {
      slots: { level: "the visual fields and the pupils",
               flavour: "an aneurysm compressing or bleeding near the optic tract — look specifically at the posterior communicating and internal carotid, and check the third nerve including the PUPIL" },
    },
    "Deep haemorrhage or aneurysm": {
      slots: { level: "the visual field, formally",
               flavour: "a lesion at the geniculate is deep and small — the field defect may be the only sign, and a normal CT does not exclude an aneurysm nearby" },
    },
    "Anterior communicating artery aneurysm rupture": {
      slots: { level: "personality, initiation and continence, plus conscious level",
               flavour: "the ACOM complex sits against the medial frontal lobes, so rupture here characteristically leaves a BEHAVIOURAL syndrome — apathy, disinhibition and amnesia — long after the physical recovery looks complete" },
      confirmatoryExtra: ["Warn the family explicitly about the frontal syndrome: it is the commonest long-term disability after ACOM rupture, it is invisible to a physical examination, and families interpret it as personality change or laziness unless told"],
    },
    "Ruptured anterior communicating artery aneurysm": {
      slots: { level: "personality, judgement and SMELL, which is almost never tested",
               flavour: "orbitofrontal damage from the rupture or from surgical access — anosmia is common, permanent, and rarely recorded, so patients discover it themselves months later" },
    },
    "Anterior communicating artery aneurysm (rupture ± vasospasm)": {
      slots: { level: "leg power and initiation, plus conscious level",
               flavour: "the ACOM supplies the medial frontal lobes through its perforators, so vasospasm here produces a LEG-predominant deficit days after the bleed rather than at the moment of it" },
    },
    "ACA vasospasm after subarachnoid haemorrhage": {
      slots: { level: "leg power and initiation, which is where ACA territory declares itself",
               flavour: "this is a LATE complication, not the initial bleed — a new leg-predominant deficit at days 4-14 after a subarachnoid haemorrhage is vasospasm until proven otherwise" },
      confirmatory: [
        "Transcranial Doppler or CT perfusion to demonstrate the spasm — but a new deficit in the window is treated on clinical grounds, not held pending a number",
        "Exclude the alternatives that present identically: rebleeding, hydrocephalus, seizure, hyponatraemia and sepsis all mimic vasospasm and are all treatable",
        "Confirm the aneurysm is SECURED — an unsecured aneurysm changes what can safely be done about the spasm",
      ],
      monitoringExtra: ["Induced hypertension is the mainstay once the aneurysm is secured, which is the reverse of the blood-pressure target for an unsecured bleed — knowing which state the patient is in is the whole decision"],
    },
  }),

  // Duret haemorrhage is not a primary bleed at all: it is the CONSEQUENCE of herniation, so its workup
  // is about what is pushing the brainstem down, not about the brainstem blood.
  "Duret haemorrhage / brainstem injury from herniation": dz("Duret haemorrhage / brainstem injury from herniation", {
    confirmatory: [
      "THIS IS A SIGN OF HERNIATION, NOT A DIAGNOSIS IN ITSELF — the urgent question is WHAT IS PUSHING THE BRAINSTEM DOWN, so image the whole head and find the supratentorial mass, collection or oedema responsible",
      "CT immediately, looking for the causative lesion and for the degree of midline shift and basal cistern effacement",
      "Once the cause is identified, the decision is whether it is REVERSIBLE — an evacuable collection or hydrocephalus is treatable, established brainstem infarction is not",
      "Examine the pupils and brainstem reflexes and document them precisely — they are the baseline against which any intervention is judged",
    ],
    monitoring: [
      "SAFETY NET: this is the end of a process that was underway before the haemorrhage appeared. The clinical priority is the herniation, and treatment of raised intracranial pressure should not wait for the imaging to be reported",
      "Pupils, conscious level and respiratory pattern continuously; a fixed dilated pupil with a falling conscious level is an emergency in progress",
      "Involve critical care and neurosurgery together and early — and be prepared for the conversation about ceilings of care, because the prognosis once Duret haemorrhages are established is poor and the family will need that said honestly",
    ],
    urgency: "emergency",
    referral: "Emergency neurosurgery and critical care together",
  }),

  ...family("infarct", INFARCT_SPINE, {
    // ---- anterior circulation, cortical ----
    "MCA superior division infarct": {
      slots: { level: "face and arm power, and speech output",
               flavour: "a superior division infarct spares the visual field, which is what separates it from a complete MCA territory infarct" },
      bySite: {
        cortex_mca_superior: { level: "face and arm power, and expressive speech" },
        cortex_motor_facearm: { level: "face and arm power specifically, with the leg relatively spared" },
      },
    },
    "MCA inferior division infarct": {
      slots: { level: "comprehension, neglect and the visual field",
               flavour: "an inferior division infarct SPARES POWER — the deficit is comprehension, neglect or a field cut, which is why it is repeatedly admitted as delirium or a psychiatric presentation" },
      bySite: {
        cortex_temporoparietal: { level: "comprehension and repetition — fluent but empty speech" },
        cortex_temporal: { level: "comprehension, and memory once the patient can cooperate" },
        cortex_parietal: { level: "neglect, cortical sensation and the inferior field" },
        cortex_mca_inferior: { level: "comprehension, neglect and the superior quadrant" },
      },
    },
    "MCA territory infarct": {
      slots: { level: "gaze deviation, power and autonomic stability",
               flavour: "eyes deviated TOWARDS the lesion with a contralateral hemiparesis is a hemispheric infarct until proven otherwise" },
      bySite: {
        cortex_frontal_eye_field: { level: "conjugate gaze — deviation towards the lesion, and whether it overcomes with the oculocephalic manoeuvre" },
        cortex_insula: { level: "blood pressure, cardiac rhythm and conscious level",
                         flavour: "insular infarction carries a real burden of autonomic and cardiac instability out of proportion to the motor deficit" },
      },
    },
    "Large MCA territory (or ICA) infarct": {
      slots: { level: "language, power and conscious level",
               flavour: "a global aphasia with dense hemiplegia means a proximal occlusion — the CT angiogram is the study that changes management, not the plain CT" },
      confirmatoryExtra: ["This is the picture that most often qualifies for THROMBECTOMY — involve the neurointerventional service in parallel with the imaging, not after it"],
    },
    "Malignant MCA infarction (space-occupying oedema)": {
      slots: { level: "conscious level above all else",
               flavour: "early loss of grey-white differentiation over more than a third of the territory predicts the malignant course" },
      monitoringExtra: [
        "THE DECOMPRESSIVE CRANIECTOMY WINDOW IS THE POINT: oedema peaks at 2-5 days, and the decision must be made BEFORE herniation, not in response to it — flag to neurosurgery early even if the patient looks well today",
        "Hourly conscious level and pupils during the peak window; a new pupillary asymmetry is a surgical emergency",
      ],
    },
    "Striatocapsular infarct from PROXIMAL MCA occlusion": {
      slots: { level: "power, and language, since cortical function is variably involved",
               flavour: "a large comma-shaped basal ganglia infarct is NOT a lacune — it means a PROXIMAL MCA occlusion with collateral rescue of the cortex, so image the vessel" },
      confirmatoryExtra: ["Do not file this as small-vessel disease: the striatocapsular pattern mandates a vessel study and a full embolic source hunt"],
    },
    "MCA infarct (postcentral / parietal branch)": {
      slots: { level: "cortical sensory function — two-point discrimination, stereognosis and graphaesthesia",
               flavour: "a small postcentral infarct gives CORTICAL sensory loss with preserved primary modalities, which is easily dismissed as functional" },
    },
    "Small cortical infarct or TIA": {
      slots: { level: "the focal deficit, and whether it is resolving",
               flavour: "a normal CT is expected — DWI is what confirms a small cortical infarct, and a positive DWI in a resolved deficit still means a stroke, not a TIA" },
      confirmatoryExtra: ["Where symptoms have resolved, the work-up is URGENT rather than over — early recurrence risk after a TIA is front-loaded into the first days"],
    },
    "Bilateral ACA territory infarct": {
      slots: { level: "both legs, continence and initiation",
               flavour: "bilateral medial frontal infarction from a single dominant A2 — paraparesis with abulia and incontinence, which is regularly worked up as a cord lesion" },
      confirmatoryExtra: ["Because the picture imitates a cord lesion, this is one to image the BRAIN for when the spine MRI is normal"],
    },
    "Bilateral temporal (Heschl's gyrus) infarcts": {
      slots: { level: "hearing, with formal audiometry rather than bedside testing",
               flavour: "bilateral superior temporal lesions — cortical deafness needs BOTH sides, so a single infarct here does not explain it and a second, older lesion should be looked for" },
    },
    "Border-zone (watershed) infarct from hypoperfusion": {
      slots: { level: "proximal limb power, and the blood pressure that caused it",
               flavour: "a rosary or wedge pattern between two territories — the mechanism is HAEMODYNAMIC, so the question is what dropped the perfusion, not what embolised" },
      confirmatoryExtra: [
        "Image the carotids and the intracranial vessels: a tight proximal stenosis with a border-zone pattern is a different problem from an embolus",
        "Find the trigger — hypotension, sepsis, arrhythmia, blood loss or a recent anaesthetic — because without it the infarct will simply recur",
      ],
      bySite: {
        cortex_watershed_anterior: { level: "PROXIMAL arm and leg power — the man-in-a-barrel pattern" },
        cortex_watershed_posterior: { level: "the visual field and higher visual processing" },
      },
    },

    // ---- posterior circulation, brainstem ----
    "Brainstem infarct": {
      slots: { level: "eye movements, swallow and conscious level",
               flavour: "the brainstem is where an early DWI most often misses the lesion — a convincing crossed picture outranks a normal early scan, so repeat it" },
      bySite: {
        pontomesencephalic_tegmentum: { level: "eye movements in each direction separately, and conscious level" },
        guillain_mollaret_rubral: { level: "tremor, palate and eye movements — and remember palatal tremor can appear MONTHS later" },
      },
    },
    "Top-of-the-basilar / brainstem infarct": {
      slots: { level: "conscious level, pupils and vertical gaze",
               flavour: "top-of-the-basilar embolism gives a bewildering mixture of visual, oculomotor and behavioural signs with preserved power — the pattern is the diagnosis" },
      confirmatoryExtra: ["A FLUCTUATING or stuttering posterior-circulation picture is basilar thrombosis until the angiogram says otherwise; the fluctuation is the warning, not reassurance"],
    },
    "Posterior cerebral / basilar perforator infarct": {
      slots: { level: "the third nerve, and contralateral limb signs",
               flavour: "a crossed picture — a cranial nerve on one side with long-tract signs on the other — localises to the brainstem and nowhere else" },
    },
    "Dorsal midbrain infarct": {
      slots: { level: "vertical gaze, convergence-retraction nystagmus and the pupils",
               flavour: "dorsal midbrain signal change — but Parinaud's syndrome from a lesion here also raises pineal mass and hydrocephalus, so look at the ventricles on the same scan" },
    },
    "Bilateral medial medullary infarct": {
      slots: { level: "tongue, all four limbs, and the respiratory pattern",
               flavour: "a 'heart-shaped' area of bilateral medial medullary signal change — rare, and the quadriparesis with tongue weakness is regularly mistaken for Guillain-Barré" },
      monitoringExtra: ["RESPIRATORY function specifically: medullary infarction can impair the drive to breathe, and this is missed while the limbs are being examined"],
    },
    "AICA territory infarct": {
      slots: { level: "hearing, facial power and crossed sensory loss",
               flavour: "AICA is the one brainstem stroke that DEAFENS, because the labyrinthine artery arises from it — but hearing loss does NOT separate it from a labyrinthitis, which is cochlear by definition and deafens too. What separates them is everything ELSE: ipsilateral facial weakness, crossed sensory loss, limb ataxia, or a Horner's syndrome, none of which a labyrinthitis produces" },
      confirmatoryExtra: ["Where the only findings are vertigo and hearing loss, HINTS is what decides: a NORMAL head impulse, direction-changing nystagmus or skew deviation points central, and a labyrinthitis cannot produce any of them"],
    },
    "AICA territory infarct involving the trigeminal complex": {
      slots: { level: "facial sensation and the corneal reflex, with the contralateral limbs",
               flavour: "ipsilateral facial sensory loss with contralateral limb sensory loss is the crossed pattern that pins the lateral pons" },
    },
    "Labyrinthine artery infarct (AICA territory)": {
      slots: { level: "hearing and the vestibular examination",
               flavour: "an isolated labyrinthine infarct can look exactly like vestibular neuritis — the discriminator is HEARING LOSS, and it usually heralds AICA territory disease behind it" },
      confirmatoryExtra: ["Sudden sensorineural hearing loss WITH vertigo in a vascular patient deserves posterior-circulation imaging, not just an audiogram"],
    },

    // ---- posterior fossa: the fourth ventricle is the danger ----
    "Cerebellar infarct (PICA)": {
      slots: { level: "conscious level, gait and nystagmus",
               flavour: "a PICA infarct can present as isolated vertigo with a normal-looking examination — a NORMAL head impulse in ongoing vertigo points central" },
      monitoringExtra: ["POSTERIOR-FOSSA SWELLING obstructs the fourth ventricle and kills by hydrocephalus and herniation, typically at 2-4 days — conscious level is the observation that matters most, and deterioration is a neurosurgical emergency"],
    },
    "Cerebellar infarct (SCA / PICA)": {
      slots: { level: "conscious level, limb coordination and truncal stability",
               flavour: "define WHICH territory: an SCA infarct sits above the horizontal fissure and an inferior infarct below it, and the swelling risk differs" },
      monitoringExtra: ["POSTERIOR-FOSSA SWELLING obstructs the fourth ventricle — watch conscious level through days 2-4 and involve neurosurgery early if the infarct is large"],
    },
    "Cerebellar infarct (vermian)": {
      slots: { level: "conscious level and truncal stability — a vermian lesion can leave the LIMBS almost normal",
               flavour: "a midline infarct with little limb ataxia is easily dismissed as non-neurological; truncal instability severe enough to prevent sitting unsupported is the sign that matters" },
      monitoringExtra: ["POSTERIOR-FOSSA SWELLING obstructs the fourth ventricle and causes fatal herniation with little warning, peaking at 2-4 days — hourly conscious level THROUGH THAT WINDOW even once the deficit has plateaued, and a low threshold for repeat imaging"],
    },

    // ---- the thalamus and hypothalamus ----
    "Artery of Percheron infarct": {
      slots: { level: "conscious level, vertical gaze and memory",
               flavour: "BILATERAL paramedian thalamic signal change from a SINGLE perforator — sudden hypersomnolence with vertical gaze palsy, routinely admitted as a metabolic encephalopathy" },
      bySite: {
        thalamus_arousal_paramedian: { level: "conscious level and the sleep-wake pattern" },
        thalamus_limbic: { level: "memory and behaviour, once arousal allows testing" },
      },
    },
    "Artery of Percheron or paramedian thalamic infarct": {
      slots: { level: "memory, arousal and the endocrine axis",
               flavour: "involvement extending to the mammillary bodies — and a mammillary body lesion in the right context is Wernicke's, not a stroke, so ask about nutrition before settling on vascular" },
      confirmatoryExtra: ["Where nutrition is at all in question, treat for Wernicke's in parallel rather than waiting to distinguish the two — the treatment is safe and the delay is not"],
    },

    // ---- the cord: the brain pathway does not apply ----
    "Spinal cord infarct (anterior spinal artery)": {
      slots: { level: "power, pinprick and sphincter function against the sensory level" },
      confirmatory: cordInfarct("the whole cord with diffusion sequences",
        "The signature is ANTERIOR: power and pinprick lost, VIBRATION AND PROPRIOCEPTION PRESERVED, because the dorsal columns have their own supply — that dissociation is what separates it from compression"),
      monitoringExtra: ["Sphincter function and a rising sensory level; and blood pressure deliberately kept UP rather than down, which is the opposite of the brain pathway"],
    },
    "Partial cord infarct": {
      slots: { level: "the asymmetry between the two sides, side by side" },
      confirmatory: cordInfarct("the cord at and above the clinical level",
        "A partial or hemicord pattern is more often demyelinating or compressive than ischaemic in a younger patient — the abruptness of onset is what argues for infarction"),
      monitoringExtra: ["Watch for the deficit becoming complete over hours, which is common early and changes the prognosis conversation"],
    },
    "Cord infarct": {
      slots: { level: "the long tracts and the sensory level" },
      confirmatory: cordInfarct("the cord, with sagittal and axial diffusion",
        "Ask specifically about a preceding interscapular or radicular PAIN at onset — it is present in a majority and is the feature that most distinguishes infarction from myelitis"),
      monitoringExtra: ["Bladder function from the outset — retention is often established before the patient reports it"],
    },
    "Aortic surgery, dissection or profound hypotension": {
      slots: { level: "power and pinprick against the sensory level, with sphincters" },
      confirmatory: cordInfarct("the whole cord, urgently",
        "THE AORTA IS THE DIAGNOSIS — image it. Cord infarction after aortic surgery or dissection follows loss of the segmental supply, and the artery of Adamkiewicz territory is the watershed that fails"),
      confirmatoryExtra: ["Where this follows aortic surgery, CSF DRAINAGE and raising the perfusion pressure are established measures to improve cord perfusion — so this is a diagnosis with an intervention, not merely a prognosis"],
      monitoringExtra: ["Blood pressure is kept UP rather than down, and a delayed deficit hours to days after apparently successful surgery is well recognised — so the cord is watched after the aorta is fixed"],
    },
    "Fibrocartilaginous embolism": {
      slots: { level: "power and pinprick, with the onset timing" },
      confirmatory: cordInfarct("the cord, with diffusion sequences",
        "Nucleus pulposus material embolising into the cord vessels — typically a YOUNG patient, often after minor exertion or a Valsalva, with SEVERE AXIAL PAIN at onset followed by a rapidly progressive deficit"),
      confirmatoryExtra: ["A diagnosis of exclusion made largely on the story and the pattern: young, abrupt, painful, and no other cause found — and it is the reason a young person with a sudden myelopathy is not automatically inflammatory"],
    },
    "Cord infarct at the conus": {
      slots: { level: "sphincter tone, saddle sensation and the ankle jerks" },
      confirmatory: cordInfarct("the conus and cauda equina",
        "At the conus the artery of Adamkiewicz territory is the vulnerable watershed — and sphincter failure appears EARLY here, disproportionate to the leg weakness"),
      monitoringExtra: ["Sphincter function is the outcome that matters most at this level — document it explicitly at every review rather than recording 'legs unchanged'"],
    },
  }),


  // ---- PROMOTED INTO TRANCHE 1 ON CLINICAL GROUNDS (owner ruling, 2026-08-18) ----
  // Only 2 host sites, so reuse count would have left it until tranche 3. It is nonetheless the app's
  // sharpest must-not-miss: both hosts are BPPV sites that badge "routine", and the whole clinical point
  // of the vestibular axis is that a peripheral-looking acute vestibular syndrome can be a stroke.
  "Posterior circulation stroke": dz("Posterior circulation stroke", {
    confirmatory: [
      "MRI with DWI — but a NEGATIVE early DWI does NOT exclude it: small posterior-fossa infarcts are missed in a substantial minority within the first 24-48 hours, so a convincing central examination outweighs a normal early scan",
      "CT angiography or MR angiography of the vertebrobasilar circulation, looking for vertebral dissection or basilar disease",
      "The bedside examination is the more sensitive test here: {flavour}",
      "Once the diagnosis is made, the usual ischaemic-stroke aetiology work-up — cardiac rhythm monitoring, echocardiography and vascular risk profiling",
    ],
    monitoring: [
      "SAFETY NET: a fluctuating or stuttering course in the posterior circulation can herald basilar occlusion — deterioration in conscious level, new cranial nerve signs or bilateral long-tract signs need immediate reimaging, not observation",
      "Swallow screen before anything by mouth, and monitor for the posterior-fossa oedema that peaks at 2-4 days and can obstruct CSF flow",
      "Track {level} on serial examination — that is where deterioration will show first",
    ],
    urgency: "emergency",
    referral: "Acute stroke pathway — time-critical, and reperfusion may be on the table",
    bySite: {
      peripheral_vestibular_posterior_canal: {
        level: "gaze holding, skew and limb coordination",
        flavour: "HINTS — a NORMAL head impulse in a patient with ongoing vertigo and nystagmus points CENTRAL, and direction-changing or downbeat positional nystagmus is not posterior-canal BPPV, whatever the Dix-Hallpike looks like",
      },
      peripheral_vestibular_horizontal_canal: {
        level: "gaze holding, skew and truncal stability",
        flavour: "HINTS — horizontal-canal BPPV also gives direction-changing nystagmus on the supine roll test, so the discriminators here are a normal head impulse, skew deviation, and truncal ataxia too severe to sit unsupported",
      },
    },
  }),

  "Intracerebral haemorrhage": dz("Intracerebral haemorrhage", {
    confirmatory: [
      "NON-CONTRAST CT is the immediate test and is diagnostic — this is the one situation where CT beats MRI for the primary question",
      "CT ANGIOGRAPHY in the same sitting: it looks for an underlying vascular lesion and for contrast extravasation within the haematoma, which predicts expansion",
      "Establish anticoagulant and antiplatelet exposure IMMEDIATELY — reversal is time-critical and is the single most modifiable factor in the first hour",
      "Delayed MRI with blood-sensitive sequences once stable, to find the cause the acute scan cannot show: lobar microbleeds suggesting amyloid angiopathy, an underlying tumour, or a cavernoma — {flavour}",
    ],
    monitoring: [
      "SAFETY NET: haematoma EXPANSION happens in the first hours and is the commonest cause of early deterioration — a fall in conscious level means repeat imaging immediately, not observation",
      "Blood pressure, conscious level and {level} on a frequent, defined schedule; intensive early blood-pressure lowering is standard practice and is a treatment, not a bystander observation",
      "Swallow screen before anything by mouth, and monitor for seizures, which are more frequent with lobar than deep haemorrhage",
      "A LOBAR haemorrhage in an older patient raises cerebral amyloid angiopathy, which changes future anticoagulation decisions permanently — flag it for the discharge summary rather than leaving it to be rediscovered",
    ],
    urgency: "emergency",
    referral: "Acute stroke pathway with neurosurgery; critical care if conscious level is falling",
    bySite: {
      cortex_mca_superior: {
        level: "face and arm power and speech output",
        flavour: "a lobar location in this territory raises amyloid angiopathy in an older patient and an underlying lesion in a younger one",
      },
      cortex_insula: {
        level: "conscious level, and blood pressure and rhythm",
        flavour: "insular haemorrhage is associated with autonomic and cardiac instability out of proportion to the deficit",
      },
      cortex_parietal: {
        level: "cortical sensation, neglect and fields",
        flavour: "neglect can make the patient appear unconcerned and mask deterioration — do not rely on their report of change",
      },
      cortex_hand_knob: {
        level: "isolated hand function, which mimics a peripheral nerve lesion",
        flavour: "a small haemorrhage here produces a strikingly focal deficit, and the cause matters more than the volume",
      },
    },
  }),
};
