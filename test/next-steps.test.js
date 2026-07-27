// next-steps.test.js — the EDUCATIONAL "what next" layer: first-line investigations, urgency, referral.
// Teaching prompts, NOT clinical directives (no doses / definitive management). Keyed like causes.js:
// curated by site id or level_part, else a derive fallback so EVERY site returns something.
import { nextStepsFor } from "../src/data/nextSteps.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

// curated: Wallenberg (lateral medulla) — a stroke; urgent, MRI/MRA, swallow safety
{ const ns = nextStepsFor({ id: "medulla_lateral", level: "medulla", part: "lateral", territory: "PICA / vertebral" });
  ok("Wallenberg urgency is emergency/urgent", ["emergency","urgent"].includes(ns.urgency));
  ok("Wallenberg investigations mention MRI / MRA / angiography", ns.investigations.some(i => /mri|mra|angiogra|ct/i.test(i)));
  ok("Wallenberg has a referral pathway", typeof ns.referral === "string" && ns.referral.length > 0);
  ok("Wallenberg is curated", ns.curated === true);
  // tiered structure: immediate (bedside swallow), confirmatory, monitoring all present
  ok("Wallenberg immediate tier includes a bedside swallow screen", ns.immediate.some(i => /swallow/i.test(i)));
  ok("Wallenberg has a confirmatory tier", Array.isArray(ns.confirmatory) && ns.confirmatory.length > 0);
  ok("Wallenberg has a monitoring tier", Array.isArray(ns.monitoring) && ns.monitoring.length > 0); }

// derived tiers: an uncurated cord lesion still gets bedside + monitoring specific to the cord
{ const ns = nextStepsFor({ id: "z_cord", level: "cord", part: "hemicord", territory: "" });
  ok("derived cord immediate tier mentions bladder / sensory level", ns.immediate.some(i => /bladder|sensory level|anal tone/i.test(i)));
  ok("derived cord monitoring tier mentions bladder / progression", ns.monitoring.some(i => /bladder|progress/i.test(i)));
  ok("every tier is an array", ["immediate","investigations","confirmatory","monitoring"].every(k => Array.isArray(ns[k]))); }

// derived tiers: NMJ/motor-unit site gets a respiratory-function bedside prompt
{ const ns = nextStepsFor({ id: "z_nmu", level: "motor_unit", part: "muscle", territory: "" });
  ok("motor-unit immediate tier prompts respiratory function", ns.immediate.some(i => /respiratory|fvc/i.test(i))); }

// curated: AION (giant-cell arteritis) — sight/life-threatening, ESR/CRP
{ const ns = nextStepsFor({ id: "skull_base_optic_aion", level: "skull_base", part: "optic_aion", territory: "" });
  ok("AION urgency is emergency", ns.urgency === "emergency");
  ok("AION investigations mention ESR / CRP", ns.investigations.some(i => /esr|crp|inflammatory/i.test(i))); }

// derive fallback: an uncurated peripheral nerve site still returns something
{ const ns = nextStepsFor({ id: "z_uncurated", level: "nerve", part: "ulnar_elbow", territory: "" });
  ok("uncurated nerve site returns investigations (derive)", ns.investigations.length > 0);
  ok("uncurated site is flagged not-curated", ns.curated === false);
  ok("derived urgency is a valid value", ["emergency","urgent","routine"].includes(ns.urgency)); }

// derive fallback: cord lesion is a time-critical emergency (cord compression)
{ const ns = nextStepsFor({ id: "z", level: "cord", part: "anterior", territory: "" });
  ok("cord lesion derive -> emergency + whole-spine MRI", ns.urgency === "emergency" && ns.investigations.some(i => /spine|cord|mri/i.test(i))); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
