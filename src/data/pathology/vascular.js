// vascular.js — pathology workups for the VASCULAR category (ischaemic / haemorrhagic).
//
// The clock is the first investigation in this category, not the scan: for most of these the question
// 'when was the patient last known well' decides what can still be offered.
//
// Content only — the builders live in ./builders.js and the public API in ../pathologyNextSteps.js.
// Teaching prompts, not directives: no doses, no definitive management.
//
// REVIEW STATUS:
//   ✅ Posterior circulation stroke, Intracerebral haemorrhage — SIGNED OFF 2026-08-18 (tranche 1).
//   ⚠  the INFARCT family (28 members) — tranche 2 round 1, AWAITING REVIEW.
import { dz, family } from "./builders.js";

// ---- the INFARCT family (tranche 2, round 1) ----
// 28 named infarcts share one clinical argument: the clock, then CT to exclude blood, then the vessel,
// then the cause. What differs is the territory and what you watch. Writing that out 28 times is exactly
// the drift the family builder exists to prevent.
//
// THREE GROUPS DIVERGE FROM THE SPINE and say so explicitly rather than being forced through it:
//   * the four CORD infarcts — the brain reperfusion pathway does not apply at all (full override)
//   * malignant MCA — the decompressive-craniectomy window is the whole point (monitoringExtra)
//   * the posterior-fossa three — swelling obstructs the fourth ventricle (monitoringExtra)
const INFARCT_SPINE = {
  confirmatory: [
    "Establish the TIME LAST KNOWN WELL before anything else — it is what decides whether reperfusion is on the table, and it cannot be reconstructed later",
    "Non-contrast CT first to exclude haemorrhage, then CT angiography from arch to vertex for a large-vessel occlusion",
    "MRI with DWI where the diagnosis is uncertain or the CT is normal — {flavour}",
    "Aetiology work-up once the diagnosis is secure: cardiac rhythm monitoring for atrial fibrillation, echocardiography, carotid or vertebral imaging, and a vascular risk profile",
  ],
  monitoring: [
    "Swallow screen before anything by mouth — the single most preventable early complication",
    "Neurological observations tracking {level}, on a defined schedule rather than as needed",
    "SAFETY NET: any deterioration in conscious level or new deficit means immediate reimaging for haemorrhagic transformation or extension, not observation",
    "Glucose, temperature and blood pressure are treatments here, not background measurements",
  ],
  urgency: "emergency",
  referral: "Acute stroke pathway — time-critical, and reperfusion may be on the table",
};

// The cord has no equivalent of the brain reperfusion pathway, and the commonest cause is aortic rather
// than cardioembolic. Built per-member so the four do not emit identical text (which the invariant would
// and should reject).
const cordInfarct = (where, clue) => [
  `MRI ${where} — but a NORMAL early MRI DOES NOT EXCLUDE IT: cord infarction is frequently occult in the first hours, and the clinical picture outranks the scan`,
  "Image the AORTA — aortic dissection, aneurysm and recent aortic surgery are the classic causes, and dissection is the one that kills while the cord is being investigated",
  clue,
  "Once compression is excluded, exclude the inflammatory mimic: CSF, aquaporin-4 and MOG antibodies — a transverse myelitis is treatable and looks similar at the bedside",
];

export default {
  ...family("infarct", INFARCT_SPINE, {
    // ---- anterior circulation, cortical ----
    "MCA superior division infarct": {
      slots: { level: "face and arm power, and speech output",
               flavour: "a superior division infarct spares the visual field, which is what separates it from a complete MCA territory infarct" },
      bySite: {
        cortex_mca_superior: { level: "face and arm power, and expressive speech" },
        cortex_motor_facearm: { level: "face and arm power specifically, with the leg relatively spared" },
      },
    },
    "MCA inferior division infarct": {
      slots: { level: "comprehension, neglect and the visual field",
               flavour: "an inferior division infarct SPARES POWER — the deficit is comprehension, neglect or a field cut, which is why it is repeatedly admitted as delirium or a psychiatric presentation" },
      bySite: {
        cortex_temporoparietal: { level: "comprehension and repetition — fluent but empty speech" },
        cortex_temporal: { level: "comprehension, and memory once the patient can cooperate" },
        cortex_parietal: { level: "neglect, cortical sensation and the inferior field" },
        cortex_mca_inferior: { level: "comprehension, neglect and the superior quadrant" },
      },
    },
    "MCA territory infarct": {
      slots: { level: "gaze deviation, power and autonomic stability",
               flavour: "eyes deviated TOWARDS the lesion with a contralateral hemiparesis is a hemispheric infarct until proven otherwise" },
      bySite: {
        cortex_frontal_eye_field: { level: "conjugate gaze — deviation towards the lesion, and whether it overcomes with the oculocephalic manoeuvre" },
        cortex_insula: { level: "blood pressure, cardiac rhythm and conscious level",
                         flavour: "insular infarction carries a real burden of autonomic and cardiac instability out of proportion to the motor deficit" },
      },
    },
    "Large MCA territory (or ICA) infarct": {
      slots: { level: "language, power and conscious level",
               flavour: "a global aphasia with dense hemiplegia means a proximal occlusion — the CT angiogram is the study that changes management, not the plain CT" },
      confirmatoryExtra: ["This is the picture that most often qualifies for THROMBECTOMY — involve the neurointerventional service in parallel with the imaging, not after it"],
    },
    "Malignant MCA infarction (space-occupying oedema)": {
      slots: { level: "conscious level above all else",
               flavour: "early loss of grey-white differentiation over more than a third of the territory predicts the malignant course" },
      monitoringExtra: [
        "THE DECOMPRESSIVE CRANIECTOMY WINDOW IS THE POINT: oedema peaks at 2-5 days, and the decision must be made BEFORE herniation, not in response to it — flag to neurosurgery early even if the patient looks well today",
        "Hourly conscious level and pupils during the peak window; a new pupillary asymmetry is a surgical emergency",
      ],
    },
    "Striatocapsular infarct from PROXIMAL MCA occlusion": {
      slots: { level: "power, and language, since cortical function is variably involved",
               flavour: "a large comma-shaped basal ganglia infarct is NOT a lacune — it means a PROXIMAL MCA occlusion with collateral rescue of the cortex, so image the vessel" },
      confirmatoryExtra: ["Do not file this as small-vessel disease: the striatocapsular pattern mandates a vessel study and a full embolic source hunt"],
    },
    "MCA infarct (postcentral / parietal branch)": {
      slots: { level: "cortical sensory function — two-point discrimination, stereognosis and graphaesthesia",
               flavour: "a small postcentral infarct gives CORTICAL sensory loss with preserved primary modalities, which is easily dismissed as functional" },
    },
    "Small cortical infarct or TIA": {
      slots: { level: "the focal deficit, and whether it is resolving",
               flavour: "a normal CT is expected — DWI is what confirms a small cortical infarct, and a positive DWI in a resolved deficit still means a stroke, not a TIA" },
      confirmatoryExtra: ["Where symptoms have resolved, the work-up is URGENT rather than over — early recurrence risk after a TIA is front-loaded into the first days"],
    },
    "Bilateral ACA territory infarct": {
      slots: { level: "both legs, continence and initiation",
               flavour: "bilateral medial frontal infarction from a single dominant A2 — paraparesis with abulia and incontinence, which is regularly worked up as a cord lesion" },
      confirmatoryExtra: ["Because the picture imitates a cord lesion, this is one to image the BRAIN for when the spine MRI is normal"],
    },
    "Bilateral temporal (Heschl's gyrus) infarcts": {
      slots: { level: "hearing, with formal audiometry rather than bedside testing",
               flavour: "bilateral superior temporal lesions — cortical deafness needs BOTH sides, so a single infarct here does not explain it and a second, older lesion should be looked for" },
    },
    "Border-zone (watershed) infarct from hypoperfusion": {
      slots: { level: "proximal limb power, and the blood pressure that caused it",
               flavour: "a rosary or wedge pattern between two territories — the mechanism is HAEMODYNAMIC, so the question is what dropped the perfusion, not what embolised" },
      confirmatoryExtra: [
        "Image the carotids and the intracranial vessels: a tight proximal stenosis with a border-zone pattern is a different problem from an embolus",
        "Find the trigger — hypotension, sepsis, arrhythmia, blood loss or a recent anaesthetic — because without it the infarct will simply recur",
      ],
      bySite: {
        cortex_watershed_anterior: { level: "PROXIMAL arm and leg power — the man-in-a-barrel pattern" },
        cortex_watershed_posterior: { level: "the visual field and higher visual processing" },
      },
    },

    // ---- posterior circulation, brainstem ----
    "Brainstem infarct": {
      slots: { level: "eye movements, swallow and conscious level",
               flavour: "the brainstem is where an early DWI most often misses the lesion — a convincing crossed picture outranks a normal early scan, so repeat it" },
      bySite: {
        pontomesencephalic_tegmentum: { level: "eye movements in each direction separately, and conscious level" },
        guillain_mollaret_rubral: { level: "tremor, palate and eye movements — and remember palatal tremor can appear MONTHS later" },
      },
    },
    "Top-of-the-basilar / brainstem infarct": {
      slots: { level: "conscious level, pupils and vertical gaze",
               flavour: "top-of-the-basilar embolism gives a bewildering mixture of visual, oculomotor and behavioural signs with preserved power — the pattern is the diagnosis" },
      confirmatoryExtra: ["A FLUCTUATING or stuttering posterior-circulation picture is basilar thrombosis until the angiogram says otherwise; the fluctuation is the warning, not reassurance"],
    },
    "Posterior cerebral / basilar perforator infarct": {
      slots: { level: "the third nerve, and contralateral limb signs",
               flavour: "a crossed picture — a cranial nerve on one side with long-tract signs on the other — localises to the brainstem and nowhere else" },
    },
    "Dorsal midbrain infarct": {
      slots: { level: "vertical gaze, convergence-retraction nystagmus and the pupils",
               flavour: "dorsal midbrain signal change — but Parinaud's syndrome from a lesion here also raises pineal mass and hydrocephalus, so look at the ventricles on the same scan" },
    },
    "Bilateral medial medullary infarct": {
      slots: { level: "tongue, all four limbs, and the respiratory pattern",
               flavour: "a 'heart-shaped' area of bilateral medial medullary signal change — rare, and the quadriparesis with tongue weakness is regularly mistaken for Guillain-Barré" },
      monitoringExtra: ["RESPIRATORY function specifically: medullary infarction can impair the drive to breathe, and this is missed while the limbs are being examined"],
    },
    "AICA territory infarct": {
      slots: { level: "hearing, facial power and crossed sensory loss",
               flavour: "AICA is the one brainstem stroke that DEAFENS, because the labyrinthine artery arises from it — but hearing loss does NOT separate it from a labyrinthitis, which is cochlear by definition and deafens too. What separates them is everything ELSE: ipsilateral facial weakness, crossed sensory loss, limb ataxia, or a Horner's syndrome, none of which a labyrinthitis produces" },
      confirmatoryExtra: ["Where the only findings are vertigo and hearing loss, HINTS is what decides: a NORMAL head impulse, direction-changing nystagmus or skew deviation points central, and a labyrinthitis cannot produce any of them"],
    },
    "AICA territory infarct involving the trigeminal complex": {
      slots: { level: "facial sensation and the corneal reflex, with the contralateral limbs",
               flavour: "ipsilateral facial sensory loss with contralateral limb sensory loss is the crossed pattern that pins the lateral pons" },
    },
    "Labyrinthine artery infarct (AICA territory)": {
      slots: { level: "hearing and the vestibular examination",
               flavour: "an isolated labyrinthine infarct can look exactly like vestibular neuritis — the discriminator is HEARING LOSS, and it usually heralds AICA territory disease behind it" },
      confirmatoryExtra: ["Sudden sensorineural hearing loss WITH vertigo in a vascular patient deserves posterior-circulation imaging, not just an audiogram"],
    },

    // ---- posterior fossa: the fourth ventricle is the danger ----
    "Cerebellar infarct (PICA)": {
      slots: { level: "conscious level, gait and nystagmus",
               flavour: "a PICA infarct can present as isolated vertigo with a normal-looking examination — a NORMAL head impulse in ongoing vertigo points central" },
      monitoringExtra: ["POSTERIOR-FOSSA SWELLING obstructs the fourth ventricle and kills by hydrocephalus and herniation, typically at 2-4 days — conscious level is the observation that matters most, and deterioration is a neurosurgical emergency"],
    },
    "Cerebellar infarct (SCA / PICA)": {
      slots: { level: "conscious level, limb coordination and truncal stability",
               flavour: "define WHICH territory: an SCA infarct sits above the horizontal fissure and an inferior infarct below it, and the swelling risk differs" },
      monitoringExtra: ["POSTERIOR-FOSSA SWELLING obstructs the fourth ventricle — watch conscious level through days 2-4 and involve neurosurgery early if the infarct is large"],
    },
    "Cerebellar infarct (vermian)": {
      slots: { level: "conscious level and truncal stability — a vermian lesion can leave the LIMBS almost normal",
               flavour: "a midline infarct with little limb ataxia is easily dismissed as non-neurological; truncal instability severe enough to prevent sitting unsupported is the sign that matters" },
      monitoringExtra: ["POSTERIOR-FOSSA SWELLING obstructs the fourth ventricle and causes fatal herniation with little warning, peaking at 2-4 days — hourly conscious level THROUGH THAT WINDOW even once the deficit has plateaued, and a low threshold for repeat imaging"],
    },

    // ---- the thalamus and hypothalamus ----
    "Artery of Percheron infarct": {
      slots: { level: "conscious level, vertical gaze and memory",
               flavour: "BILATERAL paramedian thalamic signal change from a SINGLE perforator — sudden hypersomnolence with vertical gaze palsy, routinely admitted as a metabolic encephalopathy" },
      bySite: {
        thalamus_arousal_paramedian: { level: "conscious level and the sleep-wake pattern" },
        thalamus_limbic: { level: "memory and behaviour, once arousal allows testing" },
      },
    },
    "Artery of Percheron or paramedian thalamic infarct": {
      slots: { level: "memory, arousal and the endocrine axis",
               flavour: "involvement extending to the mammillary bodies — and a mammillary body lesion in the right context is Wernicke's, not a stroke, so ask about nutrition before settling on vascular" },
      confirmatoryExtra: ["Where nutrition is at all in question, treat for Wernicke's in parallel rather than waiting to distinguish the two — the treatment is safe and the delay is not"],
    },

    // ---- the cord: the brain pathway does not apply ----
    "Spinal cord infarct (anterior spinal artery)": {
      slots: { level: "power, pinprick and sphincter function against the sensory level" },
      confirmatory: cordInfarct("the whole cord with diffusion sequences",
        "The signature is ANTERIOR: power and pinprick lost, VIBRATION AND PROPRIOCEPTION PRESERVED, because the dorsal columns have their own supply — that dissociation is what separates it from compression"),
      monitoringExtra: ["Sphincter function and a rising sensory level; and blood pressure deliberately kept UP rather than down, which is the opposite of the brain pathway"],
    },
    "Partial cord infarct": {
      slots: { level: "the asymmetry between the two sides, side by side" },
      confirmatory: cordInfarct("the cord at and above the clinical level",
        "A partial or hemicord pattern is more often demyelinating or compressive than ischaemic in a younger patient — the abruptness of onset is what argues for infarction"),
      monitoringExtra: ["Watch for the deficit becoming complete over hours, which is common early and changes the prognosis conversation"],
    },
    "Cord infarct": {
      slots: { level: "the long tracts and the sensory level" },
      confirmatory: cordInfarct("the cord, with sagittal and axial diffusion",
        "Ask specifically about a preceding interscapular or radicular PAIN at onset — it is present in a majority and is the feature that most distinguishes infarction from myelitis"),
      monitoringExtra: ["Bladder function from the outset — retention is often established before the patient reports it"],
    },
    "Cord infarct at the conus": {
      slots: { level: "sphincter tone, saddle sensation and the ankle jerks" },
      confirmatory: cordInfarct("the conus and cauda equina",
        "At the conus the artery of Adamkiewicz territory is the vulnerable watershed — and sphincter failure appears EARLY here, disproportionate to the leg weakness"),
      monitoringExtra: ["Sphincter function is the outcome that matters most at this level — document it explicitly at every review rather than recording 'legs unchanged'"],
    },
  }),

  // Split out of "Cerebellar infarct or haemorrhage" on 2026-08-18 (owner ruling). It is NOT a member of
  // the infarct family: the first move diverges completely — reverse the anticoagulation and call the
  // surgeon, rather than ask about reperfusion. Round 2 may fold it into the haemorrhage family; until
  // then it stands alone, which is the honest shape for a single disease with its own answer.
  "Cerebellar haemorrhage": dz("Cerebellar haemorrhage", {
    confirmatory: [
      "NON-CONTRAST CT is immediate and diagnostic — and here it is not merely excluding blood, it IS the diagnosis and it changes the next hour completely",
      "MEASURE THE HAEMATOMA and look at the fourth ventricle: size and brainstem compression, not the deficit, are what drive the surgical decision — a patient can look well and still need evacuation. {flavour}",
      "Establish anticoagulant exposure IMMEDIATELY and reverse it — this is the single most time-critical action, ahead of any further imaging",
      "CT angiography where the patient is young, normotensive, or the haematoma sits atypically, looking for an underlying vascular malformation",
      "Delayed MRI once stable, for an underlying cavernoma, tumour or amyloid angiopathy the acute blood conceals",
    ],
    monitoring: [
      "SAFETY NET: the posterior fossa has no room. Deterioration can be abrupt and irreversible, so a falling conscious level is a call to the surgeon and the scanner in the same breath — not an observation to repeat in an hour",
      "Hourly observations tracking {level}, with an explicit escalation threshold agreed with neurosurgery in advance",
      "Watch for obstructive hydrocephalus from fourth-ventricle compression, which is treatable and is what usually kills here",
      "Blood pressure control, glucose and temperature as for any acute intracerebral haemorrhage",
    ],
    urgency: "emergency",
    referral: "Emergency neurosurgery — posterior-fossa haematomas are evacuated on size and brainstem compression, so refer before the patient deteriorates",
    bySite: {
      cerebellum_vermis: {
        level: "conscious level, with the fourth ventricle on every scan",
        flavour: "a MIDLINE haematoma sits directly on the fourth ventricle, so obstructive hydrocephalus arrives EARLY and may dominate before any brainstem sign appears",
      },
      cerebellum_hemisphere: {
        level: "conscious level, and the ipsilateral limbs for worsening ataxia",
        flavour: "a HEMISPHERIC haematoma compresses the brainstem laterally — this is the classic setting in which size and brainstem distortion, rather than the neurological deficit, drive the decision to evacuate",
      },
    },
  }),

  // ---- PROMOTED INTO TRANCHE 1 ON CLINICAL GROUNDS (owner ruling, 2026-08-18) ----
  // Only 2 host sites, so reuse count would have left it until tranche 3. It is nonetheless the app's
  // sharpest must-not-miss: both hosts are BPPV sites that badge "routine", and the whole clinical point
  // of the vestibular axis is that a peripheral-looking acute vestibular syndrome can be a stroke.
  "Posterior circulation stroke": dz("Posterior circulation stroke", {
    confirmatory: [
      "MRI with DWI — but a NEGATIVE early DWI does NOT exclude it: small posterior-fossa infarcts are missed in a substantial minority within the first 24-48 hours, so a convincing central examination outweighs a normal early scan",
      "CT angiography or MR angiography of the vertebrobasilar circulation, looking for vertebral dissection or basilar disease",
      "The bedside examination is the more sensitive test here: {flavour}",
      "Once the diagnosis is made, the usual ischaemic-stroke aetiology work-up — cardiac rhythm monitoring, echocardiography and vascular risk profiling",
    ],
    monitoring: [
      "SAFETY NET: a fluctuating or stuttering course in the posterior circulation can herald basilar occlusion — deterioration in conscious level, new cranial nerve signs or bilateral long-tract signs need immediate reimaging, not observation",
      "Swallow screen before anything by mouth, and monitor for the posterior-fossa oedema that peaks at 2-4 days and can obstruct CSF flow",
      "Track {level} on serial examination — that is where deterioration will show first",
    ],
    urgency: "emergency",
    referral: "Acute stroke pathway — time-critical, and reperfusion may be on the table",
    bySite: {
      peripheral_vestibular_posterior_canal: {
        level: "gaze holding, skew and limb coordination",
        flavour: "HINTS — a NORMAL head impulse in a patient with ongoing vertigo and nystagmus points CENTRAL, and direction-changing or downbeat positional nystagmus is not posterior-canal BPPV, whatever the Dix-Hallpike looks like",
      },
      peripheral_vestibular_horizontal_canal: {
        level: "gaze holding, skew and truncal stability",
        flavour: "HINTS — horizontal-canal BPPV also gives direction-changing nystagmus on the supine roll test, so the discriminators here are a normal head impulse, skew deviation, and truncal ataxia too severe to sit unsupported",
      },
    },
  }),

  "Intracerebral haemorrhage": dz("Intracerebral haemorrhage", {
    confirmatory: [
      "NON-CONTRAST CT is the immediate test and is diagnostic — this is the one situation where CT beats MRI for the primary question",
      "CT ANGIOGRAPHY in the same sitting: it looks for an underlying vascular lesion and for contrast extravasation within the haematoma, which predicts expansion",
      "Establish anticoagulant and antiplatelet exposure IMMEDIATELY — reversal is time-critical and is the single most modifiable factor in the first hour",
      "Delayed MRI with blood-sensitive sequences once stable, to find the cause the acute scan cannot show: lobar microbleeds suggesting amyloid angiopathy, an underlying tumour, or a cavernoma — {flavour}",
    ],
    monitoring: [
      "SAFETY NET: haematoma EXPANSION happens in the first hours and is the commonest cause of early deterioration — a fall in conscious level means repeat imaging immediately, not observation",
      "Blood pressure, conscious level and {level} on a frequent, defined schedule; intensive early blood-pressure lowering is standard practice and is a treatment, not a bystander observation",
      "Swallow screen before anything by mouth, and monitor for seizures, which are more frequent with lobar than deep haemorrhage",
      "A LOBAR haemorrhage in an older patient raises cerebral amyloid angiopathy, which changes future anticoagulation decisions permanently — flag it for the discharge summary rather than leaving it to be rediscovered",
    ],
    urgency: "emergency",
    referral: "Acute stroke pathway with neurosurgery; critical care if conscious level is falling",
    bySite: {
      cortex_mca_superior: {
        level: "face and arm power and speech output",
        flavour: "a lobar location in this territory raises amyloid angiopathy in an older patient and an underlying lesion in a younger one",
      },
      cortex_insula: {
        level: "conscious level, and blood pressure and rhythm",
        flavour: "insular haemorrhage is associated with autonomic and cardiac instability out of proportion to the deficit",
      },
      cortex_parietal: {
        level: "cortical sensation, neglect and fields",
        flavour: "neglect can make the patient appear unconcerned and mask deterioration — do not rely on their report of change",
      },
      cortex_hand_knob: {
        level: "isolated hand function, which mimics a peripheral nerve lesion",
        flavour: "a small haemorrhage here produces a strikingly focal deficit, and the cause matters more than the volume",
      },
    },
  }),
};
