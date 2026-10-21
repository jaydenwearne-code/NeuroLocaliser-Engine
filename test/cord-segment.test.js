// cord-segment.test.js — WHERE along the cord (spinal cord fix, round 1; spec 2026-10-22-spinal-cord-fix-design.md).
// The cross-section says WHICH cord syndrome; the segment says WHERE along the cord, and a stated sensory level now
// counts as evidence of where. Each section pins one approved row of the round-1 ruling table.
// Run: node test/cord-segment.test.js
import { solve, candidateSites, knownNegatives } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { prevalenceOf, UNCOMMON, RARE } from "../src/model/prevalence.js";

let pass = 0, fail = 0;
function ok(label, cond, detail = "") { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}${cond ? "" : "  " + detail}`); }
const L = s => new Set(s.split(/\s+/).filter(Boolean));
const B = f => `${f}@left ${f}@right`;
const site = id => candidateSites().find(s => s.id === id);
const first = r => r.display[0]?.site;
const ids = r => r.display.map(c => c.site.id);

// ---- Row 4: prevalence — the bilateral cord patterns take the cord's own tier; the conus is rare ----
ok("the bilateral anterior cord is UNCOMMON (the cord's own tier), no longer RARE", prevalenceOf(site("bilateral_cord_anterior")) === UNCOMMON);
ok("…and so are the posterior and the central cord", prevalenceOf(site("bilateral_cord_posterior")) === UNCOMMON && prevalenceOf(site("bilateral_cord_central")) === UNCOMMON);
ok("the transverse cord stays RARE (its own RARE_PARTS entry)", prevalenceOf(site("bilateral_cord_transverse")) === RARE);
ok("the conus is RARE", prevalenceOf(site("conus_medullaris")) === RARE);
ok("the cauda is unchanged (UNCOMMON)", prevalenceOf(site("cauda_equina")) === UNCOMMON);
ok("other bilateral sites stay RARE (locked-in)", prevalenceOf(site("locked_in")) === RARE);

// ---- report ----
console.log(`\ncord segment: ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
