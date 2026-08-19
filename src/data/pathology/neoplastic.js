// neoplastic.js — pathology workups for the NEOPLASTIC / COMPRESSIVE category.
//
// Four of these canonicalise onto the coarse `Metastases` entity but are genuinely different workups —
// a vertebral metastasis and a perineural spread share almost nothing — so they are authored separately
// and deliberately NOT aliased.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS:
//   ✅ the 8 tranche-1 plans — SIGNED OFF 2026-08-18.
//   ⚠  MALIGNANT CNS COMPRESSION (9) and THORACIC INLET / PANCOAST (9) — tranche 2, AWAITING REVIEW.
import { dz, family } from "./builders.js";

// ---- ROUND 3a (tranche 2) ----
// The neoplastic red set is 74 names, not the 24 the plan estimated — the original clustering matched only
// "metastasis|carcinoma" and missed most of it. It decomposes into roughly nine families, so it runs as
// several rounds. These are the first two, chosen because both are time-critical and both are diagnoses
// where the delay, rather than the tumour, is what costs the patient function.

// MALIGNANT COMPRESSION OF THE CNS. One question dominates and it has a clock on it: is the cord, cauda or
// brainstem being compressed, and how fast. The tumour type matters afterwards.
const COMPRESSION_SPINE = {
  confirmatory: [
    "MRI THE WHOLE SPINE, not the symptomatic level — malignant compression is multi-level in a substantial share of cases, and a second, higher lesion changes the radiotherapy field and the surgical plan entirely",
    "Do not wait for the MRI to start treatment where the picture is convincing: {flavour}",
    "Establish the ONCOLOGICAL context in parallel — known primary, staging, performance status and the patient's own wishes all bear on whether surgery or radiotherapy is the right answer",
    "Where no primary is known, CT chest, abdomen and pelvis, and tissue from the most accessible site rather than the most alarming one",
  ],
  monitoring: [
    "SAFETY NET: the strongest predictor of walking afterwards is whether the patient was walking BEFORE treatment — this is why the delay matters more than almost anything else you can control",
    "Serial examination of {level}, documented at defined intervals, so progression is measured rather than remembered",
    "Bladder and bowel function explicitly at every review — retention is often established before the patient volunteers it, and once lost it rarely returns",
    "Pressure areas, venous thromboembolism prophylaxis and analgesia are not afterthoughts here: an immobile patient with malignant disease accumulates preventable harm quickly",
  ],
  urgency: "emergency",
  referral: "Acute oncology with spinal surgery and radiotherapy — a same-day discussion, not a clinic letter",
};

// THORACIC INLET / PANCOAST. A nerve problem whose answer is in the CHEST, and one of the great missed
// diagnoses: months of shoulder and arm pain treated as musculoskeletal before anyone images the apex.
const PANCOAST_SPINE = {
  confirmatory: [
    "IMAGE THE LUNG APEX — a plain chest film is NOT adequate here and is the commonest reason this is missed: the apex is obscured by the clavicle and first rib, so CT chest with dedicated apical views is the test",
    "MRI of the brachial plexus and thoracic inlet defines what the tumour has actually invaded — the plexus, the vertebral bodies, the subclavian vessels — and that is what determines resectability: {flavour}",
    "Look for HORNER'S SYNDROME, and examine {level} — the combination of lower plexus signs with a Horner's is close to diagnostic and is what should have triggered the imaging",
    "Tissue diagnosis before treatment, and full staging including PET-CT and brain imaging, since management is often multimodal and starts with chemoradiotherapy rather than surgery",
  ],
  monitoring: [
    "SAFETY NET: this is repeatedly treated as frozen shoulder, cervical radiculopathy or ulnar neuropathy for months. SHOULDER OR ARM PAIN THAT WAKES THE PATIENT AT NIGHT, in a smoker, with lower plexus signs, means image the chest — not another course of physiotherapy",
    "Track {level}, and ask about weight loss, haemoptysis and smoking history at the first visit rather than the third",
    "Pain here is frequently severe and neuropathic and is under-treated while the diagnosis is pursued — involve pain services early rather than at the end",
    "Watch for the complications that follow the anatomy: vertebral invasion threatening the cord, and subclavian involvement threatening the limb",
  ],
  urgency: "urgent",
  referral: "Thoracic oncology multidisciplinary team; neurology or plexus surgery for the neurological deficit",
};

export default {
  // ---- MALIGNANT COMPRESSION OF THE CNS ----
  ...family("malignant-cns-compression", COMPRESSION_SPINE, {
    "Metastatic spinal cord compression": {
      slots: { level: "power, the sensory level and sphincter function",
               flavour: "this is THE oncological emergency of the spine — steroids are started on clinical suspicion, and the imaging confirms rather than permits" },
      monitoringExtra: ["Ask about the symptom that precedes compression by weeks: BACK PAIN WORSE AT NIGHT AND ON LYING FLAT. Any patient with cancer and that history warrants imaging before they develop a deficit, not after"],
    },
    "Metastatic or primary tumour": {
      slots: { level: "saddle sensation, sphincter tone and the anal wink",
               flavour: "below the conus this is a cauda equina syndrome — the deficit is lower motor neurone and the sphincters are what is at stake" },
    },
    "Compressive lesion (tumour or disc)": {
      slots: { level: "the asymmetry between the two sides, and the sensory level",
               flavour: "a hemicord picture — the MRI distinguishes tumour from disc, but the decompression question and its clock are identical for both" },
    },
    "Compressive lesion (tumour, disc or abscess)": {
      slots: { level: "vibration and proprioception, plus gait with the eyes closed",
               flavour: "three causes, one urgent question — and send inflammatory markers with the imaging request, because an abscess changes the operation as well as the antibiotics" },
    },
    "Compressive lesion at T12-L1 (disc, tumour or metastasis)": {
      slots: { level: "sphincter function first, then the legs",
               flavour: "the conus sits here, and a conus lesion gives EARLY sphincter failure with relatively little weakness — so the deficit can be severe while the legs still look reasonable" },
    },
    "Intramedullary metastasis": {
      slots: { level: "the long tracts, and any dissociated sensory pattern",
               flavour: "WITHIN the cord rather than compressing it — surgery is rarely the answer, so the pathway is radiotherapy and systemic treatment, and the prognosis conversation is different and more honest earlier" },
      confirmatoryExtra: ["Intramedullary disease usually means widespread systemic disease — image the brain as well, because leptomeningeal and cerebral deposits frequently coexist and change the plan"],
    },
    "Vertebral or intradural tumour": {
      slots: { level: "sacral sensation, sphincter tone and the ankle jerks",
               flavour: "distinguish VERTEBRAL (bone, usually metastatic) from INTRADURAL (usually a nerve sheath tumour or meningioma, often benign and resectable) — the prognosis and the operation are entirely different" },
      bySite: {
        root_s2: { level: "sphincter tone, the anal wink and the bulbocavernosus reflex",
                   flavour: "at S2 the sphincters are the function at stake, so the threshold for urgent imaging is lower than the indolent history suggests" },
        root_s3: { level: "perineal sensation and bladder function specifically",
                   flavour: "S3 is central to bladder control — urodynamics may show loss before the patient reports it, and that is the deficit least likely to recover" },
      },
    },
    "Foramen-magnum meningioma": {
      slots: { level: "all four limbs and the lower cranial nerves",
               flavour: "the classic and classically missed presentation is a deficit that marches AROUND the limbs in sequence, often starting in one arm — and it is a benign, resectable tumour, so the delay is the tragedy" },
      urgency: "urgent",
      referral: "Skull-base neurosurgery — usually benign and often curable by resection",
    },
    "Craniocervical junction compression (foramen-magnum meningioma, basilar invagination)": {
      slots: { level: "all four limbs, the tongue, and respiratory pattern in sleep",
               flavour: "the name holds a tumour and a bony anomaly — CT for the BONE and MRI for the cord answer different questions here and are not alternatives" },
      urgency: "urgent",
    },
  }),

  // ---- THORACIC INLET / PANCOAST ----
  ...family("thoracic-inlet-malignancy", PANCOAST_SPINE, {
    "Pancoast (superior sulcus) tumour": {
      slots: { level: "the small muscles of the hand and the T1 sensory territory",
               flavour: "an apical tumour invading the lower plexus, sympathetic chain and often the first ribs and vertebral bodies" },
      bySite: {
        sympathetic_preganglionic: { level: "the pupil and the eyelid — and ask about ANHIDROSIS over the face, which localises the lesion pre-ganglionic" },
        root_c8:                   { level: "finger flexion and the medial hand" },
        root_t1:                   { level: "the intrinsic hand muscles, and the pupil for a Horner's" },
        plexus_lower_trunk:        { level: "all the intrinsics with medial forearm sensation — the true lower trunk pattern" },
      },
    },
    "Apical lung (superior sulcus) carcinoma": {
      slots: { level: "the sympathetic supply — pupil, lid and facial sweating",
               flavour: "the same tumour named for its origin rather than its syndrome; a Horner's syndrome with arm pain in a smoker is the presentation" },
    },
    "Metastasis to the lung apex or chest wall": {
      slots: { level: "the pupil and lid, with the lower plexus",
               flavour: "a metastasis rather than a primary means the staging question is already answered — find the primary, and expect systemic rather than surgical treatment" },
    },
    "Mesothelioma or chest wall tumour": {
      slots: { level: "the sympathetic chain and the lower plexus",
               flavour: "ask about ASBESTOS EXPOSURE explicitly, including indirect and occupational exposure decades earlier — it changes the differential and it carries compensation implications the patient should be told about" },
    },
    "Malignant infiltration of the lower plexus / root": {
      slots: { level: "the intrinsic hand muscles and the T1 territory",
               flavour: "in a previously irradiated field the question is infiltration versus RADIATION plexopathy — PAIN and a Horner's favour tumour, myokymia on EMG favours radiation" },
      confirmatoryExtra: ["EMG looking for MYOKYMIC discharges is the most useful single discriminator from radiation injury, and PET-CT helps where it remains unresolved"],
    },
    "Neoplastic infiltration": {
      slots: { level: "the muscles of that plexus element specifically",
               flavour: "infiltration rather than compression — the plexus is invaded rather than displaced, so the MRI shows thickening and enhancement rather than a discrete mass" },
      bySite: {
        plexus_upper_trunk:    { level: "shoulder abduction and elbow flexion" },
        plexus_middle_trunk:   { level: "elbow and wrist extension" },
        plexus_lateral_cord:   { level: "elbow flexion and forearm pronation, with lateral forearm sensation" },
        plexus_posterior_cord: { level: "shoulder abduction, elbow extension and wrist extension together" },
      },
    },
    "Neoplastic infiltration (breast, lymphoma, metastasis)": {
      slots: { level: "the intrinsic hand muscles and medial forearm sensation",
               flavour: "the lower trunk in a patient with treated breast cancer or lymphoma — and the previous treatment field is the first thing to establish, because it decides whether this is recurrence or radiation injury" },
    },
    "Neoplastic infiltration (Pancoast, breast, lymphoma)": {
      slots: { level: "the medial cord distribution — intrinsics with medial forearm sensation",
               flavour: "three primaries reach the medial cord by different routes: from above (apical lung), from the axilla (breast), and from nodes (lymphoma) — so image the apex AND the axilla" },
    },
    "Lung or mediastinal malignancy": {
      slots: { level: "the diaphragm — and measure it, with erect and supine vital capacity rather than by inspection",
               flavour: "a raised hemidiaphragm on a chest film is the finding, and a phrenic palsy from malignancy means mediastinal involvement until proven otherwise" },
      confirmatoryExtra: ["Erect and SUPINE spirometry: a fall of more than about a fifth on lying flat indicates significant diaphragmatic weakness, and it is the measurement that decides whether breathlessness is being under-called"],
      urgency: "urgent",
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
};
