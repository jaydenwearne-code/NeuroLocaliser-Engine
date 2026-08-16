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
  // NB: TWO phantom levels from the old hand-written INTRACRANIAL_LEVELS are deliberately absent here.
  // `brainstem` — no site uses it; the real level is brainstem_aras, which that list omitted.
  // `parinaud` — no site uses it either; the Parinaud site's level is dorsal_midbrain. It was carried
  // over on the first pass purely because the regression guard still named it, which is a dead entry
  // masquerading as coverage. Removed 2026-08-15 along with its entry in that guard.
  midbrain: "brainstem", pons: "brainstem", medulla: "brainstem", brainstem_aras: "brainstem",
  pontomesencephalic: "brainstem", dorsal_midbrain: "brainstem",
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

// A site's LEVEL is a bony/anatomical grouping (which corridor or fossa it sits in); its COMPARTMENT is a
// functional grouping (which system it belongs to for cross-site pathology purposes). The two can
// legitimately disagree. Three PARTS at level `skull_base` are exactly this case: `optic_neuritis`,
// `optic_aion` and `optic_canal` share the skull-base BONY corridor with the cranial nerves, but they ARE
// the optic nerve — functionally CNS/visual-pathway, not a cranial neuropathy. Left at `skull_base`, they
// satisfied Neurosarcoidosis's/NF2's skull-base cranial-neuropathy clause instead of NMOSD's `optic`+`cord`
// clause, so "optic neuritis + a cord lesion" — the archetypal NMOSD presentation — could never name NMOSD
// (owner ruling, 2026-08-14). This table is a per-(level,part) OVERRIDE consulted before the level table;
// every other skull_base site (and the level table entry for `skull_base` itself, which INTRACRANIAL_LEVELS
// in inverse.js reads directly) is untouched — see test/compartments.test.js for the regression guard.
const COMPARTMENT_OVERRIDE = {
  "skull_base|optic_neuritis": "optic",
  "skull_base|optic_aion": "optic",
  "skull_base|optic_canal": "optic",
};

export function compartmentOf(site) {
  const override = COMPARTMENT_OVERRIDE[`${site.level}|${site.part}`];
  if (override) return override;
  return LEVEL_COMPARTMENT[site.level] || null;
}
