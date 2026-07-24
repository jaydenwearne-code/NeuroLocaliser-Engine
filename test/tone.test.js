// tone.test.js — muscle TONE (spasticity / hypotonia) and WASTING as anatomy-layer findings that
// complete the UMN-vs-LMN discriminator (no new mechanism; the shape of the reflexes increment):
//   * spasticity (increased tone) — a corticospinal (UMN) companion at EVERY level the tract is
//     modelled; non-localising; crossing follows the tract (contra by default; cord + conus ipsi/local);
//   * hypotonia (reduced tone) — GENERALISED-flaccid LMN only (anterior horn, cauda, polyneuropathy);
//   * wasting (atrophy) — the broad LMN set (anterior horn, cauda, polyneuropathy, roots, motor nerves),
//     but NOT pure-sensory lat_fem_cutaneous, NOT NMJ/muscle, and NEVER on the UMN side.
// Run: node test/tone.test.js
import { FINDINGS, CROSSES, NON_LATERALISED, isFinding } from "../src/model/findings.js";
import { LOCALISING } from "../src/engine/score.js";
import { STRUCTURES } from "../src/model/structures.js";
import { expectedFindings } from "../src/engine/forward.js";
import { SITE_BY_ID, composeHemiLevelSites, composeMotorUnitSites,
         composePolyneuropathySites, composeCaudaConusSites } from "../src/model/sites.js";
import { solve } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

const producersOf = f => STRUCTURES.filter(s => s.produces === f);
const levelsProducing = f => [...new Set(producersOf(f).map(s => s.level))].sort();
const partsProducing  = f => [...new Set(producersOf(f).map(s => s.part))].sort();

// --- 1: vocabulary & policy ---
for (const id of ["spasticity","hypotonia","wasting"]) ok(`finding ${id} exists`, isFinding(id));
ok("spasticity crosses (UMN, follows corticospinal — contra by default)", CROSSES.spasticity === true);
ok("hypotonia does not cross (LMN, local)", CROSSES.hypotonia === false);
ok("wasting does not cross (LMN, local)", CROSSES.wasting === false);
for (const id of ["spasticity","hypotonia","wasting"]) ok(`${id} is NOT localising`, !LOCALISING.has(id));
for (const id of ["spasticity","hypotonia","wasting"]) ok(`${id} is lateralised (not @none)`, !NON_LATERALISED.has(id));

// --- 2: structures ---
ok("spasticity produced across the whole corticospinal tract",
   ["midbrain","pons","medulla","cord","subcortex","cortex","conus"].every(l => levelsProducing("spasticity").includes(l)));
ok("the CORD + CONUS spasticity are ipsilateral/local (crosses:false)",
   producersOf("spasticity").filter(s => s.level === "cord" || s.level === "conus").every(s => s.crosses === false));
ok("hypotonia is generalised-flaccid ONLY (anterior horn, cauda, polyneuropathy)",
   JSON.stringify(levelsProducing("hypotonia")) === JSON.stringify(["cauda","motor_unit","polyneuropathy"]));
ok("hypotonia only at the anterior horn part of the motor unit",
   producersOf("hypotonia").filter(s => s.level === "motor_unit").every(s => s.part === "anterior_horn"));
ok("wasting spans the broad LMN set (motor unit, cauda, polyneuropathy, root, nerve)",
   ["motor_unit","cauda","polyneuropathy","root","nerve"].every(l => levelsProducing("wasting").includes(l)));
ok("wasting at all 10 roots", producersOf("wasting").filter(s => s.level === "root").length === 10);
ok("wasting at 20 motor-nerve sites (9 unsegmented + 11 segments; EXCEPT pure-sensory lat_fem_cutaneous)",
   producersOf("wasting").filter(s => s.level === "nerve").length === 20);
ok("NO wasting at pure-sensory lat_fem_cutaneous", !partsProducing("wasting").includes("lat_fem_cutaneous"));
ok("NO wasting at NMJ or muscle (weakness without wasting)",
   !producersOf("wasting").some(s => ["nmj_postsynaptic","nmj_presynaptic","muscle"].includes(s.part)));
ok("UMN has NO wasting — spasticity levels and wasting levels are disjoint",
   levelsProducing("spasticity").every(l => !levelsProducing("wasting").includes(l)));

// --- 3: forward emission (crossing follows the system) ---
{
  const hemi = Object.fromEntries(composeHemiLevelSites().map(s => [s.id, s]));
  const cordHemi = expectedFindings(hemi.left_cord_hemi);
  ok("left hemicord -> spasticity@left (ipsi, below the level)", cordHemi.has("spasticity@left"));
  const midbrain = expectedFindings(SITE_BY_ID.left_midbrain_medial);
  ok("left medial midbrain -> spasticity@right (contra)", midbrain.has("spasticity@right"));

  const ah = Object.fromEntries(composeMotorUnitSites().map(s => [s.id, s]));
  const ahExp = expectedFindings(ah.motor_unit_anterior_horn);
  ok("anterior horn (bilateral) -> hypotonia@left and @right", ahExp.has("hypotonia@left") && ahExp.has("hypotonia@right"));
  ok("anterior horn (bilateral) -> wasting@left and @right", ahExp.has("wasting@left") && ahExp.has("wasting@right"));

  const l5 = expectedFindings(SITE_BY_ID.right_root_l5);
  ok("right L5 root -> wasting@right (focal LMN wastes)", l5.has("wasting@right"));
  ok("right L5 root -> NO hypotonia (focal LMN keeps normal tone)", !l5.has("hypotonia@right"));

  const poly = Object.fromEntries(composePolyneuropathySites().map(s => [s.id, s]));
  const polyExp = expectedFindings(poly.polyneuropathy_length_dependent);
  ok("polyneuropathy -> hypotonia + wasting (bilateral)", polyExp.has("hypotonia@left") && polyExp.has("wasting@right"));

  const cc = Object.fromEntries(composeCaudaConusSites().map(s => [s.id, s]));
  const caudaExp = expectedFindings(cc.cauda_equina);
  ok("cauda equina -> hypotonia@midline + wasting@midline", caudaExp.has("hypotonia@midline") && caudaExp.has("wasting@midline"));
}

// --- 4: tone is a NON-localising annotation (never moves the winner) ---
{
  const without = solve(new Set(["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left","weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right"])).best;
  const withSpast = solve(new Set(["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left","weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right","spasticity@right"])).best;
  ok("Weber localises to medial midbrain without spasticity", without && without.site.id === "left_midbrain_medial");
  ok("...and still with spasticity (non-localising annotation)", withSpast && withSpast.site.id === "left_midbrain_medial");
}

// --- 5: UMN-vs-LMN discrimination — the generalised-flaccid picture rides the anterior horn ---
{
  const lmn = solve(new Set(["lmn_weakness@left","lmn_weakness@right","wasting@left","wasting@right",
                             "hypotonia@left","hypotonia@right","fasciculations@left","fasciculations@right"])).best;
  ok("flaccid + wasting + hypotonia + fasciculations -> anterior horn (LMN)", lmn && lmn.site.id === "motor_unit_anterior_horn");
}

// --- 6: ALS precursor — UMN and LMN NEVER co-locate (so ALS must span >=2 sites) ---
{
  const byPart = new Map();
  for (const s of STRUCTURES) {
    const key = `${s.level}|${s.part}`;
    if (!byPart.has(key)) byPart.set(key, new Set());
    byPart.get(key).add(s.produces);
  }
  const coLocated = [...byPart.values()].some(set => set.has("spasticity") && set.has("wasting"));
  ok("no single site produces BOTH spasticity and wasting (UMN+LMN co-occurrence spans sites — ALS precursor)", !coLocated);
}

// ---- report ----
console.log("\nNeuroLocaliser — TONE & WASTING (UMN-vs-LMN axis) tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
