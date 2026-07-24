// callosal.test.js — the corpus callosum as a midline tract region: the callosal disconnection (split-brain)
// syndrome. Anterior (genu/body) -> left-hand apraxia + alien hand; splenium -> left-hand tactile anomia.
// A tract is just a site; the disconnection deficit is the finding. Run: node test/callosal.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { composeCorpusCallosumSites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0; const log = [];
function ok(l, c) { log.push({ l, ok: !!c }); c ? pass++ : fail++; }
const best = (...fs) => solve(new Set(fs)).best;
const nameB = b => (b ? nameForSite(b.site).name : "");

// Vocabulary
for (const id of ["callosal_apraxia", "tactile_anomia"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} @none`, NON_LATERALISED.has(id));
  ok(`${id} CROSSES false`, CROSSES[id] === false);
  ok(`${id} LOCALISING`, LOCALISING.has(id));
}

// Sites exist (midline)
const CC = Object.fromEntries(composeCorpusCallosumSites().map(s => [s.id, s]));
ok("corpus_callosum_anterior exists (midline)", CC.corpus_callosum_anterior && CC.corpus_callosum_anterior.side === "midline");
ok("corpus_callosum_splenium exists (midline)", CC.corpus_callosum_splenium && CC.corpus_callosum_splenium.side === "midline");

// Emergence
{
  const b = best("callosal_apraxia@none");
  ok("callosal apraxia -> anterior callosum", b && b.site.id === "corpus_callosum_anterior");
  ok("  names callosal / disconnection / anterior", /callosal|disconnection|anterior/i.test(nameB(b)));
}
{
  const b = best("tactile_anomia@none");
  ok("tactile anomia -> splenium", b && b.site.id === "corpus_callosum_splenium");
  ok("  names splenial / tactile / disconnection", /spleni|tactile|disconnection/i.test(nameB(b)));
}
{
  const b = best("callosal_apraxia@none", "alien_limb@none");
  ok("callosal apraxia + alien hand -> anterior callosum", b && b.site.id === "corpus_callosum_anterior");
}
// Regression: isolated alien limb still -> SMA (the callosum over-predicts callosal_apraxia)
{
  const b = best("alien_limb@none");
  ok("isolated alien limb -> SMA (not callosum)", b && b.site.id.includes("cortex_sma"));
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.l}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
