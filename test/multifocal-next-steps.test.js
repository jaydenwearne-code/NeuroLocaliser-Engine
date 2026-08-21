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

// --- 7: THE HARD GATE. Every roster entity has a plan. ---
// The ratchet retired here (13 -> 8 -> 3 -> 0 across three rounds). Its durable value starts now: a future
// entity added to MULTIFOCAL with no workup behind it fails this suite immediately. That is what keeps the
// Together card's rows behaving alike — a card where some rows select and some do not is the rejected
// mockup arriving through the back door.
{
  const missing = MULTIFOCAL.filter(e => !MULTIFOCAL_NEXT[e.name]).map(e => e.name);
  ok(`GATE: all ${MULTIFOCAL.length} cross-site entities have an authored workup`, missing.length === 0, missing.join(" | "));
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

// --- 10: URGENCY FOLLOWS THE SELECTION, in both directions ---
// Owner ruling 2026-08-21, REVERSING the site-union floor this layer was first built with: selecting the
// disease IS the claim, so the badge speaks for the disease and may sit BELOW the site's. Same ruling
// tranche 1 made per-site — "a tool that only escalates cries wolf" — and the two layers must agree.
//
// Swept over real pairs rather than one fixture, so this pins the rule and not one lucky example.
{
  const sample = [byId("left_skull_base_optic_neuritis"), byId("left_cord_lateral"),
                  byId("left_nerve_median_proximal"), byId("left_cord_hemi")].filter(Boolean);
  let mismatches = 0, checked = 0, deEscalations = 0;
  for (let i = 0; i < sample.length; i++) for (let j = i + 1; j < sample.length; j++) {
    const pair = [sample[i], sample[j]];
    const siteUrgency = combinedNextSteps(pair).urgency;
    for (const name of Object.keys(MULTIFOCAL_NEXT)) {
      checked++;
      const got = combinedNextSteps(pair, name).urgency;
      if (got !== multifocalPlanFor(name).urgency) mismatches++;
      if (got !== siteUrgency) deEscalations++;               // just to prove the sweep is not vacuous
    }
  }
  ok(`urgency is the ENTITY's across ${checked} (pair, entity) combinations`, mismatches === 0, `${mismatches} overridden`);
  ok("the sweep actually exercises a change of badge", deEscalations > 0);
}

// --- 11: an entity may sit BELOW the site badge, and may also raise it ---
// The concrete case the owner reported: MS across sites whose own vascular differential badges emergency
// is urgent, not an emergency. And the reverse still works — an emergency entity reaches a quieter pair.
{
  const emergencyPair = [byId("left_cord_lateral"), byId("left_cord_hemi")].filter(Boolean);
  const plain = combinedNextSteps(emergencyPair).urgency;
  ok("the fixture pair badges emergency on its own", plain === "emergency");
  ok("MS DE-ESCALATES it to urgent", combinedNextSteps(emergencyPair, "Multiple sclerosis").urgency === "urgent");

  const quietPair = [byId("left_nerve_median_proximal"), byId("left_skull_base_optic_neuritis")].filter(Boolean);
  ok("an emergency entity plan still reaches a quieter pair",
     combinedNextSteps(quietPair, "NMOSD (neuromyelitis optica spectrum disorder)").urgency === "emergency");
}

// --- 12b: `because` — the badge can say why it is what it is ---
// Added on the owner's ruling that metastases and leptomeningeal disease are emergencies BECAUSE OF WHAT
// THEY CAN CAUSE. It is optional by design: omitted where the disease IS the emergency.
{
  const withBecause = Object.keys(MULTIFOCAL_NEXT).filter(n => multifocalPlanFor(n).because);
  ok("at least one plan explains its urgency", withBecause.length > 0);
  for (const n of withBecause) {
    const p = multifocalPlanFor(n);
    ok(`\`${n}\` states why it carries its badge`, p.because.trim().length > 0);
    // A `because` on a routine badge would be explaining nothing.
    ok(`\`${n}\` only explains a raised badge`, p.urgency !== "routine");
  }
  const carried = combinedNextSteps(PAIR, "Metastases");
  ok("the reason reaches the card", carried.entityBecause === multifocalPlanFor("Metastases").because);
  ok("a plan without one carries an empty string, never undefined",
     combinedNextSteps(PAIR, "Multiple sclerosis").entityBecause === "");
}

// --- 12: THE SAFETY IS IN THE TIERS, NOT THE BADGE ---
// De-escalating the badge must never remove a bedside step. This is what makes ruling 10 safe, so it is
// asserted rather than assumed.
{
  const emergencyPair = [byId("left_cord_lateral"), byId("left_cord_hemi")].filter(Boolean);
  const plain = combinedNextSteps(emergencyPair);
  const deEscalated = combinedNextSteps(emergencyPair, "Multiple sclerosis");
  ok("every immediate/bedside step survives the de-escalation",
     plain.immediate.every(i => deEscalated.immediate.includes(i)));
  ok("every site first-line test survives the de-escalation",
     plain.investigations.every(i => deEscalated.investigations.includes(i)));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
