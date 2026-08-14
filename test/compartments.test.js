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

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
