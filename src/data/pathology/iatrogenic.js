// iatrogenic.js — pathology workups for the IATROGENIC category (procedures and radiation ONLY;
// a drug acting systemically stays under metabolic / toxic).
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ ALL SIGNED OFF by the owner (a clinician), 2026-08-18.
//   Tranche 1 — radiation plexopathy. Tranche 2 (round 9) — procedure-related injury.
//
// ⚠ TRANCHE 3 (round 12, 2026-08-21) — NOT YET REVIEWED: the surgical-nerve-injury, obstetric-injury,
//   radiation-injury and neurosurgical-sequela families. 47 names, none of them red.
import { dz, family } from "./builders.js";


// PROCEDURE-RELATED NERVE INJURY. What unites these is that a TREATMENT caused the deficit — which changes
// the conversation as much as the workup. Documentation, honest disclosure and prevention for the next
// patient are part of the clinical response, not an administrative afterthought.
const IATROGENIC_SPINE = {
  confirmatory: [
    "ESTABLISH THE TIMING PRECISELY against the procedure — immediate, on waking, or delayed by days. That interval separates direct injury from positioning, from swelling, and from an unrelated cause, and it cannot be reconstructed later",
    "Obtain the OPERATION NOTE and the anaesthetic record: position, duration, tourniquet time, blocks used, and any noted difficulty. This is the investigation, and it is rarely requested by the neurologist",
    "Neurophysiology at about three weeks to define the lesion and its severity — earlier studies cannot distinguish neurapraxia from axonal loss, which is the distinction the prognosis rests on: {flavour}",
    "Examine {level} and document it fully, including what is PRESERVED — the record made now is what any later discussion, clinical or otherwise, will rest on",
  ],
  monitoring: [
    "SAFETY NET: distinguish a stable deficit from a PROGRESSIVE one. Progression after a procedure suggests an expanding haematoma, a compartment syndrome or a compressive collection — all of which need imaging and possibly re-operation, urgently",
    "Track {level} at defined intervals; neurapraxia recovers over weeks and axonal injury over months, so the trajectory is what tells the patient which they have",
    "BE OPEN WITH THE PATIENT. A complication explained honestly and early is managed better clinically and causes less harm than one discovered by the patient — and the duty of candour is a professional obligation, not a legal calculation",
    "Refer for rehabilitation, splinting and pain management early rather than waiting to see whether recovery occurs — function preserved in the interim is function available if the nerve returns",
  ],
  urgency: "urgent",
  referral: "Neurology or peripheral nerve surgery, with the team that performed the procedure involved rather than bypassed",
};


// ---- ROUND 12 (tranche 3): the iatrogenic NON-red set ----
// The category with the most uncomfortable content in the model, and the plans say so plainly: the
// question is usually not what to investigate but whether this was avoidable, and what to tell the patient.

// A NERVE INJURED DURING AN OPERATION OR PROCEDURE. The spine is one clinical sequence: was the deficit
// there beforehand, what mechanism injured it, and does it need exploring or watching.
const SURGICAL_NERVE = {
  confirmatory: [
    "ESTABLISH WHETHER THE DEFICIT PREDATED THE PROCEDURE — the pre-operative record decides this, and its absence is why so many of these are unresolvable. If there is no documented pre-operative examination, say so rather than assuming",
    "{flavour}",
    "IDENTIFY THE MECHANISM, because it decides management: TRANSECTION needs exploration, while TRACTION, POSITIONING, THERMAL injury from diathermy and a local anaesthetic effect all recover. The operation note often names it",
    "EMG AT THREE WEEKS to confirm the level and establish a baseline; earlier is uninformative and later loses the comparison",
  ],
  monitoring: [
    "{level}",
    "A DEFICIT PRESENT ON WAKING suggests intra-operative injury; one appearing HOURS TO DAYS LATER suggests a haematoma or a compartment problem and may be surgically reversible — that distinction is time-critical and is the reason to ask exactly when it was noticed",
    "BE STRAIGHT WITH THE PATIENT. Explain what happened, what is known and what is not, and document it. Duty of candour applies, and evasion damages both the patient and the eventual outcome",
  ],
  urgency: "urgent",
  referral: "The operating team first, with neurophysiology; peripheral nerve surgery if exploration is considered.",
};

// OBSTETRIC INJURY — to the baby or to the mother. Different from surgical injury in that the mechanism is
// usually traction rather than instrument, and the prognosis conversation dominates the management.
const OBSTETRIC = {
  confirmatory: [
    "{flavour}",
    "ESTABLISH THE BIRTH HISTORY: shoulder dystocia, instrumental delivery, prolonged second stage, birth weight and presentation — the mechanism is in the notes and the midwifery record",
    "Examine for the associated injuries that change management — a clavicular or humeral fracture, and a HORNER'S SIGN, which indicates root avulsion and a far worse prognosis",
    "Imaging or EMG where recovery stalls; early imaging rarely changes the immediate plan",
  ],
  monitoring: [
    "{level}",
    "MOST RECOVER, AND THE TIMING OF RECOVERY PREDICTS THE OUTCOME — early return of function in the first weeks is the best prognostic sign there is, and failure to recover by three months is the trigger for specialist referral",
    "Physiotherapy from the outset to prevent contracture, which causes more lasting disability than the nerve injury in the children who recover",
  ],
  urgency: "urgent",
  referral: "Paediatric brachial plexus service for infants; neurology and physiotherapy for maternal injury.",
};

// RADIATION INJURY — the one that arrives years later, and whose central question is always whether this
// is treatment damage or recurrent tumour.
const RADIATION = {
  confirmatory: [
    "THE CENTRAL QUESTION IS RADIATION VERSUS RECURRENT TUMOUR, and it must be answered before anything else — MRI with contrast, and FDG-PET where imaging is equivocal, because the two are treated in opposite directions",
    "{flavour}",
    "RETRIEVE THE RADIOTHERAPY RECORD: dose, fields and date. Latency is typically MONTHS TO YEARS, and a deficit appearing decades later is still compatible with it",
    "EMG showing MYOKYMIC DISCHARGES favours radiation over tumour, and is one of the few findings that genuinely discriminates",
  ],
  monitoring: [
    "{level}",
    "RADIATION INJURY IS TYPICALLY PAINLESS AND SLOWLY PROGRESSIVE, where recurrent tumour is PAINFUL — pain should always reopen the question rather than being treated symptomatically",
    "Progression is usually irreversible; management is symptomatic and rehabilitative, and saying so honestly is kinder than implied hope",
  ],
  urgency: "urgent",
  referral: "Oncology to exclude recurrence first; neurology and rehabilitation thereafter.",
};

// A PLANNED AND ACCEPTED CONSEQUENCE OF NEUROSURGERY — anticipated rather than accidental, and the plan's
// job is to say what recovery looks like so it is not re-investigated.
const NEUROSURGICAL = {
  confirmatory: [
    "{flavour}",
    "COMPARE WITH THE PRE-OPERATIVE EXAMINATION AND THE OPERATIVE RECORD — the extent of resection usually predicts the deficit, and the surgeon's account is the most informative source",
    "Post-operative imaging to exclude the treatable alternatives — haematoma, infarction, hydrocephalus — before accepting an expected deficit",
  ],
  monitoring: [
    "{level}",
    "THIS IS AN ANTICIPATED CONSEQUENCE RATHER THAN A COMPLICATION, and framing it that way to the patient and family matters — but only if they were told beforehand, which should be checked rather than assumed",
    "Involve rehabilitation early; recovery over weeks to months is usual for these syndromes and is helped by starting rather than waiting",
  ],
  urgency: "urgent",
  referral: "The operating neurosurgical team; neurorehabilitation and speech therapy as the deficit dictates.",
};

export default {
  // ---- SURGICAL AND PROCEDURAL NERVE INJURY ----
  ...family("surgical-nerve-injury", SURGICAL_NERVE, {
    "Iatrogenic injury (mastectomy, axillary node clearance, chest drain)": {
      slots: { flavour: "long thoracic injury during axillary clearance is a recognised and partly unavoidable risk; the winging appears once the patient starts using the arm", level: "scapular winging on wall press, and shoulder range to prevent a frozen shoulder" } },
    "Iatrogenic (axillary surgery, regional block)": {
      slots: { flavour: "a regional block causes a deficit that is DENSE, IMMEDIATE and RESOLVES with the anaesthetic — a deficit outlasting the expected block duration is a different problem", level: "power hourly until the block should have worn off; persistence beyond that is the signal" } },
    "Iatrogenic (axillary surgery, regional block, median sternotomy)": {
      slots: { flavour: "median sternotomy injures the lower brachial plexus by first-rib retraction — a classic and under-recognised cardiac surgery complication", level: "hand intrinsics and the C8/T1 territory after cardiac surgery, which is rarely examined" } },
    "Iatrogenic (crutch use, axillary surgery)": {
      slots: { flavour: "check crutch fit and technique — weight should go through the hands, and axillary pressure is both the cause and the easy fix", level: "triceps and wrist extension, which separates axilla from spiral groove" } },
    "Iatrogenic injury (shoulder surgery, injection)": {
      slots: { flavour: "the axillary nerve is at risk in shoulder arthroscopy and in deltoid injection; check the injection site and technique", level: "deltoid power and the badge patch" } },
    "Iatrogenic (venepuncture, forearm surgery)": {
      slots: { flavour: "IMMEDIATE severe pain radiating during venepuncture is the history, and it is often dismissed at the time — the record from the phlebotomist matters", level: "the sensory territory; most resolve, but persistent neuropathic pain needs treating in its own right" } },
    "Injection or surgical injury": {
      slots: { flavour: "an intraneural injection causes immediate lancinating pain — which is why an injection should stop the moment the patient reports it", level: "the affected territory and the pain, which may dominate the picture" } },
    "Iatrogenic injury (vein harvest, knee arthroscopy, varicose vein surgery)": {
      slots: { flavour: "saphenous injury during vein harvest for cardiac surgery is common and usually purely sensory — patients are rarely warned of it", level: "the medial leg patch, confirming power is normal" },
      urgency: "routine" },
    "Iatrogenic injury (nerve biopsy, ankle surgery)": {
      slots: { flavour: "the sural nerve is DELIBERATELY sacrificed at biopsy, so the deficit is expected — consent should have covered it, and that is worth confirming", level: "the lateral foot patch; reassure that it is purely sensory" },
      urgency: "routine" },
    "Iatrogenic injury (carotid endarterectomy, neck surgery)": {
      slots: { flavour: "the hypoglossal nerve is at risk in carotid surgery; tongue deviation is often noticed by the patient as altered speech rather than as weakness", level: "tongue protrusion and speech; most recover over months" } },
    "Iatrogenic (carotid surgery, central line, interscalene block)": {
      slots: { flavour: "a Horner's sign after neck instrumentation — and the important step is excluding a HAEMATOMA or carotid dissection rather than accepting a stretch injury", level: "the pupil and lid, alongside neck swelling and airway" } },
    "Interscalene block or central line insertion": {
      slots: { flavour: "PHRENIC palsy is near-universal after interscalene block and usually temporary — but in a patient with poor respiratory reserve it causes real breathlessness", level: "oxygenation and orthopnoea; a raised hemidiaphragm on chest radiograph confirms it" } },
    "Femoral nerve block or catheterisation injury": {
      slots: { flavour: "distinguish a resolving block from a HAEMATOMA in the iliacus or retroperitoneum, which is compressive and evacuable — image it if the patient is anticoagulated", level: "quadriceps power and the knee jerk; a falling haemoglobin points at the haematoma" } },
    "Hip or pelvic surgery, or lithotomy positioning": {
      slots: { flavour: "LITHOTOMY POSITIONING is a recognised cause and is preventable — duration in position and the padding used should be recorded and reviewed", level: "hip flexion, knee extension and the femoral sensory territory" } },
    "Hip arthroplasty (posterior or lateral approach)": {
      slots: { flavour: "the PERONEAL DIVISION of the sciatic is preferentially injured, so a foot drop after hip replacement is sciatic rather than peroneal — and leg lengthening is the usual mechanism", level: "dorsiflexion and plantarflexion together, plus the whole sciatic sensory territory" } },
    "Pelvic or gynaecological surgery": {
      slots: { flavour: "retractor blades against the pelvic sidewall injure the femoral and obturator nerves; deep pelvic dissection risks the sciatic and pudendal", level: "hip adduction, hip flexion and knee extension, and ask about perineal sensation" } },
    "Pelvic surgery or radiotherapy": {
      slots: { flavour: "the name hedges between two mechanisms with opposite time courses — surgical injury is immediate and static, radiation injury appears later and progresses", level: "the deficit over time, which is what separates them" } },
    "Iliac crest bone graft or pelvic surgery": {
      slots: { flavour: "the lateral femoral cutaneous nerve runs close to the anterior iliac crest and is injured at graft harvest — a well-described and often unconsented complication", level: "the lateral thigh patch, confirming power is normal" },
      urgency: "routine" },
    "Thyroid, neck or cardiothoracic surgery": {
      slots: { flavour: "the LEFT recurrent laryngeal nerve loops under the aortic arch, so left-sided palsy follows cardiothoracic as well as neck surgery — the side narrows the field", level: "voice and swallow; laryngoscopy to document cord position" } },
    "Thyroid or neck surgery (iatrogenic)": {
      slots: { flavour: "recurrent laryngeal injury is the classic thyroidectomy complication; BILATERAL palsy is an airway emergency and presents as stridor rather than hoarseness", level: "voice, stridor and airway — bilateral palsy needs immediate assessment" } },
    "Cardiac, aortic or oesophageal surgery": {
      slots: { flavour: "hoarseness after cardiothoracic surgery with a SPARED palate places the lesion in the chest rather than the skull base", level: "voice, cough strength and swallow safety before oral intake" } },
    "Neck dissection or carotid surgery": {
      slots: { flavour: "the accessory nerve is the classic casualty of posterior triangle surgery, especially lymph node biopsy — and shoulder disability is often blamed on the operation generally rather than identified as nerve injury", level: "shoulder shrug and scapular position; refer to physiotherapy early to prevent a frozen shoulder" } },
    "Parotid surgery or trauma": {
      slots: { flavour: "facial nerve injury at parotidectomy — establish which BRANCHES are affected, since a single branch means a partial deficit and a different prognosis from a trunk injury", level: "each of the five branches separately, and eye closure above all" } },
    "Iatrogenic injury at middle-ear surgery": {
      slots: { flavour: "the facial nerve runs through the middle ear in a bony canal that may be dehiscent — the operative record will note whether the canal was seen to be open", level: "facial power and eye closure; corneal protection while the lid does not close" } },
    "Iatrogenic injury at mastoid surgery": {
      slots: { flavour: "the mastoid segment is at risk during cortical mastoidectomy; a deficit noted on waking suggests direct injury rather than oedema", level: "facial power, and hearing, since both may be affected" } },
    "Intramuscular injection injury": {
      slots: { flavour: "SITE AND TECHNIQUE are the whole story: the upper outer quadrant of the buttock avoids the sciatic nerve, and injury means the injection was misplaced — this is preventable rather than unfortunate", level: "the sciatic distribution below the knee, and the pain, which is often severe and immediate" },
      bySite: {
        nerve_superior_gluteal: { level: "hip abduction and gait — a Trendelenburg sign after a gluteal injection, which is easily attributed to the underlying illness rather than the needle" },
        nerve_sciatic: { level: "dorsiflexion above all, since the PERONEAL division is preferentially injured, plus the sensory territory below the knee" } },
    },
    "Cardiac or thoracic surgery (cold cardioplegia)": {
      slots: { flavour: "phrenic injury from topical cooling — a recognised cause of a raised hemidiaphragm and of failure to wean from ventilation after cardiac surgery", level: "orthopnoea and vital capacity ERECT AND SUPINE, since the supine fall is what demonstrates diaphragm weakness" } },
  }),

  // ---- OBSTETRIC ----
  ...family("obstetric-injury", OBSTETRIC, {
    "Obstetric brachial plexus injury (Erb's palsy)": {
      slots: { flavour: "UPPER trunk (C5-6): the arm lies adducted, internally rotated and pronated — the 'waiter's tip' posture — usually after shoulder dystocia", level: "shoulder abduction and elbow flexion; the biceps returning by three months is the classic favourable sign" } },
    "Obstetric injury (Klumpke's palsy)": {
      slots: { flavour: "LOWER trunk (C8-T1): the hand is affected and a HORNER'S SIGN may be present, which indicates root avulsion and a much worse prognosis", level: "hand intrinsics and the pupil — look for the Horner's specifically, because it changes the conversation entirely" } },
    "Obstetric injury (fetal head or forceps compression)": {
      slots: { flavour: "facial nerve compression by forceps or by the maternal sacral promontory; distinguish it from a congenital absence of the depressor anguli oris, which is asymmetric crying only", level: "facial movement and, above all, EYE CLOSURE — corneal protection in a neonate is the priority" } },
    "Obstetric injury": {
      slots: { flavour: "maternal rather than neonatal injury: lumbosacral trunk compression by the fetal head against the pelvic brim, typically after a prolonged second stage in a short mother with a large baby", level: "foot drop and the L5 territory; most recover over weeks to months" } },
    "Obstetric or surgical injury": {
      slots: { flavour: "the name hedges between delivery and operative injury, and the timing resolves it — a deficit present immediately after delivery differs from one appearing after a caesarean", level: "the deficit against the timing of each event" } },
    "Obstetric injury or pelvic surgery": {
      slots: { flavour: "pudendal or lumbosacral injury after delivery or pelvic surgery; ask about continence directly, since it is rarely volunteered", level: "perineal sensation, anal tone and continence — and refer to specialist physiotherapy, which genuinely helps" },
      urgency: "routine" },
  }),

  // ---- RADIATION ----
  ...family("radiation-injury", RADIATION, {
    "Radiation fibrosis or brachial plexopathy after treatment": {
      slots: { flavour: "after breast or lung treatment: radiation plexopathy is PAINLESS with myokymia and favours the UPPER trunk, where tumour infiltration is PAINFUL and favours the LOWER trunk with a Horner's", level: "the trunk distribution, the presence of pain, and the pupil" } },
    "Radiotherapy-induced neuropathy": {
      slots: { flavour: "confirm the nerve lay within the treatment field by retrieving the planning record — a deficit outside the field is not radiation injury", level: "the deficit against the field boundaries" } },
    "Radiation fibrosis of the carotid sheath": {
      slots: { flavour: "after head and neck radiotherapy: lower cranial nerve palsies with a woody, fibrotic neck — and CAROTID STENOSIS is accelerated by radiation, so image the vessels as well as the nerves", level: "swallow safety above all, plus carotid imaging for stroke risk" } },
    "Radiation or post-surgical injury": {
      slots: { flavour: "the name hedges between two mechanisms separated by their TIME COURSE — surgical injury is immediate and static, radiation injury is delayed and progressive", level: "the deficit over months, which is what resolves the hedge" } },
    "Cranial irradiation of the hypothalamic region": {
      slots: { flavour: "SCREEN THE PITUITARY AXES — hypopituitarism after cranial irradiation is common, appears YEARS later, and is entirely treatable if looked for", level: "growth hormone, thyroid, adrenal and gonadal axes at intervals for life, not once" },
      urgency: "routine",
      referral: "Endocrinology with oncology late-effects follow-up." },
  }),

  // ---- ANTICIPATED NEUROSURGICAL CONSEQUENCE ----
  ...family("neurosurgical-sequela", NEUROSURGICAL, {
    "Posterior fossa surgery (dentate injury / cerebellar mutism)": {
      slots: { flavour: "CEREBELLAR MUTISM SYNDROME appears with a DELAY of a day or two after posterior fossa surgery in children, which is what makes it so alarming — the child wakes well and then stops speaking", level: "speech, affect and swallow; most recover over weeks to months but dysarthria often persists" } },
    "SMA syndrome after tumour resection": {
      slots: { flavour: "dense contralateral akinesia and mutism appearing immediately after a medial frontal resection — and it looks devastating while being largely REVERSIBLE, which is the crucial point", level: "spontaneous movement and speech initiation; recovery over days to weeks is the rule" } },
    "Anterior temporal lobectomy (post-surgical)": {
      slots: { flavour: "an expected consequence of epilepsy surgery: a superior quadrantanopia from Meyer's loop, and material-specific memory change depending on the side operated on", level: "formal perimetry and neuropsychology, both of which should have pre-operative baselines to compare against" },
      urgency: "routine" },
    "Corpus callosotomy (surgical)": {
      slots: { flavour: "a deliberate disconnection performed to stop drop attacks — the disconnection signs are the intended trade-off rather than a complication", level: "left-hand apraxia to command and tactile anomia; explain them as expected, since they alarm families who were not warned" },
      urgency: "routine" },
    "Post-surgical or post-DBS change": {
      slots: { flavour: "check LEAD POSITION on post-operative imaging and review the stimulation settings — many post-DBS effects are stimulation-induced and REVERSIBLE by reprogramming", level: "the deficit against stimulation on and off, which is the most informative test available" },
      urgency: "routine",
      referral: "The functional neurosurgery and DBS programming team." },
  }),

  // ---- SINGLETONS ----
  "Conversion after an Epley manoeuvre": dz("Conversion after an Epley manoeuvre", {
    confirmatory: [
      "CANAL CONVERSION IS A RECOGNISED AND BENIGN CONSEQUENCE of repositioning: debris moves from the posterior into the horizontal canal, and the vertigo changes character rather than failing to improve",
      "RE-TEST AFTER TREATMENT rather than sending the patient away — a SUPINE ROLL TEST identifies horizontal-canal involvement and takes seconds",
      "The nystagmus direction identifies which canal now holds the debris, and therefore which manoeuvre to perform next",
      "Persisting vertigo that is CONSTANT rather than positional is not conversion, and needs reassessment for a central cause",
    ],
    monitoring: [
      "WARN THE PATIENT IN ADVANCE that symptoms may change rather than simply stop — otherwise a successful treatment feels like a failure and confidence is lost",
      "Repeat repositioning for the new canal; conversion is treatable in the same appointment",
      "Recurrence of BPPV is common regardless, and patients should know how to seek repeat treatment",
    ],
    urgency: "routine",
    referral: "The clinician who performed the manoeuvre; ENT or vestibular physiotherapy if it persists.",
  }),

  "Conversion after repositioning of another canal": dz("Conversion after repositioning of another canal", {
    confirmatory: [
      "The same phenomenon in the opposite direction — debris relocating into the anterior canal, which is rare and produces DOWN-beating torsional positional nystagmus",
      "DOWNBEAT NYSTAGMUS SHOULD ALWAYS PROMPT A THOUGHT ABOUT THE CRANIOCERVICAL JUNCTION before it is accepted as benign positional conversion",
      "Positional testing in all planes to identify the canal now involved",
      "Where the picture is atypical or persistent, image rather than repeating manoeuvres indefinitely",
    ],
    monitoring: [
      "Anterior-canal repositioning manoeuvres exist and work; refer to someone who performs them regularly rather than improvising",
      "Reassure that conversion indicates the debris is moving, which means the original diagnosis was right",
      "Persistent downbeat nystagmus between episodes is not BPPV and needs imaging",
    ],
    urgency: "routine",
    referral: "Vestibular physiotherapy or neuro-otology; neurology if downbeat nystagmus persists.",
  }),


  ...family("procedure-related-injury", IATROGENIC_SPINE, {
    "Iatrogenic injury at cervical lymph node biopsy": {
      slots: { level: "trapezius specifically — shoulder shrug, scapular position and abduction above 90 degrees",
               flavour: "the accessory nerve runs SUPERFICIALLY through the posterior triangle with almost nothing over it, which is exactly why a node biopsy there transects it — this is the classic avoidable surgical nerve injury" },
      confirmatoryExtra: ["If the nerve was transected and recognised, EARLY exploration and repair gives far better results than waiting — so the question of whether to explore is asked in weeks, not months"],
      monitoringExtra: ["Trapezius palsy causes a painful drooping shoulder and winging that worsens with time, and the pain is often more disabling than the weakness — physiotherapy from the outset genuinely changes the outcome"],
    },
    "Perioperative ischaemic optic neuropathy": {
      slots: { level: "acuity, colour vision, fields and the pupil in BOTH eyes",
               flavour: "painless visual loss noticed ON WAKING, often BILATERAL — associated with prolonged prone spinal surgery, cardiac surgery, blood loss and hypotension, and the disc may look normal initially in the posterior form" },
      confirmatoryExtra: [
        "Urgent ophthalmology, and exclude the treatable alternatives — an orbital compartment syndrome from positioning, a central retinal artery occlusion, and cortical visual loss from a perioperative stroke",
        "Check haemoglobin and review the intraoperative blood pressure record: anaemia and hypotension are the modifiable associations, and they matter for the NEXT operation as much as this one",
      ],
      monitoringExtra: ["There is no established effective treatment once it has occurred, which is why the honest conversation and the prevention message for future surgery are the substance of the follow-up"],
      urgency: "emergency",
      referral: "Emergency ophthalmology, with the surgical and anaesthetic teams",
    },
    "Aberrant regeneration after a third nerve palsy": {
      slots: { level: "the lid and pupil DURING eye movement, not at rest",
               flavour: "misdirected regrowth after a third nerve injury — the lid ELEVATES on downgaze or adduction (pseudo-Graefe), or the pupil constricts on adduction. It appears months later and is a sign of a healed injury, not a new one" },
      confirmatoryExtra: [
        "THE IMPORTANT DISTINCTION IS PRIMARY versus SECONDARY. Aberrant regeneration WITHOUT a preceding acute palsy — primary aberrant regeneration — implies a slowly compressive lesion such as a cavernous meningioma or aneurysm, and mandates imaging",
        "Aberrant regeneration essentially never follows a MICROVASCULAR third nerve palsy, so its presence argues that the original event was compressive or traumatic rather than ischaemic",
      ],
      monitoringExtra: ["Reassurance is usually the treatment where the history of an acute palsy is clear; strabismus surgery or lid surgery can help selected patients, so referral is reasonable rather than dismissive"],
      urgency: "urgent",
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
};
