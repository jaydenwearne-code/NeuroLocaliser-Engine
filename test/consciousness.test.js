// consciousness.test.js — reduced level of consciousness (arousal) and the ARAS. Coma needs EITHER the
// brainstem ARAS (a single paramedian tegmental lesion) OR both hemispheres (bilateral thalamus / diffuse
// cortex); a UNILATERAL hemispheric/thalamic lesion impairs nothing (content vs arousal — the bilateralOnly
// gate). Locked-in is the ventral-vs-tegmental contrast: awake but quadriplegic.
// Run: node test/consciousness.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID, composeConsciousnessSites } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve, rankSingle } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// --- Task 1: vocabulary ---
for (const id of ["reduced_consciousness", "preserved_vertical_gaze", "extensor_posturing"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} is NON_LATERALISED (@none)`, NON_LATERALISED.has(id));
  ok(`${id} has a CROSSES entry`, id in CROSSES);
  ok(`${id} is LOCALISING`, LOCALISING.has(id));
}

// --- Task 2: structures, sites, forward ---
const CS = Object.fromEntries(composeConsciousnessSites().map(s => [s.id, s]));
for (const id of ["cerebrum_diffuse", "brainstem_aras", "thalamus_bilateral_percheron", "locked_in"]) {
  ok(`${id} site exists`, !!CS[id]);
}
ok("brainstem_aras is midline", CS.brainstem_aras && CS.brainstem_aras.side === "midline");
ok("cerebrum_diffuse is bilateral", CS.cerebrum_diffuse && CS.cerebrum_diffuse.side === "bilateral");

// Forward emissions.
{
  const dif = expectedFindings(CS.cerebrum_diffuse);
  ok("diffuse -> reduced_consciousness@none only",
     dif.has("reduced_consciousness@none") && dif.size === 1);
  const ar = expectedFindings(CS.brainstem_aras);
  ok("brainstem_aras -> reduced_consciousness@none + extensor_posturing@none",
     ar.has("reduced_consciousness@none") && ar.has("extensor_posturing@none"));
  const per = expectedFindings(CS.thalamus_bilateral_percheron);
  ok("percheron -> reduced_consciousness@none + vertical_gaze_palsy@none",
     per.has("reduced_consciousness@none") && per.has("vertical_gaze_palsy@none"));
  const li = expectedFindings(CS.locked_in);
  ok("locked_in -> hemiparesis@left + @right (quadriplegia)",
     li.has("weak_arm@left","weak_leg@left") && li.has("weak_arm@right","weak_leg@right"));
  ok("locked_in -> preserved_vertical_gaze@none", li.has("preserved_vertical_gaze@none"));
  ok("locked_in does NOT emit reduced_consciousness (ventral, ARAS spared)",
     !li.has("reduced_consciousness@none"));
}
// The bilateralOnly gate: the UNILATERAL VPL thalamus does NOT emit arousal findings.
{
  const uni = expectedFindings(SITE_BY_ID.left_subcortex_thalamus);
  ok("unilateral thalamus does NOT emit reduced_consciousness",
     !uni.has("reduced_consciousness@none"));
  ok("unilateral thalamus does NOT emit vertical_gaze_palsy (bilateralOnly gate)",
     !uni.has("vertical_gaze_palsy@none"));
}

// --- Task 3: emergent naming + inverse emergence ---
// 1. Isolated reduced_consciousness -> diffuse (strict): ARAS over-predicts posturing, Percheron
//    over-predicts vertical gaze, so the diffuse site (nothing over-predicted) wins.
{
  const { best } = solve(new Set(["reduced_consciousness@none"]));
  ok("isolated reduced_consciousness -> cerebrum_diffuse", best && best.site.id === "cerebrum_diffuse");
  ok("cerebrum_diffuse names a diffuse / encephalopathy picture",
     best && /diffuse|encephalopath|bihemispheric/i.test(nameForSite(best.site).name));
  const ids = rankSingle(new Set(["reduced_consciousness@none"])).map(r => r.site.id);
  ok("brainstem_aras is in the ranked candidates for isolated arousal", ids.includes("brainstem_aras"));
}
// 2. reduced_consciousness + extensor_posturing -> brainstem ARAS (structural brainstem coma).
{
  const { best } = solve(new Set(["reduced_consciousness@none", "extensor_posturing@none"]));
  ok("arousal + posturing -> brainstem_aras", best && best.site.id === "brainstem_aras");
  ok("brainstem_aras names an ARAS / brainstem picture",
     best && /aras|brainstem|arousal/i.test(nameForSite(best.site).name));
}
// 3. reduced_consciousness + vertical_gaze_palsy -> Percheron (bilateral paramedian thalamus).
{
  const { best } = solve(new Set(["reduced_consciousness@none", "vertical_gaze_palsy@none"]));
  ok("arousal + vertical gaze palsy -> thalamus_bilateral_percheron",
     best && best.site.id === "thalamus_bilateral_percheron");
  ok("percheron names a paramedian thalamic / Percheron picture",
     best && /percheron|paramedian thalam/i.test(nameForSite(best.site).name));
}
// 4. Quadriplegia + preserved vertical gaze -> locked-in.
{
  const { best } = solve(new Set(["weak_arm@left","weak_leg@left", "weak_arm@right","weak_leg@right", "preserved_vertical_gaze@none"]));
  ok("quadriplegia + preserved gaze -> locked_in", best && best.site.id === "locked_in");
  ok("locked_in names locked-in syndrome", best && /locked[- ]?in/i.test(nameForSite(best.site).name));
}
// 5. REGRESSION: an isolated vertical_gaze_palsy still -> the tectal Parinaud site (Percheron over-predicts
//    reduced_consciousness, so it loses the isolated case).
{
  const { best } = solve(new Set(["vertical_gaze_palsy@none", "nystagmus_convergence_retraction@none"]));
  ok("isolated vertical gaze -> dorsal_midbrain_tectum (Parinaud unchanged)",
     best && best.site.id === "dorsal_midbrain_tectum");
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
