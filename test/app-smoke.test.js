// app-smoke.test.js — integrity of the nested exam tree (Sub-project D). Every leaf finding is real;
// every finding is reachable (tree ∪ "Other"); structure is well-formed; taxonomy spot-checks hold.
import { EXAM_TREE, flattenFindings } from "../app/exam-map.js";
import { FINDINGS } from "../src/model/findings.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond) => { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; };
const isFinding = f => Object.prototype.hasOwnProperty.call(FINDINGS, f);

// ---- structural well-formedness (recursive) ----
let structBad = null;
const walkNode = (n, path) => {
  const here = `${path}/${n.id}`;
  const hasG = Array.isArray(n.groups), hasF = Array.isArray(n.findings);
  if (!n.id || !n.label) structBad = structBad || `${here}: missing id/label`;
  if (hasG === hasF) structBad = structBad || `${here}: must have exactly one of groups/findings`;
  if (hasG && !n.groups.length) structBad = structBad || `${here}: empty groups`;
  if (hasF && !n.findings.length) structBad = structBad || `${here}: empty findings`;
  if (hasG) n.groups.forEach(c => walkNode(c, here));
};
EXAM_TREE.forEach(n => walkNode(n, ""));
ok("every node is well-formed (id+label, exactly one of groups/findings, non-empty)", !structBad, structBad);

// ---- every leaf finding is a real finding id ----
const all = flattenFindings(EXAM_TREE);
const badId = all.find(f => !isFinding(f));
ok("every tree finding is a real finding", !badId, badId);

// ---- no finding appears twice in the tree ----
const dupe = all.find((f, i) => all.indexOf(f) !== i);
ok("no finding appears twice in the tree", !dupe, dupe);

// ---- coverage: tree ∪ Other = all findings (nothing lost) ----
const inTree = new Set(all);
const other = Object.keys(FINDINGS).filter(f => !inTree.has(f));
ok("tree ∪ Other covers every finding", inTree.size + other.length === Object.keys(FINDINGS).length);

// ---- taxonomy spot-checks (intent) ----
const findNode = (nodes, id) => {
  for (const n of nodes) { if (n.id === id) return n; if (n.groups) { const r = findNode(n.groups, id); if (r) return r; } }
  return null;
};
const paintemp = findNode(EXAM_TREE, "sens_paintemp");
ok("Sensation → Limb/hemibody → Pain & temperature contains spinothalamic", !!paintemp && paintemp.findings.includes("spinothalamic"));
const myotome = findNode(EXAM_TREE, "motor_myotome");
ok("Motor → By myotome contains a segmental movement (weak_elbow_flexion)",
   !!myotome && myotome.findings.includes("weak_elbow_flexion"));
const fatig = findNode(EXAM_TREE, "fatiguability");
ok("Fatiguability leaf carries the fatigable set",
   !!fatig && ["fatigable_weakness","fatigable_ocular","facilitating_weakness"].every(x => fatig.findings.includes(x)));
const tone = findNode(EXAM_TREE, "tone");
ok("Tone is its own top-level leaf", EXAM_TREE.some(n => n.id === "tone") && !!tone && Array.isArray(tone.findings));

console.log("\nNeuroLocaliser — EXAM TREE integrity (Sub-project D)\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
