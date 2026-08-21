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


// ---- ROUND 8 (tranche 3): traumatic, the peripheral half ----
// Owner ruling 2026-08-21: mechanism-shaped names DO get plans in tranche 3. Tranche 2 had dropped "Head
// trauma" as a mechanism whose work-up was already the site plan's CT — that exchange made sense when
// authoring by danger and trading slots, and it does not under full coverage.
//
// What makes these authorable rather than repetitive is that the mechanism names WHAT TO REMOVE. A plan
// that says "CT head" adds nothing; a plan that says "ask about leg crossing and pad the fibular neck"
// is the treatment.

// ENTRAPMENT / COMPRESSION AT A NAMED SITE — the commonest shape in the bucket. The spine is the same
// everywhere: grade it, remove the cause, operate only for wasting or progression.
const ENTRAPMENT = {
  confirmatory: [
    "NERVE CONDUCTION STUDIES localise the conduction block and GRADE it — and the grade, not the presence of symptoms, is what decides between conservative management and surgery",
    "{flavour}",
    "Ultrasound or MRI where there is a palpable swelling, a mass is suspected, or the picture is atypical for simple entrapment — a removable lesion changes the plan entirely",
    "Reproduce the symptoms by pressure or provocation at the suspected site, and examine {level}",
  ],
  monitoring: [
    "REMOVING THE CAUSE IS THE TREATMENT, and it usually works — {relief}",
    "WASTING OR PROGRESSIVE WEAKNESS is the indication to decompress; sensory symptoms alone usually settle without surgery",
    "Recovery depends on axonal regrowth and is measured in MONTHS — review at three months rather than six weeks, or a normal recovery is mistaken for failure",
  ],
  urgency: "routine",
  referral: "Neurophysiology first; hand, orthopaedic or neurosurgery if decompression is being considered.",
};

// A FRACTURE OR DISLOCATION THAT INJURED A NERVE. The clinical question is different: not what to remove,
// but whether the nerve is in continuity — and whether the deficit was there before someone intervened.
const TRAUMATIC_NERVE = {
  confirmatory: [
    "DOCUMENT THE DEFICIT BEFORE ANY REDUCTION, CAST OR FIXATION. A palsy discovered afterwards cannot be attributed without that examination, and the record matters as much medicolegally as clinically",
    "{flavour}",
    "Plain radiographs and CT for the bony injury; ultrasound or MRI of the nerve where the deficit does not fit the fracture pattern",
    "EMG AT ABOUT THREE WEEKS — earlier is uninformative, and this establishes the baseline that later comparison depends on",
  ],
  monitoring: [
    "SEPARATE NEURAPRAXIA FROM TRANSECTION: most CLOSED injuries are neurapraxia and recover over months. An OPEN or penetrating injury, or a deficit that appears AFTER manipulation, argues for early exploration instead of watching",
    "{level}",
    "Splinting and therapy to prevent contracture while it recovers — a stiff joint outlasts the nerve injury and is the avoidable harm",
  ],
  urgency: "urgent",
  referral: "Orthopaedics or trauma with neurophysiology; peripheral nerve surgery if exploration is considered.",
};

export default {
  // ---- ENTRAPMENT AND COMPRESSION ----
  ...family("nerve-entrapment", ENTRAPMENT, {
    "Idiopathic carpal tunnel syndrome": {
      slots: { flavour: "check for the SECONDARY causes before calling it idiopathic — hypothyroidism, diabetes, pregnancy, acromegaly and rheumatoid disease", level: "thenar bulk and thumb abduction", relief: "night splints in neutral, and treating the secondary cause where there is one" },
    },
    "Cubital tunnel syndrome": {
      slots: { flavour: "test for FROMENT'S SIGN and check whether the dorsal ulnar sensory territory is involved — its involvement places the lesion at the elbow rather than the wrist", level: "the first dorsal interosseous and the dorsal ulnar patch", relief: "avoiding sustained elbow flexion, and a night extension splint" },
    },
    "Prolonged elbow flexion or external pressure": {
      slots: { flavour: "ask about SLEEPING POSTURE and about leaning on the elbow at a desk or in a car — the trigger is usually habitual and unnoticed", level: "intrinsic hand power", relief: "an elbow pad and a night splint holding the elbow extended" },
    },
    "Guyon's canal compression (cyclist's palsy)": {
      slots: { flavour: "ask about CYCLING and handlebar grip; the dorsal ulnar sensory territory is SPARED here, which is what localises it to the canal", level: "interossei with dorsal sensation preserved", relief: "padded gloves, changing grip position and handlebar height" },
    },
    "Occupational vibration or repetitive pressure": {
      slots: { flavour: "take an OCCUPATIONAL history and consider hand-arm vibration syndrome, which is reportable in many jurisdictions", level: "intrinsic power and two-point discrimination", relief: "modifying the tool, the grip or the exposure — an occupational health referral does more than any prescription" },
    },
    "Crutch palsy / prolonged axillary compression": {
      slots: { flavour: "TRICEPS INVOLVEMENT is the discriminator — it places the lesion in the axilla rather than at the spiral groove", level: "elbow extension and the triceps jerk", relief: "refitting the crutches so weight goes through the hands, not the axillae" },
    },
    "Saturday-night palsy (compression against the humerus)": {
      slots: { flavour: "the TRICEPS IS SPARED, which places it at the spiral groove — and ask about alcohol and about falling asleep with the arm over a chair", level: "wrist and finger extension with triceps preserved", relief: "the compression has already stopped; a cock-up splint maintains function while it recovers" },
    },
    "Prolonged tourniquet or tight cast": {
      slots: { flavour: "review the operative and plaster records for tourniquet time and cast pressure — the cause is documented in the notes", level: "wrist and finger extension", relief: "splitting or replacing the cast, and reviewing tourniquet practice" },
    },
    "Entrapment at the arcade of Frohse (supinator)": {
      slots: { flavour: "WRIST EXTENSION IS PRESERVED and there is NO sensory loss — the posterior interosseous is purely motor, so both features together localise it", level: "finger extension with the wrist intact", relief: "avoiding repetitive forearm rotation; decompression where it fails" },
    },
    "Repetitive forearm rotation": {
      slots: { flavour: "take an occupational and sporting history for repetitive pronation and supination", level: "finger drop without wrist drop", relief: "modifying the activity, which is usually curative" },
    },
    "Pronator teres syndrome": {
      slots: { flavour: "the PALMAR CUTANEOUS branch is involved here and spared in carpal tunnel — numbness over the THENAR SKIN is what separates them", level: "pronation, long flexors and the palm", relief: "activity modification and avoiding repetitive resisted pronation" },
    },
    "Fibrous band or mass compression": {
      slots: { flavour: "IMAGE IT — a band or mass is removable, so ultrasound or MRI is not optional here as it is in idiopathic entrapment", level: "the deep flexors and the OK sign", relief: "excision where a lesion is found" },
    },
    "Meralgia paraesthetica (inguinal ligament entrapment)": {
      slots: { flavour: "purely SENSORY — any weakness at all means this is not the diagnosis and the lesion is a root or the femoral nerve", level: "the lateral thigh patch, with normal power and reflexes", relief: "loosening belts and waistbands and losing weight, which resolves most cases" },
    },
    "Obesity, pregnancy, tight belts or body armour": {
      slots: { flavour: "ask specifically about BODY ARMOUR, tool belts and uniform belts — an occupational cause that is easily removed once named", level: "the lateral thigh, confirming power is normal", relief: "removing the compression; in pregnancy it resolves after delivery, which is worth saying" },
    },
    "Compression at the fibular neck": {
      slots: { flavour: "INVERSION IS PRESERVED and hip abduction is normal — those two together separate a peroneal palsy from an L5 radiculopathy", level: "dorsiflexion, eversion and inversion together", relief: "padding the fibular neck and avoiding leg crossing and squatting" },
    },
    "Rapid weight loss ('slimmer's palsy'), plaster casts, leg crossing": {
      slots: { flavour: "ask about recent WEIGHT LOSS and habitual leg crossing; a cast or brace pressing on the fibular neck is documented in the notes", level: "dorsiflexion and eversion", relief: "padding, position change, and an ankle-foot orthosis while it recovers" },
    },
    "Anterior tarsal tunnel syndrome / tight footwear": {
      slots: { flavour: "examine the FOOTWEAR and the lace pattern — pressure over the dorsum of the foot is the cause and is visible", level: "the first web space and toe extension", relief: "changing footwear and lacing, which is usually sufficient" },
    },
    "Tarsal tunnel syndrome": {
      slots: { flavour: "TINEL'S SIGN behind the medial malleolus, and image for a space-occupying lesion — a ganglion or varicosity is found more often here than at other entrapment sites", level: "sole sensation and toe flexion", relief: "orthotics correcting hindfoot alignment; decompression where a lesion is present" },
    },
    "Entrapment where the nerve pierces the deep fascia": {
      slots: { flavour: "symptoms brought on by EXERCISE and relieved by rest point here, and a fascial defect may be palpable", level: "the dorsum of the foot with dorsiflexion preserved", relief: "activity modification; fascial release where it persists" },
    },
    "Chronic exertional compartment syndrome": {
      slots: { flavour: "COMPARTMENT PRESSURE MEASUREMENT before and after exercise is the diagnostic test, and the history is exertional pain that stops with rest", level: "the compartment after exercise rather than at rest", relief: "activity modification; fasciotomy where it is disabling and confirmed" },
    },
    "Compression by tight boots or casts": {
      slots: { flavour: "inspect the boot or cast edge against the deficit's territory — the two usually correspond", level: "the affected cutaneous territory", relief: "removing or padding the offending edge" },
    },
    "External compression (tight boots, casts)": {
      slots: { flavour: "purely sensory over the lateral foot and heel; look for the pressure point", level: "lateral foot sensation", relief: "changing footwear or padding the cast" },
    },
    "Prolonged compression (coma, sitting, wallet)": {
      slots: { flavour: "ask about PROLONGED IMMOBILITY — a long lie, surgery, intoxication or a wallet in the back pocket; and check creatine kinase where there has been a long lie, because rhabdomyolysis travels with it", level: "the whole sciatic distribution below the knee", relief: "removing the pressure and preventing recurrence during future immobility" },
    },
    "Repetitive overhead activity (volleyball, tennis)": {
      slots: { flavour: "isolated INFRASPINATUS wasting with weak external rotation points to the spinoglenoid notch; supraspinatus involvement too means the suprascapular notch above it", level: "external rotation and the muscle bulk below the scapular spine", relief: "modifying the overhead activity and scapular stabilisation work" },
    },
    "Traction or repetitive overhead trauma": {
      slots: { flavour: "test for SCAPULAR WINGING against a wall — long thoracic palsy wings medially, which distinguishes it from trapezius weakness", level: "serratus anterior on wall press", relief: "avoiding the provoking activity; most recover over many months" },
    },
    "Strenuous exercise / weightlifting entrapment": {
      slots: { flavour: "take a training history including recent load increases and supplement use", level: "elbow flexion, supination and the lateral forearm patch", relief: "reducing the provoking load" },
    },
    "Quadrilateral space syndrome": {
      slots: { flavour: "MRI shows selective TERES MINOR atrophy, and it is worth asking for specifically because it is easily overlooked on a routine shoulder report", level: "deltoid bulk and external rotation", relief: "activity modification; decompression is rarely needed" },
    },
    "Rucksack palsy / prolonged shoulder compression": {
      slots: { flavour: "ask about PACK WEIGHT and strap position — a classic military and hiking injury, and prevention is straightforward once named", level: "the middle-trunk distribution", relief: "redistributing pack weight to a hip belt and padding the straps" },
    },
    "Pudendal nerve entrapment (Alcock's canal)": {
      slots: { flavour: "the history is characteristic: pain SITTING, relieved by standing or sitting on a toilet seat — and a pudendal nerve block is both diagnostic and therapeutic", level: "perineal sensation and anal tone", relief: "cushions that offload the perineum, and cycling cessation where relevant" },
    },
    "Entrapment at the adductor (Hunter's) canal": {
      slots: { flavour: "purely SENSORY over the medial leg — any weakness means the femoral nerve or the L4 root instead", level: "the medial leg and malleolus, with normal quadriceps", relief: "avoiding the provoking compression; local block where diagnosis is uncertain" },
    },
    "Direct trauma or compression": {
      slots: { flavour: "identify the compression point by examination and history; a purely sensory deficit here needs no imaging unless a mass is suspected", level: "the medial leg sensory territory", relief: "removing the local pressure" },
    },
  }),

  // ---- FRACTURE AND DISLOCATION ----
  ...family("nerve-injury-fracture", TRAUMATIC_NERVE, {
    "Humeral shaft fracture": {
      slots: { flavour: "radial palsy with a humeral shaft fracture is common and usually NEURAPRAXIA — the debate is between early exploration and watchful waiting, and most recover without surgery", level: "wrist and finger extension weekly, and the advancing Tinel's sign, which tracks regeneration" },
    },
    "Shoulder dislocation or surgical neck fracture of the humerus": {
      slots: { flavour: "EXAMINE THE AXILLARY NERVE BEFORE AND AFTER REDUCTION — the badge patch takes seconds and is the most commonly omitted examination in the emergency department", level: "deltoid power and the regimental badge patch" },
    },
    "Shoulder dislocation or humeral fracture": {
      slots: { flavour: "a posterior cord lesion affects axillary AND radial territories together — map both rather than assuming an isolated nerve", level: "deltoid and wrist extension together" },
    },
    "Shoulder dislocation or proximal humeral fracture": {
      slots: { flavour: "triceps involvement places it in the axilla; sparing places it at the spiral groove", level: "elbow extension, then wrist and finger extension" },
    },
    "Supracondylar humeral fracture or elbow trauma": {
      slots: { flavour: "in CHILDREN this is the classic association, and the anterior interosseous branch is most often affected — test the OK sign specifically, since a child will not report it", level: "the OK sign and pronation" },
    },
    "Forearm trauma or fracture": {
      slots: { flavour: "a PURE MOTOR deficit with no sensory loss localises to the anterior interosseous branch rather than the median trunk", level: "flexion of the thumb and index finger" },
    },
    "Wrist fracture, dislocation or tenosynovitis": {
      slots: { flavour: "acute median symptoms after a distal radius fracture may mean ACUTE CARPAL TUNNEL SYNDROME — that is a surgical emergency, not an entrapment to be splinted", level: "thenar power and median sensation, urgently and repeatedly" },
      urgency: "emergency",
    },
    "Hook of hamate fracture or ulnar artery aneurysm": {
      slots: { flavour: "a CT or dedicated carpal tunnel view shows the hook fracture, which plain films miss; consider an ulnar artery aneurysm in someone who uses the hand as a hammer", level: "intrinsic power and the ulnar pulse" },
    },
    "Tardy ulnar palsy (old elbow fracture, cubitus valgus)": {
      slots: { flavour: "the injury may be DECADES old — look for cubitus valgus and ask about a childhood fracture, which the patient may not connect to the symptoms", level: "intrinsic wasting and Froment's sign" },
      urgency: "routine",
    },
    "Knee trauma, fibular fracture or surgery": {
      slots: { flavour: "examine the peroneal nerve before and after any knee reduction or fixation; a fibular neck fracture puts it directly at risk", level: "dorsiflexion and eversion" },
    },
    "Trauma or fracture of the tibia/ankle": {
      slots: { flavour: "consider ACUTE COMPARTMENT SYNDROME where pain is out of proportion — that is a surgical emergency and the nerve deficit is a late sign", level: "the first web space and dorsiflexion, with compartment pressure if pain is disproportionate" },
    },
    "Ankle inversion injury or fracture": {
      slots: { flavour: "a superficial peroneal deficit after an inversion injury is easily attributed to the sprain itself; the sensory territory is what separates them", level: "the dorsum of the foot with dorsiflexion preserved" },
    },
    "Ankle trauma or fracture": {
      slots: { flavour: "purely sensory over the lateral foot and heel; the sural nerve runs superficially and is injured by both trauma and surgical approaches", level: "lateral foot sensation" },
    },
    "Trauma, fracture or dislocation at the ankle or knee": {
      slots: { flavour: "tibial injury affects the sole and toe flexion — and a numb sole is a pressure-ulcer risk that needs saying explicitly", level: "sole sensation, toe flexion and the skin of the foot" },
    },
    "Hip dislocation, acetabular fracture or arthroplasty": {
      slots: { flavour: "the PERONEAL DIVISION of the sciatic nerve is preferentially injured — so a foot drop after hip surgery is sciatic until proven otherwise, not a peroneal entrapment", level: "dorsiflexion, plantarflexion and the whole sciatic sensory territory" },
    },
    "Pelvic trauma or fracture": {
      slots: { flavour: "a Trendelenburg gait after pelvic trauma points at the superior gluteal nerve, and it is easily missed while attention is on the fracture", level: "hip abduction and gait" },
    },
    "Pelvic fracture or haematoma": {
      slots: { flavour: "image for a HAEMATOMA compressing the nerve — it is evacuable, and that makes it worth looking for rather than assuming a stretch injury", level: "hip adduction and the medial thigh" },
    },
    "Trauma (scapular fracture, traction injury)": {
      slots: { flavour: "a scapular fracture implies considerable force — look for the associated chest and vascular injuries rather than focusing on the nerve", level: "external rotation and supraspinatus initiation" },
    },
    "Direct trauma or shoulder surgery": {
      slots: { flavour: "the name hedges between injury and operation, and the operative record resolves it — check positioning, retractor placement and tourniquet time", level: "elbow flexion and the lateral forearm" },
    },
    "Brachial plexus lateral cord lesion": {
      slots: { flavour: "map the deficit across MORE THAN ONE nerve — musculocutaneous with the lateral median contribution — because that pattern is what makes this a cord rather than a nerve lesion", level: "elbow flexion, forearm pronation and median sensation together" },
    },
    "Penetrating trauma to the posterior triangle": {
      slots: { flavour: "an OPEN injury argues for EARLY EXPLORATION rather than watchful waiting — this is the situation where the general rule reverses", level: "trapezius power and shoulder shrug" },
    },
  }),


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
