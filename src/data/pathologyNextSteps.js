// pathologyNextSteps.js — the PER-PATHOLOGY workup layer (spec 2026-08-18).
//
//   pathologyPlanFor(name, site) -> { confirmatory, monitoring, urgency, referral } | null
//
// The Next steps card was keyed by SITE, so it unioned every pathology that could produce a lesion there:
// clinically useful while the cause is unknown, wrong the moment it is known — which is usually straight
// after the immediate steps. A card that speaks for ten diseases at once must either say everything
// (noise) or say only what they share (blandness).
//
// Keyed by pathology NAME with per-site interpolation — the sbSpine / nvSpine / rtSpine / rootNS idiom,
// applied to diseases instead of corridors. One `dz()` spine carries what is true of the disease
// everywhere; `bySite` fills the slots that differ, so no two sites emit the same text for a shared name.
//
// DELIBERATELY NOT keyed by canonicalKey(): that collapses 93 names onto 10 very coarse entities — the
// `Metastases` entity alone swallows 40 names, from "Orbital tumour or metastasis" to "Metastasis to the
// pituitary stalk" to "Vertebral metastasis or myeloma", which share almost no workup. Keying by it would
// recreate exactly the blandness this layer exists to remove. Exact synonyms are handled narrowly by
// PATHOLOGY_ALIAS instead.
//
// This file is the CLINICAL CONTENT. It imports nothing from the UI and nothing from nextSteps.js, so a
// reviewer reads only this file. Teaching prompts, not directives — no doses, no definitive management.

// Slot defaults used when a site has no `bySite` entry. Neutral, never invented specifics.
const DEFAULTS = { level: "the affected region", flavour: "the appearance expected for this lesion" };

const fill = (str, slots) => str.replace(/\{([a-z]+)\}/g, (_, k) => slots[k] ?? DEFAULTS[k] ?? "");

const dz = (name, { confirmatory = [], monitoring = [], urgency = null, referral = null, bySite = {} }) =>
  ({ name, confirmatory, monitoring, urgency, referral, bySite });

// Exact synonyms only — two spellings of ONE disease that must share one plan. NOT a place to merge
// related-but-different entities; the no-two-identical-plans invariant is what keeps that honest.
export const PATHOLOGY_ALIAS = {};

// REVIEW STATUS. Content is authored here and held for the owner's (a clinician's) sign-off before it is
// relied on, the same gate every other clinical layer in this repo passed through.
//   ✅ Round 1 SIGNED OFF 2026-08-18 — posterior circulation stroke + the infective six.
//   ⚠  Round 2 awaiting review — the neoplastic seven.
export const PATHOLOGY_NEXT = {
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

  // ---- INFECTIVE TRANCHE (2026-08-18) ----
  "Basal meningitis (tuberculous, carcinomatous or fungal)": dz("Basal meningitis (tuberculous, carcinomatous or fungal)", {
    confirmatory: [
      "CSF is the test, and VOLUME matters — tuberculous and malignant cells are both sparse, so send as much as is safe and be prepared to repeat; a single normal-looking sample does not settle it",
      "Send CSF for cell count and differential, protein, PAIRED serum and CSF glucose, mycobacterial culture and PCR, fungal stain, cryptococcal antigen, and CYTOLOGY — cytology should be repeated up to three times, since a first sample misses a substantial share of carcinomatous meningitis",
      "MRI {level} WITH contrast, looking for the basal meningeal enhancement that links these nerve palsies to one process",
      "Look for the systemic source the meninges are reflecting: chest imaging, HIV testing, and a search for a primary malignancy",
    ],
    monitoring: [
      "Track the cranial nerves SERIALLY and by name — {flavour} — because progression from one nerve to the next is the clearest sign the process is uncontrolled",
      "SAFETY NET: hydrocephalus is the complication that kills in tuberculous meningitis — a falling conscious level, headache or vomiting means urgent reimaging, not reassurance",
      "Watch sodium: inappropriate ADH secretion and cerebral salt wasting are both common here and are managed in opposite directions",
    ],
    urgency: "urgent",
    referral: "Neurology with infectious diseases; neuro-oncology where the picture is malignant",
    bySite: {
      skull_base_cpa: {
        level: "brain and the internal auditory meati",
        flavour: "hearing, facial sensation and facial movement, since the cerebellopontine angle nerves fail in a recognised order",
      },
      skull_base_jugular_foramen: {
        level: "brain and the skull base",
        flavour: "swallow, palatal elevation, voice and shoulder shrug, which is where a jugular foramen process declares itself",
      },
      skull_base_orbital_apex: {
        level: "brain and the orbits",
        flavour: "acuity, colour vision and each eye movement separately — the optic nerve is what is lost first and least recoverably here",
      },
      visual_pathway_optic_tract: {
        level: "brain, with dedicated views of the chiasm and suprasellar cistern",
        flavour: "formal visual fields, which map the tract lesion far better than confrontation does",
      },
    },
  }),

  "Herpes zoster": dz("Herpes zoster", {
    confirmatory: [
      "The diagnosis is usually clinical, from a painful eruption in one dermatome — {flavour}",
      "Where the rash is atypical or absent, PCR of a vesicle swab (or of CSF in zoster sine herpete) confirms it",
      "Ask about immunosuppression, and consider HIV testing in a younger patient or where more than one dermatome is involved",
    ],
    monitoring: [
      "Segmental motor weakness accompanies the rash in a minority and is easily missed — examine {level} specifically rather than assuming the deficit is sensory",
      "SAFETY NET: involvement of the ophthalmic division threatens the eye and needs same-day ophthalmology; a rash in the ear with facial weakness is Ramsay Hunt and is treated as an urgency",
      "Post-herpetic neuralgia is the common legacy — flag it early, since pain persisting beyond the rash is the outcome that most affects the patient",
    ],
    urgency: "urgent",
    referral: "Primary care for most; ophthalmology same-day for the ophthalmic division, and neurology if there is motor involvement or dissemination",
    bySite: {
      root_c5: {
        level: "shoulder abduction and elbow flexion",
        flavour: "the C5 dermatome over the shoulder cap and lateral upper arm, where segmental zoster paresis mimics a brachial plexus lesion",
      },
      root_t4: {
        level: "nothing motor — a thoracic root has no limb myotome to test",
        flavour: "a band of pain at the nipple line, which is regularly mistaken for cardiac or pleuritic pain before the rash appears",
      },
      root_l5: {
        level: "ankle dorsiflexion, great-toe extension and hip abduction",
        flavour: "the L5 dermatome over the dorsum of the foot, where the pain precedes the rash and imitates a disc",
      },
    },
  }),

  "Lyme radiculitis (Bannwarth syndrome)": dz("Lyme radiculitis (Bannwarth syndrome)", {
    confirmatory: [
      "Two-tier serology (ELISA then immunoblot) on SERUM, interpreted against the exposure history — a positive test without plausible exposure is more likely a false positive than a diagnosis",
      "CSF showing a lymphocytic pleocytosis with raised protein, and — the discriminating test — an intrathecal antibody index demonstrating antibody made inside the CSF rather than leaked from blood",
      "Ask directly about tick exposure, travel to an endemic area, and a preceding erythema migrans rash, which the patient often has not connected to the pain — {flavour}",
    ],
    monitoring: [
      "Examine for the other neuroborreliosis manifestations that travel with it: facial palsy (which can be bilateral) and a painful radiculitis in more than one root",
      "Track {level}, since motor involvement follows the pain by days to weeks and changes the prognosis",
      "SAFETY NET: severe radicular pain that is worse at night and unresponsive to simple analgesia is the classic presentation, but the same description fits malignant infiltration — if serology is negative, image rather than treating empirically",
    ],
    urgency: "urgent",
    referral: "Neurology with infectious diseases",
    bySite: {
      root_t4: {
        level: "nothing motor at this level — follow the pain and the sensory band",
        flavour: "Bannwarth syndrome is characteristically THORACIC and characteristically painful, and is repeatedly worked up as a cardiac or abdominal problem first",
      },
      root_l5: {
        level: "ankle dorsiflexion and great-toe extension",
        flavour: "a painful lumbar radiculitis with no disc on imaging should prompt the exposure history rather than a repeat scan",
      },
      root_c6: {
        level: "elbow flexion and wrist extension",
        flavour: "a cervical radiculitis with severe nocturnal pain and a normal MRI is the presentation that most often goes unrecognised",
      },
    },
  }),

  "Cerebral abscess": dz("Cerebral abscess", {
    confirmatory: [
      "MRI with DIFFUSION-WEIGHTED imaging — a pyogenic abscess cavity RESTRICTS diffusion, which is what separates it from the necrotic centre of a tumour on an otherwise identical ring-enhancing lesion",
      "Blood cultures before antibiotics, and hunt the source: dental, sinus, middle ear, and echocardiography for endocarditis or a right-to-left shunt",
      "Aspiration gives both the organism and decompression, and is usually the step that settles the diagnosis — discuss with neurosurgery early rather than treating blind",
      "Image {level} to define the lesion in relation to {flavour}",
    ],
    monitoring: [
      "SAFETY NET: do NOT perform a lumbar puncture where there is a mass lesion with oedema — it risks herniation and rarely yields the organism anyway",
      "Watch conscious level and for seizures; monitor for the mass effect that peaks as the capsule matures",
      "Track {level} on serial examination, and reimage on any deterioration rather than waiting for a scheduled scan",
    ],
    urgency: "emergency",
    referral: "Neurosurgery and infectious diseases together, with acute neurology",
    bySite: {
      cortex_operculum: {
        level: "speech output and face and arm power",
        flavour: "the sylvian fissure and the frontal operculum, where a dental or sinus source spreads most readily",
      },
      cortex_parietal: {
        level: "cortical sensation, neglect and visual fields",
        flavour: "the parietal convexity, where a subtle field cut is the earliest sign of expansion",
      },
      cortex_mca_superior: {
        level: "face and arm power and speech output",
        flavour: "the superior MCA division territory, which an embolic source from endocarditis reaches first",
      },
    },
  }),

  "Herpes simplex encephalitis": dz("Herpes simplex encephalitis", {
    confirmatory: [
      "CSF HSV PCR — it can be NEGATIVE in the first 48 hours, so an early negative neither excludes the diagnosis nor justifies stopping treatment; repeat it rather than abandoning it",
      "MRI {level} — {flavour}",
      "EEG, looking for lateralised periodic discharges over the affected region, which are often abnormal before the MRI is",
      "CSF cell count, protein and glucose alongside the PCR: a lymphocytic pleocytosis with red cells and raised protein supports it",
    ],
    monitoring: [
      "SAFETY NET: treatment is started on SUSPICION and continued while the PCR is awaited — waiting for confirmation before treating is the error this diagnosis is known for, and the delay is what determines the outcome",
      "Watch conscious level and for seizures, which are frequent and often subtle; consider continuous EEG if the patient is not waking as expected",
      "Track {level}, and reimage if new focal signs appear — haemorrhagic transformation and swelling of the affected lobe are the complications to anticipate",
    ],
    urgency: "emergency",
    referral: "Acute neurology with infectious diseases; critical care if conscious level is falling",
    bySite: {
      cortex_temporal: {
        level: "memory, language comprehension and behaviour",
        flavour: "ASYMMETRIC medial temporal and insular signal change on FLAIR and diffusion, often with a haemorrhagic component — the asymmetry is the clue",
      },
      cortex_anterior_temporal: {
        level: "memory and behaviour",
        flavour: "anterior temporal involvement extending into the insula and cingulate, characteristically sparing the basal ganglia — a lesion that crosses into the basal ganglia argues for something else",
      },
      cortex_insula: {
        level: "speech, and autonomic stability",
        flavour: "insular signal change continuous with the temporal lobe, which is the earliest MRI finding in many cases",
      },
    },
  }),

  "Skull-base osteomyelitis (malignant otitis externa)": dz("Skull-base osteomyelitis (malignant otitis externa)", {
    confirmatory: [
      "Examine the EAR CANAL and look for granulation tissue at the bony-cartilaginous junction — that finding in a diabetic or elderly patient with deep otalgia and a cranial neuropathy is the diagnosis until proven otherwise",
      "Culture the canal — Pseudomonas aeruginosa is the usual organism — and biopsy the granulation tissue, which is also how a squamous carcinoma masquerading as this is excluded",
      "CT of the skull base for BONE erosion, plus MRI for the soft-tissue and intracranial extent; they answer different questions and are not alternatives",
      "Nuclear imaging tracks disease ACTIVITY and response over time, which anatomical imaging cannot — bone changes persist long after the infection is controlled",
      "Inflammatory markers serially, since ESR is a practical marker of response through a long treatment course",
    ],
    monitoring: [
      "Track {level} by name at every review — {flavour} — because progressive cranial neuropathy is how uncontrolled disease announces itself",
      "SAFETY NET: this is a months-long treatment, and relapse after stopping is well recognised; a returning headache or a new nerve palsy after apparent recovery needs reassessment, not reassurance",
      "Optimise glycaemic control alongside the antimicrobial course — it materially affects the outcome",
    ],
    urgency: "urgent",
    referral: "ENT and infectious diseases jointly, with neurology for the cranial neuropathies",
    bySite: {
      skull_base_vii_mastoid: {
        level: "facial movement, including the forehead",
        flavour: "a facial palsy here is the commonest first nerve to go and marks disease that has left the canal",
      },
      skull_base_jugular_foramen: {
        level: "swallow, palatal elevation, voice and shoulder shrug",
        flavour: "spread to the jugular foramen means the disease has crossed the skull base, and carries a materially worse prognosis",
      },
      skull_base_hypoglossal_canal: {
        level: "tongue protrusion, looking for deviation and wasting",
        flavour: "hypoglossal involvement indicates spread medially along the skull base — among the latest and most ominous signs",
      },
      skull_base_petrous_apex: {
        level: "eye abduction and facial sensation",
        flavour: "petrous apex involvement reproduces Gradenigo's triad, and here it is infective rather than neoplastic",
      },
    },
  }),

  // ---- NEOPLASTIC TRANCHE (2026-08-18) ----
  // Four of these canonicalise onto the coarse `Metastases` entity but are genuinely different workups —
  // a vertebral metastasis and a perineural spread share almost nothing — so they are authored separately
  // and deliberately NOT aliased.
  "Glioma / metastasis": dz("Glioma / metastasis", {
    confirmatory: [
      "MRI brain WITH contrast — the question a plain scan cannot answer is whether this is one lesion or many, and that changes the whole pathway",
      "If the lesions are multiple, the working diagnosis is metastatic until proven otherwise: hunt the primary with CT chest, abdomen and pelvis before biopsying the brain",
      "If the lesion is solitary, tissue is what settles it — discuss with neuro-oncology and neurosurgery, since resection and biopsy answer different questions",
      "Advanced sequences (perfusion, spectroscopy) help separate tumour from abscess and from demyelination where the ring enhancement is ambiguous — {flavour}",
    ],
    monitoring: [
      "Seizure risk is high in cortical lesions: ask specifically about focal events the patient has not reported as seizures, and counsel about DRIVING, which is a legal obligation and is regularly overlooked",
      "Track {level} — a progressive deficit over days rather than weeks suggests haemorrhage into the lesion or expanding oedema, not tumour growth",
      "SAFETY NET: morning headache, vomiting or a falling conscious level is raised intracranial pressure and needs urgent reimaging",
    ],
    urgency: "urgent",
    referral: "Neuro-oncology multidisciplinary team, with neurosurgery",
    bySite: {
      cortex_temporal: {
        level: "memory, comprehension and behaviour",
        flavour: "in the temporal lobe the differential includes an abscess, which restricts on diffusion where a necrotic tumour does not",
      },
      cortex_motor_facearm: {
        level: "face and arm power",
        flavour: "a lesion on the motor strip makes the resection question a functional one — functional MRI or awake mapping may be needed to define the margin",
      },
      cortex_occipital: {
        level: "visual fields, formally rather than to confrontation",
        flavour: "an occipital lesion is a common site for a metastasis and the field defect is often the only sign",
      },
      cortex_arcuate: {
        level: "repetition, naming and fluency separately",
        flavour: "a lesion in the arcuate fasciculus is white-matter disease — infiltrative glioma and demyelination look far more alike here than at the cortex",
      },
    },
  }),

  "Nerve sheath tumour (schwannoma / neurofibroma)": dz("Nerve sheath tumour (schwannoma / neurofibroma)", {
    confirmatory: [
      "ULTRASOUND of the nerve is the accessible first test and often diagnostic — a fusiform swelling continuous with the nerve, with the fascicles entering and leaving it",
      "MRI of the affected segment with contrast for anything deep, large, or where ultrasound is equivocal",
      "Nerve conduction studies and EMG localise the block to the lesion and give a baseline against which recovery after surgery is judged",
      "Examine {level}, and look for the features of a tumour-predisposition syndrome — café-au-lait macules, axillary freckling, and lesions on more than one nerve",
    ],
    monitoring: [
      "SAFETY NET: rapid growth, new PAIN in a previously painless lump, or a sudden progressive deficit suggests malignant transformation and needs urgent reimaging — this is the one thing that changes an indolent lesion into an emergency",
      "A slowly progressive deficit over months to years is expected; document {level} at intervals so that a change of pace is visible rather than inferred",
      "{flavour}",
    ],
    urgency: "routine",
    referral: "Peripheral nerve surgery (plastics or neurosurgery), with genetics where more than one nerve is involved",
    bySite: {
      nerve_peroneal_deep: {
        level: "ankle dorsiflexion, great-toe extension and the first web space",
        flavour: "a Tinel's sign FIXED at one point along the nerve, rather than migrating with recovery, is what distinguishes a mass from a compressive palsy",
      },
      nerve_ulnar_wrist: {
        level: "the intrinsic hand muscles and sensation in the ulnar one and a half digits",
        flavour: "at the wrist a ganglion in Guyon's canal produces the same picture — imaging is what tells them apart",
      },
      nerve_pudendal: {
        level: "perineal sensation, sphincter tone and the anal wink",
        flavour: "a pelvic lesion here needs MRI rather than ultrasound, and warrants early specialist involvement given the functional stakes",
      },
      nerve_lat_fem_cutaneous: {
        level: "sensation over the lateral thigh — there is nothing motor to test",
        flavour: "a purely sensory nerve makes serial examination unreliable; imaging carries more of the follow-up here",
      },
    },
  }),

  "Perineural spread of head-and-neck malignancy": dz("Perineural spread of head-and-neck malignancy", {
    confirmatory: [
      "ASK ABOUT PREVIOUS FACIAL SKIN CANCER, however minor and however long ago — an excised lesion years earlier is the history that makes this diagnosis, and patients do not volunteer it",
      "MRI skull base with contrast and FAT SATURATION, tracking the nerve back to the skull base foramina — fat saturation is what makes the enhancing nerve visible against marrow, and a study without it can be reported as normal",
      "Look for the indirect signs: foraminal widening, loss of the normal fat pad at the foramen, and denervation change in the muscles supplied — {flavour}",
      "Tissue diagnosis where the primary is unknown, in discussion with head-and-neck surgery; PET-CT may find the primary when imaging of the nerve does not",
    ],
    monitoring: [
      "Track {level} by name at each review — spread is CONTIGUOUS along the nerve, so the sequence in which nerves fail maps the direction of travel",
      "SAFETY NET: progressive facial numbness WITH PAIN is malignant until proven otherwise; a normal first scan does not exclude it, and a repeat scan after an interval is often what makes the diagnosis",
      "Watch the eye where the ophthalmic division is involved — a numb cornea loses its blink reflex and ulcerates silently",
    ],
    urgency: "urgent",
    referral: "Head-and-neck oncology multidisciplinary team, with neurology and ophthalmology as the nerves dictate",
    bySite: {
      pons_lateral_trigeminal: {
        level: "facial sensation in all three divisions, corneal reflex, and the muscles of mastication",
        flavour: "disease reaching the pons has travelled the whole length of the nerve — image the entire course, not the brainstem alone",
      },
      skull_base_vii_parotid: {
        level: "each facial branch separately, since spread picks off branches one at a time",
        flavour: "a facial palsy that is PROGRESSIVE, painful, or involves branches unequally is not Bell's palsy — image the parotid",
      },
      skull_base_cpa: {
        level: "hearing, facial sensation and facial movement",
        flavour: "involvement at the cerebellopontine angle means intracranial extension and changes the treatment intent",
      },
      skull_base_optic_canal: {
        level: "acuity and colour vision, which fail before the field does",
        flavour: "optic canal involvement threatens vision irreversibly and is the finding that makes this urgent rather than routine",
      },
    },
  }),

  "Schwannoma / meningioma / metastasis": dz("Schwannoma / meningioma / metastasis", {
    confirmatory: [
      "MRI skull base with contrast and thin slices through {level} — the three diagnoses in this heading look different on imaging, and the point of the scan is to separate them rather than confirm 'a mass'",
      "A schwannoma follows the nerve and expands its foramen; a meningioma sits on dura with a tail and may hyperostose the adjacent bone; a metastasis destroys bone and rarely respects a compartment",
      "CT adds what MRI cannot show — bone erosion versus hyperostosis, which is often the discriminator",
      "Where a metastasis is plausible, look for the primary before biopsying the skull base",
    ],
    monitoring: [
      "These are typically slow: document {flavour} at intervals so the RATE is measurable, since rate is what drives the decision to treat rather than watch",
      "SAFETY NET: an abrupt change of pace, new pain, or involvement of a second nerve argues against a benign lesion and warrants earlier reimaging",
      "Watch for the deficits the patient compensates for and does not report — a slowly progressive palsy is often only found on examination",
    ],
    urgency: "routine",
    referral: "Skull-base multidisciplinary team (neurosurgery with ENT), and neuro-oncology where metastasis is likely",
    bySite: {
      skull_base_trochlear_cisternal: {
        level: "the cisternal course of the fourth nerve",
        flavour: "vertical diplopia, the head tilt, and the fundus for any sign of raised pressure",
      },
      skull_base_orbital_apex: {
        level: "the orbital apex and superior orbital fissure",
        flavour: "acuity, colour vision, proptosis and each eye movement separately",
      },
      skull_base_vii_parotid: {
        level: "the parotid and the stylomastoid foramen",
        flavour: "each facial branch, and the parotid itself for a palpable mass",
      },
      skull_base_xii_neck: {
        level: "the hypoglossal canal and the upper neck",
        flavour: "tongue protrusion for deviation, and the tongue at rest for wasting and fasciculation",
      },
    },
  }),

  "Vertebral metastasis or myeloma": dz("Vertebral metastasis or myeloma", {
    confirmatory: [
      "MRI the WHOLE SPINE, not the symptomatic level alone — metastatic disease is multi-level in a large share of cases, and a second, higher lesion changes the plan entirely",
      "Myeloma screen — serum and urine electrophoresis with free light chains — alongside FBC, calcium, renal function and ESR",
      "CT chest, abdomen and pelvis for a primary, and consider bone-specific imaging where the plain films look normal but the pain is convincing",
      "Plain films are NOT reassuring here: substantial trabecular bone must be lost before a lesion is visible, so a normal X-ray with night pain means image again, better",
    ],
    monitoring: [
      "SAFETY NET: this is the pathway to METASTATIC SPINAL CORD COMPRESSION. New or progressive weakness, a sensory level, or bladder or bowel dysfunction is an emergency — image the whole spine the same day, do not wait for a clinic slot",
      "Check CALCIUM: hypercalcaemia is common, presents as confusion, constipation and thirst rather than as anything neurological, and is readily treatable",
      "Track {level} and the pain pattern — {flavour}",
    ],
    urgency: "urgent",
    referral: "Oncology and spinal surgery jointly; haematology where myeloma is likely",
    bySite: {
      root_t4: {
        level: "for any sensory LEVEL on the trunk, not just the radicular band",
        flavour: "thoracic pain worse at night and on lying flat is the classic warning, and the thoracic cord is the commonest site of compression",
      },
      root_l5: {
        level: "ankle dorsiflexion, great-toe extension and hip abduction",
        flavour: "below the conus a lesion gives a cauda equina rather than a cord picture — ask directly about saddle sensation and sphincter function",
      },
      root_s1: {
        level: "plantarflexion, the ankle jerk, and saddle sensation",
        flavour: "sacral involvement sits closest to the sphincters, so the safety-netting questions matter most here",
      },
      root_l1: {
        level: "hip flexion, and the conus reflexes",
        flavour: "the conus sits around this level, and a conus lesion produces early sphincter failure with relatively little weakness",
      },
    },
  }),

  "Nerve-root schwannoma or neurofibroma": dz("Nerve-root schwannoma or neurofibroma", {
    confirmatory: [
      "MRI of the relevant spinal segment WITH contrast — the lesion is typically a dumbbell mass widening the exit foramen, which is what separates it from a disc",
      "Nerve conduction studies and EMG confirm the root level where imaging shows more than one candidate",
      "Look for a predisposition syndrome: café-au-lait macules, axillary freckling, and lesions at more than one root point to neurofibromatosis and change the follow-up",
      "Examine {level} to document the baseline deficit before any intervention",
    ],
    monitoring: [
      "The discriminating history is pain worse at NIGHT AND AT REST which does NOT ease on lying down — {flavour}",
      "SAFETY NET: rapid growth or a sudden change in pain character raises malignant peripheral nerve sheath tumour, particularly in neurofibromatosis, and needs urgent reimaging",
      "A preserved reflex alongside progressive weakness over months to years is characteristic; re-examine {level} at intervals so the rate is documented",
    ],
    urgency: "routine",
    referral: "Spinal neurosurgery, with genetics where more than one lesion is present",
    bySite: {
      root_c5: {
        level: "shoulder abduction and the biceps jerk",
        flavour: "unlike a C5 disc, the pain does not ease on lying down, and the biceps jerk is often preserved longer than the weakness would suggest",
      },
      root_l5: {
        level: "ankle dorsiflexion, great-toe extension and hip abduction",
        flavour: "a foot drop with a PRESERVED ankle jerk and night pain that lying flat does not relieve is the pattern that should prompt imaging rather than physiotherapy",
      },
      root_s2: {
        level: "saddle sensation, sphincter tone and the anal wink",
        flavour: "a sacral root lesion threatens sphincter function early, so the threshold for imaging is lower here than the indolent history suggests",
      },
      root_t1: {
        level: "the small muscles of the hand, and the sympathetic supply — look for a Horner's syndrome",
        flavour: "a T1 lesion with Horner's raises an apical lung tumour as the competing diagnosis, and that must be excluded first",
      },
    },
  }),

  "Nasopharyngeal carcinoma": dz("Nasopharyngeal carcinoma", {
    confirmatory: [
      "NASENDOSCOPY WITH BIOPSY of the fossa of Rosenmüller — this is the test that makes the diagnosis, and it is the step most often delayed while imaging is repeated",
      "MRI skull base and nasopharynx with contrast, plus CT for bone erosion at {level}",
      "Examine the NECK for nodes — a painless upper cervical node is frequently the presenting sign and is the easiest thing to biopsy",
      "Ask about the ear: unilateral serous otitis media in an adult is obstruction of the Eustachian tube until proven otherwise, and warrants nasendoscopy rather than grommets alone",
      "Epstein-Barr virus serology and plasma EBV DNA support the diagnosis and are used to monitor response in endemic disease",
    ],
    monitoring: [
      "Track {level} by name — {flavour} — since sequential cranial neuropathy maps the direction of spread",
      "SAFETY NET: a sixth-nerve palsy with deep facial or retro-orbital pain, a blocked ear, epistaxis or a neck node is this diagnosis until nasendoscopy says otherwise; an isolated sixth-nerve palsy attributed to microvascular disease that does not recover needs reassessment",
      "Hearing, swallow and nutrition through treatment, all of which are affected by the disease and by its treatment",
    ],
    urgency: "urgent",
    referral: "Head-and-neck oncology multidisciplinary team, urgently",
    bySite: {
      skull_base_vi_petrous_apex: {
        level: "the petrous apex and Dorello's canal",
        flavour: "eye abduction and facial sensation — the sixth nerve is characteristically the first to go",
      },
      skull_base_v3_ovale: {
        level: "the foramen ovale",
        flavour: "sensation over the chin and jaw, and the muscles of mastication — numb chin is a sinister sign",
      },
      skull_base_collet_sicard: {
        level: "the jugular foramen and hypoglossal canal together",
        flavour: "swallow, voice, shoulder shrug and tongue movement — four nerves failing together means extensive skull-base disease",
      },
      skull_base_hypoglossal_canal: {
        level: "the hypoglossal canal",
        flavour: "tongue protrusion and the tongue at rest, for deviation and wasting",
      },
    },
  }),

  "Spinal epidural abscess": dz("Spinal epidural abscess", {
    confirmatory: [
      "Blood cultures (at least two sets) BEFORE antibiotics wherever the delay is acceptable — the organism guides everything that follows",
      "MRI {level} WITH gadolinium — skip lesions at a non-contiguous level are common, which is why the imaged field matters here",
      "CRP and ESR serially — they track the response better than the white cell count does",
    ],
    monitoring: [
      "Hourly neurological observations while the deficit is evolving — {flavour}",
      "SAFETY NET: new or worsening weakness, or bladder or bowel dysfunction, is a surgical emergency, not a reason to wait for the next scan",
    ],
    urgency: "emergency",
    referral: "Emergency neurosurgery / spinal surgery, with infectious diseases alongside",
    bySite: {
      cord_transverse: {
        level: "the WHOLE spine",
        flavour: "a RISING sensory level is the sign that the collection is expanding",
      },
      root_l5: {
        level: "the whole spine, not the symptomatic level alone",
        flavour: "watch for a radicular deficit becoming a cord or cauda equina syndrome",
      },
    },
  }),
};

export function pathologyPlanFor(name, site) {
  const key = PATHOLOGY_ALIAS[name] || name;
  const p = PATHOLOGY_NEXT[key];
  if (!p) return null;
  const slots = { ...DEFAULTS, ...(p.bySite[site?.id] || p.bySite[`${site?.level}_${site?.part}`] || {}) };
  return {
    confirmatory: p.confirmatory.map(s => fill(s, slots)),
    monitoring: p.monitoring.map(s => fill(s, slots)),
    urgency: p.urgency,
    referral: p.referral,
  };
}
