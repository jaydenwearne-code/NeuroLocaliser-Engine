// space.js — "separated in space", DERIVED from the authored tables. Separation is never stored.
//
// Five axes, coarsening left to right:
//   segment -> vessel -> lobe -> hemisphere -> level
// Each pattern in the multifocal roster names the axis it needs; `"any"` means the set differs on at
// least one of them.
//
// A key whose `segment` is null cannot satisfy the `segment` axis — that is the POINT of the null, not a
// gap — and falls back to whatever coarser axis the caller allows. Two nulls must never read as "the
// same place", which is why sites that cannot speak on an axis disqualify that axis rather than being
// compared as equal.
//
// Why lobe and hemisphere are axes at all (owner's ruling, 2026-08-15): two lesions in different lobes,
// or in different hemispheres, are separated in space even when they share a vascular territory. Without
// them, MS could not fire on two hemispheric lesions.
//
// Spec: docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md §3
import { vascularOf } from "../model/vascular.js";
import { topographyOf } from "../model/topography.js";

export const SEPARATION_AXES = ["segment", "vessel", "lobe", "hemisphere", "level"];

// The value of one site on one axis. `null` means "this axis cannot speak for this site".
function valueOn(site, axis) {
  if (axis === "hemisphere") return site.side || null;
  if (axis === "level") return site.level || null;
  if (axis === "lobe") return topographyOf(site)?.lobe ?? null;
  const v = vascularOf(site);
  if (!v) return null;
  if (axis === "vessel") return v.vessel ?? null;
  if (axis === "segment") return v.segment ?? null;
  return null;
}

export function separatedInSpace(sites, axis = "any") {
  if (!Array.isArray(sites) || sites.length < 2) return false;
  if (axis === "any") return SEPARATION_AXES.some(a => separatedInSpace(sites, a));
  const values = sites.map(s => valueOn(s, axis)).filter(v => v !== null);
  // Every site must be able to speak on this axis, or the axis cannot establish separation.
  if (values.length !== sites.length) return false;
  return new Set(values).size > 1;
}
