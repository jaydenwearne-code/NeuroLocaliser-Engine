// tier1-completeness.test.js — three coverage-audit fills (Increment A):
//   (1) CN I olfactory (anosmia; Foster-Kennedy as a 2-site cover with the optic canal),
//   (2) insular cortex (dysarthria + central gustatory loss),
//   (3) the two basis-pontis lacunar syndromes (ataxic hemiparesis, dysarthria-clumsy-hand).
// Pure anatomy data + one crosses:true override on the pontocerebellar fibre. Run: node test/tier1-completeness.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

const S = (...t) => new Set(t);                         // pass full `finding@side` tokens
const win = set => solve(set).best?.site?.id ?? null;
const nameOf = set => { const b = solve(set).best; if (!b) return ""; const e = nameForSite(b.site); return (e.name || "") + " " + (e.note || ""); };

// --- Task 1: vocabulary ---
for (const id of ["anosmia", "gustatory_loss", "dysarthria"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} CROSSES false`, CROSSES[id] === false);
}
ok("anosmia LOCALISING + lateralised", LOCALISING.has("anosmia") && !NON_LATERALISED.has("anosmia"));
ok("gustatory_loss LOCALISING + lateralised", LOCALISING.has("gustatory_loss") && !NON_LATERALISED.has("gustatory_loss"));
ok("dysarthria NON-localising + @none", !LOCALISING.has("dysarthria") && NON_LATERALISED.has("dysarthria"));

// --- Task 2: structures + sites ---
const baseOf = (lvl, part) => STRUCTURES.filter(s => s.level === lvl && s.part === part).map(s => s.produces).sort();
const eq = (a, b) => JSON.stringify([...(a || [])].sort()) === JSON.stringify([...(b || [])].sort());
ok("olfactory_groove -> anosmia", eq(baseOf("olfactory", "olfactory_groove"), ["anosmia"]));
ok("insula -> dysarthria + gustatory_loss", eq(baseOf("cortex", "insula"), ["dysarthria", "gustatory_loss"]));
ok("basis_pontis -> hemiparesis+facial_umn+dysarthria+limb_ataxia",
   eq(baseOf("pons", "basis_pontis"), ["weak_arm","weak_leg", "facial_weakness","forehead_spared", "dysarthria", "limb_ataxia"]));
ok("bp_pcf has crosses:true", STRUCTURES.find(s => s.id === "bp_pcf")?.crosses === true);
for (const id of ["left_olfactory_olfactory_groove", "left_cortex_insula", "left_pons_basis_pontis"])
  ok(`${id} site exists`, !!SITE_BY_ID[id]);

// --- Task 3: emergence + phonebook ---
// CN I
ok("isolated anosmia -> olfactory groove", win(S("anosmia@left")) === "left_olfactory_olfactory_groove");
{
  const cov = solve(S("anosmia@left", "optic_neuropathy@left"));
  const dump = JSON.stringify(cov);
  ok("Foster-Kennedy cover includes olfactory + optic_canal",
     dump.includes("olfactory_olfactory_groove") && dump.includes("optic_canal"));
}
ok("olfactory phonebook names Foster-Kennedy/anosmia", /foster|anosmia|olfactory/i.test(nameOf(S("anosmia@left"))));
// insula
ok("isolated gustatory_loss -> insula", win(S("gustatory_loss@left")) === "left_cortex_insula");
ok("dysarthria + gustatory -> insula", win(S("dysarthria@none", "gustatory_loss@left")) === "left_cortex_insula");
// basis pontis
ok("ataxic hemiparesis -> basis pontis", win(S("weak_arm@right","weak_leg@right", "limb_ataxia@right")) === "left_pons_basis_pontis");
ok("dysarthria-clumsy-hand -> basis pontis", win(S("dysarthria@none", "facial_weakness@right","forehead_spared@right")) === "left_pons_basis_pontis");
ok("right basis pontis mirrors", win(S("weak_arm@left","weak_leg@left", "limb_ataxia@left")) === "right_pons_basis_pontis");
ok("basis pontis phonebook names the lacune", /pontine|basis pontis|ataxic|lacun/i.test(nameOf(S("weak_arm@right","weak_leg@right", "limb_ataxia@right"))));

// ---- report ----
console.log("\nNeuroLocaliser — TIER 1 COMPLETENESS (CN I · insula · basis-pontis lacunes)\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
