// nerve-segments.test.js — complete nerve innervation + level segments (proximal-vs-distal).
// A segment is a `part` under the `nerve` level; a proximal segment is the SUPERSET of the distal one,
// so which spared muscle / cutaneous branch localises the level emerges from parsimony (no new mechanism):
//   radial  — axilla ⊃ spiral groove ⊃ PIN (triceps, then wrist-drop, then sensory drop away distally)
//   ulnar   — elbow vs wrist (Guyon): FDP4/5 + FCU + dorsal sensory spared distally; ulnar CLAW appears
//             distally (the paradox — intact FDP claws harder)
//   median  — proximal vs AIN (pure motor) vs carpal tunnel (palmar cutaneous spared → palmar sparing)
//   peroneal— common vs deep (eversion spared) vs superficial (dorsiflexion spared)
// Run: node test/nerve-segments.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

const NEW = ["weak_forearm_pronation","weak_thumb_adduction","deep_peroneal_sensory",
             "ulnar_dorsal_sensory","median_palmar_sensory","ulnar_claw"];
const nerveOf = part => STRUCTURES.filter(s => s.level === "nerve" && s.part === part).map(s => s.produces).sort();

// --- 1: vocabulary & policy ---
for (const id of NEW) ok(`finding ${id} exists`, isFinding(id));
for (const id of NEW) ok(`${id} does not cross (peripheral)`, CROSSES[id] === false);
for (const id of NEW) ok(`${id} is lateralised (not @none)`, !NON_LATERALISED.has(id));
for (const id of ["deep_peroneal_sensory","ulnar_dorsal_sensory","median_palmar_sensory","ulnar_claw"])
  ok(`${id} IS localising`, LOCALISING.has(id));
for (const id of ["weak_forearm_pronation","weak_thumb_adduction"])
  ok(`${id} is NOT localising (movement)`, !LOCALISING.has(id));

// --- 2: registration — segment sites exist, whole-nerve sites gone ---
for (const p of ["radial_axilla","radial_spiral_groove","radial_pin","ulnar_elbow","ulnar_wrist",
                 "median_proximal","median_ain","median_carpal_tunnel",
                 "peroneal_common","peroneal_deep","peroneal_superficial"])
  ok(`left_nerve_${p} exists`, !!SITE_BY_ID[`left_nerve_${p}`]);
for (const p of ["radial","median","ulnar","common_peroneal"])
  ok(`old left_nerve_${p} is gone`, !SITE_BY_ID[`left_nerve_${p}`]);

// --- 3: structure sets (spot-checks of the spared-muscle boundaries) ---
ok("radial_axilla has triceps (elbow ext) + triceps jerk",
   nerveOf("radial_axilla").includes("weak_elbow_extension") && nerveOf("radial_axilla").includes("reflex_triceps_loss"));
ok("radial_spiral_groove spares triceps, keeps wrist ext + sensory",
   !nerveOf("radial_spiral_groove").includes("weak_elbow_extension") &&
   nerveOf("radial_spiral_groove").includes("weak_wrist_extension") && nerveOf("radial_spiral_groove").includes("radial_sensory"));
ok("radial_pin spares wrist ext + all sensory (pure motor finger drop)",
   !nerveOf("radial_pin").includes("weak_wrist_extension") && !nerveOf("radial_pin").includes("radial_sensory") &&
   nerveOf("radial_pin").includes("weak_finger_extension"));
ok("ulnar_elbow has FDP + dorsal sensory, NO claw",
   nerveOf("ulnar_elbow").includes("weak_finger_flexion") && nerveOf("ulnar_elbow").includes("ulnar_dorsal_sensory") &&
   !nerveOf("ulnar_elbow").includes("ulnar_claw"));
ok("ulnar_wrist has claw, spares FDP + dorsal sensory",
   nerveOf("ulnar_wrist").includes("ulnar_claw") && !nerveOf("ulnar_wrist").includes("weak_finger_flexion") &&
   !nerveOf("ulnar_wrist").includes("ulnar_dorsal_sensory"));
ok("median_carpal_tunnel spares palmar cutaneous + all forearm muscles",
   !nerveOf("median_carpal_tunnel").includes("median_palmar_sensory") &&
   !nerveOf("median_carpal_tunnel").includes("weak_forearm_pronation") &&
   nerveOf("median_carpal_tunnel").includes("weak_thumb_abduction") && nerveOf("median_carpal_tunnel").includes("median_sensory"));
ok("median_ain is pure motor (deep flexion + pronation, no thenar/sensory)",
   nerveOf("median_ain").includes("weak_finger_flexion") && nerveOf("median_ain").includes("weak_forearm_pronation") &&
   !nerveOf("median_ain").includes("median_sensory") && !nerveOf("median_ain").includes("weak_thumb_abduction"));
ok("median_proximal has palmar cutaneous + pronation",
   nerveOf("median_proximal").includes("median_palmar_sensory") && nerveOf("median_proximal").includes("weak_forearm_pronation"));
ok("peroneal_deep spares eversion, has first-web sensory",
   !nerveOf("peroneal_deep").includes("weak_foot_eversion") && nerveOf("peroneal_deep").includes("deep_peroneal_sensory"));
ok("peroneal_superficial spares dorsiflexion, has dorsum sensory",
   !nerveOf("peroneal_superficial").includes("weak_ankle_dorsiflexion") && nerveOf("peroneal_superficial").includes("peroneal_sensory"));

// --- 4: discriminators emerge (via solve) ---
const best = set => solve(new Set(set)).best;
// Radial level
ok("wrist+finger drop + triceps weak + lost triceps jerk -> axilla",
   best(["weak_wrist_extension@left","weak_finger_extension@left","weak_elbow_extension@left","reflex_triceps_loss@left","radial_sensory@left"]).site.id === "left_nerve_radial_axilla");
ok("wrist+finger drop + sensory, triceps SPARED -> spiral groove",
   best(["weak_wrist_extension@left","weak_finger_extension@left","radial_sensory@left"]).site.id === "left_nerve_radial_spiral_groove");
ok("finger drop, wrist ext preserved, NO sensory -> PIN",
   best(["weak_finger_extension@left","weak_forearm_supination@left"]).site.id === "left_nerve_radial_pin");
// Ulnar level (the paradox)
ok("intrinsics + Froment + FDP + FCU + dorsal sensory, no claw -> elbow",
   best(["weak_finger_abduction@left","weak_thumb_adduction@left","weak_finger_flexion@left","weak_wrist_flexion@left","ulnar_sensory@left","ulnar_dorsal_sensory@left"]).site.id === "left_nerve_ulnar_elbow");
ok("intrinsics + Froment + CLAW + palmar sensory, FDP/dorsal SPARED -> wrist (paradox)",
   best(["weak_finger_abduction@left","weak_thumb_adduction@left","ulnar_claw@left","ulnar_sensory@left"]).site.id === "left_nerve_ulnar_wrist");
// Median level
ok("thenar weakness + digital sensory, palmar SPARED -> carpal tunnel",
   best(["weak_thumb_abduction@left","median_sensory@left"]).site.id === "left_nerve_median_carpal_tunnel");
ok("pronation + wrist/finger flexion + thenar + digital + palmar sensory -> proximal",
   best(["weak_forearm_pronation@left","weak_wrist_flexion@left","weak_finger_flexion@left","weak_thumb_abduction@left","median_sensory@left","median_palmar_sensory@left"]).site.id === "left_nerve_median_proximal");
ok("deep finger flexion + pronation, no thenar/sensory -> AIN",
   best(["weak_finger_flexion@left","weak_forearm_pronation@left"]).site.id === "left_nerve_median_ain");
// Peroneal branch
ok("dorsiflexion + great-toe ext + eversion + dorsum sensory -> common peroneal",
   best(["weak_ankle_dorsiflexion@left","weak_great_toe_extension@left","weak_foot_eversion@left","peroneal_sensory@left"]).site.id === "left_nerve_peroneal_common");
ok("dorsiflexion + great-toe ext + first-web sensory, eversion SPARED -> deep peroneal",
   best(["weak_ankle_dorsiflexion@left","weak_great_toe_extension@left","deep_peroneal_sensory@left"]).site.id === "left_nerve_peroneal_deep");
ok("eversion + dorsum sensory, dorsiflexion SPARED -> superficial peroneal",
   best(["weak_foot_eversion@left","peroneal_sensory@left"]).site.id === "left_nerve_peroneal_superficial");

// --- 5: phonebook names the segments ---
ok("carpal tunnel names CTS / carpal tunnel",
   /carpal|median/i.test(nameForSite(best(["weak_thumb_abduction@left","median_sensory@left"]).site).name));
ok("spiral groove names Saturday-night / radial",
   /saturday|spiral|radial/i.test(nameForSite(best(["weak_wrist_extension@left","weak_finger_extension@left","radial_sensory@left"]).site).name));

// ---- report ----
console.log("\nNeuroLocaliser — NERVE SEGMENTS (complete innervation) tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
