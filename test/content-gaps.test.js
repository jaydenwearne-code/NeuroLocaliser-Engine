// content-gaps.test.js — the content-gap fixes (owner-ruled 2026-11-01; spec
// docs/superpowers/specs/2026-11-01-content-gaps-design.md). Pins each approved row, and the guards the spec's §6 lists
// as unchanged by design. Run: node test/content-gaps.test.js
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { unifyingDiagnoses } from "../src/engine/multifocal.js";
import { enteredToken } from "../src/engine/families.js";
import { FINDINGS } from "../src/model/findings.js";
import { nameForSite } from "../src/data/syndromes.js";
import { answerFor, redLine } from "../app/answer.js";
import { causesFor, leadingCause } from "../src/data/causes.js";
// The dominant MCA's red flag (row 15), on the M1 occlusion since the card follows its cause (2026-11-11).
const MCA_DOMINANT_FLAG = "Malignant MCA infarction risks fatal oedema — monitor conscious level; consider decompressive hemicraniectomy early.";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const predicts = (id, tok, opts = {}) => expectedFindings(SITE[id], opts).has(tok);
const ids = r => r.display.map(c => c.site.id);
const first = (toks, opts = {}) => ids(solve(T(toks), opts))[0];

// ---- A. Roots, plexus and nerves (rows 1–4) ----
const ULNAR_ELBOW = "ulnar_sensory@left ulnar_dorsal_sensory@left weak_finger_abduction@left ulnar_claw@left";
ok("row 1: the ulnar nerve at the elbow gives the claw", predicts("left_nerve_ulnar_elbow", "ulnar_claw@left"));
{ const r = solve(T(ULNAR_ELBOW));
  ok("row 1: claw + dorsal-hand sensory loss → the elbow, one lesion", ids(r)[0] === "left_nerve_ulnar_elbow" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
ok("row 1 guard: Guyon (dorsal sensation not entered) still leads with the wrist",
   first("ulnar_sensory@left weak_finger_abduction@left ulnar_claw@left") === "left_nerve_ulnar_wrist");
ok("row 2: the C6 root gives the biceps jerk (C5/6)", predicts("left_root_c6", "reflex_biceps_loss@left"));
ok("row 2: C6 radiculopathy → the C6 root first",
   first("sensory_c6@left reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left radicular_pain@left") === "left_root_c6");
ok("row 2 guard: C5 radiculopathy still leads with the C5 root",
   first("sensory_c5@left weak_shoulder_abduction@left weak_elbow_flexion@left reflex_biceps_loss@left radicular_pain@left") === "left_root_c5");
ok("row 3: the L4 root gives the adductors (obturator, L2–4)", predicts("left_root_l4", "weak_hip_adduction@left"));
ok("row 3: knee extension + adduction + knee jerk + L4 dermatome → the L4 root first (R1 #4)",
   first("weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left sensory_l4@left") === "left_root_l4");
ok("row 3 guard: L3 radiculopathy still leads with the L3 root",
   first("sensory_l3@left weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left") === "left_root_l3");
ok("row 4: the upper trunk carries the axillary sensory row (deltoid patch)", predicts("left_plexus_upper_trunk", "axillary_sensory@left"));
ok("row 5: the upper trunk carries the musculocutaneous sensory row (plexus round)",
   predicts("left_plexus_upper_trunk", "musculocutaneous_sensory@left"));
{ const r = solve(T("weak_shoulder_abduction@left weak_elbow_flexion@left weak_shoulder_external_rotation@left reflex_biceps_loss@left axillary_sensory@left"));
  ok("row 4: Erb with deltoid-patch numbness → the upper trunk, one lesion", ids(r)[0] === "left_plexus_upper_trunk" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
ok("row 4 guard: an axillary neuropathy still leads with the axillary nerve",
   first("axillary_sensory@left weak_shoulder_abduction@left") === "left_nerve_axillary");

// ---- B. Motor unit, carotid space, AICA (rows 6–8) ----
ok("row 6: the anterior horn's bulbar neurones give the tongue, both sides",
   predicts("motor_unit_anterior_horn", "cn12_palsy@left") && predicts("motor_unit_anterior_horn", "cn12_palsy@right"));
{ const r = solve(T("cn12_palsy@left cn12_palsy@right dysarthria@none dysphagia@left dysphagia@right fasciculations@left fasciculations@right"));
  ok("row 6: bulbar ALS → the anterior horn, one lesion (R1 #3)", ids(r)[0] === "motor_unit_anterior_horn" && r.multi === null); }
ok("row 6 guard: a one-sided XII palsy still leads with the hypoglossal canal", first("cn12_palsy@left") === "left_skull_base_hypoglossal_canal");
{ const set = T("fasciculations@left fasciculations@right wasting@left wasting@right hyperreflexia@left hyperreflexia@right babinski@left babinski@right dysarthria@none");
  const r = solve(set);
  ok("row 6 guard: UMN + LMN still names motor neurone disease (R1 #2)", !!r.multi && /Motor neurone/.test(unifyingDiagnoses(r.multi.sites, set, {}).concordant[0]?.name || "")); }
ok("row 7: the carotid space gives a XII palsy", predicts("left_skull_base_carotid_space", "cn12_palsy@left"));
ok("row 7: Horner + XII → the carotid space first (dissection)", first("miosis@left ptosis@left cn12_palsy@left") === "left_skull_base_carotid_space");
ok("row 7 guard: Collet-Sicard still leads with Collet-Sicard",
   first("gag_afferent_loss@left palatal_weakness@left vocal_cord_palsy@left weak_scm@left weak_trapezius@left cn12_palsy@left") === "left_skull_base_collet_sicard");
ok("row 7 guard: Horner alone still leads with the carotid space", first("miosis@left ptosis@left") === "left_skull_base_carotid_space");
ok("row 8: AICA's inner-ear rows (abnormal head impulse, peripheral nystagmus)",
   predicts("left_pons_lateral", "head_impulse_abnormal@none") && predicts("left_pons_lateral", "nystagmus_peripheral@none"));
{ const r = solve(T("cn8_vertigo@left hearing_loss@left nystagmus_peripheral@none head_impulse_abnormal@none"));
  ok("row 8: HINTS-plus → labyrinth first, AICA (lateral pons) in the top 3 (R1 #9)",
     ids(r)[0] === "left_peripheral_vestibular_labyrinth" && ids(r).slice(0, 3).includes("left_pons_lateral"), ids(r).slice(0, 3).join(", ")); }
{ const r = solve(T("cn8_vertigo@left hearing_loss@left facial_weakness@left forehead_involved@left limb_ataxia@left head_impulse_abnormal@none"));
  ok("row 8: AICA picture + abnormal head impulse → the lateral pons, one lesion", ids(r)[0] === "left_pons_lateral" && r.multi === null); }
ok("row 8 guard (the accepted cost): vestibular neuritis still leads with the labyrinth",
   first("cn8_vertigo@left nystagmus_peripheral@none head_impulse_abnormal@none") === "left_peripheral_vestibular_labyrinth");
ok("row 8 guard: a central AVS still leads with the central vestibular nucleus",
   first("cn8_vertigo@left nystagmus_gaze_evoked@none skew_deviation@none") === "left_central_vestibular_nucleus");

// ---- C. PCA, wrong-way eyes, thalamus (rows 10–12) ----
ok("row 10: the left (dominant) PCA gives alexia without agraphia", predicts("left_cortex_pca", "alexia_without_agraphia@none"));
ok("row 10: the right (non-dominant) PCA gives prosopagnosia", predicts("right_cortex_pca", "prosopagnosia@none"));
{ const r = solve(T("homonymous_hemianopia@right alexia_without_agraphia@none"));
  ok("row 10: alexia without agraphia + right hemianopia → the left PCA, one lesion", ids(r)[0] === "left_cortex_pca" && r.multi === null); }
{ const r = solve(T("homonymous_hemianopia@left prosopagnosia@none"));
  ok("row 10: left hemianopia + prosopagnosia → the right PCA, one lesion", ids(r)[0] === "right_cortex_pca" && r.multi === null); }
ok("row 10 guard: an isolated right hemianopia still leads with the occipital cortex", first("homonymous_hemianopia@right") === "left_cortex_occipital");
ok("row 11: an acute right PPRF lesion leaves the eyes deviated LEFT (toward the hemiparesis)", predicts("right_pons_medial", "gaze_deviation@left"));
{ const r = solve(T("gaze_deviation@left weak_arm@left weak_leg@left"));
  ok("row 11: wrong-way eyes → the right pons, one lesion", ids(r)[0] === "right_pons_medial" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
ok("row 11 guard: right-way eyes (gaze right + left hemiparesis + face) still lead with the right MCA",
   first("gaze_deviation@right weak_arm@left weak_leg@left facial_weakness@left forehead_spared@left") === "right_cortex_mca");
ok("row 12: the thalamus gives contralateral hemiataxia", predicts("left_subcortex_thalamus", "limb_ataxia@right"));
ok("row 12: the hand-listed thalamic-aphasia composite carries the same row (the B11 trap)",
   SITE["thalamic_aphasia_left"].structures.includes("thal_ataxia"));
ok("row 12: hemisensory loss + hemiataxia + face → the thalamus first",
   first("spinothalamic@right dorsal_sensory@right face_sensory_loss@right limb_ataxia@right") === "left_subcortex_thalamus");
ok("row 12 guard: a pure sensory stroke still leads with the thalamus",
   first("spinothalamic@right dorsal_sensory@right face_sensory_loss@right") === "left_subcortex_thalamus");
ok("row 12 guard: hemibody pain loss alone still leads with the thalamus", first("spinothalamic@left") === "right_subcortex_thalamus");
ok("row 12 guard: face + body pain loss on one side still leads contralaterally",
   /^right_(subcortex_(thalamus|sensorimotor)|thalamus_vpm|midbrain_lateral)$/.test(first("face_pain_loss@left spinothalamic@left") || ""));

// ---- D. The pyramidal foot drop (row 13, option A2) ----
{ const r = solve(T("weak_ankle_dorsiflexion@left babinski@left hyperreflexia@left"));
  ok("row 13: foot drop + Babinski + brisk → a right corticospinal place (not the hand knob), one lesion (R1 #5)",
     ids(r)[0] === "right_cortex_motor_leg" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
{ const r = solve(T("weak_ankle_dorsiflexion@left weak_arm@left facial_weakness@left forehead_spared@left"));
  ok("row 13: foot drop + weak arm + face (one side) → one capsular lesion", ids(r)[0] === "right_subcortex_corona_radiata" && r.multi === null); }
{ const r = solve(T("weak_ankle_dorsiflexion@left weak_great_toe_extension@left sensory_l5@left babinski@left"));
  ok("row 13 guard (A2, not A): an L5 root + Babinski keeps the L5 root first; the second place is the leg area",
     ids(r)[0] === "left_root_l5" && !!r.multi && r.multi.sites.some(s => s.id === "right_cortex_motor_leg")); }
ok("row 13 guard: a foot drop alone still means a nerve or root", /^left_(nerve|root|plexus)_/.test(first("weak_ankle_dorsiflexion@left") || ""));
ok("row 13 guard: the cortical hand still leads with the hand knob", first("weak_hand@left babinski@left hyperreflexia@left") === "right_cortex_hand_knob");
{ const set = T("weak_ankle_dorsiflexion@left babinski@left");
  ok("row 13: the entered word is never rewritten", enteredToken("weak_ankle_dorsiflexion@left", set) === "weak_ankle_dorsiflexion@left"); }

// ---- E. Dominance as a prior (row 9) and the card (rows 14, 15) ----
const R10 = "speech_nonfluent@none comprehension_impaired@none weak_arm@right facial_weakness@right forehead_spared@right homonymous_hemianopia@right";
{ const r = solve(T(R10), { dominantSide: "right" });
  ok("row 9: left MCA picture, right dominance set → the left MCA, one lesion (R1 #10)", ids(r)[0] === "left_cortex_mca" && r.multi === null);
  ok("row 9: the result names the assumption", r.dominance?.assumed === "left" && r.dominance?.set === "right", JSON.stringify(r.dominance)); }
{ const r = solve(T(R10));
  ok("row 9 guard: with the dominance that explains it, no fallback", r.dominance === null && ids(r)[0] === "left_cortex_mca"); }
{ const r = solve(T("speech_nonfluent@none"));
  ok("row 9 guard: an aphasia the setting explains never lists the other hemisphere", r.dominance === null && !ids(r).some(id => /^right_|_right$/.test(id))); }
{ const r = solve(T("speech_nonfluent@none weak_arm@left facial_weakness@left forehead_spared@left"));
  ok("row 9: crossed aphasia → one right-hemisphere lesion, assuming right dominance (R1 #11 consistent)",
     /^right_cortex_/.test(ids(r)[0] || "") && r.multi === null && r.dominance?.assumed === "right"); }
{ const r = solve(T(R10.replace(/@right/g, "@left")), { dominantSide: "left" });
  ok("row 9 mirror: right MCA picture, left dominance set → the right MCA", ids(r)[0] === "right_cortex_mca" && r.dominance?.assumed === "right"); }
{ const r = solve(T("face_sensory_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left"));
  ok("row 9 guard: the same-family near-fit is untouched (no gated finding)", r.dominance === null && !!r.nearFit?.instead); }
const cardFor = (toks, dominant) => {
  const tokens = T(toks), r = solve(tokens, { dominantSide: dominant });
  const sel = r.display.find(x => x.site.id === r.defaultSite) || r.display[0];
  return { r, lines: answerFor({ r, sel, total: tokens.size, tokens, onset: "", course: "", dominant, sensoryLevel: "",
    pinned: new Set(), scope: "site", selectedPathology: undefined, selectedEntity: undefined }).lines };
};
{ const { r, lines } = cardFor(R10, "right");
  ok("row 14: the Where line names the assumption",
     lines.where.endsWith("This assumes the left hemisphere is dominant, though right dominance is set (atypical dominance). If that is unlikely for this patient, no single place explains these findings."), lines.where);
  ok("row 14: the Why line reads with the assumed dominance", /only the left cerebral cortex/.test(lines.why), lines.why);
  // The flag now lives on the M1 occlusion, restricted to the dominant hemisphere (the card follows its cause, 2026-11-11).
  ok("row 15: the red flag follows the assumed dominance", lines.red === MCA_DOMINANT_FLAG, lines.red); }
{ const { r, lines } = cardFor("speech_nonfluent@none comprehension_impaired@none weak_arm@left facial_weakness@left forehead_spared@left homonymous_hemianopia@left", "right");
  ok("row 15: with right dominance set, a right MCA aphasia shows the DOMINANT red flag (the live bug)",
     r.dominance === null && lines.red === MCA_DOMINANT_FLAG, lines.red); }

// ---- F. Wording (rows 16, 17) ----
ok("row 16: gaze deviation is described by the side the eyes look toward", /record the side the eyes look toward/.test(FINDINGS.gaze_deviation.desc));
// Both flags now live on the place's usual cause (the card follows its cause, 2026-11-11): read them as the card shows them.
const usualRed = (id, dominantSide = "left") => redLine(SITE[id], leadingCause(causesFor(SITE[id]).all), dominantSide) || "";
ok("row 17: the carotid space's red flag names the XII palsy", /alone or with a XII palsy/.test(usualRed("left_skull_base_carotid_space")));
ok("row 17: the dominant PCA's red flag is the pure-alexia flag", /pure alexia/.test(usualRed("left_cortex_pca")));
ok("row 17: the non-dominant PCA names prosopagnosia", /prosopagnosia/i.test(nameForSite(SITE["right_cortex_pca"], { dominantSide: "left" }).note));
ok("row 17: the elbow's note says the claw is milder", /claw is milder/.test(nameForSite(SITE["left_nerve_ulnar_elbow"]).note));
ok("row 17: the thalamus's note names the hemiataxia", /hemiataxia/.test(nameForSite(SITE["left_subcortex_thalamus"]).note));

// ---- report ----
console.log(`\nNeuroLocaliser — content-gap fixes (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
