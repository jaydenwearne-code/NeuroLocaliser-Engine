// forward.js — the forward model: lesion a site, get expected findings.
//
// Given a site (which knows its structures and its side), produce the set of findings a
// lesion there would cause, each tagged with the BODY SIDE it appears on. Body side is
// derived from the lesion side plus whether the pathway crosses (CROSSES in findings.js):
//   - non-crossing finding  -> same side as the lesion   (ipsilateral)
//   - crossing finding      -> opposite side to the lesion (contralateral)
//
// The output is a set of "signed findings": `${findingId}@${bodySide}`. The inverse solver
// compares observed signed findings against these.

import { STRUCTURE_BY_ID } from "../model/structures.js";
import { CROSSES, NON_LATERALISED } from "../model/findings.js";
import { normaliseLevel, isBelow } from "../model/levels.js";

export function otherSide(side) { return side === "left" ? "right" : "left"; }

// Does this finding cross, for THIS structure? A structure may override the finding-level
// default (findings.CROSSES) because the same pathway crosses differently depending on where
// the lesion is — e.g. the corticospinal tract is contralateral in the brainstem but
// ipsilateral in the cord (below its decussation). Structures without a `crosses` field inherit
// the finding-level default, so the brainstem model is unchanged.
function crossesFor(struct, findingId) {
  return struct && Object.prototype.hasOwnProperty.call(struct, "crosses")
    ? struct.crosses
    : CROSSES[findingId];
}

// Body side on which a finding appears, given the lesion side and (optionally) the structure.
export function bodySideFor(findingId, lesionSide, struct) {
  return crossesFor(struct, findingId) ? otherSide(lesionSide) : lesionSide;
}

export function signed(findingId, bodySide) { return `${findingId}@${bodySide}`; }

// Required lesion side for a hemisphere-gated structure, given the dominant side.
// dominant -> the dominant hemisphere; nondominant -> the other. Returns null if ungated.
function requiredSideFor(struct, dominantSide) {
  if (!struct || !struct.hemisphere) return null;
  return struct.hemisphere === "dominant" ? dominantSide : otherSide(dominantSide);
}

// Should this structure emit at this site, given the dominant side? Applies the two cortical gates.
// Structures without hemisphere/bilateralOnly (every non-cortex structure) always pass.
function structActiveAt(struct, site, dominantSide) {
  // Bilateral-only structures (Anton, Balint) manifest ONLY on a both-hemispheres site.
  if (struct.bilateralOnly && site.side !== "bilateral") return false;
  // Hemisphere-gated structures emit only on the matching unilateral (left/right) side;
  // on bilateral or midline sites they do not emit (the mirror is a unilateral discriminator).
  if (struct.hemisphere) {
    if (site.side !== "left" && site.side !== "right") return false;
    if (site.side !== requiredSideFor(struct, dominantSide)) return false;
  }
  return true;
}

// Expected signed findings for a lesion at a site. Emission per structure:
//   - non-lateralised findings (higher-cortical/behavioural) -> `${finding}@none`
//   - midline site  -> `${finding}@midline`
//   - bilateral site -> both `@left` and `@right`
//   - one-sided site -> crossing rule places it ipsi/contra
// Two gates run first (structActiveAt): bilateral-only and hemisphere (dominant/non-dominant).
export function expectedFindings(site, opts = {}) {
  const dominantSide = opts.dominantSide || "left";
  const out = new Set();
  for (const structId of site.structures) {
    const struct = STRUCTURE_BY_ID[structId];
    if (!struct) continue;
    if (!structActiveAt(struct, site, dominantSide)) continue;
    // Level-gated emission (the first time the sensory level gates emission, not just annotates): a
    // structure with `emitAtOrAbove` fires only when a valid sensory level at/above that segment is
    // supplied — restrictive default (no level → skip). Used by the cord oculosympathetic (Horner ≥ ~T1).
    if (struct.emitAtOrAbove) {
      const lvl = normaliseLevel(opts.sensoryLevel);
      if (!lvl || isBelow(lvl, struct.emitAtOrAbove)) continue;
    }
    const f = struct.produces;
    if (NON_LATERALISED.has(f)) {
      out.add(signed(f, "none"));
    } else if (site.side === "midline") {
      out.add(signed(f, "midline"));
    } else if (site.side === "bilateral") {
      out.add(signed(f, "left"));
      out.add(signed(f, "right"));
    } else {
      out.add(signed(f, bodySideFor(f, site.side, struct)));
    }
  }
  return out;
}

// Human-readable explanation: which structure produced each expected finding (and on which side).
export function explain(site, opts = {}) {
  const dominantSide = opts.dominantSide || "left";
  return site.structures.flatMap(structId => {
    const s = STRUCTURE_BY_ID[structId];
    if (!s || !structActiveAt(s, site, dominantSide)) return [];
    if (s.emitAtOrAbove) {
      const lvl = normaliseLevel(opts.sensoryLevel);
      if (!lvl || isBelow(lvl, s.emitAtOrAbove)) return [];
    }
    const f = s.produces;
    const sides = NON_LATERALISED.has(f) ? ["none"]
      : site.side === "midline" ? ["midline"]
      : site.side === "bilateral" ? ["left", "right"]
      : [bodySideFor(f, site.side, s)];
    return sides.map(bodySide => ({ finding: f, bodySide, structure: s.id, note: s.note }));
  });
}
