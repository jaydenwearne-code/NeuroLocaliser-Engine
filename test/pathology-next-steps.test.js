// pathology-next-steps.test.js — the PER-PATHOLOGY workup layer (spec 2026-08-18).
//
// The Next steps card was keyed by SITE, so it unioned every pathology that could produce a lesion there.
// This layer keys the confirmatory / monitoring / urgency / referral tiers by the pathology the user
// selected, while immediate + first-line stay site-level (they are what GET you the cause).
import { PATHOLOGY_NEXT, PATHOLOGY_ALIAS, pathologyPlanFor } from "../src/data/pathologyNextSteps.js";

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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
