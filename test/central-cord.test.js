// central-cord.test.js — the central cord / syringomyelia (intramedullary) picture.
// A syrinx strikes the decussating spinothalamic fibres in the anterior white commissure:
// bilateral, SUSPENDED (cape-like) dissociated pain/temperature loss, dorsal columns preserved,
// sacral sparing. The suspended distribution is a distinct localising finding.
// Run: node test/central-cord.test.js

import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
function eq(label, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want);
  log.push({ label, ok: good, got, want });
  good ? pass++ : fail++;
}

const central = ["suspended_sensory@left", "suspended_sensory@right"];

// 1. Emergence — suspended dissociated loss localises to the central cord.
{
  const { best } = solve(new Set(central));
  ok("central -> bilateral_cord_central", best && best.site.id === "bilateral_cord_central");
  ok("  named Central cord", best && /central cord/i.test(nameForSite(best.site).name));
}
// 2. Dissociation guard — not confused with anterior cord (no weakness predicted).
{
  const { best } = solve(new Set(central));
  ok("central is not anterior cord", best && best.site.id !== "bilateral_cord_anterior");
}

// 3. Suspended level note — a cape has no single below-the-level sensory level.
{
  const { level } = solve(new Set(central));
  ok("central level does not apply", level.applies === false);
  ok("  note flags suspended", /suspended/.test(level.note));
}
// 4. Suspended note carries a supplied level as the cape's approximate centre.
{
  const { level } = solve(new Set(central), { sensoryLevel: "C6" });
  ok("central+C6 still suspended", level.applies === false && /suspended/.test(level.note));
  eq("  segment carried", level.segment, "C6");
  eq("  region carried", level.region, "cervical");
}

// ---- report ----
console.log("\nNeuroLocaliser — CENTRAL CORD / syrinx tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}` + (r.ok ? "" : `  (got ${JSON.stringify(r.got)}, want ${JSON.stringify(r.want)})`));
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
