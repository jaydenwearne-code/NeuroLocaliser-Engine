// tier2-deferred.test.js — the three previously-deferred Tier 2 items:
//   (1) brachial plexus CORDS (lateral / medial / posterior — nerve-unions, not root-unions);
//   (2) optic-nerve field geometry (altitudinal = AION, central scotoma = optic neuritis);
//   (3) finer sensory-cortex somatotopy (cortical sensory hand / cheiro-oral).
// Run: node test/tier2-deferred.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID, composeBrachialCordSites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const S = (...t) => new Set(t);
const win = set => solve(set).best?.site?.id ?? null;
const nameOf = set => { const b = solve(set).best; if (!b) return ""; const e = nameForSite(b.site); return (e.name || "") + " " + (e.note || ""); };
const producedAt = (lvl, part) => STRUCTURES.filter(s => s.level === lvl && s.part === part).map(s => s.produces);

// --- (1) brachial plexus cords ---
ok("cord sites build (lateral/medial/posterior)",
   ["lateral_cord", "medial_cord", "posterior_cord"].every(p => composeBrachialCordSites().some(s => s.part === p)));
ok("posterior cord (deltoid + all extensors + dorsal sensory) -> posterior_cord",
   win(S("weak_shoulder_abduction@left", "weak_elbow_extension@left", "weak_wrist_extension@left",
         "weak_finger_extension@left", "axillary_sensory@left", "radial_sensory@left")) === "left_plexus_posterior_cord");
ok("medial cord (ulnar + median thenar + medial sensory) -> medial_cord",
   win(S("weak_finger_abduction@left", "weak_thumb_abduction@left", "ulnar_sensory@left",
         "median_sensory@left", "weak_finger_flexion@left")) === "left_plexus_medial_cord");
ok("isolated radial palsy is NOT stolen by posterior cord (stays a radial nerve)",
   /nerve_radial/.test(win(S("weak_wrist_extension@left", "weak_finger_extension@left", "radial_sensory@left"))));
ok("posterior cord phonebook names it", /posterior cord/i.test(nameOf(S("weak_shoulder_abduction@left", "weak_elbow_extension@left", "weak_wrist_extension@left", "weak_finger_extension@left", "axillary_sensory@left", "radial_sensory@left"))));

// --- (2) optic-nerve field geometry ---
for (const id of ["altitudinal_defect", "central_scotoma"]) {
  ok(`${id} exists + LOCALISING + lateralised`, isFinding(id) && LOCALISING.has(id) && CROSSES[id] === false && !NON_LATERALISED.has(id));
}
ok("altitudinal defect + RAPD -> AION (optic_aion)", win(S("altitudinal_defect@left", "rapd@left")) === "left_skull_base_optic_aion");
ok("central scotoma + RAPD -> optic neuritis", win(S("central_scotoma@left", "rapd@left")) === "left_skull_base_optic_neuritis");
ok("generic optic neuropathy still -> optic canal", win(S("optic_neuropathy@left", "rapd@left")) === "left_skull_base_optic_canal");
ok("AION phonebook names it", /AION|ischaemic optic|altitudinal/i.test(nameOf(S("altitudinal_defect@left", "rapd@left"))));
ok("neuritis phonebook names it", /neuritis|scotoma/i.test(nameOf(S("central_scotoma@left", "rapd@left"))));

// --- (3) cortical sensory hand / cheiro-oral ---
ok("cortical_sensory_hand exists (crosses, cortical)", isFinding("cortical_sensory_hand") && CROSSES["cortical_sensory_hand"] === true);
ok("sensory_hand cortex site exists -> cortical_sensory_hand",
   !!SITE_BY_ID["left_cortex_sensory_hand"] && producedAt("cortex", "sensory_hand").includes("cortical_sensory_hand"));
ok("isolated cortical hand sensory loss -> postcentral sensory hand",
   win(S("cortical_sensory_hand@right")) === "left_cortex_sensory_hand");
ok("sensory-hand phonebook names cheiro-oral / cortical sensory hand",
   /cheiro-oral|cortical sensory hand|pseudo/i.test((nameForSite(SITE_BY_ID["left_cortex_sensory_hand"]).name || "") + (nameForSite(SITE_BY_ID["left_cortex_sensory_hand"]).note || "")));

console.log("\nNeuroLocaliser — TIER 2 DEFERRED (plexus cords · optic field geometry · cortical sensory hand)\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
