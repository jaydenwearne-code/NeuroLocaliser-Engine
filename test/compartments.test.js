// compartments.test.js — the level -> compartment axis.
//
// regionOf() in causes.js lumps brain and cord together as `parenchyma`, but brain-plus-cord is exactly
// the dissemination MS must demonstrate. This is the finer axis the multifocal roster predicates over.
// It is also the single source of truth for "inside the skull" (INTRACRANIAL_LEVELS derives from it).
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §1
// Run: node test/compartments.test.js
import { COMPARTMENTS, LEVEL_COMPARTMENT, compartmentOf, INTRACRANIAL_COMPARTMENTS } from "../src/model/compartments.js";
import { candidateSites, INTRACRANIAL_LEVELS } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

const SITES = candidateSites();

// --- 1: total coverage — nothing may fall through ---
{
  const unmapped = [...new Set(SITES.map(s => s.level))].filter(l => !LEVEL_COMPARTMENT[l]);
  ok(`every site level maps to a compartment (${unmapped.length} unmapped)`, unmapped.length === 0, unmapped.join(", "));
}
{
  const bad = [...new Set(Object.values(LEVEL_COMPARTMENT))].filter(cmp => !COMPARTMENTS.includes(cmp));
  ok(`every mapped compartment is declared in COMPARTMENTS (${bad.length} undeclared)`, bad.length === 0, bad.join(", "));
}

// --- 2: the distinctions the roster depends on ---
{
  const cordSite = SITES.find(s => s.level === "cord");
  const cortexSite = SITES.find(s => s.level === "cortex");
  ok("brain and cord are DIFFERENT compartments (MS dissemination depends on it)",
     compartmentOf(cortexSite) !== compartmentOf(cordSite));
  ok("cortex is the `brain` compartment", compartmentOf(cortexSite) === "brain");
  ok("cord is the `cord` compartment", compartmentOf(cordSite) === "cord");
  const nerveSite = SITES.find(s => s.level === "nerve");
  ok("a named nerve is the `nerve` compartment", compartmentOf(nerveSite) === "nerve");
}

// --- 3: INTRACRANIAL_LEVELS is now DERIVED, and did not change ---
// This is the regression guard on the refactor: the raised-pressure axis must behave identically.
{
  // "brainstem" itself is dropped from this list — no site ever uses that level (see
  // src/model/compartments.js). brainstem_aras and pupil are ADDED: they were never in the old
  // hand-written INTRACRANIAL_LEVELS, but they belong there and the derivation now correctly includes them.
  const EXPECTED = ["midbrain", "pons", "medulla", "pontomesencephalic", "dorsal_midbrain",
    "parinaud", "locked_in", "pseudobulbar", "guillain_mollaret", "central_vestibular", "cortex",
    "subcortex", "cerebrum", "corpus_callosum", "aphasia_subcortical", "thalamus", "thalamus_arousal",
    "hypothalamus", "basal_ganglia", "cerebellum", "visual_pathway", "olfactory", "craniocervical_junction",
    "brainstem_aras", "pupil"];
  const missing = EXPECTED.filter(l => !INTRACRANIAL_LEVELS.has(l));
  ok(`derived INTRACRANIAL_LEVELS still contains all 25 real levels (${missing.length} missing)`,
     missing.length === 0, missing.join(", "));
  ok("cord is NOT intracranial", !INTRACRANIAL_LEVELS.has("cord"));
  ok("nerve is NOT intracranial", !INTRACRANIAL_LEVELS.has("nerve"));
  // Both directions matter: subset check catches dropped levels, exact-set check catches silently added ones.
  // This set decides which sites survive papilloedema/raised-ICP filtering, so mutations go undetected at peril.
  const extra = [...INTRACRANIAL_LEVELS].filter(l => !EXPECTED.includes(l));
  ok(`derived INTRACRANIAL_LEVELS contains NOTHING beyond the expected ${EXPECTED.length} (${extra.length} extra)`,
     extra.length === 0 && INTRACRANIAL_LEVELS.size === EXPECTED.length, extra.join(", "));
  // The old hand-written INTRACRANIAL_LEVELS list omitted brainstem_aras, so a papilloedema/raised-ICP
  // finding wrongly filtered the ARAS/consciousness site out of the candidate list under raised pressure.
  ok("brainstem_aras IS intracranial (the ARAS/consciousness site under raised pressure)",
     INTRACRANIAL_LEVELS.has("brainstem_aras"));
  // pupil IS intracranial: this keeps the CN III compressive sites (the blown pupil of uncal herniation)
  // as candidates when raised pressure is entered.
  ok("pupil IS intracranial (keeps CN III compressive/uncal-herniation sites as candidates)",
     INTRACRANIAL_LEVELS.has("pupil"));
  ok("INTRACRANIAL_COMPARTMENTS is a Set of declared compartments",
     [...INTRACRANIAL_COMPARTMENTS].every(cmp => COMPARTMENTS.includes(cmp)));
}

// --- 4: `pupil` and `sympathetic` are EACH THEIR OWN compartment (final fix wave, 2026-08-14) ---
// Folding `pupil` into `optic` and `sympathetic` into `skull_base` was a real bug, reviewer-verified:
//   - `pupil` inside `optic` made an efferent pupillary lesion (e.g. left_pupil_cn3_compressive, a
//     posterior-communicating-artery aneurysm) satisfy NMOSD's afferent-visual-pathway clause
//     `{compartment:"optic"}` — a blown pupil + a cord lesion returned NMOSD as the top concordant entity.
//   - `sympathetic` inside `skull_base` made an apical lung (Pancoast) lesion satisfy Neurosarcoidosis's
//     and NF2's skull-base cranial-neuropathy clause — an apical lung tumour + a cord lesion returned
//     both, putting a Pancoast tumour in the skull base.
// Do not re-merge either compartment back into `optic`/`skull_base` — that reintroduces both false matches
// (see test/multifocal.test.js for the emergence-level regression guards).
{
  const pupilSite = SITES.find(s => s.level === "pupil");
  const sympatheticSite = SITES.find(s => s.level === "sympathetic");
  const opticSite = SITES.find(s => s.level === "visual_pathway");
  const skullBaseSite = SITES.find(s => s.level === "skull_base");
  ok("fixture sites exist for pupil/sympathetic/optic/skull_base", !!pupilSite && !!sympatheticSite && !!opticSite && !!skullBaseSite);
  ok("`pupil` is declared as its own compartment", COMPARTMENTS.includes("pupil"));
  ok("`sympathetic` is declared as its own compartment", COMPARTMENTS.includes("sympathetic"));
  ok("a pupil site's compartment is `pupil`", compartmentOf(pupilSite) === "pupil");
  ok("a sympathetic site's compartment is `sympathetic`", compartmentOf(sympatheticSite) === "sympathetic");
  ok("pupil is NOT grouped with optic", compartmentOf(pupilSite) !== compartmentOf(opticSite));
  ok("sympathetic is NOT grouped with skull_base", compartmentOf(sympatheticSite) !== compartmentOf(skullBaseSite));
  ok("pupil remains intracranial (its own compartment, added to INTRACRANIAL_COMPARTMENTS)",
     INTRACRANIAL_COMPARTMENTS.has("pupil"));
  ok("sympathetic is NOT intracranial (unchanged from its old skull_base mapping)",
     !INTRACRANIAL_COMPARTMENTS.has("sympathetic"));
}

// --- 5: RULING 1 (owner, 2026-08-14) — optic-nerve sites are misfiled at level `skull_base` ---
// Six sites (left/right x optic_neuritis/optic_aion/optic_canal) sit at level `skull_base` because that
// is their bony corridor, but functionally they ARE the optic nerve. Left unfixed, "optic neuritis + a
// cord lesion" satisfies Neurosarcoidosis's/NF2's skull-base cranial-neuropathy clause and NEVER NMOSD's
// `optic` + `cord` clause — the archetypal NMOSD presentation cannot name NMOSD. A per-(level,part)
// override must resolve these three PARTS to the `optic` compartment while leaving every other
// skull_base site (and the LEVEL table itself) untouched. See test/multifocal.test.js for the
// emergence-level regression guard (optic neuritis + cord -> NMOSD, not Neurosarcoidosis/NF2).
{
  const opticNeuritis = SITES.find(s => s.level === "skull_base" && s.part === "optic_neuritis");
  const opticAion = SITES.find(s => s.level === "skull_base" && s.part === "optic_aion");
  const opticCanal = SITES.find(s => s.level === "skull_base" && s.part === "optic_canal");
  ok("fixture sites exist (optic_neuritis/optic_aion/optic_canal at level skull_base)",
     !!opticNeuritis && !!opticAion && !!opticCanal);
  ok("optic_neuritis resolves to the `optic` compartment despite its skull_base LEVEL",
     compartmentOf(opticNeuritis) === "optic");
  ok("optic_aion resolves to the `optic` compartment despite its skull_base LEVEL",
     compartmentOf(opticAion) === "optic");
  ok("optic_canal resolves to the `optic` compartment despite its skull_base LEVEL",
     compartmentOf(opticCanal) === "optic");
  // A site's LEVEL is unaffected — it is still bony/anatomical (skull_base), only the functional
  // COMPARTMENT differs. The two axes can legitimately disagree.
  ok("the site's LEVEL itself is still `skull_base` (only the COMPARTMENT is overridden)",
     opticNeuritis.level === "skull_base");
  // A genuine skull_base site with no override must still resolve to `skull_base` — the override is
  // per-(level,part), not a blanket reclassification of the whole level.
  const genuineSkullBase = SITES.find(s => s.level === "skull_base" && !["optic_neuritis", "optic_aion", "optic_canal"].includes(s.part));
  ok("fixture: a genuine (non-optic) skull_base site exists", !!genuineSkullBase);
  ok("a genuine skull_base site is UNCHANGED — still the `skull_base` compartment",
     compartmentOf(genuineSkullBase) === "skull_base");
}

// --- 6: RULING 1 — the override must NOT change the raised-pressure (INTRACRANIAL_LEVELS) axis ---
// INTRACRANIAL_LEVELS derives from LEVEL_COMPARTMENT (by LEVEL, not compartmentOf()), so overriding the
// COMPARTMENT of three PARTS must be invisible to it. This is the critical regression guard: the derived
// set must contain exactly the same 25 levels as before the override existed.
{
  const EXPECTED = ["midbrain", "pons", "medulla", "pontomesencephalic", "dorsal_midbrain",
    "parinaud", "locked_in", "pseudobulbar", "guillain_mollaret", "central_vestibular", "cortex",
    "subcortex", "cerebrum", "corpus_callosum", "aphasia_subcortical", "thalamus", "thalamus_arousal",
    "hypothalamus", "basal_ganglia", "cerebellum", "visual_pathway", "olfactory", "craniocervical_junction",
    "brainstem_aras", "pupil"];
  const missing = EXPECTED.filter(l => !INTRACRANIAL_LEVELS.has(l));
  const extra = [...INTRACRANIAL_LEVELS].filter(l => !EXPECTED.includes(l));
  ok(`INTRACRANIAL_LEVELS is STILL exactly the same 25 levels after the Ruling-1 override (${missing.length} missing, ${extra.length} extra)`,
     missing.length === 0 && extra.length === 0 && INTRACRANIAL_LEVELS.size === EXPECTED.length,
     `missing: ${missing.join(", ")}; extra: ${extra.join(", ")}`);
  // `skull_base` is NOT an intracranial compartment (unchanged) — the override reassigns three PARTS to
  // `optic`, but the LEVEL table entry for `skull_base` itself (used by INTRACRANIAL_LEVELS) is untouched.
  ok("`skull_base` level is still NOT intracranial", !INTRACRANIAL_LEVELS.has("skull_base"));
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
