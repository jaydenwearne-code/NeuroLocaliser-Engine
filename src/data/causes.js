// causes.js — the aetiology ("what") layer. Given a lesion at a site, the tempo-aware surgical-sieve
// differential of CAUSES. Causes are not derivable from anatomy the way syndromes are, but cause
// CATEGORIES correlate with site attributes and with the TEMPO of onset. This module is the structured,
// tempo-aware layer over the same knowledge the phonebook (syndromes.js) holds as free-text ddx.
//
//   causesFor(site, { onset }) -> { byCategory, all, onset, derived }
//
// Curated per-site entries (bootstrapped from the phonebook ddx) take precedence; a derived category
// fallback seeds plausible categories from site attributes so EVERY site returns something.

// ---- the surgical sieve ----
export const CATEGORIES = [
  { id: "vascular",     label: "Vascular (ischaemic / haemorrhagic)",        tint: "--terra" },
  { id: "inflammatory", label: "Inflammatory / demyelinating / autoimmune",  tint: "--bilat" },
  { id: "neoplastic",   label: "Neoplastic / compressive",                   tint: "--navy-2" },
  { id: "infective",    label: "Infective",                                  tint: "--ipsi" },
  { id: "metabolic",    label: "Metabolic / toxic / nutritional",            tint: "--gold" },
  { id: "traumatic",    label: "Traumatic / mechanical",                     tint: "--muted" },
  { id: "degenerative", label: "Degenerative / hereditary",                  tint: "--faint" },
  { id: "congenital",   label: "Congenital / structural",                    tint: "--none" },
];
export const TEMPO = [
  { id: "hyperacute", label: "Hyperacute (secs–min)" },
  { id: "acute",      label: "Acute (hrs–days)" },
  { id: "subacute",   label: "Subacute (days–wks)" },
  { id: "chronic",    label: "Chronic (wks–yrs)" },
];
export const LIKELIHOOD = ["common", "uncommon", "rare"];

// terse constructor
const c = (name, cat, tempo, likelihood, red = false) => ({ name, cat, tempo, likelihood, red });

// ---- curated causes, keyed like the phonebook (site.id if it has its own entry, else level_part) ----
export const CAUSES = {
  // --- brainstem ---
  midbrain_medial: [ // Weber / Benedikt / Claude
    c("PCA perforator infarct", "vascular", ["hyperacute","acute"], "common"),
    c("Haemorrhage / cavernous malformation", "vascular", ["acute"], "uncommon"),
    c("Demyelination (MS)", "inflammatory", ["subacute"], "uncommon"),
    c("Midbrain tumour / metastasis", "neoplastic", ["chronic"], "rare"),
  ],
  medulla_lateral: [ // Wallenberg
    c("PICA / vertebral artery occlusion", "vascular", ["hyperacute","acute"], "common"),
    c("Vertebral artery dissection", "vascular", ["hyperacute","acute"], "common", true),
    c("Demyelination (MS)", "inflammatory", ["subacute"], "uncommon"),
    c("Lateral medullary tumour / metastasis", "neoplastic", ["chronic"], "rare"),
  ],
  medulla_medial: [ // Dejerine
    c("Anterior spinal / vertebral artery infarct", "vascular", ["hyperacute","acute"], "common"),
    c("Vertebral dissection", "vascular", ["acute"], "uncommon", true),
  ],
  pons_medial: [ // Millard-Gubler / Foville
    c("Basilar perforator infarct", "vascular", ["hyperacute","acute"], "common"),
    c("Pontine haemorrhage", "vascular", ["hyperacute","acute"], "uncommon", true),
    c("Demyelination (MS)", "inflammatory", ["subacute"], "uncommon"),
    c("Pontine glioma (esp. children)", "neoplastic", ["chronic"], "rare"),
  ],
  pons_basis_pontis: [ // ventral pontine lacune (ataxic hemiparesis / DCH)
    c("Small-vessel lacunar infarct", "vascular", ["acute"], "common"),
    c("Small pontine haemorrhage", "vascular", ["acute"], "uncommon", true),
    c("Demyelination", "inflammatory", ["subacute"], "rare"),
  ],
  // --- cord ---
  cord_anterior: [ // anterior spinal artery
    c("Anterior spinal artery infarct", "vascular", ["hyperacute","acute"], "common"),
    c("Compressive myelopathy (disc / mass)", "neoplastic", ["subacute","chronic"], "common"),
    c("Transverse myelitis (demyelinating)", "inflammatory", ["subacute"], "uncommon"),
  ],
  cord_posterior: [
    c("B12 / copper deficiency (SCD)", "metabolic", ["subacute","chronic"], "common"),
    c("Tabes dorsalis (neurosyphilis)", "infective", ["chronic"], "rare"),
    c("Demyelination", "inflammatory", ["subacute"], "uncommon"),
  ],
  cord_central: [ // syrinx
    c("Syringomyelia (± Chiari)", "congenital", ["chronic"], "common"),
    c("Post-traumatic syrinx", "traumatic", ["chronic"], "uncommon"),
    c("Intramedullary tumour (ependymoma / astrocytoma)", "neoplastic", ["chronic"], "uncommon"),
  ],
  combined_degeneration_scd: [
    c("Vitamin B12 deficiency", "metabolic", ["subacute","chronic"], "common"),
    c("Copper deficiency (zinc excess / bariatric)", "metabolic", ["subacute","chronic"], "uncommon"),
    c("Nitrous-oxide toxicity", "metabolic", ["subacute"], "uncommon", true),
  ],
  combined_degeneration_friedreich: [
    c("Friedreich's ataxia (frataxin, GAA repeat)", "degenerative", ["chronic"], "common"),
    c("Other hereditary spinocerebellar ataxia", "degenerative", ["chronic"], "uncommon"),
    c("Vitamin E deficiency (mimic)", "metabolic", ["chronic"], "rare"),
  ],
  // --- skull base / cranial nerves ---
  skull_base_cavernous_sinus: [
    c("Cavernous sinus thrombosis", "vascular", ["acute","subacute"], "uncommon", true),
    c("Septic cavernous sinus thrombosis", "infective", ["acute"], "rare", true),
    c("Carotid-cavernous fistula", "vascular", ["subacute"], "uncommon"),
    c("Meningioma / pituitary / metastasis / perineural spread", "neoplastic", ["chronic"], "common"),
    c("Tolosa-Hunt (granulomatous)", "inflammatory", ["subacute"], "uncommon"),
    c("Carotid aneurysm", "vascular", ["chronic"], "rare"),
  ],
  skull_base_jugular_foramen: [ // Vernet
    c("Glomus jugulare (paraganglioma)", "neoplastic", ["chronic"], "common"),
    c("Schwannoma / meningioma", "neoplastic", ["chronic"], "common"),
    c("Metastasis / skull-base infiltration", "neoplastic", ["subacute","chronic"], "uncommon"),
    c("Jugular vein thrombosis", "vascular", ["subacute"], "rare", true),
  ],
  skull_base_cpa: [
    c("Vestibular schwannoma", "neoplastic", ["chronic"], "common"),
    c("Meningioma", "neoplastic", ["chronic"], "uncommon"),
    c("Epidermoid cyst", "congenital", ["chronic"], "rare"),
  ],
  skull_base_petrous_apex: [ // Gradenigo
    c("Petrous apicitis (complicated otitis media)", "infective", ["acute","subacute"], "uncommon", true),
    c("Chondrosarcoma", "neoplastic", ["chronic"], "rare"),
    c("Metastasis / cholesterol granuloma", "neoplastic", ["chronic"], "rare"),
  ],
  skull_base_orbital_apex: [
    c("Invasive fungal sinusitis (mucormycosis)", "infective", ["acute"], "rare", true),
    c("Tumour / perineural spread", "neoplastic", ["chronic"], "common"),
    c("Granulomatosis with polyangiitis / sarcoid", "inflammatory", ["subacute"], "uncommon"),
  ],
  skull_base_optic_neuritis: [
    c("Multiple sclerosis", "inflammatory", ["subacute"], "common"),
    c("Idiopathic optic neuritis", "inflammatory", ["subacute"], "common"),
    c("NMO / MOG-associated", "inflammatory", ["subacute"], "uncommon"),
    c("Infective / para-infectious", "infective", ["subacute"], "rare"),
  ],
  skull_base_optic_aion: [
    c("Non-arteritic AION (vasculopathic)", "vascular", ["acute"], "common"),
    c("Arteritic AION — giant-cell arteritis", "vascular", ["acute"], "uncommon", true),
  ],
  skull_base_vii_stylomastoid: [ // Bell's palsy site
    c("Bell's palsy (idiopathic / HSV)", "inflammatory", ["acute"], "common"),
    c("Ramsay Hunt (herpes zoster)", "infective", ["acute"], "uncommon"),
    c("Lyme disease", "infective", ["subacute"], "uncommon"),
    c("Sarcoidosis", "inflammatory", ["subacute"], "rare"),
  ],
  skull_base_vii_geniculate: [ // Ramsay Hunt
    c("Herpes zoster oticus (Ramsay Hunt)", "infective", ["acute"], "common"),
    c("Geniculate schwannoma", "neoplastic", ["chronic"], "rare"),
  ],
  skull_base_iam: [
    c("Vestibular schwannoma (intracanalicular)", "neoplastic", ["chronic"], "common"),
    c("Meningioma / facial schwannoma", "neoplastic", ["chronic"], "uncommon"),
  ],
  // --- vestibular ---
  peripheral_vestibular_labyrinth: [
    c("Vestibular neuritis", "inflammatory", ["acute"], "common"),
    c("Labyrinthitis (viral / bacterial)", "infective", ["acute"], "common"),
    c("Ménière's disease", "degenerative", ["subacute"], "uncommon"),
  ],
  central_vestibular_nucleus: [
    c("Cerebellar / brainstem stroke (PICA / AICA)", "vascular", ["hyperacute","acute"], "common", true),
    c("Demyelination (MS)", "inflammatory", ["subacute"], "uncommon"),
    c("Vertebrobasilar TIA", "vascular", ["acute"], "uncommon", true),
  ],
  // --- cortex / subcortex ---
  subcortex_internal_capsule: [
    c("Small-vessel lacunar infarct", "vascular", ["acute"], "common"),
    c("Hypertensive haemorrhage", "vascular", ["acute"], "uncommon", true),
  ],
  cortex_hand_knob: [
    c("Small precentral (hand-knob) infarct", "vascular", ["acute"], "common"),
    c("Cortical vein thrombosis", "vascular", ["subacute"], "rare", true),
    c("Small metastasis / demyelination", "neoplastic", ["subacute"], "rare"),
  ],
  cortex_operculum: [ // Broca
    c("MCA (superior division) infarct", "vascular", ["hyperacute","acute"], "common"),
    c("Haemorrhage", "vascular", ["acute"], "uncommon"),
    c("Tumour (glioma / metastasis)", "neoplastic", ["chronic"], "uncommon"),
  ],
  cortex_occipital: [
    c("PCA infarct", "vascular", ["hyperacute","acute"], "common"),
    c("Haemorrhage", "vascular", ["acute"], "uncommon"),
    c("PRES (posterior reversible encephalopathy)", "metabolic", ["acute","subacute"], "uncommon"),
  ],
  // --- deep grey / cerebellum / movement ---
  cerebellum_hemisphere: [
    c("Cerebellar infarct (SCA / PICA)", "vascular", ["hyperacute","acute"], "common", true),
    c("Cerebellar haemorrhage", "vascular", ["acute"], "uncommon", true),
    c("Metastasis / haemangioblastoma", "neoplastic", ["chronic"], "uncommon"),
  ],
  basal_ganglia_substantia_nigra: [
    c("Parkinson's disease", "degenerative", ["chronic"], "common"),
    c("Drug-induced parkinsonism", "metabolic", ["subacute"], "common"),
    c("Atypical parkinsonism (PSP / MSA)", "degenerative", ["chronic"], "uncommon"),
  ],
  guillain_mollaret_triangle: [
    c("Brainstem stroke / cavernoma (with hypertrophic olivary degeneration)", "vascular", ["chronic"], "common"),
    c("Trauma / surgery", "traumatic", ["chronic"], "uncommon"),
    c("Demyelination / neurodegeneration", "inflammatory", ["chronic"], "rare"),
  ],
  // --- motor unit ---
  motor_unit_anterior_horn: [
    c("Motor neurone disease / SMA", "degenerative", ["chronic"], "common"),
    c("Poliomyelitis / West Nile", "infective", ["acute"], "rare"),
  ],
  motor_unit_nmj_postsynaptic: [
    c("Myasthenia gravis (autoimmune)", "inflammatory", ["subacute","chronic"], "common"),
  ],
};

// ---- live categoriser for the phonebook ddx (structures the ~185 hand-authored cause lists) ----
import { BY_SITE } from "./syndromes.js";

// keyword → category, tried in priority order (first match wins). Infective/inflammatory before vascular so
// "septic thrombosis" / "granulomatous" don't fall to vascular; neoplastic last (it is the broad catch-all).
const CAT_KEYWORDS = [
  ["infective",    /zoster|herpes|\blyme\b|abscess|\bhiv\b|syphilis|tabes|polio|west nile|infect|apicitis|mucor|aspergill|fungal|meningitis|encephalitis|septic|sepsis|tubercul|\btb\b|otitis|osteomyelitis/],
  ["inflammatory", /\bms\b|multiple sclerosis|demyelinat|neuritis|inflammat|sarcoid|tolosa|autoimmune|guillain|miller-fisher|vasculit|\bnmo\b|\bmog\b|granulomatos|polyangiitis|wegener|myasthen|behcet|lupus|cidp|idiopathic \(hsv\)|bell's palsy|encephalomyeliti/],
  ["metabolic",    /b12|copper|nitrous|thiamine|wernicke|diabet|toxic|metabolic|deficiency|\bpres\b|alcohol|hepatic|uraemic|uremic|electrolyte|drug-induced|nutrition|vitamin/],
  ["degenerative", /motor neurone|mnd|\bsma\b|kennedy|parkinson|\bpsp\b|\bmsa\b|degener|hereditary|friedreich|frataxin|spinocerebellar|huntington|neurodegener|amyotroph/],
  ["congenital",   /chiari|syrinx|syringomyel|congenit|malformation|developmental|kallmann|epidermoid|dermoid|arachnoid cyst/],
  ["traumatic",    /trauma|fracture|injury|\bdisc\b|spondylo|entrapment|iatrogenic|surgery|surgical|biopsy|crutch|saturday|pressure|compression|childbirth|cycling/],
  ["vascular",     /infarct|stroke|ischaem|ischem|haemorrhag|hemorrhag|aneurysm|dissection|thrombo|fistula|vascular|occlusion|\btia\b|cavernoma|cavernous malformation|\bavm\b|vasculopath|hypertensive|embol|aion|carotid|perforator/],
  ["neoplastic",   /schwannoma|meningioma|metasta|tumou?r|glioma|carcinoma|paraganglioma|glomus|adenoma|pituitary|craniophar|pharyngioma|neoplas|lymphoma|\bmass\b|chordoma|chondrosarcoma|haemangioblastoma|perineural|infiltrat|apudoma|nasopharyng/],
];
const CAT_TEMPO = {
  vascular:["hyperacute","acute"], infective:["acute","subacute"], inflammatory:["subacute"],
  neoplastic:["chronic"], metabolic:["subacute","chronic"], degenerative:["chronic"],
  congenital:["chronic"], traumatic:["acute","subacute"],
};
const RED_RE = /dissection|giant.cell|arteritic|mucor|abscess|herniation|emergency|malignan|septic|cavernous sinus thrombo|carotid.cavernous/i;

function categorise(ddxItem, i, fallbackCat) {
  const s = ddxItem.toLowerCase();
  let cat = fallbackCat;
  for (const [id, re] of CAT_KEYWORDS) if (re.test(s)) { cat = id; break; }
  const likelihood = i === 0 ? "common" : i <= 2 ? "uncommon" : "rare";
  return { name: ddxItem, cat, tempo: CAT_TEMPO[cat] || ["subacute"], likelihood, red: RED_RE.test(s) };
}

// ---- derived category fallback (derive-don't-store spirit) ----
function derive(site) {
  const out = [];
  const terr = (site.territory || "").toLowerCase();
  const part = (site.part || "").toLowerCase();
  const vasc = /aca|mca|pca|pica|aica|\bsca\b|basilar|vertebral|perforator|lenticulostriate|spinal artery|choroidal|labyrinthine/.test(terr);
  if (vasc) out.push(c("Ischaemic or haemorrhagic stroke", "vascular", ["hyperacute","acute"], "common"));
  if (site.level === "skull_base") out.push(c("Compressive mass (schwannoma / meningioma / metastasis)", "neoplastic", ["chronic"], "common"));
  if (site.level === "nerve") {
    out.push(c("Compression / entrapment", "traumatic", ["subacute","chronic"], "common"));
    out.push(c("Diabetic / metabolic mononeuropathy", "metabolic", ["subacute"], "uncommon"));
    out.push(c("Vasculitic / inflammatory neuropathy", "inflammatory", ["subacute"], "uncommon"));
  }
  if (site.level === "root") {
    out.push(c("Disc prolapse / spondylosis / compressive mass", "neoplastic", ["subacute","chronic"], "common"));
    out.push(c("Herpes zoster (radiculitis)", "infective", ["acute"], "uncommon"));
  }
  const diffuse = site.side === "bilateral" ||
    ["motor_unit","polyneuropathy","combined_degeneration","cerebrum","thalamus_arousal","pseudobulbar"].includes(site.level);
  if (diffuse) {
    out.push(c("Metabolic / toxic / nutritional", "metabolic", ["subacute","chronic"], "common"));
    out.push(c("Degenerative / hereditary", "degenerative", ["chronic"], "uncommon"));
    out.push(c("Autoimmune / inflammatory", "inflammatory", ["subacute"], "uncommon"));
  }
  if (/optic/.test(part) || site.level === "visual_pathway") {
    out.push(c("Optic neuritis / demyelination", "inflammatory", ["subacute"], "common"));
    out.push(c("Compressive (e.g. pituitary / meningioma)", "neoplastic", ["chronic"], "uncommon"));
  }
  if (!out.length) { // generic backstop — nothing is ever empty
    out.push(c("Neoplastic / compressive", "neoplastic", ["subacute","chronic"], "uncommon"));
    out.push(c("Inflammatory / demyelinating", "inflammatory", ["subacute"], "uncommon"));
    out.push(c("Vascular", "vascular", ["acute"], "uncommon"));
  }
  return out;
}

// ---- sieve completion: region-tuned generic causes for the plausible-but-missing categories ----
export function regionOf(site) {
  const L = site.level, part = site.part || "";
  if (L === "visual_pathway" || /optic/.test(part)) return "optic";
  if (["nerve", "plexus", "root", "polyneuropathy"].includes(L)) return "peripheral";
  if (L === "skull_base") return "skull_base";
  if (L === "motor_unit") return "motor_unit";
  return "parenchyma";
}
const SIEVE_GENERICS = {
  parenchyma: [
    c("Demyelination (e.g. MS plaque)", "inflammatory", ["subacute"], "uncommon"),
    c("Tumour / metastasis", "neoplastic", ["chronic"], "uncommon"),
    c("Abscess / focal infection", "infective", ["acute", "subacute"], "rare"),
    c("Ischaemic or haemorrhagic stroke", "vascular", ["hyperacute", "acute"], "uncommon"),
  ],
  peripheral: [
    c("Compression / entrapment", "traumatic", ["subacute", "chronic"], "uncommon"),
    c("Vasculitic / inflammatory neuropathy", "inflammatory", ["subacute"], "uncommon"),
    c("Diabetic / metabolic", "metabolic", ["subacute", "chronic"], "uncommon"),
    c("Nerve-sheath tumour", "neoplastic", ["chronic"], "rare"),
  ],
  skull_base: [
    c("Compressive mass (schwannoma / meningioma / metastasis)", "neoplastic", ["chronic"], "uncommon"),
    c("Skull-base infection (osteomyelitis / fungal)", "infective", ["subacute"], "rare", true),
    c("Granulomatous / inflammatory (sarcoid / Tolosa-Hunt)", "inflammatory", ["subacute"], "rare"),
  ],
  motor_unit: [
    c("Autoimmune (myasthenia / myositis)", "inflammatory", ["subacute", "chronic"], "uncommon"),
    c("Toxic / drug-induced", "metabolic", ["subacute"], "uncommon"),
    c("Degenerative / hereditary", "degenerative", ["chronic"], "uncommon"),
  ],
  optic: [
    c("Optic neuritis / demyelination", "inflammatory", ["subacute"], "uncommon"),
    c("Compressive (pituitary / meningioma)", "neoplastic", ["chronic"], "uncommon"),
    c("Ischaemic (AION)", "vascular", ["acute"], "uncommon"),
  ],
};
export function sieveGenerics(site) { return SIEVE_GENERICS[regionOf(site)] || SIEVE_GENERICS.parenchyma; }

// ---- public API ----
// Three sources, in priority: (1) hand-curated CAUSES (best); (2) the phonebook ddx, categorised live so all
// ~185 named sites get structured causes from one source of truth; (3) attribute-derived fallback so a site
// with neither still returns plausible categories.
export function causesFor(site, { onset } = {}) {
  const key = CAUSES[site.id] ? site.id : `${site.level}_${site.part}`;
  const pbKey = BY_SITE[site.id] ? site.id : `${site.level}_${site.part}`;
  let list, source;
  if (CAUSES[key]) { list = CAUSES[key]; source = "curated"; }
  else if (BY_SITE[pbKey] && Array.isArray(BY_SITE[pbKey].ddx) && BY_SITE[pbKey].ddx.length) {
    const fallbackCat = (derive(site)[0] || {}).cat || "neoplastic";
    list = BY_SITE[pbKey].ddx.map((d, i) => categorise(d, i, fallbackCat));
    source = "phonebook";
  } else { list = derive(site); source = "derived"; }
  const derived = source === "derived";
  const filtered = (onset ? list.filter(x => x.tempo.includes(onset)) : list.slice())
    .sort((a, b) => LIKELIHOOD.indexOf(a.likelihood) - LIKELIHOOD.indexOf(b.likelihood));
  const byCategory = CATEGORIES
    .map(cat => ({ cat: cat.id, label: cat.label, tint: cat.tint, causes: filtered.filter(x => x.cat === cat.id) }))
    .filter(g => g.causes.length);
  // sieve completion — region generics for the plausible categories not already present, tempo-filtered.
  // presentCats uses the UNfiltered list so a tempo-hidden specific category is not re-added generically.
  const presentCats = new Set(list.map(x => x.cat));
  const compAll = sieveGenerics(site)
    .filter(g => !presentCats.has(g.cat))
    .filter(g => !onset || g.tempo.includes(onset))
    .map(x => ({ ...x, generic: true }));
  const completion = CATEGORIES
    .map(cat => ({ cat: cat.id, label: cat.label, tint: cat.tint, causes: compAll.filter(x => x.cat === cat.id) }))
    .filter(g => g.causes.length);
  return { byCategory, all: filtered, onset: onset || null, derived, source, completion };
}
