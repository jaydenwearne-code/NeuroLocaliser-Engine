// multifocalNextSteps.js — THE CROSS-SITE WORKUP LAYER (spec 2026-08-21).
//
//   multifocalPlanFor(name) -> { firstLine, confirmatory, monitoring, urgency, referral, because } | null
//
// The Together card names the process that spans the sites; this gives that process its own workup, so the
// all-sites Next card can stop unioning per-site plans once the cross-site claim has been made. A union of
// an optic-nerve plan and a cord plan never orders the lumbar puncture that settles MS, because neither
// site knows the two lesions are related.
//
// CONTENT ONLY. Imports nothing from the UI and nothing from nextSteps.js, so a clinician reviews one file.
//
// SITE-INDEPENDENT BY CONSTRUCTION — no `slots`, no `bySite`. That is the whole point: MS needs MRI brain
// AND whole spine, CSF oligoclonal bands and AQP4/MOG regardless of which two places the lesions sit in.
// This is why the plans do NOT live in src/data/pathology/, whose plans are keyed by per-site cause name
// and interpolate per-site anatomy — and why PATHOLOGY_NEXT keeps ONE kind of key, which the RED GATE test
// in test/pathology-next-steps.test.js walks.
//
// A `firstLine` tier exists here and does NOT exist in tranche 2's dz(): in the per-site layer, first-line
// was always site-level. Here it is ADDITIVE — the site union PLUS these, never instead of them, so an
// urgent MRI whole spine cannot vanish because someone clicked MS.
//
// URGENCY FOLLOWS THE SELECTION (owner ruling, 2026-08-21). A plan's `urgency` is what the card shows,
// even where it sits BELOW the badge the sites would carry on their own — MS across two brainstem sites is
// urgent, not an emergency. The only mechanical floor is the entity's own `red` flag, applied below. What
// keeps that safe is the tier split, not the badge: immediate and first-line stay the site union in
// combinedNextSteps(), so nothing bedside is ever removed by a quieter badge.
//
// ✅ CLINICALLY SIGNED OFF (2026-08-21) by the owner (a clinician): ALL 13 cross-site plans, across three
// rounds (inflammatory / demyelinating; neoplastic / degenerative / congenital; infective / vascular /
// paraneoplastic), reviewed round by round rather than in one batch at the end. Round 1's read produced the
// urgency ruling above. THE GATE IS CLOSED — do not re-flag this content as unreviewed. Content added from
// here is held to the same bar and flagged for review if uncertain.
import { MULTIFOCAL } from "./multifocal.js";

const URGENCY_RANK = { emergency: 3, urgent: 2, routine: 1 };
const RED_FLOOR = "urgent";

// `because` — OPTIONAL, and it exists because urgency now follows the SELECTION (owner ruling 2026-08-21).
// A card that asserts its own badge should be able to say why, and for some diseases the badge is NOT
// earned by the disease itself but by what it can cause: metastases are an emergency because of cord
// compression, not because a deposit is inherently time-critical. Rendered directly beneath the urgency
// band, never inside `referral` — "who to refer to" is not "why this badge", and merging them is the
// LEVEL-is-not-its-contents error in another costume.
//
// Omit it where the disease IS the emergency (an embolic shower is time-critical on its own account).
export const mfPlan = (entity, { firstLine = [], confirmatory = [], monitoring = [], urgency = "routine", referral = "", because = "" }) =>
  ({ entity, firstLine, confirmatory, monitoring, urgency, referral, because });

export const MULTIFOCAL_NEXT = {
  "Multiple sclerosis": mfPlan("Multiple sclerosis", {
    firstLine: [
      "MRI BRAIN AND WHOLE SPINE with contrast in one sitting — dissemination in space is the diagnosis, and a cord lesion is missed by brain imaging alone",
      "LUMBAR PUNCTURE for CSF-restricted OLIGOCLONAL BANDS with a paired serum sample — the test that separates demyelination from its mimics",
      "Serum AQP4 and MOG antibodies BEFORE committing to an MS label — both are treated differently, and both can look like MS at a first attack",
      "Bloods for the mimics that image alike: B12, thyroid function, ANA/ENA, ACE, HIV and syphilis serology",
    ],
    confirmatory: [
      "Visual evoked potentials where a clinically silent optic lesion would add dissemination in space",
      "OCT of the retinal nerve fibre layer for subclinical thinning",
      "Neurology referral for formal criteria review and a disease-modifying therapy discussion",
    ],
    monitoring: [
      "Record a baseline disability score before treatment starts, so later change is measurable rather than remembered",
      "Screen for the treatable things that worsen function independently of relapses — bladder dysfunction, spasticity, fatigue, low mood",
      "Counsel on the relapse-versus-pseudorelapse distinction, and give explicit re-presentation advice",
    ],
    urgency: "urgent",
    referral: "Neurology — MS service; urgent for a first presentation disseminated in space or any cord involvement.",
  }),

  "NMOSD (neuromyelitis optica spectrum disorder)": mfPlan("NMOSD (neuromyelitis optica spectrum disorder)", {
    firstLine: [
      "Serum AQP4-IgG by CELL-BASED ASSAY, with MOG-IgG alongside it — the assay matters, and an ELISA result is not equivalent",
      "MRI brain and WHOLE SPINE with contrast — look for a longitudinally extensive cord lesion and for area postrema involvement",
      "Lumbar puncture — oligoclonal bands are usually ABSENT here, which is itself informative against MS",
      "Baseline bloods with a screen for coexisting autoimmune disease",
    ],
    confirmatory: [
      "Formal acuity, colour vision and perimetry — optic neuritis here is more often bilateral or chiasmal, and more severe, than in MS",
      "OCT for retinal nerve fibre layer loss",
      "URGENT neurology / neuroimmunology discussion: acute escalation to plasma exchange is time-critical and must not wait for the antibody result",
    ],
    monitoring: [
      "Watch respiratory function and swallow where there is a cervical cord or area postrema lesion",
      "Intractable hiccups or vomiting is a relapse, not a gastrointestinal problem — treat it as one",
      "Recovery is less complete than in MS: involve rehabilitation early rather than after a plateau",
    ],
    urgency: "emergency",
    referral: "Neurology / neuroimmunology — same day. Do not delay acute treatment for the antibody result.",
  }),

  "Neurosarcoidosis": mfPlan("Neurosarcoidosis", {
    firstLine: [
      "MRI brain and spine with contrast — leptomeningeal and cranial nerve enhancement is the pattern to look for",
      "Serum ACE and calcium, with CT chest (or thorax/abdomen/pelvis) for systemic disease — the accessible biopsy target is usually OUTSIDE the nervous system",
      "Lumbar puncture: cell count, protein, glucose, cytology and CSF ACE with a paired serum sample",
      "Ophthalmology review for uveitis — a silent extraneural site that both supports the diagnosis and needs treating",
    ],
    confirmatory: [
      "FDG-PET to find an occult systemic focus when chest imaging is unrevealing",
      "TISSUE DIAGNOSIS from the most accessible site — mediastinal node, skin or conjunctiva, long before brain or meningeal biopsy is considered",
      "Exclude by name the mimics that enhance identically: tuberculosis, lymphoma, IgG4-related disease",
    ],
    monitoring: [
      "Neuroendocrine assessment where there is hypothalamic or pituitary involvement — easily missed, and readily treated",
      "Monitor for hydrocephalus wherever there is basal meningeal disease",
      "Plan steroid-sparing therapy, and monitor for the metabolic and bone consequences of prolonged steroids",
    ],
    urgency: "urgent",
    referral: "Neurology with respiratory or rheumatology input; ophthalmology for uveitis.",
  }),

  "Vasculitis (CNS or systemic)": mfPlan("Vasculitis (CNS or systemic)", {
    firstLine: [
      "ESR AND CRP together (one can be normal), full blood count with film, renal function, and URINALYSIS for casts and protein",
      "ANCA, ANA/ENA, complement, cryoglobulins, rheumatoid factor, and hepatitis B and C serology",
      "MRI brain and spine with contrast plus vessel imaging — infarcts in multiple territories OF DIFFERING AGE is the pattern",
      "Lumbar puncture to exclude infection and to demonstrate inflammation, BEFORE immunosuppression starts",
    ],
    confirmatory: [
      "Catheter angiography where the vessels involved are large enough to show beading — a normal MRA does not exclude small-vessel disease",
      "BIOPSY of the most accessible affected organ; brain and leptomeningeal biopsy only where nothing else is available",
      "Blood cultures and echocardiography — endocarditis mimics vasculitis exactly, and immunosuppressing it would be catastrophic",
    ],
    monitoring: [
      "Treat the infectious mimics as excluded only when cultures and imaging say so, never on the strength of the clinical picture",
      "Monitor renal function and urinalysis: the kidney declares systemic vasculitis earlier than the nervous system does",
      "Plan induction and maintenance immunosuppression with the relevant specialty, and monitor for treatment-related infection",
    ],
    urgency: "urgent",
    referral: "Neurology with rheumatology; renal if urinalysis is abnormal.",
  }),

  "Mononeuritis multiplex": mfPlan("Mononeuritis multiplex", {
    firstLine: [
      "NERVE CONDUCTION STUDIES AND EMG — the study that proves the pattern is multiple NAMED nerves in a non-length-dependent distribution, not a polyneuropathy",
      "Vasculitic screen: ESR/CRP, ANCA, ANA/ENA, cryoglobulins, complement, hepatitis B and C, HIV",
      "Glucose and HbA1c — diabetes is the commonest non-vasculitic cause, and it does not need immunosuppression",
      "Urinalysis and renal function for systemic involvement",
    ],
    confirmatory: [
      "NERVE AND MUSCLE BIOPSY (sural nerve with adjacent muscle) — the highest-yield tissue diagnosis, and best taken before immunosuppression begins",
      "Whole-body imaging or PET where a paraneoplastic or lymphomatous cause is suspected",
      "Consider leprosy wherever there is a relevant exposure history — it remains the commonest cause worldwide",
    ],
    monitoring: [
      "This progresses stepwise: each new nerve is a relapse, so document the deficit carefully at every review",
      "Splinting and hand or foot therapy early, before contracture becomes fixed",
      "Neuropathic pain here is severe and routinely undertreated — address it explicitly rather than in passing",
    ],
    urgency: "urgent",
    referral: "Neurology with rheumatology; urgent where there is systemic involvement or rapid progression.",
  }),

  "Metastases": mfPlan("Metastases", {
    firstLine: [
      "MRI BRAIN AND WHOLE SPINE WITH CONTRAST — multiple sites means whole-neuraxis imaging, and cord compression is the finding that changes management within hours",
      "CT chest, abdomen and pelvis for the primary and the burden of disease",
      "Bloods including calcium, liver function and clotting",
      "Ask about and EXAMINE FOR the primary — breast, skin, prostate, testis; the examination that finds it is often the one nobody did",
    ],
    confirmatory: [
      "TISSUE from the most accessible site — a peripheral node or a skin lesion long before a craniotomy",
      "FDG-PET where the primary remains unknown after cross-sectional imaging",
      "Tumour markers and receptor status once the primary is identified — they change the treatment entirely",
    ],
    monitoring: [
      "Corticosteroids for symptomatic oedema, at the shortest effective course, with gastric protection considered",
      "Seizure risk with cortical deposits — counsel explicitly about driving",
      "Involve oncology and palliative care in parallel, not in sequence",
    ],
    urgency: "emergency",
    because: "Emergency for what the deposits CAN CAUSE rather than for the deposits themselves — cord compression and raised intracranial pressure are the time-critical complications, and both are still reversible at the point they are found.",
    referral: "Oncology urgently; neurosurgery or spinal surgery same-day if there is cord compression.",
  }),

  "Leptomeningeal disease": mfPlan("Leptomeningeal disease", {
    firstLine: [
      "MRI BRAIN AND WHOLE SPINE WITH CONTRAST BEFORE the lumbar puncture — post-LP dural enhancement mimics the disease you are looking for",
      "LUMBAR PUNCTURE FOR CYTOLOGY with a large-volume sample; sensitivity rises substantially with repeat taps",
      "Record the opening pressure, cell count, protein and glucose — a low glucose with high protein and a lymphocytosis is the classic profile",
      "CT chest, abdomen and pelvis for the primary if it is not already known",
    ],
    confirmatory: [
      "CSF flow cytometry wherever lymphoma or leukaemia is possible",
      "REPEAT the cytology rather than accepting a single negative result — one negative tap does not exclude this",
      "Discuss intrathecal access and radiotherapy planning with oncology early",
    ],
    monitoring: [
      "Watch for hydrocephalus and for progressive cranial neuropathies",
      "Treat pain and delirium actively — this is a high-symptom-burden diagnosis",
      "Palliative care alongside oncology from the point of diagnosis",
    ],
    urgency: "emergency",
    because: "Emergency for what it CAN CAUSE — obstructive hydrocephalus and progressive cranial neuropathy — not because the meningeal deposits themselves demand treatment within hours.",
    referral: "Oncology / neuro-oncology urgently; neurosurgery if hydrocephalus develops.",
  }),

  "Primary CNS lymphoma": mfPlan("Primary CNS lymphoma", {
    firstLine: [
      "MRI brain and whole spine with contrast — homogeneously enhancing periventricular lesions crossing the corpus callosum are the pattern",
      "DO NOT GIVE CORTICOSTEROIDS BEFORE BIOPSY unless the patient is deteriorating from mass effect: steroids dissolve the lesion and the tissue diagnosis with it",
      "HIV test — it changes both the differential and the treatment",
      "Ophthalmology slit-lamp examination for vitreoretinal involvement, which can give the diagnosis without a brain biopsy",
    ],
    confirmatory: [
      "STEREOTACTIC BRAIN BIOPSY, arranged urgently and before any steroid",
      "Lumbar puncture with cytology and flow cytometry",
      "CT chest/abdomen/pelvis with testicular examination and ultrasound — systemic lymphoma with CNS spread is a different disease with a different treatment",
    ],
    monitoring: [
      "If steroids have already been given the lesion may vanish: flag this to the neurosurgeons explicitly, and time the biopsy to its return",
      "Monitor for raised intracranial pressure",
      "Haemato-oncology referral for a methotrexate-based regimen",
    ],
    urgency: "emergency",
    because: "Emergency for a REASON OF TIMING, not of physiology — every day before biopsy is a day someone may give steroids, and steroids dissolve the lesion and the diagnosis with it. Mass effect, where present, is the second reason.",
    referral: "Neuro-oncology / haematology urgently; neurosurgery for the biopsy.",
  }),

  "Neurofibromatosis type 2": mfPlan("Neurofibromatosis type 2", {
    firstLine: [
      "MRI BRAIN WITH INTERNAL AUDITORY MEATUS VIEWS AND WHOLE SPINE, with contrast — bilateral vestibular schwannomas are the defining lesion, and spinal tumours are frequently silent",
      "Formal audiometry with speech discrimination, plus brainstem evoked responses",
      "Ophthalmology review for juvenile cataract and retinal hamartoma",
      "Examine the skin for schwannomas and take a family history across three generations",
    ],
    confirmatory: [
      "GENETIC TESTING with counselling arranged alongside it — mosaicism is common and changes what relatives are told",
      "Screening of first-degree relatives once the diagnosis is established",
      "Referral to a specialist multidisciplinary service: hearing-preservation strategy depends on the whole tumour burden, never on one lesion",
    ],
    monitoring: [
      "Serial imaging and audiometry on a planned interval rather than symptom-driven review",
      "Plan for hearing loss BEFORE it happens — communication strategy, and auditory brainstem implantation discussed while the cochlear nerve is intact",
      "Watch for brainstem compression, and for cord compression from spinal tumours",
    ],
    urgency: "urgent",
    referral: "Specialist NF2 multidisciplinary service; clinical genetics.",
  }),

  "Motor neurone disease (ALS)": mfPlan("Motor neurone disease (ALS)", {
    firstLine: [
      "EMG AND NERVE CONDUCTION STUDIES SAMPLING MULTIPLE REGIONS — bulbar, cervical, thoracic and lumbosacral — because the diagnosis is denervation in regions the examination has not yet declared",
      "MRI brain and the relevant cord levels to exclude the structural mimics: a cervical myelopathy with radiculopathy reproduces the mixed picture exactly",
      "Bloods: creatine kinase, thyroid function, B12, protein electrophoresis, and anti-GM1 antibodies where multifocal motor conduction block is possible",
      "RESPIRATORY FUNCTION INCLUDING ERECT AND SUPINE VITAL CAPACITY — a fall on lying flat indicates diaphragm weakness, and this is done at diagnosis rather than when the patient is breathless",
    ],
    confirmatory: [
      "Specialist neuromuscular review against the diagnostic criteria before the diagnosis is given",
      "Exclude the treatable mimics deliberately and by name — multifocal motor neuropathy, myasthenia, inclusion body myositis, Kennedy's disease",
      "Genetic testing with counselling where there is a family history or young onset",
    ],
    monitoring: [
      "Serial respiratory function with an early non-invasive ventilation discussion — the intervention with the clearest benefit",
      "Swallow and nutrition review, with gastrostomy discussed EARLY, while respiratory function still permits it safely",
      "Multidisciplinary clinic, advance care planning and carer support started at diagnosis rather than deferred",
    ],
    urgency: "urgent",
    referral: "Neurology — specialist MND / neuromuscular service, with early respiratory and palliative care involvement.",
  }),

  "Neurosyphilis or HIV": mfPlan("Neurosyphilis or HIV", {
    firstLine: [
      "HIV TESTING AND SYPHILIS SEROLOGY (treponemal and non-treponemal together) — BOTH, in every case: they coexist, and each alters the other's course",
      "MRI brain and spine with contrast",
      "LUMBAR PUNCTURE with cell count, protein, CSF VDRL and treponemal testing — CSF VDRL is specific but insensitive, so a negative result does not exclude this",
      "CD4 count and HIV viral load where HIV is confirmed",
    ],
    confirmatory: [
      "CSF testing for the opportunistic infections that present the same way — JC virus PCR, toxoplasma, cryptococcal antigen, tuberculosis",
      "Ophthalmology and audiology review: ocular and otosyphilis are treated as neurosyphilis regardless of any other finding",
      "Sexual health services for partner notification and contact tracing",
    ],
    monitoring: [
      "Warn about and observe for the Jarisch-Herxheimer reaction when treatment starts",
      "Repeat CSF and serological testing at planned intervals to confirm the response",
      "Watch for immune reconstitution inflammatory syndrome after antiretroviral therapy begins",
    ],
    urgency: "urgent",
    referral: "Infectious diseases / sexual health, with neurology. Both are treatable — treat rather than observe.",
  }),

  "Embolic shower (cardiac or aortic source)": mfPlan("Embolic shower (cardiac or aortic source)", {
    firstLine: [
      "MRI BRAIN WITH DWI — scattered infarcts in MULTIPLE arterial territories OF THE SAME AGE is the finding that makes this diagnosis",
      "ECG plus PROLONGED cardiac rhythm monitoring — a single ECG does not exclude paroxysmal atrial fibrillation",
      "ECHOCARDIOGRAPHY, transoesophageal where the transthoracic study is unrevealing: vegetations, thrombus, aortic arch atheroma and a right-to-left shunt all live there",
      "BLOOD CULTURES BEFORE ANTIBIOTICS, with inflammatory markers — infective endocarditis is the source you must not miss",
    ],
    confirmatory: [
      "CT or MR angiography of the aortic arch and neck vessels for a proximal source",
      "Bubble study for a right-to-left shunt where no other source is found, particularly in a younger patient",
      "Screen for malignancy and for a hypercoagulable state once cultures and cardiac imaging are clear — non-bacterial thrombotic endocarditis presents exactly this way",
    ],
    monitoring: [
      "WITHHOLD ANTICOAGULATION until endocarditis is excluded — anticoagulating an infected embolus causes haemorrhage",
      "Serial neurological observation: the process is ongoing, and further emboli are expected rather than surprising",
      "Secondary prevention is decided by the SOURCE, not by the infarct pattern",
    ],
    urgency: "emergency",
    referral: "Stroke team with cardiology; infectious diseases urgently if endocarditis is possible.",
  }),

  "Paraneoplastic syndrome": mfPlan("Paraneoplastic syndrome", {
    firstLine: [
      "PARANEOPLASTIC AND NEURONAL SURFACE ANTIBODY PANELS IN SERUM AND CSF TOGETHER — the panels differ between the two compartments, and a serum-only request misses cases",
      "MRI brain and spine with contrast — medial temporal signal change supports limbic encephalitis, but normal imaging does not exclude the diagnosis",
      "CT chest, abdomen and pelvis as the first search for the tumour",
      "Lumbar puncture: cell count, protein, oligoclonal bands and cytology",
    ],
    confirmatory: [
      "FDG-PET when cross-sectional imaging is negative — the tumour is often small, and the neurological syndrome precedes it",
      "Antibody-directed targeted search: examine the testes, image the pelvis and breasts, according to the antibody found",
      "REPEAT the tumour search at intervals if the first is negative — one negative screen does not exclude an occult malignancy",
    ],
    monitoring: [
      "Treating the tumour is the definitive treatment for the neurological syndrome; immunotherapy alone rarely holds",
      "Monitor for seizures and for the psychiatric and cognitive features, which are readily attributed elsewhere",
      "Neurological recovery lags tumour treatment — set expectations accordingly",
    ],
    urgency: "urgent",
    referral: "Neurology / neuroimmunology and oncology in parallel.",
  }),
};

// The entity's own `red` flag floors its urgency, exactly as a red per-site cause floors the site's. The
// floor may RAISE urgency and never caps it: a plan may legitimately sit below the site's badge, but
// nothing flagged as a must-not-miss may render as routine.
const RED_BY_ENTITY = new Map(MULTIFOCAL.map(e => [e.name, !!e.red]));

export function multifocalPlanFor(name) {
  const p = MULTIFOCAL_NEXT[name];
  if (!p) return null;
  const floored = RED_BY_ENTITY.get(name) && URGENCY_RANK[p.urgency] < URGENCY_RANK[RED_FLOOR]
    ? RED_FLOOR : p.urgency;
  return { firstLine: p.firstLine, confirmatory: p.confirmatory, monitoring: p.monitoring,
           urgency: floored, referral: p.referral, because: p.because };
}
