// traumatic.js — pathology workups for the TRAUMATIC / MECHANICAL category.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS: ✅ ALL SIGNED OFF by the owner (a clinician), 2026-08-18.
//   Tranche 2 (round 8) — head injury, spinal trauma, skull-base/orbital trauma, and four singletons.
//   The traumatic red set is complete.
//
// The organising fact of this category: the mechanism is already known, so the workup is not about WHAT
// happened but about what ELSE was injured, and about preventing the SECOND insult. Trauma patients have
// more than one injury more often than not, and the neurological one competes for attention with the
// airway, the pelvis and the abdomen.
import { dz, family } from "./builders.js";

// HEAD INJURY. The primary injury is fixed by the time you meet the patient; everything that follows is
// about the secondary injury, which is preventable.
const HEAD_INJURY_SPINE = {
  confirmatory: [
    "CT HEAD to the local decision rule, and repeat it on ANY deterioration — a normal first scan does not stay normal, and delayed haemorrhage is common in the anticoagulated and the elderly",
    "ESTABLISH ANTICOAGULANT AND ANTIPLATELET EXPOSURE IMMEDIATELY and reverse it — this is the most time-critical action in the first hour and is repeatedly delayed while imaging is arranged",
    "IMAGE THE CERVICAL SPINE with the head: a significant head injury carries a cervical injury until excluded, and the two are missed together — {flavour}",
    "MRI later where the deficit exceeds what the CT shows: {flavour} is often invisible acutely, and the discrepancy between a normal CT and a poorly responding patient is itself the finding",
  ],
  monitoring: [
    "SAFETY NET: PREVENT THE SECOND INSULT. Hypoxia, hypotension, hypercapnia, hyperthermia and hypoglycaemia each independently worsen the outcome, and every one of them is preventable on a ward",
    "Track {level} plus pupils on a defined schedule; a new unilateral dilated pupil in a drowsy patient is herniation until disproved",
    "Look actively for the OTHER injuries — a distracting painful injury is the commonest reason a spinal or abdominal injury is missed in a patient whose head has everyone's attention",
    "Post-traumatic seizures, later epilepsy, and the cognitive and behavioural sequelae all need follow-up arranged before discharge, since none of them is visible on the day",
  ],
  urgency: "emergency",
  referral: "Neurosurgery and major trauma; critical care where conscious level is impaired",
};

// SPINAL TRAUMA AND ACUTE CANAL COMPROMISE. One question dominates and it has a clock: is the cord or
// cauda being compressed, and is the spine STABLE.
const SPINAL_TRAUMA_SPINE = {
  confirmatory: [
    "IMMOBILISE FIRST AND IMAGE SECOND where the mechanism is significant — a patient moved before the spine is cleared can be made paraplegic by the transfer rather than by the injury",
    "CT for the BONE and the fracture pattern, MRI for the CORD, ligaments and disc: they answer different questions and a normal CT does not exclude a cord or ligamentous injury — {flavour}",
    "Assess STABILITY explicitly with the spinal service — an unstable injury changes handling, transfer and every subsequent decision, and it is a judgement the imaging supports rather than makes",
    "Examine {level} and document a FORMAL level, with sacral sparing and the anal reflex — the completeness of the injury is the single strongest prognostic statement available, and it must be recorded before intervention",
  ],
  monitoring: [
    "SAFETY NET: NEUROGENIC SHOCK — hypotension with BRADYCARDIA rather than tachycardia — is distinct from haemorrhagic shock and is managed differently. Assuming blood loss and giving fluid alone will not correct it",
    "Track {level} on a defined schedule; an ascending level after a cervical injury threatens the diaphragm, and respiratory function must be measured rather than observed",
    "Bladder management from the outset, plus pressure areas and thromboprophylaxis — the preventable harms in spinal injury accumulate within hours, not days",
    "Watch for AUTONOMIC DYSREFLEXIA later in high cord injury: a severe headache with hypertension from a blocked catheter or distended bowel, which is treated by removing the stimulus",
  ],
  urgency: "emergency",
  referral: "Spinal surgery and major trauma urgently; a spinal injuries unit for ongoing care",
};

// SKULL-BASE AND ORBITAL TRAUMA. The fracture is visible; the question is which nerve, which vessel, and
// whether the cranial cavity is now open to the outside.
const SKULL_BASE_TRAUMA_SPINE = {
  confirmatory: [
    "CT WITH THIN SLICES AND RECONSTRUCTIONS through the skull base or orbit — a standard head CT does not resolve these fractures, and the reconstruction is what shows the fracture line in relation to the canal",
    "Determine whether the deficit was IMMEDIATE or DELAYED, because it changes everything: immediate implies transection or impingement at the moment of injury, delayed implies swelling or haematoma and may be reversible — {flavour}",
    "Look for a CSF LEAK — clear rhinorrhoea or otorrhoea, a halo sign, or beta-2 transferrin on the fluid — since it marks a communication with the subarachnoid space and a meningitis risk",
    "Examine {level}, and image the VESSELS where the fracture crosses the carotid canal or the venous sinuses",
  ],
  monitoring: [
    "SAFETY NET: a CSF leak carries a MENINGITIS risk that persists for as long as the leak does — a fever with a base-of-skull fracture is meningitis until proven otherwise, and it can present weeks later",
    "Track {level} by name; a DELAYED palsy after a fracture may recover, and documenting the onset accurately is what allows that prediction",
    "Protect the eye where corneal sensation or lid closure is lost — exposure keratopathy after facial trauma is common, silent and preventable",
    "Hearing, balance and smell all need formal assessment rather than a bedside impression, and all three are frequently unrecorded after head trauma",
  ],
  urgency: "urgent",
  referral: "Maxillofacial, ENT or neurosurgery as the fracture dictates; ophthalmology for any orbital or optic involvement",
};

export default {
  // ---- HEAD INJURY ----
  ...family("head-injury", HEAD_INJURY_SPINE, {
    "Diffuse axonal injury": {
      slots: { level: "conscious level and, later, cognition and behaviour",
               flavour: "shearing at grey-white junctions, the corpus callosum and the brainstem — CT is often near-normal while the patient is deeply unconscious, and blood-sensitive MRI is what shows it" },
      bySite: {
        brainstem_aras_paramedian_tegmentum: { level: "conscious level, pupils and brainstem reflexes",
          flavour: "brainstem involvement is the grade that carries the worst prognosis — but prognostication is still not made in the first days" },
        corpus_callosum_anterior:  { level: "behaviour, initiation, and left-hand apraxia to command" },
        corpus_callosum_splenium:  { level: "reading and visual naming, plus conscious level" },
      },
    },
    "Pontine contusion with diffuse axonal injury": {
      slots: { level: "eye movements, pupils, swallow and respiratory pattern",
               flavour: "a focal contusion on top of diffuse shearing — the eye movement abnormalities localise it, and they persist as the conscious level improves" },
      monitoringExtra: ["Airway and swallow before anything else: brainstem injury impairs both while the patient may still appear to be responding"],
    },
    "Temporal pole contusion": {
      slots: { level: "memory, behaviour, and seizure activity",
               flavour: "the temporal poles and orbitofrontal surfaces strike bone in deceleration, so contusions there are the rule rather than the exception — and they EXPAND over the first day, which is why the repeat scan matters" },
      monitoringExtra: ["Temporal contusions swell and can herniate uncally with little warning — a patient who is talking on arrival can deteriorate on day one, and the family should be told to expect the repeat scan"],
    },
    "Uncal herniation compressing the third nerve": {
      slots: { level: "the PUPIL first, then eye movements and conscious level",
               flavour: "the medial temporal lobe pressed against the tentorial edge — and because the pupillary fibres are superficial, the pupil dilates BEFORE the ophthalmoplegia, which is the warning that buys the time" },
      monitoringExtra: ["This is a surgical emergency in progress: measures to lower intracranial pressure begin while neurosurgery is being called, not after"],
    },
  }),

  // ---- SPINAL TRAUMA AND ACUTE CANAL COMPROMISE ----
  ...family("spinal-trauma", SPINAL_TRAUMA_SPINE, {
    "Traumatic cord injury": {
      slots: { level: "power, sensation and sacral function against a formal level",
               flavour: "the completeness of the injury, assessed with SACRAL SPARING, is the strongest prognostic statement available — and it must be documented before any intervention alters it" },
    },
    "Penetrating or traumatic cord injury": {
      slots: { level: "the asymmetry between the two sides",
               flavour: "a Brown-Séquard picture from penetrating injury — and in penetrating trauma the trajectory matters as much as the deficit, so image along the track rather than only at the level" },
      confirmatoryExtra: ["Consider vascular and visceral injury along the track, tetanus status, and antibiotics — a penetrating spinal injury is rarely an isolated one"],
    },
    "Central cord syndrome after hyperextension injury": {
      slots: { level: "ARMS versus legs specifically, and the hands most of all",
               flavour: "weakness WORSE IN THE ARMS THAN THE LEGS after a hyperextension injury in an older patient with cervical spondylosis — often with no fracture at all, which is why the CT is reassuring and wrong" },
      confirmatoryExtra: ["MRI is essential here because the CT is frequently normal: the injury is to the cord within a stenotic canal, not to the bone"],
    },
    "Traumatic fracture with canal compromise": {
      slots: { level: "saddle sensation, sphincter tone and the legs",
               flavour: "retropulsed bone in the canal — the degree of canal compromise and the neurological deficit together drive the decision to decompress, and neither alone" },
    },
    "Thoracolumbar burst fracture": {
      slots: { level: "sphincter function and the conus reflexes, then the legs",
               flavour: "at the thoracolumbar junction the CONUS is at risk, so sphincter failure can be disproportionate to the leg weakness — and the deficit at this level is the one most often under-recorded" },
    },
    "Craniocervical junction trauma": {
      slots: { level: "all four limbs, the lower cranial nerves and RESPIRATORY function",
               flavour: "injury here threatens ventilation, and survivors of the initial event can deteriorate with movement — so immobilisation is not a formality" },
      confirmatoryExtra: ["Include the VESSELS: vertebral artery injury accompanies craniocervical fractures often enough that CT angiography belongs in the initial study"],
    },
    "Craniocervical junction trauma (odontoid fracture)": {
      slots: { level: "all four limbs and respiratory pattern",
               flavour: "an odontoid fracture may produce NO neurological deficit at all and still be lethally unstable — the absence of signs is not reassurance, and it is missed in the elderly after a low fall" },
      confirmatoryExtra: ["In an ELDERLY patient after a minor fall with neck pain, image the odontoid specifically — this is the classic missed fracture, and plain films are inadequate"],
    },
    "Vertebral artery injury from neck trauma or manipulation": {
      slots: { level: "the crossed brainstem signs, with the neck",
               flavour: "a lateral medullary syndrome after neck trauma or MANIPULATION — the interval between the manipulation and the stroke can be hours to days, so the history has to be asked for" },
      confirmatoryExtra: ["CT or MR angiography of the neck, and ask specifically about chiropractic or other neck manipulation — patients do not connect it and will not volunteer it"],
    },
    "Central lumbosacral disc prolapse": {
      slots: { level: "saddle sensation, sphincter tone and the anal reflex",
               flavour: "a central prolapse compresses the sacral roots — and the deficit that matters is the one the patient has not mentioned, which is why the sphincter questions are asked directly" },
      bySite: {
        root_s2: { level: "sphincter tone, the anal wink and the bulbocavernosus reflex" },
        root_s3: { level: "perineal sensation and bladder function specifically" },
      },
      referral: "EMERGENCY spinal surgery — cauda equina compression is decompressed, and the delay is the prognosis",
    },
    "Central lumbar disc prolapse": {
      slots: { level: "saddle sensation, sphincter function and both legs",
               flavour: "CAUDA EQUINA SYNDROME — bilateral leg symptoms, saddle anaesthesia and bladder dysfunction. Ask about urinary RETENTION and altered sensation when passing urine, which precede overflow incontinence" },
      confirmatoryExtra: ["Emergency MRI of the whole lumbosacral spine — and a post-void bladder scan takes two minutes and materially changes the urgency"],
      referral: "EMERGENCY spinal surgery — the time to decompression is the strongest determinant of bladder recovery",
    },
  }),

  // ---- SKULL-BASE AND ORBITAL TRAUMA ----
  ...family("skull-base-trauma", SKULL_BASE_TRAUMA_SPINE, {
    "Temporal bone fracture": {
      slots: { level: "facial movement, hearing and balance",
               flavour: "the classification that matters is not longitudinal versus transverse but whether the OTIC CAPSULE is violated — capsule-involving fractures carry far higher rates of facial palsy, deafness and CSF leak" },
      confirmatoryExtra: ["Establish whether the facial palsy was IMMEDIATE or DELAYED and document it: immediate complete palsy may warrant exploration, while delayed palsy usually recovers"],
      bySite: {
        skull_base_vii_tympanic:  { level: "facial movement, with taste and the stapedial reflex" },
        skull_base_vii_mastoid:   { level: "all facial branches, with the ear for blood or CSF" },
        skull_base_vii_geniculate:{ level: "facial movement, taste, tearing and hyperacusis — the geniculate carries them all" },
      },
    },
    "Basal skull fracture": {
      slots: { level: "the cranial nerves in sequence, plus the ears and nose",
               flavour: "look for the clinical signs that mark it — periorbital or mastoid bruising, haemotympanum, and CSF from the nose or ear — because they appear before the reconstruction is reported" },
      confirmatoryExtra: ["Avoid nasogastric tube insertion where an anterior fossa fracture is possible; and image the CAROTID canal, since a fracture crossing it risks dissection or a carotid-cavernous fistula"],
    },
    "Traumatic optic neuropathy": {
      slots: { level: "acuity, colour vision and the PUPIL — a relative afferent defect is the objective sign",
               flavour: "usually an INDIRECT injury from force transmitted to the optic canal rather than a visible fracture — so the CT can look unremarkable while the nerve is severely injured" },
      confirmatoryExtra: [
        "Document acuity and the afferent pupillary defect EARLY and precisely: in an unconscious patient the pupil is the only available measure, and it is the baseline everything later is judged against",
        "The evidence for steroids and for surgical decompression is genuinely contested — this is a specialist decision rather than a protocol, and it should be made with ophthalmology rather than by default",
      ],
      urgency: "emergency",
    },
    "Orbital floor (blow-out) fracture": {
      slots: { level: "eye movements, especially UPGAZE, plus infraorbital sensation",
               flavour: "restricted upgaze with diplopia and numbness over the cheek — and the restriction is MECHANICAL entrapment rather than a nerve palsy, which a forced duction test distinguishes" },
      confirmatoryExtra: [
        "In a CHILD, a trapdoor fracture with muscle entrapment can present with little bruising but marked restriction, PAIN and a vagal response (nausea, bradycardia) — this is a surgical emergency in a way the adult injury is not",
        "Assess acuity and the pupil regardless: an orbital fracture can accompany a retrobulbar haematoma, which threatens vision within hours",
      ],
    },
  }),

  // ---- SINGLETONS ----

  // Plexus traction: the deficit is fixed at the moment of injury, and the question is where it is.
  "Traction or traumatic injury": dz("Traction or traumatic injury", {
    confirmatory: [
      "MRI of the brachial plexus, and NERVE CONDUCTION STUDIES timed at about three weeks — earlier studies cannot distinguish a conduction block that will recover from an axonal injury that will not",
      "The distinction that governs everything is PREGANGLIONIC (root avulsion) versus POSTGANGLIONIC: avulsion is not repairable directly and needs nerve transfer, while a postganglionic lesion may recover or be grafted — {flavour}",
      "Look for the signs of avulsion at the bedside: a HORNER'S syndrome, winging from long thoracic involvement, and paraspinal denervation on EMG — each points proximal to the ganglion",
      "Examine {level} and document the deficit precisely at the outset, because the plan depends on the trajectory over the following weeks",
    ],
    monitoring: [
      "SAFETY NET: the WINDOW FOR RECONSTRUCTION IS LIMITED — nerve transfer and grafting must happen before the target muscle becomes unreconstructable, so referral at three to six months is not a delay to be tolerated. Waiting to see is only safe for a defined period",
      "Track {level} monthly with serial examination and repeat neurophysiology; an advancing Tinel's sign along the nerve marks regeneration",
      "Pain is severe, neuropathic and frequently the dominant long-term problem, particularly after avulsion — involve pain services early rather than after the surgical decision",
      "Physiotherapy from the start to preserve joint range: a shoulder that has stiffened cannot benefit from a nerve that later recovers",
    ],
    urgency: "urgent",
    referral: "Peripheral nerve / brachial plexus surgery — early referral, because the reconstructive window closes",
    bySite: {
      plexus_middle_trunk: { level: "elbow and wrist extension, with the triceps jerk",
        flavour: "a middle trunk injury in isolation is uncommon, so an apparently isolated C7 deficit should prompt a careful search for adjacent trunk involvement" },
      plexus_lateral_cord: { level: "elbow flexion and forearm pronation, with lateral forearm sensation",
        flavour: "lateral cord injury spares the hand intrinsics, which is what separates it from a lower trunk lesion at the bedside" },
      plexus_medial_cord:  { level: "the hand intrinsics and medial forearm sensation",
        flavour: "medial cord involvement threatens hand function, which is the outcome that most determines whether reconstruction is worth pursuing" },
      plexus_posterior_cord: { level: "shoulder abduction, elbow extension and wrist extension together",
        flavour: "the posterior cord carries axillary and radial — a deltoid and triceps deficit together localises above the individual nerves" },
    },
  }),

  "Traction injury with root avulsion": dz("Traction injury with root avulsion", {
    confirmatory: [
      "MRI or CT MYELOGRAPHY looking for PSEUDOMENINGOCOELES at the affected levels — the root has been torn from the cord and the dural sleeve fills with CSF, which is the radiological signature of avulsion",
      "EMG of the PARASPINAL muscles: denervation there means the lesion is proximal to the dorsal root ganglion, which no repair can bridge directly",
      "Look for a HORNER'S SYNDROME, which accompanies lower trunk (T1) avulsion and is a bedside marker of a preganglionic injury",
      "Examine {level}, and establish the mechanism — high-energy traction, a motorcycle injury, or an obstetric brachial plexus injury in a neonate",
    ],
    monitoring: [
      "SAFETY NET: avulsion cannot be repaired by grafting the torn root — the reconstruction is NERVE TRANSFER, and it is time-limited, so referral is urgent even though the injury itself is not progressing",
      "Track {level}; and be honest early that recovery from true avulsion is limited and comes from transfer rather than from spontaneous regeneration",
      "DEAFFERENTATION PAIN after avulsion is severe, constant and burning, and it is the symptom most likely to dominate the patient's life — it needs its own treatment plan and does not respond to the usual approaches",
      "Preserve joint range and prevent contracture from the outset, so that a successful transfer has something to move",
    ],
    urgency: "urgent",
    referral: "Brachial plexus surgery urgently for consideration of nerve transfer; pain services in parallel",
    bySite: {
      plexus_upper_trunk: { level: "shoulder abduction, external rotation and elbow flexion",
        flavour: "C5-6 avulsion gives the Erb pattern — the arm hanging internally rotated with the forearm pronated. Shoulder and elbow function are the reconstructive priorities, in that order" },
      plexus_lower_trunk: { level: "the hand intrinsics, with the pupil for a HORNER'S",
        flavour: "C8-T1 avulsion carries the Horner's, and hand function after lower trunk avulsion recovers poorly even with transfer — which is a prognosis to give honestly and early" },
    },
  }),

  // A limb emergency that presents as a nerve palsy.
  "Anterior compartment syndrome": dz("Anterior compartment syndrome", {
    confirmatory: [
      "THIS IS A SURGICAL EMERGENCY AND THE DIAGNOSIS IS CLINICAL — pain out of proportion, and pain on PASSIVE STRETCH of the toes. Do not wait for imaging or for the pulse to disappear",
      "PULSES ARE PRESENT until very late and their presence is NOT reassurance — the compartment pressure that kills muscle is far below arterial pressure, and this is the single commonest reason the diagnosis is missed",
      "Compartment pressure measurement where the diagnosis is uncertain or the patient cannot report pain — obtunded, blocked or intubated patients lose the main clinical sign",
      "Examine {level} — deep peroneal territory first: weak toe extension and numbness in the first web space, which appear before the foot drop",
    ],
    monitoring: [
      "SAFETY NET: FASCIOTOMY IS TIME-CRITICAL and the window is measured in hours. A delay converts a recoverable injury into permanent contracture and foot drop",
      "Track {level} and the pain repeatedly; escalating analgesia requirements in a limb after injury, exertion or reperfusion is a warning sign rather than a management problem",
      "Monitor creatine kinase and renal function — rhabdomyolysis follows, and reperfusion after fasciotomy can worsen it acutely",
      "Remember the causes that are not fractures: crush, prolonged immobility, reperfusion after vascular repair, tight casts and anticoagulant-related bleeding",
    ],
    urgency: "emergency",
    referral: "Orthopaedic or vascular surgery IMMEDIATELY for fasciotomy",
  }),

  // Iatrogenic and predictable, which is what makes missing it worse.
  "Pituitary or hypothalamic surgery / trauma": dz("Pituitary or hypothalamic surgery / trauma", {
    confirmatory: [
      "FLUID BALANCE, PAIRED SERUM AND URINE OSMOLALITY, AND SODIUM at defined intervals — post-operative diabetes insipidus is common, predictable, and diagnosed by the numbers rather than by the patient's complaint",
      "Know the TRIPHASIC RESPONSE: an initial diabetes insipidus, then a period of inappropriate ADH release with HYPOnatraemia, then permanent DI. Treating each phase as if it were the previous one is how harm happens",
      "FULL PITUITARY AXIS testing, and cortisol above all — adrenal insufficiency after pituitary surgery is life-threatening and is masked by the fluid disturbance that has everyone's attention",
      "Examine {level}, and check visual fields and acuity post-operatively: deterioration may mean haematoma or graft prolapse and is time-critical",
    ],
    monitoring: [
      "SAFETY NET: the delayed HYPOnatraemia of the second phase typically appears around a week after surgery, AFTER discharge — patients need to know to return with headache, nausea or confusion, and a planned sodium check is safer than relying on symptoms",
      "Track {level}, urine output and sodium; an accurate fluid balance chart is the investigation here and is the thing most likely to be done badly",
      "Steroid replacement, sick-day rules and an alert card belong in the discharge plan — an adrenal crisis at home is the preventable death from this operation",
      "Long-term endocrine follow-up is mandatory, since deficits evolve over months and each is treatable once identified",
    ],
    urgency: "emergency",
    referral: "Endocrinology and neurosurgery together; ophthalmology if vision changes",
  }),
};
