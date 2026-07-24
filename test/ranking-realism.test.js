// ranking-realism.test.js — Sub-project A: contralateral known-negative exclusion + prevalence tiebreak.
import { prevalenceOf, COMMON, UNCOMMON, RARE } from "../src/model/prevalence.js";
import { candidateSites, differential, knownNegatives, solve } from "../src/engine/inverse.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };
const cs = candidateSites();
const site = id => cs.find(s => s.id === id);

// ---- prevalence tiers ----
ok("internal capsule is common", prevalenceOf(site("right_subcortex_internal_capsule")) === COMMON);
ok("corona radiata is common", prevalenceOf(site("right_subcortex_corona_radiata")) === COMMON);
ok("thalamus is uncommon (not common)", prevalenceOf(site("right_subcortex_thalamus")) === UNCOMMON);
ok("medial medulla (brainstem) is uncommon", prevalenceOf(site("right_medulla_medial")) === UNCOMMON);
ok("locked-in (bilateral/composite) is rare", prevalenceOf(site("locked_in")) === RARE);
ok("a named nerve is common", cs.some(s => s.level === "nerve") && prevalenceOf(cs.find(s => s.level === "nerve")) === COMMON);
ok("a root is common", cs.some(s => s.level === "root") && prevalenceOf(cs.find(s => s.level === "root")) === COMMON);

// ---- known-negative exclusion ----
const neg = knownNegatives(new Set(["weak_arm@left"]));
ok("knownNegatives of weak_arm@left includes weak_arm@right", neg.has("weak_arm@right"));
ok("knownNegatives excludes the entered side", !neg.has("weak_arm@left"));
const negBoth = knownNegatives(new Set(["weak_arm@left", "weak_arm@right"]));
ok("a finding entered on both sides yields no negative", !negBoth.has("weak_arm@left") && !negBoth.has("weak_arm@right"));

const opts = { dominantSide: "left" };
const d = differential(new Set(["weak_arm@left", "weak_leg@left"]), opts);
const has = id => d.some(c => c.site.id === id);
ok("locked-in is excluded for unilateral input", !has("locked_in"));
ok("wrong-side Brown-Séquard (right_cord_hemi) is excluded", !has("right_cord_hemi"));
ok("correct-side Brown-Séquard (left_cord_hemi) survives", has("left_cord_hemi"));

// ---- prevalence tiebreak: the lacune outranks a tying brainstem site ----
const rank = id => d.findIndex(c => c.site.id === id);
ok("internal capsule (common) outranks medial medulla (uncommon) on the tie",
   rank("right_subcortex_internal_capsule") > -1 && rank("right_medulla_medial") > -1
   && rank("right_subcortex_internal_capsule") < rank("right_medulla_medial"));

// ---- ruledOut teaching footnote ----
const r = solve(new Set(["weak_arm@left", "weak_leg@left"]), { dominantSide: "left" });
ok("solve() returns a ruledOut array", Array.isArray(r.ruledOut));
const li = r.ruledOut.find(x => x.site.id === "locked_in");
ok("locked-in is listed in ruledOut", !!li);
ok("locked-in was contradicted by a right-sided weakness known-negative",
   !!li && (li.contradictedBy === "weak_arm@right" || li.contradictedBy === "weak_leg@right"));
const rNone = solve(new Set(["weak_arm@left", "weak_arm@right"]), { dominantSide: "left" });
ok("ruledOut is empty when no finding has a known-negative", rNone.ruledOut.length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
