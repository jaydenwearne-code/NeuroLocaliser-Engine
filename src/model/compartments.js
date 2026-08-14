// compartments.js — the level -> COMPARTMENT axis.
//
// `regionOf()` in causes.js splits sites five ways for choosing a workup flavour, but it lumps brain and
// cord together as `parenchyma`. The multifocal roster needs them apart: "disseminated in space" for MS
// means brain AND cord, and a predicate that cannot tell them apart cannot express it.
//
// This is also the SINGLE SOURCE OF TRUTH for "inside the skull" — inverse.js derives INTRACRANIAL_LEVELS
// from it rather than keeping a second overlapping list.
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §1

export const COMPARTMENTS = [
  "brain", "brainstem", "cerebellum", "cord", "cauda",
  "optic", "skull_base", "root", "plexus", "nerve", "motor_unit",
];

// Every level produced by candidateSites() must appear here (asserted in test/compartments.test.js).
export const LEVEL_COMPARTMENT = {
  // --- supratentorial ---
  cortex: "brain", subcortex: "brain", cerebrum: "brain", corpus_callosum: "brain",
  aphasia_subcortical: "brain", thalamus: "brain", thalamus_arousal: "brain",
  hypothalamus: "brain", basal_ganglia: "brain", olfactory: "brain",
  // --- brainstem (incl. the composite/functional brainstem levels) ---
  // `brainstem` itself is not a level any current site uses — it is kept here only so the derived
  // INTRACRANIAL_LEVELS set matches the original hand-maintained set exactly (regression parity; see
  // test/compartments.test.js's EXPECTED list, which still names it). `parinaud` is the same: no site
  // uses it as a level today, but the original set named it and the regression guard still expects it.
  brainstem: "brainstem",
  midbrain: "brainstem", pons: "brainstem", medulla: "brainstem", brainstem_aras: "brainstem",
  pontomesencephalic: "brainstem", dorsal_midbrain: "brainstem", parinaud: "brainstem",
  locked_in: "brainstem", pseudobulbar: "brainstem", guillain_mollaret: "brainstem",
  central_vestibular: "brainstem", craniocervical_junction: "brainstem",
  // --- cerebellum ---
  cerebellum: "cerebellum",
  // --- cord and below ---
  cord: "cord", combined_degeneration: "cord", conus: "cord",
  cauda: "cauda",
  // --- visual + pupil + sympathetic axes ---
  visual_pathway: "optic", pupil: "optic",
  sympathetic: "skull_base",
  // --- skull base / peripheral vestibular ---
  skull_base: "skull_base", peripheral_vestibular: "skull_base",
  // --- peripheral nervous system ---
  root: "root", plexus: "plexus", nerve: "nerve", polyneuropathy: "nerve",
  motor_unit: "motor_unit",
};

// Which compartments sit inside the skull. `cord` and everything distal are excluded — that is exactly
// what the raised-pressure (papilloedema) axis means when it says "inside the skull".
export const INTRACRANIAL_COMPARTMENTS = new Set(["brain", "brainstem", "cerebellum", "optic"]);

export function compartmentOf(site) {
  return LEVEL_COMPARTMENT[site.level] || null;
}
