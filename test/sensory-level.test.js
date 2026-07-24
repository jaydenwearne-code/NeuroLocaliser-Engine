// sensory-level.test.js — the sensory-level (dermatomal) mechanism.
// Level is ORTHOGONAL to the cross-sectional pattern: it never changes which site wins, it only
// reports WHERE along the cord. Run: node test/sensory-level.test.js

import { solve } from "../src/engine/inverse.js";
import { CORD_LEVELS, levelIndex, isBelow, regionOf, landmarkOf, isKnownLevel } from "../src/model/levels.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }
function eq(label, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want);
  log.push({ label, ok: good, got, want });
  good ? pass++ : fail++;
}

// ---- levels.js units ----
ok("CORD_LEVELS indices strictly monotonic", CORD_LEVELS.every((n, i) => levelIndex(n) === i));
ok("isBelow(T11, T10) is true", isBelow("T11", "T10") === true);
ok("isBelow(T10, T11) is false", isBelow("T10", "T11") === false);
eq("regionOf(L1)", regionOf("L1"), "lumbar");
eq("landmarkOf(T10)", landmarkOf("T10"), "umbilicus");
ok("unknown level not known", isKnownLevel("Z9") === false);
ok("case/space-insensitive", isKnownLevel(" t10 ") === true);

// ---- solve() level layer ----
const brownSeq = ["weak_arm@left","weak_leg@left", "dorsal_sensory@left", "spinothalamic@right"];
const asa = ["weak_arm@left","weak_leg@left","weak_arm@right","weak_leg@right","spinothalamic@left","spinothalamic@right"];
const weber = ["ptosis@left","weak_adduction@left","weak_elevation@left","weak_depression@left","weak_arm@right","weak_leg@right","facial_weakness@right","forehead_spared@right"];

// 1. Pin — cord + valid level
{
  const { best, level } = solve(new Set(brownSeq), { sensoryLevel: "T10" });
  ok("Brown-Séquard+T10 -> left_cord_hemi", best && best.site.id === "left_cord_hemi");
  ok("  level applies", level.applies === true);
  eq("  segment", level.segment, "T10");
  eq("  region", level.region, "thoracic");
}
// 2. Agnostic — cord, no level
{
  const { best, level } = solve(new Set(brownSeq));
  ok("Brown-Séquard (no level) -> left_cord_hemi", best && best.site.id === "left_cord_hemi");
  ok("  level undetermined", level.applies === false && level.segment === null);
}
// 3. Second pattern + level
{
  const { best, level } = solve(new Set(asa), { sensoryLevel: "T4" });
  ok("ASA+T4 -> bilateral_cord_anterior", best && best.site.id === "bilateral_cord_anterior");
  eq("  segment", level.segment, "T4");
  eq("  region", level.region, "thoracic");
}
// 5. Inconsistency — non-cord best but a level was given
{
  const { best, level } = solve(new Set(weber), { sensoryLevel: "T10" });
  ok("Weber+T10 -> left_midbrain_medial", best && best.site.id === "left_midbrain_medial");
  ok("  level does not apply", level.applies === false);
  ok("  note flags inconsistency", /suggests a spinal cord lesion/.test(level.note));
}
// 6. Graceful invalid — cord + unknown level, no throw
{
  const { best, level } = solve(new Set(brownSeq), { sensoryLevel: "Z9" });
  ok("cord+invalid -> still left_cord_hemi", best && best.site.id === "left_cord_hemi");
  ok("  level not applied", level.applies === false);
  ok("  note flags unrecognised", /unrecognised/.test(level.note));
}

// ---- report ----
console.log("\nNeuroLocaliser — SENSORY-LEVEL mechanism tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}` + (r.ok ? "" : `  (got ${JSON.stringify(r.got)}, want ${JSON.stringify(r.want)})`));
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
