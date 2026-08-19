// infective.js — pathology workups for the INFECTIVE category.
//
// The recurring theme: take the sample BEFORE the antimicrobial where the delay is acceptable, and treat
// on suspicion where it is not.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS:
//   ✅ the 8 tranche-1 plans — SIGNED OFF 2026-08-18.
//   ⚠  CNS ABSCESS (7), ENCEPHALITIS (7), SKULL-BASE/ENT (11), DEEP SOFT-TISSUE (4) + singletons —
//      tranche 2 round 4, AWAITING REVIEW.
import { dz, family } from "./builders.js";

// ---- ROUND 4 (tranche 2): the infective red set ----
// 36 names, five mechanisms. What separates them is not the organism but WHAT THE INFECTION IS DOING:
// occupying space, inflaming parenchyma, eroding bone, collecting in soft tissue, or poisoning a synapse.

// CNS ABSCESS — a focal collection behaving as a mass. Two questions: what is it, and where did it come
// from. Aspiration usually answers both.
const ABSCESS_SPINE = {
  confirmatory: [
    "MRI with DIFFUSION-WEIGHTED imaging — a pyogenic abscess cavity RESTRICTS diffusion, which is what separates it from the necrotic centre of a tumour on an otherwise identical ring-enhancing lesion",
    "BLOOD CULTURES BEFORE ANTIBIOTICS, and hunt the source: dental, sinus, middle ear, endocarditis, and a right-to-left shunt in a patient with no other source — {flavour}",
    "ASPIRATION gives the organism AND decompresses, and is usually what settles the diagnosis — involve neurosurgery early rather than treating blind for weeks",
    "Test for HIV: it changes the differential to toxoplasmosis, tuberculoma and lymphoma, and it changes the empirical treatment",
  ],
  monitoring: [
    "SAFETY NET: do NOT perform a lumbar puncture where there is a mass with oedema — it risks herniation and rarely yields the organism anyway",
    "Track {level} and conscious level; reimage on any deterioration rather than at a scheduled interval, since the capsule matures and mass effect peaks after presentation",
    "Seizure risk is high and often the presenting event — treat, and do not attribute a post-ictal deficit to progression without imaging",
    "Treatment runs for weeks with serial imaging: the response is judged on the scan and the inflammatory markers together, and stopping early is how these recur",
  ],
  urgency: "emergency",
  referral: "Neurosurgery and infectious diseases together, with acute neurology",
};

// ENCEPHALITIS AND RHOMBENCEPHALITIS. Parenchymal inflammation rather than a collection. The governing
// rule is that TREATMENT PRECEDES CONFIRMATION — waiting for the PCR is the error these are known for.
const ENCEPHALITIS_SPINE = {
  confirmatory: [
    "LUMBAR PUNCTURE with a broad viral PCR panel and culture, once imaging permits — and START TREATMENT ON SUSPICION rather than waiting for the result, because the delay is what determines the outcome",
    "MRI with FLAIR and diffusion — {flavour}",
    "EEG where conscious level is disturbed: it detects non-convulsive status, which is common, treatable, and invisible without it",
    "Send the autoimmune and paraneoplastic antibody panels in PARALLEL with the infective screen — the two are clinically indistinguishable early, and both are treatable",
  ],
  monitoring: [
    "SAFETY NET: BRAINSTEM involvement threatens the airway and swallow before conscious level falls — a patient who is talking can still be aspirating, so the swallow assessment is not optional",
    "Track {level} and conscious level frequently; deterioration means reimaging for oedema, haemorrhagic transformation or hydrocephalus",
    "Cover LISTERIA empirically where the picture is a rhombencephalitis, in the elderly, the pregnant and the immunosuppressed — it needs a different antibiotic from the standard meningitis regimen and is missed by it",
    "Long-term cognitive and epilepsy follow-up: survivors are frequently left with memory impairment and seizures, and neither is addressed if the discharge is treated as a cure",
  ],
  urgency: "emergency",
  referral: "Acute neurology with infectious diseases; critical care if conscious level or swallow is failing",
};

// SKULL-BASE AND ENT INFECTION. The infection is in bone, sinus or ear, and the neurology is a
// COMPLICATION of it — so the ear, the sinuses and the teeth are part of the neurological examination.
const ENT_INFECTION_SPINE = {
  confirmatory: [
    "EXAMINE THE EAR, THE NOSE AND THE TEETH — this is where the disease actually is, and a cranial neuropathy from skull-base infection is repeatedly worked up intracranially while the source sits in the external auditory canal",
    "CT for BONE (erosion, opacification, the state of the mastoid air cells) and MRI for the soft tissue and intracranial extent — different questions, not alternatives: {flavour}",
    "Culture and BIOPSY the source: granulation tissue in the canal, sinus contents, or a neck collection — and biopsy also excludes the malignancy that mimics this",
    "Blood cultures and inflammatory markers, plus glucose and HbA1c — DIABETES and immunosuppression underlie most of the aggressive forms and change the prognosis",
  ],
  monitoring: [
    "SAFETY NET: the danger is INTRACRANIAL SPREAD — meningitis, an extradural or brain abscess, and venous sinus thrombosis. New headache, fever, seizure or a falling conscious level in a discharging ear or sinus is an emergency, not an antibiotic failure",
    "Track {level} by name — a progressive cranial neuropathy means the infection is uncontrolled, and the sequence of nerves maps its spread along the skull base",
    "Treatment is measured in MONTHS for skull-base osteomyelitis, and relapse after stopping is well recognised — a returning headache or new palsy after apparent recovery is reassessment, not reassurance",
    "Optimise glycaemic control alongside the antimicrobial course: it materially affects the outcome and is often left to the team that is not leading",
  ],
  urgency: "urgent",
  referral: "ENT and infectious diseases jointly, with neurology for the cranial neuropathies and neurosurgery if there is intracranial extension",
};

// DEEP SOFT-TISSUE COLLECTIONS compressing nerve or plexus. Same shape as the neoplastic deep-cavity
// family — the answer is in a body cavity — but here the collection is DRAINABLE, which changes the urgency.
const SOFT_TISSUE_SPINE = {
  confirmatory: [
    "IMAGE THE CAVITY, NOT THE LIMB — CT or MRI of the abdomen, pelvis or chest as the anatomy dictates. A plexus deficit with fever and raised inflammatory markers is a collection until imaged",
    "BLOOD CULTURES BEFORE ANTIBIOTICS, with inflammatory markers — and remember that the same compartment holds a HAEMATOMA in the anticoagulated patient, which looks identical on the nerve examination: {flavour}",
    "DRAINAGE is both diagnostic and therapeutic here, and is usually the step that resolves the deficit — antimicrobials alone frequently fail while a collection remains",
    "Examine {level}, and look for the source — spine, hip, bowel, urinary tract, or an injecting site",
  ],
  monitoring: [
    "SAFETY NET: sepsis outranks the nerve. Observations, lactate and source control come before any neurological investigation, and a deteriorating patient needs the collection drained rather than the plexus imaged again",
    "Track {level} — the deficit follows the collection, so a worsening nerve is a sign the source is not controlled",
    "Look for the associated problems the same source causes: discitis, epidural extension, septic arthritis of the hip, and endocarditis",
    "Recovery of the nerve usually follows drainage and lags behind it by weeks — set that expectation rather than pursuing the neuropathy separately",
  ],
  urgency: "emergency",
  referral: "Acute medicine or surgery for source control with infectious diseases; neurology for the nerve injury once the sepsis is treated",
};

export default {
  // ---- SINGLETONS: each has its own answer and no family to belong to ----

  // The commonest treatable cause of neuropathy worldwide, and the one a Western-trained reader will not
  // think of. Notifiable, curable, and disabling if the diagnosis is late.
  "Leprosy": dz("Leprosy", {
    confirmatory: [
      "PALPATE THE NERVES — leprosy is one of the very few causes of a THICKENED, palpable peripheral nerve, and the ulnar at the elbow, the common peroneal at the fibular head and the greater auricular are where to feel",
      "EXAMINE THE SKIN in good light for hypopigmented or erythematous patches, and test SENSATION WITHIN each patch: anaesthesia in the lesion itself is close to diagnostic and takes seconds",
      "Slit-skin smears and skin biopsy for acid-fast bacilli, with PCR where available — and take a residence and travel history covering years rather than months",
      "Examine {level}, and map the deficit: it follows the COOLER parts of the body — ears, nose, the dorsum of the hands and feet — because the organism prefers them, which is why the distribution looks nothing like a length-dependent neuropathy",
    ],
    monitoring: [
      "SAFETY NET: warn about PAINLESS INJURY. Burns, ulcers and unnoticed trauma to insensate hands and feet cause most of the disability, and none of it is caused by the infection directly",
      "Watch for LEPRA REACTIONS — an acute immune flare during or after treatment, with worsening nerve pain and function. It is treated with immunosuppression, and mistaking it for treatment failure costs the nerve",
      "Track {level} at intervals: nerve function loss is the disabling outcome, and it is largely preventable if the reaction is recognised early",
      "This is a NOTIFIABLE disease in most jurisdictions, and household contacts need screening — the public health step is part of the treatment",
    ],
    urgency: "urgent",
    referral: "Infectious diseases with dermatology and neurology; a specialist leprosy service where one exists",
    // NOTE (2026-08-18): the COMMON PERONEAL at the fibular head is a classic leprosy nerve and is NOT
    // listed as a cause there in causes.js. A bySite entry for it was written and then removed, because
    // the reachability invariant correctly refused an entry the UI could never reach. Raised with the
    // owner as a coverage gap rather than added silently.
    bySite: {
      nerve_ulnar_elbow: {
        level: "the intrinsic hand muscles, and PALPATE the ulnar nerve in its groove",
        flavour: "the ulnar at the elbow is the classic site — a thickened, tender nerve with a claw hand and anaesthesia over the ulnar territory, and the thickening is felt before it is imaged",
      },
      nerve_median_carpal_tunnel: {
        level: "thumb abduction and the median sensory territory",
        flavour: "a median neuropathy WITHOUT the nocturnal pattern of carpal tunnel, and with sensory loss extending beyond the median territory, should raise it",
      },
      nerve_sural: {
        level: "sensation over the lateral foot",
        flavour: "the sural is both commonly affected and the usual biopsy target, so document its function before biopsy is discussed",
      },
      nerve_tibial: {
        level: "toe flexion, and sensation on the SOLE",
        flavour: "plantar anaesthesia is what produces the neuropathic ulceration that causes most of the long-term disability — check the soles at every review",
      },
    },
  }),

  // A polyradiculitis, not a myelopathy — and it is treatable.
  "Elsberg syndrome (CMV or HSV-2 polyradiculitis)": dz("Elsberg syndrome (CMV or HSV-2 polyradiculitis)", {
    confirmatory: [
      "CSF for HSV-2 and CMV PCR with cell count and protein — a lymphocytic pleocytosis with acute urinary retention and sacral sensory loss is the picture",
      "MRI lumbosacral spine WITH contrast: enhancement of the cauda equina roots and sometimes the conus, which is what distinguishes this from a compressive cause",
      "Ask about GENITAL HERPES and recent sexual history — this is frequently a primary or reactivated HSV-2 infection, and the connection is not volunteered unless asked",
      "Examine {level}, and test SACRAL sensation and the anal reflex specifically, since the deficit is often confined there",
    ],
    monitoring: [
      "SAFETY NET: URINARY RETENTION is usually the presenting problem and needs catheterisation — the neurology is treatable but the bladder is the immediate issue and is easily left too long",
      "Track {level}; recovery is usual over weeks to months with antiviral treatment, but it is slow enough that patients need that expectation set",
      "The main differential is cauda equina compression, and it is excluded by the MRI — a normal scan in a patient with retention should redirect you to the CSF rather than end the work-up",
    ],
    urgency: "urgent",
    referral: "Neurology with infectious diseases; urology for bladder management",
  }),

  // A myelopathy of HIV itself, and a diagnosis of exclusion in a population with many other causes.
  "HIV vacuolar myelopathy": dz("HIV vacuolar myelopathy", {
    confirmatory: [
      "EXCLUDE THE TREATABLE MIMICS FIRST — B12 and copper (which produce an identical dorsal-column-and-pyramidal picture), syphilis serology, HTLV-1, and MRI to rule out compression",
      "HIV viral load and CD4 count, INCLUDING the CSF viral load where there is discordance — CNS escape, where the virus replicates in CSF despite plasma suppression, is a distinct and treatable situation",
      "MRI of the whole cord: it is often NORMAL or shows only non-specific dorsal-column signal, so a normal scan supports rather than refutes the diagnosis once compression is excluded",
      "Examine {level} — the pattern is a spastic paraparesis with dorsal-column loss and preserved pinprick, which is the same picture as subacute combined degeneration",
    ],
    monitoring: [
      "SAFETY NET: this is a DIAGNOSIS OF EXCLUSION. B12 deficiency and copper deficiency are common in this population, produce the identical syndrome, and are reversible — missing them is the costly error",
      "Track {level} and gait; antiretroviral optimisation may stabilise but rarely reverses established damage, so the realistic goal is arrest rather than recovery",
      "Bladder function and spasticity management do more for daily life here than further investigation, and both need active review",
    ],
    urgency: "urgent",
    referral: "HIV medicine with neurology",
  }),

  // Not a lesion at all: the brain failing because the body is septic.
  "Sepsis or systemic infection": dz("Sepsis or systemic infection", {
    confirmatory: [
      "THE WORK-UP IS THE SEPSIS WORK-UP, NOT A NEUROLOGICAL ONE — cultures, lactate, source identification and control. Septic encephalopathy is a diagnosis of EXCLUSION and the exclusions are mostly systemic",
      "Screen the metabolic causes that present identically and are reversible: glucose, sodium, calcium, renal and liver function, ammonia, and the drug chart",
      "Imaging and lumbar puncture are for when there are FOCAL SIGNS, meningism, or the encephalopathy does not track the systemic illness — a diffuse encephalopathy with a clear source needs neither",
      "EEG where the conscious level is disproportionate or fluctuating: non-convulsive status is common in this population, entirely treatable, and invisible without it",
    ],
    monitoring: [
      "SAFETY NET: NEW FOCAL SIGNS mean this is not septic encephalopathy — image, and reconsider abscess, empyema, endocarditis with emboli, and venous thrombosis",
      "Track {level} against the systemic picture: the encephalopathy should improve as the sepsis is controlled, and one that does not is a different diagnosis",
      "Review the drug chart daily — sedatives, opioids and anticholinergics accumulate in organ failure and are a large part of what is being called encephalopathy",
      "Delirium here is associated with worse long-term cognitive outcome, so it is worth preventing rather than merely observing: orientation, sleep, mobility and sensory aids all count as treatment",
    ],
    urgency: "emergency",
    referral: "Acute medicine or critical care for the sepsis; neurology only if focal signs or the course diverge",
  }),

  // A toxin at the presynaptic terminal. The neurology is the presentation of a public health event.
  "Botulism": dz("Botulism", {
    confirmatory: [
      "THE DIAGNOSIS IS CLINICAL AND TREATMENT IS TIME-CRITICAL: a DESCENDING, symmetric, flaccid paralysis with prominent BULBAR and PUPILLARY involvement, and a patient who is afebrile and fully alert throughout",
      "Send serum, stool and any suspect food or wound sample for toxin and organism — but do NOT wait for the result to give antitoxin, which only prevents further binding and cannot reverse what has bound",
      "Neurophysiology supports it where the diagnosis is uncertain: an incremental response to HIGH-FREQUENCY repetitive stimulation, as in LEMS, which is the presynaptic signature",
      "Establish the ROUTE — food, a wound (particularly in injecting drug users), or infant botulism from an intestinal source — because it changes the public health response and the wound needs debriding",
    ],
    monitoring: [
      "SAFETY NET: MEASURE FORCED VITAL CAPACITY, not oxygen saturation, which falls late. Respiratory failure is what kills, and it can arrive quickly in a patient who still looks well",
      "Track {level} and the bulbar functions, and watch the PUPILS — fixed dilated pupils with a normal conscious level is a combination almost unique to botulism and worth recognising",
      "NOTIFY PUBLIC HEALTH IMMEDIATELY. A single case can signal a contaminated food source and further cases, and antitoxin is usually held by the public health service rather than the hospital",
      "Recovery takes weeks to months as terminals regenerate, so prolonged ventilatory support may be needed in a patient whose prognosis is nonetheless good",
    ],
    urgency: "emergency",
    referral: "Critical care with infectious diseases and public health — antitoxin is obtained through public health",
  }),

  // The one paralysis cured by examination.
  "Tick paralysis": dz("Tick paralysis", {
    confirmatory: [
      "SEARCH FOR THE TICK — the scalp and hairline, behind the ears, the axillae and the groin. This is the one ascending paralysis CURED BY EXAMINATION, and the tick is small and easily hidden in hair",
      "The picture is an ASCENDING flaccid paralysis with areflexia in a child or a returning traveller — it imitates Guillain-Barré closely, and the discriminator is a NORMAL CSF PROTEIN plus a rapid course",
      "Remove the tick completely, taking care not to leave mouthparts, and note that improvement begins within HOURS to a day — that response is itself confirmatory",
      "Examine {level}, and take an exposure history: bushwalking, camping, endemic area, and a pet that may have carried it indoors",
    ],
    monitoring: [
      "SAFETY NET: monitor VITAL CAPACITY and bulbar function while the paralysis is still ascending — respiratory failure can occur, and with the Australian species deterioration may CONTINUE for a day or more after removal",
      "Track {level} hourly early on: rapid improvement confirms the diagnosis, and failure to improve means reconsidering Guillain-Barré, botulism and myasthenia",
      "Search again for a SECOND tick if there is no improvement — more than one is common and one may have been missed on the first pass",
    ],
    urgency: "emergency",
    referral: "Acute paediatrics or acute medicine with critical care standby; the treatment is removal",
  }),

  // Cranial zoster: two named syndromes, each threatening a different organ.
  "Herpes zoster ophthalmicus": dz("Herpes zoster ophthalmicus", {
    confirmatory: [
      "SAME-DAY OPHTHALMOLOGY — the eye is what is at stake, and it is threatened by keratitis, uveitis and acute retinal necrosis, none of which the neurological examination detects",
      "Look for HUTCHINSON'S SIGN: vesicles on the tip or side of the NOSE, marking involvement of the nasociliary branch — it substantially raises the likelihood of ocular involvement",
      "Examine {level} — corneal sensation, acuity, the pupil and the eye movements, since zoster here can also produce an ophthalmoplegia",
      "Consider immunosuppression and test for HIV in a younger patient, and check for the dissemination that indicates it",
    ],
    monitoring: [
      "SAFETY NET: a NUMB CORNEA loses its blink reflex and ulcerates silently — the patient cannot feel the warning, so lubrication and ophthalmology follow-up are not optional",
      "Track {level} and the eye, and be alert to acute retinal necrosis, which presents late and blinds",
      "Post-herpetic neuralgia is the common legacy and is worst in this distribution — flag it early rather than at the fourth visit",
    ],
    urgency: "emergency",
    referral: "Same-day ophthalmology, with neurology if there is an ophthalmoplegia or encephalitic feature",
  }),

  "Herpes zoster oticus (Ramsay Hunt)": dz("Herpes zoster oticus (Ramsay Hunt)", {
    confirmatory: [
      "LOOK IN THE EAR AND AT THE PALATE for vesicles — in the external canal, on the pinna, and on the anterior tongue or soft palate. This is what distinguishes it from Bell's palsy, and it is missed when the drum is not examined",
      "AUDIOMETRY and vestibular assessment: the eighth nerve is involved alongside the seventh, which is what makes this different from an isolated facial palsy and worse in outcome",
      "Examine {level} — every facial branch, plus taste, hearing and balance",
      "PCR of a vesicle swab where the rash is equivocal; and consider zoster sine herpete where there is a facial palsy with ear pain and NO rash at all",
    ],
    monitoring: [
      "SAFETY NET: EYE PROTECTION where the eye does not close — lubrication, taping at night and ophthalmology review. Exposure keratopathy is the preventable harm here and it happens quietly",
      "Recovery is materially WORSE than for Bell's palsy, and treatment started early matters more — set that expectation honestly rather than reassuring by analogy",
      "Track {level}, and follow hearing and balance separately: they recover on their own timetable and are often forgotten once the face improves",
    ],
    urgency: "urgent",
    referral: "ENT and neurology; ophthalmology for corneal protection",
  }),

  // ---- CNS ABSCESS ----
  ...family("cns-abscess", ABSCESS_SPINE, {
    "Brainstem abscess": {
      slots: { level: "eye movements, facial power, swallow and conscious level",
               flavour: "in the brainstem, biopsy carries real risk — so treatment is frequently empirical and guided by SERIAL IMAGING rather than by tissue" },
      monitoringExtra: ["Airway and swallow are the functions at risk, and both can fail before conscious level changes — involve critical care early rather than at deterioration"],
    },
    "Cerebellar abscess": {
      slots: { level: "limb coordination, gait and conscious level",
               flavour: "look at the MASTOID on the same scan — a cerebellar abscess is classically otogenic, and the ear is both the source and a separate surgical problem" },
      monitoringExtra: ["POSTERIOR-FOSSA MASS EFFECT obstructs the fourth ventricle: conscious level is the observation that matters, and deterioration is a neurosurgical emergency"],
    },
    "Cerebellar abscess or tuberculoma": {
      slots: { level: "limb coordination and any tremor, with conscious level",
               flavour: "a tuberculoma more often shows central T2 HYPOintensity with rim enhancement, where a pyogenic abscess restricts on diffusion — and the TB work-up is different in every respect" },
      confirmatoryExtra: ["Interferon-gamma release assay, chest imaging and CSF mycobacterial PCR where tuberculoma is possible — and be aware that a tuberculoma can ENLARGE early in treatment without that being failure"],
    },
    "Thalamic abscess or cerebral toxoplasmosis": {
      slots: { level: "sensation, conscious level and any movement disorder",
               flavour: "in an immunosuppressed patient, MULTIPLE ring-enhancing lesions in the deep grey are toxoplasmosis until proven otherwise — and a therapeutic trial with repeat imaging is a legitimate diagnostic step" },
      confirmatoryExtra: ["Toxoplasma serology and CD4 count; and where lesions fail to respond to empirical treatment, CNS lymphoma is the alternative that needs tissue"],
    },
    "Toxoplasmosis or HIV-related lesion": {
      slots: { level: "the movement disorder and the focal deficit",
               flavour: "the deep grey nuclei are the favoured site — and in HIV the differential runs toxoplasmosis, lymphoma, tuberculoma and PML, each with a different answer" },
      confirmatoryExtra: ["CD4 count, toxoplasma serology, CSF EBV PCR (for lymphoma) and JC virus PCR (for PML) — a single lumbar puncture can distinguish most of this differential"],
    },
    "Cerebral abscess or empyema": {
      slots: { level: "language and conscious level",
               flavour: "an EMPYEMA is a surgical emergency in a way a parenchymal abscess is not — subdural pus spreads fast over the convexity, and the thin collection is easy to overlook on CT" },
      confirmatoryExtra: ["If CT is equivocal and the patient is toxic, get the MRI: a subdural empyema can be nearly invisible on CT and is the diagnosis that most needs speed"],
    },
    "Epidural abscess": {
      slots: { level: "power, the sensory level and sphincter function",
               flavour: "in the spinal canal the collection compresses rather than infiltrates — so this is a decompression question with a clock, and the MRI must cover the WHOLE spine because skip lesions are common" },
      referral: "Emergency neurosurgery or spinal surgery with infectious diseases — decompression is time-critical",
    },
  }),

  // ---- ENCEPHALITIS AND RHOMBENCEPHALITIS ----
  ...family("encephalitis", ENCEPHALITIS_SPINE, {
    "Brainstem encephalitis (Listeria, enterovirus)": {
      slots: { level: "eye movements, facial power, swallow and conscious level",
               flavour: "brainstem FLAIR change with little else — and LISTERIA is the one to cover empirically, because it needs a different antibiotic from the standard meningitis regimen" },
    },
    "Listeria rhombencephalitis": {
      slots: { level: "cranial nerves in sequence, swallow, and conscious level",
               flavour: "the classic biphasic story: a prodrome of fever and headache, then cranial nerve palsies and ataxia days later — and a CSF that can look unimpressive while the patient is very unwell" },
      confirmatoryExtra: ["BLOOD CULTURES matter as much as the CSF here: listeria is often grown from blood when the CSF is negative, and food history (soft cheese, unpasteurised dairy, deli meats) supports it"],
    },
    "Brainstem encephalitis or tuberculoma": {
      slots: { level: "facial sensation, eye movements and swallow",
               flavour: "inflammation and a granuloma look alike early — the discriminating tests are the TB work-up rather than anything on the MRI" },
    },
    "Brainstem encephalitis / meningoencephalitis": {
      slots: { level: "conscious level, pupils and respiratory pattern",
               flavour: "involvement of the reticular formation means AROUSAL is the deficit — and a drowsy patient with a fever is treated for both meningitis and encephalitis until the CSF returns" },
    },
    "Japanese encephalitis / flavivirus encephalitis": {
      slots: { level: "conscious level, and any parkinsonism or dystonia",
               flavour: "BILATERAL THALAMIC change is the imaging signature, and it narrows the field sharply — take a TRAVEL history, because the diagnosis is geographical before it is serological" },
      confirmatoryExtra: ["Flavivirus serology on serum AND CSF, guided by the travel history — and notify public health, since these are notifiable and vaccine-preventable"],
    },
    "Herpes simplex or limbic encephalitis": {
      slots: { level: "memory, behaviour and seizure activity",
               flavour: "medial temporal change on both sides — HSV is usually ASYMMETRIC and often haemorrhagic, autoimmune limbic encephalitis more symmetric, but treat for HSV first because the cost of delay is higher" },
      confirmatoryExtra: ["Send CSF HSV PCR and the autoimmune panel together — and remember HSV PCR can be NEGATIVE in the first 48 hours, so an early negative neither excludes it nor stops treatment"],
    },
    "Whipple's disease": {
      slots: { level: "eye movements, cognition, and any rhythmic movement of the jaw",
               flavour: "OCULOMASTICATORY MYORHYTHMIA — pendular convergence nystagmus synchronous with jaw contraction — is pathognomonic, and it is the rarest sign in this whole layer worth actively looking for, because the disease is fatal untreated and curable treated" },
      confirmatoryExtra: [
        "CSF and small-bowel biopsy PCR for Tropheryma whipplei; ask about the years of diarrhoea, weight loss and arthralgia that usually precede the neurology",
        "CNS Whipple's requires prolonged treatment with an agent that crosses into the CSF — a regimen adequate for the gut is not adequate for the brain",
      ],
      urgency: "urgent",
    },
  }),

  // ---- SKULL-BASE AND ENT INFECTION ----
  ...family("skull-base-ent-infection", ENT_INFECTION_SPINE, {
    "Skull base infection / osteomyelitis": {
      slots: { level: "the lower cranial nerves by name",
               flavour: "usually PSEUDOMONAS from a malignant otitis externa in a diabetic — look in the ear canal for granulation tissue at the bony-cartilaginous junction" },
      bySite: {
        skull_base_ix_jugular: { level: "gag, palate and swallow" },
        skull_base_xi_jugular: { level: "shoulder shrug and sternocleidomastoid" },
      },
    },
    "Skull base osteomyelitis": {
      slots: { level: "IX, X, XI and XII together",
               flavour: "four nerves failing at the jugular foramen and hypoglossal canal means the infection has crossed the skull base, which carries a materially worse prognosis" },
      confirmatoryExtra: ["Nuclear imaging tracks disease ACTIVITY and response, which anatomical imaging cannot — bone changes persist long after the infection is controlled"],
    },
    "Petrous apicitis (Gradenigo's syndrome)": {
      slots: { level: "eye abduction, facial sensation, and the EAR",
               flavour: "the triad — otorrhoea, deep retro-orbital pain and a sixth-nerve palsy — from infection reaching Dorello's canal. Rare since antibiotics, which is exactly why it is not recognised when it appears" },
    },
    "Petrous apicitis (complicated otitis media)": {
      slots: { level: "abduction and facial sensation, with otoscopy",
               flavour: "a complication of middle-ear disease rather than a primary process — so the ear is the thing to examine and to treat, and imaging follows the ear" },
    },
    "Acute or chronic otitis media": {
      slots: { level: "facial movement, and hearing",
               flavour: "a facial palsy complicating otitis media means the nerve is exposed in a dehiscent canal — in ACUTE disease it usually recovers with treatment of the ear, in CHRONIC disease it suggests cholesteatoma and needs surgery" },
      urgency: "urgent",
    },
    "Mastoiditis": {
      slots: { level: "facial movement, with the post-auricular area for swelling and tenderness",
               flavour: "a protruding ear with post-auricular swelling and tenderness is coalescent mastoiditis — and the same infection reaches the sigmoid sinus, so a venogram belongs in the same study" },
      confirmatoryExtra: ["Image the VENOUS sinuses at the same time: sigmoid and transverse sinus thrombosis is a recognised complication and changes the treatment completely"],
    },
    "Retropharyngeal abscess or deep neck infection": {
      slots: { level: "the lower cranial nerves and the sympathetic chain",
               flavour: "a deep neck collection reaches the carotid space — so look for a Horner's syndrome alongside the palsies, and be alert to airway compromise before neurology" },
      confirmatoryExtra: ["Assess the AIRWAY first and involve ENT and anaesthetics before any procedure — and image for the carotid and jugular complications, including Lemierre's syndrome"],
    },
    "Meningitis or meningeal disease": {
      slots: { level: "all the cranial nerves in sequence, plus neck stiffness and conscious level",
               flavour: "a sixth-nerve palsy in meningitis is a FALSE LOCALISING SIGN from raised pressure rather than a lesion at the point of failure" },
      confirmatoryExtra: ["Lumbar puncture once imaging permits, and do not delay antibiotics for it — treatment first, sample second, is the correct order when there is any wait"],
      urgency: "emergency",
    },
    "Infection (fungal, mucormycosis)": {
      slots: { level: "every eye movement, V1 sensation, acuity and the pupil",
               flavour: "look in the NOSE for a black eschar or an insensate turbinate — mucormycosis is angio-invasive, advances in hours, and the diagnosis is made by looking rather than by waiting for a culture" },
      confirmatoryExtra: [
        "URGENT ENT nasal endoscopy with biopsy for histology and fungal culture — tissue rather than swab, because the organism is inside the vessels",
        "Check glucose, ketones and the immunosuppressive history: diabetic ketoacidosis and haematological malignancy are the settings, and correcting the ketoacidosis is part of the treatment",
      ],
      urgency: "emergency",
      referral: "EMERGENCY ENT with infectious diseases — surgical debridement is the treatment and delay is measured in hours",
    },
    "Invasive fungal sinusitis (mucormycosis)": {
      slots: { level: "acuity and colour vision FIRST, then eye movements",
               flavour: "at the orbital apex vision is what is lost, and it is lost irreversibly — proptosis with ophthalmoplegia and a numb cheek in a diabetic or neutropenic patient is this until biopsy says otherwise" },
      confirmatoryExtra: ["Do NOT wait for imaging to escalate: MRI can lag behind the clinical picture, and the decision to debride is made on examination and endoscopy"],
      urgency: "emergency",
      referral: "EMERGENCY ENT and ophthalmology with infectious diseases and haematology",
    },
  }),

  // ---- DEEP SOFT-TISSUE COLLECTIONS ----
  ...family("deep-soft-tissue-infection", SOFT_TISSUE_SPINE, {
    "Psoas abscess": {
      slots: { level: "hip flexion, knee extension and the knee jerk",
               flavour: "the hip held FLEXED and externally rotated, painful to extend, is the psoas sign — and the femoral nerve is compressed inside a compartment that cannot expand" },
    },
    "Psoas abscess or retroperitoneal mass": {
      slots: { level: "hip flexion and the L2 sensory territory",
               flavour: "abscess and tumour occupy one compartment with opposite treatments — FEVER and inflammatory markers separate them, so send both before deciding" },
    },
    "Pelvic abscess or infection": {
      slots: { level: "ankle movement, hip extension and sphincter function",
               flavour: "a pelvic collection reaches the sacral plexus — ask directly about bladder, bowel and sexual function, and look for the gynaecological, colorectal or urological source" },
    },
    "Apical infection (tuberculosis, fungal)": {
      slots: { level: "the pupil and lid, with the lower plexus",
               flavour: "an apical lesion producing a Horner's is usually a Pancoast tumour — but TUBERCULOSIS does the same thing, and is the diagnosis that is treatable and repeatedly assumed to be cancer" },
      confirmatoryExtra: ["Sputum and tissue for mycobacteria with an interferon-gamma release assay before accepting a malignant diagnosis on imaging alone — the apex is where TB lives"],
      urgency: "urgent",
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
