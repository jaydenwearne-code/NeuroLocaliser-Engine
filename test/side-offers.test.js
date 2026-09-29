// side-offers.test.js — the finding panel must never offer a side that returns nothing (accuracy round 1, A5).
// Before this, eleven real findings entered on one side returned ZERO candidates and the app suggested the
// picture "may be non-organic" — unilateral fasciculations, fatigable ptosis, LMN weakness among them.
import { offersFor, buildSideOffers, tokensForRow } from "../app/sides.js";
import { candidateSites, solve } from "../src/engine/inverse.js";
import { FINDINGS, EXPLICIT_NORMAL } from "../src/model/findings.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };

const map = buildSideOffers(candidateSites());
const dead = [];
let options = 0;
// An explicit normal (a down-going plantar) localises nothing on its own by design — it only narrows.
for (const [f, offers] of Object.entries(map)) for (const o of offers) {
  if (EXPLICIT_NORMAL[f]) continue;
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

// ---- a row tap on the default side (spec 2026-09-27 §5.4) ----
{
  const offered = f => new Set(offersFor(f).flatMap(o => o.tokens));
  const stray = [], dead = [];
  for (const f of Object.keys(FINDINGS)) for (const d of ["", "left", "right", "both", "midline"]) {
    const toks = tokensForRow(f, d);
    if (!toks) continue;
    if (toks.some(t => !offered(f).has(t))) stray.push(`${f}:${d}`);
    // The axis/flag findings (pinned above as unproduced) and the explicit normals localise nothing by design.
    else if (map[f] && !EXPLICIT_NORMAL[f] && !solve(new Set(toks), { dominantSide: "left" }).differential.length) dead.push(`${f}:${d}`);
  }
  ok("a row tap never enters a side the panel does not offer", stray.length === 0, stray.slice(0, 8).join(", "));
  ok("…and never enters a picture that returns nothing", dead.length === 0, dead.slice(0, 8).join(", "));
  ok("no default: a two-sided finding waits for its buttons", tokensForRow("weak_arm", "") === null);
  ok("default left enters the left side", JSON.stringify(tokensForRow("weak_arm", "left")) === '["weak_arm@left"]');
  ok("default both enters left and right", JSON.stringify(tokensForRow("weak_arm", "both")) === '["weak_arm@left","weak_arm@right"]');
  ok("a symmetric-only finding takes 'Both' whatever the default", JSON.stringify(tokensForRow("distal_sensory_loss", "left")) === JSON.stringify(offersFor("distal_sensory_loss")[0].tokens));
  ok("a finding with no side takes its single offer", JSON.stringify(tokensForRow("naming_impaired", "right")) === '["naming_impaired@none"]');
  ok("a midline parent passes midline to its follow-up (saddle -> anal wink)", tokensForRow("anal_wink_loss", "midline")?.every(t => t.endsWith("@midline")));
}

console.log(`\nside offers: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
