// score.js — how well does a site explain the observed findings?
//
// A good single-site explanation should:
//   - explain the findings the patient HAS (coverage of observed),
//   - not predict a lot the patient DOESN'T have (specificity), and
//   - especially explain the LOCALISING findings (cranial-nerve signs pin the level+side).
//
// We keep the scoring transparent and interpretable rather than a black box: every term is
// inspectable, which matters for a teaching tool and for clinician review.

import { expectedFindings } from "./forward.js";

// Findings that strongly pin location (nuclear/fascicular CN signs, gaze, INO, Horner, ataxia,
// face pain). Long-tract signs (hemiparesis, dorsal columns, spinothalamic) are less localising
// on their own because they run the length of the brainstem.
const LOCALISING = new Set([
  // ocular ductions — the DISCRIMINATING ones pin CN III/IV/VI; `ptosis` is shared (III / Horner / MG),
  // so it is deliberately NON-localising (localises only in combination, like naming_impaired in aphasia).
  "weak_adduction","weak_abduction","weak_elevation","weak_depression","vertical_diplopia",
  "cn8_vertigo","dysphagia","cn12_palsy",
  // facial_weakness is shared LMN+UMN → NON-localising; forehead_spared is the UMN discriminator (localising)
  "forehead_spared",
  "gaze_palsy","ino","vertical_gaze_palsy","miosis","limb_ataxia","face_pain_loss","tremor_rubral",
  "dysmetria","dysdiadochokinesis","intention_tremor","truncal_ataxia","ataxic_dysarthria", // cerebellar organ
  "nystagmus_peripheral","nystagmus_gaze_evoked","nystagmus_downbeat","nystagmus_upbeat","nystagmus_convergence_retraction","nystagmus_pendular", // nystagmus taxonomy
  "head_impulse_abnormal","skew_deviation", // HINTS — peripheral (abnormal HIT) vs central (skew)
  "nystagmus_positional_posterior","nystagmus_positional_horizontal","nystagmus_positional_anterior", // BPPV canal-specific
  "palatal_tremor", // Guillain-Mollaret triangle (dentato-rubro-olivary)
  "suspended_sensory", // cape-like dissociated loss strongly pins the central/intramedullary cord
  "saddle_anaesthesia","sphincter_dysfunction","umn_signs", // pin the below-cord region + CES/conus
  // NOTE: `lmn_weakness` was demoted (PNS increment) — it is a GENERAL lower-motor-neurone sign (anterior
  // horn, root, plexus, nerve all cause flaccid areflexic weakness), so it marks LMN-ness, not level. The
  // level-localisers are the specific sensory/pattern findings; cauda/conus keep saddle + sphincter (+ umn).
  // cortical localisers: higher-cortical signs + gaze + visual-field defects strongly pin the lobe/side
  "speech_nonfluent","comprehension_impaired","repetition_impaired", // aphasia features (naming_impaired is NON-localising — in every aphasia)
  "agraphia","acalculia","finger_agnosia","left_right_disorientation","motor_dysprosody","sensory_dysprosody",
  "neglect","anosognosia","constructional_apraxia","prosopagnosia","gaze_deviation",
  "limb_apraxia","alien_limb","urinary_incontinence","gait_apraxia", // motor-frontal + paracentral regions
  "ideomotor_apraxia","dressing_apraxia","cortical_deafness","kluver_bucy", // parietal + temporal
  "visual_agnosia","achromatopsia","alexia_without_agraphia", // ventral occipitotemporal (fusiform)
  "thalamic_tremor","face_sensory_loss","amnesia", // thalamic nuclei (VA/VL, VPM, anterior/DM)
  "diabetes_insipidus","thermodysregulation","hyperphagia","narcolepsy","circadian_disruption","endocrine_dysfunction", // hypothalamus
  "callosal_apraxia","tactile_anomia", // corpus callosum (disconnection)

  "homonymous_hemianopia","superior_quadrantanopia","inferior_quadrantanopia",
  "bitemporal_hemianopia","rapd","macular_sparing", // visual-pathway localisers (field-defect geometry + RAPD)
  "altitudinal_defect","central_scotoma", // optic-nerve field patterns (AION / optic neuritis)
  "fixed_dilated_pupil","light_near_dissociation", // pupillary efferent (parasympathetic) localisers
  "anhidrosis_face","anhidrosis_body", // sympathetic anhidrosis distribution — the Horner order axis
  "cortical_blindness","optic_ataxia","oculomotor_apraxia","simultanagnosia","abulia",
  // subcortical deep-grey localisers (the reused somatotopic motor/sensory findings stay
  // NON-localising on purpose — pure-motor/pure-sensory localisation emerges from parsimony)
  "thalamic_pain","hemiballismus","bradykinesia","rest_tremor","chorea","dystonia",
  // olfactory (CN I) + insular gustatory — each pins its structure (dysarthria stays NON-localising)
  "anosmia","gustatory_loss",
  "emotional_lability", // pseudobulbar affect — pins the bilateral corticobulbar site
  "sensory_ataxia", // dorsal-column / posterior-cord proprioceptive ataxia

  // peripheral skull-base cranial-nerve signs — each pins a foramen/compartment or a point on a nerve's course
  "optic_neuropathy","v1_sensory","v2_sensory","v3_sensory","hearing_loss",
  "lacrimation_loss","hyperacusis","taste_loss","facial_weak_branch",
  "gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm","weak_trapezius",
  // motor-unit diagnostic hallmarks (NMJ). NOTE deliberately NOT here: `fasciculations` (a general LMN
  // sign at any level) and `proximal_weakness` (shared by MG/LEMS/muscle → myopathy emerges by parsimony)
  "fatigable_weakness","fatigable_ocular","facilitating_weakness","autonomic_features",
  // nerve-root localisers — each dermatome/myotome/reflex pins a segment (the segment emerges from these)
  "sensory_c5","sensory_c6","sensory_c7","sensory_c8","sensory_t1","sensory_l2","sensory_l3","sensory_l4","sensory_l5","sensory_s1",
  "sensory_c3","sensory_c4","sensory_t4","sensory_t10","sensory_l1","sensory_s2","sensory_s3", // PNS-depth dermatomes
  "weak_diaphragm","saphenous_sensory","sural_sensory", // phrenic/diaphragm + extra sensory nerves
  "weak_c5","weak_c6","weak_c7","weak_c8","weak_t1","weak_l2","weak_l3","weak_l4","weak_l5","weak_s1",
  "reflex_biceps_loss","reflex_brachioradialis_loss","reflex_triceps_loss","reflex_knee_loss","reflex_ankle_loss",
  // polyneuropathy: the distal sensory loss is the stocking-glove hallmark (distal_motor_weakness left
  // non-localising, like proximal_weakness). radicular_pain stays non-localising (shared root sign).
  "distal_sensory_loss",
  // named-nerve cutaneous territories localise the nerve. MOVEMENTS are deliberately NON-localising —
  // they are shared across roots and nerves, so they refine/discriminate but don't pin (the sensory
  // territory does the pinning; pure-motor nerves localise by parsimony on their movement pattern).
  "axillary_sensory","musculocutaneous_sensory","radial_sensory","median_sensory","ulnar_sensory",
  "femoral_sensory","obturator_sensory","lat_fem_cutaneous_sensory","sciatic_sensory","peroneal_sensory","tibial_sensory",
  // nerve-segment cutaneous branches + the ulnar claw — each pins a nerve SEGMENT (level). Movements
  // (weak_forearm_pronation / weak_thumb_adduction) stay NON-localising, like every other movement.
  "deep_peroneal_sensory","ulnar_dorsal_sensory","median_palmar_sensory","ulnar_claw",
  // non-muscle reflexes: sacral arc + frontal grasp localise. Babinski/Hoffmann are NON-localising (they
  // run the length of the corticospinal tract, like hemiparesis); palmomental is non-specific.
  "anal_wink_loss","bulbocavernosus_loss","grasp_reflex",
  // consciousness / arousal — the ARAS/coma localisers + the locked-in hallmark + decerebrate posturing
  "reduced_consciousness","preserved_vertical_gaze","extensor_posturing",
  // trigeminal complex (pontine main sensory + motor V)
  "face_touch_loss","jaw_weakness"
]);

function findingIdOf(signed) { return signed.split("@")[0]; }

export function scoreSite(site, observedSet, opts = {}) {
  const expected = expectedFindings(site, opts);
  let matched = [], missedByPatient = [], unexplained = [];

  for (const obs of observedSet) {
    if (expected.has(obs)) matched.push(obs);
    else unexplained.push(obs); // patient has it, this site doesn't explain it
  }
  for (const exp of expected) {
    if (!observedSet.has(exp)) missedByPatient.push(exp); // site predicts it, patient lacks it
  }

  // Weight matches: localising findings count more.
  const matchScore = matched.reduce((a, s) => a + (LOCALISING.has(findingIdOf(s)) ? 3 : 1), 0);
  // Penalise findings this site cannot explain (these are what push toward multifocal).
  const unexplainedPenalty = unexplained.reduce((a, s) => a + (LOCALISING.has(findingIdOf(s)) ? 3 : 1), 0);
  // Mild penalty for over-prediction (site predicts findings the patient doesn't have).
  const overPredictPenalty = missedByPatient.length * 0.5;

  const score = matchScore - unexplainedPenalty - overPredictPenalty;
  return { site, score, matched, unexplained, missedByPatient, matchScore };
}

export { LOCALISING, findingIdOf };
