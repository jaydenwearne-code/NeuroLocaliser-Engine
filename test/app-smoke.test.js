// app-smoke.test.js — integrity of the nested exam tree (Sub-project D). Every leaf finding is real;
// every finding is reachable (tree ∪ "Other"); structure is well-formed; taxonomy spot-checks hold.
import { EXAM_TREE, flattenFindings } from "../app/exam-map.js";
import { FINDINGS } from "../src/model/findings.js";
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { nameForSite } from "../src/data/syndromes.js";
import { encodeCase, decodeCase } from "../app/case-url.js";

const siteById = id => candidateSites().find(s => s.id === id);

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

// ---- app/engine CONTRACT: the shapes app.js destructures off solve() ----
// Regression guard for a crash found by driving the app (2026-08-10): the multifocal banner mapped
// r.multi.sites as {site} wrappers, but minimalSet() yields RAW site objects — so nameForSite(undefined)
// threw and the error boundary swallowed the ENTIRE results pane on every genuinely multifocal case.
// r.nearFit IS a {site,missing} wrapper, which is exactly why the mismatch was easy to miss.
{
  // Any genuinely two-lesion case will do. (It used to be a cauda picture with a one-sided sphincter token — the very
  // trap the 2026-09-29 conus/cauda fix removed, which now resolves to the cauda alone.)
  const multiCase = new Set(["weak_arm@right","weak_leg@left"]);
  const r = solve(multiCase);
  ok("multifocal case still yields a multi cover", !!r.multi && Array.isArray(r.multi.sites) && r.multi.sites.length >= 2);
  ok("r.multi.sites elements are RAW sites (have .id, not .site)",
     r.multi.sites.every(s => typeof s.id === "string" && s.site === undefined));
  ok("nameForSite() works on r.multi.sites elements directly — the banner cannot throw",
     r.multi.sites.every(s => { try { return !!nameForSite(s).name; } catch { return false; } }));
  ok("r.multi.uncovered is an array of finding tokens", Array.isArray(r.multi.uncovered));
  // the sibling near-fit path uses the OPPOSITE shape; pin it so the two don't get "unified" by mistake
  const nf = solve(new Set(["weak_arm@left","weak_leg@left","aphasia@none"])).nearFit;
  ok("r.nearFit is a {site,missing} wrapper (NOT a raw site)", !nf || (!!nf.site && typeof nf.site.id === "string"));
  ok("nameForSite() works on r.nearFit.site", !nf || !!nameForSite(nf.site).name);
}

// The combined view resolves to the pinned pair when there is one, else the engine's cover. This pins the
// SHAPES the app consumes: minimalSet() yields RAW site objects, unlike r.nearFit which is a {site,missing}
// wrapper — two adjacent solve() fields with opposite shapes, which has already caused one crash.
{
  const r = solve(new Set([...expectedFindings(siteById("left_medulla_lateral")), ...expectedFindings(siteById("right_root_l5"))]));
  ok("r.multi.sites are RAW site objects with an id", !!r.multi && r.multi.sites.every(s => s && typeof s.id === "string"));
  ok("r.multi.sites are NOT {site} wrappers", !!r.multi && r.multi.sites.every(s => s.site === undefined));
}

// ---- control relocation must not change the case URL contract (2026-08-16) ----
// The controls move into the cards they act on, which means a control can be UNMOUNTED while its state is
// set (onset is "subacute" but no finding is entered, so the What card never rendered). S stays the single
// source of truth and the value must still round-trip, or a shared case silently loses its tempo.
{
  const state = { tokens: new Set(["weak_arm@right"]), onset: "subacute", course: "relapsing",
    dominant: "right", sensoryLevel: "T10", distalReach: "knees", pinned: new Set(), mode: "localise" };
  const round = decodeCase("#" + encodeCase(state), { validFindings: new Set(["weak_arm"]) });
  ok("onset survives the round trip", round.onset === "subacute");
  ok("course survives the round trip", round.course === "relapsing");
  ok("dominant hemisphere survives the round trip", round.dominant === "right");
  ok("sensory level survives the round trip", round.sensoryLevel === "T10");
  ok("distal reach survives the round trip", round.distalReach === "knees");
  // the unmounted case: state set, no findings at all
  const bare = decodeCase("#" + encodeCase({ tokens: new Set(), onset: "chronic", course: "progressive" }), {});
  ok("onset serialises with no findings entered", bare.onset === "chronic");
  ok("course serialises with no findings entered", bare.course === "progressive");
}

// ---- EVERY app/*.js FILE MUST PARSE ----
// app.js is DOM-bound, so no suite imports it and a SYNTAX ERROR SHIPS SILENTLY. It happened twice in one
// change: a duplicate `const sideTag`, and an orphaned `}` left by a deletion — the full suite stayed
// green through both, and only loading the page in a browser showed anything wrong. Parsing every module
// here costs nothing and closes that hole.
{
  const { readdirSync } = await import("node:fs");
  const { execFileSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  // fileURLToPath, NOT .pathname: this project's path contains a space ("Claude Code"), so .pathname is
  // percent-encoded and node cannot open the file — which made every module look like a parse failure.
  const dir = fileURLToPath(new URL("../app/", import.meta.url));
  const files = readdirSync(dir).filter(f => f.endsWith(".js"));
  ok(`there are app modules to check (${files.length})`, files.length > 5);
  for (const f of files) {
    let err = null;
    try { execFileSync(process.execPath, ["--check", dir + f], { stdio: "pipe" }); }
    catch (e) { err = String(e.stderr || e.message).split("\n").find(l => /SyntaxError/.test(l)) || "parse failed"; }
    ok(`app/${f} parses`, err === null, err || "");
  }
}

console.log("\nNeuroLocaliser — EXAM TREE integrity (Sub-project D)\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
