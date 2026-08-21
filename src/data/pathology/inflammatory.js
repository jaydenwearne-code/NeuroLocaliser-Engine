// inflammatory.js — pathology workups for the INFLAMMATORY / DEMYELINATING / AUTOIMMUNE category.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ ALL SIGNED OFF by the owner (a clinician), 2026-08-18.
//   Tranche 1 — 3 plans. Tranche 2 (round 7) — autoimmune encephalitis, NMOSD/MOG, vasculitis,
//   granulomatous disease, and inflammatory neuromuscular. The inflammatory red set is complete.
//   Tranche 3 (round 6) — the inflammatory NON-red set: 20 plans + 13 aliases (ten of them spellings
//   of Demyelination). AWAITING CLINICAL REVIEW.
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
  // ================= ROUND 6 (tranche 3): the inflammatory NON-red set =================
  // Ten of the thirty-three names in this bucket turned out to be spellings of DEMYELINATION and are
  // aliased in ../pathologyNextSteps.js rather than authored here. What remains are the genuinely
  // distinct entities.

  // Five sites, and the one real reuse left in the bucket. The teaching point is the SEQUENCE: severe
  // pain first, then weakness as the pain fades — which is backwards from a compressive lesion.
  "Neuralgic amyotrophy (Parsonage-Turner)": dz("Neuralgic amyotrophy (Parsonage-Turner)", {
    slots: { level: "the affected muscles", flavour: "map the weakness against named nerves rather than one root" },
    bySite: {
      root_c5: { level: "shoulder abduction and external rotation", flavour: "it crosses more than one root or nerve territory, which is what argues against a C5 radiculopathy" },
      plexus_upper_trunk: { level: "the whole upper trunk distribution", flavour: "patchy involvement that does not respect the trunk is the giveaway — it picks off individual nerves within it" },
      nerve_phrenic: { level: "diaphragm excursion and orthopnoea", flavour: "PHRENIC involvement causes breathlessness on lying flat, and is missed unless erect and supine vital capacity are compared" },
      nerve_axillary: { level: "deltoid power and the badge patch", flavour: "isolated deltoid wasting after severe shoulder pain, with no injury to explain it" },
      nerve_long_thoracic: { level: "scapular winging on wall press", flavour: "winging that appeared after a painful shoulder rather than after trauma" },
    },
    confirmatory: [
      "NERVE CONDUCTION STUDIES AND EMG after two to three weeks — earlier is normal, which misleads. The finding is patchy axonal loss crossing more than one nerve or root, which is what separates it from a compressive lesion",
      "MRI of the brachial plexus and, where relevant, the cervical spine — mainly to EXCLUDE compression; plexus hyperintensity supports it but its absence does not refute it",
      "{flavour} — and examine {level}",
      "Ask about a preceding trigger: infection, immunisation, surgery or unusual exertion in the days to weeks before the pain",
    ],
    monitoring: [
      "THE SEQUENCE IS THE DIAGNOSIS: severe pain for days to weeks that FADES as profound weakness appears. A compressive lesion does not behave this way, and getting the order from the patient is more useful than any single test",
      "Recovery takes MONTHS to years and is usually good but often incomplete — say so early, because the weakness is alarming and the natural history is the reassurance",
      "Physiotherapy to prevent contracture and shoulder subluxation; treat the neuropathic pain in its own right",
    ],
    urgency: "urgent",
    referral: "Neurology with neurophysiology; respiratory input where the phrenic nerve is involved.",
  }),

  "Anterior interosseous entrapment / neuralgic amyotrophy": dz("Anterior interosseous entrapment / neuralgic amyotrophy", {
    confirmatory: [
      "THE 'OK' SIGN IS THE TEST — the patient pinches with a flat, straight-fingered pulp-to-pulp grip instead of a round circle, because flexor pollicis longus and the deep flexor to the index finger have failed",
      "NO SENSORY LOSS AT ALL: the anterior interosseous is a pure motor branch, so any numbness moves the diagnosis to a proximal median or a C8/T1 lesion",
      "EMG at two to three weeks; most of these are NEURALGIC AMYOTROPHY rather than true entrapment, and the distinction matters because one is watched and the other is decompressed",
      "Ask about the preceding pain — a painful onset points to neuralgic amyotrophy and away from entrapment",
    ],
    monitoring: [
      "Spontaneous recovery over many months is the rule for the inflammatory form, so a period of observation is legitimate rather than negligent",
      "Re-examine and repeat EMG before considering surgery — operating on an inflammatory palsy achieves nothing",
      "Occupational therapy for pinch function while it recovers",
    ],
    urgency: "routine",
    referral: "Neurology or hand surgery; neurophysiology first.",
  }),

  // Four diseases in one name, and their work-ups genuinely diverge — which is why this is NOT aliased
  // onto Demyelination.
  "Transverse myelitis (MS / NMOSD / MOG / para-infectious)": dz("Transverse myelitis (MS / NMOSD / MOG / para-infectious)", {
    confirmatory: [
      "MRI WHOLE SPINE WITH CONTRAST BEFORE ANYTHING ELSE — the first job is to exclude COMPRESSION, which is a surgical emergency and looks identical at the bedside. Only then is inflammation on the table",
      "MRI brain in the same sitting: brain lesions separate MS from an isolated myelitis and change the treatment entirely",
      "SERUM AQP4 AND MOG ANTIBODIES BY CELL-BASED ASSAY — a longitudinally extensive lesion spanning three or more segments points away from MS and towards NMOSD or MOG, and those are treated differently",
      "Lumbar puncture for cell count, protein and oligoclonal bands, with paired serum — bands present favour MS, absent favours NMOSD",
    ],
    monitoring: [
      "SAFETY NET: watch the RESPIRATORY function and the BLADDER in a cervical or high-thoracic lesion; retention is often painless and needs a measured residual rather than a question",
      "Acute treatment is time-critical and should not wait for the antibody result — escalation to plasma exchange is a decision made on the clinical course",
      "Recovery is worse in NMOSD than in MS: set expectations by the antibody once it returns, and involve rehabilitation early",
    ],
    urgency: "emergency",
    referral: "Neurology same-day; spinal surgery immediately if compression is not yet excluded.",
  }),

  "Demyelination / neurodegeneration": dz("Demyelination / neurodegeneration", {
    confirmatory: [
      "THE NAME HEDGES BETWEEN TWO PROCESSES and the imaging separates them: a discrete plaque with a relapsing history is demyelination; progressive atrophy without discrete lesions is degeneration",
      "MRI brain and spine with contrast, and compare with any prior imaging — the previous scan is often the most informative test available",
      "Where a plaque is found, work it up as demyelination: CSF oligoclonal bands, AQP4 and MOG",
    ],
    monitoring: [
      "The palatal tremor itself usually PERSISTS regardless of the cause and does not respond well to treatment — say so, rather than implying it will resolve",
      "Re-image if the course changes: a hedge should be resolved rather than carried indefinitely",
    ],
    urgency: "routine",
    referral: "Neurology.",
  }),

  "Myasthenia gravis (autoimmune)": dz("Myasthenia gravis (autoimmune)", {
    confirmatory: [
      "ACETYLCHOLINE RECEPTOR ANTIBODIES first; where negative, MuSK and LRP4 — a seronegative result does not exclude the diagnosis, and around one in seven has MuSK instead",
      "REPETITIVE NERVE STIMULATION or single-fibre EMG where serology is negative",
      "CT CHEST FOR A THYMOMA in every case — it changes management to surgery and is not optional",
      "Test thyroid function and screen for the other autoimmune diseases that travel with it",
    ],
    monitoring: [
      "RESPIRATORY FUNCTION is the thing that kills: measure FORCED VITAL CAPACITY serially, not oxygen saturation, which stays normal until the patient is nearly in arrest",
      "SAFETY NET: give the patient a written list of drugs that unmask or worsen myasthenia — aminoglycosides, fluoroquinolones, beta-blockers, magnesium — because a crisis is often iatrogenic",
      "Swallow assessment before oral intake in a bulbar presentation, and a clear plan for what to do if symptoms escalate",
    ],
    urgency: "urgent",
    referral: "Neurology; same-day if there is bulbar or respiratory involvement.",
  }),

  "Lambert-Eaton myasthenic syndrome": dz("Lambert-Eaton myasthenic syndrome", {
    confirmatory: [
      "VOLTAGE-GATED CALCIUM CHANNEL (P/Q-type) ANTIBODIES, and neurophysiology showing INCREMENT after brief maximal exercise — the facilitation is the diagnosis and is the mirror image of myasthenia",
      "CT CHEST urgently, and FDG-PET if it is clear: around half have SMALL-CELL LUNG CANCER, and the neurological syndrome commonly precedes the tumour by months",
      "REPEAT the tumour search at intervals if the first is negative — a single clear scan does not exclude an occult malignancy",
      "Ask about AUTONOMIC symptoms — dry mouth is present in most and is easily missed unless asked about directly",
    ],
    monitoring: [
      "TREATING THE TUMOUR IS THE DEFINITIVE TREATMENT for the neurological syndrome; immunotherapy alone rarely holds",
      "Reflexes may return transiently after exercise — a useful bedside sign, and worth re-testing rather than recording once",
      "Smoking cessation support: the association with small-cell disease makes this part of the treatment",
    ],
    urgency: "urgent",
    referral: "Neurology with oncology; the tumour search is the priority.",
  }),

  "Autoimmune (non-paraneoplastic) LEMS": dz("Autoimmune (non-paraneoplastic) LEMS", {
    confirmatory: [
      "The same antibody and the same neurophysiology as the paraneoplastic form — what differs is the SEARCH: a negative tumour screen here must still be REPEATED before the label is accepted",
      "Score the tumour risk formally (age, smoking, weight loss, bulbar involvement) and let it set the interval for repeat imaging rather than deciding once",
      "Screen for the other autoimmune diseases, which are commoner in this form",
    ],
    monitoring: [
      "THE NON-PARANEOPLASTIC LABEL IS PROVISIONAL for the first couple of years: the commonest error is stopping the tumour surveillance after one clear scan",
      "Symptomatic treatment and immunotherapy are the mainstays, and the response is usually better than in the paraneoplastic form",
      "Track autonomic symptoms alongside strength — they respond separately",
    ],
    urgency: "urgent",
    referral: "Neurology; oncology surveillance rather than referral where the screen is clear.",
  }),

  "Inflammatory myopathy (polymyositis, dermatomyositis, inclusion body myositis)": dz("Inflammatory myopathy (polymyositis, dermatomyositis, inclusion body myositis)", {
    confirmatory: [
      "CREATINE KINASE, myositis-specific antibodies, and MRI of the affected muscles to guide where to biopsy — imaging finds active muscle better than palpation does",
      "MUSCLE BIOPSY is what separates the three, and the distinction is not academic: inclusion body myositis does NOT respond to immunosuppression, so treating it as polymyositis exposes the patient to harm for no benefit",
      "EXAMINE THE SKIN for the dermatomyositis rash — heliotrope lids, Gottron's papules over the knuckles — and note that the skin can precede the weakness",
      "SCREEN FOR MALIGNANCY, particularly in dermatomyositis and in older patients: CT chest/abdomen/pelvis and age-appropriate screening",
    ],
    monitoring: [
      "ASK ABOUT SWALLOW AND BREATHLESSNESS at every review: pharyngeal weakness risks aspiration, and interstitial lung disease is the commonest cause of death, especially with anti-synthetase or MDA5 antibodies",
      "A pattern of FINGER FLEXOR and QUADRICEPS weakness that is asymmetric and slowly progressive suggests inclusion body myositis — reconsider the diagnosis rather than escalating immunosuppression",
      "Monitor CK alongside function, but treat the patient: CK and strength do not move together reliably",
    ],
    urgency: "urgent",
    referral: "Rheumatology or neurology; respiratory if there is any breathlessness.",
  }),

  "Idiopathic optic neuritis": dz("Idiopathic optic neuritis", {
    confirmatory: [
      "MRI BRAIN AND ORBITS WITH CONTRAST — the brain matters more than the orbit here, because white-matter lesions determine the risk of MS and therefore the conversation",
      "AQP4 AND MOG ANTIBODIES where the picture is atypical: bilateral, very severe, poor recovery, or a swollen disc",
      "Formal acuity, COLOUR VISION and perimetry, with OCT for a baseline — colour desaturation is out of proportion to acuity and is the sign that gives it away",
      "This is typically PAINFUL ON EYE MOVEMENT with a normal-looking disc; a painless or swollen presentation should make you doubt the diagnosis",
    ],
    monitoring: [
      "Vision usually recovers over weeks whether or not steroids are given — steroids speed recovery but do not change the final outcome, and saying so avoids an unnecessary argument",
      "The MRI result drives the follow-up: discuss disease-modifying therapy where there are brain lesions",
      "Warn about Uhthoff's phenomenon — transient worsening with heat or exercise is not a relapse",
    ],
    urgency: "urgent",
    referral: "Ophthalmology and neurology; same-week rather than same-day unless vision is severe or bilateral.",
  }),

  "Chronic relapsing inflammatory optic neuropathy (CRION)": dz("Chronic relapsing inflammatory optic neuropathy (CRION)", {
    confirmatory: [
      "THE DIAGNOSIS IS IN THE COURSE, not a single test: recurrent painful visual loss that RELAPSES EVERY TIME steroids are reduced or withdrawn. Steroid dependence is the defining feature",
      "AQP4 AND MOG ANTIBODIES — many cases previously called CRION are MOG antibody disease, and that reclassification changes long-term treatment",
      "MRI brain and orbits with contrast at each relapse, to exclude a compressive or infiltrative cause masquerading as steroid-responsive",
      "Exclude sarcoidosis and lymphoma, both of which shrink with steroids and return when they stop",
    ],
    monitoring: [
      "SAFETY NET: a steroid-responsive optic neuropathy that keeps relapsing needs a STEROID-SPARING agent, not repeated courses — the cumulative harm is the avoidable part",
      "Track visual acuity and OCT at each episode; stepwise loss accumulates and is easy to miss episode by episode",
      "Monitor bone density, glucose and blood pressure while on long-term steroids",
    ],
    urgency: "urgent",
    referral: "Neuro-ophthalmology with neurology; do not manage as recurrent idiopathic optic neuritis.",
  }),

  "Bell's palsy (idiopathic / HSV)": dz("Bell's palsy (idiopathic / HSV)", {
    confirmatory: [
      "IT IS A DIAGNOSIS OF EXCLUSION, and the exclusions are bedside ones: EXAMINE THE EAR for vesicles (Ramsay Hunt), the PAROTID for a mass, and the OTHER cranial nerves",
      "THE FOREHEAD MUST BE INVOLVED. Forehead sparing means an upper motor neurone lesion and a completely different pathway — that single observation is the most important in the assessment",
      "Consider Lyme serology where there is relevant exposure or BILATERAL palsy, and test glucose and blood pressure",
      "Imaging is not needed for a typical isolated palsy, but IS needed if onset is gradual, progressive beyond three weeks, recurrent, or accompanied by any other sign",
    ],
    monitoring: [
      "EYE PROTECTION IS THE URGENT PART — lubricants, and taping at night while the lid does not close. The avoidable harm here is corneal, not facial",
      "Corticosteroids improve outcome and are time-dependent: started within 72 hours is the window that matters",
      "SAFETY NET: no improvement by three months, or any progression, needs imaging — a slowly progressive facial palsy is a tumour until proven otherwise",
    ],
    urgency: "urgent",
    referral: "Primary care or ED for steroids and eye care; ENT or neurology if atypical or not recovering.",
  }),

  "Tolosa-Hunt syndrome (granulomatous inflammation)": dz("Tolosa-Hunt syndrome (granulomatous inflammation)", {
    confirmatory: [
      "MRI WITH DEDICATED CAVERNOUS SINUS AND ORBITAL APEX VIEWS, with contrast and fat saturation — granulomatous tissue enhances, and the scan is as much about excluding the mimics as confirming it",
      "IT IS A DIAGNOSIS OF EXCLUSION and the mimics are dangerous: LYMPHOMA, meningioma, metastasis, fungal infection in the immunosuppressed, carotid aneurysm and IgG4-related disease all sit here",
      "Inflammatory markers, ACE, ANCA, IgG4 and a chest CT before committing to an idiopathic label",
      "A dramatic steroid response supports it BUT DOES NOT CONFIRM IT — lymphoma and sarcoid respond too, which is the trap",
    ],
    monitoring: [
      "SAFETY NET: relapse, failure to respond, or response followed by return demands re-imaging and reconsideration of biopsy — this is where the missed lymphoma is found",
      "Steroid course with a plan for tapering and for what happens if symptoms return on reduction",
      "Document eye movements and pain objectively at baseline so response can actually be judged",
    ],
    urgency: "urgent",
    referral: "Neurology with neuro-ophthalmology; neurosurgery or ENT if biopsy becomes necessary.",
  }),

  "Thyroid eye disease": dz("Thyroid eye disease", {
    confirmatory: [
      "THYROID FUNCTION AND TSH-RECEPTOR ANTIBODIES — but note the eye disease can precede, follow or occur with normal thyroid function, so normal results do not exclude it",
      "CT OR MRI ORBITS: enlarged muscle BELLIES with SPARED TENDON INSERTIONS is the pattern, and it is what separates it from orbital myositis and from a mass",
      "IT RESTRICTS RATHER THAN PARALYSES — a forced duction test is positive, which is the bedside distinction from a third-nerve palsy",
      "ASSESS FOR OPTIC NEUROPATHY at every visit: colour vision, acuity and pupils. Apical crowding compresses the nerve and is the sight-threatening complication",
    ],
    monitoring: [
      "SAFETY NET: reduced colour vision or a relative afferent pupillary defect means compressive optic neuropathy — that is a same-day referral for decompression, not a routine review",
      "SMOKING is the strongest modifiable risk factor for progression, and cessation support is part of the treatment rather than general advice",
      "Corneal exposure from proptosis and lid retraction needs lubrication; check the cornea, not just the movements",
    ],
    urgency: "urgent",
    referral: "Ophthalmology with endocrinology; same-day if there is any sign of optic neuropathy.",
  }),

  "Chronic rhinosinusitis / nasal polyps": dz("Chronic rhinosinusitis / nasal polyps", {
    confirmatory: [
      "NASENDOSCOPY is the test — it sees the polyps and the obstruction directly, and it is what distinguishes a CONDUCTIVE smell loss from a sensorineural one",
      "CT SINUSES where surgery is contemplated or the picture is atypical, particularly if the disease is UNILATERAL — unilateral polyps can be a tumour or an inverted papilloma",
      "Ask about asthma and aspirin sensitivity — the triad changes both prognosis and treatment",
      "Formal smell testing before and after treatment, so the benefit can actually be judged",
    ],
    monitoring: [
      "This is the COMMONEST cause of smell loss and the most treatable — topical steroids, delivered in the right head position, are the mainstay and the technique matters more than the drug",
      "SAFETY NET: unilateral obstruction, bleeding, facial numbness or visual change needs urgent ENT imaging rather than another course of steroids",
      "Recurrence after surgery is common; long-term topical treatment is the expectation rather than a failure",
    ],
    urgency: "routine",
    referral: "ENT.",
  }),

  "Neuro-Behçet's disease": dz("Neuro-Behçet's disease", {
    confirmatory: [
      "ASK ABOUT ORAL AND GENITAL ULCERATION explicitly, and examine for them — recurrent oral ulceration is nearly universal and patients rarely volunteer the genital history",
      "MRI brain with contrast: a mesodiencephalic or brainstem lesion crossing anatomical boundaries is characteristic, and the pattern differs from MS",
      "Lumbar puncture to exclude infection and demonstrate inflammation; a neutrophilic CSF is more typical here than a lymphocytic one",
      "Ophthalmology for UVEITIS, HLA-B51 where available, and a pathergy test — and take the ethnic and geographic history, which materially changes the pre-test probability",
    ],
    monitoring: [
      "SAFETY NET: distinguish PARENCHYMAL disease from CEREBRAL VENOUS THROMBOSIS — Behçet's causes both, and they are treated in opposite directions (immunosuppression versus anticoagulation)",
      "Relapses accumulate disability; plan long-term immunosuppression rather than treating episodes",
      "Screen for the systemic complications, particularly vascular and ocular, which cause more harm than the neurological disease",
    ],
    urgency: "urgent",
    referral: "Neurology with rheumatology; ophthalmology same-week for uveitis.",
  }),

  "Lymphocytic hypophysitis": dz("Lymphocytic hypophysitis", {
    confirmatory: [
      "FULL PITUITARY PROFILE, and check CORTISOL FIRST — adrenal insufficiency is what kills, and it must be replaced before thyroid hormone or the crisis is precipitated",
      "MRI PITUITARY with contrast: symmetrical enlargement with a THICKENED STALK and loss of the posterior bright spot, and no deviation of the stalk, which is what separates it from an adenoma",
      "Take a pregnancy and postpartum history — the classic presentation is late pregnancy or the puerperium",
      "Review the drug chart for IMMUNE CHECKPOINT INHIBITORS: they cause an identical hypophysitis and the association is easily missed",
    ],
    monitoring: [
      "SAFETY NET: steroid replacement must come BEFORE thyroxine, and the patient needs sick-day rules and an emergency injection kit before leaving",
      "Visual fields where the gland is enlarged — chiasmal compression is the surgical indication",
      "Deficits may recover, so retest the axes rather than assuming lifelong replacement; diabetes insipidus often persists when the anterior axes recover",
    ],
    urgency: "urgent",
    referral: "Endocrinology urgently; neurosurgery if there is chiasmal compression.",
  }),

  "Sydenham's chorea or autoimmune chorea (SLE, antiphospholipid)": dz("Sydenham's chorea or autoimmune chorea (SLE, antiphospholipid)", {
    confirmatory: [
      "ANTISTREPTOLYSIN-O AND ANTI-DNASE B, throat swab, and an ECHOCARDIOGRAM — Sydenham's is a manifestation of RHEUMATIC FEVER, so the heart matters more than the chorea and must be looked at",
      "ANA, anti-dsDNA and ANTIPHOSPHOLIPID ANTIBODIES including lupus anticoagulant — autoimmune chorea in an adult, especially a young woman, is lupus or antiphospholipid syndrome until excluded",
      "MRI brain and a pregnancy test: chorea gravidarum and oral contraceptives both unmask antiphospholipid-associated chorea",
      "Exclude the other treatable causes of new chorea — thyrotoxicosis, polycythaemia, drugs and Wilson's disease",
    ],
    monitoring: [
      "SECONDARY PROPHYLAXIS AGAINST STREPTOCOCCUS is the intervention that changes the patient's life, and it is about preventing valve disease rather than treating the movements",
      "Chorea itself usually remits over months; treat it symptomatically only where it is disabling",
      "Where antiphospholipid antibodies are positive, thrombotic risk becomes the dominant issue and needs its own plan",
    ],
    urgency: "urgent",
    referral: "Paediatrics or neurology with cardiology; rheumatology where the autoimmune screen is positive.",
  }),

  "Rheumatoid synovitis at the elbow": dz("Rheumatoid synovitis at the elbow", {
    confirmatory: [
      "DISTINGUISH NERVE PALSY FROM TENDON RUPTURE — this is the trap. With a posterior interosseous palsy the TENODESIS effect is preserved: passively flexing the wrist still extends the fingers. With rupture it does not",
      "Ultrasound or MRI of the elbow shows synovitis, an effusion and any compressing mass, and images the tendons at the same time",
      "Review disease activity and treatment: active synovitis compressing a nerve is an argument for escalating rheumatological control, not only for surgery",
      "EMG to confirm the level and severity where the picture is not clear-cut",
    ],
    monitoring: [
      "Nerve function can recover with control of the synovitis, so the decision to decompress is a joint one with rheumatology rather than automatic",
      "Splinting to maintain finger extension while it recovers",
      "Check the cervical spine in rheumatoid disease before attributing everything to the elbow — atlantoaxial instability is the more dangerous problem",
    ],
    urgency: "urgent",
    referral: "Rheumatology with hand surgery.",
  }),

  "Ganglion, osteophyte or rheumatoid synovitis at the elbow": dz("Ganglion, osteophyte or rheumatoid synovitis at the elbow", {
    confirmatory: [
      "The name lists three STRUCTURAL causes of one syndrome, and IMAGING is what separates them: ultrasound or MRI shows a ganglion, an osteophyte or synovitis, and each has a different answer",
      "EMG to localise to the cubital tunnel and grade severity — the decision to operate rests on severity and progression, not on the presence of symptoms",
      "Examine for a palpable swelling and for elbow deformity; a tardy ulnar palsy follows an old fracture and may present decades later",
    ],
    monitoring: [
      "Conservative measures first where the deficit is mild — avoid prolonged elbow flexion, night splinting, and protect the nerve at the elbow",
      "WASTING OR PROGRESSIVE WEAKNESS is the indication for surgery; waiting past that point costs function that does not come back",
      "Where synovitis is the cause, treating the arthritis is part of treating the nerve",
    ],
    urgency: "routine",
    referral: "Hand or orthopaedic surgery; rheumatology if inflammatory.",
  }),

  "Idiopathic or post-viral accessory neuropathy": dz("Idiopathic or post-viral accessory neuropathy", {
    confirmatory: [
      "TAKE A SURGICAL HISTORY FIRST — the accessory nerve is most often injured in POSTERIOR TRIANGLE surgery, particularly lymph node biopsy, and an idiopathic label without asking is usually wrong",
      "Imaging of the neck to exclude a mass along the nerve's course before accepting an idiopathic cause",
      "EMG at two to three weeks to confirm the level and establish a baseline for recovery",
      "Ask about preceding viral illness or immunisation, and about a painful onset, which points towards neuralgic amyotrophy",
    ],
    monitoring: [
      "SHOULDER DROOP AND WINGING cause a painful frozen shoulder if not managed — physiotherapy to maintain range is what prevents the disability",
      "Recovery over months is usual in the post-viral form; failure to recover by six months prompts reconsideration and possible surgical exploration",
      "Distinguish trapezius weakness (accessory) from serratus weakness (long thoracic): both wing the scapula but in opposite directions",
    ],
    urgency: "routine",
    referral: "Neurology with neurophysiology; surgical opinion if a mass or an operative injury is found.",
  }),


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
