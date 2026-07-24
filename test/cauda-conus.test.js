// cauda-conus.test.js — the below-cord region: cauda equina vs conus medullaris.
// Both share saddle anaesthesia + sphincter dysfunction; the discriminator is UMN-vs-LMN —
// pure LMN (+ radicular pain) → cauda equina; UMN signs present → conus. Findings are midline.
// Run: node test/cauda-conus.test.js

import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

const ces = ["lmn_weakness@midline","saddle_anaesthesia@midline","sphincter_dysfunction@midline","radicular_pain@midline"];
const conus = ["umn_signs@midline","saddle_anaesthesia@midline","sphincter_dysfunction@midline"];

// 1. Cauda equina emergence
{
  const { best } = solve(new Set(ces));
  ok("CES -> cauda_equina", best && best.site.id === "cauda_equina");
  ok("  named Cauda equina", best && /cauda equina/i.test(nameForSite(best.site).name));
}
// 2. Conus emergence
{
  const { best } = solve(new Set(conus));
  ok("conus -> conus_medullaris", best && best.site.id === "conus_medullaris");
  ok("  named Conus", best && /conus/i.test(nameForSite(best.site).name));
}
// 3. Discrimination — shared saddle + sphincter don't collapse them
{
  const cesBest = solve(new Set(ces)).best;
  const conusBest = solve(new Set(conus)).best;
  ok("CES is not conus", cesBest && cesBest.site.id !== "conus_medullaris");
  ok("conus is not cauda", conusBest && conusBest.site.id !== "cauda_equina");
}

// 4. Below-cord level note — a sacral/saddle picture, not a single below-the-level sensory level.
{
  const { level } = solve(new Set(ces));
  ok("CES level does not apply", level.applies === false);
  ok("  note flags below-cord / saddle", /below the cord|saddle/i.test(level.note));
}

// ---- report ----
console.log("\nNeuroLocaliser — CAUDA EQUINA / CONUS tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
