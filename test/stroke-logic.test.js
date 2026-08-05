// stroke-logic.test.js — pure code-stroke logic (DOM-free, testable in node).
import { nihssTotal, nihssToFindings } from "../app/stroke-logic.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

// nihssTotal sums all components, treating missing as 0
ok("empty NIHSS totals 0", nihssTotal({}) === 0);
ok("sums components incl. both arms/legs", nihssTotal({ gaze:2, armR:4, legR:4, facial:2, language:2 }) === 14);

// nihssToFindings — a right-hemiparetic aphasic pattern (dominant left) → left-hemisphere tokens
const f = nihssToFindings({ facial:2, armR:3, legR:3, gaze:2, visual:2, sensory:1, language:2, dysarthria:1, extinction:0 }, "left");
ok("emits contralateral (right) arm/leg weakness", f.has("weak_arm@right") && f.has("weak_leg@right"));
ok("emits right facial weakness", f.has("facial_weakness@right"));
ok("gaze deviates toward the lesion (left, opposite the deficit)", f.has("gaze_deviation@left"));
ok("emits a right field defect", f.has("homonymous_hemianopia@right"));
ok("emits aphasia tokens (non-lateralised)", f.has("speech_nonfluent@none") && f.has("comprehension_impaired@none"));
ok("emits dysarthria", f.has("dysarthria@none"));
ok("emits cortical sensory on the deficit side", f.has("cortical_sensory_arm@right"));
ok("no extinction token when score 0", ![...f].some(t => t.startsWith("neglect")));

// left-limb weakness → left-side tokens, gaze to the right
const g = nihssToFindings({ armL:4, legL:2, extinction:2 }, "left");
ok("left weakness emits left tokens", g.has("weak_arm@left") && g.has("weak_leg@left"));
ok("extinction emits neglect", g.has("neglect@none"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
