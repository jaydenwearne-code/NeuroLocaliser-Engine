// localising-audit.test.js — nothing may fall through the LOCALISING net silently.
//
// LOCALISING (score.js) gates everything downstream: the cover in minimalSet(), coversAllLocalising(),
// and what nearFit() refuses to relax. A finding missing from it can never force a second lesion.
// It was hand-curated, and the fundoscopy findings added in the 2026-08-11 increment appear to have been
// missed — so this suite makes the omission impossible to repeat.
//
// A PURE COUNT RULE WOULD BE WRONG IN BOTH DIRECTIONS: limb_ataxia spans 7 levels / 24 sites and is
// correctly localising (it pins a SYSTEM, not a level), while lmn_weakness sits at 2 levels and is
// deliberately NOT localising. So the rule is: every SINGLE-LEVEL finding must be either localising or
// explicitly excused WITH A REASON.
//
// Spec: docs/superpowers/specs/2026-08-14-multi-location-ddx-design.md §9
// Run: node test/localising-audit.test.js
import { LOCALISING, NOT_LOCALISING_BY_DESIGN } from "../src/engine/score.js";
import { candidateSites } from "../src/engine/inverse.js";
import { expectedFindings } from "../src/engine/forward.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond, detail = "") { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; }

// Build finding -> distinct levels, from the FORWARD MODEL (never from hand-typed tokens).
const levelsOf = {};
for (const site of candidateSites()) {
  let exp; try { exp = expectedFindings(site); } catch { continue; }
  for (const tok of exp) {
    const id = tok.split("@")[0];
    (levelsOf[id] ||= new Set()).add(site.level);
  }
}

const singleLevel = Object.keys(levelsOf).filter(id => levelsOf[id].size === 1);

// --- 1: THE INVARIANT ---
{
  const orphans = singleLevel.filter(id => !LOCALISING.has(id) && !NOT_LOCALISING_BY_DESIGN[id]);
  ok(`every single-level finding is localising or explicitly excused (${orphans.length} orphans)`,
     orphans.length === 0, orphans.join(", "));
}

// --- 2: every excusal carries a REASON, and is not also localising ---
{
  const noReason = Object.keys(NOT_LOCALISING_BY_DESIGN).filter(id => !String(NOT_LOCALISING_BY_DESIGN[id]).trim());
  ok(`every deliberate exclusion states a reason (${noReason.length} blank)`, noReason.length === 0, noReason.join(", "));
  const both = Object.keys(NOT_LOCALISING_BY_DESIGN).filter(id => LOCALISING.has(id));
  ok(`no finding is both localising and excused (${both.length})`, both.length === 0, both.join(", "));
}

// --- 3: the two documented exclusions survive (they are clinical judgements, not oversights) ---
{
  ok("lmn_weakness stays NON-localising (a general LMN sign, demoted in the PNS increment)",
     !LOCALISING.has("lmn_weakness") && !!NOT_LOCALISING_BY_DESIGN.lmn_weakness);
  ok("naming_impaired stays NON-localising (present in every aphasia)",
     !LOCALISING.has("naming_impaired") && !!NOT_LOCALISING_BY_DESIGN.naming_impaired);
}

// --- 4: the fundoscopy findings are now localising (the gap that motivated this audit) ---
{
  ok("retinal_pallor is localising", LOCALISING.has("retinal_pallor"));
  ok("optic_atrophy is localising", LOCALISING.has("optic_atrophy"));
  ok("fasciculations is excused, not localising (owner ruling 2026-08-14 — occurs at any LMN level)",
     !LOCALISING.has("fasciculations") && !!NOT_LOCALISING_BY_DESIGN.fasciculations);
}

// --- 5: multi-level SYSTEM signs are untouched — proof the rule was not applied as a count threshold ---
{
  ok("limb_ataxia is still localising despite spanning many levels", LOCALISING.has("limb_ataxia"));
  ok("limb_ataxia really does span >1 level", levelsOf.limb_ataxia.size > 1);
  ok("forehead_spared is still localising despite spanning many levels", LOCALISING.has("forehead_spared"));
}

for (const l of log) console.log(`${l.ok ? "PASS" : "FAIL"}  ${l.label}${l.detail && !l.ok ? `  [${l.detail}]` : ""}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
