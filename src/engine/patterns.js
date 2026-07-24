// patterns.js — cross-cutting SYNTHESIS over the observed findings (NOT localisation).
//
// The engine's localiser treats tone / reflex / wasting signs as non-localising annotations. Read
// TOGETHER, they answer the UMN-vs-LMN question — and the co-occurrence of BOTH is the motor-neurone-
// disease (ALS) precursor (no single site produces UMN + LMN, so a mixed picture spans levels). This is a
// transparent function over the finding set, not a per-syndrome rule table (derive, don't store).

const idOf = t => t.split("@")[0];

// UMN release / tone signs vs LMN denervation / lower-arc signs.
const UMN = new Set(["spasticity", "babinski", "hoffmann", "umn_signs", "grasp_reflex"]);
const LMN = new Set(["wasting", "fasciculations", "hypotonia", "lmn_weakness",
  "reflex_biceps_loss", "reflex_brachioradialis_loss", "reflex_triceps_loss",
  "reflex_knee_loss", "reflex_ankle_loss"]);

export function umnLmnPattern(observedSet) {
  const ids = [...observedSet].map(idOf);
  const umnSigns = [...new Set(ids.filter(f => UMN.has(f)))];
  const lmnSigns = [...new Set(ids.filter(f => LMN.has(f)))];
  const hasU = umnSigns.length > 0, hasL = lmnSigns.length > 0;
  let verdict = null, note = "";
  if (hasU && hasL) {
    verdict = "mixed";
    note = "Combined UMN + LMN signs — no single lesion produces both; consider motor neurone disease (MND/ALS) or a process spanning several levels.";
  } else if (hasU) {
    verdict = "UMN";
    note = "Upper motor neurone pattern (increased tone, hyperreflexia / extensor plantar) — the lesion is above the anterior horn (cortex → corticospinal tract).";
  } else if (hasL) {
    verdict = "LMN";
    note = "Lower motor neurone pattern (wasting, fasciculation, hypotonia, areflexia) — the lesion is at the anterior horn, root, plexus, nerve, or NMJ / muscle.";
  }
  return { verdict, umnSigns, lmnSigns, note };
}

// Positive functional (non-organic) signs. These do NOT localise and are never scored as an organic deficit.
const FND = new Set(["hoovers_sign", "give_way_weakness", "entrainment", "exam_inconsistency"]);

// SUBJECTIVE / effort-and-report-dependent findings — limb & truncal STRENGTH and SENSATION. Only these can
// be reinterpreted as functional. Every OTHER finding (pupils, facial droop, eye movements, fields, reflexes,
// tone, wasting/fasciculation, nystagmus, bulbar, cerebellar, movement disorders, RAPD, higher-cortical …) is
// treated as OBJECTIVE / UN-FAKEABLE: it cannot be volitionally produced, so its presence establishes organic
// pathology. SAFETY RULE: if any objective finding is present, the functional flag is SUPPRESSED — a serious
// sign (a blown pupil, a facial droop, a Babinski) must never be masked as "functional". Anything not listed
// here defaults to objective (the safe direction).
const SUBJECTIVE = new Set([
  // limb / truncal strength (effort-dependent power)
  "weak_arm", "weak_leg", "weak_hand", "weak_diaphragm", "proximal_weakness", "lmn_weakness", "distal_motor_weakness",
  "weak_shoulder_abduction", "weak_shoulder_external_rotation", "weak_scapular_stabilisation", "weak_elbow_flexion",
  "weak_elbow_extension", "weak_forearm_supination", "weak_forearm_pronation", "weak_wrist_extension",
  "weak_wrist_flexion", "weak_finger_extension", "weak_finger_flexion", "weak_finger_abduction",
  "weak_thumb_abduction", "weak_thumb_adduction", "weak_hip_flexion", "weak_hip_adduction", "weak_hip_abduction",
  "weak_knee_extension", "weak_knee_flexion", "weak_ankle_dorsiflexion", "weak_great_toe_extension",
  "weak_foot_eversion", "weak_foot_inversion", "weak_ankle_plantarflexion", "weak_toe_flexion",
  // sensation (subjective report)
  "dorsal_sensory", "spinothalamic", "suspended_sensory", "sensory_ataxia", "thalamic_pain", "radicular_pain",
  "cortical_sensory_arm", "cortical_sensory_leg", "cortical_sensory_hand", "distal_sensory_loss", "saddle_anaesthesia",
  "sensory_c3", "sensory_c4", "sensory_c5", "sensory_c6", "sensory_c7", "sensory_c8", "sensory_t1", "sensory_t4",
  "sensory_t10", "sensory_l1", "sensory_l2", "sensory_l3", "sensory_l4", "sensory_l5", "sensory_s1", "sensory_s2", "sensory_s3",
  "axillary_sensory", "musculocutaneous_sensory", "radial_sensory", "median_sensory", "median_palmar_sensory",
  "ulnar_sensory", "ulnar_dorsal_sensory", "femoral_sensory", "obturator_sensory", "lat_fem_cutaneous_sensory",
  "saphenous_sensory", "sciatic_sensory", "peroneal_sensory", "deep_peroneal_sensory", "tibial_sensory", "sural_sensory",
  // facial sensation (subjective report; functional hemisensory loss can include the face)
  "v1_sensory", "v2_sensory", "v3_sensory", "face_pain_loss", "face_touch_loss", "face_sensory_loss",
]);

export function functionalFlag(observedSet) {
  const ids = [...observedSet].map(idOf);
  const signs = [...new Set(ids.filter(f => FND.has(f)))];
  if (!signs.length) return { functional: false, suppressed: false, signs: [], objectiveSigns: [], note: "" };

  // any finding that is neither a functional sign nor a subjective (strength/sensation) finding is OBJECTIVE
  const objectiveSigns = [...new Set(ids.filter(f => !FND.has(f) && !SUBJECTIVE.has(f)))];
  if (objectiveSigns.length) {
    return {
      functional: false, suppressed: true, signs, objectiveSigns,
      note: `Functional sign(s) noted, but objective / un-fakeable findings are present (${objectiveSigns.slice(0, 3).join(", ")}${objectiveSigns.length > 3 ? ", …" : ""}) — these cannot be functional, so the deficit is organic. Not flagged as functional.`,
    };
  }
  return {
    functional: true, suppressed: false, signs, objectiveSigns: [],
    note: "Positive functional (non-organic) signs, with no un-fakeable organic finding — consider a functional neurological disorder. These do not localise and are not scored as an organic deficit.",
  };
}
