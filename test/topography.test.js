// topography.test.js — the authored NON-vascular location axis: which lobe, CSF surface or deep
// parenchyma, and which selectively vulnerable system.
//
// Kept separate from vascular.js because it is a different clinical review question. Keyed by
// `${level}|${part}` for the same collision reason.
//
// Spec: docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md §2
// Run: node test/topography.test.js
import { LOBES, SYSTEMS, TOPOGRAPHY, topographyOf } from "../src/model/topography.js";
import { candidateSites } from "../src/engine/inverse.js";
import { compartmentOf } from "../src/model/compartments.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

const keys = [...new Set(candidateSites().map(s => `${s.level}|${s.part}`))];
const compartmentByKey = {};
for (const s of candidateSites()) compartmentByKey[`${s.level}|${s.part}`] = compartmentOf(s);

// --- 1: total coverage over EVERY site, not only CNS ---
// `surface` must be answerable for roots, cauda and cranial-nerve exits too — those are exactly the
// places the `surface` pattern (leptomeningeal disease) needs.
{
  const missing = keys.filter(k => !TOPOGRAPHY[k]);
  ok(`every level|part key has a topography row (${missing.length} missing of ${keys.length})`,
     missing.length === 0, missing.slice(0, 10).join(" · "));
  const orphan = Object.keys(TOPOGRAPHY).filter(k => !keys.includes(k));
  ok(`no row exists for a key the model does not produce (${orphan.length} orphans)`, orphan.length === 0,
     orphan.slice(0, 10).join(" · "));
}

// --- 2: closed vocabularies, and surface is never null ---
{
  const badLobe = Object.entries(TOPOGRAPHY).filter(([, t]) => t.lobe !== null && !LOBES.includes(t.lobe));
  ok(`every lobe is declared or null (${badLobe.length} bad)`, badLobe.length === 0,
     badLobe.map(([k, t]) => `${k}:${t.lobe}`).slice(0, 5).join(" · "));
  const badSys = Object.entries(TOPOGRAPHY).filter(([, t]) => t.system !== null && !SYSTEMS.includes(t.system));
  ok(`every system is declared or null (${badSys.length} bad)`, badSys.length === 0,
     badSys.map(([k, t]) => `${k}:${t.system}`).slice(0, 5).join(" · "));
  const badSurface = Object.entries(TOPOGRAPHY).filter(([, t]) => typeof t.surface !== "boolean");
  ok(`surface is always a boolean, never null (${badSurface.length} bad)`, badSurface.length === 0,
     badSurface.map(([k]) => k).slice(0, 5).join(" · "));
}

// --- 3: only cortex carries a lobe ---
{
  const nonCortexWithLobe = Object.entries(TOPOGRAPHY).filter(([k, t]) => t.lobe !== null && !k.startsWith("cortex|"));
  ok(`only cortex keys carry a lobe (${nonCortexWithLobe.length} others do)`, nonCortexWithLobe.length === 0,
     nonCortexWithLobe.map(([k]) => k).slice(0, 5).join(" · "));
  // The four cortex keys that deliberately span lobes.
  const spanning = ["cortex|mca", "cortex|aphasia_global", "cortex|aphasia_mixed_transcortical", "cortex|arcuate"];
  ok("the four lobe-spanning cortex keys are null, not mislabelled",
     spanning.every(k => TOPOGRAPHY[k] && TOPOGRAPHY[k].lobe === null));
  const cortexKeys = keys.filter(k => k.startsWith("cortex|"));
  const untagged = cortexKeys.filter(k => TOPOGRAPHY[k].lobe === null && !spanning.includes(k));
  ok(`no cortex key is untagged by accident (${untagged.length})`, untagged.length === 0, untagged.join(" · "));
}

// --- 4: `surface` follows the compartment rule EXHAUSTIVELY ---
// Stated as a rule rather than a list so a newly added site cannot land in an undetermined state.
{
  const SURFACE_COMPARTMENTS = new Set(["root", "cauda", "skull_base"]);
  const SURFACE_KEYS = new Set(["visual_pathway|chiasm", "conus|medullaris"]);
  const wrong = Object.entries(TOPOGRAPHY).filter(([k, t]) => {
    const expected = SURFACE_COMPARTMENTS.has(compartmentByKey[k]) || SURFACE_KEYS.has(k);
    return t.surface !== expected;
  });
  ok(`every surface flag matches the compartment rule (${wrong.length} deviate)`, wrong.length === 0,
     wrong.map(([k]) => k).slice(0, 8).join(" · "));
  // The plexus is EXTRADURAL — leptomeningeal disease does not reach it, so it must not be a surface.
  const plexus = Object.keys(TOPOGRAPHY).filter(k => compartmentByKey[k] === "plexus");
  ok(`the plexus is never a CSF surface (${plexus.length} keys checked)`,
     plexus.every(k => TOPOGRAPHY[k].surface === false));
}

// --- 5: the discriminations the patterns depend on ---
{
  // NB the key is `cauda|equina` — the site id is `cauda_equina`, but the level is `cauda` and the part
  // is `equina`, so the level|part key is not simply the site id.
  ok("cauda equina is a CSF surface", TOPOGRAPHY["cauda|equina"]?.surface === true);
  ok("motor cortex is NOT a surface", TOPOGRAPHY["cortex|motor_facearm"]?.surface === false);
  ok("a nerve root is a CSF surface", TOPOGRAPHY["root|l5"]?.surface === true);
  ok("anterior temporal carries the limbic system tag", TOPOGRAPHY["cortex|anterior_temporal"]?.system === "limbic");
  ok("motor cortex carries NO system tag", TOPOGRAPHY["cortex|motor_facearm"]?.system === null);
  ok("a cerebellar hemisphere carries the cerebellar system tag",
     TOPOGRAPHY["cerebellum|hemisphere"]?.system === "cerebellar");
  ok("lateral medulla carries the brainstem system tag", TOPOGRAPHY["medulla|lateral"]?.system === "brainstem");
  ok("a root carries the DRG system tag", TOPOGRAPHY["root|l5"]?.system === "DRG");
}

// --- 6: topographyOf resolves through the key ---
{
  const site = candidateSites().find(s => s.id === "left_cortex_motor_leg");
  ok("topographyOf resolves a real site", topographyOf(site)?.lobe === "frontal");
  ok("topographyOf returns null for an unknown key", topographyOf({ level: "zz", part: "zz" }) === null);
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
