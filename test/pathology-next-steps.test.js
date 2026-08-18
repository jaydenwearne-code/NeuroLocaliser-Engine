// pathology-next-steps.test.js — the PER-PATHOLOGY workup layer (spec 2026-08-18).
//
// The Next steps card was keyed by SITE, so it unioned every pathology that could produce a lesion there.
// This layer keys the confirmatory / monitoring / urgency / referral tiers by the pathology the user
// selected, while immediate + first-line stay site-level (they are what GET you the cause).
import { PATHOLOGY_NEXT, PATHOLOGY_ALIAS, pathologyPlanFor } from "../src/data/pathologyNextSteps.js";
import { CAUSES } from "../src/data/causes.js";
import { resolveUrgency, nextStepsFor, pathologyNextStepsFor } from "../src/data/nextSteps.js";
import { candidateSites } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (!c && d ? `  [${d}]` : "")); };

const site = id => ({ id, level: id.split("_")[0], part: id.split("_").slice(1).join("_") });

// --- 1: the spine resolves, with and without a bySite entry ---
{
  const p = pathologyPlanFor("Spinal epidural abscess", site("cord_transverse"));
  ok("a known pathology returns a plan", !!p);
  ok("the plan carries confirmatory steps", Array.isArray(p.confirmatory) && p.confirmatory.length > 0);
  ok("the plan carries monitoring steps", Array.isArray(p.monitoring) && p.monitoring.length > 0);
  ok("the plan carries an urgency", typeof p.urgency === "string");
  ok("an unknown pathology returns null", pathologyPlanFor("Not A Real Disease", site("cord_transverse")) === null);
}

// --- 2: interpolation — no unreplaced slots ever reach the UI ---
{
  for (const name of Object.keys(PATHOLOGY_NEXT)) {
    const p = pathologyPlanFor(name, site("cord_transverse"));
    const leaked = [...p.confirmatory, ...p.monitoring].filter(s => /\{[a-z]+\}/.test(s));
    ok(`\`${name}\` leaves no unreplaced {slot}`, leaked.length === 0, leaked.join(" | "));
  }
}

// --- 3: no orphan plans — every key names a cause that actually exists ---
// A plan keyed to a misspelled pathology never fires and never errors. This is the only thing that catches it.
{
  const realNames = new Set(Object.keys(CAUSES).flatMap(k => CAUSES[k].map(c => c.name)));
  for (const name of Object.keys(PATHOLOGY_NEXT))
    ok(`plan key \`${name}\` matches a real cause in CAUSES`, realNames.has(name));
  for (const [from, to] of Object.entries(PATHOLOGY_ALIAS)) {
    ok(`alias source \`${from}\` matches a real cause`, realNames.has(from));
    ok(`alias target \`${to}\` has a plan`, !!PATHOLOGY_NEXT[to]);
  }
}

// --- 4: urgency — curated value wins, red is a FLOOR beneath it, site is the fallback ---
{
  const sites = candidateSites();
  const causesAt = s => CAUSES[s.id] || CAUSES[`${s.level}_${s.part}`] || [];

  // The red floor: no red must-not-miss may render as routine, curated or not.
  // 377 sites carry a red cause and 76 of them badge routine today — this is the invariant that fixes them.
  let violations = [];
  for (const s of sites) for (const c of causesAt(s))
    if (c.red && resolveUrgency(s, c.name) === "routine") violations.push(`${s.id} / ${c.name}`);
  ok("no red cause resolves to routine anywhere", violations.length === 0, violations.slice(0, 3).join(" ; "));

  // The sharpest real case: BPPV badges routine, but posterior circulation stroke is its must-not-miss.
  const bppv = sites.find(s => s.id === "left_peripheral_vestibular_posterior_canal");
  ok("the BPPV site exists", !!bppv);
  ok("BPPV site itself still badges routine", nextStepsFor(bppv).urgency === "routine");
  const stroke = causesAt(bppv).find(c => /posterior circulation stroke/i.test(c.name));
  ok("its posterior-circulation-stroke cause exists", !!stroke);
  ok("selecting that cause escalates off routine", resolveUrgency(bppv, stroke.name) !== "routine");

  // No selection = unchanged.
  ok("null pathology returns the site's own urgency", resolveUrgency(bppv, null) === nextStepsFor(bppv).urgency);

  // Authored descent is permitted (owner ruling 2026-08-18): a curated NON-red pathology may resolve
  // BELOW the site's urgency. Tested with a stub plan rather than by waiting for content to exist, so the
  // rule is pinned from day one and cannot be silently reversed by a later refactor.
  {
    const host = sites.find(s => nextStepsFor(s).urgency === "emergency" && causesAt(s).some(c => !c.red));
    ok("an emergency-badged site with a non-red cause exists", !!host);
    if (host) {
      const benign = causesAt(host).find(c => !c.red);
      PATHOLOGY_NEXT[benign.name] = { name: benign.name, confirmatory: ["stub"], monitoring: ["stub"],
                                      urgency: "routine", referral: "stub", bySite: {} };
      ok("an authored routine urgency descends below an emergency site badge",
         resolveUrgency(host, benign.name) === "routine");
      delete PATHOLOGY_NEXT[benign.name];
    }

    // ...but a RED cause may never be descended below the floor, even by an authored plan.
    const redHost = sites.find(s => causesAt(s).some(c => c.red));
    const redCause = causesAt(redHost).find(c => c.red);
    PATHOLOGY_NEXT[redCause.name] = { name: redCause.name, confirmatory: ["stub"], monitoring: ["stub"],
                                      urgency: "routine", referral: "stub", bySite: {} };
    ok("the red floor overrides an authored routine urgency",
       resolveUrgency(redHost, redCause.name) !== "routine");
    delete PATHOLOGY_NEXT[redCause.name];
  }
}

// --- 5: the public API — tier split, fallback flag, and no regression when nothing is selected ---
{
  const sites = candidateSites();
  const causesAt = s => CAUSES[s.id] || CAUSES[`${s.level}_${s.part}`] || [];
  const host = sites.find(s => causesAt(s).some(c => c.name === "Spinal epidural abscess"));
  ok("a site carrying the exemplar pathology exists", !!host);

  // Nothing selected => byte-identical to today's card.
  const plain = pathologyNextStepsFor(host, null), today = nextStepsFor(host);
  for (const k of ["immediate", "investigations", "confirmatory", "monitoring", "urgency", "referral"])
    ok(`null pathology leaves \`${k}\` identical to nextStepsFor`,
       JSON.stringify(plain[k]) === JSON.stringify(today[k]));
  ok("null pathology reports no pathology", plain.pathology === null);

  // Selected + curated => lower tiers swap, upper tiers do not.
  const sel = pathologyNextStepsFor(host, "Spinal epidural abscess");
  ok("immediate stays site-level", JSON.stringify(sel.immediate) === JSON.stringify(today.immediate));
  ok("first-line stays site-level", JSON.stringify(sel.investigations) === JSON.stringify(today.investigations));
  ok("confirmatory swaps to the pathology", JSON.stringify(sel.confirmatory) !== JSON.stringify(today.confirmatory));
  ok("monitoring swaps to the pathology", JSON.stringify(sel.monitoring) !== JSON.stringify(today.monitoring));
  ok("pathologyCurated is true for an authored plan", sel.pathologyCurated === true);
  ok("the pathology name is carried", sel.pathology === "Spinal epidural abscess");

  // Selected + uncurated => site tiers, flagged so the UI can label them.
  const uncurated = causesAt(host).map(c => c.name).find(n => !PATHOLOGY_NEXT[n] && !PATHOLOGY_ALIAS[n]);
  ok("an uncurated cause exists at that site to test the fallback", !!uncurated);
  const fb = pathologyNextStepsFor(host, uncurated);
  ok("uncurated falls back to the site confirmatory",
     JSON.stringify(fb.confirmatory) === JSON.stringify(today.confirmatory));
  ok("uncurated is flagged so the UI can label it", fb.pathologyCurated === false);
  ok("uncurated still carries the name for the label", fb.pathology === uncurated);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
