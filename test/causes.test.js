// causes.test.js — the aetiology ("what") layer: the tempo-aware surgical sieve of causes at a site.
// Causes are NOT derived from anatomy (a lateral-medulla lesion may be stroke/demyelination/tumour), but
// cause CATEGORIES correlate with site attributes + tempo. causesFor(site,{onset}) merges a curated per-site
// map (bootstrapped from the phonebook ddx) with a derived category fallback, filtered by onset.
// Run: node test/causes.test.js
import { CATEGORIES, TEMPO, LIKELIHOOD, CAUSES, causesFor, regionOf } from "../src/data/causes.js";
import { BY_SITE } from "../src/data/syndromes.js";
import { SITES } from "../src/model/sites.js";
import * as sitesMod from "../src/model/sites.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

const catIds = CATEGORIES.map(c => c.id);
const tempoIds = TEMPO.map(t => t.id ?? t);
const likeIds = LIKELIHOOD.map(l => l.id ?? l);

// --- 1: taxonomy ---
for (const id of ["vascular","inflammatory","neoplastic","infective","metabolic","traumatic","degenerative","congenital"])
  ok(`category ${id} exists`, catIds.includes(id));
ok("categories have labels", CATEGORIES.every(c => c.id && c.label));
for (const id of ["hyperacute","acute","subacute","chronic"]) ok(`tempo ${id} exists`, tempoIds.includes(id));
for (const id of ["common","uncommon","rare"]) ok(`likelihood ${id} exists`, likeIds.includes(id));

// --- 2: data integrity ---
{
  let bad = 0, keys = Object.keys(CAUSES);
  for (const k of keys) for (const c of CAUSES[k]) {
    if (!catIds.includes(c.cat)) bad++;
    if (!Array.isArray(c.tempo) || c.tempo.length === 0 || !c.tempo.every(t => tempoIds.includes(t))) bad++;
    if (!likeIds.includes(c.likelihood)) bad++;
    if (!c.name) bad++;
  }
  ok("every curated cause has valid cat / tempo / likelihood / name", bad === 0);
  ok("CAUSES is non-trivial (>= 20 curated sites)", keys.length >= 20);
  // deepened flagship entries carry a discriminating `feature` clue (optional field, teaching hint)
  const withFeature = keys.reduce((n, k) => n + CAUSES[k].filter(c => typeof c.feature === "string" && c.feature.length > 0).length, 0);
  ok(`flagship causes carry discriminating features (>= 20 with feature; got ${withFeature})`, withFeature >= 20);
  ok("Wallenberg dissection carries a feature clue", (CAUSES.medulla_lateral || []).some(c => /dissection/i.test(c.name) && c.feature && /neck pain|younger/i.test(c.feature)));
  // pathognomonic "confirm on exam" flags — genuine bedside signs on the causes that have one
  const withPath = keys.reduce((n, k) => n + CAUSES[k].filter(c => typeof c.pathognomonic === "string" && c.pathognomonic.length > 0).length, 0);
  ok(`some causes carry a pathognomonic confirm-on-exam flag (>= 6; got ${withPath})`, withPath >= 6);
  ok("Ramsay Hunt flags looking for ear-canal vesicles", (CAUSES.skull_base_vii_stylomastoid || []).some(c => /ramsay hunt/i.test(c.name) && /external auditory meatus|pinna|vesicle/i.test(c.pathognomonic || "")));
  ok("tabes dorsalis flags the Argyll Robertson pupil", (CAUSES.cord_posterior || []).some(c => /tabes/i.test(c.name) && /argyll robertson/i.test(c.pathognomonic || "")));
}
// pathognomonic keyword lookup enriches phonebook/derived causes across sites (not just curated)
{
  const orbitalApex = { id: "left_skull_base_orbital_apex", level: "skull_base", part: "orbital_apex", side: "left", territory: "orbital apex" };
  const oa = causesFor(orbitalApex);
  ok("mucormycosis (phonebook/curated) gets a palatal-eschar flag via the lookup",
     oa.all.some(x => /mucor|fungal/i.test(x.name) && /eschar/i.test(x.pathognomonic || "")));
  // a Wernicke-bearing site flags the triad
  const wsites = [...SITES];
  for (const k of Object.keys(sitesMod)) if (k.startsWith("compose") && typeof sitesMod[k] === "function") { try { wsites.push(...sitesMod[k]()); } catch {} }
  let wernickeFlagged = false, gcaFlagged = false;
  for (const key of Object.keys(BY_SITE)) {
    const s = wsites.find(x => x.id === key) || wsites.find(x => `${x.level}_${x.part}` === key) || { id: key, level: key.split("_")[0], part: key.split("_").slice(1).join("_"), side: "left", territory: "" };
    const r = causesFor(s);
    if (r.all.some(x => /wernicke|thiamine/i.test(x.name) && /triad/i.test(x.pathognomonic || ""))) wernickeFlagged = true;
    if (r.all.some(x => /giant.cell|arteritic/i.test(x.name) && /temporal artery/i.test(x.pathognomonic || ""))) gcaFlagged = true;
  }
  ok("Wernicke's flags the triad wherever it appears in the phonebook", wernickeFlagged);
  ok("GCA/arteritic AION flags the temporal-artery sign", gcaFlagged);
}
// curated keys resolve to a real site (id or level_part)
{
  const allSites = [...SITES];
  for (const k of Object.keys(sitesMod)) if (k.startsWith("compose") && typeof sitesMod[k] === "function") {
    try { allSites.push(...sitesMod[k]()); } catch {}
  }
  const validKeys = new Set();
  for (const s of allSites) { validKeys.add(s.id); validKeys.add(`${s.level}_${s.part}`); }
  const unresolved = Object.keys(CAUSES).filter(k => !validKeys.has(k));
  ok(`curated keys resolve to real sites (unresolved: ${unresolved.slice(0,5).join(",")})`, unresolved.length === 0);
}

// --- 3: coverage of high-yield named sites ---
for (const k of ["medulla_lateral","skull_base_jugular_foramen","skull_base_cavernous_sinus",
                 "combined_degeneration_scd","cortex_hand_knob","central_vestibular_nucleus"])
  ok(`curated causes for ${k}`, Array.isArray(CAUSES[k]) && CAUSES[k].length > 0);

// --- 4: causesFor — curated, grouped by category, ranked ---
const wallenberg = { id: "left_medulla_lateral", level: "medulla", part: "lateral", side: "left", territory: "PICA / vertebral (lateral medulla)" };
{
  const r = causesFor(wallenberg);
  ok("causesFor returns byCategory + all", Array.isArray(r.byCategory) && Array.isArray(r.all));
  ok("Wallenberg has a vascular category", r.byCategory.some(g => g.cat === "vascular" && g.causes.length));
  ok("vascular causes name stroke / dissection", r.byCategory.find(g => g.cat === "vascular").causes.some(c => /stroke|PICA|vertebral|dissection/i.test(c.name)));
  ok("not flagged derived (curated)", r.derived === false);
  // ranked common-first
  const likeRank = c => likeIds.indexOf(c.likelihood);
  ok("ranked common-first", r.all.length < 2 || likeRank(r.all[0]) <= likeRank(r.all[r.all.length-1]));
}

// --- 5: onset filter ---
{
  const acute = causesFor(wallenberg, { onset: "acute" });
  const chronic = causesFor(wallenberg, { onset: "chronic" });
  ok("acute onset surfaces vascular stroke/dissection", acute.all.some(c => c.cat === "vascular" && /stroke|dissection|PICA|vertebral/i.test(c.name)));
  ok("acute onset excludes chronic-only causes", acute.all.every(c => c.tempo.includes("acute")));
  ok("chronic onset excludes hyperacute-only causes", chronic.all.every(c => c.tempo.includes("chronic")));
  ok("onset echoed", acute.onset === "acute");
}

// --- 6: phonebook-sourced causes (the live ddx categoriser) ---
{
  // A NAMED site not hand-curated → its phonebook ddx is categorised live. Chosen DYNAMICALLY rather than
  // hard-coded: this used to pin the superior orbital fissure, which then broke the moment that site was
  // curated (Region D). The categoriser is what's under test, not any particular site's curation status.
  const allSites = [...SITES];
  for (const k of Object.keys(sitesMod)) if (k.startsWith("compose") && typeof sitesMod[k] === "function") { try { allSites.push(...sitesMod[k]()); } catch {} }
  const pbSite = allSites.find(s => causesFor(s).source === "phonebook");
  ok("some site is still phonebook-sourced (the categoriser path is live)", !!pbSite);
  const r = causesFor(pbSite);
  ok(`phonebook-sourced, not curated (${pbSite && pbSite.id})`, r.source === "phonebook" && r.derived === false && r.all.length > 0);
  ok("phonebook ddx is grouped into sieve categories", r.byCategory.length > 0 && r.byCategory.every(g => catIds.includes(g.cat)));
  ok("phonebook causes have valid cat/tempo/likelihood", r.all.every(c => catIds.includes(c.cat) && c.tempo.every(t=>tempoIds.includes(t)) && likeIds.includes(c.likelihood)));
  // the SOF keyword mappings that used to be checked here now live in its curated entry — assert the
  // clinical content survived curation, so the move didn't quietly lose coverage
  const sof = causesFor({ id: "left_skull_base_sup_orbital_fissure", level: "skull_base", part: "sup_orbital_fissure", side: "left", territory: "superior orbital fissure" });
  ok("SOF is now curated", sof.source === "curated");
  ok("SOF still offers Tolosa-Hunt as inflammatory", sof.byCategory.some(g => g.cat === "inflammatory" && g.causes.some(c => /tolosa/i.test(c.name))));
  ok("SOF still offers a neoplastic cause", sof.byCategory.some(g => g.cat === "neoplastic"));
}
// --- 6b: attribute-derived fallback for a site with NO curated + NO phonebook entry ---
{
  const fake = { id: "fake_none", level: "nerve", part: "zz_no_entry", side: "left", territory: "peripheral nerve" };
  const r = causesFor(fake);
  ok("site with no curated + no phonebook → derived", r.source === "derived" && r.derived === true && r.all.length > 0);
  ok("nerve fallback includes entrapment / vasculitic / diabetic", r.all.some(c => /entrapment|compress|vasculit|diabet/i.test(c.name)));
}
// --- 6c: FULL coverage — every phonebook site yields structured causes ---
{
  const allSites = [...SITES];
  for (const k of Object.keys(sitesMod)) if (k.startsWith("compose") && typeof sitesMod[k] === "function") { try { allSites.push(...sitesMod[k]()); } catch {} }
  const siteFor = key => allSites.find(s => s.id === key) || allSites.find(s => `${s.level}_${s.part}` === key)
    || { id: key, level: key.split("_")[0], part: key.split("_").slice(1).join("_"), side: "left", territory: "" };
  let empty = 0, badCat = 0;
  for (const key of Object.keys(BY_SITE)) {
    const r = causesFor(siteFor(key));
    if (!r.all.length) empty++;
    if (!r.all.every(c => catIds.includes(c.cat))) badCat++;
  }
  ok(`every phonebook site (${Object.keys(BY_SITE).length}) yields causes (empty: ${empty})`, empty === 0);
  ok("every categorised cause has a valid category", badCat === 0);
}

// --- 7: red flags retained ---
{
  const r = causesFor(wallenberg);
  ok("a red-flag cause is marked (dissection)", r.all.some(c => c.red === true));
}

// --- sieve completion (Sub-project C) ---
const icSite = SITES.find(s => s.id === "right_subcortex_internal_capsule");
const icRes = causesFor(icSite, {});
const icSpecificCats = new Set(icRes.byCategory.map(g => g.cat));
const icCompCats = new Set(icRes.completion.map(g => g.cat));
// `mimic` is deliberately OUTSIDE the surgical sieve, so it is excluded here: this assertion is about the
// sieve gap-fill demonstration (curated vascular specifics + generics for the sieve categories left empty).
const icSieveCats = new Set([...icSpecificCats].filter(x => x !== "mimic"));
ok("internal capsule sieve specifics are vascular-only", icSieveCats.size === 1 && icSieveCats.has("vascular"));
ok("internal capsule also carries mimics, outside the sieve", icSpecificCats.has("mimic"));
ok("internal capsule completion is unaffected by the mimics", !icCompCats.has("mimic"));
ok("internal capsule completion adds inflammatory", icCompCats.has("inflammatory"));
ok("internal capsule completion adds neoplastic", icCompCats.has("neoplastic"));
ok("internal capsule completion adds infective", icCompCats.has("infective"));
ok("internal capsule completion does NOT repeat vascular", !icCompCats.has("vascular"));
ok("every completion cause is flagged generic", icRes.completion.every(g => g.causes.every(x => x.generic === true)));

// regionOf classification (constructed sites avoid part-specific gotchas like optic_aion)
ok("regionOf: nerve → peripheral", regionOf({ level: "nerve", part: "median" }) === "peripheral");
ok("regionOf: skull_base → skull_base", regionOf({ level: "skull_base", part: "iam" }) === "skull_base");
ok("regionOf: cortex → parenchyma", regionOf({ level: "cortex", part: "mca" }) === "parenchyma");
ok("regionOf: visual_pathway → optic", regionOf({ level: "visual_pathway", part: "chiasm" }) === "optic");
ok("regionOf: an optic-named part overrides to optic", regionOf({ level: "skull_base", part: "optic_aion" }) === "optic");

// gap-fill invariant: completion categories are disjoint from specific categories, for every candidate site
const allSites = [...SITES];
for (const k of Object.keys(sitesMod)) if (k.startsWith("compose") && typeof sitesMod[k] === "function") { try { allSites.push(...sitesMod[k]()); } catch {} }
let disjointHolds = true, offender = null;
for (const s of allSites) {
  const r = causesFor(s, {});
  const spec = new Set(r.byCategory.map(g => g.cat));
  if (r.completion.some(g => spec.has(g.cat))) { disjointHolds = false; offender = s.id; break; }
}
ok("gap-fill invariant: completion never repeats a present category (all sites)", disjointHolds, offender);

// tempo filter applies to the completion
const icHyper = causesFor(icSite, { onset: "hyperacute" }).completion.flatMap(g => g.causes);
ok("completion is tempo-filtered by onset", icHyper.every(x => x.tempo.includes("hyperacute")));

// --- 8: Region A — anterior/posterior circulation cortex (curated, was the generic derived fallback) ---
// These are the highest-traffic sites in the app. The phonebook keys them with dominant/nondominant
// sub-objects rather than a flat `ddx`, so they used to fall through to the attribute-derived generic
// list ("Ischaemic or haemorrhagic stroke") with no discriminating features at all.
{
  const S = (key, part, territory) =>
    ({ id: `left_${key}`, level: "cortex", part, side: "left", territory });
  const region = {
    cortex_mca:                S("cortex_mca", "mca", "MCA (complete territory)"),
    cortex_mca_superior:       S("cortex_mca_superior", "mca_superior", "MCA superior division"),
    cortex_mca_inferior:       S("cortex_mca_inferior", "mca_inferior", "MCA inferior division"),
    cortex_aca:                S("cortex_aca", "aca", "ACA"),
    cortex_pca:                S("cortex_pca", "pca", "PCA"),
    cortex_watershed_anterior: S("cortex_watershed_anterior", "watershed_anterior", "ACA-MCA border zone"),
    cortex_watershed_posterior:S("cortex_watershed_posterior", "watershed_posterior", "MCA-PCA border zone"),
    cortex_motor_facearm:      S("cortex_motor_facearm", "motor_facearm", "MCA (precentral)"),
    cortex_motor_leg:          S("cortex_motor_leg", "motor_leg", "ACA (paracentral)"),
    cortex_sensory_facearm:    S("cortex_sensory_facearm", "sensory_facearm", "MCA (postcentral)"),
    cortex_sensory_leg:        S("cortex_sensory_leg", "sensory_leg", "ACA (paracentral)"),
    cortex_parietal:           S("cortex_parietal", "parietal", "MCA inferior division"),
  };
  for (const [key, site] of Object.entries(region)) {
    ok(`Region A curated: ${key}`, Array.isArray(CAUSES[key]) && CAUSES[key].length >= 3);
    const r = causesFor(site);
    ok(`Region A ${key} resolves as curated (not the generic fallback)`, r.source === "curated");
    ok(`Region A ${key} spans >= 2 sieve categories`, new Set(r.all.map(x => x.cat)).size >= 2);
    ok(`Region A ${key} — every cause carries a discriminating feature`, r.all.every(x => x.feature && x.feature.length > 10));
  }
  // specific clinical emergences the curation must teach
  const has = (key, re) => (CAUSES[key] || []).some(c => re.test(c.name));
  const feat = (key, re) => (CAUSES[key] || []).find(c => re.test(c.name)) || {};
  ok("complete MCA names proximal MCA / carotid-T occlusion (LVO)", has("cortex_mca", /carotid.t|proximal mca|\bm1\b/i));
  ok("complete MCA flags malignant MCA oedema as a red flag", (CAUSES.cortex_mca || []).some(c => /malignant/i.test(c.name) && c.red === true));
  ok("complete MCA malignant-oedema feature names the day 2-5 deterioration window", /day\s*2|2.5|decompress/i.test(feat("cortex_mca", /malignant/i).feature || ""));
  ok("complete MCA includes carotid dissection", has("cortex_mca", /dissection/i));
  ok("carotid dissection flags the painful Horner's on exam", /horner/i.test(feat("cortex_mca", /dissection/i).pathognomonic || ""));
  ok("MCA inferior division includes HSV encephalitis (temporal, can't-miss)", (CAUSES.cortex_mca_inferior || []).some(c => /herpes|hsv/i.test(c.name) && c.red === true && c.cat === "infective"));
  ok("ACA includes parasagittal meningioma (the cord-mimic)", has("cortex_aca", /parasagittal/i));
  ok("ACA parasagittal feature warns it mimics a cord lesion", /cord/i.test(feat("cortex_aca", /parasagittal/i).feature || ""));
  ok("ACA includes superior sagittal sinus thrombosis as a red flag", (CAUSES.cortex_aca || []).some(c => /sagittal sinus/i.test(c.name) && c.red === true));
  ok("PCA includes PRES (metabolic, reversible)", (CAUSES.cortex_pca || []).some(c => /pres|posterior reversible/i.test(c.name) && c.cat === "metabolic"));
  ok("watershed names hypoperfusion / border-zone mechanism", has("cortex_watershed_anterior", /watershed|border.zone|hypoperfusion/i));
  ok("watershed names severe carotid stenosis", has("cortex_watershed_anterior", /carotid stenosis|carotid occlusion/i));
  ok("anterior watershed teaches the man-in-a-barrel pattern", (CAUSES.cortex_watershed_anterior || []).some(c => /man.in.a.barrel/i.test(c.feature || "")));
  ok("motor-leg strip includes parasagittal meningioma", has("cortex_motor_leg", /parasagittal/i));
  ok("parietal includes posterior cortical atrophy (degenerative)", (CAUSES.cortex_parietal || []).some(c => /posterior cortical atrophy|benson/i.test(c.name) && c.cat === "degenerative"));
  // tempo realism: every Region A vascular cause must be reachable at a hyperacute/acute onset
  const vascTempoOk = Object.keys(region).every(k =>
    (CAUSES[k] || []).filter(c => c.cat === "vascular").every(c => c.tempo.some(t => t === "hyperacute" || t === "acute")));
  ok("Region A vascular causes are all acute-or-faster in tempo", vascTempoOk);
  // the onset filter still narrows sensibly at these newly-curated sites
  const mcaChronic = causesFor(region.cortex_mca, { onset: "chronic" });
  ok("complete MCA at chronic onset drops the hyperacute-only occlusion", mcaChronic.all.every(c => c.tempo.includes("chronic")));
}

// --- 9: the MIMIC category (owner-approved 2026-08-09) ---
// Todd's paresis, migraine aura and the like are high-yield differentials for the PRESENTATION but are not
// lesions at the site at all, so they get their own bucket rather than being shoehorned into the sieve.
{
  ok("mimic category exists", catIds.includes("mimic"));
  const mimicCat = CATEGORIES.find(c => c.id === "mimic");
  ok("mimic category is listed LAST so real pathology leads", CATEGORIES[CATEGORIES.length - 1].id === "mimic");
  ok("mimic label makes clear it is not a lesion at this site", /not a lesion|no lesion|non.lesional/i.test(mimicCat.label));
  ok("mimic category has a tint", !!mimicCat.tint);
  // colour-collision guard: every category needs its OWN token, and mimic must not borrow --contra
  // (aliased to the same hex as --terra in the dark theme, which made mimic look vascular).
  const tints = CATEGORIES.map(c => c.tint);
  ok("every category has a distinct tint token", new Set(tints).size === tints.length);
  ok("mimic uses its dedicated --mimic token", mimicCat.tint === "--mimic");
  ok("no category borrows the --terra-aliased --contra token", !tints.includes("--contra"));

  const S = (key, part) => ({ id: `left_${key}`, level: "cortex", part, side: "left", territory: "" });
  ok("MCA superior division offers Todd's paresis as a mimic",
     (CAUSES.cortex_mca_superior || []).some(c => c.cat === "mimic" && /todd/i.test(c.name)));
  ok("complete MCA offers hypoglycaemia as a mimic (the bedside must-exclude)",
     (CAUSES.cortex_mca || []).some(c => c.cat === "mimic" && /hypoglyc/i.test(c.name)));
  ok("PCA/occipital offers migraine aura as a mimic",
     (CAUSES.cortex_pca || []).some(c => c.cat === "mimic" && /migraine/i.test(c.name)));
  ok("MCA inferior division offers a mimic for the fluent-aphasia picture",
     (CAUSES.cortex_mca_inferior || []).some(c => c.cat === "mimic"));
  // mimics obey the same content norms as every other cause
  const allMimics = Object.keys(CAUSES).flatMap(k => CAUSES[k].filter(c => c.cat === "mimic"));
  ok(`mimics carry a discriminating feature (${allMimics.length} mimics)`, allMimics.length > 0 && allMimics.every(c => c.feature && c.feature.length > 10));
  ok("mimics have a valid tempo", allMimics.every(c => c.tempo.every(t => tempoIds.includes(t))));
  // a mimic surfaces through causesFor as its own group
  const supRes = causesFor(S("cortex_mca_superior", "mca_superior"));
  ok("causesFor groups mimics separately", supRes.byCategory.some(g => g.cat === "mimic" && g.causes.length));
  ok("the mimic group sorts after the real pathology groups",
     supRes.byCategory.findIndex(g => g.cat === "mimic") === supRes.byCategory.length - 1);
  // the sieve gap-fill must NEVER invent a generic mimic — mimics are site-specific or absent
  const allS = [...SITES];
  for (const k of Object.keys(sitesMod)) if (k.startsWith("compose") && typeof sitesMod[k] === "function") { try { allS.push(...sitesMod[k]()); } catch {} }
  let genericMimic = null;
  for (const s of allS) { const r = causesFor(s, {}); if (r.completion.some(g => g.cat === "mimic")) { genericMimic = s.id; break; } }
  ok(`sieve completion never fabricates a generic mimic (offender: ${genericMimic})`, genericMimic === null);
  // the live phonebook categoriser recognises mimic language too
  const cat1 = causesFor({ id: "z1", level: "cortex", part: "zz", side: "left", territory: "" });
  ok("derived fallback introduces no mimics", cat1.all.every(c => c.cat !== "mimic"));
}

// --- 10: Region B — lacunar / deep grey + cord emergencies ---
// The highest-consequence region: cauda equina and cord compression are time-critical, and the deep
// lacunar syndromes are where "no cortical signs" has to actively point somewhere rather than nowhere.
{
  const site = (key, level, part) => ({ id: `left_${key}`, level, part, side: "left", territory: "" });
  const region = {
    subcortex_corona_radiata:   site("subcortex_corona_radiata", "subcortex", "corona_radiata"),
    subcortex_thalamus:         site("subcortex_thalamus", "subcortex", "thalamus"),
    subcortex_anterior_choroidal: site("subcortex_anterior_choroidal", "subcortex", "anterior_choroidal"),
    subcortex_sensorimotor:     site("subcortex_sensorimotor", "subcortex", "sensorimotor"),
    subcortex_optic_radiation:  site("subcortex_optic_radiation", "subcortex", "optic_radiation"),
    pons_basis_pontis:          site("pons_basis_pontis", "pons", "basis_pontis"),
    cord_transverse:            site("cord_transverse", "cord", "transverse"),
    cord_hemi:                  site("cord_hemi", "cord", "hemi"),
    cord_lateral:               site("cord_lateral", "cord", "lateral"),
    cauda_equina:               site("cauda_equina", "cauda", "equina"),
    conus_medullaris:           site("conus_medullaris", "conus", "medullaris"),
    craniocervical_junction_foramen_magnum: site("craniocervical_junction_foramen_magnum", "craniocervical_junction", "foramen_magnum"),
  };
  for (const [key, s] of Object.entries(region)) {
    ok(`Region B curated: ${key}`, Array.isArray(CAUSES[key]) && CAUSES[key].length >= 3);
    const r = causesFor(s);
    ok(`Region B ${key} resolves as curated`, r.source === "curated");
    ok(`Region B ${key} — every cause carries a discriminating feature`, r.all.every(x => x.feature && x.feature.length > 10));
    ok(`Region B ${key} spans >= 2 categories`, new Set(r.all.map(x => x.cat)).size >= 2);
  }
  const has = (key, re) => (CAUSES[key] || []).some(c => re.test(c.name));
  const find = (key, re) => (CAUSES[key] || []).find(c => re.test(c.name)) || {};

  // cauda equina — the time-critical one
  ok("cauda equina leads with central disc prolapse", has("cauda_equina", /disc/i));
  ok("cauda equina includes epidural abscess, red-flagged", (CAUSES.cauda_equina || []).some(c => /abscess/i.test(c.name) && c.red === true));
  ok("cauda equina includes spinal epidural haematoma (anticoagulation)", has("cauda_equina", /haematoma|hematoma/i));
  ok("cauda equina haematoma feature names anticoagulation / recent procedure", /anticoagul|warfarin|doac|spinal|epidural (injection|anaesth)/i.test(find("cauda_equina", /haematoma|hematoma/i).feature || ""));
  ok("cauda equina includes metastatic compression, red-flagged", (CAUSES.cauda_equina || []).some(c => /metasta|malignan|tumour/i.test(c.name) && c.red === true));
  ok("every cauda equina cause is red-flagged or explicitly time-critical",
     (CAUSES.cauda_equina || []).filter(c => c.cat !== "mimic").every(c => c.red === true));

  // conus vs cauda — the discrimination that changes which level gets imaged
  ok("conus teaches the early symmetric sphincter + UMN discriminator",
     (CAUSES.conus_medullaris || []).some(c => /symmetric|sphincter|upper motor|umn|brisk|extensor plantar/i.test(c.feature || "")));

  // transverse cord — compression must be excluded before an inflammatory label
  ok("transverse cord names compression, red-flagged", (CAUSES.cord_transverse || []).some(c => /compress/i.test(c.name) && c.red === true));
  ok("transverse cord names transverse myelitis", has("cord_transverse", /myelitis/i));
  ok("transverse cord names cord infarct", has("cord_transverse", /infarct/i));
  ok("transverse cord myelitis feature defers to excluding compression first",
     /compress|exclude|before/i.test(find("cord_transverse", /myelitis/i).feature || ""));

  // Brown-Sequard
  ok("hemicord names penetrating / traumatic injury", has("cord_hemi", /penetrat|trauma|stab/i));
  ok("hemicord names a compressive lesion, red-flagged", (CAUSES.cord_hemi || []).some(c => /compress|tumour|disc/i.test(c.name) && c.red === true));

  // deep lacunar
  ok("internal capsule teaches the capsular warning syndrome", has("subcortex_internal_capsule", /capsular warning/i));
  ok("capsular warning feature describes stuttering / crescendo events",
     /stutter|crescendo|recurrent|fluctuat/i.test(find("subcortex_internal_capsule", /capsular warning/i).feature || ""));
  ok("thalamic site names Dejerine-Roussy / central post-stroke pain", has("subcortex_thalamus", /jerine|central post.stroke pain/i));
  ok("thalamic haemorrhage is red-flagged", (CAUSES.subcortex_thalamus || []).some(c => /haemorrhage|hemorrhage/i.test(c.name) && c.red === true));
  ok("anterior choroidal teaches the triad from one small perforator",
     (CAUSES.subcortex_anterior_choroidal || []).some(c => /triad|hemianopia|three/i.test(c.feature || "")));
  ok("optic radiation teaches Meyer's loop / quadrantanopia",
     (CAUSES.subcortex_optic_radiation || []).some(c => /meyer|quadrantanop|pie in the sky/i.test(c.feature || "") || /meyer/i.test(c.name)));

  // craniocervical junction
  ok("craniocervical junction names Chiari I", has("craniocervical_junction_foramen_magnum", /chiari/i));
  ok("craniocervical junction names foramen-magnum meningioma", has("craniocervical_junction_foramen_magnum", /meningioma|foramen.magnum/i));
  ok("craniocervical junction includes drug causes of downbeat nystagmus (lithium / anticonvulsant)",
     has("craniocervical_junction_foramen_magnum", /lithium|anticonvuls|phenytoin|toxic/i));

  // pathognomonic additions land via the central table (so they flag wherever the disease is named)
  const cjk = causesFor(region.craniocervical_junction_foramen_magnum);
  ok("Chiari flags the cough-induced headache on exam",
     cjk.all.some(x => /chiari/i.test(x.name) && /cough|strain|valsalva|laugh/i.test(x.pathognomonic || "")));
  const th = causesFor(region.subcortex_thalamus);
  ok("thalamic haemorrhage flags the forced-downgaze / small-pupil sign",
     th.all.some(x => /haemorrhage/i.test(x.name) && /downward|down.gaze|tip of the nose|pupil/i.test(x.pathognomonic || "")));

  // tempo realism for the emergencies
  ok("cord + cauda vascular/traumatic causes are acute-or-faster",
     ["cord_transverse","cord_hemi","cauda_equina","conus_medullaris"].every(k =>
       (CAUSES[k] || []).filter(c => c.cat === "vascular" || c.cat === "traumatic")
         .every(c => c.tempo.some(t => t === "hyperacute" || t === "acute"))));
}

// --- 11: Region C — remaining brainstem + cerebellum ---
// Posterior fossa: where a small lesion is lethal, where "awake but unable to move" gets mistaken for coma,
// and where the treatable metabolic causes (Wernicke, osmotic demyelination) hide among the strokes.
{
  const REGION_C = ["midbrain_lateral","midbrain_trochlear","midbrain_hemi","dorsal_midbrain_tectum",
    "pons_lateral","pons_lateral_trigeminal","pons_trigeminal","pons_hemi","medulla_hemi",
    "pontomesencephalic_tegmentum","brainstem_aras_paramedian_tegmentum","locked_in_ventral_pons",
    "thalamus_arousal_paramedian","pseudobulbar_corticobulbar",
    "cerebellum_vermis","cerebellum_flocculonodular","cerebellum_pancerebellar",
    "guillain_mollaret_rubral","guillain_mollaret_dentate"];
  for (const key of REGION_C) {
    ok(`Region C curated: ${key}`, Array.isArray(CAUSES[key]) && CAUSES[key].length >= 3);
    const list = CAUSES[key] || [];
    ok(`Region C ${key} — every cause carries a discriminating feature`, list.length > 0 && list.every(x => x.feature && x.feature.length > 10));
    ok(`Region C ${key} spans >= 2 categories`, new Set(list.map(x => x.cat)).size >= 2);
    ok(`Region C ${key} — valid categories and tempo`, list.every(x => catIds.includes(x.cat) && x.tempo.every(t => tempoIds.includes(t))));
  }
  const has = (k, re) => (CAUSES[k] || []).some(c => re.test(c.name));
  const feat = (k, re) => (CAUSES[k] || []).some(c => re.test(c.feature || ""));
  const red = (k, re) => (CAUSES[k] || []).some(c => re.test(c.name) && c.red === true);

  // locked-in: the one that gets mistaken for coma
  ok("locked-in names basilar artery occlusion, red-flagged", red("locked_in_ventral_pons", /basilar/i));
  ok("locked-in teaches that the patient is AWAKE and communicates by vertical eye movement",
     feat("locked_in_ventral_pons", /awake|aware|conscious|vertical eye|blink/i));
  ok("locked-in includes central pontine myelinolysis", has("locked_in_ventral_pons", /myelinolysis|osmotic/i));
  ok("pontine hemisyndrome includes osmotic demyelination with the sodium-correction clue",
     (CAUSES.pons_hemi || []).some(c => /myelinolysis|osmotic/i.test(c.name) && /sodium|hyponatr|rapid|correct/i.test(c.feature || "")));

  // artery of Percheron — and the venous mimic that must not be missed
  ok("Percheron names the artery of Percheron", has("thalamus_arousal_paramedian", /percheron/i));
  ok("bilateral thalamic picture also names deep cerebral venous thrombosis",
     has("thalamus_arousal_paramedian", /venous|thrombosis|straight sinus|galen/i));

  // dorsal midbrain / Parinaud
  ok("dorsal midbrain names a pineal tumour", has("dorsal_midbrain_tectum", /pineal|germinoma/i));
  ok("dorsal midbrain names hydrocephalus, red-flagged", red("dorsal_midbrain_tectum", /hydrocephalus|shunt/i));
  const parinaudSign = causesFor({ id: "dorsal_midbrain_tectum", level: "dorsal_midbrain", part: "tectum", side: "midline", territory: "" })
    .all.some(x => /convergence.retraction|light.near/i.test(x.pathognomonic || "") || /convergence.retraction|light.near/i.test(x.feature || ""));
  ok("dorsal midbrain teaches convergence-retraction nystagmus / light-near dissociation", parinaudSign);

  // AICA vs PICA — the discriminator is hearing
  ok("lateral pons (AICA) teaches ipsilateral deafness as the AICA-vs-PICA discriminator",
     feat("pons_lateral", /deaf|hearing/i));
  // trigeminal complex — MS in the young
  ok("pontine trigeminal names demyelination", has("pons_trigeminal", /demyelin|multiple sclerosis|\bms\b/i));
  // trochlear nucleus decussates
  ok("trochlear nucleus teaches the CONTRALATERAL superior oblique palsy",
     feat("midbrain_trochlear", /contralateral|decussat|head tilt|superior oblique/i));
  // upbeat nystagmus — the treatable one
  ok("pontomesencephalic tegmentum names Wernicke's, red-flagged", red("pontomesencephalic_tegmentum", /wernicke|thiamine/i));
  // pseudobulbar vs bulbar
  ok("pseudobulbar teaches the UMN-vs-LMN bulbar discriminator (brisk jaw jerk / spastic tongue)",
     feat("pseudobulbar_corticobulbar", /jaw jerk|spastic tongue|brisk|fasciculat|wasted/i));
  ok("pseudobulbar names motor neurone disease", has("pseudobulbar_corticobulbar", /motor neurone|motor neuron|\bmnd\b|\bals\b/i));
  // cerebellum
  ok("vermis names alcohol-related degeneration", has("cerebellum_vermis", /alcohol/i));
  ok("vermis names medulloblastoma (the paediatric midline tumour)", has("cerebellum_vermis", /medulloblastoma/i));
  ok("pancerebellar names a paraneoplastic cause", has("cerebellum_pancerebellar", /paraneoplas|anti.yo|anti.hu/i));
  ok("pancerebellar names anticonvulsant toxicity", has("cerebellum_pancerebellar", /phenytoin|anticonvuls|toxic/i));
  ok("pancerebellar names a hereditary ataxia", has("cerebellum_pancerebellar", /spinocerebellar|\bsca\b|hereditar|friedreich/i));
  // Guillain-Mollaret — the delayed sign
  ok("Guillain-Mollaret corners teach the DELAY before palatal tremor appears",
     feat("guillain_mollaret_dentate", /month|delay|week|later|hypertroph/i) || feat("guillain_mollaret_rubral", /month|delay|week|later|hypertroph/i));
  // midbrain eponyms
  ok("lateral midbrain names Claude's or Benedikt's syndrome",
     /claude|benedikt/i.test(JSON.stringify(CAUSES.midbrain_lateral || [])) ||
     feat("midbrain_lateral", /claude|benedikt|red nucleus|tremor|ataxia/i));

  // posterior-fossa safety: cerebellar mass effect is the thing that kills
  ok("cerebellar sites flag swelling / obstructive hydrocephalus somewhere in their causes",
     ["cerebellum_vermis","cerebellum_pancerebellar","cerebellum_flocculonodular"].some(k =>
       feat(k, /swell|hydrocephalus|mass effect|herniat|compress/i)));
}

// --- 12: Region D — skull base / cranial-nerve course, visual pathway, pupil, olfactory ---
// The longitudinal axis: WHERE ALONG a nerve's course the lesion sits changes the differential entirely,
// and several of these are "this sign means cancer / aneurysm / dissection until proven otherwise".
{
  const REGION_D = [
    "visual_pathway_chiasm","visual_pathway_optic_tract","visual_pathway_lgn","skull_base_optic_canal",
    "olfactory_olfactory_groove",
    "pupil_cn3_compressive","pupil_cn3_ischaemic","pupil_ciliary_ganglion",
    "skull_base_iii_orbit_sup","skull_base_iii_orbit_inf","skull_base_vi_cisternal","skull_base_vi_petrous_apex",
    "skull_base_trochlear_cisternal","skull_base_sup_orbital_fissure",
    "skull_base_v_ganglion","skull_base_v1_division","skull_base_v1_petrous","skull_base_foramen_rotundum","skull_base_v3_ovale",
    "skull_base_vii_tympanic","skull_base_vii_mastoid","skull_base_vii_parotid",
    "skull_base_ix_jugular","skull_base_x_jugular","skull_base_x_recurrent_laryngeal",
    "skull_base_xi_jugular","skull_base_xi_posterior_triangle",
    "skull_base_hypoglossal_canal","skull_base_xii_neck","skull_base_carotid_space",
    "skull_base_collet_sicard","skull_base_villaret",
  ];
  for (const key of REGION_D) {
    const list = CAUSES[key] || [];
    ok(`Region D curated: ${key}`, Array.isArray(CAUSES[key]) && list.length >= 3);
    ok(`Region D ${key} — every cause carries a discriminating feature`, list.length > 0 && list.every(x => x.feature && x.feature.length > 10));
    ok(`Region D ${key} spans >= 2 categories`, new Set(list.map(x => x.cat)).size >= 2);
    ok(`Region D ${key} — valid categories and tempo`, list.every(x => catIds.includes(x.cat) && x.tempo.every(t => tempoIds.includes(t))));
  }
  const has = (k, re) => (CAUSES[k] || []).some(c => re.test(c.name));
  const feat = (k, re) => (CAUSES[k] || []).some(c => re.test(c.feature || "") || re.test(c.pathognomonic || ""));
  const red = (k, re) => (CAUSES[k] || []).some(c => re.test(c.name) && c.red === true);

  // THE third-nerve rule: pupil involvement separates aneurysm from microvascular
  ok("compressive CN III names a posterior communicating artery aneurysm, red-flagged",
     red("pupil_cn3_compressive", /aneurysm|posterior communicating|pcom/i));
  ok("compressive CN III teaches 'pupil-involving = aneurysm until proven otherwise'",
     feat("pupil_cn3_compressive", /pupil/i) && feat("pupil_cn3_compressive", /aneurysm|until proven|urgent|angiog/i));
  ok("compressive CN III names uncal herniation", has("pupil_cn3_compressive", /herniat|uncal/i));
  ok("ischaemic CN III is the PUPIL-SPARING microvascular one",
     feat("pupil_cn3_ischaemic", /pupil.spar|spares the pupil/i) && has("pupil_cn3_ischaemic", /microvascular|diabet|ischaem/i));
  // Adie
  ok("Adie pupil teaches dilute-pilocarpine denervation supersensitivity",
     feat("pupil_ciliary_ganglion", /pilocarpine|supersensitiv|tonic/i));
  // CN VI false localising sign
  ok("cisternal CN VI teaches the false-localising sign of raised intracranial pressure",
     feat("skull_base_vi_cisternal", /false.localis|false.localiz|raised intracranial|raised icp/i));
  // facial nerve: the segment changes the diagnosis
  ok("parotid facial palsy names malignancy, red-flagged", red("skull_base_vii_parotid", /malignan|carcinoma|tumour|cancer/i));
  ok("parotid facial palsy warns it is NOT Bell's palsy",
     feat("skull_base_vii_parotid", /not bell|rather than bell|never bell|mass|lump/i));
  ok("tympanic/mastoid facial palsy names cholesteatoma or middle-ear disease",
     has("skull_base_vii_tympanic", /cholesteatoma|otitis|middle.ear/i) || has("skull_base_vii_mastoid", /cholesteatoma|otitis|mastoid/i));
  // lower cranial nerves
  ok("recurrent laryngeal names lung malignancy", has("skull_base_x_recurrent_laryngeal", /lung|bronch|mediastin|malignan/i));
  ok("recurrent laryngeal teaches the LEFT nerve's aortic-arch loop",
     feat("skull_base_x_recurrent_laryngeal", /aortic arch|left.*loop|loops/i));
  ok("recurrent laryngeal names thyroid/neck surgery as iatrogenic", has("skull_base_x_recurrent_laryngeal", /thyroid|surg|iatrogen/i));
  ok("accessory nerve in the posterior triangle names iatrogenic lymph-node biopsy",
     has("skull_base_xi_posterior_triangle", /biopsy|iatrogen|surg/i));
  // carotid space — dissection
  ok("carotid space names dissection, red-flagged", red("skull_base_carotid_space", /dissect/i));
  // chiasm — the treatable emergency
  ok("chiasm names pituitary adenoma", has("visual_pathway_chiasm", /pituitary|adenoma/i));
  ok("chiasm names pituitary apoplexy, red-flagged", red("visual_pathway_chiasm", /apoplexy/i));
  ok("chiasm names craniopharyngioma or meningioma", has("visual_pathway_chiasm", /craniopharyngioma|meningioma/i));
  // optic canal / olfactory groove
  ok("optic canal names traumatic optic neuropathy", has("skull_base_optic_canal", /trauma/i));
  ok("olfactory groove names meningioma", has("olfactory_olfactory_groove", /meningioma/i));
  ok("olfactory groove teaches Foster Kennedy", feat("olfactory_olfactory_groove", /foster kennedy/i) || has("olfactory_olfactory_groove", /foster kennedy/i));
  ok("olfactory groove names post-viral anosmia", has("olfactory_olfactory_groove", /viral|covid|infect/i));
  // V3 — numb chin is sinister
  ok("V3 / foramen ovale names perineural tumour spread", has("skull_base_v3_ovale", /perineural|spread|malignan|carcinoma/i));
  ok("V3 teaches that a numb chin suggests malignancy",
     feat("skull_base_v3_ovale", /numb chin|mental nerve|malignan|sinister/i));
  // trochlear nerve course — trauma
  ok("cisternal CN IV names head trauma", has("skull_base_trochlear_cisternal", /trauma/i));
  // multi-nerve skull-base syndromes
  ok("Collet-Sicard and Villaret span multiple lower cranial nerves with a mass lesion",
     has("skull_base_collet_sicard", /tumour|metasta|glomus|schwannoma|carcinoma/i) &&
     has("skull_base_villaret", /tumour|metasta|glomus|schwannoma|carcinoma|dissect/i));
  ok("Villaret includes the sympathetic chain (Horner's) in its feature text",
     feat("skull_base_villaret", /horner|sympathetic/i));
}

// --- 13: Region E — named peripheral nerves + polyneuropathy + motor unit ---
// Entrapments share a generic aetiology (compress / trauma / diabetes), so the value here is entirely in the
// per-site DISCRIMINATOR: which branch is spared tells you the level, and that is what these assert.
{
  const REGION_E = [
    "nerve_phrenic","nerve_pudendal","nerve_saphenous","nerve_sural","nerve_axillary","nerve_musculocutaneous",
    "nerve_suprascapular","nerve_long_thoracic","nerve_radial_axilla","nerve_radial_spiral_groove","nerve_radial_pin",
    "nerve_median_proximal","nerve_median_ain","nerve_median_carpal_tunnel","nerve_ulnar_elbow","nerve_ulnar_wrist",
    "nerve_femoral","nerve_obturator","nerve_lat_fem_cutaneous","nerve_superior_gluteal","nerve_sciatic",
    "nerve_peroneal_common","nerve_peroneal_deep","nerve_peroneal_superficial","nerve_tibial",
    "polyneuropathy_length_dependent","motor_unit_nmj_presynaptic","motor_unit_muscle",
  ];
  for (const key of REGION_E) {
    const list = CAUSES[key] || [];
    ok(`Region E curated: ${key}`, Array.isArray(CAUSES[key]) && list.length >= 3);
    ok(`Region E ${key} — every cause carries a discriminating feature`, list.length > 0 && list.every(x => x.feature && x.feature.length > 10));
    ok(`Region E ${key} spans >= 2 categories`, new Set(list.map(x => x.cat)).size >= 2);
    ok(`Region E ${key} — valid categories and tempo`, list.every(x => catIds.includes(x.cat) && x.tempo.every(t => tempoIds.includes(t))));
  }
  const has = (k, re) => (CAUSES[k] || []).some(c => re.test(c.name));
  const feat = (k, re) => (CAUSES[k] || []).some(c => re.test(c.feature || "") || re.test(c.pathognomonic || ""));
  const red = (k, re) => (CAUSES[k] || []).some(c => re.test(c.name) && c.red === true);

  // the level-localising SPARING rules — the heart of peripheral-nerve teaching
  ok("radial at the axilla involves TRICEPS (vs spiral groove, which spares it)",
     feat("nerve_radial_axilla", /triceps/i));
  ok("radial at the spiral groove SPARES triceps", feat("nerve_radial_spiral_groove", /triceps/i));
  ok("PIN palsy has NO sensory loss and no true wrist drop",
     feat("nerve_radial_pin", /no sensory|sensation is spared|pure motor|radial deviat/i));
  ok("carpal tunnel spares the palmar cutaneous branch (thenar skin sensation)",
     feat("nerve_median_carpal_tunnel", /palmar cutaneous|thenar (skin|eminence)|spared/i));
  ok("ulnar at the elbow involves the DORSAL cutaneous branch (dorsal hand numbness)",
     feat("nerve_ulnar_elbow", /dorsal/i));
  ok("ulnar at the wrist SPARES dorsal hand sensation", feat("nerve_ulnar_wrist", /dorsal/i));
  ok("AIN palsy is PURE MOTOR — the weak 'OK' sign",
     feat("nerve_median_ain", /ok sign|pure motor|pinch|flexor pollicis/i));
  ok("common peroneal palsy spares INVERSION — the L5 discriminator",
     feat("nerve_peroneal_common", /inversion|\bl5\b/i));
  ok("long thoracic gives MEDIAL winging (vs the lateral winging of accessory palsy)",
     feat("nerve_long_thoracic", /medial|wing/i));

  // don't-miss aetiologies
  ok("femoral nerve names retroperitoneal haematoma, red-flagged",
     red("nerve_femoral", /haematoma|hematoma|retroperitoneal/i));
  ok("femoral haematoma feature names anticoagulation", feat("nerve_femoral", /anticoagul|warfarin|doac|heparin/i));
  ok("phrenic nerve names malignancy as a cause", has("nerve_phrenic", /malignan|tumour|lung|cancer/i));
  ok("phrenic nerve teaches orthopnoea / raised hemidiaphragm", feat("nerve_phrenic", /orthopn|diaphragm|supine|lying flat/i));
  ok("suprascapular names a ganglion cyst at the notch", has("nerve_suprascapular", /ganglion|cyst/i));
  ok("axillary nerve names shoulder dislocation / humeral neck fracture",
     has("nerve_axillary", /disloc|humer|fracture/i));
  ok("axillary teaches the regimental-badge sensory patch", feat("nerve_axillary", /regimental|badge|deltoid/i));
  ok("meralgia paraesthetica is PURE SENSORY with no weakness",
     feat("nerve_lat_fem_cutaneous", /pure sensory|no weakness|sensory only/i));
  ok("sciatic palsy teaches that the peroneal division is more vulnerable",
     feat("nerve_sciatic", /peroneal|fibular/i));
  ok("pudendal neuralgia teaches sitting-dependent pain", feat("nerve_pudendal", /sitting|sit\b|standing|toilet/i));
  ok("saphenous / sural name iatrogenic surgical causes",
     has("nerve_saphenous", /surg|vein|harvest|knee|iatrogen/i) && has("nerve_sural", /biops|surg|iatrogen/i));

  // generalised: the treatable and the sinister
  ok("polyneuropathy leads with diabetes", has("polyneuropathy_length_dependent", /diabet/i));
  ok("polyneuropathy names B12 deficiency (treatable)", has("polyneuropathy_length_dependent", /b12|cobalamin/i));
  ok("polyneuropathy names a hereditary cause (CMT)", has("polyneuropathy_length_dependent", /charcot.marie|\bcmt\b|hereditar/i));
  ok("polyneuropathy flags rapid or asymmetric progression as the red flag",
     (CAUSES.polyneuropathy_length_dependent || []).some(c => c.red === true && /vasculit|guillain|\bgbs\b|cidp|rapid/i.test(c.name + " " + (c.feature || ""))));
  ok("LEMS names small cell lung cancer, red-flagged", red("motor_unit_nmj_presynaptic", /small cell|lung|paraneoplas/i));
  ok("LEMS teaches post-exercise AUGMENTATION (the opposite of myasthenia)",
     feat("motor_unit_nmj_presynaptic", /augment|facilitat|improve|after exercise|sustained contraction/i));
  ok("myopathy names statins and an inflammatory cause",
     has("motor_unit_muscle", /statin/i) && has("motor_unit_muscle", /myositis|inflammat|dermatomyos|polymyos/i));
  ok("myopathy flags rhabdomyolysis, red-flagged", red("motor_unit_muscle", /rhabdomyolys/i));
}

// ---- report ----
console.log("\nNeuroLocaliser — CAUSES / AETIOLOGY LAYER (the 'what')\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
