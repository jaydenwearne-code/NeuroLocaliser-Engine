// examples.js — four worked cases, as pure data. Content lives here rather than in app.js so it can be
// unit-tested and clinically reviewed without reading UI code (same split as exam-map.js).
//
// CHOSEN SO EACH DEMONSTRATES A DIFFERENT OUTPUT CARD, not to be the four commonest presentations:
// where / the narrowing / next steps / together.
//
// The tokens are DERIVED from each site's own expectedFindings and then trimmed to a realistic bedside
// subset — hand-typing them produced a Wallenberg that resolved to Marie-Foix explaining 2 of 5 findings.
// test/examples.test.js asserts each one still teaches its point; do not edit tokens without running it.
export const EXAMPLES = [
  {
    id: "wallenberg",
    label: "Wallenberg",
    teaches: "one lesion, an eponym",
    // The full syndrome is 13 findings, which nobody records at the bedside. This is the clinically
    // representative six and still resolves 6/6.
    tokens: ["cn8_vertigo@left", "face_pain_loss@left", "spinothalamic@right",
             "ptosis@left", "miosis@left", "limb_ataxia@left"],
    onset: "hyperacute",
  },
  {
    id: "footdrop",
    label: "Foot drop",
    teaches: "narrow it down",
    // DELIBERATELY only the findings L5 and peroneal SHARE, so three candidates appear and none wins.
    // Adding weak hip abduction pins the root; adding deep peroneal sensory loss pins the nerve.
    tokens: ["weak_ankle_dorsiflexion@left", "weak_great_toe_extension@left", "weak_foot_eversion@left"],
  },
  {
    id: "cauda",
    label: "Cauda equina",
    teaches: "an emergency",
    tokens: ["saddle_anaesthesia@midline", "sphincter_dysfunction@midline",
             "radicular_pain@midline", "anal_wink_loss@midline"],
    onset: "acute",
  },
  {
    id: "twolesions",
    label: "Two lesions",
    teaches: "one disease, two places",
    tokens: ["weak_arm@right", "weak_leg@left"],
    onset: "subacute",
    course: "relapsing",
  },
];

// ---- CROSS-SITE ARCHETYPES (2026-08-21) ----
// One canonical picture per MULTIFOCAL entity, so every cross-site workup can be read against a case a
// clinician would recognise. They exist because the first review round was conducted against pictures found
// MECHANICALLY (the smallest two-site case that made each entity fire), which produced bilateral labyrinths
// for neurosarcoidosis and bilateral phrenic nerves for mononeuritis multiplex — mechanically valid,
// clinically absurd.
//
// SITES CHOSEN CLINICALLY, TOKENS DERIVED FROM THEM. Every token here came out of the two sites' own
// `expectedFindings` and was then trimmed to a bedside-realistic subset — never hand-typed. That is the
// lesson from the 2026-08-16 worked examples, where hand-typed tokens produced a Wallenberg that resolved
// to Marie-Foix. `test/multifocal-archetypes.test.js` re-derives and re-verifies all 13 on every run.
//
// EACH CARRIES ITS `course`, and that is the teaching payload, not decoration. **Metastases and Embolic
// shower are the SAME picture** — left face/arm weakness with a right homonymous hemianopia — and separate
// ONLY on how the illness unfolded: stepwise-progressive over weeks versus everything at once. Two cards,
// one anatomy, different diseases.
//
// EVERY ONE PINS ITS PAIR. The engine's free minimal cover is right for 12 of the 13, but embolic shower
// needs the pinned pair to satisfy its `distribution: "segment"` rule — an unpinned cover picks the optic
// radiation, which is the same arterial territory as the motor cortex, so no distinct segments and the
// entity cannot fire. Pinning also makes each example deterministic, which is what a teaching case needs.
export const CROSS_SITE_EXAMPLES = [
  { id: "x-ms", label: "Optic + cord", teaches: "Multiple sclerosis",
    entity: "Multiple sclerosis",
    pinned: ["left_skull_base_optic_neuritis", "bilateral_cord_posterior"],
    tokens: ["rapd@left", "va_reduced_no_pinhole@left", "dorsal_sensory@left", "dorsal_sensory@right", "sensory_ataxia@none"],
    onset: "subacute", course: "relapsing" },

  { id: "x-nmosd", label: "Optic + transverse myelitis", teaches: "NMOSD",
    entity: "NMOSD (neuromyelitis optica spectrum disorder)",
    pinned: ["left_skull_base_optic_neuritis", "bilateral_cord_transverse"],
    tokens: ["rapd@left", "va_reduced_no_pinhole@left", "weak_leg@left", "weak_leg@right",
             "spinothalamic@left", "spinothalamic@right", "babinski@left", "babinski@right"],
    onset: "acute", course: "relapsing" },

  // Its own roster `feature` says "cranial neuropathy (especially facial, often bilateral)".
  { id: "x-sarcoid", label: "Bilateral facial palsy", teaches: "Neurosarcoidosis",
    entity: "Neurosarcoidosis",
    pinned: ["left_skull_base_vii_geniculate", "right_skull_base_vii_geniculate"],
    tokens: ["facial_weakness@left", "facial_weakness@right", "taste_loss@left", "taste_loss@right"],
    onset: "subacute", course: "progressive" },

  { id: "x-vasculitis", label: "Ulnar + peroneal", teaches: "Vasculitis",
    entity: "Vasculitis (CNS or systemic)",
    pinned: ["left_nerve_ulnar_elbow", "right_nerve_peroneal_common"],
    tokens: ["weak_finger_abduction@left", "ulnar_sensory@left", "weak_ankle_dorsiflexion@right", "peroneal_sensory@right"],
    onset: "acute", course: "stepwise" },

  { id: "x-mnm", label: "Foot drop + wrist drop", teaches: "Mononeuritis multiplex",
    entity: "Mononeuritis multiplex",
    pinned: ["left_nerve_peroneal_common", "right_nerve_radial_spiral_groove"],
    tokens: ["weak_ankle_dorsiflexion@left", "peroneal_sensory@left", "weak_wrist_extension@right", "radial_sensory@right"],
    onset: "acute", course: "stepwise" },

  // PAIRED WITH x-embolic BELOW: identical tokens and pins, opposite course. Do not "tidy" them apart.
  { id: "x-mets", label: "Two territories, over weeks", teaches: "Metastases",
    entity: "Metastases",
    pinned: ["left_cortex_motor_facearm", "right_cortex_occipital"],
    tokens: ["facial_weakness@right", "forehead_spared@right", "weak_arm@right", "homonymous_hemianopia@left"],
    onset: "subacute", course: "progressive" },

  { id: "x-embolic", label: "Two territories, all at once", teaches: "Embolic shower",
    entity: "Embolic shower (cardiac or aortic source)",
    pinned: ["left_cortex_motor_facearm", "right_cortex_occipital"],
    tokens: ["facial_weakness@right", "forehead_spared@right", "weak_arm@right", "homonymous_hemianopia@left"],
    onset: "hyperacute", course: "simultaneous" },

  { id: "x-lepto", label: "Cranial nerve + root", teaches: "Leptomeningeal disease",
    entity: "Leptomeningeal disease",
    pinned: ["left_skull_base_vii_stylomastoid", "left_root_l5"],
    tokens: ["facial_weakness@left", "radicular_pain@left", "weak_ankle_dorsiflexion@left", "sensory_l5@left"],
    onset: "subacute", course: "progressive" },

  { id: "x-pcnsl", label: "Two deep lesions", teaches: "Primary CNS lymphoma",
    entity: "Primary CNS lymphoma",
    pinned: ["left_cortex_motor_facearm", "right_cortex_motor_leg"],
    tokens: ["facial_weakness@right", "forehead_spared@right", "weak_arm@right", "weak_leg@left", "babinski@left"],
    onset: "subacute", course: "progressive" },

  { id: "x-nf2", label: "Bilateral hearing loss", teaches: "Neurofibromatosis type 2",
    entity: "Neurofibromatosis type 2",
    pinned: ["left_skull_base_iam", "right_skull_base_iam"],
    tokens: ["hearing_loss@left", "hearing_loss@right", "facial_weakness@left", "facial_weakness@right"],
    onset: "chronic", course: "progressive" },

  // UMN and LMN together with NO sensory findings — the entity `forbids` the sensory class, so a single
  // sensory token here would silently stop it firing.
  { id: "x-mnd", label: "Wasting with brisk reflexes", teaches: "Motor neurone disease",
    entity: "Motor neurone disease (ALS)",
    pinned: ["motor_unit_anterior_horn", "bilateral_cord_anterior"],
    tokens: ["fasciculations@left", "fasciculations@right", "lmn_weakness@left", "lmn_weakness@right",
             "wasting@left", "wasting@right", "hoffmann@left", "hoffmann@right", "babinski@left", "babinski@right"],
    onset: "subacute", course: "progressive" },

  { id: "x-paraneo", label: "Cerebellar + limbic", teaches: "Paraneoplastic syndrome",
    entity: "Paraneoplastic syndrome",
    pinned: ["cerebellum_pancerebellar", "left_thalamus_limbic"],
    tokens: ["limb_ataxia@left", "limb_ataxia@right", "truncal_ataxia@none", "ataxic_dysarthria@none", "amnesia@none"],
    onset: "subacute", course: "progressive" },

  { id: "x-syphilis", label: "Dorsal columns + cognition", teaches: "Neurosyphilis or HIV",
    entity: "Neurosyphilis or HIV",
    pinned: ["bilateral_cord_posterior", "left_cortex_dlpfc"],
    tokens: ["dorsal_sensory@left", "dorsal_sensory@right", "sensory_ataxia@none", "executive_dysfunction@none"],
    onset: "subacute", course: "progressive" },
];
