// cortex.test.js — the cerebral cortex region: lobar subregions mapped to function.
// Somatotopy + hemisphere dominance + sideless higher-cortical findings + bilateral syndromes.
// Run: node test/cortex.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// --- Task 1: vocabulary ---
const LATERALISED = ["weak_arm","weak_leg","cortical_sensory_arm","cortical_sensory_leg",
  "gaze_deviation","neglect","homonymous_hemianopia","superior_quadrantanopia","inferior_quadrantanopia"];
const SIDELESS = ["speech_nonfluent","comprehension_impaired","repetition_impaired","naming_impaired","agraphia","acalculia","finger_agnosia","left_right_disorientation","motor_dysprosody",
  "sensory_dysprosody","anosognosia","constructional_apraxia","prosopagnosia","executive_dysfunction",
  "abulia","disinhibition","hallucinations","mood_change","verbal_memory_impairment",
  "nonverbal_memory_impairment","cortical_blindness","optic_ataxia","oculomotor_apraxia","simultanagnosia"];

for (const id of [...LATERALISED, ...SIDELESS]) ok(`finding ${id} exists`, isFinding(id));
ok("gaze_deviation is ipsi (CROSSES false)", CROSSES.gaze_deviation === false);
ok("weak_arm crosses (contra)", CROSSES.weak_arm === true);
ok("neglect crosses (contra)", CROSSES.neglect === true);
ok("superior_quadrantanopia crosses", CROSSES.superior_quadrantanopia === true);
for (const id of SIDELESS) ok(`${id} is NON_LATERALISED`, NON_LATERALISED.has(id));
for (const id of LATERALISED) ok(`${id} is NOT NON_LATERALISED`, !NON_LATERALISED.has(id));
ok("facial weakness decomposed (facial_weakness + forehead_spared exist)", isFinding("facial_weakness") && isFinding("forehead_spared"));

// --- Task 2: structure catalogue ---
import { STRUCTURES, STRUCTURE_BY_ID } from "../src/model/structures.js";
const cortexOf = part => STRUCTURES.filter(s => s.level === "cortex" && s.part === part).map(s => s.produces).sort();
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// motor cortex now also carries the corticospinal UMN companions — the release signs (Babinski leg /
// Hoffmann arm, reflexes increment) and increased tone (spasticity, tone increment)
ok("motor_leg -> weak_leg + Babinski + spasticity", eq(cortexOf("motor_leg"), ["babinski","spasticity","weak_leg"].sort()));
ok("motor_facearm -> face+arm + Hoffmann + spasticity", eq(cortexOf("motor_facearm"), ["facial_weakness","forehead_spared","hoffmann","spasticity","weak_arm"].sort()));
ok("operculum -> broca features + dysprosody", eq(cortexOf("operculum"), ["speech_nonfluent","repetition_impaired","motor_dysprosody"].sort()));
ok("frontal_eye_field -> gaze", eq(cortexOf("frontal_eye_field"), ["gaze_deviation"]));
ok("occipital -> hemianopia+anton+macular sparing", eq(cortexOf("occipital"), ["cortical_blindness","homonymous_hemianopia","macular_sparing"].sort()));
ok("parietal has Gerstmann tetrad + neglect + Balint triad", ["agraphia","acalculia","finger_agnosia","left_right_disorientation","neglect","optic_ataxia","oculomotor_apraxia","simultanagnosia","inferior_quadrantanopia"]
   .every(f => cortexOf("parietal").includes(f)));
ok("temporal has memory+halluc+sup-quadrant", ["verbal_memory_impairment","nonverbal_memory_impairment","hallucinations","superior_quadrantanopia"]
   .every(f => cortexOf("temporal").includes(f)));
ok("broca is dominant-gated", STRUCTURE_BY_ID.ctx_broca_fluency.hemisphere === "dominant");
ok("neglect is nondominant-gated", STRUCTURE_BY_ID.ctx_neglect.hemisphere === "nondominant");
ok("anton is bilateralOnly", STRUCTURE_BY_ID.ctx_anton.bilateralOnly === true);
ok("balint triad is bilateralOnly", STRUCTURE_BY_ID.ctx_balint_oa.bilateralOnly === true);

// --- Task 3: primitive subregion sites ---
import { SITE_BY_ID, DIVISION } from "../src/model/sites.js";
ok("left_cortex_parietal exists", !!SITE_BY_ID.left_cortex_parietal);
ok("right_cortex_operculum exists", !!SITE_BY_ID.right_cortex_operculum);
ok("cortex parietal has a territory", /parietal/i.test(SITE_BY_ID.left_cortex_parietal.territory || ""));
ok("DIVISION maps operculum to MCA superior",
   DIVISION.operculum && DIVISION.operculum.territory === "MCA" && DIVISION.operculum.division === "superior");
ok("DIVISION maps motor_leg to ACA", DIVISION.motor_leg && DIVISION.motor_leg.territory === "ACA");
ok("DIVISION maps occipital to PCA", DIVISION.occipital && DIVISION.occipital.territory === "PCA");
ok("DIVISION maps parietal to MCA inferior",
   DIVISION.parietal && DIVISION.parietal.territory === "MCA" && DIVISION.parietal.division === "inferior");

// --- Task 4: forward-model gates ---
import { expectedFindings } from "../src/engine/forward.js";
import { SITE_BY_ID as S } from "../src/model/sites.js";

// sideless emission: Broca on a dominant (default left) operculum site -> @none
{
  const exp = expectedFindings(S.left_cortex_operculum);
  ok("left operculum emits speech_nonfluent@none (default dominant=left)", exp.has("speech_nonfluent@none"));
  ok("left operculum does NOT emit motor_dysprosody (dominant side)", !exp.has("motor_dysprosody@none"));
}
// hemisphere gate flips with dominantSide
{
  const exp = expectedFindings(S.left_cortex_operculum, { dominantSide: "right" });
  ok("with dominant=right, left operculum drops aphasia", !exp.has("speech_nonfluent@none"));
  ok("with dominant=right, left operculum emits motor_dysprosody", exp.has("motor_dysprosody@none"));
}
// lateralised cortical findings still cross; gaze is ipsi
{
  const exp = expectedFindings(S.left_cortex_motor_facearm);
  ok("left motor_facearm -> weak_arm@right (contra)", exp.has("weak_arm@right"));
  ok("left motor_facearm -> facial_weakness@right + forehead_spared@right (contra UMN)", exp.has("facial_weakness@right") && exp.has("forehead_spared@right"));
  const fef = expectedFindings(S.left_cortex_frontal_eye_field);
  ok("left FEF -> gaze_deviation@left (ipsi)", fef.has("gaze_deviation@left"));
}
// bilateral-only structure does NOT emit on a unilateral site
{
  const exp = expectedFindings(S.left_cortex_occipital);
  ok("unilateral occipital emits homonymous_hemianopia@right", exp.has("homonymous_hemianopia@right"));
  ok("unilateral occipital does NOT emit cortical_blindness", !exp.has("cortical_blindness@none"));
}

// --- Task 5: composers ---
import { composeVascularCortexSites, composeBilateralCortexSites } from "../src/model/sites.js";
{
  const vasc = composeVascularCortexSites();
  const byId = Object.fromEntries(vasc.map(s => [s.id, s]));
  ok("left_cortex_aca composite exists", !!byId.left_cortex_aca);
  ok("left_cortex_mca_superior exists", !!byId.left_cortex_mca_superior);
  ok("left_cortex_mca (whole) exists", !!byId.left_cortex_mca);
  ok("left_cortex_pca exists", !!byId.left_cortex_pca);
  ok("aca composite includes ctx_motor_leg", byId.left_cortex_aca.structures.includes("ctx_motor_leg"));
  ok("mca_superior includes ctx_broca_fluency", byId.left_cortex_mca_superior.structures.includes("ctx_broca_fluency"));
  ok("whole mca includes both broca and wernicke",
     byId.left_cortex_mca.structures.includes("ctx_broca_fluency") && byId.left_cortex_mca.structures.includes("ctx_wernicke_comp"));
  ok("mca_superior does NOT include ctx_wernicke_comp (inferior)", !byId.left_cortex_mca_superior.structures.includes("ctx_wernicke_comp"));
}
{
  const bilat = composeBilateralCortexSites();
  const byId = Object.fromEntries(bilat.map(s => [s.id, s]));
  ok("bilateral_occipital exists", !!byId.bilateral_occipital && byId.bilateral_occipital.side === "bilateral");
  ok("bilateral_parietal exists", !!byId.bilateral_parietal && byId.bilateral_parietal.side === "bilateral");
  ok("bilateral_occipital carries ctx_anton", byId.bilateral_occipital.structures.includes("ctx_anton"));
}

// --- Task 6: scoring + dominantSide plumbing → first emergent syndromes ---
import { solve } from "../src/engine/inverse.js";

// ACA: focal leg weakness + leg cortical sensory + abulia
{
  const { best } = solve(new Set(["weak_leg@right","cortical_sensory_leg@right","abulia@none"]));
  ok("ACA -> left_cortex_aca", best && best.site.id === "left_cortex_aca");
}
// MCA superior, dominant (default left): Broca picture
{
  const { best } = solve(new Set(["facial_weakness@right","forehead_spared@right","weak_arm@right","speech_nonfluent@none","gaze_deviation@left"]));
  ok("MCA-sup dominant -> left_cortex_mca_superior", best && best.site.id === "left_cortex_mca_superior");
}
// dominantSide option echoed and honoured
{
  const res = solve(new Set(["speech_nonfluent@none","weak_arm@right"]), { dominantSide: "right" });
  ok("solve echoes dominantSide", res.dominantSide === "right");
  ok("right-dominant: aphasia does NOT localise to left operculum",
     !(res.best && res.best.site.structures && res.best.site.structures.includes("ctx_broca_fluency") && res.best.site.side === "left"));
}
// Focal non-dominant parietal: neglect picture localises to the parietal subregion (tighter than whole MCA-inf)
{
  const { best } = solve(new Set(["neglect@left","anosognosia@none","inferior_quadrantanopia@left"]));
  ok("focal neglect -> right_cortex_parietal", best && best.site.id === "right_cortex_parietal");
}

// --- Task 7: composite vs focal emergence ---
// Whole-MCA (dominant, global) picture spanning both divisions -> the whole-MCA composite.
{
  const global = new Set(["facial_weakness@right","forehead_spared@right","weak_arm@right","speech_nonfluent@none",
    "comprehension_impaired@none","superior_quadrantanopia@right","agraphia@none","acalculia@none","finger_agnosia@none","left_right_disorientation@none","gaze_deviation@left"]);
  const { best } = solve(global);
  ok("global MCA -> left_cortex_mca (whole)", best && best.site.id === "left_cortex_mca");
}
// Isolated homonymous hemianopia -> occipital / PCA. left_cortex_occipital (primitive) and
// left_cortex_pca (composite) are equivalent (PCA supplies only occipital). NOTE (subcortex increment):
// the deep optic radiation now TIES them — an isolated hemianopia genuinely cannot be told apart by
// field defect alone — so the assertion is relaxed to accept the deep radiation too. Occipital still
// wins `best` by build order (subcortex is built after cortex). It must NOT be MCA-inferior or bilateral.
{
  const { best } = solve(new Set(["homonymous_hemianopia@right"]));
  ok("isolated hemianopia -> occipital/PCA (or deep optic radiation)",
     best && (best.site.id === "left_cortex_occipital" || best.site.id === "left_cortex_pca"
       || best.site.id === "left_subcortex_optic_radiation"));
  ok("isolated hemianopia is not MCA-inferior", best && best.site.part !== "mca_inferior");
  ok("isolated hemianopia is not bilateral (Anton)", best && best.site.side !== "bilateral");
}
// Quadrantanopias localise to different lobes and do not collapse.
{
  const sup = solve(new Set(["superior_quadrantanopia@right"])).best;
  const inf = solve(new Set(["inferior_quadrantanopia@right"])).best;
  ok("superior quadrant -> temporal subregion", sup && sup.site.part === "temporal");
  ok("inferior quadrant -> parietal subregion", inf && inf.site.part === "parietal");
  ok("the two field defects localise differently", sup && inf && sup.site.id !== inf.site.id);
}

// --- Task 8: bilateral syndromes ---
// Anton: cortical blindness (bilateral-only) -> bilateral_occipital; no single occipital explains it.
{
  const { best } = solve(new Set(["cortical_blindness@none"]));
  ok("cortical_blindness -> bilateral_occipital", best && best.site.id === "bilateral_occipital");
}
// Balint: the triad (bilateral-only) -> bilateral_parietal, not sunk by over-prediction.
{
  const { best } = solve(new Set(["optic_ataxia@none","oculomotor_apraxia@none","simultanagnosia@none"]));
  ok("Balint triad -> bilateral_parietal", best && best.site.id === "bilateral_parietal");
}
// A unilateral occipital picture (isolated hemianopia) must NOT be called Anton.
{
  const { best } = solve(new Set(["homonymous_hemianopia@right"]));
  ok("unilateral hemianopia is not bilateral_occipital", best && best.site.id !== "bilateral_occipital");
}

// --- Task 9: dominance-aware phonebook ---
import { nameForSite } from "../src/data/syndromes.js";
{
  const res = solve(new Set(["neglect@left","anosognosia@none","inferior_quadrantanopia@left"]));
  ok("right parietal names neglect syndrome",
     /neglect/i.test(nameForSite(res.best.site, { dominantSide: res.dominantSide }).name));
}
{
  const res = solve(new Set(["agraphia@none","acalculia@none","finger_agnosia@none","left_right_disorientation@none","inferior_quadrantanopia@right"]));
  ok("left parietal names Gerstmann",
     /gerstmann/i.test(nameForSite(res.best.site, { dominantSide: res.dominantSide }).name));
}
{
  const res = solve(new Set(["cortical_blindness@none"]));
  ok("bilateral occipital names Anton", /anton/i.test(nameForSite(res.best.site).name));
}
{
  const res = solve(new Set(["facial_weakness@right","forehead_spared@right","weak_arm@right","speech_nonfluent@none","gaze_deviation@left"]));
  ok("dominant MCA-sup names Broca/MCA",
     /broca|middle cerebral|mca superior/i.test(nameForSite(res.best.site, { dominantSide: res.dominantSide }).name));
}
{
  const res = solve(new Set(["homonymous_hemianopia@right","macular_sparing@right"]));
  ok("hemianopia with macular sparing names PCA", /posterior cerebral|pca/i.test(nameForSite(res.best.site, { dominantSide: res.dominantSide }).name));
}
// non-cortex entries still work (regression on the phonebook signature change)
{
  const res = solve(new Set(["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left","weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right"]));
  ok("Weber still names (flat entry unaffected)", /weber/i.test(nameForSite(res.best.site).name));
}

// ---- report ----
console.log("\nNeuroLocaliser — CORTEX tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
