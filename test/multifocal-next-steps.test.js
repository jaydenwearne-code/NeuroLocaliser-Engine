// multifocal-next-steps.test.js — the CROSS-SITE workup layer (spec 2026-08-21).
//
// The Together card names the disease that spans the sites. This layer gives that disease its own workup,
// so the all-sites Next card can stop unioning per-site plans once the cross-site claim has been made.
import { MULTIFOCAL_NEXT, multifocalPlanFor } from "../src/data/multifocalNextSteps.js";
import { MULTIFOCAL } from "../src/data/multifocal.js";
import { PATHOLOGY_NEXT, pathologyPlanFor } from "../src/data/pathologyNextSteps.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (!c && d ? `  [${d}]` : "")); };

// --- 1: the module resolves ---
{
  const p = multifocalPlanFor("Multiple sclerosis");
  ok("a known entity returns a plan", !!p);
  ok("the plan carries first-line tests", Array.isArray(p.firstLine) && p.firstLine.length > 0);
  ok("the plan carries confirmatory steps", Array.isArray(p.confirmatory) && p.confirmatory.length > 0);
  ok("an unknown entity returns null", multifocalPlanFor("Not A Real Disease") === null);
}

// --- 2: no orphan plans — every key names a real roster entity ---
// A plan keyed to a misspelled entity never fires and never errors. This is the only thing that catches it.
{
  const rosterNames = new Set(MULTIFOCAL.map(e => e.name));
  for (const name of Object.keys(MULTIFOCAL_NEXT))
    ok(`plan key \`${name}\` names a real MULTIFOCAL entity`, rosterNames.has(name));
}

// --- 3: every plan is complete ---
{
  for (const name of Object.keys(MULTIFOCAL_NEXT)) {
    const p = multifocalPlanFor(name);
    ok(`\`${name}\` has first-line and confirmatory content`, p.firstLine.length > 0 && p.confirmatory.length > 0);
    ok(`\`${name}\` has monitoring content`, p.monitoring.length > 0);
    ok(`\`${name}\` has an urgency and a referral`, typeof p.urgency === "string" && typeof p.referral === "string" && p.referral.length > 0);
  }
}

// --- 4: no two entity plans are identical ---
// The family() invariant, reapplied. 13 plans that emit the same text are one bland plan wearing 13 labels.
{
  const seen = new Map();
  for (const name of Object.keys(MULTIFOCAL_NEXT)) {
    const p = multifocalPlanFor(name);
    const sig = JSON.stringify([p.firstLine, p.confirmatory, p.monitoring]);
    ok(`\`${name}\` emits a plan no other entity emits`, !seen.has(sig), `same as ${seen.get(sig)}`);
    seen.set(sig, name);
  }
}

// --- 5: the entity `red` floor ---
// An entity carrying a red flag may never render as routine, exactly as a red per-site cause may not.
{
  for (const e of MULTIFOCAL) {
    const p = multifocalPlanFor(e.name);
    if (!p || !e.red) continue;
    ok(`\`${e.name}\` (red) is not routine`, p.urgency !== "routine");
  }
}

// --- 6: cross-site plans are NOT the same as the same-named SITE plans ---
// Four entity names are also verbatim per-site cause names. Three of them have a PATHOLOGY_NEXT plan under
// that same name, and those are SITE plans — reusing one as a cross-site plan is the trap this catches.
// "Multiple sclerosis" is excluded: it has no PATHOLOGY_NEXT entry under that exact spelling (its per-site
// plan is authored as "Demyelination"), so there is nothing to differ from.
{
  const collide = ["Motor neurone disease (ALS)", "Neurosarcoidosis", "Neurofibromatosis type 2"];
  for (const name of collide) {
    if (!MULTIFOCAL_NEXT[name]) continue;                       // not yet authored — a later round covers it
    ok(`\`${name}\` has a SITE plan to differ from`, !!PATHOLOGY_NEXT[name]);
    const cross = multifocalPlanFor(name);
    const perSite = pathologyPlanFor(name, null);
    ok(`\`${name}\` cross-site confirmatory differs from its site plan`,
       JSON.stringify(cross.confirmatory) !== JSON.stringify(perSite.confirmatory));
  }
}

// --- 7: THE RATCHET. Entities with no plan may only ever DECREASE. ---
// Same shape as tranche 2's RED_WITHOUT_PLAN_CEILING: a plain "every entity has a plan" would fail on every
// authoring round, so this is a ceiling that falls with each round and retires into a hard gate at 0.
const ENTITY_WITHOUT_PLAN_CEILING = 8;
{
  const missing = MULTIFOCAL.filter(e => !MULTIFOCAL_NEXT[e.name]).map(e => e.name);
  ok(`entities without a plan (${missing.length}) is at or below the ceiling (${ENTITY_WITHOUT_PLAN_CEILING})`,
     missing.length <= ENTITY_WITHOUT_PLAN_CEILING, missing.join(" | "));
  console.log(`\nREPORT  ${MULTIFOCAL.length - missing.length} of ${MULTIFOCAL.length} entities planned; ` +
              `${missing.length} left${missing.length ? " — " + missing.join(", ") : ""}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
