// congenital.js — pathology workups for the CONGENITAL / HEREDITARY category.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ ALL SIGNED OFF by the owner (a clinician), 2026-08-18.
//   Tranche 2 — the hindbrain/craniocervical malformation family (round 2b) and seven singletons
//   (round 9). The congenital red set is complete.
//
// NOTE ON SCOPE: tranche 2 targets the 337 RED must-not-miss causes, and only 2 of the 7 here are red.
// The other 5 were added at the owner's request (2026-08-18) because the group is only coherent whole —
// authoring Chiari without the syrinx it causes would teach half a mechanism.
import { dz, family } from "./builders.js";

// ---- HINDBRAIN AND CRANIOCERVICAL DEVELOPMENTAL MALFORMATIONS ----
// These are NOT vascular malformations and are deliberately kept out of that family: they share only the
// word. What unites THESE is a developmental anomaly at the hindbrain, craniocervical junction or neural
// tube, and a common mechanism — obstructed CSF flow. That mechanism is why the imaging question is the
// same for all of them, and why a syrinx is a CONSEQUENCE to be hunted rather than a separate diagnosis.
//
// Deliberately excluded: craniocervical TRAUMA (odontoid and condyle fractures) and craniocervical
// COMPRESSION by a foramen-magnum meningioma. Both sit at the same place and neither is developmental.
const HINDBRAIN_SPINE = {
  confirmatory: [
    "MRI of the CRANIOCERVICAL JUNCTION on thin sagittal slices — the anatomy here is missed on a standard brain study, which is framed for the hemispheres and often stops above the problem",
    "MRI of the WHOLE NEURAXIS, brain and entire cord: {flavour}",
    "CSF FLOW STUDY (cine phase-contrast) where surgery is being considered — the question is not what the anatomy looks like but whether flow is actually obstructed, and the two do not always agree",
    "Assess for the associated anomalies rather than stopping at the first: hydrocephalus, a syrinx, scoliosis, and a tethered cord at the other end of the neuraxis",
  ],
  monitoring: [
    "Track {level} at defined intervals — these are chronic and often stable for years, so the decision to operate rests on PROGRESSION rather than on the appearance of the scan",
    "Ask specifically about COUGH or Valsalva-provoked occipital headache: it is the symptom most characteristic of obstructed flow at the foramen magnum, and patients rarely volunteer it because it seems unremarkable to them",
    "SAFETY NET: progressive weakness, new sphincter symptoms, sleep-disordered breathing, or bulbar symptoms such as swallow difficulty or stridor are the features that convert observation into a surgical referral",
    "An INCIDENTAL finding is common and does not itself need treating — matching the symptoms to the anatomy honestly is the harder and more important part of this diagnosis",
  ],
  urgency: "routine",
  referral: "Neurosurgery, with neurology; spinal surgery where a syrinx or tethering is the dominant problem",
};


// ---- ROUND 7 (tranche 3): the congenital / hereditary NON-red set ----
// Three families survive here, and each is a genuine clinical claim rather than a shared head noun.

// HEREDITARY ATAXIA — the work-up is the same conversation whichever gene it turns out to be: confirm it
// genetically, exclude the ACQUIRED and TREATABLE mimics first, and screen for the systemic disease that
// travels with it. What differs between members is which organ to watch.
const HEREDITARY_ATAXIA = {
  confirmatory: [
    "EXCLUDE THE TREATABLE ACQUIRED CAUSES FIRST — B12, vitamin E, copper, thyroid, coeliac serology, alcohol history and drug review. A hereditary label closes the door on a reversible diagnosis, so it is earned rather than assumed",
    "MRI brain and spine: the PATTERN of atrophy is informative — cerebellar alone, olivopontocerebellar, or a thin cord — and it narrows the genetic panel before it is sent",
    "GENETIC TESTING WITH COUNSELLING ARRANGED FIRST, not afterwards. A repeat-expansion panel is usually the first tier, and the result has implications for siblings and children that need discussing before the sample is taken",
    "{flavour}",
  ],
  monitoring: [
    "{level}",
    "Physiotherapy, occupational therapy and speech therapy sustain function far more than any drug available; refer early rather than at deterioration",
    "Genetic counselling for the family is part of the treatment, including predictive testing and reproductive options",
  ],
  urgency: "routine",
  referral: "Neurology with clinical genetics; add the organ-specific specialty named in the plan.",
};

// HEREDITARY NEUROPATHY — the diagnosis changes behaviour more than it changes treatment: what these
// patients need is to know what damages their nerves and to stop doing it.
const HEREDITARY_NEUROPATHY = {
  confirmatory: [
    "NERVE CONDUCTION STUDIES FIRST, and study the FAMILY where possible — a parent or sibling with subclinical slowing frequently makes the diagnosis faster than a gene panel",
    "Ask for the family history in DETAIL: high arches, hammer toes, difficulty with sports at school, or a relative who 'always had weak ankles' — the phenotype is often present and unrecognised across generations",
    "{flavour}",
    "Genetic testing with counselling; exclude the acquired demyelinating neuropathies (CIDP) first, because those are treatable and the confusion goes in both directions",
  ],
  monitoring: [
    "{level}",
    "Avoid the neurotoxic drugs — vincristine in particular can be catastrophic in hereditary neuropathy, and the drug allergy field is the place to record it",
    "Orthotics, physiotherapy and foot care preserve walking; podiatry early rather than after ulceration",
  ],
  urgency: "routine",
  referral: "Neurology with clinical genetics; orthotics and physiotherapy from the outset.",
};

// A MASS COMPRESSING ONE NERVE AT ONE PLACE — congenital or developmental rather than acquired. The
// unifying claim is that imaging finds it and removing it fixes it, which is not true of most neuropathy.
const COMPRESSIVE_MASS = {
  confirmatory: [
    "ULTRASOUND OR MRI OF THE SPECIFIC SITE — this is the one situation in focal neuropathy where imaging changes management directly, because a cyst or band is removable",
    "{flavour}",
    "Nerve conduction studies to confirm the level and grade severity, which is what decides whether to operate or observe",
    "Examine for a palpable swelling and reproduce the symptoms with local pressure",
  ],
  monitoring: [
    "{level}",
    "WASTING OR PROGRESSIVE WEAKNESS is the trigger for surgery; waiting past that point costs function permanently",
    "Recurrence after excision is possible — re-examine rather than assuming a one-off cure",
  ],
  urgency: "routine",
  referral: "Hand, orthopaedic or neurosurgery depending on site; neurophysiology first.",
};

export default {
  // ---- HEREDITARY ATAXIA ----
  ...family("hereditary-ataxia", HEREDITARY_ATAXIA, {
    "Friedreich's ataxia (frataxin, GAA repeat)": {
      slots: { flavour: "GAA repeat expansion in FXN is the specific test, and it is worth sending early because the systemic screening starts as soon as it returns",
               level: "ECHOCARDIOGRAM AND ECG, and screen for DIABETES — the CARDIOMYOPATHY is what shortens life here, not the ataxia, and it is often silent" },
      confirmatoryExtra: ["Look for the combination that names it clinically: areflexia WITH extensor plantars, pes cavus and scoliosis"],
    },
    "Spinocerebellar ataxia (hereditary)": {
      slots: { flavour: "a repeat-expansion panel covering the common dominant SCAs; the phenotype rarely names the subtype reliably",
               level: "track swallow and speech; aspiration is the commonest serious complication" },
      bySite: {
        cerebellum_pancerebellar: { flavour: "a whole-cerebellum syndrome — trunk, limbs and speech together — which is the expected shape of a genetic ataxia and supports the diagnosis" },
        cerebellum_hemisphere: { flavour: "ASYMMETRY IS AGAINST A GENETIC ATAXIA. These diseases are symmetric, so a lateralised cerebellar syndrome should prompt a search for a structural cause before the panel is sent" },
      },
    },
    "Other hereditary spinocerebellar ataxia": {
      slots: { flavour: "where the common panel is negative, next-generation sequencing — and accept that a proportion remain genetically unsolved, which is worth saying to the family",
               level: "track function rather than chasing a gene indefinitely; management does not wait on the result" },
    },
    "Episodic ataxia type 2": {
      slots: { flavour: "CACNA1A testing — and note this one is TREATABLE: acetazolamide often abolishes the attacks, which makes it the diagnosis worth not missing in this family",
               level: "keep an attack diary with triggers; interictal nystagmus is often present between attacks and supports the diagnosis" },
      urgency: "urgent",
    },
    "Ataxia with oculomotor apraxia / ataxia-telangiectasia": {
      slots: { flavour: "ALPHA-FETOPROTEIN and immunoglobulins — a raised AFP points strongly here and is a cheap, fast test that often precedes the genetics",
               level: "MALIGNANCY SURVEILLANCE and infection risk dominate in ataxia-telangiectasia, and RADIATION EXPOSURE SHOULD BE MINIMISED — flag it prominently, because a routine CT carries real harm" },
      referral: "Neurology with clinical genetics; immunology and oncology surveillance in ataxia-telangiectasia.",
    },
  }),

  // ---- HEREDITARY NEUROPATHY ----
  ...family("hereditary-neuropathy", HEREDITARY_NEUROPATHY, {
    "Charcot-Marie-Tooth (hereditary motor and sensory neuropathy)": {
      slots: { flavour: "PMP22 duplication first — it is much the commonest — then a wider panel. Conduction velocities separate the demyelinating from the axonal forms and direct the testing",
               level: "watch for foot deformity, and ask about hand function, which patients under-report; scoliosis and hip dysplasia need looking for in children" },
    },
    "Hereditary neuropathy with liability to pressure palsies": {
      slots: { flavour: "PMP22 DELETION — the mirror image of the CMT duplication, and the test is specific",
               level: "THE ADVICE IS THE TREATMENT: avoid leaning on elbows, crossing legs, prolonged squatting and tight straps. Recurrent painless palsies at classic compression sites is the story" },
      bySite: {
        nerve_long_thoracic: { level: "ask about RUCKSACKS and shoulder straps — winging after carrying a heavy pack is the characteristic trigger here, and the advice is to change the load rather than the shoulder" },
        nerve_radial_spiral_groove: { level: "ask about SLEEPING ON THE ARM or an arm over a chair back — a Saturday-night palsy from a compression far too brief to injure a normal nerve is the giveaway" },
        nerve_peroneal_common: { level: "ask about LEG CROSSING, squatting and recent weight loss — a foot drop after habitual leg crossing points to the diagnosis, and padding the fibular neck prevents the next one" },
      },
      monitoringExtra: ["Warn about SURGERY AND ANAESTHESIA — positioning on the table causes palsies in these patients, so the anaesthetist needs to know in advance"],
    },
    "Hereditary neuralgic amyotrophy": {
      slots: { flavour: "SEPT9 testing where available, and take a family history of RECURRENT painful brachial plexus attacks — the recurrence and the family history are what separate it from the sporadic form",
               level: "attacks recur and accumulate deficit; document each one, and consider prophylaxis discussion with a specialist" },
      confirmatoryExtra: ["Look for the subtle dysmorphic features described with it — hypotelorism and skin folds — which support the hereditary form"],
    },
  }),

  // ---- A REMOVABLE MASS ON ONE NERVE ----
  ...family("compressive-mass", COMPRESSIVE_MASS, {
    "Ganglion cyst at the spinoglenoid or suprascapular notch": {
      slots: { flavour: "MRI shoulder — and look for the LABRAL TEAR that feeds the cyst, because decompressing the cyst without addressing the tear invites recurrence",
               level: "isolated infraspinatus wasting with weak external rotation is the spinoglenoid picture; supraspinatus involvement too means the notch above it" },
    },
    "Ganglion cyst in Guyon's canal": {
      slots: { flavour: "ultrasound or MRI of the wrist; a ganglion here is the commonest cause of a purely motor ulnar palsy at the wrist",
               level: "intrinsic wasting with SPARED dorsal sensation and spared FDP — the sparing is what localises it to the canal rather than the elbow" },
    },
    "Mass lesion or fibrous band (ligament of Struthers)": {
      slots: { flavour: "look for a SUPRACONDYLAR SPUR on plain radiograph — a bony spur with a fibrous band running to the medial epicondyle is a developmental variant and is easily seen if looked for",
               level: "median signs with weak pronation and forearm involvement, which places the lesion well proximal to the carpal tunnel" },
    },
  }),

  // ---- SINGLETONS ----
  "Cervical rib / thoracic outlet syndrome": dz("Cervical rib / thoracic outlet syndrome", {
    slots: { level: "the hand" },
    bySite: {
      root_t1: { level: "T1 sensory loss over the medial arm, with thenar and interosseous wasting" },
      plexus_lower_trunk: { level: "the whole lower-trunk distribution — C8 and T1 together" },
      plexus_medial_cord: { level: "the medial cord territory, sparing the radial-innervated muscles" },
    },
    confirmatory: [
      "PLAIN RADIOGRAPH OF THE THORACIC OUTLET for a cervical rib or elongated C7 transverse process — a cheap test that is frequently not done, and a FIBROUS BAND causes the same syndrome with a normal film",
      "MRI or CT of the brachial plexus with the arm in provocative position, to show the band and exclude a Pancoast tumour — which is the diagnosis that must not be missed here",
      "NERVE CONDUCTION STUDIES: the true neurogenic form shows a characteristic pattern with a reduced medial antebrachial cutaneous sensory response, which is the objective evidence",
      "Examine {level}, and look for the GILLIATT-SUMNER HAND — thenar wasting out of proportion to hypothenar, which is close to specific",
    ],
    monitoring: [
      "SEPARATE THE TRUE NEUROGENIC FORM from the disputed non-specific one: the first has objective wasting and neurophysiological confirmation and benefits from surgery; the second does not, and operating on it causes harm",
      "Check for VASCULAR involvement — subclavian compression with a bruit, or distal emboli — which changes the urgency entirely",
      "Physiotherapy for posture and shoulder-girdle strength first in mild cases; surgery for progressive wasting",
    ],
    urgency: "urgent",
    referral: "Neurology and thoracic or vascular surgery; urgent imaging to exclude a Pancoast tumour.",
  }),

  "Cervical rib or brachial plexus lower-trunk lesion": dz("Cervical rib or brachial plexus lower-trunk lesion", {
    confirmatory: [
      "THE NAME HEDGES between a bony anomaly and any lower-trunk lesion, and the first job is to resolve it: a radiograph for the rib, then MRI of the plexus and lung APEX for everything else",
      "EXCLUDE A PANCOAST TUMOUR before anything else — a Horner's sign with lower-trunk signs is apical lung cancer until imaging says otherwise, and that is the whole reason this combination matters",
      "Nerve conduction studies to confirm the lower trunk rather than a C8/T1 root or an ulnar lesion",
    ],
    monitoring: [
      "SAFETY NET: a new Horner's with hand wasting and arm pain in a smoker is an urgent oncology pathway, not a musculoskeletal referral",
      "Once malignancy is excluded, manage as thoracic outlet syndrome",
    ],
    urgency: "urgent",
    referral: "Urgent chest imaging; then neurology with thoracic surgery.",
  }),

  "Huntington's disease": dz("Huntington's disease", {
    confirmatory: [
      "GENETIC COUNSELLING BEFORE THE TEST, always — a predictive or diagnostic HTT result has consequences for insurance, employment, siblings and children, and the counselling is not a formality",
      "CAG repeat testing in HTT once counselled; MRI shows caudate atrophy but is not the diagnostic test",
      "Exclude the treatable and the mimicking causes of chorea: thyroid, lupus and antiphospholipid antibodies, acanthocytes, caeruloplasmin, and a drug review",
      "Take a THREE-GENERATION family history, and be alert to a family history that is hidden rather than absent — the diagnosis is often concealed within families",
    ],
    monitoring: [
      "PSYCHIATRIC RISK is the most urgent part: depression and suicide risk are substantially raised, and around diagnosis is a period of particular danger. Ask directly and repeatedly",
      "Chorea is rarely the disabling feature — cognition, behaviour and swallow are. Address them explicitly rather than treating the movements",
      "Coordinate genetic counselling for at-risk relatives, and discuss reproductive options early",
    ],
    urgency: "urgent",
    referral: "Neurology with clinical genetics and psychiatry; specialist Huntington's service where one exists.",
  }),

  "Spinal muscular atrophy": dz("Spinal muscular atrophy", {
    confirmatory: [
      "SMN1 DELETION TESTING, with SMN2 COPY NUMBER — the copy number predicts severity and, importantly, informs treatment decisions",
      "EMG showing pure motor axonal loss with NORMAL SENSORY studies; sensory involvement moves the diagnosis elsewhere",
      "Creatine kinase and a myopathy screen where the picture is not clear-cut",
      "Take a family history and arrange carrier testing for parents and relatives",
    ],
    monitoring: [
      "THIS IS NOW A TREATABLE DISEASE and the treatments are TIME-CRITICAL — the earlier they start the more motor neurones survive, so referral to a specialist neuromuscular service is urgent rather than routine",
      "RESPIRATORY function and swallow drive the outcome: monitor vital capacity, and involve respiratory and dietetics early",
      "Scoliosis and hip surveillance in children; orthopaedic input before deformity is fixed",
    ],
    urgency: "urgent",
    referral: "Specialist neuromuscular service urgently; clinical genetics for the family.",
  }),

  "Kennedy's disease (SBMA)": dz("Kennedy's disease (SBMA)", {
    confirmatory: [
      "ANDROGEN RECEPTOR CAG REPEAT TESTING — and think of it in any man with slowly progressive bulbar and proximal weakness, because it is routinely mistaken for MND for years",
      "LOOK FOR THE FEATURES THAT SEPARATE IT FROM MND: gynaecomastia, tongue fasciculation with perioral twitching, sensory involvement on neurophysiology, and a raised creatine kinase",
      "It is X-LINKED — the family history runs through the maternal line and may be absent in the father, which is where the history is often lost",
      "Check androgen levels, glucose and lipids: endocrine involvement is part of the disease",
    ],
    monitoring: [
      "THE PROGNOSIS IS FAR BETTER THAN MND and life expectancy is near-normal — getting the diagnosis right transforms what the patient is told, which is the single most important thing here",
      "Swallow surveillance; aspiration is the main serious risk over time",
      "Genetic counselling for daughters, who are carriers, and for their sons",
    ],
    urgency: "urgent",
    referral: "Neurology with clinical genetics; endocrinology for the metabolic features.",
  }),

  "Muscular dystrophy (Duchenne, Becker, limb-girdle, myotonic)": dz("Muscular dystrophy (Duchenne, Becker, limb-girdle, myotonic)", {
    confirmatory: [
      "CREATINE KINASE FIRST — a very high CK in a boy with proximal weakness is dystrophinopathy until proven otherwise, and the test is available everywhere",
      "GENETIC TESTING targeted by phenotype: dystrophin deletion/duplication for Duchenne and Becker, DMPK repeat for myotonic dystrophy, and a limb-girdle panel otherwise",
      "SHAKE THE PATIENT'S HAND AND ASK THEM TO GRIP AND RELEASE: myotonia is diagnostic and takes seconds, and myotonic dystrophy is the one most often missed",
      "Muscle MRI or biopsy where genetics is unrevealing",
    ],
    monitoring: [
      "CARDIAC SURVEILLANCE IS NOT OPTIONAL — ECG and echocardiogram at diagnosis and at intervals. Cardiomyopathy and CONDUCTION BLOCK cause sudden death in myotonic dystrophy, and the heart disease does not track the muscle weakness",
      "RESPIRATORY function, and warn about ANAESTHETIC RISK — these patients are dangerously sensitive to sedation and neuromuscular blockade, and it belongs on an alert card",
      "Myotonic dystrophy is multisystem: cataracts, diabetes, hypersomnolence and infertility all need screening",
    ],
    urgency: "urgent",
    referral: "Specialist neuromuscular service with cardiology and respiratory; clinical genetics for the family.",
  }),

  "Mitochondrial or metabolic myopathy": dz("Mitochondrial or metabolic myopathy", {
    confirmatory: [
      "LACTATE at rest and after exercise, creatine kinase, and an acylcarnitine and organic acid profile — the metabolic myopathies are separated biochemically before they are separated genetically",
      "THE HISTORY IS THE TEST: exercise intolerance with CRAMPS AND MYOGLOBINURIA points to a glycogen or fatty-acid disorder, and a SECOND-WIND phenomenon points specifically at McArdle disease",
      "Mitochondrial genome and nuclear gene testing; muscle biopsy with respiratory chain enzymology where genetics is negative",
      "Look for the multisystem clues: hearing loss, diabetes, ptosis with ophthalmoplegia, short stature and a maternal family history",
    ],
    monitoring: [
      "SAFETY NET: warn about RHABDOMYOLYSIS with fasting, fever or prolonged exercise, and give clear sick-day rules — this is the acute danger and it is preventable",
      "Screen for the systemic involvement: cardiac conduction, diabetes, hearing and vision",
      "MATERNAL INHERITANCE for mitochondrial DNA disorders means specific counselling, and reproductive options differ from nuclear disease",
    ],
    urgency: "urgent",
    referral: "Specialist neuromuscular or metabolic service; cardiology and endocrinology as indicated.",
  }),

  "Congenital myasthenic syndrome": dz("Congenital myasthenic syndrome", {
    slots: { flavour: "identify the subtype before treating" },
    bySite: {
      motor_unit_nmj_presynaptic: { flavour: "the PRE-synaptic forms include choline acetyltransferase deficiency, which causes EPISODIC APNOEA precipitated by fever or illness — families need an emergency plan, and it is the feature that kills" },
      motor_unit_nmj_postsynaptic: { flavour: "the POST-synaptic forms split into slow-channel and fast-channel, and this is where treatment can go wrong: SLOW-CHANNEL syndromes are made WORSE by cholinesterase inhibitors" },
    },
    confirmatory: [
      "ANTIBODY-NEGATIVE fatigable weakness from infancy or childhood, often with a family history — the negative serology is the clue, not a reason to doubt the diagnosis",
      "Repetitive nerve stimulation and single-fibre EMG, then a congenital myasthenic gene panel",
      "IDENTIFYING THE SUBTYPE MATTERS THERAPEUTICALLY: some respond to cholinesterase inhibitors and others are made WORSE by them, so treatment should not be empirical",
      "{flavour}",
      "Take a detailed birth and early-development history — feeding difficulty, delayed motor milestones and ptosis in infancy are often present and forgotten",
    ],
    monitoring: [
      "Respiratory function and swallow, particularly during intercurrent illness, when these children decompensate",
      "Give the family a written diagnosis and drug guidance — the wrong drug in a crisis is the avoidable harm",
      "Genetic counselling; most are autosomal recessive",
    ],
    urgency: "urgent",
    referral: "Specialist neuromuscular service with clinical genetics.",
  }),

  "Hereditary spastic paraplegia": dz("Hereditary spastic paraplegia", {
    confirmatory: [
      "EXCLUDE THE TREATABLE MYELOPATHIES FIRST — MRI whole spine and brain, B12, copper, HTLV-1 and syphilis. A hereditary label on an untreated compressive or metabolic myelopathy is the error to avoid",
      "Genetic panel testing with counselling; SPAST and other common genes first, and expect a proportion to remain unsolved",
      "SEPARATE PURE FROM COMPLICATED FORMS: pure is spasticity with little else, complicated adds ataxia, neuropathy, cognitive change or retinal findings — and that distinction directs the genetics",
      "Take a family history across three generations, examining relatives where possible; mild cases are frequently unrecognised",
    ],
    monitoring: [
      "SPASTICITY AND BLADDER are what limit the patient day to day, and both are treatable — asking about them directly is what improves function",
      "Physiotherapy and orthotics to preserve gait; falls prevention",
      "Genetic counselling for the family, with the inheritance pattern established before predictive testing is offered",
    ],
    urgency: "routine",
    referral: "Neurology with clinical genetics; continence and physiotherapy services.",
  }),

  "Normal pressure hydrocephalus": dz("Normal pressure hydrocephalus", {
    slots: { flavour: "the cognitive profile here is subcortical rather than cortical" },
    bySite: {
      cortex_dlpfc: { flavour: "the profile is EXECUTIVE AND ATTENTIONAL — slow, inattentive, poor set-shifting — rather than amnestic, and that pattern is what distinguishes it from Alzheimer's disease at the bedside" },
      cortex_medial_pfc: { flavour: "APATHY dominates here and is routinely mistaken for depression; the distinction is that the patient is not distressed by their inactivity, and antidepressants do not touch it" },
    },
    confirmatory: [
      "THE TRIAD IS UNRELIABLE and gait comes FIRST — a magnetic, wide-based gait preceding the cognitive and urinary features is what supports the diagnosis; leading with dementia argues against it",
      "MRI showing ventriculomegaly DISPROPORTIONATE to sulcal atrophy, with the DESH pattern and a callosal angle below normal — the ratio matters more than the ventricular size",
      "A LARGE-VOLUME LUMBAR PUNCTURE (tap test) with FORMAL GAIT TIMING BEFORE AND AFTER — the improvement is the evidence that a shunt will help, and untimed impressions are not adequate",
      "Exclude the alternatives that share the picture: vascular cognitive impairment, Parkinson's disease and cervical myelopathy",
      "{flavour}",
    ],
    monitoring: [
      "SELECTION IS EVERYTHING: shunting an unselected patient carries real surgical risk with little benefit, so the tap test result should genuinely drive the decision",
      "THE PRESSURE IS NORMAL — do not prompt for papilloedema here; it is not part of the syndrome and looking for it misleads",
      "After shunting, watch for over-drainage and subdural collections, and re-time the gait to confirm benefit objectively",
    ],
    urgency: "urgent",
    referral: "Neurology and neurosurgery; a specialist hydrocephalus service where available.",
  }),

  "CADASIL": dz("CADASIL", {
    confirmatory: [
      "NOTCH3 GENETIC TESTING with counselling — and think of it in a younger patient with strokes or vascular cognitive change and NO conventional risk factors",
      "MRI: confluent white-matter change involving the ANTERIOR TEMPORAL POLES and external capsules is close to characteristic, and it is what distinguishes it from ordinary small-vessel disease",
      "Ask specifically about MIGRAINE WITH AURA, which often precedes the strokes by decades, and about mood or psychiatric history",
      "Family history across three generations, including relatives labelled with early dementia or unexplained stroke",
    ],
    monitoring: [
      "Antiplatelet therapy is used but ANTICOAGULATION IS AVOIDED where possible: intracerebral haemorrhage risk is raised in this arteriopathy",
      "Manage conventional vascular risk factors aggressively — they are additive even though they are not the cause",
      "Genetic counselling for relatives, and support for the cognitive and psychiatric burden, which is what families find hardest",
    ],
    urgency: "urgent",
    referral: "Neurology with clinical genetics; stroke service.",
  }),

  "Fabry disease": dz("Fabry disease", {
    slots: { flavour: "the imaging clue differs by where you are looking" },
    bySite: {
      thalamus_pulvinar: { flavour: "the PULVINAR SIGN — symmetrical T1 HIGH signal in the pulvinar — is close to specific for Fabry and is easily overlooked unless it is being looked for" },
      subcortex_thalamus: { flavour: "posterior-circulation small-vessel strokes in a YOUNG patient with no conventional risk factors; the thalamus and brainstem are affected out of proportion" },
    },
    confirmatory: [
      "ALPHA-GALACTOSIDASE A ACTIVITY in men, and GLA GENETIC TESTING in women — enzyme activity can be normal in female carriers, so testing the wrong way misses half the patients",
      "Ask about and examine for the systemic features: ANGIOKERATOMA, hypohidrosis, corneal verticillata on slit lamp, and the burning ACROPARAESTHESIA that often started in childhood",
      "Renal function with proteinuria, ECG and echocardiogram — the kidney and heart are what determine prognosis",
      "{flavour}",
    ],
    monitoring: [
      "THIS IS TREATABLE with enzyme replacement or chaperone therapy, and earlier treatment preserves organ function — which is the reason to test rather than to speculate",
      "It is X-LINKED and pedigree screening reliably finds affected relatives; cascade testing is high-yield",
      "Coordinate cardiology, nephrology and neurology surveillance rather than treating one organ",
    ],
    urgency: "urgent",
    referral: "Specialist metabolic service with cardiology and nephrology; clinical genetics for the family.",
  }),

  "Decompensated congenital fourth nerve palsy": dz("Decompensated congenital fourth nerve palsy", {
    confirmatory: [
      "LOOK AT OLD PHOTOGRAPHS — a long-standing HEAD TILT in childhood pictures is the single most useful piece of evidence, and it is free",
      "MEASURE THE VERTICAL FUSION RANGE: a large range indicates a long-standing rather than an acquired palsy, which is what makes this a decompensation rather than a new lesion",
      "Orthoptic assessment with the Bielschowsky head-tilt test, and full ocular motility measurement",
      "IMAGING IS NOT ROUTINELY NEEDED once the palsy is shown to be congenital — but it IS needed if there is pain, any other neurological sign, or the features are atypical",
    ],
    monitoring: [
      "Facial asymmetry from lifelong head tilt supports the congenital origin and is worth pointing out to the patient, who has usually never noticed",
      "Prisms or squint surgery restore single vision; refer rather than observing indefinitely",
      "Decompensation is often precipitated by fatigue or illness and may partially settle",
    ],
    urgency: "routine",
    referral: "Orthoptics and ophthalmology; neurology only if atypical.",
  }),

  "Vertebrobasilar dolichoectasia": dz("Vertebrobasilar dolichoectasia", {
    confirmatory: [
      "MRI WITH MR ANGIOGRAPHY — an elongated, dilated, tortuous basilar artery compressing the brainstem or a cranial nerve at its root entry zone",
      "Where the presentation is hemifacial spasm or trigeminal neuralgia, request dedicated THIN-SLICE sequences through the root entry zone; standard slices miss the contact",
      "Assess vascular risk factors and screen for connective tissue disease in younger patients",
      "Document the cranial nerve deficits carefully — they progress slowly and the baseline is what later comparison depends on",
    ],
    monitoring: [
      "SAFETY NET: the risks are ISCHAEMIC STROKE from perforator occlusion and, less often, rupture — this is not a benign anatomical variant to be filed away",
      "Antiplatelet and risk-factor management; anticoagulation needs individual consideration given haemorrhage risk",
      "Microvascular decompression is an option for the compressive syndromes — refer rather than treating pain indefinitely",
    ],
    urgency: "urgent",
    referral: "Neurology with neurosurgery; stroke service for secondary prevention.",
  }),

  "Bilateral perisylvian injury (Worster-Drought / cerebral palsy)": dz("Bilateral perisylvian injury (Worster-Drought / cerebral palsy)", {
    confirmatory: [
      "MRI brain — bilateral perisylvian polymicrogyria or established injury; the imaging is diagnostic and also dates the injury to a developmental period",
      "The picture is a SUPRABULBAR palsy: drooling, swallowing and speech difficulty with a brisk jaw jerk, in a child whose limb function may be relatively preserved",
      "Formal swallow and speech assessment; the functional deficit is what needs measuring, not the imaging",
      "Consider genetic testing for the polymicrogyria syndromes where there are other malformations or a family history",
    ],
    monitoring: [
      "ASPIRATION is the main risk; videofluoroscopy and dietetic input rather than clinical impression",
      "Drooling is socially disabling and treatable — address it explicitly, because families rarely raise it",
      "Epilepsy is common in perisylvian malformations; ask about seizures at each review",
    ],
    urgency: "routine",
    referral: "Paediatric neurology with speech and language therapy and dietetics.",
  }),

  "Prader-Willi syndrome": dz("Prader-Willi syndrome", {
    confirmatory: [
      "METHYLATION TESTING of the 15q11-q13 region is the single test that confirms or excludes it regardless of mechanism, and it should be the first-line request",
      "The history is characteristic and two-phase: NEONATAL HYPOTONIA AND POOR FEEDING, then hyperphagia and obesity in childhood — the switch is the diagnostic story",
      "Full endocrine assessment: growth hormone, thyroid, adrenal and pubertal axes",
      "Sleep study for obstructive and central sleep apnoea before growth hormone is started",
    ],
    monitoring: [
      "SAFETY NET: hyperphagia is relentless and life-threatening. Environmental food security — locked access — is the intervention that works, and families need explicit support rather than dietary advice",
      "Growth hormone improves body composition and height but requires the sleep study first",
      "Monitor for scoliosis, diabetes and the psychiatric features that emerge in adolescence",
    ],
    urgency: "routine",
    referral: "Clinical genetics with paediatric endocrinology; specialist multidisciplinary service.",
  }),

  "Hypothalamic hamartoma": dz("Hypothalamic hamartoma", {
    confirmatory: [
      "MRI WITH DEDICATED HYPOTHALAMIC VIEWS — a non-enhancing, isointense mass at the tuber cinereum that does NOT grow, and its stability over time is part of the diagnosis",
      "GELASTIC SEIZURES — brief, stereotyped mirthless laughing — are close to pathognomonic, and are routinely mistaken for behaviour rather than epilepsy for years",
      "Full pituitary axis assessment: CENTRAL PRECOCIOUS PUBERTY is the other classic presentation and may be the only one",
      "EEG, accepting that the scalp EEG is often unhelpful because the generator is deep",
    ],
    monitoring: [
      "Seizures are frequently drug-resistant; refer early to an epilepsy surgery service rather than cycling through medications for years",
      "Precocious puberty is treatable with GnRH analogues and should not wait on the seizure management",
      "Watch for cognitive and behavioural deterioration, which is what makes early intervention worthwhile",
    ],
    urgency: "urgent",
    referral: "Paediatric neurology and endocrinology; specialist epilepsy surgery service.",
  }),

  "Kallmann syndrome": dz("Kallmann syndrome", {
    confirmatory: [
      "THE COMBINATION IS THE DIAGNOSIS: hypogonadotropic hypogonadism WITH ANOSMIA — so formally test smell in any patient presenting with delayed or absent puberty, which is the step usually skipped",
      "LH, FSH, testosterone or oestradiol, and MRI showing absent or hypoplastic OLFACTORY BULBS",
      "Genetic testing (ANOS1, FGFR1 and others); inheritance varies, which matters for counselling",
      "Renal ultrasound — unilateral renal agenesis accompanies the X-linked form and is silent otherwise",
    ],
    monitoring: [
      "Hormone replacement induces puberty and maintains bone density; FERTILITY IS OFTEN ACHIEVABLE with gonadotropin treatment, and saying so early matters a great deal to patients",
      "Bone density monitoring; delayed treatment costs peak bone mass permanently",
      "Psychological support around delayed puberty is part of the care, not an optional extra",
    ],
    urgency: "routine",
    referral: "Endocrinology with clinical genetics; fertility services when relevant.",
  }),

  "Developmental prosopagnosia": dz("Developmental prosopagnosia", {
    confirmatory: [
      "FORMAL FACE-RECOGNITION TESTING rather than self-report — validated tests separate genuine impairment from ordinary variation, and self-assessment is unreliable in both directions",
      "IT IS DEVELOPMENTAL: lifelong, with no injury and normal structural imaging. A NEW difficulty recognising faces is an acquired lesion and needs imaging urgently",
      "Take a family history; it runs in families and relatives are often unaware they share it",
      "Screen for autistic traits, which co-occur, and confirm that visual acuity and general object recognition are intact",
    ],
    monitoring: [
      "COMPENSATORY STRATEGIES are the management — voice, gait, hair, context — and naming the condition is itself therapeutic for people who have often been thought rude or aloof",
      "Reassure that it does not progress",
      "Consider the social and occupational impact explicitly; it is commonly underestimated",
    ],
    urgency: "routine",
    referral: "Neuropsychology; neurology only if acquired.",
  }),

  "Primary / genetic dystonia (e.g. DYT1)": dz("Primary / genetic dystonia (e.g. DYT1)", {
    confirmatory: [
      "TRIAL LEVODOPA IN EVERY YOUNG-ONSET DYSTONIA before anything else — dopa-responsive dystonia is transformed by tiny doses, and missing it costs a patient decades of disability. This is the single most important step here",
      "Genetic testing with counselling: TOR1A (DYT1) for young-onset limb dystonia, and a wider panel otherwise",
      "EXCLUDE WILSON'S DISEASE in anyone under fifty — caeruloplasmin, copper studies and slit-lamp for Kayser-Fleischer rings; it is treatable and progressive if missed",
      "MRI brain to exclude a structural or heredodegenerative cause",
    ],
    monitoring: [
      "Botulinum toxin for focal dystonia, and deep brain stimulation for generalised disease — DYT1 dystonia responds particularly well to DBS, so refer rather than escalating oral medication indefinitely",
      "Physiotherapy and sensory tricks; ask about the geste antagoniste, which patients often discover themselves",
      "Genetic counselling, noting the reduced penetrance of DYT1 — many carriers never develop symptoms, which changes the conversation with relatives",
    ],
    urgency: "urgent",
    referral: "Movement disorders neurology with clinical genetics; functional neurosurgery for DBS assessment.",
  }),

  "Fibrous dysplasia or bony overgrowth": dz("Fibrous dysplasia or bony overgrowth", {
    confirmatory: [
      "CT WITH BONE WINDOWS is the test — the ground-glass expansion of fibrous dysplasia is characteristic on CT and poorly shown on MRI, so requesting the wrong modality delays the diagnosis",
      "MRI in addition to assess the optic nerve itself and to exclude an alternative compressive lesion",
      "Serial FORMAL PERIMETRY, acuity and colour vision — the decision to operate rests on documented progression rather than on the appearance of the canal",
      "Check calcium, phosphate and alkaline phosphatase, and consider McCune-Albright syndrome where there are skin or endocrine features",
    ],
    monitoring: [
      "PROPHYLACTIC OPTIC CANAL DECOMPRESSION IS NOT RECOMMENDED for an asymptomatic narrowed canal — surveillance is, and operating early can cause the loss it aims to prevent",
      "Act on documented visual deterioration; that is the trigger",
      "Growth usually slows after skeletal maturity, so the surveillance interval can lengthen with age",
    ],
    urgency: "routine",
    referral: "Neurosurgery or skull-base surgery with neuro-ophthalmology; endocrinology if McCune-Albright.",
  }),

  "Epidermoid cyst": dz("Epidermoid cyst", {
    confirmatory: [
      "MRI WITH DIFFUSION-WEIGHTED IMAGING — an epidermoid RESTRICTS diffusion and an arachnoid cyst does not, and that single sequence settles a distinction that other sequences cannot",
      "It insinuates around structures rather than displacing them, which is characteristic and visible on FLAIR",
      "Document cranial nerve function formally, particularly hearing, facial power and the corneal reflex",
      "Audiometry where the eighth nerve is involved",
    ],
    monitoring: [
      "SAFETY NET: warn about ASEPTIC (chemical) MENINGITIS from cyst contents leaking — recurrent sterile meningitis with a CPA mass is this until proven otherwise",
      "Growth is slow; serial imaging is reasonable where symptoms are mild",
      "Surgery is often subtotal because the capsule adheres to nerves and vessels, and recurrence over years is expected — say so before the operation rather than after",
    ],
    urgency: "routine",
    referral: "Neurosurgery with ENT; neuro-otology for hearing.",
  }),

  "Optic disc drusen / congenitally crowded disc": dz("Optic disc drusen / congenitally crowded disc", {
    confirmatory: [
      "THE WHOLE POINT IS TO SEPARATE THIS FROM TRUE PAPILLOEDEMA, and OCT with ULTRASOUND is what does it — drusen are hyperreflective and calcified, and ultrasound shows them regardless of media",
      "Autofluorescence imaging shows superficial drusen without dye",
      "Formal perimetry: drusen cause slowly progressive field loss, typically an inferonasal step, which is quite different from the enlarged blind spot of raised pressure",
      "IF THERE IS ANY DOUBT, INVESTIGATE FOR RAISED PRESSURE — headache, transient visual obscurations or a sixth-nerve palsy override a reassuring disc appearance",
    ],
    monitoring: [
      "SAFETY NET: this is one of the commonest causes of unnecessary neuroimaging AND of missed papilloedema, in both directions. Document which one it is clearly enough that the next clinician does not repeat the work",
      "Annual perimetry to track slow field loss; there is no treatment but the documentation matters",
      "A crowded disc is a risk factor for anterior ischaemic optic neuropathy — worth noting in the record",
    ],
    urgency: "routine",
    referral: "Ophthalmology; neurology only if raised pressure remains a possibility.",
  }),


  // ---- ROUND 9 SINGLETONS ----

  "Neurofibromatosis type 2": dz("Neurofibromatosis type 2", {
    confirmatory: [
      "MRI OF THE INTERNAL AUDITORY MEATI WITH CONTRAST AND THIN SLICES — BILATERAL vestibular schwannomas are diagnostic, and a standard brain study does not resolve a small intracanalicular tumour",
      "Image the WHOLE NEURAXIS: meningiomas and spinal ependymomas travel with it, and finding them changes the surveillance plan and sometimes the order of operations",
      "Audiometry and vestibular testing as a baseline — hearing preservation is the central goal of management, and decisions are made against a documented starting point",
      "Examine {level}, and examine the SKIN and EYES: cataracts and skin schwannomas support it, and NF2 has few of the café-au-lait macules of NF1, which is a common source of confusion",
    ],
    monitoring: [
      "SAFETY NET: the decision is rarely to remove everything — it is to preserve HEARING and function for as long as possible, so watchful waiting with serial imaging is a legitimate active plan and often the right one",
      "Track {level} and hearing serially; growth rate rather than size drives intervention",
      "GENETIC counselling and screening of first-degree relatives is part of the diagnosis, not an add-on — and a substantial proportion of cases are new mutations, which changes what families are told",
      "Plan for the eventual loss of hearing: early discussion of communication strategies and auditory implantation is kinder than raising it once deafness is established",
    ],
    urgency: "urgent",
    referral: "A specialist NF2 service where one exists — skull-base neurosurgery, ENT, audiology and genetics together",
    bySite: {
      skull_base_iam: { level: "hearing, speech discrimination, and facial movement",
        flavour: "an intracanalicular tumour is small and hearing-threatening — this is the stage where hearing preservation surgery or radiosurgery is still possible, so finding it early matters" },
      skull_base_cpa: { level: "hearing, facial sensation, facial movement and coordination",
        flavour: "extension into the cerebellopontine angle means the tumour has outgrown the canal, and the fifth nerve and brainstem are now in question as well as hearing" },
    },
  }),

  "Obstructive hydrocephalus / shunt failure": dz("Obstructive hydrocephalus / shunt failure", {
    confirmatory: [
      "URGENT CT AND COMPARE IT WITH THE PATIENT'S OWN PREVIOUS SCANS — ventricular size is meaningless in isolation here, and the comparison is the investigation",
      "IN A SHUNTED PATIENT, ASSUME SHUNT FAILURE UNTIL PROVEN OTHERWISE. Take the parents' or carer's account seriously: they recognise the pattern earlier than any scan, and 'this is how it was last time' is high-quality clinical information",
      "SHUNT SERIES radiographs to look for disconnection or migration, and neurosurgical assessment of the valve and reservoir",
      "Examine {level}, plus conscious level, and check the FUNDI for papilloedema",
    ],
    monitoring: [
      "SAFETY NET: shunt failure can deteriorate from headache to coma over HOURS, and slit-ventricle syndrome means the ventricles may barely enlarge despite dangerously raised pressure — so a normal-looking scan does not exclude it",
      "Track {level} and conscious level continuously while the diagnosis is in doubt; escalate to neurosurgery on the trajectory rather than the images",
      "Ask about the classic triad in a shunted patient — headache, vomiting and drowsiness — and treat that combination as failure until the shunt is shown to work",
    ],
    urgency: "emergency",
    referral: "Emergency neurosurgery — a blocked shunt is revised, not observed",
  }),

  "Obstructive hydrocephalus compressing the pretectum": dz("Obstructive hydrocephalus compressing the pretectum", {
    confirmatory: [
      "URGENT imaging with attention to the ventricles AND the aqueduct — dilated lateral and third ventricles with a normal fourth localises the obstruction to the aqueduct",
      "The pretectal signs ARE the monitoring tool: upgaze failure, light-near dissociation and lid retraction appear as pressure rises and resolve as it is relieved — {flavour}",
      "Look for the CAUSE of the obstruction — a pineal or tectal mass, aqueduct stenosis, or a shunt that has stopped working",
      "Examine {level}, and check the fundi; in a child, measure the head circumference and ask about the SETTING-SUN sign",
    ],
    monitoring: [
      "SAFETY NET: NEW OR WORSENING UPGAZE FAILURE IS A PRESSURE SIGN, not an eye problem — it is one of the most useful bedside markers of decompensating hydrocephalus and it is not looked for unless someone has said so",
      "Track {level} and conscious level; diversion of CSF is the treatment and it is urgent",
      "Once the pressure is relieved the eye signs usually improve, so their persistence suggests the obstruction has not been adequately treated",
    ],
    urgency: "emergency",
    referral: "Emergency neurosurgery for CSF diversion",
  }),

  "Sickle cell disease": dz("Sickle cell disease", {
    confirmatory: [
      "FULL BLOOD COUNT, RETICULOCYTES AND HAEMOGLOBIN ELECTROPHORESIS — and in a patient already known to have it, establish the baseline haemoglobin and the recent transfusion history",
      "URGENT vessel imaging: sickle cell causes a large-vessel VASCULOPATHY with stenosis of the distal internal carotid and proximal MCA, which is a moyamoya-like picture rather than simple small-vessel occlusion",
      "MRI with diffusion, and remember that SILENT INFARCTS are common and cumulative — so a first clinical stroke frequently sits on top of years of unrecognised injury",
      "Examine {level}, and look for the precipitant: infection, dehydration, hypoxia, acute chest syndrome or a recent crisis",
    ],
    monitoring: [
      "SAFETY NET: THE TREATMENT OF ACUTE STROKE HERE IS URGENT EXCHANGE TRANSFUSION, which is a haematological intervention rather than a neurological one — involve haematology immediately rather than routing this through the standard stroke pathway alone",
      "Track {level}; and maintain oxygenation, hydration and normothermia, all of which reduce further sickling",
      "TRANSCRANIAL DOPPLER screening identifies children at high risk BEFORE a stroke and is an established preventive programme — a child presenting with stroke should prompt asking whether screening happened",
      "Long-term prevention is transfusion or hydroxycarbamide rather than antiplatelet therapy, which is a genuinely different secondary-prevention pathway from atherosclerotic stroke",
    ],
    urgency: "emergency",
    referral: "Haematology and acute stroke together — exchange transfusion is the treatment",
  }),

  "Sickle cell disease or hyperviscosity": dz("Sickle cell disease or hyperviscosity", {
    confirmatory: [
      "FULL BLOOD COUNT with film, ESR, and haemoglobin electrophoresis; plus paraprotein screen, white cell count and platelets where hyperviscosity is possible",
      "FUNDOSCOPY IS THE INVESTIGATION — dilated tortuous 'sausage-link' veins, scattered haemorrhages and a boxcar appearance are visible signs of hyperviscosity, and they are seen rather than measured",
      "Identify which mechanism: sickling, a paraproteinaemia (myeloma or Waldenström), leukaemia with a very high blast count, or polycythaemia — each has a different urgent treatment",
      "Examine {level}, including acuity and the fields, and ask about the systemic symptoms of hyperviscosity: headache, mucosal bleeding, blurred vision and confusion",
    ],
    monitoring: [
      "SAFETY NET: symptomatic hyperviscosity is a HAEMATOLOGICAL EMERGENCY treated by plasmapheresis, leukapheresis or exchange transfusion — the eye is the presenting organ but the treatment is systemic and urgent",
      "Track {level} and the vision; visual loss from retinal vascular occlusion here can be prevented by treating the viscosity rather than the eye",
      "Avoid transfusing red cells before reducing the viscosity in a hyperviscous patient — it can make things acutely worse, which is counter-intuitive and easily done",
    ],
    urgency: "emergency",
    referral: "Haematology urgently, with ophthalmology",
  }),

  "Azygos (unpaired) ACA supplying both hemispheres": dz("Azygos (unpaired) ACA supplying both hemispheres", {
    confirmatory: [
      "ANGIOGRAPHY (CT or MR) to demonstrate the ANATOMY — a single unpaired anterior cerebral artery supplying both hemispheres, which is why one occlusion produces a BILATERAL deficit",
      "This is an anatomical VARIANT rather than a disease: the workup is the stroke workup, and the variant explains the pattern rather than changing the acute treatment",
      "Examine {level} — bilateral leg weakness with abulia and incontinence, a picture that is repeatedly investigated as a cord lesion because the arms are spared",
      "Note the variant prominently in the record: it carries a higher association with anterior communicating aneurysms, which matters for any future imaging",
    ],
    monitoring: [
      "SAFETY NET: bilateral leg weakness with preserved arms sends most readers to the spine — if the cord MRI is normal, image the BRAIN before anything else",
      "Track {level}; and manage as a stroke, since the variant changes the explanation rather than the pathway",
      "Rehabilitation for the abulia and incontinence matters as much as for the weakness, and is more often overlooked because it is not obviously neurological",
    ],
    urgency: "emergency",
    referral: "Acute stroke pathway",
  }),

  "Pantothenate kinase-associated neurodegeneration (PKAN)": dz("Pantothenate kinase-associated neurodegeneration (PKAN)", {
    confirmatory: [
      "MRI BRAIN LOOKING FOR THE 'EYE OF THE TIGER' SIGN — central hyperintensity within a hypointense globus pallidus on T2. It is close to specific and it is the reason to image rather than to test blindly",
      "GENETIC testing for PANK2, which confirms it; and blood film for acanthocytes, which points instead to the neuroacanthocytosis syndromes",
      "Examine {level}, and look for the associated features: dystonia (particularly oromandibular), pigmentary retinopathy, and pyramidal signs",
      "Exclude the TREATABLE brain-iron and metal disorders that resemble it — Wilson's disease above all, since missing that one is the costly error",
    ],
    monitoring: [
      "SAFETY NET: STATUS DYSTONICUS is the life-threatening complication — unremitting spasms causing rhabdomyolysis, renal failure and exhaustion. It is precipitated by infection, pain or a medication change, and it is what actually kills",
      "Track {level} and the dystonia severity; symptomatic treatment genuinely helps, and deep brain stimulation benefits selected patients, so this is not a diagnosis to make and then abandon",
      "GENETIC counselling for the family, and coordinate the multidisciplinary care — feeding, communication, posture and pain are where quality of life is won or lost",
    ],
    urgency: "urgent",
    referral: "Movement disorder service with genetics; a paediatric neurology service in a child",
  }),

  ...family("hindbrain-craniocervical-malformation", HINDBRAIN_SPINE, {
    "Chiari I malformation": {
      slots: { level: "gait, the lower cranial nerves, and any dissociated sensory loss in the arms",
               flavour: "measure the TONSILLAR DESCENT below the foramen magnum, and look for the syrinx that follows from it — the syrinx is often what actually causes the deficit, and the tonsils are only why it formed" },
      bySite: {
        cerebellum_flocculonodular: { level: "gait, and DOWNBEAT nystagmus specifically",
                                      flavour: "downbeat nystagmus in a young adult is a craniocervical junction sign until the scan says otherwise, and Chiari is the commonest structural cause" },
        craniocervical_junction_foramen_magnum: { level: "all four limbs, the lower cranial nerves, and respiratory pattern in sleep" },
      },
    },
    "Chiari malformation or cerebellar degeneration": {
      slots: { level: "gait, nystagmus and limb coordination",
               flavour: "the name holds two very different answers — a STRUCTURAL malformation that may be operable, or a DEGENERATIVE process that is not. The scan separates them, and the distinction changes everything that follows" },
      confirmatoryExtra: ["If the picture is degenerative rather than structural, the work-up diverges entirely: alcohol history, thyroid and B12, coeliac and paraneoplastic antibodies, and a family history for the hereditary ataxias"],
      urgency: "urgent",
    },
    "Cerebellar malformation (Dandy-Walker, vermian hypoplasia)": {
      slots: { level: "truncal stability and developmental milestones where the patient is a child",
               flavour: "cystic dilatation of the fourth ventricle with an absent or hypoplastic VERMIS and an enlarged posterior fossa — and look at the ventricles, because hydrocephalus is present in most and is the treatable part" },
      confirmatoryExtra: ["Look for the associated anomalies beyond the posterior fossa — callosal agenesis, cardiac and renal malformations — since Dandy-Walker is frequently part of a wider syndrome rather than an isolated finding"],
      monitoringExtra: ["Head circumference and developmental progress in a child; in an adult found incidentally, the question is whether the hydrocephalus is compensated or slowly decompensating"],
    },
    "Syringomyelia (± Chiari)": {
      slots: { level: "the dissociated sensory loss, and its upper and lower borders",
               flavour: "a fluid cavity within the cord — the classic picture is a CAPE-LIKE loss of pain and temperature with PRESERVED light touch and vibration, because the syrinx interrupts the crossing fibres at the centre and spares the columns" },
      confirmatoryExtra: [
        "ALWAYS image the craniocervical junction as well as the syrinx: most are secondary to Chiari, and treating the syrinx without addressing the obstruction above it does not work",
        "Where there is no Chiari, look for the other causes — previous trauma, arachnoiditis after meningitis or surgery, and an intramedullary tumour, which needs contrast to exclude",
      ],
      monitoringExtra: ["Warn about PAINLESS INJURY: burns and cuts to insensate hands are common and preventable, and the patient will not report an injury they did not feel"],
      bySite: {
        cord_lateral:  { level: "the dissociated loss, plus the long tracts as the cavity expands outward" },
        cord_central:  { level: "the cape distribution and the arm reflexes, which are lost early" },
      },
    },
    "Syringobulbia": {
      slots: { level: "facial sensation in an ONION-SKIN pattern, plus palate, tongue and swallow",
               flavour: "the cavity has extended up into the brainstem — facial sensory loss follows the onion-skin distribution of the spinal trigeminal nucleus rather than the divisions of the nerve, which is the finding that localises it" },
      monitoringExtra: ["Bulbar function and sleep-disordered breathing are the features that make this more urgent than a cord syrinx alone — ask about swallow, voice and nocturnal stridor at every review"],
      urgency: "urgent",
    },
    "Craniocervical instability / basilar invagination": {
      slots: { level: "all four limbs, the lower cranial nerves, and any positional worsening",
               flavour: "the odontoid peg sits ABOVE its normal line and indents the brainstem — and look for the underlying reason: rheumatoid disease, Down syndrome, a connective tissue disorder, or skeletal dysplasia" },
      confirmatoryExtra: [
        "DYNAMIC (flexion-extension) imaging is what demonstrates instability — a static scan can look acceptable in a neck that is dangerous when it moves",
        "CT defines the BONE and MRI the cord: they answer different questions here and are not alternatives",
      ],
      monitoringExtra: ["SAFETY NET: symptoms brought on by NECK POSITION, or a history of transient weakness after a minor injury, indicate a cord at risk — that patient needs a surgical opinion before the next fall, not after it"],
      urgency: "urgent",
    },
    "Tethered cord / spinal dysraphism": {
      slots: { level: "sphincter function, saddle sensation and the ankle jerks",
               flavour: "a conus lying BELOW L2 with a thickened filum — and examine the back for the cutaneous marker: a dimple, tuft of hair, lipoma or naevus that has been there since birth and was never connected to the symptoms" },
      confirmatoryExtra: [
        "URODYNAMIC assessment is often the most sensitive measure of progression here, and bladder function is what is most likely to be lost irreversibly",
        "Look for the associated anomalies — a lipoma, dermal sinus tract, diastematomyelia, and anorectal or renal malformations",
      ],
      monitoringExtra: ["Deterioration is classically triggered by a GROWTH SPURT in a child, or by a specific stretch such as pregnancy or an unusual exertion in an adult — so a stable patient can change quickly at a predictable time"],
    },
  }),
};
