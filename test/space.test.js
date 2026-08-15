// space.test.js — "separated in space", derived from the authored tables and never stored.
//
// Five axes, coarsening left to right: segment -> vessel -> lobe -> hemisphere -> level.
// `"any"` means the set differs on AT LEAST ONE axis. A key whose segment is null simply cannot satisfy
// the `segment` axis; it falls back to whatever coarser axis the caller allows.
//
// Spec: docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md §3
// Run: node test/space.test.js
import { SEPARATION_AXES, separatedInSpace } from "../src/engine/space.js";
import { candidateSites } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

const site = id => candidateSites().find(s => s.id === id);

// The owner's reported case: right ACA-A4 paracentral + left MCA-M4 precentral.
const rLeg = site("right_cortex_motor_leg");
const lArm = site("left_cortex_motor_facearm");

{
  ok("SEPARATION_AXES is the five documented axes",
     SEPARATION_AXES.join(",") === "segment,vessel,lobe,hemisphere,level");
  ok("the two fixture sites exist", !!rLeg && !!lArm);
}

// --- the reported case, axis by axis ---
{
  ok("separated at `segment` (A4 vs M4)", separatedInSpace([rLeg, lArm], "segment"));
  ok("separated at `vessel` (ACA vs MCA)", separatedInSpace([rLeg, lArm], "vessel"));
  ok("NOT separated at `lobe` (both frontal)", !separatedInSpace([rLeg, lArm], "lobe"));
  ok("separated at `hemisphere` (right vs left)", separatedInSpace([rLeg, lArm], "hemisphere"));
  ok("NOT separated at `level` (both cortex)", !separatedInSpace([rLeg, lArm], "level"));
  ok("separated at `any` — it differs on three axes", separatedInSpace([rLeg, lArm], "any"));
}

// --- the same site twice is never separated, on any axis ---
{
  for (const axis of [...SEPARATION_AXES, "any"]) {
    ok(`one site repeated is NOT separated at \`${axis}\``, !separatedInSpace([rLeg, rLeg], axis));
  }
}

// --- a null segment cannot satisfy the segment axis, but can satisfy a coarser one ---
// This is the point of a null: it disqualifies the fine axis rather than reading as "same segment".
{
  const watershed = site("left_cortex_watershed_anterior");   // segment: null
  const occipital = site("left_cortex_occipital");            // PCA P4
  ok("the fixture sites exist", !!watershed && !!occipital);
  ok("a null-segment key is NOT separated at `segment`", !separatedInSpace([watershed, occipital], "segment"));
  ok("...but IS separated at `vessel` (ACA-MCA vs PCA)", separatedInSpace([watershed, occipital], "vessel"));
  ok("...and therefore at `any`", separatedInSpace([watershed, occipital], "any"));
}

// --- two sites the vascular table cannot speak for at all ---
// Peripheral nerves have no vascular row, so the vascular axes must stay silent rather than guess.
{
  const n1 = site("left_nerve_radial_axilla");
  const n2 = site("left_nerve_median_proximal");
  ok("peripheral nerves are NOT separated at `segment` (no vascular row)",
     !separatedInSpace([n1, n2], "segment"));
  ok("peripheral nerves are NOT separated at `vessel` (no vascular row)",
     !separatedInSpace([n1, n2], "vessel"));
  ok("...but ARE separated at `level`? no — both are `nerve`", !separatedInSpace([n1, n2], "level"));
}

// --- separation across the neuraxis ---
{
  const cord = site("left_cord_hemi");
  ok("cortex vs cord is separated at `level`", separatedInSpace([lArm, cord], "level"));
  ok("cortex vs cord is separated at `any`", separatedInSpace([lArm, cord], "any"));
}

// --- degenerate inputs ---
{
  ok("fewer than two sites is never separated", !separatedInSpace([rLeg], "any"));
  ok("an empty set is never separated", !separatedInSpace([], "any"));
  ok("a non-array is never separated", !separatedInSpace(null, "any"));
  ok("an unknown axis name is never separated", !separatedInSpace([rLeg, lArm], "not_an_axis"));
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
