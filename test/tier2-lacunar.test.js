// tier2-lacunar.test.js — corona radiata (Tier 2, increment 3). Completes the corticospinal white-matter
// chain (cortex → corona radiata → internal capsule → basis pontis). A pure-motor lacune here is clinically
// indistinguishable from a capsular one (it TIES the internal capsule), so this is a completeness/naming add;
// the Tier-1 basis-pontis increment already homed ataxic hemiparesis and dysarthria-clumsy-hand.
// Run: node test/tier2-lacunar.test.js
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const S = (...t) => new Set(t);
const win = set => solve(set).best?.site?.id ?? null;
const producedAt = (lvl, part) => STRUCTURES.filter(s => s.level === lvl && s.part === part).map(s => s.produces).sort();
const eq = (a, b) => JSON.stringify([...(a || [])].sort()) === JSON.stringify([...(b || [])].sort());

ok("corona radiata site exists", !!SITE_BY_ID["left_subcortex_corona_radiata"]);
ok("corona radiata = pure-motor set (mirrors internal capsule)",
   eq(producedAt("subcortex", "corona_radiata"), ["weak_arm", "weak_leg", "facial_weakness","forehead_spared", "babinski", "hoffmann", "spasticity"]));
// pure-motor lacune localises to a pure-motor white-matter/capsular site (IC or corona radiata — they tie; either is correct)
{
  const w = win(S("weak_arm@right", "weak_leg@right", "facial_weakness@right","forehead_spared@right", "babinski@right", "hoffmann@right", "spasticity@right"));
  ok("pure motor hemiparesis -> internal capsule OR corona radiata",
     w === "left_subcortex_internal_capsule" || w === "left_subcortex_corona_radiata");
}
ok("corona radiata phonebook names the lacunar family",
   /corona radiata|lacun/i.test((nameForSite(SITE_BY_ID["left_subcortex_corona_radiata"]).name || "") + (nameForSite(SITE_BY_ID["left_subcortex_corona_radiata"]).note || "")));

console.log("\nNeuroLocaliser — TIER 2 · CORONA RADIATA (lacunar / white-matter completion)\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
