// neoplastic.js — pathology workups for the NEOPLASTIC / COMPRESSIVE category.
//
// Four of these canonicalise onto the coarse `Metastases` entity but are genuinely different workups —
// a vertebral metastasis and a perineural spread share almost nothing — so they are authored separately
// and deliberately NOT aliased.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ ALL SIGNED OFF by the owner (a clinician), 2026-08-18.
//   Tranche 1 — 8 plans. Tranche 2 (round 3, in four parts) — malignant CNS compression and thoracic
//   inlet; skull-base/perineural spread and paraneoplastic; intra-axial, meningioma, sellar/hypothalamic
//   and pineal/third-ventricle; herniation/raised ICP, pelvic/retroperitoneal, neck/mediastinal and four
//   singletons. The neoplastic red set is complete.
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

// ---- ROUND 3b (tranche 2) ----

// SKULL-BASE AND PERINEURAL MALIGNANT SPREAD. The unifying idea is that tumour travels along ANATOMICAL
// CORRIDORS — nerves, foramina and fat planes — rather than by pushing through tissue. That is why the
// imaging must follow the corridor rather than photograph the deficit, and why the history of a small
// skin cancer excised years ago is the single most useful question in the whole encounter.
const SKULL_BASE_SPINE = {
  confirmatory: [
    "MRI skull base with contrast AND FAT SATURATION, following the nerve or corridor back to its foramen — fat saturation is what makes an enhancing nerve visible against marrow, and a study without it is reported as normal often enough to matter",
    "ASK ABOUT PREVIOUS HEAD AND NECK CANCER, however small and however long ago — an excised facial skin lesion years earlier is the history that makes this diagnosis, and patients never volunteer it because nobody told them it mattered",
    "Look for the indirect signs rather than a mass: foraminal widening or erosion, loss of the normal fat pad at the foramen, and DENERVATION change in the muscles supplied — {flavour}",
    "CT for the BONE alongside the MRI for soft tissue: erosion versus remodelling separates malignant from benign, and they answer different questions",
    "Tissue where the primary is unknown, with PET-CT to find it — and biopsy the accessible site rather than the skull base wherever that is possible",
  ],
  monitoring: [
    "Track {level} BY NAME at every review — spread along a corridor is CONTIGUOUS, so the sequence in which structures fail maps the direction of travel and predicts what goes next",
    "SAFETY NET: progressive cranial neuropathy WITH PAIN is malignant until proven otherwise, and a normal first scan does not exclude it — a repeat study after an interval is frequently what makes the diagnosis",
    "Protect the eye wherever corneal sensation is lost: a numb cornea ulcerates silently and the patient will not report it, because the warning symptom is the one thing they cannot feel",
    "Nutrition and swallow where the lower cranial nerves are involved — this is where the avoidable harm accumulates while the tumour is being staged",
  ],
  urgency: "urgent",
  referral: "Head-and-neck oncology multidisciplinary team, with skull-base surgery; ophthalmology where the orbit or cornea is involved",
};

// PARANEOPLASTIC. The neurology is the PRESENTING feature of a cancer that is usually small and often not
// yet found. Two things follow: the antibody defines the search rather than the diagnosis, and a negative
// antibody panel does not exclude the syndrome.
const PARANEOPLASTIC_SPINE = {
  confirmatory: [
    "PAIRED SERUM AND CSF for the onconeural and cell-surface antibody panels — some antibodies are found only in CSF, so serum alone misses cases, and the panel should be sent as a panel rather than picked one at a time",
    "HUNT THE TUMOUR, and keep hunting: CT chest, abdomen and pelvis first, then PET-CT, plus the examinations the specific antibody directs — {flavour}",
    "A NEGATIVE ANTIBODY PANEL DOES NOT EXCLUDE THIS. Seronegative paraneoplastic and autoimmune syndromes are well recognised, and a convincing clinical picture warrants the tumour search regardless",
    "The antibody tells you WHERE TO LOOK rather than what to do: anti-Yo points to breast and ovary, anti-Hu to small cell lung, anti-Ma2 to testis in a young man — examine the testes, and image them",
  ],
  monitoring: [
    "SAFETY NET: TREATING THE TUMOUR is the treatment of the neurology, and delay costs function that does not return — so the tumour search is urgent even when the neurological syndrome is stable",
    "Track {level} against a documented baseline; established deficits often persist even when the tumour is treated, which is why early recognition matters more here than almost anywhere",
    "If the first tumour search is negative, REPEAT IT rather than abandoning the diagnosis — the cancer may not be radiologically apparent for months after the neurology begins",
    "Escalate the discussion early to neurology and oncology together: immunotherapy decisions and the oncological work-up are not sequential here, they run in parallel",
  ],
  urgency: "urgent",
  referral: "Neurology with oncology; the specific tumour team once the primary is identified",
};

// ---- ROUND 3c (tranche 2): the intracranial masses ----
// Four families that are all "a mass inside the skull", separated by the question each one actually poses.

// INTRA-AXIAL: within the brain substance. The first question is one lesion or many, because that alone
// splits primary from metastatic and changes the whole pathway.
const INTRAAXIAL_SPINE = {
  confirmatory: [
    "MRI brain WITH contrast — the question a plain scan cannot answer is ONE lesion or MANY, and that alone splits primary from metastatic before any tissue is taken",
    "If MULTIPLE: metastatic until proven otherwise — CT chest, abdomen and pelvis for the primary BEFORE biopsying the brain, since an accessible primary is easier and safer to sample",
    "If SOLITARY: tissue is what settles it, and resection and biopsy answer different questions — discuss with neurosurgery and neuro-oncology together rather than sequentially",
    "Advanced sequences separate tumour from abscess and from demyelination where ring enhancement is ambiguous — {flavour}",
  ],
  monitoring: [
    "Track {level}, and reimage on a change of PACE rather than on a schedule — deterioration over days rather than weeks suggests haemorrhage into the lesion or expanding oedema, not growth",
    "SAFETY NET: morning headache, vomiting or a falling conscious level is raised intracranial pressure and needs urgent imaging",
    "Ask specifically about focal events the patient has not called seizures, and counsel about DRIVING — a legal obligation that is routinely forgotten while the tumour is discussed",
    "Steroids relieve oedema but confound the histology of lymphoma — if CNS lymphoma is a possibility, discuss BEFORE giving them, because a treated lesion can become unbiopsiable",
  ],
  urgency: "urgent",
  referral: "Neuro-oncology multidisciplinary team with neurosurgery",
};

// MENINGIOMA and the dural extra-axial mimics. Usually benign, usually slow, and the decision is as often
// to WATCH as to operate — so the reflex to treat is the thing to examine.
const MENINGIOMA_SPINE = {
  confirmatory: [
    "MRI with contrast showing an extra-axial, dural-based mass with a DURAL TAIL — extra-axial is the key observation, because it changes the differential completely and is visible on the first scan",
    "CT for the BONE: hyperostosis supports meningioma, while destruction argues for metastasis or another dural malignancy — {flavour}",
    "Assess the VENOUS anatomy where the lesion sits near a sinus: involvement of the superior sagittal sinus determines what can safely be resected and is the commonest reason a parasagittal lesion is not simply removed",
    "Where the dural lesion may not be a meningioma at all, consider the mimics — dural metastasis, lymphoma, and IgG4 or granulomatous disease — which need tissue rather than observation",
  ],
  monitoring: [
    "GROWTH RATE decides, not size — many are found incidentally and never need treating, so serial imaging at increasing intervals is a legitimate active plan rather than indecision",
    "Track {level}, and treat a NEW deficit as the trigger to reconsider, since the lesion's size may not have changed much when function starts to go",
    "Seizure risk is real for convexity and parasagittal lesions: ask about focal events, and counsel about driving",
    "SAFETY NET: rapid growth, new pain, or oedema out of proportion to size argues against a simple meningioma and warrants tissue rather than another scan",
  ],
  urgency: "routine",
  referral: "Neurosurgery, with neuro-oncology where the diagnosis is uncertain",
};

// SELLAR / SUPRASELLAR / HYPOTHALAMIC. The distinguishing feature of this region is that ENDOCRINE and
// VISUAL failure arrive before anything a neurologist would call a deficit — and both are reversible if
// caught, which is why the bloods and the fields are the urgent tests, not the scan.
const SELLAR_SPINE = {
  confirmatory: [
    "FULL PITUITARY AXIS BLOODS URGENTLY — cortisol above all, plus thyroid, prolactin, gonadal axis and IGF-1. Untreated adrenal insufficiency kills, it is trivially treatable, and it is invisible on the scan everyone reaches for first",
    "FORMAL VISUAL FIELDS by perimetry, not confrontation: a bitemporal defect starts in the superior temporal quadrants and is easily missed at the bedside, and it is the other reversible loss here",
    "Dedicated pituitary MRI with thin slices and contrast — a standard brain study does not resolve this region: {flavour}",
    "Check SODIUM and fluid balance, and ask about thirst and nocturia — diabetes insipidus points to a stalk or hypothalamic lesion rather than an adenoma, and that changes the differential toward germinoma, histiocytosis and metastasis",
  ],
  monitoring: [
    "SAFETY NET: acute deterioration with severe headache and visual loss is PITUITARY APOPLEXY — an endocrine and surgical emergency, and steroid replacement comes before imaging",
    "Track {level} plus the fields and the endocrine axis together — this region needs all three followed, and the neurological examination alone will look reassuring while function is being lost",
    "In a child or young adult, growth and puberty are part of the follow-up and are the measures most likely to reveal a slowly growing lesion",
    "After treatment, hormone replacement is usually lifelong and is where long-term harm accumulates — including the hypothalamic obesity and behavioural change that follow craniopharyngioma surgery",
  ],
  urgency: "urgent",
  referral: "Pituitary multidisciplinary team — endocrinology, neurosurgery and ophthalmology together",
};

// PINEAL / TECTAL / THIRD VENTRICLE. One anatomical fact dominates: they sit on the CSF pathway, so
// HYDROCEPHALUS is the emergency and the tumour is the diagnosis. Those are different clocks.
const PINEAL_SPINE = {
  confirmatory: [
    "ASSESS THE VENTRICLES FIRST. These lesions obstruct CSF at the aqueduct or foramina, and the hydrocephalus is what threatens life in the next hours while the tumour is what threatens it over months",
    "MRI brain and WHOLE SPINE with contrast — germ cell tumours and ependymomas seed the CSF, so the spine is part of staging rather than an afterthought: {flavour}",
    "TUMOUR MARKERS in serum AND CSF — alpha-fetoprotein and beta-hCG. A raised marker can make the diagnosis without a biopsy and moves the patient straight to chemoradiotherapy, which is why they are sent before tissue is sought",
    "CSF cytology where it is safe to obtain it — but never before the imaging, because these are the lesions in which lumbar puncture risks herniation",
  ],
  monitoring: [
    "SAFETY NET: headache, vomiting, a falling conscious level or new vertical gaze failure means the hydrocephalus is decompensating — that is a neurosurgical emergency independent of the tumour diagnosis",
    "Track {level}, and examine the pupils and vertical gaze at every review: Parinaud's syndrome is the earliest sign that the tectal plate is being compressed",
    "In a young person, discuss FERTILITY PRESERVATION before chemoradiotherapy — it is time-critical, easily overlooked in an acute admission, and cannot be revisited later",
    "Long-term endocrine and neurocognitive follow-up after cranial radiotherapy, particularly in children",
  ],
  urgency: "emergency",
  referral: "Neurosurgery urgently for the hydrocephalus; neuro-oncology for the tumour",
};

// ---- ROUND 3d (tranche 2): closing the neoplastic set ----

// HERNIATION AND RAISED INTRACRANIAL PRESSURE. These are not diagnoses — they are the MASS EFFECT of
// something else, and the whole workup is a redirection: find and treat what is causing the pressure.
// Grouped here because each is a sign that gets mistaken for a focal lesion at the site where it appears.
const HERNIATION_SPINE = {
  confirmatory: [
    "THIS IS A SIGN, NOT A DIAGNOSIS. The urgent question is WHAT IS RAISING THE PRESSURE — image the whole head, and read the scan for the CAUSE rather than for the structure that is failing",
    "CT immediately, assessing midline shift, basal cistern effacement and ventricular size — and remember that a false localising sign means the lesion is somewhere OTHER than where the deficit points: {flavour}",
    "FUNDOSCOPY for papilloedema, at presentation and again — it is the bedside measure of pressure and it is skipped more often than any other part of this examination",
    "Where imaging is normal and the pressure is still suspected, consider idiopathic intracranial hypertension and venous sinus thrombosis — and image the VENOUS phase, since a normal arterial study does not exclude it",
  ],
  monitoring: [
    "SAFETY NET: treatment of raised pressure should not wait for the imaging to be reported. Pupils, conscious level and respiratory pattern are the observations that matter, and a fixed dilated pupil with a falling conscious level is an emergency already in progress",
    "Track {level}, but interpret it as a PRESSURE measure rather than as localisation — improvement follows treatment of the cause, not of the nerve",
    "VISION is at risk independently of the underlying lesion where papilloedema is present: acuity and fields need following, because visual loss from chronic raised pressure is preventable and permanent",
    "Avoid lumbar puncture until imaging excludes a mass with shift — and where the pressure is being relieved, watch for the deterioration that follows too rapid a decompression",
  ],
  urgency: "emergency",
  referral: "Neurosurgery and acute neurology; ophthalmology where vision is threatened",
};

// PELVIC, RETROPERITONEAL AND AXILLARY MASSES. A nerve or plexus deficit whose answer is in the ABDOMEN,
// PELVIS OR AXILLA — and the recurring failure is investigating the limb while the cause sits in a body
// cavity nobody has imaged.
const DEEP_MASS_SPINE = {
  confirmatory: [
    "IMAGE THE CAVITY, NOT THE LIMB — CT or MRI of the abdomen, pelvis or axilla as the anatomy dictates. A plexus or nerve deficit with no compressive lesion at the usual entrapment point should send you inward, not to repeat neurophysiology",
    "MRI defines the relationship to the nerve and to the surrounding structures better than CT, and is what determines whether the lesion is compressing or infiltrating: {flavour}",
    "Examine {level}, and take a MALIGNANCY history explicitly — a previously treated pelvic or breast cancer changes this from an unexplained neuropathy into a recurrence until disproved",
    "Neurophysiology localises and grades the deficit, but it is the second question — it should not delay the imaging that makes the diagnosis",
  ],
  monitoring: [
    "SAFETY NET: PAIN out of proportion, pain that is worse at NIGHT, or a progressive deficit is malignant infiltration until imaged — and in a previously irradiated field the distinction from radiation injury turns on pain and on myokymia",
    "Track {level} against a documented baseline, since the trajectory is what separates a compressive from an infiltrative process",
    "Ask directly about bladder, bowel and sexual function where the lumbosacral plexus or pudendal nerve is involved — these are rarely volunteered and are what most affect quality of life",
    "Involve pain services early: deep pelvic and plexus pain from malignancy is severe, neuropathic, and routinely under-treated while the diagnosis is pursued",
  ],
  urgency: "urgent",
  referral: "The relevant tumour multidisciplinary team, with neurology for the nerve injury and pain services alongside",
};

// NECK AND MEDIASTINAL MALIGNANCY. The nerve is long and the lesion is remote: a palsy here means imaging
// the WHOLE COURSE of the nerve, which frequently leaves the neck entirely.
const NECK_MEDIASTINAL_SPINE = {
  confirmatory: [
    "IMAGE THE WHOLE COURSE OF THE NERVE, not the symptomatic end — these nerves travel far, and the lesion is regularly outside the field of the first scan requested",
    "CT neck AND chest with contrast: the recurrent laryngeal nerve on the left loops under the AORTIC ARCH, so a left vocal cord palsy demands mediastinal imaging that a neck study will miss entirely — {flavour}",
    "Examine the NECK properly — thyroid, cervical nodes and the supraclavicular fossa — and biopsy an accessible node in preference to anything deeper",
    "Nasendoscopy or laryngoscopy where voice or swallow is affected: it confirms the palsy, documents the side, and may show the primary",
  ],
  monitoring: [
    "SAFETY NET: PROLONGED or progressive hoarseness in a smoker needs laryngoscopy and imaging, not reassurance or another course of treatment for reflux — this is the commonest way a mediastinal malignancy is missed",
    "SWALLOW and aspiration risk where the vagus or lower cranial nerves are involved: silent aspiration is common and pneumonia is what actually harms the patient",
    "Track {level}, and reassess the voice formally rather than by listening — objective assessment picks up progression that conversation does not",
    "Watch for the neighbouring structures the same lesion will reach: sympathetic chain for a Horner's, phrenic nerve for the diaphragm, and brachial plexus for the arm",
  ],
  urgency: "urgent",
  referral: "Head-and-neck or thoracic oncology as the anatomy dictates, with ENT for the airway and voice",
};

// ---- ROUND 15 (tranche 3): THE BENIGN SKULL-BASE TUMOURS ----
// Deliberately NOT folded into SKULL_BASE_SPINE, which works up MALIGNANCY — nasopharyngeal carcinoma,
// perineural spread, metastasis — where the questions are staging, tissue and the primary. These are
// slow, benign and often best LEFT ALONE, so the whole shape of the decision is different: the treatment
// can cost more function than the tumour has, and the honest first option is frequently to watch.
const BENIGN_SKULL_BASE_SPINE = {
  confirmatory: [
    "MRI SKULL BASE WITH CONTRAST AND THIN SLICES THROUGH THE RELEVANT FORAMEN, plus a CT for the BONE. The two answer different questions and both are needed: MRI shows the lesion and its extent, CT shows whether the bone is REMODELLED (benign, slow) or DESTROYED (malignant), and that distinction does more work than any other single finding. {flavour}",
    "DOCUMENT THE FUNCTION THAT IS AT RISK BEFORE ANYTHING IS DONE TO IT, formally and in measurable terms — audiometry, facial nerve grading, a swallow assessment, the visual fields. This is a baseline as much as a description, because treatment here is judged on function preserved rather than on the tumour removed",
    "Examine {level}, and test the NEIGHBOURING nerves the patient has not complained about. These tumours grow along a corridor, and a subclinical deficit in the next nerve along tells you the extent better than the patient's symptoms do",
    "CONSIDER THE SYNDROMES BEHIND THE LESION: bilateral vestibular schwannomas mean NEUROFIBROMATOSIS TYPE 2, multiple or familial paragangliomas mean a succinate dehydrogenase mutation, and both change the plan from treating a tumour to managing a person and their family",
  ],
  monitoring: [
    "WATCHING IS AN ACTIVE PLAN, NOT AN ABSENCE OF ONE. Many of these grow slowly or not at all, and treatment can cost hearing, facial movement or swallowing that the tumour had not yet taken — so serial imaging at lengthening intervals is a legitimate decision that should be presented as such",
    "Track {level} with the SAME measurement each time, and treat a change in FUNCTION as the trigger to act rather than a change in millimetres — function is what the patient lives with",
    "SAFETY NET: rapid growth, new PAIN, or a new deficit developing quickly argues against a benign lesion and warrants reassessment and tissue rather than another interval scan",
    "PROTECT WHAT THE NERVE WAS DOING: a numb cornea needs ophthalmic protection because it ulcerates silently, a weak palate or vocal cord needs a swallow assessment before food, and hearing loss needs rehabilitation rather than a wait to see whether it worsens",
  ],
  urgency: "routine",
  referral: "A skull-base multidisciplinary team — neurosurgery, ENT and radiation oncology together; audiology and ophthalmology as the deficit requires",
};

// ---- ROUND 15 (tranche 3): A MASS ON A PERIPHERAL NERVE ----
// The clinical trap is that these present exactly as the common entrapment at the same place, and are
// treated as one for months. What separates them is the company they keep — and ultrasound, which is
// quick, cheap and shows a mass that nerve conduction studies never will.
const NERVE_MASS_SPINE = {
  confirmatory: [
    "THIS IMITATES THE ORDINARY ENTRAPMENT AT THE SAME SITE, and that is why it is missed: the presentation is identical, so the diagnosis rests on the features that do not fit — PAIN at rest or at night, a palpable or tender swelling, a positive Tinel's over a discrete point, progression despite rest and splinting, or a deficit that is worsening rather than fluctuating. {flavour}",
    "ULTRASOUND OF THE NERVE IS THE FIRST TEST AND IT IS UNDER-USED — it is quick, needs no radiation, images the nerve along its length, and shows a cyst, a mass or a vascular lesion that nerve conduction studies cannot. MRI where ultrasound is equivocal or the lesion is deep",
    "NERVE CONDUCTION STUDIES LOCALISE THE BLOCK BUT DO NOT SHOW WHAT IS CAUSING IT — a normal study does not exclude a mass, and an abnormal one does not identify it. The two tests answer different questions and are ordered together rather than in sequence",
    "Examine {level}, and take the history that names the cause: a repeated occupational or sporting movement, an old injury, anticoagulation, or symptoms that follow the MENSTRUAL CYCLE, which is close to specific for endometriosis on a nerve",
  ],
  monitoring: [
    "SAFETY NET: a PROGRESSIVE motor deficit is what makes this urgent — muscle that has been denervated for many months does not fully recover even after the compression is relieved, so the window is measured in months and it closes quietly",
    "Track {level} with graded power and a documented sensory map at each review; 'no better' is not a measurement and cannot show a trend",
    "Where the cause is a haematoma, review ANTICOAGULATION and the clotting immediately — that is the treatable half of the problem and it is often the whole of it",
    "Splinting, activity modification and physiotherapy while the cause is being established, and protect an insensate area from injury and pressure — the avoidable harm here is a burn or an ulcer, not the nerve lesion",
  ],
  urgency: "urgent",
  referral: "Peripheral nerve surgery or neurology with neurophysiology; the relevant specialty for the underlying mass (gynaecology, haematology or sarcoma services)",
};

export default {
  // ---- ROUND 15 (tranche 3): THE LAST THREE ----
  // Singletons because none of them shares a work-up with anything else in this file: two intramedullary
  // tumours, which are slow surgical lesions and NOT the oncological emergency that malignant extradural
  // compression is, and a haematological cause of neuropathy whose whole diagnosis is a blood test.

  "Intramedullary tumour (ependymoma / astrocytoma)": dz("Intramedullary tumour (ependymoma / astrocytoma)", {
    confirmatory: [
      "THIS IS NOT MALIGNANT CORD COMPRESSION AND THE CLOCK IS DIFFERENT. An intramedullary tumour grows INSIDE the cord over months to years — the deficit accumulates slowly, there is often no back pain, and the emergency pathway that suits an extradural metastasis does not apply. Confirm the tempo from the history before anything else",
      "MRI OF THE WHOLE SPINE WITH CONTRAST, and the BRAIN with it: the whole neuraxis is imaged because these can be multiple, because a Chiari malformation or a tethered cord may sit with them, and because the syrinx that so often accompanies them extends well beyond the tumour",
      "DISTINGUISH THE TUMOUR FROM ITS SYRINX. A large cyst above and below an enhancing nodule is characteristic, and it is the NODULE that is the tumour — draining the cyst alone treats nothing and the fluid reaccumulates",
      "Examine {level}. Ependymoma is central and symmetrical and arises from the ependyma, so it usually causes a CENTRAL CORD picture with cape-like loss of pain and temperature and preserved dorsal columns; astrocytoma is more infiltrative, more eccentric and commoner in children",
    ],
    monitoring: [
      "THE SURGICAL DISTINCTION IS THE PROGNOSIS, and it is worth understanding before the conversation with the patient: an EPENDYMOMA usually has a plane and can often be removed completely with a good long-term outcome, while an ASTROCYTOMA infiltrates and frequently cannot. The plan follows from which it is",
      "SAFETY NET: rapid deterioration, a new sensory level or a change in bladder function is not the slow course of this disease and needs urgent reimaging — haemorrhage into the tumour and an expanding syrinx both do that",
      "Track {level} with a formal, repeatable score at each review; a slow deterioration over years is invisible without comparable measurements, and it is the trajectory that decides when to operate",
      "BLADDER, BOWEL AND SEXUAL FUNCTION at every review, asked about directly. They are lost early in central cord lesions, they are rarely volunteered, and they matter more to the patient's life than the leg power that gets recorded instead",
    ],
    urgency: "urgent",
    referral: "Spinal neurosurgery with neuro-oncology; intramedullary surgery belongs in a centre that does it regularly, with intraoperative monitoring",
    bySite: {
      cord_lateral: { level: "the asymmetry between the two sides — power on one, pinprick on the other — and whether there is a sensory level" },
      cord_central: { level: "the CAPE distribution of pain and temperature loss with PRESERVED joint position sense and vibration, plus the small muscles of the hands",
                      flavour: "a central cord picture with dissociated sensory loss is the classic presentation, and it is shared with syringomyelia — so the enhancing nodule on the MRI is what separates a tumour from a cyst alone" },
    },
  }),

  "Intramedullary tumour (ependymoma)": dz("Intramedullary tumour (ependymoma)", {
    confirmatory: [
      "AT THE CONUS, MYXOPAPILLARY EPENDYMOMA IS THE CHARACTERISTIC TUMOUR, and it behaves differently from ependymoma higher up: it can SEED through the CSF, so the whole neuraxis is imaged with contrast at diagnosis rather than only the symptomatic region",
      "MRI OF THE WHOLE SPINE AND BRAIN WITH CONTRAST — this is a staging study as much as a diagnostic one, and it is done BEFORE surgery, because post-operative blood and enhancement make later imaging much harder to interpret",
      "SPHINCTER FUNCTION IS THE DIAGNOSIS AND THE OUTCOME AT THIS LEVEL: the conus fails the bladder, the bowel and sexual function EARLY and out of proportion to the leg weakness. Ask directly, and measure a post-void residual rather than accepting a reassuring answer",
      "Examine {level}, with saddle sensation and the anal reflex documented explicitly. Back pain, often worse lying down and at night, is common and is repeatedly treated as mechanical for a long time before anyone images",
    ],
    monitoring: [
      "THE INTEGRITY OF THE CAPSULE AT SURGERY DRIVES EVERYTHING: an en-bloc removal has a good outcome, while a tumour ruptured during removal seeds the CSF and recurs. That makes the choice of surgeon and centre a clinical decision rather than a logistical one",
      "SAFETY NET: acute urinary RETENTION, saddle numbness or rapidly progressive leg weakness is a cauda equina presentation and is assessed the same day, whatever the underlying tumour is doing",
      "Track {level} and the sphincter function together at every review, and involve continence services early — bladder management determines independence here more than walking does",
      "Long-term surveillance imaging of the whole neuraxis, because recurrence and CSF seeding can appear years later and are silent until they are not",
    ],
    urgency: "urgent",
    referral: "Spinal neurosurgery with neuro-oncology, in a centre performing intramedullary surgery with intraoperative monitoring; continence services alongside",
  }),

  "Paraproteinaemia / monoclonal gammopathy": dz("Paraproteinaemia / monoclonal gammopathy", {
    confirmatory: [
      "THE DIAGNOSIS IS A BLOOD TEST AND IT IS ROUTINELY OMITTED: SERUM PROTEIN ELECTROPHORESIS WITH IMMUNOFIXATION, and serum FREE LIGHT CHAINS. Electrophoresis alone misses small bands, so immunofixation has to be requested by name — this is the treatable cause of a 'idiopathic' neuropathy that most often turns out to have been findable",
      "IDENTIFY THE CLASS, because it decides what happens next: an IgM paraprotein associates with anti-MAG neuropathy, which is a distinct, slowly progressive, DEMYELINATING and predominantly SENSORY ATAXIC picture with tremor — so send ANTI-MAG ANTIBODIES where the paraprotein is IgM",
      "NERVE CONDUCTION STUDIES TO SEPARATE DEMYELINATING FROM AXONAL, since that changes the diagnosis entirely: a demyelinating picture with a paraprotein raises anti-MAG neuropathy and paraproteinaemic CIDP, both of which have treatments, while an axonal picture raises amyloid and vasculitis",
      "Examine {level}, and look for the RED FLAGS OF A HAEMATOLOGICAL MALIGNANCY behind the band — bone pain, anaemia, renal impairment, hypercalcaemia, weight loss — because a paraproteinaemia is a finding, not a diagnosis, and the marrow is what says whether it is benign",
    ],
    monitoring: [
      "SAFETY NET: THINK OF POEMS SYNDROME, which is missed for years and is treatable. A progressive demyelinating neuropathy with a LAMBDA paraprotein plus any of organomegaly, endocrinopathy, skin change, papilloedema or fluid overload is POEMS — send VEGF and image for a sclerotic bone lesion, because treating the plasma cell clone treats the neuropathy",
      "AMYLOIDOSIS IS THE OTHER MUST-NOT-MISS: a painful small-fibre neuropathy with AUTONOMIC failure, carpal tunnel syndrome in both hands, cardiac or renal involvement, in a patient with a paraprotein. It needs tissue and it needs haematology urgently, because the cardiac disease determines survival",
      "Track {level} with a standard scale, and REFER TO HAEMATOLOGY rather than monitoring the band in a neurology clinic — the risk of progression to myeloma or lymphoma is theirs to quantify and follow",
      "Where the neuropathy is genuinely from a benign monoclonal gammopathy, treatment decisions rest on DISABILITY rather than on the antibody titre or the paraprotein level, and much of the care is symptomatic: neuropathic pain, gait, falls and foot protection",
    ],
    urgency: "urgent",
    referral: "Neurology with neurophysiology, and haematology for the paraprotein — jointly rather than sequentially",
  }),

  // ---- ROUND 15 (tranche 3): BENIGN SKULL-BASE AND CRANIAL-NERVE TUMOURS ----
  ...family("benign-skull-base-tumour", BENIGN_SKULL_BASE_SPINE, {
    "Vestibular schwannoma": {
      slots: { level: "HEARING by formal audiometry, plus facial sensation, the corneal reflex and facial movement",
               flavour: "ASYMMETRIC sensorineural hearing loss with tinnitus and imbalance — and asymmetric hearing loss is the finding that earns an MRI, because the tumour is silent otherwise. Facial WEAKNESS is unusual even in a large one, so its presence argues for a different lesion" },
      confirmatoryExtra: ["BILATERAL vestibular schwannomas mean NEUROFIBROMATOSIS TYPE 2 until proven otherwise: image the whole neuraxis for meningiomas and spinal tumours, examine the skin and the eyes, and refer for genetic counselling. It is a diagnosis about a family, not only about an ear"],
    },
    "Vestibular schwannoma (intracanalicular)": {
      slots: { level: "audiometry with speech discrimination, and the corneal reflex",
               flavour: "a small tumour confined WITHIN the internal auditory meatus, where hearing preservation is most achievable and the argument for observation is strongest — many never grow, and treating one that would not have grown costs hearing for nothing" },
      confirmatoryExtra: ["SPEECH DISCRIMINATION, not just the pure-tone audiogram: it can be disproportionately poor and it is what determines whether the ear is usefully serviceable, which is the number that decides between watching, radiosurgery and surgery"],
    },
    "Meningioma": {
      slots: { level: "hearing, facial sensation and the corneal reflex, plus gait",
               flavour: "at the cerebellopontine angle a meningioma is broad-based on the petrous dura with a DURAL TAIL, and it does NOT widen the internal auditory meatus — which is exactly how it is told from a schwannoma, and it changes the operation" },
    },
    "Meningioma / facial schwannoma": {
      slots: { level: "FACIAL MOVEMENT graded formally, alongside hearing and the corneal reflex",
               flavour: "facial weakness at the internal auditory meatus points AWAY from a vestibular schwannoma. A facial schwannoma follows the nerve into the labyrinthine segment on thin-slice imaging, which is the finding to ask for" },
      confirmatoryExtra: ["A slowly PROGRESSIVE facial palsy is never Bell's palsy. Any facial weakness that progresses beyond a few weeks, recurs on the same side, or comes with hearing loss or twitching is imaged along the whole course of the nerve"],
    },
    "Geniculate schwannoma": {
      slots: { level: "facial movement graded formally, taste on the anterior tongue, tear production and hearing",
               flavour: "at the geniculate ganglion the branch anatomy is the localiser: loss of TEARING points at or above the greater petrosal nerve, while taste and stapedial reflex changes place it below — so the deficits map the segment better than the scan alone" },
    },
    "Facial nerve haemangioma": {
      slots: { level: "facial movement, hearing, and the pattern of onset — fluctuating or stepwise rather than steadily progressive",
               flavour: "a vascular malformation of the geniculate region that causes facial weakness EARLY and out of proportion to its small size, unlike a schwannoma of the same volume. That disproportion is the clue on imaging as well as at the bedside" },
    },
    "Trigeminal schwannoma": {
      slots: { level: "facial sensation in all three divisions separately, the corneal reflex, and the MUSCLES OF MASTICATION",
               flavour: "a dumbbell tumour spanning the middle and posterior fossae through Meckel's cave. FACIAL NUMBNESS rather than pain is the usual presentation, and a persistently numb face is never trigeminal neuralgia" },
      confirmatoryExtra: ["Look for MASSETER AND TEMPORALIS WASTING and for denervation change in those muscles on the scan — motor involvement means the lesion is proximal to or at the ganglion, and it is a sign nobody finds without palpating the temple"],
      bySite: {
        skull_base_v_ganglion: { level: "all three divisions, the corneal reflex, and the muscles of mastication" },
        skull_base_v3_ovale: { level: "sensation over the jaw and tongue, and jaw power and deviation on opening — a jaw that deviates towards the weak side localises to V3 at no cost" },
      },
    },
    "Meningioma of Meckel's cave": {
      slots: { level: "the three trigeminal divisions and the corneal reflex, plus the eye movements — the cavernous sinus is next door",
               flavour: "a dural-based mass with a tail in Meckel's cave, distinguished from a trigeminal schwannoma on the scan rather than at the bedside; both present with a numb face, and the difference decides the approach" },
    },
    "Petrous apex tumour or cholesteatoma": {
      slots: { level: "ABDUCTION of the eye, facial sensation, hearing, and the ear itself on otoscopy",
               flavour: "a sixth nerve palsy with facial pain and a discharging ear is GRADENIGO'S SYNDROME — classically infective, and the same corridor is occupied by cholesteatoma and by tumour. The ear examination is part of the neurological one here" },
      confirmatoryExtra: ["CT temporal bones alongside the MRI: expansion with smooth remodelling suggests cholesterol granuloma or cholesteatoma, while erosion suggests malignancy or infection — and a petrous apicitis is an emergency rather than a slow tumour"],
      urgency: "urgent",
    },
    "Chondrosarcoma": {
      slots: { level: "the cranial nerves in sequence along the corridor, and the eye movements",
               flavour: "arises from the PETRO-OCCIPITAL FISSURE, which is off the midline — and that off-centre origin is the imaging feature that separates it from a chordoma, which arises in the midline clivus. Both erode bone slowly and both present as an insidious cranial neuropathy" },
      confirmatoryExtra: ["Despite being slow and often called low-grade, this is a SARCOMA: it needs tissue, a sarcoma multidisciplinary discussion and a definitive plan, usually surgery with proton or particle radiotherapy — not the interval scanning that suits a meningioma"],
      urgency: "urgent",
    },
    "Metastasis / cholesterol granuloma": {
      slots: { level: "the cranial nerves at the apex — abduction, facial sensation and hearing",
               flavour: "two lesions with the same address and opposite meanings: a cholesterol granuloma is benign, expansile and bright on both T1 and T2, while a metastasis destroys bone and comes with a history. The bone window and the systemic history separate them" },
      confirmatoryExtra: ["Where METASTASIS is possible, the question is systemic before it is local: ask about a known primary, and stage with CT chest, abdomen and pelvis rather than investigating the skull base in isolation"],
      urgency: "urgent",
    },
    "Glomus tympanicum tumour": {
      slots: { level: "the ear drum on OTOSCOPY, hearing, and the facial nerve",
               flavour: "PULSATILE TINNITUS with conductive hearing loss and a RED MASS BEHIND THE EAR DRUM. The otoscope makes this diagnosis, and the important instruction is what NOT to do — a middle-ear mass must never be biopsied through the drum, because it bleeds" },
      confirmatoryExtra: ["DO NOT BIOPSY A VASCULAR MIDDLE-EAR MASS. Imaging characterises it: CT for the bone and MRI with angiography for the vascularity and the extent, and ENT sees it before anyone instruments the ear"],
    },
    "Glomus jugulare tumour (paraganglioma)": {
      slots: { level: "the LOWER CRANIAL NERVES in sequence — palate, gag, voice, shoulder shrug and tongue — with hearing and the ear drum",
               flavour: "a slowly growing vascular tumour at the jugular foramen: pulsatile tinnitus and hearing loss first, then hoarseness, dysphagia and shoulder weakness as it takes the ninth, tenth and eleventh nerves in turn. That sequence is the extent, so the nerves the patient has not mentioned are the ones to test" },
      confirmatoryExtra: [
        "SCREEN FOR CATECHOLAMINE SECRETION with plasma or urinary metanephrines BEFORE any surgery, embolisation or biopsy. A secreting paraganglioma handled without preparation can produce a hypertensive crisis on the table, and only a minority secrete — which is exactly why it must be tested rather than assumed",
        "GENETIC TESTING AND FAMILY SCREENING: a substantial proportion carry succinate dehydrogenase mutations, which predict multiple and malignant tumours and have direct implications for relatives",
        "Image for MULTIPLE paragangliomas — carotid body, vagal and contralateral jugular — rather than assuming the symptomatic one is the only one",
      ],
      bySite: {
        skull_base_ix_jugular: { level: "the gag reflex and palatal sensation, swallow, and the ear" },
        skull_base_x_jugular: { level: "VOICE and swallow, with laryngoscopy to see the cord — a vocal cord palsy is invisible without it and is a serious aspiration risk" },
        skull_base_collet_sicard: { level: "all four lower cranial nerves together — palate, gag, voice, shoulder shrug and tongue. When all four fail on one side the lesion is at the jugular foramen and the hypoglossal canal together, and that combination is the localisation" },
      },
    },
    "Glomus jugulare tumour": {
      slots: { level: "shoulder shrug and sternocleidomastoid power alongside the other lower cranial nerves, plus hearing",
               flavour: "an accessory nerve palsy from a jugular foramen mass — painless shoulder drooping and difficulty lifting the arm above the head, with scapular winging that is WORSE ON ABDUCTION, which is what separates it from a long thoracic nerve palsy" },
      confirmatoryExtra: ["Screen for catecholamine secretion with metanephrines before any intervention, and consider genetic testing — the same rules as for any paraganglioma at this site"],
    },
    "Glomus jugulare (paraganglioma)": {
      slots: { level: "the ninth, tenth and eleventh nerves as a group, and hearing — plus the ear drum, which may show the tumour",
               flavour: "the JUGULAR FORAMEN SYNDROME (Vernet's) is what this produces when it is large: palate, voice, swallow and shoulder failing together on one side. The syndrome names the foramen, and the imaging then names the lesion" },
      confirmatoryExtra: ["Metanephrines before intervention, imaging for further paragangliomas, and genetic counselling — the standing rules for this tumour family"],
    },
    "Carotid body tumour / paraganglioma": {
      slots: { level: "the neck lump itself, the lower cranial nerves, and the SYMPATHETIC supply — the pupil, the lid and facial sweating",
               flavour: "a painless, slowly enlarging neck mass at the carotid bifurcation that is mobile SIDE TO SIDE but not up and down, sometimes with a bruit. A Horner's or a hoarse voice means it has begun to involve what runs beside it" },
      confirmatoryExtra: [
        "IMAGE BEFORE ANYONE PUTS A NEEDLE IN IT. A pulsatile neck mass at the bifurcation must not have a fine-needle aspirate as its first investigation — duplex ultrasound with CT or MR angiography characterises it safely, and the splaying of the carotid bifurcation is close to diagnostic",
        "Metanephrines and genetic testing as for any paraganglioma, and image for multiple and bilateral tumours",
      ],
    },
    "Glomus or carotid body tumour": {
      slots: { level: "all the lower cranial nerves PLUS the sympathetic chain — this is the combination that defines the syndrome",
               flavour: "VILLARET'S SYNDROME — the four lower cranial nerves together with a HORNER'S, which places the lesion in the retroparotid space where the sympathetic chain runs alongside them. The Horner's is the extra sign that distinguishes it from a jugular foramen syndrome" },
      confirmatoryExtra: ["Metanephrines before intervention and genetic counselling afterwards; and image the whole retroparotid and carotid space rather than the foramen alone, since the syndrome says the lesion is below the skull base"],
    },
    "Schwannoma": {
      slots: { level: "the affected nerve and each of its neighbours in the same foramen",
               flavour: "a lower cranial nerve schwannoma grows slowly and takes the nerves in sequence, and unlike a paraganglioma it is not vascular — which is what CT and the enhancement pattern separate, and it decides whether embolisation is even a consideration" },
      bySite: {
        skull_base_ix_jugular: { level: "the gag reflex, palatal sensation and swallow" },
        skull_base_x_jugular: { level: "voice and swallow, with laryngoscopy to see the vocal cord" },
      },
    },
    "Schwannoma / meningioma": {
      slots: { level: "the four lower cranial nerves together, and hearing",
               flavour: "at the jugular foramen these two are separated on imaging rather than clinically: a schwannoma expands the foramen smoothly, a meningioma is dural-based with a tail and may cause hyperostosis, and a paraganglioma is intensely vascular. All three present as the same slow lower cranial neuropathy" },
    },
    "Chordoma or clival tumour": {
      slots: { level: "the TONGUE — wasting, fasciculation and deviation towards the weak side — plus the other lower cranial nerves and the eye movements",
               flavour: "a MIDLINE clival lesion eroding bone slowly, classically presenting with an isolated hypoglossal palsy or with a sixth nerve palsy. The midline origin distinguishes it from a chondrosarcoma, which arises off-centre at the petro-occipital fissure" },
      confirmatoryExtra: [
        "Chordoma is LOCALLY AGGRESSIVE despite its slow growth and its benign-sounding description, and it recurs. It needs tissue, a skull-base multidisciplinary plan, and usually maximal resection with proton or particle radiotherapy — an interval-scanning approach is the wrong one here",
        "An ISOLATED tongue wasting with no other sign is imaged along the whole course of the nerve, from the medulla through the hypoglossal canal to the neck — the canal is a small structure and a routine head scan does not resolve it",
      ],
      urgency: "urgent",
    },
    "Hearing loss with facial weakness from tumour": {
      slots: { level: "facial movement GRADED FORMALLY, hearing by audiometry, and the ear drum",
               flavour: "facial weakness together with hearing loss localises to the temporal bone, and the combination is what makes a tumour likely rather than a Bell's palsy. A facial palsy that PROGRESSES over weeks, or recurs on the same side, is imaged rather than treated again" },
      confirmatoryExtra: ["Examine the EAR AND THE PAROTID, and look at the skin of the face, scalp and ear for a previously excised or neglected malignancy — perineural spread from a skin cancer is the diagnosis this picture most often turns out to be"],
      urgency: "urgent",
    },
    "Benign parotid tumour with mass effect": {
      slots: { level: "facial movement graded branch by branch, and the parotid itself — size, mobility, tenderness, and the skin over it",
               flavour: "A BENIGN PAROTID TUMOUR DOES NOT USUALLY CAUSE FACIAL WEAKNESS, and that is the single most useful fact here: facial weakness with a parotid mass suggests MALIGNANCY until proven otherwise, whatever the lump feels like" },
      confirmatoryExtra: [
        "Ultrasound with fine-needle aspiration or core biopsy, and MRI for deep-lobe extension — the parotid is one of the few places where a needle is the right first move, in contrast to a vascular neck mass",
        "Examine the whole facial and scalp skin and the regional nodes: a parotid mass is often a METASTASIS from a skin cancer of the face or scalp rather than a primary salivary tumour",
      ],
      urgency: "urgent",
    },
    "Tumour infiltration or radiotherapy": {
      slots: { level: "TRAPEZIUS and sternocleidomastoid separately, the scapula at rest and on abduction, and the neck for scars, nodes and radiotherapy change",
               flavour: "the accessory nerve is superficial in the posterior triangle, so it is taken by nodal disease, by surgery and by radiotherapy — and the history usually names the cause. Radiation injury appears months to years after treatment and progresses slowly, where recurrent tumour is faster and usually painful" },
      confirmatoryExtra: [
        "EXAMINE THE NECK AND EXAMINE THE OLD OPERATION NOTE. Iatrogenic accessory nerve injury during a posterior triangle node biopsy is a classic and is often not recognised at the time — and it changes the answer from oncology to nerve surgery",
        "Where recurrence is possible, imaging and PET-CT rather than electrophysiology alone: nerve conduction studies show the denervation but say nothing about what caused it",
      ],
      urgency: "urgent",
    },
    "Tumour or meningeal disease at the skull base": {
      slots: { level: "EVERY cranial nerve in turn, both sides, plus the pupil — and repeat it at each review, because progression along the base is what makes the diagnosis",
               flavour: "a compressive third nerve palsy at the skull base means the PUPIL is the sign that matters, and MULTIPLE cranial neuropathies point away from a single tumour and towards meningeal disease" },
      confirmatoryExtra: [
        "WHERE SEVERAL CRANIAL NERVES ARE INVOLVED, THINK LEPTOMENINGEAL DISEASE and do a LUMBAR PUNCTURE with cytology — a single negative sample is common in a real case, so more than one is often needed. MRI with contrast of the whole neuraxis is done first to look for nodular enhancement and to exclude a mass",
        "A PROGRESSIVE cranial neuropathy WITH PAIN and a normal first scan is malignant until proven otherwise: repeat the imaging after an interval rather than reassuring on the strength of one study",
      ],
      urgency: "urgent",
    },
  }),

  // ---- ROUND 15 (tranche 3): A MASS ON A PERIPHERAL NERVE ----
  ...family("peripheral-nerve-mass", NERVE_MASS_SPINE, {
    "Ganglion, lipoma or other mass at the elbow": {
      slots: { level: "finger and thumb EXTENSION with the wrist — a posterior interosseous palsy causes finger drop with RADIAL WRIST DEVIATION and NO sensory loss, because the nerve is purely motor here",
               flavour: "the posterior interosseous nerve passes through the supinator at the arcade of Frohse, and a ganglion, lipoma or synovitis at that point produces a painless progressive finger drop with sensation entirely intact. The preserved sensation is what separates it from a radial nerve palsy higher up" },
      confirmatoryExtra: ["Consider the rheumatological cause too: elbow SYNOVITIS in rheumatoid arthritis compresses this nerve, and the finger drop is then repeatedly attributed to tendon rupture — the discriminator is that a nerve palsy still allows passive tenodesis extension"],
    },
    "Compression by tumour or haematoma": {
      slots: { level: "hip ABDUCTION and the gait — a Trendelenburg sign, with the pelvis dropping on the unsupported side",
               flavour: "the superior gluteal nerve runs through the greater sciatic notch above the piriformis, so a pelvic or gluteal mass, or a haematoma in an anticoagulated patient, compresses it there. A painless Trendelenburg gait with no back pain is not a radiculopathy" },
      confirmatoryExtra: ["IMAGE THE PELVIS, not the spine. A gluteal or pelvic mass and a retroperitoneal haematoma are both invisible on a lumbar spine MRI aimed at the discs, and the request has to say what is being looked for"],
    },
    "Endometriosis or pelvic mass (cyclical)": {
      slots: { level: "the sciatic distribution — dorsiflexion, plantarflexion and sensation below the knee — and take a MENSTRUAL history alongside it",
               flavour: "CYCLICAL sciatica, worse around menstruation, is close to specific for endometriosis on or near the nerve. It is a diagnosis made by asking one question that is almost never asked, and patients are treated for disc disease for years" },
      confirmatoryExtra: [
        "PELVIC MRI, and ask gynaecology to look specifically at the sciatic nerve and the sacral plexus — routine pelvic imaging is not reported with the nerve in mind unless the question is on the request",
        "Keep a symptom diary against the cycle for a few months where the history is suggestive but not clear-cut: the pattern is the evidence, and it cannot be seen from a single consultation",
      ],
    },
    "Ganglion cyst or nerve sheath tumour at the fibular neck": {
      slots: { level: "dorsiflexion, eversion, and — crucially — INVERSION and hip abduction, which are the muscles that separate a peroneal palsy from an L5 root lesion",
               flavour: "foot drop with a PALPABLE, tender swelling at the fibular neck, or foot drop in someone who has not been crossing their legs, losing weight or wearing a cast. An intraneural ganglion at this point is well described, is treatable, and is repeatedly labelled idiopathic compression" },
      confirmatoryExtra: ["PALPATE AND SCAN THE FIBULAR NECK. Ultrasound takes minutes and shows the cyst; a foot drop attributed to compression that does not recover as expected should have the nerve imaged rather than the diagnosis repeated"],
    },
    "Ganglion, varicosity or space-occupying lesion in the tarsal tunnel": {
      slots: { level: "sensation on the SOLE in the medial and lateral plantar distributions separately, toe flexion, and a TINEL'S sign behind the medial malleolus",
               flavour: "burning pain and numbness in the sole, often worse on standing and walking and at night. Tarsal tunnel syndrome is over-diagnosed clinically and under-investigated for its cause — and unlike carpal tunnel, a structural lesion is found in a substantial share of genuine cases" },
      confirmatoryExtra: [
        "EXCLUDE THE COMMONER EXPLANATIONS FIRST — a length-dependent polyneuropathy, particularly diabetic, plantar fasciitis and an S1 radiculopathy all give a painful sole and all are commoner than this",
        "Where the diagnosis holds, ULTRASOUND OR MRI OF THE TARSAL TUNNEL is what finds the ganglion, the varicosity or the accessory muscle — and finding it is what turns an intractable pain syndrome into an operable one",
      ],
      urgency: "routine",
    },
  }),

  // ---- HERNIATION AND RAISED INTRACRANIAL PRESSURE: signs, not diagnoses ----
  ...family("herniation-raised-icp", HERNIATION_SPINE, {
    "Mass effect with transtentorial herniation": {
      slots: { level: "conscious level, pupils and respiratory pattern",
               flavour: "the brainstem is being pushed through the tentorial hiatus — so the deficit reflects DISPLACEMENT rather than a brainstem lesion, and it is reversible if the cause is removed in time" },
    },
    "Uncal herniation": {
      slots: { level: "the PUPIL first, then eye movements and conscious level",
               flavour: "the medial temporal lobe compresses the third nerve against the tentorial edge — and because the PUPILLARY fibres run superficially, a dilating pupil precedes the ophthalmoplegia and is the earliest warning there is" },
      monitoringExtra: ["A NEW UNILATERAL DILATED PUPIL IN A DROWSY PATIENT IS HERNIATION UNTIL DISPROVED — this is the single observation that most often buys the time to intervene, and it is why pupils are checked at every set of neurological observations"],
    },
    "Partially or late-presenting compressive lesion": {
      slots: { level: "the pupil, lid and each extraocular movement of the third nerve separately",
               flavour: "the teaching that a pupil-sparing third-nerve palsy is safely microvascular holds only for a COMPLETE palsy in a vasculopath — a partial palsy, or one that progresses, needs vessel imaging whatever the pupil is doing" },
      confirmatoryExtra: ["CT or MR angiography for a posterior communicating artery aneurysm: the consequence of missing one is subarachnoid haemorrhage, which is why the threshold for imaging is low and falling"],
    },
    "Raised intracranial pressure (false localising sign)": {
      slots: { level: "eye abduction on both sides, and the discs",
               flavour: "the sixth nerve has the longest intracranial course, so it fails from PRESSURE rather than from a lesion at the point of failure — a sixth-nerve palsy therefore localises nowhere and demands that the pressure be explained" },
    },
    "Raised intracranial pressure": {
      slots: { level: "abduction, facial sensation and the ear",
               flavour: "at the petrous apex the sixth nerve is tethered under the petroclinoid ligament, which is why raised pressure catches it here — but exclude the local causes at that point too, since Gradenigo's produces the same palsy" },
    },
    "Tumour or raised intracranial pressure": {
      slots: { level: "vertical diplopia and head tilt, with the discs",
               flavour: "the fourth nerve is the thinnest and the only one to leave dorsally, so it too fails from raised pressure — and a fourth-nerve palsy with papilloedema is a pressure problem rather than a trochlear one" },
    },
  }),

  // ---- PELVIC, RETROPERITONEAL AND AXILLARY MASSES ----
  ...family("deep-cavity-mass", DEEP_MASS_SPINE, {
    "Pelvic or retroperitoneal tumour": {
      slots: { level: "hip flexion, knee extension, adduction and thigh sensation",
               flavour: "the lumbar plexus lies WITHIN the psoas, so a retroperitoneal mass reaches it early — and the psoas sign, a hip held flexed and painful to extend, is the bedside clue" },
    },
    "Pelvic malignancy (cervical, rectal, prostate, sarcoma)": {
      slots: { level: "ankle movement, hip extension, and sphincter function",
               flavour: "the sacral plexus sits on the pelvic sidewall where cervical, rectal and prostatic tumours reach it — and a lumbosacral plexopathy in a treated pelvic cancer is recurrence until proven otherwise" },
    },
    "Pelvic tumour infiltration": {
      slots: { level: "perineal sensation, sphincter tone and the anal wink",
               flavour: "the pudendal nerve runs through Alcock's canal — the functional stakes are sexual, urinary and faecal, so the history has to be asked for directly and without embarrassment" },
    },
    "Retroperitoneal tumour or abscess (psoas)": {
      slots: { level: "knee extension and the knee jerk, with anterior thigh sensation",
               flavour: "tumour and abscess occupy the same compartment with opposite treatments — FEVER and inflammatory markers separate them, and both compress the femoral nerve in the iliacus compartment where it cannot escape" },
    },
    "Pelvic tumour or obturator hernia": {
      slots: { level: "hip ADDUCTION, and sensation over the medial thigh",
               flavour: "an obturator hernia in a thin elderly woman produces medial thigh pain relieved by hip flexion (the Howship-Romberg sign) — a mechanical cause that is easy to overlook while a tumour is being sought" },
    },
    "Pelvic or gluteal tumour": {
      slots: { level: "everything below the knee, plus hamstrings and the ankle jerk",
               flavour: "a sciatic lesion in the pelvis or buttock rather than a disc — the giveaway is a deficit spanning BOTH peroneal and tibial divisions with a normal lumbar MRI" },
    },
    "Tumour or mass in the axilla": {
      slots: { level: "elbow, wrist and finger extension, with the triceps jerk",
               flavour: "a radial palsy at the AXILLA weakens triceps, which a spiral-groove palsy spares — that single muscle localises the lesion proximally and should prompt imaging of the axilla" },
    },
  }),

  // ---- NECK AND MEDIASTINAL MALIGNANCY ----
  ...family("neck-mediastinal-malignancy", NECK_MEDIASTINAL_SPINE, {
    "Neck malignancy or lymphadenopathy": {
      slots: { level: "the affected nerves, with careful palpation of the neck",
               flavour: "the retropharyngeal and carotid spaces carry the lower cranial nerves alongside the great vessels, so a neck mass takes them in combinations that name the space" },
      bySite: {
        skull_base_xii_neck:      { level: "tongue protrusion, for deviation and wasting" },
        skull_base_carotid_space: { level: "IX, X, XI, XII and the sympathetic chain — a Horner's here says the lesion is in the carotid space" },
      },
    },
    "Metastatic cervical lymphadenopathy": {
      slots: { level: "trapezius specifically — shoulder shrug and scapular position",
               flavour: "the accessory nerve runs SUPERFICIALLY through the posterior triangle, which is also why it is injured by node biopsy there — so establish whether this is the tumour or its previous surgery" },
    },
    "Mediastinal or apical lymphadenopathy": {
      slots: { level: "the pupil, lid and facial sweating",
               flavour: "a preganglionic Horner's with ANHIDROSIS over the face localises the lesion to the chest or neck rather than to the head, and points the imaging at the mediastinum" },
    },
    "Lung malignancy (left recurrent laryngeal)": {
      slots: { level: "voice, cough and swallow, with laryngoscopy",
               flavour: "the LEFT recurrent laryngeal nerve loops under the aortic arch, so a left cord palsy means the mediastinum — a normal neck scan does not begin to exclude it" },
    },
    "Thyroid malignancy or large goitre": {
      slots: { level: "voice and swallow, and the thyroid on palpation",
               flavour: "a hoarse voice with a thyroid mass suggests malignant rather than benign disease — a goitre may compress, but INVASION of the nerve implies carcinoma" },
    },
    "Oesophageal or mediastinal malignancy": {
      slots: { level: "voice and swallow together",
               flavour: "hoarseness WITH progressive dysphagia points to the mediastinum rather than the larynx — and the dysphagia is the symptom that will be attributed to age or to reflux for months" },
    },
  }),

  // ---- SINGLETONS: each has its own answer and no family to belong to ----

  // CSF-borne rather than solid: the workup is the CSF and the whole neuraxis, not a single lesion.
  "Leptomeningeal metastasis": dz("Leptomeningeal metastasis", {
    confirmatory: [
      "MRI of the WHOLE NEURAXIS with contrast BEFORE lumbar puncture — post-LP dural enhancement mimics the diagnosis exactly, so the order of tests is part of the test",
      "CSF CYTOLOGY, and repeat it: a single sample misses a substantial share, and three separate large-volume samples are the accepted standard before calling it negative",
      "Send CSF volume as large as is safe, with cell count, protein, glucose and flow cytometry where lymphoma is possible — the yield rises with volume, which is why a small sample is a wasted procedure",
      "Look for the nodular deposits and the 'sugar-coating' of the cord and cauda on the spinal sequences — a normal brain study does not exclude it, and the cauda is where the deposits are most often visible. {flavour}",
    ],
    monitoring: [
      "SAFETY NET: HYDROCEPHALUS from CSF obstruction is the treatable complication and presents as a declining conscious level rather than a focal sign — it is the thing to watch for as everything else is being staged",
      "Multiple cranial nerve palsies at different levels, with radicular symptoms, is the pattern — track them by name, since new nerves mark progression. Here, follow {level}",
      "Pain control and honest prognostication belong early here: this usually means widespread disease, and treatment is often about function and comfort rather than cure",
      "Discuss an intrathecal route with oncology if treatment is planned — and remember that anything given intrathecally will not reach disease behind a CSF block, so the block matters",
    ],
    urgency: "urgent",
    referral: "Neuro-oncology with the primary tumour team; neurosurgery for CSF diversion or an access device",
    bySite: {
      root_t10: { level: "the sensory band and any girdle pain",
                  flavour: "a thoracic radicular pattern from deposits on the roots — pain in a band, often multiple and asymmetric, which is what distinguishes it from a single compressive lesion" },
      root_l4:  { level: "knee extension, the knee jerk and thigh sensation",
                  flavour: "lumbar deposits give a patchy, asymmetric polyradiculopathy — the asymmetry across several roots is the signature" },
      root_s1:  { level: "plantarflexion and the ankle jerk, both sides",
                  flavour: "the lumbosacral roots are the commonest place to SEE the deposits, so image the cauda even when the symptoms are cranial" },
      root_s3:  { level: "saddle sensation and sphincter function",
                  flavour: "sacral deposits threaten the sphincters, and this is where the deficit is least likely to recover" },
    },
  }),

  // Not a malignancy at all — an erosive keratinising lesion. It sits here because it is the mass at the
  // ear that must not be mistaken for one, and because its complications are the dangerous part.
  "Cholesteatoma": dz("Cholesteatoma", {
    confirmatory: [
      "OTOSCOPY IS THE DIAGNOSIS: a retraction pocket or attic crust with painless, offensive, chronically discharging ear — and the discharge is what the patient reports, so the drum must actually be examined rather than treated blind",
      "CT temporal bones defines the EROSION — ossicles, the facial canal, the lateral semicircular canal and the tegmen — and that is what determines the operation",
      "MRI (diffusion-weighted) distinguishes residual or recurrent cholesteatoma from granulation and fluid after surgery, which CT cannot do",
      "Audiometry to document the conductive loss, and examine {level} — a facial palsy here means erosion into the facial canal and changes the urgency completely",
    ],
    monitoring: [
      "SAFETY NET: the danger is not the lesion but its COMPLICATIONS — facial palsy, labyrinthine fistula with vertigo, and intracranial spread to meningitis, a temporal lobe abscess or sinus thrombosis. New headache, fever or vertigo in a chronically discharging ear is an emergency",
      "It is locally destructive but BENIGN — so the framing to the patient is surgical cure rather than cancer, while being clear that it will not resolve medically",
      "Recurrence is common and follow-up is long-term, with imaging or second-look surgery depending on what was done",
    ],
    urgency: "urgent",
    referral: "ENT — definitive treatment is surgical; urgent if there is facial palsy, vertigo or any intracranial feature",
    bySite: {
      skull_base_vii_tympanic: { level: "facial movement AND taste on the anterior tongue, with the stapedial reflex",
                                 flavour: "in the tympanic segment the lesion sits against the horizontal facial canal — taste and hyperacusis localise it above the stylomastoid foramen" },
      skull_base_vii_mastoid:  { level: "facial movement, with the ear and mastoid for tenderness and discharge",
                                 flavour: "mastoid involvement means the disease has eroded posteriorly — check for a post-auricular swelling and for the tenderness that signals coalescent mastoiditis" },
    },
  }),

  // A tumour whose neurology is a paraneoplastic autoimmune syndrome, not compression.
  "Thymoma": dz("Thymoma", {
    confirmatory: [
      "CT CHEST looking specifically at the ANTERIOR MEDIASTINUM — this is not part of a standard neurological work-up and has to be requested deliberately, in every newly diagnosed myasthenic",
      "Acetylcholine receptor antibodies, and MuSK where they are negative; neurophysiology with repetitive stimulation and single-fibre EMG where the diagnosis is not secure",
      "Examine {level} — and test for FATIGABILITY rather than absolute weakness, since that is what distinguishes this and it is missed on a single static examination",
      "Screen for the associated autoimmune disease that travels with it, thyroid disease in particular, and for the red cell aplasia and hypogammaglobulinaemia thymoma can cause",
    ],
    monitoring: [
      "SAFETY NET: MYASTHENIC CRISIS is the emergency — monitor FORCED VITAL CAPACITY, not oxygen saturation, because saturation falls late and by then the patient is in trouble. Bulbar weakness with a falling FVC needs critical care involvement before it becomes an intubation in extremis",
      "Track {level} and the bulbar functions — swallow and voice — at every review",
      "THYMECTOMY is part of the treatment of the myasthenia and not only of the tumour, so it is a neurological decision as much as a surgical one",
      "Be alert to the drugs that unmask or worsen myasthenia, including several common antibiotics — a deterioration after a new prescription is a recognised pattern rather than a coincidence",
    ],
    urgency: "urgent",
    referral: "Neurology with thoracic surgery; critical care early if the vital capacity is falling",
  }),

  // The diagnosis that is treated as inflammatory and is actually a mass.
  "Compressive optic neuropathy masquerading as neuritis": dz("Compressive optic neuropathy masquerading as neuritis", {
    confirmatory: [
      "MRI ORBITS AND CHIASM with contrast and FAT SATURATION — the study that separates them, and the one that is skipped when the picture is assumed to be optic neuritis",
      "THE FEATURES THAT SHOULD STOP YOU CALLING IT NEURITIS: painless loss, slowly PROGRESSIVE rather than nadir-and-recovery, an older patient, optic atrophy already present at first assessment, or optociliary shunt vessels on the disc",
      "Examine {level} — acuity, colour vision, the pupil and formal fields — and look at the OTHER eye, since a chiasmal lesion produces a subtle contralateral defect that confirms the site",
      "Consider the compressive causes by frequency: meningioma of the sheath or sphenoid wing, pituitary adenoma, aneurysm, and thyroid eye disease at the orbital apex",
    ],
    monitoring: [
      "SAFETY NET: optic neuritis should RECOVER. Vision that fails to improve over the expected weeks, or continues to deteriorate, means reimaging rather than a further course of steroids",
      "Steroids may transiently improve a compressive lesion too, so a response does NOT confirm an inflammatory cause — this is the trap that costs the most time",
      "Track {level} formally at defined intervals; compressive visual loss becomes irreversible, so the interval between assessments is itself part of the prognosis",
    ],
    urgency: "urgent",
    referral: "Neuro-ophthalmology, with neurosurgery or the pituitary team as the lesion dictates",
  }),

  // ---- INTRA-AXIAL TUMOUR ----
  ...family("intra-axial-tumour", INTRAAXIAL_SPINE, {
    // ---- ROUND 15 (tranche 3): THE REST OF THE PARENCHYMAL MASSES ----
    // Tranche 2 authored the intra-axial tumours that kill quickly. These are the same argument at the
    // remaining sites, and the divergence is anatomical: what the mass sits next to decides what is lost
    // first, whether it can be biopsied at all, and whether the swelling or the tumour is the emergency.
    "Tumour / metastasis": {
      slots: { level: "the deficit and the conscious level together",
               flavour: "at a deep or brainstem site the DIFFERENTIAL diagnosis matters more than usual, because a lesion here may not be biopsiable — so demyelination, abscess and lymphoma have to be argued out on imaging and serology rather than settled with tissue" },
      bySite: {
        midbrain_lateral: { level: "the third nerve, the pupil, and contralateral coordination and power",
                            flavour: "a midbrain mass declares itself through crossed signs and is close to the aqueduct — so HYDROCEPHALUS is the complication with the shorter clock, and the ventricles are looked at on every scan" },
        midbrain_hemi: { level: "conscious level, the pupils and all four limbs",
                         flavour: "a large midbrain lesion threatens the aqueduct and the ARAS together, so a falling conscious level here is either hydrocephalus or the lesion itself, and the scan has to answer which" },
        medulla_hemi: { level: "SWALLOW AND RESPIRATION before anything else, then the long tracts",
                        flavour: "the medulla contains the respiratory and swallowing centres, so a mass here endangers airway and breathing long before it produces impressive limb signs" },
        visual_pathway_lgn: { level: "the visual field formally in each eye, and the pupils",
                              flavour: "a lesion at the lateral geniculate is small, deep and adjacent to the internal capsule — the field defect may be the only sign, and it will be missed unless perimetry is requested" },
        subcortex_anterior_choroidal: { level: "power, sensation and the field, plus language and neglect to confirm the cortex is spared",
                                        flavour: "a small deep mass in this territory reproduces the anterior choroidal stroke syndrome, and the discriminator is the tempo — weeks rather than minutes" },
      },
    },
    "Thalamic tumour or metastasis": {
      slots: { level: "the deficit, the conscious level, and cognition — which is what a thalamic lesion takes and what is least often tested",
               flavour: "the thalamus sits against the third ventricle, so HYDROCEPHALUS is the complication to look for on every scan; and a thalamic lesion is deep, eloquent and often approached by BIOPSY rather than resection, which makes the differential with lymphoma and demyelination matter more" },
      confirmatoryExtra: ["A bilateral or midline thalamic picture in an immunosuppressed or older patient raises PRIMARY CNS LYMPHOMA — and steroids given before biopsy can dissolve the diagnosis, which is why they are discussed with neurosurgery first rather than started on the ward"],
      bySite: {
        thalamus_vl: { level: "the tremor and any dystonic posturing, alongside power and coordination" },
        thalamus_pulvinar: { level: "NEGLECT and visual attention — test extinction on double simultaneous stimulation, which is what a pulvinar lesion takes" },
        thalamus_limbic: { level: "MEMORY formally, and behaviour from an informant — an anterior or dorsomedial thalamic lesion presents as amnesia and is regularly admitted as a psychiatric illness" },
        aphasia_subcortical_thalamic: { level: "fluency, comprehension and REPETITION, tested when the patient is fully alert",
                                        flavour: "a thalamic aphasia fluctuates with arousal, so the deficit recorded in a drowsy patient will be recorded as far worse than it is — and the same lesion is next to the third ventricle, so the ventricles are checked too" },
      },
    },
    "Small metastasis / glioma": {
      slots: { level: "the focal deficit, and whether anything else is failing alongside it",
               flavour: "a SMALL deep lesion in an eloquent place: the deficit is out of all proportion to the size, which is why it is repeatedly assumed to be a stroke until the tempo or the contrast enhancement says otherwise" },
      confirmatoryExtra: ["The commonest error at these sites is a lesion read as a lacunar stroke on a plain CT. A deficit that PROGRESSES over days to weeks, or enhances, is not a lacune — and CONTRAST is what settles it"],
      bySite: {
        subcortex_internal_capsule: { level: "power in face, arm and leg, and the absence of cortical signs" },
        subcortex_corona_radiata: { level: "power, and the surrounding white matter for oedema, which at this site produces far more deficit than the lesion does" },
        subcortex_thalamus: { level: "sensation across face, arm and leg, plus arousal and memory" },
        subcortex_sensorimotor: { level: "power AND sensation together, with the cortical functions that should be spared" },
      },
    },
    "Tumour (glioma / metastasis)": {
      slots: { level: "the focal deficit and the surrounding function that is still intact",
               flavour: "a hemispheric lesion where the EDGE matters as much as the centre: eloquent cortex nearby decides whether resection is possible, so the pre-operative mapping question is asked at the first discussion rather than at the last" },
      bySite: {
        subcortex_optic_radiation: { level: "the visual QUADRANTS formally — a lesion in the radiation can present with a field defect the patient has not noticed" },
        cortex_operculum: { level: "language in full — fluency, comprehension, repetition and naming — plus face and arm power",
                            flavour: "this is dominant-hemisphere language cortex, so awake mapping and functional imaging bear directly on what can be removed; the language assessment before surgery is a baseline as well as a description" },
      },
    },
    "Midbrain tumour / metastasis": {
      slots: { level: "the pupil, vertical gaze and the third nerve, with contralateral power",
               flavour: "a paramedian midbrain mass gives crossed signs and sits at the aqueduct — hydrocephalus is the shorter clock, and this location is often biopsy-only, so the imaging differential has to be worked properly" },
    },
    "Lateral medullary tumour / metastasis": {
      slots: { level: "SWALLOW above all, plus the crossed sensory pattern and Horner's",
               flavour: "a slow lateral medullary syndrome — the same picture as the PICA stroke, separated only by a tempo of weeks rather than minutes, which is the history to take carefully" },
      monitoringExtra: ["NIL BY MOUTH UNTIL FORMALLY ASSESSED: the dysphagia of a lateral medullary lesion is far worse than the rest of the examination suggests, and aspiration is what causes harm while the tumour is being investigated"],
    },
    "Medullary tumour / metastasis": {
      slots: { level: "the tongue, respiration and the long tracts",
               flavour: "a medial medullary mass takes the hypoglossal nucleus and the pyramid together — and at this level RESPIRATORY function is part of the neurological examination rather than a separate observation" },
    },
    "Pontine glioma (esp. children)": {
      slots: { level: "the cranial nerves individually, the long tracts, and gait",
               flavour: "a DIFFUSE INTRINSIC PONTINE GLIOMA in a child is diagnosed on MRI appearance and clinical picture; the classic triad is cranial neuropathies, long-tract signs and ataxia developing over weeks" },
      confirmatoryExtra: [
        "REFER TO A PAEDIATRIC NEURO-ONCOLOGY CENTRE IMMEDIATELY rather than completing the work-up locally — the imaging is characteristic, biopsy practice is centre-specific and now often molecularly driven, and trial access matters here more than in almost any other tumour",
        "A child with a short history of squint, facial weakness or a clumsy gait is imaged rather than watched; the interval between the first symptom and the diagnosis in this tumour is routinely measured in months",
      ],
      monitoringExtra: ["The prognosis is poor and the family will ask directly. Honest, senior, unhurried conversation from the outset — and early palliative involvement alongside active treatment rather than after it — is the standard of care, not a concession"],
      urgency: "emergency",
    },
    "Pontine glioma": {
      slots: { level: "eye movements, facial power and sensation, swallow, and the long tracts",
               flavour: "an intrinsic pontine mass expands the pons and takes the cranial nerve nuclei with the long tracts, which is what makes the picture unmistakably intra-axial rather than compressive" },
    },
    "Pontine glioma / metastasis": {
      slots: { level: "power against coordination — ataxia OUT OF PROPORTION to the weakness — plus speech and swallow",
               flavour: "a ventral pontine lesion produces the same ataxic hemiparesis as a basis pontis lacune, and the tempo is the discrimination: a deficit that accumulates over weeks is not a lacune" },
    },
    "Cerebellopontine angle tumour": {
      slots: { level: "HEARING and facial SENSATION together, plus the corneal reflex and the facial nerve",
               flavour: "a CPA mass takes the fifth and eighth nerves before the seventh — and a DEPRESSED CORNEAL REFLEX is the earliest reliable sign of a large one, which is why it is tested rather than assumed" },
      confirmatoryExtra: [
        "MRI WITH DEDICATED INTERNAL AUDITORY MEATUS SEQUENCES, and AUDIOMETRY: asymmetric sensorineural hearing loss is the presenting feature, and audiometry both documents it and guides whether hearing can be preserved",
        "FACIAL WEAKNESS IS UNUSUAL IN A VESTIBULAR SCHWANNOMA even when it is large — so facial weakness at the CPA argues for a facial schwannoma, a meningioma or a malignant lesion instead, and it changes the differential rather than confirming it",
      ],
      bySite: {
        pons_lateral_trigeminal: { level: "facial sensation in all three divisions and the corneal reflex, with hearing" },
        pons_trigeminal: { level: "facial sensation, the corneal reflex, and the muscles of mastication — a numb face with a weak jaw points at the trigeminal nerve itself rather than at compression from outside" },
      },
    },
    "Cerebellopontine angle tumour (vestibular schwannoma, meningioma)": {
      slots: { level: "hearing, facial sensation, the corneal reflex, and gait",
               flavour: "the two commonest lesions here differ on imaging rather than at the bedside — a schwannoma widens the internal auditory meatus and a meningioma is dural-based with a tail — and that difference decides the operation" },
      confirmatoryExtra: ["Audiometry before anything else: the hearing that remains at diagnosis is what any hearing-preserving treatment is trying to keep, and it must be documented rather than described"],
    },
    "Paraneoplastic or posterior-fossa tumour": {
      slots: { level: "eye movements and gaze holding, gait, and the long tracts",
               flavour: "two very different diseases share this site, and they separate on TEMPO and on imaging: a mass is visible, while a paraneoplastic syndrome shows little or nothing on the scan and needs antibodies and a hunt for a cancer instead" },
      confirmatoryExtra: ["Where the MRI is unremarkable, send PAIRED SERUM AND CSF antibody panels and look for the tumour — a negative panel does not exclude the syndrome, and the cancer can precede its discovery by a year or more"],
    },
    "Bilateral thalamic glioma": {
      slots: { level: "CONSCIOUS LEVEL AND AROUSAL above the focal signs — a bithalamic lesion presents as hypersomnolence or as an apparent psychiatric illness rather than as a hemiparesis",
               flavour: "a bilateral thalamic mass is a short differential and a difficult one: bithalamic glioma, primary CNS lymphoma, deep venous thrombosis with venous infarction, and an artery of Percheron stroke. The tempo and the venous imaging separate them" },
      confirmatoryExtra: [
        "IMAGE THE DEEP VENOUS SYSTEM — a venogram is what excludes internal cerebral vein or straight sinus thrombosis, which is treatable and looks identical on a plain scan",
        "Watch the ventricles: a bithalamic mass obstructs the third ventricle, and the hydrocephalus is the emergency while the tumour is the diagnosis",
      ],
      urgency: "emergency",
    },
    "Brainstem tumour or trauma": {
      slots: { level: "the tremor — a Holmes tremor is present at REST, on POSTURE and on ACTION, which no other tremor is — plus the eye movements",
               flavour: "a lesion in the Guillain-Mollaret triangle, and the two candidates carry entirely different histories: a mass grows over weeks to months, while trauma has a moment attached to it. Ask for that moment before imaging" },
      urgency: "urgent",
    },
    "Tumour or surgical injury": {
      slots: { level: "the PALATE at rest with the mouth open, plus limb coordination and gait",
               flavour: "palatal tremor from a lesion in the triangle — and a PREVIOUS POSTERIOR FOSSA OPERATION is the history that explains it without any new pathology, so the operation notes are worth more here than another scan" },
      confirmatoryExtra: ["Review any prior imaging and operative record before investigating anew: symptomatic palatal tremor appears WEEKS TO MONTHS after the causative lesion, so the responsible event is usually already documented"],
      urgency: "urgent",
    },
    "Small metastasis or glioma": {
      slots: { level: "sensation in the FACE and hand, and power, to confirm it is spared",
               flavour: "an isolated hemisensory or cheiro-oral picture from a lesion a few millimetres across. The size explains why it is missed on a plain CT and why contrast is needed to see it at all" },
    },
    "Tumour or demyelination": {
      slots: { level: "the involuntary movements and their amplitude, plus power and tone",
               flavour: "a subthalamic lesion presenting with hemiballismus, and the two candidates diverge sharply on treatment: a demyelinating plaque in a younger patient with other lesions and a suggestive history, against a mass with progressive growth" },
      confirmatoryExtra: ["Where demyelination is plausible, image the whole neuraxis and consider CSF oligoclonal bands before any biopsy — a solitary tumefactive plaque is a well-recognised cause of an unnecessary brain biopsy"],
    },
    "Deep tumour or metastasis": {
      slots: { level: "language in full, plus power — a striatocapsular lesion produces an aphasia that is often better than the imaging predicts",
               flavour: "a deep dominant-hemisphere mass. Language deficits from subcortical lesions fluctuate and recover more than cortical ones do, so the baseline has to be recorded properly if any change is to be interpretable" },
    },
    "Frontal tumour / metastasis": {
      slots: { level: "conjugate GAZE — deviation towards the lesion, and whether it overcomes with the oculocephalic manoeuvre — plus behaviour and executive function",
               flavour: "a frontal mass is the tumour that presents to psychiatry: apathy, disinhibition or a personality change months before any weakness, with the family noticing long before the patient does" },
      confirmatoryExtra: ["Ask an INFORMANT about behaviour and personality. A frontal tumour with a normal neurological examination is common, and the history is the only abnormal finding until it is not"],
    },
    "Low-grade glioma": {
      slots: { level: "speech, and the AUTONOMIC observations — blood pressure, rhythm and conscious level — which the insula affects out of proportion",
               flavour: "insular low-grade gliomas typically present with SEIZURES in a young adult with an otherwise normal examination, and they grow slowly enough that the surgical decision is about long-term function rather than about the next few weeks" },
      confirmatoryExtra: [
        "MOLECULAR MARKERS DRIVE THE PROGNOSIS AND THE TREATMENT in low-grade glioma far more than the histological grade alone, so the specimen and the discussion belong in a neuro-oncology centre from the start",
        "The decision here is genuinely difficult: extensive early resection improves outcome, and the insula is surrounded by language, motor and vascular structures. That trade-off is a multidisciplinary conversation, not a single surgeon's judgement",
      ],
      urgency: "routine",
    },
    "Small tumour or metastasis": {
      slots: { level: "CORTICAL sensation in the hand — two-point discrimination, stereognosis and graphaesthesia — with primary modalities intact",
               flavour: "a small postcentral lesion gives cortical sensory loss with normal pinprick, which is dismissed as functional more often than it is investigated. The preserved primary modalities are the finding, not the reassurance" },
    },
    "Glioma of the medial frontal lobe": {
      slots: { level: "initiation and spontaneous movement of the contralateral arm, plus leg power and continence",
               flavour: "a medial frontal mass presents as akinesia, mutism or reduced initiation — the patient moves to command but not spontaneously — and it is repeatedly investigated as depression or as a cord lesion because both legs can be involved" },
    },
    "Bilateral tumour or metastases": {
      slots: { level: "HEARING formally by audiometry, and comprehension of speech against comprehension of writing",
               flavour: "cortical deafness requires BOTH superior temporal lobes, so a single lesion does not explain it — which makes bilateral disease, and therefore metastases, the leading explanation and a search for the primary the first move" },
      confirmatoryExtra: ["Multiple lesions means metastatic until proven otherwise: CT chest, abdomen and pelvis to find the primary BEFORE any brain biopsy is considered"],
    },
    "Glioma / metastasis presenting with a large hemispheric deficit": {
      slots: { level: "conscious level alongside the focal deficit — and the pupils, which is where deterioration will show first",
               flavour: "a large hemispheric mass with surrounding oedema. The OEDEMA usually causes more deficit than the tumour, which is why steroids can produce a striking improvement that is not a change in the tumour at all" },
      confirmatoryExtra: ["Where PRIMARY CNS LYMPHOMA is possible — an immunosuppressed patient, deep periventricular lesions, marked enhancement — DISCUSS WITH NEUROSURGERY BEFORE GIVING STEROIDS. A lesion treated first can become unbiopsiable and the diagnosis is then lost for weeks"],
      urgency: "emergency",
    },
    "Tumour of the SMA / medial frontal region": {
      slots: { level: "PROXIMAL arm and leg power, initiation, and speech output",
               flavour: "a medial frontal mass reproduces the anterior watershed man-in-a-barrel pattern, and the discrimination from hypoperfusion is the tempo plus the absence of a haemodynamic event" },
      confirmatoryExtra: ["Post-operative SMA SYNDROME — profound akinesia and mutism after resection here — is expected and usually recovers substantially, so warning the patient and family in advance prevents a successful operation being experienced as a catastrophe"],
    },
    "Small metastasis or demyelinating plaque": {
      slots: { level: "whether the hand weakness respects any nerve or root distribution, and the reflexes on that side",
               flavour: "the pseudo-peripheral cortical hand again, but subacute: isolated hand weakness that fits no single nerve. Two very different diseases produce it here, and they separate on age, on the rest of the neuraxis, and on whether the lesion enhances as a ring" },
      confirmatoryExtra: ["Image the WHOLE NEURAXIS and consider CSF oligoclonal bands before any biopsy — a tumefactive demyelinating plaque is one of the classic reasons a brain biopsy is performed unnecessarily"],
    },
    "Metastasis / haemangioblastoma": {
      slots: { level: "limb coordination, gait, and the CONSCIOUS LEVEL — posterior fossa swelling is what threatens life here",
               flavour: "a cerebellar mass sits in a rigid compartment next to the fourth ventricle, so HYDROCEPHALUS and brainstem compression are the emergencies while the tumour is the diagnosis. Those are different clocks and the shorter one is measured in hours" },
      confirmatoryExtra: [
        "HAEMANGIOBLASTOMA RAISES VON HIPPEL-LINDAU DISEASE, particularly in a younger patient or with multiple lesions: image the whole neuraxis and the abdomen for renal cell carcinoma and phaeochromocytoma, and refer for genetic counselling. It is a family diagnosis, not just this patient's",
        "A solitary cerebellar metastasis in a patient with controlled systemic disease may still be resected with real benefit — so a metastatic label is not by itself a reason to stop investigating",
      ],
      monitoringExtra: ["SAFETY NET: a falling conscious level with a posterior fossa mass is an emergency for NEUROSURGERY, not for observation — the deterioration from fourth-ventricle obstruction can be very fast"],
      urgency: "emergency",
    },
    "Posterior fossa tumour": {
      slots: { level: "gaze holding, the nystagmus in each direction, gait and truncal stability",
               flavour: "a mass at the vestibular nuclei produces central vestibular signs — direction-changing or gaze-evoked nystagmus, skew, and truncal ataxia too severe to sit unsupported — none of which belong to a peripheral labyrinthine problem" },
      confirmatoryExtra: ["MRI rather than CT: the posterior fossa is where CT is at its least useful, and a normal CT in a patient with central vestibular signs is not an answer"],
    },
    "Butterfly glioma or lymphoma": {
      slots: { level: "cognition, personality and any disconnection signs",
               flavour: "a lesion crossing the CORPUS CALLOSUM narrows the field sharply — glioblastoma and CNS lymphoma are the two that do this, and lymphoma is the one that MELTS with steroids, taking the histology with it" },
      confirmatoryExtra: ["HIV testing and an ophthalmology slit-lamp examination for vitreoretinal involvement: CNS lymphoma can sometimes be diagnosed from the eye or the CSF without a brain biopsy at all"],
      bySite: {
        corpus_callosum_anterior: { level: "left-hand apraxia to command, and agraphia" },
        corpus_callosum_splenium: { level: "reading, and any left-sided visual naming failure" },
      },
    },
    "Brainstem glioma": {
      slots: { level: "eye movements, facial power, swallow and the long tracts",
               flavour: "in the brainstem the appearance often stands as the diagnosis, because biopsy carries real risk — a diffuse expanding pontine lesion in a child is treated on imaging alone" },
      confirmatoryExtra: ["Biopsy here is a considered decision rather than a default step: discuss with neurosurgery whether the histology would actually change management before accepting the risk"],
    },
    "Frontal tumour (glioma, meningioma, metastasis)": {
      slots: { level: "executive function and personality, which the family notices long before the patient does",
               flavour: "the contrast pattern separates the three named here — and it matters, because a meningioma is extra-axial and often curable while the other two are not" },
      monitoringExtra: ["Take a COLLATERAL history: frontal tumours present as changed behaviour, apathy or poor judgement, and are repeatedly managed as depression or early dementia for months"],
    },
    "Frontal glioma or metastasis": {
      slots: { level: "smell, personality and executive function",
               flavour: "an orbitofrontal lesion — test SMELL, which is almost never examined and is the sign that localises this to the floor of the anterior fossa" },
    },
    "Large tumour or metastasis with oedema": {
      slots: { level: "language and conscious level",
               flavour: "the OEDEMA rather than the tumour is usually what produces the deficit here, which is why the response to steroids can be dramatic and can also mislead about the underlying lesion" },
      monitoringExtra: ["Watch for midline shift and herniation as you would for a large haematoma — and remember that improvement on steroids is symptomatic relief, not treatment of the tumour"],
    },
    "Medulloblastoma": {
      slots: { level: "truncal stability, and conscious level for hydrocephalus",
               flavour: "a midline posterior-fossa tumour in a CHILD, obstructing the fourth ventricle — morning headache and vomiting with truncal ataxia, and the vomiting is often treated as gastroenteritis first" },
      confirmatoryExtra: ["Image the WHOLE NEURAXIS and send CSF cytology: medulloblastoma seeds the CSF, and staging determines treatment from the outset"],
      urgency: "emergency",
      bySite: {
        cerebellum_vermis:          { level: "truncal ataxia, which can leave the limbs almost normal" },
        cerebellum_flocculonodular: { level: "gait, nystagmus and conscious level" },
      },
    },
    "Fourth ventricular ependymoma": {
      slots: { level: "conscious level, gait, and the lower cranial nerves",
               flavour: "arising from the ventricular floor and growing to fill it — it characteristically extrudes through the foramina like toothpaste, which is what distinguishes it on imaging" },
      confirmatoryExtra: ["Whole-neuraxis imaging and CSF cytology, as for any tumour with access to the CSF; and the extent of resection is the strongest prognostic factor, so the operative plan matters"],
      urgency: "emergency",
    },
  }),

  // ---- MENINGIOMA AND THE DURAL MIMICS ----
  ...family("meningioma-dural", MENINGIOMA_SPINE, {
    // ---- ROUND 15 (tranche 3): the rest of the dural / extra-axial masses ----
    "Parasagittal meningioma": {
      slots: { level: "LEG power and cortical sensation in the leg, continence, and the gait",
               flavour: "leg-predominant weakness — often BOTH legs, since the lesion sits on the midline and takes both medial motor strips — with incontinence and no sensory level. It is a classic reason a brain lesion is investigated as a cord one, and the spine MRI comes back normal" },
      confirmatoryExtra: [
        "WHERE BOTH LEGS ARE WEAK AND THE SPINE IS NORMAL, IMAGE THE BRAIN. A parasagittal mass is the lesion this rule exists for, and the delay is otherwise measured in months",
        "Assess the SUPERIOR SAGITTAL SINUS specifically: involvement of its posterior third governs what can safely be resected and is the commonest reason a parasagittal meningioma is not simply removed",
      ],
      bySite: {
        cortex_aca: { level: "both legs, continence, initiation, and the grasp reflex" },
        cortex_motor_leg: { level: "leg power on each side separately — asymmetry is common even when both are involved" },
        cortex_sensory_leg: { level: "CORTICAL sensation in the leg — two-point discrimination and graphaesthesia — with primary modalities preserved" },
      },
    },
    "Parasagittal metastasis": {
      slots: { level: "leg power and continence, with the conscious level",
               flavour: "the same address and a different disease: a dural metastasis grows in weeks rather than years, is often multiple, and carries far more surrounding OEDEMA than a meningioma of the same size. That oedema and the tempo are what distinguish it on the scan" },
      confirmatoryExtra: [
        "A dural-based lesion is NOT automatically a meningioma. Rapid growth, marked oedema, bone DESTRUCTION rather than hyperostosis, or a known primary all argue for metastasis or lymphoma, and that means tissue rather than an interval scan",
        "Stage the patient: CT chest, abdomen and pelvis for the primary, and image the rest of the brain for further deposits before planning anything local",
      ],
      urgency: "urgent",
    },
    "Meningioma (tuberculum sellae)": {
      slots: { level: "ACUITY, COLOUR VISION and FORMAL FIELDS in each eye, the pupils and the discs — plus the pituitary axis",
               flavour: "a suprasellar meningioma compresses the chiasm from below and in FRONT, which classically produces a JUNCTIONAL scotoma — a central defect in one eye with a superior temporal defect in the other — rather than a clean bitemporal hemianopia. That asymmetry is why it is repeatedly diagnosed as unilateral optic neuritis" },
      confirmatoryExtra: [
        "PERIMETRY IN BOTH EYES, EVERY TIME. A junctional scotoma is only visible if the apparently good eye is tested, and an eye recorded as normal by confrontation is the reason this diagnosis is missed",
        "Unlike a pituitary adenoma, the endocrine axis is usually intact here — so normal pituitary bloods do not exclude a suprasellar mass, and the fields still decide",
      ],
      urgency: "urgent",
    },
    "Optic nerve sheath meningioma": {
      slots: { level: "acuity, colour vision, fields and the pupils, plus the DISC and any proptosis — and look for OPTOCILIARY SHUNT VESSELS on the disc",
               flavour: "the triad is slowly progressive visual loss, optic ATROPHY and optociliary shunt vessels, usually with mild proptosis in a middle-aged woman. Imaging shows TRAM-TRACK enhancement of the sheath around a normal nerve, which is close to diagnostic and has to be asked for on a dedicated orbital study" },
      confirmatoryExtra: ["Surgery to remove it usually SACRIFICES THE VISION in that eye, because the tumour and the nerve share a blood supply — which is why fractionated radiotherapy has become the treatment that preserves sight, and why observation is reasonable while vision is good"],
      urgency: "urgent",
    },
    "Olfactory groove meningioma": {
      slots: { level: "SMELL FORMALLY in each nostril, the visual fields and the discs in both eyes, and behaviour and executive function from an INFORMANT",
               flavour: "FOSTER KENNEDY SYNDROME is the classic: optic ATROPHY in the eye on the side of the tumour from direct compression, with PAPILLOEDEMA in the other from raised pressure. These tumours grow very large before diagnosis because anosmia and a personality change are not what anyone brings to a doctor" },
      confirmatoryExtra: [
        "TEST SMELL IN EACH NOSTRIL SEPARATELY. It is almost never done, it is the earliest sign, and by the time the frontal or visual features appear the tumour is usually enormous",
        "Examine BOTH FUNDI before concluding anything about the vision: the Foster Kennedy picture only exists if the second eye is looked at",
      ],
    },
    "Meningioma / pituitary / metastasis / perineural spread": {
      slots: { level: "each ocular motor nerve separately, the pupil, and V1 and V2 sensation — recording what is SPARED as well as what is lost, since the combination is the localisation",
               flavour: "the cavernous sinus packs several cranial nerves and the carotid into one small space, so multiple ocular motor palsies with facial sensory loss on one side localise here before any scan. What is in the sinus is then the whole question, and these four behave completely differently" },
      confirmatoryExtra: [
        "MRI WITH DEDICATED CAVERNOUS SINUS SEQUENCES AND FAT SATURATION, plus angiography — a routine head scan does not resolve this region and will be reported as normal. The angiography is what excludes an aneurysm and a carotid-cavernous fistula",
        "ASK ABOUT ANY PREVIOUS HEAD AND NECK OR FACIAL SKIN CANCER, however small and however long ago — perineural spread is a leading cause here and patients never volunteer an excised skin lesion from years back",
        "DO NOT GIVE STEROIDS AS A DIAGNOSTIC TRIAL before infection and lymphoma have been excluded: tumours and infections improve on steroids too, and a lesion treated before biopsy can become undiagnosable",
      ],
      urgency: "urgent",
    },
    "Parasagittal / falx meningioma": {
      slots: { level: "leg power in both legs, and continence",
               flavour: "a parasagittal lesion produces a LEG-predominant, often bilateral deficit that is regularly investigated as a cord problem — image the head before the spine when both legs are weak and the arms are not" },
      bySite: {
        cortex_sma:         { level: "initiation and spontaneous movement, which can look like reduced consciousness" },
        cortex_paracentral: { level: "leg power and continence together" },
      },
    },
    "Falx / parasagittal meningioma": {
      slots: { level: "personality, initiation and continence",
               flavour: "a medial frontal lesion — apathy and incontinence with relatively preserved power, which is repeatedly attributed to depression or to age" },
    },
    "Subfrontal / olfactory groove meningioma": {
      slots: { level: "SMELL, formally, plus acuity and personality",
               flavour: "the classic FOSTER KENNEDY syndrome — ipsilateral optic atrophy with contralateral papilloedema, plus anosmia. Rare intact, but each component is worth seeking because together they are close to diagnostic" },
      confirmatoryExtra: ["Fundoscopy of BOTH discs explicitly: a pale disc on one side and a swollen one on the other is the finding, and it is only visible if both are examined"],
      urgency: "urgent",
    },
    "Falx metastasis or lymphoma": {
      slots: { level: "leg power and continence",
               flavour: "a dural lesion that is NOT a meningioma — no dural tail, bone destroyed rather than hyperostotic, and oedema out of proportion. That combination should prompt tissue rather than surveillance" },
      urgency: "urgent",
    },
  }),

  // ---- SELLAR / SUPRASELLAR / HYPOTHALAMIC ----
  ...family("sellar-hypothalamic", SELLAR_SPINE, {
    // ---- ROUND 15 (tranche 3): the rest of the sellar / suprasellar / optic-pathway masses ----
    "Pituitary macroadenoma": {
      slots: { level: "FORMAL VISUAL FIELDS and colour vision in each eye, plus the endocrine axis",
               flavour: "the classic chiasmal lesion. A BITEMPORAL defect begins in the SUPERIOR temporal quadrants and is missed at the bedside routinely, so perimetry is the test — and a PROLACTINOMA is the one large pituitary tumour treated with a drug rather than an operation, which is why prolactin is measured before anyone books theatre" },
      confirmatoryExtra: ["MEASURE PROLACTIN, and interpret a modestly raised value carefully: stalk compression by any sellar mass raises it a little, while a true prolactinoma raises it a great deal. Getting that backwards means operating on a tumour that would have shrunk on medical treatment"],
    },
    "Pituitary macroadenoma with suprasellar extension": {
      slots: { level: "the fields in each eye separately, watching for INCONGRUITY, plus acuity, colour and the endocrine axis",
               flavour: "extension beyond the chiasm onto the optic TRACT gives an incongruous homonymous defect rather than a bitemporal one — an unusual pattern that is easily misread as a hemisphere lesion, and it means the tumour is larger than a simple chiasmal compression" },
      confirmatoryExtra: ["Prolactin first, as for any macroadenoma; and assess how far the suprasellar extension has gone, since that determines whether the tumour can be reached through the nose or needs a transcranial approach"],
    },
    "Pituitary macroadenoma with stalk compression": {
      slots: { level: "SODIUM, fluid balance and thirst alongside the fields and the full pituitary axis",
               flavour: "stalk compression releases prolactin from normal inhibition — the STALK EFFECT — so the prolactin rise is modest, unlike the very high level of a true prolactinoma. Confusing the two leads to medical treatment of a tumour that will not shrink" },
      confirmatoryExtra: ["ASK ABOUT THIRST AND NOCTURIA and check the sodium: diabetes insipidus is unusual in a simple adenoma and points instead to a stalk or hypothalamic lesion — germinoma, histiocytosis, hypophysitis or metastasis — which changes the differential entirely"],
    },
    "Suprasellar tumour (craniopharyngioma, germinoma, glioma)": {
      slots: { level: "the fields, the full pituitary axis, SODIUM and thirst — and in a child, GROWTH AND PUBERTY plotted on a chart, which is the most sensitive measure available",
               flavour: "three tumours share this address and diverge completely on treatment: a craniopharyngioma is surgical and calcifies, a germinoma is exquisitely radio- and chemosensitive and must not be resected blindly, and a glioma is often watched. Tissue and tumour markers decide, not the scan alone" },
      confirmatoryExtra: [
        "SEND TUMOUR MARKERS — beta-hCG and alpha-fetoprotein in SERUM AND CSF — before any operation. A germinoma is treated without resection, so a positive marker changes the plan from surgery to oncology, and it is a blood test",
        "CALCIFICATION on CT supports craniopharyngioma; DIABETES INSIPIDUS at presentation supports germinoma or an infiltrative process, since an adenoma rarely causes it",
      ],
      monitoringExtra: ["HYPOTHALAMIC OBESITY AND BEHAVIOURAL CHANGE after craniopharyngioma treatment cause more long-term harm than the tumour usually does, and they are irreversible — which is why the modern decision often favours less aggressive surgery with radiotherapy, and why that trade-off is discussed with the family beforehand"],
    },
    "Hypothalamic glioma": {
      slots: { level: "the pituitary axis, the fields, WEIGHT and appetite, temperature and the sleep-wake pattern — and growth in a child",
               flavour: "hypothalamic tumours present through the FUNCTIONS the hypothalamus runs rather than through weakness: failure to thrive with a voracious appetite in an infant (the diencephalic syndrome), or obesity, precocious puberty and disturbed sleep. None of it looks neurological until someone plots the growth chart" },
      confirmatoryExtra: ["SCREEN FOR NEUROFIBROMATOSIS TYPE 1 in a child with an optic pathway or hypothalamic glioma: examine the skin for café-au-lait macules and axillary freckling and the eyes for Lisch nodules. NF1-associated tumours behave better and are frequently observed rather than treated, so the syndrome changes the plan"],
    },
    "Tumour (glioma, metastasis, craniopharyngioma)": {
      slots: { level: "the field defect in each eye, its CONGRUITY, and the pupils for a relative afferent defect — plus the endocrine axis, since this is next door to the sellar region",
               flavour: "an optic TRACT lesion gives an incongruous homonymous hemianopia with a contralateral relative afferent pupillary defect, and that pupil sign is what places it anterior to the geniculate rather than in the hemisphere" },
    },
    "Optic nerve glioma": {
      slots: { level: "ACUITY, COLOUR VISION and the fields in each eye, the pupils for an afferent defect, and the disc — plus proptosis",
               flavour: "painless, slowly progressive visual loss with proptosis in a CHILD, and the nerve is expanded and kinked on imaging. Most are low-grade, many are stable for years, and the default is often to WATCH — treatment is reserved for progression, because it costs vision too" },
      confirmatoryExtra: [
        "SCREEN FOR NEUROFIBROMATOSIS TYPE 1 — a large proportion of optic pathway gliomas in children are NF1-associated, they behave more indolently, and the diagnosis has implications for the whole family. Skin, eyes and a family history, then genetics",
        "Image the WHOLE optic pathway including the chiasm and hypothalamus, not just the nerve: chiasmal involvement changes both the prognosis and whether surgery is possible at all",
      ],
      monitoringExtra: ["Serial ACUITY and FIELDS with paediatric ophthalmology are the measurements that drive treatment — the scan changes slowly and the vision is what is actually at stake"],
      urgency: "routine",
    },
    "Craniopharyngioma or germinoma": {
      slots: { level: "fields, the endocrine axis, and thirst and urine output",
               flavour: "both sit in the suprasellar cistern and both hit the stalk — CALCIFICATION and a cystic component favour craniopharyngioma, while a germinoma may be radiologically unremarkable and betray itself only through markers" },
      confirmatoryExtra: ["Send alpha-fetoprotein and beta-hCG in serum and CSF: a germinoma is exquisitely treatable and can be diagnosed on markers, so this is a test that can spare a young patient an operation"],
      bySite: {
        hypothalamus_supraoptic: { level: "thirst, urine output and sodium — the vasopressin axis specifically" },
        hypothalamus_tuberal:    { level: "the full anterior pituitary axis, and growth in a child" },
      },
    },
    "Craniopharyngioma (and its surgical treatment)": {
      slots: { level: "weight, appetite, behaviour and the endocrine axis",
               flavour: "the name says it: the TREATMENT causes much of the long-term harm — hypothalamic obesity, rage and disturbed sleep after resection are the recognised outcome, which is why aggressive surgery is no longer automatic" },
      monitoringExtra: ["Weight, behaviour and sleep as formal outcomes at every review — hypothalamic obesity is largely resistant to conventional measures, and families need to know it is a consequence of the disease and its treatment rather than a failure of effort"],
    },
    "Hypothalamic tumour or infiltration": {
      slots: { level: "temperature, appetite, sodium and the sleep-wake cycle",
               flavour: "hypothalamic lesions declare themselves through the ENDOCRINE and autonomic axes rather than through a focal deficit, so the abnormal blood result usually precedes any sign" },
      bySite: {
        hypothalamus_thermoregulatory: { level: "core temperature, which can swing either way" },
        hypothalamus_lateral:          { level: "appetite, weight and arousal" },
      },
    },
    "Hypothalamic glioma or germinoma": {
      slots: { level: "the endocrine axis, fields, and growth in a child",
               flavour: "in a child, consider the DIENCEPHALIC SYNDROME — profound emaciation despite normal intake, in a child who is alert and euphoric, which is so counter-intuitive that it is regularly investigated as a gastrointestinal or psychiatric problem" },
      confirmatoryExtra: ["Check for neurofibromatosis type 1: optic pathway and hypothalamic gliomas are strongly associated with it, so examine the skin and take a family history"],
    },
    "Metastasis to the pituitary stalk": {
      slots: { level: "thirst, urine output, sodium and the anterior pituitary axis",
               flavour: "DIABETES INSIPIDUS AT PRESENTATION redirects the differential away from an adenoma and towards infiltration — metastasis, germinoma, histiocytosis or hypophysitis. The anatomy is why: an adenoma arises in the ANTERIOR lobe and DISPLACES the stalk rather than transecting it, and vasopressin can still be released above the compression, so an adenoma big enough to take the chiasm and the anterior axis usually leaves water balance intact" },
      confirmatoryExtra: [
        "Look for the primary — breast and lung dominate — and expect other metastases: an isolated pituitary metastasis is uncommon",
        "THE QUALIFIER MATTERS: this applies to diabetes insipidus AT PRESENTATION. Post-operative DI is common after pituitary surgery and is frequently transient — it does not mean the original diagnosis was wrong",
      ],
    },
    "Langerhans cell histiocytosis": {
      slots: { level: "thirst and urine output, plus growth in a child",
               flavour: "an infiltrative rather than neoplastic mass — diabetes insipidus with a thickened stalk, and the diagnosis is usually made from a more accessible lesion elsewhere" },
      confirmatoryExtra: ["SKELETAL SURVEY and a skin examination: lytic bone lesions and a seborrhoeic-looking rash are where the biopsy should be taken from, rather than the pituitary stalk"],
    },
  }),

  // ---- PINEAL / TECTAL / THIRD VENTRICLE ----
  ...family("pineal-third-ventricle", PINEAL_SPINE, {
    "Tumour (pineal or tectal)": {
      slots: { level: "vertical gaze, the pupils, and conscious level",
               flavour: "a tectal lesion may be tiny and still obstruct the aqueduct — so the ventricles can be dramatic while the mass is barely visible, and the scan must be read for both" },
    },
    "Pineal region tumour (germinoma)": {
      slots: { level: "vertical gaze and convergence-retraction nystagmus, with the pupils",
               flavour: "PARINAUD'S SYNDROME with hydrocephalus — and a germinoma is the most treatable of the pineal tumours, which is exactly why the markers are sent before anyone considers a biopsy" },
    },
    "Pineal region tumour with hydrocephalus": {
      slots: { level: "conscious level FIRST, then the eye signs",
               flavour: "the name puts them in the right order — the hydrocephalus is the emergency and the tumour is the diagnosis, and they run on different clocks" },
    },
    "Third ventricular tumour or colloid cyst": {
      slots: { level: "conscious level and memory, with careful attention to POSTURAL headache",
               flavour: "a COLLOID CYST can obstruct intermittently at the foramen of Monro — positional headache with transient loss of consciousness or drop attacks. Acute deterioration is well described and is why the lesion is taken seriously; but the risk is STRATIFIED rather than uniform, and a small asymptomatic cyst with normal ventricles is a different proposition from a large one with ventriculomegaly" },
      confirmatoryExtra: ["Where a colloid cyst is found incidentally, SIZE and VENTRICULAR CALIBRE drive the decision, and it warrants a neurosurgical opinion rather than either automatic surgery or unexamined observation — many small asymptomatic cysts are appropriately watched"],
    },
    "Dorsal midbrain (pretectal) lesion": {
      slots: { level: "vertical gaze, light-near dissociation and lid position",
               flavour: "the pretectal syndrome — pupils that react poorly to light but briskly to near, with upgaze failure and lid retraction. In a young person this points to a pineal mass, in an older one to hydrocephalus or a small stroke" },
    },
  }),

  // ---- SKULL-BASE AND PERINEURAL MALIGNANT SPREAD ----
  ...family("skull-base-malignancy", SKULL_BASE_SPINE, {
    "Perineural tumour spread": {
      slots: { level: "each trigeminal division separately, plus the corneal reflex and the muscles of mastication",
               flavour: "tumour tracking back along the trigeminal branches — image from the face to the brainstem, because the deficit marks where it has reached, not where it began" },
      bySite: {
        skull_base_v_ganglion:  { level: "all three divisions and the corneal reflex" },
        skull_base_v1_division: { level: "forehead sensation and the corneal reflex — the eye is what is at risk here" },
      },
    },
    "Perineural tumour spread along V2": {
      slots: { level: "sensation over the cheek, upper lip and upper teeth",
               flavour: "V2 runs through the foramen rotundum from the pterygopalatine fossa — image that fossa specifically, because it is the junction where spread from a facial or sinus primary becomes intracranial" },
    },
    "Perineural tumour spread / skull base malignancy": {
      slots: { level: "sensation over the chin and jaw, plus the muscles of mastication",
               flavour: "V3 leaves through the foramen ovale — a NUMB CHIN is a sinister sign and warrants imaging rather than dental review" },
    },
    "Perineural or skull base tumour spread": {
      slots: { level: "forehead and corneal sensation, with eye abduction",
               flavour: "at the petrous apex the fifth and sixth nerves lie together, so facial numbness with a lateral rectus palsy localises tightly" },
    },
    "Tumour / metastasis / perineural spread": {
      slots: { level: "every eye movement separately, plus V1 sensation",
               flavour: "the superior orbital fissure carries III, IV, VI and V1 — a painful total ophthalmoplegia with a numb forehead is the fissure syndrome" },
    },
    "Tumour / perineural spread": {
      slots: { level: "acuity and colour vision FIRST, then the eye movements",
               flavour: "at the orbital apex the optic nerve is involved as well as the fissure contents — and acuity is what is lost irreversibly, so it is the finding that sets the urgency" },
      urgency: "emergency",
    },
    "Orbital tumour or metastasis": {
      slots: { level: "acuity, colour vision, proptosis and each eye movement",
               flavour: "an orbital mass displaces as well as infiltrates — measure the PROPTOSIS and look for restriction of movement, which distinguishes a mechanical from a neural cause" },
      bySite: {
        pupil_ciliary_ganglion:   { level: "the pupil, near response and accommodation" },
        skull_base_iii_orbit_sup: { level: "lid elevation and the superior rectus" },
        skull_base_iii_orbit_inf: { level: "the inferior and medial recti, and the pupil" },
      },
      urgency: "emergency",
    },
    "Skull base metastasis": {
      slots: { level: "the cranial nerves of that corridor, one at a time",
               flavour: "a metastasis in skull-base BONE — CT shows the destruction and MRI the soft tissue and marrow, and a bone scan or PET finds the others" },
      bySite: {
        skull_base_ix_jugular:      { level: "gag, palate and swallow" },
        skull_base_hypoglossal_canal:{ level: "tongue protrusion, for deviation and wasting" },
        skull_base_collet_sicard:   { level: "IX, X, XI and XII together — four nerves means extensive disease" },
      },
    },
    "Skull base metastasis or nasopharyngeal carcinoma": {
      slots: { level: "the affected nerves plus the ear and the neck",
               flavour: "two possibilities with one first move — NASENDOSCOPY, because the nasopharynx is examinable and biopsy-able in clinic while the skull base is not" },
      bySite: {
        skull_base_v_ganglion: { level: "the trigeminal divisions and the corneal reflex" },
        skull_base_x_jugular:  { level: "palate, voice and swallow" },
      },
    },
    "Skull base tumour or nasopharyngeal carcinoma": {
      slots: { level: "eye abduction, and the ear and neck for the primary",
               flavour: "an isolated sixth-nerve palsy attributed to microvascular disease that does NOT recover in the expected months needs reassessment, not reassurance" },
    },
    "Skull base tumour or metastasis": {
      slots: { level: "sternocleidomastoid and trapezius separately",
               flavour: "an accessory nerve palsy from skull-base disease usually comes with its jugular foramen neighbours — if XI is failing alone, look again at the posterior triangle instead" },
    },
    "Skull base or retroparotid metastasis": {
      slots: { level: "IX, X, XI and XII, plus the sympathetic supply for a Horner's",
               flavour: "Villaret's syndrome — the four lower cranial nerves WITH a Horner's localises to the retroparotid space, and the Horner's is what distinguishes it from a jugular foramen lesion" },
    },
    "Metastasis / skull-base infiltration": {
      slots: { level: "gag, palate, voice and shoulder shrug",
               flavour: "the jugular foramen carries IX, X and XI — and hoarseness or aspiration may be the presenting complaint rather than anything the patient calls neurological" },
    },
    "Nasopharyngeal carcinoma or parotid malignancy": {
      slots: { level: "the lower cranial nerves and the facial nerve, with the parotid on palpation",
               flavour: "examine the PAROTID and the nasopharynx — both are accessible, and one of them usually holds the answer without recourse to the skull base" },
    },
    "Parotid malignancy": {
      slots: { level: "each facial branch separately, and palpate the gland",
               flavour: "a facial palsy that is PROGRESSIVE, painful, or spares some branches while taking others is NOT Bell's palsy — a benign parotid tumour does not usually cause facial weakness, so weakness implies malignancy" },
    },
    "Parotid tumour / malignant infiltration": {
      slots: { level: "all facial branches, and the gland for a mass",
               flavour: "at the stylomastoid foramen the whole face is affected — the discriminator from Bell's palsy is the TEMPO and the pain, not the pattern" },
    },
    "Maxillary sinus tumour": {
      slots: { level: "cheek sensation, and the upper teeth and palate",
               flavour: "sinonasal malignancy presents late because the sinus is a silent space — unilateral nasal obstruction, epistaxis or a loose upper tooth with facial numbness deserves endoscopy" },
    },
    "Esthesioneuroblastoma or sinonasal malignancy": {
      slots: { level: "SMELL, formally rather than by asking",
               flavour: "a tumour arising from the olfactory epithelium and growing through the cribriform plate — unilateral anosmia with nasal obstruction or epistaxis is the presentation, and smell is almost never tested" },
    },
    "Cavernous sinus or superior orbital fissure lesion": {
      slots: { level: "forehead sensation and the corneal reflex, with every eye movement",
               flavour: "V1 is affected in both compartments, so the DISCRIMINATOR is what accompanies it — optic nerve involvement places the lesion at the apex rather than in the sinus" },
    },
    "Petrous apex lesion (Gradenigo's, cholesteatoma, tumour)": {
      slots: { level: "eye abduction, facial sensation, and the EAR",
               flavour: "three causes at one place, and the ear examination separates them — Gradenigo's follows otitis media, a cholesteatoma erodes, and a tumour destroys" },
    },
  }),

  // ---- PARANEOPLASTIC ----
  ...family("paraneoplastic", PARANEOPLASTIC_SPINE, {
    "Paraneoplastic cerebellar degeneration": {
      slots: { level: "gait, limb coordination and eye movements",
               flavour: "anti-Yo points to BREAST AND OVARY and anti-Hu to small cell lung — so the search is pelvic imaging and mammography, or chest CT, rather than a general scan" },
      monitoringExtra: ["This is the paraneoplastic syndrome that most often leaves a permanent deficit, and it can progress over weeks — which is why the tumour search is measured in days rather than in outpatient appointments"],
      bySite: {
        cerebellum_vermis:        { level: "truncal stability and gait, which go first" },
        cerebellum_pancerebellar: { level: "gait, all four limbs, speech and eye movements together" },
      },
    },
    "Anti-Ma2 (paraneoplastic) diencephalitis": {
      slots: { level: "conscious level, the sleep-wake cycle and vertical gaze",
               flavour: "anti-Ma2 in a YOUNG MAN means TESTICULAR germ cell tumour until excluded — examine the testes and image them, and remember the tumour can be microscopic and found only on orchidectomy" },
      confirmatoryExtra: ["Excessive daytime sleepiness with vertical gaze problems and hypothalamic features is close to an anti-Ma2 signature, and it is regularly first labelled as a primary sleep disorder or a psychiatric presentation"],
    },
    "Anti-Ma2 paraneoplastic or autoimmune hypothalamitis": {
      slots: { level: "appetite, weight, temperature, sodium and the sleep-wake cycle",
               flavour: "hypothalamic involvement declares itself ENDOCRINE before it declares itself neurological — so the abnormal result usually arrives before the sign" },
      confirmatoryExtra: ["Full anterior pituitary and hypothalamic axis testing alongside the antibodies — hypopituitarism here is treatable and is missed while the neurology is being investigated"],
    },
    "Limbic / autoimmune encephalitis (LGI1, NMDA receptor, paraneoplastic)": {
      slots: { level: "memory, behaviour and seizure activity",
               flavour: "the cell-surface antibodies matter most because they are the TREATABLE ones — LGI1 with faciobrachial dystonic seizures, NMDA receptor with a psychiatric prodrome and movement disorder in a young woman with an ovarian teratoma" },
      confirmatoryExtra: [
        "Image the OVARIES in a young woman with NMDA receptor encephalitis — a teratoma may be small, and removing it changes the outcome",
        "EEG and MRI support the diagnosis but neither excludes it: treatment is frequently started on the clinical picture while the antibodies are awaited",
      ],
      urgency: "emergency",
    },
    "Small cell lung carcinoma (paraneoplastic LEMS)": {
      slots: { level: "proximal power, tendon reflexes, and power AFTER brief exercise",
               flavour: "post-exercise FACILITATION is the bedside signature — an absent reflex that returns after ten seconds of contraction is close to diagnostic, and it is the opposite of what myasthenia does" },
      confirmatoryExtra: [
        "Voltage-gated calcium channel antibodies, and neurophysiology with HIGH-FREQUENCY repetitive stimulation showing an incremental response",
        "LEMS PRECEDES the cancer diagnosis in most cases — so a negative initial chest CT means repeated screening over the following couple of years, not reassurance",
      ],
    },
    "Paraneoplastic autonomic neuropathy": {
      slots: { level: "lying and standing blood pressure, pupils, sweating and gut function",
               flavour: "a pandysautonomia with a tonic pupil, anhidrosis and orthostatic hypotension — ganglionic acetylcholine receptor antibodies, and small cell lung cancer or thymoma behind it" },
      confirmatoryExtra: ["Formal autonomic testing quantifies what the bedside suggests, and gastric emptying studies where gut failure dominates — the autonomic burden is often what disables the patient rather than the tumour"],
    },
  }),

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
    "Compressive myelopathy (disc / mass / abscess)": {
      slots: { level: "power, pinprick and the sensory level, with sphincters",
               flavour: "three causes and one urgent question — and send inflammatory markers WITH the imaging request, because an abscess changes the operation as well as the antibiotics" },
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
      // THE ONE SURVIVING FIGURE IN THIS LAYER, kept deliberately (owner ruling, 2026-08-18). Specific
      // numbers were removed elsewhere — the 3cm cerebellar evacuation threshold, the three-week
      // hoarseness interval — because management cut-offs and referral intervals date. This one is
      // different in kind: it tells the reader how to INTERPRET a number they have just generated,
      // rather than setting a threshold for an action. Do not "tidy" it away.
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
