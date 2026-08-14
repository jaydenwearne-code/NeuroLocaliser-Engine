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

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
