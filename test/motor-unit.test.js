// motor-unit.test.js — the pure-motor end of the motor unit: anterior horn cell, NMJ (post/pre-
// synaptic), muscle. The clinical question: symmetric weakness with NO sensory loss — anterior horn,
// junction, or muscle? These are generalized/symmetric, so each is a BILATERAL site (reuses the cord's
// bilateral emission) — no new mechanism. Key modelling calls (settled with the user):
//   * the anterior horn is PURE LMN (no umn_signs) — ALS is a pathology-layer entity, not a site;
//   * fasciculations is confined to the anterior horn in this model, so the 2026-08-14 LOCALISING audit
//     (test/localising-audit.test.js) promoted it to localising — it pins the anterior horn, unlike the
//     genuinely multi-level lmn_weakness/proximal_weakness patterns which stay non-localising.
// Run: node test/motor-unit.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// --- Task 1: vocabulary (6 new findings) ---
const NEW = ["fatigable_weakness","fatigable_ocular","facilitating_weakness","autonomic_features","fasciculations","proximal_weakness"];
for (const id of NEW) {
  ok(`finding ${id} exists`, isFinding(id));
  ok(`${id} is ipsilateral/bilateral (CROSSES false)`, CROSSES[id] === false);
  ok(`${id} is NOT non-lateralised`, !NON_LATERALISED.has(id));
}

// --- Task 2: localising policy (the two anatomical calls, made testable) ---
import { LOCALISING } from "../src/engine/score.js";
for (const id of ["fatigable_weakness","fatigable_ocular","facilitating_weakness","autonomic_features"])
  ok(`${id} IS localising (pins the diagnosis)`, LOCALISING.has(id));
ok("fasciculations IS localising (2026-08-14 audit — confined to the anterior horn)", LOCALISING.has("fasciculations"));
ok("proximal_weakness is NOT localising (shared → myopathy emerges by parsimony)", !LOCALISING.has("proximal_weakness"));

// --- Task 3: structure catalogue ---
import { STRUCTURES, STRUCTURE_BY_ID } from "../src/model/structures.js";
const muOf = part => STRUCTURES.filter(s => s.level === "motor_unit" && s.part === part).map(s => s.produces).sort();
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

ok("anterior_horn -> lmn_weakness + fasciculations + bulbar (dysphagia+dysarthria) + hypotonia + wasting (PURE LMN)",
   eq(muOf("anterior_horn"), ["dysphagia","dysarthria","fasciculations","hypotonia","lmn_weakness","wasting"].sort()));
ok("anterior_horn does NOT produce umn_signs (ALS is not a site — pathology layer)",
   !muOf("anterior_horn").includes("umn_signs"));
ok("nmj_postsynaptic -> fatigable weakness + ocular + bulbar (dysphagia+dysarthria) + proximal",
   eq(muOf("nmj_postsynaptic"), ["dysphagia","dysarthria","fatigable_ocular","fatigable_weakness","proximal_weakness"].sort()));
ok("nmj_presynaptic -> facilitating + autonomic + proximal",
   eq(muOf("nmj_presynaptic"), ["autonomic_features","facilitating_weakness","proximal_weakness"].sort()));
ok("muscle -> proximal weakness only", eq(muOf("muscle"), ["proximal_weakness"]));
{
  const mu = STRUCTURES.filter(s => s.level === "motor_unit");
  ok("no motor_unit structure sets a crosses override",
     mu.every(s => !Object.prototype.hasOwnProperty.call(s, "crosses")));
  ok("no motor_unit structure is hemisphere/bilateral gated", mu.every(s => !s.hemisphere && !s.bilateralOnly));
}

// --- Task 4: sites & composer (bilateral, no left/right primitives) ---
import { composeMotorUnitSites } from "../src/model/sites.js";
const MU = Object.fromEntries(composeMotorUnitSites().map(s => [s.id, s]));
ok("motor_unit_anterior_horn exists and is bilateral", MU.motor_unit_anterior_horn && MU.motor_unit_anterior_horn.side === "bilateral");
ok("motor_unit_nmj_postsynaptic exists", !!MU.motor_unit_nmj_postsynaptic);
ok("motor_unit_nmj_presynaptic exists", !!MU.motor_unit_nmj_presynaptic);
ok("motor_unit_muscle exists and is bilateral", MU.motor_unit_muscle && MU.motor_unit_muscle.side === "bilateral");

// --- Task 5: forward model — bilateral emission on both body sides ---
import { expectedFindings } from "../src/engine/forward.js";
{
  const ah = expectedFindings(MU.motor_unit_anterior_horn);
  ok("anterior horn -> lmn_weakness@left AND @right", ah.has("lmn_weakness@left") && ah.has("lmn_weakness@right"));
  ok("anterior horn -> fasciculations both sides", ah.has("fasciculations@left") && ah.has("fasciculations@right"));
  ok("anterior horn emits NO sensory / NO umn_signs", !ah.has("umn_signs@left") && !ah.has("dorsal_sensory@left"));
  const mg = expectedFindings(MU.motor_unit_nmj_postsynaptic);
  ok("MG -> fatigable_weakness both sides", mg.has("fatigable_weakness@left") && mg.has("fatigable_weakness@right"));
}

// --- Task 6: emergent syndromes (same scorer, no rules) ---
import { solve } from "../src/engine/inverse.js";
const bilat = (...ids) => new Set(ids.flatMap(f => [`${f}@left`, `${f}@right`]));

// Anterior horn — pure LMN, no sensory.
{
  const { best } = solve(bilat("lmn_weakness", "fasciculations"));
  ok("pure-LMN (weakness + fasciculations) -> anterior horn", best && best.site.id === "motor_unit_anterior_horn");
}
// Myasthenia gravis — fatigability is the hallmark; ocular predominance separates it from LEMS.
{
  const { best } = solve(bilat("fatigable_weakness", "fatigable_ocular", "proximal_weakness", "dysphagia"));
  ok("fatigable + ocular -> myasthenia (nmj_postsynaptic)", best && best.site.id === "motor_unit_nmj_postsynaptic");
}
// Lambert-Eaton — facilitation + autonomic.
{
  const { best } = solve(bilat("facilitating_weakness", "autonomic_features", "proximal_weakness"));
  ok("facilitation + autonomic -> Lambert-Eaton (nmj_presynaptic)", best && best.site.id === "motor_unit_nmj_presynaptic");
}
// Myopathy — bare bilateral proximal weakness, by parsimony (MG/LEMS over-predict).
{
  const { best } = solve(bilat("proximal_weakness"));
  ok("bare proximal weakness -> muscle (parsimony)", best && best.site.id === "motor_unit_muscle");
}
// ALS is NOT a single site. A mixed UMN + LMN picture does not resolve to any one motor-unit site:
// since the PNS increment demoted `lmn_weakness` to a general (non-localising) LMN sign, the pure-LMN
// anterior horn can no longer absorb a picture whose localising `umn_signs` it cannot explain, and no
// single site carries bilateral UMN signs — so the UMN+LMN combination belongs to the pathology layer,
// not one anatomical site. (Pure LMN still localises cleanly to the anterior horn — asserted above.)
{
  const { best, singleExplainsAll } = solve(bilat("lmn_weakness", "umn_signs", "fasciculations"));
  ok("mixed UMN+LMN does NOT resolve to a single site (ALS → pathology layer)", best === null);
  ok("...and it is not confidently explained by one site", singleExplainsAll === false);
}

// --- Task 7: phonebook ---
import { nameForSite } from "../src/data/syndromes.js";
{
  const name = set => nameForSite(solve(set).best.site).name;
  const ah = name(bilat("lmn_weakness", "fasciculations"));
  ok("anterior horn names lower motor neurone / anterior horn disease", /anterior horn|lower motor/i.test(ah));
  ok("...and does NOT claim ALS (that's the pathology layer)", !/amyotrophic lateral/i.test(ah));
  ok("MG names myasthenia", /myasthenia/i.test(name(bilat("fatigable_weakness", "fatigable_ocular", "proximal_weakness", "dysphagia"))));
  ok("LEMS names Lambert-Eaton", /lambert|eaton/i.test(name(bilat("facilitating_weakness", "autonomic_features", "proximal_weakness"))));
  ok("muscle names myopathy", /myopath/i.test(name(bilat("proximal_weakness"))));
}

// ---- report ----
console.log("\nNeuroLocaliser — MOTOR UNIT (anterior horn / NMJ / muscle) tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
