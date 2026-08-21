// multifocal-archetypes.test.js — one canonical picture per cross-site entity (spec 2026-08-21).
//
// WHY THIS SUITE EXISTS, beyond guarding the examples: it is a FIRE-RATE CANARY. The 2026-08-15 substrate
// work found NF2 firing at 0.0% because `schwann` omitted `skull_base` — a bug no unit test caught, found
// only by measuring fire rates by hand. An archetype per entity turns that measurement into a standing
// assertion: if a roster predicate, a substrate table or a compartment allow-list drifts such that an
// entity can no longer fire on its OWN defining picture, this suite fails immediately.
//
// It asserts BEHAVIOUR through the app's own resolution path (solve -> combinedSites -> unifyingDiagnoses),
// not that the tokens merely parse. That is the lesson from test/examples.test.js.
import { CROSS_SITE_EXAMPLES, EXAMPLES } from "../app/examples.js";
import { MULTIFOCAL } from "../src/data/multifocal.js";
import { MULTIFOCAL_NEXT } from "../src/data/multifocalNextSteps.js";
import { solve, candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";
import { unifyingDiagnoses } from "../src/engine/multifocal.js";
import { combinedSites } from "../app/combined-sites.js";
import { FINDINGS } from "../src/model/findings.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (!c && d ? `  [${d}]` : "")); };

const SITES = candidateSites();
const byId = id => SITES.find(s => s.id === id);

// --- 1: COVERAGE — every roster entity has an archetype, and vice versa ---
// Paired with the workup gate in test/multifocal-next-steps.test.js: an entity now needs BOTH a plan and a
// picture to read it against.
{
  const haveArchetype = new Set(CROSS_SITE_EXAMPLES.map(e => e.entity));
  for (const e of MULTIFOCAL)
    ok(`\`${e.name}\` has an archetype case`, haveArchetype.has(e.name));
  const rosterNames = new Set(MULTIFOCAL.map(e => e.name));
  for (const x of CROSS_SITE_EXAMPLES)
    ok(`archetype \`${x.id}\` names a real roster entity`, rosterNames.has(x.entity), x.entity);
}

// --- 2: ids are unique and do not collide with the four worked examples ---
{
  const ids = CROSS_SITE_EXAMPLES.map(e => e.id).concat(EXAMPLES.map(e => e.id));
  ok("every example id is unique across both groups", new Set(ids).size === ids.length);
}

// --- 3: every token is a REAL finding, and is DERIVED from one of the two pinned sites ---
// The hand-typing guard. A token that no pinned site predicts means the case was invented rather than
// derived, and the picture will not resolve to the pair it claims.
{
  for (const x of CROSS_SITE_EXAMPLES) {
    const a = byId(x.pinned[0]), b = byId(x.pinned[1]);
    ok(`\`${x.id}\` pins two real sites`, !!a && !!b, x.pinned.join(" + "));
    if (!a || !b) continue;
    const derivable = new Set([...expectedFindings(a), ...expectedFindings(b)]);
    const invented = x.tokens.filter(t => !derivable.has(t));
    ok(`\`${x.id}\` invents no token`, invented.length === 0, invented.join(" | "));
    const unknown = x.tokens.filter(t => !FINDINGS[t.split("@")[0]]);
    ok(`\`${x.id}\` names only real findings`, unknown.length === 0, unknown.join(" | "));
    // Both sites must contribute, or the case is not actually multifocal by construction.
    const fromA = x.tokens.some(t => expectedFindings(a).has(t));
    const fromB = x.tokens.some(t => expectedFindings(b).has(t));
    ok(`\`${x.id}\` takes findings from BOTH sites`, fromA && fromB);
  }
}

// --- 4: THE BEHAVIOUR. Each archetype is multifocal, resolves to its pair, and fires its entity ---
{
  for (const x of CROSS_SITE_EXAMPLES) {
    const set = new Set(x.tokens);
    const r = solve(set, { dominantSide: "left" });
    ok(`\`${x.id}\` genuinely needs two lesions`, !r.singleExplainsAll);

    const cs = combinedSites(r, r.display, new Set(x.pinned));
    const resolvedToPair = cs.sites.length >= 2 && cs.sites.every(s => x.pinned.includes(s.id));
    ok(`\`${x.id}\` resolves to the pair it pins`, resolvedToPair,
       cs.sites.map(s => s.id).join(" + "));
    if (!resolvedToPair) continue;

    const u = unifyingDiagnoses(cs.sites, set, { onset: x.onset, course: x.course });
    const concordant = u.concordant.map(e => e.name);
    // CONCORDANT, not necessarily FIRST. Ranking is by likelihood then clause count, and forcing an
    // archetype to rank first would mean choosing the picture to satisfy the test rather than the clinic.
    ok(`\`${x.id}\` fires \`${x.entity}\` as CONCORDANT`, concordant.includes(x.entity),
       u.discordant.map(e => e.name).includes(x.entity) ? "present but DEMOTED" : `got [${concordant.join(" | ")}]`);
  }
}

// --- 5: every archetype has an authored workup to display ---
// The whole point of the case is to read a plan against it.
{
  for (const x of CROSS_SITE_EXAMPLES)
    ok(`\`${x.id}\` has a cross-site workup behind it`, !!MULTIFOCAL_NEXT[x.entity]);
}

// --- 6: THE COURSE IS LOAD-BEARING — metastases vs embolic shower ---
// The pair that teaches the course axis: identical anatomy, identical findings, opposite course, different
// disease. If this ever stops discriminating, the two cards are duplicates and one should be deleted.
{
  const mets = CROSS_SITE_EXAMPLES.find(e => e.id === "x-mets");
  const emb  = CROSS_SITE_EXAMPLES.find(e => e.id === "x-embolic");
  ok("the metastases and embolic archetypes are the SAME picture",
     JSON.stringify(mets.tokens) === JSON.stringify(emb.tokens) &&
     JSON.stringify(mets.pinned) === JSON.stringify(emb.pinned));
  ok("...and differ ONLY in course and onset", mets.course !== emb.course);

  const set = new Set(mets.tokens);
  const r = solve(set, { dominantSide: "left" });
  const cs = combinedSites(r, r.display, new Set(mets.pinned));
  const asMets = unifyingDiagnoses(cs.sites, set, { onset: mets.onset, course: mets.course });
  const asEmb  = unifyingDiagnoses(cs.sites, set, { onset: emb.onset,  course: emb.course  });
  // The discriminating claim: switching ONLY the course moves embolic shower across the concordant line.
  ok("embolic shower is concordant on a SIMULTANEOUS course",
     asEmb.concordant.some(e => e.name === emb.entity));
  ok("embolic shower is NOT concordant on a PROGRESSIVE course",
     !asMets.concordant.some(e => e.name === emb.entity));
  ok("metastases is concordant on a PROGRESSIVE course",
     asMets.concordant.some(e => e.name === mets.entity));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
