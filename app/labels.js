// labels.js — DISPLAY naming only. Pure and DOM-free so it can be unit-tested directly (same pattern as
// combined-sites.js / together-guard.js). The engine speaks ids; this module is the one place that turns
// them into words a clinician reads. Ids still travel in the case URL and the feedback payload untouched.
import { BY_SITE, nameForSite } from "../src/data/syndromes.js";
import { FINDINGS } from "../src/model/findings.js";

// Word-level expansions applied to every underscore-separated token of a part id. Keys are lowercase and
// contain no underscore (asserted in test/app-naming.test.js) — they are matched per WORD, not per id.
export const ABBREV = {
  aca: "ACA", mca: "MCA", pca: "PCA", pica: "PICA", aica: "AICA", sca: "SCA",
  cpa: "cerebellopontine angle", iam: "internal acoustic meatus",
  dlpfc: "dorsolateral prefrontal", pfc: "prefrontal", mlf: "MLF", aras: "ARAS",
  vpm: "VPM", vpl: "VPL", scm: "sternocleidomastoid",
  sup: "superior", inf: "inferior", lat: "lateral", med: "medial", fem: "femoral",
  v: "V", vi: "VI", vii: "VII", viii: "VIII", ix: "IX", x: "X", xi: "XI", xii: "XII",
  iii: "III", iv: "IV",
  cn3: "CN III", cn4: "CN IV", cn6: "CN VI", cn7: "CN VII",
};

// A dermatome/root token like "c5" / "t10" / "l4" / "s2" — uppercase the letter, keep the number.
const ROOT_RE = /^([clts])(\d{1,2})$/;

export function humanisePart(part) {
  return String(part).split("_").map(w => {
    if (ABBREV[w]) return ABBREV[w];
    const m = ROOT_RE.exec(w);
    if (m) return m[1].toUpperCase() + m[2];
    return w;
  }).join(" ");
}

// Overrides for the keys the mechanical transform gets wrong. Keyed `${level}|${part}` — NEVER by part
// alone: `lateral` alone spans midbrain, pons, medulla, cord and hypothalamus, so a bare-part key would
// label five different lesions identically. Same rule as vascular.js / topography.js.
//
// An entry is a COMPLETE anatomical phrase with no side word — siteLabel() appends the level only when the
// phrase does not already imply it (see LEVEL_IMPLIED below).
export const PART_LABEL = {
  // --- cortex ---
  // EVERY key at this level is authored explicitly (asserted in the suite), because the `cortex` LEVEL is
  // not all cortex: it also holds a white-matter tract (the arcuate fasciculus), two border zones, and five
  // vascular territories. Appending the level word here produced "arcuate cortex" for a fasciculus and
  // "ACA cortex" for an arterial supply — both wrong, both caught in review. Say what the thing IS.
  // The strip is named by BODY PART first, the way it is examined — and as an AREA OF the motor/sensory
  // cortex, not as a cortex of its own. There is one motor cortex; the leg and face/arm are regions of it.
  "cortex|motor_leg": "leg area of the motor cortex",
  "cortex|motor_facearm": "face/arm area of the motor cortex",
  "cortex|sensory_leg": "leg area of the sensory cortex",
  "cortex|sensory_facearm": "face/arm area of the sensory cortex",
  "cortex|hand_knob": "hand knob of the motor cortex",
  "cortex|sensory_hand": "hand area of the sensory cortex",
  "cortex|premotor": "premotor cortex",
  "cortex|sma": "supplementary motor area",
  "cortex|paracentral": "paracentral lobule",
  "cortex|operculum": "frontal operculum (Broca's area)",
  "cortex|frontal_eye_field": "frontal eye field",
  "cortex|dlpfc": "dorsolateral prefrontal cortex",
  "cortex|medial_pfc": "medial prefrontal cortex",
  "cortex|orbitofrontal": "orbitofrontal cortex",
  "cortex|parietal": "inferior parietal lobule",
  // Wernicke's area is the POSTERIOR SUPERIOR TEMPORAL GYRUS — the site key says "temporoparietal", which
  // is the territory it sits in, not the gyrus the lesion is on.
  "cortex|temporoparietal": "posterior superior temporal gyrus (Wernicke's area)",
  "cortex|temporal": "temporal lobe",
  "cortex|anterior_temporal": "anterior temporal lobe",
  "cortex|occipital": "primary visual cortex",
  "cortex|auditory": "primary auditory cortex (Heschl's gyrus)",
  "cortex|insula": "insular cortex",
  "cortex|angular": "angular gyrus",
  "cortex|fusiform": "fusiform gyrus",
  // a white-matter TRACT that happens to sit at the cortex level — never "arcuate cortex"
  "cortex|arcuate": "arcuate fasciculus",
  // border zones between two supplies — a zone, not a cortical area
  "cortex|watershed_anterior": "anterior watershed zone",
  "cortex|watershed_posterior": "posterior watershed zone",
  // language composites: unions of regions, one of which is the arcuate (white matter), so not "cortex"
  "cortex|aphasia_global": "perisylvian language area",
  "cortex|aphasia_mixed_transcortical": "both watershed language zones",
  // vascular territories are a SUPPLY, not a place — never named as a cortex
  "cortex|aca": "ACA territory",
  "cortex|mca": "MCA territory",
  "cortex|mca_superior": "MCA superior division territory",
  "cortex|mca_inferior": "MCA inferior division territory",
  "cortex|pca": "PCA territory",

  // --- subcortex / white matter ---
  "subcortex|sensorimotor": "sensorimotor white matter",
  "subcortex|anterior_choroidal": "anterior choroidal territory",
  "aphasia_subcortical|striatocapsular": "striatocapsular white matter",
  "aphasia_subcortical|thalamic": "thalamus (language)",

  // --- thalamus + hypothalamus ---
  // Spelled out rather than left as the abbreviation — these are nuclei, and the name should say which.
  "thalamus|vpm": "ventral posteromedial thalamic nucleus",
  "thalamus|vl": "ventral lateral thalamic nucleus",
  "thalamus|limbic": "anterior + dorsomedial thalamic nuclei",
  "thalamus|pulvinar": "pulvinar",
  "thalamus_arousal|paramedian": "paramedian thalamus",
  // Every hypothalamic key is a PORTION of the hypothalamus — a nucleus or a named area — so none of them
  // may be labelled "<something> hypothalamus", which names the whole structure. Terms follow the site's
  // own territory string.
  "hypothalamus|mammillary": "mammillary bodies",
  "hypothalamus|suprachiasmatic": "suprachiasmatic nucleus",
  "hypothalamus|supraoptic": "supraoptic / paraventricular nuclei",
  "hypothalamus|ventromedial": "ventromedial nucleus",
  "hypothalamus|tuberal": "tuberal / arcuate nucleus",
  "hypothalamus|lateral": "lateral hypothalamic area",
  "hypothalamus|thermoregulatory": "anterior + posterior hypothalamic nuclei",

  // --- basal ganglia / cerebellum ---
  "basal_ganglia|subthalamic": "subthalamic nucleus",
  "cerebellum|hemisphere": "cerebellar hemisphere",
  "cerebellum|vermis": "cerebellar vermis",
  "cerebellum|flocculonodular": "flocculonodular lobe",
  "cerebellum|pancerebellar": "whole cerebellum",
  "guillain_mollaret|dentate": "dentate nucleus",
  "guillain_mollaret|rubral": "red nucleus",
  "guillain_mollaret|triangle": "Guillain–Mollaret triangle",

  // --- brainstem ---
  "pons|basis_pontis": "basis pontis",
  "pons|trigeminal": "pontine trigeminal complex",
  "pons|lateral_trigeminal": "lateral pons (trigeminal)",
  "midbrain|trochlear": "trochlear nucleus, midbrain",
  "dorsal_midbrain|tectum": "midbrain tectum",
  "pontomesencephalic|tegmentum": "pontomesencephalic tegmentum",
  "brainstem_aras|paramedian_tegmentum": "paramedian tegmentum (ARAS)",
  "locked_in|ventral_pons": "ventral pons (basis pontis)",
  "pseudobulbar|corticobulbar": "corticobulbar tracts, bilateral",
  "midbrain|hemi": "hemimidbrain",
  "pons|hemi": "hemipons",
  "medulla|hemi": "hemimedulla",

  // --- cord ---
  "cord|hemi": "cord hemisection",
  "cord|lateral": "lateral column of the cord",
  "cord|posterior": "posterior columns",
  "combined_degeneration|scd": "subacute combined degeneration",
  "combined_degeneration|friedreich": "Friedreich's ataxia",
  "craniocervical_junction|foramen_magnum": "foramen magnum",
  "cauda|equina": "cauda equina",
  "conus|medullaris": "conus medullaris",
  "polyneuropathy|length_dependent": "length-dependent polyneuropathy",
  "cerebrum|diffuse": "diffuse cerebral involvement",

  // --- motor unit ---
  "motor_unit|anterior_horn": "anterior horn cell",
  "motor_unit|nmj_presynaptic": "presynaptic neuromuscular junction",
  "motor_unit|nmj_postsynaptic": "postsynaptic neuromuscular junction",

  // --- visual pathway ---
  "corpus_callosum|splenium": "splenium of the corpus callosum",
  "visual_pathway|chiasm": "optic chiasm",
  "visual_pathway|lgn": "lateral geniculate nucleus",
  "olfactory|olfactory_groove": "olfactory groove",

  // --- vestibular ---
  "peripheral_vestibular|anterior_canal": "anterior semicircular canal",
  "peripheral_vestibular|posterior_canal": "posterior semicircular canal",
  "peripheral_vestibular|horizontal_canal": "horizontal semicircular canal",
  "central_vestibular|nucleus": "vestibular nuclei",

  // --- pupil + oculosympathetic ---
  "pupil|cn3_compressive": "CN III (compressive)",
  "pupil|cn3_ischaemic": "CN III (ischaemic)",
  "sympathetic|preganglionic": "preganglionic oculosympathetic",
  "sympathetic|pancoast": "lung apex (Pancoast)",

  // --- skull base: the cranial-nerve COURSE sites, named nerve-then-segment ---
  "skull_base|iii_orbit_sup": "III — superior division, orbit",
  "skull_base|iii_orbit_inf": "III — inferior division, orbit",
  "skull_base|trochlear_cisternal": "IV — cisternal segment",
  "skull_base|v_ganglion": "trigeminal (Gasserian) ganglion",
  "skull_base|v1_division": "V1 division",
  "skull_base|v1_petrous": "V1 — petrous segment",
  "skull_base|v3_ovale": "V3 at foramen ovale",
  "skull_base|vi_cisternal": "VI — cisternal segment",
  "skull_base|vi_petrous_apex": "VI at the petrous apex",
  "skull_base|vii_geniculate": "VII — geniculate ganglion",
  "skull_base|vii_tympanic": "VII — tympanic segment",
  "skull_base|vii_mastoid": "VII — mastoid segment",
  "skull_base|vii_stylomastoid": "VII at the stylomastoid foramen",
  "skull_base|vii_parotid": "VII — parotid branches",
  "skull_base|ix_jugular": "IX at the jugular foramen",
  "skull_base|x_jugular": "X at the jugular foramen",
  "skull_base|xi_jugular": "XI at the jugular foramen",
  "skull_base|x_recurrent_laryngeal": "recurrent laryngeal nerve",
  "skull_base|xi_posterior_triangle": "XI — posterior triangle",
  "skull_base|xii_neck": "XII — neck",
  "skull_base|collet_sicard": "Collet–Sicard (jugular + hypoglossal)",
  "skull_base|villaret": "Villaret (retroparotid space)",
  "skull_base|optic_canal": "optic canal",
  "skull_base|optic_aion": "optic nerve head (ischaemic)",
  "skull_base|optic_neuritis": "optic nerve (retrobulbar)",

  // --- plexus: "cord" here is a brachial-plexus cord, NOT the spinal cord ---
  "plexus|lateral_cord": "lateral cord of the brachial plexus",
  "plexus|medial_cord": "medial cord of the brachial plexus",
  "plexus|posterior_cord": "posterior cord of the brachial plexus",
  "plexus|upper_trunk": "upper trunk of the brachial plexus",
  "plexus|middle_trunk": "middle trunk of the brachial plexus",
  "plexus|lower_trunk": "lower trunk of the brachial plexus",

  // --- named nerves: nerve first, then where it is compressed ---
  "nerve|median_carpal_tunnel": "median nerve at the carpal tunnel",
  "nerve|median_proximal": "median nerve, proximal",
  "nerve|median_ain": "anterior interosseous nerve",
  "nerve|radial_pin": "posterior interosseous nerve",
  "nerve|radial_axilla": "radial nerve in the axilla",
  "nerve|radial_spiral_groove": "radial nerve in the spiral groove",
  "nerve|ulnar_elbow": "ulnar nerve at the elbow",
  "nerve|ulnar_wrist": "ulnar nerve at the wrist",
  "nerve|peroneal_common": "common peroneal nerve",
  "nerve|peroneal_deep": "deep peroneal nerve",
  "nerve|peroneal_superficial": "superficial peroneal nerve",
};

// Levels whose name is redundant once the part phrase is read ("internal capsule", not "internal capsule
// subcortex"). Everything else gets the level appended, which is what disambiguates the reused part names —
// so a level may only join this set when NO part under it is shared with another level.
const LEVEL_IMPLIED = new Set(["cortex", "subcortex", "cerebrum", "motor_unit", "polyneuropathy", "skull_base",
  "peripheral_vestibular", "central_vestibular", "guillain_mollaret", "combined_degeneration",
  "aphasia_subcortical", "locked_in", "pseudobulbar", "olfactory", "craniocervical_junction",
  "cauda", "conus", "basal_ganglia", "sympathetic", "pupil", "visual_pathway", "brainstem_aras",
  "dorsal_midbrain", "pontomesencephalic", "thalamus_arousal", "plexus"]);

const humaniseLevel = level => humanisePart(level);

export function siteLabel(site) {
  const key = `${site.level}|${site.part}`;
  if (PART_LABEL[key]) return PART_LABEL[key];
  const part = humanisePart(site.part);
  if (LEVEL_IMPLIED.has(site.level)) return part;
  const level = humaniseLevel(site.level);
  return part.toLowerCase().includes(level.toLowerCase()) ? part : `${part} ${level}`;
}

const SIDE_WORD = { left: "Left", right: "Right", bilateral: "Bilateral", midline: "Midline" };
const sideWord = s => SIDE_WORD[s] || "";

// Does the phonebook actually name this site? Checked against BY_SITE directly rather than by comparing
// nameForSite()'s output to its own fallback string, which would break the moment that string is reworded.
const hasEponym = site => !!(BY_SITE[site.id] || BY_SITE[`${site.level}_${site.part}`]);

// The territory string very often RESTATES what the headline and the label already said — "MCA superior
// division territory — MCA superior division (fronto-opercular)", or Wernicke's named twice. A substring
// test is too weak to catch those (the wordings differ), so compare CONTENT WORDS: if the territory adds
// almost nothing the reader does not already have, drop it rather than print it twice.
const STOP = new Set(["the","of","a","an","and","or","at","in","on","to","for","with","its"]);
const contentWords = t => new Set(String(t).toLowerCase().match(/[a-z0-9]+/g)?.filter(w => w.length > 2 && !STOP.has(w)) || []);

function territoryAdds(terr, alreadySaid) {
  const t = contentWords(terr);
  if (!t.size) return false;
  const known = contentWords(alreadySaid);
  let novel = 0;
  for (const w of t) if (!known.has(w)) novel++;
  return novel / t.size > 0.4;   // it must be substantially new, not a reworded echo
}

export function plainSiteName(site, opts = {}) {
  const label = siteLabel(site);
  const plain = [sideWord(site.side), label].filter(Boolean).join(" ");
  const raw = `${site.side} · ${site.level} · ${site.part}`;
  const terr = site.territory || "";
  const name = hasEponym(site) ? nameForSite(site, opts).name : plain;
  // Measured against BOTH the headline and the label — a territory can echo either one.
  const sub = territoryAdds(terr, `${name} ${label}`)
    ? (hasEponym(site) ? `${plain} — ${terr}` : terr)
    : (hasEponym(site) ? plain : "");
  return { name, sub, raw };
}

// A finding `desc` is a teaching sentence (papilloedema's runs to 130 characters), so the chip takes its
// leading clause and the full desc goes in a title attribute at the call site.
//
// " / ", " + " and " ± " are DELIBERATELY NOT separators, though they look like ones. They join co-equal
// halves of a single finding rather than clauses, so splitting on them changes the clinical meaning:
// "Loss of pain / temperature on the body" became "Loss of pain", which is a different sign. Caught by
// reading the rendered chips. The cap is 44 rather than 32 for the same reason — it keeps 218 of 233
// labels whole instead of 182, and an ellipsis is only ever a truncation, never a silent half-truth.
const CLAUSE_SEPARATORS = [" — ", " (", ", "];
const LABEL_CAP = 44;

export function shortFindingLabel(id) {
  const d = (FINDINGS[id] && FINDINGS[id].desc) || "";
  let s = d.trim();
  for (const sep of CLAUSE_SEPARATORS) s = s.split(sep)[0].trim();
  if (!s) s = humanisePart(id).replace(/^./, c => c.toUpperCase());
  if (s.length > LABEL_CAP) s = s.slice(0, LABEL_CAP - 1).trimEnd() + "…";
  return s;
}
