// level-axis.test.js — the sensory level in the app (spinal cord fix, round 1, rows 9–10): WHEN the field shows and
// WHAT the level line says. Pure — app/level-axis.js has no DOM. Run: node test/level-axis.test.js
import { CORD_AXIS_FINDINGS, showLevelField, levelLine } from "../app/level-axis.js";
import { FINDINGS } from "../src/model/findings.js";
import { solve } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
function ok(label, cond, detail = "") { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}${cond ? "" : "  " + detail}`); }
const L = s => new Set(s.split(/\s+/).filter(Boolean));
const B = f => `${f}@left ${f}@right`;
const show = toks => showLevelField(L(toks), solve(L(toks)).display);
const r = (toks, lvl) => solve(L(toks), lvl ? { sensoryLevel: lvl } : {});

// ---- when the field shows (row 10, as refined by the owner: a cord FIRST answer) ----
ok("every trigger id is a real finding (dorsal_column, sensory_level, glove_stocking are gone)", [...CORD_AXIS_FINDINGS].every(f => FINDINGS[f]));
ok("a pure dorsal-column picture shows the field", show(B("dorsal_sensory")));
ok("a spastic paraparesis shows the field (the cord is the answer)", show(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`));
ok("a single weak arm does not (the 2026-08-16 rule holds)", !show("weak_arm@right"));
ok("a hemiparesis does not", !show("weak_arm@right weak_leg@right"));
ok("no findings: hidden", !showLevelField(new Set(), []));

// ---- what the level line says (row 9) ----
ok("no level typed and a non-cord answer → no line", levelLine(r("weak_arm@right weak_leg@right facial_weakness@right forehead_spared@right").level, "x") === null);
const p14 = r(`${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`, "T10");
ok("a level typed under a cord answer → the engine's note", /at or just above T10/.test(levelLine(p14.level, "x") || ""));
const ca = r("saddle_anaesthesia@midline sphincter_dysfunction@midline reflex_ankle_loss@left reflex_ankle_loss@right lmn_weakness@left radicular_pain@left", "T10");
ok("a level typed under a cauda answer → the contradiction, naming the place",
   levelLine(ca.level, "the cauda equina") === "a sensory level at T10 needs a cord lesion at or above T10; the cauda equina cannot produce one — re-check the level, or consider a second lesion");
const p1 = r(`reflex_biceps_loss@left reflex_brachioradialis_loss@left weak_elbow_flexion@left ${B("hyperreflexia")} ${B("babinski")} ${B("spasticity")}`);
ok("no level typed, an at-level reading → its segment", /C5–6/.test(levelLine(p1.level, "x") || ""));
ok("an unrecognised level typed under a cord answer → the 'unrecognised' note", /unrecognised/.test(levelLine(r(B("dorsal_sensory"), "Z9").level, "x") || ""));

console.log(`\nlevel axis (app): ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
