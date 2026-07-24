// horner-axis.test.js — the sympathetic / Horner three-order axis. The anhidrosis distribution is the
// discriminator (hemibody = central, face = preganglionic, none = postganglionic). The cord's
// oculosympathetic is LEVEL-GATED (Horner only at/above ~T1), so a cervical Brown-Séquard gets a Horner
// but a thoracic one does not. Pancoast = preganglionic ∪ lower-trunk (C8/T1) composite.
// Run: node test/horner-axis.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { expectedFindings } from "../src/engine/forward.js";
import { SITE_BY_ID, composeHemiLevelSites, composePancoastSites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const partSet = (level, part) => STRUCTURES.filter(s => s.level === level && s.part === part).map(s => s.produces).sort();
const best = (set, opts) => solve(new Set(set), opts).best;
const hemi = () => Object.fromEntries(composeHemiLevelSites().map(s => [s.id, s]));
const pancoast = () => composePancoastSites().find(s => s.id === "left_sympathetic_pancoast");

// --- 1: vocabulary & policy ---
for (const id of ["anhidrosis_face","anhidrosis_body"]) ok(`finding ${id} exists`, isFinding(id));
for (const id of ["anhidrosis_face","anhidrosis_body"]) ok(`${id} does not cross`, CROSSES[id] === false);
for (const id of ["anhidrosis_face","anhidrosis_body"]) ok(`${id} IS localising`, LOCALISING.has(id));
for (const id of ["anhidrosis_face","anhidrosis_body"]) ok(`${id} is lateralised`, !NON_LATERALISED.has(id));

// --- 2: sites & structures ---
ok("left preganglionic site exists", !!SITE_BY_ID.left_sympathetic_preganglionic);
ok("left cord lateral site exists", !!SITE_BY_ID.left_cord_lateral);
ok("cord lateral sympathetic is level-gated at T1",
   STRUCTURES.filter(s => s.level === "cord" && s.part === "lateral").every(s => s.emitAtOrAbove === "T1") &&
   STRUCTURES.some(s => s.level === "cord" && s.part === "lateral"));
ok("lateral medulla now produces anhidrosis_face + anhidrosis_body",
   partSet("medulla","lateral").includes("anhidrosis_face") && partSet("medulla","lateral").includes("anhidrosis_body"));
ok("preganglionic = horner + anhidrosis_face (lean)",
   JSON.stringify(partSet("sympathetic","preganglionic")) === JSON.stringify(["anhidrosis_face","miosis","ptosis"].sort()));
ok("carotid space stays horner-only (no anhidrosis)", (() => {
  const e = expectedFindings(SITE_BY_ID.left_skull_base_carotid_space);
  return e.has("miosis@left","ptosis@left") && !e.has("anhidrosis_face@left") && !e.has("anhidrosis_body@left");
})());
ok("Pancoast composite exists (preganglionic ∪ C8/T1)", !!pancoast());

// --- 3: the level gate (forward) ---
{
  const cerv = expectedFindings(SITE_BY_ID.left_cord_lateral, { sensoryLevel: "C7" });
  ok("cord lateral @C7 -> horner@left", cerv.has("miosis@left","ptosis@left"));
  ok("cord lateral @C7 -> anhidrosis_face@left + anhidrosis_body@left", cerv.has("anhidrosis_face@left") && cerv.has("anhidrosis_body@left"));
  const thor = expectedFindings(SITE_BY_ID.left_cord_lateral, { sensoryLevel: "T10" });
  ok("cord lateral @T10 -> NO horner / anhidrosis (below T1)", !thor.has("miosis@left","ptosis@left") && !thor.has("anhidrosis_face@left"));
  const none = expectedFindings(SITE_BY_ID.left_cord_lateral);
  ok("cord lateral (no level) -> nothing (restrictive default)", !none.has("miosis@left","ptosis@left") && !none.has("anhidrosis_face@left"));
  const H = hemi();
  ok("cervical hemicord (@C5) emits horner@left (Brown-Séquard gets the Horner)", expectedFindings(H.left_cord_hemi, { sensoryLevel: "C5" }).has("miosis@left","ptosis@left"));
  ok("thoracic hemicord (@T10) emits NO horner", !expectedFindings(H.left_cord_hemi, { sensoryLevel: "T10" }).has("miosis@left","ptosis@left"));
}

// --- 4: discriminators emerge (via solve) ---
const centralSet = ["miosis@left","ptosis@left","anhidrosis_face@left","anhidrosis_body@left"];
ok("isolated hemibody Horner + cervical level -> cord (central)",
   best(centralSet, { sensoryLevel: "C7" }).site.id === "left_cord_lateral");
ok("isolated hemibody Horner, no level -> lateral medulla (central, brainstem default)",
   best(centralSet).site.id === "left_medulla_lateral");
ok("cervical Brown-Séquard + Horner (@C5) -> one hemicord lesion",
   best(["weak_arm@left","weak_leg@left","dorsal_sensory@left","spinothalamic@right","miosis@left","ptosis@left","anhidrosis_face@left","anhidrosis_body@left"], { sensoryLevel: "C5" }).site.id === "left_cord_hemi");
ok("isolated face-only Horner -> preganglionic",
   best(["miosis@left","ptosis@left","anhidrosis_face@left"]).site.id === "left_sympathetic_preganglionic");
ok("Horner + face anhidrosis + C8/T1 (hand wasting + C8/T1 sensory) -> Pancoast",
   best(["miosis@left","ptosis@left","anhidrosis_face@left","sensory_c8@left","sensory_t1@left","weak_finger_abduction@left","wasting@left"]).site.id === "left_sympathetic_pancoast");
ok("the same C8/T1 signs WITHOUT the Horner -> lower trunk (Klumpke)",
   best(["sensory_c8@left","sensory_t1@left","weak_finger_abduction@left","wasting@left"]).site.id === "left_plexus_lower_trunk");
ok("isolated Horner -> postganglionic (carotid)",
   best(["miosis@left","ptosis@left"]).site.id === "left_skull_base_carotid_space");
ok("full Wallenberg (no anhidrosis, no level) still -> lateral medulla",
   best(["face_pain_loss@left","spinothalamic@right","miosis@left","ptosis@left","palatal_weakness@left","vocal_cord_palsy@left","dysphagia@left"]).site.id === "left_medulla_lateral");

// --- 5: phonebook ---
ok("cord central names cervical cord / syrinx",
   /cervical cord|syrinx|lateral cord|1st-order|central/i.test(nameForSite(best(centralSet, { sensoryLevel: "C7" }).site).name +
     nameForSite(best(centralSet, { sensoryLevel: "C7" }).site).note));
ok("preganglionic names preganglionic / stellate",
   /preganglionic|stellate/i.test(nameForSite(best(["miosis@left","ptosis@left","anhidrosis_face@left"]).site).name));
ok("Pancoast names Pancoast / superior sulcus",
   /pancoast|superior sulcus/i.test(nameForSite(best(["miosis@left","ptosis@left","anhidrosis_face@left","sensory_c8@left","sensory_t1@left","weak_finger_abduction@left","wasting@left"]).site).name));
ok("carotid names carotid / dissection / postganglionic",
   /carotid|dissection|postganglionic/i.test((nameForSite(best(["miosis@left","ptosis@left"]).site).name || "") + (nameForSite(best(["miosis@left","ptosis@left"]).site).note || "")));

// ---- report ----
console.log("\nNeuroLocaliser — SYMPATHETIC / HORNER AXIS tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
