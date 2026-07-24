// tier2-pns-depth.test.js — PNS depth (Tier 2, increment 4): high-cervical roots C3/C4 + phrenic/diaphragm,
// middle trunk (C7), thoracic dermatomes T4/T10/L1, sacral roots S2/S3 + pudendal, saphenous + sural nerves.
// Brachial plexus CORDS are deferred (intricate waystations that rarely localise distinctly on exam).
// Run: node test/tier2-pns-depth.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID, composePlexusSites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
const S = (...t) => new Set(t);
const win = set => solve(set).best?.site?.id ?? null;
const producedAt = (lvl, part) => STRUCTURES.filter(s => s.level === lvl && s.part === part).map(s => s.produces);

// --- vocabulary ---
const NEW = ["weak_diaphragm", "sensory_c3", "sensory_c4", "sensory_t4", "sensory_t10", "sensory_l1", "sensory_s2", "sensory_s3", "saphenous_sensory", "sural_sensory"];
for (const id of NEW) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} CROSSES false + LOCALISING`, CROSSES[id] === false && LOCALISING.has(id));
  ok(`${id} lateralised (not @none)`, !NON_LATERALISED.has(id));
}

// --- structures ---
ok("C3 root -> sensory_c3 + diaphragm", producedAt("root", "c3").includes("sensory_c3") && producedAt("root", "c3").includes("weak_diaphragm"));
ok("phrenic nerve -> diaphragm", producedAt("nerve", "phrenic").includes("weak_diaphragm"));
ok("pudendal -> perineal sensory + sphincter", producedAt("nerve", "pudendal").includes("sensory_s3") && producedAt("nerve", "pudendal").includes("sphincter_dysfunction"));
ok("middle trunk site exists (plexus C7)", composePlexusSites().some(s => s.part === "middle_trunk"));
for (const p of ["c3", "c4", "t4", "t10", "l1", "s2", "s3"]) ok(`left_root_${p} site exists`, !!SITE_BY_ID[`left_root_${p}`]);
for (const p of ["phrenic", "pudendal", "saphenous", "sural"]) ok(`left_nerve_${p} site exists`, !!SITE_BY_ID[`left_nerve_${p}`]);

// --- emergence ---
ok("isolated diaphragm weakness -> phrenic nerve (lean pure-motor)", win(S("weak_diaphragm@left")) === "left_nerve_phrenic");
ok("C4 dermatome + diaphragm + radicular pain -> C4 root", win(S("sensory_c4@left", "weak_diaphragm@left", "radicular_pain@left")) === "left_root_c4");
ok("T10 dermatome band -> T10 root", win(S("sensory_t10@left", "radicular_pain@left")) === "left_root_t10");
ok("perineal sensory + sphincter -> pudendal nerve", win(S("sensory_s3@left", "sphincter_dysfunction@left")) === "left_nerve_pudendal");
ok("saphenous territory -> saphenous nerve", win(S("saphenous_sensory@left")) === "left_nerve_saphenous");
ok("sural territory -> sural nerve", win(S("sural_sensory@left")) === "left_nerve_sural");

// ---- report ----
console.log("\nNeuroLocaliser — TIER 2 · PNS DEPTH (C3/4+phrenic · middle trunk · thoracic · S2/3+pudendal · saphenous/sural)\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
