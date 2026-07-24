// vestibular-hints.test.js — the HINTS axis (Head-Impulse, Nystagmus, Test-of-Skew) + canal-specific BPPV.
// Peripheral vs central acute vestibular syndrome: the "normal head-impulse = stroke" logic EMERGES from the
// over-prediction penalty (the peripheral labyrinth predicts an abnormal head impulse; its absence + skew tips
// the lean central-vestibular site). Pure anatomy data, no new solver mechanism.
// Run: node test/vestibular-hints.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { SITE_BY_ID } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

const S = (...t) => new Set(t);
const win = set => solve(set).best?.site?.id ?? null;
const nameOf = set => { const b = solve(set).best; if (!b) return ""; const e = nameForSite(b.site); return (e.name || "") + " " + (e.note || ""); };

// --- Task 1: vocabulary ---
const NEW = ["head_impulse_abnormal", "skew_deviation", "nystagmus_positional_posterior",
  "nystagmus_positional_horizontal", "nystagmus_positional_anterior"];
for (const id of NEW) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} CROSSES false`, CROSSES[id] === false);
  ok(`${id} @none`, NON_LATERALISED.has(id));
  ok(`${id} LOCALISING`, LOCALISING.has(id));
}

// --- Task 2: structures + sites ---
const baseOf = (l, p) => STRUCTURES.filter(s => s.level === l && s.part === p).map(s => s.produces).sort();
const eq = (a, b) => JSON.stringify([...(a || [])].sort()) === JSON.stringify([...(b || [])].sort());
ok("labyrinth incl head_impulse", baseOf("peripheral_vestibular", "labyrinth").includes("head_impulse_abnormal"));
ok("posterior_canal -> positional_posterior", eq(baseOf("peripheral_vestibular", "posterior_canal"), ["nystagmus_positional_posterior"]));
ok("horizontal_canal -> positional_horizontal", eq(baseOf("peripheral_vestibular", "horizontal_canal"), ["nystagmus_positional_horizontal"]));
ok("anterior_canal -> positional_anterior", eq(baseOf("peripheral_vestibular", "anterior_canal"), ["nystagmus_positional_anterior"]));
ok("central_vestibular nucleus -> vertigo+gaze+skew", eq(baseOf("central_vestibular", "nucleus"), ["cn8_vertigo", "nystagmus_gaze_evoked", "skew_deviation"]));
ok("medulla lateral now includes skew", baseOf("medulla", "lateral").includes("skew_deviation"));
for (const id of ["left_peripheral_vestibular_posterior_canal", "left_peripheral_vestibular_horizontal_canal",
  "left_peripheral_vestibular_anterior_canal", "left_central_vestibular_nucleus"])
  ok(`${id} site exists`, !!SITE_BY_ID[id]);

// --- Task 3: emergence + phonebook ---
ok("vestibular neuritis -> labyrinth",
   win(S("cn8_vertigo@left", "nystagmus_peripheral@none", "head_impulse_abnormal@none")) === "left_peripheral_vestibular_labyrinth");
ok("central AVS -> central vestibular",
   win(S("cn8_vertigo@left", "nystagmus_gaze_evoked@none", "skew_deviation@none")) === "left_central_vestibular_nucleus");
ok("normal-HIT + skew (dangerous) -> central",
   win(S("cn8_vertigo@left", "skew_deviation@none")) === "left_central_vestibular_nucleus");
ok("posterior BPPV -> posterior canal",
   /peripheral_vestibular_posterior_canal/.test(win(S("nystagmus_positional_posterior@none"))));
ok("horizontal BPPV -> horizontal canal",
   /peripheral_vestibular_horizontal_canal/.test(win(S("nystagmus_positional_horizontal@none"))));
ok("anterior BPPV -> anterior canal",
   /peripheral_vestibular_anterior_canal/.test(win(S("nystagmus_positional_anterior@none"))));
ok("Meniere still -> labyrinth",
   win(S("cn8_vertigo@left", "nystagmus_peripheral@none", "hearing_loss@left")) === "left_peripheral_vestibular_labyrinth");
ok("central phonebook names stroke / central AVS / HINTS",
   /central|stroke|posterior circulation|HINTS|infarct/i.test(nameOf(S("cn8_vertigo@left", "nystagmus_gaze_evoked@none", "skew_deviation@none"))));
ok("posterior-canal phonebook names BPPV",
   /BPPV|positional|posterior canal/i.test(nameOf(S("nystagmus_positional_posterior@none"))));
// full Wallenberg regression (canonical engine.test set) — winner must stay lateral medulla despite added skew
ok("full Wallenberg still -> lateral medulla",
   win(S("face_pain_loss@left", "spinothalamic@right", "miosis@left","ptosis@left", "palatal_weakness@left", "vocal_cord_palsy@left", "dysphagia@left",
         "cn8_vertigo@left", "limb_ataxia@left", "nystagmus_gaze_evoked@none")) === "left_medulla_lateral");

// ---- report ----
console.log("\nNeuroLocaliser — VESTIBULAR HINTS (peripheral vs central AVS · BPPV)\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
