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

// ---- report ----
console.log("\nNeuroLocaliser — CAUSES / AETIOLOGY LAYER (the 'what')\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
