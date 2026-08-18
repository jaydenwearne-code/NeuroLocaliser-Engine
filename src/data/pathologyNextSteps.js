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
export const PATHOLOGY_ALIAS = {
  // Two spellings of ONE disease, at DISJOINT sets of sites (31 keys vs 6), which is exactly how the
  // duplicate survived the causes sweep unnoticed. The plan is authored under "Demyelination" and the MS
  // spelling resolves onto it, so the two can never drift apart into two half-maintained workups.
  "Demyelination (MS)": "Demyelination",
};

// REVIEW STATUS. Content is authored here and held for the owner's (a clinician's) sign-off before it is
// relied on, the same gate every other clinical layer in this repo passed through.
//   ✅ Round 1 SIGNED OFF 2026-08-18 — posterior circulation stroke + the infective six.
//   ✅ Round 2 SIGNED OFF 2026-08-18 — the neoplastic seven.
//   ✅ Round 3 SIGNED OFF 2026-08-18 — the inflammatory / vascular / metabolic nine, plus the MS alias.
//
// The first tranche is therefore COMPLETE and fully reviewed: 24 plans + 1 alias, 267 of 1286 rows (21%).
// Tranche 2 (the remaining 831 pathologies) is a separate project and is held to this same gate.
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

  // ---- INFLAMMATORY / VASCULAR / METABOLIC TRANCHE (2026-08-18) ----
  "Demyelination": dz("Demyelination", {
    confirmatory: [
      "MRI BRAIN AND WHOLE SPINE with contrast — dissemination in SPACE needs both, and an enhancing lesion alongside a non-enhancing one gives dissemination in TIME on a single scan",
      "MRI {level} — {flavour}",
      "CSF for oligoclonal bands, compared against a PAIRED serum sample: bands present in CSF and not in serum are what count, and they supply dissemination in time where imaging alone falls short",
      "Serum AQP4 and MOG antibodies to exclude the mimics BEFORE committing to a diagnosis of multiple sclerosis — they are different diseases with different treatments, and some MS therapies make NMOSD worse",
      "Visual evoked potentials where a second, clinically silent lesion would change the diagnosis",
    ],
    monitoring: [
      "Distinguish a true RELAPSE from a pseudo-relapse: a deficit re-emerging with heat, infection or fatigue (Uhthoff's phenomenon) is old damage unmasked, not new inflammation, and treating it as a relapse is a common error",
      "Track {level} against the documented baseline — a relapse is defined by new or worsening symptoms lasting more than 24 hours in the absence of fever",
      "SAFETY NET: a FIRST presentation already disseminated in space needs early specialist review — the window in which disease-modifying treatment most changes the long-term course is early, and it is easily lost to a routine referral",
      "Ask about the symptoms patients do not volunteer: bladder function, fatigue and mood, which affect quality of life more than the motor deficit does",
    ],
    urgency: "urgent",
    referral: "Neurology / multiple sclerosis service",
    bySite: {
      cord_lateral: {
        level: "the whole cord and brain",
        flavour: "a SHORT-segment, dorsolateral plaque spanning fewer than two vertebral bodies — a LONGITUDINALLY EXTENSIVE lesion is not typical MS and should redirect you to NMOSD or MOG antibody disease",
      },
      cord_posterior: {
        level: "the whole cord and brain",
        flavour: "a dorsal-column plaque, often with Lhermitte's phenomenon — check B12 too, since subacute combined degeneration occupies the same columns",
      },
      subcortex_optic_radiation: {
        level: "brain, with FLAIR and diffusion",
        flavour: "periventricular ovoid lesions lying perpendicular to the callosum (Dawson's fingers)",
      },
      visual_pathway_optic_tract: {
        level: "brain and orbits with fat-saturated contrast views",
        flavour: "an enhancing short segment of anterior visual pathway — and OCT of the retinal nerve fibre layer, which quantifies axonal loss the fundus cannot show",
      },
      corpus_callosum_splenium: {
        level: "brain, with sagittal FLAIR",
        flavour: "callosal-septal interface lesions, which are close to specific for demyelination and are missed on axial images alone",
      },
      pons_lateral: {
        level: "brain, with thin brainstem slices",
        flavour: "a brainstem plaque, which is where an internuclear ophthalmoplegia in a young patient comes from",
      },
      // ---- keys reached through the "Demyelination (MS)" alias ----
      medulla_lateral: {
        level: "brain and whole spine",
        flavour: "a medullary plaque — and if it sits at the area postrema with intractable hiccup or vomiting, that is an NMOSD archetype rather than MS",
      },
      cord_hemi: {
        level: "the whole cord and brain",
        flavour: "a hemicord plaque producing a partial Brown-Séquard picture, which in a young patient is demyelinating far more often than compressive",
      },
    },
  }),

  "Vasculitic mononeuritis multiplex": dz("Vasculitic mononeuritis multiplex", {
    confirmatory: [
      "Nerve conduction studies and EMG across MULTIPLE limbs — the diagnosis is a MULTIFOCAL, ASYMMETRIC, AXONAL process picking off named nerves one at a time, and studying only the symptomatic limb cannot show that",
      "NERVE BIOPSY (usually sural, ideally with adjacent muscle) is the definitive test where the diagnosis is not already secure from a systemic biopsy — take it from a nerve that is affected but not yet end-stage",
      "Bloods for the systemic disease behind it: ANCA, ANA, ENA, complement, cryoglobulins, rheumatoid factor, ESR and CRP, plus hepatitis B and C and HIV serology",
      "Look for the ORGAN involvement that outranks the nerve — urinalysis and renal function for glomerulonephritis, chest imaging for pulmonary haemorrhage; {flavour}",
    ],
    monitoring: [
      "SAFETY NET: this is a systemic disease presenting through a nerve. Renal or pulmonary involvement is what threatens life, and it can advance while attention is on the limb — check urinalysis at every review, not just at diagnosis",
      "Map the deficits by NAMED NERVE at each visit, including {level}, so that a new nerve is recognised as disease activity rather than attributed to the old lesion",
      "Painful, stepwise accumulation over days to weeks is the expected course; a symmetric length-dependent pattern emerging later means confluence, not resolution",
    ],
    urgency: "urgent",
    referral: "Neurology with rheumatology; nephrology urgently if there is any renal involvement",
    bySite: {
      nerve_peroneal_common: {
        level: "ankle dorsiflexion and eversion",
        flavour: "a painful foot drop that is NOT at the fibular head on imaging, and with no history of compression, is the classic first presentation",
      },
      nerve_ulnar_elbow: {
        level: "the intrinsic hand muscles and the ulnar sensory territory",
        flavour: "an ulnar palsy that appeared abruptly and painfully, rather than gradually, argues against a compressive lesion at the elbow",
      },
      nerve_sural: {
        level: "sensation over the lateral foot",
        flavour: "the sural nerve is also the usual biopsy target, so document its function before biopsy is considered",
      },
      nerve_radial_spiral_groove: {
        level: "wrist and finger extension, with brachioradialis",
        flavour: "a wrist drop without the classic Saturday-night history, especially if painful, should raise vasculitis rather than compression",
      },
      nerve_femoral: {
        level: "knee extension and the knee jerk",
        flavour: "a painful femoral neuropathy raises diabetic radiculoplexus neuropathy as the main competing diagnosis — the systemic screen is what separates them",
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

  "Radiation plexopathy": dz("Radiation plexopathy", {
    confirmatory: [
      "EMG looking for MYOKYMIC DISCHARGES — myokymia is the most useful single discriminator, being characteristic of radiation injury and not of tumour infiltration",
      "MRI of the plexus with contrast: radiation change is typically diffuse thickening with T2 signal change and LITTLE enhancement, whereas an infiltrating tumour tends to form an enhancing mass",
      "Establish the RADIOTHERAPY FIELD, dose and date, and check the plexus lay within it — the latency is typically months to many years, so the treatment is often not volunteered",
      "PET-CT where the distinction from recurrence remains unresolved, since the management diverges completely — {flavour}",
    ],
    monitoring: [
      "The discriminating clinical difference is PAIN: severe early pain favours tumour recurrence, while radiation plexopathy is characteristically more numb and weak than painful. A Horner's syndrome also favours tumour",
      "Track {level} — radiation plexopathy is typically slowly progressive and irreversible, so the realistic goal is function and pain, not reversal",
      "SAFETY NET: worsening pain, a new Horner's syndrome, or rapid progression should send you back to imaging for recurrence rather than being attributed to the radiation",
      "Refer early for rehabilitation, orthotics and lymphoedema management, which do more for function here than further investigation does",
    ],
    urgency: "routine",
    referral: "Neurology with the treating oncology team; rehabilitation medicine and pain services",
    bySite: {
      plexus_middle_trunk: {
        level: "elbow extension and wrist extension",
        flavour: "upper and middle plexus involvement after breast radiotherapy favours radiation injury, whereas tumour recurrence characteristically takes the LOWER plexus",
      },
      plexus_lower_trunk: {
        level: "the small muscles of the hand and the medial forearm",
        flavour: "LOWER-trunk involvement with pain and a Horner's syndrome favours tumour recurrence and must be excluded before accepting radiation injury",
      },
      plexus_lumbar_plexus: {
        level: "hip flexion and knee extension",
        flavour: "after pelvic radiotherapy the competing diagnoses are recurrence and, where the picture is bilateral, radiation-induced damage to the cauda equina",
      },
      plexus_sacral_plexus: {
        level: "ankle movement and sphincter function",
        flavour: "sacral involvement after pelvic radiotherapy warrants explicit questions about bladder, bowel and sexual function, which are rarely volunteered",
      },
    },
  }),

  "Wernicke's encephalopathy": dz("Wernicke's encephalopathy", {
    confirmatory: [
      "THIS IS A CLINICAL DIAGNOSIS AND TREATMENT COMES FIRST — parenteral thiamine is given on suspicion, BEFORE any glucose-containing fluid, because a glucose load in a thiamine-deplete patient can precipitate the encephalopathy",
      "MRI shows symmetrical signal change in the mammillary bodies, the periaqueductal grey and the medial thalami — but a NORMAL MRI DOES NOT EXCLUDE IT, and waiting for the scan is the error that causes the harm",
      "Do not wait for thiamine levels or red cell transketolase: the results arrive far too late to guide the decision",
      "Look for the deficiency's context beyond alcohol — hyperemesis, bariatric surgery, prolonged vomiting, malignancy and malnutrition all produce it, and the non-alcoholic cases are the ones that get missed",
    ],
    monitoring: [
      "The classic triad is present in a MINORITY — do not require confusion, ophthalmoplegia and ataxia together before treating; any one of them with a plausible history is enough",
      "Track {level} — {flavour} — and reassess after treatment begins, since the eye signs improve first and fastest and their improvement supports the diagnosis",
      "SAFETY NET: untreated or undertreated, this becomes KORSAKOFF SYNDROME, which is largely irreversible. Under-dosing and stopping early are as damaging as not treating",
      "Replace magnesium as well: thiamine-dependent enzymes need it, and thiamine may not work while magnesium is low",
    ],
    urgency: "emergency",
    referral: "Acute medicine and neurology; alcohol liaison where relevant",
    bySite: {
      thalamus_arousal_paramedian: {
        level: "conscious level and orientation",
        flavour: "paramedian thalamic involvement is what produces the confusion and drowsiness, and it is the component that recovers least",
      },
      skull_base_vi_cisternal: {
        level: "eye abduction, and the eyes for nystagmus",
        flavour: "a bilateral sixth-nerve palsy with nystagmus in this context is Wernicke's until treated otherwise",
      },
      pontomesencephalic_tegmentum: {
        level: "eye movements in all directions, and gait",
        flavour: "periaqueductal involvement gives the ophthalmoplegia — the sign that responds most visibly to treatment",
      },
      hypothalamus_thermoregulatory: {
        level: "temperature, and autonomic stability",
        flavour: "hypothalamic involvement can give hypothermia and hypotension, which are easily attributed to something else in an unwell patient",
      },
    },
  }),

  "Brainstem abscess or tuberculoma": dz("Brainstem abscess or tuberculoma", {
    confirmatory: [
      "MRI with contrast AND diffusion-weighted imaging — a pyogenic abscess restricts diffusion, while a tuberculoma more often shows central T2 hypointensity with rim enhancement",
      "Hunt the source and the systemic disease: blood cultures, chest imaging, HIV testing, interferon-gamma release assay, and echocardiography for endocarditis",
      "CSF where it is safe to obtain it, for mycobacterial PCR and culture — but weigh the mass effect first",
      "BIOPSY IS HAZARDOUS IN THE BRAINSTEM, so treatment is frequently empirical and guided by SERIAL IMAGING; involve neurosurgery and infectious diseases together before committing — {flavour}",
    ],
    monitoring: [
      "SAFETY NET: brainstem mass lesions threaten the airway and conscious level. Deteriorating swallow, a falling conscious level, or new bilateral long-tract signs need immediate reimaging and critical-care review",
      "Track {level} at defined intervals, since response is judged on serial examination as much as on serial scans",
      "Paradoxical ENLARGEMENT of a tuberculoma early in treatment is well recognised and is not automatically treatment failure — but it is a decision to make with specialist input, not an assumption",
      "Monitor for hydrocephalus, which complicates tuberculous disease in this region and is treatable",
    ],
    urgency: "emergency",
    referral: "Neurosurgery and infectious diseases jointly, with acute neurology",
    bySite: {
      pons_medial: {
        level: "eye movements, facial power and swallow",
        flavour: "a medial pontine lesion sits next to the sixth and seventh nuclei and the corticospinal tract, so a small increase in size produces a large change in deficit",
      },
      medulla_medial: {
        level: "tongue movement, swallow and respiratory pattern",
        flavour: "medial medullary involvement threatens respiratory drive and the airway earlier than the deficit suggests",
      },
      midbrain_medial: {
        level: "the third nerve, conscious level and pupils",
        flavour: "a midbrain lesion here risks obstruction at the aqueduct — watch for hydrocephalus as well as for the mass itself",
      },
      guillain_mollaret_rubral: {
        level: "tremor, palate and eye movements",
        flavour: "a lesion in the triangle may declare itself late, as palatal tremor developing months after the acute illness",
      },
    },
  }),

  // Listed in CAUSES as a MIMIC — not a lesion at this site at all. The workup reflects that: the job is to
  // exclude it at the bedside in seconds, before any of the structural pathway is embarked on.
  "Hypoglycaemia": dz("Hypoglycaemia", {
    confirmatory: [
      "CAPILLARY BLOOD GLUCOSE, IMMEDIATELY — before imaging, before bloods, before anything else. It takes seconds, it is the one fully reversible cause of a focal deficit, and it is missed by starting with the CT",
      "A LABORATORY glucose to confirm the capillary reading, drawn before treatment wherever that does not delay it",
      "Where hypoglycaemia is confirmed and unexplained, take the diagnostic samples AT THE TIME OF the low glucose — insulin, C-peptide, and a sulfonylurea screen — because after treatment the opportunity is gone",
      "Establish the cause: diabetes treatment, alcohol, liver disease, adrenal insufficiency, sepsis, or exogenous insulin",
    ],
    monitoring: [
      "SAFETY NET: hypoglycaemia can produce a DENSE FOCAL DEFICIT that mimics a stroke exactly, including hemiplegia and aphasia — and it is an explicit exclusion before thrombolysis. Treat it and re-examine before committing to the stroke pathway",
      "Recheck the glucose after treatment and again later: sulfonylurea and long-acting insulin hypoglycaemia RECURS after an initial correction, and patients are discharged into that relapse",
      "If {level} does not recover once the glucose is corrected, the deficit is structural and the stroke pathway resumes — a corrected glucose does not close the case",
      "{flavour}",
    ],
    urgency: "emergency",
    referral: "Acute medicine; diabetes team where the cause is treatment-related",
    bySite: {
      cortex_mca: {
        level: "the full hemispheric deficit",
        flavour: "profound hypoglycaemia has a recognised predilection for producing hemispheric and cortical deficits, so the resemblance to a large-vessel stroke is close",
      },
      subcortex_internal_capsule: {
        level: "the pure motor deficit",
        flavour: "a dense pure hemiparesis with a normal conscious level is an entirely plausible presentation of hypoglycaemia",
      },
      cortex_aphasia_global: {
        level: "language, once the patient is able to cooperate",
        flavour: "isolated aphasia from hypoglycaemia is well described and is regularly thrombolysed before the glucose is checked",
      },
    },
  }),

  "Malignant infiltration or vertebral metastasis": dz("Malignant infiltration or vertebral metastasis", {
    confirmatory: [
      "MRI the WHOLE SPINE with contrast, not the symptomatic level alone — disease is frequently multi-level, and the cervical cord leaves no margin for a missed second lesion",
      "CT chest, abdomen and pelvis for a primary, with dedicated APICAL views: a lower cervical root deficit with a Horner's syndrome is a Pancoast tumour until excluded",
      "Myeloma screen alongside it — serum and urine electrophoresis with free light chains, calcium, renal function and ESR",
      "Where the plexus rather than the root may be involved, EMG helps: {flavour}",
    ],
    monitoring: [
      "SAFETY NET: at cervical levels this threatens the CORD, and cord compression here affects all four limbs and the diaphragm. Any long-tract sign, any sensory level, or any sphincter change is a same-day emergency",
      "Track {level}, and ask specifically about neck pain worse at night and on lying flat — the history that precedes compression by weeks",
      "Check calcium: hypercalcaemia presents as confusion and constipation rather than as anything neurological, and is readily treatable",
      "Respiratory function where C3-C5 roots are involved, since diaphragmatic weakness is easy to miss until it is severe",
    ],
    urgency: "urgent",
    referral: "Oncology with spinal surgery; haematology where myeloma is likely",
    bySite: {
      root_c5: {
        level: "shoulder abduction, the biceps jerk, and the diaphragm",
        flavour: "myokymia would favour radiation injury over infiltration in a previously irradiated field",
      },
      root_c8: {
        level: "the small muscles of the hand, and the sympathetic supply for a Horner's syndrome",
        flavour: "lower cervical involvement with a Horner's syndrome points to an apical lung tumour invading the lower trunk",
      },
      root_c4: {
        level: "the diaphragm and shoulder elevation, with respiratory function formally",
        flavour: "at this level the phrenic supply is the finding that matters most and is the least likely to be tested",
      },
      root_c3: {
        level: "the diaphragm and neck flexion, with vital capacity",
        flavour: "a high cervical lesion threatens ventilation before it threatens the limbs",
      },
    },
  }),

  "Neuralgic amyotrophy": dz("Neuralgic amyotrophy", {
    confirmatory: [
      "The HISTORY is the diagnosis: abrupt, severe shoulder-girdle pain lasting days to weeks, with weakness appearing AS THE PAIN SUBSIDES. That sequence is what separates it from a compressive lesion, in which pain and weakness arrive together",
      "EMG and nerve conduction studies, but timed — changes take about three weeks to appear, so a study done immediately can be falsely reassuring",
      "MRI of the plexus and cervical spine to exclude a structural lesion, particularly where the picture is atypical or does not begin to recover",
      "High-resolution ULTRASOUND or MRI of the affected nerve may show the hourglass-like constrictions now recognised in this condition, which can change the surgical conversation — {flavour}",
    ],
    monitoring: [
      "Examine {level} specifically, including scapular winging with the arms pushed against a wall — the pattern is patchy and involves individual nerves rather than a whole trunk, and winging is missed unless it is looked for",
      "Recovery is usual but SLOW, over months to years, and is often incomplete; set that expectation early rather than at the first disappointing review",
      "Refer to physiotherapy early to protect shoulder range — a frozen shoulder on top of the weakness is a preventable second problem",
      "SAFETY NET: recurrent attacks, or a family history of them, raises HEREDITARY neuralgic amyotrophy and warrants genetic referral; progressive rather than recovering weakness should send you back to imaging",
    ],
    urgency: "routine",
    referral: "Neurology, with physiotherapy; peripheral nerve surgery where constrictions are demonstrated",
    bySite: {
      nerve_suprascapular: {
        level: "external rotation and the supraspinatus and infraspinatus for wasting",
        flavour: "the suprascapular nerve is the most commonly affected, and isolated external-rotation weakness is a characteristic presentation",
      },
      nerve_musculocutaneous: {
        level: "elbow flexion and the biceps jerk",
        flavour: "isolated biceps weakness after severe shoulder pain fits this far better than any single root lesion",
      },
      plexus_posterior_cord: {
        level: "shoulder abduction, elbow extension and wrist extension together",
        flavour: "involvement spanning a cord rather than one nerve is still compatible, but makes excluding a structural lesion more important",
      },
      root_c7: {
        level: "elbow extension and the triceps jerk",
        flavour: "a root-like distribution should prompt cervical imaging before the diagnosis is accepted",
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
