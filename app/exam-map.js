// exam-map.js — the exam-flow curation: findings organised the way a neurological examination runs.
// Data only. Every id must be a real finding (test/app-smoke.test.js enforces this); any finding not
// listed here is surfaced by app.js under an "Other findings" group, so nothing is ever lost.
export const EXAM_FLOW = [
  // ---- Higher function, subcategorised by lobe (Goal 1.i) ----
  { id: "frontal", label: "Higher function — frontal", findings: [
    "executive_dysfunction","abulia","disinhibition","limb_apraxia","alien_limb","gait_apraxia","callosal_apraxia" ] },
  { id: "parietal", label: "Higher function — parietal", findings: [
    "neglect","anosognosia","constructional_apraxia","dressing_apraxia","ideomotor_apraxia",
    "agraphia","acalculia","finger_agnosia","left_right_disorientation",
    "optic_ataxia","oculomotor_apraxia","simultanagnosia","tactile_anomia" ] },
  { id: "temporal", label: "Higher function — temporal", findings: [
    "verbal_memory_impairment","nonverbal_memory_impairment","amnesia","hallucinations","mood_change",
    "cortical_deafness","kluver_bucy" ] },
  { id: "occipital", label: "Higher function — occipital", findings: [
    "visual_agnosia","achromatopsia","prosopagnosia","alexia_without_agraphia","cortical_blindness" ] },
  { id: "language", label: "Speech & language", findings: [
    "speech_nonfluent","comprehension_impaired","repetition_impaired","naming_impaired","motor_dysprosody",
    "sensory_dysprosody","dysarthria","ataxic_dysarthria","emotional_lability" ] },
  { id: "arousal", label: "Consciousness & arousal", findings: [
    "reduced_consciousness","preserved_vertical_gaze","extensor_posturing" ] },
  { id: "cn1", label: "CN I — smell", findings: [ "anosmia" ] },
  { id: "cn2", label: "CN II — vision & fields", findings: [
    "optic_neuropathy","central_scotoma","altitudinal_defect","rapd","homonymous_hemianopia",
    "superior_quadrantanopia","inferior_quadrantanopia","bitemporal_hemianopia","macular_sparing" ] },
  { id: "eom", label: "CN III / IV / VI — eye movements", findings: [
    "ptosis","weak_adduction","weak_abduction","weak_elevation","weak_depression","vertical_diplopia",
    "gaze_deviation","nystagmus_gaze_evoked","nystagmus_downbeat","nystagmus_upbeat","nystagmus_pendular" ] },
  // ---- Brainstem: gaze coordination / internuclear / supranuclear (intra-axial) signs (Goal 1.iv) ----
  { id: "brainstem", label: "Brainstem — gaze & integrative signs", findings: [
    "gaze_palsy","ino","vertical_gaze_palsy","skew_deviation","lid_retraction","nystagmus_convergence_retraction" ] },
  { id: "pupils", label: "Pupils & oculosympathetic", findings: [
    "fixed_dilated_pupil","light_near_dissociation","miosis","anhidrosis_face","anhidrosis_body" ] },
  { id: "cn5", label: "CN V — face sensation & jaw", findings: [
    "v1_sensory","v2_sensory","v3_sensory","face_pain_loss","face_touch_loss","face_sensory_loss","jaw_weakness" ] },
  { id: "cn7", label: "CN VII — facial", findings: [
    "facial_weakness","forehead_spared","facial_weak_branch","lacrimation_loss","hyperacusis","taste_loss","gustatory_loss" ] },
  { id: "cn8", label: "CN VIII — hearing & vestibular", findings: [
    "hearing_loss","cn8_vertigo","nystagmus_peripheral","head_impulse_abnormal",
    "nystagmus_positional_posterior","nystagmus_positional_horizontal","nystagmus_positional_anterior" ] },
  { id: "bulbar", label: "CN IX / X / XI / XII — bulbar & neck", findings: [
    "dysphagia","gag_afferent_loss","taste_posterior","palatal_weakness","vocal_cord_palsy","weak_scm",
    "weak_trapezius","cn12_palsy" ] },
  { id: "power", label: "Motor — power (patterns)", findings: [
    "weak_arm","weak_leg","weak_hand","weak_diaphragm","proximal_weakness","lmn_weakness","distal_motor_weakness" ] },
  { id: "movements", label: "Motor — segmental movements (roots / nerves)", findings: [
    "weak_shoulder_abduction","weak_shoulder_external_rotation","weak_scapular_stabilisation","weak_elbow_flexion",
    "weak_elbow_extension","weak_forearm_supination","weak_forearm_pronation","weak_wrist_extension",
    "weak_wrist_flexion","weak_finger_extension","weak_finger_flexion","weak_finger_abduction",
    "weak_thumb_abduction","weak_thumb_adduction","ulnar_claw","weak_hip_flexion","weak_hip_adduction",
    "weak_hip_abduction","weak_knee_extension","weak_knee_flexion","weak_ankle_dorsiflexion",
    "weak_great_toe_extension","weak_foot_eversion","weak_foot_inversion","weak_ankle_plantarflexion","weak_toe_flexion" ] },
  { id: "tone", label: "Tone", findings: [ "spasticity","rigidity","hypotonia" ] },
  { id: "reflexes", label: "Reflexes", findings: [
    "babinski","hoffmann","umn_signs","reflex_biceps_loss","reflex_brachioradialis_loss","reflex_triceps_loss",
    "reflex_knee_loss","reflex_ankle_loss","grasp_reflex","palmomental","anal_wink_loss","bulbocavernosus_loss" ] },
  { id: "coordination", label: "Coordination & cerebellar", findings: [
    "limb_ataxia","dysmetria","dysdiadochokinesis","intention_tremor","truncal_ataxia","tremor_rubral","palatal_tremor" ] },
  { id: "sensation", label: "Sensation", findings: [
    "dorsal_sensory","spinothalamic","suspended_sensory","sensory_ataxia","thalamic_pain",
    "cortical_sensory_arm","cortical_sensory_leg","cortical_sensory_hand","saddle_anaesthesia","distal_sensory_loss","radicular_pain",
    "sensory_c3","sensory_c4","sensory_c5","sensory_c6","sensory_c7","sensory_c8","sensory_t1","sensory_t4",
    "sensory_t10","sensory_l1","sensory_l2","sensory_l3","sensory_l4","sensory_l5","sensory_s1","sensory_s2","sensory_s3",
    "axillary_sensory","musculocutaneous_sensory","radial_sensory","median_sensory","median_palmar_sensory","ulnar_sensory",
    "ulnar_dorsal_sensory","femoral_sensory","obturator_sensory","lat_fem_cutaneous_sensory","saphenous_sensory",
    "sciatic_sensory","peroneal_sensory","deep_peroneal_sensory","tibial_sensory","sural_sensory" ] },
  { id: "movement_dis", label: "Movement disorders", findings: [ "bradykinesia","rest_tremor","chorea","dystonia","hemiballismus","thalamic_tremor" ] },
  { id: "fatiguability", label: "Fatiguability / augmentation with repetition", findings: [
    "fatigable_weakness","fatigable_ocular","facilitating_weakness","autonomic_features" ] },
  { id: "autonomic", label: "Autonomic, sphincter & hypothalamic", findings: [
    "sphincter_dysfunction","urinary_incontinence","diabetes_insipidus","thermodysregulation",
    "hyperphagia","narcolepsy","circadian_disruption","endocrine_dysfunction" ] },
  { id: "wasting", label: "Wasting & fasciculations", findings: [ "wasting","fasciculations" ] },
  { id: "functional", label: "Functional signs (positive)", findings: [
    "hoovers_sign","give_way_weakness","entrainment","exam_inconsistency" ] },
];

// worked-example presets — findings as `finding@side` tokens (demo the engine)
export const PRESETS = [
  { label: "Wallenberg", tokens: ["face_pain_loss@left","spinothalamic@right","miosis@left","ptosis@left","palatal_weakness@left","vocal_cord_palsy@left","dysphagia@left","cn8_vertigo@left","limb_ataxia@left","nystagmus_gaze_evoked@none"] },
  { label: "Bell's palsy", tokens: ["facial_weakness@left"] },
  { label: "Ramsay Hunt", tokens: ["facial_weakness@left","lacrimation_loss@left","hyperacusis@left","taste_loss@left"] },
  { label: "Wernicke's aphasia", tokens: ["comprehension_impaired@none","repetition_impaired@none","naming_impaired@none"] },
  { label: "Lateral medullary vs stroke (HINTS)", tokens: ["cn8_vertigo@left","nystagmus_gaze_evoked@none","skew_deviation@none"] },
  { label: "Pure-motor lacune", tokens: ["weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right","babinski@right"] },
  { label: "SCD (B12)", tokens: ["dorsal_sensory@left","dorsal_sensory@right","spasticity@left","spasticity@right","babinski@left","babinski@right","sensory_ataxia@none"] },
  { label: "Cavernous sinus", tokens: ["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left","weak_abduction@left","vertical_diplopia@left","v1_sensory@left","v2_sensory@left","miosis@left"] },
];
