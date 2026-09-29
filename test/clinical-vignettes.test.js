// clinical-vignettes.test.js — the engine against the bedside (accuracy round 1, 2026-09-26).
//
// Each case is a presentation entered the way a clinician would record it, with the lesion a clinician
// would expect. These are CLINICAL CLAIMS, reviewed by the owner, not derived from the model — that is the
// point: every other suite checks the model against itself, this one checks it against the textbook.
//
// Three kinds of assertion:
//   first  — the expected lesion is ranked FIRST (r.display[0])
//   top    — the expected lesion is within the first k, where the case is genuinely ambiguous at the
//            bedside (the reason is stated per case)
//   single — a single-lesion textbook case must NOT produce a multifocal claim (r.multi === null). This is
//            the class the round-1 audit found: a site missing one of its own cardinal features made the
//            complete picture read as TWO lesions.
//
// Tokens follow the engine's STRICT vocabulary (owner ruling 2026-09-25): `weak_leg`/`weak_arm` are
// pyramidal weakness; a lower-motor-neurone picture is entered with LMN / myotome / reflex findings.
import { solve } from "../src/engine/inverse.js";
import { functionalFlag } from "../src/engine/patterns.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };
const L = s => s.split(/\s+/).filter(Boolean);

// [label, tokens, { first?: RegExp, top?: [k, RegExp], single?: true }]
const CASES = [
  // ---- brainstem ----
  ["Weber", "ptosis@left weak_adduction@left weak_elevation@left weak_depression@left weak_arm@right weak_leg@right facial_weakness@right forehead_spared@right", { first: /^left_midbrain_medial$/, single: true }],
  ["Wallenberg (with dysphagia)", "face_pain_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left cn8_vertigo@left", { first: /^left_medulla_lateral$/, single: true }],
  ["Medial medullary (Dejerine)", "cn12_palsy@left weak_arm@right weak_leg@right dorsal_sensory@right", { first: /^left_medulla_medial$/, single: true }],
  ["Millard-Gubler", "weak_abduction@left facial_weakness@left weak_arm@right weak_leg@right", { first: /^left_pons_medial$/, single: true }],
  ["Foville", "gaze_palsy@left facial_weakness@left weak_arm@right weak_leg@right", { first: /^left_pons_medial$/, single: true }],
  // INO: the MLF runs from the pons to the midbrain, so either level is correct.
  ["INO", "ino@left", { top: [3, /^left_(pons|midbrain)_/] }],
  ["One-and-a-half", "gaze_palsy@left ino@left", { first: /^left_pons_medial$/, single: true }],
  ["AICA — lateral inferior pons", "facial_weakness@left forehead_involved@left hearing_loss@left face_pain_loss@left spinothalamic@right limb_ataxia@left cn8_vertigo@left", { first: /^left_pons_lateral$/, single: true }],
  ["Crossed: right LMN face, left body", "facial_weakness@right forehead_involved@right weak_arm@left weak_leg@left", { first: /^right_pons_medial$/, single: true }],
  ["Locked-in", "weak_arm@left weak_arm@right weak_leg@left weak_leg@right preserved_vertical_gaze@none", { first: /^locked_in$/, single: true }],
  ["Pseudobulbar palsy", "dysarthria@none emotional_lability@none", { first: /^pseudobulbar_corticobulbar$/ }],
  ["Parinaud", "vertical_gaze_palsy@none light_near_dissociation@left light_near_dissociation@right nystagmus_convergence_retraction@none lid_retraction@none", { first: /^parinaud_dorsal_midbrain$/, single: true }],
  ["Percheron (drowsy, vertical gaze, amnesia)", "reduced_consciousness@none vertical_gaze_palsy@none amnesia@none", { first: /^thalamus_bilateral_percheron$/, single: true }],

  // ---- deep and cortical ----
  // Pure motor hemiparesis: capsule, corona radiata and basis pontis are all correct lacunar answers.
  ["Pure motor hemiparesis", "facial_weakness@right forehead_spared@right weak_arm@right weak_leg@right", { first: /^left_(subcortex_(internal_capsule|corona_radiata)|pons_basis_pontis)$/, single: true }],
  ["Pure sensory stroke (face, arm, leg)", "spinothalamic@right dorsal_sensory@right face_sensory_loss@right", { first: /^left_subcortex_thalamus$/, single: true }],
  ["Hemibody pain-temperature loss alone", "spinothalamic@left", { first: /^right_subcortex_thalamus$/ }],
  ["Sensorimotor stroke", "weak_arm@right weak_leg@right spinothalamic@right dorsal_sensory@right", { first: /^left_subcortex_sensorimotor$/, single: true }],
  ["Anterior choroidal triad", "weak_arm@right weak_leg@right spinothalamic@right homonymous_hemianopia@right", { first: /^left_subcortex_anterior_choroidal$/, single: true }],
  ["Complete dominant MCA", "speech_nonfluent@none comprehension_impaired@none weak_arm@right facial_weakness@right forehead_spared@right homonymous_hemianopia@right", { first: /^left_cortex_mca$/, single: true }],
  ["Complete non-dominant MCA", "neglect@left anosognosia@none weak_arm@left facial_weakness@left forehead_spared@left homonymous_hemianopia@left", { first: /^right_cortex_mca$/, single: true }],
  ["ACA with incontinence", "weak_leg@right cortical_sensory_leg@right abulia@none urinary_incontinence@none", { first: /^left_cortex_aca$/, single: true }],
  ["PCA — hemianopia with macular sparing", "homonymous_hemianopia@right macular_sparing@right", { first: /^left_cortex_(occipital|pca)$/, single: true }],
  ["Broca with anomia and face-arm weakness", "speech_nonfluent@none naming_impaired@none weak_arm@right facial_weakness@right forehead_spared@right", { first: /^left_cortex_mca_superior$/, single: true }],
  ["Wernicke with anomia", "comprehension_impaired@none repetition_impaired@none naming_impaired@none", { first: /^left_cortex_temporoparietal$/, single: true }],
  ["Wernicke with hemianopia (inferior division)", "comprehension_impaired@none repetition_impaired@none naming_impaired@none homonymous_hemianopia@right", { first: /^left_cortex_mca_inferior$/, single: true }],
  ["Conduction aphasia", "repetition_impaired@none", { first: /^left_cortex_arcuate$/ }],
  ["Gerstmann tetrad", "agraphia@none acalculia@none finger_agnosia@none left_right_disorientation@none", { first: /^left_cortex_parietal$/, single: true }],
  ["Isolated anomia", "naming_impaired@none", { first: /^left_cortex_angular$/ }],
  ["Cortical hand", "weak_hand@right", { first: /^left_cortex_hand_knob$/ }],
  ["UMN face (forehead spared)", "facial_weakness@left forehead_spared@left", { first: /^right_(cortex|subcortex)_/ }],
  ["Hemiparesis alone", "weak_arm@right weak_leg@right", { first: /^left_(subcortex|cortex)_/ }],
  ["Arm weakness alone", "weak_arm@right", { first: /^left_(cortex|subcortex)_/ }],
  // Ataxic hemiparesis: basis pontis and the capsule/corona are all recognised lacunar sites.
  ["Ataxic hemiparesis", "weak_leg@right limb_ataxia@right", { top: [3, /^left_(pons_basis_pontis|subcortex_)/] }],
  ["Parkinsonism", "bradykinesia@left rest_tremor@left rigidity@left", { first: /^right_basal_ganglia_substantia_nigra$/, single: true }],
  ["Hemiballismus", "hemiballismus@left", { first: /^right_basal_ganglia_subthalamic$/ }],
  ["Cerebellar hemisphere", "limb_ataxia@left dysmetria@left intention_tremor@left dysdiadochokinesis@left", { first: /^left_cerebellum_hemisphere$/, single: true }],
  ["Vermis", "truncal_ataxia@none", { first: /^cerebellum_vermis$/ }],
  // HINTS central with ataxia: lateral medulla and cerebellum are both correct.
  ["HINTS central + ataxia", "cn8_vertigo@left skew_deviation@none nystagmus_gaze_evoked@none limb_ataxia@left", { top: [2, /^left_(medulla_lateral|cerebellum_hemisphere|medulla_hemi)$/] }],

  // ---- visual pathway ----
  ["Chiasm", "bitemporal_hemianopia@midline", { first: /^visual_pathway_chiasm$/ }],
  ["Optic neuritis", "central_scotoma@left rapd@left", { first: /^left_skull_base_optic_neuritis$/, single: true }],
  ["Central retinal artery occlusion", "retinal_pallor@left va_reduced_no_pinhole@left", { first: /^left_visual_pathway_retina$/, single: true }],

  // ---- cranial nerves and skull base ----
  ["Bell's palsy (forehead weak)", "facial_weakness@left forehead_involved@left", { first: /^left_skull_base_vii_stylomastoid$/ }],
  ["Facial nerve + hyperacusis + taste", "facial_weakness@left forehead_involved@left hyperacusis@left taste_loss@left", { first: /^left_skull_base_vii_(tympanic|geniculate)$/, single: true }],
  ["CN III compressive (pupil involved)", "ptosis@left weak_adduction@left weak_elevation@left weak_depression@left fixed_dilated_pupil@left", { first: /^left_pupil_cn3_compressive$/, single: true }],
  ["CN III pupil-sparing", "ptosis@left weak_adduction@left weak_elevation@left weak_depression@left", { first: /^left_pupil_cn3_ischaemic$/, single: true }],
  ["CN VI", "weak_abduction@left", { first: /^left_skull_base_vi_/ }],
  ["CN IV", "vertical_diplopia@left weak_depression@left", { top: [2, /trochlear/] }],
  ["Cavernous sinus", "weak_abduction@left ptosis@left weak_adduction@left v1_sensory@left v2_sensory@left", { first: /^left_skull_base_cavernous_sinus$/, single: true }],
  ["CPA (vestibular schwannoma)", "hearing_loss@left v1_sensory@left facial_weakness@left limb_ataxia@left", { first: /^left_skull_base_cpa$/, single: true }],
  ["Jugular foramen (Vernet)", "gag_afferent_loss@left palatal_weakness@left vocal_cord_palsy@left weak_scm@left weak_trapezius@left", { first: /^left_skull_base_jugular_foramen$/, single: true }],
  ["Collet-Sicard", "palatal_weakness@left vocal_cord_palsy@left weak_scm@left weak_trapezius@left cn12_palsy@left gag_afferent_loss@left", { first: /^left_skull_base_collet_sicard$/, single: true }],
  // Horner alone does not localise along the three-neurone chain; any point on it is correct.
  ["Horner (ptosis + miosis)", "ptosis@left miosis@left", { top: [3, /sympathetic|carotid|medulla_lateral|pons_lateral/] }],
  ["Pancoast", "weak_finger_abduction@left sensory_c8@left sensory_t1@left miosis@left ptosis@left", { first: /^left_sympathetic_pancoast$/, single: true }],

  // ---- vestibular ----
  ["Vestibular neuritis", "cn8_vertigo@left nystagmus_peripheral@none head_impulse_abnormal@none", { first: /^left_peripheral_vestibular_labyrinth$/, single: true }],
  ["Labyrinthitis (with hearing loss)", "cn8_vertigo@left hearing_loss@left nystagmus_peripheral@none head_impulse_abnormal@none", { first: /^left_peripheral_vestibular_labyrinth$/, single: true }],
  // Vertigo + hearing loss without HINTS: the labyrinth first, AICA stroke must still be on the list.
  ["Vertigo + hearing loss — AICA on the list", "cn8_vertigo@left hearing_loss@left", { top: [3, /^left_pons_lateral$/] }],
  ["Posterior-canal BPPV", "nystagmus_positional_posterior@none cn8_vertigo@left", { first: /^left_peripheral_vestibular_posterior_canal$/, single: true }],
  ["Isolated vertigo", "cn8_vertigo@left", { first: /^left_peripheral_vestibular_posterior_canal$/ }],

  // ---- cord and below ----
  ["Brown-Sequard", "weak_leg@left dorsal_sensory@left spinothalamic@right babinski@left", { first: /^left_cord_hemi$/, single: true }],
  ["Anterior cord with sphincter", "weak_leg@left weak_leg@right spinothalamic@left spinothalamic@right sphincter_dysfunction@midline", { first: /^bilateral_cord_anterior$/, single: true }],
  ["Transverse myelopathy with sphincter", "weak_leg@left weak_leg@right spinothalamic@left spinothalamic@right dorsal_sensory@left dorsal_sensory@right sphincter_dysfunction@midline", { first: /^bilateral_cord_transverse$/, single: true }],
  // Cord compression: anterior and transverse are both correct cross-sections for this picture.
  ["Cord compression with retention", "weak_leg@left weak_leg@right babinski@left babinski@right sphincter_dysfunction@midline spinothalamic@left spinothalamic@right", { first: /^bilateral_cord_(anterior|transverse)$/, single: true }],
  ["Cervical myelopathy", "weak_arm@left weak_arm@right weak_leg@left weak_leg@right babinski@left babinski@right hoffmann@left hoffmann@right dorsal_sensory@left dorsal_sensory@right", { first: /^bilateral_cord_transverse$/, single: true }],
  ["Central cord / syrinx", "suspended_sensory@left suspended_sensory@right", { first: /^bilateral_cord_central$/ }],
  ["Subacute combined degeneration", "dorsal_sensory@left dorsal_sensory@right sensory_ataxia@none babinski@left babinski@right reflex_ankle_loss@left reflex_ankle_loss@right", { first: /^combined_degeneration_scd$/, single: true }],
  // Saddle + sphincter alone: conus and cauda are both correct until the reflexes or the pain decide.
  ["Saddle anaesthesia + sphincter", "saddle_anaesthesia@midline sphincter_dysfunction@midline", { top: [2, /^(cauda_equina|conus_medullaris)$/] }],
  ["Cauda equina, asymmetric ankle jerk", "saddle_anaesthesia@midline sphincter_dysfunction@midline reflex_ankle_loss@right radicular_pain@midline", { first: /^cauda_equina$/, single: true }],
  // UMN signs split into brisk reflexes + up-going plantar (owner ruling 2026-09-29).
  ["Conus", "saddle_anaesthesia@midline sphincter_dysfunction@midline hyperreflexia@midline babinski@midline", { first: /^conus_medullaris$/, single: true }],

  // ---- roots, plexus, nerves ----
  ["L5 radiculopathy", "weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_hip_abduction@left sensory_l5@left", { first: /^left_root_l5$/, single: true }],
  ["S1 radiculopathy", "weak_ankle_plantarflexion@left sensory_s1@left reflex_ankle_loss@left", { first: /^left_root_s1$/, single: true }],
  ["Common peroneal palsy", "weak_ankle_dorsiflexion@left weak_foot_eversion@left peroneal_sensory@left", { first: /^left_nerve_peroneal_common$/, single: true }],
  // Foot drop with weak inversion: L4 and L5 both supply tibialis anterior and posterior.
  ["Foot drop with weak inversion", "weak_ankle_dorsiflexion@left weak_foot_inversion@left", { top: [2, /^left_root_l5$/] }],
  ["Carpal tunnel", "median_sensory@left weak_thumb_abduction@left", { first: /^left_nerve_median_carpal_tunnel$/, single: true }],
  // The ulnar claw is deliberately absent: it is WORSE with the distal (wrist) lesion — the ulnar paradox.
  ["Ulnar neuropathy at the elbow", "ulnar_sensory@left ulnar_dorsal_sensory@left weak_finger_abduction@left", { first: /^left_nerve_ulnar_elbow$/, single: true }],
  ["Radial nerve, spiral groove", "weak_wrist_extension@left weak_finger_extension@left radial_sensory@left", { first: /^left_nerve_radial_spiral_groove$/, single: true }],
  // Erb: C5 root and upper trunk give the same picture; both are correct.
  ["Erb (upper trunk)", "weak_shoulder_abduction@left weak_elbow_flexion@left weak_shoulder_external_rotation@left sensory_c5@left reflex_biceps_loss@left", { top: [2, /^left_(plexus_upper_trunk|root_c5)$/] }],
  ["Femoral neuropathy", "weak_knee_extension@left reflex_knee_loss@left femoral_sensory@left", { first: /^left_nerve_femoral$/, single: true }],
  ["Meralgia paraesthetica", "lat_fem_cutaneous_sensory@left", { first: /^left_nerve_lat_fem_cutaneous$/ }],
  ["Length-dependent neuropathy with areflexia", "distal_sensory_loss@left distal_sensory_loss@right reflex_ankle_loss@left reflex_ankle_loss@right", { first: /^polyneuropathy_length_dependent$/, single: true }],
  ["Guillain-Barré (symmetric LMN + areflexia)", "lmn_weakness@left lmn_weakness@right reflex_knee_loss@left reflex_knee_loss@right reflex_ankle_loss@left reflex_ankle_loss@right", { first: /^polyradiculoneuropathy_acute$/, single: true }],
  ["Bilateral LMN facial weakness", "facial_weakness@left facial_weakness@right forehead_involved@left forehead_involved@right", { first: /^polyradiculoneuropathy_acute$/ }],

  // ---- motor unit ----
  ["Ocular myasthenia, one side", "fatigable_ocular@left", { first: /^motor_unit_nmj_postsynaptic$/ }],
  ["Unilateral fasciculations", "fasciculations@left", { first: /^motor_unit_anterior_horn$/ }],
  // The autonomic features split into five findings shared with GBS (owner ruling 2026-09-29).
  ["Lambert-Eaton", "facilitating_weakness@left facilitating_weakness@right proximal_weakness@left proximal_weakness@right dry_mouth@none constipation@none", { first: /^motor_unit_nmj_presynaptic$/, single: true }],
];

for (const [label, toks, want] of CASES) {
  const r = solve(new Set(L(toks)), { dominantSide: "left" });
  const ids = r.display.map(c => c.site.id);
  if (want.first) ok(`${label}: first is ${want.first}`, want.first.test(ids[0] || ""), `got ${ids.slice(0, 3).join(", ")}`);
  if (want.top) {
    const [k, re] = want.top;
    ok(`${label}: in the top ${k}`, ids.slice(0, k).some(id => re.test(id)), `got ${ids.slice(0, k).join(", ")}`);
  }
  if (want.single) ok(`${label}: no false multifocal claim`, r.multi === null && r.singleExplainsAll,
    r.multi ? `multi = ${r.multi.sites.map(s => s.id).join(" + ")}` : "no single site explains all");
}

// ---- functional: positive functional signs with no organic sign raise the flag ----
ok("Functional leg weakness raises the functional flag",
   functionalFlag(new Set(["weak_leg@left", "hoovers_sign@none", "give_way_weakness@none"])).functional === true);

console.log(`\nclinical vignettes: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
