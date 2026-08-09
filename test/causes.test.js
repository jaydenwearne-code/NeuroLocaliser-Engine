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
  // a NAMED site not hand-curated → its phonebook ddx is categorised live
  const sof = { id: "left_skull_base_sup_orbital_fissure", level: "skull_base", part: "sup_orbital_fissure", side: "left", territory: "superior orbital fissure" };
  const r = causesFor(sof);
  ok("SOF (phonebook-sourced, not curated)", r.source === "phonebook" && r.derived === false && r.all.length > 0);
  ok("SOF ddx categorised — Tolosa-Hunt → inflammatory", r.byCategory.some(g => g.cat === "inflammatory" && g.causes.some(c => /tolosa/i.test(c.name))));
  ok("SOF ddx categorised — tumour → neoplastic", r.byCategory.some(g => g.cat === "neoplastic"));
  ok("phonebook causes have valid cat/tempo/likelihood", r.all.every(c => catIds.includes(c.cat) && c.tempo.every(t=>tempoIds.includes(t)) && likeIds.includes(c.likelihood)));
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
ok("internal capsule specifics are vascular-only", icSpecificCats.size === 1 && icSpecificCats.has("vascular"));
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

// ---- report ----
console.log("\nNeuroLocaliser — CAUSES / AETIOLOGY LAYER (the 'what')\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
