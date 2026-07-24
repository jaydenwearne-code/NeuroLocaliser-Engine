// pns-nerves.test.js — the focal PNS: brachial & lumbosacral plexus + named peripheral nerves, on a
// MOVEMENT-based weakness vocabulary. The headline: nerve-vs-root discriminators EMERGE because the
// movement is a SHARED finding (both the nerve and the root produce it), and the distinct sensory
// territory localises. E.g. L5 and the common peroneal nerve both cause foot drop
// (weak_ankle_dorsiflexion), but only L5 adds weak_foot_inversion + weak_hip_abduction.
// Run: node test/pns-nerves.test.js
import { FINDINGS, CROSSES, isFinding } from "../src/model/findings.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// --- Task 1: vocabulary — lumped myotomes GONE, movements + territories present ---
for (const gone of ["weak_c5","weak_c7","weak_l5","weak_s1"])
  ok(`lumped ${gone} removed (Approach A)`, !isFinding(gone));
const MOVES = ["weak_shoulder_abduction","weak_elbow_flexion","weak_elbow_extension","weak_wrist_extension",
  "weak_finger_extension","weak_thumb_abduction","weak_finger_abduction","weak_finger_flexion","weak_scapular_stabilisation",
  "weak_hip_flexion","weak_hip_adduction","weak_hip_abduction","weak_knee_extension","weak_knee_flexion",
  "weak_ankle_dorsiflexion","weak_great_toe_extension","weak_foot_eversion","weak_foot_inversion","weak_ankle_plantarflexion"];
const TERR = ["axillary_sensory","musculocutaneous_sensory","radial_sensory","median_sensory","ulnar_sensory",
  "femoral_sensory","obturator_sensory","lat_fem_cutaneous_sensory","sciatic_sensory","peroneal_sensory","tibial_sensory"];
for (const id of [...MOVES, ...TERR]) {
  ok(`finding ${id} exists`, isFinding(id));
  ok(`${id} CROSSES false`, CROSSES[id] === false);
}

// --- Task 2: localising policy — territories localise, movements do not ---
import { LOCALISING } from "../src/engine/score.js";
for (const id of ["median_sensory","peroneal_sensory","axillary_sensory","sensory_c7"]) ok(`${id} IS localising`, LOCALISING.has(id));
for (const id of ["weak_ankle_dorsiflexion","weak_thumb_abduction","weak_hip_abduction"]) ok(`${id} is NOT localising (shared movement)`, !LOCALISING.has(id));

// --- Task 3: roots re-pointed to movements ---
import { STRUCTURES } from "../src/model/structures.js";
const rootMoves = seg => STRUCTURES.filter(s => s.level === "root" && s.part === seg).map(s => s.produces);
ok("C7 root now produces elbow extension (not weak_c7)", rootMoves("c7").includes("weak_elbow_extension") && !rootMoves("c7").includes("weak_c7"));
ok("L5 root produces inversion + hip abduction + dorsiflexion (discriminators)",
   ["weak_foot_inversion","weak_hip_abduction","weak_ankle_dorsiflexion"].every(m => rootMoves("l5").includes(m)));
ok("L5 dermatome unchanged", rootMoves("l5").includes("sensory_l5"));

// --- Task 4: nerve sites & plexus composites ---
import { SITE_BY_ID } from "../src/model/sites.js";
for (const n of ["median_carpal_tunnel","ulnar_elbow","radial_spiral_groove","axillary","musculocutaneous","peroneal_common","tibial","femoral","superior_gluteal","long_thoracic","lat_fem_cutaneous"])
  ok(`left_nerve_${n} exists`, !!SITE_BY_ID[`left_nerve_${n}`]);
import { composePlexusSites } from "../src/model/sites.js";
{
  const P = Object.fromEntries(composePlexusSites().map(s => [s.id, s]));
  const producesAt = (site, f) => site && site.structures.some(id => STRUCTURES.find(s => s.id === id).produces === f);
  ok("upper_trunk (Erb) = C5 ∪ C6", producesAt(P.left_plexus_upper_trunk, "sensory_c5") && producesAt(P.left_plexus_upper_trunk, "sensory_c6"));
  ok("lower_trunk (Klumpke) = C8 ∪ T1", producesAt(P.left_plexus_lower_trunk, "sensory_c8") && producesAt(P.left_plexus_lower_trunk, "sensory_t1"));
  ok("upper_trunk does NOT include C7", !producesAt(P.left_plexus_upper_trunk, "sensory_c7"));
}

// --- Task 5: the flagship discriminators emerge ---
import { solve } from "../src/engine/inverse.js";
// L5 vs common peroneal — both foot drop; inversion + hip abduction present → L5, spared → peroneal.
{
  const peroneal = solve(new Set(["peroneal_sensory@left","weak_ankle_dorsiflexion@left","weak_foot_eversion@left"])).best;
  ok("foot drop + eversion + dorsal-foot sensory, inversion SPARED -> common peroneal",
     peroneal && peroneal.site.id === "left_nerve_peroneal_common");
  const l5 = solve(new Set(["sensory_l5@left","weak_ankle_dorsiflexion@left","weak_foot_inversion@left","weak_hip_abduction@left"])).best;
  ok("foot drop + inversion + hip abduction + L5 dermatome -> L5 root", l5 && l5.site.id === "left_root_l5");
}
// C8/T1 vs ulnar — thumb abduction (APB) present → root, spared → ulnar.
{
  const ulnar = solve(new Set(["ulnar_sensory@left","weak_finger_abduction@left"])).best;
  ok("intrinsic weakness + ulnar sensory, thumb abduction SPARED -> an ulnar nerve segment",
     ulnar && ulnar.site.level === "nerve" && /^ulnar_/.test(ulnar.site.part));
  const c8 = solve(new Set(["sensory_c8@left","weak_finger_abduction@left","weak_thumb_abduction@left","weak_finger_flexion@left"])).best;
  ok("intrinsics + thumb abduction (APB) + C8 dermatome -> C8 root", c8 && c8.site.id === "left_root_c8");
}
// C6 vs carpal tunnel (median).
{
  const ct = solve(new Set(["median_sensory@left","weak_thumb_abduction@left"])).best;
  ok("median territory + thumb abduction -> median carpal tunnel", ct && ct.site.id === "left_nerve_median_carpal_tunnel");
  const c6 = solve(new Set(["sensory_c6@left","weak_elbow_flexion@left","reflex_brachioradialis_loss@left"])).best;
  ok("C6 dermatome + elbow flexion + brachioradialis reflex -> C6 root", c6 && c6.site.id === "left_root_c6");
}
// Axillary vs C5 (the nerve the user flagged).
{
  const ax = solve(new Set(["axillary_sensory@left","weak_shoulder_abduction@left"])).best;
  ok("regimental-badge sensory + deltoid weakness -> axillary nerve", ax && ax.site.id === "left_nerve_axillary");
}

// --- Task 6: root vs plexus (Erb by parsimony) ---
{
  const erb = solve(new Set(["sensory_c5@left","sensory_c6@left","weak_shoulder_abduction@left","weak_elbow_flexion@left","reflex_biceps_loss@left","reflex_brachioradialis_loss@left"])).best;
  ok("C5 + C6 pattern -> upper_trunk (Erb), beating two separate roots", erb && erb.site.id === "left_plexus_upper_trunk");
}

// --- Task 7: pure-motor nerves (localise by parsimony) ---
{
  const wing = solve(new Set(["weak_scapular_stabilisation@left"])).best;
  ok("scapular winging -> long thoracic nerve", wing && wing.site.id === "left_nerve_long_thoracic");
  const glut = solve(new Set(["weak_hip_abduction@left"])).best;
  ok("isolated hip abduction weakness -> superior gluteal (beats L5 by parsimony)", glut && glut.site.id === "left_nerve_superior_gluteal");
  const mer = solve(new Set(["lat_fem_cutaneous_sensory@left"])).best;
  ok("pure lateral-thigh sensory -> lateral femoral cutaneous (meralgia)", mer && mer.site.id === "left_nerve_lat_fem_cutaneous");
}

// --- Task 8: phonebook ---
import { nameForSite } from "../src/data/syndromes.js";
{
  const name = set => nameForSite(solve(new Set(set)).best.site).name;
  ok("median names carpal tunnel / median nerve", /median|carpal/i.test(name(["median_sensory@left","weak_thumb_abduction@left"])));
  ok("common peroneal names the nerve", /peroneal|fibular/i.test(name(["peroneal_sensory@left","weak_ankle_dorsiflexion@left","weak_foot_eversion@left"])));
  ok("axillary names the nerve", /axillary/i.test(name(["axillary_sensory@left","weak_shoulder_abduction@left"])));
  ok("upper trunk names Erb", /erb|upper trunk/i.test(name(["sensory_c5@left","sensory_c6@left","weak_shoulder_abduction@left","weak_elbow_flexion@left","reflex_biceps_loss@left","reflex_brachioradialis_loss@left"])));
}

// ---- report ----
console.log("\nNeuroLocaliser — PNS PLEXUS & NAMED NERVES tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
