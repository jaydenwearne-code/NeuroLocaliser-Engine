// content-gaps.test.js — the content-gap fixes (owner-ruled 2026-11-01; spec
// docs/superpowers/specs/2026-11-01-content-gaps-design.md). Pins each approved row, and the guards the spec's §6 lists
// as unchanged by design. Run: node test/content-gaps.test.js
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { unifyingDiagnoses } from "../src/engine/multifocal.js";
import { enteredToken } from "../src/engine/families.js";
import { FINDINGS } from "../src/model/findings.js";
import { nameForSite } from "../src/data/syndromes.js";
import { answerFor } from "../app/answer.js";

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { cond ? pass++ : fail++; console.log((cond ? "PASS  " : "FAIL  ") + label + (cond ? "" : `  ${detail}`)); };
const T = s => new Set(s.split(/\s+/).filter(Boolean));
const SITE = Object.fromEntries(candidateSites().map(s => [s.id, s]));
const predicts = (id, tok, opts = {}) => expectedFindings(SITE[id], opts).has(tok);
const ids = r => r.display.map(c => c.site.id);
const first = (toks, opts = {}) => ids(solve(T(toks), opts))[0];

// ---- A. Roots, plexus and nerves (rows 1–4) ----
const ULNAR_ELBOW = "ulnar_sensory@left ulnar_dorsal_sensory@left weak_finger_abduction@left ulnar_claw@left";
ok("row 1: the ulnar nerve at the elbow gives the claw", predicts("left_nerve_ulnar_elbow", "ulnar_claw@left"));
{ const r = solve(T(ULNAR_ELBOW));
  ok("row 1: claw + dorsal-hand sensory loss → the elbow, one lesion", ids(r)[0] === "left_nerve_ulnar_elbow" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
ok("row 1 guard: Guyon (dorsal sensation not entered) still leads with the wrist",
   first("ulnar_sensory@left weak_finger_abduction@left ulnar_claw@left") === "left_nerve_ulnar_wrist");
ok("row 2: the C6 root gives the biceps jerk (C5/6)", predicts("left_root_c6", "reflex_biceps_loss@left"));
ok("row 2: C6 radiculopathy → the C6 root first",
   first("sensory_c6@left reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left radicular_pain@left") === "left_root_c6");
ok("row 2 guard: C5 radiculopathy still leads with the C5 root",
   first("sensory_c5@left weak_shoulder_abduction@left weak_elbow_flexion@left reflex_biceps_loss@left radicular_pain@left") === "left_root_c5");
ok("row 3: the L4 root gives the adductors (obturator, L2–4)", predicts("left_root_l4", "weak_hip_adduction@left"));
ok("row 3: knee extension + adduction + knee jerk + L4 dermatome → the L4 root first (R1 #4)",
   first("weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left sensory_l4@left") === "left_root_l4");
ok("row 3 guard: L3 radiculopathy still leads with the L3 root",
   first("sensory_l3@left weak_knee_extension@left weak_hip_adduction@left reflex_knee_loss@left") === "left_root_l3");
ok("row 4: the upper trunk carries the axillary sensory row (deltoid patch)", predicts("left_plexus_upper_trunk", "axillary_sensory@left"));
ok("row 5 deferred: the upper trunk does not yet carry musculocutaneous sensation (plexus round)",
   !predicts("left_plexus_upper_trunk", "musculocutaneous_sensory@left"));
{ const r = solve(T("weak_shoulder_abduction@left weak_elbow_flexion@left weak_shoulder_external_rotation@left reflex_biceps_loss@left axillary_sensory@left"));
  ok("row 4: Erb with deltoid-patch numbness → the upper trunk, one lesion", ids(r)[0] === "left_plexus_upper_trunk" && r.multi === null, `${ids(r)[0]} multi=${!!r.multi}`); }
ok("row 4 guard: an axillary neuropathy still leads with the axillary nerve",
   first("axillary_sensory@left weak_shoulder_abduction@left") === "left_nerve_axillary");

// ---- report ----
console.log(`\nNeuroLocaliser — content-gap fixes (round 1)\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
