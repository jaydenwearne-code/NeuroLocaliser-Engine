// inflammatory.js — pathology workups for the INFLAMMATORY / DEMYELINATING / AUTOIMMUNE category.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS:
//   ✅ the 3 tranche-1 plans — SIGNED OFF 2026-08-18.
//   ⚠  AUTOIMMUNE ENCEPHALITIS (6), NMOSD/MOG (3), VASCULITIS (5), GRANULOMATOUS (5),
//      INFLAMMATORY NEUROPATHY & NMJ (5) — tranche 2 round 7, AWAITING REVIEW.
import { dz, family } from "./builders.js";

// ---- ROUND 7 (tranche 2): the inflammatory red set ----
// The thread through all five families: these are the TREATABLE ones, immunotherapy is time-critical, and
// a negative antibody or biopsy never excludes the syndrome. Treating on the clinical picture while tests
// are awaited is the norm here rather than the exception.

// AUTOIMMUNE ENCEPHALITIS. The presentation is frequently PSYCHIATRIC, which is why the diagnosis is made
// on a ward the neurologist has not been called to.
const AUTOIMMUNE_ENCEPH_SPINE = {
  confirmatory: [
    "PAIRED SERUM AND CSF for the cell-surface and onconeural antibody panels — send both, because some antibodies appear only in CSF and serum alone misses cases",
    "MRI with FLAIR, and EEG — {flavour}. EEG also detects the non-convulsive status that is common here and invisible clinically",
    "A NEGATIVE ANTIBODY PANEL DOES NOT EXCLUDE THIS. Seronegative autoimmune encephalitis is well recognised, and treatment is started on the clinical picture and the CSF while results are awaited",
    "TUMOUR SEARCH in parallel, directed by the antibody — the ovaries in a young woman with NMDA receptor antibodies, the chest for small cell lung cancer, the testes for anti-Ma2",
  ],
  monitoring: [
    "SAFETY NET: THE PRESENTATION IS OFTEN PSYCHIATRIC — a subacute change in personality, psychosis or catatonia in a previously well young person, with seizures, movement disorder or autonomic instability, is this until excluded. Patients are admitted to psychiatric units and deteriorate there",
    "Track {level} plus behaviour and seizure frequency; deterioration despite treatment means escalating immunotherapy rather than waiting",
    "Autonomic instability and central hypoventilation can be life-threatening in NMDA receptor encephalitis — critical care involvement is about the autonomics, not the conscious level",
    "Recovery is SLOW, often over months, and relapse occurs — so long follow-up and a clear relapse plan matter as much as the acute treatment",
  ],
  urgency: "emergency",
  referral: "Acute neurology with immunology; oncology once a tumour is identified; critical care for autonomic instability",
};

// NMOSD AND MOG-ASSOCIATED DISEASE. The point of separating these from multiple sclerosis is that some MS
// treatments make NMOSD WORSE — so the antibody is not academic, it changes what is safe to give.
const NMOSD_SPINE = {
  confirmatory: [
    "SERUM AQUAPORIN-4 AND MOG ANTIBODIES by cell-based assay — the assay matters, and this must be sent BEFORE committing to a diagnosis of multiple sclerosis, because some MS disease-modifying therapies worsen NMOSD",
    "MRI brain AND WHOLE CORD: {flavour}",
    "CSF — and note that oligoclonal bands are usually ABSENT in NMOSD, which is the opposite of MS and is a useful discriminator when the antibodies are pending",
    "Examine {level}, with formal visual acuity, colour vision and fields, since the optic nerve is involved in most and the loss is more severe than in MS optic neuritis",
  ],
  monitoring: [
    "SAFETY NET: attacks cause SEVERE and often permanent deficit, so acute treatment is escalated fast — high-dose steroids, and PLASMA EXCHANGE early rather than as a last resort if there is no rapid response",
    "Track {level}; and remember that a longitudinally extensive cord lesion is a red flag against MS and toward this group",
    "Long-term immunosuppression is required to prevent relapse — unlike a single demyelinating event, watchful waiting is not an option here",
    "Ask about the area postrema syndrome — intractable hiccup, nausea and vomiting — which precedes other features and is repeatedly worked up gastroenterologically for weeks",
  ],
  urgency: "emergency",
  referral: "Neurology / neuroimmunology urgently — the antibody result changes the treatment, so specialist involvement should not wait for it",
};

// VASCULITIS AFFECTING THE NERVOUS SYSTEM. Tissue where possible, treat where not, and the systemic
// screen is what distinguishes primary from secondary — which changes the treatment.
const VASCULITIS_SPINE = {
  confirmatory: [
    "INFLAMMATORY MARKERS AND THE FULL VASCULITIC SCREEN — ESR and CRP, ANCA, ANA and ENA, complement, cryoglobulins, rheumatoid factor, plus hepatitis B and C and HIV serology, which identify the secondary causes with different treatments",
    "TISSUE where it can be obtained safely: temporal artery, nerve and muscle, or brain and meninges for primary CNS angiitis — {flavour}",
    "Vessel imaging has limits worth knowing: angiography can be normal in small-vessel disease, and beading is neither sensitive nor specific, so a normal angiogram does not exclude vasculitis",
    "Examine {level}, and look for the ORGAN involvement that outranks the neurology — urinalysis and renal function for glomerulonephritis, chest imaging for pulmonary haemorrhage",
  ],
  monitoring: [
    "SAFETY NET: this is usually a SYSTEMIC disease presenting through the nervous system, and renal or pulmonary involvement is what threatens life while attention is on the limb or the brain — check urinalysis at EVERY review, not just at diagnosis",
    "Track {level}; a stepwise accumulation of deficits over days to weeks is the characteristic course and is itself diagnostic information",
    "Immunosuppression is prolonged: bone protection, infection prophylaxis and glucose monitoring belong in the plan from the start rather than being added later",
    "Relapse is common and is often heralded by rising inflammatory markers before symptoms — which is why the monitoring bloods are not a formality",
  ],
  urgency: "emergency",
  referral: "Neurology with rheumatology; nephrology urgently for any renal involvement",
};

// GRANULOMATOUS AND INFILTRATIVE DISEASE. Sarcoid is the great mimic, and the diagnosis is almost always
// made from a more accessible organ than the one that brought the patient in.
const GRANULOMATOUS_SPINE = {
  confirmatory: [
    "BIOPSY SOMETHING EASIER. Neurosarcoidosis is rarely diagnosed from the nervous system — look for mediastinal nodes, skin lesions, lacrimal or parotid involvement, and biopsy those instead: {flavour}",
    "CT CHEST or PET-CT for hilar and mediastinal lymphadenopathy, plus serum ACE and calcium — ACE is neither sensitive nor specific and a normal level excludes nothing, so it supports rather than decides",
    "MRI with contrast looking for LEPTOMENINGEAL enhancement, cranial nerve enhancement and a thickened infundibulum, plus CSF with a raised protein and lymphocytosis",
    "Examine {level}, and check the PITUITARY AXIS where the hypothalamus or stalk is involved — endocrine failure here is treatable and is missed while the granuloma is investigated",
  ],
  monitoring: [
    "SAFETY NET: the differential includes TUBERCULOSIS and LYMPHOMA, both of which are made worse by steroids given for a presumed sarcoid — so exclude them before committing, particularly where there is any epidemiological risk",
    "Track {level}; neurosarcoidosis relapses on steroid withdrawal in a large proportion, so a steroid-sparing agent is usually planned from the outset rather than after the second relapse",
    "Watch for the complications of the site rather than the disease — hydrocephalus from basal meningeal involvement, and visual loss from optic nerve or chiasmal disease",
    "Screen the other organs at diagnosis: cardiac sarcoid is life-threatening, frequently silent, and needs looking for explicitly",
  ],
  urgency: "urgent",
  referral: "Neurology with respiratory medicine and rheumatology; endocrinology where the axis is involved",
};

// INFLAMMATORY NEUROPATHY AND NEUROMUSCULAR JUNCTION FAILURE. One monitoring rule dominates and it is the
// same for all of them: measure the vital capacity, because saturation falls last.
const NEUROMUSCULAR_SPINE = {
  confirmatory: [
    "MEASURE FORCED VITAL CAPACITY AT THE BEDSIDE AND SERIALLY — oxygen saturation is a LATE and misleading sign in neuromuscular respiratory failure, and by the time it falls the patient is in trouble",
    "Nerve conduction studies and EMG to define the pattern — demyelinating with conduction block, axonal, or a neuromuscular junction defect — since the pattern determines the treatment: {flavour}",
    "CSF where a polyradiculopathy is suspected: albuminocytological dissociation supports it, but it may be NORMAL in the first week, so an early normal result does not exclude it",
    "Examine {level}, testing FATIGABILITY as well as absolute power, and assess swallow and cough strength rather than relying on the patient's account",
  ],
  monitoring: [
    "SAFETY NET: RESPIRATORY FAILURE IS THE THING THAT KILLS. Falling vital capacity, a weak cough, orthopnoea or paradoxical abdominal movement means critical care involvement BEFORE an emergency intubation, not during one",
    "Track {level} and bulbar function at defined intervals; deterioration in neuromuscular disease is often rapid once it begins",
    "Autonomic instability accompanies Guillain-Barré and can cause fatal arrhythmia — cardiac monitoring is part of the management, not an optional extra",
    "Watch for the treatable precipitant in a myasthenic deterioration: a new drug, infection, surgery or pregnancy — and review every drug started in the preceding weeks",
  ],
  urgency: "emergency",
  referral: "Neurology with critical care standby; immunology or the immunoglobulin service for treatment",
};

export default {
  // ---- AUTOIMMUNE ENCEPHALITIS ----
  ...family("autoimmune-encephalitis", AUTOIMMUNE_ENCEPH_SPINE, {
    "Limbic encephalitis": {
      slots: { level: "memory, behaviour and seizure activity",
               flavour: "medial temporal FLAIR change, often bilateral — and MRI can be normal early, so a normal scan in a convincing subacute amnestic syndrome does not exclude it" },
      bySite: {
        thalamus_limbic:         { level: "memory and behaviour, once arousal permits testing" },
        cortex_anterior_temporal:{ level: "memory, behaviour and any olfactory or gustatory auras" },
      },
    },
    "Anti-LGI1 encephalitis": {
      slots: { level: "memory, and FACIOBRACHIAL DYSTONIC SEIZURES specifically",
               flavour: "brief, frequent, unilateral face-and-arm jerks that PRECEDE the amnesia by weeks — recognising them and treating early prevents the amnesia, which is the whole reason to know this one" },
      confirmatoryExtra: [
        "Check SODIUM: hyponatraemia accompanies anti-LGI1 in a majority and is a useful supporting clue when the antibody is pending",
        "The seizures respond poorly to antiepileptics and well to IMMUNOTHERAPY — failure of antiepileptic treatment is itself diagnostic information, not a reason for a third agent",
      ],
    },
    "Autoimmune / limbic encephalitis": {
      slots: { level: "behaviour, autonomic stability and speech",
               flavour: "insular involvement adds autonomic instability to the behavioural picture, which is easy to attribute to agitation rather than to the disease" },
    },
    "Autoimmune or post-infectious encephalitis": {
      slots: { level: "attention, arousal and any visual disturbance",
               flavour: "pulvinar involvement is unusual and narrows the field — and a post-infectious mechanism means asking what illness preceded this by days to weeks" },
    },
    "Bickerstaff brainstem encephalitis": {
      slots: { level: "eye movements, ataxia, and CONSCIOUS LEVEL",
               flavour: "ophthalmoplegia and ataxia WITH drowsiness — it sits on a spectrum with Miller Fisher syndrome, and the altered consciousness is what distinguishes it" },
      confirmatoryExtra: ["Send ANTI-GQ1b antibodies, which are positive in most and tie the Bickerstaff, Miller Fisher and Guillain-Barré spectrum together"],
    },
    "Acute disseminated encephalomyelitis (ADEM)": {
      slots: { level: "conscious level, and the multifocal deficits together",
               flavour: "ENCEPHALOPATHY is required for the diagnosis and is what separates it from a first MS attack — large, poorly demarcated lesions all of the SAME AGE, since a lesion of different age argues for MS instead" },
      confirmatoryExtra: ["Send MOG antibodies: a substantial proportion of ADEM, particularly in children, is MOG-associated, and that changes the relapse risk and the follow-up entirely"],
    },
  }),

  // ---- NMOSD AND MOG-ASSOCIATED DISEASE ----
  ...family("nmosd-mog", NMOSD_SPINE, {
    "NMOSD — area postrema syndrome": {
      slots: { level: "swallow, and the pattern of vomiting",
               flavour: "INTRACTABLE HICCUP, NAUSEA AND VOMITING from a dorsal medullary lesion at the area postrema — a gastroenterological presentation of a neurological disease, and often the FIRST attack" },
      confirmatoryExtra: ["Unexplained intractable vomiting or hiccup lasting more than a couple of days deserves an MRI of the medulla and an aquaporin-4 antibody — this is the attack that is missed, and treating it prevents the next one"],
    },
    "Longitudinally extensive transverse myelitis (NMOSD / MOG)": {
      slots: { level: "power, sensory level and sphincter function",
               flavour: "a cord lesion spanning THREE OR MORE vertebral segments — that length is the finding, and it argues strongly against multiple sclerosis, which produces short segments" },
    },
    "NMO / MOG-associated": {
      slots: { level: "acuity, colour vision and the fields, with the disc",
               flavour: "optic neuritis that is BILATERAL, severe, involves a long segment or the chiasm, or recovers poorly is not typical MS — MOG in particular gives marked disc swelling with severe loss and often good recovery" },
    },
  }),

  // ---- VASCULITIS ----
  ...family("nervous-system-vasculitis", VASCULITIS_SPINE, {
    "CNS vasculitis (primary angiitis or secondary)": {
      slots: { level: "the focal deficits and cognition together",
               flavour: "infarcts in multiple territories of differing ages, with headache and cognitive change — and the key distinction is PRIMARY angiitis from a SECONDARY systemic vasculitis, since the systemic screen changes the treatment" },
      confirmatoryExtra: ["Consider REVERSIBLE CEREBRAL VASOCONSTRICTION SYNDROME, which mimics this closely with thunderclap headache and beading, is NOT treated with immunosuppression, and is made worse by it"],
    },
    "CNS vasculitis": {
      slots: { level: "the visual fields and higher visual processing",
               flavour: "border-zone infarction from vasculitis rather than hypoperfusion — the clue is infarcts that do not respect a single arterial territory in a patient with no cardiac or carotid source" },
    },
    "Vasculitic plexopathy": {
      slots: { level: "the muscles of that plexus element, and the other limbs",
               flavour: "a PAINFUL, stepwise, asymmetric plexus deficit — and the whole point is to examine the OTHER limbs, because multifocality is what makes it vasculitic" },
      bySite: {
        plexus_middle_trunk: { level: "elbow and wrist extension" },
        plexus_lateral_cord: { level: "elbow flexion and pronation, with lateral forearm sensation" },
      },
    },
    "Giant cell arteritis": {
      slots: { level: "acuity, colour vision, the pupil and the DISC",
               flavour: "the ONE cause of visual loss where treatment saves the other eye — start steroids on suspicion, and ask about JAW CLAUDICATION, which is the most specific symptom and is never volunteered" },
      confirmatoryExtra: ["ESR and CRP now, temporal artery biopsy within the following days, and do NOT wait for either before giving steroids — the fellow eye can be lost within days"],
      urgency: "emergency",
      referral: "Same-day ophthalmology and rheumatology — steroids before either",
      bySite: {
        visual_pathway_retina:  { level: "acuity and the fundus, for the pale swollen disc or a whitened retina" },
        pupil_cn3_ischaemic:    { level: "the third nerve and the pupil — and note GCA can cause an ocular motor palsy, so an elderly patient with diplopia and raised inflammatory markers needs it excluded" },
      },
    },
    "Retinal vasculitis or a hypercoagulable state": {
      slots: { level: "acuity and the fundus, looking at the vessels themselves",
               flavour: "sheathing of the retinal vessels on fundoscopy — and the differential splits between inflammation and thrombophilia, which are investigated and treated in opposite directions" },
      confirmatoryExtra: ["Thrombophilia and ANTIPHOSPHOLIPID screening alongside the vasculitic panel; and ask about recurrent miscarriage and venous thrombosis, which point to the second group"],
    },
  }),

  // ---- GRANULOMATOUS AND INFILTRATIVE ----
  ...family("granulomatous", GRANULOMATOUS_SPINE, {
    "Neurosarcoidosis": {
      slots: { level: "facial sensation and the corneal reflex, with the other cranial nerves",
               flavour: "a basal meningeal process picking off cranial nerves — the facial nerve is the commonest, and a BILATERAL facial palsy should always raise it" },
    },
    "Neurosarcoidosis or infiltrative disease": {
      slots: { level: "the full pituitary axis, plus thirst and urine output",
               flavour: "a thickened stalk with diabetes insipidus — the differential here is sarcoid, histiocytosis, hypophysitis and germinoma, and all four are diagnosed from somewhere other than the stalk" },
    },
    "Langerhans cell histiocytosis or neurosarcoidosis": {
      slots: { level: "thirst, urine output and sodium",
               flavour: "both infiltrate the stalk and both are biopsied elsewhere — a SKELETAL SURVEY and a skin examination find the histiocytosis, chest imaging finds the sarcoid" },
    },
    "Granulomatosis with polyangiitis / sarcoid": {
      slots: { level: "acuity, colour vision, proptosis and eye movements",
               flavour: "orbital apex inflammation — and ANCA plus a nasal examination separate granulomatosis with polyangiitis from sarcoid, which look identical in the orbit" },
      confirmatoryExtra: ["Examine the NOSE and sinuses: crusting, septal perforation or a saddle deformity points strongly to granulomatosis with polyangiitis and offers an accessible biopsy site"],
      urgency: "emergency",
    },
    "Orbital inflammatory disease / cellulitis": {
      slots: { level: "acuity, colour vision, the pupil, proptosis and eye movements",
               flavour: "the first question is INFECTIVE OR INFLAMMATORY, because the treatments are opposite — fever, sinus disease and a rapid course favour cellulitis, which must not be given steroids alone" },
      confirmatoryExtra: [
        "URGENT contrast imaging of the orbits and sinuses to look for an abscess and to define posterior extension — and blood cultures before antibiotics where infection is possible",
        "Where it is inflammatory rather than infective, consider the mimics of idiopathic orbital inflammation: IgG4-related disease, granulomatosis with polyangiitis, and lymphoma — which need tissue rather than a steroid trial",
      ],
      urgency: "emergency",
      referral: "Emergency ophthalmology and ENT; rheumatology once infection is excluded",
      bySite: {
        skull_base_iii_orbit_sup: { level: "lid elevation and the superior rectus, with acuity" },
        skull_base_iii_orbit_inf: { level: "the inferior and medial recti, and the pupil" },
      },
    },
  }),

  // ---- INFLAMMATORY NEUROPATHY AND NMJ FAILURE ----
  ...family("inflammatory-neuromuscular", NEUROMUSCULAR_SPINE, {
    "Guillain-Barré syndrome": {
      slots: { level: "facial movement on BOTH sides, plus limb power and reflexes",
               flavour: "a BILATERAL facial palsy is Guillain-Barré until proven otherwise — and the areflexia and the ascending pattern are what to look for once the face has drawn attention" },
    },
    "Guillain-Barré syndrome (inflammatory polyradiculopathy)": {
      slots: { level: "leg power, reflexes and sphincter function",
               flavour: "a cauda-like presentation with AREFLEXIA and severe back pain — and the discriminator from compression is the MRI, so image before assuming an inflammatory cause" },
      confirmatoryExtra: ["Sphincter involvement is unusual in Guillain-Barré and should prompt harder exclusion of a compressive cause, even when the rest of the picture fits"],
    },
    "Vasculitic neuropathy or inflammatory neuropathy (GBS / CIDP)": {
      slots: { level: "the pattern — symmetric and length-dependent, or asymmetric and multifocal",
               flavour: "the PATTERN is the diagnosis: symmetric and demyelinating suggests CIDP, asymmetric and axonal across named nerves suggests vasculitis, and they are treated differently" },
      confirmatoryExtra: ["Nerve conduction studies across multiple limbs, plus the full vasculitic screen — and consider nerve biopsy where the pattern is asymmetric and axonal"],
      urgency: "urgent",
    },
    "Multifocal motor neuropathy with conduction block": {
      slots: { level: "power in individual NAMED NERVE territories, with the reflexes and any wasting",
               flavour: "PURELY MOTOR, asymmetric, in named nerve territories rather than myotomes, WITHOUT sensory loss — and the reason to identify it is that it imitates motor neurone disease and is TREATABLE, where MND is not" },
      confirmatoryExtra: [
        "Nerve conduction studies looking specifically for CONDUCTION BLOCK at sites away from usual entrapment points, and anti-GM1 antibodies which are positive in around half",
        "It responds to IMMUNOGLOBULIN and is made WORSE by steroids — so the treatment differs from CIDP, and the distinction is not academic",
      ],
      urgency: "urgent",
      referral: "Neurology / neuromuscular service — immunoglobulin is the treatment",
    },
    "Myasthenic crisis (respiratory)": {
      slots: { level: "FORCED VITAL CAPACITY, bulbar function and neck flexion",
               flavour: "neck flexion weakness parallels diaphragm weakness and is a useful bedside proxy — and a patient who cannot lift their head off the pillow is in more trouble than they look" },
      confirmatoryExtra: [
        "Identify the PRECIPITANT: infection, surgery, pregnancy, a missed dose, or a new drug — several antibiotic classes and magnesium are potent triggers and are commonly given without the myasthenia being considered",
        "Do NOT rely on blood gases to decide about ventilation: hypercapnia is a very late sign in neuromuscular failure, and the decision is made on vital capacity and clinical trajectory",
      ],
      referral: "Critical care and neurology together — intubate electively rather than as an emergency",
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
};
