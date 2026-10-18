// clinical-audit.test.js — the EXTERNAL accuracy baseline (clinical audit, 2026-10-18). NOT part of `npm test`.
// Run: npm run test:audit        (node test/clinical-audit.test.js --verbose  also prints the metamorphic PASS lines)
//
// Every other suite checks the model against itself, and clinical-vignettes.test.js checks it against the cases the
// owner has already signed off. This one is the 2026-10-18 audit: ~100 adversarial bedside probes, each with the
// answer a neurologist would expect, plus three metamorphic properties. MOST OF IT FAILS TODAY, and that is its job:
// it is the yardstick the fixes are measured against. It stays out of the green chain on purpose — wiring it in would
// turn `npm test` red, and loosening an assertion until it passes would destroy the measurement.
//
// Every expectation carries a status:
//   counted — a textbook answer, or a judgement the owner (a clinician) has approved. Counts towards the tally and
//             the exit code.
//   ruling  — a clinical judgement still awaiting the owner. It runs and prints as PEND with what it WOULD score, but
//             does not count until approved. Rulings are asked for and recorded in
//             docs/superpowers/specs/2026-10-18-clinical-audit-suite.md; approving one = changing R(...) to T(...).
// Round 1 and its open row 20 were ruled on 2026-10-18: all 17 proposed answers approved (each marked "owner-approved"
// below) and the synonym groups settled as section 2 describes. The only pending checks are the two cortical-hand
// swaps (weak arm entered for an ISOLATED weak hand), which the row-20 ruling does not reach.
//
// Assertion kinds (the clinical-vignettes shape, plus four):
//   first    — r.display[0] matches                      top / alsoTop — within the first k
//   single   — no multifocal claim (r.multi === null)
//   one      — ONE process: no multifocal claim, OR the claim's leading unifying diagnosis matches
//   unify    — a genuinely multifocal picture: r.multi is set AND its leading unifying diagnosis matches
//   level / levelNot — the sensory-level note matches / does not match
//   pressure — the raised-pressure axis fired           none — no single site claims to explain it all
//   functional — the functional flag fired
//
// Tokens are what the app can ENTER (side offers from app/sides.js) — the harness section asserts it, so a renamed or
// re-sided finding fails loudly here instead of turning a probe vacuous.
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { unifyingDiagnoses } from "../src/engine/multifocal.js";
import { functionalFlag } from "../src/engine/patterns.js";
import { FINDINGS } from "../src/model/findings.js";
import { offersFor } from "../app/sides.js";

const VERBOSE = process.argv.includes("--verbose");
const tally = new Map();  // region -> { counted: [pass, total], ruling: [pass, total] }  — checks
const probes = new Map(); // region -> same shape — whole probes (a probe is correct when every check on it passes)
let pass = 0, fail = 0;
function ok(region, status, label, cond, detail = "", quiet = false) {
  const t = tally.get(region) || { counted: [0, 0], ruling: [0, 0] };
  tally.set(region, t);
  t[status][1]++; if (cond) t[status][0]++;
  if (status === "counted") cond ? pass++ : fail++;
  if (quiet && cond && !VERBOSE) return;
  if (quiet && !VERBOSE && status === "ruling") return;
  const tag = status === "ruling" ? (cond ? "PEND  (would pass)  " : "PEND  (would FAIL)  ") : (cond ? "PASS  " : "FAIL  ");
  console.log(tag + label + (cond ? "" : `  ${detail}`));
}

const L = s => s.split(/\s+/).filter(Boolean);
const ids = r => r.display.map(c => c.site.id);
const leadingUnifier = (r, set, opts) => r.multi ? unifyingDiagnoses(r.multi.sites, set, opts).concordant[0]?.name || "(none)" : null;

// ---- site families (regexes over site ids) ----
const CORD = /^(bilateral_cord_(transverse|anterior|posterior|central)|(left|right)_cord_(hemi|lateral))$/; // a true cord lesion: not the conus, not a system degeneration
const PONS = /^(locked_in|brainstem_aras|pontomesencephalic_tegmentum|(left|right)_pons_)/;
const PARASAG = /^(left|right)_cortex_(aca|paracentral|motor_leg)$/;

// ---- the probes: T = counted (textbook or owner-approved), R = awaiting the owner's ruling ----
const CASES = [];
const T = (region, label, toks, want, opts = {}) => CASES.push({ region, label, toks, want, opts, status: "counted" });
const R = (region, label, toks, want, opts = {}) => CASES.push({ region, label, toks, want, opts, status: "ruling" });

// Spinal cord
// owner-approved 2026-10-18 (round 1, row 1)
T("Spinal cord", "C5/6 myeloradiculopathy (biceps + supinator lost, legs UMN) → cervical cord, one lesion", "reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left hyperreflexia@left hyperreflexia@right babinski@left babinski@right spasticity@left spasticity@right", { first: CORD, single: true });
T("Spinal cord", "asymmetric compression: R leg weak + both Babinski + sphincter → cord", "weak_leg@right babinski@right babinski@left sphincter_dysfunction@midline", { top: [3, CORD], single: true });
T("Spinal cord", "paraparesis + both Babinski + sphincter + pain loss, level T8 → thoracic cord", "weak_leg@left weak_leg@right babinski@left babinski@right sphincter_dysfunction@midline spinothalamic@left spinothalamic@right", { first: CORD, single: true, level: /T8/ }, { sensoryLevel: "T8" });
T("Spinal cord", "paraparesis + both Babinski (no sensory) → cord", "weak_leg@left weak_leg@right babinski@left babinski@right", { first: CORD, single: true });
T("Spinal cord", "quadriparesis + both Babinski + sensory loss in all four → cervical cord", "weak_arm@left weak_arm@right weak_leg@left weak_leg@right babinski@left babinski@right spinothalamic@left spinothalamic@right dorsal_sensory@left dorsal_sensory@right", { first: CORD, single: true });
T("Spinal cord", "Brown-Séquard, right", "weak_leg@right babinski@right dorsal_sensory@right spinothalamic@left", { first: /^right_cord_hemi$/, single: true });
T("Spinal cord", "spastic legs alone (brisk, Babinski, spastic) → cord, not the conus", "hyperreflexia@left hyperreflexia@right babinski@left babinski@right spasticity@left spasticity@right", { first: CORD, single: true });
T("Spinal cord", "central cord: both arms weak + cape → central cord", "weak_arm@left weak_arm@right suspended_sensory@left suspended_sensory@right", { first: /^bilateral_cord_central$/, single: true });
T("Spinal cord", "syrinx: cape + wasted hands + spastic legs → one cord lesion", "suspended_sensory@left suspended_sensory@right wasting@left wasting@right weak_leg@left weak_leg@right babinski@left babinski@right", { first: CORD, single: true });
T("Spinal cord", "cord compression R>L entered with both legs weak", "weak_leg@right weak_leg@left babinski@right babinski@left sphincter_dysfunction@midline", { first: CORD, single: true });
T("Spinal cord", "SCD (B12): dorsal columns + Babinski + absent ankle jerks", "dorsal_sensory@left dorsal_sensory@right babinski@left babinski@right reflex_ankle_loss@left reflex_ankle_loss@right sensory_ataxia@none", { first: /^combined_degeneration_scd$/, single: true });
T("Spinal cord", "T8 compression examined fully (incl. perineum), level T8 → one cord lesion", "weak_leg@left weak_leg@right babinski@left babinski@right spinothalamic@left spinothalamic@right dorsal_sensory@left dorsal_sensory@right sphincter_dysfunction@midline saddle_anaesthesia@midline", { first: CORD, single: true, level: /T8/ }, { sensoryLevel: "T8" });
T("Spinal cord", "same, level C5 → cervical cord", "weak_arm@left weak_arm@right weak_leg@left weak_leg@right babinski@left babinski@right spinothalamic@left spinothalamic@right sphincter_dysfunction@midline saddle_anaesthesia@midline", { first: CORD, single: true, level: /C5/ }, { sensoryLevel: "C5" });
T("Spinal cord", "spastic legs + level T10 → thoracic cord, level not dismissed", "hyperreflexia@left hyperreflexia@right babinski@left babinski@right spasticity@left spasticity@right", { first: CORD, single: true, levelNot: /below the cord/ }, { sensoryLevel: "T10" });
T("Spinal cord", "spinal shock: flaccid areflexic legs + pain loss + retention, level T6 → acute cord", "lmn_weakness@left lmn_weakness@right reflex_knee_loss@left reflex_knee_loss@right reflex_ankle_loss@left reflex_ankle_loss@right hypotonia@left hypotonia@right spinothalamic@left spinothalamic@right sphincter_dysfunction@midline", { first: CORD, single: true, levelNot: /below the cord/ }, { sensoryLevel: "T6" });
T("Spinal cord", "spinal shock entered as weak legs + areflexia, level T6 → acute cord", "weak_leg@left weak_leg@right reflex_knee_loss@left reflex_knee_loss@right reflex_ankle_loss@left reflex_ankle_loss@right spinothalamic@left spinothalamic@right sphincter_dysfunction@midline", { first: CORD, single: true, levelNot: /below the cord/ }, { sensoryLevel: "T6" });

// Cauda & conus
T("Cauda & conus", "cauda equina", "saddle_anaesthesia@midline sphincter_dysfunction@midline reflex_ankle_loss@left reflex_ankle_loss@right lmn_weakness@left radicular_pain@left", { first: /^cauda_equina$/, single: true });
T("Cauda & conus", "conus", "saddle_anaesthesia@midline sphincter_dysfunction@midline babinski@left babinski@right", { first: /^conus_medullaris$/, single: true });

// Motor neurone & neuromuscular
// owner-approved 2026-10-18 (round 1, row 2)
T("Motor neurone & neuromuscular", "ALS: mixed UMN + LMN → motor neurone disease named", "fasciculations@left fasciculations@right wasting@left wasting@right hyperreflexia@left hyperreflexia@right babinski@left babinski@right dysarthria@none", { unify: /Motor neurone/ });
// owner-approved 2026-10-18 (round 1, row 3)
T("Motor neurone & neuromuscular", "bulbar-onset ALS: tongue + swallow + fasciculations → anterior horn / MND, not two medullas", "cn12_palsy@left cn12_palsy@right dysarthria@none dysphagia@left dysphagia@right fasciculations@left fasciculations@right", { first: /^motor_unit_anterior_horn$/, one: /Motor neurone/ });
T("Motor neurone & neuromuscular", "GBS: ascending areflexic + distal sensory → one peripheral process", "lmn_weakness@left lmn_weakness@right reflex_knee_loss@left reflex_knee_loss@right reflex_ankle_loss@left reflex_ankle_loss@right distal_sensory_loss@left distal_sensory_loss@right", { first: /^(polyradiculoneuropathy_acute|polyneuropathy_length_dependent)$/, single: true });
T("Motor neurone & neuromuscular", "GBS with facial diplegia", "lmn_weakness@left lmn_weakness@right reflex_ankle_loss@left reflex_ankle_loss@right facial_weakness@left facial_weakness@right forehead_involved@left forehead_involved@right", { first: /^polyradiculoneuropathy_acute$/, single: true });
// The audit entered fatigable weakness "@none", which the app cannot enter; it offers left / right, so both are entered.
T("Motor neurone & neuromuscular", "generalised MG: one fatigable eye + fatigable proximal weakness", "fatigable_ocular@left fatigable_weakness@left fatigable_weakness@right proximal_weakness@left proximal_weakness@right", { first: /^motor_unit_nmj_postsynaptic$/, single: true });
T("Motor neurone & neuromuscular", "generalised MG: both eyes + fatigable weakness", "fatigable_ocular@left fatigable_ocular@right fatigable_weakness@left fatigable_weakness@right", { first: /^motor_unit_nmj_postsynaptic$/, single: true });
T("Motor neurone & neuromuscular", "myopathy: proximal weakness", "proximal_weakness@left proximal_weakness@right", { top: [3, /^motor_unit_muscle$/], single: true });
T("Motor neurone & neuromuscular", "LEMS", "facilitating_weakness@left facilitating_weakness@right proximal_weakness@left proximal_weakness@right dry_mouth@none", { first: /^motor_unit_nmj_presynaptic$/, single: true });
T("Motor neurone & neuromuscular", "length-dependent polyneuropathy", "distal_sensory_loss@left distal_sensory_loss@right reflex_ankle_loss@left reflex_ankle_loss@right", { first: /^polyneuropathy_length_dependent$/, single: true });

// Roots, plexus & nerves
T("Roots, plexus & nerves", "foot drop: common peroneal", "weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_foot_eversion@left peroneal_sensory@left", { first: /^left_nerve_peroneal_common$/, single: true });
T("Roots, plexus & nerves", "foot drop + weak inversion → L5", "weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_foot_eversion@left weak_foot_inversion@left sensory_l5@left", { first: /^left_root_l5$/, single: true });
T("Roots, plexus & nerves", "foot drop + weak hip abduction → L5", "weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_hip_abduction@left sensory_l5@left", { first: /^left_root_l5$/, single: true });
T("Roots, plexus & nerves", "wrist drop, triceps spared, radial sensory → spiral groove", "weak_wrist_extension@left weak_finger_extension@left radial_sensory@left", { first: /^left_nerve_radial_spiral_groove$/, single: true });
T("Roots, plexus & nerves", "PIN: finger extension only", "weak_finger_extension@left", { first: /^left_nerve_radial_pin$/ });
T("Roots, plexus & nerves", "ulnar at the elbow (dorsal sensory lost) → one ulnar lesion", "ulnar_sensory@left ulnar_dorsal_sensory@left weak_finger_abduction@left ulnar_claw@left", { first: /^left_nerve_ulnar_elbow$/, single: true });
T("Roots, plexus & nerves", "ulnar at Guyon (dorsal spared)", "ulnar_sensory@left weak_finger_abduction@left ulnar_claw@left", { first: /^left_nerve_ulnar_wrist$/, single: true });
T("Roots, plexus & nerves", "carpal tunnel", "median_sensory@left weak_thumb_abduction@left", { first: /^left_nerve_median_carpal_tunnel$/, single: true });
T("Roots, plexus & nerves", "thumb + finger abduction + C8 sensory → C8 root / lower trunk, not ulnar", "weak_thumb_abduction@left weak_finger_abduction@left sensory_c8@left", { first: /^left_(root_c8|plexus_lower_trunk)$/, single: true });
T("Roots, plexus & nerves", "C6 radiculopathy (dermatome + reflexes + radicular pain) → C6 root", "sensory_c6@left reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left radicular_pain@left", { first: /^left_root_c6$/, single: true });
T("Roots, plexus & nerves", "C7 radiculopathy", "sensory_c7@left reflex_triceps_loss@left weak_elbow_extension@left weak_wrist_flexion@left", { first: /^left_root_c7$/, single: true });
T("Roots, plexus & nerves", "upper trunk (Erb) → upper trunk / C5, one lesion", "weak_shoulder_abduction@left weak_elbow_flexion@left weak_shoulder_external_rotation@left reflex_biceps_loss@left axillary_sensory@left", { first: /^left_(plexus_upper_trunk|root_c5)$/, single: true });
T("Roots, plexus & nerves", "femoral neuropathy", "weak_knee_extension@left reflex_knee_loss@left femoral_sensory@left", { first: /^left_nerve_femoral$/, single: true });
// owner-approved 2026-10-18 (round 1, row 4)
T("Roots, plexus & nerves", "knee extension + hip adduction + knee jerk + L4 dermatome → L4 root over lumbar plexus", "weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left sensory_l4@left", { first: /^left_root_l4$/, single: true });
T("Roots, plexus & nerves", "meralgia paraesthetica", "lat_fem_cutaneous_sensory@left", { first: /^left_nerve_lat_fem_cutaneous$/ });
T("Roots, plexus & nerves", "S1 radiculopathy", "reflex_ankle_loss@left weak_ankle_plantarflexion@left sensory_s1@left radicular_pain@left", { first: /^left_root_s1$/, single: true });
T("Roots, plexus & nerves", "mononeuritis multiplex: L peroneal + R ulnar → genuinely two nerves", "peroneal_sensory@left weak_ankle_dorsiflexion@left ulnar_sensory@right weak_finger_abduction@right", { unify: /Mononeuritis multiplex/ });
// owner-approved 2026-10-18 (round 1, row 5)
T("Roots, plexus & nerves", "UMN foot drop: weak dorsiflexion + Babinski + brisk → right corticospinal (not the hand knob, not a nerve)", "weak_ankle_dorsiflexion@left babinski@left hyperreflexia@left", { first: /^(right_(?!cortex_hand_knob)(cortex|subcortex|pons|midbrain|medulla)_|left_cord_)/, single: true });

// Brainstem
T("Brainstem", "Wallenberg with dysmetria instead of limb ataxia", "face_pain_loss@left spinothalamic@right miosis@left ptosis@left dysmetria@left dysphagia@left cn8_vertigo@left", { first: /^left_medulla_lateral$/, single: true });
T("Brainstem", "Wallenberg + hoarseness", "face_pain_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left vocal_cord_palsy@left palatal_weakness@left", { first: /^left_medulla_lateral$/, single: true });
// owner-approved 2026-10-18 (round 1, row 6)
T("Brainstem", "Wallenberg with facial numbness entered as the VPM token (face_sensory_loss)", "face_sensory_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left", { first: /^left_medulla_lateral$/, single: true });
T("Brainstem", "minimal lateral medulla: ipsilateral face + contralateral body pain loss", "face_pain_loss@left spinothalamic@right", { top: [3, /^left_(medulla_lateral|pons_lateral)/] });
T("Brainstem", "face + body pain loss on the SAME side → contralateral thalamus / upper brainstem", "face_pain_loss@left spinothalamic@left", { first: /^right_(subcortex_(thalamus|sensorimotor)|thalamus_vpm|midbrain_lateral)$/, single: true });
T("Brainstem", "Claude (III + contralateral ataxia)", "ptosis@left weak_adduction@left weak_elevation@left weak_depression@left limb_ataxia@right", { first: /^left_midbrain_(medial|hemi)$/, single: true });
T("Brainstem", "Benedikt (III + contralateral tremor + hemiparesis)", "ptosis@left weak_adduction@left weak_elevation@left weak_depression@left tremor_rubral@right weak_arm@right weak_leg@right", { first: /^left_midbrain_(medial|hemi)$/, single: true });
T("Brainstem", "bilateral INO → one paramedian lesion", "ino@left ino@right", { top: [3, /(pons|midbrain)/], single: true });
T("Brainstem", "INO + LMN facial (pontine MS) → left pons", "ino@left facial_weakness@left forehead_involved@left", { first: /^left_pons_/, single: true });
T("Brainstem", "basilar: coma + both Babinski + quadriparesis → pons", "reduced_consciousness@none babinski@left babinski@right weak_arm@left weak_arm@right weak_leg@left weak_leg@right", { first: PONS, single: true });
T("Brainstem", "pontine haemorrhage: coma + bilateral gaze palsy + quadriparesis → pons", "reduced_consciousness@none gaze_palsy@left gaze_palsy@right weak_arm@left weak_arm@right weak_leg@left weak_leg@right", { first: PONS, single: true });
T("Brainstem", "locked-in, full picture → ventral pons, one lesion", "weak_arm@left weak_arm@right weak_leg@left weak_leg@right facial_weakness@left facial_weakness@right dysarthria@none gaze_palsy@left gaze_palsy@right preserved_vertical_gaze@none", { first: /^locked_in$/, single: true });

// Cranial nerves & skull base
T("Cranial nerves & skull base", "cavernous sinus", "ptosis@left weak_adduction@left weak_elevation@left weak_depression@left weak_abduction@left vertical_diplopia@left v1_sensory@left v2_sensory@left miosis@left", { first: /^left_skull_base_cavernous_sinus$/, single: true });
T("Cranial nerves & skull base", "orbital apex", "ptosis@left weak_adduction@left weak_elevation@left weak_depression@left weak_abduction@left v1_sensory@left optic_neuropathy@left rapd@left", { first: /^left_skull_base_orbital_apex$/, single: true });
T("Cranial nerves & skull base", "Gradenigo (VI + V1)", "weak_abduction@left v1_sensory@left", { first: /^left_skull_base_petrous_apex$/, single: true });
T("Cranial nerves & skull base", "jugular foramen (Vernet)", "gag_afferent_loss@left palatal_weakness@left vocal_cord_palsy@left weak_scm@left weak_trapezius@left", { first: /^left_skull_base_jugular_foramen$/, single: true });
T("Cranial nerves & skull base", "Collet-Sicard (IX–XII)", "gag_afferent_loss@left palatal_weakness@left vocal_cord_palsy@left weak_scm@left weak_trapezius@left cn12_palsy@left", { first: /^left_skull_base_collet_sicard$/, single: true });
// owner-approved 2026-10-18 (round 1, row 7)
T("Cranial nerves & skull base", "bilateral VI + papilloedema → raised pressure (false-localising), not two VI lesions", "weak_abduction@left weak_abduction@right papilloedema@none", { single: true, pressure: true });
// owner-approved 2026-10-18 (round 1, row 8)
T("Cranial nerves & skull base", "bilateral VI alone → one process, not two VI lesions + sarcoid/NF2", "weak_abduction@left weak_abduction@right", { single: true });
T("Cranial nerves & skull base", "complete III, pupil not entered → microvascular first, compressive in the top 3", "ptosis@left weak_adduction@left weak_elevation@left weak_depression@left", { first: /^left_pupil_cn3_ischaemic$/, alsoTop: [3, /^left_pupil_cn3_compressive$/], single: true });
T("Cranial nerves & skull base", "isolated IV palsy", "weak_depression@left vertical_diplopia@left", { top: [3, /^(left_skull_base_trochlear_cisternal|right_midbrain_trochlear)$/] });
T("Cranial nerves & skull base", "Horner alone", "miosis@left ptosis@left", { top: [3, /^left_(sympathetic_|medulla_lateral|skull_base_carotid_space)/] });
// Not Villaret: its cause list leads with metastasis, and painful Horner + XII is carotid dissection until shown otherwise.
T("Cranial nerves & skull base", "Horner + XII → carotid space (dissection)", "miosis@left ptosis@left cn12_palsy@left", { first: /^left_skull_base_carotid_space$/, single: true });
T("Cranial nerves & skull base", "Pancoast: Horner + C8/T1 hand + medial arm", "miosis@left ptosis@left anhidrosis_face@left weak_finger_abduction@left weak_thumb_abduction@left sensory_t1@left sensory_c8@left", { first: /^left_sympathetic_pancoast$/, single: true });

// Vestibular & cerebellar
T("Vestibular & cerebellar", "vestibular neuritis, HINTS peripheral", "cn8_vertigo@left nystagmus_peripheral@none head_impulse_abnormal@none", { first: /^left_peripheral_vestibular_/, single: true });
// owner-approved 2026-10-18 (round 1, row 9)
T("Vestibular & cerebellar", "vertigo + hearing loss + abnormal HIT → labyrinth first, AICA (lateral pons) in the top 3 (HINTS-plus)", "cn8_vertigo@left hearing_loss@left nystagmus_peripheral@none head_impulse_abnormal@none", { first: /^left_peripheral_vestibular_labyrinth$/, top: [3, /^left_pons_lateral$/] });
T("Vestibular & cerebellar", "central AVS: vertigo + gaze-evoked nystagmus + skew → central", "cn8_vertigo@left nystagmus_gaze_evoked@none skew_deviation@none", { first: /^(left_(central_vestibular|medulla|pons|cerebellum)|cerebellum_)/, single: true });
T("Vestibular & cerebellar", "vertigo alone → peripheral first", "cn8_vertigo@left", { top: [3, /^left_peripheral_vestibular_/] });
T("Vestibular & cerebellar", "BPPV, posterior canal", "nystagmus_positional_posterior@none", { first: /_peripheral_vestibular_posterior_canal$/ });
T("Vestibular & cerebellar", "downbeat nystagmus → cervicomedullary junction / flocculus", "nystagmus_downbeat@none", { first: /^(craniocervical_junction_foramen_magnum|cerebellum_flocculonodular)$/ });
T("Vestibular & cerebellar", "truncal ataxia + gaze-evoked + ataxic dysarthria (alcohol / vermis)", "truncal_ataxia@none nystagmus_gaze_evoked@none ataxic_dysarthria@none", { first: /^cerebellum_(vermis|pancerebellar)$/, single: true });

// Hemispheres, thalamus & vision
// owner-approved 2026-10-18 (round 1, row 10)
T("Hemispheres, thalamus & vision", "left MCA in a left-hander set right-dominant → left MCA, one lesion", "speech_nonfluent@none comprehension_impaired@none weak_arm@right facial_weakness@right forehead_spared@right homonymous_hemianopia@right", { first: /^left_cortex_mca$/, single: true }, { dominantSide: "right" });
// owner-approved 2026-10-18 (round 1, row 11)
T("Hemispheres, thalamus & vision", "aphasia + LEFT hemiparesis in a right-hander → a right-hemisphere lesion offered (crossed aphasia)", "speech_nonfluent@none weak_arm@left facial_weakness@left forehead_spared@left", { top: [3, /^right_(cortex|subcortex)_/] });
T("Hemispheres, thalamus & vision", "right hemianopia + alexia without agraphia → left PCA, one lesion", "homonymous_hemianopia@right alexia_without_agraphia@none", { top: [3, /^left_cortex_pca$/], single: true });
T("Hemispheres, thalamus & vision", "isolated right hemianopia", "homonymous_hemianopia@right", { top: [3, /^left_(cortex_(occipital|pca)|subcortex_optic_radiation|visual_pathway_(optic_tract|lgn))$/], single: true });
T("Hemispheres, thalamus & vision", "hemianopia + contralateral RAPD → optic tract", "homonymous_hemianopia@right rapd@right", { first: /^left_visual_pathway_optic_tract$/, single: true });
T("Hemispheres, thalamus & vision", "superior quadrantanopia (Meyer's loop)", "superior_quadrantanopia@right", { first: /^left_(cortex_temporal|subcortex_optic_radiation)$/ });
T("Hemispheres, thalamus & vision", "left neglect + left hemianopia → right MCA", "neglect@left homonymous_hemianopia@left", { first: /^right_cortex_(mca_inferior|mca|parietal)$/, single: true });
T("Hemispheres, thalamus & vision", "gaze deviation right + left hemiparesis → right frontal / MCA", "gaze_deviation@right weak_arm@left weak_leg@left facial_weakness@left forehead_spared@left", { first: /^right_cortex_(mca|mca_superior)$/, single: true });
T("Hemispheres, thalamus & vision", "wrong-way eyes: gaze left + left hemiparesis → right pons / thalamus, one lesion", "gaze_deviation@left weak_arm@left weak_leg@left", { top: [3, /^right_(pons_|subcortex_thalamus|thalamus_)/], single: true });
T("Hemispheres, thalamus & vision", "thalamus: hemisensory + hemiataxia + face", "spinothalamic@right dorsal_sensory@right face_sensory_loss@right limb_ataxia@right", { first: /^left_(subcortex_thalamus|thalamus_)/, single: true });
T("Hemispheres, thalamus & vision", "lacunar dysarthria–clumsy hand", "dysarthria@none facial_weakness@right forehead_spared@right weak_hand@right", { first: /^left_(subcortex_(internal_capsule|corona_radiata)|pons_basis_pontis)$/, single: true });
// owner-approved 2026-10-18 (round 1, row 12)
T("Hemispheres, thalamus & vision", "parasagittal meningioma: both legs UMN + cortical incontinence → parasagittal in the top 3, one lesion", "weak_leg@left weak_leg@right babinski@left babinski@right urinary_incontinence@none", { top: [3, PARASAG], single: true });

// Consciousness & raised pressure
T("Consciousness & raised pressure", "coma alone", "reduced_consciousness@none", { top: [3, /^(cerebrum_diffuse|brainstem_aras|thalamus_bilateral_percheron)$/] });
// owner-approved 2026-10-18 (round 1, row 13)
T("Consciousness & raised pressure", "uncal herniation: coma + fixed dilated L pupil + extensor posturing → one process, compressive III in the top 3", "reduced_consciousness@none fixed_dilated_pupil@left extensor_posturing@none", { top: [3, /^left_pupil_cn3_compressive$/], single: true });
// owner-approved 2026-10-18 (round 1, row 14)
T("Consciousness & raised pressure", "top of the basilar: coma + vertical gaze palsy + cortical blindness → one vascular event", "reduced_consciousness@none vertical_gaze_palsy@none cortical_blindness@none", { one: /Embolic/ });
// owner-approved 2026-10-18 (round 1, row 15)
T("Consciousness & raised pressure", "bilateral PCA: cortical blindness + amnesia → one vascular event", "cortical_blindness@none amnesia@none", { one: /Embolic/ });
T("Consciousness & raised pressure", "papilloedema alone → raised pressure, no localising claim", "papilloedema@none", { pressure: true, single: true });
T("Consciousness & raised pressure", "papilloedema + right hemiparesis → left hemisphere mass", "papilloedema@none weak_arm@right weak_leg@right", { first: /^left_(cortex|subcortex)_/, single: true, pressure: true });
// owner-approved 2026-10-18 (round 1, row 16)
T("Consciousness & raised pressure", "papilloedema + paraparesis + sphincter → parasagittal mass in the top 3, one lesion", "papilloedema@none weak_leg@left weak_leg@right babinski@left babinski@right sphincter_dysfunction@midline", { top: [3, PARASAG], single: true });

// Stroke course and multifocal pictures that ARE multifocal
T("Hemispheres, thalamus & vision", "hyperacute R arm + L leg → two lesions, embolic shower", "weak_arm@right weak_leg@left", { unify: /Embolic/ }, { onset: "hyperacute" });
T("Brainstem", "INO + optic neuritis, subacute relapsing → multiple sclerosis", "ino@left central_scotoma@right rapd@right", { unify: /Multiple sclerosis/ }, { onset: "subacute", course: "relapsing" });

// Robustness & functional
// owner-approved 2026-10-18 (round 1, row 17)
T("Robustness & functional", "Babinski AND a down-going plantar on the same side (contradictory entry) → no multifocal claim", "babinski@left plantar_flexor@left weak_leg@left", { single: true });
T("Robustness & functional", "right hemiparesis with a down-going right plantar → still the left hemisphere", "weak_arm@right weak_leg@right plantar_flexor@right", { first: /^left_(cortex|subcortex)_/, single: true });
T("Robustness & functional", "kitchen sink (7 unrelated findings) → no single site claims all of it", "ptosis@left weak_abduction@right sensory_l5@left neglect@left median_sensory@right truncal_ataxia@none anosmia@left", { none: true });
T("Robustness & functional", "functional: Hoover + give-way + weak leg → functional flag, no multifocal claim", "weak_leg@left hoovers_sign@none give_way_weakness@none", { functional: true, single: true });

// ======================================================================================================
// 0. Harness: every probe token is a real finding the app can enter.
// ======================================================================================================
console.log("== harness");
{
  const bad = [];
  for (const c of CASES) for (const t of L(c.toks)) {
    const f = t.split("@")[0];
    if (!FINDINGS[f]) bad.push(`${t} (no such finding) in "${c.label}"`);
    else if (!offersFor(f).some(o => (o.tokens || []).includes(t))) bad.push(`${t} (not offered) in "${c.label}"`);
  }
  ok("Harness", "counted", `every probe token is a finding the app offers on that side (${CASES.length} probes)`, bad.length === 0, bad.join("; "));
}

// ======================================================================================================
// 1. The probes.
// ======================================================================================================
console.log("\n== probes");
for (const c of CASES) {
  let correct = true;
  const A = (l, cond, d) => { correct &&= !!cond; ok(c.region, c.status, `${c.label}: ${l}`, cond, d); };
  const set = new Set(L(c.toks));
  let r = null;
  try { r = solve(set, c.opts); } catch (e) { A("solves without throwing", false, e.message); }
  if (r) {
    const got = ids(r), w = c.want;
    const lead = leadingUnifier(r, set, c.opts);
    const multiDesc = r.multi ? `multi = ${r.multi.sites.map(s => s.id).join(" + ")} [${lead}]` : "";
    if (w.first) A(`first is ${w.first}`, w.first.test(got[0] || ""), `got ${got.slice(0, 3).join(", ") || "(nothing)"}`);
    for (const key of ["top", "alsoTop"]) if (w[key]) {
      const [k, re] = w[key];
      A(`${re} in the top ${k}`, got.slice(0, k).some(id => re.test(id)), `got ${got.slice(0, k).join(", ") || "(nothing)"}`);
    }
    if (w.single) A("no multifocal claim", r.multi === null, multiDesc);
    if (w.one) A(`one process (no multifocal claim, or it is ${w.one})`, r.multi === null || w.one.test(lead), multiDesc);
    if (w.unify) A(`multifocal, unified as ${w.unify}`, !!r.multi && w.unify.test(lead), r.multi ? multiDesc : "no multifocal claim");
    if (w.level) A(`level note matches ${w.level}`, w.level.test(r.level?.note || ""), `note: ${r.level?.note}`);
    if (w.levelNot) A(`level note does not say ${w.levelNot}`, !w.levelNot.test(r.level?.note || ""), `note: ${r.level?.note}`);
    if (w.pressure) A("raised-pressure axis fires", !!r.pressure?.present, "");
    if (w.none) A("no single site explains every finding", r.explainAll.length === 0, `explained by ${r.explainAll.map(x => x.site.id).join(", ")}`);
    if (w.functional) A("functional flag raised", functionalFlag(set).functional === true, "");
  }
  const p = probes.get(c.region) || { counted: [0, 0], ruling: [0, 0] };
  probes.set(c.region, p);
  p[c.status][1]++; if (correct) p[c.status][0]++;
}

// ======================================================================================================
// 2. Metamorphic (a): a bedside-equivalent WORD must not move the lesion, and no single changed word may invent a
// second lesion. For every lateralised site's own complete picture, swap one finding for another in its group (the
// audit's perturb.mjs groups). Owner rulings 2026-10-18, round 1 rows 18–21 (row 20 answered the same day):
//   no multifocal claim — counted for EVERY swap: even a word that is not a synonym should give ONE other site,
//     never two lesions plus "MS".
//   site stays in the top 3 — counted only where the words ARE equivalent:
//     · the cerebellar limb signs;
//     · weak hand and weak arm INSIDE A HEMIPARESIS — the picture has leg or face weakness on that side. Pyramidal
//       weakness is distal-predominant, so the hand is part of the weak arm. Weak hand ALONE still points to the
//       hand knob (the 2026-08-15 LOCALISING ruling stands), so weak arm entered for that isolated weak hand is
//       outside the ruling and its check is pending;
//     · ataxic → plain dysarthria (specific → generic).
//     Not asserted for the facial sensory words (pain vs touch is a localising dissociation, and face_sensory_loss
//     is defined as VPM loss) or plain → ataxic dysarthria (a different claim).
// `top3(from, to, picture, side)` returns the status of that check, or null where there is no expectation.
// ======================================================================================================
console.log("\n== metamorphic (a): synonym swaps (FAIL lines only; --verbose for all)");
const besideOtherWeakness = (picture, side) => picture.includes(`weak_leg@${side}`) || picture.includes(`facial_weakness@${side}`);
const SWAP_GROUPS = [
  { name: "cerebellar limb signs", ids: ["limb_ataxia", "dysmetria", "intention_tremor", "dysdiadochokinesis"], top3: () => "counted" },
  { name: "facial sensory loss", ids: ["face_pain_loss", "face_sensory_loss", "face_touch_loss"], top3: () => null },
  { name: "arm / hand weakness", ids: ["weak_arm", "weak_hand"], top3: (from, to, picture, side) => besideOtherWeakness(picture, side) ? "counted" : "ruling" },
  { name: "dysarthria", ids: ["dysarthria", "ataxic_dysarthria"], top3: (from, to) => to === "dysarthria" ? "counted" : null },
];
const lateral = candidateSites().filter(s => s.side === "left" || s.side === "right");
const swapStats = { tried: 0, lostTop3: 0, multi: 0, msMets: 0, byGroup: {}, examples: [] };
for (const site of lateral) {
  const exp = [...expectedFindings(site)];
  if (exp.length < 2) continue;
  for (const g of SWAP_GROUPS) {
    const hit = exp.find(t => g.ids.includes(t.split("@")[0]));
    if (!hit) continue;
    const [f, side] = hit.split("@");
    for (const alt of g.ids) {
      const altTok = `${alt}@${side}`;
      if (alt === f || exp.includes(altTok)) continue;
      const set = new Set(exp.filter(t => t !== hit).concat(altTok));
      const r = solve(set);
      const inTop3 = ids(r).slice(0, 3).includes(site.id);
      const gs = swapStats.byGroup[g.name] ||= { tried: 0, multi: 0, lostTop3: 0 };
      swapStats.tried++; gs.tried++;
      if (!inTop3) { swapStats.lostTop3++; gs.lostTop3++; }
      let lead = null;
      if (r.multi) {
        swapStats.multi++; gs.multi++;
        const u = unifyingDiagnoses(r.multi.sites, set, {});
        if (u.concordant.some(e => /sclerosis|Metastas/i.test(e.name))) swapStats.msMets++;
        lead = u.concordant[0]?.name || "(none)";
        if (swapStats.examples.length < 8) swapStats.examples.push(`${site.id}: ${f}→${alt} ⇒ ${r.multi.sites.map(s => s.id).join(" + ")} [${lead}]`);
      }
      const label = `swap ${site.id}: ${f}→${alt}`, top3 = g.top3(f, alt, exp, side);
      if (top3) ok("Metamorphic: synonym swap", top3, `${label}: site stays in the top 3`, inTop3, `got ${ids(r).slice(0, 3).join(", ")}`, true);
      ok("Metamorphic: synonym swap", "counted", `${label}: no multifocal claim`, r.multi === null, r.multi ? `multi = ${r.multi.sites.map(s => s.id).join(" + ")} [${lead}]` : "", true);
    }
  }
}

// ======================================================================================================
// 3. Metamorphic (b): a common BACKGROUND finding is a second disease, not a unifying one (no comorbidity model).
// Added to every lateralised brain / brainstem site's complete picture: the first answer must not change, and the
// engine must never offer vasculitis or MS as the disease that explains the stroke AND the old neuropathy.
// ======================================================================================================
console.log("\n== metamorphic (b): background comorbidity (FAIL lines only; --verbose for all)");
const BACKGROUND = {
  "bilateral absent ankle jerks (age)": ["reflex_ankle_loss@left", "reflex_ankle_loss@right"],
  "diabetic stocking sensory loss": ["distal_sensory_loss@left", "distal_sensory_loss@right"],
};
const BRAIN_LEVELS = /^(cortex|subcortex|pons|medulla|midbrain|thalamus)$/;
const bgStats = {};
for (const [bg, extra] of Object.entries(BACKGROUND)) {
  const st = bgStats[bg] = { n: 0, multi: 0, kept: 0, labels: {} };
  for (const site of lateral) {
    if (!BRAIN_LEVELS.test(site.level)) continue;
    const exp = [...expectedFindings(site)];
    if (exp.length < 2) continue;
    const before = solve(new Set(exp));
    const set = new Set([...exp, ...extra]);
    const r = solve(set);
    st.n++;
    const kept = ids(r)[0] === ids(before)[0];
    if (kept) st.kept++;
    let names = [];
    if (r.multi) {
      st.multi++;
      names = unifyingDiagnoses(r.multi.sites, set, {}).concordant.map(e => e.name);
      const top = names[0] || "(none)";
      st.labels[top] = (st.labels[top] || 0) + 1;
    }
    const wrong = names.filter(n => /vasculitis|multiple sclerosis/i.test(n));
    ok("Metamorphic: comorbidity", "counted", `${site.id} + ${bg}: first answer unchanged`, kept, `${ids(before)[0]} → ${ids(r)[0]}`, true);
    ok("Metamorphic: comorbidity", "counted", `${site.id} + ${bg}: vasculitis / MS not offered as the unifying cause`, wrong.length === 0, `offered ${wrong.join(", ")}`, true);
  }
}

// ======================================================================================================
// 4. Metamorphic (c): mirroring every side (and the dominant hemisphere) mirrors the answer.
// Over every probe and every left-sided site's own picture. A tie between a site and its mirror image is broken by
// site id ("left" < "right"), so a mirrored case whose original answer is tied with its own mirror may take either.
// ======================================================================================================
console.log("\n== metamorphic (c): mirror (FAIL lines only; --verbose for all)");
const flip = s => s.split("_").map(p => p === "left" ? "right" : p === "right" ? "left" : p).join("_");
const flipTok = t => { const [f, side] = t.split("@"); return `${f}@${side === "left" ? "right" : side === "right" ? "left" : side}`; };
const flipOpts = o => ({ ...o, dominantSide: (o.dominantSide || "left") === "left" ? "right" : "left" });
const sameRank = (a, b) => a && b && a.n === b.n && !!a.against === !!b.against && a.over === b.over && a.prevalence === b.prevalence;
// Exactly tied with its own mirror image, so only the id tie-break chose this side.
const tiedWithMirror = (r, id) => sameRank(r.display.find(c => c.site.id === id), r.display.find(c => c.site.id === flip(id)));
let mirrorTried = 0, mirrorFailed = 0;
const mirrorCases = [
  ...CASES.map(c => ({ label: c.label, toks: L(c.toks), opts: c.opts })),
  ...lateral.filter(s => s.side === "left").map(s => ({ label: `${s.id} (own picture)`, toks: [...expectedFindings(s)], opts: {} })),
];
for (const m of mirrorCases) {
  if (!m.toks.length) continue;
  const a = solve(new Set(m.toks), m.opts), b = solve(new Set(m.toks.map(flipTok)), flipOpts(m.opts));
  if (!a.display.length) continue;
  mirrorTried++;
  const first = a.display[0].site.id, want = flip(first), gotId = b.display[0]?.site.id || "(nothing)";
  const multiA = a.multi ? a.multi.sites.map(s => flip(s.id)).sort().join(" + ") : "", multiB = b.multi ? b.multi.sites.map(s => s.id).sort().join(" + ") : "";
  const multiAsIs = a.multi ? a.multi.sites.map(s => s.id).sort().join(" + ") : "";
  const answerOk = gotId === want || (gotId === first && tiedWithMirror(a, first));
  const multiOk = multiA === multiB || (multiB === multiAsIs && a.multi.sites.every(s => flip(s.id) === s.id || tiedWithMirror(a, s.id)));
  const good = answerOk && multiOk;
  if (!good) mirrorFailed++;
  ok("Metamorphic: mirror", "counted", `mirror ${m.label}: answer and any multifocal claim mirror`, good,
     `want ${want}${multiA ? ` (multi ${multiA})` : ""}, got ${gotId}${multiB ? ` (multi ${multiB})` : ""}`, true);
}

// ======================================================================================================
// Summary: per region, then the baseline numbers the fixes are measured against.
// ======================================================================================================
const pct = ([p, n]) => n ? `${String(p).padStart(3)}/${String(n).padEnd(3)} (${Math.round(100 * p / n)}%)` : "     —        ";
console.log("\n== summary by region   (counted = textbook or owner-approved; pending = awaiting the owner's ruling, not counted)");
console.log(`${"region".padEnd(34)}${"probes correct".padEnd(18)}${"checks passed".padEnd(18)}${"pending probes".padEnd(18)}pending checks`);
const none = { counted: [0, 0], ruling: [0, 0] };
for (const [region, t] of tally) {
  const p = probes.get(region) || none;
  console.log(`${region.padEnd(34)}${pct(p.counted).padEnd(18)}${pct(t.counted).padEnd(18)}${pct(p.ruling).padEnd(18)}${pct(t.ruling)}`);
}
const sum = (m, k) => [...m.values()].reduce(([p, n], t) => [p + t[k][0], n + t[k][1]], [0, 0]);
console.log(`${"all probes".padEnd(34)}${pct(sum(probes, "counted")).padEnd(18)}${"".padEnd(18)}${pct(sum(probes, "ruling"))}`);

console.log("\n== baseline (2026-10-18 audit: 114/138 swaps → multifocal; 73/73 for each background)");
console.log(`synonym swaps: ${swapStats.tried} tried · ${swapStats.multi} called multifocal (${swapStats.msMets} offered MS or metastases) · ${swapStats.lostTop3} lost the site from the top 3`);
for (const [g, s] of Object.entries(swapStats.byGroup)) console.log(`   ${g.padEnd(24)} ${s.tried} tried · ${s.multi} multifocal · ${s.lostTop3} lost from top 3`);
for (const e of swapStats.examples) console.log(`   e.g. ${e}`);
for (const [bg, s] of Object.entries(bgStats)) {
  const labels = Object.entries(s.labels).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${v}`).join(", ");
  console.log(`background "${bg}": ${s.multi}/${s.n} multifocal · first answer kept ${s.kept}/${s.n} · leading unifier: ${labels || "—"}`);
}
console.log(`mirror: ${mirrorTried - mirrorFailed}/${mirrorTried} mirror cleanly`);

console.log(`\nclinical audit: ${pass} passed, ${fail} failed (counted); ${[...tally.values()].reduce((s, t) => s + t.ruling[1], 0)} pending the owner's ruling`);
process.exit(fail === 0 ? 0 : 1);
