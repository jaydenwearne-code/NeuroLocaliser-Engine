// false-multifocal.test.js — the false-multifocal fix (owner rulings 2026-10-22, all 20 rows of round 1).
// Spec: docs/superpowers/specs/2026-10-22-false-multifocal-design.md
import { FINDING_FAMILIES, BACKGROUND_FINDINGS } from "../src/model/families.js";
import { matchToken, enteredToken, enteredSet, predictedSet, sameFamilyInstead } from "../src/engine/families.js";
import { FINDINGS } from "../src/model/findings.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (!c && d ? `  [${d}]` : "")); };
const S = s => new Set(s.split(/\s+/).filter(Boolean));

// ---- 1. the content and the matching ----
for (const fam of FINDING_FAMILIES) {
  ok(`family ${fam.id}: every member is a real finding`, fam.members.every(f => FINDINGS[f]));
  ok(`family ${fam.id}: cites its ruling`, /row \d+/.test(fam.ruling));
  if (fam.head) ok(`family ${fam.id}: its head is a member`, fam.members.includes(fam.head));
}
ok("background findings are real findings", BACKGROUND_FINDINGS.every(f => FINDINGS[f]));
ok("hearing loss is NOT background (NF2's own picture)", !BACKGROUND_FINDINGS.includes("hearing_loss"));
ok("row 2: past-pointing is matched as limb ataxia", matchToken("dysmetria@left") === "limb_ataxia@left");
ok("row 2: the head itself is unchanged", matchToken("limb_ataxia@left") === "limb_ataxia@left");
ok("row 3: hand weakness with leg weakness on that side reads as arm weakness",
   enteredToken("weak_hand@right", S("weak_hand@right weak_leg@right")) === "weak_arm@right");
ok("row 3: ...with facial weakness on that side too",
   enteredToken("weak_hand@right", S("weak_hand@right facial_weakness@right")) === "weak_arm@right");
ok("row 3: hand weakness with only Babinski + brisk stays hand weakness",
   enteredToken("weak_hand@right", S("weak_hand@right babinski@right hyperreflexia@right")) === "weak_hand@right");
ok("row 3: leg weakness on the OTHER side does not count",
   enteredToken("weak_hand@right", S("weak_hand@right weak_leg@left")) === "weak_hand@right");
ok("row 4: scanning speech is matched as slurred speech when only slurred speech was entered",
   predictedSet(S("ataxic_dysarthria@none truncal_ataxia@none"), enteredSet(S("dysarthria@none truncal_ataxia@none"))).has("dysarthria@none"));
ok("row 4: ...but not when scanning speech itself was entered",
   predictedSet(S("ataxic_dysarthria@none"), enteredSet(S("ataxic_dysarthria@none"))).has("ataxic_dysarthria@none"));
ok("row 5: face numbness entered, face pain loss predicted and not entered → face pain loss",
   sameFamilyInstead("face_sensory_loss@left", S("face_pain_loss@left"), S("face_sensory_loss@left")) === "face_pain_loss@left");
ok("row 7: both words entered is not a substitution",
   sameFamilyInstead("face_sensory_loss@left", S("face_pain_loss@left"), S("face_sensory_loss@left face_pain_loss@left")) === null);
ok("row 5: the other side does not count",
   sameFamilyInstead("face_sensory_loss@left", S("face_pain_loss@right"), S("face_sensory_loss@left")) === null);
ok("row 6: hand/arm is not a near-fit family",
   sameFamilyInstead("weak_hand@right", S("weak_arm@right"), S("weak_hand@right")) === null);
ok("row 6: plain → scanning speech is a near-fit family",
   sameFamilyInstead("ataxic_dysarthria@none", S("dysarthria@none"), S("ataxic_dysarthria@none")) === "dysarthria@none");

// ---- 2. the solver ----
import { solve, backgroundAside } from "../src/engine/inverse.js";
const first = r => r.display[0]?.site.id;
const ids = r => r.display.map(c => c.site.id);
const WALL = "face_pain_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left";

// row 2 — the cerebellar limb signs
{
  const r = solve(S("face_pain_loss@left spinothalamic@right miosis@left ptosis@left dysmetria@left dysphagia@left cn8_vertigo@left"));
  ok("row 2: Wallenberg with past-pointing → the lateral medulla, one lesion", first(r) === "left_medulla_lateral" && r.multi === null, `${first(r)} multi=${r.multi && r.multi.sites.map(s => s.id)}`);
  const r2 = solve(S(WALL + " dysmetria@left"));
  ok("row 2: Wallenberg + limb ataxia + its listed refinement past-pointing → one lesion", first(r2) === "left_medulla_lateral" && r2.multi === null);
  ok("row 2: ...both words count as explained", r2.display[0].n === 7);
  const r3 = solve(S("dysmetria@left"));
  ok("row 2: past-pointing alone → the cerebellar hemisphere first", first(r3) === "left_cerebellum_hemisphere");
  ok("row 2: ...and the peduncles fit too (one finding along the pathway)", ids(r3).includes("left_medulla_lateral") && ids(r3).includes("left_pons_lateral"));
  const r4 = solve(S("limb_ataxia@left dysmetria@left intention_tremor@left dysdiadochokinesis@left"));
  ok("row 2: all four words → the cerebellar hemisphere first", first(r4) === "left_cerebellum_hemisphere" && r4.multi === null);
}
// row 3 — hand weakness inside a hemiparesis
{
  const r = solve(S("dysarthria@none facial_weakness@right forehead_spared@right weak_hand@right"));
  ok("row 3: dysarthria–clumsy hand → one lacunar place", /^left_(subcortex_(internal_capsule|corona_radiata)|pons_basis_pontis)$/.test(first(r)) && r.multi === null, `${first(r)}`);
  const r2 = solve(S("weak_hand@right weak_leg@right facial_weakness@right forehead_spared@right babinski@right"));
  ok("row 3: capsular hemiparesis entered with hand weakness → explained by one place", r2.explainAll.length > 0 && r2.multi === null);
  ok("row 3: hand weakness alone → the hand knob", first(solve(S("weak_hand@right"))) === "left_cortex_hand_knob");
  ok("row 3: hand weakness + Babinski + brisk → the hand knob", first(solve(S("weak_hand@right babinski@right hyperreflexia@right"))) === "left_cortex_hand_knob");
}
// row 4 — plain dysarthria in a cerebellar picture
{
  const r = solve(S("truncal_ataxia@none nystagmus_gaze_evoked@none dysarthria@none"));
  ok("row 4: cerebellar picture with slurred speech → a cerebellar place, one lesion", /^cerebellum_/.test(first(r)) && r.multi === null, `${first(r)}`);
}
// rows 5–9 — the same-family near-fit
{
  const r = solve(S("face_sensory_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left"));
  ok("row 5: Wallenberg with face numbness → the lateral medulla first (R1 #6)", first(r) === "left_medulla_lateral");
  ok("row 5: ...a near-fit naming face pain loss instead", r.nearFit && r.nearFit.instead === "face_pain_loss@left" && r.nearFit.missing === "face_sensory_loss@left");
  ok("row 5: ...and no multifocal claim", r.multi === null);
  const r2 = solve(S("face_touch_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left"));
  ok("row 5: Wallenberg with face touch loss → the lateral medulla near-fit, no claim", first(r2) === "left_medulla_lateral" && r2.multi === null);
  const r3 = solve(S("face_sensory_loss@left spinothalamic@right"));
  ok("rows 8–9: two findings → the lateral medulla near-fit leads", first(r3) === "left_medulla_lateral" && r3.multi === null && r3.nearFit && r3.nearFit.instead === "face_pain_loss@left");
  const r4 = solve(S("face_pain_loss@left face_sensory_loss@left spinothalamic@right miosis@left ptosis@left limb_ataxia@left dysphagia@left"));
  ok("row 7: both face words entered → the claim stands", r4.multi !== null);
  const r5 = solve(S("miosis@left ptosis@left anhidrosis_face@left weak_hand@right babinski@right hyperreflexia@right"));
  ok("row 6: Horner's + hand weakness with Babinski (outside a hemiparesis) → the claim stands", r5.multi !== null);
}
// rows 11–13 — background
{
  const MCA = "speech_nonfluent@none comprehension_impaired@none weak_arm@right facial_weakness@right forehead_spared@right homonymous_hemianopia@right";
  const r = solve(S(MCA + " reflex_ankle_loss@left reflex_ankle_loss@right"));
  ok("row 12: MCA + absent ankle jerks → the MCA, no claim", first(r) === "left_cortex_mca" && r.multi === null);
  ok("row 12: ...the pair is set aside", r.background && r.background.tokens.join(" ") === "reflex_ankle_loss@left reflex_ankle_loss@right");
  const r2 = solve(S(MCA + " distal_sensory_loss@left distal_sensory_loss@right"));
  ok("row 12: MCA + glove-and-stocking → the MCA, the numbness set aside", first(r2) === "left_cortex_mca" && r2.multi === null && r2.background && r2.background.tokens.length === 2);
  ok("row 12: the insula + absent ankle jerks keeps the insula first", first(solve(S("dysarthria@none gustatory_loss@left reflex_ankle_loss@left reflex_ankle_loss@right"))) === "left_cortex_insula");
  const g = solve(S("lmn_weakness@left lmn_weakness@right reflex_knee_loss@left reflex_knee_loss@right reflex_ankle_loss@left reflex_ankle_loss@right distal_sensory_loss@left distal_sensory_loss@right"));
  ok("row 12: GBS + stocking → GBS first, no claim", first(g) === "polyradiculoneuropathy_acute" && g.multi === null);
  ok("row 12: ...GBS KEEPS its absent ankle jerks; only the stocking numbness is set aside", g.background && g.background.tokens.join(" ") === "distal_sensory_loss@left distal_sensory_loss@right");
  ok("row 13: an L5 root + absent ankle jerks → the L5 root first", first(solve(S("weak_ankle_dorsiflexion@left weak_great_toe_extension@left weak_hip_abduction@left sensory_l5@left reflex_ankle_loss@left reflex_ankle_loss@right"))) === "left_root_l5");
  ok("row 13: carpal tunnel + absent ankle jerks → carpal tunnel, no claim", (r => first(r) === "left_nerve_median_carpal_tunnel" && r.multi === null)(solve(S("median_sensory@left weak_thumb_abduction@left reflex_ankle_loss@left reflex_ankle_loss@right"))));
  const m = solve(S("facial_weakness@right forehead_spared@right weak_arm@right homonymous_hemianopia@left reflex_ankle_loss@left reflex_ankle_loss@right"));
  ok("row 12: a genuine two-lesion picture + absent ankle jerks keeps its claim, without a background place",
     m.multi && m.multi.sites.length === 2 && m.multi.sites.every(s => s.level === "cortex" || s.level === "subcortex") && m.background);
  ok("row 11: ONE absent ankle jerk is never background", backgroundAside(S("speech_nonfluent@none weak_arm@right facial_weakness@right forehead_spared@right reflex_ankle_loss@left")).length === 0);
  ok("row 12: the SCD picture explains its own ankle jerks — nothing set aside", backgroundAside(S("dorsal_sensory@left dorsal_sensory@right sensory_ataxia@none babinski@left babinski@right reflex_ankle_loss@left reflex_ankle_loss@right")).length === 0);
  ok("row 12: absent ankle jerks alone are the picture — nothing set aside", backgroundAside(S("reflex_ankle_loss@left reflex_ankle_loss@right")).length === 0);
}
// row 17 — the cover counts a family once
{
  const r = solve(S("cn12_palsy@right weak_arm@left weak_leg@left dorsal_sensory@left babinski@left hoffmann@left hyperreflexia@left spasticity@left limb_ataxia@left limb_ataxia@right dysmetria@left dysmetria@right dysdiadochokinesis@left dysdiadochokinesis@right intention_tremor@left intention_tremor@right truncal_ataxia@none ataxic_dysarthria@none nystagmus_gaze_evoked@none"));
  ok("row 17: right medial medulla + whole cerebellum → a cover of two places, not three", r.multi && r.multi.sites.length === 2, r.multi && r.multi.sites.map(s => s.id).join(" + "));
}
// guards — genuine two-lesion pictures keep their claim
{
  const two = t => solve(S(t)).multi !== null;
  ok("guard: Wallenberg + Broca's aphasia → two lesions (signed off 2026-08-14)", two(WALL + " speech_nonfluent@none repetition_impaired@none"));
  ok("guard: Wallenberg + a right L5 root → two lesions", two(WALL + " weak_ankle_dorsiflexion@right weak_hip_abduction@right sensory_l5@right"));
  ok("guard: x-mets / x-embolic picture → two lesions", two("facial_weakness@right forehead_spared@right weak_arm@right homonymous_hemianopia@left"));
  ok("guard: x-paraneo picture → two lesions", two("limb_ataxia@left limb_ataxia@right truncal_ataxia@none ataxic_dysarthria@none amnesia@none"));
  ok("guard: x-syphilis picture → two lesions", two("dorsal_sensory@left dorsal_sensory@right sensory_ataxia@none executive_dysfunction@none"));
  ok("guard: R arm + L leg → two lesions", two("weak_arm@right weak_leg@left"));
  ok("guard: INO + optic neuritis → two lesions", two("ino@left central_scotoma@right rapd@right"));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
