// multifocal.test.js — the cross-site (multi-location) layer.
//
// CAUSES is keyed per site, so it cannot express MND: motor neurone disease is not a cause AT the anterior
// horn, it is a process spanning the anterior horn and the corticospinal tract. This layer names the
// processes that hit several places, using predicates over ANATOMICAL ATTRIBUTES — never over site ids,
// which would be combinatorial across 201 sites and stale the moment a site is added.
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md
// Run: node test/multifocal.test.js
import { MULTIFOCAL, FINDING_CLASSES } from "../src/data/multifocal.js";
import { CATEGORIES, CAUSES, TEMPO, LIKELIHOOD } from "../src/data/causes.js";
import { COURSE_IDS } from "../src/model/course.js";
import { unifyingDiagnoses, assignClauses, forcingFindings } from "../src/engine/multifocal.js";
import { candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { compartmentOf } from "../src/model/compartments.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

const CAT_IDS = new Set(CATEGORIES.map(c => c.id));
const TEMPO_IDS = new Set(TEMPO.map(t => t.id));

// --- 1: shape ---
{
  ok(`the roster has >= 13 entities (got ${MULTIFOCAL.length})`, MULTIFOCAL.length >= 13);
  const noClause = MULTIFOCAL.filter(e => !e.spread && !(e.sites && e.sites.length) && !e.motor);
  ok(`every entity has at least one HARD clause (${noClause.length} without)`, noClause.length === 0,
     noClause.map(e => e.name).join(", "));
  const badCat = MULTIFOCAL.filter(e => !CAT_IDS.has(e.cat));
  ok(`every category is declared in CATEGORIES (${badCat.length} undeclared)`, badCat.length === 0,
     badCat.map(e => `${e.name}:${e.cat}`).join(", "));
  const badCourse = MULTIFOCAL.filter(e => !Array.isArray(e.course) || !e.course.length || e.course.some(c => !COURSE_IDS.has(c)));
  ok(`every entity declares valid course values (${badCourse.length} bad)`, badCourse.length === 0,
     badCourse.map(e => e.name).join(", "));
  const badTempo = MULTIFOCAL.filter(e => !Array.isArray(e.tempo) || !e.tempo.length || e.tempo.some(t => !TEMPO_IDS.has(t)));
  ok(`every entity declares valid tempo values (${badTempo.length} bad)`, badTempo.length === 0,
     badTempo.map(e => e.name).join(", "));
  const badLik = MULTIFOCAL.filter(e => !LIKELIHOOD.includes(e.likelihood));
  ok(`every likelihood is a declared tier (${badLik.length} bad)`, badLik.length === 0,
     badLik.map(e => `${e.name}:${e.likelihood}`).join(", "));
  const noFeature = MULTIFOCAL.filter(e => !e.feature || !e.feature.trim());
  ok(`every entity has a discriminating feature (${noFeature.length} without)`, noFeature.length === 0,
     noFeature.map(e => e.name).join(", "));
}

// --- 2: THE ANTI-OVER-CALL GUARD ---
// A cross-site entity that a single site could satisfy is not a cross-site entity.
{
  const singleSatisfiable = MULTIFOCAL.filter(e => {
    const minSpread = e.spread ? (e.spread.minSites || 2) : 0;
    const nSites = e.sites ? e.sites.length : 0;
    return Math.max(minSpread, nSites) < 2 && e.motor !== "mixed";
  });
  ok(`no entity can be satisfied by a single site (${singleSatisfiable.length})`, singleSatisfiable.length === 0,
     singleSatisfiable.map(e => e.name).join(", "));
}

// --- 3: forbids names a declared finding CLASS, never a bare finding id ---
{
  const bad = MULTIFOCAL.filter(e => e.forbids && e.forbids.some(f => !FINDING_CLASSES[f]));
  ok(`every \`forbids\` names a declared finding class (${bad.length} bad)`, bad.length === 0,
     bad.map(e => e.name).join(", "));
  ok("FINDING_CLASSES declares a `sensory` class", Array.isArray(FINDING_CLASSES.sensory) && FINDING_CLASSES.sensory.length > 0);
}

// --- 4: a `matches` regex that has stopped matching is DEAD — it can never surface via the merge ---
{
  const names = [...new Set(Object.values(CAUSES).flat().map(c => c.name))];
  const dead = MULTIFOCAL.filter(e => e.matches && names.filter(n => e.matches.test(n)).length < 1);
  ok(`every \`matches\` regex still matches at least one curated cause (${dead.length} dead)`,
     dead.length === 0, dead.map(e => e.name).join(", "));
}

// --- 5: EMERGENCE — build every probe from expectedFindings() of a REAL site, never hand-typed tokens ---
const siteById = id => candidateSites().find(s => s.id === id);
const tokensFor = (...ids) => new Set(ids.flatMap(id => [...expectedFindings(siteById(id))]));

{
  // MND: a UMN site and an LMN site, with UMN + LMN signs and NO sensory involvement.
  const umnSite = siteById("left_cortex_motor_facearm");
  const lmnSite = siteById("motor_unit_anterior_horn");
  const sites = [umnSite, lmnSite];
  const toks = new Set([...expectedFindings(umnSite), ...expectedFindings(lmnSite), "babinski@left", "fasciculations@left"]);
  const r = unifyingDiagnoses(sites, toks, { course: "progressive", onset: "chronic" });
  const names = [...r.concordant, ...r.discordant].map(e => e.name);
  ok("MND emerges on a mixed UMN + LMN picture", names.some(n => /motor neurone/i.test(n)));

  // ...and DISAPPEARS once sensory involvement is present. This is the whole diagnosis.
  const withSensory = new Set([...toks, "spinothalamic@right"]);
  const r2 = unifyingDiagnoses(sites, withSensory, { course: "progressive", onset: "chronic" });
  const names2 = [...r2.concordant, ...r2.discordant].map(e => e.name);
  ok("MND does NOT fire once a sensory finding is present", !names2.some(n => /motor neurone/i.test(n)));
}

{
  // MS: optic + cord = two distinct compartments.
  // Substitution: the brief's `left_visual_pathway_optic_neuritis` / `left_visual_pathway_optic_nerve` do
  // not exist as candidate site ids (verified via candidateSites()). The real optic-compartment sites are
  // the visual_pathway level parts (optic_tract / lgn / retina / chiasm); `left_visual_pathway_optic_tract`
  // is used here as the closest real site satisfying the test's anatomical intent — a lesion in the optic
  // compartment, distinct from the cord compartment. The MS entity's clause is a generic
  // `spread:{distinctCompartments:2}`, not an optic-specific clause, so any two distinct compartments
  // satisfy it; this substitution preserves that intent exactly.
  const sites = [siteById("left_visual_pathway_optic_tract"),
                 siteById("left_cord_hemi")].filter(Boolean);
  const toks = tokensFor(...sites.map(s => s.id));
  const r = unifyingDiagnoses(sites, toks, { course: "relapsing", onset: "subacute" });
  ok("MS emerges on optic + cord (two compartments)",
     r.concordant.some(e => /multiple sclerosis/i.test(e.name)));
  const ms = r.concordant.find(e => /multiple sclerosis/i.test(e.name));
  // MS's only clause is `spread` (satisfied by the SET, not any one site) — `satisfiedBy` is null by
  // design (FINDING 2); the derivation is carried in the clause's descriptive text instead.
  ok("MS carries its derivation (`why` names the satisfying spread)",
     ms && Array.isArray(ms.why) && ms.why.length > 0 &&
     ms.why.every(w => w.satisfiedBy === null) &&
     ms.why.some(w => w.clause && typeof w.clause.spread === "string"));
}

// --- 6: SOFT AXES DEMOTE, THEY DO NOT DROP (the owner's ruling — the assertion that guards it) ---
{
  const sites = [siteById("left_cortex_motor_facearm"), siteById("motor_unit_anterior_horn")];
  const toks = new Set([...expectedFindings(sites[0]), ...expectedFindings(sites[1]), "babinski@left", "fasciculations@left"]);
  const fits = unifyingDiagnoses(sites, toks, { course: "progressive" });
  const clashes = unifyingDiagnoses(sites, toks, { course: "relapsing" });
  const nFits = fits.concordant.length + fits.discordant.length;
  const nClash = clashes.concordant.length + clashes.discordant.length;
  ok("a course mismatch changes the BAND, not the total count", nFits === nClash, `${nFits} vs ${nClash}`);
  const mnd = clashes.discordant.find(e => /motor neurone/i.test(e.name));
  ok("MND is demoted (not deleted) by a relapsing course", !!mnd);
  ok("the demotion names the axis and what was entered",
     mnd && mnd.demotions.some(d => d.axis === "course" && d.entered === "relapsing"));
  ok("nothing in the concordant band carries a demotion",
     clashes.concordant.every(e => e.demotions.length === 0));
}

// --- 7: hard constraints DO filter ---
{
  const one = [siteById("left_cortex_motor_facearm")];
  const toks = tokensFor("left_cortex_motor_facearm");
  const r = unifyingDiagnoses(one, toks, {});
  ok("a single site yields NO cross-site entities", r.concordant.length === 0 && r.discordant.length === 0);
}

// --- 8: ORDER-INDEPENDENCE — the regression guard for the FINDING 1 fix ---
// `assignClauses` must find a valid distinct-site assignment regardless of the order the entity lists
// its clauses in. Build a site set where ONE site satisfies a specific clause (skull_base) and the other
// only the wildcard `{}` — with the specific-satisfying site listed FIRST in the sites array, a greedy
// "first match wins" walker consumes it on the wildcard clause when the wildcard is evaluated first,
// leaving nothing for the specific clause that needed it.
{
  const skullSite = candidateSites().find(s => compartmentOf(s) === "skull_base");
  const otherSite = candidateSites().find(s => compartmentOf(s) && compartmentOf(s) !== "skull_base");
  const sites = [skullSite, otherSite];
  const specificFirst = assignClauses(sites, [{ compartment: "skull_base" }, {}]);
  const wildcardFirst = assignClauses(sites, [{}, { compartment: "skull_base" }]);
  ok("assignClauses finds an assignment with the specific clause first",
     !!specificFirst);
  ok("assignClauses finds an assignment with the wildcard clause first (order-independence)",
     !!wildcardFirst);
}

// --- 9: NMOSD emerges on optic + cord ---
{
  const sites = [siteById("left_visual_pathway_optic_tract"), siteById("left_cord_hemi")].filter(Boolean);
  const toks = tokensFor(...sites.map(s => s.id));
  const r = unifyingDiagnoses(sites, toks, { course: "relapsing", onset: "acute" });
  const names = [...r.concordant, ...r.discordant].map(e => e.name);
  ok("NMOSD emerges on optic + cord", names.some(n => /NMOSD|neuromyelitis/i.test(n)));
}

// --- 10: Mononeuritis multiplex emerges on two named-nerve sites ---
{
  const sites = [siteById("left_nerve_radial_axilla"), siteById("left_nerve_median_proximal")].filter(Boolean);
  const toks = tokensFor(...sites.map(s => s.id));
  const r = unifyingDiagnoses(sites, toks, { course: "stepwise", onset: "acute" });
  const names = [...r.concordant, ...r.discordant].map(e => e.name);
  ok("Mononeuritis multiplex emerges on two named-nerve sites", names.some(n => /mononeuritis multiplex/i.test(n)));
}

// --- 11: THE FORCING-FINDING GUARD, as a PROPERTY TEST ---
// The card claims "remove this finding and one lesion explains everything". The test IS that claim: for
// every finding named, removing it must actually collapse the picture. Claim and test are one statement.
{
  const wallenberg = siteById("left_medulla_lateral");
  const l5 = siteById("right_root_l5");
  const toks = new Set([...expectedFindings(wallenberg), ...expectedFindings(l5)]);
  const f = forcingFindings(toks, {});
  ok("a genuinely multifocal case names at least one forcing finding", f.findings.length > 0);

  const { solve } = await import("../src/engine/inverse.js");
  const allCollapse = f.findings.every(({ token }) => {
    const without = new Set([...toks].filter(t => t !== token));
    return solve(without).singleExplainsAll === true;
  });
  ok("EVERY named forcing finding provably collapses the picture when removed", allCollapse);
}
{
  // A single-lesion case has nothing forcing a second site.
  const toks = new Set(expectedFindings(siteById("left_medulla_lateral")));
  ok("a single-lesion case names no forcing findings", forcingFindings(toks, {}).findings.length === 0);
}

// --- 13: PER-FINDING collapsesTo — the regression guard for the shared-field bug ---
// Two mirrored labyrinth lesions (left + right) each contribute their own forcing finding
// (cn8_vertigo@left / cn8_vertigo@right). Removing the LEFT one collapses to the RIGHT labyrinth, and
// removing the RIGHT one collapses to the LEFT labyrinth — two DIFFERENT sites. A single shared
// `collapsesTo` field can only ever name one of them; the per-entry shape must name each correctly.
{
  const { solve } = await import("../src/engine/inverse.js");
  const left = siteById("left_peripheral_vestibular_labyrinth");
  const right = siteById("right_peripheral_vestibular_labyrinth");
  const toks = new Set([...expectedFindings(left), ...expectedFindings(right)]);
  const f = forcingFindings(toks, {});
  ok("both mirrored labyrinth lesions produce two forcing findings", f.findings.length === 2,
     JSON.stringify(f.findings));

  const distinctTargets = new Set(f.findings.map(e => e.collapsesTo && e.collapsesTo.id));
  ok("the two forcing findings collapse to two DIFFERENT sites", distinctTargets.size === 2,
     [...distinctTargets].join(", "));

  // Verify EACH entry's collapsesTo against an independent re-run of solve() on the reduced set —
  // this is the assertion that fails against the old shared single-field shape.
  const eachEntryCorrect = f.findings.every(({ token, collapsesTo }) => {
    const without = new Set([...toks].filter(t => t !== token));
    const r = solve(without);
    return r.singleExplainsAll && collapsesTo && collapsesTo.id === r.display[0].site.id;
  });
  ok("EVERY entry's collapsesTo matches an independent re-run of solve() on its own reduced set",
     eachEntryCorrect);
}

// --- 14: FIX 2/3 (final fix wave, 2026-08-14) — `pupil` and `sympathetic` must NOT be reached via
// `optic`/`skull_base` any more. Reviewer-verified false matches: left_pupil_cn3_compressive (a
// posterior-communicating-artery aneurysm) + a cord site used to return NMOSD (its clause is
// `{compartment:"optic"}`, and `pupil` used to BE `optic`); left_sympathetic_pancoast (an apical lung
// tumour) + a cord site used to return Neurosarcoidosis and NF2 (their clause is `{compartment:"skull_base"}`,
// and `sympathetic` used to BE `skull_base`). Both are anatomically wrong: an efferent pupillary lesion is
// not the afferent visual pathway, and an apical lung lesion is not a skull-base lesion. Every probe here
// is built from expectedFindings() of a real site, never hand-typed tokens. ---
{
  const pupilSite = siteById("left_pupil_cn3_compressive");
  const cordSite = siteById("left_cord_hemi");
  ok("fixture sites exist (pupil + cord)", !!pupilSite && !!cordSite);
  const toks = tokensFor(pupilSite.id, cordSite.id);
  const r = unifyingDiagnoses([pupilSite, cordSite], toks, {});
  const names = [...r.concordant, ...r.discordant].map(e => e.name);
  ok("a pupil site + a cord site does NOT return NMOSD",
     !names.some(n => /NMOSD|neuromyelitis/i.test(n)), names.join(", "));
}
{
  const pancoastSite = siteById("left_sympathetic_pancoast");
  const cordSite = siteById("left_cord_hemi");
  ok("fixture sites exist (sympathetic/Pancoast + cord)", !!pancoastSite && !!cordSite);
  const toks = tokensFor(pancoastSite.id, cordSite.id);
  const r = unifyingDiagnoses([pancoastSite, cordSite], toks, {});
  const names = [...r.concordant, ...r.discordant].map(e => e.name);
  ok("a sympathetic (Pancoast) site + a cord site does NOT return Neurosarcoidosis",
     !names.some(n => /sarcoid/i.test(n)), names.join(", "));
  ok("a sympathetic (Pancoast) site + a cord site does NOT return NF2",
     !names.some(n => /neurofibromatosis|\bNF2\b/i.test(n)), names.join(", "));
}

// --- 12: MURKY-INPUT REGRESSION SET — these must NEVER produce a combined view ---
// Probes from the design session. They are the guard against a future loosening of the trigger.
{
  const { solve } = await import("../src/engine/inverse.js");
  const exp = [...expectedFindings(siteById("left_medulla_lateral"))];
  const cases = {
    "clean Wallenberg": exp,
    "crossed sensory on the WRONG side": exp.map(t => t === "spinothalamic@right" ? "spinothalamic@left" : t),
    "one spurious non-localising sign": [...exp, "babinski@right"],
    "sparse murky input": ["weak_arm@left", "distal_sensory_loss@right"],
  };
  for (const [label, toks] of Object.entries(cases)) {
    const r = solve(new Set(toks));
    ok(`murky input produces no multifocal claim: ${label}`, !r.multi);
  }
}

// --- 15: RULING 1 (owner, 2026-08-14) — optic neuritis + a cord lesion must return NMOSD, and must NOT
// return Neurosarcoidosis or NF2. Before the fix, the three optic-nerve PARTS (optic_neuritis/optic_aion/
// optic_canal) sat in the `skull_base` compartment because that is their bony corridor, so they satisfied
// Neurosarcoidosis's/NF2's skull-base cranial-neuropathy clause `{compartment:"skull_base"}` instead of
// NMOSD's `optic`+`cord` clause. This is the archetypal NMOSD presentation — it must be able to name NMOSD.
{
  const opticNeuritisSite = siteById("left_skull_base_optic_neuritis");
  const cordSite = siteById("left_cord_hemi");
  ok("fixture sites exist (skull_base optic_neuritis + cord)", !!opticNeuritisSite && !!cordSite);
  const toks = tokensFor(opticNeuritisSite.id, cordSite.id);
  const r = unifyingDiagnoses([opticNeuritisSite, cordSite], toks, {});
  const names = [...r.concordant, ...r.discordant].map(e => e.name);
  ok("optic neuritis + a cord lesion returns NMOSD", names.some(n => /NMOSD|neuromyelitis/i.test(n)), names.join(", "));
  ok("optic neuritis + a cord lesion no longer returns Neurosarcoidosis",
     !names.some(n => /sarcoid/i.test(n)), names.join(", "));
  ok("optic neuritis + a cord lesion no longer returns NF2",
     !names.some(n => /neurofibromatosis|\bNF2\b/i.test(n)), names.join(", "));
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
