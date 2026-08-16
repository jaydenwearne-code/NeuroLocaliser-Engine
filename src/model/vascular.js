// vascular.js — the AUTHORED vascular axis: which vessel, and at what branch level.
//
// WHY AUTHORED AND NOT DERIVED: `site.territory` is human-readable prose ("MCA superior division
// (precentral — face/arm motor)"), and NONE of the 211 distinct territory strings carries a vessel
// segment. Branch-level resolution cannot be parsed out of it, so it is written down here.
//
// KEYED BY `${level}|${part}`, NEVER BY PART ALONE. Four part names are reused across levels —
// `lateral` (midbrain, pons, medulla, cord, hypothalamus), `hemi` (four levels), `medial`, `anterior` —
// so a bare-name key would give lateral medulla (PICA) and lateral midbrain one shared row, which is a
// silent clinical error. `causes.js` resolves keys as `${level}_${part}` for the same reason.
//
// ✅ CLINICALLY SIGNED OFF by the owner (a clinician), 2026-08-15.
// Spec: docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md §1

export const VESSELS = [
  "ACA", "MCA", "PCA", "ACA-MCA", "MCA-PCA", "anterior choroidal", "anterior communicating",
  "BA", "PICA", "AICA", "SCA", "vertebral", "vertebrobasilar",
  "anterior spinal", "posterior spinal", "ophthalmic", "posterior ciliary", "none",
];

export const SEGMENTS = ["M1", "M2", "M3", "M4", "A1", "A2", "A3", "A4", "P1", "P2", "P3", "P4"];

export const ZONES = ["cortical", "perforator", "watershed", "brainstem", "cord", "nonvascular"];

export const VASCULAR = {
  // ================= ANTERIOR CIRCULATION =================
  // ---- cortex (33) ----
  "cortex|motor_facearm":    { vessel: "MCA", segment: "M4", branch: "precentral", zone: "cortical" },
  "cortex|motor_leg":        { vessel: "ACA", segment: "A4", branch: "paracentral", zone: "cortical" },
  "cortex|sensory_facearm":  { vessel: "MCA", segment: "M4", branch: "postcentral", zone: "cortical" },
  "cortex|sensory_leg":      { vessel: "ACA", segment: "A4", branch: "paracentral", zone: "cortical" },
  "cortex|sensory_hand":     { vessel: "MCA", segment: "M4", branch: "postcentral (hand)", zone: "cortical" },
  "cortex|hand_knob":        { vessel: "MCA", segment: "M4", branch: "precentral (hand knob)", zone: "cortical" },
  "cortex|paracentral":      { vessel: "ACA", segment: "A4", branch: "paracentral", zone: "cortical" },
  "cortex|premotor":         { vessel: "MCA", segment: "M4", branch: "precentral / middle frontal", zone: "cortical" },
  "cortex|sma":              { vessel: "ACA", segment: "A3", branch: "medial frontal (SMA)", zone: "cortical" },
  "cortex|frontal_eye_field":{ vessel: "MCA", segment: "M4", branch: "middle frontal", zone: "cortical" },
  "cortex|operculum":        { vessel: "MCA", segment: "M3", branch: "frontal operculum", zone: "cortical" },
  "cortex|dlpfc":            { vessel: "MCA", segment: "M4", branch: "prefrontal", zone: "cortical" },
  "cortex|medial_pfc":       { vessel: "ACA", segment: "A3", branch: "callosomarginal", zone: "cortical" },
  "cortex|orbitofrontal":    { vessel: "ACA", segment: "A2", branch: "orbitofrontal", zone: "cortical" },
  "cortex|parietal":         { vessel: "MCA", segment: "M4", branch: "inferior parietal", zone: "cortical" },
  "cortex|angular":          { vessel: "MCA", segment: "M4", branch: "angular", zone: "cortical" },
  "cortex|temporoparietal":  { vessel: "MCA", segment: "M4", branch: "posterior temporal", zone: "cortical" },
  "cortex|temporal":         { vessel: "MCA", segment: "M4", branch: "middle temporal", zone: "cortical" },
  "cortex|anterior_temporal":{ vessel: "MCA", segment: "M4", branch: "anterior temporal", zone: "cortical" },
  "cortex|auditory":         { vessel: "MCA", segment: "M4", branch: "Heschl / superior temporal", zone: "cortical" },
  "cortex|insula":           { vessel: "MCA", segment: "M2", branch: "insular", zone: "cortical" },
  "cortex|occipital":        { vessel: "PCA", segment: "P4", branch: "calcarine", zone: "cortical" },
  "cortex|fusiform":         { vessel: "PCA", segment: "P4", branch: "posterior temporal", zone: "cortical" },
  "cortex|mca_superior":     { vessel: "MCA", segment: "M2", branch: "superior division", zone: "cortical" },
  "cortex|mca_inferior":     { vessel: "MCA", segment: "M2", branch: "inferior division", zone: "cortical" },
  "cortex|mca":              { vessel: "MCA", segment: null, branch: "whole MCA territory", zone: "cortical" },
  "cortex|aca":              { vessel: "ACA", segment: null, branch: "whole ACA territory", zone: "cortical" },
  "cortex|pca":              { vessel: "PCA", segment: null, branch: "whole PCA territory", zone: "cortical" },
  "cortex|watershed_anterior":  { vessel: "ACA-MCA", segment: null, branch: "anterior borderzone", zone: "watershed" },
  "cortex|watershed_posterior": { vessel: "MCA-PCA", segment: null, branch: "posterior borderzone", zone: "watershed" },
  "cortex|arcuate":          { vessel: "MCA", segment: null, branch: "perisylvian white matter", zone: "nonvascular" },
  "cortex|aphasia_global":   { vessel: "MCA", segment: null, branch: "whole MCA territory", zone: "cortical" },
  "cortex|aphasia_mixed_transcortical": { vessel: "ACA-MCA", segment: null, branch: "borderzone (both)", zone: "watershed" },

  // ---- subcortex (6) ----
  "subcortex|internal_capsule":  { vessel: "MCA", segment: "M1", branch: "lenticulostriate", zone: "perforator" },
  "subcortex|corona_radiata":    { vessel: "MCA", segment: "M1", branch: "deep medullary / lenticulostriate", zone: "perforator" },
  "subcortex|sensorimotor":      { vessel: "MCA", segment: "M1", branch: "lenticulostriate", zone: "perforator" },
  "subcortex|anterior_choroidal":{ vessel: "anterior choroidal", segment: null, branch: "anterior choroidal", zone: "perforator" },
  "subcortex|optic_radiation":   { vessel: "anterior choroidal", segment: null, branch: "anterior choroidal / PCA", zone: "perforator" },
  "subcortex|thalamus":          { vessel: "PCA", segment: "P1", branch: "thalamoperforator", zone: "perforator" },

  // ---- basal ganglia (4) ----
  "basal_ganglia|striatum":         { vessel: "MCA", segment: "M1", branch: "lenticulostriate", zone: "perforator" },
  "basal_ganglia|globus_pallidus":  { vessel: "MCA", segment: "M1", branch: "lenticulostriate", zone: "perforator" },
  "basal_ganglia|subthalamic":      { vessel: "PCA", segment: "P1", branch: "thalamoperforator", zone: "perforator" },
  "basal_ganglia|substantia_nigra": { vessel: "PCA", segment: "P1", branch: "mesencephalic perforator", zone: "perforator" },

  // ---- subcortical aphasia (2) ----
  "aphasia_subcortical|striatocapsular": { vessel: "MCA", segment: "M1", branch: "lenticulostriate", zone: "perforator" },
  "aphasia_subcortical|thalamic":        { vessel: "PCA", segment: "P1", branch: "thalamoperforator", zone: "perforator" },

  // ================= POSTERIOR CIRCULATION + BRAINSTEM =================
  // ---- midbrain (4) ----
  "midbrain|medial":    { vessel: "BA",  segment: "P1", branch: "paramedian mesencephalic", zone: "brainstem" },
  "midbrain|lateral":   { vessel: "PCA", segment: "P1", branch: "short circumferential", zone: "brainstem" },
  "midbrain|hemi":      { vessel: "BA",  segment: null, branch: "paramedian + circumferential", zone: "brainstem" },
  "midbrain|trochlear": { vessel: "SCA", segment: null, branch: "dorsal midbrain", zone: "brainstem" },

  // ---- pons (6) ----
  "pons|medial":             { vessel: "BA",   segment: null, branch: "paramedian pontine", zone: "brainstem" },
  "pons|basis_pontis":       { vessel: "BA",   segment: null, branch: "paramedian pontine", zone: "brainstem" },
  "pons|lateral":            { vessel: "AICA", segment: null, branch: "lateral pontine", zone: "brainstem" },
  "pons|lateral_trigeminal": { vessel: "AICA", segment: null, branch: "lateral pontine", zone: "brainstem" },
  "pons|trigeminal":         { vessel: "AICA", segment: null, branch: "lateral pontine", zone: "brainstem" },
  "pons|hemi":               { vessel: "BA",   segment: null, branch: "paramedian + lateral", zone: "brainstem" },

  // ---- medulla (3) ----
  "medulla|lateral": { vessel: "PICA",      segment: null, branch: "lateral medullary", zone: "brainstem" },
  "medulla|medial":  { vessel: "vertebral", segment: null, branch: "anterior spinal / paramedian", zone: "brainstem" },
  "medulla|hemi":    { vessel: "vertebral", segment: null, branch: "paramedian + lateral", zone: "brainstem" },

  // ---- cerebellum (4) ----
  "cerebellum|hemisphere":      { vessel: "PICA", segment: null, branch: "PICA / AICA / SCA", zone: "brainstem" },
  "cerebellum|vermis":          { vessel: "PICA", segment: null, branch: "medial branch", zone: "brainstem" },
  "cerebellum|flocculonodular": { vessel: "AICA", segment: null, branch: "flocculus", zone: "brainstem" },
  "cerebellum|pancerebellar":   { vessel: "vertebrobasilar", segment: null, branch: "all three cerebellar arteries", zone: "brainstem" },

  // ---- thalamus proper (4) ----
  "thalamus|vpm":      { vessel: "PCA", segment: "P1", branch: "thalamogeniculate", zone: "perforator" },
  "thalamus|vl":       { vessel: "PCA", segment: "P1", branch: "thalamogeniculate", zone: "perforator" },
  "thalamus|pulvinar": { vessel: "PCA", segment: "P2", branch: "posterior choroidal", zone: "perforator" },
  "thalamus|limbic":   { vessel: "PCA", segment: "P1", branch: "tuberothalamic / paramedian", zone: "perforator" },

  // ---- brainstem composites and functional levels (5) ----
  "thalamus_arousal|paramedian":        { vessel: "PCA", segment: "P1", branch: "paramedian (artery of Percheron)", zone: "perforator" },
  "brainstem_aras|paramedian_tegmentum":{ vessel: "BA",  segment: null, branch: "paramedian tegmental", zone: "brainstem" },
  "dorsal_midbrain|tectum":             { vessel: "SCA", segment: null, branch: "quadrigeminal", zone: "brainstem" },
  "pontomesencephalic|tegmentum":       { vessel: "BA",  segment: null, branch: "paramedian tegmental", zone: "brainstem" },
  "locked_in|ventral_pons":             { vessel: "BA",  segment: null, branch: "bilateral paramedian pontine", zone: "brainstem" },

  // ---- vestibular + Guillain-Mollaret (4) ----
  "central_vestibular|nucleus": { vessel: "PICA", segment: null, branch: "lateral medullary / pontine", zone: "brainstem" },
  "guillain_mollaret|dentate":  { vessel: "SCA",  segment: null, branch: "dentate nucleus", zone: "brainstem" },
  "guillain_mollaret|rubral":   { vessel: "BA",   segment: null, branch: "paramedian mesencephalic (red nucleus)", zone: "brainstem" },
  "guillain_mollaret|triangle": { vessel: "none", segment: null, branch: null, zone: "nonvascular" },

  // ================= CORD, OPTIC AND REMAINDER =================
  // ---- cord (6) + conus + craniocervical junction ----
  "cord|anterior":   { vessel: "anterior spinal",  segment: null, branch: "anterior spinal", zone: "cord" },
  "cord|posterior":  { vessel: "posterior spinal", segment: null, branch: "posterior spinal", zone: "cord" },
  "cord|central":    { vessel: "anterior spinal",  segment: null, branch: "central (sulcal) branches", zone: "cord" },
  "cord|lateral":    { vessel: "anterior spinal",  segment: null, branch: "circumferential pial plexus", zone: "cord" },
  "cord|hemi":       { vessel: "anterior spinal",  segment: null, branch: "anterior + posterior spinal", zone: "cord" },
  "cord|transverse": { vessel: "anterior spinal",  segment: null, branch: "anterior + posterior spinal", zone: "cord" },
  "conus|medullaris":{ vessel: "anterior spinal",  segment: null, branch: "artery of Adamkiewicz territory", zone: "cord" },
  "craniocervical_junction|foramen_magnum": { vessel: "vertebral", segment: null, branch: "vertebral / anterior spinal origin", zone: "brainstem" },

  // ---- combined degenerations (2) — tract pairs, not territories ----
  "combined_degeneration|scd":        { vessel: "none", segment: null, branch: null, zone: "nonvascular" },
  "combined_degeneration|friedreich": { vessel: "none", segment: null, branch: null, zone: "nonvascular" },

  // ---- corpus callosum (2) ----
  "corpus_callosum|anterior": { vessel: "ACA", segment: "A3", branch: "pericallosal", zone: "cortical" },
  "corpus_callosum|splenium": { vessel: "PCA", segment: "P3", branch: "splenial", zone: "cortical" },

  // ---- hypothalamus (7) ----
  "hypothalamus|supraoptic":       { vessel: "anterior communicating", segment: null, branch: "hypothalamic perforators", zone: "perforator" },
  "hypothalamus|suprachiasmatic":  { vessel: "anterior communicating", segment: null, branch: "hypothalamic perforators", zone: "perforator" },
  "hypothalamus|thermoregulatory": { vessel: "anterior communicating", segment: null, branch: "hypothalamic perforators", zone: "perforator" },
  "hypothalamus|tuberal":          { vessel: "PCA", segment: "P1", branch: "tuberal perforators", zone: "perforator" },
  "hypothalamus|ventromedial":     { vessel: "PCA", segment: "P1", branch: "tuberal perforators", zone: "perforator" },
  "hypothalamus|lateral":          { vessel: "PCA", segment: "P1", branch: "tuberal perforators", zone: "perforator" },
  "hypothalamus|mammillary":       { vessel: "PCA", segment: "P1", branch: "mammillary perforators", zone: "perforator" },

  // ---- olfactory, diffuse, pseudobulbar ----
  "olfactory|olfactory_groove": { vessel: "ACA",  segment: "A2", branch: "olfactory / anterior ethmoidal", zone: "cortical" },
  "cerebrum|diffuse":           { vessel: "none", segment: null, branch: null, zone: "nonvascular" },
  "pseudobulbar|corticobulbar": { vessel: "none", segment: null, branch: null, zone: "nonvascular" },

  // ---- visual pathway (4) + optic skull-base parts (3) ----
  "visual_pathway|retina":      { vessel: "ophthalmic", segment: null, branch: "central retinal", zone: "cortical" },
  "visual_pathway|chiasm":      { vessel: "anterior communicating", segment: null, branch: "superior hypophyseal", zone: "perforator" },
  "visual_pathway|optic_tract": { vessel: "anterior choroidal", segment: null, branch: "anterior choroidal", zone: "perforator" },
  "visual_pathway|lgn":         { vessel: "anterior choroidal", segment: null, branch: "anterior choroidal / lateral posterior choroidal", zone: "perforator" },
  "skull_base|optic_canal":     { vessel: "ophthalmic", segment: null, branch: "ophthalmic in the canal", zone: "cortical" },
  "skull_base|optic_aion":      { vessel: "posterior ciliary", segment: null, branch: "short posterior ciliary", zone: "cortical" },
  "skull_base|optic_neuritis":  { vessel: "none", segment: null, branch: null, zone: "nonvascular" },
};

// Every `segment: null` above is DELIBERATE and must appear here with its reason. A null is a statement
// that the part is not defined by a single arterial segment — never an unfilled cell. The invariant in
// test/vascular.test.js asserts the two sets match exactly, in both directions.
export const SEGMENT_NULL_REASON = {
  "cortex|mca": "A whole-territory site, not one branch — it IS the MCA territory.",
  "cortex|aca": "A whole-territory site, not one branch.",
  "cortex|pca": "A whole-territory site, not one branch.",
  "cortex|watershed_anterior": "A borderzone between two territories; by definition no single segment supplies it.",
  "cortex|watershed_posterior": "A borderzone between two territories; by definition no single segment supplies it.",
  "cortex|arcuate": "A white-matter fasciculus, not a vascular territory — it is defined by connectivity.",
  "cortex|aphasia_global": "A whole-territory syndrome spanning both MCA divisions.",
  "cortex|aphasia_mixed_transcortical": "A borderzone syndrome sparing the perisylvian core; no single segment.",
  "subcortex|anterior_choroidal": "The anterior choroidal artery has no M/A/P segment numbering.",
  "subcortex|optic_radiation": "Dual supply (anterior choroidal proximally, PCA distally) — no single segment.",
  "midbrain|hemi": "A composite of paramedian and circumferential territories, not one segment.",
  "midbrain|trochlear": "The trochlear nucleus/fascicle is supplied by small dorsal branches without segment numbering.",
  "pons|medial": "Pontine perforators arise directly from the basilar trunk and carry no segment numbering.",
  "pons|basis_pontis": "Basilar perforators; no segment numbering.",
  "pons|lateral": "AICA branches carry no segment numbering.",
  "pons|lateral_trigeminal": "AICA branches carry no segment numbering.",
  "pons|trigeminal": "AICA branches carry no segment numbering.",
  "pons|hemi": "A composite of paramedian and lateral territories.",
  "medulla|lateral": "PICA branches carry no segment numbering.",
  "medulla|medial": "Vertebral/anterior spinal perforators; no segment numbering.",
  "medulla|hemi": "A composite of paramedian and lateral territories.",
  "cerebellum|hemisphere": "Hemispheric supply is shared between PICA, AICA and SCA — no single segment.",
  "cerebellum|vermis": "Medial cerebellar branches carry no segment numbering.",
  "cerebellum|flocculonodular": "AICA branches carry no segment numbering.",
  "cerebellum|pancerebellar": "By definition all three cerebellar arteries — a whole-organ pattern.",
  "brainstem_aras|paramedian_tegmentum": "Basilar tegmental perforators; no segment numbering.",
  "dorsal_midbrain|tectum": "Quadrigeminal branches carry no segment numbering.",
  "pontomesencephalic|tegmentum": "Basilar tegmental perforators; no segment numbering.",
  "locked_in|ventral_pons": "A bilateral basilar perforator territory, not one segment.",
  "central_vestibular|nucleus": "Vestibular nuclei straddle the PICA/AICA border; no single segment.",
  "guillain_mollaret|dentate": "Cerebellar nuclear branches carry no segment numbering.",
  "guillain_mollaret|rubral": "Mesencephalic perforators; no segment numbering.",
  "guillain_mollaret|triangle": "The triangle is a CIRCUIT (dentato-rubro-olivary), not a vascular territory at all — hence vessel `none` and zone `nonvascular`.",
  "cord|anterior": "Spinal arteries carry no M/A/P segment numbering.",
  "cord|posterior": "Spinal arteries carry no segment numbering.",
  "cord|central": "Sulcal branches of the anterior spinal artery; no segment numbering.",
  "cord|lateral": "Supplied by the circumferential pial plexus; no segment numbering.",
  "cord|hemi": "A composite of anterior and posterior spinal territories.",
  "cord|transverse": "A composite of anterior and posterior spinal territories.",
  "conus|medullaris": "Radicular supply (artery of Adamkiewicz) carries no segment numbering.",
  "craniocervical_junction|foramen_magnum": "Vertebral origin; no segment numbering.",
  "combined_degeneration|scd": "Subacute combined degeneration is a metabolic tract disease, not a vascular territory.",
  "combined_degeneration|friedreich": "A hereditary tract degeneration, not a vascular territory.",
  "hypothalamus|supraoptic": "Hypothalamic perforators carry no segment numbering.",
  "hypothalamus|suprachiasmatic": "Hypothalamic perforators carry no segment numbering.",
  "hypothalamus|thermoregulatory": "Hypothalamic perforators carry no segment numbering.",
  "cerebrum|diffuse": "A diffuse/global process by definition — no territory at all.",
  "pseudobulbar|corticobulbar": "A BILATERAL corticobulbar tract syndrome; it requires two lesions and is not one territory.",
  "visual_pathway|retina": "The central retinal artery carries no segment numbering.",
  "visual_pathway|chiasm": "Superior hypophyseal perforators carry no segment numbering.",
  "visual_pathway|optic_tract": "The anterior choroidal artery has no segment numbering.",
  "visual_pathway|lgn": "Dual choroidal supply; no single segment.",
  "skull_base|optic_canal": "The ophthalmic artery carries no segment numbering.",
  "skull_base|optic_aion": "Short posterior ciliary arteries carry no segment numbering.",
  "skull_base|optic_neuritis": "Optic neuritis is an INFLAMMATORY lesion of the nerve, not a vascular territory — contrast with optic_aion, which is ischaemic.",
};

export function vascularOf(site) {
  return VASCULAR[`${site.level}|${site.part}`] || null;
}
