// stations.js — a readable projection of the model's levels onto the neuraxis (integrated Why, spec
// 2026-09-26). A STATION is where along the nervous system a lesion sits, in words a clinician reads:
// "medulla", "nerve root". Keyed by level, with a `${level}|${part}` override where a part sits in a
// different station from its level — NEVER keyed by part alone (`lateral`, `thalamus` recur across levels).
//
// `group` drives the side-reason phrasing (src/data/sideReasons.js). ORDER is the display order; AXIS is the
// long-tract spine along which "could arise at" compresses a run of three or more into "A → B".
// Owner-approved 2026-09-26 (spec §4.2).
export const STATIONS = [
  { id: "cerebral cortex",   group: "hemisphere" },
  { id: "corpus callosum",   group: "hemisphere" },
  { id: "deep white matter", group: "hemisphere" },
  { id: "basal ganglia",     group: "hemisphere" },
  { id: "thalamus",          group: "hemisphere" },
  { id: "hypothalamus",      group: "hemisphere" },
  { id: "midbrain",          group: "brainstem" },
  { id: "pons",              group: "brainstem" },
  { id: "medulla",           group: "brainstem" },
  { id: "brainstem (several levels)", group: "brainstem" },
  { id: "cerebellum",        group: "cerebellum" },
  { id: "spinal cord",       group: "cord" },
  { id: "conus",             group: "cord" },
  { id: "cauda equina",      group: "peripheral" },
  { id: "nerve root",        group: "peripheral" },
  { id: "plexus",            group: "peripheral" },
  { id: "peripheral nerve",  group: "peripheral" },
  { id: "motor unit",        group: "peripheral" },
  { id: "cranial nerve",     group: "peripheral" },
  { id: "inner ear",         group: "peripheral" },
  { id: "visual pathway",    group: "peripheral" },
  { id: "pupil pathway",     group: "peripheral" },
  { id: "sympathetic chain", group: "peripheral" },
  { id: "olfactory",         group: "peripheral" },
];
export const STATION_ORDER = STATIONS.map(s => s.id);
export const STATION_GROUP = Object.fromEntries(STATIONS.map(s => [s.id, s.group]));
export const AXIS = ["cerebral cortex", "deep white matter", "midbrain", "pons", "medulla", "spinal cord"];

const BY_LEVEL = {
  cortex: "cerebral cortex", cerebrum: "cerebral cortex",
  corpus_callosum: "corpus callosum",
  subcortex: "deep white matter", pseudobulbar: "deep white matter",
  basal_ganglia: "basal ganglia",
  thalamus: "thalamus", thalamus_arousal: "thalamus",
  hypothalamus: "hypothalamus",
  midbrain: "midbrain", dorsal_midbrain: "midbrain",
  pons: "pons", locked_in: "pons", pontomesencephalic: "pons",
  medulla: "medulla", craniocervical_junction: "medulla",
  brainstem_aras: "brainstem (several levels)", guillain_mollaret: "brainstem (several levels)",
  central_vestibular: "brainstem (several levels)",
  cerebellum: "cerebellum",
  cord: "spinal cord", combined_degeneration: "spinal cord",
  conus: "conus", cauda: "cauda equina",
  root: "nerve root", polyradiculoneuropathy: "nerve root",
  plexus: "plexus",
  nerve: "peripheral nerve", polyneuropathy: "peripheral nerve",
  motor_unit: "motor unit",
  skull_base: "cranial nerve",
  peripheral_vestibular: "inner ear",
  visual_pathway: "visual pathway",
  pupil: "pupil pathway",
  sympathetic: "sympathetic chain",
  olfactory: "olfactory",
};
const BY_PART = {
  "subcortex|thalamus": "thalamus",
  "aphasia_subcortical|thalamic": "thalamus",
  "aphasia_subcortical|striatocapsular": "deep white matter",
  "skull_base|optic_aion": "visual pathway",
  "skull_base|optic_neuritis": "visual pathway",
  "skull_base|optic_canal": "visual pathway",
};
export const stationOf = site => BY_PART[`${site.level}|${site.part}`] || BY_LEVEL[site.level] || null;
