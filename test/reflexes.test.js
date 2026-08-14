// reflexes.test.js — the non-muscle reflexes, all as ANATOMY-layer findings (no new mechanism):
//   * UMN release signs (Babinski leg / Hoffmann arm) across the WHOLE corticospinal tract — non-
//     localising (they run the length of the tract; they confirm UMN and feed the future ALS layer);
//   * sacral superficial reflexes (anal wink / bulbocavernosus, S2-4) at the conus + cauda — localising;
//   * frontal release signs (grasp / palmomental) at the frontal cortex — both localising (palmomental
//     promoted by the 2026-08-14 LOCALISING audit: it is confined to orbitofrontal cortex in this model,
//     unlike babinski/hoffmann which genuinely run the length of the tract).
// FND signs (Hoover's, give-way) are deliberately NOT here — they belong to a later non-organic layer.
// Run: node test/reflexes.test.js
import { FINDINGS, CROSSES, isFinding } from "../src/model/findings.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// --- Task 1: vocabulary ---
for (const id of ["babinski","hoffmann","anal_wink_loss","bulbocavernosus_loss","grasp_reflex","palmomental"])
  ok(`finding ${id} exists`, isFinding(id));
ok("babinski crosses (UMN, contra by default)", CROSSES.babinski === true);
ok("hoffmann crosses", CROSSES.hoffmann === true);
ok("anal_wink_loss does not cross (sacral arc, local)", CROSSES.anal_wink_loss === false);
ok("grasp_reflex crosses (contralateral frontal)", CROSSES.grasp_reflex === true);

// --- Task 2: localising policy ---
import { LOCALISING } from "../src/engine/score.js";
for (const id of ["anal_wink_loss","bulbocavernosus_loss","grasp_reflex"]) ok(`${id} IS localising`, LOCALISING.has(id));
for (const id of ["babinski","hoffmann"]) ok(`${id} is NOT localising`, !LOCALISING.has(id));
ok("palmomental IS localising (2026-08-14 audit — confined to orbitofrontal cortex, not a whole-tract sign like babinski/hoffmann)",
   LOCALISING.has("palmomental"));

// --- Task 3: structures — Babinski across the whole corticospinal tract ---
import { STRUCTURES } from "../src/model/structures.js";
const producersOf = f => STRUCTURES.filter(s => s.produces === f);
const levelsProducing = f => [...new Set(producersOf(f).map(s => s.level))].sort();
ok("babinski produced across brainstem + cord + subcortex + cortex",
   ["midbrain","pons","medulla","cord","subcortex","cortex"].every(l => levelsProducing("babinski").includes(l)));
ok("hoffmann produced at cord + capsule + cortex + brainstem", levelsProducing("hoffmann").length >= 4);
ok("the CORD Babinski/Hoffmann are ipsilateral (crosses:false, like cst_cord)",
   producersOf("babinski").filter(s => s.level === "cord").every(s => s.crosses === false) &&
   producersOf("hoffmann").filter(s => s.level === "cord").every(s => s.crosses === false));
ok("anal wink + bulbocavernosus at conus AND cauda",
   levelsProducing("anal_wink_loss").includes("conus") && levelsProducing("anal_wink_loss").includes("cauda") &&
   levelsProducing("bulbocavernosus_loss").includes("conus"));
ok("grasp reflex is a frontal cortex sign", producersOf("grasp_reflex").every(s => s.level === "cortex"));

// --- Task 4: forward model — crossing follows the corticospinal site ---
import { expectedFindings } from "../src/engine/forward.js";
import { SITE_BY_ID, composeHemiLevelSites } from "../src/model/sites.js";
{
  const hemi = Object.fromEntries(composeHemiLevelSites().map(s => [s.id, s]));
  const cordHemi = expectedFindings(hemi.left_cord_hemi);
  ok("left hemicord -> babinski@left (ipsi, below the level)", cordHemi.has("babinski@left"));
  ok("left hemicord -> hoffmann@left (ipsi)", cordHemi.has("hoffmann@left"));
  const midbrain = expectedFindings(SITE_BY_ID.left_midbrain_medial);
  ok("left medial midbrain -> babinski@right (contra)", midbrain.has("babinski@right"));
}
import { composeCaudaConusSites } from "../src/model/sites.js";
{
  const CC = Object.fromEntries(composeCaudaConusSites().map(s => [s.id, s]));
  const conus = expectedFindings(CC.conus_medullaris);
  ok("conus -> anal_wink_loss@midline", conus.has("anal_wink_loss@midline"));
  ok("conus -> bulbocavernosus_loss@midline", conus.has("bulbocavernosus_loss@midline"));
  const frontal = expectedFindings(SITE_BY_ID.left_cortex_medial_pfc);
  ok("left medial_pfc -> grasp_reflex@right (contra)", frontal.has("grasp_reflex@right"));
}

// --- Task 5: UMN signs are a non-localising annotation (don't change WHICH site wins) ---
import { solve } from "../src/engine/inverse.js";
{
  const withoutBab = solve(new Set(["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left","weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right"])).best;
  const withBab = solve(new Set(["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left","weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right","babinski@right"])).best;
  ok("Weber localises to medial midbrain without Babinski", withoutBab && withoutBab.site.id === "left_midbrain_medial");
  ok("...and still with Babinski (non-localising annotation)", withBab && withBab.site.id === "left_midbrain_medial");
}

// --- Task 6: sacral reflexes pin the sacral arc (conus) ---
{
  const { best } = solve(new Set(["anal_wink_loss@midline","bulbocavernosus_loss@midline","umn_signs@midline","saddle_anaesthesia@midline","sphincter_dysfunction@midline"]));
  ok("sacral reflexes + UMN + saddle/sphincter -> conus", best && best.site.id === "conus_medullaris");
}

// --- Task 7: frontal release localises frontal ---
{
  const { best } = solve(new Set(["grasp_reflex@right","abulia@none"]));
  ok("grasp reflex + abulia -> a medial-frontal / ACA site", best && (best.site.part === "medial_pfc" || best.site.part === "aca"));
}

// ---- report ----
console.log("\nNeuroLocaliser — REFLEXES (sacral / UMN / frontal release) tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
