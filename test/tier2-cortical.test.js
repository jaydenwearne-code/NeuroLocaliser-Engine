// tier2-cortical.test.js — cortical refinement (Tier 2, increment 5): the precentral HAND-KNOB.
// Isolated cortical hand weakness that mimics a peripheral (ulnar/radial/C8) lesion but is UMN. Field-defect
// geometry beyond quadrant/hemi (altitudinal, scotoma) is DEFERRED — the existing hemi/quadrant/macular/
// bitemporal/cortical-blindness coverage is adequate.
// Run: node test/tier2-cortical.test.js
import { CROSSES, isFinding } from "../src/model/findings.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const S = (...t) => new Set(t);
const win = set => solve(set).best?.site?.id ?? null;
const producedAt = (lvl, part) => STRUCTURES.filter(s => s.level === lvl && s.part === part).map(s => s.produces);

ok("weak_hand exists", isFinding("weak_hand"));
ok("weak_hand crosses (contralateral cortical)", CROSSES["weak_hand"] === true);
ok("hand_knob site exists", !!SITE_BY_ID["left_cortex_hand_knob"]);
ok("hand_knob -> weak_hand + babinski (UMN)", producedAt("cortex", "hand_knob").includes("weak_hand") && producedAt("cortex", "hand_knob").includes("babinski"));
// isolated cortical hand weakness localises to the hand knob (right body -> left cortex)
ok("isolated hand weakness -> cortical hand knob", win(S("weak_hand@right")) === "left_cortex_hand_knob");
ok("hand weakness + extensor plantar -> hand knob", win(S("weak_hand@right", "babinski@right")) === "left_cortex_hand_knob");
ok("hand-knob phonebook names the pseudo-peripheral pearl",
   /hand.knob|cortical hand|pseudo/i.test((nameForSite(SITE_BY_ID["left_cortex_hand_knob"]).name || "") + (nameForSite(SITE_BY_ID["left_cortex_hand_knob"]).note || "")));

console.log("\nNeuroLocaliser — TIER 2 · CORTICAL HAND-KNOB\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
