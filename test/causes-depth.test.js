// causes-depth.test.js — the differential-DEPTH invariants.
//
// The surgical sieve is an AUTHORING CHECKLIST, not an output format. It must never manufacture
// content to fill itself: where a category has no plausible cause at a site, the honest output is
// silence. Breadth-by-generic is therefore replaced by curated depth.
//
// The A..H sweep is COMPLETE (2026-08-11), so the `DEEPENED` region registry that let a half-finished
// sweep run green has been retired: these invariants now assert over EVERY key in CAUSES directly.
// Anything added from here on must clear the bar on arrival.
//
// Spec: docs/superpowers/specs/2026-08-11-differential-depth-design.md
// Run: node test/causes-depth.test.js
import { CAUSES, CATEGORIES, causesFor } from "../src/data/causes.js";
import { candidateSites } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

const KEYS = Object.keys(CAUSES);
const MIN_CAUSES = 6;

// Scope: these apply to every CURATED site, which since the sweep is every real candidate site. They do
// NOT apply to the phonebook / derive() fallback paths, which remain reachable only for synthetic probes
// (zz_never_curated) and for any future site added before it is curated — those are asserted separately
// in causes.test.js.

// --- 1: the gap-fill is GONE ---
// causesFor() used to pad every site with region-typical generics for the sieve categories the curated
// list didn't cover ("Abscess / focal infection" on an acute pure-motor lacune). 349/375 sites fired it.
{
  const site = { id: "cortex_mca", level: "cortex", part: "mca", side: "left", territory: "MCA" };
  const res = causesFor(site, {});
  ok("causesFor() no longer returns a `completion` gap-fill", res.completion === undefined);
  ok("no cause is flagged `generic`", res.all.every(c => !c.generic));
}
{
  let offender = "";
  for (const s of candidateSites()) {
    const r = causesFor(s, {});
    if (r.completion !== undefined || r.all.some(c => c.generic)) { offender = s.id; break; }
  }
  ok("no candidate site emits generic filler", offender === "", offender);
}

// --- 2: depth — every site carries a real differential ---
{
  const thin = KEYS.filter(k => CAUSES[k].length < MIN_CAUSES).map(k => `${k} (${CAUSES[k].length})`);
  ok(`every curated site has >= ${MIN_CAUSES} causes (${thin.length} below)`, thin.length === 0, thin.slice(0, 8).join(", "));
}

// --- 3: discrimination — every cause says what points to it ---
{
  const bare = [];
  for (const k of KEYS)
    for (const c of CAUSES[k])
      if (!(typeof c.feature === "string" && c.feature.trim().length > 0)) bare.push(`${k}: ${c.name}`);
  ok(`every cause carries a discriminating feature (${bare.length} bare)`, bare.length === 0, bare.slice(0, 5).join(" · "));
}

// --- 4: must-not-miss — every site answers "what can't I afford to be wrong about here?" ---
{
  const noRed = KEYS.filter(k => !CAUSES[k].some(c => c.red));
  ok(`every site names >= 1 red-flag cause (${noRed.length} without)`, noRed.length === 0, noRed.join(", "));
}

// --- 5: the anti-generic guard — no two sites share an identical differential ---
// A family builder (sbSpine / nvSpine / rtSpine) that fails to specialise — because a compartment, nerve
// or root was given no distinguishing deficit — produces identical lists across its family. This catches it.
{
  const seen = new Map(); const dupes = [];
  for (const k of KEYS) {
    const sig = CAUSES[k].map(c => c.name).join("|");
    if (seen.has(sig)) dupes.push(`${seen.get(sig)} == ${k}`); else seen.set(sig, k);
  }
  ok(`no two site keys produce an identical cause-name list (${dupes.length} dupes)`, dupes.length === 0, dupes.slice(0, 5).join(" · "));
}

// --- 6: pathognomonic hygiene ---
// `pathognomonic` is the bedside "Confirm on exam" flag. It must stay a genuine BEDSIDE sign — imaging and
// laboratory findings belong in `feature` or in the workup layer. (Caught in Region B, where the Fabry
// entry had the pulvinar MRI sign in this slot.)
{
  const IMAGING = /\b(MRI|CT scan|on CT|DWI|FLAIR|T1|T2|GRE|SWI|angiograph|ultrasound|x-ray|EEG|biopsy|serology|PCR|titre|ESR|CRP|antibod)\b/i;
  const bad = [];
  for (const k of KEYS)
    for (const c of CAUSES[k])
      if (c.pathognomonic && IMAGING.test(c.pathognomonic)) bad.push(`${k}: ${c.name}`);
  ok(`no pathognomonic flag names an investigation (${bad.length})`, bad.length === 0, bad.slice(0, 5).join(" · "));
}

// --- 7: builder-interpolation hygiene ---
// The family builders (sbSpine / nvSpine / rtSpine) prefix their own words to an interpolated deficit
// phrase, so a deficit that repeats the template's leading word produces "Progressive progressive
// unilateral hearing loss…". Found live in the app at skull_base_cpa; this stops it recurring.
{
  const doubled = [];
  for (const k of KEYS)
    for (const c of CAUSES[k]) {
      const hit = (c.feature || "").match(/\b(\w+)\s+\1\b/i);
      if (hit) doubled.push(`${k}: ${c.name} ("${hit[0]}")`);
    }
  ok(`no feature repeats a word at a builder join (${doubled.length})`, doubled.length === 0, doubled.slice(0, 5).join(" · "));
}

// --- 8: category taxonomy (2026-08-11 owner decision) ---
// Two frictions were flagged repeatedly during the sweep and fixed here:
//  * iatrogenic late effects (radiation plexopathy, injury at surgery, post-DBS) were filed `traumatic`,
//    because there was no bucket for "a treatment caused this". They now have one.
//  * hereditary conditions (CMT, HNPP, Fabry, HSP, SCAs, Huntington's) sat in `degenerative` under the
//    label "Degenerative / hereditary", next to the sporadic neurodegenerations. They move to the
//    congenital bucket, relabelled "Congenital / hereditary".
// SCOPE of `iatrogenic` (owner's choice): procedures and radiation ONLY. A drug acting systemically stays
// `metabolic` ("Metabolic / toxic / nutritional") — the line is "an intervention caused structural injury"
// versus "a substance acting on the body".
{
  const byId = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
  ok("an `iatrogenic` category exists", !!byId.iatrogenic);
  ok("iatrogenic has a label and its own tint", !!(byId.iatrogenic?.label && byId.iatrogenic?.tint));
  ok("iatrogenic sits before `mimic` (mimic is always last)",
     CATEGORIES.findIndex(c => c.id === "iatrogenic") < CATEGORIES.findIndex(c => c.id === "mimic"));
  ok("the congenital label now names hereditary", /hereditar/i.test(byId.congenital?.label || ""));
  ok("the degenerative label no longer claims hereditary", !/hereditar/i.test(byId.degenerative?.label || ""));
}
{
  // nothing treatment-caused may still be sitting in `traumatic`
  const PROCEDURAL = /radiation|radiotherap|irradiation|iatrogenic|post-surgical|post-DBS|callosotomy|lobectomy|endarterectomy|perioperative|aberrant regeneration|after tumour resection|posterior fossa surgery|Epley|repositioning of another canal/i;
  const stragglers = [];
  for (const k of KEYS)
    for (const c of CAUSES[k])
      if (c.cat === "traumatic" && PROCEDURAL.test(c.name)) stragglers.push(`${k}: ${c.name}`);
  ok(`no treatment-caused entry is still filed traumatic (${stragglers.length})`, stragglers.length === 0, stragglers.slice(0, 6).join(" · "));
}
{
  // nothing heritable may still be sitting in `degenerative`
  const HERITABLE = /hereditar|Charcot-Marie-Tooth|Friedreich|Huntington|Fabry|CADASIL|spinocerebellar ataxia \(|Episodic ataxia|spastic paraplegia|Spinal muscular atrophy|Kennedy|Muscular dystrophy|Pantothenate|genetic dystonia|Sickle cell/i;
  const stragglers = [];
  for (const k of KEYS)
    for (const c of CAUSES[k])
      if (c.cat === "degenerative" && HERITABLE.test(c.name)) stragglers.push(`${k}: ${c.name}`);
  ok(`no heritable entry is still filed degenerative (${stragglers.length})`, stragglers.length === 0, stragglers.slice(0, 6).join(" · "));
}
{
  // and the sporadic neurodegenerations must NOT have been swept along with them
  const stillDegenerative = ["Parkinson's disease", "Progressive supranuclear palsy",
    "Frontotemporal dementia", "Motor neurone disease / ALS", "Corticobasal degeneration"];
  const misplaced = [];
  for (const k of KEYS)
    for (const c of CAUSES[k])
      if (stillDegenerative.includes(c.name) && c.cat !== "degenerative") misplaced.push(`${k}: ${c.name} → ${c.cat}`);
  ok(`sporadic neurodegenerations stay degenerative (${misplaced.length} moved)`, misplaced.length === 0, misplaced.join(" · "));
}
{
  // every category that any cause uses must be declared
  const declared = new Set(CATEGORIES.map(c => c.id));
  const undeclared = new Set();
  for (const k of KEYS) for (const c of CAUSES[k]) if (!declared.has(c.cat)) undeclared.add(`${c.cat} (${k})`);
  ok(`every cause category is declared in CATEGORIES (${undeclared.size})`, undeclared.size === 0, [...undeclared].join(", "));
}

// --- 9: the sweep is complete ---
{
  ok(`all ${KEYS.length} curated keys clear the depth bar`, KEYS.length >= 201);
  const total = KEYS.reduce((n, k) => n + CAUSES[k].length, 0);
  ok(`cause entries >= 1213 (900 before the sweep; got ${total})`, total >= 1213);
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
