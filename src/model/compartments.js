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
  "optic", "pupil", "sympathetic", "skull_base", "root", "plexus", "nerve", "motor_unit",
];

// Every level produced by candidateSites() must appear here (asserted in test/compartments.test.js).
export const LEVEL_COMPARTMENT = {
  // --- supratentorial ---
  cortex: "brain", subcortex: "brain", cerebrum: "brain", corpus_callosum: "brain",
  aphasia_subcortical: "brain", thalamus: "brain", thalamus_arousal: "brain",
  hypothalamus: "brain", basal_ganglia: "brain", olfactory: "brain",
  // --- brainstem (incl. the composite/functional brainstem levels) ---
  // NB: there is no "brainstem" level — the old hand-written INTRACRANIAL_LEVELS listed one, but no
  // site uses it. The real level is brainstem_aras, which that list omitted. `parinaud` is kept even
  // though no site uses it as a level today, because the original set named it and the regression
  // guard still expects it.
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
  // `pupil` and `sympathetic` are EACH THEIR OWN compartment, deliberately not folded into `optic` or
  // `skull_base`. Folding them in was a real bug (reviewer-verified, 2026-08-14 final fix wave): with
  // `pupil` inside `optic`, an efferent pupillary lesion (e.g. left_pupil_cn3_compressive, a PCOM
  // aneurysm) satisfied NMOSD's afferent-visual-pathway clause `{compartment:"optic"}` alongside a cord
  // site, so a blown pupil + a cord lesion returned NMOSD. With `sympathetic` inside `skull_base`, an
  // apical lung (Pancoast) lesion satisfied Neurosarcoidosis's and NF2's skull-base cranial-neuropathy
  // clause alongside a cord site, putting a lung tumour in the skull base. Do not re-merge either.
  visual_pathway: "optic", pupil: "pupil",
  sympathetic: "sympathetic",
  // --- skull base / peripheral vestibular ---
  skull_base: "skull_base", peripheral_vestibular: "skull_base",
  // --- peripheral nervous system ---
  root: "root", plexus: "plexus", nerve: "nerve", polyneuropathy: "nerve",
  motor_unit: "motor_unit",
};

// Which compartments sit inside the skull. `cord` and everything distal are excluded — that is exactly
// what the raised-pressure (papilloedema) axis means when it says "inside the skull".
// `pupil` is included so the derived INTRACRANIAL_LEVELS set is UNCHANGED by giving pupil its own
// compartment (it was reached via `optic` before the split; see the comment above LEVEL_COMPARTMENT).
// `sympathetic` is deliberately NOT included — it was never intracranial (it mapped to `skull_base`,
// which is also not in this set), and a Pancoast tumour must not become intracranial by accident.
export const INTRACRANIAL_COMPARTMENTS = new Set(["brain", "brainstem", "cerebellum", "optic", "pupil"]);

export function compartmentOf(site) {
  return LEVEL_COMPARTMENT[site.level] || null;
}
