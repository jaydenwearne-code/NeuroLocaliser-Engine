// guillain-mollaret.test.js — the dentato-rubro-olivary loop. palatal_tremor is SHARED: isolated ->
// broad triangle (HOD); + rubral tremor -> red-nucleus corner; + cerebellar signs -> dentate corner.
// Run: node test/guillain-mollaret.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { composeGuillainMollaretSites } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0; const log = [];
function ok(l, c) { log.push({ l, ok: !!c }); c ? pass++ : fail++; }

for (const id of ["palatal_tremor", "nystagmus_pendular"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} @none`, NON_LATERALISED.has(id));
  ok(`${id} CROSSES false`, CROSSES[id] === false);
  ok(`${id} LOCALISING`, LOCALISING.has(id));
}

const GM = Object.fromEntries(composeGuillainMollaretSites().map(s => [s.id, s]));
ok("triangle site exists", !!GM.guillain_mollaret_triangle);
ok("rubral corner exists", !!GM.gm_rubral_left);
ok("dentate corner exists", !!GM.gm_dentate_left);

// Forward
{
  const tri = expectedFindings(GM.guillain_mollaret_triangle);
  ok("triangle -> palatal_tremor@none + nystagmus_pendular@none",
     tri.has("palatal_tremor@none") && tri.has("nystagmus_pendular@none"));
  const rub = expectedFindings(GM.gm_rubral_left);
  ok("gm_rubral_left -> tremor_rubral@right (contra) + palatal_tremor@none",
     rub.has("tremor_rubral@right") && rub.has("palatal_tremor@none"));
  const den = expectedFindings(GM.gm_dentate_left);
  ok("gm_dentate_left -> dysmetria@left (ipsi) + palatal_tremor@none",
     den.has("dysmetria@left") && den.has("palatal_tremor@none"));
}

// Emergence
{
  const { best } = solve(new Set(["palatal_tremor@none"]));
  ok("isolated palatal -> triangle (broad default)", best && best.site.id === "guillain_mollaret_triangle");
  ok("triangle names Guillain-Mollaret / palatal", best && /guillain|mollaret|palatal/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["palatal_tremor@none", "nystagmus_pendular@none"]));
  ok("oculopalatal -> triangle", best && best.site.id === "guillain_mollaret_triangle");
}
{
  const { best } = solve(new Set(["palatal_tremor@none", "tremor_rubral@right"]));
  ok("palatal + rubral -> gm_rubral_left (rubral corner)", best && best.site.id === "gm_rubral_left");
  ok("rubral corner names rubral", best && /rubral|red[- ]?nucleus/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["palatal_tremor@none", "dysmetria@left"]));
  ok("palatal + cerebellar -> gm_dentate_left (dentate corner)", best && best.site.id === "gm_dentate_left");
  ok("dentate corner names dentate/cerebellar", best && /dentate|cerebell/i.test(nameForSite(best.site).name));
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.l}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
