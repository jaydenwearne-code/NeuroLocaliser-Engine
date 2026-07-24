// tier2-cord-combined.test.js — cord tract-selective combined degenerations (Tier 2, increment 2):
//   (1) subacute combined degeneration (B12): dorsal columns + lateral corticospinal, STT (pain/temp) SPARED;
//   (2) Friedreich's ataxia: + spinocerebellar (limb ataxia) + areflexia (the areflexia-with-extensor-plantars hallmark).
//   + `sensory_ataxia` (Romberg-positive) as a dorsal-column companion (also isolated posterior-column disease / tabes).
// Run: node test/tier2-cord-combined.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const B = (...ids) => new Set(ids.flatMap(id => NON_LATERALISED.has(id) ? [`${id}@none`] : [`${id}@left`, `${id}@right`]));
const win = set => solve(set).best?.site?.id ?? null;
const nameOf = set => { const b = solve(set).best; if (!b) return ""; const e = nameForSite(b.site); return (e.name || "") + " " + (e.note || ""); };
const producedAt = (lvl, part) => STRUCTURES.filter(s => s.level === lvl && s.part === part).map(s => s.produces);

// --- vocabulary ---
ok("sensory_ataxia exists", isFinding("sensory_ataxia"));
ok("sensory_ataxia @none + CROSSES false", NON_LATERALISED.has("sensory_ataxia") && CROSSES["sensory_ataxia"] === false);
ok("sensory_ataxia LOCALISING", LOCALISING.has("sensory_ataxia"));
ok("posterior cord now carries sensory_ataxia (dorsal column companion)", producedAt("cord", "posterior").includes("sensory_ataxia"));

// --- structures ---
ok("SCD site = dorsal columns + corticospinal, NO spinothalamic",
   producedAt("combined_degeneration", "scd").includes("dorsal_sensory") &&
   producedAt("combined_degeneration", "scd").includes("spasticity") &&
   producedAt("combined_degeneration", "scd").includes("babinski") &&
   !producedAt("combined_degeneration", "scd").includes("spinothalamic"));
ok("Friedreich adds limb ataxia + areflexia",
   producedAt("combined_degeneration", "friedreich").includes("limb_ataxia") &&
   producedAt("combined_degeneration", "friedreich").includes("reflex_ankle_loss"));

// --- emergence ---
ok("SCD (dorsal + UMN legs, pain/temp preserved) -> combined_degeneration_scd",
   win(B("dorsal_sensory", "spasticity", "babinski", "sensory_ataxia")) === "combined_degeneration_scd");
ok("Friedreich (+ ataxia + areflexia + extensor plantars) -> combined_degeneration_friedreich",
   win(B("dorsal_sensory", "sensory_ataxia", "limb_ataxia", "babinski", "reflex_knee_loss", "reflex_ankle_loss")) === "combined_degeneration_friedreich");
ok("SCD phonebook names combined degeneration / B12",
   /combined degeneration|B12|B-12|subacute/i.test(nameOf(B("dorsal_sensory", "spasticity", "babinski", "sensory_ataxia"))));
ok("Friedreich phonebook names it",
   /friedreich/i.test(nameOf(B("dorsal_sensory", "sensory_ataxia", "limb_ataxia", "babinski", "reflex_knee_loss", "reflex_ankle_loss"))));
// dissociation: adding spinothalamic (pain/temp lost too) should NOT stay SCD (that's a transverse/level lesion)
ok("adding bilateral spinothalamic -> NOT combined_degeneration_scd (STT sparing is the SCD tell)",
   win(B("dorsal_sensory", "spasticity", "babinski", "sensory_ataxia", "spinothalamic")) !== "combined_degeneration_scd");

// ---- report ----
console.log("\nNeuroLocaliser — TIER 2 · CORD COMBINED DEGENERATIONS (SCD · Friedreich)\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
