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

export const TRACTS = [
  {
    id: "corticospinal", label: "corticospinal tract",
    findings: ["weak_arm", "weak_leg"],
    together: "the arm and leg fibres run close together, so a single lesion weakens both",
    course: [
      { level: "cortex",   label: "motor cortex" },
      { level: "subcortex", label: "corona radiata / internal capsule" },
      { level: "midbrain", label: "cerebral peduncle" },
      { level: "pons",     label: "basis pontis" },
      { level: "medulla",  label: "medullary pyramid" },
      { level: "cord",     label: "lateral corticospinal tract" },
    ],
    decussation: { between: ["medulla", "cord"], label: "pyramidal decussation" },
    crossingNote: "contralateral to the weakness above the pyramidal decussation, ipsilateral in the cord below it",
  },
  {
    id: "spinothalamic", label: "spinothalamic tract",
    findings: ["spinothalamic"],
    together: "the pain and temperature fibres",
    course: [
      { level: "subcortex", label: "VPL thalamus" },
      { level: "midbrain", label: "lateral tegmentum" },
      { level: "pons",     label: "lateral tegmentum" },
      { level: "medulla",  label: "lateral medulla" },
      { level: "cord",     label: "anterolateral cord" },
    ],
    decussation: { inLevel: "cord", label: "anterior white commissure (crosses within 1–2 segments)" },
    crossingNote: "contralateral to the pain/temperature loss throughout, because it crosses low in the cord",
  },
  {
    id: "dorsal_column", label: "dorsal column–medial lemniscus",
    findings: ["dorsal_sensory", "sensory_ataxia"],
    together: "the vibration and proprioception fibres",
    course: [
      { level: "subcortex", label: "VPL thalamus" },
      { level: "midbrain", label: "medial lemniscus" },
      { level: "pons",     label: "medial lemniscus" },
      { level: "medulla",  label: "gracile / cuneate nuclei" },
      { level: "cord",     label: "dorsal columns" },
    ],
    decussation: { between: ["medulla", "cord"], label: "sensory (internal arcuate) decussation" },
    crossingNote: "contralateral above the medullary sensory decussation, ipsilateral in the cord below it",
  },
  {
    id: "corticobulbar", label: "corticobulbar tract (to the facial nucleus)",
    // Keyed on forehead_spared — the UMN discriminator. facial_weakness is deliberately excluded (it is
    // shared LMN/UMN and non-localising; keying on it would wrongly pull in peripheral facial-nerve sites).
    findings: ["forehead_spared"],
    together: "the upper-motor-neurone fibres to the facial nucleus",
    course: [
      { level: "cortex",   label: "motor cortex (face)" },
      { level: "subcortex", label: "genu of the internal capsule" },
      { level: "midbrain", label: "cerebral peduncle" },
      { level: "pons",     label: "facial nucleus" },
    ],
    decussation: { between: ["midbrain", "pons"], label: "corticobulbar decussation (to the facial nucleus)" },
    crossingNote: "contralateral to the lower-face weakness; the forehead is spared because the upper face is bilaterally innervated",
  },
];
