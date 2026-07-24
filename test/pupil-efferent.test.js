// pupil-efferent.test.js — the parasympathetic light-reflex efferent limb. Because the parasympathetic
// fibres run on the SURFACE of CN III, the pupil localises: a compressive lesion (aneurysm/uncal) is
// pupil-INVOLVING (fixed dilated), an ischaemic one is pupil-SPARING. Adie (ciliary ganglion) and Argyll
// Robertson (pretectum) share light-near dissociation, separated by the fixed dilated pupil + laterality.
// Run: node test/pupil-efferent.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { expectedFindings } from "../src/engine/forward.js";
import { SITE_BY_ID, composePupilPretectumSites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const nerveSet = part => STRUCTURES.filter(s => s.level === "pupil" && s.part === part).map(s => s.produces).sort();
const best = set => solve(new Set(set)).best;
const pretectum = () => composePupilPretectumSites().find(s => s.id === "pupil_pretectum");

// --- 1: vocabulary & policy ---
for (const id of ["fixed_dilated_pupil","light_near_dissociation"]) ok(`finding ${id} exists`, isFinding(id));
for (const id of ["fixed_dilated_pupil","light_near_dissociation"]) ok(`${id} does not cross`, CROSSES[id] === false);
for (const id of ["fixed_dilated_pupil","light_near_dissociation"]) ok(`${id} IS localising`, LOCALISING.has(id));
for (const id of ["fixed_dilated_pupil","light_near_dissociation"]) ok(`${id} is lateralised`, !NON_LATERALISED.has(id));

// --- 2: sites & structures ---
ok("left compressive CN III site exists", !!SITE_BY_ID.left_pupil_cn3_compressive);
ok("right ischaemic CN III site exists", !!SITE_BY_ID.right_pupil_cn3_ischaemic);
ok("left ciliary ganglion (Adie) site exists", !!SITE_BY_ID.left_pupil_ciliary_ganglion);
ok("pretectum bilateral site exists", !!pretectum() && pretectum().side === "bilateral");
ok("compressive CN III = four ductions + ptosis + fixed_dilated_pupil",
   JSON.stringify(nerveSet("cn3_compressive")) === JSON.stringify(["ptosis","weak_adduction","weak_elevation","weak_depression","fixed_dilated_pupil"].sort()));
ok("ischaemic CN III = four ductions + ptosis ONLY (pupil-sparing)",
   JSON.stringify(nerveSet("cn3_ischaemic")) === JSON.stringify(["ptosis","weak_adduction","weak_elevation","weak_depression"].sort()));
ok("Adie = fixed_dilated_pupil + light_near_dissociation, NO ductions",
   JSON.stringify(nerveSet("ciliary_ganglion")) === JSON.stringify(["fixed_dilated_pupil","light_near_dissociation"].sort()));
ok("pretectum = light_near_dissociation, NO fixed dilated",
   JSON.stringify(nerveSet("pretectum")) === JSON.stringify(["light_near_dissociation"]));

// --- 3: forward emission ---
{
  const cmp = expectedFindings(SITE_BY_ID.left_pupil_cn3_compressive);
  ok("compressive -> ductions@left + fixed_dilated_pupil@left", cmp.has("weak_adduction@left") && cmp.has("fixed_dilated_pupil@left"));
  const isch = expectedFindings(SITE_BY_ID.left_pupil_cn3_ischaemic);
  ok("ischaemic -> ductions@left, NO fixed dilated (pupil-sparing)", isch.has("weak_adduction@left") && !isch.has("fixed_dilated_pupil@left"));
  const adie = expectedFindings(SITE_BY_ID.left_pupil_ciliary_ganglion);
  ok("Adie -> fixed_dilated_pupil@left + light_near_dissociation@left", adie.has("fixed_dilated_pupil@left") && adie.has("light_near_dissociation@left"));
  const ar = expectedFindings(pretectum());
  ok("pretectum -> light_near_dissociation@left AND @right (bilateral)", ar.has("light_near_dissociation@left") && ar.has("light_near_dissociation@right"));
}

// --- 4: discriminators emerge (via solve) ---
ok("cn3 palsy + fixed dilated pupil -> compressive (aneurysm)",
   best(["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left","fixed_dilated_pupil@left"]).site.id === "left_pupil_cn3_compressive");
ok("isolated (pupil-sparing) cn3 palsy -> ischaemic (microvascular)",
   best(["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left"]).site.id === "left_pupil_cn3_ischaemic");
ok("fixed dilated + light-near dissociation, unilateral, no CN III palsy -> Adie",
   best(["fixed_dilated_pupil@left","light_near_dissociation@left"]).site.id === "left_pupil_ciliary_ganglion");
ok("bilateral light-near dissociation -> Argyll Robertson (pretectum)",
   best(["light_near_dissociation@left","light_near_dissociation@right"]).site.id === "pupil_pretectum");
ok("full Weber (cn3 + contra hemiparesis + facial) still localises to the midbrain (pupil sites don't steal it)",
   best(["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left","weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right"]).site.id === "left_midbrain_medial");

// --- 5: phonebook ---
ok("compressive names aneurysm / compressive / emergency",
   /aneurysm|compressive|pupil-involving/i.test(nameForSite(best(["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left","fixed_dilated_pupil@left"]).site).name));
ok("ischaemic names microvascular / ischaemic / pupil-sparing",
   /microvascular|ischaemic|pupil-sparing/i.test(nameForSite(best(["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left"]).site).name));
ok("Adie names Adie / tonic",
   /adie|tonic/i.test(nameForSite(best(["fixed_dilated_pupil@left","light_near_dissociation@left"]).site).name));
ok("pretectum names Argyll Robertson",
   /argyll|robertson/i.test(nameForSite(best(["light_near_dissociation@left","light_near_dissociation@right"]).site).name));

// ---- report ----
console.log("\nNeuroLocaliser — PUPILLARY EFFERENT (parasympathetic) tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
