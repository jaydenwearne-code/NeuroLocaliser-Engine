// cerebellum.test.js — the cerebellum as an ORGAN: hemisphere (ipsilateral appendicular signs), vermis
// (midline axial signs), flocculonodular lobe (vestibulocerebellar), and a diffuse pancerebellar
// composite. Until now the cerebellum was only its brainstem peduncles (SCP/MCP/ICP → limb_ataxia).
// NO new solver mechanism: appendicular = ipsilateral (crosses:false, like limb_ataxia); axial =
// NON_LATERALISED (@none); vermis/flocculonodular = midline composer (cauda/conus pattern);
// pancerebellar = bilateral composite (basal-ganglia pattern).
// Run: node test/cerebellum.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID, composeCerebellumMidlineSites, composeCerebellumPancerebellarSites } from "../src/model/sites.js";
import { expectedFindings } from "../src/engine/forward.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- Task 1: vocabulary ---
const APPENDICULAR = ["dysmetria", "dysdiadochokinesis", "intention_tremor"];
const AXIAL = ["truncal_ataxia", "ataxic_dysarthria", "nystagmus_gaze_evoked"];
for (const id of [...APPENDICULAR, ...AXIAL]) ok(`${id} exists`, isFinding(id));
for (const id of APPENDICULAR) {
  ok(`${id} is ipsilateral (crosses:false)`, CROSSES[id] === false);
  ok(`${id} is NOT non-lateralised`, !NON_LATERALISED.has(id));
  ok(`${id} is LOCALISING`, LOCALISING.has(id));
}
for (const id of AXIAL) {
  ok(`${id} is NON_LATERALISED (@none)`, NON_LATERALISED.has(id));
  ok(`${id} is LOCALISING`, LOCALISING.has(id));
}
ok("limb_ataxia still crosses:false + LOCALISING",
   CROSSES.limb_ataxia === false && LOCALISING.has("limb_ataxia"));

// --- Task 2: structures (one structure = one finding) ---
const cbOf = (part) => STRUCTURES.filter(s => s.level === "cerebellum" && s.part === part)
  .map(s => s.produces).sort();
ok("hemisphere -> limb_ataxia + dysmetria + dysdiadochokinesis + intention_tremor",
   eq(cbOf("hemisphere"), ["dysdiadochokinesis", "dysmetria", "intention_tremor", "limb_ataxia"]));
ok("vermis -> truncal_ataxia + ataxic_dysarthria",
   eq(cbOf("vermis"), ["ataxic_dysarthria", "truncal_ataxia"]));
ok("flocculonodular -> nystagmus_gaze_evoked", eq(cbOf("flocculonodular"), ["nystagmus_gaze_evoked"]));
ok("no cerebellum structure sets a crosses override (appendicular inherit false; axial are NON_LATERALISED)",
   STRUCTURES.filter(s => s.level === "cerebellum")
     .every(s => !Object.prototype.hasOwnProperty.call(s, "crosses")));

// --- Task 3: hemisphere focal (left/right) sites, ipsilateral appendicular emission ---
ok("left_cerebellum_hemisphere exists", !!SITE_BY_ID.left_cerebellum_hemisphere);
ok("right_cerebellum_hemisphere exists", !!SITE_BY_ID.right_cerebellum_hemisphere);
{
  const h = expectedFindings(SITE_BY_ID.left_cerebellum_hemisphere);
  ok("left hemisphere -> limb_ataxia@left (ipsi)", h.has("limb_ataxia@left"));
  ok("left hemisphere -> dysmetria@left (ipsi)", h.has("dysmetria@left"));
  ok("left hemisphere -> dysdiadochokinesis@left (ipsi)", h.has("dysdiadochokinesis@left"));
  ok("left hemisphere -> intention_tremor@left (ipsi)", h.has("intention_tremor@left"));
  ok("left hemisphere emits NOTHING on the right", ![...h].some(t => t.endsWith("@right")));
}

// --- Task 4: midline (vermis / flocculonodular) + pancerebellar composites ---
// Composite sites are only in candidateSites(), not SITE_BY_ID — look them up via the composers.
const CB_MID = Object.fromEntries(composeCerebellumMidlineSites().map(s => [s.id, s]));
const CB_PAN = Object.fromEntries(composeCerebellumPancerebellarSites().map(s => [s.id, s]));
ok("cerebellum_vermis exists (midline)",
   CB_MID.cerebellum_vermis && CB_MID.cerebellum_vermis.side === "midline");
ok("cerebellum_flocculonodular exists (midline)",
   CB_MID.cerebellum_flocculonodular && CB_MID.cerebellum_flocculonodular.side === "midline");
ok("cerebellum_pancerebellar exists (bilateral)",
   CB_PAN.cerebellum_pancerebellar && CB_PAN.cerebellum_pancerebellar.side === "bilateral");
{
  const v = expectedFindings(CB_MID.cerebellum_vermis);
  ok("vermis -> truncal_ataxia@none", v.has("truncal_ataxia@none"));
  ok("vermis -> ataxic_dysarthria@none", v.has("ataxic_dysarthria@none"));
  const f = expectedFindings(CB_MID.cerebellum_flocculonodular);
  ok("flocculonodular -> nystagmus_gaze_evoked@none", f.has("nystagmus_gaze_evoked@none"));
  const p = expectedFindings(CB_PAN.cerebellum_pancerebellar);
  ok("pancerebellar -> limb_ataxia@left AND @right", p.has("limb_ataxia@left") && p.has("limb_ataxia@right"));
  ok("pancerebellar -> dysmetria@left AND @right", p.has("dysmetria@left") && p.has("dysmetria@right"));
  ok("pancerebellar -> truncal_ataxia@none (axial stays @none, NOT @left)",
     p.has("truncal_ataxia@none") && !p.has("truncal_ataxia@left"));
  ok("pancerebellar -> nystagmus_gaze_evoked@none", p.has("nystagmus_gaze_evoked@none"));
}

// --- Task 5: inverse emergence + naming ---
const bilat = (...ids) => new Set(ids.flatMap(f => [`${f}@left`, `${f}@right`]));
{
  const { best } = solve(new Set(["limb_ataxia@left", "dysmetria@left", "dysdiadochokinesis@left", "intention_tremor@left"]));
  ok("pure appendicular -> left_cerebellum_hemisphere",
     best && best.site.id === "left_cerebellum_hemisphere");
  ok("hemisphere names a cerebellar hemisphere syndrome",
     best && /cerebellar hemisphere/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["truncal_ataxia@none", "ataxic_dysarthria@none"]));
  ok("truncal + dysarthria -> cerebellum_vermis", best && best.site.id === "cerebellum_vermis");
  ok("vermis names a vermis syndrome (phonebook, not fallback)",
     best && /vermis syndrome/i.test(nameForSite(best.site).name));
}
{
  const { best } = solve(new Set(["nystagmus_gaze_evoked@none"]));
  ok("nystagmus_gaze_evoked -> cerebellum_flocculonodular", best && best.site.id === "cerebellum_flocculonodular");
  ok("flocculonodular names a vestibulocerebellar syndrome (phonebook, not fallback)",
     best && /vestibulocerebellar/i.test(nameForSite(best.site).name));
}
{
  const set = bilat("limb_ataxia", "dysmetria", "dysdiadochokinesis", "intention_tremor");
  set.add("truncal_ataxia@none"); set.add("ataxic_dysarthria@none"); set.add("nystagmus_gaze_evoked@none");
  const { best } = solve(set);
  ok("full diffuse set -> cerebellum_pancerebellar", best && best.site.id === "cerebellum_pancerebellar");
  ok("pancerebellar names a pancerebellar syndrome (phonebook, not fallback)",
     best && /pancerebellar syndrome/i.test(nameForSite(best.site).name));
}

// ---- report ----
console.log("\nNeuroLocaliser — CEREBELLUM tests\n" + "=".repeat(52));
for (const { label, ok: good } of log) console.log(`${good ? "PASS" : "FAIL"}  ${label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
