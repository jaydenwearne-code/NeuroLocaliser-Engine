// course.js — HOW THE ILLNESS UNFOLDED, an axis orthogonal to localisation.
//
// Onset tempo (TEMPO in causes.js) says how fast it started. Course says how it evolved, and for the
// cross-site roster it is much the stronger discriminator: vasculitis is stepwise, MS relapsing, MND
// progressive, an embolic shower simultaneous. Without it, MS, metastases and MND all present as
// "two CNS sites, subacute".
//
// Like the sensory level and the raised-pressure axis, this ANNOTATES and DEMOTES — it never changes
// which sites are candidates. It is deliberately NOT applied to per-site causes: the 1286 CAUSES entries
// carry `tempo` and no `course` field, so passing it to causesFor() would be a silent no-op.
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §5

export const COURSES = [
  { id: "single",       label: "Single event" },
  { id: "simultaneous", label: "All at once (simultaneous)" },
  { id: "stepwise",     label: "Stepwise (discrete events, plateaus between)" },
  { id: "relapsing",    label: "Relapsing–remitting (partial recovery between)" },
  { id: "progressive",  label: "Steadily progressive (no recovery)" },
];

export const COURSE_IDS = new Set(COURSES.map(c => c.id));
