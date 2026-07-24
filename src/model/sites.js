// sites.js — anatomical sites, composed from the structure catalogue.
//
// A SITE is a discrete lesion location: a (level, part, side) combination. Crucially, a site
// does NOT hand-list its contents — it DERIVES them from structures.js by asking "which
// structures live at this level and part?". Add a structure to the catalogue and every
// relevant site inherits it automatically. That is the whole point of the architecture:
// the anatomy is stated once, in one place, and locations are computed from it.
//
// Vascular territory is assigned by (level, part): paramedian (medial) vs circumferential/
// lateral supply. A lesion is usually one territory on one side, which is exactly why
// "medial midbrain" structures fail together (Weber) and "lateral medulla" structures fail
// together (Wallenberg) — they share a blood supply, not a lookup-table entry.

import { STRUCTURES } from "./structures.js";

// subcortex is built AFTER cortex so an isolated-hemianopia tie resolves to the earlier-built
// occipital cortex site by stable sort (the deep optic radiation stays a co-equal candidate).
const LEVELS = ["midbrain", "pons", "medulla", "cord", "cortex", "subcortex", "thalamus", "basal_ganglia", "cerebellum", "peripheral_vestibular", "central_vestibular", "skull_base", "olfactory", "root", "nerve", "visual_pathway", "pupil", "sympathetic"];
const PARTS = ["medial", "lateral", "anterior", "posterior",
  "motor_leg", "motor_facearm", "operculum", "frontal_eye_field", "dlpfc", "medial_pfc", "orbitofrontal",
  "sensory_facearm", "sensory_leg", "parietal", "temporoparietal", "temporal", "occipital", "insula", "hand_knob", "sensory_hand",
  "optic_aion", "optic_neuritis",
  "basis_pontis", "olfactory_groove",
  "internal_capsule", "corona_radiata", "thalamus", "subthalamic", "optic_radiation",
  "vpm", "vl", "pulvinar", "limbic",
  "substantia_nigra", "striatum", "globus_pallidus",
  "hemisphere", "labyrinth", "posterior_canal", "horizontal_canal", "anterior_canal", "nucleus",
  // NOTE: iii_trunk / iv_trunk / vi_trunk are COMPOSITE-ONLY (not here) — they only feed the SOF/cavernous/
  // apex composites. A standalone trunk site would tie with (and steal) the isolated-palsy cases that must
  // resolve to the pupil sites (pupil-sparing cn3 → microvascular) and the cisternal site (isolated cn4).
  "iii_orbit_sup", "iii_orbit_inf",
  "vi_cisternal", "vi_petrous_apex",
  "v_ganglion", "v1_division", "foramen_rotundum", "v3_ovale", "v1_petrous",
  "vii_geniculate", "vii_tympanic", "vii_mastoid", "vii_stylomastoid", "vii_parotid",
  "iam", "cpa", "optic_canal",
  "ix_jugular", "x_jugular", "x_recurrent_laryngeal", "xi_jugular", "xi_posterior_triangle",
  "hypoglossal_canal", "xii_neck", "carotid_space",
  "c3", "c4", "c5", "c6", "c7", "c8", "t1", "t4", "t10", "l1", "l2", "l3", "l4", "l5", "s1", "s2", "s3",
  "phrenic", "pudendal", "saphenous", "sural",
  "axillary", "musculocutaneous", "suprascapular", "long_thoracic",
  "radial_axilla", "radial_spiral_groove", "radial_pin",
  "median_proximal", "median_ain", "median_carpal_tunnel",
  "ulnar_elbow", "ulnar_wrist",
  "femoral", "obturator", "lat_fem_cutaneous", "superior_gluteal", "sciatic",
  "peroneal_common", "peroneal_deep", "peroneal_superficial", "tibial",
  "optic_tract", "lgn",
  "cn3_compressive", "cn3_ischaemic", "ciliary_ganglion", "preganglionic",
  "trigeminal", "trochlear_cisternal",
  "arcuate", "watershed_anterior", "watershed_posterior", "angular",
  "premotor", "sma", "paracentral",
  "auditory", "anterior_temporal", "fusiform"];
const SIDES = ["left", "right"];

// (level, part) -> vascular territory label. Deliberately simple for the POC.
// Combinations with no structures (e.g. midbrain|anterior, cord|medial) are never built —
// buildSites skips any (level, part) whose structure list is empty.
const TERRITORY = {
  "midbrain|medial":  "PCA perforators (paramedian midbrain)",
  "midbrain|lateral": "PCA/SCA circumferential (lateral midbrain)",
  "pons|medial":      "basilar perforators (paramedian pons)",
  "pons|lateral":     "AICA (lateral pons)",
  "medulla|medial":   "anterior spinal / vertebral (medial medulla)",
  "medulla|lateral":  "PICA / vertebral (lateral medulla)",
  "cord|anterior":    "anterior spinal artery (anterior two-thirds)",
  "cord|posterior":   "posterior spinal arteries (dorsal columns)",
  "cord|central":     "central cord / periependymal (syrinx, intramedullary)",
  "cauda|equina":     "lumbosacral nerve roots (thecal sac)",
  "conus|medullaris": "conus medullaris (distal cord tip, S2–S5)",
  "cortex|motor_leg":        "ACA (paracentral — leg motor)",
  "cortex|motor_facearm":    "MCA superior division (precentral — face/arm motor)",
  "cortex|operculum":        "MCA superior division (frontal operculum / Broca's area)",
  "cortex|frontal_eye_field":"MCA superior division (frontal eye field)",
  "cortex|dlpfc":            "MCA (dorsolateral prefrontal cortex)",
  "cortex|medial_pfc":       "ACA (medial prefrontal cortex)",
  "cortex|orbitofrontal":    "ACA (orbitofrontal cortex)",
  "cortex|sensory_facearm":  "MCA superior division (postcentral — face/arm sensory)",
  "cortex|sensory_leg":      "ACA (paracentral — leg sensory)",
  "cortex|parietal":         "MCA inferior division (inferior parietal lobule)",
  "cortex|temporoparietal":  "MCA inferior division (temporoparietal / Wernicke's area)",
  "cortex|temporal":         "MCA inferior division (temporal lobe)",
  "cortex|occipital":        "PCA (primary visual cortex)",
  "cortex|insula":           "insular cortex (MCA insular arteries)",
  "cortex|hand_knob":        "precentral hand knob (MCA superior — cortical hand)",
  "cortex|sensory_hand":     "postcentral hand (MCA superior — cortical sensory hand / cheiro-oral)",
  "skull_base|optic_aion":     "optic nerve — anterior ischaemic optic neuropathy (altitudinal defect)",
  "skull_base|optic_neuritis": "optic nerve — optic neuritis (central scotoma)",
  "plexus|lateral_cord":   "brachial plexus lateral cord (musculocutaneous + lateral median root)",
  "plexus|medial_cord":    "brachial plexus medial cord (ulnar + medial median root)",
  "plexus|posterior_cord": "brachial plexus posterior cord (axillary + radial)",
  "pons|basis_pontis":       "basilar perforators (ventral / basis pontis)",
  "olfactory|olfactory_groove": "olfactory groove / cribriform plate (CN I)",
  "subcortex|internal_capsule": "lenticulostriate perforators (MCA — internal capsule)",
  "subcortex|corona_radiata": "deep medullary / lenticulostriate perforators (corona radiata white matter)",
  "subcortex|thalamus":         "thalamoperforators / thalamogeniculate (PCA — VPL thalamus)",
  "thalamus|vpm":               "VPM thalamus (face sensory relay)",
  "thalamus|vl":                "ventral anterior/lateral thalamus (motor relay)",
  "thalamus|pulvinar":          "pulvinar / posterior thalamus (attention)",
  "thalamus|limbic":            "anterior + dorsomedial thalamus (limbic / memory)",
  "hypothalamus|supraoptic":       "supraoptic / paraventricular (ADH)",
  "hypothalamus|thermoregulatory": "anterior/posterior hypothalamus (thermoregulation)",
  "hypothalamus|ventromedial":     "ventromedial nucleus (satiety)",
  "hypothalamus|lateral":          "lateral hypothalamic area (orexin / hunger)",
  "hypothalamus|suprachiasmatic":  "suprachiasmatic nucleus (circadian)",
  "hypothalamus|mammillary":       "mammillary bodies (Papez / memory)",
  "hypothalamus|tuberal":          "tuberal / arcuate (hypothalamic-pituitary axis)",
  "corpus_callosum|anterior":      "anterior corpus callosum (genu / body)",
  "corpus_callosum|splenium":      "splenium of the corpus callosum",
  "peripheral_vestibular|labyrinth": "labyrinthine artery (inner ear / vestibular nerve)",
  "peripheral_vestibular|posterior_canal":  "posterior semicircular canal (BPPV)",
  "peripheral_vestibular|horizontal_canal": "horizontal (lateral) semicircular canal (BPPV)",
  "peripheral_vestibular|anterior_canal":   "anterior semicircular canal (BPPV)",
  "central_vestibular|nucleus": "vestibular nucleus / nodulus (central acute vestibular syndrome)",
  "pseudobulbar|corticobulbar": "bilateral corticobulbar tracts (pseudobulbar palsy)",
  "combined_degeneration|scd": "dorsal columns + lateral corticospinal (subacute combined degeneration — B12)",
  "combined_degeneration|friedreich": "dorsal columns + corticospinal + spinocerebellar (Friedreich's ataxia)",
  "craniocervical_junction|foramen_magnum": "craniocervical junction / floor of IV ventricle",
  "pontomesencephalic|tegmentum":           "pontomesencephalic / medullary tegmentum",
  "cerebellum|hemisphere":      "SCA / PICA (cerebellar hemisphere)",
  "cerebellum|vermis":          "SCA (superior) / PICA (inferior) vermis",
  "cerebellum|flocculonodular": "PICA / AICA (flocculonodular lobe)",
  "cerebellum|pancerebellar":   "diffuse / whole cerebellum",
  "basal_ganglia|substantia_nigra": "midbrain / nigrostriatal (substantia nigra)",
  "basal_ganglia|striatum":         "lenticulostriate perforators (caudate / putamen)",
  "basal_ganglia|globus_pallidus":  "lenticulostriate / anterior choroidal (globus pallidus)",
  "basal_ganglia|subthalamic":      "posterior/thalamoperforators (subthalamic nucleus)",
  "subcortex|optic_radiation":  "anterior choroidal / deep MCA (optic radiation)",
  "skull_base|iii_trunk":        "CN III trunk (cavernous sinus / superior orbital fissure)",
  "skull_base|iii_orbit_sup":    "CN III superior division (orbit) — SR + levator",
  "skull_base|iii_orbit_inf":    "CN III inferior division (orbit) — MR/IR/IO + pupil",
  "skull_base|iv_trunk":         "CN IV trunk (cavernous sinus / superior orbital fissure)",
  "skull_base|vi_cisternal":     "CN VI cisternal / subarachnoid course",
  "skull_base|vi_petrous_apex":  "CN VI at Dorello's canal / petrous apex (Gradenigo)",
  "skull_base|vi_trunk":         "CN VI trunk (cavernous sinus / superior orbital fissure)",
  "skull_base|v_ganglion":       "trigeminal (Gasserian) ganglion, Meckel's cave (V1+V2+V3)",
  "skull_base|v1_division":      "ophthalmic division (V1)",
  "skull_base|foramen_rotundum": "foramen rotundum (maxillary division, V2)",
  "skull_base|v3_ovale":         "foramen ovale (mandibular division V3 + motor)",
  "skull_base|v1_petrous":       "V1 at the petrous apex (Meckel) — Gradenigo",
  "skull_base|vii_geniculate":   "facial nerve — geniculate ganglion (Ramsay Hunt)",
  "skull_base|vii_tympanic":     "facial nerve — tympanic segment (lacrimation spared)",
  "skull_base|vii_mastoid":      "facial nerve — mastoid segment (hyperacusis spared)",
  "skull_base|vii_stylomastoid": "facial nerve — stylomastoid foramen (pure motor, Bell's)",
  "skull_base|vii_parotid":      "facial nerve — extracranial / parotid branch",
  "skull_base|iam":              "internal acoustic meatus (VII + VIII) — early acoustic",
  "skull_base|cpa":              "cerebellopontine angle (VII, VIII, V ± cerebellum)",
  "skull_base|optic_canal":      "optic canal (optic nerve, II)",
  "skull_base|ix_jugular":       "glossopharyngeal (IX) at the jugular foramen",
  "skull_base|x_jugular":        "vagus (X) high — palate + larynx",
  "skull_base|x_recurrent_laryngeal": "recurrent laryngeal nerve (X) — isolated hoarseness",
  "skull_base|xi_jugular":       "accessory (XI) at the jugular foramen (SCM + trapezius)",
  "skull_base|xi_posterior_triangle": "accessory (XI) in the posterior triangle of the neck (trapezius)",
  "skull_base|hypoglossal_canal": "hypoglossal canal (XII)",
  "skull_base|xii_neck":         "hypoglossal (XII) in the neck (carotid / submandibular)",
  "skull_base|carotid_space":    "carotid space (cervical sympathetic chain)",
  "motor_unit|anterior_horn":   "anterior horn cell (lower motor neurone — PMA/SMA/polio)",
  "motor_unit|nmj_postsynaptic":"post-synaptic neuromuscular junction (AChR — myasthenia gravis)",
  "motor_unit|nmj_presynaptic": "pre-synaptic neuromuscular junction (VGCC — Lambert-Eaton)",
  "motor_unit|muscle":          "muscle (myopathy)",
  "root|c3": "C3 nerve root (lower neck · phrenic/diaphragm)",
  "root|c4": "C4 nerve root (shoulder cape · phrenic/diaphragm)",
  "root|t4": "T4 nerve root (nipple-line dermatome — thoracic radiculopathy)",
  "root|t10": "T10 nerve root (umbilicus dermatome)",
  "root|l1": "L1 nerve root (groin / inguinal dermatome)",
  "root|s2": "S2 nerve root (posterior thigh / perineum)",
  "root|s3": "S3 nerve root (perineal / genital)",
  "nerve|phrenic":   "phrenic nerve (C3-5) — diaphragm",
  "nerve|pudendal":  "pudendal nerve (S2-4) — perineum / sphincter",
  "nerve|saphenous": "saphenous nerve (femoral branch) — medial leg (pure sensory)",
  "nerve|sural":     "sural nerve — lateral foot / heel (pure sensory)",
  "plexus|middle_trunk": "brachial plexus middle trunk (C7)",
  "root|c5": "C5 nerve root (lateral upper arm · shoulder abduction · biceps jerk)",
  "root|c6": "C6 nerve root (thumb · elbow flexion/wrist ext · brachioradialis jerk)",
  "root|c7": "C7 nerve root (middle finger · elbow extension · triceps jerk)",
  "root|c8": "C8 nerve root (little finger · finger flexion)",
  "root|t1": "T1 nerve root (medial arm · finger abduction)",
  "root|l2": "L2 nerve root (anterior thigh · hip flexion)",
  "root|l3": "L3 nerve root (lower thigh · knee extension · knee jerk)",
  "root|l4": "L4 nerve root (medial shin · ankle dorsiflexion · knee jerk)",
  "root|l5": "L5 nerve root (dorsum foot · great-toe extension)",
  "root|s1": "S1 nerve root (lateral foot · plantarflexion · ankle jerk)",
  "polyneuropathy|length_dependent": "peripheral nerves diffusely (length-dependent, distal-predominant)",
  "nerve|axillary":         "axillary nerve (C5-6, posterior cord)",
  "nerve|musculocutaneous": "musculocutaneous nerve (C5-6, lateral cord)",
  "nerve|suprascapular":    "suprascapular nerve (C5-6)",
  "nerve|long_thoracic":    "long thoracic nerve (C5-7 — serratus anterior)",
  "nerve|radial_axilla":         "radial nerve at the axilla (crutch palsy — triceps involved)",
  "nerve|radial_spiral_groove":  "radial nerve at the spiral groove (Saturday-night palsy — triceps spared)",
  "nerve|radial_pin":            "posterior interosseous nerve (finger drop, wrist extension + sensation spared)",
  "nerve|median_proximal":       "median nerve proximal forearm (pronator / supracondylar)",
  "nerve|median_ain":            "anterior interosseous nerve (pure-motor deep flexors)",
  "nerve|median_carpal_tunnel":  "median nerve at the carpal tunnel (CTS — palmar cutaneous spared)",
  "nerve|ulnar_elbow":           "ulnar nerve at the elbow (cubital tunnel)",
  "nerve|ulnar_wrist":           "ulnar nerve at the wrist (Guyon's canal — FDP + dorsal branch spared, worse claw)",
  "nerve|femoral":          "femoral nerve (L2-4)",
  "nerve|obturator":        "obturator nerve (L2-4)",
  "nerve|lat_fem_cutaneous":"lateral femoral cutaneous nerve (L2-3) — meralgia paraesthetica",
  "nerve|superior_gluteal": "superior gluteal nerve (L4-S1)",
  "nerve|sciatic":          "sciatic nerve (L4-S3)",
  "nerve|peroneal_common":       "common peroneal nerve at the fibular neck",
  "nerve|peroneal_deep":         "deep peroneal nerve (dorsiflexion + great-toe ext; eversion spared)",
  "nerve|peroneal_superficial":  "superficial peroneal nerve (eversion; dorsiflexion spared)",
  "nerve|tibial":           "tibial nerve (L4-S3)",
  "visual_pathway|chiasm":      "optic chiasm (parasellar / suprasellar — pituitary, craniopharyngioma)",
  "visual_pathway|optic_tract": "optic tract (post-chiasmal, pre-geniculate)",
  "visual_pathway|lgn":         "lateral geniculate nucleus (thalamus)",
  "pupil|cn3_compressive": "CN III (subarachnoid) — compressive (PCOM aneurysm / uncal herniation)",
  "pupil|cn3_ischaemic":   "CN III trunk — microvascular ischaemia (diabetes / hypertension)",
  "pupil|ciliary_ganglion":"ciliary ganglion (postganglionic parasympathetic — Adie)",
  "pupil|pretectum":       "pretectum / dorsal midbrain (light-reflex relay — Argyll Robertson)",
  "dorsal_midbrain|tectum": "dorsal midbrain / tectum (posterior commissure — Parinaud)",
  "cerebrum|diffuse": "diffuse bihemispheric cortex (metabolic / anoxic encephalopathy)",
  "thalamus_arousal|paramedian": "bilateral paramedian / intralaminar thalamus (artery of Percheron)",
  "brainstem_aras|paramedian_tegmentum": "paramedian rostral brainstem tegmentum (ARAS)",
  "locked_in|ventral_pons": "ventral pons / basis pontis (basilar territory — locked-in)",
  "pons|trigeminal": "pontine trigeminal complex (main sensory + motor V)",
  "pons|lateral_trigeminal": "lateral pons + trigeminal (AICA / Marie-Foix territory)",
  "midbrain|trochlear": "dorsal midbrain (trochlear nucleus / rostral MLF)",
  "skull_base|trochlear_cisternal": "trochlear nerve — cisternal course (tentorial edge)",
  "cortex|auditory": "primary auditory cortex / Heschl (superior temporal)",
  "cortex|anterior_temporal": "anterior temporal / amygdala",
  "cortex|fusiform": "fusiform / ventral occipitotemporal (the visual 'what' stream)",
  "cortex|premotor": "premotor cortex (MCA superior)",
  "cortex|sma": "supplementary motor area (ACA / parasagittal)",
  "cortex|paracentral": "superomedial frontal / paracentral lobule (ACA)",
  "cortex|arcuate": "arcuate fasciculus / supramarginal gyrus (perisylvian)",
  "cortex|watershed_anterior": "anterior watershed (ACA-MCA border / SMA)",
  "cortex|watershed_posterior": "posterior watershed (MCA-PCA border)",
  "cortex|angular": "angular gyrus (dominant)",
  "aphasia_subcortical|thalamic": "dominant thalamus (thalamic aphasia)",
  "aphasia_subcortical|striatocapsular": "dominant striatum / internal capsule (striatocapsular aphasia)",
  "guillain_mollaret|triangle": "Guillain-Mollaret triangle (dentato-rubro-olivary loop)",
  "guillain_mollaret|rubral": "Guillain-Mollaret triangle — red-nucleus (rubral) corner",
  "guillain_mollaret|dentate": "Guillain-Mollaret triangle — dentate (cerebellar) corner",
  "cord|lateral":          "lateral cord (descending oculosympathetic — central Horner, ≥ ~T1)",
  "sympathetic|preganglionic": "preganglionic oculosympathetic (stellate ganglion / lung apex)"
};

// COMPOSITE-ONLY cord parts. A one-sided isolated anterior/posterior/central cord lesion is not a clinical
// entity — the real cord sites are Brown-Séquard (hemicord, composeHemiLevelSites) and the BILATERAL
// ASA/PSA/central/transverse composites (composeBilateralCordSites). These per-side primitives must still be
// BUILT (the hemicord composer unions them from SITES), but are flagged `buildingBlock` so the engine's
// candidateSites() does not offer them as standalone candidates. (`cord|central` is already never built here
// — it is not in PARTS — so the flag is a no-op for it; kept for documentation. `cord|lateral` is a real
// standalone site (preganglionic cord Horner) and is deliberately absent from this set.)
const BUILDING_BLOCK_PARTS = new Set(["cord|anterior", "cord|posterior", "cord|central"]);

function buildSites() {
  const sites = [];
  for (const level of LEVELS) {
    for (const part of PARTS) {
      const structures = STRUCTURES.filter(s => s.level === level && s.part === part).map(s => s.id);
      if (structures.length === 0) continue;
      const buildingBlock = BUILDING_BLOCK_PARTS.has(`${level}|${part}`);
      for (const side of SIDES) {
        sites.push({
          id: `${side}_${level}_${part}`,
          side, level, part,
          territory: TERRITORY[`${level}|${part}`],
          structures, // structure ids present at this site, derived not hand-listed
          ...(buildingBlock ? { buildingBlock: true } : {})
        });
      }
    }
  }
  return sites;
}

export const SITES = buildSites();
export const SITE_BY_ID = Object.fromEntries(SITES.map(s => [s.id, s]));

// Vascular annotation: which artery (and MCA division) supplies each cortical subregion.
// This is metadata, NOT part of the anatomy — structures never reference it. Vascular syndromes
// are composed from it (composeVascularCortexSites); other pathologies will use other composers.
export const DIVISION = {
  motor_leg:      { territory: "ACA" },
  sensory_leg:    { territory: "ACA" },
  medial_pfc:     { territory: "ACA" },
  orbitofrontal:  { territory: "ACA" },
  motor_facearm:  { territory: "MCA", division: "superior" },
  sensory_facearm:{ territory: "MCA", division: "superior" },
  operculum:      { territory: "MCA", division: "superior" },
  frontal_eye_field:{ territory: "MCA", division: "superior" },
  dlpfc:          { territory: "MCA", division: "superior" },
  parietal:       { territory: "MCA", division: "inferior" },
  temporoparietal:{ territory: "MCA", division: "inferior" },
  temporal:       { territory: "MCA", division: "inferior" },
  occipital:      { territory: "PCA" }
};

// A larger lesion can span medial+lateral at one level/side (a "hemi-level" lesion).
// We expose these as composite candidate sites so the solver can consider them when a
// finding set genuinely needs both territories on one side (e.g. hemimedullary syndrome).
// ONLY meaningful where a level's parts share one vascular hemi-territory that co-fails: the brainstem
// (medial+lateral → hemimedullary) and the cord (anterior+posterior → Brown-Séquard). It must NOT be
// applied to many-part levels (cortex, subcortex, skull_base, root), where "all parts on one side" is
// not a single lesion — a generic union there would spuriously absorb any finding combination.
const HEMI_LEVELS = new Set(["midbrain", "pons", "medulla", "cord"]);
export function composeHemiLevelSites() {
  const composites = [];
  for (const level of LEVELS) {
    if (!HEMI_LEVELS.has(level)) continue;
    for (const side of SIDES) {
      const parts = SITES.filter(s => s.level === level && s.side === side);
      if (parts.length < 2) continue;
      composites.push({
        id: `${side}_${level}_hemi`,
        side, level, part: "hemi",
        territory: `combined territory (${level}, ${side})`,
        structures: parts.flatMap(p => p.structures),
        composite: true
      });
    }
  }
  return composites;
}

// Some cord lesions are BILATERAL/midline: they straddle the cord's centre and damage a
// territory on BOTH sides at once. These are not left/right sites — their side is "bilateral",
// and the forward model emits each finding on both body sides. They are still DERIVED, not
// hand-listed: each pulls its structures from the per-side primitives already built above.
//   - anterior (ASA): corticospinal + spinothalamic bilaterally, dorsal columns SPARED
//   - posterior (PSA): dorsal columns bilaterally, power + pain/temp spared
//   - transverse: the entire cord cross-section (every cord structure), bilaterally
// The anterior-vs-transverse distinction (does vibration survive?) is exactly what lets the
// solver tell ASA infarction from a complete transverse lesion — a derived consequence, no rule.
export function composeBilateralCordSites() {
  const cordParts = ["anterior", "posterior", "central"];
  const structuresForPart = part =>
    STRUCTURES.filter(s => s.level === "cord" && s.part === part).map(s => s.id);

  const sites = [];
  for (const part of cordParts) {
    const structures = structuresForPart(part);
    if (structures.length === 0) continue;
    sites.push({
      id: `bilateral_cord_${part}`,
      side: "bilateral", level: "cord", part,
      territory: TERRITORY[`cord|${part}`],
      structures, composite: true
    });
  }

  // Transverse = the complete cord CROSS-SECTION, i.e. the below-level long tracts (anterior +
  // posterior). It deliberately excludes the central commissural fibres: a complete transverse
  // lesion is described by below-level loss, not a suspended cape.
  const belowLevel = STRUCTURES
    .filter(s => s.level === "cord" && (s.part === "anterior" || s.part === "posterior"))
    .map(s => s.id);
  if (belowLevel.length > 0) {
    sites.push({
      id: "bilateral_cord_transverse",
      side: "bilateral", level: "cord", part: "transverse",
      territory: "complete cord cross-section (transverse myelopathy)",
      structures: belowLevel, composite: true
    });
  }
  return sites;
}

// The cauda equina (nerve roots) and conus medullaris (sacral cord tip) sit BELOW the cord.
// They are midline sites: their findings (saddle, sphincter, root weakness) have no side, so the
// forward model emits them once, @midline. Structures are DERIVED from the catalogue, not listed.
export function composeCaudaConusSites() {
  const build = (id, level, part) => {
    const structures = STRUCTURES.filter(s => s.level === level && s.part === part).map(s => s.id);
    return structures.length ? [{ id, side: "midline", level, part,
      territory: TERRITORY[`${level}|${part}`], structures, composite: true }] : [];
  };
  return [ ...build("cauda_equina", "cauda", "equina"),
           ...build("conus_medullaris", "conus", "medullaris") ];
}

// The optic CHIASM is a MIDLINE site (bitemporal hemianopia has no side) — built like the cauda/conus
// midline sites. The optic tract and LGN are ordinary lateralised sites (buildSites handles them).
export function composeVisualPathwaySites() {
  const structures = STRUCTURES.filter(s => s.level === "visual_pathway" && s.part === "chiasm").map(s => s.id);
  return structures.length ? [{ id: "visual_pathway_chiasm", side: "midline", level: "visual_pathway",
    part: "chiasm", territory: TERRITORY["visual_pathway|chiasm"], structures, composite: true }] : [];
}

// Argyll Robertson pupils are BILATERAL (a dorsal-midbrain/pretectal lesion affects both eyes), so the
// pretectum is a bilateral site (emits light-near dissociation on both sides) — like the motor-unit /
// polyneuropathy bilateral sites. The other pupil sites are ordinary lateralised sites (buildSites).
export function composePupilPretectumSites() {
  const structures = STRUCTURES.filter(s => s.level === "pupil" && s.part === "pretectum").map(s => s.id);
  return structures.length ? [{ id: "pupil_pretectum", side: "bilateral", level: "pupil",
    part: "pretectum", territory: TERRITORY["pupil|pretectum"], structures, composite: true }] : [];
}

// Pancoast (superior sulcus tumour) EMERGES as the union of the preganglionic oculosympathetic and the
// brachial plexus lower trunk (C8/T1) — like Erb = C5∪C6. A full Pancoast picture (preganglionic Horner +
// hand wasting + T1 sensory + arm pain) beats the two primitives by parsimony; an isolated preganglionic
// Horner stays at the lean primitive, an isolated Klumpke stays at the lower trunk.
export function composePancoastSites() {
  const symp = STRUCTURES.filter(s => s.level === "sympathetic" && s.part === "preganglionic").map(s => s.id);
  const lowerTrunk = STRUCTURES.filter(s => s.level === "root" && (s.part === "c8" || s.part === "t1")).map(s => s.id);
  if (symp.length === 0 || lowerTrunk.length === 0) return [];
  return SIDES.map(side => ({
    id: `${side}_sympathetic_pancoast`, side, level: "sympathetic", part: "pancoast",
    territory: "lung apex — Pancoast (superior sulcus) tumour",
    structures: [...symp, ...lowerTrunk], composite: true
  }));
}

// CORTICAL VASCULAR COMPOSITES. Anatomy is organised by subregion; vascular syndromes are DERIVED
// by grouping subregions by their DIVISION annotation (territory + MCA division). One artery on one
// side is a composite site; the whole-MCA composite unions both divisions. Pathology-agnostic: this
// is one lesion-shape family (stroke), not the organising primitive.
export function composeVascularCortexSites() {
  const partsWhere = pred => Object.keys(DIVISION).filter(pred);
  const structuresForParts = parts =>
    STRUCTURES.filter(s => s.level === "cortex" && parts.includes(s.part)).map(s => s.id);

  const aca = partsWhere(p => DIVISION[p].territory === "ACA");
  const mcaSup = partsWhere(p => DIVISION[p].territory === "MCA" && DIVISION[p].division === "superior");
  const mcaInf = partsWhere(p => DIVISION[p].territory === "MCA" && DIVISION[p].division === "inferior");
  const pca = partsWhere(p => DIVISION[p].territory === "PCA");

  // The complete-MCA territory ALSO includes the deep lenticulostriate perforators (the internal capsule),
  // which carry the LEG fibres the cortical surface (paracentral = ACA) does not. So a total-MCA infarct is a
  // dense face/arm/LEG hemiplegia + the cortical association signs (neglect, hemisensory, gaze, hemianopia) —
  // the classic total-MCA syndrome — from ONE lesion. `deepParts` are subcortex parts unioned into the site.
  const deepStructuresForParts = parts =>
    STRUCTURES.filter(s => s.level === "subcortex" && parts.includes(s.part)).map(s => s.id);

  const groups = [
    { part: "aca", parts: aca, terr: "anterior cerebral artery (medial hemisphere)" },
    { part: "mca_superior", parts: mcaSup, terr: "MCA superior division (fronto-opercular)" },
    { part: "mca_inferior", parts: mcaInf, terr: "MCA inferior division (temporoparietal)" },
    { part: "mca", parts: [...mcaSup, ...mcaInf], deepParts: ["internal_capsule"], terr: "complete MCA territory (cortical + deep lenticulostriate)" },
    { part: "pca", parts: pca, terr: "posterior cerebral artery (occipital)" }
  ];

  const sites = [];
  for (const g of groups) {
    const structures = [...structuresForParts(g.parts), ...deepStructuresForParts(g.deepParts || [])];
    if (structures.length === 0) continue;
    for (const side of SIDES) {
      sites.push({ id: `${side}_cortex_${g.part}`, side, level: "cortex", part: g.part,
        territory: g.terr, structures, composite: true });
    }
  }
  return sites;
}

// BILATERAL CORTICAL COMPOSITES. Built only for subregions that contain a `bilateralOnly` structure
// (occipital → Anton, parietal → Balint): a both-hemispheres lesion. Structures are derived; the
// forward model's bilateral emission + bilateral-only gate surface the bilateral-only syndromes and
// skip the unilateral hemisphere-gated mirror findings.
export function composeBilateralCortexSites() {
  const bilateralParts = [...new Set(
    STRUCTURES.filter(s => s.level === "cortex" && s.bilateralOnly).map(s => s.part)
  )];
  return bilateralParts.map(part => ({
    id: `bilateral_${part}`,
    side: "bilateral", level: "cortex", part,
    territory: `bilateral ${part} (${TERRITORY[`cortex|${part}`] || part})`,
    structures: STRUCTURES.filter(s => s.level === "cortex" && s.part === part).map(s => s.id),
    composite: true
  }));
}

// Deep-vessel annotation: which perforator supplies each subcortical part. Metadata, NOT anatomy —
// structures never reference it. The subcortical vascular syndromes are DERIVED from it, exactly as
// the cortical DIVISION drives composeVascularCortexSites.
export const DEEP_TERRITORY = {
  internal_capsule: { territory: "lenticulostriate perforators (MCA)" },
  thalamus:         { territory: "thalamoperforators / thalamogeniculate (PCA)" },
  optic_radiation:  { territory: "anterior choroidal artery" }
};

// SUBCORTICAL DEEP-VASCULAR COMPOSITES. A single small perforator can span several deep parts, which is
// exactly why the lacunar/anterior-choroidal syndromes cluster. Structures are DERIVED by unioning the
// relevant parts — the direct sibling of composeVascularCortexSites:
//   - sensorimotor lacune    = internal capsule + thalamus (weakness AND hemisensory loss, no cortical signs)
//   - anterior choroidal     = internal capsule + thalamus + optic radiation (the hemiplegia/anaesthesia/
//                              hemianopia triad from one vessel)
export function composeDeepVascularSites() {
  const structuresForParts = parts =>
    STRUCTURES.filter(s => s.level === "subcortex" && parts.includes(s.part)).map(s => s.id);

  const groups = [
    { part: "sensorimotor",      parts: ["internal_capsule", "thalamus"],
      terr: "thalamocapsular perforators (sensorimotor lacune)" },
    { part: "anterior_choroidal", parts: ["internal_capsule", "thalamus", "optic_radiation"],
      terr: "anterior choroidal artery (deep triad)" }
  ];

  const sites = [];
  for (const g of groups) {
    const structures = structuresForParts(g.parts);
    if (structures.length === 0) continue;
    for (const side of SIDES) {
      sites.push({ id: `${side}_subcortex_${g.part}`, side, level: "subcortex", part: g.part,
        territory: g.terr, structures, composite: true });
    }
  }
  return sites;
}

// SKULL-BASE CROSS-COMPARTMENT COMPOSITES. Foramina-as-sites: the multi-nerve syndromes are DERIVED by
// unioning the PER-NERVE primitive parts sharing a compartment — the same shape as the vascular composers.
// (The single-nerve longitudinal axis lives in the primitives themselves — a spared branch localises by the
// over-prediction penalty, no composite needed.) The SOF core is the union of the orbital trunks; the
// discriminators emerge from which primitive is added:
//   - sup_orbital_fissure = III + IV + VI trunks + V1 + oculosympathetic
//   - cavernous_sinus     = SOF ∪ V2 (foramen_rotundum)         (adds V2)
//   - orbital_apex        = SOF ∪ optic_canal                   (adds monocular visual loss)
//   - petrous_apex        = VI (Dorello) + V1                   (Gradenigo)
//   - jugular_foramen     = IX + X + XI                         (Vernet)
//   - collet_sicard       = jugular ∪ hypoglossal_canal         (adds XII)
//   - villaret            = jugular + hypoglossal + carotid_space (adds Horner)
// The trunks (iii_trunk/iv_trunk/vi_trunk) and the oculosympathetic are COMPOSITE-ONLY parts (not in PARTS):
// a standalone trunk site would tie with — and steal — the isolated-palsy cases that belong to the pupil
// (pupil-sparing cn3) and cisternal (isolated cn4) sites, which carry the real discriminators.
export function composeSkullBaseSites() {
  const structuresForParts = parts =>
    STRUCTURES.filter(s => s.level === "skull_base" && parts.includes(s.part)).map(s => s.id);

  const groups = [
    { part: "sup_orbital_fissure", parts: ["iii_trunk", "iv_trunk", "vi_trunk", "v1_division", "orbital_sympathetic"],
      terr: "superior orbital fissure (III, IV, VI, V1, sympathetic)" },
    { part: "cavernous_sinus", parts: ["iii_trunk", "iv_trunk", "vi_trunk", "v1_division", "orbital_sympathetic", "foramen_rotundum"],
      terr: "cavernous sinus (III, IV, V1, V2, VI, sympathetic)" },
    { part: "orbital_apex",    parts: ["iii_trunk", "iv_trunk", "vi_trunk", "v1_division", "orbital_sympathetic", "optic_canal"],
      terr: "orbital apex (SOF contents + optic nerve)" },
    { part: "petrous_apex",    parts: ["vi_petrous_apex", "v1_petrous"],
      terr: "petrous apex / Dorello's canal (VI + V1) — Gradenigo" },
    { part: "jugular_foramen", parts: ["ix_jugular", "x_jugular", "xi_jugular"],
      terr: "jugular foramen (IX, X, XI)" },
    { part: "collet_sicard",   parts: ["ix_jugular", "x_jugular", "xi_jugular", "hypoglossal_canal"],
      terr: "jugular foramen + hypoglossal canal (IX–XII)" },
    { part: "villaret",        parts: ["ix_jugular", "x_jugular", "xi_jugular", "hypoglossal_canal", "carotid_space"],
      terr: "retropharyngeal / posterior retroparotid space (IX–XII + sympathetic)" }
  ];

  const sites = [];
  for (const g of groups) {
    const structures = structuresForParts(g.parts);
    if (structures.length === 0) continue;
    for (const side of SIDES) {
      sites.push({ id: `${side}_skull_base_${g.part}`, side, level: "skull_base", part: g.part,
        territory: g.terr, structures, composite: true });
    }
  }
  return sites;
}

// MOTOR-UNIT SITES (pure-motor endings). These are generalized, symmetric conditions, so each part is
// one BILATERAL site (the forward model emits every finding on both body sides) — NOT a left/right
// primitive (a one-sided myopathy would be wrong). Like composeCaudaConusSites (midline sites), this is
// a composer-built level: `motor_unit` is not in LEVELS/PARTS, only in the structure catalogue.
//   - anterior_horn  → pure LMN (lmn_weakness + fasciculations + bulbar) — PMA/SMA/polio
//   - nmj_postsynaptic → myasthenia (fatigable); nmj_presynaptic → Lambert-Eaton (facilitating)
//   - muscle → myopathy (bare proximal weakness — wins by parsimony)
export function composeMotorUnitSites() {
  const parts = ["anterior_horn", "nmj_postsynaptic", "nmj_presynaptic", "muscle"];
  const sites = [];
  for (const part of parts) {
    const structures = STRUCTURES.filter(s => s.level === "motor_unit" && s.part === part).map(s => s.id);
    if (structures.length === 0) continue;
    sites.push({ id: `motor_unit_${part}`, side: "bilateral", level: "motor_unit", part,
      territory: TERRITORY[`motor_unit|${part}`], structures, composite: true });
  }
  return sites;
}

// BASAL GANGLIA BILATERAL SITES. The degenerative diseases (Parkinson's, Huntington's) are BILATERAL
// (often asymmetric-onset). One bilateral site per nucleus, id `basal_ganglia_<part>` (motor-unit
// convention — no side prefix, so it never collides with the focal left_/right_ sites). A bilateral
// site emits each finding on BOTH body sides (@left + @right). The subthalamic nucleus is EXCLUDED —
// bilateral ballism is not a classic syndrome; STN stays focal/contralateral.
export function composeBasalGangliaBilateralSites() {
  const parts = ["substantia_nigra", "striatum", "globus_pallidus"];
  const sites = [];
  for (const part of parts) {
    const structures = STRUCTURES.filter(s => s.level === "basal_ganglia" && s.part === part).map(s => s.id);
    if (structures.length === 0) continue;
    sites.push({ id: `basal_ganglia_${part}`, side: "bilateral", level: "basal_ganglia", part,
      territory: TERRITORY[`basal_ganglia|${part}`], structures, composite: true });
  }
  return sites;
}

// CEREBELLUM MIDLINE SITES. Vermis + flocculonodular are MIDLINE (side "midline", cauda/conus pattern);
// their findings are NON_LATERALISED so they emit @none regardless — the midline side is bookkeeping.
// Not in PARTS, so buildSites never makes left/right copies.
export function composeCerebellumMidlineSites() {
  const build = (id, part) => {
    const structures = STRUCTURES.filter(s => s.level === "cerebellum" && s.part === part).map(s => s.id);
    return structures.length ? [{ id, side: "midline", level: "cerebellum", part,
      territory: TERRITORY[`cerebellum|${part}`], structures, composite: true }] : [];
  };
  return [ ...build("cerebellum_vermis", "vermis"),
           ...build("cerebellum_flocculonodular", "flocculonodular") ];
}

// CENTRAL DIRECTIONAL NYSTAGMUS SITES. Downbeat (craniocervical junction) + upbeat (pontomesencephalic)
// are periventricular/tegmental midline generators that don't fit the vascular medial/lateral split —
// MIDLINE sites (cauda/conus pattern). id == level_part; not in PARTS (composer-only).
export function composeCentralNystagmusSites() {
  const build = (id, level, part) => {
    const structures = STRUCTURES.filter(s => s.level === level && s.part === part).map(s => s.id);
    return structures.length ? [{ id, side: "midline", level, part,
      territory: TERRITORY[`${level}|${part}`], structures, composite: true }] : [];
  };
  return [ ...build("craniocervical_junction_foramen_magnum", "craniocervical_junction", "foramen_magnum"),
           ...build("pontomesencephalic_tegmentum", "pontomesencephalic", "tegmentum") ];
}

// DORSAL MIDBRAIN / PRETECTAL (Parinaud). Two BILATERAL sites (composer-only; level/part not in
// LEVELS/PARTS). `dorsal_midbrain_tectum` = the supranuclear vertical-gaze subset; `parinaud_dorsal_midbrain`
// = the UNION of the pretectum pupil relay (ar_lnd — light-near dissociation) and the tectal structures,
// so the full Parinaud tetrad EMERGES as one site (the skull-base subset⊆superset nesting), while an
// isolated light-near dissociation still localises to pupil_pretectum (Argyll Robertson).
// Side is `bilateral` (like pupil_pretectum): the vertical-gaze findings are NON_LATERALISED (@none
// regardless), but light_near_dissociation is lateralised, so the union must emit it @left + @right to
// match the pupil convention.
export function composeDorsalMidbrainSites() {
  const tectal = STRUCTURES.filter(s => s.level === "dorsal_midbrain" && s.part === "tectum").map(s => s.id);
  if (!tectal.length) return [];
  const pretectal = STRUCTURES.filter(s => s.level === "pupil" && s.part === "pretectum").map(s => s.id);
  const territory = TERRITORY["dorsal_midbrain|tectum"];
  return [
    { id: "dorsal_midbrain_tectum", side: "bilateral", level: "dorsal_midbrain", part: "tectum",
      territory, structures: tectal, composite: true },
    { id: "parinaud_dorsal_midbrain", side: "bilateral", level: "dorsal_midbrain", part: "tectum",
      territory, structures: [...pretectal, ...tectal], composite: true }
  ];
}

// CONSCIOUSNESS / AROUSAL SITES. Four composer-only sites. Arousal needs EITHER the brainstem ARAS (a
// single midline paramedian tegmental lesion) OR both hemispheres (bilateral thalamus / diffuse cortex) —
// the bilateralOnly gate (Anton/Balint) makes a UNILATERAL thalamic/cortical lesion emit nothing. Locked-in
// is the ventral-vs-tegmental contrast (bilateral basis pontis: quadriplegia, ARAS spared → awake).
export function composeConsciousnessSites() {
  const byLevelPart = (lvl, part) => STRUCTURES.filter(s => s.level === lvl && s.part === part).map(s => s.id);
  const thalBilat = STRUCTURES.filter(s => s.level === "thalamus_arousal" && s.part === "paramedian").map(s => s.id);
  const sites = [];
  const diffuse = byLevelPart("cerebrum", "diffuse");
  if (diffuse.length) sites.push({ id: "cerebrum_diffuse", side: "bilateral", level: "cerebrum", part: "diffuse",
    territory: TERRITORY["cerebrum|diffuse"], structures: diffuse, composite: true });
  const aras = byLevelPart("brainstem_aras", "paramedian_tegmentum");
  if (aras.length) sites.push({ id: "brainstem_aras", side: "midline", level: "brainstem_aras", part: "paramedian_tegmentum",
    territory: TERRITORY["brainstem_aras|paramedian_tegmentum"], structures: aras, composite: true });
  if (thalBilat.length) sites.push({ id: "thalamus_bilateral_percheron", side: "bilateral", level: "thalamus_arousal", part: "paramedian",
    territory: TERRITORY["thalamus_arousal|paramedian"], structures: thalBilat, composite: true });
  const li = byLevelPart("locked_in", "ventral_pons");
  if (li.length) sites.push({ id: "locked_in", side: "bilateral", level: "locked_in", part: "ventral_pons",
    territory: TERRITORY["locked_in|ventral_pons"], structures: ["cst_pons_arm", "cst_pons_leg", ...li], composite: true });
  return sites;
}

// LATERAL PONTINE + TRIGEMINAL (Marie-Foix with V involvement). The trigeminal nuclei sit in the
// dorsolateral pons (AICA territory), so a lateral pontine lesion reaching them is the UNION of pons-lateral
// and pons-trigeminal — the skull-base nesting pattern (cavernous = SOF ∪ V2). Isolated trigeminal ->
// pons_trigeminal; isolated lateral pons -> pons_lateral; the combined picture -> this union.
export function composeLateralPontineTrigeminalSites() {
  const out = [];
  for (const side of ["left", "right"]) {
    const lateral = SITES.find(s => s.level === "pons" && s.part === "lateral" && s.side === side);
    const trig    = SITES.find(s => s.level === "pons" && s.part === "trigeminal" && s.side === side);
    if (!lateral || !trig) continue;
    out.push({ id: `${side}_pons_lateral_trigeminal`, side, level: "pons", part: "lateral_trigeminal",
      territory: TERRITORY["pons|lateral_trigeminal"],
      structures: [...lateral.structures, ...trig.structures], composite: true });
  }
  return out;
}

// TROCHLEAR NUCLEUS (dorsal midbrain). Composer-built and LATERALISED (left/right) so it stays out of the
// midbrain-hemi composite (part `trochlear` is not in PARTS). cn4_nuc_* have crosses:true, so a LEFT
// nucleus emits weak_depression@right + vertical_diplopia@right (contralateral — CN IV decussates); the
// co-located mlf_midbrain adds ino@left (ipsilateral). The companion makes an isolated CN IV resolve to the
// ipsilateral peripheral nerve (the nucleus over-predicts ino), and makes the nucleus win when INO is present.
export function composeTrochlearNucleusSites() {
  const structures = STRUCTURES.filter(s => s.level === "midbrain" && s.part === "trochlear").map(s => s.id);
  if (!structures.length) return [];
  return ["left", "right"].map(side => ({
    id: `${side}_midbrain_trochlear`, side, level: "midbrain", part: "trochlear",
    territory: TERRITORY["midbrain|trochlear"], structures, composite: true
  }));
}

// GUILLAIN-MOLLARET TRIANGLE (dentato-rubro-olivary). palatal_tremor is a SHARED finding: isolated ->
// the broad `guillain_mollaret_triangle` (HOD); the corner sites are SUPERSETS (triangle findings + one
// node-specific finding), so a corner wins only when its extra finding is present, else the broad site wins
// by parsimony. gm_rubral REUSES the existing red_nucleus structure (crosses:true -> contralateral rubral
// tremor); gm_dentate adds a cerebellar sign. All composer-built -> no existing site is polluted.
export function composeGuillainMollaretSites() {
  const tri = STRUCTURES.filter(s => s.level === "guillain_mollaret" && s.part === "triangle").map(s => s.id);
  if (!tri.length) return [];
  // The dentate corner mirrors the cerebellar hemisphere's FULL appendicular signature (the dentate IS the
  // hemisphere's output nucleus) so an ISOLATED cerebellar sign stays with the hemisphere and only palatal
  // tremor + cerebellar signs wins the corner.
  const dent = STRUCTURES.filter(s => s.level === "cerebellum" && s.part === "hemisphere").map(s => s.id);
  const out = [{ id: "guillain_mollaret_triangle", side: "midline", level: "guillain_mollaret", part: "triangle",
    territory: TERRITORY["guillain_mollaret|triangle"], structures: tri, composite: true }];
  for (const side of ["left", "right"]) {
    out.push({ id: `gm_rubral_${side}`, side, level: "guillain_mollaret", part: "rubral",
      territory: TERRITORY["guillain_mollaret|rubral"], structures: [...tri, "red_nucleus"], composite: true });
    out.push({ id: `gm_dentate_${side}`, side, level: "guillain_mollaret", part: "dentate",
      territory: TERRITORY["guillain_mollaret|dentate"], structures: [...tri, ...dent], composite: true });
  }
  return out;
}

// APHASIA COMPOSITES. The single-region aphasia sites (Broca operculum, Wernicke temporoparietal, arcuate,
// watershed_anterior/posterior, angular) are ordinary dominant-gated buildSites sites — the 6 base types
// emerge from their feature sets. Here we add the multi-region composites: GLOBAL = the perisylvian union
// (Broca ∪ Wernicke ∪ arcuate), MIXED TRANSCORTICAL = both watershed zones, and the two SUBCORTICAL
// aphasias, which MIRROR their base site's full signature (reuse the VPL-thalamus / internal-capsule
// structures) + a dominant aphasia feature, so they are never leaner than the plain site for a pure
// sensory / motor input and win only when the aphasia feature accompanies the subcortical company.
export function composeAphasiaSites() {
  const perisylvian = ["ctx_broca_fluency", "ctx_broca_repetition", "ctx_wernicke_comp", "ctx_wernicke_repetition", "ctx_arcuate"];
  const bothWatersheds = ["ctx_tcma", "ctx_tcsa"];
  const thalamic = ["th_aphasia_comp", "th_aphasia_naming", "thal_dc", "thal_stt", "thal_pain"];
  const striatocapsular = ["sc_aphasia_nonfluent", "ic_cst_arm", "ic_cst_leg", "ic_cbt_face", "ic_cbt_forehead", "ic_bab", "ic_hof", "ic_spast"];
  const out = [];
  for (const side of SIDES) {
    out.push({ id: `aphasia_global_${side}`, side, level: "cortex", part: "aphasia_global",
      territory: "perisylvian (dominant) — global aphasia", structures: perisylvian, composite: true });
    out.push({ id: `aphasia_mixed_transcortical_${side}`, side, level: "cortex", part: "aphasia_mixed_transcortical",
      territory: "both watershed zones (dominant) — isolation of the speech area", structures: bothWatersheds, composite: true });
    out.push({ id: `thalamic_aphasia_${side}`, side, level: "aphasia_subcortical", part: "thalamic",
      territory: TERRITORY["aphasia_subcortical|thalamic"], structures: thalamic, composite: true });
    out.push({ id: `striatocapsular_aphasia_${side}`, side, level: "aphasia_subcortical", part: "striatocapsular",
      territory: TERRITORY["aphasia_subcortical|striatocapsular"], structures: striatocapsular, composite: true });
  }
  return out;
}

// HYPOTHALAMUS. Composer-only MIDLINE level (hypothalamic functions are midline/bilateral) — one site per
// nucleus (the cauda/conus midline pattern, id == level_part). Not in LEVELS/PARTS.
export function composeHypothalamusSites() {
  const parts = [...new Set(STRUCTURES.filter(s => s.level === "hypothalamus").map(s => s.part))];
  return parts.map(part => {
    const structures = STRUCTURES.filter(s => s.level === "hypothalamus" && s.part === part).map(s => s.id);
    return { id: `hypothalamus_${part}`, side: "midline", level: "hypothalamus", part,
      territory: TERRITORY[`hypothalamus|${part}`], structures, composite: true };
  });
}

// CORPUS CALLOSUM (callosal disconnection). Composer-only MIDLINE level (the callosum is midline) — one site
// per subregion (anterior / splenium). The disconnection deficit is the finding the tract site emits.
// PSEUDOBULBAR PALSY. One BILATERAL composite (the corticobulbar tracts fail on BOTH sides): dysarthria +
// emotional lability (@none) + facial UMN (@left+@right). Composer-only level `pseudobulbar` (not in
// LEVELS/PARTS). Emotional lability is the discriminator from LMN bulbar palsy.
export function composePseudobulbarSites() {
  const structures = STRUCTURES.filter(s => s.level === "pseudobulbar" && s.part === "corticobulbar").map(s => s.id);
  if (structures.length === 0) return [];
  return [{ id: "pseudobulbar_corticobulbar", side: "bilateral", level: "pseudobulbar", part: "corticobulbar",
    territory: TERRITORY["pseudobulbar|corticobulbar"], structures, composite: true }];
}

// COMBINED DEGENERATIONS. Tract-selective, BILATERAL: SCD (dorsal + lateral, STT spared) and Friedreich
// (+ spinocerebellar + areflexia). Composer-only level `combined_degeneration` (not in LEVELS/PARTS).
export function composeCombinedDegenerationSites() {
  const parts = [...new Set(STRUCTURES.filter(s => s.level === "combined_degeneration").map(s => s.part))];
  return parts.map(part => {
    const structures = STRUCTURES.filter(s => s.level === "combined_degeneration" && s.part === part).map(s => s.id);
    return { id: `combined_degeneration_${part}`, side: "bilateral", level: "combined_degeneration", part,
      territory: TERRITORY[`combined_degeneration|${part}`], structures, composite: true };
  });
}

export function composeCorpusCallosumSites() {
  const parts = [...new Set(STRUCTURES.filter(s => s.level === "corpus_callosum").map(s => s.part))];
  return parts.map(part => {
    const structures = STRUCTURES.filter(s => s.level === "corpus_callosum" && s.part === part).map(s => s.id);
    return { id: `corpus_callosum_${part}`, side: "midline", level: "corpus_callosum", part,
      territory: TERRITORY[`corpus_callosum|${part}`], structures, composite: true };
  });
}

// CEREBELLUM PANCEREBELLAR SITE. The diffuse degenerations (paraneoplastic, toxic, alcoholic, hereditary
// SCA): one BILATERAL composite unioning ALL cerebellum structures. Appendicular findings emit @left+@right;
// axial findings are NON_LATERALISED so they emit @none — the full diffuse picture.
export function composeCerebellumPancerebellarSites() {
  const structures = STRUCTURES.filter(s => s.level === "cerebellum").map(s => s.id);
  if (structures.length === 0) return [];
  return [{ id: "cerebellum_pancerebellar", side: "bilateral", level: "cerebellum",
    part: "pancerebellar", territory: TERRITORY["cerebellum|pancerebellar"], structures, composite: true }];
}

// POLYNEUROPATHY SITE. One diffuse, symmetric, distal lesion → a single BILATERAL site (composer-built,
// like the motor-unit sites; `polyneuropathy` is not in LEVELS/PARTS). WHICH site it is is trivial; HOW
// FAR the deficit has ascended (and whether the stocking-glove has appeared) is the orthogonal
// nerveLength.js axis, attached by inverse.describeLength.
export function composePolyneuropathySites() {
  const structures = STRUCTURES.filter(s => s.level === "polyneuropathy" && s.part === "length_dependent").map(s => s.id);
  if (structures.length === 0) return [];
  return [{ id: "polyneuropathy_length_dependent", side: "bilateral", level: "polyneuropathy",
    part: "length_dependent", territory: TERRITORY["polyneuropathy|length_dependent"], structures, composite: true }];
}

// PLEXUS SITES. A trunk / plexus lesion affects exactly the roots that feed it, so each is a plain UNION
// of the constituent root sites' structures — the same composer shape as the vascular composites. A
// two-adjacent-root pattern is then explained by ONE trunk (Erb/Klumpke), which beats two separate root
// sites by parsimony; a single dermatome stays a root. Ipsilateral left/right sites.
// BRACHIAL PLEXUS CORDS. Unlike the trunks (root unions), cords are defined by the terminal NERVES they
// carry, so this composer unions NERVE structures. The median nerve straddles the lateral+medial cords;
// modelled pragmatically — its C8-T1 hand functions dominate, so it is assigned to the medial cord, and the
// lateral cord carries musculocutaneous (the median lateral-root forearm contribution is noted in the phonebook).
export function composeBrachialCordSites() {
  const structuresForParts = parts =>
    STRUCTURES.filter(s => s.level === "nerve" && parts.includes(s.part)).map(s => s.id);
  const groups = [
    { part: "lateral_cord",   parts: ["musculocutaneous"], terr: TERRITORY["plexus|lateral_cord"] },
    { part: "medial_cord",    parts: ["ulnar_elbow", "median_proximal"], terr: TERRITORY["plexus|medial_cord"] },
    { part: "posterior_cord", parts: ["axillary", "radial_axilla"], terr: TERRITORY["plexus|posterior_cord"] }
  ];
  const sites = [];
  for (const g of groups) {
    const structures = structuresForParts(g.parts);
    if (!structures.length) continue;
    for (const side of SIDES)
      sites.push({ id: `${side}_plexus_${g.part}`, side, level: "plexus", part: g.part, territory: g.terr, structures, composite: true });
  }
  return sites;
}

export function composePlexusSites() {
  const structuresForRoots = segs =>
    STRUCTURES.filter(s => s.level === "root" && segs.includes(s.part)).map(s => s.id);
  const groups = [
    { part: "upper_trunk",   segs: ["c5", "c6"], terr: "brachial plexus upper trunk (C5-6) — Erb's palsy" },
    { part: "middle_trunk",  segs: ["c7"], terr: "brachial plexus middle trunk (C7)" },
    { part: "lower_trunk",   segs: ["c8", "t1"], terr: "brachial plexus lower trunk (C8-T1) — Klumpke's palsy" },
    { part: "lumbar_plexus", segs: ["l2", "l3", "l4"], terr: "lumbar plexus (L2-4)" },
    { part: "sacral_plexus", segs: ["l4", "l5", "s1"], terr: "sacral plexus (L4-S1)" }
  ];
  const sites = [];
  for (const g of groups) {
    const structures = structuresForRoots(g.segs);
    if (structures.length === 0) continue;
    for (const side of SIDES) {
      sites.push({ id: `${side}_plexus_${g.part}`, side, level: "plexus", part: g.part,
        territory: g.terr, structures, composite: true });
    }
  }
  return sites;
}
