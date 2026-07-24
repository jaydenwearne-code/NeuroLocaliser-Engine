// frontal.test.js — frontal-lobe completeness by region. Adds the motor-frontal tier (premotor apraxia,
// SMA syndrome / alien limb) and the paracentral / superomedial frontal (cortical urinary incontinence +
// frontal gait apraxia), alongside the existing prefrontal trio (DLPFC / medial PFC / orbitofrontal).
// Run: node test/frontal.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { SITE_BY_ID } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0; const log = [];
function ok(l, c) { log.push({ l, ok: !!c }); c ? pass++ : fail++; }
const idOf = best => (best ? best.site.id : "null");
const nameOf = best => (best ? nameForSite(best.site).name : "");

// Vocabulary
for (const id of ["limb_apraxia", "alien_limb", "urinary_incontinence", "gait_apraxia"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} @none`, NON_LATERALISED.has(id));
  ok(`${id} CROSSES false`, CROSSES[id] === false);
  ok(`${id} LOCALISING`, LOCALISING.has(id));
}

// Forward: each new region emits its finding(s) @none
{
  ok("premotor -> limb_apraxia@none", expectedFindings(SITE_BY_ID.left_cortex_premotor).has("limb_apraxia@none"));
  ok("sma -> alien_limb@none", expectedFindings(SITE_BY_ID.left_cortex_sma).has("alien_limb@none"));
  const para = expectedFindings(SITE_BY_ID.left_cortex_paracentral);
  ok("paracentral -> urinary_incontinence@none + gait_apraxia@none",
     para.has("urinary_incontinence@none") && para.has("gait_apraxia@none"));
}

// Emergence — each region localises
{
  const b = solve(new Set(["limb_apraxia@none"])).best;
  ok("limb apraxia -> premotor", idOf(b) === "left_cortex_premotor" || idOf(b) === "right_cortex_premotor");
  ok("premotor names apraxia/premotor", /apraxia|premotor/i.test(nameOf(b)));
}
{
  const b = solve(new Set(["alien_limb@none"])).best;
  ok("alien limb -> SMA", idOf(b).includes("cortex_sma"));
  ok("SMA names SMA / supplementary", /sma|supplementary/i.test(nameOf(b)));
}
{
  const b = solve(new Set(["urinary_incontinence@none"])).best;
  ok("urinary incontinence -> paracentral", idOf(b).includes("cortex_paracentral"));
  ok("paracentral names bladder / paracentral / superomedial", /bladder|paracentral|superomedial|incontinen/i.test(nameOf(b)));
}
{
  const b = solve(new Set(["gait_apraxia@none"])).best;
  ok("gait apraxia -> paracentral", idOf(b).includes("cortex_paracentral"));
}
{
  const b = solve(new Set(["urinary_incontinence@none", "gait_apraxia@none"])).best;
  ok("bladder + gait -> paracentral (parasagittal)", idOf(b).includes("cortex_paracentral"));
}

// Regression: the pre-existing prefrontal trio still resolves to its region
{
  ok("executive_dysfunction still -> DLPFC", idOf(solve(new Set(["executive_dysfunction@none"])).best).includes("cortex_dlpfc"));
  ok("abulia still -> medial PFC", idOf(solve(new Set(["abulia@none"])).best).includes("cortex_medial_pfc"));
  ok("disinhibition still -> orbitofrontal", idOf(solve(new Set(["disinhibition@none"])).best).includes("cortex_orbitofrontal"));
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.l}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
