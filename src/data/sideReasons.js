// sideReasons.js — CONTENT ONLY: the phrases the integrated Why uses to explain why a finding is on the side it
// is (spec 2026-09-26 §4.3, owner-approved; wording refined §6). The side itself is DERIVED by the forward
// model — these only say why. The choosing logic lives in src/engine/why.js.
//
// The crossing phrases are direction-free on purpose: a descending tract in the cord has crossed ABOVE the
// lesion and an ascending tract in the medulla has not crossed yet — both give "same side". What decides it is
// whether the crossing lies BETWEEN the lesion and the side the pathway serves.
export const REASON = {
  both: "both sides — the lesion crosses the midline",
  midline: "midline — no side",
  noneDominant: "no side — a dominant-hemisphere function",
  noneNondominant: "no side — a non-dominant-hemisphere function",
  none: "no side",
  crossOpposite: "opposite side — the {tract} crosses at the {crossing}, and that crossing lies between this level and the side it serves",
  crossSame: "same side — the {tract} crosses at the {crossing}, but that crossing does not lie between this level and the side it serves",
  hemisphereOpposite: "opposite side — each hemisphere serves the other side of the body",
  cerebellumSame: "same side — the cerebellum coordinates its own side",
  brainstemSame: "same side — brainstem nuclei and cranial nerves serve their own side",
  brainstemOpposite: "opposite side — this pathway has already crossed at this level",
  peripheralSame: "same side — a nerve serves its own side",
  same: "same side",
  opposite: "opposite side",
};

// Tracts whose SAME side needs its own sentence: the cerebellar outflow crosses twice (so "does not cross"
// would be wrong); the oculosympathetic pathway genuinely never crosses.
export const TRACT_SAME = {
  cerebellar: "same side — the cerebellar outflow crosses twice, so each cerebellar pathway serves its own side",
  oculosympathetic: "same side — the oculosympathetic pathway does not cross",
};

// A crossing whose model label is a sentence rather than a name.
export const CROSSING_NAME = { mlf: "abducens internuclear crossing in the pons" };
