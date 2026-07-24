// aphasia.test.js — the 8 classic aphasias emerge from 4 language FEATURES (fluency, comprehension,
// repetition, naming). Repetition is the perisylvian-vs-transcortical discriminator: repetition-spared
// (transcortical / watershed) syndromes win when repetition_impaired is ABSENT (the perisylvian sites
// over-predict it). Plus two subcortical aphasias distinguished by their subcortical company.
// Run: node test/aphasia.test.js
import { CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";

let pass = 0, fail = 0; const log = [];
function ok(l, c) { log.push({ l, ok: !!c }); c ? pass++ : fail++; }
const nameOf = best => (best ? nameForSite(best.site).name : "");

// Vocabulary: old findings gone, features present
ok("aphasia_expressive REMOVED", !isFinding("aphasia_expressive"));
ok("aphasia_receptive REMOVED", !isFinding("aphasia_receptive"));
for (const id of ["speech_nonfluent", "comprehension_impaired", "repetition_impaired", "naming_impaired"]) {
  ok(`${id} exists`, isFinding(id));
  ok(`${id} @none`, NON_LATERALISED.has(id));
  ok(`${id} CROSSES false`, CROSSES[id] === false);
}
ok("speech_nonfluent LOCALISING", LOCALISING.has("speech_nonfluent"));
ok("comprehension_impaired LOCALISING", LOCALISING.has("comprehension_impaired"));
ok("repetition_impaired LOCALISING", LOCALISING.has("repetition_impaired"));
ok("naming_impaired is NON-localising (in every aphasia)", !LOCALISING.has("naming_impaired"));

// The 8 classic cortical aphasias emerge from feature combinations (dominant = left by default)
const T = (findings, rx, label) => {
  const { best } = solve(new Set(findings));
  ok(`${label}: ${findings.map(f => f.split("@")[0]).join("+")} -> ${rx}`, best && rx.test(nameOf(best)));
};
T(["speech_nonfluent@none", "repetition_impaired@none"], /broca/i, "Broca");
T(["comprehension_impaired@none", "repetition_impaired@none"], /wernicke/i, "Wernicke");
T(["repetition_impaired@none"], /conduction/i, "Conduction");
T(["speech_nonfluent@none", "comprehension_impaired@none", "repetition_impaired@none"], /global/i, "Global");
T(["speech_nonfluent@none"], /transcortical motor/i, "TCMA");
T(["comprehension_impaired@none"], /transcortical sensory/i, "TCSA");
T(["speech_nonfluent@none", "comprehension_impaired@none"], /mixed transcortical/i, "Mixed transcortical");
T(["naming_impaired@none"], /anomic/i, "Anomic");

// Subcortical aphasias — distinguished by their subcortical company
T(["comprehension_impaired@none", "dorsal_sensory@right", "spinothalamic@right"], /thalamic aphasia/i, "Thalamic");
T(["speech_nonfluent@none", "weak_arm@right", "weak_leg@right", "facial_weakness@right","forehead_spared@right",
   "babinski@right", "hoffmann@right", "spasticity@right"], /striatocapsular/i, "Striatocapsular");

// Regressions: pure sensory thalamus / pure motor capsule are NOT stolen by the subcortical-aphasia sites
{
  // Déjerine-Roussy (sensory + central pain) -> plain VPL thalamus; thalamic aphasia must NOT steal it.
  const { best } = solve(new Set(["dorsal_sensory@right", "spinothalamic@right", "thalamic_pain@right"]));
  ok("sensory + thalamic pain -> plain VPL thalamus (not thalamic aphasia)",
     best && best.site.id === "left_subcortex_thalamus");
}
{
  const { best } = solve(new Set(["weak_arm@right", "weak_leg@right", "facial_weakness@right","forehead_spared@right",
    "babinski@right", "hoffmann@right", "spasticity@right"]));
  ok("pure motor capsule -> internal capsule (not striatocapsular)",
     best && best.site.id === "left_subcortex_internal_capsule");
}

console.log("====================================================");
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.l}`);
console.log("====================================================");
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
