// tracts.js — the long ascending/descending tracts as DECLARATIVE anatomy. New model the engine derives
// the "why" synthesis and the neuraxis diagram from (in keeping with "derive, don't store"). Each tract
// states the findings it carries, its rostro-caudal course at NEURAXIS-level granularity (the `label`
// carries the anatomical detail), and where it decussates (so laterality flips). Course levels are verified
// against structures.js by test/tracts.test.js. Corticobulbar is a deliberate fast-follow (not here).

// Rostral → caudal. `aphasia_subcortical` (striatocapsular) sits with the deep subcortex.
export const NEURAXIS = ["cortex", "subcortex", "aphasia_subcortical", "midbrain", "pons", "medulla", "cord"];
export function neuraxisIndex(level) {
  const i = NEURAXIS.indexOf(level);
  return i === -1 ? NEURAXIS.length : i; // unknown levels sort last
}

// Each tract carries a `direction` (physiological flow — descending motor / ascending sensory) and each
// course waypoint a `detail` (the structure there, as a noun phrase) + `supply` (vascular territory). These
// power the composed anatomical narrative (engine/tracts.js `tractNarrative`) and the "why not the other
// sites" discrimination; they do not affect localisation.
export const TRACTS = [
  {
    id: "corticospinal", label: "corticospinal tract", direction: "descending",
    findings: ["weak_arm", "weak_leg"],
    together: "the arm and leg fibres run close together, so a single lesion weakens both",
    course: [
      { level: "cortex",    label: "motor cortex",                      detail: "primary motor cortex",                supply: "MCA to the face/arm, ACA to the leg" },
      { level: "subcortex", label: "corona radiata / internal capsule", detail: "corona radiata and internal capsule", supply: "lenticulostriate perforators" },
      { level: "midbrain",  label: "cerebral peduncle",                 detail: "cerebral peduncle",                   supply: "PCA / basilar perforators" },
      { level: "pons",      label: "basis pontis",                      detail: "basis pontis",                        supply: "basilar perforators" },
      { level: "medulla",   label: "medullary pyramid",                 detail: "medullary pyramid",                   supply: "anterior spinal / vertebral" },
      { level: "cord",      label: "lateral corticospinal tract",       detail: "lateral corticospinal tract",         supply: "anterior spinal artery" },
    ],
    decussation: { between: ["medulla", "cord"], label: "pyramidal decussation" },
    crossingNote: "contralateral to the weakness above the pyramidal decussation, ipsilateral in the cord below it",
  },
  {
    id: "spinothalamic", label: "spinothalamic tract", direction: "ascending",
    findings: ["spinothalamic"],
    together: "the pain and temperature fibres",
    course: [
      { level: "subcortex", label: "VPL thalamus",       detail: "VPL of the thalamus",         supply: "thalamoperforators" },
      { level: "midbrain",  label: "lateral tegmentum",  detail: "lateral spinothalamic tract", supply: "PCA / basilar perforators" },
      { level: "pons",      label: "lateral tegmentum",  detail: "lateral spinothalamic tract", supply: "basilar perforators" },
      { level: "medulla",   label: "lateral medulla",    detail: "lateral medulla",             supply: "PICA / vertebral" },
      { level: "cord",      label: "anterolateral cord", detail: "anterolateral cord",          supply: "anterior spinal artery" },
    ],
    decussation: { inLevel: "cord", label: "anterior white commissure (crosses within 1–2 segments)" },
    crossingNote: "contralateral to the pain/temperature loss throughout, because it crosses low in the cord",
  },
  {
    id: "dorsal_column", label: "dorsal column–medial lemniscus", direction: "ascending",
    findings: ["dorsal_sensory", "sensory_ataxia"],
    together: "the vibration and proprioception fibres",
    course: [
      { level: "subcortex", label: "VPL thalamus",             detail: "VPL of the thalamus",        supply: "thalamoperforators" },
      { level: "midbrain",  label: "medial lemniscus",         detail: "medial lemniscus",           supply: "PCA / basilar perforators" },
      { level: "pons",      label: "medial lemniscus",         detail: "medial lemniscus",           supply: "basilar perforators" },
      { level: "medulla",   label: "gracile / cuneate nuclei", detail: "gracile and cuneate nuclei", supply: "posterior spinal / PICA" },
      { level: "cord",      label: "dorsal columns",           detail: "dorsal columns",             supply: "posterior spinal artery" },
    ],
    decussation: { between: ["medulla", "cord"], label: "sensory (internal arcuate) decussation" },
    crossingNote: "contralateral above the medullary sensory decussation, ipsilateral in the cord below it",
  },
  {
    id: "corticobulbar", label: "corticobulbar tract (to the facial nucleus)", direction: "descending",
    // Keyed on forehead_spared — the UMN discriminator. facial_weakness is deliberately excluded (it is
    // shared LMN/UMN and non-localising; keying on it would wrongly pull in peripheral facial-nerve sites).
    findings: ["forehead_spared"],
    together: "the upper-motor-neurone fibres to the facial nucleus",
    course: [
      { level: "cortex",    label: "motor cortex (face)",          detail: "primary motor cortex (face area)", supply: "MCA (lower face)" },
      { level: "subcortex", label: "genu of the internal capsule", detail: "genu of the internal capsule",     supply: "lenticulostriate perforators" },
      { level: "midbrain",  label: "cerebral peduncle",            detail: "cerebral peduncle",                supply: "PCA / basilar perforators" },
      { level: "pons",      label: "facial nucleus",               detail: "facial nucleus",                   supply: "basilar perforators" },
    ],
    decussation: { between: ["midbrain", "pons"], label: "corticobulbar decussation (to the facial nucleus)" },
    crossingNote: "contralateral to the lower-face weakness; the forehead is spared because the upper face is bilaterally innervated",
  },
];
