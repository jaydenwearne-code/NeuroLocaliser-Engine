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
  // ---- non-classical longitudinal pathways (same declarative shape; enrich the "why" for non-tract findings) ----
  {
    // Keyed on the SYMPATHETIC-SPECIFIC findings (miosis + anhidrosis), NOT ptosis — ptosis is shared with CN III,
    // and CN III causes a DILATED pupil, so keying on miosis/anhidrosis keeps a pupil-sparing III palsy out.
    id: "oculosympathetic", label: "oculosympathetic (Horner) pathway", direction: "descending",
    findings: ["miosis", "anhidrosis_face", "anhidrosis_body"],
    together: "the three-neuron sympathetic supply to the pupil dilator, Müller's muscle, and the facial sweat glands",
    course: [
      { level: "hypothalamus", label: "posterolateral hypothalamus", detail: "posterolateral hypothalamus (first-order neuron)", supply: "deep perforators", narrativeOnly: true },
      { level: "medulla",      label: "lateral brainstem",           detail: "descending sympathetic tract in the lateral brainstem",                     supply: "PICA / vertebral" },
      { level: "cord",         label: "ciliospinal centre (C8–T2)",  detail: "ciliospinal centre of Budge in the intermediolateral cord (C8–T2)",         supply: "anterior spinal artery" },
      { level: "sympathetic",  label: "cervical sympathetic chain",  detail: "preganglionic fibres over the lung apex to the superior cervical ganglion (second-order neuron)", supply: "lung apex / subclavian region" },
      { level: "skull_base",   label: "carotid → cavernous → orbit", detail: "postganglionic fibres along the internal carotid, through the cavernous sinus, to the orbit (third-order neuron)", supply: "internal carotid" },
    ],
    decussation: {}, // ipsilateral throughout — no decussation
    crossingNote: "Horner's is ipsilateral to the lesion throughout; the order is read from the sweating — anhidrosis of the whole hemibody is central (first-order), face-only is preganglionic (second-order), and little or none is postganglionic (third-order)",
  },
  {
    id: "mlf", label: "medial longitudinal fasciculus (MLF)", direction: "ascending",
    findings: ["ino"],
    together: "the internuclear fibres linking the abducens nucleus to the contralateral medial-rectus subnucleus",
    // course listed rostral→caudal (the shared convention); direction "ascending" reverses it in the
    // narrative so it reads pons (abducens internuclear neurons) → midbrain (medial-rectus subnucleus).
    course: [
      { level: "midbrain", label: "medial-rectus subnucleus", detail: "medial-rectus subnucleus of the oculomotor nucleus in the midbrain", supply: "PCA / basilar perforators" },
      { level: "pons",     label: "abducens nucleus / PPRF",  detail: "abducens internuclear neurons in the pons",                          supply: "basilar perforators" },
    ],
    decussation: {}, // the internuclear crossing is a detail; the localising fact is that INO is ipsilateral to the lesion
    crossingNote: "an internuclear ophthalmoplegia is ipsilateral to the lesion — the adducting eye fails and the abducting eye shows nystagmus; bilateral INO suggests MS in the young and brainstem stroke in the older patient",
  },
  {
    id: "visual", label: "visual pathway", direction: "descending",
    findings: ["optic_neuropathy", "central_scotoma", "altitudinal_defect", "bitemporal_hemianopia",
      "homonymous_hemianopia", "superior_quadrantanopia", "inferior_quadrantanopia", "cortical_blindness"],
    together: "the retinofugal pathway from the optic nerve to the primary visual cortex",
    course: [
      { level: "skull_base",     label: "optic nerve (CN II)",   detail: "optic nerve in the optic canal (monocular loss before the chiasm)", supply: "ophthalmic artery" },
      { level: "visual_pathway", label: "chiasm → tract → LGN",  detail: "optic chiasm, optic tract, then the lateral geniculate nucleus (bitemporal at the chiasm, homonymous beyond)", supply: "perforators / anterior choroidal" },
      { level: "subcortex",      label: "optic radiations",      detail: "optic radiations — Meyer's loop (temporal, superior fields) and the parietal fibres (inferior fields)", supply: "MCA branches" },
      { level: "cortex",         label: "primary visual cortex", detail: "primary (calcarine) visual cortex in the occipital lobe",           supply: "PCA (with MCA macular collateral)" },
    ],
    decussation: { inLevel: "visual_pathway", label: "optic chiasm (nasal fibres cross)" },
    crossingNote: "before the chiasm the defect is monocular; at the chiasm the crossing nasal fibres give a bitemporal hemianopia; beyond it the defect is a contralateral homonymous hemianopia, becoming more congruous and macula-sparing towards the occipital cortex",
  },
  {
    id: "cerebellar", label: "cerebellar (spinocerebellar) coordination pathway", direction: "ascending",
    findings: ["limb_ataxia", "truncal_ataxia", "dysmetria", "dysdiadochokinesis", "intention_tremor"],
    together: "the cerebellum and its inflow/outflow — the spinocerebellar tracts and the three cerebellar peduncles",
    // listed rostral→caudal; direction "ascending" reverses it so the narrative reads cord → cerebellum.
    course: [
      { level: "cerebellum",           label: "cerebellar hemisphere / vermis", detail: "cerebellar hemisphere (limb) and vermis (trunk)", supply: "PICA / AICA / SCA" },
      { level: "midbrain",             label: "superior cerebellar peduncle",   detail: "superior cerebellar peduncle (cerebellar outflow)", supply: "SCA / basilar perforators" },
      { level: "pons",                 label: "middle cerebellar peduncle",     detail: "middle cerebellar peduncle (pontocerebellar inflow)", supply: "AICA / basilar" },
      { level: "medulla",              label: "inferior cerebellar peduncle",   detail: "inferior cerebellar peduncle (spinocerebellar & olivocerebellar inflow)", supply: "PICA / vertebral" },
      { level: "combined_degeneration", label: "spinocerebellar tracts (cord)", detail: "spinocerebellar tracts in the cord (unconscious proprioception)", supply: "posterolateral cord (or hereditary — Friedreich)" },
    ],
    decussation: {}, // net ipsilateral
    crossingNote: "cerebellar signs are ipsilateral to the affected limb — the cerebellar outflow crosses at the superior peduncle but the corticospinal tract crosses again, so the two cancel; midline (vermis) lesions give truncal/gait ataxia, hemisphere lesions give ipsilateral limb ataxia",
  },
  {
    id: "central_tegmental", label: "central tegmental tract (Guillain–Mollaret triangle)", direction: "descending",
    findings: ["palatal_tremor"],
    together: "the dentato–rubro–olivary loop whose interruption produces palatal (oculopalatal) tremor",
    course: [
      { level: "midbrain",         label: "red nucleus",            detail: "red nucleus (apex of the triangle)",                              supply: "PCA / basilar perforators", narrativeOnly: true },
      { level: "guillain_mollaret", label: "central tegmental tract → inferior olive", detail: "central tegmental tract and inferior olive (Guillain–Mollaret triangle)", supply: "vertebral perforators" },
    ],
    decussation: {},
    crossingNote: "palatal tremor localises to the Guillain–Mollaret triangle (dentate nucleus → superior cerebellar peduncle → red nucleus → central tegmental tract → inferior olive); a lesion causes hypertrophic olivary degeneration, and the tremor emerges weeks later, often with pendular nystagmus (oculopalatal tremor)",
  },
  {
    id: "trigeminothalamic", label: "trigeminothalamic pathway (face sensation)", direction: "ascending",
    findings: ["face_pain_loss", "face_touch_loss", "face_sensory_loss"],
    together: "the face's sensory relay — the spinal trigeminal nucleus (pain/temperature) and principal sensory nucleus (touch) to the VPM thalamus",
    // listed rostral→caudal; direction "ascending" reverses it so the narrative reads nuclei → thalamus.
    course: [
      { level: "thalamus", label: "VPM thalamus",              detail: "ventral posteromedial (VPM) nucleus of the thalamus",                supply: "thalamoperforators" },
      { level: "pons",     label: "principal sensory nucleus", detail: "principal sensory (chief) trigeminal nucleus — fine touch",           supply: "basilar perforators" },
      { level: "medulla",  label: "spinal trigeminal nucleus", detail: "spinal trigeminal nucleus — pain & temperature (extends into the upper cord)", supply: "PICA / vertebral" },
    ],
    decussation: {},
    crossingNote: "second-order fibres cross and ascend as the trigeminothalamic tract, so a lesion above the nuclei gives CONTRALATERAL facial sensory loss; a lesion of the spinal trigeminal nucleus itself (e.g. the lateral medulla) gives IPSILATERAL facial pain/temperature loss — the crossed-body, uncrossed-face pattern of Wallenberg",
  },
];
