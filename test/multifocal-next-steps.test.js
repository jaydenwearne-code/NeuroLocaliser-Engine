// multifocal-next-steps.test.js — the CROSS-SITE workup layer (spec 2026-08-21).
//
// The Together card names the disease that spans the sites. This layer gives that disease its own workup,
// so the all-sites Next card can stop unioning per-site plans once the cross-site claim has been made.
import { MULTIFOCAL_NEXT, multifocalPlanFor } from "../src/data/multifocalNextSteps.js";
import { MULTIFOCAL } from "../src/data/multifocal.js";
import { PATHOLOGY_NEXT, pathologyPlanFor } from "../src/data/pathologyNextSteps.js";
import { combinedNextSteps } from "../src/data/nextSteps.js";
import { candidateSites } from "../src/engine/inverse.js";

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

// ---- the combined card (spec §3) ----
const ALL = candidateSites();
const byId = id => ALL.find(s => s.id === id);
const PAIR = [byId("left_skull_base_optic_neuritis"), byId("left_cord_lateral")];

// --- 8: no entity means byte-identical to the pre-2026-08-21 behaviour ---
// One code path, so the no-selection view cannot drift. Compared as JSON: an ADDED key would fail this,
// which is why `entity` and `entityFirstLine` are absent rather than null when nothing is selected.
{
  ok("both fixture sites resolve", PAIR.every(Boolean));
  const a = JSON.stringify(combinedNextSteps(PAIR));
  const b = JSON.stringify(combinedNextSteps(PAIR, null));
  ok("combinedNextSteps(sites) === combinedNextSteps(sites, null)", a === b);
  ok("no entity leaves no `entity` key", !("entity" in combinedNextSteps(PAIR)));
  ok("an unknown entity falls back to the plain union", JSON.stringify(combinedNextSteps(PAIR, "Not A Real Disease")) === a);
}

// --- 9: the tier split — immediate and first-line are site-level and UNCHANGED ---
{
  const plain = combinedNextSteps(PAIR);
  const withE = combinedNextSteps(PAIR, "Multiple sclerosis");
  ok("immediate is untouched by the selection",
     JSON.stringify(withE.immediate) === JSON.stringify(plain.immediate));
  ok("first-line (site) is untouched by the selection",
     JSON.stringify(withE.investigations) === JSON.stringify(plain.investigations));
  ok("the entity's own first-line arrives alongside it", withE.entityFirstLine.length > 0);
  ok("the rendered first-line is a SUPERSET of the site union",
     plain.investigations.every(i => [...withE.investigations, ...withE.entityFirstLine].includes(i)));
  ok("confirmatory becomes the entity plan",
     JSON.stringify(withE.confirmatory) === JSON.stringify(multifocalPlanFor("Multiple sclerosis").confirmatory));
  ok("monitoring becomes the entity plan",
     JSON.stringify(withE.monitoring) === JSON.stringify(multifocalPlanFor("Multiple sclerosis").monitoring));
  ok("referral becomes the entity plan's", withE.referral === multifocalPlanFor("Multiple sclerosis").referral);
  ok("the entity is reported back", withE.entity === "Multiple sclerosis");
}

// --- 10: THE URGENCY FLOOR — selecting an entity may raise urgency, never lower it ---
// Swept over real pairs rather than one fixture: the failure this guards against is a chronic-sounding
// entity silently de-escalating a picture that contains a cord site badged emergency.
{
  const RANK = { emergency: 3, urgent: 2, routine: 1 };
  const sample = [byId("left_skull_base_optic_neuritis"), byId("left_cord_lateral"),
                  byId("left_nerve_median_proximal"), byId("left_cord_hemi")].filter(Boolean);
  let violations = 0, checked = 0;
  for (let i = 0; i < sample.length; i++) for (let j = i + 1; j < sample.length; j++) {
    const pair = [sample[i], sample[j]];
    const floor = RANK[combinedNextSteps(pair).urgency];
    for (const name of Object.keys(MULTIFOCAL_NEXT)) {
      checked++;
      if (RANK[combinedNextSteps(pair, name).urgency] < floor) violations++;
    }
  }
  ok(`the site urgency is a FLOOR across ${checked} (pair, entity) combinations`, violations === 0, `${violations} de-escalations`);
}

// --- 11: an emergency entity RAISES a routine pair ---
{
  const pair = [byId("left_nerve_median_proximal"), byId("left_skull_base_optic_neuritis")].filter(Boolean);
  const withE = combinedNextSteps(pair, "NMOSD (neuromyelitis optica spectrum disorder)");
  ok("an emergency entity plan reaches the card", withE.urgency === "emergency");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
