// app-smoke.test.js — headless guard that the app's exam-flow curation cannot silently drift from the model.
// The UI itself is verified by running it; this just asserts the data references only real findings + covers
// a high fraction of them, and that the worked-example presets are valid tokens.
// Run: node test/app-smoke.test.js
import { FINDINGS, isFinding } from "../src/model/findings.js";
import { EXAM_FLOW, PRESETS } from "../app/exam-map.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

// every mapped id is a real finding
const mapped = new Set();
let badId = null;
for (const step of EXAM_FLOW) {
  ok(`step ${step.id} has a label + findings`, step.label && Array.isArray(step.findings) && step.findings.length);
  for (const f of step.findings) { if (!isFinding(f)) badId = badId || `${step.id}:${f}`; mapped.add(f); }
}
ok(`every exam-map finding id is real (first bad: ${badId})`, badId === null);

// coverage of the finding vocabulary
const total = Object.keys(FINDINGS).length;
const cov = mapped.size / total;
ok(`exam-flow covers >= 85% of findings (${mapped.size}/${total} = ${(cov*100).toFixed(0)}%)`, cov >= 0.85);

// presets reference real findings + valid side tokens
let badPreset = null;
for (const p of PRESETS) for (const tok of p.tokens) {
  const [f, s] = tok.split("@");
  if (!isFinding(f)) badPreset = badPreset || `${p.label}:${tok} (finding)`;
  if (!["left","right","none","midline","bilateral"].includes(s)) badPreset = badPreset || `${p.label}:${tok} (side)`;
}
ok(`every preset token is a real finding@side (first bad: ${badPreset})`, badPreset === null);
ok("at least 5 worked-example presets", PRESETS.length >= 5);

// --- Goal-1 taxonomy: higher cortical by lobe + brainstem + fatiguability, no monolithic cognition bucket ---
const stepIds = new Set(EXAM_FLOW.map(s => s.id));
for (const id of ["frontal","parietal","temporal","occipital","language","brainstem","fatiguability"])
  ok(`exam step '${id}' exists`, stepIds.has(id));
ok("no monolithic 'cognition' bucket remains", !stepIds.has("cognition"));
{ const f = EXAM_FLOW.find(s => s.id === "fatiguability");
  ok("fatiguability step carries the MG/LEMS discriminators",
     f && ["fatigable_weakness","fatigable_ocular","facilitating_weakness"].every(x => f.findings.includes(x))); }
// no finding appears in two steps (single-listing → no duplicate rows)
{ const counts = {}; for (const s of EXAM_FLOW) for (const f of s.findings) counts[f] = (counts[f]||0)+1;
  const dupes = Object.keys(counts).filter(f => counts[f] > 1);
  ok(`no finding is listed in two steps (dupes: ${dupes.join(",")||"none"})`, dupes.length === 0); }

console.log("\nNeuroLocaliser — APP SMOKE (exam-map integrity)\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
