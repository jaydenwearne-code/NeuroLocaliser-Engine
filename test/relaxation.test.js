// relaxation.test.js — "slight relaxation of parameters" before declaring multifocal.
// DROP-1, NON-LOCALISING ONLY: if no single site explains every entered finding, retry allowing exactly ONE
// NON-localising finding to go unexplained; if a single site then explains all the rest, surface it as a
// near-fit that names the odd finding. A localising sign is never relaxed away (too specific to ignore).
import { solve, nearFit } from "../src/engine/inverse.js";
import { LOCALISING } from "../src/engine/score.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

// A total right-MCA picture (all explained by right_cortex_mca) + ONE stray NON-localising finding
// (dorsal_sensory — posterior columns; the MCA does not emit it, and it is not a localiser).
const set = new Set(["weak_arm@left","weak_leg@left","facial_weakness@left","forehead_spared@left",
  "neglect@left","cortical_sensory_arm@left","dorsal_sensory@left"]);

ok("dorsal_sensory is genuinely non-localising (droppable)", !LOCALISING.has("dorsal_sensory"));

const nf = nearFit(set, { dominantSide: "left" });
ok("nearFit surfaces a single site explaining all-but-one", !!nf && !!nf.site);
ok("nearFit names the stray NON-localising finding as missing", nf && nf.missing === "dorsal_sensory@left");
ok("nearFit site is the total right MCA", nf && nf.site.id === "right_cortex_mca");

// A localising stray is NOT relaxed away: swap the stray for a localising finding no MCA site explains
// (face_pain_loss — spinal trigeminal, ipsilateral, LOCALISING) → no near-fit (can't drop a localiser).
const setLoc = new Set(["weak_arm@left","weak_leg@left","facial_weakness@left","forehead_spared@left",
  "neglect@left","cortical_sensory_arm@left","face_pain_loss@left"]);
ok("face_pain_loss IS localising", LOCALISING.has("face_pain_loss"));
ok("no near-fit when the odd finding is a localising sign", nearFit(setLoc, { dominantSide: "left" }) === null);

// When a single site already explains everything, nearFit returns null (no relaxation needed).
const setFull = new Set(["weak_arm@left","weak_leg@left","facial_weakness@left","forehead_spared@left","neglect@left","cortical_sensory_arm@left"]);
ok("nearFit is null when a single site already explains all", nearFit(setFull, { dominantSide: "left" }) === null);

// solve() exposes nearFit
ok("solve() result carries a nearFit field", "nearFit" in solve(set, { dominantSide: "left" }));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
