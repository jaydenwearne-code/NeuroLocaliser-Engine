// side-offers.test.js — the finding panel must never offer a side that returns nothing (accuracy round 1, A5).
// Before this, eleven real findings entered on one side returned ZERO candidates and the app suggested the
// picture "may be non-organic" — unilateral fasciculations, fatigable ptosis, LMN weakness among them.
import { offersFor, buildSideOffers } from "../app/sides.js";
import { candidateSites, solve } from "../src/engine/inverse.js";
import { FINDINGS } from "../src/model/findings.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };

const map = buildSideOffers(candidateSites());
const dead = [];
let options = 0;
for (const [f, offers] of Object.entries(map)) for (const o of offers) {
  options++;
  if (!solve(new Set(o.tokens), { dominantSide: "left" }).differential.length) dead.push(`${f}:${o.key}`);
}
ok(`every offered option returns at least one candidate (${options} options)`, dead.length === 0, dead.join(", "));

// Findings no site produces are AXES or FLAGS, handled elsewhere (pressure axis, refractive flag, functional
// flag). Pin the set so a new unproduced finding cannot slip in unnoticed.
const unproduced = Object.keys(FINDINGS).filter(f => !map[f]).sort();
ok("only the axis/flag findings are unproduced",
   JSON.stringify(unproduced) === JSON.stringify(["entrainment", "exam_inconsistency", "give_way_weakness", "hoovers_sign", "papilloedema", "va_reduced_pinhole_corrects"]),
   unproduced.join(", "));

const keys = f => offersFor(f).map(o => o.key).join(",");
ok("a symmetric-only finding offers ONLY 'both' (distal sensory loss)", keys("distal_sensory_loss") === "both", keys("distal_sensory_loss"));
ok("'both' adds the two sides together", JSON.stringify(offersFor("distal_sensory_loss")[0].tokens) === JSON.stringify(["distal_sensory_loss@left", "distal_sensory_loss@right"]));
ok("an asymmetric-site finding offers left and right (fasciculations)", keys("fasciculations") === "left,right", keys("fasciculations"));
ok("an ordinary lateralised finding offers left and right (arm weakness)", keys("weak_arm") === "left,right", keys("weak_arm"));
ok("a non-lateralised finding offers one 'none' button", keys("naming_impaired") === "none", keys("naming_impaired"));
ok("a midline finding offers midline (saddle anaesthesia)", keys("saddle_anaesthesia").includes("midline"), keys("saddle_anaesthesia"));
ok("an unknown finding degrades to a single 'none' button", keys("zz_not_a_finding") === "none");

console.log(`\nside offers: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
