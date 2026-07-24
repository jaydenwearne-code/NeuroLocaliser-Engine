// pns.test.js — the sensory-bearing peripheral nervous system, first slice: nerve roots
// (radiculopathy) and length-dependent polyneuropathy. Two DIFFERENT mechanisms, each the right one:
//   * roots are finding-driven SITES (the segment emerges from dermatome/myotome/reflex, like cortical
//     subregions) — a dermatome/myotome MISMATCH surfaces as multifocal, no special machinery;
//   * length-dependence is an ORTHOGONAL AXIS (nerveLength.js, the twin of levels.js): stocking-glove
//     EMERGES because the fingertips share an axon-length rank with the knees.
// Also does the flagged demotion: lmn_weakness → non-localising (sensory findings localise instead).
// Run: node test/pns.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// --- Task 1: vocabulary (27 new findings) ---
const SENSORY = ["sensory_c5","sensory_c6","sensory_c7","sensory_c8","sensory_t1","sensory_l2","sensory_l3","sensory_l4","sensory_l5","sensory_s1"];
// myotomes are now MOVEMENT findings (the plexus/nerve increment, Approach A) — shared by roots + nerves
const MYO = ["weak_elbow_extension","weak_ankle_dorsiflexion","weak_foot_inversion","weak_hip_abduction",
  "weak_ankle_plantarflexion","weak_shoulder_abduction","weak_knee_extension","weak_finger_abduction"];
const REFLEX = ["reflex_biceps_loss","reflex_brachioradialis_loss","reflex_triceps_loss","reflex_knee_loss","reflex_ankle_loss"];
const POLY = ["distal_sensory_loss","distal_motor_weakness"];
for (const id of [...SENSORY, ...MYO, ...REFLEX, ...POLY]) {
  ok(`finding ${id} exists`, isFinding(id));
  ok(`${id} is ipsilateral/bilateral (CROSSES false)`, CROSSES[id] === false);
}
ok("radicular_pain reused (still exists)", isFinding("radicular_pain"));

// --- Task 2: localising policy INCLUDING the lmn_weakness demotion ---
import { LOCALISING } from "../src/engine/score.js";
for (const id of ["sensory_c7","reflex_triceps_loss","distal_sensory_loss"])
  ok(`${id} IS localising`, LOCALISING.has(id));
ok("movements are NOT localising (shared roots/nerves — Approach A)", !LOCALISING.has("weak_elbow_extension"));
ok("lmn_weakness is NO LONGER localising (demoted — sensory findings localise)", !LOCALISING.has("lmn_weakness"));
ok("radicular_pain is NOT localising (shared 'it's a root' sign, not segment-specific)", !LOCALISING.has("radicular_pain"));

// --- Task 3: structure catalogue ---
import { STRUCTURES, STRUCTURE_BY_ID } from "../src/model/structures.js";
const rootOf = seg => STRUCTURES.filter(s => s.level === "root" && s.part === seg).map(s => s.produces).sort();
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
ok("C7 root -> C7 dermatome + triceps reflex + elbow-extension movement + pain",
   ["sensory_c7","reflex_triceps_loss","weak_elbow_extension","radicular_pain"].every(f => rootOf("c7").includes(f)));
ok("C8 root -> C8 dermatome + finger movements + pain (no classic reflex)",
   rootOf("c8").includes("sensory_c8") && rootOf("c8").includes("weak_finger_flexion") && !rootOf("c8").some(f => /^reflex/.test(f)));
ok("S1 root -> S1 dermatome + ankle reflex + plantarflexion + pain",
   ["sensory_s1","reflex_ankle_loss","weak_ankle_plantarflexion","radicular_pain"].every(f => rootOf("s1").includes(f)));
ok("knee reflex is shared by L3 AND L4", rootOf("l3").includes("reflex_knee_loss") && rootOf("l4").includes("reflex_knee_loss"));
ok("polyneuropathy -> distal sensory + motor + hypotonia + wasting (generalised LMN companions)",
   eq(STRUCTURES.filter(s => s.level === "polyneuropathy").map(s => s.produces).sort(), ["distal_motor_weakness","distal_sensory_loss","hypotonia","wasting"].sort()));
{
  const pnsStructs = STRUCTURES.filter(s => s.level === "root" || s.level === "polyneuropathy");
  ok("no PNS structure sets a crosses override / gate",
     pnsStructs.every(s => !Object.prototype.hasOwnProperty.call(s, "crosses") && !s.hemisphere && !s.bilateralOnly));
}

// --- Task 4: sites & composer ---
import { SITE_BY_ID } from "../src/model/sites.js";
ok("left_root_c7 exists", !!SITE_BY_ID.left_root_c7);
ok("right_root_s1 exists", !!SITE_BY_ID.right_root_s1);
import { composePolyneuropathySites } from "../src/model/sites.js";
const POLYSITE = composePolyneuropathySites()[0];
ok("polyneuropathy site is bilateral", POLYSITE && POLYSITE.side === "bilateral" && POLYSITE.level === "polyneuropathy");

// --- Task 5: forward model — roots ipsilateral, poly bilateral ---
import { expectedFindings } from "../src/engine/forward.js";
{
  const c7 = expectedFindings(SITE_BY_ID.left_root_c7);
  ok("left C7 -> sensory_c7@left (ipsi)", c7.has("sensory_c7@left"));
  ok("left C7 -> weak_elbow_extension@left", c7.has("weak_elbow_extension@left"));
  ok("left C7 -> reflex_triceps_loss@left", c7.has("reflex_triceps_loss@left"));
  ok("left C7 does NOT emit on the right", !c7.has("sensory_c7@right"));
  const poly = expectedFindings(POLYSITE);
  ok("polyneuropathy -> distal_sensory_loss both sides", poly.has("distal_sensory_loss@left") && poly.has("distal_sensory_loss@right"));
}

// --- Task 6: root emergence + mismatch ---
import { solve } from "../src/engine/inverse.js";
{
  const c7 = solve(new Set(["sensory_c7@left","weak_elbow_extension@left","reflex_triceps_loss@left"])).best;
  ok("C7 picture -> root_c7", c7 && c7.site.id === "left_root_c7");
  const s1 = solve(new Set(["sensory_s1@left","weak_ankle_plantarflexion@left","reflex_ankle_loss@left"])).best;
  ok("S1 picture -> root_s1", s1 && s1.site.id === "left_root_s1");
  const l5 = solve(new Set(["sensory_l5@left","weak_ankle_dorsiflexion@left","weak_foot_inversion@left","weak_hip_abduction@left"])).best;
  ok("L5 picture (dermatome + inversion + hip abduction) -> root_l5", l5 && l5.site.id === "left_root_l5");
}
// A two-dermatome pattern that is NOT one root or one trunk (C5 + C7 — the upper trunk is C5-6, not C5+C7)
// surfaces as the multifocal hypothesis (two roots), no special machinery.
{
  const res = solve(new Set(["sensory_c5@left","sensory_c7@left"]));
  ok("C5 + C7 dermatomes are NOT one root/trunk", !res.singleExplainsAll);
  ok("...they surface as a multifocal (two-root) hypothesis", res.multi && res.multi.sites.length === 2);
}

// --- Task 7: root vs polyneuropathy ---
{
  const root = solve(new Set(["sensory_c7@left","weak_elbow_extension@left","radicular_pain@left"])).best;
  ok("unilateral dermatomal + radicular -> a root site", root && root.site.level === "root");
  const poly = solve(new Set(["distal_sensory_loss@left","distal_sensory_loss@right","distal_motor_weakness@left","distal_motor_weakness@right"])).best;
  ok("bilateral distal symmetric -> polyneuropathy", poly && poly.site.level === "polyneuropathy");
}

// --- Task 8: nerveLength.js — the new orthogonal axis (stocking-glove emerges) ---
import { LENGTH_RANK, describeReach, isLengthDependent } from "../src/model/nerveLength.js";
ok("fingertips share an axon-length rank with the knees", LENGTH_RANK.fingertips === LENGTH_RANK.knees);
ok("toes outrank (are longer than) the hands", LENGTH_RANK.toes > LENGTH_RANK.hands);
{
  const ankles = describeReach("ankles");
  ok("reach=ankles → feet involved, NO glove yet", ankles.involved.includes("feet") && ankles.glove === false);
  const knees = describeReach("knees");
  ok("reach=knees → the glove APPEARS (fingertips recruited at equal rank)", knees.glove === true && knees.involved.includes("fingertips"));
}
ok("hands-without-feet is NOT length-dependent (feet are longer, must go first)",
   isLengthDependent(["hands"]) === false);
ok("feet-then-mid_calf IS a consistent length-dependent pattern", isLengthDependent(["toes","feet","ankles","mid_calf"]) === true);

// --- Task 9: length annotation through solve() ---
{
  const polyObs = new Set(["distal_sensory_loss@left","distal_sensory_loss@right","distal_motor_weakness@left","distal_motor_weakness@right"]);
  const atKnees = solve(polyObs, { distalReach: "knees" });
  ok("solve echoes a length annotation that applies for a polyneuropathy", atKnees.length && atKnees.length.applies === true);
  ok("...reach=knees → glove present", atKnees.length.glove === true);
  const atAnkles = solve(polyObs, { distalReach: "ankles" });
  ok("...reach=ankles → glove absent", atAnkles.length.glove === false);
  const rootRes = solve(new Set(["sensory_c7@left","weak_elbow_extension@left"]), { distalReach: "knees" });
  ok("length annotation does NOT apply when the winner is a root", rootRes.length && rootRes.length.applies === false);
}

// --- Task 10: laterality mirror ---
{
  const r = solve(new Set(["sensory_c7@right","weak_elbow_extension@right","reflex_triceps_loss@right"])).best;
  ok("right-sided C7 -> right_root_c7", r && r.site.id === "right_root_c7");
}

// --- Task 11: phonebook ---
import { nameForSite } from "../src/data/syndromes.js";
{
  const c7 = solve(new Set(["sensory_c7@left","weak_elbow_extension@left","reflex_triceps_loss@left"])).best;
  ok("root_c7 names a C7 radiculopathy", /c7 radiculopath/i.test(nameForSite(c7.site).name));
  const poly = solve(new Set(["distal_sensory_loss@left","distal_sensory_loss@right","distal_motor_weakness@left","distal_motor_weakness@right"])).best;
  ok("polyneuropathy names the stocking-glove neuropathy", /polyneuropathy|stocking/i.test(nameForSite(poly.site).name));
}

// ---- report ----
console.log("\nNeuroLocaliser — PNS (roots & polyneuropathy) tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
